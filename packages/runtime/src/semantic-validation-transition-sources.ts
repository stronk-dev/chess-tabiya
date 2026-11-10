/** Build/test-only D4166 source-bound transition propositions; never a collector import.
 * Retained verbatim from python-chess1.11.2, pinned3516d7c6c0879af724c2855fac5a304a4ef40949.
 * Copyright Niklas Fiekas, GPL-3.0-or-later; full corresponding source/licence:
 * https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
 * https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
 * Classification lines3304-3319; actual BEFORE roles2364-2371, zeroing2360-2362 and
 * en-passant/promotion2386-2403. Literal legal edges pin facts, never move grades/purpose.
 * En passant keeps an initial0halfmove counter; other zeroing fixtures start at7.
 * Direct captures retain unmarked-FEN promoted:false metadata; EP omits that field.
 * False is not a claim that the victim was never promoted in an earlier game.
 */
import type { SemanticCanonicalValue, SemanticEdgeInput, SemanticMirrorOperandRule, SemanticValidationCase, SemanticValidationPropositionRecord } from "./semantic-validation.js";
interface SourceCase { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticEdgeInput; readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> }
const operation = { id: "runtime.semantic.transition_edge", version: 1 } as const;
const texts = {
  "capture": "    def is_en_passant(self, move: Move) -> bool:\n        \"\"\"Checks if the given pseudo-legal move is an en passant capture.\"\"\"\n        return (self.ep_square == move.to_square and\n                bool(self.pawns & BB_SQUARES[move.from_square]) and\n                abs(move.to_square - move.from_square) in [7, 9] and\n                not self.occupied & BB_SQUARES[move.to_square])\n\n    def is_capture(self, move: Move) -> bool:\n        \"\"\"Checks if the given pseudo-legal move is a capture.\"\"\"\n        touched = BB_SQUARES[move.from_square] ^ BB_SQUARES[move.to_square]\n        return bool(touched & self.occupied_co[not self.turn]) or self.is_en_passant(move)\n\nBoard.push original mover/victim, lines2364-2371:\n        from_bb = BB_SQUARES[move.from_square]\n        to_bb = BB_SQUARES[move.to_square]\n\n        promoted = bool(self.promoted & from_bb)\n        piece_type = self._remove_piece_at(move.from_square)\n        assert piece_type is not None, f\"push() expects move to be pseudo-legal, but got {move} in {self.board_fen()}\"\n        capture_square = move.to_square\n        captured_piece_type = self.piece_type_at(capture_square)\n\nBoard.push en-passant/promotion, lines2386-2403:\n        # Handle special pawn moves.\n        if piece_type == PAWN:\n            diff = move.to_square - move.from_square\n\n            if diff == 16 and square_rank(move.from_square) == 1:\n                self.ep_square = move.from_square + 8\n            elif diff == -16 and square_rank(move.from_square) == 6:\n                self.ep_square = move.from_square - 8\n            elif move.to_square == ep_square and abs(diff) in [7, 9] and not captured_piece_type:\n                # Remove pawns captured en passant.\n                down = -8 if self.turn == WHITE else 8\n                capture_square = ep_square + down\n                captured_piece_type = self._remove_piece_at(capture_square)\n\n        # Promotion.\n        if move.promotion:\n            promoted = True\n            piece_type = move.promotion\n\nUnmarked FEN metadata, not promotion history. _clear_board lines777-789:\n    def _clear_board(self) -> None:\n        self.pawns = BB_EMPTY\n        self.knights = BB_EMPTY\n        self.bishops = BB_EMPTY\n        self.rooks = BB_EMPTY\n        self.queens = BB_EMPTY\n        self.kings = BB_EMPTY\n\n        self.promoted = BB_EMPTY\n\n        self.occupied_co[WHITE] = BB_EMPTY\n        self.occupied_co[BLACK] = BB_EMPTY\n        self.occupied = BB_EMPTY\n\n_set_piece_at default marker, lines1052-1076:\n    def _set_piece_at(self, square: Square, piece_type: PieceType, color: Color, promoted: bool = False) -> None:\n        self._remove_piece_at(square)\n\n        mask = BB_SQUARES[square]\n\n        if piece_type == PAWN:\n            self.pawns |= mask\n        elif piece_type == KNIGHT:\n            self.knights |= mask\n        elif piece_type == BISHOP:\n            self.bishops |= mask\n        elif piece_type == ROOK:\n            self.rooks |= mask\n        elif piece_type == QUEEN:\n            self.queens |= mask\n        elif piece_type == KING:\n            self.kings |= mask\n        else:\n            return\n\n        self.occupied ^= mask\n        self.occupied_co[color] ^= mask\n\n        if promoted:\n            self.promoted ^= mask\n\nFEN board insertion/marker, lines1162-1175:\n        # Clear the board.\n        self._clear_board()\n\n        # Put pieces on the board.\n        square_index = 0\n        for c in fen:\n            if c in [\"1\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\", \"8\"]:\n                square_index += int(c)\n            elif c.lower() in PIECE_SYMBOLS:\n                piece = Piece.from_symbol(c)\n                self._set_piece_at(SQUARES_180[square_index], piece.piece_type, piece.color)\n                square_index += 1\n            elif c == \"~\":\n                self.promoted |= BB_SQUARES[SQUARES_180[square_index - 1]]\n",
  "clock_reset": "    def is_en_passant(self, move: Move) -> bool:\n        \"\"\"Checks if the given pseudo-legal move is an en passant capture.\"\"\"\n        return (self.ep_square == move.to_square and\n                bool(self.pawns & BB_SQUARES[move.from_square]) and\n                abs(move.to_square - move.from_square) in [7, 9] and\n                not self.occupied & BB_SQUARES[move.to_square])\n\n    def is_capture(self, move: Move) -> bool:\n        \"\"\"Checks if the given pseudo-legal move is a capture.\"\"\"\n        touched = BB_SQUARES[move.from_square] ^ BB_SQUARES[move.to_square]\n        return bool(touched & self.occupied_co[not self.turn]) or self.is_en_passant(move)\n\nBoard.is_zeroing, lines3316-3319:\n    def is_zeroing(self, move: Move) -> bool:\n        \"\"\"Checks if the given pseudo-legal move is a capture or pawn move.\"\"\"\n        touched = BB_SQUARES[move.from_square] ^ BB_SQUARES[move.to_square]\n        return bool(touched & self.pawns or touched & self.occupied_co[not self.turn] or move.drop == PAWN)\n\nBoard.push halfmove reset, lines2360-2362:\n        # Zero the half-move clock.\n        if self.is_zeroing(move):\n            self.halfmove_clock = 0\n\nBoard.push original mover/victim, lines2364-2371:\n        from_bb = BB_SQUARES[move.from_square]\n        to_bb = BB_SQUARES[move.to_square]\n\n        promoted = bool(self.promoted & from_bb)\n        piece_type = self._remove_piece_at(move.from_square)\n        assert piece_type is not None, f\"push() expects move to be pseudo-legal, but got {move} in {self.board_fen()}\"\n        capture_square = move.to_square\n        captured_piece_type = self.piece_type_at(capture_square)\n\nBoard.push en-passant/promotion, lines2386-2403:\n        # Handle special pawn moves.\n        if piece_type == PAWN:\n            diff = move.to_square - move.from_square\n\n            if diff == 16 and square_rank(move.from_square) == 1:\n                self.ep_square = move.from_square + 8\n            elif diff == -16 and square_rank(move.from_square) == 6:\n                self.ep_square = move.from_square - 8\n            elif move.to_square == ep_square and abs(diff) in [7, 9] and not captured_piece_type:\n                # Remove pawns captured en passant.\n                down = -8 if self.turn == WHITE else 8\n                capture_square = ep_square + down\n                captured_piece_type = self._remove_piece_at(capture_square)\n\n        # Promotion.\n        if move.promotion:\n            promoted = True\n            piece_type = move.promotion\n"
} as const;
const examples = [
  {"name": "piece","color": "white","beforeFen": "4k3/8/8/8/8/8/n7/R3K3 w - - 7 1","moveUci": "a1a2","afterFen": "4k3/8/8/8/8/8/R7/4K3 b - - 0 1","role": "rook","captured": "knight","ep": false},
  {"name": "piece","color": "black","beforeFen": "r3k3/N7/8/8/8/8/8/4K3 b - - 7 1","moveUci": "a8a7","afterFen": "4k3/r7/8/8/8/8/8/4K3 w - - 0 2","role": "rook","captured": "knight","ep": false},
  {"name": "promotion","color": "white","beforeFen": "r6k/1P6/8/8/8/8/8/7K w - - 7 1","moveUci": "b7a8q","afterFen": "Q6k/8/8/8/8/8/8/7K b - - 0 1","role": "pawn","captured": "rook","ep": false},
  {"name": "promotion","color": "black","beforeFen": "7k/8/8/8/8/8/1p6/R6K b - - 7 1","moveUci": "b2a1q","afterFen": "7k/8/8/8/8/8/8/q6K w - - 0 2","role": "pawn","captured": "rook","ep": false},
  {"name": "ep","color": "white","beforeFen": "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1","moveUci": "e5d6","afterFen": "4k3/8/3P4/8/8/8/8/4K3 b - - 0 1","role": "pawn","captured": "pawn","ep": true},
  {"name": "ep","color": "black","beforeFen": "4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 1","moveUci": "e4d3","afterFen": "4k3/8/8/8/8/3p4/8/4K3 w - - 0 2","role": "pawn","captured": "pawn","ep": true},
  {"name": "quiet-pawn","color": "white","beforeFen": "4k3/8/8/8/8/8/P7/4K3 w - - 7 1","moveUci": "a2a3","afterFen": "4k3/8/8/8/8/P7/8/4K3 b - - 0 1","role": "pawn","captured": null,"ep": false},
  {"name": "quiet-pawn","color": "black","beforeFen": "4k3/p7/8/8/8/8/8/4K3 b - - 7 1","moveUci": "a7a6","afterFen": "4k3/8/p7/8/8/8/8/4K3 w - - 0 2","role": "pawn","captured": null,"ep": false},
 ] as const;
