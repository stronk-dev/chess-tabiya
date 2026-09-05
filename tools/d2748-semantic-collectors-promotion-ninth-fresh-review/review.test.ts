import { describe, expect, test } from "vitest";

import { createRulesPawnReadingContactsV1Evidence, type CanonicalFullFen } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  collectPromotionRaceTablebase,
  createExactLegalMovesResolver,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createRecordedTablebaseLookup,
  createRecordedTablebaseResultV1Evidence,
  createSourcingLedgerTablebaseResultV1Evidence,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  type PromotionRaceTablebaseDependencies,
} from "../d2693-semantic-collectors-promotion-eighth-author-repair/model.js";

const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const outsideFen = "8/7P/8/8/8/8/p7/1RBQKB1k w - - 0 1" as CanonicalFullFen;
const raw = { category: "win", dtz: 1, precise_dtz: 0, moves: [] };

function operation(fen: CanonicalFullFen) {
  const geometry = derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(fen) });
  return createPromotionRaceTablebaseRequest(geometry, { id: "ninth-review", budgetMs: 500 }, new AbortController().signal);
}

function dependencies(_fen: CanonicalFullFen, recorded: Parameters<typeof createRecordedTablebaseLookup>[0] = []) : PromotionRaceTablebaseDependencies {
  return {
    recordedLookup: createRecordedTablebaseLookup(recorded),
    resolveLegalMoves: createExactLegalMovesResolver(),
    scheduler: createSyzygyFixtureScheduler(() => ({ kind: "success", rawPosition: raw })),
    sourceFactories: createProviderSourceFactories(),
  };
}

describe("held promotion collectors ninth fresh review", () => {
  test("D2748 caller JSON becomes sourcing-ledger authority without a ledger or manifest subject", () => {
    const source = createSourcingLedgerTablebaseResultV1Evidence({
      fen: raceFen,
      sourceId: "caller-invented",
      retrievedAt: "2099-01-01T00:00:00.000Z",
      rawPosition: raw,
    });
    expect(source).toMatchObject({ producer: { id: "sourcing.ledger" }, projection: { id: "sourcing.ledger.tablebase_result" } });
    expect(source.payload).not.toHaveProperty("anchor");
    expect(source.payload).not.toHaveProperty("grounds");
    expect(source.payload).not.toHaveProperty("supports");
    expect(() => createRecordedTablebaseResultV1Evidence(source)).not.toThrow();
  });

  test("D2749 recorded storage failure exists in the public union but has no sealed construction path", async () => {
    const valid = dependencies(raceFen);
    const failedLookup = { get: () => ({ kind: "failed" as const, reason: "storage_unavailable" as const }) };
    await expect(collectPromotionRaceTablebase(operation(raceFen), { ...valid, recordedLookup: failedLookup })).rejects.toThrow("PROMOTION_RECORDED_LOOKUP_UNSEALED");
    expect(valid.recordedLookup.get(raceFen)).toEqual({ kind: "absent" });
  });

  test("D2750 legal-map abstention exists in the public union but has no sealed construction path", async () => {
    const valid = dependencies(raceFen);
    const unavailable = () => ({ kind: "unavailable" as const, reason: "upstream_unavailable" as const });
    await expect(collectPromotionRaceTablebase(operation(raceFen), { ...valid, resolveLegalMoves: unavailable })).rejects.toThrow("PROMOTION_LEGAL_RESOLVER_UNSEALED");
    expect(valid.resolveLegalMoves(raceFen).kind).toBe("evidence");
  });

  test("D2751 live success mints exact tablebase evidence outside the seven-piece domain", async () => {
    const result = await collectPromotionRaceTablebase(operation(outsideFen), dependencies(outsideFen));
    expect(result).toMatchObject({ kind: "reading", item: { payload: { fen: outsideFen, category: "win" } } });
  });

  test("D2752 caller-recorded success bypasses the same tablebase domain boundary", async () => {
    const source = createSourcingLedgerTablebaseResultV1Evidence({
      fen: outsideFen,
      sourceId: "caller-invented",
      retrievedAt: "2026-09-05T00:00:00.000Z",
      rawPosition: raw,
    });
    const recorded = createRecordedTablebaseResultV1Evidence(source);
    const result = await collectPromotionRaceTablebase(operation(outsideFen), dependencies(outsideFen, [recorded]));
    expect(result).toMatchObject({ kind: "reading", item: { payload: { fen: outsideFen, category: "win", source: { kind: "recorded" } } } });
  });
});
