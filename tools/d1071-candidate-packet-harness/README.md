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
