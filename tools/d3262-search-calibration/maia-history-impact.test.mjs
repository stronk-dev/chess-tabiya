import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileMaiaHistoryImpact } from "./maia-history-impact.mjs";

const directory = "planning/semantic-consequence-search";
const read = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`));
const inputs = [read("d3262-target-comparison-frame"), read("d3262-material-immediate"), read("d3262-destination-reply-witness"), read("d3262-exact-replies")];
const graphBytes = readFileSync(`${directory}/d3262-exact-replies.json`);
const directBytes = readFileSync(`${directory}/d3262-maia-direct-logits.json`);
const direct = JSON.parse(directBytes), replay = read("d3262-maia-history-replay"), old = read("d3262-maia-direct-mass-frontier");
const artifact = read("d3262-maia-history-impact");
const compile = (changes = {}) => compileMaiaHistoryImpact(changes.comparisons ?? inputs[0], changes.material ?? inputs[1], changes.witness ?? inputs[2], changes.graph ?? inputs[3], graphBytes, changes.direct ?? direct, directBytes, changes.replay ?? replay, changes.old ?? old);

test("the path replay changes Maia frontier identities without changing the one pawn-denial positive", () => {
  const result = compile();
  assert.deepEqual({ ...result, inputDigests: artifact.inputDigests }, artifact);
  assert.deepEqual(result.frontiers["0.8"], { empty: 415, replayed: 421, added: 53, dropped: 47, overlap: 368 });
  assert.deepEqual(result.frontiers["0.9"], { empty: 510, replayed: 518, added: 66, dropped: 58, overlap: 452 });
  assert.deepEqual(result.sourcePawnDenial, { emptyPositive: 1, replayedPositive: 1 });
  const positives = result.named.filter((row) => row.sourcePawnDenial && (row.emptyStatus === "configured_positive" || row.replayedStatus === "configured_positive"));
  assert.equal(positives.length, 1);
  assert.equal(positives[0].namedReplyUci, "f3g5");
});

test("crossed path, changed frozen frontier and missing named reading fail", () => {
  const crossed = structuredClone(replay);
  crossed.rows[0].historyUci = [];
  assert.throws(() => compile({ replay: crossed }), /path mismatch/u);

  const changed = structuredClone(old);
  changed.rows[0].configuredSupport[0].mass += 0.01;
  assert.throws(() => compile({ old: changed }), /Frozen empty-history Maia frontier drift/u);

  const missing = structuredClone(inputs[2]);
  missing.rows.pop();
  assert.throws(() => compile({ witness: missing }), /Missing named direct-Maia reading|Named Maia history denominator drift/u);
});
