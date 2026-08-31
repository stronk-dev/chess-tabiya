// DISPOSABLE independent buildability review for D2389. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");
const legal = readFileSync("packages/runtime/src/legal-moves.ts", "utf8");
const adapters = readFileSync("packages/runtime/src/evidence-source-adapters.ts", "utf8");

test("D2389 reproduces the two specified legal-population value sources", () => {
  assert.match(rfc, /legalMovesInput: DeclaredEvidence<ExactLegalMoveMap>/u);
  assert.match(rfc, /`legalMoves` is `exactLegalMoves\(beforeFen\)`/u);
  assert.match(rfc, /factory fixes `PRIMARY_EVIDENCE_MANIFEST`, `exactLegalMoves`/u);
  assert.match(legal, /export function exactLegalMoves\(fen: string\)[\s\S]*return movesFor\(positionFromFen\(fen\)\)/u);
  assert.match(legal, /export function exactLegalMoveMap\(fen: string\)[\s\S]*const moves = movesFor\(position\)/u);
  assert.match(adapters, /declareExactLegalMovesEvidence\(payload: ExactLegalMoveMap\)[\s\S]*const expected = exactLegalMoveMap\(payload\.fen\)/u);
});

test("D2389 shows why set equality cannot prove exact receipt ownership", () => {
  const move = Object.freeze({ uci: "e2e4" });
  const map = Object.freeze({ pieces: Object.freeze([Object.freeze({ moves: Object.freeze([move]) })]) });
  const flattened = map.pieces.flatMap((piece) => piece.moves);
  const independentlyEnumerated = flattened.map((item) => Object.freeze({ ...item }));

  assert.deepEqual(independentlyEnumerated.map((item) => item.uci), flattened.map((item) => item.uci));
  assert.notStrictEqual(independentlyEnumerated[0], map.pieces[0].moves[0]);
  assert.strictEqual(flattened[0], map.pieces[0].moves[0]);
});
