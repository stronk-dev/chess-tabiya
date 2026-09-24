/**
 * The six operation-keyed response parsers (rfc/provider-exchange-and-execution.md §§3, 5–8).
 *
 * A descriptor returns only raw capture bytes; the scheduler — and, on reload, the durable parser —
 * runs exactly one of these over those bytes plus the sealed requested identity. A parser either
 * returns the typed payload or throws `ProviderResponseInvalid`, which the exchange reports as the
 * closed `invalid_response` reason. No parser grades, recommends or infers intent.
 *
 * UCI captures are the task transcript: one line per exchanged line, `> ` for a command the
 * descriptor sent and `< ` for an engine line, UTF-8, joined by `\n`, ending at the task's first
 * `bestmove`. HTTP captures are the exact response body.
 */
import { makeSan } from "chessops/san";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";

import { positionFromFen, transposeKey } from "./chess.js";
import { exactLegalMoves, exactMoveIdentity } from "./legal-moves.js";
import { maiaCommandImage, maiaReachedFen, playIdentity } from "./provider-requests.js";
import {
  SYZYGY_TABLEBASE_CATEGORIES,
  type ExplorerHistoryRow,
  type ExplorerMoveRow,
  type ExplorerPositionPage,
  type ExplorerReportedHistory,
  type ExplorerReportedOpening,
  type FixedBoundPositionEvaluation,
  type FixedBoundPrincipalVariation,
  type LegalRootScore,
  type LiveSyzygyPosition,
  type MaiaPolicyPage,
  type ProviderExecutionCapture,
  type ProviderOperationId,
  type ProviderOperationResultMap,
  type ProviderRequestedIdentityMap,
  type ProviderResponseParserIdMap,
  type StockfishLegalRootTable,
  type SyzygyTablebaseCategory,
  type SyzygyTablebaseMove,
} from "./provider-types.js";

export class ProviderResponseInvalid extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = "ProviderResponseInvalid";
  }
}

const bad = (message: string): never => { throw new ProviderResponseInvalid(message); };
const decoder = new TextDecoder("utf-8", { fatal: true });

export interface ProviderResponseParser<K extends ProviderOperationId> {
  readonly operation: K;
  readonly id: ProviderResponseParserIdMap[K];
  parse(capture: ProviderExecutionCapture<K>, requested: ProviderRequestedIdentityMap[K]): ProviderOperationResultMap[K];
}

export type ProviderResponseParsers = { readonly [K in ProviderOperationId]: ProviderResponseParser<K> };

// ---------------------------------------------------------------------------------------------
// UCI transcript reading
// ---------------------------------------------------------------------------------------------

interface UciTask {
  readonly sent: readonly string[];
  /** Engine lines after the final sent command, excluding the terminating bestmove. */
  readonly output: readonly string[];
  readonly bestmove: string;
}

function readUciTask(capture: ProviderExecutionCapture<ProviderOperationId>, expectedCommands: readonly string[]): UciTask {
  if (capture.contentEncoding !== "uci-utf8" || capture.transport !== null) bad("a UCI capture must be uci-utf8 with no transport");
  let text: string;
  try {
    text = decoder.decode(capture.responseBytes);
  } catch {
    return bad("UCI transcript is not UTF-8");
  }
  const lines = text.split("\n");
  const sent: string[] = [];
  const output: string[] = [];
  let bestmove: string | undefined;
  for (const line of lines) {
    if (bestmove !== undefined) bad("output after bestmove");
    if (line.startsWith("> ")) {
      if (output.length > 0) bad("a command was sent after engine output began");
      sent.push(line.slice(2));
    } else if (line.startsWith("< ")) {
      const received = line.slice(2);
      if (sent.length < expectedCommands.length) continue; // prior/handshake lines are ineligible
      if (/^bestmove(?:\s|$)/u.test(received)) bestmove = received;
      else output.push(received);
    } else {
      bad(`malformed transcript line ${JSON.stringify(line.slice(0, 40))}`);
    }
  }
  if (sent.length !== expectedCommands.length || sent.some((command, index) => command !== expectedCommands[index])) bad("the transcript's commands are not the requested command image");
  if (bestmove === undefined) bad("the task did not reach bestmove");
  return { sent, output, bestmove: bestmove! };
}

const token = (line: string, name: string): string | undefined => new RegExp(`(?:^|\\s)${name} (\\S+)`, "u").exec(line)?.[1];

