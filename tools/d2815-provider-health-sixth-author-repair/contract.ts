import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

const INSTANCE_IDS = ["stockfish-play", "stockfish-analysis", "maia-inference", "tablebase-primary", "explorer-primary", "external-voice", "external-tts"] as const;
export type InstanceId = (typeof INSTANCE_IDS)[number];
const OPERATION_IDS = ["opponent.stockfish_play", "opponent.maia_inference", "evidence.stockfish_analysis", "evidence.tablebase_probe", "evidence.explorer_query", "render.voice", "render.voice_compare", "render.voice_story", "review.reasoning", "render.speech"] as const;
export type OperationId = (typeof OPERATION_IDS)[number];
export type FailureReason = "startup" | "process_exit" | "timeout" | "network" | "rate_limited" | "overloaded" | "authentication" | "protocol" | "cancelled_by_shutdown";

type Stage = Readonly<{ stageId: string; instanceId: InstanceId; exchangeOperation: string; dependsOn: readonly string[]; when: "always" | "audio_requested"; fallback: "none" | "deterministic_renderer" | "browser_speech_or_text" }>;
export type OperationDeclaration = Readonly<{ operationId: OperationId; consumer: string; deadline: "consumer_budget"; stages: readonly Stage[] }>;

const RAW_DECLARATIONS = [
  ["opponent.stockfish_play", "opponent.selection", "select", "stockfish-play", "stockfish.legal_root_table@1", "none"],
  ["opponent.maia_inference", "opponent.selection", "select", "maia-inference", "maia.policy_page@1", "none"],
  ["evidence.stockfish_analysis", "live.stockfish", "analyse", "stockfish-analysis", "stockfish.position_evaluation@1", "none"],
  ["evidence.tablebase_probe", "live.syzygy", "probe", "tablebase-primary", "syzygy.position@1", "none"],
  ["evidence.explorer_query", "human.explorer", "query", "explorer-primary", "lichess_explorer.position_page@1", "none"],
  ["render.voice", "guidance.voice", "text", "external-voice", "external_voice.render@1", "deterministic_renderer"],
  ["render.voice_compare", "guidance.voice_compare", "text", "external-voice", "external_voice.render@1", "deterministic_renderer"],
  ["render.voice_story", "guidance.voice_story", "text", "external-voice", "external_voice.render@1", "deterministic_renderer"],
  ["review.reasoning", "review.reasoning", "review", "external-voice", "external_voice.reasoning_review@1", "none"],
  ["render.speech", "guidance.speech", "audio", "external-tts", "external_tts.synthesize@1", "browser_speech_or_text"],
] as const;

export const APPLICATION_DECLARATIONS: readonly OperationDeclaration[] = deepFreeze(RAW_DECLARATIONS.map(([operationId, consumer, stageId, instanceId, exchangeOperation, fallback]) => ({
  operationId,
  consumer,
  deadline: "consumer_budget" as const,
  stages: [{ stageId, instanceId, exchangeOperation, dependsOn: [], when: "always" as const, fallback }],
}))) as readonly OperationDeclaration[];

const operationSeal = new WeakSet<object>();
const allowedFallbacks = new Set(["none", "deterministic_renderer", "browser_speech_or_text"]);
const allowedWhen = new Set(["always", "audio_requested"]);
const expected = new Map(APPLICATION_DECLARATIONS.map((row) => [row.operationId, canonical(row)]));

