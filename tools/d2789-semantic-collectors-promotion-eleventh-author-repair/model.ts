// DISPOSABLE bounded author repair for D2789-D2794. Not production code.
import { readFile, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { canonicalizeJson, digestDrillPack, type DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import { checkSourcingDirectory, evidenceSemantics, evidenceSupports, resolvePointer } from "../../apps/server/src/sourcing/check.js";
import { linkage, validateLedger, validateManifest } from "../../apps/server/src/sourcing/ledger-validation.js";
import type { EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest, SourcingIssue } from "../../apps/server/src/sourcing/types.js";
import { validatePackDocument } from "../../apps/server/src/pack-validation.js";
import { parseTablebasePosition, type TablebasePosition } from "../../apps/server/src/tablebase.js";
import { countFenPieces } from "../../apps/server/src/sourcing/chess-facts.js";
import { createRulesMobilityReadingLegalMovesV1Evidence, type CanonicalFullFen, type ExactLegalMovesEvidence } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  assertPromotionRaceTablebaseResult as assertPriorResult,
  collectPromotionRaceTablebase as collectPrior,
  createExactLegalMovesResolver,
  createRetainedExactLegalMovesResolver,
  createPromotionRaceTablebaseRequest as createPriorRequest,
  createProviderSourceFactories,
  createRecordedTablebaseLookup,
  createRecordedTablebaseResultV1Evidence,
  createSourcingLedgerTablebaseResultV1Evidence,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
  type PromotionRaceTablebaseRequest,
  type PromotionRaceTablebaseResult as PriorResult,
  type ProviderExchangeScheduler,
  type ProviderSourceFactories,
  type RecordedTablebaseEvidence,
  type SyzygyFixtureOutcome,
} from "../d2693-semantic-collectors-promotion-eighth-author-repair/model.js";

export { createProviderSourceFactories, createSyzygyFixtureScheduler, derivePromotionRaceGeometry, makePromotionRaceSyzygyRequest };
export type { ProviderExchangeScheduler, ProviderSourceFactories, SyzygyFixtureOutcome };

interface CanonicalFile<T = unknown> {
  readonly value: T;
  readonly bytes: string;
  readonly digest: `sha256:${string}`;
}

interface GenerationInventoryEntry {
  readonly generationId: string;
  readonly directory: string;
  readonly manifestDigest: `sha256:${string}`;
}

interface InstallationInventory {
  readonly schema: "tabiya.promotion-installation.v1";
  readonly generations: readonly GenerationInventoryEntry[];
}

interface ResponseDeclaration {
  readonly fen: CanonicalFullFen;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly path: string;
  readonly digest: `sha256:${string}`;
  readonly bytes: number;
}

interface LegalDeclaration {
  readonly fen: CanonicalFullFen;
  readonly status: "available" | "unavailable";
  readonly path: string | null;
  readonly digest: `sha256:${string}` | null;
}

interface GenerationManifest {
  readonly schema: "tabiya.promotion-generation.v1";
  readonly generationId: string;
  readonly pack: Readonly<{ path: string; digest: `sha256:${string}` }>;
  readonly sources: Readonly<{ path: string; digest: `sha256:${string}` }>;
  readonly evidence: Readonly<{ path: string; digest: `sha256:${string}` }>;
  readonly responses: readonly ResponseDeclaration[];
  readonly legalMaps: readonly LegalDeclaration[];
}

export interface PromotionInstallationRegistry {
  readonly inventoryDigest: `sha256:${string}`;
  openGeneration(generationId: string): Promise<PromotionArtifactStore>;
}

export interface PromotionArtifactStore {
  readonly generationId: string;
  lookup(fen: CanonicalFullFen): Readonly<{ kind: "found"; evidence: RecordedTablebaseEvidence; receipt: InstalledRecordedAuthorityReceipt }> | Readonly<{ kind: "absent" }>;
  legalStatus(fen: CanonicalFullFen): "available" | "unavailable" | "absent";
}

export interface InstalledRecordedAuthorityReceipt {
  readonly registry: PromotionInstallationRegistry;
  readonly inventoryDigest: `sha256:${string}`;
  readonly generationId: string;
  readonly generationManifestDigest: `sha256:${string}`;
  readonly packFileDigest: `sha256:${string}`;
  readonly packDigest: `sha256:${string}`;
  readonly manifestDigest: `sha256:${string}`;
  readonly ledgerDigest: `sha256:${string}`;
  readonly responseDigest: `sha256:${string}`;
  readonly legalMapDigest: `sha256:${string}` | null;
  readonly pack: DrillPackDefinition;
  readonly source: SourceEntry;
  readonly record: EvidenceRecord;
  readonly parsedResponse: TablebasePosition;
  readonly legalMoves: ExactLegalMovesEvidence | null;
  readonly evidence: RecordedTablebaseEvidence;
}

const REGISTRIES = new WeakSet<object>();
const STORES = new WeakSet<object>();
const REQUESTS = new WeakSet<object>();
const RESULTS = new WeakSet<object>();
const RECEIPTS = new WeakMap<object, InstalledRecordedAuthorityReceipt>();
const RESULT_AUTHORITY = new WeakMap<object, Readonly<{ readonly request: PromotionRaceTablebaseRequest; readonly recorded: InstalledRecordedAuthorityReceipt | null }>>();

function immutable<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T;
  return Object.freeze(Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, immutable(child)]))) as T;
}

