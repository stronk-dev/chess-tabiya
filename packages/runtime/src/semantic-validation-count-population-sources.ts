/** Build/test-only independent literal legal populations, never collector output.
 * Board counts instantiate the retained python-chess piece/capture/promotion facts below.
 * Subject identity and integer relation arithmetic are the accepted source-safe §4 convention.
 * No claim of value, intention, praise or a recommended move is made.
 */
import { MATERIAL_V2_CITED_SOURCE } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_TRANSITION_SOURCES } from "./semantic-validation-transition-sources.js";
import { semanticLegalSetDigest, type SemanticCanonicalValue, type SemanticEdgeInput, type SemanticMirrorOperandRule,
  type SemanticSubjectOutcomesInput, type SemanticValidationCase, type SemanticValidationExpectation,
  type SemanticValidationPropositionRecord } from "./semantic-validation.js";

type Color = "white" | "black";
type Role = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
type CountKey = readonly [Color, Role];
interface LiteralPopulation {
  readonly id: string; readonly partner: string; readonly root: string;
  readonly edges: readonly (readonly [string, string])[]; readonly plays: readonly string[];
}
const colors: readonly Color[] = ["white", "black"];
const roles: readonly Role[] = ["pawn", "knight", "bishop", "rook", "queen", "king"];
export const COUNT_LITERAL_POPULATIONS: readonly LiteralPopulation[] = [
  { id: "pawn.white", partner: "pawn.black", root: "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1", plays: ["h1g1", "c4d5"], edges: [
    ["c4c5", "7k/8/8/2Pp4/8/8/3P4/7K b - - 0 1"], ["c4d5", "7k/8/8/3P4/8/8/3P4/7K b - - 0 1"],
    ["d2d3", "7k/8/8/3p4/2P5/3P4/8/7K b - - 0 1"], ["d2d4", "7k/8/8/3p4/2PP4/8/8/7K b - - 0 1"],
    ["h1g1", "7k/8/8/3p4/2P5/8/3P4/6K1 b - - 1 1"], ["h1g2", "7k/8/8/3p4/2P5/8/3P2K1/8 b - - 1 1"],
    ["h1h2", "7k/8/8/3p4/2P5/8/3P3K/8 b - - 1 1"],
  ] },
  { id: "pawn.black", partner: "pawn.white", root: "7k/3p4/8/2p5/3P4/8/8/7K b - - 0 1", plays: ["h8g8", "c5d4"], edges: [
    ["c5c4", "7k/3p4/8/8/2pP4/8/8/7K w - - 0 2"], ["c5d4", "7k/3p4/8/8/3p4/8/8/7K w - - 0 2"],
    ["d7d6", "7k/8/3p4/2p5/3P4/8/8/7K w - - 0 2"], ["d7d5", "7k/8/8/2pp4/3P4/8/8/7K w - - 0 2"],
    ["h8g8", "6k1/3p4/8/2p5/3P4/8/8/7K w - - 1 2"], ["h8g7", "8/3p2k1/8/2p5/3P4/8/8/7K w - - 1 2"],
    ["h8h7", "8/3p3k/8/2p5/3P4/8/8/7K w - - 1 2"],
  ] },
  { id: "ep.white", partner: "ep.black", root: "7k/8/8/3pP3/8/8/8/7K w - d6 0 1", plays: ["h1g1", "e5d6"], edges: [
    ["e5d6", "7k/8/3P4/8/8/8/8/7K b - - 0 1"], ["e5e6", "7k/8/4P3/3p4/8/8/8/7K b - - 0 1"],
    ["h1g1", "7k/8/8/3pP3/8/8/8/6K1 b - - 1 1"], ["h1g2", "7k/8/8/3pP3/8/8/6K1/8 b - - 1 1"],
    ["h1h2", "7k/8/8/3pP3/8/8/7K/8 b - - 1 1"],
  ] },
  { id: "ep.black", partner: "ep.white", root: "7k/8/8/8/3Pp3/8/8/7K b - d3 0 1", plays: ["h8g8", "e4d3"], edges: [
    ["e4d3", "7k/8/8/8/8/3p4/8/7K w - - 0 2"], ["e4e3", "7k/8/8/8/3P4/4p3/8/7K w - - 0 2"],
    ["h8g8", "6k1/8/8/8/3Pp3/8/8/7K w - - 1 2"], ["h8g7", "8/6k1/8/8/3Pp3/8/8/7K w - - 1 2"],
    ["h8h7", "8/7k/8/8/3Pp3/8/8/7K w - - 1 2"],
  ] },
  { id: "promotion.white", partner: "promotion.black", root: "8/P7/7k/8/8/8/8/7K w - - 0 1", plays: ["h1g1", "a7a8b", "a7a8n", "a7a8q", "a7a8r"], edges: [
    ["a7a8b", "B7/8/7k/8/8/8/8/7K b - - 0 1"], ["a7a8n", "N7/8/7k/8/8/8/8/7K b - - 0 1"],
    ["a7a8q", "Q7/8/7k/8/8/8/8/7K b - - 0 1"], ["a7a8r", "R7/8/7k/8/8/8/8/7K b - - 0 1"],
    ["h1g1", "8/P7/7k/8/8/8/8/6K1 b - - 1 1"], ["h1g2", "8/P7/7k/8/8/8/6K1/8 b - - 1 1"],
    ["h1h2", "8/P7/7k/8/8/8/7K/8 b - - 1 1"],
  ] },
  { id: "promotion.black", partner: "promotion.white", root: "7k/8/8/8/8/7K/p7/8 b - - 0 1", plays: ["h8g8", "a2a1b", "a2a1n", "a2a1q", "a2a1r"], edges: [
    ["a2a1b", "7k/8/8/8/8/7K/8/b7 w - - 0 2"], ["a2a1n", "7k/8/8/8/8/7K/8/n7 w - - 0 2"],
    ["a2a1q", "7k/8/8/8/8/7K/8/q7 w - - 0 2"], ["a2a1r", "7k/8/8/8/8/7K/8/r7 w - - 0 2"],
    ["h8g8", "6k1/8/8/8/8/7K/p7/8 w - - 1 2"], ["h8g7", "8/6k1/8/8/8/7K/p7/8 w - - 1 2"],
    ["h8h7", "8/7k/8/8/8/7K/p7/8 w - - 1 2"],
  ] },
  { id: "quiet.white", partner: "quiet.black", root: "7k/p7/8/8/8/8/P7/7K w - - 0 1", plays: ["h1g1"], edges: [
    ["a2a3", "7k/p7/8/8/8/P7/8/7K b - - 0 1"], ["a2a4", "7k/p7/8/8/P7/8/8/7K b - - 0 1"],
    ["h1g1", "7k/p7/8/8/8/8/P7/6K1 b - - 1 1"], ["h1g2", "7k/p7/8/8/8/8/P5K1/8 b - - 1 1"],
    ["h1h2", "7k/p7/8/8/8/8/P6K/8 b - - 1 1"],
  ] },
  { id: "quiet.black", partner: "quiet.white", root: "7k/p7/8/8/8/8/P7/7K b - - 0 1", plays: ["h8g8"], edges: [
    ["a7a6", "7k/8/p7/8/8/8/P7/7K w - - 0 2"], ["a7a5", "7k/8/8/p7/8/8/P7/7K w - - 0 2"],
    ["h8g8", "6k1/p7/8/8/8/8/P7/7K w - - 1 2"], ["h8g7", "8/p5k1/8/8/8/8/P7/7K w - - 1 2"],
    ["h8h7", "8/p6k/8/8/8/8/P7/7K w - - 1 2"],
  ] },
];

