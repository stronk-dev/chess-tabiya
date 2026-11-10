import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import { evidenceDigest, evidenceForConsumer } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "./internal/evidence-value-routes.js";
import { PAWN_OUTCOME_FAMILIES, PAWN_OUTCOME_LITERAL_SOURCES, PAWN_OUTCOME_POPULATIONS, pawnOutcomeInput,
  literalPawnOutcomeEvents, literalPawnOutcomePopulation, type PawnOutcomeFamily } from "./semantic-validation-pawn-outcome-sources.js";
import { canonicalSemanticEdge, SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import { admitValidatedSemanticInstance, SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase, semanticFactConstraintSha256, type SemanticValidationCaseFor } from "./semantic-validation.js";
import type { SubjectOutcomePayload } from "./semantic-subject-types.js";

type Mutable<T> = T extends readonly (infer U)[] ? Mutable<U>[] : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const faults = vi.hoisted(() => ({ family: "isolated_pawn" as PawnOutcomeFamily, kind: "none", calls: 0 }));
vi.mock("./semantic-subject-outcomes.js", async importOriginal => {
  const original = await importOriginal<typeof import("./semantic-subject-outcomes.js")>();
  return { ...original, computeSubjectOutcomes: ((...args: Parameters<typeof original.computeSubjectOutcomes>) => {
    const result = original.computeSubjectOutcomes(...args);
    if (args[0] !== faults.family || faults.kind === "none" || result.kind !== "available") return result;
    faults.calls++;
    const payloads = structuredClone(result.payloads) as Mutable<SubjectOutcomePayload<PawnOutcomeFamily>>[];
    if (faults.kind === "invent-quiet" && payloads.length === 0) {
      const first = result.population.subjects[0]!;
      if (first.root.kind !== "present") throw Error("Quiet pawn/file fixture requires a present root state");
      const alternatives = structuredClone(first.alternatives) as Mutable<SubjectOutcomePayload<PawnOutcomeFamily>>["alternatives"];
      const numeric = faults.family === "pawn_islands";
      const value = first.root.value;
      payloads.push({ family: faults.family, actor: result.population.actor, beforeFen: result.population.beforeFen,
        moveUci: result.population.moveUci, afterFen: result.population.afterFen,
        subject: structuredClone(first.subject) as Mutable<SubjectOutcomePayload<PawnOutcomeFamily>>["subject"], parameters: {},
        root: { kind: "present", value }, played: { kind: "present", value },
        alternativeRelation: numeric ? "increase" : value ? "true_to_false" : "false_to_true",
        alternatives, supportingMoves: [alternatives[0]!.moveUci], legalAlternatives: alternatives.length, alternativesWithOutcome: 1 });
    }
    for (const payload of payloads) {
      if (faults.kind === "subject") {
        if ("file" in payload.subject) payload.subject.file = payload.subject.file === "a" ? "b" : "a";
        else payload.subject.color = payload.subject.color === "white" ? "black" : "white";
      }
      if (faults.kind === "symmetric") {
        const wrong = (value: boolean | number) => typeof value === "boolean" ? !value : value + 1;
        const inverted = { false_to_true: "true_to_false", true_to_false: "false_to_true", false_to_false: "true_to_true", true_to_true: "false_to_false" } as const;
        if (typeof payload.root.value === "boolean") {
          payload.alternativeRelation = inverted[payload.alternativeRelation as keyof typeof inverted];
          for (const alternative of payload.alternatives) alternative.relation = inverted[alternative.relation as keyof typeof inverted];
        }
        payload.root.value = wrong(payload.root.value); payload.played.value = wrong(payload.played.value);
        for (const alternative of payload.alternatives) alternative.state.value = wrong(alternative.state.value);
      }
      if (faults.kind === "root") payload.root.value = typeof payload.root.value === "boolean" ? !payload.root.value : payload.root.value + 1;
      if (faults.kind === "played") payload.played.value = typeof payload.played.value === "boolean" ? !payload.played.value : payload.played.value + 1;
      if (faults.kind === "state") {
        const state = payload.alternatives[0]!.state;
        state.value = typeof state.value === "boolean" ? !state.value : state.value + 1;
      }
      if (faults.kind === "crossed") [payload.alternatives[0]!.moveUci, payload.alternatives[1]!.moveUci] = [payload.alternatives[1]!.moveUci, payload.alternatives[0]!.moveUci];
      if (faults.kind === "support") payload.supportingMoves[0] = payload.alternatives.find(row => !payload.supportingMoves.includes(row.moveUci))!.moveUci;
      if (faults.kind === "denominator") payload.legalAlternatives++;
      if (faults.kind === "numerator") payload.alternativesWithOutcome++;
    }
    if (faults.kind === "duplicate") payloads.push(structuredClone(payloads[0]!));
    if (faults.kind === "omit") payloads.pop();
    if (faults.kind === "reverse") payloads.reverse();
    if (faults.kind === "missing-total") {
      const population = structuredClone(result.population);
      return { ...result, population: { ...population, subjects: population.subjects.slice(0, -1) } };
    }
    return { ...result, payloads } as typeof result;
  }) as typeof original.computeSubjectOutcomes };
});
afterEach(() => { faults.kind = "none"; faults.calls = 0; vi.restoreAllMocks(); });
const sources = PAWN_OUTCOME_LITERAL_SOURCES;
const cases = sources.flatMap(source => source.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm, operation: source.operation,
  input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: source.sourceId, sourceRevision: source.sourceRevision, licence: source.licence,
    span: { start: 0, end: source.text.length, textSha256: sha256Text(source.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
}))) as readonly SemanticValidationCaseFor<"runtime.semantic.subject_outcomes">[];
const registry = new Map(cases.map(value => [value.id, value]));
const owners = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();
function owner(fen: string, fresh = false): CandidatePopulationReceipt<CandidateWideScope> {
  const saved = owners.get(fen); if (saved !== undefined && !fresh) return saved;
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error));
  if (!fresh) owners.set(fen, result.receipt); return result.receipt;
}
const matrix = PAWN_OUTCOME_FAMILIES.flatMap(family => PAWN_OUTCOME_POPULATIONS.flatMap(row => row.plays.map(move => ({ family, row, move }))));

