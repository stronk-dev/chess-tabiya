// rfc/bounded-target-policy-composition.md — acceptance criteria for the composed policy readings.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PRIMARY_EVIDENCE_MANIFEST,
  assertPathEffectiveExecution,
  compileEvidenceManifest,
  createBoundedTargetBackgroundService,
  effectiveEvidenceExecution,
  EVIDENCE_CONTRACT_DECLARATIONS,
  type BoundedTargetPolicyBounds,
  type EngineTargetPolicyReading,
} from "@chess-tabiya/runtime";

import { BoundedTargetPolicyCompositionOperation, type BoundedTargetPolicyCompositionDependencies, type BoundedTargetPolicyRequest, type BoundedTargetPolicyResult } from "./bounded-target-policy.js";
import { MockProviderEngineClient, type MockProviderEngineOptions } from "./mock-provider-engine.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { providerOperationDescriptors } from "./provider-operations.js";

const ROOT = resolve(import.meta.dirname, "../../..");
// Bc2 attacks the loose Na4 (black to move). h5g5 leaves it (preserved); a4b2 moves it away (removed).
const SOURCE = "8/8/8/7k/n7/8/2B5/4K3 b - - 0 1";
const base = (overrides: Partial<BoundedTargetPolicyRequest> = {}): BoundedTargetPolicyRequest => {
  const value: Record<string, unknown> = { sourceFen: SOURCE, captureUci: "c2a4", candidateUci: "h5g5", counterfactualUci: "a4b2", arms: "both", band: 1500, ...overrides };
  if (value.arms === "stockfish") delete value.band;
  return value as unknown as BoundedTargetPolicyRequest;
};

function compose(options: MockProviderEngineOptions = {}, bounds: { readonly maxQueued?: number; readonly requestedEngine?: BoundedTargetPolicyCompositionDependencies["requestedEngine"] } = {}) {
  const engines = new MockProviderEngineClient(options);
  const scheduler = new ProviderExchangeScheduler({
    descriptors: providerOperationDescriptors({ engines, tablebaseFetch: null, explorerFetch: null, explorerToken: null }),
    maxActive: 1, maxQueued: bounds.maxQueued ?? 16, maxRetainedEntries: 64, maxRetainedWeight: 4_096, retentionTtlMs: 600_000,
    monotonicNowMs: () => performance.now(), wallNow: () => new Date().toISOString(),
  });
  const operation = new BoundedTargetPolicyCompositionOperation({
    targets: createBoundedTargetBackgroundService(),
    scheduler,
    requestedEngine: bounds.requestedEngine ?? (async () => { const identity = await engines.start("stockfish-analysis"); return { id: identity.id, version: identity.version }; }),
    providerTimeoutMs: 20_000,
  });
  return { operation, scheduler };
}

const scope = { id: "test:bounded-target-policy", budgetMs: 60_000 };
const run = (operation: BoundedTargetPolicyCompositionOperation, request: BoundedTargetPolicyRequest, signal = new AbortController().signal) => operation.evaluate(request, scope, signal);
const completed = (result: BoundedTargetPolicyResult) => {
  if (result.kind !== "completed") throw new Error(`refused: ${result.reason}`);
  return result;
};
const engineReading = (result: BoundedTargetPolicyResult): EngineTargetPolicyReading => {
  const value = completed(result).stockfish;
  if (value?.kind !== "evidence") throw new Error(`engine arm: ${value?.kind} ${value?.kind === "abstained" ? value.reason : ""}`);
  return value.item.payload;
};
const maiaReading = (result: BoundedTargetPolicyResult): BoundedTargetPolicyBounds => {
  const value = completed(result).maia;
  if (value?.kind !== "evidence") throw new Error(`maia arm: ${value?.kind} ${value?.kind === "abstained" ? value.reason : ""}`);
  return value.item.payload;
};

