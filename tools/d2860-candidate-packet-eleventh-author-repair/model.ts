// DISPOSABLE composed author model for D2860-D2863. Not production code.
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { evidenceDigest } from "../../packages/runtime/src/evidence-contract.js";
import {
  BREADTH_EVENT_PROJECTION_IDS,
  CASTLING_EVENT_PROJECTION_IDS,
  DERIVED_EXCHANGE_EVENT_PROJECTION_IDS,
  DERIVED_TACTIC_EVENT_PROJECTION_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
  SEMANTIC_WAVE_EVENT_PROJECTION_IDS,
  STRUCTURAL_EVENT_PROJECTION_IDS,
  TACTICAL_EVENT_PROJECTION_IDS,
  TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS,
  TRANSITION_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.js";
import { MOVE_IDENTITY_CONVENTION } from "../../packages/runtime/src/legal-moves.js";
import { loosePieceEvents } from "../../packages/runtime/src/tactics.js";
import {
  CANDIDATE_PACKET_COMPILER_VERSION,
  LEGAL_CONVENTION,
  candidatePacketIdentityInput,
  compileCandidatePopulation as compilePrior,
  compileCandidatePopulationCooperatively as compilePriorCooperatively,
  measureRetainedGraph,
  parseCandidatePopulationRequest,
  planCandidateCollectors,
  projectWide as projectPriorWide,
  type CandidatePacketScope,
  type CandidatePopulationRequest,
  type CompiledCandidatePacket as PriorCompiled,
} from "../d2678-candidate-packet-tenth-author-repair/model.js";

export { CANDIDATE_PACKET_COMPILER_VERSION, LEGAL_CONVENTION };
export type { CandidatePacketScope, CandidatePopulationRequest };

const key = (id: string) => `${id}@1` as const;
const CHILD_READING_KEYS = Object.freeze([
  "rules.castling.reading.rights", "rules.castling.reading.legality",
  "rules.tactic.reading.loose_piece", "rules.tactic.reading.ray_classification",
  "rules.tactic.consequence.threat", "rules.structural.reading.pawn_connectivity",
  "rules.phase.development", "rules.tactic.reading.rook_on_seventh",
  "rules.structural.reading.space", "rules.tactic.reading.discovered_latency",
  "rules.tactic.reading.trapped_piece", "rules.tactic.reading.back_rank",
  "rules.tactic.consequence.mate_in_one", "derived.tactic.promotion_pressure",
  "rules.square.reading.control", "rules.mobility.reading.piece_destinations",
  "rules.pawn.reading.contacts", "rules.pawn.reading.candidate_majority",
  "derived.material.reading.role_signature", "rules.king.reading.zone_state",
].map(key));

export const CANDIDATE_COLLECTOR_PROJECTION_KEYS = Object.freeze({
  "event.structural": Object.freeze(STRUCTURAL_EVENT_PROJECTION_IDS.map(key)),
  "event.pawn_island": Object.freeze(TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS.map(key)),
  "event.transition": Object.freeze(TRANSITION_EVENT_PROJECTION_IDS.map(key)),
  "event.tactical": Object.freeze(TACTICAL_EVENT_PROJECTION_IDS.filter((id) => id !== "rules.tactic.event.loose_piece").map(key)),
  "event.loose_piece": Object.freeze(["rules.tactic.event.loose_piece@1"] as const),
  "event.castling": Object.freeze(CASTLING_EVENT_PROJECTION_IDS.map(key)),
  "event.exchange": Object.freeze(DERIVED_EXCHANGE_EVENT_PROJECTION_IDS.map(key)),
  "event.discovered": Object.freeze(DERIVED_TACTIC_EVENT_PROJECTION_IDS.map(key)),
  "event.breadth": Object.freeze(BREADTH_EVENT_PROJECTION_IDS.map(key)),
  "event.duty": Object.freeze(SEMANTIC_WAVE_EVENT_PROJECTION_IDS.map(key)),
  "reading.child": CHILD_READING_KEYS,
  "reading.legal_exchange": Object.freeze(["rules.exchange.predicate.legal_exchange@1"] as const),
  "reading.fork_survival": Object.freeze(["derived.tactic.fork_survives_reply@1"] as const),
} as const);

export const CANDIDATE_PACKET_ABSTENTION_REASONS = Object.freeze({
  "rules.tactic.event.loose_piece@1": Object.freeze(["invalid_turn_clone"] as const),
} as const);

type CollectorId = keyof typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS;
type Projection = (typeof CANDIDATE_COLLECTOR_PROJECTION_KEYS)[CollectorId][number];
type EvidenceValue = PriorCompiled["references"]["candidateInputs"][number]["events"][number]
  | PriorCompiled["references"]["candidateInputs"][number]["readings"][number];

export type CandidateCollectorResult =
  | Readonly<{ kind: "available"; projection: Projection; values: readonly EvidenceValue[] }>
  | Readonly<{ kind: "unavailable"; projection: "rules.tactic.event.loose_piece@1"; reason: "invalid_turn_clone" }>
  | Readonly<{ kind: "failed"; projection: Projection; reason: "threw" | "invalid_result" }>;

export interface SealedCandidateCollectorOutcome {
  readonly collectorId: CollectorId;
  readonly moveUci: string;
  readonly projection: Projection;
  readonly result: CandidateCollectorResult;
}

export interface CandidatePacketAbstention {
  readonly projection: "rules.tactic.event.loose_piece@1";
  readonly reason: "invalid_turn_clone";
}

export interface CandidatePacketRow {
  readonly moveUci: string;
  readonly afterFen: string;
  readonly events: readonly PriorCompiled["references"]["candidateInputs"][number]["events"][number][];
  readonly readings: readonly PriorCompiled["references"]["candidateInputs"][number]["readings"][number][];
  readonly abstentions: readonly CandidatePacketAbstention[];
}

export interface CandidatePacket {
  readonly id: string;
  readonly beforeFen: string;
  readonly ruleset: "standard";
  readonly scope: CandidatePacketScope;
  readonly legalConvention: Readonly<{ id: "rules.mobility.reading.legal_moves"; version: 1 }>;
  readonly moveIdentityConvention: typeof MOVE_IDENTITY_CONVENTION;
  readonly manifestDigest: string;
  readonly compilerVersion: typeof CANDIDATE_PACKET_COMPILER_VERSION;
  readonly legalMoves: PriorCompiled["packet"]["legalMoves"];
  readonly candidates: readonly CandidatePacketRow[];
  readonly terminal?: Readonly<{ reason: "checkmate" | "stalemate" }>;
}

export interface CandidatePacketInput {
  readonly row: CandidatePacketRow;
  readonly events: CandidatePacketRow["events"];
  readonly readings: CandidatePacketRow["readings"];
  readonly collectorOutcomes: readonly SealedCandidateCollectorOutcome[];
  readonly executionOutcomes: readonly SealedCandidateCollectorOutcome[];
}

export interface CandidatePopulationReceipt {
  readonly packet: CandidatePacket;
  readonly selectedMember: CandidatePacketScope;
  readonly manifest: typeof PRIMARY_EVIDENCE_MANIFEST;
  readonly legalMovesInput: PriorCompiled["references"]["legalMovesInput"];
  readonly candidateInputs: readonly CandidatePacketInput[];
}

const OUTCOMES = new WeakSet<object>();
const RECEIPTS = new WeakMap<object, Readonly<{ prior: PriorCompiled }>>();

function projectionKey(value: EvidenceValue): string {
  return `${value.projection.id}@${value.projection.version}`;
}

function seal<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const property of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, property);
    if (descriptor === undefined || !("value" in descriptor)) throw new TypeError("ACCESSOR_RETAINED_KEY");
    seal(descriptor.value, seen);
  }
  if (!Object.isFrozen(value)) Object.freeze(value);
  return value;
}

