// Release-tier §9 control: the production Node adapter behind the exact rendered appliance
// Caddyfile and pinned image. Each run owns only its random network/containers/temp directory.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import https from "node:https";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { CADDY_IMAGE, renderDeployment } from "../render-deployment.mjs";

const root = resolve(import.meta.dirname, "../..");
const work = mkdtempSync(join(tmpdir(), "tabiya-streaming-"));
const id = basename(work).toLowerCase();
const hostname = "tabiya.streaming.test";
const originName = `${id}-origin`;
const proxyName = `${id}-proxy`;
const ownedNetworks = [];
const ownedContainers = [];

function docker(args, allowFailure = false) {
  const result = spawnSync("docker", args, { encoding: "utf8", timeout: 180_000 });
  if (!allowFailure && result.status !== 0) throw new Error(`docker ${args.join(" ")} failed: ${result.stderr || result.error || result.stdout}`);
  return result.stdout.trim();
}

async function until(label, probe, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try { const value = await probe(); if (value !== undefined) return value; } catch (error) { last = error; }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`${label} did not become ready${last ? `: ${last.message}` : ""}`);
}

try {
  const nodeImage = /^FROM (docker\.io\/library\/node:[^\s]+@sha256:[0-9a-f]{64}) /mu.exec(readFileSync(join(root, "apps/server/Dockerfile"), "utf8"))?.[1];
  assert.ok(nodeImage, "the upstream runtime must use the production checksum-pinned Node base");
  const rendered = renderDeployment({ serverImage: nodeImage, maiaImage: nodeImage, maiaManifestDigest: `sha256:${"0".repeat(64)}`, maiaConfigDigests: { "linux/amd64": `sha256:${"0".repeat(64)}`, "linux/arm64": `sha256:${"0".repeat(64)}` } });
  const config = join(work, "Caddyfile.appliance");
  writeFileSync(config, rendered["Caddyfile.appliance"]);
  const data = join(work, "data");
  mkdirSync(data);
  docker(["network", "create", "--internal", id]);
  ownedNetworks.push(id);
  const publicNetwork = `${id}-public`;
  docker(["network", "create", publicNetwork]);
  ownedNetworks.push(publicNetwork);
  ownedContainers.push(originName);
  docker(["run", "--detach", "--name", originName, "--network", id, "--network-alias", "tabiya-proxy-origin", "--env", `TABIYA_FIXTURE_PUBLIC_ORIGIN=https://${hostname}`, "--mount", `type=bind,src=${join(root, ".cache/http-streaming-proxy/upstream.mjs")},dst=/upstream.mjs,readonly`, nodeImage, "node", "/upstream.mjs"]);
  ownedContainers.push(proxyName);
  docker(["run", "--detach", "--name", proxyName, "--network", publicNetwork, "--publish", "127.0.0.1::443", "--env", `TABIYA_PUBLIC_HOSTNAME=${hostname}`, "--mount", `type=bind,src=${config},dst=/etc/caddy/Caddyfile,readonly`, "--mount", `type=bind,src=${data},dst=/data`, CADDY_IMAGE]);
  docker(["network", "connect", id, proxyName]);
  const port = Number(docker(["inspect", "--format", '{{(index (index .NetworkSettings.Ports "443/tcp") 0).HostPort}}', proxyName]));
  assert.ok(Number.isInteger(port) && port > 0, "Docker assigns one disposable loopback TLS port");
  const ca = await until("proxy's public root", () => readFileSync(join(data, "caddy/pki/authorities/local/root.crt")));
  function open(path, method = "GET", { headers = {}, unfinishedUpload = false } = {}) {
    return new Promise((done, reject) => {
      const request = https.request({ hostname: "127.0.0.1", port, servername: hostname, ca, path, method, headers: { host: hostname, ...(method === "POST" ? { origin: `https://${hostname}` } : {}), ...headers }, timeout: 5_000 }, (response) => { response.pause(); done({ request, response }); });
      request.once("error", reject);
      request.once("timeout", () => request.destroy(new Error(`transport deadline: ${method} ${path}`)));
      if (unfinishedUpload) { request.flushHeaders(); request.write("X"); }
      else request.end();
    });
  }
  async function read(path, method = "GET") {
    const { response } = await open(path, method);
    const chunks = [];
    for await (const chunk of response) chunks.push(chunk);
    return { status: response.statusCode, text: Buffer.concat(chunks).toString("utf8") };
  }
  await until("proxy readiness", async () => (await read("/readyz")).status === 200 ? true : undefined);
  console.log(`Pinned proxy ready: ${CADDY_IMAGE}; production Node runtime ${nodeImage}`);
  for (const control of [
    { path: "/policy-refusal", status: 403, code: "ORIGIN_REFUSED", origin: "https://other.example" },
    { path: "/bounded-reader", status: 413, code: "BODY_TOO_LARGE", origin: `https://${hostname}` },
  ]) {
    const { request, response } = await open(control.path, "POST", {
      headers: { origin: control.origin, "content-length": "1000000" }, unfinishedUpload: true,
    });
    try {
      assert.equal(response.statusCode, control.status);
      const chunks = [];
      for await (const chunk of response) chunks.push(chunk);
      assert.equal(JSON.parse(Buffer.concat(chunks).toString("utf8")).error.code, control.code);
      console.log(`PASS unfinished upload receives ${control.code} through rendered TLS proxy`);
    } finally { request.destroy(); }
  }
  for (const type of ["text/event-stream", "application/x-chess-pgn"]) {
    const key = encodeURIComponent(type);
    const { response } = await open(`/stream?id=${key}&type=${key}`);
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["x-stream-source"], "production-node-adapter");
    assert.equal(response.headers["cache-control"], "no-store");
    assert.equal(response.headers["strict-transport-security"], "max-age=31536000");
    const first = once(response, "data");
    response.resume();
    assert.equal((await first)[0].toString("utf8"), "first\n");
    // The producer cannot close until this separate request arrives after the first bytes.
    const remaining = [];
    response.on("data", (chunk) => remaining.push(chunk));
    const ended = once(response, "end");
    assert.equal((await read(`/finish?id=${key}`, "POST")).status, 200);
    await ended;
    assert.equal(Buffer.concat(remaining).toString("utf8"), "last\n");
    console.log(`PASS first-byte-before-completion through rendered TLS proxy (${type})`);
  }
  assert.deepEqual(JSON.parse((await read("/state")).text), { cancelled: 0 });
  const { request, response } = await open("/stream?id=disconnect");
  const first = once(response, "data");
  response.resume();
  await first;
  request.destroy();
  await until("upstream cancellation", async () => JSON.parse((await read("/state")).text).cancelled === 1 ? true : undefined, 5_000);
  console.log("PASS TLS-proxy disconnect cancels the production stream; normal completion did not");
} catch (error) {
  for (const name of ownedContainers) console.error(docker(["logs", "--tail", "30", name], true));
  throw error;
} finally {
  for (const name of ownedContainers.reverse()) docker(["rm", "--force", name], true);
  for (const network of ownedNetworks.reverse()) docker(["network", "rm", network], true);
  rmSync(work, { recursive: true, force: true });
}
