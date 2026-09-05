import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { measureRetainedValueForTest } from "../d2678-candidate-packet-tenth-author-repair/model.js";
import {
  compileCandidatePopulation,
  createCandidatePopulationService,
  createCandidatePopulationServiceForTest,
  type CandidatePopulationRequest,
  type CandidatePopulationServiceLimits,
} from "../d2860-candidate-packet-eleventh-author-repair/model.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const AFTER_D4 = "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 1";
const MODEL_SOURCE = readFileSync(new URL("../d2860-candidate-packet-eleventh-author-repair/model.ts", import.meta.url), "utf8");

const request = (beforeFen = INITIAL, scope: CandidatePopulationRequest["scope"] = "events_and_readings") =>
  Object.freeze({ beforeFen, ruleset: "standard" as const, scope });
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

describe("D2885-D2891 candidate packet twelfth fresh review", () => {
  it("D2885 accepts a genuine receipt compiled for a different request", async () => {
    const service = createCandidatePopulationServiceForTest({
      limits: limits(),
      compile: async () => compileCandidatePopulation(request(INITIAL, "readings")),
    });
    const result = await service.get(request(INITIAL, "events"), signal());
    expect(result).toMatchObject({ kind: "ready", receipt: { packet: { scope: "readings" } } });
    await service.close();
  });

  it("D2886 lets a queued deadline terminate the job after active compilation starts", async () => {
    let releaseFirst!: () => void;
    let releaseSecond!: () => void;
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
    const secondGate = new Promise<void>((resolve) => { releaseSecond = resolve; });
    const service = createCandidatePopulationServiceForTest({
      limits: limits({ maxQueueWaitMs: 50 }),
      compile: async (value) => {
        if (value.scope === "events") await firstGate;
        else await secondGate;
        return compileCandidatePopulation(value);
      },
    });
    const first = service.get(request(INITIAL, "events"), signal());
    const second = service.get(request(INITIAL, "readings"), signal());
    await delay(5);
    releaseFirst();
    expect(await first).toMatchObject({ kind: "ready" });
    expect(await second).toMatchObject({ kind: "failed", error: { code: "deadline_exceeded", stage: "queue" } });
    releaseSecond();
    await delay(5);
    await service.close();
  });

  it("D2887 maps a collector/compiler exception to receipt corruption, leaving collector_failed unreachable", async () => {
    const service = createCandidatePopulationServiceForTest({
      limits: limits(),
      compile: async () => { throw new TypeError("collector exploded"); },
    });
    expect(await service.get(request(), signal())).toMatchObject({
      kind: "failed",
      error: { code: "invariant_failed", invariant: "receipt" },
    });
    expect(MODEL_SOURCE.match(/code: "collector_failed"/gu)).toHaveLength(1);
    await service.close();
  });

  it("D2888 makes NON_TERMINAL_EMPTY unable to fire by defining every zero-candidate root as mate or stalemate", () => {
    expect(MODEL_SOURCE).toContain("if (candidateCount > 0) return undefined;");
    expect(MODEL_SOURCE).toContain('return Object.freeze({ reason: position.isCheckmate() ? "checkmate" : "stalemate" });');
    expect(MODEL_SOURCE).toContain("if (packet.candidates.length === 0 && terminalState === undefined) throw new TypeError(\"NON_TERMINAL_EMPTY\")");
  });

  it("D2889 accounts the predecessor graph while retaining the larger enriched receipt", async () => {
    const service = createCandidatePopulationService({ limits: limits() });
    const result = await service.get(request(), signal());
    if (result.kind !== "ready") throw new TypeError("expected ready receipt");
    const actual = measureRetainedValueForTest(result.receipt);
    const reported = service.stats();
    expect(reported.retainedObjects).toBeLessThan(actual.uniqueObjects);
    expect(reported.retainedLogicalBytes).toBeLessThan(actual.logicalUtf8Bytes);
    await service.close();
  });

  it("D2890 does not refresh the wide cache entry on a projection hit", async () => {
    const service = createCandidatePopulationService({ limits: limits({ maxEntries: 2 }) });
    expect(await service.get(request(INITIAL), signal())).toMatchObject({ kind: "ready", cache: "miss" });
    expect(await service.get(request(AFTER_E4), signal())).toMatchObject({ kind: "ready", cache: "miss" });
    expect(await service.get(request(INITIAL, "events"), signal())).toMatchObject({ kind: "ready", cache: "projection_hit" });
    expect(await service.get(request(AFTER_D4), signal())).toMatchObject({ kind: "ready", cache: "miss" });
    expect(await service.get(request(INITIAL), signal())).toMatchObject({ kind: "ready", cache: "miss" });
    await service.close();
  });

  it("D2891 re-executes loose-piece detection while reconstructing outcomes", () => {
    const body = MODEL_SOURCE.slice(MODEL_SOURCE.indexOf("function currentOutcomes"), MODEL_SOURCE.indexOf("function terminal"));
    expect(body).toContain("loosePieceEvents(beforeFen, input.row.moveUci)");
    expect(body).toContain("for (const prior of input.executionOutcomes)");
    expect(body).not.toContain("prior.result");
  });
});
