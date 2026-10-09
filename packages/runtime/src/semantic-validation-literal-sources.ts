/** Build/test-only rule fixtures. Never imported by production collectors or the runtime barrel.
 * D3639 / semantic-validation-authority Slice B. Excerpts retained verbatim from python-chess
 * 1.11.2 at 3516d7c6c0879af724c2855fac5a304a4ef40949, Copyright Niklas Fiekas;
 * GPL-3.0-or-later. Corresponding source and licence:
 * https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
 * https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
 * Literal positions instantiate those rules only; none grades a move or claims strategic value.
 */
import type { SemanticCanonicalValue, SemanticEdgeInput, SemanticValidationPropositionRecord } from "./semantic-validation.js";

type RuleFixture = readonly [id: string, projection: string, beforeFen: string, moveUci: string, afterFen: string, operands: Readonly<Record<string, SemanticCanonicalValue>> | null];
function ruleCase(family: string, fixture: RuleFixture) {
  const [suffix, projection, beforeFen, moveUci, afterFen, operands] = fixture;
  return {
    arm: operands === null ? "semantic_negative" as const : "positive" as const,
    input: { kind: "edge", beforeFen, moveUci, afterFen } satisfies SemanticEdgeInput,
    proposition: {
      subject: { kind: "event", projection: { id: projection, version: 1 } },
      case: { id: `cited.python-chess.${family}.${suffix}`, version: 1 },
      factConstraint: [],
      expectation: operands === null ? { kind: "omits" } : { kind: "emits", minimum: 1, operandMatch: operands },
    } satisfies Omit<SemanticValidationPropositionRecord, "factConstraintSha256">,
  };
}

