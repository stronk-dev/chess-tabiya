// Disposable D3262 research instrument. Reads committed predecessor recordings;
// it does not query providers, choose a search profile, or grade a chess move.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const INPUTS = Object.freeze({
  horizon: "planning/evidence-foundation-ux/d1061-bestline-distance-results.json",
  sample: "tools/d1023-bounded-policy-harness/provider-sample.json",
  maia: "tools/d1023-bounded-policy-harness/maia-output.json",
  stockfish: "tools/d1023-bounded-policy-harness/stockfish-output.json",
});

function input(path) {
  const bytes = readFileSync(new URL(`../../${path}`, import.meta.url));
  return { digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, value: JSON.parse(bytes.toString("utf8")) };
}
function countBy(rows, field) {
  return Object.fromEntries([...new Set(rows.map((row) => row[field]))].sort().map((value) => [value, rows.filter((row) => row[field] === value).length]));
}
function identity(row) {
  const pair = row.pair ?? row;
  return JSON.stringify([pair.sourceId, pair.parentFen, pair.candidateUci, pair.played, pair.targetFamily]);
}
function requireAligned(label, expected, actual) {
  if (actual.length !== expected.length || actual.some((row, index) => identity(row) !== identity(expected[index]))) {
    throw new Error(`${label} rows no longer align with the sealed D1023 sample`);
  }
}

const sources = Object.fromEntries(Object.entries(INPUTS).map(([name, path]) => [name, { path, ...input(path) }]));
const horizon = sources.horizon.value.rows;
const sample = sources.sample.value.populations.flatMap((population) => population.rows);
const maia = sources.maia.value.rows;
const stockfish = sources.stockfish.value.rows;
if (horizon.length === 0 || sample.length === 0) throw new Error("An input population is empty");
requireAligned("Maia", sample, maia);
requireAligned("Stockfish", sample, stockfish);

const horizonRoots = new Set(horizon.map((row) => row.fen));
const policyRoots = new Set(sample.map((row) => row.parentFen));
const commonRoots = [...policyRoots].filter((fen) => horizonRoots.has(fen));
const horizonProbes = [...new Set(horizon.flatMap((row) => row.probes.map((probe) => probe.arm)))].sort();
const maiaBands = [...new Set(maia.flatMap((row) => Object.keys(row.byBand)))].sort();
const stockfishDepths = [...new Set(stockfish.flatMap((row) => Object.keys(row.byDepth)))].sort();
const maiaRawMoveMass = maia.every((row) => Object.values(row.byBand).every((band) => Array.isArray(band.candidates) && band.candidates.every((candidate) => typeof candidate.moveUci === "string" && typeof candidate.mass === "number")));
const stockfishRawLines = stockfish.every((row) => Object.values(row.byDepth).every((depth) => Array.isArray(depth.pv) && depth.pv.length > 0));
const result = {
  question: "Can the existing recordings support D3262's five-arm same-root calibration without new provider capture?",
  inputs: Object.fromEntries(Object.entries(sources).map(([name, source]) => [name, { path: source.path, digest: source.digest }])),
  horizon: { positions: horizon.length, uniqueRoots: horizonRoots.size, phases: countBy(horizon, "phase"), probes: horizonProbes },
  policy: { rows: sample.length, uniqueRoots: policyRoots.size, phases: countBy(sample, "phase"), targetFamilies: countBy(sample, "targetFamily"), maiaBands, stockfishDepths },
  exactFenOverlap: commonRoots.length,
  retainedPerMoveMaiaMass: maiaRawMoveMass,
  retainedStockfishPvs: stockfishRawLines,
  necessaryProviderReuseFieldsPresent: commonRoots.length > 0 && maiaRawMoveMass && stockfishRawLines && sample.some((row) => row.phase === "endgame") && horizon.some((row) => row.phase === "endgame"),
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
