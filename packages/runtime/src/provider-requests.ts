/**
 * Pure, operation-keyed request normalization (rfc/provider-exchange-and-execution.md §§5–8).
 *
 * One normalizer per operation turns a caller request into the exact requested identity that is
 * hashed, deduplicated and executed. Admission is refuse-only: nothing is clamped or defaulted.
 * Both the server descriptors and the durable save/reload parser use these functions, so a stored
 * delivery reconstructs its request identity with the same bytes the live exchange hashed.
 * Live-engine bounds (advertised Maia options, applied band) are checked by the descriptor.
 */
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { exactLegalMoves, exactMoveIdentity } from "./legal-moves.js";
import { digestProviderCommands } from "./provider-digest.js";
import {
  EXPLORER_RATING_BUCKETS,
  EXPLORER_SPEEDS,
  type ExplorerPositionPageRequest,
  type MaiaPolicyPageRequest,
  type ProviderOperationId,
  type ProviderOperationRequestMap,
  type ProviderRequestedIdentityMap,
  type StockfishLegalRootTableRequest,
  type StockfishPositionEvaluationRequest,
  type StockfishPrincipalVariationRequest,
  type SyzygyOutsideDomain,
  type SyzygyPositionRequest,
} from "./provider-types.js";

/** A request that cannot be admitted; the scheduler surfaces it as INVALID_REQUEST before queueing. */
export class ProviderRequestInvalid extends TypeError {
  readonly code = "INVALID_REQUEST" as const;
  constructor(message: string) {
    super(message);
    this.name = "ProviderRequestInvalid";
  }
}

const invalid = (message: string): never => { throw new ProviderRequestInvalid(message); };
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);
const MAX_PROVIDER_TIMEOUT_MS = 60_000;

function exactKeys(value: unknown, keys: readonly string[], label: string): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) return invalid(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    return invalid(`${label} must have exactly ${expected.join(", ")}`);
  }
  return value;
}

function positiveInteger(value: unknown, label: string, maximum = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > maximum) return invalid(`${label} must be a positive safe integer${maximum === Number.MAX_SAFE_INTEGER ? "" : ` at most ${maximum}`}`);
  return value;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "" || /[\r\n\0]/u.test(value)) return invalid(`${label} must be a non-empty single-line string`);
  return value;
}

function canonicalSixFieldFen(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().split(/\s+/u).length !== 6) return invalid(`${label} must be a six-field FEN`);
  try {
    return canonicalFen(positionFromFen(value));
  } catch {
    return invalid(`${label} is not a legal chess position`);
  }
}

function engineIdentity(value: unknown, label: string): { readonly id: string; readonly version: string } {
  const record = exactKeys(value, ["id", "version"], label);
  return Object.freeze({ id: text(record.id, `${label}.id`), version: text(record.version, `${label}.version`) });
}

function commandIdentity(commands: readonly string[]) {
  const frozen = Object.freeze([...commands]);
  return Object.freeze({ commands: frozen, commandsDigest: digestProviderCommands(frozen) });
}

// ---------------------------------------------------------------------------------------------
// §5 Stockfish
// ---------------------------------------------------------------------------------------------

export function normalizeStockfishLegalRootTableRequest(raw: StockfishLegalRootTableRequest): ProviderRequestedIdentityMap["stockfish.legal_root_table@1"] {
  const record = exactKeys(raw, ["fen", "bound", "requestedWidth", "moveIdentity", "requestedEngine", "timeoutMs"], "stockfish.legal_root_table request");
  const fen = canonicalSixFieldFen(record.fen, "fen");
  const bound = exactKeys(record.bound, ["kind", "value"], "bound");
  if (bound.kind !== "depth") invalid("bound.kind must be depth");
  const depth = positiveInteger(bound.value, "bound.value", 245);
  if (record.requestedWidth !== "all_legal") invalid("requestedWidth must be all_legal");
  if (record.moveIdentity !== "chessops-king-takes-rook@1") invalid("moveIdentity must be chessops-king-takes-rook@1");
  const legal = exactLegalMoves(fen).length;
  if (legal === 0) invalid("the position has no legal root move to measure");
  const request: StockfishLegalRootTableRequest = Object.freeze({
    fen,
    bound: Object.freeze({ kind: "depth", value: depth }),
    requestedWidth: "all_legal",
    moveIdentity: "chessops-king-takes-rook@1",
    requestedEngine: engineIdentity(record.requestedEngine, "requestedEngine"),
    timeoutMs: positiveInteger(record.timeoutMs, "timeoutMs", MAX_PROVIDER_TIMEOUT_MS),
  });
  return Object.freeze({
    request,
    command: commandIdentity([
      "setoption name UCI_ShowWDL value false",
      `setoption name MultiPV value ${legal}`,
      `position fen ${fen}`,
      `go depth ${depth}`,
    ]),
  });
}

