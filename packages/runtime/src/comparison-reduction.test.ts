import { describe, expect, it, vi } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { EVIDENCE_CONTRACT_DECLARATIONS } from "./evidence-catalog.js";
import { assertDeclaredEvidence, compileEvidenceManifest, declareEvidence, evidenceDigest, evidenceValueReceipt, evidenceForConsumer, isDeclaredEvidence, type ProjectionDeclaration } from "./evidence-contract.js";
import { collectComparisonStructuralPopulation, comparisonStructuralAppearances, comparisonStructuralPopulationImage, readComparisonStructuralPopulation } from "./comparison-structural-population.js";
import * as populationOwner from "./comparison-structural-population.js";
import { computeComparisonReduction, assertComparisonReductionProof, readComparisonReductionResult } from "./internal/comparison-reduction-authority.js";
import { evidenceReductionResultProof, initiateEvidenceReduction, publishEvidenceReduction } from "./internal/evidence-reduction-seal.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { compileProjectionExecution } from "./evidence-execution.js";
import { compileProjectionExecutionV2, executionPlanDigest } from "./evidence-execution-v2.js";
import { COMPARISON_REDUCTION_CONTRACT as contract } from "./evidence-reduction-contract.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";
import { createRecordedComparisonSource } from "./recorded-comparison.js";
import { recordedComparisonFixture } from "./testing/recorded-comparison-fixture.js";
import { compareBranches } from "./compare.js";

const ref = contract.projection, route = "derived.compare.structure_delta@2";
function fixture(black = false, empty = false) {
  const value = recordedComparisonFixture(black);
  const comparison = empty ? createRecordedComparisonSource({ run: value.run, columns: value.columns.map(column => ({ ...column, throughNodeId: value.shared.id })) as never }) : value.comparison;
  const population = collectComparisonStructuralPopulation({ comparison });
  return { ...value, comparison, population, result: invokeEvidenceValueRoute(route, { population, branchId: value.main }) };
}

