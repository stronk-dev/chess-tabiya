// DISPOSABLE research harness — D1405. Not production code.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";

import { classifyPhase } from "../../packages/runtime/src/phase.js";
import {
  legalAlternativeEdges,
  localSemanticEvents,
  type SemanticEvidenceEvent,
} from "../../packages/runtime/src/semantic-evidence.js";
import {
  importedPopulation,
  type ResearchRow,
} from "../research-chess/populations.js";

const ROOT = new URL("../../", import.meta.url);
const PGN = new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url);
const SOURCE_PATHS = [
  "packages/runtime/src/semantic-evidence.ts",
  "packages/runtime/src/phase.ts",
  "packages/runtime/src/legal-moves.ts",
  "tools/research-chess/populations.ts",
  "rfc/contracts/longitudinal-ingest-registry-v1.json",
  "rfc/contracts/longitudinal-sign-subsets-v1.json",
  "tools/d1612-longitudinal-contract-harness/longitudinal-contract.ts",
] as const;
const LENGTHS = [20, 40, 80] as const;
const NATIVE_PATHS = 8;
const BULK_PATHS = 25;
const BUDGET_MS = 500;

interface EventRef {
  readonly decisionId: string;
  readonly projectionId: string;
  readonly version: number;
  readonly sign: string;
  readonly eventId: string;
}

interface DecisionMeasure {
  readonly decisionId: string;
  readonly alternatives: number;
  readonly evaluatedEdges: number;
  readonly emittedEvents: number;
  readonly eventPartitionDigest: string;
}

interface StoreRow {
  readonly projectionId: string;
  readonly version: number;
  readonly phase: string;
  readonly decisionClass: "game";
  readonly occurredRefs: readonly string[];
  readonly opportunityRefs: readonly string[];
}

interface ProjectionMeasure {
  readonly pathId: string;
  readonly plies: number;
  readonly elapsedMs: number;
  readonly decisions: number;
  readonly legalAlternatives: number;
  readonly evaluatedEdges: number;
  readonly emittedEvents: number;
  readonly referenceBytes: number;
  readonly eventPopulationDigest: string;
  readonly familyCounts: Readonly<Record<string, number>>;
  readonly storeRows: readonly StoreRow[];
  readonly decisionMeasures: readonly DecisionMeasure[];
}

