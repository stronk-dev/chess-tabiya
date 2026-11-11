/** Literal board reference for exact original-pawn subjects. No production chess classifier,
 * lineage tracker, candidate compiler or source outcome supplies the expected values. */
import { BACKWARD_LITERAL_SOURCE } from "./semantic-validation-backward-sources.js";
import { COUNT_LITERAL_POPULATIONS, countPopulationInput } from "./semantic-validation-count-population-sources.js";
import type {
  SemanticCanonicalValue, SemanticEdgeInput, SemanticMirrorOperandRule, SemanticMirrorValueRule,
  SemanticSubjectOutcomesInput, SemanticValidationCase, SemanticValidationExpectation, SemanticValidationPropositionRecord,
} from "./semantic-validation.js";

export const PAWN_LINEAGE_FAMILIES = ["backward_pawn", "passed_pawn"] as const;
export type PawnLineageFamily = (typeof PAWN_LINEAGE_FAMILIES)[number];
type LiteralPopulation = (typeof COUNT_LITERAL_POPULATIONS)[number];
type Color = "white" | "black";
type Pawn = { readonly color: Color; readonly square: string };
type State = { readonly kind: "present"; readonly value: boolean } | { readonly kind: "removed"; readonly at: string }
  | { readonly kind: "promoted"; readonly current: { readonly color: Color; readonly role: string; readonly square: string } };
const promotions = { q: "queen", r: "rook", b: "bishop", n: "knight" } as const;
const relations = ["false_to_true", "true_to_false", "true_to_true", "false_to_false"] as const;

// Capturing on b4/b5 removes the only eligible support for d4/d5. The other d-file pawn
// stays false, and the pawn ahead on the c-file cannot supply the missing support.
const subjectBoundaries: readonly LiteralPopulation[] = [
  { id: "support-loss.white", partner: "support-loss.black", root: "7k/8/2p5/2P5/1n1P4/2P5/3P4/7K w - - 0 1",
    plays: ["h1g1", "c3b4"], edges: [
      ["c3b4", "7k/8/2p5/2P5/1P1P4/8/3P4/7K b - - 0 1"],
      ["c3c4", "7k/8/2p5/2P5/1nPP4/8/3P4/7K b - - 0 1"],
      ["d2d3", "7k/8/2p5/2P5/1n1P4/2PP4/8/7K b - - 0 1"],
      ["d4d5", "7k/8/2p5/2PP4/1n6/2P5/3P4/7K b - - 0 1"],
      ["h1g1", "7k/8/2p5/2P5/1n1P4/2P5/3P4/6K1 b - - 1 1"],
      ["h1g2", "7k/8/2p5/2P5/1n1P4/2P5/3P2K1/8 b - - 1 1"],
      ["h1h2", "7k/8/2p5/2P5/1n1P4/2P5/3P3K/8 b - - 1 1"],
    ] },
  { id: "support-loss.black", partner: "support-loss.white", root: "7k/3p4/2p5/1N1p4/2p5/2P5/8/7K b - - 0 1",
    plays: ["h8g8", "c6b5"], edges: [
      ["c6b5", "7k/3p4/8/1p1p4/2p5/2P5/8/7K w - - 0 2"],
      ["c6c5", "7k/3p4/8/1Npp4/2p5/2P5/8/7K w - - 0 2"],
      ["d5d4", "7k/3p4/2p5/1N6/2pp4/2P5/8/7K w - - 0 2"],
      ["d7d6", "7k/8/2pp4/1N1p4/2p5/2P5/8/7K w - - 0 2"],
      ["h8g7", "8/3p2k1/2p5/1N1p4/2p5/2P5/8/7K w - - 1 2"],
      ["h8g8", "6k1/3p4/2p5/1N1p4/2p5/2P5/8/7K w - - 1 2"],
      ["h8h7", "8/3p3k/2p5/1N1p4/2p5/2P5/8/7K w - - 1 2"],
    ] },
  // On the stationary d-file pawn, the quiet king move keeps the adjacent blocker.
  // The c-pawn push makes the same d-pawn passed, while the capture removes it.
  { id: "pass-or-remove.white", partner: "pass-or-remove.black", root: "7k/8/8/3p4/2P5/8/8/7K w - - 0 1",
    plays: ["h1g1", "c4c5", "c4d5"], edges: [
      ["c4c5", "7k/8/8/2Pp4/8/8/8/7K b - - 0 1"],
      ["c4d5", "7k/8/8/3P4/8/8/8/7K b - - 0 1"],
      ["h1g1", "7k/8/8/3p4/2P5/8/8/6K1 b - - 1 1"],
      ["h1g2", "7k/8/8/3p4/2P5/8/6K1/8 b - - 1 1"],
      ["h1h2", "7k/8/8/3p4/2P5/8/7K/8 b - - 1 1"],
    ] },
  { id: "pass-or-remove.black", partner: "pass-or-remove.white", root: "7k/8/8/2p5/3P4/8/8/7K b - - 0 1",
    plays: ["h8g8", "c5c4", "c5d4"], edges: [
      ["c5c4", "7k/8/8/8/2pP4/8/8/7K w - - 0 2"],
      ["c5d4", "7k/8/8/8/3p4/8/8/7K w - - 0 2"],
      ["h8g7", "8/6k1/8/2p5/3P4/8/8/7K w - - 1 2"],
      ["h8g8", "6k1/8/8/2p5/3P4/8/8/7K w - - 1 2"],
      ["h8h7", "8/7k/8/2p5/3P4/8/8/7K w - - 1 2"],
    ] },
];
export const PAWN_LINEAGE_POPULATIONS = [...COUNT_LITERAL_POPULATIONS, ...subjectBoundaries];

