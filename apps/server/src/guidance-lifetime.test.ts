import type { AddressInfo } from "node:net";
import { INITIAL_FEN } from "chessops/fen";
import { afterEach, describe, expect, it } from "vitest";
import { IdentityService } from "./identity.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import type { VoiceProvider, VoiceScope } from "./guidance.js";
import type { TtsProvider } from "./external-tts.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

const at = "2026-10-09T00:00:00.000Z";
const scopes = ["marker", "reading", "steering", "story"] as const;
const doors = [
  ...[...scopes, "compare" as const].map(scope => ({ action: "voice" as const, scope })),
  ...scopes.map(scope => ({ action: "speech" as const, scope })),
];
type Change = "success" | "closed" | "changed" | "revoked" | "demoted" | "deleted";
const changes: readonly Change[] = ["success", "closed", "changed", "revoked", "demoted", "deleted"];
const stores: SQLiteRunStorage[] = [];
afterEach(() => { for (const store of stores.splice(0)) store.close(); });

async function setup(scope: VoiceScope = "reading") {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
  stores.push(storage);
  const identity = new IdentityService(storage, { cookieSecure: false, derive: async (password, salt) => Buffer.alloc(32, password.length + salt.length) });
  const host = await identity.register({ handle: "lifetime-host", password: "narration-lifetime-password" });
  const guest = await identity.register({ handle: "lifetime-guest", password: "narration-lifetime-password" });
  const principal = { learnerId: host.learner.id, handle: host.learner.handle };
  const queue = new EvidenceJobQueue({ async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } });
  const service = new RunService(storage, { evidenceQueue: queue });
  const run = await service.create({ id: "narration-lifetime", session: { kind: "position", start: { fen: INITIAL_FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }, { writerId: "host-writer", learnerId: host.learner.id });
  if (scope === "compare") {
    service.move(run.id, principal, "host-writer", "e2e4", { at });
    service.rewind(run.id, principal, "host-writer", { nodeId: run.activeCursor.nodeId }, at);
    service.fork(run.id, principal, "host-writer", run.activeCursor.nodeId, { at });
    service.move(run.id, principal, "host-writer", "d2d4", { at });
  }
  await queue.whenIdle();
  service.updateGrant(run.id, principal, "host-writer", { op: "grant", handle: guest.learner.handle, role: "host" }, at);
  service.reveal(run.id, principal, "host-writer", at);
  const current = service.graph(run.id, principal);
  const body = scope === "compare" ? { scope, branches: current.branches.map(branch => branch.id) } : { scope, nodeId: current.activeCursor.nodeId };
  const mutate = async (change: Change) => {
    if (change === "closed" || change === "changed") {
      service.move(run.id, principal, "host-writer", scope === "compare" ? "d7d5" : "e2e4", { at });
      if (change === "changed") service.reveal(run.id, principal, "host-writer", at);
    } else if (change === "revoked" || change === "demoted") {
      service.updateGrant(run.id, principal, "host-writer", change === "revoked"
        ? { op: "revoke", handle: guest.learner.handle }
        : { op: "grant", handle: guest.learner.handle, role: "spectator" }, at);
    } else if (change === "deleted") {
      const preview = service.deletionPreview(run.id, principal, at);
      service.deleteRun(run.id, principal, preview.digest, at);
    }
    await queue.whenIdle();
  };
  const request = (action: string, signal?: AbortSignal) => new Request(`http://tabiya.test/runs/${run.id}/${action}`, { method: "POST", headers: { "content-type": "application/json", cookie: guest.cookie }, body: JSON.stringify(body), ...(signal === undefined ? {} : { signal }) });
  return { service, identity, request, mutate, run, principal, body };
}

describe("narration asynchronous authority", () => {
  it.each(doors.flatMap(door => changes.map(change => ({ ...door, change }))))("$action/$scope keeps current authority after $change", async ({ action, scope, change }) => {
    const fixture = await setup(scope);
    const started = deferred<void>(), release = deferred<void>();
    let calls = 0;
    const voice: VoiceProvider = { async render(_view, _persona, text) { calls += 1; started.resolve(); await release.promise; return `${text}\n`; } };
    const tts: TtsProvider = { async synthesize(text) { calls += 1; started.resolve(); await release.promise; return { bytes: new TextEncoder().encode(text), contentType: "audio/test" }; } };
    const handler = createRestHandler(fixture.service, undefined, undefined, fixture.identity, undefined, undefined, undefined, undefined, voice, undefined, undefined, undefined, tts);
    const pending = handler(fixture.request(action));
    try {
      await Promise.race([started.promise, pending.then(async response => { throw new Error(`Provider not reached: ${response.status} ${await response.clone().text()}`); })]);
      await fixture.mutate(change);
      const before = change === "deleted" ? undefined : fixture.service.events(fixture.run.id, fixture.principal).events;
      release.resolve();
      const response = await pending;
      expect(response.status).toBe(change === "success" ? 200 : change === "revoked" ? 404 : 409);
      if (change !== "success") {
        const text = await response.text();
        expect(text).toContain(change === "revoked" ? "RUN_NOT_FOUND" : "ASSISTANCE_WITHHELD");
        expect(text).not.toMatch(/Current position|source|proposals|audio\/test/u);
      }
      expect(calls).toBe(1);
      if (before !== undefined) expect(fixture.service.events(fixture.run.id, fixture.principal).events).toEqual(before);
    } finally { release.resolve(); await pending; }
  });

  it.each(["invalid", "failure"])("does not retry voice %s after disclosure changes", async result => {
    const fixture = await setup();
    let calls = 0;
    const voice: VoiceProvider = { async render() { calls += 1; await fixture.mutate("changed"); if (result === "failure") throw new Error("provider failure"); return "Play Qh7 immediately."; } };
    const handler = createRestHandler(fixture.service, undefined, undefined, fixture.identity, undefined, undefined, undefined, undefined, voice);
    const response = await handler(fixture.request("voice"));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "ASSISTANCE_WITHHELD" } });
    expect(calls).toBe(1);
  });

  it("does not retain rejected late voice text for a later speech request", async () => {
    const fixture = await setup();
    const started = deferred<void>(), release = deferred<void>();
    let staleText = "", spokenText = "";
    const voice: VoiceProvider = { async render(_view, _persona, text) {
      staleText = `${text}\n`; started.resolve(); await release.promise; return staleText;
    } };
    const tts: TtsProvider = { async synthesize(text) {
      spokenText = text; return { bytes: new TextEncoder().encode(text), contentType: "audio/test" };
    } };
    const handler = createRestHandler(fixture.service, undefined, undefined, fixture.identity, undefined, undefined, undefined, undefined, voice, undefined, undefined, undefined, tts);
    const pending = handler(fixture.request("voice"));
    try {
      await started.promise;
      await fixture.mutate("changed");
      release.resolve();
      expect((await pending).status).toBe(409);
      // The old node is still readable after a fresh reveal. Only its deterministic rendering,
      // not the rejected provider rendering, may now reach speech.
      const speech = await handler(fixture.request("speech"));
      expect(speech.status).toBe(200);
      expect(staleText.length).toBeGreaterThan(1);
      expect(spokenText).toBe(staleText.slice(0, -1));
      expect(await speech.text()).toBe(spokenText);
    } finally { release.resolve(); await pending; }
  });

  it.each(["voice", "speech"])("forwards %s cancellation and refuses an abort-ignoring result", async action => {
    const fixture = await setup();
    const started = deferred<AbortSignal | undefined>(), release = deferred<void>();
    const voice: VoiceProvider = { async render(_view, _persona, text, _scope, signal) { started.resolve(signal); await release.promise; return text; } };
    const tts: TtsProvider = { async synthesize(text, signal) { started.resolve(signal); await release.promise; return { bytes: new TextEncoder().encode(text), contentType: "audio/test" }; } };
    const handler = createRestHandler(fixture.service, undefined, undefined, fixture.identity, undefined, undefined, undefined, undefined, voice, undefined, undefined, undefined, tts);
    const controller = new AbortController();
    const pending = handler(fixture.request(action, controller.signal));
    try {
      const signal = await started.promise;
      expect(signal).toBeDefined();
      controller.abort();
      expect(signal?.aborted).toBe(true);
      release.resolve();
      const response = await pending;
      expect(response.status).not.toBe(200);
      expect(await response.text()).not.toContain("Current position");
    } finally { release.resolve(); await pending; }
  });

  it.each(["voice", "speech"])("rechecks revoked grants through the composed %s HTTP door", async action => {
    const started = deferred<void>(), release = deferred<void>();
    const voice: VoiceProvider = { async render(_view, _persona, text) { started.resolve(); await release.promise; return text; } };
    const tts: TtsProvider = { async synthesize(text) { started.resolve(); await release.promise; return { bytes: new TextEncoder().encode(text), contentType: "audio/test" }; } };
    const app = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, voiceProvider: voice, ttsProvider: tts });
    let pending: Promise<Response> | undefined;
    try {
      await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
      const register = async (handle: string) => {
        const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: "narration-lifetime-password" }) });
        expect(response.status).toBe(201);
        return response.headers.get("set-cookie")!.split(";", 1)[0]!;
      };
      const owner = await register("http_voice_owner"), guest = await register("http_voice_guest");
      const post = (path: string, body: unknown, cookie = owner) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "voice-writer" }, body: JSON.stringify(body) });
      const created = await post("/runs", { id: "http-voice", session: { kind: "position", start: { fen: INITIAL_FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 });
      expect(created.status).toBe(201);
      const { run } = await created.json() as { run: { activeCursor: { nodeId: string } } };
      expect((await post("/runs/http-voice/grants", { op: "grant", handle: "http_voice_guest", role: "host" })).status).toBe(200);
      expect((await post("/runs/http-voice/reveal", {})).status).toBe(200);
      pending = post(`/runs/http-voice/${action}`, { nodeId: run.activeCursor.nodeId, scope: "reading" }, guest);
      await Promise.race([started.promise, pending.then(async response => { throw new Error(`Provider not reached: ${response.status} ${await response.clone().text()}`); })]);
      expect((await post("/runs/http-voice/grants", { op: "revoke", handle: "http_voice_guest" })).status).toBe(200);
      release.resolve();
      const response = await pending;
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ error: { code: "RUN_NOT_FOUND" } });
    } finally { release.resolve(); await pending; await app.close(); }
  });
});
