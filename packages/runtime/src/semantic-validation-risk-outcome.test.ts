// Fixed-source own-original-piece risk, not move quality or forced-gain grading.
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceDigest, evidenceForConsumer } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation, readSubjectOutcomePopulation } from "./internal/evidence-value-routes.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase, semanticFactConstraintSha256, type SemanticValidationCaseFor } from "./semantic-validation.js";
import { retainedReferenceInput } from "./semantic-validation-line-outcome-sources.js";
import { RISK_OUTCOME_LITERAL_SOURCE, RISK_OUTCOME_POPULATIONS, referenceExchangeUnits, referenceRiskEvents, referenceRiskPopulation } from "./semantic-validation-risk-outcome-sources.js";
import type { SubjectOutcomePayload, SubjectOutcomePopulation } from "./semantic-subject-types.js";

type Mutable<T> = T extends readonly (infer U)[] ? Mutable<U>[] : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const faults = vi.hoisted(() => ({ kind: "none", calls: 0 }));
vi.mock("./semantic-subject-outcomes.js", async importOriginal => {
  const original = await importOriginal<typeof import("./semantic-subject-outcomes.js")>();
  return { ...original, computeSubjectOutcomes: ((...args: Parameters<typeof original.computeSubjectOutcomes>) => {
    const result = original.computeSubjectOutcomes(...args);
    if (args[0] !== "loose_piece" || faults.kind === "none" || result.kind !== "available") return result;
    faults.calls++;
    const population = structuredClone(result.population) as Mutable<SubjectOutcomePopulation<"loose_piece">>;
    const payloads = structuredClone(result.payloads) as Mutable<SubjectOutcomePayload<"loose_piece">>[];
    const inverted = { false_to_true: "true_to_false", true_to_false: "false_to_true", false_to_false: "true_to_true", true_to_true: "false_to_false" } as const;
    if (faults.kind === "missing-total") population.subjects.pop();
    if (faults.kind === "wrong-total") population.subjects[0]!.played.value = !population.subjects[0]!.played.value;
    if (faults.kind === "wrong-total-identity") population.subjects[0]!.subject.root.square = "a1";
    if (faults.kind === "invent-quiet") {
      if (payloads.length !== 0) throw Error("Actual uniform quiet domain required");
      const first = population.subjects[0]!;
      payloads.push({ family: "loose_piece", actor: population.actor, beforeFen: population.beforeFen,
        moveUci: population.moveUci, afterFen: population.afterFen, subject: first.subject, parameters: {},
        root: first.root, played: first.played, alternativeRelation: "false_to_true", alternatives: first.alternatives,
        supportingMoves: [first.alternatives[0]!.moveUci], legalAlternatives: first.alternatives.length, alternativesWithOutcome: 1 });
    }
    for (const payload of payloads) {
      if (faults.kind === "subject") payload.subject.root.square = payload.subject.root.square === "a1" ? "b1" : "a1";
      if (faults.kind === "color") payload.subject.root.color = payload.subject.root.color === "white" ? "black" : "white";
      if (faults.kind === "role") payload.subject.root.role = payload.subject.root.role === "pawn" ? "rook" : "pawn";
      if (faults.kind === "root") payload.root.value = !payload.root.value;
      if (faults.kind === "played") payload.played.value = !payload.played.value;
      if (faults.kind === "state") payload.alternatives[0]!.state.value = !payload.alternatives[0]!.state.value;
      if (faults.kind === "current") payload.played.current.square = payload.played.current.square === "a1" ? "b1" : "a1";
      if (faults.kind === "ep-landing-as-victim") payload.played.current.square = "e3";
      if (faults.kind === "promotion-as-pawn") payload.played.current.role = "pawn";
      if (faults.kind === "crossed") {
        const first = payload.alternatives[0]!, other = payload.alternatives.find(edge => edge.state.value !== first.state.value);
        if (other !== undefined) { [first.state, other.state] = [other.state, first.state]; [first.relation, other.relation] = [other.relation, first.relation]; }
      }
      if (faults.kind === "support") {
        const other = payload.alternatives.find(edge => !payload.supportingMoves.includes(edge.moveUci));
        if (other !== undefined) payload.supportingMoves[0] = other.moveUci;
      }
      if (faults.kind === "denominator") payload.legalAlternatives++;
      if (faults.kind === "numerator") payload.alternativesWithOutcome++;
      if (faults.kind === "symmetric") {
        payload.root.value = !payload.root.value; payload.played.value = !payload.played.value;
        payload.alternativeRelation = inverted[payload.alternativeRelation];
        for (const edge of payload.alternatives) { edge.state.value = !edge.state.value; edge.relation = inverted[edge.relation as keyof typeof inverted]; }
      }
    }
    if (faults.kind === "symmetric") for (const subject of population.subjects) {
      subject.root.value = !subject.root.value; subject.played.value = !subject.played.value;
      subject.playedRelation = inverted[subject.playedRelation as keyof typeof inverted];
      for (const edge of subject.alternatives) { edge.state.value = !edge.state.value; edge.relation = inverted[edge.relation as keyof typeof inverted]; }
    }
    if (faults.kind === "duplicate") payloads.push(structuredClone(payloads[0]!));
    if (faults.kind === "omit") payloads.pop();
    if (faults.kind === "reverse") payloads.reverse();
    return { ...result, population, payloads } as typeof result;
  }) as typeof original.computeSubjectOutcomes };
});
afterEach(() => { faults.kind = "none"; faults.calls = 0; });
const source = RISK_OUTCOME_LITERAL_SOURCE;
const cases = source.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm, operation: source.operation,
  input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: source.sourceId, sourceRevision: source.sourceRevision, licence: source.licence,
    span: { start: 0, end: source.text.length, textSha256: sha256Text(source.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
})) as readonly SemanticValidationCaseFor<"runtime.semantic.subject_outcomes">[];
const registry = new Map(cases.map(value => [value.id, value]));
const selected = (id: string, arm = "positive") => cases.find(value => value.arm === arm && value.id.includes(`.${id}.`))!;
const owners = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();
function owner(fen: string, fresh = false) {
  const saved = owners.get(fen); if (saved !== undefined && !fresh) return saved;
  const compiled = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (compiled.kind !== "ready") throw Error("Complete original legal source required");
  if (!fresh) owners.set(fen, compiled.receipt); return compiled.receipt;
}
describe("fixed original-own-piece risk authority", () => {
  for (const row of RISK_OUTCOME_POPULATIONS) for (const move of row.plays) it(`${row.id}/${move} preserves every own original and legal alternative`, () => {
    const receipt = owner(row.root), input = retainedReferenceInput("loose_piece", row, move);
    expect(input.population.alternatives.map(edge => [edge.moveUci, edge.afterFen])).toEqual(receipt.packet.candidates.map(edge => [edge.moveUci, edge.afterFen]));
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.loose_piece@2", { receipt, moveUci: move });
    const invocation = readSubjectOutcomeInvocation(value), expected = referenceRiskPopulation(row, move);
    expect(invocation.receipt).toBe(receipt);
    if (expected === undefined) {
      expect(row.id.startsWith("invalid-")).toBe(true);
      expect(value.kind).toBe("unavailable"); expect(invocation.population.kind).toBe("unavailable"); expect(invocation.inputs).toEqual([]);
      expect(cases.some(value => value.input.population.rootFen === row.root)).toBe(false);
      return;
    }
    if (value.kind !== "available" || invocation.population.kind !== "available") throw Error("Complete risk source required");
    expect(invocation.inputs[0]).toBe(receipt.legalMovesInput);
    expect(invocation.population.population).toEqual(expected);
    expect(value.values.map(value => ({ sign: "avoided", operands: value.payload }))).toEqual(referenceRiskEvents(row, move));
  });
  it.each(cases)("$id executes its actual source under fixed cited authority", async value => {
    const result = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(result.status, result.failure?.message).toBe("passed"); expect(result.invocations).toBe(value.arm === "orientation" ? 2 : 1);
    const row = RISK_OUTCOME_POPULATIONS.find(row => row.root === value.input.population.rootFen)!;
    expect(result.targetCount).toBe(referenceRiskEvents(row, value.input.population.played.moveUci)!.length);
  });
  it("has genuine multi-output, distinct-alternative and nonsupporting witnesses", () => {
    const value = selected("unprofitable.white");
    if (value.expectation.kind !== "emits_exact") throw Error("Exact independent outputs required");
    expect(value.expectation.events.length).toBeGreaterThan(1);
  });
  it.each(["subject", "color", "role", "root", "played", "state", "current", "crossed", "support", "denominator", "numerator", "duplicate", "omit", "reverse"])("rejects real pre-mint %s errors", async kind => {
    faults.kind = kind;
    const result = await executeSemanticValidationCase(selected("unprofitable.white"), SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(result).toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
  });
  it("uses both absolute partners to reject an internally consistent boolean inversion", async () => {
    faults.kind = "symmetric";
    expect(await executeSemanticValidationCase(selected("unprofitable.white", "orientation"), SEMANTIC_VALIDATION_RESOLVERS, registry)).toMatchObject({ status: "passed", invocations: 2 });
    for (const side of ["white", "black"]) expect(await executeSemanticValidationCase(selected(`unprofitable.${side}`), SEMANTIC_VALIDATION_RESOLVERS, registry))
      .toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
    expect(faults.calls).toBe(4);
  });
  it.each([["ep-landing-as-victim", "ep-double-push.white"], ["promotion-as-pawn", "promotion.white"]])("rejects %s on the genuine %s source", async (kind, id) => {
    faults.kind = kind;
    const result = await executeSemanticValidationCase(selected(id), SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(result).toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
  });
  it("rejects a genuinely minted event on a nonforced uniform-true domain", async () => {
    faults.kind = "invent-quiet";
    const result = await executeSemanticValidationCase(selected("uniform-true.white", "semantic_negative"), SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(result).toMatchObject({ status: "failed", invocations: 1, targetCount: 1, failure: { code: "SEMANTIC_VALIDATION_NEGATIVE_EMITTED" } });
  });
  it.each(["missing-total", "wrong-total", "wrong-total-identity"])("checks complete quiet totals independently: %s", kind => {
    faults.kind = kind;
    const row = RISK_OUTCOME_POPULATIONS.find(row => row.id === "uniform-true.white")!, move = row.plays[0]!;
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.loose_piece@2", { receipt: owner(row.root, true), moveUci: move });
    expect(value).toEqual({ kind: "available", values: [] }); expect(faults.calls).toBe(1);
    const actual = readSubjectOutcomeInvocation(value).population;
    if (actual.kind !== "available") throw Error("Complete quiet risk domain required");
    expect(actual.population).not.toEqual(referenceRiskPopulation(row, move));
  });
  it("pins a deeper optional-stop choice that changes the profitable-risk boolean", () => {
    const root = "7k/6q1/8/4p3/3Q4/2P5/8/3R3K b - - 0 1", position = Chess.fromSetup(parseFen(root).unwrap()).unwrap();
    expect(referenceExchangeUnits(root, "e5d4")).toBe(8);
    for (const uci of ["e5d4", "c3d4", "g7d4", "d1d4"]) {
      const move = parseUci(uci)!; expect(position.isLegal(move), uci).toBe(true); position.play(move);
    }
    // Forcing this whole line gives9-1+1-9=0; declining Qxd4 retains8>0.
    const row = RISK_OUTCOME_POPULATIONS.find(row => row.id === "decline-profit.white")!;
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.loose_piece@2", { receipt: owner(row.root), moveUci: row.plays[0]! });
    const actual = readSubjectOutcomePopulation("loose_piece", value);
    if (actual.kind !== "available") throw Error("Complete deep exchange domain required");
    expect(actual.population.subjects.find(cell => cell.subject.root.square === "d4")?.root.value).toBe(true);
  });
  it("preserves genuine values, refuses copies and keeps ordinary modules held", () => {
    const row = RISK_OUTCOME_POPULATIONS.find(row => row.id === "unprofitable.white")!, receipt = owner(row.root);
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.loose_piece@2", { receipt, moveUci: row.plays[0]! });
    if (value.kind !== "available") throw Error("Genuine risk evidence required");
    const original = readSubjectOutcomeInvocation(value);
    expect(value.values.length).toBeGreaterThan(1);
    for (const item of value.values) {
      expect(readSubjectOutcomeInvocation(item)).toBe(original); expect(() => readSubjectOutcomeInvocation(structuredClone(item))).toThrow();
      for (const id of ["module.postcommit_nudge", "module.review_map"]) expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id, version: 2 }, [item]).items).toEqual([]);
    }
    expect(() => readSubjectOutcomeInvocation(structuredClone(value))).toThrow();
  });
});
