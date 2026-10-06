// Synthetic subprocess controls, never provider/latency research evidence.
import { createInterface } from "node:readline";
const mode = process.argv[2];
let cleared = false, ready = false, fen = false;
createInterface({ input: process.stdin }).on("line", line => {
  if (line === "uci") process.stdout.write("id name D3262 process control, not Stockfish evidence\nuciok\n");
  if (line === "setoption name Clear Hash") cleared = true;
  if (line === "isready") { ready = true; process.stdout.write("readyok\n"); }
  if (line.startsWith("position fen ")) fen = true;
  if (line.startsWith("go ")) {
    if (!cleared || !ready || !fen) process.exit(3);
    if (mode === "silent") return;
    if (mode === "crash") process.exit(4);
    if (mode === "chatty") { setInterval(() => process.stdout.write("info string still running\n"), 10); return; }
    const reply = () => process.stdout.write(`info depth 8 multipv 1 score cp 0 pv ${mode === "invalid" ? "a1a8" : "e2e3"}\nbestmove e2e3\n`);
    if (mode === "slow") setTimeout(reply, 50); else reply();
  }
  if (line === "quit") process.exit(0);
});
