import { describe, expect, it, vi } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, declareEvidence, evidenceDigest, evidenceForConsumer, evidenceValueReceipt, isDeclaredEvidence } from "./evidence-contract.js";
import { compileProjectionExecution } from "./evidence-execution.js";
import { compileProjectionExecutionV2, executionPlanDigest } from "./evidence-execution-v2.js";
import * as execution from "./evidence-execution-v2.js";
import { STORY_RANK_REDUCTION_CONTRACT as contract, assertEvidenceReductionDeclaration } from "./evidence-reduction-contract.js";
import { computeStoryRankReduction, assertStoryRankReductionProof, readStoryRankReductionValue } from "./internal/story-rank-reduction-authority.js";
import { evidenceReductionSingleProof, initiateEvidenceReduction, publishEvidenceReduction, publishSingleEvidenceReduction } from "./internal/evidence-reduction-seal.js";
import { computeLastLevelReduction } from "./internal/last-level-reduction-authority.js";
import * as routes from "./internal/evidence-value-routes.js";
import { collectRecordedReviewSourcePopulation } from "./review-evidence.js";
import { collectRecordedReviewMoments, readRecordedReviewMoments, recordedReviewMomentSourceImage } from "./recorded-review-moments.js";
import { createRecordedReviewBoundarySourceOwner } from "./recorded-review-boundary.js";
import { rankStoryMoments } from "./story.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";
import { recordedPivotalFixture, PIVOTAL_RULE_KINDS } from "./testing/recorded-pivotal-fixture.js";
import { attachEvidence } from "./evidence.js";
import { REVIEW_AT } from "./testing/review-evidence-fixture.js";

const route = "derived.story.rank@3", ref = contract.projection;
const calculate = (recordedReview: ReturnType<typeof collectRecordedReviewMoments>) => routes.invokeEvidenceValueRoute(route, { recordedReview });
function fixture(side: "white" | "black" = "white", result: "0-1" | "1-0" | "*" = "*", moves?: string[]) {
  const f = recordedLastLevelFixture(side, result, "rank-reduction", moves);
  return { ...f, source: () => collectRecordedReviewMoments({ population: collectRecordedReviewSourcePopulation({ boundary: f.boundary(), context: { engine: f.engine, shapes: [] } }) }) };
}

