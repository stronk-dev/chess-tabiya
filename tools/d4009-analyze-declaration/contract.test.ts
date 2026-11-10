// Disposable PRE-ADOPTION D4009 authoring experiment, NOT product CI, implementation or qualification.
// Once these three refs really register, do not double-append: preserve this historical witness
// or explicitly revise the research to inspect the actual registered rows instead.
// Exercise the unchanged static compiler over the FULL installed declaration graph plus only
// the proposed Analyze rows. No source stubs, evidence wrappers or narrowed manifest.
import { describe, expect, it } from "vitest";
import { EVIDENCE_CONTRACT_DECLARATIONS, PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { compileEvidenceManifest, type EvidenceContractDeclarations, type EvidenceGrounding, type ProjectionDeclaration, type VersionedEvidenceId } from "../../packages/runtime/src/evidence-contract.js";

const ref = (id: string): VersionedEvidenceId => ({ id, version: 1 });
const edge = ref("run.record.edge"), evaluation = ref("recorded.inspector.eval_packet");
const recordedPv = ref("recorded.inspector.pv_packet"), typedPv = ref("live.stockfish.principal_variation");
const inputs = [[edge, evaluation, typedPv], [edge, recordedPv], [edge, evaluation]] as const;
const common = {
  version: 1, producer: ref("derived.review"), role: "reading", plane: "derived",
  payloadType: "RecordedAnalyzeLineOperands", semantics: "Fixed original recorded Analyze view; author research only.",
  operands: ["kind", "sourceArm", "reviewedMove", "engine", "bound", "lineScope", "line", "reason"],
  signs: ["state"], exactness: "measured", confidence: "reported",
  abstention: { possible: true, reasons: ["input_abstained"] }, forms: ["list", "panel"],
  limitations: ["No fresh provider query, move quality or inferred strategic purpose."],
} as const;
const rows: readonly ProjectionDeclaration[] = [
  { ...common, id: "derived.review.analysis_typed_pv", grounding: "declared_convention", answerContent: ["move", "principal_variation"], dependsOn: inputs[0], derivation: { inputs: inputs[0] } },
  { ...common, id: "derived.review.analysis_recorded_pv", grounding: "recorded_run", answerContent: ["move", "principal_variation"], dependsOn: inputs[1], derivation: { inputs: inputs[1] } },
  { ...common, id: "derived.review.analysis_recorded_first", grounding: "recorded_run", answerContent: ["move"], dependsOn: inputs[2], derivation: { inputs: inputs[2] } },
];

function declarations(proposed: readonly ProjectionDeclaration[]): EvidenceContractDeclarations {
  const base = EVIDENCE_CONTRACT_DECLARATIONS;
  const prototype = base.adapters.find(row => row.consumer.id === "module.full_inspector" && row.consumer.version === 2 && row.projection.id === "recorded.inspector.pv_packet")!;
  expect(prototype).toBeDefined();
  return {
    ...base,
    producers: base.producers.map(row => row.id === "derived.review" ? { ...row, outputs: [...row.outputs, ...proposed] } : row),
    consumers: base.consumers.map(row => row.id === "module.full_inspector" && row.version === 2 ? { ...row, accepts: [...row.accepts, ...proposed.map(row => ref(row.id))] } : row),
    adapters: [...base.adapters, ...proposed.map((row, index) => ({ ...prototype, id: `research.d4009.analyze.${index + 1}`, version: 1,
      implementation: `researchD4009LiteralAdapter${index + 1}`, producer: row.producer, projection: ref(row.id), forms: ["panel"] as const, answerContent: row.answerContent }))],
  };
}
function grouped(indices: readonly number[], grounding: EvidenceGrounding): ProjectionDeclaration {
  return { ...common, id: "derived.review.analysis_research_group", grounding,
    answerContent: [...new Set(indices.flatMap(index => rows[index]!.answerContent))],
    dependsOn: [...new Map(indices.flatMap(index => inputs[index]!).map(value => [value.id, value])).values()],
    derivation: { anyOf: indices.map(index => inputs[index]!) },
  };
}

describe("D4009 disposable whole-declaration Analyze representation witness", () => {
  it("pins actual unchanged source groundings, answers and abstention", () => {
    const actual = (input: VersionedEvidenceId) => PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === input.id && row.version === input.version)!;
    expect([edge, evaluation, recordedPv, typedPv].map(input => ({ id: input.id, grounding: actual(input).grounding, answers: actual(input).answerContent }))).toEqual([
      { id: edge.id, grounding: "recorded_run", answers: ["fact", "move"] },
      { id: evaluation.id, grounding: "recorded_run", answers: ["evaluation"] },
      { id: recordedPv.id, grounding: "recorded_run", answers: ["move", "principal_variation"] },
      { id: typedPv.id, grounding: "bounded_search", answers: ["move", "principal_variation"] },
    ]);
    expect(actual(typedPv).abstention.possible).toBe(true);
  });

  it("rejects the accepted one-projection draft without weakening the compiler", () => {
    expect(() => compileEvidenceManifest(declarations([grouped([0, 1, 2], "recorded_run")]))).toThrow(/EVIDENCE_DERIVATION_WIDENS/u);
  });

  it.each((["recorded_run", "declared_convention"] as const).flatMap(grounding => ([[0, 1], [0, 2], [1, 2]] as const).map(indices => ({ grounding, indices }))))("rejects two groups: $indices with $grounding", ({ grounding, indices }) => {
    const ungrouped = [0, 1, 2].find(index => !indices.some(selected => selected === index))!;
    expect(() => compileEvidenceManifest(declarations([grouped(indices, grounding), rows[ungrouped]!]))).toThrow(/EVIDENCE_DERIVATION_WIDENS/u);
  });

  it("compiles all three honest literal projections with every original source/consumer/binding intact", () => {
    const candidate = declarations(rows), result = compileEvidenceManifest(candidate);
    expect(candidate.producers).toHaveLength(EVIDENCE_CONTRACT_DECLARATIONS.producers.length);
    expect(candidate.consumers).toHaveLength(EVIDENCE_CONTRACT_DECLARATIONS.consumers.length);
    expect(result.projections).toHaveLength(PRIMARY_EVIDENCE_MANIFEST.projections.length + 3);
    expect(result.bindings).toHaveLength(PRIMARY_EVIDENCE_MANIFEST.bindings.length + 3);
    for (const source of EVIDENCE_CONTRACT_DECLARATIONS.producers) expect(candidate.producers.find(row => row.id === source.id)?.outputs.slice(0, source.outputs.length)).toEqual(source.outputs);
    expect(candidate.adapters.slice(0, EVIDENCE_CONTRACT_DECLARATIONS.adapters.length)).toEqual(EVIDENCE_CONTRACT_DECLARATIONS.adapters);
    expect(result.bindings.filter(row => row.consumer.id === "module.full_inspector" && row.consumer.version === 2)).toHaveLength(86);
    expect(result.bindings.filter(row => row.consumer.id.startsWith("module."))).toHaveLength(297);
    expect(result.projections.filter(row => rows.some(added => added.id === row.id)).map(row => ({ id: row.id, grounding: row.grounding, answers: row.answerContent }))).toEqual(rows.map(row => ({ id: row.id, grounding: row.grounding, answers: row.answerContent })).sort((a, b) => a.id.localeCompare(b.id)));
  });

  it("still rejects a typed row omitting input_abstained", () => {
    expect(() => compileEvidenceManifest(declarations([{ ...rows[0]!, abstention: { possible: true, reasons: ["other"] } }, rows[1]!, rows[2]!]))).toThrow(/EVIDENCE_DERIVATION_WIDENS/u);
  });
});
