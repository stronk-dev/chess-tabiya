// OPTIONAL D4200 historical fixture capture. Real schema35/revision9 claim/project/publish.
// Capture BEFORE changing production sources; ordinary upgrade tests use only the small JSON.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { appendOpponentPly, commitMove, createRun, digestSessionSource } from "../../packages/runtime/src/index.js";
import { OBSERVATION_DERIVATION_REV } from "../../apps/server/src/longitudinal-registry.js";
import { LONGITUDINAL_TABLES, LongitudinalStore } from "../../apps/server/src/longitudinal-store.js";
import { LONGITUDINAL_WORKER_DEFAULTS } from "../../apps/server/src/longitudinal-worker-config.js";
import { runLongitudinalBatch } from "../../apps/server/src/longitudinal-worker-core.js";
import { RunService } from "../../apps/server/src/service.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "../../apps/server/src/storage.js";

assert.match(process.version, /^v24\./u, "Use the configured Make target");
assert.equal(STORAGE_VERSION, 35, "Capture the actual predecessor before migration changes");
assert.equal(OBSERVATION_DERIVATION_REV, 9, "Never relabel successor output as predecessor data");
// Narrow guard only: tracked source edits. This is not a dependency/untracked-closure audit.
// Regenerate only at a separately reviewed clean capture checkpoint, never during normal CI.
execFileSync("git", ["diff", "--quiet", "HEAD", "--", "apps/server/src", "packages/runtime/src", "packages/schema/src"]);
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const directory = mkdtempSync(join(tmpdir(), "tabiya-revision9-capture-"));
const path = join(directory, "predecessor.sqlite");
const AT = "2026-11-10T00:00:00.000Z", owner = "genuine9-owner";
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const storage = new SQLiteRunStorage(path, { onMigration: () => {} });
let db: DatabaseSync | undefined;
try {
  storage.createLearner({ id: owner, handle: owner, passwordHash: "!", createdAt: AT });
  const lease = { writerId: "genuine9-writer", learnerId: owner };
  for (const side of ["white", "black"] as const) {
    const session = { kind: "position" as const,
      start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side },
      feedbackPolicy: "attempt_end" as const, opponentPolicy: { mode: "human_common" as const } };
    let run = createRun({ id: `genuine9-native-${side}`, session, sessionDigest: await digestSessionSource(session),
      policyConfig, seed: 7, createdAt: AT });
    for (const [index, moveUci] of ["e2e4", "e7e5", "g1f3", "b8c6"].entries()) {
      run = ((index % 2 === 0) === (side === "white") ? commitMove(run, moveUci, { at: AT })
        : appendOpponentPly(run, { moveUci, policyModeApplied: "enumerated",
          candidates: [{ moveUci, rank: 1 }], engine: { id: "migration-fixture", name: "Scripted fixture replay", version: "1", seedHonored: true } }, { at: AT })).run;
    }
    storage.create(run, lease);
  }
  const service = new RunService(storage);
  for (const value of [
    { id: "genuine9-imported", pgn: '[Event "Migration fixture"]\n\n1. e4 e5 2. Nf3 Nc6 *' },
    { id: "genuine9-unrelated-abstention", pgn: '[Event "Original discovered-check source"]\n[SetUp "1"]\n[FEN "k7/8/8/8/8/1p6/PP6/R6K w - - 0 1"]\n\n1. axb3+ *' },
    { id: "genuine9-required-risk", pgn: '[Event "Original required-risk source"]\n[SetUp "1"]\n[FEN "7k/8/8/8/8/8/8/r6K w - - 0 1"]\n\n1. Kh2 *' },
  ]) await service.importGame({ id: value.id, side: "white", opponentPolicy: { mode: "human_common" }, policyConfig,
    seed: 7, source: { kind: "pgn", pgn: value.pgn }, createdAt: AT }, lease);

  db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000");
  assert.equal(db.prepare("PRAGMA user_version").get()!.user_version, 35);
  const originals = db.prepare("SELECT id,snapshot_json,summary_json FROM drill_runs ORDER BY id").all();
  const store = new LongitudinalStore(db);
  let completed = 0;
  for (;;) {
    // No injected population/project callback: production source acquisition and reducer run.
    const batch = runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "genuine9-capture");
    assert.equal(batch.failed, 0, JSON.stringify(store.jobs()));
    assert.equal(batch.conflicts, 0); assert.equal(batch.abandoned, 0);
    completed += batch.completed;
    if (batch.claimed === 0) break;
  }
  assert.equal(completed, 5);
  assert.deepEqual(db.prepare("SELECT id,snapshot_json,summary_json FROM drill_runs ORDER BY id").all(), originals);
  const families = LONGITUDINAL_TABLES.filter(table => table !== "learner_observation_jobs");
  assert.equal(families.length, 6);
  const counts = Object.fromEntries(families.map(table => [table, Number(db!.prepare(`SELECT count(*) AS n FROM ${table}`).get()!.n)]));
  for (const [table, count] of Object.entries(counts)) assert.ok(count > 0, `Actual predecessor family ${table} is populated`);
  assert.deepEqual(db.prepare("SELECT DISTINCT state,derived_rev FROM learner_observation_jobs").all()
    .map(row => ({ ...row })), [{ state: "complete", derived_rev: 9 }]);
  assert.equal(db.prepare("SELECT 1 FROM sqlite_master WHERE name='learner_subject_evaluations'").get(), undefined);
  // The actual predecessor deliberately suppresses all subject opportunities for both controls.
  for (const id of ["genuine9-unrelated-abstention", "genuine9-required-risk"]) {
    assert.ok(Number(db.prepare("SELECT sum(decisions) AS n FROM learner_observation_denominators WHERE run_id=?").get(id)!.n) > 0);
    assert.equal(db.prepare("SELECT count(*) AS n FROM learner_subject_observations WHERE run_id=?").get(id)!.n, 0);
  }
  assert.equal(db.prepare("PRAGMA integrity_check").get()!.integrity_check, "ok");
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  const schema = db.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY rowid").all() as { type: string; name: string; sql: string }[];
  const tables = schema.filter(row => row.type === "table").map(({ name }) => ({ name,
    rows: db!.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all() }));
  const fixture = { sourceCommit, schemaVersion: 35, derivationRevision: 9, owner,
    scope: "Actual unchanged committed production APIs and five genuine claim/project/publish jobs. Native both colors plus imported and two measured availability controls; no successor retagging or content/semantic qualification.",
    schema, tables, counts };
  const output = ".cache/longitudinal-rev9/generated/predecessor.fixture.json";
  mkdirSync(dirname(output), { recursive: true });
  const text = JSON.stringify(fixture) + "\n";
  writeFileSync(output, text);
  console.log(JSON.stringify({ sourceCommit, schemaVersion: 35, derivationRevision: 9, completed,
    counts, bytes: Buffer.byteLength(text), fixture: output }));
} finally { db?.close(); storage.close(); rmSync(directory, { recursive: true, force: true }); }