function sha256(value: string | Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function pathKey(path: readonly ResearchRow[]): string {
  return `${path[0]?.id ?? ""}\0${String(path.length).padStart(5, "0")}\0${path.map((row) => row.id).join("\0")}`;
}

function selectedPaths(
  paths: readonly (readonly ResearchRow[])[],
  minimumPlies: number,
  count: number,
): readonly (readonly ResearchRow[])[] {
  return Object.freeze(paths
    .filter((path) => path.length >= minimumPlies)
    .sort((left, right) => pathKey(left).localeCompare(pathKey(right)))
    .slice(0, count));
}

function eventRef(decisionId: string, event: SemanticEvidenceEvent): EventRef {
  return Object.freeze({
    decisionId,
    projectionId: event.projection.id,
    version: event.projection.version,
    sign: event.sign,
    eventId: event.id,
  });
}

function refKey(ref: EventRef): string {
  return [ref.decisionId, ref.projectionId, ref.version, ref.sign, ref.eventId].join("\0");
}

function counts(values: readonly string[]): Readonly<Record<string, number>> {
  const result = new Map<string, number>();
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return Object.freeze(Object.fromEntries([...result].sort(([left], [right]) => left.localeCompare(right))));
}

function project(path: readonly ResearchRow[]): ProjectionMeasure {
  const started = performance.now();
  const decisions: DecisionMeasure[] = [];
  const families: string[] = [];
  const eventPopulation = createHash("sha256");
  const store = new Map<string, { projectionId: string; version: number; phase: string; occurredRefs: string[]; opportunityRefs: string[] }>();
  for (const row of path) {
    const played = localSemanticEvents(row.parentFen, row.uci, row.fen);
    const alternatives = legalAlternativeEdges(row.parentFen, row.uci);
    const events = [...played];
    for (const alternative of alternatives) {
      events.push(...localSemanticEvents(alternative.beforeFen, alternative.moveUci, alternative.afterFen));
    }
    const refs = events.map((event) => eventRef(row.id, event)).sort((left, right) => refKey(left).localeCompare(refKey(right)));
    const partitionDigest = sha256(refs.map(refKey).join("\n"));
    eventPopulation.update(`${row.id}\0${partitionDigest}\n`);
    families.push(...events.map((event) => `${event.projection.id}@${event.projection.version}:${event.sign}`));
    const phase = classifyPhase(row.parentFen).phase;
    const playedFamilies = new Set(played.map((event) => `${event.projection.id}@${event.projection.version}`));
    const populationFamilies = new Map(events.map((event) => [
      `${event.projection.id}@${event.projection.version}`,
      { projectionId: event.projection.id, version: event.projection.version },
    ]));
    for (const [family, identity] of populationFamilies) {
      const key = `${family}\0${phase}\0game`;
      const target = store.get(key) ?? { ...identity, phase, occurredRefs: [], opportunityRefs: [] };
      target.opportunityRefs.push(row.id);
      if (playedFamilies.has(family)) target.occurredRefs.push(row.id);
      store.set(key, target);
    }
    decisions.push(Object.freeze({
      decisionId: row.id,
      alternatives: alternatives.length,
      evaluatedEdges: alternatives.length + 1,
      emittedEvents: events.length,
      eventPartitionDigest: partitionDigest,
    }));
  }
  const storeRows = [...store.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, row]) => Object.freeze({
    projectionId: row.projectionId,
    version: row.version,
    phase: row.phase,
    decisionClass: "game" as const,
    occurredRefs: Object.freeze([...row.occurredRefs].sort()),
    opportunityRefs: Object.freeze([...row.opportunityRefs].sort()),
  }));
  const emittedEvents = decisions.reduce((sum, decision) => sum + decision.emittedEvents, 0);
  const referenceBytes = storeRows.reduce((sum, row) => sum + Buffer.byteLength(JSON.stringify({
    occurredRefs: row.occurredRefs,
    opportunityRefs: row.opportunityRefs,
  }), "utf8"), 0);
  return Object.freeze({
    pathId: path[0]?.id ?? "empty",
    plies: path.length,
    elapsedMs: performance.now() - started,
    decisions: decisions.length,
    legalAlternatives: decisions.reduce((sum, decision) => sum + decision.alternatives, 0),
    evaluatedEdges: decisions.reduce((sum, decision) => sum + decision.evaluatedEdges, 0),
    emittedEvents,
    referenceBytes,
    eventPopulationDigest: `sha256:${eventPopulation.digest("hex")}`,
    familyCounts: counts(families),
    storeRows: Object.freeze(storeRows),
    decisionMeasures: Object.freeze(decisions),
  });
}

function percentile(values: readonly number[], quantile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(quantile * sorted.length) - 1)]!;
}

function timing(values: readonly number[]) {
  return Object.freeze({
    n: values.length,
    meanMs: values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length),
    p50Ms: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    maxMs: Math.max(0, ...values),
  });
}

function totals(rows: readonly ProjectionMeasure[]) {
  return Object.freeze({
    paths: rows.length,
    plies: rows.reduce((sum, row) => sum + row.plies, 0),
    legalAlternatives: rows.reduce((sum, row) => sum + row.legalAlternatives, 0),
    evaluatedEdges: rows.reduce((sum, row) => sum + row.evaluatedEdges, 0),
    emittedEvents: rows.reduce((sum, row) => sum + row.emittedEvents, 0),
    referenceBytes: rows.reduce((sum, row) => sum + row.referenceBytes, 0),
  });
}

function cumulativeReplay(rows: readonly ProjectionMeasure[]) {
  let prefixDecisions = 0;
  let evaluatedEdges = 0;
  for (const row of rows) for (const [index, decision] of row.decisionMeasures.entries()) {
    const repetitions = row.plies - index;
    prefixDecisions += repetitions;
    evaluatedEdges += repetitions * decision.evaluatedEdges;
  }
  return Object.freeze({ prefixDecisions, evaluatedEdges });
}

