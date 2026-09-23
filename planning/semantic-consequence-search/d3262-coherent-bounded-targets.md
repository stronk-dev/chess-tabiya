# D3262 corrected exact bounded target continuation

**Measured 2026-09-23.** Disposable research instrument, not a production
collector, bot policy, hint, or engine-reason compiler. Run
`make semantic-search-coherent-bounded-targets-check`. The checked artifact is
`d3262-coherent-bounded-targets.json`, SHA-256
`1d80b52dccb29ff3e6024c39156607a8cc93de7dee6c25e773823cef353b2ab8`.
It joins the separately frozen 193-candidate coherent-root profile, its complete
6,176-edge immediate legal-reply graph, and 182 named target comparisons (96
source-observed; 86 selected natural alternatives). Its exact-reply boundary
replays the candidate and requires set equality with every legal immediate
reply. No row exhausted the declared 25,000-node cap. `[V]`

The bounded target question is deliberately narrower than move quality. After
the candidate, does a **named** positive material capture or locally non-losing
minor arrival remain immediately available? If removed, can one opponent
preparation make it available again after at least one legal learner defence?
Does there exist a preparation for which it remains available after **every**
immediate legal learner defence? The search tracks the same pieces through
captures, moves, promotions and castling; a captured piece cannot silently
be replaced by another. This is an `exists preparation → forall defence`
question inside four plies, not a claim that the opponent will choose the
preparation or that the resulting move is strategically good. `[V]`

| Named target / selected candidate | Cells | Immediate preserved | Reintroduced within bound | One preparation survives every defence | Budget exhausted |
|---|---:|---:|---:|---:|---:|
| Material, source observed | 64 | 36 | 17 | 1 | 0 |
| Material, natural alternative | 30 | 16 | 12 | 0 | 0 |
| Minor destination, source observed | 32 | 0 | 29 | 7 | 0 |
| Minor destination, natural alternative | 56 | 55 | 0 | 0 | 0 |

These comparison cells share targets and roots; they are not independent games
or prevalence estimates. The source-observed destination move *creates* a
named controlling pawn, while most alternatives do not. Treat the resulting
asymmetry as a source-identity control, not a score for the source move. A
universal result covers the enumerated defences after one selected preparation
only; it does not establish an unlimited plan, root-move superiority, or an
engine's reason. `[V]`

## Source-control disagreement: captured controller retained as stale identity

All 96 source-observed **immediate** readings match the sealed D1023 predecessor.
Twelve **bounded** readings disagree, all in the destination family. In every
disagreement the new result contains a replayable legal preparation that
captures the named controlling pawn, including an en-passant capture. Eight
previously negative reintroduction readings become positive; seven previously
negative all-defence readings become positive (the sets overlap). The new
instrument checks all twelve legal witness lines and refuses any disagreement
without that named-pawn capture. `[V]`

The cause is visible in `tools/d1023-bounded-policy-harness/exact-target.test.ts`
`playDestinationTracking`: when `advanceIdentity` returns `undefined` for a
captured controller, `{ ...target, ...(controllingPawn === undefined ? {} :
{ controllingPawn }) }` retains the **old** `target.controllingPawn`. Subsequent
tracking sees that stale pawn absent and drops the line. The corrected evaluator
sets `controllingPawn: undefined` explicitly and retains the original minor
identity. The old source artifact remains immutable historical evidence; these
12 bounded outputs supersede its captured-controller readings only on this
separately frozen profile. `[V]`

## Consequence and remaining gate

Exact target persistence is now a measured semantic arm, not the full D3262
five-arm calibration. Provider-line occurrence, engine-ordered beam, configured
Maia frontier, and semantic reserve still need one comparable proof/abstention/
cost verdict on this coherent profile. Neither a bounded witness nor the
all-defence result licenses “why Stockfish recommends this” until same-root
counterfactual value, alternative contrast, perspective, source identity and
claim strength are joined and checked. `[M]`
