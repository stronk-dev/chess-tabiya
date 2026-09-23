import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateStockfishChildCapture } from "./stockfish-child-capture-check.mjs";

const graphBytes = readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json");
const graph = JSON.parse(graphBytes.toString());
const capture = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-stockfish-child-capture.json", "utf8"));
const root = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-stockfish-capture.json", "utf8"));
const validate = (candidate) => validateStockfishChildCapture(candidate, graph, graphBytes, root);

test("all candidate-child Stockfish sources join independently enumerated legal replies", () => {
  const result = validate(capture);
  assert.equal(result.positions, 196);
  assert.deepEqual(Object.keys(result.budgets), ["depth8", "depth12", "movetime100"]);
  for (const budget of Object.values(result.budgets)) assert.equal(budget.legal, 6310);
});

test("crossed position, deleted legal reply and lost budget fail", () => {
  const crossed = structuredClone(capture);
  crossed.rows[0].fen = crossed.rows[1].fen;
  assert.throws(() => validate(crossed), /Crossed child position/u);
  const deleted = structuredClone(capture);
  deleted.rows[0].probes[0].legal.pop();
  assert.throws(() => validate(deleted), /legal denominator differs/u);
  const lost = structuredClone(capture);
  lost.rows[0].probes.pop();
  assert.throws(() => validate(lost), /omitted a budget/u);
});

test("invented score, PV or bestmove cannot cross the child-source boundary", () => {
  const score = structuredClone(capture);
  score.rows[0].probes[0].entries[0].score.value = 0.25;
  assert.throws(() => validate(score), /Invalid child Stockfish score/u);
  const pv = structuredClone(capture);
  pv.rows[0].probes[0].entries[0].pv[0] = "a1a1";
  assert.throws(() => validate(pv), /Disconnected child Stockfish PV/u);
  const best = structuredClone(capture);
  best.rows[0].probes[0].bestmove = "a1a1";
  assert.throws(() => validate(best), /Bestmove\/rank mismatch/u);
});

test("another graph or executable cannot impersonate the frozen source", () => {
  const graphChanged = structuredClone(capture);
  graphChanged.exactReplyDigest = `sha256:${"0".repeat(64)}`;
  assert.throws(() => validate(graphChanged), /another exact graph/u);
  const engineChanged = structuredClone(capture);
  engineChanged.source.executableDigest = `sha256:${"0".repeat(64)}`;
  assert.throws(() => validate(engineChanged), /executable differs/u);
});
