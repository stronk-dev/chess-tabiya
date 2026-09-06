// DISPOSABLE research harness — D2903. Not production code.
import { createHash } from "node:crypto";

import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";

export type HumanBand = 1400 | 1800;

export interface HumanEndgameDecision {
  readonly gameHash: string;
  readonly sourceOrdinal: number;
  readonly ply: number;
  readonly fen: string;
  readonly humanMoveUci: string;
  readonly humanKingMove: boolean;
  readonly moverRating: number;
  readonly band: HumanBand;
  readonly speed: "bullet" | "blitz" | "rapid";
  readonly pieceCount: number;
}

function sha256(...values: readonly string[]): string {
  const hash = createHash("sha256");
  for (const [index, value] of values.entries()) {
    if (index > 0) hash.update("\0");
    hash.update(value);
  }
  return `sha256:${hash.digest("hex")}`;
}

function speed(event: string): HumanEndgameDecision["speed"] | undefined {
  if (/UltraBullet/iu.test(event)) return undefined;
  if (/Bullet/iu.test(event)) return "bullet";
  if (/Blitz/iu.test(event)) return "blitz";
  if (/Rapid/iu.test(event)) return "rapid";
  return undefined;
}

function band(rating: number): HumanBand | undefined {
  if (rating >= 1400 && rating <= 1799) return 1400;
  if (rating >= 1800 && rating <= 2199) return 1800;
  return undefined;
}

function rating(value: string | undefined): number | undefined {
  if (value === undefined || !/^\d+$/u.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function compareDecision(left: HumanEndgameDecision, right: HumanEndgameDecision): number {
  return left.gameHash.localeCompare(right.gameHash)
    || left.ply - right.ply
    || left.fen.localeCompare(right.fen);
}

export function humanEndgameSelectionKey(row: HumanEndgameDecision): string {
  return sha256(row.gameHash, String(row.ply), row.fen);
}

export function selectHumanEndgameDecision(block: string, sourceOrdinal: number): HumanEndgameDecision | undefined {
  const [game] = parsePgn(block);
  if (game === undefined || game.headers.get("Result") === "*"
    || (game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard")
    || game.headers.get("WhiteTitle") === "BOT" || game.headers.get("BlackTitle") === "BOT") return undefined;
  const gameSpeed = speed(game.headers.get("Event") ?? "");
  const whiteRating = rating(game.headers.get("WhiteElo"));
  const blackRating = rating(game.headers.get("BlackElo"));
  if (gameSpeed === undefined || whiteRating === undefined || blackRating === undefined) return undefined;

  const position = startingPosition(game.headers).unwrap();
  const gameHash = sha256(block);
  const candidates: Array<HumanEndgameDecision & { readonly selectionHash: string }> = [];
  let ply = 0;
  for (const data of game.moves.mainline()) {
    const move = parseSan(position, data.san);
    if (move === undefined || !position.isLegal(move)) throw new TypeError(`D2903 illegal fixture game ${sourceOrdinal}`);
    ply += 1;
    const fen = makeFen(position.toSetup());
    const moverRating = position.turn === "white" ? whiteRating : blackRating;
    const mappedBand = band(moverRating);
    const pieceCount = position.board.occupied.size();
    const movedPiece = position.board.get(move.from);
    if (ply >= 41 && pieceCount >= 3 && pieceCount <= 7 && !position.isEnd() && mappedBand !== undefined) {
      candidates.push(Object.freeze({
        gameHash,
        sourceOrdinal,
        ply,
        fen,
        humanMoveUci: makeUci(move),
        humanKingMove: movedPiece?.role === "king",
        moverRating,
        band: mappedBand,
        speed: gameSpeed,
        pieceCount,
        selectionHash: sha256(block, String(ply), fen),
      }));
    }
    position.play(move);
  }
  candidates.sort((left, right) => left.selectionHash.localeCompare(right.selectionHash));
  if (candidates[0] === undefined) return undefined;
  const { selectionHash: _, ...selected } = candidates[0];
  return Object.freeze(selected);
}

export function extractHumanEndgamePopulation(pgn: string): readonly HumanEndgameDecision[] {
  const blocks = pgn.split(/\n(?=\[Event )/u).filter((block) => block.trim().length > 0);
  const result: HumanEndgameDecision[] = [];

  for (const [sourceOrdinal, block] of blocks.entries()) {
    const selected = selectHumanEndgameDecision(block, sourceOrdinal + 1);
    if (selected !== undefined) result.push(selected);
  }

  return Object.freeze(result.sort(compareDecision));
}

export function populationCapacity(rows: readonly HumanEndgameDecision[]) {
  const band1400 = rows.filter((row) => row.band === 1400).length;
  const band1800 = rows.filter((row) => row.band === 1800).length;
  const king = rows.filter((row) => row.humanKingMove).length;
  const nonKing = rows.length - king;
  return Object.freeze({
    distinctGames: new Set(rows.map((row) => row.gameHash)).size,
    band1400,
    band1800,
    king,
    nonKing,
    preProviderSufficient: rows.length >= 30 && band1400 >= 10 && band1800 >= 10 && king >= 10 && nonKing >= 10,
  });
}

export type Distribution = ReadonlyMap<string, number>;

export function normalize(entries: Iterable<readonly [string, number]>): Distribution {
  const rows = [...entries].filter(([, value]) => Number.isFinite(value) && value > 0);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  return total === 0 ? new Map() : new Map(rows.map(([move, value]) => [move, value / total]));
}

export function reweight(base: Distribution, selected: ReadonlySet<string>, multiplier: number): Distribution {
  return normalize([...base].map(([move, mass]) => [move, mass * (selected.has(move) ? multiplier : 1)] as const));
}

export function classScores(probability: number, observed: boolean) {
  if (!(probability >= 0 && probability <= 1)) throw new TypeError("D2903 class probability must be in [0, 1]");
  const target = observed ? 1 : 0;
  const observedProbability = observed ? probability : 1 - probability;
  return Object.freeze({
    logLoss: observedProbability === 0 ? Number.POSITIVE_INFINITY : -Math.log(observedProbability),
    brier: Math.pow(probability - target, 2),
  });
}

export function exactMoveNll(distribution: Distribution, observedMove: string): number | null {
  const mass = distribution.get(observedMove);
  return mass === undefined || mass <= 0 ? null : -Math.log(mass);
}
