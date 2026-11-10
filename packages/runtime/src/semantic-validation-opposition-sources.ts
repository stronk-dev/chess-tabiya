/** Build/test-only D4172 current-opposition propositions, independently reviewed for integration.
 * Independent source/case review accepts integration; execution still controls qualification.
 * Copyright Niklas Fiekas for retained Python excerpts; GPL-3.0-or-later.
 * Corresponding source/licence: https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
 * https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
 * No collector, source composer, engine output or production mirror is imported.
 * The retained python-chess excerpts establish FEN piece/king/occupancy/turn facts ONLY.
 * The disclosed product convention king-opposition-unobstructed@1 supplies geometry/holder;
 * foundation-source-identity §3.1 supplies stable king-pair identity and membership signs.
 * Neither excerpt nor these cases claims chess importance, force, outcome or best play.
 */
import { SEMANTIC_VALIDATION_TRANSITION_SOURCES } from "./semantic-validation-transition-sources.js";
import type { SemanticCanonicalValue, SemanticEdgeInput, SemanticMirrorGeometry, SemanticMirrorOperandRule, SemanticValidationCase, SemanticValidationPropositionRecord } from "./semantic-validation.js";

type Kings = readonly [white: string, black: string];
type Relation = readonly [form: "direct" | "distant_three" | "distant_five", interior: readonly string[]] | null;
interface Example {
  readonly id: string; readonly partner: string;
  readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string;
  readonly beforeKings: Kings; readonly afterKings: Kings;
  readonly before: Relation; readonly after: Relation;
  readonly sign: "gained" | "lost" | "membership_changed" | null;
  readonly horizontalPartner?: string;
}
const example = (id: string, partner: string, beforeFen: string, moveUci: string, afterFen: string,
  beforeKings: Kings, afterKings: Kings, before: Relation, after: Relation, sign: Example["sign"], horizontalPartner?: string): Example =>
  ({ id, partner, beforeFen, moveUci, afterFen, beforeKings, afterKings, before, after, sign, ...(horizontalPartner === undefined ? {} : { horizontalPartner }) });