const file = (square: string) => square.charCodeAt(0) - 97;
const rank = (square: string) => Number(square[1]);
const direction = (color: Color) => color === "white" ? 1 : -1;

/** Decode only the piece placement, in original square order a1 through h8. */
function board(fen: string): ReadonlyMap<string, string> {
  const cells = new Map<string, string>();
  const ranks = fen.split(" ")[0]!.split("/").reverse();
  for (const [rankIndex, text] of ranks.entries()) {
    let column = 0;
    for (const symbol of text) {
      if (/^[1-8]$/u.test(symbol)) column += Number(symbol);
      else {
        cells.set(`${String.fromCharCode(97 + column)}${rankIndex + 1}`, symbol);
        column++;
      }
    }
    if (column !== 8) throw Error("Literal board has an incomplete rank");
  }
  if (ranks.length !== 8) throw Error("Literal board needs eight ranks");
  return cells;
}

function pawns(cells: ReadonlyMap<string, string>): readonly Pawn[] {
  return [...cells].flatMap(([square, symbol]): Pawn[] => {
    if (symbol === "P") return [{ color: "white", square }];
    if (symbol === "p") return [{ color: "black", square }];
    return [];
  });
}

function matches(family: PawnLineageFamily, subject: Pawn, population: readonly Pawn[]): boolean {
  const signedRanks = (other: Pawn) => (rank(other.square) - rank(subject.square)) * direction(subject.color);
  const fileDistance = (other: Pawn) => Math.abs(file(other.square) - file(subject.square));
  if (family === "passed_pawn") {
    return !population.some(other => other.color !== subject.color && fileDistance(other) <= 1 && signedRanks(other) > 0);
  }
  const neighbours = population.filter(other => fileDistance(other) === 1);
  return neighbours.some(other => other.color !== subject.color && signedRanks(other) === 2)
    && !neighbours.some(other => other.color === subject.color && signedRanks(other) <= 0);
}

