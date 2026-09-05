import { describe, expect, test } from "vitest";

import { createRulesPawnReadingContactsV1Evidence, type CanonicalFullFen } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  assertPromotionRaceTablebaseResult,
  collectPromotionRaceTablebase,
  createDurableRecordedLookup,
  createDurableSourcingSnapshot,
  createExactLegalMovesResolver,
  createFailedDurableRecordedLookup,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createSyzygyFixtureScheduler,
  createUnavailableLegalMovesResolver,
  derivePromotionRaceGeometry,
  recordedAuthorityReceipt,
  type PromotionRaceTablebaseDependencies,
} from "./model.js";

const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const outsideFen = "8/7P/8/8/8/8/p7/1RBQKB1k w - - 0 1" as CanonicalFullFen;
const raw = { category: "win", dtz: 1, precise_dtz: 0, moves: [] };

function request(fen = raceFen) {
  const geometry = derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(fen) });
  return createPromotionRaceTablebaseRequest(geometry, { id: "ninth-author", budgetMs: 500 }, new AbortController().signal);
}

function manifest() {
  return { schema: "tabiya.source-manifest.v1", sources: [{ id: "syzygy", operation: "syzygy.position@1", grounding: "tablebase_exact" }] };
}

function ledger(fen = raceFen) {
  return {
    schema: "tabiya.sourcing.evidence.v1",
    sourcedAt: "2026-09-05T01:00:00.000Z",
    records: [{
      kind: "tablebase_result",
      anchor: { fen },
      sourceId: "syzygy",
      retrievedAt: "2026-09-05T00:00:00.000Z",
      grounds: "machine_validation",
      values: { ...raw, fen, pieceCount: fen === outsideFen ? 8 : 4 },
      supports: ["/start/fen"],
    }],
    abstentions: [],
  };
}

function dependencies(recordedLookup: PromotionRaceTablebaseDependencies["recordedLookup"], calls: string[] = []): PromotionRaceTablebaseDependencies {
  return {
    recordedLookup,
    legalResolver: createExactLegalMovesResolver(calls),
    scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw }), calls),
    sourceFactories: createProviderSourceFactories(),
  };
}

describe("semantic collectors promotion ninth author repair", () => {
  test("D2748 recorded truth retains the exact durable ledger record and registered source", async () => {
    const snapshot = createDurableSourcingSnapshot(manifest(), ledger());
    const lookup = createDurableRecordedLookup(snapshot);
    const selected = lookup.get(raceFen);
    expect(selected.kind).toBe("found");
    if (selected.kind !== "found") throw new Error("expected durable record");
    expect(selected.receipt).toBe(recordedAuthorityReceipt(selected.evidence));
    expect(selected.receipt.record).toMatchObject({
      anchor: { fen: raceFen }, sourceId: "syzygy", grounds: "machine_validation", supports: ["/start/fen"],
    });
    expect(selected.receipt.snapshot.manifest.sources[0]?.operation).toBe("syzygy.position@1");
    const result = await collectPromotionRaceTablebase(request(), dependencies(lookup));
    expect(result.kind).toBe("reading");
    expect(() => createDurableSourcingSnapshot(manifest(), { ...ledger(), records: [{ ...ledger().records[0], retrievedAt: "2099-01-01T00:00:00.000Z" }] })).toThrow("TABLEBASE_RETRIEVED_AFTER_SNAPSHOT");
  });

  test("D2749 sealed storage failure is reachable and never falls back to the provider", async () => {
    const calls: string[] = [];
    const failed = createFailedDurableRecordedLookup("storage_unavailable", calls);
    await expect(collectPromotionRaceTablebase(request(), dependencies(failed, calls))).rejects.toThrow("RECORDED_TABLEBASE_STORAGE_UNAVAILABLE");
    expect(calls.some((entry) => entry.startsWith("provider:"))).toBe(false);
  });

  test("D2750 sealed legal unavailability is reachable without manufacturing legal evidence", async () => {
    const calls: string[] = [];
    const snapshot = createDurableSourcingSnapshot(manifest(), { ...ledger(), records: [] });
    const result = await collectPromotionRaceTablebase(request(), {
      ...dependencies(createDurableRecordedLookup(snapshot), calls),
      legalResolver: createUnavailableLegalMovesResolver("upstream_unavailable", calls),
    });
    expect(result).toMatchObject({ kind: "unavailable", reason: "input_abstained", missing: ["legal_moves"], upstreamReason: "upstream_unavailable" });
    expect(calls.filter((entry) => entry.startsWith("legal:"))).toHaveLength(1);
    expect(calls.some((entry) => entry.startsWith("provider:"))).toBe(false);
    expect(() => assertPromotionRaceTablebaseResult(result)).not.toThrow();
  });

  test("D2751 live success is refused before provider work outside the seven-piece domain", async () => {
    const calls: string[] = [];
    const snapshot = createDurableSourcingSnapshot(manifest(), { ...ledger(), records: [] });
    const result = await collectPromotionRaceTablebase(request(outsideFen), dependencies(createDurableRecordedLookup(snapshot), calls));
    expect(result).toMatchObject({ kind: "unavailable", reason: "outside_tablebase_domain", domain: { fen: outsideFen, pieceCount: 8, maximumPieceCount: 7 } });
    expect(calls).toEqual([]);
    expect(() => assertPromotionRaceTablebaseResult(result)).not.toThrow();
  });

  test("D2752 an outside-domain durable record cannot become recorded evidence", () => {
    expect(() => createDurableSourcingSnapshot(manifest(), ledger(outsideFen))).toThrow("TABLEBASE_DOMAIN_REQUIRED");
  });
});
