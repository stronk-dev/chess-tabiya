// DISPOSABLE research harness — D1162. No production policy or network calls.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Move, Role } from "chessops/types";
import { makeUci } from "chessops/util";

const EXPECTED_PGN_SHA = "a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec";
const TARGET_PLIES = new Set([8, 16, 24, 32, 40, 48]);
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];

interface SourceSfRow { readonly fen: string }

export interface TransferPosition {
  readonly id: string;
  readonly gameId: string;
  readonly fold: number;
  readonly speed: "bullet" | "blitz" | "rapid";
  readonly ratingBand: "1000-1399" | "1400-1799" | "1800-2199";
  readonly gameAverageRating: number;
  readonly moverRating: number;
  readonly ply: number;
  readonly phase: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  readonly playedUci: string;
}

function digest(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function canonicalFen(fen: string): string {
  return makeFen(Chess.fromSetup(parseFen(fen).unwrap()).unwrap().toSetup());
}

function speed(event: string): TransferPosition["speed"] | undefined {
  if (/UltraBullet/u.test(event)) return undefined;
  if (/Bullet/u.test(event)) return "bullet";
  if (/Blitz/u.test(event)) return "blitz";
  if (/Rapid/u.test(event)) return "rapid";
  return undefined;
}

function band(rating: number): TransferPosition["ratingBand"] | undefined {
  if (rating >= 1000 && rating <= 1399) return "1000-1399";
  if (rating >= 1400 && rating <= 1799) return "1400-1799";
  if (rating >= 1800 && rating <= 2199) return "1800-2199";
  return undefined;
}

export function gameFold(gameId: string): number {
  return createHash("sha256").update(gameId).digest().readUInt32BE(0) % 5;
}

export function legalUci(position: Chess): readonly string[] {
  const moves: string[] = [];
  for (const [from, dests] of position.allDests()) for (const to of dests) {
    const promotions: readonly (Role | undefined)[] = position.board.getRole(from) === "pawn" &&
      (to < 8 || to >= 56) ? PROMOTIONS : [undefined];
    for (const promotion of promotions) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (position.isLegal(move)) moves.push(makeUci(move));
    }
  }
  return moves.sort();
}

function sfFens(text: string): ReadonlySet<string> {
  return new Set(text.trim().split("\n").filter(Boolean).map((line) =>
    canonicalFen((JSON.parse(line) as SourceSfRow).fen),
  ));
}

function main(): void {
  const pgnPath = process.argv[2];
  const firstScreenSfPath = process.argv[3];
  const outputPath = process.argv[4];
  if (pgnPath === undefined || firstScreenSfPath === undefined || outputPath === undefined) {
    throw new Error("usage: extract <imported-sample.pgn> <first-screen-sf.jsonl> <output.json>");
  }

  const pgn = readFileSync(pgnPath, "utf8");
  if (digest(pgn) !== EXPECTED_PGN_SHA) throw new Error("R2 imported fixture digest changed");
  const firstSf = readFileSync(firstScreenSfPath, "utf8");
  const firstFens = sfFens(firstSf);
  const blocks = pgn.split(/\n(?=\[Event )/u);
  const accepted = new Map<string, number>();
  const raw: TransferPosition[] = [];
  const full = (): boolean => ["bullet", "blitz", "rapid"].every((time) =>
    ["1000-1399", "1400-1799", "1800-2199"].every((elo) =>
      (accepted.get(`${time}/${elo}`) ?? 0) >= 12));

  for (const block of blocks) {
    if (full()) break;
    let game;
    try { [game] = parsePgn(block); } catch { continue; }
    if (game === undefined || game.headers.get("Result") === "*" ||
      game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard") continue;
    const time = speed(game.headers.get("Event") ?? "");
    const white = Number(game.headers.get("WhiteElo"));
    const black = Number(game.headers.get("BlackElo"));
    const average = (white + black) / 2;
    const ratingBand = band(average);
    if (time === undefined || ratingBand === undefined) continue;
    const stratum = `${time}/${ratingBand}`;
    if ((accepted.get(stratum) ?? 0) >= 12) continue;

    const gameId = game.headers.get("Site") ?? `sha256:${digest(block)}`;
    const position: Chess = startingPosition(game.headers).unwrap();
    const candidates: TransferPosition[] = [];
    let ply = 0;
    let complete = true;
    for (const data of game.moves.mainline()) {
      const move = parseSan(position, data.san);
      if (move === undefined || !position.isLegal(move)) { complete = false; break; }
      ply += 1;
      if (TARGET_PLIES.has(ply)) {
        const fen = makeFen(position.toSetup());
        const legal = legalUci(position);
        const playedUci = makeUci(move);
        if (!legal.includes(playedUci)) throw new Error(`played move absent from legal set: ${gameId}#${String(ply)}`);
        candidates.push({
          id: `${gameId}#${String(ply)}`,
          gameId,
          fold: gameFold(gameId),
          speed: time,
          ratingBand,
          gameAverageRating: average,
          moverRating: position.turn === "white" ? white : black,
          ply,
          phase: `ply-${String(ply)}`,
          fen,
          pieceCount: position.board.occupied.size(),
          legalUci: legal,
          playedUci,
        });
      }
      position.play(move);
    }
    if (!complete || candidates.length === 0) continue;
    accepted.set(stratum, (accepted.get(stratum) ?? 0) + 1);
    raw.push(...candidates);
  }
  if (!full()) throw new Error(`fixture did not fill every stratum: ${JSON.stringify(Object.fromEntries(accepted))}`);

  const frequencies = new Map<string, number>();
  for (const row of raw) frequencies.set(row.fen, (frequencies.get(row.fen) ?? 0) + 1);
  const duplicateFens = new Set([...frequencies].filter(([, count]) => count > 1).map(([fen]) => fen));
  const positions = raw.filter((row) => !duplicateFens.has(row.fen) && !firstFens.has(row.fen));
  if (new Set(positions.map((row) => row.fen)).size !== positions.length) throw new Error("duplicate FEN survived exclusion");

  const output = {
    schema: "tabiya.research.d1162-independent-population.v1",
    source: {
      pgnSha256: `sha256:${digest(pgn)}`,
      firstScreenSfSha256: `sha256:${digest(firstSf)}`,
      games: Object.fromEntries([...accepted].sort()),
      targetPlies: [...TARGET_PLIES],
    },
    exclusions: {
      rawDecisions: raw.length,
      duplicateFenIdentities: duplicateFens.size,
      duplicateDecisions: raw.filter((row) => duplicateFens.has(row.fen)).length,
      firstScreenOverlap: raw.filter((row) => !duplicateFens.has(row.fen) && firstFens.has(row.fen)).length,
    },
    positions,
  };
  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  process.stderr.write(`retained ${String(positions.length)} of ${String(raw.length)} decisions across ${String(new Set(positions.map((row) => row.gameId)).size)} games\n`);
}

main();