type Family = "capture" | "clock_reset";
const rule = (path: readonly string[], value: "identity" | "color" | "square"): SemanticMirrorOperandRule =>
  ({ sourcePath: path, partnerPath: path, value, collection: "scalar" });
const commonRules = [rule(["family"], "identity"), rule(["sign"], "identity"), rule(["mover", "color"], "color"),
  rule(["mover", "role"], "identity"), rule(["from"], "square"), rule(["to"], "square")];
const inputRules: readonly SemanticMirrorOperandRule[] = [
  { sourcePath: ["before_fen"], partnerPath: ["before_fen"], value: "input_before_fen", collection: "scalar" },
  { sourcePath: ["move_uci"], partnerPath: ["move_uci"], value: "input_move_uci", collection: "scalar" },
  { sourcePath: ["after_fen"], partnerPath: ["after_fen"], value: "input_after_fen", collection: "scalar" },
];
// These are complete literal walks over two actual payload shapes; no optional walker path.
const directCaptureRules = [...commonRules, rule(["captured", "color"], "color"), rule(["captured", "role"], "identity"),
  rule(["captured", "promoted"], "identity"), rule(["enPassant"], "identity"), ...inputRules];
const epRules = [...commonRules, rule(["captured", "color"], "color"), rule(["captured", "role"], "identity"),
  rule(["enPassant"], "identity"), ...inputRules];
