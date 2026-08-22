// DISPOSABLE research harness — D754/Phase 2b. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { attacks, between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Color, Move, Piece, Role, Square } from "chessops/types";
import { makeUci, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { transitions } from "../r1r2-primitives-harness/corpus.js";
import {
  legalCaptureMovesTo,
  legalExchangeForMove,
  researchPosition,
} from "../research-chess/legal-exchange.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const IMPORTED = new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url).pathname;
const TARGET_PLIES = new Set([8, 16, 24, 32, 40, 48]);
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const MATERIAL_ROLES: readonly Role[] = ["pawn", "knight", "bishop", "rook", "queen"];

interface Row {
  readonly id: string;
  readonly parentFen: string;
  readonly uci: string;
}

interface Outcome {
  readonly uci: string;
  readonly fen: string;
}

interface Coordination {
  readonly color: Color;
  readonly rear: Square;
  readonly front: Square;
  readonly target: Square;
  readonly rearRole: Role;
  readonly frontRole: Role;
  readonly targetRole: Role;
}

type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean | undefined;

function position(fen: string): Chess {
  return researchPosition(fen);
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
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
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
  return result;
}

function pawnContestsMinorDestination(beforeFen: string, uci: string, afterFen: string): boolean {
  const before = position(beforeFen);
  const after = position(afterFen);
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return false;
  const pawn = before.board.get(move.from);
  const afterPawn = after.board.get(move.to);
  if (pawn?.role !== "pawn" || afterPawn?.role !== "pawn" || pawn.color !== afterPawn.color) return false;
  const oldControl = attacks(pawn, move.from, before.board.occupied);
  const enemy = opposite(pawn.color);
  for (const square of attacks(afterPawn, move.to, after.board.occupied)) {
    if (oldControl.has(square) || after.board.get(square) !== undefined) continue;
    for (const role of ["bishop", "knight"] as const) for (const minor of after.board.pieces(enemy, role)) {
      if (attacks({ color: enemy, role }, minor, after.board.occupied).has(square)) return true;
    }
  }
  return false;
}

function wing(file: number): "queenside" | "kingside" | undefined {
  if (file <= 2) return "queenside";
  if (file >= 5) return "kingside";
  return undefined;
}

function pawnsOnWing(pos: Chess, color: Color, side: "queenside" | "kingside"): number {
  return [...pos.board.pieces(color, "pawn")].filter((square) => wing(square % 8) === side).length;
}

function majorityWingPawnAdvance(beforeFen: string, uci: string): boolean {
  const before = position(beforeFen);
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return false;
  const pawn = before.board.get(move.from);
  if (pawn?.role !== "pawn" || move.from % 8 !== move.to % 8) return false;
  const side = wing(move.from % 8);
  return side !== undefined && pawnsOnWing(before, pawn.color, side) > pawnsOnWing(before, opposite(pawn.color), side);
}

function blockaderPlaced(beforeFen: string, uci: string, afterFen: string): boolean {
  const before = position(beforeFen);
  const after = position(afterFen);
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return false;
  const moved = before.board.get(move.from);
  if (moved === undefined || moved.role === "pawn") return false;
  const enemy = opposite(moved.color);
  for (const pawn of after.board.pieces(enemy, "pawn")) {
    const forward = pawn + (enemy === "white" ? 8 : -8);
    if (forward === move.to) return true;
  }
  return false;
}

function connectedRooks(pos: Chess): ReadonlySet<string> {
  const result = new Set<string>();
  for (const color of ["white", "black"] as const) {
    const rooks = [...pos.board.pieces(color, "rook")];
    for (let left = 0; left < rooks.length; left += 1) for (let right = left + 1; right < rooks.length; right += 1) {
      const a = rooks[left]!;
      const b = rooks[right]!;
      if ((a % 8 === b % 8 || Math.floor(a / 8) === Math.floor(b / 8)) &&
        between(a, b).intersect(pos.board.occupied).isEmpty()) result.add(`${color}:${a}:${b}`);
    }
  }
  return result;
}

function direction(from: Square, to: Square): readonly [number, number] | undefined {
  const df = to % 8 - from % 8;
  const dr = Math.floor(to / 8) - Math.floor(from / 8);
  if (df === 0 && dr !== 0) return [0, Math.sign(dr)];
  if (dr === 0 && df !== 0) return [Math.sign(df), 0];
  if (Math.abs(df) === Math.abs(dr) && df !== 0) return [Math.sign(df), Math.sign(dr)];
  return undefined;
}

function coordinationKey(value: Coordination): string {
  return `${value.color}:${value.rear}:${value.front}:${value.target}:${value.rearRole}:${value.frontRole}:${value.targetRole}`;
}

function targetedSliderCoordinations(pos: Chess): ReadonlySet<string> {
  const result = new Set<string>();
  for (const color of ["white", "black"] as const) {
    const own: { square: Square; piece: Piece }[] = [];
    for (const [square, piece] of pos.board) if (piece.color === color &&
      (piece.role === "bishop" || piece.role === "rook" || piece.role === "queen")) own.push({ square, piece });
    const enemy = opposite(color);
    for (const rear of own) for (const front of own) {
      if (rear.square === front.square) continue;
      const firstDirection = direction(rear.square, front.square);
      if (firstDirection === undefined || !between(rear.square, front.square).intersect(pos.board.occupied).isEmpty()) continue;
      if (!attacks(rear.piece, rear.square, pos.board.occupied.without(front.square)).has(front.square)) continue;
      for (const targetRole of ["rook", "queen", "king"] as const) for (const target of pos.board.pieces(enemy, targetRole)) {
        const secondDirection = direction(front.square, target);
        if (secondDirection === undefined || secondDirection[0] !== firstDirection[0] || secondDirection[1] !== firstDirection[1]) continue;
        if (!between(front.square, target).intersect(pos.board.occupied).isEmpty()) continue;
        if (!attacks(front.piece, front.square, pos.board.occupied.without(target)).has(target)) continue;
        result.add(coordinationKey({ color, rear: rear.square, front: front.square, target,
          rearRole: rear.piece.role, frontRole: front.piece.role, targetRole }));
      }
    }
  }
  return result;
}

function materialSignature(pos: Chess): string {
  return (["white", "black"] as const).map((color) =>
    MATERIAL_ROLES.map((role) => `${role}:${pos.board.pieces(color, role).size()}`).join(","),
  ).join("|");
}

function materialRoleImbalance(pos: Chess): number {
  return MATERIAL_ROLES.reduce((total, role) => total +
    Math.abs(pos.board.pieces("white", role).size() - pos.board.pieces("black", role).size()), 0);
}

function attackCount(pos: Chess, color: Color, square: Square): number {
  let count = 0;
  for (const [from, piece] of pos.board) if (piece.color === color &&
    attacks(piece, from, pos.board.occupied).has(square)) count += 1;
  return count;
}

function kingZone(king: Square): readonly Square[] {
  const result: Square[] = [];
  const file = king % 8;
  const rank = Math.floor(king / 8);
  for (let df = -1; df <= 1; df += 1) for (let dr = -1; dr <= 1; dr += 1) {
    if (df === 0 && dr === 0) continue;
    const nextFile = file + df;
    const nextRank = rank + dr;
    if (nextFile >= 0 && nextFile < 8 && nextRank >= 0 && nextRank < 8) result.push((nextRank * 8 + nextFile) as Square);
  }
  return result;
}

function kingShelterPawns(pos: Chess, color: Color): number {
  const king = pos.board.kingOf(color);
  if (king === undefined) return 0;
  const file = king % 8;
  const rank = Math.floor(king / 8);
  const forward = color === "white" ? 1 : -1;
  let count = 0;
  for (const df of [-1, 0, 1]) for (const distance of [1, 2]) {
    const nextFile = file + df;
    const nextRank = rank + forward * distance;
    if (nextFile < 0 || nextFile >= 8 || nextRank < 0 || nextRank >= 8) continue;
    const square = (nextRank * 8 + nextFile) as Square;
    if (pos.board.getColor(square) === color && pos.board.getRole(square) === "pawn") count += 1;
  }
  return count;
}

function kingZonePressure(pos: Chess, attacker: Color): number {
  const king = pos.board.kingOf(opposite(attacker));
  return king === undefined ? 0 : kingZone(king).filter((square) => attackCount(pos, attacker, square) > 0).length;
}

function defenseEdges(pos: Chess, color: Color): ReadonlyMap<string, { defender: Square; target: Square; targetRole: Role }> {
  const result = new Map<string, { defender: Square; target: Square; targetRole: Role }>();
  for (const [defender, piece] of pos.board) {
    if (piece.color !== color) continue;
    for (const target of attacks(piece, defender, pos.board.occupied)) {
      const targetPiece = pos.board.get(target);
      if (targetPiece?.color !== color) continue;
      const key = `${defender}:${piece.role}:${target}:${targetPiece.role}`;
      result.set(key, { defender, target, targetRole: targetPiece.role });
    }
  }
  return result;
}

function passPosition(after: Chess, mover: Color): Chess | undefined {
  const setup = { ...after.toSetup(), turn: mover, epSquare: undefined };
  const result = Chess.fromSetup(setup);
  return result.isOk ? result.value : undefined;
}

function defenderLossExposesExchange(beforeFen: string, afterFen: string): boolean | undefined {
  const before = position(beforeFen);
  const after = position(afterFen);
  const mover = before.turn;
  const enemy = opposite(mover);
  const oldEdges = defenseEdges(before, enemy);
  const newEdges = defenseEdges(after, enemy);
  const pass = passPosition(after, mover);
  if (pass === undefined) return undefined;
  for (const [key, lost] of oldEdges) {
    if (newEdges.has(key)) continue;
    const target = pass.board.get(lost.target);
    if (target?.color !== enemy || target.role !== lost.targetRole) continue;
    if (legalCaptureMovesTo(pass, lost.target).some((capture) => (legalExchangeForMove(pass, capture) ?? 0) > 0)) return true;
  }
  return false;
}

function gained(before: ReadonlySet<string>, after: ReadonlySet<string>): boolean {
  return [...after].some((value) => !before.has(value));
}

const PROBES: Readonly<Record<string, Probe>> = {
  pawn_contests_minor_destination: pawnContestsMinorDestination,
  majority_wing_pawn_advance: (before, uci) => majorityWingPawnAdvance(before, uci),
  blockader_placed: blockaderPlaced,
  connected_rooks_gained: (before, _uci, after) => gained(connectedRooks(position(before)), connectedRooks(position(after))),
  targeted_slider_coordination_gained: (before, _uci, after) =>
    gained(targetedSliderCoordinations(position(before)), targetedSliderCoordinations(position(after))),
  material_signature_changed: (before, _uci, after) => materialSignature(position(before)) !== materialSignature(position(after)),
  material_role_imbalance_increased: (before, _uci, after) =>
    materialRoleImbalance(position(after)) > materialRoleImbalance(position(before)),
  king_exposure_composite_gained: (before, _uci, after) => {
    const old = position(before);
    const next = position(after);
    const enemy = opposite(old.turn);
    return kingShelterPawns(next, enemy) < kingShelterPawns(old, enemy) &&
      kingZonePressure(next, old.turn) > kingZonePressure(old, old.turn);
  },
  defender_loss_exposes_exchange: (before, _uci, after) => defenderLossExposesExchange(before, after),
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

function importedRows(): readonly Row[] {
  const blocks = readFileSync(IMPORTED, "utf8").split(/\n(?=\[Event )/u);
  const accepted = new Map<string, number>();
  const rows: Row[] = [];
  const full = (): boolean => ["bullet", "blitz", "rapid"].every((time) =>
    ["1000-1399", "1400-1799", "1800-2199"].every((elo) => (accepted.get(`${time}/${elo}`) ?? 0) >= 12));
  for (const block of blocks) {
    if (full()) break;
    let game;
    try { [game] = parsePgn(block); }
    catch { continue; }
    if (game === undefined || game.headers.get("Result") === "*" ||
      game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard") continue;
    const time = speed(game.headers.get("Event") ?? "");
    const elo = band((Number(game.headers.get("WhiteElo")) + Number(game.headers.get("BlackElo"))) / 2);
    if (time === undefined || elo === undefined) continue;
    const cell = `${time}/${elo}`;
    if ((accepted.get(cell) ?? 0) >= 12) continue;
    const pos = startingPosition(game.headers).unwrap();
    const candidates: Row[] = [];
    let ply = 0;
    let legal = true;
    for (const data of game.moves.mainline()) {
      const move = parseSan(pos, data.san);
      if (move === undefined || !pos.isLegal(move)) { legal = false; break; }
      ply += 1;
      const parentFen = makeFen(pos.toSetup());
      const uci = makeUci(move);
      pos.play(move);
      if (TARGET_PLIES.has(ply)) candidates.push({ id: `${game.headers.get("Site") ?? cell}#${ply}`, parentFen, uci });
    }
    if (!legal || candidates.length === 0) continue;
    accepted.set(cell, (accepted.get(cell) ?? 0) + 1);
    rows.push(...candidates);
  }
  if (!full()) throw new Error(`imported fixture did not fill every stratum: ${JSON.stringify(Object.fromEntries(accepted))}`);
  return rows;
}

function authoredRows(): readonly Row[] {
  return transitions().map((row) => ({ id: `${row.pack}/${row.nodeId}`, parentFen: row.parentFen, uci: row.uci }));
}

interface Contribution {
  readonly played: number;
  readonly playedEligible: number;
  readonly alt: number;
  readonly alternatives: number;
}

function bootstrapLift(rows: readonly Contribution[]): readonly [number, number] {
  let state = 0x754c0de;
  const random = (): number => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
  const samples: number[] = [];
  for (let iteration = 0; iteration < 2_000; iteration += 1) {
    let played = 0;
    let alt = 0;
    let playedEligible = 0;
    let alternatives = 0;
    for (let draw = 0; draw < rows.length; draw += 1) {
      const row = rows[Math.floor(random() * rows.length)]!;
      played += row.played;
      playedEligible += row.playedEligible;
      alt += row.alt;
      alternatives += row.alternatives;
    }
    const altRate = alt / alternatives;
    if (playedEligible > 0 && altRate > 0) samples.push((played / playedEligible) / altRate);
  }
  samples.sort((left, right) => left - right);
  return [samples[Math.floor(samples.length * 0.025)]!, samples[Math.floor(samples.length * 0.975)]!];
}

function metric(rows: readonly Row[]): {
  readonly eligibleRows: number;
  readonly alternativeCount: number;
  readonly values: readonly {
    name: string; played: number; playedEligible: number; alternatives: number;
    alternativeEligible: number; playedRate: number; altRate: number;
    lift: number; interval: readonly [number, number];
  }[];
} {
  const played = new Map<string, number>();
  const playedEligible = new Map<string, number>();
  const alternatives = new Map<string, number>();
  const alternativeEligible = new Map<string, number>();
  const contributions = new Map<string, Contribution[]>();
  let eligibleRows = 0;
  let alternativeCount = 0;
  for (const row of rows) {
    const actual = playedFen(row.parentFen, row.uci);
    const alts = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== actual);
    if (alts.length === 0) continue;
    eligibleRows += 1;
    const rowPlayed = new Map<string, number>();
    const rowPlayedEligible = new Map<string, number>();
    const rowAlternatives = new Map<string, number>();
    const rowAlternativeEligible = new Map<string, number>();
    for (const [name, probe] of Object.entries(PROBES)) {
      const result = probe(row.parentFen, row.uci, actual);
      if (result === undefined) continue;
      playedEligible.set(name, (playedEligible.get(name) ?? 0) + 1);
      rowPlayedEligible.set(name, 1);
      if (result) {
        played.set(name, (played.get(name) ?? 0) + 1);
        rowPlayed.set(name, 1);
      }
    }
    for (const alt of alts) {
      alternativeCount += 1;
      for (const [name, probe] of Object.entries(PROBES)) {
        const result = probe(row.parentFen, alt.uci, alt.fen);
        if (result === undefined) continue;
        alternativeEligible.set(name, (alternativeEligible.get(name) ?? 0) + 1);
        rowAlternativeEligible.set(name, (rowAlternativeEligible.get(name) ?? 0) + 1);
        if (result) {
          alternatives.set(name, (alternatives.get(name) ?? 0) + 1);
          rowAlternatives.set(name, (rowAlternatives.get(name) ?? 0) + 1);
        }
      }
    }
    for (const name of Object.keys(PROBES)) {
      const values = contributions.get(name) ?? [];
      values.push({ played: rowPlayed.get(name) ?? 0,
        playedEligible: rowPlayedEligible.get(name) ?? 0,
        alt: rowAlternatives.get(name) ?? 0,
        alternatives: rowAlternativeEligible.get(name) ?? 0 });
      contributions.set(name, values);
    }
  }
  const values = Object.keys(PROBES).map((name) => {
    const playedCount = played.get(name) ?? 0;
    const playedDenominator = playedEligible.get(name) ?? 0;
    const altCount = alternatives.get(name) ?? 0;
    const alternativeDenominator = alternativeEligible.get(name) ?? 0;
    const playedRate = playedCount / playedDenominator;
    const altRate = altCount / alternativeDenominator;
    return { name, played: playedCount, playedEligible: playedDenominator,
      alternatives: altCount, alternativeEligible: alternativeDenominator, playedRate, altRate,
      lift: altRate === 0 ? Number.POSITIVE_INFINITY : playedRate / altRate,
      interval: bootstrapLift(contributions.get(name) ?? []) };
  }).sort((left, right) => right.lift - left.lift || left.name.localeCompare(right.name));
  return { eligibleRows, alternativeCount, values };
}

function pct(value: number): string {
  return `${(100 * value).toFixed(3)}%`;
}

describe("D754 Wave-B candidates", () => {
  it("pins contested-square, majority and blockade boundaries", () => {
    const contested = "4k3/8/5n2/8/8/8/7P/4K3 w - - 0 1";
    expect(pawnContestsMinorDestination(contested, "h2h3", playedFen(contested, "h2h3"))).toBe(true);
    const noMinor = "4k3/8/8/8/8/8/7P/4K3 w - - 0 1";
    expect(pawnContestsMinorDestination(noMinor, "h2h3", playedFen(noMinor, "h2h3"))).toBe(false);

    const majority = "4k3/pp6/8/8/8/8/PPP5/4K3 w - - 0 1";
    expect(majorityWingPawnAdvance(majority, "a2a3")).toBe(true);
    const equal = "4k3/ppp5/8/8/8/8/PPP5/4K3 w - - 0 1";
    expect(majorityWingPawnAdvance(equal, "a2a3")).toBe(false);

    const blockade = "4k3/8/3p4/8/8/2N5/8/4K3 w - - 0 1";
    expect(blockaderPlaced(blockade, "c3d5", playedFen(blockade, "c3d5"))).toBe(true);
    expect(blockaderPlaced(blockade, "c3b5", playedFen(blockade, "c3b5"))).toBe(false);
  });

  it("distinguishes generic alignment, targeted coordination and king exposure", () => {
    const rooks = "4k3/8/8/8/8/4K3/8/R2B3R w - - 0 1";
    expect(gained(connectedRooks(position(rooks)), connectedRooks(position(playedFen(rooks, "d1e2"))))).toBe(true);

    const target = "q6k/8/8/8/8/1R6/8/R5K1 w - - 0 1";
    expect(gained(targetedSliderCoordinations(position(target)),
      targetedSliderCoordinations(position(playedFen(target, "b3a3"))))).toBe(true);
    const noTarget = "7k/8/8/8/8/1R6/8/R5K1 w - - 0 1";
    expect(gained(targetedSliderCoordinations(position(noTarget)),
      targetedSliderCoordinations(position(playedFen(noTarget, "b3a3"))))).toBe(false);

    const exposure = "7k/6p1/8/8/8/6Q1/8/4K3 w - - 0 1";
    const exposedFen = playedFen(exposure, "g3g7");
    expect(kingShelterPawns(position(exposedFen), "black")).toBeLessThan(kingShelterPawns(position(exposure), "black"));
    expect(kingZonePressure(position(exposedFen), "white")).toBeGreaterThan(kingZonePressure(position(exposure), "white"));
  });

  it("requires exchange exposure beyond a lost defence edge", () => {
    const exposed = "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1";
    expect(defenderLossExposesExchange(exposed, playedFen(exposed, "c5b6"))).toBe(true);
    const notAttacked = "3rk3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1";
    expect(defenderLossExposesExchange(notAttacked, playedFen(notAttacked, "c5b6"))).toBe(false);

    const inventory = "4k3/8/8/8/8/2p5/3P4/4K3 w - - 0 1";
    expect(materialRoleImbalance(position(playedFen(inventory, "d2c3")))).toBeGreaterThan(materialRoleImbalance(position(inventory)));

    // Pass-state abstention boundary (breadth-collectors acceptance review): whenever the mover
    // still attacks the enemy king, the mover-turn clone is opposite-check-invalid, so the pass
    // device abstains rather than evaluating an exposure — the only invalidity a legal position
    // can produce under a turn flip.
    expect(passPosition(position("4k3/8/8/8/8/8/8/4R1K1 b - - 0 1"), "white")).toBeUndefined();
  });

  it("measures both populations with paired confidence", () => {
    const populations = [
      { name: "authored pack spines", rows: authoredRows() },
      { name: "sealed imported CC0 sample", rows: importedRows() },
    ];
    const lines = [
      "# D754 Wave-B output",
      "",
      "Played-vs-legal-alternative lift measures discrimination only. It does not establish usefulness, intent, strategy or move quality.",
      "",
    ];
    for (const population of populations) {
      const result = metric(population.rows);
      lines.push(`## ${population.name}`, "",
        `Source rows: ${population.rows.length}; eligible rows: ${result.eligibleRows}; alternatives: ${result.alternativeCount}.`, "",
        "| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired position bootstrap 95%) |",
        "|---|---:|---:|---:|");
      for (const value of result.values) lines.push(`| \`${value.name}\` | ${value.played} / ${value.playedEligible} / ${pct(value.playedRate)} | ${value.alternatives} / ${value.alternativeEligible} / ${pct(value.altRate)} | ${Number.isFinite(value.lift) ? `${value.lift.toFixed(2)}x (${value.interval[0].toFixed(2)}–${value.interval[1].toFixed(2)})` : "inf"} |`);
      lines.push("");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
    expect(populations[0]!.rows.length).toBeGreaterThan(500);
    expect(populations[1]!.rows.length).toBe(579);
  });
});
