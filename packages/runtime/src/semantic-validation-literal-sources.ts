/** Build/test-only rule fixtures. Never imported by production collectors or the runtime barrel.
 * D3639 / semantic-validation-authority Slice B. Excerpts retained verbatim from python-chess
 * 1.11.2 at 3516d7c6c0879af724c2855fac5a304a4ef40949, Copyright Niklas Fiekas;
 * GPL-3.0-or-later. Corresponding source and licence:
 * https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
 * https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
 * Literal positions instantiate those rules only; none grades a move or claims strategic value.
 */
import type { SemanticCanonicalValue, SemanticEdgeInput, SemanticValidationPropositionRecord } from "./semantic-validation.js";
import { recordedValidationSources } from "./semantic-validation-recorded-sources.js";

type RuleFixture = readonly [id: string, projection: string, beforeFen: string, moveUci: string, afterFen: string, operands: Readonly<Record<string, SemanticCanonicalValue>> | null];
function ruleCase(family: string, fixture: RuleFixture, source = "python-chess") {
  const [suffix, projection, beforeFen, moveUci, afterFen, operands] = fixture;
  return {
    arm: operands === null ? "semantic_negative" as const : "positive" as const,
    input: { kind: "edge", beforeFen, moveUci, afterFen } satisfies SemanticEdgeInput,
    proposition: {
      subject: { kind: "event", projection: { id: projection, version: 1 } },
      case: { id: `cited.${source}.${family}.${suffix}`, version: 1 },
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

// D3688: count vectors and finite legal/local-exchange facts, not advantage,
// general safety or a recommended move. Each small excerpt below is separately
// labelled and retained from the same independent GPL revision as the old cases.
const roleStateFixtures: readonly RuleFixture[] = [
  ["capture.white", "derived.material.event.role_asymmetry", "4k3/8/8/8/8/8/n7/R3K3 w - - 7 1", "a1a2", "4k3/8/8/8/8/8/R7/4K3 b - - 0 1", { changedRoles: ["knight"], before: { vector: { pawn: 0, knight: 1, bishop: 0, rook: 1, queen: 0 }, magnitude: 2 }, after: { vector: { pawn: 0, knight: 0, bishop: 0, rook: 1, queen: 0 }, magnitude: 1 }, increased: false }],
  ["capture.black", "derived.material.event.role_asymmetry", "r3k3/N7/8/8/8/8/8/4K3 b - - 7 1", "a8a7", "4k3/r7/8/8/8/8/8/4K3 w - - 0 2", { changedRoles: ["knight"], before: { vector: { pawn: 0, knight: 1, bishop: 0, rook: 1, queen: 0 }, magnitude: 2 }, after: { vector: { pawn: 0, knight: 0, bishop: 0, rook: 1, queen: 0 }, magnitude: 1 }, increased: false }],
  ...["queen", "knight"].flatMap(role => {
    const vector = { pawn: 0, knight: role === "knight" ? 1 : 0, bishop: 0, rook: 0, queen: role === "queen" ? 1 : 0 };
    const suffix = role === "queen" ? "q" : "n", piece = role === "queen" ? "Q" : "N";
    const operands = { changedRoles: ["pawn", role], before: { vector: { pawn: 1, knight: 0, bishop: 0, rook: 0, queen: 0 }, magnitude: 1 }, after: { vector, magnitude: 1 }, increased: false };
    return [
      [`promotion-${role}.white`, "derived.material.event.role_asymmetry", "7k/P7/8/8/8/8/8/7K w - - 7 1", `a7a8${suffix}`, `${piece}6k/8/8/8/8/8/8/7K b - - 0 1`, operands],
      [`promotion-${role}.black`, "derived.material.event.role_asymmetry", "7k/8/8/8/8/8/p7/7K b - - 7 1", `a2a1${suffix}`, `7k/8/8/8/8/8/8/${piece.toLowerCase()}6K w - - 0 2`, operands],
    ] satisfies readonly RuleFixture[];
  }),
  ["quiet-negative.white", "derived.material.event.role_asymmetry", "6k1/8/8/8/8/2B5/P7/6K1 w - - 7 1", "a2a3", "6k1/8/8/8/8/P1B5/8/6K1 b - - 0 1", null],
  ["quiet-negative.black", "derived.material.event.role_asymmetry", "6k1/p7/2b5/8/8/8/8/6K1 b - - 7 1", "a7a6", "6k1/8/p1b5/8/8/8/8/6K1 w - - 0 2", null],
  ["castle-negative.white", "derived.material.event.role_asymmetry", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 7 1", "e1h1", "r3k2r/8/8/8/8/8/8/R4RK1 b kq - 8 1", null],
  ["castle-negative.black", "derived.material.event.role_asymmetry", "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 7 1", "e8h8", "r4rk1/8/8/8/8/8/8/R3K2R w KQ - 8 2", null],
];

const destinationFixtures: readonly RuleFixture[] = [
  ["ray-open.white", "rules.mobility.event.piece_destinations", "7k/8/8/8/8/8/R1P5/7K w - - 7 1", "c2c3", "7k/8/8/8/8/2P5/R7/7K b - - 0 1", { color: "white", piece: { before: { square: "a2", role: "rook" }, after: { square: "a2", role: "rook" } }, legalGained: ["c2", "d2", "e2", "f2", "g2", "h2"], legalLost: [], safeGained: ["c2", "d2", "e2", "f2", "g2", "h2"], safeLost: [], moved: false, zeroSafe: false }],
  ["ray-open.black", "rules.mobility.event.piece_destinations", "7k/r1p5/8/8/8/8/8/7K b - - 7 1", "c7c6", "7k/r7/2p5/8/8/8/8/7K w - - 0 2", { color: "black", piece: { before: { square: "a7", role: "rook" }, after: { square: "a7", role: "rook" } }, legalGained: ["c7", "d7", "e7", "f7", "g7", "h7"], legalLost: [], safeGained: ["c7", "d7", "e7", "f7", "g7", "h7"], safeLost: [], moved: false, zeroSafe: false }],
  ["pawn-prevention.white", "rules.mobility.event.piece_destinations", "k7/8/3p4/8/8/2N5/8/7K b - - 7 1", "d6d5", "k7/8/8/3p4/8/2N5/8/7K w - - 0 2", { color: "white", piece: { before: { square: "c3", role: "knight" }, after: { square: "c3", role: "knight" } }, legalGained: [], legalLost: [], safeGained: [], safeLost: ["e4"], moved: false, zeroSafe: false }],
  ["pawn-prevention.black", "rules.mobility.event.piece_destinations", "7k/8/2n5/8/8/3P4/8/K7 w - - 7 1", "d3d4", "7k/8/2n5/8/3P4/8/8/K7 b - - 0 1", { color: "black", piece: { before: { square: "c6", role: "knight" }, after: { square: "c6", role: "knight" } }, legalGained: [], legalLost: [], safeGained: [], safeLost: ["e5"], moved: false, zeroSafe: false }],
  ["quiet-negative.white", "rules.mobility.event.piece_destinations", "6k1/8/8/8/8/2B5/P7/6K1 w - - 7 1", "a2a3", "6k1/8/8/8/8/P1B5/8/6K1 b - - 0 1", null],
  ["quiet-negative.black", "rules.mobility.event.piece_destinations", "6k1/p7/2b5/8/8/8/8/6K1 b - - 7 1", "a7a6", "6k1/8/p1b5/8/8/8/8/6K1 w - - 0 2", null],
];

export const RULE_STATE_CITED_SOURCES = Object.freeze([
  {
    sourceId: "python-chess.rule-state.material",
    sourceRevision: captureSource.sourceRevision,
    licence: captureSource.licence,
    url: `https://github.com/niklasf/python-chess/blob/${captureSource.sourceRevision}/chess/__init__.py`,
    text: "pieces_mask role branches:\n        if piece_type == PAWN:\n            bb = self.pawns\n        elif piece_type == KNIGHT:\n            bb = self.knights\n        elif piece_type == BISHOP:\n            bb = self.bishops\n        elif piece_type == ROOK:\n            bb = self.rooks\n        elif piece_type == QUEEN:\n            bb = self.queens\n\npieces_mask colour intersection:\n        return bb & self.occupied_co[color]\n",
    operation: { id: "runtime.semantic.local_edge", version: 1 } as const,
    cases: roleStateFixtures.map(fixture => ruleCase("rule-state.material", fixture)),
  },
  {
    sourceId: "python-chess.rule-state.mobility",
    sourceRevision: captureSource.sourceRevision,
    licence: captureSource.licence,
    url: `https://github.com/niklasf/python-chess/blob/${captureSource.sourceRevision}/chess/__init__.py`,
    text: "attacks_mask pawn/knight/king branches:\n        if bb_square & self.pawns:\n            color = bool(bb_square & self.occupied_co[WHITE])\n            return BB_PAWN_ATTACKS[color][square]\n        elif bb_square & self.knights:\n            return BB_KNIGHT_ATTACKS[square]\n        elif bb_square & self.kings:\n            return BB_KING_ATTACKS[square]\n\nattacks_mask bishop/rook branches:\n            if bb_square & self.bishops or bb_square & self.queens:\n                attacks = BB_DIAG_ATTACKS[square][BB_DIAG_MASKS[square] & self.occupied]\n            if bb_square & self.rooks or bb_square & self.queens:\n                attacks |= (BB_RANK_ATTACKS[square][BB_RANK_MASKS[square] & self.occupied] |\n                            BB_FILE_ATTACKS[square][BB_FILE_MASKS[square] & self.occupied])\n",
    operation: { id: "runtime.semantic.local_edge", version: 1 } as const,
    cases: destinationFixtures.map(fixture => ruleCase("rule-state.mobility", fixture)),
  },
]);

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

// D3685: finite position facts, not evaluation scores or a universal definition
// borrowed from an engine heuristic. The backward cases have a real adjacent
// friendly pawn ahead and an enemy pawn attacking the empty stop square; the
// doubled cases use adjacent ranks. Those operands satisfy both the cited
// independent convention and the existing collector. Open means semi-open for
// both colours; half-open additionally retains an enemy pawn on the file.
// Source excerpts below are separately labelled, not a fabricated contiguous
// function. Stockfish sf_15, Copyright 2004–2022 The Stockfish developers,
// GPL-3.0-or-later; full corresponding source/licence:
// https://github.com/official-stockfish/Stockfish/tree/sf_15
// https://github.com/official-stockfish/Stockfish/blob/sf_15/Copying.txt
const pawnMembershipFixtures = [
  ["backward_pawn", "gained", "white", "7k/8/p7/1N6/3P4/2P5/8/7K b - - 7 1", "a6b5", "7k/8/8/1p6/3P4/2P5/8/7K w - - 0 2"],
  ["backward_pawn", "gained", "black", "7k/8/2p5/3p4/1n6/P7/8/7K w - - 7 1", "a3b4", "7k/8/2p5/3p4/1P6/8/8/7K b - - 0 1"],
  ["backward_pawn", "lost", "white", "7k/8/8/1p6/3P4/N1P5/8/7K w - - 7 1", "a3b5", "7k/8/8/1N6/3P4/2P5/8/7K b - - 0 1"],
  ["backward_pawn", "lost", "black", "7k/8/n1p5/3p4/1P6/8/8/7K b - - 7 1", "a6b4", "7k/8/2p5/3p4/1n6/8/8/7K w - - 0 2"],
  ["backward_pawn", "preserved", "white", "7k/8/8/1p6/3P4/2P5/8/7K w - - 7 1", "h1g1", "7k/8/8/1p6/3P4/2P5/8/6K1 b - - 8 1"],
  ["backward_pawn", "preserved", "black", "7k/8/2p5/3p4/1P6/8/8/7K b - - 7 1", "h8g8", "6k1/8/2p5/3p4/1P6/8/8/7K w - - 8 2"],
  ["isolated_pawn", "gained", "white", "7k/8/8/4p3/3P4/2P5/8/7K w - - 7 1", "d4e5", "7k/8/8/4P3/8/2P5/8/7K b - - 0 1"],
  ["isolated_pawn", "gained", "black", "7k/8/2p5/3p4/4P3/8/8/7K b - - 7 1", "d5e4", "7k/8/2p5/8/4p3/8/8/7K w - - 0 2"],
  ["isolated_pawn", "lost", "white", "7k/8/8/8/8/2Pn4/4P3/7K w - - 7 1", "e2d3", "7k/8/8/8/8/2PP4/8/7K b - - 0 1"],
  ["isolated_pawn", "lost", "black", "7k/4p3/2pN4/8/8/8/8/7K b - - 7 1", "e7d6", "7k/8/2pp4/8/8/8/8/7K w - - 0 2"],
  ["isolated_pawn", "preserved", "white", "7k/8/8/8/8/2P5/8/7K w - - 7 1", "h1g1", "7k/8/8/8/8/2P5/8/6K1 b - - 8 1"],
  ["isolated_pawn", "preserved", "black", "7k/8/2p5/8/8/8/8/7K b - - 7 1", "h8g8", "6k1/8/2p5/8/8/8/8/7K w - - 8 2"],
  ["doubled_pawn", "gained", "white", "7k/8/8/8/2n5/2PP4/8/7K w - - 7 1", "d3c4", "7k/8/8/8/2P5/2P5/8/7K b - - 0 1"],
  ["doubled_pawn", "gained", "black", "7k/8/2pp4/2N5/8/8/8/7K b - - 7 1", "d6c5", "7k/8/2p5/2p5/8/8/8/7K w - - 0 2"],
  ["doubled_pawn", "lost", "white", "7k/8/8/3b4/2P5/2P5/8/7K w - - 7 1", "c4d5", "7k/8/8/3P4/8/2P5/8/7K b - - 0 1"],
  ["doubled_pawn", "lost", "black", "7k/8/2p5/2p5/3B4/8/8/7K b - - 7 1", "c5d4", "7k/8/2p5/8/3p4/8/8/7K w - - 0 2"],
  ["doubled_pawn", "preserved", "white", "7k/8/8/8/2P5/2P5/8/7K w - - 7 1", "h1g1", "7k/8/8/8/2P5/2P5/8/6K1 b - - 8 1"],
  ["doubled_pawn", "preserved", "black", "7k/8/2p5/2p5/8/8/8/7K b - - 7 1", "h8g8", "6k1/8/2p5/2p5/8/8/8/7K w - - 8 2"],
  ["passed_pawn", "gained", "white", "7k/8/8/3p4/2P1P3/8/8/7K w - - 7 1", "e4d5", "7k/8/8/3P4/2P5/8/8/7K b - - 0 1"],
  ["passed_pawn", "gained", "black", "7k/8/8/2p1p3/3P4/8/8/7K b - - 7 1", "e5d4", "7k/8/8/2p5/3p4/8/8/7K w - - 0 2"],
  ["passed_pawn", "lost", "white", "7k/8/4p3/3N4/2P5/8/8/7K b - - 7 1", "e6d5", "7k/8/8/3p4/2P5/8/8/7K w - - 0 2"],
  ["passed_pawn", "lost", "black", "7k/8/8/2p5/3n4/4P3/8/7K w - - 7 1", "e3d4", "7k/8/8/2p5/3P4/8/8/7K b - - 0 1"],
  ["passed_pawn", "preserved", "white", "7k/8/8/8/2P5/8/8/7K w - - 7 1", "h1g1", "7k/8/8/8/2P5/8/8/6K1 b - - 8 1"],
  ["passed_pawn", "preserved", "black", "7k/8/8/2p5/8/8/8/7K b - - 7 1", "h8g8", "6k1/8/8/2p5/8/8/8/7K w - - 8 2"],
  ["open_file", "gained", "white", "7k/8/8/8/3n4/2P5/8/7K w - - 7 1", "c3d4", "7k/8/8/8/3P4/8/8/7K b - - 0 1"],
  ["open_file", "gained", "black", "7k/8/2p5/3N4/8/8/8/7K b - - 7 1", "c6d5", "7k/8/8/3p4/8/8/8/7K w - - 0 2"],
  ["open_file", "lost", "white", "7k/8/8/8/2n5/3P4/8/7K w - - 7 1", "d3c4", "7k/8/8/8/2P5/8/8/7K b - - 0 1"],
  ["open_file", "lost", "black", "7k/8/3p4/2N5/8/8/8/7K b - - 7 1", "d6c5", "7k/8/8/2p5/8/8/8/7K w - - 0 2"],
  ["open_file", "preserved", "white", "7k/8/3p4/8/8/3P4/8/7K w - - 7 1", "h1g1", "7k/8/3p4/8/8/3P4/8/6K1 b - - 8 1"],
  ["open_file", "preserved", "black", "7k/8/3p4/8/8/3P4/8/7K b - - 7 1", "h8g8", "6k1/8/3p4/8/8/3P4/8/7K w - - 8 2"],
  ["half_open_file", "gained", "white", "7k/8/2p5/8/3n4/2P5/8/7K w - - 7 1", "c3d4", "7k/8/2p5/8/3P4/8/8/7K b - - 0 1"],
  ["half_open_file", "gained", "black", "7k/8/2p5/3N4/8/2P5/8/7K b - - 7 1", "c6d5", "7k/8/8/3p4/8/2P5/8/7K w - - 0 2"],
  ["half_open_file", "lost", "white", "7k/8/2p5/8/2n5/3P4/8/7K w - - 7 1", "d3c4", "7k/8/2p5/8/2P5/8/8/7K b - - 0 1"],
  ["half_open_file", "lost", "black", "7k/8/3p4/2N5/8/2P5/8/7K b - - 7 1", "d6c5", "7k/8/8/2p5/8/2P5/8/7K w - - 0 2"],
  ["half_open_file", "preserved", "white", "7k/8/2p5/8/8/8/8/7K w - - 7 1", "h1g1", "7k/8/2p5/8/8/8/8/6K1 b - - 8 1"],
  ["half_open_file", "preserved", "black", "7k/8/8/8/8/2P5/8/7K b - - 7 1", "h8g8", "6k1/8/8/8/8/2P5/8/7K w - - 8 2"],
] as const;
const pawnMembershipSource = {
  sourceId: "stockfish.pawn-files",
  sourceRevision: "e6e324eb28fd49c1fc44b3b65784f85a773ec61c",
  licence: "GPL-3.0-or-later",
  url: "https://github.com/official-stockfish/Stockfish/tree/e6e324eb28fd49c1fc44b3b65784f85a773ec61c/src",
  text: "pawns.cpp evaluate flags:\n        doubled    = ourPawns   & (s - Up);\n        neighbours = ourPawns   & adjacent_files_bb(s);\n\npawns.cpp backward:\n        // A pawn is backward when it is behind all pawns of the same color on\n        // the adjacent files and cannot safely advance.\n        backward =  !(neighbours & forward_ranks_bb(Them, s + Up))\n                  && (leverPush | blocked);\n\npawns.cpp isolated branch:\n        else if (!neighbours)\n\nposition.h semi-open:\ninline bool Position::is_on_semiopen_file(Color c, Square s) const {\n  return !(pieces(c, PAWN) & file_bb(s));\n}\n\nposition.h passed:\ninline bool Position::pawn_passed(Color c, Square s) const {\n  return !(pieces(~c, PAWN) & passed_pawn_span(c, s));\n}\n",
  operation: { id: "runtime.semantic.structural_edge", version: 1 } as const,
  cases: pawnMembershipFixtures.map(([family, sign, color, before, move, after]) => {
    const observation = { kind: family, ...(family === "open_file" ? {} : { color }),
      ...(family === "passed_pawn" ? { squares: [color === "white" ? "c4" : "c5"] } : { file: "c", squares: [] }) };
    return ruleCase("pawn-files", [`${family}.${sign}.${color}`, `rules.structural.event.${family}`, before, move, after,
      { family, before: sign === "gained" ? null : observation, after: sign === "lost" ? null : observation }], "stockfish");
  }),
};

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
export const RECORDED_CITED_SOURCES = Object.freeze(recordedValidationSources(captureSource, contactRules));

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


const pawnDynamicsFixtures: readonly RuleFixture[] = [
  ["lock.white", "rules.pawn.event.dynamics", "7k/8/8/4p3/8/8/4P3/7K w - - 7 1", "e2e4", "7k/8/8/4p3/4P3/8/8/7K b - - 0 1", { kind: "locked_pair_gained", subjects: { white: { square: "e4", piece: { color: "white", role: "pawn" } }, black: { square: "e5", piece: { color: "black", role: "pawn" } } } }],
  ["lock.black", "rules.pawn.event.dynamics", "7k/4p3/8/8/4P3/8/8/7K b - - 7 1", "e7e5", "7k/8/8/4p3/4P3/8/8/7K w - - 0 2", { kind: "locked_pair_gained", subjects: { white: { square: "e4", piece: { color: "white", role: "pawn" } }, black: { square: "e5", piece: { color: "black", role: "pawn" } } } }],
  ...(["knight", "bishop"] as const).flatMap(role => {
    const piece = role === "knight" ? "n" : "b";
    return [
      [`harass-${role}.white`, "rules.pawn.event.dynamics", `7k/8/8/8/6${piece}1/8/7P/7K w - - 7 1`, "h2h3", `7k/8/8/8/6${piece}1/7P/8/7K b - - 0 1`, { kind: "minor_harassed", subjects: { pawn: { square: "h3", piece: { color: "white", role: "pawn" } }, minor: { square: "g4", piece: { color: "black", role } } } }],
      [`harass-${role}.black`, "rules.pawn.event.dynamics", `7k/7p/8/6${piece.toUpperCase()}1/8/8/8/7K b - - 7 1`, "h7h6", `7k/8/7p/6${piece.toUpperCase()}1/8/8/8/7K w - - 0 2`, { kind: "minor_harassed", subjects: { pawn: { square: "h6", piece: { color: "black", role: "pawn" } }, minor: { square: "g5", piece: { color: "white", role } } } }],
    ] satisfies readonly RuleFixture[];
  }),
  ["protected.white", "rules.pawn.event.dynamics", "7k/8/8/3P4/8/8/2P5/7K w - - 7 1", "c2c4", "7k/8/8/3P4/2P5/8/8/7K b - - 0 1", { kind: "protected_passer_gained", subjects: { pawn: { square: "d5", piece: { color: "white", role: "pawn" } }, passed: true, blockers: [], protectedBy: [{ square: "c4", piece: { color: "white", role: "pawn" } }] } }],
  ["protected.black", "rules.pawn.event.dynamics", "7k/2p5/8/8/3p4/8/8/7K b - - 7 1", "c7c5", "7k/8/8/2p5/3p4/8/8/7K w - - 0 2", { kind: "protected_passer_gained", subjects: { pawn: { square: "d4", piece: { color: "black", role: "pawn" } }, passed: true, blockers: [], protectedBy: [{ square: "c5", piece: { color: "black", role: "pawn" } }] } }],
  ["connected.white", "rules.pawn.event.dynamics", "7k/8/8/3r4/2P1P3/8/8/7K w - - 7 1", "e4d5", "7k/8/8/3P4/2P5/8/8/7K b - - 0 1", { kind: "connected_passer_pair_gained", subjects: { first: { square: "c4", piece: { color: "white", role: "pawn" } }, second: { square: "d5", piece: { color: "white", role: "pawn" } } } }],
  ["connected.black", "rules.pawn.event.dynamics", "7k/8/8/2p1p3/3R4/8/8/7K b - - 7 1", "e5d4", "7k/8/8/2p5/3p4/8/8/7K w - - 0 2", { kind: "connected_passer_pair_gained", subjects: { first: { square: "d4", piece: { color: "black", role: "pawn" } }, second: { square: "c5", piece: { color: "black", role: "pawn" } } } }],
  ["lock-retained.white", "rules.pawn.event.dynamics", "7k/8/8/4p3/4P3/8/8/7K w - - 7 1", "h1g1", "7k/8/8/4p3/4P3/8/8/6K1 b - - 8 1", null],
  ["lock-retained.black", "rules.pawn.event.dynamics", "7k/8/8/4p3/4P3/8/8/7K b - - 7 1", "h8g8", "6k1/8/8/4p3/4P3/8/8/7K w - - 8 2", null],
  ["diagonal-not-lock.white", "rules.pawn.event.dynamics", "7k/8/8/5p2/8/4P3/8/7K w - - 7 1", "e3e4", "7k/8/8/5p2/4P3/8/8/7K b - - 0 1", null],
  ["diagonal-not-lock.black", "rules.pawn.event.dynamics", "7k/8/4p3/8/5P2/8/8/7K b - - 7 1", "e6e5", "7k/8/8/4p3/5P2/8/8/7K w - - 0 2", null],
  ["protector-changed.white", "rules.pawn.event.dynamics", "7k/8/8/8/3PP3/2P5/8/7K w - - 7 1", "d4d5", "7k/8/8/3P4/4P3/2P5/8/7K b - - 0 1", null],
  ["protector-changed.black", "rules.pawn.event.dynamics", "7k/8/2p5/3pp3/8/8/8/7K b - - 7 1", "d5d4", "7k/8/2p5/4p3/3p4/8/8/7K w - - 0 2", null],
  ["pair-reordered.white", "rules.pawn.event.dynamics", "7k/8/8/2P5/3P4/8/8/7K w - - 7 1", "d4d5", "7k/8/8/2PP4/8/8/8/7K b - - 0 1", null],
  ["pair-reordered.black", "rules.pawn.event.dynamics", "7k/8/8/2p5/3p4/8/8/7K b - - 7 1", "c5c4", "7k/8/8/8/2pp4/8/8/7K w - - 0 2", null],
  ["rook-not-minor.white", "rules.pawn.event.dynamics", "7k/8/8/8/6r1/8/7P/7K w - - 7 1", "h2h3", "7k/8/8/8/6r1/7P/8/7K b - - 0 1", null],
  ["rook-not-minor.black", "rules.pawn.event.dynamics", "7k/7p/8/6R1/8/8/8/7K b - - 7 1", "h7h6", "7k/8/7p/6R1/8/8/8/7K w - - 0 2", null],
  ["bishop-not-pawn-protector.white", "rules.pawn.event.dynamics", "7k/8/8/3P4/2B5/8/8/7K w - - 7 1", "h1g1", "7k/8/8/3P4/2B5/8/8/6K1 b - - 8 1", null],
  ["bishop-not-pawn-protector.black", "rules.pawn.event.dynamics", "7k/8/8/2b5/3p4/8/8/7K b - - 7 1", "h8g8", "6k1/8/8/2b5/3p4/8/8/7K w - - 8 2", null],
];

// D3691: finite pawn geometry, not strategic merit or forced retreat. These
// separately labelled excerpts are retained from Stockfish sf_15, Copyright
// 2004–2022 The Stockfish developers; GPL-3.0-or-later. Corresponding source/licence:
// https://github.com/official-stockfish/Stockfish/tree/e6e324eb28fd49c1fc44b3b65784f85a773ec61c
// https://github.com/official-stockfish/Stockfish/blob/e6e324eb28fd49c1fc44b3b65784f85a773ec61c/Copying.txt
export const PAWN_DYNAMICS_CITED_SOURCE = Object.freeze({
  sourceId: "stockfish.pawn-dynamics",
  sourceRevision: "e6e324eb28fd49c1fc44b3b65784f85a773ec61c",
  licence: "GPL-3.0-or-later",
  url: "https://github.com/official-stockfish/Stockfish/tree/e6e324eb28fd49c1fc44b3b65784f85a773ec61c/src",
  text: "bitboard.h constexpr Bitboard pawn_attacks_bb(Bitboard b):\ntemplate<Color C>\nconstexpr Bitboard pawn_attacks_bb(Bitboard b) {\n  return C == WHITE ? shift<NORTH_WEST>(b) | shift<NORTH_EAST>(b)\n                    : shift<SOUTH_WEST>(b) | shift<SOUTH_EAST>(b);\n}\n\nbitboard.h constexpr Bitboard adjacent_files_bb(Square s):\nconstexpr Bitboard adjacent_files_bb(Square s) {\n  return shift<EAST>(file_bb(s)) | shift<WEST>(file_bb(s));\n}\n\nbitboard.h constexpr Bitboard forward_file_bb(Color c, Square s):\nconstexpr Bitboard forward_file_bb(Color c, Square s) {\n  return forward_ranks_bb(c, s) & file_bb(s);\n}\n\nbitboard.h constexpr Bitboard passed_pawn_span(Color c, Square s):\nconstexpr Bitboard passed_pawn_span(Color c, Square s) {\n  return pawn_attack_span(c, s) | forward_file_bb(c, s);\n}\n\nposition.h inline bool Position::pawn_passed(Color c, Square s) const:\ninline bool Position::pawn_passed(Color c, Square s) const {\n  return !(pieces(~c, PAWN) & passed_pawn_span(c, s));\n}\n\npawns.cpp direction:\n    constexpr Direction Up   = pawn_push(Us);\n\npawns.cpp immediate pawn blocker:\n        blocked    = theirPawns & (s + Up);\n",
  operation: { id: "runtime.semantic.local_edge", version: 1 } as const,
  cases: pawnDynamicsFixtures.map(fixture => ruleCase("pawn-dynamics", fixture, "stockfish")),
});

// D3701: geometric contacts are not legal captures. Retained verbatim from the
// same independent GPL revision (attackers_mask 905–923, is_into_check 1933–1943,
// is_legal 1998–1999). The source supplies rules, never strategic move quality.
const attackRuleText = `    def attackers_mask(self, color: Color, square: Square, occupied: Optional[Bitboard] = None) -> Bitboard:
        occupied = self.occupied if occupied is None else occupied

        rank_pieces = BB_RANK_MASKS[square] & occupied
        file_pieces = BB_FILE_MASKS[square] & occupied
        diag_pieces = BB_DIAG_MASKS[square] & occupied

        queens_and_rooks = self.queens | self.rooks
        queens_and_bishops = self.queens | self.bishops

        attackers = (
            (BB_KING_ATTACKS[square] & self.kings) |
            (BB_KNIGHT_ATTACKS[square] & self.knights) |
            (BB_RANK_ATTACKS[square][rank_pieces] & queens_and_rooks) |
            (BB_FILE_ATTACKS[square][file_pieces] & queens_and_rooks) |
            (BB_DIAG_ATTACKS[square][diag_pieces] & queens_and_bishops) |
            (BB_PAWN_ATTACKS[not color][square] & self.pawns))

        return attackers & self.occupied_co[color]
`;
const legalRuleText = `    def is_into_check(self, move: Move) -> bool:
        king = self.king(self.turn)
        if king is None:
            return False

        # If already in check, look if it is an evasion.
        checkers = self.attackers_mask(not self.turn, king)
        if checkers and move not in self._generate_evasions(king, checkers, BB_SQUARES[move.from_square], BB_SQUARES[move.to_square]):
            return True

        return not self._is_safe(king, self._slider_blockers(king), move)

    def is_legal(self, move: Move) -> bool:
        return not self.is_variant_end() and self.is_pseudo_legal(move) and not self.is_into_check(move)
`;
const directCount = (color: string, square: string, count: number) => ({ kind: "direct_attack_count", color, squares: [square], count });
const countPair = (color: string, square: string, before: number, after: number) => ({ family: "direct_attack_count", before: directCount(color, square, before), after: directCount(color, square, after) });
const blockedAttackFixtures: readonly RuleFixture[] = [
  ["blocked.white", "rules.structural.event.direct_attack_count", "7k/8/8/8/3n4/8/1P5P/B6K w - - 7 1", "h2h3", "7k/8/8/8/3n4/7P/1P6/B6K b - - 0 1", null],
  ["blocked.black", "rules.structural.event.direct_attack_count", "b6k/1p5p/8/3N4/8/8/8/7K b - - 7 1", "h7h6", "b6k/1p6/7p/3N4/8/8/8/7K w - - 0 2", null],
];
const attackCountFixtures: readonly RuleFixture[] = [
  ["gained.white", "rules.structural.event.direct_attack_count", "7k/8/1n6/P7/8/8/3B4/7K w - - 7 1", "d2e3", "7k/8/1n6/P7/8/4B3/8/7K b - - 8 1", countPair("white", "b6", 1, 2)],
  ["gained.black", "rules.structural.event.direct_attack_count", "7k/3b4/8/8/p7/1N6/8/7K b - - 7 1", "d7e6", "7k/8/4b3/8/p7/1N6/8/7K w - - 8 2", countPair("black", "b3", 1, 2)],
  ["lost.white", "rules.structural.event.direct_attack_count", "7k/8/1n6/P7/8/4B3/8/7K w - - 7 1", "e3d2", "7k/8/1n6/P7/8/8/3B4/7K b - - 8 1", countPair("white", "b6", 2, 1)],
  ["lost.black", "rules.structural.event.direct_attack_count", "7k/8/4b3/8/p7/1N6/8/7K b - - 7 1", "e6d7", "7k/3b4/8/8/p7/1N6/8/7K w - - 8 2", countPair("black", "b3", 2, 1)],
  ["preserved.white", "rules.structural.event.direct_attack_count", "7k/8/1n6/P7/8/8/3B3P/7K w - - 7 1", "h2h3", "7k/8/1n6/P7/8/7P/3B4/7K b - - 0 1", countPair("white", "b6", 1, 1)],
  ["preserved.black", "rules.structural.event.direct_attack_count", "7k/3b3p/8/8/p7/1N6/8/7K b - - 7 1", "h7h6", "7k/3b4/7p/8/p7/1N6/8/7K w - - 0 2", countPair("black", "b3", 1, 1)],
  ["pinned.white", "rules.structural.event.direct_attack_count", "4r2k/8/8/8/8/2n5/4N2P/4K3 w - - 7 1", "h2h3", "4r2k/8/8/8/8/2n4P/4N3/4K3 b - - 0 1", countPair("white", "c3", 1, 1)],
  ["pinned.black", "rules.structural.event.direct_attack_count", "4k3/4n2p/2N5/8/8/8/8/4R2K b - - 7 1", "h7h6", "4k3/4n3/2N4p/8/8/8/8/4R2K w - - 0 2", countPair("black", "c6", 1, 1)],
  ...blockedAttackFixtures,
  ["pawn-target.white", "rules.structural.event.direct_attack_count", "7k/8/8/8/3p4/2P5/7P/7K w - - 7 1", "h2h3", "7k/8/8/8/3p4/2P4P/8/7K b - - 0 1", null],
  ["pawn-target.black", "rules.structural.event.direct_attack_count", "7k/7p/2p5/3P4/8/8/8/7K b - - 7 1", "h7h6", "7k/8/2p4p/3P4/8/8/8/7K w - - 0 2", null],
];
const looseOmissionFixtures: readonly RuleFixture[] = [
  ...blockedAttackFixtures.map(([id, , before, move, after]) => [id, "rules.tactic.event.loose_piece", before, move, after, null] as const),
  ["pinned-capturer.white", "rules.tactic.event.loose_piece", "4k3/4n3/2N5/8/8/8/7P/4R2K w - - 7 1", "h2h3", "4k3/4n3/2N5/8/8/7P/8/4R2K b - - 0 1", null],
  ["pinned-capturer.black", "rules.tactic.event.loose_piece", "4r2k/7p/8/8/8/2n5/4N3/4K3 b - - 7 1", "h7h6", "4r2k/8/7p/8/8/2n5/4N3/4K3 w - - 0 2", null],
];
export const ATTACK_CITED_SOURCES = Object.freeze([
  {
    sourceId: "python-chess.attack-counts", sourceRevision: captureSource.sourceRevision,
    licence: captureSource.licence, url: `https://github.com/niklasf/python-chess/blob/${captureSource.sourceRevision}/chess/__init__.py#L905-L923`,
    text: attackRuleText, operation: { id: "runtime.semantic.structural_edge", version: 1 } as const,
    cases: attackCountFixtures.map(fixture => ruleCase("attack-counts", fixture)),
  },
  {
    sourceId: "python-chess.loose-omission", sourceRevision: captureSource.sourceRevision,
    licence: captureSource.licence, url: `https://github.com/niklasf/python-chess/blob/${captureSource.sourceRevision}/chess/__init__.py`,
    text: `attackers_mask:\n${attackRuleText}\nis_into_check / is_legal:\n${legalRuleText}`,
    operation: { id: "runtime.semantic.local_edge", version: 1 } as const,
    cases: looseOmissionFixtures.map(fixture => ruleCase("loose-omission", fixture)),
  },
]);

export const SEMANTIC_VALIDATION_LITERAL_SOURCES = Object.freeze([
  ...RECORDED_CITED_SOURCES,
  ...ATTACK_CITED_SOURCES,
  PAWN_DYNAMICS_CITED_SOURCE,
  ...RULE_STATE_CITED_SOURCES,
  pawnMembershipSource,
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
