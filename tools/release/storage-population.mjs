// D3746: test-fixture checks for the actual packaged storage journey. These are not
// product endpoints, source admission, a second account inventory or a release receipt.
import assert from "node:assert/strict";

/** Runs inside the unchanged image's Node runtime while the HTTP writer is stopped. */
export async function readStorageRows(database, standalone = false) {
  const { DatabaseSync } = await import("node:sqlite");
  const { copyFileSync, mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  // A published standalone bundle is immutable. SQLite must not create sidecars beside it.
  const directory = standalone ? mkdtempSync(join(tmpdir(), "tabiya-row-read-")) : undefined;
  const target = directory === undefined ? database : join(directory, "database.sqlite");
  let db;
  try {
    if (standalone) copyFileSync(database, target);
    db = new DatabaseSync(target, { readOnly: true });
    return Object.fromEntries(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(({ name }) => {
      if (!/^[a-z_]+$/u.test(name)) throw new Error("Unexpected storage table name");
      const rows = db.prepare(`SELECT * FROM "${name}"`).all().map(row => ({ ...row }));
      rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      return [name, rows];
    }));
  } finally { db?.close(); if (directory !== undefined) rmSync(directory, { recursive: true, force: true }); }
}

export function assertRestoredStorageRows(actual, fixture) {
  assert.deepEqual(actual, fixture.rows, "restored tables/columns/rows must equal the independent pre-backup read");
  assert.deepEqual(Object.keys(actual).sort(), fixture.tables.map(row => row.store).sort(), "current application inventory must be covered exactly");
  for (const dataClass of new Set(fixture.tables.map(row => row.dataClass))) {
    assert.ok(fixture.tables.some(row => row.dataClass === dataClass && actual[row.store]?.length > 0), `empty application data class: ${dataClass}`);
  }
  for (const table of fixture.nonemptyFamilies) assert.ok(actual[table]?.length > 0, `empty required family: ${table}`);
}

/** call(account, path, body?, expectedStatus?): actual HTTP, never direct service handlers. */
export async function verifyRestoredWorkflows(call, fixture, { continuePlay = false } = {}) {
  for (const account of ["keeper", "pupil"]) {
    assert.equal((await call(account, "/auth/session")).learner.id, fixture.accounts[account].learner.id);
  }
  for (const [path, value] of fixture.reads) assert.deepEqual(await call("keeper", path), value, path);
  assert.deepEqual(await call("keeper", "/rating/history"), fixture.ratingHistory);
  assert.notEqual((await call("keeper", "/rating")).rating, null);
  const exported = await call("keeper", "/auth/export", { password: "recovery_keeper-password-long" });
  for (const section of ["ownedRuns", "sharedAccess", "progress", "marks", "repertoires", "drafts", "publications", "liveAndSocial", "behavioralProfiles"]) {
    assert.ok(exported[section].value.length > 0, `restored export section: ${section}`);
  }
  for (const path of fixture.privatePaths) await call("outsider", path, undefined, 404);
  if (!continuePlay) return;
  const replay = await call("keeper", `/runs/${fixture.bot.runId}/opponent-ply`, fixture.bot.request);
  assert.equal(replay.result.kind, "replayed_idempotent");
  const eventsPath = `/runs/${fixture.bot.runId}/events`;
  assert.deepEqual(await call("keeper", eventsPath), fixture.reads.find(([path]) => path === eventsPath)[1]);
  const continued = await call("keeper", `/runs/${fixture.bot.runId}/moves`, { uci: "c7c5" });
  assert.ok(continued.run.events.length > fixture.bot.eventCount, "restored bot game must continue");
  const campaignPath = `/campaign-runs/${fixture.campaign.runId}`;
  const before = await call("keeper", campaignPath);
  const submitted = await call("keeper", `${campaignPath}/nodes/f1-b/submit`, fixture.campaign.submitCommand);
  assert.deepEqual(submitted.result, fixture.campaign.submitResult);
  assert.deepEqual(await call("keeper", campaignPath), before, "campaign replay must not award twice");
  await call("keeper", `${campaignPath}/nodes/f2-a/start`, {
    expectedRevision: before.campaignRun.revision, commandId: "recovery-image-campaign-continue",
  }, 201);
}
