// Disposable D3512 source-isolation instrument. Never imported by production.
import { readFileSync, writeFileSync } from "node:fs";
import { CostStockfish, SourceFailure, position } from "./cost-stockfish.mjs";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { executeCostCase } from "./cost-execution.mjs";
import { checkRawCapture } from "./cost-batch.mjs";
import { caseIdentity, queryIdentity, sha } from "./cost-contract.mjs";

const check = (value, reason) => { if (!value) throw new Error(`D3512_ISOLATION: ${reason}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const digest = value => /^sha256:[a-f0-9]{64}$/u.test(value);
const interval = (start, end) => Number.isFinite(start) && start >= 0 && Number.isFinite(end) && end >= start;
const exact = (value, keys, reason) => check(value && typeof value === "object" && !Array.isArray(value)
  && same(Object.keys(value).sort(), [...keys].sort()), reason);

export function isolationSourceDigest(command, args = []) {
  return sha(JSON.stringify({ executableDigest: sha(readFileSync(command)), args,
    threads: 1, hashMb: 16, chess960: false, clearHashPerQuery: true }));
}

/** One attempt, one process. Failed dependencies remain inside the failed case. */
export async function executeIsolatedTriplet({ cell, setting, subject, planDigest,
  command, args = [], timeoutMs = 60_000, expectedSourceDigest }) {
  check(cell.regime === "cold" && setting.id === cell.setting, "cold case/setting required");
  check(digest(expectedSourceDigest) && isolationSourceDigest(command, args) === expectedSourceDigest,
    "binary/configuration differs before process startup");
  const trace = { version: 1, authority: "disposable_case_isolation_not_independent_latency_or_production_recovery",
    cell, sourceDigest: expectedSourceDigest, pid: null, timeoutMs,
    startup: null, clock: null, commands: [], failures: [], queries: [], exit: null };
  const started = performance.now();
  const source = new CostStockfish(command, { args, timeoutMs });
  trace.pid = source.child.pid;
  const send = source.send.bind(source), fail = source.fail.bind(source);
  source.send = line => { send(line); trace.commands.push({ at: performance.now(), line }); };
  source.fail = error => {
    trace.failures.push({ at: performance.now(), state: error.state, message: error.message });
    fail(error);
  };
  let startupFailure = null, cold, startupEnded, teardownStarted, closed;
  try {
    try {
      await source.initialize();
      trace.startup = { kind: "ready", engineName: source.engineName, failure: null };
    } catch (error) {
      if (!(error instanceof SourceFailure)) throw error;
      startupFailure = error;
      trace.startup = { kind: "failed", engineName: source.engineName ?? null,
        failure: { state: error.state, message: error.message } };
    }
    startupEnded = performance.now();
    const adapter = { sourceDigest: source.sourceDigest, async execute(operands) {
      const query = { identity: queryIdentity(operands), started: performance.now(), ended: null,
        commandStart: trace.commands.length, commandEnd: null,
        inheritedTerminal: startupFailure !== null || source.failure !== null,
        searchCommandWritten: false, state: null, failure: null, receiptDigest: null };
      try {
        // Readiness failure is not a search-timeout observation.
        if (startupFailure) throw new SourceFailure("unavailable",
          `source readiness failed: ${startupFailure.state}: ${startupFailure.message}`);
        const receipt = await source.execute(operands);
        query.state = "executed"; query.receiptDigest = sha(JSON.stringify(receipt));
        return receipt;
      } catch (error) {
        if (!(error instanceof SourceFailure)) throw error;
        query.state = error.state; query.failure = error.message;
        throw error;
      } finally {
        query.commandEnd = trace.commands.length;
        query.searchCommandWritten = trace.commands.slice(query.commandStart, query.commandEnd)
          .some(command => command.line.startsWith("go "));
        query.ended = performance.now(); trace.queries.push(query);
      }
    } };
    cold = await executeCostCase({ cell, setting, subject, planDigest, adapter });
  } finally {
    teardownStarted = performance.now();
    await source.close();
    closed = performance.now();
  }
  trace.clock = { started, startupEnded, coldStarted: cold.raw.clock.started,
    coldEnded: cold.raw.clock.ended, teardownStarted, closed };
  trace.exit = { code: source.child.exitCode, signal: source.child.signalCode };
  const noFreshSource = { sourceDigest: source.sourceDigest, async execute() {
    throw new Error("D3512_ISOLATION: fresh execution after cold source teardown");
  } };
  const warm = await executeCostCase({ cell: { ...cell, regime: "warm" }, setting, subject,
    planDigest, adapter: noFreshSource, initialCache: cold.cache });
  const offline = await executeCostCase({ cell: { ...cell, regime: "provider_offline" },
    setting, subject, planDigest, adapter: noFreshSource });
  const record = { version: 1, authority: "separate_source_isolated_successor_not_original_replacement",
    trace, records: [cold, warm, offline].map(({ row, raw }) => ({ row, raw })) };
  verifyIsolatedTriplet(record);
  return record;
}

/** Structural custody/interval checks, not an independent clock or subprocess observer. */
export function verifyIsolatedTriplet(value) {
  exact(value, ["version", "authority", "trace", "records"], "successor envelope fields");
  check(value.version === 1 && value.authority === "separate_source_isolated_successor_not_original_replacement",
    "successor envelope identity");
  const { trace: t, records } = value;
  exact(t, ["version", "authority", "cell", "sourceDigest", "pid", "timeoutMs", "startup", "clock",
    "commands", "failures", "queries", "exit"], "lifecycle fields");
  check(t.version === 1 && t.authority === "disposable_case_isolation_not_independent_latency_or_production_recovery"
    && digest(t.sourceDigest) && Number.isSafeInteger(t.pid) && t.pid > 0
    && Number.isSafeInteger(t.timeoutMs) && t.timeoutMs > 0, "lifecycle source identity");
  check(Array.isArray(records) && records.length === 3, "whole successor triplet required");
  const [cold, warm, offline] = records;
  check(t.cell.regime === "cold" && same(t.cell, cold.raw.cell), "crossed lifecycle case");
  for (const [i, regime] of ["cold", "warm", "provider_offline"].entries()) {
    const r = records[i];
    check(same(r.raw.cell, { ...t.cell, regime }) && caseIdentity(r.row) === caseIdentity(r.raw.cell),
      "crossed triplet case/regime");
    check(r.row.planDigest === cold.row.planDigest, "crossed plan identity");
    check(["available", "honest_empty", "no_target", "source_unavailable", "budget_exhausted",
      "invalid_source", "absorbing_terminal"].includes(r.row.kind), "unknown result state");
    checkRawCapture(r);
    check(r.raw.dependencies.every(d => d.operands.sourceDigest === t.sourceDigest), "crossed dependency source");
    check(r.row.providerQueries.every(q => ["executed", "cached", "unavailable", "invalid", "timed_out"].includes(q.state)
      && interval(0, q.elapsedMs) && q.elapsedMs <= r.row.timing.elapsedMs), "unknown query state/interval");
    check(r.row.cacheHits === r.row.providerQueries.filter(q => q.state === "cached").length,
      "cache-hit count differs from dependencies");
    check(r.row.memory.observation === "sampled_rss_lower_bound" && Number.isSafeInteger(r.row.memory.peakRssBytes)
      && r.row.memory.peakRssBytes >= 0, "invented memory scope");
    check(["sourceMs", "collectionMs", "compileMs"].every(k => interval(0, r.row.timing[k])
      && r.row.timing[k] <= r.row.timing.elapsedMs), "phase interval outside operation");
    if (["available", "honest_empty"].includes(r.row.kind)) check(r.row.providerQueries.length > 0
      && r.row.providerQueries.every(q => ["executed", "cached"].includes(q.state)), "vacuous/failed available source");
  }
  exact(t.clock, ["started", "startupEnded", "coldStarted", "coldEnded", "teardownStarted", "closed"],
    "startup/case/teardown intervals required");
  const times = ["started", "startupEnded", "coldStarted", "coldEnded", "teardownStarted", "closed"].map(k => t.clock[k]);
  check(times.every((v, i) => interval(i ? times[i - 1] : 0, v)), "unordered lifecycle interval");
  check(t.clock.coldStarted === cold.raw.clock.started && t.clock.coldEnded === cold.raw.clock.ended,
    "lifecycle clock differs from original operation");
  check(warm.raw.clock.started >= t.clock.closed && offline.raw.clock.started >= warm.raw.clock.ended,
    "warm/offline precede teardown or overlap");
  exact(t.exit, ["code", "signal"], "exit observation required");
  check(Number.isInteger(t.exit.code) && t.exit.code >= 0 && t.exit.code <= 255
    || typeof t.exit.signal === "string" && /^SIG[A-Z0-9]+$/u.test(t.exit.signal), "unclosed cold process");
  exact(t.startup, ["kind", "engineName", "failure"], "startup observation required");
  check(["ready", "failed"].includes(t.startup.kind), "startup state");
  if (t.startup.kind === "ready") check(typeof t.startup.engineName === "string" && t.startup.engineName.length
    && t.startup.failure === null, "false readiness");
  else {
    exact(t.startup.failure, ["state", "message"], "startup failure observation");
    check(["unavailable", "timed_out", "invalid"].includes(t.startup.failure.state)
      && typeof t.startup.failure.message === "string", "startup failure type");
  }
  check(Array.isArray(t.commands) && Array.isArray(t.failures) && Array.isArray(t.queries), "lifecycle lists required");
  t.commands.forEach((command, i) => {
    exact(command, ["at", "line"], "command fields");
    check(typeof command.line === "string" && !command.line.includes("\n")
      && interval(i ? t.commands[i - 1].at : t.clock.started, command.at)
      && command.at <= t.clock.coldEnded, "command outside source operation");
  });
  t.failures.forEach((failure, i) => {
    exact(failure, ["at", "state", "message"], "fatal event fields");
    check(["unavailable", "timed_out", "invalid"].includes(failure.state) && typeof failure.message === "string"
      && interval(i ? t.failures[i - 1].at : t.clock.started, failure.at)
      && failure.at <= t.clock.closed, "fatal event outside lifecycle");
  });
  check(t.queries.length === cold.raw.dependencies.length, "query execution/dependency census differs");
  let commandCursor = t.commands.filter(c => c.at <= t.clock.startupEnded).length;
  const startupCommands = ["uci", "setoption name Threads value 1", "setoption name Hash value 16",
    "setoption name UCI_Chess960 value false", "isready"];
  check(commandCursor <= startupCommands.length
    && same(t.commands.slice(0, commandCursor).map(c => c.line), startupCommands.slice(0, commandCursor)),
    "changed startup/configuration commands");
  if (t.startup.kind === "ready") check(commandCursor === startupCommands.length, "readiness without full configuration");
  for (const [i, q] of t.queries.entries()) {
    exact(q, ["identity", "started", "ended", "commandStart", "commandEnd", "inheritedTerminal",
      "searchCommandWritten", "state", "failure", "receiptDigest"], "query lifecycle fields");
    const dependency = cold.raw.dependencies[i], ledger = cold.row.providerQueries[i];
    check(["executed", "unavailable", "invalid", "timed_out"].includes(q.state)
      && (q.state === "executed" ? q.failure === null && digest(q.receiptDigest)
        : typeof q.failure === "string" && q.receiptDigest === null), "unknown cold query state/failure");
    check(q.identity === queryIdentity(dependency.operands) && q.state === dependency.state
      && q.failure === dependency.failure && q.receiptDigest === ledger.receiptDigest, "crossed query/source outcome");
    check(interval(i ? t.queries[i - 1].ended : t.clock.coldStarted, q.started)
      && interval(q.started, q.ended) && q.ended <= t.clock.coldEnded, "query interval outside cold case");
    check(Number.isSafeInteger(q.commandStart) && q.commandStart === commandCursor
      && Number.isSafeInteger(q.commandEnd) && q.commandEnd >= q.commandStart
      && q.commandEnd <= t.commands.length, "missing/reused command range");
    const commands = t.commands.slice(q.commandStart, q.commandEnd);
    check(commands.every(c => c.at >= q.started && c.at <= q.ended), "crossed query command interval");
    const operands = dependency.operands, legal = legalMoves(position(operands.fen)).map(move => move.uci);
    const go = operands.budget === "movetime100" ? "go movetime 100" : `go depth ${operands.budget.slice(5)}`;
    const expectedCommands = ["ucinewgame", "setoption name Clear Hash",
      `setoption name MultiPV value ${Math.min(operands.multiPv, legal.length)}`, "isready",
      `position fen ${operands.fen}`, `${go} searchmoves ${legal.join(" ")}`];
    check(commands.length <= expectedCommands.length
      && same(commands.map(c => c.line), expectedCommands.slice(0, commands.length)),
    "crossed query FEN/budget/width/hash/legal-population commands");
    check(q.searchCommandWritten === commands.some(c => c.line.startsWith("go ")), "false search-command emission");
    check(q.inheritedTerminal === (t.startup.kind === "failed" || t.failures.some(f => f.at <= q.started)),
      "inherited failure relabeled as independent attempt");
    if (q.inheritedTerminal) check(commands.length === 0 && q.state !== "executed", "failed adapter emitted fresh command");
    if (q.state === "executed") check(q.searchCommandWritten && dependency.receipt.started >= q.started
      && dependency.receipt.ended <= q.ended, "available receipt without actual command/interval");
    if (t.startup.kind === "failed") check(q.state === "unavailable" && !q.searchCommandWritten,
      "startup failure mislabeled search timeout");
    commandCursor = q.commandEnd;
  }
  check(commandCursor === t.commands.length, "unbound cold command suffix");
  const executed = new Map(cold.row.providerQueries.filter(q => q.state === "executed")
    .map(q => [queryIdentity(q.operands), q.receiptDigest]));
  check(new Set(cold.row.providerQueries.map(q => queryIdentity(q.operands))).size === cold.row.providerQueries.length
    && cold.row.cacheHits === 0, "duplicate/cached cold query");
  check(warm.row.providerQueries.every(q => q.state !== "executed"
    && (q.state !== "cached" || executed.get(queryIdentity(q.operands)) === q.receiptDigest)),
  "warm source was not this exact cold operation");
  check(warm.row.initialCacheEntries === executed.size && cold.row.initialCacheEntries === 0,
    "crossed cold/warm cache occupancy");
  check(offline.row.initialCacheEntries === 0 && offline.row.cacheHits === 0
    && offline.row.providerQueries.every(q => q.state === "unavailable"), "offline source execution/reuse");
  const { kind: coldKind, ...before } = cold.raw.result, { kind: warmKind, ...after } = warm.raw.result;
  check(same(before, after), "warm changed compiled evidence");
  const failed = cold.row.providerQueries.some(q => !["executed", "cached"].includes(q.state));
  check(warmKind === (failed ? "source_unavailable" : coldKind), "warm failed-source state differs");
  return { cases: 3, processStarts: 1, readyProcesses: t.startup.kind === "ready" ? 1 : 0,
    writtenSearches: t.queries.filter(q => q.searchCommandWritten).length,
    coldKind, startupKind: t.startup.kind, independentClock: false, productionProfileSelected: false };
}

export function writeIsolatedTriplet(path, record) {
  verifyIsolatedTriplet(record);
  const bytes = `${JSON.stringify(record)}\n`;
  writeFileSync(path, bytes, { flag: "wx" });
  return { digest: sha(bytes), cases: 3 };
}
