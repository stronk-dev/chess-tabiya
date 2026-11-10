// D4200: closed data vocabulary only. A restored coverage DTO grants no source authority.
import type { SEMANTIC_PLAYED_RANKING_MODES } from "./semantic-played-types.js";
import type { SubjectOutcomeFamily } from "./semantic-subject-types.js";

type ExactRef<K extends string> = K extends `${infer Id}@${infer Version extends number}`
  ? Readonly<{ id: Id; version: Version }> : never;
export type SemanticSelectionProjection = ExactRef<keyof typeof SEMANTIC_PLAYED_RANKING_MODES
  | `derived.semantic_avoidance.${SubjectOutcomeFamily}@2`>;
export type LegacyUnavailableKey = "rules.tactic.event.loose_piece@1" | "derived.tactic.defender_exposure@2";
export type SourceAvailabilityMember = Readonly<{ kind: "root" }> | Readonly<{ kind: "child"; moveUci: string }>;
type CollectorUnavailable<K extends LegacyUnavailableKey = LegacyUnavailableKey> = K extends LegacyUnavailableKey ? Readonly<{
  projection: ExactRef<K>;
  cause: Readonly<{ kind: "candidate_collector"; projection: ExactRef<K> }>;
  reason: "invalid_turn_clone";
  members: readonly Readonly<{ kind: "child"; moveUci: string }>[];
}> : never;
export type UnavailableSemanticSource = CollectorUnavailable | Readonly<{
  projection: Readonly<{ id: "derived.semantic_avoidance.loose_piece"; version: 2 }>;
  cause: Readonly<{ kind: "required_total"; projection: Readonly<{ id: "rules.tactic.reading.mover_piece_risk"; version: 1 }> }>;
  reason: "invalid_turn_clone";
  members: readonly SourceAvailabilityMember[];
}>;
