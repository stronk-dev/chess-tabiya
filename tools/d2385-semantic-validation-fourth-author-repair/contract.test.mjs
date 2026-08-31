import assert from "node:assert/strict";
import test from "node:test";
import { assertOwnerAuthorityStore, assertOwnerAuthorityTransition, assertValidationPopulation, bindNeutralOracle, selectTargetObservations } from "./model.mjs";

const event = { kind: "event", projection: { id: "rules.castled", version: 1 } };
const reading = { kind: "reading", projection: { id: "derived.bounded_target.named_material_target", version: 1 } };
const debtInput = { roots: [event, reading], declarations: [event, reading], profiles: [event, reading], verdicts: [event, reading], cases: [], presentCaseRefs: [] };

test("D2385 carries event and reading observations without cross-kind coercion", () => {
  const observations = [
    { kind: "event", item: { evidence: { projection: event.projection } } },
    { kind: "reading", item: { projection: reading.projection } },
  ];
  assert.equal(selectTargetObservations(event, observations).length, 1);
  assert.equal(selectTargetObservations(reading, observations).length, 1);
  assert.equal(selectTargetObservations({ ...reading, projection: event.projection }, observations).length, 0);
});

test("D2386 separates four-way equality from exact case subsets and admits honest debt", () => {
  assert.doesNotThrow(() => assertValidationPopulation(debtInput));
  const oneCase = { id: "castled-positive", subject: event, arm: "positive" };
  assert.doesNotThrow(() => assertValidationPopulation({ ...debtInput, cases: [oneCase], presentCaseRefs: [{ ...oneCase }] }));
  assert.throws(() => assertValidationPopulation({ ...debtInput, declarations: [event] }), /ROOT_MISMATCH/u);
  assert.throws(() => assertValidationPopulation({ ...debtInput, cases: [oneCase] }), /CASE_UNREFERENCED/u);
  assert.throws(() => assertValidationPopulation({ ...debtInput, presentCaseRefs: [{ ...oneCase }] }), /CASE_MISSING/u);
});

test("D2387 keeps oracle facts neutral and requires a grounded constrained proposition", () => {
  const caseRow = { id: "castled-positive", version: 1, subject: event, expectation: { kind: "emits" } };
  const proposition = { case: { id: caseRow.id, version: 1 }, subject: event, expectation: caseRow.expectation, factConstraint: [{ path: ["legal"], equals: true }] };
  assert.deepEqual(bindNeutralOracle({ request: {}, run: () => ({ legal: true }), proposition, case: caseRow }), { kind: "emits" });
  assert.throws(() => bindNeutralOracle({ request: {}, run: () => ({ legal: true, expectation: { kind: "emits" } }), proposition, case: caseRow }), /EXPECTATION_FORBIDDEN/u);
  assert.throws(() => bindNeutralOracle({ request: {}, run: () => ({ legal: false }), proposition, case: caseRow }), /CONSTRAINT_UNSATISFIED/u);
});

test("D2388 makes owner authority protected, append-only and prior to admission", () => {
  const row = { id: "owner.castling", version: 1, subject: event, case: { id: "castled-positive", version: 1 }, expectation: { kind: "emits" }, factConstraint: [], ruling: "ledger:D9000", authoredBy: "OWNER", authoredAt: "2026-08-31" };
  const empty = { schemaVersion: 1, authorities: [] };
  const filled = { schemaVersion: 1, authorities: [row] };
  const rulings = new Set(["ledger:D9000"]);
  assert.doesNotThrow(() => assertOwnerAuthorityTransition(empty, filled, [], rulings));
  assert.throws(() => assertOwnerAuthorityTransition(empty, filled, [{ id: row.id, version: 1 }], rulings), /SAME_COMMIT/u);
  assert.throws(() => assertOwnerAuthorityStore({ ...filled, authorities: [{ ...row, authoredBy: "Codex" }] }, rulings), /AUTHORITY_INVALID/u);
  assert.throws(() => assertOwnerAuthorityTransition(filled, { ...filled, authorities: [{ ...row, expectation: { kind: "omits" } }] }, [], rulings), /MUTATED/u);
});
