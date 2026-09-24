/**
 * Provider health — the closed declarations, the shared `/capabilities` wire type and its strict
 * parser, and the learner-facing projection selectors (rfc/provider-health-degradation.md §1, §2,
 * §8, §9, §10).
 *
 * The server's `ProviderRegistry` (apps/server/src/provider-health.ts) is the only authority that
 * PRODUCES these values; this module is the one wire vocabulary both the server producer and the
 * web client import, so a state, reason, instance or mode that exists on one side and not the other
 * fails the shared parser rather than being widened or dropped.
 */
import { isCanonicalUtcIso } from "./provider-exchange.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { RUN_OPPONENT_MODES, type RunOpponentMode } from "./types.js";
import type { ProviderOperationId } from "./provider-types.js";
import type { AvailabilityState, ServerEvidenceAvailabilityReceipt } from "./assistance-exchange.js";

// ---------------------------------------------------------------------------------------------
// §1 Closed identities — every set below is derived from PROVIDER_INSTANCE_DECLARATIONS.
// ---------------------------------------------------------------------------------------------

export const PROVIDER_IMPLEMENTATIONS = Object.freeze(["uci_sidecar", "lichess_http", "external_http", "local_service", "local_fixture"] as const);
export type ProviderImplementation = (typeof PROVIDER_IMPLEMENTATIONS)[number];

export const PROVIDER_BACKOFF_GROUP_IDS = Object.freeze(["lichess-api", "external-voice-api", "external-tts-api"] as const);
export type ProviderBackoffGroupId = (typeof PROVIDER_BACKOFF_GROUP_IDS)[number];

export const PROVIDER_INSTANCE_DECLARATIONS = Object.freeze([
  Object.freeze({ instanceId: "stockfish-play", familyId: "stockfish", allowedImplementations: Object.freeze(["uci_sidecar", "local_fixture"] as const), backoffGroup: null }),
  Object.freeze({ instanceId: "stockfish-analysis", familyId: "stockfish", allowedImplementations: Object.freeze(["uci_sidecar", "local_fixture"] as const), backoffGroup: null }),
  Object.freeze({ instanceId: "maia-inference", familyId: "maia", allowedImplementations: Object.freeze(["uci_sidecar", "local_fixture"] as const), backoffGroup: null }),
  Object.freeze({ instanceId: "tablebase-primary", familyId: "tablebase", allowedImplementations: Object.freeze(["lichess_http", "local_service", "local_fixture"] as const), backoffGroup: "lichess-api" }),
  Object.freeze({ instanceId: "explorer-primary", familyId: "explorer", allowedImplementations: Object.freeze(["lichess_http", "local_service", "local_fixture"] as const), backoffGroup: "lichess-api" }),
  Object.freeze({ instanceId: "external-voice", familyId: "voice", allowedImplementations: Object.freeze(["external_http", "local_fixture"] as const), backoffGroup: "external-voice-api" }),
  Object.freeze({ instanceId: "external-tts", familyId: "tts", allowedImplementations: Object.freeze(["external_http", "local_fixture"] as const), backoffGroup: "external-tts-api" }),
] as const);

type InstanceDeclaration = (typeof PROVIDER_INSTANCE_DECLARATIONS)[number];
export type ProviderInstanceId = InstanceDeclaration["instanceId"];
export type ProviderFamilyId = InstanceDeclaration["familyId"];

export const PROVIDER_INSTANCE_IDS: readonly ProviderInstanceId[] = Object.freeze(PROVIDER_INSTANCE_DECLARATIONS.map((row) => row.instanceId));
export const PROVIDER_FAMILY_IDS: readonly ProviderFamilyId[] = Object.freeze([...new Set(PROVIDER_INSTANCE_DECLARATIONS.map((row) => row.familyId))]);

export function providerInstanceDeclaration(instanceId: ProviderInstanceId): InstanceDeclaration {
  const row = PROVIDER_INSTANCE_DECLARATIONS.find((candidate) => candidate.instanceId === instanceId);
  if (row === undefined) throw new TypeError(`Unknown provider instance ${String(instanceId)}`);
  return row;
}

/** Group membership is compiled from the declaration tuple; there is no second hand map. */
export function providerBackoffGroupMembers(group: ProviderBackoffGroupId): readonly ProviderInstanceId[] {
  return Object.freeze(PROVIDER_INSTANCE_DECLARATIONS.filter((row) => row.backoffGroup === group).map((row) => row.instanceId));
}

