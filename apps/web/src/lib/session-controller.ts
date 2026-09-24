import type { DrillPackDefinition, ShapeReference } from "@chess-tabiya/schema/drill-pack";
import {
  historyFrom,
  branchPath,
  groupsFromEvents,
  projectRun,
  trajectoryPolicyAt,
  botOpponentPlyRequestId,
  runEventHeadDigest,
  type BotProfileReference,
  type BranchComparison,
  type DrillRunEvent,
  type PolicyConfig,
  type BranchGroup,
  capabilityModeAvailability,
  providerAvailabilityNotice,
  type ProviderOperationAvailability,
  type HintResponse,
} from "@chess-tabiya/runtime";

import {
  ApiError,
  BotOpponentPlyError,
  type BotOpponentPlyOperation,
  type Capabilities,
  type AuthoredFeedbackPage,
  type DrillClientApi,
  type HintRequestBody,
  type PgnDownload,
  type RunGraph,
  type ShapeEntryView,
  type CreateGroupRequest,
  type CreateGroupResult,
  type ReasoningPage,
  type SimulationResult,
} from "./api.js";
import { boardModel } from "./board-model.js";
import { moveSanFromUci } from "./board-input.js";
import {
  latestCheckpoint,
  packStartSide,
  type CheckpointNotice,
} from "./screen-model.js";
import {
  RunStateStore,
  type PollScheduler,
  type RunStateSnapshot,
} from "./run-state.js";
import { WriterSession, type KeyValueStorage } from "./writer-session.js";

export interface DrillSessionState {
  readonly busy: boolean;
  readonly error?: string;
  readonly pack?: DrillPackDefinition;
  readonly packDigest?: string;
  readonly shapes?: readonly ShapeEntryView[];
  readonly runState?: RunStateSnapshot;
  readonly checkpoint?: CheckpointNotice;
  readonly comparison?: BranchComparison;
  readonly comparisonBranchIds?: readonly string[];
  readonly authoredFeedback?: AuthoredFeedbackPage;
  readonly reasoning?: ReasoningPage;
  readonly simulation?: SimulationResult;
  readonly viewer?: RunGraph["viewer"];
  readonly importedGuess?: ImportedGuess;
  /** The last bot reply's layer actions (degraded/abstained status), never its evidence. */
  readonly botReply?: { readonly layers: BotOpponentPlyOperation["layers"]; readonly replayed: boolean };
  /**
   * The opponent could not answer (rfc/provider-health-degradation.md §10): the run paused before
   * any opponent move was committed. Retry re-issues the same request; Change opponent switches the
   * mode for the rest of this session. Neither is written to the run (opponent-recovery-journey).
   */
  readonly opponentPause?: OpponentPause;
  /** Where the last opponent reply came from: an exact cached reply is disclosed, never relabelled. */
  readonly opponentSource?: "live" | "cached_exact";
  /** An in-memory opponent change after a provider failure; the run record does not retain it. */
  readonly opponentChange?: { readonly from: SelectableOpponentMode; readonly to: SelectableOpponentMode };
}

export type SelectableOpponentMode = "human_common" | "strong_engine";

export interface OpponentPause {
  /** Learner copy for why the opponent is paused; never raw provider text. */
  readonly reason: string;
  readonly retryAfterMs: number | null;
  readonly mode: string;
  /** Other opponents this session can switch to, each with its live state. */
  readonly alternatives: readonly { readonly mode: SelectableOpponentMode; readonly label: string; readonly requestable: boolean; readonly note: string }[];
}

/** The codes a failed opponent SELECTION returns; each pauses the run rather than failing it. */
const OPPONENT_PROVIDER_FAILURES: ReadonlySet<string> = new Set(["PROVIDER_UNAVAILABLE", "ENGINE_UNAVAILABLE", "TABLEBASE_UNAVAILABLE", "PRACTICAL_RESISTANCE_UNAVAILABLE"]);

const OPPONENT_MODE_LABELS: Readonly<Record<SelectableOpponentMode, string>> = Object.freeze({
  human_common: "a human-style opponent",
  strong_engine: "the engine opponent",
});

/** The paused-opponent copy for one typed provider failure (task language, no provider JSON). */
export function opponentPauseReason(error: ApiError): { readonly reason: string; readonly retryAfterMs: number | null } {
  const details = error.details as { readonly availability?: unknown; readonly retryAfterMs?: unknown };
  const retryAfterMs = typeof details.retryAfterMs === "number" && Number.isFinite(details.retryAfterMs) ? details.retryAfterMs : null;
  const availability = details.availability;
  if (availability !== null && typeof availability === "object" && "state" in availability) {
    const notice = providerAvailabilityNotice(availability as ProviderOperationAvailability, "The opponent");
    if (notice.reason !== "") return Object.freeze({ reason: notice.reason, retryAfterMs: notice.retryAfterMs ?? retryAfterMs });
  }
  return Object.freeze({ reason: "The opponent could not answer right now.", retryAfterMs });
}

/** Must match the server's reserved imported-game checkpoint (rfc/return-scheduling.md §8). */
export const IMPORTED_GAME_PREDICTION_CHECKPOINT = "imported-game:next-move";

/**
 * A recorded guess of an imported game's next move. The reference is the move the game actually
 * played; the human-move model's rank says how human the guess was and never grades it.
 */
export interface ImportedGuess {
  readonly nodeId: string;
  readonly guessUci: string;
  readonly guessSan: string;
  readonly playedUci: string;
  readonly playedSan: string;
  readonly rank: number | null;
  readonly candidateCount: number;
}

/** The source-game move played from the active cursor, when the cursor sits on an imported game's mainline. */
export function importedNextMove(run: import("@chess-tabiya/runtime").DrillRun): { readonly uci: string; readonly san: string } | undefined {
  if (run.sessionKind !== "imported") return undefined;
  const primary = run.branches[0];
  const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId);
  if (primary === undefined || node === undefined || node.branchId !== primary.id) return undefined;
  const child = run.nodes.find((candidate) => candidate.branchId === primary.id && candidate.parentId === node.id);
  return child?.moveUci === null || child?.moveSan === null || child === undefined ? undefined : { uci: child.moveUci, san: child.moveSan };
}

export interface StartedRun {
  readonly runId: string;
}

interface ControllerOptions {
  readonly storage?: KeyValueStorage;
  readonly scheduler?: PollScheduler;
  readonly runId?: () => string;
  readonly seed?: () => number;
  readonly onRunStarted?: (target: StartedRun) => void;
}

