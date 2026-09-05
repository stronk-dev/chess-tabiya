import { describe, expect, test } from "vitest";

import { createRulesPawnReadingContactsV1Evidence, type CanonicalFullFen } from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  assertPromotionRaceTablebaseResult,
  collectPromotionRaceTablebase,
  createExactLegalMovesResolver,
  createPromotionRaceContactsUnavailable,
  createPromotionRaceTablebaseRequest,
  createProviderSourceFactories,
  createRecordedTablebaseLookup,
  createRecordedTablebaseResultV1Evidence,
  createSourcingLedgerTablebaseResultV1Evidence,
  createSyzygyFixtureScheduler,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
  recordedTablebaseValueReceipt,
  type PromotionRaceTablebaseDependencies,
  type SyzygyFixtureOutcome,
} from "./model.js";

const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const quietFen = "8/8/8/8/8/8/P7/4K2k w - - 0 1" as CanonicalFullFen;
const outsideFen = "8/7P/8/8/8/8/p7/1RBQKB1k w - - 0 1" as CanonicalFullFen;
const raw = (overrides: Readonly<Record<string, unknown>> = {}) => ({ category: "win", dtz: 1, precise_dtz: 0, moves: [], ...overrides });

function geometry(fen = raceFen) {
  return derivePromotionRaceGeometry({ kind: "evidence", evidence: createRulesPawnReadingContactsV1Evidence(fen) });
}

function request(fen = raceFen, budgetMs = 800, signal = new AbortController().signal) {
  return createPromotionRaceTablebaseRequest(geometry(fen), { id: "promotion-review", budgetMs }, signal);
}

function dependencies(outcome: SyzygyFixtureOutcome, calls: string[] = []): PromotionRaceTablebaseDependencies {
  return {
    recordedLookup: createRecordedTablebaseLookup([], calls),
    resolveLegalMoves: createExactLegalMovesResolver(calls),
    scheduler: createSyzygyFixtureScheduler(() => outcome, calls),
    sourceFactories: createProviderSourceFactories(),
  };
}

