// DISPOSABLE research harness — D723/Phase 2b. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { attacks, between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Color, Move, Piece, Role, Square } from "chessops/types";
import { makeUci, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { transitions } from "../r1r2-primitives-harness/corpus.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const IMPORTED = new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url).pathname;
const TARGET_PLIES = new Set([8, 16, 24, 32, 40, 48]);
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const VALUE: Readonly<Record<Role, number>> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100,
};

interface Row {
  readonly id: string;
  readonly parentFen: string;
  readonly fen: string;
  readonly uci: string;
}

interface Outcome {
  readonly uci: string;
  readonly fen: string;
}

interface LineConstraint {
  readonly slider: Square;
  readonly screen: Square;
  readonly target: Square;
  readonly sliderRole: Role;
  readonly screenRole: Role;
  readonly targetRole: Role;
}

type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean;

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function playedFen(beforeFen: string, uci: string): string {
  const pos = position(beforeFen);
  const move = parseUci(uci);
  if (move === undefined || !pos.isLegal(move)) throw new Error(`illegal move ${uci} from ${beforeFen}`);
  pos.play(move);
  return makeFen(pos.toSetup());
}

function legalOutcomes(fen: string): readonly Outcome[] {
  const pos = position(fen);
  const result: Outcome[] = [];
  for (const [from, dests] of pos.allDests()) {
    for (const to of dests) {
      const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
        ? PROMOTIONS
        : [undefined];
      for (const promotion of roles) {
        const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
        if (!pos.isLegal(move)) continue;
        const next = pos.clone();
        next.play(move);
        result.push({ uci: makeUci(move), fen: makeFen(next.toSetup()) });
      }
    }
  }
  return result;
}

function attackCount(pos: Chess, color: Color, square: Square): number {
  let count = 0;
  for (const [from, piece] of pos.board) {
    if (piece.color === color && attacks(piece, from, pos.board.occupied).has(square)) count += 1;
  }
  return count;
}

function pawnHarassesMinor(beforeFen: string, uci: string, afterFen: string): boolean {
  const before = position(beforeFen);
  const after = position(afterFen);
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return false;
  const pawn = before.board.get(move.from);
  if (pawn?.role !== "pawn") return false;
  const enemy = opposite(pawn.color);
  const beforeTargets = attacks(pawn, move.from, before.board.occupied);
  const afterPawn = after.board.get(move.to);
  if (afterPawn?.role !== "pawn" || afterPawn.color !== pawn.color) return false;
  for (const target of attacks(afterPawn, move.to, after.board.occupied)) {
    const victim = after.board.get(target);
    if (victim?.color === enemy && (victim.role === "bishop" || victim.role === "knight") && !beforeTargets.has(target)) return true;
  }
  return false;
}

function harassedMinorSquares(beforeFen: string, uci: string, afterFen: string): ReadonlySet<Square> {
  const before = position(beforeFen);
  const after = position(afterFen);
  const move = parseUci(uci);
  const result = new Set<Square>();
  if (move === undefined || !("from" in move)) return result;
  const pawn = before.board.get(move.from);
  const afterPawn = after.board.get(move.to);
  if (pawn?.role !== "pawn" || afterPawn?.role !== "pawn" || pawn.color !== afterPawn.color) return result;
  const oldTargets = attacks(pawn, move.from, before.board.occupied);
  for (const target of attacks(afterPawn, move.to, after.board.occupied)) {
    const victim = after.board.get(target);
    if (victim?.color === opposite(pawn.color) && (victim.role === "bishop" || victim.role === "knight") && !oldTargets.has(target)) result.add(target);
  }
  return result;
}

function minorPseudoDestinations(pos: Chess, color: Color, safeFrom?: Color): number {
  let total = 0;
  for (const role of ["bishop", "knight"] as const) {
    for (const square of pos.board.pieces(color, role)) {
      for (const target of attacks({ color, role }, square, pos.board.occupied)) {
        if (pos.board.getColor(target) === color) continue;
        if (safeFrom !== undefined && attackCount(pos, safeFrom, target) > 0) continue;
        total += 1;
      }
    }
  }
  return total;
}