function currentOutcomes(beforeFen: string, input: PriorCompiled["references"]["candidateInputs"][number]) {
  const retainedIds = new Set(input.collectorOutcomes.map((outcome) => outcome.collectorId));
  const execution: SealedCandidateCollectorOutcome[] = [];
  const retained: SealedCandidateCollectorOutcome[] = [];
  const abstentions: CandidatePacketAbstention[] = [];
  for (const prior of input.executionOutcomes) {
    const collectorId = prior.collectorId as CollectorId;
    const expected = CANDIDATE_COLLECTOR_PROJECTION_KEYS[collectorId] as readonly Projection[];
    const seen = new Set(prior.values.map((value) => projectionKey(value as EvidenceValue)));
    if ([...seen].some((value) => !expected.includes(value as Projection))) throw new TypeError("COLLECTOR_OUTPUT_UNDECLARED");
    for (const projection of expected) {
      const values = Object.freeze(prior.values.filter((value) => projectionKey(value as EvidenceValue) === projection)) as readonly EvidenceValue[];
      const unavailable = collectorId === "event.loose_piece"
        && loosePieceEvents(beforeFen, input.row.moveUci).kind === "unavailable";
      const result: CandidateCollectorResult = unavailable
        ? Object.freeze({ kind: "unavailable", projection: "rules.tactic.event.loose_piece@1", reason: "invalid_turn_clone" })
        : Object.freeze({ kind: "available", projection, values });
      const outcome = seal({ collectorId, moveUci: input.row.moveUci, projection, result });
      OUTCOMES.add(outcome);
      execution.push(outcome);
      if (retainedIds.has(collectorId)) {
        retained.push(outcome);
        if (result.kind === "unavailable") abstentions.push(Object.freeze({ projection: result.projection, reason: result.reason }));
      }
    }
  }
  return seal({ execution: Object.freeze(execution), retained: Object.freeze(retained), abstentions: Object.freeze(abstentions) });
}

