// rfc/concept-registry.md §4 — migration 28: pack-scoped `attempt_concepts` keys become registered
// global concept identities, and every legacy row the registry cannot vouch for moves to the
// `attempt_concept_legacy` quarantine with a closed reason.
//
// The storage constructor is the coordinator: it owns `BEGIN IMMEDIATE`, rollback, commit and
// `PRAGMA user_version`, and a constructor that throws never yields a storage object. This module
// owns only the data operation. It receives a frozen operation-specific repository — no raw
// database, SQL, transaction or pragma surface — plus the private compiled registry and the build's
// built-in pack artifacts, and it asserts the transaction is already active.
import { createHash } from "node:crypto";

import {
  assertCompiledConceptRegistry,
  CONCEPT_REGISTRY_SCHEMA_VERSION,
  readBackReplay,
  REGISTERED_CONCEPT_KEY_PATTERN,
  registeredConceptKey,
  type CompiledConceptRegistry,
  type ConceptId,
  type DrillRunEvent,
} from "@chess-tabiya/runtime";
import { canonicalizeJson, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import type { PackPrincipleLookup, PackShapeLookup, PackValidationIssue } from "./pack-validation.js";

export const CONCEPT_MIGRATION_VERSION = 28 as const;
export const CONCEPT_MIGRATION_RECEIPT_FORMAT = "tabiya.concept-migration-receipt.v1" as const;

/** Closed quarantine reasons (§4 step 5). */
export const ATTEMPT_CONCEPT_LEGACY_REASONS = Object.freeze([
  "malformed_legacy_key",
  "pack_mismatch",
  "artifact_unavailable",
  "artifact_invalid",
  "concept_absent_from_pack",
  "unknown_concept",
  // Written by live projection, not by the migration: a stored pre-registry pack's unregistered id.
  "unregistered_at_projection",
] as const);
export type AttemptConceptLegacyReason = (typeof ATTEMPT_CONCEPT_LEGACY_REASONS)[number];

export const CONCEPT_MIGRATION_TABLES = Object.freeze(["attempt_concepts", "attempt_concept_legacy", "concept_registry_migration"] as const);

const reasonList = ATTEMPT_CONCEPT_LEGACY_REASONS.map((reason) => `'${reason}'`).join(",");

/** The exact DDL migration 28 installs; `attempt_concepts` is rebuilt, never altered in place. */
export const CONCEPT_MIGRATION_SQL = `
  CREATE TABLE attempt_concepts (
    run_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    pack_id TEXT NOT NULL,
    pack_digest TEXT NOT NULL,
    concept_key TEXT NOT NULL,
    concept_id TEXT NOT NULL,
    registry_schema_version INTEGER NOT NULL CHECK (registry_schema_version = 1),
    registry_digest TEXT NOT NULL CHECK (registry_digest GLOB 'sha256:*' AND length(registry_digest) = 71),
    label TEXT NOT NULL,
    PRIMARY KEY (run_id, branch_id, concept_key),
    CHECK (concept_key = 'concept:' || concept_id || '@1'),
    FOREIGN KEY (run_id, branch_id) REFERENCES attempts(run_id, branch_id) ON DELETE CASCADE
  ) STRICT;
  CREATE INDEX attempt_concepts_key ON attempt_concepts(concept_key);
  CREATE TABLE attempt_concept_legacy (
    run_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    pack_id TEXT NOT NULL,
    raw_key TEXT NOT NULL,
    label TEXT NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN (${reasonList})),
    PRIMARY KEY (run_id, branch_id, raw_key),
    FOREIGN KEY (run_id, branch_id) REFERENCES attempts(run_id, branch_id) ON DELETE CASCADE
  ) STRICT;
  CREATE TABLE concept_registry_migration (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    receipt_json TEXT NOT NULL,
    receipt_digest TEXT NOT NULL
  ) STRICT;
`;

export class ConceptMigrationError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(`${code}: ${message}`);
    this.name = "ConceptMigrationError";
    this.code = code;
  }
}

function fail(code: string, message: string): never {
  throw new ConceptMigrationError(code, message);
}

/** A complete pack document by its canonical complete-document digest. */
export interface PackArtifact {
  readonly digest: string;
  readonly document: DrillPackDefinition;
}

/** Test-only fault points inside the operation; production never supplies one. */
export type ConceptMigrationFaultPoint = "after_classification" | "after_registered_writes" | "after_quarantine_writes" | "after_receipt" | "duplicate_registered_output";

