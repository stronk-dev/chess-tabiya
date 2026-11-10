// Accepted module-registration §4.11a: complete source pages, never ordinary module reduction.
// The sole current Full2 catalogue must provide every exact current source/view binding. A partial,
// filtered, old-version or mismatched callable image refuses before any source acquisition.
import { PRIMARY_EVIDENCE_MANIFEST, MODULE_CURRENT_IMAGE } from "../../../packages/runtime/src/evidence-catalog.js";
import { compileEvidenceConsumerExecutionV2 } from "../../../packages/runtime/src/evidence-binding-execution.js";
import { evidenceForConsumer, evidenceValueReceipt, type DeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import { INSPECTOR_SOURCE_TOPICS, InspectorQueryError, type InspectorQueryRequest, type InspectorQueryPage,
  type InspectorPageBody, type InspectorDisclosureReceipt, type InspectorDetailRef, type InspectorSourceOutcome } from "../../../packages/runtime/src/inspector-query-contract.js";
import { INSPECTOR_DETAIL_SOURCES, InspectorDetailLimitError } from "../../../packages/runtime/src/inspector-detail.js";
import { collectInspectorDetailSource } from "../../../packages/runtime/src/inspector-detail-source.js";
import { fitInspectorSourceOccurrences } from "../../../packages/runtime/src/module-query.js";
import { presentationAdapter, presentEvidenceItems, serializePresentedEvidence, presentationDigest,
  type PresentedEvidenceItem } from "../../../packages/runtime/src/presentation-contract.js";
import type { ExplorerInspectorPopulation } from "../../../packages/runtime/src/explorer-summary.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import { InspectorContextError } from "./inspector-recorded-context.js";
import type { RunService } from "./service.js";
import { ServerError } from "./errors.js";

const CONSUMER = Object.freeze({ id: "module.full_inspector", version: 2 });
const key = (ref: { readonly id: string; readonly version: number }) => `${ref.id}@${ref.version}`;
const detailFor = (projection: string): InspectorDetailRef | null => {
  const row = Object.entries(INSPECTOR_DETAIL_SOURCES).find(([, source]) => source === projection);
  return row === undefined ? null : `derived.inspector.detail.${row[0]}@1` as InspectorDetailRef;
};

/** No narrowed/rebased manifest, adapter fallback, partial source image or provider lookup. */
export function assertInspectorSourcePagePreflight(): void {
  const current = MODULE_CURRENT_IMAGE.find(row => row.moduleId === "full_inspector");
  if (current === undefined || key(current.consumer) !== key(CONSUMER)
    || String(current.implementation) !== "compileInspectorSourcePage") throw new InspectorQueryError("Full Inspector source-page version is not installed", "unsupported_version");
  const expectedRefs = [...INSPECTOR_SOURCE_TOPICS.map(row => row.projection),
    ...Object.keys(INSPECTOR_DETAIL_SOURCES).map(kind => `derived.inspector.detail.${kind}@1`)];
  const expected = new Set<string>(expectedRefs);
  const compiled = compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, CONSUMER);
  const actual = new Set(compiled.bindings.map(row => key(row.binding.projection)));
  if (expected.size !== expectedRefs.length || compiled.bindings.length !== expectedRefs.length || actual.size !== expected.size || [...actual].some(ref => !expected.has(ref))) throw new TypeError("Inspector source-page bindings are not the complete accepted image");
  for (const binding of compiled.bindings) {
    if (binding.sourceAbsence?.necessity !== "required" || binding.sourceAbsence.whenNoPath !== "operation_unavailable") throw new TypeError("Inspector source-page requires the exact source-absence policy on every binding");
    if (presentationAdapter(CONSUMER, binding.binding.projection) === undefined) throw new TypeError("Inspector source-page lacks an exact registered presentation adapter");
  }
}

function sourceFailure(error: unknown): "source_contract_invalid" | "provider_failed" | null {
  if (error instanceof InspectorQueryError) return null; // cursor/request defects are not source failures
  if (error instanceof InspectorContextError) return error.reason === "source_contract_invalid" ? error.reason : null;
  if (error instanceof ServerError && (error.code === "ENGINE_UNAVAILABLE" || error.code === "PROVIDER_UNAVAILABLE")) return "provider_failed";
  return error instanceof TypeError ? "source_contract_invalid" : null;
}

/** RunService supplies its real current grant and original immutable parsed request. No caller
 * payload or source-key alone can create a fact, source grant or a sealed presentation item. */
