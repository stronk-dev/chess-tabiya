/** Installed catalogue: pure document ownership and paired lookup; no file I/O or Node imports. */
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { OPENING_CATALOGUE_SCHEMA_VERSION } from "@chess-tabiya/schema";
import { assertOpeningCatalogueDocument } from "@chess-tabiya/schema/opening-catalogue";
import { sha256Hex } from "./assistance-exchange-digest.js";
import { transposeKey } from "./chess.js";
import registration from "./opening-catalogue-registration.json";

export const CHESS_OPENINGS_COMMIT = "4b8622759e7ae6f93f011cc6c83a3823401ab45e";
export const CHESS_OPENINGS_RETRIEVED_AT = "2026-08-04T00:00:00.000Z";

export const OPENING_SOURCE_ID = "lichess-chess-openings" as const;
export const OPENING_CATALOGUE_PROJECTION_IDS = Object.freeze({
  currentEndpoint: "theory.opening.current_endpoint@1",
  catalogueMembership: "theory.opening.catalogue_membership@1",
  deepestReached: "derived.opening.deepest_reached@1",
  recordedPosition: "run.record.position@1",
} as const);
export const OPENING_CATALOGUE_FILES = Object.freeze(["a.tsv", "b.tsv", "c.tsv", "d.tsv", "e.tsv"] as const);
export const OPENING_CATALOGUE_COMPILER_FILES = Object.freeze([
  "apps/server/src/opening-catalogue-build.ts",
  "apps/server/src/opening-catalogue.ts",
  "apps/server/src/sourcing/openings.ts",
  "packages/runtime/src/chess.ts",
  "packages/runtime/src/opening-catalogue.ts",
  "packages/runtime/src/assistance-exchange-digest.ts",
  "packages/schema/src/opening-catalogue.ts",
  "schemas/opening_catalogue.schema.json",
  "packages/schema/src/drill-pack/digest.ts",
] as const);

export type OpeningCatalogueFileName = (typeof OPENING_CATALOGUE_FILES)[number];
export type OpeningCatalogueUnavailableReason = "artifact_missing" | "artifact_invalid" | "digest_mismatch";

export interface RuntimeOpeningCatalogue {
  readonly source: {
    readonly id: typeof OPENING_SOURCE_ID;
    readonly commit: typeof CHESS_OPENINGS_COMMIT;
    readonly retrievedAt: typeof CHESS_OPENINGS_RETRIEVED_AT;
    readonly licence: "CC0-1.0";
    readonly files: readonly { readonly name: OpeningCatalogueFileName; readonly bytes: number; readonly sha256: string }[];
    readonly compilerFiles: readonly { readonly path: string; readonly sha256: string }[];
    readonly compilerDigest: string;
  };
  readonly namedEndpoints: readonly {
    readonly key: string;
    readonly eco: string;
    readonly name: string;
    readonly sourcePly: number;
    readonly sourceFile: string;
    readonly sourceRow: number;
  }[];
  readonly pathMembership: readonly { readonly key: string; readonly descendantEndpointCount: number }[];
  readonly digest: string;
}

export interface OpeningCatalogueRef {
  readonly sourceId: typeof OPENING_SOURCE_ID;
  readonly commit: typeof CHESS_OPENINGS_COMMIT;
  readonly artifactDigest: string;
}

export interface OpeningCatalogueUnavailable {
  readonly kind: "abstained";
  readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint | typeof OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership;
  readonly reason: OpeningCatalogueUnavailableReason;
}

export type CurrentOpeningEndpoint =
  | { readonly kind: "matched"; readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint; readonly positionKey: string; readonly observedPly: number; readonly eco: string; readonly name: string; readonly sourcePly: number; readonly catalogue: OpeningCatalogueRef }
  | { readonly kind: "absent"; readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint; readonly positionKey: string; readonly observedPly: number; readonly reason: "no_named_endpoint"; readonly catalogue: OpeningCatalogueRef }
  | OpeningCatalogueUnavailable;

