import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";
import {
  parseLongitudinalObservationRow as parseObservationWithRegistry,
  parseLongitudinalReadQuery as parseQueryWithRegistry,
  type LongitudinalObservationRow,
  type ParsedLongitudinalReadQuery,
  type ProjectionAdmission,
  type SemanticSign,
  type StructureAttributionV2,
} from "../d2570-longitudinal-sixth-author-repair/contract.js";

type UnknownRecord = Readonly<Record<string, unknown>>;

function fail(code: string): never {
  throw new TypeError(code);
}

function record(value: unknown, code: string): UnknownRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code);
  return value as UnknownRecord;
}

function exactKeys(value: UnknownRecord, keys: readonly string[], code: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}

function nonEmpty(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length === 0) fail(code);
  return value;
}

function integer(value: unknown, minimum: number, code: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) fail(code);
  return Number(value);
}

function deepFreezeCopy<T>(value: T): T {
  if (Array.isArray(value)) return Object.freeze(value.map(deepFreezeCopy)) as T;
  if (value !== null && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, member]) => [key, deepFreezeCopy(member)]))) as T;
  }
  return value;
}

type IngestRow = Readonly<{
  projection: Readonly<{ id: string; version: number }>;
  kind: "edge" | "population" | "path";
  adapter: string;
  baseProjection?: Readonly<{ id: string; version: number }>;
}>;

const ingestRows = JSON.parse(readFileSync("rfc/contracts/longitudinal-ingest-registry-v1.json", "utf8")) as IngestRow[];
const signSubsets = JSON.parse(readFileSync("rfc/contracts/longitudinal-sign-subsets-v1.json", "utf8")) as Record<string, SemanticSign[]>;

function compileAdmissions(): readonly ProjectionAdmission[] {
  const admissions = ingestRows.flatMap((row): ProjectionAdmission[] => {
    if (row.kind === "path") return [];
    const semanticSigns = signSubsets[row.projection.id];
    if (!Array.isArray(semanticSigns) || semanticSigns.length === 0) fail("LONGITUDINAL_LITERAL_REGISTRY_INVALID");
    const sourceSigns = row.kind === "population"
      ? signSubsets[row.baseProjection?.id ?? ""]
      : semanticSigns;
    if (!Array.isArray(sourceSigns) || sourceSigns.length === 0) fail("LONGITUDINAL_LITERAL_REGISTRY_INVALID");
    const pairs = row.kind === "population"
      ? sourceSigns.map((sourceSign) => ({ semanticSign: "avoided" as const, sourceSign }))
      : semanticSigns.map((sign) => ({ semanticSign: sign, sourceSign: sign }));
    return [{ id: row.projection.id, version: row.projection.version, pairs: deepFreezeCopy(pairs) }];
  });
  const keys = admissions.map((row) => `${row.id}@${row.version}`);
  if (ingestRows.length !== 67 || new Set(keys).size !== keys.length) fail("LONGITUDINAL_LITERAL_REGISTRY_INVALID");
  return deepFreezeCopy(admissions);
}

export const LONGITUDINAL_PROJECTION_ADMISSIONS = compileAdmissions();

export function parseLongitudinalObservationRow(value: unknown): LongitudinalObservationRow {
  const row = parseObservationWithRegistry(value, LONGITUDINAL_PROJECTION_ADMISSIONS);
  if (row.opportunities > row.decisions) fail("LONGITUDINAL_COUNTS_INVALID");
  return row;
}

export function projectLongitudinalObservation(value: unknown): LongitudinalObservationRow {
  const row = parseLongitudinalObservationRow(value);
  if (row.opportunityRefs.length !== row.opportunities || row.occurredRefs.length !== row.occurred) fail("LONGITUDINAL_PROJECTOR_ROW_MISMATCH");
  return row;
}

export function parseLongitudinalReadQuery(value: unknown): ParsedLongitudinalReadQuery {
  return parseQueryWithRegistry(value, LONGITUDINAL_PROJECTION_ADMISSIONS);
}

const parsedPrefixes = new WeakSet<object>();
const sourceImages = new WeakSet<object>();

export interface ParsedRunPrefix {
  readonly runId: string;
  readonly ownerLearnerId: string;
  readonly requestedSeq: number;
  readonly events: readonly Readonly<{ seq: number; type: string; nodeId: string | null }>[];
}

