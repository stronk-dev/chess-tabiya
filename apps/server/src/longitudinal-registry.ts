// Accepted longitudinal-store §A.2: exact current source image. Historical v1/v2 artifacts
// remain immutable; native subjects, total condition relations and operator prevalence differ.
import { createHash } from "node:crypto";
import { SEMANTIC_EVENT_DECLARATIONS, type SemanticEventSign } from "@chess-tabiya/runtime";
import { SEMANTIC_EVENT_SIGNS } from "../../../packages/runtime/src/evidence-contract.js";
import { canonicalizeJson, type JsonValue } from "@chess-tabiya/schema/drill-pack";
import { NATIVE_SUBJECT_SOURCE_REFS } from "../../../packages/runtime/src/semantic-native-subject-types.js";
import { SUBJECT_OUTCOME_FAMILIES, BOOLEAN_SUBJECT_RELATIONS, INTEGER_SUBJECT_RELATIONS, type SubjectOutcomeFamily,
  type BooleanSubjectRelation, type IntegerSubjectRelation } from "../../../packages/runtime/src/semantic-subject-types.js";

// Revision9 installs the subject table and six-family publication together.
// Current migration/rebuild/cost acceptance remains in flight; this is not a release certificate.
export const OBSERVATION_DERIVATION_REV = 10 as const;
export const LONGITUDINAL_SEMANTIC_SIGNS = SEMANTIC_EVENT_SIGNS;
export interface RegistryProjection { readonly id: string; readonly version: 1 | 2 }
export type LongitudinalConstructor =
  | { readonly projection: RegistryProjection; readonly signs: readonly SemanticEventSign[]; readonly kind: "edge";
      readonly adapter: "local_semantic_event"; readonly meaning: "event_prevalence"; readonly visibility: "operator_only" }
  | { readonly projection: RegistryProjection; readonly signs: readonly SemanticEventSign[]; readonly kind: "native"; readonly adapter: "native_subject_incidence" }
  | { readonly projection: RegistryProjection; readonly signs: readonly ["avoided"]; readonly kind: "population";
      readonly adapter: "subject_relation_population"; readonly sourceScope: "complete_factory_result"; readonly family: SubjectOutcomeFamily;
      readonly relations: readonly (BooleanSubjectRelation | IntegerSubjectRelation)[] }
  | { readonly projection: RegistryProjection; readonly signs: readonly SemanticEventSign[]; readonly kind: "path";
      readonly adapter: "recorded_sequence"; readonly status: "deferred"; readonly owner: "longitudinal-store:A.2"; readonly reason: string };
