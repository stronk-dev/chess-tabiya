import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { readFileSync } from "node:fs";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { reachCheckpoint, rewind } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";
import { projectAuthoredFeedback } from "./authored-feedback.js";
import { PackRegistry } from "./pack-registry.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { at, policyConfig, registered, newRun, play } from "./authored-feedback-test-support.js";

const packA = JSON.parse(
  readFileSync(
    new URL(resolvePackPath("anti-caro-advance"), import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;

describe("authored feedback projection", { timeout: 5_000 }, () => {
  it("reveals Pack A's actual main path without sibling or later-path leakage", async () => {
    const pack = await registered(packA);
    let run = play(newRun(pack, "main-path"), ["c8f5", "g1f3", "e7e6", "f1e2"]);
    run = reachCheckpoint(run, "plan-commitment", at).run;

    const page = projectAuthoredFeedback(pack, run);
    expect(
      page.items
        .filter((item) => item.kind === "annotation")
        .map((item) => item.anchor.spineNodeId),
    ).toEqual(["be2", "bf5-main", "nf3"]);
    expect(
      page.items
        .filter((item) => item.kind === "deviation")
        .map((item) => item.anchor.moveUci),
    ).toEqual(["f1d3", "b1c3"]);
    expect(page.items.every((item) =>
      item.revealedBy.kind === "checkpoint" &&
      item.revealedBy.checkpointId === "plan-commitment"))
      .toBe(true);
    expect(JSON.stringify(page)).not.toContain("c5-break");
    expect(JSON.stringify(page)).not.toContain("be3-hold");
    expect(JSON.stringify(page)).not.toContain("h4-tal");
    expect(JSON.stringify(page)).not.toContain("h5-reply");
    expect(JSON.stringify(page)).not.toContain("c5-immediate");
    expect(JSON.stringify(page)).not.toContain("dxc5-grab");
  });

  it("attributes the shared Pack A prefix to the Tal checkpoint on that sibling path", async () => {
    const pack = await registered(packA);
    let run = play(newRun(pack, "tal-path"), ["c8f5", "h2h4", "h7h5"]);
    run = reachCheckpoint(run, "tal-commitment", at).run;

    const annotation = projectAuthoredFeedback(pack, run).items.find(
      (item) => item.id === "bf5-main#0",
    );
    expect(annotation).toMatchObject({
      revealedBy: { kind: "checkpoint", checkpointId: "tal-commitment" },
    });
    expect(JSON.stringify(projectAuthoredFeedback(pack, run))).not.toContain("be2#0");
  });

  it("keeps Pack A's withheld flag honest while supported sibling prose remains unrevealed", async () => {
    const pack = await registered(packA);
    let run = newRun(pack, "all-deliverable");
    const rootId = run.activeCursor.nodeId;
    run = play(run, ["c8f5", "g1f3", "e7e6", "f1e2"]);
    run = reachCheckpoint(run, "plan-commitment", at).run;
    run = play(run, ["c6c5"]);
    run = reachCheckpoint(run, "break-arrived", at).run;
    run = rewind(run, rootId, at).run;
    run = play(run, ["c8f5", "h2h4", "h7h5"]);
    run = reachCheckpoint(run, "tal-commitment", at).run;

    const page = projectAuthoredFeedback(pack, run);
    expect(page.hasWithheldAuthoredContent).toBe(true);
    expect(JSON.stringify(page)).not.toContain("chain-base");
    expect(JSON.stringify(page)).not.toContain("tal-tempo");
  });

  it("keeps first disclosure monotonic after rewind and serves it over REST", async () => {
    const registry = await PackRegistry.fromDocuments([
      { source: "pack-a", value: withDerivedRequires(packA) },
    ]);
    const pack = registry.required(packA.id);
    const storage = new SQLiteRunStorage();
    try {
      const service = new RunService(storage, { packRegistry: registry });
      await service.create(
        { id: "rest-reveal", session: { kind: "pack", packId: packA.id }, policyConfig, seed: 23, createdAt: at },
        "writer-a",
      );
      let run = play(storage.read("rest-reveal")!.run, [
        "c8f5",
        "g1f3",
        "e7e6",
        "f1e2",
      ]);
      run = reachCheckpoint(run, "plan-commitment", at).run;
      const firstAttribution = projectAuthoredFeedback(pack, run).items[0]!.revealedBy;
      run = rewind(run, run.nodes[0]!.id, at).run;
      storage.save(run, "writer-a");

      const response = await createRestHandler(service)(
        new Request("http://server.test/runs/rest-reveal/authored-feedback"),
      );
      expect(response.status).toBe(200);
      const page = (await response.json()) as ReturnType<typeof projectAuthoredFeedback>;
      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items[0]!.revealedBy).toEqual(firstAttribution);
    } finally {
      storage.close();
    }
  });

  // RFC acceptance criterion 8. The sort was implemented correctly but nothing
  // pinned it, so a refactor could silently reorder the response. Asserted as
  // the invariant rather than a fixed list so it survives pack edits.

  it("orders items by reveal sequence, then kind, then id", async () => {
    const pack = await registered(packA);
    let run = play(newRun(pack, "ordering"), ["c8f5", "g1f3", "e7e6", "f1e2"]);
    run = reachCheckpoint(run, "plan-commitment", at).run;
    run = play(run, ["c6c5"]);
    run = reachCheckpoint(run, "break-arrived", at).run;

    const kindOrder = { annotation: 0, deviation: 1, plan_class: 2, theory_verdict: 3, claim: 4 } as const;
    const { items } = projectAuthoredFeedback(pack, run);

    // Non-vacuous: both reveal events and all four kinds must be present.
    expect(new Set(items.map((item) => item.revealedBy.eventSeq)).size).toBe(2);
    expect(new Set(items.map((item) => item.kind))).toEqual(
      new Set(["annotation", "deviation", "plan_class", "theory_verdict"]),
    );

    for (const [index, item] of items.entries()) {
      if (index === 0) continue;
      const previous = items[index - 1]!;
      const ordered =
        previous.revealedBy.eventSeq < item.revealedBy.eventSeq ||
        (previous.revealedBy.eventSeq === item.revealedBy.eventSeq &&
          (kindOrder[previous.kind] < kindOrder[item.kind] ||
            (previous.kind === item.kind && previous.id.localeCompare(item.id) < 0)));
      expect(ordered, `${previous.id} must precede ${item.id}`).toBe(true);
    }
  });
});
