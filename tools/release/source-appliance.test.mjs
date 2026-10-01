import assert from "node:assert/strict";
import test from "node:test";
import { assertPlayedMove, isolatedEnvironment, loopbackOverlay, readResumedGraph, validateIsolatedCompose, validateRunningEnvelope } from "../source-appliance-drill.mjs";
import { CADDY_IMAGE } from "../render-deployment.mjs";

const project = "tabiya-appliance-proof-00000000-0000-4000-8000-000000000000";
const hostname = `${project}.example.test`;
const digest = (value) => "sha256:" + value.repeat(64);
const images = { distribution: "source-build", tier: "cpu", serverImage: digest("a"), maia: { runtime: "oci", imageId: digest("b"), configDigest: digest("b"), manifestDigest: digest("c") } };
const subject = { project, hostname, httpPort: 11080, tlsPort: 11443, images };
function fixture() {
  return { name: project,
    services: {
      server: { image: images.serverImage, environment: { ENGINE_MODE: "maia", TABIYA_DEPLOYMENT_PROFILE: "appliance", TABIYA_PUBLIC_HOSTNAME: hostname }, networks: { proxy_edge: {}, provider_edge: {}, egress: {} }, mem_limit: "536870912", memswap_limit: "536870912" },
      maia: { image: images.maia.imageId, environment: { MAIA_IMAGE_ID: images.maia.imageId, MAIA_CONFIG_DIGEST: images.maia.configDigest, MAIA_MANIFEST_DIGEST: images.maia.manifestDigest }, networks: { provider_edge: {} }, mem_limit: "1610612736", memswap_limit: "1610612736" },
      caddy: { image: CADDY_IMAGE, environment: { TABIYA_PUBLIC_HOSTNAME: hostname }, networks: { proxy_edge: {}, public_edge: {} }, ports: [{ host_ip: "127.0.0.1", published: "11080", target: 80, protocol: "tcp" }, { host_ip: "127.0.0.1", published: "11443", target: 443, protocol: "tcp" }] },
    },
    volumes: { "tabiya-data": { name: `${project}-data` }, "caddy-data": { name: `${project}_caddy-data` }, "caddy-config": { name: `${project}_caddy-config` } },
    networks: Object.fromEntries(["proxy_edge", "provider_edge", "public_edge", "egress"].map((name) => [name, { name: `${project}_${name}`, internal: ["proxy_edge", "provider_edge"].includes(name) }])),
  };
}

test("owned CPU appliance preflight accepts actual Compose string resource fields", () => {
  assert.doesNotThrow(() => validateIsolatedCompose(fixture(), subject));
  const config = fixture();
  config.services.server.mem_limit = 536870912;
  config.services.server.memswap_limit = 536870912;
  assert.doesNotThrow(() => validateIsolatedCompose(config, subject));
});

test("foreign project, data/CA volume or network refuses before start or cleanup", () => {
  for (const mutate of [
    (c) => { c.name = "chess-tabiya"; },
    (c) => { c.volumes["tabiya-data"].name = "chess-tabiya_tabiya-data"; },
    (c) => { c.volumes["caddy-data"].name = "foreign_ca"; },
    (c) => { c.networks.egress.name = "foreign_network"; },
  ]) { const config = fixture(); mutate(config); assert.throws(() => validateIsolatedCompose(config, subject)); }
  assert.throws(() => validateIsolatedCompose(fixture(), { ...subject, project: "chess-tabiya" }));
});

test("published app/engine, public test ports, loss of isolation or larger memory refuse", () => {
  for (const mutate of [
    (c) => { c.services.server.ports = [{ published: "3000", target: 3000 }]; },
    (c) => { c.services.maia.ports = [{ published: "7000", target: 7000 }]; },
    (c) => { c.services.caddy.ports[0].host_ip = "0.0.0.0"; },
    (c) => { c.services.caddy.ports.push({ host_ip: "127.0.0.1", published: "12345", target: 12345, protocol: "tcp" }); },
    (c) => { c.networks.provider_edge.internal = false; },
    (c) => { c.services.maia.networks.egress = {}; },
    (c) => { c.services.maia.mem_limit = "3221225472"; },
    (c) => { c.services.maia.memswap_limit = "3221225472"; },
  ]) { const config = fixture(); mutate(config); assert.throws(() => validateIsolatedCompose(config, subject)); }
});

test("fixture/mutable or crossed identity and a source fake release claim refuse", () => {
  for (const mutate of [
    (c) => { c.services.server.image = "chess-tabiya-server:dev"; },
    (c) => { c.services.caddy.image = "caddy:latest"; },
    (c) => { c.services.maia.image = digest("d"); },
    (c) => { c.services.maia.environment.MAIA_MANIFEST_DIGEST = digest("d"); },
    (c) => { c.services.server.environment.TABIYA_RELEASE_MANIFEST = "/missing/index.json"; },
    (c) => { c.services.server.environment.ENGINE_MODE = "mock"; },
  ]) { const config = fixture(); mutate(config); assert.throws(() => validateIsolatedCompose(config, subject)); }
  assert.throws(() => validateIsolatedCompose(fixture(), { ...subject, images: { ...images, tier: "core" } }));
});

