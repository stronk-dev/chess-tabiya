// D4200 predecessor input proof, not successor implementation or release qualification.
// Fixed genuine schema35/revision9 data remains readable without any ignored old executable.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";

const prior = JSON.parse(readFileSync(new URL("./fixtures/longitudinal-predecessor-rev9.json", import.meta.url), "utf8")) as {
  sourceCommit: string; schemaVersion: number; derivationRevision: number; owner: string;
  schema: { type: string; name: string; sql: string }[];
  tables: { name: string; rows: Record<string, SQLInputValue>[] }[];
  counts: Record<string, number>;
};
const families = ["learner_observation_denominators", "learner_observations", "learner_structure_stats",
  "learner_game_facts", "learner_choice_facts", "learner_subject_observations"] as const;
const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;
let directory: string, db: DatabaseSync;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "tabiya-revision9-fixture-"));
  db = new DatabaseSync(join(directory, "history.sqlite"));
  db.exec("PRAGMA foreign_keys=OFF; BEGIN");
  for (const item of prior.schema.filter(row => row.type === "table")) db.exec(item.sql);
  for (const table of prior.tables) {
    if (table.rows.length === 0) continue;
    const columns = Object.keys(table.rows[0]!);
    const insert = db.prepare(`INSERT INTO ${quote(table.name)} (${columns.map(quote).join(",")}) VALUES (${columns.map(() => "?").join(",")})`);
    for (const row of table.rows) insert.run(...columns.map(column => row[column]!));
  }
  for (const item of prior.schema.filter(row => row.type !== "table")) db.exec(item.sql);
  db.exec("PRAGMA user_version=35; COMMIT; PRAGMA foreign_keys=ON");
});
afterEach(() => { try { db?.close(); } finally { if (directory !== undefined) rmSync(directory, { recursive: true, force: true }); } });

it("restores actual predecessor publication for both native colors and imports across all six old families", () => {
  expect(prior.schemaVersion).toBe(35); expect(prior.derivationRevision).toBe(9);
  expect(prior.sourceCommit).toBe("ce675044b1b74e66b24f736b30e2f34060cba918");
  expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 35 });
  expect(db.prepare("PRAGMA integrity_check").get()).toEqual({ integrity_check: "ok" });
  expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  expect(Object.keys(prior.counts).sort()).toEqual([...families].sort());
  for (const table of families) {
    expect(Number(db.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n), table).toBe(prior.counts[table]);
    expect(prior.counts[table], table).toBeGreaterThan(0);
    expect(db.prepare(`SELECT DISTINCT derived_rev FROM ${table}`).all()).toEqual([{ derived_rev: 9 }]);
  }
  expect(db.prepare("SELECT run_id FROM learner_observation_jobs ORDER BY run_id").all()).toEqual([
    { run_id: "genuine9-imported" }, { run_id: "genuine9-native-black" }, { run_id: "genuine9-native-white" },
    { run_id: "genuine9-required-risk" }, { run_id: "genuine9-unrelated-abstention" },
  ]);
  expect(db.prepare("SELECT DISTINCT state,derived_rev,requested_seq=completed_seq AS complete FROM learner_observation_jobs").all())
    .toEqual([{ state: "complete", derived_rev: 9, complete: 1 }]);
  expect(db.prepare("SELECT 1 FROM sqlite_master WHERE name='learner_subject_evaluations'").get()).toBeUndefined();
  expect(db.prepare("SELECT DISTINCT source_kind FROM learner_subject_observations ORDER BY source_kind").all())
    .toEqual([{ source_kind: "condition_relation" }, { source_kind: "native_incidence" }]);
});

it("keeps the real whole-decision suppression controls in saved source data for the successor to repair", () => {
  for (const [runId, rootFen] of [
    ["genuine9-unrelated-abstention", "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1"],
    ["genuine9-required-risk", "7k/8/8/8/8/8/8/r6K w - - 0 1"],
  ]) {
    const run = JSON.parse(String(db.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(runId!)!.snapshot_json)) as { nodes: { parentId: string | null; fen: string }[] };
    expect(run.nodes.find(node => node.parentId === null)!.fen).toBe(rootFen);
    expect(db.prepare("SELECT sum(decisions) AS n FROM learner_observation_denominators WHERE run_id=?").get(runId!)).toEqual({ n: 1 });
    expect(db.prepare("SELECT count(*) AS n FROM learner_subject_observations WHERE run_id=?").get(runId!)).toEqual({ n: 0 });
    expect(db.prepare("SELECT count(*) AS n FROM learner_observations WHERE run_id=?").get(runId!)).toEqual({ n: 0 });
    expect(db.prepare("SELECT count(*) AS n FROM imported_games WHERE run_id=?").get(runId!)).toEqual({ n: 1 });
  }
});
