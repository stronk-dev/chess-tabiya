// Actual subprocess controls. No Stockfish/chess/latency research evidence.
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { position } from "./cost-stockfish.mjs";
import { legalMoves } from "./exact-reply-enumeration.mjs";

const [mode, counter] = process.argv.slice(2);
const ordinal = Number(readFileSync(counter, "utf8")) + 1;
writeFileSync(counter, String(ordinal));
let fen, multiPv = 1, queries = 0;
createInterface({ input: process.stdin }).on("line", line => {
  if (line === "uci") {
    if (mode === "startup_silent") return;
    process.stdout.write("id name D3512 synthetic subprocess\nuciok\n");
  }
  if (line === "isready") process.stdout.write("readyok\n");
  if (line.startsWith("setoption name MultiPV value ")) multiPv = Number(line.split(" ").at(-1));
  if (line.startsWith("position fen ")) fen = line.slice("position fen ".length);
  if (line.startsWith("go ")) {
    queries++;
    if (mode === "always_silent" || mode === "first_silent" && ordinal === 1
      || mode === "first_second_query_silent" && ordinal === 1 && queries === 2) return;
    if (mode === "first_crash" && ordinal === 1) process.exit(4);
    if (mode === "invalid") { process.stdout.write("info depth 12 score cp 0 pv a1a8\nbestmove a1a8\n"); return; }
    const moves = legalMoves(position(fen)).slice(0, multiPv);
    const depth = /go depth (\d+)/u.exec(line)?.[1] ?? "8";
    moves.forEach((move, i) => process.stdout.write(`info depth ${depth} multipv ${i + 1} score cp ${20 - i} pv ${move.uci}\n`));
    process.stdout.write(`bestmove ${moves[0].uci}\n`);
  }
  if (line === "quit") process.exit(0);
});
