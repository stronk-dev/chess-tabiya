// Independent D3262 corrected-frame path-keyed Maia source validation.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { newChildJobs } from "./stockfish-new-child-check.mjs";

const directory = "planning/semantic-consequence-search";
const names = ["d3262-coherent-exact-replies.json", "d3262-exact-replies.json", "d3262-maia-direct-logits.json", "d3262-maia-history-replay.json"];
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function legal(fen) { return legalMoves(Chess.fromSetup(parseFen(fen).unwrap()).unwrap()).map((row) => row.uci); }
function verifyMass(items, expected, label, complete) {
  check(Array.isArray(items) && items.length > 0, `Missing ${label}`);
  const seen = new Set();
  let sum = 0, previous = Infinity;
  for (const item of items) {
    check(expected.has(item.legalUci) && !seen.has(item.legalUci)
      && Number.isFinite(item.mass) && item.mass > 0 && item.mass <= 1, `Invalid ${label}`);
    if (!complete) check(item.mass <= previous + 1e-10, `Unordered ${label}`);
    seen.add(item.legalUci); sum += item.mass; previous = item.mass;
  }
  check(Math.abs(sum - 1) < 1e-5 && (!complete || seen.size === expected.size), `Incomplete ${label}`);
}

export function validateMaiaCoherentNewChild(capture, inputs, inputBytes) {
  const [graph, oldGraph, direct, control] = inputs;
  const jobs = newChildJobs(graph, oldGraph);
  check(capture.version === 1 && capture.profile === graph.profile && capture.manifest === graph.manifest
    && capture.authority === "coherent_root_new_child_maia_distribution_not_human_frequency_or_proof"
    && capture.positions === 3 && capture.rows?.length === 3, "Crossed new-child Maia capture");
  for (let index = 0; index < names.length; index += 1) check(capture.inputDigests?.[names[index]] === sha(inputBytes[index]), `New-child Maia input digest drift ${names[index]}`);
  const source = capture.source;
  check(source.modelId === direct.source.modelId && source.modelCheckpointSha256 === direct.source.modelCheckpointSha256
    && source.uciSourceSha256 === direct.source.uciSourceSha256 && source.mode === "human_common"
    && source.band === 1400 && source.temperature === 0.8 && source.topP === 0.92
    && source.useUciHistory === true && source.historyUci === "root_candidate_path_per_row"
    && source.preRootHistory === "unavailable_not_inferred" && source.device === "cpu"
    && control.source.modelCheckpointSha256 === source.modelCheckpointSha256,
  "New-child Maia model/history source changed");
  let legalMovesCount = 0, configuredSupport = 0;
  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index], row = capture.rows[index];
    const root = graph.roots.find((value) => value.rootId === job.rootId);
    check(row.rootId === job.rootId && row.candidateUci === job.candidateUci
      && row.rootFen === root.fen && row.fen === job.fen
      && JSON.stringify(row.historyUci) === JSON.stringify([job.candidateUci]), `Crossed new-child Maia path ${index}`);
    const exactLegal = legal(job.fen);
    check(JSON.stringify(row.legalUcis) === JSON.stringify(exactLegal)
      && JSON.stringify(row.legalUcis) === JSON.stringify(job.replies), `New-child Maia legal denominator changed ${index}`);
    const legalSet = new Set(exactLegal);
    verifyMass(row.rawFullLegal, legalSet, `raw new-child Maia ${index}`, true);
    check(JSON.stringify(row.rawFullLegal.map((item) => item.legalUci)) === JSON.stringify(exactLegal), `Raw new-child Maia move order changed ${index}`);
    verifyMass(row.configuredSupport, legalSet, `configured new-child Maia ${index}`, false);
    legalMovesCount += exactLegal.length;
    configuredSupport += row.configuredSupport.length;
  }
  return { positions: jobs.length, legalMoves: legalMovesCount, configuredSupport };
}

if (process.argv[1]?.endsWith("maia-coherent-new-child-check.mjs")) {
  const inputBytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const captureBytes = readFileSync(`${directory}/d3262-maia-coherent-new-child.json`);
  const result = validateMaiaCoherentNewChild(JSON.parse(captureBytes), inputBytes.map((bytes) => JSON.parse(bytes)), inputBytes);
  process.stdout.write(`${JSON.stringify({ digest: sha(captureBytes), ...result }, null, 2)}\n`);
}
