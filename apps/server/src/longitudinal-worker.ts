// rfc/longitudinal-store.md §C — the HTTP-process supervisor for the longitudinal semantic executor.
// It owns no projection code: it starts one `worker_threads` thread against the exact canonical
// database file, forwards post-commit wake hints, reports closed readiness, and drains on close.
// It never renews a claim for a thread that may be dead; lease expiry is the durable recovery path.
// Drain is bounded ([[D3300]]): the thread abandons its in-flight claim at the next decision
// checkpoint, and a thread still busy after the grace is terminated (its lease then expires).
import { Worker } from "node:worker_threads";

import type { FileBackedDatabaseIdentity, LongitudinalWorkerConfig } from "./longitudinal-worker-config.js";
import {
  parseLongitudinalThreadMessage,
  type LongitudinalSupervisorMessage,
  type LongitudinalThreadMessage,
  type LongitudinalThreadWorkerData,
} from "./longitudinal-worker-protocol.js";

export type LongitudinalWorkerStatus =
  | { readonly status: "ready" }
  | { readonly status: "draining" }
  | { readonly status: "degraded"; readonly reason: "worker_start_failed" | "worker_exited" | "worker_protocol_invalid" };

export interface LongitudinalWorkerProgress {
  readonly claimed: number;
  readonly completed: number;
  readonly failed: number;
  readonly conflicts: number;
  readonly renewals: number;
  readonly abandoned: number;
}

/** The longest `drain()` waits for the thread to hand its claim back before terminating it. */
export const LONGITUDINAL_DRAIN_GRACE_MS = 2_000;

export interface LongitudinalWorkerStartInput {
  readonly database: FileBackedDatabaseIdentity;
  readonly storageVersion: number;
  readonly config: LongitudinalWorkerConfig;
  /** Built entry; defaults to the sibling `longitudinal-worker-thread.js` of the bundled server. */
  readonly threadUrl?: URL;
  readonly workerId?: string;
  readonly startTimeoutMs?: number;
  readonly drainGraceMs?: number;
}

export class LongitudinalWorkerStartError extends Error {
  constructor(readonly reason: "worker_start_failed" | "worker_protocol_invalid", message: string) {
    super(message);
    this.name = "LongitudinalWorkerStartError";
  }
}

export function defaultLongitudinalThreadUrl(): URL {
  return new URL("./longitudinal-worker-thread.js", import.meta.url);
}

export class LongitudinalProjectionWorker {
  readonly #worker: Worker;
  readonly #databasePath: string;
  readonly #drainCell: Int32Array;
  readonly #drainGraceMs: number;
  #status: LongitudinalWorkerStatus = { status: "ready" };
  #drained: Promise<void> | undefined;
  #resolveDrained: (() => void) | undefined;
  #exited = false;
  readonly #totals = { claimed: 0, completed: 0, failed: 0, conflicts: 0, renewals: 0, abandoned: 0 };
  readonly #listeners = new Set<(progress: LongitudinalWorkerProgress) => void>();

  private constructor(worker: Worker, databasePath: string, drainSignal: SharedArrayBuffer, drainGraceMs: number) {
    this.#worker = worker;
    this.#databasePath = databasePath;
    this.#drainCell = new Int32Array(drainSignal, 0, 1);
    this.#drainGraceMs = drainGraceMs;
  }

