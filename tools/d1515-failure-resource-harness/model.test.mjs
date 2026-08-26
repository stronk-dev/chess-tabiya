import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evaluatePolicies, POLICIES } from "./model.mjs";

test("enumerates the complete nine-node achieved/failed state space", () => {
  const results = evaluatePolicies();
  for (const result of Object.values(results)) assert.equal(result.sequences, 512);
});

test("direct global HP prices an early failure into Act III and terminates most sequences", () => {
  const result = evaluatePolicies().direct_global_hp;
  assert.equal(result.act1FailureChangesAct3Capacity, true);
  assert.ok(result.terminated > result.completed);
  assert.equal(result.failureDebitAuthority, "failed_verdict");
});

test("act reset removes cross-act carry but not automatic failure attribution", () => {
  const result = evaluatePolicies().direct_act_hp;
  assert.equal(result.act1FailureChangesAct3Capacity, false);
  assert.equal(result.failureDebitAuthority, "failed_verdict");
  assert.equal(result.newNumericCurrency, true);
});

test("choice-spent candidates keep the educational path open and never leave a failure silent", () => {
  const results = evaluatePolicies();
  for (const id of ["shared_charge_resistance", "inventory_exhaustion"]) {
    assert.equal(results[id].completed, 512);
    assert.equal(results[id].singleFailureTerminations, 0);
    assert.equal(results[id].unconsequencedFailures, 0);
    assert.match(results[id].failureDebitAuthority, /^learner_/);
  }
});

test("inventory exhaustion uses acquired capability state rather than a second numeric currency", () => {
  const result = evaluatePolicies().inventory_exhaustion;
  assert.equal(result.newNumericCurrency, false);
  assert.equal(result.recoveryDependsOnWinning, false);
});

test("a failed seal does not itself spend shared charges", () => {
  const failed = Array.from({ length: 9 }, () => "failed");
  const result = POLICIES.shared_charge_resistance(failed);
  assert.equal(result.failureDebitAuthority, "learner_resistance_choice");
  assert.ok(result.carriedConstraints > 0);
});

test("the committed receipt equals the executable projection", async () => {
  const receipt = JSON.parse(await readFile(new URL("./results.json", import.meta.url), "utf8"));
  assert.deepEqual(receipt, evaluatePolicies());
});
