// DISPOSABLE research builder — platform-alignment R11. Not production code.
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { createInterface } from "node:readline";

import { Chess } from "../../apps/server/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../apps/server/node_modules/chessops/dist/esm/fen.js";
import { parseSan } from "../../apps/server/node_modules/chessops/dist/esm/san.js";
import { makeUci } from "../../apps/server/node_modules/chessops/dist/esm/util.js";

const ROOT = new URL("../../", import.meta.url).pathname;
const SOURCE = process.env.TABIYA_R11_BOOK_PGN ?? "/private/tmp/tabiya-games-head.pgn";
const OUTPUT = process.env.TABIYA_R11_BOOK_OUT ?? "/private/tmp/r11-local-book.json";
const MAX_PLY = Number(process.env.TABIYA_R11_BOOK_MAX_PLY ?? 24);
const PACK_FILES = ["anti-caro-advance-early-c5.json", "najdorf-english-attack-black.json"];

function positionKey(position: Chess): string {
  return makeFen(position.toSetup()).split(" ", 4).join(" ");
}
function headerValue(line: string): string { return line.slice(line.indexOf('"') + 1, line.lastIndexOf('"')); }
function sans(text: string): string[] {
  return text.replace(/\{[^}]*\}/g, " ").replace(/\([^)]*\)/g, " ").split(/\s+/)
    .filter((token) => token !== "" && !/^\d+\.(?:\.\.)?$/.test(token) && !/^\$\d+$/.test(token)
      && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token))
    .slice(0, MAX_PLY);
}

const roots = new Map<string, string>();
for (const file of PACK_FILES) {
  const pack = JSON.parse(await readFile(`${ROOT}/content/drafts/${file}`, "utf8"));
  const position = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  roots.set(positionKey(position), pack.id);
}

const counts = new Map<string, { total: number; moves: Record<string, number>; roots: Set<string> }>();
let headers = new Map<string, string>();
let movetext: string[] = [];
let inMoves = false;
let parsedGames = 0;
let eligibleGames = 0;
let gamesReachingRoot = 0;

function finish(): void {
  if (headers.size === 0 || movetext.length === 0) return;
  if (headers.get("Event") !== "Rated Blitz game") return;
  if (headers.has("Variant") && headers.get("Variant") !== "Standard") return;
  const whiteElo = Number(headers.get("WhiteElo"));
  const blackElo = Number(headers.get("BlackElo"));
  if (![whiteElo, blackElo].every(Number.isFinite)) return;
  eligibleGames += 1;
  const position = Chess.default();
  let reached: string | undefined;
  for (const san of sans(movetext.join(" "))) {
    const move = parseSan(position, san);
    if (move === undefined || !position.isLegal(move)) return;
    const key = positionKey(position);
    reached ??= roots.get(key);
    if (reached !== undefined) {
      const movingRating = position.turn === "white" ? whiteElo : blackElo;
      if (movingRating >= 1800 && movingRating <= 2199) {
        const row = counts.get(key) ?? { total: 0, moves: {}, roots: new Set<string>() };
        const uci = makeUci(move);
        row.total += 1;
        row.moves[uci] = (row.moves[uci] ?? 0) + 1;
        row.roots.add(reached);
        counts.set(key, row);
      }
    }
    position.play(move);
  }
  if (reached !== undefined) gamesReachingRoot += 1;
  parsedGames += 1;
}

const inputHash = createHash("sha256");
const input = createReadStream(SOURCE);
input.on("data", (chunk) => inputHash.update(chunk));
const lines = createInterface({ input, crlfDelay: Infinity });
for await (const line of lines) {
  if (line.startsWith('[Event "') && (headers.size > 0 || movetext.length > 0)) {
    finish(); headers = new Map(); movetext = []; inMoves = false;
  }
  if (!inMoves && line.startsWith("[")) {
    const space = line.indexOf(" ");
    if (space > 1) headers.set(line.slice(1, space), headerValue(line));
  } else if (!inMoves && line === "" && headers.size > 0) inMoves = true;
  else if (inMoves && line !== "") movetext.push(line);
}
// Preserve the standing convention: omit a possibly partial trailing game.

const serializable = Object.fromEntries([...counts].sort(([a], [b]) => a.localeCompare(b)).map(([key, row]) =>
  [key, { total: row.total, moves: row.moves, roots: [...row.roots].sort() }]
));
const result = {
  schema: "tabiya.r11.local-statistical-book.v1",
  source: {
    name: basename(SOURCE),
    upstream: "https://database.lichess.org/standard/lichess_db_standard_rated_2026-07.pgn.zst",
    sha256: `sha256:${inputHash.digest("hex")}`,
  },
  population: { event: "Rated Blitz game", movingRating: [1800, 2199], maxPly: MAX_PLY },
  roots: Object.fromEntries(roots),
  counts: serializable,
  summary: { eligibleGames, parsedGames, gamesReachingRoot, positions: counts.size },
};
await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result.summary, null, 2));
