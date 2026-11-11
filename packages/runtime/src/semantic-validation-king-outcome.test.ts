// Fixed cited-source proofs. Canonical cases/profile admission remain a separate wave.
import { afterEach, describe, expect, it, vi } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "./internal/evidence-value-routes.js";
import { canonicalSemanticEdge } from "./semantic-validation-operations.js";
import { compareSemanticMirror, parseSemanticValidationCase, semanticFactConstraintSha256,
  type SemanticMirrorObservation, type SemanticValidationCaseFor } from "./semantic-validation.js";
import { evidenceDigest, evidenceForConsumer } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import type { SubjectOutcomePayload, SubjectOutcomePopulation } from "./semantic-subject-types.js";
import {
  KING_OUTCOME_FAMILIES, KING_OUTCOME_LITERAL_SOURCES, KING_OUTCOME_POPULATIONS,
  kingOutcomeInput, literalKingOutcomeEvents, literalKingOutcomePopulation,
  type KingOutcomeFamily,
} from "./semantic-validation-king-outcome-sources.js";

type LiteralPopulation = (typeof KING_OUTCOME_POPULATIONS)[number];
type Mutable<T> = T extends readonly (infer U)[] ? Mutable<U>[] : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const faults = vi.hoisted(() => ({ family: "king_zone" as KingOutcomeFamily, kind: "none", calls: 0 }));
vi.mock("./semantic-subject-outcomes.js", async importOriginal => {
  const original = await importOriginal<typeof import("./semantic-subject-outcomes.js")>();
  return { ...original, computeSubjectOutcomes: ((...args: Parameters<typeof original.computeSubjectOutcomes>) => {
    const result = original.computeSubjectOutcomes(...args);
    if (args[0] !== faults.family || faults.kind === "none" || result.kind !== "available") return result;
    faults.calls++;
    const payloads = structuredClone(result.payloads) as Mutable<SubjectOutcomePayload<KingOutcomeFamily>>[];
    if (faults.kind === "missing-total") return { ...result, population: { ...result.population, subjects: result.population.subjects.slice(0, -1) } };
    if (faults.kind === "invent-quiet") {
      if (payloads.length !== 0) throw Error("Invented-event control must start from an actual quiet population");
      // The checked original family is one of these two boolean king domains.
      const first = (result.population as SubjectOutcomePopulation<KingOutcomeFamily>).subjects[0]!;
      if (first.root.kind !== "present" || first.played.kind !== "present" || first.alternatives.length === 0) throw Error("Nonforced complete quiet source required");
      payloads.push({ family: faults.family, actor: result.population.actor, beforeFen: result.population.beforeFen,
        moveUci: result.population.moveUci, afterFen: result.population.afterFen,
        subject: structuredClone(first.subject) as Mutable<SubjectOutcomePayload<KingOutcomeFamily>>["subject"], parameters: structuredClone(first.parameters),
        root: structuredClone(first.root), played: structuredClone(first.played), alternativeRelation: "false_to_true",
        alternatives: structuredClone(first.alternatives) as Mutable<typeof first.alternatives>, supportingMoves: [first.alternatives[0]!.moveUci],
        legalAlternatives: first.alternatives.length, alternativesWithOutcome: 1 });
    }
    for (const payload of payloads) {
      if (faults.kind === "subject") {
        if (payload.subject.kind === "king_zone") payload.subject.rootSquare = payload.moveUci.slice(2, 4) as typeof payload.subject.rootSquare;
        else payload.subject.whiteRootSquare = payload.subject.blackRootSquare;
      }
      if (faults.kind === "color") {
        if (payload.subject.kind === "king_zone") payload.subject.color = payload.subject.color === "white" ? "black" : "white";
        else if ("holder" in payload.parameters) payload.parameters.holder = payload.parameters.holder === "white" ? "black" : "white";
      }
      if (faults.kind === "parameter") {
        if ("zone" in payload.parameters) payload.parameters.zone = payload.parameters.zone === "edge" ? "corner" : "edge";
        else payload.parameters.form = payload.parameters.form === "direct" ? "distant_three" : "direct";
      }
      if (faults.kind === "root") payload.root.value = !payload.root.value;
      if (faults.kind === "played") payload.played.value = !payload.played.value;
      if (faults.kind === "state") payload.alternatives[0]!.state.value = !payload.alternatives[0]!.state.value;
      if (faults.kind === "crossed") {
        const first = payload.alternatives[0]!, other = payload.alternatives.find(row => row.state.value !== first.state.value);
        if (other === undefined) throw Error("Crossed-state control requires genuinely different alternative outcomes");
        [first.state, other.state] = [other.state, first.state]; [first.relation, other.relation] = [other.relation, first.relation];
      }
      if (faults.kind === "support") {
        const other = payload.alternatives.find(row => !payload.supportingMoves.includes(row.moveUci));
        if (other === undefined) throw Error("Wrong-support control requires a genuine nonsupporting move");
        payload.supportingMoves[0] = other.moveUci;
      }
      if (faults.kind === "denominator") payload.legalAlternatives++;
      if (faults.kind === "numerator") payload.alternativesWithOutcome++;
      if (faults.kind === "symmetric") {
        const inverted = { false_to_true: "true_to_false", true_to_false: "false_to_true", false_to_false: "true_to_true", true_to_true: "false_to_false" } as const;
        payload.root.value = !payload.root.value; payload.played.value = !payload.played.value;
        payload.alternativeRelation = inverted[payload.alternativeRelation];
        for (const edge of payload.alternatives) { edge.state.value = !edge.state.value; edge.relation = inverted[edge.relation as keyof typeof inverted]; }
      }
    }
    if (faults.kind === "duplicate") payloads.push(structuredClone(payloads[0]!));
    if (faults.kind === "omit") payloads.pop();
    if (faults.kind === "reverse") payloads.reverse();
    if (faults.kind === "symmetric") {
      const population = structuredClone(result.population) as Mutable<SubjectOutcomePopulation<KingOutcomeFamily>>;
      const inverted = { false_to_true: "true_to_false", true_to_false: "false_to_true", false_to_false: "true_to_true", true_to_true: "false_to_false" } as const;
      for (const subject of population.subjects) {
        subject.root.value = !subject.root.value; subject.played.value = !subject.played.value;
        subject.playedRelation = inverted[subject.playedRelation as keyof typeof inverted];
        for (const edge of subject.alternatives) { edge.state.value = !edge.state.value; edge.relation = inverted[edge.relation as keyof typeof inverted]; }
      }
      return { ...result, payloads, population } as typeof result;
    }
    return { ...result, payloads } as typeof result;
  }) as typeof original.computeSubjectOutcomes };
});
afterEach(() => { faults.kind = "none"; faults.calls = 0; });

