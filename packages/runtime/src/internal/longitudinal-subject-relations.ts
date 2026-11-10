// Accepted longitudinal-store §A.2.3: finite arithmetic over the ORIGINAL complete table.
// These are unowned calculated statistics, not semantic events, learner judgements or a
// publication authority. The server's sole consumer owns the final rows under its original cut.
import type { SubjectOutcomeFactoryResult } from "../evidence-factories.js";
import { readSubjectOutcomePopulation } from "./evidence-value-routes.js";
import { BOOLEAN_SUBJECT_RELATIONS, INTEGER_SUBJECT_RELATIONS, type ParametersByFamily, type RelationByFamily,
  type SubjectByFamily, type SubjectOutcomeFamily } from "../semantic-subject-types.js";

export interface SubjectRelationIncidence<F extends SubjectOutcomeFamily> {
  readonly family: F;
  readonly subject: SubjectByFamily[F];
  readonly parameters: ParametersByFamily[F];
  readonly relation: RelationByFamily[F];
  readonly occurred: boolean;
  readonly legalAlternatives: number;
  readonly matchingAlternatives: number;
  readonly comparableAlternatives: number;
}
export type SubjectRelationIncidenceResult<F extends SubjectOutcomeFamily> =
  | { readonly kind: "available"; readonly actor: "white" | "black"; readonly edge: Readonly<{ beforeFen: string; moveUci: string; afterFen: string }>;
      readonly rows: readonly SubjectRelationIncidence<F>[] }
  | { readonly kind: "unavailable"; readonly family: F; readonly reason: "counterfactual_population_incomplete" };

export function subjectRelationIncidences<F extends SubjectOutcomeFamily>(family: F, originalResult: SubjectOutcomeFactoryResult<F>): SubjectRelationIncidenceResult<F> {
  const read = readSubjectOutcomePopulation(family, originalResult);
  if (read.kind === "unavailable") return read;
  const population = read.population;
  const relations = family === "line_blockers" || family === "piece_count" || family === "direct_attack_count" || family === "pawn_islands"
    ? INTEGER_SUBJECT_RELATIONS : BOOLEAN_SUBJECT_RELATIONS;
  const rows: SubjectRelationIncidence<F>[] = [];
  for (const cell of population.subjects) {
    if (cell.playedRelation === "not_comparable") continue;
    const legalAlternatives = cell.alternatives.length;
    if (legalAlternatives === 0) continue;
    const comparableAlternatives = cell.alternatives.filter(alternative => alternative.relation !== "not_comparable").length;
    for (const relation of relations) {
      const occurred = cell.playedRelation === relation;
      const matchingAlternatives = cell.alternatives.filter(alternative => alternative.relation === relation).length;
      // Played itself supplies a comparable truth value. An incomparable alternative does
      // not supply its opposite, even though it stays in the numeric legal denominator.
      if (occurred ? comparableAlternatives === matchingAlternatives : matchingAlternatives === 0) continue;
      rows.push(Object.freeze({ family, subject: cell.subject, parameters: cell.parameters,
        relation: relation as RelationByFamily[F], occurred, legalAlternatives, matchingAlternatives, comparableAlternatives }));
    }
  }
  return Object.freeze({ kind: "available", actor: population.actor,
    edge: Object.freeze({ beforeFen: population.beforeFen, moveUci: population.moveUci, afterFen: population.afterFen }), rows: Object.freeze(rows) });
}