describe("F1 declarations (criterion 1)", () => {
  it("compiles both reported, inspector-only rows whose paths are provider-bearing", () => {
    for (const id of ["derived.bounded_target.engine_target_policy", "derived.bounded_target.policy_bounds"]) {
      const row = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.id === id)!;
      expect(row).toMatchObject({ confidence: "reported", grounding: "declared_convention", disposition: { kind: "inspector_only" } });
      expect(PRIMARY_EVIDENCE_MANIFEST.producers.find((producer) => producer.id === row.producer.id)).toMatchObject({ availability: "local", latency: "sync" });
      expect(effectiveEvidenceExecution(PRIMARY_EVIDENCE_MANIFEST, row)).toMatchObject({ availability: "provider", latency: "interactive" });
    }
    // reported → exact widening fails.
    const widened = EVIDENCE_CONTRACT_DECLARATIONS.producers.map((producer) => producer.id !== "derived.bounded_target_policy" ? producer : { ...producer, outputs: producer.outputs.map((output) => ({ ...output, confidence: "exact" as const })) });
    expect(() => compileEvidenceManifest({ ...EVIDENCE_CONTRACT_DECLARATIONS, producers: widened })).toThrowError(expect.objectContaining({ code: "EVIDENCE_DERIVATION_WIDENS" }));
    // A sync consumer binding of the provider-bearing path is refused.
    const fake = { ...PRIMARY_EVIDENCE_MANIFEST, bindings: [...PRIMARY_EVIDENCE_MANIFEST.bindings, { ...PRIMARY_EVIDENCE_MANIFEST.bindings[0]!, projection: { id: "derived.bounded_target.engine_target_policy", version: 1 }, latency: { mode: "sync" as const, maxMs: 10 } }] };
    expect(() => assertPathEffectiveExecution(fake, [{ id: "derived.bounded_target.engine_target_policy", version: 1 }])).toThrow(/sync satisfaction/u);
    expect(() => assertPathEffectiveExecution(PRIMARY_EVIDENCE_MANIFEST, [{ id: "derived.bounded_target.engine_target_policy", version: 1 }])).not.toThrow();
  });
});

describe("Stockfish depth-stable category (§2, criteria 2–4)", () => {
  it("reports next execution when both depths select the exact target capture", async () => {
    const { operation } = compose({ rootScore: (_fen, move) => move === "c2a4" ? "cp 300" : "cp 0" });
    const reading = engineReading(await run(operation, base({ arms: "stockfish" })));
    expect(reading.stableCategory).toEqual({ nextExecution: true, secondOpportunityAvailable: false });
    expect(reading.perDepth.map((row) => [row.depth, row.bestMoveUci])).toEqual([[8, "c2a4"], [10, "c2a4"]]);
    expect(reading.tables.map((table) => table.payload.payload.request.bound.value)).toEqual([8, 10]);
    expect(reading.counterfactualUci).toBe("a4b2");
    // The reading retains the exact target facts and both raw receipts as sealed ancestry.
    const sealed = completed(await run(operation, base({ arms: "stockfish" }))).stockfish;
    if (sealed?.kind !== "evidence") throw new Error("expected evidence");
    expect(sealed.item.payload.tables).toHaveLength(2);
    expect(sealed.item.payload.target).toBe(sealed.item.payload.immediate.payload.target);
    expect(sealed.item.payload.boundedReturn).toBeNull();
  });

  it("derives second-opportunity availability at the opponent's second decision, not execution", async () => {
    // The selected move is a quiet king move; the mock PV replies with the first legal move.
    const { operation } = compose({ rootScore: (_fen, move) => move === "e1d1" ? "cp 50" : "cp 0" });
    const reading = engineReading(await run(operation, base({ arms: "stockfish" })));
    expect(reading.stableCategory.nextExecution).toBe(false);
    expect(typeof reading.stableCategory.secondOpportunityAvailable).toBe("boolean");
    expect(reading.perDepth.every((row) => row.bestMoveUci === "e1d1")).toBe(true);
  });

  it("abstains depth_category_unstable when the depths disagree; never averages or picks a depth", async () => {
    let calls = 0;
    const { operation } = compose({ rootScore: (fen, move) => {
      if (move === "c2a4") calls += 1;
      return move === "c2a4" ? (calls <= 1 ? "cp 300" : "cp -300") : "cp 0";
    } });
    const result = completed(await run(operation, base({ arms: "stockfish" })));
    expect(result.stockfish).toMatchObject({ kind: "abstained", reason: "depth_category_unstable" });
  });

  it("refuses an invalid counterfactual and unknown targets/candidates before any provider call", async () => {
    const { operation } = compose();
    expect(await run(operation, base({ counterfactualUci: "h5g5" }))).toMatchObject({ kind: "refused", reason: "invalid_request" });
    expect(await run(operation, base({ captureUci: "c2b3" }))).toMatchObject({ kind: "refused", reason: "target_not_found" });
    expect(await run(operation, base({ candidateUci: "a1a2" }))).toMatchObject({ kind: "refused", reason: "candidate_not_found" });
    const illegalCounterfactual = completed(await run(operation, base({ counterfactualUci: "a1a8", arms: "stockfish" })));
    expect(illegalCounterfactual.stockfish).toMatchObject({ kind: "abstained", reason: "counterfactual_invalid" });
  });

  it("[10] reports provider unavailability as a typed abstention, never a negative category", async () => {
    const { operation } = compose({ fail: () => true });
    const result = completed(await run(operation, base({ arms: "stockfish" })));
    expect(result.stockfish).toMatchObject({ kind: "abstained", reason: "input_abstained" });
  });
});

