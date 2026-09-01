import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  assertFactConstraint,
  assertOwnerAuthorityRepositoryTransition,
  assertValidationPopulation,
  resolveProposition,
} from "./model.mjs";

const rfc = readFileSync("rfc/semantic-validation-authority.md", "utf8");
const event = { kind: "event", projection: { id: "rules.castled", version: 1 } };
const reading = { kind: "reading", projection: { id: "derived.target", version: 1 } };
const proposition = {
  subject: event,
  case: { id: "castled-positive", version: 1 },
  factConstraint: [{ path: ["attackers"], comparison: "canonical_multiset", equals: ["c3", "f7"] }],
  factConstraintSha256: "sha256:constraints",
  expectation: { kind: "emits", minimum: 1 },
};

test("D2445 all three refs resolve to one complete proposition record", () => {
  for (const name of [
    "SemanticValidationExistingAssertionAuthority",
    "SemanticValidationCitedPropositionAuthority",
    "SemanticValidationOwnerAuthorityRef",
    "SemanticValidationResolvedExistingAssertionAuthority",
    "SemanticValidationResolvedCitedPropositionAuthority",
    "SemanticValidationResolvedOwnerAuthority",
  ]) assert.match(rfc, new RegExp(`(?:interface|type)\\s+${name}\\b`, "u"));
  const stores = {
    existing: new Map([["matrix:1", proposition]]),
    cited: new Map([["sha256:citation", proposition]]),
    owner: new Map([["owner.castling@1", proposition]]),
  };
  for (const ref of [
    { kind: "existing_assertion", matrixRow: "matrix:1" },
    { kind: "cited_proposition", propositionSha256: "sha256:citation" },
    { kind: "owner_authored", id: "owner.castling", version: 1 },
  ]) assert.deepEqual(resolveProposition(ref, stores).proposition, proposition);
  assert.throws(() => resolveProposition({ kind: "owner_authored", id: "missing", version: 1 }, stores), /UNRESOLVED/u);
});

test("D2446 collection constraints compare whole values without wildcards", () => {
  assert.doesNotThrow(() => assertFactConstraint(
    { attackers: ["f7", "c3"] },
    { path: ["attackers"], comparison: "canonical_multiset", equals: ["c3", "f7"] },
  ));
  assert.throws(() => assertFactConstraint(
    { attackers: ["f7", "c3"] },
    { path: ["attackers"], comparison: "ordered", equals: ["c3", "f7"] },
  ), /UNSATISFIED/u);
  assert.throws(() => assertFactConstraint(
    { attackers: ["f7", "f7"] },
    { path: ["attackers"], comparison: "canonical_multiset", equals: ["f7"] },
  ), /UNSATISFIED/u);
  assert.throws(() => assertFactConstraint(
    { attackers: [] },
    { path: ["attackers", "*"], comparison: "scalar", equals: "f7" },
  ), /INVALID/u);
});

const row = {
  id: "owner.castling", version: 1, subject: event,
  case: { id: "castled-positive", version: 1 }, expectation: { kind: "emits", minimum: 1 },
  factConstraint: [], ruling: "ledger:D9000", authoredBy: "OWNER", authoredAt: "2026-08-31",
};
const emptyStore = { schemaVersion: 1, authorities: [] };
const workState = new Map([["ledger:D9000", { rulingKind: "owner-ledger" }]]);
const emptySnapshot = { ownerStore: emptyStore, cases: [], profiles: [], workState };

test("D2447 repository transition derives same-commit admission itself", () => {
  const admittedCase = { id: "castled-positive", version: 1, authority: { kind: "owner_authored", id: row.id, version: 1 } };
  const admittedProfile = { cells: { positive: { state: "present", ref: { kind: "case", id: admittedCase.id, version: 1 } } } };
  assert.throws(() => assertOwnerAuthorityRepositoryTransition(emptySnapshot, {
    ownerStore: { schemaVersion: 1, authorities: [row] }, cases: [admittedCase], profiles: [admittedProfile], workState,
  }), /SAME_COMMIT/u);
  assert.doesNotThrow(() => assertOwnerAuthorityRepositoryTransition(emptySnapshot, {
    ownerStore: { schemaVersion: 1, authorities: [row] }, cases: [], profiles: [], workState,
  }));
});

test("D2448 every equal population rejects duplicate subjects before set equality", () => {
  const base = { roots: [event, reading], declarations: [event, reading], profiles: [event, reading], verdicts: [event, reading] };
  assert.doesNotThrow(() => assertValidationPopulation(base));
  for (const field of ["roots", "declarations", "profiles", "verdicts"]) {
    assert.throws(() => assertValidationPopulation({ ...base, [field]: [...base[field], event] }), /SUBJECT_DUPLICATE/u);
  }
});

test("D2449 bootstrap is specified but remains protected and absent", () => {
  assert.equal(existsSync("design/research/semantic-validation-owner-authorities.json"), false);
  assert.match(rfc, /creates exactly `\{"schemaVersion":1,"authorities":\[\]\}`/u);
  assert.match(rfc, /Codex may not perform or silently combine this discharge with implementation/u);
  assert.match(rfc, /One process-only ruling remains before implementation/u);
});
