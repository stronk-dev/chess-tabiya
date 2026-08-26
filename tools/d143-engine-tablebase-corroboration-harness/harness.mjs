import { spawn } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DEADBANDS = Object.freeze([0, 25, 50, 100, 200, 500]);
export const PROFILE = Object.freeze({ depth: 22, threads: 1, hashMb: 16, multiPv: 1, timeoutMs: 120_000 });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stableTablebaseValues(record) {
  const values = record.values ?? {};
  return Object.freeze({
    category: values.category,
    dtz: values.dtz ?? null,
    dtm: values.dtm ?? null,
    checkmate: values.checkmate === true,
    stalemate: values.stalemate === true,
    insufficientMaterial: values.insufficient_material === true,
    pieceCount: values.pieceCount,
  });
}

export async function loadPopulation(root) {
  const drafts = resolve(root, "content/drafts");
  const files = (await readdir(drafts)).filter((name) => name.endsWith(".evidence.json")).sort();
  const byFen = new Map();
  let recordCount = 0;
  for (const name of files) {
    const ledger = JSON.parse(await readFile(join(drafts, name), "utf8"));
    for (const record of ledger.records ?? []) {
      if (record.kind !== "tablebase_result") continue;
      recordCount += 1;
      const fen = record.anchor?.fen;
      assert(typeof fen === "string", `${name}: tablebase record has no anchor FEN`);
      const values = stableTablebaseValues(record);
      assert(["win", "loss", "draw"].includes(values.category), `${name}: unknown tablebase category ${values.category}`);
      const prior = byFen.get(fen);
      if (prior) {
        assert(JSON.stringify(prior.tablebase) === JSON.stringify(values), `${fen}: duplicate tablebase payloads disagree`);
        prior.packIds.add(ledger.packId ?? basename(name, ".evidence.json"));
        prior.supports.push(...(record.supports ?? []));
      } else {
        byFen.set(fen, {
          fen,
          tablebase: values,
          packIds: new Set([ledger.packId ?? basename(name, ".evidence.json")]),
          supports: [...(record.supports ?? [])],
        });
      }
    }
  }
  const positions = [...byFen.values()].sort((a, b) => a.fen.localeCompare(b.fen)).map((entry) => Object.freeze({
    fen: entry.fen,
    tablebase: entry.tablebase,
    packIds: Object.freeze([...entry.packIds].sort()),
    supports: Object.freeze([...new Set(entry.supports)].sort()),
  }));
  const categories = Object.fromEntries(["win", "loss", "draw"].map((category) => [category, positions.filter((row) => row.tablebase.category === category).length]));
  for (const category of ["win", "loss", "draw"]) assert(categories[category] > 0, `population lacks ${category} control`);
  return Object.freeze({ recordCount, positions: Object.freeze(positions), categories: Object.freeze(categories) });
}

class UciEngine {
  constructor(command) {
    this.command = command;
    this.process = null;
    this.lines = [];
    this.waiters = [];
    this.identity = {};
  }

  async start() {
    this.process = spawn(this.command, [], { stdio: ["pipe", "pipe", "pipe"] });
    let pending = "";
    this.process.stdout.setEncoding("utf8");
    this.process.stdout.on("data", (chunk) => {
      pending += chunk;
      const parts = pending.split(/\r?\n/);
      pending = parts.pop() ?? "";
      for (const line of parts) this.#accept(line);
    });
    this.process.stderr.setEncoding("utf8");
    this.process.stderr.on("data", (chunk) => this.#accept(`stderr ${chunk.trim()}`));
    this.send("uci");
    const uci = await this.waitFor((line) => line === "uciok", 15_000);
    void uci;
    for (const line of this.lines) {
      const match = /^id (name|author) (.+)$/.exec(line);
      if (match) this.identity[match[1]] = match[2];
    }
    this.send(`setoption name Threads value ${PROFILE.threads}`);
    this.send(`setoption name Hash value ${PROFILE.hashMb}`);
    this.send(`setoption name MultiPV value ${PROFILE.multiPv}`);
    await this.ready();
    return Object.freeze({ ...this.identity });
  }

  #accept(line) {
    this.lines.push(line);
    for (const waiter of [...this.waiters]) {
      if (!waiter.predicate(line)) continue;
      clearTimeout(waiter.timer);
      this.waiters.splice(this.waiters.indexOf(waiter), 1);
      waiter.resolve(line);
    }
  }

  send(command) {
    assert(this.process?.stdin.writable, `engine stdin unavailable for ${command}`);
    this.process.stdin.write(`${command}\n`);
  }

  waitFor(predicate, timeoutMs) {
    return new Promise((resolvePromise, reject) => {
      const waiter = { predicate, resolve: resolvePromise, reject, timer: null };
      waiter.timer = setTimeout(() => {
        this.waiters.splice(this.waiters.indexOf(waiter), 1);
        reject(new Error(`engine timeout after ${timeoutMs} ms`));
      }, timeoutMs);
      this.waiters.push(waiter);
    });
  }