describe("Maia one-band bounds (§3, criteria 5–9)", () => {
  it("[6] gives [m, m] when the preserved target's capture is on the page and keeps two separate quantities", async () => {
    const { operation } = compose({ maiaPolicy: (fen, legal) => legal.includes("c2a4") ? [["c2a4", 0.6], ...legal.filter((move) => move !== "c2a4").slice(0, 7).map((move) => [move, 0.05] as const)] : legal.slice(0, 8).map((move) => [move, 0.12] as const) });
    const reading = maiaReading(await run(operation, base({ arms: "maia" })));
    expect(reading.nextExecutionMass).toEqual({ lower: 0.6, upper: 0.6 });
    expect(reading.nextExecutionAbsence).toBeNull();
    expect(reading.secondOpportunityAvailableMass.lower).toBeLessThanOrEqual(reading.secondOpportunityAvailableMass.upper);
    expect(reading).toMatchObject({ appliedBand: 1500, temperature: 0.8, topP: 0.92, keptPerNode: 8, retainedMassFloor: 0.9 });
    expect(reading.expandedSecondNodes).toBe(8);
    expect(reading.pages).toHaveLength(9);
    expect(reading.denominator).toMatchObject({ requestedNodes: 9, admittedNodes: 9, candidateCount: 8, keptCount: 8 });
    expect("sum" in reading || "preventionScore" in reading).toBe(false);
  });

  it("[6] gives [0, missingMass] when the legal target capture is absent from a mass-bearing page", async () => {
    const { operation } = compose({ maiaPolicy: (_fen, legal) => legal.filter((move) => move !== "c2a4").slice(0, 8).map((move, index) => [move, index === 0 ? 0.55 : 0.05] as const) });
    const reading = maiaReading(await run(operation, base({ arms: "maia" })));
    expect(reading.nextExecutionMass.lower).toBe(0);
    expect(reading.nextExecutionMass.upper).toBeCloseTo(1 - 0.9, 6);
  });

  it("[6] gives [0, 0] with the typed absence cause for a removed target", async () => {
    const { operation } = compose();
    const reading = maiaReading(await run(operation, base({ arms: "maia", candidateUci: "a4b2", counterfactualUci: "h5g5" })));
    expect(reading.nextExecutionMass).toEqual({ lower: 0, upper: 0 });
    expect(reading.nextExecutionAbsence).toBe("target_moved");
    expect(reading.boundedReturn).not.toBeNull();
  });

  it("[7] refuses below the 0.90 retained-mass gate and on a mass-less row; no zeroing or renormalizing", async () => {
    const low = compose({ maiaPolicy: (_fen, legal) => legal.slice(0, 8).map((move) => [move, 0.1] as const) });
    expect(completed(await run(low.operation, base({ arms: "maia" }))).maia).toMatchObject({ kind: "abstained", reason: "retained_mass_below_gate" });
    const massless = compose({ maiaPolicy: (_fen, legal) => legal.slice(0, 8).map((move, index) => [move, index === 7 ? 0 : 0.14] as const) });
    expect(completed(await run(massless.operation, base({ arms: "maia" }))).maia).toMatchObject({ kind: "abstained", reason: "massless_candidate" });
    const unavailable = compose({ maiaFail: () => true });
    expect(completed(await run(unavailable.operation, base({ arms: "maia" }))).maia).toMatchObject({ kind: "abstained" });
  });

  it("[5][11] coalesces exact duplicate pages through the shared scheduler; no private cache", async () => {
    const { operation } = compose();
    const [left, right] = await Promise.all([run(operation, base({ arms: "maia" })), run(operation, base({ arms: "maia" }))]);
    const pagesLeft = maiaReading(left).pages.map((page) => page.payload.payloadReceipt.payloadDigest);
    const pagesRight = maiaReading(right).pages.map((page) => page.payload.payloadReceipt.payloadDigest);
    expect(pagesLeft).toEqual(pagesRight);
    const source = readFileSync(resolve(ROOT, "apps/server/src/bounded-target-policy.ts"), "utf8");
    expect(source).not.toMatch(/\bnew (Weak)?(Map|Set)\b/u);
  });
});

