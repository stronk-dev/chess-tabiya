// DISPOSABLE bounded author repair for D2835-D2839. Not production code.
import { readFile, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import {
  assertPromotionRaceTablebaseResult,
  collectPromotionRaceTablebase,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
  recordedAuthorityReceipt,
  type PromotionArtifactStore,
  type PromotionInstallationRegistry as PriorRegistry,
  type ProviderExchangeScheduler,
  type ProviderSourceFactories,
  type SyzygyFixtureOutcome,
} from "../d2789-semantic-collectors-promotion-eleventh-author-repair/model.js";
import { openPromotionInstallationRegistry as openPriorRegistry } from "../d2789-semantic-collectors-promotion-eleventh-author-repair/model.js";

export {
  assertPromotionRaceTablebaseResult,
  collectPromotionRaceTablebase,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
  recordedAuthorityReceipt,
};
export type { PromotionArtifactStore, ProviderExchangeScheduler, ProviderSourceFactories, SyzygyFixtureOutcome };

type Digest = `sha256:${string}`;
type JsonObject = Record<string, unknown>;

export interface InstalledPromotionInventoryAuthority {
  readonly kind: "application_installed_promotion_inventory";
  readonly inventoryPath: string;
}

export interface PromotionInstallationRegistry extends PriorRegistry {
  readonly installationAuthority: InstalledPromotionInventoryAuthority;
}

interface InventoryEntry {
  readonly generationId: string;
  readonly directory: string;
  readonly manifestDigest: Digest;
}

interface ResponseDeclaration {
  readonly fen: string;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly path: string;
  readonly digest: Digest;
  readonly bytes: number;
}

interface LegalDeclaration {
  readonly fen: string;
  readonly status: "available" | "unavailable";
  readonly path: string | null;
  readonly digest: Digest | null;
}

interface GenerationDocument {
  readonly schema: "tabiya.promotion-generation.v1";
  readonly generationId: string;
  readonly pack: Readonly<{ path: string; digest: Digest }>;
  readonly sources: Readonly<{ path: string; digest: Digest }>;
  readonly evidence: Readonly<{ path: string; digest: Digest }>;
  readonly responses: readonly ResponseDeclaration[];
  readonly legalMaps: readonly LegalDeclaration[];
}

const AUTHORITIES = new WeakSet<object>();
const REGISTRIES = new WeakSet<object>();

// Production receives this opaque value from application composition. The path is not accepted by
// the product registry API. This factory is intentionally test-only in the disposable model.
export function createTestInstalledPromotionInventoryAuthority(inventoryPath: string): InstalledPromotionInventoryAuthority {
  if (typeof inventoryPath !== "string" || inventoryPath.length === 0) fail("PROMOTION_INSTALLATION_PATH_INVALID");
  const authority = Object.freeze({ kind: "application_installed_promotion_inventory" as const, inventoryPath: resolve(inventoryPath) });
  AUTHORITIES.add(authority);
  return authority;
}

export async function openPromotionInstallationRegistry(authority: InstalledPromotionInventoryAuthority): Promise<PromotionInstallationRegistry> {
  if (!AUTHORITIES.has(authority)) fail("PROMOTION_INSTALLATION_AUTHORITY_REQUIRED");
  const inventoryPath = await realpath(authority.inventoryPath);
  const inventory = await canonicalFile(inventoryPath);
  const root = dirname(inventoryPath);
  const entries = parseInventory(inventory.value);
  const prior = await openPriorRegistry(inventoryPath);
  let registry!: PromotionInstallationRegistry;
  registry = Object.freeze({
    installationAuthority: authority,
    inventoryDigest: prior.inventoryDigest,
    async openGeneration(generationId: string): Promise<PromotionArtifactStore> {
      if (!REGISTRIES.has(registry)) fail("PROMOTION_REGISTRY_UNSEALED");
      const entry = entries.find((candidate) => candidate.generationId === generationId);
      if (entry === undefined) fail("PROMOTION_GENERATION_NOT_INSTALLED");
      await validateGeneration(root, entry);
      return prior.openGeneration(generationId);
    },
  });
  REGISTRIES.add(registry);
  return registry;
}

export function parsePromotionGeneration(value: unknown): GenerationDocument {
  const row = object(value, "PROMOTION_GENERATION_INVALID");
  exact(row, ["schema", "generationId", "pack", "sources", "evidence", "responses", "legalMaps"], "PROMOTION_GENERATION_INVALID");
  if (row.schema !== "tabiya.promotion-generation.v1" || !nonempty(row.generationId) || !Array.isArray(row.responses) || !Array.isArray(row.legalMaps)) fail("PROMOTION_GENERATION_INVALID");
  const pack = fileRef(row.pack);
  const sources = fileRef(row.sources);
  const evidence = fileRef(row.evidence);
  const responses = row.responses.map((candidate) => {
    const item = object(candidate, "PROMOTION_RESPONSE_DECLARATION_INVALID");
    exact(item, ["fen", "sourceId", "retrievedAt", "path", "digest", "bytes"], "PROMOTION_RESPONSE_DECLARATION_INVALID");
    if (!nonempty(item.fen) || !nonempty(item.sourceId) || !instant(item.retrievedAt) || !relative(item.path) || !digest(item.digest) || !Number.isSafeInteger(item.bytes) || Number(item.bytes) <= 0) fail("PROMOTION_RESPONSE_DECLARATION_INVALID");
    return immutable({ fen: item.fen, sourceId: item.sourceId, retrievedAt: item.retrievedAt, path: item.path, digest: item.digest, bytes: item.bytes }) as ResponseDeclaration;
  });
  const legalMaps = row.legalMaps.map((candidate) => {
    const item = object(candidate, "PROMOTION_LEGAL_DECLARATION_INVALID");
    exact(item, ["fen", "status", "path", "digest"], "PROMOTION_LEGAL_DECLARATION_INVALID");
    if (!nonempty(item.fen) || !["available", "unavailable"].includes(String(item.status))) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    if (item.status === "available" && (!relative(item.path) || !digest(item.digest))) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    if (item.status === "unavailable" && (item.path !== null || item.digest !== null)) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    return immutable({ fen: item.fen, status: item.status, path: item.path, digest: item.digest }) as LegalDeclaration;
  });
  requireUnique(responses.map((item) => subject(item)), "PROMOTION_RESPONSE_SUBJECT_AMBIGUOUS");
  requireUnique(responses.map((item) => item.fen), "PROMOTION_RESPONSE_FEN_AMBIGUOUS");
  requireUnique(legalMaps.map((item) => item.fen), "PROMOTION_LEGAL_FEN_AMBIGUOUS");
  setEqual(responses.map((item) => item.fen), legalMaps.map((item) => item.fen), "PROMOTION_RESPONSE_LEGAL_SET_MISMATCH");
  return immutable({ schema: row.schema, generationId: row.generationId, pack, sources, evidence, responses, legalMaps });
}

export function assertPromotionRecordedSubjects(pack: unknown, ledger: unknown, responses: readonly ResponseDeclaration[]): void {
  const packRow = object(pack, "PROMOTION_PACK_SUBJECT_INVALID");
  const start = object(packRow.start, "PROMOTION_PACK_SUBJECT_INVALID");
  if (!nonempty(start.fen)) fail("PROMOTION_PACK_SUBJECT_INVALID");
  const ledgerRow = object(ledger, "PROMOTION_LEDGER_SUBJECT_INVALID");
  if (!Array.isArray(ledgerRow.records)) fail("PROMOTION_LEDGER_SUBJECT_INVALID");
  const recordedSubjects = ledgerRow.records.flatMap((candidate) => {
    if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) return [];
    const record = candidate as JsonObject;
    if (record.kind !== "tablebase_result") return [];
    const anchor = object(record.anchor, "PROMOTION_LEDGER_SUBJECT_INVALID");
    if (!nonempty(anchor.fen) || !nonempty(record.sourceId) || !instant(record.retrievedAt)) fail("PROMOTION_LEDGER_SUBJECT_INVALID");
    return [`${anchor.fen}\u0000${record.sourceId}\u0000${record.retrievedAt}`];
  });
  requireUnique(recordedSubjects, "PROMOTION_RECORDED_SUBJECT_AMBIGUOUS");
  setEqual(recordedSubjects, responses.map((response) => subject(response)), "PROMOTION_RECORDED_SUBJECT_SET_MISMATCH");
  for (const response of responses) {
    const matching = ledgerRow.records.filter((candidate) => {
      if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) return false;
      const record = candidate as JsonObject;
      const anchor = record.anchor;
      return record.kind === "tablebase_result" && anchor !== null && typeof anchor === "object" && !Array.isArray(anchor) &&
        (anchor as JsonObject).fen === response.fen && record.sourceId === response.sourceId && record.retrievedAt === response.retrievedAt;
    });
    if (matching.length !== 1) fail("PROMOTION_RECORDED_SUBJECT_AMBIGUOUS");
    const record = matching[0] as JsonObject;
    if (!Array.isArray(record.supports) || record.supports.length !== 1 || record.supports[0] !== "/start/fen" || start.fen !== response.fen) fail("PROMOTION_SUPPORT_SEMANTICS_CROSSED");
  }
}

