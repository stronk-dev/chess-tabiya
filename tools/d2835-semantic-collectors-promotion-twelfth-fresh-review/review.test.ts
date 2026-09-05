import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { canonicalizeJson, digestDrillPack, type DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
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
} from "../d2789-semantic-collectors-promotion-eleventh-author-repair/model.js";

const roots: string[] = [];
const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const orphanFen = "8/7P/8/8/8/8/p7/3K3k w - - 0 1" as CanonicalFullFen;
const retrievedAt = "2026-08-15T20:11:18.321Z";
const raw = { category: "win", dtz: 1, precise_dtz: 1, moves: [] };

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function canonical(path: string, value: unknown): Promise<Readonly<{ digest: `sha256:${string}`; bytes: number }>> {
  const bytes = `${canonicalizeJson(value)}\n`;
  await writeFile(path, bytes, "utf8");
  return Object.freeze({ digest: sha256(bytes) as `sha256:${string}`, bytes: Buffer.byteLength(bytes) });
}

interface MutableArtifacts {
  generation: Record<string, unknown>;
  evidence: Record<string, unknown>;
}

async function installation(mutate?: (artifacts: MutableArtifacts) => void): Promise<Readonly<{
  root: string;
  inventoryPath: string;
  store: PromotionArtifactStore;
}>> {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-twelfth-fresh-"));
  roots.push(root);
  const generationRoot = resolve(root, "generation-1");
  await mkdir(generationRoot);
  const example = JSON.parse(await readFile(resolve("schemas/drill_pack.example.json"), "utf8")) as DrillPackDefinition;
  const pack = {
    id: "promotion-race-twelfth-fresh-fixture",
    version: "1.0.0",
    title: "Promotion race fresh review fixture",
    mode: "line",
    start: { fen: raceFen, side: "white" },
    objective: { type: "play_until_checkpoint", summary: "Reach promotion.", successConditions: [{ kind: "reach_checkpoint", checkpointId: "promoted" }] },
    checkpoints: [{ id: "promoted", label: "Promotion", trigger: { atSpineNode: "promote" }, actions: ["compare_branches"] }],
    opponentPolicy: example.opponentPolicy,
    feedbackPolicy: example.feedbackPolicy,
    provenance: { reviewStatus: "draft", sources: [] },
    spine: [{ id: "promote", moveUci: "h7h8q", moveSan: "h8=Q+", children: [] }],
  };
  const packFile = await canonical(resolve(generationRoot, "pack.json"), pack);
  const packDigest = await digestDrillPack(pack as DrillPackDefinition);
  const responseFile = await canonical(resolve(generationRoot, "response.json"), raw);
  const sources = {
    schema: "tabiya.sourcing.manifest.v1",
    entries: [{
      sourceId: "syzygy",
      retrievedAt,
      origin: {
        kind: "http",
        url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(raceFen)}`,
        status: 200,
        sha256: responseFile.digest,
        bytes: responseFile.bytes,
        etag: null,
      },
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "machine response" },
    }],
  };
  const sourceFile = await canonical(resolve(generationRoot, "sources.json"), sources);
  const record = {
    kind: "tablebase_result",
    anchor: { fen: raceFen },
    sourceId: "syzygy",
    retrievedAt,
    grounds: "machine_validation",
    values: {
      category: "win",
      checkmate: false,
      dtm: null,
      dtz: 1,
      fen: raceFen,
      insufficient_material: false,
      pieceCount: 4,
      precise_dtz: 1,
      stalemate: false,
    },
    supports: ["/start/fen"],
  };
  const evidence: Record<string, unknown> = {
    schema: "tabiya.sourcing.evidence.v1",
    packId: pack.id,
    packVersion: pack.version,
    packDigest,
    sourcedAt: retrievedAt,
    records: [record],
    abstentions: [],
  };
  const exactLegal = createRulesMobilityReadingLegalMovesV1Evidence(raceFen);
  const legalFile = await canonical(resolve(generationRoot, "legal.json"), {
    schema: "tabiya.legal-map.v1",
    fen: raceFen,
    pieces: exactLegal.payload.pieces,
  });
  const generation: Record<string, unknown> = {
    schema: "tabiya.promotion-generation.v1",
    generationId: "generation-1",
    pack: { path: "pack.json", digest: packFile.digest },
    sources: { path: "sources.json", digest: sourceFile.digest },
    evidence: { path: "evidence.json", digest: "pending" },
    responses: [{ fen: raceFen, sourceId: "syzygy", retrievedAt, path: "response.json", digest: responseFile.digest, bytes: responseFile.bytes }],
    legalMaps: [{ fen: raceFen, status: "available", path: "legal.json", digest: legalFile.digest }],
  };
  mutate?.({ generation, evidence });
  const evidenceFile = await canonical(resolve(generationRoot, "evidence.json"), evidence);
  generation.evidence = { path: "evidence.json", digest: evidenceFile.digest };
  const generationFile = await canonical(resolve(generationRoot, "promotion-generation.json"), generation);
  const inventoryPath = resolve(root, "promotion-installation.json");
  await canonical(inventoryPath, {
    schema: "tabiya.promotion-installation.v1",
    generations: [{ generationId: "generation-1", directory: "generation-1", manifestDigest: generationFile.digest }],
  });
  const registry = await openPromotionInstallationRegistry(inventoryPath);
  const store = await registry.openGeneration("generation-1");
  return Object.freeze({ root, inventoryPath, store });
}

function request() {
  const geometry = derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(raceFen) });
  return createPromotionRaceTablebaseRequest(geometry, { id: "twelfth-fresh", budgetMs: 500 }, new AbortController().signal);
}

async function recorded(store: PromotionArtifactStore) {
  const result = await collectPromotionRaceTablebase(request(), {
    artifacts: store,
    scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw })),
    sourceFactories: createProviderSourceFactories(),
  });
  expect(result.kind).toBe("reading");
  assertPromotionRaceTablebaseResult(result);
  if (result.kind !== "reading" || result.derivation.source.kind !== "recorded") throw new Error("recorded reading expected");
  return Object.freeze({ result, receipt: recordedAuthorityReceipt(result.derivation.source.evidence) });
}

describe("semantic collectors promotion twelfth fresh review", () => {
  test("D2835 a caller-created inventory at an arbitrary path becomes an installed authority", async () => {
    const first = await installation();
    const second = await installation();
    expect(first.inventoryPath).not.toBe(second.inventoryPath);
    await expect(recorded(first.store)).resolves.toBeDefined();
    await expect(recorded(second.store)).resolves.toBeDefined();
  });

  test("D2836 extra generation and response fields receive authority", async () => {
    const value = await installation(({ generation }) => {
      generation.attackerRoot = true;
      const responses = generation.responses as Array<Record<string, unknown>>;
      responses[0]!.attackerNested = true;
    });
    await expect(recorded(value.store)).resolves.toBeDefined();
  });

  test("D2837 duplicate and orphan legal declarations are ignored", async () => {
    const value = await installation(({ generation }) => {
      const legalMaps = generation.legalMaps as Array<Record<string, unknown>>;
      legalMaps.push({ fen: raceFen, status: "unavailable", path: null, digest: null });
      legalMaps.push({ fen: orphanFen, status: "available", path: "missing.json", digest: `sha256:${"f".repeat(64)}` });
    });
    const { receipt } = await recorded(value.store);
    expect(receipt.legalMoves).not.toBeNull();
  });

  test("D2838 an empty support population grounds a recorded result", async () => {
    const value = await installation(({ evidence }) => {
      const records = evidence.records as Array<Record<string, unknown>>;
      records[0]!.supports = [];
    });
    const { receipt } = await recorded(value.store);
    expect(receipt.record.supports).toEqual([]);
  });

  test("D2839 duplicate recorded subjects choose the first row", async () => {
    const value = await installation(({ evidence }) => {
      const records = evidence.records as Array<Record<string, unknown>>;
      const duplicate = structuredClone(records[0]!);
      (duplicate.values as Record<string, unknown>).category = "loss";
      records.push(duplicate);
    });
    const { receipt } = await recorded(value.store);
    expect(receipt.record.values.category).toBe("win");
  });
});
