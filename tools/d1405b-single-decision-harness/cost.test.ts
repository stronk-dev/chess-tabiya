// DISPOSABLE research harness — D1405b. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { arch } from "node:os";
import { performance } from "node:perf_hooks";
import { DatabaseSync } from "node:sqlite";

import { afterAll, describe, expect, it } from "vitest";

import {
  AVOIDANCE_EVENT_PROJECTION_IDS,
  SEMANTIC_EVENT_PROJECTION_IDS,
  TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS,
} from "../../packages/runtime/src/evidence-catalog.js";
import { classifyPhase } from "../../packages/runtime/src/phase.js";
import { legalAlternativeEdges, localSemanticEvents } from "../../packages/runtime/src/semantic-evidence.js";
import { authoredRows, importedRows, type ResearchRow } from "../research-chess/populations.js";

type Phase = "opening" | "middlegame" | "endgame";

const ROOT = new URL("../../", import.meta.url);
const SOURCE_PATHS = [
  "packages/runtime/src/evidence-catalog.ts",
  "packages/runtime/src/semantic-evidence.ts",
  "packages/runtime/src/legal-moves.ts",
  "packages/runtime/src/phase.ts",
  "tools/research-chess/populations.ts",
] as const;
const PER_PHASE = 24;
const WARM_PER_PHASE = 3;
const REPEATS = 2;
const BUDGET_MS = 500;

const PATH_IDS = Object.freeze([
  "derived.exchange.trade_completed",
  "derived.tactic.deflection_observed",
  "derived.tactic.attraction_observed",
  "derived.tactic.line_blocker_clearance_observed",
  "derived.tactic.square_clearance_observed",
  "derived.tactic.interference_observed",
  "derived.tactic.check_zwischenzug_observed",
  "derived.tactic.overload_exploitation_observed",
] as const);
const POPULATION_IDS = Object.freeze([...AVOIDANCE_EVENT_PROJECTION_IDS, ...TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS]);
const ALL_IDS = new Set(SEMANTIC_EVENT_PROJECTION_IDS);
const EDGE_IDS = Object.freeze(SEMANTIC_EVENT_PROJECTION_IDS.filter((id) => !POPULATION_IDS.includes(id as never) && !PATH_IDS.includes(id as never)));

function baseProjection(id: string): string {
  const suffix = id.slice("derived.semantic_avoidance.".length);
  return suffix === "loose_piece" ? "rules.tactic.event.loose_piece" : `rules.structural.event.${suffix}`;
}

interface ProjectedRow {
  readonly projectionId: string;
  readonly phase: Phase;
  readonly occurred: number;
  readonly alternativeShare: number;
}

interface Sample {
  readonly id: string;
  readonly phase: Phase;
  readonly repeat: number;
  readonly collectorMs: number;
  readonly sqliteMs: number;
  readonly combinedMs: number;
  readonly legalEdges: number;
  readonly emittedEvents: number;
  readonly avoidanceOpportunities: number;
  readonly publishedRows: number;
}

function sha256(value: string | Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function percentile(values: readonly number[], quantile: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(quantile * sorted.length) - 1)] ?? 0;
}

function timing(values: readonly number[]) {
  return Object.freeze({
    n: values.length,
    p50Ms: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    maxMs: Math.max(0, ...values),
  });
}

function phaseOf(row: ResearchRow): Phase | undefined {
  const phase = classifyPhase(row.parentFen).phase;
  return phase === "unclear" ? undefined : phase;
}

function population(): { readonly warm: readonly ResearchRow[]; readonly measured: readonly ResearchRow[] } {
  const unique = new Map<string, ResearchRow>();
  for (const row of [...importedRows(), ...authoredRows()]) unique.set(`${row.parentFen}\0${row.uci}`, row);
  const buckets: Record<Phase, ResearchRow[]> = { opening: [], middlegame: [], endgame: [] };
  for (const row of [...unique.values()].sort((left, right) => left.id.localeCompare(right.id) || left.parentFen.localeCompare(right.parentFen) || left.uci.localeCompare(right.uci))) {
    const phase = phaseOf(row);
    if (phase !== undefined) buckets[phase].push(row);
  }
  for (const phase of Object.keys(buckets) as Phase[]) expect(buckets[phase].length).toBeGreaterThanOrEqual(PER_PHASE + WARM_PER_PHASE);
  return Object.freeze({
    warm: Object.freeze((Object.keys(buckets) as Phase[]).flatMap((phase) => buckets[phase].slice(0, WARM_PER_PHASE))),
    measured: Object.freeze((Object.keys(buckets) as Phase[]).flatMap((phase) => buckets[phase].slice(WARM_PER_PHASE, WARM_PER_PHASE + PER_PHASE))),
  });
}

