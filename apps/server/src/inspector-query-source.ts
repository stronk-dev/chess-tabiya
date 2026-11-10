// Accepted module-registration §4.11a. Compose the existing source owners; never mint evidence,
// infer availability from catalogue metadata, acquire a whole Inspector or issue an access token.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertDeclaredEvidence, type DeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import { INSPECTOR_SOURCE_TOPICS, type InspectorQueryView, type InspectorSourceStatus } from "../../../packages/runtime/src/inspector-query-contract.js";
import { INSPECTOR_LOCAL_PROJECTIONS, type InspectorLocalProjection } from "../../../packages/runtime/src/inspector-local-source.js";
import { INSPECTOR_DEPENDENT_PROJECTIONS, parseInspectorDependentRequest } from "../../../packages/runtime/src/inspector-dependent-source.js";
import { RECORDED_SEQUENCE_HORIZONS, type RecordedSequenceRoute } from "../../../packages/runtime/src/recorded-sequence-window.js";
import { INSPECTOR_PACKET_PROJECTIONS, type InspectorPacketProjection } from "../../../packages/runtime/src/inspector-packet-source.js";
import { INSPECTOR_PIVOTAL_PROJECTIONS, type InspectorPivotalProjection } from "../../../packages/runtime/src/inspector-pivotal-source.js";
import { INSPECTOR_OPENING_PROJECTIONS, type InspectorOpeningProjection } from "../../../packages/runtime/src/inspector-opening-source.js";
import { INSPECTOR_ANALYZE_PROJECTIONS } from "../../../packages/runtime/src/recorded-analyze-line.js";
import type { RunService } from "./service.js";
import { InspectorContextError, type InspectorRecordedContext } from "./inspector-recorded-context.js";

type View = Exclude<InspectorQueryView, { kind: "inventory" }>;
type Coverage = ReturnType<RunService["readInspectorLedgerSource"]>["recordedCoverage"];
type SourceOutcome = Readonly<{ kind: "available"; collected: number }> | InspectorSourceStatus;

/** Private complete acquisition, before paging/presentation. Original source ordinals are not
 * filtered display indices. Re-reading calls the actual owner again, including async providers'
 * generation checks; this closure is not a new persisted cache or public continuation token. */
export interface InspectorQuerySource {
  read(): Readonly<{
    projection: View["projection"];
    sourceKey: string | null;
    outcome: SourceOutcome;
    recordedCoverage: Coverage;
    occurrences: readonly Readonly<{ sourceOrdinal: number; evidence: DeclaredEvidence<unknown> }>[];
  }>;
}
type Raw = Readonly<{ sourceKey: string | null; outcome: Readonly<{ kind: string; reason?: string; collected?: number; dependency?: string }>;
  recordedCoverage?: Coverage; values: readonly Readonly<{ sourceOrdinal: number; evidence: DeclaredEvidence<unknown> }>[] }>;
const numbered = (values: readonly DeclaredEvidence<unknown>[]) => Object.freeze(values.map((evidence, sourceOrdinal) => Object.freeze({ sourceOrdinal, evidence })));
const invalid = (): never => { throw new InspectorContextError("source_contract_invalid"); };

/** Internal source dispatch only. The complete source-page operation must preflight its actual
 * current71 bindings before calling this; this helper does not establish a Full2 consumer. */