export function parseRunReplayPrefix(value: unknown): ParsedRunPrefix {
  const input = record(value, "LONGITUDINAL_PREFIX_INVALID");
  exactKeys(input, ["runId", "ownerLearnerId", "requestedSeq", "events"], "LONGITUDINAL_PREFIX_INVALID");
  const requestedSeq = integer(input.requestedSeq, 1, "LONGITUDINAL_PREFIX_INVALID");
  if (!Array.isArray(input.events) || input.events.length !== requestedSeq) fail("LONGITUDINAL_PREFIX_INVALID");
  const events = input.events.map((value, index) => {
    const event = record(value, "LONGITUDINAL_PREFIX_INVALID");
    exactKeys(event, ["seq", "type", "nodeId"], "LONGITUDINAL_PREFIX_INVALID");
    if (integer(event.seq, 1, "LONGITUDINAL_PREFIX_INVALID") !== index + 1) fail("LONGITUDINAL_PREFIX_INVALID");
    return { seq: index + 1, type: nonEmpty(event.type, "LONGITUDINAL_PREFIX_INVALID"), nodeId: event.nodeId === null ? null : nonEmpty(event.nodeId, "LONGITUDINAL_PREFIX_INVALID") };
  });
  const parsed = deepFreezeCopy({ runId: nonEmpty(input.runId, "LONGITUDINAL_PREFIX_INVALID"), ownerLearnerId: nonEmpty(input.ownerLearnerId, "LONGITUDINAL_PREFIX_INVALID"), requestedSeq, events });
  parsedPrefixes.add(parsed);
  return parsed;
}

export interface LongitudinalSourceImageV3 {
  readonly version: 3;
  readonly runPrefix: ParsedRunPrefix;
  readonly ownerLearnerId: string;
  readonly moveAuthorship: readonly Readonly<{ eventSeq: number; nodeId: string; learnerId: string | null }>[];
  readonly importedMainlinePlies: number | null;
  readonly structureAttribution: StructureAttributionV2;
}

export function constructLongitudinalSourceImage(input: Readonly<{
  runPrefix: ParsedRunPrefix;
  ownerLearnerId: string;
  moveAuthorship: readonly Readonly<{ eventSeq: number; nodeId: string; learnerId: string | null }>[];
  importedMainlinePlies: number | null;
  structureAttribution: StructureAttributionV2;
}>): LongitudinalSourceImageV3 {
  if (!parsedPrefixes.has(input.runPrefix)) fail("LONGITUDINAL_PREFIX_UNPARSED");
  if (input.ownerLearnerId !== input.runPrefix.ownerLearnerId) fail("LONGITUDINAL_SOURCE_OWNER_MISMATCH");
  if (!Array.isArray(input.moveAuthorship)) fail("LONGITUDINAL_AUTHORSHIP_INVALID");
  const moveEvents = new Map(input.runPrefix.events.filter((event) => event.type === "move.committed" && event.nodeId !== null).map((event) => [event.seq, event.nodeId]));
  const authorship = input.moveAuthorship.map((entry) => {
    const row = record(entry, "LONGITUDINAL_AUTHORSHIP_INVALID");
    exactKeys(row, ["eventSeq", "nodeId", "learnerId"], "LONGITUDINAL_AUTHORSHIP_INVALID");
    const eventSeq = integer(row.eventSeq, 1, "LONGITUDINAL_AUTHORSHIP_INVALID");
    const nodeId = nonEmpty(row.nodeId, "LONGITUDINAL_AUTHORSHIP_INVALID");
    if (moveEvents.get(eventSeq) !== nodeId) fail("LONGITUDINAL_AUTHORSHIP_PREFIX_MISMATCH");
    const learnerId = row.learnerId === null ? null : nonEmpty(row.learnerId, "LONGITUDINAL_AUTHORSHIP_INVALID");
    return { eventSeq, nodeId, learnerId };
  });
  if (new Set(authorship.map((entry) => entry.eventSeq)).size !== authorship.length || authorship.some((entry, index) => index > 0 && authorship[index - 1]!.eventSeq >= entry.eventSeq)) fail("LONGITUDINAL_AUTHORSHIP_INVALID");
  const importedMainlinePlies = input.importedMainlinePlies === null ? null : integer(input.importedMainlinePlies, 0, "LONGITUDINAL_IMPORT_LENGTH_INVALID");
  if (!(["single_player", "unattributable_shared", "unattributable_legacy"] as const).includes(input.structureAttribution)) fail("LONGITUDINAL_STRUCTURE_ATTRIBUTION_INVALID");
  const image = deepFreezeCopy({ version: 3 as const, runPrefix: input.runPrefix, ownerLearnerId: input.ownerLearnerId, moveAuthorship: authorship, importedMainlinePlies, structureAttribution: input.structureAttribution });
  sourceImages.add(image);
  return image;
}

export function sourceDigestV3(image: LongitudinalSourceImageV3): `sha256:${string}` {
  if (!sourceImages.has(image)) fail("LONGITUDINAL_SOURCE_UNSEALED");
  return `sha256:${createHash("sha256").update("tabiya.longitudinal-source.v3\0", "utf8").update(canonicalizeJson(image), "utf8").digest("hex")}`;
}

