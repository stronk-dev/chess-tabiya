import { describe, expect, it, vi } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, declareEvidence, evidenceDigest, evidenceValueReceipt, evidenceForConsumer, isDeclaredEvidence } from "./evidence-contract.js";
import { compileProjectionExecution } from "./evidence-execution.js";
import { compileProjectionExecutionV2, executionPlanDigest } from "./evidence-execution-v2.js";
import { LAST_LEVEL_REDUCTION_CONTRACT as contract, COMPARISON_REDUCTION_CONTRACT, assertEvidenceReductionDeclaration } from "./evidence-reduction-contract.js";
import { computeLastLevelReduction, assertLastLevelReductionProof, lastLevelPopulationImage, readLastLevelReductionResult } from "./internal/last-level-reduction-authority.js";
import { evidenceReductionResultProof, initiateEvidenceReduction, publishEvidenceReduction } from "./internal/evidence-reduction-seal.js";
import * as bindings from "./internal/evidence-value-routes.js";
import { readComparisonReductionResult } from "./internal/comparison-reduction-authority.js";
import { collectComparisonStructuralPopulation } from "./comparison-structural-population.js";
import { recordedComparisonFixture } from "./testing/recorded-comparison-fixture.js";
import { recordedLastLevelFixture } from "./testing/recorded-last-level-fixture.js";
import { readRecordedLastLevelPopulation } from "./review-evidence.js";
import { attachEvidence } from "./evidence.js";
import { REVIEW_AT } from "./testing/review-evidence-fixture.js";

const route = "derived.story.last_level@2", ref = contract.projection;
const invoke = bindings.invokeEvidenceValueRoute;
const calculate = (population: ReturnType<ReturnType<typeof recordedLastLevelFixture>["collect"]>) => invoke(route, { population });

