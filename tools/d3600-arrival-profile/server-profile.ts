// DISPOSABLE D3779/D3600 research: actual HTTP + SQLite + production worker phases.
// No production instrumentation, disabled worker, timing gate or raw CPU recording on disk.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

import { createApplication } from "../../apps/server/src/application.js";
import { LongitudinalStore } from "../../apps/server/src/longitudinal-store.js";
import { RunService } from "../../apps/server/src/service.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";
import { installArrivalServerDiagnostics } from "../../tests/browser/server-diagnostics.mjs";

assert.match(process.version, /^v24\./u, "use make arrival-server-profile");
type Span = { phase: string; startMs: number; durationMs: number };
type Window = { started: number; spans: Span[] };
let active: Window | undefined;
const restore: (() => void)[] = [];
const requestPhases: unknown[] = [];
restore.push(installArrivalServerDiagnostics({ report: (row: unknown) => { requestPhases.push(row); } }));
function wrap(prototype: object, key: string, label = key): void {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
  assert(descriptor && typeof descriptor.value === "function", `missing production phase ${label}`);
  const original = descriptor.value as (...args: unknown[]) => unknown;
  Object.defineProperty(prototype, key, { ...descriptor, value: function (this: unknown, ...args: unknown[]) {
    const window = active, started = performance.now();
    const finish = (): void => {
      if (window === undefined) return;
      assert(window.spans.length < 128, "bounded phase recording overflow");
      window.spans.push({ phase: label === "sqlite.exec" ? `sqlite.${String(args[0]).split(/\s/u)[0]}` : label,
        startMs: started - window.started, durationMs: performance.now() - started });
    };
    try {
      const result = original.apply(this, args);
      if (result instanceof Promise) return result.finally(finish);
      finish(); return result;
    } catch (error) { finish(); throw error; }
  } });
  restore.push(() => Object.defineProperty(prototype, key, descriptor));
}

for (const key of ["create", "move", "opponentPly"] as const) wrap(RunService.prototype, key, `service.${key}`);
for (const key of ["create", "save", "upsertAttempts"] as const) wrap(SQLiteRunStorage.prototype, key, `storage.${key}`);
for (const key of ["refreshWatermarkInTransaction", "sourceDigest"] as const) wrap(LongitudinalStore.prototype, key, `longitudinal.${key}`);
wrap(DatabaseSync.prototype, "exec", "sqlite.exec");

const directory = mkdtempSync(join(tmpdir(), "tabiya-d3779-write-profile-"));
let application: Awaited<ReturnType<typeof createApplication>> | undefined;
let cookie = "";
try {
  application = await createApplication({
    databasePath: join(directory, "app.sqlite"), engineMode: "mock", cookieSecure: false, development: true,
    longitudinalWorkerEntry: pathToFileURL(resolve("apps/server/dist/longitudinal-worker-thread.js")),
    draftPackFiles: ["schemas/drill_pack.example.json", "schemas/fixtures/drill-pack/terminal-outcome.browser.json",
      "content/drafts/immediate-guard.browser.json", "content/drafts/line-boundary.browser.json",
      "content/drafts/outcome-hold.browser.json", "content/drafts/outcome-resist.browser.json",
      "content/drafts/stated-reasoning.browser.json", "content/drafts/trajectory-legs.browser.json",
      "schemas/fixtures/drill-pack/campaign-boss.browser.json"],
    draftCampaignFiles: ["tests/browser/fixtures/campaign.browser.json"],
  });
  await new Promise<void>(resolve => application.server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
  const writer = `d3779-${randomUUID()}`;
  const request = async (path: string, body: unknown) => {
    const started = performance.now();
    const window = { started: performance.now(), spans: [] } as Window;
    active = window;
    try {
      const response = await fetch(`${origin}${path}`, { method: "POST", headers: {
        "content-type": "application/json", "x-writer-id": writer, ...(cookie ? { cookie } : {}),
      }, body: JSON.stringify(body) });
      const responseMs = performance.now() - window.started;
      const result = await response.json();
      assert(response.ok, `${path} refused: ${response.status} ${JSON.stringify(result)}`);
      const returnedCookie = response.headers.getSetCookie()[0];
      if (returnedCookie !== undefined) cookie = returnedCookie.split(";")[0]!;
      return { result, timing: { responseMs, bodyMs: performance.now() - window.started - responseMs,
        totalMs: performance.now() - started, spans: window.spans } };
    } finally { active = undefined; }
  };
  await request("/auth/register", { handle: `d3779_${randomUUID().slice(0, 8)}`, password: "disposable-arrival-profile" });
  // Preserve the first write and every later sample. This loopback host is not GitHub's runner.
  const rows = [];
  for (let sample = 0; sample < 5; sample++) {
    const runId = `d3779-${randomUUID()}`;
    const created = await request("/runs", { id: runId, session: { kind: "pack", packId: "anti-caro-advance-c5-race" },
      policyConfig: { seedMode: "per_run", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 930545106 });
    assert.equal(created.result.run.id, runId);
    const run = created.result.run;
    const selected = await request("/select-move", { startFen: run.nodes[0].fen, historyUci: [], policy: { ...run.opponentPolicy, policyConfigDigest: run.sessionDigest },
      seed: 930545106, packId: run.packId });
    assert(selected.result.moveUci, "the genuine selector must return an admitted initial opponent selection");
    const committed = await request(`/runs/${runId}/moves`, { selection: selected.result });
    assert.equal(committed.result.run.nodes.length, run.nodes.length + 1);
    assert.notEqual(committed.result.run.activeCursor.nodeId, run.activeCursor.nodeId);
    const row = { sample, create: created.timing, move: committed.timing, worker: application.longitudinal.progress() };
    rows.push(row);
    console.log(`D3779_SERVER ${JSON.stringify({ sample, createMs: row.create.responseMs, moveMs: row.move.responseMs,
      longestCreate: row.create.spans.reduce((a, b) => a.durationMs > b.durationMs ? a : b),
      longestMove: row.move.spans.reduce((a, b) => a.durationMs > b.durationMs ? a : b), worker: row.worker })}`);
  }
  assert.equal(requestPhases.length, 10, "retain diagnostics for all five genuine create/commit pairs");
  // Only bounded phase aggregates, never a raw profile, trace or run.
  mkdirSync(".cache", { recursive: true });
  writeFileSync(".cache/d3779-write-profile.json", `${JSON.stringify({ measuredAt: new Date().toISOString(), node: process.version,
    purpose: "D3779 local write phases; not a CI-host reproduction or release receipt", rows, requestPhases }, null, 2)}\n`);
} finally {
  active = undefined;
  restore.reverse().forEach(reset => reset());
  try { await application?.close(); }
  finally { rmSync(directory, { recursive: true }); }
}
