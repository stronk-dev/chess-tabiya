import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import {
  PRIMARY_EVIDENCE_MANIFEST,
  RULES_EVIDENCE_FACTS,
  THEORY_EVIDENCE_FACTS,
  assertConsumerEvidenceView,
  declareEvidenceReferenceResolution,
  declareLivePacketEvidence,
  evidenceForConsumer,
  packEvidenceRef,
  packAbsentEvidenceRef,
  rulesEvidenceRef,
  tempoEvidenceRef,
  type EvidencePayload,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
  type RulesEvidenceFact,
  type TheoryEvidenceFact,
} from "@chess-tabiya/runtime";

import type { StagedEvidence } from "./api.js";

export type { EvidenceSentence } from "@chess-tabiya/runtime";
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

export interface EvidenceReferenceResolution {
  readonly reference: string;
  readonly text: string;
  readonly sourceLabel: EvidenceSentence["sourceLabel"];
}

type EvidenceReferencePayload = EvidenceReferenceResolution | EvidencePayload;

function declaredSource(payload: EvidencePayload): DeclaredEvidence<EvidencePayload> {
  return declareLivePacketEvidence(payload);
}

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

export function renderEvidenceRef(
  reference: string,
  pack?: DrillPackDefinition,
  payloads: ReadonlyMap<string, EvidencePayload> = new Map(),
): EvidenceSentence {
  const resolved = resolveEvidenceSentence(reference, pack, payloads);
  const resolution = declareEvidenceReferenceResolution<EvidenceReferencePayload>(Object.freeze({ reference: resolved.reference, text: resolved.text, sourceLabel: resolved.sourceLabel }));
  const declared: DeclaredEvidence<EvidenceReferencePayload>[] = [resolution];
  if (resolved.payload !== undefined) declared.push(declaredSource(resolved.payload));
  return renderDeclaredEvidenceRef(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "runtime.evidence_ref", version: 1 },
    declared,
  ));
}