export function normalizeStockfishPositionEvaluationRequest(raw: StockfishPositionEvaluationRequest): ProviderRequestedIdentityMap["stockfish.position_evaluation@1"] {
  const record = exactKeys(raw, ["fen", "requestedEngine", "bound", "timeoutMs"], "stockfish.position_evaluation request");
  const fen = canonicalSixFieldFen(record.fen, "fen");
  const { bound, go } = singleLineBound(record.bound);
  if (exactLegalMoves(fen).length === 0) invalid("the position has no legal move to search");
  const request: StockfishPositionEvaluationRequest = Object.freeze({
    fen,
    requestedEngine: engineIdentity(record.requestedEngine, "requestedEngine"),
    bound,
    timeoutMs: positiveInteger(record.timeoutMs, "timeoutMs", MAX_PROVIDER_TIMEOUT_MS),
  });
  return Object.freeze({
    request,
    command: commandIdentity([
      "setoption name MultiPV value 1",
      "setoption name UCI_ShowWDL value true",
      `position fen ${fen}`,
      go,
    ]),
  });
}

/** §5.2: the longest principal variation a request may ask to record. */
export const MAX_PRINCIPAL_VARIATION_PLIES = 32;

/**
 * §5.2 fixed-bound principal variation: the same single-line bound grammar as the evaluation, a
 * refuse-only `maxPlies` in `1..MAX_PRINCIPAL_VARIATION_PLIES`, and WDL off (the line carries no
 * outcome estimate). The command image differs from the evaluation's, so the two never coalesce.
 */
export function normalizeStockfishPrincipalVariationRequest(raw: StockfishPrincipalVariationRequest): ProviderRequestedIdentityMap["stockfish.principal_variation@1"] {
  const record = exactKeys(raw, ["fen", "requestedEngine", "bound", "maxPlies", "timeoutMs"], "stockfish.principal_variation request");
  const fen = canonicalSixFieldFen(record.fen, "fen");
  const { bound, go } = singleLineBound(record.bound);
  if (exactLegalMoves(fen).length === 0) invalid("the position has no legal move to search");
  const request: StockfishPrincipalVariationRequest = Object.freeze({
    fen,
    requestedEngine: engineIdentity(record.requestedEngine, "requestedEngine"),
    bound,
    maxPlies: positiveInteger(record.maxPlies, "maxPlies", MAX_PRINCIPAL_VARIATION_PLIES),
    timeoutMs: positiveInteger(record.timeoutMs, "timeoutMs", MAX_PROVIDER_TIMEOUT_MS),
  });
  return Object.freeze({
    request,
    command: commandIdentity([
      "setoption name MultiPV value 1",
      "setoption name UCI_ShowWDL value false",
      `position fen ${fen}`,
      go,
    ]),
  });
}

function singleLineBound(value: unknown): { readonly bound: StockfishPositionEvaluationRequest["bound"]; readonly go: string } {
  if (!isRecord(value)) invalid("bound must be an object");
  const rawBound = value as Readonly<Record<string, unknown>>;
  let bound: StockfishPositionEvaluationRequest["bound"];
  let go: string;
  if (rawBound.kind === "movetime") {
    exactKeys(rawBound, ["kind", "requestedMs"], "bound");
    const value = positiveInteger(rawBound.requestedMs, "bound.requestedMs", MAX_PROVIDER_TIMEOUT_MS);
    bound = Object.freeze({ kind: "movetime", requestedMs: value });
    go = `go movetime ${value}`;
  } else if (rawBound.kind === "depth") {
    exactKeys(rawBound, ["kind", "requestedDepth"], "bound");
    const value = positiveInteger(rawBound.requestedDepth, "bound.requestedDepth", 245);
    bound = Object.freeze({ kind: "depth", requestedDepth: value });
    go = `go depth ${value}`;
  } else if (rawBound.kind === "nodes") {
    exactKeys(rawBound, ["kind", "requestedNodes"], "bound");
    const value = positiveInteger(rawBound.requestedNodes, "bound.requestedNodes");
    bound = Object.freeze({ kind: "nodes", requestedNodes: value });
    go = `go nodes ${value}`;
  } else {
    return invalid("bound.kind must be movetime, depth or nodes");
  }
  return { bound, go };
}

