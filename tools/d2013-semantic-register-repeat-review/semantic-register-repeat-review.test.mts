// DISPOSABLE repeat process/buildability review — D2013–D2018. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const registerRfc = readFileSync("rfc/semantic-convention-register.md", "utf8");
const productRfc = readFileSync("rfc/semantic-convention-provenance.md", "utf8");
const registerChecker = readFileSync("tools/register-check.mjs", "utf8");
const makefile = readFileSync("Makefile", "utf8");

function currentResourceCount(): number {
  const body = registerChecker.match(/RESOURCE_NAMES\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/u)?.[1];
  assert.ok(body, "RESOURCE_NAMES must remain derivable");
  return [...body.matchAll(/"[a-z-]+"/gu)].length;
}

function snapshotC10Accepts(state: {
  readonly tree: readonly string[];
  readonly landed: readonly string[];
  readonly claims: readonly string[];
}): boolean {
  return state.claims.length === 0
    && JSON.stringify([...state.tree].sort()) === JSON.stringify([...state.landed].sort());
}

test("D2013: dependency order makes semantic-conventions the ninth resource", () => {
  assert.equal(currentResourceCount(), 7);
  assert.match(registerRfc, /assistance-config-register\.md` lands first and owns C9/u);
  assert.match(registerRfc, /Register `semantic-conventions` as the eighth shared resource/u);
  assert.equal(currentResourceCount() + 2, 9);
});

test("D2014: a final snapshot cannot prove the prior 39-member claimant", () => {
  const landed = ["space@1", "threat@1"];
  const finalState = { tree: landed, landed, claims: [] };
  assert.equal(snapshotC10Accepts(finalState), true);
  const validPrior = { tree: [], landed: [], claims: landed };
  const unclaimedPrior = { tree: [], landed: [], claims: [] };
  assert.notDeepEqual(validPrior, unclaimedPrior);
  assert.equal(snapshotC10Accepts(finalState), true);
  assert.match(registerRfc, /live claim disappears atomically/u);
  assert.doesNotMatch(registerRfc, /first-parent transition[^\n]*claimant|previous committed state[^\n]*claimant/iu);
});

test("D2015: the process tree reader and product declaration source name incompatible construction shapes", () => {
  assert.match(registerRfc, /exported literal `CONVENTION_DECLARATIONS`/u);
  assert.match(registerRfc, /computed, broad, duplicate or unparsable ref fails/u);
  assert.match(productRfc, /initial-declarations\.json/u);
  assert.match(productRfc, /The compiler expands each row/u);
  assert.doesNotMatch(productRfc, /export const CONVENTION_DECLARATIONS\s*=/u);
});

test("D2016: semantic history has no named repository artifact or executable governance target", () => {
  const historySection = productRfc.slice(
    productRfc.indexOf("The compiler also compares the current registry"),
    productRfc.indexOf("### 1.1 Shared-resource registration"),
  );
  assert.match(historySection, /append-only semantic-history artifact/u);
  const codeSpans = [...historySection.matchAll(/`([^`]+)`/gu)].map((match) => match[1]);
  assert.equal(codeSpans.some((value) => value?.includes("/")), false);
  assert.doesNotMatch(makefile, /^[^\n:]*semantic[^\n:]*history[^\n]*:/gimu);
});

test("D2017: the ref grammar aliases distinct versions through unsafe Number arithmetic", () => {
  const lower = "9007199254740992";
  const higher = "9007199254740993";
  assert.match(`space@${lower}`, /^[a-z][a-z0-9_-]*@[1-9][0-9]*$/u);
  assert.match(`space@${higher}`, /^[a-z][a-z0-9_-]*@[1-9][0-9]*$/u);
  assert.equal(Number(lower), Number(higher));
});

test("D2018: the seed-to-live-claim invariant is not scoped away after the legal 39-to-zero landing", () => {
  assert.match(registerRfc, /set-equal to both the D1722\s+\n?\s*census and the sole initial live claim/u);
  assert.match(registerRfc, /After product landing it prints `39 landed members; claimed 0`/u);
  assert.doesNotMatch(registerRfc, /landed(?: member count)? (?:is|=) zero[^\n]*sole initial live claim/iu);
});
