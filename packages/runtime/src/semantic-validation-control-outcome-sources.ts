/** Build/test-only D1716 geometric control reference, never a collector or move grade.
 * Position placement, piece offsets and first-blocker rays provide expected arithmetic.
 * Neither production attacks/control nor semantic collectors supply expected values.
 */
import {
  semanticLegalSetDigest, type SemanticCanonicalValue, type SemanticEdgeInput,
  type SemanticSubjectOutcomesInput, type SemanticMirrorOperandRule, type SemanticValidationCase,
  type SemanticValidationExpectation, type SemanticValidationPropositionRecord,
} from "./semantic-validation.js";
import { ATTACK_CITED_SOURCES } from "./semantic-validation-literal-sources.js";
import { COUNT_LITERAL_POPULATIONS } from "./semantic-validation-count-population-sources.js";
import { SLIDER_LITERAL_EXAMPLES } from "./semantic-validation-slider-sources.js";
import { referenceRulesPopulation, type ReferencePopulation } from "./semantic-validation-reference-inputs.js";

export interface ControlLiteralPopulation {
  readonly id: string;
  readonly root: string;
  readonly plays: readonly string[];
  readonly edges: readonly (readonly [string, string])[];
}
type Color = "white" | "black";
const colors: readonly Color[] = ["white", "black"];
const straight = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const diagonal = [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const knight = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]] as const;
const relations = ["increase", "decrease", "equal"] as const;
const relation = (before: number, after: number) => after < before ? "decrease" : after > before ? "increase" : "equal";

export function referenceControlCounts(fen: string): Readonly<Record<Color, readonly number[]>> {
  const ranks = fen.split(" ")[0]!.split("/");
  if (ranks.length !== 8) throw new Error("Literal board needs eight ranks");
  const occupied = new Map<number, string>();
  for (const [rank, text] of ranks.reverse().entries()) {
    let file = 0;
    for (const symbol of text) {
      if (/^[1-8]$/u.test(symbol)) file += Number(symbol);
      else if (/^[pnbrqkPNBRQK]$/u.test(symbol)) { occupied.set(rank * 8 + file, symbol); file++; }
      else throw new Error(`Unexpected literal piece ${symbol}`);
    }
    if (file !== 8) throw new Error("Literal rank needs eight squares");
  }
  const counts = { white: Array<number>(64).fill(0), black: Array<number>(64).fill(0) };
  for (const [square, symbol] of occupied) {
    const color: Color = symbol === symbol.toUpperCase() ? "white" : "black";
    const role = symbol.toLowerCase(), fromFile = square % 8, fromRank = Math.floor(square / 8);
    const steps: readonly (readonly [number, number])[] = role === "p"
      ? [[1, color === "white" ? 1 : -1], [-1, color === "white" ? 1 : -1]]
      : role === "n" ? knight : role === "b" ? diagonal : role === "r" ? straight : [...straight, ...diagonal];
    const sliding = role === "b" || role === "r" || role === "q";
    for (const [df, dr] of steps) {
      let file = fromFile + df, rank = fromRank + dr;
      while (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
        const target = rank * 8 + file;
        counts[color][target]!++;
        // Friendly occupants and kings count too. No legality/pin filter or pawn push.
        if (!sliding || occupied.has(target)) break;
        file += df; rank += dr;
      }
    }
  }
  return counts;
}

export function referenceControlInput(row: ControlLiteralPopulation, move: string): SemanticSubjectOutcomesInput {
  const alternatives = row.edges.map(([moveUci, afterFen]): SemanticEdgeInput => ({ kind: "edge", beforeFen: row.root, moveUci, afterFen }))
    .sort((a, b) => a.moveUci.localeCompare(b.moveUci));
  const played = alternatives.find(edge => edge.moveUci === move);
  if (played === undefined) throw new Error("Literal played move is missing");
  return { kind: "subject_outcomes", family: "direct_attack_count", population: {
    kind: "complete_alternatives", rootFen: row.root, played, alternatives,
    legalSetDigest: semanticLegalSetDigest(row.root, alternatives.map(edge => edge.moveUci)),
  } };
}

