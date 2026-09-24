import type { ObjectiveState } from "./types.js";
import {
  assertCampaignUnlockAllowed,
  campaignRewardRef,
  campaignRewardRefKey,
  locateCampaignNodes,
  type CampaignActId,
  type CampaignDocument,
  type CampaignRunReward,
  type LocatedCampaignNode,
  type UnlockableModuleId,
} from "./campaign-contract.js";
import { MODULE_IDS } from "./module-contract.js";

// rfc/campaign-core.md §4.2 — the campaign run roll-up is a PURE fold over the closed semantic event
// image (§6 "closed semantic event image"). Storage parses canonical rows into these values; the fold
// never reads a clock, a table or a caller-supplied balance.

export type CampaignNodeVerdict = Extract<ObjectiveState, "achieved" | "failed" | "transitioned"> | "open";
export const CAMPAIGN_NODE_VERDICTS = Object.freeze(["achieved", "failed", "transitioned", "open"] as const);

export type CampaignChargedOperation = "rewind" | "fork" | "group" | "simulate_enter";
export const CAMPAIGN_CHARGED_OPERATIONS = Object.freeze(["rewind", "fork", "group", "simulate_enter"] as const);

export interface CampaignParticipationWitness {
  readonly learnerMoveEventSeq: number;
  readonly consequenceTipNodeId: string;
  readonly completion: "objective_absorbing" | "authored_boundary";
}

export interface CampaignActIncome {
  readonly source: "act_seal";
  readonly act: CampaignActId;
  readonly amount: number;
}

export type CampaignBossOutcome = "win" | "loss" | "draw";
export type CampaignBossTerminalReason = "checkmate" | "stalemate" | "insufficient_material" | "fifty_move" | "threefold";
export type CampaignBossRatingDisposition =
  | { readonly kind: "open" }
  | { readonly kind: "sealed"; readonly ratedGameId: string }
  | { readonly kind: "voided"; readonly reason: string }
  | { readonly kind: "unrated" };

export interface CampaignEventPayloads {
  readonly campaign_created: {
    readonly campaignId: string;
    readonly campaignVersion: number;
    readonly documentDigest: string;
    readonly startingCharges: number;
  };
  readonly node_entered: {
    readonly nodeId: string;
    readonly playRunId: string;
    readonly inventoryEventSeq: number;
    readonly packDigest: string;
  };
  readonly node_committed: {
    readonly nodeId: string;
    readonly playRunId: string;
    readonly branchId: string;
    readonly verdict: CampaignNodeVerdict;
    readonly participation: CampaignParticipationWitness;
    readonly actIncome: CampaignActIncome;
    readonly reward: CampaignRunReward | null;
    readonly terminal: "continue" | "completed";
  };
  readonly boss_game_committed: {
    readonly nodeId: string;
    readonly playRunId: string;
    readonly terminal: {
      readonly outcome: CampaignBossOutcome;
      readonly reason: CampaignBossTerminalReason;
      readonly terminalNodeId: string;
      readonly terminalEventSeq: number;
    };
    readonly rating: CampaignBossRatingDisposition;
    readonly actIncome: CampaignActIncome;
    readonly reward: CampaignRunReward | null;
    readonly campaignTerminal: "continue" | "completed";
  };
  readonly loadout_changed: { readonly equippedModuleIds: readonly UnlockableModuleId[] };
  readonly charge_spent: {
    readonly playRunId: string;
    readonly mutationCommandId: string;
    readonly operation: CampaignChargedOperation;
    readonly amount: 1;
  };
  readonly campaign_abandoned: { readonly activeNodeId: string | null; readonly activePlayRunId: string | null };
}

export type CampaignEventKind = keyof CampaignEventPayloads;
export const CAMPAIGN_EVENT_KINDS = Object.freeze([
  "campaign_created", "node_entered", "node_committed", "boss_game_committed", "loadout_changed", "charge_spent", "campaign_abandoned",
] as const satisfies readonly CampaignEventKind[]);

export type CampaignEvent = {
  readonly [K in CampaignEventKind]: {
    readonly seq: number;
    readonly kind: K;
    readonly commandId: string;
    readonly expectedRevision: number | null;
    readonly at: string;
    readonly payload: CampaignEventPayloads[K];
  };
}[CampaignEventKind];

