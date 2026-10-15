// D3799 observation of permanent factory contract fixtures, NOT live provider/source proof.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { afterAll, vi } from "vitest";
import * as routes from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { MODULE_CONSUMER_ACCEPTS, RECORDED_PATH_SUCCESSOR_REFS, PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { routeReads } from "../../packages/runtime/src/module-query-sources.js";
import { assertDeclaredEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { observedMintInputs } from "./mint-input-observer.js";

// D3847: exact refs are captured after successful unchanged mints by the guarded opt-in transform.
// Never infer projection or occurrence identity from equal payload digests. Keep no payloads.
const projections = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map(row => [`${row.id}@${row.version}`, row]));

const key = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
const windows = new Set(RECORDED_PATH_SUCCESSOR_REFS.map(key));
const target = MODULE_CONSUMER_ACCEPTS.full_inspector.map(key).filter(ref => !routeReads(ref, "fen") && !routeReads(ref, "afterFen|beforeFen|moveUci") && !windows.has(ref));
assert.equal(target.length, 35);
const rows = new Map(target.map(projection => [projection, { projection, successfulCalls: 0, emptyCalls: 0,
  unavailableCalls: 0, refusals: 0, values: 0, arms: [] as string[] }]));
function count(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + count(item), 0);
  assert(typeof value === "object" && value !== null);
  const record = value as Record<string, unknown>;
  if ("evidence" in record) return count(record.evidence);
  if (record.kind === "available") return count(record.value);
  if (record.kind === "unavailable" || record.kind === "not_matched") return 0;
  assertDeclaredEvidence(value as DeclaredEvidence<unknown>);
  return 1;
}
const original = routes.invokeEvidenceValueRoute;
vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((route, input) => {
  const row = rows.get(route);
  let value: ReturnType<typeof original>;
  try { value = original(route, input); }
  catch (error) { if (row !== undefined) row.refusals++; throw error; }
  if (row !== undefined) {
    row.successfulCalls++;
    assert(typeof input === "object" && input !== null);
    const arm = Object.keys(input).sort().join("|");
    if (!row.arms.includes(arm)) row.arms.push(arm);
    const total = count(value);
    row.values += total;
    if (total === 0) row.emptyCalls++;
    if (typeof value === "object" && value !== null && "kind" in value && value.kind === "unavailable") row.unavailableCalls++;
  }
  return value;
});
afterAll(() => {
  const list = [...rows.values()];
  assert(list.every(row => row.successfulCalls > 0), "permanent contract fixture omitted a required source route");
  const report = { scope: "permanent contract-fixture observation; NOT production acquisition, live providers, source qualification or Inspector adoption", rows: list };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  assert(Buffer.byteLength(output) < 24 * 1024);
  mkdirSync(".cache/d3792-inspector-demand", { recursive: true });
  writeFileSync(".cache/d3792-inspector-demand/source-fixtures.json", output);
  console.log(JSON.stringify({ fixtureSourceRefs: list.length, withValues: list.filter(row => row.values > 0).length,
    onlyUnavailable: list.filter(row => row.values === 0 && row.unavailableCalls > 0).map(row => row.projection), reportScope: report.scope }));

  const inspectorClosure = new Set<string>();
  function visit(ref: string): void {
    if (inspectorClosure.has(ref)) return;
    inspectorClosure.add(ref);
    const row = projections.get(ref);
    assert(row, "existing Inspector dependency must have a literal declaration");
    const members = row.derivation?.inputs === undefined ? row.derivation?.anyOf ?? [] : [row.derivation.inputs];
    for (const input of members.flat()) visit(key(input));
  }
  for (const ref of MODULE_CONSUMER_ACCEPTS.full_inspector) visit(key(ref));
  const observed = new Map<string, { calls: number; inputCounts: Set<number>; countMismatches: number;
    refMismatches: number; opaqueInputs: number; matchingRefTuples: number; signatures: Set<string> }>();
  for (const { route, inputs } of observedMintInputs()) {
    const declaration = projections.get(route);
    if (declaration?.derivation === undefined || declaration.disposition?.kind === "retired") continue;
    const members = declaration.derivation.inputs === undefined ? declaration.derivation.anyOf : [declaration.derivation.inputs];
    const row = observed.get(route) ?? { calls: 0, inputCounts: new Set<number>(), countMismatches: 0,
      refMismatches: 0, opaqueInputs: 0, matchingRefTuples: 0, signatures: new Set<string>() };
    row.calls++;
    row.inputCounts.add(inputs.length);
    if (inputs.some(input => input === null)) row.opaqueInputs++;
    const sameCount = members.filter(member => member.length === inputs.length);
    if (sameCount.length === 0) row.countMismatches++;
    else if (inputs.every(input => input !== null)) {
      if (sameCount.some(member => member.every((ref, index) => key(ref) === inputs[index]))) row.matchingRefTuples++;
      else row.refMismatches++;
    }
    // Run-length encoding retains order/multiplicity without repeating dozens of identical refs.
    const runs: { ref: string; count: number }[] = [];
    for (const input of inputs) {
      const ref = input ?? "external_digest";
      if (runs.at(-1)?.ref === ref) runs.at(-1)!.count++;
      else runs.push({ ref, count: 1 });
    }
    row.signatures.add(runs.map(run => `${run.ref}*${run.count}`).join(" -> "));
    observed.set(route, row);
  }
  const derived = PRIMARY_EVIDENCE_MANIFEST.projections.filter(row => row.derivation !== undefined && row.disposition?.kind !== "retired");
  assert(observed.get("derived.story.rank@2")?.countMismatches, "the known rank mismatch must be actually observed");
  assert(observed.get("derived.pivotal.phase_change@1")?.countMismatches, "the phase positive must actually run");
  assert(observed.get("derived.pivotal.option_collapse@1")?.countMismatches, "the collapse positive must actually run");
  assert([...observed.values()].some(row => row.matchingRefTuples > 0), "the observer must also see ordinary matching tuples");
  const inventory = [...observed].sort(([a], [b]) => a.localeCompare(b)).map(([projection, row]) => ({ projection,
    calls: row.calls, inputCounts: [...row.inputCounts].sort((a, b) => a - b),
    declaredInputCounts: [...new Set((projections.get(projection)!.derivation!.inputs === undefined
      ? projections.get(projection)!.derivation!.anyOf! : [projections.get(projection)!.derivation!.inputs!]).map(member => member.length))].sort((a, b) => a - b),
    countMismatches: row.countMismatches, refMismatches: row.refMismatches,
    opaqueInputs: row.opaqueInputs, matchingRefTuples: row.matchingRefTuples,
    inInspectorClosure: inspectorClosure.has(projection),
    ...(row.countMismatches + row.refMismatches + row.opaqueInputs > 0 ? { signatures: [...row.signatures].sort() } : {}) }));
  const summary = { scope: "D3847 exact ref/order/count observation after successful fixture mints; NOT operand identity, production qualification or a new gate",
    declaredDerived: derived.length, observedDerived: observed.size,
    unobserved: derived.filter(row => !observed.has(`${row.id}@${row.version}`)).map(row => `${row.id}@${row.version}`).sort(),
    contradictingRoutes: inventory.filter(row => row.countMismatches + row.refMismatches > 0),
    opaqueInputRoutes: inventory.filter(row => row.opaqueInputs > 0).map(row => row.projection),
    matchingRefRoutes: inventory.filter(row => row.matchingRefTuples > 0).length,
    inspectorClosureRefs: inspectorClosure.size,
    inspectorClosureConflictRoutes: inventory.filter(row => row.inInspectorClosure && row.countMismatches + row.refMismatches > 0).length };
  const compact = JSON.stringify(summary);
  assert(Buffer.byteLength(compact) < 32 * 1024, "keep the diagnostic bounded; do not retain raw value dumps");
  // Disposable compact diagnostic only. No committed report, raw values or progress dependency.
  writeFileSync(".cache/d3792-inspector-demand/literal-input-fixtures.json", `${compact}\n`);
  console.log(compact);
});
