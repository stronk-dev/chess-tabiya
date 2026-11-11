/** Build/test-only original king-subject references. Expected geometry comes from literal
 * placement and disclosed coordinate/turn conventions. No production reading, classifier,
 * lineage tracker, source event or mirror supplies an expected outcome. */
import { OPPOSITION_LITERAL_SOURCE } from "./semantic-validation-opposition-sources.js";
import { countPopulationInput, type COUNT_LITERAL_POPULATIONS } from "./semantic-validation-count-population-sources.js";
import type { SemanticCanonicalValue, SemanticMirrorOperandRule, SemanticSubjectOutcomesInput,
  SemanticValidationCase, SemanticValidationExpectation, SemanticValidationPropositionRecord } from "./semantic-validation.js";

export const KING_OUTCOME_FAMILIES = ["king_zone", "king_opposition"] as const;
export type KingOutcomeFamily = (typeof KING_OUTCOME_FAMILIES)[number];
type LiteralPopulation = (typeof COUNT_LITERAL_POPULATIONS)[number];
type Color = "white" | "black";
type ObjectValue = Readonly<Record<string, SemanticCanonicalValue>>;
const colors: readonly Color[] = ["white", "black"];
const forms = ["direct", "distant_three", "distant_five"] as const;
const relations = ["false_to_true", "true_to_false", "true_to_true", "false_to_false"] as const;
export const KING_OUTCOME_POPULATIONS: readonly LiteralPopulation[] = [
  { id: "corner.white", partner: "corner.black", root: "7k/8/8/8/8/8/8/7K w - - 0 1", plays: ["h1g1", "h1h2"], edges: [
    ["h1g1", "7k/8/8/8/8/8/8/6K1 b - - 1 1"],
    ["h1g2", "7k/8/8/8/8/8/6K1/8 b - - 1 1"],
    ["h1h2", "7k/8/8/8/8/8/7K/8 b - - 1 1"]
  ] },
  { id: "corner.black", partner: "corner.white", root: "7k/8/8/8/8/8/8/7K b - - 0 1", plays: ["h8g8", "h8h7"], edges: [
    ["h8g7", "8/6k1/8/8/8/8/8/7K w - - 1 2"],
    ["h8g8", "6k1/8/8/8/8/8/8/7K w - - 1 2"],
    ["h8h7", "8/7k/8/8/8/8/8/7K w - - 1 2"]
  ] },
  { id: "direct.white", partner: "direct.black", root: "8/8/8/8/8/4k3/8/3K4 w - - 0 1", plays: ["d1c1", "d1e1"], edges: [
    ["d1c1", "8/8/8/8/8/4k3/8/2K5 b - - 1 1"],
    ["d1c2", "8/8/8/8/8/4k3/2K5/8 b - - 1 1"],
    ["d1e1", "8/8/8/8/8/4k3/8/4K3 b - - 1 1"]
  ] },
  { id: "direct.black", partner: "direct.white", root: "3k4/8/4K3/8/8/8/8/8 b - - 0 1", plays: ["d8c8", "d8e8"], edges: [
    ["d8c7", "8/2k5/4K3/8/8/8/8/8 w - - 1 2"],
    ["d8c8", "2k5/8/4K3/8/8/8/8/8 w - - 1 2"],
    ["d8e8", "4k3/8/4K3/8/8/8/8/8 w - - 1 2"]
  ] },
  { id: "distant-three.white", partner: "distant-three.black", root: "8/8/4k3/8/8/8/8/4K3 w - - 0 1", plays: ["e1d1", "e1e2"], edges: [
    ["e1d1", "8/8/4k3/8/8/8/8/3K4 b - - 1 1"],
    ["e1d2", "8/8/4k3/8/8/8/3K4/8 b - - 1 1"],
    ["e1e2", "8/8/4k3/8/8/8/4K3/8 b - - 1 1"],
    ["e1f1", "8/8/4k3/8/8/8/8/5K2 b - - 1 1"],
    ["e1f2", "8/8/4k3/8/8/8/5K2/8 b - - 1 1"]
  ] },
  { id: "distant-three.black", partner: "distant-three.white", root: "4k3/8/8/8/8/4K3/8/8 b - - 0 1", plays: ["e8d8", "e8e7"], edges: [
    ["e8d7", "8/3k4/8/8/8/4K3/8/8 w - - 1 2"],
    ["e8d8", "3k4/8/8/8/8/4K3/8/8 w - - 1 2"],
    ["e8e7", "8/4k3/8/8/8/4K3/8/8 w - - 1 2"],
    ["e8f7", "8/5k2/8/8/8/4K3/8/8 w - - 1 2"],
    ["e8f8", "5k2/8/8/8/8/4K3/8/8 w - - 1 2"]
  ] },
  { id: "blocked.white", partner: "blocked.black", root: "8/8/8/8/8/4k3/4B3/4K3 w - - 0 1", plays: ["e1d1", "e2d3"], edges: [
    ["e1d1", "8/8/8/8/8/4k3/4B3/3K4 b - - 1 1"],
    ["e1f1", "8/8/8/8/8/4k3/4B3/5K2 b - - 1 1"],
    ["e2a6", "8/8/B7/8/8/4k3/8/4K3 b - - 1 1"],
    ["e2b5", "8/8/8/1B6/8/4k3/8/4K3 b - - 1 1"],
    ["e2c4", "8/8/8/8/2B5/4k3/8/4K3 b - - 1 1"],
    ["e2d1", "8/8/8/8/8/4k3/8/3BK3 b - - 1 1"],
    ["e2d3", "8/8/8/8/8/3Bk3/8/4K3 b - - 1 1"],
    ["e2f1", "8/8/8/8/8/4k3/8/4KB2 b - - 1 1"],
    ["e2f3", "8/8/8/8/8/4kB2/8/4K3 b - - 1 1"],
    ["e2g4", "8/8/8/8/6B1/4k3/8/4K3 b - - 1 1"],
    ["e2h5", "8/8/8/7B/8/4k3/8/4K3 b - - 1 1"]
  ] },
  { id: "blocked.black", partner: "blocked.white", root: "4k3/4b3/4K3/8/8/8/8/8 b - - 0 1", plays: ["e8d8", "e7d6"], edges: [
    ["e7a3", "4k3/8/4K3/8/8/b7/8/8 w - - 1 2"],
    ["e7b4", "4k3/8/4K3/8/1b6/8/8/8 w - - 1 2"],
    ["e7c5", "4k3/8/4K3/2b5/8/8/8/8 w - - 1 2"],
    ["e7d6", "4k3/8/3bK3/8/8/8/8/8 w - - 1 2"],
    ["e7d8", "3bk3/8/4K3/8/8/8/8/8 w - - 1 2"],
    ["e7f6", "4k3/8/4Kb2/8/8/8/8/8 w - - 1 2"],
    ["e7f8", "4kb2/8/4K3/8/8/8/8/8 w - - 1 2"],
    ["e7g5", "4k3/8/4K3/6b1/8/8/8/8 w - - 1 2"],
    ["e7h4", "4k3/8/4K3/8/7b/8/8/8 w - - 1 2"],
    ["e8d8", "3k4/4b3/4K3/8/8/8/8/8 w - - 1 2"],
    ["e8f8", "5k2/4b3/4K3/8/8/8/8/8 w - - 1 2"]
  ] },
  { id: "uniform-loss.white", partner: "uniform-loss.black", root: "8/8/8/8/8/4k3/8/4K3 w - - 0 1", plays: ["e1d1"], edges: [
    ["e1d1", "8/8/8/8/8/4k3/8/3K4 b - - 1 1"],
    ["e1f1", "8/8/8/8/8/4k3/8/5K2 b - - 1 1"]
  ] },
  { id: "uniform-loss.black", partner: "uniform-loss.white", root: "4k3/8/4K3/8/8/8/8/8 b - - 0 1", plays: ["e8d8"], edges: [
    ["e8d8", "3k4/8/4K3/8/8/8/8/8 w - - 1 2"],
    ["e8f8", "5k2/8/4K3/8/8/8/8/8 w - - 1 2"]
  ] },
  { id: "diagonal.white", partner: "diagonal.black", root: "8/8/8/8/8/5k2/8/3K4 w - - 0 1", plays: ["d1c1"], edges: [
    ["d1c1", "8/8/8/8/8/5k2/8/2K5 b - - 1 1"],
    ["d1c2", "8/8/8/8/8/5k2/2K5/8 b - - 1 1"],
    ["d1d2", "8/8/8/8/8/5k2/3K4/8 b - - 1 1"],
    ["d1e1", "8/8/8/8/8/5k2/8/4K3 b - - 1 1"]
  ] },
  { id: "diagonal.black", partner: "diagonal.white", root: "3k4/8/5K2/8/8/8/8/8 b - - 0 1", plays: ["d8c8"], edges: [
    ["d8c7", "8/2k5/5K2/8/8/8/8/8 w - - 1 2"],
    ["d8c8", "2k5/8/5K2/8/8/8/8/8 w - - 1 2"],
    ["d8d7", "8/3k4/5K2/8/8/8/8/8 w - - 1 2"],
    ["d8e8", "4k3/8/5K2/8/8/8/8/8 w - - 1 2"]
  ] },
  { id: "rank.white", partner: "rank.black", root: "8/8/8/8/K4k2/8/8/8 w - - 0 1", plays: ["a4a3", "a4b4"], edges: [
    ["a4a3", "8/8/8/8/5k2/K7/8/8 b - - 1 1"],
    ["a4a5", "8/8/8/K7/5k2/8/8/8 b - - 1 1"],
    ["a4b3", "8/8/8/8/5k2/1K6/8/8 b - - 1 1"],
    ["a4b4", "8/8/8/8/1K3k2/8/8/8 b - - 1 1"],
    ["a4b5", "8/8/8/1K6/5k2/8/8/8 b - - 1 1"]
  ] },
  { id: "rank.black", partner: "rank.white", root: "8/8/8/k4K2/8/8/8/8 b - - 0 1", plays: ["a5a6", "a5b5"], edges: [
    ["a5a4", "8/8/8/5K2/k7/8/8/8 w - - 1 2"],
    ["a5a6", "8/8/k7/5K2/8/8/8/8 w - - 1 2"],
    ["a5b4", "8/8/8/5K2/1k6/8/8/8 w - - 1 2"],
    ["a5b5", "8/8/8/1k3K2/8/8/8/8 w - - 1 2"],
    ["a5b6", "8/8/1k6/5K2/8/8/8/8 w - - 1 2"]
  ] }
];

