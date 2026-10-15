// DISPOSABLE D3847 mint-input observation. Injected only by the opt-in Vitest research config.
// Capture exact source refs AFTER a successful unchanged mint. No payloads, digests or mutations.
import type { DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";

interface MintObservation {
  readonly route: string;
  /** null means an external raw digest, never an inferred evidence identity. */
  readonly inputs: readonly (string | null)[];
}
const observations: MintObservation[] = [];
export function observeSuccessfulMint(route: string, sources: readonly (DeclaredEvidence<unknown> | string)[]): void {
  observations.push(Object.freeze({ route, inputs: Object.freeze(sources.map(source => typeof source === "string"
    ? null : `${source.projection.id}@${source.projection.version}`)) }));
}
export function observedMintInputs(): readonly MintObservation[] {
  return Object.freeze([...observations]);
}
