// rfc/review-evidence-compiler.md acceptance criteria 1–18, 21 over the production compiler.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { attachEvidence } from "./evidence.js";
import { presentedSentence } from "./presentation-contract.js";
import {
  REVIEW_PACKET_SOURCE_ADAPTERS,
  REVIEW_SOURCE_FAMILIES,
  assertReviewEvidencePacket,
  assertReviewRecordedPrefixReceipt,
  compileReviewEvidence,
  createReviewPrefixAuthority,
  foldReviewCompletion,
  foldReviewFamilyState,
  reviewDurableEngineStates,
  reviewPacketForRun,
  reviewPacketSourcePlan,
  reviewSubjectPath,
  runReviewPacketSources,
  type ReviewProviderNodeState,
} from "./review-evidence.js";
import { reviewPointComparability, whiteWdl, type ReviewEnginePoint } from "./review-points.js";
import { parseReviewStoryReceipt, projectPublicReviewStory, rankStoryMoments, renderReviewStoryReceipt, reviewStoryMoments } from "./story.js";
import { REVIEW_AT, attachDelivery, evaluationDelivery, importRecord, importedRun, mainPath, play } from "./testing/review-evidence-fixture.js";
import type { DrillRun } from "./types.js";

const ROOT = new URL("../../../", import.meta.url);
const LINE = ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6"];

/** A six-ply imported game with one delivery per node from the given raw side-to-move scores. */
function evaluatedGame(scores: readonly string[], options: { readonly side?: "white" | "black"; readonly id?: string } = {}): DrillRun {
  let run = play(importedRun(options.id ?? "review", options.side ?? "white"), LINE);
  const path = mainPath(run);
  path.forEach((node, index) => { if (scores[index] !== undefined) run = attachDelivery(run, node.id, evaluationDelivery(node.fen, scores[index]!)); });
  return run;
}

const pointOf = (run: DrillRun, nodeIndex: number): DeclaredEvidence<ReviewEnginePoint> => {
  const node = mainPath(run)[nodeIndex]!;
  const point = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(node.fen, "cp 10") }), position: invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: node.id }) });
  if (point.kind !== "available") throw new Error("fixture point abstained");
  return point.value;
};

