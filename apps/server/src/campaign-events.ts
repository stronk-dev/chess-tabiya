import {
  CAMPAIGN_CHARGED_OPERATIONS,
  CAMPAIGN_EVENT_KINDS,
  CAMPAIGN_NODE_VERDICTS,
  MODULE_IDS,
  type CampaignEvent,
  type CampaignEventKind,
  type CampaignEventPayloads,
  type CampaignRunReward,
} from "@chess-tabiya/runtime";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { canonicalSha256, type Sha256 } from "./bot-profile-digest.js";

// rfc/campaign-core.md §6 "Closed semantic event image" ([[D2623]], [[D2739]], [[D2989]]). Storage
// text is admitted only as RFC-8785 canonical bytes; every event kind has an exact payload key set
// and an exact result kind; nested members parse through closed schemas; the result digest covers
// the complete immutable envelope (campaign run, seq, kind, command, expected revision, operands
// digest, payload, result kind/revision/response, instant). The admitted value is recursively frozen.

export const CAMPAIGN_RESULT_KINDS: Readonly<Record<CampaignEventKind, string>> = Object.freeze({
  campaign_created: "campaign_created",
  node_entered: "encounter_started",
  node_committed: "node_committed",
  boss_game_committed: "boss_game_committed",
  loadout_changed: "loadout_changed",
  charge_spent: "mutation_committed",
  campaign_abandoned: "campaign_abandoned",
});

const PAYLOAD_KEYS: Readonly<Record<CampaignEventKind, readonly string[]>> = Object.freeze({
  campaign_created: ["campaignId", "campaignVersion", "documentDigest", "startingCharges"],
  node_entered: ["nodeId", "playRunId", "inventoryEventSeq", "packDigest"],
  node_committed: ["nodeId", "playRunId", "branchId", "verdict", "participation", "actIncome", "reward", "terminal"],
  boss_game_committed: ["nodeId", "playRunId", "terminal", "rating", "actIncome", "reward", "campaignTerminal"],
  loadout_changed: ["equippedModuleIds"],
  charge_spent: ["playRunId", "mutationCommandId", "operation", "amount"],
  campaign_abandoned: ["activeNodeId", "activePlayRunId"],
});

export class CampaignEventCorrupt extends TypeError {
  constructor(message: string) {
    super(`CAMPAIGN_EVENT_CORRUPT: ${message}`);
    this.name = "CampaignEventCorrupt";
  }
}