describe("the composed operation (§5, criteria 10–12)", () => {
  it.each(["stockfish", "both"] as const)("[10] keeps local facts and successful peers when Stockfish startup rejects (%s)", async (arms) => {
    let tableReads = 0;
    const { operation } = compose({ rootScore: () => { tableReads += 1; return "cp 0"; } }, {
      requestedEngine: async () => { throw new Error("private engine startup failure"); },
    });
    const result = completed(await run(operation, base({ arms })));
    expect(result.local.target.payload.captureUci).toBe("c2a4");
    expect(result.stockfish).toMatchObject({ kind: "abstained", reason: "input_abstained" });
    expect(result.maia?.kind ?? null).toBe(arms === "both" ? "evidence" : null);
    expect(tableReads).toBe(0);
    expect(JSON.stringify(result)).not.toContain("private engine startup failure");
  });

  it("[11] returns cancellation rather than leaking an engine startup exception", async () => {
    const controller = new AbortController();
    const { operation } = compose({}, { requestedEngine: () => {
      controller.abort();
      throw new Error("engine startup rejected during cancellation");
    } });
    expect(await run(operation, base({ arms: "stockfish" }), controller.signal)).toEqual({ kind: "refused", reason: "cancelled" });
  });

  it("[10] executes both arms through the application-composed operation", async () => {
    const { operation } = compose({ rootScore: (_fen, move) => move === "c2a4" ? "cp 300" : "cp 0" });
    const result = completed(await run(operation, base()));
    expect(result.stockfish?.kind).toBe("evidence");
    expect(result.maia?.kind).toBe("evidence");
    const application = readFileSync(resolve(ROOT, "apps/server/src/application.ts"), "utf8");
    expect(application).toMatch(/new BoundedTargetPolicyCompositionOperation\(\{\s*targets: boundedTargets,\s*scheduler: providers\.scheduler/u);
  });

  it("[11] propagates cancellation and drops late results", async () => {
    const { operation } = compose();
    const controller = new AbortController();
    const pending = run(operation, base(), controller.signal);
    controller.abort();
    expect(await pending).toMatchObject({ kind: "refused", reason: "cancelled" });
  });

  it("[12] lands zero learner bindings and no judgement vocabulary", () => {
    for (const id of ["derived.bounded_target.engine_target_policy", "derived.bounded_target.policy_bounds"]) expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => binding.projection.id === id)).toBe(false);
    const sources = ["packages/runtime/src/bounded-target-policy.ts", "apps/server/src/bounded-target-policy.ts"].map((path) => readFileSync(resolve(ROOT, path), "utf8"));
    for (const source of sources) expect(source).not.toMatch(/\b(prophylaxis|blunder|mistake|best move|good move|bad move|intent to)\b/iu);
  });
});
