// DISPOSABLE research instrument (D148 wave, 2026-08-15). Not production.
// Prints the FEN of a pack's start, of every spine node, and of the position
// after each authored deviation move, so an explorer probe can be aimed at them.
import { readFile } from "node:fs/promises";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

interface Node { id: string; moveUci: string; moveSan: string; children: Node[] }

async function main(): Promise<void> {
  for (const path of process.argv.slice(2)) {
    const pack = JSON.parse(await readFile(path, "utf8")) as any;
    console.log(`## ${pack.id}`);
    const start = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
    const byId = new Map<string, Chess>();
    console.log(`start\t${pack.start.fen}`);
    const walk = (nodes: readonly Node[], position: Chess, depth: number): void => {
      for (const node of nodes) {
        const branch = position.clone();
        const move = parseUci(node.moveUci);
        if (!move || !branch.isLegal(move)) { console.log(`  ILLEGAL ${node.id} ${node.moveUci}`); continue; }
        branch.play(move);
        byId.set(node.id, branch);
        console.log(`node:${node.id}\t${makeFen(branch.toSetup())}\t(${"  ".repeat(depth)}${node.moveSan})`);
        walk(node.children, branch, depth + 1);
      }
    };
    walk(pack.spine ?? [], start, 0);
    for (const deviation of pack.deviations ?? []) {
      const at = deviation.at.atStart ? start : byId.get(deviation.at.spineNodeId);
      if (!at) { console.log(`  UNRESOLVED deviation anchor ${JSON.stringify(deviation.at)}`); continue; }
      const branch = at.clone();
      const move = parseUci(deviation.moveUci);
      if (!move || !branch.isLegal(move)) { console.log(`  ILLEGAL deviation ${deviation.moveUci}`); continue; }
      const before = makeFen(at.toSetup());
      branch.play(move);
      console.log(`dev:${deviation.moveUci}:${deviation.class}\tBEFORE ${before}\tAFTER ${makeFen(branch.toSetup())}`);
    }
  }
}

await main();
