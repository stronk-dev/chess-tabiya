// Installed principle/Library identity is an actual-content contract. Keep default
// catalogue admission and the original five-second case deadline, not empty lessons.
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { PrincipleRegistry, type PrincipleRecord } from "./principle-registry.js";

afterEach(() => vi.restoreAllMocks());

describe("installed principle identity through authenticated authoring", { timeout: 5_000 }, () => {
  let owned: ReturnType<typeof applicationFixture<ChessTabiyaApplication>>;
  let origin: string;
  let headers: Record<string, string>;
  const request = (path: string, body?: unknown, authenticated = true) => fetch(`${origin}${path}`, {
    method: body === undefined ? "GET" : "POST", headers: authenticated ? headers : { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  beforeAll(async () => {
    owned = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false }));
    await owned.ready;
    const app = owned.current()!;
    await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    const registration = await request("/auth/register", { handle: "authoring_execution", password: "authoring-execution-password" }, false);
    expect(registration.status).toBe(201);
    headers = { "content-type": "application/json", cookie: registration.headers.get("set-cookie")!.split(";", 1)[0]! };
  });
  afterAll(async () => { await owned?.close(); });

  it("keeps actual registered principle identity and Library reads stable under client-owned edits", async () => {
    const listed = await request("/principles");
    expect(listed.status).toBe(200);
    const { principles } = await listed.json() as { principles: { id: string; digest: string; statement: string }[] };
    expect(principles.length).toBeGreaterThan(0);
    const summary = principles[0]!;
    const get = PrincipleRegistry.prototype.get;
    let record: PrincipleRecord | undefined;
    vi.spyOn(PrincipleRegistry.prototype, "get").mockImplementation(function (this: PrincipleRegistry, id) {
      const actual = get.call(this, id);
      if (id === summary.id) record = actual;
      return actual;
    });
    const path = `/theory/principles/${encodeURIComponent(summary.id)}`;
    const first = await request(path);
    expect(first.status).toBe(200);
    const body = await first.json(), saved = structuredClone(body);
    expect(body).toMatchObject({ id: summary.id, digest: summary.digest, statement: summary.statement });
    expect(record).toBeDefined();
    expect(Reflect.set(record!.document, "statement", "Changed registered statement")).toBe(false);
    body.statement = "Changed decoded response";
    body.citations.push({ quotedText: "Client-only citation" });
    const second = await request(path);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(saved);
    const relisted = await request("/principles");
    expect(relisted.status).toBe(200);
    expect(await relisted.json()).toEqual({ principles });
  });
});