/**
 * The three external exchange identities this RFC needs the provider-protocol successor to
 * register (§4). They are declared here so the execution tuple is total; they are NOT members of
 * the provider-protocol resource until that lane is claimed (reported, not simulated).
 */
export const EXTERNAL_EXCHANGE_OPERATION_IDS = Object.freeze(["external_voice.render@1", "external_voice.reasoning_review@1", "external_tts.synthesize@1"] as const);
export type ExternalExchangeOperationId = (typeof EXTERNAL_EXCHANGE_OPERATION_IDS)[number];

export type ApplicationProviderFallback = "none" | "deterministic_renderer" | "browser_speech_or_text";

/** §8: exactly ten application operations, each with ONE provider stage and a consumer budget. */
const EXECUTION_ROWS = [
  { operation: "opponent.stockfish_play", consumer: "opponent.selection", stageId: "select:stockfish-play", instanceId: "stockfish-play", exchangeOperation: "stockfish.legal_root_table@1", fallback: "none" },
  { operation: "opponent.maia_inference", consumer: "opponent.selection", stageId: "select:maia-inference", instanceId: "maia-inference", exchangeOperation: "maia.policy_page@1", fallback: "none" },
  { operation: "evidence.stockfish_analysis", consumer: "runtime.evidence_ref", stageId: "analyse:stockfish-analysis", instanceId: "stockfish-analysis", exchangeOperation: "stockfish.position_evaluation@1", fallback: "none" },
  { operation: "evidence.tablebase_probe", consumer: "opponent.selection", stageId: "probe:tablebase-primary", instanceId: "tablebase-primary", exchangeOperation: "syzygy.position@1", fallback: "none" },
  { operation: "evidence.explorer_query", consumer: "inspector.corpus", stageId: "query:explorer-primary", instanceId: "explorer-primary", exchangeOperation: "lichess_explorer.position_page@1", fallback: "none" },
  { operation: "render.voice", consumer: "guidance.voice", stageId: "text:external-voice", instanceId: "external-voice", exchangeOperation: "external_voice.render@1", fallback: "deterministic_renderer" },
  { operation: "render.voice_compare", consumer: "guidance.voice_compare", stageId: "text:external-voice", instanceId: "external-voice", exchangeOperation: "external_voice.render@1", fallback: "deterministic_renderer" },
  { operation: "render.voice_story", consumer: "guidance.voice_story", stageId: "text:external-voice", instanceId: "external-voice", exchangeOperation: "external_voice.render@1", fallback: "deterministic_renderer" },
  { operation: "review.reasoning", consumer: "guidance.voice", stageId: "review:external-voice", instanceId: "external-voice", exchangeOperation: "external_voice.reasoning_review@1", fallback: "none" },
  { operation: "render.speech", consumer: "guidance.voice", stageId: "audio:external-tts", instanceId: "external-tts", exchangeOperation: "external_tts.synthesize@1", fallback: "browser_speech_or_text" },
] as const;

export type ApplicationProviderOperationId = (typeof EXECUTION_ROWS)[number]["operation"];

export interface ApplicationProviderExecution {
  readonly operation: ApplicationProviderOperationId;
  readonly consumer: string;
  readonly stageId: string;
  readonly instanceId: ProviderInstanceId;
  readonly exchangeOperation: ProviderOperationId | ExternalExchangeOperationId;
  readonly fallback: ApplicationProviderFallback;
  /** The compiled F1 consumer latency ceiling; one deadline covers queue, retry and fallback. */
  readonly consumerBudgetMs: number;
}

/**
 * Compiles the execution tuple against the F1 manifest. A consumer that is not declared, has no
 * interactive/sync latency ceiling, or a row whose instance is undeclared fails at module load.
 */
