// Read-only D3262 corrected deeper Maia source check. Ordered root history is
// part of identity; matching FEN alone is not a policy-source join.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { validateMaiaHorizon4PathCapture } from "./maia-horizon4-path-check.mjs";

const directory = "planning/semantic-consequence-search";
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function validateCoherentDeeperMaia(frame, frameBytes, direct, directBytes, child, childBytes, capture) {
  return validateMaiaHorizon4PathCapture(frame, frameBytes, direct, directBytes, child, childBytes, capture, {
    frameAuthority: "missing_deeper_provider_jobs_not_result_or_move_grade",
    captureAuthority: "coherent_deeper_path_keyed_maia_not_human_frequency_or_proof",
    frameName: "d3262-coherent-deeper-supplement-frame.json", positions: 250, sharedFenControl: false,
  });
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const frameBytes = readFileSync(`${directory}/d3262-coherent-deeper-supplement-frame.json`);
  const directBytes = readFileSync(`${directory}/d3262-maia-direct-logits.json`);
  const childBytes = readFileSync(`${directory}/d3262-maia-history-replay.json`);
  const captureBytes = readFileSync(`${directory}/d3262-maia-coherent-deeper-supplement.json`);
  const summary = validateCoherentDeeperMaia(JSON.parse(frameBytes), frameBytes,
    JSON.parse(directBytes), directBytes, JSON.parse(childBytes), childBytes, JSON.parse(captureBytes));
  process.stdout.write(`${JSON.stringify({ digest: sha(captureBytes), ...summary }, null, 2)}\n`);
}
