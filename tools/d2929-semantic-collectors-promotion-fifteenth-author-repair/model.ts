// DISPOSABLE composed author model for D2929-D2933. Not production code.
import { readFile, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { declareEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { declareExactLegalMovesEvidence } from "../../packages/runtime/src/evidence-source-adapters.js";
import { exactLegalMoveMap, type ExactLegalMove, type ExactLegalMoveMap } from "../../packages/runtime/src/legal-moves.js";
import { canonicalizeJson, digestDrillPack, type DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { validatePackDocument } from "../../apps/server/src/pack-validation.js";
import { evidenceSemantics, evidenceSupports } from "../../apps/server/src/sourcing/check.js";
import { countFenPieces } from "../../apps/server/src/sourcing/chess-facts.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import { linkage, validateLedger, validateManifest } from "../../apps/server/src/sourcing/ledger-validation.js";
import type { EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest, SourcingIssue } from "../../apps/server/src/sourcing/types.js";
import { parseTablebasePosition, type TablebasePosition } from "../../apps/server/src/tablebase.js";

export type Digest = `sha256:${string}`;
export type CanonicalFullFen = string & { readonly __canonicalFullFen: true };
type JsonObject = Record<string, unknown>;

interface FileReference { readonly path: string; readonly digest: Digest }
interface InventoryEntry { readonly generationId: string; readonly directory: string; readonly manifestDigest: Digest }
interface ResponseDeclaration extends FileReference {
  readonly fen: CanonicalFullFen;
  readonly sourceId: string;
  readonly retrievedAt: string;
  readonly bytes: number;
}
interface LegalDeclaration {
  readonly fen: CanonicalFullFen;
  readonly status: "available" | "unavailable";
  readonly path: string | null;
  readonly digest: Digest | null;
}
interface GenerationDocument {
  readonly schema: "tabiya.promotion-generation.v1";
  readonly generationId: string;
  readonly pack: FileReference;
  readonly sources: FileReference;
  readonly evidence: FileReference;
  readonly responses: readonly ResponseDeclaration[];
  readonly legalMaps: readonly LegalDeclaration[];
}
interface CanonicalFile<T = unknown> { readonly value: T; readonly bytes: string; readonly digest: Digest }

export interface PromotionApplicationConfiguration {
  readonly promotionInstallationPath: string;
}

export interface PromotionApplicationComposition {
  openApplication(): Promise<PromotionApplication>;
}

export interface InstalledPromotionSnapshot {
  readonly kind: "installed_promotion_snapshot";
  readonly inventoryPath: string;
  readonly inventoryRoot: string;
  readonly inventoryBytes: string;
  readonly inventoryDigest: Digest;
  readonly entries: readonly InventoryEntry[];
}

export interface PromotionApplication {
  readonly installation: InstalledPromotionSnapshot;
  openRegistry(): Promise<PromotionInstallationRegistry>;
}

export interface PromotionInstallationRegistry {
  readonly application: PromotionApplication;
  readonly installation: InstalledPromotionSnapshot;
  readonly inventoryDigest: Digest;
  readonly generationIds: readonly string[];
  openGeneration(generationId: string): Promise<PromotionArtifactStore>;
}

export type RecordedTablebaseEvidence = DeclaredEvidence<Readonly<{
  kind: "tablebase_result";
  fen: CanonicalFullFen;
  sourceId: string;
  retrievedAt: string;
  values: TablebasePosition;
}>>;

export type ExactLegalMovesEvidence = DeclaredEvidence<ExactLegalMoveMap>;

export interface InstalledRecordedAuthorityReceipt {
  readonly application: PromotionApplication;
  readonly installation: InstalledPromotionSnapshot;
  readonly registry: PromotionInstallationRegistry;
  readonly store: PromotionArtifactStore;
  readonly generationId: string;
  readonly generationManifestDigest: Digest;
  readonly packFileDigest: Digest;
  readonly packDigest: Digest;
  readonly manifestDigest: Digest;
  readonly ledgerDigest: Digest;
  readonly responseDigest: Digest;
  readonly legalMapDigest: Digest | null;
  readonly pack: DrillPackDefinition;
  readonly manifest: SourceManifest;
  readonly ledger: EvidenceLedger;
  readonly source: SourceEntry;
  readonly record: EvidenceRecord;
  readonly parsedResponse: TablebasePosition;
  readonly legalMoves: ExactLegalMovesEvidence | null;
  readonly evidence: RecordedTablebaseEvidence;
}

export type RecordedLookupResult =
  | Readonly<{ kind: "found"; evidence: RecordedTablebaseEvidence; receipt: InstalledRecordedAuthorityReceipt }>
  | Readonly<{ kind: "absent" }>;

export type LegalStatusResult =
  | Readonly<{ kind: "available"; evidence: ExactLegalMovesEvidence; digest: Digest }>
  | Readonly<{ kind: "unavailable" }>
  | Readonly<{ kind: "absent" }>;

export interface PromotionArtifactStore {
  readonly application: PromotionApplication;
  readonly registry: PromotionInstallationRegistry;
  readonly generationId: string;
  lookup(fen: CanonicalFullFen): RecordedLookupResult;
  legalStatus(fen: CanonicalFullFen): LegalStatusResult;
}

interface RetainedSubject {
  readonly declaration: ResponseDeclaration;
  readonly source: SourceEntry;
  readonly record: EvidenceRecord;
  readonly response: TablebasePosition;
  readonly responseDigest: Digest;
  readonly legal: Readonly<{ kind: "available"; evidence: ExactLegalMovesEvidence; digest: Digest }> | Readonly<{ kind: "unavailable" }>;
}

interface ValidatedGeneration {
  readonly entry: InventoryEntry;
  readonly document: GenerationDocument;
  readonly manifestDigest: Digest;
  readonly pack: DrillPackDefinition;
  readonly packFileDigest: Digest;
  readonly packDigest: Digest;
  readonly manifest: SourceManifest;
  readonly sourceFileDigest: Digest;
  readonly ledger: EvidenceLedger;
  readonly ledgerFileDigest: Digest;
  readonly subjects: readonly RetainedSubject[];
}

export interface PromotionRaceTablebaseRequest {
  readonly store: PromotionArtifactStore;
  readonly fen: CanonicalFullFen;
  readonly signal: AbortSignal;
}

export type PromotionRaceTablebaseEvidence = DeclaredEvidence<Readonly<{
  fen: CanonicalFullFen;
  perspective: "side_to_move";
  category: TablebasePosition["category"];
  dtz: number | null;
  preciseDtz: number | null;
  source: RecordedTablebaseEvidence;
  immediatePromotion: readonly ExactLegalMove[];
}>>;

export type PromotionRaceTablebaseResult =
  | Readonly<{
      kind: "reading";
      request: PromotionRaceTablebaseRequest;
      item: PromotionRaceTablebaseEvidence;
      source: RecordedTablebaseEvidence;
      receipt: InstalledRecordedAuthorityReceipt;
    }>
  | Readonly<{
      kind: "unavailable";
      request: PromotionRaceTablebaseRequest;
      reason: "provider_unavailable" | "input_abstained" | "cancelled";
      missing: readonly ("recorded_tablebase" | "legal_moves")[];
    }>;

const COMPOSITIONS = new WeakSet<object>();
const APPLICATIONS = new WeakSet<object>();
const REGISTRIES = new WeakSet<object>();
const STORES = new WeakSet<object>();
const RECORDED = new WeakMap<object, InstalledRecordedAuthorityReceipt>();
const REQUESTS = new WeakMap<object, PromotionArtifactStore>();
const RESULTS = new WeakMap<object, Readonly<{ request: PromotionRaceTablebaseRequest; store: PromotionArtifactStore; receipt: InstalledRecordedAuthorityReceipt | null }>>();
const DERIVED = new WeakMap<object, Readonly<{ request: PromotionRaceTablebaseRequest; source: RecordedTablebaseEvidence; legalMoves: ExactLegalMovesEvidence }>>();

/**
 * Application composition is the sole configuration owner. It captures configuration bytes once,
 * loads the installed inventory itself and issues one application. No exported authority object or
 * mutable registry exists for a sibling importer to populate.
 */
export function createPromotionApplicationComposition(
  configuration: PromotionApplicationConfiguration,
): PromotionApplicationComposition {
  const configuredPath = requiredPath(configuration.promotionInstallationPath);
  let applicationPromise: Promise<PromotionApplication> | undefined;
  let composition!: PromotionApplicationComposition;
  composition = Object.freeze({
    openApplication(this: PromotionApplicationComposition) {
      if (this !== composition || !COMPOSITIONS.has(composition)) {
        return Promise.reject(new TypeError("PROMOTION_COMPOSITION_AUTHORITY_REQUIRED"));
      }
      if (applicationPromise !== undefined) return applicationPromise;
      const pending = buildApplication(configuredPath);
      applicationPromise = pending;
      void pending.catch(() => {
        if (applicationPromise === pending) applicationPromise = undefined;
      });
      return pending;
    },
  });
  COMPOSITIONS.add(composition);
  return composition;
}

async function buildApplication(configuredPath: string): Promise<PromotionApplication> {
  const inventoryPath = await realpath(configuredPath);
  const inventoryFile = await canonicalFile(inventoryPath);
  const entries = parseInventory(inventoryFile.value);
  const installation = immutable({
    kind: "installed_promotion_snapshot" as const,
    inventoryPath,
    inventoryRoot: dirname(inventoryPath),
    inventoryBytes: inventoryFile.bytes,
    inventoryDigest: inventoryFile.digest,
    entries,
  }) as InstalledPromotionSnapshot;
  let registryPromise: Promise<PromotionInstallationRegistry> | undefined;
  let application!: PromotionApplication;
  application = Object.freeze({
    installation,
    openRegistry(this: PromotionApplication) {
      if (this !== application || !APPLICATIONS.has(application) || this.installation !== installation) {
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
  const validated = await Promise.all(installation.entries.map((entry) => validateGeneration(installation, entry)));
  const byId = new Map(validated.map((generation) => [generation.entry.generationId, generation]));
  const storePromises = new Map<string, Promise<PromotionArtifactStore>>();
  let registry!: PromotionInstallationRegistry;
  registry = Object.freeze({
    application,
    installation,
    inventoryDigest: installation.inventoryDigest,
    generationIds: Object.freeze(validated.map((generation) => generation.entry.generationId)),
    openGeneration(this: PromotionInstallationRegistry, generationId: string) {
      if (this !== registry || !REGISTRIES.has(registry) || registry.application !== application || registry.installation !== installation) {
        return Promise.reject(new TypeError("PROMOTION_REGISTRY_AUTHORITY_REQUIRED"));
      }
      const existing = storePromises.get(generationId);
      if (existing !== undefined) return existing;
      const generation = byId.get(generationId);
      if (generation === undefined) return Promise.reject(new TypeError("PROMOTION_GENERATION_NOT_INSTALLED"));
      const pending = Promise.resolve(buildStore(application, registry, generation));
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

function buildStore(
  application: PromotionApplication,
  registry: PromotionInstallationRegistry,
  generation: ValidatedGeneration,
): PromotionArtifactStore {
  const records = new Map<string, Readonly<{ evidence: RecordedTablebaseEvidence; receipt: InstalledRecordedAuthorityReceipt }>>();
  const legal = new Map<string, LegalStatusResult>();
  let store!: PromotionArtifactStore;
  store = Object.freeze({
    application,
    registry,
    generationId: generation.entry.generationId,
    lookup(this: PromotionArtifactStore, fen: CanonicalFullFen) {
      assertStore(this, store, registry, application);
      parseCanonicalFullFen(fen);
      const found = records.get(fen);
      return found === undefined ? Object.freeze({ kind: "absent" as const }) : Object.freeze({ kind: "found" as const, ...found });
    },
    legalStatus(this: PromotionArtifactStore, fen: CanonicalFullFen) {
      assertStore(this, store, registry, application);
      parseCanonicalFullFen(fen);
      return legal.get(fen) ?? Object.freeze({ kind: "absent" as const });
    },
  });
  STORES.add(store);
  for (const subject of generation.subjects) {
    const payload = immutable({
      kind: "tablebase_result" as const,
      fen: subject.declaration.fen,
      sourceId: subject.declaration.sourceId,
      retrievedAt: subject.declaration.retrievedAt,
      values: subject.response,
    });
    const evidence = declareEvidence(
      { id: "recorded.tablebase", version: 1 },
      { id: "recorded.tablebase.result", version: 1 },
      payload,
    );
    const receipt: InstalledRecordedAuthorityReceipt = Object.freeze({
      application,
      installation: application.installation,
      registry,
      store,
      generationId: generation.entry.generationId,
      generationManifestDigest: generation.manifestDigest,
      packFileDigest: generation.packFileDigest,
      packDigest: generation.packDigest,
      manifestDigest: generation.sourceFileDigest,
      ledgerDigest: generation.ledgerFileDigest,
      responseDigest: subject.responseDigest,
      legalMapDigest: subject.legal.kind === "available" ? subject.legal.digest : null,
      pack: generation.pack,
      manifest: generation.manifest,
      ledger: generation.ledger,
      source: subject.source,
      record: subject.record,
      parsedResponse: subject.response,
      legalMoves: subject.legal.kind === "available" ? subject.legal.evidence : null,
      evidence,
    });
    RECORDED.set(evidence, receipt);
    records.set(subject.declaration.fen, Object.freeze({ evidence, receipt }));
    legal.set(subject.declaration.fen, subject.legal.kind === "available"
      ? Object.freeze({ kind: "available" as const, evidence: subject.legal.evidence, digest: subject.legal.digest })
      : Object.freeze({ kind: "unavailable" as const }));
  }
  return store;
}

export function recordedAuthorityReceipt(evidence: RecordedTablebaseEvidence): InstalledRecordedAuthorityReceipt {
  const receipt = RECORDED.get(evidence);
  if (receipt === undefined || receipt.evidence !== evidence || !APPLICATIONS.has(receipt.application) || !REGISTRIES.has(receipt.registry) || !STORES.has(receipt.store)) {
    fail("INSTALLED_RECORDED_AUTHORITY_REQUIRED");
  }
  if (receipt.installation !== receipt.application.installation || receipt.registry.application !== receipt.application || receipt.store.registry !== receipt.registry) {
    fail("INSTALLED_RECORDED_AUTHORITY_CROSSED");
  }
  return receipt;
}

export function createPromotionRaceTablebaseRequest(
  store: PromotionArtifactStore,
  fen: string,
  signal: AbortSignal,
): PromotionRaceTablebaseRequest {
  if (!STORES.has(store) || !REGISTRIES.has(store.registry) || store.registry.application !== store.application) {
    fail("PROMOTION_ARTIFACT_STORE_AUTHORITY_REQUIRED");
  }
  const request = Object.freeze({ store, fen: parseCanonicalFullFen(fen), signal });
  REQUESTS.set(request, store);
  return request;
}

export async function collectPromotionRaceTablebase(
  request: PromotionRaceTablebaseRequest,
): Promise<PromotionRaceTablebaseResult> {
  const store = REQUESTS.get(request);
  if (store === undefined || request.store !== store || !STORES.has(store)) fail("PROMOTION_REQUEST_AUTHORITY_REQUIRED");
  if (request.signal.aborted) return sealUnavailable(request, store, "cancelled", ["recorded_tablebase"]);
  const found = store.lookup(request.fen);
  if (found.kind === "absent") return sealUnavailable(request, store, "provider_unavailable", ["recorded_tablebase"]);
  const receipt = recordedAuthorityReceipt(found.evidence);
  if (receipt.store !== store || receipt.generationId !== store.generationId || found.evidence.payload.fen !== request.fen) {
    fail("PROMOTION_RECORDED_LINEAGE_CROSSED");
  }
  const legal = store.legalStatus(request.fen);
  if (legal.kind !== "available") return sealUnavailable(request, store, "input_abstained", ["legal_moves"], receipt);
  if (legal.evidence.payload.fen !== request.fen || receipt.legalMoves !== legal.evidence) fail("PROMOTION_LEGAL_LINEAGE_CROSSED");
  const immediatePromotion = Object.freeze(legal.evidence.payload.pieces.flatMap((piece) => piece.moves).filter((move) => move.promotion !== undefined));
  const sourceValues = found.evidence.payload.values;
  const item = declareEvidence(
    { id: "derived.pawn", version: 1 },
    { id: "derived.pawn.promotion_race_tablebase", version: 1 },
    immutable({
      fen: request.fen,
      perspective: "side_to_move" as const,
      category: sourceValues.category,
      dtz: sourceValues.dtz,
      preciseDtz: sourceValues.preciseDtz ?? null,
      source: found.evidence,
      immediatePromotion,
    }),
  );
  DERIVED.set(item, Object.freeze({ request, source: found.evidence, legalMoves: legal.evidence }));
  const result = Object.freeze({ kind: "reading" as const, request, item, source: found.evidence, receipt });
  RESULTS.set(result, Object.freeze({ request, store, receipt }));
  return result;
}

export function assertPromotionRaceTablebaseResult(value: unknown): asserts value is PromotionRaceTablebaseResult {
  if (value === null || typeof value !== "object") fail("PROMOTION_RESULT_AUTHORITY_REQUIRED");
  const authority = RESULTS.get(value);
  if (authority === undefined || REQUESTS.get(authority.request) !== authority.store || !STORES.has(authority.store)) fail("PROMOTION_RESULT_AUTHORITY_REQUIRED");
  const result = value as PromotionRaceTablebaseResult;
  if (result.request !== authority.request || result.request.store !== authority.store) fail("PROMOTION_RESULT_LINEAGE_CROSSED");
  if (result.kind === "reading") {
    const derivation = DERIVED.get(result.item);
    if (authority.receipt === null || result.receipt !== authority.receipt || result.source !== authority.receipt.evidence || derivation === undefined || derivation.request !== result.request || derivation.source !== result.source || derivation.legalMoves !== authority.receipt.legalMoves) {
      fail("PROMOTION_RESULT_LINEAGE_CROSSED");
    }
    if (recordedAuthorityReceipt(result.source) !== result.receipt || result.item.payload.fen !== result.request.fen || result.item.payload.source !== result.source) {
      fail("PROMOTION_RESULT_LINEAGE_CROSSED");
    }
  } else if (authority.receipt !== null && result.reason !== "input_abstained") {
    fail("PROMOTION_RESULT_LINEAGE_CROSSED");
  }
}

function sealUnavailable(
  request: PromotionRaceTablebaseRequest,
  store: PromotionArtifactStore,
  reason: Extract<PromotionRaceTablebaseResult, { kind: "unavailable" }>["reason"],
  missing: readonly ("recorded_tablebase" | "legal_moves")[],
  receipt: InstalledRecordedAuthorityReceipt | null = null,
): PromotionRaceTablebaseResult {
  const result = Object.freeze({ kind: "unavailable" as const, request, reason, missing: Object.freeze([...missing]) });
  RESULTS.set(result, Object.freeze({ request, store, receipt }));
  return result;
}

async function validateGeneration(
  installation: InstalledPromotionSnapshot,
  entry: InventoryEntry,
): Promise<ValidatedGeneration> {
  const root = resolve(installation.inventoryRoot, entry.directory);
  if (await realpath(root) !== root) fail("PROMOTION_GENERATION_PATH_CROSSED");
  const generationFile = await canonicalFile(resolve(root, "promotion-generation.json"));
  if (generationFile.digest !== entry.manifestDigest) fail("PROMOTION_GENERATION_DIGEST_MISMATCH");
  const document = parsePromotionGeneration(generationFile.value);
  if (document.generationId !== entry.generationId) fail("PROMOTION_GENERATION_ID_CROSSED");

  const [packFile, sourceFile, ledgerFile] = await Promise.all([
    declaredFile(root, document.pack),
    declaredFile(root, document.sources),
    declaredFile(root, document.evidence),
  ]);
  const packResult = validatePackDocument(packFile.value);
  if (!packResult.valid || packResult.document === undefined) fail("PROMOTION_PACK_INVALID");
  const pack = immutable(packResult.document);
  const packDigest = await digestDrillPack(pack) as Digest;
  const issues: SourcingIssue[] = [];
  const manifest = validateManifest(sourceFile.value, issues);
  const ledger = validateLedger(ledgerFile.value, issues);
  if (manifest !== undefined && ledger !== undefined) {
    linkage(manifest, ledger, issues);
    evidenceSemantics(ledger, issues, manifest, pack);
    evidenceSupports(pack, ledger, manifest, issues);
  }
  if (manifest === undefined || ledger === undefined || issues.some((issue) => issue.severity === "error")) fail("PROMOTION_SOURCING_INVALID");
  if (ledger.packId !== pack.id || ledger.packVersion !== pack.version || ledger.packDigest !== packDigest) fail("PROMOTION_PACK_SUBJECT_CROSSED");

  const subjects = await Promise.all(document.responses.map(async (declaration): Promise<RetainedSubject> => {
    const responseFile = await declaredFile(root, declaration, declaration.bytes);
    const response = immutable(parseTablebasePosition(responseFile.value));
    const source = manifest.entries.find((candidate) => candidate.sourceId === declaration.sourceId && candidate.retrievedAt === declaration.retrievedAt);
    const record = ledger.records.find((candidate) => candidate.kind === "tablebase_result" && candidate.anchor.fen === declaration.fen && candidate.sourceId === declaration.sourceId && candidate.retrievedAt === declaration.retrievedAt);
    if (source === undefined || record === undefined) fail("PROMOTION_RECORDED_SUBJECT_MISSING");
    assertSource(declaration, source, responseFile);
    assertRecord(declaration, record, response, pack);
    const legalDeclaration = document.legalMaps.find((candidate) => candidate.fen === declaration.fen);
    if (legalDeclaration === undefined) fail("PROMOTION_LEGAL_MAP_MISSING");
    let legal: RetainedSubject["legal"];
    if (legalDeclaration.status === "unavailable") {
      legal = Object.freeze({ kind: "unavailable" as const });
    } else {
      const legalFile = await declaredFile(root, { path: legalDeclaration.path!, digest: legalDeclaration.digest! });
      const exact = exactLegalMoveMap(declaration.fen);
      if (!sameJson(legalFile.value, { schema: "tabiya.legal-map.v1", fen: declaration.fen, pieces: exact.pieces })) fail("PROMOTION_LEGAL_MAP_INVALID");
      const evidence = declareExactLegalMovesEvidence(exact);
      const responseMoves = new Set(exact.pieces.flatMap((piece) => piece.moves).map((move) => move.uci));
      if (response.moves.some((move) => !responseMoves.has(move.uci))) fail("PROMOTION_RESPONSE_MOVE_INVALID");
      legal = Object.freeze({ kind: "available" as const, evidence, digest: legalFile.digest });
    }
    return Object.freeze({ declaration, source, record, response, responseDigest: responseFile.digest, legal });
  }));
  return Object.freeze({
    entry,
    document,
    manifestDigest: generationFile.digest,
    pack,
    packFileDigest: packFile.digest,
    packDigest,
    manifest,
    sourceFileDigest: sourceFile.digest,
    ledger,
    ledgerFileDigest: ledgerFile.digest,
    subjects: Object.freeze(subjects),
  });
}

function assertSource(declaration: ResponseDeclaration, source: SourceEntry, file: CanonicalFile): void {
  if (source.origin.kind !== "http" || source.sourceId !== "syzygy" || source.origin.status !== 200 || source.origin.sha256 !== file.digest || source.origin.bytes !== declaration.bytes) {
    fail("PROMOTION_RESPONSE_SOURCE_CROSSED");
  }
  const url = new URL(source.origin.url);
  if (url.protocol !== "https:" || url.hostname !== "tablebase.lichess.org" || url.pathname !== "/standard" || url.searchParams.get("fen") !== declaration.fen || Date.parse(source.retrievedAt) > Date.now()) {
    fail("PROMOTION_RESPONSE_SOURCE_CROSSED");
  }
}

function assertRecord(declaration: ResponseDeclaration, record: EvidenceRecord, response: TablebasePosition, pack: DrillPackDefinition): void {
  if (countFenPieces(declaration.fen) > 7 || record.grounds !== "machine_validation" || record.values.fen !== declaration.fen || record.values.pieceCount !== countFenPieces(declaration.fen)) {
    fail("PROMOTION_TABLEBASE_SUBJECT_CROSSED");
  }
  if (record.supports.length !== 1 || record.supports[0] !== "/start/fen" || pack.start.fen !== declaration.fen) fail("PROMOTION_SUPPORT_SEMANTICS_CROSSED");
  if (record.values.category !== response.category || record.values.dtz !== response.dtz || (record.values.precise_dtz ?? null) !== (response.preciseDtz ?? null)) {
    fail("PROMOTION_RESPONSE_VALUE_CROSSED");
  }
}

export function parsePromotionGeneration(value: unknown): GenerationDocument {
  const row = object(value, "PROMOTION_GENERATION_INVALID");
  exact(row, ["schema", "generationId", "pack", "sources", "evidence", "responses", "legalMaps"], "PROMOTION_GENERATION_INVALID");
  if (row.schema !== "tabiya.promotion-generation.v1" || !nonempty(row.generationId) || !Array.isArray(row.responses) || !Array.isArray(row.legalMaps) || row.responses.length === 0 || row.legalMaps.length === 0) fail("PROMOTION_GENERATION_INVALID");
  const responses = row.responses.map((candidate) => {
    const item = object(candidate, "PROMOTION_RESPONSE_DECLARATION_INVALID");
    exact(item, ["fen", "sourceId", "retrievedAt", "path", "digest", "bytes"], "PROMOTION_RESPONSE_DECLARATION_INVALID");
    if (!nonempty(item.fen) || !nonempty(item.sourceId) || !instant(item.retrievedAt) || !relative(item.path) || !digest(item.digest) || !Number.isSafeInteger(item.bytes) || Number(item.bytes) <= 0) fail("PROMOTION_RESPONSE_DECLARATION_INVALID");
    return immutable({ fen: parseCanonicalFullFen(item.fen), sourceId: item.sourceId, retrievedAt: item.retrievedAt, path: item.path, digest: item.digest, bytes: item.bytes }) as ResponseDeclaration;
  });
  const legalMaps = row.legalMaps.map((candidate) => {
    const item = object(candidate, "PROMOTION_LEGAL_DECLARATION_INVALID");
    exact(item, ["fen", "status", "path", "digest"], "PROMOTION_LEGAL_DECLARATION_INVALID");
    if (!nonempty(item.fen) || (item.status !== "available" && item.status !== "unavailable")) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    if (item.status === "available" && (!relative(item.path) || !digest(item.digest))) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    if (item.status === "unavailable" && (item.path !== null || item.digest !== null)) fail("PROMOTION_LEGAL_DECLARATION_INVALID");
    return immutable({ fen: parseCanonicalFullFen(item.fen), status: item.status, path: item.path, digest: item.digest }) as LegalDeclaration;
  });
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
  }) as GenerationDocument;
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
  requireUnique(entries.map((entry) => entry.generationId), "PROMOTION_INSTALLATION_INVALID");
  return Object.freeze(entries);
}

async function declaredFile(root: string, declaration: FileReference, expectedBytes?: number): Promise<CanonicalFile> {
  const path = resolve(root, declaration.path);
  if (await realpath(path) !== path) fail("PROMOTION_ARTIFACT_PATH_CROSSED");
  const file = await canonicalFile(path);
  if (file.digest !== declaration.digest) fail("PROMOTION_ARTIFACT_DIGEST_MISMATCH");
  if (expectedBytes !== undefined && Buffer.byteLength(file.bytes) !== expectedBytes) fail("PROMOTION_ARTIFACT_LENGTH_MISMATCH");
  return file;
}

async function canonicalFile(path: string): Promise<CanonicalFile> {
  const bytes = await readFile(path, "utf8");
  const value = JSON.parse(bytes) as unknown;
  if (bytes !== `${canonicalizeJson(value)}\n`) fail("PROMOTION_ARTIFACT_NONCANONICAL");
  return Object.freeze({ value: immutable(value), bytes, digest: sha256(bytes) as Digest });
}

function parseCanonicalFullFen(value: string): CanonicalFullFen {
  if (canonicalFen(positionFromFen(value)) !== value) fail("PROMOTION_CANONICAL_FULL_FEN_REQUIRED");
  return value as CanonicalFullFen;
}

function assertStore(actual: PromotionArtifactStore, expected: PromotionArtifactStore, registry: PromotionInstallationRegistry, application: PromotionApplication): void {
  if (actual !== expected || !STORES.has(actual) || actual.registry !== registry || actual.application !== application) fail("PROMOTION_ARTIFACT_STORE_AUTHORITY_REQUIRED");
}

function fileReference(value: unknown): FileReference {
  const row = object(value, "PROMOTION_FILE_REFERENCE_INVALID");
  exact(row, ["path", "digest"], "PROMOTION_FILE_REFERENCE_INVALID");
  if (!relative(row.path) || !digest(row.digest)) fail("PROMOTION_FILE_REFERENCE_INVALID");
  return immutable({ path: row.path, digest: row.digest }) as FileReference;
}
function subject(value: ResponseDeclaration): string { return `${value.fen}\u0000${value.sourceId}\u0000${value.retrievedAt}`; }
function object(value: unknown, code: string): JsonObject { if (value === null || typeof value !== "object" || Array.isArray(value)) fail(code); return value as JsonObject; }
function exact(value: JsonObject, keys: readonly string[], code: string): void { const actual = Object.keys(value).sort(); const expected = [...keys].sort(); if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) fail(code); }
function requiredPath(value: unknown): string { if (!nonempty(value)) fail("PROMOTION_INSTALLATION_PATH_REQUIRED"); return resolve(value); }
function nonempty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function relative(value: unknown): value is string { return nonempty(value) && !value.startsWith("/") && !value.split("/").includes(".."); }
function digest(value: unknown): value is Digest { return typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value); }
function instant(value: unknown): value is string { return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value; }
function requireUnique(values: readonly string[], code: string): void { if (new Set(values).size !== values.length) fail(code); }
function setEqual(left: readonly string[], right: readonly string[], code: string): void { const a = [...left].sort(); const b = [...right].sort(); if (a.length !== b.length || a.some((value, index) => value !== b[index])) fail(code); }
function sameJson(left: unknown, right: unknown): boolean { return canonicalizeJson(left) === canonicalizeJson(right); }
function immutable<T>(value: T): T { if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value; if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T; return Object.freeze(Object.fromEntries(Object.entries(value as JsonObject).map(([key, child]) => [key, immutable(child)]))) as T; }
function fail(code: string): never { throw new TypeError(code); }