const direct = ["direct", ["e2"]] as const;
const directNorth = ["direct", ["e7"]] as const;
// Literal independent endpoints, including the actual Black fullmove increment. The relation
// arrays are White-king→Black-king, not sorted square sets or transformed collector output.
export const OPPOSITION_LITERAL_EXAMPLES: readonly Example[] = [
  example("direct.south", "direct.north", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7", "8/r7/8/8/8/4k3/8/4K3 w - - 1 2", ["e1", "e3"], ["e1", "e3"], direct, direct, "membership_changed", "direct.west.south"),
  example("direct.north", "direct.south", "4k3/8/4K3/8/8/8/8/R7 w - - 0 1", "a1a2", "4k3/8/4K3/8/8/8/R7/8 b - - 1 1", ["e6", "e8"], ["e6", "e8"], directNorth, directNorth, "membership_changed", "direct.west.north"),
  example("direct.west.south", "direct.west.north", "7r/8/8/8/8/3k4/8/3K4 b - - 0 1", "h8h7", "8/7r/8/8/8/3k4/8/3K4 w - - 1 2", ["d1", "d3"], ["d1", "d3"], ["direct", ["d2"]], ["direct", ["d2"]], "membership_changed", "direct.south"),
  example("direct.west.north", "direct.west.south", "3k4/8/3K4/8/8/8/8/7R w - - 0 1", "h1h2", "3k4/8/3K4/8/8/8/7R/8 b - - 1 1", ["d6", "d8"], ["d6", "d8"], ["direct", ["d7"]], ["direct", ["d7"]], "membership_changed", "direct.north"),
  example("three.south", "three.north", "r7/8/8/4k3/8/8/8/4K3 b - - 0 1", "a8a7", "8/r7/8/4k3/8/8/8/4K3 w - - 1 2", ["e1", "e5"], ["e1", "e5"], ["distant_three", ["e2", "e3", "e4"]], ["distant_three", ["e2", "e3", "e4"]], "membership_changed"),
  example("three.north", "three.south", "4k3/8/8/8/4K3/8/8/R7 w - - 0 1", "a1a2", "4k3/8/8/8/4K3/8/R7/8 b - - 1 1", ["e4", "e8"], ["e4", "e8"], ["distant_three", ["e5", "e6", "e7"]], ["distant_three", ["e5", "e6", "e7"]], "membership_changed"),
  example("five.south", "five.north", "r7/4k3/8/8/8/8/8/4K3 b - - 0 1", "a8a7", "8/r3k3/8/8/8/8/8/4K3 w - - 1 2", ["e1", "e7"], ["e1", "e7"], ["distant_five", ["e2", "e3", "e4", "e5", "e6"]], ["distant_five", ["e2", "e3", "e4", "e5", "e6"]], "membership_changed"),
  example("five.north", "five.south", "4k3/8/8/8/8/8/4K3/R7 w - - 0 1", "a1a2", "4k3/8/8/8/8/8/R3K3/8 b - - 1 1", ["e2", "e8"], ["e2", "e8"], ["distant_five", ["e3", "e4", "e5", "e6", "e7"]], ["distant_five", ["e3", "e4", "e5", "e6", "e7"]], "membership_changed"),
  example("rank-direct.south", "rank-direct.north", "r7/8/8/8/2K1k3/8/8/8 b - - 0 1", "a8a7", "8/r7/8/8/2K1k3/8/8/8 w - - 1 2", ["c4", "e4"], ["c4", "e4"], ["direct", ["d4"]], ["direct", ["d4"]], "membership_changed"),
  example("rank-direct.north", "rank-direct.south", "8/8/8/2k1K3/8/8/8/R7 w - - 0 1", "a1a2", "8/8/8/2k1K3/8/8/R7/8 b - - 1 1", ["e5", "c5"], ["e5", "c5"], ["direct", ["d5"]], ["direct", ["d5"]], "membership_changed"),
  example("rank-three.south", "rank-three.north", "r7/8/8/8/2K3k1/8/8/8 b - - 0 1", "a8a7", "8/r7/8/8/2K3k1/8/8/8 w - - 1 2", ["c4", "g4"], ["c4", "g4"], ["distant_three", ["d4", "e4", "f4"]], ["distant_three", ["d4", "e4", "f4"]], "membership_changed"),
  example("rank-three.north", "rank-three.south", "8/8/8/2k3K1/8/8/8/R7 w - - 0 1", "a1a2", "8/8/8/2k3K1/8/8/R7/8 b - - 1 1", ["g5", "c5"], ["g5", "c5"], ["distant_three", ["f5", "e5", "d5"]], ["distant_three", ["f5", "e5", "d5"]], "membership_changed"),
  example("rank-five.south", "rank-five.north", "r7/8/8/8/1K5k/8/8/8 b - - 0 1", "a8a7", "8/r7/8/8/1K5k/8/8/8 w - - 1 2", ["b4", "h4"], ["b4", "h4"], ["distant_five", ["c4", "d4", "e4", "f4", "g4"]], ["distant_five", ["c4", "d4", "e4", "f4", "g4"]], "membership_changed"),
  example("rank-five.north", "rank-five.south", "8/8/8/1k5K/8/8/8/R7 w - - 0 1", "a1a2", "8/8/8/1k5K/8/8/R7/8 b - - 1 1", ["h5", "b5"], ["h5", "b5"], ["distant_five", ["g5", "f5", "e5", "d5", "c5"]], ["distant_five", ["g5", "f5", "e5", "d5", "c5"]], "membership_changed"),
  example("gained.south", "gained.north", "8/8/8/8/8/4k3/8/3K4 w - - 0 1", "d1e1", "8/8/8/8/8/4k3/8/4K3 b - - 1 1", ["d1", "e3"], ["e1", "e3"], null, direct, "gained"),
  example("gained.north", "gained.south", "3k4/8/4K3/8/8/8/8/8 b - - 0 1", "d8e8", "4k3/8/4K3/8/8/8/8/8 w - - 1 2", ["e6", "d8"], ["e6", "e8"], null, directNorth, "gained"),
  example("lost.south", "lost.north", "8/8/8/8/8/4k3/8/4K3 w - - 0 1", "e1d1", "8/8/8/8/8/4k3/8/3K4 b - - 1 1", ["e1", "e3"], ["d1", "e3"], direct, null, "lost"),
  example("lost.north", "lost.south", "4k3/8/4K3/8/8/8/8/8 b - - 0 1", "e8d8", "3k4/8/4K3/8/8/8/8/8 w - - 1 2", ["e6", "e8"], ["e6", "d8"], directNorth, null, "lost"),
  // Nearby omissions preserve absence at BOTH endpoints: no fabricated lost-as-negative case.
  example("blocked.south", "blocked.north", "r7/8/8/8/8/4k3/4B3/4K3 b - - 0 1", "a8a7", "8/r7/8/8/8/4k3/4B3/4K3 w - - 1 2", ["e1", "e3"], ["e1", "e3"], null, null, null),
  example("blocked.north", "blocked.south", "4k3/4b3/4K3/8/8/8/8/R7 w - - 0 1", "a1a2", "4k3/4b3/4K3/8/8/8/R7/8 b - - 1 1", ["e6", "e8"], ["e6", "e8"], null, null, null),
  example("diagonal.south", "diagonal.north", "r7/8/8/8/8/5k2/8/3K4 b - - 0 1", "a8a7", "8/r7/8/8/8/5k2/8/3K4 w - - 1 2", ["d1", "f3"], ["d1", "f3"], null, null, null),
  example("diagonal.north", "diagonal.south", "3k4/8/5K2/8/8/8/8/R7 w - - 0 1", "a1a2", "3k4/8/5K2/8/8/8/R7/8 b - - 1 1", ["f6", "d8"], ["f6", "d8"], null, null, null),
  example("wrong-gap.south", "wrong-gap.north", "r7/8/8/8/4k3/8/8/4K3 b - - 0 1", "a8a7", "8/r7/8/8/4k3/8/8/4K3 w - - 1 2", ["e1", "e4"], ["e1", "e4"], null, null, null),
  example("wrong-gap.north", "wrong-gap.south", "4k3/8/8/4K3/8/8/8/R7 w - - 0 1", "a1a2", "4k3/8/8/4K3/8/8/R7/8 b - - 1 1", ["e5", "e8"], ["e5", "e8"], null, null, null),
];
const subject = { kind: "event", projection: { id: "rules.structural.event.king_opposition", version: 2 } } as const;
const operation = { id: "runtime.semantic.foundation_edge", version: 1 } as const;
const caseId = (id: string, arm: string) => `cited.literal-board.opposition2.${id}.${arm}`;
function snapshot(fen: string, kings: Kings, relation: Relation): SemanticCanonicalValue {
  const sideToMove = fen.split(" ")[1] === "w" ? "white" : "black";
  return { fen, kings: { white: kings[0], black: kings[1] }, opposition: relation === null ? null
    : { color: sideToMove === "white" ? "black" : "white", sideToMove, form: relation[0], betweenSquares: [...relation[1]], betweenSquaresEmpty: true } };
}
export function oppositionLiteralOperands(row: Example): Readonly<Record<string, SemanticCanonicalValue>> {
  return { beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen, subject: { white: "king", black: "king" }, sign: row.sign,
    before: snapshot(row.beforeFen, row.beforeKings, row.before), after: snapshot(row.afterFen, row.afterKings, row.after) };
}
const scalar = (sourcePath: readonly string[], partnerPath: readonly string[], value: "identity" | "square" | "color"): SemanticMirrorOperandRule => ({ sourcePath, partnerPath, value, collection: "scalar" });
function rules(row: Example, geometry: SemanticMirrorGeometry): readonly SemanticMirrorOperandRule[] {
  const result: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    scalar(["subject", "white"], ["subject", "white"], "identity"), scalar(["subject", "black"], ["subject", "black"], "identity"), scalar(["sign"], ["sign"], "identity"),
    { sourcePath: ["before", "fen"], partnerPath: ["before", "fen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["after", "fen"], partnerPath: ["after", "fen"], value: "input_after_fen", collection: "scalar" },
  ];
  for (const [stage, relation] of [["before", row.before], ["after", row.after]] as const) {
    for (const color of ["white", "black"] as const) result.push(scalar([stage, "kings", color], [stage, "kings", geometry === "color_and_vertical" ? color === "white" ? "black" : "white" : color], "square"));
    const path = [stage, "opposition"];
    if (relation === null) { result.push(scalar(path, path, "identity")); continue; }
    for (const key of ["color", "sideToMove"]) result.push(scalar([...path, key], [...path, key], "color"));
    for (const key of ["form", "betweenSquaresEmpty"]) result.push(scalar([...path, key], [...path, key], "identity"));
    relation[1].forEach((_, index, values) => result.push(scalar([...path, "betweenSquares", String(index)], [...path, "betweenSquares", String(geometry === "color_and_vertical" ? values.length - 1 - index : index)], "square")));
  }
  return result;
}
interface SourceCase { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticEdgeInput; readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> }
const cases: SourceCase[] = OPPOSITION_LITERAL_EXAMPLES.flatMap(row => {
  const input: SemanticEdgeInput = { kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen };
  if (row.sign === null) return [{ arm: "semantic_negative", input, proposition: { subject, case: { id: caseId(row.id, "negative"), version: 1 }, factConstraint: [], expectation: { kind: "omits" } } }];
  const positive: SourceCase = { arm: "positive", input, proposition: { subject, case: { id: caseId(row.id, "absolute"), version: 1 }, factConstraint: [], expectation: { kind: "emits_exact", events: [{ sign: row.sign, operands: oppositionLiteralOperands(row) }] } } };
  const oriented = (geometry: SemanticMirrorGeometry, partner: string): SourceCase => ({ arm: "orientation", input, proposition: { subject, case: { id: caseId(row.id, geometry), version: 1 }, factConstraint: [], expectation: { kind: "mirrors", partnerCase: { kind: "case", id: caseId(partner, geometry), version: 1, subject, arm: "orientation" }, geometry, targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: rules(row, geometry) } } });
  return [positive, oriented("color_and_vertical", row.partner), ...(row.horizontalPartner === undefined ? [] : [oriented("horizontal", row.horizontalPartner)])];
});
const placementText = SEMANTIC_VALIDATION_TRANSITION_SOURCES[0]!.text;
const start = placementText.indexOf("Unmarked FEN metadata");
if (start < 0) throw new Error("Opposition propositions require the retained literal board source");
export const OPPOSITION_LITERAL_SOURCE = Object.freeze({
  sourceId: "python-chess.literal-board.opposition2", sourceRevision: "3516d7c6c0879af724c2855fac5a304a4ef40949", licence: "GPL-3.0-or-later",
  url: "https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/chess/__init__.py",
  text: 'Role/color constants:\nWHITE: Color = True\nBLACK: Color = False\nKING: PieceType = 6\n\n' + placementText.slice(start) + '\nRole/colour decoding, Piece.from_symbol:\n        return cls(PIECE_SYMBOLS.index(symbol.lower()), symbol.isupper())\nRole vocabulary:\nPIECE_SYMBOLS = [None, \"p\", \"n\", \"b\", \"r\", \"q\", \"k\"]\n\nFEN turn interpretation, Board.set_fen:\n            if turn_part == "w":\n                turn = WHITE\n            elif turn_part == "b":\n                turn = BLACK\n',
  operation, cases,
});
