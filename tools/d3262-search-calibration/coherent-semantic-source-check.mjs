// Read-only verification of the one missing semantic-event provider pair.
// A path-keyed Maia distribution cannot be joined by FEN alone.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { validateHorizon4Capture } from "./stockfish-horizon4-check.mjs";
import { validateMaiaHorizon4PathCapture } from "./maia-horizon4-path-check.mjs";

const directory = "planning/semantic-consequence-search";
const sha = (value) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const read = (name) => readFileSync(`${directory}/${name}.json`);
function check(value, message) { if (!value) throw new Error(message); }

export function validateSemanticSources(frame, frameBytes, engine, engineReference,
  maia, direct, directBytes, child, childBytes) {
  check(frame.profile === "d3262-coherent-semantic-supplement-v1"
    && frame.engineJobs.length === 1 && frame.maiaJobs.length === 1
    && frame.engineJobs[0].fen === frame.maiaJobs[0].fen,
  "Crossed semantic supplement jobs");
  const stockfish = validateHorizon4Capture({ ...frame, jobs: frame.engineJobs }, frameBytes,
    engine, engineReference,
    { authority: "missing_semantic_event_provider_jobs_not_result_or_move_grade", positions: 1 });
  const human = validateMaiaHorizon4PathCapture(frame, frameBytes, direct, directBytes,
    child, childBytes, maia, {
      frameAuthority: "missing_semantic_event_provider_jobs_not_result_or_move_grade",
      captureAuthority: "coherent_semantic_path_keyed_maia_not_human_frequency_or_proof",
      frameName: "d3262-coherent-semantic-supplement-frame.json", positions: 1, sharedFenControl: false,
    });
  return { stockfish, maia: human };
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const frameBytes = read("d3262-coherent-semantic-supplement-frame");
  const engineBytes = read("d3262-stockfish-coherent-semantic-supplement");
  const maiaBytes = read("d3262-maia-coherent-semantic-supplement");
  const directBytes = read("d3262-maia-direct-logits");
  const childBytes = read("d3262-maia-history-replay");
  const summary = validateSemanticSources(JSON.parse(frameBytes), frameBytes, JSON.parse(engineBytes),
    JSON.parse(read("d3262-stockfish-child-capture")), JSON.parse(maiaBytes), JSON.parse(directBytes),
    directBytes, JSON.parse(childBytes), childBytes);
  process.stdout.write(`${JSON.stringify({ stockfishDigest: sha(engineBytes), maiaDigest: sha(maiaBytes),
    ...summary }, null, 2)}\n`);
}
