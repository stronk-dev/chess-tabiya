import assert from "node:assert/strict";
import { test } from "vitest";
import { assertBaseVersionedRef, assertPresentRef, executeOracle, type OracleWitness } from "./model.js";

const event = { id: "rules.castled", version: 1 } as const;
test("D2331 uses one base-id plus numeric-version grammar", () => {
  assert.doesNotThrow(() => assertBaseVersionedRef({ id: "runtime.semantic.local_edge", version: 1 }));
  assert.throws(() => assertBaseVersionedRef({ id: "runtime.semantic.local_edge@1", version: 1 }), /SUFFIX_FORBIDDEN/u);
  assert.throws(() => assertBaseVersionedRef({ id: "runtime.semantic.local_edge", version: 2 as 1 }), /REF_STALE/u);
});
test("D2332 makes present cells distributive by profile arm", () => {
  const population = { kind: "population_receipt", id: "population.castled", version: 1, event, inputVersion: 1, resultVersion: 1 } as const;
  assert.doesNotThrow(() => assertPresentRef("imported_population", event, population));
  assert.throws(() => assertPresentRef("external_label", event, population), /CELL_REF_KIND/u);
  assert.throws(() => assertPresentRef("positive", event, population), /CELL_REF_KIND/u);
  assert.throws(() => assertPresentRef("imported_population", { id: "rules.other", version: 1 }, population), /EVENT_MISMATCH/u);
});
test("D2333 binds a sealed witness, isolated oracle result and exact case expectation", () => {
  const witness: OracleWitness<"rules.legal_successor"> = { id: "witness.castled", version: 1, oracle: { id: "rules.legal_successor", version: 1 }, case: { id: "castled.standard-white.positive", version: 1 }, event, request: { kind: "legal_successor", beforeFen: "before", moveUci: "e1g1", afterFen: "after" } };
  const base = { oracle: witness.oracle, witness, caseRef: { ...witness.case, event }, expectation: { kind: "emits" } as const, imports: ["chess.js"], run: () => ({ kind: "legal_successor", legal: true, canonicalAfterFen: "after", expectation: { kind: "emits" } as const }) };
  assert.equal(executeOracle(base).expectation.kind, "emits");
  assert.throws(() => executeOracle({ ...base, caseRef: { id: "another", version: 1, event } }), /WITNESS_MISMATCH/u);
  assert.throws(() => executeOracle({ ...base, expectation: { kind: "omits" } }), /EXPECTATION_MISMATCH/u);
  assert.throws(() => executeOracle({ ...base, imports: ["runtime/semantic-event-collector.ts"] }), /IMPORT_FORBIDDEN/u);
});
