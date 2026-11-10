/** Build/test-only D4172/D4173 literal pawn/file propositions, under independent review.
 * No collector, production mirror, FEN-driven classifier or engine supplies expectations.
 * The tables explicitly enumerate complete populations; constructors only assemble supplied facts.
 * Python excerpts ground board/move facts, not strategy. The accepted pawn-file/group/island
 * conventions in foundation-source-identity §§3.3/3.5/3.6 supply the disclosed product arithmetic.
 * Retained Python copyright Niklas Fiekas; GPL-3.0-or-later, corresponding source/licence:
 * https://github.com/niklasf/python-chess/tree/3516d7c6c0879af724c2855fac5a304a4ef40949
 * https://github.com/niklasf/python-chess/blob/3516d7c6c0879af724c2855fac5a304a4ef40949/LICENSE.txt
 */
import { OPPOSITION_LITERAL_SOURCE } from "./semantic-validation-opposition-sources.js";
import { SEMANTIC_VALIDATION_TRANSITION_SOURCES } from "./semantic-validation-transition-sources.js";
import type { SemanticCanonicalValue, SemanticEdgeInput, SemanticMirrorGeometry, SemanticMirrorOperandRule, SemanticValidationCase, SemanticValidationPropositionRecord, SemanticMirrorValueRule } from "./semantic-validation.js";
type Color = "white" | "black";
type Obj = { readonly [key: string]: SemanticCanonicalValue };
type Group = Obj & { readonly color: Color; readonly file: string };
type State = "open" | "half_open_white" | "half_open_black" | "closed";
type FileRow = Obj & { readonly file: string; readonly whitePawns: readonly string[]; readonly blackPawns: readonly string[]; readonly state: State };
type Partition = { readonly files: readonly string[]; readonly pawns: readonly string[] };
type GroupSpec = readonly [sign: "gained" | "lost" | "membership_changed", before: Group | null, after: Group | null];
type FileSpec = readonly [before: FileRow, after: FileRow];
type AccessSpec = readonly [change: number, color: Color, role: "rook" | "queen", square: string];
type IslandSpec = readonly [color: Color, sign: "count_gained" | "count_lost" | "topology_changed", before: readonly Partition[], after: readonly Partition[]];
export type PawnFileFamily = "group" | "state" | "access" | "islands";
export interface PawnFileExample {
  readonly id: string; readonly partner: string; readonly horizontalPartner?: string;
  readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string;
  readonly cause: Obj; readonly groups: readonly GroupSpec[]; readonly files: readonly FileSpec[];
  readonly access: readonly AccessSpec[]; readonly islands: readonly IslandSpec[];
  readonly multipleFilePawns?: Color; readonly split?: true;
}
const group = (color: Color, file: string, pawns: readonly string[], adjacentOccupiedFiles: readonly string[], islandFiles: readonly string[]): Group =>
  ({ color, file, pawns: [...pawns], adjacentOccupiedFiles: [...adjacentOccupiedFiles], islandFiles: [...islandFiles], isolated: adjacentOccupiedFiles.length === 0, doubled: pawns.length > 1 });
const solo = (color: Color, file: string, square: string) => group(color, file, [square], [], [file]);
const file = (name: string, whitePawns: readonly string[], blackPawns: readonly string[], state: State): FileRow => ({ file: name, whitePawns: [...whitePawns], blackPawns: [...blackPawns], state });
const part = (files: readonly string[], pawns: readonly string[]): Partition => ({ files: [...files], pawns: [...pawns] });
const cause = (color: Color, role: string, from: string, to: string, captured: readonly [Color, string, string] | null, promotion: string | null = null): Obj =>
  ({ mover: { color, role, from, to, promotion }, captured: captured === null ? null : { color: captured[0], role: captured[1], square: captured[2] } });
const ex = (id: string, partner: string, beforeFen: string, moveUci: string, afterFen: string, details: Omit<PawnFileExample, "id" | "partner" | "beforeFen" | "moveUci" | "afterFen">): PawnFileExample => ({ id, partner, beforeFen, moveUci, afterFen, ...details });