export function compileApplicationOperations(candidate: unknown = APPLICATION_DECLARATIONS): readonly OperationDeclaration[] {
  if (!Array.isArray(candidate)) throw new TypeError("APPLICATION_DECLARATIONS_NOT_ARRAY");
  const seen = new Set<string>();
  const parsed = candidate.map((raw) => {
    if (!plain(raw) || !exactKeys(raw, ["consumer", "deadline", "operationId", "stages"]) || !OPERATION_IDS.includes(raw.operationId as OperationId) || typeof raw.consumer !== "string" || raw.consumer.length === 0 || raw.deadline !== "consumer_budget" || !Array.isArray(raw.stages) || raw.stages.length === 0) throw new TypeError("APPLICATION_DECLARATION_INVALID");
    if (seen.has(raw.operationId as string)) throw new TypeError("APPLICATION_OPERATION_DUPLICATE");
    seen.add(raw.operationId as string);
    const prior = new Set<string>();
    const stages = raw.stages.map((stage) => {
      if (!plain(stage) || !exactKeys(stage, ["dependsOn", "exchangeOperation", "fallback", "instanceId", "stageId", "when"]) || typeof stage.stageId !== "string" || stage.stageId.length === 0 || !INSTANCE_IDS.includes(stage.instanceId as InstanceId) || typeof stage.exchangeOperation !== "string" || !Array.isArray(stage.dependsOn) || !allowedWhen.has(String(stage.when)) || !allowedFallbacks.has(String(stage.fallback))) throw new TypeError("APPLICATION_STAGE_INVALID");
      if (prior.has(stage.stageId)) throw new TypeError("APPLICATION_STAGE_DUPLICATE");
      if (stage.dependsOn.some((id: unknown) => typeof id !== "string" || !prior.has(id))) throw new TypeError("APPLICATION_DEPENDENCY_FORWARD_OR_MISSING");
      prior.add(stage.stageId);
      return { stageId: stage.stageId, instanceId: stage.instanceId, exchangeOperation: stage.exchangeOperation, dependsOn: [...stage.dependsOn], when: stage.when, fallback: stage.fallback };
    });
    const row = deepFreeze({ operationId: raw.operationId, consumer: raw.consumer, deadline: raw.deadline, stages }) as OperationDeclaration;
    if (canonical(row) !== expected.get(row.operationId)) throw new TypeError("APPLICATION_SEMANTICS_MISMATCH");
    operationSeal.add(row);
    return row;
  });
  if (seen.size !== OPERATION_IDS.length) throw new TypeError("APPLICATION_OPERATION_SET_MISMATCH");
  return Object.freeze(parsed);
}

export function assertCompiledOperation(value: unknown): asserts value is OperationDeclaration {
  if (!plain(value) || !operationSeal.has(value)) throw new TypeError("APPLICATION_OPERATION_NOT_COMPILED");
}

type Request = Readonly<{ operation: string; instanceId: InstanceId; generation: string; requestDigest: string }>;
type Delivery<T> = Readonly<Request & { payload: T; responseDigest: string }>;
type Failure = Readonly<Request & { reason: FailureReason }>;
const requests = new WeakSet<object>();
const deliveries = new WeakSet<object>();
const failures = new WeakSet<object>();

export class ExchangeAuthority {
  request(operation: string, instanceId: InstanceId, generation: string, requestDigest: string): Request {
    const value = deepFreeze({ operation: text(operation), instanceId, generation: text(generation), requestDigest: text(requestDigest) });
    requests.add(value);
    return value;
  }
  success<T>(request: Request, payload: T, responseDigest: string): Delivery<T> {
    assertRequest(request);
    const value = deepFreeze({ ...request, payload, responseDigest: text(responseDigest) });
    deliveries.add(value);
    return value;
  }
  failure(request: Request, reason: FailureReason): Failure {
    assertRequest(request);
    const value = deepFreeze({ ...request, reason });
    failures.add(value);
    return value;
  }
}

