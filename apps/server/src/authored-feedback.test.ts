import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  commitMove,
  createRun,
  reachCheckpoint,
  rewind,
  type DrillRun,
  type PolicyConfig,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  projectAuthoredFeedback,
  revealedAuthoredItems,
} from "./authored-feedback.js";
import { PackRegistry, type PackRecord } from "./pack-registry.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-08-12T12:30:00.000Z";
const policyConfig: PolicyConfig = {
  seedMode: "fixed",
  locus: { executedAt: "server", engineIds: [], modelIds: [] },
};
const packA = JSON.parse(
  readFileSync(
    new URL("../../../content/drafts/anti-caro-advance.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;

async function registered(document: DrillPackDefinition): Promise<PackRecord> {
  return (
    await PackRegistry.fromDocuments([{ source: "authored-feedback-test", value: document }])
  ).required(document.id);
}

function newRun(pack: PackRecord, id: string): DrillRun {
  return createRun({
    id,
    packId: pack.document.id,
    packDigest: pack.digest,
    policyConfig,
    startFen: pack.document.start.fen,
    seed: 23,
    createdAt: at,
  });
}

function play(run: DrillRun, moves: readonly string[]): DrillRun {
  for (const move of moves) run = commitMove(run, move, { at }).run;
  return run;
}

function smallPack(overrides: Record<string, unknown> = {}): DrillPackDefinition {
  return {
    id: "authored-small",
    version: "0.1.0",
    title: "Authored feedback test",
    mode: "plan",
    phase: "opening",
    start: {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      side: "white",
    },
    objective: { type: "preserve_plan_window", summary: "Test" },
    spine: [
      {
        id: "e4",
        moveUci: "e2e4",
        moveSan: "e4",
        annotations: ["King pawn"],
        children: [
          {
            id: "e5",
            moveUci: "e7e5",
            moveSan: "e5",
            annotations: ["Open game"],
            children: [],
          },
        ],
      },
    ],
    checkpoints: [{ id: "reveal", trigger: { atSpineNode: "e4" } }],
    opponentPolicy: { mode: "human_common", seedMode: "fixed" },
    feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "draft", sources: [], reviewers: [] },
    ...overrides,
  } as DrillPackDefinition;
}

describe("authored feedback projection", () => {
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
    expect(page.items.every((item) => item.revealedBy.checkpointId === "plan-commitment"))
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
      revealedBy: { checkpointId: "tal-commitment" },
    });
    expect(JSON.stringify(projectAuthoredFeedback(pack, run))).not.toContain("be2#0");
  });

  it("uses checkpoint occurrence sequence to distinguish repeated ids on branches", async () => {
    const document = smallPack({
      spine: [
        {
          id: "e4",
          moveUci: "e2e4",
          moveSan: "e4",
          annotations: ["First branch"],
          children: [],
        },
        {
          id: "d4",
          moveUci: "d2d4",
          moveSan: "d4",
          annotations: ["Second branch"],
          children: [],
        },
      ],
      checkpoints: [{ id: "choice", trigger: { atPly: 1 } }],
    });
    const pack = await registered(document);
    let run = newRun(pack, "repeated-checkpoint");
    const rootId = run.activeCursor.nodeId;
    run = play(run, ["e2e4"]);
    run = reachCheckpoint(run, "choice", at).run;
    const firstSeq = run.events.at(-1)!.seq;
    run = rewind(run, rootId, at).run;
    run = play(run, ["d2d4"]);
    run = reachCheckpoint(run, "choice", at).run;
    const secondSeq = run.events.at(-1)!.seq;

    const items = projectAuthoredFeedback(pack, run).items;
    expect(items.find((item) => item.id === "e4#0")?.revealedBy).toEqual({
      checkpointId: "choice",
      eventSeq: firstSeq,
    });
    expect(items.find((item) => item.id === "d4#0")?.revealedBy).toEqual({
      checkpointId: "choice",
      eventSeq: secondSeq,
    });
  });

  it("reveals the whole root-to-end path only when a segment completes", async () => {
    const pack = await registered(
      smallPack({
        feedbackPolicy: "segment_end",
        checkpoints: [
          { id: "start", trigger: { atSpineNode: "e4" } },
          { id: "finish", trigger: { atSpineNode: "e5" } },
        ],
      }),
    );
    let run = play(newRun(pack, "segment"), ["e2e4"]);
    run = reachCheckpoint(run, "start", at).run;
    expect(projectAuthoredFeedback(pack, run).items).toEqual([]);
    run = play(run, ["e7e5"]);
    run = reachCheckpoint(run, "finish", at).run;
    const finish = run.events.find(
      (event) => event.type === "checkpoint.reached" && event.data.checkpointId === "finish",
    )!;

    expect(projectAuthoredFeedback(pack, run).items).toEqual([
      expect.objectContaining({ id: "e4#0", revealedBy: { checkpointId: "finish", eventSeq: finish.seq } }),
      expect.objectContaining({ id: "e5#0", revealedBy: { checkpointId: "finish", eventSeq: finish.seq } }),
    ]);
  });

  it("extracts only deliverable prose and ignores claims, concepts, and note-less deviations", async () => {
    const pack = await registered(
      smallPack({
        concepts: ["not-prose"],
        planClasses: [{ id: "choice", label: "Choose me" }],
        checkpoints: [
          {
            id: "reveal",
            trigger: { atSpineNode: "e4" },
            interaction: { type: "intent_capture", planClassIds: ["choice"] },
          },
        ],
        deviations: [
          { at: { spineNodeId: "e4" }, moveUci: "d2d4", class: "interesting_deviation" },
        ],
        feedbackClaims: [
          { id: "unanchored", text: "Never deliver", evidenceTypes: ["hypothesis"] },
        ],
      }),
    );
    let run = play(newRun(pack, "extraction"), ["e2e4"]);
    run = reachCheckpoint(run, "reveal", at).run;

    const page = projectAuthoredFeedback(pack, run);
    expect(page.items.map((item) => item.kind)).toEqual(["annotation", "plan_class"]);
    expect(page.items.at(-1)).toMatchObject({ label: "Choose me" });
    expect(page.items.at(-1)).not.toHaveProperty("description");
    expect(page.hasWithheldAuthoredContent).toBe(false);
    expect(revealedAuthoredItems(pack, run)).toEqual(
      new Map(page.items.map((item) => [item.id, item.revealedBy])),
    );
  });

  it("clears Pack A's withheld flag after every deliverable path despite undelivered claims", async () => {
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
    expect(page.hasWithheldAuthoredContent).toBe(false);
    expect(JSON.stringify(page)).not.toContain("chain-base");
    expect(JSON.stringify(page)).not.toContain("tal-tempo");
  });

  it("keeps first disclosure monotonic after rewind and serves it over REST", async () => {
    const registry = await PackRegistry.fromDocuments([
      { source: "pack-a", value: packA },
    ]);
    const pack = registry.required(packA.id);
    const storage = new SQLiteRunStorage();
    try {
      const service = new RunService(storage, { packRegistry: registry });
      service.create(
        { id: "rest-reveal", packId: packA.id, policyConfig, seed: 23, createdAt: at },
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
});