function safeInt(value: string | undefined, label: string): number {
  if (value === undefined || !/^-?\d+$/u.test(value)) return bad(`malformed ${label}`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) bad(`unsafe ${label}`);
  return parsed;
}

interface ScoreLine {
  readonly depth: number;
  readonly multipv: number | null;
  readonly bounded: boolean;
  readonly score: { readonly kind: "cp"; readonly value: number } | { readonly kind: "mate"; readonly value: number } | null;
  readonly pv: readonly string[] | null;
  readonly wdl: readonly [number, number, number] | null;
  readonly policy: number | null;
}

function scoreLine(line: string): ScoreLine | null {
  if (!line.startsWith("info ")) return null;
  if (token(line, "depth") === undefined) return null;
  const depth = safeInt(token(line, "depth"), "depth");
  const multipvToken = token(line, "multipv");
  const multipv = multipvToken === undefined ? null : safeInt(multipvToken, "multipv");
  const scoreMatch = /(?:^|\s)score (cp|mate) (\S+)/u.exec(line);
  let score: ScoreLine["score"] = null;
  if (scoreMatch !== null) {
    const value = safeInt(scoreMatch[2], "score");
    if (scoreMatch[1] === "mate" && value === 0) bad("zero-distance mate score");
    score = scoreMatch[1] === "cp" ? { kind: "cp", value } : { kind: "mate", value };
  } else if (/(?:^|\s)score(?:\s|$)/u.test(line)) {
    bad("malformed score");
  }
  const pvMatch = /(?:^|\s)pv ((?:\S+ ?)+)$/u.exec(line);
  const pv = pvMatch === null ? null : pvMatch[1]!.trim().split(" ");
  let wdl: ScoreLine["wdl"] = null;
  if (/(?:^|\s)wdl(?:\s|$)/u.test(line)) {
    const match = /(?:^|\s)wdl (\S+) (\S+) (\S+)/u.exec(line);
    if (match === null) return bad("malformed WDL");
    const values = [safeInt(match[1], "WDL"), safeInt(match[2], "WDL"), safeInt(match[3], "WDL")] as const;
    if (values.some((value) => value < 0 || value > 1000) || values[0] + values[1] + values[2] !== 1000) bad("WDL is not three integers in [0,1000] summing to 1000");
    wdl = values;
  }
  const policyToken = token(line, "policy");
  let policy: number | null = null;
  if (policyToken !== undefined) {
    policy = Number(policyToken);
    if (!/^[0-9]+(?:\.[0-9]+)?(?:e[+-]?\d+)?$/iu.test(policyToken) || !Number.isFinite(policy) || policy < 0 || policy > 1) bad(`invalid policy mass ${policyToken}`);
  }
  return { depth, multipv, bounded: /(?:^|\s)(?:upperbound|lowerbound)(?:\s|$)/u.test(line), score, pv, wdl, policy };
}

function normalizePv(fen: string, pv: readonly string[]): readonly string[] {
  const out: string[] = [];
  let current = fen;
  for (const move of pv) {
    let identity: string;
    try {
      identity = exactMoveIdentity(current, move);
    } catch {
      return bad(`illegal PV move ${move}`);
    }
    out.push(identity);
    current = playIdentity(current, identity);
  }
  return Object.freeze(out);
}

// ---------------------------------------------------------------------------------------------
// §5 Stockfish legal-root table
// ---------------------------------------------------------------------------------------------

