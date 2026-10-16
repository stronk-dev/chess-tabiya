// Application initialization retains the strict stored-declarations/lifecycle join.
// Keep it separate from the pure builder used to generate the next consistent image.
import { GENERATED_CAPABILITY_DECLARATIONS } from "./declarations.generated.js";
import { CAPABILITY_LIFECYCLE } from "./lifecycle.js";
import { buildCapabilityRegistry, type CapabilityRegistry, type CapabilityDeclaration, type CapabilityHistory } from "./registry.js";

export const CAPABILITY_REGISTRY: CapabilityRegistry = buildCapabilityRegistry(GENERATED_CAPABILITY_DECLARATIONS, CAPABILITY_LIFECYCLE);
export const CAPABILITY_DECLARATIONS: readonly CapabilityDeclaration[] = CAPABILITY_REGISTRY.declarations;
export const CAPABILITY_HISTORIES: readonly CapabilityHistory[] = CAPABILITY_REGISTRY.histories;
