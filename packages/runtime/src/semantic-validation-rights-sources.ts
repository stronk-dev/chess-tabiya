/** Build/test-only D4164 propositions; never imported by collectors or the runtime barrel.
 * Accepted semantic-validation-authority Slice B/§4.1a. Reuses the complete retained
 * python-chess 1.11.2 _reduces_castling_rights rule and its GPL-3.0-or-later source/licence
 * references in semantic-validation-literal-sources.ts, plus the complete original Board.push
 * rights-update block, lines2373-2384. All old propositions stay unchanged.
 * Literal legal edges instantiate rook/king right removal; no purpose or intent is inferred.
 */
import { SEMANTIC_VALIDATION_LITERAL_SOURCES } from "./semantic-validation-literal-sources.js";
import type { SemanticEdgeInput, SemanticMirrorOperandRule, SemanticValidationCase, SemanticValidationPropositionRecord } from "./semantic-validation.js";

const retained = SEMANTIC_VALIDATION_LITERAL_SOURCES.find(source => source.sourceId === "python-chess.rights");
if (retained === undefined) throw new Error("D4164 requires the original retained castling-rights rule");
const pushRightsBlock = "        # Update castling rights.\n        self.castling_rights &= ~to_bb & ~from_bb\n        if piece_type == KING and not promoted:\n            if self.turn == WHITE:\n                self.castling_rights &= ~BB_RANK_1\n            else:\n                self.castling_rights &= ~BB_RANK_8\n        elif captured_piece_type == KING and not self.promoted & to_bb:\n            if self.turn == WHITE and square_rank(move.to_square) == 7:\n                self.castling_rights &= ~BB_RANK_8\n            elif self.turn == BLACK and square_rank(move.to_square) == 0:\n                self.castling_rights &= ~BB_RANK_1\n";
const subject = { kind: "event", projection: { id: "rules.castling.event.rights_lost", version: 1 } } as const;
const operation = { id: "runtime.semantic.local_edge", version: 1 } as const;
const root = "r3k2r/8/8/8/8/8/8/R3K2R";
const rules: readonly SemanticMirrorOperandRule[] = [
  { sourcePath: ["color"], partnerPath: ["color"], value: "color", collection: "scalar" },
  ...["wing", "cause"].map(key => ({ sourcePath: [key], partnerPath: [key], value: "identity" as const, collection: "scalar" as const })),
  { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
  { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
  { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
];
interface SourceCase {
  readonly arm: SemanticValidationCase["arm"];
  readonly input: SemanticEdgeInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256">;
}
const id = (family: string, color: string, arm: string) => `cited.python-chess.rights-orientation.${family}.${color}.${arm}`;
const moves = [
  { family: "rook-queenside", white: "a1a2", black: "a8a7",
    whiteAfter: "r3k2r/8/8/8/8/8/R7/4K2R b Kkq - 8 1", blackAfter: "4k2r/r7/8/8/8/8/8/R3K2R w KQk - 8 2" },
  { family: "rook-kingside", white: "h1h2", black: "h8h7",
    whiteAfter: "r3k2r/8/8/8/8/8/7R/R3K3 b Qkq - 8 1", blackAfter: "r3k3/7r/8/8/8/8/8/R3K2R w KQq - 8 2" },
  { family: "king", white: "e1e2", black: "e8e7",
    whiteAfter: "r3k2r/8/8/8/8/8/4K3/R6R b kq - 8 1", blackAfter: "r6r/4k3/8/8/8/8/8/R3K2R w KQ - 8 2" },
] as const;
const cases: readonly SourceCase[] = moves.flatMap(move => (["white", "black"] as const).flatMap(color => {
  const input: SemanticEdgeInput = { kind: "edge", beforeFen: `${root} ${color === "white" ? "w" : "b"} KQkq - 7 1`,
    moveUci: move[color], afterFen: color === "white" ? move.whiteAfter : move.blackAfter };
  const orientation: SourceCase = { arm: "orientation", input, proposition: { subject,
    case: { id: id(move.family, color, "orientation"), version: 1 }, factConstraint: [],
    expectation: { kind: "mirrors", partnerCase: { kind: "case", id: id(move.family, color === "white" ? "black" : "white", "orientation"),
      version: 1, subject, arm: "orientation" }, geometry: "color_and_vertical",
      targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: rules } } };
  // The old a-rook absolute propositions already pin queenside; add the other wing explicitly.
  if (move.family !== "rook-kingside") return [orientation];
  return [{ arm: "positive", input, proposition: { subject, case: { id: id(move.family, color, "absolute"), version: 1 }, factConstraint: [],
    expectation: { kind: "emits", minimum: 1, sign: "lost", operandMatch: { color, wing: "kingside", cause: "rook_moved",
      beforeFen: input.beforeFen, moveUci: input.moveUci, afterFen: input.afterFen } } } }, orientation] satisfies readonly SourceCase[];
}));

export const SEMANTIC_VALIDATION_RIGHTS_SOURCES = Object.freeze([{
  sourceId: "python-chess.rights.orientation", sourceRevision: retained.sourceRevision,
  licence: retained.licence, url: "https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L2373-L2384",
  text: `${retained.text}\nBoard.push lines2373-2384:\n${pushRightsBlock}`, operation, cases,
}]);
