import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileStockfishChildBeam } from "./stockfish-child-beam.mjs";

const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-stockfish-child-capture.json"];
const inputs = names.map((name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}`, "utf8")));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-stockfish-child-beam.json", "utf8"));

test("ranked child beams cover the frozen candidate and target frames at every budget", () => {
  assert.deepEqual({ ...compileStockfishChildBeam(...inputs), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 196 * 3 * 3);
  assert.equal(artifact.named.length, 185 * 3 * 3);
  for (const budget of artifact.budgets) for (const width of artifact.widths) {
    const rows = artifact.rows.filter((row) => row.budget === budget && row.width === width);
    const named = artifact.named.filter((row) => row.budget === budget && row.width === width);
    assert.equal(rows.length, 196);
    assert.equal(named.length, 185);
    for (const row of rows) {
      assert.ok(row.selected.length <= width);
      assert.ok(row.selected.every((entry) => entry.rank <= width));
      assert.equal(row.retainedCount + row.missingCount, row.legalReplyCount);
    }
  }
});

test("an unreturned legal reply is unknown, not outside the beam with a fabricated rank", () => {
  const material = inputs[1].rows.find((row) => row.positiveCaptureUci !== null);
  const child = structuredClone(inputs[3]);
  const row = child.rows.find((value) => value.rootId === material.rootId && value.candidateUci === material.candidateUci);
  const probe = row.probes[0];
  probe.entries = probe.entries.filter((entry) => entry.moveUci !== material.positiveCaptureUci);
  if (!probe.missingMoves.includes(material.positiveCaptureUci)) probe.missingMoves.push(material.positiveCaptureUci);
  const result = compileStockfishChildBeam(...inputs.slice(0, 3), child);
  assert.ok(result.named.filter((entry) => entry.rootId === material.rootId && entry.targetId === material.targetId && entry.candidateUci === material.candidateUci && entry.budget === "depth8").every((entry) => entry.status === "named_reply_unreturned" && entry.rawRank === undefined));
});

test("crossed named reply and false score authority fail", () => {
  const material = structuredClone(inputs[1]);
  material.rows.find((row) => row.positiveCaptureUci !== null).positiveCaptureUci = "a1a1";
  assert.throws(() => compileStockfishChildBeam(inputs[0], material, inputs[2], inputs[3]), /Named reply not legal/u);
  const capture = structuredClone(inputs[3]);
  capture.source.scorePerspective = "learner_cp_grade";
  assert.throws(() => compileStockfishChildBeam(...inputs.slice(0, 3), capture), /Crossed or incomplete/u);
});
