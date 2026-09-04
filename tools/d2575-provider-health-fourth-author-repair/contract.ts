// DISPOSABLE author contract for D2575-D2583. Not production code.

export const EXCHANGE_OPERATION_IDS = Object.freeze([
  "stockfish.legal_root_table@1",
  "stockfish.position_evaluation@1",
  "maia.policy_page@1",
  "syzygy.position@1",
  "lichess_explorer.position_page@1",
  "external_voice.render@1",
  "external_voice.reasoning_review@1",
  "external_tts.synthesize@1",
] as const);

export type ExchangeOperationId = (typeof EXCHANGE_OPERATION_IDS)[number];
export type ProviderInstanceId =
  | "stockfish-play"
  | "stockfish-analysis"
  | "maia-inference"
  | "tablebase-primary"
  | "explorer-primary"
  | "external-voice"
  | "external-tts";

export const APPLICATION_OPERATION_OBLIGATIONS = Object.freeze([
  "opponent.stockfish_play",
  "opponent.maia_inference",
  "evidence.stockfish_analysis",
  "evidence.tablebase_probe",
  "evidence.explorer_query",
  "render.voice",
  "render.voice_compare",
  "render.voice_story",
  "review.reasoning",
  "render.speech",
] as const);

export type ApplicationOperationId = (typeof APPLICATION_OPERATION_OBLIGATIONS)[number];

export interface ApplicationStageDeclaration {
  readonly stageId: string;
  readonly instanceId: ProviderInstanceId;
  readonly exchangeOperation: ExchangeOperationId;
  readonly dependsOn: readonly string[];
  readonly when: "always" | "audio_requested";
  readonly fallback: "none" | "deterministic_renderer" | "browser_speech_or_text";
}

export interface ApplicationOperationDeclaration {
  readonly operationId: ApplicationOperationId;
  readonly consumer: string;
  readonly deadline: "consumer_budget";
  readonly stages: readonly ApplicationStageDeclaration[];
}

export const APPLICATION_OPERATIONS: readonly ApplicationOperationDeclaration[] = Object.freeze([
  operation("opponent.stockfish_play", "opponent.selection", [stage("select", "stockfish-play", "stockfish.legal_root_table@1")]),
  operation("opponent.maia_inference", "opponent.selection", [stage("select", "maia-inference", "maia.policy_page@1")]),
  operation("evidence.stockfish_analysis", "live.stockfish", [stage("analyse", "stockfish-analysis", "stockfish.position_evaluation@1")]),
  operation("evidence.tablebase_probe", "live.syzygy", [stage("probe", "tablebase-primary", "syzygy.position@1")]),
  operation("evidence.explorer_query", "human.explorer", [stage("query", "explorer-primary", "lichess_explorer.position_page@1")]),
  operation("render.voice", "guidance.voice", [stage("text", "external-voice", "external_voice.render@1", [], "always", "deterministic_renderer")]),
  operation("render.voice_compare", "guidance.voice_compare", [stage("text", "external-voice", "external_voice.render@1", [], "always", "deterministic_renderer")]),
  operation("render.voice_story", "guidance.voice_story", [stage("text", "external-voice", "external_voice.render@1", [], "always", "deterministic_renderer")]),
  operation("review.reasoning", "review.reasoning", [stage("review", "external-voice", "external_voice.reasoning_review@1")]),
  operation("render.speech", "guidance.speech", [stage("audio", "external-tts", "external_tts.synthesize@1", [], "always", "browser_speech_or_text")]),
]);

function operation(
  operationId: ApplicationOperationId,
  consumer: string,
  stages: readonly ApplicationStageDeclaration[],
): ApplicationOperationDeclaration {
  return Object.freeze({ operationId, consumer, deadline: "consumer_budget", stages: Object.freeze(stages) });
}

