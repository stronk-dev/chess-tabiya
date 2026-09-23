// Disposable D3262 first-child semantic scheduling operand census. It takes
// declared operands and complete legal replies, never a source witness/outcome.
// A touch is a search-order candidate, not a semantic proof or move grade.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { castlingSide, Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { kingCastlesTo, makeSquare, parseSquare, parseUci, rookCastlesTo } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { Color, Move, Role, Square, SquareName } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { exchangeCaptureAt } from "../../packages/runtime/src/exchange.js";

export type Piece = { readonly color: Color; readonly role: Role; readonly square: SquareName };
type MaterialTarget = { readonly attacker: Piece; readonly target: Piece };
type DestinationTarget = { readonly minor: Piece; readonly controllingPawn: Piece; readonly square: SquareName };
type Definition = { readonly id: string; readonly rootId: string; readonly family: "material" | "destination"; readonly target: MaterialTarget | DestinationTarget; readonly sources: readonly { readonly candidateUci: string }[] };
type Pair = { readonly rootId: string; readonly targetId: string; readonly candidateUci: string };

const path = (name: string) => `planning/semantic-consequence-search/${name}`;
function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
export function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function square(name: SquareName): Square { const result = parseSquare(name); check(result !== undefined, `Invalid square ${name}`); return result; }
function samePiece(pos: Chess, piece: Piece): boolean {
  const found = pos.board.get(square(piece.square));
  return found?.color === piece.color && found.role === piece.role;
}
export function trackedAfter(pos: Chess, move: Move, piece: Piece | null): Piece | null {
  if (piece === null) return null;
  check(samePiece(pos, piece), `Declared piece identity absent at ${piece.square}`);
  const tracked = square(piece.square);
  if (exchangeCaptureAt(pos, move)?.square === tracked) return null;
  const castling = castlingSide(pos, move);
  if (castling !== undefined && "from" in move) {
    const rookFrom = pos.castles.rook[pos.turn][castling];
    if (move.from === tracked) return { ...piece, square: makeSquare(kingCastlesTo(pos.turn, castling)) };
    if (rookFrom === tracked) return { ...piece, square: makeSquare(rookCastlesTo(pos.turn, castling)) };
  }
  if ("from" in move && move.from === tracked) return { ...piece, square: makeSquare(move.to), role: move.promotion ?? piece.role };
  return piece;
}
export function played(pos: Chess, uci: string): Move {
  const parsed = parseUci(uci);
  check(parsed !== undefined, `Invalid reply ${uci}`);
  const move = normalizeMove(pos, parsed);
  check(pos.isLegal(move), `Illegal reply ${uci}`);
  return move;
}
function changedSquares(before: Chess, after: Chess, move: Move): Set<Square> {
  const changed = new Set<Square>();
  if ("from" in move) { changed.add(move.from); changed.add(move.to); }
  for (let index = 0; index < 64; index += 1) {
    const a = before.board.get(index as Square), b = after.board.get(index as Square);
    if (a?.color !== b?.color || a?.role !== b?.role) changed.add(index as Square);
  }
  return changed;
}
function lineInterior(left: Piece, right: Piece): Set<Square> {
  const a = square(left.square), b = square(right.square);
  const fileDelta = (b % 8) - (a % 8), rankDelta = Math.floor(b / 8) - Math.floor(a / 8);
  if (!(fileDelta === 0 || rankDelta === 0 || Math.abs(fileDelta) === Math.abs(rankDelta))) return new Set();
  const fileStep = Math.sign(fileDelta), rankStep = Math.sign(rankDelta);
  const result = new Set<Square>();
  let file = (a % 8) + fileStep, rank = Math.floor(a / 8) + rankStep;
  while (file !== b % 8 || rank !== Math.floor(b / 8)) {
    result.add((rank * 8 + file) as Square);
    file += fileStep; rank += rankStep;
  }
  return result;
}
function destinationRootPawn(pos: Chess, definition: Definition, target: DestinationTarget): Piece {
  if (samePiece(pos, target.controllingPawn)) return target.controllingPawn;
  const origins = [...new Set(definition.sources.filter((source) => source.candidateUci.slice(2, 4) === target.controllingPawn.square).map((source) => source.candidateUci.slice(0, 2)))];
  check(origins.length === 1, `Ambiguous declared root pawn for ${definition.id}`);
  const identity = { ...target.controllingPawn, square: origins[0] as SquareName };
  check(samePiece(pos, identity), `Declared destination pawn absent at root ${definition.id}`);
  return identity;
}

