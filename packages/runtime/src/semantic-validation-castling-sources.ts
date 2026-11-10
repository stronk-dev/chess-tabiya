/** Build/test-only independent rule propositions; never imported by production collectors.
 * D4163 / accepted semantic-validation-authority Slice B and §4.1a.
 * Retained verbatim from python-chess 1.11.2 Board.push, Copyright Niklas Fiekas,
 * GPL-3.0-or-later. Full corresponding source and licence:
 * https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
 * https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
 * The surrounding branch identifies queenside by rook destination left of king origin.
 * The retained complete castling block fixes absolute king destinations, independently of our emitter and its mirror.
 * Semantic payload destinations are square names (both `to` and resultingKingSquare);
 * the retained input move remains king-to-rook UCI.
 * Literal standard-chess edges use the already accepted king-to-rook UCI representation.
 */
import type { SemanticEdgeInput, SemanticMirrorOperandRule, SemanticValidationCase, SemanticValidationPropositionRecord } from "./semantic-validation.js";

const castlingBlock = "        # Castling.\n        castling = piece_type == KING and self.occupied_co[self.turn] & to_bb\n        if castling:\n            a_side = square_file(move.to_square) < square_file(move.from_square)\n\n            self._remove_piece_at(move.from_square)\n            self._remove_piece_at(move.to_square)\n\n            if a_side:\n                self._set_piece_at(C1 if self.turn == WHITE else C8, KING, self.turn)\n                self._set_piece_at(D1 if self.turn == WHITE else D8, ROOK, self.turn)\n            else:\n                self._set_piece_at(G1 if self.turn == WHITE else G8, KING, self.turn)\n                self._set_piece_at(F1 if self.turn == WHITE else F8, ROOK, self.turn)\n";

const subject = { kind: "event", projection: { id: "rules.transition.event.castled", version: 1 } } as const;
const operation = { id: "runtime.semantic.transition_edge", version: 1 } as const;
const root = "r3k2r/8/8/8/8/8/8/R3K2R";
const rules: readonly SemanticMirrorOperandRule[] = [
  ...[["family"], ["sign"], ["mover", "role"]].map(path => ({ sourcePath: path, partnerPath: path, value: "identity" as const, collection: "scalar" as const })),
  { sourcePath: ["mover", "color"], partnerPath: ["mover", "color"], value: "color", collection: "scalar" },
  ...[["from"], ["to"], ["detail", "resultingKingSquare"]].map(path => ({ sourcePath: path, partnerPath: path, value: "square" as const, collection: "scalar" as const })),
  { sourcePath: ["before_fen"], partnerPath: ["before_fen"], value: "input_before_fen", collection: "scalar" },
  { sourcePath: ["move_uci"], partnerPath: ["move_uci"], value: "input_move_uci", collection: "scalar" },
  { sourcePath: ["after_fen"], partnerPath: ["after_fen"], value: "input_after_fen", collection: "scalar" },
];

interface SourceCase {
  readonly arm: SemanticValidationCase["arm"];
  readonly input: SemanticEdgeInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256">;
}

function source(wing: "queenside" | "kingside",
  whiteAfter: string, blackAfter: string, rookFile: "a" | "h", kingFile: "c" | "g") {
  const id = (color: "white" | "black", arm: "absolute" | "orientation") => `cited.python-chess.castle-destination.${wing}.${color}.${arm}`;
  const cases = (["white", "black"] as const).flatMap(color => {
    const white = color === "white", rank = white ? "1" : "8";
    const input: SemanticEdgeInput = { kind: "edge", beforeFen: `${root} ${white ? "w" : "b"} KQkq - 0 1`,
      moveUci: `e${rank}${rookFile}${rank}`, afterFen: white ? whiteAfter : blackAfter };
    return [
      { arm: "positive", input, proposition: { subject, case: { id: id(color, "absolute"), version: 1 }, factConstraint: [],
        expectation: { kind: "emits", minimum: 1, sign: "state", operandMatch: {
          family: "castled", sign: "state", mover: { color, role: "king" }, from: `e${rank}`, to: `${kingFile}${rank}`,
          detail: { resultingKingSquare: `${kingFile}${rank}` },
          before_fen: input.beforeFen, move_uci: input.moveUci, after_fen: input.afterFen,
        } } } },
      { arm: "orientation", input, proposition: { subject, case: { id: id(color, "orientation"), version: 1 }, factConstraint: [],
        expectation: { kind: "mirrors", partnerCase: { kind: "case", id: id(white ? "black" : "white", "orientation"), version: 1, subject, arm: "orientation" },
          geometry: "color_and_vertical", targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: rules } } },
    ] satisfies readonly SourceCase[];
  });
  return { sourceId: `python-chess.castle-destination.${wing}`, sourceRevision: "3516d7c6c0879af724c2855fac5a304a4ef40949",
    licence: "GPL-3.0-or-later", url: `https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L2405-L2418`,
    text: castlingBlock, operation, cases };
}

export const SEMANTIC_VALIDATION_CASTLING_SOURCES = Object.freeze([
  source("queenside",
    "r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1", "2kr3r/8/8/8/8/8/8/R3K2R w KQ - 1 2", "a", "c"),
  source("kingside",
    "r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1", "r4rk1/8/8/8/8/8/8/R3K2R w KQ - 1 2", "h", "g"),
]);