export function referenceControlPopulation(row: ControlLiteralPopulation, move: string) {
  const input = referenceControlInput(row, move), root = referenceControlCounts(row.root);
  const played = referenceControlCounts(input.population.played.afterFen);
  const alternatives = input.population.alternatives.filter(edge => edge.moveUci !== move)
    .map(edge => ({ moveUci: edge.moveUci, counts: referenceControlCounts(edge.afterFen) }));
  const actor = row.root.split(" ")[1] === "w" ? "white" : "black";
  return { family: "direct_attack_count", beforeFen: row.root, moveUci: move,
    afterFen: input.population.played.afterFen, actor,
    subjects: colors.flatMap(color => Array.from({ length: 64 }, (_, at) => ({
      subject: { kind: "direct_attack_count", color, square: `${String.fromCharCode(97 + at % 8)}${Math.floor(at / 8) + 1}` },
      parameters: {}, root: { kind: "present", value: root[color][at]! },
      played: { kind: "present", value: played[color][at]! }, playedRelation: relation(root[color][at]!, played[color][at]!),
      alternatives: alternatives.map(edge => ({ moveUci: edge.moveUci, state: { kind: "present", value: edge.counts[color][at]! },
        relation: relation(root[color][at]!, edge.counts[color][at]!) })),
    }))),
  };
}

export function referenceControlEvents(row: ControlLiteralPopulation, move: string) {
  const { subjects, ...context } = referenceControlPopulation(row, move);
  const result: { sign: "avoided"; operands: Record<string, SemanticCanonicalValue> }[] = [];
  for (const { playedRelation, ...subject } of subjects) for (const alternativeRelation of relations) {
    if (alternativeRelation === playedRelation) continue;
    const supportingMoves = subject.alternatives.filter(edge => edge.relation === alternativeRelation).map(edge => edge.moveUci);
    if (supportingMoves.length === 0) continue;
    result.push({ sign: "avoided", operands: { ...context, ...subject, alternativeRelation, supportingMoves,
      legalAlternatives: subject.alternatives.length, alternativesWithOutcome: supportingMoves.length } });
  }
  return result;
}

const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const input = referenceRulesPopulation;
export const CONTROL_OUTCOME_POPULATIONS: readonly ReferencePopulation[] = [
  ...COUNT_LITERAL_POPULATIONS,
  input("start.white", "start.black", `${start} w KQkq - 0 1`, ["e2e4"]),
  input("start.black", "start.white", `${start} b KQkq - 0 1`, ["e7e5"]),
  input("pin.white", "pin.black", "4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1", ["e1f1"]),
  input("pin.black", "pin.white", "4k3/4n3/8/8/8/8/8/4R2K b - - 0 1", ["e8f8"]),
  input("bishop-knight.white", "bishop-knight.black", "7k/8/8/3q4/8/5N2/6B1/7K w - - 0 1", ["f3h4", "h1g1"]),
  input("bishop-knight.black", "bishop-knight.white", "7k/6b1/5n2/8/3Q4/8/8/7K b - - 0 1", ["f6h5", "h8g8"]),
  input("only-capture.white", "only-capture.black", "7k/8/8/8/8/8/6q1/7K w - - 0 1", ["h1g2"]),
  input("only-capture.black", "only-capture.white", "7k/6Q1/8/8/8/8/8/7K b - - 0 1", ["h8g7"]),
  ...SLIDER_LITERAL_EXAMPLES.filter(row => /^(castle-|stationary-|crossing\.)/u.test(row.id))
    .map(row => input(row.id, row.partner, row.beforeFen, [row.moveUci])),
];

const mirrorMove = (move: string) => move.replace(/[1-8]/gu, digit => String(9 - Number(digit)));
const scalar = (sourcePath: readonly string[], value: "identity" | "square" | "color" | "uci", partnerPath = sourcePath):
  SemanticMirrorOperandRule => ({ sourcePath, partnerPath, value, collection: "scalar" });
