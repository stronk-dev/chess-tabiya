// Mock-engine deployments only (engineMode "mock": development, CI and browser smoke tests). A
// deterministic stand-in for the `stockfish-analysis` UCI process behind the ONE real provider
// exchange: the scheduler, parser, receipts and seals are the production ones, so Review's typed
// packet, durable attachment and presentation run end to end. It identifies itself as a mock
// ("Mock Stockfish"), reports a level score for every position and never serves Maia.

import {
  digestEngineBinary,
  digestEngineOptionImage,
  exactLegalMoves,
  providerUtf8,
} from "@chess-tabiya/runtime";

import type { EngineExchangeCapture, EngineExchangeRequest, EngineHealth, EngineIdentity } from "./engine-supervisor.js";
import type { ProviderEngineClient } from "./provider-operations.js";

const ANALYSIS = "stockfish-analysis";
const IDENTITY: EngineIdentity = Object.freeze({ id: ANALYSIS, kind: "judge", name: "Mock Stockfish", version: "mock-1", seedHonored: true });
const OPTION_IMAGE = Object.freeze({ advertisedUciOptionLines: Object.freeze(["option name MultiPV type spin default 1 min 1 max 500", "option name UCI_ShowWDL type check default false"]), appliedSetoptionCommands: Object.freeze([]) });

export class MockProviderEngineClient implements ProviderEngineClient {
  readonly #score: (fen: string) => { readonly score: string; readonly wdl: readonly [number, number, number] };
  readonly #fail: (fen: string) => boolean;
  /** Tests may supply a raw side-to-move score per FEN and a failure predicate; the default is level. */
  constructor(options: { readonly score?: (fen: string) => { readonly score: string; readonly wdl: readonly [number, number, number] }; readonly fail?: (fen: string) => boolean } = {}) {
    this.#score = options.score ?? (() => ({ score: "cp 0", wdl: [0, 1000, 0] as const }));
    this.#fail = options.fail ?? (() => false);
  }

  async start(engineId: string): Promise<EngineIdentity> {
    if (engineId !== ANALYSIS) throw new Error(`mock provider engine serves only ${ANALYSIS}`);
    return IDENTITY;
  }

  health(engineId: string): EngineHealth {
    return Object.freeze({ id: engineId, status: engineId === ANALYSIS ? "ready" : "unavailable", restartCount: 0, ...(engineId === ANALYSIS ? { identity: IDENTITY } : {}) }) as EngineHealth;
  }

  establishedGeneration(engineId: string): number | null {
    return engineId === ANALYSIS ? 1 : null;
  }

  async exchange(engineId: string, request: EngineExchangeRequest): Promise<EngineExchangeCapture> {
    if (engineId !== ANALYSIS) throw new Error(`mock provider engine serves only ${ANALYSIS}`);
    if (request.signal?.aborted === true) throw new Error("aborted");
    const position = request.commands.find((command) => command.startsWith("position fen "));
    const fen = position?.slice("position fen ".length);
    const first = fen === undefined ? undefined : exactLegalMoves(fen)[0]?.uci;
    if (first === undefined) throw new Error("mock provider engine received no searchable position");
    if (this.#fail(fen!)) throw new Error("mock provider engine failure");
    const { score, wdl } = this.#score(fen!);
    // A depth-bounded request completes exactly its requested depth; other bounds report depth 1.
    const depth = Number(/^go depth (\d+)$/u.exec(request.commands.find((command) => command.startsWith("go ")) ?? "")?.[1] ?? 1);
    const transcript = [
      ...request.commands.map((command) => `> ${command}`),
      `< info depth ${depth} seldepth ${depth} multipv 1 score ${score} wdl ${wdl[0]} ${wdl[1]} ${wdl[2]} nodes 1 pv ${first}`,
      `< bestmove ${first}`,
    ];
    return Object.freeze({
      generation: 1,
      identity: IDENTITY,
      optionImage: OPTION_IMAGE,
      optionImageDigest: digestEngineOptionImage(OPTION_IMAGE),
      artifact: Object.freeze({ kind: "binary" as const, binaryDigest: digestEngineBinary(providerUtf8("tabiya mock stockfish analysis engine")) }),
      options: Object.freeze([]),
      transcript: Object.freeze(transcript),
    });
  }
}
