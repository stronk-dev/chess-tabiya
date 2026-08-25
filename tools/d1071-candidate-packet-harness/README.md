# D1071 candidate-packet harness

Disposable research instrument. It checks whether the implemented opponent candidate vector is
complete and whether it preserves the sealed semantic-event identity needed by bot policy and
Guided Hint. It does not query an engine and is not production code.

Run:

```sh
pnpm exec vitest run --config tools/d1071-candidate-packet-harness/vitest.config.ts
```

The instrument deliberately supplies only two of the initial position's twenty legal moves and
uses arbitrary finite scores. Acceptance is the finding: the current adapter proves legality of
members, not completeness or engine provenance.

## `population-integrity.test.ts` — added 2026-08-23 while drafting `rfc/shared-candidate-evidence-packet.md`

`candidate-packet.test.ts` falsifies the **opponent adapter**. This second file falsifies the other
half of the same claim — that the *shipped selection path* already owns a complete candidate
population. It does not, and the failure mode is the dangerous direction. Its findings, all at HEAD:

1. `legalAlternativeEdges` is complete but **excludes the committed move** (34 legal → 33
   alternatives), which is right for a counterfactual denominator and wrong for a population.
2. `evaluatedAlternatives` is `alternatives.length` passed twice (`semantic-evidence.ts:1054`), so a
   caller whose `evaluateAlternative` returns `[]` for every edge is still reported as having
   evaluated **33 of 33**.
3. That unevaluated population is **flattering**: every played event scores a `0.000` same-family
   share, so two families the complete population rejects as `nothing_distinctive` are selected
   instead. Answering every alternative with the played edge's own events is also accepted; the
   anchor dedupe bounds the inflation at one, it does not refuse it.
4. `localSemanticEvents` composes ten event families, `selectLocalSemanticEvidence`'s inline closure
   eight — so the two shipped enumerators select **different evidence for the same move**.

The file asserts each of these, so it turns red when the RFC's repair lands. That is intended: it is
a falsifier, not a regression suite.

## `buildability-envelope.test.ts` — added 2026-08-26 for D1573/D1574

This file measures complete one-edge populations across the fixed 64-position D1061 sample. It
records legal moves, sealed-event count, compile time and JSON structural bytes per root, then
compares the observed projection set with the declared semantic-event catalogue. Structural JSON
bytes are a reproducible size proxy, not V8 heap usage. The sample is deliberately expected to
miss declared families: that negative control demonstrates why a position sweep may measure
prevalence and cost but may not define the compiler's closed emitter vocabulary.

## `node24-memory-envelope.test.ts` — added 2026-08-26 for D1573

This file is the pre-acceptance release-envelope instrument for the proposed packet and cache
shape. It compiles the exact event-only and event+reading scopes, measures one cold compile and
same-id warm cache read, and fills an 8-entry/56,000-retained-weight LRU with the sixteen
highest-legal-count D1061 roots, and records structural bytes plus V8 heap/RSS deltas after forced
GC. The first equal-item trial showed that one reading retained about 4.31 times one event's
incremental heap, so the corrected trial uses `events + 5 × readings`; it also reports the two
categories separately. It deliberately duplicates the currently server-private `childReadings` authority inside the
disposable harness; the RFC's implementation criterion requires that duplicate to disappear when
the authority moves into runtime.

The equal-item full-scope arm remains as an executable negative control. The corrected full-scope
arm runs separately with the calibrated coefficient, so the receipt preserves both the falsifier
and the proposed repair rather than overwriting the bad result with a better default.

Run the receipt under the repository's release Node major:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1071-candidate-packet-harness/vitest.config.ts \
  tools/d1071-candidate-packet-harness/node24-memory-envelope.test.ts
```

For an acceptance receipt, run the cold/warm arm and each scope arm as three separate invocations
with Vitest's `-t` filter. That gives each heap/RSS delta a fresh process instead of comparing one
scope against V8's allocator high-water mark from the previous scope.
