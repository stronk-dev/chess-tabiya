// Disposable D3262 capture frame for the three partial search frontiers.
// This schedules the next provider layer; it neither evaluates a hypothesis
// nor chooses a production pruning profile.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const path = (name) => `planning/semantic-consequence-search/${name}`;
const budgets = Object.freeze(["depth8", "depth12", "movetime100"]);
function check(value, message) { if (!value) throw new Error(message); }
function pairKey(row) { return `${row.rootId}|${row.candidateUci}`; }
function edgeKey(row, uci) { return `${pairKey(row)}|${uci}`; }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function compileHorizon4Frontier(graph, engine, maia, semantic) {
  check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof" && graph.roots.length === 66, "Wrong exact reply graph");
  check(engine.manifest === graph.manifest && engine.authority === "stockfish_horizon_two_ranked_reply_beam_not_proof_or_move_grade", "Crossed engine frontier");
  check(maia.manifest === graph.manifest && maia.authority === "direct_configured_maia_horizon_two_mass_not_defence_quality_or_move_grade", "Crossed configured Maia frontier");
  check(semantic.manifest === graph.manifest && semantic.authority === "source_blind_relation_event_engine_rank_frontier_not_profit_or_proof", "Crossed semantic frontier");
  const candidates = new Map(graph.roots.flatMap((root) => root.candidates.map((candidate) => [`${root.rootId}|${candidate.candidateUci}`, { rootId: root.rootId, ...candidate }])));
  check(candidates.size === 196 && engine.rows.length === 196 * budgets.length * 3 && maia.rows.length === 196 && semantic.rows.length === 185 * budgets.length * 3, "Frontier population drift");
  check(new Set(engine.rows.map((row) => `${pairKey(row)}|${row.budget}|${row.width}`)).size === engine.rows.length, "Duplicated engine frontier row");
  check(new Set(maia.rows.map(pairKey)).size === maia.rows.length, "Duplicated Maia frontier row");
  check(new Set(semantic.rows.map((row) => `${pairKey(row)}|${row.targetId}|${row.budget}|${row.width}`)).size === semantic.rows.length, "Duplicated semantic frontier row");
  const selected = new Map();
  const roles = new Map();
  function add(row, uci, arm) {
    const candidate = candidates.get(pairKey(row));
    check(candidate !== undefined, `Unknown candidate ${pairKey(row)}`);
    const reply = candidate.replies.find((value) => value.uci === uci);
    check(reply !== undefined, `Selected reply absent from exact legal graph ${edgeKey(row, uci)}`);
    const key = edgeKey(row, uci);
    selected.set(key, { rootId: row.rootId, candidateUci: row.candidateUci, replyUci: uci, fen: reply.fen });
    const arms = roles.get(key) ?? new Set();
    arms.add(arm);
    roles.set(key, arms);
  }
  const engineRows = engine.rows.filter((row) => row.width === 8);
  check(engineRows.length === 196 * budgets.length, "Incomplete width-eight engine frontier");
  const engineWide = new Map(engineRows.map((row) => [`${pairKey(row)}|${row.budget}`, new Set(row.selected.map((entry) => entry.moveUci))]));
  for (const row of engine.rows.filter((value) => value.width < 8)) check(row.selected.every((entry) => engineWide.get(`${pairKey(row)}|${row.budget}`)?.has(entry.moveUci)), `Engine widths are not nested ${pairKey(row)}/${row.budget}`);
  for (const row of engineRows) {
    check(budgets.includes(row.budget) && row.selected.length <= 8 && row.retainedCount === row.legalReplyCount, `Incomplete engine order ${pairKey(row)}/${row.budget}`);
    for (const entry of row.selected) add(row, entry.moveUci, `engine:${row.budget}`);
  }
  for (const row of maia.rows) {
    const candidate = candidates.get(pairKey(row));
    check(candidate !== undefined && row.legalReplyCount === candidate.replyCount, `Crossed Maia candidate ${pairKey(row)}`);
    const total = row.configuredSupport.reduce((sum, value) => sum + value.mass, 0);
    check(Math.abs(total - 1) < 1e-5, `Unreconciled configured Maia mass ${pairKey(row)}`);
    check(row.configuredSupport.every((entry, index) => entry.mass > 0 && (index === 0 || row.configuredSupport[index - 1].mass >= entry.mass)), `Unordered Maia support ${pairKey(row)}`);
    let covered = 0;
    for (const entry of row.configuredSupport.slice(0, 8)) {
      if (covered < 0.8) add(row, entry.legalUci, "maia:0.80");
      if (covered < 0.9) add(row, entry.legalUci, "maia:0.90");
      covered += entry.mass;
      if (covered >= 0.9) break;
    }
  }
  const semanticRows = semantic.rows.filter((row) => row.width === 8);
  check(semanticRows.length === 185 * budgets.length, "Incomplete width-eight semantic frontier");
  const semanticWide = new Map(semanticRows.map((row) => [`${pairKey(row)}|${row.targetId}|${row.budget}`, new Set(row.selected)]));
  for (const row of semantic.rows.filter((value) => value.width < 8)) check(row.selected.every((uci) => semanticWide.get(`${pairKey(row)}|${row.targetId}|${row.budget}`)?.has(uci)), `Semantic widths are not nested ${pairKey(row)}/${row.budget}`);
  for (const row of semanticRows) {
    check(budgets.includes(row.budget) && row.selected.length <= 8, `Invalid semantic frontier ${pairKey(row)}/${row.budget}`);
    for (const uci of row.selected) add(row, uci, `semantic:${row.budget}`);
  }
  const paths = [...selected].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => ({ ...value, selectedBy: [...roles.get(key)].sort() }));
  const byFen = new Map();
  for (const row of paths) {
    const job = byFen.get(row.fen) ?? { fen: row.fen, paths: [] };
    job.paths.push({ rootId: row.rootId, candidateUci: row.candidateUci, replyUci: row.replyUci, selectedBy: row.selectedBy });
    byFen.set(row.fen, job);
  }
  const jobs = [...byFen.values()].sort((left, right) => left.fen.localeCompare(right.fen)).map((job) => ({ id: sha(job.fen), ...job }));
  check(paths.length > 0 && jobs.length > 0, "Empty horizon-four provider frame");
  return { version: 1, manifest: graph.manifest, authority: "partial_frontier_provider_capture_frame_not_search_result", budgets, maiaThresholds: [0.8, 0.9], width: 8, paths, jobs };
}

if (process.argv[1]?.endsWith("horizon4-frontier.mjs")) {
  const names = ["d3262-exact-replies.json", "d3262-stockfish-child-beam.json", "d3262-maia-direct-mass-frontier.json", "d3262-semantic-relation-event-reserve.json"];
  const bytes = names.map((name) => readFileSync(path(name)));
  const artifact = { ...compileHorizon4Frontier(...bytes.map((value) => JSON.parse(value.toString()))), inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = path("d3262-horizon4-frontier.json");
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 horizon-four capture frame differs from frozen sources");
  const byArm = Object.fromEntries([...new Set(artifact.paths.flatMap((row) => row.selectedBy))].sort().map((arm) => [arm, artifact.paths.filter((row) => row.selectedBy.includes(arm)).length]));
  process.stdout.write(`${JSON.stringify({ digest: sha(output), paths: artifact.paths.length, uniquePositions: artifact.jobs.length, byArm }, null, 2)}\n`);
}