function minorMobilityReduced(beforeFen: string, afterFen: string, safe: boolean): boolean {
  const before = position(beforeFen);
  const after = position(afterFen);
  const mover = before.turn;
  const enemy = opposite(mover);
  return minorPseudoDestinations(after, enemy, safe ? mover : undefined)
    < minorPseudoDestinations(before, enemy, safe ? mover : undefined);
}

function pawnContacts(pos: Chess, color: Color): number {
  const enemy = opposite(color);
  let total = 0;
  for (const square of pos.board.pieces(color, "pawn")) {
    for (const target of attacks({ color, role: "pawn" }, square, pos.board.occupied)) {
      if (pos.board.getColor(target) === enemy && pos.board.getRole(target) === "pawn") total += 1;
    }
  }
  return total;
}

function kingZone(king: Square): readonly Square[] {
  const file = king % 8;
  const rank = Math.floor(king / 8);
  const result: Square[] = [];
  for (let df = -1; df <= 1; df += 1) for (let dr = -1; dr <= 1; dr += 1) {
    if (df === 0 && dr === 0) continue;
    const nf = file + df;
    const nr = rank + dr;
    if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) result.push((nr * 8 + nf) as Square);
  }
  return result;
}

function attackedKingZoneSquares(pos: Chess, attacker: Color): number {
  const king = pos.board.kingOf(opposite(attacker));
  if (king === undefined) return 0;
  return kingZone(king).filter((square) => attackCount(pos, attacker, square) > 0).length;
}

function fileClass(pos: Chess, color: Color, square: Square): "open" | "half_open" | undefined {
  const file = square % 8;
  let friendlyPawn = false;
  let enemyPawn = false;
  for (let rank = 0; rank < 8; rank += 1) {
    const piece = pos.board.get((rank * 8 + file) as Square);
    if (piece?.role !== "pawn") continue;
    if (piece.color === color) friendlyPawn = true;
    else enemyPawn = true;
  }
  if (!friendlyPawn && !enemyPawn) return "open";
  if (!friendlyPawn) return "half_open";
  return undefined;
}

function heavyPieceOpenFileGained(beforeFen: string, uci: string, afterFen: string): boolean {
  const before = position(beforeFen);
  const after = position(afterFen);
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return false;
  const piece = before.board.get(move.from);
  if (piece === undefined || (piece.role !== "rook" && piece.role !== "queen")) return false;
  return fileClass(after, piece.color, move.to) !== undefined && fileClass(before, piece.color, move.from) === undefined;
}

function lockedPawnPairs(pos: Chess): ReadonlySet<string> {
  const result = new Set<string>();
  for (const white of pos.board.pieces("white", "pawn")) {
    const black = (white + 8) as Square;
    if (black < 64 && pos.board.getColor(black) === "black" && pos.board.getRole(black) === "pawn") result.add(`${white}:${black}`);
  }
  return result;
}

function sliderAlignments(pos: Chess): ReadonlySet<string> {
  const result = new Set<string>();
  const sliders: readonly Role[] = ["bishop", "rook", "queen"];
  for (const color of ["white", "black"] as const) {
    const pieces: { square: Square; piece: Piece }[] = [];
    for (const [square, piece] of pos.board) if (piece.color === color && sliders.includes(piece.role)) pieces.push({ square, piece });
    for (let left = 0; left < pieces.length; left += 1) for (let right = left + 1; right < pieces.length; right += 1) {
      const a = pieces[left]!;
      const b = pieces[right]!;
      if (attacks(a.piece, a.square, pos.board.occupied.without(b.square)).has(b.square) ||
        attacks(b.piece, b.square, pos.board.occupied.without(a.square)).has(a.square)) {
        result.add(`${color}:${Math.min(a.square, b.square)}:${Math.max(a.square, b.square)}`);
      }
    }
  }
  return result;
}