export function compileSemanticTouchFirstLayer(comparisons: any, graph: any): any {
  check(comparisons.authority === "target_candidate_comparison_population_not_outcome_or_move_grade", "Wrong semantic-touch comparison frame");
  check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof" && graph.manifest === comparisons.manifest, "Crossed semantic-touch legal graph");
  const definitions = new Map<string, Definition>(comparisons.definitions.map((definition: Definition) => [definition.id, definition]));
  const roots = new Map<string, any>(graph.roots.map((root: any) => [root.rootId, root]));
  const rows = comparisons.comparisons.map((pair: Pair) => {
    const definition = definitions.get(pair.targetId), root = roots.get(pair.rootId);
    check(definition !== undefined && definition.rootId === pair.rootId && root !== undefined, `Missing semantic-touch target/root ${pair.rootId}/${pair.targetId}`);
    const candidate = root.candidates.find((value: any) => value.candidateUci === pair.candidateUci);
    check(candidate !== undefined, `Missing semantic-touch candidate ${pair.rootId}/${pair.candidateUci}`);
    const rootPos = position(root.fen), candidateMove = played(rootPos, pair.candidateUci);
    const target = definition.target;
    const rootOperands = definition.family === "material"
      ? [(target as MaterialTarget).attacker, (target as MaterialTarget).target]
      : [(target as DestinationTarget).minor, destinationRootPawn(rootPos, definition, target as DestinationTarget)];
    const childOperands = rootOperands.map((piece) => trackedAfter(rootPos, candidateMove, piece));
    rootPos.play(candidateMove);
    check(makeFen(rootPos.toSetup()) === candidate.afterFen, `Crossed semantic-touch candidate FEN ${pair.rootId}/${pair.candidateUci}`);
    if (childOperands.some((piece) => piece === null)) return { ...pair, family: definition.family, status: "operand_absent", legalReplies: candidate.replies.length, touchReplies: [] };
    const pieces = childOperands as Piece[];
    check(pieces.every((piece) => samePiece(rootPos, piece)), `Semantic-touch child identity differs at ${pair.rootId}/${pair.candidateUci}`);
    const namedSquares = new Set<Square>(pieces.map((piece) => square(piece.square)));
    if (definition.family === "destination") {
      namedSquares.add(square((target as DestinationTarget).square));
      namedSquares.add(square((target as DestinationTarget).controllingPawn.square));
    }
    const ray = definition.family === "material" ? lineInterior(pieces[0], pieces[1]) : new Set<Square>();
    const touchReplies = candidate.replies.flatMap((reply: any) => {
      const before = rootPos.clone(), move = played(before, reply.uci), after = before.clone();
      after.play(move);
      check(makeFen(after.toSetup()) === reply.fen, `Crossed semantic-touch reply FEN ${pair.rootId}/${pair.candidateUci}/${reply.uci}`);
      const changed = changedSquares(before, after, move);
      const reasons: string[] = [];
      if ([...changed].some((value) => namedSquares.has(value))) reasons.push("named_operand_or_destination_square_changed");
      if ([...changed].some((value) => ray.has(value))) reasons.push("named_line_interior_changed");
      return reasons.length === 0 ? [] : [{ uci: reply.uci, reasons }];
    });
    return { ...pair, family: definition.family, status: "measured", legalReplies: candidate.replies.length, touchReplies };
  });
  check(rows.length === 185, "Semantic-touch census lost named comparisons");
  return { version: 1, manifest: comparisons.manifest, authority: "source_blind_operand_touch_scheduling_not_target_result_or_proof", rows };
}

if (process.argv[1]?.endsWith("semantic-touch-first-layer.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-exact-replies.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileSemanticTouchFirstLayer(JSON.parse(bytes[0].toString()), JSON.parse(bytes[1].toString())), inputDigests: Object.fromEntries(names.map((name, index) => [name, `sha256:${createHash("sha256").update(bytes[index]).digest("hex")}`])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-semantic-touch-first-layer.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 semantic-touch census differs from frozen source");
  const summary = { measured: artifact.rows.filter((row: any) => row.status === "measured").length, operandAbsent: artifact.rows.filter((row: any) => row.status === "operand_absent").length, legalReplies: artifact.rows.reduce((sum: number, row: any) => sum + row.legalReplies, 0), touches: artifact.rows.reduce((sum: number, row: any) => sum + row.touchReplies.length, 0) };
  process.stdout.write(`${JSON.stringify({ digest: `sha256:${createHash("sha256").update(output).digest("hex")}`, ...summary }, null, 2)}\n`);
}
