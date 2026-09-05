// DISPOSABLE bounded author repair for D2765-D2770. Not production code.
import { readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";

import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import { resolvePointer } from "../../apps/server/src/sourcing/check.js";
import { countFenPieces } from "../../apps/server/src/sourcing/chess-facts.js";
import { linkage, validateLedger, validateManifest } from "../../apps/server/src/sourcing/ledger-validation.js";
import type { EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest } from "../../apps/server/src/sourcing/types.js";
import type { CanonicalFullFen } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  assertPromotionRaceTablebaseResult as assertPriorResult,
  collectPromotionRaceTablebase as collectPrior,
  createExactLegalMovesResolver,
  createPromotionRaceTablebaseRequest as createPriorRequest,
  createProviderSourceFactories,
  createRecordedTablebaseLookup,
  createRecordedTablebaseResultV1Evidence,
  createSourcingLedgerTablebaseResultV1Evidence,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
  recordedTablebaseValueReceipt,
  type PromotionRaceTablebaseRequest,
  type PromotionRaceTablebaseResult as PriorResult,
  type ProviderExchangeScheduler,
  type ProviderSourceFactories,
  type RecordedTablebaseEvidence,
  type SyzygyFixtureOutcome,
} from "../d2693-semantic-collectors-promotion-eighth-author-repair/model.js";

export {
  createProviderSourceFactories,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
  recordedTablebaseValueReceipt,
};
export type { ProviderExchangeScheduler, ProviderSourceFactories, SyzygyFixtureOutcome };

type StorageFailureReason = "storage_unavailable" | "invalid_record";

export interface DurableArtifactIdentity {
  readonly root: string;
  readonly documentDigest: `sha256:${string}`;
  readonly manifestDigest: `sha256:${string}`;
  readonly ledgerDigest: `sha256:${string}`;
  readonly observedAt: string;
}

export interface DurableRecordedAuthorityReceipt {
  readonly artifact: DurableArtifactIdentity;
  readonly manifest: SourceManifest;
  readonly ledger: EvidenceLedger;
  readonly source: SourceEntry;
  readonly record: EvidenceRecord;
  readonly evidence: RecordedTablebaseEvidence;
}

type DurableLookupResult =
  | Readonly<{ kind: "found"; evidence: RecordedTablebaseEvidence; receipt: DurableRecordedAuthorityReceipt }>
  | Readonly<{ kind: "absent"; artifact: DurableArtifactIdentity }>
  | Readonly<{ kind: "failed"; reason: StorageFailureReason }>;

type LegalReadiness =
  | Readonly<{ kind: "available"; artifactDigest: `sha256:${string}` }>
  | Readonly<{ kind: "unavailable"; reason: "upstream_unavailable" }>;

export interface PromotionArtifactStore {
  readonly root: string;
  lookup(fen: CanonicalFullFen): Promise<DurableLookupResult>;
  legalReadiness(): Promise<LegalReadiness>;
}

const STORES = new WeakSet<object>();
const RECORDED_RECEIPTS = new WeakMap<object, DurableRecordedAuthorityReceipt>();

function immutable<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T;
  return Object.freeze(Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, child]) => [key, immutable(child)]))) as T;
}

async function canonicalFile(path: string): Promise<{ readonly value: unknown; readonly digest: `sha256:${string}` }> {
  const bytes = await readFile(path, "utf8");
  const value = JSON.parse(bytes) as unknown;
  if (bytes !== `${canonicalizeJson(value)}\n`) throw new TypeError("DURABLE_ARTIFACT_NONCANONICAL");
  return Object.freeze({ value, digest: sha256(bytes) as `sha256:${string}` });
}

function syzygySource(entry: SourceEntry, record: EvidenceRecord): void {
  if (entry.origin.kind !== "http") throw new TypeError("SYZYGY_SOURCE_ORIGIN_REQUIRED");
  const url = new URL(entry.origin.url);
  if (url.protocol !== "https:" || url.hostname !== "tablebase.lichess.org" || url.pathname !== "/standard" || url.searchParams.get("fen") !== record.anchor.fen || entry.origin.status !== 200) {
    throw new TypeError("SYZYGY_SOURCE_ORIGIN_REQUIRED");
  }
  if (entry.origin.sha256 === null || entry.origin.bytes === null) throw new TypeError("SYZYGY_SOURCE_RESPONSE_IDENTITY_REQUIRED");
}