describe("complete recorded last-level reduction", () => {
  it.each(["white", "black"] as const)("preserves exact old complete-source payloads and actual ply, side=%s", side => {
    const f = recordedLastLevelFixture(side, side === "white" ? "0-1" : "1-0");
    f.deliver(0, "cp 9999"); f.deliver(1, side === "white" ? "cp 99" : "cp -99"); f.deliver(2, "mate 3");
    f.deliver(3, side === "white" ? "cp 100" : "cp -100"); f.deliver(4, side === "white" ? "cp -101" : "cp 101");
    const population = f.collect(), data = readRecordedLastLevelPopulation(population), result = calculate(population);
    const old = invoke("derived.story.last_level@1", { path: f.path.map(node => node.id), side, recordedResult: side === "white" ? "0-1" : "1-0", points: data.rows.flatMap(row => row.points) });
    expect(result).toHaveLength(1); expect(result.map(item => ({ ...item, evidence: item.evidence.payload }))).toEqual(old.map(item => ({ ...item, evidence: item.evidence.payload })));
    expect(result[0]).toMatchObject({ nodeId: f.path[3]!.id, plyOffset: f.path[3]!.ply, evidence: { payload: { evaluation: { learnerCentipawns: -100, side } } } });
    const proof = readLastLevelReductionResult(result, population), receipt = evidenceValueReceipt(result[0]!.evidence);
    expect(receipt.reduction).toBe(proof.reduction); expect(receipt.convention).toBe(proof.convention); expect(receipt.sourceDigests).toEqual([]);
    expect(proof.reduction.sourceImageDigest).toBe(evidenceDigest(lastLevelPopulationImage(population)));
    expect(proof.reduction.outputDigest).toBe(evidenceDigest(result.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, producer: item.evidence.producer, projection: item.evidence.projection, payloadDigest: evidenceDigest(item.evidence.payload) }))));
    expect(receipt.inputDigest).toBe(evidenceDigest({ operation: proof.reduction.operation, planDigest: proof.reduction.planDigest, sourceImageDigest: proof.reduction.sourceImageDigest, occurrences: proof.reduction.occurrences }));
    expect(proof.convention.refs.map(value => `${value.id}@${value.version}`)).toContain("story-last-level@1");
    expect(proof.convention.derivation).toMatchObject({ kind: "reduction", operation: contract.operation, reductionDigest: `sha256:${evidenceDigest(proof.reduction)}` });
    expect(isDeclaredEvidence(result[0]!.evidence)).toBe(true);
  });

  it.each(["white", "black"] as const)("uses lower threshold, not absolute distance, with typed scores and both signs: %s", side => {
    const f = recordedLastLevelFixture(side, side === "white" ? "0-1" : "1-0");
    for (const learnerCp of [-101, -100, -99, 0, 100, 9999]) {
      const whiteCp = learnerCp === 0 ? 0 : side === "white" ? learnerCp : -learnerCp; f.deliver(0, `cp ${whiteCp}`);
      const result = calculate(f.collect()); expect(result).toHaveLength(learnerCp >= -100 ? 1 : 0);
      if (result.length) expect(result[0]!.evidence.payload.evaluation).toEqual({ nodeId: f.path[0]!.id, whiteCentipawns: whiteCp, learnerCentipawns: learnerCp, side });
    }
  });

  it("retains original result/row roles and genuine member/provider/recorded witnesses", () => {
    const f = recordedLastLevelFixture(); f.deliver(1); const population = f.collect(), data = readRecordedLastLevelPopulation(population);
    const proof = readLastLevelReductionResult(calculate(population), population), occurrences = proof.reduction.occurrences;
    expect(occurrences.map(({ group, item, element }) => [group, item, element])).toEqual([[0, 0, 2], [1, 0, 0], [2, 0, 0], [2, 1, 1], [3, 0, 0], [4, 0, 0], [5, 0, 0]]);
    const point = occurrences[3]!.witness;
    expect(point.kind).toBe("member"); if (point.kind !== "member") throw new Error("fixture requires member");
    expect(point.member).toBe(0); expect(point.inputs).toHaveLength(2);
    expect(point.inputs[0]).toMatchObject({ kind: "leaf", source: { availability: "provider", providerOperation: "stockfish.position_evaluation@1" } });
    expect(point.inputs[1]).toMatchObject({ kind: "leaf", source: { availability: "recorded", providerOperation: null } });
    expect(point.inputs[1]!.value).toEqual(occurrences[2]!.witness.value);
    expect(point.inputs[0]!.value.factory).toBe(evidenceValueReceipt(data.rows[1]!.points[0]!.payload.evaluation).factory);
    expect(Object.isFrozen(point.inputs)).toBe(true);
    const image = lastLevelPopulationImage(population);
    expect(Object.keys(image.result.items[0]!).sort()).toEqual(["payload", "producer", "projection", "receipt"]);
    expect(image.rows[1]!.points[0]!.inputs).toHaveLength(2);
  });

  it.each(["*", "1-0", "1/2-1/2"] as const)("authenticates fresh zero-output results for nonloss/unfinished: %s", result => {
    const f = recordedLastLevelFixture("white", result); f.deliver(0);
    const population = f.collect(), first = calculate(population), second = calculate(population);
    expect(first).toEqual([]); expect(Object.isFrozen(first)).toBe(true); expect(second).not.toBe(first);
    const proof = readLastLevelReductionResult(first, population);
    expect(proof.reduction.outputDigest).toBe(evidenceDigest([])); expect(proof.reduction.occurrences.length).toBeGreaterThan(f.path.length);
    expect(proof.convention.refs.map(ref => `${ref.id}@${ref.version}`)).toContain("story-last-level@1");
    for (const copied of [[], [...first], first.slice(), JSON.parse(JSON.stringify(first)), Object.freeze([])]) expect(() => readLastLevelReductionResult(copied, population)).toThrow(/original authenticated/);
  });

  it("returns genuine empty for board-terminal loss, missing points, all-mate or all-below-threshold", () => {
    const f = recordedLastLevelFixture(), population = f.collect(); expect(calculate(population)).toEqual([]);
    f.path.forEach((_, index) => f.deliver(index, "mate -3")); expect(calculate(f.collect())).toEqual([]);
    f.path.forEach((node, index) => f.deliver(index, `cp ${node.fen.split(" ")[1] === "w" ? -101 : 101}`)); expect(calculate(f.collect())).toEqual([]);
    const terminal = recordedLastLevelFixture("white", "0-1", "terminal-last-level", ["f2f3", "e7e5", "g2g4", "d8h4"]); terminal.deliver(0);
    const source = terminal.collect(), result = calculate(source); expect(result).toEqual([]);
    expect(readLastLevelReductionResult(result, source).reduction.occurrences.every(item => item.element !== 2)).toBe(true);
  });

  it("keeps root selection and absolute ply separate from later Story moment exclusion", () => {
    const f = recordedLastLevelFixture(); f.deliver(0); const population = f.collect(), result = calculate(population);
    expect(result[0]!.nodeId).toBe(f.path[0]!.id); expect(result[0]!.plyOffset).toBe(f.path[0]!.ply);
    expect(readLastLevelReductionResult(result, population).reduction.outputDigest).not.toBe(evidenceDigest([]));
    const prefix = f.collect(f.boundary(f.path[1]!.id)); expect(calculate(prefix)).toEqual([]);
  });

  it("binds all earlier/later/failed/absent input images even when the selected output is unchanged", () => {
    const f = recordedLastLevelFixture(); f.deliver(2);
    const a = f.collect(), ar = calculate(a), ap = readLastLevelReductionResult(ar, a);
    f.engine.set(f.path[0]!.id, { kind: "not_requested" });
    const b = f.collect(), br = calculate(b), bp = readLastLevelReductionResult(br, b);
    expect(ar[0]!.evidence.payload).toEqual(br[0]!.evidence.payload); expect(ap.reduction.sourceImageDigest).not.toBe(bp.reduction.sourceImageDigest);
    const wrong = f.deliver(0, "cp 90"); f.engine.set(f.path[0]!.id, { kind: "pending", jobCount: 2, retrying: 1 }); f.engine.set(f.path[4]!.id, { kind: "delivered", delivery: wrong });
    const c = f.collect(), cr = calculate(c), cp = readLastLevelReductionResult(cr, c), image = lastLevelPopulationImage(c);
    expect(cr[0]!.evidence.payload).toEqual(ar[0]!.evidence.payload); expect(cp.reduction.sourceImageDigest).not.toBe(bp.reduction.sourceImageDigest);
    expect(image.rows[4]!.provider).toMatchObject({ kind: "delivered" }); expect(image.rows[4]!.points).toEqual([]);
    expect(image.rows[4]!.state).toEqual({ kind: "unavailable", reason: "input_abstained" });
    expect(cp.reduction.occurrences.some(item => item.group === 5 && item.element === 1)).toBe(false);
    expect(() => readLastLevelReductionResult(ar, c)).toThrow(/original population/);
  });

  it("performs no collection, provider call or mint on repeated result/value reads", () => {
    const f = recordedLastLevelFixture(); f.deliver(0); const population = f.collect(), result = calculate(population);
    const spy = vi.spyOn(bindings, "invokeEvidenceValueRoute");
    try { readLastLevelReductionResult(result, population); assertDeclaredEvidence(result[0]!.evidence); expect(spy).not.toHaveBeenCalled(); } finally { spy.mockRestore(); }
  });

  it("refuses copied/foreign populations, overrides and stale boundaries before empty/nonloss shortcuts", () => {
    const f = recordedLastLevelFixture("white", "*"), population = f.collect(), result = calculate(population);
    for (const bad of [{}, { ...population }, readRecordedLastLevelPopulation(population)]) expect(() => calculate(bad as never)).toThrow();
    for (const extra of [{ points: [] }, { side: "black" }, { path: [] }, { recordedResult: "0-1" }, { payload: {} }]) expect(() => invoke(route, { population, ...extra } as never)).toThrow();
    f.setRun(attachEvidence(f.run, f.path[0]!.id, ["synthetic:change"], { kind: "eval", source: "engine_validated", values: { centipawns: 11 } }, REVIEW_AT).run);
    expect(() => calculate(population)).toThrow(); expect(() => readLastLevelReductionResult(result, population)).toThrow();
  });

  it("requires exact plan semantics and actual installed bindings for both operations", () => {
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => value.id === ref.id && value.version === 2)!;
    expect(() => assertEvidenceReductionDeclaration(declaration)).not.toThrow();
    for (const change of [{ exactness: "convention" }, { confidence: "exact" }, { answerContent: ["fact"] }, { forms: ["panel"] },
      { derivation: { reduction: { operation: contract.operation, elements: [...contract.elements].reverse() } } }]) expect(() => assertEvidenceReductionDeclaration({ ...declaration, ...change } as never)).toThrow();
    const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, ref); expect(plan.kind).toBe("reduction");
    if (plan.kind !== "reduction") throw new Error("fixture requires reduction");
    expect(plan.sourceOwner).toBe("RecordedLastLevelPopulation"); expect(plan.elements.map(value => value.projection)).toEqual(contract.elements);
    expect(plan.elements.every(value => value.execution.kind === "fixed")).toBe(true);
    const point = plan.elements[1]!.execution; if (point.kind !== "fixed") throw new Error("fixture requires fixed point");
    expect(point.execution.paths[0]!.sourceRequirements.map(value => [value.occurrence, value.availability])).toEqual([[[0], "provider"], [[1], "recorded"]]);
    expect(() => executionPlanDigest({ ...plan })).toThrow(/issued/); expect(() => compileProjectionExecution(PRIMARY_EVIDENCE_MANIFEST, ref)).toThrow(/V2/);
    const parent = { ...declaration, id: "fixture.mixed_reductions", derivation: { anyOf: [[ref, COMPARISON_REDUCTION_CONTRACT.projection, ref]] } };
    const manifest = { ...PRIMARY_EVIDENCE_MANIFEST, projections: [...PRIMARY_EVIDENCE_MANIFEST.projections, parent] };
    const composed = compileProjectionExecutionV2(manifest, parent); expect(composed.kind).toBe("composition");
    if (composed.kind !== "composition") throw new Error("fixture requires composition");
    expect(composed.members[0]!.inputs.map(value => value.kind === "reduction" ? value.operation.id : null)).toEqual(["story.last_level", "compare.structure_delta", "story.last_level"]);
    const inspect = vi.spyOn(bindings, "inspectEvidenceReductionBinding");
    try { executionPlanDigest(composed); expect(inspect.mock.calls.map(([operation]) => operation.id)).toEqual(["story.last_level", "compare.structure_delta", "story.last_level"]); } finally { inspect.mockRestore(); }
  });

  it("rejects copied computation proofs, missing mint authority, wrong ordinals and unpublished results", () => {
    const f = recordedLastLevelFixture(); f.deliver(0); const population = f.collect(), computed = computeLastLevelReduction(population);
    const proof = computed.proof, selected = computed.selected[0]!, authority = initiateEvidenceReduction(computed.authority), producer = proof.outputs[0]!.producer;
    expect(() => assertLastLevelReductionProof({ ...proof })).toThrow(/not issued/); expect(() => initiateEvidenceReduction({ ...computed.authority })).toThrow(/privately issued/);
    expect(() => declareEvidence(producer, ref, selected.payload, { factory: contract.factory, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention })).toThrow(/construction authority/);
    const mint = (ordinal: number, projection = ref, factory: string = contract.factory) => declareEvidence(producer, projection, selected.payload, { factory, inputDigest: proof.inputDigest, sourceDigests: [], convention: proof.convention, reduction: { authority, ordinal } });
    expect(() => mint(1)).toThrow(/ordinal/); expect(() => mint(0, COMPARISON_REDUCTION_CONTRACT.projection)).toThrow(/ordinal/); expect(() => mint(0, ref, COMPARISON_REDUCTION_CONTRACT.factory)).toThrow(/ordinal/);
    const evidence = mint(0), result = Object.freeze([Object.freeze({ nodeId: selected.nodeId, plyOffset: selected.plyOffset, evidence })]);
    expect(isDeclaredEvidence(evidence)).toBe(false); expect(() => evidenceReductionResultProof(result)).toThrow(/original authenticated/);
    expect(() => publishEvidenceReduction(authority, Object.freeze([Object.freeze({ ...result[0]!, plyOffset: selected.plyOffset + 1 })]))).toThrow(/ordinal\/location/);
    publishEvidenceReduction(authority, result); expect(isDeclaredEvidence(evidence)).toBe(true);
    expect(() => publishEvidenceReduction(authority, result)).toThrow(/already published/); expect(() => mint(0)).toThrow(/cannot mint/);
    expect(() => readLastLevelReductionResult([...result], population)).toThrow();
  });

  it("rejects cross-operation original result arrays, including genuine empty results", () => {
    const f = recordedLastLevelFixture(), population = f.collect(), result = calculate(population);
    const other = recordedComparisonFixture(), comparison = collectComparisonStructuralPopulation({ comparison: other.comparison });
    const otherResult = invoke("derived.compare.structure_delta@2", { population: comparison, branchId: other.main });
    expect(() => readLastLevelReductionResult(otherResult, population)).toThrow(/operation/);
    expect(() => readComparisonReductionResult(result as never, comparison, other.main)).toThrow(/operation/);
  });

  it.each([false, true])("rejects relabelling an original result with an independently executed equal-image population, empty=%s", empty => {
    const f = recordedLastLevelFixture(); if (!empty) f.deliver(0);
    const boundary = f.boundary(), population = f.collect(boundary), other = f.collect(boundary), result = calculate(population);
    expect(lastLevelPopulationImage(other)).toEqual(lastLevelPopulationImage(population));
    expect(() => readLastLevelReductionResult(result, other)).toThrow(/original population/);
    expect(() => readLastLevelReductionResult(calculate(other), other)).not.toThrow();
  });

  it("checks the actual consumer manifest plan, not merely matching route strings", () => {
    const f = recordedLastLevelFixture(); f.deliver(0); const population = f.collect(), result = calculate(population);
    const evidence = result[0]!.evidence, consumer = PRIMARY_EVIDENCE_MANIFEST.consumers[0]!;
    const manifest = { ...PRIMARY_EVIDENCE_MANIFEST,
      consumers: [{ ...consumer, accepts: [ref] }],
      bindings: [{ ...PRIMARY_EVIDENCE_MANIFEST.bindings[0]!, consumer, producer: evidence.producer, projection: ref }] };
    expect(() => evidenceForConsumer(manifest, consumer, [evidence])).not.toThrow();
    const changed = { ...manifest, projections: manifest.projections.map(value => value.id === ref.id && value.version === 2 ? { ...value, semantics: `${value.semantics} changed` } : value) };
    expect(() => evidenceForConsumer(changed, consumer, [evidence])).toThrow(/consumer manifest/);
    expect(isDeclaredEvidence(evidence)).toBe(true);
  });
});
