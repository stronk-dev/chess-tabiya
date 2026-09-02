// DISPOSABLE eighth author contract. It validates RFC author bytes; it is not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const amendment = JSON.parse(read("tools/d2518-pack-capability-eighth-author-repair/operation-amendment.json"));
const baseBytes = read(amendment.base.path);
const base = JSON.parse(baseBytes);
const rfc = read("rfc/pack-capability-contract.md");
const rest = read("apps/server/src/rest.ts");
const queue = read("apps/server/src/evidence-queue.ts");
const service = read("apps/server/src/service.ts");

test("D2518: both HTML token scopes join the public router population", () => {
  assert.equal(createHash("sha256").update(baseBytes).digest("hex"), amendment.base.sha256);
  const external = [...base.boundedPopulation.externalRoutes, ...amendment.externalRouteAdditions];
  const run = base.runRouteActions.flatMap((row) => row.branches.map((branch) => ({ action: row.action, ...branch })));
  assert.equal(run.length, 48);
  assert.equal(external.length, 12);
  assert.equal(external.length + run.length, 60);
  assert.equal(new Set([...external, ...run].map((row) => row.operation)).size, 59);
  assert.deepEqual(amendment.externalRouteAdditions.map((row) => row.branch), [
    "loaded publicToken.scope=story_read",
    "loaded publicToken.scope=session_join",
  ]);
  assert.equal(external.filter((row) => row.operation === "story.public").length, 2);
  assert.match(rest, /const publicCardRoute = \/\^\\\/shared/);
  assert.match(rest, /service\.publicStory\(token\)/);
  assert.match(rest, /live\.publicJoin\(token\)/);
  assert.match(rfc, /resolve the token once by hash before dispatch/u);
});

test("D2519: the two worker gateways and all enqueue origins are explicit", () => {
  assert.deepEqual(amendment.queuedProviderOperations.map((row) => row.operation), [
    "evidence.stockfish_analysis",
    "evidence.tablebase_probe",
  ]);
  assert.equal((queue.match(/this\.#executor\.execute\(/gu) ?? []).length, 1);
  assert.equal((queue.match(/this\.#tablebase\.probe\(/gu) ?? []).length, 1);
  assert.deepEqual([...new Set(amendment.enqueueOrigins.map((row) => row.origin))].sort(), [
    "explicit_analysis", "run_enrichment", "story_completion",
  ]);
  for (const symbol of ["enqueueEvidence(", "#ensureStoryEvidence(", "#enqueueMoveEvidence("]) {
    assert.ok(service.includes(symbol), `missing ${symbol}`);
  }
  assert.deepEqual([...new Set([...base.providerCallSites.map((row) => row.operation), ...amendment.queuedProviderOperations.map((row) => row.operation)])].filter((id) => id.startsWith("evidence.")).sort(), [
    "evidence.stockfish_analysis", "evidence.tablebase_probe",
  ]);
});

test("D2520: admission and durable settlement are separate, closed authorities", () => {
  assert.deepEqual(amendment.durableStates, [
    "admitted", "running", "retry_wait", "settled_success", "settled_empty",
    "settled_unavailable", "cancelled", "consumed",
  ]);
  assert.match(rfc, /HTTP 202 means only that the durable `admitted` row\s+committed/u);
  assert.match(rfc, /shutdown[\s\S]{0,120}`retry_wait`/u);
  assert.match(rfc, /evidence_jobs/u);
  assert.match(rfc, /position behind `longitudinal-store`/u);
  assert.doesNotMatch(rfc, /HTTP 202 means (?:the provider succeeded|evidence exists)/u);
  for (const origin of amendment.enqueueOrigins) {
    assert.ok(["honest_empty", "unavailable"].includes(origin.providerOff));
  }
});
