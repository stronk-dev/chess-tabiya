import {
  engineEvidenceRef,
  type EvidenceKind,
  type EvidencePayload,
  type JobObserver,
  type ObjectiveEvidenceProposal,
  type ObjectiveEvidenceRequest,
  type ObjectiveEvidenceUpgrader,
} from "@chess-tabiya/runtime";

import type { EngineRequest } from "./engine-supervisor.js";
import { engineUnavailable } from "./errors.js";

export interface EvidenceJobInput {
  readonly runId: string;
  readonly nodeId: string;
  readonly fen: string;
  readonly kind: EvidenceKind;
  readonly depth?: number;
  readonly movetime?: number;
  readonly multiPv?: number;
  readonly timeoutMs?: number;
  readonly objectiveRequest?: ObjectiveEvidenceRequest;
}

export interface EvidenceJob extends EvidenceJobInput {
  readonly id: string;
}

export interface StagedEvidence {
  readonly seq: number;
  readonly jobId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly evidenceRefs: readonly [string, ...string[]];
  readonly payload: EvidencePayload;
  readonly objectiveProposal?: ObjectiveEvidenceProposal;
}

export interface EvidencePage {
  readonly results: readonly StagedEvidence[];
  readonly nextSeq: number;
}

export interface EvidenceExecutor {
  execute(job: EvidenceJob, signal: AbortSignal): Promise<EvidencePayload>;
}

export interface EvidenceJobFailure {
  readonly jobId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly message: string;
}

interface QueuedEvidence {
  readonly job: EvidenceJob;
  readonly controller: AbortController;
  cancelled: boolean;
}

function positiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
}

function freezePayload(payload: EvidencePayload): EvidencePayload {
  return Object.freeze({
    kind: payload.kind,
    source: payload.source,
    values: Object.freeze(structuredClone(payload.values)),
  });
}

function whitePerspectiveScore(value: number, fen: string): number {
  const turn = fen.split(/\s+/)[1];
  if (turn !== "w" && turn !== "b") throw new TypeError("Evidence job FEN has no valid turn");
  return turn === "w" ? value : -value;
}

export class EvidenceJobQueue implements JobObserver {
  readonly #executor: EvidenceExecutor;
  readonly #upgrader: ObjectiveEvidenceUpgrader | undefined;
  readonly #maxConcurrency: number;
  readonly #pending: QueuedEvidence[] = [];
  readonly #running = new Map<string, QueuedEvidence>();
  readonly #staged = new Map<string, StagedEvidence[]>();
  readonly #nextSeq = new Map<string, number>();
  readonly #idleWaiters = new Set<() => void>();
  readonly #failures: EvidenceJobFailure[] = [];
  #activeCount = 0;
  #jobCounter = 0;

  constructor(
    executor: EvidenceExecutor,
    options: {
      readonly maxConcurrency?: number;
      readonly objectiveUpgrader?: ObjectiveEvidenceUpgrader;
    } = {},
  ) {
    this.#executor = executor;
    this.#maxConcurrency = options.maxConcurrency ?? 2;
    positiveInteger(this.#maxConcurrency, "Evidence queue concurrency");
    this.#upgrader = options.objectiveUpgrader;
  }

  enqueue(input: EvidenceJobInput): EvidenceJob {
    if ((input.depth === undefined) === (input.movetime === undefined)) {
      throw new TypeError("Evidence job requires exactly one of depth or movetime");
    }
    if (input.depth !== undefined) positiveInteger(input.depth, "Evidence depth");
    if (input.movetime !== undefined) {
      positiveInteger(input.movetime, "Evidence movetime");
    }
    if (input.timeoutMs !== undefined) positiveInteger(input.timeoutMs, "Evidence timeout");
    const job = Object.freeze({
      ...input,
      id: `evidence-job-${++this.#jobCounter}`,
    });
    this.#pending.push({ job, controller: new AbortController(), cancelled: false });
    this.#pump();
    return job;
  }

  page(runId: string, sinceSeq = 0): EvidencePage {
    return Object.freeze({
      results: Object.freeze(
        (this.#staged.get(runId) ?? []).filter((result) => result.seq > sinceSeq),
      ),
      nextSeq: this.#nextSeq.get(runId) ?? 0,
    });
  }

  result(runId: string, seq: number): StagedEvidence | undefined {
    return this.#staged.get(runId)?.find((candidate) => candidate.seq === seq);
  }

  failures(runId: string): readonly EvidenceJobFailure[] {
    return Object.freeze(
      this.#failures.filter((failure) => failure.runId === runId),
    );
  }

  outstanding(runId: string): readonly Pick<EvidenceJob, "id" | "runId" | "nodeId" | "kind">[] {
    const queued = [
      ...this.#pending.map((entry) => entry.job),
      ...[...this.#running.values()].map((entry) => entry.job),
    ];
    const staged = (this.#staged.get(runId) ?? []).map((result) => Object.freeze({
      id: result.jobId,
      runId: result.runId,
      nodeId: result.nodeId,
      kind: result.payload.kind,
    }));
    return Object.freeze([...queued.filter((job) => job.runId === runId), ...staged]);
  }

  consume(runId: string, seq: number): void {
    const staged = this.#staged.get(runId);
    if (staged === undefined) return;
    this.#staged.set(
      runId,
      staged.filter((candidate) => candidate.seq !== seq),
    );
  }

