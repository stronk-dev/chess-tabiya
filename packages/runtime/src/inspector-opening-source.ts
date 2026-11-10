// Accepted installed-opening §3a/module-registration §4.11a: exact installed point/history sources.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertRecordedPositionInvocation, invokeEvidenceValueRoute, readRecordedOpeningPointResult, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { readOpeningHistoryReductionResult } from "./internal/opening-history-reduction-authority.js";
import { collectRecordedOpeningHistory, readRecordedOpeningHistory, type RecordedOpeningHistorySource } from "./recorded-opening-history.js";
import { readInstalledOpeningCatalogue, type InstalledOpeningCatalogue } from "./opening-catalogue.js";
import { assertResolvedRunSubject, digestRunEventHead, resolveRunSubject } from "./run-subject.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { DrillRun } from "./types.js";

export const INSPECTOR_OPENING_PROJECTIONS = Object.freeze(["theory.opening.catalogue_membership@1", "derived.opening.deepest_reached@2"] as const);
export type InspectorOpeningProjection = typeof INSPECTOR_OPENING_PROJECTIONS[number];
export function inspectorOpeningScope(projection: unknown): "position" | "branch" {
  if (projection === "theory.opening.catalogue_membership@1") return "position";
  if (projection === "derived.opening.deepest_reached@2") return "branch";
  throw new TypeError("Unknown exact Inspector opening source");
}
type Outcome = Readonly<{ kind: "available"; collected: number }> | Readonly<{ kind: "no_witness" }>;
interface Common {
  readonly source: InstalledOpeningCatalogue;
  readonly values: readonly DeclaredEvidence<unknown>[];
  readonly outcome: Outcome;
}
export type InspectorOpeningCollection = Common & (
  | Readonly<{ projection: "theory.opening.catalogue_membership@1";
      position: EvidenceValueRouteResults["run.record.position@1"];
      result: Extract<EvidenceValueRouteResults["theory.opening.catalogue_membership@1"], { kind: "available" }>;
      proof: ReturnType<typeof readRecordedOpeningPointResult>; history: null }>
  | Readonly<{ projection: "derived.opening.deepest_reached@2"; position: null;
      result: EvidenceValueRouteResults["derived.opening.deepest_reached@2"];
      proof: ReturnType<typeof readOpeningHistoryReductionResult>; history: RecordedOpeningHistorySource }>
);
interface Scope { readonly run: DrillRun; readonly branchId: string; readonly nodeId: string; readonly source: InstalledOpeningCatalogue; readonly kind: "position" | "branch" }
const COLLECTIONS = new WeakMap<object, Scope>();
export function readInspectorOpeningCollection(collection: InspectorOpeningCollection): Scope {
  const data = collection !== null && typeof collection === "object" ? COLLECTIONS.get(collection) : undefined;
  if (data === undefined) throw new TypeError("Inspector opening collection is not its original owned invocation");
  return data;
}
/** nodeId is the selected point or explicit granted branch endpoint, never the current cursor by default. */
export function collectInspectorOpeningSource(run: DrillRun, branchId: string, nodeId: string, source: InstalledOpeningCatalogue, projection: InspectorOpeningProjection, signal: AbortSignal): InspectorOpeningCollection {
  if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector opening source requires an AbortSignal");
  signal.throwIfAborted(); const kind = inspectorOpeningScope(projection);
  readInstalledOpeningCatalogue(source); // Reject a copied/unadmitted handle before any position/lookup work.
  let collection: InspectorOpeningCollection, original: DrillRun;
  if (projection === "theory.opening.catalogue_membership@1") {
    const eventHeadDigest = digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events });
    const resolved = resolveRunSubject(run, { kind: "run_node", runId: run.id, branchId, nodeId,
      eventHeadDigest });
    assertResolvedRunSubject(resolved);
    if (resolved.subject.kind !== "run_node" || resolved.subject.runId !== run.id
      || resolved.subject.branchId !== branchId || resolved.subject.nodeId !== nodeId
      || resolved.subject.eventHeadDigest !== eventHeadDigest || resolved.headSeq !== run.events.length
      || resolved.subject.fen !== run.nodes.find(node => node.id === nodeId)?.fen
      || canonicalizeJson(resolved.run) !== canonicalizeJson(run)) {
      throw new TypeError("Inspector opening point crosses its requested full-run subject");
    }
    original = resolved.run;
    signal.throwIfAborted();
    const position = invokeEvidenceValueRoute("run.record.position@1", { run: original, nodeId });
    assertRecordedPositionInvocation(position, original, nodeId);
    signal.throwIfAborted();
    const input = { source, position }, result = invokeEvidenceValueRoute(projection, input);
    if (result.kind !== "available") throw new TypeError("Admitted opening membership lookup unexpectedly unavailable");
    const proof = readRecordedOpeningPointResult(result.value, input, projection);
    collection = Object.freeze({ projection, source, position, result, proof, history: null, values: result.value,
      outcome: result.value.length === 0 ? Object.freeze({ kind: "no_witness" }) : Object.freeze({ kind: "available", collected: result.value.length }) });
  } else {
    signal.throwIfAborted();
    const history = collectRecordedOpeningHistory({ source, run, branchId, throughNodeId: nodeId }), data = readRecordedOpeningHistory(history);
    if (data.source !== source || data.authority.branchId !== branchId || data.authority.throughNodeId !== nodeId
      || canonicalizeJson(data.run) !== canonicalizeJson(run)) throw new TypeError("Inspector opening history crosses its installed source/full-run prefix");
    original = data.run;
    signal.throwIfAborted();
    const result = invokeEvidenceValueRoute("derived.opening.deepest_reached@2", { history }), proof = readOpeningHistoryReductionResult(result, history);
    const values = Object.freeze(result.map(item => item.evidence));
    collection = Object.freeze({ projection, source, position: null, result, proof, history, values,
      outcome: values.length === 0 ? Object.freeze({ kind: "no_witness" }) : Object.freeze({ kind: "available", collected: values.length }) });
  }
  signal.throwIfAborted();
  COLLECTIONS.set(collection, Object.freeze({ run: original, branchId, nodeId, source, kind }));
  return collection;
}