export type AdmittedConstructor = Exclude<LongitudinalConstructor, { readonly kind: "path" }>;
const PATH_REASON = "No complete subject-aware recorded-path opportunity authority; deferred under longitudinal-store A.2.";
const PATH_IDS: readonly string[] = Object.freeze(["derived.exchange.trade_completed", "derived.pawn.sequence.contact_timing", "derived.pawn.sequence.harassment_pressure", "derived.tactic.sequence.defender_consequence", "derived.tactic.deflection_observed", "derived.tactic.attraction_observed", "derived.tactic.line_blocker_clearance_observed", "derived.tactic.square_clearance_observed", "derived.tactic.interference_observed", "derived.tactic.check_zwischenzug_observed", "derived.tactic.overload_exploitation_observed"]);
const NATIVE_KEYS: ReadonlySet<string> = new Set(NATIVE_SUBJECT_SOURCE_REFS);
const INTEGER_FAMILIES: ReadonlySet<SubjectOutcomeFamily> = new Set(["line_blockers", "piece_count", "direct_attack_count", "pawn_islands"]);
/** Literal current65 image. No latest-version, suffix alias or implicit new-family admission. */
const CURRENT_REFS: readonly RegistryProjection[] = Object.freeze([
  Object.freeze({ id: "rules.structural.event.king_zone", version: 1 }),
  Object.freeze({ id: "rules.structural.event.passed_pawn", version: 1 }),
  Object.freeze({ id: "rules.structural.event.piece_count", version: 1 }),
  Object.freeze({ id: "rules.structural.event.direct_attack_count", version: 1 }),
  Object.freeze({ id: "rules.structural.event.king_opposition", version: 2 }),
  Object.freeze({ id: "rules.structural.event.backward_pawn", version: 2 }),
  Object.freeze({ id: "derived.structural.event.pawn_file_group", version: 1 }),
  Object.freeze({ id: "rules.transition.event.slider_ray", version: 2 }),
  Object.freeze({ id: "derived.activity.event.file_state", version: 1 }),
  Object.freeze({ id: "derived.activity.event.file_access_revealed", version: 1 }),
  Object.freeze({ id: "rules.structural.event.pawn_islands", version: 2 }),
  Object.freeze({ id: "rules.transition.event.occupied_attack", version: 1 }),
  Object.freeze({ id: "rules.transition.event.occupied_defence", version: 1 }),
  Object.freeze({ id: "rules.transition.event.piece_escape", version: 1 }),
  Object.freeze({ id: "rules.transition.event.defended_duty", version: 1 }),
  Object.freeze({ id: "rules.transition.event.castled", version: 1 }),
  Object.freeze({ id: "rules.transition.event.clock_reset", version: 1 }),
  Object.freeze({ id: "rules.transition.event.last_of_role", version: 1 }),
  Object.freeze({ id: "rules.transition.event.pawn_contact", version: 1 }),
  Object.freeze({ id: "rules.transition.event.checkmate", version: 1 }),
  Object.freeze({ id: "rules.transition.event.promotion", version: 1 }),
  Object.freeze({ id: "rules.transition.event.capture", version: 1 }),
  Object.freeze({ id: "rules.transition.event.developed", version: 1 }),
  Object.freeze({ id: "rules.tactic.event.double_attack", version: 1 }),
  Object.freeze({ id: "rules.tactic.consequence.reply_breadth", version: 1 }),
  Object.freeze({ id: "rules.tactic.event.check", version: 1 }),
  Object.freeze({ id: "rules.tactic.event.loose_piece", version: 1 }),
  Object.freeze({ id: "rules.castling.event.rights_lost", version: 1 }),
  Object.freeze({ id: "derived.exchange.capture_class", version: 1 }),
  Object.freeze({ id: "derived.tactic.discovered_executed", version: 1 }),
  Object.freeze({ id: "rules.square.event.control", version: 1 }),
  Object.freeze({ id: "rules.mobility.event.piece_destinations", version: 1 }),
  Object.freeze({ id: "rules.pawn.event.dynamics", version: 1 }),
  Object.freeze({ id: "derived.pawn.event.transitions", version: 1 }),
  Object.freeze({ id: "derived.tactic.defender_exposure", version: 2 }),
  Object.freeze({ id: "derived.material.event.role_asymmetry", version: 2 }),
  Object.freeze({ id: "rules.king.event.zone_state", version: 1 }),
  Object.freeze({ id: "derived.king.captured_zone_defender", version: 1 }),
  Object.freeze({ id: "derived.activity.event.open_file_occupancy", version: 1 }),
  Object.freeze({ id: "rules.tactic.event.defender_removed", version: 1 }),
  Object.freeze({ id: "rules.tactic.event.defender_duty_relocated", version: 1 }),
  Object.freeze({ id: "derived.semantic_avoidance.backward_pawn", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.doubled_pawn", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.half_open_file", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.isolated_pawn", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.king_opposition", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.king_zone", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.line_blockers", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.open_file", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.passed_pawn", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.piece_count", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.direct_attack_count", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.loose_piece", version: 2 }),
  Object.freeze({ id: "derived.semantic_avoidance.pawn_islands", version: 2 }),
  Object.freeze({ id: "derived.exchange.trade_completed", version: 1 }),
  Object.freeze({ id: "derived.pawn.sequence.contact_timing", version: 1 }),
  Object.freeze({ id: "derived.pawn.sequence.harassment_pressure", version: 1 }),
  Object.freeze({ id: "derived.tactic.sequence.defender_consequence", version: 1 }),
  Object.freeze({ id: "derived.tactic.deflection_observed", version: 1 }),
  Object.freeze({ id: "derived.tactic.attraction_observed", version: 1 }),
  Object.freeze({ id: "derived.tactic.line_blocker_clearance_observed", version: 1 }),
  Object.freeze({ id: "derived.tactic.square_clearance_observed", version: 1 }),
  Object.freeze({ id: "derived.tactic.interference_observed", version: 1 }),
  Object.freeze({ id: "derived.tactic.check_zwischenzug_observed", version: 1 }),
  Object.freeze({ id: "derived.tactic.overload_exploitation_observed", version: 1 }),
]);
const key = (ref: { readonly id: string; readonly version: number }) => `${ref.id}@${ref.version}`;
const signsByProjection = new Map(SEMANTIC_EVENT_DECLARATIONS.map(row => [key(row.projection), row.allowedSigns]));
function exactSigns(ref: RegistryProjection): readonly SemanticEventSign[] {
  const signs = signsByProjection.get(key(ref));
  if (signs === undefined || signs.length === 0) throw new TypeError(`LONGITUDINAL_SIGN_SUBSET_MISSING: ${key(ref)}`);
  return signs;
}
function conditionFamily(ref: RegistryProjection): SubjectOutcomeFamily | undefined {
  return ref.version === 2 ? SUBJECT_OUTCOME_FAMILIES.find(family => ref.id === `derived.semantic_avoidance.${family}`) : undefined;
}
function buildRegistry(): readonly LongitudinalConstructor[] {
  return Object.freeze(CURRENT_REFS.map((projection): LongitudinalConstructor => {
    const signs = Object.freeze([...exactSigns(projection)]);
    if (PATH_IDS.includes(projection.id)) return Object.freeze({ projection, signs, kind: "path", adapter: "recorded_sequence", status: "deferred", owner: "longitudinal-store:A.2", reason: PATH_REASON });
    if (NATIVE_KEYS.has(key(projection))) return Object.freeze({ projection, signs, kind: "native", adapter: "native_subject_incidence" });
    const family = conditionFamily(projection);
    if (family !== undefined) {
      if (signs.length !== 1 || signs[0] !== "avoided") throw new TypeError("LONGITUDINAL_SOURCE_SIGN_MISMATCH");
      return Object.freeze({ projection, signs: Object.freeze(["avoided"] as const), kind: "population", adapter: "subject_relation_population",
        sourceScope: "complete_factory_result", family, relations: INTEGER_FAMILIES.has(family) ? INTEGER_SUBJECT_RELATIONS : BOOLEAN_SUBJECT_RELATIONS });
    }
    return Object.freeze({ projection, signs, kind: "edge", adapter: "local_semantic_event", meaning: "event_prevalence", visibility: "operator_only" });
  }));
}

/** Exact row/schema validation against current source declarations, not legacy base-sign joins. */
export function validateIngestRegistry(rows: readonly LongitudinalConstructor[]): void {
  const expected = buildRegistry(), expectedIds = CURRENT_REFS.map(ref => ref.id).sort(), ids = rows.map(row => row.projection.id);
  if (rows.length !== expected.length || new Set(ids).size !== rows.length || [...ids].sort().join("\0") !== expectedIds.join("\0")) throw new TypeError("LONGITUDINAL_REGISTRY_SET_MISMATCH");
  for (const [index, row] of rows.entries()) {
    const target = expected[index]!;
    if (row.projection.id !== target.projection.id) throw new TypeError("LONGITUDINAL_REGISTRY_ORDER_MISMATCH");
    if (row.projection.version !== target.projection.version) throw new TypeError("LONGITUDINAL_REGISTRY_VERSION_MISMATCH");
    if (row.signs.join("\0") !== target.signs.join("\0")) throw new TypeError("LONGITUDINAL_SIGN_SUBSET_MISMATCH");
    if (row.kind !== target.kind) throw new TypeError("LONGITUDINAL_REGISTRY_KIND_MISMATCH");
    if (row.adapter !== target.adapter) throw new TypeError("LONGITUDINAL_REGISTRY_ADAPTER_MISMATCH");
    if (canonicalizeJson(row as unknown as JsonValue) !== canonicalizeJson(target as unknown as JsonValue)) throw new TypeError("LONGITUDINAL_REGISTRY_CONTRACT_MISMATCH");
  }
}
export const LONGITUDINAL_INGEST_REGISTRY = buildRegistry();
validateIngestRegistry(LONGITUDINAL_INGEST_REGISTRY);
export function ingestRegistryDigest(rows: readonly LongitudinalConstructor[]): `sha256:${string}` {
  validateIngestRegistry(rows);
  return `sha256:${createHash("sha256").update(canonicalizeJson(rows as unknown as JsonValue)).digest("hex")}`;
}
export const LONGITUDINAL_REGISTRY_DIGEST = ingestRegistryDigest(LONGITUDINAL_INGEST_REGISTRY);

/** Old aggregate storage holds ONLY explicitly named operator event prevalence. Native and
 * condition metrics use the separate subject-row lane; no global absence identity remains. */
export interface AdmittedIdentity {
  readonly projectionId: string; readonly projectionVersion: 1 | 2;
  readonly semanticSign: SemanticEventSign; readonly sourceSign: SemanticEventSign;
  readonly kind: "edge"; readonly matchProjectionId: string; readonly matchProjectionVersion: 1 | 2; readonly matchSign: SemanticEventSign;
}
export const LONGITUDINAL_ADMITTED_IDENTITIES: readonly AdmittedIdentity[] = Object.freeze(
  LONGITUDINAL_INGEST_REGISTRY.flatMap((row): AdmittedIdentity[] => row.kind !== "edge" ? [] : row.signs.map(sign => Object.freeze({
    projectionId: row.projection.id, projectionVersion: row.projection.version, semanticSign: sign, sourceSign: sign,
    kind: "edge" as const, matchProjectionId: row.projection.id, matchProjectionVersion: row.projection.version, matchSign: sign,
  }))).sort((a, b) => identityKey(a) < identityKey(b) ? -1 : identityKey(a) > identityKey(b) ? 1 : 0),
);

export function identityKey(value: { readonly projectionId: string; readonly projectionVersion: number; readonly semanticSign: string; readonly sourceSign: string }): string {
  return `${value.projectionId}\0${value.projectionVersion}\0${value.semanticSign}\0${value.sourceSign}`;
}

const ADMITTED_BY_KEY = new Map(LONGITUDINAL_ADMITTED_IDENTITIES.map((identity) => [identityKey(identity), identity] as const));
const ADMITTED_PROJECTIONS = new Set(LONGITUDINAL_ADMITTED_IDENTITIES.map((identity) => `${identity.projectionId}@${identity.projectionVersion}`));

/** True only for a compiled `(id, version, semanticSign, sourceSign)` tuple; no caller operand widens it. */
export function isAdmittedIdentity(value: { readonly projectionId: string; readonly projectionVersion: number; readonly semanticSign: string; readonly sourceSign: string }): boolean {
  return ADMITTED_BY_KEY.has(identityKey(value));
}

/** Projection-level admission for query filters that may omit signs. Deferred paths stay unqueryable. */
export function isAdmittedProjection(id: string, version: number): boolean {
  return ADMITTED_PROJECTIONS.has(key({ id, version }));
}
