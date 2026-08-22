// DISPOSABLE research harness — D916/C4 engine-version stability. Not production Review code.
import { writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { EngineSupervisor, type EngineSpec } from "../../apps/server/src/engine-supervisor.js";
import { StockfishEvidenceExecutor } from "../../apps/server/src/evidence-queue.js";
import { researchPosition } from "../research-chess/legal-exchange.js";
import { importedRows, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./review-engine-version-output.md", import.meta.url).pathname;
const MOVETIME_MS = 100;
const PER_PLY = 4;

interface Reading {
  readonly kind: "cp" | "mate";
  readonly value: number;
}

interface VersionRow {
  readonly id: string;
  readonly before: Reading;
  readonly after: Reading;
  readonly beforeWhiteWdl?: number;
  readonly afterWhiteWdl?: number;
}

interface VersionRun {
  readonly name: string;
  readonly version: string;
  readonly rows: readonly VersionRow[];
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
  return Object.freeze(result);
}

function reading(values: Readonly<Record<string, unknown>>): Reading {
  if (typeof values.centipawns === "number") return Object.freeze({ kind: "cp", value: values.centipawns });
  if (typeof values.mateIn === "number") return Object.freeze({ kind: "mate", value: values.mateIn });
  throw new TypeError("Stockfish eval payload contained neither centipawns nor mateIn");
}

function expectedScore(values: Readonly<Record<string, unknown>>, fen: string): number {
  if (![values.win, values.draw, values.loss].every(Number.isSafeInteger)) throw new TypeError("WDL payload is incomplete");
  const total = Number(values.win) + Number(values.draw) + Number(values.loss);
  const sideToMove = (Number(values.win) + .5 * Number(values.draw)) / total;
  return fen.split(" ")[1] === "w" ? sideToMove : 1 - sideToMove;
}

async function runVersion(id: string, command: string, rows: readonly ResearchRow[]): Promise<VersionRun> {
  const spec: EngineSpec = Object.freeze({
    id,
    kind: "judge",
    command,
    name: "Stockfish",
    options: Object.freeze({ Threads: 1, Hash: 16, MultiPV: 1 }),
    transcriptCapacity: 2_048,
  });
  const supervisor = new EngineSupervisor([spec]);
  const identity = await supervisor.start(spec.id);
  const executor = new StockfishEvidenceExecutor(supervisor, spec.id, 1);
  const result: VersionRow[] = [];
  try {
    for (const row of rows) {
      // One UCI process is sequential. Parallel commands would interleave transcripts and turn
      // the harness into an engine-client concurrency test instead of a version comparison.
      const before = await executor.execute({ id: `${id}-${row.id}-before`, runId: "research", nodeId: row.id, fen: row.parentFen, kind: "eval", movetime: MOVETIME_MS }, new AbortController().signal);
      const after = await executor.execute({ id: `${id}-${row.id}-after`, runId: "research", nodeId: row.id, fen: row.fen, kind: "eval", movetime: MOVETIME_MS }, new AbortController().signal);
      const beforeWdl = researchPosition(row.parentFen).isEnd() ? undefined : await executor.execute({ id: `${id}-${row.id}-before-wdl`, runId: "research", nodeId: row.id, fen: row.parentFen, kind: "wdl", movetime: MOVETIME_MS }, new AbortController().signal);
      const afterWdl = researchPosition(row.fen).isEnd() ? undefined : await executor.execute({ id: `${id}-${row.id}-after-wdl`, runId: "research", nodeId: row.id, fen: row.fen, kind: "wdl", movetime: MOVETIME_MS }, new AbortController().signal);
      result.push(Object.freeze({
        id: row.id,
        before: reading(before.values),
        after: reading(after.values),
        ...(beforeWdl === undefined ? {} : { beforeWhiteWdl: expectedScore(beforeWdl.values, row.parentFen) }),
        ...(afterWdl === undefined ? {} : { afterWhiteWdl: expectedScore(afterWdl.values, row.fen) }),
      }));
    }
  } finally {
    await supervisor.shutdown();
  }
  return Object.freeze({ name: identity.name, version: identity.version ?? "version-unreported", rows: Object.freeze(result) });
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) * p)]!;
}

function sign(value: number): number { return value === 0 ? 0 : value > 0 ? 1 : -1; }

function topIds(values: readonly { readonly id: string; readonly delta: number }[], count = 8): ReadonlySet<string> {
  return new Set([...values].sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta) || left.id.localeCompare(right.id)).slice(0, count).map((row) => row.id));
}

function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  const union = new Set([...left, ...right]);
  return union.size === 0 ? 1 : [...left].filter((value) => right.has(value)).length / union.size;
}

