// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { bishopAttacks } from "chessops/attacks";
import type { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition, type PgnNodeData } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Color, Move, Role, Square } from "chessops/types";
import { makeUci, parseSquare } from "chessops/util";
import { describe, expect, it } from "vitest";

import { classifyPhase } from "../../packages/runtime/src/phase.js";

const SOURCE = process.env.TABIYA_R12_CANDIDATES ?? "/private/tmp/r12-candidate-games.pgn";
const POPULATION = "/private/tmp/r12-population.json";
const OUTPUT = "/private/tmp/r12-candidate-metrics.json";
const CENTER = new Set(["c4", "d4", "e4", "f4", "c5", "d5", "e5", "f5"].map((s) => parseSquare(s)!));
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];

interface SumCount { sum: number; n: number }
interface OpeningDecision { key: string; uci: string; band: string; ply: number }
interface GameMetric {
  site: string;
  color: Color;
  rating: number;
  eco?: string;
  opening: OpeningDecision[];
  pairs: Record<string, SumCount>;
  trace: { ply: number; san: string; uci: string; values: Record<string, number> }[];
}

interface AccountData {
  key: string;
  username: string;
  band: string;
  candidateRank: number;
  medianRating: number;
  games: GameMetric[];
  validAppearances: number;
  invalidAppearances: number;
}

interface FianchettoConfig {
  bishop: Square;
  pawn: Square;
  screen: Square;
}

const CONFIGS: Readonly<Record<Color, readonly FianchettoConfig[]>> = {
  white: [
    { bishop: parseSquare("b2")!, pawn: parseSquare("b3")!, screen: parseSquare("c3")! },
    { bishop: parseSquare("g2")!, pawn: parseSquare("g3")!, screen: parseSquare("f3")! },
  ],
  black: [
    { bishop: parseSquare("b7")!, pawn: parseSquare("b6")!, screen: parseSquare("c6")! },
    { bishop: parseSquare("g7")!, pawn: parseSquare("g6")!, screen: parseSquare("f6")! },
  ],
};

function pair(record: Record<string, SumCount>, key: string): SumCount {
  return record[key] ??= { sum: 0, n: 0 };
}

function add(record: Record<string, SumCount>, key: string, value: number): void {
  const target = pair(record, key);
  target.sum += value;
  target.n += 1;
}

function positionKey(pos: Chess): string {
  return makeFen(pos.toSetup()).split(" ", 4).join(" ");
}

function ratingBand(rating: number): string | undefined {
  if (rating >= 1000 && rating <= 1399) return "1000-1399";
  if (rating >= 1400 && rating <= 1799) return "1400-1799";
  if (rating >= 1800 && rating <= 2199) return "1800-2199";
  return undefined;
}

function hasSetup(pos: Chess, color: Color, config: FianchettoConfig): boolean {
  return pos.board.get(config.bishop)?.role === "bishop"
    && pos.board.get(config.bishop)?.color === color
    && pos.board.get(config.pawn)?.role === "pawn"
    && pos.board.get(config.pawn)?.color === color;
}

function hasScreen(pos: Chess, color: Color, config: FianchettoConfig): boolean {
  return hasSetup(pos, color, config)
    && pos.board.get(config.screen)?.role === "knight"
    && pos.board.get(config.screen)?.color === color;
}

function fianchettoState(pos: Chess, color: Color): { setup: boolean; screen: boolean } {
  return {
    setup: CONFIGS[color].some((config) => hasSetup(pos, color, config)),
    screen: CONFIGS[color].some((config) => hasScreen(pos, color, config)),
  };
}

function legalMoves(pos: Chess): Move[] {
  const moves: Move[] = [];
  for (const [from, dests] of pos.allDests()) {
    for (const to of dests) {
      const roles = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
        ? PROMOTIONS
        : [undefined];
      for (const promotion of roles) {
        const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
        if (pos.isLegal(move)) moves.push(move);
      }
    }
  }
  return moves;
}

function captureRole(pos: Chess, move: Move): Role | undefined {
  if (!("from" in move)) return undefined;
  const target = pos.board.get(move.to);
  if (target !== undefined) return target.role;
  const mover = pos.board.get(move.from);
  return mover?.role === "pawn" && pos.epSquare === move.to ? "pawn" : undefined;
}

