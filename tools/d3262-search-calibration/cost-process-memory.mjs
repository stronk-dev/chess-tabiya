// DISPOSABLE D3262 observer. Attaches without modifying the cost executor or its receipts.
// ps RSS is a sampled process-resident lower bound, NOT physical/unique RAM or an unsampled peak.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, openSync, readFileSync, realpathSync, writeSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sha = value => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const check = (value, message) => { if (!value) throw new TypeError(`D3262_MEMORY: ${message}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nat = value => Number.isSafeInteger(value) && value >= 0;
const exact = (value, fields) => check(value && typeof value === "object" && !Array.isArray(value)
  && same(Object.keys(value).sort(), [...fields].sort()), "unexpected fields");
export const scope = "attached_live_stockfish_root_and_direct_source_partial_window";

/** Parses native ps output; only the admitted two rows are ever retained. */
export function parseProcessTable(text) {
  check(typeof text === "string", "process output must be text");
  const rows = text.trim() === "" ? [] : text.trim().split("\n").map(line => {
    const match = /^\s*(\d+)\s+(\d+)\s+([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(\d+)\s+(.+)$/u.exec(line);
    check(match, "malformed ps row");
    const row = { pid: Number(match[1]), ppid: Number(match[2]),
      started: match[3].replace(/\s+/gu, " "), rssKiB: Number(match[4]), command: match[5] };
    check(nat(row.pid) && row.pid > 0 && nat(row.ppid) && nat(row.rssKiB), "invalid process values");
    return row;
  });
  check(new Set(rows.map(row => row.pid)).size === rows.length, "duplicate process id");
  return rows;
}
const identity = ({ pid, ppid, started, command }) => ({ pid, ppid, started, command });

export function admitMemoryTarget({ metadata, metadataDigest, batchArgument, pid, executable,
  executableDigest, observerDigest, nodeExecutable }, processes) {
  check(nat(pid) && pid > 0 && /^sha256:[a-f0-9]{64}$/u.test(metadataDigest)
    && /^sha256:[a-f0-9]{64}$/u.test(executableDigest) && /^sha256:[a-f0-9]{64}$/u.test(observerDigest), "missing source identity");
  check(metadata.question === "D3262" && nat(metadata.start) && nat(metadata.limit) && metadata.limit > 0
    && metadata.limit % 3 === 0 && metadata.start % 3 === 0
    && metadata.expectedCases === 61374 && Array.isArray(metadata.cases)
    && metadata.cases.length === metadata.limit && new Set(metadata.cases.map(row => row.setting)).size === 1
    && metadata.cases.every(row => row.setting.startsWith("engine:")), "not one frozen engine batch");
  check(metadata.memoryScope === "parent_process_sampled_rss_lower_bound_not_engine_or_model_peak"
    && metadata.provider.requested === true && metadata.provider.threads === 1
    && metadata.provider.hashMb === 16 && metadata.provider.clearHashPerQuery === true
    && metadata.provider.sourceDigest === sha(JSON.stringify({ executableDigest, args: [], threads: 1,
      hashMb: 16, chess960: false, clearHashPerQuery: true })), "different provider configuration/binary");
  const root = processes.find(row => row.pid === pid);
  check(root, "target process absent at attachment");
  const command = [nodeExecutable, "tools/d3262-search-calibration/cost-batch.mjs", "--start", metadata.start,
    "--limit", metadata.limit, "--out", batchArgument].join(" ");
  check(root.command === command || root.command === ["node", ...command.split(" ").slice(1)].join(" "), "target command differs from original batch");
  const children = processes.filter(row => row.ppid === pid);
  check(children.length === 1 && children[0].command === executable, "not one direct native source");
  const source = children[0];
  check(!processes.some(row => row.ppid === source.pid), "native source has unmeasured descendants");
  return { schemaVersion: 1, question: "D3262", scope, metadataDigest, planDigest: metadata.planDigest,
    batchArgument, batchStart: metadata.start, batchLimit: metadata.limit, setting: metadata.cases[0].setting,
    sourceDigest: metadata.provider.sourceDigest, executableDigest, observerDigest,
    root: identity(root), source: identity(source), unit: "ps_rss_1024_bytes",
    wholeBatchPeakMeasured: false, startupObserved: false, perCaseAttribution: "not_measured",
    physicalOrUniqueRamMeasured: false, maiaOrContainerMemoryMeasured: false };
}

export function selectMemorySample(target, processes) {
  const root = processes.find(row => row.pid === target.root.pid);
  if (!root) return { kind: "unavailable", reason: "root_absent" };
  check(same(identity(root), target.root), "root PID reused or reparented");
  const source = processes.find(row => row.pid === target.source.pid);
  if (!source) return { kind: "unavailable", reason: "source_absent" };
  check(same(identity(source), target.source), "source PID reused or reparented");
  const children = processes.filter(row => row.ppid === root.pid);
  check(children.length === 1 && children[0].pid === source.pid
    && !processes.some(row => row.ppid === source.pid), "process scope expanded");
  return { kind: "sampled", rootRssKiB: root.rssKiB, sourceRssKiB: source.rssKiB };
}

export function summarizeMemorySamples(samples) {
  check(Array.isArray(samples) && samples.length > 0, "empty observation window");
  let previous = -1;
  for (const sample of samples) {
    exact(sample, ["capturedAt", "clock", "result", "literalRows"]);
    check(typeof sample.capturedAt === "string" && Number.isFinite(Date.parse(sample.capturedAt)), "invalid date");
    exact(sample.clock, ["started", "ended"]);
    check(Number.isFinite(sample.clock.started) && sample.clock.started >= 0 && sample.clock.started >= previous
      && Number.isFinite(sample.clock.ended) && sample.clock.ended >= sample.clock.started, "crossed observation clocks");
    previous = sample.clock.ended;
    check(Array.isArray(sample.literalRows) && sample.literalRows.every(row => typeof row === "string"), "missing literal rows");
    if (sample.result.kind === "sampled") {
      exact(sample.result, ["kind", "rootRssKiB", "sourceRssKiB"]);
      check(nat(sample.result.rootRssKiB) && nat(sample.result.sourceRssKiB), "invalid sampled memory");
    } else {
      exact(sample.result, ["kind", "reason"]);
      check(sample.result.kind === "unavailable" && ["root_absent", "source_absent", "probe_failed"].includes(sample.result.reason), "unknown unavailable scope");
    }
  }
  const measured = samples.filter(sample => sample.result.kind === "sampled");
  return { samples: samples.length, sampled: measured.length, unavailable: samples.length - measured.length,
    maxRootRssKiB: measured.length ? Math.max(...measured.map(sample => sample.result.rootRssKiB)) : null,
    maxSourceRssKiB: measured.length ? Math.max(...measured.map(sample => sample.result.sourceRssKiB)) : null,
    // This is a reported RSS sum in one ps invocation, NOT a unique physical or atomic peak.
    maxSameProbeRssSumKiB: measured.length ? Math.max(...measured.map(sample => sample.result.rootRssKiB + sample.result.sourceRssKiB)) : null,
    authority: "external_sampled_process_rss_lower_bounds_not_case_or_physical_peaks" };
}

function readProbe(pid, sourcePid) {
  const started = performance.now();
  const literal = execFileSync("/bin/ps", ["-axo", "pid=,ppid=,lstart=,rss=,command="],
    { encoding: "utf8", timeout: 3000, maxBuffer: 16 * 1024 * 1024 });
  const lines = literal.split("\n");
  const children = new Set(lines.flatMap(line => {
    const prefix = /^\s*(\d+)\s+(\d+)\s/u.exec(line);
    return prefix && Number(prefix[2]) === pid ? [Number(prefix[1])] : [];
  }));
  const scoped = lines.filter(line => {
    const prefix = /^\s*(\d+)\s+(\d+)\s/u.exec(line);
    return prefix && (Number(prefix[1]) === pid || Number(prefix[1]) === sourcePid
      || Number(prefix[2]) === pid || Number(prefix[2]) === sourcePid || children.has(Number(prefix[2])));
  }).join("\n");
  return { started, ended: performance.now(), literal: scoped, processes: parseProcessTable(scoped) };
}
function retainedRows(probe, target) {
  // Preserve native rows for those exact PIDs, never unrelated process commands.
  return probe.literal.trim().split("\n").filter(line => {
    const pid = Number(/^\s*(\d+)/u.exec(line)?.[1]);
    return pid === target.root.pid || pid === target.source.pid;
  });
}
function appendFrame(fd, frame, previous) {
  const body = { ...frame, previous };
  const digest = sha(JSON.stringify(body));
  writeSync(fd, `${JSON.stringify({ ...body, digest })}\n`);
  return digest;
}
export function checkMemoryJournal(text) {
  check(text.endsWith("\n"), "truncated journal");
  const frames = text.trim().split("\n").map(line => JSON.parse(line));
  let previous = null;
  for (const frame of frames) {
    const { digest, ...body } = frame;
    check(body.previous === previous && digest === sha(JSON.stringify(body)), "changed journal chain");
    previous = digest;
  }
  check(frames[0]?.type === "header" && frames.at(-1)?.type === "finished"
    && frames.slice(1, -1).every(frame => frame.type === "sample"), "unfinished or reordered journal");
  const target = frames[0].target;
  exact(frames[0], ["type", "target", "metadataLiteral", "observerSource", "nodeExecutable", "requestedSamples", "intervalMs", "previous", "digest"]);
  exact(frames.at(-1), ["type", "stopReason", "summary", "previous", "digest"]);
  exact(target, ["schemaVersion", "question", "scope", "metadataDigest", "planDigest", "batchArgument", "batchStart",
    "batchLimit", "setting", "sourceDigest", "executableDigest", "observerDigest", "root", "source", "unit",
    "wholeBatchPeakMeasured", "startupObserved", "perCaseAttribution", "physicalOrUniqueRamMeasured", "maiaOrContainerMemoryMeasured"]);
  check(target.schemaVersion === 1 && target.question === "D3262" && target.unit === "ps_rss_1024_bytes"
    && nat(target.batchStart) && target.batchStart % 3 === 0 && nat(target.batchLimit) && target.batchLimit > 0
    && target.batchLimit % 3 === 0 && /^engine:(depth8|depth12|movetime100):top(2|4|8)$/u.test(target.setting), "invalid batch scope");
  for (const key of ["metadataDigest", "planDigest", "sourceDigest", "executableDigest", "observerDigest"]) check(/^sha256:[a-f0-9]{64}$/u.test(target[key]), "invalid scope digest");
  for (const process of [target.root, target.source]) {
    exact(process, ["pid", "ppid", "started", "command"]);
    check(nat(process.pid) && process.pid > 0 && nat(process.ppid) && typeof process.started === "string"
      && typeof process.command === "string" && process.command.length > 0, "invalid process identity");
  }
  check(target.root.pid !== target.source.pid && target.source.ppid === target.root.pid, "crossed process ancestry");
  check(target.scope === scope && target.wholeBatchPeakMeasured === false && target.startupObserved === false
    && target.physicalOrUniqueRamMeasured === false && target.maiaOrContainerMemoryMeasured === false
    && target.perCaseAttribution === "not_measured", "promoted partial scope");
  const samples = frames.slice(1, -1).map(frame => frame.sample);
  for (const frame of frames.slice(1, -1)) exact(frame, ["type", "sample", "previous", "digest"]);
  check(typeof frames[0].metadataLiteral === "string" && sha(frames[0].metadataLiteral) === target.metadataDigest
    && typeof frames[0].observerSource === "string" && sha(frames[0].observerSource) === target.observerDigest
    && typeof frames[0].nodeExecutable === "string" && samples[0]?.result.kind === "sampled", "missing original attachment sources");
  const reconstructed = admitMemoryTarget({ metadata: JSON.parse(frames[0].metadataLiteral), metadataDigest: target.metadataDigest,
    batchArgument: target.batchArgument, pid: target.root.pid, executable: target.source.command,
    executableDigest: target.executableDigest, observerDigest: target.observerDigest,
    nodeExecutable: frames[0].nodeExecutable }, parseProcessTable(samples[0].literalRows.join("\n")));
  check(same(reconstructed, target), "target does not match original metadata/attachment");
  for (const sample of samples) {
    if (sample.result.reason === "probe_failed") { check(sample.literalRows.length === 0, "invented failed probe"); continue; }
    check(same(selectMemorySample(target, parseProcessTable(sample.literalRows.join("\n"))), sample.result), "sample does not reproduce native rows");
  }
  const summary = summarizeMemorySamples(samples);
  check(same(frames.at(-1).summary, summary), "changed summary");
  check(["sample_limit", "root_absent", "source_absent"].includes(frames.at(-1).stopReason), "unknown stop");
  check(nat(frames[0].requestedSamples) && frames[0].requestedSamples > 0 && nat(frames[0].intervalMs)
    && frames[0].intervalMs >= 100 && samples.length <= frames[0].requestedSamples, "changed requested window");
  if (frames.at(-1).stopReason === "sample_limit") check(samples.length === frames[0].requestedSamples, "incomplete requested sample count");
  else check(samples.at(-1)?.result.reason === frames.at(-1).stopReason, "false terminal observation");
  return { target, summary, stopReason: frames.at(-1).stopReason, digest: previous };
}

export async function observeMemory({ pid, batch, executable, out, samples, intervalMs }) {
  check(["darwin", "linux"].includes(process.platform), "native ps platform not supported");
  check(nat(samples) && samples > 0 && nat(intervalMs) && intervalMs >= 100, "invalid sampling window");
  const metadataBytes = readFileSync(resolve(batch, "metadata.json"));
  const observerSource = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const probe = readProbe(pid); // Permission/attachment failures create no misleading empty journal.
  const nodeCommand = probe.processes.find(row => row.pid === pid)?.command.split(" ")[0];
  check(nodeCommand && (nodeCommand === "node" || realpathSync(nodeCommand) === realpathSync(process.execPath)), "different Node executable");
  const target = admitMemoryTarget({ metadata: JSON.parse(metadataBytes), metadataDigest: sha(metadataBytes),
    batchArgument: batch, pid, executable, executableDigest: sha(readFileSync(executable)),
    observerDigest: sha(observerSource), nodeExecutable: nodeCommand }, probe.processes);
  const fd = openSync(out, "wx"); let previous = null, stopReason = "sample_limit";
  const observations = [];
  try {
    previous = appendFrame(fd, { type: "header", target, metadataLiteral: metadataBytes.toString("utf8"), observerSource,
      nodeExecutable: nodeCommand, requestedSamples: samples, intervalMs }, previous);
    for (let index = 0; index < samples; index++) {
      let next;
      try { next = index === 0 ? probe : readProbe(pid, target.source.pid); }
      catch { next = null; }
      const sample = next ? { capturedAt: new Date().toISOString(), clock: { started: next.started, ended: next.ended },
        result: selectMemorySample(target, next.processes), literalRows: retainedRows(next, target) }
        : { capturedAt: new Date().toISOString(), clock: { started: performance.now(), ended: performance.now() },
          result: { kind: "unavailable", reason: "probe_failed" }, literalRows: [] };
      observations.push(sample); previous = appendFrame(fd, { type: "sample", sample }, previous);
      if (["root_absent", "source_absent"].includes(sample.result.reason)) { stopReason = sample.result.reason; break; }
      if (index + 1 < samples) await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    const summary = summarizeMemorySamples(observations);
    appendFrame(fd, { type: "finished", stopReason, summary }, previous);
    return summary;
  } finally { closeSync(fd); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), allowed = ["--check", "--pid", "--batch", "--executable", "--out", "--samples", "--interval-ms"];
  check(args.length % 2 === 0 && args.every((arg, i) => i % 2 === 1 || allowed.includes(arg))
    && new Set(args.filter((_, i) => i % 2 === 0)).size === args.length / 2, "unknown/duplicate arguments");
  const value = key => args[args.indexOf(key) + 1];
  const result = args.includes("--check") ? checkMemoryJournal(readFileSync(value("--check"), "utf8"))
    : await observeMemory({ pid: Number(value("--pid")), batch: value("--batch"), executable: value("--executable"),
      out: value("--out"), samples: Number(value("--samples")), intervalMs: Number(value("--interval-ms")) });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
