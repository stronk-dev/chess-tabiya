import { describe, expect, it } from "vitest";

import type { CampaignDocument, CampaignNode, UnlockableModuleId } from "./campaign-contract.js";
import {
  CampaignStateError,
  campaignRunState,
  prestigeEligible,
  type CampaignEvent,
  type CampaignNodeVerdict,
} from "./campaign-state.js";

function node(id: string, reward?: UnlockableModuleId): CampaignNode {
  return {
    id,
    encounter: { kind: "pack", packId: `${id}-pack` },
    ...(reward === undefined ? {} : { reward: { kind: "module_unlock", moduleId: reward } }),
  };
}

const document: CampaignDocument = {
  id: "state-fold",
  title: "State fold",
  version: 1,
  economy: { startingCharges: 3, actGrants: { act1: 3, act2: 2, act3: 1 }, validation: "candidate" },
  startingModules: ["sight_on_request"],
  acts: [
    { id: "act1", layers: [
      { choices: [node("a1-l1", "postcommit_nudge"), node("a1-l1-alt")] },
      { choices: [node("a1-l2")] },
      { choices: [node("a1-l3")] },
    ] },
    { id: "act2", layers: [
      { choices: [node("a2-l1", "structure_nudge")] },
      { choices: [node("a2-l2")] },
      { choices: [node("a2-l3")] },
    ] },
    { id: "act3", layers: [
      { choices: [node("a3-l1", "theory_breadcrumb")] },
      { choices: [node("a3-l2")] },
      { choices: [node("a3-l3")] },
    ] },
  ],
};

function sealEvents(
  seq: number,
  nodeId: string,
  verdict: CampaignNodeVerdict = "achieved",
  reward?: UnlockableModuleId,
): CampaignEvent[] {
  const runId = `${nodeId}-run`;
  const act = nodeId.slice(0, 2) as "a1" | "a2" | "a3";
  const amount = act === "a1" ? 3 : act === "a2" ? 2 : 1;
  return [
    { seq, kind: "node_entered", payload: { nodeId, runId } },
    { seq: seq + 1, kind: "node_sealed", payload: { nodeId, runId, branchId: `${runId}-branch`, verdict } },
    { seq: seq + 2, kind: "charge_earned", payload: { nodeId, amount } },
    ...(reward === undefined ? [] : [{
      seq: seq + 3,
      kind: "module_unlocked" as const,
      payload: { nodeId, moduleId: reward },
    }]),
  ];
}

function errorCode(run: () => unknown): string | undefined {
  try {
    run();
    return undefined;
  } catch (error) {
    return error instanceof CampaignStateError ? error.code : undefined;
  }
}

