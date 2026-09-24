// rfc/longitudinal-store.md §A — the closed constructor registry (the sole admission authority).
//
// The literal authorities are rfc/contracts/longitudinal-ingest-registry-v1.json (67 rows:
// 46 edge / 13 population / 8 deferred path) and rfc/contracts/longitudinal-sign-subsets-v1.json.
// This module rebuilds the same registry from the compiled runtime catalogue and refuses to load if
// the two disagree; longitudinal-store.test.ts compares it row-for-row to both artifacts at their
// pinned raw-byte digests.
//
// Revision-1 scope (2026-09-24 implementation correction): the registry is set-equal to the exact
// **version-1** semantic-event refs. The recorded-semantic-path v2 successors ([[D1933]]) landed
// after the RFC's registry and are outside revision 1; admitting any of them is a derivation-revision
// bump owned by a later accepted RFC (§E.3).
import { createHash } from "node:crypto";

import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  SEMANTIC_EVENT_DECLARATIONS,
  SEMANTIC_EVENT_PROJECTION_REFS,
  TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS,
  type SemanticEventSign,
} from "@chess-tabiya/runtime";
import { canonicalizeJson, type JsonValue } from "@chess-tabiya/schema/drill-pack";

/** The one derivation revision. Any accepted RFC changing an admitted adapter/member owns the bump. */
export const OBSERVATION_DERIVATION_REV = 1 as const;

export const LONGITUDINAL_SEMANTIC_SIGNS = Object.freeze([
  "state", "gained", "lost", "preserved", "removed", "avoided", "enabled", "threatened",
] as const satisfies readonly SemanticEventSign[]);

const PATH_IDS: readonly string[] = Object.freeze([
  "derived.exchange.trade_completed",
  "derived.tactic.deflection_observed",
  "derived.tactic.attraction_observed",
  "derived.tactic.line_blocker_clearance_observed",
  "derived.tactic.square_clearance_observed",
  "derived.tactic.interference_observed",
  "derived.tactic.check_zwischenzug_observed",
  "derived.tactic.overload_exploitation_observed",
]);
const PATH_REASON = "No complete counterfactual path population exists at revision 1.";
const POPULATION_IDS: readonly string[] = Object.freeze([...AVOIDANCE_EVENT_PROJECTION_IDS, ...TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS]);

export interface RegistryProjection { readonly id: string; readonly version: 1 }

export type LongitudinalConstructor =
  | { readonly projection: RegistryProjection; readonly signs: readonly SemanticEventSign[]; readonly kind: "edge"; readonly adapter: "local_semantic_event" }
  | {
    readonly projection: RegistryProjection; readonly signs: readonly ["avoided"]; readonly kind: "population";
    readonly adapter: "complete_candidate_relation"; readonly baseProjection: RegistryProjection;
    readonly baseSigns: readonly SemanticEventSign[];
  }
  | {
    readonly projection: RegistryProjection; readonly signs: readonly SemanticEventSign[]; readonly kind: "path";
    readonly adapter: "recorded_sequence"; readonly status: "deferred"; readonly reason: string;
  };

export type AdmittedConstructor = Exclude<LongitudinalConstructor, { readonly kind: "path" }>;

const V1_REFS = Object.freeze(SEMANTIC_EVENT_PROJECTION_REFS.filter((ref) => ref.version === 1));
const signsByProjection = new Map(
  SEMANTIC_EVENT_DECLARATIONS.filter((row) => row.projection.version === 1)
    .map((row) => [row.projection.id, row.allowedSigns as readonly SemanticEventSign[]] as const),
);

function exactSigns(id: string): readonly SemanticEventSign[] {
  const signs = signsByProjection.get(id);
  if (signs === undefined || signs.length === 0) throw new TypeError(`LONGITUDINAL_SIGN_SUBSET_MISSING: ${id}`);
  return signs;
}

export function expectedAvoidanceBase(id: string): string {
  const suffix = id.slice("derived.semantic_avoidance.".length);
  return suffix === "loose_piece" ? "rules.tactic.event.loose_piece" : `rules.structural.event.${suffix}`;
}

function buildRegistry(): readonly LongitudinalConstructor[] {
  return Object.freeze(V1_REFS.map((ref): LongitudinalConstructor => {
    const projection = Object.freeze({ id: ref.id, version: 1 as const });
    const signs = Object.freeze([...exactSigns(ref.id)]);
    if (PATH_IDS.includes(ref.id)) {
      return Object.freeze({ projection, signs, kind: "path", adapter: "recorded_sequence", status: "deferred", reason: PATH_REASON });
    }
    if (POPULATION_IDS.includes(ref.id)) {
      const baseProjection = Object.freeze({ id: expectedAvoidanceBase(ref.id), version: 1 as const });
      return Object.freeze({
        projection, signs: signs as unknown as readonly ["avoided"], kind: "population", adapter: "complete_candidate_relation",
        baseProjection, baseSigns: Object.freeze([...exactSigns(baseProjection.id)]),
      });
    }
    return Object.freeze({ projection, signs, kind: "edge", adapter: "local_semantic_event" });
  }));
}