/**
 * What the coordinator hands the concept phase. `registry` must be the private output of
 * `compileConceptRegistry`. `builtInArtifacts` are the complete documents the build loaded from
 * disk; when legacy rows exist and it is absent, the migration refuses rather than quarantining
 * every row as unavailable.
 */
export interface ConceptMigrationAuthority {
  readonly registry: CompiledConceptRegistry;
  readonly builtInArtifacts?: readonly PackArtifact[];
  readonly validateStoredPack?: (document: unknown) => { readonly valid: boolean; readonly issues: readonly PackValidationIssue[] };
  readonly faultPoint?: ConceptMigrationFaultPoint;
}

export interface LegacyConceptRow {
  readonly runId: string;
  readonly branchId: string;
  readonly packId: string;
  readonly conceptKey: string;
  readonly label: string;
  readonly attemptPackId: string | null;
  readonly attemptPackDigest: string | null;
  readonly snapshotJson: string | null;
}

export interface StoredPackArtifactRow {
  readonly source: "registered" | "playtest";
  readonly digest: string;
  readonly documentJson: string;
}

export interface RegisteredConceptOutput {
  readonly runId: string;
  readonly branchId: string;
  readonly packId: string;
  readonly packDigest: string;
  readonly conceptKey: string;
  readonly conceptId: string;
  readonly registryDigest: string;
  readonly label: string;
}

export interface QuarantinedConceptOutput {
  readonly runId: string;
  readonly branchId: string;
  readonly packId: string;
  readonly rawKey: string;
  readonly label: string;
  readonly reason: AttemptConceptLegacyReason;
}

/** The frozen operation-specific repository capability (criterion 26). */
export interface ConceptMigrationRepository {
  readonly transactionActive: () => boolean;
  /**
   * True when migration 28's objects already exist. A database genuinely at version 27 cannot
   * carry them (they are created inside the version-28 transaction), so this is only a rewound
   * fixture replaying the body; the replay keeps every row and the restart path verifies it.
   */
  readonly alreadyApplied: () => boolean;
  readonly legacyRows: () => readonly LegacyConceptRow[];
  readonly storedPackArtifacts: () => readonly StoredPackArtifactRow[];
  readonly replaceConceptTables: () => void;
  readonly insertRegistered: (row: RegisteredConceptOutput) => void;
  readonly insertQuarantined: (row: QuarantinedConceptOutput) => void;
  readonly writeReceipt: (receiptJson: string, receiptDigest: string) => void;
}

export interface ConceptMigrationReceipt {
  readonly format: typeof CONCEPT_MIGRATION_RECEIPT_FORMAT;
  readonly storageVersion: typeof CONCEPT_MIGRATION_VERSION;
  readonly registry: { readonly schemaVersion: 1; readonly digest: string };
  readonly input: { readonly rows: number; readonly digest: string };
  readonly artifacts: { readonly count: number; readonly digest: string };
  readonly registered: { readonly rows: number; readonly digest: string };
  readonly quarantined: { readonly rows: number; readonly digest: string; readonly byReason: Readonly<Record<AttemptConceptLegacyReason, number>> };
}

function sha256(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

/** The canonical complete-document digest, identical to `digestDrillPack` and Pack Studio's. */
export function packArtifactDigest(document: unknown): string {
  return sha256(canonicalizeJson(document));
}

const compare = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0);
const sourceKey = (row: { readonly runId: string; readonly branchId: string }, key: string): string => JSON.stringify([row.runId, row.branchId, key]);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
    Object.freeze(value);
  }
  return value;
}

/**
 * The sealed artifact snapshot: built-in documents plus stored registered/playtest rows read
 * inside the coordinator transaction, each digest recomputed from its complete document. The
 * population digest is computed over the digest-sorted inventory, so loader order cannot change it
 * ([[D2962]]).
 */