export const PAWN_FILE_LITERAL_EXAMPLES: readonly PawnFileExample[] = [
  ex("capture.white", "capture.black", "1qr4k/8/8/8/1Q6/2n5/1P6/1R5K w - - 0 1", "b2c3", "1qr4k/8/8/8/1Q6/2P5/8/1R5K b - - 0 1", {
    horizontalPartner: "capture-west.white", cause: cause("white", "pawn", "b2", "c3", ["black", "knight", "c3"]),
    groups: [["lost", solo("white", "b", "b2"), null], ["gained", null, solo("white", "c", "c3")]],
    files: [[file("b", ["b2"], [], "half_open_black"), file("b", [], [], "open")], [file("c", [], [], "open"), file("c", ["c3"], [], "half_open_black")]],
    access: [[0, "white", "rook", "b1"], [0, "white", "queen", "b4"], [0, "black", "queen", "b8"]],
    islands: [["white", "topology_changed", [part(["b"], ["b2"])], [part(["c"], ["c3"])]]],
  }),
  ex("capture.black", "capture.white", "1r5k/1p6/2N5/1q6/8/8/8/1QR4K b - - 0 1", "b7c6", "1r5k/8/2p5/1q6/8/8/8/1QR4K w - - 0 2", {
    horizontalPartner: "capture-west.black", cause: cause("black", "pawn", "b7", "c6", ["white", "knight", "c6"]),
    groups: [["lost", solo("black", "b", "b7"), null], ["gained", null, solo("black", "c", "c6")]],
    files: [[file("b", [], ["b7"], "half_open_white"), file("b", [], [], "open")], [file("c", [], [], "open"), file("c", [], ["c6"], "half_open_white")]],
    access: [[0, "white", "queen", "b1"], [0, "black", "rook", "b8"], [0, "black", "queen", "b5"]],
    islands: [["black", "topology_changed", [part(["b"], ["b7"])], [part(["c"], ["c6"])]]],
  }),
  ex("capture-west.white", "capture-west.black", "k4rq1/8/8/8/6Q1/5n2/6P1/K5R1 w - - 0 1", "g2f3", "k4rq1/8/8/8/6Q1/5P2/8/K5R1 b - - 0 1", {
    horizontalPartner: "capture.white", cause: cause("white", "pawn", "g2", "f3", ["black", "knight", "f3"]),
    groups: [["gained", null, solo("white", "f", "f3")], ["lost", solo("white", "g", "g2"), null]],
    files: [[file("f", [], [], "open"), file("f", ["f3"], [], "half_open_black")], [file("g", ["g2"], [], "half_open_black"), file("g", [], [], "open")]],
    access: [[1, "white", "rook", "g1"], [1, "white", "queen", "g4"], [1, "black", "queen", "g8"]],
    islands: [["white", "topology_changed", [part(["g"], ["g2"])], [part(["f"], ["f3"])]]],
  }),
  ex("capture-west.black", "capture-west.white", "k5r1/6p1/5N2/6q1/8/8/8/K4RQ1 b - - 0 1", "g7f6", "k5r1/8/5p2/6q1/8/8/8/K4RQ1 w - - 0 2", {
    horizontalPartner: "capture.black", cause: cause("black", "pawn", "g7", "f6", ["white", "knight", "f6"]),
    groups: [["gained", null, solo("black", "f", "f6")], ["lost", solo("black", "g", "g7"), null]],
    files: [[file("f", [], [], "open"), file("f", [], ["f6"], "half_open_white")], [file("g", [], ["g7"], "half_open_white"), file("g", [], [], "open")]],
    access: [[1, "white", "queen", "g1"], [1, "black", "rook", "g8"], [1, "black", "queen", "g5"]],
    islands: [["black", "topology_changed", [part(["g"], ["g7"])], [part(["f"], ["f6"])]]],
  }),
  ex("closed.white", "closed.black", "1q5k/p7/8/1p6/P7/8/8/R6K w - - 0 1", "a4b5", "1q5k/p7/8/1P6/8/8/8/R6K b - - 0 1", {
    cause: cause("white", "pawn", "a4", "b5", ["black", "pawn", "b5"]),
    groups: [["lost", solo("white", "a", "a4"), null], ["gained", null, solo("white", "b", "b5")], ["membership_changed", group("black", "a", ["a7"], ["b"], ["a", "b"]), solo("black", "a", "a7")], ["lost", group("black", "b", ["b5"], ["a"], ["a", "b"]), null]],
    files: [[file("a", ["a4"], ["a7"], "closed"), file("a", [], ["a7"], "half_open_white")], [file("b", [], ["b5"], "half_open_white"), file("b", ["b5"], [], "half_open_black")]],
    access: [[0, "white", "rook", "a1"], [1, "black", "queen", "b8"]],
    islands: [["white", "topology_changed", [part(["a"], ["a4"])], [part(["b"], ["b5"])]], ["black", "topology_changed", [part(["a", "b"], ["a7", "b5"])], [part(["a"], ["a7"])]]],
  }),
  ex("closed.black", "closed.white", "r6k/8/8/p7/1P6/8/P7/1Q5K b - - 0 1", "a5b4", "r6k/8/8/8/1p6/8/P7/1Q5K w - - 0 2", {
    cause: cause("black", "pawn", "a5", "b4", ["white", "pawn", "b4"]),
    groups: [["membership_changed", group("white", "a", ["a2"], ["b"], ["a", "b"]), solo("white", "a", "a2")], ["lost", group("white", "b", ["b4"], ["a"], ["a", "b"]), null], ["lost", solo("black", "a", "a5"), null], ["gained", null, solo("black", "b", "b4")]],
    files: [[file("a", ["a2"], ["a5"], "closed"), file("a", ["a2"], [], "half_open_black")], [file("b", ["b4"], [], "half_open_black"), file("b", [], ["b4"], "half_open_white")]],
    access: [[0, "black", "rook", "a8"], [1, "white", "queen", "b1"]],
    islands: [["white", "topology_changed", [part(["a", "b"], ["a2", "b4"])], [part(["a"], ["a2"])]], ["black", "topology_changed", [part(["a"], ["a5"])], [part(["b"], ["b4"])]]],
  }),
  ex("triple.white", "triple.black", "7k/8/8/8/P7/P7/PP6/R6K w - - 0 1", "a4a5", "7k/8/8/P7/8/P7/PP6/R6K b - - 0 1", {
    horizontalPartner: "triple-west.white", cause: cause("white", "pawn", "a4", "a5", null),
    groups: [["membership_changed", group("white", "a", ["a4", "a3", "a2"], ["b"], ["a", "b"]), group("white", "a", ["a5", "a3", "a2"], ["b"], ["a", "b"])]], files: [], access: [], islands: [],
  }),
  ex("triple.black", "triple.white", "r6k/pp6/p7/p7/8/8/8/7K b - - 0 1", "a5a4", "r6k/pp6/p7/8/p7/8/8/7K w - - 0 2", {
    horizontalPartner: "triple-west.black", cause: cause("black", "pawn", "a5", "a4", null),
    groups: [["membership_changed", group("black", "a", ["a5", "a6", "a7"], ["b"], ["a", "b"]), group("black", "a", ["a4", "a6", "a7"], ["b"], ["a", "b"])]], files: [], access: [], islands: [],
  }),
  ex("triple-west.white", "triple-west.black", "k7/8/8/8/7P/7P/6PP/K6R w - - 0 1", "h4h5", "k7/8/8/7P/8/7P/6PP/K6R b - - 0 1", {
    horizontalPartner: "triple.white", cause: cause("white", "pawn", "h4", "h5", null),
    groups: [["membership_changed", group("white", "h", ["h4", "h3", "h2"], ["g"], ["g", "h"]), group("white", "h", ["h5", "h3", "h2"], ["g"], ["g", "h"])]], files: [], access: [], islands: [],
  }),
  ex("triple-west.black", "triple-west.white", "k6r/6pp/7p/7p/8/8/8/K7 b - - 0 1", "h5h4", "k6r/6pp/7p/8/7p/8/8/K7 w - - 0 2", {
    horizontalPartner: "triple.black", cause: cause("black", "pawn", "h5", "h4", null),
    groups: [["membership_changed", group("black", "h", ["h5", "h6", "h7"], ["g"], ["g", "h"]), group("black", "h", ["h4", "h6", "h7"], ["g"], ["g", "h"])]], files: [], access: [], islands: [],
  }),
  ex("ep.white", "ep.black", "3q3k/8/8/3pP3/8/8/8/4R2K w - d6 0 1", "e5d6", "3q3k/8/3P4/8/8/8/8/4R2K b - - 0 1", {
    cause: cause("white", "pawn", "e5", "d6", ["black", "pawn", "d5"]),
    groups: [["gained", null, solo("white", "d", "d6")], ["lost", solo("white", "e", "e5"), null], ["lost", solo("black", "d", "d5"), null]],
    files: [[file("d", [], ["d5"], "half_open_white"), file("d", ["d6"], [], "half_open_black")], [file("e", ["e5"], [], "half_open_black"), file("e", [], [], "open")]],
    access: [[0, "black", "queen", "d8"], [1, "white", "rook", "e1"]],
    islands: [["white", "topology_changed", [part(["e"], ["e5"])], [part(["d"], ["d6"])]], ["black", "count_lost", [part(["d"], ["d5"])], []]],
  }),
  ex("ep.black", "ep.white", "4r2k/8/8/8/3Pp3/8/8/3Q3K b - d3 0 1", "e4d3", "4r2k/8/8/8/8/3p4/8/3Q3K w - - 0 2", {
    cause: cause("black", "pawn", "e4", "d3", ["white", "pawn", "d4"]),
    groups: [["lost", solo("white", "d", "d4"), null], ["gained", null, solo("black", "d", "d3")], ["lost", solo("black", "e", "e4"), null]],
    files: [[file("d", ["d4"], [], "half_open_black"), file("d", [], ["d3"], "half_open_white")], [file("e", [], ["e4"], "half_open_white"), file("e", [], [], "open")]],
    access: [[0, "white", "queen", "d1"], [1, "black", "rook", "e8"]],
    islands: [["white", "count_lost", [part(["d"], ["d4"])], []], ["black", "topology_changed", [part(["e"], ["e4"])], [part(["d"], ["d3"])]]],
  }),
  ex("promotion.white", "promotion.black", "7k/P7/8/8/8/8/8/R6K w - - 0 1", "a7a8q", "Q6k/8/8/8/8/8/8/R6K b - - 0 1", {
    cause: cause("white", "pawn", "a7", "a8", null, "queen"), groups: [["lost", solo("white", "a", "a7"), null]],
    files: [[file("a", ["a7"], [], "half_open_black"), file("a", [], [], "open")]], access: [[0, "white", "rook", "a1"]], islands: [["white", "count_lost", [part(["a"], ["a7"])], []]],
  }),
  ex("promotion.black", "promotion.white", "r6k/8/8/8/8/8/p7/7K b - - 0 1", "a2a1q", "r6k/8/8/8/8/8/8/q6K w - - 0 2", {
    cause: cause("black", "pawn", "a2", "a1", null, "queen"), groups: [["lost", solo("black", "a", "a2"), null]],
    files: [[file("a", [], ["a2"], "half_open_white"), file("a", [], [], "open")]], access: [[0, "black", "rook", "a8"]], islands: [["black", "count_lost", [part(["a"], ["a2"])], []]],
  }),
  ex("capture-promotion.white", "capture-promotion.black", "1r5k/P7/8/8/8/8/8/R6K w - - 0 1", "a7b8q", "1Q5k/8/8/8/8/8/8/R6K b - - 0 1", {
    cause: cause("white", "pawn", "a7", "b8", ["black", "rook", "b8"], "queen"), groups: [["lost", solo("white", "a", "a7"), null]],
    files: [[file("a", ["a7"], [], "half_open_black"), file("a", [], [], "open")]], access: [[0, "white", "rook", "a1"]], islands: [["white", "count_lost", [part(["a"], ["a7"])], []]],
  }),
  ex("capture-promotion.black", "capture-promotion.white", "r6k/8/8/8/8/8/p7/1R5K b - - 0 1", "a2b1q", "r6k/8/8/8/8/8/8/1q5K w - - 0 2", {
    cause: cause("black", "pawn", "a2", "b1", ["white", "rook", "b1"], "queen"), groups: [["lost", solo("black", "a", "a2"), null]],
    files: [[file("a", [], ["a2"], "half_open_white"), file("a", [], [], "open")]], access: [[0, "black", "rook", "a8"]], islands: [["black", "count_lost", [part(["a"], ["a2"])], []]],
  }),
  ex("moving-sibling.white", "moving-sibling.black", "Q7/p6k/8/8/8/8/8/R6K w - - 0 1", "a1a7", "Q7/R6k/8/8/8/8/8/7K b - - 0 1", {
    cause: cause("white", "rook", "a1", "a7", ["black", "pawn", "a7"]), groups: [["lost", solo("black", "a", "a7"), null]],
    files: [[file("a", [], ["a7"], "half_open_white"), file("a", [], [], "open")]], access: [[0, "white", "queen", "a8"]], islands: [["black", "count_lost", [part(["a"], ["a7"])], []]],
  }),
  ex("moving-sibling.black", "moving-sibling.white", "r6k/8/8/8/8/8/P6K/q7 b - - 0 1", "a8a2", "7k/8/8/8/8/8/r6K/q7 w - - 0 2", {
    cause: cause("black", "rook", "a8", "a2", ["white", "pawn", "a2"]), groups: [["lost", solo("white", "a", "a2"), null]],
    files: [[file("a", ["a2"], [], "half_open_black"), file("a", [], [], "open")]], access: [[0, "black", "queen", "a1"]], islands: [["white", "count_lost", [part(["a"], ["a2"])], []]],
  }),
  ex("moving-only.white", "moving-only.black", "7k/p7/8/8/8/8/8/R6K w - - 0 1", "a1a7", "7k/R7/8/8/8/8/8/7K b - - 0 1", {
    cause: cause("white", "rook", "a1", "a7", ["black", "pawn", "a7"]), groups: [["lost", solo("black", "a", "a7"), null]],
    files: [[file("a", [], ["a7"], "half_open_white"), file("a", [], [], "open")]], access: [], islands: [["black", "count_lost", [part(["a"], ["a7"])], []]],
  }),
  ex("moving-only.black", "moving-only.white", "r6k/8/8/8/8/8/P7/7K b - - 0 1", "a8a2", "7k/8/8/8/8/8/r7/7K w - - 0 2", {
    cause: cause("black", "rook", "a8", "a2", ["white", "pawn", "a2"]), groups: [["lost", solo("white", "a", "a2"), null]],
    files: [[file("a", ["a2"], [], "half_open_black"), file("a", [], [], "open")]], access: [], islands: [["white", "count_lost", [part(["a"], ["a2"])], []]],
  }),
  ex("split.white", "split.black", "7k/8/8/8/8/2n5/PPP5/1R5K w - - 0 1", "b2c3", "7k/8/8/8/8/2P5/P1P5/1R5K b - - 0 1", {
    split: true, cause: cause("white", "pawn", "b2", "c3", ["black", "knight", "c3"]),
    groups: [["membership_changed", group("white", "a", ["a2"], ["b"], ["a", "b", "c"]), solo("white", "a", "a2")], ["lost", group("white", "b", ["b2"], ["a", "c"], ["a", "b", "c"]), null], ["membership_changed", group("white", "c", ["c2"], ["b"], ["a", "b", "c"]), group("white", "c", ["c3", "c2"], [], ["c"])]],
    files: [[file("b", ["b2"], [], "half_open_black"), file("b", [], [], "open")]], access: [[0, "white", "rook", "b1"]],
    islands: [["white", "count_gained", [part(["a", "b", "c"], ["a2", "b2", "c2"])], [part(["a"], ["a2"]), part(["c"], ["c2", "c3"])]]],
  }),
  ex("split.black", "split.white", "1r5k/ppp5/2N5/8/8/8/8/7K b - - 0 1", "b7c6", "1r5k/p1p5/2p5/8/8/8/8/7K w - - 0 2", {
    split: true, cause: cause("black", "pawn", "b7", "c6", ["white", "knight", "c6"]),
    groups: [["membership_changed", group("black", "a", ["a7"], ["b"], ["a", "b", "c"]), solo("black", "a", "a7")], ["lost", group("black", "b", ["b7"], ["a", "c"], ["a", "b", "c"]), null], ["membership_changed", group("black", "c", ["c7"], ["b"], ["a", "b", "c"]), group("black", "c", ["c6", "c7"], [], ["c"])]],
    files: [[file("b", [], ["b7"], "half_open_white"), file("b", [], [], "open")]], access: [[0, "black", "rook", "b8"]],
    islands: [["black", "count_gained", [part(["a", "b", "c"], ["a7", "b7", "c7"])], [part(["a"], ["a7"]), part(["c"], ["c6", "c7"])]]],
  }),
  ex("merge.white", "merge.black", "7k/8/8/8/8/1n6/P1P5/7K w - - 0 1", "a2b3", "7k/8/8/8/8/1P6/2P5/7K b - - 0 1", {
    cause: cause("white", "pawn", "a2", "b3", ["black", "knight", "b3"]),
    groups: [["lost", solo("white", "a", "a2"), null], ["gained", null, group("white", "b", ["b3"], ["c"], ["b", "c"])], ["membership_changed", solo("white", "c", "c2"), group("white", "c", ["c2"], ["b"], ["b", "c"])]],
    files: [[file("a", ["a2"], [], "half_open_black"), file("a", [], [], "open")], [file("b", [], [], "open"), file("b", ["b3"], [], "half_open_black")]], access: [],
    islands: [["white", "count_lost", [part(["a"], ["a2"]), part(["c"], ["c2"])], [part(["b", "c"], ["b3", "c2"])]]],
  }),
  ex("merge.black", "merge.white", "7k/p1p5/1N6/8/8/8/8/7K b - - 0 1", "a7b6", "7k/2p5/1p6/8/8/8/8/7K w - - 0 2", {
    cause: cause("black", "pawn", "a7", "b6", ["white", "knight", "b6"]),
    groups: [["lost", solo("black", "a", "a7"), null], ["gained", null, group("black", "b", ["b6"], ["c"], ["b", "c"])], ["membership_changed", solo("black", "c", "c7"), group("black", "c", ["c7"], ["b"], ["b", "c"])]],
    files: [[file("a", [], ["a7"], "half_open_white"), file("a", [], [], "open")], [file("b", [], [], "open"), file("b", [], ["b6"], "half_open_white")]], access: [],
    islands: [["black", "count_lost", [part(["a"], ["a7"]), part(["c"], ["c7"])], [part(["b", "c"], ["b6", "c7"])]]],
  }),
  ex("multi-file.white", "multi-file.black", "1q5k/1p6/8/N7/1P6/8/1P6/7K w - - 0 1", "a5b7", "1q5k/1N6/8/8/1P6/8/1P6/7K b - - 0 1", {
    multipleFilePawns: "white", cause: cause("white", "knight", "a5", "b7", ["black", "pawn", "b7"]), groups: [["lost", solo("black", "b", "b7"), null]],
    files: [[file("b", ["b2", "b4"], ["b7"], "closed"), file("b", ["b2", "b4"], [], "half_open_black")]], access: [[0, "black", "queen", "b8"]], islands: [["black", "count_lost", [part(["b"], ["b7"])], []]],
  }),
  ex("multi-file.black", "multi-file.white", "7k/1p6/8/1p6/n7/8/1P6/1Q5K b - - 0 1", "a4b2", "7k/1p6/8/1p6/8/8/1n6/1Q5K w - - 0 2", {
    multipleFilePawns: "black", cause: cause("black", "knight", "a4", "b2", ["white", "pawn", "b2"]), groups: [["lost", solo("white", "b", "b2"), null]],
    files: [[file("b", ["b2"], ["b5", "b7"], "closed"), file("b", [], ["b5", "b7"], "half_open_white")]], access: [[0, "white", "queen", "b1"]], islands: [["white", "count_lost", [part(["b"], ["b2"])], []]],
  }),
  ex("quiet.white", "quiet.black", "7k/6pp/8/8/8/8/PP6/7K w - - 0 1", "h1g1", "7k/6pp/8/8/8/8/PP6/6K1 b - - 1 1", { cause: cause("white", "king", "h1", "g1", null), groups: [], files: [], access: [], islands: [] }),
  ex("quiet.black", "quiet.white", "7k/pp6/8/8/8/8/6PP/7K b - - 0 1", "h8g8", "6k1/pp6/8/8/8/8/6PP/7K w - - 1 2", { cause: cause("black", "king", "h8", "g8", null), groups: [], files: [], access: [], islands: [] }),
];

