// D3262/D3285 diagnostic: compare frozen mixed-depth all-legal rank with a
// same-width coherent recapture. Repeated timed searches can also vary; a
// changed ranking is not attributed to one cause by this instrument.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const directory = "planning/semantic-consequence-search";
const budgets = ["depth8", "depth12", "movetime100"];
function check(value, message) { if (!value) throw new Error(message); }
function sha(bytes) { return `sha256:${createHash("sha256").update(bytes).digest("hex")}`; }
function ordered(probe) { return probe.entries.slice(0, 8).map((entry) => entry.moveUci); }
function sameSet(left, right) { return left.length === right.length && left.every((move) => right.includes(move)); }

export function compareCoherentImpact(original, corrected, topEight, expectedRows) {
  check(original.rows.length === expectedRows && corrected.rows.length === expectedRows && topEight.rows.length === expectedRows,
    "Stockfish impact population changed");
  check(original.manifest === corrected.manifest && original.manifest === topEight.manifest
    && original.source.engineName === corrected.source.engineName && original.source.executableDigest === corrected.source.executableDigest
    && original.source.executableDigest === topEight.source.executableDigest, "Stockfish impact crossed source");
  const output = {};
  for (const [budgetIndex, budget] of budgets.entries()) {
    const tally = { rows: expectedRows, oldMixedTopEightDepth: 0, oldMissingTopEight: 0,
      sameWidthTopMoveChanged: 0, sameWidthTopEightSetChanged: 0, sameWidthTopEightOrderChanged: 0,
      topEightWidthTopMoveChanged: 0, topEightWidthTopEightSetChanged: 0,
      changedTopMoveAmongOldMixed: 0, changedTopMoveAmongOldUnmixed: 0 };
    for (let index = 0; index < expectedRows; index += 1) {
      const oldRow = original.rows[index], newRow = corrected.rows[index], narrowRow = topEight.rows[index];
      check(oldRow.rootId === newRow.rootId && oldRow.rootId === narrowRow.rootId
        && oldRow.candidateUci === newRow.candidateUci && oldRow.candidateUci === narrowRow.candidateUci
        && oldRow.fen === newRow.fen && oldRow.fen === narrowRow.fen, `Stockfish impact crossed row ${index}`);
      const before = oldRow.probes[budgetIndex], after = newRow.probes[budgetIndex], narrow = narrowRow.probes[budgetIndex];
      check(before.budget === budget && after.budget === budget && narrow.budget === budget
        && JSON.stringify(before.legal) === JSON.stringify(after.legal)
        && JSON.stringify(before.legal) === JSON.stringify(narrow.legal), `Stockfish impact crossed budget/legal denominator ${index}`);
      const oldMoves = ordered(before), newMoves = ordered(after), narrowMoves = ordered(narrow);
      const oldMixed = new Set(before.entries.slice(0, 8).map((entry) => entry.depth)).size > 1;
      tally.oldMixedTopEightDepth += Number(oldMixed);
      tally.oldMissingTopEight += Number(oldMoves.length < Math.min(8, before.legal.length));
      const topChanged = oldMoves[0] !== newMoves[0];
      tally.sameWidthTopMoveChanged += Number(topChanged);
      tally.sameWidthTopEightSetChanged += Number(!sameSet(oldMoves, newMoves));
      tally.sameWidthTopEightOrderChanged += Number(JSON.stringify(oldMoves) !== JSON.stringify(newMoves));
      tally.topEightWidthTopMoveChanged += Number(newMoves[0] !== narrowMoves[0]);
      tally.topEightWidthTopEightSetChanged += Number(!sameSet(newMoves, narrowMoves));
      if (topChanged) tally[oldMixed ? "changedTopMoveAmongOldMixed" : "changedTopMoveAmongOldUnmixed"] += 1;
    }
    output[budget] = tally;
  }
  return output;
}

export function rootBestOutsideFrame(rootFrame, corrected) {
  check(rootFrame.authority === "shared_candidate_population_not_move_grade" && rootFrame.roots.length === 66
    && corrected.rows.length === 66 && rootFrame.manifest === corrected.manifest, "Crossed frozen root frame");
  const missing = [];
  for (let index = 0; index < 66; index += 1) {
    const root = rootFrame.roots[index], row = corrected.rows[index];
    check(root.rootId === row.rootId && root.fen === row.fen, `Crossed root-frame row ${index}`);
    for (const budget of budgets) {
      const probe = row.probes.find((value) => value.budget === budget);
      check(probe !== undefined, `Missing corrected root budget ${index}/${budget}`);
      const best = probe.entries[0]?.moveUci;
      if (best !== undefined && !root.candidates.some((candidate) => candidate.moveUci === best)) missing.push({ rootId: root.rootId, budget, moveUci: best });
    }
  }
  return missing;
}

if (process.argv[1]?.endsWith("stockfish-coherent-impact.mjs")) {
  const names = ["d3262-stockfish-capture.json", "d3262-stockfish-root-coherent-all.json", "d3262-stockfish-root-coherent.json",
    "d3262-stockfish-child-capture.json", "d3262-stockfish-child-coherent-all.json", "d3262-stockfish-child-coherent.json", "d3262-root-frame.json"];
  const bytes = names.map((name) => readFileSync(`${directory}/${name}`));
  const values = bytes.map((value) => JSON.parse(value));
  const artifact = { version: 1, authority: "stockfish_rank_source_sensitivity_not_causal_attribution_or_move_grade",
    inputDigests: Object.fromEntries(names.map((name, index) => [name, sha(bytes[index])])),
    root: compareCoherentImpact(...values.slice(0, 3), 66), child: compareCoherentImpact(...values.slice(3, 6), 196),
    coherentRootBestOutsideFrozenFrame: rootBestOutsideFrame(values[6], values[1]) };
  const output = `${JSON.stringify(artifact, null, 2)}\n`;
  const target = `${directory}/d3262-stockfish-coherent-impact.json`;
  if (process.argv.includes("--write")) writeFileSync(target, output, { flag: "wx" });
  else check(readFileSync(target, "utf8") === output, "D3262 Stockfish rank sensitivity differs from checked sources");
  process.stdout.write(`${JSON.stringify({ digest: sha(output), rootTimed: artifact.root.movetime100, childTimed: artifact.child.movetime100,
    coherentRootBestOutsideFrozenFrame: artifact.coherentRootBestOutsideFrozenFrame }, null, 2)}\n`);
}
