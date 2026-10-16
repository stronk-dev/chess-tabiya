// Accepted Review §4.5: real complete recorded source execution, not moments or learner delivery.
import { createHash } from "node:crypto";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it, vi } from "vitest";
import { branchPath } from "./branch-path.js";
import { attachEvidence } from "./evidence.js";
import { evidenceDigest } from "./evidence-contract.js";
import * as routes from "./internal/evidence-value-routes.js";
import { exactLegalMoves } from "./legal-moves.js";
import { createRecordedReviewBoundarySourceOwner } from "./recorded-review-boundary.js";
import { createRecordedPivotalSource } from "./pivotal.js";
import { collectRecordedReviewSourcePopulation, readRecordedReviewSourcePopulation, readRecordedLastLevelPopulation,
  RECORDED_REVIEW_SOURCE_ADAPTER_IDS, REVIEW_PACKET_SOURCE_ADAPTERS, type ReviewProviderNodeState, type ReviewSourceContext } from "./review-evidence.js";
import { fork, rewind, commitMove, createRun, appendOpponentPly } from "./runtime.js";
import type { ShapeTriggerSource } from "./shape-firing.js";
import { importedRun, play, evaluationDelivery, START_FEN, REVIEW_AT as at } from "./testing/review-evidence-fixture.js";
import type { DrillRun } from "./types.js";

const IDS = ["review.source.position@1", "review.source.consequence@1", "review.source.imported_result@1", "review.source.eval_point@1",
  "review.source.eval_delta@2", "review.source.mate_transition@2", "review.source.pivotal.irreversibility@1", "review.source.pivotal.phase_change@2",
  "review.source.pivotal.human_divergence@2", "review.source.pivotal.option_collapse@2", "review.source.endgame@1", "review.source.shapes@1"].sort();
const LINE = ["e2e4", "e7e5", "g1f3", "b8c6", "f3g1", "g8f6"];
function fixture(side: "white" | "black" = "white", result = "0-1" as "0-1" | "1-0" | "*", moves = LINE) {
  let run = play(importedRun("complete-recorded-review", side), moves);
  const main = run.activeCursor.branchId, path = branchPath(run, main);
  const record = { runId: run.id, result, movetextDigest: `sha256:${createHash("sha256").update(canonicalizeJson({ rootFen: path[0]!.fen, uci: path.slice(1).map(node => node.moveUci) })).digest("hex")}` };
  const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => record });
  const engine = new Map<string, ReviewProviderNodeState>(), shapes: ShapeTriggerSource[] = [];
  const context = { engine, shapes };
  const boundary = (nodeId = path.at(-1)!.id, branchId = main) => owner.resolve({ runId: run.id, branchId, throughNodeId: nodeId });
  return { get run() { return run; }, path, main, record, context, engine, shapes, owner, boundary, setRun: (value: DrillRun) => { run = value; },
    collect: (source = boundary(), inputs: ReviewSourceContext = context) => collectRecordedReviewSourcePopulation({ boundary: source, context: inputs }),
    deliver: (index: number, score = "cp 20") => {
      const delivery = routes.invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery: evaluationDelivery(path[index]!.fen, score) });
      engine.set(path[index]!.id, { kind: "delivered", delivery }); return delivery;
    } };
}
const dataFor = (f: ReturnType<typeof fixture>, nodeId = f.path.at(-1)!.id) => readRecordedReviewSourcePopulation(f.collect(f.boundary(nodeId)));
const slotAt = (data: ReturnType<typeof readRecordedReviewSourcePopulation>, adapter: string, nodeId: string) => data.results.find(row => row.slot.adapterId === `review.source.${adapter}` && row.slot.nodeId === nodeId)!;

