// Read-only D3262 corrected deeper Stockfish source check. A score belongs to
// its exact FEN and budget; top-eight rank is not all-reply proof.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { validateHorizon4Capture } from "./stockfish-horizon4-check.mjs";

const directory = "planning/semantic-consequence-search";
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }

export function validateCoherentDeeperStockfish(frame, frameBytes, capture, reference) {
  return validateHorizon4Capture({ ...frame, jobs: frame.engineJobs }, frameBytes, capture, reference,
    { authority: "missing_deeper_provider_jobs_not_result_or_move_grade", positions: 267 });
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const frameBytes = readFileSync(`${directory}/d3262-coherent-deeper-supplement-frame.json`);
  const captureBytes = readFileSync(`${directory}/d3262-stockfish-coherent-deeper-supplement.json`);
  const reference = JSON.parse(readFileSync(`${directory}/d3262-stockfish-child-capture.json`));
  const summary = validateCoherentDeeperStockfish(JSON.parse(frameBytes), frameBytes, JSON.parse(captureBytes), reference);
  process.stdout.write(`${JSON.stringify({ digest: sha(captureBytes), ...summary }, null, 2)}\n`);
}