export type MatchMode = "live" | "paused";

type Subscriber = (state: DrillSessionState) => void;
type StatePatch = {
  [Key in keyof DrillSessionState]?: DrillSessionState[Key] | undefined;
};

interface SessionOperation {
  readonly store: RunStateStore;
  readonly attachmentGeneration: number;
}

const TERMINAL_STATES = new Set(["achieved", "failed", "transitioned"]);

const RUN_ERROR_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  RUN_TERMINATED: "This attempt is complete. Rewind to an earlier move to try another branch.",
  MATCH_LIVE: "Pause the live match before rewinding, branching, or revealing feedback.",
  POLICY_MODE_UNSUPPORTED: "This opponent is not available here. Choose another opponent or another drill.",
  UNSUPPORTED_OPPONENT_POLICY: "This opponent is not available here. Choose another opponent or another drill.",
  ENGINE_UNAVAILABLE: "The opponent could not move right now. Try again, or choose another opponent.",
  PROVIDER_UNAVAILABLE: "A service this needs is unavailable right now. Try again, or continue without it.",
  // rfc/bot-policy.md §4.1: one learner sentence per closed opponent-ply action; no provider reason.
  OPPONENT_STALE_ROOT: "The board changed before the bot could reply. Reopen the run to continue from the current position.",
  OPPONENT_REQUEST_REUSED: "That bot reply was already recorded for another position. Reopen the run to continue.",
  OPPONENT_CONCURRENT_CONFLICT: "Another reply to this position was recorded at the same time. Reopen the run and try again.",
  OPPONENT_PROVIDER_UNAVAILABLE: "The bot's move model is unavailable right now. Try again, or choose another opponent.",
  OPPONENT_PROVIDER_FAILED: "The bot's move model returned an unusable answer. Try again, or choose another opponent.",
  NOT_ACTIVE_WRITER: "This run is active in another browser. Reopen it to watch or take control.",
  ILLEGAL_MOVE: "That move is not available from the position now shown. Check the board and try again.",
  MOVE_NOT_IN_RESPONSE: "That move is not available from the position now shown. Check the board and try again.",
  UNKNOWN_BRANCH: "That saved line changed or is no longer available. Reopen the run and try again.",
  UNKNOWN_GROUP: "That branch group changed or is no longer available. Reopen the run and try again.",
  ASSISTANCE_WITHHELD: "Help is not available at this point. Continue to the next checkpoint or finish the attempt.",
  FEEDBACK_WITHHELD: "Help is not available at this point. Continue to the next checkpoint or finish the attempt.",
  ENGINE_EVAL_UNAVAILABLE: "A calculation is not available right now. You can keep playing without it or try again.",
  EVIDENCE_UNAVAILABLE: "That support is not available right now. You can keep playing without it or try again.",
  CORPUS_UNAVAILABLE: "Human-game statistics are not available right now. You can keep playing without them.",
  TTS_UNAVAILABLE: "Spoken guidance is not available right now. The written guidance is unchanged.",
  VOICE_UNAVAILABLE: "Narrated guidance is not available right now. The grounded written guidance is unchanged.",
  SIMULATION_EXPIRED: "That preview has expired. Open the authored-line preview again.",
  RUN_NOT_FOUND: "This rehearsal is no longer available. Return to Play and choose another.",
  STORY_UNAVAILABLE: "This game's story is not ready yet. Return to the run or try again later.",
  UNSUPPORTED_RUN_SCHEMA: "This run was created by an incompatible Tabiya version. Update this deployment before reopening it.",
});

export function sessionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const known = RUN_ERROR_MESSAGES[error.code];
    if (known !== undefined) return known;
    if (error.status === 401 || error.status === 403) return "Your access to this run has changed. Sign in again or reopen it.";
    if (error.status === 404) return "This rehearsal is no longer available. Return to Play and choose another.";
    if (error.status === 409) return "This run changed before that action finished. Reopen it and try again.";
    if (error.status >= 500) return "Tabiya could not complete that action right now. Reopen the run to check its latest position, then try again.";
    return "That action could not be completed. Check the current position and try again.";
  }
  if (error instanceof Error && /Run is terminal at node:/u.test(error.message)) return RUN_ERROR_MESSAGES.RUN_TERMINATED!;
  return "Tabiya could not complete that action. Reopen the run to check its latest position, then try again.";
}

function browserStorage(): KeyValueStorage {
  if (typeof localStorage === "undefined") {
    throw new Error("The drill client requires browser localStorage");
  }
  return localStorage;
}

function randomRunId(): string {
  return `run-${crypto.randomUUID()}`;
}

function randomSeed(): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0]!;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function policyConfig(
  pack: DrillPackDefinition,
  capabilities: Capabilities,
): PolicyConfig {
  const authored = record(pack.opponentPolicy);
  const seedMode = authored.seedMode;
  return Object.freeze({
    seedMode:
      seedMode === "fixed" || seedMode === "per_run" || seedMode === "per_branch"
        ? seedMode
        : "fixed",
    locus: Object.freeze({
      executedAt: "server" as const,
      engineIds: Object.freeze(
        capabilities.engines.map((engine) => ({
          id: engine.id,
          version: engine.version,
        })),
      ),
      modelIds: Object.freeze(
        capabilities.engines.flatMap((engine) =>
          engine.modelId === undefined
            ? []
            : [{ id: engine.modelId, version: engine.version }],
        ),
      ),
    }),
  });
}

function positionPolicyConfig(capabilities: Capabilities): PolicyConfig {
  return Object.freeze({
    seedMode: "fixed" as const,
    locus: Object.freeze({
      executedAt: "server" as const,
      engineIds: Object.freeze(capabilities.engines.map((engine) => ({ id: engine.id, version: engine.version }))),
      modelIds: Object.freeze(capabilities.engines.flatMap((engine) => engine.modelId === undefined ? [] : [{ id: engine.modelId, version: engine.version }])),
    }),
  });
}

function selectorMode(
  pack: DrillPackDefinition,
  capabilities: Capabilities,
): "human_common" | "strong_engine" | "theory_strict" | "perfect_tablebase" | "practical_resistance" {
  const requested = record(pack.opponentPolicy).mode;
  if (
    (requested === "human_common" ||
      requested === "strong_engine" ||
      requested === "theory_strict" ||
      requested === "perfect_tablebase" ||
      requested === "practical_resistance") &&
    capabilities.policyModes.includes(requested)
  ) {
    return requested;
  }
  throw new ApiError(422, "POLICY_MODE_UNSUPPORTED", `${String(requested)} is unavailable`);
}

