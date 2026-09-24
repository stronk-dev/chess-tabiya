/**
 * rfc/provider-health-degradation.md criteria 3, 10, 11, 19, 20 at the opponent selector: the
 * permanent R18 fixture (warm → stop → same request cached_exact, new position typed unavailable
 * inside the compiled deadline, capabilities cache-only), the bounded generation-keyed LRU and the
 * no-silent-substitution rule.
 */
import { createServer, type Server } from "node:net";
import type { AddressInfo } from "node:net";

import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import type { EngineHealth, EngineIdentity, EngineRequest } from "./engine-supervisor.js";
import { maiaContainerProbe, parseMaiaContainerIdentity } from "./maia.js";
import { OpponentSelector, type SelectMoveRequest, type SelectorEngineClient } from "./opponent-selector.js";
import { testClock, testRegistry } from "./provider-health.test-support.js";

const digest = `sha256:${"4".repeat(64)}`;

/** A Maia fixture that can die: after `stop()` every request fails like a closed sidecar. */
class StoppableMaia implements SelectorEngineClient {
  calls = 0;
  stopped = false;
  readonly #identity: EngineIdentity = Object.freeze({ id: "maia-5m", kind: "opponent", name: "Maia fixture", version: "1", seedHonored: false });
  async execute(_engineId: string, request: EngineRequest): Promise<readonly string[]> {
    this.calls += 1;
    if (this.stopped) throw new Error("engine exited (code=null, signal=SIGKILL)");
    if (request.timeoutMs === undefined || request.timeoutMs > 4_000) throw new Error(`timeout ${String(request.timeoutMs)} exceeds the compiled budget`);
    const position = request.commands.find((line) => line.startsWith("position "))!;
    const move = position.endsWith("e2e4") ? "e7e5" : "e2e4";
    return Object.freeze([`info multipv 1 policy 0.6 pv ${move}`, move === "e2e4" ? "info multipv 2 policy 0.4 pv d2d4" : "info multipv 2 policy 0.4 pv c7c5", `bestmove ${move}`]);
  }
  health(engineId: string): EngineHealth {
    return Object.freeze({ id: engineId, status: this.stopped ? "unavailable" : "ready", restartCount: 0, identity: this.#identity });
  }
}

function request(history: readonly string[] = [], seed = 1, mode: "human_common" | "strong_engine" = "human_common"): SelectMoveRequest {
  return Object.freeze({ startFen: INITIAL_FEN, historyUci: Object.freeze([...history]), policy: Object.freeze({ mode, policyConfigDigest: digest }), seed });
}

describe("R18 permanent fixture (criterion 3, D609)", () => {
  it("serves the warmed position as cached_exact after the sidecar stops and refuses a new position, typed and bounded", async () => {
    const clock = testClock();
    const health = await testRegistry({ "maia-inference": "available" }, { clock });
    const maia = new StoppableMaia();
    const selector = new OpponentSelector(maia, { health, monotonicNowMs: () => clock.now, wallNow: () => clock.wall });
    const warmed = await selector.selectWithReceipt(request());
    expect(warmed.receipt.source).toBe("live");
    // The sidecar dies; the supervisor reports the exit.
    maia.stopped = true;
    health.engineLifecycleSink({ "maia-5m": "maia-inference" })({ engineId: "maia-5m", kind: "failed", reason: "process_exit" });
    const again = await selector.selectWithReceipt(request());
    expect(again.receipt.source).toBe("cached_exact");
    expect(again.selection).toEqual(warmed.selection);
    const calls = maia.calls;
    await expect(selector.selectWithReceipt(request(["e2e4"]))).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE", details: { operation: "opponent.maia_inference", availability: { state: "conditional_exact_cache" } } });
    // The refusal is immediate: the dead provider is not asked (no 60-second wait, no herd).
    expect(maia.calls).toBe(calls);
    expect(health.snapshot().providers.find((row) => row.instanceId === "maia-inference")).toMatchObject({ state: "degraded_cached_only", cacheScope: "exact_request", validExactEntries: 1 });
  });

  it("never substitutes another opponent: a failed human-common selection is not a Stockfish or random move (criterion 20)", async () => {
    const health = await testRegistry({ "maia-inference": "available", "stockfish-play": "available" });
    const maia = new StoppableMaia();
    maia.stopped = true;
    const selector = new OpponentSelector(maia, { health });
    await expect(selector.selectWithReceipt(request())).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
    expect(health.snapshot().providers.find((row) => row.instanceId === "maia-inference")).toMatchObject({ state: "unavailable", reason: "process_exit" });
    expect(health.snapshot().providers.find((row) => row.instanceId === "stockfish-play")!.state).toBe("available");
  });

  it("gives every engine request the remaining compiled budget, never a fixed 60 s wait (criterion 5)", async () => {
    const health = await testRegistry({ "maia-inference": "available" });
    const seen: number[] = [];
    const client: SelectorEngineClient = {
      async execute(_id, engineRequest) { seen.push(engineRequest.timeoutMs!); return ["info multipv 1 policy 1 pv e2e4", "bestmove e2e4"]; },
      health: (id) => ({ id, status: "ready", restartCount: 0, identity: { id, kind: "opponent", name: "Maia", version: "1", seedHonored: false } }),
    };
    await new OpponentSelector(client, { health }).selectWithReceipt(request());
    expect(seen.length).toBeGreaterThan(0);
    for (const timeout of seen) expect(timeout).toBeLessThanOrEqual(4_000);
  });
});

describe("settled selection cache (criterion 10, 11, 19)", () => {
  it("is a bounded LRU whose recency updates on a hit", async () => {
    const maia = new StoppableMaia();
    const selector = new OpponentSelector(maia, { cache: { maxEntries: 3 } });
    await selector.select(request([], 1));
    await selector.select(request([], 2));
    await selector.select(request([], 3));
    await selector.select(request([], 1)); // hit: seed 1 becomes most recent
    await selector.select(request([], 4)); // evicts seed 2, not the hot seed 1
    expect(selector.cacheSize()).toBe(3);
    const calls = maia.calls;
    expect((await selector.selectWithReceipt(request([], 1))).receipt.source).toBe("cached_exact");
    expect((await selector.selectWithReceipt(request([], 2))).receipt.source).toBe("live");
    expect(maia.calls).toBe(calls + 1);
  });

  it("refuses a TTL above 24 hours and expires entries by the TTL fixed at insertion", async () => {
    expect(() => new OpponentSelector(new StoppableMaia(), { cache: { ttlMs: 24 * 60 * 60 * 1000 + 1 } })).toThrow(/24 hours/u);
    let now = 0;
    const selector = new OpponentSelector(new StoppableMaia(), { cache: { ttlMs: 1_000 }, monotonicNowMs: () => now });
    await selector.select(request());
    now = 999;
    expect((await selector.selectWithReceipt(request())).receipt.source).toBe("cached_exact");
    now = 1_000;
    expect((await selector.selectWithReceipt(request())).receipt.source).toBe("live");
  });

  it("keys every provider-instance generation, invalidates on restart, and never shares a reply across modes", async () => {
    const health = await testRegistry({ "maia-inference": "available", "stockfish-play": "available" });
    const maia = new StoppableMaia();
    const selector = new OpponentSelector(maia, { health, strongEngineId: "maia-5m" });
    await selector.select(request());
    const sink = health.engineLifecycleSink({ "maia-5m": "maia-inference" });
    sink({ engineId: "maia-5m", kind: "starting" });
    sink({ engineId: "maia-5m", kind: "ready" });
    // Restarting the same Maia binary leaves no old-generation selection readable.
    expect(selector.cacheSize()).toBe(0);
    expect((await selector.selectWithReceipt(request())).receipt.source).toBe("live");
    expect((await selector.selectWithReceipt(request([], 1, "strong_engine"))).receipt.source).toBe("live");
  });

  it("discards a late result from a replaced generation instead of caching or returning it", async () => {
    const health = await testRegistry({ "maia-inference": "available" });
    const sink = health.engineLifecycleSink({ "maia-5m": "maia-inference" });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const client: SelectorEngineClient = {
      async execute() { await gate; return ["info multipv 1 policy 1 pv e2e4", "bestmove e2e4"]; },
      health: (id) => ({ id, status: "ready", restartCount: 0, identity: { id, kind: "opponent", name: "Maia", version: "1", seedHonored: false } }),
    };
    const selector = new OpponentSelector(client, { health });
    const pending = selector.selectWithReceipt(request());
    await Promise.resolve();
    sink({ engineId: "maia-5m", kind: "starting" });
    sink({ engineId: "maia-5m", kind: "ready" });
    release();
    await expect(pending).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
    expect(selector.cacheSize()).toBe(0);
    expect(health.snapshot().providers.find((row) => row.instanceId === "maia-inference")!.state).toBe("available");
  });

  it("retains recursively immutable payloads", async () => {
    const selector = new OpponentSelector(new StoppableMaia());
    const first = await selector.select(request());
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.candidates)).toBe(true);
    expect(first.candidates!.every((candidate) => Object.isFrozen(candidate))).toBe(true);
  });
});

