import { createHash } from "node:crypto";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

import {
  applicationProviderExecution,
  assertConsumerEvidenceView,
  opponentProviderEvidence as declareOpponentProviderEvidence,
  evidenceForConsumer,
  PolicyMassError,
  humanConcessionMass,
  exactLegalMoves,
  normalizeInboundMove,
  transposeKey,
  type OpponentSelection,
  type RunOpponentMode,
  type SelectionCandidate,
  type SelectionEngineIdentity,
  type ConsumerEvidenceView,
  type ApplicationProviderOperationId,
  type ProviderInstanceId,
} from "@chess-tabiya/runtime";

import type {
  EngineHealth,
  EngineIdentity,
  EngineRequest,
  EngineSupervisor,
} from "./engine-supervisor.js";
import {
  ServerError,
  engineUnavailable,
  policyModeUnsupported,
} from "./errors.js";
import { appliedTargetElo } from "./engine-band.js";
import { EVIDENCE_MANIFEST } from "./evidence-manifest.js";
import {
  BOT_POLICY_PROFILES,
  seededPolicyUnit,
  type CompiledBotProfile,
} from "./bot-policy-catalog.js";
import {
  resolveStrongEngineProfile,
  type StrongEngineProfile,
} from "./strong-engine.js";
import { invertTablebaseCategory, type TablebaseMove, type TablebasePosition, type TablebaseSource } from "./tablebase.js";
import { ProviderUnavailableError, type ProviderCacheInventory, type ProviderRegistry, type ProviderSettlement } from "./provider-health.js";

export type OpponentPolicyMode = RunOpponentMode;

export interface SelectorSpineNode {
  readonly id: string;
  readonly moveUci: string;
  readonly children: readonly SelectorSpineNode[];
}

export interface SelectorPolicy {
  readonly mode: string;
  readonly policyConfigDigest: string;
  readonly targetElo?: number;
  readonly temperature?: number;
  readonly topP?: number;
  readonly profile?: Readonly<{
    readonly id: string;
    readonly version: number;
    readonly digest: string;
  }>;
  readonly spine?: readonly SelectorSpineNode[];
}

export interface SelectMoveRequest {
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly policy: SelectorPolicy;
  readonly seed: number;
  readonly packId?: string;
}

export interface SelectorEngineClient {
  execute(engineId: string, request: EngineRequest): Promise<readonly string[]>;
  health(engineId: string): EngineHealth;
}

export interface OpponentSelectorOptions {
  readonly maiaEngineId?: string;
  readonly strongEngineId?: string;
  readonly strongEngineMovetimeMs?: number;
  readonly strongEngineProfile?: Partial<StrongEngineProfile>;
  readonly tablebaseSource?: TablebaseSource;
  /** The live provider-health authority (rfc/provider-health-degradation.md). */
  readonly health?: ProviderRegistry;
  /** Settled-cache bounds; the release matrix may lower them, never remove them (§7). */
  readonly cache?: { readonly maxEntries?: number; readonly ttlMs?: number };
  readonly monotonicNowMs?: () => number;
  readonly wallNow?: () => string;
}

/** Whether a selection was produced by a live provider now or served from the exact-request cache. */
export interface OpponentSelectionReceipt {
  readonly source: "live" | "cached_exact";
  /** The provider-instance generations the selection was produced under. */
  readonly generations: Readonly<Partial<Record<ProviderInstanceId, string | null>>>;
  readonly producedAt: string;
  readonly servedAt: string;
}

export interface ReceiptedOpponentSelection {
  readonly selection: OpponentSelection;
  readonly receipt: OpponentSelectionReceipt;
}

/** §7 defaults: 512 settled entries and a TTL enforced at insertion (at most 24 hours). */
export const OPPONENT_SELECTION_CACHE_BOUNDS = Object.freeze({ maxEntries: 512, ttlMs: 6 * 60 * 60 * 1000 });
const MAX_SELECTION_TTL_MS = 24 * 60 * 60 * 1000;

const MODE_INSTANCES: Readonly<Record<RunOpponentMode, readonly ProviderInstanceId[]>> = Object.freeze({
  human_common: Object.freeze(["maia-inference"] as const),
  theory_strict: Object.freeze(["maia-inference"] as const),
  strong_engine: Object.freeze(["stockfish-play"] as const),
  perfect_tablebase: Object.freeze(["tablebase-primary"] as const),
  practical_resistance: Object.freeze(["maia-inference", "tablebase-primary"] as const),
});

interface SettledSelection {
  readonly selection: OpponentSelection;
  readonly generations: Readonly<Partial<Record<ProviderInstanceId, string | null>>>;
  readonly producedAt: string;
  readonly expiresAtMonotonic: number;
}

/** Retained payloads are recursively immutable (§7). */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/**
 * The bounded, generation-keyed settled cache (§7): LRU by use, TTL fixed at insertion, in-flight
 * work held elsewhere, readable by the registry as a per-instance inventory.
 */
class SettledSelectionCache {
  readonly #entries = new Map<string, SettledSelection>();
  readonly #maxEntries: number;
  readonly #ttlMs: number;
  #revision = 0;

