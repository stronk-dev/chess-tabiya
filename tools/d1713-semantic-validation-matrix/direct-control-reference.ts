/** Disposable D1716 source-proof preparation. Unregistered, not a collector or qualification.
 * Position placement, piece offsets and first-blocker rays provide expected arithmetic.
 * Neither production attacks/control nor semantic collectors supply expected values.
 */
import {
  semanticLegalSetDigest, type SemanticCanonicalValue, type SemanticEdgeInput,
  type SemanticSubjectOutcomesInput,
} from "../../packages/runtime/src/semantic-validation.js";

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