export type OpeningCatalogueMembership =
  | { readonly kind: "member"; readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership; readonly positionKey: string; readonly observedPly: number; readonly descendantEndpointCount: number; readonly catalogue: OpeningCatalogueRef }
  | { readonly kind: "absent"; readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership; readonly positionKey: string; readonly observedPly: number; readonly reason: "no_catalogue_path"; readonly catalogue: OpeningCatalogueRef }
  | OpeningCatalogueUnavailable;

export interface RecordedPosition {
  readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.recordedPosition;
  readonly nodeId: string;
  readonly ply: number;
  readonly fen: string;
}

type MatchedEndpoint = Extract<CurrentOpeningEndpoint, { readonly kind: "matched" }>;
export type DeepestOpeningReached =
  | { readonly kind: "matched"; readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.deepestReached; readonly deepest: MatchedEndpoint; readonly visits: readonly { readonly nodeId: string; readonly ply: number; readonly endpoint: MatchedEndpoint }[]; readonly catalogue: OpeningCatalogueRef }
  | { readonly kind: "absent"; readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.deepestReached; readonly reason: "no_named_endpoint_reached"; readonly catalogue: OpeningCatalogueRef }
  | { readonly kind: "abstained"; readonly projectionId: typeof OPENING_CATALOGUE_PROJECTION_IDS.deepestReached; readonly reason: "input_abstained" };

export interface CompiledOpeningCatalogue {
  readonly artifact: RuntimeOpeningCatalogue;
  readonly ref: OpeningCatalogueRef;
  openingIdentity(fen: string, observedPly: number): { readonly currentEndpoint: CurrentOpeningEndpoint; readonly catalogueMembership: OpeningCatalogueMembership };
  currentEndpoint(fen: string, observedPly: number): CurrentOpeningEndpoint;
  catalogueMembership(fen: string, observedPly: number): OpeningCatalogueMembership;
}

export type OpeningCatalogueAvailability =
  | { readonly kind: "available"; readonly catalogue: CompiledOpeningCatalogue; readonly source: InstalledOpeningCatalogue }
  | { readonly kind: "unavailable"; readonly reason: OpeningCatalogueUnavailableReason };

declare const installedOpeningBrand: unique symbol;
/** The only public data is the installed reference; the maps remain privately owned. */
export interface InstalledOpeningCatalogue {
  readonly [installedOpeningBrand]: true;
  readonly ref: OpeningCatalogueRef;
}
const installedSources = new WeakMap<object, CompiledOpeningCatalogue>();
// The original frozen rows behind the compiled lookup, not a second table/index.
const compiledRows = new WeakMap<CompiledOpeningCatalogue, Readonly<{
  endpoints: ReadonlyMap<string, RuntimeOpeningCatalogue["namedEndpoints"][number]>;
  members: ReadonlyMap<string, RuntimeOpeningCatalogue["pathMembership"][number]>;
}>>();
class OpeningCatalogueDigestMismatch extends RangeError {}

export interface OpeningCatalogueSourceInput { readonly name: OpeningCatalogueFileName; readonly bytes: Uint8Array }
export interface OpeningCatalogueCompilerInput { readonly path: string; readonly bytes: Uint8Array }

function sha256(value: string): string { return `sha256:${sha256Hex(value)}`; }

/** Reject non-JSON authority before structuredClone can invoke an accessor or erase extra keys. */
function assertDataDocument(value: unknown, active = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value !== "object" || active.has(value)) throw new TypeError("Opening catalogue requires an acyclic JSON data document");
  const array = Array.isArray(value), prototype = Object.getPrototypeOf(value);
  if (prototype !== (array ? Array.prototype : Object.prototype) && prototype !== null) throw new TypeError("Opening catalogue requires plain JSON data");
  active.add(value);
  if (array && Object.keys(value).length !== value.length) throw new TypeError("Opening catalogue refuses sparse or decorated arrays");
  for (const key of Reflect.ownKeys(value)) {
    if (array && key === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== "string" || !descriptor.enumerable || !("value" in descriptor)
      || array && !/^(?:0|[1-9][0-9]*)$/u.test(key)) throw new TypeError("Opening catalogue refuses accessors or extra non-data fields");
    assertDataDocument(descriptor.value, active);
  }
  active.delete(value);
}

