// Accepted module-registration §4.11a: the closed requested source-page grammar.
// This is request intent only, not access, source admission or a registered Full2 consumer.
import { parseRequestedAssistanceV1, type RequestedAssistanceV1 } from "./assistance-exchange.js";
import type { InspectorFamilyId } from "./module-contract.js";
import { INSPECTOR_SOURCE_TOPICS, type InspectorSourceContext, type InspectorSourceRef } from "./inspector-source-topics.js";
export { INSPECTOR_SOURCE_TOPICS, type InspectorSourceContext, type InspectorSourceRef } from "./inspector-source-topics.js";
import { INSPECTOR_DETAIL_SOURCES, parseInspectorDetailScope, type InspectorDetailKind, type InspectorDetailScope } from "./inspector-detail.js";
import type { ModuleDecisionStamp } from "./module-decision.js";
import type { PresentationReceipt } from "./presentation-contract.js";
import type { ExplorerSpeed } from "./provider-types.js";

type MateRef = Extract<InspectorSourceRef, `rules.tactic.consequence.forced_mate_after_move@${number}`>;
export type InspectorMateParameters = Readonly<{ kind: "forced_mate"; maxAttackerMoves: 1 | 2 | 3 | 4 }>;
type SourceView = Readonly<{ kind: "source"; context: InspectorSourceContext; start: number; collectionKey: string | null }> &
  (Readonly<{ projection: Exclude<InspectorSourceRef, MateRef>; parameters?: never }> |
   Readonly<{ projection: MateRef; parameters: InspectorMateParameters }>);
export type InspectorQueryView = Readonly<{ kind: "inventory"; start: number }> | SourceView |
  Readonly<{ kind: "detail"; projection: (typeof INSPECTOR_DETAIL_SOURCES)[InspectorDetailKind]; context: InspectorSourceContext;
    sourceKey: string; scope: InspectorDetailScope; start: number }>;
export interface InspectorQueryRequest {
  readonly protocol: "inspector.query_page@1";
  readonly assistance: RequestedAssistanceV1;
  readonly query: Readonly<{ branchId: string; nodeId: string; decisionDigest: string; view: InspectorQueryView }>;
}
export type InspectorPageRange = Readonly<{ start: number; count: number; total: number; next: number | null }>;
export type InspectorBudgetDimension = "facts" | "words" | "marks" | "arrows";
export type InspectorDetailRef = `derived.inspector.detail.${InspectorDetailKind}@1`;
export interface InspectorRecordedCoverage {
  readonly sourceKey: string;
  readonly matchedRecords: number;
  readonly admittedRecords: number;
  readonly notAdmittedRecords: number;
  readonly abstentions: Readonly<{ out_of_range: number; source_unavailable: number; no_data_at_band: number; licence_withheld: number }>;
}
export type InspectorSourceStatus =
  | Readonly<{ kind: "no_witness" }>
  | Readonly<{ kind: "missing_context"; reason: "no_incoming_edge" | "no_recorded_window" | "no_second_attempt" | "no_recorded_review" }>
  | Readonly<{ kind: "unavailable"; reason: "source_absent" | "analyze_variant_not_selected" | "provider_unavailable" | "authored_source_absent" | "source_dependency_unavailable" | "invalid_turn_clone" | "no_legal_recapture" | "recorded_measurement_unavailable" | "artifact_missing" }>
  | Readonly<{ kind: "unavailable"; reason: "source_version_held"; dependency: string }>
  | Readonly<{ kind: "failed"; reason: "source_contract_invalid" | "provider_failed" | "source_lookup_failed" | "artifact_invalid" | "digest_mismatch" }>;
export type InspectorSourceOutcome = InspectorSourceStatus
  | Readonly<{ kind: "below_floor"; sourceKey: string; total: number;
      population: Readonly<{ ratingBuckets: readonly number[]; speeds: readonly ExplorerSpeed[]; since: string | null; until: string | null }> }>
  | Readonly<{ kind: "available"; collectionKey: string; range: InspectorPageRange; collected: number; displayed: number; deferred: number;
      facts: readonly Readonly<{ sourceKey: string; disposition: "presented" | "deferred"; exceeded: readonly InspectorBudgetDimension[]; detail: InspectorDetailRef | null }>[];
      presentation: PresentationReceipt }>;
