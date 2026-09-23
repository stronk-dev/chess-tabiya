// Independent D3262/D3286 read-only check of path-keyed deeper Maia source.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";

const directory = "planning/semantic-consequence-search";
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function legal(fen) { return legalMoves(Chess.fromSetup(parseFen(fen).unwrap()).unwrap()).map((row) => row.uci); }
function masses(items, expectedLegal, label, complete = false) {
  check(Array.isArray(items) && items.length > 0, `Missing ${label}`);
  const seen = new Set();
  let total = 0, previous = Infinity;
  for (const item of items) {
    check(expectedLegal.has(item.legalUci) && !seen.has(item.legalUci), `Illegal or repeated ${label} move`);
    check(typeof item.mass === "number" && Number.isFinite(item.mass) && item.mass > 0 && item.mass <= 1, `Invalid ${label} mass`);
    if (!complete) check(item.mass <= previous + 1e-10, `Unsorted ${label} support`);
    seen.add(item.legalUci);
    total += item.mass;
    previous = item.mass;
  }
  check(Math.abs(total - 1) < 1e-5 && (!complete || seen.size === expectedLegal.size), `Incomplete ${label} distribution`);
  return seen;
}

export function validateMaiaHorizon4PathCapture(frame, frameBytes, direct, directBytes, child, childBytes, capture, expected = {
  frameAuthority: "path_keyed_maia_horizon_four_capture_jobs_not_policy_result",
  captureAuthority: "path_keyed_maia_horizon_four_full_legal_distribution_not_human_frequency_or_proof",
  frameName: "d3262-maia-horizon4-path-frame.json", positions: 2189, sharedFenControl: true,
}) {
  const jobs = expected.frameName === "d3262-coherent-deeper-supplement-frame.json" ? frame.maiaJobs : frame.jobs;
  check(frame.authority === expected.frameAuthority && jobs.length === expected.positions
    && capture.version === 1 && capture.manifest === frame.manifest && capture.positions === expected.positions && capture.rows.length === expected.positions
    && capture.authority === expected.captureAuthority, "Crossed or incomplete Maia path capture");
  check(capture.inputDigests?.[expected.frameName] === sha(frameBytes)
    && capture.inputDigests?.["d3262-maia-direct-logits.json"] === sha(directBytes)
    && capture.inputDigests?.["d3262-maia-history-replay.json"] === sha(childBytes), "Maia path source digest mismatch");
  const source = capture.source;
  check(source.modelId === direct.source.modelId && source.modelCheckpointSha256 === direct.source.modelCheckpointSha256
    && source.uciSourceSha256 === direct.source.uciSourceSha256 && source.mode === "human_common"
    && source.band === 1400 && source.temperature === 0.8 && source.topP === 0.92
    && source.useUciHistory === true && source.historyUci === "root_candidate_reply_path_per_row"
    && source.preRootHistory === "unavailable_not_inferred" && source.device === "cpu", "Maia path model or history source changed");
  let legalMovesCount = 0, configuredSupport = 0, terminal = 0;
  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index], row = capture.rows[index];
    check(row.id === job.id && row.rootId === job.rootId && row.candidateUci === job.candidateUci
      && row.replyUci === job.replyUci && row.rootFen === job.rootFen && row.fen === job.fen
      && JSON.stringify(row.historyUci) === JSON.stringify(job.historyUci), `Crossed Maia path row ${index}`);
    const exactLegal = legal(job.fen);
    check(JSON.stringify(row.legalUcis) === JSON.stringify(exactLegal), `Maia legal denominator mismatch ${index}`);
    legalMovesCount += exactLegal.length;
    if (row.terminal) {
      check(typeof row.terminalReason === "string" && row.terminalReason.length > 0
        && row.rawFullLegal.length === 0 && row.configuredSupport.length === 0, `Terminal Maia path manufactured policy ${index}`);
      terminal += 1;
      continue;
    }
    check(row.terminal === false && row.terminalReason === null && exactLegal.length > 0, `Nonterminal Maia path missing policy ${index}`);
    const legalSet = new Set(exactLegal);
    masses(row.rawFullLegal, legalSet, `raw Maia path ${index}`, true);
    check(row.rawFullLegal.every((item, rank) => rank === 0 || row.rawFullLegal[rank - 1].legalUci < item.legalUci), `Raw Maia path moves unordered ${index}`);
    masses(row.configuredSupport, legalSet, `configured Maia path ${index}`);
    configuredSupport += row.configuredSupport.length;
  }
  const sharedFenRows = capture.rows.filter((row, _, rows) => rows.some((other) => other !== row && other.fen === row.fen));
  if (expected.sharedFenControl) check(sharedFenRows.length === 2 && sharedFenRows[0].fen === sharedFenRows[1].fen, "Shared-FEN path control missing");
  let sameFenRawTotalVariation;
  let sameFenConfiguredTotalVariation;
  if (expected.sharedFenControl) {
    const sharedRaw = sharedFenRows.map((row) => new Map(row.rawFullLegal.map((item) => [item.legalUci, item.mass])));
    const sharedConfigured = sharedFenRows.map((row) => new Map(row.configuredSupport.map((item) => [item.legalUci, item.mass])));
    sameFenRawTotalVariation = [...sharedRaw[0]].reduce((sum, [move, mass]) => sum + Math.abs(mass - sharedRaw[1].get(move)), 0) / 2;
    sameFenConfiguredTotalVariation = [...new Set([...sharedConfigured[0].keys(), ...sharedConfigured[1].keys()])]
      .reduce((sum, move) => sum + Math.abs((sharedConfigured[0].get(move) ?? 0) - (sharedConfigured[1].get(move) ?? 0)), 0) / 2;
  }
  return { positions: capture.positions, uniqueFens: new Set(jobs.map((job) => job.fen)).size, terminal, legalMoves: legalMovesCount, configuredSupport,
    ...(expected.sharedFenControl ? { sameFenRawTotalVariation, sameFenConfiguredTotalVariation } : {}) };
}

if (process.argv[1]?.endsWith("maia-horizon4-path-check.mjs")) {
  const frameBytes = readFileSync(`${directory}/d3262-maia-horizon4-path-frame.json`);
  const directBytes = readFileSync(`${directory}/d3262-maia-direct-logits.json`);
  const childBytes = readFileSync(`${directory}/d3262-maia-history-replay.json`);
  const captureBytes = readFileSync(`${directory}/d3262-maia-horizon4-path-capture.json`);
  const summary = validateMaiaHorizon4PathCapture(JSON.parse(frameBytes), frameBytes, JSON.parse(directBytes), directBytes, JSON.parse(childBytes), childBytes, JSON.parse(captureBytes));
  process.stdout.write(`${JSON.stringify({ digest: sha(captureBytes), ...summary }, null, 2)}\n`);
}
