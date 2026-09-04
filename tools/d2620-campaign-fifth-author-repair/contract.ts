// DISPOSABLE D2620-D2624 Campaign author model. Not production code.
import { createHash } from "node:crypto";

export type Sha = `sha256:${string}`;
export type CampaignMutationOperation = "rewind" | "fork" | "group" | "simulate_enter";

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
export const digest = (value: unknown): Sha =>
  `sha256:${createHash("sha256").update(stable(value)).digest("hex")}`;

const freeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
const exact = (record: Record<string, unknown>, keys: readonly string[], error: string): void => {
  if (Object.keys(record).sort().join("\0") !== [...keys].sort().join("\0")) throw new TypeError(error);
};
const object = (value: unknown, error: string): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(error);
  return value as Record<string, unknown>;
};
const string = (value: unknown, error: string): string => {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(error);
  return value;
};
const integer = (value: unknown, error: string): number => {
  if (!Number.isInteger(value) || (value as number) < 0) throw new TypeError(error);
  return value as number;
};
const strings = (value: unknown, error: string): readonly string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) throw new TypeError(error);
  return value as readonly string[];
};
const sha = (value: unknown, error: string): Sha => {
  const parsed = string(value, error);
  if (!/^sha256:[0-9a-f]{64}$/u.test(parsed)) throw new TypeError(error);
  return parsed as Sha;
};

export interface CampaignMutationCommand {
  readonly campaignRunId: string;
  readonly playRunId: string;
  readonly mutationCommandId: string;
  readonly expectedCampaignRevision: number;
  readonly operation: CampaignMutationOperation;
  readonly operandsDigest: Sha;
}
export type CampaignMutationResult =
  | Readonly<{ kind: "committed"; campaignRevision: number; playRevision: number; chargeBalance: number }>
  | Readonly<{ kind: "provider_failed"; code: string }>;
interface StoredMutation { readonly command: CampaignMutationCommand; readonly result: CampaignMutationResult }
export interface CampaignEconomyState {
  readonly campaignRevision: number;
  readonly playRevision: number;
  readonly chargeBalance: number;
  readonly stored: ReadonlyMap<string, StoredMutation>;
}
export function applyChargedMutation(
  state: CampaignEconomyState,
  command: CampaignMutationCommand,
  provider: () => "ready" | "failed",
): Readonly<{ state: CampaignEconomyState; result: CampaignMutationResult }> {
  const prior = state.stored.get(command.mutationCommandId);
  if (prior !== undefined) {
    if (stable(prior.command) !== stable(command)) throw new TypeError("CAMPAIGN_COMMAND_REUSED");
    return freeze({ state, result: prior.result });
  }
  if (command.expectedCampaignRevision !== state.campaignRevision) throw new TypeError("CAMPAIGN_REVISION_STALE");
  if (state.chargeBalance === 0) throw new TypeError("CAMPAIGN_REWIND_EXHAUSTED");
  const stored = new Map(state.stored);
  if (provider() === "failed") {
    const result = freeze({ kind: "provider_failed" as const, code: "OPPONENT_PROVIDER_UNAVAILABLE" });
    stored.set(command.mutationCommandId, freeze({ command, result }));
    return freeze({ state: freeze({ ...state, stored }), result });
  }
  const result = freeze({ kind: "committed" as const, campaignRevision: state.campaignRevision + 1,
    playRevision: state.playRevision + 1, chargeBalance: state.chargeBalance - 1 });
  stored.set(command.mutationCommandId, freeze({ command, result }));
  return freeze({ state: freeze({ campaignRevision: result.campaignRevision, playRevision: result.playRevision,
    chargeBalance: result.chargeBalance, stored }), result });
}