function artifactSnapshot(authority: ConceptMigrationAuthority, stored: readonly StoredPackArtifactRow[]): {
  readonly get: (digest: string) => { readonly document: DrillPackDefinition; readonly invalid: readonly string[] } | undefined;
  readonly count: number;
  readonly digest: string;
} {
  const inventory = new Map<string, { readonly document: DrillPackDefinition; readonly invalid: readonly string[]; readonly source: string }>();
  for (const artifact of authority.builtInArtifacts ?? []) {
    const document = deepFreeze(structuredClone(artifact.document));
    const digest = packArtifactDigest(document);
    if (digest !== artifact.digest) fail("CONCEPT_MIGRATION_ARTIFACT_DIGEST", `built-in artifact claims ${artifact.digest} but its complete document hashes to ${digest}`);
    inventory.set(digest, { document, invalid: [], source: "built_in" });
  }
  for (const row of stored) {
    let parsed: unknown;
    try { parsed = JSON.parse(row.documentJson) as unknown; } catch { fail("CONCEPT_MIGRATION_ARTIFACT_DIGEST", `stored ${row.source} pack ${row.digest} is not JSON`); }
    const digest = packArtifactDigest(parsed);
    if (digest !== row.digest) fail("CONCEPT_MIGRATION_ARTIFACT_DIGEST", `stored ${row.source} pack claims ${row.digest} but its complete document hashes to ${digest}`);
    if (inventory.has(digest)) continue;
    // A stored document crosses the shipped validator before it may vouch for an occurrence.
    // Registry-membership issues are excluded: classification decides those row by row.
    const validation = authority.validateStoredPack?.(parsed);
    const invalid = validation === undefined
      ? ["no stored-pack validator was supplied to the concept migration"]
      : validation.issues.filter((issue) => issue.severity === "error" && issue.code !== "CONCEPT_UNREGISTERED" && issue.code !== "CONCEPT_RETIRED").map((issue) => `${issue.code} ${issue.path}`);
    inventory.set(digest, { document: deepFreeze(parsed as DrillPackDefinition), invalid: Object.freeze(invalid), source: row.source });
  }
  const population = [...inventory.entries()].map(([digest, artifact]) => [digest, artifact.source] as const).sort((left, right) => compare(left[0], right[0]));
  const snapshot = {
    get: (digest: string) => inventory.get(digest),
    count: population.length,
    digest: sha256(JSON.stringify(population)),
  };
  return Object.freeze(snapshot);
}

function parseRun(snapshotJson: string | null, runId: string): { readonly packId: string | null; readonly packDigest: string | null } | undefined {
  if (snapshotJson === null) return undefined;
  try {
    const snapshot = JSON.parse(snapshotJson) as { readonly events?: unknown };
    if (!Array.isArray(snapshot.events)) return undefined;
    const run = readBackReplay(snapshot.events as readonly DrillRunEvent[]).run;
    if (run.id !== runId) return undefined;
    return { packId: run.packId ?? null, packDigest: run.packDigest ?? null };
  } catch {
    return undefined;
  }
}

function emptyReasons(): Record<AttemptConceptLegacyReason, number> {
  return Object.fromEntries(ATTEMPT_CONCEPT_LEGACY_REASONS.map((reason) => [reason, 0])) as Record<AttemptConceptLegacyReason, number>;
}

/**
 * The data operation (§4 steps 1–7). It never opens or closes a transaction; the coordinator
 * rolls everything back — rebuilt tables, both populations and the receipt — on any throw.
 */
