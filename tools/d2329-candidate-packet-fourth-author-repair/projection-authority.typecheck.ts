// DISPOSABLE type image for the D2329 proposed generated production authority.
export const CANDIDATE_COLLECTOR_PROJECTION_KEYS = Object.freeze({
  "event.transition": Object.freeze(["rules.transition.event.capture@1"] as const),
  "event.tactical": Object.freeze(["rules.tactic.event.double_attack@1"] as const),
  "reading.legal_exchange": Object.freeze(["rules.exchange.predicate.legal_exchange@1"] as const),
  "reading.fork_survival": Object.freeze(["derived.tactic.fork_survives_reply@1"] as const),
} as const);

export type CandidateCollectorProjection = {
  [K in keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS]:
    (typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS)[K][number]
}[keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS];

export type CandidateCollectorResult<P extends CandidateCollectorProjection> = Readonly<{
  projection: P;
  values: readonly Readonly<{ projection: P }>[];
}>;