function terminal(beforeFen: string, candidateCount: number): Readonly<{ reason: "checkmate" | "stalemate" }> | undefined {
  const position = positionFromFen(beforeFen);
  if (candidateCount > 0) return undefined;
  return Object.freeze({ reason: position.isCheckmate() ? "checkmate" : "stalemate" });
}

function enrich(prior: PriorCompiled): CandidatePopulationReceipt {
  const identity = candidatePacketIdentityInput(prior.packet.beforeFen, prior.packet.scope);
  const candidateInputs = prior.references.candidateInputs.map((input) => {
    const normalized = currentOutcomes(prior.packet.beforeFen, input);
    const row = seal({
      moveUci: input.row.moveUci,
      afterFen: input.row.afterFen,
      events: input.events,
      readings: input.readings,
      abstentions: normalized.abstentions,
    });
    return seal({ row, events: input.events, readings: input.readings, collectorOutcomes: normalized.retained, executionOutcomes: normalized.execution });
  });
  const terminalState = terminal(prior.packet.beforeFen, prior.packet.candidates.length);
  const packet: CandidatePacket = seal({
    id: evidenceDigest(identity),
    beforeFen: prior.packet.beforeFen,
    ruleset: "standard" as const,
    scope: prior.packet.scope,
    legalConvention: Object.freeze({ id: "rules.mobility.reading.legal_moves" as const, version: 1 as const }),
    moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
    manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
    compilerVersion: CANDIDATE_PACKET_COMPILER_VERSION,
    legalMoves: prior.packet.legalMoves,
    candidates: Object.freeze(candidateInputs.map((input) => input.row)),
    ...(terminalState === undefined ? {} : { terminal: terminalState }),
  });
  if (packet.candidates.length === 0 && terminalState === undefined) throw new TypeError("NON_TERMINAL_EMPTY");
  if (packet.candidates.length > 0 && terminalState !== undefined) throw new TypeError("NONEMPTY_TERMINAL");
  const receipt: CandidatePopulationReceipt = seal({
    packet,
    selectedMember: prior.packet.scope,
    manifest: PRIMARY_EVIDENCE_MANIFEST,
    legalMovesInput: prior.references.legalMovesInput,
    candidateInputs: Object.freeze(candidateInputs),
  });
  RECEIPTS.set(receipt, Object.freeze({ prior }));
  return receipt;
}

