/**
 * The durable evidence worker (rfc/evidence-job-durability.md §2).
 *
 * `EvidenceJobQueue` no longer holds jobs in memory: admission, lease, retry, settlement, staged
 * results and consumption are rows owned by `EvidenceJobStore` in the application database. This
 * class is the in-process executor bound to that store. It claims rows under a compare-and-swap
 * lease, calls exactly one of the two queued provider gateways, and settles through the store.
 * Restart recovery is `attach`: expired leases return to `retry_wait` and admitted rows resume.
 *
 * The two gateways are the whole queued provider population (criterion 21):
 * `evidence.stockfish_analysis` → `#execute` → `EvidenceExecutor.execute`, and
 * `evidence.tablebase_probe` → `#tablebasePayload` → `TablebaseSource.probe`.
 */
import {
  normalizeInboundMove,
  type EvidenceKind,
  type EvidencePayload,
  type ObjectiveEvidenceProposal,
  type ObjectiveEvidenceRequest,
  type ObjectiveEvidenceUpgrader,
  type ProviderSourceFailureReason,
} from "@chess-tabiya/runtime";

import type { EngineRequest } from "./engine-supervisor.js";
import { ServerError, engineUnavailable } from "./errors.js";
import {
  DEFAULT_EVIDENCE_RETRY_POLICY,
  EvidenceProviderLate,
  type EvidenceJobLease,
  type EvidenceJobStore,
  type EvidenceResultPage,
  type EvidenceRetryPolicy,
  type StagedEvidenceResult,
} from "./evidence-job-store.js";
import { EvidenceJobCorrupt, evidenceRefForJob, type EvidenceJobRow, type QueuedProviderOperationId } from "./evidence-jobs.js";
import type { TablebaseSource } from "./tablebase.js";
import { countFenPieces } from "./sourcing/chess-facts.js";

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

/** The executor-facing job view of one leased durable row. */
export interface EvidenceJob extends EvidenceJobInput {
  readonly id: string;
}

export type StagedEvidence = StagedEvidenceResult;
export type EvidencePage = EvidenceResultPage;

export interface EvidenceExecutor {
  /** The compiled provider instance whose identity every payload must carry. */
  readonly instanceId?: string;
  execute(job: EvidenceJob, signal: AbortSignal): Promise<EvidencePayload>;
}

export interface EvidenceJobFailure {
  readonly jobId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly kind: EvidenceKind;
  readonly message: string;
}

/** The durable surface the queue binds to; `SQLiteRunStorage` provides it. */
export interface EvidenceJobHost {
  readonly evidenceJobs: EvidenceJobStore;
  setEvidenceJobListener(listener: { wake(): void; cancelled(jobIds: readonly string[]): void } | undefined): void;
}

export interface EvidenceQueueOptions {
  readonly maxConcurrency?: number;
  readonly objectiveUpgrader?: ObjectiveEvidenceUpgrader;
  readonly tablebaseSource?: TablebaseSource;
  /** Lease duration for one claim; a provider response after expiry is stale. */
  readonly leaseMs?: number;
  /** Provider-unavailability retry policy before the origin's terminal effect. */
  readonly retry?: EvidenceRetryPolicy;
  /** The lease owner string written into claimed rows (defaults to a per-process identity). */
  readonly owner?: string;
}

function positiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
}

function whitePerspectiveScore(value: number, fen: string): number {
  const turn = fen.split(/\s+/)[1];
  if (turn !== "w" && turn !== "b") throw new TypeError("Evidence job FEN has no valid turn");
  return turn === "w" ? value : -value;
}

const SHUTDOWN = Symbol("evidence-queue-shutdown");
const SUPERSEDED = Symbol("evidence-job-superseded");

function failureReason(error: unknown): ProviderSourceFailureReason {
  if (error instanceof EvidenceJobCorrupt) return "invalid_response";
  if (error instanceof ServerError && (error.code === "ENGINE_UNAVAILABLE" || error.code === "TABLEBASE_UNAVAILABLE")) return "provider_unavailable";
  if (error instanceof Error && /timed? ?out|deadline/iu.test(error.message)) return "deadline_exceeded";
  if (error instanceof TypeError) return "invalid_response";
  return "provider_unavailable";
}

