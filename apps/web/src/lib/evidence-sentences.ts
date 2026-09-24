import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  PRIMARY_EVIDENCE_MANIFEST,
  assertConsumerEvidenceView,
  evidenceForConsumer,
  evidenceReferenceEvidence,
  type EvidencePayload,
  type ConsumerEvidenceView,
  type EvidenceReferenceResolution,
  type EvidenceSentence,
} from "@chess-tabiya/runtime";

import type { StagedEvidence } from "./api.js";

export type { EvidenceReferenceResolution, EvidenceSentence } from "@chess-tabiya/runtime";
export { evidenceSentenceTable } from "@chess-tabiya/runtime";

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
  const source = view.items.find((item) => item.projection.id !== "run.record.evidence_ref_resolution")?.payload;
  return Object.freeze({
    reference: resolution.reference,
    text: resolution.text,
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
    evidenceReferenceEvidence(reference, pack, payloads) as readonly never[],
  ));
}
