// rfc/longitudinal-store.md §C production worker lifecycle — the one batch executor shared by the
// `worker_threads` semantic executor and the `longitudinal-worker-once` operator door. It never runs
// on the HTTP event loop: neither the supervisor nor application composition imports this module.
import { performance } from "node:perf_hooks";

import type { LongitudinalWorkerConfig } from "./longitudinal-worker-config.js";
import { projectObservations } from "./longitudinal-projector.js";
import { LongitudinalSnapshotError, type LongitudinalSourceImageV4 } from "./longitudinal-source.js";
import type { LongitudinalClaim, LongitudinalProjection, LongitudinalStore } from "./longitudinal-store.js";

export interface LongitudinalBatchReceipt {
  readonly claimed: number;
  readonly completed: number;
  readonly failed: number;
  readonly conflicts: number;
  readonly renewals: number;
}

export interface LongitudinalBatchOptions {
  /** Monotonic milliseconds for the progress-checkpoint heartbeat. */
  readonly monotonicNow?: () => number;
  readonly project?: (image: LongitudinalSourceImageV4, checkpoint: () => void) => LongitudinalProjection;
  readonly onClaim?: (claim: LongitudinalClaim) => void;
}

class LongitudinalClaimLost extends Error {
  constructor() {
    super("LONGITUDINAL_CLAIM_LOST");
    this.name = "LongitudinalClaimLost";
  }
}

type ClaimOutcome = "completed" | "failed" | "conflict";

function processClaim(store: LongitudinalStore, config: LongitudinalWorkerConfig, claim: LongitudinalClaim, options: LongitudinalBatchOptions, counters: { renewals: number }): ClaimOutcome {
  const monotonic = options.monotonicNow ?? (() => performance.now());
  let current = claim;
  let lastRenewal = monotonic();
  let image: LongitudinalSourceImageV4 | undefined;
  try {
    image = store.claimSourceImage(current);
  } catch (error) {
    if (error instanceof LongitudinalSnapshotError) return store.fail(current, "snapshot_invalid") ? "failed" : "conflict";
    throw error;
  }
  if (image === undefined) return "conflict";
  if (store.sourceDigest(image) !== current.claimedSourceDigest) {
    // Stored bytes moved without a watermark: re-derive it, which fences this claim.
    store.refreshWatermark(current.runId);
    return "conflict";
  }
  const checkpoint = (): void => {
    const now = monotonic();
    if (now - lastRenewal < config.workerHeartbeatMs) return;
    const renewed = store.renew(current, config.workerLeaseMs);
    if (renewed === undefined) throw new LongitudinalClaimLost();
    current = renewed;
    lastRenewal = now;
    counters.renewals += 1;
  };
  let projection: LongitudinalProjection;
  try {
    projection = options.project === undefined
      ? projectObservations(image, { checkpoint })
      : options.project(image, checkpoint);
  } catch (error) {
    if (error instanceof LongitudinalClaimLost) return "conflict";
    if (error instanceof LongitudinalSnapshotError) return store.fail(current, "snapshot_invalid") ? "failed" : "conflict";
    return store.fail(current, "derivation_failed") ? "failed" : "conflict";
  }
  try {
    return store.publish(current, projection) === "published" ? "completed" : "conflict";
  } catch {
    // A constraint failure inside a still-current claim is a bounded, retryable publication conflict.
    return store.fail(current, "publication_conflict") ? "failed" : "conflict";
  }
}

/**
 * One bounded tick: scan at most `workerBatchSize` rows oldest-first, claim only the immediately
 * executable `workerConcurrency` slots, and project/publish each claim independently.
 */
export function runLongitudinalBatch(store: LongitudinalStore, config: LongitudinalWorkerConfig, workerId: string, options: LongitudinalBatchOptions = {}): LongitudinalBatchReceipt {
  const claims = store.claimBatch({ workerId, scanLimit: config.workerBatchSize, slots: config.workerConcurrency, leaseMs: config.workerLeaseMs });
  const counters = { renewals: 0 };
  let completed = 0;
  let failed = 0;
  let conflicts = 0;
  for (const claim of claims) {
    options.onClaim?.(claim);
    const outcome = processClaim(store, config, claim, options, counters);
    if (outcome === "completed") completed += 1;
    else if (outcome === "failed") failed += 1;
    else conflicts += 1;
  }
  return Object.freeze({ claimed: claims.length, completed, failed, conflicts, renewals: counters.renewals });
}
