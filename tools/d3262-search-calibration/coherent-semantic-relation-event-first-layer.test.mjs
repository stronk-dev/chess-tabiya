import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentRelationEvents } from "./dist/coherent-semantic-relation-event-first-layer.mjs";

const directory = "planning/semantic-consequence-search/";
function read(name) { return JSON.parse(readFileSync(`${directory}${name}.json`)); }
const comparisons = read("d3262-coherent-target-comparison-frame");
const graph = read("d3262-coherent-exact-replies");
const artifact = read("d3262-coherent-relation-event-first-layer");

test("corrected source-blind events cover exactly the corrected comparison population", () => {
  assert.deepEqual(artifact, { ...compileCoherentRelationEvents(comparisons, graph), inputDigests: artifact.inputDigests });
  assert.equal(artifact.rows.length, 182);
  assert.equal(artifact.rows.filter((row) => row.status === "event_available").length, 152);
  assert.equal(artifact.rows.filter((row) => row.status === "no_legal_event").length, 18);
  assert.equal(artifact.rows.filter((row) => row.status === "operand_absent").length, 12);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.eventReplies.length, 0), 152);
  assert.ok(artifact.rows.every((row) => row.eventReplies.every((event) =>
    ["named_attacker_captures_target", "named_minor_arrives_on_square"].includes(event.kind))));
});

test("the corrected census refuses a missing comparison or crossed declared actor", () => {
  const missing = { ...comparisons, comparisons: comparisons.comparisons.slice(1) };
  assert.throws(() => compileCoherentRelationEvents(missing, graph), /lost named comparisons/u);
  const falseActor = structuredClone(comparisons);
  falseActor.definitions.find((row) => row.family === "material").target.attacker.square = "a1";
  assert.throws(() => compileCoherentRelationEvents(falseActor, graph), /Declared piece identity absent/u);
});
