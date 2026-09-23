// Deterministic D3262 candidate frame. This chooses roots to *measure*, not moves
// to recommend; no source value is merged or interpreted as a chess judgement.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { manifestIdentity, manifestRows } from "./manifest.mjs";
import { validateMaiaCapture } from "./maia-capture-check.mjs";

const stockfishPath = new URL("../../planning/semantic-consequence-search/d3262-stockfish-capture.json", import.meta.url);
const maiaPath = new URL("../../planning/semantic-consequence-search/d3262-maia-capture.json", import.meta.url);
const framePath = new URL("../../planning/semantic-consequence-search/d3262-root-frame.json", import.meta.url);
const stockfish = JSON.parse(readFileSync(stockfishPath, "utf8"));
const maia = JSON.parse(readFileSync(maiaPath, "utf8"));
validateMaiaCapture(maia, stockfish);

function check(condition, message) { if (!condition) throw new Error(message); }
function canonical(uci, legal) {
  const aliases = { e1h1: "e1g1", e1a1: "e1c1", e8h8: "e8g8", e8a8: "e8c8" };
  const move = legal.has(uci) ? uci : aliases[uci];
  check(move !== undefined && legal.has(move), `Candidate ${uci} is absent from the legal root population`);
  return move;
}
export function rowFrame(root, engineRow, humanRow) {
  const legal = new Set(engineRow.probes[0].legal);
  const selected = new Map();
  function include(uci, origin) {
    const moveUci = canonical(uci, legal);
    const entry = selected.get(moveUci) ?? { moveUci, origins: [] };
    if (!entry.origins.includes(origin)) entry.origins.push(origin);
    selected.set(moveUci, entry);
  }
  for (const row of root.sourceRows ?? []) include(row.candidateUci, `source:${row.sourceId}`);
  if (root.candidateUci !== undefined) include(root.candidateUci, `control:${root.id}`);
  for (const probe of engineRow.probes) {
    check(["depth8", "depth12", "movetime100"].includes(probe.budget), `${root.id}: unknown Stockfish budget`);
    const best = probe.entries.find((entry) => entry.rank === 1);
    if (best !== undefined) include(best.moveUci, `stockfish:${probe.budget}`);
  }
  const humanBest = humanRow.candidates.find((candidate) => candidate.rank === 1);
  check(humanBest !== undefined, `${root.id}: no Maia highest-mass candidate`);
  include(humanBest.moveUci, "maia:raw_highest_mass");
  const maiaByMove = new Map(humanRow.candidates.map((candidate) => [canonical(candidate.moveUci, legal), candidate]));
  const candidates = [...selected.values()].sort((left, right) => left.moveUci.localeCompare(right.moveUci)).map((entry) => {
    const human = maiaByMove.get(entry.moveUci);
    return {
      moveUci: entry.moveUci,
      origins: entry.origins.sort(),
      maiaRaw: human === undefined ? null : { sourceUci: human.moveUci, rank: human.rank, mass: human.mass ?? null },
      stockfish: engineRow.probes.map((probe) => {
        const source = probe.entries.find((item) => item.moveUci === entry.moveUci);
        return { budget: probe.budget, ...(source === undefined ? { status: "missing" } : { status: "retained", rank: source.rank, score: source.score, depth: source.depth }) };
      }),
    };
  });
  const listedRawMass = humanRow.candidates.reduce((sum, candidate) => sum + (candidate.mass ?? 0), 0);
  return {
    rootId: root.id,
    fen: root.fen,
    phase: root.phase,
    focus: root.focus ?? null,
    legalCount: legal.size,
    selectedCount: candidates.length,
    maiaListedCount: humanRow.candidates.length,
    maiaUnreturnedCount: legal.size - humanRow.candidates.length,
    maiaListedRawMass: Number(listedRawMass.toFixed(12)),
    maiaUnreturnedRawMassBound: Number(Math.max(0, 1 - listedRawMass).toFixed(12)),
    candidates,
  };
}

if (process.argv[1]?.endsWith("root-frame.mjs")) {
  const rows = manifestRows.map((root, index) => rowFrame(root, stockfish.rows[index], maia.rows[index]));
  const artifact = {
    version: 1,
    manifest: manifestIdentity.manifestDigest,
    stockfishCaptureDigest: `sha256:${createHash("sha256").update(readFileSync(stockfishPath)).digest("hex")}`,
    maiaCaptureDigest: `sha256:${createHash("sha256").update(readFileSync(maiaPath)).digest("hex")}`,
    authority: "shared_candidate_population_not_move_grade",
    maiaMassSemantics: "raw_masked_softmax_not_temperature_top_p_sampling",
    roots: rows,
  };
  const bytes = `${JSON.stringify(artifact, null, 2)}\n`;
  const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  if (process.argv.includes("--write")) writeFileSync(framePath, bytes, { flag: "wx" });
  else check(readFileSync(framePath, "utf8") === bytes, "D3262 root frame differs from the frozen provider captures");
  process.stdout.write(`${JSON.stringify({ digest, roots: rows.length, legal: rows.reduce((sum, row) => sum + row.legalCount, 0), selected: rows.reduce((sum, row) => sum + row.selectedCount, 0), rootsWithUnreturnedMaia: rows.filter((row) => row.maiaUnreturnedCount > 0).length, selectedWithoutMaiaMass: rows.reduce((sum, row) => sum + row.candidates.filter((candidate) => candidate.maiaRaw === null).length, 0) }, null, 2)}\n`);
}
