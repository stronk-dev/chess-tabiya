import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { canonicalizeJson, digestDrillPack, type DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import { afterEach, describe, expect, test } from "vitest";

import { createRulesMobilityReadingLegalMovesV1Evidence, createRulesPawnReadingContactsV1Evidence, type CanonicalFullFen } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  assertPromotionRaceTablebaseResult,
  collectPromotionRaceTablebase,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  openPromotionInstallationRegistry,
  recordedAuthorityReceipt,
  type PromotionArtifactStore,
  type PromotionInstallationRegistry,
} from "./model.js";
import {
  collectPromotionRaceTablebase as collectLegacy,
  createExactLegalMovesResolver,
  createPromotionRaceTablebaseRequest as createLegacyRequest,
  createRecordedTablebaseLookup,
  createRecordedTablebaseResultV1Evidence,
  createSourcingLedgerTablebaseResultV1Evidence,
} from "../d2693-semantic-collectors-promotion-eighth-author-repair/model.js";

const roots: string[] = [];
const rootFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const crossedFen = "8/7P/8/8/8/8/p7/3K3k w - - 0 1" as CanonicalFullFen;
const retrievedAt = "2026-08-15T20:11:18.321Z";
const raw = { category: "win", dtz: 1, precise_dtz: 1, moves: [] };

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function canonical(path: string, value: unknown): Promise<Readonly<{ digest: `sha256:${string}`; bytes: number }>> {
  const bytes = `${canonicalizeJson(value)}\n`;
  await writeFile(path, bytes, "utf8");
  return Object.freeze({ digest: sha256(bytes) as `sha256:${string}`, bytes: Buffer.byteLength(bytes) });
}

interface BuildOptions {
  readonly invalidPack?: boolean;
  readonly recordFen?: CanonicalFullFen;
  readonly falseResponseIdentity?: boolean;
  readonly invalidLegalMap?: boolean;
  readonly legalUnavailable?: boolean;
  readonly sourceId?: string;
  readonly observationAt?: string;
}