export function compileApplicationProviderExecution(rows: readonly Omit<ApplicationProviderExecution, "consumerBudgetMs">[]): readonly ApplicationProviderExecution[] {
  const seen = new Set<string>();
  const compiled = rows.map((row) => {
    if (seen.has(row.operation)) throw new TypeError(`duplicate application provider operation ${row.operation}`);
    seen.add(row.operation);
    if (!PROVIDER_INSTANCE_IDS.includes(row.instanceId)) throw new TypeError(`${row.operation} names undeclared instance ${String(row.instanceId)}`);
    if (!row.stageId.endsWith(`:${row.instanceId}`)) throw new TypeError(`${row.operation} stage ${row.stageId} does not name its instance`);
    const consumer = PRIMARY_EVIDENCE_MANIFEST.consumers.find((candidate) => candidate.id === row.consumer);
    if (consumer === undefined) throw new TypeError(`${row.operation} names unknown consumer ${row.consumer}`);
    const budget = consumer.latency.maxMs;
    if (budget === null || !Number.isSafeInteger(budget) || budget < 1) throw new TypeError(`${row.operation} consumer ${row.consumer} has no consumer-budget deadline`);
    if (row.instanceId === "external-voice" && row.fallback === "browser_speech_or_text") throw new TypeError("voice cannot fall back to speech");
    if (row.instanceId !== "external-tts" && row.fallback === "browser_speech_or_text") throw new TypeError(`${row.operation} declares an illegal fallback`);
    return Object.freeze({ ...row, consumerBudgetMs: budget });
  });
  return Object.freeze(compiled);
}

export const APPLICATION_PROVIDER_EXECUTION: readonly ApplicationProviderExecution[] = compileApplicationProviderExecution(EXECUTION_ROWS);
export const APPLICATION_PROVIDER_OPERATION_IDS: readonly ApplicationProviderOperationId[] = Object.freeze(APPLICATION_PROVIDER_EXECUTION.map((row) => row.operation));

export function applicationProviderExecution(operation: ApplicationProviderOperationId): ApplicationProviderExecution {
  const row = APPLICATION_PROVIDER_EXECUTION.find((candidate) => candidate.operation === operation);
  if (row === undefined) throw new TypeError(`Unknown application provider operation ${String(operation)}`);
  return row;
}

/** §8 F1 producer → provider instance, closed. */
export const F1_PROVIDER_PRODUCERS = Object.freeze({
  "live.stockfish": "stockfish-analysis",
  "live.syzygy": "tablebase-primary",
  "human.maia": "maia-inference",
  "human.explorer": "explorer-primary",
} as const satisfies Readonly<Record<string, ProviderInstanceId>>);

/** Opponent modes → the application operations each one needs. */
export const POLICY_MODE_OPERATIONS = Object.freeze({
  human_common: Object.freeze(["opponent.maia_inference"] as const),
  theory_strict: Object.freeze(["opponent.maia_inference"] as const),
  strong_engine: Object.freeze(["opponent.stockfish_play"] as const),
  perfect_tablebase: Object.freeze(["evidence.tablebase_probe"] as const),
  practical_resistance: Object.freeze(["evidence.tablebase_probe", "opponent.maia_inference"] as const),
} as const satisfies Readonly<Record<RunOpponentMode, readonly ApplicationProviderOperationId[]>>);

// ---------------------------------------------------------------------------------------------
// §2 State model — state-specific snapshot arms
// ---------------------------------------------------------------------------------------------

export const PROVIDER_FAILURE_REASONS = Object.freeze(["startup", "process_exit", "timeout", "network", "rate_limited", "overloaded", "authentication", "protocol", "cancelled_by_shutdown"] as const);
export type ProviderFailureReason = (typeof PROVIDER_FAILURE_REASONS)[number];

export const PROVIDER_HEALTH_STATES = Object.freeze(["not_configured", "unverified", "recovering", "available", "degraded_cached_only", "unavailable"] as const);
export type ProviderHealthState = (typeof PROVIDER_HEALTH_STATES)[number];

export interface ProviderTimes {
  readonly checkedAt: string;
  readonly lastSuccessAt: string | null;
  readonly lastFailureAt: string | null;
}

interface SnapshotBase { readonly instanceId: ProviderInstanceId; readonly familyId: ProviderFamilyId }
interface ConfiguredBase extends SnapshotBase { readonly implementation: ProviderImplementation; readonly generation: string }

