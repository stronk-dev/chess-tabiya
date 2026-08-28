# Provider exchange and execution — repeat buildability return

**Reviewed:** 2026-08-28

**Reviewer:** codex

**Document:** `rfc/provider-exchange-and-execution.md` after the [[D1871]]–[[D1878]] and
[[D1943]]–[[D1944]] amendments

**Verdict:** **RETURNED AGAIN.** The amendments repair the original eight findings at the source
boundary, but six literal seams still let an implementation drop provenance, invent unreachable
states or satisfy the operation census with incompatible/private shapes. Implementation remains
unauthorised.

## Method

The repeat pass read the complete amended RFC and its author handoff, the original independent
return, and the evidence-execution, provider, Explorer, promotion-race and bounded-target closure
dossiers. It then re-derived the amended types against:

- the shipped F1 projection/derivation/binding compiler;
- `EngineSupervisor`'s serialized UCI execution and health/identity boundary;
- the live Maia request construction in `OpponentSelector`;
- both Explorer parsers/caches and the Syzygy source/cache;
- the amended subject-availability, scheduler request/result maps and four promised migration
  operations.

The disposable reproduction instrument is
`tools/d1950-provider-exchange-repeat-review/`; all six arms run through
`make provider-exchange-repeat-review`. It describes the returned checkpoint rather than replacing
the author repair's required crossed positive/negative fixtures.

## What survives

The architectural direction still survives: one shared scheduler, typed source receipts,
same-exchange engine provenance, compiled source paths, source-specific absence, literal sparse
Explorer truth, and distinct history-conditioned/exact-FEN Maia requests. Those remain the correct
foundation for Support, Review, bots, drills and future longitudinal analysis. The return is about
making that boundary closed enough that implementations cannot recreate private authorities.

## Blockers

### 1. Maia derivations drop the complete delivery ([[D1950]])

Section 3 says every provider-derived projection must retain the admitted
`ProviderEvidenceDelivery<T>` input and explicitly forbids stripping the receipt. Section 6 then
types both `MaiaRunMoveOccurrence.page` and `MaiaExactFenMoveOccurrence.page` as bare
`MaiaPolicyPage`. A conforming implementation can therefore discard acquisition identity,
generation, response digest and live-versus-retained state while satisfying the literal occurrence
type.

Type the occurrence input as the sealed delivery (or a compiler-owned admitted-delivery receipt)
and cross live/retained, generation and receipt-stripping fixtures.

### 2. Explorer `not_requested` cannot be constructed truthfully ([[D1951]])

`ExplorerPositionPageRequest` always contains `historyWidth: number`; normalization rejects
non-positive widths. `ExplorerReportedHistory` nevertheless contains `not_requested`, with no
request discriminant that can select it. The implementation must either report `not_requested`
after requesting history or leave the union arm unreachable.

Use a closed disabled-versus-requested request union. Only the requested arm carries a positive
bounded width. Distinguish disabled, requested-but-empty and requested-with-rows in crossed
fixtures.

### 3. The operation boundary has two `execute` signatures ([[D1952]])

The exact mapped descriptor requires `execute(request, ProviderExecutionContext)`. The normative
Stockfish fixed-evaluation and Syzygy sections instead name `Operation.execute(request, signal)`,
and the composition census counts five operations without naming descriptor wrappers. An
implementer must choose whether the five operations are descriptors, are wrapped by descriptors,
or expose a second public execution path—the last option defeats the sole scheduler authority.

Publish one literal callable shape and make the exact descriptor map, application composition and
operation census compile those same exports.

### 4. One path state is not total over multiple source leaves ([[D1953]])

Current compiled paths already include more than one non-local leaf—for example Stockfish plus a
recorded engine point. `SubjectEvidenceAvailabilityResult` returns one scalar state for the whole
path but supplies no rule for retained+reachable, recorded+unavailable, or differently failing
providers. `reachable_live` is also not present satisfaction, so an unstated precedence can
silently turn partial reach into a satisfied path.

Return exact per-leaf states and derive a path result, or publish a closed aggregation algebra.
The crossed fixtures must cover mixed recorded/live/retained/unavailable leaves and identify which
leaf prevents satisfaction.

### 5. Maia pending and retained identities are conflated in prose ([[D1954]])

Sections 3–4 correctly state that pending identity contains only requested bytes and cannot contain
actual generation before execution. Section 6 then says the “complete key” includes both requested
and actual model identity. The request type contains no actual identity, so the sentence either
contradicts the scheduler or silently describes a second retained key.

Name the two identities separately: canonical pending/deduplication identity from request bytes,
and retained-admission identity from that pending key plus the captured actual model/generation.
Cold and restart fixtures must assert which key each stage can construct.

### 6. Explorer's two migration projections are prose-only ([[D1955]])

Section 8 promises `derived.explorer.population_summary@1` and
`derived.explorer.played_move_occurrence@1`; section 9 counts them among four migration operations.
Unlike the Maia occurrences, neither has a literal payload or callable signature. The implementer
must invent which source/request fields survive, how the full delivery is retained, the exact
run-position/move join, and the closed abstention result. Criterion 14 can therefore green on two
functions whose semantics differ.

Publish both payload/result types and callable signatures. The occurrence needs crossed run-head,
position and move negatives; the summary needs a raw-move sentinel plus source/delivery retention.

## Disposition

Return to the author for [[D1950]]–[[D1955]]. Preserve the original repaired shapes and replace the
six reproduction arms with crossed contract fixtures. Repeat review must re-run the live-symbol
operation/source census; a green `make provider-exchange-contract` remains necessary but is not
sufficient because its current eight arms mostly validate author-owned examples and RFC tokens.

No production, schema, pack, content or protected intent byte changed in this review.