describe("complete recorded Review source population", () => {
  it.each(["white", "black"] as const)("executes all twelve exact adapters and only applicable original slots at every prefix: %s", side => {
    const f = fixture(side); expect(RECORDED_REVIEW_SOURCE_ADAPTER_IDS).toEqual(IDS);
    for (const [index, node] of f.path.entries()) {
      const data = dataFor(f, node.id), count = index + 1;
      expect(data.plan).toHaveLength(12 * count - 2); expect(data.results).toHaveLength(data.plan.length);
      expect(new Set(data.plan.map(slot => slot.adapterId))).toEqual(new Set(IDS.filter(id => index > 0 || !["review.source.eval_delta@2", "review.source.mate_transition@2"].includes(id))));
      for (const [ordinal, result] of data.results.entries()) {
        expect(result.slot).toBe(data.plan[ordinal]); expect(result.slot.window).toBe(f.path.findIndex(node => node.id === result.slot.nodeId));
        const adapter = REVIEW_PACKET_SOURCE_ADAPTERS.find(adapter => adapter.id === result.slot.adapterId)!;
        for (const item of result.items) { expect(item.projection).toEqual(adapter.projection); adapter.parser(item.payload); }
        if (result.slot.grain === "incoming_edge") { expect(result.slot.nodeId).not.toBe(f.path[0]!.id); expect(result.slot.fromNodeId).toBe(f.path[result.slot.window - 1]!.id); }
        else expect(result.slot.fromNodeId).toBeNull();
      }
      for (const original of f.path.slice(0, count)) {
        const result = slotAt(data, "imported_result@1", original.id);
        expect(result.state.kind).toBe(index === f.path.length - 1 && original.id === node.id ? "available" : "honest_empty");
        expect(slotAt(data, "consequence@1", original.id).state).toEqual({ kind: "honest_empty", reason: "no_observation" });
      }
      const last = readRecordedLastLevelPopulation(data.lastLevelPopulation);
      for (const row of last.rows) {
        expect(row.position).toBe(slotAt(data, "position@1", row.position.payload.nodeId).items[0]);
        expect(row.points).toBe(slotAt(data, "eval_point@1", row.position.payload.nodeId).items);
      }
      expect(last.result).toBe(slotAt(data, "imported_result@1", node.id));
    }
  });

  it("executes shared sources once, reuses actual point/result slots for last-level, and reads without dispatch", () => {
    const f = fixture(); f.path.forEach((_, index) => f.deliver(index));
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      const population = f.collect(), data = readRecordedReviewSourcePopulation(population), refs = invoke.mock.calls.map(call => call[0]);
      for (const ref of ["run.record.position@1", "derived.review.eval_point@1", "rules.endgame.classification@1"]) expect(refs.filter(value => value === ref)).toHaveLength(f.path.length);
      for (const ref of ["run.record.imported_result@1", "run.record.consequence@1", "theory.shapes.firing@1", "derived.pivotal.irreversibility@1", "derived.pivotal.phase_change@2", "derived.pivotal.human_divergence@2", "derived.pivotal.option_collapse@2"]) expect(refs.filter(value => value === ref)).toHaveLength(1);
      expect(refs.some(value => value === "derived.story.last_level@2" || value.startsWith("derived.story.rank") || value.startsWith("derived.story.title") || value.startsWith("human.") || value.startsWith("live."))).toBe(false);
      invoke.mockClear(); expect(readRecordedReviewSourcePopulation(population)).toBe(data); expect(invoke).not.toHaveBeenCalled();
    } finally { invoke.mockRestore(); }
  });

  it("folds missing/mixed human telemetry per node while retaining other nodes and sibling origins", () => {
    let run = createRun({ id: "real-recorded-human-replies", session: { kind: "position", start: { fen: START_FEN, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    const root = run.activeCursor.nodeId, main = run.activeCursor.branchId;
    const reply = (moveUci: string, missing = false) => {
      const fen = run.nodes.find(node => node.id === run.activeCursor.nodeId)!.fen;
      const moves = [moveUci, ...exactLegalMoves(fen).map(move => move.uci).filter(move => move !== moveUci).slice(0, 2)];
      run = appendOpponentPly(run, { moveUci, policyModeApplied: "human_common", engine: { id: "synthetic-maia", name: "Synthetic recorded model", version: "fixture", seedHonored: false },
        ...(missing ? {} : { candidates: moves.map((moveUci, index) => ({ moveUci, rank: index + 1, mass: [0.4, 0.3, 0.3][index]! })) }) }, { at }).run;
    };
    reply("e2e4"); const quiet = run.activeCursor.nodeId;
    run = commitMove(run, "e7e5", { at }).run; const child = run.activeCursor.nodeId;
    reply("g1f3"); run = commitMove(run, "b8c6", { at }).run; const endpoint = run.activeCursor.nodeId;
    run = fork(rewind(run, root, at).run, root, { at, label: "missing root report" }).run; reply("d2d4", true);
    run = fork(rewind(run, child, at, undefined, main).run, child, { at, label: "shared later observation" }).run; reply("g2g3");
    const owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => undefined });
    const boundary = owner.resolve({ runId: run.id, branchId: main, throughNodeId: endpoint });
    const data = readRecordedReviewSourcePopulation(collectRecordedReviewSourcePopulation({ boundary, context: { engine: new Map(), shapes: [] } }));
    expect(slotAt(data, "pivotal.human_divergence@2", root)).toMatchObject({ state: { kind: "unavailable", reason: "input_abstained" }, items: [] });
    expect(slotAt(data, "pivotal.human_divergence@2", child).items).toHaveLength(2);
    expect(slotAt(data, "pivotal.human_divergence@2", quiet)).toMatchObject({ state: { kind: "honest_empty", reason: "no_observation" }, items: [] });
    expect(slotAt(data, "position@1", root).items).toHaveLength(1);
  });

  it("computes shape spans on the actual prefix and isolates complete mutable trigger inputs", () => {
    const f = fixture(), trigger = { kind: "pieceOnSquare" as const, square: "f3" as const, piece: { color: "white" as const, role: "knight" as const } };
    f.shapes.push({ id: "knight-route", trigger });
    const population = f.collect(f.boundary(f.path[3]!.id)), short = readRecordedReviewSourcePopulation(population);
    expect(slotAt(short, "shapes@1", f.path[3]!.id).items[0]!.payload).toEqual({ entryId: "knight-route", firstNodeId: f.path[3]!.id, lastNodeId: f.path[3]!.id, openEnded: true });
    const full = dataFor(f);
    expect(slotAt(full, "shapes@1", f.path[3]!.id).items[0]!.payload).toEqual({ entryId: "knight-route", firstNodeId: f.path[3]!.id, lastNodeId: f.path[4]!.id, openEnded: false });
    (trigger as { square: string }).square = "a1"; f.shapes.length = 0;
    expect(readRecordedReviewSourcePopulation(population)).toBe(short); expect(short.shapes[0]!.trigger).toMatchObject({ square: "f3" });
    expect(Reflect.set(short.shapes[0]!.trigger, "square", "a1")).toBe(false);
  });

  it("retains exact provider states, failed delivery joins and typed mate transitions without cp sentinels", () => {
    const f = fixture(); f.deliver(0, "cp 50"); f.deliver(1, "mate 3"); f.deliver(2, "cp -40");
    f.engine.set(f.path[3]!.id, { kind: "pending", jobCount: 3, retrying: 2 }); f.engine.set(f.path[4]!.id, { kind: "unavailable", reason: "provider_off" });
    const foreign = f.deliver(6); f.engine.set(f.path[5]!.id, { kind: "delivered", delivery: foreign }); f.engine.set(f.path[6]!.id, { kind: "not_yet_scheduled" });
    const data = dataFor(f), last = readRecordedLastLevelPopulation(data.lastLevelPopulation);
    expect(slotAt(data, "eval_delta@2", f.path[1]!.id).state).toEqual({ kind: "honest_empty", reason: "no_observation" });
    expect(slotAt(data, "mate_transition@2", f.path[1]!.id).items[0]!.payload).toMatchObject({ projectionId: "derived.review.mate_transition@2" });
    expect(slotAt(data, "eval_delta@2", f.path[3]!.id).state).toEqual({ kind: "pending", jobCount: 3, retrying: 2 });
    expect(last.rows[5]).toMatchObject({ provider: { kind: "delivered", delivery: foreign }, state: { kind: "unavailable", reason: "input_abstained" }, points: [] });
    expect(slotAt(data, "eval_point@1", f.path[6]!.id).state).toEqual({ kind: "not_yet_scheduled" });
  });

  it.each(["white", "black"] as const)("retains genuine on-prefix board outcomes, not imported-result or later-terminal substitutes: %s", side => {
    const f = fixture(side, "0-1", ["f2f3", "e7e5", "g2g4", "d8h4"]), tip = f.path.at(-1)!.id;
    const full = dataFor(f), earlier = dataFor(f, f.path.at(-2)!.id);
    expect(full.boundary.outcome).toMatchObject({ kind: "board_terminal", nodeId: tip, result: side === "white" ? "loss" : "win" });
    expect(slotAt(full, "consequence@1", tip).items).toHaveLength(1); expect(slotAt(full, "imported_result@1", tip).items).toEqual([]);
    expect(earlier.boundary.outcome).toEqual({ kind: "unfinished" });
    expect(earlier.results.filter(row => row.slot.adapterId === "review.source.consequence@1").every(row => row.items.length === 0)).toBe(true);
    expect(readRecordedLastLevelPopulation(full.lastLevelPopulation).outcome.kind).toBe("board_terminal");
  });

  it.each(["pivotal", "endgame", "shapes"] as const)("refuses genuine foreign complete empty source invocations: %s", family => {
    const f = fixture(), original = routes.invokeEvidenceValueRoute;
    const foreign = createRecordedPivotalSource({ run: f.run, branchId: f.main, throughNodeId: f.path[0]!.id, kind: "phase_change" });
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: { entries?: readonly ShapeTriggerSource[]; path?: unknown }) =>
      family === "pivotal" && ref === "derived.pivotal.phase_change@2" ? original("derived.pivotal.phase_change@2", { recordedPivotal: foreign })
        : family === "endgame" && ref === "rules.endgame.classification@1" ? original("rules.endgame.classification@1", { fen: f.path[1]!.fen })
        : family === "shapes" && ref === "theory.shapes.firing@1" ? original(ref, { ...input, entries: [...input.entries!] } as never)
        : original(ref as never, input as never)) as typeof original);
    try { expect(() => f.collect()).toThrow(/original|invocation/u); } finally { invoke.mockRestore(); }
  });

  it.each(["derived.review.eval_delta@2", "derived.review.mate_transition@2"] as const)("refuses genuine transition results over another execution's equal-image endpoints: %s", route => {
    const f = fixture(); f.path.forEach((_, index) => f.deliver(index));
    const earlier = readRecordedLastLevelPopulation(dataFor(f).lastLevelPopulation), original = routes.invokeEvidenceValueRoute;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => ref === route
      ? original(route, { before: earlier.rows[0]!.points[0]!, after: earlier.rows[1]!.points[0]! }) : original(ref as never, input as never)) as typeof original);
    try { expect(() => f.collect()).toThrow(/actual endpoint inputs/u); } finally { invoke.mockRestore(); }
  });

  it("propagates actual source lookup failure instead of folding it into no-observation", () => {
    const f = fixture(), original = routes.invokeEvidenceValueRoute;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      if (ref === "rules.endgame.classification@1") throw new Error("fixture source lookup failed");
      return original(ref as never, input as never);
    }) as typeof original);
    try { expect(() => f.collect()).toThrow("fixture source lookup failed"); } finally { invoke.mockRestore(); }
  });

  it.each(["derived.pivotal.irreversibility@1", "derived.pivotal.phase_change@2", "derived.pivotal.human_divergence@2", "derived.pivotal.option_collapse@2", "rules.endgame.classification@1", "theory.shapes.firing@1", "run.record.consequence@1", "run.record.imported_result@1"] as const)("refuses copied complete/empty source results, not just malformed positive items: %s", route => {
    const f = fixture(), original = routes.invokeEvidenceValueRoute;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      const result = original(ref as never, input as never); return ref === route ? Object.freeze([...(result as readonly unknown[])]) : result;
    }) as typeof original);
    try { expect(() => f.collect()).toThrow(/original|invocation/u); } finally { invoke.mockRestore(); }
  });

  it.each(["derived.review.eval_delta@2", "derived.review.mate_transition@2"] as const)("refuses copied transition availability even when it means completed nonmatch: %s", route => {
    const f = fixture(); f.path.forEach((_, index) => f.deliver(index)); const original = routes.invokeEvidenceValueRoute;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => { const result = original(ref as never, input as never); return ref === route ? { ...(result as object) } : result; }) as typeof original);
    try { expect(() => f.collect()).toThrow(/original factory/u); } finally { invoke.mockRestore(); }
  });

  it.each(["duplicate", "extra", "accessor"] as const)("refuses malformed captured shape context before collector dispatch: %s", fault => {
    const f = fixture(), shape = { id: "root", trigger: { kind: "pieceOnSquare", square: "a1", piece: null } };
    const shapes = fault === "duplicate" ? [shape, shape] : fault === "extra" ? [{ ...shape, extra: true }] : [Object.defineProperty({ trigger: shape.trigger }, "id", { enumerable: true, get: () => "root" })];
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { expect(() => f.collect(f.boundary(), { engine: f.engine, shapes } as never)).toThrow(/shape inputs/u); expect(invoke).not.toHaveBeenCalled(); } finally { invoke.mockRestore(); }
  });

  it("refuses copied/raw/foreign public execution contexts and population reconstructions before work", () => {
    const f = fixture(), boundary = f.boundary(), population = f.collect(boundary), data = readRecordedReviewSourcePopulation(population);
    for (const value of [{ ...population }, JSON.parse(JSON.stringify(population)), data, data.lastLevelPopulation, boundary, null]) expect(() => readRecordedReviewSourcePopulation(value as never)).toThrow();
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try {
      for (const adapter of REVIEW_PACKET_SOURCE_ADAPTERS) expect(() => adapter.operation(data.plan[0]!, { kind: "recorded", recordedReview: boundary } as never)).toThrow(/not issued/u);
      expect(() => f.collect({ ...boundary })).toThrow();
      expect(() => collectRecordedReviewSourcePopulation({ boundary, context: f.context, results: data.results } as never)).toThrow();
      expect(invoke).not.toHaveBeenCalled();
    } finally { invoke.mockRestore(); }
  });

  it("rechecks real storage before/after source work and never turns a changed head into an empty result", () => {
    const f = fixture(), boundary = f.boundary(), original = routes.invokeEvidenceValueRoute; let changed = false;
    const invoke = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: unknown) => {
      const result = original(ref as never, input as never);
      if (!changed) { changed = true; f.setRun(attachEvidence(f.run, f.path[0]!.id, ["synthetic:source-change"], { kind: "eval", source: "engine_validated", values: { centipawns: 21 } }, at).run); }
      return result;
    }) as typeof original);
    try { expect(() => f.collect(boundary)).toThrow(/no longer/u); } finally { invoke.mockRestore(); }
    const current = f.collect(), saved = evidenceDigest(readRecordedReviewSourcePopulation(current));
    f.setRun(attachEvidence(f.run, f.path[0]!.id, ["synthetic:second-change"], { kind: "eval", source: "engine_validated", values: { centipawns: 22 } }, at).run);
    expect(() => readRecordedReviewSourcePopulation(current)).toThrow(/no longer/u); expect(saved).toBeTypeOf("string");
  });
});
