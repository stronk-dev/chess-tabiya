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

test("D2390: dependencies and conventions are separate, closed sets with valid future lineage", () => {
  assert.equal(plan.schemaVersion, 2);
  assert.equal(plan.futureConventionClaim.length, 12);
  assert.deepEqual(plan.futureConventionClaim, [...plan.futureConventionClaim].sort());
  const landedHeads = new Map();
  for (const { ref } of seed.members) {
    const [base, versionText] = ref.split("@");
    landedHeads.set(base, Math.max(landedHeads.get(base) ?? 0, Number(versionText)));
  }
  for (const ref of plan.futureConventionClaim) {
    const [base, versionText] = ref.split("@");
    assert.equal(Number(versionText), (landedHeads.get(base) ?? 0) + 1, ref);
  }
  for (const item of plan.rows) {
    assert.equal("authority" in item, false, item.projection);
    assert.ok(Array.isArray(item.sourceDependencies), item.projection);
    assert.ok(Array.isArray(item.conventions), item.projection);
  }
  const consequence = row("derived.pawn.consequence.backward_pawn_legal_advance@1");
  assert.deepEqual(consequence.conventions, ["backward-pawn@1", "legal-exchange@1"]);
  assert.deepEqual(consequence.sourceDependencies.map(({ ref }) => ref), [
    "rules.exchange.predicate.legal_exchange@1",
    "rules.structural.reading.backward_pawn@2",
  ]);
});

test("D2391: clock decision authenticates a recorded event and resolves operands through recorded-clocks", () => {
  const clock = row("run.record.clock_decision@1");
  assert.equal(clock.grain, "recorded_decision");
  assert.deepEqual(clock.sourceDependencies, [{ kind: "rfc", ref: "recorded-clocks" }]);
  const grain = section("type FoundationSourceGrain", "The value constructor");
  for (const operand of ["runId", "eventHead", "eventId", "actorClass", "decisionClass", "decisionId"]) {
    assert.match(grain, new RegExp(operand, "u"));
  }
  assert.match(section("- `run.record.clock_decision@1`", "Conventions:"), /`recorded_decision` receipt and `recorded-clocks` contract/u);
});

test("D2392: operation owners agree with grain and fianchetto remains a reusable position fact", () => {
  const ownerForGrain = {
    candidate: "shared-candidate-evidence-packet",
    edge: "shared-candidate-evidence-packet",
    position: "shared-candidate-evidence-packet",
    frozen_prefix: "recorded-semantic-path",
    recorded_decision: "recorded-clocks",
  };
  for (const item of plan.rows) assert.equal(item.executionOwner, ownerForGrain[item.grain], item.projection);
  for (const projection of ["rules.structural.reading.fianchetto_setup@1", "rules.structural.reading.fianchetto_knight_screen@1"]) {
    assert.equal(row(projection).grain, "position");
    assert.equal(row(projection).executionOwner, "shared-candidate-evidence-packet");
  }
});

test("D2393: every style atom requires an actor/decision occurrence envelope", () => {
  const style = plan.rows.filter(({ family }) => family === "style_atoms");
  assert.equal(style.length, 7);
  assert.ok(style.every(({ contextRequirement }) => contextRequirement === "actor_decision"));
  const text = section("### 3.8 Literal style atoms", "## 4. Authored predicate compatibility");
  for (const operand of ["ContextualFoundationOccurrence", "actorClass", "decisionClass", "decisionId", "source-receipt digest"]) {
    assert.match(text, new RegExp(operand, "u"));
  }
  assert.match(text, /bare source fact cannot satisfy an occurrence consumer/u);
});

test("D2394: opposition and backward-pawn successor events have total five-case algebras", () => {
  const opposition = section("### 3.1 Unobstructed king opposition v2", "### 3.2 Backward pawn v2");
  for (const transition of ["Absent→absent", "absent→present", "present→absent", "present→present", "membership_changed"]) {
    assert.match(opposition, new RegExp(transition, "iu"));
  }
  const backward = section("### 3.2 Backward pawn v2", "### 3.3 Exact pawn-file groups");
  for (const rule of ["from-square row to its to-square row", "remaining before", "remaining after", "membership_changed", "matched equal row emits nothing"]) {
    assert.match(backward, new RegExp(rule, "u"));
  }
});
