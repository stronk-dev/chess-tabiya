// Accepted longitudinal-store A.2. Sole complete reducer; its finite proof retains literal rows
// and the original store scope, never per-decision WIDE packets/tables/factory results.
import { preflightProfileSubjectFacts, collectProfileSubjectPopulation } from "../../../packages/runtime/src/internal/profile-subject-facts.js";
import { normativeDecisions } from "./longitudinal-decisions.js";
import { readProfileGameSource, selectProfileSubjectDecision, type ProfileGameSource } from "./profile-game-source.js";
import { parseLongitudinalSubjectObservationRow, subjectObservationKey, type LongitudinalSubjectObservationRow } from "./profile-subject-facts-contract.js";
import type { LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import { type ProfileSubjectDecisionReduction } from "./profile-subject-reduction.js";
import { ownProfileSubjectReduction } from "./profile-subject-facts-authority.js";
export { assertProfileSubjectFactOwner, readProfileSubjectReduction } from "./profile-subject-facts-authority.js";
function capturedOptions(value: unknown): { gameSource: ProfileGameSource; derivedRev: number; checkpoint?: (completed: number, total: number) => void } {
  const fail = (): never => { throw new TypeError("Subject consumer requires own-data source options"); };
  if (value === null || typeof value !== "object" || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return fail();
  const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
  if (keys.some(k => typeof k !== "string" || !["gameSource", "derivedRev", "checkpoint"].includes(k))
    || !["gameSource", "derivedRev"].every(k => Object.hasOwn(descriptors, k))
    || keys.some(k => { const d = descriptors[k as string]!; return !d.enumerable || !("value" in d); })) return fail();
  const gameSource = descriptors.gameSource!.value as ProfileGameSource, derivedRev = descriptors.derivedRev!.value as unknown;
  const checkpoint = descriptors.checkpoint?.value as unknown;
  if (!Number.isSafeInteger(derivedRev) || (derivedRev as number) < 1 || checkpoint !== undefined && typeof checkpoint !== "function") return fail();
  return { gameSource, derivedRev: derivedRev as number, ...(checkpoint === undefined ? {} : { checkpoint: checkpoint as (completed: number, total: number) => void }) };
}
export function consumeProfileSubjectFacts(image: LongitudinalSourceImageV4, options: {
  readonly gameSource: ProfileGameSource; readonly derivedRev: number; readonly checkpoint?: (completed: number, total: number) => void;
}): readonly LongitudinalSubjectObservationRow[] {
  const { gameSource, derivedRev, checkpoint } = capturedOptions(options);
  preflightProfileSubjectFacts();
  const scope = readProfileGameSource(gameSource);
  if (scope.image !== image || scope.identity.derivedRev !== derivedRev) throw new TypeError("Subject consumer crosses its original image or revision");
  const run = scope.run, observedAt = new Date(Date.parse(run.events[0]!.at)).toISOString();
  const decisions = normativeDecisions(image, run), rows: LongitudinalSubjectObservationRow[] = [], summary: ProfileSubjectDecisionReduction[] = [];
  for (const [index, original] of decisions.entries()) {
    checkpoint?.(index, decisions.length);
    const { decision, actor } = selectProfileSubjectDecision(gameSource, original.ref);
    // This call-local function releases all source graph references before the next decision.
    rows.push(...reduceDecision());
    function reduceDecision(): readonly LongitudinalSubjectObservationRow[] {
      const population = collectProfileSubjectPopulation(decision.beforeFen, decision.moveUci);
      if (population.actor !== actor) throw new TypeError("Subject population crosses its original decision actor");
      summary.push(Object.freeze({ ref: decision.ref, phase: decision.phase, decisionClass: decision.decisionClass,
        actor, legalAlternatives: population.legalAlternatives, unavailable: population.unavailable, prevalence: population.prevalence }));
      const context = { learnerId: image.ownerLearnerId, runId: run.id, decisionRef: decision.ref, actor,
        phase: decision.phase, decisionClass: decision.decisionClass, sessionKind: run.sessionKind,
        packId: run.sessionKind === "pack" ? run.packId : null, observedAt, derivedRev: derivedRev };
      const selected: LongitudinalSubjectObservationRow[] = [];
      for (const incidence of population.native) {
        const { source, ...values } = incidence, at = source.lastIndexOf("@");
        selected.push(parseLongitudinalSubjectObservationRow({ ...context, sourceKind: "native_incidence",
          projectionId: source.slice(0, at), projectionVersion: Number(source.slice(at + 1)), ...values }));
      }
      for (const incidence of population.conditions) {
        const { family, ...values } = incidence;
        selected.push(parseLongitudinalSubjectObservationRow({ ...context, sourceKind: "condition_relation",
          projectionId: `derived.semantic_avoidance.${family}`, projectionVersion: 2, ...values }));
      }
      return selected;
    }
    readProfileGameSource(gameSource);
    checkpoint?.(index + 1, decisions.length);
  }
  rows.sort((a, b) => a.decisionRef.eventSeq - b.decisionRef.eventSeq || (subjectObservationKey(a) < subjectObservationKey(b) ? -1 : subjectObservationKey(a) > subjectObservationKey(b) ? 1 : 0));
  const keys = rows.map(subjectObservationKey);
  if (new Set(keys).size !== keys.length) throw new TypeError("Subject consumer produced duplicate decision/subject/test identities");
  readProfileGameSource(gameSource);
  const result = Object.freeze(rows);
  return ownProfileSubjectReduction(result, Object.freeze(summary), image, gameSource, derivedRev);
}
