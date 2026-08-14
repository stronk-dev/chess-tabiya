import { attacks, between, pawnAttacks } from "chessops/attacks";
import type { Color, FileName, Role, Square, SquareName } from "chessops/types";
import { makeSquare, opposite, parseSquare } from "chessops/util";
import { STRUCTURAL_FEATURE_KINDS, type StructuralFeatureKind } from "@chess-tabiya/schema/drill-pack";

import { positionFromFen } from "./chess.js";

export type FeatureComparison = "atLeast" | "atMost" | "equal";
export type ReachRole = "knight" | "bishop" | "rook" | "queen";
export type ReachScope = "any" | "every";
export type StructureId = "carlsbad" | "iqp-white" | "iqp-black" | "maroczy-bind";

export type StructuralFeature =
  | { readonly kind: "pawn_safe_square"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "outpost"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "backward_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "isolated_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "doubled_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "passed_pawn"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "open_file"; readonly file: FileName }
  | { readonly kind: "half_open_file"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "line_blockers"; readonly from: SquareName; readonly to: SquareName; readonly comparison: FeatureComparison; readonly count: number }
  | { readonly kind: "direct_attack_count"; readonly square: SquareName; readonly color: Color; readonly comparison: FeatureComparison; readonly count: number }
  | { readonly kind: "piece_reach_count"; readonly color: Color; readonly role: ReachRole; readonly scope: ReachScope; readonly comparison: FeatureComparison; readonly count: number }
  | { readonly kind: "named_structure"; readonly id: StructureId };

export { STRUCTURAL_FEATURE_KINDS };
export type { StructuralFeatureKind };

export type StructuralExpression =
  | { readonly kind: "all"; readonly of: readonly [StructuralExpression, ...StructuralExpression[]] }
  | { readonly kind: "any"; readonly of: readonly [StructuralExpression, ...StructuralExpression[]] }
  | { readonly kind: "not"; readonly of: StructuralExpression }
  | { readonly kind: "feature"; readonly feature: StructuralFeature }
  | { readonly kind: "pieceOnSquare"; readonly square: SquareName; readonly piece: { readonly color: Color; readonly role: Role } | null };

export interface PawnSafety {
  readonly square: SquareName;
  readonly color: Color;
  readonly safe: boolean;
  readonly basis: "current_pawn_files";
  readonly pushAttackers: readonly { readonly square: SquareName; readonly pushes: number }[];
  readonly captureAttackers: readonly { readonly square: SquareName; readonly captures: number }[];
}

export interface StructuralObservation {
  readonly kind: StructuralFeatureKind;
  readonly color?: Color;
  readonly role?: ReachRole;
  readonly squares: readonly SquareName[];
  readonly file?: FileName;
  readonly count?: number;
  readonly detail?: PawnSafety;
  readonly provenanceNote?: string;
}

export interface StructureMatch {
  readonly id: StructureId;
  readonly name: string;
  readonly provenanceNote: string;
}

export interface StructuralReading {
  readonly fen: string;
  readonly skeletonKey: string;
  readonly features: readonly StructuralObservation[];
  readonly structures: readonly StructureMatch[];
}

export interface StructuralDelta {
  readonly parentFen: string;
  readonly fen: string;
  readonly gained: readonly StructuralObservation[];
  readonly lost: readonly StructuralObservation[];
  readonly evictionChanges: readonly {
    readonly square: SquareName;
    readonly color: Color;
    readonly pushesBefore: number | null;
    readonly pushesAfter: number | null;
  }[];
}

export interface VacationReading {
  readonly square: SquareName;
  readonly piece: { readonly color: Color; readonly role: Role };
  readonly unblocks: readonly { readonly slider: SquareName; readonly color: Color; readonly gains: readonly SquareName[] }[];
}

const FILES = Object.freeze(["a", "b", "c", "d", "e", "f", "g", "h"] as const);
const COLORS = Object.freeze(["white", "black"] as const);
const REACH_ROLES = Object.freeze(["knight", "bishop", "rook", "queen"] as const);

function fileIndex(file: FileName): number { return FILES.indexOf(file); }
function rankOf(square: Square): number { return Math.floor(square / 8); }
function forward(color: Color): 1 | -1 { return color === "white" ? 1 : -1; }
function compare(actual: number, comparison: FeatureComparison, expected: number): boolean {
  return comparison === "atLeast" ? actual >= expected : comparison === "atMost" ? actual <= expected : actual === expected;
}

function pawns(position: ReturnType<typeof positionFromFen>, color: Color): readonly Square[] {
  return [...position.board.pieces(color, "pawn")];
}

export function pawnSafety(fen: string, color: Color, squareName: SquareName): PawnSafety {
  const position = positionFromFen(fen);
  const square = parseSquare(squareName);
  if (square === undefined) throw new TypeError(`Invalid square: ${squareName}`);
  const targetFile = square % 8;
  const targetRank = rankOf(square);
  const enemy = opposite(color);
  const enemyForward = forward(enemy);
  const standRank = targetRank - enemyForward;
  const pushAttackers: { square: SquareName; pushes: number }[] = [];
  const captureAttackers: { square: SquareName; captures: number }[] = [];
  for (const pawn of pawns(position, enemy)) {
    const pawnFile = pawn % 8;
    const pawnRank = rankOf(pawn);
    if (Math.abs(pawnFile - targetFile) === 1) {
      const pushes = (standRank - pawnRank) * enemyForward;
      if (pushes >= 0) pushAttackers.push({ square: makeSquare(pawn), pushes });
    }
    const captures = Math.abs(pawnFile - (targetFile - 1));
    const alternate = Math.abs(pawnFile - (targetFile + 1));
    const needed = Math.min(captures, alternate);
    const advance = (standRank - pawnRank) * enemyForward;
    if (needed >= 1 && advance >= needed) captureAttackers.push({ square: makeSquare(pawn), captures: needed });
  }
  pushAttackers.sort((a, b) => a.pushes - b.pushes || a.square.localeCompare(b.square));
  captureAttackers.sort((a, b) => a.captures - b.captures || a.square.localeCompare(b.square));
  return Object.freeze({ square: squareName, color, safe: pushAttackers.length === 0, basis: "current_pawn_files", pushAttackers: Object.freeze(pushAttackers), captureAttackers: Object.freeze(captureAttackers) });
}

function directAttackCount(fen: string, color: Color, target: Square): number {
  const position = positionFromFen(fen);
  let count = 0;
  for (const [square, piece] of position.board) {
    if (piece.color === color && attacks(piece, square, position.board.occupied).has(target)) count++;
  }
  return count;
}

function namedStructureMatches(fen: string, id: StructureId): boolean {
  const entries: Readonly<Record<StructureId, StructuralExpression>> = {
    carlsbad: { kind: "all", of: [
      { kind: "feature", feature: { kind: "half_open_file", color: "white", file: "c" } },
      { kind: "feature", feature: { kind: "half_open_file", color: "black", file: "e" } },
      { kind: "pieceOnSquare", square: "d4", piece: { color: "white", role: "pawn" } },
      { kind: "pieceOnSquare", square: "d5", piece: { color: "black", role: "pawn" } },
      { kind: "pieceOnSquare", square: "c6", piece: { color: "black", role: "pawn" } },
    ] },
    "iqp-white": { kind: "all", of: [
      { kind: "pieceOnSquare", square: "d4", piece: { color: "white", role: "pawn" } },
      { kind: "feature", feature: { kind: "isolated_pawn", color: "white", file: "d" } },
      { kind: "feature", feature: { kind: "half_open_file", color: "black", file: "d" } },
    ] },
    "iqp-black": { kind: "all", of: [
      { kind: "pieceOnSquare", square: "d5", piece: { color: "black", role: "pawn" } },
      { kind: "feature", feature: { kind: "isolated_pawn", color: "black", file: "d" } },
      { kind: "feature", feature: { kind: "half_open_file", color: "white", file: "d" } },
    ] },
    "maroczy-bind": { kind: "all", of: [
      { kind: "pieceOnSquare", square: "c4", piece: { color: "white", role: "pawn" } },
      { kind: "pieceOnSquare", square: "e4", piece: { color: "white", role: "pawn" } },
      { kind: "feature", feature: { kind: "half_open_file", color: "white", file: "d" } },
      { kind: "feature", feature: { kind: "half_open_file", color: "black", file: "c" } },
    ] },
  };
  return matchesStructuralExpression(fen, entries[id]);
}

export function matchesStructuralFeature(fen: string, feature: StructuralFeature): boolean {
  const position = positionFromFen(fen);
  if (feature.kind === "pawn_safe_square") return pawnSafety(fen, feature.color, feature.square).safe;
  if (feature.kind === "outpost") {
    const square = parseSquare(feature.square); if (square === undefined) return false;
    const relativeRank = feature.color === "white" ? rankOf(square) + 1 : 8 - rankOf(square);
    return relativeRank >= 4 && relativeRank <= 6 && [...pawns(position, feature.color)].some((p) => pawnAttacks(feature.color, p).has(square)) && pawnSafety(fen, feature.color, feature.square).safe;
  }
  if (feature.kind === "backward_pawn") {
    const fi = fileIndex(feature.file);
    return pawns(position, feature.color).filter((p) => p % 8 === fi).some((pawn) => {
      const rank = rankOf(pawn);
      const supported = pawns(position, feature.color).some((other) => Math.abs((other % 8) - fi) === 1 && (rankOf(other) - rank) * forward(feature.color) <= 0);
      const stop = pawn + 8 * forward(feature.color);
      return !supported && stop >= 0 && stop < 64 && pawns(position, opposite(feature.color)).some((enemy) => pawnAttacks(opposite(feature.color), enemy).has(stop));
    });
  }
  if (feature.kind === "isolated_pawn") {
    const fi = fileIndex(feature.file); const own = pawns(position, feature.color);
    return own.some((p) => p % 8 === fi) && !own.some((p) => Math.abs((p % 8) - fi) === 1);
  }
  if (feature.kind === "doubled_pawn") return pawns(position, feature.color).filter((p) => p % 8 === fileIndex(feature.file)).length >= 2;
  if (feature.kind === "passed_pawn") {
    const square = parseSquare(feature.square); if (square === undefined || position.board.get(square)?.role !== "pawn" || position.board.getColor(square) !== feature.color) return false;
    return !pawns(position, opposite(feature.color)).some((p) => Math.abs((p % 8) - (square % 8)) <= 1 && (rankOf(p) - rankOf(square)) * forward(feature.color) > 0);
  }
  if (feature.kind === "open_file") return ![...position.board.pawn].some((p) => p % 8 === fileIndex(feature.file));
  if (feature.kind === "half_open_file") {
    const fi = fileIndex(feature.file);
    return !pawns(position, feature.color).some((p) => p % 8 === fi) && pawns(position, opposite(feature.color)).some((p) => p % 8 === fi);
  }
  if (feature.kind === "line_blockers") {
    const from = parseSquare(feature.from), to = parseSquare(feature.to); if (from === undefined || to === undefined) return false;
    return compare(between(from, to).intersect(position.board.occupied).size(), feature.comparison, feature.count);
  }
  if (feature.kind === "direct_attack_count") {
    const target = parseSquare(feature.square); return target !== undefined && compare(directAttackCount(fen, feature.color, target), feature.comparison, feature.count);
  }
  if (feature.kind === "piece_reach_count") {
    const values = [...position.board.pieces(feature.color, feature.role)].map((square) => attacks({ color: feature.color, role: feature.role }, square, position.board.occupied).diff(position.board[feature.color]).size());
    return feature.scope === "any" ? values.some((value) => compare(value, feature.comparison, feature.count)) : values.every((value) => compare(value, feature.comparison, feature.count));
  }
  if (feature.kind === "named_structure") return namedStructureMatches(fen, feature.id);
  const exhaustive: never = feature;
  throw new TypeError(`Unhandled structural feature: ${JSON.stringify(exhaustive)}`);
}

export function matchesStructuralExpression(fen: string, expression: StructuralExpression): boolean {
  if (expression.kind === "all" || expression.kind === "any") return expression.kind === "all" ? expression.of.every((item) => matchesStructuralExpression(fen, item)) : expression.of.some((item) => matchesStructuralExpression(fen, item));
  if (expression.kind === "not") return !matchesStructuralExpression(fen, expression.of);
  if (expression.kind === "feature") return matchesStructuralFeature(fen, expression.feature);
  if (expression.kind !== "pieceOnSquare") {
    const exhaustive: never = expression;
    throw new TypeError(`Unhandled structural expression: ${JSON.stringify(exhaustive)}`);
  }
  const position = positionFromFen(fen); const square = parseSquare(expression.square);
  if (square === undefined) return false;
  const actual = position.board.get(square);
  return expression.piece === null ? actual === undefined : actual?.color === expression.piece.color && actual.role === expression.piece.role;
}

const STRUCTURE_METADATA: Readonly<Record<StructureId, Omit<StructureMatch, "id">>> = Object.freeze({
  carlsbad: { name: "Carlsbad structure", provenanceNote: "Tabiya catalogue convention: QGD Exchange pawn skeleton." },
  "iqp-white": { name: "White isolated queen's pawn", provenanceNote: "Tabiya catalogue convention: isolated White d-pawn with no Black d-pawn." },
  "iqp-black": { name: "Black isolated queen's pawn", provenanceNote: "Tabiya catalogue convention: isolated Black d-pawn with no White d-pawn." },
  "maroczy-bind": { name: "Maroczy Bind", provenanceNote: "Tabiya catalogue convention: White pawns on c4/e4 with the declared open files." },
});

function observationKey(value: StructuralObservation): string { return JSON.stringify(value); }
function observationIdentity(value: StructuralObservation): string {
  if (value.kind === "pawn_safe_square") return JSON.stringify({ kind: value.kind, color: value.color, squares: value.squares });
  return observationKey(value);
}
function canonicalObservations(values: readonly StructuralObservation[]): readonly StructuralObservation[] {
  return Object.freeze([...values].sort((a, b) => STRUCTURAL_FEATURE_KINDS.indexOf(a.kind) - STRUCTURAL_FEATURE_KINDS.indexOf(b.kind) || observationKey(a).localeCompare(observationKey(b))));
}

export function structuralReading(fen: string): StructuralReading {
  const position = positionFromFen(fen); const values: StructuralObservation[] = [];
  for (const color of COLORS) for (const file of FILES) {
    for (const kind of ["backward_pawn", "isolated_pawn", "doubled_pawn"] as const) if (matchesStructuralFeature(fen, { kind, color, file })) values.push({ kind, color, file, squares: [] });
    if (matchesStructuralFeature(fen, { kind: "half_open_file", color, file })) values.push({ kind: "half_open_file", color, file, squares: [] });
  }
  for (const file of FILES) if (matchesStructuralFeature(fen, { kind: "open_file", file })) values.push({ kind: "open_file", file, squares: [] });
  for (const [square, piece] of position.board) {
    const name = makeSquare(square);
    if (piece.role === "pawn" && matchesStructuralFeature(fen, { kind: "passed_pawn", color: piece.color, square: name })) values.push({ kind: "passed_pawn", color: piece.color, squares: [name] });
    if (piece.role !== "pawn" && piece.role !== "king") {
      const detail = pawnSafety(fen, piece.color, name); if (detail.safe || detail.pushAttackers.length > 0) values.push({ kind: "pawn_safe_square", color: piece.color, squares: [name], detail });
      if (matchesStructuralFeature(fen, { kind: "outpost", color: piece.color, square: name })) values.push({ kind: "outpost", color: piece.color, squares: [name], provenanceNote: "Tabiya's strict outpost detector." });
    }
    if (REACH_ROLES.includes(piece.role as ReachRole)) {
      const count = attacks(piece, square, position.board.occupied).diff(position.board[piece.color]).size();
      values.push({ kind: "piece_reach_count", color: piece.color, role: piece.role as ReachRole, squares: [name], count });
    }
    if (piece.role === "bishop" || piece.role === "rook" || piece.role === "queen") {
      const directions = piece.role === "bishop" ? [[-1, -1], [1, -1], [-1, 1], [1, 1]] : piece.role === "rook" ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [df, dr] of directions) {
        let file = square % 8, rank = rankOf(square), endpoint = square;
        while (file + df! >= 0 && file + df! < 8 && rank + dr! >= 0 && rank + dr! < 8) { file += df!; rank += dr!; endpoint = file + rank * 8; }
        const span = between(square, endpoint);
        if (!span.isEmpty()) values.push({ kind: "line_blockers", squares: [name, makeSquare(endpoint)], count: span.intersect(position.board.occupied).size() });
      }
    }
    if (piece.role !== "pawn") for (const color of COLORS) { const count = directAttackCount(fen, color, square); if (count > 0) values.push({ kind: "direct_attack_count", color, squares: [name], count }); }
  }
  const structures = (Object.keys(STRUCTURE_METADATA) as StructureId[]).filter((id) => namedStructureMatches(fen, id)).map((id) => Object.freeze({ id, ...STRUCTURE_METADATA[id] }));
  for (const structure of structures) values.push({ kind: "named_structure", squares: [], provenanceNote: structure.provenanceNote });
  const skeletonKey = COLORS.flatMap((color) => pawns(position, color).map(makeSquare).sort().map((square) => `${color[0]}:${square}`)).join("|");
  return Object.freeze({ fen, skeletonKey, features: canonicalObservations(values), structures: Object.freeze(structures) });
}

