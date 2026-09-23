import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileHorizon4Frontier } from "./horizon4-frontier.mjs";

const read = (name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}.json`, "utf8"));
const graph = read("d3262-exact-replies");
const engine = read("d3262-stockfish-child-beam");
const maia = read("d3262-maia-direct-mass-frontier");
const semantic = read("d3262-semantic-relation-event-reserve");
const artifact = read("d3262-horizon4-frontier");

test("all three partial frontiers compile to one exact next-layer capture frame", () => {
  assert.deepEqual({ ...compileHorizon4Frontier(graph, engine, maia, semantic), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.paths.length, 2186);
  assert.equal(artifact.jobs.length, 2185);
  assert.equal(new Set(artifact.jobs.map((job) => job.fen)).size, artifact.jobs.length);
  assert.equal(artifact.jobs.reduce((sum, job) => sum + job.paths.length, 0), artifact.paths.length);
  const samePositionDifferentPaths = artifact.jobs.filter((job) => job.paths.length > 1);
  assert.equal(samePositionDifferentPaths.length, 1);
  assert.equal(samePositionDifferentPaths[0].paths.length, 2);
  assert.notDeepEqual(
    samePositionDifferentPaths[0].paths.map(({ rootId, candidateUci, replyUci }) => [rootId, candidateUci, replyUci])[0],
    samePositionDifferentPaths[0].paths.map(({ rootId, candidateUci, replyUci }) => [rootId, candidateUci, replyUci])[1],
  );
  assert.equal(artifact.paths.filter((row) => row.selectedBy.includes("maia:0.80")).length, 415);
  assert.equal(artifact.paths.filter((row) => row.selectedBy.includes("maia:0.90")).length, 510);
  assert.ok(artifact.paths.every((row) => !row.selectedBy.includes("maia:0.80") || row.selectedBy.includes("maia:0.90")));
});

test("a selected illegal reply, missing arm row or crossed policy is rejected", () => {
  const illegal = structuredClone(graph);
  const first = engine.rows.find((row) => row.width === 8);
  const child = illegal.roots.find((row) => row.rootId === first.rootId).candidates.find((row) => row.candidateUci === first.candidateUci);
  child.replies = child.replies.filter((row) => row.uci !== first.selected[0].moveUci);
  assert.throws(() => compileHorizon4Frontier(illegal, engine, maia, semantic), /Selected reply absent from exact legal graph/u);

  const missing = structuredClone(semantic);
  missing.rows.pop();
  assert.throws(() => compileHorizon4Frontier(graph, engine, maia, missing), /Frontier population drift/u);

  const crossed = structuredClone(maia);
  crossed.rows[0].configuredSupport[0].mass += 0.02;
  assert.throws(() => compileHorizon4Frontier(graph, engine, crossed, semantic), /Unreconciled configured Maia mass/u);
});
