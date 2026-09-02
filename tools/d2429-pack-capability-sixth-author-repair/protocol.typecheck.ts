type CapabilityOperationId =
  | "pack.register"
  | "run.create.pack" | "run.create.position" | "run.create.imported"
  | "opponent.select" | "run.group_reply" | "run.branch_decidedness" | "run.analysis"
  | "run.simulate" | "run.prediction" | "run.voice" | "run.speech" | "run.reasoning_review"
  | "run.marks.replace" | "run.marks.rescope" | "run.deletion_preview" | "run.delete"
  | "run.distill" | "run.share" | "run.flip" | "run.lease" | "run.reveal" | "run.duplicate"
  | "run.schedule" | "run.grant" | "run.revoke" | "run.group" | "run.move.user"
  | "run.move.opponent_received" | "run.rewind" | "run.fork" | "run.compare"
  | "run.simulate_enter" | "run.reasoning.record" | "run.evidence.apply";

type SessionKind = "pack" | "position" | "imported";
type OperationSource =
  | { readonly kind: "session_create"; readonly sessionKind: SessionKind }
  | { readonly kind: "registered_pack"; readonly phase: "static_admission" }
  | { readonly kind: "registered_pack_operation" }
  | { readonly kind: "fixed_registry" }
  | { readonly kind: "none" };

type Binding = { readonly operationId: CapabilityOperationId; readonly source: OperationSource };
void ({ operationId: "run.create.pack", source: { kind: "session_create", sessionKind: "pack" } } satisfies Binding);
void ({ operationId: "run.create.position", source: { kind: "session_create", sessionKind: "position" } } satisfies Binding);
void ({ operationId: "run.create.imported", source: { kind: "session_create", sessionKind: "imported" } } satisfies Binding);
void ({ operationId: "run.marks.rescope", source: { kind: "none" } } satisfies Binding);
// @ts-expect-error the removed dialect cannot inhabit the generated operation union
void ({ operationId: "marks_rescope", source: { kind: "none" } } satisfies Binding);
// @ts-expect-error session creation must retain an exact source kind
void ({ operationId: "run.create.pack", source: { kind: "session_create" } } satisfies Binding);

type Availability = "local" | "recorded" | "provider" | "build_time";
type PublicRow = {
  readonly capability: { readonly id: string; readonly version: { readonly kind: "integer"; readonly value: number } };
  readonly semanticDisposition: { readonly kind: "active" };
  readonly availability: Availability;
  readonly reachability: { readonly kind: "supported" } | { readonly kind: "temporarily_unavailable"; readonly providerFamily: "analysis" };
};
void ({ capability: { id: "analysis", version: { kind: "integer", value: 1 } }, semanticDisposition: { kind: "active" }, availability: "provider", reachability: { kind: "temporarily_unavailable", providerFamily: "analysis" } } satisfies PublicRow);
// @ts-expect-error public rows cannot omit the availability fact used by semantic validation
void ({ capability: { id: "analysis", version: { kind: "integer", value: 1 } }, semanticDisposition: { kind: "active" }, reachability: { kind: "supported" } } satisfies PublicRow);
// @ts-expect-error provider instance identity is private and absent from the public row
void ({ capability: { id: "analysis", version: { kind: "integer", value: 1 } }, semanticDisposition: { kind: "active" }, availability: "provider", reachability: { kind: "supported" }, providerId: "secret" } satisfies PublicRow);
