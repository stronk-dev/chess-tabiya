// DISPOSABLE independent buildability review for D2428. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");
const adapters = readFileSync("packages/runtime/src/evidence-source-adapters.ts", "utf8");
const normative = rfc.split("\n## Fourth fresh independent return", 1)[0];
const exactAdapter = adapters.match(
  /export function declareExactLegalMovesEvidence\([\s\S]*?\n\}/u,
)?.[0] ?? "";

test("D2428 specified compilation plus the production adapter execute the authority twice", () => {
  assert.match(normative, /const payload = exactLegalMoveMap\(beforeFen\)/u);
  assert.match(normative, /declareExactLegalMovesEvidence\(payload\)/u);
  assert.match(exactAdapter, /const expected = exactLegalMoveMap\(payload\.fen\)/u);

  let calls = 0;
  const exactLegalMoveMap = (fen) => { calls += 1; return Object.freeze({ fen }); };
  const declareLikeProduction = (payload) => {
    const expected = exactLegalMoveMap(payload.fen);
    assert.deepEqual(payload, expected);
    return Object.freeze({ payload });
  };
  const payload = exactLegalMoveMap("fixture");
  const declared = declareLikeProduction(payload);
  assert.strictEqual(declared.payload, payload);
  assert.equal(calls, 2);
});

test("D2428 criterion 36 requires one call while the implementation surface leaves the adapter unchanged", () => {
  const criterion = rfc.match(/36\. \*\*One sealed exact-map object[\s\S]*?(?=\n## Fourth fresh)/u)?.[0] ?? "";
  const surface = rfc.match(/### \u00a712 \u2014 Implementation surface[\s\S]*?(?=\n### \u00a713)/u)?.[0] ?? "";
  assert.match(criterion, /assert exactly one `exactLegalMoveMap\(beforeFen\)` call/u);
  assert.doesNotMatch(surface, /`packages\/runtime\/src\/evidence-source-adapters\.ts`/u);
});

test("D2428 one retained value graph does not make the second computation disappear", () => {
  assert.match(exactAdapter, /return exactObject\("rules\.mobility", projection, payload, required\)/u);
  assert.match(rfc, /One `exactLegalMoveMap` object now owns declaration/u);
  assert.match(rfc, /exactly one `exactLegalMoveMap\(beforeFen\)` call/u);
});
