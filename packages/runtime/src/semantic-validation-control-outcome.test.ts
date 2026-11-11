// Fixed-source geometric counts; canonical/profile qualification is a separate wave.
import { afterEach, describe, expect, it, vi } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceDigest, evidenceForConsumer } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "./internal/evidence-value-routes.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase, semanticFactConstraintSha256, type SemanticValidationCaseFor } from "./semantic-validation.js";
import { CONTROL_OUTCOME_LITERAL_SOURCE, CONTROL_OUTCOME_POPULATIONS, referenceControlEvents, referenceControlInput, referenceControlPopulation } from "./semantic-validation-control-outcome-sources.js";
import type { SubjectOutcomePayload, SubjectOutcomePopulation } from "./semantic-subject-types.js";

type Mutable<T> = T extends readonly (infer U)[] ? Mutable<U>[] : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const faults = vi.hoisted(() => ({ kind: "none", calls: 0 }));
vi.mock("./semantic-subject-outcomes.js", async importOriginal => {
  const original = await importOriginal<typeof import("./semantic-subject-outcomes.js")>();
  return { ...original, computeSubjectOutcomes: ((...args: Parameters<typeof original.computeSubjectOutcomes>) => {
    const result = original.computeSubjectOutcomes(...args);
    if (args[0] !== "direct_attack_count" || faults.kind === "none" || result.kind !== "available") return result;
    faults.calls++;
    const population = structuredClone(result.population) as Mutable<SubjectOutcomePopulation<"direct_attack_count">>;
    const payloads = structuredClone(result.payloads) as Mutable<SubjectOutcomePayload<"direct_attack_count">>[];
    if (faults.kind === "missing-total") population.subjects.pop();
    if (faults.kind === "wrong-total") population.subjects[0]!.played.value++;
    if (faults.kind === "wrong-total-identity") population.subjects[0]!.subject.square = "b1";
    if (faults.kind === "invent-forced") {
      if (payloads.length !== 0 || population.subjects[0]!.alternatives.length !== 0) throw Error("Genuine forced quiet domain required");
      const first = population.subjects[0]!;
      // The deliberate semantic error is emitting without support, not inventing a move.
      payloads.push({ family: "direct_attack_count", actor: population.actor, beforeFen: population.beforeFen,
        moveUci: population.moveUci, afterFen: population.afterFen, subject: first.subject, parameters: {}, root: first.root,
        played: first.played, alternativeRelation: first.playedRelation === "increase" ? "decrease" : "increase",
        alternatives: [], supportingMoves: [], legalAlternatives: 0, alternativesWithOutcome: 0 });
    }
    for (const payload of payloads) {
      if (faults.kind === "subject") payload.subject.square = payload.subject.square === "a1" ? "b1" : "a1";
      if (faults.kind === "color") payload.subject.color = payload.subject.color === "white" ? "black" : "white";
      if (faults.kind === "root") payload.root.value++;
      if (faults.kind === "played") payload.played.value++;
      if (faults.kind === "state") payload.alternatives[0]!.state.value++;
      if (faults.kind === "crossed") {
        const first = payload.alternatives[0]!, other = payload.alternatives.find(row => row.state.value !== first.state.value);
        if (other !== undefined) {
          [first.state, other.state] = [other.state, first.state]; [first.relation, other.relation] = [other.relation, first.relation];
        }
      }
      if (faults.kind === "support") {
        const other = payload.alternatives.find(row => !payload.supportingMoves.includes(row.moveUci));
        if (other !== undefined) payload.supportingMoves[0] = other.moveUci;
      }
      if (faults.kind === "denominator") payload.legalAlternatives++;
      if (faults.kind === "numerator") payload.alternativesWithOutcome++;
      if (faults.kind === "symmetric") {
        payload.root.value++; payload.played.value++;
        for (const edge of payload.alternatives) edge.state.value++;
      }
    }
    if (faults.kind === "symmetric") for (const subject of population.subjects) {
      subject.root.value++; subject.played.value++;
      for (const edge of subject.alternatives) edge.state.value++;
    }
    if (faults.kind === "duplicate") payloads.push(structuredClone(payloads[0]!));
    if (faults.kind === "omit") payloads.pop();
    if (faults.kind === "reverse") payloads.reverse();
    return { ...result, population, payloads } as typeof result;
  }) as typeof original.computeSubjectOutcomes };
});
afterEach(() => { faults.kind = "none"; faults.calls = 0; });
const source = CONTROL_OUTCOME_LITERAL_SOURCE;
const cases = source.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm, operation: source.operation,
  input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: source.sourceId, sourceRevision: source.sourceRevision, licence: source.licence,
    span: { start: 0, end: source.text.length, textSha256: sha256Text(source.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
})) as readonly SemanticValidationCaseFor<"runtime.semantic.subject_outcomes">[];
const registry = new Map(cases.map(value => [value.id, value]));
const selected = (row: string, arm = "positive") => cases.find(value => value.arm === arm && value.id.includes(`.${row}.`))!;
const owners = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();
function owner(fen: string, fresh = false) {
  const saved = owners.get(fen); if (saved !== undefined && !fresh) return saved;
  const compiled = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (compiled.kind !== "ready") throw Error("Complete legal source required");
  if (!fresh) owners.set(fen, compiled.receipt); return compiled.receipt;
}

