import {
  assertActiveWriter,
  commitMove,
  compare,
  createRun,
  eventsSince,
  fork,
  rewind,
  rewindToCheckpoint,
  type BranchComparison,
  type CommitMoveOptions,
  type CreateRunInput,
  type DrillRun,
  type DrillRunEvent,
  type ForkOptions,
  type MutationResult,
} from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";
import type { RunStorage, StoredRun } from "./storage.js";

export interface RunGraph {
  readonly id: string;
  readonly nodes: DrillRun["nodes"];
  readonly branches: DrillRun["branches"];
  readonly activeCursor: DrillRun["activeCursor"];
}

export interface EventsPage {
  readonly events: readonly DrillRunEvent[];
  readonly nextSeq: number;
}

export type RewindTarget =
  | { readonly nodeId: string; readonly checkpointId?: never }
  | { readonly checkpointId: string; readonly nodeId?: never };

export class RunService {
  readonly #storage: RunStorage;

  constructor(storage: RunStorage) {
    this.#storage = storage;
  }

  create(input: CreateRunInput, writerId: string): DrillRun {
    let run: DrillRun;
    try {
      run = createRun(input);
    } catch (error) {
      throw new ServerError("INVALID_REQUEST", "Run definition is invalid", {
        cause: error,
      });
    }
    this.#storage.create(run, writerId);
    return run;
  }

  move(
    runId: string,
    writerId: string,
    uci: string,
    options: CommitMoveOptions = {},
  ): MutationResult {
    const stored = this.#forWrite(runId, writerId);
    const result = commitMove(stored.run, uci, options);
    this.#storage.save(result.run, writerId);
    return result;
  }

  rewind(
    runId: string,
    writerId: string,
    target: RewindTarget,
    at?: string,
  ): MutationResult {
    const stored = this.#forWrite(runId, writerId);
    const result =
      target.nodeId === undefined
        ? rewindToCheckpoint(stored.run, target.checkpointId, at)
        : rewind(stored.run, target.nodeId, at);
    this.#storage.save(result.run, writerId);
    return result;
  }

  fork(
    runId: string,
    writerId: string,
    nodeId: string,
    options: ForkOptions = {},
  ): MutationResult {
    const stored = this.#forWrite(runId, writerId);
    const result = fork(stored.run, nodeId, options);
    this.#storage.save(result.run, writerId);
    return result;
  }

  graph(runId: string): RunGraph {
    const run = this.#required(runId).run;
    return Object.freeze({
      id: run.id,
      nodes: run.nodes,
      branches: run.branches,
      activeCursor: run.activeCursor,
    });
  }

  compare(runId: string, branchAId: string, branchBId: string): BranchComparison {
    return compare(this.#required(runId).run, branchAId, branchBId);
  }

  events(runId: string, sinceSeq = 0): EventsPage {
    const run = this.#required(runId).run;
    return Object.freeze({
      events: eventsSince(run, sinceSeq),
      nextSeq: run.events.at(-1)?.seq ?? 0,
    });
  }

  #required(runId: string): StoredRun {
    const stored = this.#storage.read(runId);
    if (!stored) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
    return stored;
  }

  #forWrite(runId: string, writerId: string): StoredRun {
    const stored = this.#required(runId);
    assertActiveWriter(stored.activeWriterId, writerId);
    return stored;
  }
}
