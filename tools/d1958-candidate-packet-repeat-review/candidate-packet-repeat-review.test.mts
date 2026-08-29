// DISPOSABLE RFC review harness — D1958-D1961. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync(new URL("../../rfc/shared-candidate-evidence-packet.md", import.meta.url), "utf8");
const makefile = readFileSync(new URL("../../Makefile", import.meta.url), "utf8");
const semanticCheck = readFileSync(new URL("../../apps/server/src/semantic-evidence-check.ts", import.meta.url), "utf8");
const application = readFileSync(new URL("../../apps/server/src/application.ts", import.meta.url), "utf8");

test("D1958 the verification command remains outside product consumption", () => {
  assert.match(makefile, /verify-software:[^\n]*semantic-evidence-check/u);
  assert.match(semanticCheck, /INITIAL_FEN/u);
  assert.match(semanticCheck, /parseUci\("e2e4"\)/u);
  assert.match(semanticCheck, /console\.log/u);
  assert.doesNotMatch(application, /SemanticSelectionOperation|CandidatePopulationService/u);
  assert.match(rfc, /zero product consumers/u);
  assert.match(rfc, /verification command[\s\S]{0,180}not counted as product reach/u);
});

test("D1959 the receipt has a private runtime authority", () => {
  assert.match(rfc, /CANDIDATE_POPULATION_RECEIPTS = new WeakMap/u);
  assert.match(rfc, /function assertCandidatePopulationReceipt/u);
  assert.match(rfc, /function compileCandidatePopulationReceipt/u);
  assert.match(rfc, /forged object, equal rebuild, copy-spread/u);
});

test("D1960 cooperative compilation names the macrotask that admits timer aborts", async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 0);
  let work = 0;
  for (let index = 0; index < 100_000; index += 1) work += index;
  assert.equal(controller.signal.aborted, false);
  assert.ok(work > 0);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  clearTimeout(timer);
  assert.equal(controller.signal.aborted, true);
  assert.match(rfc, /messageChannelMacrotaskYield/u);
  assert.match(rfc, /real\s+zero-delay timer that aborts an `AbortController` independently/u);
  assert.match(rfc, /algorithmic cancellation bound is \*\*one collector group\*\*/u);
});

test("D1961 exact identities and abstentions remain literal", () => {
  assert.match(rfc, /moveIdentityConvention: typeof MOVE_IDENTITY_CONVENTION/u);
  assert.match(rfc, /compilerVersion: typeof CANDIDATE_PACKET_COMPILER_VERSION/u);
  assert.match(rfc, /CANDIDATE_PACKET_ABSTENTION_REASONS/u);
  assert.match(rfc, /projection: P[\s\S]{0,120}reason: \(typeof CANDIDATE_PACKET_ABSTENTION_REASONS\)/u);
});
