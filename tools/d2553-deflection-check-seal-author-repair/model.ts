// DISPOSABLE author model — D2553. The symbol represents the production
// constructor seal; callers can retain the event or project its declared
// evidence, but cannot reconstruct the event from evidence alone.
const seal = Symbol("check-event-seal");

export interface CheckFact {
  readonly moveUci: string;
}

export interface DeclaredCheckEvidence {
  readonly projection: "rules.tactic.event.check@1";
  readonly payload: CheckFact;
}

export interface SealedCheckEvent {
  readonly projection: "rules.tactic.event.check@1";
  readonly evidence: DeclaredCheckEvidence;
  readonly operands: CheckFact;
  readonly [seal]: true;
}

export function checkSemanticEvent(fact: CheckFact | undefined): SealedCheckEvent | undefined {
  if (fact === undefined) return undefined;
  const evidence = Object.freeze({ projection: "rules.tactic.event.check@1" as const, payload: fact });
  return Object.freeze({ projection: "rules.tactic.event.check@1" as const, evidence, operands: fact, [seal]: true as const });
}

export function assertSealedCheckEvent(value: unknown): asserts value is SealedCheckEvent {
  if (typeof value !== "object" || value === null || (value as Partial<SealedCheckEvent>)[seal] !== true) {
    throw new TypeError("check event is not constructor-sealed");
  }
}
