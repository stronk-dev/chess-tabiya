import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CANDIDATE_COLLECTOR_EXECUTION,
  CandidateReceiptCache,
  createCandidateCompilerForAuthor,
  measureRetainedGraph,
  projectWide,
} from "../d2655-candidate-packet-eighth-author-repair/model.mjs";

const modelSource = readFileSync(
  "tools/d2655-candidate-packet-eighth-author-repair/model.mjs",
  "utf8",
);

function fixtureFactory({ deeplyFrozen = true } = {}) {
  const moves = [
    { uci: "e2e4", from: "e2", to: "e4", role: "pawn" },
    { uci: "g1f3", from: "g1", to: "f3", role: "knight" },
  ];
  const pieces = [
    { piece: { square: "e2", role: "pawn", color: "white" }, moves: [moves[0]] },
    { piece: { square: "g1", role: "knight", color: "white" }, moves: [moves[1]] },
  ];
  if (deeplyFrozen) {
    for (const move of moves) Object.freeze(move);
    for (const row of pieces) {
      Object.freeze(row.piece);
      Object.freeze(row.moves);
      Object.freeze(row);
    }
    Object.freeze(moves);
    Object.freeze(pieces);
  }
  const map = Object.freeze({ fen: "fixture", turn: "white", pieces });
  return { map, moves, exactLegalMoveMap: () => map };
}

function compile(scope = "events_and_readings", options) {
  const source = fixtureFactory(options);
  const compiler = createCandidateCompilerForAuthor(source.exactLegalMoveMap);
  const compiled = compiler.compile({ beforeFen: "fixture", ruleset: "standard", scope });
  return { ...source, compiler, compiled };
}

function roomyCache() {
  return new CandidateReceiptCache({
    maxEntries: 8,
    maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER,
    maxRetainedObjects: Number.MAX_SAFE_INTEGER,
  });
}

test("D2678 the author compiler accepts caller-owned fields outside the closed request", () => {
  const { compiler } = compile("events");
  assert.doesNotThrow(() => compiler.compile({
    beforeFen: "fixture",
    ruleset: "standard",
    scope: "events",
    afterFen: "caller-chosen-child",
    manifest: { digest: "caller-manifest" },
    legalMoves: [{ uci: "a1a8" }],
  }));
});

test("D2679 packet identity omits the required authority and convention terms", () => {
  const { compiled } = compile("events");
  assert.equal(compiled.packet.id, "fixture:events");
  assert.doesNotMatch(compiled.packet.id, /fixture-primary-manifest/u);
  assert.doesNotMatch(modelSource, /CANDIDATE_PACKET_COMPILER_VERSION|MOVE_IDENTITY_CONVENTION|legalConvention/u);
  assert.match(modelSource, /id: `\$\{beforeFen\}:\$\{scope\}`/u);
});

test("D2680 direct and projected narrow packets share an id while retaining different graphs", () => {
  const direct = compile("readings").compiled;
  const projected = projectWide(compile("events_and_readings").compiled, "readings");
  assert.equal(direct.packet.id, projected.packet.id);
  assert.equal(direct.references.candidateInputs[0].executionOutcomes.length, 5);
  assert.equal(projected.references.candidateInputs[0].executionOutcomes.length, 13);
  assert.notDeepEqual(
    measureRetainedGraph(direct.references),
    measureRetainedGraph(projected.references),
  );
});

test("D2681 cache identity is an arbitrary caller key rather than the compiled packet id", () => {
  const events = compile("events").compiled;
  const readings = compile("readings").compiled;
  const cache = roomyCache();
  assert.equal(cache.admit("caller-key", events).cache, "miss");
  assert.strictEqual(cache.get("caller-key"), events);
  assert.equal(cache.admit("same-key", events).cache, "miss");
  assert.equal(cache.admit("same-key", readings).cache, "miss");
  assert.strictEqual(cache.get("same-key"), readings);
});

test("D2682 cache measures one reference graph but may publish a crossed result wrapper", () => {
  const { compiled } = compile("events");
  const crossedPacket = Object.freeze({ ...compiled.packet, beforeFen: "foreign-position" });
  const crossed = Object.freeze({ ...compiled, packet: crossedPacket });
  const cache = roomyCache();
  assert.equal(cache.admit("crossed", crossed).cache, "miss");
  const served = cache.get("crossed");
  assert.strictEqual(served.packet, crossedPacket);
  assert.notStrictEqual(served.packet, served.references.packet);
});

test("D2683 shallow-frozen predecessor values remain mutable behind a cached packet", () => {
  const { compiled, moves } = compile("events", { deeplyFrozen: false });
  assert.equal(Object.isFrozen(compiled.packet), true);
  assert.equal(Object.isFrozen(compiled.packet.legalMoves[0]), false);
  moves[0].uci = "a1a8";
  assert.equal(compiled.packet.legalMoves[0].uci, "a1a8");
  assert.equal(compiled.packet.candidates[0].moveUci, "e2e4");
});

test("D2684 the thirteen collectors are local lookalikes rather than the declared adapters", () => {
  assert.equal(Object.keys(CANDIDATE_COLLECTOR_EXECUTION).length, 13);
  assert.ok(Object.values(CANDIDATE_COLLECTOR_EXECUTION).every((row) => (
    row.collect.name === "collectAvailable" || row.collect.name === "collectLoosePiece"
  )));
  assert.match(modelSource, /function collectAvailable/u);
  assert.doesNotMatch(modelSource, /from ["'][^"']*(?:semantic-evidence|evidence-source-adapters|evidence-factories)/u);
});
