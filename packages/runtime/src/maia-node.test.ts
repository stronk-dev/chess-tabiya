import { describe, expect, it } from "vitest";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { invokeRunRecordPosition as recordedPositionEvidence } from "./evidence-operations.js";
import { invokeEvidenceValueRoute, readMaiaNodeInvocation, evidenceValueRouteRegistry } from "./internal/evidence-value-routes.js";
import { digestRunEventHead, resolveRunSubject } from "./run-subject.js";
import { commitMove, fork, rewind } from "./runtime.js";
import { FIXTURE_AT, START_FEN } from "./provider-test-fixtures.js";
import { nodeTask, occurrenceRun } from "./testing/maia-occurrence-fixture.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { EvidenceAvailability } from "./evidence-factories.js";
import type { MaiaNodeDistribution, MaiaNodeCandidateWdl } from "./maia-node.js";

const distribution = "derived.maia.node_distribution@1";
const candidateWdl = "derived.maia.node_candidate_wdl@1";
function fixture(moves: readonly string[] = [], lines?: readonly string[], startFen = START_FEN) {
  const run = occurrenceRun(moves, "maia-node-fixture", startFen), node = run.nodes.at(-1)!;
  const resolved = resolveRunSubject(run, { kind: "run_node", runId: run.id, branchId: node.branchId, nodeId: node.id,
    eventHeadDigest: digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events }) });
  const position = recordedPositionEvidence(resolved.run, node.id);
  const task = nodeTask({ kind: "history_conditioned", startFen: run.start.fen, historyUci: moves }, lines);
  return { task, position, resolved };
}
// Before the exact routes land, real positive traversals must fail rather than crediting negatives.
function invoke(route: typeof distribution, input: unknown): DeclaredEvidence<MaiaNodeDistribution>;
function invoke(route: typeof candidateWdl, input: unknown): EvidenceAvailability<DeclaredEvidence<MaiaNodeCandidateWdl>>;
function invoke(route: typeof distribution | typeof candidateWdl, input: unknown): unknown;
function invoke(route: typeof distribution | typeof candidateWdl, input: unknown): unknown {
  return invokeEvidenceValueRoute(route, input as never);
}