export interface AssistanceSubject {
  readonly campaignRunId: string;
  readonly nodeId: string;
  readonly playRunId: string;
  readonly packDigest: Sha;
  readonly workflowContext: "campaign";
  readonly disclosureCeiling: string;
  readonly inventoryEventSeq: number;
  readonly nodeEnteredEventDigest: Sha;
}
export interface TheoryGate {
  readonly passageId: string;
  readonly authorizingModuleId: string;
  readonly sourceId: string;
  readonly subject: AssistanceSubject;
  readonly applicability: Readonly<{ subject: AssistanceSubject; passageId: string; applicable: boolean; sourceReceiptDigest: Sha }>;
  readonly disclosure: Readonly<{ subject: AssistanceSubject; passageId: string; allowed: boolean; sourceReceiptDigest: Sha }>;
}
export function authorizeCampaignTheory(subject: AssistanceSubject, gate: TheoryGate): "authorized" | "subject_mismatch" | "not_applicable" | "disclosure_ceiling" {
  if (stable(subject) !== stable(gate.subject) || stable(subject) !== stable(gate.applicability.subject)
    || stable(subject) !== stable(gate.disclosure.subject)) return "subject_mismatch";
  if (gate.applicability.passageId !== gate.passageId || !gate.applicability.applicable) return "not_applicable";
  if (gate.disclosure.passageId !== gate.passageId || !gate.disclosure.allowed) return "disclosure_ceiling";
  return "authorized";
}

