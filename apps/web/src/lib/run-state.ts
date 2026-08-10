import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  projectRun,
  type DrillRun,
  type DrillRunEvent,
  type MutationResult,
  type OpponentSelection,
} from "@chess-tabiya/runtime";

import {
  ApiError,
  type ForkRequest,
  type MoveOptions,
  type PlayerMoveRequest,
  type RewindRequest,
  type RunApi,
} from "./api.js";
import { WriterSession } from "./writer-session.js";

export interface PollScheduler {
  setInterval(task: () => void | Promise<void>, intervalMs: number): unknown;
  clearInterval(handle: unknown): void;
}

const browserScheduler: PollScheduler = {
  setInterval(task, intervalMs) {
    return globalThis.setInterval(() => void task(), intervalMs);
  },
  clearInterval(handle) {
    globalThis.clearInterval(handle as ReturnType<typeof setInterval>);
  },
};

export interface RunStateSnapshot {
  readonly run: DrillRun;
  readonly access: "writer" | "read_only";
  readonly pendingEvidence: number;
  readonly lastError?: ApiError;
}

type Subscriber = (snapshot: RunStateSnapshot) => void;

function pendingEvidence(events: readonly DrillRunEvent[]): number {
  const parentByNode = new Map<string, string | null>();
  const pendingNodeIds = new Set<string>();
  for (const event of events) {
    if (event.type === "run.started") {
      parentByNode.set(event.data.rootNode.id, null);
    } else if (event.type === "move.committed") {
      parentByNode.set(event.data.node.id, event.data.node.parentId);
      pendingNodeIds.add(event.data.node.id);
    } else if (event.type === "evidence.attached") {
      pendingNodeIds.delete(event.data.nodeId);
    } else if (event.type === "run.rewound") {
      const targetPath = new Set<string>();
      let target: string | null | undefined = event.data.toNodeId;
      while (target !== null && target !== undefined) {
        targetPath.add(target);
        target = parentByNode.get(target);
      }
      let pruned: string | null | undefined = event.data.fromNodeId;
      while (
        pruned !== null &&
        pruned !== undefined &&
        !targetPath.has(pruned)
      ) {
        pendingNodeIds.delete(pruned);
        pruned = parentByNode.get(pruned);
      }
    }
  }
  return pendingNodeIds.size;
}

function feedbackRevealed(
  pack: DrillPackDefinition,
  events: readonly DrillRunEvent[],
): boolean {
  const policy = pack.feedbackPolicy;
  if (policy === "delayed_checkpoint") {
    return events.some((event) => event.type === "checkpoint.reached");
  }
  if (policy === "segment_end") {
    return events.some((event) => event.type === "segment.completed");
  }
  return false;
}

function appendProjected(
  current: DrillRun,
  appended: readonly DrillRunEvent[],
): DrillRun {
  if (appended.length === 0) return current;
  const expected = (current.events.at(-1)?.seq ?? 0) + 1;
  if (appended[0]!.seq !== expected) {
    throw new TypeError(
      `Mutation event stream starts at ${appended[0]!.seq}; expected ${expected}`,
    );
  }
  return projectRun([...current.events, ...appended]);
}

export class RunStateStore {
  readonly #api: RunApi;
  readonly #pack: DrillPackDefinition;
  readonly #session: WriterSession;
  readonly #scheduler: PollScheduler;
  readonly #subscribers = new Set<Subscriber>();
  #snapshot: RunStateSnapshot;
  #eventSeq: number;
  #evidenceSeq = 0;
  #followerPoll: unknown;
  #evidencePoll: unknown;
  #started = false;

