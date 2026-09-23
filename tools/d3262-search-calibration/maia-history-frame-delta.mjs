// Disposable D3262/D3286 counterfactual frame delta. Replaces only the Maia
// first-reply selection with root-replayed policy, leaving engine and semantic
// selectors fixed. It does not amend the preregistered empty-history frame.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { validateMaiaHistoryReplay } from "./maia-history-replay-check.mjs";

const directory = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(rootId, candidateUci, replyUci) { return `${rootId}|${candidateUci}|${replyUci}`; }
function selected(rows, threshold) {
  const result = new Set();
  for (const row of rows) {
    let covered = 0;
    for (const item of row.configuredSupport.slice(0, 8)) {
      if (covered >= threshold) break;
      result.add(key(row.rootId, row.candidateUci, item.legalUci));
      covered += item.mass;
    }
  }
  return result;
}

export function compileMaiaHistoryFrameDelta(graph, graphBytes, direct, directBytes, replay, oldFrame) {
  validateMaiaHistoryReplay(graph, graphBytes, direct, directBytes, replay);
  check(oldFrame.manifest === graph.manifest && oldFrame.authority === "partial_frontier_provider_capture_frame_not_search_result", "Wrong old capture frame");
  const exact = new Map(graph.roots.flatMap((root) => root.candidates.flatMap((candidate) => candidate.replies.map((reply) => [key(root.rootId, candidate.candidateUci, reply.uci), reply.fen]))));
  check(exact.size === 6310 && oldFrame.paths.length === 2186 && oldFrame.jobs.length === 2185, "Changed exact/frame denominator");
  const priorFens = new Set(oldFrame.paths.map((row) => row.fen));
  check(priorFens.size === oldFrame.jobs.length && new Set(oldFrame.jobs.map((job) => job.fen)).size === oldFrame.jobs.length
    && oldFrame.jobs.every((job) => priorFens.has(job.fen)), "Old FEN jobs do not match their paths");
  const arms = [0.8, 0.9].map((threshold) => ({ label: `maia:${threshold.toFixed(2)}`, before: selected(direct.rows, threshold), after: selected(replay.rows, threshold) }));
  const prior = new Map(oldFrame.paths.map((row) => [key(row.rootId, row.candidateUci, row.replyUci), row]));
  check(prior.size === oldFrame.paths.length, "Duplicate old path");
  for (const arm of arms) {
    const tagged = new Set(oldFrame.paths.filter((row) => row.selectedBy.includes(arm.label)).map((row) => key(row.rootId, row.candidateUci, row.replyUci)));
    check(tagged.size === arm.before.size && [...tagged].every((id) => arm.before.has(id)), `Old ${arm.label} tags disagree with empty-history source`);
  }
  const revised = new Map();
  for (const [id, row] of prior) {
    check(exact.get(id) === row.fen, `Crossed exact path ${id}`);
    const selectedBy = row.selectedBy.filter((arm) => !arm.startsWith("maia:"));
    for (const arm of arms) if (arm.after.has(id)) selectedBy.push(arm.label);
    if (selectedBy.length > 0) revised.set(id, { ...row, selectedBy: selectedBy.sort() });
  }
  for (const arm of arms) for (const id of arm.after) {
    if (revised.has(id)) continue;
    const [rootId, candidateUci, replyUci] = id.split("|");
    const fen = exact.get(id);
    check(fen !== undefined, `New Maia policy selected a non-legal path ${id}`);
    const selectedBy = arms.filter((other) => other.after.has(id)).map((other) => other.label);
    revised.set(id, { rootId, candidateUci, replyUci, fen, selectedBy });
  }
  const oldFens = new Set(oldFrame.jobs.map((job) => job.fen));
  const newFens = new Set([...revised.values()].map((row) => row.fen));
  const added = [...revised].filter(([id]) => !prior.has(id)).map(([, row]) => row).sort((a, b) => key(a.rootId, a.candidateUci, a.replyUci).localeCompare(key(b.rootId, b.candidateUci, b.replyUci)));
  const removed = [...prior].filter(([id]) => !revised.has(id)).map(([, row]) => row).sort((a, b) => key(a.rootId, a.candidateUci, a.replyUci).localeCompare(key(b.rootId, b.candidateUci, b.replyUci)));
  const uncaptured = [...newFens].filter((fen) => !oldFens.has(fen)).sort();
  return {
    version: 1, manifest: graph.manifest,
    authority: "maia_history_replay_frame_delta_not_preregistered_profile_or_search_result",
    oldPaths: oldFrame.paths.length, revisedPaths: revised.size,
    oldPositions: oldFens.size, revisedPositions: newFens.size,
    addedPaths: added, removedPaths: removed,
    uncapturedPositions: uncaptured.map((fen) => ({ fen, paths: [...revised.values()].filter((row) => row.fen === fen).map(({ rootId, candidateUci, replyUci }) => ({ rootId, candidateUci, replyUci })) })),
  };
}

if (process.argv[1]?.endsWith("maia-history-frame-delta.mjs")) {
  const names = ["d3262-exact-replies.json", "d3262-maia-direct-logits.json", "d3262-maia-history-replay.json", "d3262-horizon4-frontier.json"];
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const result = compileMaiaHistoryFrameDelta(JSON.parse(bytes[0]), bytes[0], JSON.parse(bytes[1]), bytes[1], JSON.parse(bytes[2]), JSON.parse(bytes[3]));
  const artifact = { ...result, inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-maia-history-frame-delta.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Maia history frame delta differs from frozen sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), oldPaths: artifact.oldPaths, revisedPaths: artifact.revisedPaths, oldPositions: artifact.oldPositions, revisedPositions: artifact.revisedPositions, addedPaths: artifact.addedPaths.length, removedPaths: artifact.removedPaths.length, uncapturedPositions: artifact.uncapturedPositions.length }, null, 2)}\n`);
}
