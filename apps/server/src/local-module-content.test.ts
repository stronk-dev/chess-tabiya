// D3643: the two original installed-pack controls retain real default application composition.
// Unlike the unauthored software suite, this is deliberately owned by the content tier.
import type { AddressInfo } from "node:net";
import { compileAssistanceRequest, MODULE_IDS, type ModuleId, type ModuleQueryPage } from "@chess-tabiya/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as authored from "./authored-feedback.js";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { ShapeRegistry } from "./shape-registry.js";

let fixture: ReturnType<typeof applicationFixture<ChessTabiyaApplication>> | undefined;
beforeEach(async () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  fixture = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false }));
  await fixture.ready;
});
afterEach(async () => {
  vi.restoreAllMocks();
  const owned = fixture;
  fixture = undefined;
  await owned?.close();
});

describe("installed-pack local Support execution", () => {
  for (const module of ["sight_on_request", "threat_radar"] as const) {
    it(`${module}: a real installed pack does not project unrelated authored feedback`, async () => {
      const application = fixture!.current()!;
      await new Promise<void>((resolve, reject) => {
        application.server.once("error", reject);
        application.server.listen(0, "127.0.0.1", resolve);
      });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "local_module", password: "local-module-password" }) });
      expect(registered.status).toBe(201);
      await registered.text();
      const headers = { "content-type": "application/json", cookie: registered.headers.get("set-cookie")!.split(";", 1)[0]!, "x-writer-id": "local-module-writer" };
      const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
      const created = await post("/runs", { id: "local-module", session: { kind: "pack", packId: "carlsbad-minority-attack" }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 4 });
      expect(created.status, await created.text()).toBe(201);
      const graphResponse = await fetch(`${origin}/runs/local-module/graph`, { headers });
      expect(graphResponse.status).toBe(200);
      const { graph } = await graphResponse.json() as { graph: { activeCursor: { nodeId: string } } };
      const project = vi.spyOn(authored, "projectAuthoredFeedback").mockImplementation(() => { throw new Error("unrelated authored feedback unavailable"); });
      const prepare = vi.spyOn(ShapeRegistry.prototype, "list");
      const response = await post("/runs/local-module/modules/query", {
        assistance: compileAssistanceRequest({ contextHint: "pack", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [module], exclude: MODULE_IDS.filter((id): id is Exclude<ModuleId, "rules_floor"> => id !== module && id !== "rules_floor") } } }),
        query: { timing: "pre_commit", nodeId: graph.activeCursor.nodeId, selectedSquare: "c6", requested: [module] },
      });
      const body = await response.text();
      expect(response.status, body).toBe(200);
      expect((JSON.parse(body) as { page: ModuleQueryPage }).page.packets.map(packet => packet.module)).toEqual([module]);
      expect(project).not.toHaveBeenCalled();
      expect(prepare).not.toHaveBeenCalled();
    }, 5_000); // Preserve the original software-case deadline in the content tier.
  }
});
