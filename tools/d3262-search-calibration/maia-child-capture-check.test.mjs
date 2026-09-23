import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateMaiaChildCapture } from "./maia-child-capture-check.mjs";

const graphBytes = readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json");
const graph = JSON.parse(graphBytes.toString());
const capture = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-maia-child-capture.json", "utf8"));

test("all selected child positions join their complete legal reply populations", () => {
  const reading = validateMaiaChildCapture(capture, graph, graphBytes);
  assert.deepEqual({ positions: reading.positions, captured: reading.captured, sourceOff: reading.sourceOff, legalMoves: reading.legalMoves, retainedMoves: reading.retainedMoves, unreturnedMoves: reading.unreturnedMoves, missingMasses: reading.missingMasses, castlingEncoded: reading.castlingEncoded }, { positions: 196, captured: 196, sourceOff: 0, legalMoves: 6310, retainedMoves: 3749, unreturnedMoves: 2561, missingMasses: 0, castlingEncoded: 24 });
});

test("crossed position, invented legal move, altered mass and source substitution fail", () => {
  const crossed = structuredClone(capture);
  crossed.rows[0].fen = capture.rows[1].fen;
  assert.throws(() => validateMaiaChildCapture(crossed, graph, graphBytes), /Crossed Maia child position/u);
  const illegal = structuredClone(capture);
  illegal.rows[0].candidates[0].legalUci = "a1a1";
  assert.throws(() => validateMaiaChildCapture(illegal, graph, graphBytes), /Illegal, crossed or duplicate Maia child move/u);
  const mass = structuredClone(capture);
  mass.rows[0].candidates[0].mass += 0.02;
  assert.throws(() => validateMaiaChildCapture(mass, graph, graphBytes), /Maia child returned mass differs/u);
  const source = structuredClone(capture);
  source.rows[0].engine.modelId = "other-model";
  assert.throws(() => validateMaiaChildCapture(source, graph, graphBytes), /Wrong Maia child model/u);
});

test("provider-off stays in the denominator with unknown, not zero, policy mass", () => {
  const sourceOff = structuredClone(capture);
  const first = sourceOff.rows[0];
  sourceOff.rows[0] = { rootId: first.rootId, candidateUci: first.candidateUci, fen: first.fen, legalReplyUcis: first.legalReplyUcis, status: "source_off", errorCode: "network_unavailable", elapsedMs: first.elapsedMs };
  const reading = validateMaiaChildCapture(sourceOff, graph, graphBytes);
  assert.equal(reading.captured, 195);
  assert.equal(reading.sourceOff, 1);
  assert.equal(reading.unreturnedMoves, 2561 - first.unreturnedLegalCount + first.legalReplyUcis.length);
});
