import {
  applyObjectiveEvidenceProposal,
  appendOpponentPly,
  assertActiveWriter,
  attachEvidence,
  commitMove,
  compare,
  createRun,
  exportPackRunPgn,
  exportPgn,
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
import {
  feedbackIsRevealed,
  publicEvents,
  publicNodes,
} from "./feedback-policy.js";
import { orchestratePackMove } from "./pack-orchestrator.js";
import {
  PackRegistry,
  type PackRecord,
  type PackSummary,
} from "./pack-registry.js";
import type { RunStorage, RunSummary, StoredRun } from "./storage.js";
import { DEFAULT_STRONG_ENGINE_PROFILE } from "./strong-engine.js";

export interface RunGraph {
  readonly id: string;
  readonly activeWriterId: string;
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

export interface CreateRunRequest {
  readonly id: string;
  readonly packId: string;
  readonly policyConfig: CreateRunInput["policyConfig"];
  readonly seed: number;
  readonly createdAt?: string;
  readonly packDigest?: string;
  readonly startFen?: string;
}

export class RunService {
  readonly #storage: RunStorage;
  readonly #evidenceQueue: EvidenceJobQueue | undefined;
  readonly #packRegistry: PackRegistry | undefined;
  readonly #evidenceMovetimeMs: number;

  constructor(
    storage: RunStorage,
    options: {
      readonly evidenceQueue?: EvidenceJobQueue;
      readonly packRegistry?: PackRegistry;
      readonly evidenceMovetimeMs?: number;
    } = {},
  ) {
    this.#storage = storage;
    this.#evidenceQueue = options.evidenceQueue;
    this.#packRegistry = options.packRegistry;
    this.#evidenceMovetimeMs =
      options.evidenceMovetimeMs ?? DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs;
    if (!Number.isSafeInteger(this.#evidenceMovetimeMs) || this.#evidenceMovetimeMs < 1) {
      throw new TypeError("Evidence movetime must be a positive safe integer");
    }
  }

  create(input: CreateRunRequest, writerId: string): DrillRun {
    const pack = this.#packRegistry?.required(input.packId);
    if (
      pack !== undefined &&
      input.packDigest !== undefined &&
      input.packDigest !== pack.digest
    ) {
      throw new ServerError("INVALID_REQUEST", "Client pack digest is stale");
    }
    if (
      pack !== undefined &&
      input.startFen !== undefined &&
      input.startFen !== pack.document.start.fen
    ) {
      throw new ServerError("INVALID_REQUEST", "Client pack start FEN is stale");
    }
    const packDigest = pack?.digest ?? input.packDigest;
    const startFen = pack?.document.start.fen ?? input.startFen;
    if (packDigest === undefined || startFen === undefined) {
      throw new ServerError(
        "INVALID_REQUEST",
        "Pack-blind run creation requires packDigest and startFen",
      );
    }
    let run: DrillRun;
    try {
      run = createRun({
        id: input.id,
        packId: input.packId,
        packDigest,
        policyConfig: input.policyConfig,
        startFen,
        seed: input.seed,
        ...(input.createdAt === undefined ? {} : { createdAt: input.createdAt }),
      });
    } catch (error) {
      throw new ServerError("INVALID_REQUEST", "Run definition is invalid", {
        cause: error,
      });
    }
    const title = pack?.document.title;
    this.#storage.create(
      run,
      writerId,
      typeof title === "string" ? title : input.packId,
    );
    return run;
  }

  move(
    runId: string,
    writerId: string,
    uci: string,
    options: CommitMoveOptions = {},
  ): MutationResult {
    const stored = this.#forWrite(runId, writerId);
    const pack = this.#registeredPack(stored.run);
    if (pack !== undefined) this.#requiredEvidenceQueue();
    const committed = commitMove(stored.run, uci, options);
    const result =
      pack === undefined
        ? committed
        : orchestratePackMove(pack.document, stored.run, committed);
    this.#storage.save(result.run, writerId);
    if (pack !== undefined) this.#enqueueMoveEvidence(result.run);
    return result;
  }

  opponentPly(
    runId: string,
    writerId: string,
    selection: OpponentSelection,
    options: AppendOpponentPlyOptions = {},
  ): MutationResult {
    const stored = this.#forWrite(runId, writerId);
    const pack = this.#registeredPack(stored.run);
    if (pack !== undefined) this.#requiredEvidenceQueue();
    const committed = appendOpponentPly(stored.run, selection, options);
    const result =
      pack === undefined
        ? committed
        : orchestratePackMove(pack.document, stored.run, committed);
    this.#storage.save(result.run, writerId);
    if (pack !== undefined) this.#enqueueMoveEvidence(result.run);
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
    const stored = this.#required(runId);
    const run = stored.run;
    const pack = this.#registeredPack(run);
    return Object.freeze({
      id: run.id,
      activeWriterId: stored.activeWriterId,
      nodes: publicNodes(pack, run),
      branches: run.branches,
      activeCursor: run.activeCursor,
    });
  }

  runs(limit: number, offset: number): readonly RunSummary[] {
    return this.#storage.list(limit, offset);
  }

  compare(runId: string, branchAId: string, branchBId: string): BranchComparison {
    return compare(this.#required(runId).run, branchAId, branchBId);
  }

  events(runId: string, sinceSeq = 0): EventsPage {
    const run = this.#required(runId).run;
    return publicEvents(this.#registeredPack(run), run, sinceSeq);
  }

  packs(): readonly PackSummary[] {
    return this.#requiredPackRegistry().list();
  }

  pack(packId: string): PackRecord {
    return this.#requiredPackRegistry().required(packId);
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
    const run = this.#required(runId).run;
    const pack = this.#registeredPack(run);
    if (pack !== undefined && !feedbackIsRevealed(pack, run)) {
      return Object.freeze({ results: Object.freeze([]), nextSeq: sinceSeq });
    }
    return this.#requiredEvidenceQueue().page(runId, sinceSeq);
  }

  applyEvidence(
    runId: string,
    writerId: string,
    resultSeq: number,
    at = new Date().toISOString(),
  ): MutationResult {
    const stored = this.#forWrite(runId, writerId);
    const pack = this.#registeredPack(stored.run);
    if (pack !== undefined && !feedbackIsRevealed(pack, stored.run)) {
      throw new ServerError(
        "FEEDBACK_WITHHELD",
        "Evidence is withheld by the pack feedback policy",
      );
    }
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

  async pgn(runId: string, branchIds?: readonly string[]): Promise<string> {
    const run = this.#required(runId).run;
    const pack = this.#registeredPack(run);
    return pack === undefined
      ? exportPgn(run, branchIds)
      : exportPackRunPgn(pack.document, run, branchIds);
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

  #registeredPack(run: DrillRun): PackRecord | undefined {
    const pack = this.#packRegistry?.get(run.packId);
    return pack?.digest === run.packDigest ? pack : undefined;
  }

  #enqueueMoveEvidence(run: DrillRun): void {
    this.enqueueEvidence(run.id, {
      nodeId: run.activeCursor.nodeId,
      kind: "eval",
      movetime: this.#evidenceMovetimeMs,
    });
  }

  #requiredPackRegistry(): PackRegistry {
    if (this.#packRegistry === undefined) {
      throw new ServerError("PACK_NOT_FOUND", "Pack registry is not configured");
    }
    return this.#packRegistry;
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