export type InspectorPageBody =
  | Readonly<{ kind: "inventory"; range: InspectorPageRange;
      topics: readonly Readonly<{ projection: InspectorSourceRef; family: InspectorFamilyId; state: "not_requested" }>[] }>
  | (Readonly<{ kind: "source"; context: InspectorSourceContext; outcome: InspectorSourceOutcome; recordedCoverage: InspectorRecordedCoverage | null }>
      & (Readonly<{ projection: Exclude<InspectorSourceRef, MateRef>; parameters?: never }> | Readonly<{ projection: MateRef; parameters: InspectorMateParameters }>))
  | Readonly<{ kind: "detail"; projection: InspectorSourceRef; context: InspectorSourceContext; sourceKey: string; scope: InspectorDetailScope;
      range: InspectorPageRange; fullSourceTotal: number; sourceOrdinals: readonly number[]; presentation: PresentationReceipt }>
  | Readonly<{ kind: "detail_limited"; projection: InspectorSourceRef; context: InspectorSourceContext; sourceKey: string; scope: InspectorDetailScope;
      ordinal: number; sourceOrdinal: number; selectedTotal: number; fullSourceTotal: number; exceeded: readonly InspectorBudgetDimension[] }>;
export interface InspectorDisclosureReceipt {
  readonly protocol: "inspector.disclosure_receipt@1";
  readonly runId: string;
  readonly branchId: string;
  readonly nodeId: string;
  readonly decisionDigest: string;
  readonly requestedConfigDigest: string;
  readonly effectiveConfigDigest: string;
  readonly view: InspectorQueryView;
  readonly range: InspectorPageRange | null;
  readonly collectionKey: string | null;
  readonly sourceKeys: readonly string[];
  readonly sourceOrdinals: readonly number[];
  readonly detailProjection: InspectorDetailRef | null;
  readonly componentDigests: readonly string[];
  readonly sourceOutcome: InspectorSourceStatus | Extract<InspectorSourceOutcome, { kind: "below_floor" }> | Readonly<{ kind: "available" }> | null;
  readonly recordedCoverage: InspectorRecordedCoverage | null;
  readonly digest: string;
}
export type InspectorQueryPage = Readonly<{ protocol: "inspector.query_page@1"; kind: "refused";
    code: "invalid_request" | "not_found" | "withheld" | "stale" | "unsupported_version" }>
  | Readonly<{ protocol: "inspector.query_page@1"; kind: "page"; runId: string; branchId: string; nodeId: string;
      decision: ModuleDecisionStamp; requestedConfigDigest: string; effectiveConfigDigest: string;
      disclosure: InspectorDisclosureReceipt; body: InspectorPageBody }>;
export class InspectorQueryError extends TypeError {
  constructor(message: string, readonly code: "invalid_request" | "unsupported_version" = "invalid_request") { super(`INSPECTOR_QUERY_INVALID: ${message}`); }
}
const invalid = (message: string): never => { throw new InspectorQueryError(message); };
const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
function record(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!plain(value) || Reflect.ownKeys(value).length !== keys.length || !keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor !== undefined && descriptor.enumerable && "value" in descriptor;
  })) return invalid(`${label} must contain exactly its declared data fields`);
  return value;
}
const text = (value: unknown, label: string): string => typeof value === "string" && value.trim() !== "" ? value : invalid(`${label} must be nonempty text`);
const ordinal = (value: unknown, label: string): number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : invalid(`${label} must be a nonnegative safe integer`);
function context(value: unknown): InspectorSourceContext {
  if (!plain(value)) return invalid("context must be an object");
  const descriptor = Object.getOwnPropertyDescriptor(value, "kind"), kind = descriptor !== undefined && "value" in descriptor ? descriptor.value : undefined;
  if (kind === "position" || kind === "incoming_edge" || kind === "recorded_window") {
    record(value, ["kind"], "context"); return Object.freeze({ kind });
  }
  if (kind === "branch" || kind === "recorded_review") {
    const row = record(value, ["kind", "throughNodeId"], "context"); return Object.freeze({ kind, throughNodeId: text(row.throughNodeId, "throughNodeId") });
  }
  if (kind === "comparison") {
    const row = record(value, ["kind", "otherBranchId", "otherNodeId"], "context");
    return Object.freeze({ kind, otherBranchId: text(row.otherBranchId, "otherBranchId"), otherNodeId: text(row.otherNodeId, "otherNodeId") });
  }
  return invalid("unknown source context");
}

/** Closed data snapshot before assistance's own parser. No accessors/toJSON/hidden fields,
 * inherited objects or cycles execute while parsing. Serializable shared branches detach. */
function snapshot(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "object" || ancestors.has(value)) return invalid("request must be an ordinary JSON tree");
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || Reflect.ownKeys(value).length !== value.length + 1) return invalid("request arrays must be dense data arrays");
    const copy = Object.freeze(Array.from({ length: value.length }, (_, index) => {
      const field = Object.getOwnPropertyDescriptor(value, index);
      return field !== undefined && field.enumerable && "value" in field ? snapshot(field.value, ancestors) : invalid("request arrays must contain data fields");
    }));
    ancestors.delete(value);
    return copy;
  }
  if (!plain(value)) return invalid("request objects must be plain data records");
  const copy: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(value)) {
    const field = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== "string" || field === undefined || !field.enumerable || !("value" in field)) return invalid("request records must contain enumerable data fields");
    Object.defineProperty(copy, key, { value: snapshot(field.value, ancestors), enumerable: true });
  }
  ancestors.delete(value);
  return Object.freeze(copy);
}

