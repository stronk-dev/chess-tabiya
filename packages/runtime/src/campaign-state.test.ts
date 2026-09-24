import { describe, expect, it } from "vitest";

import type { CampaignDocument, CampaignNode, CampaignRunReward } from "./campaign-contract.js";
import {
  CampaignStateError,
  campaignPrestigeEligible,
  campaignRunState,
  type CampaignEvent,
  type CampaignNodeVerdict,
} from "./campaign-state.js";

// rfc/campaign-core.md §4.2 criteria 2, 9, 19, 20: the pure fold over the closed event image.

function node(id: string, reward?: CampaignRunReward, extra: Partial<CampaignNode> = {}): CampaignNode {
  return { id, encounter: { kind: "pack", packId: `${id}-pack` }, ...(reward === undefined ? {} : { reward }), ...extra };
}
const moduleReward = (moduleId: "postcommit_nudge" | "structure_nudge" | "guided_hint"): CampaignRunReward => ({ kind: "module_unlock", moduleId });

const document: CampaignDocument = {
  id: "state-fold",
  title: "State fold",
  version: 1,
  publication: { channel: "community" },
  economy: { startingCharges: 2, actGrants: { act1: 2, act2: 1, act3: 1 }, validation: "candidate" },
  startingModules: ["sight_on_request"],
  durableRewards: [
    { when: "completed", reward: { kind: "completion_mark", campaignId: "state-fold", campaignVersion: 1 } },
    { when: "prestige", reward: { kind: "prestige_mark", campaignId: "state-fold", campaignVersion: 1 } },
  ],
  acts: [
    { id: "act1", layers: [
      { choices: [node("a1-l1", moduleReward("postcommit_nudge")), node("a1-l1-alt")] },
      { choices: [node("a1-l2", { kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: 2 })] },
      { choices: [node("a1-l3", undefined, { boss: true, suppress: ["guided_hint"] })] },
    ] },
    { id: "act2", layers: [
      { choices: [node("a2-l1", moduleReward("structure_nudge"))] },
      { choices: [node("a2-l2", { kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: 3 })] },
      { choices: [node("a2-l3", undefined, { boss: true })] },
    ] },
    { id: "act3", layers: [
      { choices: [node("a3-l1", moduleReward("guided_hint"))] },
      { choices: [node("a3-l2")] },
      { choices: [node("a3-l3", undefined, { boss: true })] },
    ] },
  ],
};

const AT = "2026-09-24T12:00:00.000Z";
const ACT_OF: Record<string, "act1" | "act2" | "act3"> = { a1: "act1", a2: "act2", a3: "act3" };

class Log {
  readonly events: CampaignEvent[] = [{ seq: 1, kind: "campaign_created", commandId: "create", expectedRevision: null, at: AT, payload: { campaignId: "state-fold", campaignVersion: 1, documentDigest: "sha256:doc", startingCharges: 2 } }];
  get next(): number { return this.events.length + 1; }
  enter(nodeId: string): this {
    const seq = this.next;
    this.events.push({ seq, kind: "node_entered", commandId: `enter-${nodeId}`, expectedRevision: seq - 1, at: AT, payload: { nodeId, playRunId: `${nodeId}-run`, inventoryEventSeq: seq, packDigest: "sha256:pack" } });
    return this;
  }
  spend(nodeId: string, id: string): this {
    const seq = this.next;
    this.events.push({ seq, kind: "charge_spent", commandId: id, expectedRevision: seq - 1, at: AT, payload: { playRunId: `${nodeId}-run`, mutationCommandId: id, operation: "rewind", amount: 1 } });
    return this;
  }
  commit(nodeId: string, verdict: CampaignNodeVerdict = "achieved", terminal: "continue" | "completed" = "continue"): this {
    const seq = this.next;
    const location = document.acts.flatMap((act) => act.layers.flatMap((layer) => layer.choices)).find((candidate) => candidate.id === nodeId)!;
    const act = ACT_OF[nodeId.slice(0, 2)]!;
    this.events.push({ seq, kind: "node_committed", commandId: `commit-${nodeId}`, expectedRevision: seq - 1, at: AT, payload: {
      nodeId, playRunId: `${nodeId}-run`, branchId: `${nodeId}-branch`, verdict,
      participation: { learnerMoveEventSeq: 3, consequenceTipNodeId: "tip", completion: "objective_absorbing" },
      actIncome: { source: "act_seal", act, amount: document.economy.actGrants[act] },
      reward: location.reward ?? null,
      terminal,
    } });
    return this;
  }
  play(nodeId: string, verdict: CampaignNodeVerdict = "achieved", terminal: "continue" | "completed" = "continue"): this {
    return this.enter(nodeId).commit(nodeId, verdict, terminal);
  }
}