function parseLegalRootTable(capture: ProviderExecutionCapture<"stockfish.legal_root_table@1">, requested: ProviderRequestedIdentityMap["stockfish.legal_root_table@1"]): StockfishLegalRootTable {
  const task = readUciTask(capture, requested.command.commands);
  const { fen } = requested.request;
  const depth = requested.request.bound.value;
  const legal = exactLegalMoves(fen).map((move) => move.uci);
  const width = legal.length;
  const final = new Map<number, ScoreLine>();
  for (const line of task.output) {
    const parsed = scoreLine(line);
    if (parsed === null || parsed.depth !== depth) continue;
    if (parsed.score === null && parsed.pv === null) continue;
    if (parsed.score !== null && parsed.pv === null) bad("a score without a PV");
    if (parsed.score === null && parsed.pv !== null) bad("a PV without a score");
    const index = parsed.multipv ?? (width === 1 ? 1 : bad("a MultiPV root line omitted its index"));
    if (index < 1 || index > width) bad(`unknown MultiPV index ${index}`);
    if (parsed.bounded) {
      final.delete(index);
      continue;
    }
    final.set(index, parsed);
  }
  const rows = [];
  const seen = new Set<string>();
  for (let index = 1; index <= width; index += 1) {
    const line = final.get(index) ?? bad(`incomplete root table: MultiPV ${index} has no exact completed line at depth ${depth}`);
    const pv = normalizePv(fen, line.pv!);
    const moveUci = pv[0]!;
    if (seen.has(moveUci)) bad(`duplicate root move ${moveUci}`);
    seen.add(moveUci);
    const score: LegalRootScore = line.score!.kind === "cp"
      ? Object.freeze({ kind: "centipawns", value: line.score!.value })
      : Object.freeze({ kind: "mate", outcome: line.score!.value > 0 ? "root_mates" : "root_is_mated", distance: Math.abs(line.score!.value), unit: "moves" });
    rows.push(Object.freeze({ moveUci, reachedDepth: line.depth, score, pv }));
  }
  if (seen.size !== legal.length || legal.some((move) => !seen.has(move))) bad("root rows are not set-equal to the exact legal moves");
  return Object.freeze({ request: requested.request, scoreFrame: "root_side_to_move", rows: Object.freeze(rows) });
}

// ---------------------------------------------------------------------------------------------
// §5.1 Fixed-bound position evaluation
// ---------------------------------------------------------------------------------------------

function parsePositionEvaluation(capture: ProviderExecutionCapture<"stockfish.position_evaluation@1">, requested: ProviderRequestedIdentityMap["stockfish.position_evaluation@1"]): FixedBoundPositionEvaluation {
  const task = readUciTask(capture, requested.command.commands);
  const { fen, bound } = requested.request;
  let selected: ScoreLine | undefined;
  for (const line of task.output) {
    const parsed = scoreLine(line);
    if (parsed === null || parsed.score === null) continue;
    if (parsed.multipv !== null && parsed.multipv !== 1) bad(`MultiPV ${parsed.multipv} in a single-line evaluation`);
    if (parsed.bounded || parsed.wdl === null) continue; // inadmissible: never selected, never combined
    if (bound.kind === "depth") {
      if (parsed.depth === bound.requestedDepth) selected = parsed;
    } else if (selected === undefined || parsed.depth >= selected.depth) {
      selected = parsed;
    }
  }
  if (selected === undefined) return bad(bound.kind === "depth" ? `no exact completed line with WDL at depth ${bound.requestedDepth}` : "no exact completed line with WDL");
  const whiteToMove = fen.split(" ")[1] === "w";
  const score = selected.score!;
  const actual = capture.actualIdentity;
  return Object.freeze({
    fen,
    positionKey: transposeKey(fen),
    perspective: "white",
    score: score.kind === "cp"
      ? Object.freeze({ kind: "centipawns", value: whiteToMove ? score.value : -score.value || 0 })
      : Object.freeze({ kind: "mate", side: (score.value > 0) === whiteToMove ? "white" : "black", distance: Math.abs(score.value), unit: "moves" }),
    rawWdl: Object.freeze({ subject: "side_to_move", win: selected.wdl![0], draw: selected.wdl![1], loss: selected.wdl![2] }),
    engine: Object.freeze({ id: actual.id, name: actual.name, version: actual.version }),
    bound: bound.kind === "movetime"
      ? Object.freeze({ kind: "movetime", requestedMs: bound.requestedMs, reachedDepth: selected.depth })
      : bound.kind === "depth"
        ? Object.freeze({ kind: "depth", requestedDepth: bound.requestedDepth, reachedDepth: selected.depth })
        : Object.freeze({ kind: "nodes", requestedNodes: bound.requestedNodes, reachedDepth: selected.depth }),
  });
}

// ---------------------------------------------------------------------------------------------
// §5.2 Fixed-bound principal variation
// ---------------------------------------------------------------------------------------------

/**
 * The same task-local reducer and selection rule as §5.1 (last admissible line at exactly the
 * requested depth; otherwise greatest depth, ties to the latest arrival), over lines that carry a
 * completed score AND a PV on the same line. The PV is legal-normalized from the requested FEN and
 * truncated to `maxPlies`; the score only marks a completed iteration and is not retained.
 */