async function canonicalFile<T = unknown>(path: string): Promise<CanonicalFile<T>> {
  const bytes = await readFile(path, "utf8");
  const value = JSON.parse(bytes) as T;
  if (bytes !== `${canonicalizeJson(value)}\n`) throw new TypeError("PROMOTION_ARTIFACT_NONCANONICAL");
  return Object.freeze({ value: immutable(value), bytes, digest: sha256(bytes) as `sha256:${string}` });
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
}

function parseInventory(value: unknown): InstallationInventory {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !exactKeys(value, ["schema", "generations"])) throw new TypeError("PROMOTION_INSTALLATION_INVALID");
  const raw = value as Record<string, unknown>;
  if (raw.schema !== "tabiya.promotion-installation.v1" || !Array.isArray(raw.generations)) throw new TypeError("PROMOTION_INSTALLATION_INVALID");
  const ids = new Set<string>();
  const generations = raw.generations.map((entry) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry) || !exactKeys(entry, ["generationId", "directory", "manifestDigest"])) throw new TypeError("PROMOTION_INSTALLATION_INVALID");
    const row = entry as Record<string, unknown>;
    if (typeof row.generationId !== "string" || row.generationId === "" || ids.has(row.generationId) || typeof row.directory !== "string" || row.directory === "" || !/^sha256:[0-9a-f]{64}$/u.test(String(row.manifestDigest))) throw new TypeError("PROMOTION_INSTALLATION_INVALID");
    ids.add(row.generationId);
    return immutable({ generationId: row.generationId, directory: row.directory, manifestDigest: row.manifestDigest as `sha256:${string}` });
  });
  return immutable({ schema: "tabiya.promotion-installation.v1" as const, generations });
}

function parseGeneration(value: unknown): GenerationManifest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("PROMOTION_GENERATION_INVALID");
  const row = value as GenerationManifest;
  if (row.schema !== "tabiya.promotion-generation.v1" || typeof row.generationId !== "string" || !Array.isArray(row.responses) || !Array.isArray(row.legalMaps)) throw new TypeError("PROMOTION_GENERATION_INVALID");
  for (const file of [row.pack, row.sources, row.evidence]) if (file === undefined || typeof file.path !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(file.digest)) throw new TypeError("PROMOTION_GENERATION_INVALID");
  return immutable(row);
}

function assertRelative(path: string): void {
  if (path === "" || path.startsWith("/") || path.split("/").includes("..")) throw new TypeError("PROMOTION_ARTIFACT_PATH_INVALID");
}

async function checkedFile<T>(root: string, declaration: Readonly<{ path: string; digest: `sha256:${string}` }>): Promise<CanonicalFile<T>> {
  assertRelative(declaration.path);
  const declaredPath = resolve(root, declaration.path);
  const actualPath = await realpath(declaredPath);
  if (actualPath !== declaredPath) throw new TypeError("PROMOTION_ARTIFACT_PATH_CROSSED");
  const file = await canonicalFile<T>(actualPath);
  if (file.digest !== declaration.digest) throw new TypeError("PROMOTION_ARTIFACT_DIGEST_MISMATCH");
  return file;
}

function sameJson(left: unknown, right: unknown): boolean {
  return canonicalizeJson(left) === canonicalizeJson(right);
}

