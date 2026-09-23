// Independent, read-only join for the pinned Maia3 direct-logit research receipt.
// Full legal raw masses determine the configured support; no top-20 tail guess.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

function check(value, message) { if (!value) throw new Error(message); }
function digest(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(rootId, candidateUci) { return `${rootId}|${candidateUci}`; }
function close(left, right, tolerance = 0.000_001) { return Math.abs(left - right) <= tolerance; }
function configuredFromFullRaw(raw) {
  const weights = raw.map((item) => ({ legalUci: item.legalUci, weight: item.mass ** 1.25 }))
    .sort((left, right) => right.weight - left.weight || left.legalUci.localeCompare(right.legalUci));
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let cumulative = 0;
  const selected = [];
  for (const [index, item] of weights.entries()) {
    cumulative += item.weight / total;
    if (index === 0 || cumulative <= 0.92) selected.push(item);
  }
  const retained = selected.reduce((sum, item) => sum + item.weight, 0);
  return new Map(selected.map((item) => [item.legalUci, item.weight / retained]));
}

export function validateMaiaDirectLogits(direct, capture, reconstruction, graph, captureBytes, reconstructionBytes) {
  check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof", "Wrong direct-logit legal authority");
  check(direct.version === 1 && direct.manifest === graph.manifest && direct.manifest === capture.manifest && direct.manifest === reconstruction.manifest, "Crossed direct-logit manifest");
  check(direct.captureDigest === digest(captureBytes) && direct.reconstructionDigest === digest(reconstructionBytes), "Direct-logit source digests differ");
  const source = direct.source;
  check(source.modelId === "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe" && source.modelCheckpointSha256 === "sha256:ba14208b2992d85502f5fb501934abf6aaaeb355e9f3fdf90e326911f562524f" && source.uciSourceSha256 === "sha256:0f2905bb668f0cb8af6b175e698756d89472b200c36e3f3410ff98390e35474d", "Wrong direct Maia model source");
  check(source.mode === "human_common" && source.band === 1400 && source.temperature === 0.8 && source.topP === 0.92 && source.useUciHistory === true && source.historyUci.length === 0 && source.device === "cpu", "Direct Maia configuration differs");
  check(source.rawMeaning === "direct_full_legal_softmax_logits" && source.configuredMeaning === "direct_sample_from_logits_support_and_normalized_mass", "Direct Maia probability authority differs");
  const positions = graph.roots.flatMap((root) => root.candidates.map((candidate) => ({ rootId: root.rootId, candidateUci: candidate.candidateUci, fen: candidate.afterFen, legal: candidate.replies.map((reply) => reply.uci).sort() })));
  check(positions.length === 196 && direct.positions === 196 && direct.rows?.length === 196 && capture.rows?.length === 196 && reconstruction.rows?.length === 196, "Direct Maia position population incomplete");
  let rawMoves = 0, configuredMoves = 0, topWindowMatches = 0, stableMatches = 0, stableIntervalMatches = 0, unresolved = 0;
  for (let index = 0; index < positions.length; index += 1) {
    const expected = positions[index], row = direct.rows[index], captured = capture.rows[index], bounded = reconstruction.rows[index];
    check(row.rootId === expected.rootId && row.candidateUci === expected.candidateUci && row.fen === expected.fen, `Crossed direct Maia position ${index}`);
    check(captured.rootId === row.rootId && captured.candidateUci === row.candidateUci && captured.fen === row.fen && captured.status === "captured", `Crossed Maia top window ${index}`);
    check(bounded.rootId === row.rootId && bounded.candidateUci === row.candidateUci, `Crossed bounded Maia window ${index}`);
    const raw = row.rawFullLegal;
    check(Array.isArray(raw) && raw.length === expected.legal.length && JSON.stringify(raw.map((item) => item.legalUci)) === JSON.stringify(expected.legal), `Direct Maia legal set incomplete at ${index}`);
    check(raw.every((item) => Number.isFinite(item.mass) && item.mass >= 0 && item.mass <= 1), `Invalid direct raw mass at ${index}`);
    check(close(raw.reduce((sum, item) => sum + item.mass, 0), 1, 0.000_002), `Direct raw distribution not normalized at ${index}`);
    const rawByMove = new Map(raw.map((item) => [item.legalUci, item.mass]));
    for (const candidate of captured.candidates) {
      check(rawByMove.has(candidate.legalUci) && close(rawByMove.get(candidate.legalUci), candidate.mass, 0.000_000_001), `Direct/top-window raw mass differs at ${index}/${candidate.legalUci}`);
      topWindowMatches += 1;
    }
    const computed = configuredFromFullRaw(raw);
    const actual = row.configuredSupport;
    check(Array.isArray(actual) && actual.length === computed.size && new Set(actual.map((item) => item.legalUci)).size === actual.length, `Direct Maia configured support differs at ${index}`);
    check(close(actual.reduce((sum, item) => sum + item.mass, 0), 1, 0.000_002), `Direct configured mass not normalized at ${index}`);
    for (const item of actual) check(computed.has(item.legalUci) && close(computed.get(item.legalUci), item.mass, 0.000_001), `Direct configured mass differs at ${index}/${item.legalUci}`);
    if (bounded.status === "certified_returned_support") {
      const projected = new Map(bounded.support.map((item) => [item.legalUci, item]));
      check(projected.size === actual.length && actual.every((item) => projected.has(item.legalUci)), `Bounded support failed direct-logit validation at ${index}`);
      stableMatches += 1;
      for (const item of actual) {
        const [minimum, maximum] = projected.get(item.legalUci).configuredMassInterval;
        check(minimum <= item.mass && item.mass <= maximum, `Direct mass escaped bounded interval at ${index}/${item.legalUci}`);
        stableIntervalMatches += 1;
      }
    } else unresolved += 1;
    rawMoves += raw.length;
    configuredMoves += actual.length;
  }
  return { positions: positions.length, rawMoves, configuredMoves, topWindowMatches, stableMatches, stableIntervalMatches, boundedUnresolved: unresolved };
}

if (process.argv[1]?.endsWith("maia-direct-logits-check.mjs")) {
  const directBytes = readFileSync("planning/semantic-consequence-search/d3262-maia-direct-logits.json");
  const captureBytes = readFileSync("planning/semantic-consequence-search/d3262-maia-child-capture.json");
  const reconstructionBytes = readFileSync("planning/semantic-consequence-search/d3262-maia-configured-window.json");
  const graph = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json", "utf8"));
  const result = validateMaiaDirectLogits(JSON.parse(directBytes.toString()), JSON.parse(captureBytes.toString()), JSON.parse(reconstructionBytes.toString()), graph, captureBytes, reconstructionBytes);
  process.stdout.write(`${JSON.stringify({ digest: digest(directBytes), ...result }, null, 2)}\n`);
}
