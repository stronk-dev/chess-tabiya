/**
 * The bounded-target background service (rfc/bounded-policy-targets.md §4).
 *
 * One set-owning request: a sealed threat reading, the complete set of its positive material
 * legal-exchange items and the exact source legal-move map. Admission owns both complete sets,
 * derives every named target and every candidate itself, refuses above 512 pairs, deduplicates
 * authority-exact requests before capacity, and runs one active plus eight queued jobs. Each job
 * yields every 64 visited positions through the shared MessageChannel adapter, counts every
 * materialized position under `bounded-target-visited-positions@1`, stops at 25,000 positions per
 * candidate (typed abstention) and 100,000 per job (whole-job abstention), and publishes evidence
 * only when the whole batch completes. `submit()` never throws.
 */
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import type {
  BoundedTargetImmediateFactoryResult,
  BoundedTargetReturnDerivation,
  NamedMaterialTargetFactoryResult,
} from "./evidence-factories.js";
import { evidenceProducerOperation, type EvidenceProducerOperation } from "./evidence-producer-operations.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { ExactLegalMove } from "./legal-moves.js";
import { messageChannelMacrotaskYield } from "./cooperative-yield.js";
import {
  BoundedTargetBatchExhausted,
  BoundedTargetTraversalAborted,
  BoundedTargetYieldFailed,
  createBoundedTargetBatchCounter,
  createBoundedTargetTraversalAuthority,
  positiveMaterialThreatExchanges,
  type BoundedTargetBatchCounterAuthority,
  type BoundedTargetImmediateEvidence,
  type BoundedTargetReturnEvidence,
  type ImmediateTargetOutcome,
  type LegalExchangeEvidence,
  type NamedMaterialTargetEvidence,
  type SourceLegalMovesEvidence,
  type ThreatEvidence,
} from "./bounded-target-chess.js";
import { threatEvidencePassAnchor } from "./threat-pass-authority.js";

export type {
  BoundedReturnOutcome,
  BoundedTargetImmediate,
  BoundedTargetImmediateEvidence,
  BoundedTargetReturn,
  BoundedTargetReturnEvidence,
  CandidateLine,
  ImmediateTargetOutcome,
  LegalExchangeEvidence,
  NamedMaterialTarget,
  NamedMaterialTargetEvidence,
  ObservedPromotionEdge,
  PostCandidateExchangeEvaluation,
  ProjectionEvidence,
  RefutationLine,
  ReintroductionLine,
  SourceLegalMovesEvidence,
  ThreatEvidence,
  TrackedPieceIdentity,
} from "./bounded-target-chess.js";
export type { BoundedTargetImmediateFactoryResult, NamedMaterialTargetFactoryResult } from "./evidence-factories.js";

// ---------------------------------------------------------------------------------------------
// The closed public protocol (§4)
// ---------------------------------------------------------------------------------------------

export interface BoundedTargetBatchRequest {
  readonly kind: "source_position_batch";
  readonly threat: ThreatEvidence;
  readonly exchanges: readonly LegalExchangeEvidence[];
  readonly sourcePosition: SourceLegalMovesEvidence;
}

export type ReturnDerivation = BoundedTargetReturnDerivation;

export type CandidateDerivation =
  | { readonly kind: "preserved"; readonly immediate: BoundedTargetImmediateEvidence<Extract<ImmediateTargetOutcome, { readonly result: "preserved" }>> }
  | { readonly kind: "removed"; readonly immediate: BoundedTargetImmediateEvidence<Extract<ImmediateTargetOutcome, { readonly result: "removed" }>>; readonly boundedReturn: ReturnDerivation }
  | { readonly kind: "abstained"; readonly projection: { readonly id: "derived.bounded_target.immediate"; readonly version: 1 }; readonly reason: "identity_lost"; readonly candidateUci: string };

export interface TargetDerivation {
  readonly target: NamedMaterialTargetEvidence;
  readonly candidates: readonly CandidateDerivation[];
}

export interface BoundedTargetInputDigests {
  readonly threat: string;
  readonly exchanges: readonly string[];
  readonly sourcePosition: string;
}

export interface BoundedTargetRequestIdentity {
  readonly domain: "tabiya:bounded-target-request@1";
  readonly requestDigest: string;
  readonly manifestDigest: string;
  readonly inputs: BoundedTargetInputDigests;
}

export interface BoundedTargetResultIdentity extends BoundedTargetRequestIdentity {
  readonly resultDomain: "tabiya:bounded-target-result@1";
  readonly resultDigest: string;
}

