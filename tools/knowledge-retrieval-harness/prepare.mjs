import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUT = "/private/tmp/tabiya-r4-knowledge";
const OPENINGS_SHA = "4b8622759e7ae6f93f011cc6c83a3823401ab45e";
const PUZZLES = process.env.TABIYA_LICHESS_PUZZLES || "/private/tmp/tabiya-puzzles-head.csv";

const openingDigests = {
  a: "41722fa3d44f294357326fe2ca1b956d9e56490b30efcfa68db61114c9df7e10",
  b: "310f0997d5a26ac6c9abfabac028e47e78f24356a6ba322cfffbf8f5a3f88d25",
  c: "b2e64f32e42e6418b327d03a55af65f3a18e762f7cbc0efffc7e9d1ed3aa7343",
  d: "58cad40b886bd499717eabcce281d4bfcf00eeadbdc00552f42042cf4aac50d2",
  e: "f1f8494f488f660e284f23527d5acfbeccdbbc3acc76e74f05d125f39d2f8a74",
};

const wiki = [
  ["sicilian", 4628469, "Chess Opening Theory/1. e4/1...c5", "69bdd1bf286fd2dd8faa9966b677a661ae8e6fdb03e649cfecc70d90dda9ae52"],
  ["caro", 4621962, "Chess Opening Theory/1. e4/1...c6", "42bad1f434b26b4cce16a423cc4ff56c3f8d1e61f0b17894c5b275741cfbd0a5"],
  ["qg", 4628332, "Chess Opening Theory/1. d4/1...d5/2. c4", "c9bcb4fe246c4a239f9f29d926e2796c7f5bb4b995b6606237a15b3553db2c20"],
  ["kid", 4659986, "Chess Opening Theory/1. d4/1...Nf6/2. c4/2...g6", "4a7abf4ce31b1301b7e4516037735efa7103c1b4a0d7715cd739cdb2e529ae81"],
  ["pawn", 4242584, "Chess/The Endgame/Pawn Endings", "acd170f08e52e29a972a625c8a99467b723820b799ce619c03dd175111730efb"],
  ["rookpawn", 2064888, "Chess/The Endgame/Rook and Pawn Endings", "4631b4d7370b21f4512f9986fcd459086fd807f9c3187860ce6c2683e59b3f99"],
  ["kqk", 2060348, "Chess/The Endgame/King and Queen vs. King", "d77b606e5792591c99985d6047c74150eb0afbed455c5856c6cf474b913561fd"],
  ["minor", 4627782, "Chess/The Endgame/Minor Piece endings", "ce1e638fc727ddcfee2d6db64327cbc8d41c6dc88ae5e12cf225b44c07108cb4"],
];