const file = (square: string) => square.charCodeAt(0) - 97;
const rank = (square: string) => Number(square[1]);

function board(fen: string): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  const ranks = fen.split(" ")[0]!.split("/").reverse();
  if (ranks.length !== 8) throw Error("A literal king position needs eight ranks");
  for (const [rank, text] of ranks.entries()) {
    let column = 0;
    for (const symbol of text) {
      if (/^[1-8]$/u.test(symbol)) column += Number(symbol);
      else {
        result.set(`${String.fromCharCode(97 + column)}${rank + 1}`, symbol);
        column++;
      }
    }
    if (column !== 8) throw Error("Literal rank has invalid width");
  }
  return result;
}

function kings(position: ReadonlyMap<string, string>) {
  const white = [...position].find(([, symbol]) => symbol === "K")?.[0];
  const black = [...position].find(([, symbol]) => symbol === "k")?.[0];
  if (white === undefined || black === undefined) throw Error("Literal position needs both kings");
  return { white, black };
}

function opposition(position: ReadonlyMap<string, string>, turn: Color) {
  const { white, black } = kings(position);
  const alignedFile = file(white) === file(black), alignedRank = rank(white) === rank(black);
  if (!alignedFile && !alignedRank) return null;
  const between: string[] = [];
  const stepFile = Math.sign(file(black) - file(white)), stepRank = Math.sign(rank(black) - rank(white));
  let column = file(white) + stepFile, row = rank(white) + stepRank;
  while (column !== file(black) || row !== rank(black)) {
    between.push(`${String.fromCharCode(97 + column)}${row}`);
    column += stepFile; row += stepRank;
  }
  const form = ({ 1: "direct", 3: "distant_three", 5: "distant_five" } as const)[between.length as 1 | 3 | 5];
  if (form === undefined || between.some(square => position.has(square))) return null;
  return { holder: turn === "white" ? "black" : "white", form };
}

