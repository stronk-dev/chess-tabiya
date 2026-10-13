import assert from "node:assert/strict";
import test from "node:test";
import { createServer, Server } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Worker } from "node:worker_threads";
import { arrivalWriteRoute, installArrivalServerDiagnostics } from "../../tests/browser/server-diagnostics.mjs";

test("only exact POST write routes enter diagnostics; private ids and query values disappear", () => {
  assert.equal(arrivalWriteRoute("POST", "/runs?secret=token"), "/runs");
  assert.equal(arrivalWriteRoute("POST", "/runs/private-recording/moves?secret=token"), "/runs/:id/moves");
  for (const [method, path] of [["GET", "/runs"], ["POST", "/runs/id/moves/extra"], ["POST", "/auth/register"],
    ["POST", "/runs/id/opponent-ply"], ["POST", "/runs/id/pack"], ["POST", "/runs//moves"], ["POST", undefined]]) {
    assert.equal(arrivalWriteRoute(method, path), undefined);
  }
});

async function withServer(handler, options, check) {
  const restore = installArrivalServerDiagnostics(options);
  const server = createServer(handler);
  try {
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    await check(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    restore();
  }
}

test("actual HTTP/SQLite writes preserve response bytes and collect every call without raw data", async () => {
  const rows = [];
  const database = new DatabaseSync(":memory:");
  const originalExec = DatabaseSync.prototype.exec;
  const originalEmit = Server.prototype.emit;
  const inherited = Object.hasOwn(Server.prototype, "emit");
  try {
    await withServer((_request, response) => {
      database.exec("BEGIN IMMEDIATE");
      database.exec("CREATE TABLE private_table (private_column TEXT)");
      database.exec("COMMIT");
      for (let i = 0; i < 140; i++) { database.exec("BEGIN"); database.exec("ROLLBACK"); }
      response.writeHead(201, { "content-type": "application/json", "set-cookie": "private-cookie" });
      response.end('{"private-response":"unchanged"}');
    }, { report: (row) => rows.push(row) }, async (origin) => {
      const response = await fetch(`${origin}/runs/private-id/moves?private-query=value`, {
        method: "POST", headers: { authorization: "private-token" }, body: "private-body",
      });
      assert.equal(response.status, 201);
      assert.equal(response.headers.get("set-cookie"), "private-cookie");
      assert.equal(await response.text(), '{"private-response":"unchanged"}');
      assert.equal(rows.length, 1); // finish plus close must not emit twice
      const [row] = rows;
      assert.equal(row.route, "/runs/:id/moves");
      assert.equal(row.outcome, "finished");
      assert.equal(row.sqlite.begin.count, 141);
      assert.equal(row.sqlite.commit.count, 1);
      assert.equal(row.sqlite.rollback.count, 140);
      assert(row.requestWindowMs > 0);
      assert.equal(new Date(row.startedAt).toISOString(), row.startedAt);
      assert(Number.isFinite(row.mainThreadCpuMs));
      assert(row.mainThreadCpuMs > 0);
      for (const phase of Object.values(row.sqlite)) assert(phase.totalMs >= phase.maxMs && phase.maxMs >= 0);
      assert(!JSON.stringify(row).includes("private"));
      assert(JSON.stringify(row).length < 1_000);
    });
    assert.equal(DatabaseSync.prototype.exec, originalExec);
    assert.equal(Server.prototype.emit, originalEmit);
    assert.equal(Object.hasOwn(Server.prototype, "emit"), inherited);
  } finally { database.close(); }
});

test("unavailable CPU is unknown and a broken report sink cannot change a response", async () => {
  const rows = [];
  await withServer((_request, response) => { response.statusCode = 409; response.end("original-refusal"); }, {
    cpu: () => { throw new Error("no CPU counter"); },
    report: (row) => { rows.push(row); throw new Error("sink refused"); },
  }, async (origin) => {
    const response = await fetch(`${origin}/runs`, { method: "POST" });
    assert.equal(response.status, 409);
    assert.equal(await response.text(), "original-refusal");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].mainThreadCpuMs, null);
  });
});

test("CPU microseconds are reported in milliseconds without subtracting nested SQL timings", async () => {
  const rows = [];
  await withServer((_request, response) => response.end("ok"), {
    cpu: (previous) => previous === undefined ? { user: 1, system: 2 } : { user: 12_000, system: 3_000 },
    report: (row) => rows.push(row),
  }, async (origin) => {
    assert.equal(await (await fetch(`${origin}/runs`, { method: "POST" })).text(), "ok");
    assert.equal(rows[0].mainThreadCpuMs, 15);
    assert.equal(rows[0].sqlite.begin.count, 0);
  });
});

