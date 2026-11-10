// Accepted Review §7a/module-registration §4.11c: exact recorded source only, never new search.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { openRetryEntry } from "../../../packages/runtime/src/review-branch-state.js";
import { collectRecordedAnalyzeLine, deriveRecordedAnalyzeLineSource, inspectorAnalyzeArm, INSPECTOR_ANALYZE_PROJECTIONS,
  readRecordedAnalyzeDerivedResult, readRecordedAnalyzeLineSource, selectRecordedAnalyzeMetadata,
  type InspectorAnalyzeProjection, type RecordedAnalyzeLineSource, type RecordedAnalyzeMetadata } from "../../../packages/runtime/src/recorded-analyze-line.js";
import { digestRunEventHead } from "../../../packages/runtime/src/run-subject.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

declare const analyzeSourceBrand: unique symbol;
export interface InspectorAnalyzeSource { readonly [analyzeSourceBrand]: true }
type AnalyzeOutcome = ReturnType<typeof readRecordedAnalyzeLineSource>["outcome"]
  | Readonly<{ kind: "missing_context"; reason: "no_incoming_edge" }>
  | Readonly<{ kind: "unavailable"; reason: "analyze_variant_not_selected" }>;
interface AnalyzeImage {
  readonly context: InspectorRecordedContext;
  readonly projection: InspectorAnalyzeProjection;
  readonly metadata: RecordedAnalyzeMetadata | null;
  readonly source: RecordedAnalyzeLineSource | null;
  readonly result: ReturnType<typeof deriveRecordedAnalyzeLineSource> | null;
  readonly values: readonly Extract<ReturnType<typeof deriveRecordedAnalyzeLineSource>, { kind: "available" }>["value"][];
  readonly sourceKey: string;
  readonly outcome: AnalyzeOutcome;
}
export class InspectorAnalyzeSourceOwner {
  readonly #sources = new WeakMap<object, { image: AnalyzeImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner) {}

  #current(context: InspectorRecordedContext) {
    const current = this.contexts.read(context);
    if (current.selection.context.kind !== "incoming_edge") throw new InspectorContextError("source_contract_invalid");
    const path = current.paths[0]!;
    if (path.nodes.length === 2 && openRetryEntry(current.run, current.selection.branchId) === path.nodes[0]!.id) throw new InspectorContextError("withheld");
    return current;
  }

  acquire(context: InspectorRecordedContext, projection: InspectorAnalyzeProjection, signal: AbortSignal): InspectorAnalyzeSource {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector Analyze source requires an AbortSignal");
    signal.throwIfAborted(); const expectedArm = inspectorAnalyzeArm(projection), current = this.#current(context);
    const path = current.paths[0]!;
    let metadata: RecordedAnalyzeMetadata | null = null, source: RecordedAnalyzeLineSource | null = null;
    let result: AnalyzeImage["result"] = null, values: AnalyzeImage["values"] = Object.freeze([]), outcome: AnalyzeOutcome;
    if (path.nodes.length < 2) outcome = Object.freeze({ kind: "missing_context", reason: "no_incoming_edge" });
    else {
      metadata = selectRecordedAnalyzeMetadata(current.run, current.selection.branchId, current.selected.id, signal);
      if (metadata.branchId !== current.selection.branchId || metadata.reviewed.id !== current.selected.id
        || metadata.parent.id !== path.nodes[0]!.id || canonicalizeJson(metadata.run) !== canonicalizeJson(current.run)) throw new InspectorContextError("source_contract_invalid");
      const selectedIndex = INSPECTOR_ANALYZE_PROJECTIONS.findIndex(ref => inspectorAnalyzeArm(ref) === metadata!.sourceArm);
      const requestedIndex = INSPECTOR_ANALYZE_PROJECTIONS.indexOf(projection);
      if (metadata.sourceArm === null || selectedIndex > requestedIndex) outcome = Object.freeze({ kind: "unavailable", reason: "source_absent" });
      else if (metadata.sourceArm !== expectedArm) outcome = Object.freeze({ kind: "unavailable", reason: "analyze_variant_not_selected" });
      else {
        signal.throwIfAborted(); this.#current(context);
        source = collectRecordedAnalyzeLine(current.run, current.selection.branchId, current.selected.id, signal);
        const data = readRecordedAnalyzeLineSource(source);
        if (data.branchId !== current.selection.branchId || data.parent.id !== path.nodes[0]!.id || data.reviewed.id !== current.selected.id
          || data.sourceArm !== expectedArm || data.ordinal !== metadata.ordinal
          || canonicalizeJson(data.event) !== canonicalizeJson(metadata.event)
          || canonicalizeJson(data.run) !== canonicalizeJson(current.run)) throw new InspectorContextError("source_contract_invalid");
        // Source acquisition is not permission: re-read actual storage/grants before target work.
        signal.throwIfAborted(); this.#current(context);
        result = deriveRecordedAnalyzeLineSource(source, projection, signal);
        readRecordedAnalyzeDerivedResult(result, source, projection);
        values = Object.freeze(result.kind === "available" ? [result.value] : []);
        outcome = data.outcome;
      }
    }
    signal.throwIfAborted(); this.#current(context);
    const sourceKey = presentationDigest("inspector.source@1", {
      runId: current.run.id, eventHead: digestRunEventHead({ runId: current.run.id, headSeq: current.run.events.length, events: current.run.events }),
      decision: current.decision, selection: current.selection, viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection, parent: path.nodes.length === 2 ? path.nodes[0] : null, selected: current.selected,
      selectedArm: metadata?.sourceArm ?? null, eventOrdinal: metadata?.ordinal ?? null, originalEvent: metadata?.event ?? null,
      outcome, values: values.map(value => evidenceValueReceipt(value)),
    });
    const image = Object.freeze({ context, projection, metadata, source, result, values, sourceKey, outcome }), token = Object.freeze({}) as InspectorAnalyzeSource;
    this.#sources.set(token, { image, signal }); this.read(token); return token;
  }

  read(source: InspectorAnalyzeSource): AnalyzeImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.#current(owned.image.context);
    if (owned.image.source !== null && owned.image.result !== null) readRecordedAnalyzeDerivedResult(owned.image.result, owned.image.source, owned.image.projection);
    owned.signal.throwIfAborted(); return owned.image;
  }
}
