// Disposable D3262 corrected first-reply provider frontier. This records
// engine rank and configured Maia reach, not defence quality or a target proof.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const names = [
  "d3262-coherent-exact-replies.json",
  "d3262-stockfish-child-coherent.json",
  "d3262-stockfish-new-child-coherent.json",
  "d3262-maia-history-replay.json",
  "d3262-maia-coherent-new-child.json",
];
const budgets = ["depth8", "depth12", "movetime100"];
const widths = [2, 4, 8];
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(row) { return JSON.stringify([row.rootId, row.candidateUci]); }
function equalSet(left, right) { return left.length === right.length && new Set(left).size === left.length && left.every((value) => right.includes(value)); }
function sourceMap(source) {
  const map = new Map(source.rows.map((row) => [key(row), row]));
  check(map.size === source.rows.length, "Duplicated provider child path");
  return map;
}
function prefix(support, threshold) {
  let mass = 0;
  const selected = [];
  for (const entry of support.slice(0, 8)) {
    if (mass >= threshold) break;
    selected.push(entry.legalUci);
    mass += entry.mass;
  }
  return selected;
}

export function compileCoherentFirstReplyFrontier(graph, oldEngine, newEngine, oldMaia, newMaia, inputDigests) {
  check(graph.profile === "d3262-coherent-root-v1"
    && graph.authority === "coherent_root_complete_legal_reply_edges_not_semantic_proof"
    && graph.roots.length === 66, "Wrong corrected legal-reply graph");
  check(oldEngine.source.multiPv === "top8_legal_moves_at_candidate_child"
    && newEngine.source.multiPv === oldEngine.source.multiPv
    && oldEngine.source.executableDigest === newEngine.source.executableDigest
    && oldEngine.manifest === graph.manifest && newEngine.manifest === graph.manifest
    && oldEngine.rows.length === 196 && newEngine.rows.length === 3,
  "Crossed coherent Stockfish sources");
  const modelFields = ["modelId", "modelCheckpointSha256", "uciSourceSha256", "mode", "band", "temperature", "topP", "useUciHistory", "device", "rawMeaning", "configuredMeaning", "preRootHistory"];
  check(oldMaia.source.historyUci === "root_candidate_path_per_row"
    && newMaia.source.historyUci === oldMaia.source.historyUci
    && modelFields.every((field) => oldMaia.source[field] === newMaia.source[field])
    && oldMaia.manifest === graph.manifest && newMaia.manifest === graph.manifest
    && oldMaia.rows.length === 196 && newMaia.rows.length === 3,
  "Crossed Maia path-history sources");
  const engines = [sourceMap(oldEngine), sourceMap(newEngine)];
  const maias = [sourceMap(oldMaia), sourceMap(newMaia)];
  const graphRows = graph.roots.flatMap((root) => root.candidates.map((candidate) => ({ rootId: root.rootId, rootFen: root.fen, ...candidate })));
  check(graphRows.length === 193 && graphRows.reduce((sum, row) => sum + row.replyCount, 0) === 6176,
    "Corrected candidate/reply denominator changed");
  const graphKeys = new Set(graphRows.map(key));
  check(graphKeys.size === 193, "Duplicated corrected graph child path");
  const newKeys = new Set(newEngine.rows.map(key));
  check(newKeys.size === 3 && [...newKeys].every((value) => graphKeys.has(value)), "New child source crossed corrected frame");
  check(graphRows.filter((row) => !engines[0].has(key(row))).length === 3
    && graphRows.every((row) => engines[0].has(key(row)) || newKeys.has(key(row))),
  "Old engine source missing a retained corrected path");
  check(new Set(newMaia.rows.map(key)).size === 3
    && newMaia.rows.every((row) => newKeys.has(key(row))), "New Maia paths do not match new engine paths");
  let oldCount = 0;
  const rows = graphRows.map((candidate) => {
    const isNew = newKeys.has(key(candidate));
    oldCount += Number(!isNew);
    const engine = engines[Number(isNew)].get(key(candidate));
    const maia = maias[Number(isNew)].get(key(candidate));
    check(engine !== undefined && maia !== undefined
      && engine.fen === candidate.afterFen && maia.fen === candidate.afterFen,
    `Missing or crossed provider child ${key(candidate)}`);
    check(maia.rootFen === candidate.rootFen && maia.historyUci.length === 1
      && maia.historyUci[0] === candidate.candidateUci,
    `Crossed Maia history ${key(candidate)}`);
    const legal = candidate.replies.map((reply) => reply.uci);
    const selected = new Map();
    function add(uci, role) {
      check(legal.includes(uci), `Provider selected illegal reply ${key(candidate)}/${uci}`);
      const roles = selected.get(uci) ?? new Set();
      roles.add(role);
      selected.set(uci, roles);
    }
    check(engine.probes.length === budgets.length, `Missing engine budget ${key(candidate)}`);
    for (let index = 0; index < budgets.length; index += 1) {
      const probe = engine.probes[index];
      check(probe.budget === budgets[index] && equalSet(probe.legal, legal)
        && probe.entries.length === Math.min(8, legal.length)
        && probe.entries.every((entry, rank) => entry.rank === rank + 1 && legal.includes(entry.moveUci)),
      `Engine ranked reply mismatch ${key(candidate)}/${budgets[index]}`);
      for (const entry of probe.entries) for (const width of widths) {
        if (entry.rank <= width) add(entry.moveUci, `engine:${probe.budget}:top${width}`);
      }
    }
    check(equalSet(maia.rawFullLegal.map((entry) => entry.legalUci), legal)
      && maia.configuredSupport.every((entry) => legal.includes(entry.legalUci) && entry.mass > 0)
      && Math.abs(maia.configuredSupport.reduce((sum, entry) => sum + entry.mass, 0) - 1) < 1e-5,
    `Maia legal or configured mass mismatch ${key(candidate)}`);
    for (const threshold of [0.8, 0.9]) for (const uci of prefix(maia.configuredSupport, threshold)) {
      add(uci, `maia:prefix${threshold.toFixed(2)}`);
    }
    return { rootId: candidate.rootId, candidateUci: candidate.candidateUci,
      providerPartition: isNew ? "new3" : "retained190", legalReplyCount: legal.length,
      replies: [...selected].sort(([left], [right]) => left.localeCompare(right)).map(([uci, roles]) => ({
        uci, fen: candidate.replies.find((reply) => reply.uci === uci).fen,
        selectedBy: [...roles].sort(),
      })) };
  });
  check(oldCount === 190 && rows.filter((row) => row.providerPartition === "new3").length === 3,
    "Provider partition drifted");
  return { version: 1, profile: "d3262-coherent-first-reply-v1", manifest: graph.manifest,
    authority: "corrected_provider_reply_reach_not_semantic_proof_or_defence_quality",
    budgets, widths, maiaThresholds: [0.8, 0.9], inputDigests, rows };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const inputs = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = compileCoherentFirstReplyFrontier(...inputs.map((bytes) => JSON.parse(bytes)),
    Object.fromEntries(names.map((name, index) => [name, sha(inputs[index])])));
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-coherent-first-reply-frontier.json`;
  if (process.argv.includes("--write")) writeFileSync(target, bytes, { flag: "wx" });
  else check(readFileSync(target, "utf8") === bytes, "Corrected first-reply frontier differs from checked sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(bytes), candidates: artifact.rows.length,
    selectedPaths: artifact.rows.reduce((sum, row) => sum + row.replies.length, 0),
    byPartition: Object.fromEntries(["retained190", "new3"].map((partition) => [partition,
      artifact.rows.filter((row) => row.providerPartition === partition).reduce((sum, row) => sum + row.replies.length, 0)])) }, null, 2)}\n`);
}
