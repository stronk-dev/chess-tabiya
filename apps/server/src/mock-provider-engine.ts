// Mock-engine deployments only (engineMode "mock": development, CI and browser smoke tests). A
// deterministic stand-in for the `stockfish-analysis` and `maia-5m` UCI processes behind the ONE real
// provider exchange: the scheduler, parser, receipts and seals are the production ones, so Review's
// typed packet and the bot opponent-ply operation run end to end. Both identify themselves as mocks
// ("Mock Stockfish", "Mock Maia"; the Maia container digest is the digest of a labelled mock image,
// never a real OCI image). Mock Maia reports the registered model identity because the shared
// exchange admits only a page whose model equals the request — it is a labelled stand-in for that
// model, never a measurement of it; its policy masses are a fixed geometric ladder over a
// position-seeded move order, not chess judgement.

import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import {
  digestEngineBinary,
  digestEngineContainer,
  digestEngineOptionImage,
  exactLegalMoves,
  providerUtf8,
  sha256Hex,
} from "@chess-tabiya/runtime";

import type { EngineExchangeCapture, EngineExchangeRequest, EngineHealth, EngineIdentity, EngineOption } from "./engine-supervisor.js";
import { MAIA3_BAND_RANGE, MAIA3_MODEL_ID, MAIA3_SOURCE_COMMIT } from "./maia.js";
import type { ProviderEngineClient } from "./provider-operations.js";

const ANALYSIS = "stockfish-analysis";
const MAIA = "maia-5m";
const IDENTITY: EngineIdentity = Object.freeze({ id: ANALYSIS, kind: "judge", name: "Mock Stockfish", version: "mock-1", seedHonored: true });
const OPTION_IMAGE = Object.freeze({ advertisedUciOptionLines: Object.freeze(["option name MultiPV type spin default 1 min 1 max 500", "option name UCI_ShowWDL type check default false"]), appliedSetoptionCommands: Object.freeze([]) });

const MAIA_IDENTITY: EngineIdentity = Object.freeze({ id: MAIA, kind: "opponent", name: "Mock Maia", version: MAIA3_SOURCE_COMMIT, modelId: MAIA3_MODEL_ID, seedHonored: false, eloHonored: true });
const MAIA_OPTIONS: readonly EngineOption[] = Object.freeze([
  Object.freeze({ name: "Elo", type: "spin" as const, default: "1500", min: MAIA3_BAND_RANGE.min, max: MAIA3_BAND_RANGE.max }),
  Object.freeze({ name: "MultiPV", type: "spin" as const, default: "1", min: 1, max: 64 }),
  Object.freeze({ name: "Temperature", type: "spin" as const, default: "1", min: 0, max: 10 }),
  Object.freeze({ name: "TopP", type: "spin" as const, default: "1", min: 0, max: 1 }),
]);
const MAIA_OPTION_IMAGE = Object.freeze({ advertisedUciOptionLines: Object.freeze([
  `option name Elo type spin default 1500 min ${MAIA3_BAND_RANGE.min} max ${MAIA3_BAND_RANGE.max}`,
  "option name MultiPV type spin default 1 min 1 max 64",
  "option name Temperature type spin default 1 min 0 max 10",
  "option name TopP type spin default 1 min 0 max 1",
]), appliedSetoptionCommands: Object.freeze([]) });
const MOCK_DIGEST = (label: string): `sha256:${string}` => `sha256:${sha256Hex(label)}`;
const MAIA_CONTAINER = digestEngineContainer({ runtime: "oci", imageId: "tabiya-mock-maia:labelled-stand-in", manifestDigest: MOCK_DIGEST("tabiya mock maia manifest"), configDigest: MOCK_DIGEST("tabiya mock maia config") });

/** A deterministic, legal, labelled-mock line: up to two plies of each position's first legal move. */
function mockLine(fen: string, first?: string): readonly string[] {
  const line: string[] = [];
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  for (let ply = 0; ply < 2; ply += 1) {
    const move = ply === 0 && first !== undefined ? first : exactLegalMoves(makeFen(position.toSetup()))[0]?.uci;
    if (move === undefined) break;
    line.push(move);
    position.play(normalizeMove(position, parseUci(move)!));
  }
  return line;
}

