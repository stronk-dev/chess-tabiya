// Accepted module-registration §4.11a/F2 §2.3a–b: requested recorded-prefix acquisition, not permission.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { branchPath } from "./branch-path.js";
import { createRecordedPivotalSource, recordedPivotalData, type RecordedPivotalSource, type PivotalKind } from "./pivotal.js";
import { invokeEvidenceValueRoute, readRecordedHumanDivergenceInvocation, readRecordedRulePivotalInvocation, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { digestRunEventHead } from "./run-subject.js";
import type { DrillRun } from "./types.js";

const KINDS = Object.freeze({
  "derived.pivotal.irreversibility@1": "irreversibility",
  "derived.pivotal.phase_change@2": "phase_change",
  "derived.pivotal.human_divergence@2": "human_divergence",
  "derived.pivotal.option_collapse@2": "option_collapse",
} as const satisfies Readonly<Record<string, PivotalKind>>);
export type InspectorPivotalProjection = keyof typeof KINDS;
// Closed supplier refs only, not another consumer/permission/qualification registry.
export const INSPECTOR_PIVOTAL_PROJECTIONS = Object.freeze(Object.keys(KINDS) as InspectorPivotalProjection[]);
export function assertInspectorPivotalProjection(projection: unknown): asserts projection is InspectorPivotalProjection {
  if (typeof projection !== "string" || !Object.hasOwn(KINDS, projection)) throw new TypeError("Unknown exact Inspector pivotal source");
}
export interface InspectorPivotalCollection {
  readonly projection: InspectorPivotalProjection;
  readonly source: RecordedPivotalSource;
  readonly result: EvidenceValueRouteResults[InspectorPivotalProjection];
  readonly proof: ReturnType<typeof readRecordedHumanDivergenceInvocation> | ReturnType<typeof readRecordedRulePivotalInvocation>;
  readonly outcome: Readonly<{ kind: "available"; collected: number }> | Readonly<{ kind: "no_witness" }>
    | Readonly<{ kind: "unavailable"; reason: "source_absent" }>;
}
const COLLECTIONS = new WeakMap<object, ReturnType<typeof recordedPivotalData>>();
/** Original source invocation only; a copied result is not an issued collection. */
export function readInspectorPivotalCollection(collection: InspectorPivotalCollection) {
  const data = collection !== null && typeof collection === "object" ? COLLECTIONS.get(collection) : undefined;
  if (data === undefined) throw new TypeError("Inspector pivotal collection is not its original owned invocation");
  return data;
}
/** The server supplies the unchanged current granted run. This operation grants no access. */
export function collectInspectorPivotalPrefix(run: DrillRun, branchId: string, throughNodeId: string, projection: InspectorPivotalProjection, signal: AbortSignal): InspectorPivotalCollection {
  if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector pivotal source requires an AbortSignal");
  signal.throwIfAborted(); assertInspectorPivotalProjection(projection);
  const kind = KINDS[projection];
  const source = createRecordedPivotalSource({ run, branchId, throughNodeId, kind });
  const data = recordedPivotalData(source, kind), authority = data.authority;
  const original = branchPath(run, branchId), end = original.findIndex(node => node.id === throughNodeId);
  if (end < 0 || authority.branchId !== branchId || authority.throughNodeId !== throughNodeId || authority.runId !== run.id
    || authority.eventHeadDigest !== digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events })
    || canonicalizeJson(authority.path) !== canonicalizeJson(original.slice(0, end + 1))
    || canonicalizeJson(data.run) !== canonicalizeJson(run)) throw new TypeError("Inspector pivotal source crosses its original full-run prefix");
  signal.throwIfAborted();
  let result: InspectorPivotalCollection["result"], proof: InspectorPivotalCollection["proof"], absent = false;
  if (projection === "derived.pivotal.human_divergence@2") {
    const items = invokeEvidenceValueRoute(projection, { recordedPivotal: source });
    const invocation = readRecordedHumanDivergenceInvocation(items, source);
    result = items; proof = invocation;
    absent = invocation.observations.length === 0 || invocation.observations.some(row => row.disposition === "source_absent");
  } else {
    const items = invokeEvidenceValueRoute(projection, { recordedPivotal: source });
    result = items; proof = readRecordedRulePivotalInvocation(items, source);
  }
  const outcome: InspectorPivotalCollection["outcome"] = absent ? Object.freeze({ kind: "unavailable", reason: "source_absent" })
    : result.length === 0 ? Object.freeze({ kind: "no_witness" }) : Object.freeze({ kind: "available", collected: result.length });
  signal.throwIfAborted();
  const collection = Object.freeze({ projection, source, result, proof, outcome });
  COLLECTIONS.set(collection, data);
  return collection;
}