export function migrateAttemptConcepts(repository: ConceptMigrationRepository, authority: ConceptMigrationAuthority): ConceptMigrationReceipt | undefined {
  if (!Object.isFrozen(repository)) fail("CONCEPT_MIGRATION_CAPABILITY", "the concept migration requires the frozen repository capability");
  if (!repository.transactionActive()) fail("CONCEPT_MIGRATION_TRANSACTION", "the concept migration runs only inside the coordinator's open transaction");
  const registry = authority.registry;
  assertCompiledConceptRegistry(registry);
  if (repository.alreadyApplied()) return undefined;

  const input = [...repository.legacyRows()].sort((left, right) => compare(sourceKey(left, left.conceptKey), sourceKey(right, right.conceptKey)));
  if (input.length > 0 && authority.builtInArtifacts === undefined) {
    fail("CONCEPT_MIGRATION_ARTIFACTS_REQUIRED", `${input.length} legacy concept rows need the build's pack artifact inventory; start through the application coordinator`);
  }
  const artifacts = artifactSnapshot(authority, repository.storedPackArtifacts());
  const runs = new Map<string, ReturnType<typeof parseRun>>();
  const registered: RegisteredConceptOutput[] = [];
  const quarantined: QuarantinedConceptOutput[] = [];
  const registeredSources: string[] = [];
  const quarantinedSources: string[] = [];

  for (const row of input) {
    const quarantine = (reason: AttemptConceptLegacyReason): void => {
      quarantined.push(Object.freeze({ runId: row.runId, branchId: row.branchId, packId: row.packId, rawKey: row.conceptKey, label: row.label, reason }));
      quarantinedSources.push(sourceKey(row, row.conceptKey));
    };
    const prefix = `pack:${row.packId}#`;
    const raw = row.conceptKey.startsWith(prefix) ? row.conceptKey.slice(prefix.length) : "";
    if (raw === "") { quarantine("malformed_legacy_key"); continue; }
    if (row.attemptPackId !== row.packId) { quarantine("pack_mismatch"); continue; }
    if (!runs.has(row.runId)) runs.set(row.runId, parseRun(row.snapshotJson, row.runId));
    const run = runs.get(row.runId);
    if (run === undefined || run.packDigest === null) { quarantine("artifact_unavailable"); continue; }
    if (run.packId !== row.packId || (row.attemptPackDigest !== null && row.attemptPackDigest !== run.packDigest)) { quarantine("pack_mismatch"); continue; }
    const artifact = artifacts.get(run.packDigest);
    if (artifact === undefined) { quarantine("artifact_unavailable"); continue; }
    if (artifact.invalid.length > 0) { quarantine("artifact_invalid"); continue; }
    if (artifact.document.id !== row.packId) { quarantine("pack_mismatch"); continue; }
    if (!(artifact.document.concepts ?? []).includes(raw)) { quarantine("concept_absent_from_pack"); continue; }
    const entry = registry.get(raw);
    if (entry === undefined) { quarantine("unknown_concept"); continue; }
    registered.push(Object.freeze({
      runId: row.runId,
      branchId: row.branchId,
      packId: row.packId,
      packDigest: run.packDigest,
      conceptKey: registeredConceptKey(entry.id as ConceptId),
      conceptId: entry.id,
      registryDigest: registry.digest,
      label: entry.label,
    }));
    registeredSources.push(sourceKey(row, row.conceptKey));
  }
  if (authority.faultPoint === "duplicate_registered_output" && registered.length > 0) registered.push(registered[0]!);
  if (authority.faultPoint === "after_classification") fail("CONCEPT_MIGRATION_FAULT", "injected after classification");

  // Refuse key collisions before any write reaches the rebuilt table.
  const outputKeys = new Set<string>();
  for (const row of registered) {
    const key = sourceKey(row, row.conceptKey);
    if (outputKeys.has(key)) fail("CONCEPT_MIGRATION_COLLISION", `two legacy rows resolve to ${row.conceptKey} on ${row.runId}/${row.branchId}`);
    outputKeys.add(key);
  }
  // Lossless disjoint partition: every canonical input key lands in exactly one output population.
  const inputKeys = input.map((row) => sourceKey(row, row.conceptKey)).sort(compare);
  const partition = [...registeredSources, ...quarantinedSources].sort(compare);
  if (new Set(partition).size !== partition.length || partition.length !== inputKeys.length || partition.some((key, index) => key !== inputKeys[index])) {
    fail("CONCEPT_MIGRATION_PARTITION", "registered plus quarantined outputs are not a disjoint partition of the legacy input");
  }

  repository.replaceConceptTables();
  for (const row of registered) repository.insertRegistered(row);
  if (authority.faultPoint === "after_registered_writes") fail("CONCEPT_MIGRATION_FAULT", "injected after registered writes");
  for (const row of quarantined) repository.insertQuarantined(row);
  if (authority.faultPoint === "after_quarantine_writes") fail("CONCEPT_MIGRATION_FAULT", "injected after quarantine writes");

  const byReason = emptyReasons();
  for (const row of quarantined) byReason[row.reason] += 1;
  const receipt: ConceptMigrationReceipt = deepFreeze({
    format: CONCEPT_MIGRATION_RECEIPT_FORMAT,
    storageVersion: CONCEPT_MIGRATION_VERSION,
    registry: { schemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION, digest: registry.digest },
    input: { rows: input.length, digest: sha256(canonicalizeJson(input.map((row) => [row.runId, row.branchId, row.conceptKey, row.packId, row.label]))) },
    artifacts: { count: artifacts.count, digest: artifacts.digest },
    registered: { rows: registered.length, digest: sha256(canonicalizeJson(registered.map((row) => [row.runId, row.branchId, row.conceptKey, row.packId, row.packDigest, row.registryDigest, row.label]))) },
    quarantined: { rows: quarantined.length, digest: sha256(canonicalizeJson(quarantined.map((row) => [row.runId, row.branchId, row.rawKey, row.packId, row.label, row.reason]))), byReason },
  });
  const receiptJson = canonicalizeJson(receipt);
  repository.writeReceipt(receiptJson, sha256(receiptJson));
  if (authority.faultPoint === "after_receipt") fail("CONCEPT_MIGRATION_FAULT", "injected after the receipt write");
  return receipt;
}