describe("source-owned recorded Story rank reduction", () => {
  it.each(["white", "black"] as const)("retains current nine-band ordering and complete concrete mixed inputs: %s", side => {
    const f = fixture(side, side === "white" ? "0-1" : "1-0");
    f.deliver(0, "cp 100"); f.deliver(1, "cp -300"); f.deliver(2, "mate 3"); f.deliver(3, "cp 0");
    const source = f.source(), data = readRecordedReviewMoments(source), value = calculate(source), receipt = evidenceValueReceipt(value), proof = readStoryRankReductionValue(value, source);
    expect(value.payload).toEqual({ rank: rankStoryMoments(data.groups) });
    expect(value.payload.rank.length).toBeGreaterThan(1); expect(receipt.sourceDigests).toEqual([]);
    expect(receipt.reduction).toBe(proof.reduction); expect(receipt.convention).toBe(proof.convention);
    expect(proof.reduction.sourceImageDigest).toBe(evidenceDigest(recordedReviewMomentSourceImage(source)));
    expect(proof.reduction.outputDigest).toBe(evidenceDigest(value.payload));
    expect(receipt.inputDigest).toBe(evidenceDigest({ operation: contract.operation, planDigest: proof.reduction.planDigest, sourceImageDigest: proof.reduction.sourceImageDigest, occurrences: proof.reduction.occurrences }));
    const expected = data.groups.flatMap((group, gi) => group.evidence.map((input, ii) => [gi, ii, contract.elements.findIndex(element => element.id === input.projection.id && element.version === input.projection.version)]));
    expect(proof.reduction.occurrences.map(({ group, item, element }) => [group, item, element])).toEqual(expected);
    expect(proof.reduction.occurrences.some(item => item.witness.kind === "reduction")).toBe(true);
    const delta = proof.reduction.occurrences.find(item => item.element === 0)!.witness;
    expect(delta.kind).toBe("member"); if (delta.kind !== "member") throw Error("delta member");
    expect(delta.inputs).toHaveLength(2);
    expect(delta.inputs[0]).toMatchObject({ kind: "member", inputs: [{ kind: "leaf", source: { availability: "provider", providerOperation: "stockfish.position_evaluation@1" } }, { kind: "leaf", source: { availability: "recorded" } }] });
    expect(proof.convention.refs.map(item => `${item.id}@${item.version}`)).toEqual(expect.arrayContaining(["story-rank@1", "story-last-level@1"]));
    expect(Object.keys(evidenceReductionSingleProof(value).output).sort()).toEqual(["payloadDigest", "producer", "projection"]);
    expect(isDeclaredEvidence(value)).toBe(true);
  });

  it.each(PIVOTAL_RULE_KINDS)("authenticates exact local/recorded member tuples: %s", kind => {
    const run = recordedPivotalFixture(kind), owner = createRecordedReviewBoundarySourceOwner({ loadRun: () => run, loadImportRecord: () => undefined });
    const source = collectRecordedReviewMoments({ population: collectRecordedReviewSourcePopulation({ boundary: owner.resolve({ runId: run.id, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId }), context: { engine: new Map(), shapes: [] } }) });
    const value = calculate(source), proof = readStoryRankReductionValue(value, source);
    const child = proof.reduction.occurrences.find(item => item.witness.value.projection.id === `derived.pivotal.${kind}`)!.witness;
    expect(child.kind).toBe("member"); if (child.kind !== "member") throw Error("member");
    expect(child.inputs).toHaveLength(kind === "phase_change" ? 4 : kind === "option_collapse" ? 6 : 2);
    expect(child.inputs[0]).toMatchObject({ kind: "leaf", source: { availability: "local", providerOperation: null } });
    expect(child.inputs[1]).toMatchObject({ kind: "leaf", source: { availability: "recorded", providerOperation: null } });
  });

  it("publishes exactly one authenticated empty rank, not an item array or absent value", () => {
    const f = fixture("white", "*", []), source = f.source(), a = calculate(source), b = calculate(source);
    expect(a.payload).toEqual({ rank: [] }); expect(b).not.toBe(a); expect(Object.isFrozen(a.payload.rank)).toBe(true);
    const proof = readStoryRankReductionValue(a, source); expect(proof.reduction.occurrences).toEqual([]);
    expect(proof.reduction.outputDigest).toBe(evidenceDigest({ rank: [] }));
    expect(proof.convention.refs.map(item => `${item.id}@${item.version}`)).toEqual(["story-last-level@1", "story-rank@1"]);
    expect(proof.convention.derivation).toMatchObject({ kind: "reduction", operation: contract.operation, inputs: [] });
    expect(() => evidenceReductionSingleProof({ ...a })).toThrow(/original mint/u);
  });

  it("ranks a genuine singleton moment without inventing any additional eligible family", () => {
    const f = fixture("white", "*", ["e2e4"]); f.deliver(0, "cp 0"); f.deliver(1, "cp -150");
    const source = f.source(), data = readRecordedReviewMoments(source), value = calculate(source);
    expect(data.groups).toHaveLength(1); expect(value.payload).toEqual({ rank: [f.path[1]!.id] });
    expect(readStoryRankReductionValue(value, source).reduction.occurrences.every(item => item.group === 0)).toBe(true);
  });

  it("retains genuine root-only nested context even without an eligible moment", () => {
    const f = fixture("white", "0-1", []); f.deliver(0, "cp 0"); const source = f.source(), image = recordedReviewMomentSourceImage(source), value = calculate(source);
    expect(image.groups).toEqual([]); expect(image.lastLevelReduction.items).toHaveLength(1); expect(value.payload).toEqual({ rank: [] });
    expect(evidenceValueReceipt(value).reduction!.occurrences).toEqual([]);
    expect(evidenceValueReceipt(value).convention!.refs.map(item => `${item.id}@${item.version}`)).toContain("story-last-level@1");
  });

  it("preserves every captured provider absence/failure state without converting it to chess evidence", () => {
    const f = fixture("white", "*", []), receipts = [];
    for (const state of [null, { kind: "not_requested" }, { kind: "not_yet_scheduled" }, { kind: "pending", jobCount: 1, retrying: 0 }, { kind: "unavailable", reason: "provider_failed" }, { kind: "unavailable", reason: "provider_off" }, { kind: "honest_empty", reason: "outside_domain" }] as const) {
      if (state === null) f.engine.clear(); else f.engine.set(f.path[0]!.id, state as never);
      const value = calculate(f.source()); expect(value.payload).toEqual({ rank: [] }); receipts.push(evidenceValueReceipt(value).reduction!.sourceImageDigest);
    }
    expect(new Set(receipts).size).toBe(receipts.length);
  });

  it("retains every shape occurrence and does not inherit pattern or evaluation authority", () => {
    const f = fixture(), source = collectRecordedReviewMoments({ population: collectRecordedReviewSourcePopulation({ boundary: f.boundary(), context: { engine: f.engine, shapes: [{ id: "f3-knight", trigger: { kind: "pieceOnSquare", square: "f3", piece: { color: "white", role: "knight" } } }] } }) });
    const value = calculate(source), proof = readStoryRankReductionValue(value, source), shapes = proof.reduction.occurrences.filter(item => item.element === 10);
    expect(shapes.length).toBeGreaterThan(0); expect(shapes.every(item => item.witness.kind === "leaf")).toBe(true);
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(item => item.id === ref.id && item.version === 3)!;
    expect(declaration.answerContent).toEqual(["fact"]); expect(declaration.operands).toEqual(["rank"]); expect(declaration.confidence).toBe("reported");
    expect(Object.keys(value.payload)).toEqual(["rank"]);
  });

  it("performs no collector/provider/child dispatch on rank calculation or readback", () => {
    const f = fixture(); f.deliver(1); const source = f.source(), spy = vi.spyOn(routes, "invokeEvidenceValueRoute");
    try { const value = calculate(source); readStoryRankReductionValue(value, source); assertDeclaredEvidence(value); expect(spy.mock.calls.map(call => call[0])).toEqual([route]); } finally { spy.mockRestore(); }
  });

  it("requires the exact eligible tuple, source owner, genuine plan and binding", () => {
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(item => item.id === ref.id && item.version === 3)!;
    const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, ref); expect(plan.kind).toBe("reduction"); if (plan.kind !== "reduction") throw Error("reduction");
    expect(plan.sourceOwner).toBe("RecordedReviewMomentSource"); expect(plan.elements.map(item => item.projection)).toEqual(contract.elements);
    expect(plan.elements[2]!.execution.kind).toBe("reduction");
    expect(() => executionPlanDigest({ ...plan })).toThrow(/issued/u); expect(() => compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, ref)).toThrow(/V2/u);
    for (const change of [{ answerContent: ["fact", "evaluation"] }, { exactness: "exact" }, { confidence: "exact" }, { operands: ["rank", "evaluation"] }, { derivation: { reduction: { operation: contract.operation, elements: [...contract.elements].reverse() } } }]) expect(() => assertEvidenceReductionDeclaration({ ...declaration, ...change } as never)).toThrow();
    const inspect = vi.spyOn(routes, "inspectEvidenceReductionBinding");
    try { executionPlanDigest(plan); expect(inspect.mock.calls.map(call => call[0].id)).toEqual(["story.rank", "story.last_level"]); } finally { inspect.mockRestore(); }
  });

  it("refuses an altered nested child-root template before trusting its receipt", () => {
    const f = fixture("white", "0-1"); f.deliver(2, "cp 0"); const source = f.source(), original = execution.compileProjectionExecutionV2;
    const compile = vi.spyOn(execution, "compileProjectionExecutionV2").mockImplementation((manifest, projection) => {
      const plan = original(manifest, projection);
      return projection.id === "derived.story.last_level" && plan.kind === "reduction" ? Object.freeze({ ...plan, worstCaseLatency: plan.worstCaseLatency === "offline" ? "background" : "offline" }) : plan;
    });
    try { expect(() => calculate(source)).toThrow(/genuine array\/ordinal\/plan/u); } finally { compile.mockRestore(); }
  });

  it("refuses all caller-supplied replacements and foreign original sources", () => {
    const f = fixture(), source = f.source(), value = calculate(source);
    for (const copy of [{}, { ...source }, readRecordedReviewMoments(source), recordedReviewMomentSourceImage(source)]) expect(() => calculate(copy as never)).toThrow();
    for (const extra of [{ moments: [] }, { groups: [] }, { rank: [] }, { payload: {} }, { side: "black" }, { sourceImage: {} }]) expect(() => routes.invokeEvidenceValueRoute(route, { recordedReview: source, ...extra } as never)).toThrow();
    expect(recordedReviewMomentSourceImage(f.source())).toEqual(recordedReviewMomentSourceImage(source));
    expect(() => readStoryRankReductionValue(value, f.source())).toThrow(/original source/u);
  });

  it("refuses stale current storage before empty shortcuts and on published-value readback", () => {
    const f = fixture("white", "*", []), source = f.source(), value = calculate(source);
    f.setRun(attachEvidence(f.run, f.path[0]!.id, ["changed"], { kind: "eval", source: "engine_validated", values: { centipawns: 1 } }, REVIEW_AT).run);
    expect(() => calculate(source)).toThrow(/original complete/u); expect(() => readStoryRankReductionValue(value, source)).toThrow(/no longer/u); expect(isDeclaredEvidence(value)).toBe(false);
  });

  it("refuses copied proofs, copied receipts and all wrong/unpublished/repeated single mint joins", () => {
    const f = fixture("white", "*", []), source = f.source(), computed = computeStoryRankReduction(source), proof = computed.proof, authority = initiateEvidenceReduction(computed.authority);
    expect(() => assertStoryRankReductionProof({ ...proof })).toThrow(/not issued/u); expect(() => initiateEvidenceReduction({ ...computed.authority })).toThrow(/privately issued/u);
    const make = (ordinal: number, payload = computed.payload, factory: string = contract.factory, projection = ref) => declareEvidence(proof.output.producer, projection, payload, { factory, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention, reduction: { authority, ordinal } });
    expect(() => make(1)).toThrow(/ordinal/u); expect(() => make(0, { rank: ["fake"] })).toThrow(/ordinal/u); expect(() => make(0, computed.payload, "createDerivedStoryRankV2Evidence")).toThrow(/ordinal/u); expect(() => make(0, computed.payload, contract.factory, { id: ref.id, version: 2 })).toThrow();
    expect(() => declareEvidence(proof.output.producer, ref, computed.payload, { factory: contract.factory, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention })).toThrow(/construction authority/u);
    const value = make(0); expect(isDeclaredEvidence(value)).toBe(false); expect(() => evidenceReductionSingleProof(value)).toThrow(/unpublished/u);
    expect(() => publishEvidenceReduction(authority, Object.freeze([]))).toThrow(/incomplete/u);
    expect(() => publishSingleEvidenceReduction(authority, { ...value })).toThrow(/crossed/u);
    publishSingleEvidenceReduction(authority, value); expect(isDeclaredEvidence(value)).toBe(true);
    expect(() => publishSingleEvidenceReduction(authority, value)).toThrow(/already published/u); expect(() => make(0)).toThrow(/cannot mint/u);
  });

  it("does not allow item-array operations to use the single publisher", () => {
    const f = fixture("white", "0-1"); f.deliver(0); const computed = computeLastLevelReduction(f.collect()), authority = initiateEvidenceReduction(computed.authority), selected = computed.selected[0]!, expected = computed.proof.outputs[0]!;
    const value = declareEvidence(expected.producer, expected.projection, selected.payload, { factory: "createDerivedStoryLastLevelV2Evidence", inputDigest: computed.proof.inputDigest, sourceDigests: [], convention: computed.proof.convention, reduction: { authority, ordinal: 0 } });
    expect(() => publishSingleEvidenceReduction(authority, value)).toThrow(/crossed/u); expect(isDeclaredEvidence(value)).toBe(false);
    publishEvidenceReduction(authority, Object.freeze([Object.freeze({ nodeId: selected.nodeId, plyOffset: selected.plyOffset, evidence: value })])); expect(isDeclaredEvidence(value)).toBe(true);
    expect(() => evidenceReductionSingleProof(value)).toThrow(/crossed/u);
  });

  it("checks actual consumer manifest semantics and never widens child content via rank", () => {
    const f = fixture(), source = f.source(), value = calculate(source), consumer = PRIMARY_EVIDENCE_MANIFEST.consumers[0]!;
    const manifest = { ...PRIMARY_EVIDENCE_MANIFEST, consumers: [{ ...consumer, accepts: [ref] }], bindings: [{ ...PRIMARY_EVIDENCE_MANIFEST.bindings[0]!, consumer, producer: value.producer, projection: ref }] };
    expect(() => evidenceForConsumer(manifest, consumer, [value])).not.toThrow();
    const changed = { ...manifest, projections: manifest.projections.map(item => item.id === ref.id && item.version === 3 ? { ...item, semantics: `${item.semantics} changed` } : item) };
    expect(() => evidenceForConsumer(changed, consumer, [value])).toThrow(/consumer manifest/u);
  });
});
