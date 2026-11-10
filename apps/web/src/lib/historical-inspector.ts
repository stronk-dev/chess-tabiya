// Explicit historical Inspector confirmation. No source acquisition or preference persistence.
import { ASSISTANCE_PREFERENCE_FIELDS, MODULE_EFFECT_CATALOG, compileAssistanceRequest, moduleDecisionStamp,
  parseFinalizedAssistanceV1, type DrillRun, type FinalizedAssistanceV1, type RequestedAssistanceV1,
  type WorkflowContextId } from "@chess-tabiya/runtime/client";
import { parseReviewDecision } from "./review-analyze.js";

export interface HistoricalInspectorTarget {
  readonly runId: string; readonly branchId: string; readonly nodeId: string; readonly fen: string;
  readonly decision: ReturnType<typeof moduleDecisionStamp>; readonly workflowContext: WorkflowContextId;
}
export interface InspectorAssistanceRequest {
  readonly assistance: RequestedAssistanceV1;
  readonly inspector: { readonly branchId: string; readonly nodeId: string; readonly decisionDigest: string };
}
const fail = (): never => { throw new TypeError("Recorded Inspector confirmation is invalid"); };
function snapshot(value: unknown, active = new Set<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || active.has(value)) return fail();
  const array = Array.isArray(value);
  if (Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype)) return fail();
  if (array && Reflect.ownKeys(value).length !== value.length + 1) return fail();
  active.add(value);
  try {
    const copy: Record<string, unknown> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (array && key === "length") continue;
      const field = Object.getOwnPropertyDescriptor(value, key)!;
      if (typeof key !== "string" || !field.enumerable || !("value" in field)) return fail();
      Object.defineProperty(copy, key, { value: snapshot(field.value, active), enumerable: true });
    }
    return Object.freeze(array ? Array.from({ length: value.length }, (_, index) => Object.hasOwn(copy, index) ? copy[index] : fail()) : copy);
  } finally { active.delete(value); }
}
function record(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Reflect.ownKeys(value).length !== fields.length || !fields.every(key => Object.hasOwn(value, key))) return fail();
  return value as Record<string, unknown>;
}
const member = (value: unknown, values: readonly unknown[]) => { if (!values.includes(value)) fail(); };
const digest = (value: unknown) => { if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(value)) fail(); };
const moduleId = (value: unknown) => member(value, MODULE_EFFECT_CATALOG.map(effect => effect.moduleId));

/** Close the existing receipt's records; its original parser still owns digest/domain checks.
 * Public digests are integrity checks, never authority for acquiring evidence. */
