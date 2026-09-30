#!/usr/bin/env node
// Actual source `make up-appliance` journey. No default project, real ports, fixture engine,
// fake release index, external publication or TLS bypass. Only test-owned transport ports differ.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { CADDY_IMAGE } from "./render-deployment.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = /^tabiya-appliance-proof-[0-9a-f-]{36}$/u;
const SHA256 = /^sha256:[0-9a-f]{64}$/u;
const requireCheck = (condition, message) => { if (!condition) throw new Error(`APPLIANCE_PROOF_REFUSED: ${message}`); };

export function loopbackOverlay(httpPort, tlsPort) {
  for (const port of [httpPort, tlsPort]) requireCheck(Number.isSafeInteger(port) && port > 1024 && port <= 65535, "invalid test port");
  requireCheck(httpPort !== tlsPort, "test ports must differ");
  return `services:\n  caddy:\n    ports: !override\n      - "127.0.0.1:${httpPort}:80"\n      - "127.0.0.1:${tlsPort}:443"\n`;
}

export function isolatedEnvironment(inherited, { project, directory, hostname }) {
  requireCheck(PROJECT.test(project), "not a test-owned project");
  const env = Object.fromEntries(Object.entries(inherited).filter(([key]) => !/^(?:COMPOSE_|TABIYA_|MAIA_|ENGINE_MODE$|DATABASE_PATH$)/u.test(key)));
  return { ...env, COMPOSE_DISABLE_ENV_FILE: "1", COMPOSE_PROJECT_NAME: project,
    COMPOSE_FILE: [join(directory, "render", "compose.appliance.yaml"), join(directory, "ports.yaml")].join(delimiter),
    COMPOSE_PATH_SEPARATOR: delimiter, TABIYA_PUBLIC_HOSTNAME: hostname, TABIYA_DATA_VOLUME: `${project}-data`, ENGINE_MODE: "maia" };
}

/** Safety check happens BEFORE starting or removing anything. A foreign project/volume refuses. */
export function validateIsolatedCompose(config, { project, hostname, httpPort, tlsPort, images }) {
  requireCheck(PROJECT.test(project) && config.name === project, "Compose project is not owned by this test");
  requireCheck(images.distribution === "source-build" && images.tier === "cpu" && SHA256.test(images.serverImage)
    && images.maia?.runtime === "oci" && SHA256.test(images.maia.manifestDigest)
    && images.maia.imageId === images.maia.configDigest && SHA256.test(images.maia.configDigest), "real CPU source identity is required");
  assert.deepEqual(Object.keys(config.services).sort(), ["caddy", "maia", "server"]);
  const { server, caddy, maia } = config.services;
  requireCheck(caddy.image === CADDY_IMAGE && caddy.environment?.TABIYA_PUBLIC_HOSTNAME === hostname, "proxy pin/origin changed");
  requireCheck(server.image === images.serverImage && maia.image === images.maia.imageId, "Compose/image receipt mismatch");
  requireCheck(server.environment.ENGINE_MODE === "maia" && server.environment.TABIYA_DEPLOYMENT_PROFILE === "appliance"
    && server.environment.TABIYA_PUBLIC_HOSTNAME === hostname, "wrong actual application mode/origin");
  requireCheck(!("TABIYA_RELEASE_MANIFEST" in server.environment), "source build must not claim a release index");
  requireCheck(maia.environment.MAIA_IMAGE_ID === images.maia.imageId && maia.environment.MAIA_CONFIG_DIGEST === images.maia.configDigest
    && maia.environment.MAIA_MANIFEST_DIGEST === images.maia.manifestDigest, "sidecar identity mismatch");
  requireCheck((server.ports ?? []).length === 0 && (maia.ports ?? []).length === 0, "application or engine is published");
  assert.deepEqual(caddy.ports.map(({ host_ip, published, target, protocol }) => ({ host_ip, published: String(published), target, protocol })).sort((a, b) => a.target - b.target), [
    { host_ip: "127.0.0.1", published: String(httpPort), target: 80, protocol: "tcp" },
    { host_ip: "127.0.0.1", published: String(tlsPort), target: 443, protocol: "tcp" },
  ]);
  requireCheck(config.volumes["tabiya-data"].name === `${project}-data`, "foreign learner volume");
  for (const name of ["caddy-data", "caddy-config"]) requireCheck(config.volumes[name].name === `${project}_${name}`, "foreign CA volume");
  for (const [name, network] of Object.entries(config.networks)) requireCheck(network.name === `${project}_${name}`, "foreign network");
  assert.deepEqual(Object.keys(server.networks).sort(), ["egress", "provider_edge", "proxy_edge"]);
  assert.deepEqual(Object.keys(maia.networks), ["provider_edge"]);
  assert.deepEqual(Object.keys(caddy.networks).sort(), ["proxy_edge", "public_edge"]);
  requireCheck(config.networks.proxy_edge.internal === true && config.networks.provider_edge.internal === true, "internal edge lost");
  requireCheck(Number(server.mem_limit) === 512 * 1024 * 1024 && Number(server.memswap_limit) === Number(server.mem_limit)
    && Number(maia.mem_limit) === 1536 * 1024 * 1024 && Number(maia.memswap_limit) === Number(maia.mem_limit), "CPU resource ceilings changed");
}

