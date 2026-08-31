// DISPOSABLE fresh independent review of the fourth author repair — D2445-D2449.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  assertOwnerAuthorityTransition,
  assertValidationPopulation,
  bindNeutralOracle,
} from "../d2385-semantic-validation-fourth-author-repair/model.mjs";

const rfc = readFileSync("rfc/semantic-validation-authority.md", "utf8");
const model = readFileSync("tools/d2385-semantic-validation-fourth-author-repair/model.mjs", "utf8");
const event = { kind: "event", projection: { id: "rules.castled", version: 1 } };
const reading = { kind: "reading", projection: { id: "derived.bounded_target.named_material_target", version: 1 } };

test("D2445 the normative proposition union references three undeclared types", () => {
  for (const name of [
    "SemanticValidationExistingAssertionAuthority",
    "SemanticValidationCitedPropositionAuthority",
    "SemanticValidationOwnerAuthorityRef",
  ]) {
    assert.match(rfc, new RegExp(`\\b${name}\\b`, "u"));
    assert.doesNotMatch(rfc, new RegExp(`(?:interface|type)\\s+${name}\\b`, "u"));
  }
});

test("D2446 wildcard fact constraints are declared but rejected by the executable model", () => {
  assert.match(rfc, /readonly path: readonly \(string \| "\*"\)\[\]/u);
  const caseRow = { id: "attack-positive", version: 1, subject: event, expectation: { kind: "emits" } };
  const proposition = {
    case: { id: caseRow.id, version: 1 }, subject: event, expectation: caseRow.expectation,
    factConstraint: [{ path: ["attackers", "*"], equals: "f7" }],
  };
  assert.throws(() => bindNeutralOracle({
    request: {}, run: () => ({ attackers: ["f7"] }), proposition, case: caseRow,
  }), /FACT_CONSTRAINT_INVALID/u);
});

test("D2447 same-commit owner admission can be hidden by an empty caller list", () => {
  const row = {
    id: "owner.castling", version: 1, subject: event,
    case: { id: "castled-positive", version: 1 }, expectation: { kind: "emits" },
    factConstraint: [], ruling: "ledger:D9000", authoredBy: "OWNER", authoredAt: "2026-08-31",
  };
  assert.match(model, /assertOwnerAuthorityTransition\(before, after, admittedRefs, ownerRulings\)/u);
  assert.doesNotThrow(() => assertOwnerAuthorityTransition(
    { schemaVersion: 1, authorities: [] },
    { schemaVersion: 1, authorities: [row] },
    [],
    new Set(["ledger:D9000"]),
  ));
});

test("D2448 duplicate declarations disappear inside set equality", () => {
  assert.doesNotThrow(() => assertValidationPopulation({
    roots: [event, reading],
    declarations: [event, event, reading],
    profiles: [event, reading],
    verdicts: [event, reading],
    cases: [],
    presentCaseRefs: [],
  }));
});

test("D2449 the protected owner store is required, absent and not implementation-writable", () => {
  assert.equal(existsSync("design/research/semantic-validation-owner-authorities.json"), false);
  assert.match(rfc, /Owner-authored propositions live only at\s+`design\/research\/semantic-validation-owner-authorities\.json`/u);
  assert.match(rfc, /Codex and implementation agents[\s\S]*?may not add, edit or synthesize authority/u);
  assert.match(
    rfc,
    /## Open questions\s+None require an owner ruling before independent review\./u,
  );
});