function report(result: Record<string, unknown>): string {
  const native = result.native as Record<string, {
    readonly timingMs: ReturnType<typeof timing>;
    readonly totals: ReturnType<typeof totals>;
    readonly cumulativeReplay: ReturnType<typeof cumulativeReplay>;
    readonly gate: string;
  }>;
  const bulk = result.bulk as {
    readonly timingMs: ReturnType<typeof timing>;
    readonly totals: ReturnType<typeof totals>;
    readonly totalWallMs: number;
    readonly gamesPerSecond: number;
  };
  const growth = result.growth as { readonly p95Ratio80To20: number; readonly gate: string };
  return [
    "# D1405 longitudinal projection cost results", "",
    `Commit: \`${String(result.commit)}\`; PGN: \`${String(result.pgnSha256)}\`; sources: \`${String(result.sourceDigest)}\`.`, "",
    "| prefix | paths | p50 | p95 | max | evaluated edges | cumulative replay edges | refs bytes | 500 ms gate |",
    "|---:|---:|---:|---:|---:|---:|---:|---:|---|",
    ...LENGTHS.map((length) => {
      const arm = native[String(length)]!;
      return `| ${length} | ${arm.totals.paths} | ${arm.timingMs.p50Ms.toFixed(1)} ms | ${arm.timingMs.p95Ms.toFixed(1)} ms | ${arm.timingMs.maxMs.toFixed(1)} ms | ${arm.totals.evaluatedEdges} | ${arm.cumulativeReplay.evaluatedEdges} | ${arm.totals.referenceBytes} | **${arm.gate}** |`;
    }), "",
    `20→80 p95 ratio: **${growth.p95Ratio80To20.toFixed(2)}×** — shape gate **${growth.gate}**.`, "",
    "## Bulk import", "",
    `${bulk.totals.paths} complete games / ${bulk.totals.plies} plies / ${bulk.totals.evaluatedEdges} evaluated edges in ${bulk.totalWallMs.toFixed(1)} ms (${bulk.gamesPerSecond.toFixed(3)} games/s). Per-game p50/p95/max: ${bulk.timingMs.p50Ms.toFixed(1)} / ${bulk.timingMs.p95Ms.toFixed(1)} / ${bulk.timingMs.maxMs.toFixed(1)} ms. Canonical refs: ${bulk.totals.referenceBytes} bytes.`, "",
    "This is a lower bound over the committed one-edge compiler. It excludes database work and the population/path constructors required by B2.", "",
  ].join("\n");
}

