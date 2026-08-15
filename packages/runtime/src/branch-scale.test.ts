import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { branchDecidedness, branchPaths, collapsedBranchIds, commitMove, createRun, rewind } from "./index.js";

const at = "2026-08-15T20:00:00.000Z";
const moves = ["a2a3", "b2b3", "c2c3", "d2d3", "e2e3", "f2f3", "g2g3", "h2h3", "b1a3"] as const;

function manyBranches() {
  let run = createRun({ id: "branch-scale", packId: "scale", packDigest: `sha256:${"a".repeat(64)}`, startFen: INITIAL_FEN, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const root = run.activeCursor.nodeId;
  for (const move of moves) {
    if (run.activeCursor.nodeId !== root) run = rewind(run, root, at).run;
    run = commitMove(run, move, { at }).run;
  }
  return run;
}

describe("branch-set scale", () => {
  it("builds every path from one shared node index", () => {
    const run = manyBranches(), paths = branchPaths(run);
    expect(paths.size).toBe(9);
    for (const branch of run.branches) expect(paths.get(branch.id)?.at(-1)?.branchId).toBe(branch.id);
  });

  it("collapses only objective shortfalls, never over-achievement or uncertainty", () => {
    const run = manyBranches(), ids = run.branches.map((branch) => branch.id);
    const tablebase = Object.fromEntries(ids.map((id, index) => [id, { category: index === 0 ? "win" as const : index === 1 ? "loss" as const : index === 2 ? "unknown" as const : "draw" as const, pieces: 7, sourceId: "syzygy" }]));
    const hold = branchDecidedness(run, { objective: "hold", tablebase });
    expect(hold[ids[0]!] ).toMatchObject({ state: "decided", admitted: false, shortfall: false });
    expect(hold[ids[1]!] ).toMatchObject({ state: "decided", admitted: false, shortfall: true });
    expect(hold[ids[2]!] ).toEqual({ state: "undecided", reason: "uncertain_category" });
    expect([...collapsedBranchIds(run, hold, new Set(), new Set())]).toEqual([ids[1]]);
    const save = branchDecidedness(run, { objective: "save", tablebase });
    expect([...collapsedBranchIds(run, save, new Set(), new Set())]).toEqual([]);
  });

  it("never collapses at or below the eight-column floor", () => {
    const run = manyBranches();
    const short = Object.freeze({ ...run, branches: run.branches.slice(0, 8) });
    const facts = branchDecidedness(short, { objective: "win", tablebase: Object.fromEntries(short.branches.map((branch) => [branch.id, { category: "loss" as const, pieces: 7, sourceId: "syzygy" }])) });
    expect([...collapsedBranchIds(short, facts, new Set(), new Set())]).toEqual([]);
  });

  it("does not invent a tablebase objective for an unauthored run", () => {
    const run = manyBranches(), id = run.branches[0]!.id;
    expect(branchDecidedness(run, { tablebase: { [id]: { category: "loss", pieces: 7, sourceId: "syzygy" } } })[id]).toMatchObject({ state: "decided", admitted: false, shortfall: false });
  });
});