async function loadGeneration(registry: PromotionInstallationRegistry, inventoryRoot: string, entry: GenerationInventoryEntry): Promise<PromotionArtifactStore> {
  assertRelative(entry.directory);
  const root = await realpath(resolve(inventoryRoot, entry.directory));
  if (root !== resolve(inventoryRoot, entry.directory)) throw new TypeError("PROMOTION_GENERATION_PATH_CROSSED");
  const generationFile = await canonicalFile<unknown>(resolve(root, "promotion-generation.json"));
  if (generationFile.digest !== entry.manifestDigest) throw new TypeError("PROMOTION_GENERATION_DIGEST_MISMATCH");
  const generation = parseGeneration(generationFile.value);
  if (generation.generationId !== entry.generationId) throw new TypeError("PROMOTION_GENERATION_ID_CROSSED");
  const [packFile, manifestFile, ledgerFile] = await Promise.all([
    checkedFile<unknown>(root, generation.pack),
    checkedFile<unknown>(root, generation.sources),
    checkedFile<unknown>(root, generation.evidence),
  ]);
  const packResult = validatePackDocument(packFile.value);
  if (!packResult.valid || packResult.document === undefined) {
    throw new TypeError(`PROMOTION_PACK_INVALID:${packResult.issues.map((issue) => issue.code).join(",")}`);
  }
  const issues: SourcingIssue[] = [];
  const manifest = validateManifest(manifestFile.value, issues);
  const ledger = validateLedger(ledgerFile.value, issues);
  if (manifest !== undefined && ledger !== undefined) linkage(manifest, ledger, issues);
  if (manifest === undefined || ledger === undefined) throw new TypeError("PROMOTION_SOURCING_INVALID");
  evidenceSemantics(ledger, issues, manifest, packResult.document);
  evidenceSupports(packResult.document, ledger, manifest, issues);
  if (issues.some((issue) => issue.severity === "error")) throw new TypeError(`PROMOTION_SOURCING_INVALID:${issues.map((issue) => issue.code).join(",")}`);
  const fullSourcing = await checkSourcingDirectory(root, { strict: true });
  if (!fullSourcing.valid) throw new TypeError(`PROMOTION_SOURCING_INVALID:${fullSourcing.issues.map((issue) => issue.code).join(",")}`);
  const packDigest = await digestDrillPack(packResult.document) as `sha256:${string}`;
  if (ledger.packId !== packResult.document.id || ledger.packVersion !== packResult.document.version || ledger.packDigest !== packDigest) throw new TypeError("PROMOTION_PACK_SUBJECT_CROSSED");

  const records = new Map<string, Readonly<{ evidence: RecordedTablebaseEvidence; receipt: InstalledRecordedAuthorityReceipt }>>();
  const legalStatuses = new Map<string, "available" | "unavailable">();
  for (const response of generation.responses) {
    if (response.sourceId !== "syzygy" || Date.parse(response.retrievedAt) > Date.now()) throw new TypeError("PROMOTION_RESPONSE_SOURCE_CROSSED");
    assertRelative(response.path);
    const responseFile = await checkedFile<unknown>(root, response);
    if (responseFile.digest !== response.digest || Buffer.byteLength(responseFile.bytes) !== response.bytes) throw new TypeError("PROMOTION_RESPONSE_IDENTITY_MISMATCH");
    const record = ledger.records.find((candidate) => candidate.kind === "tablebase_result" && candidate.anchor.fen === response.fen && candidate.sourceId === response.sourceId && candidate.retrievedAt === response.retrievedAt);
    const source = manifest.entries.find((candidate) => candidate.sourceId === response.sourceId && candidate.retrievedAt === response.retrievedAt);
    if (record === undefined || source === undefined || source.origin.kind !== "http" || source.sourceId !== "syzygy" || Date.parse(source.retrievedAt) > Date.now()) throw new TypeError("PROMOTION_RECORDED_SUBJECT_MISSING");
    const url = new URL(source.origin.url);
    if (url.protocol !== "https:" || url.hostname !== "tablebase.lichess.org" || url.pathname !== "/standard" || url.searchParams.get("fen") !== response.fen || source.origin.status !== 200 || source.origin.sha256 !== response.digest || source.origin.bytes !== response.bytes) throw new TypeError("PROMOTION_RESPONSE_SOURCE_CROSSED");
    if (countFenPieces(response.fen) > 7 || record.values.fen !== response.fen || record.values.pieceCount !== countFenPieces(response.fen)) throw new TypeError("PROMOTION_TABLEBASE_SUBJECT_CROSSED");
    for (const pointer of record.supports) {
      const supported = resolvePointer(packResult.document, pointer);
      if (!supported.found || pointer !== "/start/fen" || supported.value !== response.fen) throw new TypeError("PROMOTION_SUPPORT_SEMANTICS_CROSSED");
    }
    const parsedResponse = parseTablebasePosition(responseFile.value);
    if (parsedResponse.category !== record.values.category || parsedResponse.dtz !== record.values.dtz || parsedResponse.preciseDtz !== (record.values.precise_dtz ?? null)) throw new TypeError("PROMOTION_RESPONSE_VALUE_CROSSED");
    const legal = generation.legalMaps.find((candidate) => candidate.fen === response.fen);
    if (legal === undefined) throw new TypeError("PROMOTION_LEGAL_MAP_MISSING");
    let legalMapDigest: `sha256:${string}` | null = null;
    let legalMoves: ExactLegalMovesEvidence | null = null;
    if (legal.status === "available") {
      if (legal.path === null || legal.digest === null) throw new TypeError("PROMOTION_LEGAL_MAP_INVALID");
      const legalFile = await checkedFile<unknown>(root, { path: legal.path, digest: legal.digest });
      const exactLegal = createRulesMobilityReadingLegalMovesV1Evidence(response.fen);
      if (!sameJson(legalFile.value, { schema: "tabiya.legal-map.v1", fen: response.fen, pieces: exactLegal.payload.pieces })) throw new TypeError("PROMOTION_LEGAL_MAP_INVALID");
      legalMapDigest = legalFile.digest;
      legalMoves = exactLegal;
    } else if (legal.path !== null || legal.digest !== null) {
      throw new TypeError("PROMOTION_LEGAL_MAP_INVALID");
    }
    const ledgerEvidence = createSourcingLedgerTablebaseResultV1Evidence({ fen: response.fen, sourceId: source.sourceId, retrievedAt: source.retrievedAt, rawPosition: responseFile.value });
    const evidence = createRecordedTablebaseResultV1Evidence(ledgerEvidence);
    const receipt: InstalledRecordedAuthorityReceipt = Object.freeze({
      registry,
      inventoryDigest: registry.inventoryDigest,
      generationId: generation.generationId,
      generationManifestDigest: generationFile.digest,
      packFileDigest: packFile.digest,
      packDigest,
      manifestDigest: manifestFile.digest,
      ledgerDigest: ledgerFile.digest,
      responseDigest: responseFile.digest,
      legalMapDigest,
      pack: packResult.document,
      source,
      record,
      parsedResponse,
      legalMoves,
      evidence,
    });
    RECEIPTS.set(evidence, receipt);
    if (records.has(response.fen)) throw new TypeError("PROMOTION_RECORDED_FEN_AMBIGUOUS");
    records.set(response.fen, Object.freeze({ evidence, receipt }));
    legalStatuses.set(response.fen, legal.status);
  }
  const store: PromotionArtifactStore = Object.freeze({
    generationId: generation.generationId,
    lookup(fen: CanonicalFullFen) {
      const found = records.get(fen);
      return found === undefined ? Object.freeze({ kind: "absent" as const }) : Object.freeze({ kind: "found" as const, ...found });
    },
    legalStatus(fen: CanonicalFullFen) {
      return legalStatuses.get(fen) ?? "absent";
    },
  });
  STORES.add(store);
  return store;
}

