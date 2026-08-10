import {
  applyObjectiveEvidenceProposal,
  appendOpponentPly,
  assertActiveWriter,
  attachEvidence,
  commitMove,
  compare,
  createRun,
  eventsSince,
  fork,
  rewind,
  rewindToCheckpoint,
  type BranchComparison,
  type AppendOpponentPlyOptions,
  type CommitMoveOptions,
  type CreateRunInput,
  type DrillRun,
  type DrillRunEvent,
  type EvidenceKind,
  type ForkOptions,
  type MutationResult,
  type OpponentSelection,
} from "@chess-tabiya/runtime";

import {
  EvidenceJobQueue,
  type EvidenceJob,
  type EvidencePage,
} from "./evidence-queue.js";
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
  readonly #evidenceQueue: EvidenceJobQueue | undefined;

  constructor(
    storage: RunStorage,
    options: { readonly evidenceQueue?: EvidenceJobQueue } = {},
  ) {
    this.#storage = storage;
    this.#evidenceQueue = options.evidenceQueue;
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

  opponentPly(
    runId: string,
    writerId: string,
    selection: OpponentSelection,
    options: AppendOpponentPlyOptions = {},
  ): MutationResult {
    const stored = this.#forWrite(runId, writerId);
    const result = appendOpponentPly(stored.run, selection, options);
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
        ? rewindToCheckpoint(
            stored.run,
            target.checkpointId,
            at,
            this.#evidenceQueue,
          )
        : rewind(stored.run, target.nodeId, at, this.#evidenceQueue);
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

  enqueueEvidence(
    runId: string,
    input: {
      readonly nodeId: string;
      readonly kind: EvidenceKind;
      readonly depth?: number;
      readonly movetime?: number;
    },
  ): EvidenceJob {
    const queue = this.#requiredEvidenceQueue();
    const run = this.#required(runId).run;
    const node = run.nodes.find((candidate) => candidate.id === input.nodeId);
    if (node === undefined) {
      throw new ServerError("INVALID_REQUEST", `Unknown evidence node: ${input.nodeId}`);
    }
    return queue.enqueue({
      runId,
      nodeId: node.id,
      fen: node.fen,
      kind: input.kind,
      ...(input.depth === undefined ? {} : { depth: input.depth }),
      ...(input.movetime === undefined ? {} : { movetime: input.movetime }),
      objectiveRequest: Object.freeze({
        runId: run.id,
        packId: run.packId,
        packDigest: run.packDigest,
        nodeId: node.id,
        fen: node.fen,
        objectiveState: node.objectiveState,
        evidenceRefs: node.evidenceRefs,
        policyConfig: run.policyConfig,
      }),
    });
  }

  evidence(runId: string, sinceSeq = 0): EvidencePage {
    this.#required(runId);
    return this.#requiredEvidenceQueue().page(runId, sinceSeq);
  }

  applyEvidence(
    runId: string,
    writerId: string,
    resultSeq: number,
    at = new Date().toISOString(),
  ): MutationResult {
    const stored = this.#forWrite(runId, writerId);
    const queue = this.#requiredEvidenceQueue();
    const staged = queue.result(runId, resultSeq);
    if (staged === undefined) {
      throw new ServerError(
        "EVIDENCE_RESULT_NOT_FOUND",
        `Unknown staged evidence result: ${resultSeq}`,
      );
    }

    const attached = attachEvidence(
      stored.run,
      staged.nodeId,
      staged.evidenceRefs,
      staged.payload,
      at,
    );
    const upgraded =
      staged.objectiveProposal === undefined
        ? attached
        : applyObjectiveEvidenceProposal(
            attached.run,
            staged.objectiveProposal,
            at,
          );
    const result: MutationResult = Object.freeze({
      run: upgraded.run,
      emitted: Object.freeze([
        ...attached.emitted,
        ...(upgraded === attached ? [] : upgraded.emitted),
      ]),
    });
    this.#storage.save(result.run, writerId);
    queue.consume(runId, resultSeq);
    return result;
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

  #requiredEvidenceQueue(): EvidenceJobQueue {
    if (this.#evidenceQueue === undefined) {
      throw new ServerError(
        "EVIDENCE_UNAVAILABLE",
        "Evidence queue is not configured",
      );
    }
    return this.#evidenceQueue;
  }
}
