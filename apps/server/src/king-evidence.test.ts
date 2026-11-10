// D3635: existing breadth-collectors §3.7 evidence reaches the actual authenticated
// application/source-page boundary. Position-only fixtures own empty installed catalogues;
// they do not qualify default-content boot or D3928's outstanding capability declarations.
import type { AddressInfo } from "node:net";
import { compileAssistanceRequest, moduleDecisionStamp, type DrillRun } from "@chess-tabiya/runtime";
import type { InspectorQueryPage, InspectorQueryRequest } from "../../../packages/runtime/src/inspector-query-contract.js";
import { parseInspectorQueryPage } from "../../web/src/lib/inspector-query-response.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";

let fixture: ReturnType<typeof applicationFixture<ChessTabiyaApplication>> | undefined;
beforeEach(async () => {
  // Unauthored position evidence only. D3928's installed-content boot refusal is not
  // waived: these fixtures own empty catalogues and do not qualify default content.
  installEmptyApplicationCatalogues();
  fixture = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false }));
  await fixture.ready;
});
afterEach(async () => {
  const owned = fixture;
  fixture = undefined;
  try { await owned?.close(); }
  finally { vi.restoreAllMocks(); }
});

describe("D3635 authenticated Inspector king escapes", () => {
  it.each([
    // Each complete source relation must survive authenticated delivery and the strict receiver.
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
    const reveal = await post("/runs/king-evidence/reveal", {});
    expect(reveal.status).toBe(200);
    const run = (await reveal.json() as { run: DrillRun }).run;
    const savedState = async () => JSON.stringify(await Promise.all(["graph", "events"].map(async action => {
      const response = await fetch(`${origin}/runs/king-evidence/${action}`, { headers: { cookie } });
      expect(response.status).toBe(200);
      return response.json();
    })));
    const saved = await savedState();
    const request: InspectorQueryRequest = { protocol: "inspector.query_page@1", assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }), query: { ...run.activeCursor, decisionDigest: moduleDecisionStamp(run).digest,
      view: { kind: "source", projection: "rules.king.reading.zone_state@1", context: { kind: "position" }, start: 0, collectionKey: null } } };
    const response = await post("/runs/king-evidence/inspector/query", request);
    expect(response.status, await response.clone().text()).toBe(200);
    const wire = await response.json() as InspectorQueryPage;
    expect(wire.kind).toBe("page"); if (wire.kind !== "page") throw new Error("Expected king-zone source page");
    const page = parseInspectorQueryPage(wire, { runId: run.id, request, fen: run.nodes.find(node => node.id === run.activeCursor.nodeId)!.fen, requestedDigest: wire.requestedConfigDigest, finalDigest: wire.effectiveConfigDigest });
    expect(page.kind).toBe("page"); if (page.kind !== "page") throw new Error("King-zone source failed receiver");
    expect(page.body).toMatchObject({ kind: "source", outcome: { kind: "available", collected: 1, displayed: 1 } });
    const overlay = page.items.find(item => item.evidenceRef?.projection.id === "rules.king.reading.zone_state" && item.component.id === "relation_overlay")!;
    expect(overlay, JSON.stringify(page.body)).toBeDefined();
    if (overlay.component.id !== "relation_overlay") throw new Error("Expected king-zone overlay");
    expect(overlay.component.operand.edges.filter(edge => edge.from === value.king && edge.relation === "moves_to").map(edge => edge.to).sort()).toEqual(value.squares);
    expect((await post("/runs/king-evidence/inspector/query", request, foreign)).status).toBe(404);
    const anonymous = await fetch(`${origin}/runs/king-evidence/inspector/query`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
    expect(anonymous.status).toBe(401);
    expect(await savedState()).toBe(saved);
  });
});
