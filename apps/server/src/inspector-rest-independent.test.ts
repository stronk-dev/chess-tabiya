// Authenticated low-level REST integration, not default app/content/deployment qualification.
import { createHash } from "node:crypto";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileAssistanceRequest, moduleDecisionStamp, parsePresentationReceipt, revealFeedback } from "@chess-tabiya/runtime";
import { recordedInspectorRun } from "../../../packages/runtime/src/testing/recorded-inspector-fixture.js";
import type { InspectorQueryPage, InspectorQueryRequest, InspectorQueryView } from "../../../packages/runtime/src/inspector-query-contract.js";
import { DrillApi } from "../../web/src/lib/api.js";
import { IdentityService } from "./identity.js";
import { createHttpServer, createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-03T00:00:00.000Z", password = "independent-rest-test-password";
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
async function fixture(revealed = true) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const service = new RunService(storage), identity = new IdentityService(storage, { cookieSecure: false,
    derive: async (secret, salt) => createHash("sha256").update(salt).update(secret).digest() });
  const handler = createRestHandler(service, undefined, undefined, identity);
  async function register(handle: string) {
    const response = await handler(new Request("http://tabiya.test/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password }) }));
    expect(response.status).toBe(201);
    return { cookie: response.headers.get("set-cookie")!.split(";", 1)[0]!, learner: storage.learnerByHandle(handle)! };
  }
  const owner = await register("inspector-http-owner"), stranger = await register("inspector-http-stranger");
  const initial = recordedInspectorRun(undefined, "inspector-http-run"), run = revealed ? revealFeedback(initial, at).run : initial;
  storage.create(run, { writerId: "inspector-http-writer", learnerId: owner.learner.id });
  const request = (view: InspectorQueryView = { kind: "inventory", start: 0 }): InspectorQueryRequest => ({ protocol: "inspector.query_page@1",
    assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }),
    query: { branchId: run.activeCursor.branchId, nodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(run).digest, view } });
  const call = (body: unknown = request(), cookie: string | null = owner.cookie, signal?: AbortSignal) => handler(new Request(`http://tabiya.test/runs/${run.id}/inspector/query`, {
    method: "POST", headers: { "content-type": "application/json", ...(cookie === null ? {} : { cookie }) }, body: JSON.stringify(body), ...(signal === undefined ? {} : { signal }) }));
  return { storage, service, handler, run, owner, stranger, request, call };
}