/** The literal reset every Stockfish operation sends in `finally` before the generation is reused. */
export const STOCKFISH_RESET_COMMANDS = Object.freeze(["setoption name MultiPV value 1", "setoption name UCI_ShowWDL value false"] as const);

// ---------------------------------------------------------------------------------------------
// §6 Maia
// ---------------------------------------------------------------------------------------------

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return invalid(`${label} must be a finite number`);
  return value;
}

/** The FEN the Maia request is evaluated at, after replaying history. */
export function maiaReachedFen(position: MaiaPolicyPageRequest["position"]): string {
  if (position.kind === "exact_fen") return position.fen;
  let fen = canonicalFen(positionFromFen(position.startFen));
  for (const move of position.historyUci) fen = playIdentity(fen, exactMoveIdentity(fen, move));
  return fen;
}

/** The canonical FEN after one exact legal move identity. */
export function playIdentity(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const parsed = parseUci(uci);
  if (parsed === undefined) throw new TypeError(`Invalid move UCI: ${uci}`);
  const move = normalizeMove(position, parsed);
  if (!position.isLegal(move)) throw new TypeError(`Illegal move UCI: ${uci}`);
  position.play(move);
  return canonicalFen(position);
}

export function normalizeMaiaPolicyPageRequest(raw: MaiaPolicyPageRequest): ProviderRequestedIdentityMap["maia.policy_page@1"] {
  const record = exactKeys(raw, ["position", "requestedModel", "band", "temperature", "topP", "requestedWidth", "timeoutMs"], "maia.policy_page request");
  if (!isRecord(record.position)) invalid("position must be an object");
  const rawPosition = record.position as Readonly<Record<string, unknown>>;
  let position: MaiaPolicyPageRequest["position"];
  if (rawPosition.kind === "exact_fen") {
    exactKeys(rawPosition, ["kind", "fen"], "position");
    position = Object.freeze({ kind: "exact_fen", fen: canonicalSixFieldFen(rawPosition.fen, "position.fen") });
  } else if (rawPosition.kind === "history_conditioned") {
    exactKeys(rawPosition, ["kind", "startFen", "historyUci"], "position");
    const startFen = canonicalSixFieldFen(rawPosition.startFen, "position.startFen");
    if (!Array.isArray(rawPosition.historyUci)) invalid("position.historyUci must be an array");
    let fen = startFen;
    const history: string[] = [];
    for (const [index, move] of (rawPosition.historyUci as readonly unknown[]).entries()) {
      if (typeof move !== "string") invalid(`position.historyUci[${index}] must be a UCI string`);
      let identity: string;
      try {
        identity = exactMoveIdentity(fen, move as string);
      } catch {
        return invalid(`position.historyUci[${index}] ${String(move)} is not legal`);
      }
      history.push(identity);
      fen = playIdentity(fen, identity);
    }
    position = Object.freeze({ kind: "history_conditioned", startFen, historyUci: Object.freeze(history) });
  } else {
    return invalid("position.kind must be history_conditioned or exact_fen");
  }
  const temperature = finiteNumber(record.temperature, "temperature");
  if (!(temperature > 0)) invalid("temperature must be greater than zero");
  const topP = finiteNumber(record.topP, "topP");
  if (!(topP > 0 && topP <= 1)) invalid("topP must lie in (0, 1]");
  const requestedWidth = positiveInteger(record.requestedWidth, "requestedWidth");
  const legal = exactLegalMoves(maiaReachedFen(position)).length;
  if (requestedWidth > legal) invalid(`requestedWidth ${requestedWidth} exceeds the ${legal} legal moves`);
  const request: MaiaPolicyPageRequest = Object.freeze({
    position,
    requestedModel: engineIdentity(record.requestedModel, "requestedModel"),
    band: positiveInteger(record.band, "band"),
    temperature,
    topP,
    requestedWidth,
    timeoutMs: positiveInteger(record.timeoutMs, "timeoutMs", MAX_PROVIDER_TIMEOUT_MS),
  });
  return Object.freeze({ request });
}

