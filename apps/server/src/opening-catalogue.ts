import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { transposeKey } from "@chess-tabiya/runtime";

import {
  CHESS_OPENINGS_COMMIT,
  CHESS_OPENINGS_RETRIEVED_AT,
  normalizeOpeningPgn,
  parseRows,
} from "./sourcing/openings.js";

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
  | { readonly kind: "available"; readonly catalogue: CompiledOpeningCatalogue }
  | { readonly kind: "unavailable"; readonly reason: OpeningCatalogueUnavailableReason };

export interface OpeningCatalogueSourceInput { readonly name: OpeningCatalogueFileName; readonly bytes: Uint8Array }
export interface OpeningCatalogueCompilerInput { readonly path: string; readonly bytes: Uint8Array }

function sha256(value: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function lengthDelimitedDigest(files: readonly OpeningCatalogueCompilerInput[]): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort((left, right) => left.path.localeCompare(right.path))) {
    const path = Buffer.from(file.path, "utf8");
    const size = Buffer.allocUnsafe(8);
    size.writeBigUInt64BE(BigInt(path.byteLength));
    hash.update(size).update(path);
    size.writeBigUInt64BE(BigInt(file.bytes.byteLength));
    hash.update(size).update(file.bytes);
  }
  return `sha256:${hash.digest("hex")}`;
}

export function compileRuntimeOpeningCatalogue(
  sourceFiles: readonly OpeningCatalogueSourceInput[],
  compilerFiles: readonly OpeningCatalogueCompilerInput[],
): RuntimeOpeningCatalogue {
  const sourceByName = new Map(sourceFiles.map((file) => [file.name, file]));
  if (sourceByName.size !== OPENING_CATALOGUE_FILES.length || sourceFiles.length !== OPENING_CATALOGUE_FILES.length) {
    throw new TypeError("Opening catalogue compiler requires exactly a.tsv through e.tsv");
  }
  const declaredCompilerPaths = [...OPENING_CATALOGUE_COMPILER_FILES].sort();
  const actualCompilerPaths = compilerFiles.map((file) => file.path).sort();
  if (actualCompilerPaths.join("\0") !== declaredCompilerPaths.join("\0")) {
    throw new TypeError(`Opening catalogue compiler source closure mismatch: ${actualCompilerPaths.join(", ")}`);
  }

  const namedEndpoints: RuntimeOpeningCatalogue["namedEndpoints"][number][] = [];
  const membership = new Map<string, number>();
  const endpointKeys = new Set<string>();
  for (const fileName of OPENING_CATALOGUE_FILES) {
    const file = sourceByName.get(fileName);
    if (file === undefined) throw new TypeError(`Opening catalogue source is missing ${fileName}`);
    const rows = parseRows(Buffer.from(file.bytes).toString("utf8"));
    for (const [index, row] of rows.entries()) {
      const moves = normalizeOpeningPgn(row.pgn);
      const endpoint = transposeKey(moves.at(-1)!.fen);
      if (endpointKeys.has(endpoint)) throw new TypeError(`Duplicate named opening endpoint at ${fileName}:${index + 2}`);
      endpointKeys.add(endpoint);
      namedEndpoints.push(Object.freeze({ key: endpoint, eco: row.eco, name: row.name, sourcePly: moves.length, sourceFile: fileName, sourceRow: index + 2 }));
      for (const key of new Set(moves.map((move) => transposeKey(move.fen)))) membership.set(key, (membership.get(key) ?? 0) + 1);
    }
  }
  namedEndpoints.sort((left, right) => left.key.localeCompare(right.key));
  const pathMembership = [...membership].map(([key, descendantEndpointCount]) => Object.freeze({ key, descendantEndpointCount })).sort((left, right) => left.key.localeCompare(right.key));
  const source = Object.freeze({
    id: OPENING_SOURCE_ID,
    commit: CHESS_OPENINGS_COMMIT,
    retrievedAt: CHESS_OPENINGS_RETRIEVED_AT,
    licence: "CC0-1.0" as const,
    files: Object.freeze(OPENING_CATALOGUE_FILES.map((name) => {
      const bytes = sourceByName.get(name)!.bytes;
      return Object.freeze({ name, bytes: bytes.byteLength, sha256: sha256(bytes) });
    })),
    compilerFiles: Object.freeze([...compilerFiles].sort((left, right) => left.path.localeCompare(right.path)).map((file) => Object.freeze({ path: file.path, sha256: sha256(file.bytes) }))),
    compilerDigest: lengthDelimitedDigest(compilerFiles),
  });
  const withoutDigest = Object.freeze({ source, namedEndpoints: Object.freeze(namedEndpoints), pathMembership: Object.freeze(pathMembership) });
  return Object.freeze({ ...withoutDigest, digest: sha256(canonicalizeJson(withoutDigest)) });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).sort().join("\0") === [...keys].sort().join("\0");
}

