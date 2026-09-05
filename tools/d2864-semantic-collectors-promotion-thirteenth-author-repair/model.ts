// DISPOSABLE composed author model for D2864-D2868. Not production code.
import { readFile, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import * as prior from "../d2835-semantic-collectors-promotion-twelfth-author-repair/model.js";

export {
  createProviderSourceFactories,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
} from "../d2835-semantic-collectors-promotion-twelfth-author-repair/model.js";
export type {
  ProviderExchangeScheduler,
  ProviderSourceFactories,
  SyzygyFixtureOutcome,
} from "../d2835-semantic-collectors-promotion-twelfth-author-repair/model.js";

type Digest = `sha256:${string}`;
type JsonObject = Record<string, unknown>;
type PriorRegistry = Awaited<ReturnType<typeof prior.openPromotionInstallationRegistry>>;
type PriorStore = Awaited<ReturnType<PriorRegistry["openGeneration"]>>;
type PriorReceipt = ReturnType<typeof prior.recordedAuthorityReceipt>;
type Fen = Parameters<PriorStore["lookup"]>[0];
type PromotionRaceTablebaseRequest = ReturnType<typeof prior.createPromotionRaceTablebaseRequest>;
type PriorDependencies = Parameters<typeof prior.collectPromotionRaceTablebase>[1];
export type PromotionRaceTablebaseResult = Awaited<ReturnType<typeof prior.collectPromotionRaceTablebase>>;

interface InventoryEntry {
  readonly generationId: string;
  readonly directory: string;
  readonly manifestDigest: Digest;
}

export interface InstalledPromotionInventorySnapshot {
  readonly kind: "application_installed_promotion_inventory_snapshot";
  readonly inventoryPath: string;
  readonly inventoryRoot: string;
  readonly inventoryBytes: string;
  readonly inventoryDigest: Digest;
  readonly entries: readonly InventoryEntry[];
}

export interface PromotionApplication {
  readonly installation: InstalledPromotionInventorySnapshot;
  openRegistry(): Promise<PromotionInstallationRegistry>;
}

export interface PromotionInstallationRegistry {
  readonly application: PromotionApplication;
  readonly installation: InstalledPromotionInventorySnapshot;
  readonly inventoryDigest: Digest;
  openGeneration(generationId: string): Promise<PromotionArtifactStore>;
}

export interface CurrentInstalledRecordedAuthorityReceipt {
  readonly application: PromotionApplication;
  readonly installation: InstalledPromotionInventorySnapshot;
  readonly registry: PromotionInstallationRegistry;
  readonly store: PromotionArtifactStore;
  readonly prior: PriorReceipt;
  readonly evidence: PriorReceipt["evidence"];
}

export interface PromotionArtifactStore {
  readonly application: PromotionApplication;
  readonly registry: PromotionInstallationRegistry;
  readonly generationId: string;
  lookup(fen: Fen):
    | Readonly<{ kind: "found"; evidence: PriorReceipt["evidence"]; receipt: CurrentInstalledRecordedAuthorityReceipt }>
    | Readonly<{ kind: "absent" }>;
  legalStatus(fen: Fen): ReturnType<PriorStore["legalStatus"]>;
}

const APPLICATIONS = new WeakSet<object>();
const SNAPSHOTS = new WeakSet<object>();
const REGISTRIES = new WeakSet<object>();
const STORES = new WeakMap<object, PriorStore>();
const REQUESTS = new WeakSet<object>();
const RESULTS = new WeakMap<object, Readonly<{ request: PromotionRaceTablebaseRequest; store: PromotionArtifactStore }>>();
const RECEIPTS = new WeakMap<object, CurrentInstalledRecordedAuthorityReceipt>();

export async function openPromotionApplication(inventoryPath: string): Promise<PromotionApplication> {
  const exactPath = await realpath(inventoryPath);
  const file = await canonicalFile(exactPath);
  const entries = parseInventory(file.value);
  const installation: InstalledPromotionInventorySnapshot = immutable({
    kind: "application_installed_promotion_inventory_snapshot" as const,
    inventoryPath: exactPath,
    inventoryRoot: dirname(exactPath),
    inventoryBytes: file.bytes,
    inventoryDigest: file.digest,
    entries,
  });
  SNAPSHOTS.add(installation);
  let application!: PromotionApplication;
  application = Object.freeze({
    installation,
    async openRegistry() {
      if (!APPLICATIONS.has(application) || !SNAPSHOTS.has(installation)) fail("PROMOTION_APPLICATION_AUTHORITY_REQUIRED");
      return openRegistry(application);
    },
  });
  APPLICATIONS.add(application);
  return application;
}

async function openRegistry(application: PromotionApplication): Promise<PromotionInstallationRegistry> {
  const snapshot = application.installation;
  const delegatedAuthority = prior.createTestInstalledPromotionInventoryAuthority(snapshot.inventoryPath);
  const delegated = await prior.openPromotionInstallationRegistry(delegatedAuthority);
  if (delegated.inventoryDigest !== snapshot.inventoryDigest) fail("PROMOTION_INVENTORY_SNAPSHOT_CHANGED");
  const stores = new Map<string, PromotionArtifactStore>();
  let registry!: PromotionInstallationRegistry;
  registry = Object.freeze({
    application,
    installation: snapshot,
    inventoryDigest: snapshot.inventoryDigest,
    async openGeneration(generationId: string) {
      if (!REGISTRIES.has(registry) || !APPLICATIONS.has(application) || registry.installation !== snapshot) fail("PROMOTION_REGISTRY_UNSEALED");
      const existing = stores.get(generationId);
      if (existing !== undefined) return existing;
      const entry = snapshot.entries.find((candidate) => candidate.generationId === generationId);
      if (entry === undefined) fail("PROMOTION_GENERATION_NOT_INSTALLED");
      const generationPath = resolve(snapshot.inventoryRoot, entry.directory, "promotion-generation.json");
      if (await realpath(generationPath) !== generationPath) fail("PROMOTION_GENERATION_PATH_CROSSED");
      const generationFile = await canonicalFile(generationPath);
      if (generationFile.digest !== entry.manifestDigest) fail("PROMOTION_GENERATION_DIGEST_MISMATCH");
      const generation = parsePromotionGeneration(generationFile.value);
      if (generation.generationId !== entry.generationId) fail("PROMOTION_GENERATION_ID_CROSSED");
      const delegatedStore = await delegated.openGeneration(generationId);
      const store = wrapStore(application, registry, delegatedStore);
      stores.set(generationId, store);
      return store;
    },
  });
  REGISTRIES.add(registry);
  return registry;
}

function wrapStore(application: PromotionApplication, registry: PromotionInstallationRegistry, delegated: PriorStore): PromotionArtifactStore {
  let store!: PromotionArtifactStore;
  store = Object.freeze({
    application,
    registry,
    generationId: delegated.generationId,
    lookup(fen: Fen) {
      if (STORES.get(store) !== delegated || !REGISTRIES.has(registry) || registry.application !== application) fail("PROMOTION_ARTIFACT_STORE_UNSEALED");
      const found = delegated.lookup(fen);
      if (found.kind === "absent") return found;
      let receipt = RECEIPTS.get(found.evidence);
      if (receipt === undefined) {
        if (prior.recordedAuthorityReceipt(found.evidence) !== found.receipt) fail("PROMOTION_PREDECESSOR_RECEIPT_CROSSED");
        receipt = Object.freeze({ application, installation: application.installation, registry, store, prior: found.receipt, evidence: found.evidence });
        RECEIPTS.set(found.evidence, receipt);
      }
      if (receipt.application !== application || receipt.registry !== registry || receipt.store !== store || receipt.prior !== found.receipt) fail("PROMOTION_CURRENT_RECEIPT_CROSSED");
      return Object.freeze({ kind: "found" as const, evidence: found.evidence, receipt });
    },
    legalStatus(fen: Fen) {
      if (STORES.get(store) !== delegated) fail("PROMOTION_ARTIFACT_STORE_UNSEALED");
      return delegated.legalStatus(fen);
    },
  });
  STORES.set(store, delegated);
  return store;
}

export function parsePromotionGeneration(value: unknown): ReturnType<typeof prior.parsePromotionGeneration> {
  const parsed = prior.parsePromotionGeneration(value);
  if (parsed.responses.length === 0 || parsed.legalMaps.length === 0) fail("PROMOTION_GENERATION_EMPTY");
  return parsed;
}

export function recordedAuthorityReceipt(evidence: PriorReceipt["evidence"]): CurrentInstalledRecordedAuthorityReceipt {
  const receipt = RECEIPTS.get(evidence);
  if (receipt === undefined || receipt.evidence !== evidence || !APPLICATIONS.has(receipt.application) || !REGISTRIES.has(receipt.registry) || STORES.get(receipt.store) === undefined) fail("CURRENT_INSTALLED_RECORDED_AUTHORITY_MISSING");
  if (receipt.installation !== receipt.application.installation || receipt.registry.installation !== receipt.installation || receipt.store.registry !== receipt.registry) fail("CURRENT_INSTALLED_RECORDED_AUTHORITY_CROSSED");
  return receipt;
}

export function createPromotionRaceTablebaseRequest(
  geometry: Parameters<typeof prior.createPromotionRaceTablebaseRequest>[0],
  providerScope: Parameters<typeof prior.createPromotionRaceTablebaseRequest>[1],
  signal: AbortSignal,
): PromotionRaceTablebaseRequest {
  const request = prior.createPromotionRaceTablebaseRequest(geometry, providerScope, signal);
  REQUESTS.add(request);
  return request;
}

export interface PromotionRaceDependencies {
  readonly artifacts: PromotionArtifactStore;
  readonly scheduler: PriorDependencies["scheduler"];
  readonly sourceFactories: PriorDependencies["sourceFactories"];
}

export async function collectPromotionRaceTablebase(
  request: PromotionRaceTablebaseRequest,
  dependencies: PromotionRaceDependencies,
): Promise<PromotionRaceTablebaseResult> {
  if (!REQUESTS.has(request)) fail("CURRENT_PROMOTION_REQUEST_UNSEALED");
  const delegated = STORES.get(dependencies.artifacts);
  if (delegated === undefined) fail("PROMOTION_ARTIFACT_STORE_UNSEALED");
  if (request.geometry.kind === "completed" && request.geometry.output.kind === "evidence") {
    dependencies.artifacts.lookup(request.geometry.output.item.payload.fen as Fen);
  }
  const result = await prior.collectPromotionRaceTablebase(request, {
    artifacts: delegated,
    scheduler: dependencies.scheduler,
    sourceFactories: dependencies.sourceFactories,
  });
  prior.assertPromotionRaceTablebaseResult(result);
  RESULTS.set(result, Object.freeze({ request, store: dependencies.artifacts }));
  return result;
}

export function assertPromotionRaceTablebaseResult(value: unknown): asserts value is PromotionRaceTablebaseResult {
  if (value === null || typeof value !== "object") fail("CURRENT_PROMOTION_RESULT_UNSEALED");
  const authority = RESULTS.get(value);
  if (authority === undefined || !REQUESTS.has(authority.request) || STORES.get(authority.store) === undefined || (value as PromotionRaceTablebaseResult).request !== authority.request) fail("CURRENT_PROMOTION_RESULT_CROSSED");
  prior.assertPromotionRaceTablebaseResult(value);
  const result = value as PromotionRaceTablebaseResult;
  if (result.kind === "reading" && result.derivation.source.kind === "recorded") {
    const receipt = recordedAuthorityReceipt(result.derivation.source.evidence);
    if (receipt.store !== authority.store || receipt.prior.evidence !== result.derivation.source.evidence) fail("CURRENT_PROMOTION_RECORDED_CROSSED");
  }
}

function parseInventory(value: unknown): readonly InventoryEntry[] {
  const row = object(value, "PROMOTION_INSTALLATION_INVALID");
  exact(row, ["schema", "generations"], "PROMOTION_INSTALLATION_INVALID");
  if (row.schema !== "tabiya.promotion-installation.v1" || !Array.isArray(row.generations) || row.generations.length === 0) fail("PROMOTION_INSTALLATION_INVALID");
  const entries = row.generations.map((candidate) => {
    const item = object(candidate, "PROMOTION_INSTALLATION_INVALID");
    exact(item, ["generationId", "directory", "manifestDigest"], "PROMOTION_INSTALLATION_INVALID");
    if (!nonempty(item.generationId) || !relative(item.directory) || !digest(item.manifestDigest)) fail("PROMOTION_INSTALLATION_INVALID");
    return immutable({ generationId: item.generationId, directory: item.directory, manifestDigest: item.manifestDigest }) as InventoryEntry;
  });
  if (new Set(entries.map((entry) => entry.generationId)).size !== entries.length) fail("PROMOTION_INSTALLATION_INVALID");
  return Object.freeze(entries);
}

async function canonicalFile(path: string): Promise<Readonly<{ value: unknown; bytes: string; digest: Digest }>> {
  const bytes = await readFile(path, "utf8");
  const value = JSON.parse(bytes) as unknown;
  if (bytes !== `${canonicalizeJson(value)}\n`) fail("PROMOTION_ARTIFACT_NONCANONICAL");
  return Object.freeze({ value: immutable(value), bytes, digest: sha256(bytes) as Digest });
}

function object(value: unknown, code: string): JsonObject { if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code); return value as JsonObject; }
function exact(value: JsonObject, keys: readonly string[], code: string): void { const actual = Object.keys(value).sort(); const expected = [...keys].sort(); if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code); }
function nonempty(value: unknown): value is string { return typeof value === "string" && value.length > 0; }
function digest(value: unknown): value is Digest { return typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value); }
function relative(value: unknown): value is string { return typeof value === "string" && value.length > 0 && !value.startsWith("/") && !value.split("/").includes(".."); }
function immutable<T>(value: T): T { if (value === null || typeof value !== "object") return value; if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T; return Object.freeze(Object.fromEntries(Object.entries(value as JsonObject).map(([key, child]) => [key, immutable(child)]))) as T; }
function fail(code: string): never { throw new TypeError(code); }
