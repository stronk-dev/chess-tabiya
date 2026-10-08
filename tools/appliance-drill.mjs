#!/usr/bin/env node
// Built-image recovery through documented Make commands. Mock providers deliberately keep this
// a storage journey, not CPU-bot, published-release, all-data-class or cross-version proof.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { renderSourceDeployment } from "./render-deployment.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = /^tabiya-storage-drill-[0-9a-f-]{36}$/u;
const requireCheck = (condition, message) => { if (!condition) throw new Error(`STORAGE_DRILL_REFUSED: ${message}`); };

export function storageEnvironment(inherited, { project, directory, volume, port }) {
  requireCheck(PROJECT.test(project) && [project + "-a", project + "-b"].includes(volume), "foreign project or volume");
  requireCheck(Number.isInteger(port) && port > 1024 && port <= 65535, "invalid loopback port");
  const env = Object.fromEntries(Object.entries(inherited).filter(([key]) =>
    !/^(?:COMPOSE_|TABIYA_|MAIA_|ENGINE_MODE$|DATABASE_PATH$|MAKEFLAGS$|MFLAGS$|MAKELEVEL$|MAKEOVERRIDES$|BACKUP$|RESTORE_VOLUME$|CONFIRM_DATABASE$)/u.test(key)));
  return { ...env, COMPOSE_DISABLE_ENV_FILE: "1", COMPOSE_PROJECT_NAME: project,
    COMPOSE_FILE: join(directory, "compose.yaml"), COMPOSE_PATH_SEPARATOR: delimiter,
    TABIYA_BACKUP_DIRECTORY: join(directory, "backups"), TABIYA_DATA_VOLUME: volume,
    TABIYA_PORT: String(port), ENGINE_MODE: "mock", TABIYA_APPLICATION_REVISION: "dev+dirty" };
}

/** Before resource creation AND before enabling cleanup; operator resources are never eligible. */
export function validateStorageCompose(config, { project, volume, port, image, backups }) {
  requireCheck(PROJECT.test(project) && config.name === project, "foreign Compose project");
  requireCheck([project + "-a", project + "-b"].includes(volume), "foreign data volume");
  requireCheck(/^sha256:[0-9a-f]{64}$/u.test(image), "immutable built image required");
  assert.deepEqual(Object.keys(config.services).sort(), ["server", "storage-admin"]);
  assert.deepEqual(Object.keys(config.volumes), ["tabiya-data"]);
  requireCheck(config.volumes["tabiya-data"].name === volume && !config.volumes["tabiya-data"].external, "foreign or external volume");
  const server = config.services.server;
  const admin = config.services["storage-admin"];
  requireCheck(server.network_mode === undefined, "server cannot bypass the owned network");
  assert.deepEqual(Object.keys(server.networks), ["default"]);
  assert.deepEqual(Object.keys(config.networks), ["default"]);
  requireCheck(server.image === image && admin.image === image, "server/maintenance image mismatch");
  requireCheck(server.environment.ENGINE_MODE === "mock" && server.environment.TABIYA_DEPLOYMENT_PROFILE === "local"
    && server.environment.DATABASE_PATH === "/data/chess-tabiya.sqlite", "wrong application mode");
  assert.deepEqual(server.ports.map(({ host_ip, published, target, protocol }) => ({ host_ip, published: String(published), target, protocol })),
    [{ host_ip: "127.0.0.1", published: String(port), target: 3000, protocol: "tcp" }]);
  const data = { type: "volume", source: "tabiya-data", target: "/data" };
  const mount = ({ type, source, target, read_only }) => ({ type, source, target, ...(read_only ? { read_only } : {}) });
  assert.deepEqual(server.volumes.map(mount), [data]);
  assert.deepEqual(admin.volumes.map(mount).sort((a, b) => a.target.localeCompare(b.target)),
    [{ type: "bind", source: backups, target: "/backup" }, data]);
  requireCheck(admin.network_mode === "none" && (admin.ports ?? []).length === 0 && admin.restart === "no"
    && Object.keys(admin.depends_on ?? {}).length === 0, "maintenance isolation changed");
  assert.deepEqual(admin.entrypoint, ["node", "apps/server/dist/storage-admin.js"]);
  requireCheck(admin.environment.DATABASE_PATH === "/data/chess-tabiya.sqlite" && admin.environment.TABIYA_BACKUP_ROOT === "/backup", "wrong maintenance paths");
  for (const [name, network] of Object.entries(config.networks)) {
    requireCheck(network.name === `${project}_${name}` && !network.external, "foreign network");
  }
}

export function validateStorageVolume(info, project, name) {
  requireCheck(PROJECT.test(project) && [project + "-a", project + "-b"].includes(name)
    && info.Name === name && info.Labels?.["com.docker.compose.project"] === project, "refusing to remove a foreign volume");
}

