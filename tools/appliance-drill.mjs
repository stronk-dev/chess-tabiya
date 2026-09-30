#!/usr/bin/env node
// Docker-tier production-boundary drills over the BUILT server image (not tsx/source):
//   rfc/storage-backup-recovery.md criterion 10 — cold-volume boot, current restart, manual
//     backup/verify, fresh-volume restore + boot, rehearsal, and live-server maintenance refusal;
// Every drill uses its own Compose project and volumes and removes exactly those afterwards; it
// never touches the default `chess-tabiya` project or its data volume.
//
//   node tools/appliance-drill.mjs storage   [--image chess-tabiya-server:dev]
// Appliance proof now lives in `make appliance-drill`: actual up-wrapper, real CPU engine,
// isolated loopback proxy and played/resumed rehearsal, not this obsolete fixture launch path.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { renderSourceDeployment } from "./render-deployment.mjs";

const mode = process.argv[2];
const imageIndex = process.argv.indexOf("--image");
const image = imageIndex === -1 ? "chess-tabiya-server:dev" : process.argv[imageIndex + 1];
const id = `tabiya-drill-${process.pid}`;
const work = mkdtempSync(join(tmpdir(), `${id}-`));
const cleanups = [];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options, env: { ...process.env, ...(options.env ?? {}) } });
  if (options.allowFailure !== true && result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed (${result.status}):\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function required(condition, message) {
  if (!condition) throw new Error(`DRILL FAILED: ${message}`);
  console.error(`ok  ${message}`);
}

async function until(label, probe, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      const value = await probe();
      if (value !== undefined) return value;
    } catch (error) { last = error; }
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`timed out waiting for ${label}${last === undefined ? "" : `: ${last.message}`}`);
}

function receipt(result) {
  const lines = result.stdout.split("\n");
  if (lines.length !== 2 || lines[1] !== "") throw new Error(`storage-admin stdout is not exactly one receipt line:\n${result.stdout}\n${result.stderr}`);
  return JSON.parse(lines[0]);
}

async function storageDrill() {
  const rendered = renderSourceDeployment({ serverImage: image, maiaImage: "chess-tabiya-maia:dev" });
  for (const [name, text] of Object.entries(rendered)) writeFileSync(join(work, name), text);
  const backups = join(work, "backups");
  run("mkdir", ["-p", backups]);
  run("chmod", ["777", backups]);
  const port = String(20000 + (process.pid % 20000));
  const volumeA = `${id}-a`;
  const volumeB = `${id}-b`;
  const compose = (volume, ...args) => run("docker", ["compose", "-p", id, "-f", join(work, "compose.yaml"), "-f", join(work, "compose.maintenance.yaml"), ...args], { env: { TABIYA_DATA_VOLUME: volume, TABIYA_PORT: port, TABIYA_BACKUP_DIRECTORY: backups } });
  const admin = (volume, ...args) => run("docker", ["compose", "-p", id, "-f", join(work, "compose.yaml"), "-f", join(work, "compose.maintenance.yaml"), "run", "--rm", "-T", "storage-admin", ...args], { env: { TABIYA_DATA_VOLUME: volume, TABIYA_PORT: port, TABIYA_BACKUP_DIRECTORY: backups }, allowFailure: true });
  cleanups.push(() => {
    for (const volume of [volumeA, volumeB]) run("docker", ["compose", "-p", id, "-f", join(work, "compose.yaml"), "down", "--remove-orphans"], { env: { TABIYA_DATA_VOLUME: volume, TABIYA_PORT: port }, allowFailure: true });
    run("docker", ["volume", "rm", "-f", volumeA, volumeB], { allowFailure: true });
  });
  const origin = `http://127.0.0.1:${port}`;
  const ready = async (volume = volumeA) => {
    try {
      await until("readyz", async () => ((await fetch(`${origin}/readyz`)).status === 200 ? true : undefined));
    } catch (error) {
      console.error(run("docker", ["compose", "-p", id, "-f", join(work, "compose.yaml"), "logs", "server"], { env: { TABIYA_DATA_VOLUME: volume, TABIYA_PORT: port }, allowFailure: true }).stdout);
      throw error;
    }
  };

  compose(volumeA, "up", "--detach", "--no-build", "server");
  await ready();
  required(true, "cold-volume boot reaches /readyz from the built image");
  const register = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ handle: "drill", password: "drill-password-long" }) });
  required(register.status === 201, "registers a learner through the loopback origin");
  required(/^tabiya_session=/u.test(register.headers.get("set-cookie") ?? ""), "local profile issues the unprefixed non-Secure cookie");

  const locked = receipt(admin(volumeA, "backup"));
  required(locked.result === "refused" && locked.code === "MAINTENANCE_LOCKED", "maintenance refuses while the server holds the storage lock");

  compose(volumeA, "restart", "server");
  await ready();
  const logs = run("docker", ["compose", "-p", id, "-f", join(work, "compose.yaml"), "logs", "server"], { env: { TABIYA_DATA_VOLUME: volumeA, TABIYA_PORT: port } }).stdout;
  required(logs.includes("\"action\":\"current\""), "current-volume restart runs prepare-start current");

  compose(volumeA, "stop", "server");
  const backup = receipt(admin(volumeA, "backup"));
  required(backup.result === "succeeded" && backup.reason === "manual", `manual backup ${backup.backupId}`);
  const verify = receipt(admin(volumeA, "verify", `/backup/${backup.backupId}`));
  required(verify.result === "succeeded" && verify.compatibility === "current", "the bundle verifies as current");
  required(readdirSync(join(backups, backup.backupId)).sort().join(",") === "database.sqlite,manifest.json", "the published bundle has exactly two files");

  const restored = receipt(admin(volumeB, "restore", `/backup/${backup.backupId}`));
  required(restored.result === "succeeded" && restored.preRestoreBackupId === null, "restores into a fresh volume");
  compose(volumeA, "down");
  compose(volumeB, "up", "--detach", "--no-build", "server");
  await ready(volumeB);
  const login = await fetch(`${origin}/auth/login`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ handle: "drill", password: "drill-password-long" }) });
  required(login.status === 200, "the restored volume boots and keeps the learner identity");
  compose(volumeB, "stop", "server");

  const rehearsal = receipt(admin(volumeB, "rehearsal", `/backup/${backup.backupId}`));
  required(rehearsal.result === "succeeded" && rehearsal.checks.includes("readiness"), "upgrade rehearsal probes the live /readyz route in a disposable database");
  const replaceRefused = receipt(admin(volumeB, "restore", `/backup/${backup.backupId}`));
  required(replaceRefused.result === "refused" && replaceRefused.code === "RESTORE_CONFIRMATION_REQUIRED", "replacing an existing database needs explicit confirmation");
  const replaced = receipt(admin(volumeB, "restore", `/backup/${backup.backupId}`, "--replace-existing", "--confirm-database", "/data/chess-tabiya.sqlite"));
  required(replaced.result === "succeeded" && typeof replaced.preRestoreBackupId === "string", "guarded replacement first publishes a pre_restore bundle");
}


try {
  if (mode === "storage") await storageDrill();
  else {
    console.error("usage: appliance-drill.mjs storage [--image <ref>]; for appliance use make appliance-drill");
    process.exitCode = 2;
  }
  if (process.exitCode === undefined) console.error(`${mode} drill: OK`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  for (const cleanup of cleanups.reverse()) cleanup();
  rmSync(work, { recursive: true, force: true });
}