describe("Maia container-identity probe", () => {
  const image = { runtime: "oci", imageId: "ghcr.io/stronk-dev/chess-tabiya-maia@sha256:" + "a".repeat(64), manifestDigest: `sha256:${"a".repeat(64)}`, configDigest: `sha256:${"b".repeat(64)}` };

  it("parses exactly one well-formed OCI identity line and refuses everything else", () => {
    expect(parseMaiaContainerIdentity(JSON.stringify(image))).toMatchObject({ kind: "container", containerDigest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/u) });
    expect(parseMaiaContainerIdentity(JSON.stringify({ unavailable: "container identity was not injected into this deployment" }))).toBeNull();
    expect(parseMaiaContainerIdentity(JSON.stringify({ ...image, extra: 1 }))).toBeNull();
    expect(parseMaiaContainerIdentity(JSON.stringify({ ...image, configDigest: "latest" }))).toBeNull();
    expect(parseMaiaContainerIdentity("not json")).toBeNull();
  });

  async function sidecar(reply: (line: string) => string | null): Promise<{ server: Server; port: number }> {
    const server = createServer((socket) => {
      socket.setEncoding("utf8");
      socket.once("data", (chunk: string) => {
        const answer = reply(chunk);
        if (answer === null) socket.destroy();
        else socket.end(answer);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    return { server, port: (server.address() as AddressInfo).port };
  }

  it("asks the running sidecar for its identity before a generation spawns", async () => {
    const { server, port } = await sidecar((line) => line === "tabiya-identity\n" ? `${JSON.stringify(image)}\n` : null);
    try {
      const capture = await maiaContainerProbe("127.0.0.1", port)({ id: "maia-5m", kind: "opponent", command: "nc" });
      expect(capture?.kind).toBe("container");
    } finally {
      server.close();
    }
  });

  it("is null when the sidecar has no injected identity or does not answer", async () => {
    const { server, port } = await sidecar(() => `${JSON.stringify({ unavailable: "not injected" })}\n`);
    try {
      expect(await maiaContainerProbe("127.0.0.1", port)({ id: "maia-5m", kind: "opponent", command: "nc" })).toBeNull();
    } finally {
      server.close();
    }
    expect(await maiaContainerProbe("127.0.0.1", 1, { timeoutMs: 200 })({ id: "maia-5m", kind: "opponent", command: "nc" })).toBeNull();
  });
});