type Circuit = { generation: string; state: "unverified" | "available" | "open" | "recovering"; reason: FailureReason | null; checkedAt: number | null; lastSuccess: number | null; lastFailure: number | null; transientOpens: number[]; consecutiveSuccesses: 0 | 1 };
export type HealthSnapshot =
  | Readonly<{ instanceId: InstanceId; state: "not_configured" }>
  | Readonly<{ instanceId: InstanceId; generation: string; state: "unverified" }>
  | Readonly<{ instanceId: InstanceId; generation: string; state: "available"; checkedAt: number; lastSuccess: number; lastFailure: number | null }>
  | Readonly<{ instanceId: InstanceId; generation: string; state: "recovering"; priorReason: FailureReason; checkedAt: number; lastSuccess: number; lastFailure: number; consecutiveSuccesses: 1; requiredSuccesses: 2 }>
  | Readonly<{ instanceId: InstanceId; generation: string; state: "degraded_cached_only"; reason: FailureReason; checkedAt: number; validExactEntries: number; cacheScope: "exact_request" }>
  | Readonly<{ instanceId: InstanceId; generation: string; state: "unavailable"; reason: FailureReason; checkedAt: number; cacheScope: "none" }>;

interface CacheInventory { count(instanceId: InstanceId, generation: string, now: number): number; invalidate(instanceId: InstanceId, generation: string): void }
const cacheSeals = new WeakSet<object>();
const snapshotSeals = new WeakSet<object>();

