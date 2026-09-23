// Disposable D3286 provider scheduling for the nineteen path-replay-selected
// positions missing from the frozen empty-history Stockfish capture.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function compileStockfishHistorySupplementFrame(delta, oldFrame) {
  check(delta.authority === "maia_history_replay_frame_delta_not_preregistered_profile_or_search_result"
    && oldFrame.authority === "partial_frontier_provider_capture_frame_not_search_result"
    && delta.manifest === oldFrame.manifest, "Crossed history-supplement source");
  const oldFens = new Set(oldFrame.jobs.map((job) => job.fen));
  check(oldFens.size === 2185 && delta.uncapturedPositions.length === 19, "Changed history-supplement denominator");
  const jobs = delta.uncapturedPositions.map((row) => {
    check(!oldFens.has(row.fen) && row.paths.length > 0, "History supplement repeats a captured position");
    return { id: sha(row.fen), fen: row.fen, paths: row.paths };
  });
  check(new Set(jobs.map((job) => job.fen)).size === 19, "Duplicate history-supplement position");
  return { version: 1, manifest: delta.manifest, authority: "maia_history_supplement_stockfish_jobs_not_search_result", jobs };
}

if (process.argv[1]?.endsWith("stockfish-history-supplement-frame.mjs")) {
  const names = ["d3262-maia-history-frame-delta.json", "d3262-horizon4-frontier.json"];
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const artifact = { ...compileStockfishHistorySupplementFrame(...bytes.map((value) => JSON.parse(value))), inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-stockfish-history-supplement-frame.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3286 Stockfish supplement frame differs from sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), positions: artifact.jobs.length }, null, 2)}\n`);
}