export async function openPromotionInstallationRegistry(inventoryPath: string): Promise<PromotionInstallationRegistry> {
  const inventoryFile = await canonicalFile<unknown>(await realpath(inventoryPath));
  const inventory = parseInventory(inventoryFile.value);
  const inventoryRoot = dirname(await realpath(inventoryPath));
  let registry!: PromotionInstallationRegistry;
  registry = Object.freeze({
    inventoryDigest: inventoryFile.digest,
    async openGeneration(generationId: string) {
      if (!REGISTRIES.has(registry)) throw new TypeError("PROMOTION_REGISTRY_UNSEALED");
      const entry = inventory.generations.find((candidate) => candidate.generationId === generationId);
      if (entry === undefined) throw new TypeError("PROMOTION_GENERATION_NOT_INSTALLED");
      return loadGeneration(registry, inventoryRoot, entry);
    },
  });
  REGISTRIES.add(registry);
  return registry;
}

export function recordedAuthorityReceipt(evidence: RecordedTablebaseEvidence): InstalledRecordedAuthorityReceipt {
  const receipt = RECEIPTS.get(evidence);
  if (receipt === undefined || receipt.evidence !== evidence || !REGISTRIES.has(receipt.registry)) throw new TypeError("INSTALLED_RECORDED_AUTHORITY_MISSING");
  return receipt;
}