  constructor(maxEntries: number, ttlMs: number) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) throw new TypeError("selection cache maxEntries must be a positive integer");
    if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > MAX_SELECTION_TTL_MS) throw new TypeError("selection cache TTL must be 1 ms to 24 hours");
    this.#maxEntries = maxEntries;
    this.#ttlMs = ttlMs;
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: string, now: number): SettledSelection | undefined {
    const entry = this.#entries.get(key);
    if (entry === undefined) return undefined;
    if (now >= entry.expiresAtMonotonic) {
      this.#entries.delete(key);
      this.#revision += 1;
      return undefined;
    }
    // Recency updates on a hit: the hot oldest row survives the next insertion.
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry;
  }

  put(key: string, now: number, value: Omit<SettledSelection, "expiresAtMonotonic">): void {
    this.#entries.delete(key);
    this.#entries.set(key, deepFreeze({ ...value, expiresAtMonotonic: now + this.#ttlMs }));
    while (this.#entries.size > this.#maxEntries) this.#entries.delete(this.#entries.keys().next().value!);
    this.#revision += 1;
  }

  validExactEntries(now: number, generation: string): number {
    let count = 0;
    for (const entry of this.#entries.values()) {
      if (now < entry.expiresAtMonotonic && Object.values(entry.generations).includes(generation)) count += 1;
    }
    return count;
  }

  revision(): number {
    return this.#revision;
  }

  retain(predicate: (entry: SettledSelection) => boolean): void {
    let changed = false;
    for (const [key, entry] of this.#entries) {
      if (!predicate(entry)) {
        this.#entries.delete(key);
        changed = true;
      }
    }
    if (changed) this.#revision += 1;
  }
}

class SelectionInventory implements ProviderCacheInventory {
  constructor(private readonly cache: SettledSelectionCache, private readonly prune: () => void) {}
  validExactEntries(now: number, generation: string): number { return this.cache.validExactEntries(now, generation); }
  revision(): number { return this.cache.revision(); }
  invalidateExcept(): void { this.prune(); }
}