function parsePrincipalVariation(capture: ProviderExecutionCapture<"stockfish.principal_variation@1">, requested: ProviderRequestedIdentityMap["stockfish.principal_variation@1"]): FixedBoundPrincipalVariation {
  const task = readUciTask(capture, requested.command.commands);
  const { fen, bound, maxPlies } = requested.request;
  let selected: ScoreLine | undefined;
  for (const line of task.output) {
    const parsed = scoreLine(line);
    if (parsed === null || parsed.score === null) continue;
    if (parsed.multipv !== null && parsed.multipv !== 1) bad(`MultiPV ${parsed.multipv} in a single-line principal variation`);
    if (parsed.bounded || parsed.pv === null) continue; // inadmissible: never selected, never combined
    if (bound.kind === "depth") {
      if (parsed.depth === bound.requestedDepth) selected = parsed;
    } else if (selected === undefined || parsed.depth >= selected.depth) {
      selected = parsed;
    }
  }
  if (selected === undefined) return bad(bound.kind === "depth" ? `no exact completed line with a PV at depth ${bound.requestedDepth}` : "no exact completed line with a PV");
  const pv = normalizePv(fen, selected.pv!);
  if (pv.length === 0) bad("an empty principal variation");
  const actual = capture.actualIdentity;
  return Object.freeze({
    fen,
    positionKey: transposeKey(fen),
    engine: Object.freeze({ id: actual.id, name: actual.name, version: actual.version }),
    bound: bound.kind === "movetime"
      ? Object.freeze({ kind: "movetime", requestedMs: bound.requestedMs, reachedDepth: selected.depth })
      : bound.kind === "depth"
        ? Object.freeze({ kind: "depth", requestedDepth: bound.requestedDepth, reachedDepth: selected.depth })
        : Object.freeze({ kind: "nodes", requestedNodes: bound.requestedNodes, reachedDepth: selected.depth }),
    maxPlies,
    movesUci: Object.freeze(pv.slice(0, maxPlies)),
    truncated: pv.length > maxPlies,
  });
}

// ---------------------------------------------------------------------------------------------
// §6 Maia policy page
// ---------------------------------------------------------------------------------------------

function parseMaiaPolicyPage(capture: ProviderExecutionCapture<"maia.policy_page@1">, requested: ProviderRequestedIdentityMap["maia.policy_page@1"]): MaiaPolicyPage {
  const { request } = requested;
  const task = readUciTask(capture, maiaCommandImage(request));
  const eloCommand = task.sent.find((command) => command.startsWith("setoption name Elo value "));
  const appliedBand = safeInt(eloCommand?.slice("setoption name Elo value ".length), "applied band");
  if (appliedBand !== request.band) bad("applied band differs from the requested band");
  const fen = maiaReachedFen(request.position);
  const byIndex = new Map<number, ScoreLine>();
  for (const line of task.output) {
    const parsed = scoreLine(line);
    if (parsed === null || parsed.pv === null) continue;
    const index = parsed.multipv ?? bad("a Maia candidate line omitted its MultiPV index");
    if (index < 1 || index > request.requestedWidth) bad(`unknown MultiPV index ${index}`);
    if (parsed.policy === null) bad("a Maia candidate line omitted its policy mass");
    byIndex.set(index, parsed);
  }
  const candidates: { moveUci: string; probability: number }[] = [];
  const seen = new Set<string>();
  for (const index of [...byIndex.keys()].sort((a, b) => a - b)) {
    const line = byIndex.get(index)!;
    let moveUci: string;
    try {
      moveUci = exactMoveIdentity(fen, line.pv![0]!);
    } catch {
      return bad(`illegal Maia candidate ${line.pv![0]}`);
    }
    if (seen.has(moveUci)) bad(`duplicate Maia candidate ${moveUci}`);
    seen.add(moveUci);
    candidates.push(Object.freeze({ moveUci, probability: line.policy! }));
  }
  if (candidates.length === 0) bad("Maia returned no candidates");
  const mass = candidates.reduce((sum, candidate) => sum + candidate.probability, 0);
  if (!Number.isFinite(mass) || mass < 0 || mass > 1 + 1e-9) bad(`returned probability mass ${mass} is outside [0,1]`);
  return Object.freeze({
    request,
    appliedBand,
    temperature: request.temperature,
    topP: request.topP,
    requestedWidth: request.requestedWidth,
    returnedWidth: candidates.length,
    returnedProbabilityMass: mass,
    coverage: "bounded_top_k",
    candidates: Object.freeze(candidates),
  });
}

// ---------------------------------------------------------------------------------------------
// HTTP bodies
// ---------------------------------------------------------------------------------------------

