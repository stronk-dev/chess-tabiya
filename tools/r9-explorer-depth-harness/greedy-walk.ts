// DISPOSABLE research harness — R9 (planning/exploration/plan.md).
// Not production code. THE INSTRUMENT CHECK: walks the most-played move from the
// standard start position, ply by ply, and records where the sample dies. A falloff
// measured on our own authored spines could be a property of the lines we happened to
// author; this walk is the explorer's own densest path, so the ply at which it dies is
// the ceiling of the instrument itself.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { corpusUrl, type CorpusQuery } from "../../apps/server/src/corpus.js";
import type { RatingGroup, Speed } from "../../apps/server/src/sourcing/explorer.js";

const UA = "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)";
const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

async function main(): Promise<void> {
  const outPath = process.argv[2]!;
  // "1600" = one bucket; "1400+1600+1800" = a merged population.
  const band = (process.argv[3] ?? "1600").split("+").map(Number) as RatingGroup[];
  const stopBelow = Number(process.argv[4] ?? "1");
  const maxPly = Number(process.argv[5] ?? "80");
  const since = process.argv[6] ?? "2024-01";
  const until = process.argv[7] ?? "2026-07";
  const speeds = (process.argv[8] ?? "blitz,rapid,classical").split(",") as Speed[];
  const delayMs = Number(process.env.DELAY_MS ?? "2500");
  const token = (readFileSync(".env.lichess", "utf8").match(/LICHESS_TOKEN=(\S+)/) ?? [])[1];
  if (token === undefined) throw new Error("no LICHESS_TOKEN in .env.lichess");

  writeFileSync(outPath, "");
  const position = Chess.fromSetup(parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1").unwrap()).unwrap();
  const played: string[] = [];
  for (let ply = 0; ply <= maxPly; ply += 1) {
    const fen = makeFen(position.toSetup());
    const query: CorpusQuery = { source: "lichess-explorer", fen, ratings: band, speeds, since, until };
    const url = corpusUrl(query);
    const response = await fetch(url, { headers: { authorization: `Bearer ${token}`, "user-agent": UA } });
    if (response.status !== 200) {
      process.stderr.write(`HTTP ${response.status} at ply ${ply} — waiting 60s\n`);
      await sleep(60_000);
      ply -= 1;
      continue;
    }
    const body = (await response.json()) as Record<string, any>;
    const total = Number(body.white) + Number(body.draws) + Number(body.black);
    const moves = (body.moves ?? []).map((m: any) => ({ uci: String(m.uci), san: String(m.san), n: Number(m.white) + Number(m.draws) + Number(m.black), white: Number(m.white), draws: Number(m.draws), black: Number(m.black) }));
    const best = moves[0];
    appendFileSync(outPath, `${JSON.stringify({ ply, band: band.join("+"), fen, total, white: body.white, draws: body.draws, black: body.black, line: [...played], moves })}\n`);
    process.stderr.write(`ply ${ply} band ${band.join("+")}: ${total} games, top ${best?.san ?? "-"} ${best?.n ?? 0}\n`);
    if (total < stopBelow || best === undefined || best.n === 0) break;
    const move = parseUci(best.uci);
    if (move === undefined || !position.isLegal(move)) break;
    position.play(move);
    played.push(best.san);
    await sleep(delayMs);
  }
}

void main();