export interface BoundedTargetBatchCompleted {
  readonly kind: "completed";
  readonly identity: BoundedTargetResultIdentity;
  readonly targets: readonly TargetDerivation[];
  readonly visitedPositions: number;
}

export type BoundedTargetBatchAbstentionReason = "input_abstained" | "position_mismatch" | "target_mismatch" | "exchange_set_mismatch" | "multiplication_limit" | "batch_budget_exhausted" | "queue_full";
export interface BoundedTargetBatchAbstained { readonly kind: "abstained"; readonly identity: BoundedTargetResultIdentity; readonly reason: BoundedTargetBatchAbstentionReason; readonly visitedPositions: number }
export type BoundedTargetBatchCancellationReason = "caller_aborted" | "service_closed";
export interface BoundedTargetBatchCancelled { readonly kind: "cancelled"; readonly identity: BoundedTargetResultIdentity; readonly reason: BoundedTargetBatchCancellationReason; readonly visitedPositions: number }
export type BoundedTargetBatchFailureReason = "yield_failed" | "traversal_failed" | "seal_failed" | "invariant_failed";
export interface BoundedTargetBatchFailed { readonly kind: "failed"; readonly identity: BoundedTargetResultIdentity; readonly reason: BoundedTargetBatchFailureReason; readonly visitedPositions: number }
export type BoundedTargetBatchRejectionReason = "invalid_request";
export interface BoundedTargetBatchRejected { readonly kind: "rejected"; readonly reason: BoundedTargetBatchRejectionReason }

export type BoundedTargetBatchResult = BoundedTargetBatchCompleted | BoundedTargetBatchAbstained | BoundedTargetBatchCancelled | BoundedTargetBatchFailed | BoundedTargetBatchRejected;

export interface BoundedTargetServiceLimits {
  readonly maxActive: number;
  readonly maxQueued: number;
  readonly maxPairs: number;
  readonly maxVisitedPositions: number;
  readonly maxBatchVisitedPositions: number;
  readonly yieldEveryVisited: number;
}

export interface BoundedTargetServiceOptions {
  readonly limits?: Partial<BoundedTargetServiceLimits>;
}

export const BOUNDED_TARGET_DEFAULT_LIMITS: BoundedTargetServiceLimits = Object.freeze({
  maxActive: 1, maxQueued: 8, maxPairs: 512, maxVisitedPositions: 25_000, maxBatchVisitedPositions: 100_000, yieldEveryVisited: 64,
});

const LIMIT_RANGES: Readonly<Record<keyof BoundedTargetServiceLimits, readonly [number, number]>> = Object.freeze({
  maxActive: [1, 1], maxQueued: [0, 8], maxPairs: [1, 512], maxVisitedPositions: [1, 25_000], maxBatchVisitedPositions: [1, 100_000], yieldEveryVisited: [1, 64],
});

const REQUEST_DOMAIN = "tabiya:bounded-target-request@1" as const;
const RESULT_DOMAIN = "tabiya:bounded-target-result@1" as const;
const INPUT_DOMAIN = "tabiya:bounded-target-input@1" as const;
const REJECTED: BoundedTargetBatchRejected = Object.freeze({ kind: "rejected", reason: "invalid_request" });

// ---------------------------------------------------------------------------------------------
// Specialized assertions (§4): exact factory receipt and ancestry
// ---------------------------------------------------------------------------------------------

const FACTORY = Object.freeze({
  named: "createDerivedBoundedTargetNamedMaterialTargetV1Evidence",
  immediate: "createDerivedBoundedTargetImmediateV1Evidence",
  return: "createDerivedBoundedTargetBoundedReturnV1Evidence",
});

function assertRoute(value: unknown, id: string, factory: string, parents: (payload: Record<string, unknown>) => readonly DeclaredEvidence<unknown>[]): asserts value is DeclaredEvidence<Record<string, unknown>> {
  assertDeclaredEvidence(value);
  if (value.projection.id !== id || value.projection.version !== 1) throw new TypeError(`Evidence is ${value.projection.id}@${value.projection.version}, not ${id}@1`);
  const receipt = evidenceValueReceipt(value);
  if (receipt.factory !== factory) throw new TypeError(`${id} was minted by ${receipt.factory}, not ${factory}`);
  const expected = parents(value.payload as Record<string, unknown>).map((parent) => {
    assertDeclaredEvidence(parent);
    return evidenceValueReceipt(parent).payloadDigest;
  });
  if (expected.join("|") !== receipt.sourceDigests.join("|")) throw new TypeError(`${id} ancestry is not its exact sealed inputs`);
}

