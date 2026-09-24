#!/usr/bin/env node
// Docker-tier production-boundary drills over the BUILT server image (not tsx/source):
//   rfc/storage-backup-recovery.md criterion 10 — cold-volume boot, current restart, manual
//     backup/verify, fresh-volume restore + boot, rehearsal, and live-server maintenance refusal;
//   rfc/safe-deployment-profiles.md criteria 3, 5, 7 — the appliance profile behind the pinned
//     Caddy with its internal CA: HTTP→HTTPS, a client trusting only the exported root, no
//     published application port, Secure __Host- cookies and origin refusal.
// Every drill uses its own Compose project and volumes and removes exactly those afterwards; it
// never touches the default `chess-tabiya` project or its data volume.
//
//   node tools/appliance-drill.mjs storage   [--image chess-tabiya-server:dev]
//   node tools/appliance-drill.mjs appliance [--image chess-tabiya-server:dev]
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { renderDeployment } from "./render-deployment.mjs";

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
  const rendered = renderDeployment({ serverImage: image, maiaImage: "chess-tabiya-maia:dev" });
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

async function applianceDrill() {
  const hostname = "tabiya.example.test";
  const rendered = renderDeployment({ serverImage: image, maiaImage: "chess-tabiya-maia:dev" });
  for (const [name, text] of Object.entries(rendered)) writeFileSync(join(work, name), text);
  const volume = `${id}-data`;
  const env = { TABIYA_PUBLIC_HOSTNAME: hostname, TABIYA_DATA_VOLUME: volume };
  const compose = (...args) => run("docker", ["compose", "-p", id, "-f", join(work, "compose.appliance.yaml"), ...args], { env });
  cleanups.push(() => {
    run("docker", ["compose", "-p", id, "-f", join(work, "compose.appliance.yaml"), "down", "--volumes", "--remove-orphans"], { env, allowFailure: true });
    run("docker", ["volume", "rm", "-f", volume], { allowFailure: true });
  });
  compose("up", "--detach", "--no-build");
  const root = join(work, "root.crt");
  await until("Caddy internal root", async () => (compose("cp", "caddy:/data/caddy/pki/authorities/local/root.crt", root) && true));
  const resolve = ["--resolve", `${hostname}:443:127.0.0.1`, "--resolve", `${hostname}:80:127.0.0.1`];
  const curl = (...args) => run("curl", ["-sS", "--max-time", "10", ...resolve, ...args], { allowFailure: true });
  await until("HTTPS readiness", async () => (curl("--cacert", root, "-o", "/dev/null", "-w", "%{http_code}", `https://${hostname}/readyz`).stdout === "200" ? true : undefined));
  required(true, "HTTPS through Caddy reaches /readyz with only the exported root trusted");
  const untrusted = curl("-o", "/dev/null", "-w", "%{http_code}", `https://${hostname}/readyz`);
  required(untrusted.status !== 0, "a client without the exported root fails TLS (no click-through)");
  const redirect = curl("-o", "/dev/null", "-w", "%{http_code} %{redirect_url}", `http://${hostname}/`).stdout;
  required(/^30[178] https:\/\/tabiya\.example\.test\//u.test(redirect), `HTTP redirects to HTTPS (${redirect})`);
  const ports = compose("ps", "--format", "json", "server").stdout;
  required(!/"PublishedPort":\s*[1-9]/u.test(ports), "the application port is not published on the host");
  const headers = curl("--cacert", root, "-D", "-", "-o", "/dev/null", "-H", "content-type: application/json", "-H", `origin: https://${hostname}`, "--data", JSON.stringify({ handle: "appliance", password: "appliance-password-long" }), `https://${hostname}/auth/register`).stdout;
  required(/^set-cookie: __Host-tabiya_session=[^;]+; HttpOnly; SameSite=Strict; Path=\/; Max-Age=\d+; Secure/imu.test(headers), "HTTPS issues a Secure host-only __Host- session cookie");
  required(/^strict-transport-security: max-age=31536000\r?$/imu.test(headers), "HSTS is exactly max-age=31536000");
  const forged = curl("--cacert", root, "-o", "/dev/null", "-w", "%{http_code}", "-H", "content-type: application/json", "-H", "origin: https://evil.example.org", "--data", "{}", `https://${hostname}/auth/login`).stdout;
  required(forged === "403", "a cross-origin write is refused through the proxy");
  const spoofed = curl("--cacert", root, "-o", "/dev/null", "-w", "%{http_code}", "-H", "x-forwarded-host: evil.example.org", "-H", "forwarded: host=evil.example.org;proto=http", `https://${hostname}/capabilities`).stdout;
  required(spoofed === "200", "client-supplied forwarded headers are replaced by Caddy");
}

try {
  if (mode === "storage") await storageDrill();
  else if (mode === "appliance") await applianceDrill();
  else {
    console.error("usage: appliance-drill.mjs <storage|appliance> [--image <ref>]");
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
