import { canonicalizeJson, type StructuralExpression, type StructuralFeature } from "@chess-tabiya/schema/drill-pack";
import { matchesStructuralExpression } from "@chess-tabiya/runtime";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseSan } from "chessops/san";

import { structuralIssues } from "./pack-validation.js";

export interface Refutation { readonly rule: `R${number}`; readonly message: string }
export interface ExpressionWitness {
  readonly id: string;
  readonly from: string;
  readonly sans: readonly string[];
  readonly role: "anchored" | "evictable" | "undefended" | "reference" | "degenerate";
  readonly expect: boolean;
}
export interface WitnessResult extends ExpressionWitness { readonly fen?: string; readonly actual?: boolean; readonly error?: string; readonly code?: "WITNESS_LINE_ILLEGAL" }
export interface SatisfiabilityResult {
  readonly verdict: "unsatisfiable" | "satisfiable" | "unknown";
  readonly basis: string;
  readonly rule?: string;
  readonly sampleFen?: string;
  readonly witnesses?: readonly WitnessResult[];
}

export const DEGENERATE_POSITIONS = Object.freeze([
  { id: "bare_kings", fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1" },
  { id: "king_and_one_white_pawn", fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1" },
  { id: "king_and_one_black_pawn", fen: "4k3/4p3/8/8/8/8/8/4K3 w - - 0 1" },
  { id: "pawnless", fen: "4k3/8/8/8/8/8/3B4/3RK3 w - - 0 1" },
  { id: "bishops_same_shade", fen: "4k3/8/8/8/8/8/2B2B2/4K3 w - - 0 1" },
  { id: "rooks_only", fen: "4k2r/8/8/8/8/8/8/R3K3 w - - 0 1" },
  { id: "queens_only", fen: "3qk3/8/8/8/8/8/8/3QK3 w - - 0 1" },
] as const);

function range(feature: StructuralFeature): readonly [number, number] | undefined {
  if (feature.kind === "pawn_count") return feature.basis === "count" ? [0, 8] : [-8, 8];
  if (feature.kind === "piece_count") {
    const maximum = feature.role === "pawn" ? 8 : feature.role === "queen" ? 9 : feature.role === "king" ? 1 : 10;
    return feature.basis === "count" ? [0, maximum] : [-maximum, maximum];
  }
  if (feature.kind === "piece_distance") return [0, feature.role === "king" ? 7 : feature.role === "knight" ? 6 : 2];
  if (feature.kind === "line_blockers" || feature.kind === "direct_attack_count") return [0, Number.POSITIVE_INFINITY];
  return undefined;
}

function comparisonRefutes(feature: StructuralFeature, lo: number, hi: number): boolean {
  if (!("comparison" in feature) || !("count" in feature)) return false;
  return feature.comparison === "equal"
    ? feature.count < lo || feature.count > hi
    : feature.comparison === "atLeast"
      ? feature.count > hi
      : feature.count < lo;
}

function leafRefutation(expression: StructuralExpression): Refutation | undefined {
  if (expression.kind === "feature") {
    const feature = expression.feature;
    if (feature.kind === "piece_reach_count" && feature.scope === "every") return undefined;
    const codes = new Set(structuralIssues(expression, "").filter((value) => value.severity === "error").map((value) => value.code));
    if (codes.has("OUTPOST_RANK_OUT_OF_RANGE")) return { rule: "R1", message: "outpost square is outside the detector's attainable ranks" };
    if (codes.has("PIECE_DISTANCE_ROLE_UNSUPPORTED")) return { rule: "R1", message: "piece-distance role has no evaluator" };
    const bounds = range(feature);
    if (bounds !== undefined && comparisonRefutes(feature, ...bounds)) return { rule: "R1", message: "leaf comparison lies outside its attainable range" };
    if (codes.has("NEGATIVE_FEATURE_COUNT") && "comparison" in feature && "count" in feature
      && feature.count < 0 && feature.comparison !== "atLeast") {
      return { rule: "R1", message: "a non-negative census cannot equal or stay below a negative count" };
    }
  }
  if (expression.kind === "quantified" && "squares" in expression.over && expression.feature.kind === "outpost") {
    const color = expression.feature.color;
    const region = expression.over.squares;
    const ranks = Array.from({ length: region.ranks.to - region.ranks.from + 1 }, (_, index) => region.ranks.from + index);
    if (ranks.length > 0 && ranks.every((rank) => {
      const relative = color === "white" ? rank : 9 - rank;
      return relative < 4 || relative > 6;
    })) return { rule: "R1", message: "quantified outpost domain lies outside attainable ranks" };
  }
  return undefined;
}

function isPawnBackRank(expression: StructuralExpression): boolean {
  if (expression.kind === "pieceOnSquare") return expression.piece?.role === "pawn" && ["1", "8"].includes(expression.square[1]!);
  if (expression.kind === "feature" && expression.feature.kind === "passed_pawn") return ["1", "8"].includes(expression.feature.square[1]!);
  if (expression.kind === "quantified" && "squares" in expression.over && expression.feature.kind === "passed_pawn") {
    const { from, to } = expression.over.squares.ranks;
    return from === to && (from === 1 || from === 8);
  }
  return false;
}

function scalarKey(feature: StructuralFeature): string | undefined {
  if (!["piece_count", "pawn_count", "direct_attack_count", "line_blockers", "piece_distance"].includes(feature.kind)) return undefined;
  const copy = structuredClone(feature) as Record<string, unknown>;
  delete copy.comparison;
  delete copy.count;
  return canonicalizeJson(copy);
}

function interval(feature: StructuralFeature): readonly [number, number] | undefined {
  if (!("comparison" in feature) || !("count" in feature)) return undefined;
  const attainable = range(feature) ?? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
  if (feature.comparison === "equal") return [Math.max(attainable[0], feature.count), Math.min(attainable[1], feature.count)];
  if (feature.comparison === "atLeast") return [Math.max(attainable[0], feature.count), attainable[1]];
  return [attainable[0], Math.min(attainable[1], feature.count)];
}

function allRefutation(children: readonly StructuralExpression[]): Refutation | undefined {
  const occupants = new Map<string, string>();
  const positive = new Set(children.filter((child) => child.kind !== "not").map(canonicalizeJson));
  for (const child of children) {
    if (child.kind === "pieceOnSquare") {
      const value = canonicalizeJson(child.piece);
      const prior = occupants.get(child.square);
      if (prior !== undefined && prior !== value) return { rule: "R4", message: `square ${child.square} cannot hold two occupants` };
      occupants.set(child.square, value);
    }
    if (child.kind === "not" && positive.has(canonicalizeJson(child.of))) return { rule: "R5", message: "expression contains a direct syntactic complement" };
  }
  const groups = new Map<string, StructuralFeature[]>();
  for (const child of children) {
    if (child.kind !== "feature") continue;
    const key = scalarKey(child.feature);
    if (key === undefined) continue;
    groups.set(key, [...(groups.get(key) ?? []), child.feature]);
  }
  for (const features of groups.values()) {
    let lo = Number.NEGATIVE_INFINITY;
    let hi = Number.POSITIVE_INFINITY;
    for (const feature of features) {
      const bounds = interval(feature);
      if (bounds === undefined) continue;
      lo = Math.max(lo, bounds[0]);
      hi = Math.min(hi, bounds[1]);
    }
    if (lo > hi) return { rule: "R6", message: "scalar constraints have an empty interval" };
  }
  return undefined;
}

export function refuteStructuralExpression(expression: StructuralExpression): Refutation | undefined {
  if (expression.kind === "not" && expression.of.kind === "feature") {
    const feature = expression.of.feature;
    if (feature.kind === "piece_count" && feature.role === "king" && feature.basis === "count" && feature.comparison === "atLeast" && feature.count <= 1) {
      return { rule: "R2", message: "a legal position contains one king of each color" };
    }
  }
  if (isPawnBackRank(expression)) return { rule: "R3", message: "legal positions cannot contain a back-rank pawn" };
  if (expression.kind === "feature" && expression.feature.kind === "piece_count" && expression.feature.role === "king" && expression.feature.basis === "count"
    && ((expression.feature.comparison === "equal" && expression.feature.count === 0) || (expression.feature.comparison === "atMost" && expression.feature.count <= 0))) {
    return { rule: "R2", message: "a legal position contains one king of each color" };
  }
  const leaf = leafRefutation(expression);
  if (leaf !== undefined) return leaf;
  if (expression.kind === "all") {
    const direct = allRefutation(expression.of);
    if (direct !== undefined) return direct;
    for (const child of expression.of) {
      const result = refuteStructuralExpression(child);
      if (result !== undefined) return result;
    }
  }
  if (expression.kind === "any") {
    const results = expression.of.map(refuteStructuralExpression);
    if (results.every((result) => result !== undefined)) return { rule: "R7", message: "every arm of an any-expression is unsatisfiable" };
  }
  if (expression.kind === "mirrored") return refuteStructuralExpression(expression.of);
  return undefined;
}

export function playWitness(witness: ExpressionWitness, expression: StructuralExpression): WitnessResult {
  try {
    const position = Chess.fromSetup(parseFen(witness.from).unwrap()).unwrap();
    for (const san of witness.sans) {
      const move = parseSan(position, san);
      if (move === undefined || !position.isLegal(move)) throw new TypeError(`illegal or ambiguous SAN ${san}`);
      position.play(move);
    }
    const fen = makeFen(position.toSetup());
    return Object.freeze({ ...witness, fen, actual: matchesStructuralExpression(fen, expression) });
  } catch (error) {
    return Object.freeze({ ...witness, code: "WITNESS_LINE_ILLEGAL", error: error instanceof Error ? error.message : String(error) });
  }
}

export function expressionSatisfiability(expression: StructuralExpression, corpusHits: readonly string[] = [], witnesses: readonly ExpressionWitness[] = []): SatisfiabilityResult {
  const refutation = refuteStructuralExpression(expression);
  if (refutation !== undefined) return Object.freeze({ verdict: "unsatisfiable", basis: "sound_refutation", rule: refutation.rule });
  if (corpusHits.length > 0) return Object.freeze({ verdict: "satisfiable", basis: "corpus", sampleFen: corpusHits[0]! });
  const results = witnesses.map((witness) => playWitness(witness, expression));
  const valid = results.filter((result) => result.error === undefined && result.actual === result.expect);
  const positive = valid.some((result) => result.expect);
  const negative = valid.some((result) => !result.expect);
  if (positive) return Object.freeze({ verdict: "satisfiable", basis: negative ? "witness" : "witness_positive_only", witnesses: Object.freeze(results) });
  return Object.freeze({ verdict: "unknown", basis: "no refutation rule fired and no witness exhibited", witnesses: Object.freeze(results) });
}
