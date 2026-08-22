// DISPOSABLE research harness — D872/Wave C C4. Uses the shipped Stockfish executor; not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor, type EngineSpec } from "../../apps/server/src/engine-supervisor.js";
import { StockfishEvidenceExecutor } from "../../apps/server/src/evidence-queue.js";
import { describe, expect, it } from "vitest";

import { importedRows, playedFen, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./review-engine-operands-output.md", import.meta.url).pathname;
const MATE_OUTPUT = new URL("./review-engine-mate-output.md", import.meta.url).pathname;
const BUDGETS = [50, 100, 200] as const;
const PER_PLY = 4;

interface Reading {
  readonly kind: "cp" | "mate";
  readonly value: number;
}

interface SampleResult {
  readonly id: string;
  readonly ply: number;
  readonly budget: number;
  readonly before: Reading;
  readonly after: Reading;
  readonly elapsedMs: number;
}

interface MatePuzzle {
  readonly id: string;
  readonly fen: string;
  readonly moves: readonly string[];
  readonly depth: 2 | 3 | 4;
}

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16_777_619) >>> 0;
  return hash;
}

function mateSamples(): readonly MatePuzzle[] {
  const source = process.env.TABIYA_LICHESS_PUZZLES;
  if (source === undefined) throw new TypeError("Set TABIYA_LICHESS_PUZZLES to the official CSV path");
  const byDepth = new Map<2 | 3 | 4, MatePuzzle[]>([[2, []], [3, []], [4, []]]);
  for (const line of readFileSync(source, "utf8").split("\n").slice(1)) {
    const fields = line.split(",");
    if (fields.length !== 11) continue;
    const themes = new Set(fields[7]!.split(" "));
    const depth = ([2, 3, 4] as const).find((value) => themes.has(`mateIn${value}`));
    if (depth !== undefined) byDepth.get(depth)!.push({ id: fields[0]!, fen: fields[1]!, moves: fields[2]!.split(" "), depth });
  }
  return [...byDepth].flatMap(([, rows]) => rows
    .sort((left, right) => stableHash(left.id) - stableHash(right.id) || left.id.localeCompare(right.id))
    .slice(0, 24));
}

function selectedRows(): readonly ResearchRow[] {
  const byPly = new Map<number, ResearchRow[]>();
  for (const row of importedRows()) {
    const match = /#(\d+)$/u.exec(row.id);
    if (match === null) continue;
    const ply = Number(match[1]);
    const found = byPly.get(ply) ?? [];
    found.push(row);
    byPly.set(ply, found);
  }
  const result: ResearchRow[] = [];
  for (const ply of [8, 16, 24, 32, 40, 48]) {
    const rows = byPly.get(ply) ?? [];
    const stride = rows.length / PER_PLY;
    for (let index = 0; index < PER_PLY; index += 1) result.push(rows[Math.floor(index * stride)]!);
  }
  return result;
}

function reading(values: Readonly<Record<string, unknown>>): Reading {
  if (typeof values.centipawns === "number") return { kind: "cp", value: values.centipawns };
  if (typeof values.mateIn === "number") return { kind: "mate", value: values.mateIn };
  throw new TypeError("Stockfish eval payload contained neither centipawns nor mateIn");
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) * p)]!;
}

function sign(value: number): number { return value === 0 ? 0 : value > 0 ? 1 : -1; }

function topIds(values: readonly SampleResult[], count: number): ReadonlySet<string> {
  return new Set(values.filter((row) => row.before.kind === "cp" && row.after.kind === "cp")
    .sort((a, b) => Math.abs(b.after.value - b.before.value) - Math.abs(a.after.value - a.before.value) || a.id.localeCompare(b.id))
    .slice(0, count).map((row) => row.id));
}

function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  const union = new Set([...left, ...right]);
  return union.size === 0 ? 1 : [...left].filter((value) => right.has(value)).length / union.size;
}

