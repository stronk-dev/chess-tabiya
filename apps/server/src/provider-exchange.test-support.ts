/**
 * Test-only provider fixtures: deterministic clocks, a controllable fetch and a scripted engine.
 * Imported only by provider *.test.ts files (never by production; census in the value-authority gate).
 */
import { digestEngineBinary, exactLegalMoves, providerUtf8 } from "@chess-tabiya/runtime";

import type { EngineExchangeCapture, EngineExchangeRequest, EngineHealth, EngineIdentity } from "./engine-supervisor.js";
import type { ProviderTimers } from "./provider-exchange.js";
import type { ProviderEngineClient, ProviderFetch } from "./provider-operations.js";

// ---------------------------------------------------------------------------------------------
// Deterministic clocks and providers
// ---------------------------------------------------------------------------------------------

export class ManualClock implements ProviderTimers {
  monotonic = 0;
  wallMs = Date.parse("2026-09-24T12:00:00.000Z");
  #timers: { at: number; seq: number; callback: () => void }[] = [];
  #seq = 0;
  set(callback: () => void, delayMs: number): unknown {
    const timer = { at: this.monotonic + Math.max(0, delayMs), seq: this.#seq++, callback };
    this.#timers.push(timer);
    return timer;
  }
  clear(handle: unknown): void {
    this.#timers = this.#timers.filter((timer) => timer !== handle);
  }
  async advance(ms: number): Promise<void> {
    const target = this.monotonic + ms;
    for (;;) {
      const due = this.#timers.filter((timer) => timer.at <= target).sort((a, b) => a.at - b.at || a.seq - b.seq)[0];
      if (due === undefined) break;
      this.#timers = this.#timers.filter((timer) => timer !== due);
      this.monotonic = Math.max(this.monotonic, due.at);
      due.callback();
      await flush();
    }
    this.monotonic = target;
    await flush();
  }
  wall = (): string => new Date(this.wallMs).toISOString();
  now = (): number => this.monotonic;
}

export const flush = async (): Promise<void> => {
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
};

interface PendingFetch { readonly url: string; readonly signal: AbortSignal; resolve(response: Response): void; reject(error: unknown): void }

export class ControlledFetch {
  readonly calls: PendingFetch[] = [];
  readonly fetch: ProviderFetch = (url, init) => new Promise<Response>((resolve, reject) => {
    const call = { url, signal: init.signal, resolve, reject };
    this.calls.push(call);
    init.signal.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    }, { once: true });
  });
  respond(index: number, body: unknown, init: { status?: number; etag?: string | null; headers?: Record<string, string> } = {}): void {
    const headers = new Headers(init.headers ?? {});
    if (init.etag !== null) headers.set("etag", init.etag ?? "\"fixture\"");
    this.calls[index]!.resolve(new Response(typeof body === "string" ? body : JSON.stringify(body), { status: init.status ?? 200, headers }));
  }
}

export function syzygyBody(fen: string): unknown {
  return {
    category: "win", dtz: 5, precise_dtz: 5,
    moves: exactLegalMoves(fen).map((move) => ({ uci: `${move.from}${move.to}${move.promotion === undefined ? "" : move.uci[4]}`, san: move.uci, category: "loss", dtz: -4, precise_dtz: -4 })),
  };
}

/** A scripted UCI engine behind the `ProviderEngineClient` surface. */
export class FakeEngines implements ProviderEngineClient {
  generation = 1;
  version = "19";
  calls: EngineExchangeRequest[] = [];
  respond: (request: EngineExchangeRequest) => readonly string[] = (request) => stockfishDepthLines(request);
  maiaOptions = [
    { name: "Elo", type: "spin" as const, default: "1500", min: 1000, max: 2600 },
    { name: "MultiPV", type: "spin" as const, default: "1", min: 1, max: 64 },
    { name: "Temperature", type: "spin" as const, default: "1", min: 0, max: 5 },
    { name: "TopP", type: "spin" as const, default: "1", min: 0, max: 1 },
  ];
  containerCaptured = true;
  identity(engineId: string): EngineIdentity {
    return engineId === "maia-5m"
      ? Object.freeze({ id: "maia-5m", kind: "opponent", name: "Maia3", version: "1e13597c42d4858b7cfd7cfdae01e297263364b2", modelId: "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe", seedHonored: false, eloHonored: true })
      : Object.freeze({ id: "stockfish-analysis", kind: "judge", name: "Stockfish", version: this.version, seedHonored: false, eloHonored: false });
  }
  async start(engineId: string): Promise<EngineIdentity> { return this.identity(engineId); }
  health(engineId: string): EngineHealth {
    return Object.freeze({ id: engineId, status: "ready", restartCount: 0, identity: this.identity(engineId), options: engineId === "maia-5m" ? this.maiaOptions : [], ...(engineId === "maia-5m" ? { bandOption: "Elo", bandRange: { min: 1000, max: 2400 } } : {}) });
  }
  establishedGeneration(): number | null { return this.generation; }
  async exchange(engineId: string, request: EngineExchangeRequest): Promise<EngineExchangeCapture> {
    this.calls.push(request);
    if (request.signal?.aborted) throw Object.assign(new Error("aborted"), { name: "AbortError" });
    const lines = this.respond(request);
    return Object.freeze({
      generation: this.generation,
      identity: this.identity(engineId),
      optionImage: { advertisedUciOptionLines: [], appliedSetoptionCommands: [] },
      optionImageDigest: `sha256:${"a".repeat(64)}` as never,
      artifact: engineId === "maia-5m"
        ? (this.containerCaptured ? { kind: "container" as const, containerDigest: `sha256:${"c".repeat(64)}` as never } : null)
        : { kind: "binary" as const, binaryDigest: digestEngineBinary(providerUtf8("fake stockfish")) },
      options: engineId === "maia-5m" ? this.maiaOptions : [],
      transcript: [...request.commands.map((command) => `> ${command}`), ...lines.map((line) => `< ${line}`)],
    });
  }
}

/** Depth-bound single-line or all-legal MultiPV lines, derived from the command image itself. */
export function stockfishDepthLines(request: EngineExchangeRequest): readonly string[] {
  const fen = request.commands.find((command) => command.startsWith("position fen "))!.slice("position fen ".length);
  const go = request.commands.find((command) => command.startsWith("go "))!;
  const depth = Number(/go depth (\d+)/u.exec(go)?.[1] ?? 10);
  const multipv = Number(request.commands.find((command) => command.startsWith("setoption name MultiPV value "))!.split(" ").at(-1));
  const moves = exactLegalMoves(fen).map((move) => `${move.from}${move.to}${move.promotion === undefined ? "" : move.uci[4]}`);
  if (multipv === 1) return [`info depth ${depth} multipv 1 score cp 17 wdl 310 600 90 pv ${moves[0]}`, `bestmove ${moves[0]}`];
  return [...moves.map((move, index) => `info depth ${depth} multipv ${index + 1} score cp ${10 - index} pv ${move}`), `bestmove ${moves[0]}`];
}
