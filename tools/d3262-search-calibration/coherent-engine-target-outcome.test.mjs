import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { compactObservationReferences, compileEngineTargetOutcome, summarizeUnweightedTargetPaths } from "./coherent-engine-target-outcome.mjs";

const observations = new Map([
  ["before", { observation: { opportunityAtThirdPly: true, reintroducedAtThirdPly: true } }],
  ["execute", { observation: { executedAtFourthPly: true } }],
  ["other", { observation: { executedAtFourthPly: false } }],
]);
const selected = [{ pathId: "path", observationId: "before", leaves: [
  { leafId: "leaf1", observationId: "execute" }, { leafId: "leaf2", observationId: "other" } ] }];

test("an opportunity counts once at its predecessor, execution only on the actually selected leaf", () => {
  const summary = summarizeUnweightedTargetPaths(selected, observations);
  assert.equal(summary.selectedPredecessorPaths, 1); assert.equal(summary.selectedFourthPlyLeaves, 2);
  assert.deepEqual(summary.opportunityPaths, ["path"]); assert.deepEqual(summary.reintroducedPaths, ["path"]);
  assert.deepEqual(summary.executedLeaves, ["leaf1"]); assert.deepEqual(summary.executedReintroducedLeaves, ["leaf1"]);
  assert.equal(summary.negativeVerdict, "abstain_from_partial_frontier"); assert.equal(summary.universalVerdict, "not_evaluated");
  assert.match(summary.weightAuthority, /not_policy_mass_or_human_frequency/u);
  assert.ok(!Object.keys(summary).some((key) => /mass|probability|frequency/iu.test(key)));
});

test("selected availability with no target action is not an executed continuation", () => {
  const paths = structuredClone(selected); paths[0].leaves.shift();
  const summary = summarizeUnweightedTargetPaths(paths, observations);
  assert.deepEqual(summary.opportunityPaths, ["path"]); assert.deepEqual(summary.executedLeaves, []);
  assert.equal(summary.negativeVerdict, "abstain_from_partial_frontier");
  const empty = summarizeUnweightedTargetPaths([], observations);
  assert.equal(empty.universalVerdict, "not_evaluated"); assert.equal(empty.negativeVerdict, "abstain_from_partial_frontier");
});

test("duplicated predecessors/leaves, missing observations and execution without opportunity refuse", () => {
  assert.throws(() => summarizeUnweightedTargetPaths([...selected, ...selected], observations), /Duplicated target predecessor/u);
  const duplicated = structuredClone(selected); duplicated[0].leaves.push(duplicated[0].leaves[0]);
  assert.throws(() => summarizeUnweightedTargetPaths(duplicated, observations), /Duplicated target leaf/u);
  assert.throws(() => summarizeUnweightedTargetPaths(selected, new Map()), /Missing predecessor/u);
  const crossed = new Map(observations); crossed.set("before", { observation: { opportunityAtThirdPly: false, reintroducedAtThirdPly: false } });
  assert.throws(() => summarizeUnweightedTargetPaths(selected, crossed), /no actual predecessor opportunity/u);
});

test("source populations and exact-baseline digest changes refuse before observing a target", () => {
  const load = (name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}`));
  const comparison = load("d3262-coherent-target-comparison-frame.json"), roots = load("d3262-coherent-root-frame.json"), baseline = load("d3262-coherent-bounded-targets.json");
  const frontier = { profile: "d3262-coherent-engine-fourth-ply-v1", manifest: comparison.manifest, profiles: [{}, {}] };
  for (const [pair, root, exact, digest] of [
    [{ ...comparison, comparisons: comparison.comparisons.slice(1) }, roots, baseline, {}],
    [comparison, { ...roots, roots: roots.roots.slice(1) }, baseline, {}],
    [comparison, roots, baseline, { "d3262-coherent-root-frame.json": "wrong", "d3262-coherent-target-comparison-frame.json": "wrong" }],
  ]) assert.throws(() => compileEngineTargetOutcome(pair, root, exact, frontier, digest), /actual engine target authorities/u);
});

test("compact references preserve exact named predecessor/leaf identities and refuse crossed or missing rows", () => {
  const rows = [{ id: "before", pathId: "path" }, { id: "execute", pathId: "leaf1" }, { id: "other", pathId: "leaf2" }];
  const profiles = [{ rows: [{ arms: [{ paths: selected }] }] }];
  const compact = compactObservationReferences(profiles, rows)[0].rows[0].arms[0].paths;
  assert.deepEqual(compact, [{ predecessorObservation: 0, leafObservations: [1, 2] }]);
  assert.equal(rows[compact[0].predecessorObservation].pathId, "path");
  assert.deepEqual(compact[0].leafObservations.map((i) => rows[i].pathId), ["leaf1", "leaf2"]);
  assert.throws(() => compactObservationReferences(profiles, rows.slice(1)), /compact target observation/u);
  assert.throws(() => compactObservationReferences(profiles, [...rows, rows[0]]), /Duplicated compact observation/u);
  assert.throws(() => compactObservationReferences(profiles, [{ ...rows[0], pathId: "another" }, ...rows.slice(1)]), /compact target observation/u);
});
