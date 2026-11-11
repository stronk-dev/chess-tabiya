// Prepared references only: these sources are not yet in the canonical authority registry.
import { describe, expect, it } from "vitest";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "./candidate-population.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "./internal/evidence-value-routes.js";
import { canonicalSemanticEdge } from "./semantic-validation-operations.js";
import { compareSemanticMirror, type SemanticMirrorObservation } from "./semantic-validation.js";
import {
  KING_OUTCOME_FAMILIES, KING_OUTCOME_LITERAL_SOURCES, KING_OUTCOME_POPULATIONS,
  kingOutcomeInput, literalKingOutcomeEvents, literalKingOutcomePopulation,
  type KingOutcomeFamily,
} from "./semantic-validation-king-outcome-sources.js";

type LiteralPopulation = (typeof KING_OUTCOME_POPULATIONS)[number];

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
