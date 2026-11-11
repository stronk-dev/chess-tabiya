import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { compileAssistanceRequest, hintDecisionStamp, parseHintResponse, projectRun, type CampaignDocument, type DrillRun } from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { afterEach, expect, it, vi } from "vitest";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { installEmptyApplicationCatalogues } from "./empty-application-catalogues.test-support.js";
import { HintService } from "./hint-service.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { CampaignRegistry } from "./campaign-registry.js";
import { PackRegistry } from "./pack-registry.js";

afterEach(() => vi.restoreAllMocks());

// D4237: actual durable campaign issuance, not a copied or manually branded receipt.
it.each([false, true])("Hint uses the issued Campaign workflow and its actual earned kit (Hint owned: %s)", { timeout: 30_000 }, async hasHint => {
  const document: DrillPackDefinition = {
    id: "hint-campaign-transport", version: "0.1.0", title: "Hint transport fixture", requires: [], mode: "outcome", phase: "middlegame",
    start: { fen: "k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1", side: "white" },
    objective: { type: "play_until_checkpoint", summary: "Reach the mechanical fixture boundary.", successConditions: [{ kind: "reach_checkpoint", checkpointId: "finish" }] },
    spine: [{ id: "move", moveUci: "a4b2", moveSan: "Nb2", children: [] }],
    checkpoints: [{ id: "start", label: "Start", trigger: { atStart: true }, actions: [] }, { id: "finish", label: "Boundary", trigger: { atSpineNode: "move" }, actions: [] }],
    feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "theory_strict" },
    provenance: { sources: ["Mechanical transport fixture; no strategic lesson."], licence: "CC0-1.0", reviewStatus: "draft" },
  };
  const original = JSON.parse(readFileSync(new URL("../../../tests/browser/fixtures/campaign.browser.json", import.meta.url), "utf8")) as CampaignDocument;
  const campaign: CampaignDocument = { ...original, startingModules: hasHint ? ["guided_hint"] : [] };
  for (const act of campaign.acts) for (const layer of act.layers) for (const node of layer.choices) Object.assign(node, { encounter: { kind: "pack", packId: document.id } });
  installEmptyApplicationCatalogues();
  vi.spyOn(PackRegistry, "loadDefault").mockImplementation(options => PackRegistry.fromDocuments([{ source: "hint-campaign-transport", value: withDerivedRequires(document) }], options));
  vi.spyOn(CampaignRegistry, "loadDefault").mockImplementation(packs => CampaignRegistry.fromDocuments([{ source: "hint-campaign-transport", value: campaign }], packs));
  const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false });
  const request = vi.spyOn(HintService.prototype, "request");
  const search = vi.spyOn(application.providers.scheduler, "get");
  try {
    await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "hint_campaign", password: "hint-campaign-password" }) });
    expect(registered.status).toBe(201);
    const headers = { "content-type": "application/json", cookie: registered.headers.get("set-cookie")!.split(";", 1)[0]!, "x-writer-id": "hint-campaign-writer" };
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    const created = await post(`/campaigns/${campaign.id}/runs`, { campaignVersion: campaign.version, commandId: "create-hint-campaign" });
    expect(created.status, await created.clone().text()).toBe(201);
    const createdBody = await created.json() as { result: { campaignRunId: string } };
    const entered = await post(`/campaign-runs/${createdBody.result.campaignRunId}/nodes/f1-a/start`, { expectedRevision: 1, commandId: "start-hint-campaign" });
    expect(entered.status, await entered.clone().text()).toBe(201);
    const enteredBody = await entered.json() as { result: { response: { playRunId: string } } };
    const runId = enteredBody.result.response.playRunId;
    const events = await (await fetch(`${origin}/runs/${runId}/events`, { headers })).json() as { events: DrillRun["events"] };
    const run = projectRun(events.events);
    expect(run.sessionKind).toBe("pack");
    const response = await post(`/runs/${runId}/hints`, { clientRequestId: "0".repeat(32), nodeId: run.activeCursor.nodeId, decisionDigest: hintDecisionStamp(run).digest, rung: "pattern",
      assistance: compileAssistanceRequest({ contextHint: "campaign", preference: { kind: "unset" } }) });
    expect(response.status, await response.clone().text()).toBe(200);
    let hint = parseHintResponse((await response.json() as { hint: unknown }).hint);
    if (!hasHint) {
      expect(hint).toMatchObject({ state: "policy_refused", reason: "module_inactive" });
      expect(request).not.toHaveBeenCalled(); expect(search).not.toHaveBeenCalled(); return;
    }
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]![0].session).toBe("campaign");
    expect(request.mock.calls[0]![0].revalidate()).toBe(true);
    const requestId = hint.state === "pending" ? hint.requestId : hint.state === "available" ? hint.delivery.requestId : "";
    await vi.waitFor(async () => {
      const polled = await fetch(`${origin}/runs/${runId}/hints/${requestId}`, { headers });
      expect(polled.status).toBe(200);
      hint = parseHintResponse((await polled.json() as { hint: unknown }).hint);
      expect(hint.state).toBe("available");
    });
    expect(search).toHaveBeenCalledTimes(1);
  } finally { request.mockRestore(); search.mockRestore(); await application.close(); }
});