/** Descriptor-owned, literal ordered Maia command image (§6). Decimal spellings are RFC 8785. */
export function maiaCommandImage(request: MaiaPolicyPageRequest): readonly string[] {
  const position = request.position.kind === "exact_fen"
    ? `position fen ${request.position.fen}`
    : `position fen ${request.position.startFen}${request.position.historyUci.length === 0 ? "" : ` moves ${request.position.historyUci.join(" ")}`}`;
  return Object.freeze([
    `setoption name Elo value ${request.band}`,
    `setoption name Temperature value ${JSON.stringify(request.temperature)}`,
    `setoption name TopP value ${JSON.stringify(request.topP)}`,
    `setoption name MultiPV value ${request.requestedWidth}`,
    position,
    "go",
  ]);
}

// ---------------------------------------------------------------------------------------------
// §7 Syzygy
// ---------------------------------------------------------------------------------------------

export function normalizeSyzygyPositionRequest(raw: SyzygyPositionRequest): ProviderRequestedIdentityMap["syzygy.position@1"] {
  const record = exactKeys(raw, ["rules", "variant", "fen", "timeoutMs"], "syzygy.position request");
  if (record.rules !== "chess") invalid("rules must be chess");
  if (record.variant !== "standard") invalid("variant must be standard");
  return Object.freeze({
    request: Object.freeze({
      rules: "chess",
      variant: "standard",
      fen: canonicalSixFieldFen(record.fen, "fen"),
      timeoutMs: positiveInteger(record.timeoutMs, "timeoutMs", MAX_PROVIDER_TIMEOUT_MS),
    }),
  });
}

export function syzygyPieceCount(fen: string): number {
  return [...fen.split(" ", 1)[0]!].filter((char) => /[pnbrqkPNBRQK]/u.test(char)).length;
}

/** The only no-exchange hook: more than seven pieces is a local rules fact, never a provider call. */
export function syzygyPreflight(identity: ProviderRequestedIdentityMap["syzygy.position@1"]): SyzygyOutsideDomain | null {
  const pieceCount = syzygyPieceCount(identity.request.fen);
  return pieceCount > 7 ? Object.freeze({ kind: "outside_domain", reason: "piece_count", pieceCount, maximumPieceCount: 7 }) : null;
}

// ---------------------------------------------------------------------------------------------
// §8 Explorer
// ---------------------------------------------------------------------------------------------

const START_FEN4 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/u;

