// rfc/verifiable-runtime-distribution.md §5/§7/§10 — boot the release image under its hard memory
// limit (no swap), prove readiness and the licence/source surface, drive a bounded probe journey,
// and measure cold-ready, steady RSS and cgroup peak. Optionally preloads the loader trace.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

function docker(args, options = {}) {
  return execFileSync("docker", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, ...options });
}

async function waitFor(check, timeoutMs, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value !== undefined && value !== false) return value;
    } catch (error) {
      last = error;
    }
    await sleep(intervalMs);
  }
  throw new Error(`timed out after ${timeoutMs} ms${last === undefined ? "" : `: ${last.message}`}`);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function exitedWith(name) {
  const state = JSON.parse(docker(["inspect", name, "--format", "{{json .State}}"]));
  return state.Running ? undefined : state.ExitCode;
}

/**
 * Starts the server image. Returns a handle with `base` URL, `name`, `coldReadyMs` and `stop()`.
 * When `expectRefusal` is set, resolves with the exit code instead of waiting for readiness.
 */
export async function startServer({ image, name, memoryMiB = 512, env = {}, mounts = [], traceModule, traceLog = "/tmp/fs-trace.log", readyTimeoutMs = 30_000, expectRefusal = false }) {
  try { docker(["rm", "-f", name], { stdio: "ignore" }); } catch { /* not present */ }
  // The server runs under the release `local` deployment profile (rfc/safe-deployment-profiles.md):
  // loopback publication on one known port, which is also the Host/Origin the boundary admits.
  const hostPort = await freePort();
  const args = ["run", "-d", "--name", name, "--memory", `${memoryMiB}m`, "--memory-swap", `${memoryMiB}m`, "-p", `127.0.0.1:${hostPort}:3000`];
  for (const [key, value] of Object.entries({ TABIYA_DEPLOYMENT_PROFILE: "local", TABIYA_LISTEN_HOST: "0.0.0.0", TABIYA_PUBLIC_PORT: String(hostPort), ...env })) args.push("-e", `${key}=${value}`);
  for (const mount of mounts) args.push("-v", mount);
  if (traceModule !== undefined) {
    args.push("-v", `${dirname(traceModule)}:/trace:ro`, "-e", `TABIYA_FS_TRACE=${traceLog}`, "--entrypoint", "node", image, "--import", "/trace/fs-trace.mjs", "apps/server/dist/main.js");
  } else {
    args.push(image);
  }
  const started = Date.now();
  docker(args);
  if (expectRefusal) {
    const code = await waitFor(() => exitedWith(name), readyTimeoutMs);
    const logs = spawnSync("docker", ["logs", name], { encoding: "utf8" });
    docker(["rm", "-f", name]);
    return { refused: code !== 0, exitCode: code, logs: `${logs.stdout}${logs.stderr}` };
  }
  const base = `http://127.0.0.1:${hostPort}`;
  try {
    await waitFor(async () => {
      if (exitedWith(name) !== undefined) throw new Error(`container exited: ${docker(["logs", name])}`);
      const response = await fetch(`${base}/healthz`);
      return response.ok ? true : undefined;
    }, readyTimeoutMs);
  } catch (error) {
    const logs = (() => { try { return docker(["logs", name]); } catch { return ""; } })();
    docker(["rm", "-f", name]);
    throw new Error(`server did not become ready: ${error.message}\n${logs}`);
  }
  const coldReadyMs = Date.now() - started;
  return {
    base,
    name,
    coldReadyMs,
    exec: (command) => docker(["exec", name, ...command]),
    copyOut: (from, to) => {
      mkdirSync(dirname(to), { recursive: true });
      docker(["cp", `${name}:${from}`, to]);
      return existsSync(to) ? readFileSync(to, "utf8") : "";
    },
    stop: () => docker(["rm", "-f", name]),
  };
}

const round = (bytes) => Math.round((bytes / 1024 / 1024) * 10) / 10;

/**
 * One memory sample. `workingSetMiB` is the cgroup working set (memory.current − inactive_file),
 * the instrument `docker stats` reports and R18 used for the 53.3/76.42 MiB anchors the §5 ceilings
 * were set from; the process VmRSS breakdown is recorded beside it.
 */
export function memorySample(server) {
  const status = server.exec(["cat", "/proc/1/status"]);
  const kb = (field) => Number(new RegExp(`^${field}:\\s+(\\d+)\\s+kB$`, "mu").exec(status)?.[1] ?? Number.NaN) * 1024;
  let workingSet = null;
  try {
    const current = Number(server.exec(["cat", "/sys/fs/cgroup/memory.current"]).trim());
    const inactive = Number(/^inactive_file (\d+)$/mu.exec(server.exec(["cat", "/sys/fs/cgroup/memory.stat"]))?.[1] ?? 0);
    workingSet = round(current - inactive);
  } catch { /* cgroup v1 host: fall back to VmRSS below */ }
  return { workingSetMiB: workingSet ?? round(kb("VmRSS")), vmRssMiB: round(kb("VmRSS")), rssAnonMiB: round(kb("RssAnon")), rssFileMiB: round(kb("RssFile")) };
}

export function cgroupPeakMiB(server) {
  for (const file of ["/sys/fs/cgroup/memory.peak", "/sys/fs/cgroup/memory/memory.max_usage_in_bytes"]) {
    try {
      return Math.round((Number(server.exec(["cat", file]).trim()) / 1024 / 1024) * 10) / 10;
    } catch { /* try the next cgroup layout */ }
  }
  return null;
}

