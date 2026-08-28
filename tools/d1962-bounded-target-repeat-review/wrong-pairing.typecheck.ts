// DISPOSABLE type witness — D1967. It must compile to reproduce the missing correlation.
type BoundedRequest =
  | { readonly kind: "named_material_target" }
  | { readonly kind: "immediate"; readonly candidateUci: string }
  | { readonly kind: "bounded_return" };

type Result =
  | { readonly kind: "evidence"; readonly projection: "named" | "immediate" | "bounded_return" }
  | { readonly kind: "abstained"; readonly reason: "exchange_mismatch" | "candidate_not_legal" | "budget_exhausted" };

interface Operation {
  derive(request: BoundedRequest, signal: AbortSignal): Promise<Result>;
}

// The RFC's uncorrelated signature accepts every wrong pair below.
const wrong: Operation = {
  async derive(request) {
    if (request.kind === "named_material_target") {
      return { kind: "evidence", projection: "bounded_return" };
    }
    if (request.kind === "immediate") {
      return { kind: "abstained", reason: "exchange_mismatch" };
    }
    return { kind: "abstained", reason: "candidate_not_legal" };
  },
};

void wrong;

interface BoundedReturn {
  readonly reintroducedWithin3Ply: boolean;
  readonly reintroductionWitness: readonly string[] | null;
  readonly preparationSurvivesEveryDefence: boolean;
  readonly everyDefenceWitness: readonly string[] | null;
  readonly firstRefutation: readonly string[] | null;
}

// D1968: the normative independent fields admit a logically impossible sealed payload.
const impossible: BoundedReturn = {
  reintroducedWithin3Ply: false,
  reintroductionWitness: ["not", "a", "canonical", "line", "length"],
  preparationSurvivesEveryDefence: true,
  everyDefenceWitness: null,
  firstRefutation: ["contradicts", "universal", "survival"],
};

void impossible;