export type ProviderHealthSnapshot =
  | (SnapshotBase & { readonly state: "not_configured" })
  | (ConfiguredBase & { readonly state: "unverified"; readonly retryAfterMs: null })
  | (ConfiguredBase & ProviderTimes & { readonly state: "recovering"; readonly priorReason: ProviderFailureReason; readonly consecutiveSuccesses: 1; readonly requiredSuccesses: 2 })
  | (ConfiguredBase & ProviderTimes & { readonly state: "available"; readonly reason: null })
  | (ConfiguredBase & ProviderTimes & { readonly state: "degraded_cached_only"; readonly reason: ProviderFailureReason; readonly retryAfterMs: number | null; readonly cacheScope: "exact_request"; readonly validExactEntries: number; readonly cacheRevision: number })
  | (ConfiguredBase & ProviderTimes & { readonly state: "unavailable"; readonly reason: ProviderFailureReason; readonly retryAfterMs: number | null; readonly cacheScope: "none" });

export type ProviderOperationAvailability =
  | { readonly state: "available"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "requestable_unverified"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "recovering"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "conditional_exact_cache"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "cached_exact_only"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "temporarily_blocked"; readonly instanceIds: readonly ProviderInstanceId[]; readonly reason: "upstream_backoff" | "group_claimed"; readonly retryAfterMs: number }
  | { readonly state: "unavailable"; readonly instanceIds: readonly ProviderInstanceId[]; readonly reason: ProviderFailureReason | "not_configured" };

export const PROVIDER_OPERATION_AVAILABILITY_STATES = Object.freeze(["available", "requestable_unverified", "recovering", "conditional_exact_cache", "cached_exact_only", "temporarily_blocked", "unavailable"] as const);

/** The `/capabilities` provider-health section (§9). One wire type; one strict parser. */
export interface ProviderHealthCapabilities {
  readonly generatedAt: string;
  readonly providers: readonly ProviderHealthSnapshot[];
  readonly operations: readonly { readonly operation: ApplicationProviderOperationId; readonly availability: ProviderOperationAvailability }[];
  readonly policyModes: readonly { readonly mode: RunOpponentMode; readonly availability: ProviderOperationAvailability }[];
}

// ---------------------------------------------------------------------------------------------
// Pure projections shared by the server producer and client selectors
// ---------------------------------------------------------------------------------------------

/** Projects one instance snapshot to request-free operation availability (no group state). */
export function instanceOperationAvailability(snapshot: ProviderHealthSnapshot): ProviderOperationAvailability {
  const instanceIds = Object.freeze([snapshot.instanceId]);
  switch (snapshot.state) {
    case "not_configured": return Object.freeze({ state: "unavailable", instanceIds, reason: "not_configured" });
    case "unverified": return Object.freeze({ state: "requestable_unverified", instanceIds });
    case "recovering": return Object.freeze({ state: "recovering", instanceIds });
    case "available": return Object.freeze({ state: "available", instanceIds });
    case "degraded_cached_only": return Object.freeze({ state: "conditional_exact_cache", instanceIds });
    case "unavailable": return Object.freeze({ state: "unavailable", instanceIds, reason: snapshot.reason });
  }
}

const SEVERITY: Readonly<Record<ProviderOperationAvailability["state"], number>> = Object.freeze({
  available: 0, requestable_unverified: 1, recovering: 2, cached_exact_only: 3, conditional_exact_cache: 4, temporarily_blocked: 5, unavailable: 6,
});

/** A mode needing several operations is as available as its least available member. */
export function combineOperationAvailability(values: readonly ProviderOperationAvailability[]): ProviderOperationAvailability {
  if (values.length === 0) throw new TypeError("combineOperationAvailability requires at least one availability");
  const instanceIds = Object.freeze([...new Set(values.flatMap((value) => value.instanceIds))].sort() as ProviderInstanceId[]);
  const worst = [...values].sort((left, right) => SEVERITY[right.state] - SEVERITY[left.state])[0]!;
  if (worst.state === "temporarily_blocked") {
    const retryAfterMs = Math.max(...values.flatMap((value) => value.state === "temporarily_blocked" ? [value.retryAfterMs] : []));
    return Object.freeze({ state: "temporarily_blocked", instanceIds, reason: worst.reason, retryAfterMs });
  }
  if (worst.state === "unavailable") return Object.freeze({ state: "unavailable", instanceIds, reason: worst.reason });
  return Object.freeze({ state: worst.state, instanceIds });
}

/** Whether the operation may issue a NEW live request right now (cache-only is not general service). */
export function availabilityAdmitsNewRequest(availability: ProviderOperationAvailability): boolean {
  return availability.state === "available" || availability.state === "requestable_unverified" || availability.state === "recovering";
}