export class DrillSessionController {
  /** The session-only opponent after a provider failure (never persisted; opponent-recovery-journey). */
  #opponentOverride: SelectableOpponentMode | undefined;
  readonly #api: DrillClientApi;
  readonly #storage: KeyValueStorage;
  readonly #scheduler: PollScheduler | undefined;
  readonly #runId: () => string;
  readonly #seed: () => number;
  readonly #onRunStarted: ((target: StartedRun) => void) | undefined;
  readonly #subscribers = new Set<Subscriber>();
  #state: DrillSessionState = Object.freeze({ busy: false });
  #store: RunStateStore | undefined;
  #unsubscribeStore: (() => void) | undefined;
  #capabilities: Capabilities | undefined;
  #dismissedCheckpointSeq = 0;
  #lastFollowerRevealSeq = 0;
  #subscribingStore: RunStateStore | undefined;
  #matchMode: MatchMode | undefined;
  #botRequest: { readonly key: string; readonly id: `botreq_${string}` } | undefined;
  #projectionOnly = false;
  #attachmentGeneration = 0;

  constructor(api: DrillClientApi, options: ControllerOptions = {}) {
    this.#api = api;
    this.#storage = options.storage ?? browserStorage();
    this.#scheduler = options.scheduler;
    this.#runId = options.runId ?? randomRunId;
    this.#seed = options.seed ?? randomSeed;
    this.#onRunStarted = options.onRunStarted;
  }

  get state(): DrillSessionState {
    return this.#state;
  }

