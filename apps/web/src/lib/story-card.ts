import { reviewText, type ReviewMapMoment } from "@chess-tabiya/runtime";

export interface StoryCardDocument {
  readonly width: number;
  readonly height: number;
  readonly svg: string;
  /** The moment ids the card carries, in order: the same list as the private review and the share. */
  readonly momentIds: readonly string[];
}

const WIDTH = 900;

function xml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}

/**
 * Builds the review card from the review's own moment selection (rfc/review-map.md §5): every
 * selected moment with its complete admitted sentences, and a footer computed from the admitted
 * items' grounding sources ([[D687]]) — never a fixed provenance claim.
 */
export function storyCardDocument(title: string, moments: readonly Pick<ReviewMapMoment, "nodeId" | "fen" | "heading" | "moveLabel" | "sentences" | "sourceLabels">[]): StoryCardDocument {
  const board = moments[0]?.fen ?? "8/8/8/8/8/8/8/8 w - - 0 1";
  const ranks = board.split(" ")[0]!.split("/");
  const glyphs: Readonly<Record<string, string>> = { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
  const cells: string[] = Array.from({ length: 64 }, (_, index) => {
    const file = index % 8, rank = Math.floor(index / 8);
    return `<rect x="${48 + file * 52}" y="${60 + rank * 52}" width="52" height="52" fill="${(file + rank) % 2 === 0 ? "#eeeade" : "#71806a"}"/>`;
  });
  for (let rank = 0; rank < 8; rank += 1) {
    let file = 0;
    for (const token of ranks[rank] ?? "") {
      if (/\d/u.test(token)) { file += Number(token); continue; }
      const glyph = glyphs[token];
      if (glyph === undefined) continue;
      const x = 48 + file * 52, y = 60 + rank * 52;
      cells.push(`<text x="${x + 26}" y="${y + 38}" text-anchor="middle" font-size="38">${glyph}</text>`);
      file += 1;
    }
  }
  const blocks = moments.length === 0
    ? [`<p style="margin:0 0 10px">${xml(reviewText("card.none"))}</p>`]
    : moments.map((moment) => `<section data-moment-id="${xml(moment.nodeId)}"><p style="margin:0 0 4px;font-weight:600">${xml(moment.heading)} · ${xml(moment.moveLabel)}</p>${moment.sentences.map((sentence) => `<p style="margin:0 0 8px">${xml(sentence)}</p>`).join("")}</section>`);
  const lines = moments.reduce((count, moment) => count + 1 + moment.sentences.reduce((sum, sentence) => sum + Math.max(1, Math.ceil(sentence.length / 36)), 0), moments.length === 0 ? 1 : 0);
  const bodyHeight = lines * 24 + Math.max(1, moments.length) * 16;
  const height = Math.max(560, 150 + bodyHeight + 80);
  const labels = [...new Set(moments.flatMap((moment) => moment.sourceLabels))];
  const footer = labels.length === 0 ? reviewText("card.none") : reviewText("card.footer", { labels: labels.join(" · ") });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}"><rect width="${WIDTH}" height="${height}" fill="#f8f5ec"/>${cells.join("")}<text x="500" y="95" font-family="serif" font-size="34">${xml(title)}</text><foreignObject x="500" y="125" width="350" height="${bodyHeight + 20}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:18px/1.35 sans-serif;color:#171713">${blocks.join("")}</div></foreignObject><text x="500" y="${height - 32}" font-family="sans-serif" font-size="16">${xml(footer)}</text></svg>`;
  return Object.freeze({ width: WIDTH, height, svg, momentIds: Object.freeze(moments.map((moment) => moment.nodeId)) });
}
