# R12 player-style short-session results

The frozen arm contains 36 non-bot accounts, 12 in each of three rating bands, with 200 rated
standard blitz games each. It measures 261,892 learner decisions and uses 2,573,111 legally parsed
same-band reference games for opening commonness. Raw usernames, PGNs and per-decision traces remain
in `/private/tmp`; this directory contains only aggregates.

| Metric | persistent floor | split-half rho at 200 | result |
|---|---:|---:|---|
| opening surprisal | 25 | 0.974 | retain for short-session prototype |
| opening-family entropy | 100 | 0.935 | retain |
| fianchetto setup | 25 | 0.865 | retain |
| fianchetto knight screen | 200 | 0.757 | retain at ceiling only |
| fianchetto unblock | — | 0.188 | refuse |
| castle kingside | 50 | 0.896 | retain |
| castle queenside | 50 | 0.907 | retain; first-pass floor 12 was non-persistent |
| clock spend: opening | 100 | 0.950 | retain |
| clock spend: middlegame | 50 | 0.971 | retain |
| clock spend: endgame | 25 | 0.932 | retain |
| pawn-choice residual | 100 | 0.932 | retain |
| forcing-choice residual | — | 0.904 | refuse; band/median-side gate fails at 200 |
| centre-pawn residual | 200 | 0.871 | retain at ceiling only |
| early-queen residual | 100 | 0.931 | retain |
| non-pawn-capture residual | — | 0.881 | refuse; median-side gate fails |
| opponent-reply-breadth residual | — | 0.855 | refuse; band/median-side gate fails |

The 12-dimensional retained vector re-identifies 35/36 accounts across disjoint halves (97.2%);
rotating identity labels produces 0/36. Five-fold ridge prediction of within-band rating has
`R² = -0.296`, while the injected rating positive control has `R² = 1.0`.

No archetype count passes. Across k=4–12, median bootstrap ARI ranges 0.251–0.417 against a 0.70
gate; most solutions also contain a one-account cluster. The supported output is therefore a set of
continuous, named habits with per-metric sample floors and intervals—not a natural “player type.”

The full pass table is regenerated as `/private/tmp/r12-results.json` by the disposable harness.
This result is limited to highly active blitz accounts observed inside one 59-hour window; it does
not establish stability across weeks, time controls, repertoire changes or ordinary play cadence.
