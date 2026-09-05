import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { canonicalizeJson, digestDrillPack, type DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import { createRulesMobilityReadingLegalMovesV1Evidence, type CanonicalFullFen } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  createTestInstalledPromotionInventoryAuthority,
  openPromotionInstallationRegistry,
  parsePromotionGeneration,
} from "./model.js";

const roots: string[] = [];
const fen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const otherFen = "8/7P/8/8/8/8/p7/3K3k w - - 0 1" as CanonicalFullFen;
const retrievedAt = "2026-08-15T20:11:18.321Z";

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

async function installation(mutate?: (artifacts: MutableArtifacts) => void): Promise<Readonly<{ inventoryPath: string }>> {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-twelfth-author-"));
  roots.push(root);
  const generationRoot = resolve(root, "generation-1");
  await mkdir(generationRoot);
  const example = JSON.parse(await readFile(resolve("schemas/drill_pack.example.json"), "utf8")) as DrillPackDefinition;
  const pack = {
    id: "promotion-race-twelfth-author-fixture", version: "1.0.0", title: "Promotion race author fixture", mode: "line",
    start: { fen, side: "white" },
    objective: { type: "play_until_checkpoint", summary: "Reach promotion.", successConditions: [{ kind: "reach_checkpoint", checkpointId: "promoted" }] },
    checkpoints: [{ id: "promoted", label: "Promotion", trigger: { atSpineNode: "promote" }, actions: ["compare_branches"] }],
    opponentPolicy: example.opponentPolicy, feedbackPolicy: example.feedbackPolicy,
    provenance: { reviewStatus: "draft", sources: [] },
    spine: [{ id: "promote", moveUci: "h7h8q", moveSan: "h8=Q+", children: [] }],
  };
  const packFile = await canonical(resolve(generationRoot, "pack.json"), pack);
  const response = { category: "win", dtz: 1, precise_dtz: 1, moves: [] };
  const responseFile = await canonical(resolve(generationRoot, "response.json"), response);
  const sources = {
    schema: "tabiya.sourcing.manifest.v1",
    entries: [{
      sourceId: "syzygy", retrievedAt,
      origin: { kind: "http", url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, status: 200, sha256: responseFile.digest, bytes: responseFile.bytes, etag: null },
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "machine response" },
    }],
  };
  const sourcesFile = await canonical(resolve(generationRoot, "sources.json"), sources);
  const evidence: Record<string, unknown> = {
    schema: "tabiya.sourcing.evidence.v1", packId: pack.id, packVersion: pack.version,
    packDigest: await digestDrillPack(pack as DrillPackDefinition), sourcedAt: retrievedAt,
    records: [{
      kind: "tablebase_result", anchor: { fen }, sourceId: "syzygy", retrievedAt, grounds: "machine_validation",
      values: { category: "win", checkmate: false, dtm: null, dtz: 1, fen, insufficient_material: false, pieceCount: 4, precise_dtz: 1, stalemate: false },
      supports: ["/start/fen"],
    }], abstentions: [],
  };
  const legal = createRulesMobilityReadingLegalMovesV1Evidence(fen);
  const legalFile = await canonical(resolve(generationRoot, "legal.json"), { schema: "tabiya.legal-map.v1", fen, pieces: legal.payload.pieces });
  const generation: Record<string, unknown> = {
    schema: "tabiya.promotion-generation.v1", generationId: "generation-1",
    pack: { path: "pack.json", digest: packFile.digest }, sources: { path: "sources.json", digest: sourcesFile.digest },
    evidence: { path: "evidence.json", digest: "pending" },
    responses: [{ fen, sourceId: "syzygy", retrievedAt, path: "response.json", digest: responseFile.digest, bytes: responseFile.bytes }],
    legalMaps: [{ fen, status: "available", path: "legal.json", digest: legalFile.digest }],
  };
  mutate?.({ generation, evidence });
  const evidenceFile = await canonical(resolve(generationRoot, "evidence.json"), evidence);
  generation.evidence = { path: "evidence.json", digest: evidenceFile.digest };
  const generationFile = await canonical(resolve(generationRoot, "promotion-generation.json"), generation);
  const inventoryPath = resolve(root, "promotion-installation.json");
  await canonical(inventoryPath, { schema: "tabiya.promotion-installation.v1", generations: [{ generationId: "generation-1", directory: "generation-1", manifestDigest: generationFile.digest }] });
  return Object.freeze({ inventoryPath });
}

