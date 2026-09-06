# Endgame bot king-activity fixed-population screen

**Question:** [[D2902]] / [[D2237]], endgame bot behavior breadth
**Date:** 2026-09-06
**Instrument:** `tools/d2902-bot-endgame-trait-screen/`
**Status:** measurement complete; the exact global `king_move` ×4 transform is refused

## Verdict

The exact global transform does not clear its preregistered behavior-reach gate. Across 580
eligible position-band cells, the root-WDL-preserving tablebase guard leaves 60.70% of Maia's
sampled mass on king moves. Multiplying every guarded king move by four raises that share to
67.16%, a **6.47 percentage-point** change against the required 10 points. The diagnostic ×2 and
×8 arms move it by 3.21 and 9.51 points; neither can replace the frozen ×4 verdict, and even ×8
misses the same threshold. `[V]`
(`planning/bot-roster/d2902-endgame-king-activity-results.json`)

The exact guard does its narrower job: sampled root-WDL-worsening mass falls from 0.9345% before
the guard to zero after it and remains zero after transformation. The ×4 transform moves expected
absolute child DTZ from 10.1947 to 10.1501, a pooled shift of −0.0446; DTZ is reported only as an
outcome-local diagnostic, not converted into centipawns or a claim of better technique. `[V]`
(same result)

This is a scoped refusal of the global one-ply multiplier, not a refusal of king-move evidence.
`king_move` remains an exact board fact that may feed Support, Review, drills and a separately
preregistered phase- or outcome-specific bot mechanism. It does not itself mean centralization,
opposition, shouldering, escorting, activity or correct technique. `[M]` (contract interpretation)

This instrument contains no independent human reference: Maia is the policy being transformed and
cannot also serve as its comparator. D2903 subsequently supplied a checksum-pinned same-FEN human
sample and independently refused the same direction; neither result earns personality or human-like
copy. `[V]` (`human-endgame-bot-reference.md`); `[M]` (product interpretation)

## Population and reproduction

The population is the tracked R4 tablebase capture, not a newly selected success population. It
contains 257 historical rows: 196 complete, distinct, non-terminal positions and 61 typed HTTP-429
failures. The instrument probes the 196 complete positions at Maia bands 1400, 1600 and 1800 using
temperature 0.8, top-p 0.92 and MultiPV 20, producing 588 input cells. Eight cells have no
root-WDL-preserving retained candidate, so they abstain; 580 cells are measured. Zero candidates
are empty or unmapped. `[V]` (`tools/r4-difficulty-harness/out/tb.jsonl`;
`planning/bot-roster/d2902-endgame-king-activity-results.json`)

The guard joins every retained UCI candidate to the committed legal-successor tablebase record and
keeps only moves whose mover-relative result equals the root result. It never prices an absent move
as a loss or invents a fallback for a guard-empty cell. The result records the tablebase bytes,
probe set, captured Maia bytes and Maia handshake identities. `[V]`
(`planning/bot-roster/d2902-endgame-king-activity-plan.md`;
`tools/d2902-bot-endgame-trait-screen/trait-screen.test.ts`)

Able-to-fail controls establish that ×4 raises mass on a mixed synthetic cell, moves nothing on an
all-king cell, removes a WDL-worsening king move, refuses an unmapped candidate and abstains on an
empty guard. `[V]` (`tools/d2902-bot-endgame-trait-screen/trait-screen.test.ts`)

## Why the subgroup does not rescue the mechanism

The ×4 movement is consistent across Maia bands (6.67, 6.67 and 6.07 points), but not across root
outcomes. It is 10.82 points in winning cells, 8.36 in drawing cells and 1.50 in losing cells. The
losing stratum begins with 88.45% guarded king mass and is ceiling-bound. `[V]` (result
`summary.byBand` and `summary.byRootCategory`)

The preregistered verdict is pooled. Promoting only the winning subgroup after reading it would
change both mechanism and population after measurement. A win-scoped policy may be researched as
a new mechanism with its own frozen comparator and multi-ply consequence test; it is not evidence
that the tested global transform passed. `[M]` (preregistration discipline)

## Limits and next work

- These are correlated positions on authored endgame paths, not a random or player-representative
  endgame sample. `[V]` (`tools/r4-difficulty-harness/out/tb.jsonl`)
- Probes use bare FEN because the population has no honest preceding history. The screen cannot
  establish repetition-aware, clock-aware or history-dependent behavior. `[V]`
  (`planning/bot-roster/d2902-endgame-king-activity-plan.md`)
- The screen is one-ply. It says nothing about multi-ply coherence, conversion technique, fun or
  whether a learner perceives a distinct opponent. `[M]`
- The independent human reference is now measured and also refuses this direction. The next
  endgame-bot research must preregister a different semantic mechanism; it must not relabel this
  transform or tune its multiplier from the observed winning subgroup. `[V]`
  (`human-endgame-bot-reference.md`); `[M]` (scope interpretation)
