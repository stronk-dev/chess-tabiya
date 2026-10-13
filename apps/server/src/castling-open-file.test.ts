import type { AddressInfo } from "node:net";
import { compileAssistanceRequest, type ModuleQueryPage } from "@chess-tabiya/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CASTLING_OPEN_FILE_CASES, CASTLING_OPEN_FILE_NEGATIVES } from "../../../packages/runtime/src/testing/castling-open-file-fixtures.js";
import { OCCUPIED_TARGET_IDENTITY_CASES } from "../../../packages/runtime/src/testing/occupied-target-fixtures.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { assertDeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import { parseModuleQueryPage } from "../../web/src/lib/module-query-response.js";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";
import { ShapeRegistry } from "./shape-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { PackRegistry } from "./pack-registry.js";
import { TrainingSetRegistry } from "./training-set-registry.js";
import { CampaignRegistry } from "./campaign-registry.js";

let fixture: ReturnType<typeof applicationFixture<ChessTabiyaApplication>> | undefined;
beforeEach(async () => {
  installEmptyApplicationCatalogues();
  fixture = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false }));
  await fixture.ready;
});
afterEach(async () => { const owned = fixture; fixture = undefined; try { await owned?.close(); } finally { vi.restoreAllMocks(); } });

it("D3777 position-only castling controls own empty catalogues, not installed pack citations", async () => {
  expect(fixture?.current()).toBeDefined();
  for (const load of [ShapeRegistry.loadDefault, PrincipleRegistry.loadDefault, PackRegistry.loadDefault, TrainingSetRegistry.loadDefault, CampaignRegistry.loadDefault]) {
    expect(vi.isMockFunction(load)).toBe(true);
    const calls = vi.mocked(load);
    expect(calls).toHaveBeenCalledTimes(1);
    const result = calls.mock.results[0]!;
    expect(result.type).toBe("return");
    expect((await result.value).list()).toEqual([]);
  }
});

describe("D3757 authenticated castling-rook evidence", () => {
  it.each([...CASTLING_OPEN_FILE_CASES.map(value => ({ ...value, present: true })),
    ...CASTLING_OPEN_FILE_NEGATIVES.map(value => ({ ...value, side: value.fen.includes(" w ") ? "white" : "black", present: false }))])(
    "collects exact Nudge sources before unchanged selection, preserving access and saved play: $name", async value => {
      const app = fixture!.current()!;
      await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
      const register = async (handle: string) => {
        const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
        expect(response.status).toBe(201);
        return response.headers.get("set-cookie")!.split(";", 1)[0]!;
      };
      const cookie = await register("file_owner"), foreign = await register("file_foreign");
      const post = (path: string, body: unknown, identity = cookie) => fetch(`${origin}${path}`, {
        method: "POST", headers: { "content-type": "application/json", "x-writer-id": "file-writer", cookie: identity }, body: JSON.stringify(body),
      });
      const created = await post("/runs", { id: "file-evidence", session: { kind: "position", start: { fen: value.fen, side: value.side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 });
      expect(created.status, await created.clone().text()).toBe(201);
      const moved = await post("/runs/file-evidence/moves", { uci: value.uci });
      expect(moved.status, await moved.clone().text()).toBe(200);
      expect((await post("/runs/file-evidence/reveal", {})).status).toBe(200);
      const saved = async () => {
        const graph = await fetch(`${origin}/runs/file-evidence/graph`, { headers: { cookie } });
        const events = await fetch(`${origin}/runs/file-evidence/events`, { headers: { cookie } });
        expect(graph.status).toBe(200); expect(events.status).toBe(200);
        return { graph: (await graph.json() as { graph: { activeCursor: { nodeId: string } } }).graph, events: await events.json() };
      };
      const before = await saved();
      const request = { assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }),
        query: { timing: "post_commit", subjectNodeId: before.graph.activeCursor.nodeId, requested: [] } };
      const collected: unknown[] = [];
      const original = routes.invokeEvidenceValueRoute;
      vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
        const result = original(...args);
        if (args[0] === "derived.activity.event.open_file_occupancy@1" && typeof args[1] === "object" && args[1] !== null && "moveUci" in args[1] && args[1].moveUci === value.uci) {
          for (const item of result as readonly { evidence: Parameters<typeof assertDeclaredEvidence>[0] }[]) {
            assertDeclaredEvidence(item.evidence);
            collected.push(item.evidence.payload);
          }
        }
        return result;
      });
      const response = await post("/runs/file-evidence/modules/query", request);
      expect(response.status, await response.clone().text()).toBe(200);
      const body = await response.json() as { page: ModuleQueryPage };
      const parsed = parseModuleQueryPage(body, { runId: "file-evidence", subjectNodeId: before.graph.activeCursor.nodeId, finalDigest: body.page.effectiveConfigDigest });
      expect(parsed.packets.some(packet => packet.module === "postcommit_nudge")).toBe(true);
      if (value.present && "to" in value) {
        expect(collected).toHaveLength(1);
        expect(collected[0]).toMatchObject({ piece: { before: { square: value.from, piece: { color: value.side, role: "rook" } }, after: { square: value.to, piece: { color: value.side, role: "rook" } } }, fileClass: value.fileClass });
      } else expect(collected).toEqual([]);
      expect((await post("/runs/file-evidence/modules/query", request, foreign)).status).toBe(404);
      const anonymous = await fetch(`${origin}/runs/file-evidence/modules/query`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
      expect(anonymous.status).toBe(401);
      expect(await saved()).toEqual(before);
    });
});