export function normalizeExplorerPositionPageRequest(raw: ExplorerPositionPageRequest): ProviderRequestedIdentityMap["lichess_explorer.position_page@1"] {
  const record = exactKeys(raw, ["rules", "setupFamily", "variant", "positionFen4", "requestFen6", "ratingBuckets", "speeds", "since", "until", "moveWidth", "history", "topWidth", "recentWidth", "timeoutMs"], "lichess_explorer.position_page request");
  if (record.rules !== "chess") invalid("rules must be chess");
  if (record.variant !== "standard") invalid("variant must be standard");
  const requestFen6 = canonicalSixFieldFen(record.requestFen6, "requestFen6");
  if (requestFen6 !== record.requestFen6) invalid("requestFen6 must already be canonical");
  const fields = requestFen6.split(" ");
  if (fields[4] !== "0" || fields[5] !== "1") invalid("requestFen6 must be positionFen4 plus literal `0 1`");
  const positionFen4 = fields.slice(0, 4).join(" ");
  if (record.positionFen4 !== positionFen4) invalid("positionFen4 must equal the first four fields of requestFen6");
  const family = positionFen4 === START_FEN4 ? "standard_start" : "from_position";
  if (record.setupFamily !== family) invalid(`setupFamily must be ${family} for this position`);
  if (!Array.isArray(record.ratingBuckets) || record.ratingBuckets.length === 0) invalid("ratingBuckets must be a non-empty array");
  const buckets = record.ratingBuckets as readonly unknown[];
  for (const [index, bucket] of buckets.entries()) {
    if (!(EXPLORER_RATING_BUCKETS as readonly unknown[]).includes(bucket)) invalid(`ratingBuckets[${index}] is not a Lichess rating bucket`);
    if (index > 0 && (bucket as number) <= (buckets[index - 1] as number)) invalid("ratingBuckets must be strictly ascending and unique");
  }
  if (!Array.isArray(record.speeds) || record.speeds.length === 0) invalid("speeds must be a non-empty array");
  const speeds = record.speeds as readonly unknown[];
  for (const [index, speed] of speeds.entries()) {
    const rank = (EXPLORER_SPEEDS as readonly unknown[]).indexOf(speed);
    if (rank < 0) invalid(`speeds[${index}] is not an explorer speed`);
    if (index > 0 && rank <= (EXPLORER_SPEEDS as readonly unknown[]).indexOf(speeds[index - 1])) invalid("speeds must be unique and in canonical order");
  }
  const since = record.since === null ? null : typeof record.since === "string" && MONTH.test(record.since) ? record.since : invalid("since must be null or YYYY-MM");
  const until = record.until === null ? null : typeof record.until === "string" && MONTH.test(record.until) ? record.until : invalid("until must be null or YYYY-MM");
  if (since !== null && until !== null && since > until) invalid("since must not be after until");
  const history = exactKeys(record.history, ["kind"], "history");
  if (history.kind !== "disabled" && history.kind !== "requested") invalid("history.kind must be disabled or requested");
  if (record.topWidth !== 0) invalid("topWidth must be 0");
  if (record.recentWidth !== 0) invalid("recentWidth must be 0");
  return Object.freeze({
    request: Object.freeze({
      rules: "chess",
      setupFamily: family,
      variant: "standard",
      positionFen4,
      requestFen6,
      ratingBuckets: Object.freeze([...(buckets as number[])]),
      speeds: Object.freeze([...(speeds as ExplorerPositionPageRequest["speeds"])]),
      since,
      until,
      moveWidth: positiveInteger(record.moveWidth, "moveWidth"),
      history: Object.freeze({ kind: history.kind as "disabled" | "requested" }),
      topWidth: 0,
      recentWidth: 0,
      timeoutMs: positiveInteger(record.timeoutMs, "timeoutMs", MAX_PROVIDER_TIMEOUT_MS),
    }),
  });
}

/** The literal provider URL for one normalized Explorer request (one normalizer, every ingress). */
export function explorerRequestUrl(request: ExplorerPositionPageRequest): string {
  const url = new URL("https://explorer.lichess.org/lichess");
  url.searchParams.set("variant", "standard");
  url.searchParams.set("fen", request.requestFen6);
  url.searchParams.set("ratings", request.ratingBuckets.join(","));
  url.searchParams.set("speeds", request.speeds.join(","));
  if (request.since !== null) url.searchParams.set("since", request.since);
  if (request.until !== null) url.searchParams.set("until", request.until);
  url.searchParams.set("moves", String(request.moveWidth));
  url.searchParams.set("topGames", "0");
  url.searchParams.set("recentGames", "0");
  url.searchParams.set("history", request.history.kind === "requested" ? "true" : "false");
  return url.toString();
}

export function syzygyRequestUrl(request: SyzygyPositionRequest): string {
  return `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(request.fen)}`;
}

// ---------------------------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------------------------

type Normalizers = { readonly [K in ProviderOperationId]: (request: ProviderOperationRequestMap[K]) => ProviderRequestedIdentityMap[K] };

export const PROVIDER_REQUEST_NORMALIZERS: Normalizers = Object.freeze({
  "stockfish.legal_root_table@1": normalizeStockfishLegalRootTableRequest,
  "stockfish.position_evaluation@1": normalizeStockfishPositionEvaluationRequest,
  "stockfish.principal_variation@1": normalizeStockfishPrincipalVariationRequest,
  "maia.policy_page@1": normalizeMaiaPolicyPageRequest,
  "syzygy.position@1": normalizeSyzygyPositionRequest,
  "lichess_explorer.position_page@1": normalizeExplorerPositionPageRequest,
});

export function normalizeProviderRequest<K extends ProviderOperationId>(operation: K, request: ProviderOperationRequestMap[K]): ProviderRequestedIdentityMap[K] {
  const normalizer = PROVIDER_REQUEST_NORMALIZERS[operation] as ((request: ProviderOperationRequestMap[K]) => ProviderRequestedIdentityMap[K]) | undefined;
  if (normalizer === undefined) throw new ProviderRequestInvalid(`Unknown provider operation ${String(operation)}`);
  return normalizer(request);
}