function kingShelterPawns(pos: Chess, color: Color): number {
  const king = pos.board.kingOf(color);
  if (king === undefined) return 0;
  const file = king % 8;
  const rank = Math.floor(king / 8);
  const direction = color === "white" ? 1 : -1;
  let count = 0;
  for (const df of [-1, 0, 1]) for (const distance of [1, 2]) {
    const targetFile = file + df;
    const targetRank = rank + direction * distance;
    if (targetFile < 0 || targetFile >= 8 || targetRank < 0 || targetRank >= 8) continue;
    const target = (targetRank * 8 + targetFile) as Square;
    if (pos.board.getColor(target) === color && pos.board.getRole(target) === "pawn") count += 1;
  }
  return count;
}

function defenseEdges(pos: Chess, color: Color): ReadonlySet<string> {
  const result = new Set<string>();
  for (const [defender, piece] of pos.board) {
    if (piece.color !== color) continue;
    for (const defended of attacks(piece, defender, pos.board.occupied)) {
      if (pos.board.getColor(defended) === color) result.add(`${defender}:${piece.role}:${defended}:${pos.board.getRole(defended)}`);
    }
  }
  return result;
}

function gained(before: ReadonlySet<string>, after: ReadonlySet<string>): boolean {
  return [...after].some((value) => !before.has(value));
}

function lost(before: ReadonlySet<string>, after: ReadonlySet<string>): boolean {
  return [...before].some((value) => !after.has(value));
}

function lineConstraints(fen: string): readonly LineConstraint[] {
  const pos = position(fen);
  const result: LineConstraint[] = [];
  for (const [slider, piece] of pos.board) {
    if (piece.role !== "bishop" && piece.role !== "rook" && piece.role !== "queen") continue;
    const enemy = opposite(piece.color);
    for (const targetRole of ["rook", "queen"] as const) {
      for (const target of pos.board.pieces(enemy, targetRole)) {
        const span = between(slider, target);
        if (span.isEmpty()) continue;
        const blockers = [...span.intersect(pos.board.occupied)];
        if (blockers.length !== 1) continue;
        const screen = blockers[0]!;
        const screenPiece = pos.board.get(screen);
        if (screenPiece?.color !== enemy || VALUE[screenPiece.role] >= VALUE[targetRole]) continue;
        if (!attacks(piece, slider, pos.board.occupied.without(screen)).has(target)) continue;
        result.push({ slider, screen, target, sliderRole: piece.role, screenRole: screenPiece.role, targetRole });
      }
    }
  }
  return result;
}

function constraintKey(value: LineConstraint): string {
  return `${value.slider}:${value.screen}:${value.target}:${value.sliderRole}:${value.screenRole}:${value.targetRole}`;
}

function relativeLineConstraintGained(beforeFen: string, afterFen: string): boolean {
  const before = new Set(lineConstraints(beforeFen).map(constraintKey));
  return lineConstraints(afterFen).some((value) => !before.has(constraintKey(value)));
}

