import { readFile } from "node:fs/promises";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { exactLegalMoveMap } from "../../packages/runtime/src/legal-moves.js";
import { canonicalizeJson, digestDrillPack, type DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import {
  assertPromotionRaceTablebaseResult,
  collectPromotionRaceTablebase,
  createPromotionApplicationComposition,
  createPromotionRaceTablebaseRequest,
  recordedAuthorityReceipt,
  type Digest,
} from "./model.js";

const roots: string[] = [];
const FEN = "8/7P/8/8/8/8/p7/4K2k w - - 0 1";
const OTHER_FEN = "8/7P/8/8/8/8/p7/3K3k w - - 0 1";
const RETRIEVED_AT = "2026-08-15T20:11:18.321Z";

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function canonical(path: string, value: unknown) {
  const bytes = `${canonicalizeJson(value)}\n`;
  await writeFile(path, bytes, "utf8");
  return Object.freeze({ bytes, digest: sha256(bytes) as Digest });
}

interface FixtureDocuments {
  pack: Record<string, unknown>;
  sources: Record<string, unknown>;
  evidence: Record<string, unknown>;
  response: Record<string, unknown>;
  legal: Record<string, unknown>;
}

async function installation(mutate?: (documents: FixtureDocuments) => void) {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-fifteenth-author-"));
  roots.push(root);
  const generationRoot = resolve(root, "generation-1");
  await mkdir(generationRoot);
  const example = JSON.parse(await readFile(resolve("schemas/drill_pack.example.json"), "utf8")) as DrillPackDefinition;
  const pack: Record<string, unknown> = {
    id: "promotion-race-fifteenth-author-fixture",
    version: "1.0.0",
    title: "Promotion race fifteenth author fixture",
    mode: "line",
    start: { fen: FEN, side: "white" },
    objective: {
      type: "play_until_checkpoint",
      summary: "Reach promotion.",
      successConditions: [{ kind: "reach_checkpoint", checkpointId: "promoted" }],
    },
    checkpoints: [{ id: "promoted", label: "Promotion", trigger: { atSpineNode: "promote" }, actions: ["compare_branches"] }],
    opponentPolicy: example.opponentPolicy,
    feedbackPolicy: example.feedbackPolicy,
    provenance: { reviewStatus: "draft", sources: [] },
    spine: [{ id: "promote", moveUci: "h7h8q", moveSan: "h8=Q+", children: [] }],
  };
  const response: Record<string, unknown> = { category: "win", dtz: 1, precise_dtz: 1, moves: [] };
  const responseBytes = `${canonicalizeJson(response)}\n`;
  const responseDigest = sha256(responseBytes) as Digest;
  const sources: Record<string, unknown> = {
    schema: "tabiya.sourcing.manifest.v1",
    entries: [{
      sourceId: "syzygy",
      retrievedAt: RETRIEVED_AT,
      origin: {
        kind: "http",
        url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(FEN)}`,
        status: 200,
        sha256: responseDigest,
        bytes: Buffer.byteLength(responseBytes),
        etag: null,
      },
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "machine response" },
    }],
  };
  const evidence: Record<string, unknown> = {
    schema: "tabiya.sourcing.evidence.v1",
    packId: pack.id,
    packVersion: pack.version,
    packDigest: await digestDrillPack(pack as unknown as DrillPackDefinition),
    sourcedAt: RETRIEVED_AT,
    records: [{
      kind: "tablebase_result",
      anchor: { fen: FEN },
      sourceId: "syzygy",
      retrievedAt: RETRIEVED_AT,
      grounds: "machine_validation",
      values: {
        category: "win",
        checkmate: false,
        dtm: null,
        dtz: 1,
        fen: FEN,
        insufficient_material: false,
        pieceCount: 4,
        precise_dtz: 1,
        stalemate: false,
      },
      supports: ["/start/fen"],
    }],
    abstentions: [],
  };
  const exact = exactLegalMoveMap(FEN);
  const legal: Record<string, unknown> = { schema: "tabiya.legal-map.v1", fen: FEN, pieces: exact.pieces };
  const documents = { pack, sources, evidence, response, legal };
  mutate?.(documents);

  const packFile = await canonical(resolve(generationRoot, "pack.json"), documents.pack);
  const sourcesFile = await canonical(resolve(generationRoot, "sources.json"), documents.sources);
  const evidenceFile = await canonical(resolve(generationRoot, "evidence.json"), documents.evidence);
  const responseFile = await canonical(resolve(generationRoot, "response.json"), documents.response);
  const legalFile = await canonical(resolve(generationRoot, "legal.json"), documents.legal);
  const generation = await canonical(resolve(generationRoot, "promotion-generation.json"), {
    schema: "tabiya.promotion-generation.v1",
    generationId: "generation-1",
    pack: { path: "pack.json", digest: packFile.digest },
    sources: { path: "sources.json", digest: sourcesFile.digest },
    evidence: { path: "evidence.json", digest: evidenceFile.digest },
    responses: [{
      fen: FEN,
      sourceId: "syzygy",
      retrievedAt: RETRIEVED_AT,
      path: "response.json",
      digest: responseFile.digest,
      bytes: Buffer.byteLength(responseFile.bytes),
    }],
    legalMaps: [{ fen: FEN, status: "available", path: "legal.json", digest: legalFile.digest }],
  });
  const inventoryPath = resolve(root, "promotion-installation.json");
  await canonical(inventoryPath, {
    schema: "tabiya.promotion-installation.v1",
    generations: [{ generationId: "generation-1", directory: "generation-1", manifestDigest: generation.digest }],
  });
  return Object.freeze({ root, inventoryPath });
}

describe("D2929-D2933 promotion fifteenth author repair", () => {
  it("D2929 keeps issuance and consumption inside one non-copyable composition closure", async () => {
    const fixture = await installation();
    const composition = createPromotionApplicationComposition({ promotionInstallationPath: fixture.inventoryPath });
    const application = await composition.openApplication();
    await expect({ ...composition }.openApplication()).rejects.toThrow("PROMOTION_COMPOSITION_AUTHORITY_REQUIRED");
    await expect({ ...application }.openRegistry()).rejects.toThrow("PROMOTION_APPLICATION_AUTHORITY_REQUIRED");
    expect(application.installation.inventoryBytes).toContain("tabiya.promotion-installation.v1");
  });

  it("D2930 application composition reads configuration once and issues one application and registry", async () => {
    const fixture = await installation();
    const composition = createPromotionApplicationComposition({ promotionInstallationPath: fixture.inventoryPath });
    const [first, second] = await Promise.all([composition.openApplication(), composition.openApplication()]);
    expect(first).toBe(second);
    const [firstRegistry, secondRegistry] = await Promise.all([first.openRegistry(), first.openRegistry()]);
    expect(firstRegistry).toBe(secondRegistry);
    expect(firstRegistry.generationIds).toEqual(["generation-1"]);
  });

  it("D2931 refuses invalid pack, source, evidence, provider response and legal-map semantics before publication", async () => {
    const mutations: Array<(documents: FixtureDocuments) => void> = [
      ({ pack }) => { pack.id = "not a valid pack id"; },
      ({ sources }) => { sources.schema = "not-a-source-registry"; },
      ({ evidence }) => { evidence.schema = "not-an-evidence-ledger"; },
      ({ response }) => { response.category = "invented-outcome"; },
      ({ legal }) => { legal.pieces = []; },
    ];
    for (const mutate of mutations) {
      const fixture = await installation(mutate);
      const application = await createPromotionApplicationComposition({ promotionInstallationPath: fixture.inventoryPath }).openApplication();
      await expect(application.openRegistry()).rejects.toThrow();
    }
  });

  it("D2932 retains typed recorded and exact legal lookups and rejects structural/cross-FEN use", async () => {
    const fixture = await installation();
    const application = await createPromotionApplicationComposition({ promotionInstallationPath: fixture.inventoryPath }).openApplication();
    const registry = await application.openRegistry();
    const [store, sameStore] = await Promise.all([registry.openGeneration("generation-1"), registry.openGeneration("generation-1")]);
    expect(store).toBe(sameStore);
    const found = store.lookup(FEN as never);
    expect(found.kind).toBe("found");
    expect(store.legalStatus(FEN as never)).toMatchObject({ kind: "available" });
    expect(store.lookup(OTHER_FEN as never)).toEqual({ kind: "absent" });
    expect(() => ({ ...store }).lookup(FEN as never)).toThrow("PROMOTION_ARTIFACT_STORE_AUTHORITY_REQUIRED");
  });

  it("D2933 preserves one sealed application-to-receipt collector lineage", async () => {
    const fixture = await installation();
    const application = await createPromotionApplicationComposition({ promotionInstallationPath: fixture.inventoryPath }).openApplication();
    const store = await (await application.openRegistry()).openGeneration("generation-1");
    const request = createPromotionRaceTablebaseRequest(store, FEN, new AbortController().signal);
    const result = await collectPromotionRaceTablebase(request);
    expect(result).toMatchObject({ kind: "reading", request });
    assertPromotionRaceTablebaseResult(result);
    if (result.kind !== "reading") throw new TypeError("expected reading");
    expect(recordedAuthorityReceipt(result.source)).toBe(result.receipt);
    expect(result.receipt.store).toBe(store);
    expect(result.item.payload.immediatePromotion.map((move) => move.uci)).toEqual(["h7h8b", "h7h8n", "h7h8q", "h7h8r"]);
    await expect(collectPromotionRaceTablebase({ ...request })).rejects.toThrow("PROMOTION_REQUEST_AUTHORITY_REQUIRED");
    expect(() => assertPromotionRaceTablebaseResult({ ...result })).toThrow("PROMOTION_RESULT_AUTHORITY_REQUIRED");
  });
});
