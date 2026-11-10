/** Build/test-only D4172 literal backward-pawn2 propositions, under independent review.
 * No collector, production mirror, FEN-driven classifier or engine supplies expectations.
 * Primary Python facts establish placement, pawn pseudo-control (including pinned pieces),
 * capture/EP/promotion only. foundation-source-identity §3.2 and backward-pawn@1 separately
 * supply the disclosed narrow product definition, original-subject join and membership signs.
 * Retained Python copyright Niklas Fiekas, GPL-3.0-or-later; corresponding source/licence:
 * https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
 * https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
 */
import { OPPOSITION_LITERAL_SOURCE } from "./semantic-validation-opposition-sources.js";
import { SEMANTIC_VALIDATION_TRANSITION_SOURCES } from "./semantic-validation-transition-sources.js";
import type { SemanticCanonicalValue, SemanticEdgeInput, SemanticMirrorGeometry, SemanticMirrorOperandRule, SemanticMirrorValueRule, SemanticValidationCase, SemanticValidationPropositionRecord } from "./semantic-validation.js";
type Color = "white" | "black";
type Obj = { readonly [key: string]: SemanticCanonicalValue };
type Pawn = Obj & { readonly color: Color; readonly pawn: string };
type Occupancy = { readonly kind: "empty" } | { readonly kind: "own" | "enemy"; readonly piece: { readonly color: Color; readonly role: string } };
type Change = readonly [sign: "gained" | "lost" | "membership_changed", before: Pawn | null, after: Pawn | null];
interface Example {
  readonly id: string; readonly partner: string; readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string;
  readonly events: readonly Change[]; readonly mirror?: "gained" | "lost" | "membership_changed";
  readonly horizontalPartner?: string; readonly twoControllers?: true; readonly twoCaptures?: true;
}
const empty = { kind: "empty" } as const;
const occupied = (kind: "own" | "enemy", color: Color, role: string): Occupancy => ({ kind, piece: { color, role } });
// Constructors assemble only explicitly supplied facts; they do not read a board or classify it.
const pawn = (color: Color, square: string, stop: string, controllers: readonly string[], ahead: readonly string[] = [], occupancy: Occupancy = empty, captures: readonly string[] = [], halfOpen = true): Pawn => {
  const enemy = color === "white" ? "black" as const : "white" as const;
  return { color, pawn: square, stop, controllers: controllers.map(square => ({ color: enemy, square })), supportPawns: [],
    aheadAdjacentPawns: ahead.map(square => ({ color, square })), stopOccupancy: occupancy,
    immediatePseudoCapture: captures.map(square => ({ color: enemy, square })), halfOpenForColor: { color: enemy, value: halfOpen } };
};
const ex = (id: string, partner: string, beforeFen: string, moveUci: string, afterFen: string, events: readonly Change[], details: Pick<Example, "mirror" | "horizontalPartner" | "twoControllers" | "twoCaptures"> = {}): Example =>
  ({ id, partner, beforeFen, moveUci, afterFen, events, ...details });

