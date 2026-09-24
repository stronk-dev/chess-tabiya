/**
 * The server-owned opponent-ply operation's provider half and its durable replay parser
 * (rfc/bot-policy.md §4.1, §10 ops 4–7, 9–11). `RunService.botOpponentPly` owns the run half —
 * writer lease, request-id lookup, post-provider compare-and-swap and the atomic append.
 *
 * - `BotOpponentProviders` asks the ONE shared provider exchange for the profile's
 *   `maia.policy_page@1` page and, for guarded families, the all-legal
 *   `stockfish.legal_root_table@1` under the guard's 500 ms opportunity deadline. It holds no
 *   queue, cache, receipt constructor or fetch of its own, and it records every outcome in the
 *   availability observer.
 * - `parseStoredBotEnvelope` is the ONE durable parser over stored `OpponentSelection.policy`
 *   bytes: deliveries re-enter through the shared operation-specific parser, the root is sealed from
 *   the run's own node path, the profile is the run's catalogue member, and the decision is
 *   recompiled and compared whole ([[D3027]]). No API accepts a caller or "existing" envelope.
 */
import {
  BOT_LAYER_DECLARATIONS,
  branchPath,
  catalogEntryFor,
  historyFrom,
  resolveBotProfileReference,
  type BotProfileReference,
  type DrillRun,
  type OpponentMoveSelectedEvent,
  type OpponentSelection,
  type OpponentSelectionPolicy,
  type ProviderDelivery,
  type StockfishLegalRootTable,
  type MaiaPolicyPage,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";

import {
  compileBotClassifierView,
  compileBotLegalMoveMap,
  parseBotPolicyEventEnvelope,
  sealBotPolicyReplayAuthority,
  sealBotRootAuthority,
  type BotOperationRootAuthority,
  type BotPolicyDecisionRecord,
  type BotPolicyEventEnvelope,
} from "./bot-policy-compiler.js";
import { canonicalSha256, type Sha256 } from "./bot-profile-digest.js";
import {
  BotProviderAvailability,
  botMaiaRequest,
  botStockfishRequest,
  persistBotDeliveries,
  reloadBotSources,
  type BotSourceFailure,
} from "./bot-opponent-source.js";
import type { ProviderExchangeScheduler } from "./provider-exchange.js";
import type { LeaseHolder } from "./storage.js";

type MaiaResult = TypedProviderResult<"maia.policy_page@1">;
type StockfishResult = TypedProviderResult<"stockfish.legal_root_table@1">;

export interface BotAcquisition {
  readonly maia: MaiaResult;
  /** Absent for baseline profiles; `not_delivered` when the guard's request could not be formed. */
  readonly stockfish?: StockfishResult | "not_delivered";
  readonly timingMs: Readonly<{ maia: number; guard: number }>;
}

/** The provider half the run service awaits WITHOUT holding any transaction. */
export interface BotOpponentAcquirer {
  acquire(input: { readonly root: BotOperationRootAuthority; readonly profile: BotProfileReference }): Promise<BotAcquisition>;
}

export interface BotOpponentProvidersOptions {
  readonly scheduler: ProviderExchangeScheduler;
  /** The Stockfish engine the guard's root table is requested from (the analysis engine). */
  readonly stockfishEngine: () => Promise<Readonly<{ id: string; version: string }>>;
  readonly availability: BotProviderAvailability;
  /** Waiter budget for the base Maia page; the provider execution timeout is `maiaTimeoutMs`. */
  readonly maiaBudgetMs?: number;
  readonly maiaTimeoutMs?: number;
  readonly guardTimeoutMs?: number;
  readonly now?: () => number;
}

const PROBE_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export class BotOpponentProviders implements BotOpponentAcquirer {
  readonly #scheduler: ProviderExchangeScheduler;
  readonly #stockfishEngine: BotOpponentProvidersOptions["stockfishEngine"];
  readonly #availability: BotProviderAvailability;
  readonly #maiaBudgetMs: number;
  readonly #maiaTimeoutMs: number;
  readonly #guardTimeoutMs: number;
  readonly #now: () => number;
  #requestSeq = 0;

  constructor(options: BotOpponentProvidersOptions) {
    this.#scheduler = options.scheduler;
    this.#stockfishEngine = options.stockfishEngine;
    this.#availability = options.availability;
    this.#maiaBudgetMs = options.maiaBudgetMs ?? 15_000;
    this.#maiaTimeoutMs = options.maiaTimeoutMs ?? 15_000;
    this.#guardTimeoutMs = options.guardTimeoutMs ?? 5_000;
    this.#now = options.now ?? (() => performance.now());
  }

  get availability(): BotProviderAvailability {
    return this.#availability;
  }

  #scope(label: string, budgetMs: number) {
    this.#requestSeq += 1;
    return Object.freeze({ id: `bot-opponent:${label}:${this.#requestSeq}`, budgetMs: Math.max(1, Math.floor(budgetMs)) });
  }

  async #maia(input: { readonly startFen: string; readonly historyUci: readonly string[]; readonly profile: BotProfileReference }): Promise<MaiaResult> {
    const request = botMaiaRequest({ ...input, timeoutMs: this.#maiaTimeoutMs });
    const result = await this.#scheduler.get({ operation: "maia.policy_page@1", request }, this.#scope("maia", this.#maiaBudgetMs), new AbortController().signal);
    this.#availability.observe("maia.policy_page@1", result);
    return result;
  }

  async #guard(fen: string, budgetMs: number): Promise<StockfishResult | "not_delivered"> {
    let engine: Readonly<{ id: string; version: string }>;
    try {
      engine = await this.#stockfishEngine();
    } catch {
      return "not_delivered";
    }
    const request = botStockfishRequest({ fen, requestedEngine: engine, timeoutMs: this.#guardTimeoutMs });
    const result = await this.#scheduler.get({ operation: "stockfish.legal_root_table@1", request }, this.#scope("guard", budgetMs), new AbortController().signal);
    this.#availability.observe("stockfish.legal_root_table@1", result);
    return result;
  }

  async acquire(input: { readonly root: BotOperationRootAuthority; readonly profile: BotProfileReference }): Promise<BotAcquisition> {
    const started = this.#now();
    const guarded = input.profile.orderedLayers.includes("guard.severe_error@1");
    // The guard's opportunity deadline is measured from selection start (§4.5); both shared
    // acquisitions run concurrently, and derivation stays sequential inside the compiler.
    const deadline = BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters.deadlineMs;
    let guardDone = started;
    const guard = guarded
      ? this.#guard(input.root.beforeFen, deadline).then((value) => { guardDone = this.#now(); return value; })
      : undefined;
    const maia = await this.#maia({ startFen: input.root.startFen, historyUci: input.root.historyUci, profile: input.profile });
    const maiaDone = this.#now();
    const stockfish = guard === undefined ? undefined : await guard;
    return Object.freeze({
      maia,
      ...(stockfish === undefined ? {} : { stockfish }),
      timingMs: Object.freeze({ maia: Math.max(0, maiaDone - started), guard: guard === undefined ? 0 : Math.max(0, guardDone - started) }),
    });
  }

  /**
   * One real exchange per operation from the standard start position, so the roster reflects the
   * provider state before the first game. It is an ordinary shared request (retained like any
   * other) and its only effect is the availability observation.
   */
  async probe(): Promise<void> {
    // The probe asks for a registered rung's page; it is an observation, not a product default.
    const profile = catalogEntryFor("human-baseline.1400@1")!.reference;
    await Promise.allSettled([
      this.#maia({ startFen: PROBE_START_FEN, historyUci: [], profile }),
      this.#guard(PROBE_START_FEN, this.#guardTimeoutMs),
    ]);
  }
}

// ---------------------------------------------------------------------------------------------
// Operation identities.

/** The writer-lease identity bound into the pre-provider operand digest (run, learner, writer). */
export function botWriterLeaseDigest(runId: string, lease: LeaseHolder): Sha256 {
  return canonicalSha256({ protocol: "tabiya.bot-writer-lease@1", runId, learnerId: lease.learnerId, writerId: lease.writerId });
}

/** The committed selection event carrying `requestId`, located in the run's own event log. */
export function findBotSelectionEvent(run: DrillRun, requestId: string): OpponentMoveSelectedEvent | undefined {
  for (const event of run.events) {
    if (event.type !== "opponent.move_selected") continue;
    const operation = event.data.selection.policy?.operation;
    if (operation !== undefined && operation.requestId === requestId) return event;
  }
  return undefined;
}

/**
 * Seals the operation root from the run's own node path: the start FEN, the move history to
 * `nodeId`, and the seed of the branch the reply is played on. `undefined` when the node is not on
 * that branch's path.
 */
export function sealBotRootAt(run: DrillRun, input: { readonly nodeId: string; readonly branchId: string; readonly preCommitEventHeadDigest: string }): BotOperationRootAuthority | undefined {
  const node = run.nodes.find((candidate) => candidate.id === input.nodeId);
  const branch = run.branches.find((candidate) => candidate.id === input.branchId);
  if (node === undefined || branch === undefined) return undefined;
  let onBranch = false;
  try {
    onBranch = branchPath(run, branch.id).some((candidate) => candidate.id === node.id);
  } catch {
    return undefined;
  }
  if (!onBranch) return undefined;
  const path = historyFrom(run, node.id);
  return sealBotRootAuthority({
    runId: run.id,
    branchId: branch.id,
    nodeId: node.id,
    preCommitEventHeadDigest: input.preCommitEventHeadDigest,
    startFen: run.start.fen,
    historyUci: path.flatMap((candidate) => candidate.moveUci === null ? [] : [candidate.moveUci]),
    seed: branch.seed,
  });
}

/**
 * The recorded selection a composed profile move commits (the event's ordinary half). Candidates
 * carry Maia's reconstructed human-model mass — the same kind of value an ordinary human_common
 * selection records. The guard-masked final distribution is engine-derived and lives only in the
 * server-owned decision, which the public projection never exposes before (or after) disclosure.
 */
export function botSelection(decision: BotPolicyDecisionRecord, maia: ProviderDelivery<MaiaPolicyPage, "maia.policy_page@1">): Omit<OpponentSelection, "policy"> {
  const actual = maia.acquisition.actualIdentity;
  const ranked = [...decision.considered].sort((left, right) => right.reconstructedMass - left.reconstructedMass || left.moveUci.localeCompare(right.moveUci));
  return Object.freeze({
    moveUci: decision.chosenMoveUci,
    policyModeApplied: "human_common",
    candidates: Object.freeze(ranked.map((row, index) => Object.freeze({ moveUci: row.moveUci, mass: Math.min(1, Math.max(0, row.reconstructedMass)), rank: index + 1 }))),
    engine: Object.freeze({
      id: actual.id,
      name: actual.name,
      version: actual.version,
      modelId: actual.modelId,
      containerDigest: actual.containerDigest,
      // The server sampler honours the branch seed; Maia's own sample is discarded (§4.2).
      seedHonored: true,
      eloHonored: true,
      eloApplied: maia.payload.appliedBand,
    }),
  });
}

export function botSelectionPolicy(input: {
  readonly envelope: BotPolicyEventEnvelope;
  readonly maia: ProviderDelivery<MaiaPolicyPage, "maia.policy_page@1">;
  readonly stockfish?: ProviderDelivery<StockfishLegalRootTable, "stockfish.legal_root_table@1"> | Readonly<{ failure: BotSourceFailure | "not_delivered" }>;
}): OpponentSelectionPolicy {
  const deliveries = persistBotDeliveries({ maia: input.maia, ...(input.stockfish === undefined ? {} : { stockfish: input.stockfish }) });
  return JSON.parse(JSON.stringify({ decision: input.envelope.decision, operation: input.envelope.operation, deliveries })) as OpponentSelectionPolicy;
}

export class BotEnvelopeIntegrityError extends TypeError {
  constructor(message: string) {
    super(`Stored bot-policy envelope refused: ${message}`);
    this.name = "BotEnvelopeIntegrityError";
  }
}

/**
 * The one durable parser over a stored profile selection event. Every authority is loaded
 * independently of the stored decision: the root from the run's node path at the event, the
 * profile from the run's `run.started`, the provider results from the shared delivery parser. The
 * decision is recompiled and must equal the stored bytes; the operation record is re-derived.
 */
export function parseStoredBotEnvelope(run: DrillRun, event: OpponentMoveSelectedEvent): BotPolicyEventEnvelope {
  const stored = event.data.selection.policy;
  if (stored === undefined) throw new BotEnvelopeIntegrityError("the selection carries no envelope");
  const profile = run.opponentPolicy.profile;
  if (profile === undefined) throw new BotEnvelopeIntegrityError("the run has no bot profile");
  const operation = stored.operation as Readonly<Record<string, unknown>>;
  const rootIdentity = operation.root as Readonly<Record<string, unknown>> | undefined;
  if (rootIdentity === undefined || typeof rootIdentity !== "object") throw new BotEnvelopeIntegrityError("the operation names no root");
  if (rootIdentity.nodeId !== event.data.nodeId || rootIdentity.branchId !== event.data.branchId || rootIdentity.runId !== run.id) {
    throw new BotEnvelopeIntegrityError("the operation root is not this event's position");
  }
  if (typeof rootIdentity.preCommitEventHeadDigest !== "string") throw new BotEnvelopeIntegrityError("the operation root has no event head");
  const root = sealBotRootAt(run, { nodeId: event.data.nodeId, branchId: event.data.branchId, preCommitEventHeadDigest: rootIdentity.preCommitEventHeadDigest });
  if (root === undefined) throw new BotEnvelopeIntegrityError("the event's position is not on its branch");
  let sources: ReturnType<typeof reloadBotSources>;
  try {
    sources = reloadBotSources(stored.deliveries);
  } catch (error) {
    throw new BotEnvelopeIntegrityError(`a stored provider delivery does not re-derive (${error instanceof Error ? error.message : String(error)})`);
  }
  const legal = compileBotLegalMoveMap(root);
  const classifiers = compileBotClassifierView(root, legal);
  let envelope: BotPolicyEventEnvelope;
  try {
    const authority = sealBotPolicyReplayAuthority({
      root,
      legal,
      classifiers,
      profile: resolveBotProfileReference(profile).reference,
      maia: sources.maia,
      ...(sources.stockfish === undefined ? {} : { stockfish: sources.stockfish }),
    });
    envelope = parseBotPolicyEventEnvelope({ decision: stored.decision, operation: stored.operation }, authority);
  } catch (error) {
    throw new BotEnvelopeIntegrityError(error instanceof Error ? error.message : String(error));
  }
  if (envelope.operation.committedEventSequence !== event.seq) throw new BotEnvelopeIntegrityError("the operation names another event sequence");
  if (envelope.decision.chosenMoveUci !== event.data.moveUci || event.data.selection.moveUci !== event.data.moveUci) {
    throw new BotEnvelopeIntegrityError("the committed move is not the decision's chosen move");
  }
  return envelope;
}

/** Every composed selection on a run, parsed durably (export/replay audit). */
export function parseRunBotEnvelopes(run: DrillRun): readonly BotPolicyEventEnvelope[] {
  return Object.freeze(run.events.flatMap((event) => event.type === "opponent.move_selected" && event.data.selection.policy !== undefined ? [parseStoredBotEnvelope(run, event)] : []));
}