describe("fixed independent full-square control source", () => {
  for (const row of CONTROL_OUTCOME_POPULATIONS) for (const move of row.plays) it(`${row.id}/${move} checks every zero and nonzero root/played/alternative cell`, () => {
    const receipt = owner(row.root), input = referenceControlInput(row, move);
    expect(input.population.alternatives.map(edge => [edge.moveUci, edge.afterFen])).toEqual(receipt.packet.candidates.map(edge => [edge.moveUci, edge.afterFen]));
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.direct_attack_count@2", { receipt, moveUci: move });
    const invocation = readSubjectOutcomeInvocation(value);
    if (value.kind !== "available" || invocation.population.kind !== "available") throw Error("Complete control source required");
    expect(invocation.receipt).toBe(receipt); expect(invocation.inputs[0]).toBe(receipt.legalMovesInput);
    expect(invocation.population.population.subjects).toHaveLength(128);
    expect(invocation.population.population).toEqual(referenceControlPopulation(row, move));
    expect(value.values.map(value => ({ sign: "avoided", operands: value.payload }))).toEqual(referenceControlEvents(row, move));
  });

  it.each(cases)("$id executes the full source with its exact fixed authority", async value => {
    const result = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(result.status, result.failure?.message).toBe("passed");
    expect(result.invocations).toBe(value.arm === "orientation" ? 2 : 1);
    const row = CONTROL_OUTCOME_POPULATIONS.find(row => row.root === value.input.population.rootFen)!;
    expect(result.targetCount).toBe(referenceControlEvents(row, value.input.population.played.moveUci).length);
  });

  it("has genuine multi-output and crossed-state/support witnesses", () => {
    const value = selected("start.white");
    if (value.expectation.kind !== "emits_exact") throw Error("Exact source outputs required");
    expect(value.expectation.events.length).toBeGreaterThan(1);
    expect(value.expectation.events.some(event => {
      const payload = event.operands as unknown as SubjectOutcomePayload<"direct_attack_count">;
      return new Set(payload.alternatives.map(edge => edge.state.value)).size > 1;
    })).toBe(true);
    expect(value.expectation.events.some(event => {
      const payload = event.operands as unknown as SubjectOutcomePayload<"direct_attack_count">;
      return payload.alternatives.some(edge => !payload.supportingMoves.includes(edge.moveUci));
    })).toBe(true);
  });

  it.each(["subject", "color", "root", "played", "state", "crossed", "support", "denominator", "numerator", "duplicate", "omit", "reverse"])("rejects a real pre-mint %s corruption", async kind => {
    faults.kind = kind;
    const result = await executeSemanticValidationCase(selected("start.white"), SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(result).toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
  });

  it("uses both absolute references to reject a consistent offset that passes mirrors", async () => {
    faults.kind = "symmetric";
    expect(await executeSemanticValidationCase(selected("start.white", "orientation"), SEMANTIC_VALIDATION_RESOLVERS, registry)).toMatchObject({ status: "passed", invocations: 2 });
    for (const side of ["white", "black"]) expect(await executeSemanticValidationCase(selected(`start.${side}`), SEMANTIC_VALIDATION_RESOLVERS, registry))
      .toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
    expect(faults.calls).toBe(4);
  });

  it.each(["white", "black"])("rejects a genuinely minted unsupported event on a forced %s source", async side => {
    faults.kind = "invent-forced";
    const result = await executeSemanticValidationCase(selected(`only-capture.${side}`, "semantic_negative"), SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(result).toMatchObject({ status: "failed", invocations: 1, targetCount: 1, failure: { code: "SEMANTIC_VALIDATION_NEGATIVE_EMITTED" } });
  });

  for (const side of ["white", "black"]) it.each(["missing-total", "wrong-total", "wrong-total-identity"])(`checks a forced ${side} table despite empty public events: %s`, kind => {
    faults.kind = kind;
    const row = CONTROL_OUTCOME_POPULATIONS.find(row => row.id === `only-capture.${side}`)!, move = row.plays[0]!;
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.direct_attack_count@2", { receipt: owner(row.root, true), moveUci: move });
    expect(value).toEqual({ kind: "available", values: [] }); expect(faults.calls).toBe(1);
    const actual = readSubjectOutcomeInvocation(value).population;
    if (actual.kind !== "available") throw Error("Forced source remains available");
    expect(actual.population).not.toEqual(referenceControlPopulation(row, move));
  });

  it("retains actual invocation identities, refuses copies and keeps ordinary modules held", () => {
    const row = CONTROL_OUTCOME_POPULATIONS.find(row => row.id === "start.white")!, receipt = owner(row.root);
    const result = invokeEvidenceValueRoute("derived.semantic_avoidance.direct_attack_count@2", { receipt, moveUci: row.plays[0]! });
    if (result.kind !== "available") throw Error("Genuine control events required");
    const original = readSubjectOutcomeInvocation(result);
    for (const value of result.values) {
      expect(readSubjectOutcomeInvocation(value)).toBe(original);
      expect(() => readSubjectOutcomeInvocation(structuredClone(value))).toThrow();
      for (const id of ["module.postcommit_nudge", "module.review_map"]) expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id, version: 2 }, [value]).items).toEqual([]);
    }
    expect(() => readSubjectOutcomeInvocation(structuredClone(result))).toThrow();
  });
});
