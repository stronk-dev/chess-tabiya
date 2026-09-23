// Pure replay and declared-attack trigger semantics shared by the frozen and
// coherent D3262 exact-arm diagnostics. No captured artifact loads on import.
import { attacks } from "../../packages/runtime/node_modules/chessops/dist/esm/attacks.js";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseSquare, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

function check(value, message) { if (!value) throw new Error(message); }
function position(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function registeredAttackers(after, replySide, definition) {
  const name = definition.family === "material" ? definition.target.target.square : definition.target.square;
  const target = parseSquare(name);
  check(target !== undefined, `Invalid registered target square ${name}`);
  if (definition.family === "material") {
    const piece = after.board.get(target), declared = definition.target.target;
    if (piece?.color !== declared.color || piece.role !== declared.role) return new Set();
  }
  const attackers = new Set();
  for (const [square, piece] of after.board) {
    if (piece.color === replySide && attacks(piece, square, after.board.occupied).has(target)) attackers.add(square);
  }
  return attackers;
}
export function replayReply(candidate, reply, definition) {
  const afterCandidate = position(candidate.afterFen);
  const side = afterCandidate.turn;
  const beforeAttackers = registeredAttackers(afterCandidate, side, definition);
  const parsed = parseUci(reply.uci);
  check(parsed !== undefined, `Invalid exact opponent reply ${reply.uci}`);
  const move = normalizeMove(afterCandidate, parsed);
  check(afterCandidate.isLegal(move), `Illegal exact opponent reply ${reply.uci}`);
  const piecesBefore = [...afterCandidate.board].length;
  afterCandidate.play(move);
  check(makeFen(afterCandidate.toSetup()) === reply.fen, `Crossed exact opponent reply FEN ${reply.uci}`);
  check(afterCandidate.isCheck() === reply.givesCheck, `Crossed exact check flag ${reply.uci}`);
  check(([...afterCandidate.board].length < piecesBefore) === reply.captures,
    `Crossed exact capture flag ${reply.uci}`);
  const afterAttackers = registeredAttackers(afterCandidate, side, definition);
  return { afterCandidate, newAttack: [...afterAttackers].some((square) => !beforeAttackers.has(square)) };
}
