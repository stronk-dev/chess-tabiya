// module-registration §2.5.2 / review-map §1a. Private collection lifetime only:
// no evidence issuer, source cache, presentation authority or completed-result store.
import { randomUUID } from "node:crypto";
import { setImmediate as yieldTurn } from "node:timers/promises";

export interface ReviewJobPrincipal {
  readonly principalId: string;
  readonly sessionId: string;
  readonly runId: string;
}
export interface ReviewJobIdentity extends ReviewJobPrincipal {
  readonly scope: "modules" | "rich_review";
  /** Server-derived access/configuration, decision, branch, focus and opened doors. */
  readonly selectionKey: string;
}
export type ReviewJobFailure = "not_found" | "capacity" | "busy" | "budget_exhausted" | "cancelled" | "stale" | "source_failed";
export class ReviewJobError extends Error {
  constructor(readonly reason: ReviewJobFailure, options?: ErrorOptions) {
    super(`Review job: ${reason}`, options); this.name = "ReviewJobError";
  }
}
declare const reviewJobLeaseBrand: unique symbol;
export interface ReviewJobLease<T> { readonly [reviewJobLeaseBrand]: T }
export interface ReviewJobClock {
  readonly jobId: string;
  readonly elapsedMs: number;
  readonly remainingBudgetMs: number;
}
export interface ReviewJobControl {
  readonly signal: AbortSignal;
  readonly clock: () => ReviewJobClock;
  /** The original source adapter owns outcome mapping; expired/late results never escape. */
  readonly optionalSource: <R>(collect: (source: Readonly<{ signal: AbortSignal; timeoutMs: number }>) => R | Promise<R>) => Promise<R>;
}
interface Work<T> {
  readonly value: T;
  readonly checkCurrent: () => void;
  readonly dispose: () => void;
}
interface Entry {
  readonly id: string;
  readonly identity: ReviewJobIdentity;
  readonly startedAt: number;
  readonly controller: AbortController;
  readonly token: ReviewJobLease<unknown>;
  timer: ReturnType<typeof setTimeout> | undefined;
  readonly sourceTimers: Set<ReturnType<typeof setTimeout>>;
  work: Work<unknown> | undefined;
  busy: boolean;
}
const TOTAL_MS = 5_000, OPTIONAL_MS = 500;
const sameIdentity = (a: ReviewJobIdentity, b: ReviewJobIdentity) => a.principalId === b.principalId
  && a.sessionId === b.sessionId && a.runId === b.runId && a.scope === b.scope && a.selectionKey === b.selectionKey;

/** One owner serves both delivery scopes. All source handles stay in its bounded live entries. */
export class ReviewJobOwner {
  readonly #maxJobs: number;
  readonly #now: () => number;
  readonly #entries = new Map<string, Entry>();
  // A retained retired token holds only its id, never the old work/owner/source graph.
  readonly #tokens = new WeakMap<object, string>();
  #closed = false;
  constructor(options: Readonly<{ maxJobs: number; now?: () => number }>) {
    if (!Number.isSafeInteger(options.maxJobs) || options.maxJobs < 1) throw new TypeError("Review maxJobs must be a positive safe integer");
    this.#maxJobs = options.maxJobs; this.#now = options.now ?? (() => performance.now());
  }

