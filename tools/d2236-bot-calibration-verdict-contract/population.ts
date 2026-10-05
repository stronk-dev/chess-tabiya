// Disposable D3406/D2236 research instrument. No engine calls, fitted model or bot verdict.
import { createHash } from "node:crypto";
import { StringDecoder } from "node:string_decoder";

import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";

export interface HumanReference {
  readonly bands: readonly { id: string; min: number; max: number }[];
  readonly windows: readonly { id: string; minPly: number; maxPly: number | null }[];
  readonly decisionsPerBandWindow: number;
}

export interface HumanDecision {
  readonly gameHash: string;
  readonly selectionHash: string;
  readonly referenceHalf: 0 | 1;
  readonly band: string;
  readonly window: string;
  readonly ply: number;
  readonly fen: string;
  readonly moveUci: string;
}

export const digest = (bytes: string | Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

/** Keep the smallest k keys without repeatedly sorting k rows for every source decision. */
export class Smallest<T extends { selectionHash: string }> {
  private readonly heap: T[] = [];
  constructor(private readonly limit: number) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new TypeError("invalid population limit");
  }
  add(value: T): void {
    if (this.heap.length === this.limit) {
      if (value.selectionHash >= this.heap[0]!.selectionHash) return;
      this.heap[0] = value;
      let parent = 0;
      while (true) {
        const left = parent * 2 + 1;
        const right = left + 1;
        if (left >= this.heap.length) break;
        const child = right < this.heap.length && this.heap[right]!.selectionHash > this.heap[left]!.selectionHash ? right : left;
        if (this.heap[parent]!.selectionHash >= this.heap[child]!.selectionHash) break;
        [this.heap[parent], this.heap[child]] = [this.heap[child]!, this.heap[parent]!];
        parent = child;
      }
    } else {
      this.heap.push(value);
      let child = this.heap.length - 1;
      while (child > 0) {
        const parent = Math.floor((child - 1) / 2);
        if (this.heap[parent]!.selectionHash >= this.heap[child]!.selectionHash) break;
        [this.heap[parent], this.heap[child]] = [this.heap[child]!, this.heap[parent]!];
        child = parent;
      }
    }
  }
  rows(): readonly T[] {
    return [...this.heap].sort((a, b) => a.selectionHash < b.selectionHash ? -1 : a.selectionHash > b.selectionHash ? 1 : 0);
  }
}