const PROBES: Readonly<Record<string, Probe>> = {
  pawn_harasses_minor: pawnHarassesMinor,
  minor_pseudo_mobility_reduced: (before, _uci, after) => minorMobilityReduced(before, after, false),
  minor_safe_mobility_reduced: (before, _uci, after) => minorMobilityReduced(before, after, true),
  pawn_contact_gained: (before, _uci, after) => {
    const mover = position(before).turn;
    return pawnContacts(position(after), mover) > pawnContacts(position(before), mover);
  },
  king_zone_pressure_gained: (before, _uci, after) => {
    const mover = position(before).turn;
    return attackedKingZoneSquares(position(after), mover) > attackedKingZoneSquares(position(before), mover);
  },
  heavy_piece_open_file_gained: heavyPieceOpenFileGained,
  relative_line_constraint_gained: (before, _uci, after) => relativeLineConstraintGained(before, after),
  locked_pawn_pair_gained: (before, _uci, after) => gained(lockedPawnPairs(position(before)), lockedPawnPairs(position(after))),
  same_color_slider_alignment_gained: (before, _uci, after) => gained(sliderAlignments(position(before)), sliderAlignments(position(after))),
  king_shelter_pawn_reduced: (before, _uci, after) => {
    const old = position(before);
    const next = position(after);
    return (["white", "black"] as const).some((color) => kingShelterPawns(next, color) < kingShelterPawns(old, color));
  },
  enemy_defense_edge_lost: (before, _uci, after) => {
    const old = position(before);
    const enemy = opposite(old.turn);
    return lost(defenseEdges(old, enemy), defenseEdges(position(after), enemy));
  },
};

function speed(event: string): "bullet" | "blitz" | "rapid" | undefined {
  if (/UltraBullet/u.test(event)) return undefined;
  if (/Bullet/u.test(event)) return "bullet";
  if (/Blitz/u.test(event)) return "blitz";
  if (/Rapid/u.test(event)) return "rapid";
  return undefined;
}

function band(rating: number): "1000-1399" | "1400-1799" | "1800-2199" | undefined {
  if (rating >= 1000 && rating <= 1399) return "1000-1399";
  if (rating >= 1400 && rating <= 1799) return "1400-1799";
  if (rating >= 1800 && rating <= 2199) return "1800-2199";
  return undefined;
}

