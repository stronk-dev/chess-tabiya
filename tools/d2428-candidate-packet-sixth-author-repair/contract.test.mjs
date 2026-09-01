import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assertLegalPopulationOwned,
  compileLegalPopulation,
  createExactLegalEvidenceFactory,
} from "./model.mjs";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");
const move = Object.freeze({ uci: "e2e4", from: "e2", to: "e4", role: "pawn" });
const map = Object.freeze({
  fen: "fixture", turn: "white",
  pieces: Object.freeze([Object.freeze({
    piece: Object.freeze({ square: "e2", role: "pawn", color: "white" }),
    moves: Object.freeze([move]),
  })]),
});

test("D2428 one FEN factory call owns one authority call and one value graph", () => {
  let authorityCalls = 0;
  const adapter = createExactLegalEvidenceFactory((fen) => {
    authorityCalls += 1;
    assert.equal(fen, "fixture");
    return map;
  });
  let factoryCalls = 0;
  const compiled = compileLegalPopulation("fixture", (fen) => {
    factoryCalls += 1;
    return adapter(fen);
  });
  assert.equal(factoryCalls, 1);
  assert.equal(authorityCalls, 1);
  assert.strictEqual(compiled.legalMovesInput.payload, map);
  assert.strictEqual(compiled.legalMoves[0], move);
  assert.doesNotThrow(() => assertLegalPopulationOwned(compiled));
});

test("D2428 caller maps and equal packet rebuilds cannot cross the source boundary", () => {
  let authorityCalls = 0;
  const adapter = createExactLegalEvidenceFactory(() => {
    authorityCalls += 1;
    return map;
  });
  assert.throws(() => adapter(map), /FEN_INVALID/u);
  assert.equal(authorityCalls, 0);
  const compiled = compileLegalPopulation("fixture", adapter);
  const rebuilt = Object.freeze({ ...compiled, legalMoves: Object.freeze(compiled.legalMoves.map((item) => Object.freeze({ ...item }))) });
  assert.deepEqual(rebuilt.legalMoves, compiled.legalMoves);
  assert.throws(() => assertLegalPopulationOwned(rebuilt), /RECEIPT_INVALID/u);
});

test("D2428 RFC owns the production adapter correction and measured boundary", () => {
  assert.match(rfc, /declareExactLegalMovesEvidence\(fen: string\)/u);
  assert.match(rfc, /imports neither `exactLegalMoveMap` nor `exactLegalMoves`/u);
  assert.match(rfc, /\| 1b \| `packages\/runtime\/src\/evidence-source-adapters\.ts`/u);
  assert.match(rfc, /\*\*2\.724×\*\*/u);
  assert.match(rfc, /another fresh independent review is required before implementation/u);
});
