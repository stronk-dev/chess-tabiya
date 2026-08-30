# Shared candidate packet — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/shared-candidate-evidence-packet.md` after the D1977–D1981 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make candidate-packet-fresh-review` — 8/8 blocker arms
- **Prior contracts:** `make candidate-packet-contract candidate-packet-repeat-review
  candidate-packet-final-review` remain green (11 + 4 + 5)
- **Production status:** untouched; no packet compiler/cache, provider handoff, selector migration or
  product consumer is authorized

The repair correctly adds a closed result vocabulary, a real macrotask yield, scope projection and
available-versus-unavailable collector intent. The fresh pass tested whether those clauses compose
into one public runtime service and whether its provider-free landing is actually provider-free.
They do not yet. Eight seams remain, including two compile-time contradictions and three resource/
authority gaps that the prose-only author checks cannot expose.

## B1 — request and result scopes are not correlated ([[D2097]])

`CandidatePopulationRequest.scope` is the whole scope union and `get()` returns an uncorrelated
`CandidatePopulationResult`. An implementation may return a readings receipt for an events request
and still satisfy the public signature. The most-used wide→narrow projector overload similarly
returns `CandidatePopulationProjectionResult<CandidatePacketScope>` rather than the literal target.

**Required repair:** make request, ready receipt and projection result one distributive generic map.
Use a single `<S, T extends ProjectableCandidateScope<S>>` projector and cross every wrong pairing at
both compile and runtime boundaries.

## B2 — the “type-only” provider handoff cannot compile at this landing ([[D2098]])

The packet type uses `ProviderEvidenceDelivery<StockfishLegalRootTable>` with one type argument; the
provider contract requires two, including the operation id. More fundamentally, neither provider
type exists in production yet because that RFC is returned. The packet says provider exchange is
only a D10 dependency while §12 requires `candidate-score-handoff.ts` to compile now.

**Required repair:** remove the handoff file/acceptance from this provider-free landing and publish
it in D10 after provider exchange lands, or make the accepted provider RFC a real predecessor and
use its exact `ProviderEvidenceDelivery<T, K>` type. A local restatement is forbidden.

## B3 — the public service has no exported construction boundary ([[D2099]])

`CandidatePopulationServiceOptions` is exported, but `CandidatePopulationService` is not, and no
class, factory or constructor signature says how defaults, manifest, legal authority, collectors,
cache and yield adapter enter the service. §12 nevertheless requires the runtime barrel to export
the service. An implementer must invent the public API and test seams.

**Required repair:** publish one exact exported factory/class signature, production defaults and
dependency ownership. Distinguish product-fixed dependencies from test fault injection without
letting product callers choose a scheduler or evidence authority.

## B4 — projection ids are not a callable collector topology ([[D2100]])

The scheduling rule sorts projection ids and slices them into groups, but current collection is ten
multi-output family functions such as `tacticalSemanticEvents`; there is no one-callable-per-id
registry. The packet also forbids calling the existing flattening wrapper. A string set can prove
closure but cannot tell the compiler which function to run once, how multi-output dependencies are
shared, or what one cancellation group contains.

**Required repair:** publish the complete projection/family→callable execution registry with stable
group identity, declared outputs, dependencies and invocation cardinality. The closure census must
join that executable registry, not a parallel id array.

## B5 — cache bounds do not bound in-flight work ([[D2101]])

Settled entries are limited by count and retained weight, while in-flight entries are explicitly
never evicted. There is no maximum concurrent unique compilation, pending queue or overload result.
Single-flight only coalesces equal keys. Many unique FEN/scope requests can therefore start
unbounded hundreds-of-millisecond collector jobs and retain all intermediate populations outside
both advertised bounds.

**Required repair:** add a process-wide concurrency and queue/admission contract with fair ordering,
cancellation before start, closed overload/deadline results and shutdown behavior. Cross more unique
keys than capacity; same-key deduplication is not the negative control.

## B6 — the closed result algebra has an unhandled injected-scheduler failure ([[D2102]])

`yieldControl` is an arbitrary injected `() => Promise<void>`. A rejection escapes `get()` because
the failure union has no scheduler/internal arm and the RFC specifies no catch. Separately,
collector failures reopen the supposedly generated closure as `projection:string`, allowing a
failure to be attributed to an undeclared producer.

**Required repair:** close the adapter/failure correlation. Either the default adapter is the only
production value and test adapters are wrapped into a typed internal failure, or injection itself
uses a sealed interface. Generate the failure projection union from the executable collector
registry and cross a rejecting yield plus an undeclared projection.

## B7 — FEN-only requests cannot enforce the stated variant refusal ([[D2103]])

The RFC admits the packet would compile variant positions with two standard-only meanings and says
Tier-2 use is refused until D6. The request/key contain no ruleset or standard-only literal, and the
legal authority constructs `chessops` `Chess` directly. The same FEN can require different castling
semantics under standard chess and Chess960, so FEN alone cannot select or refuse the ruleset.

**Required repair:** make v1's standard-only ruleset an explicit admitted request/service identity
and reject unsupported variants, or add a typed ruleset authority to the request, key, legal move
compiler and collector registry. A prose discharge cannot prevent silent standard interpretation.

## B8 — receipt identity does not retain the source of abstentions ([[D2104]])

Each packet row carries abstentions, but `CandidatePopulationReceipt.candidateInputs` and the private
constructor retain only event/reading references. The receipt therefore cannot prove an abstention
came from the exact unavailable collector result rather than being selected from the generated
allowed-reason map. This is precisely the unavailable-versus-no-match distinction the repair is
meant to preserve.

**Required repair:** retain exact closed collector-result references (or an equivalent sealed
per-call receipt) for every abstention and validate row projection/reason against them. Cross a valid
reason copied to the wrong move/projection as well as available-empty versus unavailable.

## Re-review order

1. Publish the exported generic service/factory and exact scope-correlated operation map.
2. Publish the executable collector registry and close abstention/failure authority over it.
3. Add bounded concurrency/queue/shutdown semantics and scheduler-failure handling.
4. Make standard-only ruleset admission explicit.
5. Remove the premature provider handoff or serialize behind accepted provider exchange.
6. Invert all eight arms, preserve the 20 prior checks, run full verification, then request fresh
   independent review.

No runtime packet, cache, provider handoff, selector, schema, content or learner surface work is
authorized by this return.
