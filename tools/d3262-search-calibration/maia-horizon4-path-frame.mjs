// Disposable D3262 path-keyed Maia capture frame for the separately
// preregistered D3286 history correction. No FEN deduplication is permitted.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function key(row) { return `${row.rootId}|${row.candidateUci}|${row.replyUci}`; }

export function compileMaiaHorizon4PathFrame(graph, oldFrame, delta) {
  check(graph.authority === "complete_legal_opponent_reply_edges_not_a_semantic_proof"
    && oldFrame.authority === "partial_frontier_provider_capture_frame_not_search_result"
    && delta.authority === "maia_history_replay_frame_delta_not_preregistered_profile_or_search_result"
    && graph.manifest === oldFrame.manifest && graph.manifest === delta.manifest, "Crossed Maia path frame source");
  const exact = new Map(graph.roots.flatMap((root) => root.candidates.flatMap((candidate) => candidate.replies.map((reply) => [key({ rootId: root.rootId, candidateUci: candidate.candidateUci, replyUci: reply.uci }), { rootFen: root.fen, fen: reply.fen }]))));
  check(exact.size === 6310 && oldFrame.paths.length === 2186 && delta.addedPaths.length === 19 && delta.removedPaths.length === 16, "Changed Maia path denominator");
  const removed = new Set(delta.removedPaths.map(key));
  check(removed.size === 16 && delta.removedPaths.every((row) => oldFrame.paths.some((old) => key(old) === key(row) && old.fen === row.fen)), "Removed path not in frozen frame");
  const retained = oldFrame.paths.filter((row) => !removed.has(key(row)));
  const paths = [...retained, ...delta.addedPaths].sort((left, right) => key(left).localeCompare(key(right)));
  check(paths.length === 2189 && new Set(paths.map(key)).size === paths.length, "Duplicated corrected Maia path");
  const jobs = paths.map((row) => {
    const subject = exact.get(key(row));
    check(subject !== undefined && subject.fen === row.fen, `Maia query does not replay exact legal path ${key(row)}`);
    return { id: sha(key(row)), rootId: row.rootId, candidateUci: row.candidateUci, replyUci: row.replyUci,
      rootFen: subject.rootFen, historyUci: [row.candidateUci, row.replyUci], fen: row.fen };
  });
  check(new Set(jobs.map((job) => job.fen)).size === 2188, "Corrected Maia path frame lost its transposition");
  return { version: 1, manifest: graph.manifest, authority: "path_keyed_maia_horizon_four_capture_jobs_not_policy_result", jobs };
}

if (process.argv[1]?.endsWith("maia-horizon4-path-frame.mjs")) {
  const names = ["d3262-exact-replies.json", "d3262-horizon4-frontier.json", "d3262-maia-history-frame-delta.json"];
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileMaiaHorizon4PathFrame(...bytes.map((value) => JSON.parse(value))), inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-maia-horizon4-path-frame.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "Maia horizon-four path frame differs from frozen inputs");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), paths: artifact.jobs.length, uniqueFens: new Set(artifact.jobs.map((job) => job.fen)).size }, null, 2)}\n`);
}
