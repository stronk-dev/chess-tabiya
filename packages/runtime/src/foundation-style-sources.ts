// Literal configuration/candidate facts; recorded occurrences and style inference are separate.
import type { Color, Role, SquareName } from "chessops/types";
import type { ExactLegalMove, ExactLegalMoveMap } from "./legal-moves.js";
import { makeSquare, parseSquare } from "chessops/util";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { castlingRights, type CastlingRightsState } from "./castling.js";
import type { FoundationDecisionAuthority, FoundationPrefixAuthority } from "./recorded-foundation-source.js";

export interface CandidateRoleReading {
  readonly fen: string;
  readonly turn: Color;
  readonly moveUci: string;
  readonly sourcePiece: { readonly color: Color; readonly role: Role; readonly square: SquareName };
  readonly candidate: ExactLegalMove;
}

/** Select only a literal original legal-map member; ingress alias conversion happens elsewhere. */
export function readCandidateRole(source: ExactLegalMoveMap, moveUci: string): CandidateRoleReading {
  const members = source.pieces.flatMap(row => row.moves.filter(move => move.uci === moveUci).map(candidate => ({ piece: row.piece, candidate })));
  if (members.length !== 1) throw new TypeError("Candidate role requires exactly one original canonical legal-move member");
  const { piece, candidate } = members[0]!;
  if (piece.color !== source.turn || candidate.role !== piece.role || candidate.from !== piece.square) throw new TypeError("Candidate member differs from its original source piece");
  return Object.freeze({ fen: source.fen, turn: source.turn, moveUci: candidate.uci,
    sourcePiece: Object.freeze({ ...piece }), candidate: Object.freeze({ ...candidate }) });
}

export function readPawnExtendedCenterDestination(source: CandidateRoleReading): readonly CandidateRoleReading[] {
  return Object.freeze(source.sourcePiece.role === "pawn" && ["c4", "d4", "e4", "f4", "c5", "d5", "e5", "f5"].includes(source.candidate.to) ? [source] : []);
}

export interface EarlyQueenReading extends CandidateRoleReading {
  readonly runId: string;
  readonly branchId: string;
  readonly beforeNodeId: string;
  readonly sourcePly: number;
}
/** Neutral offered candidate at a represented rooted index, never proof the move was chosen. */
export function readEarlyQueenCandidate(decision: Pick<FoundationDecisionAuthority, "prefix" | "selected">, candidate: CandidateRoleReading): readonly EarlyQueenReading[] {
  const member = decision.selected;
  if (candidate.fen !== member.fen || candidate.turn !== positionFromFen(member.fen).turn) throw new TypeError("Candidate differs from its original recorded position");
  return Object.freeze(candidate.sourcePiece.role === "queen" && member.sourcePly < 16
    ? [Object.freeze({ ...candidate, runId: decision.prefix.runId, branchId: decision.prefix.branchId, beforeNodeId: member.nodeId, sourcePly: member.sourcePly })] : []);
}

export interface FirstDecisionCastling {
  readonly runId: string;
  readonly branchId: string;
  readonly throughNodeId: string;
  readonly firstDecisionNodeId: string;
  readonly sourcePly: number;
  readonly learnerColor: Color;
  readonly fen: string;
  readonly rights: CastlingRightsState["white"];
}
/** First represented stored-color turn in this prefix; not current legality or pre-root history. */
export function readFirstDecisionCastling(prefix: FoundationPrefixAuthority): FirstDecisionCastling | undefined {
  const member = prefix.path.find(row => positionFromFen(row.fen).turn === prefix.learnerSide);
  if (member === undefined) return undefined;
  return Object.freeze({ runId: prefix.runId, branchId: prefix.branchId, throughNodeId: prefix.throughNodeId,
    firstDecisionNodeId: member.nodeId, sourcePly: member.sourcePly, learnerColor: prefix.learnerSide,
    fen: member.fen, rights: castlingRights(member.fen)[prefix.learnerSide] });
}

export interface FianchettoPiece<R extends "bishop" | "pawn" | "knight"> {
  readonly color: Color;
  readonly role: R;
  readonly square: SquareName;
}
export interface FianchettoSetup {
  readonly color: Color;
  readonly wing: "queenside" | "kingside";
  readonly bishop: FianchettoPiece<"bishop">;
  readonly pawn: FianchettoPiece<"pawn">;
}
export interface FianchettoSetupSnapshot { readonly fen: string; readonly setups: readonly FianchettoSetup[] }
export interface FianchettoScreen { readonly setup: FianchettoSetup; readonly knight: FianchettoPiece<"knight"> }
export interface FianchettoScreenSnapshot { readonly fen: string; readonly screens: readonly FianchettoScreen[] }

const CONFIGURATIONS = [
  { color: "white", wing: "queenside", bishop: "b2", pawn: "b3", knight: "c3" },
  { color: "white", wing: "kingside", bishop: "g2", pawn: "g3", knight: "f3" },
  { color: "black", wing: "queenside", bishop: "b7", pawn: "b6", knight: "c6" },
  { color: "black", wing: "kingside", bishop: "g7", pawn: "g6", knight: "f6" },
] as const;

/** Exact position facts, not a historical claim about how either piece arrived here. */
export function readFianchettoSetups(fen: string): FianchettoSetupSnapshot {
  const position = positionFromFen(fen);
  const setups = CONFIGURATIONS.flatMap((config): FianchettoSetup[] => {
    const bishop = position.board.get(parseSquare(config.bishop)!), pawn = position.board.get(parseSquare(config.pawn)!);
    if (bishop?.role !== "bishop" || bishop.color !== config.color || pawn?.role !== "pawn" || pawn.color !== config.color) return [];
    return [Object.freeze({ color: config.color, wing: config.wing,
      bishop: Object.freeze({ color: bishop.color, role: "bishop" as const, square: config.bishop }),
      pawn: Object.freeze({ color: pawn.color, role: "pawn" as const, square: config.pawn }) })];
  });
  return Object.freeze({ fen: canonicalFen(position), setups: Object.freeze(setups) });
}

export function readFianchettoScreens(source: FianchettoSetupSnapshot): FianchettoScreenSnapshot {
  const position = positionFromFen(source.fen);
  const screens = source.setups.flatMap((setup): FianchettoScreen[] => {
    const config = CONFIGURATIONS.find(row => row.color === setup.color && row.wing === setup.wing)!;
    const square = parseSquare(config.knight)!, knight = position.board.get(square);
    if (knight?.role !== "knight" || knight.color !== setup.color) return [];
    return [Object.freeze({ setup, knight: Object.freeze({ color: knight.color, role: "knight" as const, square: makeSquare(square) }) })];
  });
  return Object.freeze({ fen: source.fen, screens: Object.freeze(screens) });
}
