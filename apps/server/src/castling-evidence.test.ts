// D3641: the stationary-king reading reaches the actual authenticated application.
import type { AddressInfo } from "node:net";
import { compileAssistanceRequest, parsePresentationReceipt, presentedSentence, type DrillRun, type ModuleQueryPage } from "@chess-tabiya/runtime";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";

let fixture: ReturnType<typeof applicationFixture<ChessTabiyaApplication>> | undefined;
beforeEach(async () => { fixture = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false })); await fixture.ready; });
afterEach(async () => { const owned = fixture; fixture = undefined; await owned?.close(); });

describe("exact castling legality in authenticated Inspector", () => {
  it.each([
    { fen: "r6k/8/8/8/8/8/b1n5/R1K5 w A - 0 1", side: "white", rook: "a1" },
    { fen: "r1k5/B1N5/8/8/8/8/8/R6K b a - 0 1", side: "black", rook: "a8" },
    { fen: "k7/8/8/8/8/8/5n1P/6KR w K - 0 1", side: "white", rook: "h1" },
    { fen: "6kr/5N1p/8/8/8/8/8/K7 b k - 0 1", side: "black", rook: "h8" },
  ])("D3652 removes the false trapped-rook claim from actual Support and Inspector: $rook", async value => {
    const app = fixture!.current()!;
    await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    const register = async (handle: string) => {
      const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
      expect(response.status).toBe(201);
      return response.headers.get("set-cookie")!.split(";", 1)[0]!;
    };
    const cookie = await register("trap_owner"), foreign = await register("trap_foreign");
    const post = (path: string, body: unknown, identity = cookie) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-writer-id": "trap-writer", cookie: identity }, body: JSON.stringify(body) });
    const noCastle = Chess.fromSetup(parseFen(value.fen).unwrap()).unwrap();
    noCastle.castles.discardColor(noCastle.turn);
    for (const [index, fen] of [value.fen, makeFen(noCastle.toSetup())].entries()) {
      const id = `trapped-castle-${index}`;
      const created = await post("/runs", { id, session: { kind: "position", start: { fen, side: value.side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 });
      expect(created.status, await created.clone().text()).toBe(201);
      const run = (await created.json() as { run: DrillRun }).run;
      expect((await post(`/runs/${id}/reveal`, {})).status).toBe(200);
      const savedState = async () => JSON.stringify(await Promise.all(["graph", "events"].map(async action => {
        const response = await fetch(`${origin}/runs/${id}/${action}`, { headers: { cookie } });
        expect(response.status).toBe(200); return response.json();
      })));
      const saved = await savedState();
      for (const module of ["threat_radar", "full_inspector"] as const) {
        const request = { assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: module === "full_inspector" ? "analysis" : "support", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }), query: { timing: module === "full_inspector" ? "review" : "pre_commit", nodeId: run.activeCursor.nodeId, requested: [module] } };
        const response = await post(`/runs/${id}/modules/query`, request);
        expect(response.status, await response.clone().text()).toBe(200);
        const page = (await response.json() as { page: ModuleQueryPage }).page;
        const packet = page.packets.find(item => item.module === module)!;
        expect(packet, JSON.stringify(page)).toBeDefined();
        const items = parsePresentationReceipt(packet.receipt).filter(item => item.evidenceRef?.projection.id === "rules.tactic.reading.trapped_piece");
        if (index === 0) expect(items).toEqual([]);
        else if (module === "full_inspector") {
          expect(items.length).toBeGreaterThan(0);
          expect(items.map(presentedSentence).join(" ")).toContain(value.rook);
        }
        expect((await post(`/runs/${id}/modules/query`, request, foreign)).status).toBe(404);
      }
      expect(await savedState()).toBe(saved);
    }
  });

  it.each([
    { fen: "4k3/8/8/8/8/8/8/6KR w K - 0 1", side: "white", sentence: "White can castle kingside now." },
    { fen: "6kr/8/8/8/8/8/8/4K3 b k - 0 1", side: "black", sentence: "Black can castle kingside now." },
    { fen: "7k/8/8/8/8/8/8/rRK5 w B - 0 1", side: "white", sentence: "White cannot castle queenside now: c1 is attacked." },
    { fen: "Rrk5/8/8/8/8/8/8/7K b b - 0 1", side: "black", sentence: "Black cannot castle queenside now: c8 is attacked." },
    // D3642, FIDE Guidelines II.3.2.7(4): the rook's route must also be clear.
    { fen: "4k3/8/8/8/8/8/8/RN2K3 w Q - 0 1", side: "white", sentence: "White cannot castle queenside now: b1 is occupied." },
    { fen: "rn2k3/8/8/8/8/8/8/4K3 b q - 0 1", side: "black", sentence: "Black cannot castle queenside now: b8 is occupied." },
    { fen: "4k3/8/8/8/8/8/8/1RKN4 w B - 0 1", side: "white", sentence: "White cannot castle queenside now: d1 is occupied." },
    { fen: "1rkn4/8/8/8/8/8/8/4K3 b b - 0 1", side: "black", sentence: "Black cannot castle queenside now: d8 is occupied." },
    { fen: "4k3/8/8/8/8/8/8/5NKR w K - 0 1", side: "white", sentence: "White cannot castle kingside now: f1 is occupied." },
    { fen: "5nkr/8/8/8/8/8/8/4K3 b k - 0 1", side: "black", sentence: "Black cannot castle kingside now: f8 is occupied." },
    { fen: "4k3/8/8/8/8/8/8/RK1N4 w A - 0 1", side: "white", sentence: "White cannot castle queenside now: d1 is occupied." },
    { fen: "rk1n4/8/8/8/8/8/8/4K3 b a - 0 1", side: "black", sentence: "Black cannot castle queenside now: d8 is occupied." },
    // Completed negatives: same rights/geometry, with only that knight removed.
    { fen: "4k3/8/8/8/8/8/8/R3K3 w Q - 0 1", side: "white", sentence: "White can castle queenside now." },
    { fen: "r3k3/8/8/8/8/8/8/4K3 b q - 0 1", side: "black", sentence: "Black can castle queenside now." },
    { fen: "4k3/8/8/8/8/8/8/1RK5 w B - 0 1", side: "white", sentence: "White can castle queenside now." },
    { fen: "1rk5/8/8/8/8/8/8/4K3 b b - 0 1", side: "black", sentence: "Black can castle queenside now." },
    { fen: "4k3/8/8/8/8/8/8/6KR w K - 0 1", side: "white", sentence: "White can castle kingside now." },
    { fen: "6kr/8/8/8/8/8/8/4K3 b k - 0 1", side: "black", sentence: "Black can castle kingside now." },
    { fen: "4k3/8/8/8/8/8/8/RK6 w A - 0 1", side: "white", sentence: "White can castle queenside now." },
    { fen: "rk6/8/8/8/8/8/8/4K3 b a - 0 1", side: "black", sentence: "Black can castle queenside now." },
  ])("returns exact legal/attacked reasons for $fen without changing saved play", async value => {
    const app = fixture!.current()!;
    await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    const register = async (handle: string) => {
      const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
      expect(response.status).toBe(201);
      return response.headers.get("set-cookie")!.split(";", 1)[0]!;
    };
    const cookie = await register("castle_owner"), foreign = await register("castle_foreign");
    const post = (path: string, body: unknown, identity: string | undefined = cookie) => fetch(`${origin}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-writer-id": "castle-writer", ...(identity === undefined ? {} : { cookie: identity }) }, body: JSON.stringify(body) });
    const created = await post("/runs", { id: "castle-evidence", session: { kind: "position", start: { fen: value.fen, side: value.side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 });
    expect(created.status, await created.clone().text()).toBe(201);
    const run = (await created.json() as { run: DrillRun }).run;
    expect((await post("/runs/castle-evidence/reveal", {})).status).toBe(200);
    const savedState = async () => JSON.stringify(await Promise.all(["graph", "events"].map(async action => {
      const response = await fetch(`${origin}/runs/castle-evidence/${action}`, { headers: { cookie } });
      expect(response.status).toBe(200); return response.json();
    })));
    const saved = await savedState();
    const request = { assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }), query: { timing: "review", nodeId: run.activeCursor.nodeId, requested: ["full_inspector"] } };
    const response = await post("/runs/castle-evidence/modules/query", request);
    expect(response.status, await response.clone().text()).toBe(200);
    const page = (await response.json() as { page: ModuleQueryPage }).page;
    const packet = page.packets.find(item => item.module === "full_inspector")!;
    expect(packet).toBeDefined();
    const items = parsePresentationReceipt(packet.receipt).filter(item => item.evidenceRef?.projection.id === "rules.castling.reading.legality");
    expect(items, JSON.stringify(packet.empty)).toHaveLength(1);
    expect(presentedSentence(items[0]!)).toBe(value.sentence);
    expect((await post("/runs/castle-evidence/modules/query", request, foreign)).status).toBe(404);
    const anonymous = await fetch(`${origin}/runs/castle-evidence/modules/query`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
    expect(anonymous.status).toBe(401);
    expect(await savedState()).toBe(saved);
  });
});
