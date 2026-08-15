import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface, type Interface as ReadLineInterface } from "node:readline";

import { engineUnavailable } from "./errors.js";

export type EngineKind = "judge" | "opponent";
export type EngineStatus =
  | "stopped"
  | "starting"
  | "ready"
  | "restarting"
  | "unavailable"
  | "shutting_down";

export interface EngineIdentity {
  readonly id: string;
  readonly kind: EngineKind;
  readonly name: string;
  readonly version: string;
  readonly modelId?: string;
  readonly containerDigest?: string;
  readonly seedHonored: boolean;
  readonly eloHonored?: boolean;
}

export interface RestartBackoff {
  readonly initialMs: number;
  readonly maximumMs: number;
  readonly maximumAttempts: number;
}

export interface EngineSpec {
  readonly id: string;
  readonly kind: EngineKind;
  readonly command: string;
  readonly args?: readonly string[];
  readonly options?: Readonly<Record<string, string | number | boolean>>;
  readonly name?: string;
  readonly version?: string;
  readonly modelId?: string;
  readonly containerDigest?: string;
  readonly seedOption?: string;
  readonly bandOption?: string;
  readonly bandRange?: {
    readonly min?: number;
    readonly max?: number;
  };
  readonly transcriptCapacity?: number;
  readonly handshakeTimeoutMs?: number;
  readonly restartBackoff?: RestartBackoff;
}

export interface TranscriptEntry {
  readonly at: string;
  readonly direction: "sent" | "received" | "stderr" | "lifecycle";
  readonly line: string;
}

export interface EngineHealth {
  readonly id: string;
  readonly status: EngineStatus;
  readonly restartCount: number;
  readonly identity?: EngineIdentity;
  readonly options?: readonly EngineOption[];
  readonly bandOption?: string;
  readonly bandRange?: {
    readonly min?: number;
    readonly max?: number;
  };
  readonly lastError?: string;
}

export interface EngineOption {
  readonly name: string;
  readonly type: "check" | "spin" | "combo" | "button" | "string";
  readonly default?: string;
  readonly min?: number;
  readonly max?: number;
  readonly vars?: readonly string[];
}

export interface EngineRequest {
  readonly commands: readonly string[];
  readonly afterCommands?: readonly string[];
  readonly resetSearchState?: boolean;
  readonly until: (line: string) => boolean;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

const OPTION_TYPES = Object.freeze(["check", "spin", "combo", "button", "string"] as const);

export function parseEngineOptions(lines: readonly string[]): readonly EngineOption[] {
  return Object.freeze(lines.flatMap((line) => {
    const match = /^option name (.+) type (check|spin|combo|button|string)(?: (.*))?$/u.exec(line);
    if (match === null) return [];
    const [, name, typeValue, tail = ""] = match;
    const type = typeValue as EngineOption["type"];
    if (!(OPTION_TYPES as readonly string[]).includes(type)) return [];
    const fields = [...tail.matchAll(/(?:^| )(default|min|max|var) (?=\S)/gu)];
    const values = new Map<string, string[]>();
    for (const [index, field] of fields.entries()) {
      const key = field[1]!;
      const start = field.index! + field[0].length;
      const end = fields[index + 1]?.index ?? tail.length;
      const value = tail.slice(start, end).trim();
      if (value !== "") values.set(key, [...(values.get(key) ?? []), value]);
    }
    const numeric = (key: "min" | "max"): number | undefined => {
      const value = values.get(key)?.at(-1);
      if (value === undefined) return undefined;
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) throw new TypeError(`Engine option ${name} has invalid ${key}: ${value}`);
      return parsed;
    };
    const min = type === "spin" ? numeric("min") : undefined;
    const max = type === "spin" ? numeric("max") : undefined;
    return [Object.freeze({
      name: name!,
      type,
      ...(values.get("default")?.at(-1) === undefined ? {} : { default: values.get("default")!.at(-1)! }),
      ...(min === undefined ? {} : { min }),
      ...(max === undefined ? {} : { max }),
      ...(type !== "combo" || values.get("var") === undefined
        ? {}
        : { vars: Object.freeze(values.get("var")!) }),
    })];
  }));
}

