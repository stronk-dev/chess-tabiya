// Pure base-key arithmetic for isolated comparator tests. This does not admit evidence or
// authenticate ModuleFacts; production callers must enter the owned orderAdmittedFacts boundary.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import type { ProjectionDeclaration } from "../evidence-contract.js";
import { POSTCOMMIT_OBSERVED_WINDOW_POLICY, STRUCTURE_RECOGNITION_POLICY, STRUCTURE_SELECTION_GROUPS, type ModuleDeclaration } from "../module-contract.js";
import type { ModuleFact } from "../module-reducers.js";
const projectionKey = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;

const exactnessOrder: Readonly<Record<ProjectionDeclaration["exactness"], number>> = Object.freeze({
  exact: 0,
  convention: 1,
  measured: 2,
  authored: 3,
});

const criticalProjectionIds = new Set([
  "rules.transition.event.checkmate",
  "rules.transition.event.promotion",
  "rules.transition.event.castled",
  "rules.transition.event.last_of_role",
]);

/** Exact completed sources only. No prefix inference, older versions or other window families. */
export const POSTCOMMIT_OBSERVED_WINDOW_REFS: readonly string[] = Object.freeze([
  "derived.pawn.sequence.harassment_pressure@3", "derived.tactic.deflection_observed@3",
  "derived.tactic.attraction_observed@3", "derived.tactic.line_blocker_clearance_observed@3",
  "derived.tactic.square_clearance_observed@3", "derived.tactic.interference_observed@3",
  "derived.tactic.check_zwischenzug_observed@3", "derived.tactic.overload_exploitation_observed@3",
]);
const observedWindowRefs = new Set(POSTCOMMIT_OBSERVED_WINDOW_REFS);

export interface ModuleLiftEntry {
  readonly projectionId: string;
  readonly lift: number;
  readonly source: string;
  readonly measuredAt: string;
  readonly corpus: string;
}

export function orderModuleFactsByBaseKeys<T>(module: ModuleDeclaration, facts: readonly ModuleFact<T>[], lifts: readonly ModuleLiftEntry[] = []): readonly ModuleFact<T>[] {
  const familyOrder = new Map(module.selection.familyPrecedence.map((projection, index) => [projectionKey(projection), index]));
  const observedWindowOrder = module.id === "postcommit_nudge" && module.consumer?.id === "module.postcommit_nudge" && module.consumer.version === 2
    && module.selection.policy.id === POSTCOMMIT_OBSERVED_WINDOW_POLICY.id && module.selection.policy.version === POSTCOMMIT_OBSERVED_WINDOW_POLICY.version;
  const recognitionOrder = module.id === "structure_nudge" && module.consumer?.id === "module.structure_nudge" && module.consumer.version === 2
    && projectionKey(module.selection.policy) === projectionKey(STRUCTURE_RECOGNITION_POLICY);
  const lift = new Map(lifts.map((entry) => [entry.projectionId, entry]));
  for (const entry of lifts) {
    if (!Number.isFinite(entry.lift) || entry.lift < 0 || entry.source.trim() === "" || entry.measuredAt.trim() === "" || entry.corpus.trim() === "") {
      throw new TypeError(`MODULE_LIFT_INVALID: ${entry.projectionId}`);
    }
  }
  return Object.freeze([...facts].sort((left, right) => {
    const critical = Number(criticalProjectionIds.has(right.projection.id)) - Number(criticalProjectionIds.has(left.projection.id));
    if (critical !== 0) return critical;
    if (recognitionOrder) {
      const recognized = (fact: ModuleFact) => STRUCTURE_SELECTION_GROUPS.recognition.includes(projectionKey(fact.evidence.projection));
      const recognition = Number(recognized(right)) - Number(recognized(left));
      if (recognition !== 0) return recognition;
    }
    if (observedWindowOrder) {
      const sequence = Number(observedWindowRefs.has(projectionKey(right.projection))) - Number(observedWindowRefs.has(projectionKey(left.projection)));
      if (sequence !== 0) return sequence;
      if (observedWindowRefs.has(projectionKey(left.projection)) && observedWindowRefs.has(projectionKey(right.projection))) {
        const overload = Number(projectionKey(right.projection) === "derived.tactic.overload_exploitation_observed@3")
          - Number(projectionKey(left.projection) === "derived.tactic.overload_exploitation_observed@3");
        if (overload !== 0) return overload;
      }
      // The source-risk/within-group keys below stay unchanged. This is the exact accepted
      // current grade only, after critical/completed windows and before routine changes.
      const grade = Number(projectionKey(right.projection) === "derived.grade.move_quality@2")
        - Number(projectionKey(left.projection) === "derived.grade.move_quality@2");
      if (grade !== 0) return grade;
    }
    const exactness = exactnessOrder[left.projection.exactness] - exactnessOrder[right.projection.exactness];
    if (exactness !== 0) return exactness;
    const leftLift = lift.get(left.projection.id)?.lift;
    const rightLift = lift.get(right.projection.id)?.lift;
    if (leftLift !== undefined || rightLift !== undefined) {
      if (leftLift === undefined) return 1;
      if (rightLift === undefined) return -1;
      if (leftLift !== rightLift) return rightLift - leftLift;
    }
    const precedence = (familyOrder.get(projectionKey(left.projection)) ?? Number.MAX_SAFE_INTEGER) - (familyOrder.get(projectionKey(right.projection)) ?? Number.MAX_SAFE_INTEGER);
    if (precedence !== 0) return precedence;
    const square = (left.subjectSquare ?? "z9").localeCompare(right.subjectSquare ?? "z9");
    if (square !== 0) return square;
    const event = (left.eventId ?? "").localeCompare(right.eventId ?? "");
    if (event !== 0) return event;
    return canonicalizeJson(left.retainedOperands).localeCompare(canonicalizeJson(right.retainedOperands));
  }));
}
