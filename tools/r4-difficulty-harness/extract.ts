// DISPOSABLE research harness — R4 (planning/campaign-research-queue.md).
// Not production code. Extracts decision positions from the committed pack corpus.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";

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
  readonly objective?: { readonly type?: string };
  readonly spine?: readonly SpineNode[];
  readonly deviations?: readonly { readonly at: { readonly fen?: string } }[];
}

export interface ExtractedPosition {
  readonly packId: string;
  readonly phase: string;
  readonly objectiveType: string;
  readonly origin: "spine" | "deviation" | "start";
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

function pieceCount(fen: string): number {
  return (fen.split(" ")[0] ?? "").replace(/[^a-zA-Z]/gu, "").length;
}

function legalMoves(fen: string): readonly string[] {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const out: string[] = [];
  for (const [from, targets] of position.allDests()) {
    for (const to of targets) {
      const isPawn = position.board.getRole(from) === "pawn";
      const rank = to >> 3;
      if (isPawn && (rank === 0 || rank === 7)) {
        for (const promotion of ["q", "r", "b", "n"] as const) {
          out.push(makeUci({ from, to, promotion: ({ q: "queen", r: "rook", b: "bishop", n: "knight" } as const)[promotion] }));
        }
      } else {
        out.push(makeUci({ from, to }));
      }
    }
  }
  return out.sort();
}

function walk(
  pack: Pack,
  node: SpineNode,
  position: Chess,
  history: readonly string[],
  sink: ExtractedPosition[],
): void {
  const fen = makeFen(position.toSetup());
  sink.push({
    packId: pack.id,
    phase: pack.phase,
    objectiveType: pack.objective?.type ?? "n/a",
    origin: "spine",
    fen,
    pieceCount: pieceCount(fen),
    legalUci: legalMoves(fen),
    startFen: pack.start.fen,
    historyUci: [...history],
  });
  const move = parseUci(node.moveUci);
  if (move === undefined || !isNormal(move) || !position.isLegal(move)) {
    throw new Error(`${pack.id}: illegal spine move ${node.moveUci} at ${fen}`);
  }
  const next = position.clone();
  next.play(move);
  const nextHistory = [...history, node.moveUci];
  for (const child of node.children ?? []) walk(pack, child, next, nextHistory, sink);
  if ((node.children ?? []).length === 0) {
    const leafFen = makeFen(next.toSetup());
    if (next.isEnd()) return;
    sink.push({
      packId: pack.id,
      phase: pack.phase,
      objectiveType: pack.objective?.type ?? "n/a",
      origin: "spine",
      fen: leafFen,
      pieceCount: pieceCount(leafFen),
      legalUci: legalMoves(leafFen),
      startFen: pack.start.fen,
      historyUci: nextHistory,
    });
  }
}

function main(): void {
  const dir = process.argv[2]!;
  const out = process.argv[3]!;
  const positions: ExtractedPosition[] = [];
  const packs: { id: string; phase: string; objective: string; nodes: number }[] = [];
  for (const file of readdirSync(dir).sort()) {
    if (!file.endsWith(".json")) continue;
    if (/\.(evidence|job|sources|browser)\.json$/u.test(file)) continue;
    const pack = JSON.parse(readFileSync(join(dir, file), "utf8")) as Pack;
    if (pack.start?.fen === undefined) continue;
    const before = positions.length;
    const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
    for (const node of pack.spine ?? []) walk(pack, node, root.clone(), [], positions);
    for (const deviation of pack.deviations ?? []) {
      const fen = deviation.at.fen;
      if (fen === undefined) continue;
      positions.push({
        packId: pack.id,
        phase: pack.phase,
        objectiveType: pack.objective?.type ?? "n/a",
        origin: "deviation",
        fen,
        pieceCount: pieceCount(fen),
        legalUci: legalMoves(fen),
        startFen: fen,
        historyUci: [],
      });
    }
    packs.push({
      id: pack.id,
      phase: pack.phase,
      objective: pack.objective?.type ?? "n/a",
      nodes: positions.length - before,
    });
  }
  // Dedupe on FEN, keeping the first attribution.
  const seen = new Set<string>();
  const unique = positions.filter((entry) => {
    if (seen.has(entry.fen)) return false;
    seen.add(entry.fen);
    return true;
  });
  writeFileSync(out, JSON.stringify({ packs, positions: unique }, null, 1));
  process.stdout.write(
    `packs=${packs.length} rawPositions=${positions.length} unique=${unique.length} ` +
      `inRange=${unique.filter((p) => p.pieceCount <= 7).length} ` +
      `outOfRange=${unique.filter((p) => p.pieceCount > 7).length}\n`,
  );
}

main();
