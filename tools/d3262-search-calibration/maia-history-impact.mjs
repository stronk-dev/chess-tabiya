// Disposable D3262/D3286 effect of replayed history on the already frozen
// first-child Maia frontier. It does not rewrite that source or pick a new
// production profile from observed target outcomes.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { compileMaiaDirectMassFrontier } from "./maia-direct-mass-frontier.mjs";
import { validateMaiaHistoryReplay } from "./maia-history-replay-check.mjs";

const root = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(row) { return `${row.rootId}|${row.candidateUci}`; }
function namedKey(row) { return `${row.rootId}|${row.targetId}|${row.candidateUci}`; }
function prefix(support, threshold) {
  const moves = [];
  let covered = 0;
  for (const item of support.slice(0, 8)) {
    if (covered >= threshold) break;
    moves.push(item.legalUci);
    covered += item.mass;
  }
  return moves;
}
function selected(frontier, threshold) {
  return new Set(frontier.rows.flatMap((row) => prefix(row.configuredSupport, threshold).map((move) => `${key(row)}|${move}`)));
}
function counts(rows) { return Object.fromEntries([...new Set(rows.map((row) => row.status))].sort().map((status) => [status, rows.filter((row) => row.status === status).length])); }

export function compileMaiaHistoryImpact(comparisons, material, witness, graph, graphBytes, direct, directBytes, replay, previous) {
  validateMaiaHistoryReplay(graph, graphBytes, direct, directBytes, replay);
  const reconstructedOld = compileMaiaDirectMassFrontier(comparisons, material, witness, direct);
  check(JSON.stringify(reconstructedOld.rows) === JSON.stringify(previous.rows)
    && JSON.stringify(reconstructedOld.named) === JSON.stringify(previous.named), "Frozen empty-history Maia frontier drift");
  const path = compileMaiaDirectMassFrontier(comparisons, material, witness, replay);
  const oldNamed = new Map(previous.named.map((row) => [namedKey(row), row]));
  const source = new Set(witness.rows.filter((row) => row.status === "named_pawn_punishment_witness").map(namedKey));
  const named = path.named.map((row) => {
    const old = oldNamed.get(namedKey(row));
    check(old !== undefined && old.namedReplyUci === row.namedReplyUci, `Crossed named Maia policy ${namedKey(row)}`);
    return {
      rootId: row.rootId, targetId: row.targetId, candidateUci: row.candidateUci,
      namedReplyUci: row.namedReplyUci, sourcePawnDenial: source.has(namedKey(row)),
      emptyStatus: old.status, replayedStatus: row.status,
      emptyConfiguredMass: old.configuredSamplingMass ?? null,
      replayedConfiguredMass: row.configuredSamplingMass ?? null,
    };
  });
  check(named.length === 185 && source.size === 32 && named.filter((row) => row.sourcePawnDenial).length === 32, "Named Maia history denominator drift");
  const frontiers = Object.fromEntries([0.8, 0.9].map((threshold) => {
    const before = selected(previous, threshold), after = selected(path, threshold);
    return [String(threshold), {
      empty: before.size, replayed: after.size,
      added: [...after].filter((value) => !before.has(value)).length,
      dropped: [...before].filter((value) => !after.has(value)).length,
      overlap: [...after].filter((value) => before.has(value)).length,
    }];
  }));
  return {
    version: 1, manifest: comparisons.manifest,
    authority: "maia_path_history_frontier_change_not_human_frequency_or_search_verdict",
    frontiers,
    namedStatus: { empty: counts(previous.named), replayed: counts(path.named) },
    sourcePawnDenial: {
      emptyPositive: named.filter((row) => row.sourcePawnDenial && row.emptyStatus === "configured_positive").length,
      replayedPositive: named.filter((row) => row.sourcePawnDenial && row.replayedStatus === "configured_positive").length,
    },
    named,
  };
}

if (process.argv[1]?.endsWith("maia-history-impact.mjs")) {
  const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-exact-replies.json", "d3262-maia-direct-logits.json", "d3262-maia-history-replay.json", "d3262-maia-direct-mass-frontier.json"];
  const bytes = names.map((name) => readFileSync(`${root}/${name}`));
  const inputs = bytes.map((value) => JSON.parse(value));
  const artifact = { ...compileMaiaHistoryImpact(inputs[0], inputs[1], inputs[2], inputs[3], bytes[3], inputs[4], bytes[4], inputs[5], inputs[6]), inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${root}/d3262-maia-history-impact.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 Maia history impact differs from frozen inputs");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), frontiers: artifact.frontiers, namedStatus: artifact.namedStatus, sourcePawnDenial: artifact.sourcePawnDenial }, null, 2)}\n`);
}