async function validateGeneration(root: string, entry: InventoryEntry): Promise<void> {
  const generationRoot = await exactDirectory(root, entry.directory);
  const generationFile = await canonicalFile(resolve(generationRoot, "promotion-generation.json"));
  if (generationFile.digest !== entry.manifestDigest) fail("PROMOTION_GENERATION_DIGEST_MISMATCH");
  const generation = parsePromotionGeneration(generationFile.value);
  if (generation.generationId !== entry.generationId) fail("PROMOTION_GENERATION_ID_CROSSED");
  const [packFile, , evidenceFile] = await Promise.all([
    declaredFile(generationRoot, generation.pack),
    declaredFile(generationRoot, generation.sources),
    declaredFile(generationRoot, generation.evidence),
  ]);
  await Promise.all(generation.responses.map((item) => declaredFile(generationRoot, item)));
  await Promise.all(generation.legalMaps.flatMap((item) => item.status === "available" ? [declaredFile(generationRoot, { path: item.path!, digest: item.digest! })] : []));
  assertPromotionRecordedSubjects(packFile.value, evidenceFile.value, generation.responses);
}

function parseInventory(value: unknown): readonly InventoryEntry[] {
  const row = object(value, "PROMOTION_INSTALLATION_INVALID");
  exact(row, ["schema", "generations"], "PROMOTION_INSTALLATION_INVALID");
  if (row.schema !== "tabiya.promotion-installation.v1" || !Array.isArray(row.generations)) fail("PROMOTION_INSTALLATION_INVALID");
  const entries = row.generations.map((candidate) => {
    const item = object(candidate, "PROMOTION_INSTALLATION_INVALID");
    exact(item, ["generationId", "directory", "manifestDigest"], "PROMOTION_INSTALLATION_INVALID");
    if (!nonempty(item.generationId) || !relative(item.directory) || !digest(item.manifestDigest)) fail("PROMOTION_INSTALLATION_INVALID");
    return immutable({ generationId: item.generationId, directory: item.directory, manifestDigest: item.manifestDigest }) as InventoryEntry;
  });
  requireUnique(entries.map((item) => item.generationId), "PROMOTION_INSTALLATION_INVALID");
  return Object.freeze(entries);
}