export const PAWN_FILE_SUBJECTS = {
  group: { kind: "event", projection: { id: "derived.structural.event.pawn_file_group", version: 1 } },
  state: { kind: "event", projection: { id: "derived.activity.event.file_state", version: 1 } },
  access: { kind: "event", projection: { id: "derived.activity.event.file_access_revealed", version: 1 } },
  islands: { kind: "event", projection: { id: "rules.structural.event.pawn_islands", version: 2 } },
} as const;
/** Assemble literal rows only. No source computation, geometric detection or move replay. */
export function pawnFileLiteralOperands(row: PawnFileExample, family: PawnFileFamily): readonly (Obj & { readonly sign: import("./evidence-contract.js").SemanticEventSign })[] {
  const edge = { beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen };
  const changes = row.files.map(([before, after]) => ({ ...edge, file: before.file, sign: "membership_changed" as const, before, after, cause: row.cause }));
  switch (family) {
    case "group": return row.groups.map(([sign, before, after]) => ({ ...edge, subject: { color: (before ?? after)!.color, file: (before ?? after)!.file }, sign, before, after, cause: row.cause }));
    case "state": return changes;
    case "access": return row.access.map(([index, color, role, square]) => {
      const fileChange = changes[index]; if (fileChange === undefined) throw Error("Literal access must name its original literal file change");
      return { ...edge, file: fileChange.file, piece: { color, role, square }, sign: "gained" as const, beforeState: row.files[index]![0].state, afterState: row.files[index]![1].state, fileChange };
    });
    case "islands": return row.islands.map(([color, sign, before, after]) => ({ ...edge, color, sign, beforeCount: before.length, afterCount: after.length, before: before.map(value => ({ ...value })), after: after.map(value => ({ ...value })) }));
  }
}


