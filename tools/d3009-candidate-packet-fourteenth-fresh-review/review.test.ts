import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  compileCandidatePopulation,
  createCandidatePopulationService,
  createCandidatePopulationServiceForTest,
  measureRetainedReceipt,
  type CandidatePopulationServiceLimits,
} from "../d2934-candidate-packet-thirteenth-author-repair/model.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const modelSource = readFileSync(
  new URL("../d2934-candidate-packet-thirteenth-author-repair/model.ts", import.meta.url),
  "utf8",
);
const rfcSource = readFileSync(new URL("../../rfc/shared-candidate-evidence-packet.md", import.meta.url), "utf8");

const limits: CandidatePopulationServiceLimits = Object.freeze({
  maxEntries: 2,
  maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER,
  maxRetainedObjects: Number.MAX_SAFE_INTEGER,
  maxCollectorsPerGroup: 4,
  maxConcurrent: 1,
  maxPending: 1,
  maxQueueWaitMs: 100,
  maxCompileMs: 5_000,
});

describe("D3009-D3016 candidate packet fourteenth fresh review", () => {
  it("D3009 exposes dependency-only event outcomes through a readings-only public receipt", () => {
    const receipt = compileCandidatePopulation({ beforeFen: INITIAL, ruleset: "standard", scope: "readings" });
    const input = receipt.candidateInputs[0];
    if (input === undefined) throw new TypeError("expected a legal candidate");

    expect(input.row.events).toEqual([]);
    expect(Object.keys(input)).toContain("executionOutcomes");
    expect(input.collectorOutcomes.every((outcome) => outcome.collectorId.startsWith("reading."))).toBe(true);
    expect(input.executionOutcomes.some((outcome) => outcome.collectorId === "event.transition")).toBe(true);
    expect(input.executionOutcomes.some((outcome) => outcome.collectorId === "event.tactical")).toBe(true);
  });

  it("D3010 accepts authority-looking and arbitrary product-factory options at runtime", async () => {
    const service = createCandidatePopulationService({
      limits,
      manifest: Object.freeze({ digest: "caller-manifest" }),
      manifestDigest: "caller-digest",
      collector: () => Object.freeze([]),
      extra: true,
    } as unknown as { limits: CandidatePopulationServiceLimits });

    expect(service.stats()).toMatchObject({ cacheEntries: 0, started: 0 });
    await service.close();
  });

  it("D3011 leaves normative prose, the model and collector results on incompatible failure unions", () => {
    const normative = rfcSource.match(/export type CandidatePopulationFailure =([\s\S]*?)export type CandidatePopulationResult/u)?.[1] ?? "";
    const model = modelSource.match(/export type CandidatePopulationFailure =([\s\S]*?)export type CandidatePopulationResult/u)?.[1] ?? "";
    const collectorResult = modelSource.match(/export type CandidateCollectorResult =([\s\S]*?)export interface SealedCandidateCollectorOutcome/u)?.[1] ?? "";
    const normativeCollectorFailure = normative.split("\n").find((line) => line.includes('code: "collector_failed"')) ?? "";

    expect(normative).not.toContain("invalid_request");
    expect(normative).toContain('collector_failed"; readonly moveUci: string; readonly projection:');
    expect(normativeCollectorFailure).not.toContain("collectorId");
    expect(model).toContain('collector_failed"; moveUci: string; collectorId: string');
    expect(model).toContain('collector_failed"; moveUci: string; projection: string');
    expect(collectorResult).toContain('kind: "failed"');
  });

  it("D3012 has no independent plan/result, row/value or converse-abstention receipt checks", () => {
    const assertion = modelSource.match(/export function assertCandidatePopulationReceipt[\s\S]*?\n\}\n\nexport function crossedReceiptForTest/u)?.[0] ?? "";
    const crossingHelper = modelSource.match(/export function crossedReceiptForTest[\s\S]*?\n\}\n\nexport function compileCandidatePopulation/u)?.[0] ?? "";

    expect(assertion).not.toContain("planCandidateCollectors(receipt.packet.scope)");
    expect(assertion).not.toContain("executionOutcomes.length");
    expect(assertion).not.toContain("collectorOutcomes.length");
    expect(assertion).not.toContain("flatMap((outcome)");
    expect(crossingHelper).not.toContain('"outcome"');
    expect(crossingHelper).not.toContain('"abstention"');
  });

  it("D3013 reports totals without the required private reference graph or category closure", () => {
    const receipt = compileCandidatePopulation({ beforeFen: INITIAL, ruleset: "standard", scope: "events" });
    const measurement = measureRetainedReceipt(receipt);

    expect(Object.keys(measurement).sort()).toEqual(["logicalUtf8Bytes", "uniqueObjects"]);
    expect(modelSource).toContain("const RECEIPTS = new WeakSet<object>();");
    expect(modelSource).not.toContain("CandidatePopulationRetainedCategory");
    expect(modelSource).not.toContain("categoryCounts");
    expect(modelSource).not.toContain("new WeakMap<CandidatePopulationReceipt");
  });

  it("D3015 cannot inject a collector failure through the named test boundary", async () => {
    let collectorCalls = 0;
    const service = createCandidatePopulationServiceForTest({
      limits,
      collector: () => {
        collectorCalls += 1;
        throw new TypeError("injected collector failure");
      },
    } as unknown as Parameters<typeof createCandidatePopulationServiceForTest>[0]);

    const result = await service.get(
      { beforeFen: INITIAL, ruleset: "standard", scope: "events" },
      new AbortController().signal,
    );
    expect(result).toMatchObject({ kind: "ready" });
    expect(collectorCalls).toBe(0);
    await service.close();
  });

  it("D3016 publishes eighteen stats fields while the normative interface remains sixteen", () => {
    const service = createCandidatePopulationService({ limits });
    const stats = service.stats();
    const normative = rfcSource.match(/export interface CandidatePopulationServiceStats \{([\s\S]*?)\n\}/u)?.[1] ?? "";

    expect(Object.keys(stats)).toHaveLength(18);
    expect(stats).toHaveProperty("sharedLogicalBytes");
    expect(stats).toHaveProperty("sharedObjects");
    expect(normative).not.toContain("sharedLogicalBytes");
    expect(normative).not.toContain("sharedObjects");
  });
});
