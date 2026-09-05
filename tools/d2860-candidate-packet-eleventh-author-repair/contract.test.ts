import { describe, expect, it } from "vitest";

import {
  CANDIDATE_COLLECTOR_PROJECTION_KEYS,
  assertCandidatePopulationReceipt,
  compileCandidatePopulation,
  createCandidatePopulationService,
  createCandidatePopulationServiceForTest,
  type CandidatePopulationRequest,
  type CandidatePopulationServiceLimits,
} from "./model.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const CHECKMATE = "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1";
const STALEMATE = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
const request = (beforeFen = INITIAL, scope: CandidatePopulationRequest["scope"] = "events_and_readings") => Object.freeze({ beforeFen, ruleset: "standard" as const, scope });
const limits = (overrides: Partial<CandidatePopulationServiceLimits> = {}): CandidatePopulationServiceLimits => Object.freeze({
  maxEntries: 8,
  maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER,
  maxRetainedObjects: Number.MAX_SAFE_INTEGER,
  maxCollectorsPerGroup: 4,
  maxConcurrent: 1,
  maxPending: 1,
  maxQueueWaitMs: 100,
  maxCompileMs: 5_000,
  ...overrides,
});
const signal = () => new AbortController().signal;
const delay = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

describe("D2860-D2863 candidate packet eleventh author repair", () => {
  it("D2861 retains all seven identity terms beside the exact legal population", () => {
    const receipt = compileCandidatePopulation(request());
    expect(() => assertCandidatePopulationReceipt(receipt)).not.toThrow();
    expect(receipt.packet).toMatchObject({
      beforeFen: INITIAL,
      ruleset: "standard",
      scope: "events_and_readings",
      legalConvention: { id: "rules.mobility.reading.legal_moves", version: 1 },
      compilerVersion: "candidate-population-compiler@1",
    });
    expect(receipt.packet.id).toMatch(/^[0-9a-f]{64}$/u);
    expect(receipt.packet.manifestDigest).toMatch(/^[0-9a-f]{64}$/u);
    expect(receipt.packet.moveIdentityConvention).toBeTruthy();
    expect(receipt.packet.legalMoves).toHaveLength(20);
    expect(receipt.packet.candidates).toHaveLength(20);
  });

  it("D2862 retains one total, sealed result per declared projection and keeps available-empty distinct", () => {
    const receipt = compileCandidatePopulation(request());
    const expected = new Set(Object.values(CANDIDATE_COLLECTOR_PROJECTION_KEYS).flat());
    for (const input of receipt.candidateInputs) {
      const projections = new Set(input.executionOutcomes.map((outcome) => outcome.projection));
      expect(projections).toEqual(expected);
      expect(input.executionOutcomes.every((outcome) => outcome.moveUci === input.row.moveUci && outcome.result.projection === outcome.projection)).toBe(true);
      expect(input.executionOutcomes.every((outcome) => Object.isFrozen(outcome) && Object.isFrozen(outcome.result))).toBe(true);
    }
    expect(receipt.candidateInputs.flatMap((input) => input.executionOutcomes).some((outcome) => outcome.result.kind === "available" && outcome.result.values.length === 0)).toBe(true);
  });

  it("D2863 names checkmate and stalemate instead of collapsing terminal roots", () => {
    expect(compileCandidatePopulation(request(CHECKMATE, "events")).packet).toMatchObject({ candidates: [], terminal: { reason: "checkmate" } });
    expect(compileCandidatePopulation(request(STALEMATE, "events")).packet).toMatchObject({ candidates: [], terminal: { reason: "stalemate" } });
    expect(compileCandidatePopulation(request(INITIAL, "events")).packet).not.toHaveProperty("terminal");
  });

  it("D2860 exposes an asynchronous miss, direct hit and wide-to-narrow projection hit", async () => {
    const service = createCandidatePopulationService({ limits: limits() });
    expect((await service.get(request(), signal()))).toMatchObject({ kind: "ready", cache: "miss" });
    expect((await service.get(request(), signal()))).toMatchObject({ kind: "ready", cache: "hit" });
    expect((await service.get(request(INITIAL, "events"), signal()))).toMatchObject({ kind: "ready", cache: "projection_hit" });
    expect(service.stats()).toMatchObject({ hits: 1, projectionHits: 1, misses: 1, yields: 80, activeUniqueJobs: 0, queuedUniqueJobs: 0 });
    await service.close();
    expect(await service.get(request(), signal())).toMatchObject({ kind: "failed", error: { code: "service_closed" } });
  });

  it("D2860 single-flights equal work and cancels only the abandoned waiter", async () => {
    let releases = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const service = createCandidatePopulationServiceForTest({ limits: limits(), compile: async (value, compileSignal) => {
      releases += 1;
      await gate;
      if (compileSignal.aborted) throw new TypeError("ABORTED");
      return compileCandidatePopulation(value);
    } });
    const firstController = new AbortController();
    const first = service.get(request(), firstController.signal);
    const second = service.get(request(), signal());
    firstController.abort();
    release();
    expect(await first).toEqual({ kind: "cancelled", reason: "caller_aborted" });
    expect(await second).toMatchObject({ kind: "ready", cache: "miss" });
    expect(releases).toBe(1);
    expect(service.stats()).toMatchObject({ cancelledWaiters: 1, lastWaiterCancellations: 0, started: 1 });
    await service.close();
  });

  it("D2860 refuses overload and enforces the queued deadline", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const service = createCandidatePopulationServiceForTest({ limits: limits({ maxQueueWaitMs: 10 }), compile: async (value) => { await gate; return compileCandidatePopulation(value); } });
    const active = service.get(request(INITIAL, "events"), signal());
    const queued = service.get(request(INITIAL, "readings"), signal());
    expect(await service.get(request(INITIAL, "events_and_readings"), signal())).toMatchObject({ kind: "failed", error: { code: "overloaded" } });
    expect(await queued).toMatchObject({ kind: "failed", error: { code: "deadline_exceeded", stage: "queue" } });
    release();
    expect(await active).toMatchObject({ kind: "ready" });
    await service.close();
  });

  it("D2860 prevents a compile completing after its deadline from mutating the cache", async () => {
    const service = createCandidatePopulationServiceForTest({ limits: limits({ maxCompileMs: 5 }), compile: async (value) => { await delay(20); return compileCandidatePopulation(value); } });
    expect(await service.get(request(), signal())).toMatchObject({ kind: "failed", error: { code: "deadline_exceeded", stage: "compile" } });
    await delay(30);
    expect(service.stats()).toMatchObject({ cacheEntries: 0, misses: 0 });
    expect(await service.get(request(), signal())).toMatchObject({ kind: "failed", error: { code: "deadline_exceeded", stage: "compile" } });
    await service.close();
  });

  it("D2860 turns scheduler rejection into its exact failure without publishing a partial receipt", async () => {
    const service = createCandidatePopulationServiceForTest({ limits: limits(), yieldControl: async () => { throw new TypeError("scheduler unavailable"); } });
    expect(await service.get(request(), signal())).toMatchObject({ kind: "failed", error: { code: "scheduler_failed", stage: "yield", collectorId: "event.tactical" } });
    expect(service.stats()).toMatchObject({ cacheEntries: 0, completed: 0, failed: 1 });
    await service.close();
  });
});