function code(action: () => unknown): string | undefined {
  try { action(); } catch (error) { return error instanceof CampaignStateError ? error.code : String(error); }
  return undefined;
}

function perfectRun(verdictAt?: { nodeId: string; verdict: CampaignNodeVerdict }): Log {
  const log = new Log();
  const path = ["a1-l1", "a1-l2", "a1-l3", "a2-l1", "a2-l2", "a2-l3", "a3-l1", "a3-l2", "a3-l3"];
  for (const [index, nodeId] of path.entries()) log.play(nodeId, verdictAt?.nodeId === nodeId ? verdictAt.verdict : "achieved", index === path.length - 1 ? "completed" : "continue");
  return log;
}

describe("campaign run fold (rfc/campaign-core.md §4.2)", () => {
  it("derives starting, act and source-identified reward income, then spends to zero", () => {
    const log = new Log().play("a1-l1").play("a1-l2");
    let state = campaignRunState(document, log.events);
    // start 2 + act1 2 + act1 2 + resource grant 2
    expect(state.charges).toMatchObject({ startingIncome: 2, actIncome: 4, rewardIncome: 2, spent: 0, balance: 8 });
    expect(state.charges.entries.filter((entry) => entry.source === "reward_grant")).toEqual([{ source: "reward_grant", nodeId: "a1-l2", rewardIdentity: "resource:campaign_rewind_charge", amount: 2, seq: 5 }]);
    log.enter("a1-l3");
    for (let index = 0; index < 8; index += 1) log.spend("a1-l3", `spend-${index}`);
    state = campaignRunState(document, log.events);
    expect(state.charges.balance).toBe(0);
    log.spend("a1-l3", "spend-exhausted");
    expect(code(() => campaignRunState(document, log.events))).toBe("CAMPAIGN_REWIND_EXHAUSTED");
  });

  it("counts two same-resource grants from different nodes once each", () => {
    const log = new Log().play("a1-l1").play("a1-l2").play("a1-l3").play("a2-l1").play("a2-l2");
    const grants = campaignRunState(document, log.events).charges.entries.filter((entry) => entry.source === "reward_grant");
    expect(grants.map((entry) => [entry.nodeId, entry.amount])).toEqual([["a1-l2", 2], ["a2-l2", 3]]);
  });

  it("grants the node reward whatever the verdict (D1040: playing unlocks, winning gates prestige only)", () => {
    const state = campaignRunState(document, new Log().play("a1-l1", "failed").events);
    expect(state.inventory.modules.owned).toEqual(["sight_on_request", "postcommit_nudge"]);
    expect(state.inventory.modules.equipped).toEqual(["sight_on_request", "postcommit_nudge"]);
  });

  it("is deterministic: a rebuild from the log equals the incremental fold of every prefix", () => {
    const log = perfectRun();
    const full = campaignRunState(document, log.events);
    expect(JSON.stringify(campaignRunState(document, [...log.events]))).toBe(JSON.stringify(full));
    const cut = campaignRunState(document, log.events, 4);
    expect(cut.revision).toBe(4);
    expect(JSON.stringify(cut)).toBe(JSON.stringify(campaignRunState(document, log.events.slice(0, 4))));
  });

  it("refuses sequence gaps, wrong revisions, out-of-order and repeated nodes", () => {
    const gap = new Log().play("a1-l1").events.map((event, index) => index === 1 ? { ...event, seq: 5 } : event) as CampaignEvent[];
    expect(code(() => campaignRunState(document, gap))).toBe("CAMPAIGN_EVENT_SEQUENCE_INVALID");
    const revision = new Log().enter("a1-l1").events.map((event, index) => index === 1 ? { ...event, expectedRevision: 0 } : event) as CampaignEvent[];
    expect(code(() => campaignRunState(document, revision))).toBe("CAMPAIGN_EVENT_REVISION_INVALID");
    expect(code(() => campaignRunState(document, new Log().enter("a1-l2").events))).toBe("CAMPAIGN_NODE_OUT_OF_ORDER");
    expect(code(() => campaignRunState(document, new Log().play("a1-l1").enter("a1-l1-alt").events))).toBe("CAMPAIGN_NODE_OUT_OF_ORDER");
    expect(code(() => campaignRunState(document, new Log().enter("a1-l1").enter("a1-l1-alt").events))).toBe("CAMPAIGN_ENCOUNTER_ACTIVE");
  });

  it("refuses a seal whose income, reward or terminal marker disagrees with the pinned document", () => {
    const wrongIncome = new Log().enter("a1-l1").commit("a1-l1");
    (wrongIncome.events[2]!.payload as { actIncome: { amount: number } }).actIncome = { ...(wrongIncome.events[2]!.payload as { actIncome: { amount: number } }).actIncome, amount: 9 };
    expect(code(() => campaignRunState(document, wrongIncome.events))).toBe("CAMPAIGN_INCOME_INVALID");
    const wrongReward = new Log().enter("a1-l1").commit("a1-l1");
    (wrongReward.events[2]!.payload as { reward: unknown }).reward = null;
    expect(code(() => campaignRunState(document, wrongReward.events))).toBe("CAMPAIGN_REWARD_INVALID");
    expect(code(() => campaignRunState(document, new Log().play("a1-l1", "achieved", "completed").events))).toBe("CAMPAIGN_TERMINAL_INVALID");
  });

  it("completes only with one seal per selected layer and the final event's own terminal marker", () => {
    const state = campaignRunState(document, perfectRun().events);
    expect(state.status).toBe("completed");
    expect(state.cursor).toEqual({ kind: "completed" });
    expect(state.seals).toHaveLength(9);
    const after = perfectRun();
    after.events.push({ seq: after.next, kind: "loadout_changed", commandId: "late", expectedRevision: after.next - 1, at: AT, payload: { equippedModuleIds: [] } });
    expect(code(() => campaignRunState(document, after.events))).toBe("CAMPAIGN_EVENT_AFTER_TERMINAL");
  });

  it("makes abandonment terminal and names the exact active encounter", () => {
    const log = new Log().play("a1-l1").enter("a1-l2");
    log.events.push({ seq: log.next, kind: "campaign_abandoned", commandId: "abandon", expectedRevision: log.next - 1, at: AT, payload: { activeNodeId: "a1-l2", activePlayRunId: "a1-l2-run" } });
    const state = campaignRunState(document, log.events);
    expect(state).toMatchObject({ status: "abandoned", cursor: { kind: "abandoned" }, activeEncounter: null, abandonedEncounter: { nodeId: "a1-l2", playRunId: "a1-l2-run" } });
    const wrong = new Log().play("a1-l1").enter("a1-l2");
    wrong.events.push({ seq: wrong.next, kind: "campaign_abandoned", commandId: "abandon", expectedRevision: wrong.next - 1, at: AT, payload: { activeNodeId: null, activePlayRunId: null } });
    expect(code(() => campaignRunState(document, wrong.events))).toBe("CAMPAIGN_NODE_NOT_ACTIVE");
  });

  it("replaces only the equipped module set on loadout change and refuses unowned members", () => {
    const log = new Log().play("a1-l1");
    log.events.push({ seq: log.next, kind: "loadout_changed", commandId: "loadout", expectedRevision: log.next - 1, at: AT, payload: { equippedModuleIds: ["postcommit_nudge"] } });
    const before = campaignRunState(document, log.events.slice(0, -1));
    const state = campaignRunState(document, log.events);
    expect(state.inventory.modules.owned).toEqual(before.inventory.modules.owned);
    expect(state.inventory.modules.equipped).toEqual(["postcommit_nudge"]);
    expect(JSON.stringify(state.charges)).toBe(JSON.stringify(before.charges));
    const bad = new Log().play("a1-l1");
    bad.events.push({ seq: bad.next, kind: "loadout_changed", commandId: "loadout", expectedRevision: bad.next - 1, at: AT, payload: { equippedModuleIds: ["full_inspector"] } });
    expect(code(() => campaignRunState(document, bad.events))).toBe("CAMPAIGN_LOADOUT_INVALID");
  });
});