export const LONGITUDINAL_SOURCE_MUTATION_OPERATIONS = deepFreezeCopy([
  { symbol: "SQLiteRunStorage#create", effect: "always" },
  { symbol: "SQLiteRunStorage#createRatedRun", effect: "always" },
  { symbol: "SQLiteRunStorage#createImportedRun", effect: "always" },
  { symbol: "SQLiteRunStorage#createDerivedRun", effect: "always" },
  { symbol: "SQLiteRunStorage#createRepertoireGapRun", effect: "always" },
  { symbol: "SQLiteRunStorage#save", effect: "conditional" },
  { symbol: "SQLiteRunStorage#saveArenaImport", effect: "conditional" },
  { symbol: "SQLiteRunStorage#createLiveSession", effect: "conditional" },
  { symbol: "SQLiteRunStorage#grantRole", effect: "conditional" },
  { symbol: "SQLiteRunStorage#deleteOwnedRun", effect: "suppression" },
  { symbol: "SQLiteRunStorage#deleteLearner", effect: "suppression" },
] as const);

export type MutationOperation = (typeof LONGITUDINAL_SOURCE_MUTATION_OPERATIONS)[number];

export function compileSourceMutationOperations(source: string): readonly MutationOperation[] {
  const matches = [...source.matchAll(/longitudinalSourceMutation\(\{\s*symbol:\s*"([^"]+)",\s*effect:\s*"(always|conditional|suppression|reconciliation)"\s*\}\)/gu)]
    .map((match) => ({ symbol: match[1]!, effect: match[2]! }));
  const keys = matches.map((row) => `${row.symbol}\0${row.effect}`);
  if (new Set(keys).size !== keys.length) fail("LONGITUDINAL_MUTATION_OPERATION_DUPLICATE");
  const expected = LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.map((row) => `${row.symbol}\0${row.effect}`).sort();
  const actual = keys.sort();
  if (canonicalizeJson(actual) !== canonicalizeJson(expected)) fail("LONGITUDINAL_MUTATION_OPERATION_MISMATCH");
  return deepFreezeCopy(matches as MutationOperation[]);
}

export type FailureCode = "snapshot_invalid" | "derivation_failed" | "publication_conflict";

type JobBase = Readonly<{
  runId: string;
  learnerId: string;
  requestedSeq: number;
  requestedSourceDigest: `sha256:${string}`;
  completedSeq: number;
  derivedRev: number;
  claimGeneration: number;
  retryCount: number;
}>;

type EmptyClaim = Readonly<{ claimedRequestedSeq: null; claimedSourceDigest: null; claimToken: null; claimedBy: null; leaseExpiresAt: null }>;
type LiveClaim = Readonly<{ claimedRequestedSeq: number; claimedSourceDigest: `sha256:${string}`; claimToken: string; claimedBy: string; leaseExpiresAt: string }>;

export type DurableLongitudinalJob =
  | (JobBase & EmptyClaim & Readonly<{ state: "pending" | "complete"; nextAttemptAt: null; failureCode: null }>)
  | (JobBase & LiveClaim & Readonly<{ state: "running"; nextAttemptAt: null; failureCode: null }>)
  | (JobBase & EmptyClaim & Readonly<{ state: "retry_wait"; nextAttemptAt: string; failureCode: FailureCode }>)
  | (JobBase & EmptyClaim & Readonly<{ state: "quarantined"; nextAttemptAt: null; failureCode: FailureCode }>);

export type ClaimReceipt = Readonly<{ runId: string; learnerId: string; generation: number; token: string; worker: string; sourceDigest: `sha256:${string}` }>;

export function invalidateForSourceImage(job: DurableLongitudinalJob, prior: LongitudinalSourceImageV3, next: LongitudinalSourceImageV3): DurableLongitudinalJob {
  const priorDigest = sourceDigestV3(prior);
  if (job.requestedSourceDigest !== priorDigest) fail("LONGITUDINAL_PRIOR_DIGEST_MISMATCH");
  const nextDigest = sourceDigestV3(next);
  if (nextDigest === priorDigest) return job;
  return deepFreezeCopy({
    runId: job.runId, learnerId: job.learnerId, requestedSeq: next.runPrefix.requestedSeq,
    requestedSourceDigest: nextDigest, completedSeq: 0, derivedRev: job.derivedRev,
    claimGeneration: job.claimGeneration + 1, retryCount: 0, state: "pending" as const,
    claimedRequestedSeq: null, claimedSourceDigest: null, claimToken: null, claimedBy: null,
    leaseExpiresAt: null, nextAttemptAt: null, failureCode: null,
  });
}

export function assertCurrentClaim(job: DurableLongitudinalJob, receipt: ClaimReceipt): void {
  if (job.state !== "running" || job.runId !== receipt.runId || job.learnerId !== receipt.learnerId || job.claimGeneration !== receipt.generation || job.claimToken !== receipt.token || job.claimedBy !== receipt.worker || job.claimedSourceDigest !== receipt.sourceDigest) fail("LONGITUDINAL_STALE_CLAIM");
}
