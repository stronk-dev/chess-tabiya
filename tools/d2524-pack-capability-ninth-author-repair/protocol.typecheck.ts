type ProviderFailure = Readonly<{ reason: string; retryAfterMs: number | null }>;
type ProviderAvailability = Readonly<{
  state: "unavailable" | "cached_exact_only";
  instanceId: string;
  generation: string;
}>;
type AcquisitionReceipt = Readonly<{ operationId: string; generation: string }>;
type EvidencePayload = Readonly<{ kind: string; values: Readonly<Record<string, unknown>> }>;
type ObjectiveProposal = Readonly<{ objectiveState: string; evidenceRefs: readonly string[] }>;

type RetryBasis =
  | Readonly<{
      kind: "provider_unavailable";
      availability: ProviderAvailability;
      failure?: ProviderFailure;
    }>
  | Readonly<{ kind: "shutdown" }>
  | Readonly<{ kind: "lease_expired"; previousFailure?: ProviderFailure }>;

type EvidenceSettlement =
  | Readonly<{
      kind: "success";
      payload: EvidencePayload;
      objectiveProposal: ObjectiveProposal | null;
      acquisition: AcquisitionReceipt;
    }>
  | Readonly<{
      kind: "empty";
      reason: "capability_not_configured" | "not_applicable";
    }>
  | Readonly<{
      kind: "empty";
      reason: "provider_unavailable";
      availability: ProviderAvailability;
      failure?: ProviderFailure;
    }>
  | Readonly<{
      kind: "unavailable";
      availability: ProviderAvailability;
      failure?: ProviderFailure;
    }>
  | Readonly<{ kind: "cancelled"; reason: "caller" | "superseded" }>;

type EvidenceJobState =
  | Readonly<{ state: "admitted" }>
  | Readonly<{ state: "running"; leaseOwner: string; leaseExpiresAt: string }>
  | Readonly<{ state: "retry_wait"; basis: RetryBasis; nextAttemptAt: string }>
  | Readonly<{ state: "settled"; result: EvidenceSettlement; resultSeq: number | null }>
  | Readonly<{
      state: "consumed";
      result: Extract<EvidenceSettlement, { kind: "success" }>;
      resultSeq: number;
      consumedAt: string;
    }>;

type EvidenceAdmission =
  | Readonly<{
      origin: "explicit_analysis";
      key: string;
      requestDigest: string;
      jobs: readonly [unknown, ...unknown[]];
    }>
  | Readonly<{
      origin: "story_completion";
      key: `sha256:${string}`;
      requestDigest: string;
      jobs: readonly [unknown, ...unknown[]];
    }>
  | Readonly<{
      origin: "run_enrichment";
      key: `run_enrichment@1:${string}`;
      requestDigest: string;
      jobs: readonly [unknown, ...unknown[]];
    }>;

void ({
  state: "settled",
  resultSeq: 1,
  result: {
    kind: "success",
    payload: { kind: "eval", values: {} },
    objectiveProposal: null,
    acquisition: { operationId: "evidence.stockfish_analysis", generation: "g1" },
  },
} satisfies EvidenceJobState);

// A legal provider result can be unavailable without manufacturing a failure receipt.
void ({
  state: "settled",
  resultSeq: null,
  result: {
    kind: "unavailable",
    availability: { state: "cached_exact_only", instanceId: "stockfish-analysis", generation: "g1" },
  },
} satisfies EvidenceJobState);

void ({
  state: "retry_wait",
  basis: {
    kind: "provider_unavailable",
    availability: { state: "unavailable", instanceId: "tablebase-primary", generation: "g2" },
  },
  nextAttemptAt: "2026-09-02T12:00:00.000Z",
} satisfies EvidenceJobState);

void ({
  origin: "story_completion",
  key: "sha256:story-branch-node-identity",
  requestDigest: "sha256:story",
  jobs: [{}],
} satisfies EvidenceAdmission);

// @ts-expect-error success must preserve explicit proposal absence or the exact proposal
void ({ state: "settled", resultSeq: 1, result: { kind: "success", payload: { kind: "eval", values: {} }, acquisition: { operationId: "evidence.stockfish_analysis", generation: "g1" } } } satisfies EvidenceJobState);
// @ts-expect-error retrying provider unavailability cannot discard the availability snapshot
void ({ state: "retry_wait", basis: { kind: "provider_unavailable", failure: { reason: "timeout", retryAfterMs: null } }, nextAttemptAt: "2026-09-02T12:00:00.000Z" } satisfies EvidenceJobState);
// @ts-expect-error consumed jobs can only retain a successful settled result
void ({ state: "consumed", resultSeq: 1, consumedAt: "2026-09-02T12:00:00.000Z", result: { kind: "unavailable", availability: { state: "unavailable", instanceId: "x", generation: "g" } } } satisfies EvidenceJobState);
// @ts-expect-error internal Story identity is versioned and derived, not an arbitrary caller key
void ({ origin: "story_completion", key: "caller-choice", requestDigest: "sha256:x", jobs: [{}] } satisfies EvidenceAdmission);
// @ts-expect-error a batch cannot be empty
void ({ origin: "run_enrichment", key: "run_enrichment@1:node-1", requestDigest: "sha256:x", jobs: [] } satisfies EvidenceAdmission);