test("only the proxy's test transport ports are replaced, not the public origin or app", () => {
  assert.equal(loopbackOverlay(11080, 11443), 'services:\n  caddy:\n    ports: !override\n      - "127.0.0.1:11080:80"\n      - "127.0.0.1:11443:443"\n');
  for (const ports of [[80, 443], [11080, 11080], [11080, 70000], [11080, NaN]]) assert.throws(() => loopbackOverlay(...ports));
});

test("inherited Compose and deployment configuration cannot select operator data in the drill", () => {
  const env = isolatedEnvironment({ PATH: "/usr/bin", COMPOSE_FILE: "/foreign.yaml", COMPOSE_PROJECT_NAME: "chess-tabiya", COMPOSE_ENV_FILES: "/secrets", COMPOSE_PROFILES: "foreign", TABIYA_DATA_VOLUME: "existing", TABIYA_PUBLIC_HOSTNAME: "other.example.org", MAIA_CONFIG_DIGEST: "fake", ENGINE_MODE: "mock", DATABASE_PATH: "/user.db" }, { project, directory: "/tmp/owned", hostname });
  assert.equal(env.PATH, "/usr/bin");
  assert.equal(env.COMPOSE_PROJECT_NAME, project);
  assert.equal(env.TABIYA_DATA_VOLUME, `${project}-data`);
  assert.equal(env.COMPOSE_DISABLE_ENV_FILE, "1");
  assert.equal(env.ENGINE_MODE, "maia");
  for (const key of ["COMPOSE_ENV_FILES", "COMPOSE_PROFILES", "MAIA_CONFIG_DIGEST", "DATABASE_PATH"]) assert.ok(!(key in env));
  assert.throws(() => isolatedEnvironment({}, { project: "chess-tabiya", directory: "/tmp", hostname }));
});

test("a successful response or unchanged node is not a played move", () => {
  const before = { activeCursor: { nodeId: "root" }, nodes: [{ id: "root" }], events: [{ seq: 1 }] };
  const node = { id: "new", parentId: "root", moveUci: "e2e4", actor: "user" };
  const after = { activeCursor: { nodeId: "new" }, nodes: [...before.nodes, node], events: [...before.events, { seq: 2, type: "move.committed", data: { node } }] };
  assert.doesNotThrow(() => assertPlayedMove(before, after, "e2e4", "user"));
  assert.throws(() => assertPlayedMove(before, before, "e2e4", "user"));
  assert.throws(() => assertPlayedMove(before, after, "d2d4", "user"));
  assert.throws(() => assertPlayedMove(before, after, "e2e4", "opponent"));
  assert.throws(() => assertPlayedMove(before, { ...after, events: before.events }, "e2e4", "user"));
});

test("resume reads the real graph route/shape and rejects same-count state corruption", () => {
  const before = { id: "run/with space", nodes: [{ id: "root", fen: "start" }, { id: "child", parentId: "root", fen: "after", moveUci: "e2e4" }], branches: [{ id: "b", rootNodeId: "root" }], activeCursor: { nodeId: "child", branchId: "b" } };
  const graph = structuredClone(before);
  let calls = 0;
  assert.equal(readResumedGraph((path) => {
    calls++;
    assert.equal(path, "/runs/run%2Fwith%20space/graph");
    return { graph };
  }, before), graph);
  assert.equal(calls, 1);
  assert.throws(() => readResumedGraph(() => ({ run: before }), before), /no matching graph/);
  for (const mutate of [
    (g) => { g.id = "foreign"; },
    (g) => { g.nodes[1].fen = "different"; },
    (g) => { g.nodes[1].parentId = "child"; },
    (g) => { g.nodes[1].moveUci = "d2d4"; },
    (g) => { g.branches[0].id = "other"; },
    (g) => { g.activeCursor.nodeId = "root"; },
  ]) {
    const changed = structuredClone(before); mutate(changed);
    assert.throws(() => readResumedGraph(() => ({ graph: changed }), before));
  }
});

test("real runtime envelope refuses foreign ownership, OOM, restart, raised limits and missing peaks", () => {
  const subject = { project, service: "server", limitBytes: 512 * 1024 * 1024 };
  const fixture = () => ({ Config: { Labels: { "com.docker.compose.project": project, "com.docker.compose.service": "server" } }, State: { Running: true, OOMKilled: false }, RestartCount: 0, HostConfig: { Memory: subject.limitBytes, MemorySwap: subject.limitBytes } });
  assert.deepEqual(validateRunningEnvelope(fixture(), subject, 200 * 1024 * 1024), { service: "server", limitBytes: subject.limitBytes, peakBytes: 200 * 1024 * 1024, oomKilled: false, automaticRestarts: 0 });
  for (const mutate of [
    (c) => { c.Config.Labels["com.docker.compose.project"] = "chess-tabiya"; },
    (c) => { c.Config.Labels["com.docker.compose.service"] = "caddy"; },
    (c) => { c.State.Running = false; },
    (c) => { c.State.OOMKilled = true; },
    (c) => { c.RestartCount = 1; },
    (c) => { c.HostConfig.Memory *= 2; },
    (c) => { c.HostConfig.MemorySwap *= 2; },
  ]) { const container = fixture(); mutate(container); assert.throws(() => validateRunningEnvelope(container, subject, 1)); }
  for (const peak of [undefined, NaN, Infinity, 0, -1, 1.5, subject.limitBytes + 1]) assert.throws(() => validateRunningEnvelope(fixture(), subject, peak));
});