function project(row: ResearchRow): { readonly rows: readonly ProjectedRow[]; readonly legalEdges: number; readonly emittedEvents: number; readonly avoidanceOpportunities: number } {
  const alternatives = legalAlternativeEdges(row.parentFen, row.uci);
  const edges = [{ beforeFen: row.parentFen, moveUci: row.uci, afterFen: row.fen }, ...alternatives];
  const eventSets = edges.map((edge) => localSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen));
  const identities = eventSets.map((events) => new Set(events.map((event) => event.projection.id)));
  const phase = phaseOf(row);
  if (phase === undefined) throw new TypeError(`Measured row ${row.id} has unclear phase`);
  const rows: ProjectedRow[] = [];
  for (const projectionId of EDGE_IDS) {
    const count = identities.filter((set) => set.has(projectionId)).length;
    if (count === 0) continue;
    rows.push(Object.freeze({ projectionId, phase, occurred: Number(identities[0]!.has(projectionId)), alternativeShare: alternatives.length === 0 ? 0 : identities.slice(1).filter((set) => set.has(projectionId)).length / alternatives.length }));
  }
  let avoidanceOpportunities = 0;
  for (const projectionId of POPULATION_IDS) {
    const base = baseProjection(projectionId);
    const count = identities.filter((set) => set.has(base)).length;
    if (count === 0 || count === identities.length) continue;
    avoidanceOpportunities += 1;
    rows.push(Object.freeze({ projectionId, phase, occurred: Number(!identities[0]!.has(base)), alternativeShare: alternatives.length === 0 ? 0 : identities.slice(1).filter((set) => set.has(base)).length / alternatives.length }));
  }
  return Object.freeze({ rows: Object.freeze(rows.sort((left, right) => left.projectionId.localeCompare(right.projectionId))), legalEdges: edges.length, emittedEvents: eventSets.reduce((sum, events) => sum + events.length, 0), avoidanceOpportunities });
}

