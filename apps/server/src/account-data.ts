import { createHash } from "node:crypto";

export const ACCOUNT_BUNDLE_MEDIA_TYPE = "application/vnd.tabiya.account+json; version=1";
export const ACCOUNT_BUNDLE_FORMAT = "tabiya-account-export" as const;
export const ACCOUNT_BUNDLE_VERSION = 1 as const;

export type IdentityTransform =
  | "delete_row"
  | "set_null"
  | "legacy_identity"
  | "deletion_scoped_key";

export interface AccountDataInventoryEntry {
  readonly store: string;
  readonly kind: "table" | "browser";
  readonly dataClass: string;
  readonly exportDisposition: "project" | "reference" | "metadata_only" | "exclude";
  readonly deletionDisposition: "hard_delete" | "classify_run" | "tombstone" | "retain" | "clear_browser";
  readonly identityTransforms: Readonly<Record<string, IdentityTransform>>;
}

function table(
  store: string,
  dataClass: string,
  exportDisposition: AccountDataInventoryEntry["exportDisposition"],
  deletionDisposition: AccountDataInventoryEntry["deletionDisposition"],
  identityTransforms: Readonly<Record<string, IdentityTransform>> = {},
): AccountDataInventoryEntry {
  return Object.freeze({ store, kind: "table", dataClass, exportDisposition, deletionDisposition, identityTransforms: Object.freeze({ ...identityTransforms }) });
}

/**
 * The exhaustive privacy boundary for storage schema v25. A migration adding a table must add one
 * entry here in the same change; assertAccountDataInventory enforces set equality at startup/tests.
 */
export const ACCOUNT_DATA_INVENTORY = Object.freeze([
  table("learners", "learner_identity", "project", "hard_delete", { id: "delete_row", handle: "delete_row", display_name: "delete_row" }),
  table("learner_sessions", "security", "exclude", "hard_delete", { learner_id: "delete_row" }),
  table("drill_runs", "owned_runs", "project", "classify_run", { owner_learner_id: "legacy_identity", active_writer_learner_id: "legacy_identity", active_writer_id: "legacy_identity" }),
  table("run_grants", "run_access", "project", "tombstone", { learner_id: "delete_row" }),
  table("imported_games", "owned_runs", "project", "hard_delete"),
  table("run_derivations", "owned_runs", "project", "hard_delete"),
  table("run_marks", "marks", "project", "hard_delete", { author_learner_id: "delete_row" }),
  table("attempts", "progress", "project", "hard_delete", { learner_id: "delete_row" }),
  table("attempt_concepts", "progress", "project", "hard_delete"),
  table("schedules", "progress", "project", "hard_delete", { learner_id: "delete_row" }),
  table("learner_position_stats", "progress", "project", "hard_delete", { learner_id: "delete_row" }),
  table("progress_meta", "installation", "exclude", "retain"),
  table("repertoires", "repertoires", "project", "hard_delete", { owner_learner_id: "delete_row" }),
  table("repertoire_moves", "repertoires", "project", "hard_delete"),
  table("repertoire_scans", "repertoires", "project", "hard_delete"),
  table("repertoire_gap_runs", "repertoires", "project", "hard_delete"),
  table("pack_drafts", "drafts", "project", "hard_delete", { owner_learner_id: "legacy_identity" }),
  table("playtest_documents", "drafts", "project", "hard_delete"),
  table("registered_packs", "publications", "project", "retain", { publisher_learner_id: "legacy_identity", publisher_handle: "legacy_identity" }),
  table("shape_drafts", "drafts", "project", "hard_delete", { owner_learner_id: "legacy_identity" }),
  table("registered_shapes", "publications", "project", "retain", { publisher_learner_id: "legacy_identity", publisher_handle: "legacy_identity" }),
  table("live_sessions", "live_social", "project", "tombstone", { vote_adapter_learner_id: "set_null", handoff_learner_id: "set_null", created_by: "legacy_identity", "rotation_json[]": "delete_row" }),
  table("session_journal", "live_social", "project", "tombstone", { actor_learner_id: "set_null", "payload.changedByLearnerId": "deletion_scoped_key", "payload.holderLearnerId": "legacy_identity" }),
  table("session_proposals", "live_social", "project", "hard_delete", { proposed_by: "delete_row" }),
  table("session_vote_windows", "live_social", "project", "tombstone"),
  table("session_votes", "live_social", "project", "hard_delete", { cast_by_learner_id: "delete_row", voter_key: "delete_row" }),
  table("session_invitations", "live_social", "project", "hard_delete", { invited_handle: "delete_row" }),
  table("arena_legs", "live_social", "project", "tombstone", { reference_player_handle: "deletion_scoped_key" }),
  table("match_states", "live_social", "project", "tombstone", { white_learner_id: "set_null", black_learner_id: "set_null", pause_proposed_by: "set_null" }),
  table("public_tokens", "live_social", "metadata_only", "hard_delete", { created_by: "delete_row", invited_handle: "delete_row" }),
  table("classrooms", "live_social", "project", "tombstone", { owner_learner_id: "deletion_scoped_key" }),
  table("classroom_members", "live_social", "project", "tombstone", { learner_id: "deletion_scoped_key", invited_by: "deletion_scoped_key" }),
  table("assignments", "live_social", "project", "tombstone", { assigned_by: "deletion_scoped_key" }),
  table("assignment_submissions", "live_social", "project", "tombstone", { learner_id: "deletion_scoped_key", "granted_learner_ids[]": "delete_row" }),
  table("learner_ratings", "behavioral_profiles", "project", "hard_delete", { learner_id: "delete_row" }),
  table("rated_games", "behavioral_profiles", "project", "hard_delete", { learner_id: "delete_row" }),
  table("rating_periods", "behavioral_profiles", "project", "hard_delete", { learner_id: "delete_row" }),
  table("cohort_standings", "behavioral_profiles", "project", "tombstone", { opened_by_learner_id: "deletion_scoped_key" }),
  table("standing_members", "behavioral_profiles", "project", "hard_delete", { learner_id: "delete_row" }),
  table("learner_marks", "behavioral_profiles", "project", "hard_delete", { learner_id: "delete_row" }),
  Object.freeze({
    store: "browser_local",
    kind: "browser",
    dataClass: "device_local_preferences",
    exportDisposition: "exclude",
    deletionDisposition: "clear_browser",
    identityTransforms: Object.freeze({}),
  }),
] satisfies readonly AccountDataInventoryEntry[]);

