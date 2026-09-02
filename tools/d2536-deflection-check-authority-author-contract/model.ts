// DISPOSABLE D2536 author model. It selects between already-validated producer facts;
// it does not detect or infer chess semantics.
export interface RecordedEdgeIdentity {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
}

export interface SealedCheckEventIdentity {
  readonly projection: "rules.tactic.event.check@1";
  readonly anchor: RecordedEdgeIdentity;
}

export type DeflectionDerivationArm =
  | Readonly<{ readonly kind: "bait_capture"; readonly inputs: readonly [
      "run.record.move@1",
      "rules.tactic.reading.defender_duty_set@1",
      "rules.transition.event.capture@1",
      "rules.exchange.predicate.legal_exchange@1",
    ] }>
  | Readonly<{ readonly kind: "check_induced"; readonly inputs: readonly [
      "run.record.move@1",
      "rules.tactic.reading.defender_duty_set@1",
      "rules.transition.event.capture@1",
      "rules.exchange.predicate.legal_exchange@1",
      "rules.tactic.event.check@1",
    ] }>;

const COMMON = Object.freeze([
  "run.record.move@1",
  "rules.tactic.reading.defender_duty_set@1",
  "rules.transition.event.capture@1",
  "rules.exchange.predicate.legal_exchange@1",
] as const);

function sameEdge(left: RecordedEdgeIdentity, right: RecordedEdgeIdentity): boolean {
  return left.beforeFen === right.beforeFen && left.moveUci === right.moveUci
    && left.afterFen === right.afterFen;
}

export function selectDeflectionDerivationArm(input: Readonly<{
  readonly baitCaptureMatched: boolean;
  readonly firstEdgeIsCheck: boolean;
  readonly firstEdge: RecordedEdgeIdentity;
  readonly checkEvent?: SealedCheckEventIdentity;
}>): DeflectionDerivationArm {
  if (input.baitCaptureMatched) {
    if (input.checkEvent !== undefined) throw new TypeError("bait-capture arm refuses unnecessary check evidence");
    return Object.freeze({ kind: "bait_capture", inputs: COMMON });
  }
  if (!input.firstEdgeIsCheck) throw new TypeError("deflection has no validated induction arm");
  if (input.checkEvent === undefined) throw new TypeError("check-induced deflection requires sealed check evidence");
  if (input.checkEvent.projection !== "rules.tactic.event.check@1" || !sameEdge(input.checkEvent.anchor, input.firstEdge)) {
    throw new TypeError("check-induced deflection received crossed check evidence");
  }
  return Object.freeze({ kind: "check_induced", inputs: Object.freeze([...COMMON, "rules.tactic.event.check@1"] as const) });
}