// Independent piece-placement decoding only. No production counter, relation helper,
// candidate compiler, semantic operation, source factory or output recorder is imported.
function literalCount(fen: string, [color, role]: CountKey): number {
  const symbol = ({ pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k" } as const)[role];
  const wanted = color === "white" ? symbol.toUpperCase() : symbol;
  return [...fen.split(" ")[0]!].filter(value => value === wanted).length;
}
const relation = (before: number, after: number) => after < before ? "decrease" : after > before ? "increase" : "equal";
export function countPopulationInput(row: LiteralPopulation, move: string): SemanticSubjectOutcomesInput {
  const alternatives = row.edges.map(([moveUci, afterFen]): SemanticEdgeInput => ({ kind: "edge", beforeFen: row.root, moveUci, afterFen }))
    .sort((a, b) => a.moveUci.localeCompare(b.moveUci));
  const played = alternatives.find(edge => edge.moveUci === move);
  if (played === undefined) throw Error("Literal played edge missing");
  return { kind: "subject_outcomes", family: "piece_count", population: { kind: "complete_alternatives", rootFen: row.root,
    played, alternatives, legalSetDigest: semanticLegalSetDigest(row.root, alternatives.map(edge => edge.moveUci)) } };
}
const subject = { kind: "event", projection: { id: "derived.semantic_avoidance.piece_count", version: 2 } } as const;
export function literalCountEvents(row: LiteralPopulation, move: string) {
  const input = countPopulationInput(row, move), played = input.population.played;
  const result: { sign: "avoided"; operands: Record<string, SemanticCanonicalValue> }[] = [];
  for (const color of colors) for (const role of roles) {
    const key: CountKey = [color, role], root = literalCount(row.root, key), current = literalCount(played.afterFen, key);
    const alternatives = input.population.alternatives.filter(edge => edge.moveUci !== move).map(edge => {
      const value = literalCount(edge.afterFen, key);
      return { moveUci: edge.moveUci, state: { kind: "present", value }, relation: relation(root, value) };
    });
    for (const other of ["increase", "decrease", "equal"] as const) {
      if (other === relation(root, current)) continue;
      const supportingMoves = alternatives.filter(edge => edge.relation === other).map(edge => edge.moveUci);
      if (supportingMoves.length === 0) continue;
      result.push({ sign: "avoided", operands: { beforeFen: row.root, moveUci: move, afterFen: played.afterFen,
        family: "piece_count", actor: row.root.split(" ")[1] === "w" ? "white" : "black",
        subject: { kind: "piece_count", color, role }, parameters: {}, root: { kind: "present", value: root },
        played: { kind: "present", value: current }, alternativeRelation: other, alternatives, supportingMoves,
        legalAlternatives: alternatives.length, alternativesWithOutcome: supportingMoves.length } });
    }
  }
  return result;
}
type SourceCase = { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticSubjectOutcomesInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> };
const caseId = (row: string, play: number, arm: string) => `cited.literal-board.count-population.${row}.${play}.${arm}`;
const scalar = (path: readonly string[], value: "identity" | "color" | "uci"): SemanticMirrorOperandRule => ({ sourcePath: path, partnerPath: path, value, collection: "scalar" });
function mirrorRules(row: LiteralPopulation, move: string): readonly SemanticMirrorOperandRule[] {
  const input = countPopulationInput(row, move), partner = COUNT_LITERAL_POPULATIONS.find(value => value.id === row.partner)!;
  const index = row.plays.indexOf(move), partnerInput = countPopulationInput(partner, partner.plays[index]!);
  const left = input.population.alternatives.filter(edge => edge.moveUci !== move);
  const right = partnerInput.population.alternatives.filter(edge => edge.moveUci !== partnerInput.population.played.moveUci);
  const rules: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    scalar(["actor"], "color"), scalar(["family"], "identity"), scalar(["subject", "kind"], "identity"),
    scalar(["subject", "color"], "color"), scalar(["subject", "role"], "identity"),
    scalar(["root", "kind"], "identity"), scalar(["root", "value"], "identity"),
    scalar(["played", "kind"], "identity"), scalar(["played", "value"], "identity"),
    scalar(["alternativeRelation"], "identity"), scalar(["legalAlternatives"], "identity"), scalar(["alternativesWithOutcome"], "identity"),
    { sourcePath: ["supportingMoves", "*"], partnerPath: ["supportingMoves", "*"], value: "uci", collection: "canonical_set" },
  ];
  // Explicit partner tuples bind every transformed move to ITS state and relation. Source
  // fixtures contain literal partner edges; no runtime mirror helper computes their boards.
  for (const [i, edge] of left.entries()) {
    const mapped = edge.moveUci.replace(/[1-8]/gu, rank => String(9 - Number(rank)));
    const j = right.findIndex(value => value.moveUci === mapped);
    if (j < 0) throw Error("Literal mirror edge missing");
    for (const [tail, value] of [[ ["moveUci"], "uci" ], [ ["state", "kind"], "identity" ],
      [ ["state", "value"], "identity" ], [ ["relation"], "identity" ]] as const) {
      rules.push({ sourcePath: ["alternatives", String(i), ...tail], partnerPath: ["alternatives", String(j), ...tail], value, collection: "scalar" });
    }
  }
  return rules;
}
const cases: SourceCase[] = COUNT_LITERAL_POPULATIONS.flatMap(row => row.plays.flatMap((move, index) => {
  const input = countPopulationInput(row, move), events = literalCountEvents(row, move);
  const make = (arm: SemanticValidationCase["arm"], label: string, expectation: SemanticValidationExpectation): SourceCase => ({
    arm, input, proposition: { subject, case: { id: caseId(row.id, index, label), version: 1 }, factConstraint: [], expectation },
  });
  if (events.length === 0) return [make("semantic_negative", "uniform", { kind: "omits" })];
  return [make("positive", "absolute", { kind: "emits_exact", events }),
    make("counterfactual", "counterfactual", { kind: "emits", minimum: 1, sign: "avoided", operandMatch: events[0]!.operands }),
    make("orientation", "mirror", { kind: "mirrors", geometry: "color_and_vertical",
      partnerCase: { kind: "case", id: caseId(row.partner, index, "mirror"), version: 1, subject, arm: "orientation" },
      targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(row, move) })];
}));
export const COUNT_POPULATION_LITERAL_SOURCE = Object.freeze({
  sourceId: "python-chess.literal-board.count-population", sourceRevision: MATERIAL_V2_CITED_SOURCE.sourceRevision,
  licence: MATERIAL_V2_CITED_SOURCE.licence, url: MATERIAL_V2_CITED_SOURCE.url,
  text: MATERIAL_V2_CITED_SOURCE.text + "\nIndependent capture/EP/promotion facts:\n" + SEMANTIC_VALIDATION_TRANSITION_SOURCES[0]!.text,
  operation: { id: "runtime.semantic.subject_outcomes", version: 1 } as const, cases,
});