export function assertAccountDataInventory(applicationTables: readonly string[]): void {
  const declared = ACCOUNT_DATA_INVENTORY.filter((entry) => entry.kind === "table").map((entry) => entry.store);
  const duplicates = declared.filter((name, index) => declared.indexOf(name) !== index);
  const actual = [...applicationTables].filter((name) => !name.startsWith("sqlite_")).sort();
  const expected = [...new Set(declared)].sort();
  if (duplicates.length > 0 || JSON.stringify(actual) !== JSON.stringify(expected)) {
    const missing = actual.filter((name) => !expected.includes(name));
    const stale = expected.filter((name) => !actual.includes(name));
    throw new TypeError(`ACCOUNT_DATA_INVENTORY mismatch (missing: ${missing.join(", ") || "none"}; stale: ${stale.join(", ") || "none"}; duplicate: ${[...new Set(duplicates)].join(", ") || "none"})`);
  }
}

export function assertIdentityTransformInventory(identityFields: readonly string[]): void {
  const declared = ACCOUNT_DATA_INVENTORY.flatMap((entry) => Object.keys(entry.identityTransforms).map((field) => `${entry.store}.${field}`));
  const duplicates = declared.filter((name, index) => declared.indexOf(name) !== index);
  const actual = [...identityFields].sort();
  const expected = [...new Set(declared)].sort();
  if (duplicates.length > 0 || JSON.stringify(actual) !== JSON.stringify(expected)) {
    const missing = actual.filter((name) => !expected.includes(name));
    const stale = expected.filter((name) => !actual.includes(name));
    throw new TypeError(`identity-transform inventory mismatch (missing: ${missing.join(", ") || "none"}; stale: ${stale.join(", ") || "none"})`);
  }
}

export type JsonScalar = string | number | boolean | null;
export type JsonValue = JsonScalar | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export interface Projection<T> {
  readonly projectionVersion: 1;
  readonly provenance: readonly string[];
  readonly value: T;
}

