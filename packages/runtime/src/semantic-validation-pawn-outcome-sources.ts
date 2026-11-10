/** Build/test-only independent pawn/file outcome references, source-safe §§4/7.
 * Literal complete legal populations and neutral FEN-placement arithmetic only. No production
 * classifier, state reader, source factory, selector or recorded output supplies expectations.
 * Board/capture/EP/promotion grounds and the disclosed pawn-file conventions are retained by
 * PAWN_FILE_LITERAL_SOURCES (python-chess GPL-3.0-or-later, source/licence URLs there).
 */
import { COUNT_LITERAL_POPULATIONS, countPopulationInput } from "./semantic-validation-count-population-sources.js";
import { PAWN_FILE_LITERAL_SOURCES } from "./semantic-validation-pawn-file-sources.js";
import type { SemanticCanonicalValue, SemanticMirrorGeometry, SemanticMirrorOperandRule, SemanticSubjectOutcomesInput,
  SemanticValidationCase, SemanticValidationExpectation, SemanticValidationPropositionRecord } from "./semantic-validation.js";

type LiteralPopulation = (typeof COUNT_LITERAL_POPULATIONS)[number] & { readonly horizontal?: string };
type Color = "white" | "black";
export const PAWN_OUTCOME_FAMILIES = ["doubled_pawn", "isolated_pawn", "open_file", "half_open_file", "pawn_islands"] as const;
export type PawnOutcomeFamily = (typeof PAWN_OUTCOME_FAMILIES)[number];
const colors: readonly Color[] = ["white", "black"];
const files = [..."abcdefgh"];
type Subject = Readonly<Record<string, SemanticCanonicalValue>>;
const added: readonly LiteralPopulation[] = [
  { id: "double.white", partner: "double.black", root: "7k/8/8/3p4/2P5/8/2P5/7K w - - 0 1", plays: ["h1g1", "c4d5"], edges: [
    ["c2c3", "7k/8/8/3p4/2P5/2P5/8/7K b - - 0 1"], ["c4c5", "7k/8/8/2Pp4/8/8/2P5/7K b - - 0 1"],
    ["c4d5", "7k/8/8/3P4/8/8/2P5/7K b - - 0 1"], ["h1g1", "7k/8/8/3p4/2P5/8/2P5/6K1 b - - 1 1"],
    ["h1g2", "7k/8/8/3p4/2P5/8/2P3K1/8 b - - 1 1"], ["h1h2", "7k/8/8/3p4/2P5/8/2P4K/8 b - - 1 1"],
  ] },
  { id: "double.black", partner: "double.white", root: "7k/2p5/8/2p5/3P4/8/8/7K b - - 0 1", plays: ["h8g8", "c5d4"], edges: [
    ["c7c6", "7k/8/2p5/2p5/3P4/8/8/7K w - - 0 2"], ["c5c4", "7k/2p5/8/8/2pP4/8/8/7K w - - 0 2"],
    ["c5d4", "7k/2p5/8/8/3p4/8/8/7K w - - 0 2"], ["h8g8", "6k1/2p5/8/2p5/3P4/8/8/7K w - - 1 2"],
    ["h8g7", "8/2p3k1/8/2p5/3P4/8/8/7K w - - 1 2"], ["h8h7", "8/2p4k/8/2p5/3P4/8/8/7K w - - 1 2"],
  ] },
  { id: "split.white", partner: "split.black", horizontal: "split-east.white", root: "7k/8/8/3n4/2P5/8/1P6/7K w - - 0 1", plays: ["h1g1", "c4d5"], edges: [
    ["b2b3", "7k/8/8/3n4/2P5/1P6/8/7K b - - 0 1"], ["b2b4", "7k/8/8/3n4/1PP5/8/8/7K b - - 0 1"],
    ["c4c5", "7k/8/8/2Pn4/8/8/1P6/7K b - - 0 1"], ["c4d5", "7k/8/8/3P4/8/8/1P6/7K b - - 0 1"],
    ["h1g1", "7k/8/8/3n4/2P5/8/1P6/6K1 b - - 1 1"], ["h1g2", "7k/8/8/3n4/2P5/8/1P4K1/8 b - - 1 1"],
    ["h1h2", "7k/8/8/3n4/2P5/8/1P5K/8 b - - 1 1"],
  ] },
  { id: "split.black", partner: "split.white", horizontal: "split-east.black", root: "7k/1p6/8/2p5/3N4/8/8/7K b - - 0 1", plays: ["h8g8", "c5d4"], edges: [
    ["b7b6", "7k/8/1p6/2p5/3N4/8/8/7K w - - 0 2"], ["b7b5", "7k/8/8/1pp5/3N4/8/8/7K w - - 0 2"],
    ["c5c4", "7k/1p6/8/8/2pN4/8/8/7K w - - 0 2"], ["c5d4", "7k/1p6/8/8/3p4/8/8/7K w - - 0 2"],
    ["h8g8", "6k1/1p6/8/2p5/3N4/8/8/7K w - - 1 2"], ["h8g7", "8/1p4k1/8/2p5/3N4/8/8/7K w - - 1 2"],
    ["h8h7", "8/1p5k/8/2p5/3N4/8/8/7K w - - 1 2"],
  ] },
  { id: "merge.white", partner: "merge.black", root: "7k/8/8/2n5/3P4/8/1P6/7K w - - 0 1", plays: ["h1g1", "d4c5"], edges: [
    ["b2b3", "7k/8/8/2n5/3P4/1P6/8/7K b - - 0 1"], ["b2b4", "7k/8/8/2n5/1P1P4/8/8/7K b - - 0 1"],
    ["d4d5", "7k/8/8/2nP4/8/8/1P6/7K b - - 0 1"], ["d4c5", "7k/8/8/2P5/8/8/1P6/7K b - - 0 1"],
    ["h1g1", "7k/8/8/2n5/3P4/8/1P6/6K1 b - - 1 1"], ["h1g2", "7k/8/8/2n5/3P4/8/1P4K1/8 b - - 1 1"],
    ["h1h2", "7k/8/8/2n5/3P4/8/1P5K/8 b - - 1 1"],
  ] },
  { id: "merge.black", partner: "merge.white", root: "7k/1p6/8/3p4/2N5/8/8/7K b - - 0 1", plays: ["h8g8", "d5c4"], edges: [
    ["b7b6", "7k/8/1p6/3p4/2N5/8/8/7K w - - 0 2"], ["b7b5", "7k/8/8/1p1p4/2N5/8/8/7K w - - 0 2"],
    ["d5d4", "7k/1p6/8/8/2Np4/8/8/7K w - - 0 2"], ["d5c4", "7k/1p6/8/8/2p5/8/8/7K w - - 0 2"],
    ["h8g8", "6k1/1p6/8/3p4/2N5/8/8/7K w - - 1 2"], ["h8g7", "8/1p4k1/8/3p4/2N5/8/8/7K w - - 1 2"],
    ["h8h7", "8/1p5k/8/3p4/2N5/8/8/7K w - - 1 2"],
  ] },
  { id: "split-east.white", partner: "split-east.black", horizontal: "split.white", root: "k7/8/8/4n3/5P2/8/6P1/K7 w - - 0 1", plays: ["a1b1", "f4e5"], edges: [
    ["g2g3", "k7/8/8/4n3/5P2/6P1/8/K7 b - - 0 1"], ["g2g4", "k7/8/8/4n3/5PP1/8/8/K7 b - - 0 1"],
    ["f4f5", "k7/8/8/4nP2/8/8/6P1/K7 b - - 0 1"], ["f4e5", "k7/8/8/4P3/8/8/6P1/K7 b - - 0 1"],
    ["a1b1", "k7/8/8/4n3/5P2/8/6P1/1K6 b - - 1 1"], ["a1b2", "k7/8/8/4n3/5P2/8/1K4P1/8 b - - 1 1"],
    ["a1a2", "k7/8/8/4n3/5P2/8/K5P1/8 b - - 1 1"],
  ] },
  { id: "split-east.black", partner: "split-east.white", horizontal: "split.black", root: "k7/6p1/8/5p2/4N3/8/8/K7 b - - 0 1", plays: ["a8b8", "f5e4"], edges: [
    ["g7g6", "k7/8/6p1/5p2/4N3/8/8/K7 w - - 0 2"], ["g7g5", "k7/8/8/5pp1/4N3/8/8/K7 w - - 0 2"],
    ["f5f4", "k7/6p1/8/8/4Np2/8/8/K7 w - - 0 2"], ["f5e4", "k7/6p1/8/8/4p3/8/8/K7 w - - 0 2"],
    ["a8b8", "1k6/6p1/8/5p2/4N3/8/8/K7 w - - 1 2"], ["a8b7", "8/1k4p1/8/5p2/4N3/8/8/K7 w - - 1 2"],
    ["a8a7", "8/k5p1/8/5p2/4N3/8/8/K7 w - - 1 2"],
  ] },
  { id: "transfer.white", partner: "transfer.black", root: "7k/8/8/3p4/2P5/8/2PP4/7K w - - 0 1", plays: ["h1g1", "c4d5"], edges: [
    ["c2c3", "7k/8/8/3p4/2P5/2P5/3P4/7K b - - 0 1"], ["c4c5", "7k/8/8/2Pp4/8/8/2PP4/7K b - - 0 1"],
    ["c4d5", "7k/8/8/3P4/8/8/2PP4/7K b - - 0 1"], ["d2d3", "7k/8/8/3p4/2P5/3P4/2P5/7K b - - 0 1"],
    ["d2d4", "7k/8/8/3p4/2PP4/8/2P5/7K b - - 0 1"], ["h1g1", "7k/8/8/3p4/2P5/8/2PP4/6K1 b - - 1 1"],
    ["h1g2", "7k/8/8/3p4/2P5/8/2PP2K1/8 b - - 1 1"], ["h1h2", "7k/8/8/3p4/2P5/8/2PP3K/8 b - - 1 1"],
  ] },
  { id: "transfer.black", partner: "transfer.white", root: "7k/2pp4/8/2p5/3P4/8/8/7K b - - 0 1", plays: ["h8g8", "c5d4"], edges: [
    ["c7c6", "7k/3p4/2p5/2p5/3P4/8/8/7K w - - 0 2"], ["c5c4", "7k/2pp4/8/8/2pP4/8/8/7K w - - 0 2"],
    ["c5d4", "7k/2pp4/8/8/3p4/8/8/7K w - - 0 2"], ["d7d6", "7k/2p5/3p4/2p5/3P4/8/8/7K w - - 0 2"],
    ["d7d5", "7k/2p5/8/2pp4/3P4/8/8/7K w - - 0 2"], ["h8g8", "6k1/2pp4/8/2p5/3P4/8/8/7K w - - 1 2"],
    ["h8g7", "8/2pp2k1/8/2p5/3P4/8/8/7K w - - 1 2"], ["h8h7", "8/2pp3k/8/2p5/3P4/8/8/7K w - - 1 2"],
  ] },
  { id: "nonpawn.white", partner: "nonpawn.black", root: "7k/8/8/8/3p4/1N6/8/7K w - - 0 1", plays: ["h1g1", "b3d4"], edges: [
    ["b3a1", "7k/8/8/8/3p4/8/8/N6K b - - 1 1"], ["b3a5", "7k/8/8/N7/3p4/8/8/7K b - - 1 1"],
    ["b3c1", "7k/8/8/8/3p4/8/8/2N4K b - - 1 1"], ["b3c5", "7k/8/8/2N5/3p4/8/8/7K b - - 1 1"],
    ["b3d2", "7k/8/8/8/3p4/8/3N4/7K b - - 1 1"], ["b3d4", "7k/8/8/8/3N4/8/8/7K b - - 0 1"],
    ["h1g1", "7k/8/8/8/3p4/1N6/8/6K1 b - - 1 1"], ["h1g2", "7k/8/8/8/3p4/1N6/6K1/8 b - - 1 1"],
    ["h1h2", "7k/8/8/8/3p4/1N6/7K/8 b - - 1 1"],
  ] },
  { id: "nonpawn.black", partner: "nonpawn.white", root: "7k/8/1n6/3P4/8/8/8/7K b - - 0 1", plays: ["h8g8", "b6d5"], edges: [
    ["b6a8", "n6k/8/8/3P4/8/8/8/7K w - - 1 2"], ["b6a4", "7k/8/8/3P4/n7/8/8/7K w - - 1 2"],
    ["b6c8", "2n4k/8/8/3P4/8/8/8/7K w - - 1 2"], ["b6c4", "7k/8/8/3P4/2n5/8/8/7K w - - 1 2"],
    ["b6d7", "7k/3n4/8/3P4/8/8/8/7K w - - 1 2"], ["b6d5", "7k/8/8/3n4/8/8/8/7K w - - 0 2"],
    ["h8g8", "6k1/8/1n6/3P4/8/8/8/7K w - - 1 2"], ["h8g7", "8/6k1/1n6/3P4/8/8/8/7K w - - 1 2"],
    ["h8h7", "8/7k/1n6/3P4/8/8/8/7K w - - 1 2"],
  ] },
];
// Explicit extra back-rank pawns vary the opponent's domain; all move identities/child
// placements are retained from the literal non-pawn/split examples and rechecked as legal.
function backRankVariant(row: LiteralPopulation, prefix: string, rank: number, placement: string): LiteralPopulation {
  const place = (fen: string) => { const ranks = fen.split("/"); if (ranks[rank] !== "8") throw Error("Literal back rank was not empty"); ranks[rank] = placement; return ranks.join("/"); };
  return { id: `${prefix}.${row.id.split(".").at(-1)}`, partner: `${prefix}.${row.partner.split(".").at(-1)}`, plays: row.plays,
    root: place(row.root), edges: row.edges.map(([move, fen]) => [move, place(fen)] as const) };
}
const extra = [
  backRankVariant(added.find(row => row.id === "nonpawn.white")!, "nonpawn-double", 1, "3p4"),
  backRankVariant(added.find(row => row.id === "nonpawn.black")!, "nonpawn-double", 6, "3P4"),
  // Replace the central knight with an actual pawn as well: capture splits BOTH colors.
  ...["white", "black"].map(side => {
    const row = added.find(value => value.id === `split.${side}`)!;
    const pawn = (fen: string) => fen.replace("n", "p").replace("N", "P");
    const base = { ...row, root: pawn(row.root), edges: row.edges.map(([move, fen]) => [move, pawn(fen)] as const) };
    return backRankVariant(base, "two-colors", side === "white" ? 1 : 6, side === "white" ? "2p1p3" : "2P1P3");
  }),
];
// The old literal boards are reusable facts. For file predicates every promotion removes the
// same pawn; all four legal promotion children remain present, with quiet/knight played cuts.
export const PAWN_OUTCOME_POPULATIONS: readonly LiteralPopulation[] = [...COUNT_LITERAL_POPULATIONS.map(row => row.id.startsWith("promotion")
  ? { ...row, plays: [row.plays[0]!, row.plays[2]!] } : row), ...added, ...extra];
