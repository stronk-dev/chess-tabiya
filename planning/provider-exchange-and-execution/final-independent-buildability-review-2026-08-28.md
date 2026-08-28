# Provider exchange and execution — final independent buildability return

**Reviewed:** 2026-08-28

**Reviewer:** codex

**Document:** `rfc/provider-exchange-and-execution.md` after the [[D1950]]–[[D1956]] and [[D1969]]
author repairs

**Verdict:** **RETURNED A THIRD TIME.** The previous repairs survive, but the shared operation,
receipt, scheduler and source-result types still admit wrong-provider provenance, uncorrelated
results and unreachable domain states. Implementation remains unauthorised.

**Executable reproduction:** `make provider-exchange-final-review` — 9/9. The earlier author
contracts remain green at `make provider-exchange-contract` and
`make provider-exchange-repeat-review`.

## Method

The pass re-read the complete amended RFC, both earlier returns and handoffs, then checked its
literal types and criteria against the live `EngineSupervisor`, Stockfish evidence executor,
Syzygy source, both Explorer implementations, F1 compiler and repository digest helpers. The nine
arms deliberately compare independent production symbols with the RFC; none treats an RFC token as
proof of its own claim.

## What survives

- one shared provider scheduler rather than consumer-private engine/model queues;
- path-preserving F1 execution metadata and subject-specific availability;
- immutable acquisition evidence inside live/retained delivery provenance;
- separate Maia history-conditioned and exact-FEN pages and occurrences;
- sparse/zero Explorer source truth, exact move mass and consumer-owned sample policy;
- one fixed-bound Stockfish exchange supplying score and raw WDL to Review;
- exact Explorer played-move occurrence correctly deferred to `run.record.edge@1`.

## Blockers

### 1. Success results lose operation correlation ([[D2000]])

`TypedProviderRequest<K>` is distributive. `TypedProviderResult<K>` is not: its success arm contains
`ProviderDelivery<ProviderOperationResultMap[K]>` and no operation literal. A dynamic dispatcher
holding the five-operation request union receives one delivery of a five-payload union with no
proof of which operation produced it.

**Repair:** make result distribution literal and retain `{operation, normalizedRequestDigest}` in
both success and failure. Cross every wrong operation/payload pair, including the two Stockfish
operations sharing one provider.

### 2. The common receipt is not tied to an operation ([[D2001]])

`ProviderAcquisitionReceipt` uses open requested/actual identity records, and
`ProviderOperationDescriptor` declares no provider. A descriptor can type-correctly return the
wrong provider or omit every operation-specific identity field. The scheduler has no mapped
authority against which to validate the receipt it is supposed to seal.

**Repair:** publish an operation-to-provider and operation-to-identity map, or a single private
receipt constructor keyed by the operation literal that validates exact requested and actual
images. Cross wrong provider, engine/model, endpoint, bound and request identities.

### 3. Coalesced callers have no crossed-deadline semantics ([[D2002]])

Every caller supplies a `deadlineAt`, exact requests coalesce, and one descriptor receives one
`remainingMs`. The RFC states only that active work aborts when its final subscriber leaves. It
does not define which deadline drives the job, waiter-local timeout behavior, or how a later
shorter/longer waiter interacts with active work. The public caller also supplies the monotonic
deadline prose says is created at arrival.

**Repair:** have the scheduler mint waiter deadlines from explicit budgets, detach/settle each
waiter independently and abort the underlying job only after the last waiter leaves. Cross both
deadline orderings before and after dispatch, one abort and all aborting.

### 4. The promised entry bound does not exist ([[D2003]])

The constructor requires `maxRetainedWeight` and TTL, while the rules require retention to be
weight- and entry-bounded. There is no `maxRetainedEntries`, no positive-safe-integer constraint on
`retainedWeight`, and no deterministic eviction tie-break.

**Repair:** add the missing entry cap, positive weight validation and exact eviction order; or make
weight the sole claimed bound and prove every entry consumes at least one unit.

### 5. Syzygy outside-domain is unrepresentable ([[D2004]])

The prose calls outside-domain a successful typed domain abstention. The mapped result is only
`LiveSyzygyPosition`, whose `result` is only `TablebasePosition`; the current source throws
`TABLEBASE_OUT_OF_RANGE`. A conforming implementation must either throw a source failure or invent
an untyped value.

**Repair:** publish a discriminated in-domain/outside-domain operation result, including the
variant rule, and cross it against provider absence, invalid response and a genuine tablebase draw.

### 6. Explorer suitability cites a sentence, not a predicate ([[D2005]])

`CORPUS_GUARD` is the non-valence disclosure “These counts say what this population played, not
what is good.” It takes no input and returns no boolean. The proposed summary nevertheless contains
`{guard:"CORPUS_GUARD", accepted:boolean}` while the same RFC deletes the global 100-game threshold
and assigns sample policy to named consumers.

**Repair:** keep the disclosure as render metadata and remove source-level `accepted`; or add a
separate consumer-owned suitability projection with its literal threshold and population window.

### 7. Stockfish command identity is caller-forgeable ([[D2006]])

Both Stockfish requests accept `normalizedCommandsDigest: string`, although descriptors alone own
UCI command construction. The digest has no command image or validation rule. The fixed-evaluation
section also never mandates `UCI_ShowWDL=true`, while the current executor proves that option is
required and stateful.

**Repair:** make the descriptor construct and digest the exact reset/options/position/go image;
include `UCI_ShowWDL`, MultiPV and prior-option reset semantics. Refuse forged digests and cross
omitted/stale ShowWDL states.

### 8. Iterative UCI output has no final-line reduction ([[D2007]])

Stockfish emits multiple completed `info` lines. The RFC says it parses “exactly one completed
score” and rejects different-depth WDL, but does not choose the last admissible line, highest
reached depth or another reproducible completion rule for depth/nodes/movetime. The current
evidence executor privately chooses the last match.

**Repair:** publish the exact line reducer, MultiPV rule and score/WDL same-line condition. Cross
earlier exact lines, later bounded lines, stale MultiPV rows and final `bestmove` ordering.

### 9. Provider digests have no common byte authority ([[D2008]])

The RFC names canonical `pendingKey`, `normalizedRequestDigest`, `actualIdentityDigest`,
`responseDigest` and `pathId`, but does not select the repository's canonicalizer, domain tags,
byte encoding or prefix grammar for the provider identities. Runtime and schema already expose
different canonical helpers.

**Repair:** publish one domain-separated digest registry with exact canonical images for request,
actual identity, response and path. Cross object-key reordering, operation changes, response-byte
changes and digest-kind substitution.

## Resume order

1. Close distributive operation results and typed receipt construction ([[D2000]], [[D2001]]).
2. Close waiter/deadline lifecycle and retention bounds ([[D2002]], [[D2003]]).
3. Repair the literal Syzygy and Explorer result contracts ([[D2004]], [[D2005]]).
4. Make Stockfish command construction and iterative result selection one authority ([[D2006]],
   [[D2007]]).
5. Bind all identities to one digest registry ([[D2008]]), replace the nine reproduction arms with
   crossed author fixtures, run all three focused targets and `make verify`, then request fresh
   review.

No production, schema, pack, content or protected intent byte changed in this review.
