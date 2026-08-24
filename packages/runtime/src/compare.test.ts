import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import {
  BranchQueryError,
  attachEvidence,
  appendOpponentPly,
  branchPath,
  commitMove,
  compareBranches,
  comparisonEngineTrajectory,
  comparisonNarrative,
  comparisonStrips,
  consumeComparisonEngineTrajectory,
  consumeComparisonStripEvidence,
  createRun,
  fork,
  reachCheckpoint,
  rewind,
  observationIdentity,
  pivotalMarkers,
  renderPivotalMarker,
  renderStructuralObservationChange,
  transitionObjective,
  type DrillRun,
  type OpponentSelection,
} from "./index.js";

if (false) {
  // @ts-expect-error comparison trajectory consumes only a compiled evidence view.
  consumeComparisonEngineTrajectory([]);
  // @ts-expect-error comparison strips consume only a compiled evidence view.
  consumeComparisonStripEvidence([]);
}

const at = "2026-08-12T12:00:00.000Z";
const opponent = (moveUci: string): OpponentSelection => ({
  moveUci,
  policyModeApplied: "human_common",
  engine: {
    id: "mock-opponent",
    name: "Mock opponent",
    version: "1",
    seedHonored: true,
  },
});

function branchedRun(): DrillRun {
  let run = createRun({
    id: "compare-run",
    packId: "compare-pack",
    packDigest: `sha256:${"e".repeat(64)}`,
    policyConfig: {
      seedMode: "per_branch",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: INITIAL_FEN,
    seed: 20,
    createdAt: at,
  });
  run = commitMove(run, "e2e4", { at }).run;
  const forkNodeId = run.activeCursor.nodeId;
  run = appendOpponentPly(run, opponent("e7e5"), { at }).run;
  run = commitMove(run, "g1f3", { at }).run;
  run = appendOpponentPly(run, opponent("b8c6"), { at }).run;
  run = attachEvidence(
    run,
    run.activeCursor.nodeId,
    ["engine:main-eval"],
    {
      kind: "eval",
      source: "engine_validated",
      values: { centipawns: 31 },
    },
    at,
  ).run;
  run = reachCheckpoint(run, "main-result", at).run;
  run = transitionObjective(run, "preserved", ["evidence:main"], at).run;
  run = rewind(run, forkNodeId, at).run;
  run = appendOpponentPly(run, opponent("c7c5"), { at }).run;
  run = commitMove(run, "g1f3", { at }).run;
  run = attachEvidence(
    run,
    run.activeCursor.nodeId,
    ["engine:alternative-eval"],
    {
      kind: "eval",
      source: "engine_validated",
      values: { mateIn: -3 },
    },
    at,
  ).run;
  run = reachCheckpoint(run, "alternative-result", at).run;
  return transitionObjective(run, "degraded", ["evidence:alternative"], at).run;
}

describe("branch comparison", () => {
  it("renders retained structural operands instead of raw detector ids", () => {
    expect(renderStructuralObservationChange({ kind: "isolated_pawn", color: "white", file: "d", squares: [] })).toBe("White isolated pawn appeared on the d-file.");
    expect(renderStructuralObservationChange({ kind: "piece_reach_count", color: "black", role: "knight", squares: ["f6"], count: 5 })).toBe("Black knight piece reach count appeared on f6; count 5.");
  });
  it("uses one common axis and groups a shared prefix across three branches", () => {
    let run = branchedRun();
    run = rewind(run, run.nodes[0]!.id, at).run;
    run = commitMove(run, "d2d4", { at }).run;
    const ids = run.branches.map((branch) => branch.id);
    const result = compareBranches(run, ids);
    expect(result.forkNodeId).toBe(run.nodes[0]!.id);
    expect(result.columns).toHaveLength(3);
    expect(result.rows[0]!.groups).toEqual([[ids[0], ids[1]], [ids[2]]]);
    for (const row of result.rows) {
      expect(row.groups.flat()).toEqual(Object.keys(row.nodes));
      for (const group of row.groups) {
        expect(new Set(group.map((id) => row.nodes[id]!.id)).size).toBe(1);
      }
    }
  });

  it("rejects duplicate and singleton compare sets", () => {
    const run = branchedRun();
    expect(() => compareBranches(run, [run.branches[0]!.id])).toThrow(/two branches/);
    expect(() => compareBranches(run, [run.branches[0]!.id, run.branches[0]!.id])).toThrow(/distinct/);
  });

  it("aligns consequences from the last common fork and marks an absent side", () => {
    const run = branchedRun();
    const [main, alternative] = run.branches;
    const result = compareBranches(run, [main!.id, alternative!.id]);

    expect(result.forkNodeId).toBe(run.nodes[1]!.id);
    expect(result.rows.map((row) => [row.nodes[main!.id]?.moveUci, row.nodes[alternative!.id]?.moveUci])).toEqual([
      ["e7e5", "c7c5"],
      ["g1f3", "g1f3"],
      ["b8c6", undefined],
    ]);
    expect(result.rows[2]!.nodes).not.toHaveProperty(alternative!.id);
    expect(result.rows.map((row) => row.plyOffset)).toEqual([1, 2, 3]);
  });

  it("returns objective timelines and checkpoint hits for each branch path", () => {
    const run = branchedRun();
    const [a, b] = run.branches;
    const result = compareBranches(run, [a!.id, b!.id]);

    expect(result.objectiveTimelines[a!.id]).toEqual([
      expect.objectContaining({
        plyOffset: 3,
        from: "active",
        to: "preserved",
        evidenceRefs: ["evidence:main"],
      }),
    ]);
    expect(result.objectiveTimelines[b!.id]).toEqual([
      expect.objectContaining({
        plyOffset: 2,
        from: "active",
        to: "degraded",
        evidenceRefs: ["evidence:alternative"],
      }),
    ]);
    expect(result.checkpointHits[a!.id]).toEqual([
      expect.objectContaining({ checkpointId: "main-result", plyOffset: 3 }),
    ]);
    expect(result.checkpointHits[b!.id]).toEqual([
      expect.objectContaining({ checkpointId: "alternative-result", plyOffset: 2 }),
    ]);
  });

  it("derives per-path recorded eval evidence with cp and mate scores", () => {
    const run = branchedRun();
    const [a, b] = run.branches;
    const result = compareBranches(run, [a!.id, b!.id]);

    expect(result.evidence[a!.id]).toEqual([
      {
        nodeId: run.nodes[4]!.id,
        plyOffset: 3,
        evidenceRefs: ["engine:main-eval"],
        kind: "eval",
        source: "engine_validated",
        score: { kind: "cp", value: 31 },
      },
    ]);
    expect(result.evidence[b!.id]).toEqual([
      {
        nodeId: run.nodes[6]!.id,
        plyOffset: 2,
        evidenceRefs: ["engine:alternative-eval"],
        kind: "eval",
        source: "engine_validated",
        score: { kind: "mate", movesTo: -3 },
      },
    ]);
  });

  it("rejects unknown branches instead of comparing unrelated data", () => {
    const run = branchedRun();
    expect(() => compareBranches(run, [run.branches[0]!.id, "missing"])).toThrow(
      BranchQueryError,
    );
  });

  it("derives deterministic fact-only strips and narrative from persisted comparison data", () => {
    const run = branchedRun();
    const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
    const strips = comparisonStrips(run, comparison);
    expect(Object.values(strips).map((strip) => strip.evalTrail.length)).toEqual([1, 1]);
    expect(Object.values(strips).flatMap((strip) => strip.timing).length).toBeGreaterThan(0);
    const first = comparisonNarrative(run, comparison, strips);
    expect(comparisonNarrative(run, comparison, strips)).toEqual(first);
    expect(JSON.stringify(first)).not.toMatch(/\b(better|worse|should|best)\b/i);
  });

  it("filters observations shared anywhere past the fork and preserves their parameters", () => {
    const run = branchedRun();
    const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
    const strips = comparisonStrips(run, comparison);
    const paths = comparison.columns.map((column) => {
      const entries = strips[column.branchId]!.structure;
      expect(entries.every((entry) => entry.observation !== undefined)).toBe(true);
      return new Set(entries.map((entry) => observationIdentity(entry.observation!)));
    });
    for (const entry of paths[0]!) expect(paths.slice(1).every((set) => set.has(entry))).toBe(false);
  });

  it("names CR3's singleton and identical-path degenerate projections", () => {
    let run = createRun({
      id: "compare-degenerate",
      startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      packId: "fixture",
      packDigest: `sha256:${"a".repeat(64)}`,
      policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 20,
      createdAt: at,
    });
    const root = run.activeCursor.nodeId;
    run = commitMove(run, "e2e4", { at }).run;
    const first = run.activeCursor.branchId;
    run = rewind(run, root, at).run;
    run = fork(run, root, { at }).run;
    run = commitMove(run, "e2e4", { at }).run;
    const second = run.activeCursor.branchId;
    const identical = compareBranches(run, [first, second]);
    expect(Object.values(comparisonStrips(run, identical)).flatMap((strip) => strip.structure)).toEqual([]);

    const singleton = { ...identical, columns: identical.columns.slice(0, 1) };
    expect(Object.values(comparisonStrips(run, singleton)).flatMap((strip) => strip.structure).length).toBeGreaterThan(0);
  });

  it("keeps pivotal timing byte-identical while filtering only the structure strip", () => {
    let run = createRun({
      id: "compare-timing-noninterference",
      startFen: INITIAL_FEN,
      packId: "fixture",
      packDigest: `sha256:${"b".repeat(64)}`,
      policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 21,
      createdAt: at,
    });
    const root = run.activeCursor.nodeId;
    for (const move of ["e2e4", "a7a6", "e4e5", "d7d5", "g1f3", "b8c6", "f1c4", "g8f6", "e1g1"]) {
      run = commitMove(run, move, { at }).run;
    }
    run = rewind(run, root, at).run;
    run = fork(run, root, { at }).run;
    for (const move of ["e2e4", "d7d5", "e4d5"]) run = commitMove(run, move, { at }).run;

    const comparison = compareBranches(run, run.branches.map((branch) => branch.id));
    const strips = comparisonStrips(run, comparison);
    const castlingRoute = Object.values(strips).flatMap((strip) => strip.routes).find((route) => route.squares.includes("e1"));
    expect(castlingRoute?.squares).toContain("g1");
    expect(castlingRoute?.squares).not.toContain("h1");
    const forkNode = run.nodes.find((node) => node.id === comparison.forkNodeId)!;
    for (const column of comparison.columns) {
      const pathIds = new Set(branchPath(run, column.branchId).filter((node) => node.ply >= forkNode.ply).map((node) => node.id));
      const before = pivotalMarkers(run, column.branchId)
        .filter((marker) => pathIds.has(marker.nodeId))
        .map((marker) => ({
          plyOffset: run.nodes.find((node) => node.id === marker.nodeId)!.ply - forkNode.ply,
          nodeId: marker.nodeId,
          sentence: renderPivotalMarker(marker).join(" "),
          attribution: "Tabiya product convention",
        }));
      const after = strips[column.branchId]!.timing.filter((entry) => entry.attribution === "Tabiya product convention");
      expect(after).toEqual(before);
    }
    const sentences = Object.values(strips).flatMap((strip) => strip.timing.map((entry) => entry.sentence));
    expect(sentences).toContain("white castled.");
    expect(sentences).toContain("white created or resolved pawn contact.");
  });
});
