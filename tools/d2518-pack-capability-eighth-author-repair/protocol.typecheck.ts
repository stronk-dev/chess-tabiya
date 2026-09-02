type ProviderOffBehavior = "available" | "honest_empty" | "unavailable";
type EvidenceJobOrigin =
  | { readonly kind: "explicit_analysis"; readonly consumer: "runtime.analysis" }
  | { readonly kind: "story_completion"; readonly consumer: "review.story_evidence" }
  | { readonly kind: "run_enrichment"; readonly consumer: "runtime.background_evidence" };
type EvidenceProviderOperation = "evidence.stockfish_analysis" | "evidence.tablebase_probe";
type ProviderFailure = Readonly<{ reason: string; retryAfterMs: number | null }>;
type ProviderReceipt = Readonly<{ operationId: EvidenceProviderOperation; generation: string }>;
type EvidenceJobSettlement =
  | { readonly state: "settled_success"; readonly payload: unknown; readonly receipt: ProviderReceipt; readonly failure?: never }
  | { readonly state: "settled_empty"; readonly reason: "capability_not_configured" | "not_applicable"; readonly failure?: never; readonly payload?: never; readonly receipt?: never }
  | { readonly state: "settled_empty"; readonly reason: "provider_unavailable"; readonly failure: ProviderFailure; readonly payload?: never; readonly receipt?: never }
  | { readonly state: "settled_unavailable"; readonly failure: ProviderFailure; readonly payload?: never; readonly receipt?: never }
  | { readonly state: "cancelled"; readonly reason: "caller" | "superseded"; readonly payload?: never; readonly receipt?: never; readonly failure?: never };
type EvidenceJobActive =
  | { readonly state: "admitted" }
  | { readonly state: "running"; readonly leaseOwner: string; readonly leaseExpiresAt: string }
  | { readonly state: "retry_wait"; readonly failure: ProviderFailure; readonly nextAttemptAt: string };
type EvidenceJobState = EvidenceJobActive | EvidenceJobSettlement | { readonly state: "consumed"; readonly settled: Extract<EvidenceJobSettlement, { state: "settled_success" }> };

const providerOff = {
  "runtime.analysis": "unavailable",
  "review.story_evidence": "honest_empty",
  "runtime.background_evidence": "honest_empty",
} as const satisfies Record<EvidenceJobOrigin["consumer"], ProviderOffBehavior>;

void ({ kind: "explicit_analysis", consumer: "runtime.analysis" } satisfies EvidenceJobOrigin);
void ({ state: "settled_success", payload: {}, receipt: { operationId: "evidence.stockfish_analysis", generation: "g1" } } satisfies EvidenceJobState);
void ({ state: "settled_empty", reason: "provider_unavailable", failure: { reason: "timeout", retryAfterMs: 1000 } } satisfies EvidenceJobState);
void providerOff;
// @ts-expect-error a successful settlement cannot also carry provider failure
void ({ state: "settled_success", payload: {}, receipt: { operationId: "evidence.stockfish_analysis", generation: "g1" }, failure: { reason: "timeout", retryAfterMs: 1000 } } satisfies EvidenceJobState);
// @ts-expect-error unavailable is not an honest-empty settlement
void ({ state: "settled_unavailable", reason: "provider_unavailable", failure: { reason: "timeout", retryAfterMs: 1000 } } satisfies EvidenceJobState);
// @ts-expect-error a running job must carry its durable lease
void ({ state: "running" } satisfies EvidenceJobState);
// @ts-expect-error shutdown is lease recovery, never terminal cancellation
void ({ state: "cancelled", reason: "shutdown" } satisfies EvidenceJobState);
// @ts-expect-error the origin fixes its consumer
void ({ kind: "story_completion", consumer: "runtime.analysis" } satisfies EvidenceJobOrigin);