function sourceReceipt() {
  const sourceBytes = SOURCE_PATHS.flatMap((path) => {
    const url = new URL(path, ROOT);
    return existsSync(url) ? [`${path}\0${readFileSync(url)}`] : [];
  }).join("\0");
  return Object.freeze({
    experiment: "D1405",
    measuredAt: new Date().toISOString(),
    commit: process.env.D1405_COMMIT ?? "unknown",
    pgnSha256: sha256(readFileSync(PGN)),
    sourceDigest: sha256(sourceBytes),
    sourcePaths: SOURCE_PATHS.filter((path) => existsSync(new URL(path, ROOT))),
  });
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function compactProjection(value: Record<string, unknown>): Record<string, unknown> {
  const storeRows = value.storeRows ?? [];
  const decisionMeasures = value.decisionMeasures ?? [];
  return Object.freeze({
    pathId: value.pathId,
    plies: value.plies,
    elapsedMs: value.elapsedMs,
    decisions: value.decisions,
    legalAlternatives: value.legalAlternatives,
    evaluatedEdges: value.evaluatedEdges,
    emittedEvents: value.emittedEvents,
    referenceBytes: value.referenceBytes,
    eventPopulationDigest: value.eventPopulationDigest,
    familyCounts: value.familyCounts,
    storeRowCount: Array.isArray(storeRows) ? storeRows.length : 0,
    storeRowsDigest: sha256(JSON.stringify(storeRows)),
    decisionMeasuresDigest: sha256(JSON.stringify(decisionMeasures)),
  });
}

function compactFragment(value: Record<string, unknown>): Record<string, unknown> {
  const rows = Array.isArray(value.rows) ? value.rows as Record<string, unknown>[] : [];
  return Object.freeze({
    experiment: value.experiment,
    measuredAt: value.measuredAt,
    commit: value.commit,
    pgnSha256: value.pgnSha256,
    sourceDigest: value.sourceDigest,
    sourcePaths: value.sourcePaths,
    arm: value.arm,
    contract: value.contract,
    selectedPaths: value.selectedPaths,
    timingMs: value.timingMs,
    totals: value.totals,
    ...(value.cumulativeReplay === undefined ? {} : { cumulativeReplay: value.cumulativeReplay }),
    ...(value.gate === undefined ? {} : { gate: value.gate }),
    ...(value.totalWallMs === undefined ? {} : { totalWallMs: value.totalWallMs }),
    ...(value.gamesPerSecond === undefined ? {} : { gamesPerSecond: value.gamesPerSecond }),
    rows: Object.freeze(rows.map(compactProjection)),
  });
}

describe("D1405 longitudinal projection cost", () => {
  it("measures one isolated arm or aggregates the four frozen receipts", () => {
    const outputDir = process.env.D1405_RESULT_DIR;
    if (outputDir === undefined || outputDir.length === 0) throw new TypeError("D1405_RESULT_DIR is required");
    const arm = process.env.D1405_ARM;
    if (arm === undefined || !["20", "40", "80", "bulk", "aggregate"].includes(arm)) {
      throw new TypeError("D1405_ARM must be 20, 40, 80, bulk or aggregate");
    }
    mkdirSync(outputDir, { recursive: true });

    const population = importedPopulation();
    expect(population.paths).toHaveLength(108);
    expect(population.paths.flat()).toHaveLength(6_991);

    if (arm === "20" || arm === "40" || arm === "80") {
      const length = Number(arm) as (typeof LENGTHS)[number];
      const paths = selectedPaths(population.paths, length, NATIVE_PATHS).map((path) => path.slice(0, length));
      expect(paths).toHaveLength(NATIVE_PATHS);
      const rows = paths.map(project);
      const latency = timing(rows.map((row) => row.elapsedMs));
      const result = Object.freeze({
        ...sourceReceipt(),
        arm,
        contract: Object.freeze({ length, nativePaths: NATIVE_PATHS, budgetMs: BUDGET_MS }),
        selectedPaths: rows.map((row) => Object.freeze({ id: row.pathId, plies: row.plies })),
        timingMs: latency,
        totals: totals(rows),
        cumulativeReplay: cumulativeReplay(rows),
        gate: latency.p95Ms <= BUDGET_MS ? "PASS" : "FAIL",
        rows,
      });
      writeJson(resolve(outputDir, `d1405-${arm}-fragment.json`), result);
      expect(result.rows).toHaveLength(NATIVE_PATHS);
      return;
    }

    if (arm === "bulk") {
      const bulkPaths = selectedPaths(population.paths, 20, BULK_PATHS);
      expect(bulkPaths).toHaveLength(BULK_PATHS);
      const bulkStarted = performance.now();
      const bulkRows = bulkPaths.map(project);
      const bulkWall = performance.now() - bulkStarted;
      const result = Object.freeze({
        ...sourceReceipt(),
        arm,
        contract: Object.freeze({ bulkPaths: BULK_PATHS }),
        selectedPaths: bulkRows.map((row) => Object.freeze({ id: row.pathId, plies: row.plies })),
        timingMs: timing(bulkRows.map((row) => row.elapsedMs)),
        totals: totals(bulkRows),
        totalWallMs: bulkWall,
        gamesPerSecond: BULK_PATHS / Math.max(Number.EPSILON, bulkWall / 1_000),
        rows: bulkRows,
      });
      writeJson(resolve(outputDir, "d1405-bulk-fragment.json"), result);
      expect(result.rows).toHaveLength(BULK_PATHS);
      return;
    }

    const fragments = Object.fromEntries(["20", "40", "80", "bulk"].map((name) => {
      const path = resolve(outputDir, `d1405-${name}-fragment.json`);
      return [name, JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>];
    }));
    const receipts = Object.values(fragments);
    const receiptKeys = receipts.map((value) => [value.commit, value.pgnSha256, value.sourceDigest].join("\0"));
    expect(new Set(receiptKeys).size).toBe(1);
    const native = Object.freeze({
      "20": compactFragment(fragments["20"]!),
      "40": compactFragment(fragments["40"]!),
      "80": compactFragment(fragments["80"]!),
    });
    const native20 = native["20"] as { readonly timingMs: ReturnType<typeof timing> };
    const native80 = native["80"] as { readonly timingMs: ReturnType<typeof timing> };
    const growthRatio = native80.timingMs.p95Ms / Math.max(Number.EPSILON, native20.timingMs.p95Ms);
    const first = receipts[0]!;
    const result = Object.freeze({
      experiment: "D1405",
      measuredAt: new Date().toISOString(),
      commit: first.commit,
      pgnSha256: first.pgnSha256,
      sourceDigest: first.sourceDigest,
      sourcePaths: first.sourcePaths,
      contract: Object.freeze({ lengths: LENGTHS, nativePaths: NATIVE_PATHS, bulkPaths: BULK_PATHS, budgetMs: BUDGET_MS }),
      native,
      growth: Object.freeze({ p95Ratio80To20: growthRatio, gate: growthRatio < 4 ? "PASS" : "FAIL" }),
      bulk: compactFragment(fragments.bulk!),
    });
    const jsonPath = resolve(outputDir, "d1405-longitudinal-cost-results.json");
    const reportPath = resolve(outputDir, "d1405-longitudinal-cost-results.md");
    writeJson(jsonPath, result);
    writeFileSync(reportPath, report(result), "utf8");

    expect(result.sourcePaths as readonly string[]).toContain("packages/runtime/src/semantic-evidence.ts");
    expect((result.bulk as { readonly totals: { readonly paths: number } }).totals.paths).toBe(BULK_PATHS);
  });
});
