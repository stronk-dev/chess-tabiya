// D3262 corrected selected-reply source join. Complete source coverage is not
// causal attribution, all-defence proof, or a product search profile.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-first-reply-frontier.json", "d3262-coherent-deeper-supplement-frame.json",
  "d3262-stockfish-horizon4-capture.json", "d3262-stockfish-coherent-deeper-supplement.json",
  "d3262-maia-horizon4-path-capture.json", "d3262-maia-coherent-deeper-supplement.json"];
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function pathKey(row) { return JSON.stringify([row.rootId, row.candidateUci, row.replyUci]); }
function indexed(rows, key) {
  const map = new Map(rows.map((row, index) => [key(row), { row, index }]));
  check(map.size === rows.length, "Duplicated deeper source identity");
  return map;
}

export function compileCoherentDeeperSourceUnion(frontier, supplement, oldEngine, newEngine, oldMaia, newMaia, inputDigests) {
  check(frontier.profile === "d3262-coherent-first-reply-v1"
    && supplement.profile === "d3262-coherent-deeper-supplement-v1"
    && frontier.manifest === supplement.manifest
    && frontier.rows.length === 193 && supplement.summary.selectedPaths === 1966,
  "Crossed corrected source population");
  check(oldEngine.manifest === frontier.manifest && newEngine.manifest === frontier.manifest
    && oldMaia.manifest === frontier.manifest && newMaia.manifest === frontier.manifest
    && oldEngine.rows.length === 2185 && newEngine.rows.length === 267
    && oldMaia.rows.length === 2189 && newMaia.rows.length === 250
    && oldEngine.source.executableDigest === newEngine.source.executableDigest
    && oldMaia.source.modelCheckpointSha256 === newMaia.source.modelCheckpointSha256
    && oldMaia.authority === "path_keyed_maia_horizon_four_full_legal_distribution_not_human_frequency_or_proof"
    && newMaia.authority === "coherent_deeper_path_keyed_maia_not_human_frequency_or_proof",
  "Crossed deeper provider captures");
  const engines = [indexed(oldEngine.rows, (row) => row.fen), indexed(newEngine.rows, (row) => row.fen)];
  const maias = [indexed(oldMaia.rows, pathKey), indexed(newMaia.rows, pathKey)];
  const newEngineFens = new Set(supplement.engineJobs.map((row) => row.fen));
  const newMaiaPaths = new Set(supplement.maiaJobs.map(pathKey));
  check(newEngineFens.size === 267 && newMaiaPaths.size === 250
    && [...newEngineFens].every((fen) => !engines[0].has(fen))
    && [...newMaiaPaths].every((path) => !maias[0].has(path))
    && newEngine.rows.every((row) => newEngineFens.has(row.fen))
    && newMaia.rows.every((row) => newMaiaPaths.has(pathKey(row))),
  "New provider capture does not match the declared missing jobs");
  const bindings = frontier.rows.flatMap((candidate) => candidate.replies.map((reply) => {
    const subject = { rootId: candidate.rootId, candidateUci: candidate.candidateUci,
      replyUci: reply.uci, fen: reply.fen };
    const engineNew = newEngineFens.has(subject.fen);
    const maiaNew = newMaiaPaths.has(pathKey(subject));
    const engine = engines[Number(engineNew)].get(subject.fen);
    const maia = maias[Number(maiaNew)].get(pathKey(subject));
    check(engine !== undefined && maia !== undefined && maia.row.fen === subject.fen
      && maia.row.rootId === subject.rootId && maia.row.candidateUci === subject.candidateUci
      && maia.row.replyUci === subject.replyUci
      && JSON.stringify(maia.row.historyUci) === JSON.stringify([subject.candidateUci, subject.replyUci]),
    `Selected reply missing exact provider source ${pathKey(subject)}`);
    return { id: sha(pathKey(subject)), ...subject,
      stockfish: { source: engineNew ? names[3] : names[2], row: engine.index },
      maia: { source: maiaNew ? names[5] : names[4], row: maia.index } };
  }));
  const uniquePaths = new Set(bindings.map((row) => row.id));
  const uniqueFens = new Set(bindings.map((row) => row.fen));
  check(bindings.length === 1966 && uniquePaths.size === 1966 && uniqueFens.size === 1965,
    "Corrected selected reply identity drifted");
  const summary = { selectedPaths: bindings.length, uniqueFens: uniqueFens.size,
    stockfishOldPaths: bindings.filter((row) => row.stockfish.source === names[2]).length,
    stockfishNewPaths: bindings.filter((row) => row.stockfish.source === names[3]).length,
    maiaOldPaths: bindings.filter((row) => row.maia.source === names[4]).length,
    maiaNewPaths: bindings.filter((row) => row.maia.source === names[5]).length };
  check(summary.stockfishNewPaths === 267 && summary.maiaOldPaths === 1716 && summary.maiaNewPaths === 250,
    "Corrected source partition drifted");
  return { version: 1, profile: "d3262-coherent-deeper-source-union-v1", manifest: frontier.manifest,
    authority: "complete_selected_reply_provider_source_join_not_semantic_proof",
    inputDigests, summary, bindings };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = compileCoherentDeeperSourceUnion(...inputs.map((bytes) => JSON.parse(bytes)),
    Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])));
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-deeper-source-union.json`;
  if (process.argv.includes("--write")) writeFileSync(target, bytes, { flag: "wx" });
  else check(readFileSync(target, "utf8") === bytes, "Corrected deeper source union differs from checked captures");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), ...artifact.summary }, null, 2)}\n`);
}