function cells(family: KingOutcomeFamily, root: ReadonlyMap<string, string>, fen: string) {
  const original = kings(root), position = board(fen), current = kings(position);
  const holder = opposition(position, fen.split(" ")[1] === "w" ? "white" : "black");
  if (family === "king_opposition") return colors.flatMap(color => forms.map(form => ({
    subject: { kind: family, whiteRootSquare: original.white, blackRootSquare: original.black } as ObjectValue,
    parameters: { holder: color, form } as ObjectValue,
    value: holder?.holder === color && holder.form === form,
  })));
  return colors.flatMap(color => (["edge", "corner"] as const).map(zone => {
    const square = current[color];
    const edgeFile = square[0] === "a" || square[0] === "h", edgeRank = square[1] === "1" || square[1] === "8";
    return { subject: { kind: family, color, rootSquare: original[color] } as ObjectValue, parameters: { zone } as ObjectValue,
      value: zone === "corner" ? edgeFile && edgeRank : edgeFile || edgeRank };
  }));
}

const relation = (before: boolean, after: boolean) => `${before}_to_${after}` as const;

export function kingOutcomeInput(family: KingOutcomeFamily, row: LiteralPopulation, move: string): SemanticSubjectOutcomesInput {
  return { ...countPopulationInput(row, move), family };
}

