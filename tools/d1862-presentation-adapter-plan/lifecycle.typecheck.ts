// Compile-only negatives: pending is not a terminal absence and settlement requires source authority.
import { registeredPresentationQuestion, type PresentationAbstentionLifecycle, type PresentationDecisionStamp } from "./plan.js";

declare const decision: PresentationDecisionStamp;

const question = registeredPresentationQuestion("inspector.corpus@1\0human.explorer.population@1", "question.explorer_population");
const identity = { question, projection: "human.explorer.population@1", producer: "human.explorer@1" } as const;
const pending: PresentationAbstentionLifecycle = { kind: "pending", ...identity, requestId: "r1", decision };
const settled: PresentationAbstentionLifecycle = {
  kind: "settled_abstention",
  ...identity,
  requestId: "r1",
  decision,
  absence: "empty",
  reason: { sourceReason: "empty_population", learnerReason: "empty_population" },
  sourceReceipt: { producer: "human.explorer@1", projection: "human.explorer.population@1", receiptDigest: "abc" },
};

// @ts-expect-error A pending request has no terminal absence.
const impossiblePending: PresentationAbstentionLifecycle = { kind: "pending", ...identity, requestId: "r1", decision, absence: "failed" };
// @ts-expect-error A terminal absence is not source-free.
const sourceFreeSettlement: PresentationAbstentionLifecycle = { kind: "settled_abstention", ...identity, requestId: "r1", decision, absence: "empty", reason: { sourceReason: "empty_population", learnerReason: "empty_population" } };
// @ts-expect-error Never-requested is represented by a closed module door, not a presentation receipt.
const unopened: PresentationAbstentionLifecycle = { kind: "never_requested" };
// @ts-expect-error Question prose cannot be substituted for a registered question identity.
const inventedQuestion: PresentationAbstentionLifecycle = { kind: "pending", ...identity, question: "Was this good?", requestId: "r1", decision };

void [pending, settled, impossiblePending, sourceFreeSettlement, unopened, inventedQuestion];