type EventKind = "campaign_created" | "node_entered" | "node_committed" | "loadout_changed" | "charge_spent" | "campaign_abandoned";
const PAYLOAD_KEYS: Readonly<Record<EventKind, readonly string[]>> = freeze({
  campaign_created: ["campaignId", "campaignVersion", "documentDigest", "startingCharges"],
  node_entered: ["nodeId", "playRunId", "inventoryEventSeq", "packDigest"],
  node_committed: ["nodeId", "playRunId", "branchId", "verdict", "participation", "actIncome", "reward", "terminal"],
  loadout_changed: ["equippedModuleIds"],
  charge_spent: ["playRunId", "mutationCommandId", "operation", "amount"],
  campaign_abandoned: ["activeNodeId", "activePlayRunId"],
});
const RESULT_KINDS: Readonly<Record<EventKind, string>> = freeze({
  campaign_created: "campaign_created", node_entered: "encounter_started", node_committed: "node_committed",
  loadout_changed: "loadout_changed", charge_spent: "mutation_committed", campaign_abandoned: "campaign_abandoned",
});
export interface ParsedCampaignEvent {
  readonly campaignRunId: string; readonly seq: number; readonly kind: EventKind;
  readonly commandId: string; readonly expectedRevision: number | null; readonly operandsDigest: Sha;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly result: Readonly<{ kind: string; campaignRevision: number; digest: Sha }>;
  readonly at: string;
}
function validatePayload(kind: EventKind, payload: Record<string, unknown>): void {
  if (kind === "campaign_created") {
    string(payload.campaignId, "CAMPAIGN_CREATED_INVALID");
    integer(payload.campaignVersion, "CAMPAIGN_CREATED_INVALID");
    sha(payload.documentDigest, "CAMPAIGN_CREATED_INVALID");
    integer(payload.startingCharges, "CAMPAIGN_CREATED_INVALID");
    return;
  }
  if (kind === "node_entered") {
    string(payload.nodeId, "CAMPAIGN_NODE_ENTERED_INVALID");
    string(payload.playRunId, "CAMPAIGN_NODE_ENTERED_INVALID");
    integer(payload.inventoryEventSeq, "CAMPAIGN_NODE_ENTERED_INVALID");
    sha(payload.packDigest, "CAMPAIGN_NODE_ENTERED_INVALID");
    return;
  }
  if (kind === "node_committed") {
    for (const key of ["nodeId", "playRunId", "branchId"] as const) string(payload[key], "CAMPAIGN_NODE_COMMITTED_INVALID");
    if (!["achieved", "failed", "transitioned", "open"].includes(String(payload.verdict))) throw new TypeError("CAMPAIGN_NODE_COMMITTED_INVALID");
    if (!["continue", "completed"].includes(String(payload.terminal))) throw new TypeError("CAMPAIGN_NODE_COMMITTED_INVALID");
    const participation = object(payload.participation, "CAMPAIGN_PARTICIPATION_INVALID");
    exact(participation, ["learnerMoveEventSeq", "consequenceTipNodeId", "completion"], "CAMPAIGN_PARTICIPATION_FIELDS_INVALID");
    integer(participation.learnerMoveEventSeq, "CAMPAIGN_PARTICIPATION_INVALID");
    string(participation.consequenceTipNodeId, "CAMPAIGN_PARTICIPATION_INVALID");
    if (!["objective_absorbing", "authored_boundary"].includes(String(participation.completion))) throw new TypeError("CAMPAIGN_PARTICIPATION_INVALID");
    const income = object(payload.actIncome, "CAMPAIGN_ACT_INCOME_INVALID");
    exact(income, ["source", "act", "amount"], "CAMPAIGN_ACT_INCOME_FIELDS_INVALID");
    if (income.source !== "act_seal" || !["act1", "act2", "act3"].includes(String(income.act)) || integer(income.amount, "CAMPAIGN_ACT_INCOME_INVALID") < 1) throw new TypeError("CAMPAIGN_ACT_INCOME_INVALID");
    if (payload.reward !== null) {
      const reward = object(payload.reward, "CAMPAIGN_REWARD_INVALID");
      const rewardKind = string(reward.kind, "CAMPAIGN_REWARD_INVALID");
      const keys: Readonly<Record<string, readonly string[]>> = {
        module_unlock: ["kind", "moduleId"], theory_unlock: ["kind", "bundleId", "passageId"],
        resource_grant: ["kind", "resourceId", "amount"],
      };
      if (!(rewardKind in keys)) throw new TypeError("CAMPAIGN_REWARD_KIND_INVALID");
      exact(reward, keys[rewardKind]!, "CAMPAIGN_REWARD_FIELDS_INVALID");
      if (rewardKind === "module_unlock") string(reward.moduleId, "CAMPAIGN_REWARD_INVALID");
      if (rewardKind === "theory_unlock") { string(reward.bundleId, "CAMPAIGN_REWARD_INVALID"); string(reward.passageId, "CAMPAIGN_REWARD_INVALID"); }
      if (rewardKind === "resource_grant" && (reward.resourceId !== "campaign_rewind_charge" || integer(reward.amount, "CAMPAIGN_REWARD_INVALID") < 1)) throw new TypeError("CAMPAIGN_REWARD_INVALID");
    }
    return;
  }
  if (kind === "loadout_changed") {
    const modules = strings(payload.equippedModuleIds, "CAMPAIGN_LOADOUT_INVALID");
    if (new Set(modules).size !== modules.length) throw new TypeError("CAMPAIGN_LOADOUT_INVALID");
    return;
  }
  if (kind === "charge_spent") {
    string(payload.playRunId, "CAMPAIGN_CHARGE_SPENT_INVALID");
    string(payload.mutationCommandId, "CAMPAIGN_CHARGE_SPENT_INVALID");
    if (!["rewind", "fork", "group", "simulate_enter"].includes(String(payload.operation)) || payload.amount !== 1) throw new TypeError("CAMPAIGN_CHARGE_SPENT_INVALID");
    return;
  }
  const bothNull = payload.activeNodeId === null && payload.activePlayRunId === null;
  const bothStrings = typeof payload.activeNodeId === "string" && typeof payload.activePlayRunId === "string";
  if (!bothNull && !bothStrings) throw new TypeError("CAMPAIGN_ABANDONED_INVALID");
}
export function parseCampaignEvent(value: string): ParsedCampaignEvent {
  const row = object(JSON.parse(value) as unknown, "CAMPAIGN_EVENT_INVALID");
  exact(row, ["campaignRunId", "seq", "kind", "commandId", "expectedRevision", "operandsDigest", "payload", "result", "at"], "CAMPAIGN_EVENT_FIELDS_INVALID");
  const kind = string(row.kind, "CAMPAIGN_EVENT_KIND_INVALID") as EventKind;
  if (!(kind in PAYLOAD_KEYS)) throw new TypeError("CAMPAIGN_EVENT_KIND_INVALID");
  const seq = integer(row.seq, "CAMPAIGN_EVENT_REVISION_INVALID");
  const expected = row.expectedRevision;
  if (kind === "campaign_created" ? expected !== null || seq !== 1 : !Number.isInteger(expected) || seq !== (expected as number) + 1) {
    throw new TypeError("CAMPAIGN_EVENT_REVISION_INVALID");
  }
  const payload = object(row.payload, "CAMPAIGN_EVENT_PAYLOAD_INVALID");
  exact(payload, PAYLOAD_KEYS[kind], "CAMPAIGN_EVENT_PAYLOAD_FIELDS_INVALID");
  validatePayload(kind, payload);
  const result = object(row.result, "CAMPAIGN_EVENT_RESULT_INVALID");
  exact(result, ["kind", "campaignRevision", "digest"], "CAMPAIGN_EVENT_RESULT_FIELDS_INVALID");
  if (result.kind !== RESULT_KINDS[kind]) throw new TypeError("CAMPAIGN_EVENT_RESULT_KIND_INVALID");
  if (integer(result.campaignRevision, "CAMPAIGN_EVENT_RESULT_REVISION_INVALID") !== seq) throw new TypeError("CAMPAIGN_EVENT_RESULT_REVISION_INVALID");
  if (result.digest !== digest({ kind: result.kind, campaignRevision: result.campaignRevision, payload })) throw new TypeError("CAMPAIGN_EVENT_RESULT_DIGEST_INVALID");
  return freeze({ campaignRunId: string(row.campaignRunId, "CAMPAIGN_EVENT_INVALID"), seq, kind,
    commandId: string(row.commandId, "CAMPAIGN_EVENT_INVALID"), expectedRevision: expected as number | null,
    operandsDigest: sha(row.operandsDigest, "CAMPAIGN_EVENT_INVALID"), payload, result: result as ParsedCampaignEvent["result"],
    at: string(row.at, "CAMPAIGN_EVENT_INVALID") });
}

