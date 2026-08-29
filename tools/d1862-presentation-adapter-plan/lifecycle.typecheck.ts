// Compile-only negatives: pending is not a terminal absence and settlement requires source authority.
import type { PresentationAbstentionLifecycle, PresentationDecisionStamp } from "./plan.js";

declare const decision: PresentationDecisionStamp;

const pending: PresentationAbstentionLifecycle = { kind: "pending", requestId: "r1", decision };
const settled: PresentationAbstentionLifecycle = {
  kind: "settled_abstention",
  requestId: "r1",
  decision,
  absence: "empty",
  reasonRef: "no_candidates@1",
  sourceReceipt: { producer: "human.explorer@1", projection: "human.explorer.population@1", receiptDigest: "abc" },
};

// @ts-expect-error A pending request has no terminal absence.
const impossiblePending: PresentationAbstentionLifecycle = { kind: "pending", requestId: "r1", decision, absence: "failed" };
// @ts-expect-error A terminal absence is not source-free.
const sourceFreeSettlement: PresentationAbstentionLifecycle = { kind: "settled_abstention", requestId: "r1", decision, absence: "empty", reasonRef: "no_candidates@1" };
// @ts-expect-error Never-requested is represented by a closed module door, not a presentation receipt.
const unopened: PresentationAbstentionLifecycle = { kind: "never_requested" };

void [pending, settled, impossiblePending, sourceFreeSettlement, unopened];