/** Outright unsupported (server started without the capability) versus a runtime state. */
export function availabilityIsNotConfigured(availability: ProviderOperationAvailability): boolean {
  return availability.state === "unavailable" && availability.reason === "not_configured";
}

// ---------------------------------------------------------------------------------------------
// §10 learner projection — shared selector; ordinary copy never carries provider JSON
// ---------------------------------------------------------------------------------------------

export type ProviderNoticeTone = "ready" | "neutral" | "degraded" | "unavailable";

export interface ProviderAvailabilityNotice {
  /** The ordinary control may issue a new request. */
  readonly requestable: boolean;
  /** The deployment was started without this capability (outright unsupported). */
  readonly notConfigured: boolean;
  readonly tone: ProviderNoticeTone;
  /** Short state label, e.g. "Ready to try". */
  readonly label: string;
  /** One sentence for the reason line beside the control; empty when ready. */
  readonly reason: string;
  /** Milliseconds before a retry can help, when known. */
  readonly retryAfterMs: number | null;
  /** Whether a Retry affordance makes sense (runtime state, not configuration). */
  readonly retryable: boolean;
}

const FAILURE_COPY: Readonly<Record<ProviderFailureReason, string>> = Object.freeze({
  startup: "is still starting",
  process_exit: "has stopped and is being restarted",
  timeout: "did not answer in time",
  network: "could not be reached",
  rate_limited: "asked us to slow down",
  overloaded: "is overloaded",
  authentication: "rejected this deployment's credentials",
  protocol: "sent an answer that could not be read",
  cancelled_by_shutdown: "is shutting down with the server",
});

export function providerFailureCopy(reason: ProviderFailureReason): string {
  return FAILURE_COPY[reason];
}

/**
 * Translates an operation's availability into the task-level notice a control renders beside
 * itself. `subject` names the task ("The opponent", "Human-game statistics", …); it is never a
 * provider or model name.
 */
export function providerAvailabilityNotice(availability: ProviderOperationAvailability, subject: string): ProviderAvailabilityNotice {
  switch (availability.state) {
    case "available":
      return Object.freeze({ requestable: true, notConfigured: false, tone: "ready", label: "Ready", reason: "", retryAfterMs: null, retryable: false });
    case "requestable_unverified":
      return Object.freeze({ requestable: true, notConfigured: false, tone: "neutral", label: "Ready to try", reason: "", retryAfterMs: null, retryable: false });
    case "recovering":
      return Object.freeze({ requestable: true, notConfigured: false, tone: "degraded", label: "Recovering", reason: `${subject} is recovering after a failure; answers may be slow.`, retryAfterMs: null, retryable: false });
    case "conditional_exact_cache":
      return Object.freeze({ requestable: false, notConfigured: false, tone: "degraded", label: "Saved responses only", reason: `${subject} is unavailable right now; only responses saved for exact positions can be shown.`, retryAfterMs: null, retryable: true });
    case "cached_exact_only":
      return Object.freeze({ requestable: false, notConfigured: false, tone: "degraded", label: "Saved response", reason: "Using a saved response for this position.", retryAfterMs: null, retryable: true });
    case "temporarily_blocked": {
      const seconds = Math.max(1, Math.ceil(availability.retryAfterMs / 1000));
      return Object.freeze({ requestable: false, notConfigured: false, tone: "degraded", label: "Paused briefly", reason: `${subject} is paused because the upstream service asked us to wait; try again in about ${seconds} s.`, retryAfterMs: availability.retryAfterMs, retryable: true });
    }
    case "unavailable":
      if (availability.reason === "not_configured") {
        return Object.freeze({ requestable: false, notConfigured: true, tone: "unavailable", label: "Not on this deployment", reason: `${subject} is not configured on this deployment.`, retryAfterMs: null, retryable: false });
      }
      return Object.freeze({ requestable: false, notConfigured: false, tone: "unavailable", label: "Unavailable right now", reason: `${subject} is unavailable right now: the service ${FAILURE_COPY[availability.reason]}.`, retryAfterMs: null, retryable: true });
  }
}