export function compileLoadedOpeningCatalogue(value: unknown): CompiledOpeningCatalogue {
  if (!isRecord(value) || !hasExactKeys(value, ["source", "namedEndpoints", "pathMembership", "digest"]) || !isRecord(value.source) || !hasExactKeys(value.source, ["id", "commit", "retrievedAt", "licence", "files", "compilerFiles", "compilerDigest"]) || !Array.isArray(value.namedEndpoints) || !Array.isArray(value.pathMembership) || !Array.isArray(value.source.files) || !Array.isArray(value.source.compilerFiles) || typeof value.digest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value.digest) || typeof value.source.compilerDigest !== "string") throw new TypeError("Opening catalogue artifact shape is invalid");
  const { digest, ...withoutDigest } = value;
  if (sha256(canonicalizeJson(withoutDigest)) !== digest) throw new RangeError("Opening catalogue artifact digest does not match its bytes");
  if (value.source.id !== OPENING_SOURCE_ID || value.source.commit !== CHESS_OPENINGS_COMMIT || value.source.retrievedAt !== CHESS_OPENINGS_RETRIEVED_AT || value.source.licence !== "CC0-1.0") throw new TypeError("Opening catalogue source identity is invalid");
  if (value.source.files.length !== OPENING_CATALOGUE_FILES.length || value.source.files.some((item, index) => !isRecord(item) || !hasExactKeys(item, ["name", "bytes", "sha256"]) || item.name !== OPENING_CATALOGUE_FILES[index] || !Number.isSafeInteger(item.bytes) || Number(item.bytes) < 1 || typeof item.sha256 !== "string")) throw new TypeError("Opening catalogue source-file provenance is invalid");
  if (value.source.compilerFiles.length !== OPENING_CATALOGUE_COMPILER_FILES.length || value.source.compilerFiles.some((item, index) => !isRecord(item) || !hasExactKeys(item, ["path", "sha256"]) || item.path !== [...OPENING_CATALOGUE_COMPILER_FILES].sort()[index] || typeof item.sha256 !== "string")) throw new TypeError("Opening catalogue compiler provenance is invalid");
  const endpoints = new Map<string, RuntimeOpeningCatalogue["namedEndpoints"][number]>();
  for (const item of value.namedEndpoints) {
    if (!isRecord(item) || !hasExactKeys(item, ["key", "eco", "name", "sourcePly", "sourceFile", "sourceRow"]) || typeof item.key !== "string" || typeof item.eco !== "string" || typeof item.name !== "string" || !Number.isSafeInteger(item.sourcePly) || Number(item.sourcePly) < 1 || !(OPENING_CATALOGUE_FILES as readonly string[]).includes(String(item.sourceFile)) || !Number.isSafeInteger(item.sourceRow) || Number(item.sourceRow) < 2 || endpoints.has(item.key)) throw new TypeError("Opening catalogue endpoint is invalid");
    endpoints.set(item.key, item as unknown as RuntimeOpeningCatalogue["namedEndpoints"][number]);
  }
  const members = new Map<string, number>();
  for (const item of value.pathMembership) {
    if (!isRecord(item) || !hasExactKeys(item, ["key", "descendantEndpointCount"]) || typeof item.key !== "string" || !Number.isSafeInteger(item.descendantEndpointCount) || Number(item.descendantEndpointCount) < 1 || members.has(item.key)) throw new TypeError("Opening catalogue membership is invalid");
    members.set(item.key, Number(item.descendantEndpointCount));
  }
  if ([...endpoints.keys()].join("\0") !== [...endpoints.keys()].sort((left, right) => left.localeCompare(right)).join("\0") || [...members.keys()].join("\0") !== [...members.keys()].sort((left, right) => left.localeCompare(right)).join("\0")) throw new TypeError("Opening catalogue tables are not canonically sorted");
  const artifact = value as unknown as RuntimeOpeningCatalogue;
  const catalogueRef = Object.freeze({ sourceId: OPENING_SOURCE_ID, commit: CHESS_OPENINGS_COMMIT, artifactDigest: digest });
  const observed = (ply: number): void => { if (!Number.isSafeInteger(ply) || ply < 0) throw new TypeError("observedPly must be a non-negative safe integer"); };
  const currentEndpointFor = (positionKey: string, observedPly: number): CurrentOpeningEndpoint => {
    const found = endpoints.get(positionKey);
    return found === undefined
      ? Object.freeze({ kind: "absent", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint, positionKey, observedPly, reason: "no_named_endpoint", catalogue: catalogueRef })
      : Object.freeze({ kind: "matched", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint, positionKey, observedPly, eco: found.eco, name: found.name, sourcePly: found.sourcePly, catalogue: catalogueRef });
  };
  const catalogueMembershipFor = (positionKey: string, observedPly: number): OpeningCatalogueMembership => {
    const count = members.get(positionKey);
    return count === undefined
      ? Object.freeze({ kind: "absent", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership, positionKey, observedPly, reason: "no_catalogue_path", catalogue: catalogueRef })
      : Object.freeze({ kind: "member", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership, positionKey, observedPly, descendantEndpointCount: count, catalogue: catalogueRef });
  };
  return Object.freeze({
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
}

export async function loadOpeningCatalogue(path: string): Promise<OpeningCatalogueAvailability> {
  let text: string;
  try { text = await readFile(path, "utf8"); }
  catch { return Object.freeze({ kind: "unavailable", reason: "artifact_missing" }); }
  let value: unknown;
  try { value = JSON.parse(text) as unknown; }
  catch { return Object.freeze({ kind: "unavailable", reason: "artifact_invalid" }); }
  try { return Object.freeze({ kind: "available", catalogue: compileLoadedOpeningCatalogue(value) }); }
  catch (error) { return Object.freeze({ kind: "unavailable", reason: error instanceof RangeError ? "digest_mismatch" : "artifact_invalid" }); }
}

export function openingIdentityAt(availability: OpeningCatalogueAvailability, fen: string, observedPly: number): { readonly currentEndpoint: CurrentOpeningEndpoint; readonly catalogueMembership: OpeningCatalogueMembership } {
  if (!Number.isSafeInteger(observedPly) || observedPly < 0) throw new TypeError("ply must be a non-negative safe integer");
  transposeKey(fen);
  if (availability.kind === "unavailable") return Object.freeze({
    currentEndpoint: Object.freeze({ kind: "abstained", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.currentEndpoint, reason: availability.reason }),
    catalogueMembership: Object.freeze({ kind: "abstained", projectionId: OPENING_CATALOGUE_PROJECTION_IDS.catalogueMembership, reason: availability.reason }),
  });
  return availability.catalogue.openingIdentity(fen, observedPly);
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