async function open(value: Readonly<{ inventoryPath: string }>) {
  const authority = createTestInstalledPromotionInventoryAuthority(value.inventoryPath);
  const registry = await openPromotionInstallationRegistry(authority);
  return registry.openGeneration("generation-1");
}

describe("semantic collectors promotion twelfth author repair", () => {
  test("D2835 registry accepts only application-issued installed inventory authority", async () => {
    const value = await installation();
    await expect(openPromotionInstallationRegistry({ kind: "application_installed_promotion_inventory", inventoryPath: value.inventoryPath })).rejects.toThrow(/AUTHORITY_REQUIRED/);
    await expect(open(value)).resolves.toBeDefined();
  });

  test("D2836 generation and nested declarations have an exact grammar", async () => {
    const extraRoot = await installation(({ generation }) => { generation.attacker = true; });
    await expect(open(extraRoot)).rejects.toThrow(/GENERATION_INVALID/);
    const extraResponse = await installation(({ generation }) => { ((generation.responses as Array<Record<string, unknown>>)[0]!).attacker = true; });
    await expect(open(extraResponse)).rejects.toThrow(/RESPONSE_DECLARATION_INVALID/);
  });

  test("D2837 response and legal declarations are unique and set-equal", async () => {
    const duplicate = await installation(({ generation }) => { (generation.legalMaps as unknown[]).push({ fen, status: "unavailable", path: null, digest: null }); });
    await expect(open(duplicate)).rejects.toThrow(/LEGAL_FEN_AMBIGUOUS/);
    const orphan = await installation(({ generation }) => { (generation.legalMaps as unknown[]).push({ fen: otherFen, status: "unavailable", path: null, digest: null }); });
    await expect(open(orphan)).rejects.toThrow(/RESPONSE_LEGAL_SET_MISMATCH/);
  });

  test("D2838 every response has exact non-vacuous start-FEN support", async () => {
    const empty = await installation(({ evidence }) => { ((evidence.records as Array<Record<string, unknown>>)[0]!).supports = []; });
    await expect(open(empty)).rejects.toThrow(/SUPPORT_SEMANTICS_CROSSED/);
    const extra = await installation(({ evidence }) => { ((evidence.records as Array<Record<string, unknown>>)[0]!).supports = ["/start/fen", "/title"]; });
    await expect(open(extra)).rejects.toThrow(/SUPPORT_SEMANTICS_CROSSED/);
  });

  test("D2839 every response subject has exactly one durable record", async () => {
    const duplicate = await installation(({ evidence }) => {
      const records = evidence.records as Array<Record<string, unknown>>;
      const second = structuredClone(records[0]!);
      (second.values as Record<string, unknown>).category = "loss";
      records.push(second);
    });
    await expect(open(duplicate)).rejects.toThrow(/RECORDED_SUBJECT_AMBIGUOUS/);
    const orphan = await installation(({ evidence }) => {
      const records = evidence.records as Array<Record<string, unknown>>;
      const second = structuredClone(records[0]!);
      second.anchor = { fen: otherFen };
      records.push(second);
    });
    await expect(open(orphan)).rejects.toThrow(/RECORDED_SUBJECT_SET_MISMATCH/);
    expect(() => parsePromotionGeneration({ schema: "tabiya.promotion-generation.v1", generationId: "g", pack: {}, sources: {}, evidence: {}, responses: [], legalMaps: [] })).toThrow(/FILE_REFERENCE_INVALID/);
  });
});