export function assertNamedMaterialTargetEvidence(value: unknown): asserts value is NamedMaterialTargetEvidence {
  assertRoute(value, "derived.bounded_target.named_material_target", FACTORY.named, (payload) => [payload.threat, payload.exchange, payload.sourcePosition] as DeclaredEvidence<unknown>[]);
  const payload = value.payload as unknown as NamedMaterialTargetEvidence["payload"];
  const pass = threatEvidencePassAnchor(payload.threat);
  if (pass.kind !== "available" || pass.anchor !== payload.passAnchor) throw new TypeError("Named target pass anchor is not the threat's exact source authority");
}

export function assertBoundedTargetImmediateEvidence(value: unknown): asserts value is BoundedTargetImmediateEvidence {
  assertRoute(value, "derived.bounded_target.immediate", FACTORY.immediate, (payload) => [payload.target] as DeclaredEvidence<unknown>[]);
  assertNamedMaterialTargetEvidence((value.payload as { readonly target: unknown }).target);
}

export function assertBoundedTargetReturnEvidence(value: unknown): asserts value is BoundedTargetReturnEvidence {
  assertRoute(value, "derived.bounded_target.bounded_return", FACTORY.return, (payload) => [payload.immediate] as DeclaredEvidence<unknown>[]);
  const payload = value.payload as unknown as BoundedTargetReturnEvidence["payload"];
  assertBoundedTargetImmediateEvidence(payload.immediate);
  if (payload.immediate.payload.outcome.result !== "removed" || payload.horizonPlies !== 3) throw new TypeError("Bounded return needs a removed immediate target and a three-ply horizon");
  const outcome = payload.outcome;
  const line = (value: unknown, length: number): boolean => Array.isArray(value) && value.length === length && value.every((entry) => typeof entry === "string") && value[0] === payload.immediate.payload.candidateUci;
  const valid = outcome.kind === "not_reintroduced" ? outcome.firstRefutation === null || line(outcome.firstRefutation, 3)
    : outcome.kind === "reintroduced" ? line(outcome.witness, 4) && line(outcome.firstRefutation, 3) && outcome.witness[1] === outcome.firstRefutation[1]
      : outcome.kind === "survives_every_defence" ? line(outcome.witness, 4) : false;
  if (!valid) throw new TypeError("Bounded return outcome carries an impossible witness/refutation shape");
}

// ---------------------------------------------------------------------------------------------
// Identity (§4)
// ---------------------------------------------------------------------------------------------

export function boundedTargetInputDigest(item: DeclaredEvidence<unknown>): string {
  return evidenceDigest({ domain: INPUT_DOMAIN, producer: item.producer, projection: item.projection, payload: item.payload });
}

export function boundedTargetRequestIdentity(inputs: BoundedTargetInputDigests): BoundedTargetRequestIdentity {
  const exchanges = [...inputs.exchanges].sort();
  const manifestDigest = PRIMARY_EVIDENCE_MANIFEST.digest;
  const requestDigest = evidenceDigest({ domain: REQUEST_DOMAIN, manifestDigest, kind: "source_position_batch", threat: inputs.threat, exchanges, sourcePosition: inputs.sourcePosition });
  return Object.freeze({ domain: REQUEST_DOMAIN, requestDigest, manifestDigest, inputs: Object.freeze({ threat: inputs.threat, exchanges: Object.freeze(exchanges), sourcePosition: inputs.sourcePosition }) });
}

type Unsealed = Omit<BoundedTargetBatchCompleted, "identity"> | Omit<BoundedTargetBatchAbstained, "identity"> | Omit<BoundedTargetBatchCancelled, "identity"> | Omit<BoundedTargetBatchFailed, "identity">;

function resultDigest(request: BoundedTargetRequestIdentity, result: Unsealed): string {
  return evidenceDigest({ domain: RESULT_DOMAIN, requestDigest: request.requestDigest, result });
}

/** The one checked post-identity result constructor. */
function sealResult<T extends Unsealed>(request: BoundedTargetRequestIdentity, result: T): T & { readonly identity: BoundedTargetResultIdentity } {
  const identity: BoundedTargetResultIdentity = Object.freeze({ ...request, resultDomain: RESULT_DOMAIN, resultDigest: resultDigest(request, result) });
  return Object.freeze({ ...result, identity }) as unknown as T & { readonly identity: BoundedTargetResultIdentity };
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);
const exact = (value: unknown, keys: readonly string[]): boolean => isRecord(value) && Object.keys(value).sort().join(",") === [...keys].sort().join(",");

