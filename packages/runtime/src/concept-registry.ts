// rfc/concept-registry.md §§1–2 — the one cross-pack concept identity authority.
//
// `compileConceptRegistry(headBytes, revisionFiles)` is the only mint. It validates the closed head
// and every immutable revision (exact keys, UTF-8 and Unicode-scalar validity, byte bounds,
// canonical bytes — which also refuses duplicate JSON keys, since `JSON.parse` keeps the last
// duplicate and the re-serialised value then differs from the source — filename-to-digest
// equality, a complete acyclic predecessor chain and lifecycle monotonicity) and returns a deeply
// frozen registry whose identity is recorded in a module-private WeakSet. Every consumer that must
// trust a registry calls `assertCompiledConceptRegistry`: a structural lookalike carrying a valid
// digest is refused ([[D2963]]).
//
// The registry states only that an authored vocabulary entry exists. It carries no valence,
// category, definition, difficulty, evidence predicate or teaching prose (§5).
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { sha256Hex } from "./assistance-exchange.js";

export const CONCEPT_REGISTRY_SCHEMA_VERSION = 1 as const;
/** The Unicode-data version `labelCollisionKeyV1` is pinned to (§1). */
export const CONCEPT_LABEL_COLLISION_UNICODE_VERSION = "17.0" as const;
export const CONCEPT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
export const CONCEPT_REGISTRY_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/u;
export const CONCEPT_ID_MAX_BYTES = 80;
export const CONCEPT_LABEL_MAX_BYTES = 100;

declare const conceptIdBrand: unique symbol;
export type ConceptId = string & { readonly [conceptIdBrand]: true };
export type ConceptRegistryDigest = `sha256:${string}`;
export type ConceptStatus = "active" | "retired";

export interface ConceptRegistryEntry {
  readonly id: ConceptId;
  readonly label: string;
  readonly status: ConceptStatus;
}

export interface ConceptRegistryDocument {
  readonly schemaVersion: typeof CONCEPT_REGISTRY_SCHEMA_VERSION;
  readonly previousDigest: ConceptRegistryDigest | null;
  readonly entries: readonly ConceptRegistryEntry[];
}

export interface ConceptRegistryHead {
  readonly schemaVersion: typeof CONCEPT_REGISTRY_SCHEMA_VERSION;
  readonly digest: ConceptRegistryDigest;
}

/** Identity only: a `ConceptRef` never claims occurrence by itself (§2). */
export interface ConceptRef {
  readonly id: ConceptId;
  readonly registrySchemaVersion: typeof CONCEPT_REGISTRY_SCHEMA_VERSION;
  readonly registryDigest: ConceptRegistryDigest;
}

/** An exact historical ref renders from its named revision, or abstains by name (§6). */
export type ConceptResolution =
  | { readonly kind: "resolved"; readonly ref: ConceptRef; readonly label: string; readonly status: ConceptStatus }
  | { readonly kind: "registry_revision_unavailable"; readonly ref: ConceptRef };

export type ConceptRegistryErrorCode =
  | "CONCEPT_REGISTRY_UNICODE_VERSION"
  | "CONCEPT_REGISTRY_BYTES"
  | "CONCEPT_REGISTRY_JSON"
  | "CONCEPT_REGISTRY_SHAPE"
  | "CONCEPT_REGISTRY_NONCANONICAL"
  | "CONCEPT_REGISTRY_ORDER"
  | "CONCEPT_REGISTRY_DUPLICATE_ID"
  | "CONCEPT_REGISTRY_LABEL_COLLISION"
  | "CONCEPT_REGISTRY_HISTORY_MISSING"
  | "CONCEPT_REGISTRY_HISTORY_MISNAMED"
  | "CONCEPT_REGISTRY_HISTORY_CYCLE"
  | "CONCEPT_REGISTRY_HISTORY_ORPHAN"
  | "CONCEPT_REGISTRY_ID_REMOVED"
  | "CONCEPT_REGISTRY_REACTIVATED"
  | "CONCEPT_REGISTRY_AUTHORITY"
  | "CONCEPT_REF_INVALID"
  | "CONCEPT_UNREGISTERED";

export class ConceptRegistryError extends Error {
  readonly code: ConceptRegistryErrorCode;
  constructor(code: ConceptRegistryErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "ConceptRegistryError";
    this.code = code;
  }
}