function stage(
  stageId: string,
  instanceId: ProviderInstanceId,
  exchangeOperation: ExchangeOperationId,
  dependsOn: readonly string[] = [],
  when: "always" | "audio_requested" = "always",
  fallback: ApplicationStageDeclaration["fallback"] = "none",
): ApplicationStageDeclaration {
  return Object.freeze({ stageId, instanceId, exchangeOperation, dependsOn: Object.freeze([...dependsOn]), when, fallback });
}

const EXCHANGE_INSTANCE: Readonly<Record<ExchangeOperationId, ProviderInstanceId>> = Object.freeze({
  "stockfish.legal_root_table@1": "stockfish-play",
  "stockfish.position_evaluation@1": "stockfish-analysis",
  "maia.policy_page@1": "maia-inference",
  "syzygy.position@1": "tablebase-primary",
  "lichess_explorer.position_page@1": "explorer-primary",
  "external_voice.render@1": "external-voice",
  "external_voice.reasoning_review@1": "external-voice",
  "external_tts.synthesize@1": "external-tts",
});

export function compileApplicationOperations(
  input: readonly ApplicationOperationDeclaration[],
): readonly ApplicationOperationDeclaration[] {
  const expected = new Set<string>(APPLICATION_OPERATION_OBLIGATIONS);
  const seen = new Set<string>();
  const consumers = new Set<string>();
  for (const row of input) {
    if (!expected.has(row.operationId) || seen.has(row.operationId)) throw new TypeError("APPLICATION_OPERATION_SET_MISMATCH");
    seen.add(row.operationId);
    if (row.deadline !== "consumer_budget" || row.consumer.length === 0) throw new TypeError("APPLICATION_OPERATION_BUDGET_MISSING");
    if (row.operationId !== "opponent.stockfish_play" && row.operationId !== "opponent.maia_inference" && consumers.has(row.consumer)) {
      throw new TypeError("APPLICATION_CONSUMER_DUPLICATE");
    }
    consumers.add(row.consumer);
    if (row.stages.length === 0) throw new TypeError("APPLICATION_STAGE_MISSING");
    const stageIds = new Set<string>();
    for (const item of row.stages) {
      if (stageIds.has(item.stageId)) throw new TypeError("APPLICATION_STAGE_DUPLICATE");
      if (!(EXCHANGE_OPERATION_IDS as readonly string[]).includes(item.exchangeOperation)) throw new TypeError("EXCHANGE_OPERATION_UNKNOWN");
      if (EXCHANGE_INSTANCE[item.exchangeOperation] !== item.instanceId) throw new TypeError("EXCHANGE_INSTANCE_MISMATCH");
      if (item.dependsOn.some((id) => !stageIds.has(id))) throw new TypeError("APPLICATION_STAGE_DEPENDENCY_ORDER");
      if (item.when === "audio_requested" && item.instanceId !== "external-tts") throw new TypeError("APPLICATION_STAGE_CONDITION_INVALID");
      stageIds.add(item.stageId);
    }
  }
  if (seen.size !== expected.size) throw new TypeError("APPLICATION_OPERATION_SET_MISMATCH");
  const speech = input.find((row) => row.operationId === "render.speech")!;
  if (speech.stages.length !== 1 || speech.stages[0]!.exchangeOperation !== "external_tts.synthesize@1") {
    throw new TypeError("SPEECH_MUST_CONSUME_SEALED_TEXT");
  }
  return Object.freeze([...input]);
}

export type ExchangeDelivery<T> = Readonly<{
  readonly operation: ExchangeOperationId;
  readonly normalizedRequestDigest: string;
  readonly generation: string;
  readonly payload: T;
}>;

export type StageSettlement<T = unknown> =
  | Readonly<{ kind: "success"; stageId: string; delivery: ExchangeDelivery<T> }>
  | Readonly<{ kind: "local_domain"; stageId: string; value: T }>
  | Readonly<{ kind: "failed"; stageId: string; reason: FailureReason }>
  | Readonly<{ kind: "cancelled"; stageId: string; reason: "caller" | "superseded" | "shutdown" }>
  | Readonly<{ kind: "skipped"; stageId: string; reason: "condition_false" | "dependency_failed" }>;

