// Disposable D3489 scheduling primitive. Geometry is NOT positive exchange,
// hypothetical off-turn legality, target success or strategic chess truth.
import { attacks } from "../../packages/runtime/node_modules/chessops/dist/esm/attacks.js";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseSquare, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import type { Square } from "../../packages/runtime/node_modules/chessops/dist/esm/types.js";
import { trackTargetPath } from "./coherent-bounded-targets.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { exchangeCaptureAt } from "../../packages/runtime/src/exchange.js";

function check(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function sq(name: string): Square { const value = parseSquare(name); check(value !== undefined, "Invalid event square"); return value; }
function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function signature(fen: string, target: any, family: string): any {
  const pos = position(fen);
  const has = (piece: any) => piece !== null && piece !== undefined
    && pos.board.get(sq(piece.square))?.color === piece.color && pos.board.get(sq(piece.square))?.role === piece.role;
  const reaches = (piece: any, square: string) => has(piece) && attacks(piece, sq(piece.square), pos.board.occupied).has(sq(square));
  if (family === "material") return { identityAlive: target !== null,
    attackerRole: target?.attacker.role ?? null, targetRole: target?.target.role ?? null,
    actorAttacksTarget: target !== null && reaches(target.attacker, target.target.square) };
  check(family === "destination", "Unknown relation family");
  const occupant = target === null ? undefined : pos.board.get(sq(target.square));
  return { identityAlive: target !== null, minorRole: target?.minor.role ?? null,
    minorAttacksDestination: target !== null && reaches(target.minor, target.square),
    destinationOccupant: occupant === undefined ? null : { color: occupant.color, role: occupant.role },
    controllerAlive: target !== null && has(target.controllingPawn),
    controllerRole: target?.controllingPawn?.role ?? null,
    pawnControlsDestination: target !== null && target.controllingPawn?.role === "pawn"
      && reaches(target.controllingPawn, target.square) };
}

export function relationEventsAtHistory(rootFen: string, history: readonly string[], definition: any): any {
  check(history.length === 2 || history.length === 3, "Recursive events require preparation/predecessor history");
  const before = trackTargetPath(rootFen, history, definition), pos = position(before.fen);
  const legal = legalMoves(pos).map((entry: any) => entry.uci), beforeSignature = signature(before.fen, before.tracked, definition.family);
  const status = before.terminalReason !== null ? "absorbing_terminal" : before.tracked === null ? "operand_absent" : "eligible";
  if (status !== "eligible") return { historyUci: history, fen: before.fen, tracked: before.tracked,
    terminalReason: before.terminalReason, legal, beforeSignature, status, events: [] };
  const events = legal.flatMap((uci: string) => {
    if (history.length === 3) {
      const move = parseUci(uci); check(move !== undefined && "from" in move, "Invalid canonical event move");
      const target = before.tracked;
      const event = definition.family === "material" ? move.from === sq(target.attacker.square)
        && exchangeCaptureAt(pos, move)?.square === sq(target.target.square)
        : move.from === sq(target.minor.square) && move.to === sq(target.square);
      return event ? [{ uci, kind: definition.family === "material" ? "named_attacker_captures_target" : "named_minor_arrives_on_square" }] : [];
    }
    const after = trackTargetPath(rootFen, [...history, uci], definition);
    const afterSignature = signature(after.fen, after.tracked, definition.family);
    const changed = Object.keys(beforeSignature).filter((field) => JSON.stringify(beforeSignature[field]) !== JSON.stringify(afterSignature[field]));
    return changed.length === 0 ? [] : [{ uci, kind: "named_relation_signature_changed", changed, afterSignature }];
  });
  return { historyUci: history, fen: before.fen, tracked: before.tracked, terminalReason: before.terminalReason,
    legal, beforeSignature, status: events.length ? "event_available" : "no_legal_event", events };
}