export function compileLoadedOpeningCatalogue(input: unknown): CompiledOpeningCatalogue {
  // A validated caller-owned row is not durable authority: the caller could mutate it later.
  // Take ownership before validation, then freeze every artifact layer before exposing the maps.
  assertDataDocument(input);
  const value = structuredClone(input) as RuntimeOpeningCatalogue;
  assertOpeningCatalogueDocument(value);
  if (value.source.files.some((item, index) => item.name !== OPENING_CATALOGUE_FILES[index])) throw new TypeError("Opening catalogue source-file order is invalid");
  if (value.source.compilerFiles.length !== OPENING_CATALOGUE_COMPILER_FILES.length || value.source.compilerFiles.some((item, index) => item.path !== [...OPENING_CATALOGUE_COMPILER_FILES].sort()[index])) throw new TypeError("Opening catalogue compiler inventory is invalid");
  const endpoints = new Map<string, RuntimeOpeningCatalogue["namedEndpoints"][number]>();
  for (const item of value.namedEndpoints) {
    if (endpoints.has(item.key)) throw new TypeError("Opening catalogue endpoint key is duplicated");
    endpoints.set(item.key, item);
  }
  const members = new Map<string, RuntimeOpeningCatalogue["pathMembership"][number]>();
  for (const item of value.pathMembership) {
    if (item.key.split(" ").length !== 4 || transposeKey(`${item.key} 0 1`) !== item.key) throw new TypeError("Opening catalogue membership key is not a canonical position key");
    if (members.has(item.key)) throw new TypeError("Opening catalogue membership key is duplicated");
    members.set(item.key, item);
  }
  if ([...endpoints.keys()].join("\0") !== [...endpoints.keys()].sort((left, right) => left.localeCompare(right)).join("\0") || [...members.keys()].join("\0") !== [...members.keys()].sort((left, right) => left.localeCompare(right)).join("\0")) throw new TypeError("Opening catalogue tables are not canonically sorted");
  if ([...endpoints.keys()].some(key => !members.has(key))) throw new TypeError("Opening catalogue endpoint is not a path member");
  // Only a completely valid document can have a digest mismatch; malformed relationships are
  // artifact_invalid even when their supplied digest is stale. Endpoint keys are validated by
  // their exact membership join, so the same position never needs parsing twice during load.
  const { digest, ...withoutDigest } = value;
  if (sha256(canonicalizeJson(withoutDigest)) !== digest) throw new OpeningCatalogueDigestMismatch("Opening catalogue artifact digest does not match its bytes");
  const artifact = value;
  for (const row of artifact.namedEndpoints) Object.freeze(row);
  for (const row of artifact.pathMembership) Object.freeze(row);
  for (const row of artifact.source.files) Object.freeze(row);
  for (const row of artifact.source.compilerFiles) Object.freeze(row);
  Object.freeze(artifact.namedEndpoints);
  Object.freeze(artifact.pathMembership);
  Object.freeze(artifact.source.files);
  Object.freeze(artifact.source.compilerFiles);
  Object.freeze(artifact.source);
  Object.freeze(artifact);
  const catalogueRef = Object.freeze({ sourceId: OPENING_SOURCE_ID, commit: CHESS_OPENINGS_COMMIT, artifactDigest: digest });
  const observed = (ply: number): void => { if (!Number.isSafeInteger(ply) || ply < 0) throw new TypeError("observedPly must be a non-negative safe integer"); };
  const currentEndpointFor = (positionKey: string, observedPly: number): CurrentOpeningEndpoint => {
    const found = endpoints.get(positionKey);
    return found === undefined
      ? Object.freeze({ kind: "absent", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint, positionKey, observedPly, reason: "no_named_endpoint", catalogue: catalogueRef })
      : Object.freeze({ kind: "matched", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint, positionKey, observedPly, eco: found.eco, name: found.name, sourcePly: found.sourcePly, catalogue: catalogueRef });
  };
  const catalogueMembershipFor = (positionKey: string, observedPly: number): OpeningCatalogueMembership => {
    const found = members.get(positionKey);
    return found === undefined
      ? Object.freeze({ kind: "absent", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership, positionKey, observedPly, reason: "no_catalogue_path", catalogue: catalogueRef })
      : Object.freeze({ kind: "member", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership, positionKey, observedPly, descendantEndpointCount: found.descendantEndpointCount, catalogue: catalogueRef });
  };
  const compiled: CompiledOpeningCatalogue = Object.freeze({
    artifact,
    ref: catalogueRef,
    openingIdentity(fen: string, observedPly: number) {
      observed(observedPly);
      const positionKey = transposeKey(fen);
      return Object.freeze({
        currentEndpoint: currentEndpointFor(positionKey, observedPly),
        catalogueMembership: catalogueMembershipFor(positionKey, observedPly),
      });
    },
    currentEndpoint(fen: string, observedPly: number): CurrentOpeningEndpoint {
      observed(observedPly);
      const positionKey = transposeKey(fen);
      return currentEndpointFor(positionKey, observedPly);
    },
    catalogueMembership(fen: string, observedPly: number): OpeningCatalogueMembership {
      observed(observedPly);
      const positionKey = transposeKey(fen);
      return catalogueMembershipFor(positionKey, observedPly);
    },
  });
  compiledRows.set(compiled, Object.freeze({ endpoints, members }));
  return compiled;
}

