// DISPOSABLE positive author contract for D2389. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");

function flattenByReference(declared) {
  return Object.freeze(declared.payload.pieces.flatMap((piece) => piece.moves));
}

function assertOwnedByDeclaration(flat, declared) {
  const retained = declared.payload.pieces.flatMap((piece) => piece.moves);
  assert.equal(flat.length, retained.length);
  for (let index = 0; index < flat.length; index += 1) assert.strictEqual(flat[index], retained[index]);
}

test("D2389 specifies one exact-map value graph from source through packet", () => {
  assert.match(rfc, /const payload = exactLegalMoveMap\(beforeFen\)/u);
  assert.match(rfc, /declareExactLegalMovesEvidence\(payload\)/u);
  assert.match(rfc, /legalMovesInput\.payload\.pieces\.flatMap\(piece => piece\.moves\)/u);
  assert.match(rfc, /neither imports nor calls `exactLegalMoves`/u);
  assert.match(rfc, /every member is reference-identical/u);
});

test("D2389 accepts flattened retained references and refuses an equal rebuild", () => {
  const move = Object.freeze({ uci: "e2e4", from: "e2", to: "e4", role: "pawn" });
  const payload = Object.freeze({
    fen: "fixture",
    turn: "white",
    pieces: Object.freeze([
      Object.freeze({ piece: Object.freeze({ square: "e2", role: "pawn", color: "white" }), moves: Object.freeze([move]) }),
    ]),
  });
  const declared = Object.freeze({ payload });
  const flat = flattenByReference(declared);
  assertOwnedByDeclaration(flat, declared);

  const rebuilt = Object.freeze(flat.map((item) => Object.freeze({ ...item })));
  assert.deepEqual(rebuilt, flat);
  assert.throws(() => assertOwnedByDeclaration(rebuilt, declared), assert.AssertionError);
});

test("D2389 adds a distinct acceptance falsifier instead of weakening set equality", () => {
  assert.match(rfc, /36\. \*\*One sealed exact-map object owns the flat population/u);
  assert.match(rfc, /fields and UCI set remain equal, but receipt compilation returns/u);
  assert.match(rfc, /must fail by identity,\s+not by order, fields or cardinality/u);
});
