// D3635: existing breadth-collectors §3.7 evidence reaches the actual authenticated
// application/module boundary. Fixture deployment disables only the file-backed worker.
import type { AddressInfo } from "node:net";
import { compileAssistanceRequest, parsePresentationReceipt, type DrillRun, type ModuleQueryPage } from "@chess-tabiya/runtime";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";

let fixture: ReturnType<typeof applicationFixture<ChessTabiyaApplication>> | undefined;
beforeEach(async () => {
  fixture = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false }));
  await fixture.ready;
});
afterEach(async () => {
  const owned = fixture;
  fixture = undefined;
  await owned?.close();
});

describe("D3635 authenticated Inspector king escapes", () => {
  it.each([
    // These complete relations fit the unchanged Inspector arrow budget, including
    // the preceding defender-duty fact. Broader readings are legitimately elided.
    { fen: "7k/8/8/8/8/8/8/KR6 w B - 0 1", side: "white", king: "a1", squares: ["a2", "b2"] },
    { fen: "kr6/8/8/8/8/8/8/7K b b - 0 1", side: "black", king: "a8", squares: ["a7", "b7"] },
  ])("delivers physical $side escapes without mutating saved play", async value => {
    const app = fixture!.current()!;
    await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    const register = async (handle: string) => {
      const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
      expect(response.status).toBe(201);
      return response.headers.get("set-cookie")!.split(";", 1)[0]!;
    };
    const cookie = await register("king_owner");
    const foreign = await register("king_foreign");
    const post = (path: string, body: unknown, identity: string | undefined = cookie) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-writer-id": "king-writer", ...(identity === undefined ? {} : { cookie: identity }) }, body: JSON.stringify(body) });
    const created = await post("/runs", { id: "king-evidence", session: { kind: "position", start: { fen: value.fen, side: value.side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 });
    expect(created.status, await created.clone().text()).toBe(201);
    const run = (await created.json() as { run: DrillRun }).run;
    expect((await post("/runs/king-evidence/reveal", {})).status).toBe(200);
    const savedState = async () => JSON.stringify(await Promise.all(["graph", "events"].map(async action => {
      const response = await fetch(`${origin}/runs/king-evidence/${action}`, { headers: { cookie } });
      expect(response.status).toBe(200);
      return response.json();
    })));
    const saved = await savedState();
    const request = { assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }), query: { timing: "review", nodeId: run.activeCursor.nodeId, requested: ["full_inspector"] } };
    const response = await post("/runs/king-evidence/modules/query", request);
    expect(response.status, await response.clone().text()).toBe(200);
    const page = (await response.json() as { page: ModuleQueryPage }).page;
    const packet = page.packets.find(item => item.module === "full_inspector")!;
    expect(packet).toBeDefined();
    const overlay = parsePresentationReceipt(packet.receipt).find(item => item.evidenceRef?.projection.id === "rules.king.reading.zone_state" && item.component.id === "relation_overlay")!;
    expect(overlay, JSON.stringify({ budget: packet.budget, projections: packet.receipt.items.map(item => item.evidenceRef?.projection), empty: packet.empty })).toBeDefined();
    if (overlay.component.id !== "relation_overlay") throw new Error("Expected king-zone overlay");
    expect(overlay.component.operand.edges.filter(edge => edge.from === value.king && edge.relation === "moves_to").map(edge => edge.to).sort()).toEqual(value.squares);
    expect((await post("/runs/king-evidence/modules/query", request, foreign)).status).toBe(404);
    const anonymous = await fetch(`${origin}/runs/king-evidence/modules/query`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
    expect(anonymous.status).toBe(401);
    expect(await savedState()).toBe(saved);
  });
});