export class ProviderHealthAuthority {
  readonly #circuits = new Map<InstanceId, Circuit>();
  readonly #caches = new Set<CacheInventory>();
  constructor(configured: readonly Readonly<{ instanceId: InstanceId; generation: string }>[]) {
    for (const row of configured) {
      if (this.#circuits.has(row.instanceId)) throw new TypeError("INSTANCE_DUPLICATE");
      this.#circuits.set(row.instanceId, { generation: text(row.generation), state: "unverified", reason: null, checkedAt: null, lastSuccess: null, lastFailure: null, transientOpens: [], consecutiveSuccesses: 0 });
    }
  }
  attach(cache: CacheInventory): void {
    if (!cacheSeals.has(cache as object)) throw new TypeError("CACHE_NOT_AUTHORIZED");
    this.#caches.add(cache);
  }
  success(request: Request, delivery: Delivery<unknown>, now: number): void {
    assertRequest(request); assertDelivery(delivery); monotonic(now); sameSubject(request, delivery);
    const circuit = this.#current(request);
    const recent = circuit.transientOpens.filter((opened) => now - opened < 300_000);
    if ((circuit.state === "open" || circuit.state === "recovering") && recent.length >= 2 && circuit.consecutiveSuccesses === 0) {
      circuit.state = "recovering"; circuit.consecutiveSuccesses = 1; circuit.reason ??= "timeout";
    } else {
      circuit.state = "available"; circuit.reason = null; circuit.consecutiveSuccesses = 0; circuit.transientOpens = [];
    }
    circuit.checkedAt = now; circuit.lastSuccess = now;
  }
  failure(request: Request, failure: Failure, now: number): void {
    assertRequest(request); assertFailure(failure); monotonic(now); sameSubject(request, failure);
    const circuit = this.#current(request);
    circuit.transientOpens = circuit.transientOpens.filter((opened) => now - opened < 300_000);
    if (["timeout", "network", "rate_limited", "overloaded"].includes(failure.reason)) circuit.transientOpens.push(now);
    circuit.state = "open"; circuit.reason = failure.reason; circuit.checkedAt = now; circuit.lastFailure = now; circuit.consecutiveSuccesses = 0;
  }
  changeGeneration(instanceId: InstanceId, generation: string): void {
    const prior = this.#circuits.get(instanceId);
    if (prior === undefined) throw new TypeError("INSTANCE_NOT_CONFIGURED");
    for (const cache of this.#caches) cache.invalidate(instanceId, prior.generation);
    this.#circuits.set(instanceId, { generation: text(generation), state: "unverified", reason: null, checkedAt: null, lastSuccess: null, lastFailure: null, transientOpens: [], consecutiveSuccesses: 0 });
  }
  snapshot(now: number): readonly HealthSnapshot[] {
    monotonic(now);
    const snapshot = deepFreeze(INSTANCE_IDS.map((instanceId): HealthSnapshot => {
      const circuit = this.#circuits.get(instanceId);
      if (circuit === undefined) return { instanceId, state: "not_configured" };
      if (circuit.state === "unverified") return { instanceId, generation: circuit.generation, state: "unverified" };
      if (circuit.state === "available") return { instanceId, generation: circuit.generation, state: "available", checkedAt: circuit.checkedAt!, lastSuccess: circuit.lastSuccess!, lastFailure: circuit.lastFailure };
      if (circuit.state === "recovering") return { instanceId, generation: circuit.generation, state: "recovering", priorReason: circuit.reason!, checkedAt: circuit.checkedAt!, lastSuccess: circuit.lastSuccess!, lastFailure: circuit.lastFailure!, consecutiveSuccesses: 1, requiredSuccesses: 2 };
      const entries = [...this.#caches].reduce((sum, cache) => sum + cache.count(instanceId, circuit.generation, now), 0);
      return entries > 0
        ? { instanceId, generation: circuit.generation, state: "degraded_cached_only", reason: circuit.reason!, checkedAt: circuit.checkedAt!, validExactEntries: entries, cacheScope: "exact_request" }
        : { instanceId, generation: circuit.generation, state: "unavailable", reason: circuit.reason!, checkedAt: circuit.checkedAt!, cacheScope: "none" };
    }));
    snapshotSeals.add(snapshot);
    return snapshot;
  }
  assertCurrentDelivery(delivery: Delivery<unknown>): void { assertDelivery(delivery); this.#current(delivery); }
  #current(request: Request): Circuit {
    const circuit = this.#circuits.get(request.instanceId);
    if (circuit === undefined || circuit.generation !== request.generation) throw new TypeError("GENERATION_STALE");
    return circuit;
  }
}

type CacheRow<T> = Readonly<{ delivery: Delivery<T>; expiresAt: number }>;
export class ExactCache<T> implements CacheInventory {
  readonly #rows = new Map<string, CacheRow<T>>();
  readonly #authority: ProviderHealthAuthority;
  constructor(authority: ProviderHealthAuthority) { this.#authority = authority; cacheSeals.add(this); authority.attach(this); }
  put(delivery: Delivery<T>, expiresAt: number, now: number): void {
    assertDelivery(delivery); monotonic(now); monotonic(expiresAt);
    this.#authority.assertCurrentDelivery(delivery);
    if (expiresAt <= now) throw new TypeError("CACHE_EXPIRY_INVALID");
    this.#rows.set(cacheId(delivery), deepFreeze({ delivery, expiresAt }));
    while (this.#rows.size > 512) this.#rows.delete(this.#rows.keys().next().value!);
  }
  resolve(request: Request, now: number): Readonly<{ kind: "miss" }> | Readonly<{ kind: "hit"; delivery: Delivery<T> }> {
    assertRequest(request); monotonic(now);
    const row = this.#rows.get(cacheId(request));
    if (row === undefined || row.expiresAt <= now) { if (row !== undefined) this.#rows.delete(cacheId(request)); return Object.freeze({ kind: "miss" }); }
    this.#rows.delete(cacheId(request));
    this.#rows.set(cacheId(request), row);
    return Object.freeze({ kind: "hit", delivery: row.delivery });
  }
  count(instanceId: InstanceId, generation: string, now: number): number {
    let count = 0;
    for (const [id, row] of this.#rows) { if (row.expiresAt <= now) this.#rows.delete(id); else if (row.delivery.instanceId === instanceId && row.delivery.generation === generation) count += 1; }
    return count;
  }
  invalidate(instanceId: InstanceId, generation: string): void { for (const [id, row] of this.#rows) if (row.delivery.instanceId === instanceId && row.delivery.generation === generation) this.#rows.delete(id); }
}

type GenerationSet = Readonly<{ digest: string }>;
const generationSeals = new WeakSet<object>();
export function generationSet(snapshot: readonly HealthSnapshot[]): GenerationSet {
  if (!snapshotSeals.has(snapshot as object)) throw new TypeError("SNAPSHOT_NOT_SEALED");
  const value = Object.freeze({ digest: hash(canonical(snapshot.map((row) => "generation" in row ? [row.instanceId, row.generation] : [row.instanceId, null]))) });
  generationSeals.add(value); return value;
}
type Claim = { token: string; generationDigest: string; expiresAt: number };
export class RenewableBackoffCoordinator {
  #claim: Claim | null = null;
  #generationDigest: string | null = null;
  acquire(now: number, generations: GenerationSet, leaseMs: number): Readonly<{ kind: "acquired"; token: string }> | Readonly<{ kind: "claimed" }> {
    this.#inputs(now, generations, leaseMs);
    if (this.#generationDigest !== generations.digest) { this.#generationDigest = generations.digest; this.#claim = null; }
    if (this.#claim !== null && this.#claim.expiresAt > now) return Object.freeze({ kind: "claimed" });
    const token = randomUUID(); this.#claim = { token, generationDigest: generations.digest, expiresAt: now + leaseMs }; return Object.freeze({ kind: "acquired", token });
  }
  renew(now: number, generations: GenerationSet, token: string, leaseMs: number): void {
    this.#inputs(now, generations, leaseMs); this.#assert(now, generations, token); this.#claim!.expiresAt = now + leaseMs;
  }
  settle(now: number, generations: GenerationSet, token: string): void { monotonic(now); sealedGeneration(generations); this.#assert(now, generations, token); this.#claim = null; }
  expire(now: number): void { monotonic(now); if (this.#claim !== null && this.#claim.expiresAt <= now) this.#claim = null; }
  #inputs(now: number, generations: GenerationSet, leaseMs: number): void { monotonic(now); sealedGeneration(generations); if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 60_000) throw new TypeError("LEASE_INVALID"); }
  #assert(now: number, generations: GenerationSet, token: string): void { if (this.#claim === null || this.#claim.expiresAt <= now || this.#claim.generationDigest !== generations.digest || this.#claim.token !== token) throw new TypeError("LEASE_STALE"); }
}

export type OpponentPolicy = Readonly<{ mode: "human_common"; rating: number } | { mode: "stockfish"; skill: number } | { mode: "perfect_tablebase" }>;
export type RetryCommand = Readonly<{ runId: string; failureEventSeq: number; requestDigest: string; idempotencyKey: string }>;
export type ChangeCommand = Readonly<{ runId: string; failureEventSeq: number; opponentPolicy: OpponentPolicy; idempotencyKey: string }>;

export function createRecoveryDatabase(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE run_events(run_id TEXT NOT NULL,event_seq INTEGER NOT NULL,type TEXT NOT NULL,after_fen TEXT,request_digest TEXT,policy_digest TEXT,payload_json TEXT NOT NULL,PRIMARY KEY(run_id,event_seq));
    CREATE TABLE recovery_state(run_id TEXT PRIMARY KEY,failure_event_seq INTEGER NOT NULL,learner_event_seq INTEGER NOT NULL,after_fen TEXT NOT NULL,request_digest TEXT NOT NULL,policy_digest TEXT NOT NULL,state TEXT NOT NULL);
    CREATE TABLE recovery_idempotency(idempotency_key TEXT PRIMARY KEY,command_json TEXT NOT NULL,result_json TEXT NOT NULL);`);
  return db;
}

export function appendRunEvent(db: DatabaseSync, row: Readonly<{ runId: string; eventSeq: number; type: "learner.ply" | "opponent.move"; afterFen: string; requestDigest: string; policyDigest: string }>): void {
  db.prepare("INSERT INTO run_events VALUES (?,?,?,?,?,?,?)").run(text(row.runId), integer(row.eventSeq), row.type, text(row.afterFen), text(row.requestDigest), text(row.policyDigest), "{}");
}

export class RecoveryAuthority {
  constructor(readonly db: DatabaseSync) {}
  fail(input: Readonly<{ runId: string; learnerEventSeq: number; failureEventSeq: number; reason: FailureReason }>): void {
    const runId = text(input.runId); const learnerSeq = integer(input.learnerEventSeq); const failureSeq = integer(input.failureEventSeq);
    failureReason(input.reason);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const tail = this.db.prepare("SELECT * FROM run_events WHERE run_id=? ORDER BY event_seq DESC LIMIT 1").get(runId) as Record<string, unknown> | undefined;
      if (tail === undefined || tail.type !== "learner.ply" || Number(tail.event_seq) !== learnerSeq || failureSeq !== learnerSeq + 1) throw new TypeError("FAILURE_NOT_CURRENT_LEARNER_TAIL");
      const payload = canonical({ learnerEventSeq: learnerSeq, requestDigest: tail.request_digest, reason: input.reason });
      this.db.prepare("INSERT INTO run_events VALUES (?,?,?,?,?,?,?)").run(runId, failureSeq, "opponent.selection_failed", null, String(tail.request_digest), String(tail.policy_digest), payload);
      this.db.prepare("INSERT INTO recovery_state VALUES (?,?,?,?,?,?,?) ON CONFLICT(run_id) DO UPDATE SET failure_event_seq=excluded.failure_event_seq,learner_event_seq=excluded.learner_event_seq,after_fen=excluded.after_fen,request_digest=excluded.request_digest,policy_digest=excluded.policy_digest,state=excluded.state").run(runId, failureSeq, learnerSeq, String(tail.after_fen), String(tail.request_digest), String(tail.policy_digest), "failed");
      this.db.exec("COMMIT");
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  retry(input: RetryCommand): Readonly<Record<string, unknown>> { return this.#recover("retry", input); }
  change(input: ChangeCommand): Readonly<Record<string, unknown>> { parsePolicy(input.opponentPolicy); return this.#recover("change", input); }
  state(runId: string): Readonly<Record<string, unknown>> | null { const row = this.db.prepare("SELECT * FROM recovery_state WHERE run_id=?").get(text(runId)) as Record<string, unknown> | undefined; return row === undefined ? null : Object.freeze({ ...row }); }
  #recover(action: "retry" | "change", input: RetryCommand | ChangeCommand): Readonly<Record<string, unknown>> {
    const runId = text(input.runId); integer(input.failureEventSeq); text(input.idempotencyKey);
    const command = action === "retry" ? canonical({ action, ...input }) : canonical({ action, runId, failureEventSeq: input.failureEventSeq, idempotencyKey: input.idempotencyKey, opponentPolicy: (input as ChangeCommand).opponentPolicy });
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const prior = this.db.prepare("SELECT * FROM recovery_idempotency WHERE idempotency_key=?").get(input.idempotencyKey) as Record<string, unknown> | undefined;
      if (prior !== undefined) {
        if (prior.command_json !== command) throw new TypeError("RECOVERY_IDEMPOTENCY_CROSSED");
        const replay = Object.freeze(JSON.parse(String(prior.result_json)) as Record<string, unknown>);
        this.db.exec("COMMIT");
        return replay;
      }
      const current = this.db.prepare("SELECT * FROM recovery_state WHERE run_id=?").get(runId) as Record<string, unknown> | undefined;
      if (current === undefined || current.state !== "failed" || current.failure_event_seq !== input.failureEventSeq) throw new TypeError("RECOVERY_FAILURE_STALE");
      if (action === "retry" && current.request_digest !== (input as RetryCommand).requestDigest) throw new TypeError("RECOVERY_REQUEST_CROSSED");
      const policyDigest = action === "change" ? hash(canonical((input as ChangeCommand).opponentPolicy)) : String(current.policy_digest);
      if (action === "change" && policyDigest === current.policy_digest) throw new TypeError("RECOVERY_POLICY_UNCHANGED");
      const requestDigest = action === "change" ? hash(canonical({ afterFen: current.after_fen, policyDigest })) : String(current.request_digest);
      const eventSeq = Number(current.failure_event_seq) + 1;
      const result = deepFreeze({ runId, eventSeq, failureEventSeq: input.failureEventSeq, action, fromPolicyDigest: current.policy_digest, toPolicyDigest: policyDigest, requestDigest });
      this.db.prepare("INSERT INTO run_events VALUES (?,?,?,?,?,?,?)").run(runId, eventSeq, "opponent.recovery_requested", String(current.after_fen), requestDigest, policyDigest, canonical(result));
      this.db.prepare("UPDATE recovery_state SET request_digest=?,policy_digest=?,state='waiting' WHERE run_id=?").run(requestDigest, policyDigest, runId);
      this.db.prepare("INSERT INTO recovery_idempotency VALUES (?,?,?)").run(input.idempotencyKey, command, canonical(result));
      this.db.exec("COMMIT");
      return result;
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
}

function parsePolicy(value: unknown): asserts value is OpponentPolicy {
  if (!plain(value) || typeof value.mode !== "string") throw new TypeError("POLICY_INVALID");
  if (value.mode === "human_common" && exactKeys(value, ["mode", "rating"]) && Number.isInteger(value.rating) && Number(value.rating) >= 400 && Number(value.rating) <= 2800) return;
  if (value.mode === "stockfish" && exactKeys(value, ["mode", "skill"]) && Number.isInteger(value.skill) && Number(value.skill) >= 0 && Number(value.skill) <= 20) return;
  if (value.mode === "perfect_tablebase" && exactKeys(value, ["mode"])) return;
  throw new TypeError("POLICY_INVALID");
}
function failureReason(value: unknown): asserts value is FailureReason { if (!["startup", "process_exit", "timeout", "network", "rate_limited", "overloaded", "authentication", "protocol", "cancelled_by_shutdown"].includes(String(value))) throw new TypeError("FAILURE_REASON_INVALID"); }
function assertRequest(value: unknown): asserts value is Request { if (!plain(value) || !requests.has(value)) throw new TypeError("REQUEST_NOT_SEALED"); }
function assertDelivery(value: unknown): asserts value is Delivery<unknown> { if (!plain(value) || !deliveries.has(value)) throw new TypeError("DELIVERY_NOT_SEALED"); }
function assertFailure(value: unknown): asserts value is Failure { if (!plain(value) || !failures.has(value)) throw new TypeError("FAILURE_NOT_SEALED"); }
function sameSubject(left: Request, right: Request): void { if (left.operation !== right.operation || left.instanceId !== right.instanceId || left.generation !== right.generation || left.requestDigest !== right.requestDigest) throw new TypeError("SUBJECT_CROSSED"); }
function sealedGeneration(value: unknown): asserts value is GenerationSet { if (!plain(value) || !generationSeals.has(value)) throw new TypeError("GENERATION_SET_NOT_SEALED"); }
function cacheId(value: Request): string { return [value.operation, value.instanceId, value.generation, value.requestDigest].join("\0"); }
function canonical(value: unknown): string { return JSON.stringify(sortCanonical(value)); }
function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortCanonical);
  if (!plain(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortCanonical(value[key])]));
}
function hash(value: string): string { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
function text(value: string): string { if (typeof value !== "string" || value.length === 0 || value.length > 512) throw new TypeError("TEXT_INVALID"); return value; }
function integer(value: number): number { if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("INTEGER_INVALID"); return value; }
function monotonic(value: number): number { return integer(value); }
function plain(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function exactKeys(value: Record<string, any>, keys: readonly string[]): boolean { const actual = Object.keys(value).sort(); const expectedKeys = [...keys].sort(); return actual.length === expectedKeys.length && actual.every((key, index) => key === expectedKeys[index]); }
function deepFreeze<T>(value: T): T { if (typeof value !== "object" || value === null) return value; for (const child of Object.values(value as object)) deepFreeze(child); return Object.freeze(value); }
