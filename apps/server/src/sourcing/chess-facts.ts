export function countFenPieces(fen: string): number {
  return [...(fen.split(" ")[0] ?? "")].filter((character) =>
    /[a-z]/i.test(character),
  ).length;
}
