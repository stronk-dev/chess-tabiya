import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentImmediateAndWitness } from "./dist/coherent-immediate-and-witness.mjs";

const dir = "planning/semantic-consequence-search";
const load = (name) => JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));
const comparisons = load("d3262-coherent-target-comparison-frame.json");
const roots = load("d3262-coherent-root-frame.json");
const graph = load("d3262-coherent-exact-replies.json");
const source = JSON.parse(readFileSync("tools/d1023-bounded-policy-harness/provider-sample.json", "utf8"));
const artifact = load("d3262-coherent-immediate-and-witness.json");

test("corrected immediate readings retain all named comparisons and independent source controls", () => {
  const actual = compileCoherentImmediateAndWitness(comparisons, roots, graph, source);
  assert.deepEqual({ ...actual, inputDigests: artifact.inputDigests }, artifact);
  assert.equal(actual.material.rows.length, 94);
  assert.equal(actual.destination.rows.length, 88);
  assert.equal(actual.material.sourceControls + actual.destination.sourceControls, 96);
  assert.equal(actual.destinationWitness.rows.length, 88);
  assert.ok(actual.destinationWitness.rows.every((row) => row.status.endsWith("_witness") || row.status === "named_minor_absent"));
});

test("crossed corrected frame, graph, candidate FEN and source truth fail closed", () => {
  const badRoots = structuredClone(roots);
  badRoots.authority = "shared_candidate_population_not_move_grade";
  assert.throws(() => compileCoherentImmediateAndWitness(comparisons, badRoots, graph, source), /Crossed root frame/u);
  const badGraph = structuredClone(graph);
  badGraph.authority = "complete_legal_opponent_reply_edges_not_a_semantic_proof";
  assert.throws(() => compileCoherentImmediateAndWitness(comparisons, roots, badGraph, source), /Crossed exact reply graph/u);
  const crossedCandidate = structuredClone(graph);
  const observed = comparisons.comparisons.find((pair) => pair.sourceObserved);
  crossedCandidate.roots.find((root) => root.rootId === observed.rootId).candidates
    .find((candidate) => candidate.candidateUci === observed.candidateUci).afterFen = roots.roots[0].fen;
  assert.throws(() => compileCoherentImmediateAndWitness(comparisons, roots, crossedCandidate, source), /Exact reply graph disagrees/u);
  const badSource = structuredClone(source);
  const row = badSource.populations.flatMap((population) => population.rows).find((item) => item.targetFamily === "material");
  row.exact.immediate = row.exact.immediate === "removed" ? "preserved" : "removed";
  assert.throws(() => compileCoherentImmediateAndWitness(comparisons, roots, graph, badSource), /source control disagrees/u);
});

test("witnesses never promote a locally safe arrival into an all-reply proof", () => {
  for (const row of artifact.destinationWitness.rows) {
    if (row.status === "locally_safe_arrival_witness") {
      assert.deepEqual(row.witnessPath, [row.candidateUci, row.arrivalUci]);
      assert.equal(row.namedPawnCaptureUci, null);
    }
    if (row.status === "named_pawn_punishment_witness") {
      assert.deepEqual(row.witnessPath, [row.candidateUci, row.arrivalUci, row.namedPawnCaptureUci]);
      assert.ok(row.positiveCaptureUcis.includes(row.namedPawnCaptureUci));
    }
  }
  assert.match(artifact.authority, /not_all_defences_or_move_grade/u);
});