/** Parses requested intent only. Server current authorization and complete consumer preflight
 * must still precede every inventory/source/detail operation; this function acquires nothing. */
export function parseInspectorRequestedAssistance(value: unknown): RequestedAssistanceV1 {
  try { return parseRequestedAssistanceV1(snapshot(value)); }
  catch (error) { return invalid(`requested assistance refused: ${(error as Error).message}`); }
}

export function parseInspectorQueryRequest(value: unknown): InspectorQueryRequest {
  const body = record(value, ["protocol", "assistance", "query"], "request");
  if (body.protocol !== "inspector.query_page@1") throw new InspectorQueryError("unsupported Inspector protocol", "unsupported_version");
  const assistance = parseInspectorRequestedAssistance(body.assistance);
  const query = record(body.query, ["branchId", "nodeId", "decisionDigest", "view"], "query");
  const branchId = text(query.branchId, "branchId"), nodeId = text(query.nodeId, "nodeId"), decisionDigest = text(query.decisionDigest, "decisionDigest");
  if (!/^sha256:[a-f0-9]{64}$/u.test(decisionDigest)) return invalid("decisionDigest must be the exact decision digest");
  if (!plain(query.view)) return invalid("view must be an object");
  const descriptor = Object.getOwnPropertyDescriptor(query.view, "kind"), kind = descriptor !== undefined && "value" in descriptor ? descriptor.value : undefined;
  let view: InspectorQueryView;
  if (kind === "inventory") {
    const row = record(query.view, ["kind", "start"], "inventory view");
    view = Object.freeze({ kind, start: ordinal(row.start, "start") });
  } else {
    const fields = kind === "source" ? ["kind", "projection", "context", "start", "collectionKey"]
      : kind === "detail" ? ["kind", "projection", "context", "sourceKey", "scope", "start"] : invalid("unknown Inspector view");
    // Determine only the closed mate association through a data descriptor, never a getter.
    const projectionField = Object.getOwnPropertyDescriptor(query.view, "projection"), projection: unknown = projectionField !== undefined && "value" in projectionField ? projectionField.value : undefined;
    const topic = INSPECTOR_SOURCE_TOPICS.find(row => row.projection === projection);
    if (topic === undefined) return invalid("projection is not an exact accepted acquisition topic");
    const mate = projection === "rules.tactic.consequence.forced_mate_after_move@1" || projection === "rules.tactic.consequence.forced_mate_after_move@2";
    const row = record(query.view, [...fields, ...(kind === "source" && mate ? ["parameters"] : [])], "source/detail view");
    const scope = context(row.context), start = ordinal(row.start, "start");
    if (!topic.contexts.includes(scope.kind) || scope.kind === "comparison" && scope.otherBranchId === branchId) return invalid("projection crosses its declared context");
    if (kind === "source") {
      const collectionKey = row.collectionKey === null ? null : text(row.collectionKey, "collectionKey");
      if (start === 0 ? collectionKey !== null : collectionKey === null) return invalid("continuation must bind its original collection");
      if (mate) {
        const parameters = record(row.parameters, ["kind", "maxAttackerMoves"], "mate parameters");
        if (parameters.kind !== "forced_mate" || ![1, 2, 3, 4].some(horizon => horizon === parameters.maxAttackerMoves)) return invalid("unknown attacker-move horizon");
        view = Object.freeze({ kind, projection, context: scope, start, collectionKey,
          parameters: Object.freeze({ kind: "forced_mate", maxAttackerMoves: parameters.maxAttackerMoves as 1 | 2 | 3 | 4 }) });
      } else view = Object.freeze({ kind, projection: topic.projection as Exclude<InspectorSourceRef, MateRef>, context: scope, start, collectionKey });
    } else {
      const detail = (Object.keys(INSPECTOR_DETAIL_SOURCES) as InspectorDetailKind[]).find(key => INSPECTOR_DETAIL_SOURCES[key] === projection);
      if (detail === undefined) return invalid("source has no accepted detail view");
      let detailScope: InspectorDetailScope;
      try { detailScope = parseInspectorDetailScope(detail, snapshot(row.scope)); }
      catch (error) { return invalid(`detail scope refused: ${(error as Error).message}`); }
      view = Object.freeze({ kind: "detail", projection: INSPECTOR_DETAIL_SOURCES[detail], context: scope,
        sourceKey: text(row.sourceKey, "sourceKey"), scope: Object.freeze(detailScope), start });
    }
  }
  return Object.freeze({ protocol: "inspector.query_page@1", assistance, query: Object.freeze({ branchId, nodeId, decisionDigest, view }) });
}