/** `position fen <fen> [moves …]` → the reached FEN. */
function reachedFen(command: string): string {
  const match = /^position fen (.+?)(?: moves (.*))?$/u.exec(command);
  if (match === null) throw new Error("mock provider engine received an invalid position command");
  if (match[2] === undefined || match[2] === "") return match[1]!;
  const position = Chess.fromSetup(parseFen(match[1]!).unwrap()).unwrap();
  for (const uci of match[2] === undefined || match[2] === "" ? [] : match[2].split(" ")) {
    const move = parseUci(uci);
    if (move === undefined || !position.isLegal(move)) throw new Error(`mock provider engine received an illegal history move ${uci}`);
    position.play(move);
  }
  return makeFen(position.toSetup());
}

const setoption = (commands: readonly string[], name: string): string | undefined =>
  commands.find((command) => command.startsWith(`setoption name ${name} value `))?.slice(`setoption name ${name} value `.length);

export interface MockProviderEngineOptions {
  /** A raw side-to-move score per FEN for single-line searches; the default is level. */
  readonly score?: (fen: string) => { readonly score: string; readonly wdl: readonly [number, number, number] };
  /** A raw root-side score per legal root move for all-legal root tables; the default is `score`. */
  readonly rootScore?: (fen: string, moveUci: string) => string;
  /** Stockfish failure predicate per FEN. */
  readonly fail?: (fen: string) => boolean;
  /** Maia failure predicate per reached FEN; `true` for every position makes Maia unavailable. */
  readonly maiaFail?: (fen: string) => boolean;
  /** Replaces the mock Maia policy masses (move → mass) for one reached FEN. */
  readonly maiaPolicy?: (fen: string, legal: readonly string[]) => readonly (readonly [string, number])[];
}

export class MockProviderEngineClient implements ProviderEngineClient {
  readonly #score: NonNullable<MockProviderEngineOptions["score"]>;
  readonly #rootScore: MockProviderEngineOptions["rootScore"];
  readonly #fail: (fen: string) => boolean;
  readonly #maiaFail: (fen: string) => boolean;
  readonly #maiaPolicy: MockProviderEngineOptions["maiaPolicy"];

  constructor(options: MockProviderEngineOptions = {}) {
    this.#score = options.score ?? (() => ({ score: "cp 0", wdl: [0, 1000, 0] as const }));
    this.#rootScore = options.rootScore;
    this.#fail = options.fail ?? (() => false);
    this.#maiaFail = options.maiaFail ?? (() => false);
    this.#maiaPolicy = options.maiaPolicy;
  }

  async start(engineId: string): Promise<EngineIdentity> {
    if (engineId === ANALYSIS) return IDENTITY;
    if (engineId === MAIA) return MAIA_IDENTITY;
    throw new Error(`mock provider engine serves only ${ANALYSIS} and ${MAIA}`);
  }

  health(engineId: string): EngineHealth {
    if (engineId === ANALYSIS) return Object.freeze({ id: engineId, status: "ready", restartCount: 0, identity: IDENTITY });
    if (engineId === MAIA) return Object.freeze({ id: engineId, status: "ready", restartCount: 0, identity: MAIA_IDENTITY, options: MAIA_OPTIONS, bandOption: "Elo", bandRange: MAIA3_BAND_RANGE });
    return Object.freeze({ id: engineId, status: "unavailable", restartCount: 0 }) as EngineHealth;
  }

  establishedGeneration(engineId: string): number | null {
    return engineId === ANALYSIS || engineId === MAIA ? 1 : null;
  }

