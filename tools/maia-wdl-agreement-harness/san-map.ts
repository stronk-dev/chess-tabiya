// DISPOSABLE research harness — Maia WDL vs human outcome. Not production code.
// The explorer names moves in SAN; Maia names them in UCI. This emits the
// SAN -> UCI map for every probe-set FEN using chessops, the same library the
// runtime and every prior harness use, so the join is not a second convention.
import { readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { makeUci } from "chessops/util";

interface Position {
  readonly fen: string;
}

const [, , probeSetPath, outPath] = process.argv;
const positions = (
  JSON.parse(readFileSync(probeSetPath!, "utf8")) as { positions: Position[] }
).positions;

const out: Record<string, Record<string, string>> = {};
for (const position of positions) {
  const setup = parseFen(position.fen).unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const map: Record<string, string> = {};
  const dests = pos.allDests();
  for (const [from, targets] of dests) {
    for (const to of targets) {
      const candidates =
        pos.board.get(from)?.role === "pawn" && (to < 8 || to >= 56)
          ? (["queen", "rook", "bishop", "knight"] as const).map((promotion) => ({
              from,
              to,
              promotion,
            }))
          : [{ from, to }];
      for (const candidate of candidates) {
        map[makeSan(pos, candidate)] = makeUci(candidate);
      }
    }
  }
  out[position.fen] = map;
}
writeFileSync(outPath!, `${JSON.stringify(out)}\n`);
console.log(`fens=${Object.keys(out).length}`);
