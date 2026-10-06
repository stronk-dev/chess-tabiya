// Synthetic UCI transport control ONLY. Never a provider source or chess rating.
import { createInterface } from "node:readline";
const options = new Set();
let cleared = false, newGame = false, width = 0, positioned = false;
createInterface({ input: process.stdin }).on("line", (line) => {
  if (line === "uci") {
    if (process.argv.includes("--fail")) { process.exitCode = 31; process.stdin.destroy(); return; }
    process.stdout.write("id name Synthetic transport fixture\nuciok\n");
  } else if (line === "isready") process.stdout.write("readyok\n");
  else if (line === "ucinewgame") { newGame = true; cleared = false; positioned = false; }
  else if (line === "setoption name Clear Hash") cleared = true;
  else if (line.startsWith("setoption name MultiPV value ")) width = Number(line.split(" ").at(-1));
  else if (line.startsWith("setoption ")) options.add(line);
  else if (line.startsWith("position fen ")) positioned = true;
  else if (line.startsWith("go ")) {
    if (!newGame || !cleared || !positioned || !["Threads value 1", "Hash value 16", "UCI_Chess960 value false"]
      .every((option) => options.has(`setoption name ${option}`))) throw new Error("Query option/reset contract violated");
    const moves = line.split(" searchmoves ")[1]?.split(" ");
    if (!moves?.length || width !== Math.min(8, moves.length)) throw new Error("Incomplete legal searchmoves or wrong width");
    moves.slice(0, width).forEach((move, index) => process.stdout.write(`info depth 8 multipv ${index + 1} score cp 0 pv ${move}\n`));
    process.stdout.write(`bestmove ${moves[0]}\n`);
    newGame = false;
  } else if (line === "quit") process.stdin.destroy();
});