export async function acquireInspectorQuerySource(service: RunService, context: InspectorRecordedContext, view: View, signal: AbortSignal): Promise<InspectorQuerySource> {
  signal.throwIfAborted();
  const topic = INSPECTOR_SOURCE_TOPICS.find(row => row.projection === view.projection);
  const current = service.readInspectorRecordedContext(context);
  if (topic === undefined || !topic.contexts.includes(view.context.kind)
    || canonicalizeJson(view.context) !== canonicalizeJson(current.selection.context)) return invalid();
  const projection = view.projection;
  let read: () => Raw;
  if ((INSPECTOR_LOCAL_PROJECTIONS as readonly string[]).includes(projection)) {
    const source = service.acquireInspectorLocalSource(context, { projection: projection as InspectorLocalProjection, signal });
    read = () => { const data = service.readInspectorLocalSource(source); return { ...data, values: numbered(data.values) }; };
  } else if ((INSPECTOR_DEPENDENT_PROJECTIONS as readonly string[]).includes(projection)) {
    const request = parseInspectorDependentRequest({ projection, ...("parameters" in view ? { parameters: view.parameters } : {}) });
    const source = service.acquireInspectorDependentSource(context, request, signal);
    read = () => { const data = service.readInspectorDependentSource(source); return { ...data, values: numbered(data.collection?.values ?? []) }; };
  } else if (Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, projection)) {
    const source = service.acquireInspectorWindowSource(context, projection as RecordedSequenceRoute, signal);
    read = () => { const data = service.readInspectorWindowSource(source); return { ...data,
      values: numbered(data.result.kind === "window_available" ? data.result.events.map(row => row.evidence) : []) }; };
  } else if ((INSPECTOR_PACKET_PROJECTIONS as readonly string[]).includes(projection)) {
    const source = service.acquireInspectorPacketSource(context, projection as InspectorPacketProjection, signal);
    read = () => { const data = service.readInspectorPacketSource(source); return { ...data,
      values: data.collection.occurrences.map(row => ({ sourceOrdinal: row.ordinal, evidence: row.value })) }; };
  } else if ((INSPECTOR_PIVOTAL_PROJECTIONS as readonly string[]).includes(projection)) {
    const source = service.acquireInspectorPivotalSource(context, projection as InspectorPivotalProjection, signal);
    read = () => { const data = service.readInspectorPivotalSource(source); return { ...data, values: numbered(data.result.map(row => row.evidence)) }; };
  } else if ((INSPECTOR_OPENING_PROJECTIONS as readonly string[]).includes(projection)) {
    const source = service.acquireInspectorOpeningSource(context, projection as InspectorOpeningProjection, signal);
    read = () => { const data = service.readInspectorOpeningSource(source); return { ...data, values: numbered(data.collection?.values ?? []) }; };
  } else switch (projection) {
    case "derived.review.analysis_typed_pv@1": case "derived.review.analysis_recorded_pv@1": case "derived.review.analysis_recorded_first@1": {
      const source = service.acquireInspectorAnalyzeSource(context, projection, signal);
      read = () => { const data = service.readInspectorAnalyzeSource(source); return { ...data,
        values: data.values.map(evidence => ({ sourceOrdinal: data.metadata!.ordinal!, evidence })) }; };
      break;
    }
    case "recorded.engine.eval@1": case "recorded.tablebase.result@1": {
      const source = service.acquireInspectorLedgerSource(context, { projection, signal });
      read = () => { const data = service.readInspectorLedgerSource(source); return { ...data,
        values: data.population?.records.flatMap(row => row.invocation.result.kind === "available"
          ? [{ sourceOrdinal: row.ordinal, evidence: row.invocation.result.value }] : []) ?? [] }; };
      break;
    }
    case "derived.maia.node_distribution@1": case "derived.maia.node_candidate_wdl@1": {
      const source = await service.acquireInspectorMaiaSource(context, projection, signal);
      read = () => { const data = service.readInspectorMaiaSource(source); return { ...data, values: numbered(data.values) }; };
      break;
    }
    case "derived.explorer.inspector_population@1": {
      const source = await service.acquireInspectorExplorerSource(context, signal);
      read = () => { const data = service.readInspectorExplorerSource(source); return { ...data, values: numbered(data.result === null ? [] : [data.result]) }; };
      break;
    }
    case "derived.compare.structure_delta@2": case "derived.compare.eval_delta@2": {
      const source = service.acquireInspectorComparisonSource(context, projection, signal);
      read = () => { const data = service.readInspectorComparisonSource(source); return { ...data, values: numbered(data.collection.result.map(row => row.evidence)) }; };
      break;
    }
    case "derived.story.rank@3": {
      const source = service.acquireInspectorStorySource(context, signal);
      read = () => { const data = service.readInspectorStorySource(source); return { ...data, values: numbered([data.collection.result]) }; };
      break;
    }
    case "theory.shapes.firing@3": {
      const source = await service.acquireInspectorShapeSource(context, signal);
      read = () => { const data = service.readInspectorShapeSource(source); return { ...data, values: numbered(data.collection?.result ?? []) }; };
      break;
    }
    default: return invalid();
  }
  const source: InspectorQuerySource = Object.freeze({ read: () => {
    signal.throwIfAborted(); service.readInspectorRecordedContext(context);
    const data = read(); // real source currentness, never the captured raw source object alone
    const occurrences = Object.freeze(data.values.map(row => {
      assertDeclaredEvidence(row.evidence);
      if (!Number.isSafeInteger(row.sourceOrdinal) || row.sourceOrdinal < 0
        || `${row.evidence.projection.id}@${row.evidence.projection.version}` !== projection) return invalid();
      return Object.freeze({ ...row });
    }));
    if (new Set(occurrences.map(row => row.sourceOrdinal)).size !== occurrences.length) return invalid();
    const outcome = normalizeOutcome(projection, data.outcome);
    if (outcome.kind === "available" ? outcome.collected !== occurrences.length || occurrences.length === 0
      : outcome.kind !== "unavailable" && occurrences.length !== 0) return invalid();
    // A human-divergence source may retain valid items beside an unavailable population; retain
    // privately but the operation must never serialize those items as an available source page.
    if ((outcome.kind === "available" || outcome.kind === "no_witness") && data.sourceKey === null) return invalid();
    signal.throwIfAborted(); service.readInspectorRecordedContext(context);
    return Object.freeze({ projection, sourceKey: data.sourceKey, outcome, recordedCoverage: data.recordedCoverage ?? null, occurrences });
  } });
  source.read();
  return source;
}

