import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { executeIsolatedTriplet, isolationSourceDigest, verifyIsolatedTriplet, writeIsolatedTriplet } from "./cost-case-isolation.mjs";
import { sha } from "./cost-contract.mjs";

const fixture = fileURLToPath(new URL("cost-case-isolation-fixture.mjs", import.meta.url));
const subject = { rootFen: "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1", definitions: [{ id: "ep-target", rootId: "synthetic", family: "material",
  target: { attacker: { color: "black", role: "pawn", square: "d4" }, target: { color: "white", role: "pawn", square: "e2" } } }] };
const cell = { rootId: "synthetic", candidateUci: "e2e4", setting: "pv:depth12", horizon: 4, regime: "cold" };
const setting = { id: cell.setting, family: "provider_line", budget: "depth12" };
const planDigest = sha("synthetic control plan, not research evidence");
function context(mode = "success") {
  const dir = mkdtempSync(join(tmpdir(), "d3512-case-controls-")), counter = join(dir, "counter");
  writeFileSync(counter, "0");
  const args = [fixture, mode, counter];
  return { dir, counter, args, options: { cell, setting, subject, planDigest, command: process.execPath,
    args, timeoutMs: 1_000, expectedSourceDigest: isolationSourceDigest(process.execPath, args) },
  cleanup() { rmSync(dir, { recursive: true, force: true }); } };
}
const first = value => value.records[0];
function reseal(record) {
  for (const entry of record.records) {
    entry.row.retainedBytes = Buffer.byteLength(JSON.stringify(entry.raw));
    entry.row.rawCaptureDigest = sha(JSON.stringify(entry.raw));
  }
  return record;
}

for (const mode of ["first_silent", "first_crash"]) test(`${mode}: the failed case is retained; a new process serves the next case without retry`, async () => {
  const c = context(mode);
  try {
    const failed = await executeIsolatedTriplet(c.options);
    const successor = await executeIsolatedTriplet({ ...c.options, cell: { ...cell, horizon: 2 } });
    assert.equal(first(failed).row.kind, mode === "first_silent" ? "budget_exhausted" : "source_unavailable");
    assert.equal(first(successor).row.kind, "available");
    assert.notEqual(failed.trace.pid, successor.trace.pid);
    assert.ok(successor.trace.clock.started >= failed.trace.clock.closed);
    assert.equal(readFileSync(c.counter, "utf8"), "2", "one process per case, not retries until success");
    assert.equal(failed.trace.queries.length, 1); assert.equal(successor.trace.queries.length, 1);
    assert.ok(failed.trace.queries[0].searchCommandWritten);
    assert.equal(failed.records[1].row.kind, "source_unavailable");
    assert.equal(successor.records[1].row.cacheHits, 1);
    assert.ok(successor.records[1].raw.clock.started >= successor.trace.clock.closed);
    assert.equal(successor.records[2].row.cacheHits, 0);
  } finally { c.cleanup(); }
});

test("multiple failing cases still receive one actual process/search each", async () => {
  const c = context("always_silent");
  try {
    const results = [];
    for (const horizon of [2, 4]) results.push(await executeIsolatedTriplet({ ...c.options, cell: { ...cell, horizon } }));
    assert.equal(readFileSync(c.counter, "utf8"), "2");
    assert.ok(results.every(r => first(r).row.kind === "budget_exhausted" && r.trace.queries[0].searchCommandWritten
      && !r.trace.queries[0].inheritedTerminal));
    assert.notEqual(results[0].trace.pid, results[1].trace.pid);
  } finally { c.cleanup(); }
});

test("startup timeout remains startup failure, not an independently emitted search timeout", async () => {
  const c = context("startup_silent");
  try {
    const r = await executeIsolatedTriplet(c.options);
    assert.equal(r.trace.startup.kind, "failed"); assert.equal(r.trace.startup.failure.state, "timed_out");
    assert.equal(first(r).row.kind, "source_unavailable");
    assert.ok(r.trace.queries.every(q => q.inheritedTerminal && !q.searchCommandWritten && q.state === "unavailable"));
    assert.equal(verifyIsolatedTriplet(r).writtenSearches, 0);
  } finally { c.cleanup(); }
});

test("invalid canonical PV stays invalid and is not retried or silently downgraded", async () => {
  const c = context("invalid");
  try {
    const r = await executeIsolatedTriplet(c.options);
    assert.equal(first(r).row.kind, "invalid_source"); assert.equal(r.trace.queries.length, 1);
    assert.equal(r.trace.queries[0].state, "invalid"); assert.equal(r.trace.failures.length, 0);
    assert.equal(readFileSync(c.counter, "utf8"), "1");
  } finally { c.cleanup(); }
});

test("a fatal dependency inside a recursive case is retained, and remaining same-case dependencies are inherited", async () => {
  const c = context("first_second_query_silent");
  try {
    const recursive = { ...cell, setting: "recursive:depth12:top2:top8" };
    const r = await executeIsolatedTriplet({ ...c.options, cell: recursive,
      setting: { id: recursive.setting, family: "recursive_semantic" } });
    assert.equal(first(r).row.kind, "budget_exhausted");
    assert.ok(r.trace.queries.some(q => q.inheritedTerminal));
    assert.ok(r.trace.queries.filter(q => q.inheritedTerminal).every(q => !q.searchCommandWritten && q.commandStart === q.commandEnd));
    assert.equal(r.trace.queries.filter(q => q.searchCommandWritten).length, 2);
    assert.equal(readFileSync(c.counter, "utf8"), "1");
  } finally { c.cleanup(); }
});

