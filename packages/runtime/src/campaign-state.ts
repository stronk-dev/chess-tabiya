import type { ObjectiveState } from "./types.js";
import {
  assertCampaignUnlockAllowed,
  type CampaignActId,
  type CampaignDocument,
  type CampaignNode,
  type UnlockableModuleId,
} from "./campaign-contract.js";

export type CampaignNodeVerdict = Extract<ObjectiveState, "achieved" | "failed" | "transitioned"> | "open";

export interface CampaignNodeEnteredEvent {
  readonly seq: number;
  readonly kind: "node_entered";
  readonly payload: { readonly nodeId: string; readonly runId: string };
}

export interface CampaignNodeSealedEvent {
  readonly seq: number;
  readonly kind: "node_sealed";
  readonly payload: {
    readonly nodeId: string;
    readonly runId: string;
    readonly branchId: string;
    readonly verdict: CampaignNodeVerdict;
  };
}

export interface CampaignChargeEarnedEvent {
  readonly seq: number;
  readonly kind: "charge_earned";
  readonly payload: { readonly nodeId: string; readonly amount: number };
}

export interface CampaignChargeSpentEvent {
  readonly seq: number;
  readonly kind: "charge_spent";
  readonly payload: { readonly runId: string };
}

export interface CampaignModuleUnlockedEvent {
  readonly seq: number;
  readonly kind: "module_unlocked";
  readonly payload: { readonly nodeId: string; readonly moduleId: UnlockableModuleId };
}

export type CampaignEvent =
  | CampaignNodeEnteredEvent
  | CampaignNodeSealedEvent
  | CampaignChargeEarnedEvent
  | CampaignChargeSpentEvent
  | CampaignModuleUnlockedEvent;

export interface CampaignNodeSeal {
  readonly verdict: CampaignNodeVerdict;
  readonly runId: string;
  readonly branchId: string;
}

export interface CampaignCursor {
  readonly act: CampaignActId;
  readonly layer: 1 | 2 | 3;
}

export interface CampaignRunState {
  readonly cursor: CampaignCursor | null;
  readonly nodes: Readonly<Record<string, CampaignNodeSeal>>;
  readonly charges: {
    readonly earned: number;
    readonly spent: number;
    readonly balance: number;
  };
  readonly unlocked: readonly UnlockableModuleId[];
  readonly status: "active" | "completed" | "abandoned";
}

export type CampaignStateErrorCode =
  | "CAMPAIGN_EVENT_SEQUENCE_INVALID"
  | "CAMPAIGN_NODE_UNKNOWN"
  | "CAMPAIGN_NODE_OUT_OF_ORDER"
  | "CAMPAIGN_NODE_NOT_ACTIVE"
  | "CAMPAIGN_NODE_ALREADY_SEALED"
  | "CAMPAIGN_CHARGE_GRANT_INVALID"
  | "CAMPAIGN_CHARGE_ALREADY_EARNED"
  | "CAMPAIGN_REWIND_EXHAUSTED"
  | "CAMPAIGN_UNLOCK_INVALID"
  | "CAMPAIGN_UNLOCK_ALREADY_RECORDED"
  | "CAMPAIGN_LIFECYCLE_CONFLICT";

export class CampaignStateError extends Error {
  readonly code: CampaignStateErrorCode;

  constructor(code: CampaignStateErrorCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "CampaignStateError";
    this.code = code;
  }
}

interface LocatedNode {
  readonly node: CampaignNode;
  readonly act: CampaignActId;
  readonly actIndex: number;
  readonly layerIndex: number;
}

function campaignNodes(document: CampaignDocument): readonly LocatedNode[] {
  return document.acts.flatMap((act, actIndex) => act.layers.flatMap((layer, layerIndex) =>
    layer.choices.map((node) => ({ node, act: act.id, actIndex, layerIndex })),
  ));
}

function firstUnsealedLayer(document: CampaignDocument, seals: Readonly<Record<string, CampaignNodeSeal>>): CampaignCursor | null {
  for (const act of document.acts) {
    for (let layerIndex = 0; layerIndex < act.layers.length; layerIndex += 1) {
      const layer = act.layers[layerIndex]!;
      if (!layer.choices.some((node) => seals[node.id] !== undefined)) {
        return { act: act.id, layer: (layerIndex + 1) as 1 | 2 | 3 };
      }
    }
  }
  return null;
}

function sameLayer(location: LocatedNode, cursor: CampaignCursor | null): boolean {
  return cursor !== null && location.act === cursor.act && location.layerIndex + 1 === cursor.layer;
}

export function prestigeEligible(state: Pick<CampaignRunState, "nodes">): boolean {
  const seals = Object.values(state.nodes);
  return seals.length > 0 && seals.every((seal) => seal.verdict === "achieved");
}