const RECEIPT_KEYS = ["artifacts", "format", "input", "quarantined", "registered", "registry", "storageVersion"];

/** Strict receipt parser: exact keys, canonical bytes and the stored digest. */
export function parseConceptMigrationReceipt(receiptJson: string, receiptDigest: string): ConceptMigrationReceipt {
  let value: unknown;
  try { value = JSON.parse(receiptJson) as unknown; } catch { fail("CONCEPT_MIGRATION_RECEIPT", "the stored concept migration receipt is not JSON"); }
  const record = value as Record<string, unknown>;
  if (value === null || typeof value !== "object" || Array.isArray(value) || Object.keys(record).sort().join(",") !== RECEIPT_KEYS.join(",")) fail("CONCEPT_MIGRATION_RECEIPT", "the stored concept migration receipt has the wrong keys");
  if (canonicalizeJson(value) !== receiptJson) fail("CONCEPT_MIGRATION_RECEIPT", "the stored concept migration receipt is not canonical");
  if (sha256(receiptJson) !== receiptDigest) fail("CONCEPT_MIGRATION_RECEIPT", "the stored concept migration receipt does not match its digest");
  if (record.format !== CONCEPT_MIGRATION_RECEIPT_FORMAT || record.storageVersion !== CONCEPT_MIGRATION_VERSION) fail("CONCEPT_MIGRATION_RECEIPT", "the stored concept migration receipt has the wrong format or version");
  const registry = record.registry as Record<string, unknown> | null;
  if (registry === null || typeof registry !== "object" || registry.schemaVersion !== 1 || typeof registry.digest !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(registry.digest)) fail("CONCEPT_MIGRATION_RECEIPT", "the stored concept migration receipt names no registry revision");
  return deepFreeze(value as ConceptMigrationReceipt);
}

export interface ConceptStoreState {
  readonly receipt: { readonly receiptJson: string; readonly receiptDigest: string } | undefined;
  /** Distinct `(registry_digest, concept_id)` pairs carried by registered rows. */
  readonly refs: readonly { readonly registryDigest: string; readonly conceptId: string }[];
  readonly malformedKeys: number;
}

/**
 * The restart path for a database already at version 28 (criterion 28): the receipt must exist and
 * parse strictly, the revision it was migrated against and every revision a registered row names
 * must be reachable in the installed registry's immutable history, and every registered key must
 * agree with its id. A missing receipt is a mixed-version database and refuses startup.
 */
export function verifyConceptStore(state: ConceptStoreState, registry: CompiledConceptRegistry): ConceptMigrationReceipt {
  assertCompiledConceptRegistry(registry);
  if (state.receipt === undefined) fail("CONCEPT_MIGRATION_RECEIPT", "storage is at version 28 but carries no concept migration receipt (mixed-version database)");
  const receipt = parseConceptMigrationReceipt(state.receipt.receiptJson, state.receipt.receiptDigest);
  const known = new Set<string>(registry.revisions);
  if (!known.has(receipt.registry.digest)) fail("CONCEPT_REGISTRY_REVISION_UNAVAILABLE", `the installed registry ${registry.digest} does not contain revision ${receipt.registry.digest} this database was migrated against`);
  const missing = [...new Set(state.refs.map((ref) => ref.registryDigest).filter((digest) => !known.has(digest)))];
  if (missing.length > 0) fail("CONCEPT_REGISTRY_REVISION_UNAVAILABLE", `stored concept rows name revisions the installed registry does not contain: ${missing.join(", ")}`);
  const absent = state.refs.filter((ref) => !(registry.revision(ref.registryDigest)?.entries.some((entry) => entry.id === ref.conceptId) ?? false));
  if (absent.length > 0) fail("CONCEPT_STORE_MALFORMED", `stored concept rows name ids absent from their revision: ${absent.map((ref) => `${ref.conceptId}@${ref.registryDigest}`).join(", ")}`);
  if (state.malformedKeys > 0) fail("CONCEPT_STORE_MALFORMED", `${state.malformedKeys} registered concept rows carry a key that is not concept:<id>@1`);
  return receipt;
}

export { REGISTERED_CONCEPT_KEY_PATTERN };
