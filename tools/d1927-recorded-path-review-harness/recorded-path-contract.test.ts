// DISPOSABLE product/buildability harness — D1927 onward. Not production code.
import { readFileSync } from "node:fs";

import {
  branchPath,
  commitMove,
  createRun,
  declareRunRecordEvidence,
  pawnContactTimingSemanticEvent,
  pawnContactTimingSequence,
  PRIMARY_EVIDENCE_MANIFEST,
  type DrillRun,
  type RecordedMoveAnchor,
} from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

const at = "2026-08-27T00:00:00.000Z";

function runWithTwoMoves(): DrillRun {
  let run = createRun({
    id: "recorded-path-review",
    packId: "fixture",
    packDigest: `sha256:${"a".repeat(64)}`,
    startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt: at,
  });
  run = commitMove(run, "e2e4", { at }).run;
  run = commitMove(run, "e7e5", { at }).run;
  return run;
}

function anchors(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let run = createRun({
    id: "semantic-anchor-review",
    packId: "fixture",
    packDigest: `sha256:${"b".repeat(64)}`,
    startFen: fen,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 2,
    createdAt: at,
  });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  const path = branchPath(run, run.activeCursor.branchId);
  return Object.freeze(path.slice(1).map((node, index) => Object.freeze({
    beforeNodeId: path[index]!.id,
    afterNodeId: node.id,
    beforeFen: path[index]!.fen,
    moveUci: node.moveUci!,
    afterFen: node.fen,
  })));
}

describe("recorded-semantic-path draft against live authorities", () => {
  it("shows branchPath silently truncates a missing-parent chain", () => {
    const run = runWithTwoMoves();
    const leaf = run.nodes.at(-1)!;
    const corrupted = Object.freeze({
      ...run,
      nodes: Object.freeze(run.nodes.map((node) => node.id === leaf.id
        ? Object.freeze({ ...node, parentId: "missing-parent" })
        : node)),
    });
    expect(branchPath(corrupted, run.activeCursor.branchId).map((node) => node.id)).toEqual([leaf.id]);
  });

  it("shows branchPath selects a non-leaf when node-array order changes", () => {
    const run = runWithTwoMoves();
    const [root, first, leaf] = run.nodes;
    const reordered = Object.freeze({ ...run, nodes: Object.freeze([root!, leaf!, first!]) });
    expect(branchPath(reordered, run.activeCursor.branchId).map((node) => node.id)).toEqual([root!.id, first!.id]);
    expect(branchPath(reordered, run.activeCursor.branchId).some((node) => node.id === leaf!.id)).toBe(false);
  });

  it("seals the same semantic event with unrelated recorded-move evidence", () => {
    const path = anchors("4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", ["e2e4", "e8f7"]);
    const payload = pawnContactTimingSequence(path)!;
    const matching = path.map((anchor, offset) => declareRunRecordEvidence("move", {
      context: { beforeNodeId: anchor.beforeNodeId, afterNodeId: anchor.afterNodeId },
      offset,
      moveSan: anchor.moveUci,
    }));
    const unrelated = path.map((_, offset) => declareRunRecordEvidence("move", {
      context: { runId: "another-run", beforeNodeId: "x", afterNodeId: "y" },
      offset: offset + 99,
      moveSan: "Qa9",
    }));
    const expected = pawnContactTimingSemanticEvent(payload, matching);
    const forged = pawnContactTimingSemanticEvent(payload, unrelated);
    expect(forged.id).toBe(expected.id);
    expect(forged.derivationInputs.map((value) => value.payload)).toEqual(unrelated.map((value) => value.payload));
  });

  it("finds no convention-registry digest in the proposed result identity", () => {
    const rfc = readFileSync("rfc/recorded-semantic-path.md", "utf8");
    const digestMaterial = rfc.match(/The result digest[\s\S]*?```ts\n([\s\S]*?)```/u)?.[1] ?? "";
    expect(digestMaterial).toContain("manifestDigest");
    expect(digestMaterial).not.toMatch(/conventionDigest|registryDigest/u);
    expect(rfc).toMatch(/current\s+manifest\/convention heads/u);
  });

  it("derives the eleven-family population from exact run-record derivation membership", () => {
    const pathFamilies = PRIMARY_EVIDENCE_MANIFEST.semanticEvents.filter((value) => {
      const members = value.derivationAnyOf ?? (value.derivationInputs === undefined ? [] : [value.derivationInputs]);
      return members.some((member) => member.some((input) => input.id === "run.record.move" && input.version === 1));
    });
    expect(pathFamilies.map((value) => `${value.projection.id}@${value.projection.version}`).sort()).toEqual([
      "derived.exchange.trade_completed@1",
      "derived.pawn.sequence.contact_timing@1",
      "derived.pawn.sequence.harassment_pressure@1",
      "derived.tactic.attraction_observed@1",
      "derived.tactic.check_zwischenzug_observed@1",
      "derived.tactic.deflection_observed@1",
      "derived.tactic.interference_observed@1",
      "derived.tactic.line_blocker_clearance_observed@1",
      "derived.tactic.overload_exploitation_observed@1",
      "derived.tactic.sequence.defender_consequence@1",
      "derived.tactic.square_clearance_observed@1",
    ]);
  });
});