function httpJson(capture: ProviderExecutionCapture<"syzygy.position@1" | "lichess_explorer.position_page@1">): Readonly<Record<string, unknown>> {
  if (capture.contentEncoding !== "http-body" || capture.transport === null || capture.transport.statusCode !== 200) bad("an HTTP capture must be a status-200 http-body");
  let value: unknown;
  try {
    value = JSON.parse(decoder.decode(capture.responseBytes));
  } catch {
    return bad("HTTP body is not UTF-8 JSON");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) bad("HTTP body is not a JSON object");
  return value as Readonly<Record<string, unknown>>;
}

const count = (value: unknown, label: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return bad(`${label} is not a non-negative safe integer`);
  return value;
};

const nullableFinite = (value: unknown, label: string): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return bad(`${label} is not finite`);
  return value;
};

// §7 Syzygy -------------------------------------------------------------------------------------

function syzygyCategory(value: unknown): SyzygyTablebaseCategory {
  if (typeof value !== "string" || !(SYZYGY_TABLEBASE_CATEGORIES as readonly string[]).includes(value)) return bad(`unknown tablebase category ${String(value)}`);
  return value as SyzygyTablebaseCategory;
}

function parseSyzygyPosition(capture: ProviderExecutionCapture<"syzygy.position@1">, requested: ProviderRequestedIdentityMap["syzygy.position@1"]): LiveSyzygyPosition {
  const body = httpJson(capture);
  const { fen } = requested.request;
  if (!Array.isArray(body.moves)) bad("tablebase response omitted moves");
  const legal = new Set(exactLegalMoves(fen).map((move) => move.uci));
  const seen = new Set<string>();
  const moves: SyzygyTablebaseMove[] = (body.moves as readonly unknown[]).map((raw) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return bad("tablebase move is not an object");
    const move = raw as Readonly<Record<string, unknown>>;
    if (typeof move.uci !== "string" || typeof move.san !== "string") return bad("tablebase move lacks uci/san");
    let uci: string;
    try {
      uci = exactMoveIdentity(fen, move.uci);
    } catch {
      return bad(`tablebase move ${move.uci} is not legal`);
    }
    if (seen.has(uci)) bad(`duplicate tablebase move ${uci}`);
    seen.add(uci);
    return Object.freeze({ uci, san: move.san, category: syzygyCategory(move.category), dtz: nullableFinite(move.dtz, "dtz"), preciseDtz: nullableFinite(move.precise_dtz, "precise_dtz") });
  });
  if (seen.size !== legal.size || [...legal].some((move) => !seen.has(move))) bad("tablebase moves are not set-equal to the exact legal moves");
  return Object.freeze({
    fen,
    position: Object.freeze({ category: syzygyCategory(body.category), dtz: nullableFinite(body.dtz, "dtz"), preciseDtz: nullableFinite(body.precise_dtz, "precise_dtz"), moves: Object.freeze(moves) }),
  });
}

// §8 Explorer -----------------------------------------------------------------------------------

function wdl(value: Readonly<Record<string, unknown>>, label: string): { readonly white: number; readonly draws: number; readonly black: number } {
  return Object.freeze({ white: count(value.white, `${label}.white`), draws: count(value.draws, `${label}.draws`), black: count(value.black, `${label}.black`) });
}

function sumSafe(values: readonly number[], label: string): number {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(total)) bad(`${label} overflows a safe integer`);
  return total;
}

