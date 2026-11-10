// Permission/current installation stays server-owned; all lookup/factory work stays in runtime.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { collectInspectorOpeningSource, inspectorOpeningScope, readInspectorOpeningCollection, type InspectorOpeningCollection, type InspectorOpeningProjection } from "../../../packages/runtime/src/inspector-opening-source.js";
import { readInstalledOpeningCatalogue, type InstalledOpeningCatalogue, type OpeningCatalogueAvailability } from "../../../packages/runtime/src/opening-catalogue.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { digestRunEventHead } from "../../../packages/runtime/src/run-subject.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

type Installation = Readonly<{ kind: "available"; source: InstalledOpeningCatalogue }>
  | Readonly<{ kind: "unavailable"; reason: "artifact_missing" | "artifact_invalid" | "digest_mismatch" }>;
declare const openingSourceBrand: unique symbol;
export interface InspectorOpeningSource { readonly [openingSourceBrand]: true }
interface OpeningImage {
  readonly context: InspectorRecordedContext;
  readonly projection: InspectorOpeningProjection;
  readonly collection: InspectorOpeningCollection | null;
  readonly sourceKey: string | null;
  readonly installation: Installation;
  readonly outcome: InspectorOpeningCollection["outcome"] | Readonly<{ kind: "unavailable"; reason: "artifact_missing" }>
    | Readonly<{ kind: "failed"; reason: "artifact_invalid" | "digest_mismatch" }>;
}
export class InspectorOpeningSourceOwner {
  readonly #sources = new WeakMap<object, { image: OpeningImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner, readonly readOpening: () => OpeningCatalogueAvailability | undefined) {}

  #installation(): Installation {
    const value = this.readOpening();
    if (value === undefined) return Object.freeze({ kind: "unavailable", reason: "artifact_missing" });
    if (value.kind === "unavailable" && ["artifact_missing", "artifact_invalid", "digest_mismatch"].includes(value.reason)) return Object.freeze({ kind: "unavailable", reason: value.reason });
    if (value.kind !== "available" || readInstalledOpeningCatalogue(value.source) !== value.catalogue) throw new InspectorContextError("source_contract_invalid");
    return Object.freeze({ kind: "available", source: value.source });
  }

  acquire(context: InspectorRecordedContext, projection: InspectorOpeningProjection, signal: AbortSignal): InspectorOpeningSource {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector opening source requires an AbortSignal");
    signal.throwIfAborted(); const scope = inspectorOpeningScope(projection), current = this.contexts.read(context);
    if (current.selection.context.kind !== scope) throw new InspectorContextError("source_contract_invalid");
    const nodeId = current.selection.context.kind === "branch" ? current.selection.context.throughNodeId : current.selected.id;
    const installation = this.#installation();
    let collection: InspectorOpeningCollection | null = null, outcome: OpeningImage["outcome"], sourceKey: string | null = null;
    if (installation.kind === "unavailable") outcome = installation.reason === "artifact_missing" ? Object.freeze({ kind: "unavailable", reason: "artifact_missing" })
      : Object.freeze({ kind: "failed", reason: installation.reason });
    else {
      signal.throwIfAborted();
      collection = collectInspectorOpeningSource(current.run, current.selection.branchId, nodeId, installation.source, projection, signal);
      const original = readInspectorOpeningCollection(collection);
      if (collection.projection !== projection || original.source !== installation.source || original.kind !== scope
        || original.branchId !== current.selection.branchId || original.nodeId !== nodeId
        || canonicalizeJson(original.run) !== canonicalizeJson(current.run)) throw new InspectorContextError("source_contract_invalid");
      outcome = collection.outcome;
      sourceKey = presentationDigest("inspector.source@1", {
        runId: current.run.id, decision: current.decision, selection: current.selection,
        viewer: { learnerId: current.principal.learnerId, role: current.role },
        requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
        projection, catalogue: installation.source.ref,
        sourceScope: { kind: original.kind, branchId: original.branchId, nodeId: original.nodeId,
          eventHead: digestRunEventHead({ runId: original.run.id, headSeq: original.run.events.length, events: original.run.events }) },
        values: collection.values.map(value => evidenceValueReceipt(value)),
      });
    }
    const image = Object.freeze({ context, projection, collection, sourceKey, installation, outcome }), token = Object.freeze({}) as InspectorOpeningSource;
    this.#sources.set(token, { image, signal }); this.read(token); return token;
  }

  read(source: InspectorOpeningSource): OpeningImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context);
    const current = this.#installation(), captured = owned.image.installation;
    if (current.kind !== captured.kind || (current.kind === "available" && captured.kind === "available" ? current.source !== captured.source
      : current.kind === "unavailable" && captured.kind === "unavailable" && current.reason !== captured.reason)) throw new InspectorContextError("stale");
    owned.signal.throwIfAborted(); return owned.image;
  }
}
