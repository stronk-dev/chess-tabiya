import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { auditExecutionFrontier, CATALOGUE } from "./dist/audit.js";

const key = ref => `${ref.id}@${ref.version}`;
const report = auditExecutionFrontier(CATALOGUE);
const modern = { id: "opponent.selection", version: 2 };
const binding = CATALOGUE.bindings.find(row => key(row.consumer) === key(modern));
const target = value => value.consumers.find(row => row.consumer === key(modern));

test("the saved complete research snapshot matches the current catalogue without rewriting it", () => {
  const saved = JSON.parse(readFileSync(new URL("../../planning/provider-exchange-and-execution/execution-frontier.json", import.meta.url), "utf8"));
  assert.deepEqual(saved, report);
});

test("the actual census retains every projection, isolated binding and exact consumer", () => {
  assert.deepEqual(report.projections.map(row => row.projection).sort(), CATALOGUE.projections.map(key).sort());
  assert.deepEqual(report.bindings.map(row => row.adapter).sort(), CATALOGUE.bindings.map(row => key(row.adapter)).sort());
  assert.deepEqual(report.consumers.map(row => row.consumer).sort(), CATALOGUE.consumers.map(key).sort());
  for (const totals of [report.summary.projections, report.summary.isolatedBindings, report.summary.completeConsumers]) {
    assert.equal(totals.total, totals.compiled + totals.refused);
  }
  assert.equal(report.wholeManifest.kind, "refused");
  assert.equal(report.wholeManifest.code, "EXECUTION_SOURCE_UNREGISTERED");
  assert.ok(report.consumers.every(row => row.runtimeAdoption === "not_measured"));
});

test("all failed provider declarations retain their literal ancestor and consumer joins", () => {
  const raw = report.providerFrontier.find(row => row.projection === "human.maia.uci_response@1");
  assert.ok(raw);
  assert.ok(raw.affectedProjections.includes(raw.projection));
  assert.ok(raw.affectedConsumers.includes("opponent.selection@1"));
  assert.ok(!raw.affectedConsumers.includes("opponent.selection@2"));
  for (const row of report.providerFrontier) for (const adapter of row.affectedBindings) {
    const bound = report.bindings.find(binding => binding.adapter === adapter);
    assert.ok(row.affectedProjections.includes(bound.projection));
    assert.ok(row.affectedConsumers.includes(bound.consumer));
  }
});

test("one compilable binding cannot approve a complete consumer with an extra raw binding", () => {
  const extra = { ...binding, adapter: { id: "fixture.raw", version: 1 },
    producer: { id: "human.maia", version: 1 }, projection: { id: "human.maia.uci_response", version: 1 } };
  const changed = auditExecutionFrontier({ ...CATALOGUE, bindings: [...CATALOGUE.bindings, extra] });
  assert.equal(changed.bindings.find(row => row.adapter === key(binding.adapter)).isolatedDiagnostic.kind, "compiled");
  assert.equal(changed.bindings.find(row => row.adapter === "fixture.raw@1").isolatedDiagnostic.kind, "refused");
  assert.equal(target(changed).completeContract.kind, "refused");
  assert.equal(target(changed).bindingCount, 2);
});

test("missing source policy and impossible latency remain separate diagnosed refusals", () => {
  const { sourceAbsence: _policy, ...bare } = binding;
  for (const [replacement, code] of [[bare, "BINDING_SOURCE_ABSENCE"],
    [{ ...binding, latency: { mode: "sync", maxMs: 0 } }, "BINDING_EXECUTION_LATENCY"]]) {
    const changed = auditExecutionFrontier({ ...CATALOGUE, bindings: CATALOGUE.bindings.map(row => row === binding ? replacement : row) });
    assert.equal(target(changed).completeContract.code, code);
    assert.equal(changed.bindings.find(row => row.adapter === key(binding.adapter)).isolatedDiagnostic.code, code);
  }
});

test("literal alternative refusal is not hidden by a local sibling or a semantic-only dependency", () => {
  const local = CATALOGUE.projections.find(row => row.id === "rules.structural.predicate.piece_count");
  const make = (id, derivation) => ({ ...local, id, dependsOn: [{ id: "human.maia.uci_response", version: 1 }],
    ...(derivation === undefined ? {} : { derivation }) });
  const semantic = make("fixture.semantic_only");
  const alternative = make("fixture.choice", { anyOf: [[local], [{ id: "human.maia.uci_response", version: 1 }]] });
  const changed = auditExecutionFrontier({ ...CATALOGUE, projections: [...CATALOGUE.projections, semantic, alternative] });
  assert.equal(changed.projections.find(row => row.projection === "fixture.semantic_only@1").result.kind, "compiled");
  assert.equal(changed.projections.find(row => row.projection === "fixture.choice@1").result.kind, "refused");
  const raw = changed.providerFrontier.find(row => row.projection === "human.maia.uci_response@1");
  assert.ok(!raw.affectedProjections.includes("fixture.semantic_only@1"));
  assert.ok(raw.affectedProjections.includes("fixture.choice@1"));
});

test("successful diagnostics preserve repeated provider occurrence addresses", () => {
  const local = CATALOGUE.projections.find(row => row.id === "rules.structural.predicate.piece_count");
  const source = { id: "live.stockfish.position_eval", version: 1 };
  const repeated = { ...local, id: "fixture.repeated", dependsOn: [source], derivation: { inputs: [source, source] } };
  const changed = auditExecutionFrontier({ ...CATALOGUE, projections: [...CATALOGUE.projections, repeated] });
  const result = changed.projections.find(row => row.projection === "fixture.repeated@1").result;
  assert.equal(result.kind, "compiled");
  assert.deepEqual(result.value.paths[0].sourceRequirements.map(row => row.occurrence), [[0], [1]]);
});

test("exact consumer versions do not alias and the audit is deterministic without mutation", () => {
  const previous = report.consumers.find(row => row.consumer === "opponent.selection@1");
  assert.equal(previous.completeContract.kind, "refused");
  assert.equal(target(report).completeContract.kind, "compiled");
  assert.equal(target(report).bindingCount, 1);
  assert.equal(previous.bindingCount, 5);
  assert.equal(JSON.stringify(auditExecutionFrontier(CATALOGUE)), JSON.stringify(report));
  assert.equal(CATALOGUE.consumers.find(row => key(row) === key(modern)).accepts.length, 1);
});
