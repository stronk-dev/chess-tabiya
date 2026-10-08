import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../../", import.meta.url));

function backup(context, plan, composeEnv = {}, target = "storage-backup", variables = []) {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-wrapper-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const bin = join(directory, "bin");
  mkdirSync(bin);
  const docker = join(bin, "docker");
  copyFileSync(new URL("./fixtures/storage-compose.mjs", import.meta.url), docker);
  chmodSync(docker, 0o700);
  const log = join(directory, "docker.jsonl");
  const result = spawnSync("make", ["--no-print-directory", "--silent", "-f", join(root, "Makefile"), target, "TABIYA_APPLICATION_REVISION=dev+dirty", `TABIYA_BACKUP_DIRECTORY=${join(directory, "backups")}`, ...variables], {
    cwd: root,
    encoding: "utf8",
    timeout: 10_000,
    env: {
      ...process.env,
      PATH: `${bin}:${dirname(process.execPath)}:${process.env.PATH}`,
      MAKEFLAGS: "",
      MFLAGS: "",
      COMPOSE_FILE: undefined,
      COMPOSE_PATH_SEPARATOR: undefined,
      COMPOSE_PROJECT_NAME: undefined,
      ...composeEnv,
      TABIYA_TEST_DOCKER_LOG: log,
      TABIYA_TEST_DOCKER_PLAN: JSON.stringify(plan),
    },
  });
  assert.ifError(result.error);
  const calls = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line)) : [];
  return { ...result, calls, stages: calls.map(({ args }) => args.includes("storage-admin") ? args[args.indexOf("storage-admin") + 1] : args[1]) };
}

for (const [target, operation, before, variables] of [
  ["storage-verify", ["verify", "/backup/fixture-bundle"], [], []],
  ["storage-restore", ["restore", "/backup/fixture-bundle"], ["inspect"], ["RESTORE_VOLUME=restored-fresh-volume"]],
  ["storage-restore-replace", ["restore", "/backup/fixture-bundle", "--replace-existing", "--confirm-database", "/data/chess-tabiya.sqlite"], ["stop"], ["CONFIRM_DATABASE=/data/chess-tabiya.sqlite"]],
  ["storage-rollback", ["rollback", "/backup/fixture-bundle", "--confirm-database", "/data/chess-tabiya.sqlite"], ["stop"], ["CONFIRM_DATABASE=/data/chess-tabiya.sqlite"]],
  ["storage-upgrade-rehearsal", ["rehearsal", "/backup/fixture-bundle"], [], []],
  ["storage-recover", ["recover"], ["stop"], []],
]) {
  test(`${target} preserves the selected deployment and its operation arguments`, context => {
    const result = backup(context, {
      files: ["release install/compose.hosted.yaml", "release install/compose.maintenance.yaml"],
      operation,
    }, {
      COMPOSE_FILE: "release install/compose.hosted.yaml",
      COMPOSE_PROJECT_NAME: "operator-selected-project",
      TABIYA_DATA_VOLUME: "operator-selected-data",
    }, target, ["BACKUP=/configured/backups/fixture-bundle", ...variables]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.stages, [...before, operation[0]]);
    assert.ok(result.calls.every(call => call.project === "operator-selected-project"));
    assert.equal(result.calls.at(-1).volume, target === "storage-restore" ? "restored-fresh-volume" : "operator-selected-data");
  });
}

test("backup stops and restarts a running server, retaining only the admin receipt on stdout", context => {
  const result = backup(context, { running: true });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stages, ["ps", "stop", "backup", "start"]);
  assert.deepEqual(JSON.parse(result.stdout), { operation: "backup", result: "succeeded" });
});

test("backup of a stopped installation neither stops nor starts its server", context => {
  const result = backup(context, { running: false });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stages, ["ps", "backup"]);
});

test("unknown running state refuses before stop or maintenance", context => {
  const result = backup(context, { running: true, psStatus: 17 });
  assert.equal(result.status, 2);
  assert.deepEqual(result.stages, ["ps"]);
  assert.match(result.stderr, /Error 17/);
  assert.equal(result.stdout, "");
});

test("a failed server stop refuses before backup and keeps its diagnostic", context => {
  const result = backup(context, { running: true, stopStatus: 18 });
  assert.equal(result.status, 2);
  assert.deepEqual(result.stages, ["ps", "stop"]);
  assert.match(result.stderr, /fixture stop failed \(18\)/);
  assert.match(result.stderr, /Error 18/);
  assert.equal(result.stdout, "");
});

test("a failed backup still restarts the previously running server and retains its failure", context => {
  const result = backup(context, { running: true, backupStatus: 3 });
  assert.equal(result.status, 2);
  assert.deepEqual(result.stages, ["ps", "stop", "backup", "start"]);
  assert.match(result.stderr, /Error 3/);
  assert.deepEqual(JSON.parse(result.stdout), { operation: "backup", result: "failed" });
});

test("a valid backup does not hide a failed restart", context => {
  const result = backup(context, { running: true, startStatus: 19 });
  assert.equal(result.status, 2);
  assert.deepEqual(result.stages, ["ps", "stop", "backup", "start"]);
  assert.match(result.stderr, /server restart failed/);
  assert.match(result.stderr, /Error 19/);
  assert.deepEqual(JSON.parse(result.stdout), { operation: "backup", result: "succeeded" });
});

test("backup and restart failures preserve the original backup status and report both", context => {
  const result = backup(context, { running: true, backupStatus: 3, startStatus: 19 });
  assert.equal(result.status, 2);
  assert.deepEqual(result.stages, ["ps", "stop", "backup", "start"]);
  assert.match(result.stderr, /fixture backup failed \(3\)/);
  assert.match(result.stderr, /server restart failed/);
  assert.match(result.stderr, /Error 3/);
});

test("failed backup of a stopped installation does not start it", context => {
  const result = backup(context, { running: false, backupStatus: 3 });
  assert.equal(result.status, 2);
  assert.deepEqual(result.stages, ["ps", "backup"]);
  assert.match(result.stderr, /Error 3/);
});

for (const [name, files, separator] of [
  ["rendered appliance", [".cache/deploy/local-build/compose.appliance.yaml"], ":"],
  ["release base and hosted overlay", ["release-install/compose.yaml", "release-install/compose.hosted.yaml"], ":"],
  ["paths containing spaces", ["release install/compose.yaml", "release install/compose.hosted.yaml"], ":"],
  ["explicit Compose path separator", ["release-install/compose.yaml", "release-install/compose.hosted.yaml"], ";"],
]) {
  test(`backup uses the ${name} files and their sibling maintenance overlay`, context => {
    const expected = [...files, join(dirname(files[0]), "compose.maintenance.yaml")];
    const result = backup(context, { running: true, files: expected }, {
      COMPOSE_FILE: files.join(separator),
      COMPOSE_PATH_SEPARATOR: separator,
      COMPOSE_PROJECT_NAME: "operator-selected-project",
      TABIYA_DATA_VOLUME: "operator-selected-data",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.stages, ["ps", "stop", "backup", "start"]);
    assert.ok(result.calls.every(call => call.project === "operator-selected-project" && call.volume === "operator-selected-data"));
  });
}