describe("prestige (§3.6, criterion 19)", () => {
  it("is false for zero seals and a perfect prefix, true for a completed perfect path, false for a mixed path", () => {
    expect(campaignPrestigeEligible(campaignRunState(document, new Log().events), document)).toBe(false);
    expect(campaignPrestigeEligible(campaignRunState(document, new Log().play("a1-l1").play("a1-l2").events), document)).toBe(false);
    expect(campaignPrestigeEligible(campaignRunState(document, perfectRun().events), document)).toBe(true);
    expect(campaignPrestigeEligible(campaignRunState(document, perfectRun({ nodeId: "a2-l2", verdict: "failed" }).events), document)).toBe(false);
    expect(campaignPrestigeEligible(campaignRunState(document, perfectRun({ nodeId: "a3-l1", verdict: "open" }).events), document)).toBe(false);
  });
});

describe("charge counts reach no score (§8.3, criterion 13 — labelled regression guard)", () => {
  it("keeps charge quantities out of every seal payload", () => {
    const state = campaignRunState(document, perfectRun().events);
    for (const seal of state.seals) expect(Object.keys(seal).some((key) => /charge|balance|spent/iu.test(key))).toBe(false);
    expect(Object.keys(state).filter((key) => /charge|balance|spent/iu.test(key))).toEqual(["charges"]);
  });
});
