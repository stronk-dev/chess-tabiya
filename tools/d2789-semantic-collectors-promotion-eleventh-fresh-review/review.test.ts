import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/index.js";
import { sha256 } from "../../apps/server/src/sourcing/canonical.js";
import { validatePackDocument } from "../../apps/server/src/pack-validation.js";
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
} from "../d2765-semantic-collectors-promotion-tenth-author-repair/model.js";
import {
  collectPromotionRaceTablebase as collectLegacy,
  createExactLegalMovesResolver,
  createPromotionRaceTablebaseRequest as createLegacyRequest,
  createRecordedTablebaseLookup,
  createRecordedTablebaseResultV1Evidence,
  createSourcingLedgerTablebaseResultV1Evidence,
} from "../d2693-semantic-collectors-promotion-eighth-author-repair/model.js";

const roots: string[] = [];
const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const crossedFen = "8/7P/8/8/8/8/p7/3K3k w - - 0 1" as CanonicalFullFen;
const retrievedAt = "2026-09-05T00:00:00.000Z";
const raw = { category: "win", dtz: 1, precise_dtz: 0, moves: [] };

afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function canonical(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${canonicalizeJson(value)}\n`, "utf8");
}

interface ArtifactOptions {
  readonly sourceId?: string;
  readonly documentFen?: CanonicalFullFen;
  readonly originSha?: string;
  readonly originBytes?: number;
  readonly legal?: unknown;
}

async function artifact(options: ArtifactOptions = {}): Promise<Readonly<{ root: string; store: PromotionArtifactStore; document: unknown }>> {
  const root = await mkdtemp(resolve(tmpdir(), "tabiya-promotion-fresh-"));
  roots.push(root);
  const sourceId = options.sourceId ?? "syzygy";
  const document = { id: "not-a-valid-drill-pack", version: "1.0.0", start: { fen: options.documentFen ?? raceFen } };
  await canonical(resolve(root, "pack.json"), document);
  await canonical(resolve(root, "sources.json"), {
    schema: "tabiya.sourcing.manifest.v1",
    entries: [{
      sourceId,
      retrievedAt,
      origin: {
        kind: "http",
        url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(raceFen)}`,
        status: 200,
        sha256: options.originSha ?? `sha256:${"a".repeat(64)}`,
        bytes: options.originBytes ?? 42,
        etag: null,
      },
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "machine response" },
    }],
  });
  await canonical(resolve(root, "evidence.json"), {
    schema: "tabiya.sourcing.evidence.v1",
    sourcedAt: retrievedAt,
    records: [{
      kind: "tablebase_result",
      anchor: { fen: raceFen },
      sourceId,
      retrievedAt,
      grounds: "machine_validation",
      values: { ...raw, fen: raceFen, pieceCount: 4 },
      supports: ["/start/fen"],
    }],
    abstentions: [],
  });
  await canonical(resolve(root, "legal-authority.json"), options.legal ?? { status: "available" });
  return Object.freeze({ root, store: await openPromotionArtifactStore(root), document });
}

function geometry() {
  return derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(raceFen) });
}

function request() {
  return createPromotionRaceTablebaseRequest(geometry(), { id: "eleventh-fresh", budgetMs: 500 }, new AbortController().signal);
}

function dependencies(store: PromotionArtifactStore) {
  return {
    artifacts: store,
    scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw })),
    sourceFactories: createProviderSourceFactories(),
  };
}

async function recordedResult(value: Awaited<ReturnType<typeof artifact>>) {
  const result = await collectPromotionRaceTablebase(request(), dependencies(value.store));
  expect(result.kind).toBe("reading");
  if (result.kind !== "reading" || result.derivation.source.kind !== "recorded") throw new Error("recorded reading expected");
  return Object.freeze({ result, receipt: recordedAuthorityReceipt(result.derivation.source.evidence) });
}

describe("semantic collectors promotion eleventh fresh review", () => {
  test("D2789 arbitrary caller directories and source ids self-register exact evidence", async () => {
    const value = await artifact({ sourceId: "attacker-selected" });
    const { receipt } = await recordedResult(value);
    expect(receipt.artifact.root).toBe(await import("node:fs/promises").then(({ realpath }) => realpath(value.root)));
    expect(receipt.source.sourceId).toBe("attacker-selected");
  });

  test("D2790 a schema-invalid non-pack grounds a recorded reading", async () => {
    const value = await artifact();
    expect(validatePackDocument(value.document).valid).toBe(false);
    await expect(recordedResult(value)).resolves.toBeDefined();
    expect(value.document).not.toHaveProperty("objective");
  });

  test("D2791 support existence is accepted when its value contradicts the record subject", async () => {
    const value = await artifact({ documentFen: crossedFen });
    const { receipt } = await recordedResult(value);
    expect((receipt.record.supports as readonly string[])).toEqual(["/start/fen"]);
    expect((receipt as { readonly artifact: unknown }).artifact).toBeDefined();
    expect(receipt.record.anchor.fen).toBe(raceFen);
    expect((value.document as { start: { fen: string } }).start.fen).toBe(crossedFen);
  });

  test("D2792 claimed response digest and length are never checked against response bytes", async () => {
    const responseBytes = `${canonicalizeJson(raw)}\n`;
    const fakeSha = `sha256:${"b".repeat(64)}`;
    const value = await artifact({ originSha: fakeSha, originBytes: 999_999 });
    const { receipt } = await recordedResult(value);
    expect(receipt.source.origin).toMatchObject({ sha256: fakeSha, bytes: 999_999 });
    expect(sha256(responseBytes)).not.toBe(fakeSha);
    expect(Buffer.byteLength(responseBytes)).not.toBe(999_999);
  });

  test("D2793 a status token mints unrelated exact legal moves and malformed bytes become absence", async () => {
    const available = await artifact({ legal: { status: "available" } });
    const { result } = await recordedResult(available);
    expect(result.derivation.legalMoves.payload.fen).toBe(raceFen);
    expect(result.derivation.legalMoves.payload.pieces.length).toBeGreaterThan(0);

    const malformed = await artifact({ legal: { status: "invented" } });
    await expect(collectPromotionRaceTablebase(request(), dependencies(malformed.store))).resolves.toMatchObject({
      kind: "unavailable",
      reason: "input_abstained",
      upstreamReason: "upstream_unavailable",
    });
  });

  test("D2794 the current assertion accepts a legacy recorded reading without durable receipt", async () => {
    const source = createSourcingLedgerTablebaseResultV1Evidence({ fen: raceFen, sourceId: "attacker", retrievedAt, rawPosition: raw });
    const recorded = createRecordedTablebaseResultV1Evidence(source);
    const legacyRequest = createLegacyRequest(geometry(), { id: "legacy-bypass", budgetMs: 500 }, new AbortController().signal);
    const result = await collectLegacy(legacyRequest, {
      recordedLookup: createRecordedTablebaseLookup([recorded]),
      resolveLegalMoves: createExactLegalMovesResolver(),
      scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw })),
      sourceFactories: createProviderSourceFactories(),
    });
    expect(result.kind).toBe("reading");
    expect(() => assertPromotionRaceTablebaseResult(result)).not.toThrow();
    if (result.kind !== "reading" || result.derivation.source.kind !== "recorded") throw new Error("legacy recorded reading expected");
    const legacyEvidence = result.derivation.source.evidence;
    expect(() => recordedAuthorityReceipt(legacyEvidence)).toThrow(/DURABLE_RECORDED_AUTHORITY_MISSING/);
  });
});
