// rfc/review-map.md §7 / O7.3: the explicit, secondary Analyze action. It reveals the recorded
// engine line for the position before one reviewed move — never in the ordinary map (the Review Map
// projection carries no line at all), and withheld while a retry from that position is open.
//
// Law 8: the line is rendered only as recorded engine output, attributed to the engine and the
// search bound it was requested under, through frozen templates that are not phrased as advice. A
// recorded line without its search bound is not shown. Nothing here grades, ranks or explains.

import { Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";

import { branchPath } from "./branch-path.js";
import { openRetryEntry } from "./review-map.js";
import { reviewText } from "./review-map-templates.js";
import type { DrillRun, Node } from "./types.js";

export type ReviewAnalysis =
  | {
    readonly kind: "line";
    readonly nodeId: string;
    readonly entryNodeId: string;
    /** `bestline` = a recorded principal variation; `search_first_move` = only the search's first move was recorded. */
    readonly source: "bestline" | "search_first_move";
    readonly engineId: string;
    readonly bound: { readonly requestedMovetimeMs: number } | { readonly requestedDepth: number };
    readonly moves: readonly string[];
    readonly sentence: string;
    readonly caveat: string;
  }
  | {
    readonly kind: "none" | "unattributed" | "withheld";
    readonly nodeId: string;
    readonly entryNodeId: string;
    readonly sentence: string;
  };

interface RecordedLine {
  readonly source: "bestline" | "search_first_move";
  readonly engineId: string | undefined;
  readonly values: Readonly<Record<string, unknown>>;
  readonly movesUci: readonly string[];
}

const isRecord = (candidate: unknown): candidate is Readonly<Record<string, unknown>> => typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);

/** The latest recorded engine line at one node: a `bestline` packet first, else an eval packet's search first move. */
function recordedLine(run: DrillRun, nodeId: string): RecordedLine | undefined {
  let bestline: RecordedLine | undefined;
  let firstMove: RecordedLine | undefined;
  for (const event of run.events) {
    if (event.type !== "evidence.attached" || event.data.nodeId !== nodeId) continue;
    const payload = event.data.payload;
    if (payload.source !== "engine_validated" || !isRecord(payload.values)) continue;
    const values = payload.values;
    const engineId = typeof values.engineId === "string" && values.engineId.trim() !== "" ? values.engineId : undefined;
    if (payload.kind === "bestline" && Array.isArray(values.movesUci) && values.movesUci.length > 0 && values.movesUci.every((move) => typeof move === "string")) {
      bestline = { source: "bestline", engineId, values, movesUci: values.movesUci as readonly string[] };
    }
    if (payload.kind === "eval" && typeof values.bestMoveUci === "string") {
      firstMove = { source: "search_first_move", engineId, values, movesUci: [values.bestMoveUci] };
    }
  }
  return bestline ?? firstMove;
}

/** SAN with move numbers from `fen`, or undefined when any recorded move is not legal there. */
function sanLine(fen: string, movesUci: readonly string[]): readonly string[] | undefined {
  const setup = parseFen(fen);
  if (setup.isErr) return undefined;
  const created = Chess.fromSetup(setup.value);
  if (created.isErr) return undefined;
  const position = created.value;
  const out: string[] = [];
  for (const [index, uci] of movesUci.entries()) {
    const parsed = parseUci(uci);
    if (parsed === undefined) return undefined;
    const move = normalizeMove(position, parsed);
    if (!position.isLegal(move)) return undefined;
    const san = makeSan(position, move);
    const number = position.fullmoves;
    out.push(position.turn === "white" ? `${number}. ${san}` : index === 0 ? `${number}… ${san}` : san);
    position.play(move);
  }
  return Object.freeze(out);
}

function moveLabel(entry: Node, node: Node): string {
  const number = Math.max(1, Math.ceil(node.ply / 2));
  return reviewText(entry.fen.split(" ")[1] === "b" ? "moves.row.black" : "moves.row.white", { number, san: node.moveSan ?? node.moveUci ?? "" });
}

/**
 * The Analyze reveal for one reviewed move: the recorded engine line from the position before it.
 * Read-only and recomputed; throws a TypeError when `nodeId` is not a move on the reviewed branch.
 */
export function reviewAnalysis(run: DrillRun, branchId: string, nodeId: string): ReviewAnalysis {
  const path = branchPath(run, branchId);
  const index = path.findIndex((node) => node.id === nodeId);
  if (index < 1) throw new TypeError(`Node ${nodeId} is not a move on branch ${branchId}`);
  const node = path[index]!;
  const entry = path[index - 1]!;
  const move = moveLabel(entry, node);
  const base = { nodeId: node.id, entryNodeId: entry.id };
  if (openRetryEntry(run, branchId) === entry.id) return Object.freeze({ ...base, kind: "withheld" as const, sentence: reviewText("analysis.withheld", { move }) });
  const recorded = recordedLine(run, entry.id);
  const moves = recorded === undefined ? undefined : sanLine(entry.fen, recorded.movesUci);
  if (recorded === undefined || moves === undefined) return Object.freeze({ ...base, kind: "none" as const, sentence: reviewText("analysis.none", { move }) });
  const movetime = recorded.values.requestedMovetimeMs;
  const depth = recorded.values.requestedDepth;
  const bound = Number.isSafeInteger(movetime) && (movetime as number) > 0
    ? { requestedMovetimeMs: movetime as number }
    : Number.isSafeInteger(depth) && (depth as number) > 0 ? { requestedDepth: depth as number } : undefined;
  if (bound === undefined || recorded.engineId === undefined) return Object.freeze({ ...base, kind: "unattributed" as const, sentence: reviewText("analysis.unattributed", { move }) });
  const boundText = "requestedMovetimeMs" in bound ? reviewText("analysis.bound.movetime", { ms: bound.requestedMovetimeMs }) : reviewText("analysis.bound.depth", { depth: bound.requestedDepth });
  const operands = { engine: recorded.engineId, bound: boundText, move, line: moves.join(" ") };
  return Object.freeze({
    ...base, kind: "line" as const, source: recorded.source, engineId: recorded.engineId, bound: Object.freeze(bound), moves,
    sentence: recorded.source === "bestline" ? reviewText("analysis.line", operands) : reviewText("analysis.first", operands),
    caveat: reviewText("analysis.caveat"),
  });
}
