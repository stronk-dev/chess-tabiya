import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileMaiaChildPrefix } from "./maia-child-prefix.mjs";

const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-maia-child-capture.json"];
const inputs = names.map((name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}`, "utf8")));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-maia-child-prefix.json", "utf8"));

test("both raw-mass thresholds cover the full selected child frame with honest residuals", () => {
  assert.deepEqual({ ...compileMaiaChildPrefix(...inputs), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 392);
  assert.equal(artifact.named.length, 370);
  assert.equal(artifact.cap, 8);
  assert.deepEqual(artifact.thresholds, [0.8, 0.9]);
  for (const threshold of artifact.thresholds) {
    const rows = artifact.rows.filter((row) => row.threshold === threshold);
    assert.equal(rows.filter((row) => row.status === "threshold_reached").length, threshold === 0.8 ? 191 : 168);
    assert.equal(rows.filter((row) => row.status === "cap_exhausted").length, threshold === 0.8 ? 5 : 28);
    for (const row of rows) {
      assert.ok(row.selected.length <= 8);
      assert.ok(Math.abs(row.coveredRawMass + row.returnedTailMass + row.unreturnedRawMass - 1) < 0.000_002);
      if (row.status === "threshold_reached") {
        assert.ok(row.coveredRawMass >= threshold - 0.000_000_001);
        assert.ok(row.coveredRawMass - row.selected.at(-1).rawMass < threshold);
      }
    }
  }
});

test("named reply outside the returned window is unknown mass, not zero", () => {
  const source = new Set(inputs[2].rows.filter((row) => row.status === "named_pawn_punishment_witness").map((row) => `${row.rootId}|${row.targetId}|${row.candidateUci}`));
  for (const threshold of [0.8, 0.9]) {
    const rows = artifact.named.filter((row) => row.threshold === threshold && source.has(`${row.rootId}|${row.targetId}|${row.candidateUci}`));
    assert.equal(rows.length, 32);
    assert.equal(rows.filter((row) => row.status === "named_reply_unreturned_unknown_mass").length, 26);
    assert.equal(rows.filter((row) => row.status === "named_reply_in_returned_tail").length, 5);
    assert.equal(rows.filter((row) => row.status === "named_reply_in_prefix").length, 1);
  }
});

test("source-off and missing candidate mass become typed absence", () => {
  const sourceOff = structuredClone(inputs[3]);
  sourceOff.rows[0].status = "source_off";
  const result = compileMaiaChildPrefix(...inputs.slice(0, 3), sourceOff);
  assert.ok(result.rows.filter((row) => row.rootId === sourceOff.rows[0].rootId && row.candidateUci === sourceOff.rows[0].candidateUci).every((row) => row.status === "source_off" && row.coveredRawMass === null));
  const missing = structuredClone(inputs[3]);
  missing.rows[0].missingCandidateMasses = 1;
  assert.ok(compileMaiaChildPrefix(...inputs.slice(0, 3), missing).rows.filter((row) => row.rootId === missing.rows[0].rootId && row.candidateUci === missing.rows[0].candidateUci).every((row) => row.status === "mass_unreconciled"));
});

test("crossed named reply and configured-sampling authority are refused", () => {
  const material = structuredClone(inputs[1]);
  material.rows.find((row) => row.positiveCaptureUci !== null).positiveCaptureUci = "a1a1";
  assert.throws(() => compileMaiaChildPrefix(inputs[0], material, inputs[2], inputs[3]), /Named reply not legal/u);
  const source = structuredClone(inputs[3]);
  source.source.massMeaning = "configured_sampling_probability";
  assert.throws(() => compileMaiaChildPrefix(...inputs.slice(0, 3), source), /Crossed or incomplete Maia child source/u);
});