export function createPromotionRaceTablebaseRequest(
  geometry: Parameters<typeof createPriorRequest>[0],
  providerScope: Parameters<typeof createPriorRequest>[1],
  signal: AbortSignal,
): PromotionRaceTablebaseRequest {
  const request = createPriorRequest(geometry, providerScope, signal);
  REQUESTS.add(request);
  return request;
}

export interface PromotionRaceDependencies {
  readonly artifacts: PromotionArtifactStore;
  readonly scheduler: ProviderExchangeScheduler;
  readonly sourceFactories: ProviderSourceFactories;
}

export type PromotionRaceResult = PriorResult | Readonly<{
  readonly kind: "unavailable";
  readonly reason: "input_abstained";
  readonly request: PromotionRaceTablebaseRequest;
  readonly missing: readonly ["legal_moves"];
  readonly upstreamReason: "upstream_unavailable";
}>;

export async function collectPromotionRaceTablebase(request: PromotionRaceTablebaseRequest, dependencies: PromotionRaceDependencies): Promise<PromotionRaceResult> {
  if (!REQUESTS.has(request)) throw new TypeError("PROMOTION_REQUEST_UNSEALED");
  if (!STORES.has(dependencies.artifacts)) throw new TypeError("PROMOTION_ARTIFACT_STORE_UNSEALED");
  let recordedReceipt: InstalledRecordedAuthorityReceipt | null = null;
  let legalResolver = createExactLegalMovesResolver();
  const geometryResult = request.geometry;
  let entries: RecordedTablebaseEvidence[] = [];
  if (geometryResult.kind === "completed" && geometryResult.output.kind === "evidence") {
    const fen = geometryResult.output.item.payload.fen as CanonicalFullFen;
    const found = dependencies.artifacts.lookup(fen);
    if (found.kind === "found") {
      recordedReceipt = found.receipt;
      if (recordedAuthorityReceipt(found.evidence) !== found.receipt) throw new TypeError("PROMOTION_RECORDED_RECEIPT_CROSSED");
      if (dependencies.artifacts.legalStatus(fen) === "unavailable") {
        const unavailable = Object.freeze({ kind: "unavailable" as const, reason: "input_abstained" as const, request, missing: Object.freeze(["legal_moves"] as const), upstreamReason: "upstream_unavailable" as const });
        RESULTS.add(unavailable);
        RESULT_AUTHORITY.set(unavailable, Object.freeze({ request, recorded: found.receipt }));
        return unavailable;
      }
      if (found.receipt.legalMoves === null) throw new TypeError("PROMOTION_LEGAL_MAP_CROSSED");
      legalResolver = createRetainedExactLegalMovesResolver(found.receipt.legalMoves);
      entries = [found.evidence];
    }
  }
  const output = await collectPrior(request, {
    recordedLookup: createRecordedTablebaseLookup(entries),
    resolveLegalMoves: legalResolver,
    scheduler: dependencies.scheduler,
    sourceFactories: dependencies.sourceFactories,
  });
  assertPriorResult(output);
  RESULTS.add(output);
  RESULT_AUTHORITY.set(output, Object.freeze({ request, recorded: recordedReceipt }));
  return output;
}

export function assertPromotionRaceTablebaseResult(value: unknown): asserts value is PromotionRaceResult {
  if (value === null || typeof value !== "object" || !RESULTS.has(value)) throw new TypeError("CURRENT_PROMOTION_RESULT_UNSEALED");
  const authority = RESULT_AUTHORITY.get(value);
  if (authority === undefined || authority.request !== (value as PromotionRaceResult).request || !REQUESTS.has(authority.request)) throw new TypeError("CURRENT_PROMOTION_RESULT_CROSSED");
  const result = value as PromotionRaceResult;
  if (result.kind === "unavailable" && result.reason === "input_abstained" && "upstreamReason" in result) {
    if (result.upstreamReason !== "upstream_unavailable" || authority.recorded === null) throw new TypeError("CURRENT_PROMOTION_ABSTENTION_CROSSED");
    return;
  }
  assertPriorResult(value);
  if (result.kind === "reading" && result.derivation.source.kind === "recorded") {
    const receipt = recordedAuthorityReceipt(result.derivation.source.evidence);
    if (authority.recorded !== receipt || receipt.evidence !== result.derivation.source.evidence || receipt.legalMoves !== result.derivation.legalMoves) throw new TypeError("CURRENT_PROMOTION_RECORDED_CROSSED");
  } else if (authority.recorded !== null) {
    throw new TypeError("CURRENT_PROMOTION_SOURCE_CROSSED");
  }
}