function executorJob(row: EvidenceJobRow): EvidenceJob {
  const { request } = row;
  return Object.freeze({
    id: row.id,
    runId: request.runId,
    nodeId: request.nodeId,
    fen: request.fen,
    kind: request.kind,
    ...(request.depth === null ? {} : { depth: request.depth }),
    ...(request.movetime === null ? {} : { movetime: request.movetime }),
    ...(request.multiPv === null ? {} : { multiPv: request.multiPv }),
    ...(request.timeoutMs === null ? {} : { timeoutMs: request.timeoutMs }),
    ...(request.objectiveRequest === null ? {} : { objectiveRequest: request.objectiveRequest }),
  });
}

export class EvidenceJobQueue {
  readonly #executor: EvidenceExecutor;
  readonly #upgrader: ObjectiveEvidenceUpgrader | undefined;
  readonly #tablebase: TablebaseSource | undefined;
  readonly #maxConcurrency: number;
  readonly #leaseMs: number;
  readonly #retry: EvidenceRetryPolicy;
  readonly #owner: string;
  readonly #active = new Map<string, AbortController>();
  readonly #idleWaiters = new Set<() => void>();
  #host: EvidenceJobHost | undefined;
  #retryTimer: ReturnType<typeof setTimeout> | undefined;
  #closed = false;