export function assertCandidatePopulationReceipt(value: unknown): asserts value is CandidatePopulationReceipt {
  if (value === null || typeof value !== "object") throw new TypeError("CANDIDATE_RECEIPT_UNSEALED");
  const authority = RECEIPTS.get(value);
  if (authority === undefined) throw new TypeError("CANDIDATE_RECEIPT_UNSEALED");
  const receipt = value as CandidatePopulationReceipt;
  if (receipt.manifest !== PRIMARY_EVIDENCE_MANIFEST || receipt.packet.id !== evidenceDigest(candidatePacketIdentityInput(receipt.packet.beforeFen, receipt.packet.scope))) throw new TypeError("CANDIDATE_RECEIPT_CROSSED");
  for (const input of receipt.candidateInputs) {
    if (input.row.events !== input.events || input.row.readings !== input.readings) throw new TypeError("CANDIDATE_ROW_CROSSED");
    for (const outcome of input.executionOutcomes) if (!OUTCOMES.has(outcome) || outcome.moveUci !== input.row.moveUci || outcome.projection !== outcome.result.projection) throw new TypeError("CANDIDATE_OUTCOME_CROSSED");
    for (const abstention of input.row.abstentions) {
      const source = input.collectorOutcomes.find((outcome) => outcome.projection === abstention.projection && outcome.result.kind === "unavailable" && outcome.result.reason === abstention.reason);
      if (source === undefined) throw new TypeError("CANDIDATE_ABSTENTION_UNAUTHORIZED");
    }
  }
}

export function compileCandidatePopulation(request: unknown): CandidatePopulationReceipt {
  return enrich(compilePrior(request));
}

export type CandidatePopulationFailure =
  | Readonly<{ code: "invalid_fen"; message: string }>
  | Readonly<{ code: "unsupported_ruleset"; received: string }>
  | Readonly<{ code: "non_terminal_empty"; beforeFen: string }>
  | Readonly<{ code: "collector_failed"; moveUci: string; projection: string; reason: "threw" | "invalid_result" }>
  | Readonly<{ code: "scheduler_failed"; stage: "yield"; collectorId: string }>
  | Readonly<{ code: "overloaded"; maxConcurrent: number; maxPending: number }>
  | Readonly<{ code: "deadline_exceeded"; stage: "queue" | "compile" }>
  | Readonly<{ code: "service_closed" }>
  | Readonly<{ code: "invariant_failed"; invariant: "legal_set" | "child_fen" | "receipt" }>
  | Readonly<{ code: "invalid_scope_projection"; source: CandidatePacketScope; target: CandidatePacketScope }>;

export type CandidatePopulationResult =
  | Readonly<{ kind: "ready"; receipt: CandidatePopulationReceipt; cache: "hit" | "projection_hit" | "miss" | "oversize_not_cached" }>
  | Readonly<{ kind: "cancelled"; reason: "caller_aborted" }>
  | Readonly<{ kind: "failed"; error: CandidatePopulationFailure }>;

export interface CandidatePopulationServiceLimits {
  readonly maxEntries: number;
  readonly maxRetainedLogicalBytes: number;
  readonly maxRetainedObjects: number;
  readonly maxCollectorsPerGroup: number;
  readonly maxConcurrent: number;
  readonly maxPending: number;
  readonly maxQueueWaitMs: number;
  readonly maxCompileMs: number;
}

export interface CandidatePopulationServiceStats {
  readonly activeUniqueJobs: number; readonly queuedUniqueJobs: number; readonly cacheEntries: number;
  readonly retainedLogicalBytes: number; readonly retainedObjects: number; readonly hits: number;
  readonly projectionHits: number; readonly misses: number; readonly evictions: number;
  readonly oversizeNotCached: number; readonly started: number; readonly completed: number;
  readonly failed: number; readonly cancelledWaiters: number; readonly lastWaiterCancellations: number;
  readonly yields: number;
}

export interface CandidatePopulationService {
  get(request: CandidatePopulationRequest, signal: AbortSignal): Promise<CandidatePopulationResult>;
  close(): Promise<void>;
  stats(): CandidatePopulationServiceStats;
}