/** Installed admission, never a caller-selected expected digest or registration. */
export function admitInstalledOpeningCatalogue(artifact?: unknown): OpeningCatalogueAvailability {
  if (arguments.length > 1) throw new TypeError("Opening catalogue admission accepts only the artifact");
  if (artifact === undefined) return Object.freeze({ kind: "unavailable", reason: "artifact_missing" });
  try {
    const catalogue = compileLoadedOpeningCatalogue(artifact);
    if (registration.schemaVersion !== OPENING_CATALOGUE_SCHEMA_VERSION || registration.sourceId !== OPENING_SOURCE_ID
      || registration.commit !== CHESS_OPENINGS_COMMIT || registration.retrievedAt !== CHESS_OPENINGS_RETRIEVED_AT
      || registration.artifactDigest !== catalogue.artifact.digest) throw new OpeningCatalogueDigestMismatch("Opening catalogue differs from the installed registration");
    const source = Object.freeze({ ref: catalogue.ref }) as InstalledOpeningCatalogue;
    installedSources.set(source, catalogue);
    return Object.freeze({ kind: "available", catalogue, source });
  } catch (error) {
    return Object.freeze({ kind: "unavailable", reason: error instanceof OpeningCatalogueDigestMismatch ? "digest_mismatch" : "artifact_invalid" });
  }
}

/** Internal lookup owner; a structural compile is deliberately not installed source authority. */
export function readInstalledOpeningCatalogue(source: InstalledOpeningCatalogue): CompiledOpeningCatalogue {
  const catalogue = source !== null && typeof source === "object" ? installedSources.get(source) : undefined;
  if (catalogue === undefined) throw new TypeError("Opening catalogue source was not admitted by the runtime");
  return catalogue;
}

export function isInstalledOpeningCatalogue(source: unknown): source is InstalledOpeningCatalogue {
  return source !== null && typeof source === "object" && installedSources.has(source);
}

/** Internal original-row lookup. One paired calculation/normalization, no caller rows/callback. */
export function readInstalledOpeningLookup(source: InstalledOpeningCatalogue, fen: string, observedPly: number) {
  const catalogue = readInstalledOpeningCatalogue(source), rows = compiledRows.get(catalogue)!;
  const result = catalogue.openingIdentity(fen, observedPly);
  if (result.currentEndpoint.kind === "abstained" || result.catalogueMembership.kind === "abstained") throw new TypeError("Installed opening lookup unexpectedly abstained");
  const key = result.currentEndpoint.positionKey;
  return Object.freeze({ catalogue, result, endpointRow: rows.endpoints.get(key) ?? null, membershipRow: rows.members.get(key) ?? null });
}

