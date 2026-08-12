import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  historyFrom,
  projectRun,
  type BranchComparison,
  type DrillRunEvent,
  type PolicyConfig,
} from "@chess-tabiya/runtime";

import {
  ApiError,
  type Capabilities,
  type DrillClientApi,
  type PgnDownload,
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
  readonly runState?: RunStateSnapshot;
  readonly checkpoint?: CheckpointNotice;
  readonly comparison?: BranchComparison;
  readonly comparisonBranchIds?: readonly [string, string];
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

type Subscriber = (state: DrillSessionState) => void;
type StatePatch = {
  [Key in keyof DrillSessionState]?: DrillSessionState[Key] | undefined;
};

const TERMINAL_STATES = new Set(["achieved", "failed", "transitioned"]);

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

function selectorMode(
  pack: DrillPackDefinition,
  capabilities: Capabilities,
): "human_common" | "strong_engine" | "theory_strict" {
  const requested = record(pack.opponentPolicy).mode;
  if (
    (requested === "human_common" ||
      requested === "strong_engine" ||
      requested === "theory_strict") &&
    capabilities.policyModes.includes(requested)
  ) {
    return requested;
  }
  if (capabilities.policyModes.includes("human_common")) return "human_common";
  const fallback = capabilities.policyModes[0];
  if (fallback === undefined) {
    throw new ApiError(503, "POLICY_MODE_UNSUPPORTED", "No opponent mode available");
  }
  return fallback;
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

  async resume(runId: string): Promise<void> {
    this.#patch({ busy: true, error: undefined });
    try {
      const eventPage = await this.#api.events(runId, 0);
      const started = eventPage.events[0];
      if (started?.type !== "run.started") {
        throw new TypeError("Cannot resume a run without its run.started event");
      }
      const [{ document, digest }, capabilities, graph] = await Promise.all([
        this.#api.pack(started.data.packId),
        this.#api.capabilities(),
        this.#api.graph(runId),
      ]);
      const claimed = WriterSession.peek(runId, this.#storage);
      const session =
        claimed?.writerId === graph.activeWriterId
          ? claimed
          : WriterSession.observe(runId, graph.activeWriterId);
      const store = this.#newStore(document, session, projectRun(eventPage.events));
      this.#capabilities = capabilities;
      this.#attachStore(store, document, digest);
      await this.#playOpponentIfNeeded();
    } catch (error) {
      this.#patch({
        busy: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async startPack(packId: string): Promise<void> {
    this.#patch({ busy: true, error: undefined });
    try {
      const [{ document, digest }, capabilities] = await Promise.all([
        this.#api.pack(packId),
        this.#api.capabilities(),
      ]);
      const runId = this.#runId();
      const seed = this.#seed();
      const session = WriterSession.claimFor(runId, this.#storage);
      const run = await this.#api.createRun(
        {
          id: runId,
          packId,
          policyConfig: policyConfig(document, capabilities),
          seed,
        },
        session.writerId,
      );
      this.#capabilities = capabilities;
      const store = this.#newStore(document, session, run);
      this.#attachStore(store, document, digest);
      await this.#playOpponentIfNeeded();
      this.#onRunStarted?.({ runId });
    } catch (error) {
      this.#fail(error);
    }
  }

  async move(uci: string): Promise<void> {
    const store = this.#requiredStore();
    this.#patch({ busy: true, error: undefined });
    try {
      const result = await store.move({ uci });
      if (this.#captureCheckpoint(result.emitted)) {
        this.#patch({ busy: false });
        return;
      }
      await this.#playOpponentIfNeeded();
      this.#patch({ busy: false });
    } catch (error) {
      this.#fail(error);
    }
  }

  async continueCheckpoint(): Promise<void> {
    const checkpoint = this.#state.checkpoint;
    if (checkpoint !== undefined) {
      this.#dismissedCheckpointSeq = checkpoint.eventSeq;
    }
    this.#patch({ checkpoint: undefined, busy: true });
    try {
      await this.#playOpponentIfNeeded();
      this.#patch({ busy: false });
    } catch (error) {
      this.#fail(error);
    }
  }

  async rewind(target: { readonly nodeId: string } | { readonly checkpointId: string }): Promise<void> {
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

  switchBranch(leafNodeId: string): Promise<void> {
    return this.rewind({ nodeId: leafNodeId });
  }

  async compare(branchIds: readonly [string, string]): Promise<void> {
    const run = this.#requiredRun().run;
    this.#patch({ busy: true, error: undefined, checkpoint: undefined });
    try {
      const comparison = await this.#api.compare(
        run.id,
        branchIds[0],
        branchIds[1],
      );
      this.#patch({
        busy: false,
        comparison,
        comparisonBranchIds: Object.freeze([...branchIds]) as readonly [string, string],
      });
    } catch (error) {
      this.#fail(error);
    }
  }

  closeCompare(): void {
    this.#patch({ comparison: undefined, comparisonBranchIds: undefined });
  }

  exportPgn(): Promise<PgnDownload> {
    return this.#api.pgn(this.#requiredRun().run.id);
  }

  stopSession(): void {
    this.#unsubscribeStore?.();
    this.#unsubscribeStore = undefined;
    this.#store?.stop();
    this.#store = undefined;
    this.#capabilities = undefined;
    this.#dismissedCheckpointSeq = 0;
    this.#state = Object.freeze({ busy: false });
    this.#emit();
  }

  destroy(): void {
    this.#unsubscribeStore?.();
    this.#store?.stop();
    this.#subscribers.clear();
  }

  async #playOpponentIfNeeded(): Promise<void> {
    const pack = this.#requiredPack();
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
      boardModel(node.fen, packStartSide(pack)).turnColor === packStartSide(pack)
    ) {
      return;
    }
    const authored = record(pack.opponentPolicy);
    const branch = run.branches.find(
      (candidate) => candidate.id === run.activeCursor.branchId,
    )!;
    const selection = await this.#api.selectMove({
      startFen: pack.start.fen,
      historyUci: historyFrom(run, run.activeCursor.nodeId).flatMap((historyNode) =>
        historyNode.moveUci === null ? [] : [historyNode.moveUci],
      ),
      policy: {
        mode: selectorMode(pack, capabilities),
        policyConfigDigest: this.#state.packDigest!,
        ...(typeof authored.targetElo === "number"
          ? { targetElo: authored.targetElo }
          : {}),
        ...(typeof authored.temperature === "number"
          ? { temperature: authored.temperature }
          : {}),
        ...(typeof authored.topP === "number" ? { topP: authored.topP } : {}),
        ...(pack.spine === undefined ? {} : { spine: pack.spine }),
      },
      seed: branch.seed,
    });
    const result = await this.#requiredStore().appendOpponentPly(selection);
    this.#captureCheckpoint(result.emitted);
  }

  #captureCheckpoint(events: readonly DrillRunEvent[]): boolean {
    if (!events.some((event) => event.type === "checkpoint.reached")) return false;
    const checkpoint = latestCheckpoint(
      this.#requiredPack(),
      this.#requiredRun().run,
      this.#dismissedCheckpointSeq,
    );
    if (checkpoint === undefined) return false;
    this.#patch({ checkpoint });
    return true;
  }

  #newStore(
    pack: DrillPackDefinition,
    session: WriterSession,
    run: RunStateSnapshot["run"],
  ): RunStateStore {
    return this.#scheduler === undefined
      ? new RunStateStore(this.#api, pack, session, run)
      : new RunStateStore(this.#api, pack, session, run, this.#scheduler);
  }

  #attachStore(
    store: RunStateStore,
    pack: DrillPackDefinition,
    digest: string,
  ): void {
    this.#unsubscribeStore?.();
    this.#store?.stop();
    this.#store = store;
    this.#unsubscribeStore = store.subscribe((runState) => {
      this.#patch({ runState });
    });
    store.start();
    this.#patch({
      pack,
      packDigest: digest,
      runState: store.snapshot,
      busy: false,
      error: undefined,
      checkpoint: latestCheckpoint(pack, store.snapshot.run),
      comparison: undefined,
      comparisonBranchIds: undefined,
    });
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
      error: error instanceof Error ? error.message : String(error),
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