export type ApplicationOperationOutcome<T = unknown> =
  | Readonly<{ kind: "complete"; value: T; settlements: readonly StageSettlement[] }>
  | Readonly<{ kind: "fallback"; value: T; settlements: readonly StageSettlement[]; source: "deterministic_renderer" | "browser_speech_or_text" }>
  | Readonly<{ kind: "unavailable"; settlements: readonly StageSettlement[] }>
  | Readonly<{ kind: "cancelled"; settlements: readonly StageSettlement[]; reason: "caller" | "superseded" | "shutdown" }>;

export function settleOperation<T>(
  declaration: ApplicationOperationDeclaration,
  settlements: readonly StageSettlement[],
  value: T,
): ApplicationOperationOutcome<T> {
  if (settlements.length !== declaration.stages.length) throw new TypeError("STAGE_SETTLEMENT_CARDINALITY");
  for (let index = 0; index < declaration.stages.length; index += 1) {
    if (settlements[index]!.stageId !== declaration.stages[index]!.stageId) throw new TypeError("STAGE_SETTLEMENT_ORDER");
  }
  const cancelled = settlements.find((item) => item.kind === "cancelled");
  if (cancelled?.kind === "cancelled") return Object.freeze({ kind: "cancelled", settlements: Object.freeze([...settlements]), reason: cancelled.reason });
  const failed = settlements.find((item) => item.kind === "failed");
  if (failed !== undefined) {
    const stageDecl = declaration.stages[settlements.indexOf(failed)]!;
    if (stageDecl.fallback === "none") return Object.freeze({ kind: "unavailable", settlements: Object.freeze([...settlements]) });
    return Object.freeze({ kind: "fallback", value, settlements: Object.freeze([...settlements]), source: stageDecl.fallback });
  }
  return Object.freeze({ kind: "complete", value, settlements: Object.freeze([...settlements]) });
}

export type FailureReason = "startup" | "process_exit" | "timeout" | "network" | "rate_limited" | "overloaded" | "authentication" | "protocol";
type TransientReason = Extract<FailureReason, "timeout" | "network" | "rate_limited" | "overloaded">;
const TRANSIENT = new Set<FailureReason>(["timeout", "network", "rate_limited", "overloaded"]);
const RECOVERY_WINDOW_MS = 300_000;

export type ProviderCircuitState =
  | Readonly<{ state: "unverified"; generation: string; transientOpenTimes: readonly number[] }>
  | Readonly<{ state: "available"; generation: string; transientOpenTimes: readonly number[] }>
  | Readonly<{ state: "open"; generation: string; reason: FailureReason; retryAtMonotonic: number | null; transientOpenTimes: readonly number[]; halfOpenToken: string | null }>
  | Readonly<{ state: "recovering"; generation: string; priorReason: TransientReason; successes: 1; requiredSuccesses: 2; transientOpenTimes: readonly number[] }>;

function recentOpenTimes(times: readonly number[], now: number): readonly number[] {
  return Object.freeze(times.filter((time) => now - time < RECOVERY_WINDOW_MS));
}

export function circuitFailure(state: ProviderCircuitState, reason: FailureReason, now: number): ProviderCircuitState {
  const prior = recentOpenTimes(state.transientOpenTimes, now);
  const transientOpenTimes = TRANSIENT.has(reason) ? Object.freeze([...prior, now]) : prior;
  const retryAtMonotonic = reason === "authentication" || reason === "protocol" ? null : now + (reason === "rate_limited" ? 60_000 : 5_000);
  return Object.freeze({ state: "open", generation: state.generation, reason, retryAtMonotonic, transientOpenTimes, halfOpenToken: null });
}

export function claimHalfOpen(state: ProviderCircuitState, now: number, token: string): ProviderCircuitState {
  if (state.state !== "open" || state.halfOpenToken !== null || state.retryAtMonotonic === null || now < state.retryAtMonotonic) throw new TypeError("HALF_OPEN_NOT_ADMITTED");
  return Object.freeze({ ...state, halfOpenToken: token });
}

