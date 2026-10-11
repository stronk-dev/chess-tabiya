import { readFileSync } from "node:fs";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { branchPath, compareBranches, projectRun, rewind, type BranchComparison, type CampaignDocument, type MutationResult } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";
import { CampaignRegistry } from "./campaign-registry.js";
import { CampaignService } from "./campaign-service.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry } from "./pack-registry.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

// Mechanical transport fixture, not a chess lesson. A named checkpoint distinguishes
// the two legal authored lines, so position-only promotion cannot satisfy parity.
const document: DrillPackDefinition = {
  id: "authored-promotion-fixture", version: "0.1.0", title: "Authored promotion fixture", requires: [],
  mode: "outcome", phase: "middlegame", start: { fen: "4k3/8/8/8/8/8/7P/6K1 w - - 0 1", side: "white" },
  objective: { type: "play_until_checkpoint", summary: "Reach the named fixture checkpoint.", successConditions: [{ kind: "reach_checkpoint", checkpointId: "finish" }] },
  spine: [
    { id: "h3", moveUci: "h2h3", moveSan: "h3", children: [{ id: "reply-h3", moveUci: "e8f8", moveSan: "Kf8", children: [] }] },
    { id: "h4", moveUci: "h2h4", moveSan: "h4", children: [{ id: "reply-h4", moveUci: "e8f8", moveSan: "Kf8", children: [] }] },
  ],
  checkpoints: [{ id: "finish", label: "Fixture boundary reached", trigger: { atSpineNode: "reply-h3" }, actions: [] }],
  feedbackPolicy: "segment_end", opponentPolicy: { mode: "theory_strict" },
  provenance: { sources: ["Mechanical transport fixture; no strategic claim."], licence: "CC0-1.0", reviewStatus: "draft" },
};
const at = "2026-10-11T10:00:00.000Z";
const principal = { learnerId: "__legacy", handle: "__legacy" };
const writerId = "writer-preview";
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const stores: SQLiteRunStorage[] = [];
afterEach(() => { for (const storage of stores.splice(0)) storage.close(); });

async function setup(charged: boolean) {
  const packs = await PackRegistry.fromDocuments([{ source: "promotion-test", value: withDerivedRequires(document) }]);
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => undefined });
  stores.push(storage);
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  // Intentionally no engine queue: authored demonstrations and their promotion need none.
  const service = new RunService(storage, { packRegistry: packs });
  let campaigns: CampaignService | undefined;
  let campaignRunId: string | undefined;
  let runId = "promotion-run";
  if (charged) {
    const campaign = JSON.parse(readFileSync(new URL("../../../tests/browser/fixtures/campaign.browser.json", import.meta.url), "utf8")) as CampaignDocument;
    for (const act of campaign.acts) for (const layer of act.layers) for (const node of layer.choices) {
      Object.assign(node, { encounter: { kind: "pack", packId: document.id } });
    }
    const registry = await CampaignRegistry.fromDocuments([{ source: "promotion-campaign", value: campaign }], { get: id => packs.get(id)?.document });
    campaigns = new CampaignService({ storage, packs, registry, runs: service, policyConfig: async () => policyConfig, now: () => at });
    campaignRunId = campaigns.create(principal, campaign.id, { campaignVersion: campaign.version, commandId: "cmd-create-preview" }).campaign.campaignRun.id;
    await campaigns.start(principal, campaignRunId, "f1-a", { expectedRevision: 1, commandId: "cmd-start-preview" }, writerId);
    runId = storage.campaigns.run(campaignRunId)!.activeEncounterRunId!;
  } else {
    await service.create({ id: runId, session: { kind: "pack", packId: document.id }, policyConfig, seed: 1, createdAt: at }, { writerId, learnerId: principal.learnerId });
  }
  const handler = createRestHandler(service);
  const call = async (action: string, body: unknown) => handler(new Request(`http://server.test/runs/${runId}/${action}`, {
    method: "POST", headers: { "content-type": "application/json", "x-writer-id": writerId }, body: JSON.stringify(body),
  }));
  return { storage, runId, call, campaigns, campaignRunId };
}

function consequences(comparison: BranchComparison, branchId: string) {
  const value = comparison.consequences[branchId]!;
  // Missed checkpoints are relative to the compared set. The unchosen scratch branch
  // must not be persisted just to reproduce that set's comparative absence list.
  return { objectiveState: value.objectiveState, terminal: value.terminal, checkpointsReached: value.checkpointsReached };
}

