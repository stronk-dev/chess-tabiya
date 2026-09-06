# D2903 — paired human endgame reference screen

**Opened:** 2026-09-06
**Authority:** [[D2903]], [[D2237]], `design/research/endgame-bot-king-activity.md`
**Status:** measurement complete; independent reference sufficient; exact transform refused

## Question

On the same exact late-game positions, does the refused global `king_move` ×4 direction move Maia
toward or away from the observed human move class and exact move after an exact tablebase-result
guard? Is the committed external sample large and two-sided enough to count as an independent
endgame reference at all?

This is a transfer screen. D2902's pooled reach verdict remains failed whatever this screen finds.
The screen cannot establish strategic king activity, endgame technique, a personality, perceived
human-likeness, a rating, or multi-ply coherence.

## Stage 1 — committed-fixture capacity screen

Use only `tools/r2-selection-harness/imported-sample.pgn` at its digest recorded in
`tools/r2-selection-harness/fixture.json`. That fixture contains 108 complete rated standard
Lichess games selected before this question across speed and rating cells. Do not download a more
favorable replacement.

Replay every game legally. Candidate decisions must satisfy all of:

- ply 41 or later;
- 3–7 pieces before the human move;
- non-terminal standard position;
- mover Elo in 1400–2199;
- the recorded human move is legal from the exact full FEN.

Choose at most one decision per game: the minimum SHA-256 of
`game fixture bytes + NUL + ply + NUL + full FEN`. Selection happens before Maia or tablebase
results are read. Map 1400–1799 to Maia band 1400 and 1800–2199 to band 1800. Retain source game
ordinal, ply, speed, rating interval and piece count; never retain or publish usernames.

The human reference is sufficient only if the safety-compatible population contains at least 30
distinct games, at least 10 in each Maia band and at least 10 observed king moves plus 10 observed
non-king moves. Otherwise the result is `insufficient_human_reference`; descriptive counts remain
useful and no mechanism proceeds.

The pre-provider screen ran after this rule was frozen. It found only five distinct eligible games:
two in band 1400, three in band 1800, two observed king moves and three non-king moves. Stage 1 is
therefore insufficient and no provider call is permitted on it. `[V]`
(`make bot-human-endgame-reference-contract`)

## Stage 2 — frozen source expansion

The failed small fixture does not justify a new source. Reuse the exact upstream population already
frozen and measured by D1329:

- official June 2026 standard-rated Lichess dump, CC0;
- compressed range `bytes=0-268435455`;
- compressed SHA-256 `399d79b546e045fa3e6706efddd723202c6b00a4c335398e5526c73114abff4d`;
- decompressed SHA-256 `89d444ea00e073ee17d6a02747a7c9da12fe49c949d5b407c9e0d0a60b7d81ea`;
- 827,067 complete game blocks, of which 823,782 passed the prior legal replay.

`[V]` (`planning/platform-alignment/bot-policy/d1329-data-readiness-results.json`)

Stream the range and retain no player name or raw game in the result. Apply the same per-game
eligibility and candidate selection above, narrowed to rated blitz to match the frozen D2236 human
comparator. After choosing at most one decision per game, take the 64 lowest deterministic
selection hashes in each band, where the global key is SHA-256 of
`gameHash + NUL + ply + NUL + full FEN`. This produces at most 128 distinct games without reading
Maia, tablebase, result, move quality or later bot output. Record the eligible pool and the selected
king/non-king split rather than balancing on the observed class.

The same pre-provider floor applies. If either 64-game band cannot fill or the selected sample has
fewer than ten observed moves of either class, provider work stops. The post-tablebase
safety-compatible population must still retain at least 30 distinct games, ten per band and ten per
class; this second floor is not implied by source capacity.

The frozen stream produced 128 distinct games, 64 in each band, with 52 observed king moves and 76
observed non-king moves. The eligible population before global selection contained 17,319 games in
band 1400 and 13,789 in band 1800. This clears only the source-capacity floor; it says nothing about
provider completeness, safety compatibility or score direction. `[V]`
(`planning/bot-roster/d2903-human-endgame-population.json`)