function finalized(input: unknown): FinalizedAssistanceV1 {
  const value = record(input, ["stage", "schemaVersion", "context", "preset", "displayMode", "modules", "config", "permission", "effects", "suppressed", "hintCeiling",
    "requestedDigest", "sourceAuthority", "authoritativeDigest", "sourceDigest", "finalDigest", ...(Object.hasOwn(input as object, "campaignReceipt") ? ["campaignReceipt"] : [])]);
  if (Object.hasOwn(value, "campaignReceipt") !== (value.context === "campaign")) return fail();
  if (value.schemaVersion !== 1 || !Array.isArray(value.effects) || !Array.isArray(value.suppressed) || !Array.isArray(value.modules)) return fail();
  record(value.config, ["version", ...ASSISTANCE_PREFERENCE_FIELDS]);
  const permission = record(value.permission, ASSISTANCE_PREFERENCE_FIELDS);
  for (const field of ASSISTANCE_PREFERENCE_FIELDS) member(permission[field], field === "boardLighting" ? ["legal", "sight", "evidence"] : field === "arrows" ? ["locked_off", "sight", "evidence"] : ["free", "locked_off"]);
  for (const raw of value.effects) {
    const effect = record(raw, ["effectId", "moduleId", "timing", "arm", ...(raw !== null && typeof raw === "object" && Object.hasOwn(raw, "subSurface") ? ["subSurface"] : [])]);
    const declared = MODULE_EFFECT_CATALOG.find(item => item.effectId === effect.effectId);
    if (declared === undefined || Object.keys(effect).length !== Object.keys(declared).length || Object.keys(effect).some(key => effect[key] !== declared[key as keyof typeof declared]) || !value.modules.includes(declared.moduleId)) return fail();
  }
  if (new Set(value.effects.map(item => item.effectId)).size !== value.effects.length || new Set(value.modules).size !== value.modules.length) return fail();
  for (const raw of value.suppressed) {
    if (raw === null || typeof raw !== "object") return fail();
    const kind = (raw as Record<string, unknown>).kind;
    const item = record(raw, kind === "preference_recovery" ? ["kind", "reason"] : kind === "module" ? ["kind", "moduleId", "requested", "effective", "by", "reason"]
      : kind === "field" ? ["kind", "field", "requested", "effective", "by", "reason"] : kind === "effect" ? ["kind", "effectId", "moduleId", "requested", "effective", "by", "reason", "failedAlternatives"] : fail());
    if (kind === "preference_recovery") member(item.reason, ["malformed", "storage_unavailable"]);
    else if (kind === "field") { member(item.field, ASSISTANCE_PREFERENCE_FIELDS); member(item.by, ["context_ceiling", "access", "stored_choice", "source_availability", "browser_channel"]); }
    else {
      moduleId(item.moduleId);
      if (kind === "module") { member(item.requested, [true]); member(item.effective, [false]); member(item.by, ["context_ceiling", "access", "stored_choice"]); }
      else {
        member(item.requested, ["enabled"]); member(item.effective, ["disabled"]); member(item.by, ["source_availability"]);
        if (!MODULE_EFFECT_CATALOG.some(effect => effect.effectId === item.effectId && effect.moduleId === item.moduleId) || !Array.isArray(item.failedAlternatives)) return fail();
        for (const alternative of item.failedAlternatives) {
          if (!Array.isArray(alternative)) return fail();
          for (const source of alternative) member(source, ["llm", "tts", "stockfish", "syzygy", "maia", "explorer"]);
        }
      }
    }
  }
  const hint = record(value.hintCeiling, ["rung", "validation", "ruling"]);
  if (hint.validation !== "proposed" || hint.ruling !== "D1639") return fail();
  const authority = record(value.sourceAuthority, ["state", "code", "source"]);
  if (authority.state !== "not_accepted" || authority.code !== "MODULE_AUTHORITY_NOT_ACCEPTED" || typeof authority.source !== "string" || authority.source.trim() === "") return fail();
  if (Object.hasOwn(value, "campaignReceipt")) {
    const campaign = record(value.campaignReceipt, ["receiptDigest", "inventoryEventSeq", "phase"]);
    digest(campaign.receiptDigest); if (!Number.isSafeInteger(campaign.inventoryEventSeq) || Number(campaign.inventoryEventSeq) < 0) return fail();
    member(campaign.phase, ["active", "sealed", "abandoned"]);
  }
  for (const key of ["requestedDigest", "authoritativeDigest", "sourceDigest", "finalDigest"]) digest(value[key]);
  return parseFinalizedAssistanceV1(value);
}

export function historicalInspectorTarget(run: DrillRun, branchId: string, nodeId: string, workflowContext: WorkflowContextId): HistoricalInspectorTarget {
  const node = run.nodes.find(node => node.id === nodeId);
  if (node === undefined || !run.branches.some(branch => branch.id === branchId)) return fail();
  // Selection membership and disclosure are still established by the original server owner.
  return Object.freeze({ runId: run.id, branchId, nodeId, fen: node.fen, decision: moduleDecisionStamp(run), workflowContext });
}
export function historicalInspectorIntent(target: HistoricalInspectorTarget): RequestedAssistanceV1 {
  return compileAssistanceRequest({ contextHint: target.workflowContext, preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
}
export function parseInspectorAssistanceResponse(input: unknown, target: HistoricalInspectorTarget, intent: RequestedAssistanceV1): FinalizedAssistanceV1 {
  const body = record(snapshot(input), ["assistance", "inspector"]), position = record(body.inspector, ["runId", "branchId", "nodeId", "fen", "decision"]);
  for (const key of ["runId", "branchId", "nodeId", "fen"] as const) if (position[key] !== target[key]) return fail();
  if (parseReviewDecision(position.decision).digest !== target.decision.digest) return fail();
  const help = finalized(body.assistance);
  if (help.context !== target.workflowContext || help.requestedDigest !== intent.requestDigest || !help.modules.includes("full_inspector")
    || !help.effects.some(effect => effect.effectId === "full_inspector:review:explicit_mode")) return fail();
  return help;
}