describe("independent complete pawn/file outcome sources", () => {
  it.each(PAWN_OUTCOME_FAMILIES)("%s joins every reviewed proposition to the exact four canonical profile arms", family => {
    const canonical = (JSON.parse(readFileSync(new URL("./semantic-validation-cases.json", import.meta.url), "utf8")) as { cases: unknown[] }).cases.map(parseSemanticValidationCase);
    const expected = cases.filter(value => value.input.family === family);
    const ids = new Set(expected.map(value => value.id));
    expect(canonical.filter(value => ids.has(value.id))).toEqual(expected);
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => value.subject.projection.id === `derived.semantic_avoidance.${family}` && value.subject.projection.version === 2)!;
    for (const [key, arm] of [["positive", "positive"], ["semanticNegative", "semantic_negative"],
      ["orientation", "orientation"], ["counterfactual", "counterfactual"]] as const) {
      const cell = profile[key];
      expect(cell.disposition).toBe("present");
      if (cell.disposition !== "present") throw Error("Actual executed canonical arm required");
      expect(cell.refs.map(ref => ref.id)).toEqual(expected.filter(value => value.arm === arm).map(value => value.id));
    }
    expect(semanticValidationVerdict(profile.subject)?.verdict).toBe("passed");
  });

  it.each(PAWN_OUTCOME_FAMILIES)("%s admits only genuine qualified source instances without enabling held support bindings", async family => {
    const value = cases.find(value => value.input.family === family && value.arm === "positive")!;
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.subject_outcomes"].invoke(value.input);
    if (result.kind !== "completed") throw Error("Actual complete source required");
    expect(result.observations.length).toBeGreaterThan(0);
    for (const observation of result.observations) {
      if (observation.kind !== "event") throw Error("Actual source event required");
      expect(admitValidatedSemanticInstance("event", observation.item.evidence).kind).toBe("admitted");
      const copied = structuredClone(observation.item.evidence);
      expect(admitValidatedSemanticInstance("event", copied)).toMatchObject({ kind: "refused", reason: "event_value_unverified" });
      for (const consumer of ["module.postcommit_nudge", "module.review_map"]) {
        expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version: 2 }, [observation.item.evidence]).items).toEqual([]);
      }
    }
  });

  it.each(PAWN_OUTCOME_POPULATIONS)("$id keeps every independently literal legal child", row => {
    for (const edge of pawnOutcomeInput("isolated_pawn", row, row.plays[0]!).population.alternatives) expect(canonicalSemanticEdge(edge)).toEqual(edge);
  });

  it.each(matrix)("$family $row.id $move preserves every subject, including constant/false/zero states", ({ family, row, move }) => {
    const receipt = owner(row.root);
    const result = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt, moveUci: move });
    const original = readSubjectOutcomeInvocation(result);
    expect(original.receipt).toBe(receipt); expect(original.family).toBe(family);
    expect(original.population.kind).toBe("available");
    if (original.population.kind !== "available") throw Error("Complete literal family input must be available");
    const expected = literalPawnOutcomePopulation(family, row, move);
    expect(original.population.population).toEqual(expected);
    expect(expected.subjects).toHaveLength(family === "pawn_islands" ? 2 : family === "open_file" ? 8 : 16);
    if (family === "open_file") expect(expected.subjects.every(member => !Object.hasOwn(member.subject, "color"))).toBe(true);
    expect(original.inputs[0]).toBe(receipt.legalMovesInput);
  });

  it.each(cases)("$id executes the actual uncapped source under its fixed independent authority", async value => {
    const receipt = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(receipt.status, receipt.failure?.message).toBe("passed");
    expect(receipt.invocations).toBe(value.arm === "orientation" ? 2 : 1);
    const row = PAWN_OUTCOME_POPULATIONS.find(row => row.root === value.input.population.rootFen)!;
    expect(receipt.targetCount).toBe(literalPawnOutcomeEvents(value.input.family as PawnOutcomeFamily, row, value.input.population.played.moveUci).length);
  });

  it.each(PAWN_OUTCOME_FAMILIES)("%s keeps complete empty/uniform pawn inputs despite unrelated risk unavailability", family => {
    const quiet = PAWN_OUTCOME_POPULATIONS.find(row => row.id === "quiet.white")!;
    const result = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: owner(quiet.root), moveUci: quiet.plays[0]! });
    expect(result).toEqual({ kind: "available", values: [] });
    expect(readSubjectOutcomeInvocation(result).population.kind).toBe("available");
    const checked = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: owner("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1"), moveUci: "e1e2" });
    expect(checked).toEqual({ kind: "available", values: [] });
    expect(readSubjectOutcomeInvocation(checked).population.kind).toBe("available");
  });

  it.each(PAWN_OUTCOME_FAMILIES)("%s has nonvacuous positive/negative/mirror/counterfactual coverage", family => {
    const selected = cases.filter(row => row.input.family === family);
    for (const arm of ["positive", "semantic_negative", "orientation", "counterfactual"] as const) expect(selected.some(row => row.arm === arm)).toBe(true);
    const population = selected.filter(row => row.arm === "positive").flatMap(row => row.expectation.kind === "emits_exact" ? row.expectation.events : []);
    const relations = population.map(event => event.operands.alternativeRelation);
    if (family === "pawn_islands") for (const relation of ["increase", "decrease", "equal"]) expect(relations).toContain(relation);
    else for (const relation of ["false_to_true", "true_to_false", "true_to_true", "false_to_false"]) expect(relations).toContain(relation);
  });

  const multiple = (family: PawnOutcomeFamily) => family === "doubled_pawn" ? "transfer" : family === "pawn_islands" ? "two-colors" : "split";
  const absolute = (family: PawnOutcomeFamily, row = multiple(family), side = "white") => cases.find(value => value.input.family === family && value.arm === "positive" && value.id.includes(`.${row}.${side}.0.`))!;
  for (const family of PAWN_OUTCOME_FAMILIES) {
    it(`${family} retains several complete subjects from the same alternative move`, async () => {
      const value = absolute(family);
      if (value.expectation.kind !== "emits_exact") throw Error("Whole literal population required");
      expect(value.expectation.events.length).toBeGreaterThan(1);
      const support = value.expectation.events.map(event => event.operands.supportingMoves);
      expect(support.every(moves => JSON.stringify(moves) === JSON.stringify(support[0]))).toBe(true);
      const result = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
      expect(result).toMatchObject({ status: "passed", targetCount: value.expectation.events.length });
    });

    it.each(["subject", "root", "played", "state", "crossed", "support", "denominator", "numerator", "duplicate", "omit", "reverse"])(`${family} rejects genuine pre-mint %s mistakes`, async kind => {
      faults.family = family; faults.kind = kind;
      const result = await executeSemanticValidationCase(absolute(family), SEMANTIC_VALIDATION_RESOLVERS, registry);
      expect(faults.calls).toBe(1); expect(result).toMatchObject({ status: "failed", invocations: 1 });
      expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    });

    it(`${family} rejects internally consistent symmetric errors by both literal absolute partners`, async () => {
      faults.family = family; faults.kind = "symmetric";
      const name = multiple(family);
      const mirror = cases.find(value => value.input.family === family && value.arm === "orientation"
        && value.id.includes(`.${name}.white.0.color_and_vertical`))!;
      expect(await executeSemanticValidationCase(mirror, SEMANTIC_VALIDATION_RESOLVERS, registry)).toMatchObject({ status: "passed", invocations: 2 });
      for (const side of ["white", "black"]) {
        const result = await executeSemanticValidationCase(absolute(family, name, side), SEMANTIC_VALIDATION_RESOLVERS, registry);
        expect(result.status).toBe("failed"); expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
      }
      expect(faults.calls).toBe(4);
    });

    it(`${family} does not infer a false event from a nonforced available quiet source`, async () => {
      faults.family = family; faults.kind = "invent-quiet";
      const value = cases.find(value => value.input.family === family && value.arm === "semantic_negative" && value.id.includes(".quiet.white."))!;
      const result = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
      expect(faults.calls).toBe(1); expect(result).toMatchObject({ status: "failed", invocations: 1, targetCount: 1 });
      expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_NEGATIVE_EMITTED");
    });

    it(`${family} checks the complete uniform domain even when no event is emitted`, () => {
      faults.family = family; faults.kind = "missing-total";
      const row = PAWN_OUTCOME_POPULATIONS.find(row => row.id === "quiet.white")!;
      const source = invokeEvidenceValueRoute(`derived.semantic_avoidance.${family}@2`, { receipt: owner(row.root, true), moveUci: row.plays[0]! });
      expect(source).toEqual({ kind: "available", values: [] });
      const population = readSubjectOutcomeInvocation(source).population;
      if (population.kind !== "available") throw Error("Original available population required");
      const expected = literalPawnOutcomePopulation(family, row, row.plays[0]!);
      expect(() => expect(population.population).toEqual(expected)).toThrow();
      expect(population.population.subjects).toHaveLength(expected.subjects.length - 1);
      expect(faults.calls).toBe(1);
    });
  }
});
