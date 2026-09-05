import { mkdtemp, rm, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { afterEach, describe, expect, test } from "vitest";

import { createRulesPawnReadingContactsV1Evidence, type CanonicalFullFen } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  assertPromotionRaceTablebaseResult,
  collectPromotionRaceTablebase,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  openPromotionArtifactStore,
  recordedAuthorityReceipt,
  type PromotionArtifactStore,
} from "./model.js";

const roots: string[] = [];
const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const outsideFen = "8/7P/8/8/8/8/p7/1RBQKB1k w - - 0 1" as CanonicalFullFen;
const retrievedAt = "2026-09-05T00:00:00.000Z";
const raw = { category: "win", dtz: 1, precise_dtz: 0, moves: [] };

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function canonical(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${canonicalizeJson(value)}\n`, "utf8");
}

async function artifact(options: Readonly<{ future?: boolean; brokenPointer?: boolean; hostileOrigin?: boolean }> = {}): Promise<{ root: string; store: PromotionArtifactStore }> {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-author-"));
  roots.push(root);
  const at = options.future ? "2099-01-01T00:00:00.000Z" : retrievedAt;
  const url = options.hostileOrigin ? "https://attacker.invalid/tablebase" : `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(raceFen)}`;
  await canonical(resolve(root, "pack.json"), { id: "promotion-author-fixture", version: "1.0.0", start: { fen: raceFen } });
  await canonical(resolve(root, "sources.json"), {
    schema: "tabiya.sourcing.manifest.v1",
    entries: [{ sourceId: options.hostileOrigin ? "attacker" : "syzygy", retrievedAt: at, origin: { kind: "http", url, status: 200, sha256: `sha256:${"a".repeat(64)}`, bytes: 42, etag: null }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "machine response" } }],
  });
  await canonical(resolve(root, "evidence.json"), {
    schema: "tabiya.sourcing.evidence.v1",
    sourcedAt: at,
    records: [{ kind: "tablebase_result", anchor: { fen: raceFen }, sourceId: options.hostileOrigin ? "attacker" : "syzygy", retrievedAt: at, grounds: "machine_validation", values: { ...raw, fen: raceFen, pieceCount: 4 }, supports: [options.brokenPointer ? "/invented/claim" : "/start/fen"] }],
    abstentions: [],
  });
  await canonical(resolve(root, "legal-authority.json"), { status: "available" });
  return { root, store: await openPromotionArtifactStore(root) };
}

function request(fen = raceFen) {
  const geometry = derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(fen) });
  return createPromotionRaceTablebaseRequest(geometry, { id: "tenth-author", budgetMs: 500 }, new AbortController().signal);
}

function dependencies(store: PromotionArtifactStore, calls?: string[]) {
  return { artifacts: store, scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw }), calls), sourceFactories: createProviderSourceFactories() };
}

describe("semantic collectors promotion tenth author repair", () => {
  test("D2765/D2770 consumes the production manifest dialect and exact Syzygy origin", async () => {
    const good = await artifact();
    const result = await collectPromotionRaceTablebase(request(), dependencies(good.store));
    expect(result.kind).toBe("reading");
    assertPromotionRaceTablebaseResult(result);
    if (result.kind !== "reading") throw new Error("fixture");
    expect(recordedAuthorityReceipt(result.derivation.source.kind === "recorded" ? result.derivation.source.evidence : (() => { throw new Error("recorded source expected"); })()).source.sourceId).toBe("syzygy");

    const hostile = await artifact({ hostileOrigin: true });
    await expect(collectPromotionRaceTablebase(request(), dependencies(hostile.store))).rejects.toThrow(/INVALID_RECORD/);
  });

  test("D2766 only canonical durable reads mint recorded authority and structural stores fail", async () => {
    const value = await artifact();
    await expect(collectPromotionRaceTablebase(request(), dependencies({ ...value.store }))).rejects.toThrow(/STORE_UNSEALED/);
    await writeFile(resolve(value.root, "evidence.json"), '{}\n', "utf8");
    await expect(collectPromotionRaceTablebase(request(), dependencies(value.store))).rejects.toThrow(/INVALID_RECORD/);
  });

  test("D2767 refuses future observations and unresolved document pointers", async () => {
    const future = await artifact({ future: true });
    await expect(collectPromotionRaceTablebase(request(), dependencies(future.store))).rejects.toThrow(/INVALID_RECORD/);
    const broken = await artifact({ brokenPointer: true });
    await expect(collectPromotionRaceTablebase(request(), dependencies(broken.store))).rejects.toThrow(/INVALID_RECORD/);
  });

  test("D2768 asserts request identity before the outside-domain fast path", async () => {
    const value = await artifact();
    const original = request(outsideFen);
    await expect(collectPromotionRaceTablebase({ ...original }, dependencies(value.store))).rejects.toThrow(/REQUEST_UNSEALED/);
    const result = await collectPromotionRaceTablebase(original, dependencies(value.store));
    expect(result).toMatchObject({ kind: "unavailable", reason: "outside_tablebase_domain", pieceCount: 8 });
    assertPromotionRaceTablebaseResult(result);
  });

  test("D2769 storage failure is observed and prevents provider fallback", async () => {
    const calls: string[] = [];
    const value = await artifact();
    await unlink(resolve(value.root, "evidence.json"));
    await expect(collectPromotionRaceTablebase(request(), dependencies(value.store, calls))).rejects.toThrow(/STORAGE_UNAVAILABLE/);
    expect(calls).toEqual([]);
  });

  test("D2769 legal abstention is produced by the owning durable dependency", async () => {
    const calls: string[] = [];
    const value = await artifact();
    await unlink(resolve(value.root, "legal-authority.json"));
    const result = await collectPromotionRaceTablebase(request(), dependencies(value.store, calls));
    expect(result).toMatchObject({ kind: "unavailable", reason: "input_abstained", upstreamReason: "upstream_unavailable" });
    expect(calls).toEqual([]);
    assertPromotionRaceTablebaseResult(result);
  });
});