export interface StoredRunDiagnostic {
  readonly code: "INVALID_JSON" | "UNSUPPORTED_RUN_SCHEMA" | "INVALID_RUN_DOCUMENT";
  readonly message: string;
}

export type StoredRunExport =
  | { readonly kind: "parsed"; readonly value: JsonValue }
  | { readonly kind: "raw"; readonly utf8: string; readonly diagnostic: StoredRunDiagnostic };

export interface OwnedRunExport {
  readonly id: string;
  readonly title: string;
  readonly schemaVersion: string;
  readonly replayable: boolean;
  readonly snapshot: StoredRunExport;
  readonly importedGame: JsonValue | null;
  readonly grants: readonly JsonValue[];
  readonly derivations: readonly {
    readonly derivedRunId: string;
    readonly sourceRunId: string;
    readonly sourceBranchId: string;
    readonly sourceNodeId: string;
    readonly kind: "flip_sides";
    readonly createdAt: string;
  }[];
}

export interface SharedRunReference {
  readonly runId: string;
  readonly title: string;
  readonly role: "host" | "participant" | "spectator";
  readonly grantedAt: string;
  readonly contributions: readonly JsonValue[];
}

export interface AccountBundleV1 {
  readonly format: typeof ACCOUNT_BUNDLE_FORMAT;
  readonly formatVersion: typeof ACCOUNT_BUNDLE_VERSION;
  readonly source: { readonly applicationVersion: string; readonly storageVersion: number; readonly runSchemaVersion: string };
  readonly account: Projection<{ readonly handle: string; readonly displayName: string | null; readonly createdAt: string }>;
  readonly ownedRuns: Projection<readonly OwnedRunExport[]>;
  readonly sharedAccess: Projection<readonly SharedRunReference[]>;
  readonly progress: Projection<readonly JsonValue[]>;
  readonly marks: Projection<readonly JsonValue[]>;
  readonly repertoires: Projection<readonly JsonValue[]>;
  readonly drafts: Projection<readonly JsonValue[]>;
  readonly publications: Projection<readonly JsonValue[]>;
  readonly liveAndSocial: Projection<readonly JsonValue[]>;
  readonly behavioralProfiles: Projection<readonly JsonValue[]>;
  readonly exclusions: Projection<readonly { readonly kind: string; readonly reason: string }[]>;
}

export interface AccountBundleInput {
  readonly source: AccountBundleV1["source"];
  readonly account: AccountBundleV1["account"]["value"];
  readonly ownedRuns: readonly OwnedRunExport[];
  readonly sharedAccess: readonly SharedRunReference[];
  readonly progress: readonly JsonValue[];
  readonly marks: readonly JsonValue[];
  readonly repertoires: readonly JsonValue[];
  readonly drafts: readonly JsonValue[];
  readonly publications: readonly JsonValue[];
  readonly liveAndSocial: readonly JsonValue[];
  readonly behavioralProfiles: readonly JsonValue[];
}

function projected<T>(provenance: readonly string[], value: T): Projection<T> {
  return Object.freeze({ projectionVersion: 1, provenance: Object.freeze([...provenance]), value });
}

