// Stable Node-24 form of the disposable D1916 author contract.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const rfc = readFileSync("rfc/assistance-config-register.md", "utf8");
const preference = readFileSync("apps/web/src/lib/assistance-preference.ts", "utf8");

function originalAllows(head: number, tree: number, digest: boolean, claims: readonly number[]): boolean {
  if (head !== tree) return false;
  if (!digest && claims.length === 0) return false;
  if (!digest && claims.length !== 1) return false;
  return claims.every((claim) => claim === head + 1);
}

function amendedAllows(input: {
  readonly head: number;
  readonly tree: number;
  readonly digest: boolean;
  readonly claims: readonly number[];
  readonly landed: readonly number[];
}): boolean {
  if (input.head !== input.tree || !input.digest || !input.landed.includes(input.head)) return false;
  if (input.claims.length > 1) return false;
  return input.claims.length === 0 || input.claims[0] === input.head + 1;
}

test("the returned C9 allowed a future claim to mask current-head drift", () => {
  assert.equal(originalAllows(4, 4, false, [5]), true);
});

test("the live v4 parser still spreads unknown persisted fields", () => {
  assert.match(preference, /if \(validV4\(value\)\) return Object\.freeze\(\{ \.\.\.value \}\)/);
});

test("the process register deliberately leaves codec migration to D1629", () => {
  assert.match(rfc, /does \*\*not\*\* edit `packages\/runtime\/src\/assistance\.ts`, browser storage/);
  const tree = rfc.match(/interface AssistanceConfigTree \{[\s\S]*?\n\}/u)?.[0] ?? "";
  assert.doesNotMatch(tree, /migration|parser|storage/);
});

test("D1916 rejects same-head drift with the exact next reservation", () => {
  assert.equal(amendedAllows({ head: 4, tree: 4, digest: false, claims: [5], landed: [1, 2, 3, 4] }), false);
});

test("D1916 rejects head-only drift with the exact next reservation", () => {
  assert.equal(amendedAllows({ head: 4, tree: 5, digest: true, claims: [5], landed: [1, 2, 3, 4] }), false);
});

test("D1916 admits the complete next-head snapshot only after claim removal", () => {
  assert.equal(amendedAllows({ head: 5, tree: 5, digest: true, claims: [], landed: [1, 2, 3, 4, 5] }), true);
  assert.equal(amendedAllows({ head: 5, tree: 5, digest: true, claims: [5], landed: [1, 2, 3, 4, 5] }), false);
});

test("D1916 admits an unchanged snapshot with one next-head reservation", () => {
  assert.equal(amendedAllows({ head: 4, tree: 4, digest: true, claims: [5], landed: [1, 2, 3, 4] }), true);
});
