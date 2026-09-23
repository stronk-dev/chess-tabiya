// Independent, read-only D3262 capture validation. No provider request.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { manifestIdentity, manifestRows } from "./manifest.mjs";

function check(condition, message) { if (!condition) throw new Error(message); }
function near(left, right) { return Math.abs(left - right) <= 0.000_002; }

export function validateMaiaCapture(capture, stockfish) {
  check(capture.version === 1 && capture.partial === false, "Maia artifact is not a full v1 capture");
  check(capture.manifest === manifestIdentity.manifestDigest, "Maia artifact uses a different root manifest");
  check(stockfish.manifest === capture.manifest && stockfish.partial === false, "Stockfish legal-move authority uses a different root manifest");
  check(capture.roots === manifestRows.length && capture.rows?.length === manifestRows.length, "Maia artifact omitted roots");
  check(stockfish.roots === manifestRows.length && stockfish.rows?.length === manifestRows.length, "Stockfish legal-move authority omitted roots");
  check(capture.source.mode === "human_common" && capture.source.band === 1400 && capture.source.temperature === 0.8 && capture.source.topP === 0.92, "Maia source parameters changed");
  check(capture.source.policyConfigDigest === `sha256:${"3".repeat(64)}` && capture.source.endpoint === "/select-move", "Maia source request identity changed");
  check(capture.source.seed === "sha256(fen|band).first32.and31", "Maia requested seed identity changed");
  const engines = new Set();
  let legalMoves = 0, retainedMoves = 0, unobservedMoves = 0, missingMasses = 0, offWindow = 0, castlingEncoded = 0;
  const elapsedMs = [];
  for (let index = 0; index < manifestRows.length; index += 1) {
    const root = manifestRows[index], row = capture.rows[index], engineRow = stockfish.rows[index];
    check(row.rootId === root.id && row.fen === root.fen, `Maia root ${index} changed identity or order`);
    check(engineRow.rootId === root.id && engineRow.fen === root.fen, `Stockfish root ${index} changed identity or order`);
    check(row.status === "captured", `${root.id} has no Maia distribution`);
    check(row.engine?.id === "maia-5m" && row.engine?.modelId === "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe", `${root.id} has the wrong Maia source`);
    check(row.engine.eloApplied === 1400 && row.engine.eloHonored === true, `${root.id} did not apply the declared band`);
    engines.add(JSON.stringify(row.engine));
    check(Number.isFinite(row.elapsedMs) && row.elapsedMs >= 0, `${root.id} has invalid latency`);
    elapsedMs.push(row.elapsedMs);
    const legal = new Set(engineRow.probes[0].legal);
    check(legal.size === engineRow.probes[0].legal.length, `${root.id} has duplicate legal moves`);
    const seen = new Set();
    let mass = 0, absent = 0;
    check(Array.isArray(row.candidates) && row.candidates.length > 0, `${root.id} has no candidates`);
    for (const [candidateIndex, candidate] of row.candidates.entries()) {
      check(candidate.rank === candidateIndex + 1, `${root.id} has noncontiguous candidate ranks`);
      const castlingAlias = { e1h1: "e1g1", e1a1: "e1c1", e8h8: "e8g8", e8a8: "e8c8" }[candidate.moveUci];
      const normalized = legal.has(candidate.moveUci) ? candidate.moveUci : castlingAlias;
      check(normalized !== undefined && legal.has(normalized) && !seen.has(normalized), `${root.id} has an illegal or repeated Maia candidate`);
      seen.add(normalized);
      castlingEncoded += Number(normalized !== candidate.moveUci);
      if (candidate.mass === undefined) absent += 1;
      else {
        check(Number.isFinite(candidate.mass) && candidate.mass >= 0 && candidate.mass <= 1, `${root.id} has invalid policy mass`);
        mass += candidate.mass;
      }
      check(candidate.offWindow === undefined || candidate.offWindow === true, `${root.id} has invalid off-window state`);
      offWindow += Number(candidate.offWindow === true);
    }
    check(mass <= 1.000_002 && near(row.returnedMass, mass), `${root.id} has inconsistent returned policy mass`);
    check(near(row.missingMass, Math.max(0, 1 - mass)) && row.missingCandidateMasses === absent, `${root.id} has inconsistent mass bookkeeping`);
    legalMoves += legal.size;
    retainedMoves += seen.size;
    unobservedMoves += legal.size - seen.size;
    missingMasses += absent;
  }
  check(engines.size === 1 && capture.source.engineIdentities?.length === 1 && engines.has(JSON.stringify(capture.source.engineIdentities[0])), "Maia engine identities disagree across roots");
  const sorted = elapsedMs.sort((a, b) => a - b);
  return {
    roots: manifestRows.length,
    legalMoves,
    retainedMoves,
    unobservedMoves,
    missingMasses,
    offWindow,
    castlingEncoded,
    p50Ms: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    maxMs: sorted.at(-1),
    seedHonored: capture.source.engineIdentities[0].seedHonored,
  };
}

if (process.argv[1]?.endsWith("maia-capture-check.mjs")) {
  const path = process.argv.includes("--file")
    ? process.argv[process.argv.indexOf("--file") + 1]
    : new URL("../../planning/semantic-consequence-search/d3262-maia-capture.json", import.meta.url);
  check(path !== undefined, "--file requires an artifact path");
  const bytes = readFileSync(path);
  const stockfish = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-stockfish-capture.json", import.meta.url), "utf8"));
  const result = validateMaiaCapture(JSON.parse(bytes.toString("utf8")), stockfish);
  process.stdout.write(`${JSON.stringify({ captureDigest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`, manifestDigest: manifestIdentity.manifestDigest, ...result }, null, 2)}\n`);
}
