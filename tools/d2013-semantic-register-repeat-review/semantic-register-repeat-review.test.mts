// DISPOSABLE author-repair contract — D2013–D2019. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const registerRfc = readFileSync("rfc/semantic-convention-register.md", "utf8");
const productRfc = readFileSync("rfc/semantic-convention-provenance.md", "utf8");
const registerChecker = readFileSync("tools/register-check.mjs", "utf8");
const seed = JSON.parse(readFileSync("planning/semantic-convention-register/initial-members.json", "utf8")) as {
  readonly members: readonly { readonly ref: string }[];
};
const seedRefs = Object.freeze(seed.members.map((row) => row.ref));
const authorityTokens = Object.freeze([
  "packages/runtime/src/evidence-convention-history.jsonl#semantic-conventions",
  "packages/runtime/src/evidence-conventions.ts#CONVENTION_DECLARATIONS",
]);

function currentResourceCount(): number {
  const body = registerChecker.match(/RESOURCE_NAMES\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/u)?.[1];
  assert.ok(body);
  return [...body.matchAll(/"[a-z-]+"/gu)].length;
}

function parseSafeRef(value: string): Readonly<{ id: string; version: number }> {
  const match = /^([a-z][a-z0-9_-]*)@([1-9][0-9]*)$/u.exec(value);
  if (match === null) throw new TypeError("invalid ref");
  const version = Number(match[2]);
  if (!Number.isSafeInteger(version) || String(version) !== match[2]) throw new TypeError("unsafe version");
  return { id: match[1]!, version };
}

interface Claim { readonly rfc: string; readonly members: readonly string[]; readonly authorities: readonly string[]; }
interface State {
  readonly tree: readonly string[];
  readonly landed: readonly string[];
  readonly owners: Readonly<Record<string, string>>;
  readonly claims: readonly Claim[];
}

const sameSet = (left: readonly string[], right: readonly string[]) =>
  JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());

function validPhase(state: State): boolean {
  if (!sameSet(state.tree, state.landed)) return false;
  if (state.landed.length === 0) {
    return state.claims.length === 1 && sameSet(state.claims[0]!.members, seedRefs);
  }
  return seedRefs.every((ref) => state.tree.includes(ref));
}

function validLanding(previous: State | undefined, current: State): boolean {
  if (previous === undefined || !validPhase(previous) || !validPhase(current)) return false;
  if (previous.claims.length !== 1 || current.claims.length !== 0) return false;
  const claim = previous.claims[0]!;
  const added = current.landed.filter((ref) => !previous.landed.includes(ref));
  return sameSet(added, claim.members)
    && sameSet(claim.authorities, authorityTokens)
    && added.every((ref) => current.owners[ref] === claim.rfc);
}

function validHistoryRow(row: Record<string, unknown>): boolean {
  const keys = Object.keys(row);
  return JSON.stringify(keys) === JSON.stringify(["ref", "semanticDigest", "registryDigest", "ownerRfc"])
    && typeof row.ref === "string"
    && typeof row.semanticDigest === "string" && /^sha256:[0-9a-f]{64}$/u.test(row.semanticDigest)
    && typeof row.registryDigest === "string" && /^sha256:[0-9a-f]{64}$/u.test(row.registryDigest)
    && typeof row.ownerRfc === "string";
}

test("D2013: dependency order makes semantic-conventions the ninth resource", () => {
  assert.equal(currentResourceCount(), 7);
  assert.match(registerRfc, /assistance-config-register\.md` lands first and owns C9/u);
  assert.match(registerRfc, /ninth shared resource/u);
  assert.equal(currentResourceCount() + 2, 9);
});

test("D2014: the exact prior claimant owns every newly landed member", () => {
  const previous: State = {
    tree: [], landed: [], owners: {},
    claims: [{ rfc: "semantic-convention-provenance.md", members: seedRefs, authorities: authorityTokens }],
  };
  const owners = Object.fromEntries(seedRefs.map((ref) => [ref, "semantic-convention-provenance.md"]));
  const current: State = { tree: seedRefs, landed: seedRefs, owners, claims: [] };
  assert.equal(validLanding(previous, current), true);
  assert.equal(validLanding(undefined, current), false);
  assert.equal(validLanding({ ...previous, claims: [] }, current), false);
  assert.equal(validLanding(previous, { ...current, owners: { ...owners, [seedRefs[0]!]: "other.md" } }), false);
});

test("D2015: one checked generator binds reviewed JSON to the literal runtime array", () => {
  assert.match(registerRfc, /tools\/generate-initial-convention-declarations\.mjs/u);
  assert.match(registerRfc, /make semantic-convention-source-check/u);
  assert.match(productRfc, /one literal exported `CONVENTION_DECLARATIONS` array/u);
  assert.match(productRfc, /all 39 semantic fields/u);
  assert.match(registerRfc, /runtime `\.map\(\.\.\.\)`, broad cast/u);
});

test("D2016: semantic history has one exact artifact, row image and stable check", () => {
  assert.match(registerRfc, /packages\/runtime\/src\/evidence-convention-history\.jsonl/u);
  assert.match(productRfc, /tools\/semantic-convention-history-check\.mjs/u);
  assert.match(productRfc, /make semantic-convention-history-check/u);
  assert.match(productRfc, /`ref`, `semanticDigest`, `registryDigest` and\s+`ownerRfc`, in that order/u);
});

test("D2017: canonical safe-integer parsing distinguishes every accepted version", () => {
  assert.equal(parseSafeRef("space@9007199254740991").version, Number.MAX_SAFE_INTEGER);
  assert.throws(() => parseSafeRef("space@9007199254740992"), /unsafe version/u);
  assert.throws(() => parseSafeRef("space@9007199254740993"), /unsafe version/u);
  assert.throws(() => parseSafeRef("space@01"), /invalid ref/u);
});

test("D2018: seed equality is phase-scoped before and after the 39-member landing", () => {
  const claim: Claim = { rfc: "semantic-convention-provenance.md", members: seedRefs, authorities: authorityTokens };
  assert.equal(validPhase({ tree: [], landed: [], owners: {}, claims: [claim] }), true);
  const owners = Object.fromEntries(seedRefs.map((ref) => [ref, claim.rfc]));
  assert.equal(validPhase({ tree: seedRefs, landed: seedRefs, owners, claims: [] }), true);
  assert.equal(validPhase({ tree: seedRefs.slice(1), landed: seedRefs.slice(1), owners, claims: [] }), false);
});

test("D2019: canonical history rows exclude the impossible self landing hash", () => {
  const digest = `sha256:${"a".repeat(64)}`;
  const row = { ref: "space@1", semanticDigest: digest, registryDigest: digest, ownerRfc: "semantic-convention-provenance.md" };
  assert.equal(validHistoryRow(row), true);
  assert.equal(validHistoryRow({ ...row, landingCommit: "deadbeef" }), false);
  assert.match(productRfc, /does not\s+contain its own landing commit/u);
});
