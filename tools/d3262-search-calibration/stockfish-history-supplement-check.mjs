// Read-only D3286 check of the nineteen newly path-selected Stockfish nodes.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { compileStockfishHistorySupplementFrame } from "./stockfish-history-supplement-frame.mjs";
import { validateHorizon4Capture } from "./stockfish-horizon4-check.mjs";

const directory = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function validateHistorySupplement(frame, frameBytes, delta, deltaBytes, oldFrame, oldFrameBytes, capture, reference) {
  check(frame.inputDigests?.["d3262-maia-history-frame-delta.json"] === sha(deltaBytes)
    && frame.inputDigests?.["d3262-horizon4-frontier.json"] === sha(oldFrameBytes), "Crossed history supplement frame inputs");
  const computed = compileStockfishHistorySupplementFrame(delta, oldFrame);
  check(JSON.stringify({ version: frame.version, manifest: frame.manifest, authority: frame.authority, jobs: frame.jobs }) === JSON.stringify(computed), "History supplement job frame drift");
  return validateHorizon4Capture(frame, frameBytes, capture, reference, { authority: "maia_history_supplement_stockfish_jobs_not_search_result", positions: 19 });
}

if (process.argv[1]?.endsWith("stockfish-history-supplement-check.mjs")) {
  const frameBytes = readFileSync(`${directory}/d3262-stockfish-history-supplement-frame.json`);
  const deltaBytes = readFileSync(`${directory}/d3262-maia-history-frame-delta.json`);
  const oldFrameBytes = readFileSync(`${directory}/d3262-horizon4-frontier.json`);
  const captureBytes = readFileSync(`${directory}/d3262-stockfish-history-supplement.json`);
  const reference = JSON.parse(readFileSync(`${directory}/d3262-stockfish-child-capture.json`));
  const summary = validateHistorySupplement(JSON.parse(frameBytes), frameBytes, JSON.parse(deltaBytes), deltaBytes, JSON.parse(oldFrameBytes), oldFrameBytes, JSON.parse(captureBytes), reference);
  process.stdout.write(`${JSON.stringify({ digest: sha(captureBytes), ...summary }, null, 2)}\n`);
}
