// DISPOSABLE D4224 actual-source cost attribution. No production hooks, producer or oracle.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { Session } from "node:inspector/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CandidatePopulationService } from "../../apps/server/src/candidate-population-service.js";
import { GUIDED_HINT_PROFILE } from "../../apps/server/src/application.js";
import { SUBJECT_OUTCOME_FAMILIES } from "../../packages/runtime/src/semantic-subject-types.js";
import { completeEquality } from "../d4175-outcome-delivery/source-equality.js";
import { assertWide, collect, reviewPositions, LITERAL_POSITIONS, type Position } from "../d4175-outcome-delivery/workload.js";
import { StageTrace, TRACE_KEY, BUILD_KEY } from "./trace.js";
import { summarizeCpu } from "./cpu.js";

function positions(smoke: boolean) { const rows = smoke ? LITERAL_POSITIONS.slice(0, 2) : reviewPositions();
  assert.equal(rows.length, smoke ? 2 : 32); assert.equal(new Set(rows.map(row => row.fen)).size, rows.length); return rows; }
function sourceWork(rows: readonly Position[]) {
  const service = new CandidatePopulationService({ capacity: GUIDED_HINT_PROFILE.packetCapacity });
  const results = rows.map(row => {
    assert(row.move !== null); const result = service.wide(row.fen);
    assert.equal(result.kind, "ready"); if (result.kind !== "ready") throw Error("Complete actual source unavailable");
    assertWide(result.receipt);
    const collected = collect(result.receipt, row.move);
    return { id: row.id, candidates: result.receipt.packet.candidates.length,
      families: collected.families.map(({ family, kind, events }) => ({ family, kind, events })) };
  });
  const stats = service.stats(); assert.equal(stats.misses, rows.length); assert.equal(stats.hits, 0);
  assert.equal(stats.retained, rows.length);
  return { rows: results, stats };
}
function assertBuild(profiled: boolean): void {
  assert.equal(Reflect.get(globalThis, BUILD_KEY) === true, profiled, "Ordinary/profiled build does not match the requested mode");
  assert(!Reflect.has(globalThis, TRACE_KEY), "A stale diagnostic owner is present");
}
function withTrace<T>(trace: StageTrace, work: () => T): T {
  assert(!Reflect.has(globalThis, TRACE_KEY)); Reflect.set(globalThis, TRACE_KEY, trace);
  try { return work(); } finally { Reflect.deleteProperty(globalThis, TRACE_KEY); }
}
async function profiledWork(rows: readonly Position[], work = () => sourceWork(rows), session = new Session()) {
  let connected = false;
  try {
    session.connect(); connected = true;
    await session.post("Profiler.enable"); await session.post("Profiler.setSamplingInterval", { interval: 1000 });
    await session.post("Profiler.start");
    const trace = new StageTrace(), start = performance.now();
    const result = withTrace(trace, () => trace.span("driver.source", work));
    const sourceMs = performance.now() - start;
    const { profile } = await session.post("Profiler.stop");
    // Bundle read/aggregation are outside the source interval and CPU profile.
    const cpu = summarizeCpu(profile, import.meta.url, readFileSync(fileURLToPath(import.meta.url), "utf8"));
    return { ...result, sourceMs, trace: trace.result(), cpu };
  } finally { if (connected) session.disconnect(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const smoke = process.argv.includes("--smoke"), profiled = process.argv.includes("--profiled");
  if (process.argv.includes("--failure-control")) {
    assertBuild(true); const session = new Session();
    await assert.rejects(profiledWork([], () => { throw new Error("controlled source-work failure"); }, session), /controlled source-work failure/);
    assert(!Reflect.has(globalThis, TRACE_KEY));
    await assert.rejects(session.post("Profiler.stop"), { code: "ERR_INSPECTOR_NOT_CONNECTED" });
    process.stdout.write("Actual CPU profiler/trace release on controlled source failure.\n");
  } else if (process.argv.includes("--equality-worker")) {
    assertBuild(profiled);
    const result = profiled ? withTrace(new StageTrace(), () => completeEquality(smoke)) : completeEquality(smoke);
    process.stdout.write(JSON.stringify(result));
  } else if (process.argv.includes("--cpu-worker")) {
    assertBuild(false); const result = await profiledWork(positions(smoke));
    assert.deepEqual(result.trace.stages.map(row => row.name), ["driver.source"], "Ordinary CPU sample unexpectedly contains source instrumentation");
    process.stdout.write(JSON.stringify(result));
  } else if (process.argv.includes("--timing-worker")) {
    assertBuild(profiled); const rows = positions(smoke);
    if (profiled) process.stdout.write(JSON.stringify(await profiledWork(rows)));
    else { const start = performance.now(), result = sourceWork(rows); process.stdout.write(JSON.stringify({ ...result, sourceMs: performance.now() - start })); }
  } else {
    type Equality = ReturnType<typeof completeEquality>;
    type Profiled = Awaited<ReturnType<typeof profiledWork>>;
    const run = <T>(name: "ordinary" | "profiled", mode: string): T => JSON.parse(execFileSync(process.execPath,
      [resolve(`.cache/d4224-acquisition-profile/${name}.mjs`), mode, ...(name === "profiled" ? ["--profiled"] : []), ...(smoke ? ["--smoke"] : [])],
      { encoding: "utf8", timeout: 60_000, maxBuffer: 256 * 1024 })) as T;
    const ordinaryEquality = run<Equality>("ordinary", "--equality-worker"), profiledEquality = run<Equality>("profiled", "--equality-worker");
    assert.equal(ordinaryEquality.length, smoke ? 2 : 32); assert.deepEqual(profiledEquality, ordinaryEquality);
    process.stderr.write(`Complete${ordinaryEquality.length}-decision graph/receipt equality with active counters passes.\n`);
    const ordinary = run<Pick<Profiled, "rows" | "stats" | "sourceMs">>("ordinary", "--timing-worker");
    const cpuOnly = run<Profiled>("ordinary", "--cpu-worker");
    const diagnostic = run<Profiled>("profiled", "--timing-worker");
    assert.deepEqual(cpuOnly.rows, ordinary.rows); assert.deepEqual(cpuOnly.stats, ordinary.stats);
    assert.deepEqual(diagnostic.rows, ordinary.rows); assert.deepEqual(diagnostic.stats, ordinary.stats);
    const calls = new Map(diagnostic.trace.stages.map(row => [row.name, row.calls]));
    assert.equal(calls.get("candidate-population.ts:compileInternal"), ordinary.rows.length);
    assert.equal(calls.get("candidate-population.ts:compileRow"), ordinary.rows.reduce((n, row) => n + row.candidates, 0));
    assert.equal(calls.get("semantic-evidence.ts:subjectOutcomeSemanticEvents"), ordinary.rows.length * 13);
    assert((calls.get("foundation-piece-lineage.ts:originalPiecePositions") ?? 0) > 0);
    assert(diagnostic.trace.stages.some(row => row.name.startsWith("reading.compute/") && row.calls > 0));
    const { rows: _ordinaryRows, ...ordinaryMetrics } = ordinary, { rows: _cpuRows, ...cpuMetrics } = cpuOnly,
      { rows: _diagnosticRows, ...diagnosticMetrics } = diagnostic;
    const report = { question: "D4224 current complete-source acquisition attribution", sourceCommit: "18f199ed", node: process.version,
      v8: process.versions.v8, platform: process.platform, architecture: process.arch,
      scope: "prepared fixed workload; separate active-counter complete graph/receipt equality; fresh ordinary and diagnostic workers; actual capacity64/all13 families; no source omission or production mutation",
      limits: ["diagnostic timing includes instrumentation/sampling overhead", "nested inclusive spans cannot be added", "self spans partition only instrumented call boundaries", "CPU samples are approximate, not exact function elapsed time", "one ordered ordinary/diagnostic observation, not a speed comparison", "no raw profile/payload dump", "not API/DOM latency or whole D4224/D4225 completion"],
      equality: ordinaryEquality, familyOrder: SUBJECT_OUTCOME_FAMILIES,
      decisions: ordinary.rows.map(row => ({ id: row.id, candidates: row.candidates,
        available: row.families.map(family => family.kind === "available"), events: row.families.map(family => family.events) })),
      ordinary: ordinaryMetrics, cpuOnly: cpuMetrics, diagnostic: diagnosticMetrics };
    const text = JSON.stringify(report, null, 2) + "\n"; assert(Buffer.byteLength(text) < 64 * 1024, "Refuse raw/oversized diagnostic output");
    if (process.argv.includes("--write")) writeFileSync("planning/foundation-source-identity/acquisition-profile-2026-11-11.json", text);
    else process.stdout.write(text);
  }
}
