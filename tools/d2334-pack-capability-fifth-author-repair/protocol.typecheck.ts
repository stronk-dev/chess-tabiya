type CapabilityVersion =
  | { readonly kind: "integer"; readonly value: number }
  | { readonly kind: "semver"; readonly value: string };
type CapabilityId = { readonly id: string; readonly version: CapabilityVersion };
type CapabilitySubjectKind = "vocabulary_arm" | "verdict_producer" | "projection";
type CapabilityMeaningSource = { readonly kind: "ast"; readonly site: string };
type WithdrawalRefusal = { readonly kind: "no_migration_exists"; readonly reason: string };
type SemanticDisposition =
  | { readonly kind: "active" }
  | { readonly kind: "deprecated"; readonly successor: CapabilityId; readonly reason: string }
  | { readonly kind: "withdrawn"; readonly reason: string; readonly removedAt: string; readonly successor: CapabilityId }
  | { readonly kind: "withdrawn"; readonly reason: string; readonly removedAt: string; readonly successor: null; readonly noSuccessor: WithdrawalRefusal };

interface CapabilityDeclaration {
  readonly subjectId: string;
  readonly id: CapabilityId;
  readonly subject: CapabilitySubjectKind;
  readonly sources: readonly CapabilityMeaningSource[];
  readonly dependsOn: readonly CapabilityId[];
  readonly semanticsDigest: string;
  readonly disposition: SemanticDisposition;
}

const v1 = { id: "example", version: { kind: "integer", value: 1 } } as const;
const v2 = { id: "example", version: { kind: "integer", value: 2 } } as const;
const source = [{ kind: "ast", site: "packages/runtime/src/example.ts#example" }] as const;
const successor = [
  { subjectId: "example", id: v1, subject: "verdict_producer", sources: source, dependsOn: [], semanticsDigest: "sha256:v1", disposition: { kind: "withdrawn", reason: "replaced", removedAt: "2026-08-31", successor: v2 } },
  { subjectId: "example", id: v2, subject: "verdict_producer", sources: source, dependsOn: [], semanticsDigest: "sha256:v2", disposition: { kind: "active" } },
] as const satisfies readonly CapabilityDeclaration[];
const cycle = [
  { subjectId: "example", id: v1, subject: "verdict_producer", sources: source, dependsOn: [], semanticsDigest: "sha256:v1", disposition: { kind: "withdrawn", reason: "cycle", removedAt: "2026-08-31", successor: v2 } },
  { subjectId: "example", id: v2, subject: "verdict_producer", sources: source, dependsOn: [], semanticsDigest: "sha256:v2", disposition: { kind: "withdrawn", reason: "cycle", removedAt: "2026-08-31", successor: v1 } },
] as const satisfies readonly CapabilityDeclaration[];
void [successor, cycle];

// @ts-expect-error declaration version cannot fork into a second top-level authority
void ({ subjectId: "example", id: "example", version: v1.version, subject: "verdict_producer", sources: source, dependsOn: [], semanticsDigest: "sha256:x", disposition: { kind: "active" } } satisfies CapabilityDeclaration);
// @ts-expect-error a withdrawal without successor requires a typed no-successor arm
void ({ subjectId: "example", id: v1, subject: "verdict_producer", sources: source, dependsOn: [], semanticsDigest: "sha256:x", disposition: { kind: "withdrawn", reason: "gone", removedAt: "2026-08-31", successor: null } } satisfies CapabilityDeclaration);

type PublicSemantic =
  | { readonly kind: "active" }
  | { readonly kind: "deprecated"; readonly successor: CapabilityId; readonly reasonCode: "superseded" | "scheduled_withdrawal" };
type PublicReachability =
  | { readonly kind: "supported" }
  | { readonly kind: "temporarily_unavailable"; readonly providerFamily: "opponent" | "analysis" | "corpus" | "tablebase" | "voice" | "tts"; readonly retryAfterMs?: number };
interface PackCapabilityPublicRowV1 { readonly capability: CapabilityId; readonly semanticDisposition: PublicSemantic; readonly reachability: PublicReachability }
void ({ capability: v1, semanticDisposition: { kind: "active" }, reachability: { kind: "supported" } } satisfies PackCapabilityPublicRowV1);
void ({ capability: v1, semanticDisposition: { kind: "deprecated", successor: v2, reasonCode: "superseded" }, reachability: { kind: "temporarily_unavailable", providerFamily: "opponent", retryAfterMs: 100 } } satisfies PackCapabilityPublicRowV1);
// @ts-expect-error semantic and deployment state cannot alias
void ({ capability: v1, semanticDisposition: { kind: "supported" }, reachability: { kind: "active" } } satisfies PackCapabilityPublicRowV1);
// @ts-expect-error public rows cannot leak provider instance diagnostics
void ({ capability: v1, semanticDisposition: { kind: "active" }, reachability: { kind: "temporarily_unavailable", providerFamily: "opponent", providerId: "secret-instance" } } satisfies PackCapabilityPublicRowV1);

type CapabilityOperationId = "pack.register" | "run.create" | "opponent.select" | "run.analysis";
declare function requireCapabilities(input: { readonly operationId: CapabilityOperationId; readonly runId?: string; readonly idempotencyKey?: string }): void;
requireCapabilities({ operationId: "run.analysis", runId: "run-1" });
// @ts-expect-error callers never supply the requirement list
requireCapabilities({ operationId: "run.analysis", runId: "run-1", requiredIds: [v1] });
