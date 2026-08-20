// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

import type { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import { Chess as StandardChess } from "chessops/chess";
import { describe, expect, it } from "vitest";

const SOURCE = process.env.TABIYA_R12_PGN ?? "/private/tmp/r12-style-prefix-2g.pgn";
const CANDIDATES = "/private/tmp/r12-candidate-metrics.json";
const OUTPUT = "/private/tmp/r12-opening-reference.json";

interface Counts { total: number; moves: Record<string, number> }

function positionKey(pos: Chess): string {
  return makeFen(pos.toSetup()).split(" ", 4).join(" ");
}

function band(rating: number): string | undefined {
  if (rating >= 1000 && rating <= 1399) return "1000-1399";
  if (rating >= 1400 && rating <= 1799) return "1400-1799";
  if (rating >= 1800 && rating <= 2199) return "1800-2199";
  return undefined;
}

function headerValue(line: string): string {
  return line.slice(line.indexOf('"') + 1, line.lastIndexOf('"'));
}

function firstSans(movetext: string): string[] {
  return movetext
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .split(/\s+/)
    .filter((token) => token !== "" && !/^\d+\.(?:\.\.)?$/.test(token)
      && !/^\$\d+$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token))
    .slice(0, 8);
}

describe("R12 opening reference population", () => {
  it("counts candidate opening decisions in the frozen same-band population", async () => {
    const candidates = JSON.parse(readFileSync(CANDIDATES, "utf8"));
    const wanted = new Set<string>(candidates.selected.flatMap((account: { games: { opening: { key: string }[] }[] }) =>
      account.games.flatMap((game) => game.opening.map((row) => row.key))
    ));
    const counts = new Map<string, Record<string, Counts>>();
    let headers = new Map<string, string>();
    let movetext: string[] = [];
    let inMoves = false;
    let hasTenBlack = false;
    let eligibleGames = 0;
    let parsedGames = 0;

    const finish = (): void => {
      if (headers.size === 0 || movetext.length === 0) return;
      if (headers.get("Event") !== "Rated Blitz game") return;
      if (headers.has("Variant") && headers.get("Variant") !== "Standard") return;
      if (!["1-0", "0-1", "1/2-1/2"].includes(headers.get("Result") ?? "")) return;
      if (!hasTenBlack) return;
      const ratings = { white: Number(headers.get("WhiteElo")), black: Number(headers.get("BlackElo")) };
      if (!Number.isFinite(ratings.white) || !Number.isFinite(ratings.black)) return;
      const sans = firstSans(movetext.join(" "));
      if (sans.length < 8) return;
      eligibleGames += 1;
      const pos = StandardChess.default();
      for (const san of sans) {
        const move = parseSan(pos, san);
        if (move === undefined || !pos.isLegal(move)) return;
        const key = positionKey(pos);
        if (wanted.has(key)) {
          const ratingBand = band(ratings[pos.turn]);
          if (ratingBand !== undefined) {
            const byBand = counts.get(key) ?? {};
            const row = byBand[ratingBand] ?? { total: 0, moves: {} };
            const uci = makeUci(move);
            row.total += 1;
            row.moves[uci] = (row.moves[uci] ?? 0) + 1;
            byBand[ratingBand] = row;
            counts.set(key, byBand);
          }
        }
        pos.play(move);
      }
      parsedGames += 1;
    };

    const lines = createInterface({ input: createReadStream(SOURCE), crlfDelay: Infinity });
    for await (const line of lines) {
      if (line.startsWith('[Event "') && (headers.size > 0 || movetext.length > 0)) {
        finish();
        headers = new Map();
        movetext = [];
        inMoves = false;
        hasTenBlack = false;
      }
      if (!inMoves && line.startsWith("[")) {
        const space = line.indexOf(" ");
        if (space > 1) headers.set(line.slice(1, space), headerValue(line));
      } else if (!inMoves && line === "" && headers.size > 0) {
        inMoves = true;
      } else if (inMoves && line !== "") {
        if (/(?:^|\s)10\.\.\./.test(line)) hasTenBlack = true;
        if (firstSans(movetext.join(" ")).length < 8) movetext.push(line);
      }
    }
    // The trailing partial game is deliberately omitted.
    const serializable = Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(OUTPUT, `${JSON.stringify({ eligibleGames, parsedGames, wantedPositions: wanted.size, counts: serializable })}\n`);
    const covered = [...wanted].filter((key) => counts.has(key)).length;
    console.log(JSON.stringify({ eligibleGames, parsedGames, wantedPositions: wanted.size, covered }, null, 2));
    expect(eligibleGames).toBeGreaterThan(2_000_000);
    expect(parsedGames).toBeGreaterThan(2_000_000);
    expect(covered / wanted.size).toBeGreaterThan(0.99);
  });
});
