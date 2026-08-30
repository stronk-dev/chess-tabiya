// DISPOSABLE buildability model for the D2205 closed public protocol.
type Identity = Readonly<{ requestDigest: string; resultDigest: string }>;
type ReturnResult =
  | Readonly<{ kind: "evidence"; item: { projection: "bounded_return" } }>
  | Readonly<{ kind: "abstained"; reason: "budget_exhausted"; candidateUci: string }>;
type Immediate =
  | Readonly<{ result: "preserved"; cause: null }>
  | Readonly<{ result: "removed"; cause: "attacker_captured" | "attacker_moved" | "exchange_neutralized" }>;
type Candidate =
  | Readonly<{ kind: "preserved"; immediate: Extract<Immediate, { result: "preserved" }> }>
  | Readonly<{ kind: "removed"; immediate: Extract<Immediate, { result: "removed" }>; boundedReturn: ReturnResult }>
  | Readonly<{ kind: "abstained"; reason: "identity_lost"; candidateUci: string }>;
interface Target { readonly candidates: readonly Candidate[] }
interface Completed { readonly kind: "completed"; readonly identity: Identity; readonly targets: readonly Target[] }
interface Abstained { readonly kind: "abstained"; readonly identity: Identity; readonly reason: "input_abstained" | "queue_full" }
interface Cancelled { readonly kind: "cancelled"; readonly identity: Identity; readonly reason: "caller_aborted" | "service_closed" }
interface Failed { readonly kind: "failed"; readonly identity: Identity; readonly reason: "yield_failed" | "traversal_failed" | "seal_failed" | "invariant_failed" }
type Result = Completed | Abstained | Cancelled | Failed;

function never(value: never): never { throw new Error(String(value)); }
function consumeReturn(result: ReturnResult): string {
  switch (result.kind) {
    case "evidence": return result.item.projection;
    case "abstained": return result.reason;
    default: return never(result);
  }
}
function consumeCandidate(candidate: Candidate): string {
  switch (candidate.kind) {
    case "preserved": return candidate.immediate.result;
    case "removed": return consumeReturn(candidate.boundedReturn);
    case "abstained": return candidate.reason;
    default: return never(candidate);
  }
}
function consumeResult(result: Result): string {
  switch (result.kind) {
    case "completed": return result.targets.flatMap((target) => target.candidates).map(consumeCandidate).join(",");
    case "abstained": return result.reason;
    case "cancelled": return result.reason;
    case "failed": return result.reason;
    default: return never(result);
  }
}

declare const identity: Identity;
const crossed: Candidate = {
  kind: "removed",
  immediate: { result: "removed", cause: "attacker_moved" },
  boundedReturn: { kind: "abstained", reason: "budget_exhausted", candidateUci: "e2e4" },
};
consumeResult({ kind: "completed", identity, targets: [{ candidates: [crossed] }] });

// @ts-expect-error preserved arms cannot carry a return derivation
const impossible: Candidate = { kind: "preserved", immediate: { result: "preserved", cause: null }, boundedReturn: { kind: "abstained", reason: "budget_exhausted", candidateUci: "e2e4" } };
void impossible;
// @ts-expect-error a top-level failure cannot carry completed targets
const crossedTop: Result = { kind: "failed", identity, reason: "seal_failed", targets: [] };
void crossedTop;
