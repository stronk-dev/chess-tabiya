import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  PRIMARY_EVIDENCE_MANIFEST,
  assertConsumerEvidenceView,
  evidenceForConsumer,
  evidenceReferenceEvidence,
  presentEvidenceItems,
  presentedSentence,
  PresentationError,
  type EvidencePayload,
  type ConsumerEvidenceView,
  type EvidenceReferenceResolution,
  type EvidenceSentence,
} from "@chess-tabiya/runtime/client";

import type { StagedEvidence } from "./api.js";

export type { EvidenceReferenceResolution, EvidenceSentence } from "@chess-tabiya/runtime/client";
export { evidenceSentenceTable } from "@chess-tabiya/runtime/client";

export function evidencePayloadTable(
  results: readonly StagedEvidence[],
): ReadonlyMap<string, EvidencePayload> {
  const table = new Map<string, EvidencePayload>();
  for (const result of results) {
    for (const reference of result.evidenceRefs) {
      if (table.has(reference)) {
        throw new TypeError(`Evidence reference has more than one payload: ${reference}`);
      }
      table.set(reference, result.payload);
    }
  }
  return table;
}

type EvidenceReferencePayload = EvidenceReferenceResolution | EvidencePayload;

class EvidenceReferenceSourceError extends TypeError {}

/** Presentation failure is UI state, never a replacement chess evidence sentence. */
export type EvidenceReferencePresentation =
  | { readonly kind: "ready"; readonly sentence: EvidenceSentence }
  | { readonly kind: "failed"; readonly reference: string };

export function renderDeclaredEvidenceRef(
  view: ConsumerEvidenceView<EvidenceReferencePayload>,
): EvidenceSentence {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "runtime.evidence_ref" || view.consumer.version !== 1) {
    throw new TypeError("Expected runtime.evidence_ref@1 consumer view");
  }
  const resolution = view.items.find((item) => item.projection.id === "run.record.evidence_ref_resolution")?.payload;
  if (resolution === undefined || !("reference" in resolution)) {
    throw new TypeError("Evidence-reference consumer requires a declared resolution");
  }
  const sources = view.items.filter((item) => item.projection.id !== "run.record.evidence_ref_resolution" && "kind" in item.payload);
  if (sources.length > 1) throw new EvidenceReferenceSourceError("Evidence reference has more than one attached source");
  const attached = sources[0];
  const source = attached?.payload;
  if (attached !== undefined && source !== undefined && "kind" in source) {
    if (attached.projection.id === "human.maia.event" && source.kind === "tablebase") {
      throw new EvidenceReferenceSourceError("Attached fact crosses its declared source kind/reader");
    }
    const label = attached.projection.id === "human.maia.event" ? "Human model"
      : attached.projection.id === "live.syzygy.result" ? "Tablebase" : "Engine";
    if (resolution.sourceLabel !== label) throw new EvidenceReferenceSourceError("Evidence reference source and label disagree");
  }
  // Consume every admitted component, including the attached source's formatter. Reading only
  // the resolution would bypass its source-kind/reader checks and permit false exactness.
  const presented = presentEvidenceItems(view);
  return Object.freeze({
    reference: resolution.reference,
    text: presented.map(presentedSentence).join(" "),
    sourceLabel: resolution.sourceLabel,
    ...(source === undefined || !("kind" in source) ? {} : { payload: source }),
  });
}

/**
 * The web never mints: the runtime `run.record.evidence_ref_resolution@1` factory computes the
 * resolution from the reference, pack and attached payloads, and the attached packet (if any) is
 * sealed under its exact live projection (rfc/evidence-value-authority.md §1).
 */
export function renderEvidenceRef(
  reference: string,
  pack?: DrillPackDefinition,
  payloads: ReadonlyMap<string, EvidencePayload> = new Map(),
): EvidenceSentence {
  return renderDeclaredEvidenceRef(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "runtime.evidence_ref", version: 1 },
    evidenceReferenceEvidence(reference, pack, payloads),
  ));
}

/** Keep known source inconsistencies local to the affected evidence row, not the whole board. */
export function evidenceRefPresentation(
  reference: string,
  pack?: DrillPackDefinition,
  payloads: ReadonlyMap<string, EvidencePayload> = new Map(),
): EvidenceReferencePresentation {
  try {
    return Object.freeze({ kind: "ready", sentence: renderEvidenceRef(reference, pack, payloads) });
  } catch (error) {
    if (!(error instanceof EvidenceReferenceSourceError)
      && !(error instanceof PresentationError && error.code === "PRESENTATION_INVALID")) throw error;
    return Object.freeze({ kind: "failed", reference });
  }
}