export function literalKingOutcomePopulation(family: KingOutcomeFamily, row: LiteralPopulation, move: string) {
  const input = kingOutcomeInput(family, row, move), root = board(row.root);
  const current = cells(family, root, input.population.played.afterFen);
  const alternatives = input.population.alternatives.filter(edge => edge.moveUci !== move)
    .map(edge => ({ moveUci: edge.moveUci, values: cells(family, root, edge.afterFen) }));
  const actor: Color = row.root.split(" ")[1] === "w" ? "white" : "black";
  return { family, beforeFen: row.root, moveUci: move, afterFen: input.population.played.afterFen, actor,
    subjects: cells(family, root, row.root).map(({ subject, parameters, value }, index) => ({
      subject, parameters, root: { kind: "present", value }, played: { kind: "present", value: current[index]!.value },
      playedRelation: relation(value, current[index]!.value),
      alternatives: alternatives.map(edge => ({ moveUci: edge.moveUci,
        state: { kind: "present", value: edge.values[index]!.value }, relation: relation(value, edge.values[index]!.value) })),
    })) };
}

export function literalKingOutcomeEvents(family: KingOutcomeFamily, row: LiteralPopulation, move: string) {
  const { subjects, ...context } = literalKingOutcomePopulation(family, row, move);
  const events: { sign: "avoided"; operands: Record<string, SemanticCanonicalValue> }[] = [];
  for (const { playedRelation, ...subject } of subjects) for (const alternativeRelation of relations) {
    if (alternativeRelation === playedRelation) continue;
    const supportingMoves = subject.alternatives.filter(edge => edge.relation === alternativeRelation).map(edge => edge.moveUci);
    if (supportingMoves.length === 0) continue;
    events.push({ sign: "avoided", operands: { ...context, ...subject, alternativeRelation,
      supportingMoves, legalAlternatives: subject.alternatives.length, alternativesWithOutcome: supportingMoves.length } });
  }
  return events;
}

const mirrorMove = (move: string) => move.replace(/[1-8]/gu, digit => String(9 - Number(digit)));
const scalar = (sourcePath: readonly string[], value: "identity" | "square" | "color" | "uci", partnerPath = sourcePath):
  SemanticMirrorOperandRule => ({ sourcePath, partnerPath, value, collection: "scalar" });

