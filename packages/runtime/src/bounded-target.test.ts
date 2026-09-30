// rfc/bounded-policy-targets.md — acceptance criteria for the local bounded-target layer.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  BOUNDED_TARGET_DEFAULT_LIMITS,
  RUNTIME_EVIDENCE_PRODUCER_OPERATIONS,
  assertBoundedTargetBatchResult,
  assertBoundedTargetReturnEvidence,
  assertNamedMaterialTargetEvidence,
  boundedTargetRequestIdentity,
  createBoundedTargetBackgroundService,
  createBoundedTargetBackgroundServiceForTest,
  type BoundedTargetBatchCompleted,
  type BoundedTargetBatchRequest,
  type BoundedTargetBatchResult,
} from "./bounded-target.js";
import { createBoundedTargetBatchCounter, createBoundedTargetTraversalAuthority, isBoundedTargetTraversalAuthority } from "./bounded-target-chess.js";
import { checkedEvidenceProducer, EVIDENCE_PRODUCERS, PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { declareEvidence, evidenceValueReceipt, identitySealedEvidenceWithoutValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { boundedTargetSourceEvidence } from "./evidence-operations.js";
import { assertEvidenceProducerOperations, evidenceProducerOperation } from "./evidence-producer-operations.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { assertThreatPassAnchor, threatPassAnchor, threats } from "./tactics.js";
import { threatEvidencePassAnchor } from "./threat-pass-authority.js";

const ROOT = resolve(import.meta.dirname, "../../..");
// Bb4 threatens the loose Ne7; Na6xb4 captures the attacker, c6-c5 blocks, Rh6-h7 defends.
const MIXED = "8/4n3/n1p4r/7k/1B6/8/8/4K3 b - - 0 1";
// Bc2 threatens the loose Na4; the first canonical candidate (a4b2) removes it with a rich tree.
const KNIGHT = "8/8/8/7k/n7/8/2B5/4K3 b - - 0 1";
const request = (fen: string): BoundedTargetBatchRequest => ({ kind: "source_position_batch", ...boundedTargetSourceEvidence(fen) });
const signal = () => new AbortController().signal;
const completed = (result: BoundedTargetBatchResult): BoundedTargetBatchCompleted => {
  if (result.kind !== "completed") throw new Error(`expected completed, got ${result.kind}/${"reason" in result ? result.reason : ""}`);
  return result;
};
const after = (fen: string, uci: string): string => {
  const position = positionFromFen(fen);
  position.play(normalizeMove(position, parseUci(uci)!));
  return canonicalFen(position);
};

describe("threat pass anchor and source authority (§1, criteria 3, 23, 30)", () => {
  it("derives one sealed pass anchor; checked sources are the closed unavailable arm", () => {
    const pass = threatPassAnchor(MIXED);
    expect(pass.kind).toBe("available");
    if (pass.kind !== "available") return;
    expect(pass.anchor).toEqual({ conventionId: "threat@1", sourceFen: canonicalFen(positionFromFen(MIXED)), passedFen: "8/4n3/n1p4r/7k/1B6/8/8/4K3 w - - 0 1" });
    expect(() => assertThreatPassAnchor(pass.anchor)).not.toThrow();
    for (const forged of [{ ...pass.anchor }, JSON.parse(JSON.stringify(pass.anchor)), { ...pass.anchor, conventionId: "threat@2" }]) expect(() => assertThreatPassAnchor(forged)).toThrow();
    expect(threatPassAnchor("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1")).toMatchObject({ kind: "unavailable", reason: "pass_while_in_check" });
    // threats() consumes the same transform: every exchange is computed on the passed position.
    const reading = threats(MIXED);
    expect(reading.kind === "threats" && reading.threats.every((row) => row.exchange === undefined || canonicalFen(positionFromFen(row.exchange.beforeFen)) === pass.anchor.passedFen)).toBe(true);
  });

  it("binds the anchor only to the sole threat factory's exact wrapper", () => {
    const threat = invokeEvidenceValueRoute("rules.tactic.consequence.threat@1", { fen: MIXED }) as DeclaredEvidence<ReturnType<typeof threats>>;
    expect(evidenceValueReceipt(threat).factory).toBe("createRulesTacticConsequenceThreatV1Evidence");
    expect(threatEvidencePassAnchor(threat as never).kind).toBe("available");
    const foreign = declareEvidence(threat.producer, threat.projection, threat.payload, { factory: "test:foreign", inputDigest: "0".repeat(64), sourceDigests: [] });
    expect(() => threatEvidencePassAnchor(foreign as never)).toThrow(/no source pass anchor/u);
    expect(() => threatEvidencePassAnchor({ ...threat } as never)).toThrow();
  });
});

describe("named target, immediate and bounded return (§2, criteria 3–7)", () => {
  it("joins exactly the threat, exchange and source map; crossed sources refuse", () => {
    const source = boundedTargetSourceEvidence(MIXED);
    expect(source.exchanges).toHaveLength(1);
    const named = invokeEvidenceValueRoute("derived.bounded_target.named_material_target@1", { threat: source.threat, exchange: source.exchanges[0]!, sourcePosition: source.sourcePosition }) as { kind: string; item: DeclaredEvidence<{ attacker: unknown; victim: unknown; captureUci: string }> };
    expect(named.kind).toBe("evidence");
    expect(named.item.payload).toMatchObject({ attacker: { color: "white", role: "bishop", square: "b4" }, victim: { color: "black", role: "knight", square: "e7" }, captureUci: "b4e7" });
    expect(() => assertNamedMaterialTargetEvidence(named.item)).not.toThrow();
    expect(evidenceValueReceipt(named.item).sourceDigests).toEqual([source.threat, source.exchanges[0]!, source.sourcePosition].map((item) => evidenceValueReceipt(item).payloadDigest));
    // A legal-move map of another position.
    const other = boundedTargetSourceEvidence(KNIGHT);
    expect(invokeEvidenceValueRoute("derived.bounded_target.named_material_target@1", { threat: source.threat, exchange: source.exchanges[0]!, sourcePosition: other.sourcePosition })).toMatchObject({ kind: "abstained", reason: "position_mismatch" });
    // An exchange from another target/position.
    expect(invokeEvidenceValueRoute("derived.bounded_target.named_material_target@1", { threat: source.threat, exchange: other.exchanges[0]!, sourcePosition: source.sourcePosition })).toMatchObject({ kind: "abstained", reason: "position_mismatch" });
    // A generic same-id wrapper is not the factory's value.
    const forged = declareEvidence(named.item.producer, named.item.projection, named.item.payload, { factory: "test:forged", inputDigest: "0".repeat(64), sourceDigests: [] });
    expect(() => assertNamedMaterialTargetEvidence(forged)).toThrow();
    expect(() => assertNamedMaterialTargetEvidence(identitySealedEvidenceWithoutValueReceipt(named.item.producer, named.item.projection, named.item.payload))).toThrow();
  });

  it("[5][6] correlates every immediate cause with its post-candidate exchange evaluation", async () => {
    const result = completed(await createBoundedTargetBackgroundService().submit(request(MIXED), signal()));
    expect(() => assertBoundedTargetBatchResult(result)).not.toThrow();
    const rows = new Map(result.targets[0]!.candidates.map((candidate) => [candidate.kind === "abstained" ? candidate.candidateUci : candidate.immediate.payload.candidateUci, candidate]));
    const outcome = (uci: string) => { const row = rows.get(uci)!; return row.kind === "abstained" ? row : row.immediate.payload.outcome; };
    expect(outcome("a6b4")).toEqual({ result: "removed", cause: "attacker_captured", postCandidateExchange: null });
    expect(outcome("c6c5")).toEqual({ result: "removed", cause: "capture_illegal", postCandidateExchange: null });
    expect(outcome("h6h7")).toEqual({ result: "removed", cause: "exchange_neutralized", postCandidateExchange: { convention: "legal-exchange-for-move@1", captureUci: "b4e7", resultUnits: 0, result: "non_positive" } });
    expect(outcome("e7g6")).toMatchObject({ result: "removed", cause: "target_moved" });
    expect(outcome("h5g5")).toEqual({ result: "preserved", cause: "preserved", postCandidateExchange: { convention: "legal-exchange-for-move@1", captureUci: "b4e7", resultUnits: 3, result: "positive" } });
    // A preserved arm carries no return; a removed arm carries a return or its budget abstention.
    for (const row of rows.values()) {
      if (row.kind === "preserved") expect("boundedReturn" in row).toBe(false);
      if (row.kind === "removed") expect(["evidence", "abstained"]).toContain(row.boundedReturn.kind);
    }
  });

  it("[7] seals a total return quantifier whose witness and refutation replay legally", async () => {
    const result = completed(await createBoundedTargetBackgroundService().submit(request(KNIGHT), signal()));
    let seen = 0;
    for (const derivation of result.targets) for (const candidate of derivation.candidates) {
      if (candidate.kind !== "removed" || candidate.boundedReturn.kind !== "evidence") continue;
      const item = candidate.boundedReturn.item;
      assertBoundedTargetReturnEvidence(item);
      const outcome = item.payload.outcome;
      const lines = outcome.kind === "not_reintroduced" ? (outcome.firstRefutation === null ? [] : [outcome.firstRefutation]) : outcome.kind === "reintroduced" ? [outcome.witness, outcome.firstRefutation] : [outcome.witness];
      for (const line of lines) {
        let fen = derivation.target.payload.passAnchor.sourceFen;
        for (const move of line.slice(0, 3)) fen = after(fen, move);
        if (line.length === 4) expect(positionFromFen(fen).isLegal(normalizeMove(positionFromFen(fen), parseUci(line[3]!)!))).toBe(true);
      }
      if (outcome.kind === "reintroduced") expect(outcome.firstRefutation[1]).toBe(outcome.witness[1]);
      seen += 1;
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe("the background service protocol (§4, criteria 8, 11, 15–22, 31–34)", () => {
  it("[34] returns the pre-identity rejected arm for malformed input and never throws", async () => {
    const service = createBoundedTargetBackgroundService();
    const valid = request(MIXED);
    const foreign = declareEvidence(valid.threat.producer, valid.threat.projection, valid.threat.payload, { factory: "test:foreign", inputDigest: "0".repeat(64), sourceDigests: [] });
    for (const bad of [null, {}, { ...valid, extra: 1 }, { ...valid, kind: "one_target" }, { ...valid, threat: foreign }, { ...valid, exchanges: [valid.threat] }, { ...valid, sourcePosition: valid.threat }]) {
      await expect(service.submit(bad as never, signal())).resolves.toEqual({ kind: "rejected", reason: "invalid_request" });
    }
    await expect(service.submit(valid, "not a signal" as never)).resolves.toEqual({ kind: "rejected", reason: "invalid_request" });
    expect(() => assertBoundedTargetBatchResult({ kind: "rejected", reason: "invalid_request", identity: {} })).toThrow();
  });

  it("[4] requires the complete positive exchange set; missing, duplicate and foreign exchanges abstain", async () => {
    const service = createBoundedTargetBackgroundService();
    const valid = request(MIXED);
    expect(await service.submit({ ...valid, exchanges: [] }, signal())).toMatchObject({ kind: "abstained", reason: "exchange_set_mismatch" });
    expect(await service.submit({ ...valid, exchanges: [valid.exchanges[0]!, valid.exchanges[0]!] }, signal())).toMatchObject({ kind: "abstained", reason: "exchange_set_mismatch" });
    expect(await service.submit({ ...valid, exchanges: request(KNIGHT).exchanges }, signal())).toMatchObject({ kind: "abstained", reason: "exchange_set_mismatch" });
    expect(await service.submit({ ...valid, sourcePosition: request(KNIGHT).sourcePosition }, signal())).toMatchObject({ kind: "abstained", reason: "position_mismatch" });
    const checked = request("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1");
    expect(await service.submit(checked, signal())).toMatchObject({ kind: "abstained", reason: "input_abstained" });
  });

  it("[15] refuses more than the pair ceiling before any work and the ninth queued job", async () => {
    expect(await createBoundedTargetBackgroundService({ limits: { maxPairs: 1 } }).submit(request(MIXED), signal())).toMatchObject({ kind: "abstained", reason: "multiplication_limit", visitedPositions: 0 });
    const service = createBoundedTargetBackgroundService({ limits: { maxQueued: 0 } });
    const first = service.submit(request(KNIGHT), signal());
    const second = await service.submit(request(MIXED), signal());
    expect(second).toMatchObject({ kind: "abstained", reason: "queue_full" });
    expect((await first).kind).toBe("completed");
  });

  it("[8][18] stops a candidate at its local cap and the whole job at its aggregate cap", async () => {
    const local = completed(await createBoundedTargetBackgroundService({ limits: { maxVisitedPositions: 10 } }).submit(request(KNIGHT), signal()));
    const exhausted = local.targets.flatMap((target) => target.candidates).filter((candidate) => candidate.kind === "removed" && candidate.boundedReturn.kind === "abstained");
    expect(exhausted.length).toBeGreaterThan(0);
    for (const candidate of exhausted) if (candidate.kind === "removed" && candidate.boundedReturn.kind === "abstained") expect(candidate.boundedReturn).toMatchObject({ reason: "budget_exhausted", visitedPositions: 10 });
    const batch = await createBoundedTargetBackgroundService({ limits: { maxBatchVisitedPositions: 30 } }).submit(request(KNIGHT), signal());
    expect(batch).toMatchObject({ kind: "abstained", reason: "batch_budget_exhausted", visitedPositions: 30 });
    expect("targets" in batch).toBe(false);
    // The completed aggregate is the exact sum of candidate-local counts.
    const full = completed(await createBoundedTargetBackgroundService().submit(request(KNIGHT), signal()));
    const sum = full.targets.flatMap((target) => target.candidates).reduce((total, candidate) => total + (candidate.kind === "removed" && candidate.boundedReturn.kind === "evidence" ? candidate.boundedReturn.item.payload.visitedPositions : 1), 0);
    expect(full.visitedPositions).toBe(sum);
  });

  it("[16][32] shares one execution between exact-authority waiters; byte-equal independent wrappers start new jobs", async () => {
    const service = createBoundedTargetBackgroundService();
    const base = request(MIXED);
    const [left, right] = await Promise.all([service.submit(base, signal()), service.submit({ ...base, exchanges: [...base.exchanges].reverse() }, signal())]);
    expect(left).toBe(right);
    const independent = await service.submit(request(MIXED), signal());
    expect(independent).not.toBe(left);
    expect(completed(independent).identity.requestDigest).toBe(completed(left).identity.requestDigest);
    // A post-settlement identical request starts new work rather than reading an undeclared cache.
    expect(await service.submit(base, signal())).not.toBe(left);
  });

  it("[16][19] settles only the aborting waiter; a real setTimeout abort interrupts the first 64-node chunk", async () => {
    const service = createBoundedTargetBackgroundService();
    const base = request(KNIGHT);
    const controller = new AbortController();
    const aborted = service.submit(base, controller.signal);
    const kept = service.submit(base, signal());
    controller.abort();
    expect(await aborted).toMatchObject({ kind: "cancelled", reason: "caller_aborted" });
    expect((await kept).kind).toBe("completed");
    // A real independently scheduled timer abort is observed at the next yield boundary.
    const timed = new AbortController();
    setTimeout(() => timed.abort(), 0);
    const interrupted = await createBoundedTargetBackgroundService().submit(request(KNIGHT), timed.signal);
    expect(interrupted).toMatchObject({ kind: "cancelled", reason: "caller_aborted" });
    expect("targets" in interrupted).toBe(false);
    // Deterministically: an abort that lands during the first yield stops the job at exactly 64.
    const first = new AbortController();
    let yields = 0;
    const exact64 = await createBoundedTargetBackgroundServiceForTest(undefined, { yieldNow: async () => { yields += 1; if (yields === 1) first.abort(); await new Promise<void>((done) => setTimeout(done, 0)); } }).submit(request(KNIGHT), first.signal);
    expect(exact64).toMatchObject({ kind: "cancelled", reason: "caller_aborted", visitedPositions: 64 });
    expect(await createBoundedTargetBackgroundService().submit(base, AbortSignal.abort())).toMatchObject({ kind: "cancelled", reason: "caller_aborted", visitedPositions: 0 });
  });

  it("[18] returns every failed arm with no partial evidence and leaves the service reusable", async () => {
    const yieldFailure = await createBoundedTargetBackgroundServiceForTest(undefined, { yieldNow: () => Promise.reject(new Error("no loop")) }).submit(request(KNIGHT), signal());
    expect(yieldFailure).toMatchObject({ kind: "failed", reason: "yield_failed" });
    for (const [stage, reason] of [["traversal", "traversal_failed"], ["seal", "seal_failed"], ["invariant", "invariant_failed"]] as const) {
      const service = createBoundedTargetBackgroundServiceForTest(undefined, { fault: (at, index) => { if (at === stage && index === 2) throw new Error(`injected ${stage}`); } });
      const failed = await service.submit(request(MIXED), signal());
      expect(failed).toMatchObject({ kind: "failed", reason });
      expect("targets" in failed).toBe(false);
      expect(() => assertBoundedTargetBatchResult(failed)).not.toThrow();
    }
  });

  it("[21] closes idempotently: queued and active waiters settle once and later submissions are service_closed", async () => {
    const service = createBoundedTargetBackgroundService();
    const active = service.submit(request(KNIGHT), signal());
    const queued = service.submit(request(MIXED), signal());
    const first = service.close();
    expect(service.close()).toBe(first);
    expect(await queued).toMatchObject({ kind: "cancelled", reason: "service_closed", visitedPositions: 0 });
    expect(await active).toMatchObject({ kind: "cancelled", reason: "service_closed" });
    await first;
    expect(await service.submit(request(MIXED), signal())).toMatchObject({ kind: "cancelled", reason: "service_closed", visitedPositions: 0 });
  });

  it("[17][22][33] binds the imported primary manifest into request identity and recomputes result digests", async () => {
    const result = completed(await createBoundedTargetBackgroundService().submit(request(MIXED), signal()));
    expect(result.identity.manifestDigest).toBe(PRIMARY_EVIDENCE_MANIFEST.digest);
    const reordered = boundedTargetRequestIdentity({ ...result.identity.inputs, exchanges: [...result.identity.inputs.exchanges].reverse() });
    expect(reordered.requestDigest).toBe(result.identity.requestDigest);
    expect(boundedTargetRequestIdentity({ ...result.identity.inputs, threat: "0".repeat(64) }).requestDigest).not.toBe(result.identity.requestDigest);
    expect(() => assertBoundedTargetBatchResult(result)).not.toThrow();
    expect(() => assertBoundedTargetBatchResult({ ...result, visitedPositions: result.visitedPositions + 1 })).toThrow(/digest/u);
    expect(() => assertBoundedTargetBatchResult({ ...result, identity: { ...result.identity, resultDigest: "0".repeat(64) } })).toThrow(/digest/u);
    expect(() => assertBoundedTargetBatchResult({ ...result, extra: true })).toThrow();
    expect(() => createBoundedTargetBackgroundService({ limits: { maxPairs: 513 } })).toThrow(RangeError);
    expect(() => createBoundedTargetBackgroundService({ limits: { maxActive: 2 } })).toThrow(RangeError);
    expect(() => createBoundedTargetBackgroundService({ manifest: PRIMARY_EVIDENCE_MANIFEST } as never)).toThrow(TypeError);
    expect(() => createBoundedTargetBackgroundService({ limits: { scheduler: 1 } } as never)).toThrow(TypeError);
    expect(BOUNDED_TARGET_DEFAULT_LIMITS).toEqual({ maxActive: 1, maxQueued: 8, maxPairs: 512, maxVisitedPositions: 25_000, maxBatchVisitedPositions: 100_000, yieldEveryVisited: 64 });
  });

  it("[24] mints only through the sealed route with a service-created traversal authority", async () => {
    const source = boundedTargetSourceEvidence(KNIGHT);
    const named = (invokeEvidenceValueRoute("derived.bounded_target.named_material_target@1", { threat: source.threat, exchange: source.exchanges[0]!, sourcePosition: source.sourcePosition }) as { item: DeclaredEvidence<unknown> }).item;
    const candidate = source.sourcePosition.payload.pieces.flatMap((entry) => entry.moves).find((move) => move.uci === "a4b2")!;
    const immediate = (invokeEvidenceValueRoute("derived.bounded_target.immediate@1", { target: named as never, candidate }) as { item: DeclaredEvidence<unknown> }).item;
    expect(() => invokeEvidenceValueRoute("derived.bounded_target.bounded_return@1", { immediate: immediate as never, traversal: { signal: signal(), candidateLimit: 99_999 } as never })).toThrow(/traversal authority/u);
    expect(() => invokeEvidenceValueRoute("derived.bounded_target.immediate@1", { target: named as never, candidate, afterFen: "x" } as never)).toThrow();
    const traversal = createBoundedTargetTraversalAuthority({ requestDigest: "test", signal: signal(), candidateLimit: 25_000, yieldEvery: 64, batchCounter: createBoundedTargetBatchCounter(100_000), yieldNow: async () => undefined });
    expect(isBoundedTargetTraversalAuthority(traversal)).toBe(true);
    expect(isBoundedTargetTraversalAuthority({ ...traversal })).toBe(false);
    const derived = await invokeEvidenceValueRoute("derived.bounded_target.bounded_return@1", { immediate: immediate as never, traversal });
    expect(derived.kind).toBe("evidence");
    expect(() => createBoundedTargetTraversalAuthority({ ...traversal, batchCounter: { maxVisitedPositions: 1, current: () => 0, claimPosition: () => "claimed" as const } })).toThrow(/service-created batch counter/u);
  });
});

describe("F1 declaration image and producer authority (§§3, 4.2, criteria 2, 11, 12, 25, 28)", () => {
  it("[2] makes latency explicit; every legacy producer keeps its derived latency; illegal pairs throw", () => {
    const legacy = (availability: string) => availability === "provider" ? "interactive" : availability === "build_time" ? "offline" : "sync";
    for (const producer of EVIDENCE_PRODUCERS) {
      if (producer.id === "derived.bounded_target") expect([producer.availability, producer.latency]).toEqual(["local", "background"]);
      else expect(producer.latency, producer.id).toBe(legacy(producer.availability));
    }
    for (const [availability, latency] of [["local", "interactive"], ["recorded", "background"], ["provider", "sync"], ["build_time", "sync"]] as const) {
      expect(() => checkedEvidenceProducer("x", "derived", "x.ts", availability, latency, [])).toThrow(/illegal availability\/latency/u);
    }
  });

  it("[2][12] compiles exactly the three literal projections, all inspector-only with no binding", () => {
    const rows = PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => projection.producer.id === "derived.bounded_target");
    expect(rows.map((row) => `${row.id}@${row.version}:${row.role}`).sort()).toEqual([
      "derived.bounded_target.bounded_return@1:reading", "derived.bounded_target.immediate@1:event", "derived.bounded_target.named_material_target@1:reading",
    ]);
    for (const row of rows) {
      expect(row).toMatchObject({ grounding: "declared_convention", exactness: "convention", confidence: "exact", disposition: { kind: "inspector_only" } });
      expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some((binding) => binding.projection.id === row.id)).toBe(false);
    }
  });

  it("[11] registers the concrete service submit as the one background producer operation", () => {
    expect(() => assertEvidenceProducerOperations(PRIMARY_EVIDENCE_MANIFEST.producers, RUNTIME_EVIDENCE_PRODUCER_OPERATIONS)).not.toThrow();
    expect(() => assertEvidenceProducerOperations(PRIMARY_EVIDENCE_MANIFEST.producers, [])).toThrow(/set-equal/u);
    expect(() => assertEvidenceProducerOperations(PRIMARY_EVIDENCE_MANIFEST.producers, [evidenceProducerOperation("derived.bounded_target", "BoundedTargetBackgroundService.close", () => undefined)])).toThrow();
    expect(() => assertEvidenceProducerOperations(PRIMARY_EVIDENCE_MANIFEST.producers, [...RUNTIME_EVIDENCE_PRODUCER_OPERATIONS, evidenceProducerOperation("rules.tactic", "threats", threats)])).toThrow();
  });

  it("[25][28] exports the protocol from the barrel and keeps mint, traversal and test authorities private", () => {
    const barrel = readFileSync(resolve(ROOT, "packages/runtime/src/index.ts"), "utf8");
    for (const name of ["BoundedTargetBackgroundService", "createBoundedTargetBackgroundService", "assertBoundedTargetBatchResult", "type BoundedTargetBatchResult", "type CandidateDerivation", "type ReturnDerivation", "type BoundedTargetServiceLimits"]) expect(barrel).toContain(name);
    for (const name of ["createBoundedTargetBackgroundServiceForTest", "createBoundedTargetTraversalAuthority", "createBoundedTargetBatchCounter", "createDerivedBoundedTarget", "invokeEvidenceValueRoute"]) expect(barrel).not.toContain(name);
    // The service reaches factories only through the central invoker; no product module calls the traversal helpers.
    const service = readFileSync(resolve(ROOT, "packages/runtime/src/bounded-target.ts"), "utf8");
    expect(service).not.toMatch(/\b(createDerivedBoundedTarget\w+|computeBoundedReturn|computeImmediate|computeNamedMaterialTarget)\s*\(/u);
    const factoryImports = [...service.matchAll(/import\s+(type\s+)?\{[^}]*\}\s+from\s+"\.\/evidence-factories\.js"/gu)];
    expect(factoryImports.length).toBeGreaterThan(0);
    expect(factoryImports.every((match) => match[1] !== undefined)).toBe(true);
  });
});
