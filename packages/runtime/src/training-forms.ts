// rfc/pack-training-forms.md — the pure mechanics of the set grain, the pass mark, the guided-pass
// ceiling ramp and the tempo cycle. Every function here counts or scales AUTHORED values over
// verdicts the runtime already computes; none grades a move or emits a per-member number (§6, law 8).

import type { AssistanceCeilingRung, AssistanceRampStep, TrainingSetDefinition } from "@chess-tabiya/schema/drill-pack";

/**
 * §3.1: the ceiling for one attempt. Pass `attemptNo` (1-based) permits the rung of the first step
 * whose `throughAttempt` covers it; past the last step the ceiling is rung 0 (rules-derived sight).
 * Absent ramp means no pack ceiling at all (`undefined`) — today's behaviour.
 */
export function rampCeilingRung(ramp: readonly AssistanceRampStep[] | undefined, attemptNo: number): AssistanceCeilingRung | undefined {
  if (ramp === undefined) return undefined;
  if (!Number.isSafeInteger(attemptNo) || attemptNo < 1) throw new RangeError(`attempt number must be a positive integer, received ${attemptNo}`);
  return ramp.find((step) => attemptNo <= step.throughAttempt)?.ceilingRung ?? 0;
}

/**
 * The ∩ algebra (design/05 §3a, consumed unchanged): every term only narrows. The pack's ceiling can
 * never raise the learner's requested rung — a learner who declined help keeps a bare pass.
 */
export function narrowedRung(learnerRung: number, packCeiling: AssistanceCeilingRung | undefined): number {
  return packCeiling === undefined ? learnerRung : Math.min(learnerRung, packCeiling);
}

/** The shipped attempt verdict (`apps/server/src/progress.ts` AttemptVerdict), projected from the objective state. */
export type MemberVerdict = "stable" | "unstable" | "open";

/**
 * §2: the pass mark counts members whose attempt resolved `stable` under their own authored
 * objective. An `open` member counts as neither pass nor fail. The completion payload carries the
 * verdict and the re-offer only — never the count, never a per-member number (criterion 11).
 */
export interface SetCompletion {
  readonly kind: "set_completion";
  readonly setId: string;
  readonly passed: boolean;
  readonly reoffer: boolean;
}

export function passMarkCompletion(set: TrainingSetDefinition, verdicts: ReadonlyMap<string, MemberVerdict>): SetCompletion {
  if (set.passMark === undefined) throw new TypeError(`TRAINING_SET_NO_PASS_MARK: ${set.id} declares no pass mark`);
  const scope = set.passMark.of === "all" ? set.members.map((member) => member.packId) : set.passMark.of;
  const stable = scope.filter((packId) => verdicts.get(packId) === "stable").length;
  const passed = stable >= set.passMark.require;
  // `onFail: "repeat_set"` is a re-offer, not an enforcement: nothing here locks a member pack.
  return Object.freeze({ kind: "set_completion", setId: set.id, passed, reoffer: !passed && set.passMark.onFail === "repeat_set" });
}

/** §4.2: an authored budget scaled by an authored factor; never an extrapolated or invented tempo. */
export function scaledLuxuryBudget(luxuryMoveBudget: number, budgetScale: number): number {
  if (!Number.isSafeInteger(luxuryMoveBudget) || luxuryMoveBudget < 0) throw new RangeError("luxuryMoveBudget must be a non-negative integer");
  if (!(budgetScale > 0 && budgetScale <= 1)) throw new RangeError("budgetScale must be in (0, 1]");
  return Math.floor(luxuryMoveBudget * budgetScale);
}

/** A cycle's members in the set's ordinal order (§4.2). */
export function cycleOrder(set: TrainingSetDefinition): readonly string[] {
  return Object.freeze([...set.members].sort((left, right) => left.ordinal - right.ordinal).map((member) => member.packId));
}