function parseExplorerPositionPage(capture: ProviderExecutionCapture<"lichess_explorer.position_page@1">, requested: ProviderRequestedIdentityMap["lichess_explorer.position_page@1"]): ExplorerPositionPage {
  const body = httpJson(capture);
  const { request } = requested;
  const fen = request.requestFen6;
  const totalsCounts = wdl(body, "totals");
  const total = sumSafe([totalsCounts.white, totalsCounts.draws, totalsCounts.black], "total");
  if (!Array.isArray(body.moves)) bad("explorer response omitted moves");
  const rawMoves = body.moves as readonly unknown[];
  if (rawMoves.length > request.moveWidth) bad("explorer returned more moves than requested");
  const seen = new Set<string>();
  const moves: ExplorerMoveRow[] = rawMoves.map((raw, index) => {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return bad(`moves[${index}] is not an object`);
    const move = raw as Readonly<Record<string, unknown>>;
    if (typeof move.uci !== "string" || typeof move.san !== "string") return bad(`moves[${index}] lacks uci/san`);
    let canonicalUci: string;
    try {
      canonicalUci = exactMoveIdentity(fen, move.uci);
    } catch {
      return bad(`moves[${index}] ${move.uci} is not legal`);
    }
    if (seen.has(canonicalUci)) bad(`duplicate explorer move ${canonicalUci}`);
    seen.add(canonicalUci);
    const position = positionFromFen(fen);
    const canonicalSan = makeSan(position, normalizeMove(position, parseUci(canonicalUci)!));
    const counts = wdl(move, `moves[${index}]`);
    const averageRating = move.averageRating === undefined || move.averageRating === null ? null : count(move.averageRating, `moves[${index}].averageRating`);
    return Object.freeze({ canonicalUci, canonicalSan, providerSan: move.san, averageRating, counts, played: sumSafe([counts.white, counts.draws, counts.black], `moves[${index}] played`) });
  });
  const listed = sumSafe(moves.map((move) => move.played), "listed");
  if (listed > total) bad("listed move population exceeds the position total");
  const opening: ExplorerReportedOpening = body.opening === null || body.opening === undefined
    ? Object.freeze({ kind: "absent" })
    : (() => {
        const value = body.opening as Readonly<Record<string, unknown>>;
        if (typeof value !== "object" || typeof value.eco !== "string" || typeof value.name !== "string") return bad("malformed opening");
        return Object.freeze({ kind: "reported", eco: value.eco, name: value.name });
      })();
  let history: ExplorerReportedHistory;
  if (request.history.kind === "disabled") {
    if (body.history !== undefined) bad("history was returned although it was not requested");
    history = Object.freeze({ kind: "not_requested" });
  } else {
    if (!Array.isArray(body.history)) bad("requested history is missing");
    const rows: ExplorerHistoryRow[] = (body.history as readonly unknown[]).map((raw, index) => {
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return bad(`history[${index}] is not an object`);
      const row = raw as Readonly<Record<string, unknown>>;
      if (typeof row.month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/u.test(row.month)) return bad(`history[${index}] has no YYYY-MM month`);
      const counts = wdl(row, `history[${index}]`);
      return Object.freeze({ period: row.month, counts, played: sumSafe([counts.white, counts.draws, counts.black], `history[${index}] played`) });
    });
    history = Object.freeze({ kind: "reported", rows: Object.freeze(rows) });
  }
  const averageRating = body.averageRating === undefined || body.averageRating === null ? null : count(body.averageRating, "averageRating");
  const source = Object.freeze({ status: capture.transport.statusCode, etag: capture.transport.headers.etag });
  if (total === 0) {
    if (moves.length > 0) bad("a zero population lists moves");
    return Object.freeze({ request, source, result: Object.freeze({ kind: "zero_population", totals: Object.freeze({ white: 0, draws: 0, black: 0, total: 0 }), moves: Object.freeze([]) as readonly [], listed: 0, unlisted: 0, averageRating: null, opening, history }) });
  }
  return Object.freeze({
    request,
    source,
    result: Object.freeze({ kind: "population", totals: Object.freeze({ ...totalsCounts, total }), moves: Object.freeze(moves), listed, unlisted: total - listed, averageRating, opening, history }),
  });
}

// ---------------------------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------------------------

export const PROVIDER_RESPONSE_PARSERS: ProviderResponseParsers = Object.freeze({
  "stockfish.legal_root_table@1": Object.freeze({ operation: "stockfish.legal_root_table@1", id: "parse.stockfish_legal_root_table@1", parse: parseLegalRootTable }),
  "stockfish.position_evaluation@1": Object.freeze({ operation: "stockfish.position_evaluation@1", id: "parse.stockfish_position_evaluation@1", parse: parsePositionEvaluation }),
  "stockfish.principal_variation@1": Object.freeze({ operation: "stockfish.principal_variation@1", id: "parse.stockfish_principal_variation@1", parse: parsePrincipalVariation }),
  "maia.policy_page@1": Object.freeze({ operation: "maia.policy_page@1", id: "parse.maia_policy_page@1", parse: parseMaiaPolicyPage }),
  "syzygy.position@1": Object.freeze({ operation: "syzygy.position@1", id: "parse.syzygy_position@1", parse: parseSyzygyPosition }),
  "lichess_explorer.position_page@1": Object.freeze({ operation: "lichess_explorer.position_page@1", id: "parse.lichess_explorer_position_page@1", parse: parseExplorerPositionPage }),
} satisfies ProviderResponseParsers);