export function openingIdentityAt(availability: OpeningCatalogueAvailability, fen: string, observedPly: number): { readonly currentEndpoint: CurrentOpeningEndpoint; readonly catalogueMembership: OpeningCatalogueMembership } {
  if (!Number.isSafeInteger(observedPly) || observedPly < 0) throw new TypeError("ply must be a non-negative safe integer");
  if (availability.kind === "unavailable") {
    transposeKey(fen);
    return Object.freeze({
      currentEndpoint: Object.freeze({ kind: "abstained", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint, reason: availability.reason }),
      catalogueMembership: Object.freeze({ kind: "abstained", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership, reason: availability.reason }),
    });
  }
  return readInstalledOpeningLookup(availability.source, fen, observedPly).result;
}

export function recordedOpeningPosition(nodeId: string, ply: number, fen: string): RecordedPosition {
  if (nodeId.trim() === "") throw new TypeError("nodeId must be non-empty");
  if (!Number.isSafeInteger(ply) || ply < 0) throw new TypeError("ply must be a non-negative safe integer");
  transposeKey(fen);
  return Object.freeze({ projectionId: OPENING_CATALOGUE_PROJECTION_IDS.recordedPosition, nodeId, ply, fen });
}

export function deepestOpeningReached(availability: OpeningCatalogueAvailability, history: readonly RecordedPosition[]): DeepestOpeningReached {
  if (availability.kind === "unavailable") return Object.freeze({ kind: "abstained", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.deepestReached, reason: "input_abstained" });
  const visits = history.flatMap((position) => {
    const endpoint = availability.catalogue.currentEndpoint(position.fen, position.ply);
    return endpoint.kind === "matched" ? [Object.freeze({ nodeId: position.nodeId, ply: position.ply, endpoint })] : [];
  });
  return deriveDeepestOpeningVisits(visits, availability.catalogue.ref);
}

export function deriveDeepestOpeningVisits(
  input: readonly { readonly nodeId: string; readonly ply: number; readonly endpoint: MatchedEndpoint }[],
  catalogue: OpeningCatalogueRef,
): DeepestOpeningReached {
  const visits = [...input].sort((left, right) => left.ply - right.ply || left.nodeId.localeCompare(right.nodeId));
  if (visits.length === 0) return Object.freeze({ kind: "absent", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.deepestReached, reason: "no_named_endpoint_reached", catalogue });
  const deepest = [...visits].sort((left, right) => right.ply - left.ply || left.nodeId.localeCompare(right.nodeId))[0]!;
  if (visits.some((visit) => visit.endpoint.catalogue.artifactDigest !== catalogue.artifactDigest || visit.endpoint.catalogue.commit !== catalogue.commit || visit.endpoint.catalogue.sourceId !== catalogue.sourceId)) throw new TypeError("Opening history mixes catalogue artifact identities");
  return Object.freeze({ kind: "matched", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.deepestReached, deepest: deepest.endpoint, visits: Object.freeze(visits), catalogue });
}

export function renderCurrentOpeningEndpoint(value: CurrentOpeningEndpoint, inspector = false): string | undefined {
  if (value.kind === "matched") return `Current position: ${value.eco} ${value.name}. Source: Lichess chess-openings ${CHESS_OPENINGS_COMMIT.slice(0, 7)}.`;
  if (value.kind === "absent" && inspector) return "No exact named endpoint for this position in the installed catalogue.";
  return undefined;
}

export function renderOpeningMembership(value: OpeningCatalogueMembership): string | undefined {
  return value.kind === "member" ? `This position occurs on ${value.descendantEndpointCount} named catalogue path${value.descendantEndpointCount === 1 ? "" : "s"}.` : undefined;
}

export function renderDeepestOpeningReached(value: DeepestOpeningReached): string | undefined {
  return value.kind === "matched" ? `Deepest named opening reached: ${value.deepest.eco} ${value.deepest.name} at ply ${value.deepest.observedPly}. Source: Lichess chess-openings ${CHESS_OPENINGS_COMMIT.slice(0, 7)}.` : undefined;
}
