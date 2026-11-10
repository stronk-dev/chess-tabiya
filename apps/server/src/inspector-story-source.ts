// Current permission, actual storage/import and captured source currentness stay server-owned.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { collectInspectorStorySource, readInspectorStoryCollection, type InspectorStoryCollection } from "../../../packages/runtime/src/inspector-story-source.js";
import { createRecordedReviewBoundarySourceOwner, readRecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import type { ReviewSourceContext } from "../../../packages/runtime/src/review-evidence.js";
import type { ShapeRegistry, ShapeRecord } from "./shape-registry.js";
import type { RunStorage } from "./storage.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

declare const storySourceBrand: unique symbol;
export interface InspectorStorySource { readonly [storySourceBrand]: true }
interface StoryImage {
  readonly context: InspectorRecordedContext;
  readonly collection: InspectorStoryCollection;
  readonly projection: "derived.story.rank@3";
  readonly sourceKey: string;
  readonly outcome: InspectorStoryCollection["outcome"];
}
interface Captured {
  readonly records: readonly ShapeRecord[];
  readonly engine: ReviewSourceContext["engine"];
  readonly image: string;
}
export class InspectorStorySourceOwner {
  readonly #sources = new WeakMap<object, { image: StoryImage; signal: AbortSignal; captured: Captured }>();
  readonly #boundaries: ReturnType<typeof createRecordedReviewBoundarySourceOwner>;
  constructor(readonly contexts: InspectorRecordedContextOwner, storage: RunStorage,
    readonly shapes: ShapeRegistry | undefined,
    readonly observeEngine: (runId: string, branchId: string, throughNodeId: string) => ReviewSourceContext["engine"]) {
    this.#boundaries = createRecordedReviewBoundarySourceOwner({ loadRun: id => storage.read(id)?.run,
      loadImportRecord: id => { const record = storage.importedGame?.(id); return record === undefined ? undefined
        : { runId: record.runId, result: record.result, movetextDigest: record.movetextDigest }; } });
  }

  #capture(context: InspectorRecordedContext): Captured {
    const current = this.contexts.read(context), observed = this.observeEngine(current.run.id, current.selection.branchId, current.paths[0]!.throughNodeId);
    const engine = new Map(current.paths[0]!.nodes.flatMap(node => observed.has(node.id) ? [[node.id, observed.get(node.id)!] as const] : []));
    const records = Object.freeze(this.shapes?.list().map(summary => this.shapes!.required(summary.id)) ?? []);
    const image = canonicalizeJson({ records: records.map(record => ({ digest: record.digest, document: record.document, channel: record.channel,
      publisherHandle: record.publisherHandle ?? null })), engine: [...engine].map(([nodeId, state]) => ({ nodeId, state: state.kind !== "delivered" ? state
        : { kind: state.kind, delivery: { producer: state.delivery.producer, projection: state.delivery.projection,
          payload: state.delivery.payload, receipt: evidenceValueReceipt(state.delivery) } } })) });
    return Object.freeze({ records, engine, image });
  }

  #assertCurrent(context: InspectorRecordedContext, captured: Captured, signal: AbortSignal): void {
    signal.throwIfAborted(); const now = this.#capture(context); signal.throwIfAborted();
    if (now.image !== captured.image || now.records.length !== captured.records.length
      || now.records.some((record, index) => record !== captured.records[index])) throw new InspectorContextError("stale");
  }

  acquire(context: InspectorRecordedContext, signal: AbortSignal): InspectorStorySource {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector Story source requires an AbortSignal");
    signal.throwIfAborted(); const current = this.contexts.read(context);
    if (current.selection.context.kind !== "recorded_review" || current.paths.length !== 1) throw new InspectorContextError("source_contract_invalid");
    const boundary = this.#boundaries.resolve({ runId: current.run.id, branchId: current.selection.branchId, throughNodeId: current.selection.context.throughNodeId });
    this.#boundaries.assertCurrent(boundary); signal.throwIfAborted();
    const original = readRecordedReviewBoundary(boundary);
    if (canonicalizeJson(original.run) !== canonicalizeJson(current.run)
      || canonicalizeJson(original.path.map(entry => entry.node)) !== canonicalizeJson(current.paths[0]!.nodes)) throw new InspectorContextError("source_contract_invalid");
    const captured = this.#capture(context); this.#assertCurrent(context, captured, signal);
    const collection = collectInspectorStorySource(boundary, { engine: captured.engine,
      shapes: Object.freeze(captured.records.map(record => Object.freeze({ id: record.document.id, trigger: record.document.trigger }))) }, signal);
    if (readInspectorStoryCollection(collection) !== original || collection.boundary !== boundary) throw new InspectorContextError("source_contract_invalid");
    this.#assertCurrent(context, captured, signal); this.#boundaries.assertCurrent(boundary);
    const sourceKey = presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection: collection.projection, boundary: original, captured: captured.image,
      sourceImage: collection.proof.reduction.sourceImageDigest, value: evidenceValueReceipt(collection.result),
    });
    const image = Object.freeze({ context, collection, projection: collection.projection, sourceKey, outcome: collection.outcome }), token = Object.freeze({}) as InspectorStorySource;
    this.#sources.set(token, { image, captured, signal }); this.read(token); return token;
  }

  read(source: InspectorStorySource): StoryImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    this.#assertCurrent(owned.image.context, owned.captured, owned.signal);
    this.#boundaries.assertCurrent(owned.image.collection.boundary);
    readInspectorStoryCollection(owned.image.collection); owned.signal.throwIfAborted(); return owned.image;
  }
}
