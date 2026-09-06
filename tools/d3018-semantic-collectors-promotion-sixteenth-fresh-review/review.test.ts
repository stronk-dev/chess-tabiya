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
  type Digest,
} from "../d2929-semantic-collectors-promotion-fifteenth-author-repair/model.js";

const roots: string[] = [];
const RACE_FEN = "8/7P/8/8/8/8/p7/4K2k w - - 0 1";
const NO_RACE_FEN = "4k3/1p6/8/8/8/8/P7/4K3 w - - 0 1";
const RETRIEVED_AT = "2026-08-15T20:11:18.321Z";
const MODEL_PATH = resolve("tools/d2929-semantic-collectors-promotion-fifteenth-author-repair/model.ts");

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

interface PositionSpec {
  readonly fen: string;
  readonly moveUci: string;
  readonly moveSan: string;
  readonly category: "win" | "draw";
  readonly dtz: number;
  readonly preciseDtz: number;
  readonly pieceCount: number;
  readonly insufficientMaterial: boolean;
}

const RACE: PositionSpec = {
  fen: RACE_FEN,
  moveUci: "h7h8q",
  moveSan: "h8=Q+",
  category: "win",
  dtz: 1,
  preciseDtz: 1,
  pieceCount: 4,
  insufficientMaterial: false,
};

const NO_RACE: PositionSpec = {
  fen: NO_RACE_FEN,
  moveUci: "a2a3",
  moveSan: "a3",
  category: "draw",
  dtz: 0,
  preciseDtz: 0,
  pieceCount: 4,
  insufficientMaterial: false,
};

async function canonical(path: string, value: unknown) {
  const bytes = `${canonicalizeJson(value)}\n`;
  await writeFile(path, bytes, "utf8");
  return Object.freeze({ bytes, digest: sha256(bytes) as Digest });
}