function classifyEngineFailure(error: unknown): ProviderSettlement {
  const message = error instanceof Error ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}` : String(error);
  if (/timed out/iu.test(message)) return { kind: "failure", reason: "timeout" };
  if (/exited|not writable|unavailable|generation changed/iu.test(message)) return { kind: "failure", reason: "process_exit" };
  return { kind: "failure", reason: "protocol" };
}

const DEFAULT_TEMPERATURE = 0.8;
const DEFAULT_TOP_P = 0.92;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

type OpponentProviderPayload = readonly string[] | TablebasePosition;

export function consumeOpponentSelectionEvidence(view: ConsumerEvidenceView<OpponentProviderPayload>): readonly OpponentProviderPayload[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "opponent.selection" || view.consumer.version !== 1) throw new TypeError("Expected opponent.selection@1 consumer view");
  return Object.freeze(view.items.map((item) => item.payload));
}

function opponentProviderEvidence<T extends OpponentProviderPayload>(source: "maia" | "stockfish" | "syzygy", payload: T): T {
  const admitted = consumeOpponentSelectionEvidence(evidenceForConsumer(
    EVIDENCE_MANIFEST,
    { id: "opponent.selection", version: 1 },
    [declareOpponentProviderEvidence(source, payload)],
  ));
  return admitted[0] as T;
}

function invalid(message: string, cause?: Error): ServerError {
  return new ServerError("INVALID_REQUEST", message, {
    ...(cause === undefined ? {} : { cause }),
  });
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw invalid(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw invalid(`${label} must be a non-empty string`);
  }
  return value;
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw invalid(`${label} must be a finite number`);
  }
  return value;
}

function optionalNumber(value: unknown, label: string): number | undefined {
  return value === undefined ? undefined : finiteNumber(value, label);
}

function parseSpineNode(value: unknown, label: string): SelectorSpineNode {
  const node = record(value, label);
  if (!Array.isArray(node.children)) throw invalid(`${label}.children must be an array`);
  return Object.freeze({
    id: string(node.id, `${label}.id`),
    moveUci: string(node.moveUci, `${label}.moveUci`),
    children: Object.freeze(
      node.children.map((child, index) =>
        parseSpineNode(child, `${label}.children[${index}]`),
      ),
    ),
  });
}

function validateProfilePolicy(
  policy: Pick<SelectorPolicy, "mode" | "targetElo" | "temperature" | "topP" | "profile">,
  profiles: readonly CompiledBotProfile[],
): void {
  if (policy.profile === undefined) return;
  if (policy.mode !== "human_common") throw invalid("policy.profile is valid only with human_common");
  if (policy.targetElo !== undefined || policy.temperature !== undefined || policy.topP !== undefined) {
    throw invalid("policy.profile cannot be combined with targetElo, temperature, or topP");
  }
  const declared = profiles.find((profile) =>
    profile.id === policy.profile!.id && profile.version === policy.profile!.version
  );
  if (declared === undefined || declared.digest !== policy.profile.digest) {
    throw invalid("policy.profile does not match the compiled bot-policy catalog");
  }
}

export function parseSelectMoveRequest(
  value: unknown,
  profiles: readonly CompiledBotProfile[] = BOT_POLICY_PROFILES,
): SelectMoveRequest {
  const body = record(value, "body");
  for (const key of Object.keys(body)) {
    if (!["startFen", "historyUci", "policy", "seed", "packId"].includes(key)) {
      throw invalid(`body.${key} is an unknown field`);
    }
  }
  if (!Array.isArray(body.historyUci)) {
    throw invalid("historyUci must be an array");
  }
  if (typeof body.seed !== "number" || !Number.isSafeInteger(body.seed)) {
    throw invalid("seed must be a safe integer");
  }
  const policy = record(body.policy, "policy");
  for (const key of Object.keys(policy)) {
    if (!["mode", "policyConfigDigest", "targetElo", "temperature", "topP", "profile"].includes(key)) {
      throw invalid(`policy.${key} is an unknown field`);
    }
  }
  const digest = string(policy.policyConfigDigest, "policy.policyConfigDigest");
  if (!DIGEST_PATTERN.test(digest)) {
    throw invalid("policy.policyConfigDigest must be an RFC-8785 SHA-256 digest");
  }
  const targetElo = optionalNumber(policy.targetElo, "policy.targetElo");
  if (targetElo !== undefined && !Number.isSafeInteger(targetElo)) {
    throw invalid("policy.targetElo must be a safe integer");
  }
  const temperature = optionalNumber(policy.temperature, "policy.temperature");
  if (temperature !== undefined && temperature < 0) {
    throw invalid("policy.temperature cannot be negative");
  }
  const topP = optionalNumber(policy.topP, "policy.topP");
  if (topP !== undefined && (topP < 0 || topP > 1)) {
    throw invalid("policy.topP must be between 0 and 1");
  }
  const profile = (() => {
    if (policy.profile === undefined) return undefined;
    const value = record(policy.profile, "policy.profile");
    for (const key of Object.keys(value)) {
      if (!["id", "version", "digest"].includes(key)) throw invalid(`policy.profile.${key} is an unknown field`);
    }
    const version = finiteNumber(value.version, "policy.profile.version");
    if (!Number.isSafeInteger(version) || version < 1) throw invalid("policy.profile.version must be a positive safe integer");
    const profileDigest = string(value.digest, "policy.profile.digest");
    if (!DIGEST_PATTERN.test(profileDigest)) throw invalid("policy.profile.digest must be an RFC-8785 SHA-256 digest");
    return Object.freeze({ id: string(value.id, "policy.profile.id"), version, digest: profileDigest });
  })();
  const parsedPolicy = Object.freeze({
    mode: string(policy.mode, "policy.mode"),
    policyConfigDigest: digest,
    ...(targetElo === undefined ? {} : { targetElo }),
    ...(temperature === undefined ? {} : { temperature }),
    ...(topP === undefined ? {} : { topP }),
    ...(profile === undefined ? {} : { profile }),
  });
  validateProfilePolicy(parsedPolicy, profiles);
  return Object.freeze({
    startFen: string(body.startFen, "startFen"),
    historyUci: Object.freeze(
      body.historyUci.map((move, index) => string(move, `historyUci[${index}]`)),
    ),
    policy: parsedPolicy,
    seed: body.seed,
    ...(body.packId === undefined ? {} : { packId: string(body.packId, "packId") }),
  });
}

function historyHash(request: SelectMoveRequest): string {
  const digest = createHash("sha256");
  digest.update(request.startFen);
  for (const move of request.historyUci) {
    digest.update("\0");
    digest.update(move);
  }
  return digest.digest("hex");
}

/** Position-pure order for moves whose selector basis declares them equal. */
export function neutralTiebreakKey(fen: string, moveUci: string): string {
  const positionKey = fen.trim().split(/\s+/u).slice(0, 5).join(" ");
  return createHash("sha256").update(positionKey).update("\0").update(moveUci).digest("hex");
}

function neutralTiebreak(fen: string, leftUci: string, rightUci: string): number {
  const leftKey = neutralTiebreakKey(fen, leftUci);
  const rightKey = neutralTiebreakKey(fen, rightUci);
  return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : leftUci.localeCompare(rightUci);
}

export function selectionCacheKey(request: SelectMoveRequest): string {
  return [
    // Mode and sampler options are selection identity: two modes under one session digest (a
    // human-replies group inside a strong-engine run) must never share a cached reply.
    request.policy.mode,
    request.policy.temperature ?? "",
    request.policy.topP ?? "",
    request.policy.policyConfigDigest,
    request.policy.targetElo ?? "",
    request.policy.profile?.id ?? "",
    request.policy.profile?.version ?? "",
    request.policy.profile?.digest ?? "",
    request.packId ?? "",
    request.seed,
    historyHash(request),
  ].join(
    "\0",
  );
}

function positionFromFen(fen: string): Chess {
  try {
    return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  } catch (cause) {
    throw invalid("startFen is not a legal standard-chess position", cause as Error);
  }
}

function play(position: Chess, moveUci: string, label: string): Chess {
  const move = parseUci(moveUci);
  if (!move || !isNormal(move) || !position.isLegal(move)) {
    throw invalid(`${label} is not legal from its preceding position`);
  }
  const next = position.clone();
  next.play(move);
  return next;
}

function currentPosition(request: SelectMoveRequest): Chess {
  let position = positionFromFen(request.startFen);
  for (const [index, move] of request.historyUci.entries()) {
    position = play(position, move, `historyUci[${index}]`);
  }
  return position;
}

function legalMoveCount(position: Chess): number {
  return exactLegalMoves(makeFen(position.toSetup())).length;
}

function positionCommand(request: SelectMoveRequest): string {
  return `position fen ${request.startFen}${
    request.historyUci.length === 0 ? "" : ` moves ${request.historyUci.join(" ")}`
  }`;
}

function candidateLines(lines: readonly string[], fen: string): readonly SelectionCandidate[] {
  const candidates = new Map<string, SelectionCandidate>();
  for (const line of lines) {
    if (!line.startsWith("info ")) continue;
    const rankMatch = /\bmultipv (\d+)\b/.exec(line);
    const moveMatch = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line);
    if (!rankMatch || !moveMatch) continue;
    const massMatch = /\bpolicy ([0-9]+(?:\.[0-9]+)?(?:e[+-]?\d+)?)\b/i.exec(line);
    const scoreIsBound = /\b(?:upperbound|lowerbound)\b/.test(line);
    const scoreMatch = scoreIsBound ? null : /\bscore cp (-?\d+)\b/.exec(line);
    const wdlMatch = scoreIsBound ? null : /\bwdl (\d+) (\d+) (\d+)\b/.exec(line);
    const mass = massMatch === null ? undefined : Number(massMatch[1]);
    if (mass !== undefined && (!Number.isFinite(mass) || mass < 0 || mass > 1)) {
      throw invalid(`Engine returned invalid policy mass: ${massMatch![1]}`);
    }
    const candidate: SelectionCandidate = Object.freeze({
      moveUci: normalizeInboundMove(fen, moveMatch[1]!, "engine_bestmove").moveUci,
      rank: Number(rankMatch[1]),
      ...(mass === undefined ? {} : { mass }),
      ...(scoreMatch === null ? {} : { scoreCp: Number(scoreMatch[1]) }),
      ...(wdlMatch === null ? {} : { wdl: Object.freeze({ win: Number(wdlMatch[1]), draw: Number(wdlMatch[2]), loss: Number(wdlMatch[3]) }) }),
    });
    candidates.set(candidate.moveUci, candidate);
  }
  return Object.freeze(
    [...candidates.values()].sort((left, right) => left.rank - right.rank),
  );
}

function bestMove(lines: readonly string[], fen: string): string {
  const match = lines
    .map((line) => /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line))
    .find((candidate) => candidate !== null);
  if (!match) throw invalid("Engine returned no legal bestmove");
  return normalizeInboundMove(fen, match[1]!, "engine_bestmove").moveUci;
}

function requestPositionFen(request: SelectMoveRequest): string {
  return makeFen(currentPosition(request).toSetup());
}

function selectionIdentity(
  identity: EngineIdentity,
  eloApplied?: number,
  searchBound?: Readonly<{ kind: "nodes" | "movetime"; value: number }>,
): SelectionEngineIdentity {
  return Object.freeze({
    id: identity.id,
    name: identity.name,
    version: identity.version,
    ...(identity.modelId === undefined ? {} : { modelId: identity.modelId }),
    ...(identity.containerDigest === undefined
      ? {}
      : { containerDigest: identity.containerDigest }),
    seedHonored: identity.seedHonored,
    eloHonored: identity.eloHonored === true,
    ...(eloApplied === undefined ? {} : { eloApplied }),
    ...(searchBound === undefined ? {} : { searchBound }),
  });
}

function makeSelection(
  moveUci: string,
  candidates: readonly SelectionCandidate[],
  identity: EngineIdentity,
  policyModeApplied: RunOpponentMode,
  eloApplied?: number,
  searchBound?: Readonly<{ kind: "nodes" | "movetime"; value: number }>,
): OpponentSelection {
  return Object.freeze({
    moveUci,
    policyModeApplied,
    ...(candidates.length === 0 ? {} : { candidates }),
    engine: selectionIdentity(identity, eloApplied, searchBound),
  });
}

function engineIdentity(client: SelectorEngineClient, engineId: string): EngineIdentity {
  const identity = client.health(engineId).identity;
  if (identity === undefined) throw engineUnavailable(engineId, 0);
  return identity;
}

function sampleWeighted(
  candidates: readonly SelectionCandidate[],
  seed: number,
  hash: string,
): string | undefined {
  const total = candidates.reduce((sum, candidate) => sum + (candidate.mass ?? 0), 0);
  if (total <= 0) return undefined;
  let cursor = seededPolicyUnit(seed, hash) * total;
  for (const candidate of candidates) {
    cursor -= candidate.mass ?? 0;
    if (cursor < 0) return candidate.moveUci;
  }
  return candidates.at(-1)?.moveUci;
}

function sampleRankWeighted(
  candidates: readonly SelectionCandidate[],
  seed: number,
  hash: string,
): string {
  const ranked = candidates.map((candidate) => ({
    ...candidate,
    mass: 1 / candidate.rank,
  }));
  return sampleWeighted(ranked, seed, hash)!;
}

function sampleUniform(moves: readonly string[], seed: number, hash: string): string {
  if (moves.length === 0) throw invalid("Cannot sample an empty spine child set");
  return moves[Math.floor(seededPolicyUnit(seed, hash) * moves.length)]!;
}

function addSpinePosition(
  index: Map<string, Map<string, SelectorSpineNode>>,
  position: Chess,
  nodes: readonly SelectorSpineNode[],
): void {
  const key = transposeKey(makeFen(position.toSetup()));
  const moves = index.get(key) ?? new Map<string, SelectorSpineNode>();
  for (const node of nodes) moves.set(node.moveUci, node);
  index.set(key, moves);

  for (const node of nodes) {
    const next = play(position, node.moveUci, `spine node ${node.id}`);
    addSpinePosition(index, next, node.children);
  }
}

function spineChildren(
  request: SelectMoveRequest,
): readonly SelectorSpineNode[] | undefined {
  const spine = request.policy.spine;
  if (spine === undefined || spine.length === 0) return undefined;
  const index = new Map<string, Map<string, SelectorSpineNode>>();
  addSpinePosition(index, positionFromFen(request.startFen), spine);
  const key = transposeKey(makeFen(currentPosition(request).toSetup()));
  const children = index.get(key);
  return children === undefined ? undefined : Object.freeze([...children.values()]);
}

export class OpponentSelector {
  readonly #client: SelectorEngineClient;
  readonly #maiaEngineId: string;
  readonly #strongEngineId: string;
  readonly #strongEngineMovetimeMs: number;
  readonly #strongEngineNodes: number | null;
  readonly #strongEngineMultiPv: number;
  readonly #tablebase: TablebaseSource | undefined;
  readonly #health: ProviderRegistry | undefined;
  readonly #settled: SettledSelectionCache;
  readonly #inFlight = new Map<string, Promise<Omit<SettledSelection, "expiresAtMonotonic">>>();
  readonly #monotonic: () => number;
  readonly #wall: () => string;

  constructor(
    client: SelectorEngineClient | EngineSupervisor,
    options: OpponentSelectorOptions = {},
  ) {
    this.#client = client;
    this.#maiaEngineId = options.maiaEngineId ?? "maia-5m";
    this.#strongEngineId = options.strongEngineId ?? "stockfish-play";
    const profile = resolveStrongEngineProfile({
      ...options.strongEngineProfile,
      ...(options.strongEngineMovetimeMs === undefined
        ? {}
        : { movetimeMs: options.strongEngineMovetimeMs }),
    });
    this.#strongEngineMovetimeMs = profile.movetimeMs;
    this.#strongEngineNodes = profile.nodes;
    this.#strongEngineMultiPv = profile.multiPv;
    this.#tablebase = options.tablebaseSource;
    this.#health = options.health;
    const health = options.health;
    this.#monotonic = options.monotonicNowMs ?? (health === undefined ? () => performance.now() : () => health.monotonicNow());
    this.#wall = options.wallNow ?? (() => new Date().toISOString());
    this.#settled = new SettledSelectionCache(options.cache?.maxEntries ?? OPPONENT_SELECTION_CACHE_BOUNDS.maxEntries, options.cache?.ttlMs ?? OPPONENT_SELECTION_CACHE_BOUNDS.ttlMs);
    if (health !== undefined) {
      // Generation change drops every settled row naming a replaced generation.
      const prune = (): void => this.#settled.retain((entry) => Object.entries(entry.generations).every(([instanceId, generation]) => health.generation(instanceId as ProviderInstanceId) === generation));
      for (const instanceId of ["maia-inference", "stockfish-play", "tablebase-primary"] as const) {
        health.registerCacheInventory(instanceId, new SelectionInventory(this.#settled, prune));
      }
    }
  }

  select(request: SelectMoveRequest): Promise<OpponentSelection> {
    return this.selectWithReceipt(request).then((result) => result.selection);
  }

  /**
   * One opponent selection under one compiled deadline. An exact settled hit for the current
   * provider generations is served as `cached_exact` whatever the provider's health; a miss needs a
   * live provider and fails with the typed, bounded unavailable outcome — never a different mode.
   */
  selectWithReceipt(request: SelectMoveRequest): Promise<ReceiptedOpponentSelection> {
    // Request refusals (band, policy, terminal position) stay synchronous, before any provider.
    this.validatePolicy(request.policy);
    if (currentPosition(request).isEnd()) {
      throw invalid("Opponent selection requires a non-terminal position");
    }
    return this.#selectWithReceipt(request);
  }

  async #selectWithReceipt(request: SelectMoveRequest): Promise<ReceiptedOpponentSelection> {
    const generations = this.#generationImage(request.policy.mode);
    const key = `${selectionCacheKey(request)}\0${JSON.stringify(generations)}`;
    const hit = this.#settled.get(key, this.#monotonic());
    if (hit !== undefined) {
      return Object.freeze({ selection: hit.selection, receipt: Object.freeze({ source: "cached_exact", generations: hit.generations, producedAt: hit.producedAt, servedAt: this.#wall() }) });
    }
    let pending = this.#inFlight.get(key);
    if (pending === undefined) {
      const started = this.#selectLive(request, generations).then((settled) => {
        // A result produced under a generation that has since been replaced never reaches a
        // response and never populates the new generation's cache (§3, criterion 19).
        if (JSON.stringify(this.#generationImage(request.policy.mode)) !== JSON.stringify(generations)) {
          throw this.#generationChanged(request.policy.mode);
        }
        this.#settled.put(key, this.#monotonic(), settled);
        return settled;
      });
      pending = started.finally(() => {
        this.#inFlight.delete(key);
      });
      this.#inFlight.set(key, pending);
    }
    const settled = await pending;
    return Object.freeze({ selection: settled.selection, receipt: Object.freeze({ source: "live", generations: settled.generations, producedAt: settled.producedAt, servedAt: this.#wall() }) });
  }

  async #selectLive(request: SelectMoveRequest, generations: Readonly<Partial<Record<ProviderInstanceId, string | null>>>): Promise<Omit<SettledSelection, "expiresAtMonotonic">> {
    const deadline = this.#monotonic() + applicationProviderExecution("opponent.maia_inference").consumerBudgetMs;
    const selection = await this.#selectUncached(request, deadline);
    return Object.freeze({ selection, generations, producedAt: this.#wall() });
  }

  #generationImage(mode: string): Readonly<Partial<Record<ProviderInstanceId, string | null>>> {
    const instances = MODE_INSTANCES[mode as RunOpponentMode] ?? [];
    const health = this.#health;
    return Object.freeze(Object.fromEntries(instances.map((instanceId) => [instanceId, health === undefined ? null : health.generation(instanceId)])));
  }

  #generationChanged(mode: string): ProviderUnavailableError {
    const operation: ApplicationProviderOperationId = mode === "strong_engine" ? "opponent.stockfish_play" : mode === "perfect_tablebase" ? "evidence.tablebase_probe" : "opponent.maia_inference";
    return new ProviderUnavailableError(operation, Object.freeze({ state: "unavailable", instanceIds: Object.freeze([...(MODE_INSTANCES[mode as RunOpponentMode] ?? [])]), reason: "process_exit" }), null, "the provider generation changed while the selection was in flight");
  }

  /** Runs one engine stage inside the shared deadline, admitted and settled by provider health. */
  async #engine(operation: "opponent.maia_inference" | "opponent.stockfish_play", engineId: string, request: Omit<EngineRequest, "timeoutMs" | "signal">, deadline: number, searchFloorMs = 1): Promise<readonly string[]> {
    const remaining = Math.floor(deadline - this.#monotonic());
    if (remaining < searchFloorMs) {
      const instanceId = applicationProviderExecution(operation).instanceId;
      throw new ProviderUnavailableError(operation, Object.freeze({ state: "unavailable", instanceIds: Object.freeze([instanceId]), reason: "timeout" }), null, "the opponent deadline cannot admit another provider request");
    }
    if (this.#health === undefined) return this.#client.execute(engineId, { ...request, timeoutMs: remaining });
    return this.#health.run(operation, ({ signal, remainingMs }) => this.#client.execute(engineId, { ...request, timeoutMs: Math.max(1, remainingMs), signal }), classifyEngineFailure, { deadlineMonotonic: deadline });
  }

  #probe(fen: string, deadline: number): Promise<TablebasePosition> {
    return this.#tablebase!.probe(fen, { deadlineMonotonic: deadline });
  }

  cacheSize(): number {
    return this.#settled.size;
  }

  validatePolicy(policy: Pick<SelectorPolicy, "mode" | "targetElo" | "temperature" | "topP" | "profile">): void {
    validateProfilePolicy(policy, BOT_POLICY_PROFILES);
    if (
      policy.mode === "human_common"
      || policy.mode === "theory_strict"
      || policy.mode === "practical_resistance"
    ) {
      appliedTargetElo(this.#client.health(this.#maiaEngineId), policy.targetElo);
    }
  }

  availableModes(): readonly RunOpponentMode[] {
    if (this.#health !== undefined) {
      // Configuration alone makes a mode outright unsupported; a runtime failure is a temporary
      // state that the selection reports as its typed unavailable outcome.
      const snapshot = this.#health.snapshot();
      return Object.freeze(snapshot.policyModes.filter((row) => !(row.availability.state === "unavailable" && row.availability.reason === "not_configured")).map((row) => row.mode));
    }
    const maia = this.#client.health(this.#maiaEngineId).identity !== undefined;
    const strong = this.#client.health(this.#strongEngineId).identity !== undefined;
    return Object.freeze([
      ...(maia ? (["human_common", "theory_strict"] as const) : []),
      ...(strong ? (["strong_engine"] as const) : []),
      ...(this.#tablebase === undefined ? [] : (["perfect_tablebase"] as const)),
      ...(maia && this.#tablebase !== undefined ? (["practical_resistance"] as const) : []),
    ]);
  }

  identityFor(mode: RunOpponentMode, targetElo?: number): SelectionEngineIdentity {
    if (mode === "perfect_tablebase") return Object.freeze({id:"lichess-tablebase",name:"Syzygy (tablebase.lichess.org/standard)",version:"7man",seedHonored:true,eloHonored:false});
    const engineId = mode === "strong_engine" ? this.#strongEngineId : this.#maiaEngineId;
    const identity = engineIdentity(this.#client, engineId);
    const eloApplied = mode === "strong_engine" ? undefined : appliedTargetElo(this.#client.health(engineId), targetElo);
    return selectionIdentity(identity, eloApplied);
  }

  async enumerate(request: SelectMoveRequest, count: number): Promise<OpponentSelection> {
    if (request.policy.mode !== "strong_engine") {
      throw policyModeUnsupported(request.policy.mode);
    }
    if (!Number.isSafeInteger(count) || count < 2 || count > 8) {
      throw invalid("enumerate count must be an integer from 2 to 8");
    }
    const deadline = this.#monotonic() + applicationProviderExecution("opponent.stockfish_play").consumerBudgetMs;
    const lines = opponentProviderEvidence("stockfish", await this.#engine("opponent.stockfish_play", this.#strongEngineId, {
      commands: [
        `setoption name MultiPV value ${count}`,
        positionCommand(request),
        `go movetime ${this.#strongEngineMovetimeMs}`,
      ],
      resetSearchState: true,
      until: (line) => line.startsWith("bestmove "),
    }, deadline));
    return makeSelection(
      bestMove(lines, requestPositionFen(request)),
      candidateLines(lines, requestPositionFen(request)),
      engineIdentity(this.#client, this.#strongEngineId),
      "strong_engine",
    );
  }

  async #selectUncached(request: SelectMoveRequest, deadline: number): Promise<OpponentSelection> {
    switch (request.policy.mode) {
      case "human_common":
        return this.#humanCommon(request, deadline);
      case "strong_engine":
        return this.#strongEngine(request, deadline);
      case "theory_strict":
        return this.#theoryStrict(request, deadline);
      case "perfect_tablebase":
        return this.#perfectTablebase(request, deadline);
      case "practical_resistance":
        return this.#practicalResistance(request, deadline);
      default:
        throw policyModeUnsupported(request.policy.mode);
    }
  }

  async #maia(
    request: SelectMoveRequest,
    multiPv: number,
    deadline: number,
  ): Promise<{ readonly lines: readonly string[]; readonly identity: EngineIdentity; readonly eloApplied?: number }> {
    const health = this.#client.health(this.#maiaEngineId);
    const identity = engineIdentity(this.#client, this.#maiaEngineId);
    const eloApplied = appliedTargetElo(health, request.policy.targetElo);
    const spin = (name: string) => health.options?.find((item) => item.name === name && item.type === "spin");
    const optionDefault = (name: string) => health.options?.find((item) => item.name === name)?.default;
    const maximum = spin("MultiPV")?.max;
    const appliedMultiPv = maximum === undefined ? multiPv : Math.min(multiPv, maximum);
    const bandDefaults = ["SelfElo", "OppoElo"].flatMap((name) => {
      const value = optionDefault(name);
      return value === undefined ? [] : [`setoption name ${name} value ${value}`];
    });
    const commands = [
      ...bandDefaults,
      ...(eloApplied === undefined
        ? []
        : [`setoption name Elo value ${eloApplied}`]),
      `setoption name Temperature value ${
        request.policy.temperature ?? DEFAULT_TEMPERATURE
      }`,
      `setoption name TopP value ${request.policy.topP ?? DEFAULT_TOP_P}`,
      `setoption name MultiPV value ${appliedMultiPv}`,
      positionCommand(request),
      "go",
    ];
    // One deadline covers both Maia attempts; the fixed 60-second wait is deleted (§5).
    const lines = opponentProviderEvidence("maia", await this.#engine("opponent.maia_inference", this.#maiaEngineId, {
      commands,
      until: (line) => line.startsWith("bestmove "),
    }, deadline));
    return Object.freeze({
      lines,
      identity,
      ...(eloApplied === undefined ? {} : { eloApplied }),
    });
  }

  async #humanCommon(request: SelectMoveRequest, deadline: number): Promise<OpponentSelection> {
    const health = this.#client.health(this.#maiaEngineId);
    const maximum = health.options?.find((item) => item.name === "MultiPV" && item.type === "spin")?.max;
    const requestedWidth = Math.max(8, legalMoveCount(currentPosition(request)));
    const width = maximum === undefined ? requestedWidth : Math.min(requestedWidth, maximum);
    let result = await this.#maia(request, width, deadline);
    const fen = requestPositionFen(request);
    let candidates = candidateLines(result.lines, fen);
    let moveUci = bestMove(result.lines, fen);
    if (!candidates.some((candidate) => candidate.moveUci === moveUci)) {
      result = await this.#maia(request, width, deadline);
      candidates = candidateLines(result.lines, fen);
      moveUci = bestMove(result.lines, fen);
    }
    if (!candidates.some((candidate) => candidate.moveUci === moveUci)) {
      const maxRank = candidates.reduce((rank, candidate) => Math.max(rank, candidate.rank), 0);
      candidates = Object.freeze([
        ...candidates,
        Object.freeze({ moveUci, rank: maxRank + 1, offWindow: true as const }),
      ]);
    }
    return makeSelection(
      moveUci,
      candidates,
      result.identity,
      "human_common",
      result.eloApplied,
    );
  }

  /** @instrument-fed Stockfish 51-position reproducibility corpus */
  async #strongEngine(request: SelectMoveRequest, deadline: number): Promise<OpponentSelection> {
    const searchBound = this.#strongEngineNodes === null
      ? Object.freeze({ kind: "movetime" as const, value: this.#strongEngineMovetimeMs })
      : Object.freeze({ kind: "nodes" as const, value: this.#strongEngineNodes });
    const lines = opponentProviderEvidence("stockfish", await this.#engine("opponent.stockfish_play", this.#strongEngineId, {
      commands: [
        `setoption name MultiPV value ${this.#strongEngineMultiPv}`,
        positionCommand(request),
        `go ${searchBound.kind} ${searchBound.value}`,
      ],
      resetSearchState: true,
      until: (line) => line.startsWith("bestmove "),
    }, deadline, searchBound.kind === "movetime" ? searchBound.value : 1));
    return makeSelection(
      bestMove(lines, requestPositionFen(request)),
      candidateLines(lines, requestPositionFen(request)),
      engineIdentity(this.#client, this.#strongEngineId),
      "strong_engine",
      undefined,
      searchBound,
    );
  }

  async #theoryStrict(request: SelectMoveRequest, deadline: number): Promise<OpponentSelection> {
    const children = spineChildren(request);
    if (children === undefined || children.length === 0) {
      console.warn(
        "DEGRADED_THEORY_SPINE: position is off the authored spine; falling back to human_common",
      );
      return this.#humanCommon(request, deadline);
    }
    const result = await this.#maia(request, Math.max(8, children.length), deadline);
    const fen = requestPositionFen(request);
    const allowed = new Set(children.map((child) => normalizeInboundMove(fen, child.moveUci, "pack_move_uci").moveUci));
    const matching = candidateLines(result.lines, fen).filter((candidate) =>
      allowed.has(candidate.moveUci),
    );
    const hash = historyHash(request);
    const missingMass = matching.some((candidate) => candidate.mass === undefined);
    if (missingMass) {
      console.warn(
        "DEGRADED_POLICY_MASS: Maia candidate omitted policy mass; using inverse-rank sampling",
      );
    }
    const moveUci = missingMass
      ? sampleRankWeighted(matching, request.seed, hash)
      : (sampleWeighted(matching, request.seed, hash) ??
        sampleUniform([...allowed], request.seed, hash));
    const candidates =
      matching.length === 0
        ? Object.freeze(
            [...allowed].map((move, index) =>
              Object.freeze({ moveUci: move, rank: index + 1 }),
            ),
          )
        : matching;
    return makeSelection(moveUci, candidates, result.identity, "theory_strict", result.eloApplied);
  }

  async #perfectTablebase(request: SelectMoveRequest, deadline: number): Promise<OpponentSelection> {
    if (this.#tablebase === undefined) {
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Perfect tablebase resistance is unavailable", { details: { retryAfterMs: 0 } });
    }
    const board = currentPosition(request);
    const fen = makeFen(board.toSetup());
    const position = opponentProviderEvidence("syzygy", await this.#probe(fen, deadline));
    if (position.category === "unknown") {
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Tablebase category is unknown", { details: { retryAfterMs: 60_000 } });
    }
    const preserving = position.moves.filter((move) => {
      const parsed = parseUci(move.uci);
      return parsed !== undefined
        && board.isLegal(parsed)
        && invertTablebaseCategory(move.category) === position.category;
    });
    if (preserving.length === 0) {
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Tablebase returned no category-preserving move", { details: { retryAfterMs: 60_000 } });
    }
    const winning = position.category.includes("win");
    const losing = position.category.includes("loss");
    const metric = (move: TablebaseMove) => Math.abs(move.preciseDtz ?? move.dtz ?? 0);
    const ordered = [...preserving].sort((left, right) =>
      winning
        ? metric(left) - metric(right) || neutralTiebreak(fen, left.uci, right.uci)
        : losing
          ? metric(right) - metric(left) || neutralTiebreak(fen, left.uci, right.uci)
          : neutralTiebreak(fen, left.uci, right.uci));
    const candidates = Object.freeze(ordered.map((move, index) =>
      Object.freeze({ moveUci: move.uci, rank: index + 1 })));
    return Object.freeze({
      moveUci: ordered[0]!.uci,
      policyModeApplied: "perfect_tablebase",
      orderingBasis: winning ? "dtz_ascending" : losing ? "dtz_descending" : "none",
      candidates,
      engine: this.identityFor("perfect_tablebase"),
    });
  }

  async #practicalResistance(request: SelectMoveRequest, deadline: number): Promise<OpponentSelection> {
    if (this.#tablebase === undefined) {
      throw new ServerError("TABLEBASE_UNAVAILABLE", "Practical resistance requires a tablebase provider", { details: { retryAfterMs: 0 } });
    }
    const board = currentPosition(request);
    const fen = makeFen(board.toSetup());
    const root = opponentProviderEvidence("syzygy", await this.#probe(fen, deadline));
    if (root.category === "unknown") {
      throw new ServerError("PRACTICAL_RESISTANCE_UNAVAILABLE", "The root outcome class is unknown");
    }
    const preserving = root.moves
      .filter((candidate) => {
        const move = parseUci(candidate.uci);
        return move !== undefined && board.isLegal(move) && invertTablebaseCategory(candidate.category) === root.category;
      })
      .sort((left, right) => left.uci.localeCompare(right.uci))
      .slice(0, 4);
    if (preserving.length === 0) {
      throw new ServerError("PRACTICAL_RESISTANCE_UNAVAILABLE", "No category-preserving reply is available");
    }

    const scored: {
      readonly move: TablebaseMove;
      readonly ratio: number | null;
      readonly identity: EngineIdentity;
      readonly eloApplied?: number;
    }[] = [];
    for (const candidate of preserving) {
      const child = play(board, candidate.uci, `tablebase reply ${candidate.uci}`);
      const childFen = makeFen(child.toSetup());
      const childTablebase = opponentProviderEvidence("syzygy", await this.#probe(childFen, deadline));
      if (childTablebase.category === "unknown") {
        throw new ServerError("PRACTICAL_RESISTANCE_UNAVAILABLE", `Outcome class after ${candidate.uci} is unknown`);
      }
      const childRequest: SelectMoveRequest = Object.freeze({
        ...request,
        historyUci: Object.freeze([...request.historyUci, candidate.uci]),
      });
      const maia = await this.#maia(childRequest, Math.max(8, legalMoveCount(child)), deadline);
      const policy = candidateLines(maia.lines, childFen);
      const conceding = new Set(
        childTablebase.moves
          .filter((reply) => invertTablebaseCategory(reply.category) !== childTablebase.category)
          .map((reply) => reply.uci),
      );
      const mass = (() => {
        try {
          return humanConcessionMass(policy, conceding);
        } catch (error) {
          if (error instanceof PolicyMassError) {
            throw new ServerError(
              "PRACTICAL_RESISTANCE_POLICY_MASS_INVALID",
              "Maia returned an invalid policy-mass distribution",
              { cause: error },
            );
          }
          throw error;
        }
      })();
      const ratio = mass === null || mass.measuredMass <= 0
        ? mass === null ? null : 0
        : mass.concedingMass / mass.measuredMass;
      scored.push(Object.freeze({
        move: candidate,
        ratio,
        identity: maia.identity,
        ...(maia.eloApplied === undefined ? {} : { eloApplied: maia.eloApplied }),
      }));
    }

    const measured = scored.filter((candidate) => candidate.ratio !== null);
    if (measured.length === 0) {
      throw new ServerError("PRACTICAL_RESISTANCE_UNMEASURED", "No candidate returned a measured policy mass; practical resistance cannot select");
    }
    if (measured.every((candidate) => candidate.ratio === 0)) {
      throw new ServerError("PRACTICAL_RESISTANCE_UNDECIDABLE", "No category-preserving reply leaves measured concession mass");
    }
    const ordered = [...measured].sort((left, right) =>
      right.ratio! - left.ratio! || left.move.uci.localeCompare(right.move.uci),
    );
    const selected = ordered[0]!;
    const candidates = Object.freeze(scored.map((candidate, index): SelectionCandidate => Object.freeze({
      moveUci: candidate.move.uci,
      rank: index + 1,
      ...(candidate.ratio === null ? {} : { concessionRatio: candidate.ratio }),
    })));
    return makeSelection(
      selected.move.uci,
      candidates,
      selected.identity,
      "practical_resistance",
      selected.eloApplied,
    );
  }
}
