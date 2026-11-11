// Complete original-piece/direction proofs. No canonical/profile admission implied.
import { afterEach, describe, expect, it, vi } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import { evidenceDigest, evidenceForConsumer } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "./internal/evidence-value-routes.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase, semanticFactConstraintSha256, type SemanticValidationCaseFor } from "./semantic-validation.js";
import { LINE_OUTCOME_LITERAL_SOURCE, LINE_OUTCOME_POPULATIONS, referenceLineEvents, referenceLinePopulation, retainedReferenceInput } from "./semantic-validation-line-outcome-sources.js";
import type { StateByFamily, SubjectOutcomePayload, SubjectOutcomePopulation } from "./semantic-subject-types.js";

type Mutable<T> = T extends readonly (infer U)[] ? Mutable<U>[] : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Payload = Mutable<SubjectOutcomePayload<"line_blockers">>;
const faults = vi.hoisted(() => ({ kind: "none", calls: 0 }));
vi.mock("./semantic-subject-outcomes.js", async importOriginal => {
  const original = await importOriginal<typeof import("./semantic-subject-outcomes.js")>();
  return { ...original, computeSubjectOutcomes: ((...args: Parameters<typeof original.computeSubjectOutcomes>) => {
    const result = original.computeSubjectOutcomes(...args);
    if (args[0] !== "line_blockers" || faults.kind === "none" || result.kind !== "available") return result;
    faults.calls++;
    const population = structuredClone(result.population) as Mutable<SubjectOutcomePopulation<"line_blockers">>;
    let payloads = structuredClone(result.payloads) as Payload[];
    if (faults.kind === "missing-total") population.subjects.pop();
    if (faults.kind === "role-as-zero") {
      const cell = population.subjects.find(cell => cell.played.kind === "inapplicable" && cell.played.reason === "role")!;
      // A zero ray is deliberately fabricated from a real identity, not new input.
      cell.played = { kind: "present", value: 0, ray: { slider: cell.subject.root, endpoint: "a1", strictInterior: [], blockers: [] } };
    }
    if (faults.kind === "promotion-as-pawn") {
      for (const cell of population.subjects) if (cell.subject.root.role === "pawn" && cell.played.kind === "present") {
        cell.played = { kind: "inapplicable", reason: "role", current: { ...cell.played.ray.slider, role: "pawn" } };
      }
    }
    if (faults.kind === "invent-quiet") {
      if (payloads.length !== 0) throw Error("Actual quiet source required");
      const first = population.subjects[0]!;
      payloads.push({ family: "line_blockers", actor: population.actor, beforeFen: population.beforeFen, moveUci: population.moveUci,
        afterFen: population.afterFen, subject: first.subject, parameters: {}, root: first.root, played: first.played,
        alternativeRelation: "increase", alternatives: first.alternatives, supportingMoves: [first.alternatives[0]!.moveUci],
        legalAlternatives: first.alternatives.length, alternativesWithOutcome: 1 });
    }
    if (faults.kind === "symmetric-first-blocker") {
      const cap = (state: Mutable<StateByFamily["line_blockers"]>) => {
        if (state.kind === "present") { state.ray.blockers = state.ray.blockers.slice(0, 1); state.value = state.ray.blockers.length; }
      };
      const relation = (root: StateByFamily["line_blockers"], state: StateByFamily["line_blockers"]) => root.kind !== "present" || state.kind !== "present"
        ? "not_comparable" as const : state.value > root.value ? "increase" as const : state.value < root.value ? "decrease" as const : "equal" as const;
      for (const cell of population.subjects) {
        cap(cell.root); cap(cell.played); cell.playedRelation = relation(cell.root, cell.played);
        for (const edge of cell.alternatives) { cap(edge.state); edge.relation = relation(cell.root, edge.state); }
      }
      // Rebuild groups from the genuinely wrong table so counts, support and relations
      // agree internally. Geometric mirroring alone still cannot establish completeness.
      payloads = population.subjects.flatMap(({ playedRelation, ...cell }) => playedRelation === "not_comparable" ? []
        : (["increase", "decrease", "equal"] as const).flatMap(alternativeRelation => {
          if (alternativeRelation === playedRelation) return [];
          const supportingMoves = cell.alternatives.filter(edge => edge.relation === alternativeRelation).map(edge => edge.moveUci);
          return supportingMoves.length === 0 ? [] : [{ family: "line_blockers" as const, actor: population.actor,
            beforeFen: population.beforeFen, moveUci: population.moveUci, afterFen: population.afterFen, ...cell,
            alternativeRelation, supportingMoves, legalAlternatives: cell.alternatives.length, alternativesWithOutcome: supportingMoves.length }];
        }));
    }
    for (const payload of payloads) {
      if (faults.kind === "subject") payload.subject.root.square = payload.moveUci.slice(2, 4) as typeof payload.subject.root.square;
      if (faults.kind === "color") payload.subject.root.color = payload.subject.root.color === "white" ? "black" : "white";
      if (faults.kind === "direction") payload.subject.direction.dr = payload.subject.direction.dr === 1 ? -1 : 1;
      if (faults.kind === "root" && payload.root.kind === "present") payload.root.value++;
      if (faults.kind === "played" && payload.played.kind === "present") payload.played.value++;
      if (faults.kind === "state") {
        const edge = payload.alternatives.find(edge => edge.state.kind === "present");
        if (edge?.state.kind === "present") edge.state.value++;
      }
      if (faults.kind === "ray-members" && payload.played.kind === "present") payload.played.ray.strictInterior.reverse();
      if (faults.kind === "crossed") {
        const first = payload.alternatives[0]!, other = payload.alternatives.find(edge => JSON.stringify(edge.state) !== JSON.stringify(first.state));
        if (other !== undefined) { [first.state, other.state] = [other.state, first.state]; [first.relation, other.relation] = [other.relation, first.relation]; }
      }
      if (faults.kind === "support") {
        const other = payload.alternatives.find(edge => !payload.supportingMoves.includes(edge.moveUci));
        if (other !== undefined) payload.supportingMoves[0] = other.moveUci;
      }
      if (faults.kind === "removed-as-zero") for (const edge of payload.alternatives) if (edge.state.kind === "removed") {
        if (payload.root.kind !== "present") throw Error("Actual root ray required");
        edge.state = { kind: "present", value: 0, ray: structuredClone(payload.root.ray) }; edge.relation = "equal";
      }
      if (faults.kind === "denominator") payload.legalAlternatives++;
      if (faults.kind === "numerator") payload.alternativesWithOutcome++;
    }
    if (faults.kind === "duplicate") payloads.push(structuredClone(payloads[0]!));
    if (faults.kind === "omit") payloads.pop();
    if (faults.kind === "reverse") payloads.reverse();
    return { ...result, population, payloads } as typeof result;
  }) as typeof original.computeSubjectOutcomes };
});
afterEach(() => { faults.kind = "none"; faults.calls = 0; });
const source = LINE_OUTCOME_LITERAL_SOURCE;
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
  if (compiled.kind !== "ready") throw Error("Complete legal source required");
  if (!fresh) owners.set(fen, compiled.receipt); return compiled.receipt;
}
describe("fixed original-piece ray authority", () => {
  it.each(LINE_OUTCOME_POPULATIONS)("$id checks all original roots/directions and legal successors", row => {
    const move = row.plays[0]!, receipt = owner(row.root), input = retainedReferenceInput("line_blockers", row, move);
    expect(input.population.alternatives.map(edge => [edge.moveUci, edge.afterFen])).toEqual(receipt.packet.candidates.map(edge => [edge.moveUci, edge.afterFen]));
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.line_blockers@2", { receipt, moveUci: move });
    const original = readSubjectOutcomeInvocation(value);
    if (value.kind !== "available" || original.population.kind !== "available") throw Error("Complete ray population required");
    expect(original.receipt).toBe(receipt); expect(original.inputs[0]).toBe(receipt.legalMovesInput);
    expect(original.population.population).toEqual(referenceLinePopulation(row, move));
    expect(value.values.map(value => ({ sign: "avoided", operands: value.payload }))).toEqual(referenceLineEvents(row, move));
  });
  it.each(cases)("$id executes the complete source with fixed cited authority", async value => {
    const result = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(result.status, result.failure?.message).toBe("passed");
    expect(result.invocations).toBe(value.arm === "orientation" ? 2 : 1);
    const row = LINE_OUTCOME_POPULATIONS.find(row => row.root === value.input.population.rootFen)!;
    expect(result.targetCount).toBe(referenceLineEvents(row, value.input.population.played.moveUci).length);
  });
  it("uses multiple output rows and actual differing alternatives", () => {
    const value = selected("blockers.white");
    if (value.expectation.kind !== "emits_exact") throw Error("Exact array required");
    expect(value.expectation.events.length).toBeGreaterThan(1);
  });
  it.each(["subject", "color", "direction", "root", "played", "state", "ray-members", "crossed", "support", "denominator", "numerator", "duplicate", "omit", "reverse"])("rejects genuine pre-mint %s mistakes", async kind => {
    faults.kind = kind;
    const result = await executeSemanticValidationCase(selected("blockers.white"), SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(result).toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
  });
  it("does not replace an original captured slider by a zero ray", async () => {
    faults.kind = "removed-as-zero";
    const result = await executeSemanticValidationCase(selected("replacement-quiet.white"), SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(result).toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
  });
  it("rejects a mirror-safe first-blocker truncation using both absolute partners", async () => {
    faults.kind = "symmetric-first-blocker";
    expect(await executeSemanticValidationCase(selected("blockers.white", "orientation"), SEMANTIC_VALIDATION_RESOLVERS, registry)).toMatchObject({ status: "passed", invocations: 2 });
    for (const side of ["white", "black"]) expect(await executeSemanticValidationCase(selected(`blockers.${side}`), SEMANTIC_VALIDATION_RESOLVERS, registry))
      .toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
    expect(faults.calls).toBe(4);
  });
  it("rejects a genuine minted event on a nonforced all-inapplicable domain", async () => {
    faults.kind = "invent-quiet";
    const result = await executeSemanticValidationCase(selected("no-sliders.white", "semantic_negative"), SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(result).toMatchObject({ status: "failed", invocations: 1, targetCount: 1, failure: { code: "SEMANTIC_VALIDATION_NEGATIVE_EMITTED" } });
  });
  it.each(["missing-total", "role-as-zero"])("checks complete inapplicable cells even with quiet public output: %s", kind => {
    faults.kind = kind;
    const row = LINE_OUTCOME_POPULATIONS.find(row => row.id === "no-sliders.white")!, move = row.plays[0]!;
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.line_blockers@2", { receipt: owner(row.root, true), moveUci: move });
    expect(value).toEqual({ kind: "available", values: [] }); expect(faults.calls).toBe(1);
    const original = readSubjectOutcomeInvocation(value).population;
    if (original.kind !== "available") throw Error("Complete non-slider domain required");
    expect(original.population).not.toEqual(referenceLinePopulation(row, move));
  });
  it.each(["queen", "rook", "bishop"])("retains the promoted %s role without changing the original pawn subject", role => {
    faults.kind = "promotion-as-pawn";
    const row = LINE_OUTCOME_POPULATIONS.find(row => row.id === `promotion-${role}.white`)!, move = row.plays[0]!;
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.line_blockers@2", { receipt: owner(row.root, true), moveUci: move });
    expect(value).toEqual({ kind: "available", values: [] }); expect(faults.calls).toBe(1);
    const original = readSubjectOutcomeInvocation(value).population;
    if (original.kind !== "available") throw Error("Complete promoted domain required");
    expect(original.population).not.toEqual(referenceLinePopulation(row, move));
  });
  it("retains original values, refuses copies and does not enable held ordinary consumers", () => {
    const row = LINE_OUTCOME_POPULATIONS.find(row => row.id === "blockers.white")!, receipt = owner(row.root);
    const value = invokeEvidenceValueRoute("derived.semantic_avoidance.line_blockers@2", { receipt, moveUci: row.plays[0]! });
    if (value.kind !== "available") throw Error("Original source required");
    const original = readSubjectOutcomeInvocation(value);
    expect(value.values.length).toBeGreaterThan(1);
    for (const item of value.values) {
      expect(readSubjectOutcomeInvocation(item)).toBe(original);
      expect(() => readSubjectOutcomeInvocation(structuredClone(item))).toThrow();
      for (const id of ["module.postcommit_nudge", "module.review_map"]) expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id, version: 2 }, [item]).items).toEqual([]);
    }
    expect(() => readSubjectOutcomeInvocation(structuredClone(value))).toThrow();
  });
});