const DEFAULT_BACKOFF: RestartBackoff = {
  initialMs: 250,
  maximumMs: 5_000,
  maximumAttempts: 5,
};
const DEFAULT_TRANSCRIPT_CAPACITY = 256;
const DEFAULT_TIMEOUT_MS = 5_000;

class TranscriptRing {
  readonly #capacity: number;
  readonly #entries: TranscriptEntry[] = [];

  constructor(capacity: number) {
    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      throw new TypeError("Transcript capacity must be a positive safe integer");
    }
    this.#capacity = capacity;
  }

  push(direction: TranscriptEntry["direction"], line: string): void {
    this.#entries.push(Object.freeze({ at: new Date().toISOString(), direction, line }));
    if (this.#entries.length > this.#capacity) this.#entries.shift();
  }

  snapshot(): readonly TranscriptEntry[] {
    return Object.freeze([...this.#entries]);
  }
}

interface LineWaiter {
  readonly lines: string[];
  readonly predicate: (line: string) => boolean;
  readonly resolve: (lines: readonly string[]) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

function positiveDuration(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
}

function parseIdentity(
  spec: EngineSpec,
  lines: readonly string[],
  options: readonly EngineOption[],
): { readonly identity: EngineIdentity; readonly mismatch?: string } {
  const advertised = lines.find((line) => line.startsWith("id name "))?.slice(8).trim();
  const [advertisedName = "unknown", ...advertisedVersionParts] =
    advertised?.split(/\s+/u) ?? [];
  const advertisedVersion = advertisedVersionParts.join(" ") || "unknown";
  const agrees =
    spec.name === undefined ||
    advertised === spec.name ||
    advertised?.startsWith(`${spec.name} `) === true;
  const name = spec.name ?? advertisedName;
  const version = spec.version ?? (agrees ? advertisedVersion : "unknown");
  const optionNames = new Set(options.map((option) => option.name));
  const identity = Object.freeze({
    id: spec.id,
    kind: spec.kind,
    name,
    version,
    ...(spec.modelId === undefined ? {} : { modelId: spec.modelId }),
    ...(spec.containerDigest === undefined
      ? {}
      : { containerDigest: spec.containerDigest }),
    seedHonored:
      spec.seedOption === undefined ? false : optionNames.has(spec.seedOption),
    eloHonored:
      spec.bandOption === undefined ? false : optionNames.has(spec.bandOption),
  });
  return Object.freeze({
    identity,
    ...(!agrees && advertised !== undefined
      ? { mismatch: `identity mismatch: configured ${spec.name}, advertised ${advertised}` }
      : {}),
  });
}

class ManagedUciEngine {
  readonly #spec: EngineSpec;
  readonly #transcript: TranscriptRing;
  readonly #backoff: RestartBackoff;
  #process: ChildProcessWithoutNullStreams | undefined;
  #stdout: ReadLineInterface | undefined;
  #stderr: ReadLineInterface | undefined;
  #waiters = new Set<LineWaiter>();
  #status: EngineStatus = "stopped";
  #identity: EngineIdentity | undefined;
  #options: readonly EngineOption[] | undefined;
  #startPromise: Promise<EngineIdentity> | undefined;
  #requestQueue: Promise<void> = Promise.resolve();
  #restartTimer: ReturnType<typeof setTimeout> | undefined;
  #restartAttempt = 0;
  #restartCount = 0;
  #lastError: string | undefined;
  #closing = false;

  constructor(spec: EngineSpec) {
    const backoff = spec.restartBackoff ?? DEFAULT_BACKOFF;
    positiveDuration(backoff.initialMs, "Restart initial delay");
    positiveDuration(backoff.maximumMs, "Restart maximum delay");
    positiveDuration(backoff.maximumAttempts, "Restart maximum attempts");
    if (backoff.maximumMs < backoff.initialMs) {
      throw new TypeError("Restart maximum delay cannot be below initial delay");
    }
    if (spec.bandRange?.min !== undefined && !Number.isSafeInteger(spec.bandRange.min)) {
      throw new TypeError("Engine band minimum must be a safe integer");
    }
    if (spec.bandRange?.max !== undefined && !Number.isSafeInteger(spec.bandRange.max)) {
      throw new TypeError("Engine band maximum must be a safe integer");
    }
    if (spec.bandRange?.min !== undefined && spec.bandRange.max !== undefined && spec.bandRange.min > spec.bandRange.max) {
      throw new TypeError("Engine band minimum cannot exceed its maximum");
    }
    this.#spec = spec;
    this.#backoff = backoff;
    this.#transcript = new TranscriptRing(
      spec.transcriptCapacity ?? DEFAULT_TRANSCRIPT_CAPACITY,
    );
  }

  health(): EngineHealth {
    return Object.freeze({
      id: this.#spec.id,
      status: this.#status,
      restartCount: this.#restartCount,
      ...(this.#identity === undefined ? {} : { identity: this.#identity }),
      ...(this.#options === undefined ? {} : { options: this.#options }),
      ...(this.#spec.bandOption === undefined ? {} : { bandOption: this.#spec.bandOption }),
      ...(this.#spec.bandRange === undefined ? {} : { bandRange: this.#spec.bandRange }),
      ...(this.#lastError === undefined ? {} : { lastError: this.#lastError }),
    });
  }

  transcript(): readonly TranscriptEntry[] {
    return this.#transcript.snapshot();
  }

  async start(): Promise<EngineIdentity> {
    if (this.#status === "ready" && this.#identity !== undefined) return this.#identity;
    if (this.#startPromise !== undefined) return this.#startPromise;
    this.#closing = false;
    this.#startPromise = this.#spawnAndHandshake().finally(() => {
      this.#startPromise = undefined;
    });
    return this.#startPromise;
  }

  async #spawnAndHandshake(): Promise<EngineIdentity> {
    this.#clearRestartTimer();
    this.#status = "starting";
    this.#transcript.push(
      "lifecycle",
      `spawn ${this.#spec.command} ${(this.#spec.args ?? []).join(" ")}`.trim(),
    );

    const child = spawn(this.#spec.command, [...(this.#spec.args ?? [])], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.#process = child;
    this.#stdout = createInterface({ input: child.stdout });
    this.#stderr = createInterface({ input: child.stderr });
    this.#stdout.on("line", (line) => this.#receive(line));
    this.#stderr.on("line", (line) => this.#transcript.push("stderr", line));
    child.once("error", (error) => this.#failed(child, error));
    child.once("exit", (code, signal) => {
      this.#failed(
        child,
        new Error(`engine exited (code=${String(code)}, signal=${String(signal)})`),
      );
    });

    try {
      const timeout = this.#spec.handshakeTimeoutMs ?? DEFAULT_TIMEOUT_MS;
      const uciLines = await this.#exchange("uci", (line) => line === "uciok", timeout);
      const parsedOptions = parseEngineOptions(uciLines);
      const parsedIdentity = parseIdentity(this.#spec, uciLines, parsedOptions);
      this.#identity = parsedIdentity.identity;
      this.#options = parsedOptions;
      const advertisedBand = this.#spec.bandOption === undefined
        ? undefined
        : parsedOptions.find((option) => option.name === this.#spec.bandOption && option.type === "spin");
      const effectiveMin = Math.max(
        advertisedBand?.min ?? Number.NEGATIVE_INFINITY,
        this.#spec.bandRange?.min ?? Number.NEGATIVE_INFINITY,
      );
      const effectiveMax = Math.min(
        advertisedBand?.max ?? Number.POSITIVE_INFINITY,
        this.#spec.bandRange?.max ?? Number.POSITIVE_INFINITY,
      );
      if (effectiveMin > effectiveMax) {
        throw new TypeError(`Engine ${this.#spec.id} publishes no value inside its configured band range`);
      }
      if (parsedIdentity.mismatch !== undefined) {
        this.#transcript.push("lifecycle", parsedIdentity.mismatch);
      }
      for (const [name, value] of Object.entries(this.#spec.options ?? {})) {
        this.#send(`setoption name ${name} value ${String(value)}`);
      }
      await this.#exchange("isready", (line) => line === "readyok", timeout);
      this.#status = "ready";
      this.#restartAttempt = 0;
      this.#lastError = undefined;
      this.#transcript.push("lifecycle", "ready");
      return this.#identity;
    } catch (error) {
      this.#lastError = error instanceof Error ? error.message : String(error);
      this.#status = "unavailable";
      child.kill();
      this.#scheduleRestart();
      if (error instanceof Error && "code" in error) throw error;
      throw engineUnavailable(
        this.#spec.id,
        this.#nextBackoffMs(),
        error instanceof Error ? error : undefined,
      );
    }
  }

  async execute(request: EngineRequest): Promise<readonly string[]> {
    const task = this.#requestQueue.then(async () => {
      if (request.signal?.aborted) throw abortError();
      await this.start();
      if (request.signal?.aborted) throw abortError();
      const onAbort = (): void => {
        try {
          this.#send("stop");
        } catch {
          // The queue still discards the result; process failure owns diagnostics.
        }
      };
      request.signal?.addEventListener("abort", onAbort, { once: true });
      try {
        if (request.signal?.aborted) {
          onAbort();
          throw abortError();
        }
        if (request.resetSearchState === true) {
          this.#send("ucinewgame");
          if (this.#options?.some((option) => option.name === "Clear Hash") === true) {
            this.#send("setoption name Clear Hash");
          }
          await this.#exchange(
            "isready",
            (line) => line === "readyok",
            Math.min(request.timeoutMs ?? DEFAULT_TIMEOUT_MS, 5_000),
          );
          if (request.signal?.aborted) throw abortError();
        }
        const response = this.#waitFor(
          request.until,
          request.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        );
        for (const command of request.commands) this.#send(command);
        const lines = await response;
        if (request.signal?.aborted) throw abortError();
        for (const command of request.afterCommands ?? []) this.#send(command);
        return lines;
      } catch (error) {
        if (isAbortError(error)) throw error;
        this.#process?.kill();
        throw error instanceof Error && "code" in error
          ? error
          : engineUnavailable(
              this.#spec.id,
              this.#nextBackoffMs(),
              error instanceof Error ? error : undefined,
            );
      } finally {
        request.signal?.removeEventListener("abort", onAbort);
      }
    });
    this.#requestQueue = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  }

  async checkReady(): Promise<EngineHealth> {
    await this.execute({ commands: ["isready"], until: (line) => line === "readyok" });
    return this.health();
  }

  async shutdown(): Promise<void> {
    this.#closing = true;
    this.#clearRestartTimer();
    this.#status = "shutting_down";
    this.#rejectWaiters(new Error("Engine supervisor is shutting down"));
    const child = this.#process;
    if (child !== undefined && child.exitCode === null && child.signalCode === null) {
      const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
      this.#send("quit");
      await Promise.race([
        exited,
        new Promise<void>((resolve) => setTimeout(resolve, 1_000)),
      ]);
      if (child.exitCode === null && child.signalCode === null) child.kill();
    }
    this.#disposeProcess(child);
    this.#status = "stopped";
    this.#transcript.push("lifecycle", "stopped");
  }

  #send(line: string): void {
    const child = this.#process;
    if (child === undefined || !child.stdin.writable) {
      throw engineUnavailable(this.#spec.id, this.#nextBackoffMs());
    }
    this.#transcript.push("sent", line);
    child.stdin.write(`${line}\n`);
  }

  #exchange(
    command: string,
    predicate: (line: string) => boolean,
    timeoutMs: number,
  ): Promise<readonly string[]> {
    const response = this.#waitFor(predicate, timeoutMs);
    this.#send(command);
    return response;
  }

  #waitFor(
    predicate: (line: string) => boolean,
    timeoutMs: number,
  ): Promise<readonly string[]> {
    positiveDuration(timeoutMs, "UCI request timeout");
    return new Promise((resolve, reject) => {
      const waiter: LineWaiter = {
        lines: [],
        predicate,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.#waiters.delete(waiter);
          reject(
            engineUnavailable(
              this.#spec.id,
              this.#nextBackoffMs(),
              new Error(`UCI response timed out after ${timeoutMs} ms`),
            ),
          );
        }, timeoutMs),
      };
      this.#waiters.add(waiter);
    });
  }

  #receive(line: string): void {
    this.#transcript.push("received", line);
    for (const waiter of [...this.#waiters]) {
      waiter.lines.push(line);
      let complete: boolean;
      try {
        complete = waiter.predicate(line);
      } catch (error) {
        clearTimeout(waiter.timer);
        this.#waiters.delete(waiter);
        waiter.reject(error instanceof Error ? error : new Error(String(error)));
        continue;
      }
      if (!complete) continue;
      clearTimeout(waiter.timer);
      this.#waiters.delete(waiter);
      waiter.resolve(Object.freeze([...waiter.lines]));
    }
  }

  #failed(child: ChildProcessWithoutNullStreams, error: Error): void {
    if (child !== this.#process) return;
    this.#lastError = error.message;
    this.#transcript.push("lifecycle", error.message);
    this.#disposeProcess(child);
    this.#rejectWaiters(engineUnavailable(this.#spec.id, this.#nextBackoffMs(), error));
    if (this.#closing) return;
    this.#status = "unavailable";
    this.#scheduleRestart();
  }

  #disposeProcess(child: ChildProcessWithoutNullStreams | undefined): void {
    if (child !== undefined && child === this.#process) this.#process = undefined;
    this.#stdout?.close();
    this.#stderr?.close();
    this.#stdout = undefined;
    this.#stderr = undefined;
  }

  #rejectWaiters(error: Error): void {
    for (const waiter of this.#waiters) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.#waiters.clear();
  }

  #nextBackoffMs(): number {
    return Math.min(
      this.#backoff.initialMs * 2 ** this.#restartAttempt,
      this.#backoff.maximumMs,
    );
  }

  #scheduleRestart(): void {
    if (
      this.#closing ||
      this.#restartTimer !== undefined ||
      this.#restartAttempt >= this.#backoff.maximumAttempts
    ) {
      return;
    }
    const delay = this.#nextBackoffMs();
    this.#restartAttempt += 1;
    this.#status = "restarting";
    this.#transcript.push("lifecycle", `restart scheduled in ${delay} ms`);
    this.#restartTimer = setTimeout(() => {
      this.#restartTimer = undefined;
      this.#restartCount += 1;
      void this.start().catch(() => undefined);
    }, delay);
  }

  #clearRestartTimer(): void {
    if (this.#restartTimer !== undefined) clearTimeout(this.#restartTimer);
    this.#restartTimer = undefined;
  }
}