describe("independent authenticated Inspector REST and client transport", () => {
  it("uses real auth and returns a lazy inventory without changing persisted run bytes", async () => {
    const f = await fixture(), before = JSON.stringify(f.storage.read(f.run.id)), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    const response = await f.call(), body = await response.json() as InspectorQueryPage;
    expect(response.status).toBe(200); expect(body.kind).toBe("page");
    if (body.kind !== "page" || body.body.kind !== "inventory") throw new Error("Expected actual authenticated inventory");
    expect(body.body.range).toEqual({ start: 0, count: 8, total: 88, next: 8 });
    expect(body.body.topics.every(topic => topic.state === "not_requested")).toBe(true);
    expect(acquire).not.toHaveBeenCalled(); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
    const anonymous = await f.call(f.request(), null);
    expect(anonymous.status).toBe(401); expect(await anonymous.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
    const foreign = await f.call(f.request(), f.stranger.cookie);
    expect(foreign.status).toBe(404); expect(await foreign.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "not_found" });
  });

  it("delivers an actual registered source presentation directly, not a modules/query envelope", async () => {
    const f = await fixture(), before = JSON.stringify(f.storage.read(f.run.id));
    const response = await f.call(f.request({ kind: "source", projection: "rules.castling.reading.rights@1", context: { kind: "position" }, start: 0, collectionKey: null }));
    const bytes = await response.text(), body = JSON.parse(bytes) as InspectorQueryPage;
    expect(response.status, bytes).toBe(200); expect(body.kind).toBe("page");
    expect(body).not.toHaveProperty("page");
    if (body.kind !== "page" || body.body.kind !== "source" || body.body.outcome.kind !== "available") throw new Error("Expected actual available source page");
    expect(body.body.outcome.collected).toBe(1); expect(body.body.outcome.displayed).toBe(1);
    expect(parsePresentationReceipt(body.body.outcome.presentation).length).toBeGreaterThan(0);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it("preserves closed invalid/stale/unsupported refusals and their exact HTTP status", async () => {
    const f = await fixture(), before = JSON.stringify(f.storage.read(f.run.id)), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    const stale = f.request(), wrongVersion = { ...f.request(), protocol: "inspector.query_page@999" };
    const cases = [{ value: {}, status: 422, code: "invalid_request" }, { value: { ...stale, query: { ...stale.query, decisionDigest: `sha256:${"0".repeat(64)}` } }, status: 409, code: "stale" },
      { value: wrongVersion, status: 422, code: "unsupported_version" }];
    for (const test of cases) {
      const response = await f.call(test.value); expect(response.status).toBe(test.status);
      expect(await response.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: test.code });
    }
    expect(acquire).not.toHaveBeenCalled(); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it("returns exact403 closed withheld for an authenticated unrevealed owned run", async () => {
    const f = await fixture(false), acquire = vi.spyOn(f.service, "acquireInspectorQuerySource"), response = await f.call();
    expect(response.status).toBe(403); expect(await response.json()).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "withheld" });
    expect(acquire).not.toHaveBeenCalled();
  });

  it("preserves actual successful and non2xx closed response bodies through DrillApi.inspector", async () => {
    const f = await fixture(), controller = new AbortController(), seen: Request[] = [];
    const api = new DrillApi("http://tabiya.test", async (input, init) => {
      const headers = new Headers(init?.headers); headers.set("cookie", f.owner.cookie);
      const request = new Request(String(input), { ...init, headers }); seen.push(request);
      expect(request.signal.aborted).toBe(controller.signal.aborted);
      return f.handler(request);
    });
    const ok = await api.inspector(f.run.id, f.request(), controller.signal);
    expect(ok).toMatchObject({ protocol: "inspector.query_page@1", kind: "page", body: { kind: "inventory" } });
    const original = f.request(), stale = { ...original, query: { ...original.query, decisionDigest: `sha256:${"0".repeat(64)}` } };
    expect(await api.inspector(f.run.id, stale, controller.signal)).toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "stale" });
    expect(seen.every(request => request.method === "POST" && request.url.endsWith("/inspector/query"))).toBe(true);
    controller.abort();
    const acquire = vi.spyOn(f.service, "acquireInspectorQuerySource");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(api.inspector(f.run.id, f.request(), controller.signal)).rejects.toBeInstanceOf(Error);
    expect(seen.at(-1)!.signal.aborted).toBe(true); expect(acquire).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it("rejects a cancelled Request with its actual reason before authentication or route work", async () => {
    const f = await fixture(), controller = new AbortController(), reason = new Error("cancelled by caller");
    const query = vi.spyOn(f.service, "queryInspectorSources"), log = vi.spyOn(console, "error").mockImplementation(() => {});
    controller.abort(reason);
    await expect(f.call(f.request(), null, controller.signal)).rejects.toBe(reason);
    expect(query).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
  });

  it("does not turn cancellation during source acquisition into an internal-error response", async () => {
    const f = await fixture(), controller = new AbortController(), reason = new Error("retired inspector request");
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    vi.spyOn(f.service, "queryInspectorSources").mockImplementation(async (_run, _principal, _value, _availability, signal) => {
      entered();
      await new Promise<void>((_resolve, reject) => signal!.addEventListener("abort", () => reject(signal!.reason), { once: true }));
      throw new Error("unreachable");
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {}), pending = f.call(f.request(), f.owner.cookie, controller.signal);
    const rejection = expect(pending).rejects.toBe(reason);
    await started; controller.abort(reason); await rejection;
    expect(log).not.toHaveBeenCalled();
  });

  it("still reports a provider AbortError when the actual HTTP request was not cancelled", async () => {
    const f = await fixture(), error = new DOMException("private provider abort", "AbortError");
    vi.spyOn(f.service, "queryInspectorSources").mockRejectedValue(error);
    const log = vi.spyOn(console, "error").mockImplementation(() => {}), response = await f.call();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
    expect(log).toHaveBeenCalledExactlyOnceWith("UNHANDLED_SERVER_ERROR", error);
  });

  it("cancels the actual Node HTTP request on disconnect without logging or publishing an error page", async () => {
    const f = await fixture(), log = vi.spyOn(console, "error").mockImplementation(() => {});
    let entered!: () => void, finished!: () => void, requestSignal!: AbortSignal;
    const started = new Promise<void>(resolve => { entered = resolve; }), settled = new Promise<void>(resolve => { finished = resolve; });
    vi.spyOn(f.service, "queryInspectorSources").mockImplementation(async (_run, _principal, _value, _availability, signal) => {
      requestSignal = signal!; entered();
      await new Promise<void>((_resolve, reject) => signal!.addEventListener("abort", () => reject(signal!.reason), { once: true }));
      throw new Error("unreachable");
    });
    const server = createHttpServer(async request => { try { return await f.handler(request); } finally { finished(); } });
    try {
      server.listen(0, "127.0.0.1"); await once(server, "listening");
      const controller = new AbortController(), origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const pending = fetch(`${origin}/runs/${f.run.id}/inspector/query`, { method: "POST", headers: { "content-type": "application/json", cookie: f.owner.cookie }, body: JSON.stringify(f.request()), signal: controller.signal });
      const rejection = expect(pending).rejects.toMatchObject({ name: "AbortError" });
      await started; controller.abort(); await rejection; await settled;
      expect(requestSignal.aborted).toBe(true); expect(log).not.toHaveBeenCalled();
    } finally {
      server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