/** The operation availability row, or `unavailable(not_configured)` when capabilities are absent. */
export function capabilityOperationAvailability(health: ProviderHealthCapabilities | undefined, operation: ApplicationProviderOperationId): ProviderOperationAvailability {
  const row = health?.operations.find((candidate) => candidate.operation === operation);
  return row?.availability ?? Object.freeze({ state: "unavailable", instanceIds: Object.freeze([applicationProviderExecution(operation).instanceId]), reason: "not_configured" });
}

export function capabilityModeAvailability(health: ProviderHealthCapabilities | undefined, mode: RunOpponentMode): ProviderOperationAvailability {
  const row = health?.policyModes.find((candidate) => candidate.mode === mode);
  return row?.availability ?? combineOperationAvailability(POLICY_MODE_OPERATIONS[mode].map((operation) => capabilityOperationAvailability(health, operation)));
}

/**
 * The assistance compiler's availability receipt, derived from the live snapshot rather than
 * constructor presence (§8; criterion 18). Anything that cannot take a new request is unavailable
 * with its health reason; a runtime failure is `failed`, not-configured is `unavailable`.
 */
export function serverAvailabilityFromProviderHealth(health: ProviderHealthCapabilities | undefined): ServerEvidenceAvailabilityReceipt {
  const state = (operation: ApplicationProviderOperationId): AvailabilityState => {
    const availability = capabilityOperationAvailability(health, operation);
    if (availabilityAdmitsNewRequest(availability)) return Object.freeze({ state: "available" });
    if (availability.state === "unavailable") return availability.reason === "not_configured"
      ? Object.freeze({ state: "unavailable", reason: "not_configured" })
      : Object.freeze({ state: "failed", reason: availability.reason });
    return Object.freeze({ state: "unavailable", reason: availability.state });
  };
  return Object.freeze({
    llm: state("render.voice"),
    tts: state("render.speech"),
    stockfish: state("evidence.stockfish_analysis"),
    syzygy: state("evidence.tablebase_probe"),
    maia: state("opponent.maia_inference"),
    explorer: state("evidence.explorer_query"),
  });
}

// ---------------------------------------------------------------------------------------------
// §9 strict parser — every arm rejects missing and extra keys
// ---------------------------------------------------------------------------------------------

export class ProviderHealthWireError extends TypeError {
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "ProviderHealthWireError";
  }
}

type Obj = Readonly<Record<string, unknown>>;

function obj(value: unknown, path: string): Obj {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new ProviderHealthWireError(path, "must be an object");
  return value as Obj;
}

function exact(value: Obj, keys: readonly string[], path: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new ProviderHealthWireError(path, `must have exactly ${expected.join(", ")}; received ${actual.join(", ")}`);
  }
}

function member<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) throw new ProviderHealthWireError(path, `must be one of ${allowed.join(", ")}`);
  return value as T;
}

function time(value: unknown, path: string): string {
  if (typeof value !== "string" || !isCanonicalUtcIso(value)) throw new ProviderHealthWireError(path, "must be a canonical UTC timestamp");
  return value;
}

function nullableTime(value: unknown, path: string): string | null {
  return value === null ? null : time(value, path);
}

function nonNegative(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new ProviderHealthWireError(path, "must be a non-negative safe integer");
  return value;
}

function nullableNonNegative(value: unknown, path: string): number | null {
  return value === null ? null : nonNegative(value, path);
}

const GENERATION = /^sha256:[0-9a-f]{64}$/u;

function generation(value: unknown, path: string): string {
  if (typeof value !== "string" || !GENERATION.test(value)) throw new ProviderHealthWireError(path, "must be a sha256 generation digest");
  return value;
}

const TIME_KEYS = ["checkedAt", "lastSuccessAt", "lastFailureAt"] as const;
const CONFIGURED_KEYS = ["instanceId", "familyId", "state", "implementation", "generation"] as const;