function validatedArtifacts(
  root: string,
  observedAt: string,
  documentFile: Awaited<ReturnType<typeof canonicalFile>>,
  manifestFile: Awaited<ReturnType<typeof canonicalFile>>,
  ledgerFile: Awaited<ReturnType<typeof canonicalFile>>,
): Readonly<{ document: unknown; manifest: SourceManifest; ledger: EvidenceLedger; artifact: DurableArtifactIdentity }> {
  const issues: Parameters<typeof validateManifest>[1] = [];
  const manifest = validateManifest(manifestFile.value, issues);
  const ledger = validateLedger(ledgerFile.value, issues);
  if (manifest !== undefined && ledger !== undefined) linkage(manifest, ledger, issues);
  if (manifest === undefined || ledger === undefined || issues.length > 0) throw new TypeError(`DURABLE_SOURCING_INVALID:${issues.map((item) => item.code).join(",")}`);
  const now = Date.parse(observedAt);
  if (Date.parse(ledger.sourcedAt) > now || manifest.entries.some((entry) => Date.parse(entry.retrievedAt) > now)) throw new TypeError("DURABLE_SOURCING_FROM_FUTURE");
  for (const record of ledger.records) {
    for (const pointer of record.supports) if (!resolvePointer(documentFile.value, pointer).found) throw new TypeError("DURABLE_SUPPORT_POINTER_UNRESOLVED");
  }
  return immutable({
    document: documentFile.value,
    manifest,
    ledger,
    artifact: {
      root,
      documentDigest: documentFile.digest,
      manifestDigest: manifestFile.digest,
      ledgerDigest: ledgerFile.digest,
      observedAt,
    },
  });
}

export async function openPromotionArtifactStore(directory: string): Promise<PromotionArtifactStore> {
  const root = await realpath(directory);
  const store: PromotionArtifactStore = Object.freeze({
    root,
    async lookup(fen: CanonicalFullFen) {
      try {
        const observedAt = new Date().toISOString();
        const [documentFile, manifestFile, ledgerFile] = await Promise.all([
          canonicalFile(resolve(root, "pack.json")),
          canonicalFile(resolve(root, "sources.json")),
          canonicalFile(resolve(root, "evidence.json")),
        ]);
        const artifacts = validatedArtifacts(root, observedAt, documentFile, manifestFile, ledgerFile);
        const matches = artifacts.ledger.records.filter((record) => record.kind === "tablebase_result" && record.anchor.fen === fen);
        if (matches.length === 0) return Object.freeze({ kind: "absent" as const, artifact: artifacts.artifact });
        if (matches.length !== 1) throw new TypeError("DURABLE_TABLEBASE_RECORD_AMBIGUOUS");
        const record = matches[0]!;
        if (countFenPieces(fen) > 7 || record.values.fen !== fen || record.values.pieceCount !== countFenPieces(fen)) throw new TypeError("DURABLE_TABLEBASE_SUBJECT_INVALID");
        const source = artifacts.manifest.entries.find((entry) => entry.sourceId === record.sourceId && entry.retrievedAt === record.retrievedAt);
        if (source === undefined) throw new TypeError("DURABLE_TABLEBASE_SOURCE_MISSING");
        syzygySource(source, record);
        const ledgerEvidence = createSourcingLedgerTablebaseResultV1Evidence({ fen, sourceId: source.sourceId, retrievedAt: source.retrievedAt, rawPosition: record.values });
        const evidence = createRecordedTablebaseResultV1Evidence(ledgerEvidence);
        const receipt = Object.freeze({ artifact: artifacts.artifact, manifest: artifacts.manifest, ledger: artifacts.ledger, source, record, evidence });
        RECORDED_RECEIPTS.set(evidence, receipt);
        return Object.freeze({ kind: "found" as const, evidence, receipt });
      } catch (error) {
        const reason: StorageFailureReason = error instanceof SyntaxError || error instanceof TypeError ? "invalid_record" : "storage_unavailable";
        return Object.freeze({ kind: "failed" as const, reason });
      }
    },
    async legalReadiness() {
      try {
        const file = await canonicalFile(resolve(root, "legal-authority.json"));
        if (canonicalizeJson(file.value) !== '{"status":"available"}') throw new TypeError("LEGAL_AUTHORITY_INVALID");
        return Object.freeze({ kind: "available" as const, artifactDigest: file.digest });
      } catch {
        return Object.freeze({ kind: "unavailable" as const, reason: "upstream_unavailable" as const });
      }
    },
  });
  STORES.add(store);
  return store;
}