const clockRules = [...commonRules, rule(["detail", "pawnMove"], "identity"), rule(["detail", "capture"], "identity"), ...inputRules];
function source(family: Family) {
  const subject = { kind: "event", projection: { id: `rules.transition.event.${family}`, version: 1 } } as const;
  const cases = examples.filter(example => family !== "capture" || example.captured !== null).flatMap(example => {
    const rules = family === "capture" ? example.ep ? epRules : directCaptureRules : clockRules;
    const input: SemanticEdgeInput = { kind: "edge", beforeFen: example.beforeFen, moveUci: example.moveUci, afterFen: example.afterFen };
    const id = (color: string, arm: string) => `cited.python-chess.transition-fields.${family}.${example.name}.${color}.${arm}`;
    const operands: Record<string, SemanticCanonicalValue> = { family, sign: "state", mover: { color: example.color, role: example.role },
      from: example.moveUci.slice(0, 2), to: example.moveUci.slice(2, 4) };
    if (family === "capture") {
      if (example.captured === null) throw Error("A capture proposition requires the original victim");
      operands.captured = { color: example.color === "white" ? "black" : "white", role: example.captured,
        ...(example.ep ? {} : { promoted: false }) };
      operands.enPassant = example.ep;
    } else operands.detail = { pawnMove: example.role === "pawn", capture: example.captured !== null };
    Object.assign(operands, { before_fen: input.beforeFen, move_uci: input.moveUci, after_fen: input.afterFen });
    return [
      { arm: "positive", input, proposition: { subject, case: { id: id(example.color, "absolute"), version: 1 }, factConstraint: [],
        expectation: { kind: "emits", minimum: 1, sign: "state", operandMatch: operands } } },
      { arm: "orientation", input, proposition: { subject, case: { id: id(example.color, "orientation"), version: 1 }, factConstraint: [],
        expectation: { kind: "mirrors", partnerCase: { kind: "case", id: id(example.color === "white" ? "black" : "white", "orientation"),
          version: 1, subject, arm: "orientation" }, geometry: "color_and_vertical",
          targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: rules } } },
    ] satisfies readonly SourceCase[];
  });
  return { sourceId: `python-chess.${family === "capture" ? "capture" : "zeroing"}.fields`,
    sourceRevision: "3516d7c6c0879af724c2855fac5a304a4ef40949", licence: "GPL-3.0-or-later",
    url: "https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L2360-L2403",
    text: texts[family], operation, cases };
}
export const SEMANTIC_VALIDATION_TRANSITION_SOURCES = Object.freeze([source("capture"), source("clock_reset")]);