describe("owned structural comparison reduction", () => {
  it.each([false, true])("mints the exact ordered payloads/locations with genuine full-scope execution, black=%s", black => {
    const value = fixture(black), result = value.result, proof = readComparisonReductionResult(result, value.population, value.main);
    expect(result.length).toBeGreaterThan(0); expect(Object.isFrozen(result)).toBe(true);
    expect(result.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, payload: item.evidence.payload })))
      .toEqual(comparisonStructuralAppearances(value.population, value.main).map(({ nodeId, plyOffset, payload }) => ({ nodeId, plyOffset, payload })));
    const receipt = evidenceValueReceipt(result[0]!.evidence);
    expect(receipt.reduction).toBe(proof.reduction); expect(receipt.convention).toBe(proof.convention);
    expect(Object.keys(proof.reduction).sort()).toEqual(["occurrences", "operation", "outputDigest", "planDigest", "projection", "sourceImageDigest"]);
    expect(proof.reduction.sourceImageDigest).toBe(evidenceDigest(comparisonStructuralPopulationImage(value.population, value.main)));
    expect(proof.reduction.outputDigest).toBe(evidenceDigest(result.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, producer: item.evidence.producer, projection: item.evidence.projection, payloadDigest: evidenceDigest(item.evidence.payload) }))));
    expect(receipt.inputDigest).toBe(evidenceDigest({ operation: proof.reduction.operation, planDigest: proof.reduction.planDigest, sourceImageDigest: proof.reduction.sourceImageDigest, occurrences: proof.reduction.occurrences }));
    const data = readComparisonStructuralPopulation(value.population); let q = 0;
    for (const column of data.columns) for (const row of column.nodes) {
      const position = proof.reduction.occurrences.filter(item => item.group === 18 * q);
      expect(position).toHaveLength(1); expect(position[0]).toMatchObject({ item: 0, element: 0, witness: { kind: "leaf", source: { availability: "recorded", providerOperation: null } } });
      expect(position[0]!.witness.value.payloadDigest).toBe(evidenceDigest(row.position.payload));
      for (const [k, family] of row.families.entries()) {
        const occurrences = proof.reduction.occurrences.filter(item => item.group === 18 * q + 1 + k);
        expect(occurrences.map(item => item.item)).toEqual(family.items.map((_, index) => index));
        for (const item of occurrences) expect(item).toMatchObject({ element: k + 1, witness: { source: { availability: "local", providerOperation: null } } });
      }
      q++;
    }
    expect(proof.reduction.occurrences.at(-1)!.group).toBeGreaterThan(18);
    expect(result.every(item => item.plyOffset === value.run.nodes.find(node => node.id === item.nodeId)!.ply - value.shared.ply)).toBe(true);
    expect(proof.convention.derivation).toMatchObject({ kind: "reduction", operation: contract.operation, reductionDigest: `sha256:${evidenceDigest(proof.reduction)}` });
    expect(proof.convention.refs.map(ref => `${ref.id}@${ref.version}`)).toEqual(expect.arrayContaining(["comparison-structure-appearance@1", "maximal_pawn_reach@1", "named-structure-catalogue@1"]));
    expect(isDeclaredEvidence(result[0]!.evidence)).toBe(true);
  });

  it("authenticates a fresh zero output with substantial actual inputs and empty-invocation conventions", () => {
    const value = fixture(false, true), second = invokeEvidenceValueRoute(route, { population: value.population, branchId: value.main });
    expect(value.result).toEqual([]); expect(second).not.toBe(value.result);
    const proof = readComparisonReductionResult(value.result, value.population, value.main);
    expect(proof.reduction.occurrences.length).toBeGreaterThan(0); expect(proof.reduction.outputDigest).toBe(evidenceDigest([]));
    expect(proof.convention.derivation.kind).toBe("reduction");
    expect(proof.convention.refs.map(ref => `${ref.id}@${ref.version}`)).toEqual(expect.arrayContaining(["backward-pawn-legacy@1", "king-opposition-blocker-blind@1", "named-structure-catalogue@1"]));
    expect(() => readComparisonReductionResult([], value.population, value.main)).toThrow(/original authenticated array/);
    expect(() => readComparisonReductionResult(value.result, value.population, value.peer)).toThrow(/requested branch/);
  });

  it("rejects copied, filtered, reordered, foreign-branch and replaced original result arrays", () => {
    const value = fixture(), peer = invokeEvidenceValueRoute(route, { population: value.population, branchId: value.peer });
    for (const array of [[...value.result], value.result.slice(1), [...value.result].reverse(), Object.freeze(value.result.map(item => ({ ...item }))), peer])
      expect(() => readComparisonReductionResult(array, value.population, value.main)).toThrow();
    const alternate = collectComparisonStructuralPopulation({ comparison: createRecordedComparisonSource({ run: value.run, columns: [...value.columns].reverse() as never }) });
    expect(() => readComparisonReductionResult(value.result, alternate, value.main)).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { population: {} as never, branchId: value.main })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { population: value.population, branchId: "foreign" })).toThrow();
    expect(() => invokeEvidenceValueRoute(route, { population: value.population, branchId: value.main, payload: value.result } as never)).toThrow();
  });

  it("requires original operation and compiler issuance, never structural receipts or copied plans", () => {
    expect(() => initiateEvidenceReduction({ validate() {} } as never)).toThrow(/privately issued/);
    const value = fixture(), item = value.result[0]!, receipt = evidenceValueReceipt(item.evidence);
    expect(() => declareEvidence(item.evidence.producer, ref, item.evidence.payload, { factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: [], convention: receipt.convention! })).toThrow(/construction authority/);
    expect(() => assertDeclaredEvidence({ ...item.evidence })).toThrow();
    expect(() => evidenceReductionResultProof(Object.freeze([...value.result]))).toThrow();
    const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, ref);
    expect(plan.kind).toBe("reduction");
    expect(() => executionPlanDigest({ ...plan })).toThrow(/issued/);
    expect(() => executionPlanDigest(structuredClone(plan))).toThrow(/issued/);
    expect(() => compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, ref)).toThrow(/V2/);
    if (plan.kind !== "reduction") throw new Error("expected reduction");
    expect(plan.elements.map(item => item.projection)).toEqual(contract.elements);
    expect(plan.elements.every(item => item.execution.kind === "fixed")).toBe(true);
    expect(plan).toMatchObject({ own: { availability: "local", latency: "sync", providerOperation: null }, sourceOwner: contract.sourceOwner, sourceUse: "captured_only", worstCaseLatency: "sync" });
    const fixedRef = { id: "run.record.position", version: 1 };
    expect(compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, fixedRef)).toEqual({ kind: "fixed", execution: compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, fixedRef) });
  });

  it.each([false, true])("rejects another genuinely collected equal-image population, empty=%s", empty => {
    const value = fixture(false, empty), other = collectComparisonStructuralPopulation({ comparison: value.comparison });
    expect(evidenceDigest(comparisonStructuralPopulationImage(other, value.main))).toBe(evidenceDigest(comparisonStructuralPopulationImage(value.population, value.main)));
    expect(() => readComparisonReductionResult(value.result, other, value.main)).toThrow(/original population/);
    expect(() => readComparisonReductionResult(invokeEvidenceValueRoute(route, { population: other, branchId: value.main }), other, value.main)).not.toThrow();
  });

  it("refuses unpublished values, copied proofs and wrong ordinal/location publication, then seals once", () => {
    const value = recordedComparisonFixture(), population = collectComparisonStructuralPopulation({ comparison: value.comparison });
    const computed = computeComparisonReduction(population, value.main), proof = computed.proof, authority = initiateEvidenceReduction(computed.authority);
    expect(() => assertComparisonReductionProof({ ...proof })).toThrow(/not issued/);
    expect(() => initiateEvidenceReduction({ ...computed.authority })).toThrow(/privately issued/);
    const producer = proof.outputs[0]!.producer;
    const mint = (ordinal: number, payload: unknown) => declareEvidence(producer, ref, payload, {
      factory: contract.factory, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention, reduction: { authority, ordinal },
    });
    expect(() => mint(-1, computed.appearances[0]!.payload)).toThrow(/ordinal/);
    expect(() => mint(0, { invented: "caller text" })).toThrow(/ordinal/);
    const result = Object.freeze(computed.appearances.map((appearance, ordinal) => Object.freeze({ nodeId: appearance.nodeId, plyOffset: appearance.plyOffset,
      evidence: mint(ordinal, appearance.payload) })));
    expect(() => mint(0, computed.appearances[0]!.payload)).toThrow(/ordinal/);
    expect(() => assertDeclaredEvidence(result[0]!.evidence)).toThrow(/unpublished/);
    expect(isDeclaredEvidence(result[0]!.evidence)).toBe(false);
    expect(() => evidenceReductionResultProof(result)).toThrow(/original authenticated/);
    for (const bad of [Object.freeze(result.slice(1)), Object.freeze([...result].reverse()),
      Object.freeze(result.map((item, index) => index === 0 ? Object.freeze({ ...item, plyOffset: item.plyOffset + 1 }) : item)),
      Object.freeze(result.map((item, index) => index === 0 ? Object.freeze({ ...item, nodeId: value.shared.id }) : item))]) {
      expect(() => publishEvidenceReduction(authority, bad as never)).toThrow(/incomplete|ordinal\/location/);
      expect(isDeclaredEvidence(result[0]!.evidence)).toBe(false);
    }
    publishEvidenceReduction(authority, result as never);
    expect(isDeclaredEvidence(result[0]!.evidence)).toBe(true);
    expect(() => publishEvidenceReduction(authority, result as never)).toThrow(/already published/);
    expect(() => mint(0, computed.appearances[0]!.payload)).toThrow(/cannot mint/);
    expect(() => readComparisonReductionResult(result as never, population, value.main)).not.toThrow();
  });

  it("preserves literal composition member numbers, repeated children and missing-template failures", () => {
    const base = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === ref.id && row.version === 2)!;
    const parent = { ...base, id: "fixture.reduction_parent", derivation: { anyOf: [[ref, ref], [{ id: "run.record.position", version: 1 }]] } };
    const manifest = { ...PRIMARY_EVIDENCE_MANIFEST, projections: [...PRIMARY_EVIDENCE_MANIFEST.projections, parent] };
    const plan = compileProjectionExecutionV2(manifest, parent);
    expect(plan.kind).toBe("composition");
    if (plan.kind !== "composition") throw new Error("expected composition");
    expect(plan.members.map(member => [member.member, member.inputs.length])).toEqual([[0, 2], [1, 1]]);
    expect(plan.members[0]!.inputs.map(input => input.kind)).toEqual(["reduction", "reduction"]);
    expect(() => compileProjectionExecution(manifest, parent)).toThrow(/V2/);
    for (const derivation of [{ anyOf: [[], [ref]] }, { anyOf: [[ref], [ref]] }, { inputs: [ref], anyOf: [[ref]] }, { inputs: [] }]) {
      const invalid = { ...parent, derivation } as ProjectionDeclaration;
      expect(() => compileProjectionExecutionV2({ ...manifest, projections: manifest.projections.map(row => row === parent ? invalid : row) }, invalid)).toThrow(/empty|crossed|duplicate/);
    }
    expect(() => compileProjectionExecutionV2({ ...manifest, projections: manifest.projections.filter(row => row.id !== "rules.structural.reading.outpost") }, parent)).toThrow(/missing/);
    const cyclic = { ...base, derivation: { reduction: { operation: contract.operation, elements: [ref, ...contract.elements.slice(1)] } } };
    expect(() => compileProjectionExecutionV2({ ...manifest, projections: manifest.projections.map(row => row === base ? cyclic : row) }, ref)).toThrow();
  });

  it("revalidates actual source/computation function identities on warmed plans and values", () => {
    const value = fixture(), item = value.result[0]!, spy = vi.spyOn(populationOwner, "readComparisonStructuralPopulation").mockImplementation(() => { throw new Error("changed source reader"); });
    try { expect(() => assertDeclaredEvidence(item.evidence)).toThrow(); expect(isDeclaredEvidence(item.evidence)).toBe(false); }
    finally { spy.mockRestore(); }
    expect(() => assertDeclaredEvidence(item.evidence)).not.toThrow();
  });

  it("registers only the new direct convention and preserves the old source receipt arm", () => {
    const value = recordedComparisonFixture();
    const old = invokeEvidenceValueRoute("derived.compare.structure_delta@1", { run: value.run, comparison: compareBranches(value.run, [value.main, value.peer]), branchId: value.main });
    expect(directProjectionConventions(route).map(ref => `${ref.id}@${ref.version}`)).toEqual(["comparison-structure-appearance@1"]);
    expect(directProjectionConventions("derived.compare.structure_delta@1")).toEqual([]);
    expect(evidenceValueReceipt(old[0]!.evidence).convention!.derivation).toEqual({ kind: "source" });
  });

  it("joins consumer admission to that manifest's complete actual V2 plan", () => {
    const value = fixture(), evidence = value.result[0]!.evidence, consumer = { id: "fixture.reduction_consumer", version: 1 };
    const manifest = { ...PRIMARY_EVIDENCE_MANIFEST,
      consumers: [{ ...PRIMARY_EVIDENCE_MANIFEST.consumers[0]!, ...consumer, accepts: [ref] }],
      bindings: [{ ...PRIMARY_EVIDENCE_MANIFEST.bindings[0]!, consumer, producer: evidence.producer, projection: ref }] };
    expect(() => evidenceForConsumer(manifest, consumer, [evidence])).not.toThrow();
    const altered = { ...manifest, producers: manifest.producers.map(producer => producer.id === "run.record" ? { ...producer, implementation: "different actual source implementation" } : producer) };
    expect(() => evidenceForConsumer(altered, consumer, [evidence])).toThrow(/consumer manifest.*V2 plan/);
    expect(isDeclaredEvidence(evidence)).toBe(true);
  });

  const malformed: readonly [string, (row: ProjectionDeclaration) => ProjectionDeclaration][] = [
    ["unknown operation", row => ({ ...row, derivation: { reduction: { ...row.derivation!.reduction!, operation: { id: "story.rank", version: 1 } } } })],
    ["subset", row => ({ ...row, derivation: { reduction: { ...row.derivation!.reduction!, elements: contract.elements.slice(1) } } })],
    ["order", row => ({ ...row, derivation: { reduction: { ...row.derivation!.reduction!, elements: [...contract.elements].reverse() } } })],
    ["duplicate", row => ({ ...row, derivation: { reduction: { ...row.derivation!.reduction!, elements: [...contract.elements.slice(0, -1), contract.elements[0]!] } } })],
    ["crossed arm", row => ({ ...row, derivation: { ...row.derivation, inputs: contract.elements } as never })],
    ["answer widening", row => ({ ...row, answerContent: ["fact", "move"] })],
    ["confidence", row => ({ ...row, confidence: "reported" })],
  ];
  it.each(malformed)("refuses %s in actual manifest compilation", (_, mutate) => {
    const declarations = { ...EVIDENCE_CONTRACT_DECLARATIONS, producers: EVIDENCE_CONTRACT_DECLARATIONS.producers.map(producer => ({ ...producer, outputs: producer.outputs.map(row => row.id === ref.id && row.version === ref.version ? mutate(row) : row) })) };
    expect(() => compileEvidenceManifest(declarations)).toThrow();
  });
});
