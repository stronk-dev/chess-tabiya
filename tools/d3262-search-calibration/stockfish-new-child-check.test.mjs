import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { newChildJobs } from "./stockfish-new-child-check.mjs";

const directory = "planning/semantic-consequence-search/";
const graph = JSON.parse(readFileSync(`${directory}d3262-coherent-exact-replies.json`));
const oldGraph = JSON.parse(readFileSync(`${directory}d3262-exact-replies.json`));

test("only the three corrected candidates require new child provider captures", () => {
  assert.deepEqual(newChildJobs(graph, oldGraph).map((job) => [job.rootId, job.candidateUci, job.replies.length]), [
    ["d1023:32dbd41ca364bdb7", "f7f5", 17],
    ["d1023:e539b1202c9dcb20", "f2f3", 19],
    ["d1023:ef628fec1346fe49", "e1e2", 19],
  ]);
});

test("crossed graph and deleted new child cannot pass the source join", () => {
  const crossed = structuredClone(graph); crossed.roots[0].rootId = "other";
  assert.throws(() => newChildJobs(crossed, oldGraph), /Crossed child root/);
  const deleted = structuredClone(graph);
  const root = deleted.roots.find((item) => item.rootId === "d1023:32dbd41ca364bdb7");
  root.candidates = root.candidates.filter((item) => item.candidateUci !== "f7f5");
  assert.throws(() => newChildJobs(deleted, oldGraph), /population drifted/);
});