test("interleaved requests retain separate SQL phases and unmatched routes emit nothing", async () => {
  const rows = [];
  const database = new DatabaseSync(":memory:");
  let resume;
  let entered;
  const firstEntered = new Promise((resolve) => { entered = resolve; });
  const held = new Promise((resolve) => { resume = resolve; });
  try {
    await withServer(async (request, response) => {
      if (request.url === "/runs") { entered(); await held; database.exec("BEGIN"); database.exec("ROLLBACK"); }
      if (request.url === "/runs/second/moves") { database.exec("BEGIN"); database.exec("COMMIT"); }
      response.end("ok");
    }, { report: (row) => rows.push(row) }, async (origin) => {
      const first = fetch(`${origin}/runs`, { method: "POST" });
      await firstEntered;
      assert.equal(await (await fetch(`${origin}/runs/second/moves`, { method: "POST" })).text(), "ok");
      resume();
      assert.equal(await (await first).text(), "ok");
      await (await fetch(`${origin}/runs/second/pack`)).text();
      assert.equal(rows.length, 2);
      assert.equal(rows[0].sqlite.commit.count, 1);
      assert.equal(rows[0].sqlite.rollback.count, 0);
      assert.equal(rows[1].sqlite.commit.count, 0);
      assert.equal(rows[1].sqlite.rollback.count, 1);
    });
  } finally { resume?.(); database.close(); }
});

test("a genuine second-connection write lock is recorded as BEGIN wait, not main-thread CPU", async () => {
  // Instrument calibration only: deliberately held lock is not the cause of GitHub's failure.
  const directory = mkdtempSync(join(tmpdir(), "tabiya-arrival-diagnostics-"));
  const path = join(directory, "lock.sqlite");
  const database = new DatabaseSync(path);
  database.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000");
  const signal = new SharedArrayBuffer(4);
  let worker;
  const rows = [];
  try {
    worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync(workerData.path);
      db.exec('BEGIN IMMEDIATE');
      const entered = new Int32Array(workerData.signal);
      const poll = setInterval(() => {
        if (Atomics.load(entered, 0) === 1) {
          clearInterval(poll);
          setTimeout(() => { db.exec('COMMIT'); db.close(); parentPort.close(); }, 150);
        }
      }, 1);
      parentPort.postMessage('locked');
    `, { eval: true, workerData: { path, signal } });
    const exited = new Promise((resolve, reject) => { worker.once("error", reject); worker.once("exit", resolve); });
    await new Promise((resolve, reject) => { worker.once("message", resolve); worker.once("error", reject); });
    await withServer((_request, response) => {
      Atomics.store(new Int32Array(signal), 0, 1);
      database.exec("BEGIN IMMEDIATE");
      database.exec("COMMIT");
      response.end("unchanged-write");
    }, { report: (row) => rows.push(row) }, async (origin) => {
      assert.equal(await (await fetch(`${origin}/runs`, { method: "POST" })).text(), "unchanged-write");
      assert.equal(rows.length, 1);
      assert.equal(rows[0].sqlite.begin.count, 1);
      assert(rows[0].sqlite.begin.maxMs >= 100);
      assert(rows[0].requestWindowMs >= rows[0].sqlite.begin.maxMs);
      assert(rows[0].mainThreadCpuMs < rows[0].sqlite.begin.maxMs / 2);
    });
    assert.equal(await exited, 0);
  } finally {
    await worker?.terminate(); database.close(); rmSync(directory, { recursive: true });
  }
});

test("normal browser launch observes the genuine built server; deployment stays untouched", () => {
  const config = readFileSync("playwright.config.ts", "utf8");
  assert(config.includes("node --import ./tests/browser/server-diagnostics-preload.mjs apps/server/dist/main.js"));
  assert.match(config, /webServer:\s*\{\s*stdout:\s*"pipe"/u, "server observations must reach CI logs, not Playwright's ignored stdout");
  assert(!readFileSync("apps/server/src/main.ts", "utf8").includes("server-diagnostics"));
  assert(!readFileSync("apps/server/Dockerfile", "utf8").includes("server-diagnostics"));
});