const cases = KING_OUTCOME_LITERAL_SOURCES.flatMap(source => source.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm, operation: source.operation,
  input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: source.sourceId, sourceRevision: source.sourceRevision, licence: source.licence,
    span: { start: 0, end: source.text.length, textSha256: sha256Text(source.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
}))) as readonly SemanticValidationCaseFor<"runtime.semantic.subject_outcomes">[];
const registry = new Map(cases.map(value => [value.id, value]));
const multiple = (family: KingOutcomeFamily) => family === "king_zone" ? "split-zones" : "split-forms";
const absolute = (family: KingOutcomeFamily, side = "white") => cases.find(value => value.input.family === family
  && value.arm === "positive" && value.id.includes(`.${multiple(family)}.${side}.`))!;

function actual(family: KingOutcomeFamily, row: LiteralPopulation, move: string) {
  const compiled = compileCandidatePopulation({ beforeFen: row.root, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (compiled.kind !== "ready") throw new Error(`Population unavailable: ${row.id}`);
  const input = kingOutcomeInput(family, row, move);
  // Assert complete legal alternatives and original successor states, not a selected subset.
  expect(input.population.alternatives.map(edge => edge.moveUci)).toEqual(compiled.receipt.packet.candidates.map(edge => edge.moveUci));
  for (const edge of input.population.alternatives) expect(canonicalSemanticEdge(edge)).toEqual(edge);
  const result = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: compiled.receipt, moveUci: move });
  const invocation = readSubjectOutcomeInvocation(result);
  if (result.kind !== "available" || invocation.population.kind !== "available") throw new Error(`Outcomes unavailable: ${row.id}`);
  const events = result.values.map(value => ({ sign: "avoided" as const, operands: value.payload }));
  const observations: readonly SemanticMirrorObservation[] = events.map(event => ({
    ...event, projection: { id: `derived.semantic_avoidance.${family}`, version: 2 },
  }));
  return { population: invocation.population.population, events, observations };
}