export function buildAccountBundle(input: AccountBundleInput): AccountBundleV1 {
  return Object.freeze({
    format: ACCOUNT_BUNDLE_FORMAT,
    formatVersion: ACCOUNT_BUNDLE_VERSION,
    source: Object.freeze({ ...input.source }),
    account: projected(["learners"], Object.freeze({ ...input.account })),
    ownedRuns: projected(["drill_runs", "run_grants", "imported_games", "run_derivations"], Object.freeze([...input.ownedRuns].sort((a, b) => a.id.localeCompare(b.id)))),
    sharedAccess: projected(["run_grants", "run_marks"], Object.freeze([...input.sharedAccess].sort((a, b) => a.runId.localeCompare(b.runId)))),
    progress: projected(["attempts", "attempt_concepts", "schedules", "learner_position_stats"], Object.freeze([...input.progress])),
    marks: projected(["run_marks"], Object.freeze([...input.marks])),
    repertoires: projected(["repertoires", "repertoire_moves", "repertoire_scans", "repertoire_gap_runs"], Object.freeze([...input.repertoires])),
    drafts: projected(["pack_drafts", "shape_drafts", "playtest_documents"], Object.freeze([...input.drafts])),
    publications: projected(["registered_packs", "registered_shapes"], Object.freeze([...input.publications])),
    liveAndSocial: projected(["live_sessions", "session_journal", "session_proposals", "session_vote_windows", "session_votes", "session_invitations", "arena_legs", "match_states", "public_tokens", "classrooms", "classroom_members", "assignments", "assignment_submissions"], Object.freeze([...input.liveAndSocial])),
    behavioralProfiles: projected(["learner_ratings", "rated_games", "rating_periods", "cohort_standings", "standing_members", "learner_marks"], Object.freeze([...input.behavioralProfiles])),
    exclusions: projected(["learners", "learner_sessions", "public_tokens", "browser_local"], Object.freeze([
      Object.freeze({ kind: "password_hash", reason: "Password hashes, login failures, and lock state are authentication material and are never exported." }),
      Object.freeze({ kind: "sessions", reason: "Authenticated sessions, bearer tokens, and token hashes are credentials and are never exported." }),
      Object.freeze({ kind: "provider_credentials", reason: "Provider credentials and deployment configuration belong to the installation, not the learner account." }),
      Object.freeze({ kind: "installation_content", reason: "Global registries and official content belong to the installation and are not copied into an account bundle." }),
      Object.freeze({ kind: "browser_local", reason: "Writer ids, assistance preferences, and workflow preferences are stored only on each device and are not account-scoped." }),
    ])),
  });
}

export function storedRunExport(snapshotUtf8: string, supportedSchemaVersion?: string): { readonly replayable: boolean; readonly snapshot: StoredRunExport; readonly schemaVersion: string } {
  try {
    const value = JSON.parse(snapshotUtf8) as unknown;
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("run document is not an object");
    const schemaVersion = (value as { readonly schemaVersion?: unknown }).schemaVersion;
    if (typeof schemaVersion !== "string") {
      return Object.freeze({ replayable: false, schemaVersion: "unknown", snapshot: Object.freeze({ kind: "raw", utf8: snapshotUtf8, diagnostic: Object.freeze({ code: "INVALID_RUN_DOCUMENT", message: "Stored run has no string schemaVersion" }) }) });
    }
    if (supportedSchemaVersion !== undefined && schemaVersion !== supportedSchemaVersion) {
      return Object.freeze({ replayable: false, schemaVersion, snapshot: Object.freeze({ kind: "raw", utf8: snapshotUtf8, diagnostic: Object.freeze({ code: "UNSUPPORTED_RUN_SCHEMA", message: `Stored run schema ${schemaVersion} is not replayable by ${supportedSchemaVersion}` }) }) });
    }
    return Object.freeze({ replayable: true, schemaVersion, snapshot: Object.freeze({ kind: "parsed", value: value as JsonValue }) });
  } catch (error) {
    return Object.freeze({ replayable: false, schemaVersion: "unknown", snapshot: Object.freeze({ kind: "raw", utf8: snapshotUtf8, diagnostic: Object.freeze({ code: "INVALID_JSON", message: error instanceof Error ? error.message : "Stored run is not valid JSON" }) }) });
  }
}

export function canonicalJson(value: JsonValue): string {
  const visit = (candidate: JsonValue): string => {
    if (candidate === null || typeof candidate !== "object") return JSON.stringify(candidate);
    if (Array.isArray(candidate)) return `[${candidate.map((item) => visit(item)).join(",")}]`;
    const object = candidate as Readonly<Record<string, JsonValue>>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${visit(object[key]!)}`).join(",")}}`;
  };
  return visit(value);
}

export function serializeAccountBundle(bundle: AccountBundleV1): { readonly bytes: Uint8Array<ArrayBuffer>; readonly digest: `sha256:${string}` } {
  validateAccountBundleV1(bundle);
  const bytes = new TextEncoder().encode(canonicalJson(bundle as unknown as JsonValue));
  const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}` as const;
  return Object.freeze({ bytes, digest });
}

const TOP_LEVEL_KEYS = Object.freeze(["format", "formatVersion", "source", "account", "ownedRuns", "sharedAccess", "progress", "marks", "repertoires", "drafts", "publications", "liveAndSocial", "behavioralProfiles", "exclusions"]);

function exactKeys(value: object, keys: readonly string[], at: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new TypeError(`${at} has unknown or missing fields`);
}

function projection(value: unknown, at: string): asserts value is Projection<JsonValue> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${at} must be a projection`);
  exactKeys(value, ["projectionVersion", "provenance", "value"], at);
  const record = value as Record<string, unknown>;
  if (record.projectionVersion !== 1 || !Array.isArray(record.provenance) || !record.provenance.every((item) => typeof item === "string")) throw new TypeError(`${at} has an invalid projection header`);
}

