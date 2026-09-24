// rfc/review-map.md — the remainder: the eval graph (§6, [[D880]]), the Compare handoff (§4) and the
// explicit Analyze action (§7, O7.3). Each test names the wrong implementation it would catch.

import { describe, expect, it } from "vitest";

import { branchPath } from "./branch-path.js";
import { attachEvidence } from "./evidence.js";
import { winPercentFromCp } from "./grade.js";
import { reviewAnalysis } from "./review-analysis.js";
import { REVIEW_PROVIDER_LINE_KEY, reviewDeliveryEvidencePayload } from "./review-evidence.js";
import { REVIEW_COMPARE_LIMIT, openRetryEntry, reviewMapProjection, type ReviewMapProjection } from "./review-map.js";
import { reviewText } from "./review-map-templates.js";
import { commitMove, fork, rewind } from "./runtime.js";
import { storyMomentsForRun } from "./story.js";
import { attachDelivery, evaluationDelivery, lineDelivery } from "./testing/review-evidence-fixture.js";
import { REVIEW_FIXTURE_AT, fixtureCentipawns, reviewFixtureRun } from "./testing/review-map-fixture.js";
import type { DrillRun } from "./types.js";
import { judgementWordsOutsideGrounding } from "./voice.js";

function projectionOf(run: DrillRun, branchId = run.branches[0]!.id): ReviewMapProjection {
  return reviewMapProjection({ run, branchId, story: storyMomentsForRun(run, branchId, { recordedResult: "1-0" }), context: "imported_analysis", viewer: { role: "learner", session: "imported" } });
}

/** A retry exactly as the Review Map performs it: rewind to the entry, fork `story-reentry`, optionally play. */
function retry(run: DrillRun, entryNodeId: string, moves: readonly string[] = []): DrillRun {
  let next = rewind(run, entryNodeId, REVIEW_FIXTURE_AT).run;
  next = fork(next, entryNodeId, { label: "story-reentry", at: REVIEW_FIXTURE_AT }).run;
  for (const uci of moves) next = commitMove(next, uci, { actor: "user", at: REVIEW_FIXTURE_AT }).run;
  return next;
}

/** Puts the cursor back on the reviewed line (the learner left the retry). */
function backToReviewed(run: DrillRun): DrillRun {
  const main = run.branches[0]!.id;
  return rewind(run, branchPath(run, main).at(-1)!.id, REVIEW_FIXTURE_AT, undefined, main).run;
}

