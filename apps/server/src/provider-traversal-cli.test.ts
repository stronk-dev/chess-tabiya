// Packaged operator entry, with a labelled mechanical TCP fixture, not native-model evidence.
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer, type AddressInfo, type Socket } from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { providerTraversalEngineSpecs } from "./provider-traversal.js";
import { MAIA3_MODEL_ID, MAIA3_SOURCE_COMMIT, maiaNetworkSpec } from "./maia.js";

const directory = mkdtempSync(join(tmpdir(), "tabiya-traversal-cli-")), built = join(directory, "provider-traversal.js");
const run = promisify(execFile), cleanups: (() => Promise<void>)[] = [];
beforeAll(async () => { await run(join(process.cwd(), "node_modules/.bin/esbuild"), ["apps/server/src/provider-traversal.ts", "--bundle", "--platform=node", "--format=esm", "--external:typescript", `--outfile=${built}`]); });
afterEach(async () => { for (const close of cleanups.splice(0)) await close(); });
afterAll(() => rmSync(directory, { recursive: true, force: true }));
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const request = { position: { kind: "exact_fen", fen: START }, requestedModel: { id: MAIA3_MODEL_ID, version: MAIA3_SOURCE_COMMIT },
  band: 1500, temperature: 0.8, topP: 0.92, requestedWidth: 2, timeoutMs: 2000 };
async function sidecar(identity = true) {
  const commands: string[] = [], sockets = new Set<Socket>(); let connections = 0;
  const server = createServer(socket => {
    connections += 1;
    sockets.add(socket); socket.on("close", () => sockets.delete(socket)); socket.setEncoding("utf8"); let buffer = "";
    socket.on("data", chunk => {
      buffer += chunk;
      while (buffer.includes("\n")) {
        const end = buffer.indexOf("\n"), line = buffer.slice(0, end).trim(); buffer = buffer.slice(end + 1); commands.push(line);
        if (line === "tabiya-identity") socket.end(`${JSON.stringify(identity ? { runtime: "oci", imageId: "mechanical-cli-fixture",
          manifestDigest: `sha256:${"a".repeat(64)}`, configDigest: `sha256:${"b".repeat(64)}` } : { invalid: true })}\n`);
        if (line === "uci") socket.write(["id name Maia3 CLI fixture", "id author software test",
          "option name Elo type spin default 1500 min 0 max 3000", "option name MultiPV type spin default 1 min 1 max 256",
          "option name Temperature type string default 0.8", "option name TopP type string default 0.92", "uciok", ""].join("\n"));
        if (line === "isready") socket.write("readyok\n");
        if (line === "go") socket.write("info depth 1 multipv 1 policy 0.4 score cp 12 wdl 350 400 250 pv e2e4\ninfo depth 1 multipv 2 policy 0.2 pv d2d4\nbestmove d2d4\n");
        if (line === "quit") socket.end();
      }
    });
  });
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  let closed = false;
  const close = async () => { if (closed) return; closed = true; for (const socket of sockets) socket.destroy(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); };
  cleanups.push(close);
  return { commands, close, get connections() { return connections; }, port: (server.address() as AddressInfo).port };
}
async function cli(args: readonly string[], input: unknown, port: number) {
  return new Promise<{ code: number; value: Record<string, unknown>; stderr: string }>((resolve, reject) => {
    const child = execFile(process.execPath, [built, ...args], { env: { ...process.env, PROVIDER_TRAVERSAL_OFFLINE: "1",
      STOCKFISH_COMMAND: "/nonexistent/stockfish-cli-fixture", MAIA_HOST: "127.0.0.1", MAIA_PORT: String(port) } }, (error, stdout, stderr) => {
      try { resolve({ code: error === null ? 0 : Number((error as { code?: number }).code ?? 1), value: JSON.parse(stdout), stderr }); } catch { reject(new Error(`CLI output was not JSON: ${stdout}; ${stderr}`)); }
    });
    child.stdin!.end(typeof input === "string" ? input : JSON.stringify(input));
  });
}