export type CampaignPhase = "opening" | "middlegame" | "endgame";
export interface CampaignDocument {
  readonly id: string; readonly version: number; readonly publication: Readonly<{ channel: "official" | "community" }>;
  readonly targetLearnerId: string; readonly expectedMinutes: Readonly<{ min: number; max: number }>;
  readonly nodes: readonly Readonly<{ id: string; packId: string; packDigest: Sha }> [];
}
export interface CurriculumRegistries {
  readonly targetLearners: readonly string[];
  readonly packs: Readonly<Record<string, Readonly<{ digest: Sha; phase: CampaignPhase; form: "pack";
    theoryPassageIds: readonly string[]; evidenceRefs: readonly string[]; requirementIds: readonly string[] }>>>;
  readonly passages: readonly string[]; readonly evidence: readonly string[];
  readonly dependencies: Readonly<Record<string, Readonly<{ operation: string;
    unavailableAction: "refuse_start" | "honest_degradation"; fallbackOperation: string; sourceAvailable: boolean }>>>;
  readonly providerOperations: readonly string[];
}
export interface CurriculumReviewReceipt { readonly authority: "owner_human_chess_review"; readonly documentDigest: Sha; readonly reviewedAt: string }
export interface CampaignCurriculumMetadata {
  readonly campaignDigest: Sha; readonly targetLearnerId: string; readonly expectedMinutes: Readonly<{ min: number; max: number }>;
  readonly phaseCoverage: Readonly<Record<CampaignPhase, readonly string[]>>;
  readonly nodeFacts: readonly Readonly<{ nodeId: string; packId: string; packDigest: Sha; theoryPassageIds: readonly string[];
    evidenceRefs: readonly string[]; dependencies: readonly Readonly<{ requirementId: string; operation: string;
      unavailableAction: "refuse_start" | "honest_degradation"; fallbackOperation: string; sourceAvailable: boolean }>[] }> [];
  readonly reviewReceipt: CurriculumReviewReceipt;
}
const canonical = (values: readonly string[]): readonly string[] => freeze([...new Set(values)].sort());
export function compileOfficialCurriculum(document: CampaignDocument, registries: CurriculumRegistries,
  reviewReceipt: CurriculumReviewReceipt): CampaignCurriculumMetadata {
  if (document.publication.channel !== "official") throw new TypeError("CAMPAIGN_CURRICULUM_NOT_OFFICIAL");
  if (!registries.targetLearners.includes(document.targetLearnerId)) throw new TypeError("CAMPAIGN_CURRICULUM_TARGET_UNKNOWN");
  if (document.expectedMinutes.min <= 0 || document.expectedMinutes.max < document.expectedMinutes.min) throw new TypeError("CAMPAIGN_CURRICULUM_ENVELOPE_INVALID");
  if (new Set(document.nodes.map((node) => node.id)).size !== document.nodes.length) throw new TypeError("CAMPAIGN_CURRICULUM_NODE_DUPLICATE");
  const nodeFacts = document.nodes.map((node) => {
    const pack = registries.packs[node.packId];
    if (pack === undefined || pack.digest !== node.packDigest) throw new TypeError("CAMPAIGN_CURRICULUM_PACK_UNKNOWN");
    for (const passage of pack.theoryPassageIds) if (!registries.passages.includes(passage)) throw new TypeError("CAMPAIGN_CURRICULUM_PASSAGE_UNKNOWN");
    for (const evidence of pack.evidenceRefs) if (!registries.evidence.includes(evidence)) throw new TypeError("CAMPAIGN_CURRICULUM_EVIDENCE_UNKNOWN");
    const dependencies = pack.requirementIds.map((requirementId) => {
      const dependency = registries.dependencies[requirementId];
      if (dependency === undefined) throw new TypeError("CAMPAIGN_CURRICULUM_DEPENDENCY_UNKNOWN");
      if (!registries.providerOperations.includes(dependency.operation)) throw new TypeError("CAMPAIGN_CURRICULUM_OPERATION_UNKNOWN");
      if (!registries.providerOperations.includes(dependency.fallbackOperation)) throw new TypeError("CAMPAIGN_CURRICULUM_FALLBACK_UNKNOWN");
      return freeze({ requirementId, ...dependency });
    });
    return freeze({ nodeId: node.id, packId: node.packId, packDigest: node.packDigest,
      theoryPassageIds: canonical(pack.theoryPassageIds), evidenceRefs: canonical(pack.evidenceRefs), dependencies: freeze(dependencies) });
  });
  const phase = (name: CampaignPhase) => canonical(document.nodes.filter((node) => registries.packs[node.packId]?.phase === name).map((node) => node.id));
  const phaseCoverage = freeze({ opening: phase("opening"), middlegame: phase("middlegame"), endgame: phase("endgame") });
  if (Object.values(phaseCoverage).some((nodes) => nodes.length === 0)) throw new TypeError("CAMPAIGN_CURRICULUM_PHASE_EMPTY");
  const campaignDigest = digest(document);
  if (reviewReceipt.authority !== "owner_human_chess_review" || reviewReceipt.documentDigest !== campaignDigest || reviewReceipt.reviewedAt.length === 0) {
    throw new TypeError("CAMPAIGN_CURRICULUM_REVIEW_INVALID");
  }
  return freeze({ campaignDigest, targetLearnerId: document.targetLearnerId, expectedMinutes: document.expectedMinutes,
    phaseCoverage, nodeFacts: freeze(nodeFacts), reviewReceipt: freeze(reviewReceipt) });
}
