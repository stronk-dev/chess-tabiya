import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileSemanticTouchFirstLayer } from "./dist/semantic-touch-first-layer.mjs";

const comparisons = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-target-comparison-frame.json", "utf8"));
const graph = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json", "utf8"));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-semantic-touch-first-layer.json", "utf8"));
const material = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-material-immediate.json", "utf8"));
const witness = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-destination-reply-witness.json", "utf8"));
const key = (row) => `${row.rootId}|${row.targetId}|${row.candidateUci}`;

test("source-blind operand changes cover the exact selected comparison and legal reply frame", () => {
  assert.deepEqual({ ...compileSemanticTouchFirstLayer(comparisons, graph), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 185);
  assert.equal(artifact.rows.filter((row) => row.status === "measured").length, 173);
  assert.equal(artifact.rows.filter((row) => row.status === "operand_absent").length, 12);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.legalReplies, 0), 6020);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.touchReplies.length, 0), 1265);
  assert.ok(artifact.rows.some((row) => row.status === "measured" && row.touchReplies.length < row.legalReplies));
  assert.ok(artifact.rows.every((row) => row.touchReplies.every((reply) => !Object.hasOwn(reply, "namedReplyUci"))));
});

test("independent named positive replies are touched, without having been inputs to selection", () => {
  const byKey = new Map(artifact.rows.map((row) => [key(row), row]));
  const named = [
    ...material.rows.filter((row) => row.positiveCaptureUci !== null).map((row) => ({ ...row, named: row.positiveCaptureUci })),
    ...witness.rows.filter((row) => row.arrivalUci !== null).map((row) => ({ ...row, named: row.arrivalUci })),
  ];
  assert.equal(named.length, 139);
  const touched = named.filter((row) => byKey.get(key(row))?.touchReplies.some((reply) => reply.uci === row.named));
  assert.equal(touched.length, 139);
  const pawnControls = witness.rows.filter((row) => row.status === "named_pawn_punishment_witness");
  assert.equal(pawnControls.length, 32);
  assert.ok(pawnControls.every((row) => byKey.get(key(row)).touchReplies.some((reply) => reply.uci === row.arrivalUci)));
});

test("false root operand and crossed legal reply FEN fail instead of producing a touch", () => {
  const falsePawn = structuredClone(comparisons);
  falsePawn.definitions.find((row) => row.family === "destination").sources[0].candidateUci = "a1a1";
  assert.throws(() => compileSemanticTouchFirstLayer(falsePawn, graph), /Ambiguous declared root pawn|Declared destination pawn absent/u);
  const crossed = structuredClone(graph);
  crossed.roots[0].candidates[0].replies[0].fen = crossed.roots[0].candidates[0].replies[1].fen;
  assert.throws(() => compileSemanticTouchFirstLayer(comparisons, crossed), /Crossed semantic-touch reply FEN/u);
});
