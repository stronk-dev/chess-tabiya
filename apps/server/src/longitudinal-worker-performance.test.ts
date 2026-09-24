// rfc/longitudinal-store.md §C/§F criterion 16 — the implementation acceptance instrument. The real
// 80-ply fixed-corpus arm projects in the worker thread while the application answers a 20 Hz
// `/healthz` probe for at least 30 seconds. Main event-loop delay must stay p95 < 50 ms and
// max < 250 ms; no probe may exceed 500 ms; in-loop full-CAS renewals keep pace with the projection
// before the one publication. The same projector on the main thread is the able-to-fail negative.
//
// [[D3300]]: the projector now finishes the arm in a few seconds rather than tens, so a fixed "three
// renewals" floor would measure host speed, not liveness. The instrument requires one renewal per
// elapsed heartbeat (less two for the first interval and the checkpoint granularity) up to the
// observed publication; the deterministic >= 3-renewal and timer-only negatives stay in
// longitudinal-store.test.ts, where the projection duration is controlled.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { DatabaseSync } from "node:sqlite";

import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { projectObservations } from "./longitudinal-projector.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "./longitudinal-worker-config.js";
import { importedRun, learner } from "./longitudinal-test-fixtures.js";
import { parsePgnMainline } from "./pgn-import.js";
import { SQLiteRunStorage } from "./storage.js";

const BUDGET = Object.freeze({ probeHz: 20, p95Ms: 50, maxDelayMs: 250, maxProbeMs: 500, minimumMs: 30_000 });
const PGN = new URL("../../../tools/r2-selection-harness/imported-sample.pgn", import.meta.url);

/** The fixed corpus arm: the first game in the retained R2 sample with at least 80 plies. */
function eightyPlies(): readonly string[] {
  const games = readFileSync(PGN, "utf8").split(/\n(?=\[Event )/u);
  for (const game of games) {
    try {
      const moves = parsePgnMainline(game, { requireMoves: true }).moves;
      if (moves.length >= 80) return moves.slice(0, 80).map((move) => move.uci);
    } catch { /* skip malformed games */ }
  }
  throw new Error("no 80-ply game in the fixed corpus");
}

const directories: string[] = [];
let application: ChessTabiyaApplication | undefined;
// Detach before awaiting: a late teardown must never close or delete the next test's database (D3300).
afterEach(async () => {
  const closing = application;
  const removing = directories.splice(0);
  application = undefined;
  try {
    await closing?.close();
  } finally {
    for (const directory of removing) rmSync(directory, { recursive: true, force: true });
  }
});

describe("longitudinal worker responsiveness and lease liveness", () => {
  it("keeps the HTTP event loop responsive through the real 80-ply arm and renews in-loop", async () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-longitudinal-perf-"));
    directories.push(directory);
    const databasePath = join(directory, "perf.sqlite");
    const seed = new SQLiteRunStorage(databasePath, { onMigration: () => {} });
    const owner = learner(seed, "perf");
    const moves = eightyPlies();
    seed.createImportedRun(importedRun("eighty", moves), owner, "80-ply arm", {
      runId: "eighty", sourceKind: "pgn_paste", sourceUrl: null, movetextDigest: `sha256:${"d".repeat(64)}`, headers: {}, result: "*",
      pgn: "fixed corpus", licenceNote: "fixture", importedAt: "2026-09-24T10:00:00.000Z",
    } as never);
    seed.close();

    application = await createApplication({
      engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests(),
      longitudinalWorker: { ...LONGITUDINAL_WORKER_DEFAULTS, workerLeaseMs: 60_000, workerHeartbeatMs: 1_000 },
    });
    await new Promise<void>((resolveListen, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolveListen); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    // Measure the serving window only: composition/startup is before readiness, not request handling.
    const histogram = monitorEventLoopDelay({ resolution: 10 });
    histogram.enable();
    const started = performance.now();
    const probes: number[] = [];
    let complete = false;
    let publishedAfterMs = 0;
    while (performance.now() - started < BUDGET.minimumMs || !complete) {
      const before = performance.now();
      const response = await fetch(`${origin}/healthz`);
      probes.push(performance.now() - before);
      expect(response.status).toBe(200);
      await response.arrayBuffer();
      if (!complete) {
        complete = (application.longitudinal.progress()?.completed ?? 0) >= 1;
        if (complete) publishedAfterMs = performance.now() - started;
      }
      if (performance.now() - started > 600_000) throw new Error("80-ply arm did not publish within 10 minutes");
      await new Promise((resolveWait) => setTimeout(resolveWait, Math.max(0, 1_000 / BUDGET.probeHz - (performance.now() - before))));
    }
    histogram.disable();
    const p95 = histogram.percentile(95) / 1e6;
    const max = histogram.max / 1e6;
    const progress = application.longitudinal.progress()!;
    const database = new DatabaseSync(databasePath);
    const job = database.prepare("SELECT state, completed_seq FROM learner_observation_jobs WHERE run_id='eighty'").get() as { state: string; completed_seq: number };
    const denominators = database.prepare("SELECT sum(decisions) AS n FROM learner_observation_denominators WHERE run_id='eighty'").get() as { n: number };
    database.close();
    const receipt = { event: "longitudinal_worker_performance", probes: probes.length, elapsedMs: Math.round(performance.now() - started), p95DelayMs: p95, maxDelayMs: max, maxProbeMs: Math.max(...probes), renewals: progress.renewals, publishedAfterMs: Math.round(publishedAfterMs) };
    console.info(JSON.stringify(receipt));
    mkdirSync(new URL("../../../.cache/", import.meta.url), { recursive: true });
    writeFileSync(new URL("../../../.cache/longitudinal-worker-performance.json", import.meta.url), `${JSON.stringify(receipt, null, 2)}\n`);
    expect(job).toEqual({ state: "complete", completed_seq: 81 });
    expect(denominators.n).toBe(40);
    expect(progress).toMatchObject({ completed: 1, failed: 0 });
    expect(progress.renewals).toBeGreaterThanOrEqual(Math.max(0, Math.floor(publishedAfterMs / 1_000) - 2));
    expect(p95).toBeLessThan(BUDGET.p95Ms);
    expect(max).toBeLessThan(BUDGET.maxDelayMs);
    expect(Math.max(...probes)).toBeLessThan(BUDGET.maxProbeMs);
  }, 900_000);

  it("fails the delay gate when the same projector runs on the main thread (able-to-fail control)", () => {
    // The whole arm: after D3300 a handful of decisions can finish inside the budget on a fast host.
    const moves = eightyPlies();
    const run = importedRun("main-thread", moves);
    const image = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    const owner = learner(image, "main");
    image.createImportedRun(run, owner, "main", { runId: "main-thread", sourceKind: "pgn_paste", sourceUrl: null, movetextDigest: `sha256:${"d".repeat(64)}`, headers: {}, result: "*", pgn: "x", licenceNote: "fixture", importedAt: "2026-09-24T10:00:00.000Z" } as never);
    const sealed = image.longitudinalSourceImageV4("main-thread", run.events.length);
    const before = performance.now();
    projectObservations(sealed);
    const blocked = performance.now() - before;
    image.close();
    // One synchronous projection of the arm blocks the loop longer than the whole max budget.
    expect(blocked).toBeGreaterThan(BUDGET.maxDelayMs);
  }, 120_000);
});