async function expectOk(response, label) {
  if (!response.ok) throw new Error(`${label} returned ${response.status}: ${await response.text()}`);
  return response;
}

/**
 * The bounded release probe journey (NOT the F12-H `core.release_journey@1`): public catalogue
 * reads, every served pack, the licence/source surface, one registered learner and one pack run.
 */
export async function probeJourney(base) {
  const results = {};
  const packs = await (await expectOk(await fetch(`${base}/packs`), "/packs")).json();
  results.packs = packs.length;
  for (const pack of packs) await expectOk(await fetch(`${base}/packs/${encodeURIComponent(pack.id)}`), `/packs/${pack.id}`);
  results.shapes = (await (await expectOk(await fetch(`${base}/shapes`), "/shapes")).json()).length ?? null;
  await expectOk(await fetch(`${base}/principles`), "/principles");
  const capabilities = await (await expectOk(await fetch(`${base}/capabilities`), "/capabilities")).json();
  // The same policy locus the web client declares (apps/web/src/lib/session-controller.ts).
  const policyConfig = {
    seedMode: "fixed",
    locus: {
      executedAt: "server",
      engineIds: capabilities.engines.map((engine) => ({ id: engine.id, version: engine.version })),
      modelIds: capabilities.engines.flatMap((engine) => (engine.modelId === undefined ? [] : [{ id: engine.modelId, version: engine.version }])),
    },
  };
  const index = await (await expectOk(await fetch(`${base}/`), "/")).text();
  if (!index.includes('<div id="app">')) throw new Error("the web shell was not served");
  const aboutPage = await (await expectOk(await fetch(`${base}/about`), "/about")).text();
  const about = await (await expectOk(await fetch(`${base}/about/release`), "/about/release")).json();
  const notice = await (await expectOk(await fetch(`${base}/about/NOTICE.txt`), "/about/NOTICE.txt")).text();
  const licence = await (await expectOk(await fetch(`${base}/about/LICENSE`), "/about/LICENSE")).text();
  results.about = { releaseIndex: about.releaseIndex, sourceRevision: about.release?.sourceRevision ?? null, licence: about.application.licence };
  if (!aboutPage.includes("Licence &amp; source") || !notice.includes("ABSOLUTELY NO WARRANTY") || !licence.includes("GNU AFFERO GENERAL PUBLIC LICENSE")) throw new Error("the About surface is incomplete");
  const register = await expectOk(await fetch(`${base}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: `probe${Date.now()}`, password: "release-probe-password" }) }), "/auth/register");
  const cookie = (register.headers.get("set-cookie") ?? "").split(";")[0];
  const run = await (await expectOk(await fetch(`${base}/runs`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "release-probe-writer" }, body: JSON.stringify({ id: `release-probe-${Date.now()}`, seed: 1, policyConfig, session: { kind: "pack", packId: packs[0].id } }) }), "POST /runs")).json();
  results.run = typeof run.run?.id === "string";
  await expectOk(await fetch(`${base}/runs`, { headers: { cookie } }), "GET /runs");
  return { results, about, aboutPage };
}

/** Classifies a loader trace against the bundle manifest: every /app read must be allow-listed. */
export const LOADER_ROOTS = Object.freeze(["content/packs", "content/drafts", "content/shapes", "content/principles", "content/concepts", "content/concepts/revisions", "content/valence", "content/campaigns"]);

export function classifyTrace(traceText, manifest) {
  const allowedFiles = new Set([...manifest.files.map((file) => `/app/${file.path}`), "/app/runtime-content/manifest.json", "/app/runtime-content/facts.json"]);
  // The pack registry probes the ledger/manifest sidecars of every admitted pack; for a pack that has
  // none the probe is an ENOENT, not a read of content outside the allow-list.
  const sidecarProbes = new Set(manifest.files.filter((file) => file.family === "pack").flatMap((file) => {
    const stem = file.path.endsWith("/pack.json") ? file.path.slice(0, -"pack.json".length) : file.path.slice(0, -".json".length).concat(".");
    return ["evidence.json", "sources.json"].map((name) => `/app/${stem}${name}`);
  }));
  const allowedDirectories = new Set(["/app", ...LOADER_ROOTS.map((root) => `/app/${root}`)]);
  for (const file of allowedFiles) {
    let directory = dirname(file);
    while (directory !== "/" && !allowedDirectories.has(directory)) {
      allowedDirectories.add(directory);
      directory = dirname(directory);
    }
  }
  const violations = new Set();
  const reads = new Set();
  for (const line of traceText.split("\n")) {
    const [, rawPath] = line.split("\t");
    if (rawPath === undefined) continue;
    const path = rawPath.startsWith("/") ? rawPath : join("/app", rawPath);
    if (!path.startsWith("/app")) continue;
    if (path.startsWith("/app/apps/server/dist/") || path.startsWith("/app/apps/web/dist")) continue;
    if (allowedFiles.has(path)) { reads.add(path); continue; }
    if (sidecarProbes.has(path)) continue;
    if (allowedDirectories.has(path.replace(/\/$/u, ""))) continue;
    violations.add(path);
  }
  const families = new Set(manifest.files.map((file) => file.family));
  const exercised = new Set(manifest.files.filter((file) => reads.has(`/app/${file.path}`)).map((file) => file.family));
  return {
    violations: [...violations].sort(),
    unexercisedFamilies: [...families].filter((family) => !exercised.has(family)).sort(),
    reads: reads.size,
  };
}