/** Hash the literal block, including its line endings. Invalid games contribute no prefix. */
export function gameDecisions(block: string, reference: HumanReference): readonly HumanDecision[] {
  const games = parsePgn(block);
  if (games.length !== 1) throw new TypeError("expected one PGN game");
  const game = games[0]!;
  // chessops projects the movetext terminator into Result. Do not let a completed terminator
  // overwrite an unfinished/missing/contradictory source header and admit a different population.
  const resultHeaders = [...block.matchAll(/^\[Result "([^"]*)"\]\r?$/gmu)];
  const rawResult = resultHeaders[0]?.[1];
  if (!/^Rated Blitz game(?:\s|$)/u.test(game.headers.get("Event") ?? "")
    || resultHeaders.length !== 1 || !["1-0", "0-1", "1/2-1/2"].includes(rawResult ?? "")
    || rawResult !== game.headers.get("Result")
    || (game.headers.has("Variant") && game.headers.get("Variant") !== "Standard")
    || game.headers.get("WhiteTitle") === "BOT" || game.headers.get("BlackTitle") === "BOT") return [];
  const white = game.headers.get("WhiteElo") ?? "";
  const black = game.headers.get("BlackElo") ?? "";
  if (!/^\d+$/u.test(white) || !/^\d+$/u.test(black)) return [];
  const ratings = { white: Number(white), black: Number(black) };
  if (!Number.isSafeInteger(ratings.white) || !Number.isSafeInteger(ratings.black)) return [];
  const position = startingPosition(game.headers).unwrap();
  if (position.rules !== "chess") throw new TypeError("non-standard starting position");
  const gameDigest = createHash("sha256").update(block);
  const gameHash = `sha256:${gameDigest.copy().digest("hex")}`;
  const referenceHalf = (gameDigest.copy().digest()[0]! % 2) as 0 | 1;
  const windows = new Map<string, HumanDecision>();
  let ply = 0;
  for (const data of game.moves.mainline()) {
    const move = parseSan(position, data.san);
    if (move === undefined || !position.isLegal(move)) throw new TypeError("illegal PGN replay");
    ply += 1;
    const window = reference.windows.find((row) => ply >= row.minPly && (row.maxPly === null || ply <= row.maxPly));
    const rating = ratings[position.turn];
    const band = reference.bands.find((row) => rating >= row.min && rating <= row.max);
    if (window !== undefined && band !== undefined) {
      const selectionHash = `sha256:${gameDigest.copy().update("\0").update(String(ply)).digest("hex")}`;
      const existing = windows.get(window.id);
      if (existing === undefined || selectionHash < existing.selectionHash) windows.set(window.id, {
        gameHash, selectionHash, referenceHalf, band: band.id, window: window.id, ply,
        fen: makeFen(position.toSetup()), moveUci: makeUci(move),
      });
    }
    position.play(move);
  }
  return [...windows.values()];
}

/** Exact source bytes; frame boundaries/newlines/UTF-8 chunk boundaries cannot change identity. */
export async function selectReference(chunks: AsyncIterable<Uint8Array>, reference: HumanReference) {
  const hash = createHash("sha256");
  const decoder = new StringDecoder("utf8");
  const cells = reference.bands.flatMap((band) => reference.windows.map((window) => `${band.id}/${window.id}`));
  const selected = new Map(cells.map((cell) => [cell, new Smallest<HumanDecision>(reference.decisionsPerBandWindow)]));
  const eligible = Object.fromEntries(cells.map((cell) => [cell, 0]));
  const seenGames = new Set<string>();
  let bytes = 0;
  let lineBuffer = "";
  let block = "";
  let completeBlocks = 0;
  let rejectedGames = 0;
  let duplicateGames = 0;
  const consume = (): void => {
    completeBlocks += 1;
    try {
      const rows = gameDecisions(block, reference);
      if (rows.length === 0) { rejectedGames += 1; return; }
      if (seenGames.has(rows[0]!.gameHash)) { duplicateGames += 1; return; }
      seenGames.add(rows[0]!.gameHash);
      for (const row of rows) {
        const cell = `${row.band}/${row.window}`;
        eligible[cell]! += 1;
        selected.get(cell)!.add(row);
      }
    } catch { rejectedGames += 1; }
  };
  const line = (value: string): void => {
    if (value.startsWith("[Event ") && block.length > 0) { consume(); block = ""; }
    block += value;
  };
  for await (const chunk of chunks) {
    hash.update(chunk);
    bytes += chunk.byteLength;
    lineBuffer += decoder.write(Buffer.from(chunk));
    let index: number;
    let offset = 0;
    while ((index = lineBuffer.indexOf("\n", offset)) !== -1) {
      line(lineBuffer.slice(offset, index + 1));
      offset = index + 1;
    }
    lineBuffer = lineBuffer.slice(offset);
  }
  lineBuffer += decoder.end();
  // This is a frozen compressed prefix, not a full PGN export: always discard its final block.
  const rows = cells.flatMap((cell) => selected.get(cell)!.rows());
  const capacity = cells.map((cell) => ({ cell, eligible: eligible[cell], selected: selected.get(cell)!.rows().length }));
  return {
    decompressedSha256: `sha256:${hash.digest("hex")}`, decompressedBytes: bytes,
    completeBlocks, rejectedGames, duplicateGames, trailingPartialBlocksDropped: 1,
    capacity, complete: capacity.every((cell) => cell.selected === reference.decisionsPerBandWindow), rows,
  };
}

export function assertReference(result: Awaited<ReturnType<typeof selectReference>>, expectedDigest: string): void {
  if (result.decompressedSha256 !== expectedDigest) throw new TypeError("decompressed source digest mismatch");
  if (!result.complete) throw new TypeError("incomplete human-reference cells");
  const identities = result.rows.map((row) => `${row.gameHash}/${row.window}`);
  if (new Set(identities).size !== identities.length) throw new TypeError("duplicate game/window observation");
}
