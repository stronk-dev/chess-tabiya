import assert from "node:assert/strict";
import { test } from "vitest";
import { loadWorkflowPreset } from "../../apps/web/src/lib/assistance-preference.js";
import {
  EXCHANGE_ROOT, EXCHANGE_V1_TRANSITION, PERMISSION_LEGAL_TRANSITION,
  WORKFLOW_V1_AUTHORITY, WORKFLOW_V1_GRAMMAR, WORKFLOW_V1_ROOT, WORKFLOW_V2_TRANSITION,
  assertSequentialSnapshot, assertSequentialTransition,
} from "./model.js";

const first = { kind: "first", lane: 1, owner: "intent-presets.md", changes: EXCHANGE_V1_TRANSITION } as const;

test("D2355 models the real open and context-dependent workflow-v1 grammar", () => {
  assert.equal(WORKFLOW_V1_GRAMMAR.unknownKeys, "ignored");
  assert.equal(WORKFLOW_V1_GRAMMAR.contextAdmission, "WORKFLOW_CONTEXT_POLICIES[context].allowedPresets");
  const extraKeyStorage = { getItem: () => JSON.stringify({ version: 1, preset: "support", ignored: "historical" }), setItem: () => undefined };
  assert.equal(loadWorkflowPreset("position", extraKeyStorage), "support");
  assert.equal(loadWorkflowPreset("match", extraKeyStorage), "quiet");
});
test("D2356 closes workflow roots and both transition populations", () => {
  assert.equal(WORKFLOW_V1_ROOT, WORKFLOW_V1_AUTHORITY[0]);
  assert.equal(WORKFLOW_V1_AUTHORITY.length, 6);
  assert.equal(WORKFLOW_V2_TRANSITION.length, 8);
});
test("D2357 gives the absent exchange one stable future root and exact first delta", () => {
  assert.equal(EXCHANGE_ROOT, EXCHANGE_V1_TRANSITION[0]);
  assert.equal(EXCHANGE_V1_TRANSITION.length, 10);
});
test("D2358 makes absent one-way after first landing", () => {
  const absent = { kind: "absent", history: [] } as const;
  const landed = { kind: "landed", head: 1, history: [1] } as const;
  assertSequentialSnapshot(absent, [first]);
  assertSequentialTransition(absent, [first], landed, [], "intent-presets.md");
  assert.throws(() => assertSequentialTransition(landed, [], absent, [first], "intent-presets.md"), /CANNOT_BECOME_ABSENT/u);
});
test("D2359 binds legal to every semantic permission operation", () => {
  assert.deepEqual(PERMISSION_LEGAL_TRANSITION, [...PERMISSION_LEGAL_TRANSITION].sort());
  for (const symbol of ["AssistancePermission", "accessPermission", "permittedAssistance", "compileAuthoritativeAssistance", "contextClamp"]) {
    assert.ok(PERMISSION_LEGAL_TRANSITION.some((value) => value.endsWith(`#${symbol}`)), symbol);
  }
});
test("D2360 crosses invalid claim and lifecycle states in executable code", () => {
  assert.throws(() => assertSequentialSnapshot({ kind: "absent", history: [] }, []), /ONE_FIRST/u);
  assert.throws(() => assertSequentialSnapshot({ kind: "absent", history: [] }, [first, first]), /ONE_FIRST/u);
  assert.throws(() => assertSequentialSnapshot({ kind: "landed", head: 1, history: [1] }, [{ ...first, kind: "next", lane: 3 }]), /LANDED_CLAIM/u);
  assert.throws(() => assertSequentialTransition(
    { kind: "landed", head: 1, history: [1] },
    [{ ...first, kind: "next", lane: 2 }],
    { kind: "landed", head: 3, history: [1, 2, 3] },
    [],
    "intent-presets.md",
  ), /HEAD_TRANSITION/u);
});
