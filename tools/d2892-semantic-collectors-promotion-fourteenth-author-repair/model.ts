// DISPOSABLE composed author model for D2892-D2896. Not production code.
import { readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import {
  INSTALLED_CONFIGURATIONS,
  type Digest,
  type InstalledPromotionConfiguration,
  type InstalledPromotionSnapshot,
  type InventoryEntry,
} from "./configuration-state.js";

type JsonObject = Record<string, unknown>;

interface FileReference { readonly path: string; readonly digest: Digest; }
interface ResponseDeclaration extends FileReference {
  readonly fen: string;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly bytes: number;
}
interface LegalDeclaration {
  readonly fen: string;
  readonly status: "available" | "unavailable";
  readonly path: string | null;
  readonly digest: Digest | null;
}
interface Generation {
  readonly schema: "tabiya.promotion-generation.v1";
  readonly generationId: string;
  readonly pack: FileReference;
  readonly sources: FileReference;
  readonly evidence: FileReference;
  readonly responses: readonly ResponseDeclaration[];
  readonly legalMaps: readonly LegalDeclaration[];
}

interface ValidatedGeneration {
  readonly entry: InventoryEntry;
  readonly root: string;
  readonly generation: Generation;
  readonly manifestDigest: Digest;
}

export interface PromotionArtifactStore {
  readonly application: PromotionApplication;
  readonly registry: PromotionInstallationRegistry;
  readonly generationId: string;
  readonly generation: Generation;
}

export interface PromotionInstallationRegistry {
  readonly application: PromotionApplication;
  readonly installation: InstalledPromotionSnapshot;
  readonly inventoryDigest: Digest;
  readonly generationIds: readonly string[];
  openGeneration(generationId: string): Promise<PromotionArtifactStore>;
}

export interface PromotionApplication {
  readonly configuration: InstalledPromotionConfiguration;
  readonly installation: InstalledPromotionSnapshot;
  openRegistry(): Promise<PromotionInstallationRegistry>;
}

const APPLICATIONS = new WeakSet<object>();
const REGISTRIES = new WeakSet<object>();
const STORES = new WeakSet<object>();

export function openPromotionApplication(
  configuration: InstalledPromotionConfiguration,
): PromotionApplication {
  const installation = INSTALLED_CONFIGURATIONS.get(configuration);
  if (installation === undefined) fail("INSTALLED_PROMOTION_CONFIGURATION_REQUIRED");
  let registryPromise: Promise<PromotionInstallationRegistry> | undefined;
  let application!: PromotionApplication;
  application = Object.freeze({
    configuration,
    installation,
    openRegistry() {
      if (!APPLICATIONS.has(application) || INSTALLED_CONFIGURATIONS.get(configuration) !== installation) {
        return Promise.reject(new TypeError("PROMOTION_APPLICATION_AUTHORITY_REQUIRED"));
      }
      if (registryPromise !== undefined) return registryPromise;
      const pending = buildRegistry(application, installation);
      registryPromise = pending;
      void pending.catch(() => {
        if (registryPromise === pending) registryPromise = undefined;
      });
      return pending;
    },
  });
  APPLICATIONS.add(application);
  return application;
}

async function buildRegistry(
  application: PromotionApplication,
  installation: InstalledPromotionSnapshot,
): Promise<PromotionInstallationRegistry> {
  // Publication follows validation of the complete declared generation population.
  const validated = await Promise.all(installation.entries.map((entry) => validateGeneration(installation, entry)));
  const byId = new Map(validated.map((item) => [item.entry.generationId, item]));
  const storePromises = new Map<string, Promise<PromotionArtifactStore>>();
  let registry!: PromotionInstallationRegistry;
  registry = Object.freeze({
    application,
    installation,
    inventoryDigest: installation.inventoryDigest,
    generationIds: Object.freeze(validated.map((item) => item.entry.generationId)),
    openGeneration(generationId: string) {
      if (!REGISTRIES.has(registry) || registry.application !== application || registry.installation !== installation) {
        return Promise.reject(new TypeError("PROMOTION_REGISTRY_UNSEALED"));
      }
      const current = storePromises.get(generationId);
      if (current !== undefined) return current;
      const generation = byId.get(generationId);
      if (generation === undefined) return Promise.reject(new TypeError("PROMOTION_GENERATION_NOT_INSTALLED"));
      const pending = buildStore(application, registry, installation, generation);
      storePromises.set(generationId, pending);
      void pending.catch(() => {
        if (storePromises.get(generationId) === pending) storePromises.delete(generationId);
      });
      return pending;
    },
  });
  REGISTRIES.add(registry);
  return registry;
}

async function buildStore(
  application: PromotionApplication,
  registry: PromotionInstallationRegistry,
  installation: InstalledPromotionSnapshot,
  expected: ValidatedGeneration,
): Promise<PromotionArtifactStore> {
  // A first open revalidates the retained generation identity. This is both the construction
  // failure boundary and the proof that publication cannot turn mutable path bytes into authority.
  const actual = await validateGeneration(installation, expected.entry);
  if (actual.manifestDigest !== expected.manifestDigest) fail("PROMOTION_GENERATION_CHANGED");
  const store = Object.freeze({
    application,
    registry,
    generationId: expected.entry.generationId,
    generation: expected.generation,
  });
  STORES.add(store);
  return store;
}

async function validateGeneration(
  installation: InstalledPromotionSnapshot,
  entry: InventoryEntry,
): Promise<ValidatedGeneration> {
  const root = resolve(installation.inventoryRoot, entry.directory);
  if (await realpath(root) !== root) fail("PROMOTION_GENERATION_PATH_CROSSED");
  const manifest = await canonicalFile(resolve(root, "promotion-generation.json"));
  if (manifest.digest !== entry.manifestDigest) fail("PROMOTION_GENERATION_DIGEST_MISMATCH");
  const generation = parsePromotionGeneration(manifest.value);
  if (generation.generationId !== entry.generationId) fail("PROMOTION_GENERATION_ID_CROSSED");
  const [packFile, , evidenceFile] = await Promise.all([
    declaredFile(root, generation.pack),
    declaredFile(root, generation.sources),
    declaredFile(root, generation.evidence),
    ...generation.responses.map((item) => declaredFile(root, item, item.bytes)),
    ...generation.legalMaps.flatMap((item) => item.status === "available"
      ? [declaredFile(root, { path: item.path!, digest: item.digest! })]
      : []),
  ]);
  assertRecordedSubjects(packFile.value, evidenceFile.value, generation.responses);
  return Object.freeze({ entry, root, generation, manifestDigest: manifest.digest });
}

async function declaredFile(
  root: string,
  declaration: Readonly<{ path: string; digest: Digest }>,
  expectedBytes?: number,
): Promise<Readonly<{ value: unknown; bytes: string; digest: Digest }>> {
  const path = resolve(root, declaration.path);
  if (await realpath(path) !== path) fail("PROMOTION_ARTIFACT_PATH_CROSSED");
  const file = await canonicalFile(path);
  if (file.digest !== declaration.digest) fail("PROMOTION_ARTIFACT_DIGEST_MISMATCH");
  if (expectedBytes !== undefined && Buffer.byteLength(file.bytes) !== expectedBytes) fail("PROMOTION_ARTIFACT_LENGTH_MISMATCH");
  return file;
}

async function canonicalFile(path: string): Promise<Readonly<{ value: unknown; bytes: string; digest: Digest }>> {
  const bytes = await readFile(path, "utf8");
  const value = JSON.parse(bytes) as unknown;
  if (bytes !== `${canonicalizeJson(value)}\n`) fail("PROMOTION_ARTIFACT_NONCANONICAL");
  return Object.freeze({ value: immutable(value), bytes, digest: sha256(bytes) as Digest });
}

export function parsePromotionGeneration(value: unknown): Generation {
  const row = object(value, "PROMOTION_GENERATION_INVALID");
  exact(row, ["schema", "generationId", "pack", "sources", "evidence", "responses", "legalMaps"], "PROMOTION_GENERATION_INVALID");
  if (row.schema !== "tabiya.promotion-generation.v1" || !nonempty(row.generationId) || !Array.isArray(row.responses) || !Array.isArray(row.legalMaps)) {
    fail("PROMOTION_GENERATION_INVALID");
  }
  const responses = row.responses.map((candidate) => {
    const item = object(candidate, "PROMOTION_RESPONSE_DECLARATION_INVALID");
    exact(item, ["fen", "sourceId", "retrievedAt", "path", "digest", "bytes"], "PROMOTION_RESPONSE_DECLARATION_INVALID");
    if (!nonempty(item.fen) || !nonempty(item.sourceId) || !instant(item.retrievedAt) || !relative(item.path) || !digest(item.digest) || !Number.isSafeInteger(item.bytes) || Number(item.bytes) <= 0) {
      fail("PROMOTION_RESPONSE_DECLARATION_INVALID");
    }
    return immutable({ fen: item.fen, sourceId: item.sourceId, retrievedAt: item.retrievedAt, path: item.path, digest: item.digest, bytes: item.bytes }) as ResponseDeclaration;
  });
  const legalMaps = row.legalMaps.map((candidate) => {
    const item = object(candidate, "PROMOTION_LEGAL_DECLARATION_INVALID");
    exact(item, ["fen", "status", "path", "digest"], "PROMOTION_LEGAL_DECLARATION_INVALID");
    if (!nonempty(item.fen) || (item.status !== "available" && item.status !== "unavailable")) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    if (item.status === "available" && (!relative(item.path) || !digest(item.digest))) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    if (item.status === "unavailable" && (item.path !== null || item.digest !== null)) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    return immutable({ fen: item.fen, status: item.status, path: item.path, digest: item.digest }) as LegalDeclaration;
  });
  if (responses.length === 0 || legalMaps.length === 0) fail("PROMOTION_GENERATION_EMPTY");
  requireUnique(responses.map(subject), "PROMOTION_RESPONSE_SUBJECT_AMBIGUOUS");
  requireUnique(responses.map((item) => item.fen), "PROMOTION_RESPONSE_FEN_AMBIGUOUS");
  requireUnique(legalMaps.map((item) => item.fen), "PROMOTION_LEGAL_FEN_AMBIGUOUS");
  setEqual(responses.map((item) => item.fen), legalMaps.map((item) => item.fen), "PROMOTION_RESPONSE_LEGAL_SET_MISMATCH");
  return immutable({
    schema: row.schema,
    generationId: row.generationId,
    pack: fileReference(row.pack),
    sources: fileReference(row.sources),
    evidence: fileReference(row.evidence),
    responses,
    legalMaps,
  }) as Generation;
}

function assertRecordedSubjects(pack: unknown, evidence: unknown, responses: readonly ResponseDeclaration[]): void {
  const packRow = object(pack, "PROMOTION_PACK_SUBJECT_INVALID");
  const start = object(packRow.start, "PROMOTION_PACK_SUBJECT_INVALID");
  if (!nonempty(start.fen)) fail("PROMOTION_PACK_SUBJECT_INVALID");
  const ledger = object(evidence, "PROMOTION_LEDGER_SUBJECT_INVALID");
  if (!Array.isArray(ledger.records)) fail("PROMOTION_LEDGER_SUBJECT_INVALID");
  const records = ledger.records.filter((candidate): candidate is JsonObject => candidate !== null && typeof candidate === "object" && !Array.isArray(candidate) && (candidate as JsonObject).kind === "tablebase_result");
  const subjects = records.map((record) => {
    const anchor = object(record.anchor, "PROMOTION_LEDGER_SUBJECT_INVALID");
    if (!nonempty(anchor.fen) || !nonempty(record.sourceId) || !instant(record.retrievedAt)) fail("PROMOTION_LEDGER_SUBJECT_INVALID");
    if (!Array.isArray(record.supports) || record.supports.length !== 1 || record.supports[0] !== "/start/fen" || start.fen !== anchor.fen) fail("PROMOTION_SUPPORT_SEMANTICS_CROSSED");
    return `${anchor.fen}\u0000${record.sourceId}\u0000${record.retrievedAt}`;
  });
  requireUnique(subjects, "PROMOTION_RECORDED_SUBJECT_AMBIGUOUS");
  setEqual(subjects, responses.map(subject), "PROMOTION_RECORDED_SUBJECT_SET_MISMATCH");
}

function fileReference(value: unknown): FileReference {
  const row = object(value, "PROMOTION_FILE_REFERENCE_INVALID");
  exact(row, ["path", "digest"], "PROMOTION_FILE_REFERENCE_INVALID");
  if (!relative(row.path) || !digest(row.digest)) fail("PROMOTION_FILE_REFERENCE_INVALID");
  return immutable({ path: row.path, digest: row.digest }) as FileReference;
}

function subject(value: ResponseDeclaration): string { return `${value.fen}\u0000${value.sourceId}\u0000${value.retrievedAt}`; }
function object(value: unknown, code: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code);
  return value as JsonObject;
}
function exact(value: JsonObject, keys: readonly string[], code: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code);
}
function nonempty(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function relative(value: unknown): value is string { return nonempty(value) && !value.startsWith("/") && !value.split("/").includes(".."); }
function digest(value: unknown): value is Digest { return typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value); }
function instant(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function requireUnique(values: readonly string[], code: string): void { if (new Set(values).size !== values.length) fail(code); }
function setEqual(left: readonly string[], right: readonly string[], code: string): void {
  const a = [...left].sort();
  const b = [...right].sort();
  if (a.length !== b.length || a.some((value, index) => value !== b[index])) fail(code);
}

function immutable<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T;
  return Object.freeze(Object.fromEntries(Object.entries(value as JsonObject).map(([key, child]) => [key, immutable(child)]))) as T;
}
function fail(code: string): never { throw new TypeError(code); }
