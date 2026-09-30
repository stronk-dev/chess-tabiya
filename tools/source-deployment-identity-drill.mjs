#!/usr/bin/env node
// Actual CPU source image, offline real Maia startup and TCP identity/UCI handshake. This does
// not prove the separate application/TLS/account/bot journey or publish a release receipt.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { main as renderSource } from "./source-deployment.mjs";

const { values } = parseArgs({ options: { out: { type: "string", default: ".cache/deploy/local-build" } } });
const out = resolve(values.out);
// Re-establish the OCI→loaded-image join before using any recorded identity as container input.
renderSource(["--out", out, "--tier", "cpu"]);
const images = JSON.parse(readFileSync(join(out, "source-images.json"), "utf8"));
const script = [
  "import json, socket, subprocess, time",
  "p = subprocess.Popen(['python', '/opt/chess-tabiya/maia-sidecar.py'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)",
  "try:",
  "    deadline = time.monotonic() + 180",
  "    while True:",
  "        if p.poll() is not None: raise RuntimeError('real Maia startup failed: ' + p.stdout.read(8192).decode())",
  "        try: s = socket.create_connection(('127.0.0.1', 7000), timeout=2); break",
  "        except OSError:",
  "            if time.monotonic() >= deadline: raise TimeoutError('real Maia readiness deadline')",
  "            time.sleep(0.1)",
  "    with s:",
  "        s.settimeout(5)",
  "        s.sendall(b'tabiya-identity\\n')",
  "        raw = s.makefile('rb').readline(16384)",
  "    identity = json.loads(raw)",
  "    with socket.create_connection(('127.0.0.1', 7000), timeout=5) as s:",
  "        s.settimeout(20)",
  "        s.sendall(b'uci\\nisready\\n')",
  "        lines = s.makefile('rb')",
  "        ready, uci = False, False",
  "        for _ in range(100):",
  "            line = lines.readline(16384).strip()",
  "            if not line: raise RuntimeError('UCI socket closed before readiness')",
  "            if line == b'uciok': uci = True",
  "            if line == b'readyok': ready = True; break",
  "        assert ready and uci, 'the actual model did not answer both UCI commands'",
  "    print(json.dumps({'identity': identity, 'uciok': uci, 'readyok': ready}))",
  "finally:",
  "    p.terminate()",
  "    try: p.wait(timeout=3)",
  "    except subprocess.TimeoutExpired: p.kill(); p.wait(timeout=3)",
].join("\n");
const name = "tabiya-source-identity-" + randomUUID();
const args = ["run", "--rm", "--name", name, "--network", "none", "--memory", "1536m", "--memory-swap", "1536m", "-e", `MAIA_IMAGE_ID=${images.maia.imageId}`, "-e", `MAIA_MANIFEST_DIGEST=${images.maia.manifestDigest}`, "-e", `MAIA_CONFIG_DIGEST=${images.maia.configDigest}`, "-e", "MAIA_LISTEN_HOST=127.0.0.1", "--entrypoint", "python", images.maia.imageId, "-c", script];
let output;
try { output = execFileSync("docker", args, { encoding: "utf8", maxBuffer: 1024 * 1024, timeout: 200_000 }); }
finally {
  // Even a deadline that kills the Docker client cannot strand our test-owned container.
  try { execFileSync("docker", ["rm", "--force", name], { stdio: "ignore" }); } catch { /* --rm already removed it */ }
}
const observed = JSON.parse(output);
assert.deepEqual(observed.identity, images.maia);
assert.equal(observed.uciok, true);
assert.equal(observed.readyok, true);
const receipt = { scope: "native source-build Maia identity and actual model readiness only", platform: images.platform, identity: observed.identity, uciok: true, readyok: true, network: "none", memoryMiB: 1536 };
writeFileSync(join(out, "maia-identity-proof.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt, null, 2));