  get size(): number { return this.#entries.size; }

  /** Reserve capacity and start the absolute clock BEFORE any original source preparation. */
  start<T>(identity: ReviewJobIdentity, prepare: (control: ReviewJobControl) => Work<T>): ReviewJobLease<T> {
    if (this.#closed) throw new ReviewJobError("not_found");
    if (this.#entries.size >= this.#maxJobs) throw new ReviewJobError("capacity");
    const startedAt = this.#now(), id = randomUUID(), token = Object.freeze({}) as ReviewJobLease<unknown>;
    const entry: Entry = { id, identity: Object.freeze({ ...identity }), startedAt, token, controller: new AbortController(),
      timer: undefined, sourceTimers: new Set(), work: undefined, busy: false };
    this.#entries.set(id, entry); this.#tokens.set(token, id);
    entry.timer = setTimeout(() => this.#retire(entry, "budget_exhausted"), TOTAL_MS); entry.timer.unref();
    try {
      const control = this.#control(entry);
      entry.work = prepare(control);
      this.#check(entry);
      return token as ReviewJobLease<T>;
    } catch (error) {
      this.#retire(entry, "source_failed");
      throw error instanceof ReviewJobError ? error : new ReviewJobError("source_failed", { cause: error });
    }
  }

  /** Identity comes from current authenticated server authority, never the public handle itself. */
  resume<T>(identity: ReviewJobIdentity, jobId: string): ReviewJobLease<T> {
    const entry = this.#entries.get(jobId);
    if (entry === undefined || !sameIdentity(entry.identity, identity)) throw new ReviewJobError("not_found");
    this.#check(entry); return entry.token as ReviewJobLease<T>;
  }

  clock<T>(lease: ReviewJobLease<T>): ReviewJobClock {
    const entry = this.#entry(lease); this.#check(entry); return this.#clock(entry);
  }

  /** Exactly one actual indivisible source/assembly unit, with a real yield between units. */
  async unit<T, R>(lease: ReviewJobLease<T>, collect: (work: T, control: ReviewJobControl) => R | Promise<R>,
    signal?: AbortSignal, complete?: (result: R) => boolean): Promise<R> {
    return this.#run(lease, collect, signal, complete ?? false);
  }

  /** The callback includes final presentation serialization. No completed source graph is cached. */
  async finish<T, R>(lease: ReviewJobLease<T>, serialize: (work: T, control: ReviewJobControl) => R | Promise<R>,
    signal?: AbortSignal): Promise<R> {
    return this.#run(lease, serialize, signal, true);
  }

  cancel(principal: ReviewJobPrincipal, jobId: string): Readonly<{ jobId: string; state: "cancelled" }> {
    const entry = this.#entries.get(jobId);
    if (entry === undefined || entry.identity.principalId !== principal.principalId
      || entry.identity.sessionId !== principal.sessionId || entry.identity.runId !== principal.runId) throw new ReviewJobError("not_found");
    this.#check(entry);
    this.#retire(entry, "cancelled"); return Object.freeze({ jobId, state: "cancelled" });
  }

  close(): void {
    this.#closed = true;
    for (const entry of this.#entries.values()) this.#retire(entry, "cancelled");
  }

  #entry<T>(lease: ReviewJobLease<T>): Entry {
    const id = lease !== null && typeof lease === "object" ? this.#tokens.get(lease) : undefined;
    const entry = id === undefined ? undefined : this.#entries.get(id);
    if (entry === undefined) throw new ReviewJobError("not_found");
    return entry;
  }
  #clock(entry: Entry): ReviewJobClock {
    const elapsedMs = Math.max(0, this.#now() - entry.startedAt);
    return Object.freeze({ jobId: entry.id, elapsedMs, remainingBudgetMs: Math.max(0, TOTAL_MS - elapsedMs) });
  }
  #check(entry: Entry): void {
    entry.controller.signal.throwIfAborted();
    if (this.#entries.get(entry.id) !== entry) throw new ReviewJobError("not_found");
    if (this.#clock(entry).remainingBudgetMs <= 0) {
      this.#retire(entry, "budget_exhausted"); entry.controller.signal.throwIfAborted();
    }
    try { entry.work?.checkCurrent(); }
    catch (error) {
      this.#retire(entry, "stale"); throw new ReviewJobError("stale", { cause: error });
    }
    // Live authorization itself can consume time or cancel this job.
    entry.controller.signal.throwIfAborted();
    if (this.#clock(entry).remainingBudgetMs <= 0) {
      this.#retire(entry, "budget_exhausted"); entry.controller.signal.throwIfAborted();
    }
  }
  #control(entry: Entry): ReviewJobControl {
    return Object.freeze({ signal: entry.controller.signal, clock: () => {
      this.#check(entry); return this.#clock(entry);
    }, optionalSource: <R>(collect: (source: Readonly<{ signal: AbortSignal; timeoutMs: number }>) => R | Promise<R>) => this.#optional(entry, collect) });
  }
  async #optional<R>(entry: Entry, collect: (source: Readonly<{ signal: AbortSignal; timeoutMs: number }>) => R | Promise<R>): Promise<R> {
    this.#check(entry);
    const timeoutMs = Math.min(OPTIONAL_MS, Math.floor(this.#clock(entry).remainingBudgetMs));
    if (timeoutMs < 1) { this.#retire(entry, "budget_exhausted"); entry.controller.signal.throwIfAborted(); }
    const source = new AbortController(), signal = AbortSignal.any([entry.controller.signal, source.signal]);
    const sourceDeadline = this.#now() + timeoutMs;
    const current = () => {
      this.#check(entry);
      if (this.#now() >= sourceDeadline) source.abort(new ReviewJobError("budget_exhausted"));
      signal.throwIfAborted();
    };
    const timer = setTimeout(() => source.abort(new ReviewJobError("budget_exhausted")), timeoutMs); timer.unref();
    entry.sourceTimers.add(timer);
    let rejectAbort: (() => void) | undefined;
    try {
      const interrupted = new Promise<never>((_, reject) => {
        rejectAbort = () => reject(signal.reason); signal.addEventListener("abort", rejectAbort, { once: true });
      });
      const pending = Promise.resolve().then(() => {
        current(); return collect(Object.freeze({ signal, timeoutMs }));
      });
      const result = await Promise.race([pending, interrupted]);
      current(); return result;
    } finally {
      clearTimeout(timer); entry.sourceTimers.delete(timer);
      if (rejectAbort !== undefined) signal.removeEventListener("abort", rejectAbort);
    }
  }
  #retire(entry: Entry, reason: Exclude<ReviewJobFailure, "not_found" | "capacity" | "busy"> | "complete"): void {
    const active = this.#entries.get(entry.id) === entry;
    if (!active && entry.work === undefined) return;
    if (active) this.#entries.delete(entry.id);
    clearTimeout(entry.timer);
    for (const timer of entry.sourceTimers) clearTimeout(timer);
    entry.sourceTimers.clear();
    const work = entry.work; entry.work = undefined;
    if (active) entry.controller.abort(reason === "complete" ? new DOMException("Review collection complete", "AbortError") : new ReviewJobError(reason));
    // Ownership is severed even if a source owner's cleanup unexpectedly throws.
    try { work?.dispose(); } catch { /* terminal cleanup must not throw from an idle timer */ }
  }
  async #run<T, R>(lease: ReviewJobLease<T>, collect: (work: T, control: ReviewJobControl) => R | Promise<R>,
    signal: AbortSignal | undefined, final: boolean | ((result: R) => boolean)): Promise<R> {
    const entry = this.#entry(lease);
    if (entry.busy) throw new ReviewJobError("busy");
    entry.busy = true;
    const abort = () => this.#retire(entry, "cancelled");
    signal?.addEventListener("abort", abort, { once: true });
    let rejectAbort: (() => void) | undefined;
    try {
      if (signal?.aborted) abort();
      this.#check(entry);
      const interrupted = new Promise<never>((_, reject) => {
        rejectAbort = () => reject(entry.controller.signal.reason);
        entry.controller.signal.addEventListener("abort", rejectAbort, { once: true });
      });
      const pending = Promise.resolve().then(() => {
        this.#check(entry); return collect(entry.work!.value as T, this.#control(entry));
      });
      const result = await Promise.race([pending, interrupted]);
      this.#check(entry);
      await yieldTurn();
      this.#check(entry);
      const complete = typeof final === "function" ? final(result) : final;
      this.#check(entry);
      if (complete) this.#retire(entry, "complete");
      return result;
    } catch (error) {
      this.#retire(entry, "source_failed");
      throw error instanceof ReviewJobError ? error : new ReviewJobError("source_failed", { cause: error });
    } finally {
      signal?.removeEventListener("abort", abort);
      if (rejectAbort !== undefined) entry.controller.signal.removeEventListener("abort", rejectAbort);
      entry.busy = false;
    }
  }
}