/** The public result assertion (§4, [[D3045]]): exact arms, recomputed request and result digests. */
export function assertBoundedTargetBatchResult(value: unknown): asserts value is BoundedTargetBatchResult {
  if (!isRecord(value)) throw new TypeError("Bounded-target result must be an object");
  if (value.kind === "rejected") {
    if (!exact(value, ["kind", "reason"]) || value.reason !== "invalid_request") throw new TypeError("Rejected bounded-target result must be exactly { kind, reason: invalid_request }");
    return;
  }
  const identity = value.identity;
  if (!exact(identity, ["domain", "requestDigest", "manifestDigest", "inputs", "resultDomain", "resultDigest"])) throw new TypeError("Bounded-target result identity keys are not exact");
  const id = identity as unknown as BoundedTargetResultIdentity;
  if (id.domain !== REQUEST_DOMAIN || id.resultDomain !== RESULT_DOMAIN || !exact(id.inputs, ["threat", "exchanges", "sourcePosition"])) throw new TypeError("Bounded-target result identity names another domain");
  const rebuilt = boundedTargetRequestIdentity(id.inputs);
  if (rebuilt.requestDigest !== id.requestDigest || rebuilt.manifestDigest !== id.manifestDigest || rebuilt.inputs.exchanges.join("|") !== id.inputs.exchanges.join("|")) throw new TypeError("Bounded-target request digest does not recompute");
  const visited = value.visitedPositions;
  if (!Number.isSafeInteger(visited) || (visited as number) < 0) throw new TypeError("Bounded-target visited count is not a non-negative integer");
  const reasons: Readonly<Record<string, readonly string[]>> = {
    abstained: ["input_abstained", "position_mismatch", "target_mismatch", "exchange_set_mismatch", "multiplication_limit", "batch_budget_exhausted", "queue_full"],
    cancelled: ["caller_aborted", "service_closed"],
    failed: ["yield_failed", "traversal_failed", "seal_failed", "invariant_failed"],
  };
  if (value.kind === "completed") {
    if (!exact(value, ["kind", "identity", "targets", "visitedPositions"]) || !Array.isArray(value.targets)) throw new TypeError("Completed bounded-target result keys are not exact");
    for (const derivation of value.targets as readonly TargetDerivation[]) {
      if (!exact(derivation, ["target", "candidates"])) throw new TypeError("Target derivation keys are not exact");
      assertNamedMaterialTargetEvidence(derivation.target);
      for (const candidate of derivation.candidates) {
        if (candidate.kind === "preserved") {
          assertBoundedTargetImmediateEvidence(candidate.immediate);
          if (candidate.immediate.payload.outcome.result !== "preserved" || candidate.immediate.payload.target !== derivation.target) throw new TypeError("Preserved derivation carries a crossed immediate");
        } else if (candidate.kind === "removed") {
          assertBoundedTargetImmediateEvidence(candidate.immediate);
          if (candidate.immediate.payload.outcome.result !== "removed" || candidate.immediate.payload.target !== derivation.target) throw new TypeError("Removed derivation carries a crossed immediate");
          const ret = candidate.boundedReturn;
          if (ret.kind === "evidence") {
            assertBoundedTargetReturnEvidence(ret.item);
            if (ret.item.payload.immediate !== candidate.immediate) throw new TypeError("Bounded return names another immediate");
          } else if (ret.kind !== "abstained" || ret.reason !== "budget_exhausted" || ret.candidateUci !== candidate.immediate.payload.candidateUci) throw new TypeError("Bounded return abstention is not the exact budget arm");
        } else if (candidate.kind !== "abstained" || candidate.reason !== "identity_lost") throw new TypeError("Candidate derivation arm is not closed");
      }
    }
  } else if (reasons[String(value.kind)] !== undefined) {
    if (!exact(value, ["kind", "identity", "reason", "visitedPositions"]) || !reasons[String(value.kind)]!.includes(String(value.reason))) throw new TypeError(`${String(value.kind)} bounded-target result is not a closed arm`);
  } else {
    throw new TypeError(`Bounded-target result kind ${String(value.kind)} is unknown`);
  }
  const { identity: _identity, ...rest } = value as unknown as BoundedTargetBatchCompleted;
  void _identity;
  if (resultDigest(rebuilt, rest as Unsealed) !== id.resultDigest) throw new TypeError("Bounded-target result digest does not recompute");
}