type CompileHook = (
  request: CandidatePopulationRequest,
  signal: AbortSignal,
  maxCollectorsPerGroup: number,
  onYield: () => void,
) => Promise<CandidatePopulationReceipt>;

class SchedulerFailure extends Error {
  constructor(readonly collectorId: string) { super("CANDIDATE_SCHEDULER_FAILED"); }
}

function positive(value: number, name: string, minimum: number, maximum: number): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new TypeError(`INVALID_LIMIT:${name}`);
  return value;
}

export function messageChannelMacrotaskYield(): Promise<void> {
  return new Promise((resolveYield) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolveYield(); };
    channel.port2.postMessage(undefined);
  });
}

function canonicalizeFen(value: string): string { return canonicalFen(positionFromFen(value)); }
function requestId(request: CandidatePopulationRequest): string { return evidenceDigest(candidatePacketIdentityInput(canonicalizeFen(request.beforeFen), request.scope)); }

function service(limits: CandidatePopulationServiceLimits, compile: CompileHook): CandidatePopulationService {
  const bounded = Object.freeze({
    maxEntries: positive(limits.maxEntries, "maxEntries", 1, Number.MAX_SAFE_INTEGER),
    maxRetainedLogicalBytes: positive(limits.maxRetainedLogicalBytes, "maxRetainedLogicalBytes", 1, Number.MAX_SAFE_INTEGER),
    maxRetainedObjects: positive(limits.maxRetainedObjects, "maxRetainedObjects", 1, Number.MAX_SAFE_INTEGER),
    maxCollectorsPerGroup: positive(limits.maxCollectorsPerGroup, "maxCollectorsPerGroup", 1, 8),
    maxConcurrent: positive(limits.maxConcurrent, "maxConcurrent", 1, 4),
    maxPending: positive(limits.maxPending, "maxPending", 0, 128),
    maxQueueWaitMs: positive(limits.maxQueueWaitMs, "maxQueueWaitMs", 1, Number.MAX_SAFE_INTEGER),
    maxCompileMs: positive(limits.maxCompileMs, "maxCompileMs", 1, Number.MAX_SAFE_INTEGER),
  });
  const cache = new Map<string, Readonly<{ receipt: CandidatePopulationReceipt; bytes: number; objects: number }>>();
  const active = new Map<string, Job>();
  const queued: Job[] = [];
  const counters = { hits: 0, projectionHits: 0, misses: 0, evictions: 0, oversizeNotCached: 0, started: 0, completed: 0, failed: 0, cancelledWaiters: 0, lastWaiterCancellations: 0, yields: 0 };
  let retainedLogicalBytes = 0;
  let retainedObjects = 0;
  let closed = false;

  interface Job { readonly id: string; readonly request: CandidatePopulationRequest; readonly controller: AbortController; readonly promise: Promise<CandidatePopulationResult>; resolve(value: CandidatePopulationResult): void; waiters: number; started: boolean; termination?: "last_waiter" | "service_closed"; queueTimer?: ReturnType<typeof setTimeout>; }

  const failed = (error: CandidatePopulationFailure): CandidatePopulationResult => Object.freeze({ kind: "failed", error });
  const removeCache = (id: string) => { const found = cache.get(id); if (found === undefined) return; cache.delete(id); retainedLogicalBytes -= found.bytes; retainedObjects -= found.objects; counters.evictions += 1; };
  const admit = (receipt: CandidatePopulationReceipt): "miss" | "oversize_not_cached" => {
    assertCandidatePopulationReceipt(receipt);
    const prior = RECEIPTS.get(receipt)!.prior;
    const measure = measureRetainedGraph(prior);
    if (measure.logicalUtf8Bytes > bounded.maxRetainedLogicalBytes || measure.uniqueObjects > bounded.maxRetainedObjects) { counters.oversizeNotCached += 1; return "oversize_not_cached"; }
    removeCache(receipt.packet.id);
    cache.set(receipt.packet.id, Object.freeze({ receipt, bytes: measure.logicalUtf8Bytes, objects: measure.uniqueObjects }));
    retainedLogicalBytes += measure.logicalUtf8Bytes; retainedObjects += measure.uniqueObjects;
    while (cache.size > bounded.maxEntries || retainedLogicalBytes > bounded.maxRetainedLogicalBytes || retainedObjects > bounded.maxRetainedObjects) removeCache(cache.keys().next().value!);
    return "miss";
  };
  const finish = (job: Job, result: CandidatePopulationResult) => {
    if (job.queueTimer !== undefined) clearTimeout(job.queueTimer);
    active.delete(job.id);
    if (result.kind === "ready") counters.completed += 1; else if (result.kind === "failed") counters.failed += 1;
    job.resolve(result);
    while (!closed && active.size < bounded.maxConcurrent && queued.length > 0) start(queued.shift()!);
  };
  const start = (job: Job) => {
    job.started = true; counters.started += 1; active.set(job.id, job);
    void (async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      let timedOut = false;
      const deadline = new Promise<CandidatePopulationResult>((resolveDeadline) => { timer = setTimeout(() => { timedOut = true; job.controller.abort(); resolveDeadline(failed({ code: "deadline_exceeded", stage: "compile" })); }, bounded.maxCompileMs); });
      try {
        const compiled = compile(job.request, job.controller.signal, bounded.maxCollectorsPerGroup, () => { counters.yields += 1; }).then((receipt) => {
          assertCandidatePopulationReceipt(receipt);
          if (timedOut || job.controller.signal.aborted || job.waiters === 0 || closed) {
            return failed(timedOut ? { code: "deadline_exceeded", stage: "compile" } : { code: "service_closed" });
          }
          const cacheState = admit(receipt);
          counters.misses += 1;
          return Object.freeze({ kind: "ready" as const, receipt, cache: cacheState });
        }).catch((error: unknown) => {
          if (timedOut) return failed({ code: "deadline_exceeded", stage: "compile" });
          if (job.termination === "service_closed" || closed) return failed({ code: "service_closed" });
          if (job.termination === "last_waiter" || job.controller.signal.aborted) return Object.freeze({ kind: "cancelled" as const, reason: "caller_aborted" as const });
          if (error instanceof SchedulerFailure) return failed({ code: "scheduler_failed", stage: "yield", collectorId: error.collectorId });
          return failed({ code: "invariant_failed", invariant: "receipt" });
        });
        finish(job, await Promise.race([compiled, deadline]));
      } finally { if (timer !== undefined) clearTimeout(timer); }
    })();
  };
  const makeJob = (id: string, request: CandidatePopulationRequest): Job => {
    let resolveJob!: (value: CandidatePopulationResult) => void;
    const promise = new Promise<CandidatePopulationResult>((resolveValue) => { resolveJob = resolveValue; });
    return { id, request, controller: new AbortController(), promise, resolve: resolveJob, waiters: 0, started: false };
  };
  const wait = (job: Job, signal: AbortSignal): Promise<CandidatePopulationResult> => {
    if (signal.aborted) return Promise.resolve(Object.freeze({ kind: "cancelled", reason: "caller_aborted" }));
    job.waiters += 1;
    return new Promise((resolveWaiter) => {
      let settled = false;
      const abort = () => {
        if (settled) return; settled = true; job.waiters -= 1; counters.cancelledWaiters += 1;
        if (job.waiters === 0) {
          counters.lastWaiterCancellations += 1;
          job.termination = "last_waiter";
          const queuedIndex = queued.indexOf(job);
          if (queuedIndex >= 0) {
            queued.splice(queuedIndex, 1);
            job.controller.abort();
            finish(job, Object.freeze({ kind: "cancelled", reason: "caller_aborted" }));
          } else job.controller.abort();
        }
        resolveWaiter(Object.freeze({ kind: "cancelled", reason: "caller_aborted" }));
      };
      signal.addEventListener("abort", abort, { once: true });
      void job.promise.then((result) => { if (settled) return; settled = true; job.waiters -= 1; signal.removeEventListener("abort", abort); resolveWaiter(result); });
    });
  };

  return Object.freeze({
    async get(raw: CandidatePopulationRequest, signal: AbortSignal): Promise<CandidatePopulationResult> {
      if (closed) return failed({ code: "service_closed" });
      let request: CandidatePopulationRequest;
      try { request = parseCandidatePopulationRequest(raw); }
      catch (error) { return failed(raw?.ruleset !== "standard" ? { code: "unsupported_ruleset", received: String(raw?.ruleset) } : { code: "invalid_fen", message: String(error) }); }
      if (signal.aborted) return Object.freeze({ kind: "cancelled", reason: "caller_aborted" });
      let id: string;
      try { id = requestId(request); } catch (error) { return failed({ code: "invalid_fen", message: String(error) }); }
      const direct = cache.get(id);
      if (direct !== undefined) { cache.delete(id); cache.set(id, direct); counters.hits += 1; return Object.freeze({ kind: "ready", receipt: direct.receipt, cache: "hit" }); }
      if (request.scope !== "events_and_readings") {
        const wideId = requestId(Object.freeze({ ...request, scope: "events_and_readings" }));
        const wide = cache.get(wideId);
        if (wide !== undefined) {
          const prior = RECEIPTS.get(wide.receipt)!.prior;
          const receipt = enrich(projectPriorWide(prior, request.scope));
          counters.projectionHits += 1;
          return Object.freeze({ kind: "ready", receipt, cache: "projection_hit" });
        }
      }
      const existing = active.get(id) ?? queued.find((job) => job.id === id);
      if (existing !== undefined) return wait(existing, signal);
      if (active.size >= bounded.maxConcurrent && queued.length >= bounded.maxPending) return failed({ code: "overloaded", maxConcurrent: bounded.maxConcurrent, maxPending: bounded.maxPending });
      const job = makeJob(id, request);
      if (active.size < bounded.maxConcurrent) start(job);
      else {
        queued.push(job);
        job.queueTimer = setTimeout(() => {
          const index = queued.indexOf(job);
          if (index >= 0) queued.splice(index, 1);
          finish(job, failed({ code: "deadline_exceeded", stage: "queue" }));
        }, bounded.maxQueueWaitMs);
      }
      return wait(job, signal);
    },
    async close() {
      if (closed) return; closed = true;
      for (const job of queued.splice(0)) { job.termination = "service_closed"; job.controller.abort(); finish(job, failed({ code: "service_closed" })); }
      for (const job of active.values()) { job.termination = "service_closed"; job.controller.abort(); }
      await Promise.allSettled([...active.values()].map((job) => job.promise));
      cache.clear(); retainedLogicalBytes = 0; retainedObjects = 0;
    },
    stats() { return Object.freeze({ activeUniqueJobs: active.size, queuedUniqueJobs: queued.length, cacheEntries: cache.size, retainedLogicalBytes, retainedObjects, ...counters }); },
  });
}

