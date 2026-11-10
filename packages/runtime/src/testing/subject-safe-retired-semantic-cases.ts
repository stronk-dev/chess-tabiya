/** Test-only custody for the nine retired public event meanings. No current qualification. */
import retired from "./subject-safe-retired-semantic-cases.json" with { type: "json" };
import { retainHistoricalSemanticCaseFixtures as retainEarlierHistory } from "./retired-semantic-validation-cases.js";
export { RETIRED_SEMANTIC_VALIDATION_CASES, RETIRED_SEMANTIC_VALIDATION_ASSERTION_BODIES } from "./retired-semantic-validation-cases.js";

export const SUBJECT_SAFE_RETIRED_CASES: readonly Record<string, unknown>[] = retired.cases;
export const SUBJECT_SAFE_RETIRED_ASSERTION_BODIES: Readonly<Record<string, string>> = retired.assertionBodies;
export const SUBJECT_SAFE_RETIRED_PROFILES = retired.profiles;
export const SUBJECT_SAFE_RETIRED_POPULATIONS = retired.populations;
/** Current retained meanings use dedicated assertions; frozen historical comparisons keep old refs. */
export const SUBJECT_SAFE_REANCHORED_CASES = retired.reanchoredCases;

/** Restore the earlier population only for its frozen historical assertions. New subject-owned
 * source cases never enter this old image. Neither custody file is registered by live collectors. */
export function restoreSubjectSafeHistoricalCases(current: readonly Record<string, unknown>[]): readonly Record<string, unknown>[] {
  const restored = current.filter(row => (row.operation as { id?: unknown } | undefined)?.id !== "runtime.semantic.subject_outcomes")
    .map(row => retired.reanchoredCases.find(original => original.id === row.id) ?? row);
  for (const [index, row] of retired.cases.entries()) {
    if (restored.some(candidate => candidate.id === row.id)) throw Error(`Retired case ${row.id} remains live`);
    restored.splice(retired.originalIndices[index]!, 0, row);
  }
  return restored;
}

/** Earlier historical suites also remove subsequently introduced source families. */
export function retainHistoricalSemanticCaseFixtures(current: readonly Record<string, unknown>[]): readonly Record<string, unknown>[] {
  return retainEarlierHistory(restoreSubjectSafeHistoricalCases(current));
}