describe("D3762 authenticated occupied-target collection", () => {
  it.each(OCCUPIED_TARGET_IDENTITY_CASES)("collects the retained target, never a replaced rook: $name", async value => {
    const app = fixture!.current()!;
    await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "target_owner", password: "target-owner-password" }) });
    expect(registered.status).toBe(201);
    await registered.text();
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const headers = { "content-type": "application/json", "x-writer-id": "target-writer", cookie };
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    const created = await post("/runs", { id: "target-evidence", session: { kind: "position", start: { fen: value.fen, side: value.side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1 });
    expect(created.status, await created.clone().text()).toBe(201);
    const moved = await post("/runs/target-evidence/moves", { uci: value.uci });
    expect(moved.status, await moved.clone().text()).toBe(200);
    expect((await post("/runs/target-evidence/reveal", {})).status).toBe(200);
    const saved = async () => {
      const graph = await fetch(`${origin}/runs/target-evidence/graph`, { headers });
      const events = await fetch(`${origin}/runs/target-evidence/events`, { headers });
      expect(graph.status).toBe(200); expect(events.status).toBe(200);
      return { graph: (await graph.json() as { graph: { activeCursor: { nodeId: string } } }).graph, events: await events.json() };
    };
    const before = await saved();
    const collected: unknown[] = [];
    let calls = 0;
    const original = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
      const result = original(...args);
      if (args[0] === "rules.transition.event.occupied_defence@1" && typeof args[1] === "object" && args[1] !== null && "moveUci" in args[1] && args[1].moveUci === value.uci) {
        calls += 1;
        for (const evidence of result as readonly Parameters<typeof assertDeclaredEvidence>[0][]) {
          assertDeclaredEvidence(evidence);
          const payload = evidence.payload as { subject: { target: string } };
          if (payload.subject.target === value.target) collected.push(payload);
        }
      }
      return result;
    });
    const response = await post("/runs/target-evidence/modules/query", {
      assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }),
      query: { timing: "post_commit", subjectNodeId: before.graph.activeCursor.nodeId, requested: [] },
    });
    expect(response.status, await response.clone().text()).toBe(200);
    const body = await response.json() as { page: ModuleQueryPage };
    expect(parseModuleQueryPage(body, { runId: "target-evidence", subjectNodeId: before.graph.activeCursor.nodeId, finalDigest: body.page.effectiveConfigDigest }).packets.some(packet => packet.module === "postcommit_nudge")).toBe(true);
    expect(calls).toBeGreaterThan(0);
    if (value.sign === null) expect(collected).toEqual([]);
    else expect(collected).toContainEqual(expect.objectContaining({ sign: value.sign, subject: { color: value.side, target: value.target, occupant: { color: value.side, role: "bishop" } } }));
    expect(await saved()).toEqual(before);
  });
});