function abortError(): Error {
  const error = new Error("Engine request aborted");
  error.name = "AbortError";
  return error;
}

function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === "AbortError";
}

export class EngineSupervisor {
  readonly #engines: ReadonlyMap<string, ManagedUciEngine>;

  constructor(specs: readonly EngineSpec[]) {
    const engines = new Map<string, ManagedUciEngine>();
    for (const spec of specs) {
      if (engines.has(spec.id)) throw new TypeError(`Duplicate engine id: ${spec.id}`);
      engines.set(spec.id, new ManagedUciEngine(spec));
    }
    this.#engines = engines;
  }

  async start(engineId: string): Promise<EngineIdentity> {
    return this.#engine(engineId).start();
  }

  async startAll(): Promise<readonly EngineIdentity[]> {
    return Promise.all([...this.#engines.values()].map((engine) => engine.start()));
  }

  execute(engineId: string, request: EngineRequest): Promise<readonly string[]> {
    return this.#engine(engineId).execute(request);
  }

  checkHealth(engineId: string): Promise<EngineHealth> {
    return this.#engine(engineId).checkReady();
  }

  health(engineId: string): EngineHealth {
    return this.#engine(engineId).health();
  }

  transcript(engineId: string): readonly TranscriptEntry[] {
    return this.#engine(engineId).transcript();
  }

  async shutdown(): Promise<void> {
    await Promise.all([...this.#engines.values()].map((engine) => engine.shutdown()));
  }

  #engine(engineId: string): ManagedUciEngine {
    const engine = this.#engines.get(engineId);
    if (engine === undefined) throw engineUnavailable(engineId, 0);
    return engine;
  }
}
