/** D3705: test/build-only recorded rule propositions. No strategic or forced-line claim.
 * Capture and pawn attack rules are retained from the GPL python-chess revision already
 * registered by semantic-validation-literal-sources. Timing is the accepted immediate
 * recorded-continuation convention; positions and expected identities below are literal.
 */
import { evidenceDigest } from "./evidence-contract.js";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import type { SemanticCanonicalValue, SemanticRecordedPathInput, SemanticValidationPropositionRecord } from "./semantic-validation.js";

type Fixture = readonly [name: string, fens: readonly string[], moves: readonly string[], operands: Readonly<Record<string, SemanticCanonicalValue>> | null];

function recordedCase(projection: string, fixture: Fixture) {
  const [name, fens, moves, operands] = fixture;
  if (fens.length !== moves.length + 1) throw new Error(`Incomplete literal recorded fixture ${name}`);
  const edges = moves.map((moveUci, index) => ({ kind: "edge" as const, beforeFen: fens[index]!, moveUci, afterFen: fens[index + 1]! }));
  return {
    arm: operands === null ? "semantic_negative" as const : "positive" as const,
    input: { kind: "recorded_path", pathReceipt: { id: "run.record.edge", version: 1 }, edges, pathDigest: evidenceDigest({ domain: "tabiya:semantic-validation-recorded-path@1", edges: edges.map(edge => [edge.beforeFen, edge.moveUci, edge.afterFen]) }) } satisfies SemanticRecordedPathInput,
    proposition: {
      subject: { kind: "event", projection: { id: projection, version: 2 } },
      case: { id: `cited.python-chess.recorded.${name}`, version: 1 }, factConstraint: [],
      expectation: operands === null ? { kind: "omits" } : { kind: "emits", minimum: 1, operandMatch: operands },
    } satisfies Omit<SemanticValidationPropositionRecord, "factConstraintSha256">,
  };
}

const tradeWhite = ["4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", "4k3/8/4p3/3P4/8/8/8/4K3 b - - 0 1", "4k3/8/8/3p4/8/8/8/4K3 w - - 0 2"];
const tradeBlack = ["4k3/8/8/4p3/3P4/4P3/8/4K3 b - - 0 1", "4k3/8/8/8/3p4/4P3/8/4K3 w - - 0 2", "4k3/8/8/8/3P4/8/8/4K3 b - - 0 2"];
const contactWhite = ["4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", "4k3/8/8/3p4/4P3/8/8/4K3 b - - 0 1", "8/5k2/8/3p4/4P3/8/8/4K3 w - - 1 2", "8/5k2/8/3P4/8/8/8/4K3 b - - 0 2"];
const contactBlack = ["4k3/4p3/8/8/3P4/8/8/4K3 b - - 0 1", "4k3/8/8/4p3/3P4/8/8/4K3 w - - 0 2", "4k3/8/8/4p3/3P4/8/5K2/8 b - - 1 2", "4k3/8/8/8/3p4/8/5K2/8 w - - 0 3"];