export type CampaignNodeSeal =
  | {
      readonly kind: "pack";
      readonly nodeId: string;
      readonly act: CampaignActId;
      readonly layer: 1 | 2 | 3;
      readonly verdict: CampaignNodeVerdict;
      readonly playRunId: string;
      readonly branchId: string;
      readonly seq: number;
    }
  | {
      readonly kind: "boss_game";
      readonly nodeId: string;
      readonly act: CampaignActId;
      readonly layer: 1 | 2 | 3;
      readonly outcome: CampaignBossOutcome;
      readonly reason: CampaignBossTerminalReason;
      readonly rating: CampaignBossRatingDisposition;
      readonly playRunId: string;
      readonly seq: number;
    };

export type ChargeLedgerEntry =
  | { readonly source: "starting"; readonly amount: number; readonly seq: number }
  | { readonly source: "act_seal"; readonly nodeId: string; readonly act: CampaignActId; readonly amount: number; readonly seq: number }
  | { readonly source: "reward_grant"; readonly nodeId: string; readonly rewardIdentity: string; readonly amount: number; readonly seq: number }
  | { readonly source: "mutation_spend"; readonly playRunId: string; readonly mutationCommandId: string; readonly operation: CampaignChargedOperation; readonly amount: 1; readonly seq: number };

export type CampaignCursor =
  | { readonly kind: "active"; readonly act: CampaignActId; readonly layer: 1 | 2 | 3 }
  | { readonly kind: "completed" }
  | { readonly kind: "abandoned" };

export interface CampaignActiveEncounter {
  readonly nodeId: string;
  readonly playRunId: string;
  readonly enteredSeq: number;
}

export interface CampaignRunState {
  readonly revision: number;
  readonly status: "active" | "completed" | "abandoned";
  readonly cursor: CampaignCursor;
  readonly activeEncounter: CampaignActiveEncounter | null;
  readonly seals: readonly CampaignNodeSeal[];
  readonly nodes: Readonly<Record<string, CampaignNodeSeal>>;
  readonly charges: {
    readonly entries: readonly ChargeLedgerEntry[];
    readonly startingIncome: number;
    readonly actIncome: number;
    readonly rewardIncome: number;
    readonly spent: number;
    readonly balance: number;
  };
  readonly inventory: {
    readonly modules: { readonly owned: readonly UnlockableModuleId[]; readonly equipped: readonly UnlockableModuleId[] };
    readonly theory: { readonly owned: readonly { readonly bundleId: string; readonly passageId: string }[] };
  };
  /** The unsealed attempt named by `campaign_abandoned`, if any (§6.3). */
  readonly abandonedEncounter: { readonly nodeId: string; readonly playRunId: string } | null;
  /** Every `node_entered` pair in order (history; a node may be entered once per CampaignRun). */
  readonly entered: readonly CampaignActiveEncounter[];
}

export type CampaignStateErrorCode =
  | "CAMPAIGN_EVENT_SEQUENCE_INVALID"
  | "CAMPAIGN_EVENT_REVISION_INVALID"
  | "CAMPAIGN_EVENT_AFTER_TERMINAL"
  | "CAMPAIGN_CREATED_INVALID"
  | "CAMPAIGN_NODE_UNKNOWN"
  | "CAMPAIGN_NODE_OUT_OF_ORDER"
  | "CAMPAIGN_NODE_NOT_ACTIVE"
  | "CAMPAIGN_NODE_ALREADY_SEALED"
  | "CAMPAIGN_ENCOUNTER_ACTIVE"
  | "CAMPAIGN_ENCOUNTER_KIND_MISMATCH"
  | "CAMPAIGN_INCOME_INVALID"
  | "CAMPAIGN_REWARD_INVALID"
  | "CAMPAIGN_TERMINAL_INVALID"
  | "CAMPAIGN_REWIND_EXHAUSTED"
  | "CAMPAIGN_LOADOUT_INVALID"
  | "CAMPAIGN_UNLOCK_OUTSIDE_CEILING";

export class CampaignStateError extends Error {
  readonly code: CampaignStateErrorCode;

  constructor(code: CampaignStateErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "CampaignStateError";
    this.code = code;
  }
}

const fail = (code: CampaignStateErrorCode, message: string): never => {
  throw new CampaignStateError(code, message);
};

function firstUnsealedLayer(document: CampaignDocument, seals: Readonly<Record<string, CampaignNodeSeal>>): { act: CampaignActId; layer: 1 | 2 | 3 } | null {
  for (const act of document.acts) {
    for (let layerIndex = 0; layerIndex < act.layers.length; layerIndex += 1) {
      if (!act.layers[layerIndex]!.choices.some((node) => seals[node.id] !== undefined)) {
        return { act: act.id, layer: (layerIndex + 1) as 1 | 2 | 3 };
      }
    }
  }
  return null;
}