export function parseProviderHealthSnapshot(value: unknown, path = "providerHealth/providers"): ProviderHealthSnapshot {
  const item = obj(value, path);
  const instanceId = member(item.instanceId, PROVIDER_INSTANCE_IDS, `${path}/instanceId`);
  const declaration = providerInstanceDeclaration(instanceId);
  if (item.familyId !== declaration.familyId) throw new ProviderHealthWireError(`${path}/familyId`, `must be ${declaration.familyId} for ${instanceId}`);
  const state = member(item.state, PROVIDER_HEALTH_STATES, `${path}/state`);
  if (state === "not_configured") {
    exact(item, ["instanceId", "familyId", "state"], path);
    return Object.freeze({ instanceId, familyId: declaration.familyId, state });
  }
  const implementation = member(item.implementation, declaration.allowedImplementations as readonly ProviderImplementation[], `${path}/implementation`);
  const base = { instanceId, familyId: declaration.familyId, implementation, generation: generation(item.generation, `${path}/generation`) };
  if (state === "unverified") {
    exact(item, [...CONFIGURED_KEYS, "retryAfterMs"], path);
    if (item.retryAfterMs !== null) throw new ProviderHealthWireError(`${path}/retryAfterMs`, "must be null while unverified");
    return Object.freeze({ ...base, state, retryAfterMs: null });
  }
  const times = { checkedAt: time(item.checkedAt, `${path}/checkedAt`), lastSuccessAt: nullableTime(item.lastSuccessAt, `${path}/lastSuccessAt`), lastFailureAt: nullableTime(item.lastFailureAt, `${path}/lastFailureAt`) };
  if (state === "recovering") {
    exact(item, [...CONFIGURED_KEYS, ...TIME_KEYS, "priorReason", "consecutiveSuccesses", "requiredSuccesses"], path);
    if (item.consecutiveSuccesses !== 1 || item.requiredSuccesses !== 2) throw new ProviderHealthWireError(path, "recovering must be 1 of 2 consecutive successes");
    return Object.freeze({ ...base, ...times, state, priorReason: member(item.priorReason, PROVIDER_FAILURE_REASONS, `${path}/priorReason`), consecutiveSuccesses: 1, requiredSuccesses: 2 });
  }
  if (state === "available") {
    exact(item, [...CONFIGURED_KEYS, ...TIME_KEYS, "reason"], path);
    if (item.reason !== null) throw new ProviderHealthWireError(`${path}/reason`, "must be null while available");
    return Object.freeze({ ...base, ...times, state, reason: null });
  }
  const reason = member(item.reason, PROVIDER_FAILURE_REASONS, `${path}/reason`);
  const retryAfterMs = nullableNonNegative(item.retryAfterMs, `${path}/retryAfterMs`);
  if (state === "degraded_cached_only") {
    exact(item, [...CONFIGURED_KEYS, ...TIME_KEYS, "reason", "retryAfterMs", "cacheScope", "validExactEntries", "cacheRevision"], path);
    if (item.cacheScope !== "exact_request") throw new ProviderHealthWireError(`${path}/cacheScope`, "must be exact_request");
    const validExactEntries = nonNegative(item.validExactEntries, `${path}/validExactEntries`);
    if (validExactEntries < 1) throw new ProviderHealthWireError(`${path}/validExactEntries`, "cache-only requires at least one valid entry");
    return Object.freeze({ ...base, ...times, state, reason, retryAfterMs, cacheScope: "exact_request", validExactEntries, cacheRevision: nonNegative(item.cacheRevision, `${path}/cacheRevision`) });
  }
  exact(item, [...CONFIGURED_KEYS, ...TIME_KEYS, "reason", "retryAfterMs", "cacheScope"], path);
  if (item.cacheScope !== "none") throw new ProviderHealthWireError(`${path}/cacheScope`, "must be none while unavailable");
  return Object.freeze({ ...base, ...times, state, reason, retryAfterMs, cacheScope: "none" });
}

function instanceIdList(value: unknown, path: string): readonly ProviderInstanceId[] {
  if (!Array.isArray(value) || value.length === 0) throw new ProviderHealthWireError(path, "must be a non-empty array");
  const ids = value.map((item, index) => member(item, PROVIDER_INSTANCE_IDS, `${path}/${index}`));
  if (new Set(ids).size !== ids.length) throw new ProviderHealthWireError(path, "must not repeat an instance");
  return Object.freeze(ids);
}