function recordValue(value: unknown, at: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${at} must be an object`);
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, at: string): string {
  if (typeof value !== "string") throw new TypeError(`${at} must be a string`);
  return value;
}

function arrayValue(value: unknown, at: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${at} must be an array`);
  return value;
}

function validateJsonValue(value: unknown, at: string): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) { value.forEach((item, index) => validateJsonValue(item, `${at}[${index}]`)); return; }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) validateJsonValue(child, `${at}.${key}`);
    return;
  }
  throw new TypeError(`${at} is not a JSON value`);
}

function validateTaggedRecords(value: unknown, at: string): void {
  const exportable = new Set(ACCOUNT_DATA_INVENTORY.filter((entry) => entry.exportDisposition !== "exclude").map((entry) => entry.store));
  for (const [index, item] of arrayValue(value, at).entries()) {
    const tagged = recordValue(item, `${at}[${index}]`);
    exactKeys(tagged, ["table", "record"], `${at}[${index}]`);
    const tableName = stringValue(tagged.table, `${at}[${index}].table`);
    if (!exportable.has(tableName)) throw new TypeError(`${at}[${index}].table is not exportable`);
    recordValue(tagged.record, `${at}[${index}].record`);
    validateJsonValue(tagged.record, `${at}[${index}].record`);
  }
}

function validateOwnedRuns(value: unknown): void {
  const seen = new Set<string>();
  for (const [index, item] of arrayValue(value, "ownedRuns.value").entries()) {
    const run = recordValue(item, `ownedRuns.value[${index}]`);
    exactKeys(run, ["id", "title", "schemaVersion", "replayable", "snapshot", "importedGame", "grants", "derivations"], `ownedRuns.value[${index}]`);
    const id = stringValue(run.id, `ownedRuns.value[${index}].id`);
    if (seen.has(id)) throw new TypeError(`ownedRuns.value contains duplicate run ${id}`);
    seen.add(id);
    stringValue(run.title, `ownedRuns.value[${index}].title`);
    stringValue(run.schemaVersion, `ownedRuns.value[${index}].schemaVersion`);
    if (typeof run.replayable !== "boolean") throw new TypeError(`ownedRuns.value[${index}].replayable must be a boolean`);
    const snapshot = recordValue(run.snapshot, `ownedRuns.value[${index}].snapshot`);
    if (snapshot.kind === "parsed") {
      exactKeys(snapshot, ["kind", "value"], `ownedRuns.value[${index}].snapshot`);
      const document = recordValue(snapshot.value, `ownedRuns.value[${index}].snapshot.value`);
      validateJsonValue(document, `ownedRuns.value[${index}].snapshot.value`);
      if (document.id !== id) throw new TypeError(`ownedRuns.value[${index}] snapshot id does not match its export id`);
      if (run.replayable !== true) throw new TypeError(`ownedRuns.value[${index}] parsed snapshot must be replayable`);
    } else if (snapshot.kind === "raw") {
      exactKeys(snapshot, ["kind", "utf8", "diagnostic"], `ownedRuns.value[${index}].snapshot`);
      stringValue(snapshot.utf8, `ownedRuns.value[${index}].snapshot.utf8`);
      const diagnostic = recordValue(snapshot.diagnostic, `ownedRuns.value[${index}].snapshot.diagnostic`);
      exactKeys(diagnostic, ["code", "message"], `ownedRuns.value[${index}].snapshot.diagnostic`);
      if (!["INVALID_JSON", "UNSUPPORTED_RUN_SCHEMA", "INVALID_RUN_DOCUMENT"].includes(String(diagnostic.code))) throw new TypeError(`ownedRuns.value[${index}] diagnostic code is invalid`);
      stringValue(diagnostic.message, `ownedRuns.value[${index}].snapshot.diagnostic.message`);
      if (run.replayable !== false) throw new TypeError(`ownedRuns.value[${index}] raw snapshot cannot be replayable`);
    } else throw new TypeError(`ownedRuns.value[${index}].snapshot kind is invalid`);
    if (run.importedGame !== null) validateJsonValue(run.importedGame, `ownedRuns.value[${index}].importedGame`);
    arrayValue(run.grants, `ownedRuns.value[${index}].grants`).forEach((grant, grantIndex) => validateJsonValue(grant, `ownedRuns.value[${index}].grants[${grantIndex}]`));
    for (const [derivationIndex, derivationValue] of arrayValue(run.derivations, `ownedRuns.value[${index}].derivations`).entries()) {
      const derivation = recordValue(derivationValue, `ownedRuns.value[${index}].derivations[${derivationIndex}]`);
      exactKeys(derivation, ["derivedRunId", "sourceRunId", "sourceBranchId", "sourceNodeId", "kind", "createdAt"], `ownedRuns.value[${index}].derivations[${derivationIndex}]`);
      for (const field of ["derivedRunId", "sourceRunId", "sourceBranchId", "sourceNodeId", "createdAt"] as const) stringValue(derivation[field], `ownedRuns.value[${index}].derivations[${derivationIndex}].${field}`);
      if (derivation.kind !== "flip_sides") throw new TypeError(`ownedRuns.value[${index}].derivations[${derivationIndex}].kind is invalid`);
      if (derivation.derivedRunId !== id && derivation.sourceRunId !== id) throw new TypeError(`ownedRuns.value[${index}] contains an unrelated derivation`);
    }
  }
}