export function requireStorageCapacity({ bavail, bsize, ffree }) {
  requireCheck([bavail, bsize, ffree].every(Number.isSafeInteger) && bavail > 0 && bsize > 0 && ffree > 0,
    "Docker /data has no usable space for its non-root runtime user; free Docker space before rerunning (no automatic pruning)");
}

// Make prints a documented next step for fresh restore and rollback; no other stdout is allowed.
export function storageReceipt(result, after = []) {
  const lines = result.stdout.split("\n");
  assert.equal(lines.pop(), "", "storage output must end with one newline");
  assert.deepEqual(lines.slice(1), after, "unexpected storage stdout");
  const value = JSON.parse(lines[0]);
  requireCheck(value.protocol === "tabiya-storage-admin-receipt" && value.protocolVersion === 1, "not a storage-admin receipt");
  return value;
}

async function freePort() {
  const socket = createServer();
  await new Promise((done, reject) => { socket.once("error", reject); socket.listen(0, "127.0.0.1", done); });
  const port = socket.address().port;
  await new Promise((done, reject) => socket.close(error => error ? reject(error) : done()));
  return port;
}

export async function storageDrill({ image: suppliedImage } = {}) {
  const project = `tabiya-storage-drill-${randomUUID()}`;
  const directory = mkdtempSync(join(tmpdir(), `${project}-`));
  const backups = join(directory, "backups");
  mkdirSync(backups, { mode: 0o700 });
  const port = await freePort();
  const volumeA = `${project}-a`;
  const volumeB = `${project}-b`;
  const tag = `${project}-server:proof`;
  const envFor = volume => storageEnvironment(process.env, { project, directory, volume, port });
  function run(command, args, { volume = volumeA, allowFailure = false, inherit = false, timeout = 120_000 } = {}) {
    const result = spawnSync(command, args, { cwd: ROOT, env: envFor(volume), encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024, timeout, ...(inherit ? { stdio: "inherit" } : {}) });
    if (result.error || (!allowFailure && result.status !== 0)) {
      throw new Error(`${command} failed (${result.status}): ${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
    }
    return result;
  }
  const compose = (volume, ...args) => run("docker", ["compose", "-f", join(directory, "compose.yaml"),
    "-f", join(directory, "compose.maintenance.yaml"), "--profile", "maintenance", ...args], { volume });
  const make = (volume, target, ...variables) => run("make", ["--no-print-directory", "--silent", target, ...variables], { volume });
  const admin = (volume, ...args) => run("docker", ["compose", "-f", join(directory, "compose.yaml"),
    "-f", join(directory, "compose.maintenance.yaml"), "run", "--rm", "-T", "storage-admin", ...args], { volume, allowFailure: true });
  const checked = message => console.error(`ok  ${message}`);
  const origin = `http://127.0.0.1:${port}`;
  let safeToClean = false;
  let failure;
  let cookie;
  async function http(path, body, expected = 200) {
    const response = await fetch(origin + path, { headers: { origin, "content-type": "application/json",
      "x-writer-id": "storage-drill-writer", ...(cookie ? { cookie } : {}) },
      ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }), signal: AbortSignal.timeout(15_000) });
    const text = await response.text();
    assert.equal(response.status, expected, `${path}: ${text.slice(0, 1000)}`);
    if (response.headers.has("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
    return JSON.parse(text);
  }
  async function ready(volume) {
    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
      try { await http("/readyz"); return; } catch { await new Promise(done => setTimeout(done, 500)); }
    }
    throw new Error("built server did not reach /readyz");
  }
  try {
    if (suppliedImage === undefined) {
      run("docker", ["build", "--file", "apps/server/Dockerfile", "--tag", tag,
        "--build-arg", "TABIYA_APPLICATION_REVISION=dev+dirty", "."], { inherit: true, timeout: 900_000 });
    }
    const [inspected] = JSON.parse(run("docker", ["image", "inspect", suppliedImage ?? tag]).stdout);
    const image = inspected.Id;
    requireCheck(inspected.Config.User === "node", "built server must retain its non-root runtime user");
    console.error(`storage drill: ${image}, ${inspected.Os}/${inspected.Architecture}; development image, mock providers`);
    for (const [name, text] of Object.entries(renderSourceDeployment({ serverImage: image, maiaImage: "chess-tabiya-maia:dev" }))) {
      writeFileSync(join(directory, name), text);
    }
    for (const volume of [volumeA, volumeB]) {
      validateStorageCompose(JSON.parse(compose(volume, "config", "--format", "json").stdout), { project, volume, port, image, backups });
      const existing = run("docker", ["volume", "inspect", volume], { allowFailure: true });
      requireCheck(existing.status !== 0 && existing.stderr.includes("no such volume"), "data volume already exists or cannot be inspected");
    }
    safeToClean = true;
    checked("owned fresh volumes, loopback port and matching immutable server/maintenance image before startup");
    const capacity = JSON.parse(compose(volumeA, "run", "--rm", "-T", "--entrypoint", "node", "storage-admin", "-e",
      "const {bavail,bsize,ffree}=require('node:fs').statfsSync('/data');console.log(JSON.stringify({bavail,bsize,ffree}));").stdout);
    requireStorageCapacity(capacity);
    checked("native data-volume space available to the unchanged non-root image user");
    compose(volumeA, "up", "--detach", "--no-build", "server");
    await ready(volumeA);
    await http("/auth/register", { handle: "drill", password: "drill-password-long" }, 201);
    requireCheck(cookie?.startsWith("tabiya_session="), "local registration cookie missing");
    const capabilities = await http("/capabilities");
    const policyConfig = { seedMode: "fixed", locus: { executedAt: "server",
      engineIds: capabilities.engines.map(({ id, version }) => ({ id, version })),
      modelIds: capabilities.engines.flatMap(({ modelId, version }) => modelId ? [{ id: modelId, version }] : []) } };
    const runState = (await http("/runs", { id: "storage-drill-run", seed: 1, policyConfig,
      session: { kind: "position", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" },
        feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } } }, 201)).run;
    const root = runState.activeCursor.nodeId;
    const path = `/runs/${runState.id}`;
    await http(path + "/moves", { uci: "e2e4" });
    await http(path + "/rewind", { nodeId: root });
    await http(path + "/fork", { nodeId: root, label: "Try d4" });
    await http(path + "/moves", { uci: "d2d4" });
    const saved = (await http(path + "/graph")).graph;
    requireCheck(saved.branches.length === 2 && saved.nodes.length === 3, "branched rehearsal was not recorded");
    checked("cold boot, learner identity and real recorded rehearsal branches");
    const lockedResult = admin(volumeA, "backup");
    assert.equal(lockedResult.status, 2);
    assert.equal(storageReceipt(lockedResult).code, "MAINTENANCE_LOCKED");
    checked("direct CLI still refuses maintenance while the server owns storage");
    compose(volumeA, "restart", "server");
    await ready(volumeA);
    requireCheck(compose(volumeA, "logs", "server").stdout.includes('"action":"current"'), "current-volume prepare-start missing");

    const backup = storageReceipt(make(volumeA, "storage-backup"));
    requireCheck(backup.result === "succeeded" && backup.reason === "manual", "manual Make backup failed");
    await ready(volumeA);
    assert.deepEqual((await http(path + "/graph")).graph, saved);
    const bundle = join(backups, backup.backupId);
    const verify = storageReceipt(make(volumeA, "storage-verify", `BACKUP=${bundle}`));
    requireCheck(verify.result === "succeeded" && verify.compatibility === "current", "Make verification failed");
    assert.deepEqual(readdirSync(bundle).sort(), ["database.sqlite", "manifest.json"]);
    assert.equal(statSync(backups).mode & 0o777, 0o700);
    checked("Make backup stops/restarts the live server and verifies the private two-file bundle");
    await http(path + "/rewind", { nodeId: root });
    await http(path + "/fork", { nodeId: root, label: "After backup" });
    await http(path + "/moves", { uci: "c2c4" });
    requireCheck((await http(path + "/graph")).graph.branches.length === 3, "post-backup mutation missing");

    const restored = storageReceipt(make(volumeA, "storage-restore", `BACKUP=${bundle}`, `RESTORE_VOLUME=${volumeB}`),
      [`Start the restored installation with: TABIYA_DATA_VOLUME=${volumeB} make up`]);
    requireCheck(restored.result === "succeeded" && restored.preRestoreBackupId === null, "fresh Make restore failed");
    compose(volumeA, "down");
    compose(volumeB, "up", "--detach", "--no-build", "server");
    await ready(volumeB);
    await http("/auth/login", { handle: "drill", password: "drill-password-long" });
    assert.deepEqual((await http(path + "/graph")).graph, saved);
    checked("Make fresh restore + reboot retains exact pre-backup learner, nodes, branches and cursor");
    const rehearsal = storageReceipt(make(volumeB, "storage-upgrade-rehearsal", `BACKUP=${bundle}`));
    requireCheck(rehearsal.result === "succeeded" && rehearsal.checks.includes("readiness"), "Make rehearsal failed");
    assert.deepEqual((await http(path + "/graph")).graph, saved);
    checked("Make rehearsal earns actual readiness without mutating the live restored game");

    const outside = join(directory, "unmounted", backup.backupId);
    mkdirSync(outside, { recursive: true });
    const wrong = run("make", ["--no-print-directory", "--silent", "storage-restore-replace", `BACKUP=${outside}`,
      "CONFIRM_DATABASE=/data/chess-tabiya.sqlite"], { volume: volumeB, allowFailure: true });
    requireCheck(wrong.status !== 0 && wrong.stderr.includes("BACKUP must name"), "wrong-directory bundle was admitted");
    assert.deepEqual((await http(path + "/graph")).graph, saved);
    checked("wrong-directory same-name replacement refuses while the live server remains usable");
    compose(volumeB, "stop", "server");
    const refused = admin(volumeB, "restore", `/backup/${backup.backupId}`);
    assert.equal(refused.status, 2);
    assert.equal(storageReceipt(refused).code, "RESTORE_CONFIRMATION_REQUIRED");
    compose(volumeB, "start", "server");
    await ready(volumeB);
    const replaced = storageReceipt(make(volumeB, "storage-restore-replace", `BACKUP=${bundle}`, "CONFIRM_DATABASE=/data/chess-tabiya.sqlite"));
    requireCheck(replaced.result === "succeeded" && typeof replaced.preRestoreBackupId === "string", "guarded Make replacement failed");
    assert.equal(storageReceipt(make(volumeB, "storage-verify", `BACKUP=${join(backups, replaced.preRestoreBackupId)}`)).result, "succeeded");
    checked("direct CLI confirmation refusal and Make replacement with a verified pre_restore bundle");
    compose(volumeB, "start", "server");
    await ready(volumeB);
    await http(path + "/rewind", { nodeId: root });
    await http(path + "/fork", { nodeId: root, label: "Before rollback" });
    await http(path + "/moves", { uci: "c2c4" });
    requireCheck((await http(path + "/graph")).graph.branches.length === 3, "pre-rollback mutation missing");
    const rolled = storageReceipt(make(volumeB, "storage-rollback", `BACKUP=${bundle}`, "CONFIRM_DATABASE=/data/chess-tabiya.sqlite"),
      ["Now start the release named by compatibleApplicationRevision above; this release would upgrade the database again."]);
    requireCheck(rolled.result === "succeeded" && rolled.compatibleApplicationRevision === backup.applicationRevision, "Make rollback failed");
    const liveHash = compose(volumeB, "run", "--rm", "-T", "--entrypoint", "node", "storage-admin", "-e",
      "console.log(require('node:crypto').createHash('sha256').update(require('node:fs').readFileSync('/data/chess-tabiya.sqlite')).digest('hex'))").stdout.trim();
    assert.equal(liveHash, createHash("sha256").update(readFileSync(join(bundle, "database.sqlite"))).digest("hex"));
    assert.equal(storageReceipt(make(volumeB, "storage-recover")).recovery, "none");
    compose(volumeB, "start", "server");
    await ready(volumeB);
    assert.deepEqual((await http(path + "/graph")).graph, saved);
    checked("Make rollback installs exact snapshot bytes; recover/reboot returns the original game");
  } catch (error) {
    failure = error;
    if (safeToClean) {
      try { console.error(run("docker", ["compose", "logs", "--tail", "80", "server"], { allowFailure: true }).stdout); }
      catch (diagnosticError) { console.error(`cannot read drill diagnostics: ${diagnosticError.message}`); }
    }
  } finally {
    try {
      if (safeToClean) {
        compose(volumeA, "down", "--remove-orphans");
        for (const name of [volumeA, volumeB]) {
          const inspected = run("docker", ["volume", "inspect", name], { allowFailure: true });
          if (inspected.status !== 0 && inspected.stderr.includes("no such volume")) continue;
          requireCheck(inspected.status === 0, "cannot inspect cleanup volume");
          validateStorageVolume(JSON.parse(inspected.stdout)[0], project, name);
          run("docker", ["volume", "rm", name]);
        }
        checked("only the owned project and labelled test volumes removed");
      }
      rmSync(directory, { recursive: true, force: true });
    } catch (error) {
      console.error(`storage drill cleanup failed; retained ${directory}: ${error.message}`);
      failure ??= error;
    }
    if (suppliedImage === undefined) run("docker", ["image", "rm", tag], { allowFailure: true });
  }
  if (failure) throw failure;
  console.error("storage drill: OK (development image; all seven Make maintenance targets; not full release proof)");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values, positionals } = parseArgs({ options: { image: { type: "string" } }, allowPositionals: true });
    requireCheck(positionals.length === 1 && positionals[0] === "storage", "usage: appliance-drill.mjs storage [--image <built-image>]");
    await storageDrill({ image: values.image });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
