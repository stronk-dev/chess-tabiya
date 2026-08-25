import { storyEvidenceSourceLabels, type StoryMoment } from "@chess-tabiya/runtime";

export interface StoryCardDocument {
  readonly width: number;
  readonly height: number;
  readonly svg: string;
}

const WIDTH = 900;

function xml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Builds a complete, source-attributed story card without dropping additional admitted facts. */
export function storyCardDocument(title: string, moment: Pick<StoryMoment, "fen" | "sentences" | "evidence">): StoryCardDocument {
  const ranks = moment.fen.split(" ")[0]!.split("/");
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
  const sentences = moment.sentences.length === 0 ? ["Recorded Tabiya story moment."] : moment.sentences;
  const bodyLines = sentences.reduce((count, sentence) => count + Math.max(1, Math.ceil(sentence.length / 36)), 0);
  const bodyHeight = bodyLines * 24 + sentences.length * 10;
  const height = Math.max(560, 150 + bodyHeight + 80);
  const paragraphs = sentences.map((sentence) => `<p style="margin:0 0 10px">${xml(sentence)}</p>`).join("");
  const sources = storyEvidenceSourceLabels(moment);
  const sourceLine = sources.length === 0 ? "Source: recorded story" : `Sources: ${sources.join(" · ")}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}"><rect width="${WIDTH}" height="${height}" fill="#f8f5ec"/>${cells.join("")}<text x="500" y="95" font-family="serif" font-size="34">${xml(title)}</text><foreignObject x="500" y="125" width="350" height="${bodyHeight + 20}"><div xmlns="http://www.w3.org/1999/xhtml" style="font:18px/1.35 sans-serif;color:#171713">${paragraphs}</div></foreignObject><text x="500" y="${height - 32}" font-family="sans-serif" font-size="16">${xml(sourceLine)} · Tabiya</text></svg>`;
  return Object.freeze({ width: WIDTH, height, svg });
}