export function circuitSuccess(state: ProviderCircuitState, now: number, token?: string): ProviderCircuitState {
  const opens = recentOpenTimes(state.transientOpenTimes, now);
  if (state.state === "open") {
    if (state.halfOpenToken === null || token !== state.halfOpenToken) throw new TypeError("HALF_OPEN_TOKEN_STALE");
    if (opens.length >= 2 && TRANSIENT.has(state.reason)) return Object.freeze({ state: "recovering", generation: state.generation, priorReason: state.reason as TransientReason, successes: 1, requiredSuccesses: 2, transientOpenTimes: opens });
  }
  if (state.state === "recovering") return Object.freeze({ state: "available", generation: state.generation, transientOpenTimes: Object.freeze([]) });
  return Object.freeze({ state: "available", generation: state.generation, transientOpenTimes: opens });
}

export function changeGeneration(_state: ProviderCircuitState, generation: string): ProviderCircuitState {
  return Object.freeze({ state: "unverified", generation, transientOpenTimes: Object.freeze([]) });
}

export interface LeaseClaim { readonly token: string; readonly generationSet: string; readonly expiresAtMonotonic: number }
export interface BackoffLeaseState { readonly blockedUntilMonotonic: number; readonly claim: LeaseClaim | null }
export type LeaseAdmission = Readonly<{ kind: "acquired"; state: BackoffLeaseState }> | Readonly<{ kind: "blocked" | "claimed"; state: BackoffLeaseState }>;

export function acquireLease(state: BackoffLeaseState, now: number, generationSet: string, token: string, leaseMs: number): LeaseAdmission {
  const current = state.claim !== null && state.claim.expiresAtMonotonic > now ? state.claim : null;
  const normalized = Object.freeze({ blockedUntilMonotonic: state.blockedUntilMonotonic, claim: current });
  if (state.blockedUntilMonotonic > now) return Object.freeze({ kind: "blocked", state: normalized });
  if (current !== null) return Object.freeze({ kind: "claimed", state: normalized });
  return Object.freeze({ kind: "acquired", state: Object.freeze({ blockedUntilMonotonic: state.blockedUntilMonotonic, claim: Object.freeze({ token, generationSet, expiresAtMonotonic: now + leaseMs }) }) });
}

export function renewLease(state: BackoffLeaseState, now: number, generationSet: string, token: string, leaseMs: number): BackoffLeaseState {
  if (state.claim === null || state.claim.expiresAtMonotonic <= now || state.claim.token !== token || state.claim.generationSet !== generationSet) throw new TypeError("LEASE_TOKEN_STALE");
  return Object.freeze({ ...state, claim: Object.freeze({ token, generationSet, expiresAtMonotonic: now + leaseMs }) });
}

export function settleLease(state: BackoffLeaseState, now: number, generationSet: string, token: string, retryAfterMs: number | null): BackoffLeaseState {
  if (state.claim === null || state.claim.expiresAtMonotonic <= now || state.claim.token !== token || state.claim.generationSet !== generationSet) throw new TypeError("LEASE_TOKEN_STALE");
  return Object.freeze({ blockedUntilMonotonic: retryAfterMs === null ? state.blockedUntilMonotonic : Math.max(state.blockedUntilMonotonic, now + Math.max(60_000, retryAfterMs)), claim: null });
}

export interface CacheKey { readonly operation: ExchangeOperationId; readonly generation: string; readonly requestDigest: string; readonly keyDigest: string }
export interface CacheServiceReceipt { readonly keyDigest: string; readonly servedAtMonotonic: number; readonly source: "retained_exact" }
export type CacheResolution<T> = Readonly<{ kind: "miss" }> | Readonly<{ kind: "hit"; value: T; original: ExchangeDelivery<T>; cacheReceipt: CacheServiceReceipt }>;

