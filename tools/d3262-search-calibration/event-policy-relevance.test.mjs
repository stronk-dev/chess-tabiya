import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileEventPolicyRelevance } from "./event-policy-relevance.mjs";

const read = (name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}.json`, "utf8"));
const events = read("d3262-semantic-relation-event-first-layer");
const stockfish = read("d3262-stockfish-child-capture");
const maia = read("d3262-maia-direct-logits");
const material = read("d3262-material-immediate");
const witness = read("d3262-destination-reply-witness");
const artifact = read("d3262-event-policy-relevance");

test("typed event/provider join recomputes the frozen population", () => {
  assert.deepEqual({ ...compileEventPolicyRelevance(events, stockfish, maia, material, witness), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 185);
  assert.equal(artifact.rows.filter((row) => row.status === "event_measured").length, 153);
  assert.equal(artifact.rows.filter((row) => row.eventUci === null).length, 32);
});

test("event evaluation remains separate from configured Maia support and engine rank", () => {
  const strata = [
    ["positive_named_capture", 53, 36, 40, 31],
    ["exchange_neutralized_capture", 14, 5, 5, 4],
    ["locally_safe_arrival_witness", 54, 15, 20, 7],
    ["named_pawn_punishment_witness", 32, 1, 0, 0],
  ];
  for (const [evaluation, total, configured, top8, both] of strata) {
    const rows = artifact.rows.filter((row) => row.evaluation === evaluation && row.status === "event_measured");
    assert.equal(rows.length, total, evaluation);
    assert.equal(rows.filter((row) => row.configuredMaiaMass > 0).length, configured, evaluation);
    assert.equal(rows.filter((row) => row.stockfishRanks.depth12 <= 8).length, top8, evaluation);
    assert.equal(rows.filter((row) => row.configuredMaiaMass > 0 && row.stockfishRanks.depth12 <= 8).length, both, evaluation);
  }
});

test("crossed sources and forged event identities fail closed", () => {
  const crossed = structuredClone(maia);
  crossed.source.band = 1900;
  assert.throws(() => compileEventPolicyRelevance(events, stockfish, crossed, material, witness), /Crossed direct Maia policy source/u);

  const forged = structuredClone(events);
  forged.rows.find((row) => row.eventReplies.length > 0).eventReplies[0].uci = "a1a1";
  assert.throws(() => compileEventPolicyRelevance(forged, stockfish, maia, material, witness), /Typed event absent from direct legal Maia source/u);

  const wrongEvaluation = structuredClone(material);
  wrongEvaluation.authority = "move_grade";
  assert.throws(() => compileEventPolicyRelevance(events, stockfish, maia, wrongEvaluation, witness), /Crossed material evaluation/u);
});