// ---------------------------------------------------------------------------------------------
// Admission: exact request, genuine seals, one frozen owned image ([[D3043]], [[D3046]])
// ---------------------------------------------------------------------------------------------

interface OwnedRequest {
  readonly kind: "source_position_batch";
  readonly threat: ThreatEvidence;
  readonly exchanges: readonly LegalExchangeEvidence[];
  readonly sourcePosition: SourceLegalMovesEvidence;
}

function sealedAs(value: unknown, id: string): void {
  assertDeclaredEvidence(value);
  if (value.projection.id !== id || value.projection.version !== 1) throw new TypeError(`expected ${id}@1`);
  evidenceValueReceipt(value);
}

export function admitBoundedTargetBatchRequest(value: unknown): OwnedRequest {
  if (!exact(value, ["kind", "threat", "exchanges", "sourcePosition"])) throw new TypeError("Bounded-target request keys are not exact");
  const request = value as Record<string, unknown>;
  if (request.kind !== "source_position_batch" || !Array.isArray(request.exchanges)) throw new TypeError("Bounded-target request kind or exchange set is invalid");
  sealedAs(request.threat, "rules.tactic.consequence.threat");
  threatEvidencePassAnchor(request.threat as ThreatEvidence);
  sealedAs(request.sourcePosition, "rules.mobility.reading.legal_moves");
  const exchanges = Object.freeze([...(request.exchanges as unknown[])]);
  for (const exchange of exchanges) sealedAs(exchange, "rules.exchange.predicate.legal_exchange");
  return Object.freeze({ kind: "source_position_batch", threat: request.threat as ThreatEvidence, exchanges: exchanges as readonly LegalExchangeEvidence[], sourcePosition: request.sourcePosition as SourceLegalMovesEvidence });
}

function sameAuthorities(left: OwnedRequest, right: OwnedRequest): boolean {
  if (left.threat !== right.threat || left.sourcePosition !== right.sourcePosition || left.exchanges.length !== right.exchanges.length) return false;
  const set = new Set<object>(left.exchanges);
  return right.exchanges.every((exchange) => set.has(exchange)) && new Set<object>(right.exchanges).size === set.size;
}

// ---------------------------------------------------------------------------------------------
// The service
// ---------------------------------------------------------------------------------------------

interface Waiter {
  readonly resolve: (result: BoundedTargetBatchResult) => void;
  readonly cleanup: () => void;
  settled: boolean;
}

interface Job {
  readonly identity: BoundedTargetRequestIdentity;
  readonly request: OwnedRequest;
  readonly targets: readonly NamedMaterialTargetEvidence[];
  readonly candidates: readonly ExactLegalMove[];
  readonly waiters: Set<Waiter>;
  readonly controller: AbortController;
  readonly counter: BoundedTargetBatchCounterAuthority;
  state: "queued" | "running" | "settled";
}

/** Sealed test fault hooks; only the module-private test factory accepts them. */
export interface BoundedTargetServiceTestHooks {
  readonly yieldNow?: () => Promise<void>;
  readonly fault?: (stage: "traversal" | "seal" | "invariant", pairIndex: number) => void;
}

const CONSTRUCTION = Symbol("bounded-target-service");

class BoundedTargetInvariant extends Error {}
class BoundedTargetSealFault extends Error {}

function validateLimits(options: unknown): BoundedTargetServiceLimits {
  if (options !== undefined && (!isRecord(options) || Object.keys(options).some((key) => key !== "limits"))) throw new TypeError("Bounded-target service options accept only { limits }");
  const partial = (options as BoundedTargetServiceOptions | undefined)?.limits ?? {};
  if (!isRecord(partial)) throw new TypeError("Bounded-target limits must be an object");
  for (const key of Object.keys(partial)) if (!(key in LIMIT_RANGES)) throw new TypeError(`Unknown bounded-target limit ${key}`);
  const limits = { ...BOUNDED_TARGET_DEFAULT_LIMITS, ...partial } as BoundedTargetServiceLimits;
  for (const [key, [min, max]] of Object.entries(LIMIT_RANGES) as [keyof BoundedTargetServiceLimits, readonly [number, number]][]) {
    const value = limits[key];
    if (!Number.isSafeInteger(value) || value < min || value > max) throw new RangeError(`Bounded-target limit ${key}=${String(value)} is outside ${min}..${max}`);
  }
  return Object.freeze(limits);
}

