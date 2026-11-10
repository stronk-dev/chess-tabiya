import { describe, expect, it } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import { PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_SELECTION_PROJECTION_REFS } from "./evidence-catalog.js";
import { evidenceForConsumer } from "./evidence-contract.js";
import { SUBJECT_OUTCOME_FAMILIES, type SubjectOutcomeFamily } from "./semantic-subject-types.js";
import { subjectOutcomeSemanticEvents, selectSemanticEvidence, assertSemanticEvidenceEvent } from "./semantic-evidence.js";
import { SEMANTIC_VALIDATION_OPERATIONS, subjectOutcomesFromReceipt } from "./semantic-validation-operations.js";
import { assertSemanticMirrorPartnerInput, assertSemanticTargetValueAuthority, executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { semanticLegalSetDigest, parseSemanticValidationCase, parseSemanticValidationOperationInput, mirrorSemanticFen, mirrorSemanticUci,
  semanticFactConstraintSha256, type SemanticCompleteAlternativesInput, type SemanticSubjectOutcomesInput, type SemanticValidationCaseFor, type SemanticValidationCase } from "./semantic-validation.js";
import cases from "./semantic-validation-cases.json" with { type: "json" };
import { recordedSemanticWindowSource } from "./recorded-semantic-window.js";
import { RECORDED_SEQUENCE_POSITIVES } from "./testing/recorded-sequence-fixtures.js";
import { recordedSequenceWindowFixture } from "./testing/recorded-sequence-window-fixture.js";

const capture = "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1";
const fixtures: { readonly [F in SubjectOutcomeFamily]: readonly [string, string] } = {
  backward_pawn: ["7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
  doubled_pawn: [capture, "h1g1"], half_open_file: [capture, "h1g1"], isolated_pawn: [capture, "h1g1"],
  king_opposition: ["4k3/8/4K3/8/8/8/P7/8 w - - 0 1", "a2a3"],
  king_zone: [capture, "h1g1"], line_blockers: ["7k/8/8/8/8/8/B7/R3K3 w - - 0 1", "e1d1"],
  open_file: [capture, "h1g1"], passed_pawn: [capture, "h1g1"], piece_count: [capture, "h1g1"],
  direct_attack_count: [capture, "h1g1"], loose_piece: [capture, "c4d5"], pawn_islands: [capture, "h1g1"],
};
const cache = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();
function owner(fen: string) {
  let receipt = cache.get(fen); if (receipt !== undefined) return receipt;
  const result = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (result.kind !== "ready") throw Error(JSON.stringify(result.error)); receipt = result.receipt; cache.set(fen, receipt); return receipt;
}
function input(family: SubjectOutcomeFamily, fen: string, move: string): SemanticSubjectOutcomesInput {
  const receipt = owner(fen), alternatives = receipt.packet.candidates.map(row => ({ kind: "edge" as const, beforeFen: receipt.packet.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen }));
  const played = alternatives.find(edge => edge.moveUci === move); if (played === undefined) throw Error("Fixture played move not legal");
  return { kind: "subject_outcomes", family, population: { kind: "complete_alternatives", rootFen: receipt.packet.beforeFen, played, alternatives,
    legalSetDigest: semanticLegalSetDigest(receipt.packet.beforeFen, alternatives.map(edge => edge.moveUci)) } };
}
const operation = SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.subject_outcomes"];

describe("actual complete family source operation", () => {
  it("retains the complete selector's exact condition event identities through the actual adapter", async () => {
    const fen = "4k3/8/4K3/8/8/8/PPP5/8 w - - 0 1", moveUci = "a2a3";
    const direct = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, { id: "research.r2_candidate", version: 3 }, { receipt: owner(fen), moveUci });
    expect(direct.coverage.unavailable).toEqual([]);
    const expected = direct.selected.filter(fact => fact.kind === "counterfactual_absence").map(fact => fact.event);
    expect(expected.length).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.complete_alternatives"].invoke(input("piece_count", fen, moveUci).population);
    expect(result.kind).toBe("completed");
    if (result.kind !== "completed") throw Error(result.reason);
    expect(result.abstentions).toEqual([]);
    const events = result.observations.map(value => {
      if (value.kind !== "event") throw Error("Complete condition adapter must retain events");
      return value.item;
    });
    expect(events.map(value => value.id)).toEqual(expected.map(value => value.id));
    for (const observation of result.observations) {
      expect(observation.kind).toBe("event");
      assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, observation.item);
    }
  });

  it("keeps a partial selector result but makes the actual validation adapter abstain instead of claiming omission", async () => {
    const fen = "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1", moveUci = "a2b3";
    const population = input("piece_count", fen, moveUci).population;
    const direct = selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, { id: "research.r2_candidate", version: 3 }, { receipt: owner(fen), moveUci });
    expect(direct.selected.length).toBeGreaterThan(0);
    expect(direct.coverage.unavailable).toHaveLength(1);
    const adapter = SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.complete_alternatives"];
    expect(await adapter.invoke(population)).toEqual({ kind: "unavailable", reason: "complete_alternative_population_unavailable" });
    const base = cases.cases.find(row => row.authority.kind === "cited_proposition")!;
    const omitted = parseSemanticValidationCase({ ...base, id: "availability.partial.omits", arm: "semantic_negative", operation: adapter.ref,
      subject: { kind: "event", projection: { id: "derived.semantic_avoidance.piece_count", version: 2 } }, input: population, expectation: { kind: "omits" } });
    const abstained = parseSemanticValidationCase({ ...omitted, id: "availability.partial.abstains",
      expectation: { kind: "abstains", reason: "complete_alternative_population_unavailable" } });
    // This runner-boundary control supplies an exact test proposition, not a qualification source.
    const resolvers = { ...SEMANTIC_VALIDATION_RESOLVERS, resolveProposition: (value: SemanticValidationCase) => ({
      subject: value.subject, case: { id: value.id, version: 1 as const }, factConstraint: [],
      factConstraintSha256: semanticFactConstraintSha256([]), expectation: value.expectation,
    }) };
    const registry = new Map([omitted, abstained].map(value => [value.id, value]));
    const negative = await executeSemanticValidationCase(omitted, resolvers, registry);
    expect(negative.invocations).toBe(1);
    expect(negative.status).toBe("failed");
    expect(negative.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    const positive = await executeSemanticValidationCase(abstained, resolvers, registry);
    expect(positive.invocations).toBe(1);
    expect(positive.status, positive.failure?.message).toBe("passed");
    expect((await operation.invoke({ kind: "subject_outcomes", family: "piece_count", population })).kind).toBe("completed");
  });

  it.each(SUBJECT_OUTCOME_FAMILIES)("%s executes the full original population, not selected top-two hints", async family => {
    const [fen, move] = fixtures[family], value = input(family, fen, move), result = await operation.invoke(value);
    expect(result.kind).toBe("completed"); if (result.kind !== "completed") throw Error(result.reason);
    const source = subjectOutcomeSemanticEvents(PRIMARY_EVIDENCE_MANIFEST, family, owner(fen), move);
    if (source.kind !== "available") throw Error(source.reason);
    expect(result.observations.length).toBeGreaterThan(0);
    expect(result.observations.map(row => row.kind === "event" ? row.item.id : "wrong grain")).toEqual(source.events.map(event => event.id));
    for (const observation of result.observations) {
      expect(observation.kind).toBe("event"); if (observation.kind !== "event") throw Error("Wrong grain");
      expect(observation.item.projection).toEqual({ id: `derived.semantic_avoidance.${family}`, version: 2 });
      expect(() => assertSemanticTargetValueAuthority(observation)).not.toThrow();
    }
    if (family === "direct_attack_count") expect(result.observations.length).toBeGreaterThan(2);
    expect(subjectOutcomesFromReceipt(value, owner(fen))).toEqual(result);
  });

  it.each(SUBJECT_OUTCOME_FAMILIES)("%s retains evaluated-zero and source-local availability without shrinking legal inputs", async family => {
    expect(await operation.invoke(input(family, "8/8/8/8/8/1r6/2k5/K7 w - - 0 1", "a1a2"))).toEqual({ kind: "completed", observations: [], abstentions: [] });
    const result = await operation.invoke(input(family, "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", "e1e2"));
    if (family === "loose_piece") expect(result).toEqual({ kind: "unavailable", reason: "complete_alternative_population_unavailable" });
    else {
      expect(result.kind).toBe("completed");
      if (result.kind !== "completed") throw Error(family);
      expect(result.abstentions).toEqual([]);
      for (const observation of result.observations) {
        expect(observation.item.projection).toEqual({ id: `derived.semantic_avoidance.${family}`, version: 2 });
      }
    }
  });

  it("refuses unknown/extra grammar, missing/duplicate alternatives, roots, counters, children and digest changes", async () => {
    const value = input("piece_count", capture, "h1g1"), pop = value.population;
    for (const broken of [{ ...value, family: "pawn" }, { ...value, output: [] }, { ...value, population: { ...pop, family: "piece_count" } }]) expect(() => parseSemanticValidationOperationInput("runtime.semantic.subject_outcomes", broken)).toThrow();
    const mutations: readonly SemanticCompleteAlternativesInput[] = [
      { ...pop, alternatives: pop.alternatives.slice(1) },
      { ...pop, alternatives: [...pop.alternatives, pop.alternatives[0]!] },
      { ...pop, rootFen: pop.rootFen.replace("0 1", "0 2") },
      { ...pop, played: { ...pop.played, afterFen: pop.played.afterFen.replace("1 1", "1 2") } },
      { ...pop, alternatives: pop.alternatives.map((edge, i) => i === 0 ? { ...edge, afterFen: pop.played.afterFen } : edge) },
      { ...pop, legalSetDigest: "0".repeat(64) },
    ];
    for (const population of mutations) {
      expect(() => operation.invoke({ ...value, population })).toThrow();
      expect(() => subjectOutcomesFromReceipt({ ...value, population }, owner(capture))).toThrow();
    }
    expect(() => subjectOutcomesFromReceipt(value, { ...owner(capture) })).toThrow();
    expect(() => subjectOutcomesFromReceipt(value, owner("7k/8/8/3p4/2P5/8/3P4/7K w - - 0 2"))).toThrow();
  });

  it("uses one detached parsed snapshot, including changing population/family getters", () => {
    const value = input("piece_count", capture, "h1g1"), expected = subjectOutcomesFromReceipt(value, owner(capture));
    const broken = { ...value.population, alternatives: value.population.alternatives.map((edge, index) => index === 0 ? value.population.alternatives[1]! : edge) };
    for (const invoke of [(raw: SemanticSubjectOutcomesInput) => subjectOutcomesFromReceipt(raw, owner(capture)), (raw: SemanticSubjectOutcomesInput) => operation.invoke(raw)]) {
      let populationReads = 0, familyReads = 0;
      const raw: SemanticSubjectOutcomesInput = { kind: "subject_outcomes", get family() { familyReads++; return familyReads === 1 ? "piece_count" : "king_zone"; },
        get population() { populationReads++; return populationReads === 1 ? value.population : broken; } };
      expect(invoke(raw)).toEqual(expected);
      expect(populationReads).toBe(1); expect(familyReads).toBe(1);
    }
    expect(() => subjectOutcomesFromReceipt({ ...value, population: broken }, owner(capture))).toThrow(/duplicate/);
  });

  it("requires the exact family@2 case subject before invocation", () => {
    const value = input("piece_count", capture, "h1g1"), base = cases.cases[0]!;
    const parsed = parseSemanticValidationCase({ ...base, id: "literal.subject-count.positive", operation: operation.ref, input: value,
      subject: { kind: "event", projection: { id: "derived.semantic_avoidance.piece_count", version: 2 } } });
    expect(parsed.input.kind).toBe("subject_outcomes");
    for (const projection of [{ id: "derived.semantic_avoidance.king_zone", version: 2 }, { id: "derived.semantic_avoidance.piece_count", version: 1 }]) expect(() => parseSemanticValidationCase({ ...parsed, subject: { kind: "event", projection } })).toThrow(/family/);
  });

  it("mirrors every nested legal edge and recomputes the population digest while retaining family", () => {
    const value = input("piece_count", capture, "h1g1"), mirrored = input("piece_count", mirrorSemanticFen(capture, "color_and_vertical"), mirrorSemanticUci("h1g1", "color_and_vertical"));
    // Only the mirror-input boundary is under test; independent proposition/operand qualification
    // remains separate and required in the live profiles.
    const base = parseSemanticValidationCase(cases.cases[0]);
    const source: SemanticValidationCaseFor<"runtime.semantic.subject_outcomes"> = { ...base, operation: operation.ref, input: value };
    const partner: SemanticValidationCaseFor<"runtime.semantic.subject_outcomes"> = { ...base, operation: operation.ref, input: mirrored };
    expect(() => assertSemanticMirrorPartnerInput(source, partner, "color_and_vertical")).not.toThrow();
    expect(() => assertSemanticMirrorPartnerInput(source, { ...partner, input: { ...mirrored, family: "king_zone" } }, "color_and_vertical")).toThrow();
    expect(() => assertSemanticMirrorPartnerInput(source, { ...partner, input: { ...mirrored, population: { ...mirrored.population, legalSetDigest: value.population.legalSetDigest } } }, "color_and_vertical")).toThrow();
    expect(() => assertSemanticMirrorPartnerInput(source, { ...partner, input: { ...mirrored, population: { ...mirrored.population, alternatives: mirrored.population.alternatives.slice(1) } } }, "color_and_vertical")).toThrow();
  });
});