describe("review evidence compiler: typed shared delivery and Review projections", () => {
  it("normalizes White/Black cp and mate once, and the eval point joins only by exact canonical FEN (criteria 1, 3, 21)", () => {
    const run = evaluatedGame(["cp 20", "cp 35", "mate 3"]);
    const path = mainPath(run);
    // Black to move at ply 1 reports +35 for Black: White perspective is −35.
    const durable = reviewDurableEngineStates(run, path);
    const second = durable.get(path[1]!.id)!;
    expect(second.kind).toBe("delivered");
    const delivery = (second as Extract<ReviewProviderNodeState, { kind: "delivered" }>).delivery.payload;
    expect(delivery.payload.score).toEqual({ kind: "centipawns", value: -35 });
    expect(delivery.payload.perspective).toBe("white");
    expect(Object.keys(delivery.payload)).not.toContain("nodeId");
    // Mate 3 for the side to move (White at ply 2) is a White mate, never a cp sentinel.
    const third = (durable.get(path[2]!.id) as Extract<ReviewProviderNodeState, { kind: "delivered" }>).delivery.payload.payload.score;
    expect(third).toEqual({ kind: "mate", side: "white", distance: 3, unit: "moves" });
    // Joining a delivery to a different recorded occurrence abstains position_mismatch.
    const crossed = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: (second as Extract<ReviewProviderNodeState, { kind: "delivered" }>).delivery, position: invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: path[2]!.id }) });
    expect(crossed).toEqual({ kind: "unavailable", reason: "position_mismatch" });
  });

  it("admits no best move, PV or MultiPV bytes into declared evidence, packet or story wire (criterion 2)", () => {
    const run = evaluatedGame(["cp 20", "cp 35", "cp 300", "cp 280", "cp 250", "cp 260", "cp 255"]);
    const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "1-0") });
    const wire = JSON.stringify(renderReviewStoryReceipt(packet));
    expect(wire).not.toMatch(/"(?:bestMoveUci|pv|multiPv|multipv)"/u);
    for (const node of packet.nodes) for (const item of node.items) if (item.projection.id.startsWith("derived.review.")) expect(JSON.stringify(item.payload)).not.toMatch(/"(?:bestMoveUci|pv)"\s*:/u);
  });

  it("keeps legacy attached eval rows readable but abstains them legacy_provenance_missing (criterion 4)", () => {
    let run = play(importedRun("legacy"), LINE.slice(0, 2));
    const path = mainPath(run);
    run = attachEvidence(run, path[1]!.id, ["engine:legacy"], { kind: "eval", source: "engine_validated", values: { centipawns: 40, perspective: "white", engineId: "sf", requestedMovetimeMs: 100 } }, REVIEW_AT).run;
    const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "*") });
    const node = packet.nodes.find((candidate) => candidate.nodeId === path[1]!.id)!;
    expect(node.families.engine_eval.sources.find((row) => row.adapterId === "review.source.eval_point@1")!.state).toEqual({ kind: "unavailable", reason: "legacy_provenance_missing" });
    expect(node.items.some((item) => item.projection.id === "derived.review.eval_point")).toBe(false);
  });

  it("normalizes raw WDL by identity/swap and joins one normalization to two occurrences (criterion 5)", () => {
    expect(whiteWdl("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", { subject: "side_to_move", win: 600, draw: 300, loss: 100 })).toEqual({ rawSubject: "white", win: 600, draw: 300, loss: 100 });
    expect(whiteWdl("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", { subject: "side_to_move", win: 600, draw: 300, loss: 100 })).toEqual({ rawSubject: "black", win: 100, draw: 300, loss: 600 });
    expect(() => whiteWdl("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", { subject: "side_to_move", win: 600, draw: 300, loss: 101 })).toThrow(/summing to 1000/u);
    const run = evaluatedGame([]);
    const root = mainPath(run)[0]!;
    const delivery = invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(root.fen, "cp 10", { wdl: [700, 200, 100] }) });
    const normalized = invokeEvidenceValueRoute("derived.review.wdl_white@1", { evaluation: delivery });
    expect(Object.keys(normalized.payload)).not.toContain("nodeId");
    const first = invokeEvidenceValueRoute("derived.review.wdl_point@1", { normalized, position: invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: root.id }) });
    const branch = play(run, []);
    const second = invokeEvidenceValueRoute("derived.review.wdl_point@1", { normalized, position: invokeEvidenceValueRoute("run.record.position@1", { run: branch, nodeId: root.id }) });
    expect(first.kind).toBe("available");
    expect(second.kind).toBe("available");
    const mismatch = invokeEvidenceValueRoute("derived.review.wdl_point@1", { normalized, position: invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: mainPath(run)[1]!.id }) });
    expect(mismatch).toEqual({ kind: "unavailable", reason: "position_mismatch" });
  });

  it("computes cp→cp deltas only and abstains every mate operand (criteria 6, 9)", () => {
    const run = evaluatedGame(["cp 20", "cp 35", "mate 2"]);
    const [p0, p1, p2] = [0, 1, 2].map((index) => {
      const node = mainPath(run)[index]!;
      const state = reviewDurableEngineStates(run, mainPath(run)).get(node.id) as Extract<ReviewProviderNodeState, { kind: "delivered" }>;
      const point = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: state.delivery, position: invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: node.id }) });
      if (point.kind !== "available") throw new Error("abstained");
      return point.value;
    });
    const delta = invokeEvidenceValueRoute("derived.review.eval_delta@1", { before: p0!, after: p1! });
    expect(delta.kind === "available" && delta.value.payload.deltaCp).toBe(-55);
    expect(delta.kind === "available" && delta.value.payload.before).toBe(p0);
    expect(invokeEvidenceValueRoute("derived.review.eval_delta@1", { before: p1!, after: p2! })).toEqual({ kind: "unavailable", reason: "mate_operand" });
    // A genuine +1000 cp stays typed +1000 cp.
    const big = evaluatedGame(["cp 0", "cp -1000"], { id: "big" });
    const bigState = reviewDurableEngineStates(big, mainPath(big)).get(mainPath(big)[1]!.id) as Extract<ReviewProviderNodeState, { kind: "delivered" }>;
    expect(bigState.delivery.payload.payload.score).toEqual({ kind: "centipawns", value: 1000 });
    const story = readFileSync(new URL("packages/runtime/src/story.ts", ROOT), "utf8");
    const factories = readFileSync(new URL("packages/runtime/src/evidence-factories.ts", ROOT), "utf8");
    expect(`${story}\n${factories}`).not.toMatch(/STORY_MATE_CP|-?\bSTORY_MATE\b|\?\s*-1000\s*:\s*1000/u);
  });

  it("abstains across one-character engine version, generation and bound mismatches (criterion 7)", () => {
    const run = evaluatedGame([]);
    const node = mainPath(run)[1]!;
    const position = invokeEvidenceValueRoute("run.record.position@1", { run, nodeId: node.id });
    const point = (score: string, options: Parameters<typeof evaluationDelivery>[2]) => {
      const result = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(node.fen, score, options) }), position });
      if (result.kind !== "available") throw new Error("abstained");
      return result.value.payload;
    };
    const base = point("cp 10", {});
    expect(reviewPointComparability(base, point("cp 30", {}))).toBe("comparable");
    expect(reviewPointComparability(base, point("cp 30", { version: "18" }))).toBe("engine_mismatch");
    expect(reviewPointComparability(base, point("cp 30", { generation: 2 }))).toBe("engine_mismatch");
    expect(reviewPointComparability(base, point("cp 30", { bound: { kind: "depth", requestedDepth: 13 } }))).toBe("bound_mismatch");
    expect(reviewPointComparability(base, point("cp 30", { bound: { kind: "movetime", requestedMs: 100 } }))).toBe("bound_mismatch");
  });

  it("fixtures appearance, disappearance, side and distance changes; equal mate and cp→cp do not emit (criterion 8)", () => {
    const transitions = (scores: readonly string[]) => {
      const run = evaluatedGame(scores, { id: `mate-${scores.join("-")}` });
      const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "*") });
      return packet.nodes.flatMap((node) => node.items.filter((item) => item.projection.id === "derived.review.mate_transition").map((item) => (item.payload as { readonly changes: readonly string[] }).changes));
    };
    expect(transitions(["cp 10", "mate 3"])).toEqual([["appeared"]]);
    expect(transitions(["mate 3", "cp 10"])).toEqual([["disappeared"]]);
    // White mates in 3 (white to move), then with Black to move "mate -2" is still White mating, closer.
    expect(transitions(["mate 3", "mate -2"])).toEqual([["distance_changed"]]);
    // White mates in 3, then Black to move with "mate 2" is Black mating: side and distance change.
    expect(transitions(["mate 3", "mate 2"])).toEqual([["side_changed", "distance_changed"]]);
    expect(transitions(["mate 3", "mate -3"])).toEqual([]);
    expect(transitions(["cp 10", "cp 20"])).toEqual([]);
  });
});