function validateSharedAccess(value: unknown): void {
  for (const [index, item] of arrayValue(value, "sharedAccess.value").entries()) {
    const shared = recordValue(item, `sharedAccess.value[${index}]`);
    exactKeys(shared, ["runId", "title", "role", "grantedAt", "contributions"], `sharedAccess.value[${index}]`);
    stringValue(shared.runId, `sharedAccess.value[${index}].runId`);
    stringValue(shared.title, `sharedAccess.value[${index}].title`);
    if (!["host", "participant", "spectator"].includes(String(shared.role))) throw new TypeError(`sharedAccess.value[${index}].role is invalid`);
    stringValue(shared.grantedAt, `sharedAccess.value[${index}].grantedAt`);
    validateTaggedRecords(shared.contributions, `sharedAccess.value[${index}].contributions`);
  }
}

export function validateAccountBundleV1(value: unknown): asserts value is AccountBundleV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("account bundle must be an object");
  exactKeys(value, TOP_LEVEL_KEYS, "account bundle");
  const bundle = value as Record<string, unknown>;
  if (bundle.format !== ACCOUNT_BUNDLE_FORMAT || bundle.formatVersion !== 1) throw new TypeError("account bundle format is unsupported");
  if (bundle.source === null || typeof bundle.source !== "object" || Array.isArray(bundle.source)) throw new TypeError("source must be an object");
  exactKeys(bundle.source, ["applicationVersion", "storageVersion", "runSchemaVersion"], "source");
  const source = bundle.source as Record<string, unknown>;
  if (typeof source.applicationVersion !== "string" || !Number.isSafeInteger(source.storageVersion) || typeof source.runSchemaVersion !== "string") throw new TypeError("source is invalid");
  for (const key of TOP_LEVEL_KEYS.slice(3)) projection(bundle[key], key);
  const accountProjection = bundle.account as Projection<unknown>;
  const account = recordValue(accountProjection.value, "account.value");
  exactKeys(account, ["handle", "displayName", "createdAt"], "account.value");
  stringValue(account.handle, "account.value.handle");
  if (account.displayName !== null) stringValue(account.displayName, "account.value.displayName");
  stringValue(account.createdAt, "account.value.createdAt");
  validateOwnedRuns((bundle.ownedRuns as Projection<unknown>).value);
  validateSharedAccess((bundle.sharedAccess as Projection<unknown>).value);
  for (const key of ["progress", "marks", "repertoires", "drafts", "publications", "liveAndSocial", "behavioralProfiles"] as const) {
    validateTaggedRecords((bundle[key] as Projection<unknown>).value, `${key}.value`);
  }
  for (const [index, item] of arrayValue((bundle.exclusions as Projection<unknown>).value, "exclusions.value").entries()) {
    const exclusion = recordValue(item, `exclusions.value[${index}]`);
    exactKeys(exclusion, ["kind", "reason"], `exclusions.value[${index}]`);
    stringValue(exclusion.kind, `exclusions.value[${index}].kind`);
    stringValue(exclusion.reason, `exclusions.value[${index}].reason`);
  }
}