  subscribe(subscriber: Subscriber): () => void {
    this.#subscribers.add(subscriber);
    subscriber(this.#state);
    return () => this.#subscribers.delete(subscriber);
  }

  async resume(runId: string, options: { readonly matchMode?: MatchMode; readonly projectionOnly?: boolean } = {}): Promise<void> {
    const generation = ++this.#attachmentGeneration;
    this.#patch({ busy: true, error: undefined, simulation: undefined });
    try {
      this.#matchMode = options.matchMode;
      this.#projectionOnly = options.projectionOnly === true;
      const eventPage = await this.#api.events(runId, 0);
      if (!this.#attachmentIsCurrent(generation)) return;
      const started = eventPage.events[0];
      if (started?.type !== "run.started") {
        throw new TypeError("Cannot resume a run without its run.started event");
      }
      const claimed = this.#projectionOnly ? undefined : WriterSession.peek(runId, this.#storage);
      const [capabilities, graph] = await Promise.all([this.#api.capabilities(), this.#api.graph(runId, claimed?.writerId)]);
      if (!this.#attachmentIsCurrent(generation)) return;
      const session =
        graph.viewer.holdsLease && claimed !== undefined
          ? claimed
          : WriterSession.observe(runId, this.#storage);
      const run = projectRun(eventPage.events);
      if (started.data.sessionKind !== "pack") {
        const shapes = await this.#loadShapes();
        if (!this.#attachmentIsCurrent(generation)) return;
        this.#capabilities = capabilities;
        this.#attachStore(this.#newStore(session, run), undefined, undefined, shapes);
      } else {
        const packId = started.data.packId;
        if (packId === null) throw new TypeError("Pack run is missing its pack id");
        const { document, digest } = await this.#api.pack(packId);
        const shapes = await this.#loadShapes(document.shapes);
        if (!this.#attachmentIsCurrent(generation)) return;
        this.#capabilities = capabilities;
        this.#attachStore(this.#newStore(session, run), document, digest, shapes);
      }
      this.#patch({ viewer: graph.viewer });
      await this.#playOpponentIfNeeded(false, generation);
      if (!this.#attachmentIsCurrent(generation)) return;
      await this.#refreshAuthoredFeedback();
      if (!this.#attachmentIsCurrent(generation)) return;
      await this.#refreshReasoning();
    } catch (error) {
      if (this.#attachmentIsCurrent(generation)) this.#fail(error);
    }
  }

  async startPack(packId: string, scheduleId?: string): Promise<void> {
    const generation = ++this.#attachmentGeneration;
    this.#projectionOnly = false;
    this.#matchMode = undefined;
    this.#patch({ busy: true, error: undefined, simulation: undefined });
    try {
      const [{ document, digest }, capabilities] = await Promise.all([
        this.#api.pack(packId),
        this.#api.capabilities(),
      ]);
      if (!this.#attachmentIsCurrent(generation)) return;
      selectorMode(document, capabilities);
      const runId = this.#runId();
      const seed = this.#seed();
      const session = WriterSession.claimFor(runId, this.#storage);
      const run = await this.#api.createRun(
        {
          id: runId,
          session: { kind: "pack", packId },
          policyConfig: policyConfig(document, capabilities),
          seed,
          ...(scheduleId === undefined ? {} : { intent: { origin: "fresh" as const, scheduleId } }),
        },
        session.writerId,
      );
      if (!this.#attachmentIsCurrent(generation)) return;
      const shapes = await this.#loadShapes(document.shapes);
      if (!this.#attachmentIsCurrent(generation)) return;
      this.#capabilities = capabilities;
      const store = this.#newStore(session, run);
      this.#attachStore(store, document, digest, shapes);
      await this.#playOpponentIfNeeded(false, generation);
      if (!this.#attachmentIsCurrent(generation)) return;
      await this.#refreshAuthoredFeedback();
      if (this.#attachmentIsCurrent(generation)) this.#onRunStarted?.({ runId });
    } catch (error) {
      if (this.#attachmentIsCurrent(generation)) this.#fail(error);
    }
  }

  async startDuplicate(sourceRunId: string, scheduleId?: string): Promise<void> {
    const generation = ++this.#attachmentGeneration;
    this.#projectionOnly = false;
    this.#matchMode = undefined;
    this.#patch({ busy: true, error: undefined, simulation: undefined });
    try {
      if (this.#api.duplicateRun === undefined) throw new Error("Starting another attempt is unavailable");
      const runId = this.#runId();
      const session = WriterSession.claimFor(runId, this.#storage);
      const [run, capabilities] = await Promise.all([
        this.#api.duplicateRun(sourceRunId, {
          id: runId,
          seed: this.#seed(),
          ...(scheduleId === undefined ? {} : { scheduleId }),
        }, session.writerId),
        this.#api.capabilities(),
      ]);
      if (!this.#attachmentIsCurrent(generation)) return;
      if (run.sessionKind === "pack") {
        if (run.packId === null) throw new TypeError("Duplicated pack run is missing its pack id");
        const { document, digest } = await this.#api.pack(run.packId);
        const shapes = await this.#loadShapes(document.shapes);
        if (!this.#attachmentIsCurrent(generation)) return;
        this.#capabilities = capabilities;
        this.#attachStore(this.#newStore(session, run), document, digest, shapes);
      } else {
        const shapes = await this.#loadShapes();
        if (!this.#attachmentIsCurrent(generation)) return;
        this.#capabilities = capabilities;
        this.#attachStore(this.#newStore(session, run), undefined, undefined, shapes);
      }
      await this.#playOpponentIfNeeded(false, generation);
      if (!this.#attachmentIsCurrent(generation)) return;
      await this.#refreshAuthoredFeedback();
      if (this.#attachmentIsCurrent(generation)) this.#onRunStarted?.({ runId });
    } catch (error) {
      if (this.#attachmentIsCurrent(generation)) this.#fail(error);
    }
  }

  async startPosition(input: {
    readonly fen: string;
    readonly side: "white" | "black";
    readonly mode: "human_common" | "strong_engine";
    readonly targetElo?: 1000 | 1400 | 1800 | 2200;
    /** A registered bot profile (rfc/bot-policy.md §4.1); exclusive with `targetElo`. */
    readonly profile?: BotProfileReference;
  }): Promise<void> {
    const generation = ++this.#attachmentGeneration;
    this.#projectionOnly = false;
    this.#matchMode = undefined;
    this.#patch({ busy: true, error: undefined });
    try {
      const capabilities = await this.#api.capabilities();
      if (!this.#attachmentIsCurrent(generation)) return;
      if (!capabilities.policyModes.includes(input.mode)) throw new ApiError(422, "POLICY_MODE_UNSUPPORTED", `${input.mode} is unavailable`);
      if (input.profile !== undefined && (input.mode !== "human_common" || input.targetElo !== undefined)) throw new ApiError(422, "INVALID_REQUEST", "A bot is chosen instead of a raw rung, never with one");
      const runId = this.#runId(), seed = this.#seed();
      const session = WriterSession.claimFor(runId, this.#storage);
      const run = await this.#api.createRun({
        id: runId,
        session: {
          kind: "position",
          start: { fen: input.fen, side: input.side },
          feedbackPolicy: "attempt_end",
          opponentPolicy: input.profile !== undefined
            ? { mode: "human_common", profile: input.profile }
            : {
                mode: input.mode,
                ...(input.mode === "human_common" && input.targetElo !== undefined
                  ? { targetElo: input.targetElo }
                  : {}),
              },
        },
        policyConfig: positionPolicyConfig(capabilities),
        seed,
      }, session.writerId);
      if (!this.#attachmentIsCurrent(generation)) return;
      // The response must echo the exact profile before the game opens (opponent-experience §2.6).
      if (input.profile !== undefined && run.opponentPolicy.profile?.digest !== input.profile.digest) throw new ApiError(502, "INVALID_RESPONSE", "The created run does not carry the chosen bot");
      const shapes = await this.#loadShapes();
      if (!this.#attachmentIsCurrent(generation)) return;
      this.#capabilities = capabilities;
      this.#attachStore(this.#newStore(session, run), undefined, undefined, shapes);
      await this.#playOpponentIfNeeded(false, generation);
      if (this.#attachmentIsCurrent(generation)) this.#onRunStarted?.({ runId });
    } catch (error) {
      if (this.#attachmentIsCurrent(generation)) this.#fail(error);
    }
  }

  async move(uci: string): Promise<boolean> {
    if (this.#state.busy) return false;
    const operation = this.#sessionOperation();
    const store = operation.store;
    let learnerMoveCommitted = false;
    this.#patch({ busy: true, error: undefined });
    try {
      const result = await store.move({ uci });
      learnerMoveCommitted = true;
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      if (this.#captureCheckpoint(result.emitted)) {
        await this.#refreshAuthoredFeedback();
        if (!this.#sessionOperationIsCurrent(operation)) return false;
        await this.#refreshReasoning();
        if (!this.#sessionOperationIsCurrent(operation)) return false;
        this.#patch({ busy: false });
        return true;
      }
      if (this.#hasOutcome(result.emitted)) {
        await this.#refreshAuthoredFeedback();
        if (!this.#sessionOperationIsCurrent(operation)) return false;
        this.#patch({ busy: false });
        return true;
      }
      if (this.#matchMode === "live") {
        store.follow();
      }
      await this.#playOpponentIfNeeded();
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#patch({ busy: false });
      return true;
    } catch (error) {
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#fail(error);
      return learnerMoveCommitted;
    }
  }

  /** rfc/hint-distance.md §7: the Guided Hint seat's three operations over the attached run store. */
  readonly hints = Object.freeze({
    request: (body: HintRequestBody): Promise<HintResponse> => this.#requiredStore().requestHint(body),
    poll: (requestId: string): Promise<HintResponse> => this.#requiredStore().pollHint(requestId),
    cancel: (requestId: string): Promise<HintResponse> => this.#requiredStore().cancelHint(requestId),
  });

  async reveal(): Promise<void> {
    if (this.#state.busy) return;
    const operation = this.#sessionOperation();
    this.#patch({ busy: true, error: undefined });
    try {
      await operation.store.reveal();
      if (this.#sessionOperationIsCurrent(operation)) this.#patch({ busy: false });
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
    }
  }

  async claimLease(): Promise<void> {
    const sourceStore = this.#requiredStore();
    const runId = sourceStore.snapshot.run.id;
    const generation = this.#attachmentGeneration;
    if (this.#api.claimLease === undefined) {
      throw new Error("Lease claiming is not available");
    }
    const session = WriterSession.claimFor(runId, this.#storage);
    await this.#api.claimLease(runId, session.writerId);
    if (!this.#attachmentIsCurrent(generation) || this.#store !== sourceStore) return;
    await this.resume(runId, { ...(this.#matchMode === undefined ? {} : { matchMode: this.#matchMode }) });
  }

  setMatchMode(mode: MatchMode | undefined): void {
    this.#matchMode = mode;
  }

  async continueCheckpoint(): Promise<boolean> {
    if (this.#state.busy) return false;
    const operation = this.#sessionOperation();
    const checkpoint = this.#state.checkpoint;
    const previousDismissedCheckpointSeq = this.#dismissedCheckpointSeq;
    if (checkpoint !== undefined) {
      this.#dismissedCheckpointSeq = checkpoint.eventSeq;
    }
    this.#patch({ reasoning: undefined, busy: true });
    try {
      await this.#playOpponentIfNeeded(true);
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#patch({
        busy: false,
        ...(this.#state.checkpoint?.eventSeq === checkpoint?.eventSeq ? { checkpoint: undefined } : {}),
      });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) {
        this.#dismissedCheckpointSeq = previousDismissedCheckpointSeq;
        this.#fail(error);
      }
      return false;
    }
  }

  async recordPrediction(predictedUci: string): Promise<void> {
    if (this.#state.busy) return;
    const operation = this.#sessionOperation();
    const checkpoint = this.#state.checkpoint;
    if (checkpoint?.interaction?.type !== "prediction") throw new Error("No prediction checkpoint is active");
    this.#patch({ busy: true, error: undefined });
    try {
      const request = this.#selectionRequest();
      const result = await operation.store.prediction({
        ...request,
        checkpointId: checkpoint.id,
        nodeId: checkpoint.nodeId,
        predictedUci,
      });
      if (!this.#sessionOperationIsCurrent(operation)) return;
      this.#dismissedCheckpointSeq = checkpoint.eventSeq;
      this.#patch({ checkpoint: undefined });
      await operation.store.appendOpponentPly(result.selection);
      if (this.#sessionOperationIsCurrent(operation)) this.#patch({ busy: false });
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
    }
  }

  /** Guess-the-move on an imported game: records the guess; the board does not advance. */
  async guessImportedMove(predictedUci: string): Promise<void> {
    if (this.#state.busy) return;
    const operation = this.#sessionOperation();
    const run = this.#requiredRun().run;
    const played = importedNextMove(run);
    if (played === undefined) throw new Error("No source-game move follows this position");
    const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
    this.#patch({ busy: true, error: undefined, importedGuess: undefined });
    try {
      const result = await operation.store.prediction({
        ...this.#selectionRequest(),
        checkpointId: IMPORTED_GAME_PREDICTION_CHECKPOINT,
        nodeId: node.id,
        predictedUci,
      });
      if (!this.#sessionOperationIsCurrent(operation)) return;
      const candidates = result.selection.candidates ?? [];
      const guessed = candidates.find((candidate) => candidate.moveUci === predictedUci);
      this.#patch({
        busy: false,
        importedGuess: Object.freeze({
          nodeId: node.id,
          guessUci: predictedUci,
          guessSan: moveSanFromUci(node.fen, predictedUci) ?? predictedUci,
          playedUci: played.uci,
          playedSan: played.san,
          rank: guessed?.rank ?? null,
          candidateCount: candidates.length,
        }),
      });
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
    }
  }

  async recordReasoning(input: { readonly transcript?: import("@chess-tabiya/runtime").ReasoningTranscript; readonly skipped?: true }): Promise<void> {
    if (this.#state.busy) return;
    const operation = this.#sessionOperation();
    const checkpoint = this.#state.checkpoint;
    if (checkpoint?.interaction?.type !== "stated_reasoning") throw new Error("No stated-reasoning checkpoint is active");
    this.#patch({ busy: true, error: undefined });
    try {
      const result = await operation.store.recordReasoning({ nodeId: checkpoint.nodeId, checkpointEventSeq: checkpoint.eventSeq, ...input });
      if (!this.#sessionOperationIsCurrent(operation)) return;
      this.#patch({ busy: false, reasoning: result.reasoning });
      await this.#refreshAuthoredFeedback();
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
    }
  }

  async rewind(target: { readonly nodeId: string; readonly branchId?: string } | { readonly checkpointId: string; readonly branchId?: never }): Promise<boolean> {
    if (this.#state.busy) return false;
    const operation = this.#sessionOperation();
    this.#patch({ busy: true, error: undefined });
    try {
      await operation.store.rewind(target);
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#patch({ busy: false, checkpoint: undefined, comparison: undefined, comparisonBranchIds: undefined });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  async fork(label?: string, intent?: string): Promise<boolean> {
    if (this.#state.busy) return false;
    const operation = this.#sessionOperation();
    const run = this.#requiredRun();
    this.#patch({ busy: true, error: undefined });
    try {
      await operation.store.fork({
        nodeId: run.run.activeCursor.nodeId,
        ...(label === undefined || label.trim() === "" ? {} : { label }),
        ...(intent === undefined || intent.trim() === "" ? {} : { intent }),
      });
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#patch({ busy: false });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  async createGroup(input: CreateGroupRequest): Promise<CreateGroupResult | undefined> {
    if (this.#state.busy) return undefined;
    const operation = this.#sessionOperation();
    this.#patch({ busy: true, error: undefined });
    try {
      const result = await operation.store.createGroup(input);
      if (!this.#sessionOperationIsCurrent(operation)) return undefined;
      await this.#playOpponentIfNeeded();
      if (!this.#sessionOperationIsCurrent(operation)) return undefined;
      this.#patch({ busy: false });
      return result;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return undefined;
    }
  }

  async analyzeMissingEvidence(nodeIds: readonly string[]): Promise<boolean> {
    if (
      this.#state.busy ||
      nodeIds.length === 0 ||
      nodeIds.length > 16 ||
      new Set(nodeIds).size !== nodeIds.length
    ) return false;
    const operation = this.#sessionOperation();
    const source = this.#requiredRun().run;
    if (nodeIds.some((nodeId) => !source.nodes.some((node) => node.id === nodeId))) return false;
    this.#patch({ busy: true, error: undefined });
    try {
      const result = await operation.store.analysis(nodeIds);
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      const current = this.#state.runState?.run;
      if (
        current?.id !== source.id ||
        nodeIds.some((nodeId) => !current.nodes.some((node) => node.id === nodeId)) ||
        result.jobs.length !== nodeIds.length ||
        result.jobs.some((job) => job.id.length === 0) ||
        new Set(result.jobs.map((job) => job.id)).size !== result.jobs.length
      ) {
        throw new TypeError("Analysis response did not match the requested positions");
      }
      this.#patch({ busy: false });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  async scheduleReturn(nodeId: string): Promise<boolean> {
    if (this.#state.busy) return false;
    const operation = this.#sessionOperation();
    this.#patch({ busy: true, error: undefined });
    try {
      await operation.store.scheduleReturn({ nodeId, kind: "blocked" });
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#patch({ busy: false });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  async simulateAuthoredLines(): Promise<boolean> {
    if (this.#state.busy) return false;
    const sourceRunId = this.#state.runState?.run.id;
    const sourceNodeId = this.#state.runState?.run.activeCursor.nodeId;
    if (sourceRunId === undefined || sourceNodeId === undefined) return false;
    const operation = this.#sessionOperation();
    this.#patch({ busy: true, error: undefined });
    try {
      const simulation = await operation.store.simulate();
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      if (
        this.#state.runState?.run.id !== sourceRunId ||
        this.#state.runState.run.activeCursor.nodeId !== sourceNodeId
      ) {
        this.#patch({
          busy: false,
          error: "This run changed before the preview was ready. Check the current position and try again.",
        });
        return false;
      }
      this.#patch({ busy: false, simulation });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  closeSimulation(): void {
    this.#patch({ simulation: undefined });
  }

  async enterSimulation(branchIndex: number): Promise<boolean> {
    if (this.#state.busy) return false;
    const simulation = this.#state.simulation;
    if (simulation === undefined) return false;
    const operation = this.#sessionOperation();
    this.#patch({ busy: true, error: undefined });
    try {
      await operation.store.enterSimulation(simulation.simulationId, branchIndex);
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#patch({ busy: false, simulation: undefined, comparison: undefined, comparisonBranchIds: undefined });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  /**
   * Asks for the opponent's reply again after a failed attempt. For a bot-profile run the same
   * idempotency key is reused while the root is unchanged, so a reply that was committed but whose
   * response was lost comes back as the stored reply rather than a second move.
   */
  async retryOpponent(): Promise<boolean> {
    if (this.#state.busy) return false;
    const operation = this.#sessionOperation();
    this.#patch({ busy: true, error: undefined, opponentPause: undefined });
    try {
      await this.#playOpponentIfNeeded();
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#patch({ busy: false });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  /**
   * Switches the opponent for the remainder of this session after a provider failure, then asks the
   * new opponent for the paused reply. In memory only: the run's policy, digest and events are not
   * rewritten, and the surface says the run record does not retain the change.
   */
  async changeOpponent(mode: SelectableOpponentMode): Promise<boolean> {
    if (this.#state.busy) return false;
    const pause = this.#state.opponentPause;
    if (pause === undefined || !pause.alternatives.some((alternative) => alternative.mode === mode)) return false;
    const from = (this.#state.opponentChange?.to ?? pause.mode) as SelectableOpponentMode;
    this.#opponentOverride = mode;
    this.#patch({ opponentChange: Object.freeze({ from, to: mode }) });
    return this.retryOpponent();
  }

  #pauseFor(error: ApiError, mode: string): OpponentPause {
    const { reason, retryAfterMs } = opponentPauseReason(error);
    const capabilities = this.#capabilities;
    const alternatives = (["human_common", "strong_engine"] as const)
      .filter((candidate) => candidate !== mode && capabilities?.policyModes.includes(candidate) === true)
      .map((candidate) => {
        const notice = providerAvailabilityNotice(capabilityModeAvailability(capabilities?.providerHealth, candidate), "That opponent");
        return Object.freeze({ mode: candidate, label: OPPONENT_MODE_LABELS[candidate], requestable: notice.requestable, note: notice.reason });
      });
    return Object.freeze({ reason, retryAfterMs, mode, alternatives: Object.freeze(alternatives) });
  }

  async switchBranch(leafNodeId: string, branchId: string): Promise<boolean> {
    if (!await this.rewind({ nodeId: leafNodeId, branchId })) return false;
    const operation = this.#sessionOperation();
    this.#patch({ busy: true });
    try {
      await this.#playOpponentIfNeeded();
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      this.#patch({ busy: false });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  async compare(branchIds: readonly string[]): Promise<boolean> {
    if (this.#state.busy || branchIds.length < 2 || new Set(branchIds).size !== branchIds.length) return false;
    const operation = this.#sessionOperation();
    const source = this.#requiredRun().run;
    const requestedLeaves = branchIds.map((branchId) => ({
      branchId,
      leafNodeId: branchPath(source, branchId).at(-1)?.id,
    }));
    if (requestedLeaves.some((entry) => entry.leafNodeId === undefined)) return false;
    this.#patch({ busy: true, error: undefined });
    try {
      const store = operation.store;
      // Comparison is a committed/review surface. Drain any ready evidence before the
      // server snapshots the branches; otherwise the comparison can permanently capture
      // empty strips while the normal evidence poll attaches the same results one tick later.
      await store.pollEvidence();
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      const run = store.snapshot.run;
      const stillCurrent = run.id === source.id && requestedLeaves.every((entry) =>
        branchPath(run, entry.branchId).at(-1)?.id === entry.leafNodeId,
      );
      if (!stillCurrent) throw new Error("Comparison source changed");
      const comparison = await this.#api.compare(run.id, branchIds);
      if (!this.#sessionOperationIsCurrent(operation)) return false;
      if (
        comparison.columns.length !== requestedLeaves.length ||
        requestedLeaves.some((entry) => !comparison.columns.some((column) =>
          column.branchId === entry.branchId && column.leafNodeId === entry.leafNodeId,
        ))
      ) throw new Error("Comparison response did not match its request");
      const current = this.#state.runState?.run;
      if (
        current?.id !== source.id ||
        !requestedLeaves.every((entry) => branchPath(current, entry.branchId).at(-1)?.id === entry.leafNodeId)
      ) throw new Error("Comparison source changed");
      this.#patch({
        busy: false,
        checkpoint: undefined,
        comparison,
        comparisonBranchIds: Object.freeze([...branchIds]),
      });
      return true;
    } catch (error) {
      if (this.#sessionOperationIsCurrent(operation)) this.#fail(error);
      return false;
    }
  }

  closeCompare(): void {
    this.#patch({ comparison: undefined, comparisonBranchIds: undefined });
  }

  exportPgn(branchIds?: readonly string[]): Promise<PgnDownload> {
    return this.#api.pgn(this.#requiredRun().run.id, branchIds);
  }

  stopSession(): void {
    this.#attachmentGeneration += 1;
    this.#unsubscribeStore?.();
    this.#unsubscribeStore = undefined;
    this.#store?.stop();
    this.#store = undefined;
    this.#capabilities = undefined;
    this.#dismissedCheckpointSeq = 0;
    this.#matchMode = undefined;
    this.#projectionOnly = false;
    this.#state = Object.freeze({ busy: false });
    this.#emit();
  }

  destroy(): void {
    this.#attachmentGeneration += 1;
    this.#unsubscribeStore?.();
    this.#store?.stop();
    this.#subscribers.clear();
  }

  async #playOpponentIfNeeded(ignoreCheckpoint = false, attachmentGeneration?: number): Promise<void> {
    const generation = attachmentGeneration ?? this.#attachmentGeneration;
    if (this.#projectionOnly || this.#matchMode !== undefined) return;
    const pack = this.#state.pack;
    const capabilities = this.#capabilities;
    if (capabilities === undefined) throw new Error("Capabilities are unavailable");
    const store = this.#requiredStore();
    const runState = this.#requiredRun();
    if (runState.access === "read_only" || (!ignoreCheckpoint && this.#state.checkpoint !== undefined)) {
      return;
    }
    const run = runState.run;
    const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId)!;
    if (
      TERMINAL_STATES.has(node.objectiveState) ||
      run.events.some(
        (event) => event.type === "outcome.reached" && event.data.nodeId === node.id,
      ) ||
      boardModel(node.fen, pack === undefined ? run.start.side : packStartSide(pack)).turnColor === (pack === undefined ? run.start.side : packStartSide(pack))
    ) {
      return;
    }
    if (run.opponentPolicy.profile !== undefined) {
      await this.#playBotReply(store, generation);
      return;
    }
    const group = groupsFromEvents(run).find((candidate: BranchGroup) =>
      candidate.members.some((member) => member.branchId === run.activeCursor.branchId),
    );
    const request = this.#selectionRequest();
    let selection: import("@chess-tabiya/runtime").OpponentSelection;
    let source: "live" | "cached_exact" = "live";
    try {
      if (group !== undefined) {
        selection = (await store.groupReply(group.groupId, request)).selection;
      } else if (this.#api.selectMoveReceipted !== undefined) {
        const receipted = await this.#api.selectMoveReceipted(request);
        selection = receipted.selection;
        source = receipted.source;
      } else {
        selection = await this.#api.selectMove(request);
      }
    } catch (error) {
      // A provider failure pauses BEFORE any opponent move is committed: never a Stockfish, random
      // or stale different-position reply (rfc/provider-health-degradation.md §10).
      if (error instanceof ApiError && OPPONENT_PROVIDER_FAILURES.has(error.code) && this.#store === store && this.#attachmentIsCurrent(generation)) {
        this.#patch({ opponentPause: this.#pauseFor(error, request.policy.mode), opponentSource: undefined });
        return;
      }
      throw error;
    }
    if (
      this.#store !== store ||
      !this.#attachmentIsCurrent(generation)
    ) return;
    this.#patch({ opponentPause: undefined, opponentSource: source });
    const result = await store.appendOpponentPly(selection);
    if (
      this.#store !== store ||
      !this.#attachmentIsCurrent(generation)
    ) return;
    if (this.#captureCheckpoint(result.emitted)) {
      await this.#refreshAuthoredFeedback();
      await this.#refreshReasoning();
    } else if (this.#hasOutcome(result.emitted)) {
      await this.#refreshAuthoredFeedback();
    }
  }

  /**
   * A bot-profile reply through the server-owned operation. The idempotency key is kept per root
   * (run, node, branch, event head) so a retry after a lost response or a retryable failure reuses
   * it and receives the committed reply instead of a second move; a stale root or a reused request
   * issues a fresh key next time.
   */
  async #playBotReply(store: RunStateStore, generation: number): Promise<void> {
    const run = store.snapshot.run;
    const key = `${run.id}\u0000${run.activeCursor.nodeId}\u0000${run.activeCursor.branchId}\u0000${runEventHeadDigest(run)}`;
    if (this.#botRequest?.key !== key) {
      this.#botRequest = { key, id: botOpponentPlyRequestId((bytes) => globalThis.crypto.getRandomValues(bytes)) };
    }
    const requestId = this.#botRequest.id;
    try {
      const response = await store.botOpponentPly(requestId);
      if (this.#botRequest?.id === requestId) this.#botRequest = undefined;
      if (this.#store !== store || !this.#attachmentIsCurrent(generation)) return;
      this.#patch({ botReply: Object.freeze({ layers: response.operation.layers, replayed: response.result.kind !== "committed" }) });
      if (this.#hasOutcome(response.emitted)) await this.#refreshAuthoredFeedback();
    } catch (error) {
      if (error instanceof BotOpponentPlyError && (error.result.action === "refresh_position" || error.result.action === "issue_new_request") && this.#botRequest?.id === requestId) {
        this.#botRequest = undefined;
      }
      throw error;
    }
  }

  #selectionRequest(): import("./api.js").SelectMoveRequest {
    const pack = this.#state.pack;
    const capabilities = this.#capabilities;
    if (capabilities === undefined) throw new Error("Capabilities are unavailable");
    const run = this.#requiredRun().run;
    const legPolicy = pack === undefined
      ? undefined
      : trajectoryPolicyAt(pack, run, run.activeCursor.nodeId);
    const authored = record(legPolicy?.policy ?? pack?.opponentPolicy ?? run.opponentPolicy);
    const requestedMode = authored.mode;
    const mode = pack === undefined
      ? run.opponentPolicy.mode as "human_common" | "strong_engine"
      : legPolicy === undefined
        ? selectorMode(pack, capabilities)
        : requestedMode === "human_common" || requestedMode === "strong_engine"
          ? capabilities.policyModes.includes(requestedMode)
            ? requestedMode
            : (() => { throw new ApiError(503, "POLICY_MODE_UNSUPPORTED", `${requestedMode} is unavailable for trajectory leg ${legPolicy.legId}`); })()
          : (() => { throw new ApiError(422, "POLICY_MODE_UNSUPPORTED", `${String(requestedMode)} is invalid for trajectory leg ${legPolicy.legId}`); })();
    const branch = run.branches.find((candidate) => candidate.id === run.activeCursor.branchId)!;
    const effectiveMode = this.#opponentOverride ?? mode;
    return {
      startFen: pack?.start.fen ?? run.start.fen,
      historyUci: historyFrom(run, run.activeCursor.nodeId).flatMap((historyNode) =>
        historyNode.moveUci === null ? [] : [historyNode.moveUci],
      ),
      policy: {
        mode: effectiveMode,
        policyConfigDigest: run.sessionDigest,
        ...(typeof authored.targetElo === "number"
          ? { targetElo: authored.targetElo }
          : {}),
        ...(typeof authored.temperature === "number"
          ? { temperature: authored.temperature }
          : {}),
        ...(typeof authored.topP === "number" ? { topP: authored.topP } : {}),
      },
      seed: branch.seed,
      ...(pack === undefined ? {} : { packId: pack.id }),
    };
  }

  async #refreshAuthoredFeedback(): Promise<void> {
    const runState = this.#state.runState ?? this.#subscribingStore?.snapshot;
    if (runState === undefined) return;
    const runId = runState.run.id;
    const authoredFeedback = await this.#api.authoredFeedback(runId);
    if ((this.#state.runState ?? this.#subscribingStore?.snapshot)?.run.id !== runId) return;
    this.#patch({ authoredFeedback });
  }

  async #refreshReasoning(): Promise<void> {
    const checkpoint = this.#state.checkpoint;
    const runState = this.#state.runState ?? this.#subscribingStore?.snapshot;
    if (checkpoint?.interaction?.type !== "stated_reasoning" || runState === undefined) return;
    const runId = runState.run.id;
    const checkpointId = checkpoint.id;
    const reasoning = await this.#api.reasoning(runId, checkpointId);
    if (
      (this.#state.runState ?? this.#subscribingStore?.snapshot)?.run.id !== runId ||
      this.#state.checkpoint?.id !== checkpointId
    ) return;
    this.#patch({ reasoning });
  }

  #captureCheckpoint(events: readonly DrillRunEvent[]): boolean {
    if (!events.some((event) => event.type === "checkpoint.reached")) return false;
    if (this.#state.pack === undefined) return false;
    const checkpoint = latestCheckpoint(
      this.#requiredPack(),
      this.#requiredRun().run,
      this.#dismissedCheckpointSeq,
    );
    if (checkpoint === undefined) return false;
    this.#patch({ checkpoint, reasoning: undefined });
    return true;
  }

  #hasOutcome(events: readonly DrillRunEvent[]): boolean {
    return events.some((event) => event.type === "outcome.reached");
  }

  #newStore(
    session: WriterSession,
    run: RunStateSnapshot["run"],
  ): RunStateStore {
    return this.#scheduler === undefined
      ? new RunStateStore(this.#api, session, run)
      : new RunStateStore(this.#api, session, run, this.#scheduler);
  }

  #attachStore(
    store: RunStateStore,
    pack: DrillPackDefinition | undefined,
    digest: string | undefined,
    shapes: readonly ShapeEntryView[],
  ): void {
    const attachmentGeneration = this.#attachmentGeneration;
    this.#unsubscribeStore?.();
    this.#store?.stop();
    this.#store = store;
    this.#subscribingStore = store;
    this.#lastFollowerRevealSeq = Math.max(
      0,
      ...store.snapshot.run.events
        .filter((event) => event.type === "outcome.reached")
        .map((event) => event.seq),
    );
    this.#unsubscribeStore = store.subscribe((runState) => {
      this.#patch({ runState });
      if (runState.access !== "read_only") return;
      const revealSeq = Math.max(
        0,
        ...runState.run.events
          .filter((event) => event.type === "outcome.reached")
          .map((event) => event.seq),
      );
      if (revealSeq <= this.#lastFollowerRevealSeq) return;
      this.#lastFollowerRevealSeq = revealSeq;
      void this.#refreshAuthoredFeedback().catch((error: unknown) => {
        if (this.#store === store && this.#attachmentIsCurrent(attachmentGeneration)) this.#fail(error);
      });
    });
    this.#subscribingStore = undefined;
    store.start();
    this.#patch({
      pack,
      packDigest: digest,
      shapes,
      runState: store.snapshot,
      busy: false,
      error: undefined,
      checkpoint: pack === undefined ? undefined : latestCheckpoint(pack, store.snapshot.run),
      comparison: undefined,
      comparisonBranchIds: undefined,
      authoredFeedback: undefined,
      reasoning: undefined,
      botReply: undefined,
      opponentPause: undefined,
      opponentSource: undefined,
      opponentChange: undefined,
    });
    this.#opponentOverride = undefined;
  }

  async #loadShapes(ids?: readonly ShapeReference[]): Promise<readonly ShapeEntryView[]> {
    const selected = ids?.flatMap((reference) => typeof reference === "string" ? [reference] : reference.relation === "present" ? [reference.shape] : []) ?? (await this.#api.shapes()).map((shape) => shape.id);
    return Object.freeze(await Promise.all(selected.map(async (id) => (await this.#api.shape(id)).document)));
  }

  #requiredStore(): RunStateStore {
    if (this.#store === undefined) throw new Error("No drill run is active");
    return this.#store;
  }

  #sessionOperation(): SessionOperation {
    return Object.freeze({
      store: this.#requiredStore(),
      attachmentGeneration: this.#attachmentGeneration,
    });
  }

  #sessionOperationIsCurrent(operation: SessionOperation): boolean {
    return this.#store === operation.store && this.#attachmentIsCurrent(operation.attachmentGeneration);
  }

  #requiredPack(): DrillPackDefinition {
    if (this.#state.pack === undefined) throw new Error("No drill pack is active");
    return this.#state.pack;
  }

  #requiredRun(): RunStateSnapshot {
    if (this.#state.runState === undefined) throw new Error("No drill run is active");
    return this.#state.runState;
  }

  #fail(error: unknown): void {
    this.#patch({
      busy: false,
      error: sessionErrorMessage(error),
    });
  }

  #attachmentIsCurrent(generation: number): boolean {
    return generation === this.#attachmentGeneration;
  }

  #patch(patch: StatePatch): void {
    const next = { ...this.#state, ...patch } as Record<string, unknown>;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) delete next[key];
    }
    this.#state = Object.freeze(next) as unknown as DrillSessionState;
    this.#emit();
  }

  #emit(): void {
    for (const subscriber of this.#subscribers) subscriber(this.#state);
  }
}