function fail(code: ConceptRegistryErrorCode, message: string): never {
  throw new ConceptRegistryError(code, message);
}

const encoder = new TextEncoder();
const byteLength = (value: string): number => encoder.encode(value).length;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: unknown, keys: readonly string[], where: string): asserts value is Readonly<Record<string, unknown>> {
  if (!isRecord(value)) fail("CONCEPT_REGISTRY_SHAPE", `${where} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail("CONCEPT_REGISTRY_SHAPE", `${where} must carry exactly ${expected.join(", ")}; found ${actual.join(", ")}`);
  }
}

// With the `u` flag a surrogate-range class matches only unpaired surrogates.
const LONE_SURROGATE = /[\uD800-\uDFFF]/u;

function wellFormed(value: string, where: string): string {
  if (LONE_SURROGATE.test(value)) fail("CONCEPT_REGISTRY_SHAPE", `${where} is not a Unicode scalar string`);
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const key of Reflect.ownKeys(value)) deepFreeze((value as Record<PropertyKey, unknown>)[key]);
    Object.freeze(value);
  }
  return value;
}

/** Locale-free code-unit order; `Array.prototype.sort` default comparison on strings. */
function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * The versioned, locale-free v1 label-collision key (§1): NFKC, ECMA-262 default lower-casing,
 * the two explicit full-fold expansions `ß → ss` and `ς → σ`, then NFC. Changing any step or the
 * pinned Unicode-data version is a compiler version change.
 */
export function labelCollisionKeyV1(label: string): string {
  assertConceptUnicodeData();
  const lowered = wellFormed(label, "label").normalize("NFKC").toLowerCase();
  return lowered.replaceAll("ß", "ss").replaceAll("ς", "σ").normalize("NFC");
}

/** Refuses a runtime whose Unicode data differs from the pinned version, or cannot be verified. */
export function assertConceptUnicodeData(): void {
  const version = (globalThis as { readonly process?: { readonly versions?: { readonly unicode?: string } } }).process?.versions?.unicode;
  if (version !== CONCEPT_LABEL_COLLISION_UNICODE_VERSION) {
    fail("CONCEPT_REGISTRY_UNICODE_VERSION", `labelCollisionKeyV1 requires Unicode data ${CONCEPT_LABEL_COLLISION_UNICODE_VERSION}; this runtime reports ${version ?? "none"}`);
  }
}

export function isConceptId(value: unknown): value is ConceptId {
  return typeof value === "string" && value.length > 0 && byteLength(value) <= CONCEPT_ID_MAX_BYTES && CONCEPT_ID_PATTERN.test(value);
}

/**
 * The deterministic seed transform for an existing author-written slug (§1): hyphens become
 * spaces and the first letter is capitalised. It makes no chess claim; every seeded label is
 * reviewed as content (Discharge D2).
 */
export function conceptSlugToLabel(id: string): string {
  if (!isConceptId(id)) fail("CONCEPT_REGISTRY_SHAPE", `${JSON.stringify(id)} is not a concept id`);
  const words = id.replaceAll("-", " ");
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

/**
 * The registry's canonical bytes: sorted keys, two-space indentation, one trailing newline. It is
 * RFC 8785 string/number serialisation laid out for line-by-line label review.
 */
export function canonicalConceptRegistryBytes(value: unknown): string {
  const visit = (candidate: unknown, indent: string): string => {
    if (candidate === null || typeof candidate !== "object") return canonicalizeJson(candidate);
    const inner = `${indent}  `;
    if (Array.isArray(candidate)) {
      return candidate.length === 0 ? "[]" : `[\n${candidate.map((item) => `${inner}${visit(item, inner)}`).join(",\n")}\n${indent}]`;
    }
    const record = candidate as Readonly<Record<string, unknown>>;
    const keys = Object.keys(record).sort(compareIds);
    return keys.length === 0 ? "{}" : `{\n${keys.map((key) => `${inner}${canonicalizeJson(key)}: ${visit(record[key], inner)}`).join(",\n")}\n${indent}}`;
  };
  return `${visit(value, "")}\n`;
}

export function conceptRegistryDigest(bytes: string): ConceptRegistryDigest {
  return `sha256:${sha256Hex(bytes)}`;
}

/** Builds canonical revision bytes (generator/test helper; the compiler re-validates them). */
export function conceptRegistryRevisionBytes(previousDigest: ConceptRegistryDigest | null, entries: readonly { readonly id: string; readonly label: string; readonly status: ConceptStatus }[]): string {
  return canonicalConceptRegistryBytes({
    schemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION,
    previousDigest,
    entries: [...entries].sort((left, right) => compareIds(left.id, right.id)).map((entry) => ({ id: entry.id, label: entry.label, status: entry.status })),
  });
}

export function conceptRegistryHeadBytes(digest: ConceptRegistryDigest): string {
  return canonicalConceptRegistryBytes({ schemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION, digest });
}

function decode(source: string | Uint8Array, where: string): string {
  if (typeof source === "string") return wellFormed(source, where);
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(source);
  } catch {
    return fail("CONCEPT_REGISTRY_BYTES", `${where} is not valid UTF-8`);
  }
}

function parseJson(text: string, where: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    return fail("CONCEPT_REGISTRY_JSON", `${where} is not JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function digestValue(value: unknown, where: string): ConceptRegistryDigest {
  if (typeof value !== "string" || !CONCEPT_REGISTRY_DIGEST_PATTERN.test(value)) fail("CONCEPT_REGISTRY_SHAPE", `${where} must be a lower-case sha256 digest`);
  return value as ConceptRegistryDigest;
}

function parseHead(text: string): ConceptRegistryHead {
  const value = parseJson(text, "current.json");
  exactKeys(value, ["digest", "schemaVersion"], "current.json");
  if (value.schemaVersion !== CONCEPT_REGISTRY_SCHEMA_VERSION) fail("CONCEPT_REGISTRY_SHAPE", "current.json schemaVersion must be 1");
  const head = { schemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION, digest: digestValue(value.digest, "current.json digest") } as const;
  if (text !== canonicalConceptRegistryBytes(head)) fail("CONCEPT_REGISTRY_NONCANONICAL", "current.json is not canonical bytes (duplicate keys, spacing or order)");
  return deepFreeze(head);
}

function parseRevision(text: string, where: string): ConceptRegistryDocument {
  const value = parseJson(text, where);
  exactKeys(value, ["entries", "previousDigest", "schemaVersion"], where);
  if (value.schemaVersion !== CONCEPT_REGISTRY_SCHEMA_VERSION) fail("CONCEPT_REGISTRY_SHAPE", `${where} schemaVersion must be 1`);
  const previousDigest = value.previousDigest === null ? null : digestValue(value.previousDigest, `${where} previousDigest`);
  if (!Array.isArray(value.entries)) fail("CONCEPT_REGISTRY_SHAPE", `${where} entries must be an array`);
  const ids = new Set<string>();
  const labels = new Map<string, string>();
  let previousId: string | undefined;
  const entries = value.entries.map((raw: unknown, index: number): ConceptRegistryEntry => {
    const at = `${where} entries/${index}`;
    exactKeys(raw, ["id", "label", "status"], at);
    if (typeof raw.id !== "string" || typeof raw.label !== "string") fail("CONCEPT_REGISTRY_SHAPE", `${at} id and label must be strings`);
    const id = wellFormed(raw.id, `${at}/id`);
    const label = wellFormed(raw.label, `${at}/label`);
    if (!isConceptId(id)) fail("CONCEPT_REGISTRY_SHAPE", `${at}/id ${JSON.stringify(id)} must match ${CONCEPT_ID_PATTERN.source} within ${CONCEPT_ID_MAX_BYTES} UTF-8 bytes`);
    if (label.trim() !== label || byteLength(label) < 1 || byteLength(label) > CONCEPT_LABEL_MAX_BYTES) fail("CONCEPT_REGISTRY_SHAPE", `${at}/label must be a trimmed 1-${CONCEPT_LABEL_MAX_BYTES}-byte string`);
    if (raw.status !== "active" && raw.status !== "retired") fail("CONCEPT_REGISTRY_SHAPE", `${at}/status must be active or retired`);
    if (ids.has(id)) fail("CONCEPT_REGISTRY_DUPLICATE_ID", `${at}/id ${id} repeats`);
    if (previousId !== undefined && compareIds(previousId, id) >= 0) fail("CONCEPT_REGISTRY_ORDER", `${at}/id ${id} is out of order after ${previousId}`);
    const key = labelCollisionKeyV1(label);
    const collided = labels.get(key);
    if (collided !== undefined) fail("CONCEPT_REGISTRY_LABEL_COLLISION", `${at}/label ${JSON.stringify(label)} collides with ${collided}`);
    ids.add(id);
    labels.set(key, id);
    previousId = id;
    return { id: id as ConceptId, label, status: raw.status };
  });
  const revision: ConceptRegistryDocument = { schemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION, previousDigest, entries };
  if (text !== canonicalConceptRegistryBytes(revision)) fail("CONCEPT_REGISTRY_NONCANONICAL", `${where} is not canonical bytes (duplicate keys, spacing or order)`);
  return deepFreeze(revision);
}

// ---------------------------------------------------------------------------------------------
// The compiled registry — private authority

export interface CompiledConceptRegistry {
  readonly schemaVersion: typeof CONCEPT_REGISTRY_SCHEMA_VERSION;
  /** The current head digest. */
  readonly digest: ConceptRegistryDigest;
  /** Current entries in id order. */
  readonly entries: readonly ConceptRegistryEntry[];
  /** Every reachable revision digest, oldest first; the last is `digest`. */
  readonly revisions: readonly ConceptRegistryDigest[];
  has(id: string): boolean;
  get(id: string): ConceptRegistryEntry | undefined;
  /** The current entry, or `CONCEPT_UNREGISTERED`. */
  required(id: string): ConceptRegistryEntry;
  /** The current-revision `ConceptRef` of a registered id. */
  ref(id: string): ConceptRef;
  active(): readonly ConceptRegistryEntry[];
  retired(): readonly ConceptRegistryEntry[];
  revision(digest: string): ConceptRegistryDocument | undefined;
  /** Exact historical resolution: label/status from the ref's named revision, never the current one. */
  resolve(ref: unknown): ConceptResolution;
}

const COMPILED = new WeakSet<object>();

export function isCompiledConceptRegistry(value: unknown): value is CompiledConceptRegistry {
  return value !== null && typeof value === "object" && COMPILED.has(value);
}

/** Refuses any registry not minted by `compileConceptRegistry` in this process ([[D2963]]). */
export function assertCompiledConceptRegistry(value: unknown): asserts value is CompiledConceptRegistry {
  if (!isCompiledConceptRegistry(value)) fail("CONCEPT_REGISTRY_AUTHORITY", "only the output of compileConceptRegistry is a concept registry");
}

/**
 * The only registry mint (§2). `revisionFiles` maps `<sha256-hex>.json` basenames to their bytes;
 * every file must be reachable from the head, and each filename must equal its content digest.
 */
export function compileConceptRegistry(headBytes: string | Uint8Array, revisionFiles: Readonly<Record<string, string | Uint8Array>>): CompiledConceptRegistry {
  assertConceptUnicodeData();
  const head = parseHead(decode(headBytes, "current.json"));
  const texts = new Map<string, string>();
  for (const [name, bytes] of Object.entries(revisionFiles)) {
    if (!/^[0-9a-f]{64}\.json$/u.test(name)) fail("CONCEPT_REGISTRY_HISTORY_MISNAMED", `revision file ${JSON.stringify(name)} is not <sha256-hex>.json`);
    texts.set(name, decode(bytes, name));
  }
  const chain: { readonly digest: ConceptRegistryDigest; readonly revision: ConceptRegistryDocument }[] = [];
  const visited = new Set<string>();
  let cursor: ConceptRegistryDigest | null = head.digest;
  while (cursor !== null) {
    if (visited.has(cursor)) fail("CONCEPT_REGISTRY_HISTORY_CYCLE", `revision ${cursor} repeats in its predecessor chain`);
    visited.add(cursor);
    const name: string = `${cursor.slice("sha256:".length)}.json`;
    const text = texts.get(name);
    if (text === undefined) fail("CONCEPT_REGISTRY_HISTORY_MISSING", `revision ${cursor} is absent`);
    if (conceptRegistryDigest(text) !== cursor) fail("CONCEPT_REGISTRY_HISTORY_MISNAMED", `revision file ${name} does not hash to its name`);
    const revision = parseRevision(text, name);
    chain.push({ digest: cursor, revision });
    cursor = revision.previousDigest;
  }
  const orphan = [...texts.keys()].find((name) => !visited.has(`sha256:${name.slice(0, -".json".length)}`));
  if (orphan !== undefined) fail("CONCEPT_REGISTRY_HISTORY_ORPHAN", `revision file ${orphan} is not reachable from current.json`);
  chain.reverse();
  for (let index = 1; index < chain.length; index += 1) {
    const prior = chain[index - 1]!.revision;
    const next = new Map(chain[index]!.revision.entries.map((entry) => [entry.id, entry]));
    for (const entry of prior.entries) {
      const successor = next.get(entry.id);
      if (successor === undefined) fail("CONCEPT_REGISTRY_ID_REMOVED", `revision ${chain[index]!.digest} removes ${entry.id}`);
      if (entry.status === "retired" && successor.status !== "retired") fail("CONCEPT_REGISTRY_REACTIVATED", `revision ${chain[index]!.digest} reactivates retired ${entry.id}`);
    }
  }
  return mint(head.digest, chain);
}

function mint(digest: ConceptRegistryDigest, chain: readonly { readonly digest: ConceptRegistryDigest; readonly revision: ConceptRegistryDocument }[]): CompiledConceptRegistry {
  const history = new Map(chain.map((row) => [row.digest, row.revision]));
  const current = history.get(digest)!;
  const byId = new Map(current.entries.map((entry) => [entry.id as string, entry]));
  const active = Object.freeze(current.entries.filter((entry) => entry.status === "active"));
  const retired = Object.freeze(current.entries.filter((entry) => entry.status === "retired"));
  const required = (id: string): ConceptRegistryEntry => {
    const entry = byId.get(id);
    if (entry === undefined) fail("CONCEPT_UNREGISTERED", `${JSON.stringify(id)} is not a registered concept id`);
    return entry;
  };
  const registry: CompiledConceptRegistry = {
    schemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION,
    digest,
    entries: current.entries,
    revisions: Object.freeze(chain.map((row) => row.digest)),
    has: (id) => byId.has(id),
    get: (id) => byId.get(id),
    required,
    ref: (id) => deepFreeze({ id: required(id).id, registrySchemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION, registryDigest: digest }),
    active: () => active,
    retired: () => retired,
    revision: (candidate) => history.get(candidate as ConceptRegistryDigest),
    resolve: (input) => {
      const ref = parseConceptRef(input);
      const revision = history.get(ref.registryDigest);
      if (revision === undefined) return deepFreeze({ kind: "registry_revision_unavailable", ref });
      const entry = revision.entries.find((candidate) => candidate.id === ref.id);
      if (entry === undefined) fail("CONCEPT_REF_INVALID", `${ref.id} is absent from its named revision ${ref.registryDigest}`);
      return deepFreeze({ kind: "resolved", ref, label: entry.label, status: entry.status });
    },
  };
  deepFreeze(registry);
  COMPILED.add(registry);
  return registry;
}

/**
 * Accepts exactly `{ id, registrySchemaVersion, registryDigest }`, validates the slug, schema
 * literal and full lower-case digest, and returns a sealed copy; the caller's object is never kept.
 */
export function parseConceptRef(input: unknown): ConceptRef {
  if (!isRecord(input)) fail("CONCEPT_REF_INVALID", "a concept ref must be an object");
  const keys = Object.keys(input).sort();
  if (keys.join(",") !== "id,registryDigest,registrySchemaVersion") fail("CONCEPT_REF_INVALID", `a concept ref carries exactly id, registrySchemaVersion and registryDigest; found ${keys.join(", ")}`);
  if (!isConceptId(input.id)) fail("CONCEPT_REF_INVALID", "concept ref id is not a registered-id slug");
  if (input.registrySchemaVersion !== CONCEPT_REGISTRY_SCHEMA_VERSION) fail("CONCEPT_REF_INVALID", "concept ref registrySchemaVersion must be 1");
  if (typeof input.registryDigest !== "string" || !CONCEPT_REGISTRY_DIGEST_PATTERN.test(input.registryDigest)) fail("CONCEPT_REF_INVALID", "concept ref registryDigest must be a lower-case sha256 digest");
  return deepFreeze({ id: input.id, registrySchemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION, registryDigest: input.registryDigest as ConceptRegistryDigest });
}

/** The persisted global identity key of a registered concept (§4). */
export function registeredConceptKey(id: ConceptId): `concept:${string}@1` {
  return `concept:${id}@1`;
}

export const REGISTERED_CONCEPT_KEY_PATTERN = /^concept:([a-z0-9]+(?:-[a-z0-9]+)*)@1$/u;

// ---------------------------------------------------------------------------------------------
// Consumer operations (§2's six landing consumers call these, never a local map)

export type ConceptReferenceIssueCode = "CONCEPT_ID_MALFORMED" | "CONCEPT_UNREGISTERED" | "CONCEPT_RETIRED";

export interface ConceptReferenceIssue {
  readonly code: ConceptReferenceIssueCode;
  readonly index: number;
  readonly id: string;
  readonly message: string;
}

/**
 * Consumer 1 (pack lint/publication): every `concepts[]` item must be a well-formed registered,
 * active id. A retired id is refused as a new reference.
 */
export function validateConceptReferences(registry: CompiledConceptRegistry, concepts: readonly unknown[]): readonly ConceptReferenceIssue[] {
  assertCompiledConceptRegistry(registry);
  const issues: ConceptReferenceIssue[] = [];
  for (const [index, raw] of concepts.entries()) {
    const id = String(raw);
    if (!isConceptId(raw)) {
      issues.push(Object.freeze({ code: "CONCEPT_ID_MALFORMED", index, id, message: `Concept ${JSON.stringify(id)} is not a registered-id slug` }));
      continue;
    }
    const entry = registry.get(raw);
    if (entry === undefined) issues.push(Object.freeze({ code: "CONCEPT_UNREGISTERED", index, id, message: `Concept ${JSON.stringify(id)} is not in the concept registry ${registry.digest}` }));
    else if (entry.status === "retired") issues.push(Object.freeze({ code: "CONCEPT_RETIRED", index, id, message: `Concept ${JSON.stringify(id)} is retired and cannot be newly referenced` }));
  }
  return Object.freeze(issues);
}

/** The typed current-catalogue projection served to Pack Studio and web parsers (§6). */
export interface ConceptCatalogueView {
  readonly schemaVersion: typeof CONCEPT_REGISTRY_SCHEMA_VERSION;
  readonly registryDigest: ConceptRegistryDigest;
  readonly entries: readonly { readonly id: string; readonly label: string; readonly status: ConceptStatus }[];
}

/** Consumer 2 (Pack Studio picker): the whole current catalogue, retired entries marked. */
export function conceptCatalogueView(registry: CompiledConceptRegistry): ConceptCatalogueView {
  assertCompiledConceptRegistry(registry);
  return deepFreeze({
    schemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION,
    registryDigest: registry.digest,
    entries: registry.entries.map((entry) => ({ id: entry.id as string, label: entry.label, status: entry.status })),
  });
}

/** A resolved occurrence-free identity: the key the store writes, its label and exact ref. */
export interface ResolvedConcept {
  readonly key: `concept:${string}@1`;
  readonly label: string;
  readonly ref: ConceptRef;
}

/** Consumer 3 (progress resolver): the global key, current label and current-revision ref. */
export function resolveRegisteredConcept(registry: CompiledConceptRegistry, raw: string): ResolvedConcept {
  assertCompiledConceptRegistry(registry);
  const entry = registry.required(raw);
  return deepFreeze({ key: registeredConceptKey(entry.id), label: entry.label, ref: registry.ref(entry.id) });
}

/** A label view for a stored registered row: exact historical label, or a typed abstention. */
export interface ConceptLabelView {
  readonly id: string;
  readonly label: string;
  readonly status: ConceptStatus | "unverified";
  readonly registryDigest: ConceptRegistryDigest;
  readonly revision: "resolved" | "registry_revision_unavailable";
}

/**
 * Consumers 4–6 (related query, account export, web label rendering): an exact historical ref
 * renders its named revision's label; an absent revision renders the stored occurrence-time
 * label with `registry_revision_unavailable` and never substitutes the current label.
 */
export function conceptLabelView(registry: CompiledConceptRegistry, ref: unknown, storedLabel: string): ConceptLabelView {
  assertCompiledConceptRegistry(registry);
  const resolution = registry.resolve(ref);
  return resolution.kind === "resolved"
    ? deepFreeze({ id: resolution.ref.id as string, label: resolution.label, status: resolution.status, registryDigest: resolution.ref.registryDigest, revision: "resolved" })
    : deepFreeze({ id: resolution.ref.id as string, label: storedLabel, status: "unverified", registryDigest: resolution.ref.registryDigest, revision: "registry_revision_unavailable" });
}

// ---------------------------------------------------------------------------------------------
// Wire parsers (consumer 6: web/API parsers that render concept labels). The browser never
// compiles a registry; it strictly parses the server's typed projection and renders its labels.

function wireRecord(value: unknown, keys: readonly string[], where: string): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) fail("CONCEPT_REF_INVALID", `${where} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.join(",") !== expected.join(",")) fail("CONCEPT_REF_INVALID", `${where} must carry exactly ${expected.join(", ")}`);
  return value;
}

function wireLabel(value: unknown, where: string): string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0 || byteLength(value) > CONCEPT_LABEL_MAX_BYTES) fail("CONCEPT_REF_INVALID", `${where} must be a trimmed registry label`);
  return value;
}

/** Strictly parses `GET /packs/concepts`'s catalogue projection. */
export function parseConceptCatalogueView(value: unknown): ConceptCatalogueView {
  const record = wireRecord(value, ["schemaVersion", "registryDigest", "entries"], "concept catalogue");
  if (record.schemaVersion !== CONCEPT_REGISTRY_SCHEMA_VERSION) fail("CONCEPT_REF_INVALID", "concept catalogue schemaVersion must be 1");
  if (typeof record.registryDigest !== "string" || !CONCEPT_REGISTRY_DIGEST_PATTERN.test(record.registryDigest)) fail("CONCEPT_REF_INVALID", "concept catalogue registryDigest must be a sha256 digest");
  if (!Array.isArray(record.entries)) fail("CONCEPT_REF_INVALID", "concept catalogue entries must be an array");
  let previous: string | undefined;
  const entries = record.entries.map((raw: unknown, index: number) => {
    const entry = wireRecord(raw, ["id", "label", "status"], `concept catalogue entries/${index}`);
    if (!isConceptId(entry.id)) fail("CONCEPT_REF_INVALID", `concept catalogue entries/${index}/id is not a concept id`);
    if (previous !== undefined && compareIds(previous, entry.id) >= 0) fail("CONCEPT_REF_INVALID", "concept catalogue entries must be unique and id-ordered");
    previous = entry.id;
    if (entry.status !== "active" && entry.status !== "retired") fail("CONCEPT_REF_INVALID", `concept catalogue entries/${index}/status is invalid`);
    return { id: entry.id as string, label: wireLabel(entry.label, `concept catalogue entries/${index}/label`), status: entry.status as ConceptStatus };
  });
  return deepFreeze({ schemaVersion: CONCEPT_REGISTRY_SCHEMA_VERSION, registryDigest: record.registryDigest as ConceptRegistryDigest, entries });
}

/** Strictly parses one stored-row label view (a related attempt's shared concept). */
export function parseConceptLabelView(value: unknown, where = "concept"): ConceptLabelView {
  const record = wireRecord(value, ["id", "label", "status", "registryDigest", "revision"], where);
  if (!isConceptId(record.id)) fail("CONCEPT_REF_INVALID", `${where}/id is not a concept id`);
  if (typeof record.registryDigest !== "string" || !CONCEPT_REGISTRY_DIGEST_PATTERN.test(record.registryDigest)) fail("CONCEPT_REF_INVALID", `${where}/registryDigest must be a sha256 digest`);
  if (record.revision !== "resolved" && record.revision !== "registry_revision_unavailable") fail("CONCEPT_REF_INVALID", `${where}/revision is invalid`);
  const allowed = record.revision === "resolved" ? ["active", "retired"] : ["unverified"];
  if (!allowed.includes(String(record.status))) fail("CONCEPT_REF_INVALID", `${where}/status does not agree with its revision`);
  return deepFreeze({ id: record.id as string, label: wireLabel(record.label, `${where}/label`), status: record.status as ConceptLabelView["status"], registryDigest: record.registryDigest as ConceptRegistryDigest, revision: record.revision });
}
