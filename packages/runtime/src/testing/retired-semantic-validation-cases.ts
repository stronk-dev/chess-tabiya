/** Test-only historical fixtures. Never imported by the live register, build or collectors.
 * Original records retain their exact subjects, authorities and original population positions;
 * they do not execute or qualify retired sources. Current cases remain in the live JSON only. */
import retired from "./retired-semantic-validation-cases.json" with { type: "json" };
import { SEMANTIC_VALIDATION_CASTLING_SOURCES } from "../semantic-validation-castling-sources.js";
import { SEMANTIC_VALIDATION_RIGHTS_SOURCES } from "../semantic-validation-rights-sources.js";
import { SLIDER_LITERAL_SOURCE } from "../semantic-validation-slider-sources.js";
import { BACKWARD_LITERAL_SOURCE } from "../semantic-validation-backward-sources.js";
import { PAWN_FILE_LITERAL_SOURCES } from "../semantic-validation-pawn-file-sources.js";
import { OPPOSITION_LITERAL_SOURCE } from "../semantic-validation-opposition-sources.js";
import { SEMANTIC_VALIDATION_TRANSITION_SOURCES } from "../semantic-validation-transition-sources.js";

export const RETIRED_SEMANTIC_VALIDATION_CASES: readonly Record<string, unknown>[] = retired.cases;
export const RETIRED_SEMANTIC_VALIDATION_ASSERTION_BODIES: Readonly<Record<string, string>> = retired.assertionBodies;

// These exact additions postdate the frozen population. They are exercised through the live
// registry and dedicated castling/rights tests, never counted as predecessor proof.
const laterCaseIds = new Set([...SEMANTIC_VALIDATION_CASTLING_SOURCES, ...SEMANTIC_VALIDATION_RIGHTS_SOURCES, ...SEMANTIC_VALIDATION_TRANSITION_SOURCES, OPPOSITION_LITERAL_SOURCE, ...PAWN_FILE_LITERAL_SOURCES, BACKWARD_LITERAL_SOURCE, SLIDER_LITERAL_SOURCE]
  .flatMap(source => source.cases.map(row => row.proposition.case.id)));

/** Reconstruct the original population for its existing frozen coverage assertions only. */
export function retainHistoricalSemanticCaseFixtures(current: readonly Record<string, unknown>[]): readonly Record<string, unknown>[] {
  const result = current.filter(row => !laterCaseIds.has(row.id as string));
  for (const [index, row] of retired.cases.entries()) {
    if (result.some(value => value.id === row.id)) throw new Error(`Retired case ${row.id} is still registered live`);
    result.splice(retired.originalIndices[index]!, 0, row);
  }
  return result;
}
