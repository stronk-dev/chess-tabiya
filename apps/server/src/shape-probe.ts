// DISPOSABLE research instrument (D345 wave, 2026-08-16). Not production.
// Answers the one question every middlegame-pack author has to ask before
// writing a plan class: does this shape entry's trigger fire on this position,
// and does this plan's success signature fire on it? `shape-check PROBE=` now
// prints trigger firing (D113 fixed) but says nothing about plan signatures,
// which is what `plan_consequence` success conditions are graded on.
//
//   node dist/shape-probe.js <shape-id> <fen> [fen...]
//   node dist/shape-probe.js --pack <pack.json>     (walks the authored spine)
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { matchesStructuralExpression } from "@chess-tabiya/runtime";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

interface Plan { readonly id: string; readonly side: string; readonly label: string; readonly success: { readonly signature: unknown } }
interface Entry { readonly id: string; readonly trigger: unknown; readonly plans: readonly Plan[] }

async function entry(id: string): Promise<Entry> {
  return JSON.parse(await readFile(resolve("content/shapes", `${id}.json`), "utf8")) as Entry;
}

function report(shape: Entry, label: string, fen: string): void {
  const trigger = matchesStructuralExpression(fen, shape.trigger as never);
  const fired = shape.plans.filter((plan) => plan.success.signature !== null && matchesStructuralExpression(fen, plan.success.signature as never));
  console.log(`${label.padEnd(26)} trigger=${trigger ? "FIRES" : "-    "}  plans: ${fired.length === 0 ? "(none)" : fired.map((plan) => `${plan.side}/${plan.id}`).join(", ")}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === "--pack") {
    const packPath = argv[1];
    if (packPath === undefined) throw new TypeError("--pack requires a pack path");
    const pack = JSON.parse(await readFile(resolve(packPath), "utf8")) as { id: string; shapes?: (string | { shape: string })[]; start: { fen: string }; spine?: Node[] };
    const shapeIds = (pack.shapes ?? []).map((value) => (typeof value === "string" ? value : value.shape));
    const extra = argv.slice(2);
    for (const id of [...shapeIds, ...extra]) {
      const shape = await entry(id);
      console.log(`\n## ${pack.id} against shape ${id}`);
      const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
      report(shape, "start", makeFen(root.toSetup()));
      const walk = (nodes: readonly Node[], position: Chess): void => {
        for (const node of nodes) {
          const branch = position.clone();
          const move = parseUci(node.moveUci);
          if (!move || !branch.isLegal(move)) { console.log(`ILLEGAL ${node.id}`); continue; }
          branch.play(move);
          report(shape, node.id, makeFen(branch.toSetup()));
          walk(node.children, branch);
        }
      };
      walk(pack.spine ?? [], root);
    }
    return;
  }
  const shapeId = argv[0];
  if (shapeId === undefined) throw new TypeError("shape probe requires a shape id");
  const shape = await entry(shapeId);
  for (const [index, fen] of argv.slice(1).entries()) report(shape, `fen[${index}]`, fen);
}

interface Node { readonly id: string; readonly moveUci: string; readonly children: readonly Node[] }

await main();
