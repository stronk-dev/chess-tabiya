// rfc/review-map.md — the remainder: the eval graph (§6, [[D880]]), the Compare handoff (§4) and the
// explicit Analyze action (§7, O7.3). Each test names the wrong implementation it would catch.

import { beforeAll, describe, expect, it } from "vitest";

import { branchPath } from "./branch-path.js";
import { attachEvidence } from "./evidence.js";
import { winPercentFromCp } from "./grade.js";
import { collectRecordedAnalyzeLine, deriveRecordedAnalyzeLineSource, readRecordedAnalyzeLineSource } from "./recorded-analyze-line.js";
import { evidenceForConsumer } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { parsePresentationReceipt, presentedSentence, presentEvidenceItems, serializePresentedEvidence } from "./presentation-contract.js";
import { REVIEW_PROVIDER_LINE_KEY, reviewDeliveryEvidencePayload } from "./review-evidence.js";
import { REVIEW_COMPARE_LIMIT, openRetryEntry, reviewMapProjection, type ReviewMapProjection } from "./review-map.js";
import { reviewText } from "./review-map-templates.js";
import { commitMove, fork, rewind } from "./runtime.js";
import { storyMomentsForRun } from "./story.js";
import { attachDelivery, evaluationDelivery, importedRun, lineDelivery, play } from "./testing/review-evidence-fixture.js";
import { REVIEW_FIXTURE_AT, fixtureCentipawns, reviewFixtureRun } from "./testing/review-map-fixture.js";
import type { DrillRun } from "./types.js";
import { judgementWordsOutsideGrounding } from "./voice.js";
import { recordedReviewFixtureSources } from "./testing/recorded-grade-fixture.js";