export const BACKWARD_LITERAL_EXAMPLES: readonly Example[] = [
  ex("gain-empty.white", "gain-empty.black", "7k/8/2p5/8/8/1P6/8/7K w - - 0 1", "b3b4", "7k/8/2p5/8/1P6/8/8/7K b - - 0 1", [
    ["gained", null, pawn("white", "b4", "b5", ["c6"])], ["gained", null, pawn("black", "c6", "c5", ["b4"])],
  ], { mirror: "gained" }),
  ex("gain-empty.black", "gain-empty.white", "7k/8/1p6/8/8/2P5/8/7K b - - 0 1", "b6b5", "7k/8/8/1p6/8/2P5/8/7K w - - 0 2", [
    ["gained", null, pawn("white", "c3", "c4", ["b5"])], ["gained", null, pawn("black", "b5", "b4", ["c3"])],
  ], { mirror: "gained" }),
  ex("gain-enemy.white", "gain-enemy.black", "7k/8/2p5/1p6/8/1P6/8/7K w - - 0 1", "b3b4", "7k/8/2p5/1p6/1P6/8/8/7K b - - 0 1", [
    ["gained", null, pawn("white", "b4", "b5", ["c6"], [], occupied("enemy", "black", "pawn"), [], false)],
    ["gained", null, pawn("black", "c6", "c5", ["b4"], ["b5"])],
  ], { mirror: "gained" }),
  ex("gain-enemy.black", "gain-enemy.white", "7k/8/1p6/8/1P6/2P5/8/7K b - - 0 1", "b6b5", "7k/8/8/1p6/1P6/2P5/8/7K w - - 0 2", [
    ["gained", null, pawn("white", "c3", "c4", ["b5"], ["b4"])],
    ["gained", null, pawn("black", "b5", "b4", ["c3"], [], occupied("enemy", "white", "pawn"), [], false)],
  ], { mirror: "gained" }),
  ex("gain-own.white", "gain-own.black", "7k/8/2p5/1P6/8/1P6/8/7K w - - 0 1", "b3b4", "7k/8/2p5/1P6/1P6/8/8/7K b - - 0 1", [
    ["gained", null, pawn("white", "b4", "b5", ["c6"], [], occupied("own", "white", "pawn"))],
    ["gained", null, pawn("black", "c6", "c5", ["b4"], [], empty, ["b5"])],
  ], { mirror: "gained" }),
  ex("gain-own.black", "gain-own.white", "7k/8/1p6/8/1p6/2P5/8/7K b - - 0 1", "b6b5", "7k/8/8/1p6/1p6/2P5/8/7K w - - 0 2", [
    ["gained", null, pawn("white", "c3", "c4", ["b5"], [], empty, ["b4"])],
    ["gained", null, pawn("black", "b5", "b4", ["c3"], [], occupied("own", "black", "pawn"))],
  ], { mirror: "gained" }),
  // Different same-file subjects must be lost/gained, not paired solely because the file agrees.
  ex("moving-lineage.white", "moving-lineage.black", "7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5", "7k/4p3/4p3/3P4/8/8/8/7K b - - 0 1", [
    ["membership_changed", pawn("white", "d4", "d5", ["e6"]), pawn("white", "d5", "d6", ["e7"], [], empty, ["e6"])],
    ["lost", pawn("black", "e6", "e5", ["d4"]), null], ["gained", null, pawn("black", "e7", "e6", ["d5"], [], occupied("own", "black", "pawn"))],
  ]),
  ex("moving-lineage.black", "moving-lineage.white", "7k/8/8/3p4/8/4P3/4P3/7K b - - 0 1", "d5d4", "7k/8/8/8/3p4/4P3/4P3/7K w - - 0 2", [
    ["lost", pawn("white", "e3", "e4", ["d5"]), null],
    ["membership_changed", pawn("black", "d5", "d4", ["e3"]), pawn("black", "d4", "d3", ["e2"], [], empty, ["e3"])],
    ["gained", null, pawn("white", "e2", "e3", ["d4"], [], occupied("own", "white", "pawn"))],
  ]),
  // Stationary matches precede the actual mover and unmatched losses, even across color order.
  ex("same-file.white", "same-file.black", "7k/2p5/2p5/1P6/3P4/8/8/7K w - - 0 1", "d4d5", "7k/2p5/2p5/1P1P4/8/8/8/7K b - - 0 1", [
    ["membership_changed", pawn("black", "c7", "c6", ["b5"], [], occupied("own", "black", "pawn")), pawn("black", "c7", "c6", ["b5", "d5"], [], occupied("own", "black", "pawn"))],
    ["membership_changed", pawn("white", "d4", "d5", ["c6"]), pawn("white", "d5", "d6", ["c7"], [], empty, ["c6"])],
    ["lost", pawn("black", "c6", "c5", ["d4"], [], empty, ["b5"]), null],
  ]),
  ex("same-file.black", "same-file.white", "7k/8/8/3p4/1p6/2P5/2P5/7K b - - 0 1", "d5d4", "7k/8/8/8/1p1p4/2P5/2P5/7K w - - 0 2", [
    ["membership_changed", pawn("white", "c2", "c3", ["b4"], [], occupied("own", "white", "pawn")), pawn("white", "c2", "c3", ["b4", "d4"], [], occupied("own", "white", "pawn"))],
    ["lost", pawn("white", "c3", "c4", ["d5"], [], empty, ["b4"]), null],
    ["membership_changed", pawn("black", "d5", "d4", ["c3"]), pawn("black", "d4", "d3", ["c2"], [], empty, ["c3"])],
  ]),
  ex("pinned-controller.white", "pinned-controller.black", "2k5/8/2p5/8/3P1N2/8/8/2R4K w - - 0 1", "f4d5", "2k5/8/2p5/3N4/3P4/8/8/2R4K b - - 1 1", [
    ["membership_changed", pawn("white", "d4", "d5", ["c6"]), pawn("white", "d4", "d5", ["c6"], [], occupied("own", "white", "knight"))],
  ], { mirror: "membership_changed" }),
  ex("pinned-controller.black", "pinned-controller.white", "2r4k/8/8/3p1n2/8/2P5/8/2K5 b - - 0 1", "f5d4", "2r4k/8/8/3p4/3n4/2P5/8/2K5 w - - 1 2", [
    ["membership_changed", pawn("black", "d5", "d4", ["c3"]), pawn("black", "d5", "d4", ["c3"], [], occupied("own", "black", "knight"))],
  ], { mirror: "membership_changed" }),
  ex("pinned-subject.white", "pinned-subject.black", "3r3k/8/2p5/4p3/3P1N2/8/8/3K4 w - - 0 1", "f4d5", "3r3k/8/2p5/3Np3/3P4/8/8/3K4 b - - 1 1", [
    ["membership_changed", pawn("white", "d4", "d5", ["c6"], [], empty, ["e5"]), pawn("white", "d4", "d5", ["c6"], [], occupied("own", "white", "knight"), ["e5"])],
  ], { mirror: "membership_changed" }),
  ex("pinned-subject.black", "pinned-subject.white", "3k4/8/8/3p1n2/4P3/2P5/8/3R3K b - - 0 1", "f5d4", "3k4/8/8/3p4/3nP3/2P5/8/3R3K w - - 1 2", [
    ["membership_changed", pawn("black", "d5", "d4", ["c3"], [], empty, ["e4"]), pawn("black", "d5", "d4", ["c3"], [], occupied("own", "black", "knight"), ["e4"])],
  ], { mirror: "membership_changed" }),
  ex("support-same.white", "support-same.black", "7k/8/2p5/8/2PP1N2/8/8/7K w - - 0 1", "f4d5", "7k/8/2p5/3N4/2PP4/8/8/7K b - - 1 1", []),
  ex("support-same.black", "support-same.white", "7k/8/8/2pp1n2/8/2P5/8/7K b - - 0 1", "f5d4", "7k/8/8/2pp4/3n4/2P5/8/7K w - - 1 2", []),
  ex("support-behind.white", "support-behind.black", "7k/8/2p5/8/3P1N2/2P5/8/7K w - - 0 1", "f4d5", "7k/8/2p5/3N4/3P4/2P5/8/7K b - - 1 1", []),
  ex("support-behind.black", "support-behind.white", "7k/8/2p5/3p1n2/8/2P5/8/7K b - - 0 1", "f5d4", "7k/8/2p5/3p4/3n4/2P5/8/7K w - - 1 2", []),
  ex("support-ahead.white", "support-ahead.black", "7k/8/2p5/2P5/3P1N2/8/8/7K w - - 0 1", "f4d5", "7k/8/2p5/2PN4/3P4/8/8/7K b - - 1 1", [
    ["membership_changed", pawn("white", "d4", "d5", ["c6"], ["c5"]), pawn("white", "d4", "d5", ["c6"], ["c5"], occupied("own", "white", "knight"))],
  ], { mirror: "membership_changed" }),
  ex("support-ahead.black", "support-ahead.white", "7k/8/8/3p1n2/2p5/2P5/8/7K b - - 0 1", "f5d4", "7k/8/8/3p4/2pn4/2P5/8/7K w - - 1 2", [
    ["membership_changed", pawn("black", "d5", "d4", ["c3"], ["c4"]), pawn("black", "d5", "d4", ["c3"], ["c4"], occupied("own", "black", "knight"))],
  ], { mirror: "membership_changed" }),
  ex("nonpawn-controller.white", "nonpawn-controller.black", "7k/8/2b5/8/3P1N2/8/8/6K1 w - - 0 1", "f4d5", "7k/8/2b5/3N4/3P4/8/8/6K1 b - - 1 1", []),
  ex("nonpawn-controller.black", "nonpawn-controller.white", "6k1/8/8/3p1n2/8/2B5/8/7K b - - 0 1", "f5d4", "6k1/8/8/3p4/3n4/2B5/8/7K w - - 1 2", []),
  ex("two-controller.white", "two-controller.black", "7k/3p4/2p1p3/8/3P1N2/8/8/7K w - - 0 1", "f4d5", "7k/3p4/2p1p3/3N4/3P4/8/8/7K b - - 1 1", [
    ["membership_changed", pawn("white", "d4", "d5", ["c6", "e6"], [], empty, [], false), pawn("white", "d4", "d5", ["c6", "e6"], [], occupied("own", "white", "knight"), [], false)],
  ], { mirror: "membership_changed", horizontalPartner: "two-controller-east.white", twoControllers: true }),
  ex("two-controller.black", "two-controller.white", "7k/8/8/3p1n2/8/2P1P3/3P4/7K b - - 0 1", "f5d4", "7k/8/8/3p4/3n4/2P1P3/3P4/7K w - - 1 2", [
    ["membership_changed", pawn("black", "d5", "d4", ["c3", "e3"], [], empty, [], false), pawn("black", "d5", "d4", ["c3", "e3"], [], occupied("own", "black", "knight"), [], false)],
  ], { mirror: "membership_changed", horizontalPartner: "two-controller-east.black", twoControllers: true }),
  ex("two-controller-east.white", "two-controller-east.black", "k7/4p3/3p1p2/8/2N1P3/8/8/K7 w - - 0 1", "c4e5", "k7/4p3/3p1p2/4N3/4P3/8/8/K7 b - - 1 1", [
    ["membership_changed", pawn("white", "e4", "e5", ["d6", "f6"], [], empty, [], false), pawn("white", "e4", "e5", ["d6", "f6"], [], occupied("own", "white", "knight"), [], false)],
  ], { mirror: "membership_changed", horizontalPartner: "two-controller.white", twoControllers: true }),
  ex("two-controller-east.black", "two-controller-east.white", "k7/8/8/2n1p3/8/3P1P2/4P3/K7 b - - 0 1", "c5e4", "k7/8/8/4p3/4n3/3P1P2/4P3/K7 w - - 1 2", [
    ["membership_changed", pawn("black", "e5", "e4", ["d3", "f3"], [], empty, [], false), pawn("black", "e5", "e4", ["d3", "f3"], [], occupied("own", "black", "knight"), [], false)],
  ], { mirror: "membership_changed", horizontalPartner: "two-controller.black", twoControllers: true }),
  ex("two-capture.white", "two-capture.black", "7k/8/2p1p3/2p1p3/3P1N2/8/8/7K w - - 0 1", "f4d5", "7k/8/2p1p3/2pNp3/3P4/8/8/7K b - - 1 1", [
    ["membership_changed", pawn("white", "d4", "d5", ["c6", "e6"], [], empty, ["c5", "e5"]), pawn("white", "d4", "d5", ["c6", "e6"], [], occupied("own", "white", "knight"), ["c5", "e5"])],
  ], { mirror: "membership_changed", horizontalPartner: "two-capture-east.white", twoControllers: true, twoCaptures: true }),
  ex("two-capture.black", "two-capture.white", "7k/8/8/3p1n2/2P1P3/2P1P3/8/7K b - - 0 1", "f5d4", "7k/8/8/3p4/2PnP3/2P1P3/8/7K w - - 1 2", [
    ["membership_changed", pawn("black", "d5", "d4", ["c3", "e3"], [], empty, ["c4", "e4"]), pawn("black", "d5", "d4", ["c3", "e3"], [], occupied("own", "black", "knight"), ["c4", "e4"])],
  ], { mirror: "membership_changed", horizontalPartner: "two-capture-east.black", twoControllers: true, twoCaptures: true }),
  ex("two-capture-east.white", "two-capture-east.black", "k7/8/3p1p2/3p1p2/2N1P3/8/8/K7 w - - 0 1", "c4e5", "k7/8/3p1p2/3pNp2/4P3/8/8/K7 b - - 1 1", [
    ["membership_changed", pawn("white", "e4", "e5", ["d6", "f6"], [], empty, ["d5", "f5"]), pawn("white", "e4", "e5", ["d6", "f6"], [], occupied("own", "white", "knight"), ["d5", "f5"])],
  ], { mirror: "membership_changed", horizontalPartner: "two-capture.white", twoControllers: true, twoCaptures: true }),
  ex("two-capture-east.black", "two-capture-east.white", "k7/8/8/2n1p3/3P1P2/3P1P2/8/K7 b - - 0 1", "c5e4", "k7/8/8/4p3/3PnP2/3P1P2/8/K7 w - - 1 2", [
    ["membership_changed", pawn("black", "e5", "e4", ["d3", "f3"], [], empty, ["d4", "f4"]), pawn("black", "e5", "e4", ["d3", "f3"], [], occupied("own", "black", "knight"), ["d4", "f4"])],
  ], { mirror: "membership_changed", horizontalPartner: "two-capture.black", twoControllers: true, twoCaptures: true }),
  ex("capture.white", "capture.black", "7k/8/2p5/p7/1P6/8/8/7K w - - 0 1", "b4a5", "7k/8/2p5/P7/8/8/8/7K b - - 0 1", [
    ["lost", pawn("white", "b4", "b5", ["c6"], [], empty, ["a5"]), null], ["lost", pawn("black", "c6", "c5", ["b4"]), null],
  ], { mirror: "lost" }),
  ex("capture.black", "capture.white", "7k/8/8/1p6/P7/2P5/8/7K b - - 0 1", "b5a4", "7k/8/8/8/p7/2P5/8/7K w - - 0 2", [
    ["lost", pawn("white", "c3", "c4", ["b5"]), null], ["lost", pawn("black", "b5", "b4", ["c3"], [], empty, ["a4"]), null],
  ], { mirror: "lost" }),
  ex("ep.white", "ep.black", "7k/5p2/8/3pP3/8/2P5/8/7K w - d6 0 1", "e5d6", "7k/5p2/3P4/8/8/2P5/8/7K b - - 0 1", [
    ["lost", pawn("white", "c3", "c4", ["d5"]), null], ["lost", pawn("white", "e5", "e6", ["f7"]), null],
    ["lost", pawn("black", "d5", "d4", ["c3"]), null], ["lost", pawn("black", "f7", "f6", ["e5"]), null],
  ], { mirror: "lost" }),
  ex("ep.black", "ep.white", "7k/8/2p5/8/3Pp3/8/5P2/7K b - d3 0 1", "e4d3", "7k/8/2p5/8/8/3p4/5P2/7K w - - 0 2", [
    ["lost", pawn("white", "f2", "f3", ["e4"]), null], ["lost", pawn("white", "d4", "d5", ["c6"]), null],
    ["lost", pawn("black", "e4", "e3", ["f2"]), null], ["lost", pawn("black", "c6", "c5", ["d4"]), null],
  ], { mirror: "lost" }),
  // A promoting pawn cannot itself be a backward subject on its final rank; it changes other
  // subjects' ahead-list/half-open information. No manufactured promotion-rank pawn control.
  ex("promotion.white", "promotion.black", "7k/P7/p7/8/1P6/8/8/7K w - - 0 1", "a7a8q", "Q6k/8/p7/8/1P6/8/8/7K b - - 0 1", [
    ["membership_changed", pawn("white", "b4", "b5", ["a6"], ["a7"]), pawn("white", "b4", "b5", ["a6"])],
    ["membership_changed", pawn("black", "a6", "a5", ["b4"], [], empty, [], false), pawn("black", "a6", "a5", ["b4"])],
  ], { mirror: "membership_changed" }),
  ex("promotion.black", "promotion.white", "7k/8/8/1p6/8/P7/p7/7K b - - 0 1", "a2a1q", "7k/8/8/1p6/8/P7/8/q6K w - - 0 2", [
    ["membership_changed", pawn("white", "a3", "a4", ["b5"], [], empty, [], false), pawn("white", "a3", "a4", ["b5"])],
    ["membership_changed", pawn("black", "b5", "b4", ["a3"], ["a2"]), pawn("black", "b5", "b4", ["a3"])],
  ], { mirror: "membership_changed" }),
  ex("quiet.white", "quiet.black", "7k/2p5/2p5/1P6/3P4/8/8/7K w - - 0 1", "h1g1", "7k/2p5/2p5/1P6/3P4/8/8/6K1 b - - 1 1", []),
  ex("quiet.black", "quiet.white", "7k/8/8/3p4/1p6/2P5/2P5/7K b - - 0 1", "h8g8", "6k1/8/8/3p4/1p6/2P5/2P5/7K w - - 1 2", []),
  ex("no-pawns.white", "no-pawns.black", "7k/8/8/8/8/8/8/7K w - - 0 1", "h1g1", "7k/8/8/8/8/8/8/6K1 b - - 1 1", []),
  ex("no-pawns.black", "no-pawns.white", "7k/8/8/8/8/8/8/7K b - - 0 1", "h8g8", "6k1/8/8/8/8/8/8/7K w - - 1 2", []),
];