export function pawnOutcomeInput(family: PawnOutcomeFamily, row: LiteralPopulation, move: string): SemanticSubjectOutcomesInput {
  // Only the reviewed literal edge/digest assembly is shared. No count expectation or producer.
  return { ...countPopulationInput(row, move), family };
}

function pawnCounts(fen: string): Readonly<Record<Color, readonly number[]>> {
  const result: Record<Color, number[]> = { white: Array(8).fill(0), black: Array(8).fill(0) };
  const ranks = fen.split(" ")[0]!.split("/");
  if (ranks.length !== 8) throw Error("Literal board must have eight ranks");
  for (const rank of ranks) {
    let file = 0;
    for (const token of rank) {
      if (/^[1-8]$/u.test(token)) file += Number(token);
      else { if (token === "P") result.white[file]!++; if (token === "p") result.black[file]!++; file++; }
    }
    if (file !== 8) throw Error("Literal board rank must have eight files");
  }
  return result;
}
function subjects(family: PawnOutcomeFamily): readonly Subject[] {
  if (family === "open_file") return files.map(file => ({ kind: family, file }));
  if (family === "pawn_islands") return colors.map(color => ({ kind: family, color }));
  return colors.flatMap(color => files.map(file => ({ kind: family, color, file })));
}
function value(family: PawnOutcomeFamily, counts: ReturnType<typeof pawnCounts>, subject: Subject): boolean | number {
  const index = files.indexOf(String(subject.file));
  if (family === "open_file") return counts.white[index] === 0 && counts.black[index] === 0;
  const color = subject.color as Color, own = counts[color];
  if (family === "pawn_islands") return own.reduce((n, count, at) => n + (count > 0 && (at === 0 || own[at - 1] === 0) ? 1 : 0), 0);
  if (family === "half_open_file") return own[index] === 0 && counts[color === "white" ? "black" : "white"][index]! > 0;
  if (family === "doubled_pawn") return own[index]! >= 2;
  return own[index]! > 0 && (index === 0 || own[index - 1] === 0) && (index === 7 || own[index + 1] === 0);
}
function relation(before: boolean | number, after: boolean | number): string {
  if (typeof before === "number" && typeof after === "number") return after < before ? "decrease" : after > before ? "increase" : "equal";
  if (typeof before !== "boolean" || typeof after !== "boolean") throw Error("Literal family crossed its value type");
  return before ? after ? "true_to_true" : "true_to_false" : after ? "false_to_true" : "false_to_false";
}
export function literalPawnOutcomePopulation(family: PawnOutcomeFamily, row: LiteralPopulation, move: string) {
  const input = pawnOutcomeInput(family, row, move), pop = input.population;
  const root = pawnCounts(row.root), played = pawnCounts(pop.played.afterFen);
  return { family, beforeFen: row.root, moveUci: move, afterFen: pop.played.afterFen,
    actor: row.root.split(" ")[1] === "w" ? "white" : "black",
    subjects: subjects(family).map(subject => {
      const before = value(family, root, subject), current = value(family, played, subject);
      return { subject, parameters: {}, root: { kind: "present", value: before }, played: { kind: "present", value: current },
        playedRelation: relation(before, current), alternatives: pop.alternatives.filter(edge => edge.moveUci !== move).map(edge => {
          const actual = value(family, pawnCounts(edge.afterFen), subject);
          return { moveUci: edge.moveUci, state: { kind: "present", value: actual }, relation: relation(before, actual) };
        }) };
    }) };
}
export function literalPawnOutcomeEvents(family: PawnOutcomeFamily, row: LiteralPopulation, move: string) {
  const population = literalPawnOutcomePopulation(family, row, move);
  const relations = family === "pawn_islands" ? ["increase", "decrease", "equal"] : ["false_to_true", "true_to_false", "true_to_true", "false_to_false"];
  const result: { sign: "avoided"; operands: Record<string, SemanticCanonicalValue> }[] = [];
  for (const member of population.subjects) for (const alternativeRelation of relations) {
    if (alternativeRelation === member.playedRelation) continue;
    const supportingMoves = member.alternatives.filter(edge => edge.relation === alternativeRelation).map(edge => edge.moveUci);
    if (supportingMoves.length === 0) continue;
    result.push({ sign: "avoided", operands: { family, beforeFen: population.beforeFen, moveUci: move, afterFen: population.afterFen,
      actor: population.actor, subject: member.subject, parameters: {}, root: member.root, played: member.played,
      alternativeRelation, alternatives: member.alternatives, supportingMoves, legalAlternatives: member.alternatives.length, alternativesWithOutcome: supportingMoves.length } });
  }
  return result;
}
function scalar(path: readonly string[], value: "identity" | "color" | "file" | "uci"): SemanticMirrorOperandRule { return { sourcePath: path, partnerPath: path, value, collection: "scalar" }; }
function mirrorRules(family: PawnOutcomeFamily, row: LiteralPopulation, move: string, geometry: SemanticMirrorGeometry, partnerId: string): readonly SemanticMirrorOperandRule[] {
  const partner = PAWN_OUTCOME_POPULATIONS.find(value => value.id === partnerId)!;
  const input = pawnOutcomeInput(family, row, move), other = pawnOutcomeInput(family, partner, partner.plays[row.plays.indexOf(move)]!);
  const left = input.population.alternatives.filter(edge => edge.moveUci !== move), right = other.population.alternatives.filter(edge => edge.moveUci !== other.population.played.moveUci);
  const rules: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    scalar(["family"], "identity"), scalar(["actor"], "color"), scalar(["subject", "kind"], "identity"),
    ...(family === "open_file" ? [] : [scalar(["subject", "color"], "color")]),
    ...(family === "pawn_islands" ? [] : [scalar(["subject", "file"], "file")]),
    scalar(["root", "kind"], "identity"), scalar(["root", "value"], "identity"), scalar(["played", "kind"], "identity"), scalar(["played", "value"], "identity"),
    scalar(["alternativeRelation"], "identity"), scalar(["legalAlternatives"], "identity"), scalar(["alternativesWithOutcome"], "identity"),
    { sourcePath: ["supportingMoves", "*"], partnerPath: ["supportingMoves", "*"], value: "uci", collection: "canonical_set" },
  ];
  const transform = (uci: string) => geometry === "horizontal" ? uci.replace(/[a-h]/gu, file => String.fromCharCode(201 - file.charCodeAt(0)))
    : uci.replace(/[1-8]/gu, rank => String(9 - Number(rank)));
  for (const [i, edge] of left.entries()) {
    const j = right.findIndex(candidate => candidate.moveUci === transform(edge.moveUci));
    if (j < 0) throw Error("Independent literal partner lost an alternative");
    for (const [path, value] of [[ ["moveUci"], "uci" ], [ ["state", "kind"], "identity" ],
      [ ["state", "value"], "identity" ], [ ["relation"], "identity" ]] as const) {
      rules.push({ sourcePath: ["alternatives", String(i), ...path], partnerPath: ["alternatives", String(j), ...path], value, collection: "scalar" });
    }
  }
  return rules;
}
type SourceCase = { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticSubjectOutcomesInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> };
const id = (family: PawnOutcomeFamily, row: string, play: number, arm: string) => `cited.literal-board.pawn-outcome.${family}.${row}.${play}.${arm}`;
export const PAWN_OUTCOME_LITERAL_SOURCES = PAWN_OUTCOME_FAMILIES.map(family => {
  const subject = { kind: "event", projection: { id: `derived.semantic_avoidance.${family}`, version: 2 } } as const;
  const cases: SourceCase[] = PAWN_OUTCOME_POPULATIONS.flatMap(row => row.plays.flatMap((move, index) => {
    const input = pawnOutcomeInput(family, row, move), events = literalPawnOutcomeEvents(family, row, move);
    const make = (arm: SemanticValidationCase["arm"], label: string, expectation: SemanticValidationExpectation): SourceCase => ({ arm, input,
      proposition: { subject, case: { id: id(family, row.id, index, label), version: 1 }, factConstraint: [], expectation } });
    if (events.length === 0) return [make("semantic_negative", "uniform", { kind: "omits" })];
    const mirror = (geometry: SemanticMirrorGeometry, partner: string) => make("orientation", geometry, { kind: "mirrors", geometry,
      partnerCase: { kind: "case", id: id(family, partner, index, geometry), version: 1, subject, arm: "orientation" },
      targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(family, row, move, geometry, partner) });
    return [make("positive", "absolute", { kind: "emits_exact", events }),
      make("counterfactual", "counterfactual", { kind: "emits", minimum: 1, sign: "avoided", operandMatch: events[0]!.operands }),
      mirror("color_and_vertical", row.partner), ...(row.horizontal ? [mirror("horizontal", row.horizontal)] : [])];
  }));
  const basis = PAWN_FILE_LITERAL_SOURCES[0]!;
  return { sourceId: `python-chess.literal-board.pawn-outcome.${family}`, sourceRevision: basis.sourceRevision,
    licence: basis.licence, url: basis.url, text: basis.text, operation: { id: "runtime.semantic.subject_outcomes", version: 1 } as const, cases };
});