describe("eval graph (§6, D880)", () => {
  it("draws one point per ply from the recorded White-perspective evaluation, as win-points for the reviewed side", () => {
    const run = reviewFixtureRun({ id: "graph-white" });
    const graph = projectionOf(run).evalGraph;
    const rows = projectionOf(run).rows;
    expect(graph.kind).toBe("complete");
    expect(graph.side).toBe("white");
    expect(graph.points.map((point) => point.nodeId)).toEqual(rows.map((row) => row.nodeId));
    expect(graph.gaps).toEqual([]);
    graph.points.forEach((point, index) => {
      if (point.kind !== "evaluated") throw new Error("complete graph has a missing point");
      // Independent recomputation: node index = ply; White-perspective cp read for White.
      expect(point.percent).toBeCloseTo(winPercentFromCp(fixtureCentipawns(index + 1)), 1);
    });
    expect(graph.caption).toContain("win-points for White");
    expect(graph.caption).toContain("stockfish-test, 100 ms");
    expect(graph.coverage).toBe(`${rows.length} of ${rows.length} moves have a recorded evaluation after them.`);
  });

  it("renders the learner side correctly: a Black review mirrors the White-perspective reading, never copies it", () => {
    const white = projectionOf(reviewFixtureRun({ id: "graph-side-w" })).evalGraph;
    const black = projectionOf(reviewFixtureRun({ id: "graph-side-b", side: "black" })).evalGraph;
    expect(black.side).toBe("black");
    expect(black.caption).toContain("win-points for Black");
    let differing = 0;
    black.points.forEach((point, index) => {
      const mirror = white.points[index]!;
      if (point.kind !== "evaluated" || mirror.kind !== "evaluated") throw new Error("fixture is fully evaluated");
      expect(point.percent).toBeCloseTo(100 - mirror.percent, 0);
      if (Math.abs(point.percent - mirror.percent) > 1) differing += 1;
      expect(point.sentence).toMatch(/from White's side, \d+\.\d win-points for Black\.$/u);
    });
    // Wrong implementation caught: plotting the raw White-perspective reading for a Black learner.
    expect(differing).toBeGreaterThan(black.points.length / 2);
  });

  it("uses the accuracy coverage gate and abstains per region, stating each stretch it does not draw", () => {
    const native = reviewFixtureRun({ id: "graph-native", kind: "position", evaluated: (index) => index <= 12 });
    const projection = projectionOf(native);
    const graph = projection.evalGraph;
    expect(graph.kind).toBe("partial");
    expect(graph.evaluated).toBe(12);
    expect(graph.points.slice(0, 12).every((point) => point.kind === "evaluated")).toBe(true);
    expect(graph.points.slice(12).every((point) => point.kind === "missing" && !("percent" in point))).toBe(true);
    expect(graph.gaps).toEqual([{ fromPly: 13, toPly: projection.rows.length, sentence: reviewText("graph.gap", { from: projection.rows[12]!.label, to: projection.rows.at(-1)!.label }) }]);
    expect(graph.coverage).toBe(`12 of ${projection.rows.length} moves have a recorded evaluation after them.`);
    expect(projection.accuracy.white.kind).toBe("abstained");

    // Same gate as accuracy: a recorded packet that cannot be read as a grade operand is a gap, not a point.
    let unreadable = reviewFixtureRun({ id: "graph-unreadable" });
    const path = branchPath(unreadable, unreadable.branches[0]!.id);
    unreadable = attachEvidence(unreadable, path[5]!.id, ["engine:unreadable"], { kind: "eval", source: "engine_validated", values: { centipawns: 40, perspective: "white", requestedMovetimeMs: 100 } }, REVIEW_FIXTURE_AT).run;
    const gated = projectionOf(unreadable);
    expect(gated.evalGraph.points[4]).toMatchObject({ kind: "missing", sentence: reviewText("graph.point.missing", { move: gated.rows[4]!.label }) });
    expect(gated.evalGraph.gaps).toEqual([{ fromPly: 5, toPly: 5, sentence: reviewText("graph.gap.one", { move: gated.rows[4]!.label }) }]);
    expect(gated.accuracy.white.kind).toBe("abstained");
  });

  it("abstains outright, in words, when no position carries a recorded evaluation", () => {
    const bare = reviewFixtureRun({ id: "graph-bare", kind: "position", plies: 6, evaluated: () => false });
    const graph = projectionOf(bare).evalGraph;
    expect(graph).toMatchObject({ kind: "abstained", evaluated: 0, caption: reviewText("graph.none") });
    expect(graph.gaps).toHaveLength(1);
    expect(graph.points).toHaveLength(6);
  });
});

describe("Compare handoff (§4)", () => {
  const base = reviewFixtureRun({ id: "compare-door", plies: 24 });
  const main = base.branches[0]!.id;
  const rows = projectionOf(base).rows;
  const entry = rows[10]!.entryNodeId;
  const alternative = (run: DrillRun, entryNodeId: string): string => {
    const at = run.nodes.find((node) => node.id === entryNodeId)!;
    const played = run.nodes.filter((node) => node.parentId === entryNodeId).map((node) => node.moveUci);
    // Any legal move that is not already a recorded child.
    for (const uci of ["a2a3", "h2h3", "a7a6", "h7h6", "a2a4", "h7h5", "b2b3", "g7g6", "g2g3", "b7b6"]) {
      if (played.includes(uci)) continue;
      try { commitMove(rewind(run, at.id, REVIEW_FIXTURE_AT).run, uci, { actor: "user", at: REVIEW_FIXTURE_AT }); return uci; } catch { /* next */ }
    }
    throw new Error("no alternative move");
  };

  it("offers nothing until a second line carries a move from the same position", () => {
    expect(projectionOf(base).compareDoors).toEqual([]);
    const opened = retry(base, entry);
    // Wrong implementation caught: offering compare against an empty retry (nothing to compare).
    expect(projectionOf(opened).compareDoors).toEqual([]);
  });

  it("offers the shipped compare's input — reviewed line first — at exactly the position the retry left from", () => {
    const retried = retry(base, entry, [alternative(base, entry)]);
    const retryBranch = retried.branches.at(-1)!.id;
    expect(projectionOf(retried).compareDoors).toEqual([{ entryNodeId: entry, branchIds: [main, retryBranch], omitted: 0 }]);
    const twice = retry(retried, entry, [alternative(retried, entry)]);
    const elsewhere = retry(twice, rows[3]!.entryNodeId, [alternative(twice, rows[3]!.entryNodeId)]);
    const doors = projectionOf(elsewhere).compareDoors;
    expect(doors.find((door) => door.entryNodeId === entry)!.branchIds).toEqual([main, retryBranch, twice.branches.at(-1)!.id]);
    expect(doors.find((door) => door.entryNodeId === rows[3]!.entryNodeId)!.branchIds).toEqual([main, elsewhere.branches.at(-1)!.id]);
    // The original continuation is untouched by the retries the door points at.
    expect(projectionOf(elsewhere).rows.map((row) => row.nodeId)).toEqual(rows.map((row) => row.nodeId));
  });

  it("never exceeds the shipped compare's column limit and states what it left out", () => {
    let run = base;
    const moves = ["a2a3", "h2h3", "a2a4", "h2h4", "b2b3", "g2g3", "c2c3", "f2f3", "d2d3"];
    const root = branchPath(run, main)[0]!.id;
    for (const uci of moves) run = retry(run, root, [uci]);
    const door = projectionOf(run).compareDoors.find((candidate) => candidate.entryNodeId === root)!;
    expect(door.branchIds).toHaveLength(REVIEW_COMPARE_LIMIT);
    expect(door.branchIds[0]).toBe(main);
    expect(door.omitted).toBe(moves.length - (REVIEW_COMPARE_LIMIT - 1));
  });
});

describe("Analyze (§7, O7.3)", () => {
  const withLines = (): DrillRun => {
    let run = reviewFixtureRun({ id: "analyze", plies: 12 });
    const path = branchPath(run, run.branches[0]!.id);
    run = attachEvidence(run, path[0]!.id, ["engine:bestline"], { kind: "bestline", source: "engine_validated", values: { engineId: "stockfish-test", requestedDepth: 18, movesUci: ["e2e4", "e7e5", "g1f3"] } }, REVIEW_FIXTURE_AT).run;
    run = attachEvidence(run, path[1]!.id, ["engine:first"], { kind: "eval", source: "engine_validated", values: { engineId: "stockfish-test", requestedMovetimeMs: 100, centipawns: 20, perspective: "white", bestMoveUci: "c7c5" } }, REVIEW_FIXTURE_AT).run;
    run = attachEvidence(run, path[2]!.id, ["engine:unbounded"], { kind: "bestline", source: "engine_validated", values: { engineId: "stockfish-test", movesUci: ["g1f3"] } }, REVIEW_FIXTURE_AT).run;
    run = attachEvidence(run, path[3]!.id, ["engine:illegal"], { kind: "bestline", source: "engine_validated", values: { engineId: "stockfish-test", requestedDepth: 12, movesUci: ["e1e8"] } }, REVIEW_FIXTURE_AT).run;
    return run;
  };
  const run = withLines();
  const main = run.branches[0]!.id;
  const rows = projectionOf(run).rows;

  it("reveals the recorded principal variation, attributed to engine and search bound, and not phrased as advice", () => {
    const analysis = reviewAnalysis(run, main, rows[0]!.nodeId, { role: "learner", session: "imported" });
    expect(analysis).toMatchObject({ kind: "line", source: "bestline", engineId: "stockfish-test", bound: { requestedDepth: 18 }, moves: ["1. e4", "e5", "2. Nf3"], entryNodeId: rows[0]!.entryNodeId });
    if (analysis.kind !== "line") throw new Error("unreachable");
    expect(analysis.sentence).toBe(`stockfish-test (depth 18 search) reported this principal variation from the position before ${rows[0]!.label}: 1. e4 e5 2. Nf3.`);
    expect(analysis.caveat).toBe(reviewText("analysis.caveat"));
    for (const text of [analysis.sentence, analysis.caveat]) {
      expect(judgementWordsOutsideGrounding([], text)).toEqual([]);
      expect(text).not.toMatch(/\b(?:should|best|must|recommend|try)\b/iu);
    }
  });

  it("[module-registration] admits the recorded line only through module.full_inspector@1", () => {
    // A principal variation is Full Inspector's capability: spectators, participants and contexts
    // whose ceiling excludes the inspector (academy, onramp, match) get a stated withholding.
    for (const viewer of [{ role: "spectator" as const, session: "imported" }, { role: "participant" as const, session: "imported" }, { role: "learner" as const, session: "academy" }]) {
      const analysis = reviewAnalysis(run, main, rows[0]!.nodeId, viewer);
      expect(analysis.kind).toBe("withheld");
      expect(JSON.stringify(analysis)).not.toMatch(/"moves"|stockfish-test|2\. Nf3/u);
    }
    const reason = reviewText("module.refusal.inspector.role_outside_ceiling");
    expect(reviewAnalysis(run, main, rows[0]!.nodeId, { role: "spectator", session: "imported" })).toMatchObject({ sentence: reviewText("analysis.module.withheld", { move: rows[0]!.label, reason }) });
    expect(reviewAnalysis(run, main, rows[0]!.nodeId, { role: "host", session: "imported" }).kind).toBe("line");
  });

  it("renders a recorded search's first move as exactly that, with Black-to-move numbering", () => {
    const analysis = reviewAnalysis(run, main, rows[1]!.nodeId, { role: "learner", session: "imported" });
    expect(analysis).toMatchObject({ kind: "line", source: "search_first_move", bound: { requestedMovetimeMs: 100 }, moves: ["1… c5"] });
    if (analysis.kind !== "line") throw new Error("unreachable");
    expect(analysis.sentence).toBe(`stockfish-test (100 ms search) reported 1… c5 as the first move of its search from the position before ${rows[1]!.label}; no longer line is recorded.`);
  });

  it("abstains when the line lacks its search bound, is not legal, or is not recorded", () => {
    expect(reviewAnalysis(run, main, rows[2]!.nodeId, { role: "learner", session: "imported" })).toEqual({ kind: "unattributed", nodeId: rows[2]!.nodeId, entryNodeId: rows[2]!.entryNodeId, sentence: reviewText("analysis.unattributed", { move: rows[2]!.label }) });
    expect(reviewAnalysis(run, main, rows[3]!.nodeId, { role: "learner", session: "imported" })).toMatchObject({ kind: "none" });
    expect(reviewAnalysis(run, main, rows[6]!.nodeId, { role: "learner", session: "imported" })).toEqual({ kind: "none", nodeId: rows[6]!.nodeId, entryNodeId: rows[6]!.entryNodeId, sentence: reviewText("analysis.none", { move: rows[6]!.label }) });
    expect(() => reviewAnalysis(run, main, branchPath(run, main)[0]!.id, { role: "learner", session: "imported" })).toThrow(/not a move/u);
    expect(() => reviewAnalysis(run, main, "nope", { role: "learner", session: "imported" })).toThrow(/not a move/u);
  });

  it("is withheld while a retry from that position is open, and returns once the learner leaves it", () => {
    const opened = retry(run, rows[0]!.entryNodeId);
    expect(openRetryEntry(opened, main)).toBe(rows[0]!.entryNodeId);
    expect(projectionOf(opened).openRetryEntryNodeId).toBe(rows[0]!.entryNodeId);
    const withheld = reviewAnalysis(opened, main, rows[0]!.nodeId, { role: "learner", session: "imported" });
    // Wrong implementation caught: a client-only hide, with the server still serving the line.
    expect(withheld).toEqual({ kind: "withheld", nodeId: rows[0]!.nodeId, entryNodeId: rows[0]!.entryNodeId, sentence: reviewText("analysis.withheld", { move: rows[0]!.label }) });
    expect(JSON.stringify(withheld)).not.toMatch(/"moves"|"engineId"|2\. Nf3/u);
    // Other positions stay analysable during that retry.
    expect(reviewAnalysis(opened, main, rows[1]!.nodeId, { role: "learner", session: "imported" }).kind).toBe("line");
    const playing = commitMove(opened, "d2d4", { actor: "user", at: REVIEW_FIXTURE_AT }).run;
    expect(reviewAnalysis(playing, main, rows[0]!.nodeId, { role: "learner", session: "imported" }).kind).toBe("withheld");
    const left = backToReviewed(playing);
    expect(openRetryEntry(left, main)).toBeNull();
    expect(reviewAnalysis(left, main, rows[0]!.nodeId, { role: "learner", session: "imported" }).kind).toBe("line");
  });

  it("[criterion 12] the ordinary map never carries the line the Analyze action can reveal", () => {
    const serialized = JSON.stringify(projectionOf(run));
    expect(serialized).not.toMatch(/movesUci|bestMove|principal|c7c5|1\. e4 e5 2\. Nf3|1… c5/u);
  });
});

describe("Analyze over the Review pass's typed line (§7, provider exchange §5.2)", () => {
  // The Review coordinator records `stockfish.principal_variation@1` beside each evaluation on the same
  // durable event; Analyze re-derives it and admits it through module.full_inspector@1.
  const typed = (): DrillRun => {
    let run = reviewFixtureRun({ id: "analyze-typed", plies: 6, evaluated: () => false });
    const path = branchPath(run, run.branches[0]!.id);
    const start = path[0]!;
    run = attachDelivery(run, start.id, evaluationDelivery(start.fen, "cp 20", { bound: { kind: "movetime", requestedMs: 100 } }), lineDelivery(start.fen, ["e2e4", "e7e5", "g1f3", "b8c6"], { maxPlies: 3 }));
    // A second node carries an evaluation without a line: Analyze states that none is recorded.
    run = attachDelivery(run, path[1]!.id, evaluationDelivery(path[1]!.fen, "cp 20", { bound: { kind: "movetime", requestedMs: 100 } }));
    return run;
  };
  const run = typed();
  const main = run.branches[0]!.id;
  const rows = projectionOf(run).rows;

  it("reveals the recorded bounded line, attributed to the actual engine and requested bound", () => {
    const analysis = reviewAnalysis(run, main, rows[0]!.nodeId, { role: "learner", session: "imported" });
    expect(analysis).toMatchObject({ kind: "line", source: "bestline", engineId: "stockfish-analysis", bound: { requestedMovetimeMs: 100 }, moves: ["1. e4", "e5", "2. Nf3"] });
    if (analysis.kind !== "line") throw new Error("unreachable");
    expect(analysis.sentence.endsWith(` 19 (100 ms search) reported this principal variation from the position before ${rows[0]!.label}: 1. e4 e5 2. Nf3.`)).toBe(true);
    expect(judgementWordsOutsideGrounding([], analysis.sentence)).toEqual([]);
    expect(reviewAnalysis(run, main, rows[1]!.nodeId, { role: "learner", session: "imported" })).toMatchObject({ kind: "none" });
  });

  it("keeps module, retry and read-only gates: no inspector ceiling, an open retry, and no write", () => {
    expect(reviewAnalysis(run, main, rows[0]!.nodeId, { role: "learner", session: "academy" }).kind).toBe("withheld");
    expect(reviewAnalysis(run, main, rows[0]!.nodeId, { role: "spectator", session: "imported" }).kind).toBe("withheld");
    expect(reviewAnalysis(retry(run, rows[0]!.entryNodeId), main, rows[0]!.nodeId, { role: "learner", session: "imported" }).kind).toBe("withheld");
    const before = JSON.stringify(run);
    reviewAnalysis(run, main, rows[0]!.nodeId, { role: "learner", session: "imported" });
    expect(JSON.stringify(run)).toBe(before);
    // The ordinary map carries neither the line nor its record.
    expect(JSON.stringify(projectionOf(run))).not.toMatch(/movesUci|providerLineDelivery|principal|1\. e4 e5 2\. Nf3/u);
  });

  it("does not reveal a line whose recorded bytes no longer re-derive", () => {
    const tampered = structuredClone(run) as DrillRun;
    for (const event of tampered.events) {
      if (event.type !== "evidence.attached") continue;
      const values = event.data.payload.values as Record<string, { response?: { bodyBase64: string } }>;
      const line = values[REVIEW_PROVIDER_LINE_KEY];
      if (line?.response !== undefined) line.response.bodyBase64 = Buffer.from(Buffer.from(line.response.bodyBase64, "base64").toString("utf8").replace("pv e2e4 e7e5", "pv d2d4 d7d5")).toString("base64");
    }
    expect(reviewAnalysis(tampered, main, rows[0]!.nodeId, { role: "learner", session: "imported" })).toMatchObject({ kind: "none" });
  });

  it("refuses to record a line searched from another position", () => {
    const path = branchPath(run, main);
    expect(() => reviewDeliveryEvidencePayload(evaluationDelivery(path[0]!.fen, "cp 0"), lineDelivery(path[1]!.fen, ["e7e5"]))).toThrow(/exact FEN/u);
  });
});