function projectionOf(run: DrillRun, branchId = run.branches[0]!.id): ReviewMapProjection {
  return reviewMapProjection({ run, branchId, story: storyMomentsForRun(run, branchId, { recordedResult: "1-0" }), context: run.sessionKind === "imported" ? "imported_analysis" : "review", viewer: { role: "learner", session: run.sessionKind }, ...recordedReviewFixtureSources(run, branchId) });
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
  let white: ReviewMapProjection["evalGraph"], black: ReviewMapProjection["evalGraph"];
  // These are two complete independently acquired recorded workflows. Keep each actual fixture
  // under its normal hook budget; the comparison below retains every point of both graphs.
  beforeAll(() => { white = projectionOf(reviewFixtureRun({ id: "graph-side-w" })).evalGraph; });
  beforeAll(() => { black = projectionOf(reviewFixtureRun({ id: "graph-side-b", side: "black" })).evalGraph; });
  it("draws one point per ply from the recorded White-perspective evaluation, as win-points for the reviewed side", () => {
    const run = reviewFixtureRun({ id: "graph-white" });
    const { evalGraph: graph, rows } = projectionOf(run);
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
    expect(graph.caption).toContain("single move-loss convention, version 2");
    expect(graph.caption).not.toMatch(/grade-convention@\d/u);
    expect(graph.caption).toContain("stockfish-analysis, requested 100 ms");
    expect(graph.coverage).toBe(`${rows.length} of ${rows.length} moves have a recorded evaluation after them.`);
  });

  it("renders the learner side correctly: a Black review mirrors the White-perspective reading, never copies it", () => {
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
  });

  it("does not let a later unreadable scalar erase a genuine modern endpoint", () => {
    // A later scalar packet is not a modern endpoint and cannot erase the original delivery.
    let unreadable = reviewFixtureRun({ id: "graph-unreadable" });
    const path = branchPath(unreadable, unreadable.branches[0]!.id);
    unreadable = attachEvidence(unreadable, path[5]!.id, ["engine:unreadable"], { kind: "eval", source: "engine_validated", values: { centipawns: 40, perspective: "white", requestedMovetimeMs: 100 } }, REVIEW_FIXTURE_AT).run;
    const gated = projectionOf(unreadable);
    expect(gated.evalGraph.points[4]).toMatchObject({ kind: "evaluated", percent: Math.round(winPercentFromCp(fixtureCentipawns(5)) * 10) / 10 });
    expect(gated.evalGraph.gaps).toEqual([]);
    expect(gated.accuracy.white.kind).toBe("rendered");
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

  it.each([
    { side: "white" as const, moves: ["e2e4", "e7e5", "g1f3"], label: "38. Nf3", line: ["g1f3"], rendered: ["38. Nf3"] },
    { side: "black" as const, moves: ["e7e5", "e2e4", "b8c6"], label: "38… Nc6", line: ["b8c6"], rendered: ["38… Nc6"] },
  ])("D3668 names $side's exact recorded move in Analyze and absence", value => {
    const fen = `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${value.side === "white" ? "w" : "b"} KQkq - 0 37`;
    let recorded = play(importedRun(`analysis-number-${value.side}`, value.side, fen), value.moves);
    const map = projectionOf(recorded);
    const target = map.rows[2]!;
    const absent = readRecordedAnalyzeLineSource(collectRecordedAnalyzeLine(recorded, recorded.activeCursor.branchId, target.nodeId, new AbortController().signal));
    expect(absent.outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
    expect(absent.reviewed.id).toBe(target.nodeId); expect(absent.parent.id).toBe(target.entryNodeId);
    expect(target.label).toBe(value.label); expect(absent.edge.payload.moveSan).toBe(value.label.split(" ")[1]);
    recorded = attachEvidence(recorded, target.entryNodeId, ["engine:number-line"], { kind: "bestline", source: "engine_validated", values: { engineId: "stockfish-test", requestedDepth: 18, movesUci: value.line } }, REVIEW_FIXTURE_AT).run;
    const before = JSON.stringify(recorded);
    const source = collectRecordedAnalyzeLine(recorded, recorded.activeCursor.branchId, target.nodeId, new AbortController().signal);
    const result = deriveRecordedAnalyzeLineSource(source, "derived.review.analysis_recorded_pv@1", new AbortController().signal);
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw new Error("Expected genuine historical line");
    expect(result.value.payload.operands).toMatchObject({ kind: "line", sourceArm: "recorded_bestline", reviewedMove: { fullmove: 38, side: value.side }, bound: { kind: "depth", requestedDepth: 18 } });
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]));
    expect(items).toHaveLength(1); expect(parsePresentationReceipt(serializePresentedEvidence(items))).toEqual(items);
    expect(presentedSentence(items[0]!)).toBe(`The saved report names stockfish-test (depth 18 search) and records this reported line from the position before ${value.label}: ${value.rendered.join(" ")}. ${reviewText("analysis.saved.caveat")}`);
    expect(JSON.stringify(recorded)).toBe(before);
  });

  it("reveals the recorded principal variation, attributed to engine and search bound, and not phrased as advice", () => {
    const signal = new AbortController().signal, source = collectRecordedAnalyzeLine(run, main, rows[0]!.nodeId, signal);
    const result = deriveRecordedAnalyzeLineSource(source, "derived.review.analysis_recorded_pv@1", signal);
    if (result.kind !== "available") throw new Error("Expected genuine historical principal variation");
    expect(result.value.payload).toMatchObject({ entryNodeId: rows[0]!.entryNodeId, operands: { kind: "line", sourceArm: "recorded_bestline", engine: { id: "stockfish-test" }, bound: { kind: "depth", requestedDepth: 18 }, line: [{ fullmove: 1, side: "white", san: "e4" }, { fullmove: 1, side: "black", san: "e5" }, { fullmove: 2, side: "white", san: "Nf3" }] } });
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]));
    const sentence = presentedSentence(items[0]!);
    expect(sentence).toBe(`The saved report names stockfish-test (depth 18 search) and records this reported line from the position before ${rows[0]!.label}: 1. e4 e5 2. Nf3. ${reviewText("analysis.saved.caveat")}`);
    for (const text of [sentence, reviewText("analysis.saved.caveat")]) {
      expect(judgementWordsOutsideGrounding([], text)).toEqual([]);
      expect(text).not.toMatch(/\b(?:should|best|must|recommend|try)\b/iu);
    }
  });

  // Role/workflow/retry publication controls now live in actual RunService/SQLite confirmation
  // and source tests, not synthetic viewer arguments to a runtime raw-packet admission helper.

  it("renders a recorded search's first move as exactly that, with Black-to-move numbering", () => {
    const signal = new AbortController().signal, source = collectRecordedAnalyzeLine(run, main, rows[1]!.nodeId, signal);
    const result = deriveRecordedAnalyzeLineSource(source, "derived.review.analysis_recorded_first@1", signal);
    if (result.kind !== "available") throw new Error("Expected genuine historical search first move");
    expect(result.value.payload.operands).toMatchObject({ kind: "line", sourceArm: "recorded_search_first", bound: { kind: "movetime", requestedMs: 100 }, line: [{ fullmove: 1, side: "black", san: "c5" }] });
    if (result.value.payload.operands.kind !== "line") throw new Error("Expected one actual move");
    expect(result.value.payload.operands.line).toHaveLength(1);
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]));
    expect(presentedSentence(items[0]!)).toBe(`The saved report names stockfish-test (100 ms search) and records 1… c5 as the first move of its search from the position before ${rows[1]!.label}; no longer line is recorded. ${reviewText("analysis.saved.caveat")}`);
  });

  it("abstains when the line lacks its search bound, is not legal, or is not recorded", () => {
    const signal = new AbortController().signal, unbounded = collectRecordedAnalyzeLine(run, main, rows[2]!.nodeId, signal);
    const result = deriveRecordedAnalyzeLineSource(unbounded, "derived.review.analysis_recorded_pv@1", signal);
    if (result.kind !== "available") throw new Error("Expected grounded attribution-incomplete state");
    expect(result.value.payload.operands).toMatchObject({ kind: "unattributed", reason: "bound_unusable" });
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]));
    expect(presentedSentence(items[0]!)).toBe(reviewText("analysis.unattributed.bound_unusable", { move: rows[2]!.label }));
    expect(JSON.stringify(items)).not.toMatch(/"line":|"moves":/u);
    const illegal = collectRecordedAnalyzeLine(run, main, rows[3]!.nodeId, signal);
    expect(readRecordedAnalyzeLineSource(illegal).outcome).toEqual({ kind: "failed", reason: "source_contract_invalid" });
    expect(deriveRecordedAnalyzeLineSource(illegal, "derived.review.analysis_recorded_pv@1", signal)).toMatchObject({ kind: "unavailable", reason: "source_contract_invalid" });
    const absent = readRecordedAnalyzeLineSource(collectRecordedAnalyzeLine(run, main, rows[6]!.nodeId, signal));
    expect(absent).toMatchObject({ outcome: { kind: "unavailable", reason: "source_absent" }, parent: { id: rows[6]!.entryNodeId }, reviewed: { id: rows[6]!.nodeId } });
    expect(() => collectRecordedAnalyzeLine(run, main, branchPath(run, main)[0]!.id, signal)).toThrow(/not a move/u);
    expect(() => collectRecordedAnalyzeLine(run, main, "nope", signal)).toThrow(/not a move/u);
  });

  it("is withheld while a retry from that position is open, and returns once the learner leaves it", () => {
    const opened = retry(run, rows[0]!.entryNodeId);
    expect(openRetryEntry(opened, main)).toBe(rows[0]!.entryNodeId);
    expect(projectionOf(opened).openRetryEntryNodeId).toBe(rows[0]!.entryNodeId);
    expect(() => collectRecordedAnalyzeLine(opened, main, rows[0]!.nodeId, new AbortController().signal)).toThrow(/open retry entry/u);
    expect(readRecordedAnalyzeLineSource(collectRecordedAnalyzeLine(opened, main, rows[1]!.nodeId, new AbortController().signal)).outcome.kind).toBe("available");
    const playing = commitMove(opened, "d2d4", { actor: "user", at: REVIEW_FIXTURE_AT }).run;
    expect(() => collectRecordedAnalyzeLine(playing, main, rows[0]!.nodeId, new AbortController().signal)).toThrow(/open retry entry/u);
    const left = backToReviewed(playing);
    expect(openRetryEntry(left, main)).toBeNull();
    expect(readRecordedAnalyzeLineSource(collectRecordedAnalyzeLine(left, main, rows[0]!.nodeId, new AbortController().signal)).outcome.kind).toBe("available");
  });

  it("[criterion 12] the ordinary map never carries the line the Analyze action can reveal", () => {
    const serialized = JSON.stringify(projectionOf(run));
    const leak = /movesUci|bestMove|principal|\bc7c5\b|1\. e4 e5 2\. Nf3|1… c5/u;
    expect("sha256:00c7c500".match(leak)).toBeNull();
    expect('"c7c5"'.match(leak)).not.toBeNull();
    expect(serialized.match(leak)?.[0]).toBeUndefined();
  });
});