  async ready() {
    this.send("isready");
    await this.waitFor((line) => line === "readyok", 15_000);
  }

  async evaluate(fen) {
    this.send("ucinewgame");
    await this.ready();
    const start = this.lines.length;
    this.send(`position fen ${fen}`);
    this.send(`go depth ${PROFILE.depth}`);
    await this.waitFor((line) => line.startsWith("bestmove "), PROFILE.timeoutMs);
    const lines = this.lines.slice(start);
    const scored = [...lines].reverse().find((line) => /\bscore (?:cp|mate) -?\d+\b/.test(line));
    assert(scored, `${fen}: Stockfish returned no typed score`);
    const score = /\bscore (cp|mate) (-?\d+)\b/.exec(scored);
    const depth = /\bdepth (\d+)\b/.exec(scored);
    const bestmove = [...lines].reverse().find((line) => line.startsWith("bestmove "))?.split(/\s+/)[1];
    return Object.freeze({
      type: score[1],
      value: Number(score[2]),
      depth: depth ? Number(depth[1]) : null,
      bestmove: bestmove === "(none)" ? null : bestmove ?? null,
    });
  }

  async close() {
    if (!this.process) return;
    this.send("quit");
    await new Promise((resolvePromise) => {
      const timer = setTimeout(() => { this.process.kill(); resolvePromise(); }, 2_000);
      this.process.once("exit", () => { clearTimeout(timer); resolvePromise(); });
    });
  }
}

export function scoreSign(engine) {
  return Math.sign(engine.value);
}

function predict(engine, deadband) {
  if (engine.type === "mate") {
    if (engine.value > 0) return "win";
    if (engine.value < 0) return "loss";
    // Stockfish emits `score mate 0` with `bestmove (none)` when the side to
    // move is already checkmated. Keep the mate type and classify its outcome;
    // do not replace it with a centipawn sentinel.
    return engine.bestmove === null ? "loss" : "unknown";
  }
  if (Math.abs(engine.value) <= deadband) return "draw";
  return engine.value > 0 ? "win" : "loss";
}

function percent(numerator, denominator) {
  return denominator === 0 ? null : Number(((100 * numerator) / denominator).toFixed(1));
}

function percentile(values, fraction) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * fraction)];
}

function summarizeGroup(rows) {
  const decisive = rows.filter((row) => row.tablebase.category !== "draw" && row.engine.value !== 0);
  const directionMatches = decisive.filter((row) => (row.tablebase.category === "win" ? 1 : -1) === scoreSign(row.engine)).length;
  const drawCp = rows.filter((row) => row.tablebase.category === "draw" && row.engine.type === "cp").map((row) => Math.abs(row.engine.value));
  return Object.freeze({
    positions: rows.length,
    typed: Object.freeze({ cp: rows.filter((row) => row.engine.type === "cp").length, mate: rows.filter((row) => row.engine.type === "mate").length }),
    directionalAgreement: Object.freeze({ matches: directionMatches, eligible: decisive.length, percent: percent(directionMatches, decisive.length) }),
    exactDrawAbsCp: Object.freeze({ count: drawCp.length, median: percentile(drawCp, 0.5), p90: percentile(drawCp, 0.9), p95: percentile(drawCp, 0.95), max: drawCp.length ? Math.max(...drawCp) : null }),
  });
}

function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const value = key(row);
    const bucket = groups.get(value) ?? [];
    bucket.push(row);
    groups.set(value, bucket);
  }
  return Object.fromEntries([...groups.entries()].sort(([a], [b]) => String(a).localeCompare(String(b))).map(([name, values]) => [name, summarizeGroup(values)]));
}

function counterexample(row) {
  return Object.freeze({ fen: row.fen, packIds: row.packIds, category: row.tablebase.category, dtz: row.tablebase.dtz, dtm: row.tablebase.dtm, engine: row.engine });
}