  static start(input: LongitudinalWorkerStartInput): Promise<LongitudinalProjectionWorker> {
    const drainGraceMs = input.drainGraceMs ?? LONGITUDINAL_DRAIN_GRACE_MS;
    if (!Number.isSafeInteger(drainGraceMs) || drainGraceMs < 0) {
      return Promise.reject(new LongitudinalWorkerStartError("worker_start_failed", "drainGraceMs must be a non-negative integer"));
    }
    const drainSignal = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
    const workerData: LongitudinalThreadWorkerData = Object.freeze({
      databasePath: input.database.absolutePath,
      storageVersion: input.storageVersion,
      workerId: input.workerId ?? `longitudinal-${process.pid}`,
      config: input.config,
      drainSignal,
    });
    let worker: Worker;
    try {
      worker = new Worker(input.threadUrl ?? defaultLongitudinalThreadUrl(), { workerData });
    } catch (error) {
      return Promise.reject(new LongitudinalWorkerStartError("worker_start_failed", error instanceof Error ? error.message : String(error)));
    }
    const supervisor = new LongitudinalProjectionWorker(worker, input.database.absolutePath, drainSignal, drainGraceMs);
    return new Promise<LongitudinalProjectionWorker>((resolve, reject) => {
      let ready = false;
      const timeout = setTimeout(() => {
        if (ready) return;
        void worker.terminate();
        reject(new LongitudinalWorkerStartError("worker_start_failed", "longitudinal worker did not report ready"));
      }, input.startTimeoutMs ?? 30_000);
      worker.on("message", (raw: unknown) => {
        const message = parseLongitudinalThreadMessage(raw);
        if (!ready) {
          if (message?.type === "ready" && message.databasePath === input.database.absolutePath) {
            ready = true;
            clearTimeout(timeout);
            resolve(supervisor);
            return;
          }
          clearTimeout(timeout);
          void worker.terminate();
          reject(new LongitudinalWorkerStartError("worker_protocol_invalid", message?.type === "error" ? message.message : "unexpected first message or database path disagreement"));
          return;
        }
        supervisor.#receive(message);
      });
      worker.on("error", (error) => {
        if (!ready) {
          clearTimeout(timeout);
          reject(new LongitudinalWorkerStartError("worker_start_failed", error.message));
          return;
        }
        supervisor.#degrade("worker_exited");
      });
      worker.on("exit", () => {
        supervisor.#exited = true;
        if (!ready) {
          clearTimeout(timeout);
          reject(new LongitudinalWorkerStartError("worker_start_failed", "longitudinal worker exited before ready"));
          return;
        }
        if (supervisor.#resolveDrained !== undefined) supervisor.#resolveDrained();
        else supervisor.#degrade("worker_exited");
      });
    });
  }

  #receive(message: LongitudinalThreadMessage | undefined): void {
    if (message === undefined) { this.#degrade("worker_protocol_invalid"); return; }
    if (message.type === "progress") {
      for (const key of Object.keys(this.#totals) as (keyof LongitudinalWorkerProgress)[]) this.#totals[key] += message[key];
      for (const listener of this.#listeners) listener(message);
    } else if (message.type === "drained") {
      this.#resolveDrained?.();
    } else if (message.type === "error" && message.code === "worker_protocol_invalid") {
      this.#degrade("worker_protocol_invalid");
    }
  }

  #degrade(reason: "worker_exited" | "worker_protocol_invalid"): void {
    if (this.#status.status === "draining") return;
    this.#status = { status: "degraded", reason };
  }

  get databasePath(): string {
    return this.#databasePath;
  }

  status(): LongitudinalWorkerStatus {
    return this.#status;
  }

  totals(): LongitudinalWorkerProgress {
    return Object.freeze({ ...this.#totals });
  }

  onProgress(listener: (progress: LongitudinalWorkerProgress) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Post-commit latency hint. Polling remains the authority for missed wakes and backlog. */
  wake(): void {
    if (this.#status.status !== "ready" || this.#exited) return;
    const message: LongitudinalSupervisorMessage = { type: "wake" };
    this.#worker.postMessage(message);
  }

  /**
   * Refuses new claims and returns within the drain grace ([[D3300]]). The shared drain cell is read
   * at every decision checkpoint, so the thread abandons its in-flight claim (lease expired now, for
   * immediate re-lease) and closes its connection within one decision; the `drain` message covers an
   * idle thread. A thread that has not reported `drained` when the grace elapses is terminated, and
   * lease expiry recovers whatever it held. Either way the thread is gone when this resolves.
   */
  drain(): Promise<void> {
    if (this.#drained !== undefined) return this.#drained;
    this.#status = { status: "draining" };
    Atomics.store(this.#drainCell, 0, 1);
    if (this.#exited) {
      this.#drained = Promise.resolve();
      return this.#drained;
    }
    let grace: NodeJS.Timeout | undefined;
    this.#drained = new Promise<void>((resolve) => {
      this.#resolveDrained = resolve;
      grace = setTimeout(resolve, this.#drainGraceMs);
      const message: LongitudinalSupervisorMessage = { type: "drain" };
      this.#worker.postMessage(message);
    }).then(async () => {
      clearTimeout(grace);
      await this.#worker.terminate();
    });
    return this.#drained;
  }

  /** Test seam: kill the thread without draining (the crash/reclaim fixture). */
  terminateForTest(): Promise<number> {
    return this.#worker.terminate();
  }
}