const wikiQueries = {
  sicilian: [
    "Why does the Sicilian use a flank pawn to contest d4?",
    "What development drawback does Black accept after 1 e4 c5?",
    "How does the Open Sicilian create a centralised knight and open lines?",
    "Which closed Sicilian setup uses a kingside fianchetto and a slow attack?",
  ],
  caro: [
    "Why does the Caro-Kann prepare d5 with c6?",
    "How does the Caro-Kann differ from the French bishop problem?",
    "What structure can the Accelerated Panov leave White with?",
    "What is Black's basic response after White builds e4 and d4 against c6?",
  ],
  qg: [
    "What central compensation does White seek in the Queen's Gambit?",
    "Why is holding the extra c4 pawn often impractical?",
    "Why do e6 and c6 make natural ways to decline the Queen's Gambit?",
    "What goes wrong with an early knight recapture on d5 in the Marshall defence?",
  ],
  kid: [
    "Why is the dark squared bishop important after a King's Indian fianchetto?",
    "Which pawn breaks does Black commonly seek in the King's Indian?",
    "How do the usual wing attacks differ in the King's Indian?",
    "What is the hypermodern idea behind controlling the centre from g7?",
  ],
  pawn: [
    "How does the rule of the square tell whether a king catches a passed pawn?",
    "Which side has the opposition when two kings face each other with one square between?",
    "Why can a blocking pawn invalidate the rule of the square?",
    "What distinguishes a protected passed pawn from an outside passed pawn?",
  ],
  rookpawn: [
    "Why are connected pawns easier to advance in rook endings?",
    "Which factors decide a rook ending with a single extra pawn?",
    "How can an attacking rook cut the defending king off from a passed pawn?",
    "Why can widely separated pawns be harder for the stronger side to defend?",
  ],
  kqk: [
    "How should a beginner drive a lone king to the edge with a queen?",
    "Why can unnecessary queen checks slow down king and queen mate?",
    "What stalemate trap must be avoided after confining the king?",
    "When should the attacking king approach in queen versus lone king?",
  ],
  minor: [
    "Why can two bishops force mate while one bishop cannot?",
    "Which corner is required for bishop and knight mate?",
    "Why can two knights not normally force mate against a bare king?",
    "How do two bishops coordinate to restrict the opposing king?",
  ],
};

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function cachedOrFetch(cache, url) {
  try {
    return await readFile(cache, "utf8");
  } catch {
    const response = await fetch(url, { headers: { "User-Agent": "Tabiya-R4-research/1.0" } });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    const body = await response.text();
    await writeFile(cache, body);
    return body;
  }
}