describe("D916 C4 cross-version engine operand stability", () => {
  it("compares official Stockfish releases without converting mate to cp", async () => {
    const path17 = process.env.STOCKFISH_17_PATH;
    if (path17 === undefined) throw new TypeError("Set STOCKFISH_17_PATH to the official Stockfish 17.1 binary");
    const rows = selectedRows();
    const run17 = await runVersion("stockfish-17-1", path17, rows);
    const run18 = await runVersion("stockfish-18", process.env.STOCKFISH_18_PATH ?? "stockfish", rows);
    const right = new Map(run18.rows.map((row) => [row.id, row]));
    const pairs = run17.rows.map((left) => ({ left, right: right.get(left.id)! }));
    const cp = pairs.filter((pair): pair is typeof pair & { left: VersionRow & { before: { kind: "cp" }; after: { kind: "cp" } }; right: VersionRow & { before: { kind: "cp" }; after: { kind: "cp" } } } => pair.left.before.kind === "cp" && pair.left.after.kind === "cp" && pair.right.before.kind === "cp" && pair.right.after.kind === "cp");
    const cp17 = cp.map(({ left }) => ({ id: left.id, delta: left.after.value - left.before.value }));
    const cp18 = cp.map(({ right: value }) => ({ id: value.id, delta: value.after.value - value.before.value }));
    const wdlPairs = pairs.filter((pair): pair is typeof pair & { left: VersionRow & { beforeWhiteWdl: number; afterWhiteWdl: number }; right: VersionRow & { beforeWhiteWdl: number; afterWhiteWdl: number } } => pair.left.beforeWhiteWdl !== undefined && pair.left.afterWhiteWdl !== undefined && pair.right.beforeWhiteWdl !== undefined && pair.right.afterWhiteWdl !== undefined);
    const wdl17 = wdlPairs.map(({ left }) => ({ id: left.id, delta: left.afterWhiteWdl - left.beforeWhiteWdl }));
    const wdl18 = wdlPairs.map(({ right: value }) => ({ id: value.id, delta: value.afterWhiteWdl - value.beforeWhiteWdl }));
    const cpSign = cp17.filter((value, index) => sign(value.delta) === sign(cp18[index]!.delta)).length;
    const wdlSign = wdl17.filter((value, index) => sign(value.delta) === sign(wdl18[index]!.delta)).length;
    const typeAgreement = pairs.flatMap(({ left, right: value }) => [[left.before, value.before], [left.after, value.after]] as const).filter(([left, value]) => left.kind === value.kind).length;
    const matePairs = pairs.flatMap(({ left, right: value }) => [[left.before, value.before], [left.after, value.after]] as const).filter(([left, value]) => left.kind === "mate" || value.kind === "mate");
    const lines = [
      "# D916 C4 engine-version stability output",
      "",
      `Engines: ${run17.name} ${run17.version} and ${run18.name} ${run18.version}; official release binaries; shipped StockfishEvidenceExecutor; ${MOVETIME_MS} ms; Threads 1, Hash 16, MultiPV 1.`,
      `Population: ${rows.length} fixed imported transitions, ${PER_PLY} each at plies 8/16/24/32/40/48; both endpoints evaluated for typed eval and White-normalized WDL.`,
      "",
      "| operand | eligible rows/points | sign or type agreement | difference median / p90 | top-8 moment Jaccard |",
      "|---|---:|---:|---:|---:|",
      `| cp→cp delta | ${cp.length} | ${cpSign}/${cp.length} (${(100 * cpSign / cp.length).toFixed(1)}%) | ${percentile(cp17.map((value, index) => Math.abs(value.delta - cp18[index]!.delta)), .5)} / ${percentile(cp17.map((value, index) => Math.abs(value.delta - cp18[index]!.delta)), .9)} cp | ${jaccard(topIds(cp17), topIds(cp18)).toFixed(3)} |`,
      `| White-normalized WDL delta | ${wdl17.length} | ${wdlSign}/${wdl17.length} (${(100 * wdlSign / wdl17.length).toFixed(1)}%) | ${(100 * percentile(wdl17.map((value, index) => Math.abs(value.delta - wdl18[index]!.delta)), .5)).toFixed(1)} / ${(100 * percentile(wdl17.map((value, index) => Math.abs(value.delta - wdl18[index]!.delta)), .9)).toFixed(1)} pp | ${jaccard(topIds(wdl17), topIds(wdl18)).toFixed(3)} |`,
      `| cp/mate point type | ${pairs.length * 2} | ${typeAgreement}/${pairs.length * 2} (${(100 * typeAgreement / (pairs.length * 2)).toFixed(1)}%) | ${matePairs.length} points involve mate in either release | n/a |`,
      "",
      "Interpretation: version is part of every engine operand. Agreement may justify a default budget/version, but it never creates a timeless grade or a cross-source scalar. Mate remains a distinct type; WDL is normalized to one declared subject before any delta.",
      "",
    ];
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(rows).toHaveLength(24);
    expect(run17.version).not.toBe(run18.version);
    expect(pairs).toHaveLength(24);
    expect(cp.length).toBeGreaterThan(0);
  }, 1_200_000);
});