describe("Analyze over the Review pass's typed line (§7, provider exchange §5.2)", () => {
  // The Review coordinator records `stockfish.principal_variation@1` beside each evaluation on the same
  // durable event; Analyze re-derives it and admits it through the actual module.full_inspector@2.
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
    const signal = new AbortController().signal, source = collectRecordedAnalyzeLine(run, main, rows[0]!.nodeId, signal);
    const result = deriveRecordedAnalyzeLineSource(source, "derived.review.analysis_typed_pv@1", signal);
    if (result.kind !== "available") throw new Error("Expected real bounded provider source");
    expect(result.value.payload.operands).toMatchObject({ kind: "line", sourceArm: "typed_pv", engine: { id: "stockfish-analysis", version: "19" }, bound: { kind: "movetime", requestedMs: 100 }, lineScope: { kind: "typed_request", maxPlies: 3, truncated: true }, line: [{ san: "e4" }, { san: "e5" }, { san: "Nf3" }] });
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]));
    const sentence = presentedSentence(items[0]!);
    expect(sentence).toContain(` 19 (100 ms search) reported this principal variation from the position before ${rows[0]!.label}: 1. e4 e5 2. Nf3.`);
    expect(sentence).toContain(reviewText("analysis.scope.truncated", { plies: 3 })); expect(sentence).toContain("longer line");
    expect(sentence).toContain(reviewText("analysis.caveat")); expect(judgementWordsOutsideGrounding([], sentence)).toEqual([]);
    expect(readRecordedAnalyzeLineSource(collectRecordedAnalyzeLine(run, main, rows[1]!.nodeId, signal)).outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
  });

  it("keeps genuine typed source retry/read-only gates; real role/session checks live in server authority tests", () => {
    expect(() => collectRecordedAnalyzeLine(retry(run, rows[0]!.entryNodeId), main, rows[0]!.nodeId, new AbortController().signal)).toThrow(/open retry entry/u);
    const before = JSON.stringify(run);
    const signal = new AbortController().signal, source = collectRecordedAnalyzeLine(run, main, rows[0]!.nodeId, signal);
    const result = deriveRecordedAnalyzeLineSource(source, "derived.review.analysis_typed_pv@1", signal);
    if (result.kind !== "available") throw new Error("Expected genuine typed source");
    presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]));
    expect(JSON.stringify(run)).toBe(before);
    // The ordinary map carries neither the line nor its record.
    expect(JSON.stringify(projectionOf(run))).not.toMatch(/movesUci|providerLineDelivery|principal|1\. e4 e5 2\. Nf3/u);
  });

  it("does not reveal a line whose recorded bytes no longer re-derive", () => {
    const parent = branchPath(run, main)[0]!;
    const withValidWeakerReport = attachEvidence(run, parent.id, ["engine:valid-weaker-pv"], { kind: "bestline", source: "engine_validated",
      values: { engineId: "saved-weaker-engine", requestedDepth: 18, movesUci: ["d2d4", "d7d5"] } }, REVIEW_FIXTURE_AT).run;
    const tampered = structuredClone(withValidWeakerReport) as DrillRun;
    for (const event of tampered.events) {
      if (event.type !== "evidence.attached") continue;
      const values = event.data.payload.values as Record<string, { response?: { bodyBase64: string } }>;
      const line = values[REVIEW_PROVIDER_LINE_KEY];
      if (line?.response !== undefined) line.response.bodyBase64 = Buffer.from(Buffer.from(line.response.bodyBase64, "base64").toString("utf8").replace("pv e2e4 e7e5", "pv d2d4 d7d5")).toString("base64");
    }
    const signal = new AbortController().signal, source = collectRecordedAnalyzeLine(tampered, main, rows[0]!.nodeId, signal);
    expect(readRecordedAnalyzeLineSource(source)).toMatchObject({ sourceArm: "typed_pv", outcome: { kind: "failed", reason: "source_contract_invalid" } });
    expect(deriveRecordedAnalyzeLineSource(source, "derived.review.analysis_typed_pv@1", signal)).toMatchObject({ kind: "unavailable", reason: "source_contract_invalid" });
  });

  it("refuses to record a line searched from another position", () => {
    const path = branchPath(run, main);
    expect(() => reviewDeliveryEvidencePayload(evaluationDelivery(path[0]!.fen, "cp 0"), lineDelivery(path[1]!.fen, ["e7e5"]))).toThrow(/exact FEN/u);
  });
});