test("foreign source/configuration refuses before creating a process", async () => {
  const c = context();
  try {
    await assert.rejects(executeIsolatedTriplet({ ...c.options, expectedSourceDigest: sha("foreign") }), /binary\/configuration/);
    assert.equal(readFileSync(c.counter, "utf8"), "0");
  } finally { c.cleanup(); }
});

test("warm cannot borrow another cold operation's otherwise valid literal receipt", async () => {
  const c = context();
  try {
    const r = await executeIsolatedTriplet(c.options), fake = JSON.parse(JSON.stringify(r));
    const source = fake.records[1].raw.dependencies[0];
    source.receipt.started += 0.001; source.receipt.ended += 0.001;
    fake.records[1].row.providerQueries[0].receiptDigest = sha(JSON.stringify(source.receipt));
    assert.throws(() => verifyIsolatedTriplet(reseal(fake)), /warm source was not/);
  } finally { c.cleanup(); }
});

test("exclusive-create capture preserves first bytes and validates before writing", async () => {
  const c = context();
  try {
    const r = await executeIsolatedTriplet(c.options), path = join(c.dir, "capture.json");
    const written = writeIsolatedTriplet(path, r), original = readFileSync(path);
    assert.equal(written.digest, sha(original)); assert.equal(written.cases, 3);
    assert.throws(() => writeIsolatedTriplet(path, r), /EEXIST/);
    assert.deepEqual(readFileSync(path), original);
    const bad = structuredClone(r); delete bad.trace.clock.teardownStarted;
    assert.throws(() => writeIsolatedTriplet(join(c.dir, "bad.json"), bad), /intervals required/);
  } finally { c.cleanup(); }
});

test("lifecycle reader refuses custody/configuration/emission/cache/interval forgeries even with resealed raw hashes", async t => {
  const c = context();
  try {
    const r = await executeIsolatedTriplet(c.options);
    const mutations = {
      missingTriplet: x => x.records.pop(),
      crossedCell: x => x.trace.cell.candidateUci = "e2e3",
      crossedSource: x => x.trace.sourceDigest = sha("foreign"),
      crossedPlan: x => x.records[1].row.planDigest = sha("foreign"),
      missingStartup: x => x.trace.startup = null,
      missingTeardown: x => delete x.trace.clock.closed,
      unclosedProcess: x => x.trace.exit = { code: null, signal: null },
      clockOutside: x => x.trace.clock.startupEnded = x.trace.clock.coldEnded + 1,
      warmBeforeTeardown: x => x.trace.clock.closed = x.records[1].raw.clock.ended + 1,
      falseEmission: x => x.trace.queries[0].searchCommandWritten = false,
      falseInherited: x => x.trace.queries[0].inheritedTerminal = true,
      missingQuery: x => x.trace.queries.pop(),
      reusedCommandRange: x => x.trace.queries[0].commandStart--,
      changedQueryBudget: x => x.trace.commands.find(c => c.line.startsWith("go ")).line = "go depth 8",
      changedQueryFen: x => x.trace.commands.find(c => c.line.startsWith("position fen")).line = "position startpos",
      changedQueryWidth: x => x.trace.commands.find(c => c.line.startsWith("setoption name MultiPV")).line = "setoption name MultiPV value 99",
      changedStartupThreads: x => x.trace.commands.find(c => c.line.startsWith("setoption name Threads")).line = "setoption name Threads value 2",
      changedQueryIdentity: x => x.trace.queries[0].identity = "foreign",
      queryBeforeCold: x => x.trace.queries[0].started = x.trace.clock.started,
      freshWarm: x => { x.records[1].raw.dependencies[0].state = "executed"; x.records[1].row.providerQueries[0].state = "executed"; },
      coldCacheContamination: x => x.records[0].row.initialCacheEntries = 1,
      offlineReuse: x => { x.records[2].raw.dependencies[0].state = "cached"; x.records[2].row.providerQueries[0].state = "cached"; },
      omittedFatalEventTime: x => x.trace.failures.push({ state: "timed_out", message: "forged" }),
      unknownQueryState: x => { x.trace.queries[0].state = "unknown";
        x.records[0].raw.dependencies[0].state = "unknown"; x.records[0].row.providerQueries[0].state = "unknown"; },
      unknownResultState: x => { x.records[0].raw.result.kind = "unknown"; x.records[0].row.kind = "unknown"; },
      inflatedCacheHits: x => x.records[1].row.cacheHits += 1,
      inventedMemoryPeak: x => x.records[0].row.memory.observation = "external_process_peak",
      negativeSourceTime: x => x.records[0].row.timing.sourceMs = -1,
      falseWholeOperation: x => x.records[0].row.timing.compileMs = x.records[0].row.timing.elapsedMs + 1,
      invalidExitSignal: x => x.trace.exit = { code: null, signal: "" },
    };
    for (const [name, mutate] of Object.entries(mutations)) await t.test(name, () => {
      const bad = JSON.parse(JSON.stringify(r)); mutate(bad);
      assert.throws(() => verifyIsolatedTriplet(reseal(bad)));
    });
  } finally { c.cleanup(); }
});
