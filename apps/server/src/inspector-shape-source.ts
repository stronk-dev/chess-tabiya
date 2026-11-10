import { collectCurrentInspectorShapeSource, readCurrentInspectorShapeCollection, type CurrentInspectorShapeCollection } from "../../../packages/runtime/src/inspector-shape-source.js";
import { RegisteredShapeScanUnavailable } from "../../../packages/runtime/src/internal/registered-shape-scan.js";
import { registeredShapeRecordsImage, readRegisteredShapeSource, type RegisteredShapeSource } from "../../../packages/runtime/src/registered-shape-source.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { ShapeRegistry } from "./shape-registry.js";

declare const shapeSourceBrand: unique symbol;
export interface InspectorShapeSource { readonly [shapeSourceBrand]: true }
interface ShapeImage {
  readonly context: InspectorRecordedContext;
  readonly projection: "theory.shapes.firing@3";
  readonly collection: CurrentInspectorShapeCollection | null;
  readonly registered: RegisteredShapeSource | null;
  readonly sourceKey: string;
  readonly outcome: CurrentInspectorShapeCollection["outcome"] | Readonly<{ kind: "unavailable"; reason: "authored_source_absent" | "source_dependency_unavailable" }>;
}
export class InspectorShapeSourceOwner {
  readonly #sources = new WeakMap<object, { image: ShapeImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner, readonly registry: ShapeRegistry | undefined) {}

  async acquire(context: InspectorRecordedContext, signal: AbortSignal): Promise<InspectorShapeSource> {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector shape source requires an AbortSignal");
    signal.throwIfAborted(); const current = this.contexts.read(context);
    if (!["position", "branch"].includes(current.selection.context.kind) || current.paths.length !== 1) throw new InspectorContextError("source_contract_invalid");
    let collection: CurrentInspectorShapeCollection | null = null, registered: RegisteredShapeSource | null = null;
    let unavailableReason: "authored_source_absent" | "source_dependency_unavailable" = "authored_source_absent";
    if (this.registry !== undefined) {
      const path = Object.freeze(current.paths[0]!.nodes.map(node => Object.freeze({ id: node.id, fen: node.fen })));
      const builder = await this.registry.beginCurrentShapeScan(path, signal);
      signal.throwIfAborted(); this.contexts.read(context);
      registered = this.registry.sourceForCurrentShapeScan(builder);
      try {
        for (;;) {
          signal.throwIfAborted(); this.contexts.read(context);
          const next = this.registry.advanceCurrentShapeScan(builder);
          signal.throwIfAborted(); this.contexts.read(context);
          if (next.kind === "complete") {
            this.registry.assertCurrentShapeScan(next.scan);
            collection = collectCurrentInspectorShapeSource(next.scan, signal);
            if (collection.source !== registered || collection.path.length !== path.length
              || collection.path.some((node, index) => node.id !== path[index]!.id || node.fen !== path[index]!.fen)) throw new InspectorContextError("source_contract_invalid");
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 0));
          signal.throwIfAborted(); this.contexts.read(context);
        }
      } catch (error) {
        if (!(error instanceof RegisteredShapeScanUnavailable)) throw error;
        unavailableReason = error.reason;
      }
      this.registry.assertRegisteredTriggersCurrent(registered);
      if (collection !== null) readCurrentInspectorShapeCollection(collection);
    }
    signal.throwIfAborted(); this.contexts.read(context);
    const outcome = collection?.outcome ?? Object.freeze({ kind: "unavailable" as const, reason: unavailableReason });
    const sourceKey = presentationDigest("inspector.source@1", {
      run: current.run, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection: "theory.shapes.firing@3", outcome,
      source: registered === null ? null : { records: registeredShapeRecordsImage(readRegisteredShapeSource(registered)),
        path: current.paths[0]!.nodes.map(({ id, fen }) => ({ id, fen })), inputDigest: collection?.proof.inputDigest ?? null, values: collection?.result.map(evidenceValueReceipt) ?? [] },
    });
    const image = Object.freeze({ context, projection: "theory.shapes.firing@3" as const, collection, registered, sourceKey, outcome });
    const token = Object.freeze({}) as InspectorShapeSource;
    this.#sources.set(token, { image, signal }); this.read(token); return token;
  }
  read(source: InspectorShapeSource): ShapeImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context);
    const collection = owned.image.collection;
    if (owned.image.registered !== null) {
      if (this.registry === undefined) throw new InspectorContextError("source_contract_invalid");
      this.registry.assertRegisteredTriggersCurrent(owned.image.registered);
    }
    if (collection !== null) {
      if (this.registry === undefined) throw new InspectorContextError("source_contract_invalid");
      this.registry.assertCurrentShapeScan(collection.scan); readCurrentInspectorShapeCollection(collection);
    }
    owned.signal.throwIfAborted(); return owned.image;
  }
}
