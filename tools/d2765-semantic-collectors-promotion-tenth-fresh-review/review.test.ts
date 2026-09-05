// DISPOSABLE tenth fresh-review falsifiers for D2765-D2770. Not production code.
import { readFileSync } from "node:fs";
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
} from "../d2748-semantic-collectors-promotion-ninth-author-repair/model.js";

const productionValidation = readFileSync("apps/server/src/sourcing/ledger-validation.ts", "utf8");
const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const outsideFen = "8/7P/8/8/8/8/p7/1RBQKB1k w - - 0 1" as CanonicalFullFen;
const raw = { category: "win", dtz: 1, precise_dtz: 0, moves: [] };

function request(fen = raceFen) {
  const geometry = derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(fen) });
  return createPromotionRaceTablebaseRequest(geometry, { id: "tenth-review", budgetMs: 500 }, new AbortController().signal);
}
function manifest(sourceId = "syzygy") {
  return { schema: "tabiya.source-manifest.v1", sources: [{ id: sourceId, operation: "syzygy.position@1", grounding: "tablebase_exact" }] };
}
function ledger(sourceId = "syzygy", sourcedAt = "2026-09-05T01:00:00.000Z", retrievedAt = "2026-09-05T00:00:00.000Z", supports = ["/start/fen"]) {
  return { schema: "tabiya.sourcing.evidence.v1", sourcedAt, records: [{ kind: "tablebase_result", anchor: { fen: raceFen }, sourceId, retrievedAt, grounds: "machine_validation", values: { ...raw, fen: raceFen, pieceCount: 4 }, supports }], abstentions: [] };
}
function dependencies(recordedLookup: PromotionRaceTablebaseDependencies["recordedLookup"], legalResolver = createExactLegalMovesResolver()): PromotionRaceTablebaseDependencies {
  return { recordedLookup, legalResolver, scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw })), sourceFactories: createProviderSourceFactories() };
}

describe("held promotion ninth repair fresh-review returns", () => {
  test("D2765 repair dialect rejects the production manifest while production rejects the repair dialect", () => {
    expect(productionValidation).toMatch(/tabiya\.sourcing\.manifest\.v1/u);
    expect(productionValidation).toMatch(/\.entries/u);
    expect(() => createDurableSourcingSnapshot({ schema: "tabiya.sourcing.manifest.v1", entries: [] }, { ...ledger(), records: [] })).toThrow();
    expect(() => createDurableSourcingSnapshot(manifest(), { ...ledger(), records: [] })).not.toThrow();
  });

  test("D2766 JSON-round-tripped caller objects mint durable recorded evidence", async () => {
    const snapshot = createDurableSourcingSnapshot(JSON.parse(JSON.stringify(manifest())), JSON.parse(JSON.stringify(ledger())));
    const lookup = createDurableRecordedLookup(snapshot);
    const found = lookup.get(raceFen);
    expect(found.kind).toBe("found");
    if (found.kind !== "found") throw new Error("fixture");
    expect(recordedAuthorityReceipt(found.evidence).snapshot).toBe(snapshot);
    await expect(collectPromotionRaceTablebase(request(), dependencies(lookup))).resolves.toMatchObject({ kind: "reading" });
  });

  test("D2767 future timestamps and an unresolved support pointer become durable authority", () => {
    expect(() => createDurableSourcingSnapshot(manifest(), ledger("syzygy", "2099-01-01T00:00:01.000Z", "2099-01-01T00:00:00.000Z", ["/invented/claim"]))).not.toThrow();
  });

  test("D2768 a cloned request returns an asserted outside-domain result", async () => {
    const cloned = { ...request(outsideFen) };
    const snapshot = createDurableSourcingSnapshot(manifest(), { ...ledger(), records: [] });
    const result = await collectPromotionRaceTablebase(cloned, dependencies(createDurableRecordedLookup(snapshot)));
    expect(result).toMatchObject({ kind: "unavailable", reason: "outside_tablebase_domain" });
    expect(() => assertPromotionRaceTablebaseResult(result)).not.toThrow();
  });

  test("D2769 callers mint trusted storage and legal unavailability without either operation", async () => {
    const calls: string[] = [];
    const failed = createFailedDurableRecordedLookup("storage_unavailable", calls);
    await expect(collectPromotionRaceTablebase(request(), dependencies(failed))).rejects.toThrow(/STORAGE_UNAVAILABLE/);
    expect(calls).toEqual([`recorded:${raceFen}`]);
    const empty = createDurableRecordedLookup(createDurableSourcingSnapshot(manifest(), { ...ledger(), records: [] }));
    await expect(collectPromotionRaceTablebase(request(), dependencies(empty, createUnavailableLegalMovesResolver("upstream_unavailable")))).resolves.toMatchObject({ kind: "unavailable", upstreamReason: "upstream_unavailable" });
  });

  test("D2770 the caller self-registers an attacker source as exact Syzygy truth", async () => {
    const snapshot = createDurableSourcingSnapshot(manifest("attacker"), ledger("attacker"));
    const found = createDurableRecordedLookup(snapshot).get(raceFen);
    expect(found.kind).toBe("found");
    if (found.kind !== "found") throw new Error("fixture");
    expect(recordedAuthorityReceipt(found.evidence).record.sourceId).toBe("attacker");
  });
});