describe("semantic collectors promotion eighth author repair", () => {
  test("D2693 one total collector owns recorded-first, source resolution, and success-only legal ordering", async () => {
    const recorded = createRecordedTablebaseResultV1Evidence(createSourcingLedgerTablebaseResultV1Evidence({
      fen: raceFen,
      sourceId: "recorded-fixture",
      retrievedAt: "2026-09-05T00:00:00.000Z",
      rawPosition: raw({ category: "draw" }),
    }));
    const recordedCalls: string[] = [];
    const recordedResult = await collectPromotionRaceTablebase(request(), {
      recordedLookup: createRecordedTablebaseLookup([recorded], recordedCalls),
      resolveLegalMoves: createExactLegalMovesResolver(recordedCalls),
      scheduler: createSyzygyFixtureScheduler(() => ({ kind: "source_failure", reason: "provider_unavailable" }), recordedCalls),
      sourceFactories: createProviderSourceFactories(),
    });
    expect(recordedCalls.map((entry) => entry.split(":")[0])).toEqual(["recorded", "legal"]);
    expect(recordedResult).toMatchObject({ kind: "reading", item: { payload: { category: "draw" } } });

    const liveCalls: string[] = [];
    const live = await collectPromotionRaceTablebase(request(), dependencies({ kind: "success", rawPosition: raw() }, liveCalls));
    expect(liveCalls.map((entry) => entry.split(":")[0])).toEqual(["recorded", "digest", "provider", "legal"]);
    expect(() => assertPromotionRaceTablebaseResult(live)).not.toThrow();

    const failedCalls: string[] = [];
    await collectPromotionRaceTablebase(request(), dependencies({ kind: "source_failure", reason: "queue_full" }, failedCalls));
    expect(failedCalls.some((entry) => entry.startsWith("legal:"))).toBe(false);

    const controller = new AbortController();
    controller.abort();
    const cancelledCalls: string[] = [];
    const cancelled = await collectPromotionRaceTablebase(request(raceFen, 800, controller.signal), dependencies({ kind: "success", rawPosition: raw() }, cancelledCalls));
    expect(cancelled).toMatchObject({ kind: "unavailable", reason: "provider_unavailable", providerReason: "cancelled" });
    expect(cancelledCalls.some((entry) => entry.startsWith("legal:"))).toBe(false);

    const noRaceCalls: string[] = [];
    const noRace = createPromotionRaceTablebaseRequest(geometry(quietFen), { id: "promotion-review", budgetMs: 500 }, new AbortController().signal);
    const completed = await collectPromotionRaceTablebase(noRace, dependencies({ kind: "success", rawPosition: raw() }, noRaceCalls));
    expect(completed.kind).toBe("completed");
    expect(noRaceCalls).toEqual([]);
  });

  test("D2694 only the scheduler computes a canonical 64-hex request digest", async () => {
    const result = await collectPromotionRaceTablebase(request(), dependencies({ kind: "source_failure", reason: "queue_full" }));
    expect(result).toMatchObject({ kind: "unavailable", reason: "provider_unavailable" });
    if (result.kind !== "unavailable" || result.reason !== "provider_unavailable") throw new Error("expected provider failure");
    expect(result.requestDigest).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(result.invocation.requestDigest).toBe(result.requestDigest);
    expect(result.invocation.result.normalizedRequestDigest).toBe(result.requestDigest);
  });

  test("D2695 provider result arms remain inside the exact request-owning transaction", async () => {
    const white = await collectPromotionRaceTablebase(request(outsideFen), dependencies({ kind: "local_domain_result", pieceCount: 8 }));
    expect(white).toMatchObject({ kind: "unavailable", reason: "outside_tablebase_domain" });
    if (white.kind !== "unavailable" || white.reason !== "outside_tablebase_domain") throw new Error("expected outside-domain result");
    expect(white.invocation.request.request.fen).toBe(outsideFen);
    expect(white.invocation.result.normalizedRequestDigest).toBe(white.requestDigest);
    expect(white.source.payload).toBe(white.invocation.result);

    const structural = { ...dependencies({ kind: "local_domain_result", pieceCount: 8 }).scheduler };
    await expect(collectPromotionRaceTablebase(request(outsideFen), { ...dependencies({ kind: "local_domain_result", pieceCount: 8 }), scheduler: structural })).rejects.toThrow("PROMOTION_PROVIDER_DEPENDENCY_UNSEALED");
  });

  test("D2696 equal FEN with a different normalized timeout has a different digest", () => {
    const scheduler = createSyzygyFixtureScheduler(() => ({ kind: "source_failure", reason: "queue_full" }));
    const short = makePromotionRaceSyzygyRequest(raceFen, { id: "short", budgetMs: 100 });
    const long = makePromotionRaceSyzygyRequest(raceFen, { id: "long", budgetMs: 800 });
    expect(short.request.timeoutMs).toBe(100);
    expect(long.request.timeoutMs).toBe(500);
    expect(scheduler.normalizedRequestDigest(short)).not.toBe(scheduler.normalizedRequestDigest(long));
  });

  test("D2697 recorded evidence requires the exact sourcing-ledger item and retains its digest", () => {
    const source = createSourcingLedgerTablebaseResultV1Evidence({
      fen: raceFen,
      sourceId: "recorded-fixture",
      retrievedAt: "2026-09-05T00:00:00.000Z",
      rawPosition: raw(),
    });
    const recorded = createRecordedTablebaseResultV1Evidence(source);
    const receipt = recordedTablebaseValueReceipt(recorded);
    expect(receipt.source).toBe(source);
    expect(receipt.output).toBe(recorded);
    expect(receipt.sourceDigest).toMatch(/^sha256:[0-9a-f]{64}$/u);
    expect(() => createRecordedTablebaseResultV1Evidence({ ...source } as never)).toThrow("EVIDENCE_GENERIC_BYPASS");
  });

  test("D2698 an illegal provider move becomes invalid_response before legal-map resolution", async () => {
    const calls: string[] = [];
    const result = await collectPromotionRaceTablebase(request(), dependencies({
      kind: "success",
      rawPosition: raw({ moves: [{ uci: "a7a9q", san: "Qa9", category: "win", dtz: 1, precise_dtz: 0 }] }),
    }, calls));
    expect(result).toMatchObject({ kind: "unavailable", reason: "provider_unavailable", providerReason: "invalid_response" });
    expect(calls.some((entry) => entry.startsWith("legal:"))).toBe(false);
  });

  test("D2699 sealed contacts unavailability reaches the total input-abstained result", async () => {
    const missing = derivePromotionRaceGeometry(createPromotionRaceContactsUnavailable("not_collected"));
    const operation = createPromotionRaceTablebaseRequest(missing, { id: "promotion-review", budgetMs: 500 }, new AbortController().signal);
    const calls: string[] = [];
    const result = await collectPromotionRaceTablebase(operation, dependencies({ kind: "success", rawPosition: raw() }, calls));
    expect(result).toMatchObject({ kind: "unavailable", reason: "input_abstained", missing: ["geometry"] });
    expect(calls).toEqual([]);
    expect(() => createPromotionRaceTablebaseRequest({ ...missing } as never, { id: "promotion-review", budgetMs: 500 }, new AbortController().signal)).toThrow("PROMOTION_GEOMETRY_UNAVAILABLE_UNSEALED");
  });

  test("D2700 only the exact operation-keyed source factory can seal live evidence", async () => {
    const valid = dependencies({ kind: "success", rawPosition: raw() });
    const result = await collectPromotionRaceTablebase(request(), valid);
    expect(result.kind).toBe("reading");

    const crossedFactories = { ...valid.sourceFactories };
    await expect(collectPromotionRaceTablebase(request(), { ...valid, sourceFactories: crossedFactories })).rejects.toThrow("PROMOTION_PROVIDER_DEPENDENCY_UNSEALED");
  });
});