## Exact joins and policy algebra

For each selected FEN:

1. obtain one complete exact Syzygy result with every legal successor;
2. probe the production Maia sidecar at the mapped band with temperature 0.8, top-p 0.92 and
   MultiPV 20;
3. normalize and apply the production temperature/top-p truncation exactly;
4. join every retained UCI candidate and the observed human UCI to the same exact legal map;
5. record whether the human move preserves the exact mover-relative root Syzygy category;
6. keep only sampled moves whose exact mover-relative category equals the root category;
   guard-empty cells abstain;
7. multiply guarded king moves by four and renormalize.

“Exact category” means the five-state Syzygy result vocabulary — `win`, `cursed-win`, `draw`,
`blessed-loss`, `loss` — without collapsing cursed/blessed results into win/draw/loss. Unknown,
approximate or provider-specific categories fail closed. This is a same-result guard, not a claim
that all retained moves are equally good inside a category.

Missing, duplicate, illegal, mismatched-FEN or unmapped moves fail closed. Provider unavailability
is typed and counted, never treated as a non-king move or a loss.

## Measures and verdict

Report before any interpretation:

- selected, provider-complete, guard-empty and safety-compatible distinct games;
- human WDL-preserving rate and the exact count excluded by the safety boundary;
- observed human king-move rate versus guarded Maia king mass, pooled and by band/root WDL/piece
  count;
- Bernoulli log loss and Brier score for the observed human king/non-king class under guarded and
  transformed mass;
- exact observed-move negative log probability under guarded and transformed distributions,
  reporting separately any human move absent from the retained page;
- paired per-game score deltas with a deterministic 2,000-resample game bootstrap interval;
- the D2902 authored-path result beside, never pooled with, this external population.

Only safety-compatible cells enter score comparison. Exact-move NLL has its own retained-page floor:
at least 30 exact human moves overall and at least 10 per band must carry positive guarded mass.
Absent moves and zero observed-class probabilities are counted literally; no epsilon is permitted.
A zero observed-class probability has infinite log loss and prevents a promising verdict.

A transformed direction is promising only if the human reference is sufficient, the exact-move
retained-page floor passes, neither arm has an infinite class loss, both class log loss and Brier
improve, exact-move NLL does not worsen, and all three paired 95% bootstrap intervals exclude zero
in the required direction.
Anything else is refused or insufficient. A promising result funds a new preregistered semantic
mechanism; it does not change the refusal of global ×4 and earns no profile/card/copy.

## Able-to-fail controls

- deterministic selection is invariant to PGN game order and provider response order;
- a human king move rewards increased king mass while a human non-king move penalizes it;
- a transform that improves class score but worsens exact-move NLL fails the conjunction;
- a root-winning human move that only draws is retained in the all-human accounting but excluded
  from safety-compatible scoring;
- an unmapped Maia or human move fails closed;
- an absent retained human move is counted and cannot be assigned epsilon probability silently;
- 29 games, a one-band population or fewer than ten observations of either class returns
  `insufficient_human_reference`.

## Reproduction and next action

One normal `make bot-human-endgame-reference-contract` target owns committed-fixture extraction,
pure scoring and all able-to-fail controls without providers. One normal
`make bot-human-endgame-reference-population` target downloads only the exact frozen range, verifies
both source digests, streams the privacy-minimized Stage-2 selection and writes its checked
population receipt. If that receipt clears the pre-provider floor, one normal
`make bot-human-endgame-reference` target may capture the exact provider inputs and write the final
result. If it does not, the expensive/provider arm must not run merely to produce a number.

## Result

The Stage-2 source clears its pre-provider floor at 128 games, 64 per band and 52/76 observed
king/non-king moves. All 128 tablebase and matched-band Maia pages completed; 126 human moves
preserve the exact root category and 109 retain positive guarded Maia mass, clearing both scoring
floors. The transform is refused: paired Brier worsens +0.026759 with 95% interval
[0.006186, 0.046750], exact-move NLL worsens +0.052151 on average and two observed-class log losses
are infinite without smoothing. `[V]`
(`planning/bot-roster/d2903-human-endgame-reference-results.json`)
