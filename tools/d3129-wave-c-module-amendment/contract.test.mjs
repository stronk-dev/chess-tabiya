import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const workState = JSON.parse(read("planning/work-state.json"));

const observed = Object.freeze([
  "derived.tactic.deflection_observed",
  "derived.tactic.attraction_observed",
  "derived.tactic.line_blocker_clearance_observed",
  "derived.tactic.square_clearance_observed",
  "derived.tactic.interference_observed",
  "derived.tactic.check_zwischenzug_observed",
  "derived.tactic.overload_exploitation_observed",
]);

const inspectorOnly = Object.freeze([
  "rules.tactic.reading.defender_duty_set",
  "rules.tactic.event.defender_removed",
  "rules.tactic.event.defender_duty_relocated",
  "derived.tactic.overloaded_defender_response_conflict",
  "rules.tactic.consequence.forced_mate_after_move",
]);

const waveC = Object.freeze([...observed, ...inspectorOnly]);
const key = (module, projection) => `module.${module}\0${projection}`;
const expected = new Set([
  ...observed.flatMap((projection) => [
    key("postcommit_nudge", projection),
    key("review_map", projection),
    key("full_inspector", projection),
  ]),
  ...inspectorOnly.map((projection) => key("full_inspector", projection)),
]);

test("D3129 binds the twelve shipped Wave-C projections through exactly 26 module pairs", () => {
  assert.equal(new Set(waveC).size, 12);
  const actual = new Set(bindings.rows
    .filter((row) => waveC.includes(row.projection.id))
    .map((row) => key(row.consumer.id.slice("module.".length), row.projection.id)));
  assert.deepEqual(actual, expected);
  assert.equal(actual.size, 26);
  assert.equal(bindings.population, 229);
});

test("the five candidate or operand facts stay out of proactive modules", () => {
  for (const projection of inspectorOnly) {
    const consumers = bindings.rows
      .filter((row) => row.projection.id === projection)
      .map((row) => row.consumer.id);
    assert.deepEqual(consumers, ["module.full_inspector"]);
  }
});

test("the amendment uses only shipped ids and excludes transferred promotion projections", () => {
  const catalogue = read("packages/runtime/src/evidence-catalog.ts");
  for (const projection of waveC) assert.match(catalogue, new RegExp(`\\"${projection.replaceAll(".", "\\.")}\\"`));
  for (const row of bindings.rows) {
    assert.notEqual(row.projection.id, "derived.pawn.promotion_race_geometry");
    assert.notEqual(row.projection.id, "derived.pawn.promotion_race_tablebase");
  }
});

test("the parent amendment and implementation draft declare the same boundary", () => {
  const parent = read("rfc/learner-modules.md");
  const implementation = read("rfc/module-registration.md");
  assert.match(parent, /exactly \*\*26 literal `\(projection id, module consumer id\)` pairs\*\*/u);
  assert.match(parent, /all twelve literal ids enumerated above/u);
  assert.match(parent, /other five bind only to Inspector/u);
  assert.match(implementation, /exact\s+Wave-C delta is therefore 26 pairs/u);
  assert.match(implementation, /132\/229 requirements image/u);
});

test("D921 no longer depends on the Review compiler that consumes it", () => {
  const d921 = workState.items.find((item) => item.id === "D921");
  assert.deepEqual(d921, {
    id: "D921",
    state: "doing",
    sourceGlyph: "💡",
    sourceDigest: d921.sourceDigest,
    uxItems: [],
    owner: "assistance-and-presentation",
    since: "2026-09-07",
  });
});