async function build(options: BuildOptions = {}): Promise<Readonly<{ root: string; inventoryPath: string; registry: PromotionInstallationRegistry; store: PromotionArtifactStore | undefined }>> {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-installation-"));
  roots.push(root);
  const generationRoot = resolve(root, "generation-1");
  await import("node:fs/promises").then(({ mkdir }) => mkdir(generationRoot));
  const example = JSON.parse(await readFile(resolve("schemas/drill_pack.example.json"), "utf8")) as DrillPackDefinition;
  const pack: Record<string, unknown> = {
    id: "promotion-race-author-fixture",
    version: "1.0.0",
    title: "Promotion race contract fixture",
    mode: "line",
    start: { fen: rootFen, side: "white" },
    objective: { type: "play_until_checkpoint", summary: "Reach the promotion checkpoint.", successConditions: [{ kind: "reach_checkpoint", checkpointId: "promoted" }] },
    checkpoints: [{ id: "promoted", label: "Promotion", trigger: { atSpineNode: "promote" }, actions: ["compare_branches"] }],
    opponentPolicy: example.opponentPolicy,
    feedbackPolicy: example.feedbackPolicy,
    provenance: { reviewStatus: "draft", sources: [] },
    spine: [{ id: "promote", moveUci: "h7h8q", moveSan: "h8=Q+", children: [] }],
  };
  if (options.invalidPack) delete pack.objective;
  const recordFen = options.recordFen ?? rootFen;
  const sourceId = options.sourceId ?? "syzygy";
  const observationAt = options.observationAt ?? retrievedAt;
  const packFile = await canonical(resolve(generationRoot, "pack.json"), pack);
  const packDigest = await digestDrillPack(pack as unknown as DrillPackDefinition);
  const responseFile = await canonical(resolve(generationRoot, "response.json"), raw);
  const claimedResponseDigest = options.falseResponseIdentity ? `sha256:${"f".repeat(64)}` as const : responseFile.digest;
  const claimedResponseBytes = options.falseResponseIdentity ? responseFile.bytes + 1 : responseFile.bytes;
  const sources = {
    schema: "tabiya.sourcing.manifest.v1",
    entries: [{
      sourceId,
      retrievedAt: observationAt,
      origin: {
        kind: "http",
        url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(recordFen)}`,
        status: 200,
        sha256: claimedResponseDigest,
        bytes: claimedResponseBytes,
        etag: null,
      },
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "machine response" },
    }],
  };
  const sourceFile = await canonical(resolve(generationRoot, "sources.json"), sources);
  const evidence = {
    schema: "tabiya.sourcing.evidence.v1",
    packId: pack.id,
    packVersion: pack.version,
    packDigest,
    sourcedAt: observationAt,
    records: [{
      kind: "tablebase_result",
      anchor: { fen: recordFen },
      sourceId,
      retrievedAt: observationAt,
      grounds: "machine_validation",
      values: {
        category: "win",
        checkmate: false,
        dtm: null,
        dtz: 1,
        fen: recordFen,
        insufficient_material: false,
        pieceCount: recordFen.split(" ")[0]!.replaceAll("/", "").replaceAll(/[1-8]/gu, "").length,
        precise_dtz: 1,
        stalemate: false,
      },
      supports: ["/start/fen"],
    }],
    abstentions: [],
  };
  const evidenceFile = await canonical(resolve(generationRoot, "evidence.json"), evidence);
  const exactLegal = createRulesMobilityReadingLegalMovesV1Evidence(recordFen);
  const legalValue = options.invalidLegalMap
    ? { schema: "tabiya.legal-map.v1", fen: rootFen, pieces: [] }
    : { schema: "tabiya.legal-map.v1", fen: recordFen, pieces: exactLegal.payload.pieces };
  const legalFile = await canonical(resolve(generationRoot, "legal.json"), legalValue);
  const generation = {
    schema: "tabiya.promotion-generation.v1",
    generationId: "generation-1",
    pack: { path: "pack.json", digest: packFile.digest },
    sources: { path: "sources.json", digest: sourceFile.digest },
    evidence: { path: "evidence.json", digest: evidenceFile.digest },
    responses: [{ fen: recordFen, sourceId, retrievedAt: observationAt, path: "response.json", digest: responseFile.digest, bytes: responseFile.bytes }],
    legalMaps: options.legalUnavailable
      ? [{ fen: recordFen, status: "unavailable", path: null, digest: null }]
      : [{ fen: recordFen, status: "available", path: "legal.json", digest: legalFile.digest }],
  };
  const generationFile = await canonical(resolve(generationRoot, "promotion-generation.json"), generation);
  const inventoryPath = resolve(root, "promotion-installation.json");
  await canonical(inventoryPath, {
    schema: "tabiya.promotion-installation.v1",
    generations: [{ generationId: "generation-1", directory: "generation-1", manifestDigest: generationFile.digest }],
  });
  const registry = await openPromotionInstallationRegistry(inventoryPath);
  let store: PromotionArtifactStore | undefined;
  try { store = await registry.openGeneration("generation-1"); } catch { /* negative fixture */ }
  return Object.freeze({ root, inventoryPath, registry, store });
}

function geometry(fen: CanonicalFullFen) {
  return derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(fen) });
}

function request(fen: CanonicalFullFen) {
  return createPromotionRaceTablebaseRequest(geometry(fen), { id: "eleventh-author", budgetMs: 500 }, new AbortController().signal);
}

function dependencies(store: PromotionArtifactStore) {
  return { artifacts: store, scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw })), sourceFactories: createProviderSourceFactories() };
}

describe("semantic collectors promotion eleventh author repair", () => {
  test("D2789 only a listed generation opened by its exact registry reaches collection", async () => {
    const installed = await build();
    expect(installed.store).toBeDefined();
    await expect(installed.registry.openGeneration("unlisted")).rejects.toThrow(/NOT_INSTALLED/);
    const result = await collectPromotionRaceTablebase(request(rootFen), dependencies(installed.store!));
    expect(result.kind).toBe("reading");
    assertPromotionRaceTablebaseResult(result);
    const live = await collectPromotionRaceTablebase(request(crossedFen), dependencies(installed.store!));
    expect(live.kind).toBe("reading");
    if (live.kind !== "reading") throw new Error("live reading expected");
    expect(live.derivation.source.kind).toBe("live");
    assertPromotionRaceTablebaseResult(live);
    await expect(collectPromotionRaceTablebase(request(rootFen), dependencies({ ...installed.store! }))).rejects.toThrow(/STORE_UNSEALED/);
    const attacker = await build({ sourceId: "attacker" });
    expect(attacker.store).toBeUndefined();
    await expect(attacker.registry.openGeneration("generation-1")).rejects.toThrow(/RESPONSE_SOURCE_CROSSED/);
    const future = await build({ observationAt: "2999-01-01T00:00:00.000Z" });
    expect(future.store).toBeUndefined();
    await expect(future.registry.openGeneration("generation-1")).rejects.toThrow(/RESPONSE_SOURCE_CROSSED/);
  });

  test("D2790 complete pack identity is schema-valid and joined to ledger id/version/digest", async () => {
    const invalid = await build({ invalidPack: true });
    expect(invalid.store).toBeUndefined();
    await expect(invalid.registry.openGeneration("generation-1")).rejects.toThrow(/PACK_INVALID/);
    const valid = await build();
    const result = await collectPromotionRaceTablebase(request(rootFen), dependencies(valid.store!));
    if (result.kind !== "reading" || result.derivation.source.kind !== "recorded") throw new Error("recorded reading expected");
    const receipt = recordedAuthorityReceipt(result.derivation.source.evidence);
    expect(receipt.record).toMatchObject({ anchor: { fen: rootFen } });
    expect(receipt.pack).toMatchObject({ id: "promotion-race-author-fixture", version: "1.0.0" });
    expect(receipt.packDigest).toBe(await digestDrillPack(receipt.pack));
    expect(receipt.packFileDigest).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  test("D2791 an existing support whose value contradicts the record FEN is refused", async () => {
    const crossed = await build({ recordFen: crossedFen });
    expect(crossed.store).toBeUndefined();
    await expect(crossed.registry.openGeneration("generation-1")).rejects.toThrow(/SUPPORT_SEMANTICS_CROSSED/);
  });

  test("D2792 response bytes are retained, hashed, length-checked, parsed and value-joined", async () => {
    const crossed = await build({ falseResponseIdentity: true });
    expect(crossed.store).toBeUndefined();
    await expect(crossed.registry.openGeneration("generation-1")).rejects.toThrow(/RESPONSE_SOURCE_CROSSED/);
    const valid = await build();
    const result = await collectPromotionRaceTablebase(request(rootFen), dependencies(valid.store!));
    if (result.kind !== "reading" || result.derivation.source.kind !== "recorded") throw new Error("recorded reading expected");
    const receipt = recordedAuthorityReceipt(result.derivation.source.evidence);
    expect(receipt.responseDigest).toBe(receipt.source.origin.kind === "http" ? receipt.source.origin.sha256 : "wrong-kind");
    expect(receipt.parsedResponse).toMatchObject({ category: "win", dtz: 1, preciseDtz: 1 });
    expect(result.derivation.legalMoves).toBe(receipt.legalMoves);
  });

  test("D2793 exact FEN-bound legal maps are required and malformed maps are invalid, not absence", async () => {
    const malformed = await build({ invalidLegalMap: true });
    expect(malformed.store).toBeUndefined();
    await expect(malformed.registry.openGeneration("generation-1")).rejects.toThrow(/LEGAL_MAP_INVALID/);
    const absent = await build({ legalUnavailable: true });
    expect(absent.store).toBeDefined();
    const result = await collectPromotionRaceTablebase(request(rootFen), dependencies(absent.store!));
    expect(result).toMatchObject({ kind: "unavailable", reason: "input_abstained", upstreamReason: "upstream_unavailable" });
    assertPromotionRaceTablebaseResult(result);
  });

  test("D2794 predecessor recorded results cannot cross the current aggregate assertion", async () => {
    const source = createSourcingLedgerTablebaseResultV1Evidence({ fen: rootFen, sourceId: "legacy", retrievedAt, rawPosition: raw });
    const recorded = createRecordedTablebaseResultV1Evidence(source);
    const legacyRequest = createLegacyRequest(geometry(rootFen), { id: "legacy", budgetMs: 500 }, new AbortController().signal);
    const legacy = await collectLegacy(legacyRequest, {
      recordedLookup: createRecordedTablebaseLookup([recorded]),
      resolveLegalMoves: createExactLegalMovesResolver(),
      scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw })),
      sourceFactories: createProviderSourceFactories(),
    });
    expect(legacy.kind).toBe("reading");
    expect(() => assertPromotionRaceTablebaseResult(legacy)).toThrow(/CURRENT_PROMOTION_RESULT_UNSEALED/);
  });

  test("a validated generation is an immutable snapshot after its files change", async () => {
    const installed = await build();
    const before = await collectPromotionRaceTablebase(request(rootFen), dependencies(installed.store!));
    await writeFile(resolve(installed.root, "generation-1", "response.json"), '{}\n', "utf8");
    const after = await collectPromotionRaceTablebase(request(rootFen), dependencies(installed.store!));
    expect(before.kind).toBe("reading");
    expect(after.kind).toBe("reading");
    assertPromotionRaceTablebaseResult(after);
    await expect(installed.registry.openGeneration("generation-1")).rejects.toThrow(/ARTIFACT_DIGEST_MISMATCH/);
  });
});
