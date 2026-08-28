# Shared candidate packet — second repeat independent buildability return

**Reviewed:** 2026-08-28

**Reviewer:** codex

**Document:** `rfc/shared-candidate-evidence-packet.md` after the [[D1900]]–[[D1903]] and
[[D1945]]–[[D1947]] amendment

**Verdict:** **RETURNED.** The neutral complete-legal-population packet remains the correct lower
primitive, and the amendment correctly removed the false F1 aggregate, synthetic bot traversal and
N-child Stockfish search. Implementation is still not authorised: the replacement first consumer
is another verification anchor, the promised process receipt has no runtime sealing operation,
cancellation is impossible under the specified synchronous execution shape, and three supposedly
closed receipt fields are widened to unchecked scalars.

## Method

The pass re-read the complete RFC and both prior independent returns, then traced the proposed
symbols through the shipped exact-mobility authority, F1 constructors, semantic compiler, server
entry points and Make graph. `make candidate-packet-contract` remains green 8/8. A separate
four-arm reproduction is available as `make candidate-packet-repeat-review`.

The review preserved the concurrent D872 files and untracked `planning/review/` tree.

## What survives

- `CandidatePopulationRequest` is now closed to root plus evidence scope.
- The cache contains a consumer-neutral internal receipt, not an F1 consumer view.
- The complete legal set remains the denominator; score, hint and Review joins remain separate.
- Exact event/reading values retain their existing evidence authority and object identity.
- The bot handoff uses one complete root-side legal table and keeps categorical mate results.
- Provider execution is correctly absent from the provider-free packet compiler.

These are substantive repairs. None is reopened below.

## Blockers

### 1. The “real” first consumer is still a verification anchor ([[D1958]])

`semantic-evidence-check.ts` is a hard-coded command: it constructs the initial position, plays
`e2e4`, checks fixed counts and prints a diagnostic. Its only repository entry point is the
`semantic-evidence-check` Make target, which is part of `verify-software`. No application route or
learner operation calls the proposed `CandidatePopulationService` or
`SemanticSelectionOperation`.

That is useful verification, but the RFC calls it production consumption while criterion 20 says
the governance tool is not counted as production. The amendment moved D1902/D666 from a test-only
bot profile to a verify-only CLI rather than closing the anchors-versus-consumption class.

Repair: either land the packet with the first accepted Support, Review or bot operation that
actually consumes the complete population, or explicitly authorise a deliberately unconsumed
foundation primitive and remove every production-consumer claim. Do not call a verification
command a product route.

### 2. The process receipt has only an erased TypeScript brand ([[D1959]])

The only literal receipt mechanism is:

```ts
declare const CANDIDATE_POPULATION_RECEIPT: unique symbol;
```

That declaration supplies compile-time nominal typing and emits no runtime value. The RFC never
names the private constructor, runtime identity store or assertion function, yet criteria 22–24
require a forged receipt, an equal rebuild and a removed reference to fail at runtime. “The packet
compiler process-seals it” is a desired property, not an implementable operation contract.

The wide-to-narrow cache projection sharpens the omission: it creates a new packet id and receipt
while retaining exact source references, but no operation says who mints that second receipt or
what the assertion checks.

Repair: specify the private runtime seal (for example, a module-private `WeakSet`), the only receipt
constructor/projector, one exported assertion/reader boundary and exact reference checks for legal,
event and reading inputs. The seal may prove compiler origin; reference identity must separately
prove that retained inputs are the exact compiled values.

### 3. `AbortSignal` cannot interrupt the specified synchronous compiler ([[D1960]])

The measured full packet takes roughly 0.6–1.1 seconds. Every collector and
`localSemanticEvents` call is synchronous. Adding `Promise` and `AbortSignal` to the service does
not let a timer, disconnected request or second waiter change the signal during the same JavaScript
turn. The RFC nevertheless promises that removing the last waiter aborts shared compilation and
that cancellation owns the operation.

The focused control demonstrates the event-loop fact: an abort scheduled for the next timer turn
remains false throughout synchronous work and becomes true only after that work returns.

Repair: choose and specify an actual execution model—cooperative macrotask yields between bounded
candidate chunks, a worker operation with cancellation, or a deliberately non-cancellable
synchronous compiler with the claim removed. If cooperative, state the yield boundary and maximum
cancellation latency and fixture cancellation after work has begun, not only an already-aborted
signal.

### 4. Closed authorities are widened back to strings/numbers ([[D1961]])

The public packet type says:

```ts
moveIdentityConvention: string;
compilerVersion: number;
abstentions[].reason: string;
```

The prose promises one literal `MOVE_IDENTITY_CONVENTION`, one exported compiler version and typed
collector abstentions. These types admit every other string/number and require readers to remember
constraints the receipt should preserve. The abstention field is especially important because the
compiled catalogue already declares the allowed reason vocabulary per projection.

Repair: retain `typeof MOVE_IDENTITY_CONVENTION` and
`typeof CANDIDATE_PACKET_COMPILER_VERSION` literally, and define a checked projection→abstention
reason union/constructor. Add wrong-convention, wrong-version and undeclared-reason negatives.

## Amendment order

1. Choose the honest landing boundary for D1958. The lowest-risk route is the first accepted real
   Support/Review consumer; a foundation-only landing must say it has zero production consumers.
2. Specify the runtime receipt constructor, projector and assertion boundary (D1959).
3. Specify a cancellable execution topology or retract the cancellation guarantee (D1960).
4. Close the literal identity/version/abstention types and negatives (D1961).
5. Re-run both packet targets, the exact production-consumer census, full governance and full
   `make verify`, then repeat independent review.

No owner chess judgement is required for D1959–D1961. D1958 needs an owner/process ruling only if
the intended choice is to implement an intentionally unconsumed lower primitive; wiring to a real
already-authorised consumer is ordinary technical repair.
