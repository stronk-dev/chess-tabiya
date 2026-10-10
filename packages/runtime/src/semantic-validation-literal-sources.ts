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

const literalSources = Object.freeze([
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

// D3663: a legal castle touches a friendly rook but captures no piece. A capture
// exchange, a captured defender, and elimination by capture of the last role are
// therefore absent. Reuse the independently retained is_capture rule, never an
// undefined capture argument or a freshly generated strategic judgement.
export const CAPTURE_DEPENDENT_NEGATIVE_FAMILIES = Object.freeze([
  { id: "capture-class", projection: "derived.exchange.capture_class", operation: "runtime.semantic.local_edge" },
  { id: "defender-removed", projection: "rules.tactic.event.defender_removed", operation: "runtime.semantic.local_edge" },
  { id: "last-role", projection: "rules.transition.event.last_of_role", operation: "runtime.semantic.transition_edge" },
] as const);
const captureSource = literalSources[0];

// D3676: literal piece-set arithmetic only. With one pawn of each colour on
// every file at ranks 2/7, no file lacks pawns, no pawn lacks an adjacent
// friendly pawn, no file has two same-colour pawns, and every pawn faces an
// opposing pawn ahead. King steps preserve those operands. These cases bind
// the existing structural vocabulary's absence, not strategic value or a
// general positive/orientation proof. The two excerpts are labelled separately.
const pawnAbsenceSources = ["backward_pawn", "isolated_pawn", "doubled_pawn", "passed_pawn", "open_file", "half_open_file"].map(family => ({
  sourceId: `python-chess.pawn-absence.${family}`,
  sourceRevision: captureSource.sourceRevision,
  licence: captureSource.licence,
  url: `https://github.com/niklasf/python-chess/blob/${captureSource.sourceRevision}/chess/__init__.py`,
  text: "pieces_mask pawn branch:\n        if piece_type == PAWN:\n            bb = self.pawns\n\npieces_mask colour intersection:\n        return bb & self.occupied_co[color]\n",
  operation: { id: "runtime.semantic.structural_edge", version: 1 } as const,
  cases: ([
    ["white", `rules.structural.event.${family}`, "7k/pppppppp/8/8/8/8/PPPPPPPP/7K w - - 7 1", "h1g1", "7k/pppppppp/8/8/8/8/PPPPPPPP/6K1 b - - 8 1", null],
    ["black", `rules.structural.event.${family}`, "7k/pppppppp/8/8/8/8/PPPPPPPP/7K b - - 7 1", "h8g8", "6k1/pppppppp/8/8/8/8/PPPPPPPP/7K w - - 8 2", null],
  ] satisfies readonly RuleFixture[]).map(fixture => ruleCase(`pawn-absence.${family}`, fixture)),
}));

// D3666: the two labelled excerpts below are separate branches of attacks_mask,
// not a fabricated contiguous function. A pawn and distant kings have no slider,
// enemy pawn or occupied attack/defence edge before or after the isolated push.
// Resetting the halfmove clock proves the operation completed actual legal play.
// These cases assert absence only, never the strategic value of the advance.
const contactRules = {
  sourceRevision: captureSource.sourceRevision,
  licence: captureSource.licence,
  url: `https://github.com/niklasf/python-chess/blob/${captureSource.sourceRevision}/chess/__init__.py`,
  text: "attacks_mask pawn branch:\n        if bb_square & self.pawns:\n            color = bool(bb_square & self.occupied_co[WHITE])\n            return BB_PAWN_ATTACKS[color][square]\n\nattacks_mask king branch:\n        elif bb_square & self.kings:\n            return BB_KING_ATTACKS[square]\n",
} as const;
const CONTACT_NEGATIVE_FAMILIES = ["occupied_attack", "occupied_defence", "slider_ray", "pawn_contact", "defended_duty"] as const;

// D3667: exact geometric transitions and the EXISTING two-attacked-target duty
// count, not a claim that a defender is overloaded or that a move is good.
// These deliberately include opponent pawn moves creating/releasing a stationary
// defender's counted duties. Old source manifests and case bytes remain intact.
const contactTransitionFixtures: readonly RuleFixture[] = [
  ["occupied_attack.gained.white", "rules.transition.event.occupied_attack", "7k/8/8/8/1n6/8/P7/7K w - - 7 1", "a2a3", "7k/8/8/8/1n6/P7/8/7K b - - 0 1", { subject: { color: "white", target: "b4", occupant: { color: "black", role: "knight" } }, sign: "gained", targets_before: [], targets_after: ["a3"] }],
  ["occupied_attack.gained.black", "rules.transition.event.occupied_attack", "7k/p7/8/1N6/8/8/8/7K b - - 7 1", "a7a6", "7k/8/p7/1N6/8/8/8/7K w - - 0 2", { subject: { color: "black", target: "b5", occupant: { color: "white", role: "knight" } }, sign: "gained", targets_before: [], targets_after: ["a6"] }],
  ["occupied_attack.lost.white", "rules.transition.event.occupied_attack", "7k/8/8/8/1n6/P7/8/7K w - - 7 1", "a3a4", "7k/8/8/8/Pn6/8/8/7K b - - 0 1", { subject: { color: "white", target: "b4", occupant: { color: "black", role: "knight" } }, sign: "lost", targets_before: ["a3"], targets_after: [] }],
  ["occupied_attack.lost.black", "rules.transition.event.occupied_attack", "7k/8/p7/1N6/8/8/8/7K b - - 7 1", "a6a5", "7k/8/8/pN6/8/8/8/7K w - - 0 2", { subject: { color: "black", target: "b5", occupant: { color: "white", role: "knight" } }, sign: "lost", targets_before: ["a6"], targets_after: [] }],
  ["occupied_defence.gained.white", "rules.transition.event.occupied_defence", "7k/8/8/8/1N6/8/P7/7K w - - 7 1", "a2a3", "7k/8/8/8/1N6/P7/8/7K b - - 0 1", { subject: { color: "white", target: "b4", occupant: { color: "white", role: "knight" } }, sign: "gained", targets_before: [], targets_after: ["a3"] }],
  ["occupied_defence.gained.black", "rules.transition.event.occupied_defence", "7k/p7/8/1n6/8/8/8/7K b - - 7 1", "a7a6", "7k/8/p7/1n6/8/8/8/7K w - - 0 2", { subject: { color: "black", target: "b5", occupant: { color: "black", role: "knight" } }, sign: "gained", targets_before: [], targets_after: ["a6"] }],
  ["occupied_defence.lost.white", "rules.transition.event.occupied_defence", "7k/8/8/8/1N6/P7/8/7K w - - 7 1", "a3a4", "7k/8/8/8/PN6/8/8/7K b - - 0 1", { subject: { color: "white", target: "b4", occupant: { color: "white", role: "knight" } }, sign: "lost", targets_before: ["a3"], targets_after: [] }],
  ["occupied_defence.lost.black", "rules.transition.event.occupied_defence", "7k/8/p7/1n6/8/8/8/7K b - - 7 1", "a6a5", "7k/8/8/pn6/8/8/8/7K w - - 0 2", { subject: { color: "black", target: "b5", occupant: { color: "black", role: "knight" } }, sign: "lost", targets_before: ["a6"], targets_after: [] }],
  ["slider_ray.gained.white", "rules.transition.event.slider_ray", "7k/8/8/8/8/8/R1P5/7K w - - 7 1", "c2c3", "7k/8/8/8/8/2P5/R7/7K b - - 0 1", { subject: { slider: "a2", color: "white", role: "rook", endpoint: "h2" }, sign: "gained", targets_before: ["c2"], targets_after: [] }],
  ["slider_ray.gained.black", "rules.transition.event.slider_ray", "7k/r1p5/8/8/8/8/8/7K b - - 7 1", "c7c6", "7k/r7/2p5/8/8/8/8/7K w - - 0 2", { subject: { slider: "a7", color: "black", role: "rook", endpoint: "h7" }, sign: "gained", targets_before: ["c7"], targets_after: [] }],
  ["slider_ray.lost.white", "rules.transition.event.slider_ray", "7k/8/8/8/8/R7/2P5/7K w - - 7 1", "c2c3", "7k/8/8/8/8/R1P5/8/7K b - - 0 1", { subject: { slider: "a3", color: "white", role: "rook", endpoint: "h3" }, sign: "lost", targets_before: [], targets_after: ["c3"] }],
  ["slider_ray.lost.black", "rules.transition.event.slider_ray", "7k/2p5/r7/8/8/8/8/7K b - - 7 1", "c7c6", "7k/8/r1p5/8/8/8/8/7K w - - 0 2", { subject: { slider: "a6", color: "black", role: "rook", endpoint: "h6" }, sign: "lost", targets_before: [], targets_after: ["c6"] }],
  ["defended_duty.gained.white", "rules.transition.event.defended_duty", "7k/8/4p3/p7/1N1N4/2P5/8/7K b - - 7 1", "e6e5", "7k/8/8/p3p3/1N1N4/2P5/8/7K w - - 0 2", { subject: { piece: "c3", color: "white", role: "pawn" }, sign: "gained", targets_before: ["b4"], targets_after: ["b4", "d4"] }],
  ["defended_duty.gained.black", "rules.transition.event.defended_duty", "7k/8/2p5/1n1n4/P7/4P3/8/7K w - - 7 1", "e3e4", "7k/8/2p5/1n1n4/P3P3/8/8/7K b - - 0 1", { subject: { piece: "c6", color: "black", role: "pawn" }, sign: "gained", targets_before: ["b5"], targets_after: ["b5", "d5"] }],
  ["defended_duty.lost.white", "rules.transition.event.defended_duty", "7k/8/8/p3p3/1N1N4/2P5/8/7K b - - 7 1", "e5e4", "7k/8/8/p7/1N1Np3/2P5/8/7K w - - 0 2", { subject: { piece: "c3", color: "white", role: "pawn" }, sign: "lost", targets_before: ["b4", "d4"], targets_after: ["b4"] }],
  ["defended_duty.lost.black", "rules.transition.event.defended_duty", "7k/8/2p5/1n1n4/P3P3/8/8/7K w - - 7 1", "e4e5", "7k/8/2p5/1n1nP3/P7/8/8/7K b - - 0 1", { subject: { piece: "c6", color: "black", role: "pawn" }, sign: "lost", targets_before: ["b5", "d5"], targets_after: ["b5"] }],
  ...["occupied_attack", "occupied_defence"].flatMap(family => ([
    [`${family}.populated-negative.white`, `rules.transition.event.${family}`, "7k/8/8/8/8/1N1n4/P1P5/7K w - - 7 1", "a2a3", "7k/8/8/8/8/PN1n4/2P5/7K b - - 0 1", null],
    [`${family}.populated-negative.black`, `rules.transition.event.${family}`, "7k/p1p5/1n1N4/8/8/8/8/7K b - - 7 1", "a7a6", "7k/2p5/pn1N4/8/8/8/8/7K w - - 0 2", null],
  ] satisfies readonly RuleFixture[])),
  ["slider_ray.populated-negative.white", "rules.transition.event.slider_ray", "7k/8/8/8/8/1P6/R1P5/7K w - - 7 1", "b3b4", "7k/8/8/8/1P6/8/R1P5/7K b - - 0 1", null],
  ["slider_ray.populated-negative.black", "rules.transition.event.slider_ray", "7k/r1p5/1p6/8/8/8/8/7K b - - 7 1", "b6b5", "7k/r1p5/8/1p6/8/8/8/7K w - - 0 2", null],
  ["defended_duty.populated-negative.white", "rules.transition.event.defended_duty", "7k/8/4p3/8/1N1N4/2P5/8/7K b - - 7 1", "e6e5", "7k/8/8/4p3/1N1N4/2P5/8/7K w - - 0 2", null],
  ["defended_duty.populated-negative.black", "rules.transition.event.defended_duty", "7k/8/2p5/1n1n4/8/4P3/8/7K w - - 7 1", "e3e4", "7k/8/2p5/1n1n4/4P3/8/8/7K b - - 0 1", null],
];

export const SEMANTIC_VALIDATION_LITERAL_SOURCES = Object.freeze([
  ...pawnAbsenceSources,
  ...literalSources,
  {
    ...contactRules,
    sourceId: "python-chess.contact-transitions",
    // Separately labelled excerpt from attacks_mask, lines 889–891 of the same
    // immutable revision. Existing pawn/king source records are not overwritten.
    text: `${contactRules.text}\nattacks_mask rook/queen branch:\n            if bb_square & self.rooks or bb_square & self.queens:\n                attacks |= (BB_RANK_ATTACKS[square][BB_RANK_MASKS[square] & self.occupied] |\n                            BB_FILE_ATTACKS[square][BB_FILE_MASKS[square] & self.occupied])\n`,
    operation: { id: "runtime.semantic.transition_edge", version: 1 } as const,
    cases: contactTransitionFixtures.map(([id, ...rest]) => {
      const dot = id.indexOf(".");
      return ruleCase(id.slice(0, dot), [id.slice(dot + 1), ...rest]);
    }),
  },
  ...CONTACT_NEGATIVE_FAMILIES.map(family => ({
    ...contactRules,
    sourceId: `python-chess.${family}`,
    operation: { id: "runtime.semantic.transition_edge", version: 1 } as const,
    cases: ([
      [`isolated-push.white`, `rules.transition.event.${family}`, "7k/8/8/8/8/8/P7/7K w - - 7 1", "a2a3", "7k/8/8/8/8/P7/8/7K b - - 0 1", null],
      [`isolated-push.black`, `rules.transition.event.${family}`, "7k/p7/8/8/8/8/8/7K b - - 7 1", "a7a6", "7k/8/p7/8/8/8/8/7K w - - 0 2", null],
    ] satisfies readonly RuleFixture[]).map(fixture => ruleCase(family, fixture)),
  })),
  ...CAPTURE_DEPENDENT_NEGATIVE_FAMILIES.map(family => ({
    sourceId: `python-chess.capture.${family.id}`,
    sourceRevision: captureSource.sourceRevision,
    licence: captureSource.licence,
    url: captureSource.url,
    text: captureSource.text,
    operation: { id: family.operation, version: 1 } as const,
    cases: captureSource.cases.filter(row => row.arm === "semantic_negative").map(row => ({
      ...row,
      proposition: {
        ...row.proposition,
        subject: { kind: "event", projection: { id: family.projection, version: 1 } } as const,
        case: { id: row.proposition.case.id.replace(".capture.", `.${family.id}.`), version: 1 } as const,
      },
    })),
  })),
]);
