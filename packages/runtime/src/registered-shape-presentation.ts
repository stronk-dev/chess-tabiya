// F2 §2.4a: actual registered trigger attribution, not evidence that authored plans are true.
import { assertDeclaredEvidence, evidenceDigest, type DeclaredEvidence } from "./evidence-contract.js";
import type { ComponentValue, PresentedEvidenceRef } from "./presentation-contract.js";
import { PresentationSchemaError, s } from "./presentation-schema.js";

const shape = s.obj({ entryId: s.str, firstNodeId: s.str, lastNodeId: s.str, openEnded: s.bool,
  authority: s.obj({ documentId: s.str, documentVersion: s.str, documentDigest: s.digest, pointer: s.lit("/trigger"),
    name: s.str, channel: s.lit("official", "community"), publisherHandle: s.nullable(s.str) }) });
export const parseRegisteredShapeFiringOperands: typeof shape = (input, label) => {
  const value = shape(input, label);
  if (value.entryId !== value.authority.documentId) throw new PresentationSchemaError(`${label} does not identify its actual registered entry`);
  return value;
};
export function registeredShapeFiringOperands(evidence: DeclaredEvidence<unknown>) {
  assertDeclaredEvidence(evidence);
  if (evidence.projection.id !== "theory.shapes.firing" || evidence.projection.version !== 3) throw new TypeError("Shape attribution requires its exact registered-source successor");
  return parseRegisteredShapeFiringOperands(evidence.payload, "registered shape firing");
}
export function renderRegisteredShapeFiring(value: ReturnType<typeof parseRegisteredShapeFiringOperands>): string {
  const catalogue = value.authority.channel === "official" ? "official catalogue" : "community catalogue";
  const publisher = value.authority.publisherHandle === null ? "publisher not recorded"
    : value.authority.publisherHandle === "deleted account" ? "publisher account deleted"
    : `published by @${value.authority.publisherHandle}`;
  return `Matched authored pattern: “${value.authority.name}” (version ${value.authority.documentVersion}, ${catalogue}; ${publisher}). ${value.openEnded ? "This view ends within the matching interval" : "The matching interval ended before this view's endpoint"}. A trigger match does not validate the entry's plans or recommend a move.`;
}

/** Full retained-payload consistency with the supplied ref; this is not source authentication. */
export function assertRegisteredShapeFiringWire(component: ComponentValue, reference: PresentedEvidenceRef): void {
  if (component.id !== "fact_statement" || component.operand.rendererId !== "inspector.registered_shape_firing@2"
    || component.operand.binding !== "declared_convention" || component.operand.convention !== "shape-catalogue@1"
    || reference.producer.id !== "theory.shapes" || reference.producer.version !== 1
    || reference.projection.id !== "theory.shapes.firing" || reference.projection.version !== 3) throw new TypeError("Registered shape statement crosses its registered renderer/binding/convention/source tuple");
  const value = parseRegisteredShapeFiringOperands(component.operand.operands, "retained registered shape");
  if (`sha256:${evidenceDigest(value)}` !== reference.evidenceDigest) throw new TypeError("Registered shape retained operands disagree with their evidence digest");
}