async function canonicalFile(path: string): Promise<Readonly<{ value: unknown; digest: Digest }>> {
  const bytes = await readFile(path, "utf8");
  const value = JSON.parse(bytes) as unknown;
  if (bytes !== `${canonicalizeJson(value)}\n`) fail("PROMOTION_ARTIFACT_NONCANONICAL");
  return Object.freeze({ value: immutable(value), digest: sha256(bytes) as Digest });
}

async function declaredFile(root: string, declaration: Readonly<{ path: string; digest: Digest }>): Promise<Readonly<{ value: unknown; digest: Digest }>> {
  const path = resolve(root, declaration.path);
  if (await realpath(path) !== path) fail("PROMOTION_ARTIFACT_PATH_CROSSED");
  const file = await canonicalFile(path);
  if (file.digest !== declaration.digest) fail("PROMOTION_ARTIFACT_DIGEST_MISMATCH");
  return file;
}

async function exactDirectory(root: string, directory: string): Promise<string> {
  const path = resolve(root, directory);
  if (await realpath(path) !== path) fail("PROMOTION_GENERATION_PATH_CROSSED");
  return path;
}

function fileRef(value: unknown): Readonly<{ path: string; digest: Digest }> {
  const row = object(value, "PROMOTION_FILE_REFERENCE_INVALID");
  exact(row, ["path", "digest"], "PROMOTION_FILE_REFERENCE_INVALID");
  if (!relative(row.path) || !digest(row.digest)) fail("PROMOTION_FILE_REFERENCE_INVALID");
  return immutable({ path: row.path, digest: row.digest }) as Readonly<{ path: string; digest: Digest }>;
}

function subject(value: ResponseDeclaration): string { return `${value.fen}\u0000${value.sourceId}\u0000${value.retrievedAt}`; }
function object(value: unknown, code: string): JsonObject { if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code); return value as JsonObject; }
function exact(value: JsonObject, keys: readonly string[], code: string): void { const actual = Object.keys(value).sort(); const expected = [...keys].sort(); if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code); }
function nonempty(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function digest(value: unknown): value is Digest { return typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value); }
function instant(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function relative(value: unknown): value is string { return typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.split("/").includes(".."); }
function requireUnique(values: readonly string[], code: string): void { if (new Set(values).size !== values.length) fail(code); }
function setEqual(left: readonly string[], right: readonly string[], code: string): void { const a = [...left].sort(); const b = [...right].sort(); if (a.length !== b.length || a.some((value, index) => value !== b[index])) fail(code); }
function immutable<T>(value: T): T { if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value; if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T; for (const child of Object.values(value as object)) immutable(child); return Object.freeze(value); }
function fail(code: string): never { throw new TypeError(code); }
