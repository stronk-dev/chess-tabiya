// DISPOSABLE research harness — R5 (planning/campaign-research-queue.md).
// Not production code. Stratifies the R4 extraction into an R5 probe set:
// phase (opening/middlegame/endgame) x side to move x piece-count bucket.
import { readFileSync, writeFileSync } from "node:fs";

interface Position {
  readonly packId: string;
  readonly phase: string;
  readonly objectiveType: string;
  readonly origin: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

function sideToMove(fen: string): "w" | "b" {
  return (fen.split(" ")[1] ?? "w") as "w" | "b";
}

function bucket(pieceCount: number): string {
  if (pieceCount <= 5) return "pc<=5";
  if (pieceCount <= 7) return "pc6-7";
  if (pieceCount <= 16) return "pc8-16";
  if (pieceCount <= 26) return "pc17-26";
  return "pc27+";
}

function main(): void {
  const all = (
    JSON.parse(readFileSync(process.argv[2]!, "utf8")) as { positions: Position[] }
  ).positions;
  const perCell = Number(process.argv[4] ?? "1");

  // Deterministic stratification: sort every cell by FEN, take evenly spaced members.
  const cells = new Map<string, Position[]>();
  for (const position of all) {
    const key = `${position.phase}|${sideToMove(position.fen)}|${bucket(position.pieceCount)}`;
    const list = cells.get(key) ?? [];
    list.push(position);
    cells.set(key, list);
  }

  const chosen: (Position & { readonly cell: string })[] = [];
  for (const key of [...cells.keys()].sort()) {
    const list = [...cells.get(key)!].sort((left, right) => left.fen.localeCompare(right.fen));
    const take = Math.min(perCell, list.length);
    const stride = list.length / take;
    for (let index = 0; index < take; index += 1) {
      chosen.push({ ...list[Math.floor(index * stride)]!, cell: key });
    }
  }

  writeFileSync(process.argv[3]!, JSON.stringify({ positions: chosen }, null, 1));
  process.stdout.write(
    `cells=${cells.size} chosen=${chosen.length}\n` +
      [...cells.keys()]
        .sort()
        .map((key) => `  ${key}: pool=${cells.get(key)!.length}`)
        .join("\n") +
      "\n",
  );
}

main();