export function parseProviderOperationAvailability(value: unknown, path: string): ProviderOperationAvailability {
  const item = obj(value, path);
  const state = member(item.state, PROVIDER_OPERATION_AVAILABILITY_STATES, `${path}/state`);
  const instanceIds = instanceIdList(item.instanceIds, `${path}/instanceIds`);
  if (state === "temporarily_blocked") {
    exact(item, ["state", "instanceIds", "reason", "retryAfterMs"], path);
    return Object.freeze({ state, instanceIds, reason: member(item.reason, ["upstream_backoff", "group_claimed"] as const, `${path}/reason`), retryAfterMs: nonNegative(item.retryAfterMs, `${path}/retryAfterMs`) });
  }
  if (state === "unavailable") {
    exact(item, ["state", "instanceIds", "reason"], path);
    return Object.freeze({ state, instanceIds, reason: member(item.reason, [...PROVIDER_FAILURE_REASONS, "not_configured"] as const, `${path}/reason`) });
  }
  if (state === "cached_exact_only") throw new ProviderHealthWireError(`${path}/state`, "cached_exact_only exists only for one exact request and is never serialized by a requestless read");
  exact(item, ["state", "instanceIds"], path);
  return Object.freeze({ state, instanceIds });
}

function expectedInstances(operations: readonly ApplicationProviderOperationId[]): readonly ProviderInstanceId[] {
  return [...new Set(operations.map((operation) => applicationProviderExecution(operation).instanceId))].sort();
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function parseProviderHealthCapabilities(value: unknown, path = "providerHealth"): ProviderHealthCapabilities {
  const item = obj(value, path);
  exact(item, ["generatedAt", "providers", "operations", "policyModes"], path);
  const generatedAt = time(item.generatedAt, `${path}/generatedAt`);
  if (!Array.isArray(item.providers)) throw new ProviderHealthWireError(`${path}/providers`, "must be an array");
  const providers = item.providers.map((row, index) => parseProviderHealthSnapshot(row, `${path}/providers/${index}`));
  if (!sameSet(providers.map((row) => row.instanceId), PROVIDER_INSTANCE_IDS) || providers.length !== PROVIDER_INSTANCE_IDS.length) {
    throw new ProviderHealthWireError(`${path}/providers`, `must contain each of ${PROVIDER_INSTANCE_IDS.join(", ")} exactly once`);
  }
  if (!Array.isArray(item.operations)) throw new ProviderHealthWireError(`${path}/operations`, "must be an array");
  const operations = item.operations.map((row, index) => {
    const entry = obj(row, `${path}/operations/${index}`);
    exact(entry, ["operation", "availability"], `${path}/operations/${index}`);
    const operation = member(entry.operation, APPLICATION_PROVIDER_OPERATION_IDS, `${path}/operations/${index}/operation`);
    const availability = parseProviderOperationAvailability(entry.availability, `${path}/operations/${index}/availability`);
    if (!sameSet(availability.instanceIds, expectedInstances([operation]))) throw new ProviderHealthWireError(`${path}/operations/${index}/availability/instanceIds`, `must be the declared population of ${operation}`);
    return Object.freeze({ operation, availability });
  });
  if (operations.length !== APPLICATION_PROVIDER_OPERATION_IDS.length || !sameSet(operations.map((row) => row.operation), APPLICATION_PROVIDER_OPERATION_IDS)) {
    throw new ProviderHealthWireError(`${path}/operations`, "must contain each application provider operation exactly once");
  }
  if (!Array.isArray(item.policyModes)) throw new ProviderHealthWireError(`${path}/policyModes`, "must be an array");
  const policyModes = item.policyModes.map((row, index) => {
    const entry = obj(row, `${path}/policyModes/${index}`);
    exact(entry, ["mode", "availability"], `${path}/policyModes/${index}`);
    const mode = member(entry.mode, RUN_OPPONENT_MODES, `${path}/policyModes/${index}/mode`);
    const availability = parseProviderOperationAvailability(entry.availability, `${path}/policyModes/${index}/availability`);
    if (!sameSet(availability.instanceIds, expectedInstances(POLICY_MODE_OPERATIONS[mode]))) throw new ProviderHealthWireError(`${path}/policyModes/${index}/availability/instanceIds`, `must be the declared population of ${mode}`);
    return Object.freeze({ mode, availability });
  });
  if (policyModes.length !== RUN_OPPONENT_MODES.length || !sameSet(policyModes.map((row) => row.mode), RUN_OPPONENT_MODES)) {
    throw new ProviderHealthWireError(`${path}/policyModes`, "must contain each opponent mode exactly once");
  }
  return Object.freeze({ generatedAt, providers: Object.freeze(providers), operations: Object.freeze(operations), policyModes: Object.freeze(policyModes) });
}
