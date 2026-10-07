// DISPOSABLE D3262 memory custody/reading controls. Synthetic ps rows are not measurements.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { admitMemoryTarget, checkMemoryJournal, parseProcessTable, scope,
  selectMemorySample, summarizeMemorySamples } from "./cost-process-memory.mjs";

const sha = value => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const executableDigest = sha("native fixture");
const config = { executableDigest, args: [], threads: 1, hashMb: 16, chess960: false, clearHashPerQuery: true };
const metadata = { question: "D3262", start: 0, limit: 3, expectedCases: 61374,
  cases: Array.from({ length: 3 }, () => ({ setting: "engine:depth12:top8" })),
  memoryScope: "parent_process_sampled_rss_lower_bound_not_engine_or_model_peak",
  planDigest: sha("plan"), provider: { requested: true, threads: 1, hashMb: 16,
    clearHashPerQuery: true, sourceDigest: sha(JSON.stringify(config)) } };
const input = { metadata, metadataDigest: sha(JSON.stringify(metadata)), batchArgument: ".cache/fixture",
  pid: 10, executable: "/fixture/stockfish", executableDigest, observerDigest: sha("observer"), nodeExecutable: "/fixture/node" };
const rootCommand = "/fixture/node tools/d3262-search-calibration/cost-batch.mjs --start 0 --limit 3 --out .cache/fixture";
const literal = (root = 100, source = 200) => `  10  1 Wed Oct  7 04:09:22 2026 ${root} ${rootCommand}\n  11 10 Wed Oct  7 04:09:23 2026 ${source} /fixture/stockfish\n`;
const processes = parseProcessTable(literal());
const target = admitMemoryTarget(input, processes);
const sample = (root, source, time = 0) => ({ capturedAt: "2026-10-07T03:40:00.000Z",
  clock: { started: time, ended: time + 1 }, result: selectMemorySample(target, parseProcessTable(literal(root, source))),
  literalRows: literal(root, source).trim().split("\n") });
function journal(samples = [sample(100, 200), sample(300, 100, 2)], changedTarget = target) {
  let previous = null;
  return [ { type: "header", target: changedTarget, metadataLiteral: JSON.stringify(metadata), observerSource: "observer",
    nodeExecutable: input.nodeExecutable, requestedSamples: samples.length, intervalMs: 2000 },
    ...samples.map(sample => ({ type: "sample", sample })),
    { type: "finished", stopReason: "sample_limit", summary: summarizeMemorySamples(samples) },
  ].map(frame => {
    const body = { ...frame, previous }; const digest = sha(JSON.stringify(body)); previous = digest;
    return JSON.stringify({ ...body, digest });
  }).join("\n") + "\n";
}