describe("campaign event state fold", () => {
  it("folds choice seals, charges, any-verdict unlocks, and the first open layer", () => {
    const events = sealEvents(1, "a1-l1", "failed", "postcommit_nudge");
    const state = campaignRunState(document, events);

    expect(state).toEqual({
      cursor: { act: "act1", layer: 2 },
      nodes: {
        "a1-l1": { verdict: "failed", runId: "a1-l1-run", branchId: "a1-l1-run-branch" },
      },
      charges: { earned: 3, spent: 0, balance: 6 },
      unlocked: ["sight_on_request", "postcommit_nudge"],
      status: "active",
    });
    expect(prestigeEligible(state)).toBe(false);
  });

  it("spends only inside the active encounter and refuses the first spend below zero", () => {
    const events: CampaignEvent[] = [
      { seq: 1, kind: "node_entered", payload: { nodeId: "a1-l1", runId: "run-1" } },
      { seq: 2, kind: "charge_spent", payload: { runId: "run-1" } },
      { seq: 3, kind: "charge_spent", payload: { runId: "run-1" } },
      { seq: 4, kind: "charge_spent", payload: { runId: "run-1" } },
    ];
    expect(campaignRunState(document, events).charges).toEqual({ earned: 0, spent: 3, balance: 0 });
    expect(errorCode(() => campaignRunState(document, [
      ...events,
      { seq: 5, kind: "charge_spent", payload: { runId: "run-1" } },
    ]))).toBe("CAMPAIGN_REWIND_EXHAUSTED");
    expect(errorCode(() => campaignRunState(document, [
      events[0]!,
      { seq: 2, kind: "charge_spent", payload: { runId: "different-run" } },
    ]))).toBe("CAMPAIGN_NODE_NOT_ACTIVE");
  });

  it("completes after one sealed choice in every layer and projects prestige from seals", () => {
    const path: readonly [string, UnlockableModuleId?][] = [
      ["a1-l1", "postcommit_nudge"], ["a1-l2"], ["a1-l3"],
      ["a2-l1", "structure_nudge"], ["a2-l2"], ["a2-l3"],
      ["a3-l1", "theory_breadcrumb"], ["a3-l2"], ["a3-l3"],
    ];
    const events: CampaignEvent[] = [];
    for (const [nodeId, reward] of path) {
      events.push(...sealEvents(events.length + 1, nodeId, "achieved", reward));
    }
    const rebuilt = campaignRunState(document, events);
    expect(rebuilt.status).toBe("completed");
    expect(rebuilt.cursor).toBeNull();
    expect(Object.keys(rebuilt.nodes)).toHaveLength(9);
    expect(prestigeEligible(rebuilt)).toBe(true);
    expect(campaignRunState(document, structuredClone(events))).toEqual(rebuilt);
    expect(errorCode(() => campaignRunState(document, events, { recordedStatus: "abandoned" })))
      .toBe("CAMPAIGN_LIFECYCLE_CONFLICT");
  });

  it("projects an explicit abandoned lifecycle without pretending events contain it", () => {
    expect(campaignRunState(document, [], { recordedStatus: "abandoned" })).toMatchObject({
      cursor: null,
      status: "abandoned",
    });
  });

  it.each([
    ["non-contiguous sequence", [
      { seq: 2, kind: "node_entered", payload: { nodeId: "a1-l1", runId: "run" } },
    ], "CAMPAIGN_EVENT_SEQUENCE_INVALID"],
    ["unknown node", [
      { seq: 1, kind: "node_entered", payload: { nodeId: "missing", runId: "run" } },
    ], "CAMPAIGN_NODE_UNKNOWN"],
    ["later layer first", [
      { seq: 1, kind: "node_entered", payload: { nodeId: "a1-l2", runId: "run" } },
    ], "CAMPAIGN_NODE_OUT_OF_ORDER"],
    ["seal without entry", [
      { seq: 1, kind: "node_sealed", payload: { nodeId: "a1-l1", runId: "run", branchId: "branch", verdict: "achieved" } },
    ], "CAMPAIGN_NODE_NOT_ACTIVE"],
    ["grant before seal", [
      { seq: 1, kind: "charge_earned", payload: { nodeId: "a1-l1", amount: 3 } },
    ], "CAMPAIGN_CHARGE_GRANT_INVALID"],
    ["unlock before seal", [
      { seq: 1, kind: "module_unlocked", payload: { nodeId: "a1-l1", moduleId: "postcommit_nudge" } },
    ], "CAMPAIGN_UNLOCK_INVALID"],
  ] as const)("refuses %s", (_name, events, expected) => {
    expect(errorCode(() => campaignRunState(document, events as readonly CampaignEvent[]))).toBe(expected);
  });

  it("refuses duplicate seals, duplicate grants, and dishonest unlock payloads", () => {
    const sealed = sealEvents(1, "a1-l1", "achieved", "postcommit_nudge");
    expect(errorCode(() => campaignRunState(document, [
      ...sealed,
      { seq: 5, kind: "node_sealed", payload: { nodeId: "a1-l1", runId: "a1-l1-run", branchId: "branch", verdict: "failed" } },
    ]))).toBe("CAMPAIGN_NODE_ALREADY_SEALED");
    expect(errorCode(() => campaignRunState(document, [
      ...sealed,
      { seq: 5, kind: "charge_earned", payload: { nodeId: "a1-l1", amount: 3 } },
    ]))).toBe("CAMPAIGN_CHARGE_ALREADY_EARNED");
    expect(errorCode(() => campaignRunState(document, [
      ...sealEvents(1, "a1-l1", "achieved"),
      { seq: 4, kind: "module_unlocked", payload: { nodeId: "a1-l1", moduleId: "guided_hint" } },
    ]))).toBe("CAMPAIGN_UNLOCK_INVALID");
  });
});