export function campaignRunState(
  document: CampaignDocument,
  events: readonly CampaignEvent[],
  options: { readonly recordedStatus?: "active" | "abandoned" } = {},
): CampaignRunState {
  const locations = campaignNodes(document);
  const byNodeId = new Map(locations.map((location) => [location.node.id, location]));
  const seals: Record<string, CampaignNodeSeal> = {};
  const earnedByNode = new Set<string>();
  const unlockedByNode = new Set<string>();
  const unlocked = new Set<UnlockableModuleId>();
  for (const moduleId of document.startingModules) {
    assertCampaignUnlockAllowed(moduleId);
    unlocked.add(moduleId);
  }
  let active: { readonly nodeId: string; readonly runId: string } | undefined;
  let earned = 0;
  let spent = 0;

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]!;
    if (!Number.isSafeInteger(event.seq) || event.seq !== index + 1) {
      throw new CampaignStateError("CAMPAIGN_EVENT_SEQUENCE_INVALID", `expected seq ${index + 1}, received ${event.seq}`);
    }

    if (event.kind === "node_entered") {
      const location = byNodeId.get(event.payload.nodeId);
      if (location === undefined) {
        throw new CampaignStateError("CAMPAIGN_NODE_UNKNOWN", `node ${event.payload.nodeId} is not in campaign ${document.id}`);
      }
      if (!sameLayer(location, firstUnsealedLayer(document, seals))) {
        throw new CampaignStateError("CAMPAIGN_NODE_OUT_OF_ORDER", `node ${event.payload.nodeId} is not in the first unsealed layer`);
      }
      active = { nodeId: event.payload.nodeId, runId: event.payload.runId };
      continue;
    }

    if (event.kind === "node_sealed") {
      const location = byNodeId.get(event.payload.nodeId);
      if (location === undefined) {
        throw new CampaignStateError("CAMPAIGN_NODE_UNKNOWN", `node ${event.payload.nodeId} is not in campaign ${document.id}`);
      }
      if (seals[event.payload.nodeId] !== undefined) {
        throw new CampaignStateError("CAMPAIGN_NODE_ALREADY_SEALED", `node ${event.payload.nodeId} already has a seal`);
      }
      if (!sameLayer(location, firstUnsealedLayer(document, seals))) {
        throw new CampaignStateError("CAMPAIGN_NODE_OUT_OF_ORDER", `node ${event.payload.nodeId} is not in the first unsealed layer`);
      }
      if (active?.nodeId !== event.payload.nodeId || active.runId !== event.payload.runId) {
        throw new CampaignStateError("CAMPAIGN_NODE_NOT_ACTIVE", `run ${event.payload.runId} is not the active encounter for node ${event.payload.nodeId}`);
      }
      seals[event.payload.nodeId] = Object.freeze({
        verdict: event.payload.verdict,
        runId: event.payload.runId,
        branchId: event.payload.branchId,
      });
      active = undefined;
      continue;
    }

    if (event.kind === "charge_earned") {
      const location = byNodeId.get(event.payload.nodeId);
      if (location === undefined) {
        throw new CampaignStateError("CAMPAIGN_NODE_UNKNOWN", `node ${event.payload.nodeId} is not in campaign ${document.id}`);
      }
      if (seals[event.payload.nodeId] === undefined) {
        throw new CampaignStateError("CAMPAIGN_CHARGE_GRANT_INVALID", `node ${event.payload.nodeId} has not been sealed`);
      }
      if (earnedByNode.has(event.payload.nodeId)) {
        throw new CampaignStateError("CAMPAIGN_CHARGE_ALREADY_EARNED", `node ${event.payload.nodeId} already granted charges`);
      }
      const expected = document.economy.actGrants[location.act];
      if (!Number.isSafeInteger(event.payload.amount) || event.payload.amount !== expected) {
        throw new CampaignStateError("CAMPAIGN_CHARGE_GRANT_INVALID", `node ${event.payload.nodeId} must grant ${expected} charges`);
      }
      earnedByNode.add(event.payload.nodeId);
      earned += event.payload.amount;
      continue;
    }

    if (event.kind === "charge_spent") {
      if (active?.runId !== event.payload.runId) {
        throw new CampaignStateError("CAMPAIGN_NODE_NOT_ACTIVE", `run ${event.payload.runId} is not the active campaign encounter`);
      }
      if (document.economy.startingCharges + earned - spent <= 0) {
        throw new CampaignStateError("CAMPAIGN_REWIND_EXHAUSTED", "campaign rewind balance is zero");
      }
      spent += 1;
      continue;
    }

    const location = byNodeId.get(event.payload.nodeId);
    if (location === undefined) {
      throw new CampaignStateError("CAMPAIGN_NODE_UNKNOWN", `node ${event.payload.nodeId} is not in campaign ${document.id}`);
    }
    if (seals[event.payload.nodeId] === undefined || location.node.reward?.moduleId !== event.payload.moduleId) {
      throw new CampaignStateError("CAMPAIGN_UNLOCK_INVALID", `node ${event.payload.nodeId} does not grant ${event.payload.moduleId}`);
    }
    if (unlockedByNode.has(event.payload.nodeId)) {
      throw new CampaignStateError("CAMPAIGN_UNLOCK_ALREADY_RECORDED", `node ${event.payload.nodeId} already recorded its unlock`);
    }
    assertCampaignUnlockAllowed(event.payload.moduleId);
    unlockedByNode.add(event.payload.nodeId);
    unlocked.add(event.payload.moduleId);
  }

  const cursor = firstUnsealedLayer(document, seals);
  const completed = cursor === null;
  if (completed && options.recordedStatus === "abandoned") {
    throw new CampaignStateError("CAMPAIGN_LIFECYCLE_CONFLICT", "a completed campaign cannot be recorded as abandoned");
  }
  const status = completed ? "completed" : (options.recordedStatus ?? "active");

  return Object.freeze({
    cursor: status === "active" ? cursor : null,
    nodes: Object.freeze(seals),
    charges: Object.freeze({
      earned,
      spent,
      balance: document.economy.startingCharges + earned - spent,
    }),
    unlocked: Object.freeze(Array.from(unlocked)),
    status,
  });
}
