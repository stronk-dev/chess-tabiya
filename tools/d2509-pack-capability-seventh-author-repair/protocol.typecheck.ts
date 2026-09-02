type ProviderOffBehavior = "available" | "honest_empty" | "unavailable";
type SessionKind = "pack" | "position" | "imported";
type Source =
  | { readonly kind: "session_create"; readonly sessionKind: SessionKind }
  | { readonly kind: "registered_pack"; readonly phase: "static_admission" }
  | { readonly kind: "run_session_operation" }
  | { readonly kind: "fixed_registry" }
  | { readonly kind: "none" };
type ConsumerId = "opponent.selection" | "inspector.corpus" | "guidance.voice";
type Binding =
  | { readonly operationId: string; readonly source: { readonly kind: "none" }; readonly consumer?: never; readonly providerOff?: never }
  | { readonly operationId: string; readonly source: Exclude<Source, { readonly kind: "none" }>; readonly consumer: ConsumerId; readonly providerOff?: never };
const providerEffects = {
  "opponent.selection": "unavailable",
  "inspector.corpus": "honest_empty",
  "guidance.voice": "available",
} as const satisfies Record<ConsumerId, ProviderOffBehavior>;

void ({ operationId: "run.corpus", source: { kind: "run_session_operation" }, consumer: "inspector.corpus" } satisfies Binding);
void ({ operationId: "run.move.user", source: { kind: "none" } } satisfies Binding);
void providerEffects;
// @ts-expect-error provider-bound operations must name their compiled consumer
void ({ operationId: "run.corpus", source: { kind: "run_session_operation" } } satisfies Binding);
// @ts-expect-error local operations cannot smuggle a provider consumer
void ({ operationId: "run.move.user", source: { kind: "none" }, consumer: "opponent.selection" } satisfies Binding);
// @ts-expect-error routes cannot carry a copied provider-off policy
void ({ operationId: "run.corpus", source: { kind: "run_session_operation" }, consumer: "inspector.corpus", providerOff: "honest_empty" } satisfies Binding);