describe("packaged seven-operation provider CLI composition", () => {
  it("uses the existing pinned Maia network spec beside unchanged analysis options", () => {
    const specs = providerTraversalEngineSpecs({ STOCKFISH_COMMAND: "test-stockfish", MAIA_HOST: "test-maia", MAIA_PORT: "7123" });
    expect(specs.find(spec => spec.id === "maia-5m")).toEqual(maiaNetworkSpec("test-maia", 7123));
    expect(specs.find(spec => spec.id === "stockfish-analysis")).toMatchObject({ command: "test-stockfish", options: { Threads: 1, Hash: 16, MultiPV: 1 } });
  });
  it.each(["maia-policy-page", "maia-inference-task"])("executes actual built %s through the network bridge, identity probe and source factory", async operation => {
    const server = await sidecar(), result = await cli([operation], operation === "maia-policy-page" ? request : { ...request, sampleRequestId: "00000000-0000-4000-8000-000000000001" }, server.port);
    expect(result.code, JSON.stringify(result)).toBe(0);
    expect(result.value).toMatchObject({ kind: "evidence_success", operation: operation === "maia-policy-page" ? "maia.policy_page@1" : "maia.inference_task@1",
      projection: operation === "maia-policy-page" ? "human.maia.policy_page@1" : "human.maia.inference_task@1", generation: 1 });
    expect(server.commands.filter(line => line === "tabiya-identity")).toHaveLength(1); expect(server.commands.filter(line => line === "go")).toHaveLength(1);
    expect(server.commands).toContain(`position fen ${START}`); expect(server.commands).toContain("setoption name MultiPV value 2");
    expect(result.value).not.toHaveProperty("candidates"); expect(result.value).not.toHaveProperty("termination"); expect(result.value).not.toHaveProperty("transcript");
  });
  it("refuses a malformed actual sidecar artifact rather than substituting the Node bridge binary", async () => {
    const server = await sidecar(false), result = await cli(["maia-inference-task"], { ...request, sampleRequestId: "00000000-0000-4000-8000-000000000001" }, server.port);
    expect(result.code).toBe(3); expect(result.value).toMatchObject({ kind: "source_failure", reason: "identity_mismatch" });
    expect(server.commands).toContain("tabiya-identity");
    // Existing descriptor validates the captured nullable artifact after its same-generation
    // exchange. It must emit no source evidence; zero query is not that accepted contract.
    for (const field of ["projection", "responseDigest", "payloadDigest", "evidence", "payload"]) expect(result.value).not.toHaveProperty(field);
  });
  it("returns a typed unavailable result from the actual packaged entry when the sidecar is absent", async () => {
    const server = await sidecar(); await server.close();
    const result = await cli(["maia-inference-task"], { ...request, sampleRequestId: "00000000-0000-4000-8000-000000000001" }, server.port);
    expect(result.code).toBe(3); expect(result.value).toMatchObject({ kind: "source_failure", reason: "provider_unavailable" });
    expect(result.value).not.toHaveProperty("projection"); expect(server.connections).toBe(0);
  });
  it.each(["unknown", "extra_argument", "invalid_json", "invalid_request"])("refuses %s before any sidecar connection", async fault => {
    const server = await sidecar();
    const args = fault === "unknown" ? ["not-an-operation"] : fault === "extra_argument" ? ["maia-inference-task", "extra"] : ["maia-inference-task"];
    const input = fault === "invalid_json" ? "not-json" : { ...request, sampleRequestId: "00000000-0000-4000-8000-000000000001", extra: true };
    const result = await cli(args, input, server.port);
    expect(result.code).toBe(64); expect(result.value).toMatchObject({ kind: "usage_error" }); expect(server.commands).toEqual([]); expect(server.connections).toBe(0);
  });
});
