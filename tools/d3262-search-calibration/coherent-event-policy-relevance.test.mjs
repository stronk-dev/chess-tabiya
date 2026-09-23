import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentEventPolicyRelevance } from "./coherent-event-policy-relevance.mjs";

const dir = "planning/semantic-consequence-search";
const load = (name) => JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));
const reach = load("d3262-coherent-event-reach-evaluation.json");
const events = load("d3262-coherent-relation-event-first-layer.json");
const graph = load("d3262-coherent-exact-replies.json");
const retained = load("d3262-maia-history-replay.json");
const added = load("d3262-maia-coherent-new-child.json");
const artifact = load("d3262-coherent-event-policy-relevance.json");

test("configured path-keyed mass stays distinct from local witness and human frequency", () => {
  const actual = compileCoherentEventPolicyRelevance(reach, events, graph, retained, added);
  assert.deepEqual({ ...actual, inputDigests: artifact.inputDigests }, artifact);
  assert.equal(actual.rows.length, 182);
  const positive = actual.rows.filter((row) => row.positiveUci !== null);
  const unproven = actual.rows.filter((row) => row.positiveUci === null && row.eventUcis.length > 0);
  assert.equal(positive.length, 84);
  assert.equal(positive.filter((row) => row.configuredPositiveMass > 0).length, 38);
  assert.equal(unproven.length, 68);
  assert.equal(unproven.filter((row) => row.configuredEventMass > 0).length, 21);
  assert.equal(actual.rows.filter((row) => row.family === "destination" && row.sourceObserved
    && row.configuredPositiveMass > 0).length, 1);
  assert.match(actual.authority, /not_human_frequency_or_engine_cause/u);
});

test("missing legal row, crossed history, changed model and forged support mass fail", () => {
  const missing = structuredClone(retained);
  missing.rows[0].rawFullLegal.pop();
  assert.throws(() => compileCoherentEventPolicyRelevance(reach, events, graph, missing, added), /Incomplete exact Maia legal denominator/u);
  const crossed = structuredClone(retained);
  crossed.rows[0].historyUci = ["a1a8"];
  assert.throws(() => compileCoherentEventPolicyRelevance(reach, events, graph, crossed, added), /Crossed Maia history/u);
  const changedModel = structuredClone(added);
  changedModel.source.modelId = "other";
  assert.throws(() => compileCoherentEventPolicyRelevance(reach, events, graph, retained, changedModel), /Crossed path-keyed Maia/u);
  const mass = structuredClone(retained);
  mass.rows[0].configuredSupport[0].mass = 2;
  assert.throws(() => compileCoherentEventPolicyRelevance(reach, events, graph, mass, added), /Invalid configured.*mass/u);
  const falseWitness = structuredClone(reach);
  falseWitness.rows.find((row) => row.positiveUci !== null && row.budget === "depth8"
    && row.width === 2 && row.eventSourceWidth === "top8").positiveUci = "a1a8";
  assert.throws(() => compileCoherentEventPolicyRelevance(falseWitness, events, graph, retained, added), /Positive witness does not belong/u);
});
