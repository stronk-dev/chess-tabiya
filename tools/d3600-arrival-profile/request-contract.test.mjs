import assert from "node:assert/strict";
import test from "node:test";
import { summarizeArrivalRequests } from "../../tests/browser/arrival-requests.ts";

const resource = (path, changes = {}) => ({ name: `http://127.0.0.1:4173${path}`, initiatorType: "fetch",
  startTime: 120, requestStart: 121, responseStart: 419, responseEnd: 420, duration: 300, ...changes });

test("the actual request summarizer retains delayed write routes without changing arrival counts", () => {
  const sources = [resource("/runs"), resource("/runs/private-run-id/moves", { startTime: 450, requestStart: 451,
    responseStart: 1048, responseEnd: 1049, duration: 599 }), resource("/shapes"), resource("/runs/private-run-id/pack"),
    ...Array.from({ length: 25 }, (_, index) => resource(`/shapes/shape-${index}`, { duration: 10 }))];
  const report = summarizeArrivalRequests(sources, 100, 1200);
  assert.equal(report.total, 29);
  assert.equal(report.shapeCatalogues, 1);
  assert.equal(report.shapeDocuments, 25);
  assert.equal(report.runPacks, 1);
  assert.equal(report.longestMs, 599);
  assert.deepEqual(report.criticalRoutes, [
    { route: "/runs", startAfterClickMs: 20, durationMs: 300, responseWaitMs: 298, bodyReceiveMs: 1 },
    { route: "/runs/:id/moves", startAfterClickMs: 350, durationMs: 599, responseWaitMs: 597, bodyReceiveMs: 1 },
  ]);
  assert(!JSON.stringify(report).includes("private-run-id"));
});

test("outside-window/non-fetch observations and lookalike routes cannot enter the diagnostic", () => {
  const report = summarizeArrivalRequests([resource("/runs", { startTime: 99 }), resource("/runs", { startTime: 1201 }),
    resource("/runs", { initiatorType: "script" }), resource("/runs/id/moves/extra"), resource("/auth/register")], 100, 1200);
  assert.equal(report.total, 2);
  assert.deepEqual(report.criticalRoutes, []);
});

test("missing or contradictory transport phases stay unknown, never manufactured zero wait", () => {
  const report = summarizeArrivalRequests([resource("/runs", { requestStart: 0, responseStart: 0 }),
    resource("/runs/id/moves", { requestStart: 500, responseStart: 499, responseEnd: 498 })], 100, 1200);
  assert.equal(report.criticalRoutes[0].responseWaitMs, null);
  assert.equal(report.criticalRoutes[0].bodyReceiveMs, null);
  assert.equal(report.criticalRoutes[1].responseWaitMs, null);
  assert.equal(report.criticalRoutes[1].bodyReceiveMs, null);
});

test("diagnostic overflow refuses instead of dropping the slower seventeenth request", () => {
  assert.throws(() => summarizeArrivalRequests(Array.from({ length: 17 }, () => resource("/runs")), 100, 1200), /bounded population/u);
});