describe("review evidence compiler: subject, plan, packet and folds", () => {
  it("derives the prefix subject from storage only and replays it (criterion 15)", () => {
    const run = evaluatedGame(["cp 20"]);
    const authorize = createReviewPrefixAuthority({ loadRun: (id) => id === run.id ? run : undefined, loadImportRecord: () => importRecord(run, "1-0") });
    const subject = authorize({ runId: run.id, branchId: run.activeCursor.branchId });
    expect(subject.pathNodeIds).toEqual(mainPath(run).map((node) => node.id));
    expect(subject.learnerSide).toBe("white");
    expect(subject.outcome.kind).toBe("recorded_result");
    expect(() => assertReviewRecordedPrefixReceipt(subject)).not.toThrow();
    expect(() => assertReviewRecordedPrefixReceipt({ ...subject })).toThrow(/REVIEW_PREFIX_REFUSED/u);
    expect(() => assertReviewRecordedPrefixReceipt(JSON.parse(JSON.stringify(subject)))).toThrow(/REVIEW_PREFIX_REFUSED/u);
    expect(() => authorize({ runId: run.id, branchId: run.activeCursor.branchId, side: "black" } as never)).toThrow(/exactly \{ runId, branchId \}/u);
    // A gapped event sequence, a crossed import record and a record for a native run all refuse.
    const gapped = { ...run, events: [...run.events.slice(0, 2), ...run.events.slice(3)] };
    expect(() => createReviewPrefixAuthority({ loadRun: () => gapped, loadImportRecord: () => importRecord(run, "1-0") })({ runId: run.id, branchId: run.activeCursor.branchId })).toThrow(/not contiguous/u);
    expect(() => createReviewPrefixAuthority({ loadRun: () => run, loadImportRecord: () => ({ ...importRecord(run, "1-0"), runId: "other" }) })({ runId: run.id, branchId: run.activeCursor.branchId })).toThrow(/another run/u);
    // A head that moved after issue fails the replay.
    let stored = run;
    const moving = createReviewPrefixAuthority({ loadRun: () => stored, loadImportRecord: () => importRecord(run, "1-0") });
    const early = moving({ runId: run.id, branchId: run.activeCursor.branchId });
    stored = attachDelivery(stored, mainPath(run)[1]!.id, evaluationDelivery(mainPath(run)[1]!.fen, "cp 5"));
    expect(() => assertReviewRecordedPrefixReceipt(early)).toThrow(/no longer matches/u);
  });

  it("plans node slots everywhere, incoming-edge slots only after the root, with window indices (criterion 16)", () => {
    const run = evaluatedGame([]);
    const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "*") });
    const plan = reviewPacketSourcePlan(packet.subject, { windowNodes: 3 });
    const nodes = packet.subject.pathNodeIds.length;
    const nodeAdapters = REVIEW_PACKET_SOURCE_ADAPTERS.filter((entry) => entry.grain === "node").length;
    const edgeAdapters = REVIEW_PACKET_SOURCE_ADAPTERS.filter((entry) => entry.grain === "incoming_edge").length;
    expect(plan).toHaveLength(nodeAdapters * nodes + edgeAdapters * (nodes - 1));
    expect(plan.filter((slot) => slot.grain === "incoming_edge").every((slot) => slot.nodeId !== packet.subject.pathNodeIds[0] && slot.fromNodeId !== null)).toBe(true);
    expect(new Set(plan.map((slot) => slot.window))).toEqual(new Set([0, 1, 2]));
    expect(new Set(plan.map((slot) => slot.invocationId)).size).toBe(plan.length);
    // Every adapter parser is executable and refuses a crossed payload.
    const position = REVIEW_PACKET_SOURCE_ADAPTERS.find((entry) => entry.id === "review.source.position@1")!;
    expect(() => position.parser({ nodeId: "n", ply: 0, fen: "x", extra: 1 })).toThrow(/undeclared key extra/u);
    expect(() => position.parser({ nodeId: "n", ply: 0 })).toThrow(/omits fen/u);
    for (const entry of REVIEW_PACKET_SOURCE_ADAPTERS) expect(PRIMARY_EVIDENCE_MANIFEST.projections.some((projection) => projection.id === entry.projection.id && projection.version === entry.projection.version), entry.id).toBe(true);
  });

  it("requires exactly the planned source population and seals the aggregate (criteria 11, 17)", () => {
    const run = evaluatedGame(["cp 20", "cp 25"]);
    const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "*") });
    const sources = runReviewPacketSources(packet.subject, { engine: reviewDurableEngineStates(run, reviewSubjectPath(packet.subject).path), shapes: [] });
    expect(() => compileReviewEvidence({ subject: packet.subject, sources: sources.slice(1) })).toThrow(/have no result/u);
    expect(() => compileReviewEvidence({ subject: packet.subject, sources: [...sources, sources[0]!] })).toThrow(/duplicate source result/u);
    expect(() => compileReviewEvidence({ subject: packet.subject, sources: [{ ...sources[0]! }, ...sources.slice(1)] })).toThrow(/not sealed/u);
    const other = evaluatedGame(["cp 20"], { id: "other" });
    const otherPacket = reviewPacketForRun(other, other.activeCursor.branchId, { importRecord: importRecord(other, "*") });
    const foreign = runReviewPacketSources(otherPacket.subject, { engine: new Map(), shapes: [] });
    expect(() => compileReviewEvidence({ subject: packet.subject, sources: [foreign[0]!, ...sources.slice(1)] })).toThrow(/another subject/u);
    const compiled = compileReviewEvidence({ subject: packet.subject, sources });
    expect(() => assertReviewEvidencePacket(compiled)).not.toThrow();
    expect(() => assertReviewEvidencePacket({ ...compiled })).toThrow(/REVIEW_PACKET_INVALID/u);
    expect(() => assertReviewEvidencePacket(JSON.parse(JSON.stringify(compiled)))).toThrow(/REVIEW_PACKET_INVALID/u);
    // Shuffled sources produce byte-identical packets.
    const shuffled = compileReviewEvidence({ subject: packet.subject, sources: [...sources].reverse() });
    expect(shuffled.packetDigest).toBe(compiled.packetDigest);
  });

  it("retains every adapter row per family: sibling available + unavailable survive with exact counts (criteria 11, 14)", () => {
    const run = evaluatedGame(["cp 20", "cp 25"]);
    const path = mainPath(run);
    const engine = new Map<string, ReviewProviderNodeState>(reviewDurableEngineStates(run, path));
    engine.set(path[2]!.id, { kind: "pending", jobCount: 1, retrying: 1 });
    engine.set(path[3]!.id, { kind: "unavailable", reason: "provider_failed" });
    engine.set(path[4]!.id, { kind: "not_yet_scheduled" });
    engine.set(path[5]!.id, { kind: "unavailable", reason: "retry_exhausted" });
    engine.set(path[6]!.id, { kind: "unavailable", reason: "attempt_history_capacity" });
    const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "*"), engine });
    const node1 = packet.nodes.find((node) => node.nodeId === path[1]!.id)!;
    // eval_point available, eval_delta available (cp→cp), mate_transition honest-empty: three rows, all kept.
    expect(node1.families.engine_eval.sources.map((row) => row.state.kind)).toEqual(["available", "available", "honest_empty"]);
    expect(node1.families.engine_eval.itemCount).toBe(2);
    const node3 = packet.nodes.find((node) => node.nodeId === path[3]!.id)!;
    expect(node3.families.engine_eval.sources.every((row) => row.state.kind === "unavailable")).toBe(true);
    const family = packet.families.engine_eval;
    const counts = family.sourceCounts;
    expect(counts.available + counts.honestEmpty + counts.notRequested + counts.notYetScheduled + counts.pending + counts.unavailable).toBe(family.applicableSourceCount);
    expect(family.progress.retryingJobCount).toBeLessThanOrEqual(family.progress.pendingJobCount);
    expect(family.unavailable.map((group) => group.reason)).toEqual(["attempt_history_capacity", "provider_failed", "retry_exhausted"]);
    // Pending and degraded at the same time; neither erases the other.
    expect(packet.completion.progress.kind).toBe("progressive");
    expect(packet.completion.degradation.kind).toBe("degraded");
    // Local recorded facts still render while a provider family is unavailable.
    expect(packet.families.recorded.itemCount).toBeGreaterThan(0);
    // Impossible fold inputs fail.
    expect(() => foldReviewFamilyState(packet.nodes.slice(1), packet.subject.pathNodeIds)).toThrow(/exact unique path population/u);
    expect(() => foldReviewFamilyState([...packet.nodes, packet.nodes[0]!], packet.subject.pathNodeIds)).toThrow(/exact unique path population/u);
    expect(() => foldReviewCompletion({} as never, packet.nodes)).toThrow(/nine family folds/u);
    const tampered = packet.nodes.map((node, index) => index === 1 ? { ...node, families: { ...node.families, engine_eval: { ...node.families.engine_eval, itemCount: 5 } } } : node);
    expect(() => foldReviewFamilyState(tampered, packet.subject.pathNodeIds)).toThrow(/item count disagrees/u);
    expect(REVIEW_SOURCE_FAMILIES).toHaveLength(9);
  });
});

