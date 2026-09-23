import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { manifestRows } from "./manifest.mjs";
import { isRootFrameCli, rowFrame } from "./root-frame.mjs";

const stockfish = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-stockfish-capture.json", import.meta.url), "utf8"));
const maia = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-maia-capture.json", import.meta.url), "utf8"));
const frame = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-root-frame.json", import.meta.url), "utf8"));

test("the root frame retains every declared source and provider best without grading them", () => {
  assert.equal(frame.authority, "shared_candidate_population_not_move_grade");
  assert.equal(frame.maiaMassSemantics, "raw_masked_softmax_not_temperature_top_p_sampling");
  assert.equal(frame.roots.length, manifestRows.length);
  for (const [index, root] of manifestRows.entries()) {
    const row = rowFrame(root, stockfish.rows[index], maia.rows[index]);
    assert.deepEqual(row, frame.roots[index]);
    assert.ok(row.selectedCount >= 1);
    for (const candidate of row.candidates) assert.ok(candidate.origins.length > 0);
  }
});
test("castling joins by legal identity but keeps Maia's raw source UCI", () => {
  const row = frame.roots.find((item) => item.rootId === "d1023:1755bba04565192c");
  const castle = row.candidates.find((candidate) => candidate.moveUci === "e1g1");
  assert.equal(castle.maiaRaw.sourceUci, "e1h1");
});
test("unreturned Maia moves are unknown, never zero-mass", () => {
  const absent = frame.roots.flatMap((root) => root.candidates).filter((candidate) => candidate.maiaRaw === null);
  assert.equal(absent.length, 21);
});
test("an invented source candidate is refused at the legal root join", () => {
  const bad = structuredClone(manifestRows[0]);
  bad.sourceRows = [{ candidateUci: "a1a8", sourceId: "bad" }];
  assert.throws(() => rowFrame(bad, stockfish.rows[0], maia.rows[0]), /absent from the legal root/u);
});
test("an importing script with a suffix-matching name is not this CLI", () => {
  assert.equal(isRootFrameCli("tools/d3262-search-calibration/root-frame.mjs"), true);
  assert.equal(isRootFrameCli("tools/d3262-search-calibration/coherent-root-frame.mjs"), false);
});