type LiteralChild = { readonly edge: SemanticEdgeInput; readonly cells: ReadonlyMap<string, string>; readonly pawns: readonly Pawn[] };
function childState(family: PawnLineageFamily, subject: Pawn, root: ReadonlyMap<string, string>, child: LiteralChild): State {
  const { moveUci } = child.edge;
  const from = moveUci.slice(0, 2), to = moveUci.slice(2, 4), mover = root.get(from);
  const enPassant = mover?.toLowerCase() === "p" && from[0] !== to[0] && !root.has(to);
  const removed = enPassant ? `${to[0]}${from[1]}` : to;
  if (subject.square === from && moveUci.length === 5) {
    const role = promotions[moveUci[4] as keyof typeof promotions];
    if (role === undefined || child.cells.get(to)?.toLowerCase() !== moveUci[4]) throw Error("Literal promotion does not match its child");
    return { kind: "promoted", current: { color: subject.color, role, square: to } };
  }
  if (subject.square === removed) return { kind: "removed", at: removed };
  const square = subject.square === from ? to : subject.square;
  const current = child.pawns.find(pawn => pawn.square === square && pawn.color === subject.color);
  if (current === undefined) throw Error("Literal child lost an original pawn");
  return { kind: "present", value: matches(family, current, child.pawns) };
}

function relation(before: boolean, after: State) {
  return after.kind === "present" ? `${before}_to_${after.value}` as const : "not_comparable";
}

export function pawnLineageInput(family: PawnLineageFamily, row: LiteralPopulation, move: string): SemanticSubjectOutcomesInput {
  return { ...countPopulationInput(row, move), family };
}

export function literalPawnLineagePopulation(family: PawnLineageFamily, row: LiteralPopulation, move: string) {
  const { population: input } = pawnLineageInput(family, row, move);
  const root = board(row.root), rootPawns = pawns(root);
  const children = input.alternatives.map((edge): LiteralChild => {
    const cells = board(edge.afterFen);
    return { edge, cells, pawns: pawns(cells) };
  });
  const played = children.find(child => child.edge.moveUci === move)!;
  const actor: Color = row.root.split(" ")[1] === "w" ? "white" : "black";
  return { family, beforeFen: row.root, moveUci: move, afterFen: played.edge.afterFen, actor,
    subjects: rootPawns.map(pawn => {
      const before = matches(family, pawn, rootPawns), current = childState(family, pawn, root, played);
      return { subject: { kind: family, color: pawn.color, rootSquare: pawn.square }, parameters: {},
        root: { kind: "present", value: before }, played: current, playedRelation: relation(before, current),
        alternatives: children.filter(child => child !== played).map(child => {
          const state = childState(family, pawn, root, child);
          return { moveUci: child.edge.moveUci, state, relation: relation(before, state) };
        }) };
    }) };
}

export function literalPawnLineageEvents(family: PawnLineageFamily, row: LiteralPopulation, move: string) {
  const { subjects, ...context } = literalPawnLineagePopulation(family, row, move);
  const events: { sign: "avoided"; operands: Record<string, SemanticCanonicalValue> }[] = [];
  for (const { playedRelation, ...subject } of subjects) {
    if (playedRelation === "not_comparable") continue;
    for (const alternativeRelation of relations) {
      if (alternativeRelation === playedRelation) continue;
      const supportingMoves = subject.alternatives.filter(edge => edge.relation === alternativeRelation).map(edge => edge.moveUci);
      if (supportingMoves.length === 0) continue;
      events.push({ sign: "avoided", operands: { ...context, ...subject, alternativeRelation,
        supportingMoves, legalAlternatives: subject.alternatives.length, alternativesWithOutcome: supportingMoves.length } });
    }
  }
  return events;
}

const mirrorUci = (move: string) => move.replace(/[1-8]/gu, digit => String(9 - Number(digit)));
const rule = (path: readonly string[], value: SemanticMirrorValueRule, partnerPath = path,
  collection: "scalar" | "ordered" = "scalar"): SemanticMirrorOperandRule => ({ sourcePath: path, partnerPath, value, collection });

