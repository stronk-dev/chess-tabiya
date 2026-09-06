# Paired human endgame reference for bot king-move bias

**Question:** [[D2903]] / [[D2237]], independent human reference for the refused endgame
`king_move` ×4 transform
**Date:** 2026-09-06
**Instrument:** `tools/d2903-human-endgame-reference/`
**Status:** measurement complete; the direction is independently refused

## Verdict

The independent human reference is sufficient and rejects, rather than rescues, the global
king-move ×4 direction. On 126 safety-compatible human decisions, the observed king-move rate is
41.27% and guarded Maia assigns 41.02% mean mass to king moves. The transform raises that mass to
46.48%, moving an already close aggregate away from the observed rate. `[V]`
(`planning/bot-roster/d2903-human-endgame-reference-results.json`)

The paired Brier-score delta (transformed minus guarded) is **+0.026759**, with a deterministic
game-bootstrap 95% interval of **[+0.006186, +0.046750]**: the transform is worse across the entire
interval. Exact observed-move NLL also worsens by +0.052151 on average, with interval
[−0.002223, +0.108322], so it fails the non-worsening conjunction even without claiming a
significant exact-move effect. Two safety-compatible games have literal infinite observed-class log
loss; the instrument records the infinities and refuses to substitute epsilon, so the log-loss arm
cannot pass. `[V]` (same result)

This closes the independent-reference gap for this exact mechanism only. D2902's authored-path
reach failure remains intact, and D2903 now adds an external same-FEN human-move refusal. Literal
king-move identity remains valid shared evidence for Support, Review, drill conditions and future
semantic bot mechanisms. The result licenses no global multiplier, bot profile, personality name,
rating, strategic king-activity claim or general human-likeness copy. `[M]` (contract
interpretation)

## Population and exact join

The source is the exact checksum-pinned first 256 MiB of the official June 2026 Lichess
standard-rated CC0 dump already frozen by D1329. A streaming extractor replayed 827,067 complete
game blocks, retained no username or raw game, selected at most one late 3–7-piece blitz decision
per game before provider results, and then took the 64 lowest deterministic hashes in each Maia
band. The selected 128 distinct games contain 52 human king moves and 76 non-king moves. `[V]`
(`planning/bot-roster/d2903-human-endgame-population.json`)

Every selected FEN receives a complete legal-successor Syzygy page and a production Maia-3
MultiPV-20 page at the matching 1400 or 1800 band, temperature 0.8 and top-p 0.92. Fifteen transient
HTTP-429 attempts were retained in the provider-input digest; retries completed all 128 exact FENs
before scoring. Two human moves change the mover-relative five-state Syzygy category and are
excluded by the preregistered safety boundary. No guarded Maia distribution is empty. The final
score population is 126 games: 64/62 by band and 52/74 king/non-king. `[V]`
(`planning/bot-roster/d2903-human-endgame-reference-plan.md`; result `population`)

The exact-move arm is separately non-vacuous: 109 observed human moves carry positive retained Maia
mass, 53/56 by band, clearing the frozen 30-total/10-per-band floor. Seventeen observed moves are
absent from the top-p/MultiPV retained page and are counted rather than assigned artificial mass.
`[V]` (result `population`)

## Why this does not become a different positive claim

Aggregate agreement before transformation is descriptive, not proof that Maia is calibrated for
human endgames: the screen measures one binary move class on a deterministic two-band sample.
Likewise, the losing-root stratum has many more human king moves than the winning-root stratum, but
those strata were not preregistered as independent mechanisms and do not authorize outcome-specific
weights after reading the result. `[V]` (result `summary.byRootCategory`); `[M]` (scope
interpretation)

A successor may test an explicitly semantic condition — for example, king opposition or escorting
a passer when an exact opportunity exists — but it needs its own frozen opportunity denominator,
human comparator and multi-ply consequence gate. Relabeling the global move-class multiplier as
“active king” would manufacture chess meaning from piece identity and is forbidden. `[M]`

## Limits and next work

- The deterministic sample is broad enough for the frozen transfer screen, not a prevalence
  estimate for all Lichess endgames or all rating bands. `[V]` (selection contract)
- Bare-FEN Maia probes cannot test clock state, repetition history or prior-plan continuity. `[V]`
  (`planning/bot-roster/d2903-human-endgame-reference-plan.md`)
- The screen is one-ply and cannot establish coherent technique, fun, recognizability or learning
  value. `[M]`
- Full 1.0 bot depth still needs phase/clock/history mechanisms, semantic endgame opportunities,
  multi-ply coherence and calibration of every behavior digest. `[M]`