  constructor(
    api: RunApi,
    pack: DrillPackDefinition,
    session: WriterSession,
    initialRun: DrillRun,
    scheduler: PollScheduler = browserScheduler,
  ) {
    if (initialRun.id !== session.runId) {
      throw new TypeError("Writer session and run id do not match");
    }
    this.#api = api;
    this.#pack = pack;
    this.#session = session;
    this.#scheduler = scheduler;
    const run = projectRun(initialRun.events);
    this.#eventSeq = run.events.at(-1)?.seq ?? 0;
    this.#snapshot = Object.freeze({
      run,
      access: session.readOnly ? "read_only" : "writer",
      pendingEvidence: pendingEvidence(run.events),
    });
  }

  static async resume(
    api: RunApi,
    pack: DrillPackDefinition,
    session: WriterSession,
    scheduler: PollScheduler = browserScheduler,
  ): Promise<RunStateStore> {
    const page = await api.events(session.runId, 0);
    if (page.events.length === 0) {
      throw new TypeError("Cannot resume a run without its run.started event");
    }
    return new RunStateStore(
      api,
      pack,
      session,
      projectRun(page.events),
      scheduler,
    );
  }

  get snapshot(): RunStateSnapshot {
    return this.#snapshot;
  }

  subscribe(subscriber: Subscriber): () => void {
    this.#subscribers.add(subscriber);
    subscriber(this.#snapshot);
    return () => this.#subscribers.delete(subscriber);
  }

  start(): void {
    if (this.#started) return;
    this.#started = true;
    this.#syncPolling();
  }

  stop(): void {
    this.#started = false;
    this.#clearFollowerPoll();
    this.#clearEvidencePoll();
  }

  move(input: PlayerMoveRequest): Promise<MutationResult> {
    return this.#mutate(() =>
      this.#api.move(this.#session.runId, input, this.#session.writerId),
    );
  }

  appendOpponentPly(
    selection: OpponentSelection,
    options?: MoveOptions,
  ): Promise<MutationResult> {
    return this.#mutate(() =>
      this.#api.appendOpponentPly(
        this.#session.runId,
        selection,
        this.#session.writerId,
        options,
      ),
    );
  }

  rewind(input: RewindRequest): Promise<MutationResult> {
    return this.#mutate(() =>
      this.#api.rewind(
        this.#session.runId,
        input,
        this.#session.writerId,
      ),
    );
  }

  fork(input: ForkRequest): Promise<MutationResult> {
    return this.#mutate(() =>
      this.#api.fork(this.#session.runId, input, this.#session.writerId),
    );
  }

  async pollEvents(): Promise<void> {
    if (this.#snapshot.access !== "read_only") return;
    const page = await this.#api.events(this.#session.runId, this.#eventSeq);
    if (page.events.length > 0) {
      this.#setRun(appendProjected(this.#snapshot.run, page.events));
    }
    this.#eventSeq = page.nextSeq;
  }

  async pollEvidence(): Promise<void> {
    if (
      this.#snapshot.access !== "writer" ||
      this.#snapshot.pendingEvidence === 0 ||
      !feedbackRevealed(this.#pack, this.#snapshot.run.events)
    ) {
      this.#syncPolling();
      return;
    }
    const page = await this.#api.evidence(this.#session.runId, this.#evidenceSeq);
    for (const result of page.results) {
      const mutation = await this.#api.applyEvidence(
        this.#session.runId,
        result.seq,
        this.#session.writerId,
      );
      this.#applyMutation(mutation);
    }
    this.#evidenceSeq = page.nextSeq;
    this.#syncPolling();
  }

  async #mutate(action: () => Promise<MutationResult>): Promise<MutationResult> {
    if (this.#snapshot.access === "read_only") {
      throw new ApiError(409, "NOT_ACTIVE_WRITER", "Run is read-only");
    }
    try {
      const result = await action();
      this.#applyMutation(result);
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.code === "NOT_ACTIVE_WRITER") {
        this.#session.markReadOnly();
        this.#snapshot = Object.freeze({
          ...this.#snapshot,
          access: "read_only",
          lastError: error,
        });
        this.#emit();
        this.#syncPolling();
      }
      throw error;
    }
  }

  #applyMutation(mutation: MutationResult): void {
    const run = appendProjected(this.#snapshot.run, mutation.emitted);
    if (run.events.length !== mutation.run.events.length) {
      throw new TypeError("Mutation response run and emitted events disagree");
    }
    this.#eventSeq = run.events.at(-1)?.seq ?? this.#eventSeq;
    this.#setRun(run);
  }

  #setRun(run: DrillRun): void {
    this.#snapshot = Object.freeze({
      run,
      access: this.#session.readOnly ? "read_only" : "writer",
      pendingEvidence: pendingEvidence(run.events),
      ...(this.#snapshot.lastError === undefined
        ? {}
        : { lastError: this.#snapshot.lastError }),
    });
    this.#emit();
    this.#syncPolling();
  }

  #emit(): void {
    for (const subscriber of this.#subscribers) subscriber(this.#snapshot);
  }

  #syncPolling(): void {
    if (!this.#started) return;
    if (this.#snapshot.access === "read_only") {
      this.#clearEvidencePoll();
      if (this.#followerPoll === undefined) {
        this.#followerPoll = this.#scheduler.setInterval(
          () => this.pollEvents(),
          2_000,
        );
      }
      return;
    }

    this.#clearFollowerPoll();
    const shouldPollEvidence =
      this.#snapshot.pendingEvidence > 0 &&
      feedbackRevealed(this.#pack, this.#snapshot.run.events);
    if (shouldPollEvidence && this.#evidencePoll === undefined) {
      this.#evidencePoll = this.#scheduler.setInterval(
        () => this.pollEvidence(),
        1_000,
      );
    } else if (!shouldPollEvidence) {
      this.#clearEvidencePoll();
    }
  }

  #clearFollowerPoll(): void {
    if (this.#followerPoll === undefined) return;
    this.#scheduler.clearInterval(this.#followerPoll);
    this.#followerPoll = undefined;
  }

  #clearEvidencePoll(): void {
    if (this.#evidencePoll === undefined) return;
    this.#scheduler.clearInterval(this.#evidencePoll);
    this.#evidencePoll = undefined;
  }
}
