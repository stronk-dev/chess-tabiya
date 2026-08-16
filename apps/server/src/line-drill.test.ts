import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { appendOpponentPly, commitMove, createRun, lineMembership } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { projectAuthoredFeedback } from "./authored-feedback.js";
import { orchestratePackMove } from "./pack-orchestrator.js";
import { PackRegistry } from "./pack-registry.js";
import { validatePackDocument } from "./pack-validation.js";

const at = "2026-08-13T09:00:00.000Z";
const pack = JSON.parse(
  readFileSync(new URL(resolvePackPath("anti-caro-advance"), import.meta.url), "utf8"),
) as DrillPackDefinition;

function newRun() {
  return createRun({
    id: "anti-caro-line",
    packId: pack.id,
    packDigest: `sha256:${"2".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: pack.start.fen,
    seed: 2,
    createdAt: at,
  });
}

function play(moves: readonly string[]) {
  let run = newRun();
  for (const [index, move] of moves.entries()) {
    const before = run;
    const committed = index % 2 === 0
      ? appendOpponentPly(run, {
          moveUci: move,
          policyModeApplied: "theory_strict",
          engine: { id: "mock", name: "Mock", version: "1", seedHonored: true },
        }, { at })
      : commitMove(run, move, { actor: "user", at });
    run = orchestratePackMove(pack, before, committed).run;
  }
  return run;
}

describe("Line Drill orchestration", () => {
  it("degrades an off-objective deviation before resolving the boundary and keeps play live", () => {
    const run = play(["c8f5", "g1f3", "e7e6", "f1e2", "c6c5", "e1g1"]);
    const active = run.nodes.find((node) => node.id === run.activeCursor.nodeId)!;
    expect(active.objectiveState).toBe("degraded");
    expect(run.events.filter((event) => event.type === "objective.state_changed")).toEqual([
      expect.objectContaining({ data: expect.objectContaining({ to: "degraded", evidenceRefs: ["theory:off-objective-deviation"] }) }),
    ]);
    expect(run.events).toContainEqual(expect.objectContaining({
      type: "checkpoint.reached",
      data: expect.objectContaining({ checkpointId: "past-the-book", nodeId: active.id }),
    }));
    const continued = appendOpponentPly(run, {
      moveUci: "b8d7",
      policyModeApplied: "human_common",
      engine: { id: "mock", name: "Mock", version: "1", seedHonored: true },
    }, { at });
    expect(continued.run.nodes).toHaveLength(run.nodes.length + 1);
  });

  it("delivers path-scoped theory verdicts only after reveal and excludes them from the withheld flag", async () => {
    const record = (await PackRegistry.fromDocuments([{ source: "anti-caro", value: pack }])).required(pack.id);
    const before = play(["c8f5", "g1f3", "e7e6"]);
    expect(projectAuthoredFeedback(record, before).items.filter((item) => item.kind === "theory_verdict")).toEqual([]);
    const revealed = play(["c8f5", "g1f3", "e7e6", "f1e2"]);
    const page = projectAuthoredFeedback(record, revealed);
    expect(page.items.filter((item) => item.kind === "theory_verdict")).toHaveLength(4);
    expect(page.items.filter((item) => item.kind === "theory_verdict").every((item) => item.revealedBy.kind === "checkpoint")).toBe(true);
    const verdictOnlyDocument = structuredClone(record.document) as DrillPackDefinition & Record<string, unknown>;
    delete (verdictOnlyDocument as unknown as Record<string, unknown>).planClasses;
    for (const checkpoint of verdictOnlyDocument.checkpoints) {
      delete (checkpoint as Record<string, unknown>).interaction;
    }
    for (const deviation of verdictOnlyDocument.deviations ?? []) {
      delete (deviation as unknown as Record<string, unknown>).note;
    }
    const stripAnnotations = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[]): void => {
      for (const node of nodes) {
        delete (node as unknown as Record<string, unknown>).annotations;
        stripAnnotations(node.children);
      }
    };
    stripAnnotations(verdictOnlyDocument.spine ?? []);
    const verdictOnlyRecord = { ...record, document: verdictOnlyDocument };
    expect(projectAuthoredFeedback(verdictOnlyRecord, revealed).hasWithheldAuthoredContent).toBe(false);
  });

  it("rejects every structural way to make follow_theory ungradable", () => {
    const { authoredBoundary: _boundary, ...withoutBoundary } = pack;
    const cases: Array<[string, DrillPackDefinition]> = [
      ["THEORY_OBJECTIVE_NEEDS_LINE_MODE", { ...pack, mode: "plan" }],
      ["THEORY_NEEDS_AUTHORED_BOUNDARY", withoutBoundary],
      ["BOUNDARY_NEEDS_PLY_HORIZON", { ...pack, authoredBoundary: { spineNodeIds: pack.authoredBoundary!.spineNodeIds! } }],
      ["THEORY_NEEDS_BOUNDARY_CHECKPOINT", { ...pack, checkpoints: pack.checkpoints.filter((checkpoint) => checkpoint.id !== "past-the-book") }],
      ["THEORY_ABSORBING_UNSUPPORTED", { ...pack, objective: { ...pack.objective, successConditions: [{ kind: "reach_checkpoint", checkpointId: "break-arrived", to: "achieved" }] } }],
    ];
    for (const [code, candidate] of cases) {
      expect(validatePackDocument(candidate).issues).toContainEqual(expect.objectContaining({ code, severity: "error" }));
    }
  });

  it("classifies a root-anchored first-move deviation", () => {
    const document = structuredClone(pack) as DrillPackDefinition;
    (document as any).deviations = [...(document.deviations ?? []), { at: { atStart: true }, moveUci: "h7h6", class: "interesting_deviation", offObjective: true, note: "Root alternative fixture." }];
    let run = createRun({ id: "root-deviation", packId: document.id, packDigest: `sha256:${"3".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, startFen: document.start.fen, seed: 3, createdAt: at });
    run = appendOpponentPly(run, { moveUci: "h7h6", policyModeApplied: "theory_strict", engine: { id: "mock", name: "Mock", version: "1", seedHonored: true } }, { at }).run;
    expect(lineMembership(document, run, run.activeCursor.nodeId).at(-1)).toMatchObject({ verdict: "classified_deviation", deviationClass: "interesting_deviation" });
  });
});
