import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(new URL("../../", import.meta.url).pathname);
const result = JSON.parse(readFileSync(resolve(ROOT, "planning/learner-rating/ac7-bracket-results.json"), "utf8"));
const digest = `sha256:${createHash("sha256").update([
  readFileSync(resolve(ROOT, "tools/learner-rating-bracket-harness/simulate.ts"), "utf8"),
  readFileSync(resolve(ROOT, "packages/runtime/src/rating.ts"), "utf8"),
].join("\n-- rating source --\n")).digest("hex")}`;

test("AC-7 receipt is complete and sealed to its implementation", () => {
  assert.equal(result.schema, "tabiya.learner-rating.ac7.v1");
  assert.equal(result.sourceDigest, digest);
  assert.equal(result.parameters.trialsPerCell, 2_000);
  assert.equal(result.cells.length, 13 * 3 * 2);
  assert.deepEqual([...new Set(result.cells.map((cell) => cell.trueRating))], result.parameters.trueRatings);
  assert.ok(result.cells.every((cell) => cell.trials === 2_000 && cell.ready + cell.neverReady === 2_000));
  assert.ok(result.cells.every((cell) => cell.covered <= cell.ready && cell.coverage >= 0 && cell.coverage <= 1));
  assert.ok(result.decision.supportedRoundedBracket !== null, "AC-7 produced no supported bracket");
  assert.equal(result.decision.agreesWithShippedRoundedBracket, true, "AC-7 disagrees with shipped bracket; move constants and copy before landing");
});