test("attaches to the exact original engine batch and one direct native child", () => {
  assert.equal(target.scope, scope); assert.equal(target.source.pid, 11);
  assert.deepEqual(selectMemorySample(target, processes), { kind: "sampled", rootRssKiB: 100, sourceRssKiB: 200 });
});
test("retains individual maxima and same-probe sums, never sums independent maxima", () => {
  const summary = summarizeMemorySamples([sample(100, 200), sample(300, 100, 2)]);
  assert.equal(summary.maxRootRssKiB, 300); assert.equal(summary.maxSourceRssKiB, 200);
  assert.equal(summary.maxSameProbeRssSumKiB, 400); assert.notEqual(summary.maxSameProbeRssSumKiB, 500);
});
test("whole journal reconstructs samples from the native rows and preserves partial scope", () => {
  assert.equal(checkMemoryJournal(journal()).summary.samples, 2);
  assert.equal(checkMemoryJournal(journal()).target.wholeBatchPeakMeasured, false);
});
test("missing child or ended parent remains unavailable, never zero memory", () => {
  assert.deepEqual(selectMemorySample(target, []), { kind: "unavailable", reason: "root_absent" });
  assert.deepEqual(selectMemorySample(target, processes.slice(0, 1)), { kind: "unavailable", reason: "source_absent" });
  const values = [{ capturedAt: "2026-10-07T03:40:00Z", clock: { started: 0, ended: 1 },
    result: { kind: "unavailable", reason: "probe_failed" }, literalRows: [] }];
  const summary = summarizeMemorySamples(values);
  assert.equal(summary.sampled, 0); assert.equal(summary.maxSourceRssKiB, null);
  assert.throws(() => checkMemoryJournal(journal(values)), "cannot claim attachment with no initial native sample");
  assert.equal(checkMemoryJournal(journal([sample(100, 200), { ...values[0], clock: { started: 2, ended: 3 } }])).summary.unavailable, 1);
});
for (const field of ["pid", "ppid", "started", "command"]) {
  for (const index of [0, 1]) test(`refuses ${index === 0 ? "root" : "source"} changed ${field} / PID reuse`, () => {
    const changed = structuredClone(processes);
    changed[index][field] = typeof changed[index][field] === "number" ? changed[index][field] + 1 : "changed";
    if (field === "pid") {
      // A vanished expected PID is unavailable; a reused *same* PID with new birth/command fails.
      assert.equal(selectMemorySample(target, changed).kind, "unavailable");
    } else assert.throws(() => selectMemorySample(target, changed));
  });
}
for (const row of [
  { pid: 12, ppid: 10, started: "Wed Oct 7 04:09:25 2026", rssKiB: 400, command: "other child" },
  { pid: 12, ppid: 11, started: "Wed Oct 7 04:09:25 2026", rssKiB: 400, command: "unmeasured descendant" },
]) test(`refuses expanded source scope: ${row.command}`, () => {
  assert.throws(() => admitMemoryTarget(input, [...processes, row]));
  assert.throws(() => selectMemorySample(target, [...processes, row]));
});
for (const mutation of [
  { command: rootCommand.replace("--limit 3", "--limit 6") },
  { command: rootCommand.replace(".cache/fixture", ".cache/other") },
  { command: rootCommand.replace("--start 0", "--start 3") },
]) test(`refuses crossed batch command: ${mutation.command}`, () => {
  assert.throws(() => admitMemoryTarget(input, [{ ...processes[0], ...mutation }, processes[1]]));
});
for (const field of ["threads", "hashMb", "clearHashPerQuery", "sourceDigest"]) test(`refuses provider configuration/binary drift: ${field}`, () => {
  const changed = structuredClone(input);
  changed.metadata.provider[field] = field === "sourceDigest" ? sha("other") : field === "clearHashPerQuery" ? false : 2;
  assert.throws(() => admitMemoryTarget(changed, processes));
});
test("rejects mixed/source-free batches, missing children and duplicate PIDs", () => {
  const changed = structuredClone(input); changed.metadata.cases[1].setting = "maia:prefix0.90";
  assert.throws(() => admitMemoryTarget(changed, processes));
  assert.throws(() => admitMemoryTarget(input, processes.slice(0, 1)));
  assert.throws(() => parseProcessTable(literal() + literal()));
});
for (const output of ["not a row", "1 2 invalid-date 100 command", literal().replace("100", "-1")]) test(`refuses malformed native output: ${output.slice(0, 32)}`, () => {
  assert.throws(() => parseProcessTable(output));
});
for (const field of ["wholeBatchPeakMeasured", "startupObserved", "physicalOrUniqueRamMeasured", "maiaOrContainerMemoryMeasured", "perCaseAttribution"]) test(`even resealed journals cannot promote ${field}`, () => {
  assert.throws(() => checkMemoryJournal(journal(undefined, { ...target, [field]: field === "perCaseAttribution" ? "cold_case_peak" : true })));
});
test("rejects retained-row/count mismatches even when journal is resealed", () => {
  const changed = sample(100, 200); changed.result.sourceRssKiB = 900;
  assert.throws(() => checkMemoryJournal(journal([changed])));
});
test("resealed target labels cannot borrow another setting, metadata, binary or ancestry", () => {
  for (const patch of [{ setting: "engine:depth8:top2" }, { planDigest: sha("other plan") },
    { sourceDigest: sha("other provider") }, { executableDigest: sha("other binary") },
    { metadataDigest: sha("other metadata") }, { observerDigest: sha("other observer") },
    { source: { ...target.source, ppid: 999 } }, { extra: "new scope" }]) {
    assert.throws(() => checkMemoryJournal(journal(undefined, { ...target, ...patch })));
  }
});
test("ordinary bare-node Make invocation retains the exact rest of the command", () => {
  const root = { ...processes[0], command: rootCommand.replace("/fixture/node ", "node ") };
  assert.equal(admitMemoryTarget(input, [root, processes[1]]).root.command, root.command);
});
test("rejects changes, reordering, truncation and a missing finished frame", () => {
  const source = journal();
  assert.throws(() => checkMemoryJournal(source.replace('"sourceRssKiB":200', '"sourceRssKiB":201')));
  assert.throws(() => checkMemoryJournal(source.split("\n").slice(0, -2).join("\n") + "\n"));
  assert.throws(() => checkMemoryJournal(source.slice(0, -1)));
  const lines = source.trim().split("\n"); [lines[1], lines[2]] = [lines[2], lines[1]];
  assert.throws(() => checkMemoryJournal(lines.join("\n") + "\n"));
});
test("negative, non-finite, reversed or overlapping sample clocks cannot pass", () => {
  for (const clock of [{ started: -1, ended: 1 }, { started: 2, ended: 1 }, { started: Infinity, ended: Infinity }]) {
    assert.throws(() => summarizeMemorySamples([{ ...sample(100, 200), clock }]));
  }
  assert.throws(() => summarizeMemorySamples([sample(100, 200), sample(100, 200, 0)]));
  assert.throws(() => summarizeMemorySamples([{ ...sample(100, 200), result: { kind: "sampled", rootRssKiB: -1, sourceRssKiB: 100 } }]));
  assert.throws(() => summarizeMemorySamples([]));
});