  async exchange(engineId: string, request: EngineExchangeRequest): Promise<EngineExchangeCapture> {
    if (request.signal?.aborted === true) throw new Error("aborted");
    if (engineId === MAIA) return this.#maia(request);
    if (engineId !== ANALYSIS) throw new Error(`mock provider engine serves only ${ANALYSIS} and ${MAIA}`);
    const position = request.commands.find((command) => command.startsWith("position fen "));
    const fen = position === undefined ? undefined : reachedFen(position);
    const legal = fen === undefined ? [] : exactLegalMoves(fen).map((move) => move.uci);
    const first = legal[0];
    if (first === undefined) throw new Error("mock provider engine received no searchable position");
    if (this.#fail(fen!)) throw new Error("mock provider engine failure");
    const { score, wdl } = this.#score(fen!);
    // A depth-bounded request completes exactly its requested depth; other bounds report depth 1.
    const depth = Number(/^go depth (\d+)$/u.exec(request.commands.find((command) => command.startsWith("go ")) ?? "")?.[1] ?? 1);
    // WDL only when the request enabled it (the evaluation does; the principal variation does not).
    const showWdl = request.commands.includes("setoption name UCI_ShowWDL value true");
    const multiPv = Number(setoption(request.commands, "MultiPV") ?? 1);
    const lines = multiPv > 1
      // An all-legal root table: one completed line per legal root move, in MultiPV order.
      ? legal.slice(0, multiPv).map((move, index) => `< info depth ${depth} seldepth ${depth} multipv ${index + 1} score ${this.#rootScore?.(fen!, move) ?? score} nodes 1 pv ${mockLine(fen!, move).join(" ")}`)
      : [`< info depth ${depth} seldepth ${depth} multipv 1 score ${score}${showWdl ? ` wdl ${wdl[0]} ${wdl[1]} ${wdl[2]}` : ""} nodes 1 pv ${mockLine(fen!).join(" ")}`];
    const transcript = [...request.commands.map((command) => `> ${command}`), ...lines, `< bestmove ${first}`];
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

  #maia(request: EngineExchangeRequest): EngineExchangeCapture {
    const position = request.commands.find((command) => command.startsWith("position fen "));
    if (position === undefined) throw new Error("mock Maia received no position");
    const fen = reachedFen(position);
    if (this.#maiaFail(fen)) throw new Error("mock Maia failure");
    const legal = exactLegalMoves(fen).map((move) => move.uci);
    if (legal.length === 0) throw new Error("mock Maia received a terminal position");
    const width = Math.max(1, Math.min(Number(setoption(request.commands, "MultiPV") ?? 1), legal.length));
    const rows = this.#maiaPolicy?.(fen, legal) ?? defaultMaiaPolicy(fen, legal, width);
    const lines = rows.map(([move, mass], index) => `< info depth 1 multipv ${index + 1} score cp 0 policy ${mass.toFixed(6)} pv ${move}`);
    return Object.freeze({
      generation: 1,
      identity: MAIA_IDENTITY,
      optionImage: MAIA_OPTION_IMAGE,
      optionImageDigest: digestEngineOptionImage(MAIA_OPTION_IMAGE),
      artifact: Object.freeze({ kind: "container" as const, containerDigest: MAIA_CONTAINER }),
      options: MAIA_OPTIONS,
      transcript: Object.freeze([...request.commands.map((command) => `> ${command}`), ...lines, `< bestmove ${rows[0]![0]}`]),
    });
  }
}

/**
 * A fixed geometric ladder (ratio 0.6) over a position-seeded order of the legal moves, scaled to
 * 0.98 total returned mass. Deterministic per FEN; it encodes no chess judgement.
 */
function defaultMaiaPolicy(fen: string, legal: readonly string[], width: number): readonly (readonly [string, number])[] {
  const ordered = [...legal].sort((left, right) => {
    const a = sha256Hex(`${fen}|${left}`);
    const b = sha256Hex(`${fen}|${right}`);
    return a < b ? -1 : a > b ? 1 : 0;
  }).slice(0, width);
  const weights = ordered.map((_, index) => 0.6 ** index);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return ordered.map((move, index) => [move, Math.floor((weights[index]! / total) * 0.98 * 1e6) / 1e6] as const);
}