describe("D3709 authored preview promotion", () => {
  it("counts authored consequences in the 800-event limit and refuses without consuming the preview", async () => {
    const { storage, runId, call } = await setup(false);
    let before = storage.read(runId)!.run;
    const root = before.nodes[0]!.id;
    while (before.events.length < 796) before = rewind(before, root, at).run;
    storage.save(before, { writerId, learnerId: principal.learnerId });
    expect(projectRun(before.events)).toEqual(before);
    const preview = await call("simulate", { at });
    expect(preview.status, await preview.clone().text()).toBe(200);
    const { simulationId } = await preview.json() as { simulationId: string };
    expect(before.events.length + 3).toBeLessThanOrEqual(800); // fork + bare moves would pass
    expect(before.events.length + 5).toBe(801); // checkpoint and objective are real events too
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await call("simulate-enter", { simulationId, branchIndex: 0, at });
      expect(response.status, await response.clone().text()).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: "SIMULATE_BUDGET_EXCEEDED" } });
      expect(storage.read(runId)!.run).toEqual(before);
    }
  });

  for (const charged of [false, true]) for (const branchIndex of [0, 1]) {
    it(`preserves the chosen authored consequences (Campaign=${charged}, choice=${branchIndex})`, async () => {
      const { storage, runId, call, campaigns, campaignRunId } = await setup(charged);
      const before = storage.read(runId)!.run;
      const preview = await call("simulate", { at });
      expect(preview.status, await preview.clone().text()).toBe(200);
      const simulation = await preview.json() as { simulationId: string; comparison: BranchComparison; branches: { leafFen: string; plies: number }[] };
      expect(storage.read(runId)!.run).toEqual(before);
      if (charged) expect(campaigns!.read(principal, campaignRunId!).charges).toMatchObject({ spent: 0, balance: 1 });
      const previewBranch = simulation.comparison.columns[branchIndex]!.branchId;
      const expected = consequences(simulation.comparison, previewBranch);
      expect(expected.checkpointsReached).toEqual(branchIndex === 0 ? ["finish"] : []);
      expect(expected.objectiveState).toBe(branchIndex === 0 ? "achieved" : "active");
      const campaignCommand = { commandId: "cmd-enter-preview", expectedCampaignRevision: 2, expectedPlayRevision: before.events.at(-1)!.seq };
      const body = { simulationId: simulation.simulationId, branchIndex, at, ...(charged ? { campaignCommand } : {}) };
      const response = await call("simulate-enter", body);
      expect(response.status, await response.clone().text()).toBe(200);
      const entered = await response.json() as MutationResult;
      const saved = storage.read(runId)!.run;
      expect(saved).toEqual(entered.run);
      expect(projectRun(saved.events)).toEqual(saved);
      expect(entered.emitted).toEqual(saved.events.slice(before.events.length));
      const branchId = saved.activeCursor.branchId;
      expect(saved.branches.filter(branch => branch.origin === "simulated")).toHaveLength(1);
      const path = branchPath(saved, branchId);
      expect(path.at(-1)!.fen).toBe(simulation.branches[branchIndex]!.leafFen);
      expect(path.slice(1).map(node => node.actor)).toEqual(["system", "system"]);
      const comparison = compareBranches(saved, [saved.branches[0]!.id, branchId], { pack: document });
      expect(consequences(comparison, branchId)).toEqual(expected);
      expect(saved.events.filter(event => event.type === "checkpoint.reached").map(event => event.data.checkpointId)).toEqual(expected.checkpointsReached);
      if (charged) {
        const campaignBeforeRetry = campaigns!.read(principal, campaignRunId!);
        expect(campaignBeforeRetry.charges).toMatchObject({ spent: 1, balance: 0 });
        const retry = await call("simulate-enter", body);
        expect(retry.status, await retry.clone().text()).toBe(200);
        expect((await retry.json() as MutationResult).emitted).toEqual(entered.emitted);
        expect(storage.read(runId)!.run).toEqual(saved);
        expect(campaigns!.read(principal, campaignRunId!)).toEqual(campaignBeforeRetry);
      } else {
        expect((await call("simulate-enter", body)).status).toBe(410);
        expect(storage.read(runId)!.run).toEqual(saved);
      }
    });
  }
});