export async function compileInspectorSourcePage(service: RunService, context: InspectorRecordedContext,
  request: InspectorQueryRequest, signal: AbortSignal): Promise<InspectorQueryPage> {
  signal.throwIfAborted();
  const current = service.readInspectorRecordedContext(context);
  const selection = request.query, view = selection.view;
  if (current.selection.branchId !== selection.branchId || current.selected.id !== selection.nodeId
    || current.decision.digest !== selection.decisionDigest) throw new InspectorContextError("stale");
  assertInspectorSourcePagePreflight(); // even inventory requires the complete actual binding image
  let body: InspectorPageBody;
  let range: InspectorDisclosureReceipt["range"] = null, collectionKey: string | null = null;
  let sourceKeys: readonly string[] = [], sourceOrdinals: readonly number[] = [], detailProjection: InspectorDetailRef | null = null;
  let items: readonly PresentedEvidenceItem[] = [];
  let recheck = () => { signal.throwIfAborted(); service.readInspectorRecordedContext(context); };
  if (view.kind === "inventory") {
    if (view.start >= INSPECTOR_SOURCE_TOPICS.length) throw new InspectorQueryError("inventory cursor is outside its complete source image");
    const topics = INSPECTOR_SOURCE_TOPICS.slice(view.start, view.start + 8).map(row => ({ projection: row.projection, family: row.family, state: "not_requested" as const }));
    range = { start: view.start, count: topics.length, total: INSPECTOR_SOURCE_TOPICS.length,
      next: view.start + topics.length === INSPECTOR_SOURCE_TOPICS.length ? null : view.start + topics.length };
    body = { kind: "inventory", range, topics };
  } else {
    try {
    const source = await service.acquireInspectorQuerySource(context, view, signal);
    recheck = () => { signal.throwIfAborted(); service.readInspectorRecordedContext(context); source.read(); signal.throwIfAborted(); };
    const data = source.read();
    const occurrenceKeys = data.occurrences.map(row => presentationDigest("inspector.source_occurrence@1", {
      sourceKey: data.sourceKey, sourceOrdinal: row.sourceOrdinal, evidence: evidenceValueReceipt(row.evidence),
    }));
    if (view.kind === "detail") {
      if (data.outcome.kind !== "available") throw new InspectorContextError("stale");
      const index = occurrenceKeys.indexOf(view.sourceKey), occurrence = data.occurrences[index];
      if (occurrence === undefined) throw new InspectorContextError("stale");
      detailProjection = detailFor(view.projection);
      if (detailProjection === null) throw new InspectorQueryError("source has no detail door");
      sourceKeys = [view.sourceKey];
      try {
        const evidence = collectInspectorDetailSource(occurrence.evidence, detailProjection, view.scope, view.start);
        const payload = evidence.payload;
        items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CONSUMER, [evidence]));
        range = payload.range; sourceOrdinals = payload.members.map(row => row.sourceOrdinal);
        body = { kind: "detail", projection: view.projection, context: view.context, sourceKey: view.sourceKey, scope: view.scope,
          range, fullSourceTotal: payload.fullSourceTotal, sourceOrdinals, presentation: serializePresentedEvidence(items) };
      } catch (error) {
        if (!(error instanceof InspectorDetailLimitError)) throw error;
        sourceOrdinals = [error.sourceOrdinal];
        body = { kind: "detail_limited", projection: view.projection, context: view.context, sourceKey: view.sourceKey, scope: view.scope,
          ordinal: error.ordinal, sourceOrdinal: error.sourceOrdinal, selectedTotal: error.selectedTotal,
          fullSourceTotal: error.fullSourceTotal, exceeded: error.exceeded };
      }
    } else {
      let outcome: InspectorSourceOutcome;
      if (data.outcome.kind !== "available") {
        if (view.start !== 0 || view.collectionKey !== null) throw new InspectorContextError("stale");
        outcome = data.outcome;
      } else if (view.projection === "derived.explorer.inspector_population@1"
        && (data.occurrences[0]!.evidence.payload as ExplorerInspectorPopulation).totals.total < 100) {
        if (view.start !== 0 || view.collectionKey !== null) throw new InspectorContextError("stale");
        const payload = data.occurrences[0]!.evidence.payload as ExplorerInspectorPopulation;
        outcome = { kind: "below_floor", sourceKey: data.sourceKey!, total: payload.totals.total,
          population: { ratingBuckets: payload.request.ratingBuckets, speeds: payload.request.speeds, since: payload.request.since, until: payload.request.until } };
      } else {
        collectionKey = presentationDigest("inspector.source_collection@1", { sourceKey: data.sourceKey,
          recordedCoverage: data.recordedCoverage, occurrences: occurrenceKeys });
        if (view.start !== 0 && view.collectionKey !== collectionKey) throw new InspectorContextError("stale");
        // Admit the complete collection with the complete current consumer, never a filtered image
        // or generic reducer/novelty pass. Original equal-valued occurrences do not coalesce.
        const admitted = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CONSUMER, data.occurrences.map(row => row.evidence));
        if (admitted.items.length !== data.occurrences.length) throw new TypeError("Inspector source lost an admitted original occurrence");
        const bundles = admitted.items.map(evidence => presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CONSUMER, [evidence])));
        let fit: ReturnType<typeof fitInspectorSourceOccurrences>;
        try { fit = fitInspectorSourceOccurrences(bundles, view.start); }
        catch (error) { if (error instanceof TypeError && (view.start >= bundles.length || view.start < 0)) throw new InspectorQueryError("source cursor is outside its complete collection"); throw error; }
        range = fit.range;
        sourceKeys = fit.occurrences.map(row => occurrenceKeys[row.ordinal]!);
        sourceOrdinals = fit.occurrences.map(row => data.occurrences[row.ordinal]!.sourceOrdinal);
        items = fit.occurrences.flatMap(row => row.kind === "presented" ? row.items : []);
        const displayed = fit.occurrences.filter(row => row.kind === "presented").length;
        outcome = { kind: "available", collectionKey, range, collected: data.occurrences.length, displayed,
          deferred: range.count - displayed, facts: fit.occurrences.map(row => ({ sourceKey: occurrenceKeys[row.ordinal]!,
            disposition: row.kind, exceeded: row.kind === "presented" ? [] : row.exceeded, detail: detailFor(view.projection) })),
          presentation: serializePresentedEvidence(items) };
      }
      body = { kind: "source", projection: view.projection, context: view.context,
        ...("parameters" in view ? { parameters: view.parameters } : {}), outcome, recordedCoverage: data.recordedCoverage } as InspectorPageBody;
    }
    } catch (error) {
      const reason = signal.aborted ? null : sourceFailure(error);
      if (view.kind !== "source" || reason === null) throw error;
      if (view.start !== 0 || view.collectionKey !== null) throw new InspectorContextError("stale");
      // Broken source/renderer execution is a failed source, never an invalid request, an
      // empty chess result or a provider-absence guess. No half-built page survives.
      range = null; collectionKey = null; sourceKeys = []; sourceOrdinals = []; detailProjection = null; items = [];
      body = { kind: "source", projection: view.projection, context: view.context,
        ...("parameters" in view ? { parameters: view.parameters } : {}), outcome: { kind: "failed", reason }, recordedCoverage: null } as InspectorPageBody;
      const readOwner = recheck;
      recheck = () => {
        signal.throwIfAborted(); service.readInspectorRecordedContext(context);
        // Still invoke the actual retained owner. Only the same already-reported local
        // failure can accompany a fact-free failed response; stale/access/cancel never can.
        try { readOwner(); }
        catch (currentError) { if (signal.aborted || sourceFailure(currentError) !== reason) throw currentError; }
        service.readInspectorRecordedContext(context); signal.throwIfAborted();
      };
    }
  }
  recheck();
  const receipt: Omit<InspectorDisclosureReceipt, "digest"> = {
    protocol: "inspector.disclosure_receipt@1", runId: current.run.id, branchId: selection.branchId, nodeId: selection.nodeId,
    decisionDigest: current.decision.digest, requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
    view, range, collectionKey, sourceKeys, sourceOrdinals, detailProjection, componentDigests: items.map(item => item.componentDigest),
    sourceOutcome: body.kind !== "source" ? null : body.outcome.kind === "available" ? { kind: "available" } : body.outcome,
    recordedCoverage: body.kind === "source" ? body.recordedCoverage : null,
  };
  recheck();
  return Object.freeze({ protocol: "inspector.query_page@1", kind: "page", runId: current.run.id,
    branchId: selection.branchId, nodeId: selection.nodeId, decision: current.decision,
    requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
    disclosure: Object.freeze({ ...receipt, digest: presentationDigest("inspector.disclosure_receipt@1", receipt) }), body });
}
