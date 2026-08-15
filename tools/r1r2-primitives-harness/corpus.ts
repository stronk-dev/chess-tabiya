// DISPOSABLE research harness — R1/R2, planning/campaign-research-queue.md. Not production code.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

const DRAFTS = new URL("../../content/drafts/", import.meta.url).pathname;

export interface Transition {
  readonly pack: string;
  readonly phase: string;
  readonly mode: string;
  readonly nodeId: string;
  readonly ply: number; // depth in spine, 1-based
  readonly parentFen: string;
  readonly fen: string;
  readonly uci: string;
  readonly san: string;
  readonly annotations: readonly string[];
}

export function packFiles(): string[] {
  return readdirSync(DRAFTS)
    .filter((name) => name.endsWith(".json"))
    .filter((name) => !/\.(evidence|job|sources|browser)\.json$/.test(name))
    .sort()
    .map((name) => join(DRAFTS, name));
}

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

export function transitions(): Transition[] {
  const out: Transition[] = [];
  for (const file of packFiles()) {
    const pack = JSON.parse(readFileSync(file, "utf8"));
    const walk = (nodes: any[], fen: string, ply: number): void => {
      for (const node of nodes ?? []) {
        const pos = position(fen);
        const move = parseUci(node.moveUci);
        if (move === undefined || !pos.isLegal(move)) {
          throw new Error(`illegal ${node.moveUci} in ${pack.id}/${node.id} from ${fen}`);
        }
        pos.play(move);
        const next = makeFen(pos.toSetup());
        out.push({
          pack: pack.id,
          phase: pack.phase,
          mode: pack.mode,
          nodeId: node.id,
          ply,
          parentFen: fen,
          fen: next,
          uci: node.moveUci,
          san: node.moveSan,
          annotations: (node.annotations ?? []).map((a: any) => (typeof a === "string" ? a : (a.text ?? a.body ?? JSON.stringify(a)))),
        });
        walk(node.children ?? [], next, ply + 1);
      }
    };
    walk(pack.spine ?? [], pack.start.fen, 1);
  }
  return out;
}