describe("accepted exact requested-node Maia derivations", () => {
  it("registers the literal closed factory arms and result kinds", () => {
    const registry = evidenceValueRouteRegistry();
    for (const [route, result] of [[distribution, "single"], [candidateWdl, "availability"]] as const) {
      const row = registry.find(item => item.route === route)!;
      expect(row.result).toBe(result); expect(row.shape).toBe("derived"); expect(row.arms).toHaveLength(1);
      expect(Object.keys(row.arms[0]!).sort()).toEqual(["position", "resolved", "task"]);
    }
  });
  it("retains the original task and position, rank gaps and unknown mass without sampled/off-window operands", () => {
    const input = fixture(), value = invoke(distribution, input);
    expect(value.payload.task).toBe(input.task); expect(value.payload.position).toBe(input.position);
    expect(value.payload.candidates).toEqual([{ moveUci: "e2e4", rank: 1, mass: 0.4 }, { moveUci: "d2d4", rank: 3, mass: null }]);
    expect(value.payload.nodeId).toBe(input.resolved.subject.kind === "run_node" ? input.resolved.subject.nodeId : "unreachable");
    expect(value.payload.coverage).toBe("bounded_reported_window");
    expect(value.payload.engine.eloApplied).toBe(1500); expect(value.payload.requestedBand).toBe(1500);
    expect(value.payload.engine).toMatchObject({ eloHonored: true, modelId: input.task.payload.acquisition.actualIdentity.modelId });
    expect(Object.keys(value.payload).sort()).toEqual(["task", "position", "nodeId", "branchId", "eventHeadDigest", "engine", "requestedBand", "appliedBand", "coverage", "candidates"].sort());
    expect(evidenceValueReceipt(value).sourceDigests).toEqual([evidenceValueReceipt(input.task).payloadDigest, evidenceValueReceipt(input.position).payloadDigest]);
    expect(evidenceValueReceipt(value).factory).toBe("createDerivedMaiaNodeDistributionV1Evidence");
    expect(Object.isFrozen(value.payload.candidates)).toBe(true);
  });

  it("keeps the independent same-row candidate WDL only, including actual zeros and no sample", () => {
    const input = fixture([], ["info multipv 1 score cp 12 wdl 0 1000 0 pv e2e4", "info multipv 3 policy 0.2 pv d2d4", "bestmove g1f3"]);
    const value = invoke(candidateWdl, input);
    if (value.kind !== "available") throw new Error("fixture must retain reported WDL");
    expect(value.kind).toBe("available"); expect(value.value.payload.task).toBe(input.task); expect(value.value.payload.position).toBe(input.position);
    expect(value.value.payload.candidates).toEqual([{ moveUci: "e2e4", rank: 1, wdl: { win: 0, draw: 1000, loss: 0 } }]);
    expect(Object.keys(value.value.payload).sort()).toEqual(["task", "position", "nodeId", "engine", "requestedBand", "appliedBand", "candidates"].sort());
    expect(evidenceValueReceipt(value.value).sourceDigests).toEqual([evidenceValueReceipt(input.task).payloadDigest, evidenceValueReceipt(input.position).payloadDigest]);
  });

  it("keeps empty windows and absent WDL distinct from zero/missing mass, without resampling", () => {
    const empty = fixture([], ["bestmove e2e4"]);
    expect(invoke(distribution, empty).payload.candidates).toEqual([]);
    expect(invoke(candidateWdl, empty)).toEqual({ kind: "unavailable", reason: "empty_population" });
    const missing = fixture([], ["info multipv 1 policy 0 pv e2e4", "info multipv 3 pv d2d4", "bestmove g1f3"]);
    expect(invoke(distribution, missing).payload.candidates).toEqual([{ moveUci: "e2e4", rank: 1, mass: 0 }, { moveUci: "d2d4", rank: 3, mass: null }]);
    expect(invoke(candidateWdl, missing)).toEqual({ kind: "unavailable", reason: "empty_population" });
  });

  it("retains authentic original invocations for zero-row and unavailable results, not byte-equal copies", () => {
    const input = fixture([], ["bestmove e2e4"]), empty = invoke(distribution, input), absent = invoke(candidateWdl, input);
    for (const result of [empty, absent]) {
      const original = readMaiaNodeInvocation(result);
      expect(original.task).toBe(input.task); expect(original.position).toBe(input.position); expect(original.resolved).toBe(input.resolved);
      expect(() => readMaiaNodeInvocation({ ...result })).toThrow();
      expect(() => readMaiaNodeInvocation(JSON.parse(JSON.stringify(result)))).toThrow();
    }
    const reported = fixture(), value = invoke(candidateWdl, reported);
    if (value.kind !== "available") throw new Error("fixture needs WDL");
    expect(readMaiaNodeInvocation(value).task).toBe(reported.task);
    expect(readMaiaNodeInvocation(value.value).position).toBe(reported.position);
  });

  it("admits an authentic rules-terminal empty task without inventing a playable move", () => {
    const input = fixture(["g1f2"], ["bestmove (none)"], "8/8/8/8/8/8/5n2/k5BK w - - 0 1");
    expect(invoke(distribution, input).payload.candidates).toEqual([]);
    expect(invoke(candidateWdl, input)).toEqual({ kind: "unavailable", reason: "empty_population" });
    expect(input.task.payload.payload.termination.moveUci).toBeNull();
  });

  it("selects a historical requested node rather than a newer active cursor", () => {
    const input = fixture(["e2e4"], ["info multipv 1 pv e7e5", "bestmove c7c5"]);
    const current = commitMove(input.resolved.run, "e7e5", { at: FIXTURE_AT }).run;
    const subject = input.resolved.subject;
    if (subject.kind !== "run_node") throw new Error("fixture needs node subject");
    const { fen: _fen, ...ref } = subject;
    const historical = resolveRunSubject(current, ref);
    const value = invoke(distribution, { ...input, resolved: historical });
    expect(value.payload.task).toBe(input.task); expect(value.payload.position.payload.fen).toBe(input.position.payload.fen);
    expect(value.payload.eventHeadDigest).toBe(subject.eventHeadDigest);
    expect(() => invoke(distribution, { ...input, position: recordedPositionEvidence(current, input.position.payload.nodeId), resolved: historical })).toThrow();
  });

  it.each([distribution, candidateWdl] as const)("%s refuses same-FEN transposed histories, preceding-edge tasks and exact-FEN substitutes", route => {
    const a = ["g1f3", "g8f6", "b1c3", "b8c6"], b = ["b1c3", "b8c6", "g1f3", "g8f6"];
    const input = fixture(a, ["info multipv 1 pv e2e4", "bestmove d2d4"]);
    expect(input.position.payload.fen).toBe(occurrenceRun(b).nodes.at(-1)!.fen);
    for (const task of [nodeTask({ kind: "history_conditioned", startFen: START_FEN, historyUci: b }, ["bestmove e2e4"]),
      nodeTask({ kind: "exact_fen", fen: input.position.payload.fen }, ["bestmove e2e4"]),
      nodeTask({ kind: "history_conditioned", startFen: START_FEN, historyUci: a.slice(0, -1) }, ["bestmove b8c6"])]) {
      expect(() => invoke(route, { ...input, task })).toThrow();
    }
    expect(() => invoke(route, { ...input, task: nodeTask({ kind: "history_conditioned", startFen: START_FEN.replace("0 1", "1 1"), historyUci: a }, ["bestmove e2e4"]) })).toThrow();
  });

  it.each([distribution, candidateWdl] as const)("%s refuses genuine foreign head/run/branch/position invocations, copies and open arms", route => {
    const input = fixture(), foreignRun = occurrenceRun([], "other-run"), foreignPosition = recordedPositionEvidence(foreignRun, foreignRun.nodes[0]!.id);
    const moved = commitMove(input.resolved.run, "e2e4", { at: FIXTURE_AT }).run;
    const branched = fork(rewind(moved, moved.nodes[0]!.id, FIXTURE_AT).run, moved.nodes[0]!.id, { at: FIXTURE_AT }).run;
    const otherResolved = resolveRunSubject(branched, { kind: "run_node", runId: branched.id, branchId: branched.activeCursor.branchId, nodeId: branched.nodes[0]!.id,
      eventHeadDigest: digestRunEventHead({ runId: branched.id, headSeq: branched.events.length, events: branched.events }) });
    for (const value of [{ ...input, position: foreignPosition }, { ...input, position: recordedPositionEvidence(moved, moved.nodes[0]!.id) },
      { ...input, resolved: otherResolved }, { ...input, resolved: { ...input.resolved } }, { ...input, position: { ...input.position } },
      { ...input, task: { ...input.task } }, { ...input, task: JSON.parse(JSON.stringify(input.task)) }, { ...input, observedMoveUci: "e2e4" },
      { ...input, historyUci: [] }, { ...input, page: input.task }]) expect(() => invoke(route, value)).toThrow();
  });
});