export function createCandidatePopulationService(options: { readonly limits: CandidatePopulationServiceLimits }): CandidatePopulationService {
  return service(options.limits, async (request, signal, maxCollectorsPerGroup, onYield) => {
    const prior = await compilePriorCooperatively(request, {
      maxCollectorsPerGroup,
      signal,
      yieldControl: async (collectorId) => {
        try { await messageChannelMacrotaskYield(); }
        catch { throw new SchedulerFailure(collectorId); }
        onYield();
      },
    });
    return enrich(prior);
  });
}

export function createCandidatePopulationServiceForTest(options: {
  readonly limits: CandidatePopulationServiceLimits;
  readonly compile?: CompileHook;
  readonly yieldControl?: (collectorId: string) => Promise<void>;
}): CandidatePopulationService {
  if (options.compile !== undefined) return service(options.limits, options.compile);
  return service(options.limits, async (request, signal, maxCollectorsPerGroup, onYield) => {
    const prior = await compilePriorCooperatively(request, {
      maxCollectorsPerGroup,
      signal,
      yieldControl: async (collectorId) => {
        try { await (options.yieldControl ?? messageChannelMacrotaskYield)(collectorId); }
        catch { throw new SchedulerFailure(collectorId); }
        onYield();
      },
    });
    return enrich(prior);
  });
}

export function retainedPlans(scope: CandidatePacketScope) { return planCandidateCollectors(scope); }