function mirrorRules(family: PawnLineageFamily, row: LiteralPopulation, move: string): readonly SemanticMirrorOperandRule[] {
  const partner = PAWN_LINEAGE_POPULATIONS.find(candidate => candidate.id === row.partner)!;
  const left = pawnLineageInput(family, row, move).population.alternatives.filter(edge => edge.moveUci !== move);
  const right = pawnLineageInput(family, partner, mirrorUci(move)).population.alternatives.filter(edge => edge.moveUci !== mirrorUci(move));
  const rules: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    rule(["family"], "identity"), rule(["actor"], "color"), rule(["subject", "kind"], "identity"),
    rule(["subject", "color"], "color"), rule(["subject", "rootSquare"], "square"),
    rule(["root", "kind"], "identity"), rule(["root", "value"], "identity"),
    rule(["played", "kind"], "identity"), rule(["played", "value"], "identity"),
    rule(["alternativeRelation"], "identity"), rule(["legalAlternatives"], "identity"), rule(["alternativesWithOutcome"], "identity"),
    { sourcePath: ["supportingMoves", "*"], partnerPath: ["supportingMoves", "*"], value: "uci", collection: "canonical_set" },
  ];
  for (const [index, edge] of left.entries()) {
    const other = right.findIndex(candidate => candidate.moveUci === mirrorUci(edge.moveUci));
    if (other < 0) throw Error("Literal mirror is missing a legal alternative");
    const source = ["alternatives", String(index)], target = ["alternatives", String(other)];
    rules.push(rule([...source, "moveUci"], "uci", [...target, "moveUci"]),
      rule([...source, "relation"], "identity", [...target, "relation"]),
      rule([...source, "state", "kind"], "identity", [...target, "state", "kind"]));
    // Each optional leaf remains attached to one concrete UCI on both sides, even when
    // another subject at that UCI has a different state variant.
    for (const [path, transform] of [
      [["value"], "identity"], [["at"], "square"], [["current", "color"], "color"],
      [["current", "role"], "identity"], [["current", "square"], "square"],
    ] as const) rules.push(rule([...source, "state", ...path], transform, [...target, "state", ...path], "ordered"));
  }
  return rules;
}

type SourceCase = { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticSubjectOutcomesInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> };
const caseId = (family: PawnLineageFamily, row: string, play: number, arm: string) => `cited.literal-board.pawn-lineage.${family}.${row}.${play}.${arm}`;
export const PAWN_LINEAGE_LITERAL_SOURCES = PAWN_LINEAGE_FAMILIES.map(family => {
  const subject = { kind: "event", projection: { id: `derived.semantic_avoidance.${family}`, version: 2 } } as const;
  const cases: SourceCase[] = PAWN_LINEAGE_POPULATIONS.flatMap(row => row.plays.flatMap((move, index) => {
    const input = pawnLineageInput(family, row, move), events = literalPawnLineageEvents(family, row, move);
    const make = (arm: SemanticValidationCase["arm"], label: string, expectation: SemanticValidationExpectation): SourceCase => ({
      arm, input, proposition: { subject, case: { id: caseId(family, row.id, index, label), version: 1 }, factConstraint: [], expectation },
    });
    if (events.length === 0) {
      // Focused tests compare every quiet and promotion cut. Keep the canonical omission
      // cases on distinct boundaries: same-file blockade, en passant and promotion.
      const omissionWitness = row.id.startsWith("quiet.")
        || row.id.startsWith("ep.") && index === 1
        || row.id.startsWith("promotion.") && move.endsWith("q");
      return omissionWitness ? [make("semantic_negative", "uniform", { kind: "omits" })] : [];
    }
    return [make("positive", "absolute", { kind: "emits_exact", events }),
      make("counterfactual", "counterfactual", { kind: "emits", minimum: 1, sign: "avoided", operandMatch: events[0]!.operands }),
      make("orientation", "color_and_vertical", { kind: "mirrors", geometry: "color_and_vertical",
        partnerCase: { kind: "case", id: caseId(family, row.partner, index, "color_and_vertical"), version: 1, subject, arm: "orientation" },
        targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(family, row, move) })];
  }));
  const basis = BACKWARD_LITERAL_SOURCE;
  return { sourceId: `python-chess.literal-board.pawn-lineage.${family}`, sourceRevision: basis.sourceRevision,
    licence: basis.licence, url: basis.url, text: basis.text, operation: { id: "runtime.semantic.subject_outcomes", version: 1 } as const, cases };
});