/** Validates a candidate registry against the compiled runtime catalogue; exported for mutation fixtures. */
export function validateIngestRegistry(rows: readonly LongitudinalConstructor[]): void {
  const expected = V1_REFS.map((ref) => ref.id).sort();
  const ids = rows.map((row) => row.projection.id);
  if (new Set(ids).size !== rows.length || [...ids].sort().join("\0") !== expected.join("\0")) {
    throw new TypeError("LONGITUDINAL_REGISTRY_SET_MISMATCH");
  }
  for (const row of rows) {
    if (row.projection.version !== 1) throw new TypeError("LONGITUDINAL_REGISTRY_VERSION_MISMATCH");
    if (row.signs.length === 0 || row.signs.join("\0") !== exactSigns(row.projection.id).join("\0")) {
      throw new TypeError("LONGITUDINAL_SIGN_SUBSET_MISMATCH");
    }
    const expectedKind = PATH_IDS.includes(row.projection.id) ? "path" : POPULATION_IDS.includes(row.projection.id) ? "population" : "edge";
    if (row.kind !== expectedKind) throw new TypeError("LONGITUDINAL_REGISTRY_KIND_MISMATCH");
    if (row.kind === "edge" && row.adapter !== "local_semantic_event") throw new TypeError("LONGITUDINAL_REGISTRY_ADAPTER_MISMATCH");
    if (row.kind === "population") {
      if (row.adapter !== "complete_candidate_relation" || row.signs.join("\0") !== "avoided") throw new TypeError("LONGITUDINAL_REGISTRY_ADAPTER_MISMATCH");
      if (row.baseProjection.id !== expectedAvoidanceBase(row.projection.id) || row.baseProjection.version !== 1) {
        throw new TypeError("LONGITUDINAL_POPULATION_BASE_MISMATCH");
      }
      if (row.baseSigns.join("\0") !== exactSigns(row.baseProjection.id).join("\0")) throw new TypeError("LONGITUDINAL_BASE_SIGN_SUBSET_MISMATCH");
    }
    if (row.kind === "path" && (row.adapter !== "recorded_sequence" || row.status !== "deferred" || row.reason.trim() === "")) {
      throw new TypeError("LONGITUDINAL_PATH_REASON_MISSING");
    }
  }
}

export const LONGITUDINAL_INGEST_REGISTRY: readonly LongitudinalConstructor[] = (() => {
  const rows = buildRegistry();
  validateIngestRegistry(rows);
  return rows;
})();

export function ingestRegistryDigest(rows: readonly LongitudinalConstructor[]): `sha256:${string}` {
  validateIngestRegistry(rows);
  return `sha256:${createHash("sha256").update(canonicalizeJson(rows as unknown as JsonValue)).digest("hex")}`;
}

/**
 * §D revision pair, digest 2: the canonical constructor registry. A zero-incidence registry change
 * moves this literal; longitudinal-store.test.ts fails until an accepted RFC owns the revision bump.
 */
export const LONGITUDINAL_REGISTRY_DIGEST = "sha256:b40ab302bd081fc90b6a1e0d4746f27bec64d5d76c52b0fc67febd097b39ff74";

/** One admitted, persistable identity: `(projection id, version, semantic sign, source sign)`. */
export interface AdmittedIdentity {
  readonly projectionId: string;
  readonly projectionVersion: 1;
  readonly semanticSign: SemanticEventSign;
  readonly sourceSign: SemanticEventSign;
  readonly kind: "edge" | "population";
  /** The projection/sign pair whose exhibition on an edge defines membership. */
  readonly matchProjectionId: string;
  readonly matchSign: SemanticEventSign;
}

export const LONGITUDINAL_ADMITTED_IDENTITIES: readonly AdmittedIdentity[] = Object.freeze(
  LONGITUDINAL_INGEST_REGISTRY.flatMap((row): AdmittedIdentity[] => {
    if (row.kind === "path") return [];
    if (row.kind === "edge") {
      return row.signs.map((sign) => Object.freeze({
        projectionId: row.projection.id, projectionVersion: 1 as const, semanticSign: sign, sourceSign: sign,
        kind: "edge" as const, matchProjectionId: row.projection.id, matchSign: sign,
      }));
    }
    return row.baseSigns.map((sign) => Object.freeze({
      projectionId: row.projection.id, projectionVersion: 1 as const, semanticSign: "avoided" as const, sourceSign: sign,
      kind: "population" as const, matchProjectionId: row.baseProjection.id, matchSign: sign,
    }));
  }).sort((left, right) => identityKey(left) < identityKey(right) ? -1 : identityKey(left) > identityKey(right) ? 1 : 0),
);

export function identityKey(value: { readonly projectionId: string; readonly projectionVersion: number; readonly semanticSign: string; readonly sourceSign: string }): string {
  return `${value.projectionId}\0${value.projectionVersion}\0${value.semanticSign}\0${value.sourceSign}`;
}

const ADMITTED_BY_KEY = new Map(LONGITUDINAL_ADMITTED_IDENTITIES.map((identity) => [identityKey(identity), identity] as const));
const ADMITTED_PROJECTIONS = new Set(LONGITUDINAL_ADMITTED_IDENTITIES.map((identity) => identity.projectionId));

/** True only for a compiled `(id, version, semanticSign, sourceSign)` tuple; no caller operand widens it. */
export function isAdmittedIdentity(value: { readonly projectionId: string; readonly projectionVersion: number; readonly semanticSign: string; readonly sourceSign: string }): boolean {
  return ADMITTED_BY_KEY.has(identityKey(value));
}

/** Projection-level admission for query filters that may omit signs. Deferred paths stay unqueryable. */
export function isAdmittedProjection(id: string, version: number): boolean {
  return version === 1 && ADMITTED_PROJECTIONS.has(id);
}