// Source-specific complete walks. Ordered optional paths resolve0/1 leaves for mixed null/object
// rows. Empty arrays have NO scalar leaf in this comparator; exact absolute populations establish
// their presence/shape. No canonical_set, runtime payload discovery or arbitrary field classifier.
const ordered = (path: readonly string[], value: SemanticMirrorValueRule, partnerPath = path): SemanticMirrorOperandRule => ({ sourcePath: path, partnerPath, value, collection: "ordered" });
function edgeRules(nested = false): readonly SemanticMirrorOperandRule[] {
  return nested ? [
    { sourcePath: ["fileChange", "beforeFen"], partnerPath: ["fileChange", "beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["fileChange", "moveUci"], partnerPath: ["fileChange", "moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["fileChange", "afterFen"], partnerPath: ["fileChange", "afterFen"], value: "input_after_fen", collection: "scalar" },
  ] : [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
  ];
}
function causeRules(prefix: readonly string[]): readonly SemanticMirrorOperandRule[] {
  const path = [...prefix, "cause"];
  return [ordered([...path, "mover", "color"], "color"), ...["role", "promotion"].map(key => ordered([...path, "mover", key], "identity")),
    ...["from", "to"].map(key => ordered([...path, "mover", key], "square")), ordered([...path, "captured"], "identity"),
    ordered([...path, "captured", "color"], "color"), ordered([...path, "captured", "role"], "identity"), ordered([...path, "captured", "square"], "square")];
}
function fileRowRules(prefix: readonly string[], row: PawnFileExample, geometry: SemanticMirrorGeometry): readonly SemanticMirrorOperandRule[] {
  const rules: SemanticMirrorOperandRule[] = [ordered([...prefix, "file"], "file"), ordered([...prefix, "state"], "file_state")];
  for (const color of ["white", "black"] as const) {
    const partner = geometry === "color_and_vertical" ? color === "white" ? "black" : "white" : color;
    const from = [...prefix, `${color}Pawns`], to = [...prefix, `${partner}Pawns`];
    if (row.multipleFilePawns === color && geometry === "color_and_vertical") {
      for (const index of [0, 1]) rules.push(ordered([...from, String(index)], "square", [...to, String(1 - index)]));
    } else rules.push(ordered([...from, "*"], "square", [...to, "*"]));
  }
  return rules;
}
function mirrorRules(family: PawnFileFamily, row: PawnFileExample, geometry: SemanticMirrorGeometry): readonly SemanticMirrorOperandRule[] {
  const rules: SemanticMirrorOperandRule[] = [...edgeRules(), ordered(["sign"], "identity")];
  if (family === "group") {
    rules.push(ordered(["subject", "color"], "color"), ordered(["subject", "file"], "file"), ...causeRules([]));
    for (const stage of ["before", "after"]) {
      rules.push(ordered([stage], "identity"), ordered([stage, "color"], "color"), ordered([stage, "file"], "file"),
        ordered([stage, "isolated"], "identity"), ordered([stage, "doubled"], "identity"), ordered([stage, "pawns", "*"], "square"), ordered([stage, "adjacentOccupiedFiles", "*"], "file"));
      if (geometry === "horizontal" && row.id.startsWith("triple")) {
        for (const index of [0, 1]) rules.push(ordered([stage, "islandFiles", String(index)], "file", [stage, "islandFiles", String(1 - index)]));
      } else rules.push(ordered([stage, "islandFiles", "*"], "file"));
    }
  } else if (family === "state" || family === "access") {
    const prefix = family === "access" ? ["fileChange"] : [];
    if (family === "access") rules.push(...edgeRules(true), ordered(["file"], "file"), ordered(["piece", "color"], "color"), ordered(["piece", "role"], "identity"),
      ordered(["piece", "square"], "square"), ordered(["beforeState"], "file_state"), ordered(["afterState"], "file_state"), ordered(["fileChange", "sign"], "identity"));
    rules.push(ordered([...prefix, "file"], "file"), ...causeRules(prefix));
    for (const stage of ["before", "after"]) rules.push(...fileRowRules([...prefix, stage], row, geometry));
  } else {
    rules.push(ordered(["color"], "color"), ordered(["beforeCount"], "identity"), ordered(["afterCount"], "identity"));
    for (const stage of ["before", "after"]) {
      if (row.split && stage === "after") {
        // One changed color, two explicit partitions a/c; c has two lexical-rank members.
        for (const index of [0, 1]) rules.push(ordered([stage, String(index), "files", "*"], "file"));
        rules.push(ordered([stage, "0", "pawns", "*"], "square"));
        for (const index of [0, 1]) rules.push(ordered([stage, "1", "pawns", String(index)], "square", [stage, "1", "pawns", String(geometry === "color_and_vertical" ? 1 - index : index)]));
      } else rules.push(ordered([stage, "*", "files", "*"], "file"), ordered([stage, "*", "pawns", "*"], "square"));
    }
  }
  return rules;
}
interface SourceCase { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticEdgeInput; readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> }
export const PAWN_FILE_FAMILIES: readonly PawnFileFamily[] = ["group", "state", "access", "islands"];
const text = OPPOSITION_LITERAL_SOURCE.text + "\nIndependent physical capture/EP/promotion facts:\n" + SEMANTIC_VALIDATION_TRANSITION_SOURCES[0]!.text;
export const PAWN_FILE_LITERAL_SOURCES = Object.freeze(PAWN_FILE_FAMILIES.map(family => {
  const subject = PAWN_FILE_SUBJECTS[family], id = (example: string, arm: string) => `cited.literal-board.pawn-file.${family}.${example}.${arm}`;
  const cases: SourceCase[] = PAWN_FILE_LITERAL_EXAMPLES.flatMap(row => {
    const input: SemanticEdgeInput = { kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen };
    const population = pawnFileLiteralOperands(row, family);
    if (population.length === 0) return [{ arm: "semantic_negative", input, proposition: { subject, case: { id: id(row.id, "negative"), version: 1 }, factConstraint: [], expectation: { kind: "omits" } } }];
    const absolute: SourceCase = { arm: "positive", input, proposition: { subject, case: { id: id(row.id, "absolute"), version: 1 }, factConstraint: [], expectation: { kind: "emits_exact", events: population.map(operands => ({ sign: operands.sign, operands })) } } };
    const mirror = (geometry: SemanticMirrorGeometry, partner: string): SourceCase => ({ arm: "orientation", input, proposition: { subject, case: { id: id(row.id, geometry), version: 1 }, factConstraint: [], expectation: { kind: "mirrors", geometry,
      partnerCase: { kind: "case", id: id(partner, geometry), version: 1, subject, arm: "orientation" }, targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(family, row, geometry) } } });
    return [absolute, mirror("color_and_vertical", row.partner), ...(row.horizontalPartner === undefined ? [] : [mirror("horizontal", row.horizontalPartner)])];
  });
  return { sourceId: `python-chess.literal-board.pawn-file.${family}`, sourceRevision: OPPOSITION_LITERAL_SOURCE.sourceRevision, licence: OPPOSITION_LITERAL_SOURCE.licence, url: OPPOSITION_LITERAL_SOURCE.url,
    text, operation: { id: "runtime.semantic.foundation_edge", version: 1 } as const, cases };
}));
