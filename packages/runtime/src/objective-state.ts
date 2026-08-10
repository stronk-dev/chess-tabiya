import type { ObjectiveState } from "./types.js";

const ALLOWED_TRANSITIONS = Object.freeze({
  active: ["preserved", "degraded", "failed", "achieved", "transitioned"],
  preserved: ["active", "degraded", "failed", "achieved", "transitioned"],
  degraded: ["active", "preserved", "failed", "achieved", "transitioned"],
  failed: [],
  achieved: [],
  transitioned: [],
} as const satisfies Readonly<Record<ObjectiveState, readonly ObjectiveState[]>>);

export class ObjectiveTransitionError extends Error {
  readonly from: ObjectiveState;
  readonly to: ObjectiveState;

  constructor(from: ObjectiveState, to: ObjectiveState) {
    super(`Objective transition is not allowed: ${from} -> ${to}`);
    this.name = "ObjectiveTransitionError";
    this.from = from;
    this.to = to;
  }
}

export class ObjectiveEvidenceError extends Error {
  constructor() {
    super("Objective state changes require at least one non-empty evidence reference");
    this.name = "ObjectiveEvidenceError";
  }
}

export function isObjectiveTransitionAllowed(
  from: ObjectiveState,
  to: ObjectiveState,
): boolean {
  const allowed: readonly ObjectiveState[] = ALLOWED_TRANSITIONS[from];
  return allowed.includes(to);
}

export function assertObjectiveTransition(
  from: ObjectiveState,
  to: ObjectiveState,
  evidenceRefs: readonly string[],
): void {
  if (!isObjectiveTransitionAllowed(from, to)) {
    throw new ObjectiveTransitionError(from, to);
  }
  if (evidenceRefs.length === 0 || evidenceRefs.some((reference) => reference.length === 0)) {
    throw new ObjectiveEvidenceError();
  }
}