function keyOf(key: CacheKey): string { return `${key.operation}\0${key.generation}\0${key.requestDigest}\0${key.keyDigest}`; }
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

export class AtomicExactCache<T> {
  readonly #rows = new Map<string, Readonly<{ key: CacheKey; value: T; original: ExchangeDelivery<T>; expiresAt: number }>>();
  put(key: CacheKey, value: T, original: ExchangeDelivery<T>, expiresAt: number): void {
    this.#rows.set(keyOf(key), deepFreeze({ key: { ...key }, value, original, expiresAt }));
  }
  resolve(key: CacheKey, now: number): CacheResolution<T> {
    const row = this.#rows.get(keyOf(key));
    if (row === undefined || now >= row.expiresAt) {
      if (row !== undefined) this.#rows.delete(keyOf(key));
      return Object.freeze({ kind: "miss" });
    }
    return deepFreeze({ kind: "hit", value: row.value, original: row.original, cacheReceipt: { keyDigest: key.keyDigest, servedAtMonotonic: now, source: "retained_exact" } });
  }
}

export interface PendingOpponentTurn {
  readonly runId: string;
  readonly learnerMoveEventSeq: number;
  readonly afterFen: string;
  readonly requestDigest: string;
  readonly policyDigest: string;
}
export type OpponentRecoveryState =
  | Readonly<{ state: "waiting"; pending: PendingOpponentTurn; attempt: number }>
  | Readonly<{ state: "failed"; pending: PendingOpponentTurn; failureEventSeq: number; reason: FailureReason; attempt: number }>
  | Readonly<{ state: "settled"; pending: PendingOpponentTurn; opponentMoveEventSeq: number }>;

export type OpponentRecoveryEvent =
  | Readonly<{ type: "opponent.selection_failed"; learnerMoveEventSeq: number; requestDigest: string; reason: FailureReason }>
  | Readonly<{ type: "opponent.recovery_requested"; failureEventSeq: number; idempotencyKey: string; action: "retry"; requestDigest: string }>
  | Readonly<{ type: "opponent.recovery_requested"; failureEventSeq: number; idempotencyKey: string; action: "change"; fromPolicyDigest: string; toPolicyDigest: string }>;

export function failOpponent(state: OpponentRecoveryState, failureEventSeq: number, reason: FailureReason): OpponentRecoveryState {
  if (state.state !== "waiting") throw new TypeError("OPPONENT_NOT_WAITING");
  return Object.freeze({ state: "failed", pending: state.pending, failureEventSeq, reason, attempt: state.attempt });
}

export function retryOpponent(state: OpponentRecoveryState, requestDigest: string): OpponentRecoveryState {
  if (state.state !== "failed" || requestDigest !== state.pending.requestDigest) throw new TypeError("OPPONENT_RETRY_IDENTITY_MISMATCH");
  return Object.freeze({ state: "waiting", pending: state.pending, attempt: state.attempt + 1 });
}

export function changeOpponent(state: OpponentRecoveryState, toPolicyDigest: string, nextRequestDigest: string): OpponentRecoveryState {
  if (state.state !== "failed" || toPolicyDigest === state.pending.policyDigest) throw new TypeError("OPPONENT_CHANGE_INVALID");
  return Object.freeze({ state: "waiting", pending: Object.freeze({ ...state.pending, policyDigest: toPolicyDigest, requestDigest: nextRequestDigest }), attempt: 1 });
}

export interface SealedTextRef { readonly textDigest: string; readonly runId: string; readonly nodeId: string; readonly scope: "marker" | "reading" | "steering" | "story" | "compare" }
const sealedTextRefs = new WeakSet<object>();
export function sealRenderedText(input: SealedTextRef): SealedTextRef {
  const sealed = Object.freeze({ ...input });
  sealedTextRefs.add(sealed);
  return sealed;
}
export function requireSealedText(input: SealedTextRef): SealedTextRef {
  if (!sealedTextRefs.has(input)) throw new TypeError("SPEECH_TEXT_NOT_SEALED");
  return input;
}