/** Prove a committed move, not just a response or disappearance of a Thinking label. */
export function assertPlayedMove(before, after, uci, actor) {
  requireCheck(after.nodes.length === before.nodes.length + 1, "no single committed node");
  const node = after.nodes.find((candidate) => candidate.id === after.activeCursor.nodeId);
  requireCheck(node?.moveUci === uci && node.parentId === before.activeCursor.nodeId, "committed move does not match the requested edge");
  requireCheck(after.events.some((event) => event.seq > before.events.at(-1).seq && event.type === "move.committed"
    && event.data.node?.id === node.id && event.data.node.moveUci === uci && event.data.node.actor === actor), "missing authoritative move event");
}

async function freePort() {
  const socket = createServer();
  await new Promise((done, reject) => { socket.once("error", reject); socket.listen(0, "127.0.0.1", done); });
  const port = socket.address().port;
  await new Promise((done, reject) => socket.close((error) => error ? reject(error) : done()));
  return port;
}

async function until(label, probe, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try { const value = await probe(); if (value !== undefined && value !== false) return value; } catch (error) { last = error; }
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`timed out waiting for ${label}${last ? `: ${last.message}` : ""}`);
}

export async function sourceApplianceDrill({ out }) {
  const project = `tabiya-appliance-proof-${randomUUID()}`;
  const directory = mkdtempSync(join(tmpdir(), `${project}-`));
  const hostname = `${project}.example.test`;
  const httpPort = await freePort();
  let tlsPort = await freePort();
  while (tlsPort === httpPort) tlsPort = await freePort();
  const env = isolatedEnvironment(process.env, { project, directory, hostname });
  const render = join(directory, "render");
  const serverTag = `${project}-server:proof`;
  const maiaTag = `${project}-maia:proof`;
  const makeArgs = [`DEPLOY_RENDER_DIR=${render}`, "DEPLOY_TIER=cpu", `LOCAL_SERVER_IMAGE=${serverTag}`, `LOCAL_MAIA_IMAGE=${maiaTag}`];
  const proof = { protocol: "tabiya.source-appliance-proof@1", scope: "native source build, real model, loopback transport; not a published release or owner-device proof", project, hostname, startedAt: new Date().toISOString(), checks: [], result: "failed" };
  let safeToClean = false;
  let cookie;
  function command(name, args, { allowFailure = false, inherit = false, timeout = 60_000 } = {}) {
    const result = spawnSync(name, args, { cwd: ROOT, env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout, ...(inherit ? { stdio: "inherit" } : {}) });
    if (!allowFailure && (result.error || result.status !== 0)) throw new Error(`${name} failed (${result.status}): ${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
    return result;
  }
  const compose = (...args) => command("docker", ["compose", "--profile", "engines", ...args]);
  function checked(name) { proof.checks.push(name); console.error(`ok  ${name}`); }
  const root = join(directory, "root.crt");
  function http(path, { method = "GET", body, headers = [], trusted = true, plain = false } = {}) {
    const result = command("curl", ["--silent", "--show-error", "--noproxy", "*", "--max-time", "30",
      "--connect-to", `${hostname}:443:127.0.0.1:${tlsPort}`, "--connect-to", `${hostname}:80:127.0.0.1:${httpPort}`,
      ...(trusted ? ["--cacert", root] : []), "--dump-header", join(directory, "headers"), "--output", join(directory, "body"),
      "--write-out", "%{http_code}", "--request", method,
      ...(cookie ? ["--header", `cookie: ${cookie}`] : []),
      ...(body === undefined ? [] : ["--header", "content-type: application/json", "--header", `origin: https://${hostname}`, "--header", "x-writer-id: appliance-proof-writer", "--data-binary", JSON.stringify(body)]),
      ...headers.flatMap((header) => ["--header", header]), `${plain ? "http" : "https"}://${hostname}${path}`], { allowFailure: true });
    return { status: Number(result.stdout), exit: result.status, headers: readFileSync(join(directory, "headers"), "utf8"), body: readFileSync(join(directory, "body"), "utf8") };
  }
  function expect(response, status, label) {
    requireCheck(response.exit === 0 && response.status === status, `${label}: expected ${status}, received ${response.status}/${response.exit}: ${response.body.slice(0, 2000)}`);
    return response;
  }
  const json = (path, options, status = 200) => JSON.parse(expect(http(path, options), status, path).body);
  try {
    writeFileSync(join(directory, "ports.yaml"), loopbackOverlay(httpPort, tlsPort));
    // Preflight checks safety before the actual up wrapper may create resources. No skip-build path.
    command("make", ["deployment-build", ...makeArgs], { inherit: true, timeout: 900_000 });
    const images = JSON.parse(readFileSync(join(render, "source-images.json"), "utf8"));
    proof.images = images;
    validateIsolatedCompose(JSON.parse(compose("config", "--format", "json").stdout), { project, hostname, httpPort, tlsPort, images });
    safeToClean = true;
    checked("owned project, volumes, loopback-only proxy ports and actual immutable CPU identities");
    command("make", ["up-appliance", ...makeArgs], { inherit: true, timeout: 900_000 });
    assert.deepEqual(JSON.parse(readFileSync(join(render, "source-images.json"), "utf8")), images);
    validateIsolatedCompose(JSON.parse(compose("config", "--format", "json").stdout), { project, hostname, httpPort, tlsPort, images });
    checked("actual make up-appliance build/check/start path preserves the preflight subject");
    await until("exported internal CA", () => {
      const result = command("make", ["appliance-ca-export", ...makeArgs, `OUT=${root}`], { allowFailure: true });
      return result.status === 0 ? true : undefined;
    });
    await until("trusted HTTPS readiness", () => { const response = http("/readyz"); return response.exit === 0 && response.status === 200 ? true : undefined; });
    checked("TLS readiness using only the actual make-exported internal CA");
    requireCheck(http("/readyz", { trusted: false }).exit !== 0, "TLS succeeded without trusting the exported CA");
    checked("untrusted TLS fails without a click-through");
    const redirected = http("/", { trusted: false, plain: true });
    requireCheck([301, 302, 307, 308].includes(redirected.status) && redirected.headers.includes(`https://${hostname}/`), "HTTP did not redirect to the exact HTTPS origin");
    checked("HTTP redirects to the exact HTTPS origin");
    requireCheck(expect(http("/"), 200, "web shell").body.includes('<div id="app">'), "built web shell missing");
    const about = json("/about/release");
    requireCheck(about.releaseIndex === "not_attached", "source image claims a verified release index");
    checked("built web shell and truthful source-build About");
    const registration = expect(http("/auth/register", { method: "POST", body: { handle: "applianceproof", password: "appliance-proof-password" } }), 201, "register");
    const issued = /^set-cookie: (__Host-tabiya_session=[^;]+); HttpOnly; SameSite=Strict; Path=\/; Max-Age=\d+; Secure\r?$/imu.exec(registration.headers);
    requireCheck(issued !== null && /^strict-transport-security: max-age=31536000\r?$/imu.test(registration.headers), "cookie/HSTS boundary changed");
    cookie = issued[1];
    checked("real learner registration with Secure host-only cookie and exact HSTS");
    expect(http("/auth/login", { method: "POST", headers: ["content-type: application/json", "origin: https://evil.example.org"] }), 403, "cross-origin refusal");
    expect(http("/capabilities", { headers: ["x-forwarded-host: evil.example.org", "forwarded: host=evil.example.org;proto=http"] }), 200, "forwarded-header replacement");
    checked("cross-origin write refusal and spoofed-forwarded-header replacement");
    const capabilities = json("/capabilities");
    proof.providers = capabilities.providerHealth;
    const maia = capabilities.providerHealth.providers.find((provider) => provider.instanceId === "maia-inference");
    requireCheck(maia?.implementation === "uci_sidecar" && maia.state === "available", "Maia is not an observed real available provider");
    checked("actual application observes ready native Maia, not a fixture or configuration flag");
    const roster = capabilities.policyProfiles.human_common.profiles;
    const profile = roster.find((entry) => entry.reference.id === "human-baseline.1400@1");
    requireCheck(profile !== undefined, "registered baseline bot missing");
    const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: capabilities.engines.map(({ id, version }) => ({ id, version })), modelIds: capabilities.engines.flatMap(({ modelId, version }) => modelId ? [{ id: modelId, version }] : []) } };
    const runId = "appliance-proof-run";
    let run = json("/runs", { method: "POST", body: { id: runId, seed: 1, policyConfig, session: { kind: "position", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", profile: profile.reference } } } }, 201).run;
    const rootNode = run.activeCursor.nodeId;
    const firstBranch = run.activeCursor.branchId;
    const { runEventHeadDigest } = await import(pathToFileURL(join(ROOT, ".cache/deploy/source-appliance-client.mjs")).href);
    const play = (uci) => {
      const next = json(`/runs/${runId}/moves`, { method: "POST", body: { uci } }).run;
      assertPlayedMove(run, next, uci, "user"); run = next;
    };
    const reply = () => {
      const body = { requestId: `botreq_${randomUUID().replaceAll("-", "")}`, expectedNodeId: run.activeCursor.nodeId, expectedBranchId: run.activeCursor.branchId, expectedEventHeadDigest: runEventHeadDigest(run) };
      const response = json(`/runs/${runId}/opponent-ply`, { method: "POST", body });
      requireCheck(response.result?.kind === "committed", "profile bot did not commit");
      const next = response.run;
      const move = next.nodes.find((node) => node.id === next.activeCursor.nodeId)?.moveUci;
      assertPlayedMove(run, next, move, "opponent");
      const replay = json(`/runs/${runId}/opponent-ply`, { method: "POST", body });
      requireCheck(replay.result?.kind === "replayed_idempotent" && replay.run.nodes.length === next.nodes.length, "response-loss retry committed a second bot move");
      run = replay.run;
      proof.botReplies = [...(proof.botReplies ?? []), { requestId: body.requestId, moveUci: move, result: response.result.kind, retry: replay.result.kind }];
    };
    play("e2e4"); reply();
    checked("learner move, actual registered Maia bot reply and idempotent retry");
    run = json(`/runs/${runId}/rewind`, { method: "POST", body: { nodeId: rootNode } }).run;
    run = json(`/runs/${runId}/fork`, { method: "POST", body: { nodeId: rootNode, label: "Try d4" } }).run;
    const secondBranch = run.activeCursor.branchId;
    requireCheck(secondBranch !== firstBranch, "rewind/fork did not create an alternative");
    play("d2d4"); reply();
    const comparison = json(`/runs/${runId}/compare`, { method: "POST", body: { branchIds: [firstBranch, secondBranch] } });
    requireCheck(comparison.comparison !== undefined, "comparison missing");
    proof.run = { id: runId, nodes: run.nodes.length, branches: run.branches.length, profile: profile.reference, compared: [firstBranch, secondBranch] };
    checked("rewind, distinct branch, second real bot reply and comparison through TLS");
    compose("restart", "server");
    await until("restarted HTTPS readiness", () => { const response = http("/readyz"); return response.exit === 0 && response.status === 200 ? true : undefined; });
    const login = expect(http("/auth/login", { method: "POST", body: { handle: "applianceproof", password: "appliance-proof-password" } }), 200, "login after restart");
    cookie = /^set-cookie: (__Host-tabiya_session=[^;]+)/imu.exec(login.headers)?.[1];
    requireCheck(cookie !== undefined, "login did not issue a session");
    const resumed = json(`/runs/${runId}`).run;
    requireCheck(resumed.nodes.length === run.nodes.length && resumed.branches.length === run.branches.length, "restart lost rehearsal branches");
    checked("server restart, secure login and durable rehearsal resume");
    // Content is a separate real boundary; never hide an unresolved-pack failure behind the
    // successfully played ad-hoc position. The held Explorer migration may make this red.
    const packs = json("/packs");
    requireCheck(packs.length > 0, "no actual drill packs served");
    json("/runs", { method: "POST", body: { id: "appliance-proof-pack", seed: 2, policyConfig, session: { kind: "pack", packId: packs[0].id } } }, 201);
    checked("real served pack creates a run without rewriting content");
    proof.result = "passed";
  } catch (error) {
    proof.failure = error.message;
    if (safeToClean) {
      proof.failureServiceLogs = (command("docker", ["compose", "--profile", "engines", "logs", "--tail", "100"], { allowFailure: true }).stdout ?? "").slice(-32_000);
      console.error(proof.failureServiceLogs);
      const ids = (command("docker", ["compose", "--profile", "engines", "ps", "--all", "--quiet"], { allowFailure: true }).stdout ?? "").trim().split("\n").filter(Boolean);
      if (ids.length > 0) {
        const inspected = command("docker", ["inspect", ...ids], { allowFailure: true });
        if (inspected.status === 0) proof.failureServiceStates = JSON.parse(inspected.stdout).map(({ Name, State }) => ({ name: Name, state: State }));
      }
    }
    throw error;
  } finally {
    if (safeToClean) {
      const removed = command("docker", ["compose", "--profile", "engines", "down", "--volumes", "--timeout", "10"], { allowFailure: true });
      proof.cleanup = removed.status === 0 ? "owned project and volumes removed" : "cleanup failed; inspect owned project";
      if (removed.status !== 0) { proof.result = "failed"; console.error(removed.stderr); process.exitCode = 1; }
    }
    for (const tag of [serverTag, maiaTag]) command("docker", ["image", "rm", tag], { allowFailure: true });
    proof.finishedAt = new Date().toISOString();
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(proof, null, 2) + "\n");
    rmSync(directory, { recursive: true, force: true });
    console.error(`source appliance proof: ${proof.result}; ${out}`);
  }
  return proof;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { out: { type: "string", default: ".cache/deploy/source-appliance-proof.json" } } });
    await sourceApplianceDrill({ out: resolve(values.out) });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
