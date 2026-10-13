import { readFileSync } from "node:fs";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { attachEvidence, branchPath, compareBranches, feedbackDisclosed, fork, projectRun, rewind, transitionObjective, type BranchComparison, type CampaignDocument, type MutationResult } from "@chess-tabiya/runtime";
import * as runtime from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
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
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });

async function setup(charged: boolean, fixture: DrillPackDefinition = document) {
  const packs = await PackRegistry.fromDocuments([{ source: "promotion-test", value: withDerivedRequires(fixture) }]);
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
      Object.assign(node, { encounter: { kind: "pack", packId: fixture.id } });
    }
    const registry = await CampaignRegistry.fromDocuments([{ source: "promotion-campaign", value: campaign }], { get: id => packs.get(id)?.document });
    campaigns = new CampaignService({ storage, packs, registry, runs: service, policyConfig: async () => policyConfig, now: () => at });
    campaignRunId = campaigns.create(principal, campaign.id, { campaignVersion: campaign.version, commandId: "cmd-create-preview" }).campaign.campaignRun.id;
    await campaigns.start(principal, campaignRunId, "f1-a", { expectedRevision: 1, commandId: "cmd-start-preview" }, writerId);
    runId = storage.campaigns.run(campaignRunId)!.activeEncounterRunId!;
  } else {
    await service.create({ id: runId, session: { kind: "pack", packId: fixture.id }, policyConfig, seed: 1, createdAt: at }, { writerId, learnerId: principal.learnerId });
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

describe("D3775 simulation admission and publication", () => {
  it("refuses a one-line comparison before walking or publishing scratch state", async () => {
    const { storage, runId, call } = await setup(false);
    const before = storage.read(runId)!.run;
    const forkSpy = vi.spyOn(runtime, "fork");
    const compareSpy = vi.spyOn(runtime, "compareBranches");
    const publicationSpy = vi.spyOn(Map.prototype, "set");
    const response = await call("simulate", { maxBranches: 1, at });
    expect(response.status, await response.clone().text()).toBe(422);
    expect(await response.json()).toMatchObject({ error: { code: "SIMULATE_TOO_LARGE" } });
    expect(forkSpy).not.toHaveBeenCalled();
    expect(compareSpy).not.toHaveBeenCalled();
    expect(publicationSpy.mock.calls.filter(([, value]) => isScratchEntry(value, runId))).toHaveLength(0);
    expect(storage.read(runId)!.run).toEqual(before);
  });

  for (const fault of ["comparison", "leaf metadata"] as const) {
    it(`does not publish an entry when ${fault} construction fails`, async () => {
      const { storage, runId, call } = await setup(false);
      const before = storage.read(runId)!.run;
      const constructionSpy = fault === "comparison"
        ? vi.spyOn(runtime, "compareBranches").mockImplementationOnce(() => { throw new TypeError("controlled comparison failure"); })
        : vi.spyOn(runtime, "branchPath").mockImplementationOnce(() => { throw new TypeError("controlled leaf metadata failure"); });
      const publicationSpy = vi.spyOn(Map.prototype, "set");
      const response = await call("simulate", { at });
      expect(response.status, await response.clone().text()).toBe(500);
      expect(constructionSpy).toHaveBeenCalled();
      expect(publicationSpy.mock.calls.filter(([, value]) => isScratchEntry(value, runId))).toHaveLength(0);
      expect(storage.read(runId)!.run).toEqual(before);
    });
  }

  for (const maxBranches of [2, 8]) {
    it(`publishes one complete ${maxBranches}-limit preview and preserves chosen-line entry`, async () => {
      const { storage, runId, call } = await setup(false);
      const before = storage.read(runId)!.run;
      const publicationSpy = vi.spyOn(Map.prototype, "set");
      const response = await call("simulate", { maxBranches, at });
      expect(response.status, await response.clone().text()).toBe(200);
      const preview = await response.json() as ReturnType<RunService["simulate"]>;
      const publications = publicationSpy.mock.calls.filter(([, value]) => isScratchEntry(value, runId));
      expect(publications).toHaveLength(1);
      expect(publications[0]![0]).toBe(preview.simulationId);
      expect(preview.comparison.columns).toHaveLength(2);
      expect(preview.branches.map(branch => branch.index)).toEqual([0, 1]);
      expect(storage.read(runId)!.run).toEqual(before);
      const entered = await call("simulate-enter", { simulationId: preview.simulationId, branchIndex: 1, at });
      expect(entered.status, await entered.clone().text()).toBe(200);
      const saved = storage.read(runId)!.run;
      expect(branchPath(saved, saved.activeCursor.branchId).at(-1)!.fen).toBe(preview.branches[1]!.leafFen);
      expect(projectRun(saved.events)).toEqual(saved);
    });
  }
});

function isScratchEntry(value: unknown, runId: string): boolean {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return entry.runId === runId && entry.writerId === writerId && typeof entry.sourceNodeId === "string"
    && Array.isArray(entry.moves) && Array.isArray(entry.labels) && typeof entry.createdAt === "number";
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

function nestedFixture(checkpointAt = "finish-h3"): DrillPackDefinition {
  return {
    ...document,
    id: "nested-authored-promotion-fixture",
    spine: [
      { id: "h3", moveUci: "h2h3", moveSan: "h3", children: [
        { id: "reply-h3", moveUci: "e8f8", moveSan: "Kf8", children: [
          { id: "advance-h3", moveUci: "h3h4", moveSan: "h4", children: [
            { id: "finish-h3", moveUci: "f8g8", moveSan: "Kg8", children: [] },
            { id: "other-king-reply", moveUci: "f8e8", moveSan: "Ke8", children: [] },
          ] },
          { id: "other-white-move", moveUci: "g1f1", moveSan: "Kf1", children: [] },
        ] },
      ] },
      document.spine![1]!,
    ],
    checkpoints: [{ ...document.checkpoints[0]!, trigger: { atSpineNode: checkpointAt } }],
  };
}

describe("D3727 nested authored simulation", () => {
  for (const charged of [false, true]) {
    it(`walks both first-child forks and promotes the exact consequence (Campaign=${charged})`, async () => {
      const { storage, runId, call, campaigns, campaignRunId } = await setup(charged, nestedFixture());
      const before = storage.read(runId)!.run;
      const response = await call("simulate", { at });
      expect(response.status, await response.clone().text()).toBe(200);
      const preview = await response.json() as ReturnType<RunService["simulate"]>;
      expect(preview.branches[0]).toMatchObject({ label: "h3", plies: 4, subvariationsSkipped: 2, leafFen: "6k1/8/8/8/7P/8/8/6K1 w - - 1 3" });
      expect(preview.branches[0]).not.toHaveProperty("truncatedAt");
      expect(preview.branches[1]).toMatchObject({ label: "h4", plies: 2 });
      expect(preview.comparison.rows).toHaveLength(4);
      const column = preview.comparison.columns[0]!;
      expect(consequences(preview.comparison, column.branchId)).toEqual({ objectiveState: "achieved", terminal: true, checkpointsReached: ["finish"] });
      expect(storage.read(runId)!.run).toEqual(before);
      if (charged) expect(campaigns!.read(principal, campaignRunId!).charges).toMatchObject({ spent: 0, balance: 1 });

      const entered = await call("simulate-enter", {
        simulationId: preview.simulationId, branchIndex: 0, at,
        ...(charged ? { campaignCommand: { commandId: "cmd-enter-nested", expectedCampaignRevision: 2, expectedPlayRevision: before.events.at(-1)!.seq } } : {}),
      });
      expect(entered.status, await entered.clone().text()).toBe(200);
      const saved = storage.read(runId)!.run;
      expect(projectRun(saved.events)).toEqual(saved);
      const promoted = saved.branches.filter(branch => branch.origin === "simulated");
      expect(promoted).toHaveLength(1);
      const path = branchPath(saved, promoted[0]!.id);
      expect(path.slice(1).map(node => [node.moveUci, node.actor])).toEqual([
        ["h2h3", "system"], ["e8f8", "system"], ["h3h4", "system"], ["f8g8", "system"],
      ]);
      expect(path.at(-1)!.fen).toBe(preview.branches[0]!.leafFen);
      expect(path.at(-1)!.objectiveState).toBe("achieved");
      expect(saved.events.filter(event => event.type === "checkpoint.reached").map(event => event.data.checkpointId)).toEqual(["finish"]);
      if (charged) expect(campaigns!.read(principal, campaignRunId!).charges).toMatchObject({ spent: 1, balance: 0 });
    });
  }

  it("reports the first unplayed nested child when the requested horizon ends", async () => {
    const { storage, runId, call } = await setup(false, nestedFixture());
    const before = storage.read(runId)!.run;
    const response = await call("simulate", { at, maxPlies: 2 });
    expect(response.status, await response.clone().text()).toBe(200);
    const preview = await response.json() as ReturnType<RunService["simulate"]>;
    expect(preview.branches[0]).toMatchObject({ plies: 2, truncatedAt: "advance-h3", subvariationsSkipped: 1 });
    expect(preview.comparison.consequences[preview.comparison.columns[0]!.branchId]).toMatchObject({ objectiveState: "active", terminal: false, checkpointsReached: [] });
    expect(storage.read(runId)!.run).toEqual(before);
  });

  it("refuses an authored continuation beyond an achieved objective at admission", async () => {
    await expect(setup(false, nestedFixture("reply-h3"))).rejects.toMatchObject({
      code: "PACK_INVALID",
      message: expect.stringContaining("still has 2 authored children"),
    });
  });
});

async function populatedPreview(feedbackPolicy: DrillPackDefinition["feedbackPolicy"]) {
  const context = await setup(false, {
    ...document, feedbackPolicy,
    checkpoints: feedbackPolicy === "segment_end"
      ? [{ id: "begin", label: "Fixture segment begins", trigger: { atSpineNode: "h3" }, actions: [] }, ...document.checkpoints]
      : document.checkpoints,
  });
  let run = context.storage.read(context.runId)!.run;
  const root = run.activeCursor.nodeId;
  // Controlled transport records, not engine measurements or authored chess claims.
  run = attachEvidence(run, root, ["engine:inherited-score"], {
    kind: "eval", source: "engine_validated", values: { centipawns: 333 },
  }, at).run;
  run = attachEvidence(run, root, ["engine:inherited-line"], {
    kind: "bestline", source: "engine_validated", values: { movesUci: ["h2h3", "e8f8"], depth: 12 },
  }, at).run;
  run = attachEvidence(run, root, ["tablebase:inherited-exact"], {
    kind: "tablebase", source: "tablebase_exact", values: { category: "draw", dtz: 0 },
  }, at).run;
  run = transitionObjective(run, "preserved", ["rules:fixture-boundary", "engine:inherited-score", "tablebase:inherited-exact"], at).run;
  run = fork(run, root, { label: "Existing attempt", at }).run;
  expect(projectRun(run.events)).toEqual(run);
  context.storage.save(run, { writerId, learnerId: principal.learnerId });
  return { ...context, root };
}

function assertComparisonDisclosure(comparison: BranchComparison, open: boolean) {
  for (const { branchId } of comparison.columns) {
    if (!open) {
      expect({
        machineFeedback: comparison.machineFeedback,
        evidence: comparison.evidence[branchId],
        lines: comparison.lines[branchId],
        deepestScore: comparison.consequences[branchId]!.deepestScore,
        references: comparison.objectiveTimelines[branchId]![0]!.evidenceRefs,
      }).toEqual({ machineFeedback: "withheld", evidence: [], lines: [], deepestScore: null, references: ["rules:fixture-boundary"] });
      continue;
    }
    expect(comparison.machineFeedback).toBe("available");
    expect(comparison.objectiveTimelines[branchId]![0]!.evidenceRefs).toEqual(["rules:fixture-boundary", "engine:inherited-score", "tablebase:inherited-exact"]);
    expect(comparison.evidence[branchId]).toEqual([expect.objectContaining({ plyOffset: 0, score: { kind: "cp", value: 333 } })]);
    expect(comparison.lines[branchId]).toEqual([expect.objectContaining({ plyOffset: 0, payload: expect.objectContaining({ values: { movesUci: ["h2h3", "e8f8"], depth: 12 } }) })]);
    expect(comparison.consequences[branchId]!.deepestScore).toEqual({ plyOffset: 0, score: { kind: "cp", value: 333 } });
  }
}

describe("D3728 authored comparison disclosure", () => {
  for (const feedbackPolicy of ["delayed_checkpoint", "segment_end", "immediate_guard"] as const) {
    it(`keeps populated scratch evidence under the stored ${feedbackPolicy} boundary`, async () => {
      const { storage, runId, call } = await populatedPreview(feedbackPolicy);
      const before = storage.read(runId)!.run;
      const storedBytes = JSON.stringify(before);
      const disclosed = feedbackDisclosed(before);
      expect(disclosed).toBe(feedbackPolicy === "immediate_guard");
      const ordinary = await call("compare", { branchIds: before.branches.map(branch => branch.id) });
      expect(ordinary.status, await ordinary.clone().text()).toBe(200);
      assertComparisonDisclosure((await ordinary.json() as { comparison: BranchComparison }).comparison, disclosed);
      const response = await call("simulate", { at });
      expect(response.status, await response.clone().text()).toBe(200);
      const preview = await response.json() as ReturnType<RunService["simulate"]>;
      expect(preview.comparison.rows).toHaveLength(2);
      expect(preview.comparison.consequences[preview.comparison.columns[0]!.branchId]).toMatchObject({ objectiveState: "achieved", terminal: true, checkpointsReached: feedbackPolicy === "segment_end" ? ["begin", "finish"] : ["finish"] });
      // Reaching the virtual finish cannot reveal the real run's inherited evidence.
      assertComparisonDisclosure(preview.comparison, disclosed);
      expect(JSON.stringify(storage.read(runId)!.run)).toBe(storedBytes);
    });
  }

  for (const feedbackPolicy of ["delayed_checkpoint", "segment_end"] as const) {
    it(`retains populated analysis after actually entering the ${feedbackPolicy} boundary`, async () => {
      const { storage, runId, call, root } = await populatedPreview(feedbackPolicy);
      const response = await call("simulate", { at });
      expect(response.status, await response.clone().text()).toBe(200);
      const { simulationId } = await response.json() as ReturnType<RunService["simulate"]>;
      const entered = await call("simulate-enter", { simulationId, branchIndex: 0, at });
      expect(entered.status, await entered.clone().text()).toBe(200);
      expect(feedbackDisclosed(storage.read(runId)!.run)).toBe(true);
      expect((await call("rewind", { nodeId: root, at })).status).toBe(200);
      const before = storage.read(runId)!.run;
      const shown = await call("simulate", { at });
      expect(shown.status, await shown.clone().text()).toBe(200);
      assertComparisonDisclosure((await shown.json() as ReturnType<RunService["simulate"]>).comparison, true);
      expect(storage.read(runId)!.run).toEqual(before);
    });
  }

  it("refuses the proposed attempt_end pack at admission instead of forging a reclosed preview", async () => {
    await expect(populatedPreview("attempt_end")).rejects.toMatchObject({ code: "PACK_INVALID" });
  });
});
