// DISPOSABLE compile contract — D1967-D1968. Expected errors prove crossed states stay closed.
type RefutationLine = readonly [candidateUci: string, preparationUci: string, replyUci: string];
type ReintroductionLine = readonly [candidateUci: string, preparationUci: string, replyUci: string, captureUci: string];

type BoundedReturnOutcome =
  | { readonly kind: "not_reintroduced"; readonly firstRefutation: RefutationLine | null }
  | { readonly kind: "reintroduced"; readonly witness: ReintroductionLine; readonly firstRefutation: RefutationLine | null }
  | { readonly kind: "survives_every_defence"; readonly witness: ReintroductionLine };

type BatchResult =
  | { readonly kind: "completed"; readonly outcomes: readonly BoundedReturnOutcome[] }
  | { readonly kind: "abstained"; readonly reason: "multiplication_limit" | "queue_full" | "cancelled" };

type CandidateDerivation =
  | { readonly kind: "preserved"; readonly immediate: { readonly outcome: "preserved" } }
  | {
      readonly kind: "removed";
      readonly immediate: { readonly outcome: "removed" };
      readonly boundedReturn: BoundedReturnOutcome;
    }
  | { readonly kind: "abstained"; readonly reason: "identity_lost" };

const valid: BoundedReturnOutcome = {
  kind: "survives_every_defence",
  witness: ["e2e4", "e7e5", "g1f3", "b8c6"],
};

// @ts-expect-error universal survival cannot omit its existential witness
const missingWitness: BoundedReturnOutcome = { kind: "survives_every_defence" };

const negativeWithWitness: BoundedReturnOutcome = {
  kind: "not_reintroduced",
  firstRefutation: null,
  // @ts-expect-error a negative result cannot carry a reintroduction witness
  witness: ["e2e4", "e7e5", "g1f3", "b8c6"],
};

const abstentionWithEvidence: BatchResult = {
  kind: "abstained",
  reason: "cancelled",
  // @ts-expect-error an abstention cannot carry completed outcomes
  outcomes: [valid],
};

const preservedWithReturn: CandidateDerivation = {
  kind: "preserved",
  immediate: { outcome: "preserved" },
  // @ts-expect-error a preserved target cannot carry a bounded-return projection
  boundedReturn: valid,
};

// @ts-expect-error a removed target must carry its exact bounded-return result or abstention
const removedWithoutReturn: CandidateDerivation = {
  kind: "removed",
  immediate: { outcome: "removed" },
};

void missingWitness;
void negativeWithWitness;
void abstentionWithEvidence;
void preservedWithReturn;
void removedWithoutReturn;
