import type { DrillPackDefinition, ShapeReference } from "@chess-tabiya/schema/drill-pack";
import {
  historyFrom,
  groupsFromEvents,
  projectRun,
  trajectoryPolicyAt,
  type BranchComparison,
  type DrillRunEvent,
  type PolicyConfig,
  type BranchGroup,
} from "@chess-tabiya/runtime";

import {
  ApiError,
  type Capabilities,
  type AuthoredFeedbackPage,
  type DrillClientApi,
  type PgnDownload,
  type RunGraph,
  type ShapeEntryView,
  type CreateGroupRequest,
  type CreateGroupResult,
  type ReasoningPage,
} from "./api.js";
import { boardModel } from "./board-model.js";
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
  readonly viewer?: RunGraph["viewer"];
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

const TERMINAL_STATES = new Set(["achieved", "failed", "transitioned"]);

export function sessionErrorMessage(error: unknown): string {
  if ((error instanceof ApiError && error.code === "RUN_TERMINATED") || (error instanceof Error && /Run is terminal at node:/u.test(error.message))) {
    return "This attempt is complete. Rewind to an earlier move to try another branch.";
  }
  if (error instanceof ApiError && error.code === "MATCH_LIVE") {
    return "Pause the live match before rewinding, branching, or revealing feedback.";
  }
  return error instanceof Error ? error.message : String(error);
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
  #projectionOnly = false;

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
    this.#patch({ busy: true, error: undefined });
    try {
      this.#matchMode = options.matchMode;
      this.#projectionOnly = options.projectionOnly === true;
      const eventPage = await this.#api.events(runId, 0);
      const started = eventPage.events[0];
      if (started?.type !== "run.started") {
        throw new TypeError("Cannot resume a run without its run.started event");
      }
      const claimed = this.#projectionOnly ? undefined : WriterSession.peek(runId, this.#storage);
      const [capabilities, graph] = await Promise.all([this.#api.capabilities(), this.#api.graph(runId, claimed?.writerId)]);
      const session =
        graph.viewer.holdsLease && claimed !== undefined
          ? claimed
          : WriterSession.observe(runId, this.#storage);
      const store = this.#newStore(session, projectRun(eventPage.events));
      this.#capabilities = capabilities;
      if (started.data.sessionKind !== "pack") {
        this.#attachStore(store, undefined, undefined, await this.#loadShapes());
      } else {
        const packId = started.data.packId;
        if (packId === null) throw new TypeError("Pack run is missing its pack id");
        const { document, digest } = await this.#api.pack(packId);
        this.#attachStore(store, document, digest, await this.#loadShapes(document.shapes));
      }
      this.#patch({ viewer: graph.viewer });
      await this.#playOpponentIfNeeded();
      await this.#refreshAuthoredFeedback();
      await this.#refreshReasoning();
    } catch (error) {
      this.#patch({
        busy: false,
        error: sessionErrorMessage(error),
      });
    }
  }

  async startPack(packId: string): Promise<void> {
    this.#projectionOnly = false;
    this.#matchMode = undefined;
    this.#patch({ busy: true, error: undefined });
    try {
      const [{ document, digest }, capabilities] = await Promise.all([
        this.#api.pack(packId),
        this.#api.capabilities(),
      ]);
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
        },
        session.writerId,
      );
      this.#capabilities = capabilities;
      const store = this.#newStore(session, run);
      this.#attachStore(store, document, digest, await this.#loadShapes(document.shapes));
      await this.#playOpponentIfNeeded();
      await this.#refreshAuthoredFeedback();
      this.#onRunStarted?.({ runId });
    } catch (error) {
      this.#fail(error);
    }
  }

  async startPosition(input: {
    readonly fen: string;
    readonly side: "white" | "black";
    readonly mode: "human_common" | "strong_engine";
    readonly targetElo?: 1000 | 1400 | 1800 | 2200;
  }): Promise<void> {
    this.#projectionOnly = false;
    this.#matchMode = undefined;
    this.#patch({ busy: true, error: undefined });
    try {
      const capabilities = await this.#api.capabilities();
      if (!capabilities.policyModes.includes(input.mode)) throw new ApiError(422, "POLICY_MODE_UNSUPPORTED", `${input.mode} is unavailable`);
      const runId = this.#runId(), seed = this.#seed();
      const session = WriterSession.claimFor(runId, this.#storage);
      const run = await this.#api.createRun({
        id: runId,
        session: {
          kind: "position",
          start: { fen: input.fen, side: input.side },
          feedbackPolicy: "attempt_end",
          opponentPolicy: {
            mode: input.mode,
            ...(input.mode === "human_common" && input.targetElo !== undefined
              ? { targetElo: input.targetElo }
              : {}),
          },
        },
        policyConfig: positionPolicyConfig(capabilities),
        seed,
      }, session.writerId);
      this.#capabilities = capabilities;
      this.#attachStore(this.#newStore(session, run), undefined, undefined, await this.#loadShapes());
      await this.#playOpponentIfNeeded();
      this.#onRunStarted?.({ runId });
    } catch (error) { this.#fail(error); }
  }

  async move(uci: string): Promise<boolean> {
    const store = this.#requiredStore();
    this.#patch({ busy: true, error: undefined });
    try {
      const result = await store.move({ uci });
      if (this.#captureCheckpoint(result.emitted)) {
        await this.#refreshAuthoredFeedback();
        await this.#refreshReasoning();
        this.#patch({ busy: false });
        return true;
      }
      if (this.#hasOutcome(result.emitted)) {
        await this.#refreshAuthoredFeedback();
        this.#patch({ busy: false });
        return true;
      }
      if (this.#matchMode === "live") {
        store.follow();
      }
      await this.#playOpponentIfNeeded();
      this.#patch({ busy: false });
      return true;
    } catch (error) {
      this.#fail(error);
      return false;
    }
  }

  async reveal(): Promise<void> {
    this.#patch({ busy: true, error: undefined });
    try {
      await this.#requiredStore().reveal();
      this.#patch({ busy: false });
    } catch (error) {
      this.#fail(error);
    }
  }

  async claimLease(): Promise<void> {
    const runId = this.#requiredStore().snapshot.run.id;
    if (this.#api.claimLease === undefined) {
      throw new Error("Lease claiming is not available");
    }
    const session = WriterSession.claimFor(runId, this.#storage);
    await this.#api.claimLease(runId, session.writerId);
    await this.resume(runId, { ...(this.#matchMode === undefined ? {} : { matchMode: this.#matchMode }) });
  }

  setMatchMode(mode: MatchMode | undefined): void {
    this.#matchMode = mode;
  }

  async continueCheckpoint(): Promise<void> {
    const checkpoint = this.#state.checkpoint;
    if (checkpoint !== undefined) {
      this.#dismissedCheckpointSeq = checkpoint.eventSeq;
    }
    this.#patch({ checkpoint: undefined, reasoning: undefined, busy: true });
    try {
      await this.#playOpponentIfNeeded();
      this.#patch({ busy: false });
    } catch (error) {
      this.#fail(error);
    }
  }

  async recordPrediction(predictedUci: string): Promise<void> {
    const checkpoint = this.#state.checkpoint;
    if (checkpoint?.interaction?.type !== "prediction") throw new Error("No prediction checkpoint is active");
    this.#patch({ busy: true, error: undefined });
    try {
      const request = this.#selectionRequest();
      const result = await this.#requiredStore().prediction({
        ...request,
        checkpointId: checkpoint.id,
        nodeId: checkpoint.nodeId,
        predictedUci,
      });
      this.#dismissedCheckpointSeq = checkpoint.eventSeq;
      this.#patch({ checkpoint: undefined });
      await this.#requiredStore().appendOpponentPly(result.selection);
      this.#patch({ busy: false });
    } catch (error) {
      this.#fail(error);
    }
  }

  async recordReasoning(input: { readonly transcript?: import("@chess-tabiya/runtime").ReasoningTranscript; readonly skipped?: true }): Promise<void> {
    const checkpoint = this.#state.checkpoint;
    if (checkpoint?.interaction?.type !== "stated_reasoning") throw new Error("No stated-reasoning checkpoint is active");
    this.#patch({ busy: true, error: undefined });
    try {
      const result = await this.#requiredStore().recordReasoning({ nodeId: checkpoint.nodeId, checkpointEventSeq: checkpoint.eventSeq, ...input });
      this.#patch({ busy: false, reasoning: result.reasoning });
      await this.#refreshAuthoredFeedback();
    } catch (error) { this.#fail(error); }
  }

  async rewind(target: { readonly nodeId: string; readonly branchId?: string } | { readonly checkpointId: string; readonly branchId?: never }): Promise<void> {
    this.#patch({ busy: true, checkpoint: undefined, comparison: undefined });
    try {
      await this.#requiredStore().rewind(target);
      this.#patch({ busy: false, comparisonBranchIds: undefined });
    } catch (error) {
      this.#fail(error);
    }
  }

  async fork(label?: string, intent?: string): Promise<void> {
    const run = this.#requiredRun();
    this.#patch({ busy: true, error: undefined });
    try {
      await this.#requiredStore().fork({
        nodeId: run.run.activeCursor.nodeId,
        ...(label === undefined || label.trim() === "" ? {} : { label }),
        ...(intent === undefined || intent.trim() === "" ? {} : { intent }),
      });
      this.#patch({ busy: false });
    } catch (error) {
      this.#fail(error);
    }
  }

  async createGroup(input: CreateGroupRequest): Promise<CreateGroupResult | undefined> {
    this.#patch({ busy: true, error: undefined });
    try {
      const result = await this.#requiredStore().createGroup(input);
      await this.#playOpponentIfNeeded();
      this.#patch({ busy: false });
      return result;
    } catch (error) {
      this.#fail(error);
      return undefined;
    }
  }

  async analyzeMissingEvidence(nodeIds: readonly string[]): Promise<void> {
    if (nodeIds.length === 0) return;
    this.#patch({ busy: true, error: undefined });
    try {
      await this.#requiredStore().analysis(nodeIds);
      this.#patch({ busy: false });
    } catch (error) {
      this.#fail(error);
    }
  }

  async switchBranch(leafNodeId: string, branchId: string): Promise<void> {
    await this.rewind({ nodeId: leafNodeId, branchId });
    if (this.#state.error === undefined) {
      this.#patch({ busy: true });
      try {
        await this.#playOpponentIfNeeded();
        this.#patch({ busy: false });
      } catch (error) {
        this.#fail(error);
      }
    }
  }

  async compare(branchIds: readonly string[]): Promise<void> {
    this.#patch({ busy: true, error: undefined, checkpoint: undefined });
    try {
      const store = this.#requiredStore();
      // Comparison is a committed/review surface. Drain any ready evidence before the
      // server snapshots the branches; otherwise the comparison can permanently capture
      // empty strips while the normal evidence poll attaches the same results one tick later.
      await store.pollEvidence();
      const run = store.snapshot.run;
      const comparison = await this.#api.compare(run.id, branchIds);
      this.#patch({
        busy: false,
        comparison,
        comparisonBranchIds: Object.freeze([...branchIds]),
      });
    } catch (error) {
      this.#fail(error);
    }
  }

  closeCompare(): void {
    this.#patch({ comparison: undefined, comparisonBranchIds: undefined });
  }

  exportPgn(branchIds?: readonly string[]): Promise<PgnDownload> {
    return this.#api.pgn(this.#requiredRun().run.id, branchIds);
  }

  stopSession(): void {
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
    this.#unsubscribeStore?.();
    this.#store?.stop();
    this.#subscribers.clear();
  }

  async #playOpponentIfNeeded(): Promise<void> {
    if (this.#projectionOnly || this.#matchMode !== undefined) return;
    const pack = this.#state.pack;
    const capabilities = this.#capabilities;
    if (capabilities === undefined) throw new Error("Capabilities are unavailable");
    const runState = this.#requiredRun();
    if (runState.access === "read_only" || this.#state.checkpoint !== undefined) {
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
    const group = groupsFromEvents(run).find((candidate: BranchGroup) =>
      candidate.members.some((member) => member.branchId === run.activeCursor.branchId),
    );
    const selection = group === undefined
      ? await this.#api.selectMove(this.#selectionRequest())
      : (await this.#requiredStore().groupReply(group.groupId)).selection;
    const result = await this.#requiredStore().appendOpponentPly(selection);
    if (this.#captureCheckpoint(result.emitted)) {
      await this.#refreshAuthoredFeedback();
      await this.#refreshReasoning();
    } else if (this.#hasOutcome(result.emitted)) {
      await this.#refreshAuthoredFeedback();
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
    return {
      startFen: pack?.start.fen ?? run.start.fen,
      historyUci: historyFrom(run, run.activeCursor.nodeId).flatMap((historyNode) =>
        historyNode.moveUci === null ? [] : [historyNode.moveUci],
      ),
      policy: {
        mode,
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
    this.#patch({ authoredFeedback: await this.#api.authoredFeedback(runState.run.id) });
  }

  async #refreshReasoning(): Promise<void> {
    const checkpoint = this.#state.checkpoint;
    const runState = this.#state.runState ?? this.#subscribingStore?.snapshot;
    if (checkpoint?.interaction?.type !== "stated_reasoning" || runState === undefined) return;
    this.#patch({ reasoning: await this.#api.reasoning(runState.run.id, checkpoint.id) });
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
      void this.#refreshAuthoredFeedback().catch((error: unknown) => this.#fail(error));
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
    });
  }

  async #loadShapes(ids?: readonly ShapeReference[]): Promise<readonly ShapeEntryView[]> {
    const selected = ids?.flatMap((reference) => typeof reference === "string" ? [reference] : reference.relation === "present" ? [reference.shape] : []) ?? (await this.#api.shapes()).map((shape) => shape.id);
    return Object.freeze(await Promise.all(selected.map(async (id) => (await this.#api.shape(id)).document)));
  }

  #requiredStore(): RunStateStore {
    if (this.#store === undefined) throw new Error("No drill run is active");
    return this.#store;
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
