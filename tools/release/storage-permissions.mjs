// Native Linux control over a real, already-verified bundle. Only this fixture parent is root;
// the shipped storage-admin commands run as the image's non-root user (1000).
// Run inside storage-drill's owned container/tmpfs, never against operator directories.
export async function linuxBackupPermissions(backupId, selectionSource) {
  const assert = (await import("node:assert/strict")).default;
  const { spawnSync } = await import("node:child_process");
  const { createHash } = await import("node:crypto");
  const fs = await import("node:fs");
  const { join } = await import("node:path");
  assert.equal(process.platform, "linux");
  assert.equal(process.getuid(), 0, "root is only the isolated fixture constructor");
  assert.match(backupId, /^\d{8}T\d{6}\.\d{3}Z-[0-9a-f]{12}$/u);
  const directory = fs.mkdtempSync("/permission-probe/control-");
  fs.chmodSync(directory, 0o711);
  const data = join(directory, "data");
  let backups = join(directory, "backups");
  const offline = join(directory, "operator-copy");
  for (const [path, uid] of [[data, 1000], [backups, 1001], [offline, 1001]]) {
    fs.mkdirSync(path, { mode: 0o700 });
    fs.chownSync(path, uid, uid);
  }
  const database = join(data, "database.sqlite");
  fs.copyFileSync(join("/backup", backupId, "database.sqlite"), database);
  fs.chownSync(database, 1000, 1000);
  fs.chmodSync(database, 0o600);
  const digest = path => createHash("sha256").update(fs.readFileSync(path)).digest("hex");
  const original = digest(database);
  const selector = join(directory, "storage-compose.mjs");
  fs.writeFileSync(selector, selectionSource, { mode: 0o444 });
  function select(uid, root, bundle) {
    return spawnSync(process.execPath, [selector, "--bundle-path"], {
      uid, gid: uid, encoding: "utf8", timeout: 10_000,
      env: { ...process.env, TABIYA_BACKUP_DIRECTORY: root, BACKUP: bundle },
    });
  }
  function install(args) {
    const result = spawnSync("install", args, { encoding: "utf8", timeout: 10_000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
  }
  function command(uid, args) {
    const result = spawnSync(process.execPath, ["/app/apps/server/dist/storage-admin.js", ...args], {
      uid, gid: uid, encoding: "utf8", timeout: 60_000,
      env: { ...process.env, DATABASE_PATH: database, TABIYA_BACKUP_ROOT: backups },
    });
    assert.ifError(result.error);
    const lines = result.stdout.trimEnd().split("\n");
    assert.equal(lines.length, 1, "one real storage-admin receipt, no data/log dump");
    return { status: result.status, receipt: JSON.parse(lines[0]) };
  }
  const blocked = command(1000, ["backup"]);
  assert.equal(blocked.status, 3, "inaccessible work directory is a backup failure, not an ID collision");
  assert.equal(blocked.receipt.result, "failed");
  assert.equal(blocked.receipt.code, "BACKUP_FAILED");
  assert.equal(fs.statSync(backups).uid, 1001, "failure must not change host ownership");
  assert.equal(fs.statSync(backups).mode & 0o777, 0o700);
  assert.deepEqual(fs.readdirSync(backups), []);
  assert.equal(digest(database), original, "failed backup must preserve source bytes");

  // Actual administrator setup of a NEW dedicated service directory. Never chown the
  // operator-owned root that failed above. Production wrappers do not do either operation.
  const foreignRoot = backups;
  backups = join(directory, "service-backups");
  install(["-d", "-m", "0700", "-o", "1000", "-g", "1000", backups]);
  assert.equal(fs.statSync(foreignRoot).uid, 1001);
  const created = command(1000, ["backup"]);
  assert.equal(created.status, 0);
  assert.equal(created.receipt.result, "succeeded");
  const bundle = join(backups, created.receipt.backupId);
  const verified = command(1000, ["verify", bundle]);
  assert.equal(verified.status, 0);
  assert.equal(verified.receipt.result, "succeeded");
  for (const path of [backups, bundle]) {
    assert.equal(fs.statSync(path).uid, 1000);
    assert.equal(fs.statSync(path).mode & 0o777, 0o700);
  }
  const denied = spawnSync(process.execPath, ["-e", "try { require('node:fs').readdirSync(process.argv[1]); process.exit(1); } catch (error) { if (error.code !== 'EACCES') throw error; }", bundle],
    { uid: 1001, gid: 1001, encoding: "utf8", timeout: 10_000 });
  assert.ifError(denied.error);
  assert.equal(denied.status, 0, "unprivileged operator must not read service-private bundles");
  const deniedSelection = select(1001, backups, bundle);
  assert.ifError(deniedSelection.error);
  assert.equal(deniedSelection.status, 2, "foreign host user cannot select a service-private bundle");
  const adminSelection = select(0, backups, bundle);
  assert.ifError(adminSelection.error);
  assert.equal(adminSelection.status, 0, adminSelection.stderr);
  assert.equal(adminSelection.stdout.trim(), `/backup/${created.receipt.backupId}`);

  // Explicit administrator copy to an operator-owned private directory. Both original
  // files and their hashes remain unchanged; the operator verifies only the new copy.
  const copy = join(offline, created.receipt.backupId);
  install(["-d", "-m", "0700", "-o", "1001", "-g", "1001", copy]);
  for (const name of ["database.sqlite", "manifest.json"]) {
    const source = join(bundle, name);
    const destination = join(copy, name);
    install(["-m", "0600", "-o", "1001", "-g", "1001", source, destination]);
    assert.equal(digest(source), digest(destination));
    assert.equal(fs.statSync(source).uid, 1000);
    assert.equal(fs.statSync(destination).uid, 1001);
    assert.equal(fs.statSync(destination).mode & 0o777, 0o600);
  }
  const copyVerified = command(1001, ["verify", copy]);
  assert.equal(copyVerified.status, 0);
  assert.equal(copyVerified.receipt.result, "succeeded");
  const copySelected = select(1001, offline, copy);
  assert.ifError(copySelected.error);
  assert.equal(copySelected.status, 0, copySelected.stderr);
  assert.equal(copySelected.stdout.trim(), `/backup/${created.receipt.backupId}`);
  console.log(JSON.stringify({ runtimeUid: 1000, operatorUid: 1001,
    originalFailure: { result: blocked.receipt.result, code: blocked.receipt.code },
    privateBackupAndVerify: true, foreignReadDenied: true, privateOperatorCopyVerified: true,
    administratorSelectionVerified: true, operatorCopySelectionVerified: true }));
}
