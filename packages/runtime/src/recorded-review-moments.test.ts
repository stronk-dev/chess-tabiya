import { describe, expect, it, vi } from "vitest";
import { attachEvidence } from "./evidence.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import * as routes from "./internal/evidence-value-routes.js";
import { readLastLevelReductionResult } from "./internal/last-level-reduction-authority.js";
import { assembleReviewMoments, orderedReviewEvidence } from "./internal/review-moment-assembly.js";
import { collectRecordedReviewMoments, readRecordedReviewMoments } from "./recorded-review-moments.js";
import { collectRecordedReviewSourcePopulation, readRecordedReviewSourcePopulation, reviewPacketForRun } from "./review-evidence.js";
import { reviewStoryMoments, rankStoryMoments } from "./story.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";
import { REVIEW_AT, evaluationDelivery, START_FEN } from "./testing/review-evidence-fixture.js";
import { createRecordedReviewBoundarySourceOwner } from "./recorded-review-boundary.js";
import { createRun, commitMove, appendOpponentPly, rewind, fork } from "./runtime.js";
import { exactLegalMoves } from "./legal-moves.js";
import type { ShapeTriggerSource } from "./shape-firing.js";

function fixture(side: "white" | "black" = "white", result = "0-1" as "0-1" | "1-0" | "*" | "1/2-1/2", moves?: string[], fen?: string) {
  const f = recordedLastLevelFixture(side, result, "actual-review-moments", moves, fen), shapes: ShapeTriggerSource[] = [];
  const context = { engine: f.engine, shapes };
  const population = (nodeId = f.path.at(-1)!.id) => collectRecordedReviewSourcePopulation({ boundary: f.boundary(nodeId), context });
  return { ...f, shapes, context, population, collect: (nodeId?: string) => collectRecordedReviewMoments({ population: population(nodeId) }),
    whiteCp: (index: number, cp: number) => f.deliver(index, `cp ${f.path[index]!.fen.split(" ")[1] === "w" ? cp : -cp}`) };
}
const plain = (moment: ReturnType<typeof readRecordedReviewMoments>["moments"][number]) => ({ ...moment,
  evidence: moment.evidence.map(item => ({ id: item.projection.id, payload: item.payload })) });

