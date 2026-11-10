// Disposable D4181 historical fixture capture, never a production/CI dependency.
// Uses the retained old executable, not current sources with an edited version constant.
// The original bundle stays ignored; permanent tests need only the small SQL fixture.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const original = readFileSync(".cache/longitudinal-rev8/profile-source-cost.original.mjs", "utf8");
assert.equal(createHash("sha256").update(original).digest("hex"),
  "4ef251804f2b2e9342455822a7c75aa9a2900e0845d17f9f3d31fde4e476df77",
  "Fixture capture requires the retained actual revision8 executable");
const marker = "// tools/r12-player-style-harness/profile-source-cost.ts";
const main = original.indexOf(marker, original.indexOf(marker) + marker.length);
assert.ok(main > 0);
const cut = original.indexOf("assert.match(process.version", main);
assert.ok(cut > main);
// Every bundled production byte and original replay helper remains unchanged.
const prefix = original.slice(0, cut);
const outfile = "apps/server/dist/predecessor-eight-fixture.mjs";
mkdirSync("apps/server/dist", { recursive: true });
rmSync(".cache/longitudinal-rev8/generated", { recursive: true, force: true });
const harness = `// DISPOSABLE D4181 migration fixture writer. The production prefix above is byte-for-byte
// original schema34/revision8. Only this cohort/output harness replaces the old200-game main.
import { mkdirSync as genuine8Mkdir, writeFileSync as genuine8Write } from "node:fs";
import { resolve as genuine8Resolve } from "node:path";
const genuine8Output = genuine8Resolve(".cache/longitudinal-rev8/generated");
genuine8Mkdir(genuine8Output, { recursive: true });
assert.equal(OBSERVATION_DERIVATION_REV, 8);
assert.equal(STORAGE_VERSION, 34);
let genuine8Line;
for (const game of readFileSync2("tools/r2-selection-harness/imported-sample.pgn", "utf8").split(/\\n(?=\\[Event )/u)) {
  let parsed; try { parsed = parsePgnMainline(game, { requireMoves: true }); } catch { continue; }
  if (parsed.rootFen !== START || parsed.moves.length < 8) continue;
  const moves = parsed.moves.slice(0, 8).map(value => value.uci);
  try { await native("genuine8-legal-control", moves, "white"); } catch { continue; }
  genuine8Line = moves; break;
}
assert.ok(genuine8Line, "Original fixed CC0 population has a legal8ply line");
const genuine8Storage = new SQLiteRunStorage(genuine8Resolve(genuine8Output, "predecessor.sqlite"), { onMigration: () => {} });
let genuine8Worker;
try {
  genuine8Storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: AT });
  for (const side of ["white", "black"]) genuine8Storage.create(await native(\`genuine8-native-\${side}\`, genuine8Line, side), lease);
  await new RunService(genuine8Storage).importGame({ id: "genuine8-imported", side: "black", opponentPolicy: { mode: "human_common" },
    policyConfig, seed: 7, source: { kind: "pgn", pgn: '[Event "Genuine predecessor fixture"]\\n\\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 *' }, createdAt: AT },
    { writerId: lease.writerId, learnerId: owner.learnerId });
  genuine8Worker = new DatabaseSync3(genuine8Storage.databasePath);
  genuine8Worker.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  assert.equal(genuine8Worker.prepare("PRAGMA user_version").get().user_version, 34);
  const before = genuine8Worker.prepare("SELECT id,snapshot_json,summary_json FROM drill_runs ORDER BY id").all();
  const store = new LongitudinalStore(genuine8Worker);
  let completed = 0;
  for (;;) {
    const batch = runLongitudinalBatch(store, LONGITUDINAL_WORKER_DEFAULTS, "genuine8-fixture-worker");
    assert.equal(batch.failed, 0); assert.equal(batch.conflicts, 0); assert.equal(batch.abandoned, 0);
    completed += batch.completed; if (batch.claimed === 0) break;
  }
  assert.equal(completed, 3);
  assert.deepEqual(genuine8Worker.prepare("SELECT id,snapshot_json,summary_json FROM drill_runs ORDER BY id").all(), before);
  const counts = Object.fromEntries(LONGITUDINAL_TABLES.filter(table => table !== "learner_observation_jobs").map(table => [table,
    genuine8Worker.prepare(\`SELECT COUNT(*) AS n FROM \${table}\`).get().n]));
  for (const count of Object.values(counts)) assert.ok(count > 0, "Every original derived family must be genuinely populated");
  const schema = genuine8Worker.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY rowid").all();
  const tables = schema.filter(row => row.type === "table").map(row => ({ name: row.name,
    rows: genuine8Worker.prepare(\`SELECT * FROM "\${row.name.replaceAll('"', '""')}" ORDER BY rowid\`).all() }));
  const fixture = { schemaVersion: 34, derivationRevision: 8,
    sourceBundleSha256: "4ef251804f2b2e9342455822a7c75aa9a2900e0845d17f9f3d31fde4e476df77",
    scope: "Unchanged original executable production prefix; actual claim/project/publish; synthetic both-color CC0 native8ply and short imported sessions. No current9 retagging or source qualification.",
    schema, tables, counts };
  genuine8Write(genuine8Resolve(genuine8Output, "predecessor.fixture.json"), JSON.stringify(fixture) + "\\n");
  genuine8Worker.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  console.log(JSON.stringify({ schemaVersion: 34, derivationRevision: 8, completed, counts,
    fixture: ".cache/longitudinal-rev8/generated/predecessor.fixture.json" }));
} finally {
  genuine8Worker?.close(); genuine8Storage.close();
}
`;
writeFileSync(outfile, prefix + harness);
execFileSync(process.execPath, [outfile], { stdio: "inherit" });