export function structuralDelta(parentFen: string, fen: string): StructuralDelta {
  const before = structuralReading(parentFen).features, after = structuralReading(fen).features;
  const beforeKeys = new Map(before.map((item) => [observationIdentity(item), item])); const afterKeys = new Map(after.map((item) => [observationIdentity(item), item]));
  const evictionChanges: StructuralDelta["evictionChanges"][number][] = [];
  for (const color of COLORS) for (let square = 0; square < 64; square++) {
    const name = makeSquare(square); const beforeSafety = pawnSafety(parentFen, color, name); const afterSafety = pawnSafety(fen, color, name);
    const beforePush = beforeSafety.pushAttackers[0]?.pushes ?? null; const afterPush = afterSafety.pushAttackers[0]?.pushes ?? null;
    if (beforePush !== afterPush) evictionChanges.push({ square: name, color, pushesBefore: beforePush, pushesAfter: afterPush });
  }
  return Object.freeze({ parentFen, fen, gained: canonicalObservations([...afterKeys].filter(([key]) => !beforeKeys.has(key)).map(([, value]) => value)), lost: canonicalObservations([...beforeKeys].filter(([key]) => !afterKeys.has(key)).map(([, value]) => value)), evictionChanges: Object.freeze(evictionChanges) });
}

export function vacationReading(fen: string, squareName: SquareName): VacationReading | null {
  const position = positionFromFen(fen); const square = parseSquare(squareName); if (square === undefined) return null;
  const piece = position.board.get(square); if (!piece) return null;
  const without = position.board.occupied.without(square); const unblocks: VacationReading["unblocks"][number][] = [];
  for (const [slider, sliderPiece] of position.board) {
    if (!REACH_ROLES.includes(sliderPiece.role as ReachRole) || slider === square) continue;
    const before = attacks(sliderPiece, slider, position.board.occupied); const after = attacks(sliderPiece, slider, without); const gains = [...after.diff(before)].map(makeSquare).sort();
    if (gains.length > 0) unblocks.push({ slider: makeSquare(slider), color: sliderPiece.color, gains });
  }
  return Object.freeze({ square: squareName, piece, unblocks: Object.freeze(unblocks.sort((a, b) => a.slider.localeCompare(b.slider))) });
}

export function structuralFeatureKinds(expression: StructuralExpression): readonly StructuralFeatureKind[] {
  const values: StructuralFeatureKind[] = [];
  const visit = (item: StructuralExpression): void => {
    if (item.kind === "feature") values.push(item.feature.kind);
    else if (item.kind === "not") visit(item.of);
    else if (item.kind === "all" || item.kind === "any") item.of.forEach(visit);
  };
  visit(expression);
  return Object.freeze(STRUCTURAL_FEATURE_KINDS.filter((kind) => values.includes(kind)));
}