describe("D872 Review engine operand stability", () => {
  it("measures the shipped eval executor at three movetime budgets without grading moves", async () => {
    const spec: EngineSpec = Object.freeze({
      id: "stockfish-wave-c-review",
      kind: "judge",
      command: process.env.STOCKFISH_PATH ?? "stockfish",
      name: "Stockfish",
      options: Object.freeze({ Threads: 1, Hash: 16, MultiPV: 1 }),
      transcriptCapacity: 2_048,
    });
    const supervisor = new EngineSupervisor([spec]);
    const identity = await supervisor.start(spec.id);
    const executor = new StockfishEvidenceExecutor(supervisor, spec.id, 1);
    const samples = selectedRows();
    const results: SampleResult[] = [];
    try {
      for (const row of samples) for (const budget of BUDGETS) {
        const start = performance.now();
        const before = await executor.execute({ id: `${row.id}-before-${budget}`, runId: "research", nodeId: row.id, fen: row.parentFen, kind: "eval", movetime: budget }, new AbortController().signal);
        const after = await executor.execute({ id: `${row.id}-after-${budget}`, runId: "research", nodeId: row.id, fen: row.fen, kind: "eval", movetime: budget }, new AbortController().signal);
        results.push({ id: row.id, ply: Number(/#(\d+)$/u.exec(row.id)![1]), budget, before: reading(before.values), after: reading(after.values), elapsedMs: performance.now() - start });
      }
    } finally {
      await supervisor.shutdown();
    }

    const byBudget = new Map(BUDGETS.map((budget) => [budget, results.filter((row) => row.budget === budget)]));
    const lines = [
      "# D872 Review engine operand output",
      "",
      `Engine: ${identity.name} ${identity.version ?? "version-unreported"}; shipped StockfishEvidenceExecutor; Threads 1, Hash 16, MultiPV 1; resetSearchState true.`,
      `Population: ${samples.length} fixed imported transitions, ${PER_PLY} each at plies 8/16/24/32/40/48; both endpoints evaluated at movetime 50/100/200 ms.`,
      "",
      "| budget | transitions | cp→cp | any mate score | pair elapsed ms median / p90 | absolute cp swing median / p90 |",
      "|---:|---:|---:|---:|---:|---:|",
    ];
    for (const budget of BUDGETS) {
      const rows = byBudget.get(budget)!;
      const cp = rows.filter((row) => row.before.kind === "cp" && row.after.kind === "cp");
      const swings = cp.map((row) => Math.abs(row.after.value - row.before.value));
      const elapsed = rows.map((row) => row.elapsedMs);
      lines.push(`| ${budget} ms | ${rows.length} | ${cp.length} | ${rows.length - cp.length} | ${percentile(elapsed, .5).toFixed(1)} / ${percentile(elapsed, .9).toFixed(1)} | ${percentile(swings, .5)} / ${percentile(swings, .9)} |`);
    }
    lines.push(
      "",
      "## Cross-budget stability",
      "",
      "| comparison | shared cp transitions | delta sign agreement | |swing difference| median / p90 cp | top-8 moment Jaccard |",
      "|---|---:|---:|---:|---:|",
    );
    for (const [low, high] of [[50, 100], [100, 200], [50, 200]] as const) {
      const left = new Map(byBudget.get(low)!.map((row) => [row.id, row]));
      const pairs = byBudget.get(high)!.flatMap((right) => {
        const prior = left.get(right.id);
        return prior?.before.kind === "cp" && prior.after.kind === "cp" && right.before.kind === "cp" && right.after.kind === "cp" ? [{ prior, right }] : [];
      });
      const difference = pairs.map(({ prior, right }) => Math.abs((right.after.value - right.before.value) - (prior.after.value - prior.before.value)));
      const sameSign = pairs.filter(({ prior, right }) => sign(prior.after.value - prior.before.value) === sign(right.after.value - right.before.value)).length;
      lines.push(`| ${low}→${high} ms | ${pairs.length} | ${sameSign}/${pairs.length} (${(100 * sameSign / pairs.length).toFixed(1)}%) | ${percentile(difference, .5)} / ${percentile(difference, .9)} | ${jaccard(topIds(byBudget.get(low)!, 8), topIds(byBudget.get(high)!, 8)).toFixed(3)} |`);
    }
    lines.push(
      "",
      "Interpretation: these are stability/cost measurements of signed recorded evaluation differences. No threshold, inaccuracy/blunder word, significance claim, best-move recommendation or Review-selection policy is inferred. Mate scores remain typed separately from centipawns.",
      "",
    );
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(samples).toHaveLength(24);
    expect(results).toHaveLength(72);
  }, 3_600_000);

  it("measures engine mate typing against the exact mate-through-four proof population", async () => {
    const spec: EngineSpec = Object.freeze({
      id: "stockfish-wave-c-mate",
      kind: "judge",
      command: process.env.STOCKFISH_PATH ?? "stockfish",
      name: "Stockfish",
      options: Object.freeze({ Threads: 1, Hash: 16, MultiPV: 1 }),
      transcriptCapacity: 2_048,
    });
    const supervisor = new EngineSupervisor([spec]);
    const identity = await supervisor.start(spec.id);
    const executor = new StockfishEvidenceExecutor(supervisor, spec.id, 1);
    const samples = mateSamples();
    const results: { readonly sample: MatePuzzle; readonly reading: Reading; readonly expectedSign: number; readonly elapsedMs: number }[] = [];
    try {
      for (const sample of samples) {
        const afterSetup = playedFen(sample.fen, sample.moves[0]!);
        const attacker = afterSetup.split(/\s+/u)[1];
        const afterCandidate = playedFen(afterSetup, sample.moves[1]!);
        const start = performance.now();
        const payload = await executor.execute({ id: sample.id, runId: "research", nodeId: sample.id, fen: afterCandidate, kind: "eval", movetime: 100 }, new AbortController().signal);
        results.push({ sample, reading: reading(payload.values), expectedSign: attacker === "w" ? 1 : -1, elapsedMs: performance.now() - start });
      }
    } finally {
      await supervisor.shutdown();
    }
    const lines = [
      "# D872 Review engine/mate agreement output",
      "",
      `Engine: ${identity.name} ${identity.version ?? "version-unreported"}; shipped StockfishEvidenceExecutor; 100 ms; Threads 1, Hash 16, MultiPV 1.`,
      "Population: 24 deterministic rows from each already-proved exact mate-in-2/3/4 source arm, evaluated after the fixed candidate first move.",
      "",
      "| exact source horizon | rows | engine returned typed mate | winner-sign agreement | remaining mate distance median / p90 | latency ms median / p90 |",
      "|---:|---:|---:|---:|---:|---:|",
    ];
    for (const depth of [2, 3, 4] as const) {
      const rows = results.filter((result) => result.sample.depth === depth);
      const typed = rows.filter((result) => result.reading.kind === "mate");
      const signed = typed.filter((result) => sign(result.reading.value) === result.expectedSign);
      const distances = typed.map((result) => Math.abs(result.reading.value));
      const elapsed = rows.map((result) => result.elapsedMs);
      lines.push(`| ${depth} | ${rows.length} | ${typed.length}/${rows.length} | ${signed.length}/${typed.length} | ${percentile(distances, .5)} / ${percentile(distances, .9)} | ${percentile(elapsed, .5).toFixed(1)} / ${percentile(elapsed, .9).toFixed(1)} |`);
    }
    lines.push(
      "",
      "Interpretation: exact legal-tree proof remains the authority for the bounded mating-net event. A typed engine mate score is a separately grounded measured reading that Review may join when present; a centipawn result at this budget is engine absence, not refutation of the proof.",
      "",
    );
    writeFileSync(MATE_OUTPUT, lines.join("\n"), "utf8");

    expect(samples).toHaveLength(72);
    expect(results).toHaveLength(72);
  }, 3_600_000);
});
