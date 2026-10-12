import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import { requireStorageCapacity, storageEnvironment, storageHttpFailure, storageHttpRequest, storageReceipt, validateStorageCompose, validateStorageVolume } from "../appliance-drill.mjs";

const project = "tabiya-storage-drill-00000000-0000-4000-8000-000000000000";
const volume = project + "-a";
const image = "sha256:" + "a".repeat(64);
const subject = { project, volume, port: 14001, image, backups: "/tmp/drill/backups" };

test("recovery probes do not reuse a socket closed during synchronous maintenance or retry a mutation", { timeout: 10_000 }, async t => {
  // A separate server can expire an idle connection while the maintenance client is blocked.
  const child = spawn(process.execPath, ["--input-type=module", "-e", `
    import { createServer } from 'node:http';
    let mutations = 0;
    const server = createServer((request, response) => {
      if (request.method === 'POST') mutations++;
      if (request.url === '/lost-response') {
        request.resume();
        request.on('end', () => request.socket.destroy());
        return;
      }
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ mutations, writerId: request.headers['x-writer-id'] }));
      if (request.url === '/before-maintenance') {
        const socket = request.socket;
        setTimeout(() => socket.destroy(), 100);
      }
    });
    server.keepAliveTimeout = 60_000;
    server.listen(0, '127.0.0.1', () => process.send(server.address().port));
  `], { stdio: ["ignore", "ignore", "inherit", "ipc"] });
  t.after(async () => { const exited = once(child, "exit"); child.kill(); await exited; });
  const [port] = await once(child, "message");
  const origin = `http://127.0.0.1:${port}`;
  function maintenance() {
    const result = spawnSync(process.execPath, ["-e", "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250)"], { timeout: 2000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0);
  }
  // Control: this server otherwise offers a reusable connection, so close is not tautological.
  const reusable = await fetch(origin + "/before-maintenance");
  assert.equal(reusable.headers.get("connection"), "keep-alive");
  assert.equal((await reusable.json()).mutations, 0);
  // Actual recovery helper: fresh connections across the same block, exactly one POST received.
  const before = await storageHttpRequest(origin, "/before-maintenance");
  assert.equal(before.headers.get("connection"), "close");
  assert.deepEqual(await before.json(), { mutations: 0, writerId: "storage-drill-writer" });
  assert.deepEqual(await storageHttpRequest(origin, "/counts", undefined, undefined, "writer-recovery").then(response => response.json()),
    { mutations: 0, writerId: "writer-recovery" });
  await new Promise(setImmediate);
  maintenance();
  const after = await storageHttpRequest(origin, "/mutation", {});
  assert.equal((await after.json()).mutations, 1);
  // A real committed mutation with a lost response still fails. Never silently repeat it.
  await assert.rejects(storageHttpRequest(origin, "/lost-response", {}),
    error => error.cause?.cause?.code === "UND_ERR_SOCKET");
  assert.equal((await storageHttpRequest(origin, "/counts").then(response => response.json())).mutations, 2);
});

test("storage HTTP diagnostics identify the request and transport cause without request data", () => {
  const cause = Object.assign(new Error("other side closed"), { code: "UND_ERR_SOCKET" });
  const original = new TypeError("fetch failed", { cause });
  const error = storageHttpFailure("/runs/storage-drill-run/graph", original);
  assert.equal(error.message, "storage drill HTTP /runs/storage-drill-run/graph: fetch failed (UND_ERR_SOCKET: other side closed)");
  assert.equal(error.cause, original);
  assert.equal(storageHttpFailure("/readyz", new Error("failed")).message, "storage drill HTTP /readyz: failed");
});
function config() {
  const data = { type: "volume", source: "tabiya-data", target: "/data" };
  return { name: project, services: {
    server: { image, environment: { ENGINE_MODE: "mock", TABIYA_DEPLOYMENT_PROFILE: "local", DATABASE_PATH: "/data/chess-tabiya.sqlite" },
      ports: [{ host_ip: "127.0.0.1", published: "14001", target: 3000, protocol: "tcp" }], volumes: [data], networks: { default: {} } },
    "storage-admin": { image, entrypoint: ["node", "apps/server/dist/storage-admin.js"],
      environment: { DATABASE_PATH: "/data/chess-tabiya.sqlite", TABIYA_BACKUP_ROOT: "/backup" },
      network_mode: "none", restart: "no", volumes: [data, { type: "bind", source: subject.backups, target: "/backup" }] },
  }, volumes: { "tabiya-data": { name: volume } }, networks: { default: { name: project + "_default" } } };
}

test("storage isolation strips inherited operator and recursive Make selectors", () => {
  const env = storageEnvironment({ PATH: "/usr/bin", DOCKER_HOST: "unix:///test.sock", COMPOSE_PROJECT_NAME: "chess-tabiya",
    COMPOSE_FILE: "/operator.yaml", COMPOSE_ENV_FILES: "/secrets", COMPOSE_PROFILES: "engines", TABIYA_DATA_VOLUME: "existing",
    TABIYA_BACKUP_DIRECTORY: "/backups", ENGINE_MODE: "maia", MAIA_HOST: "operator", DATABASE_PATH: "/operator.sqlite",
    MAKEFLAGS: "--eval=override COMPOSE_FILE=/operator.yaml", MAKEOVERRIDES: "RESTORE_VOLUME=existing", BACKUP: "/private", RESTORE_VOLUME: "existing", CONFIRM_DATABASE: "/private" },
  { project, directory: "/tmp/drill", volume, port: 14001 });
  assert.equal(env.PATH, "/usr/bin");
  assert.equal(env.DOCKER_HOST, "unix:///test.sock");
  assert.equal(env.COMPOSE_PROJECT_NAME, project);
  assert.equal(env.COMPOSE_FILE, "/tmp/drill/compose.yaml");
  assert.equal(env.COMPOSE_DISABLE_ENV_FILE, "1");
  assert.equal(env.TABIYA_DATA_VOLUME, volume);
  assert.equal(env.TABIYA_BACKUP_DIRECTORY, subject.backups);
  assert.equal(env.ENGINE_MODE, "mock");
  for (const key of ["COMPOSE_ENV_FILES", "COMPOSE_PROFILES", "MAIA_HOST", "DATABASE_PATH", "MAKEFLAGS", "MAKEOVERRIDES", "BACKUP", "RESTORE_VOLUME", "CONFIRM_DATABASE"]) assert.ok(!(key in env), key);
  for (const changed of [{ project: "chess-tabiya" }, { volume: "existing" }, { port: 80 }, { port: NaN }]) {
    assert.throws(() => storageEnvironment({}, { project, directory: "/tmp/drill", volume, port: 14001, ...changed }));
  }
});

test("native storage config preflight accepts only owned matching server and maintenance resources", () => {
  assert.doesNotThrow(() => validateStorageCompose(config(), subject));
  const next = config();
  next.volumes["tabiya-data"].name = project + "-b";
  assert.doesNotThrow(() => validateStorageCompose(next, { ...subject, volume: project + "-b" }));
  delete next.networks.default;
  assert.throws(() => validateStorageCompose(next, { ...subject, volume: project + "-b" }));
});

for (const [name, mutate] of [
  ["operator project", c => { c.name = "chess-tabiya"; }],
  ["operator volume", c => { c.volumes["tabiya-data"].name = "existing"; }],
  ["external volume", c => { c.volumes["tabiya-data"].external = true; }],
  ["extra service", c => { c.services.maia = {}; }],
  ["foreign network", c => { c.networks.default.name = "operator_default"; }],
  ["external network", c => { c.networks.default.external = true; }],
  ["public app port", c => { c.services.server.ports[0].host_ip = "0.0.0.0"; }],
  ["server host-network bypass", c => { c.services.server.network_mode = "host"; }],
  ["maintenance port", c => { c.services["storage-admin"].ports = [{ target: 3000 }]; }],
  ["maintenance network", c => { c.services["storage-admin"].network_mode = "host"; }],
  ["maintenance restart", c => { c.services["storage-admin"].restart = "always"; }],
  ["maintenance dependency", c => { c.services["storage-admin"].depends_on = { server: {} }; }],
  ["different image", c => { c.services["storage-admin"].image = "sha256:" + "b".repeat(64); }],
  ["extra bind mount", c => { c.services.server.volumes.push({ type: "bind", source: "/private", target: "/private" }); }],
  ["wrong backup mount", c => { c.services["storage-admin"].volumes[1].source = "/operator-backups"; }],
  ["read-only data", c => { c.services.server.volumes[0].read_only = true; }],
  ["different database", c => { c.services.server.environment.DATABASE_PATH = "/other.sqlite"; }],
]) {
  test(`storage preflight refuses ${name} before start or cleanup`, () => {
    const value = config(); mutate(value);
    assert.throws(() => validateStorageCompose(value, subject));
  });
}

test("volume deletion requires the exact generated name and live Compose ownership label", () => {
  const info = { Name: volume, Labels: { "com.docker.compose.project": project } };
  assert.doesNotThrow(() => validateStorageVolume(info, project, volume));
  for (const changed of [{ Name: "existing" }, { Labels: {} }, { Labels: { "com.docker.compose.project": "chess-tabiya" } }]) {
    assert.throws(() => validateStorageVolume({ ...info, ...changed }, project, volume));
  }
  assert.throws(() => validateStorageVolume(info, project, "existing"));
  assert.throws(() => validateStorageVolume(info, "chess-tabiya", volume));
});

test("native volume preflight uses available-to-user bytes and inodes, not root's reserved free blocks", () => {
  assert.doesNotThrow(() => requireStorageCapacity({ bavail: 1, bsize: 4096, ffree: 1 }));
  for (const value of [{ bavail: 0 }, { bavail: -1 }, { bavail: NaN }, { bavail: "1" }, { bsize: 0 }, { ffree: 0 }, { ffree: undefined }]) {
    assert.throws(() => requireStorageCapacity({ bavail: 1, bsize: 4096, ffree: 1, ...value }), /no usable space/);
  }
  assert.throws(() => requireStorageCapacity({ bfree: 304108, bavail: 0, bsize: 4096, ffree: 6301611 }));
});

test("Make receipt parsing admits only its exact declared next step, not diagnostic or duplicate JSON", () => {
  const value = { protocol: "tabiya-storage-admin-receipt", protocolVersion: 1, operation: "backup", result: "succeeded" };
  const line = JSON.stringify(value);
  assert.deepEqual(storageReceipt({ stdout: line + "\n" }), value);
  assert.deepEqual(storageReceipt({ stdout: line + "\nStart restored\n" }, ["Start restored"]), value);
  for (const stdout of [line, "diagnostic\n" + line + "\n", line + "\n" + line + "\n", line + "\nExtra\n", "{}\n", line + "\n\n"]) {
    assert.throws(() => storageReceipt({ stdout }));
  }
  assert.throws(() => storageReceipt({ stdout: line + "\nWrong next step\n" }, ["Start restored"]));
});