describe("prepared independent original-king references", () => {
  it("exercises true and false values for every opposition form and holder", () => {
    const subjects = KING_OUTCOME_POPULATIONS.flatMap(row => row.plays.flatMap(move => literalKingOutcomePopulation("king_opposition", row, move).subjects));
    for (const holder of ["white", "black"]) for (const form of ["direct", "distant_three", "distant_five"]) {
      const values = subjects.filter(row => row.parameters.holder === holder && row.parameters.form === form)
        .flatMap(row => [row.root.value, row.played.value, ...row.alternatives.map(edge => edge.state.value)]);
      expect(values, `${holder}/${form}`).toContain(true);
      expect(values, `${holder}/${form}`).toContain(false);
    }
    for (const family of KING_OUTCOME_FAMILIES) expect(KING_OUTCOME_POPULATIONS.some(row =>
      literalKingOutcomeEvents(family, row, row.plays[0]!).length > 1), `${family} needs a nonvacuous output-order fault witness`).toBe(true);
  });
  for (const family of KING_OUTCOME_FAMILIES) for (const row of KING_OUTCOME_POPULATIONS) for (const move of row.plays) {
    it(`${family} ${row.id} ${move} retains every original subject and alternative`, () => {
      const result = actual(family, row, move);
      expect(result.population).toEqual(literalKingOutcomePopulation(family, row, move));
      expect(result.events).toEqual(literalKingOutcomeEvents(family, row, move));
    });
  }

  for (const source of KING_OUTCOME_LITERAL_SOURCES) for (const value of source.cases) {
    const expected = value.proposition.expectation;
    if (expected.kind !== "mirrors") continue;
    it(`${value.proposition.case.id} preserves exact mirrored king identities`, () => {
      const partner = source.cases.find(candidate => candidate.proposition.case.id === expected.partnerCase.id);
      if (partner === undefined) throw new Error("Missing literal mirror partner");
      const row = KING_OUTCOME_POPULATIONS.find(candidate => candidate.root === value.input.population.rootFen);
      const other = KING_OUTCOME_POPULATIONS.find(candidate => candidate.root === partner.input.population.rootFen);
      if (row === undefined || other === undefined) throw new Error("Missing literal board");
      const sourceEvents = actual(value.input.family as KingOutcomeFamily, row, value.input.population.played.moveUci).observations;
      const partnerEvents = actual(partner.input.family as KingOutcomeFamily, other, partner.input.population.played.moveUci).observations;
      compareSemanticMirror(sourceEvents, partnerEvents, expected.geometry, expected.operandRules, {
        source: value.input.population.played, partner: partner.input.population.played,
      });
    });
  }
});