describe("validation consumption is distinct from selection", () => {
  it("validates a genuine recorded event outside selector3's54 without widening selector3", () => {
    const run = recordedSequenceWindowFixture(RECORDED_SEQUENCE_POSITIVES[1]);
    const source = recordedSemanticWindowSource({ run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, projection: { id: "derived.pawn.sequence.contact_timing", version: 3 } });
    expect(source.kind).toBe("window_available"); if (source.kind !== "window_available") throw Error("Required recorded source unavailable");
    const event = source.events[0]!; expect(event).toBeDefined();
    expect(SEMANTIC_SELECTION_PROJECTION_REFS).not.toContainEqual(event.projection);
    expect(() => assertSemanticTargetValueAuthority({ kind: "event", item: event })).not.toThrow();
    expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "research.semantic_validation", version: 1 }, [event.evidence]).items[0]).toBe(event.evidence);
    expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "research.semantic_selection", version: 3 }, [event.evidence]).items).toEqual([]);
    expect(() => assertSemanticTargetValueAuthority({ kind: "event", item: { ...event } })).toThrow();
    expect(() => assertSemanticTargetValueAuthority({ kind: "event", item: { ...event, evidence: { ...event.evidence } } })).toThrow();
  });
  it("refuses retired selector/policy1 executable authority", () => {
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "research.semantic_selection", version: 1 }, [])).toThrow();
    expect(() => selectSemanticEvidence(PRIMARY_EVIDENCE_MANIFEST, { id: "research.r2_candidate", version: 1 }, { receipt: owner(capture), moveUci: "h1g1" })).toThrow();
  });
});