export function recordedAuthorityReceipt(evidence: RecordedTablebaseEvidence): DurableRecordedAuthorityReceipt {
  const receipt = RECORDED_RECEIPTS.get(evidence);
  if (receipt === undefined || receipt.evidence !== evidence) throw new TypeError("DURABLE_RECORDED_AUTHORITY_MISSING");
  return receipt;
}

const REQUESTS = new WeakSet<object>();
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

export type PromotionRaceResult = PriorResult
  | Readonly<{ kind: "unavailable"; reason: "outside_tablebase_domain"; request: PromotionRaceTablebaseRequest; pieceCount: number; maximumPieceCount: 7 }>
  | Readonly<{ kind: "unavailable"; reason: "input_abstained"; request: PromotionRaceTablebaseRequest; missing: readonly ["legal_moves"]; upstreamReason: "upstream_unavailable" }>;

const OWN_RESULTS = new WeakSet<object>();

export async function collectPromotionRaceTablebase(request: PromotionRaceTablebaseRequest, dependencies: PromotionRaceDependencies): Promise<PromotionRaceResult> {
  if (!REQUESTS.has(request)) throw new TypeError("PROMOTION_REQUEST_UNSEALED");
  if (!STORES.has(dependencies.artifacts)) throw new TypeError("PROMOTION_ARTIFACT_STORE_UNSEALED");
  if (request.geometry.kind === "completed" && request.geometry.output.kind === "evidence") {
    const fen = request.geometry.output.item.payload.fen as CanonicalFullFen;
    const pieceCount = countFenPieces(fen);
    if (pieceCount > 7) {
      const output = Object.freeze({ kind: "unavailable" as const, reason: "outside_tablebase_domain" as const, request, pieceCount, maximumPieceCount: 7 as const });
      OWN_RESULTS.add(output);
      return output;
    }
    const recorded = await dependencies.artifacts.lookup(fen);
    if (recorded.kind === "failed") throw new TypeError(`RECORDED_TABLEBASE_${recorded.reason.toUpperCase()}`);
    const legal = await dependencies.artifacts.legalReadiness();
    if (legal.kind === "unavailable") {
      const output = Object.freeze({ kind: "unavailable" as const, reason: "input_abstained" as const, request, missing: Object.freeze(["legal_moves"] as const), upstreamReason: legal.reason });
      OWN_RESULTS.add(output);
      return output;
    }
    const lookup = createRecordedTablebaseLookup(recorded.kind === "found" ? [recorded.evidence] : []);
    return collectPrior(request, { recordedLookup: lookup, resolveLegalMoves: createExactLegalMovesResolver(), scheduler: dependencies.scheduler, sourceFactories: dependencies.sourceFactories });
  }
  return collectPrior(request, { recordedLookup: createRecordedTablebaseLookup([]), resolveLegalMoves: createExactLegalMovesResolver(), scheduler: dependencies.scheduler, sourceFactories: dependencies.sourceFactories });
}

export function assertPromotionRaceTablebaseResult(value: unknown): asserts value is PromotionRaceResult {
  if (value !== null && typeof value === "object" && OWN_RESULTS.has(value)) {
    const result = value as Extract<PromotionRaceResult, { kind: "unavailable" }>;
    if (!REQUESTS.has(result.request)) throw new TypeError("PROMOTION_RESULT_REQUEST_UNSEALED");
    return;
  }
  assertPriorResult(value);
}