  constructor(executor: EvidenceExecutor, options: EvidenceQueueOptions = {}) {
    this.#executor = executor;
    this.#maxConcurrency = options.maxConcurrency ?? 2;
    positiveInteger(this.#maxConcurrency, "Evidence queue concurrency");
    this.#leaseMs = options.leaseMs ?? 120_000;
    positiveInteger(this.#leaseMs, "Evidence lease");
    this.#retry = options.retry ?? DEFAULT_EVIDENCE_RETRY_POLICY;
    positiveInteger(this.#retry.maxAttempts, "Evidence retry attempts");
    if (!Number.isSafeInteger(this.#retry.retryDelayMs) || this.#retry.retryDelayMs < 0) throw new TypeError("Evidence retry delay must be a non-negative safe integer");
    this.#upgrader = options.objectiveUpgrader;
    this.#tablebase = options.tablebaseSource;
    this.#owner = options.owner ?? `evidence-worker:${process.pid}:${Math.random().toString(36).slice(2, 10)}`;
  }

  /** Whether a tablebase gateway is configured (run enrichment plans only then include it). */
  get tablebaseConfigured(): boolean {
    return this.#tablebase !== undefined;
  }

  /** The compiled provider instance per queued operation. */
  instance(operation: QueuedProviderOperationId): string {
    if (operation === "evidence.tablebase_probe") {
      return this.#tablebase === undefined ? "tablebase-unconfigured" : this.#tablebase.kind === "lichess" ? "tablebase.lichess.org" : "tablebase-fixture";
    }
    return this.#executor.instanceId ?? "evidence-executor";
  }

  /**
   * Bind to one durable store and resume: expired leases return to `retry_wait` and every
   * admitted or due row is claimed. Binding twice to different stores is refused.
   */
  attach(host: EvidenceJobHost): void {
    if (this.#host === host) return;
    if (this.#host !== undefined) throw new TypeError("An evidence queue is bound to exactly one application database");
    this.#host = host;
    this.#closed = false;
    host.setEvidenceJobListener({ wake: () => this.#pump(), cancelled: (ids) => this.#abort(ids, SUPERSEDED) });
    host.evidenceJobs.recoverExpiredLeases();
    this.#pump();
  }

  get store(): EvidenceJobStore {
    if (this.#host === undefined) throw new ServerError("EVIDENCE_UNAVAILABLE", "Evidence queue is not bound to storage");
    return this.#host.evidenceJobs;
  }

  isIdle(): boolean {
    if (this.#active.size !== 0) return false;
    if (this.#host === undefined || this.#closed) return true;
    try {
      return this.#host.evidenceJobs.pendingCount() === 0;
    } catch {
      return true; // a closed database has no claimable work for this worker
    }
  }

  whenIdle(): Promise<void> {
    if (this.isIdle()) return Promise.resolve();
    return new Promise((resolve) => this.#idleWaiters.add(resolve));
  }

  page(runId: string, sinceSeq = 0): EvidencePage {
    return this.store.page(runId, sinceSeq);
  }

  result(runId: string, seq: number): StagedEvidence | undefined {
    return this.store.result(runId, seq);
  }

  /** Jobs still to settle or staged but unapplied, for Story readiness and tests. */
  outstanding(runId: string): readonly Pick<EvidenceJob, "id" | "runId" | "nodeId" | "kind">[] {
    return Object.freeze(this.store.jobsForRun(runId)
      .filter((row) => row.state === "admitted" || row.state === "running" || row.state === "retry_wait" || row.state === "settled_success")
      .map((row) => Object.freeze({ id: row.id, runId: row.runId, nodeId: row.nodeId, kind: row.request.kind })));
  }

  /** Terminal honest absence for provider unavailability (never an evidence payload). */
  failures(runId: string): readonly EvidenceJobFailure[] {
    return Object.freeze(this.store.jobsForRun(runId).flatMap((row) => {
      if (row.state === "settled_unavailable" || (row.state === "settled_empty" && row.settlement.reason === "provider_unavailable")) {
        const failure = "failure" in row.settlement ? row.settlement.failure : undefined;
        return [Object.freeze({ jobId: row.id, runId: row.runId, nodeId: row.nodeId, kind: row.request.kind, message: failure?.providerDetail ?? failure?.reason ?? "provider unavailable" })];
      }
      return [];
    }));
  }

  /** Graceful shutdown: in-flight leases return to `retry_wait` with a shutdown basis. */
  async close(): Promise<void> {
    this.#closed = true;
    if (this.#retryTimer !== undefined) clearTimeout(this.#retryTimer);
    this.#retryTimer = undefined;
    this.#abort([...this.#active.keys()], SHUTDOWN);
    if (this.#active.size > 0) await new Promise<void>((resolve) => this.#idleWaiters.add(resolve));
    this.#host?.setEvidenceJobListener(undefined);
  }

  #abort(jobIds: readonly string[], reason: symbol): void {
    for (const id of jobIds) this.#active.get(id)?.abort(reason);
  }

  #pump(): void {
    const host = this.#host;
    if (host === undefined) return;
    try {
      while (!this.#closed && this.#active.size < this.#maxConcurrency) {
        const lease = host.evidenceJobs.claimNext(this.#owner, this.#leaseMs);
        if (lease === undefined) break;
        const controller = new AbortController();
        this.#active.set(lease.jobId, controller);
        void this.#run(lease, controller);
      }
      this.#scheduleRetry();
    } catch (error) {
      // The durable rows stay authoritative: a closed database detaches this worker, and any
      // other claim failure leaves the row for the next wake or restart recovery.
      if (error instanceof Error && /database is not open/u.test(error.message)) this.#detach();
    }
    this.#settleIdle();
  }

  /** The application database closed underneath the worker: stop claiming, keep rows as they are. */
  #detach(): void {
    this.#closed = true;
    if (this.#retryTimer !== undefined) clearTimeout(this.#retryTimer);
    this.#retryTimer = undefined;
    this.#abort([...this.#active.keys()], SHUTDOWN);
  }

  #scheduleRetry(): void {
    if (this.#closed || this.#host === undefined || this.#retryTimer !== undefined) return;
    const next = this.#host.evidenceJobs.nextRetryAt();
    if (next === undefined) return;
    const delay = Math.max(0, Date.parse(next) - Date.parse(this.#host.evidenceJobs.now()));
    this.#retryTimer = setTimeout(() => {
      this.#retryTimer = undefined;
      this.#pump();
    }, Math.min(delay + 5, 2_147_483_647));
    // A retry hint must not hold the process open; restart recovery owns the waiting row.
    (this.#retryTimer as { unref?: () => void }).unref?.();
  }

  async #run(lease: EvidenceJobLease, controller: AbortController): Promise<void> {
    try {
      await this.#execute(lease, controller.signal);
    } catch {
      // A settlement refusal leaves the row for lease-expiry recovery; nothing is fabricated.
    } finally {
      this.#active.delete(lease.jobId);
      this.#pump();
    }
  }

  /** The single worker body: begin under a live lease, call one gateway, settle through the store. */
  async #execute(lease: EvidenceJobLease, signal: AbortSignal): Promise<void> {
    const store = this.store;
    const job = lease.job;
    const operation = job.providerOperationId;
    let instance = this.instance(operation);
    if (operation === "evidence.tablebase_probe" && this.#tablebase === undefined) {
      store.settleEmpty(lease, "capability_not_configured");
      return;
    }
    const request = store.beginProviderRequest(lease);
    if (request === undefined) return;
    let raw: EvidencePayload;
    try {
      raw = operation === "evidence.tablebase_probe"
        ? await this.#tablebasePayload(executorJob(job))
        : await this.#executor.execute(executorJob(job), signal);
    } catch (error) {
      if (signal.aborted) {
        if (signal.reason === SHUTDOWN) store.returnForShutdown(lease);
        return;
      }
      const failure = store.failProviderRequest(request, failureReason(error), error instanceof Error ? error.message : String(error));
      store.settleProviderUnavailable(lease, failure, this.#retry, instance);
      return;
    }
    if (signal.aborted) {
      if (signal.reason === SHUTDOWN) store.returnForShutdown(lease);
      return;
    }
    // An executor that declares no compiled instance (test doubles) is identified by its own
    // claim; production executors declare one, so a crossed engine claim is refused.
    if (operation === "evidence.stockfish_analysis" && this.#executor.instanceId === undefined) {
      const claimed = (raw as { readonly values?: { readonly engineId?: unknown } } | null)?.values?.engineId;
      if (typeof claimed === "string" && claimed !== "") instance = claimed;
    }
    let delivery;
    try {
      delivery = store.completeProviderRequest(request, this.#withProvenance(raw, job, instance), instance);
    } catch (error) {
      if (error instanceof EvidenceProviderLate) return; // stale: expiry recovery owns the row
      const failure = store.failProviderRequest(request, failureReason(error), error instanceof Error ? error.message : String(error));
      store.settleProviderUnavailable(lease, failure, this.#retry, instance);
      return;
    }
    let proposal: ObjectiveEvidenceProposal | null = null;
    const objective = job.request.objectiveRequest;
    if (this.#upgrader !== undefined && objective !== null) {
      const reference = evidenceRefForJob(job.request.kind, job.id);
      proposal = await this.#upgrader.evaluate(Object.freeze({
        ...objective,
        evidenceRefs: Object.freeze([...new Set([...objective.evidenceRefs, reference])]),
      }));
    }
    if (signal.aborted) {
      if (signal.reason === SHUTDOWN) store.returnForShutdown(lease);
      return;
    }
    try {
      store.settleSuccess(delivery, proposal);
    } catch (error) {
      if (!(error instanceof ServerError && error.code === "EVIDENCE_JOB_CORRUPT")) throw error;
      const failure = store.failProviderRequest(request, "invalid_response", error.message);
      store.settleProviderUnavailable(lease, failure, this.#retry, instance);
    }
  }

  /**
   * Engine provenance is the gateway's, not the provider's: an absent `engineId`/search bound is
   * stamped from the compiled instance and the stored request; a present one must already equal
   * them (the payload parser refuses a crossed claim).
   */
  #withProvenance(payload: EvidencePayload, job: EvidenceJobRow, instance: string): unknown {
    if (payload === null || typeof payload !== "object" || job.request.kind === "tablebase") return payload;
    const values = (payload as { readonly values?: unknown }).values;
    if (values === null || typeof values !== "object" || Array.isArray(values)) return payload;
    const current = values as Readonly<Record<string, unknown>>;
    const bound = job.request.depth !== null ? { requestedDepth: job.request.depth } : { requestedMovetimeMs: job.request.movetime };
    return {
      ...payload,
      values: {
        ...(current.engineId === undefined ? { engineId: instance } : {}),
        ...(current.requestedDepth === undefined && current.requestedMovetimeMs === undefined ? bound : {}),
        ...current,
      },
    };
  }

  async #tablebasePayload(job: EvidenceJob): Promise<EvidencePayload> {
    if (this.#tablebase === undefined) throw new TypeError("Tablebase evidence source is not configured");
    const result = await this.#tablebase.probe(job.fen);
    return Object.freeze({
      kind: "tablebase",
      source: "tablebase_exact",
      values: Object.freeze({
        fen: job.fen,
        pieceCount: countFenPieces(job.fen),
        category: result.category,
        dtz: result.dtz,
        preciseDtz: result.preciseDtz ?? null,
        sourceId: this.instance("evidence.tablebase_probe"),
      }),
    });
  }

  #settleIdle(): void {
    if (!this.isIdle() && !(this.#closed && this.#active.size === 0)) return;
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

  get instanceId(): string {
    return this.#engineId;
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
          perspective: "white",
          ...(bestMove === undefined || bestMove === "(none)" ? {} : { bestMoveUci: normalizeInboundMove(job.fen, bestMove, "engine_bestmove").moveUci }),
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