function database(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE learner_observations (
      run_id TEXT NOT NULL, projection_id TEXT NOT NULL, phase TEXT NOT NULL,
      decisions INTEGER NOT NULL, opportunities INTEGER NOT NULL, occurred INTEGER NOT NULL,
      alternative_share_sum REAL NOT NULL, occurred_refs TEXT NOT NULL,
      opportunity_refs TEXT NOT NULL, observed_at TEXT NOT NULL,
      PRIMARY KEY (run_id,projection_id,phase)
    ) STRICT;
    CREATE TABLE learner_observation_jobs (
      run_id TEXT PRIMARY KEY, requested_seq INTEGER NOT NULL, completed_seq INTEGER NOT NULL,
      state TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
  `);
  return db;
}

function publish(db: DatabaseSync, row: ResearchRow, projection: ReturnType<typeof project>): void {
  const insert = db.prepare(`INSERT INTO learner_observations
    (run_id,projection_id,phase,decisions,opportunities,occurred,alternative_share_sum,occurred_refs,opportunity_refs,observed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const value of projection.rows) {
      const ref = JSON.stringify([{ kind: "move", nodeId: row.id, eventSeq: 1 }]);
      insert.run(row.id, value.projectionId, value.phase, 1, 1, value.occurred, value.alternativeShare, value.occurred === 1 ? ref : "[]", ref, "2026-08-24T00:00:00.000Z");
    }
    db.prepare("INSERT INTO learner_observation_jobs(run_id,requested_seq,completed_seq,state,updated_at) VALUES (?,1,1,'complete',?)").run(row.id, "2026-08-24T00:00:00.000Z");
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

describe("D1405b admitted-adapter single-decision cost", () => {
  const db = database();
  afterAll(() => db.close());

  it("measures the preregistered population and writes the binding receipt", () => {
    const output = process.env.D1405B_OUT;
    if (output === undefined || output.length === 0) throw new TypeError("D1405B_OUT is required");
    expect(new Set([...EDGE_IDS, ...POPULATION_IDS, ...PATH_IDS])).toEqual(ALL_IDS);
    expect({ edge: EDGE_IDS.length, population: POPULATION_IDS.length, path: PATH_IDS.length, total: ALL_IDS.size }).toEqual({ edge: 46, population: 13, path: 8, total: 67 });

    const selected = population();
    for (const row of selected.warm) project(row);
    const samples: Sample[] = [];
    for (let repeat = 0; repeat < REPEATS; repeat += 1) for (const row of repeat % 2 === 0 ? selected.measured : [...selected.measured].reverse()) {
      db.prepare("DELETE FROM learner_observations").run();
      db.prepare("DELETE FROM learner_observation_jobs").run();
      const collectorStarted = performance.now();
      const projected = project(row);
      const collectorMs = performance.now() - collectorStarted;
      const sqliteStarted = performance.now();
      publish(db, row, projected);
      const sqliteMs = performance.now() - sqliteStarted;
      samples.push(Object.freeze({ id: row.id, phase: phaseOf(row)!, repeat, collectorMs, sqliteMs, combinedMs: collectorMs + sqliteMs, legalEdges: projected.legalEdges, emittedEvents: projected.emittedEvents, avoidanceOpportunities: projected.avoidanceOpportunities, publishedRows: projected.rows.length }));
    }

    const summarize = (values: readonly Sample[]) => Object.freeze({
      collector: timing(values.map((sample) => sample.collectorMs)),
      sqlite: timing(values.map((sample) => sample.sqliteMs)),
      combined: timing(values.map((sample) => sample.combinedMs)),
      totals: Object.freeze({
        legalEdges: values.reduce((sum, sample) => sum + sample.legalEdges, 0),
        emittedEvents: values.reduce((sum, sample) => sum + sample.emittedEvents, 0),
        avoidanceOpportunities: values.reduce((sum, sample) => sum + sample.avoidanceOpportunities, 0),
        publishedRows: values.reduce((sum, sample) => sum + sample.publishedRows, 0),
      }),
    });
    const byPosition = [...new Set(samples.map((sample) => sample.id))].map((id) => {
      const pair = samples.filter((sample) => sample.id === id);
      return Object.freeze({ id, phase: pair[0]!.phase, combinedMedianMs: percentile(pair.map((sample) => sample.combinedMs), 0.5) });
    });
    const overall = summarize(samples);
    const phases = Object.fromEntries((["opening", "middlegame", "endgame"] as const).map((phase) => [phase, summarize(samples.filter((sample) => sample.phase === phase))]));
    const gate = overall.combined.p95Ms <= BUDGET_MS && Object.values(phases).every((value) => value.combined.p95Ms <= BUDGET_MS) ? "PASS_CANDIDATE" : "REFUSE_NATIVE_INCREMENTAL";
    const sourceDigest = sha256(SOURCE_PATHS.map((path) => `${path}\0${readFileSync(new URL(path, ROOT))}`).join("\0"));
    const result = Object.freeze({ experiment: "D1405b", measuredAt: new Date().toISOString(), commit: process.env.D1405B_COMMIT ?? "unknown", node: process.version, arch: arch(), sourceDigest, contract: { perPhase: PER_PHASE, warmPerPhase: WARM_PER_PHASE, repeats: REPEATS, budgetMs: BUDGET_MS, registry: { edge: EDGE_IDS.length, population: POPULATION_IDS.length, pathDeferred: PATH_IDS.length, total: ALL_IDS.size } }, gate, overall, phases, positionTiming: timing(byPosition.map((value) => value.combinedMedianMs)), samples });
    writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    expect(samples).toHaveLength(144);
  });
});
