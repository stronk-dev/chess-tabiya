import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { canonicalizeJson, digestDrillPack, type DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import {
  createRulesMobilityReadingLegalMovesV1Evidence,
  createRulesPawnReadingContactsV1Evidence,
  type CanonicalFullFen,
} from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import * as current from "./model.js";
import * as predecessor from "../d2835-semantic-collectors-promotion-twelfth-author-repair/model.js";

const roots: string[] = [];
const fen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const retrievedAt = "2026-08-15T20:11:18.321Z";
const raw = { category: "win", dtz: 1, precise_dtz: 1, moves: [] };

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function canonical(path: string, value: unknown): Promise<Readonly<{ digest: `sha256:${string}`; bytes: number; text: string }>> {
  const text = `${canonicalizeJson(value)}\n`;
  await writeFile(path, text, "utf8");
  return Object.freeze({ digest: sha256(text) as `sha256:${string}`, bytes: Buffer.byteLength(text), text });
}

async function installation(): Promise<Readonly<{ root: string; inventoryPath: string; generation: Record<string, unknown> }>> {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-thirteenth-author-"));
  roots.push(root);
  const generationRoot = resolve(root, "generation-1");
  await mkdir(generationRoot);
  const example = JSON.parse(await readFile(resolve("schemas/drill_pack.example.json"), "utf8")) as DrillPackDefinition;
  const pack = {
    id: "promotion-race-thirteenth-author-fixture",
    version: "1.0.0",
    title: "Promotion race authority fixture",
    mode: "line",
    start: { fen, side: "white" },
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
  const packFile = await canonical(resolve(generationRoot, "pack.json"), pack);
  const responseFile = await canonical(resolve(generationRoot, "response.json"), raw);
  const sources = {
    schema: "tabiya.sourcing.manifest.v1",
    entries: [{
      sourceId: "syzygy",
      retrievedAt,
      origin: {
        kind: "http",
        url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`,
        status: 200,
        sha256: responseFile.digest,
        bytes: responseFile.bytes,
        etag: null,
      },
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "machine response" },
    }],
  };
  const sourcesFile = await canonical(resolve(generationRoot, "sources.json"), sources);
  const evidence = {
    schema: "tabiya.sourcing.evidence.v1",
    packId: pack.id,
    packVersion: pack.version,
    packDigest: await digestDrillPack(pack as DrillPackDefinition),
    sourcedAt: retrievedAt,
    records: [{
      kind: "tablebase_result",
      anchor: { fen },
      sourceId: "syzygy",
      retrievedAt,
      grounds: "machine_validation",
      values: {
        category: "win",
        checkmate: false,
        dtm: null,
        dtz: 1,
        fen,
        insufficient_material: false,
        pieceCount: 4,
        precise_dtz: 1,
        stalemate: false,
      },
      supports: ["/start/fen"],
    }],
    abstentions: [],
  };
  const evidenceFile = await canonical(resolve(generationRoot, "evidence.json"), evidence);
  const legal = createRulesMobilityReadingLegalMovesV1Evidence(fen);
  const legalFile = await canonical(resolve(generationRoot, "legal.json"), {
    schema: "tabiya.legal-map.v1",
    fen,
    pieces: legal.payload.pieces,
  });
  const generation: Record<string, unknown> = {
    schema: "tabiya.promotion-generation.v1",
    generationId: "generation-1",
    pack: { path: "pack.json", digest: packFile.digest },
    sources: { path: "sources.json", digest: sourcesFile.digest },
    evidence: { path: "evidence.json", digest: evidenceFile.digest },
    responses: [{ fen, sourceId: "syzygy", retrievedAt, path: "response.json", digest: responseFile.digest, bytes: responseFile.bytes }],
    legalMaps: [{ fen, status: "available", path: "legal.json", digest: legalFile.digest }],
  };
  const generationFile = await canonical(resolve(generationRoot, "promotion-generation.json"), generation);
  const inventoryPath = resolve(root, "promotion-installation.json");
  await canonical(inventoryPath, {
    schema: "tabiya.promotion-installation.v1",
    generations: [{ generationId: "generation-1", directory: "generation-1", manifestDigest: generationFile.digest }],
  });
  return Object.freeze({ root, inventoryPath, generation });
}

function validGeneration(): Record<string, unknown> {
  const digest = `sha256:${"1".repeat(64)}`;
  return {
    schema: "tabiya.promotion-generation.v1",
    generationId: "generation-1",
    pack: { path: "pack.json", digest },
    sources: { path: "sources.json", digest },
    evidence: { path: "evidence.json", digest },
    responses: [{ fen, sourceId: "syzygy", retrievedAt, path: "response.json", digest, bytes: 1 }],
    legalMaps: [{ fen, status: "available", path: "legal.json", digest }],
  };
}

describe("semantic collectors promotion thirteenth author repair", () => {
  test("D2864 application composition is the sole current installation authority issuer", async () => {
    expect(current).not.toHaveProperty("createTestInstalledPromotionInventoryAuthority");
    expect(current).not.toHaveProperty("openPromotionInstallationRegistry");
    const fixture = await installation();
    const application = await current.openPromotionApplication(fixture.inventoryPath);
    await expect(application.openRegistry()).resolves.toMatchObject({ application, installation: application.installation });
  });

  test("D2865 the application retains one immutable inventory byte identity", async () => {
    const fixture = await installation();
    const application = await current.openPromotionApplication(fixture.inventoryPath);
    const expectedBytes = await readFile(fixture.inventoryPath, "utf8");

    expect(application.installation).toMatchObject({
      kind: "application_installed_promotion_inventory_snapshot",
      inventoryPath: await realpath(fixture.inventoryPath),
      inventoryBytes: expectedBytes,
      inventoryDigest: sha256(expectedBytes),
    });
    expect(application.installation.entries).toHaveLength(1);
    expect(Object.isFrozen(application.installation)).toBe(true);
    expect(Object.isFrozen(application.installation.entries)).toBe(true);
    expect(Object.isFrozen(application.installation.entries[0])).toBe(true);
  });

  test("D2866 registry and stores cannot combine different inventory reads", async () => {
    const fixture = await installation();
    const application = await current.openPromotionApplication(fixture.inventoryPath);
    await canonical(fixture.inventoryPath, {
      schema: "tabiya.promotion-installation.v1",
      generations: [{ generationId: "changed", directory: "generation-1", manifestDigest: `sha256:${"2".repeat(64)}` }],
    });
    await expect(application.openRegistry()).rejects.toThrow(/PROMOTION_INVENTORY_SNAPSHOT_CHANGED/);

    const stable = await installation();
    const stableApplication = await current.openPromotionApplication(stable.inventoryPath);
    const registry = await stableApplication.openRegistry();
    const first = await registry.openGeneration("generation-1");
    const second = await registry.openGeneration("generation-1");
    expect(registry.inventoryDigest).toBe(stableApplication.installation.inventoryDigest);
    expect(registry.installation).toBe(stableApplication.installation);
    expect(first).toBe(second);
    expect(first.application).toBe(stableApplication);
    expect(first.registry).toBe(registry);
  });

  test("D2867 collection and recorded receipts retain the current application chain", async () => {
    expect(current.collectPromotionRaceTablebase).not.toBe(predecessor.collectPromotionRaceTablebase);
    expect(current.recordedAuthorityReceipt).not.toBe(predecessor.recordedAuthorityReceipt);
    const fixture = await installation();
    const application = await current.openPromotionApplication(fixture.inventoryPath);
    const registry = await application.openRegistry();
    const store = await registry.openGeneration("generation-1");
    const selected = store.lookup(fen);
    expect(selected.kind).toBe("found");
    if (selected.kind !== "found") throw new Error("recorded fixture expected");
    expect(current.recordedAuthorityReceipt(selected.evidence)).toBe(selected.receipt);
    expect(selected.receipt).toMatchObject({ application, installation: application.installation, registry, store });

    const geometry = current.derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(fen) });
    const request = current.createPromotionRaceTablebaseRequest(geometry, { id: "thirteenth-author", budgetMs: 500 }, new AbortController().signal);
    const result = await current.collectPromotionRaceTablebase(request, {
      artifacts: store,
      scheduler: current.createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw })),
      sourceFactories: current.createProviderSourceFactories(),
    });
    expect(result.kind).toBe("reading");
    current.assertPromotionRaceTablebaseResult(result);
    if (result.kind !== "reading" || result.derivation.source.kind !== "recorded") throw new Error("recorded result expected");
    expect(current.recordedAuthorityReceipt(result.derivation.source.evidence).store).toBe(store);
  });

  test("D2868 installed generations require a non-empty response/legal population", () => {
    const empty = validGeneration();
    empty.responses = [];
    empty.legalMaps = [];
    expect(() => current.parsePromotionGeneration(empty)).toThrow(/PROMOTION_GENERATION_EMPTY/);

    const noResponses = validGeneration();
    noResponses.responses = [];
    expect(() => current.parsePromotionGeneration(noResponses)).toThrow();
    const noLegalMaps = validGeneration();
    noLegalMaps.legalMaps = [];
    expect(() => current.parsePromotionGeneration(noLegalMaps)).toThrow();
    expect(current.parsePromotionGeneration(validGeneration()).responses).toHaveLength(1);
  });
});