export type DeletionEffectKind =
  | "run"
  | "shared_run"
  | "anonymous_link"
  | "progress"
  | "mark"
  | "repertoire"
  | "draft"
  | "publication"
  | "live_session"
  | "classroom"
  | "behavioral_profile"
  | "account";

export interface DeletionEffect {
  readonly kind: DeletionEffectKind;
  readonly count: number;
  readonly objectIds: readonly string[];
  readonly label: string;
}

export interface DeletionPreviewV1 {
  readonly version: 1;
  readonly scope: { readonly kind: "account" } | { readonly kind: "run"; readonly runId: string };
  readonly digest: `sha256:${string}`;
  readonly hardDelete: readonly DeletionEffect[];
  readonly tombstone: readonly DeletionEffect[];
  readonly revoke: readonly DeletionEffect[];
  readonly retainedPublished: readonly DeletionEffect[];
  readonly backupNotice: string;
}

export interface DeletionRunFact {
  readonly id: string;
  readonly title: string;
  readonly activeForeignGranteeIds: readonly string[];
  readonly foreignOwnedDerivedRunIds: readonly string[];
  readonly anonymousLinkIds: readonly string[];
}

export interface DeletionPlanInput {
  readonly scope: DeletionPreviewV1["scope"];
  readonly runs: readonly DeletionRunFact[];
  readonly hardDelete: readonly DeletionEffect[];
  readonly tombstone?: readonly DeletionEffect[];
  readonly revoke?: readonly DeletionEffect[];
  readonly retainedPublished: readonly DeletionEffect[];
  readonly backupNotice?: string;
  /** Canonical storage facts that affect consent but must not be disclosed in the preview. */
  readonly stateFingerprint?: JsonValue;
}

function normalizedEffects(effects: readonly DeletionEffect[]): readonly DeletionEffect[] {
  return Object.freeze(effects.filter((effect) => effect.count > 0).map((effect) => Object.freeze({ ...effect, objectIds: Object.freeze([...effect.objectIds].sort()) })).sort((a, b) => a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label)));
}

export function planDeletion(input: DeletionPlanInput): DeletionPreviewV1 {
  const hardDelete = [...input.hardDelete];
  const tombstone: DeletionEffect[] = [...(input.tombstone ?? [])];
  const revoke: DeletionEffect[] = [...(input.revoke ?? [])];
  for (const run of [...input.runs].sort((a, b) => a.id.localeCompare(b.id))) {
    const shared = run.activeForeignGranteeIds.length > 0 || run.foreignOwnedDerivedRunIds.length > 0;
    (shared ? tombstone : hardDelete).push({ kind: shared ? "shared_run" : "run", count: 1, objectIds: [run.id], label: shared ? `${run.title} remains read-only for collaborators` : `${run.title} is permanently deleted` });
    if (run.anonymousLinkIds.length > 0) revoke.push({ kind: "anonymous_link", count: run.anonymousLinkIds.length, objectIds: run.anonymousLinkIds, label: `Anonymous links for ${run.title} stop working` });
  }
  const withoutDigest = Object.freeze({
    version: 1 as const,
    scope: input.scope,
    hardDelete: normalizedEffects(hardDelete),
    tombstone: normalizedEffects(tombstone),
    revoke: normalizedEffects(revoke),
    retainedPublished: normalizedEffects(input.retainedPublished),
    backupNotice: input.backupNotice ?? "Live data is removed immediately; backup retention is deployment-managed and account deletion cannot purge an existing backup.",
  });
  const digestInput = Object.freeze({ preview: withoutDigest, stateFingerprint: input.stateFingerprint ?? null });
  const digest = `sha256:${createHash("sha256").update(canonicalJson(digestInput as unknown as JsonValue)).digest("hex")}` as const;
  return Object.freeze({ ...withoutDigest, digest });
}