function mirrorRules(row: ReferencePopulation, move: string): readonly SemanticMirrorOperandRule[] {
  const partner = CONTROL_OUTCOME_POPULATIONS.find(other => other.id === row.partner)!;
  const left = referenceControlInput(row, move).population.alternatives.filter(edge => edge.moveUci !== move);
  const right = referenceControlInput(partner, mirrorMove(move)).population.alternatives.filter(edge => edge.moveUci !== mirrorMove(move));
  const rules: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    scalar(["family"], "identity"), scalar(["actor"], "color"), scalar(["subject", "kind"], "identity"),
    scalar(["subject", "color"], "color"), scalar(["subject", "square"], "square"),
    scalar(["root", "kind"], "identity"), scalar(["root", "value"], "identity"),
    scalar(["played", "kind"], "identity"), scalar(["played", "value"], "identity"),
    scalar(["alternativeRelation"], "identity"), scalar(["legalAlternatives"], "identity"), scalar(["alternativesWithOutcome"], "identity"),
    { sourcePath: ["supportingMoves", "*"], partnerPath: ["supportingMoves", "*"], value: "uci", collection: "canonical_set" },
  ];
  for (const [at, edge] of left.entries()) {
    const other = right.findIndex(candidate => candidate.moveUci === mirrorMove(edge.moveUci));
    if (other < 0) throw Error("Control source lost a mirrored original legal member");
    for (const [path, value] of [[["moveUci"], "uci"], [["state", "kind"], "identity"],
      [["state", "value"], "identity"], [["relation"], "identity"]] as const) {
      rules.push(scalar(["alternatives", String(at), ...path], value, ["alternatives", String(other), ...path]));
    }
  }
  return rules;
}
type SourceCase = { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticSubjectOutcomesInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> };
const id = (row: string, arm: string) => `cited.literal-board.control-outcome.${row}.${arm}`;
const subject = { kind: "event", projection: { id: "derived.semantic_avoidance.direct_attack_count", version: 2 } } as const;
const basis = ATTACK_CITED_SOURCES.find(source => source.sourceId === "python-chess.attack-counts");
if (basis === undefined) throw Error("Pinned geometric-control source is missing");
/** The retained attackers_mask excerpt grounds geometric control only: pinned pieces and
 * friendly/king blockers count. New whole128-cell propositions do not reuse sparse old
 * structural-event IDs/meanings. Subject/relation/grouping are disclosed arithmetic.
 * Source copyright Niklas Fiekas, GPL-3.0-or-later; linked pinned manifest retains source/licence.
 */
export const CONTROL_OUTCOME_LITERAL_SOURCE = {
  sourceId: "python-chess.literal-board.control-outcome", sourceRevision: basis.sourceRevision,
  licence: basis.licence, url: basis.url, text: basis.text,
  operation: { id: "runtime.semantic.subject_outcomes", version: 1 } as const,
  cases: CONTROL_OUTCOME_POPULATIONS.flatMap(row => {
    const move = row.plays[0]!, input = referenceControlInput(row, move), events = referenceControlEvents(row, move);
    const make = (arm: SemanticValidationCase["arm"], expectation: SemanticValidationExpectation): SourceCase => ({
      arm, input, proposition: { subject, case: { id: id(row.id, arm), version: 1 }, factConstraint: [], expectation },
    });
    if (events.length === 0) return [make("semantic_negative", { kind: "omits" })];
    return [make("positive", { kind: "emits_exact", events }),
      make("counterfactual", { kind: "emits", minimum: 1, sign: "avoided", operandMatch: events[0]!.operands }),
      make("orientation", { kind: "mirrors", geometry: "color_and_vertical",
        partnerCase: { kind: "case", id: id(row.partner, "orientation"), version: 1, subject, arm: "orientation" },
        targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(row, move) })];
  }),
};
