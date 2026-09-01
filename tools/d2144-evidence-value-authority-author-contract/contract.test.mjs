// DISPOSABLE RFC author contract for D2144/D2145. This validates the draft, not production.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/evidence-value-authority.md");
const adapters = read("packages/runtime/src/evidence-source-adapters.ts");
const barrel = read("packages/runtime/src/index.ts");
const catalog = read("packages/runtime/src/evidence-catalog.ts");
const audit = read("tools/d2144-evidence-seal-audit/value-authority.test.ts");
const routeReceipt = JSON.parse(read("planning/evidence-foundation-ux/evidence-value-authority-route-map.json"));

const genericRows = [...adapters.matchAll(/export const (declare[A-Za-z]+) = <T extends object>\(payload: T\) => exactObject\("[^"]+", "([^"]+)"/gu)]
  .map((match) => ({ adapter: match[1], projection: match[2] }));

const literal = [
  "rules.castling.reading.rights",
  "rules.castling.reading.legality",
  "rules.castling.event.rights_lost",
  "rules.structural.reading.pawn_connectivity",
  "rules.structural.event.pawn_islands",
  "rules.tactic.consequence.mate_in_one",
  "rules.tactic.consequence.reply_breadth",
  "rules.tactic.event.check",
  "rules.tactic.reading.rook_on_seventh",
];
const convention = [
  "rules.square.reading.control",
  "rules.square.event.control",
  "rules.tactic.reading.defender_duty_set",
  "rules.tactic.event.defender_removed",
  "rules.tactic.event.defender_duty_relocated",
  "rules.tactic.consequence.forced_mate_after_move",
];
const product = ["rules.phase.reading", "rules.structural.reading.named_structure"];
const mixed = ["rules.endgame.reading", "rules.pivotal.marker", "rules.structural.predicate.result"];

test("baseline and draft partition the exact current adapter population", () => {
  assert.equal(genericRows.length, 75);
  assert.equal(new Set(genericRows.map((row) => row.projection)).size, 75);
  for (const row of genericRows) assert.match(barrel, new RegExp(`\\b${row.adapter}\\b`, "u"));

  const reviewed = [...literal, ...convention, ...product, ...mixed];
  assert.equal(reviewed.length, 20);
  assert.equal(new Set(reviewed).size, 20);
  for (const projection of reviewed) {
    assert.match(audit, new RegExp(`projection: "${projection.replaceAll(".", "\\.")}"`, "u"));
    assert.match(rfc, new RegExp(`\\b${projection.replaceAll(".", "\\.")}@1\\b`, "u"));
  }
  assert.match(rfc, /9[\s\S]*?literal totals[\s\S]*?6 exact computations under a direct convention[\s\S]*?2 product classifiers[\s\S]*?3[\s\S]*?multi-authority projections/u);
});

test("successors repair rather than silently relabel the five false or mixed rows", () => {
  const successors = [
    "rules.phase.reading@2",
    "rules.structural.reading.named_structure@2",
    "rules.endgame.classification@1",
    "theory.endgame.setup_match@1",
    "derived.pivotal.irreversibility@1",
    "derived.pivotal.phase_change@1",
    "derived.pivotal.human_divergence@1",
    "derived.pivotal.option_collapse@1",
    "derived.structural.predicate_result@1",
  ];
  for (const successor of successors) {
    assert.match(rfc, new RegExp(successor.replaceAll(".", "\\."), "u"));
    if (!successor.endsWith("@2")) assert.doesNotMatch(catalog, new RegExp(`"${successor.split("@")[0].replaceAll(".", "\\.")}"`, "u"));
  }
  assert.match(rfc, /v1 is retired from new bindings|v1 have zero consumer bindings/u);
  assert.match(rfc, /Lucena\/Philidor\/Vancura setup cannot render without a cited\/versioned setup convention/u);
  assert.match(rfc, /method_stage@1[\s\S]*?research GAPs and cannot be represented by `setup_match`/u);
});

test("the phase successor carries the measured five-arm decision instead of old prose", () => {
  assert.match(rfc, /PhaseBandReadingV2/u);
  for (const kind of [
    "endgame_material_band",
    "material_transition_gap",
    "opening_development_band",
    "middlegame_development_band",
    "development_transition_gap",
  ]) assert.match(rfc, new RegExp(`\\b${kind}\\b`, "u"));
  for (const field of [
    "marginInsideBand",
    "distanceToEndgameBand",
    "distanceToDevelopedBand",
    "distanceToMiddlegameBand",
    "distanceToOpeningBand",
  ]) assert.match(rfc, new RegExp(`\\b${field}\\b`, "u"));
  assert.match(rfc, /computes phase, operands and decision in one operation from FEN/u);
  assert.match(rfc, /never a probability, accuracy estimate, number of[\s\S]*?moves to transition, opening identity or provider-availability signal/u);
  assert.match(rfc, /13\/14, 17\/18, 2\/3 and 4\/5 boundary controls/u);
  assert.doesNotMatch(rfc, /rules\.phase\.reading@2` retains the current `PhaseReading` payload/u);
  assert.doesNotMatch(rfc, /Both successor truth sets remain byte-compatible/u);
});

test("the draft closes all four authority families without a generic payload escape", () => {
  for (const heading of ["Computed", "Derived", "Source receipt", "Authored authority"]) {
    assert.match(rfc, new RegExp(`#### 2\\.[1-4] ${heading}`, "u"));
  }
  assert.match(rfc, /It never accepts a result object, boolean,[\s\S]*?caller-selected cause/u);
  assert.match(rfc, /Callers cannot supply an output payload or choose an ancestry/u);
  assert.match(rfc, /caller-written `sourceId`[\s\S]*?cannot earn a seal/u);
  assert.match(rfc, /Caller prose, attribution, structure names,[\s\S]*?cannot be appended/u);
  assert.match(rfc, /No compatibility adapter may accept the old payload/u);
  assert.doesNotMatch(rfc, /uses? (?:a )?generic factory/u);
});

test("dependencies and closure gates are explicit rather than hand-waved", () => {
  assert.match(rfc, /\*\*Status:\*\* draft/u);
  assert.match(rfc, /author-amended 2026-09-01 through \[\[D2495\]\], \[\[D2484\]\], \[\[D2327\]\] and the D2146/u);
  assert.match(rfc, /dependency-blocked on the[\s\S]*?semantic convention register\/provenance/u);
  assert.match(rfc, /provider exchange contracts/u);
  assert.match(rfc, /semantic-convention-provenance\.md/u);
  assert.match(rfc, /provider-exchange-and-execution\.md/u);
  assert.match(rfc, /semantic-validation-authority\.md/u);
  assert.match(rfc, /set equality among all non-retired final catalogue projections, factory rows and authority[\s\S]*?profiles, with bindings a checked subset/u);
  assert.match(rfc, /191-route \/ 187-projection/u);
  assert.match(rfc, /four duplicate paths and six no-route declarations/u);
  assert.match(audit, /"generic": 75/u);
  assert.match(audit, /"specialized": 116/u);
  assert.match(audit, /"total": 191/u);
  assert.equal(routeReceipt.routes.length, 191);
  assert.equal(new Set(routeReceipt.routes.map((route) => route.currentProjection)).size, 187);
  assert.equal(routeReceipt.summary.rowsWithProductionUses, 184);
  assert.equal(routeReceipt.summary.rowsWithoutProductionUses, 7);
  assert.deepEqual(routeReceipt.summary.boundProjectionsWithoutProductionUses, []);
  for (const route of routeReceipt.routes) {
    assert.ok(route.targetProfiles.length > 0, route.currentProjection);
    for (const profile of route.targetProfiles) {
      assert.match(profile.factorySymbol, /^create[A-Za-z0-9]+V\d+Evidence$/u);
      assert.ok(profile.authorityInputs.length > 0, profile.projection);
      assert.doesNotMatch(profile.authorityInputs.join(" "), /producer_authority_parameters|TODO|TBD/u);
    }
  }
  assert.match(rfc, /joins `SOFTWARE_CONTRACT_TARGETS`/u);
  assert.match(rfc, /not a pre-push hook and requires no custom environment variables/u);
});

test("claims and implementation boundary stay honest", () => {
  assert.match(rfc, /```tabiya-claims\nnone\n```/u);
  assert.match(rfc, /No ordinary module binding, preset, relevance rule, wording or content file changes/u);
  assert.match(rfc, /fresh independent buildability review/u);
  const criteria = rfc.match(/## Acceptance criteria\n([\s\S]*?)\n## Discharges/u)?.[1] ?? "";
  assert.equal([...criteria.matchAll(/^\d+\./gmu)].length, 26);
});

test("recorded runtime readings derive from their exact sourcing-ledger evidence", () => {
  const expected = new Map([
    [
      "recorded.engine.eval@1",
      {
        factory: "createRecordedEngineEvalV1Evidence",
        input: "createSourcingLedgerEngineEvalV1Evidence output",
      },
    ],
    [
      "recorded.tablebase.result@1",
      {
        factory: "createRecordedTablebaseResultV1Evidence",
        input: "createSourcingLedgerTablebaseResultV1Evidence output",
      },
    ],
  ]);

  for (const [projection, authority] of expected) {
    const route = routeReceipt.routes.find((candidate) => candidate.currentProjection === projection);
    assert.ok(route, projection);
    assert.equal(route.targetProfiles.length, 1, projection);
    const [profile] = route.targetProfiles;
    assert.equal(profile.projection, projection);
    assert.equal(profile.factoryShape, "derived");
    assert.equal(profile.factorySymbol, authority.factory);
    assert.deepEqual(profile.authorityInputs, [authority.input]);
    assert.equal(profile.dependency, "provider-exchange-and-execution");
  }

  assert.match(rfc, /\[\[D2327\]\][\s\S]*?createRecordedEngineEvalV1Evidence[\s\S]*?createSourcingLedgerEngineEvalV1Evidence/u);
  assert.match(rfc, /\[\[D2327\]\][\s\S]*?createRecordedTablebaseResultV1Evidence[\s\S]*?createSourcingLedgerTablebaseResultV1Evidence/u);
  assert.match(rfc, /38 computed \/ 25 derived \/ 9 direct source \/ 3 authored/u);
});

test("every used route names an exact callable producer operation", () => {
  assert.equal(routeReceipt.summary.rowsWithResolvedProducerOperations, 184);
  assert.equal(routeReceipt.summary.distinctCurrentProducerOperations, 45);
  assert.deepEqual(routeReceipt.summary.usedRowsMissingProducerOperations, []);
  assert.deepEqual(routeReceipt.summary.exportOnlyRowsWithProducerOperations, []);
  assert.deepEqual(routeReceipt.summary.moduleOwnedProducerOperations, []);

  for (const route of routeReceipt.routes) {
    assert.equal(route.currentProductionUseSites.length, route.currentProductionUseCount, route.currentProjection);
    if (route.currentProductionUseCount === 0) {
      assert.deepEqual(route.currentProducerOperations, [], route.currentProjection);
      continue;
    }
    assert.ok(route.currentProducerOperations.length > 0, route.currentProjection);
    for (const operation of route.currentProducerOperations) {
      assert.match(operation, /^(?:apps|packages)\/.+#[A-Za-z][A-Za-z0-9.]*$/u, operation);
      assert.doesNotMatch(operation, /#<module>$/u);
    }
  }
  assert.match(rfc, /184 used routes to 45 exact enclosing callable operations/u);
  assert.match(rfc, /seven export-only[\s\S]*?carry no current operation/u);
});
