// Disposable D3262 exact missing deeper provider jobs for the corrected
// first-reply frontier. FEN dedup is valid for Stockfish, never for Maia.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-exact-replies.json", "d3262-coherent-first-reply-frontier.json",
  "d3262-stockfish-horizon4-capture.json", "d3262-maia-horizon4-path-capture.json"];
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(row) { return JSON.stringify([row.rootId, row.candidateUci, row.replyUci]); }

export function compileCoherentDeeperSupplementFrame(graph, frontier, engine, maia, inputDigests) {
  check(graph.profile === "d3262-coherent-root-v1"
    && graph.authority === "coherent_root_complete_legal_reply_edges_not_semantic_proof"
    && frontier.profile === "d3262-coherent-first-reply-v1"
    && frontier.authority === "corrected_provider_reply_reach_not_semantic_proof_or_defence_quality"
    && frontier.manifest === graph.manifest && frontier.rows.length === 193,
  "Crossed corrected deeper frame");
  check(engine.partial === false && engine.source.multiPv === "top8_legal_moves_at_selected_reply"
    && engine.manifest === graph.manifest && engine.rows.length === 2185
    && maia.authority === "path_keyed_maia_horizon_four_full_legal_distribution_not_human_frequency_or_proof"
    && maia.source.historyUci === "root_candidate_reply_path_per_row"
    && maia.manifest === graph.manifest && maia.rows.length === 2189,
  "Crossed prior deeper provider sources");
  const engineByFen = new Map(engine.rows.map((row) => [row.fen, row]));
  const maiaByPath = new Map(maia.rows.map((row) => [key(row), row]));
  check(engineByFen.size === engine.rows.length && maiaByPath.size === maia.rows.length,
    "Duplicated prior deeper provider identity");
  const graphRoots = new Map(graph.roots.map((root) => [root.rootId, root]));
  const paths = frontier.rows.flatMap((row) => row.replies.map((reply) => {
    const root = graphRoots.get(row.rootId);
    const candidate = root?.candidates.find((entry) => entry.candidateUci === row.candidateUci);
    const exact = candidate?.replies.find((entry) => entry.uci === reply.uci);
    check(exact?.fen === reply.fen, `Selected reply has no exact path ${key({ ...row, replyUci: reply.uci })}`);
    const subject = { rootId: row.rootId, candidateUci: row.candidateUci,
      replyUci: reply.uci, rootFen: root.fen, historyUci: [row.candidateUci, reply.uci],
      fen: reply.fen, selectedBy: reply.selectedBy };
    const priorMaia = maiaByPath.get(key(subject));
    if (priorMaia) check(priorMaia.fen === subject.fen && priorMaia.rootFen === subject.rootFen
      && JSON.stringify(priorMaia.historyUci) === JSON.stringify(subject.historyUci),
    `Prior Maia path crossed corrected source ${key(subject)}`);
    return subject;
  }));
  check(paths.length === 1966 && new Set(paths.map(key)).size === paths.length,
    "Corrected first-reply path denominator changed");
  const maiaJobs = paths.filter((row) => !maiaByPath.has(key(row))).map((row) => ({
    id: sha(key(row)), ...row,
  }));
  const missingEngine = new Map();
  for (const row of paths) if (!engineByFen.has(row.fen)) {
    const job = missingEngine.get(row.fen) ?? { id: sha(row.fen), fen: row.fen, paths: [] };
    job.paths.push({ rootId: row.rootId, candidateUci: row.candidateUci,
      replyUci: row.replyUci, selectedBy: row.selectedBy });
    missingEngine.set(row.fen, job);
  }
  const engineJobs = [...missingEngine.values()].sort((left, right) => left.fen.localeCompare(right.fen));
  check(maiaJobs.length === 250 && engineJobs.length === 267,
    `Corrected deeper supplement changed: Maia ${maiaJobs.length}, engine ${engineJobs.length}`);
  return { version: 1, profile: "d3262-coherent-deeper-supplement-v1", manifest: graph.manifest,
    authority: "missing_deeper_provider_jobs_not_result_or_move_grade", inputDigests,
    summary: { selectedPaths: paths.length, maiaCovered: paths.length - maiaJobs.length,
      maiaMissing: maiaJobs.length, engineMissingPositions: engineJobs.length },
    maiaJobs, engineJobs };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = compileCoherentDeeperSupplementFrame(...inputs.map((bytes) => JSON.parse(bytes)),
    Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])));
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-deeper-supplement-frame.json`;
  if (process.argv.includes("--write")) writeFileSync(target, bytes, { flag: "wx" });
  else check(readFileSync(target, "utf8") === bytes, "Corrected deeper supplement differs from checked sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), ...artifact.summary }, null, 2)}\n`);
}