const corrupt = (message: string): never => { throw new CampaignEventCorrupt(message); };
type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };
const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
function exact(value: unknown, keys: readonly string[], at: string): Record<string, unknown> {
  if (!plain(value)) return corrupt(`${at} is not an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) corrupt(`${at} has keys ${actual.join(",")}; expected ${expected.join(",")}`);
  return value;
}
const string = (value: unknown, at: string): string => typeof value === "string" && value.length > 0 ? value : corrupt(`${at} is not a non-empty string`);
const nullableString = (value: unknown, at: string): string | null => value === null ? null : string(value, at);
const integer = (value: unknown, at: string, minimum = 0): number => Number.isSafeInteger(value) && (value as number) >= minimum ? value as number : corrupt(`${at} is not an integer >= ${minimum}`);
const oneOf = <T extends string>(value: unknown, domain: readonly T[], at: string): T => typeof value === "string" && (domain as readonly string[]).includes(value) ? value as T : corrupt(`${at} is outside its closed domain`);
const digest = (value: unknown, at: string): string => typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value) ? value : corrupt(`${at} is not a sha256 digest`);
const UNLOCKABLE = MODULE_IDS.filter((id) => id !== "rules_floor");

/** Canonical instants are millisecond ISO-8601 UTC strings. */
export function campaignInstant(value: unknown, at = "at"): string {
  if (typeof value !== "string") return corrupt(`${at} is not a string`);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) corrupt(`${at} is not a canonical instant`);
  return value;
}

export function parseCampaignRunReward(value: unknown, at: string): CampaignRunReward {
  if (!plain(value)) return corrupt(`${at} is not an object`);
  if (value.kind === "module_unlock") {
    const record = exact(value, ["kind", "moduleId"], at);
    return { kind: "module_unlock", moduleId: oneOf(record.moduleId, UNLOCKABLE, `${at}.moduleId`) as never };
  }
  if (value.kind === "theory_unlock") {
    const record = exact(value, ["kind", "bundleId", "passageId"], at);
    return { kind: "theory_unlock", bundleId: string(record.bundleId, `${at}.bundleId`), passageId: string(record.passageId, `${at}.passageId`) };
  }
  if (value.kind === "resource_grant") {
    const record = exact(value, ["kind", "resourceId", "amount"], at);
    if (record.resourceId !== "campaign_rewind_charge") corrupt(`${at}.resourceId is not the campaign rewind charge`);
    return { kind: "resource_grant", resourceId: "campaign_rewind_charge", amount: integer(record.amount, `${at}.amount`, 1) };
  }
  return corrupt(`${at}.kind is not a run-reward member`);
}

function actIncome(value: unknown, at: string): CampaignEventPayloads["node_committed"]["actIncome"] {
  const record = exact(value, ["source", "act", "amount"], at);
  if (record.source !== "act_seal") corrupt(`${at}.source is not act_seal`);
  return { source: "act_seal", act: oneOf(record.act, ["act1", "act2", "act3"] as const, `${at}.act`), amount: integer(record.amount, `${at}.amount`) };
}

function rating(value: unknown, at: string): CampaignEventPayloads["boss_game_committed"]["rating"] {
  if (!plain(value)) return corrupt(`${at} is not an object`);
  if (value.kind === "unrated") { exact(value, ["kind"], at); return { kind: "unrated" }; }
  if (value.kind === "open") { exact(value, ["kind"], at); return { kind: "open" }; }
  if (value.kind === "sealed") { const record = exact(value, ["kind", "ratedGameId"], at); return { kind: "sealed", ratedGameId: string(record.ratedGameId, `${at}.ratedGameId`) }; }
  if (value.kind === "voided") { const record = exact(value, ["kind", "reason"], at); return { kind: "voided", reason: string(record.reason, `${at}.reason`) }; }
  return corrupt(`${at}.kind is not a rating disposition`);
}

/** Closed per-kind payload parser; returns a fresh value that shares nothing with the input. */
export function parseCampaignPayload<K extends CampaignEventKind>(kind: K, value: unknown): CampaignEventPayloads[K] {
  const at = `${kind}.payload`;
  const record = exact(value, PAYLOAD_KEYS[kind], at);
  switch (kind) {
    case "campaign_created":
      return { campaignId: string(record.campaignId, `${at}.campaignId`), campaignVersion: integer(record.campaignVersion, `${at}.campaignVersion`, 1), documentDigest: digest(record.documentDigest, `${at}.documentDigest`), startingCharges: integer(record.startingCharges, `${at}.startingCharges`) } as unknown as CampaignEventPayloads[K];
    case "node_entered":
      return { nodeId: string(record.nodeId, `${at}.nodeId`), playRunId: string(record.playRunId, `${at}.playRunId`), inventoryEventSeq: integer(record.inventoryEventSeq, `${at}.inventoryEventSeq`, 1), packDigest: digest(record.packDigest, `${at}.packDigest`) } as unknown as CampaignEventPayloads[K];
    case "node_committed": {
      const participation = exact(record.participation, ["learnerMoveEventSeq", "consequenceTipNodeId", "completion"], `${at}.participation`);
      return {
        nodeId: string(record.nodeId, `${at}.nodeId`),
        playRunId: string(record.playRunId, `${at}.playRunId`),
        branchId: string(record.branchId, `${at}.branchId`),
        verdict: oneOf(record.verdict, CAMPAIGN_NODE_VERDICTS, `${at}.verdict`),
        participation: {
          learnerMoveEventSeq: integer(participation.learnerMoveEventSeq, `${at}.participation.learnerMoveEventSeq`, 1),
          consequenceTipNodeId: string(participation.consequenceTipNodeId, `${at}.participation.consequenceTipNodeId`),
          completion: oneOf(participation.completion, ["objective_absorbing", "authored_boundary"] as const, `${at}.participation.completion`),
        },
        actIncome: actIncome(record.actIncome, `${at}.actIncome`),
        reward: record.reward === null ? null : parseCampaignRunReward(record.reward, `${at}.reward`),
        terminal: oneOf(record.terminal, ["continue", "completed"] as const, `${at}.terminal`),
      } as unknown as CampaignEventPayloads[K];
    }
    case "boss_game_committed": {
      const terminal = exact(record.terminal, ["outcome", "reason", "terminalNodeId", "terminalEventSeq"], `${at}.terminal`);
      return {
        nodeId: string(record.nodeId, `${at}.nodeId`),
        playRunId: string(record.playRunId, `${at}.playRunId`),
        terminal: {
          outcome: oneOf(terminal.outcome, ["win", "loss", "draw"] as const, `${at}.terminal.outcome`),
          reason: oneOf(terminal.reason, ["checkmate", "stalemate", "insufficient_material", "fifty_move", "threefold"] as const, `${at}.terminal.reason`),
          terminalNodeId: string(terminal.terminalNodeId, `${at}.terminal.terminalNodeId`),
          terminalEventSeq: integer(terminal.terminalEventSeq, `${at}.terminal.terminalEventSeq`, 1),
        },
        rating: rating(record.rating, `${at}.rating`),
        actIncome: actIncome(record.actIncome, `${at}.actIncome`),
        reward: record.reward === null ? null : parseCampaignRunReward(record.reward, `${at}.reward`),
        campaignTerminal: oneOf(record.campaignTerminal, ["continue", "completed"] as const, `${at}.campaignTerminal`),
      } as unknown as CampaignEventPayloads[K];
    }
    case "loadout_changed": {
      if (!Array.isArray(record.equippedModuleIds)) return corrupt(`${at}.equippedModuleIds is not an array`);
      const ids = record.equippedModuleIds.map((id, index) => oneOf(id, UNLOCKABLE, `${at}.equippedModuleIds[${index}]`));
      if (new Set(ids).size !== ids.length) corrupt(`${at}.equippedModuleIds repeats a module`);
      return { equippedModuleIds: ids } as unknown as CampaignEventPayloads[K];
    }
    case "charge_spent":
      if (record.amount !== 1) corrupt(`${at}.amount must be 1`);
      return { playRunId: string(record.playRunId, `${at}.playRunId`), mutationCommandId: string(record.mutationCommandId, `${at}.mutationCommandId`), operation: oneOf(record.operation, CAMPAIGN_CHARGED_OPERATIONS, `${at}.operation`), amount: 1 } as unknown as CampaignEventPayloads[K];
    case "campaign_abandoned":
      return { activeNodeId: nullableString(record.activeNodeId, `${at}.activeNodeId`), activePlayRunId: nullableString(record.activePlayRunId, `${at}.activePlayRunId`) } as unknown as CampaignEventPayloads[K];
  }
  return corrupt(`unknown event kind ${String(kind)}`);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export interface CampaignEventRowImage {
  readonly campaignRunId: string;
  readonly seq: number;
  readonly kind: CampaignEventKind;
  readonly commandId: string;
  readonly expectedRevision: number | null;
  readonly operandsDigest: Sha256;
  readonly payload: string;
  readonly resultPayload: string;
  readonly at: string;
}

export interface CampaignStoredResult {
  readonly kind: string;
  readonly campaignRevision: number;
  readonly response: Json;
  readonly digest: Sha256;
}

function envelopeDigest(input: Omit<CampaignEventRowImage, "payload" | "resultPayload"> & { readonly payload: unknown; readonly resultKind: string; readonly response: unknown }): Sha256 {
  return canonicalSha256({
    campaignRunId: input.campaignRunId, seq: input.seq, kind: input.kind, commandId: input.commandId, expectedRevision: input.expectedRevision,
    operandsDigest: input.operandsDigest, payload: input.payload, result: { kind: input.resultKind, campaignRevision: input.seq, response: input.response }, at: input.at,
  });
}

/** Builds the canonical row image for one event (writer side). */
export function buildCampaignEventRow<K extends CampaignEventKind>(input: {
  readonly campaignRunId: string;
  readonly seq: number;
  readonly kind: K;
  readonly commandId: string;
  readonly expectedRevision: number | null;
  readonly operandsDigest: Sha256;
  readonly payload: CampaignEventPayloads[K];
  readonly response: unknown;
  readonly at: string;
}): CampaignEventRowImage {
  const payload = parseCampaignPayload(input.kind, JSON.parse(canonicalizeJson(input.payload)) as unknown);
  const response = JSON.parse(canonicalizeJson(input.response ?? null)) as Json;
  const resultKind = CAMPAIGN_RESULT_KINDS[input.kind];
  const digestValue = envelopeDigest({ ...input, payload, resultKind, response });
  return Object.freeze({
    campaignRunId: input.campaignRunId,
    seq: input.seq,
    kind: input.kind,
    commandId: input.commandId,
    expectedRevision: input.expectedRevision,
    operandsDigest: input.operandsDigest,
    payload: canonicalizeJson(payload),
    resultPayload: canonicalizeJson({ kind: resultKind, campaignRevision: input.seq, response, digest: digestValue }),
    at: campaignInstant(input.at),
  });
}

function canonicalText(text: string, at: string): unknown {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return corrupt(`${at} is not JSON`); }
  // JSON.parse keeps the last duplicate key, so a duplicate-key image never re-canonicalizes equal.
  if (canonicalizeJson(parsed) !== text) corrupt(`${at} is not RFC-8785 canonical bytes`);
  return parsed;
}

export interface AdmittedCampaignEvent {
  readonly event: CampaignEvent;
  readonly operandsDigest: Sha256;
  readonly result: CampaignStoredResult;
}

/** Admission: canonical bytes → closed payload/result → whole-envelope digest → frozen value. */
export function admitCampaignEventRow(row: Readonly<Record<string, unknown>>, campaignRunId: string): AdmittedCampaignEvent {
  if (row.campaign_run_id !== campaignRunId) corrupt("event row belongs to another campaign run");
  const kind = oneOf(row.kind, CAMPAIGN_EVENT_KINDS, "kind");
  const seq = integer(row.seq, "seq", 1);
  const commandId = string(row.command_id, "command_id");
  const expectedRevision = row.expected_revision === null ? null : integer(row.expected_revision, "expected_revision");
  if ((kind === "campaign_created") !== (expectedRevision === null)) corrupt("only campaign_created carries a NULL expected revision");
  if (expectedRevision !== null && seq !== expectedRevision + 1) corrupt("seq must be expected revision + 1");
  const operandsDigest = digest(row.operands_digest, "operands_digest") as Sha256;
  const at = campaignInstant(row.at);
  const payload = parseCampaignPayload(kind, canonicalText(string(row.payload, "payload"), "payload"));
  const result = exact(canonicalText(string(row.result_payload, "result_payload"), "result_payload"), ["kind", "campaignRevision", "response", "digest"], "result_payload");
  if (result.kind !== CAMPAIGN_RESULT_KINDS[kind]) corrupt(`result kind ${String(result.kind)} does not answer ${kind}`);
  if (result.campaignRevision !== seq) corrupt("result revision differs from seq");
  const expected = envelopeDigest({ campaignRunId, seq, kind, commandId, expectedRevision, operandsDigest, at, payload, resultKind: result.kind as string, response: result.response });
  if (result.digest !== expected) corrupt("result digest does not cover this envelope");
  return deepFreeze({
    event: { seq, kind, commandId, expectedRevision, at, payload } as CampaignEvent,
    operandsDigest,
    result: { kind: result.kind as string, campaignRevision: seq, response: result.response as Json, digest: expected },
  });
}

export function campaignOperandsDigest(operands: unknown): Sha256 {
  return canonicalSha256(operands);
}
