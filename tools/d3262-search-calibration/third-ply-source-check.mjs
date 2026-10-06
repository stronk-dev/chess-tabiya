// Disposable source authority over the frozen D3476 request frame. Valid
// provider inputs are not a search verdict, causal reason or human frequency.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { validateHorizon4Capture } from "./stockfish-horizon4-check.mjs";
import { validateMaiaHorizon4PathCapture } from "./maia-horizon4-path-check.mjs";

export const directory = "planning/semantic-consequence-search";
export const frameName = "d3262-coherent-third-ply-frame.json";
export const frameDigest = "sha256:3059fb3a45eb10bdcd56b7a4190bbbcf7370b4bf58750934befabde62712dc07";
export const sha = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function check(value, message) { if (!value) throw new Error(message); }
export function loadFrozenThirdPlyFrame() {
  const bytes = readFileSync(`${directory}/${frameName}`), frame = JSON.parse(bytes);
  check(sha(bytes) === frameDigest && frame.profile === "d3262-coherent-third-ply-v1"
    && frame.engineJobs.length === 16813 && frame.maiaJobs.length === 1401,
  "Changed frozen third-ply capture frame");
  return { frame, bytes };
}
export function validateThirdPlyStockfish(frame, bytes, capture) {
  const result = validateHorizon4Capture({ ...frame, jobs: frame.engineJobs }, bytes, capture,
    { manifest: frame.manifest, source: frame.finalPlyQueries.stockfish }, {
      authority: frame.authority, positions: frame.engineJobs.length,
      multiPv: "top8_legal_moves_at_selected_third_ply", jobBudgets: true,
    });
  check(capture.rows.every((row) => row.probes.every((probe) => Number.isFinite(probe.elapsedMs) && probe.elapsedMs >= 0)),
    "Missing or invalid Stockfish query timing");
  return result;
}
export function validateThirdPlyMaia(frame, bytes, direct, directBytes, child, childBytes, capture) {
  const expectedSource = frame.finalPlyQueries.maia;
  check(capture.partial === false
    && JSON.stringify(Object.keys(capture.source).sort()) === JSON.stringify(Object.keys(expectedSource).sort())
    && Object.keys(expectedSource).every((field) => capture.source[field] === expectedSource[field]),
    "Partial or crossed third-ply Maia source");
  const adapted = { ...frame, maiaJobs: frame.maiaJobs.map((job) => ({ ...job,
    candidateUci: job.historyUci[0], replyUci: job.historyUci[1], learnerUci: job.historyUci[2] })) };
  for (let index = 0; index < frame.maiaJobs.length; index++) {
    check(capture.rows[index]?.learnerUci === frame.maiaJobs[index].historyUci[2]
      && Number.isFinite(capture.rows[index]?.elapsedMs) && capture.rows[index].elapsedMs >= 0,
    "Crossed learner path or missing query timing");
  }
  return validateMaiaHorizon4PathCapture(adapted, bytes, direct, directBytes, child, childBytes, capture, {
    frameAuthority: frame.authority,
    captureAuthority: "coherent_third_ply_path_keyed_maia_not_human_frequency_or_proof",
    frameName, positions: frame.maiaJobs.length, sharedFenControl: false,
    historyUci: "root_candidate_reply_learner_path_per_row",
  });
}
if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const { frame, bytes } = loadFrozenThirdPlyFrame();
  const mode = process.argv[2], input = process.argv[3];
  if (mode === "preflight") {
    process.stdout.write(`${JSON.stringify({ frameDigest, engineJobs: frame.engineJobs.length, maiaJobs: frame.maiaJobs.length })}\n`);
  } else {
    check((mode === "stockfish" || mode === "maia") && input !== undefined, "Pass source kind and explicit artifact path");
    const captureBytes = readFileSync(input), capture = JSON.parse(input.endsWith(".gz") ? gunzipSync(captureBytes) : captureBytes);
    const directBytes = mode === "maia" ? readFileSync(`${directory}/d3262-maia-direct-logits.json`) : undefined;
    const childBytes = mode === "maia" ? readFileSync(`${directory}/d3262-maia-history-replay.json`) : undefined;
    const result = mode === "stockfish" ? validateThirdPlyStockfish(frame, bytes, capture)
      : validateThirdPlyMaia(frame, bytes, JSON.parse(directBytes), directBytes, JSON.parse(childBytes), childBytes, capture);
    process.stdout.write(`${JSON.stringify({ digest: sha(captureBytes), ...result }, null, 2)}\n`);
  }
}
