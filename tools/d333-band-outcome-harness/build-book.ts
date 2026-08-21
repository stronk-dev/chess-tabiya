// DISPOSABLE research harness — D333: does Maia's `targetElo` band move the RESULT?
// Not production code. Nothing imports it.
//
// Builds the opening book from the COMMITTED pack corpus (content/drafts/*.json),
// so every game starts from a position the product itself drills. Entries are the
// pack start position plus main-line spine prefixes at depths 2/4/6, deduped by FEN.
//
// Each entry carries `historyUci` = the moves from the pack start FEN to the entry,
// so the play harness can issue production's exact position command shape
// (`position fen <startFen> moves <history>`, opponent-selector.ts:494-520).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";

interface SpineNode {
  readonly id: string;
  readonly moveUci: string;
  readonly children?: readonly SpineNode[];
}

interface Pack {
  readonly id: string;
  readonly phase: string;
  readonly mode: string;
  readonly start: { readonly fen: string };
  readonly spine?: readonly SpineNode[];
}

export interface BookEntry {
  readonly bookId: string;
  readonly packId: string;
  readonly phase: string;
  readonly mode: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly fen: string;
  readonly pieceCount: number;
  // Distinct legal DESTINATION squares (promotions collapse to one). Used only as
  // the "is this position a decision at all" filter, never as a count of moves.
  readonly destCount: number;
}

const PACK_SUFFIX_SKIP = [".evidence.json", ".job.json", ".sources.json", ".browser.json"];
const PREFIX_DEPTHS = [0, 2, 4, 6];

function main(): void {
  const [, , draftsDir = "content/drafts", outPath = "book.json"] = process.argv;
  const files = readdirSync(draftsDir)
    .filter((name) => name.endsWith(".json") && !PACK_SUFFIX_SKIP.some((s) => name.endsWith(s)))
    .sort();

  const byFen = new Map<string, BookEntry>();
  for (const file of files) {
    const pack = JSON.parse(readFileSync(join(draftsDir, file), "utf8")) as Pack;
    const setup = parseFen(pack.start.fen);
    if (setup.isErr) continue;
    const position = Chess.fromSetup(setup.unwrap());
    if (position.isErr) continue;
    let board = position.unwrap();
    const history: string[] = [];

    // Walk the main line (first child at each level), snapshotting at PREFIX_DEPTHS.
    let node: SpineNode | undefined = pack.spine?.[0];
    for (let depth = 0; ; depth += 1) {
      if (PREFIX_DEPTHS.includes(depth) && !board.isEnd()) {
        const fen = makeFen(board.toSetup());
        const destCount = [...board.allDests().values()].reduce((n, s) => n + s.size(), 0);
        const pieceCount = (fen.split(" ")[0] ?? "").replace(/[^a-zA-Z]/gu, "").length;
        // A position with a single legal reply is not a decision; skip it.
        if (destCount >= 2 && !byFen.has(fen)) {
          byFen.set(fen, {
            bookId: `${pack.id}+${depth}`,
            packId: pack.id,
            phase: pack.phase,
            mode: pack.mode,
            startFen: pack.start.fen,
            historyUci: [...history],
            fen,
            pieceCount,
            destCount,
          });
        }
      }
      if (node === undefined || depth >= Math.max(...PREFIX_DEPTHS)) break;
      const move = parseUci(node.moveUci);
      if (!move || !isNormal(move) || !board.isLegal(move)) break;
      board = board.clone();
      board.play(move);
      history.push(node.moveUci);
      node = node.children?.[0];
    }
  }

  const entries = [...byFen.values()].sort((a, b) => a.bookId.localeCompare(b.bookId));
  writeFileSync(outPath, `${JSON.stringify({ entries }, null, 1)}\n`);
  const byPhase = new Map<string, number>();
  for (const e of entries) byPhase.set(e.phase, (byPhase.get(e.phase) ?? 0) + 1);
  console.log(`book entries=${entries.length} packs=${files.length}`);
  console.log([...byPhase].map(([k, v]) => `${k}=${v}`).join(" "));
}

main();