export const SEMANTIC_VALIDATION_LITERAL_SOURCES = Object.freeze([
  {
    sourceId: "python-chess.capture",
    sourceRevision: "3516d7c6c0879af724c2855fac5a304a4ef40949",
    licence: "GPL-3.0-or-later",
    url: "https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L3304-L3314",
    text: "    def is_en_passant(self, move: Move) -> bool:\n        \"\"\"Checks if the given pseudo-legal move is an en passant capture.\"\"\"\n        return (self.ep_square == move.to_square and\n                bool(self.pawns & BB_SQUARES[move.from_square]) and\n                abs(move.to_square - move.from_square) in [7, 9] and\n                not self.occupied & BB_SQUARES[move.to_square])\n\n    def is_capture(self, move: Move) -> bool:\n        \"\"\"Checks if the given pseudo-legal move is a capture.\"\"\"\n        touched = BB_SQUARES[move.from_square] ^ BB_SQUARES[move.to_square]\n        return bool(touched & self.occupied_co[not self.turn]) or self.is_en_passant(move)\n",
    operation: { id: "runtime.semantic.transition_edge", version: 1 },
    cases: ([
      ["direct.white","rules.transition.event.capture","4k3/8/8/8/8/8/n7/R3K3 w - - 7 1","a1a2","4k3/8/8/8/8/8/R7/4K3 b - - 0 1",{"mover":{"color":"white"},"captured":{"color":"black","role":"knight"},"enPassant":false}],
      ["direct.black","rules.transition.event.capture","r3k3/N7/8/8/8/8/8/4K3 b - - 7 1","a8a7","4k3/r7/8/8/8/8/8/4K3 w - - 0 2",{"mover":{"color":"black"},"captured":{"color":"white","role":"knight"},"enPassant":false}],
      ["en-passant.white","rules.transition.event.capture","4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1","e5d6","4k3/8/3P4/8/8/8/8/4K3 b - - 0 1",{"mover":{"color":"white","role":"pawn"},"captured":{"color":"black","role":"pawn"},"enPassant":true}],
      ["en-passant.black","rules.transition.event.capture","4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 1","e4d3","4k3/8/8/8/8/3p4/8/4K3 w - - 0 2",{"mover":{"color":"black","role":"pawn"},"captured":{"color":"white","role":"pawn"},"enPassant":true}],
      ["castle-negative.white","rules.transition.event.capture","r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 1","e1h1","r3k2r/8/8/8/8/8/8/R4RK1 b kq - 8 1",null],
      ["castle-negative.black","rules.transition.event.capture","r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 7 1","e8h8","r4rk1/8/8/8/8/8/8/R3K2R w KQ - 8 2",null],
    ] satisfies readonly RuleFixture[]).map(fixture => ruleCase("capture", fixture)),
  },
  {
    sourceId: "python-chess.zeroing",
    sourceRevision: "3516d7c6c0879af724c2855fac5a304a4ef40949",
    licence: "GPL-3.0-or-later",
    url: "https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L3316-L3319",
    text: "    def is_zeroing(self, move: Move) -> bool:\n        \"\"\"Checks if the given pseudo-legal move is a capture or pawn move.\"\"\"\n        touched = BB_SQUARES[move.from_square] ^ BB_SQUARES[move.to_square]\n        return bool(touched & self.pawns or touched & self.occupied_co[not self.turn] or move.drop == PAWN)\n",
    operation: { id: "runtime.semantic.transition_edge", version: 1 },
    cases: ([
      ["pawn.white","rules.transition.event.clock_reset","4k3/8/8/8/8/8/P7/4K3 w - - 7 1","a2a3","4k3/8/8/8/8/P7/8/4K3 b - - 0 1",{"mover":{"color":"white"},"detail":{"pawnMove":true,"capture":false}}],
      ["pawn.black","rules.transition.event.clock_reset","4k3/p7/8/8/8/8/8/4K3 b - - 7 1","a7a6","4k3/8/p7/8/8/8/8/4K3 w - - 0 2",{"mover":{"color":"black"},"detail":{"pawnMove":true,"capture":false}}],
      ["capture.white","rules.transition.event.clock_reset","4k3/8/8/8/8/8/n7/R3K3 w - - 7 1","a1a2","4k3/8/8/8/8/8/R7/4K3 b - - 0 1",{"mover":{"color":"white"},"detail":{"pawnMove":false,"capture":true}}],
      ["capture.black","rules.transition.event.clock_reset","r3k3/N7/8/8/8/8/8/4K3 b - - 7 1","a8a7","4k3/r7/8/8/8/8/8/4K3 w - - 0 2",{"mover":{"color":"black"},"detail":{"pawnMove":false,"capture":true}}],
      ["castle-negative.white","rules.transition.event.clock_reset","r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 1","e1h1","r3k2r/8/8/8/8/8/8/R4RK1 b kq - 8 1",null],
      ["castle-negative.black","rules.transition.event.clock_reset","r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 7 1","e8h8","r4rk1/8/8/8/8/8/8/R3K2R w KQ - 8 2",null],
    ] satisfies readonly RuleFixture[]).map(fixture => ruleCase("zeroing", fixture)),
  },
  {
    sourceId: "python-chess.check",
    sourceRevision: "3516d7c6c0879af724c2855fac5a304a4ef40949",
    licence: "GPL-3.0-or-later",
    url: "https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L1906-L1920",
    text: "    def checkers_mask(self) -> Bitboard:\n        king = self.king(self.turn)\n        return BB_EMPTY if king is None else self.attackers_mask(not self.turn, king)\n\n    def checkers(self) -> SquareSet:\n        \"\"\"\n        Gets the pieces currently giving check.\n\n        Returns a :class:`set of squares <chess.SquareSet>`.\n        \"\"\"\n        return SquareSet(self.checkers_mask())\n\n    def is_check(self) -> bool:\n        \"\"\"Tests if the current side to move is in check.\"\"\"\n        return bool(self.checkers_mask())\n",
    operation: { id: "runtime.semantic.local_edge", version: 1 },
    cases: ([
      ["direct.white","rules.tactic.event.check","4k3/8/8/8/8/8/8/R3K3 w - - 0 1","a1a8","R3k3/8/8/8/8/8/8/4K3 b - - 1 1",{"checkingPieces":[{"piece":{"color":"white","role":"rook"},"square":"a8"}],"checkedKing":{"piece":{"color":"black","role":"king"},"square":"e8"}}],
      ["direct.black","rules.tactic.event.check","r3k3/8/8/8/8/8/8/4K3 b - - 0 1","a8a1","4k3/8/8/8/8/8/8/r3K3 w - - 1 2",{"checkingPieces":[{"piece":{"color":"black","role":"rook"},"square":"a1"}],"checkedKing":{"piece":{"color":"white","role":"king"},"square":"e1"}}],
      ["discovered.white","rules.tactic.event.check","4k3/8/8/8/8/8/4B3/4R1K1 w - - 0 1","e2d3","4k3/8/8/8/8/3B4/8/4R1K1 b - - 1 1",{"checkingPieces":[{"piece":{"color":"white","role":"rook"},"square":"e1"}],"checkedKing":{"piece":{"color":"black","role":"king"},"square":"e8"}}],
      ["discovered.black","rules.tactic.event.check","4r1k1/4b3/8/8/8/8/8/4K3 b - - 0 1","e7d6","4r1k1/8/3b4/8/8/8/8/4K3 w - - 1 2",{"checkingPieces":[{"piece":{"color":"black","role":"rook"},"square":"e8"}],"checkedKing":{"piece":{"color":"white","role":"king"},"square":"e1"}}],
      ["blocked-negative.white","rules.tactic.event.check","2b1k3/8/8/8/8/8/8/R3K3 w - - 0 1","a1a8","R1b1k3/8/8/8/8/8/8/4K3 b - - 1 1",null],
      ["blocked-negative.black","rules.tactic.event.check","r3k3/8/8/8/8/8/8/2B1K3 b - - 0 1","a8a1","4k3/8/8/8/8/8/8/r1B1K3 w - - 1 2",null],
    ] satisfies readonly RuleFixture[]).map(fixture => ruleCase("check", fixture)),
  },
  {
    sourceId: "python-chess.rights",
    sourceRevision: "3516d7c6c0879af724c2855fac5a304a4ef40949",
    licence: "GPL-3.0-or-later",
    url: "https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py#L3321-L3326",
    text: "    def _reduces_castling_rights(self, move: Move) -> bool:\n        cr = self.clean_castling_rights()\n        touched = BB_SQUARES[move.from_square] ^ BB_SQUARES[move.to_square]\n        return bool(touched & cr or\n                    cr & BB_RANK_1 and touched & self.kings & self.occupied_co[WHITE] & ~self.promoted or\n                    cr & BB_RANK_8 and touched & self.kings & self.occupied_co[BLACK] & ~self.promoted)\n",
    operation: { id: "runtime.semantic.local_edge", version: 1 },
    cases: ([
      ["rook.white","rules.castling.event.rights_lost","r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 1","a1a2","r3k2r/8/8/8/8/8/R7/4K2R b Kkq - 8 1",{"color":"white","wing":"queenside","cause":"rook_moved"}],
      ["rook.black","rules.castling.event.rights_lost","r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 7 1","a8a7","4k2r/r7/8/8/8/8/8/R3K2R w KQk - 8 2",{"color":"black","wing":"queenside","cause":"rook_moved"}],
      ["king.white","rules.castling.event.rights_lost","r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 1","e1e2","r3k2r/8/8/8/8/8/4K3/R6R b kq - 8 1",{"color":"white","cause":"king_moved"}],
      ["king.black","rules.castling.event.rights_lost","r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 7 1","e8e7","r6r/4k3/8/8/8/8/8/R3K2R w KQ - 8 2",{"color":"black","cause":"king_moved"}],
      ["absent-negative.white","rules.castling.event.rights_lost","r3k2r/8/8/8/8/8/8/R3K2R w kq - 7 1","a1a2","r3k2r/8/8/8/8/8/R7/4K2R b kq - 8 1",null],
      ["absent-negative.black","rules.castling.event.rights_lost","r3k2r/8/8/8/8/8/8/R3K2R b KQ - 7 1","a8a7","4k2r/r7/8/8/8/8/8/R3K2R w KQ - 8 2",null],
    ] satisfies readonly RuleFixture[]).map(fixture => ruleCase("rights", fixture)),
  },
] as const);
