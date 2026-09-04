import {
  parseLongitudinalObservationRow,
  parseLongitudinalReadQuery,
  type DurableLongitudinalJob,
} from "./contract.js";

const digest = `sha256:${"0".repeat(64)}` as const;
const base = {
  runId: "run",
  learnerId: "learner",
  requestedSeq: 2,
  requestedSourceDigest: digest,
  completedSeq: 0,
  derivedRev: 1,
  claimGeneration: 2,
  retryCount: 0,
} as const;

void ({ ...base, state: "pending", claimedRequestedSeq: null, claimedSourceDigest: null, claimToken: null, claimedBy: null, leaseExpiresAt: null, nextAttemptAt: null, failureCode: null } satisfies DurableLongitudinalJob);
void ({ ...base, state: "running", claimedRequestedSeq: 2, claimedSourceDigest: digest, claimToken: "token", claimedBy: "worker", leaseExpiresAt: "later", nextAttemptAt: null, failureCode: null } satisfies DurableLongitudinalJob);
void ({ ...base, state: "retry_wait", claimedRequestedSeq: null, claimedSourceDigest: null, claimToken: null, claimedBy: null, leaseExpiresAt: null, nextAttemptAt: "later", failureCode: "derivation_failed" } satisfies DurableLongitudinalJob);
void ({ ...base, state: "quarantined", claimedRequestedSeq: null, claimedSourceDigest: null, claimToken: null, claimedBy: null, leaseExpiresAt: null, nextAttemptAt: null, failureCode: "snapshot_invalid" } satisfies DurableLongitudinalJob);

// @ts-expect-error callers cannot inject a projection registry into row parsing
parseLongitudinalObservationRow({}, []);
// @ts-expect-error callers cannot inject a projection registry into query parsing
parseLongitudinalReadQuery({}, []);
// @ts-expect-error running jobs require the complete claim tuple
void ({ ...base, state: "running", claimToken: "token" } satisfies DurableLongitudinalJob);
// @ts-expect-error retry-wait jobs require schedule and failure authority
void ({ ...base, state: "retry_wait", claimedRequestedSeq: null, claimedSourceDigest: null, claimToken: null, claimedBy: null, leaseExpiresAt: null, nextAttemptAt: null, failureCode: null } satisfies DurableLongitudinalJob);
