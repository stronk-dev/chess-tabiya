// DISPOSABLE repeat-review harness — D2009-D2012. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/assistance-config-register.md");
const hint = read("rfc/hint-distance.md");
const presets = read("rfc/intent-presets.md");

function currentC9Allows(input: {
  readonly registeredHead: number;
  readonly treeHead: number;
  readonly digestMatches: boolean;
  readonly claims: readonly number[];
  readonly landedHeads: readonly number[];
}): boolean {
  if (input.registeredHead !== input.treeHead || !input.digestMatches) return false;
  if (!input.landedHeads.includes(input.registeredHead)) return false;
  if (input.claims.length > 1) return false;
  return input.claims.length === 0 || input.claims[0] === input.registeredHead + 1;
}

test("D2009: the stated C9 accepts erased and gapped landed history", () => {
  assert.match(rfc, /C9\.5 \| the landed table lacks the current head/);
  assert.equal(currentC9Allows({
    registeredHead: 4, treeHead: 4, digestMatches: true, claims: [5], landedHeads: [4],
  }), true);
  assert.equal(currentC9Allows({
    registeredHead: 4, treeHead: 4, digestMatches: true, claims: [5], landedHeads: [1, 3, 4],
  }), true);
  assert.doesNotMatch(rfc, /landed heads (?:are|must be) (?:unique and )?contiguous|exactly 1\.\.head|append-only landed/i);
});

test("D2010: the proposed claim names the validator Hint v5 refuses", () => {
  assert.match(rfc, /validV5\/migrate v1-v4 to v5/);
  assert.match(hint, /parseAssistanceConfig/);
  assert.match(hint, /contains no parallel `validV5`\/migration switch/);
});

test("D2011: the mandated preset status rewrite would still be false", () => {
  assert.match(rfc, /awaiting independent review/);
  assert.match(presets, /returned to research/);
  assert.match(hint, /D1639 owner table — proposed, not ruled/);
  assert.match(hint, /criterion is RED while\s+§5 remains labelled proposed/);
});

test("D2012: a snapshot-only atomic landing cannot prove a prior claimant", () => {
  const unclaimedLanding = {
    registeredHead: 5, treeHead: 5, digestMatches: true, claims: [], landedHeads: [1, 2, 3, 4, 5],
  } as const;
  assert.equal(currentC9Allows(unclaimedLanding), true);
  assert.match(rfc, /atomic head-5 tree\/register\/landed update with claim removed \| pass/);
  assert.doesNotMatch(rfc, /first-parent|previous committed|prior claim|staged transition|claimant.*landed row/i);
});