async function installation(
  spec: PositionSpec = RACE,
  mutateEvidence?: (evidence: Record<string, unknown>) => void,
) {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-sixteenth-review-"));
  roots.push(root);
  const generationRoot = resolve(root, "generation-1");
  await mkdir(generationRoot);
  const example = JSON.parse(await readFile(resolve("schemas/drill_pack.example.json"), "utf8")) as DrillPackDefinition;
  const pack: Record<string, unknown> = {
    id: `promotion-sixteenth-review-${spec.pieceCount}`,
    version: "1.0.0",
    title: "Promotion sixteenth fresh-review fixture",
    mode: "line",
    start: { fen: spec.fen, side: "white" },
    objective: {
      type: "play_until_checkpoint",
      summary: "Reach the checkpoint.",
      successConditions: [{ kind: "reach_checkpoint", checkpointId: "finish" }],
    },
    checkpoints: [{ id: "finish", label: "Finish", trigger: { atSpineNode: "move" }, actions: ["compare_branches"] }],
    opponentPolicy: example.opponentPolicy,
    feedbackPolicy: example.feedbackPolicy,
    provenance: { reviewStatus: "draft", sources: [] },
    spine: [{ id: "move", moveUci: spec.moveUci, moveSan: spec.moveSan, children: [] }],
  };
  const response: Record<string, unknown> = {
    category: spec.category,
    dtz: spec.dtz,
    precise_dtz: spec.preciseDtz,
    moves: [],
  };
  const responseBytes = `${canonicalizeJson(response)}\n`;
  const responseDigest = sha256(responseBytes) as Digest;
  const sources: Record<string, unknown> = {
    schema: "tabiya.sourcing.manifest.v1",
    entries: [{
      sourceId: "syzygy",
      retrievedAt: RETRIEVED_AT,
      origin: {
        kind: "http",
        url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(spec.fen)}`,
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
      anchor: { fen: spec.fen },
      sourceId: "syzygy",
      retrievedAt: RETRIEVED_AT,
      grounds: "machine_validation",
      values: {
        category: spec.category,
        checkmate: false,
        dtm: null,
        dtz: spec.dtz,
        fen: spec.fen,
        insufficient_material: spec.insufficientMaterial,
        pieceCount: spec.pieceCount,
        precise_dtz: spec.preciseDtz,
        stalemate: false,
      },
      supports: ["/start/fen"],
    }],
    abstentions: [],
  };
  mutateEvidence?.(evidence);
  const exact = exactLegalMoveMap(spec.fen);
  const legal = { schema: "tabiya.legal-map.v1", fen: spec.fen, pieces: exact.pieces };

  const packFile = await canonical(resolve(generationRoot, "pack.json"), pack);
  const sourcesFile = await canonical(resolve(generationRoot, "sources.json"), sources);
  const evidenceFile = await canonical(resolve(generationRoot, "evidence.json"), evidence);
  const responseFile = await canonical(resolve(generationRoot, "response.json"), response);
  const legalFile = await canonical(resolve(generationRoot, "legal.json"), legal);
  const generation = await canonical(resolve(generationRoot, "promotion-generation.json"), {
    schema: "tabiya.promotion-generation.v1",
    generationId: "generation-1",
    pack: { path: "pack.json", digest: packFile.digest },
    sources: { path: "sources.json", digest: sourcesFile.digest },
    evidence: { path: "evidence.json", digest: evidenceFile.digest },
    responses: [{
      fen: spec.fen,
      sourceId: "syzygy",
      retrievedAt: RETRIEVED_AT,
      path: "response.json",
      digest: responseFile.digest,
      bytes: Buffer.byteLength(responseFile.bytes),
    }],
    legalMaps: [{ fen: spec.fen, status: "available", path: "legal.json", digest: legalFile.digest }],
  });
  const inventoryPath = resolve(root, "promotion-installation.json");
  await canonical(inventoryPath, {
    schema: "tabiya.promotion-installation.v1",
    generations: [{ generationId: "generation-1", directory: "generation-1", manifestDigest: generation.digest }],
  });
  return Object.freeze({ inventoryPath, fen: spec.fen });
}

async function collect(fixture: Awaited<ReturnType<typeof installation>>) {
  const application = await createPromotionApplicationComposition({ promotionInstallationPath: fixture.inventoryPath }).openApplication();
  const registry = await application.openRegistry();
  const store = await registry.openGeneration("generation-1");
  const request = createPromotionRaceTablebaseRequest(store, fixture.fen, new AbortController().signal);
  const result = await collectPromotionRaceTablebase(request);
  assertPromotionRaceTablebaseResult(result);
  return result;
}

describe("D3018-D3024 promotion collectors sixteenth fresh review", () => {
  it("D3018 accepts two unrelated caller-selected installation paths as product authority", async () => {
    const first = await installation();
    const second = await installation();
    const firstApp = await createPromotionApplicationComposition({ promotionInstallationPath: first.inventoryPath }).openApplication();
    const secondApp = await createPromotionApplicationComposition({ promotionInstallationPath: second.inventoryPath }).openApplication();
    await expect(firstApp.openRegistry()).resolves.toMatchObject({ generationIds: ["generation-1"] });
    await expect(secondApp.openRegistry()).resolves.toMatchObject({ generationIds: ["generation-1"] });
    expect(firstApp.installation.inventoryPath).not.toBe(secondApp.installation.inventoryPath);
  });

  it("D3019 emits promotion-race tablebase evidence for the RFC's a2-versus-b7 no-race hard negative", async () => {
    const result = await collect(await installation(NO_RACE));
    expect(result.kind).toBe("reading");
    if (result.kind !== "reading") throw new TypeError("expected false-positive reading");
    expect(result.item.payload.immediatePromotion).toEqual([]);
  });

  it("D3020/D3024 replaces the recorded-live-domain operation and its total result algebra", async () => {
    const source = await readFile(MODEL_PATH, "utf8");
    expect(source).not.toContain("providerScope");
    expect(source).not.toContain("ProviderExchangeScheduler");
    expect(source).not.toContain("outside_tablebase_domain");
    expect(source).not.toContain("no_opposing_passed_clear_paths");
    expect(source).toContain('"cancelled"');
  });

  it("D3021 drops geometry and promotionFirst and uses the generic evidence constructor", async () => {
    const result = await collect(await installation());
    expect(result.kind).toBe("reading");
    if (result.kind !== "reading") throw new TypeError("expected reading");
    expect("geometry" in result.item.payload).toBe(false);
    expect("promotionFirst" in result.item.payload).toBe(false);
    const source = await readFile(MODEL_PATH, "utf8");
    expect(source).not.toContain("createDerivedPawnPromotionRaceTablebaseV1Evidence");
    expect(source).toMatch(/const item = declareEvidence\(/u);
  });

  it("D3022 mints recorded evidence locally instead of consuming central value authority", async () => {
    const source = await readFile(MODEL_PATH, "utf8");
    expect(source).toMatch(/const evidence = declareEvidence\(/u);
    expect(source).not.toContain("createSourcingLedgerTablebaseResultV1Evidence");
    expect(source).not.toContain("createRecordedTablebaseResultV1Evidence");
  });

  it("D3023 accepts duplicate durable tablebase subjects and chooses the first", async () => {
    const fixture = await installation(RACE, (evidence) => {
      const records = evidence.records as Array<Record<string, unknown>>;
      records.push(structuredClone(records[0]!));
    });
    await expect(collect(fixture)).resolves.toMatchObject({ kind: "reading" });
  });
});
