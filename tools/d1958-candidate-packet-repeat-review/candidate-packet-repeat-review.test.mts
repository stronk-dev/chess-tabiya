// DISPOSABLE RFC review harness — D1958-D1961. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync(new URL("../../rfc/shared-candidate-evidence-packet.md", import.meta.url), "utf8");
const makefile = readFileSync(new URL("../../Makefile", import.meta.url), "utf8");
const semanticCheck = readFileSync(new URL("../../apps/server/src/semantic-evidence-check.ts", import.meta.url), "utf8");
const application = readFileSync(new URL("../../apps/server/src/application.ts", import.meta.url), "utf8");

test("D1958 the claimed first consumer is a fixed verification command, not a product operation", () => {
  assert.match(makefile, /verify-software:[^\n]*semantic-evidence-check/u);
  assert.match(semanticCheck, /INITIAL_FEN/u);
  assert.match(semanticCheck, /parseUci\("e2e4"\)/u);
  assert.match(semanticCheck, /console\.log/u);
  assert.doesNotMatch(application, /SemanticSelectionOperation|CandidatePopulationService/u);
  assert.match(rfc, /governance tool is not counted as production/u);
  assert.match(rfc, /real semantic executable consumes it/u);
});

test("D1959 the receipt promises a runtime seal but specifies only an erased type brand", () => {
  assert.match(rfc, /declare const CANDIDATE_POPULATION_RECEIPT: unique symbol/u);
  assert.match(rfc, /process-seals `CandidatePopulationReceipt`/u);
  assert.doesNotMatch(rfc, /CANDIDATE_POPULATION_RECEIPTS\s*=\s*new WeakSet/u);
  assert.doesNotMatch(rfc, /function assertCandidatePopulationReceipt/u);
  assert.doesNotMatch(rfc, /function compileCandidatePopulationReceipt/u);
});

test("D1960 an AbortSignal cannot interrupt one synchronous event-loop turn", async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 0);
  let work = 0;
  for (let index = 0; index < 100_000; index += 1) work += index;
  assert.equal(controller.signal.aborted, false);
  assert.ok(work > 0);
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  clearTimeout(timer);
  assert.equal(controller.signal.aborted, true);
  assert.match(rfc, /shared packet compilation continues for remaining waiters and aborts when none remain/u);
  assert.doesNotMatch(rfc, /setImmediate|scheduler yield|worker thread|cooperative yield/u);
});

test("D1961 the supposedly closed receipt widens exact identities and abstentions to scalars", () => {
  assert.match(rfc, /moveIdentityConvention: string/u);
  assert.match(rfc, /compilerVersion: number/u);
  assert.match(rfc, /readonly reason: string/u);
  assert.match(rfc, /typed collector abstentions only/u);
});
