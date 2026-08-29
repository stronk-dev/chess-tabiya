# Provider exchange and execution — fourth independent buildability return

**Reviewed:** 2026-08-29

**Reviewer:** codex

**Document:** `rfc/provider-exchange-and-execution.md` after the [[D2000]]–[[D2008]] author repair

**Verdict:** **RETURNED A FOURTH TIME.** The nine repaired provider/scheduler contracts survive,
but the composed evidence graph still contains three unimplementable or unsafe boundaries.
Production implementation and every dependent Review, bot, theory and provider-backed collector
remain unauthorised.

**Executable reproduction:** `make provider-exchange-fourth-review` — 3/3. The three earlier
author targets also remain green: `make provider-exchange-contract`,
`make provider-exchange-repeat-review`, and `make provider-exchange-final-review`.

## Method

The pass read the complete amended RFC and all three earlier returns/handoffs, ran the stable author
contracts, and traced the proposed types through the live evidence catalogue, authorization
authority and provider sources. The reproduction deliberately joins protocol layers that the
author fixtures test separately: scheduler success with Syzygy preflight, source-requirement
multiplicity with before/after evaluation, and authenticated subject lookup with the repository's
ownership/grant model.

## What survives

- distributive operation-correlated results and operation-keyed receipt construction;
- scheduler-minted waiter deadlines, last-waiter cancellation and two-axis deterministic retention;
- descriptor-owned Stockfish commands, one final-line reducer and the canonical digest registry;
- closed Explorer population truth with consumer-owned suitability;
- Maia history-conditioned versus exact-FEN identity;
- the distinction between static provider reach and exact subject satisfaction.

## Blockers

### 1. No-exchange Syzygy abstention cannot carry an acquisition receipt ([[D2032]])

Every `ProviderSuccess<K>` contains `ProviderDelivery<..., K>`. Every delivery contains a
`ProviderAcquisitionReceipt<K>`, and the only descriptor success hook returns a
`ProviderExecutionCapture<K>` with endpoint, actual identity and exact response bytes. Section 7
simultaneously requires the more-than-seven-piece result to be computed locally and returned
without calling Syzygy.

The D2004 author fixture proves only that a standalone `outside_domain` union differs from draw and
failure. It never passes that value through `ProviderOperationDescriptor`, the private receipt
constructor or `ProviderSuccess`. A conforming implementation must fabricate provider bytes or
violate the mapped result type.

**Repair:** give local domain preflight a typed no-acquisition outcome/projection before exchange,
or widen the total operation protocol with an explicitly non-provider success arm. Do not weaken
the receipt rule for actual live/retained provider evidence. Cross a local eight-piece result, a
real in-domain draw and transport failure through the actual scheduler result type; the first must
have no endpoint, response digest, retrieval time or cache state.

### 2. Subject availability is authenticated but not authorized ([[D2033]])

The proposed operation accepts arbitrary `runId`, event head, module, provider operation/digest and
projection list. It says “authenticated” but never composes the shipped `requireRead` ownership/
grant authority, restricts raw provider-request probes to an operator/research role, binds the
provider operation to the requested source projection, or bounds/deduplicates the request. It also
defines no wrong-run, wrong-role or wrong-operation result.

That is not merely an HTTP detail: the operation reveals whether exact recorded or retained
evidence exists. Authentication alone can disclose another learner's run/cache state, and a
provider digest for one operation can be crossed with an unrelated projection.

**Repair:** publish the literal access matrix and total refusal/absence behavior. Run-event and
module subjects must pass the canonical run read authority and exact event-head membership;
provider-request subjects need a named operator/research authority or a narrower caller-bound
capability. Bind operation, projection and normalized request digest, cap and deduplicate
`projectionIds`, and cross owner/grantee/stranger plus wrong-operation cases.

### 3. Projection-only source uniqueness erases execution multiplicity ([[D2034]])

`CompiledProjectionExecution.sourceRequirements` contains only projection and availability.
Compilation then makes it an “exact unique set.” Unlike `derivationChoices`, a source requirement
has no occurrence address; unlike the scheduler request, it has no normalized request identity.

Two uses of the same provider projection at different positions therefore collapse. The existing
`derived.story.eval_shift` makes the defect concrete: its payload names `before`, `after` and
`delta`, but its derivation declares one `live.stockfish.eval` input. A future Review path cannot
prove that both exact position evaluations exist; one cache entry can satisfy the projection-only
leaf.

**Repair:** retain an occurrence address for every non-local leaf and define how that occurrence
constructs or joins its exact operation/request subject. Source satisfaction rows must return that
identity. Dedupe may share scheduler work only when exact normalized requests match; it may never
delete a semantic obligation. Cross two Stockfish FENs, the same source used twice at one FEN, one
missing occurrence, and a crossed response. Amend the current Story declaration rather than only
testing a hypothetical Review consumer.

## Resume order

1. Repair the source-occurrence graph first ([[D2034]]); the availability API and all provider
   consumers depend on its identity.
2. Close the subject access/binding matrix over those exact occurrences ([[D2033]]).
3. Split local Syzygy preflight from receipt-bearing exchange without weakening live provenance
   ([[D2032]]).
4. Replace the three review reproductions with able-to-fail author fixtures, preserve all previous
   returns, run all four provider targets plus `make verify`, and request fresh independent review.

No production, schema, pack, content or protected intent byte changed in this review.