function inLayer(location: LocatedCampaignNode, cursor: { act: CampaignActId; layer: number } | null): boolean {
  return cursor !== null && location.act === cursor.act && location.layer === cursor.layer;
}

function orderedModules(values: Iterable<UnlockableModuleId>): readonly UnlockableModuleId[] {
  const set = new Set(values);
  return Object.freeze(MODULE_IDS.filter((id): id is UnlockableModuleId => id !== "rules_floor" && set.has(id as UnlockableModuleId)));
}

function sameReward(left: CampaignRunReward | null, right: CampaignRunReward | undefined): boolean {
  if (left === null || right === undefined) return left === null && right === undefined;
  return JSON.stringify(canonicalReward(left)) === JSON.stringify(canonicalReward(right));
}

function canonicalReward(reward: CampaignRunReward): readonly unknown[] {
  if (reward.kind === "module_unlock") return [reward.kind, reward.moduleId];
  if (reward.kind === "theory_unlock") return [reward.kind, reward.bundleId, reward.passageId];
  return [reward.kind, reward.resourceId, reward.amount];
}

/** §3.6: exact, non-vacuous prestige over the completed denominator. */
export function campaignPrestigeEligible(state: Pick<CampaignRunState, "status" | "seals">, document: CampaignDocument): boolean {
  if (state.status !== "completed") return false;
  const selectedLayerCount = document.acts.reduce((sum, act) => sum + act.layers.length, 0);
  if (state.seals.length !== selectedLayerCount) return false;
  const byLayer = new Map<string, number>();
  for (const seal of state.seals) byLayer.set(`${seal.act}:${seal.layer}`, (byLayer.get(`${seal.act}:${seal.layer}`) ?? 0) + 1);
  if (byLayer.size !== selectedLayerCount || [...byLayer.values()].some((count) => count !== 1)) return false;
  return state.seals.every((seal) => seal.kind === "pack" ? seal.verdict === "achieved" : seal.outcome === "win");
}

/** Back-compat alias: prestige over a folded state. */
export const prestigeEligible = campaignPrestigeEligible;

/**
 * Folds `campaign_events` in `seq` order. `cut` (inclusive) folds only a prefix — §5.1's encounter
 * inventory cut. Every rule the service enforces at append time is re-checked here, so a rebuild
 * from the log can never accept a state the writer would have refused.
 */