export function summarize(rows) {
  const thresholds = DEADBANDS.map((deadband) => {
    const predictions = rows.map((row) => ({ row, predicted: predict(row.engine, deadband) }));
    const draws = predictions.filter(({ row }) => row.tablebase.category === "draw");
    const decisive = predictions.filter(({ row }) => row.tablebase.category !== "draw");
    const drawCorrect = draws.filter(({ predicted }) => predicted === "draw").length;
    const decisiveCorrect = decisive.filter(({ row, predicted }) => predicted === row.tablebase.category).length;
    return Object.freeze({
      deadband,
      drawCorrect: Object.freeze({ count: drawCorrect, total: draws.length, percent: percent(drawCorrect, draws.length) }),
      decisiveCorrect: Object.freeze({ count: decisiveCorrect, total: decisive.length, percent: percent(decisiveCorrect, decisive.length) }),
      eligible: percent(drawCorrect, draws.length) >= 95 && percent(decisiveCorrect, decisive.length) >= 95,
    });
  });
  const contradictions = rows.filter((row) => row.tablebase.category !== "draw" && predict(row.engine, 0) !== row.tablebase.category);
  const mateDisagreements = rows.filter((row) => row.engine.type === "mate" && predict(row.engine, 0) !== row.tablebase.category);
  const winsNearZero = rows.filter((row) => row.tablebase.category !== "draw" && row.engine.type === "cp").sort((a, b) => Math.abs(a.engine.value) - Math.abs(b.engine.value)).slice(0, 12);
  const drawsLargest = rows.filter((row) => row.tablebase.category === "draw" && row.engine.type === "cp").sort((a, b) => Math.abs(b.engine.value) - Math.abs(a.engine.value)).slice(0, 12);
  return Object.freeze({
    overall: summarizeGroup(rows),
    thresholds: Object.freeze(thresholds),
    decision: Object.freeze({
      eligibleDeadbandsForIndependentValidation: Object.freeze(thresholds.filter((row) => row.eligible).map((row) => row.deadband)),
      followupValidationEligible: thresholds.some((row) => row.eligible),
      productionNormalizationPermitted: false,
    }),
    strata: Object.freeze({
      pieceCount: groupBy(rows, (row) => row.tablebase.pieceCount),
      sideToMove: groupBy(rows, (row) => row.fen.split(/\s+/)[1]),
      halfmoveClock: groupBy(rows, (row) => { const clock = Number(row.fen.split(/\s+/)[4]); return clock === 0 ? "0" : clock < 50 ? "1-49" : "50+"; }),
      terminal: groupBy(rows, (row) => row.tablebase.checkmate || row.tablebase.stalemate || row.tablebase.insufficientMaterial ? "terminal" : "non-terminal"),
    }),
    counterexamples: Object.freeze({
      signContradictions: Object.freeze(contradictions.slice(0, 20).map(counterexample)),
      mateDisagreements: Object.freeze(mateDisagreements.slice(0, 20).map(counterexample)),
      decisiveNearestZero: Object.freeze(winsNearZero.map(counterexample)),
      exactDrawLargestAbsCp: Object.freeze(drawsLargest.map(counterexample)),
    }),
  });
}

export async function run({ root, stockfish, output, progress = () => {} }) {
  const population = await loadPopulation(root);
  const engine = new UciEngine(stockfish);
  const identity = await engine.start();
  const rows = [];
  try {
    for (const [index, position] of population.positions.entries()) {
      const answer = await engine.evaluate(position.fen);
      rows.push(Object.freeze({ ...position, engine: answer }));
      progress(index + 1, population.positions.length, position.fen, answer);
    }
  } finally {
    await engine.close();
  }
  const perspectiveRows = rows
    .filter((row) => row.packIds.includes("mate-k-r-technique") && row.supports.some((support) => support.startsWith("/spine/")) && !row.tablebase.checkmate)
    .sort((left, right) => Math.min(...left.supports.map((value) => value.length)) - Math.min(...right.supports.map((value) => value.length)));
  assert(perspectiveRows.length >= 4, "perspective control lacks a mating-line population");
  assert(perspectiveRows.every((row, index) => index === 0 || row.tablebase.category !== perspectiveRows[index - 1].tablebase.category), "perspective control's exact outcomes do not alternate");
  assert(perspectiveRows.every((row) => predict(row.engine, 0) === row.tablebase.category), "side-to-move perspective conversion failed on the alternating mating line");
  const result = Object.freeze({
    schema: "tabiya.research.engine-tablebase-corroboration.v1",
    measuredAt: new Date().toISOString(),
    environment: Object.freeze({ node: process.version, platform: process.platform, arch: process.arch, stockfishCommand: stockfish, engine: identity, profile: PROFILE }),
    population: Object.freeze({ records: population.recordCount, distinctFens: rows.length, categories: population.categories }),
    controls: Object.freeze({ perspectiveAlternation: Object.freeze({ packId: "mate-k-r-technique", positions: perspectiveRows.length, passed: true }) }),
    summary: summarize(rows),
    observations: Object.freeze(rows),
  });
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return result;
}

async function main() {
  const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const stockfish = process.env.SF_CMD ?? "/opt/homebrew/bin/stockfish";
  const output = resolve(root, process.env.RESULT_OUTPUT ?? "planning/d143-engine-tablebase-corroboration/results.json");
  const result = await run({
    root,
    stockfish,
    output,
    progress(done, total, fen, score) {
      if (done === 1 || done % 10 === 0 || done === total) process.stdout.write(`${done}/${total} ${score.type} ${score.value} ${fen}\n`);
    },
  });
  process.stdout.write(`${JSON.stringify({ population: result.population, summary: result.summary.overall, decision: result.summary.decision, thresholds: result.summary.thresholds }, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
