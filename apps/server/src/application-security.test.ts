import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { ChessTabiyaApplication } from "./application.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { createHttpServer } from "./rest.js";

function expectSecurity(response: Response): void {
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("permissions-policy")).toBe("camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  expect(response.headers.has("strict-transport-security")).toBe(false);
}

describe("application-owned security and static update policy", { timeout: 30_000 }, () => {
  let application: ChessTabiyaApplication;
  let directory: string;
  let origin: string;

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), "tabiya-security-"));
    mkdirSync(join(directory, "assets"));
    writeFileSync(join(directory, "index.html"), "<!doctype html><title>Tabiya shell</title>");
    writeFileSync(join(directory, "manifest.webmanifest"), '{"name":"Tabiya"}');
    writeFileSync(join(directory, "tabiya-icon.svg"), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    writeFileSync(join(directory, "assets", "index-abCD1234.js"), "export const built = true;");
    const module = join(process.cwd(), "apps/web/public/session-join.js");
    if (existsSync(module)) copyFileSync(module, join(directory, "session-join.js"));
    application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, staticDirectory: directory });
    await new Promise<void>((resolve, reject) => {
      application.server.once("error", reject);
      application.server.listen(0, "127.0.0.1", resolve);
    });
    origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await application?.close();
    if (directory !== undefined) rmSync(directory, { recursive: true, force: true });
  });

  it.each(["/", "/play", "/settings", "/healthz", "/readyz", "/packs", "/runs/missing/graph"])(
    "owns security headers on the actual %s route", async (path) => {
      const response = await fetch(origin + path);
      expectSecurity(response);
      await response.arrayBuffer();
    },
  );

  it("retains no-store and session cookies on actual authentication responses", async () => {
    const response = await fetch(`${origin}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "security_host", password: "security-test-password" }),
    });
    expect(response.status).toBe(201);
    expectSecurity(response);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    await response.arrayBuffer();
  });

  it("serves the real invitation without inline code or a credential-bearing GET fallback", async () => {
    const response = await fetch(`${origin}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "security_invitation", password: "security-test-password" }),
    });
    expect(response.status).toBe(201);
    const cookie = response.headers.get("set-cookie")!.split(";", 1)[0]!;
    const headers = { "content-type": "application/json", cookie, "x-writer-id": "security-writer" };
    const runId = "security-invitation";
    const created = await fetch(`${origin}/runs`, { method: "POST", headers, body: JSON.stringify({
      id: runId,
      session: { kind: "position", start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7,
    }) });
    expect(created.status, await created.clone().text()).toBe(201);
    const sessionResponse = await fetch(`${origin}/sessions`, { method: "POST", headers, body: JSON.stringify({ runId, kind: "academy", title: "Safe invitation", boardControl: "host_directed" }) });
    expect(sessionResponse.status, await sessionResponse.clone().text()).toBe(201);
    const { session } = await sessionResponse.json() as { session: { id: string } };
    const minted = await fetch(`${origin}/sessions/${session.id}/links`, { method: "POST", headers, body: JSON.stringify({ invitedRole: "participant" }) });
    expect(minted.status, await minted.clone().text()).toBe(201);
    const { token } = await minted.json() as { token: string };
    const page = await fetch(`${origin}/shared/${token}`);
    expectSecurity(page);
    expect(page.headers.get("cache-control")).toBe("no-store");
    const html = await page.text();
    expect(html).toContain('method="post"');
    expect(html).toContain('data-invitation-token="');
    expect(html).toContain('<script type="module" src="/session-join.js"></script>');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("addEventListener");
    expect(html).not.toContain("rnbqkbnr");
  });

  it.each(["/", "/settings", "/manifest.webmanifest", "/tabiya-icon.svg", "/session-join.js"])(
    "revalidates the unhashed %s response", async (path) => {
      const response = await fetch(origin + path);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-cache");
      if (path === "/session-join.js") expect(response.headers.get("content-type")).toContain("javascript");
      if (path === "/manifest.webmanifest") expect(response.headers.get("content-type")).toContain("application/manifest+json");
      await response.arrayBuffer();
    },
  );

  it("retains immutable caching only for the build-hashed asset and preserves HEAD", async () => {
    const response = await fetch(`${origin}/assets/index-abCD1234.js`, { method: "HEAD" });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("content-type")).toContain("javascript");
    expect(await response.text()).toBe("");
  });

  it("does not cache a missing asset's fallback shell as immutable", async () => {
    const response = await fetch(`${origin}/assets/missing-abCD1234.js`);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("content-type")).toContain("text/html");
  });

  it("negotiates the Rating document without replacing JSON API refusals", async () => {
    for (const path of ["/rating", "/rating/"]) {
      const document = await fetch(origin + path, { headers: { accept: "text/html" } });
      expect(document.status).toBe(200);
      expect(document.headers.get("content-type")).toContain("text/html");
      expect(document.headers.get("vary")).toBe("Accept");
      expect(document.headers.get("cache-control")).toBe("no-cache");
    }
    for (const accept of ["*/*", "application/json", "text/html;q=0, */*;q=1", "text/html;q=0.2, application/json;q=0.9"]) {
      const api = await fetch(`${origin}/rating`, { headers: { accept } });
      expect(api.status).toBe(401);
      expect(api.headers.get("content-type")).toContain("application/json");
      expect(api.headers.get("cache-control")).toBe("no-store");
      expect(api.headers.get("vary")).toBe("Accept");
      expect(await api.text()).not.toContain("<!doctype html>");
    }
    const head = await fetch(`${origin}/rating`, { method: "HEAD", headers: { accept: "text/html" } });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
    const nested = await fetch(`${origin}/rating/history`, { headers: { accept: "text/html" } });
    expect(nested.status).toBe(401);
    expect(nested.headers.get("content-type")).toContain("application/json");
  });
});

it("security headers survive the adapter's generic error response", async () => {
  const server = createHttpServer(async () => { throw new Error("private infrastructure detail"); });
  try {
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`);
    expect(response.status).toBe(500);
    expectSecurity(response);
    expect(await response.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  } finally {
    await new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections(); });
  }
});
