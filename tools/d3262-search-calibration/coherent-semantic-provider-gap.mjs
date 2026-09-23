// Disposable D3262 source-availability census for the predeclared all-legal
// semantic-event reserve. No outcome or provider rank chooses these paths.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = [
  "d3262-coherent-semantic-reserve.json",
  "d3262-coherent-exact-replies.json",
  "d3262-coherent-deeper-source-union.json",
  "d3262-stockfish-horizon4-capture.json",
  "d3262-stockfish-coherent-deeper-supplement.json",
  "d3262-maia-horizon4-path-capture.json",
  "d3262-maia-coherent-deeper-supplement.json",
];
const sha = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
function pathKey(rootId, candidateUci, replyUci) { return `${rootId}|${candidateUci}|${replyUci}`; }
function sourceIndex(rows, id, keyOf) {
  const indexed = new Map();
  rows.forEach((row, index) => {
    const key = keyOf(row);
    check(!indexed.has(key), `Duplicate ${id} source identity ${key}`);
    indexed.set(key, { source: id, row: index, fen: row.fen });
  });
  return indexed;
}
function mergeSources(first, second, kind) {
  for (const [key, value] of second) {
    check(!first.has(key), `Duplicate ${kind} source identity across captures ${key}`);
    first.set(key, value);
  }
  return first;
}

export function compileSemanticProviderGap(reserve, graph, union, stockfishOld, stockfishNew, maiaOld, maiaNew) {
  check(reserve.profile === "d3262-coherent-semantic-reserve-v1"
    && graph.profile === "d3262-coherent-root-v1"
    && union.profile === "d3262-coherent-deeper-source-union-v1"
    && reserve.manifest === graph.manifest && graph.manifest === union.manifest
    && union.manifest === stockfishOld.manifest && union.manifest === stockfishNew.manifest
    && union.manifest === maiaOld.manifest && union.manifest === maiaNew.manifest,
  "Crossed semantic-reserve source population");
  check(reserve.rows.length === 3276 && union.bindings.length === 1966,
    "Semantic-reserve or predecessor provider denominator changed");
  const replies = new Map();
  for (const root of graph.roots) for (const candidate of root.candidates) for (const reply of candidate.replies) {
    const key = pathKey(root.rootId, candidate.candidateUci, reply.uci);
    check(!replies.has(key), `Duplicate exact semantic path ${key}`);
    replies.set(key, reply.fen);
  }
  const prior = sourceIndex(union.bindings, "prior_union", (row) => pathKey(row.rootId, row.candidateUci, row.replyUci));
  const stockfish = mergeSources(
    sourceIndex(stockfishOld.rows, "d3262-stockfish-horizon4-capture.json", (row) => row.fen),
    sourceIndex(stockfishNew.rows, "d3262-stockfish-coherent-deeper-supplement.json", (row) => row.fen), "Stockfish");
  const maia = mergeSources(
    sourceIndex(maiaOld.rows, "d3262-maia-horizon4-path-capture.json",
      (row) => pathKey(row.rootId, row.candidateUci, row.replyUci)),
    sourceIndex(maiaNew.rows, "d3262-maia-coherent-deeper-supplement.json",
      (row) => pathKey(row.rootId, row.candidateUci, row.replyUci)), "Maia");
  const selected = new Map();
  for (const row of reserve.rows) {
    if (row.eventSourceWidth !== "all_legal" || row.reservedUci === null) continue;
    const key = pathKey(row.rootId, row.candidateUci, row.reservedUci);
    const fen = replies.get(key);
    check(fen !== undefined, `Reserved semantic event is not an exact legal reply ${key}`);
    const previous = selected.get(key);
    if (previous === undefined) selected.set(key, { rootId: row.rootId, candidateUci: row.candidateUci,
      replyUci: row.reservedUci, fen, targetIds: [row.targetId], configurations: [`${row.budget}:${row.width}`] });
    else {
      check(previous.fen === fen, `Semantic reserve crossed path FEN ${key}`);
      if (!previous.targetIds.includes(row.targetId)) previous.targetIds.push(row.targetId);
      if (!previous.configurations.includes(`${row.budget}:${row.width}`)) previous.configurations.push(`${row.budget}:${row.width}`);
    }
  }
  const paths = [...selected.values()].sort((left, right) => pathKey(left.rootId, left.candidateUci, left.replyUci)
    .localeCompare(pathKey(right.rootId, right.candidateUci, right.replyUci))).map((row) => {
    const key = pathKey(row.rootId, row.candidateUci, row.replyUci);
    const priorRow = prior.get(key);
    check(priorRow === undefined || priorRow.fen === row.fen, `Crossed prior provider binding ${key}`);
    const engine = stockfish.get(row.fen);
    const human = maia.get(key);
    check(engine === undefined || engine.fen === row.fen, `Crossed Stockfish position ${key}`);
    check(human === undefined || human.fen === row.fen, `Crossed Maia path ${key}`);
    return { ...row, priorUnion: priorRow !== undefined, stockfish: engine ?? null, maia: human ?? null,
      needsStockfish: engine === undefined, needsMaia: human === undefined };
  });
  check(paths.length > 0 && new Set(paths.map((row) => pathKey(row.rootId, row.candidateUci, row.replyUci))).size === paths.length,
    "Empty or duplicate semantic provider path frame");
  return { version: 1, profile: "d3262-coherent-semantic-provider-gap-v1", manifest: reserve.manifest,
    authority: "predeclared_semantic_event_path_source_availability_not_target_outcome_or_search_result",
    paths };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileSemanticProviderGap(...bytes.map((value) => JSON.parse(value.toString()))),
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-semantic-provider-gap.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Semantic provider gap differs from sealed inputs");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), selectedPaths: artifact.paths.length,
    outsidePriorUnion: artifact.paths.filter((row) => !row.priorUnion).length,
    missingStockfishPaths: artifact.paths.filter((row) => row.needsStockfish).length,
    missingStockfishFens: new Set(artifact.paths.filter((row) => row.needsStockfish).map((row) => row.fen)).size,
    missingMaiaPaths: artifact.paths.filter((row) => row.needsMaia).length }, null, 2)}\n`);
}