function importedPopulation(): { readonly sampled: readonly Row[]; readonly paths: readonly (readonly Row[])[] } {
  const blocks = readFileSync(IMPORTED, "utf8").split(/\n(?=\[Event )/u);
  const accepted = new Map<string, number>();
  const rows: Row[] = [];
  const paths: Row[][] = [];
  const full = (): boolean => ["bullet", "blitz", "rapid"].every((time) =>
    ["1000-1399", "1400-1799", "1800-2199"].every((elo) => (accepted.get(`${time}/${elo}`) ?? 0) >= 12));
  for (const block of blocks) {
    if (full()) break;
    let game;
    try {
      [game] = parsePgn(block);
    } catch {
      continue;
    }
    if (game === undefined || game.headers.get("Result") === "*" ||
      game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard") continue;
    const time = speed(game.headers.get("Event") ?? "");
    const elo = band((Number(game.headers.get("WhiteElo")) + Number(game.headers.get("BlackElo"))) / 2);
    if (time === undefined || elo === undefined) continue;
    const cell = `${time}/${elo}`;
    if ((accepted.get(cell) ?? 0) >= 12) continue;
    const pos = startingPosition(game.headers).unwrap();
    const candidates: Row[] = [];
    const path: Row[] = [];
    let ply = 0;
    let legal = true;
    for (const data of game.moves.mainline()) {
      const move = parseSan(pos, data.san);
      if (move === undefined || !pos.isLegal(move)) {
        legal = false;
        break;
      }
      ply += 1;
      const parentFen = makeFen(pos.toSetup());
      const uci = makeUci(move);
      pos.play(move);
      const row = {
        id: `${game.headers.get("Site") ?? cell}#${ply}`,
        parentFen,
        fen: makeFen(pos.toSetup()),
        uci,
      };
      path.push(row);
      if (TARGET_PLIES.has(ply)) candidates.push(row);
    }
    if (!legal || candidates.length === 0) continue;
    accepted.set(cell, (accepted.get(cell) ?? 0) + 1);
    rows.push(...candidates);
    paths.push(path);
  }
  if (!full()) throw new Error(`imported fixture did not fill every stratum: ${JSON.stringify(Object.fromEntries(accepted))}`);
  return { sampled: rows, paths };
}

function authoredRows(): readonly Row[] {
  return transitions().map((row) => ({ id: `${row.pack}/${row.nodeId}`, parentFen: row.parentFen, fen: row.fen, uci: row.uci }));
}

function authoredPairs(): readonly (readonly [Row, Row])[] {
  const rows = transitions();
  const byParent = new Map<string, Row[]>();
  for (const row of rows) {
    const key = `${row.pack}|${row.ply}|${row.parentFen}`;
    const found = byParent.get(key) ?? [];
    found.push({ id: `${row.pack}/${row.nodeId}`, parentFen: row.parentFen, fen: row.fen, uci: row.uci });
    byParent.set(key, found);
  }
  const pairs: [Row, Row][] = [];
  for (const row of rows) {
    const first: Row = { id: `${row.pack}/${row.nodeId}`, parentFen: row.parentFen, fen: row.fen, uci: row.uci };
    for (const second of byParent.get(`${row.pack}|${row.ply + 1}|${row.fen}`) ?? []) pairs.push([first, second]);
  }
  return pairs;
}

function pathPairs(paths: readonly (readonly Row[])[]): readonly (readonly [Row, Row])[] {
  const result: [Row, Row][] = [];
  for (const path of paths) for (let index = 0; index + 1 < path.length; index += 1) result.push([path[index]!, path[index + 1]!]);
  return result;
}

function sequenceMetric(pairs: readonly (readonly [Row, Row])[]): {
  harass: number;
  relocation: number;
  preserved: number;
  broken: number;
  pairCount: number;
  preservedExamples: readonly string[];
} {
  let harass = 0;
  let relocation = 0;
  let preserved = 0;
  let broken = 0;
  const preservedExamples: string[] = [];
  for (const [first, second] of pairs) {
    const targets = harassedMinorSquares(first.parentFen, first.uci, first.fen);
    if (targets.size === 0) continue;
    harass += 1;
    const move = parseUci(second.uci);
    if (move === undefined || !("from" in move) || !targets.has(move.from)) continue;
    const piece = position(second.parentFen).board.get(move.from);
    if (piece?.role !== "bishop" && piece?.role !== "knight") continue;
    relocation += 1;
    if (preservedConstraint(second.parentFen, second.uci, second.fen)) {
      preserved += 1;
      if (preservedExamples.length < 5) preservedExamples.push(`${first.id} → ${second.uci}`);
    }
    else broken += 1;
  }
  return { harass, relocation, preserved, broken, pairCount: pairs.length, preservedExamples };
}

function metric(rows: readonly Row[]): readonly { name: string; played: number; alternatives: number; playedRate: number; altRate: number; lift: number }[] {
  const played = new Map<string, number>();
  const alternatives = new Map<string, number>();
  let eligibleRows = 0;
  let alternativeCount = 0;
  for (const row of rows) {
    const actualFen = playedFen(row.parentFen, row.uci);
    const alts = legalOutcomes(row.parentFen).filter((outcome) => outcome.fen !== actualFen);
    if (alts.length === 0) continue;
    eligibleRows += 1;
    for (const [name, probe] of Object.entries(PROBES)) {
      if (probe(row.parentFen, row.uci, actualFen)) played.set(name, (played.get(name) ?? 0) + 1);
    }
    for (const alt of alts) {
      alternativeCount += 1;
      for (const [name, probe] of Object.entries(PROBES)) {
        if (probe(row.parentFen, alt.uci, alt.fen)) alternatives.set(name, (alternatives.get(name) ?? 0) + 1);
      }
    }
  }
  return Object.keys(PROBES).map((name) => {
    const playedCount = played.get(name) ?? 0;
    const altCount = alternatives.get(name) ?? 0;
    const playedRate = playedCount / eligibleRows;
    const altRate = altCount / alternativeCount;
    return {
      name,
      played: playedCount,
      alternatives: altCount,
      playedRate,
      altRate,
      lift: altRate === 0 ? Number.POSITIVE_INFINITY : playedRate / altRate,
    };
  }).sort((left, right) => right.lift - left.lift || left.name.localeCompare(right.name));
}

function lineFromSan(sans: readonly string[]): readonly { before: string; uci: string; after: string }[] {
  const pos = Chess.default();
  const result: { before: string; uci: string; after: string }[] = [];
  for (const san of sans) {
    const before = makeFen(pos.toSetup());
    const move = parseSan(pos, san);
    if (move === undefined || !pos.isLegal(move)) throw new Error(`illegal SAN ${san}`);
    const uci = makeUci(move);
    pos.play(move);
    result.push({ before, uci, after: makeFen(pos.toSetup()) });
  }
  return result;
}

function preservedConstraint(beforeRetreatFen: string, retreatUci: string, afterRetreatFen: string): boolean {
  const before = position(beforeRetreatFen);
  const move = parseUci(retreatUci);
  if (move === undefined || !("from" in move)) return false;
  const moved = before.board.get(move.from);
  if (moved === undefined || (moved.role !== "bishop" && moved.role !== "rook" && moved.role !== "queen")) return false;
  return lineConstraints(beforeRetreatFen).some((old) => old.slider === move.from &&
    lineConstraints(afterRetreatFen).some((next) => next.slider === move.to && next.screen === old.screen &&
      next.target === old.target && next.sliderRole === old.sliderRole && next.screenRole === old.screenRole &&
      next.targetRole === old.targetRole));
}

function pct(value: number): string {
  return `${(100 * value).toFixed(3)}%`;
}

describe("D723 breadth candidates", () => {
  it("recognizes harassment plus preserved relative pressure and rejects broken variants", () => {
    const line = lineFromSan(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "h3", "Bh5"]);
    const h3 = line[6]!;
    const retreat = line[7]!;
    expect(pawnHarassesMinor(h3.before, h3.uci, h3.after)).toBe(true);
    expect(lineConstraints(h3.before)).toContainEqual(expect.objectContaining({ slider: 30, screen: 21, target: 3 }));
    expect(preservedConstraint(retreat.before, retreat.uci, retreat.after)).toBe(true);

    const brokenRay = lineFromSan(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "h3", "Bf5"]);
    expect(preservedConstraint(brokenRay[7]!.before, brokenRay[7]!.uci, brokenRay[7]!.after)).toBe(false);
    const capturedScreen = lineFromSan(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "h3", "Bxf3"]);
    expect(preservedConstraint(capturedScreen[7]!.before, capturedScreen[7]!.uci, capturedScreen[7]!.after)).toBe(false);

    const changedTarget = lineFromSan(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "Qd2", "e6", "h3", "Bh5"]);
    expect(preservedConstraint(changedTarget[9]!.before, changedTarget[9]!.uci, changedTarget[9]!.after)).toBe(false);

    const twoBlockers = "4k3/8/8/7b/8/5N2/4P3/3QK3 b - - 0 1";
    expect(lineConstraints(twoBlockers)).toHaveLength(0);

    const noValuableTarget = "4k3/8/8/7b/8/5N2/8/4K3 b - - 0 1";
    expect(lineConstraints(noValuableTarget)).toHaveLength(0);

    // pressure-line@1 ray compatibility (breadth-collectors acceptance review): a bishop merely
    // collinear with a screened enemy rook along a rank is not a pressure line — with the screen
    // removed the target must lie in the slider's own attack set.
    const rankCollinearBishop = "4k3/8/8/8/1B1p3r/8/8/4K3 w - - 0 1";
    expect(lineConstraints(rankCollinearBishop)).toHaveLength(0);
  });

  it("pins the added topology conventions with positive and hard-negative fixtures", () => {
    const lockedBefore = "4k3/8/4p3/8/4P3/8/8/4K3 w - - 0 1";
    const lockedAfter = playedFen(lockedBefore, "e4e5");
    expect(gained(lockedPawnPairs(position(lockedBefore)), lockedPawnPairs(position(lockedAfter)))).toBe(true);
    const diagonalPawn = "4k3/8/3p4/8/4P3/8/8/4K3 w - - 0 1";
    expect(gained(lockedPawnPairs(position(diagonalPawn)), lockedPawnPairs(position(playedFen(diagonalPawn, "e4e5"))))).toBe(false);

    const alignmentBefore = "4k3/8/8/8/8/R7/B7/R3K3 w - - 0 1";
    expect(gained(sliderAlignments(position(alignmentBefore)), sliderAlignments(position(playedFen(alignmentBefore, "a2b3"))))).toBe(true);
    expect(gained(sliderAlignments(position(alignmentBefore)), sliderAlignments(position(playedFen(alignmentBefore, "a2b1"))))).toBe(true);
    const blockedAlignment = "4k3/8/8/8/8/R7/BN6/R3K3 w - - 0 1";
    expect(gained(sliderAlignments(position(blockedAlignment)), sliderAlignments(position(playedFen(blockedAlignment, "b2c4"))))).toBe(false);

    const shelter = "4k3/8/8/8/8/8/5PPP/6K1 w - - 0 1";
    expect(kingShelterPawns(position(playedFen(shelter, "g2g4")), "white")).toBeLessThan(kingShelterPawns(position(shelter), "white"));
    expect(kingShelterPawns(position(playedFen(shelter, "g2g3")), "white")).toBe(kingShelterPawns(position(shelter), "white"));

    const defenderCapture = "r3k3/1B6/n7/8/8/8/8/4K3 w - - 0 1";
    const defenderBefore = position(defenderCapture);
    const defenderAfter = position(playedFen(defenderCapture, "b7a8"));
    expect(lost(defenseEdges(defenderBefore, "black"), defenseEdges(defenderAfter, "black"))).toBe(true);
  });

  it("measures authored and imported played-vs-alternative lift without treating lift as truth", () => {
    const imported = importedPopulation();
    const populations = [
      { name: "authored pack spines", rows: authoredRows() },
      { name: "sealed imported CC0 sample", rows: imported.sampled },
    ];
    const lines: string[] = [
      "# D723 middlegame-breadth output",
      "",
      "Played-vs-legal-alternative lift measures discrimination only. It does not establish correctness, usefulness, intent, or move quality.",
      "",
    ];
    for (const population of populations) {
      const rows = metric(population.rows);
      lines.push(`## ${population.name}`, "", `Rows: ${population.rows.length}.`, "", "| probe | played n/rate | alternatives n/rate | lift |", "|---|---:|---:|---:|");
      for (const row of rows) {
        lines.push(`| \`${row.name}\` | ${row.played} / ${pct(row.playedRate)} | ${row.alternatives} / ${pct(row.altRate)} | ${Number.isFinite(row.lift) ? `${row.lift.toFixed(2)}x` : "inf"} |`);
      }
      lines.push("");
    }
    lines.push("## Consecutive-edge sequence census", "", "| population | consecutive pairs | pawn harassment | attacked minor immediately relocates | same line constraint preserved | line not preserved |", "|---|---:|---:|---:|---:|---:|");
    for (const item of [
      { name: "authored branch edges", result: sequenceMetric(authoredPairs()) },
      { name: "sealed imported games", result: sequenceMetric(pathPairs(imported.paths)) },
    ]) {
      lines.push(`| ${item.name} | ${item.result.pairCount} | ${item.result.harass} | ${item.result.relocation} | ${item.result.preserved} | ${item.result.broken} |`);
      if (item.result.preservedExamples.length > 0) lines.push("", `${item.name} preserved examples: ${item.result.preservedExamples.map((value) => `\`${value}\``).join(", ")}.`, "");
    }
    lines.push("");
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
    expect(populations[0]!.rows.length).toBeGreaterThan(500);
    expect(populations[1]!.rows.length).toBe(579);
  });
});
