// D3799 observation of permanent factory contract fixtures, NOT live provider/source proof.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { afterAll, vi } from "vitest";
import * as routes from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { MODULE_CONSUMER_ACCEPTS, RECORDED_PATH_SUCCESSOR_REFS } from "../../packages/runtime/src/evidence-catalog.js";
import { routeReads } from "../../packages/runtime/src/module-query-sources.js";
import { assertDeclaredEvidence, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";

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
});
