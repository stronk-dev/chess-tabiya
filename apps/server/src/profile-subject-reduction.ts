// A.2.5a literal fold only. Original-array/source ownership is checked by the sole reducer.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { compareText, observationSortKey, parseLongitudinalDenominatorRow, parseLongitudinalObservationRow,
  type DecisionRef, type LongitudinalPhase, type LongitudinalDecisionClass, type LongitudinalSessionKind,
  type LongitudinalDenominatorRow, type LongitudinalObservationRow } from "./longitudinal-contract.js";
import { isAdmittedIdentity } from "./longitudinal-registry.js";
import type { SemanticEventSign } from "@chess-tabiya/runtime";
import type { UnavailableSemanticSource } from "../../../packages/runtime/src/semantic-source-availability-types.js";
import { parseLongitudinalSubjectEvaluationRow, type LongitudinalSubjectEvaluationRow } from "./profile-subject-facts-contract.js";
interface Decision { readonly ref: DecisionRef; readonly phase: LongitudinalPhase; readonly decisionClass: LongitudinalDecisionClass }
export interface PrevalenceIncidence { readonly projectionId: string; readonly projectionVersion: number; readonly sign: SemanticEventSign;
  readonly occurred: boolean; readonly legalAlternatives: number; readonly matchingAlternatives: number }
export type ProfileSubjectDecisionReduction = Decision & { readonly actor: "white" | "black"; readonly legalAlternatives: number;
  readonly unavailable: readonly UnavailableSemanticSource[]; readonly prevalence: readonly PrevalenceIncidence[] };
export interface ProfileSubjectReductionContext { readonly learnerId: string; readonly runId: string; readonly observedAt: string;
  readonly derivedRev: number; readonly sessionKind: LongitudinalSessionKind; readonly packId: string | null }
export function foldProfileSubjectReduction(summary: readonly ProfileSubjectDecisionReduction[], context: ProfileSubjectReductionContext) {
  const counts = new Map<string, number>(), groups = new Map<string, { value: PrevalenceIncidence; phase: LongitudinalPhase; decisionClass: LongitudinalDecisionClass;
    refs: DecisionRef[]; occurred: DecisionRef[]; share: number }>();
  const evaluations: LongitudinalSubjectEvaluationRow[] = [];
  const seen = new Set<string>();
  for (const decision of summary) {
    const keyRef = canonicalizeJson(decision.ref);
    if (seen.has(keyRef)) throw new TypeError("Duplicate subject evaluation decision");
    seen.add(keyRef);
    evaluations.push(parseLongitudinalSubjectEvaluationRow({ ...context, decisionRef: decision.ref, actor: decision.actor,
      phase: decision.phase, decisionClass: decision.decisionClass, legalAlternatives: decision.legalAlternatives, unavailable: decision.unavailable }));
    const band = `${decision.phase}\0${decision.decisionClass}`;
    counts.set(band, (counts.get(band) ?? 0) + 1);
    for (const value of decision.prevalence) {
      if (!isAdmittedIdentity({ ...value, semanticSign: value.sign, sourceSign: value.sign })) throw new TypeError("Subject summary contains an unadmitted prevalence source");
      if (value.legalAlternatives !== decision.legalAlternatives || value.legalAlternatives <= 0
        || decision.unavailable.some(u => u.projection.id === value.projectionId && u.projection.version === value.projectionVersion)) throw new TypeError("Unavailable or inconsistent prevalence opportunity");
      const key = `${value.projectionId}\0${value.projectionVersion}\0${value.sign}\0${band}`;
      const group = groups.get(key) ?? { value, phase: decision.phase, decisionClass: decision.decisionClass, refs: [], occurred: [], share: 0 };
      group.refs.push(decision.ref); if (value.occurred) group.occurred.push(decision.ref);
      group.share += value.matchingAlternatives / value.legalAlternatives; groups.set(key, group);
    }
  }
  const denominators = [...counts].map(([band, decisions]) => {
    const [phase, decisionClass] = band.split("\0");
    return parseLongitudinalDenominatorRow({ learnerId: context.learnerId, runId: context.runId, observedAt: context.observedAt, derivedRev: context.derivedRev, phase, decisionClass, decisions });
  }).sort((a, b) => compareText(`${a.phase}\0${a.decisionClass}`, `${b.phase}\0${b.decisionClass}`));
  const observations = [...groups.values()].map(g => parseLongitudinalObservationRow({ ...context,
    projectionId: g.value.projectionId, projectionVersion: g.value.projectionVersion, semanticSign: g.value.sign, sourceSign: g.value.sign,
    phase: g.phase, decisionClass: g.decisionClass, decisions: counts.get(`${g.phase}\0${g.decisionClass}`),
    opportunities: g.refs.length, occurred: g.occurred.length, alternativeShareSum: g.share, occurredRefs: g.occurred, opportunityRefs: g.refs,
  })).sort((a, b) => compareText(observationSortKey(a), observationSortKey(b)));
  return Object.freeze({ denominators: Object.freeze(denominators), observations: Object.freeze(observations), evaluations: Object.freeze(evaluations) });
}
export function assertProfileSubjectFold(actual: { readonly denominators: readonly LongitudinalDenominatorRow[]; readonly observations: readonly LongitudinalObservationRow[]; readonly subjectEvaluations: readonly LongitudinalSubjectEvaluationRow[] }, expected: ReturnType<typeof foldProfileSubjectReduction>): void {
  if (canonicalizeJson(actual.denominators) !== canonicalizeJson(expected.denominators) || canonicalizeJson(actual.observations) !== canonicalizeJson(expected.observations)
    || canonicalizeJson(actual.subjectEvaluations) !== canonicalizeJson(expected.evaluations)) throw new TypeError("LONGITUDINAL_SUBJECT_REDUCTION_MISMATCH");
}
