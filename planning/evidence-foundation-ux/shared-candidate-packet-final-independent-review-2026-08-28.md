# Shared candidate packet — final independent buildability return

**Reviewed:** 2026-08-28

**Reviewer:** codex

**Document:** `rfc/shared-candidate-evidence-packet.md` after the [[D1958]]–[[D1961]] author repair

**Verdict:** **RETURNED.** The complete, score-free legal population is still the correct shared
foundation beneath Support, Review, drills and bots. The private receipt authority, literal
conventions, complete legal-set identity and deliberately unconsumed landing all survive. Five
remaining boundaries are not implementable as written: the operation has no result algebra, held
provider work remains in foundation acceptance, the production yield is unnamed, the projector
admits impossible scope crossings, and a shipped collector erases unavailable as no-match.

## Method

The pass re-read the complete amended RFC, traced every public signature against the current
runtime symbols, checked the implementation surface against all 25 acceptance criteria, and
followed the `loose_piece` declaration from its rules result through the semantic wrapper into the
proposed packet closure. The five-arm executable reproduction is available as
`make candidate-packet-final-review`.

The review did not touch the concurrent D872 harness files or the untracked `planning/review/`
tree. It changes no production, schema, content, pack or protected intent byte.

## What survives

- One exact legal-move authority supplies every candidate, including promotion identities.
- The packet is factual, score-free, provider-free and process-local.
- Original declared readings and semantic events retain exact references; the packet does not
  counterfeit an aggregate F1 evidence value.
- Wide receipts may be projected without chess recomputation when the requested evidence is
  actually present.
- One process-owned bounded cache, complete-set equality and separate consumer joins are the right
  architecture.
- Landing the primitive with zero product consumers is honest under the owner's foundation-first
  ruling; it does not complete Support, Review, drills or bot play.

## Blockers

### 1. The service has no closed result or failure algebra ([[D1977]])

The only public operation is:

```ts
get(request: CandidatePopulationRequest, signal: AbortSignal): Promise<CandidatePopulationReceipt>
```

The same contract says last-waiter cancellation “returns `cancelled`” and non-terminal truncation
“fails with a typed error.” No type represents either statement. Invalid FEN, collector failure,
truncation, invariant failure and cancellation are therefore indistinguishable to a caller unless
an implementer invents throw strings. The injected yield, manifest and cache limits also lack one
literal service-options contract.

Repair: publish one discriminated operation result or a closed typed-error union with explicit
throw/return semantics. Cross every exit against receipt construction and cache publication.

### 2. Held provider work is required by foundation acceptance ([[D1978]])

§7.1 and §10 correctly say the bot score join does not ship here. §12 has no production definition
for `CandidateScoreJoin`. Acceptance criteria 15 and 17 nevertheless require the registered
legal-root operation, source-row score/loss algebra, mate ordering and proof that no child request
opened. The provider-free foundation cannot satisfy those criteria without implementing the held
D10 consumer or creating test-only code that proves no production integration.

Repair: keep only a compile-time handoff/interface compatibility check here and move the provider
join behavior to D10's consumer acceptance, or explicitly make the provider join a dependency and
part of this shipping surface. The current document cannot claim both.

### 3. “Portable macrotask yield” does not name production behavior ([[D1979]])

The amended RFC establishes collector-group yield points, which closes the earlier all-synchronous
defect in shape. It does not name the production Node adapter or constructor default. A resolved
Promise yields only to microtasks and cannot deliver timer-driven aborts. Conversely, a zero-delay
timer after every collector group across every legal move may become most of the packet latency.
The author control aborts inside its injected yield callback, so it proves the compiler checks after
the callback; it does not prove an independently scheduled timer or request abort can run.

Repair: name the exact production adapter (and where it is injected), publish the bounded group
topology in options, cross a real timer/`AbortController` delivery, and measure whole-operation
yield overhead as well as the 100 ms group maximum.

### 4. The projector type admits evidence fabrication by crossed scope ([[D1980]])

`projectCandidatePopulationReceipt(receipt, scope)` accepts every receipt and every scope. The
valid relation is partial: events+readings may narrow to either family, while events-only cannot
become readings-only and readings-only cannot become events-only. The public type and acceptance
criteria name only a successful wide→narrow path; an implementation must invent what the impossible
crossings do.

Repair: publish a literal source→permitted-target relation at type and runtime boundaries. Cross
both narrow→other-narrow cases and require them to fail before constructing an id or receipt.

### 5. Collector abstention is already erased before packet construction ([[D1981]])

The evidence declaration for `rules.tactic.event.loose_piece@1` permits
`invalid_turn_clone`. The rules function returns that exact unavailable result. Its semantic wrapper
then returns `undefined`, and `localSemanticEvents` changes it to `[]`. The RFC separately says
no-match emits no abstention. On this current closure, the packet cannot tell whether there was no
loose-piece transition or the collector could not evaluate the position, so downstream selection
can treat unknown as factual absence.

Repair: make each collector group return a closed events/readings-or-abstention result and preserve
the exact declared projection/reason in the candidate row. Add separate fixtures for unavailable
and an available hard negative with zero events. Generate reason vocabulary from the declarations,
but do not assume the current wrappers still carry the reason.

## Author repair order

1. Close the service result/error/options contract ([[D1977]]) and name the real scheduler yield
   ([[D1979]]); these determine the executable operation boundary.
2. Close scope projection as a partial order ([[D1980]]).
3. Preserve collector abstentions rather than flattening them ([[D1981]]).
4. Move held provider criteria to D10 or widen the actual shipping boundary ([[D1978]]).
5. Re-run `make candidate-packet-contract`, `make candidate-packet-repeat-review`,
   `make candidate-packet-final-review`, governance, and full `make verify`; then request fresh
   independent review.

No owner chess judgement is required. These are operation, authority and availability semantics.
Implementation remains unauthorized until the amended document survives a fresh review.
