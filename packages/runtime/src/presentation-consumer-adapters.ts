// rfc/evidence-presentation.md §2.3/§8.2 — the pair-keyed presentation adapters for the ordinary,
// Inspector and author/operator consumer populations outside the learner-module seats.
//
// Imports only types from `presentation-contract.ts` (the registry injects its construction kit),
// so the registry has no import cycle.

import type { AdapterSpec, PresentationKit } from "./presentation-contract.js";
import type { FactRendererDefinition } from "./presentation-schema.js";

/**
 * rfc/evidence-presentation.md §3.12: literal structured-document schema ids, each with its role
 * ceiling and closed field list. Author/operator surfaces only; a learner route may not request one.
 */
export const STRUCTURED_DOCUMENT_SCHEMAS = Object.freeze({
  "authoring.claim_binding_record@1": { label: "Claim-binding record", roles: ["author", "operator"], fields: ["claimId", "binding", "sources"] },
  "runtime.source_record@1": { label: "Provider source record", roles: ["author", "operator"], fields: ["producer", "projection", "payload"] },
} as const);

export const CONSUMER_FACT_RENDERERS = Object.freeze({} satisfies Readonly<Record<string, FactRendererDefinition<never>>>);

export function consumerAdapterSpecs(kit: PresentationKit): readonly AdapterSpec[] {
  void kit;
  return Object.freeze([]);
}