describe("fixed-authority original-king source proofs before canonical admission", () => {
  it.each(cases)("$id executes its real source with the fixed cited authority", async value => {
    const receipt = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(receipt.status, receipt.failure?.message).toBe("passed");
    expect(receipt.invocations).toBe(value.arm === "orientation" ? 2 : 1);
    const row = KING_OUTCOME_POPULATIONS.find(row => row.root === value.input.population.rootFen)!;
    // Some distinct literal roots share the same placement/turn only if their full FEN
    // really agrees. The chosen move is always the exact input's original legal member.
    expect(receipt.targetCount).toBe(literalKingOutcomeEvents(value.input.family as KingOutcomeFamily, row, value.input.population.played.moveUci).length);
  });

  for (const family of KING_OUTCOME_FAMILIES) {
    it(`${family} refuses cited propositions bound to another input, arm or retained span`, () => {
      const value = absolute(family);
      if (value.authority.kind !== "cited_proposition") throw Error("Fixed source required");
      for (const corrupted of [
        { ...value, input: absolute(family, "black").input },
        { ...value, arm: "counterfactual" as const },
        { ...value, authority: { ...value.authority, span: { ...value.authority.span, end: value.authority.span.end - 1 } } },
      ]) expect(() => SEMANTIC_VALIDATION_RESOLVERS.resolveProposition(corrupted)).toThrow();
    });
    it(`${family} uses more than one exact expected output for its mutation controls`, () => {
      const value = absolute(family);
      if (value.expectation.kind !== "emits_exact") throw Error("Exact source fixture required");
      expect(value.expectation.events.length).toBeGreaterThan(1);
    });

    it.each(["subject", "color", "parameter", "root", "played", "state", "crossed", "support", "denominator", "numerator", "duplicate", "omit", "reverse"])(`${family} rejects actual pre-mint %s errors`, async kind => {
      faults.family = family; faults.kind = kind;
      const receipt = await executeSemanticValidationCase(absolute(family), SEMANTIC_VALIDATION_RESOLVERS, registry);
      expect(faults.calls).toBe(1);
      expect(receipt).toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
    });

    it(`${family} rejects mirror-safe symmetric errors with BOTH independent absolute partners`, async () => {
      faults.family = family; faults.kind = "symmetric";
      const mirror = cases.find(value => value.input.family === family && value.arm === "orientation" && value.id.includes(`.${multiple(family)}.white.`))!;
      expect(await executeSemanticValidationCase(mirror, SEMANTIC_VALIDATION_RESOLVERS, registry)).toMatchObject({ status: "passed", invocations: 2 });
      for (const side of ["white", "black"]) {
        const receipt = await executeSemanticValidationCase(absolute(family, side), SEMANTIC_VALIDATION_RESOLVERS, registry);
        expect(receipt).toMatchObject({ status: "failed", invocations: 1, failure: { code: "SEMANTIC_VALIDATION_EXPECTATION_UNMET" } });
      }
      expect(faults.calls).toBe(4);
    });

    const quietId = family === "king_zone" ? "blocked.white" : "uniform-loss.white";
    it(`${family} rejects a genuinely minted invented event on an available quiet input`, async () => {
      faults.family = family; faults.kind = "invent-quiet";
      const quiet = cases.find(value => value.input.family === family && value.arm === "semantic_negative" && value.id.includes(`.${quietId}.`))!;
      const receipt = await executeSemanticValidationCase(quiet, SEMANTIC_VALIDATION_RESOLVERS, registry);
      expect(faults.calls).toBe(1);
      expect(receipt).toMatchObject({ status: "failed", invocations: 1, targetCount: 1, failure: { code: "SEMANTIC_VALIDATION_NEGATIVE_EMITTED" } });
    });

    it(`${family} detects a lost total cell even when the public result correctly stays empty`, () => {
      faults.family = family; faults.kind = "missing-total";
      const row = KING_OUTCOME_POPULATIONS.find(value => value.id === quietId)!, move = row.plays[0]!;
      const original = actual(family, row, move), expected = literalKingOutcomePopulation(family, row, move);
      expect(original.events).toEqual([]); expect(faults.calls).toBe(1);
      expect(original.population.subjects).toHaveLength(expected.subjects.length - 1);
      expect(original.population).not.toEqual(expected);
    });

    it(`${family} keeps the genuine invocation and refuses copied results and values`, () => {
      const row = KING_OUTCOME_POPULATIONS.find(value => value.id === `${multiple(family)}.white`)!;
      const compiled = compileCandidatePopulation({ beforeFen: row.root, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
      if (compiled.kind !== "ready") throw Error("Complete original root required");
      const result = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: compiled.receipt, moveUci: row.plays[0]! });
      if (result.kind !== "available") throw Error("Actual available source required");
      const original = readSubjectOutcomeInvocation(result);
      expect(original.receipt).toBe(compiled.receipt); expect(original.inputs[0]).toBe(compiled.receipt.legalMovesInput);
      expect(result.values.length).toBeGreaterThan(1);
      for (const value of result.values) {
        expect(readSubjectOutcomeInvocation(value)).toBe(original);
        expect(() => readSubjectOutcomeInvocation(structuredClone(value))).toThrow();
        for (const consumer of ["module.postcommit_nudge", "module.review_map"]) {
          expect(evidenceForConsumer<unknown>(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version: 2 }, [value]).items).toEqual([]);
        }
      }
      expect(() => readSubjectOutcomeInvocation(structuredClone(result))).toThrow();
    });
  }
});