function mirrorRules(family: KingOutcomeFamily, row: LiteralPopulation, move: string): readonly SemanticMirrorOperandRule[] {
  const partner = KING_OUTCOME_POPULATIONS.find(candidate => candidate.id === row.partner)!;
  const left = kingOutcomeInput(family, row, move).population.alternatives.filter(edge => edge.moveUci !== move);
  const right = kingOutcomeInput(family, partner, mirrorMove(move)).population.alternatives.filter(edge => edge.moveUci !== mirrorMove(move));
  const rules: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    scalar(["family"], "identity"), scalar(["actor"], "color"), scalar(["subject", "kind"], "identity"),
    scalar(["root", "kind"], "identity"), scalar(["root", "value"], "identity"),
    scalar(["played", "kind"], "identity"), scalar(["played", "value"], "identity"),
    scalar(["alternativeRelation"], "identity"), scalar(["legalAlternatives"], "identity"), scalar(["alternativesWithOutcome"], "identity"),
    { sourcePath: ["supportingMoves", "*"], partnerPath: ["supportingMoves", "*"], value: "uci", collection: "canonical_set" },
  ];
  if (family === "king_opposition") rules.push(
    scalar(["subject", "whiteRootSquare"], "square", ["subject", "blackRootSquare"]),
    scalar(["subject", "blackRootSquare"], "square", ["subject", "whiteRootSquare"]),
    scalar(["parameters", "holder"], "color"), scalar(["parameters", "form"], "identity"));
  else rules.push(scalar(["subject", "color"], "color"), scalar(["subject", "rootSquare"], "square"), scalar(["parameters", "zone"], "identity"));
  for (const [index, edge] of left.entries()) {
    const other = right.findIndex(candidate => candidate.moveUci === mirrorMove(edge.moveUci));
    if (other < 0) throw Error("Literal king mirror lost an original legal move");
    const from = ["alternatives", String(index)], to = ["alternatives", String(other)];
    for (const [path, value] of [[["moveUci"], "uci"], [["state", "kind"], "identity"],
      [["state", "value"], "identity"], [["relation"], "identity"]] as const) {
      rules.push(scalar([...from, ...path], value, [...to, ...path]));
    }
  }
  return rules;
}

type SourceCase = { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticSubjectOutcomesInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> };
const caseId = (family: KingOutcomeFamily, row: string, arm: string) => `cited.literal-board.king-outcome.${family}.${row}.${arm}`;

export const KING_OUTCOME_LITERAL_SOURCES = KING_OUTCOME_FAMILIES.map(family => {
  const subject = { kind: "event", projection: { id: `derived.semantic_avoidance.${family}`, version: 2 } } as const;
  // Every play remains a full-population focused control. Canonical cases retain one
  // complete outcome per literal root and all four required validation arms.
  const cases: SourceCase[] = KING_OUTCOME_POPULATIONS.flatMap(row => {
    const move = row.plays[0]!, input = kingOutcomeInput(family, row, move), events = literalKingOutcomeEvents(family, row, move);
    const make = (arm: SemanticValidationCase["arm"], expectation: SemanticValidationExpectation): SourceCase => ({
      arm, input, proposition: { subject, case: { id: caseId(family, row.id, arm), version: 1 }, factConstraint: [], expectation },
    });
    if (events.length === 0) return [make("semantic_negative", { kind: "omits" })];
    return [make("positive", { kind: "emits_exact", events }),
      make("counterfactual", { kind: "emits", minimum: 1, sign: "avoided", operandMatch: events[0]!.operands }),
      make("orientation", { kind: "mirrors", geometry: "color_and_vertical",
        partnerCase: { kind: "case", id: caseId(family, row.partner, "orientation"), version: 1, subject, arm: "orientation" },
        targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(family, row, move) })];
  });
  const basis = OPPOSITION_LITERAL_SOURCE;
  return { sourceId: `python-chess.literal-board.king-outcome.${family}`, sourceRevision: basis.sourceRevision,
    licence: basis.licence, url: basis.url, text: basis.text, operation: { id: "runtime.semantic.subject_outcomes", version: 1 } as const, cases };
});
