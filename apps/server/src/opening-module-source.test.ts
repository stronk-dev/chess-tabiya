import type { AddressInfo } from "node:net";
import { compileAssistanceRequest, parsePresentationReceipt, presentedSentence, type DrillRun, type ModuleQueryPage } from "@chess-tabiya/runtime";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { recordedLastLevelFixture } from "../../../packages/runtime/src/testing/recorded-last-level-fixture.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";
import * as openingSource from "./opening-catalogue.js";
import type { ChessTabiyaApplication } from "./application.js";

const originalRoute = routes.invokeEvidenceValueRoute;
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "theory_only", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
let fixture: ReturnType<typeof applicationFixture<ChessTabiyaApplication>> | undefined;
let load: MockInstance<typeof openingSource.loadOpeningCatalogue>;
beforeEach(async () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  installEmptyApplicationCatalogues(); // Only unrelated authored content is replaced; the installed opening loader is real.
  load = vi.spyOn(openingSource, "loadOpeningCatalogue");
  fixture = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false }));
  await fixture.ready;
});
afterEach(async () => {
  await fixture?.close(); fixture = undefined;
  vi.restoreAllMocks();
});

async function client(fen = START, move = "e2e4") {
  const app = fixture?.current();
  if (app === undefined) throw new Error("Opening application not ready");
  await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
  const origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
  const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "opening_module", password: "opening-module-password" }) });
  expect(registered.status, await registered.text()).toBe(201);
  const headers = { "content-type": "application/json", cookie: registered.headers.get("set-cookie")!.split(";", 1)[0]!, "x-writer-id": "opening-module-writer" };
  const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const get = (path: string) => fetch(`${origin}${path}`, { headers });
  const created = await post("/runs", { id: "opening-module", session: { kind: "position", start: { fen, side: fen.split(" ")[1] === "b" ? "black" : "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 4 });
  expect(created.status, await created.text()).toBe(201);
  const moved = await post("/runs/opening-module/moves", { uci: move });
  expect(moved.status, await moved.text()).toBe(200);
  const revealed = await post("/runs/opening-module/reveal", {});
  expect(revealed.status, await revealed.text()).toBe(200);
  const graph = async () => (await (await get("/runs/opening-module/graph")).json() as { graph: Pick<DrillRun, "nodes" | "activeCursor"> }).graph;
  // This API client never requests an engine job. Local opening help must not require one.
  const nodeId = (await graph()).nodes.find(node => node.actor === "user" && node.moveUci === move)!.id;
  return { graph, get, ask: () => post("/runs/opening-module/modules/query", { assistance, query: { timing: "post_commit", subjectNodeId: nodeId, requested: ["theory_breadcrumb"] } }) };
}

describe("authenticated installed opening module delivery", () => {
  it.each([
    [START, "e2e4", "King's Pawn Game"],
    ["rnbqkb1r/pppppppp/5n2/8/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2", "e7e6", null],
  ] as const)("delivers the actual current endpoint or genuine unnamed result: %s / %s", async (fen, move, name) => {
    const app = await client(fen, move), before = await app.graph();
    const events = await (await app.get("/runs/opening-module/events?sinceSeq=0")).json();
    for (let request = 0; request < 2; request++) {
      const response = await app.ask();
      const body = await response.text(); expect(response.status, body).toBe(200);
      const page = (JSON.parse(body) as { page: ModuleQueryPage }).page;
      const packet = page.packets.find(packet => packet.module === "theory_breadcrumb")!;
      expect(packet).toBeDefined();
      const text = parsePresentationReceipt(packet.receipt).map(presentedSentence).join(" ");
      if (name === null) {
        expect(packet.receipt.items).toEqual([]);
        expect(packet.empty?.kind).toBe("stated_absence");
        expect(text).not.toMatch(/Opening in the cited catalogue/u);
      } else expect(text).toContain(name);
      expect(packet.unavailable.some(item => item.projection === "theory.opening.current_endpoint@1")).toBe(false);
      expect(body).not.toMatch(/endpointRow|membershipRow|descendantEndpointCount|positionInvocation/u);
    }
    expect(await app.graph()).toEqual(before);
    expect(await (await app.get("/runs/opening-module/events?sinceSeq=0")).json()).toEqual(events);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it.each(["foreign_position", "copied_source", "foreign_membership"] as const)("maps %s source corruption to typed unavailability, not a successful name or empty card", async fault => {
    const app = await client(), before = await app.graph();
    const foreign = recordedLastLevelFixture("white", "*", "foreign-opening", fault === "foreign_position" ? ["e2e4"] : [], fault === "foreign_position" ? START : "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1").run;
    const position = originalRoute("run.record.position@1", { run: foreign, nodeId: foreign.activeCursor.nodeId });
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
      if (fault === "foreign_position" && args[0] === "run.record.position@1") return position as never;
      if ((args[0] === "theory.opening.current_endpoint@1" && fault === "copied_source") || (args[0] === "theory.opening.catalogue_membership@1" && fault === "foreign_membership")) {
        const input = args[1];
        if (typeof input !== "object" || input === null || !("source" in input) || !("position" in input) || typeof input.source !== "object" || input.source === null) throw new Error("Expected the real opening factory's source pair");
        return originalRoute(args[0], fault === "copied_source" ? { source: { ...input.source }, position: input.position } as never : { source: input.source, position } as never) as never;
      }
      return originalRoute(...args);
    });
    const response = await app.ask();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: "EVIDENCE_UNAVAILABLE", message: "Requested recorded evidence source is invalid or changed" } });
    expect(await app.graph()).toEqual(before);
  });
});