  onRewound(prunedNodeIds: readonly string[]): void {
    const pruned = new Set(prunedNodeIds);
    for (let index = this.#pending.length - 1; index >= 0; index -= 1) {
      const queued = this.#pending[index]!;
      if (!pruned.has(queued.job.nodeId)) continue;
      queued.cancelled = true;
      queued.controller.abort();
      this.#pending.splice(index, 1);
    }
    for (const queued of this.#running.values()) {
      if (!pruned.has(queued.job.nodeId)) continue;
      queued.cancelled = true;
      queued.controller.abort();
    }
    for (const [runId, staged] of this.#staged) {
      this.#staged.set(
        runId,
        staged.filter((result) => !pruned.has(result.nodeId)),
      );
    }
    this.#settleIdle();
  }

  whenIdle(): Promise<void> {
    if (this.#activeCount === 0 && this.#pending.length === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.#idleWaiters.add(resolve));
  }

  #pump(): void {
    while (
      this.#activeCount < this.#maxConcurrency &&
      this.#pending.length > 0
    ) {
      const queued = this.#pending.shift()!;
      if (queued.cancelled) continue;
      this.#activeCount += 1;
      this.#running.set(queued.job.id, queued);
      void this.#execute(queued);
    }
    this.#settleIdle();
  }

  async #execute(queued: QueuedEvidence): Promise<void> {
    try {
      const payload = freezePayload(
        await this.#executor.execute(queued.job, queued.controller.signal),
      );
      if (queued.cancelled || queued.controller.signal.aborted) return;

      const evidenceRef = engineEvidenceRef(queued.job.id);
      const evidenceRefs = Object.freeze([evidenceRef]) as readonly [string];
      let objectiveProposal: ObjectiveEvidenceProposal | null = null;
      if (
        this.#upgrader !== undefined &&
        queued.job.objectiveRequest !== undefined
      ) {
        objectiveProposal = await this.#upgrader.evaluate(
          Object.freeze({
            ...queued.job.objectiveRequest,
            evidenceRefs: Object.freeze([
              ...new Set([
                ...queued.job.objectiveRequest.evidenceRefs,
                evidenceRef,
              ]),
            ]),
          }),
        );
      }
      if (queued.cancelled || queued.controller.signal.aborted) return;
      if (
        objectiveProposal !== null &&
        objectiveProposal.nodeId !== queued.job.nodeId
      ) {
        throw new TypeError("Objective upgrader proposed a different node");
      }

      const seq = (this.#nextSeq.get(queued.job.runId) ?? 0) + 1;
      this.#nextSeq.set(queued.job.runId, seq);
      const result: StagedEvidence = Object.freeze({
        seq,
        jobId: queued.job.id,
        runId: queued.job.runId,
        nodeId: queued.job.nodeId,
        evidenceRefs,
        payload,
        ...(objectiveProposal === null ? {} : { objectiveProposal }),
      });
      const staged = this.#staged.get(queued.job.runId) ?? [];
      this.#staged.set(queued.job.runId, [...staged, result]);
    } catch (error) {
      if (!queued.cancelled && !queued.controller.signal.aborted) {
        this.#failures.push(
          Object.freeze({
            jobId: queued.job.id,
            runId: queued.job.runId,
            nodeId: queued.job.nodeId,
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    } finally {
      this.#running.delete(queued.job.id);
      this.#activeCount -= 1;
      this.#pump();
    }
  }

  #settleIdle(): void {
    if (this.#activeCount !== 0 || this.#pending.length !== 0) return;
    for (const resolve of this.#idleWaiters) resolve();
    this.#idleWaiters.clear();
  }
}

export interface EvidenceEngineClient {
  execute(engineId: string, request: EngineRequest): Promise<readonly string[]>;
}

function lastInfo(lines: readonly string[], token: RegExp, engineId: string): string {
  const line = [...lines].reverse().find((candidate) => token.test(candidate));
  if (line === undefined) {
    throw engineUnavailable(
      engineId,
      0,
      new Error("Stockfish returned no requested evidence"),
    );
  }
  return line;
}

function depthValue(line: string): number | undefined {
  const match = /\bdepth (\d+)\b/.exec(line);
  return match === null ? undefined : Number(match[1]);
}

function searchProvenance(job: EvidenceJob, engineId: string) {
  return Object.freeze({
    engineId,
    ...(job.depth === undefined
      ? { requestedMovetimeMs: job.movetime! }
      : { requestedDepth: job.depth }),
  });
}

export class StockfishEvidenceExecutor implements EvidenceExecutor {
  readonly #client: EvidenceEngineClient;
  readonly #engineId: string;
  readonly #configuredMultiPv: number;

  constructor(
    client: EvidenceEngineClient,
    engineId: string,
    configuredMultiPv: number,
  ) {
    positiveInteger(configuredMultiPv, "Configured evidence MultiPV");
    this.#client = client;
    this.#engineId = engineId;
    this.#configuredMultiPv = configuredMultiPv;
  }

  async execute(job: EvidenceJob, signal: AbortSignal): Promise<EvidencePayload> {
    const go =
      job.depth === undefined
        ? `go movetime ${job.movetime!}`
        : `go depth ${job.depth}`;
    const lines = await this.#client.execute(this.#engineId, {
      commands: [
        `setoption name UCI_ShowWDL value ${job.kind === "wdl" ? "true" : "false"}`,
        `setoption name MultiPV value ${job.multiPv ?? this.#configuredMultiPv}`,
        `position fen ${job.fen}`,
        go,
      ],
      resetSearchState: true,
      until: (line) => line.startsWith("bestmove "),
      timeoutMs: job.timeoutMs ?? Math.max(5_000, (job.movetime ?? 0) * 10),
      signal,
    });

    if (job.kind === "eval") {
      const line = lastInfo(
        lines,
        /\bscore (?:cp|mate) -?\d+\b/,
        this.#engineId,
      );
      const score = /\bscore (cp|mate) (-?\d+)\b/.exec(line)!;
      const bestMove = [...lines].reverse().find((candidate) => candidate.startsWith("bestmove "))?.split(/\s+/)[1];
      return Object.freeze({
        kind: "eval",
        source: "engine_validated",
        values: Object.freeze({
          ...searchProvenance(job, this.#engineId),
          ...(score[1] === "cp"
            ? { centipawns: whitePerspectiveScore(Number(score[2]), job.fen) }
            : { mateIn: whitePerspectiveScore(Number(score[2]), job.fen) }),
          ...(bestMove === undefined || bestMove === "(none)" ? {} : { bestMoveUci: bestMove }),
          ...(depthValue(line) === undefined ? {} : { depth: depthValue(line) }),
        }),
      });
    }
    if (job.kind === "wdl") {
      const line = lastInfo(lines, /\bwdl \d+ \d+ \d+\b/, this.#engineId);
      const wdl = /\bwdl (\d+) (\d+) (\d+)\b/.exec(line)!;
      return Object.freeze({
        kind: "wdl",
        source: "engine_validated",
        values: Object.freeze({
          ...searchProvenance(job, this.#engineId),
          win: Number(wdl[1]),
          draw: Number(wdl[2]),
          loss: Number(wdl[3]),
          ...(depthValue(line) === undefined ? {} : { depth: depthValue(line) }),
        }),
      });
    }
    const line = lastInfo(
      lines,
      /\bpv [a-h][1-8][a-h][1-8][qrbn]?/,
      this.#engineId,
    );
    const movesUci = line
      .slice(line.indexOf(" pv ") + 4)
      .trim()
      .split(/\s+/);
    return Object.freeze({
      kind: "bestline",
      source: "engine_validated",
      values: Object.freeze({
        ...searchProvenance(job, this.#engineId),
        movesUci: Object.freeze(movesUci),
        ...(depthValue(line) === undefined ? {} : { depth: depthValue(line) }),
      }),
    });
  }
}
