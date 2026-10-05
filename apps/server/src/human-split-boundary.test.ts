import type { AddressInfo } from "node:net";
import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it, vi } from "vitest";
import { EngineCapabilities } from "./capabilities.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { OpponentSelector } from "./opponent-selector.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

// Real authentication, grants, run writes, disclosure and HTTP disconnect plumbing. A test-only
// gate controls the async selector/capability boundary; selector/provider execution is covered
// independently in opponent-cancellation.test.ts, without pretending mock Maia is a live model.
describe("human distribution asynchronous access boundary", { timeout: 15_000 }, () => {
  it("forwards a real select-move disconnect without adding cancellation to the wire", async () => {
    const app = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
    const started = deferred<AbortSignal | undefined>(), aborted = deferred<void>(), release = deferred<void>();
    const original = OpponentSelector.prototype.selectWithReceipt;
    const spy = vi.spyOn(OpponentSelector.prototype, "selectWithReceipt").mockImplementation(async function (this: OpponentSelector, request, options = {}) {
      expect(Object.hasOwn(request, "signal")).toBe(false);
      started.resolve(options.signal);
      options.signal?.addEventListener("abort", () => aborted.resolve(), { once: true });
      await release.promise;
      return original.call(this, request, options);
    });
    try {
      await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "split_owner", password: "human-split-test-password" }) });
      expect(registered.status).toBe(201);
      const caller = new AbortController();
      const pending = fetch(`${origin}/select-move`, { method: "POST", signal: caller.signal, headers: { "content-type": "application/json", cookie: registered.headers.get("set-cookie")!.split(";", 1)[0]! }, body: JSON.stringify({ startFen: INITIAL_FEN, historyUci: [], policy: { mode: "human_common", policyConfigDigest: `sha256:${"a".repeat(64)}` }, seed: 17 }) });
      const signal = await Promise.race([started.promise, pending.then(async response => { throw new Error(`Expected selection, got ${response.status}: ${await response.clone().text()}`); })]);
      expect(signal).toBeDefined();
      const refusal = expect(pending).rejects.toMatchObject({ name: "AbortError" });
      caller.abort(); await refusal; await aborted.promise;
      expect(signal!.aborted).toBe(true);
    } finally { release.resolve(); spy.mockRestore(); await app.close(); }
  });

  it.each(["success", "closed", "changed", "revoked", "disconnect", "capabilities_closed", "capabilities_revoked"])("rechecks authoritative access (%s)", async arm => {
    const app = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
    const started = deferred<AbortSignal | undefined>(), release = deferred<void>(), aborted = deferred<void>();
    const originalSelect = OpponentSelector.prototype.select;
    let calls = 0;
    const select = vi.spyOn(OpponentSelector.prototype, "select").mockImplementation(async function (this: OpponentSelector, request, options = {}) {
      calls += 1;
      if (!arm.startsWith("capabilities_")) {
        started.resolve(options.signal);
        options.signal?.addEventListener("abort", () => aborted.resolve(), { once: true });
        await release.promise;
      }
      return originalSelect.call(this, request, options);
    });
    const originalCapabilities = EngineCapabilities.prototype.get;
    let held = false;
    const capabilities = vi.spyOn(EngineCapabilities.prototype, "get").mockImplementation(async function (this: EngineCapabilities) {
      const value = await originalCapabilities.call(this);
      if (arm.startsWith("capabilities_") && !held) {
        held = true; started.resolve(undefined); await release.promise;
      }
      return value;
    });
    try {
      await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
      const register = async (handle: string) => {
        const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: "human-split-test-password" }) });
        expect(response.status).toBe(201);
        return response.headers.get("set-cookie")!.split(";", 1)[0]!;
      };
      const headers = { "content-type": "application/json", cookie: await register("split_owner"), "x-writer-id": "split-writer" };
      const created = await fetch(`${origin}/runs`, { method: "POST", headers, body: JSON.stringify({ id: "split-boundary", session: { kind: "position", start: { fen: INITIAL_FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73 }) });
      expect(created.status, await created.clone().text()).toBe(201);
      const { run } = await created.json() as { run: { activeCursor: { nodeId: string } } };
      const route = `${origin}/runs/split-boundary`;
      const query = `${route}/human-split?nodeId=${encodeURIComponent(run.activeCursor.nodeId)}`;
      const post = async (action: string, body: unknown) => fetch(`${route}/${action}`, { method: "POST", headers, body: JSON.stringify(body) });
      expect((await fetch(query)).status).toBe(401);
      expect((await fetch(query, { headers })).status).toBe(409);
      expect(calls).toBe(0);
      let queryHeaders = headers;
      if (arm.includes("revoked")) {
        queryHeaders = { ...headers, cookie: await register("split_guest") };
        expect((await post("grants", { op: "grant", handle: "split_guest", role: "host" })).status).toBe(200);
      }
      expect((await post("reveal", {})).status).toBe(200);
      const caller = new AbortController();
      const pending = fetch(query, { headers: queryHeaders, signal: caller.signal });
      const signal = await Promise.race([started.promise, pending.then(async response => { throw new Error(`Expected async acquisition, got ${response.status}: ${await response.clone().text()}`); })]);
      if (arm === "disconnect") {
        expect(signal).toBeDefined();
        const refusal = expect(pending).rejects.toMatchObject({ name: "AbortError" });
        caller.abort(); await refusal; await aborted.promise;
        expect(signal!.aborted).toBe(true);
        release.resolve();
        return;
      }
      if (arm === "closed" || arm === "changed" || arm === "capabilities_closed") {
        expect((await post("moves", { uci: "e2e4" })).status).toBe(200);
        if (arm === "changed") expect((await post("reveal", {})).status).toBe(200);
      } else if (arm.includes("revoked")) {
        expect((await post("grants", { op: "revoke", handle: "split_guest" })).status).toBe(200);
      }
      release.resolve();
      const response = await pending;
      const text = await response.text();
      expect(response.status, text).toBe(arm === "success" ? 200 : arm.includes("revoked") ? 404 : 409);
      if (arm === "success") {
        expect(JSON.parse(text)).toMatchObject({ nodeId: run.activeCursor.nodeId, candidates: expect.any(Array) });
        expect(JSON.parse(text).candidates.length).toBeGreaterThan(0);
      } else {
        expect(text).toContain(arm.includes("revoked") ? "RUN_NOT_FOUND" : "ASSISTANCE_WITHHELD");
        expect(text).not.toMatch(/candidates|policyModeApplied|moveUci/u);
      }
      expect(calls).toBe(arm.startsWith("capabilities_") ? 0 : 1);
    } finally {
      release.resolve(); select.mockRestore(); capabilities.mockRestore(); await app.close();
    }
  });
});