export function campaignRunState(document: CampaignDocument, events: readonly CampaignEvent[], cut?: number): CampaignRunState {
  const locations = locateCampaignNodes(document);
  const byNodeId = new Map(locations.map((location) => [location.node.id, location]));
  const seals: Record<string, CampaignNodeSeal> = {};
  const sealOrder: CampaignNodeSeal[] = [];
  const entries: ChargeLedgerEntry[] = [];
  const owned = new Set<UnlockableModuleId>();
  let equipped = new Set<UnlockableModuleId>();
  const theory: { bundleId: string; passageId: string }[] = [];
  const entered: CampaignActiveEncounter[] = [];
  let active: CampaignActiveEncounter | null = null;
  let status: CampaignRunState["status"] = "active";
  let abandoned: CampaignRunState["abandonedEncounter"] = null;
  let revision = 0;
  const limit = cut ?? Number.POSITIVE_INFINITY;

  for (const moduleId of document.startingModules) {
    assertCampaignUnlockAllowed(moduleId);
    owned.add(moduleId);
    equipped.add(moduleId);
  }

  const balance = (): number => entries.reduce((sum, entry) => sum + (entry.source === "mutation_spend" ? -entry.amount : entry.amount), 0);
  const acquire = (nodeId: string, reward: CampaignRunReward | null, seq: number): void => {
    if (reward === null) return;
    if (reward.kind === "module_unlock") {
      try { assertCampaignUnlockAllowed(reward.moduleId); } catch { fail("CAMPAIGN_UNLOCK_OUTSIDE_CEILING", `module ${reward.moduleId} is outside the campaign context ceiling`); }
      owned.add(reward.moduleId);
      equipped.add(reward.moduleId);
    } else if (reward.kind === "theory_unlock") {
      if (!theory.some((item) => item.bundleId === reward.bundleId && item.passageId === reward.passageId)) theory.push({ bundleId: reward.bundleId, passageId: reward.passageId });
    } else {
      if (!Number.isSafeInteger(reward.amount) || reward.amount < 1) fail("CAMPAIGN_REWARD_INVALID", "resource grants must be positive integers");
      entries.push(Object.freeze({ source: "reward_grant", nodeId, rewardIdentity: campaignRewardRefKey(campaignRewardRef(reward)), amount: reward.amount, seq }));
    }
  };
  const seal = (seq: number, nodeId: string, playRunId: string, kind: "pack" | "boss_game", actIncome: CampaignActIncome, reward: CampaignRunReward | null, terminal: "continue" | "completed", build: (location: LocatedCampaignNode) => CampaignNodeSeal): void => {
    const location = byNodeId.get(nodeId) ?? fail("CAMPAIGN_NODE_UNKNOWN", `node ${nodeId} is not in campaign ${document.id}`);
    if (seals[nodeId] !== undefined) fail("CAMPAIGN_NODE_ALREADY_SEALED", `node ${nodeId} already has a seal`);
    if (active === null || active.nodeId !== nodeId || active.playRunId !== playRunId) fail("CAMPAIGN_NODE_NOT_ACTIVE", `run ${playRunId} is not the active encounter for node ${nodeId}`);
    if (location.node.encounter.kind !== kind) fail("CAMPAIGN_ENCOUNTER_KIND_MISMATCH", `node ${nodeId} is a ${location.node.encounter.kind} encounter`);
    if (actIncome.source !== "act_seal" || actIncome.act !== location.act || actIncome.amount !== document.economy.actGrants[location.act]) {
      fail("CAMPAIGN_INCOME_INVALID", `node ${nodeId} must carry act income ${document.economy.actGrants[location.act]} for ${location.act}`);
    }
    if (!sameReward(reward, location.node.reward)) fail("CAMPAIGN_REWARD_INVALID", `node ${nodeId} reward differs from the pinned document`);
    const next = build(location);
    seals[nodeId] = next;
    sealOrder.push(next);
    entries.push(Object.freeze({ source: "act_seal", nodeId, act: location.act, amount: actIncome.amount, seq }));
    acquire(nodeId, reward, seq);
    active = null;
    const cursor = firstUnsealedLayer(document, seals);
    const expected = cursor === null ? "completed" : "continue";
    if (terminal !== expected) fail("CAMPAIGN_TERMINAL_INVALID", `node ${nodeId} must carry terminal ${expected}`);
    if (cursor === null) status = "completed";
  };

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]!;
    if (event.seq > limit) break;
    if (!Number.isSafeInteger(event.seq) || event.seq !== index + 1) fail("CAMPAIGN_EVENT_SEQUENCE_INVALID", `expected seq ${index + 1}, received ${event.seq}`);
    if (event.kind === "campaign_created") {
      if (event.expectedRevision !== null) fail("CAMPAIGN_EVENT_REVISION_INVALID", "campaign_created carries no expected revision");
    } else if (event.expectedRevision !== event.seq - 1) {
      fail("CAMPAIGN_EVENT_REVISION_INVALID", `${event.kind} at seq ${event.seq} must carry expected revision ${event.seq - 1}`);
    }
    if (index === 0 && event.kind !== "campaign_created") fail("CAMPAIGN_CREATED_INVALID", "the first event must be campaign_created");
    if (index > 0 && event.kind === "campaign_created") fail("CAMPAIGN_CREATED_INVALID", "campaign_created may only open the log");
    if (status !== "active") fail("CAMPAIGN_EVENT_AFTER_TERMINAL", `${event.kind} follows a ${status} campaign`);
    revision = event.seq;

    switch (event.kind) {
      case "campaign_created": {
        const payload = event.payload;
        if (payload.campaignId !== document.id || payload.campaignVersion !== document.version || payload.startingCharges !== document.economy.startingCharges) {
          fail("CAMPAIGN_CREATED_INVALID", "campaign_created disagrees with the pinned document");
        }
        entries.push(Object.freeze({ source: "starting", amount: payload.startingCharges, seq: event.seq }));
        break;
      }
      case "node_entered": {
        const payload = event.payload;
        const location = byNodeId.get(payload.nodeId) ?? fail("CAMPAIGN_NODE_UNKNOWN", `node ${payload.nodeId} is not in campaign ${document.id}`);
        if (active !== null) fail("CAMPAIGN_ENCOUNTER_ACTIVE", `node ${active.nodeId} is still the active encounter`);
        if (seals[payload.nodeId] !== undefined) fail("CAMPAIGN_NODE_ALREADY_SEALED", `node ${payload.nodeId} is already sealed`);
        if (!inLayer(location, firstUnsealedLayer(document, seals))) fail("CAMPAIGN_NODE_OUT_OF_ORDER", `node ${payload.nodeId} is not in the first unsealed layer`);
        if (payload.inventoryEventSeq !== event.seq) fail("CAMPAIGN_EVENT_SEQUENCE_INVALID", "node_entered names its own seq as the inventory cut");
        active = Object.freeze({ nodeId: payload.nodeId, playRunId: payload.playRunId, enteredSeq: event.seq });
        entered.push(active);
        break;
      }
      case "node_committed": {
        const payload = event.payload;
        seal(event.seq, payload.nodeId, payload.playRunId, "pack", payload.actIncome, payload.reward, payload.terminal, (location) => Object.freeze({
          kind: "pack", nodeId: payload.nodeId, act: location.act, layer: location.layer, verdict: payload.verdict, playRunId: payload.playRunId, branchId: payload.branchId, seq: event.seq,
        }));
        break;
      }
      case "boss_game_committed": {
        const payload = event.payload;
        seal(event.seq, payload.nodeId, payload.playRunId, "boss_game", payload.actIncome, payload.reward, payload.campaignTerminal, (location) => Object.freeze({
          kind: "boss_game", nodeId: payload.nodeId, act: location.act, layer: location.layer, outcome: payload.terminal.outcome, reason: payload.terminal.reason, rating: payload.rating, playRunId: payload.playRunId, seq: event.seq,
        }));
        break;
      }
      case "loadout_changed": {
        const next = event.payload.equippedModuleIds;
        if (new Set(next).size !== next.length || next.some((id) => !owned.has(id))) fail("CAMPAIGN_LOADOUT_INVALID", "the loadout must be a set of owned modules");
        equipped = new Set(next);
        break;
      }
      case "charge_spent": {
        const payload = event.payload;
        if (active === null || active.playRunId !== payload.playRunId) fail("CAMPAIGN_NODE_NOT_ACTIVE", `run ${payload.playRunId} is not the active campaign encounter`);
        if (payload.amount !== 1) fail("CAMPAIGN_INCOME_INVALID", "each charged gesture spends exactly one charge");
        if (balance() <= 0) fail("CAMPAIGN_REWIND_EXHAUSTED", "campaign rewind balance is zero");
        entries.push(Object.freeze({ source: "mutation_spend", playRunId: payload.playRunId, mutationCommandId: payload.mutationCommandId, operation: payload.operation, amount: 1, seq: event.seq }));
        break;
      }
      case "campaign_abandoned": {
        const payload = event.payload;
        const currentActive = active as CampaignActiveEncounter | null;
        if ((currentActive?.nodeId ?? null) !== payload.activeNodeId || (currentActive?.playRunId ?? null) !== payload.activePlayRunId) {
          fail("CAMPAIGN_NODE_NOT_ACTIVE", "campaign_abandoned must name the exact active encounter");
        }
        abandoned = currentActive === null ? null : Object.freeze({ nodeId: currentActive.nodeId, playRunId: currentActive.playRunId });
        active = null;
        status = "abandoned";
        break;
      }
    }
  }

  const cursorLayer = firstUnsealedLayer(document, seals);
  // `seal` assigns `status` from a closure, which control-flow narrowing cannot see.
  const finalStatus = status as CampaignRunState["status"];
  const cursor: CampaignCursor = finalStatus === "completed"
    ? Object.freeze({ kind: "completed" })
    : finalStatus === "abandoned"
      ? Object.freeze({ kind: "abandoned" })
      : Object.freeze({ kind: "active", act: cursorLayer!.act, layer: cursorLayer!.layer });
  const startingIncome = entries.filter((entry) => entry.source === "starting").reduce((sum, entry) => sum + entry.amount, 0);
  const actIncome = entries.filter((entry) => entry.source === "act_seal").reduce((sum, entry) => sum + entry.amount, 0);
  const rewardIncome = entries.filter((entry) => entry.source === "reward_grant").reduce((sum, entry) => sum + entry.amount, 0);
  const spent = entries.filter((entry) => entry.source === "mutation_spend").length;
  return Object.freeze({
    revision,
    status: finalStatus,
    cursor,
    activeEncounter: active,
    seals: Object.freeze([...sealOrder]),
    nodes: Object.freeze({ ...seals }),
    charges: Object.freeze({
      entries: Object.freeze([...entries]),
      startingIncome,
      actIncome,
      rewardIncome,
      spent,
      balance: startingIncome + actIncome + rewardIncome - spent,
    }),
    inventory: Object.freeze({
      modules: Object.freeze({ owned: orderedModules(owned), equipped: orderedModules(equipped) }),
      theory: Object.freeze({ owned: Object.freeze(theory.map((item) => Object.freeze({ ...item }))) }),
    }),
    abandonedEncounter: abandoned,
    entered: Object.freeze([...entered]),
  });
}