function replyCount(pos: Chess): number {
  let count = 0;
  for (const [from, dests] of pos.allDests()) {
    const promotion = pos.board.getRole(from) === "pawn";
    for (const to of dests) count += promotion && (to < 8 || to >= 56) ? 4 : 1;
  }
  return count;
}

function moveEvents(pos: Chess, move: Move, ply: number, phase: string): Record<string, number> {
  if (!("from" in move)) throw new Error("standard chess cannot contain drops");
  const role = pos.board.getRole(move.from);
  const captured = captureRole(pos, move);
  const next = pos.clone();
  next.play(move);
  return {
    pawn_choice_residual: role === "pawn" ? 1 : 0,
    forcing_choice_residual: captured !== undefined || next.isCheck() ? 1 : 0,
    center_pawn_choice_residual: role === "pawn" && CENTER.has(move.to) ? 1 : 0,
    early_queen_choice_residual: ply < 16 && role === "queen" ? 1 : 0,
    nonpawn_capture_residual: phase !== "endgame" && captured !== undefined && captured !== "pawn" ? 1 : 0,
    reply: replyCount(next),
  };
}

function clockSeconds(data: PgnNodeData): number | undefined {
  const text = data.comments?.join(" ") ?? "";
  const match = /\[%clk\s+(\d+):(\d{2}):(\d{2}(?:\.\d+)?)\]/.exec(text);
  if (match === null) return undefined;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function timeControl(raw: string | undefined): { base: number; increment: number } | undefined {
  const match = /^(\d+)\+(\d+)$/.exec(raw ?? "");
  return match === null ? undefined : { base: Number(match[1]), increment: Number(match[2]) };
}

function pseudonym(key: string): string {
  return createHash("sha256").update(`tabiya-r12-v1:${key}`).digest("hex").slice(0, 12);
}

function accountRegistry(): { accounts: Map<string, AccountData>; order: Record<string, string[]> } {
  const population = JSON.parse(readFileSync(POPULATION, "utf8"));
  const accounts = new Map<string, AccountData>();
  const order: Record<string, string[]> = {};
  for (const band of population.candidates) {
    order[band.band] = [];
    band.accounts.forEach((candidate: { key: string; username: string; medianRating: number }, index: number) => {
      accounts.set(candidate.key, {
        ...candidate,
        band: band.band,
        candidateRank: index + 1,
        games: [],
        validAppearances: 0,
        invalidAppearances: 0,
      });
      order[band.band].push(candidate.key);
    });
  }
  return { accounts, order };
}

function emptyMetric(site: string, color: Color, rating: number, eco: string | undefined): GameMetric {
  return { site, color, rating, eco, opening: [], pairs: {}, trace: [] };
}

function measureSide(
  color: Color,
  rating: number,
  eco: string | undefined,
  site: string,
  nodes: readonly PgnNodeData[],
  moves: readonly Move[],
  initial: Chess,
  tc: { base: number; increment: number } | undefined,
): GameMetric {
  const metric = emptyMetric(site, color, rating, eco);
  const pos = initial.clone();
  const clocks: Record<Color, number | undefined> = { white: tc?.base, black: tc?.base };
  let setupEver = false;
  let screenEver = false;
  let castled: "k" | "q" | undefined;

  for (let ply = 0; ply < moves.length; ply += 1) {
    const move = moves[ply]!;
    const data = nodes[ply]!;
    const mover = pos.turn;
    const state = fianchettoState(pos, color);
    setupEver ||= state.setup;
    screenEver ||= state.screen;
    const phase = classifyPhase(makeFen(pos.toSetup())).phase;

    if (mover === color) {
      const traceValues: Record<string, number> = {};
      if (ply < 8) {
        const band = ratingBand(rating);
        if (band !== undefined) metric.opening.push({ key: positionKey(pos), uci: makeUci(move), band, ply });
      }
      const alternatives = legalMoves(pos);
      const rows = alternatives.map((candidate) => moveEvents(pos, candidate, ply, phase));
      const playedUci = makeUci(move);
      const playedIndex = alternatives.findIndex((candidate) => makeUci(candidate) === playedUci);
      if (playedIndex < 0) throw new Error(`played move absent from legal alternatives: ${data.san}`);
      for (const key of [
        "pawn_choice_residual",
        "forcing_choice_residual",
        "center_pawn_choice_residual",
        "early_queen_choice_residual",
        "nonpawn_capture_residual",
      ]) {
        if (key === "early_queen_choice_residual" && ply >= 16) continue;
        const share = rows.reduce((sum, row) => sum + row[key]!, 0) / rows.length;
        const value = rows[playedIndex]![key]! - share;
        add(metric.pairs, key, value);
        traceValues[key] = value;
      }
      const replies = rows.map((row) => row.reply!);
      const mean = replies.reduce((a, b) => a + b, 0) / replies.length;
      const variance = replies.reduce((sum, value) => sum + (value - mean) ** 2, 0) / replies.length;
      if (variance > 0) {
        const value = (replies[playedIndex]! - mean) / Math.sqrt(variance);
        add(metric.pairs, "opponent_reply_breadth_residual", value);
        traceValues.opponent_reply_breadth_residual = value;
      }

      const screened = CONFIGS[color].filter((config) => hasScreen(pos, color, config));
      if (screened.length > 0) {
        const next = pos.clone();
        next.play(move);
        const unblocked = screened.some((config) => "from" in move && move.from === config.screen
          && bishopAttacks(config.bishop, next.board.occupied).size() > bishopAttacks(config.bishop, pos.board.occupied).size());
        add(metric.pairs, "fianchetto_unblock_rate", unblocked ? 1 : 0);
        traceValues.fianchetto_unblock_rate = unblocked ? 1 : 0;
      }
      if (data.san.startsWith("O-O-O")) castled = "q";
      else if (data.san.startsWith("O-O")) castled = "k";

      const current = clockSeconds(data);
      const previous = clocks[color];
      if (tc !== undefined && current !== undefined && previous !== undefined) {
        const available = previous + tc.increment;
        if (available > 0 && current <= available) {
          if (phase !== "unclear") {
            const value = (available - current) / available;
            add(metric.pairs, `clock_spend_share:${phase}`, value);
            traceValues[`clock_spend_share:${phase}`] = value;
          }
        }
      }
      metric.trace.push({ ply, san: data.san, uci: makeUci(move), values: traceValues });
    }
    const current = clockSeconds(data);
    clocks[mover] = current;
    pos.play(move);
    const after = fianchettoState(pos, color);
    setupEver ||= after.setup;
    screenEver ||= after.screen;
  }
  add(metric.pairs, "fianchetto_setup_rate", setupEver ? 1 : 0);
  add(metric.pairs, "fianchetto_knight_screen_rate", screenEver ? 1 : 0);
  add(metric.pairs, "castle_kingside_rate", castled === "k" ? 1 : 0);
  add(metric.pairs, "castle_queenside_rate", castled === "q" ? 1 : 0);
  return metric;
}

describe("R12 candidate-game measurement", () => {
  it("recognizes the literal fianchetto screen and unblock", () => {
    const [game] = parsePgn("1. g3 d5 2. Bg2 e5 3. Nf3 Nc6 4. Nh4 *");
    const pos = startingPosition(game!.headers).unwrap() as Chess;
    const nodes = [...game!.moves.mainline()];
    for (let i = 0; i < 6; i += 1) pos.play(parseSan(pos, nodes[i]!.san)!);
    expect(fianchettoState(pos, "white")).toEqual({ setup: true, screen: true });
    const move = parseSan(pos, nodes[6]!.san)!;
    const config = CONFIGS.white[1]!;
    const before = bishopAttacks(config.bishop, pos.board.occupied).size();
    pos.play(move);
    expect(bishopAttacks(config.bishop, pos.board.occupied).size()).toBeGreaterThan(before);

    for (const [san, expected] of [["Nh4", 1], ["d3", 0]] as const) {
      const [sample] = parsePgn(`1. g3 d5 2. Bg2 e5 3. Nf3 Nc6 4. ${san} *`);
      const initial = startingPosition(sample!.headers).unwrap() as Chess;
      const sampleNodes = [...sample!.moves.mainline()];
      const samplePos = initial.clone();
      const sampleMoves = sampleNodes.map((node) => {
        const parsed = parseSan(samplePos, node.san)!;
        samplePos.play(parsed);
        return parsed;
      });
      expect(measureSide("white", 1500, "A00", "synthetic", sampleNodes, sampleMoves, initial, undefined).pairs.fianchetto_unblock_rate).toEqual({ sum: expected, n: 1 });
    }
  });

  it("guards promotion, forcing, capture and clock arithmetic", () => {
    const promotion = startingPosition(parsePgn('[SetUp "1"]\n[FEN "7k/P7/8/8/8/8/8/7K w - - 0 1"]\n\n1. a8=Q+ *')[0]!.headers).unwrap() as Chess;
    expect(legalMoves(promotion).filter((move) => "from" in move && move.from === parseSquare("a7")).map(makeUci).sort()).toEqual([
      "a7a8b", "a7a8n", "a7a8q", "a7a8r",
    ]);
    const capture = startingPosition(parsePgn('[SetUp "1"]\n[FEN "7k/8/8/8/8/8/1r6/KQ6 w - - 0 1"]\n\n1. Qxb2 *')[0]!.headers).unwrap() as Chess;
    const move = parseSan(capture, "Qxb2")!;
    expect(captureRole(capture, move)).toBe("rook");
    expect(moveEvents(capture, move, 0, "middlegame").forcing_choice_residual).toBe(1);
    expect(clockSeconds({ san: "e4", comments: ["[%clk 0:02:59.5]"] })).toBe(179.5);
    expect(timeControl("180+2")).toEqual({ base: 180, increment: 2 });
  });

  it("extracts 200 legal games for the frozen cohorts and records grounded atoms", () => {
    const { accounts, order } = accountRegistry();
    const games = parsePgn(readFileSync(SOURCE, "utf8"));
    let invalidGames = 0;
    for (const game of games) {
      const whiteKey = (game.headers.get("White") ?? "").toLocaleLowerCase("en-US");
      const blackKey = (game.headers.get("Black") ?? "").toLocaleLowerCase("en-US");
      const targets = ([
        ["white", whiteKey, Number(game.headers.get("WhiteElo"))],
        ["black", blackKey, Number(game.headers.get("BlackElo"))],
      ] as const).filter(([, key]) => accounts.has(key) && accounts.get(key)!.games.length < 200);
      if (targets.length === 0) continue;
      const nodes = [...game.moves.mainline()];
      let initial: Chess;
      try {
        initial = startingPosition(game.headers).unwrap() as Chess;
      } catch {
        invalidGames += 1;
        targets.forEach(([, key]) => { accounts.get(key)!.invalidAppearances += 1; });
        continue;
      }
      const validation = initial.clone();
      const moves: Move[] = [];
      let valid = nodes.length >= 20;
      for (const node of nodes) {
        const move = parseSan(validation, node.san);
        if (move === undefined || !validation.isLegal(move)) { valid = false; break; }
        moves.push(move);
        validation.play(move);
      }
      if (!valid) {
        invalidGames += 1;
        targets.forEach(([, key]) => { accounts.get(key)!.invalidAppearances += 1; });
        continue;
      }
      const tc = timeControl(game.headers.get("TimeControl"));
      const eco = game.headers.get("ECO");
      const site = game.headers.get("Site") ?? "";
      for (const [color, key, rating] of targets) {
        const account = accounts.get(key)!;
        account.validAppearances += 1;
        account.games.push(measureSide(color, rating, eco, site, nodes, moves, initial, tc));
      }
    }

    const selected: AccountData[] = [];
    const shortfalls: Record<string, number> = {};
    for (const [band, keys] of Object.entries(order)) {
      const eligible = keys.map((key) => accounts.get(key)!).filter((account) => account.games.length >= 200);
      shortfalls[band] = eligible.length;
      selected.push(...eligible.slice(0, 12));
    }
    const raw = {
      sourceGames: games.length,
      invalidGames,
      shortfalls,
      selected: selected.map((account) => ({
        id: pseudonym(account.key),
        key: account.key,
        band: account.band,
        candidateRank: account.candidateRank,
        medianRating: account.medianRating,
        games: account.games.slice(0, 200),
      })),
    };
    writeFileSync(OUTPUT, `${JSON.stringify(raw)}\n`);
    console.log(JSON.stringify({
      sourceGames: games.length,
      invalidGames,
      shortfalls,
      selected: raw.selected.length,
      tracedDecisions: raw.selected.reduce((sum, account) => sum + account.games.reduce((gameSum, game) => gameSum + game.trace.length, 0), 0),
      openingPositions: new Set(raw.selected.flatMap((account) => account.games.flatMap((game) => game.opening.map((row) => row.key)))).size,
    }, null, 2));
    expect(Object.values(shortfalls).every((count) => count >= 8)).toBe(true);
    expect(selected).toHaveLength(36);
    expect(selected.every((account) => account.games.length === 200)).toBe(true);
  });
});
