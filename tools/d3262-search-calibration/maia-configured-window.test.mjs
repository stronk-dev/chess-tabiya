import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileMaiaConfiguredWindow, configuredWindow } from "./maia-configured-window.mjs";

const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-maia-child-capture.json"];
const inputs = names.map((name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}`, "utf8")));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-maia-configured-window.json", "utf8"));
function synthetic(masses, legalCount = masses.length) {
  const legalReplyUcis = Array.from({ length: legalCount }, (_, index) => `a${index}b${index}`);
  return { rootId: "synthetic", candidateUci: "synthetic", status: "captured", legalReplyUcis, candidates: masses.map((mass, index) => ({ moveUci: legalReplyUcis[index], legalUci: legalReplyUcis[index], rank: index + 1, mass })), missingCandidateMasses: 0, unreturnedLegalCount: legalCount - masses.length };
}

test("pinned Python/PyTorch temperature and top-p vector agrees with reconstructed support", () => {
  // Pinned Maia3 uci.py: softmax(logits / 0.8), sort, cumsum <= 0.92,
  // force top-1, then renormalize. Verified in the Maia container.
  const row = configuredWindow(synthetic([0.5, 0.3, 0.15, 0.05]));
  assert.equal(row.status, "certified_returned_support");
  assert.deepEqual(row.support.map((value) => value.rank), [1, 2]);
  assert.ok(Math.abs(row.support[0].nominalConfiguredMass - 0.6544215679168701) < 0.000_001);
  assert.ok(Math.abs(row.support[1].nominalConfiguredMass - 0.3455784320831299) < 0.000_001);
});

test("the full child frame has bounded support or typed uncertainty, never a fabricated complete vector", () => {
  assert.deepEqual({ ...compileMaiaConfiguredWindow(...inputs), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 196);
  assert.equal(artifact.named.length, 185);
  assert.equal(artifact.rows.filter((row) => row.status === "certified_returned_support").length, 194);
  assert.equal(artifact.rows.filter((row) => row.status === "unresolved_cutoff").length, 2);
  for (const row of artifact.rows) {
    if (row.status !== "certified_returned_support") { assert.equal(row.support, null); continue; }
    assert.ok(row.support.length >= 1 && row.support.length <= row.returnedCount);
    assert.ok(Math.abs(row.support.reduce((sum, value) => sum + value.nominalConfiguredMass, 0) - 1) < 0.000_000_001);
    for (const move of row.support) {
      assert.ok(move.configuredMassInterval[0] <= move.nominalConfiguredMass);
      assert.ok(move.configuredMassInterval[1] >= move.nominalConfiguredMass);
    }
  }
  assert.equal(artifact.named.filter((row) => row.status === "configured_unknown_cutoff").length, 2);
});

test("an omitted tail, source failure or unreconciled mass cannot masquerade as zero", () => {
  const tail = configuredWindow(synthetic([0.2], 5));
  assert.equal(tail.status, "unresolved_unreturned_tail");
  assert.equal(tail.support, null);
  assert.equal(configuredWindow({ status: "source_off" }).status, "source_off");
  const missing = synthetic([0.5, 0.3, 0.15, 0.05]);
  missing.missingCandidateMasses = 1;
  assert.equal(configuredWindow(missing).status, "mass_unreconciled");
});

test("a named reply crosses only the declared legal child and source authority", () => {
  const material = structuredClone(inputs[1]);
  material.rows.find((row) => row.positiveCaptureUci !== null).positiveCaptureUci = "a1a1";
  assert.throws(() => compileMaiaConfiguredWindow(inputs[0], material, inputs[2], inputs[3]), /Named reply not legal/u);
  const source = structuredClone(inputs[3]);
  source.source.massMeaning = "configured_sampling_probability";
  assert.throws(() => compileMaiaConfiguredWindow(...inputs.slice(0, 3), source), /Crossed or incomplete/u);
});
