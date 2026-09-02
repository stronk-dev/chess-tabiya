import {
  LONGITUDINAL_EVENT_LOOP_BUDGET,
  LONGITUDINAL_EXECUTION_CONTRACT,
  LONGITUDINAL_RETRY_LIMITS,
  assertLongitudinalExecutionContract,
  classifyLongitudinalCut,
  type ObservationJob,
} from "../d1612-longitudinal-contract-harness/longitudinal-contract.js";

const job = {
  runId: "run",
  learnerId: "learner",
  requestedSeq: 4,
  requestedSourceDigest: `sha256:${"a".repeat(64)}`,
  completedSeq: 0,
  derivedRev: 1,
  state: "pending",
  claimGeneration: 0,
  claimedRequestedSeq: null,
  claimedSourceDigest: null,
  claimToken: null,
  claimedBy: null,
  leaseExpiresAt: null,
  retryCount: 0,
  nextAttemptAt: null,
  failureCode: null,
} as const satisfies ObservationJob;

assertLongitudinalExecutionContract(LONGITUDINAL_EXECUTION_CONTRACT);
const cutState: ReturnType<typeof classifyLongitudinalCut> = classifyLongitudinalCut(4, 1, job);
const retryLimit: number = LONGITUDINAL_RETRY_LIMITS.derivation_failed;
const eventLoopP95: number = LONGITUDINAL_EVENT_LOOP_BUDGET.p95Ms;

void [cutState, retryLimit, eventLoopP95];
