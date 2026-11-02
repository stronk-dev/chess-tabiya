import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, declareEvidence, evidenceDigest, evidenceValueReceipt } from "./evidence-contract.js";
import { compileProjectionExecution } from "./evidence-execution.js";
import { compileProjectionExecutionV2, executionPlanDigest } from "./evidence-execution-v2.js";
import { OPENING_HISTORY_REDUCTION_CONTRACT as contract, assertEvidenceReductionDeclaration } from "./evidence-reduction-contract.js";
import { admitInstalledOpeningCatalogue, deepestOpeningReached } from "./opening-catalogue.js";
import { collectRecordedOpeningHistory, readRecordedOpeningHistory } from "./recorded-opening-history.js";
import { branchPath } from "./branch-path.js";
import { importedRun, play } from "./testing/review-evidence-fixture.js";
import { fork } from "./runtime.js";
import * as bindings from "./internal/evidence-value-routes.js";
import { assertOpeningHistoryReductionProof, computeOpeningHistoryReduction, readOpeningHistoryReductionResult, recordedOpeningHistoryImage } from "./internal/opening-history-reduction-authority.js";
import { evidenceReductionResultProof, initiateEvidenceReduction, publishEvidenceReduction } from "./internal/evidence-reduction-seal.js";

const artifact = JSON.parse(await readFile(new URL("../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8"));
const installation = admitInstalledOpeningCatalogue(artifact);
if (installation.kind !== "available") throw new TypeError(installation.reason);
const source = installation.source, route = "derived.opening.deepest_reached@2";
function fixture(moves = ["e2e4", "e7e5", "g1f3", "b8c6"], fen?: string) {
  const run = play(importedRun("opening-history-reduction", "white", fen), moves), branchId = run.activeCursor.branchId;
  const path = branchPath(run, branchId), throughNodeId = path.at(-1)!.id;
  const input = { source, run, branchId, throughNodeId }, history = collectRecordedOpeningHistory(input);
  return { ...input, path, history, result: bindings.invokeEvidenceValueRoute(route, { history }) };
}

describe("complete recorded opening reduction", () => {
  it("preserves old successful helper fields, every visit and actual observed ply", () => {
    const f = fixture(["g1f3", "g8f6", "f3g1", "f6g8", "e2e4", "a7a6", "a2a3"]);
    const data = readRecordedOpeningHistory(f.history), result = f.result;
    expect(result).toHaveLength(1);
    const previous = deepestOpeningReached(installation, data.rows.map(row => ({ ...row.position.payload, projectionId: "run.record.position@1" })));
    expect(result[0]!.evidence.payload).toEqual({ ...previous, projectionId: route });
    expect(result[0]).toMatchObject({ nodeId: f.path[6]!.id, plyOffset: 6 });
    expect(result[0]!.evidence.payload.deepest).toMatchObject({ projectionId: "theory.opening.current_endpoint@1", observedPly: 6, sourcePly: 2, eco: "B00" });
    expect(result[0]!.evidence.payload.visits.find(visit => visit.ply === 5)!.endpoint).toMatchObject({ observedPly: 5, sourcePly: 1 });
    const proof = readOpeningHistoryReductionResult(result, f.history), receipt = evidenceValueReceipt(result[0]!.evidence);
    expect(receipt.reduction).toBe(proof.reduction); expect(receipt.convention).toBe(proof.convention);
    expect(Object.keys(proof.reduction).sort()).toEqual(["occurrences", "operation", "outputDigest", "planDigest", "projection", "sourceImageDigest"]);
    expect(proof.reduction.sourceImageDigest).toBe(evidenceDigest(recordedOpeningHistoryImage(f.history)));
    expect(proof.reduction.outputDigest).toBe(evidenceDigest(result.map(({ evidence }) => ({ producer: evidence.producer, projection: evidence.projection, payloadDigest: evidenceDigest(evidence.payload) }))));
    expect(proof.convention.refs.map(ref => `${ref.id}@${ref.version}`)).toContain("opening-deepest-reached@1");
    expect(() => assertDeclaredEvidence(result[0]!.evidence)).not.toThrow();
  });

  it("retains original group/item/element addresses, including actual negative rows", () => {
    const f = fixture(["d2d4", "g8f6", "c2c4", "e7e6"]), data = readRecordedOpeningHistory(f.history);
    const proof = readOpeningHistoryReductionResult(f.result, f.history);
    for (const [index, row] of data.rows.entries()) {
      const group = proof.reduction.occurrences.filter(item => item.group === index);
      expect(group.map(item => [item.item, item.element])).toEqual(row.endpoints.length ? [[0, 0], [1, 1]] : [[0, 0]]);
      expect(group[0]!.witness.value.payloadDigest).toBe(evidenceValueReceipt(row.position).payloadDigest);
      if (row.endpoints.length) expect(group[1]!.witness.value.payloadDigest).toBe(evidenceValueReceipt(row.endpoints[0]!).payloadDigest);
    }
    expect(data.rows.at(-1)!.lookup.result.currentEndpoint.kind).toBe("absent");
    expect(data.rows.at(-1)!.memberships[0]!.payload).toMatchObject({ descendantEndpointCount: 304 });
    expect(recordedOpeningHistoryImage(f.history).rows.at(-1)!.invocation.result.currentEndpoint.kind).toBe("absent");
  });

  it("retains exit/re-entry and a named root at the actual recorded ply", () => {
    const f = fixture(["e2e4", "g8f6", "g1f3", "f6g8", "f3g1"]);
    const visits = f.result[0]!.evidence.payload.visits;
    expect(visits.find(visit => visit.ply === 1)!.endpoint.positionKey).toBe(visits.find(visit => visit.ply === 5)!.endpoint.positionKey);
    expect(visits.find(visit => visit.ply === 1)!.nodeId).not.toBe(visits.find(visit => visit.ply === 5)!.nodeId);
    expect(f.result[0]!.evidence.payload.deepest.observedPly).toBe(5);
    const namedRoot = fixture([], f.path[1]!.fen);
    expect(namedRoot.result).toHaveLength(1);
    expect(namedRoot.result[0]).toMatchObject({ nodeId: namedRoot.path[0]!.id, plyOffset: 0, evidence: { payload: { deepest: { observedPly: 0, sourcePly: 1 } } } });
  });

  it.each([{ moves: [] }, { moves: ["a2a3", "h7h6"] }])("authenticates fresh genuine empty results, moves=$moves", ({ moves }) => {
    const f = fixture(moves, "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1"), another = bindings.invokeEvidenceValueRoute(route, { history: f.history });
    expect(f.result).toEqual([]); expect(another).not.toBe(f.result); expect(Object.isFrozen(f.result)).toBe(true);
    const proof = readOpeningHistoryReductionResult(f.result, f.history);
    expect(proof.reduction.outputDigest).toBe(evidenceDigest([]));
    expect(proof.reduction.occurrences).toHaveLength(f.path.length);
    expect(proof.reduction.occurrences.every(item => item.element === 0)).toBe(true);
    for (const copied of [[], Object.freeze([]), [...f.result], f.result.slice(), structuredClone(f.result)]) expect(() => readOpeningHistoryReductionResult(copied, f.history)).toThrow(/original authenticated/);
  });

  it("does not conflate history instances, captured endpoint, negative suffix, branches or installations", () => {
    const f = fixture(["e2e4", "a7a6", "a2a3"]);
    const again = collectRecordedOpeningHistory({ source, run: f.run, branchId: f.branchId, throughNodeId: f.throughNodeId });
    expect(evidenceDigest(recordedOpeningHistoryImage(again))).toBe(evidenceDigest(recordedOpeningHistoryImage(f.history)));
    expect(() => readOpeningHistoryReductionResult(f.result, again)).toThrow(/original history/);
    const earlier = collectRecordedOpeningHistory({ source, run: f.run, branchId: f.branchId, throughNodeId: f.path[2]!.id });
    const earlierResult = bindings.invokeEvidenceValueRoute(route, { history: earlier });
    expect(earlierResult[0]!.evidence.payload).toEqual(f.result[0]!.evidence.payload);
    expect(readOpeningHistoryReductionResult(earlierResult, earlier).reduction.sourceImageDigest).not.toBe(readOpeningHistoryReductionResult(f.result, f.history).reduction.sourceImageDigest);
    const branched = fork(f.run, f.path[1]!.id).run;
    const other = collectRecordedOpeningHistory({ source, run: branched, branchId: branched.activeCursor.branchId, throughNodeId: f.path[1]!.id });
    expect(() => readOpeningHistoryReductionResult(f.result, other)).toThrow();
    const installed = admitInstalledOpeningCatalogue(artifact); if (installed.kind !== "available") throw new Error(installed.reason);
    const sameBytesOtherSource = collectRecordedOpeningHistory({ source: installed.source, run: f.run, branchId: f.branchId, throughNodeId: f.throughNodeId });
    expect(() => readOpeningHistoryReductionResult(f.result, sameBytesOtherSource)).toThrow();
    for (const input of [{ history: { ...f.history } }, { history: f.history, visits: [] }, { history: f.history, deepest: {} }]) expect(() => bindings.invokeEvidenceValueRoute(route, input as never)).toThrow();
  });

  it("compiles only the exact fourth plan, not old fixed execution or a weakened child", () => {
    const f = fixture(), plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, contract.projection);
    expect(plan).toMatchObject({ kind: "reduction", sourceOwner: "RecordedOpeningHistorySource", sourceUse: "captured_only", worstCaseLatency: "sync" });
    if (plan.kind !== "reduction") throw new Error("fixture");
    expect(plan.elements.map(item => item.projection)).toEqual(contract.elements);
    expect(() => executionPlanDigest({ ...plan })).toThrow(/issued/);
    expect(() => compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, contract.projection)).toThrow(/V2/);
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => value.id === contract.projection.id && value.version === 2)!;
    for (const elements of [[], [...contract.elements].reverse(), contract.elements.slice(0, 1)]) expect(() => assertEvidenceReductionDeclaration({ ...declaration, derivation: { reduction: { operation: contract.operation, elements } } })).toThrow();
    const changed = { ...PRIMARY_EVIDENCE_MANIFEST, projections: PRIMARY_EVIDENCE_MANIFEST.projections.map(value => value === declaration ? { ...value, confidence: "reported" as const } : value) };
    expect(() => assertOpeningHistoryReductionProof(computeOpeningHistoryReduction(f.history).proof, changed)).toThrow();
    const missing = { ...PRIMARY_EVIDENCE_MANIFEST, projections: PRIMARY_EVIDENCE_MANIFEST.projections.filter(value => value.id !== "theory.opening.current_endpoint") };
    expect(() => compileProjectionExecutionV2(missing, contract.projection)).toThrow();
    const spy = vi.spyOn(bindings, "inspectEvidenceReductionBinding").mockImplementation(() => { throw new Error("not callable"); });
    try { expect(() => bindings.invokeEvidenceValueRoute(route, { history: f.history })).toThrow(/not callable/); } finally { spy.mockRestore(); }
  });

  it("rejects copied/mutated receipt proofs, borrowed result arrays and unissued values", () => {
    const f = fixture(), computed = computeOpeningHistoryReduction(f.history), proof = computed.proof;
    for (const field of ["operation", "projection", "planDigest", "sourceImageDigest", "outputDigest", "occurrences"] as const) {
      expect(() => assertOpeningHistoryReductionProof({ ...proof, receipt: { ...proof.receipt, [field]: "changed" } } as never)).toThrow(/not issued/);
    }
    expect(() => initiateEvidenceReduction({ ...computed.authority })).toThrow(/privately issued/);
    expect(() => publishEvidenceReduction(initiateEvidenceReduction(computed.authority), f.result)).toThrow();
    for (const copied of [[...f.result], f.result.slice(), f.result.filter(() => true), f.result.map(item => ({ ...item }))]) expect(() => evidenceReductionResultProof(copied)).toThrow();
    const evidence = f.result[0]!.evidence, receipt = evidenceValueReceipt(evidence);
    expect(() => declareEvidence(evidence.producer, evidence.projection, evidence.payload, { factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: [], convention: receipt.convention! })).toThrow();
    expect(Object.isFrozen(receipt.reduction!.occurrences[0]!.witness)).toBe(true);
    for (const field of ["group", "item", "element", "witness"]) expect(Reflect.set(receipt.reduction!.occurrences[0]!, field, "changed")).toBe(false);
    expect(receipt.reduction!.occurrences[0]!.group).toBe(0);
    expect(() => assertDeclaredEvidence({ ...evidence })).toThrow();
  });

  it("does not redefine the historical @1 route", () => {
    const f = fixture();
    expect(bindings.invokeEvidenceValueRoute("derived.opening.deepest_reached@1", { run: f.run, branchId: f.branchId })).toEqual({ kind: "unavailable", reason: "input_abstained", dependency: "runtime-opening-identity" });
    expect(() => bindings.invokeEvidenceValueRoute("derived.opening.deepest_reached@1", { history: f.history } as never)).toThrow();
  });
});