// Exact roles/colour and destination, not the material value or quality of an exchange.
const tradeOperands = (color: "white" | "black", square: string, firstRole = "pawn", secondRole = "pawn", victimRole = "pawn", enPassant = false) => ({
  landingSquare: square,
  first: { mover: { color, role: firstRole }, captured: { color: color === "white" ? "black" : "white", role: victimRole }, to: square, enPassant },
  second: { mover: { color: color === "white" ? "black" : "white", role: secondRole }, captured: { color, role: firstRole }, to: square, enPassant: false },
});
const tradeFixtures: readonly Fixture[] = [
  ["trade.immediate.white", tradeWhite, ["e4d5", "e6d5"], tradeOperands("white", "d5")],
  ["trade.immediate.black", tradeBlack, ["e5d4", "e3d4"], tradeOperands("black", "d4")],
  ["trade.en-passant.white", ["3r3k/8/8/3pP3/8/8/8/7K w - d6 0 1", "3r3k/8/3P4/8/8/8/8/7K b - - 0 1", "7k/8/3r4/8/8/8/8/7K w - - 0 2"], ["e5d6", "d8d6"], tradeOperands("white", "d6", "pawn", "rook", "pawn", true)],
  ["trade.en-passant.black", ["7k/8/8/8/3Pp3/8/8/3R3K b - d3 0 1", "7k/8/8/8/8/3p4/8/3R3K w - - 0 2", "7k/8/8/8/8/3R4/8/7K b - - 0 2"], ["e4d3", "d1d3"], tradeOperands("black", "d3", "pawn", "rook", "pawn", true)],
  ["trade.rook-for-pawn.white", ["r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "r3k3/R7/8/8/8/8/8/4K3 b - - 0 1", "4k3/r7/8/8/8/8/8/4K3 w - - 0 2"], ["a1a7", "a8a7"], tradeOperands("white", "a7", "rook", "rook")],
  ["trade.rook-for-pawn.black", ["r3k3/8/8/8/8/8/P7/R3K3 b - - 0 1", "4k3/8/8/8/8/8/r7/R3K3 w - - 0 2", "4k3/8/8/8/8/8/R7/4K3 b - - 0 2"], ["a8a2", "a1a2"], tradeOperands("black", "a2", "rook", "rook")],
  ["trade.delayed-negative.white", [tradeWhite[0]!, tradeWhite[1]!, "8/5k2/4p3/3P4/8/8/8/4K3 w - - 1 2", "8/5k2/4p3/3P4/8/8/5K2/8 b - - 2 2", "8/5k2/8/3p4/8/8/5K2/8 w - - 0 3"], ["e4d5", "e8f7", "e1f2", "e6d5"], null],
  ["trade.delayed-negative.black", [tradeBlack[0]!, tradeBlack[1]!, "4k3/8/8/8/3p4/4P3/5K2/8 b - - 1 2", "8/5k2/8/8/3p4/4P3/5K2/8 w - - 2 3", "8/5k2/8/8/3P4/8/5K2/8 b - - 0 3"], ["e5d4", "e1f2", "e8f7", "e3d4"], null],
  ["trade.other-square-negative.white", ["4k3/8/4p3/1p1p4/P3P3/8/8/4K3 w - - 0 1", "4k3/8/4p3/1p1P4/P7/8/8/4K3 b - - 0 1", "4k3/8/4p3/3P4/p7/8/8/4K3 w - - 0 2"], ["e4d5", "b5a4"], null],
  ["trade.other-square-negative.black", ["4k3/8/8/p3p3/1P1P4/4P3/8/4K3 b - - 0 1", "4k3/8/8/p7/1P1p4/4P3/8/4K3 w - - 0 2", "4k3/8/8/P7/3p4/4P3/8/4K3 b - - 0 2"], ["e5d4", "b4a5"], null],
];

const contactOperands = (color: "white" | "black", executed: boolean) => ({
  kind: executed ? "created_executed_next_own_move" : "created_survived_reply",
  pawn: { color, from: color === "white" ? "e2" : "e7", contactSquare: color === "white" ? "e4" : "e5" },
  contactedPawn: { square: color === "white" ? "d5" : "d4", piece: { color: color === "white" ? "black" : "white", role: "pawn" } },
});
const contactFixtures: readonly Fixture[] = [
  ["contact.survived.white", contactWhite.slice(0, 3), ["e2e4", "e8f7"], contactOperands("white", false)],
  ["contact.survived.black", contactBlack.slice(0, 3), ["e7e5", "e1f2"], contactOperands("black", false)],
  ["contact.executed.white", contactWhite, ["e2e4", "e8f7", "e4d5"], contactOperands("white", true)],
  ["contact.executed.black", contactBlack, ["e7e5", "e1f2", "e5d4"], contactOperands("black", true)],
  ["contact.target-moved-negative.white", [contactWhite[0]!, contactWhite[1]!, "4k3/8/8/8/3pP3/8/8/4K3 w - - 0 2"], ["e2e4", "d5d4"], null],
  ["contact.target-moved-negative.black", [contactBlack[0]!, contactBlack[1]!, "4k3/8/8/3Pp3/8/8/8/4K3 b - - 0 2"], ["e7e5", "d4d5"], null],
  ["contact.pawn-captured-negative.white", [contactWhite[0]!, contactWhite[1]!, "4k3/8/8/8/4p3/8/8/4K3 w - - 0 2"], ["e2e4", "d5e4"], null],
  ["contact.pawn-captured-negative.black", [contactBlack[0]!, contactBlack[1]!, "4k3/8/8/4P3/8/8/8/4K3 b - - 0 2"], ["e7e5", "d4e5"], null],
  ["contact.not-created-negative.white", ["4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1", "4k3/8/8/3p4/4P3/8/5K2/8 b - - 1 1", "8/5k2/8/3p4/4P3/8/5K2/8 w - - 2 2", "8/5k2/8/3P4/8/8/5K2/8 b - - 0 2"], ["e1f2", "e8f7", "e4d5"], null],
  ["contact.not-created-negative.black", ["4k3/8/8/4p3/3P4/8/8/4K3 b - - 0 1", "8/5k2/8/4p3/3P4/8/8/4K3 w - - 1 2", "8/5k2/8/4p3/3P4/8/5K2/8 b - - 2 2", "8/5k2/8/8/3p4/8/5K2/8 w - - 0 3"], ["e8f7", "e1f2", "e5d4"], null],
];

// D3717: legal two-edge windows with literal identities, not forced retreat or
// move quality. The source rules establish pawn attacks and occupied diagonals;
// the pressure-line convention supplies the declared role/value scope.
const pressureSetups = [
  ["competing-knight.white", "7k/8/2Q5/3N4/2n1b3/8/3P4/K7 w - - 0 1", "d2d3", "e4f3", true],
  ["competing-knight.black", "k7/3p4/8/2N1B3/3n4/2q5/8/7K b - - 0 1", "d7d6", "e5f6", true],
  ["competing-bishop.white", "7k/8/2Q5/3N4/2b1b3/8/3P4/K7 w - - 0 1", "d2d3", "e4f3", true],
  ["competing-bishop.black", "k7/3p4/8/2B1B3/3n4/2q5/8/7K b - - 0 1", "d7d6", "e5f6", true],
  ["unrelated-reply.white", "7k/8/2Q5/3N4/2n1b3/8/3P4/K7 w - - 0 1", "d2d3", "c4b6", false],
  ["unrelated-reply.black", "k7/3p4/8/2N1B3/3n4/2q5/8/7K b - - 0 1", "d7d6", "c5b3", false],
  ["lost-diagonal.white", "7k/8/2Q5/3N4/2n1b3/8/3P4/K7 w - - 0 1", "d2d3", "e4f5", false],
  ["lost-diagonal.black", "k7/3p4/8/2N1B3/3n4/2q5/8/7K b - - 0 1", "d7d6", "e5f4", false],
  ["no-screen.white", "7k/8/2Q5/8/4b3/8/3P4/K7 w - - 0 1", "d2d3", "e4f3", false],
  ["no-screen.black", "k7/3p4/8/4B3/8/2q5/8/7K b - - 0 1", "d7d6", "e5f6", false],
  ["two-screens.white", "7k/1Q6/2P5/3N4/4b3/8/3P4/K7 w - - 0 1", "d2d3", "e4f3", false],
  ["two-screens.black", "k7/3p4/8/4B3/3n4/2p5/1q6/7K b - - 0 1", "d7d6", "e5f6", false],
  ["friendly-screen.white", "7k/8/2Q5/3n4/4b3/8/3P4/K7 w - - 0 1", "d2d3", "e4f3", false],
  ["friendly-screen.black", "k7/3p4/8/4B3/3N4/2q5/8/7K b - - 0 1", "d7d6", "e5f6", false],
  ["minor-target.white", "7k/8/2N5/3N4/4b3/8/3P4/K7 w - - 0 1", "d2d3", "e4f3", false],
  ["minor-target.black", "k7/3p4/8/4B3/3n4/2n5/8/7K b - - 0 1", "d7d6", "e5f6", false],
  ["higher-screen.white", "7k/8/2R5/3Q4/4b3/8/3P4/K7 w - - 0 1", "d2d3", "e4f3", false],
  ["higher-screen.black", "k7/3p4/8/4B3/3q4/2r5/8/7K b - - 0 1", "d7d6", "e5f6", false],
] as const;

const pressureFixtures: readonly Fixture[] = pressureSetups.map(([name, fen, push, reply, emits]) => {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const color = position.turn === "white" ? "black" : "white";
  const fens = [makeFen(position.toSetup())];
  for (const uci of [push, reply]) {
    const move = parseUci(uci)!;
    if (!position.isLegal(move)) throw new Error(`Illegal independent pressure fixture ${name}: ${uci}`);
    position.play(move); fens.push(makeFen(position.toSetup()));
  }
  const square = name.endsWith("white") ? { from: "e4", to: "f3", screen: "d5", target: "c6", pawn: "d3" }
    : { from: "e5", to: "f6", screen: "d4", target: "c3", pawn: "d6" };
  const bishop = { color, role: "bishop" }, opponent = color === "white" ? "black" : "white";
  return [`pressure.${name}`, fens, [push, reply], emits ? {
    kind: "harassment_pressure_retained",
    pawn: { square: square.pawn, piece: { color: opponent, role: "pawn" } },
    minor: { before: { square: square.from, piece: bishop }, after: { square: square.to, piece: bishop } },
    pressure: {
      before: { slider: { square: square.from, piece: bishop }, screen: { square: square.screen, piece: { color: opponent, role: "knight" } }, target: { square: square.target, piece: { color: opponent, role: "queen" } } },
      after: { slider: { square: square.to, piece: bishop }, screen: { square: square.screen, piece: { color: opponent, role: "knight" } }, target: { square: square.target, piece: { color: opponent, role: "queen" } } },
    },
    conventionId: "pressure-line@1",
  } : null];
});

/** Source text is supplied by the existing retained independent rule manifests. */
export function recordedValidationSources(capture: { sourceRevision: string; licence: string; url: string; text: string }, contact: { sourceRevision: string; licence: string; url: string; text: string }, bishop: { text: string }) {
  return [
    { ...capture, sourceId: "python-chess.recorded.trade", operation: { id: "runtime.semantic.recorded_path", version: 1 } as const, cases: tradeFixtures.map(fixture => recordedCase("derived.exchange.trade_completed", fixture)) },
    { ...contact, text: `${contact.text}\n${capture.text}`, sourceId: "python-chess.recorded.contact", operation: { id: "runtime.semantic.recorded_path", version: 1 } as const, cases: contactFixtures.map(fixture => recordedCase("derived.pawn.sequence.contact_timing", fixture)) },
    { ...contact, text: `${contact.text}\n${bishop.text}`, sourceId: "python-chess.recorded.pressure", operation: { id: "runtime.semantic.recorded_path", version: 1 } as const, cases: pressureFixtures.map(fixture => recordedCase("derived.pawn.sequence.harassment_pressure", fixture)) },
  ];
}
