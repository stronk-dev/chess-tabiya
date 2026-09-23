import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compareCoherentImpact, rootBestOutsideFrame } from "./stockfish-coherent-impact.mjs";

const probe = (budget, moves, depths) => ({ budget, legal: ["a1a2", "a1b1"], entries: moves.map((moveUci, rank) => ({ moveUci, rank: rank + 1, depth: depths[rank] })) });
const source = { engineName: "Stockfish", executableDigest: "sha256:" + "a".repeat(64) };
function artifact(moves, depths) {
  return { manifest: "fixed", source, rows: [{ rootId: "root", fen: "fixed", probes: ["depth8", "depth12", "movetime100"].map((budget) => probe(budget, moves, depths)) }] };
}

test("same-width comparison separates changed rank from a mixed old depth", () => {
  const old = artifact(["a1a2", "a1b1"], [4, 3]);
  const all = artifact(["a1b1", "a1a2"], [3, 3]);
  const eight = artifact(["a1b1", "a1a2"], [5, 5]);
  const result = compareCoherentImpact(old, all, eight, 1);
  assert.equal(result.movetime100.oldMixedTopEightDepth, 1);
  assert.equal(result.movetime100.sameWidthTopMoveChanged, 1);
  assert.equal(result.movetime100.sameWidthTopEightSetChanged, 0);
  assert.equal(result.movetime100.changedTopMoveAmongOldMixed, 1);
  assert.equal(result.movetime100.topEightWidthTopMoveChanged, 0);
});

test("crossed population and changed binary cannot masquerade as sensitivity", () => {
  const old = artifact(["a1a2", "a1b1"], [4, 3]);
  const all = artifact(["a1b1", "a1a2"], [3, 3]);
  const eight = artifact(["a1b1", "a1a2"], [5, 5]);
  all.rows[0].rootId = "other";
  assert.throws(() => compareCoherentImpact(old, all, eight, 1), /crossed row/);
  all.rows[0].rootId = "root";
  all.source = { ...source, executableDigest: "sha256:" + "b".repeat(64) };
  assert.throws(() => compareCoherentImpact(old, all, eight, 1), /crossed source/);
});

test("corrected root bests absent from the frozen candidate frame stay explicit", () => {
  const directory = "planning/semantic-consequence-search/";
  const frame = JSON.parse(readFileSync(`${directory}d3262-root-frame.json`));
  const corrected = JSON.parse(readFileSync(`${directory}d3262-stockfish-root-coherent-all.json`));
  assert.deepEqual(rootBestOutsideFrame(frame, corrected), [
    { rootId: "d1023:32dbd41ca364bdb7", budget: "movetime100", moveUci: "f7f5" },
    { rootId: "d1023:e539b1202c9dcb20", budget: "movetime100", moveUci: "f2f3" },
    { rootId: "d1023:ef628fec1346fe49", budget: "movetime100", moveUci: "e1e2" },
  ]);
  const crossed = structuredClone(frame); crossed.roots[0].rootId = "other";
  assert.throws(() => rootBestOutsideFrame(crossed, corrected), /Crossed root-frame row/);
});