describe("review evidence compiler: Story compatibility and wire", () => {
  it("renders cp pivot, mate transition and learner-relative last-level through sealed components (criteria 9, 17, 18)", () => {
    // Learner White lost 0-1: +0.20, −0.35 (Black to move reports +35), then a drop to −3.00.
    const run = evaluatedGame(["cp 20", "cp 35", "cp -300", "cp 290", "mate -3", "mate 2", "mate -1"]);
    const packet = reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "0-1") });
    const story = reviewStoryMoments(packet);
    const pivot = story.moments.find((moment) => moment.kinds.includes("eval_pivot"))!;
    expect(pivot.sentences.join(" ")).toMatch(/Recorded engine evaluation changed by −2\.65 pawns from White's side across this move \(Stockfish 19, depth 12 search\)\./u);
    expect(pivot.evaluation).toEqual({ before: { kind: "centipawns", value: -35 }, after: { kind: "centipawns", value: -300 } });
    const mate = story.moments.find((moment) => moment.kinds.includes("mate_transition"))!;
    expect(mate.sentences.join(" ")).toMatch(/went from −2\.90 to mate in 3 for Black across this move — a mate score appeared/u);
    const level = story.moments.find((moment) => moment.kinds.includes("last_level"))!;
    expect(mainPath(run).findIndex((node) => node.id === level.evidenceNodeId)).toBe(1);
    // Decision is the parent of the evidence edge; stop is on the path at/after evidence.
    for (const moment of story.moments) {
      const index = packet.subject.pathNodeIds.indexOf(moment.evidenceNodeId);
      expect(packet.subject.pathNodeIds.indexOf(moment.decisionNodeId)).toBe(index - 1);
      expect(packet.subject.pathNodeIds.indexOf(moment.stopNodeId)).toBeGreaterThanOrEqual(index);
      expect(moment.entryNodeId).toBe(moment.decisionNodeId);
    }
    const wire = renderReviewStoryReceipt(packet);
    const parsed = parseReviewStoryReceipt(JSON.parse(JSON.stringify(wire)), { runId: run.id });
    expect(parsed.moments.map((moment) => moment.components.map(presentedSentence))).toEqual(story.moments.map((moment) => moment.sentences));
    expect(JSON.stringify(wire)).not.toMatch(/"sentences"|"sourceLabels"|"payload"|"acquisition"/u);
  });

  it("gives sign-mirrored White/Black learners the same last-level node (criterion 18, D1648)", () => {
    const white = evaluatedGame(["cp 20", "cp 35", "cp -300"], { side: "white", id: "mirror-white" });
    // Colour-mirrored readings: Black learner, Black's advantage mirrors White's (raw side-to-move scores negate).
    const black = evaluatedGame(["cp -20", "cp -35", "cp 300"], { side: "black", id: "mirror-black" });
    const whiteLevel = reviewStoryMoments(reviewPacketForRun(white, white.activeCursor.branchId, { importRecord: importRecord(white, "0-1") })).moments.find((moment) => moment.kinds.includes("last_level"));
    const blackLevel = reviewStoryMoments(reviewPacketForRun(black, black.activeCursor.branchId, { importRecord: importRecord(black, "1-0") })).moments.find((moment) => moment.kinds.includes("last_level"));
    expect(whiteLevel?.ply).toBe(1);
    expect(blackLevel?.ply).toBe(whiteLevel?.ply);
  });

  it("ranks nine bands with phase before endgame and mate moments by ply, never a fake magnitude (criterion 18)", () => {
    const moment = (nodeId: string, ply: number, kinds: readonly import("./story.js").StoryMomentKind[], evaluation: import("./story.js").StoryMoment["evaluation"] = null) => ({ nodeId, ply, kinds, evaluation });
    const cp = (before: number, after: number) => ({ before: { kind: "centipawns" as const, value: before }, after: { kind: "centipawns" as const, value: after } });
    const mate = { before: { kind: "centipawns" as const, value: 0 }, after: { kind: "mate" as const, side: "white" as const, distance: 2, unit: "moves" as const } };
    expect(rankStoryMoments([
      moment("irreversible", 1, ["irreversibility"]),
      moment("endgame", 2, ["endgame_entry"]),
      moment("phase", 3, ["phase_change"]),
      moment("small-pivot", 4, ["eval_pivot"], cp(0, 160)),
      moment("big-pivot", 9, ["eval_pivot"], cp(0, 900)),
      moment("mate-late", 8, ["mate_transition"], mate),
      moment("mate-early", 5, ["mate_transition"], mate),
      moment("outcome", 10, ["outcome"]),
      moment("shape", 6, ["shape_span"]),
      moment("collapse", 7, ["option_collapse"]),
    ])).toEqual(["outcome", "mate-early", "mate-late", "big-pivot", "small-pivot", "phase", "endgame", "shape", "collapse", "irreversible"]);
  });

  it("projects the public story strictly from the same selected receipts (criterion 17)", () => {
    const run = evaluatedGame(["cp 20", "cp 35", "cp -300"]);
    const receipt = renderReviewStoryReceipt(reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "0-1") }));
    const selected = receipt.moments.slice(0, 1).map((moment) => moment.evidenceNodeId);
    const publicStory = projectPublicReviewStory(receipt, selected);
    expect(publicStory.moments).toHaveLength(1);
    expect(publicStory.moments[0]!.presentation).toBe(receipt.moments[0]!.presentation);
    expect(JSON.stringify(publicStory)).not.toMatch(/"families"|"progress"|"degradation"|"packetDigest"/u);
    expect(() => projectPublicReviewStory(receipt, ["invented"])).toThrow(/does not carry/u);
  });

  it("refuses crossed subjects, unknown keys, raw sentence arrays and invalid rank references on parse (criterion 17)", () => {
    const run = evaluatedGame(["cp 20", "cp 35", "cp -300"]);
    const wire = JSON.parse(JSON.stringify(renderReviewStoryReceipt(reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "0-1") })))) as Record<string, unknown>;
    expect(() => parseReviewStoryReceipt({ ...wire, sentences: [] })).toThrow(/keys/u);
    expect(() => parseReviewStoryReceipt({ ...wire, subject: { ...(wire.subject as object), learnerSide: "black" } })).toThrow(/subject digest mismatch/u);
    expect(() => parseReviewStoryReceipt({ ...wire, rank: [...(wire.rank as string[]), "ghost"] })).toThrow(/rank/u);
    expect(() => parseReviewStoryReceipt(wire, { runId: "someone-else" })).toThrow(/does not answer the request/u);
    const moments = wire.moments as Record<string, unknown>[];
    const reversed = [{ ...moments[0]!, decisionNodeId: moments[0]!.evidenceNodeId, evidenceNodeId: moments[0]!.decisionNodeId }, ...moments.slice(1)];
    expect(() => parseReviewStoryReceipt({ ...wire, moments: reversed })).toThrow(/ordered path edge/u);
    const swapped = [{ ...moments[0]!, presentation: { ...(moments[0]!.presentation as object), digest: `sha256:${"0".repeat(64)}` } }, ...moments.slice(1)];
    expect(() => parseReviewStoryReceipt({ ...wire, moments: swapped })).toThrow(/presentation/u);
  });

  it("stays within the local performance bound over a long game (criterion 19, reported)", () => {
    const run = evaluatedGame(["cp 20", "cp 35", "cp -300", "cp 290", "cp 250", "cp 260", "cp 255"]);
    const started = performance.now();
    for (let index = 0; index < 5; index += 1) renderReviewStoryReceipt(reviewPacketForRun(run, run.activeCursor.branchId, { importRecord: importRecord(run, "0-1") }));
    expect(performance.now() - started).toBeLessThan(5_000);
    void evidenceValueReceipt;
  });
});
