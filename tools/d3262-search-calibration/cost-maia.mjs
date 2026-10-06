// Disposable D3262 ordered-history source. Never imported by production.
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { queryIdentity, sha } from "./cost-contract.mjs";
import { SourceFailure, fenOf, replay, terminal } from "./cost-stockfish.mjs";
import { legalMoves } from "./exact-reply-enumeration.mjs";

export const maiaPins = Object.freeze({
  modelCheckpointSha256: "sha256:ba14208b2992d85502f5fb501934abf6aaaeb355e9f3fdf90e326911f562524f",
  uciSourceSha256: "sha256:0f2905bb668f0cb8af6b175e698756d89472b200c36e3f3410ff98390e35474d",
});
const check = (v, m) => { if (!v) throw new Error(m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const near = (a, b, eps = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= eps;
const mass = x => Number.isFinite(x) && x >= 0 && x <= 1;
const sum = xs => xs.reduce((a, b) => a + b, 0);
const fields = (x, keys, name) => check(x && !Array.isArray(x) && same(Object.keys(x).sort(), [...keys].sort()), `${name} fields`);
const softmax = values => {
  const peak = Math.max(...values), weights = values.map(x => Math.exp(x - peak)), total = sum(weights);
  return weights.map(x => x / total);
};

/** Complete literal logits and sampler replay; no top-20/tail inference. */
export function parseMaiaReceipt(operands, lines) {
  queryIdentity(operands); check(operands.provider === "maia", "Crossed source family");
  check(Array.isArray(lines) && lines.length === 1 && typeof lines[0] === "string", "Exactly one literal model response required");
  const response = JSON.parse(lines[0]);
  fields(response, ["kind", "id", "payload"], "Response");
  check(response.kind === "result" && Number.isSafeInteger(response.id) && response.id > 0, "Invalid model response delimiter");
  const value = response.payload;
  fields(value, ["version", "operands", "fen", "historyFrames", "tokens", "vocabularySize", "rawFullLegal",
    "samplerOrder", "configuredSupport", "authority"], "Model payload");
  check(value.version === 1 && same(value.operands, operands), "Crossed ordered history/configuration");
  const pos = replay(operands.rootFen, operands.historyUci);
  check(terminal(pos) === null && fenOf(pos) === value.fen, "Crossed model position or terminal query");
  check(value.historyFrames === operands.historyUci.length + 1, "History reset or omitted frame");
  const tokenTree = x => Number.isSafeInteger(x) || Array.isArray(x) && x.length > 0 && x.every(Number.isSafeInteger);
  check(Array.isArray(value.tokens) && value.tokens.length > 0 && value.tokens.every(tokenTree), "Missing literal history tokens");
  check(Number.isSafeInteger(value.vocabularySize) && value.vocabularySize > 0, "Invalid vocabulary");
  const legal = legalMoves(pos).map(x => x.uci), raw = value.rawFullLegal;
  check(Array.isArray(raw) && same(raw.map(x => x.legalUci), legal), "Incomplete/noncanonical full legal model population");
  const indices = new Set();
  for (const item of raw) {
    fields(item, ["legalUci", "index", "logit", "mass"], "Full legal item");
    check(Number.isSafeInteger(item.index) && item.index >= 0 && item.index < value.vocabularySize
      && !indices.has(item.index) && Number.isFinite(item.logit) && mass(item.mass), "Invalid mask/logit identity");
    indices.add(item.index);
  }
  const expectedRaw = softmax(raw.map(x => x.logit));
  check(near(sum(raw.map(x => x.mass)), 1, 2e-6)
    && raw.every((x, i) => near(x.mass, expectedRaw[i])), "Full legal mass differs from retained logits");
  const scaled = softmax(raw.map(x => x.logit / operands.temperature));
  const byMove = new Map(raw.map((x, i) => [x.legalUci, { ...x, scaled: scaled[i] }]));
  const order = value.samplerOrder;
  check(Array.isArray(order) && order.length === legal.length && new Set(order.map(x => x.legalUci)).size === legal.length,
    "Incomplete sampler legal order");
  let cumulative = 0, previousLogit = Infinity;
  for (const [rank, item] of order.entries()) {
    fields(item, ["legalUci", "index", "mass", "cumulativeMass", "kept"], "Sampler item");
    const original = byMove.get(item.legalUci);
    check(original && item.index === original.index && original.logit <= previousLogit
      && mass(item.mass) && near(item.mass, original.scaled), "False sampler order/scaled mass");
    previousLogit = original.logit; cumulative += item.mass;
    check(near(cumulative, item.cumulativeMass, 2e-6) && typeof item.kept === "boolean"
      && item.kept === (rank === 0 || item.cumulativeMass <= operands.topP), "False cumulative top-p selection");
  }
  const kept = order.filter(x => x.kept), retained = sum(kept.map(x => x.mass)), actual = value.configuredSupport;
  check(Array.isArray(actual) && same(actual.map(x => x.legalUci), kept.map(x => x.legalUci)), "Sampler support differs");
  for (const [i, item] of actual.entries()) {
    fields(item, ["legalUci", "mass"], "Configured item");
    check(mass(item.mass) && near(item.mass, kept[i].mass / retained), "Configured normalization differs");
  }
  check(near(sum(actual.map(x => x.mass)), 1, 2e-6), "Configured policy not normalized");
  check(value.authority === "configured_model_policy_not_human_frequency_or_move_reason", "False policy authority");
  return value;
}

export function expectedMaiaReady() {
  return { kind: "ready", protocol: "d3262-cost-maia-v1", ...maiaPins,
    workerDigest: sha(readFileSync(new URL("cost-maia-worker.py", import.meta.url))),
    runtimeDigest: sha(readFileSync(new URL("maia_capture_runtime.py", import.meta.url))),
    device: "cpu", threads: 1, useUciHistory: true };
}

/** Serialized bounded transport; command injection is never read from a receipt. */
export class MaiaProcess {
  constructor(command, args, { imageId, ready = expectedMaiaReady(), timeoutMs = 60_000, cleanup } = {}) {
    check(/^sha256:[a-f0-9]{64}$/u.test(imageId) && Number.isSafeInteger(timeoutMs) && timeoutMs > 0, "Image/deadline required");
    this.imageId = imageId; this.expectedReady = ready; this.timeoutMs = timeoutMs; this.cleanup = cleanup;
    this.started = performance.now(); this.sequence = 0; this.pending = ""; this.queue = []; this.stderr = "";
    this.failure = null; this.closed = false; this.busy = false;
    this.child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    this.child.stdout.on("data", bytes => {
      this.pending += bytes.toString("utf8");
      if (Buffer.byteLength(this.pending) > 1024 * 1024) return this.fail(new SourceFailure("invalid", "Model response exceeded byte bound"));
      let index;
      while ((index = this.pending.indexOf("\n")) >= 0) {
        const line = this.pending.slice(0, index); this.pending = this.pending.slice(index + 1);
        if (this.waiter) { const w = this.waiter; this.waiter = null; w.resolve(line); }
        else if (this.queue.length < 2) this.queue.push(line);
        else return this.fail(new SourceFailure("invalid", "Unsolicited model output exceeded bound"));
      }
    });
    this.child.stderr.on("data", bytes => { this.stderr = (this.stderr + bytes).slice(-65536); });
    this.child.on("error", e => this.fail(new SourceFailure("unavailable", e.message)));
    this.child.stdin.on("error", e => this.fail(new SourceFailure("unavailable", e.message)));
    this.child.on("exit", (code, signal) => {
      if (!this.closed) this.fail(new SourceFailure("unavailable", `Early Maia exit: ${code}/${signal}`));
    });
    this.child.on("close", () => { this.childClosed = true; });
  }
  fail(error) {
    this.failure ??= error;
    if (this.waiter) { const w = this.waiter; this.waiter = null; w.reject(this.failure); }
    if (!this.closed) this.child.kill();
  }
  async line(deadline) {
    if (this.failure) throw this.failure;
    const remaining = deadline - performance.now();
    if (remaining <= 0) { this.fail(new SourceFailure("timed_out", "Maia whole-operation deadline")); throw this.failure; }
    if (this.queue.length) return this.queue.shift();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new SourceFailure("timed_out", "Maia whole-operation deadline")), remaining);
      this.waiter = { resolve: line => { clearTimeout(timer); resolve(line); }, reject: e => { clearTimeout(timer); reject(e); } };
    });
  }
  async initialize() {
    try {
      const literal = await this.line(performance.now() + this.timeoutMs), ready = JSON.parse(literal);
      fields(ready, [...Object.keys(this.expectedReady), "torchVersion", "pythonVersion"], "Ready identity");
      check(Object.entries(this.expectedReady).every(([k, v]) => ready[k] === v), "Unpinned Maia model/runtime source");
      check(typeof ready.torchVersion === "string" && typeof ready.pythonVersion === "string", "Missing actual runtime identity");
      this.ready = ready; this.readyLiteral = literal;
      this.sourceDigest = sha(JSON.stringify({ imageId: this.imageId, ready, selfElo: 1400, opponentElo: 1400,
        temperature: 0.8, topP: 0.92, preRootHistory: "unavailable_not_invented" }));
      this.startupMs = performance.now() - this.started;
      return this;
    } catch (e) {
      if (e instanceof SourceFailure) throw e;
      this.fail(new SourceFailure("invalid", e.message)); throw this.failure;
    }
  }
  admitReceipt(operands, lines) { return parseMaiaReceipt(operands, lines); }
  async execute(operands) {
    queryIdentity(operands);
    if (this.busy || !this.ready || operands.provider !== "maia" || operands.sourceDigest !== this.sourceDigest)
      throw new SourceFailure("invalid", "Crossed/uninitialized/parallel Maia source");
    if (this.failure) throw this.failure;
    this.busy = true;
    const started = performance.now(), id = ++this.sequence;
    let literal;
    try {
      this.child.stdin.write(`${JSON.stringify({ kind: "query", id, operands })}\n`);
      const line = await this.line(started + this.timeoutMs);
      literal = line;
      const response = JSON.parse(line);
      check(response.id === id, "Crossed model request identity");
      if (response.kind === "failure") throw new SourceFailure("invalid", response.message ?? "Model refused request");
      const lines = [line], result = parseMaiaReceipt(operands, lines);
      return { operands, lines, result, started, ended: performance.now(), modelName: "Maia3-5m" };
    } catch (e) {
      const failure = e instanceof SourceFailure ? e : new SourceFailure("invalid", e.message);
      if (literal !== undefined) failure.capture = { operands, lines: [literal] };
      if (!(e instanceof SourceFailure)) this.fail(failure);
      throw failure;
    } finally { this.busy = false; }
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    try {
      if (!this.childClosed) {
        const exited = new Promise(resolve => this.child.once("close", resolve));
        if (!this.child.killed) this.child.stdin.end('{"kind":"quit"}\n');
        const timer = setTimeout(() => this.child.kill("SIGKILL"), 1000);
        await exited; clearTimeout(timer);
      }
    } finally { this.cleanup?.(); }
  }
}

export function createCostMaia(image = "chess-tabiya-maia:dev") {
  const imageId = execFileSync("docker", ["image", "inspect", image, "--format", "{{.Id}}"], { encoding: "utf8", timeout: 5000 }).trim();
  const name = `d3262-maia-${randomUUID()}`;
  return new MaiaProcess("docker", ["run", "--rm", "-i", "--network", "none", "--cpus", "1", "--name", name,
    "--mount", `type=bind,src=${process.cwd()},dst=/repo,readonly`, "-w", "/repo", "--entrypoint", "python",
    imageId, "tools/d3262-search-calibration/cost-maia-worker.py"], { imageId,
    cleanup() {
      const value = spawnSync("docker", ["rm", "--force", name], { timeout: 5000, encoding: "utf8" });
      if (value.error || value.status !== 0 && !value.stderr.includes("No such container"))
        throw new Error(`Maia container cleanup failed: ${value.error?.message ?? value.stderr}`);
    } });
}