function normalizeOutcome(projection: string, raw: Raw["outcome"]): SourceOutcome {
  if (raw.kind === "available" && Number.isSafeInteger(raw.collected) && raw.collected! > 0) return Object.freeze({ kind: raw.kind, collected: raw.collected! });
  if (raw.kind === "no_witness") return Object.freeze({ kind: raw.kind });
  if (raw.kind === "missing_context" && ["no_incoming_edge", "no_recorded_window", "no_second_attempt", "no_recorded_review"].includes(raw.reason!)) return Object.freeze({ kind: raw.kind, reason: raw.reason }) as SourceOutcome;
  if (raw.kind === "unavailable") {
    if (raw.reason === "analyze_variant_not_selected") {
      if (!(INSPECTOR_ANALYZE_PROJECTIONS as readonly string[]).includes(projection)) return invalid();
      return Object.freeze({ kind: raw.kind, reason: raw.reason });
    }
    // None of the current65 actual source owners issues a version hold. A dependency in
    // metadata (or an arbitrary returned slug) cannot establish one. A future real held arm
    // must join its exact owner here before this wire alternative can be emitted.
    if (raw.reason === "source_version_held") return invalid();
    if (["source_absent", "provider_unavailable", "authored_source_absent", "source_dependency_unavailable", "invalid_turn_clone", "no_legal_recapture", "recorded_measurement_unavailable", "artifact_missing"].includes(raw.reason!)) {
      if (raw.reason === "source_dependency_unavailable" && projection !== "theory.shapes.firing@3"
        || raw.reason === "no_legal_recapture" && projection !== "rules.tactic.predicate.overload_conflict@1"
        || raw.reason === "recorded_measurement_unavailable" && !["recorded.engine.eval@1", "recorded.tablebase.result@1"].includes(projection)
        || raw.reason === "artifact_missing" && !(INSPECTOR_OPENING_PROJECTIONS as readonly string[]).includes(projection)) return invalid();
      return Object.freeze({ kind: raw.kind, reason: raw.reason }) as SourceOutcome;
    }
  }
  if (raw.kind === "failed" && ["source_contract_invalid", "provider_failed", "source_lookup_failed", "artifact_invalid", "digest_mismatch"].includes(raw.reason!)) {
    if (["artifact_invalid", "digest_mismatch"].includes(raw.reason!) && !(INSPECTOR_OPENING_PROJECTIONS as readonly string[]).includes(projection)) return invalid();
    return Object.freeze({ kind: raw.kind, reason: raw.reason }) as SourceOutcome;
  }
  // In particular, a bounded-search budget exhaustion is not source absence or a no-witness.
  return invalid();
}
