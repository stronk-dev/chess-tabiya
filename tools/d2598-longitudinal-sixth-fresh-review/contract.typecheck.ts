// DISPOSABLE fresh-review falsifier — D2602. Not production code.
import type { ModeledJob } from "../d2570-longitudinal-sixth-author-repair/contract.js";

const digest = `sha256:${"0".repeat(64)}` as const;

// The durable RFC state is legitimate, but the sixth-repair model cannot represent it.
// If the model is repaired, this expected error becomes unused and the review receipt turns red.
const runningJob: ModeledJob = {
  requestedSeq: 2,
  requestedSourceDigest: digest,
  completedSeq: 0,
  // @ts-expect-error D2602: running is absent from the claimed complete invalidation domain.
  state: "running",
  claimGeneration: 4,
};

void runningJob;
