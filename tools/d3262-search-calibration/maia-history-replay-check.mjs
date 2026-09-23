// Independent read-only join for the pinned Maia empty-FEN versus root-replayed
// child policy comparison. A model run writes the bytes; this checker cannot.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(rootId, candidateUci) { return `${rootId}|${candidateUci}`; }
function close(actual, expected, label) { check(Math.abs(actual - expected) <= 1e-7, `${label} differs from source`); }
function massRows(items, legal, label, sorted = false) {
  check(Array.isArray(items) && items.length > 0, `Missing ${label}`);
  const seen = new Set();
  let total = 0, last = Infinity;
  for (const item of items) {
    check(legal.has(item.legalUci) && !seen.has(item.legalUci), `Illegal or repeated ${label} move`);
    check(typeof item.mass === "number" && Number.isFinite(item.mass) && item.mass > 0 && item.mass <= 1, `Invalid ${label} mass`);
    if (sorted) check(item.mass <= last + 1e-10, `Unsorted ${label}`);
    seen.add(item.legalUci);
    total += item.mass;
    last = item.mass;
  }
  check(Math.abs(total - 1) < 1e-5, `${label} does not normalize`);
  return new Map(items.map((item) => [item.legalUci, item.mass]));
}
function prefix(items, threshold) {
  const result = [];
  let covered = 0;
  for (const item of items.slice(0, 8)) {
    if (covered >= threshold) break;
    result.push(item.legalUci);
    covered += item.mass;
  }
  return result;
}
function top(items) { return items.reduce((best, item) => item.mass > best.mass ? item : best).legalUci; }

export function validateMaiaHistoryReplay(graph, graphBytes, direct, directBytes, replay) {
  check(replay.version === 1 && replay.manifest === graph.manifest && replay.manifest === direct.manifest, "Crossed Maia replay manifest");
  check(replay.authority === "root_replayed_maia_child_distribution_not_human_frequency_or_search_result", "Wrong Maia replay authority");
  check(replay.inputDigests?.["d3262-maia-direct-logits.json"] === sha(directBytes)
    && replay.inputDigests?.["d3262-exact-replies.json"] === sha(graphBytes), "Maia replay source digest mismatch");
  check(direct.positions === 196 && direct.rows.length === 196 && replay.positions === 196 && replay.rows.length === 196, "Incomplete Maia replay");
  const source = replay.source;
  check(source.modelId === direct.source.modelId && source.modelCheckpointSha256 === direct.source.modelCheckpointSha256
    && source.uciSourceSha256 === direct.source.uciSourceSha256 && source.mode === "human_common"
    && source.band === 1400 && source.temperature === 0.8 && source.topP === 0.92
    && source.useUciHistory === true && source.historyUci === "root_candidate_path_per_row"
    && source.preRootHistory === "unavailable_not_inferred" && source.device === "cpu", "Maia replay source or history differs");
  const graphChildren = new Map(graph.roots.flatMap((root) => root.candidates.map((candidate) => [key(root.rootId, candidate.candidateUci), { rootFen: root.fen, fen: candidate.afterFen, legal: new Set(candidate.replies.map((reply) => reply.uci)) }])));
  check(graphChildren.size === 196, "Exact graph child population changed");
  const seen = new Set();
  const rows = [];
  for (let index = 0; index < 196; index += 1) {
    const row = replay.rows[index], empty = direct.rows[index];
    const identity = key(row.rootId, row.candidateUci);
    check(identity === key(empty.rootId, empty.candidateUci) && !seen.has(identity), `Crossed or duplicated Maia replay row ${index}`);
    seen.add(identity);
    const child = graphChildren.get(identity);
    check(child !== undefined && row.rootFen === child.rootFen && row.fen === child.fen && empty.fen === child.fen
      && JSON.stringify(row.historyUci) === JSON.stringify([row.candidateUci]), `Maia replay path mismatch ${index}`);
    const raw = massRows(row.rawFullLegal, child.legal, `replayed raw ${index}`);
    check(raw.size === child.legal.size && row.rawFullLegal.every((item, n) => n === 0 || row.rawFullLegal[n - 1].legalUci < item.legalUci), `Incomplete or unordered replayed legal population ${index}`);
    const configured = massRows(row.configuredSupport, child.legal, `replayed configured ${index}`, true);
    const emptyRaw = massRows(empty.rawFullLegal, child.legal, `empty raw ${index}`);
    const emptyConfigured = massRows(empty.configuredSupport, child.legal, `empty configured ${index}`, true);
    const rawTv = [...raw].reduce((sum, [move, mass]) => sum + Math.abs(mass - emptyRaw.get(move)), 0) / 2;
    const configuredTv = [...child.legal].reduce((sum, move) => sum + Math.abs((configured.get(move) ?? 0) - (emptyConfigured.get(move) ?? 0)), 0) / 2;
    close(row.rawTotalVariationFromEmpty, rawTv, `Raw total variation ${index}`);
    close(row.configuredTotalVariationFromEmpty, configuredTv, `Configured total variation ${index}`);
    check(row.emptyTopMove === top(empty.rawFullLegal) && row.pathTopMove === top(row.rawFullLegal), `Maia top-move comparison mismatch ${index}`);
    for (const [name, items, threshold] of [["emptyPrefix80", empty.configuredSupport, 0.8], ["pathPrefix80", row.configuredSupport, 0.8], ["emptyPrefix90", empty.configuredSupport, 0.9], ["pathPrefix90", row.configuredSupport, 0.9]]) {
      check(JSON.stringify(row[name]) === JSON.stringify(prefix(items, threshold)), `Maia ${name} mismatch ${index}`);
    }
    rows.push(row);
  }
  check(seen.size === graphChildren.size, "Maia replay omitted an exact child");
  return {
    positions: rows.length,
    changedRaw: rows.filter((row) => row.rawTotalVariationFromEmpty > 0.000001).length,
    changedPrefix80: rows.filter((row) => JSON.stringify(row.emptyPrefix80) !== JSON.stringify(row.pathPrefix80)).length,
    changedPrefix90: rows.filter((row) => JSON.stringify(row.emptyPrefix90) !== JSON.stringify(row.pathPrefix90)).length,
    changedTopMove: rows.filter((row) => row.emptyTopMove !== row.pathTopMove).length,
    maxRawTotalVariation: Math.max(...rows.map((row) => row.rawTotalVariationFromEmpty)),
    maxConfiguredTotalVariation: Math.max(...rows.map((row) => row.configuredTotalVariationFromEmpty)),
  };
}

if (process.argv[1]?.endsWith("maia-history-replay-check.mjs")) {
  const graphBytes = readFileSync(`${directory}/d3262-exact-replies.json`);
  const directBytes = readFileSync(`${directory}/d3262-maia-direct-logits.json`);
  const replayBytes = readFileSync(`${directory}/d3262-maia-history-replay.json`);
  const summary = validateMaiaHistoryReplay(JSON.parse(graphBytes), graphBytes, JSON.parse(directBytes), directBytes, JSON.parse(replayBytes));
  process.stdout.write(`${JSON.stringify({ digest: sha(replayBytes), ...summary }, null, 2)}\n`);
}