export const BACKWARD_LITERAL_SUBJECT = { kind: "event", projection: { id: "rules.structural.event.backward_pawn", version: 2 } } as const;
export function backwardLiteralOperands(row: Example): readonly (Obj & { readonly sign: Change[0] })[] {
  return row.events.map(([sign, before, after]) => ({ beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen,
    subject: { color: (before ?? after)!.color, beforePawn: before?.pawn ?? null, afterPawn: after?.pawn ?? null }, sign, before, after }));
}
const ordered = (path: readonly string[], value: SemanticMirrorValueRule, partnerPath = path): SemanticMirrorOperandRule => ({ sourcePath: path, partnerPath, value, collection: "ordered" });
function mirrorRules(row: Example, geometry: SemanticMirrorGeometry): readonly SemanticMirrorOperandRule[] {
  if (row.mirror === undefined) throw Error("This complete mixed-null population has independent absolutes, not a false square-over-null walk");
  const rules: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    ordered(["sign"], "identity"), ordered(["subject", "color"], "color"),
    ordered(["subject", "beforePawn"], row.mirror === "gained" ? "identity" : "square"),
    ordered(["subject", "afterPawn"], row.mirror === "lost" ? "identity" : "square"),
  ];
  for (const stage of ["before", "after"]) {
    rules.push(ordered([stage], "identity"), ordered([stage, "color"], "color"), ordered([stage, "pawn"], "square"), ordered([stage, "stop"], "square"),
      ordered([stage, "stopOccupancy", "kind"], "identity"), ordered([stage, "stopOccupancy", "piece", "color"], "color"), ordered([stage, "stopOccupancy", "piece", "role"], "identity"),
      ordered([stage, "halfOpenForColor", "color"], "color"), ordered([stage, "halfOpenForColor", "value"], "identity"));
    for (const key of ["controllers", "supportPawns", "aheadAdjacentPawns", "immediatePseudoCapture"]) {
      const reverse = geometry === "horizontal" && (key === "controllers" && row.twoControllers || key === "immediatePseudoCapture" && row.twoCaptures);
      if (reverse) for (const index of [0, 1]) {
        rules.push(ordered([stage, key, String(index), "color"], "color", [stage, key, String(1 - index), "color"]), ordered([stage, key, String(index), "square"], "square", [stage, key, String(1 - index), "square"]));
      } else rules.push(ordered([stage, key, "*", "color"], "color"), ordered([stage, key, "*", "square"], "square"));
    }
  }
  return rules;
}
interface SourceCase { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticEdgeInput; readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> }
const id = (example: string, arm: string) => `cited.literal-board.backward2.${example}.${arm}`;
const cases: SourceCase[] = BACKWARD_LITERAL_EXAMPLES.flatMap(row => {
  const input: SemanticEdgeInput = { kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen };
  if (row.events.length === 0) return [{ arm: "semantic_negative", input, proposition: { subject: BACKWARD_LITERAL_SUBJECT, case: { id: id(row.id, "negative"), version: 1 }, factConstraint: [], expectation: { kind: "omits" } } }];
  const positive: SourceCase = { arm: "positive", input, proposition: { subject: BACKWARD_LITERAL_SUBJECT, case: { id: id(row.id, "absolute"), version: 1 }, factConstraint: [], expectation: { kind: "emits_exact", events: backwardLiteralOperands(row).map(operands => ({ sign: operands.sign, operands })) } } };
  if (row.mirror === undefined) return [positive];
  const mirror = (geometry: SemanticMirrorGeometry, partner: string): SourceCase => ({ arm: "orientation", input, proposition: { subject: BACKWARD_LITERAL_SUBJECT, case: { id: id(row.id, geometry), version: 1 }, factConstraint: [], expectation: { kind: "mirrors", geometry,
    partnerCase: { kind: "case", id: id(partner, geometry), version: 1, subject: BACKWARD_LITERAL_SUBJECT, arm: "orientation" }, targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(row, geometry) } } });
  return [positive, mirror("color_and_vertical", row.partner), ...(row.horizontalPartner === undefined ? [] : [mirror("horizontal", row.horizontalPartner)])];
});
export const BACKWARD_LITERAL_SOURCE = Object.freeze({
  sourceId: "python-chess.literal-board.backward2", sourceRevision: OPPOSITION_LITERAL_SOURCE.sourceRevision, licence: OPPOSITION_LITERAL_SOURCE.licence, url: OPPOSITION_LITERAL_SOURCE.url,
  text: OPPOSITION_LITERAL_SOURCE.text + "\nCapture/EP/promotion facts:\n" + SEMANTIC_VALIDATION_TRANSITION_SOURCES[0]!.text + "\nPawn-step and pinned-control facts, lines495-518 and875-902:\n" + "def _sliding_attacks(square: Square, occupied: Bitboard, deltas: Iterable[int]) -> Bitboard:\n    attacks = BB_EMPTY\n\n    for delta in deltas:\n        sq = square\n\n        while True:\n            sq += delta\n            if not (0 <= sq < 64) or square_distance(sq, sq - delta) > 2:\n                break\n\n            attacks |= BB_SQUARES[sq]\n\n            if occupied & BB_SQUARES[sq]:\n                break\n\n    return attacks\n\ndef _step_attacks(square: Square, deltas: Iterable[int]) -> Bitboard:\n    return _sliding_attacks(square, BB_ALL, deltas)\n\nBB_KNIGHT_ATTACKS: List[Bitboard] = [_step_attacks(sq, [17, 15, 10, 6, -17, -15, -10, -6]) for sq in SQUARES]\nBB_KING_ATTACKS: List[Bitboard] = [_step_attacks(sq, [9, 8, 7, 1, -9, -8, -7, -1]) for sq in SQUARES]\nBB_PAWN_ATTACKS: List[List[Bitboard]] = [[_step_attacks(sq, deltas) for sq in SQUARES] for deltas in [[-7, -9], [7, 9]]]\n\n    def attacks_mask(self, square: Square) -> Bitboard:\n        bb_square = BB_SQUARES[square]\n\n        if bb_square & self.pawns:\n            color = bool(bb_square & self.occupied_co[WHITE])\n            return BB_PAWN_ATTACKS[color][square]\n        elif bb_square & self.knights:\n            return BB_KNIGHT_ATTACKS[square]\n        elif bb_square & self.kings:\n            return BB_KING_ATTACKS[square]\n        else:\n            attacks = 0\n            if bb_square & self.bishops or bb_square & self.queens:\n                attacks = BB_DIAG_ATTACKS[square][BB_DIAG_MASKS[square] & self.occupied]\n            if bb_square & self.rooks or bb_square & self.queens:\n                attacks |= (BB_RANK_ATTACKS[square][BB_RANK_MASKS[square] & self.occupied] |\n                            BB_FILE_ATTACKS[square][BB_FILE_MASKS[square] & self.occupied])\n            return attacks\n\n    def attacks(self, square: Square) -> SquareSet:\n        \"\"\"\n        Gets the set of attacked squares from the given square.\n\n        There will be no attacks if the square is empty. Pinned pieces are\n        still attacking other squares.\n\n        Returns a :class:`set of squares <chess.SquareSet>`.\n        \"\"\"",
  operation: { id: "runtime.semantic.foundation_edge", version: 1 } as const, cases,
});
