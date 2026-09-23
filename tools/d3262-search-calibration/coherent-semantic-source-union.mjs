// Join the preselected all-legal semantic-event paths to concrete provider
// captures. Source availability is not a semantic outcome or a move grade.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = [
  "d3262-coherent-semantic-provider-gap.json",
  "d3262-coherent-semantic-supplement-frame.json",
  "d3262-stockfish-coherent-semantic-supplement.json",
  "d3262-maia-coherent-semantic-supplement.json",
];
const sha = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
function key(row) { return JSON.stringify([row.rootId, row.candidateUci, row.replyUci]); }

export function compileSemanticSourceUnion(gap, frame, engine, maia, digests) {
  check(gap.profile === "d3262-coherent-semantic-provider-gap-v1"
    && frame.profile === "d3262-coherent-semantic-supplement-v1"
    && gap.manifest === frame.manifest && frame.manifest === engine.manifest
    && engine.manifest === maia.manifest && gap.paths.length === 152,
  "Crossed semantic source population");
  check(frame.inputDigests["d3262-coherent-semantic-provider-gap.json"] === digests[names[0]]
    && engine.frontierDigest === digests[names[1]]
    && maia.inputDigests["d3262-coherent-semantic-supplement-frame.json"] === digests[names[1]],
  "Semantic supplement source digest mismatch");
  check(frame.engineJobs.length === 1 && frame.maiaJobs.length === 1
    && engine.rows.length === 1 && maia.rows.length === 1,
  "Semantic supplement denominator changed");
  const missing = gap.paths.filter((row) => row.needsStockfish || row.needsMaia);
  check(missing.length === 1 && missing[0].needsStockfish && missing[0].needsMaia,
    "Semantic supplement is not the single preselected missing pair");
  const path = missing[0];
  const engineJob = frame.engineJobs[0], maiaJob = frame.maiaJobs[0];
  check(engineJob.paths.length === 1 && key(engineJob.paths[0]) === key(path)
    && key(maiaJob) === key(path) && key(maia.rows[0]) === key(path)
    && path.fen === engineJob.fen && path.fen === maiaJob.fen
    && path.fen === engine.rows[0].fen && path.fen === maia.rows[0].fen
    && engine.rows[0].jobId === engineJob.id && maia.rows[0].id === maiaJob.id
    && JSON.stringify(maia.rows[0].historyUci) === JSON.stringify(maiaJob.historyUci),
  "Semantic supplement crossed an exact source path");
  const bindings = gap.paths.map((row) => {
    const isMissing = key(row) === key(path);
    const stockfish = isMissing
      ? { source: names[2], row: 0, fen: row.fen } : row.stockfish;
    const human = isMissing
      ? { source: names[3], row: 0, fen: row.fen } : row.maia;
    check(stockfish?.fen === row.fen && human?.fen === row.fen
      && row.needsStockfish === isMissing && row.needsMaia === isMissing,
    `Semantic provider binding absent or crossed: ${key(row)}`);
    return { rootId: row.rootId, candidateUci: row.candidateUci, replyUci: row.replyUci,
      fen: row.fen, priorUnion: row.priorUnion, stockfish, maia: human };
  });
  check(new Set(bindings.map(key)).size === 152, "Duplicate semantic source binding");
  return { version: 1, profile: "d3262-coherent-semantic-source-union-v1", manifest: gap.manifest,
    authority: "source_complete_for_predeclared_all_legal_semantic_events_not_search_or_reason_verdict",
    inputDigests: digests, bindings };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const digests = Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])]));
  const artifact = compileSemanticSourceUnion(...bytes.map((value) => JSON.parse(value)), digests);
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-semantic-source-union.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Semantic source union differs from sealed inputs");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), selectedPaths: artifact.bindings.length,
    priorUnionPaths: artifact.bindings.filter((row) => row.priorUnion).length,
    supplementPaths: artifact.bindings.filter((row) => row.stockfish.source === names[2]).length,
    missingStockfish: artifact.bindings.filter((row) => !row.stockfish).length,
    missingMaia: artifact.bindings.filter((row) => !row.maia).length }, null, 2)}\n`);
}
