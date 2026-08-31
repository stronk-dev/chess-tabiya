import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/foundation-source-identity.md", "utf8");
const plan = JSON.parse(readFileSync("planning/foundation-source-identity/projection-plan.json", "utf8"));
const seed = JSON.parse(readFileSync("planning/semantic-convention-register/initial-members.json", "utf8"));
const row = (projection) => plan.rows.find((candidate) => candidate.projection === projection);
const section = (start, end) => {
  const startIndex = rfc.indexOf(start);
  return rfc.slice(startIndex, rfc.indexOf(end, startIndex + start.length));
};

test("D2390: scalar authority loses dependency closure and the future convention claim is invalid", () => {
  assert.equal(row("derived.pawn.consequence.backward_pawn_legal_advance@1").authority, "legal-exchange@1");
  assert.match(section("### 3.2 Backward pawn v2", "### 3.3 Exact pawn-file groups"), /backward-pawn@2` plus `legal-exchange@1/u);
  assert.match(rfc, /exact member claim for\s+the eight convention ids/u);
  const future = [
    "king-opposition-unobstructed@2", "backward-pawn@2", "line-blocker-membership@1",
    "pawn-island-topology@1", "future-file-challenge@1", "capture-migration-reach@1",
    "outpost-candidate@1", "fianchetto-configuration@1", "extended-center-destination@1",
    "early-queen-ply@1", "castling-first-decision@1", "clock-spend-input@1",
  ];
  assert.equal(future.length, 12);
  const landedBases = new Set(seed.members.map(({ ref }) => ref.replace(/@[1-9][0-9]*$/u, "")));
  for (const invalidNewV2 of future.slice(0, 2)) {
    assert.equal(landedBases.has(invalidNewV2.replace(/@[1-9][0-9]*$/u, "")), false);
    assert.match(invalidNewV2, /@2$/u);
  }
});

test("D2391: clock_decision requires operands its edge grain cannot authenticate", () => {
  assert.equal(row("run.record.clock_decision@1").grain, "edge");
  const grain = section("type FoundationSourceGrain", "The value constructor");
  const edge = grain.split("\n").find((line) => line.includes('kind: "edge"'));
  assert.match(edge, /kind: "edge"; readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string/u);
  assert.doesNotMatch(edge, /clock|timeControl|eventHead|actor/u);
  const clock = section("- `run.record.clock_decision@1`", "Conventions:");
  for (const operand of ["actor", "decision", "previous/current clock", "base", "increment", "source event"]) {
    assert.match(clock, new RegExp(operand.replace("/", "\\/"), "u"));
  }
});

test("D2392: position-grain fianchetto rows contradict the RFC operation rule", () => {
  for (const projection of ["rules.structural.reading.fianchetto_setup@1", "rules.structural.reading.fianchetto_knight_screen@1"]) {
    assert.equal(row(projection).grain, "position");
    assert.equal(row(projection).executionOwner, "recorded-semantic-path");
  }
  assert.match(rfc, /One-edge\/position\/candidate rows go\s+through `shared-candidate-evidence-packet`/u);
});

test("D2393: style source payloads omit required actor and decision class", () => {
  const style = section("### 3.8 Literal style atoms", "## 4. Authored predicate compatibility");
  assert.doesNotMatch(style, /decisionClass|decisionId|actorClass/u);
  assert.match(readFileSync("planning/evidence-foundation-ux/style-foundation-atoms-author-repair-2026-08-26.md", "utf8"), /Every atom retains actor\/decision class/u);
});

test("D2394: successor event cardinality is partial for changed-but-still-present relations", () => {
  const opposition = section("### 3.1 Unobstructed king opposition v2", "### 3.2 Backward pawn v2");
  assert.match(opposition, /sign is `gained \| lost`/u);
  assert.match(opposition, /Equal exact readings emit no event/u);
  assert.doesNotMatch(opposition, /membership_changed|lost\+gained|truth-preserving/u);
  const backward = section("### 3.2 Backward pawn v2", "### 3.3 Exact pawn-file groups");
  assert.match(backward, /including pawn move or\s+removal/u);
  assert.doesNotMatch(backward, /signs? (?:are|is)|membership_changed|lost\+gained/u);
});
