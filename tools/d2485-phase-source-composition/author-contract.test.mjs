import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(file, "utf8");
const rfc = read("rfc/phase-source-composition.md");
const resultBytes = read("planning/phase-source-composition/results.json");
const result = JSON.parse(resultBytes);

function section(heading, nextHeading) {
  const start = rfc.indexOf(heading);
  assert.notEqual(start, -1, `missing ${heading}`);
  const end = nextHeading === undefined ? rfc.length : rfc.indexOf(nextHeading, start + heading.length);
  assert.notEqual(end, -1, `missing ${nextHeading}`);
  return rfc.slice(start, end);
}

test("the draft is lawfully gated and claims no shared resource", () => {
  assert.match(rfc, /\*\*Status:\*\* draft/u);
  assert.match(rfc, /design\/research\/phase-source-composition\.md/u);
  assert.match(rfc, /```tabiya-claims\s+none\s+```/u);
  for (const dependency of [
    "runtime-opening-identity.md",
    "evidence-value-authority.md",
    "provider-exchange-and-execution.md",
    "semantic-convention-provenance.md",
  ]) assert.match(rfc, new RegExp(dependency.replaceAll(".", "\\."), "u"));
});

test("the author baseline is the complete reproducible source join", () => {
  assert.equal(createHash("sha256").update(resultBytes).digest("hex"), "fe0aa83d598a605dcc7977360f512446a641a2201780c36029ddeec68cce4574");
  assert.deepEqual(result.corpus, { packs: 50, positions: 804, paths: 100, pathPositionOccurrences: 1069 });
  assert.deepEqual(result.invariants, {
    matchedEndpointWithoutMembership: 0,
    endgameApplicabilityMismatch: 0,
    recordedTablebaseOutsideDomain: 0,
    collapsedTopLevelPhaseField: 0,
  });
});

test("the source population and overlap numbers are exact rather than illustrative", () => {
  assert.deepEqual(result.sourceReach.endpoint, { absent: 672, matched: 132 });
  assert.deepEqual(result.sourceReach.membership, { absent: 600, member: 204 });
  assert.deepEqual(result.sourceReach.phase, { endgame: 296, middlegame: 233, opening: 153, unclear: 122 });
  assert.deepEqual(result.sourceReach.recordedTablebase, { outside_domain: 563, recorded: 241 });
  assert.equal(result.sourceReach.openingPhaseMatrix["member|opening"], 104);
  assert.equal(result.sourceReach.openingPhaseMatrix["member|unclear"], 70);
  assert.equal(result.sourceReach.openingPhaseMatrix["member|middlegame"], 30);
});

test("history keeps reversible source-local changes and refuses a canonical transition", () => {
  assert.equal(result.history.membershipTransitions["member->absent"], 49);
  assert.equal(result.history.membershipTransitions["absent->member"], 14);
  const arc = section("### 3. Ordered arc", "### 4. Endgame technique boundary");
  for (const kind of [
    "EndpointChange", "CatalogueMembershipChange", "RulesPhaseDecisionChange",
    "EndgameClassificationChange", "TablebaseDomainChange",
    "RecordedTablebaseAvailabilityChange", "LiveTablebaseAvailabilityChange",
  ]) assert.match(arc, new RegExp(`\\b${kind}\\b`, "u"));
  assert.match(arc, /does\s+not emit `opening_to_middlegame`/u);
});

test("tablebase domain, recorded state and live execution are separate closed arms", () => {
  const tablebase = section("#### 2.2 Tablebase slots", "#### 2.3 Forbidden aggregate fields");
  for (const arm of ["recorded", "not_recorded", "not_requested", "available", "unavailable"]) {
    assert.match(tablebase, new RegExp(`"${arm}"`, "u"));
  }
  assert.match(tablebase, /Recorded and live success remain side by side/u);
  assert.match(tablebase, /performs no provider\s+request/u);
});

test("the production handoff is five operation families, not five file mentions", () => {
  const handoff = section("### 5. Production handoffs", "### 6. Availability and failure behavior");
  const rows = handoff.split("\n").filter((line) => /^\| (Support module assembly|Review evidence compiler|bot policy|longitudinal store|advanced inspector) \|/u.test(line));
  assert.equal(rows.length, 5);
  assert.match(handoff, /Support and Review operations are mandatory implementation call sites/u);
  assert.match(handoff, /unused compiler/u);
});

test("material classification cannot launder endgame technique names", () => {
  assert.deepEqual(result.sourceReach.currentTechniqueCandidates, { lucena: 31, philidor: 31 });
  const boundary = section("### 4. Endgame technique boundary", "### 5. Production handoffs");
  assert.match(boundary, /drops\s+the legacy `techniqueCandidates` array entirely/u);
  assert.match(boundary, /zero\s+technique fields and zero technique-name bytes/u);
  assert.match(boundary, /theory\.endgame\.setup_match@1/u);
  assert.match(boundary, /Method stage, bounded reachability and tablebase outcome remain different sources/u);
});

test("completion requires real consumers, normal gates and fresh review", () => {
  const criteria = section("## Acceptance criteria", "## Discharges");
  assert.match(criteria, /five-row production-handoff table is set-equal/u);
  assert.match(criteria, /Support and Review\s+invoke the compiled operation/u);
  assert.match(criteria, /make verify/u);
  assert.match(criteria, /make test-browser/u);
  assert.match(criteria, /CI parity/u);
  assert.match(criteria, /Fresh independent buildability review/u);
});