function cleanWiki(text) {
  return text
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/<ref[^>]*>[^]*?<\/ref>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\{\{[^{}]*\}\}/g, " ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[https?:\/\/[^ ]+ ([^\]]+)\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/^\s*[|{}].*$/gm, " ")
    .replace(/^\s*\*\s*/gm, "")
    .replace(/={2,}\s*([^=]+?)\s*={2,}/g, "\n$1\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
}

await mkdir(OUT, { recursive: true });

const openingRows = [];
for (const letter of Object.keys(openingDigests)) {
  const cache = `/private/tmp/tabiya-r4-${letter}.tsv`;
  const url = `https://raw.githubusercontent.com/lichess-org/chess-openings/${OPENINGS_SHA}/${letter}.tsv`;
  const body = await cachedOrFetch(cache, url);
  if (sha256(body) !== openingDigests[letter]) throw new Error(`${letter}.tsv digest drift`);
  for (const line of body.trim().split("\n").slice(1)) {
    const [eco, name, pgn] = line.split("\t");
    openingRows.push({ eco, name, pgn, letter });
  }
}

const targetEcos = ["A00", "A40", "A45", "B01", "B06", "B10", "B12", "B20", "B30", "B90", "C00", "C10", "C20", "C42", "C50", "C60", "C65", "D00", "D02", "D10", "D30", "D35", "E00", "E20"];
const openings = targetEcos.map((eco) => openingRows.filter((r) => r.eco === eco).sort((a, b) => a.pgn.length - b.pgn.length || a.name.localeCompare(b.name))[0]);
if (openings.some((row) => !row)) throw new Error("opening selection lost a target ECO");

const passages = openings.map((row) => ({
  id: `opening-${row.eco.toLowerCase()}-${slug(row.name)}`,
  source: "lichess-openings",
  sourceUrl: `https://github.com/lichess-org/chess-openings/blob/${OPENINGS_SHA}/${row.letter}.tsv`,
  title: `${row.name} (${row.eco})`,
  keys: [row.eco.toLowerCase(), row.name.toLowerCase(), row.pgn.toLowerCase()],
  text: `Structured opening record. ECO code: ${row.eco}. Opening name: ${row.name}. Defining PGN move sequence: ${row.pgn}. This record identifies a name and move sequence; it does not claim that the line is best or recommend a plan.`,
}));

for (const [key, revid, title, digest] of wiki) {
  const cache = `/private/tmp/tabiya-r4-wb-${key}.json`;
  const url = `https://en.wikibooks.org/w/api.php?action=parse&format=json&prop=wikitext%7Crevid&oldid=${revid}`;
  const raw = await cachedOrFetch(cache, url);
  if (sha256(raw) !== digest) throw new Error(`Wikibooks ${key} response digest drift`);
  const parsed = JSON.parse(raw);
  if (parsed.parse?.revid !== revid) throw new Error(`Wikibooks ${key} revision drift`);
  passages.push({
    id: `wikibooks-${key}`,
    source: "wikibooks",
    sourceUrl: `https://en.wikibooks.org/w/index.php?title=${encodeURIComponent(title.replaceAll(" ", "_"))}&oldid=${revid}`,
    title,
    keys: [key, title.toLowerCase()],
    text: cleanWiki(parsed.parse.wikitext["*"]),
  });
}

const puzzleBody = await readFile(PUZZLES, "utf8");
const puzzlePrefixDigest = sha256(puzzleBody);
const wantedThemes = ["fork", "pin", "discoveredAttack", "hangingPiece"];
const puzzleCounts = new Map(wantedThemes.map((theme) => [theme, 0]));
for (const line of puzzleBody.split("\n")) {
  if ([...puzzleCounts.values()].every((n) => n >= 5)) break;
  const fields = line.split(",");
  if (fields.length < 8) continue;
  const [id, fen, moves, rating, ratingDeviation, popularity, plays, themes] = fields;
  for (const theme of wantedThemes) {
    if (puzzleCounts.get(theme) >= 5 || !themes.split(" ").includes(theme)) continue;
    puzzleCounts.set(theme, puzzleCounts.get(theme) + 1);
    passages.push({
      id: `puzzle-${theme.toLowerCase()}-${id}`,
      source: "lichess-puzzles",
      sourceUrl: `https://database.lichess.org/#puzzles`,
      title: `Lichess puzzle ${id}: ${theme}`,
      keys: [id.toLowerCase(), theme.toLowerCase(), fen.toLowerCase(), moves.toLowerCase()],
      text: `Structured Lichess puzzle record. Puzzle ID: ${id}. Starting FEN: ${fen}. Solution UCI sequence: ${moves}. Generated and vote-refined theme tag: ${theme}. Rating: ${rating}; rating deviation: ${ratingDeviation}; popularity: ${popularity}; plays: ${plays}. The tag is corpus evidence, not manual ground truth.`,
    });
    break;
  }
}
if ([...puzzleCounts.values()].some((n) => n !== 5)) throw new Error(`puzzle selection incomplete: ${JSON.stringify([...puzzleCounts])}`);

const localDossiers = [
  ["local-detection", "design/research/detection-landscape.md", "Detection landscape"],
  ["local-selection", "design/research/selection-sign-and-significance.md", "Selection, sign and significance"],
  ["local-stability", "design/research/pack-primitive-stability.md", "Pack primitive stability"],
];
for (const [id, relative, title] of localDossiers) {
  const text = await readFile(path.join(ROOT, relative), "utf8");
  passages.push({ id, source: "tabiya-local", sourceUrl: relative, title, keys: [id, title.toLowerCase()], text });
}

const gold = [];
for (const row of openings) {
  const target = `opening-${row.eco.toLowerCase()}-${slug(row.name)}`;
  gold.push(
    { id: `${target}-moves`, stratum: "opening", query: `What opening is ECO ${row.eco} after ${row.pgn}?`, eligible: [target] },
    { id: `${target}-name`, stratum: "opening", query: `Which move sequence defines ${row.name}?`, eligible: [target] },
    { id: `${target}-eco`, stratum: "opening", query: `Find the ${row.name} entry and its ECO code.`, eligible: [target] },
  );
}
for (const [key] of wiki) {
  for (const [index, query] of wikiQueries[key].entries()) {
    gold.push({ id: `wikibooks-${key}-${index + 1}`, stratum: key === "pawn" || key === "rookpawn" || key === "kqk" || key === "minor" ? "endgame" : "plan", query, eligible: [`wikibooks-${key}`] });
  }
}
for (const passage of passages.filter((p) => p.source === "lichess-puzzles")) {
  const [, theme, id] = passage.id.match(/^puzzle-([^-]+)-(.+)$/);
  const fen = passage.keys[2];
  gold.push({ id: `${passage.id}-query`, stratum: "tactical-record", query: `Find the Lichess ${theme} record ${id} with starting FEN ${fen}.`, eligible: [passage.id] });
}
gold.push(
  { id: "contrast-sicilian-open", stratum: "opposite-advice", query: "I want to open the Sicilian position quickly with Nf3 and d4; which source explains that choice?", eligible: ["wikibooks-sicilian"] },
  { id: "contrast-sicilian-closed", stratum: "opposite-advice", query: "I want to keep the Sicilian closed, fianchetto, and build a slower kingside attack; which source covers that setup?", eligible: ["wikibooks-sicilian"] },
  { id: "contrast-kid-white", stratum: "opposite-advice", query: "In the usual King's Indian, which wing does White attack?", eligible: ["wikibooks-kid"] },
  { id: "contrast-kid-black", stratum: "opposite-advice", query: "In the usual King's Indian, which wing does Black attack?", eligible: ["wikibooks-kid"] },
  { id: "ambiguous-square", stratum: "ambiguous", query: "Can the king catch this pawn without calculating every move?", eligible: ["wikibooks-pawn"] },
  { id: "ambiguous-queen", stratum: "ambiguous", query: "I trapped the king with my queen; what should I do next without stalemating?", eligible: ["wikibooks-kqk"] },
  { id: "ambiguous-bishop", stratum: "ambiguous", query: "Why does this fianchettoed bishop matter even when it looks passive?", eligible: ["wikibooks-kid"] },
  { id: "ambiguous-rook", stratum: "ambiguous", query: "My rook and extra pawn should be winning, but what positional details decide it?", eligible: ["wikibooks-rookpawn"] },
);

const negatives = [
  "How do I configure an RTMP ingest server?",
  "What bitrate should I use for a 4K livestream?",
  "Explain the offside rule in association football.",
  "How do I repair a bicycle disc brake?",
  "Which fertilizer is best for indoor tomatoes?",
  "What is the tax rate for a Dutch sole proprietorship?",
  "Diagnose this Kubernetes CrashLoopBackOff.",
  "How does a saxophone overblow into the altissimo register?",
  "Give me a sourdough hydration schedule.",
  "What is the fastest route from Amsterdam to Ljubljana?",
  "How should I normalize a PostgreSQL customer table?",
  "Which camera lens should I buy for bird photography?",
];
for (const [index, query] of negatives.entries()) gold.push({ id: `hard-negative-${index + 1}`, stratum: "hard-negative", query, eligible: [] });

const corpus = {
  schema: "tabiya.r4.knowledge-corpus.v1",
  generatedAt: new Date().toISOString(),
  sourceDigests: { openingDigests, puzzlePrefixDigest, localCommit: process.env.TABIYA_COMMIT || "working-tree" },
  passages,
};
await writeFile(path.join(OUT, "corpus.json"), `${JSON.stringify(corpus, null, 2)}\n`);
await writeFile(path.join(OUT, "gold-queries.json"), `${JSON.stringify(gold, null, 2)}\n`);
await writeFile(path.join(ROOT, "planning/platform-alignment/knowledge-retrieval/gold-queries.json"), `${JSON.stringify(gold, null, 2)}\n`);
console.log(JSON.stringify({ passages: passages.length, queries: gold.length, strata: Object.fromEntries([...new Set(gold.map((q) => q.stratum))].map((s) => [s, gold.filter((q) => q.stratum === s).length])), puzzlePrefixDigest }, null, 2));