describe("actual recorded Review unrendered moment source", () => {
  it.each(["white", "black"] as const)("shares full-tip current Story assembly and exact ordinal/edge groups: %s", side => {
    const f = fixture(side, side === "white" ? "0-1" : "1-0");
    [300, 151, 0, -151, -301].forEach((cp, index) => f.whiteCp(index, cp));
    f.shapes.push({ id: "f3-arrival", trigger: { kind: "pieceOnSquare", square: "f3", piece: { color: "white", role: "knight" } } });
    const population = f.population(), source = collectRecordedReviewMoments({ population }), data = readRecordedReviewMoments(source);
    const old = reviewStoryMoments(reviewPacketForRun(f.run, f.run.activeCursor.branchId, { ...f.context, importRecord: f.record }));
    // Source versions deliberately differ; factual payloads and actual moment construction do not.
    expect(data.moments.map(plain)).toEqual(old.moments.map(({ components: _c, sentences: _s, ...moment }) => plain(moment)));
    expect(rankStoryMoments(data.moments)).toEqual(old.rank);
    expect(data.population).toBe(readRecordedReviewSourcePopulation(population));
    for (const [ordinal, group] of data.groups.entries()) {
      const index = f.path.findIndex(node => node.id === group.nodeId), moment = data.moments[ordinal]!;
      expect(Object.keys(group).sort()).toEqual(["ordinal", "nodeId", "decisionNodeId", "evidenceNodeId", "stopNodeId", "ply", "kinds", "evaluation", "evidence"].sort());
      expect(group).toMatchObject({ ordinal, nodeId: f.path[index]!.id, decisionNodeId: f.path[index - 1]!.id, evidenceNodeId: f.path[index]!.id, stopNodeId: f.path[index]!.id, ply: f.path[index]!.ply });
      expect(group.evidence).toBe(moment.evidence); expect(group.kinds).toBe(moment.kinds); expect(group.evaluation).toBe(moment.evaluation);
      expect(Object.isFrozen(group)).toBe(true); expect(Object.keys(moment)).not.toContain("sentences"); expect(Object.keys(moment)).not.toContain("components");
    }
  });

  it.each(["white", "black"] as const)("every earlier prefix excludes later result/shape/last-level operands: %s", side => {
    const f = fixture(side); f.path.forEach((_, index) => f.whiteCp(index, index * 160));
    f.shapes.push({ id: "later-f3", trigger: { kind: "pieceOnSquare", square: "f3", piece: { color: "white", role: "knight" } } });
    for (const [end, node] of f.path.entries()) {
      const data = readRecordedReviewMoments(f.collect(node.id)), ids = new Set(f.path.slice(0, end + 1).map(node => node.id));
      expect(data.moments.every(moment => ids.has(moment.nodeId) && moment.nodeId !== f.path[0]!.id)).toBe(true);
      expect(data.population.plan).toHaveLength(12 * (end + 1) - 2);
      expect(data.lastLevelReduction.receipt).toBe(readLastLevelReductionResult(data.lastLevelReduction.items, data.population.lastLevelPopulation).reduction);
      if (end < f.path.length - 1) { expect(data.lastLevelReduction.items).toEqual([]); expect(data.moments.flatMap(moment => moment.kinds)).not.toContain("outcome"); }
      if (end < 3) expect(data.moments.flatMap(moment => moment.kinds)).not.toContain("shape_span");
      else expect(data.moments.flatMap(moment => moment.evidence).find(item => item.projection.id === "theory.shapes.firing")!.payload).toMatchObject({ lastNodeId: node.id, openEnded: true });
    }
  });

  it("uses the inclusive 150-cp gate and retains below-threshold transition sources", () => {
    const f = fixture("white", "*"); [0, 149, 299, 450, 450].forEach((cp, index) => f.whiteCp(index, cp));
    const data = readRecordedReviewMoments(f.collect());
    expect(data.moments.filter(moment => moment.kinds.includes("eval_pivot")).map(moment => moment.nodeId)).toEqual([f.path[2]!.id, f.path[3]!.id]);
    expect(data.population.results.filter(result => result.slot.adapterId === "review.source.eval_delta@2").flatMap(result => result.items).map(item => (item.payload as { deltaCp: number }).deltaCp)).toEqual([149, 150, 151, 0]);
    expect(data.groups.find(group => group.nodeId === f.path[2]!.id)!.evaluation).toEqual({ before: { kind: "centipawns", value: 149 }, after: { kind: "centipawns", value: 299 } });
  });

  it("keeps typed mate endpoints rather than manufacturing centipawn comparisons", () => {
    const f = fixture("white", "*"); f.deliver(0, "cp 40"); f.deliver(1, "mate -3"); f.deliver(2, "mate 2"); f.deliver(3, "cp 40");
    const data = readRecordedReviewMoments(f.collect()), transitions = data.moments.filter(moment => moment.kinds.includes("mate_transition"));
    expect(transitions).toHaveLength(3); expect(transitions[0]!.evaluation).toEqual({ before: { kind: "centipawns", value: 40 }, after: { kind: "mate", distance: 3, side: "white", unit: "moves" } });
    expect(data.moments.some(moment => moment.kinds.includes("eval_pivot"))).toBe(false);
    for (const moment of transitions) expect(moment.evidence.some(item => item.projection.id === "derived.review.mate_transition")).toBe(true);
  });

  it.each(["*", "1-0", "1/2-1/2"] as const)("executes and retains the genuine empty calculation even for ineligible outcome %s", result => {
    const f = fixture("white", result); const population = f.population(), invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const source = collectRecordedReviewMoments({ population }), data = readRecordedReviewMoments(source);
      expect(invoke.mock.calls.map(call => call[0])).toEqual(["derived.story.last_level@2"]);
      expect(data.lastLevelReduction.items).toEqual([]); expect(data.lastLevelReduction.convention.refs.map(ref => `${ref.id}@${ref.version}`)).toContain("story-last-level@1");
      invoke.mockClear(); expect(readRecordedReviewMoments(source)).toBe(data); expect(invoke).not.toHaveBeenCalled();
    } finally { invoke.mockRestore(); }
  });

  it("keeps a root-only selected result and its proof while omitting the root moment", () => {
    const f = fixture("white", "0-1", []); f.whiteCp(0, 50);
    const data = readRecordedReviewMoments(f.collect()); expect(data.moments).toEqual([]); expect(data.groups).toEqual([]);
    expect(data.lastLevelReduction.items).toHaveLength(1); expect(data.lastLevelReduction.items[0]!.nodeId).toBe(f.path[0]!.id);
    expect(data.lastLevelReduction.receipt.occurrences.length).toBeGreaterThan(0);
  });

  it("does not move root endgame entry to a later visible group", () => {
    const f = fixture("white", "*", ["h2g3", "a8b8"], "k7/8/8/8/8/8/7K/7R w - - 0 1");
    const data = readRecordedReviewMoments(f.collect());
    expect(data.population.results.filter(result => result.slot.adapterId === "review.source.endgame@1")[0]!.items.length).toBeGreaterThan(0);
    expect(data.moments.flatMap(moment => moment.kinds)).not.toContain("endgame_entry");
  });

  it("retains unequal complete coverage when both unrendered moment lists are empty", () => {
    const f = fixture("white", "*", []), a = readRecordedReviewMoments(f.collect());
    f.engine.set(f.path[0]!.id, { kind: "pending", jobCount: 2, retrying: 1 }); const b = readRecordedReviewMoments(f.collect());
    expect(a.moments).toEqual(b.moments); expect(a.groups).toEqual([]); expect(a.population.results).not.toEqual(b.population.results);
    expect(a.lastLevelReduction.receipt.sourceImageDigest).not.toBe(b.lastLevelReduction.receipt.sourceImageDigest);
    expect(b.population.results.find(result => result.slot.adapterId === "review.source.eval_point@1")!.state).toEqual({ kind: "pending", jobCount: 2, retrying: 1 });
  });

  it("retains unavailable transitions beside genuine individually available points", () => {
    const f = fixture("white", "*"); f.deliver(0);
    f.engine.set(f.path[1]!.id, { kind: "delivered", delivery: routes.invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(f.path[1]!.fen, "cp -300", { generation: 2 }) }) });
    const data = readRecordedReviewMoments(f.collect());
    for (const node of f.path.slice(0, 2)) expect(data.population.results.find(result => result.slot.adapterId === "review.source.eval_point@1" && result.slot.nodeId === node.id)!.state.kind).toBe("available");
    expect(data.population.results.find(result => result.slot.adapterId === "review.source.eval_delta@2" && result.slot.nodeId === f.path[1]!.id)!.state).toEqual({ kind: "unavailable", reason: "input_abstained" });
    expect(data.moments.flatMap(moment => moment.kinds)).not.toContain("eval_pivot");
  });

  it.each([false, true])("preserves repeated same-node human evidence or the actual mixed-missing node state: missing=%s", missing => {
    let run = createRun({ id: "real-moment-human-replies", session: { kind: "position", start: { fen: START_FEN, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: REVIEW_AT });
    const main = run.activeCursor.branchId;
    const reply = (moveUci: string, absent = false) => {
      const fen = run.nodes.find(node => node.id === run.activeCursor.nodeId)!.fen;
      const moves = [moveUci, ...exactLegalMoves(fen).map(move => move.uci).filter(move => move !== moveUci).slice(0, 2)];
      run = appendOpponentPly(run, { moveUci, policyModeApplied: "human_common", engine: { id: "synthetic-maia", name: "Synthetic recorded model", version: "fixture", seedHonored: false },
        ...(absent ? {} : { candidates: moves.map((moveUci, index) => ({ moveUci, rank: index + 1, mass: [0.4, 0.3, 0.3][index]! })) }) }, { at: REVIEW_AT }).run;
    };
    reply("e2e4"); run = commitMove(run, "e7e5", { at: REVIEW_AT }).run; const anchor = run.activeCursor.nodeId;
    reply("g1f3"); run = commitMove(run, "b8c6", { at: REVIEW_AT }).run; const endpoint = run.activeCursor.nodeId;
    run = fork(rewind(run, anchor, REVIEW_AT, undefined, main).run, anchor, { at: REVIEW_AT, label: "shared later observation" }).run; reply("g2g3", missing);
    const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => undefined });
    const population = collectRecordedReviewSourcePopulation({ boundary: owner.resolve({ runId: run.id, branchId: main, throughNodeId: endpoint }), context: { engine: new Map(), shapes: [] } });
    const data = readRecordedReviewMoments(collectRecordedReviewMoments({ population }));
    const source = data.population.results.find(result => result.slot.adapterId === "review.source.pivotal.human_divergence@2" && result.slot.nodeId === anchor)!;
    const items = data.groups.find(group => group.nodeId === anchor)?.evidence.filter(item => item.projection.id === "derived.pivotal.human_divergence") ?? [];
    expect(items).toEqual(source.items); expect(items).toHaveLength(missing ? 0 : 2);
    expect(source.state.kind).toBe(missing ? "unavailable" : "available");
    if (!missing) { expect(items[0]).not.toBe(items[1]); expect(data.groups.filter(group => group.nodeId === anchor)).toHaveLength(1); }
  });

  it.each(["copy", "serialized", "raw", "extra"] as const)("refuses caller-owned source inputs before any calculation: %s", kind => {
    const f = fixture(), population = f.population();
    const bad = kind === "copy" ? { population: { ...population } } : kind === "serialized" ? { population: JSON.parse(JSON.stringify(population)) }
      : kind === "extra" ? { population, moments: [] } : { population: readRecordedReviewSourcePopulation(population) };
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { expect(() => collectRecordedReviewMoments(bad as never)).toThrow(); expect(invoke).not.toHaveBeenCalled(); } finally { invoke.mockRestore(); }
  });

  it.each(["empty", "positive"] as const)("refuses a genuine foreign last-level result, even equal-image: %s", kind => {
    const f = fixture(); if (kind === "positive") f.whiteCp(2, 20);
    const foreign = readRecordedReviewSourcePopulation(f.population()), result = routes.invokeEvidenceValueRoute("derived.story.last_level@2", { population: foreign.lastLevelPopulation });
    const population = f.population(), invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockReturnValue(result as never);
    try { expect(() => collectRecordedReviewMoments({ population })).toThrow(/original population/u); } finally { invoke.mockRestore(); }
  });

  it.each(["symbol", "nonenumerable", "accessor"] as const)("refuses non-data/extra input fields before work: %s", kind => {
    const f = fixture(), population = f.population(), getter = vi.fn(() => population), input = { population };
    if (kind === "symbol") Object.defineProperty(input, Symbol("extra"), { value: [] });
    else if (kind === "nonenumerable") Object.defineProperty(input, "moments", { value: [] });
    else Object.defineProperty(input, "population", { get: getter, enumerable: true });
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { expect(() => collectRecordedReviewMoments(input)).toThrow(/exactly/u); expect(invoke).not.toHaveBeenCalled(); expect(getter).not.toHaveBeenCalled(); }
    finally { invoke.mockRestore(); }
  });

  it("refuses storage changes during last-level calculation and after source publication", () => {
    const f = fixture(), population = f.population(), original = routes.invokeEvidenceValueRoute;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      const result = original(ref as never, input as never); f.setRun(attachEvidence(f.run, f.path[0]!.id, ["actual-change"], { kind: "eval", source: "engine_validated", values: { centipawns: 21 } }, REVIEW_AT).run); return result;
    }) as typeof original);
    try { expect(() => collectRecordedReviewMoments({ population })).toThrow(/no longer/u); } finally { invoke.mockRestore(); }
    const g = fixture(), source = g.collect(); g.setRun(attachEvidence(g.run, g.path[0]!.id, ["later-change"], { kind: "eval", source: "engine_validated", values: { centipawns: 22 } }, REVIEW_AT).run);
    expect(() => readRecordedReviewMoments(source)).toThrow(/no longer/u);
  });

  it("rejects copied moment handles and foreign/missing path relationships in the shared assembler", () => {
    const f = fixture(), source = f.collect(), data = readRecordedReviewMoments(source);
    for (const copy of [{ ...source }, JSON.parse(JSON.stringify(source)), data]) expect(() => readRecordedReviewMoments(copy as never)).toThrow(/not issued/u);
    const nodes = f.path.map(node => ({ nodeId: node.id, items: orderedReviewEvidence(data.population.results.filter(result => result.slot.nodeId === node.id).flatMap(result => result.items)) }));
    expect(() => assembleReviewMoments(f.path, nodes.slice(1), [])).toThrow(/complete ordered/u);
    expect(() => assembleReviewMoments(f.path, nodes, [{ nodeId: "foreign-node", evidence: data.moments[0]!.evidence[0]! }])).toThrow(/original source occurrence/u);
    expect(() => assembleReviewMoments(f.path.map((node, index) => index === 1 ? { ...node, parentId: null } : node), nodes, [])).toThrow(/exact recorded edge/u);
    expect(data.groups.flatMap(group => group.evidence).every(item => evidenceValueReceipt(item).factory.length > 0)).toBe(true);
  });
});