export class BoundedTargetBackgroundService {
  readonly #limits: BoundedTargetServiceLimits;
  readonly #hooks: BoundedTargetServiceTestHooks;
  readonly #buckets = new Map<string, Job[]>();
  readonly #queue: Job[] = [];
  #active: Job | undefined;
  #activeRun: Promise<void> | undefined;
  #state: "open" | "closing" | "closed" = "open";
  #closing: Promise<void> | undefined;

  private constructor(token: symbol, limits: BoundedTargetServiceLimits, hooks: BoundedTargetServiceTestHooks) {
    if (token !== CONSTRUCTION) throw new TypeError("BoundedTargetBackgroundService is constructed only by its factory");
    this.#limits = limits;
    this.#hooks = hooks;
  }

  static create(options?: BoundedTargetServiceOptions): BoundedTargetBackgroundService {
    return new BoundedTargetBackgroundService(CONSTRUCTION, validateLimits(options), Object.freeze({}));
  }

  get limits(): BoundedTargetServiceLimits {
    return this.#limits;
  }

  async submit(request: BoundedTargetBatchRequest, signal: AbortSignal): Promise<BoundedTargetBatchResult> {
    let owned: OwnedRequest;
    let identity: BoundedTargetRequestIdentity;
    try {
      if (!(signal instanceof AbortSignal)) throw new TypeError("submit requires an AbortSignal");
      owned = admitBoundedTargetBatchRequest(request);
      identity = boundedTargetRequestIdentity({ threat: boundedTargetInputDigest(owned.threat), exchanges: owned.exchanges.map(boundedTargetInputDigest), sourcePosition: boundedTargetInputDigest(owned.sourcePosition) });
    } catch {
      return REJECTED;
    }
    try {
      if (this.#state !== "open") return sealResult(identity, { kind: "cancelled", reason: "service_closed", visitedPositions: 0 });
      if (signal.aborted) return sealResult(identity, { kind: "cancelled", reason: "caller_aborted", visitedPositions: 0 });
      const admitted = this.#admitChess(owned);
      if (admitted.kind === "abstained") return sealResult(identity, { kind: "abstained", reason: admitted.reason, visitedPositions: 0 });
      const bucket = this.#buckets.get(identity.requestDigest) ?? [];
      let job = bucket.find((candidate) => candidate.state !== "settled" && sameAuthorities(candidate.request, owned));
      if (job === undefined) {
        if (this.#active !== undefined && this.#queue.length >= this.#limits.maxQueued) return sealResult(identity, { kind: "abstained", reason: "queue_full", visitedPositions: 0 });
        job = { identity, request: owned, targets: admitted.targets, candidates: admitted.candidates, waiters: new Set(), controller: new AbortController(), counter: createBoundedTargetBatchCounter(this.#limits.maxBatchVisitedPositions), state: "queued" };
        bucket.push(job);
        this.#buckets.set(identity.requestDigest, bucket);
        this.#queue.push(job);
      }
      const result = this.#attach(job, signal);
      this.#pump();
      return await result;
    } catch {
      return sealResult(identity, { kind: "failed", reason: "invariant_failed", visitedPositions: 0 });
    }
  }

  close(): Promise<void> {
    if (this.#closing !== undefined) return this.#closing;
    this.#state = "closing";
    for (const job of this.#queue.splice(0)) this.#settleJob(job, () => sealResult(job.identity, { kind: "cancelled", reason: "service_closed", visitedPositions: 0 }));
    const active = this.#active;
    if (active !== undefined) {
      const observed = active.counter.current();
      this.#settleJob(active, () => sealResult(active.identity, { kind: "cancelled", reason: "service_closed", visitedPositions: observed }));
      active.controller.abort();
    }
    this.#closing = (async () => {
      await this.#activeRun?.catch(() => undefined);
      this.#state = "closed";
    })();
    return this.#closing;
  }

  // -------------------------------------------------------------------------------------------

  #admitChess(owned: OwnedRequest): { readonly kind: "admitted"; readonly targets: readonly NamedMaterialTargetEvidence[]; readonly candidates: readonly ExactLegalMove[] } | { readonly kind: "abstained"; readonly reason: BoundedTargetBatchAbstentionReason } {
    const pass = threatEvidencePassAnchor(owned.threat);
    if (pass.kind !== "available" || owned.threat.payload.kind !== "threats") return { kind: "abstained", reason: "input_abstained" };
    const expected = positiveMaterialThreatExchanges(owned.threat.payload).map((exchange) => evidenceDigest(exchange)).sort();
    const supplied = owned.exchanges.map((exchange) => evidenceDigest(exchange.payload)).sort();
    if (expected.join("|") !== supplied.join("|")) return { kind: "abstained", reason: "exchange_set_mismatch" };
    const targets: NamedMaterialTargetEvidence[] = [];
    for (const exchange of owned.exchanges) {
      const result = invokeEvidenceValueRoute("derived.bounded_target.named_material_target@1", { threat: owned.threat, exchange, sourcePosition: owned.sourcePosition }) as NamedMaterialTargetFactoryResult;
      if (result.kind === "abstained") return { kind: "abstained", reason: result.reason };
      targets.push(result.item);
    }
    targets.sort((left, right) => left.payload.captureUci.localeCompare(right.payload.captureUci));
    const candidates = owned.sourcePosition.payload.pieces.flatMap((entry) => entry.moves).sort((left, right) => left.uci.localeCompare(right.uci));
    if (targets.length * candidates.length > this.#limits.maxPairs) return { kind: "abstained", reason: "multiplication_limit" };
    return { kind: "admitted", targets: Object.freeze(targets), candidates: Object.freeze(candidates) };
  }

  #attach(job: Job, signal: AbortSignal): Promise<BoundedTargetBatchResult> {
    return new Promise<BoundedTargetBatchResult>((resolve) => {
      const onAbort = (): void => {
        if (waiter.settled) return;
        const observed = job.state === "running" ? job.counter.current() : 0;
        this.#settleWaiter(job, waiter, sealResult(job.identity, { kind: "cancelled", reason: "caller_aborted", visitedPositions: observed }));
        if (job.waiters.size === 0) {
          if (job.state === "queued") this.#retire(job);
          else if (job.state === "running") job.controller.abort();
        }
      };
      const waiter: Waiter = { resolve, cleanup: () => signal.removeEventListener("abort", onAbort), settled: false };
      job.waiters.add(waiter);
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  #settleWaiter(job: Job, waiter: Waiter, result: BoundedTargetBatchResult): void {
    if (waiter.settled) return;
    waiter.settled = true;
    waiter.cleanup();
    job.waiters.delete(waiter);
    waiter.resolve(result);
  }

  #settleJob(job: Job, build: () => BoundedTargetBatchResult): void {
    for (const waiter of [...job.waiters]) this.#settleWaiter(job, waiter, build());
    this.#retire(job);
  }

  /** Terminal job: removed from queue, digest bucket and active slot atomically. */
  #retire(job: Job): void {
    job.state = "settled";
    const index = this.#queue.indexOf(job);
    if (index >= 0) this.#queue.splice(index, 1);
    const bucket = this.#buckets.get(job.identity.requestDigest);
    if (bucket !== undefined) {
      const remaining = bucket.filter((candidate) => candidate !== job);
      if (remaining.length === 0) this.#buckets.delete(job.identity.requestDigest);
      else this.#buckets.set(job.identity.requestDigest, remaining);
    }
  }

  #pump(): void {
    if (this.#active !== undefined || this.#state !== "open") return;
    const job = this.#queue.shift();
    if (job === undefined) return;
    this.#active = job;
    job.state = "running";
    this.#activeRun = this.#run(job).finally(() => {
      if (this.#active === job) this.#active = undefined;
      if (job.state !== "settled") this.#retire(job);
      this.#pump();
    });
  }

  async #run(job: Job): Promise<void> {
    const yieldNow = this.#hooks.yieldNow ?? messageChannelMacrotaskYield;
    const derivations: TargetDerivation[] = [];
    let pairIndex = 0;
    try {
      if (job.controller.signal.aborted) throw new BoundedTargetTraversalAborted();
      for (const target of job.targets) {
        const candidates: CandidateDerivation[] = [];
        for (const candidate of job.candidates) {
          if (job.controller.signal.aborted) throw new BoundedTargetTraversalAborted();
          if (job.counter.claimPosition() === "batch_budget_exhausted") throw new BoundedTargetBatchExhausted();
          this.#hooks.fault?.("traversal", pairIndex);
          let immediate: BoundedTargetImmediateFactoryResult;
          try {
            this.#hooks.fault?.("seal", pairIndex);
            immediate = invokeEvidenceValueRoute("derived.bounded_target.immediate@1", { target, candidate }) as BoundedTargetImmediateFactoryResult;
          } catch (error) {
            throw error instanceof BoundedTargetTraversalAborted ? error : new BoundedTargetSealFault(String(error));
          }
          try {
            this.#hooks.fault?.("invariant", pairIndex);
          } catch (error) {
            throw new BoundedTargetInvariant(String(error));
          }
          pairIndex += 1;
          if (immediate.kind === "abstained") {
            if (immediate.reason !== "identity_lost") throw new BoundedTargetInvariant(`candidate ${immediate.candidateUci} abstained ${immediate.reason} after admission`);
            candidates.push(Object.freeze({ kind: "abstained", projection: immediate.projection, reason: "identity_lost", candidateUci: immediate.candidateUci }));
            await this.#finalYield(job, yieldNow);
            continue;
          }
          const item = immediate.item;
          if (item.payload.outcome.result === "preserved") {
            candidates.push(Object.freeze({ kind: "preserved", immediate: item as Extract<CandidateDerivation, { readonly kind: "preserved" }>["immediate"] }));
            await this.#finalYield(job, yieldNow);
            continue;
          }
          const traversal = createBoundedTargetTraversalAuthority({ requestDigest: job.identity.requestDigest, signal: job.controller.signal, candidateLimit: this.#limits.maxVisitedPositions, yieldEvery: this.#limits.yieldEveryVisited, batchCounter: job.counter, yieldNow });
          const boundedReturn = await invokeEvidenceValueRoute("derived.bounded_target.bounded_return@1", { immediate: item, traversal }) as ReturnDerivation;
          candidates.push(Object.freeze({ kind: "removed", immediate: item as Extract<CandidateDerivation, { readonly kind: "removed" }>["immediate"], boundedReturn }));
        }
        derivations.push(Object.freeze({ target, candidates: Object.freeze(candidates) }));
      }
      if (job.controller.signal.aborted) throw new BoundedTargetTraversalAborted();
      const completed = sealResult(job.identity, { kind: "completed", targets: Object.freeze(derivations), visitedPositions: job.counter.current() });
      this.#settleJob(job, () => completed);
    } catch (error) {
      const visited = job.counter.current();
      if (error instanceof BoundedTargetTraversalAborted) {
        this.#settleJob(job, () => sealResult(job.identity, { kind: "cancelled", reason: this.#state === "open" ? "caller_aborted" : "service_closed", visitedPositions: visited }));
        return;
      }
      const outcome: Unsealed = error instanceof BoundedTargetBatchExhausted
        ? { kind: "abstained", reason: "batch_budget_exhausted", visitedPositions: visited }
        : error instanceof BoundedTargetYieldFailed ? { kind: "failed", reason: "yield_failed", visitedPositions: visited }
          : error instanceof BoundedTargetSealFault ? { kind: "failed", reason: "seal_failed", visitedPositions: visited }
            : error instanceof BoundedTargetInvariant ? { kind: "failed", reason: "invariant_failed", visitedPositions: visited }
              : { kind: "failed", reason: "traversal_failed", visitedPositions: visited };
      const sealed = sealResult(job.identity, outcome);
      this.#settleJob(job, () => sealed);
    }
  }

  async #finalYield(job: Job, yieldNow: () => Promise<void>): Promise<void> {
    if (job.controller.signal.aborted) throw new BoundedTargetTraversalAborted();
    try {
      await yieldNow();
    } catch (error) {
      throw new BoundedTargetYieldFailed(error);
    }
    if (job.controller.signal.aborted) throw new BoundedTargetTraversalAborted();
  }
}

/** Module-private test construction with sealed fault hooks; absent from the barrel and every product import. */
export function createBoundedTargetBackgroundServiceForTest(options: BoundedTargetServiceOptions | undefined, hooks: BoundedTargetServiceTestHooks): BoundedTargetBackgroundService {
  const Construct = BoundedTargetBackgroundService as unknown as new (token: symbol, limits: BoundedTargetServiceLimits, hooks: BoundedTargetServiceTestHooks) => BoundedTargetBackgroundService;
  return new Construct(CONSTRUCTION, validateLimits(options), Object.freeze({ ...hooks }));
}

/** The fixed product factory: numeric limits may only narrow the v1 ceilings. */
export function createBoundedTargetBackgroundService(options?: BoundedTargetServiceOptions): BoundedTargetBackgroundService {
  return BoundedTargetBackgroundService.create(options);
}

/** §4.2: the one background producer operation. */
export const RUNTIME_EVIDENCE_PRODUCER_OPERATIONS: readonly EvidenceProducerOperation[] = Object.freeze([
  evidenceProducerOperation("derived.bounded_target", "BoundedTargetBackgroundService.submit", BoundedTargetBackgroundService.prototype.submit),
]);
