// D3796: a legal terminal transition reaches the real authenticated application and SQLite.
import type { AddressInfo } from "node:net";
import { compileAssistanceRequest, parsePresentationReceipt, type DrillRun, type ModuleQueryPage } from "@chess-tabiya/runtime";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";

let fixture: ReturnType<typeof applicationFixture<ChessTabiyaApplication>> | undefined;
beforeEach(async () => {
  // These are unauthored position controls, not installed-content qualification.
  installEmptyApplicationCatalogues(async (_label, load) => load());
  fixture = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false }));
  await fixture.ready;
});
afterEach(async () => {
  const owned = fixture;
  fixture = undefined;
  try { await owned?.close(); }
  finally { vi.restoreAllMocks(); }
});

it("queries played mate and stalemate for both colors without a 500, writes or an access bypass", async () => {
  const app = fixture!.current()!;
  await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
  const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  const register = async (handle: string) => {
    const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
    expect(response.status).toBe(201);
    return response.headers.get("set-cookie")!.split(";", 1)[0]!;
  };
  const owner = await register("terminal_owner"), foreign = await register("terminal_foreign");
  const post = (path: string, body: unknown, cookie = owner) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-writer-id": "terminal-writer", cookie }, body: JSON.stringify(body) });
  for (const [index, [fen, move, side]] of [
    ["7k/8/5K2/6Q1/8/8/8/8 w - - 0 1", "g5g7", "white"],
    ["7k/8/6K1/5Q2/8/8/8/8 w - - 0 1", "f5f7", "white"],
    ["8/8/8/8/6q1/5k2/8/7K b - - 0 1", "g4g2", "black"],
    ["8/8/8/8/5q2/6k1/8/7K b - - 0 1", "f4f2", "black"],
  ].entries()) {
    const id = `terminal-${index}`;
    const created = await post("/runs", { id, session: { kind: "position", start: { fen, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 });
    expect(created.status, await created.clone().text()).toBe(201);
    const moved = await post(`/runs/${id}/moves`, { uci: move });
    expect(moved.status, await moved.clone().text()).toBe(200);
    const run = (await moved.json() as { run: DrillRun }).run;
    const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const request = { assistance, query: { timing: "review", nodeId: run.activeCursor.nodeId, requested: ["full_inspector"] } };
    expect((await post(`/runs/${id}/reveal`, {})).status).toBe(200);
    const saved = async () => JSON.stringify(await Promise.all(["graph", "events"].map(async action => {
      const response = await fetch(`${origin}/runs/${id}/${action}`, { headers: { cookie: owner } });
      expect(response.status).toBe(200); return response.json();
    })));
    const before = await saved();
    const response = await post(`/runs/${id}/modules/query`, request);
    expect(response.status, await response.clone().text()).toBe(200);
    const page = (await response.json() as { page: ModuleQueryPage }).page;
    const packet = page.packets.find(item => item.module === "full_inspector")!;
    expect(packet).toBeDefined();
    expect(parsePresentationReceipt(packet.receipt).length).toBeGreaterThan(0);
    expect(packet.receipt.items.some(item => item.evidenceRef?.projection.id === "rules.mobility.reading.legal_moves")).toBe(false);
    expect((await post(`/runs/${id}/modules/query`, request, foreign)).status).toBe(404);
    expect(await saved()).toBe(before);
  }
});
