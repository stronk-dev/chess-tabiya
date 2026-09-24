// rfc/evidence-presentation.md Checkpoint B / rfc/module-registration.md A5 — the Full Inspector
// (`module.full_inspector@1`) pair-keyed presentation adapters and their registered fact renderers.
//
// Imports only types from `presentation-contract.ts` (the registry injects its construction kit),
// so the registry has no import cycle.

import type { AdapterSpec, PresentationKit } from "./presentation-contract.js";
import type { FactRendererDefinition } from "./presentation-schema.js";

export const INSPECTOR_FACT_RENDERERS = Object.freeze({} satisfies Readonly<Record<string, FactRendererDefinition<never>>>);

/** Registered magnitude quantity labels keyed by exact source projection (`id@version`). */
export const INSPECTOR_MAGNITUDE_QUANTITIES: Readonly<Record<string, { readonly label: string }>> = Object.freeze({});

export function inspectorAdapterSpecs(kit: PresentationKit): readonly AdapterSpec[] {
  void kit;
  return Object.freeze([]);
}
