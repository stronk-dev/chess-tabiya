import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileSemanticRelationEventFirstLayer } from "./dist/semantic-relation-event-first-layer.mjs";

const read = (name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}.json`, "utf8"));
const comparisons = read("d3262-target-comparison-frame");
const graph = read("d3262-exact-replies");
const touch = read("d3262-semantic-touch-first-layer");
const artifact = read("d3262-semantic-relation-event-first-layer");
const material = read("d3262-material-immediate");
const witness = read("d3262-destination-reply-witness");
const key = (row) => `${row.rootId}|${row.targetId}|${row.candidateUci}`;

test("typed events recompute from target declarations and exact legal replies alone", () => {
  assert.deepEqual({ ...compileSemanticRelationEventFirstLayer(comparisons, graph), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 185);
  assert.equal(artifact.rows.filter((row) => row.status === "event_available").length, 153);
  assert.equal(artifact.rows.filter((row) => row.status === "no_legal_event").length, 20);
  assert.equal(artifact.rows.filter((row) => row.status === "operand_absent").length, 12);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.eventReplies.length, 0), 153);
  assert.ok(artifact.rows.every((row) => row.eventReplies.every((event) => ["named_attacker_captures_target", "named_minor_arrives_on_square"].includes(event.kind))));
});

test("held-out named positives are all events, but fourteen material events are not positive exchanges", () => {
  const byKey = new Map(artifact.rows.map((row) => [key(row), row]));
  const positives = [
    ...material.rows.filter((row) => row.positiveCaptureUci !== null).map((row) => ({ ...row, named: row.positiveCaptureUci })),
    ...witness.rows.filter((row) => row.arrivalUci !== null).map((row) => ({ ...row, named: row.arrivalUci })),
  ];
  assert.equal(positives.length, 139);
  assert.ok(positives.every((row) => byKey.get(key(row))?.eventReplies.some((event) => event.uci === row.named)));
  const negativeMaterial = material.rows.filter((row) => row.positiveCaptureUci === null && byKey.get(key(row))?.eventReplies.length);
  assert.equal(negativeMaterial.length, 14);
  assert.ok(negativeMaterial.every((row) => row.cause === "exchange_neutralized"));
  const sourceControls = witness.rows.filter((row) => row.status === "named_pawn_punishment_witness");
  assert.equal(sourceControls.length, 32);
  assert.ok(sourceControls.every((row) => byKey.get(key(row)).eventReplies.some((event) => event.uci === row.arrivalUci)));
});

test("a broad touch without the exact named event is excluded", () => {
  const byKey = new Map(artifact.rows.map((row) => [key(row), row]));
  const decoy = touch.rows.find((row) => row.status === "measured" && row.touchReplies.some((reply) => !byKey.get(key(row)).eventReplies.some((event) => event.uci === reply.uci)) && byKey.get(key(row)).eventReplies.length);
  assert.ok(decoy);
  const decoyUci = decoy.touchReplies.find((reply) => !byKey.get(key(decoy)).eventReplies.some((event) => event.uci === reply.uci)).uci;
  assert.ok(!byKey.get(key(decoy)).eventReplies.some((event) => event.uci === decoyUci));
});

test("false declared actor and crossed legal reply fail closed", () => {
  const falseActor = structuredClone(comparisons);
  falseActor.definitions.find((row) => row.family === "material").target.attacker.square = "a1";
  assert.throws(() => compileSemanticRelationEventFirstLayer(falseActor, graph), /Declared piece identity absent/u);
  const crossed = structuredClone(graph);
  crossed.roots[0].candidates[0].replies[0].fen = crossed.roots[0].candidates[0].replies[1].fen;
  assert.throws(() => compileSemanticRelationEventFirstLayer(comparisons, crossed), /Crossed relation reply FEN/u);
});
