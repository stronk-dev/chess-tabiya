import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { classifyDestinationReply, compileCoherentDestinationReplyControl } from "./dist/coherent-destination-reply-control.mjs";

const directory = "planning/semantic-consequence-search";
const comparisons = JSON.parse(readFileSync(`${directory}/d3262-coherent-target-comparison-frame.json`, "utf8"));
const graph = JSON.parse(readFileSync(`${directory}/d3262-coherent-exact-replies.json`, "utf8"));

test("all 88 named destination comparisons retain every exact legal reply", () => {
  const result = compileCoherentDestinationReplyControl(comparisons, graph);
  assert.equal(result.rows.length, 88);
  assert.equal(result.rows.filter((row) => row.sourceObserved).length, 32);
  for (const row of result.rows) assert.equal(row.replies.length, row.legalReplyCount);
  for (const row of result.rows.filter((entry) => entry.sourceObserved)) {
    const arrivals = row.replies.filter((reply) => reply.minorReply === "arrived_named_square");
    assert.equal(arrivals.length, 1);
    assert.equal(arrivals[0].namedPawnWinsArrival, true);
  }
  for (const row of result.rows) for (const reply of row.replies) {
    if (reply.minorReply !== "arrived_named_square") assert.equal(reply.namedPawnWinsArrival, null);
    if (reply.namedPawnWinsArrival === true) assert.equal(reply.controllerRetained, true);
  }
  const sourcePawnPush = result.rows.find((row) => row.rootId === "d1023:3e77bf53f9edd017" && row.candidateUci === "d4d5");
  assert.equal(sourcePawnPush?.replies.find((reply) => reply.uci === "a5d5")?.controllerRetained, false);
  assert.ok(result.rows.filter((row) => row.sourceObserved).some((row) =>
    row.replies.some((reply) => reply.minorReply === "arrived_named_square" && reply.namedPawnWinsArrival)));
});

test("a reply FEN borrowed from another legal move cannot produce a false persistence reading", () => {
  const pair = comparisons.comparisons.find((row) =>
    comparisons.definitions.some((definition) => definition.id === row.targetId && definition.family === "destination"));
  const definition = comparisons.definitions.find((row) => row.id === pair.targetId);
  const candidate = graph.roots.find((row) => row.rootId === pair.rootId).candidates.find((row) => row.candidateUci === pair.candidateUci);
  assert.ok(candidate.replies.length > 1);
  assert.throws(() => classifyDestinationReply(candidate.afterFen, candidate.replies[0].uci,
    candidate.replies[1].fen, definition.target), /Reply FEN does not replay/);
});

test("crossed target and reply manifests fail closed", () => {
  assert.throws(() => compileCoherentDestinationReplyControl(comparisons, { ...graph, manifest: "wrong" }),
    /Crossed corrected target\/reply population/);
});
