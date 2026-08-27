# Non-Maia selector data readiness — source and projection/cost arms

**Question:** can the public data source support a reproducible, context-aware human-choice training
population without touching the reserved D1297 confirmation set?

**Verdict:** the source itself is not the blocker `[V]`. The frozen 256 MiB range from the June 2026
Lichess standard rated dump yielded 827,067 complete games and 48.47 million eligible decisions;
legal replay was 100%, rating coverage 100%, and clock/time-control coverage 99.9481%. All 36
predeclared roster cells exceed the 10k learning-curve rung (minimum 13,809). The official
database is CC0 and documents ratings, clocks, bot titles and variant tags `[V]`
([Lichess open database](https://database.lichess.org/)).

That does **not** fund the model. The v1 population gate referred to “preregistered cells” but
never enumerated its rating bands. Depending on an after-the-fact interpretation, the exact same
result either passes every 1000–2199 cell or fails under-1000 and 2200-plus rapid cells. The source
arm is therefore accepted while the population-cell verdict is withheld. The correction freezes
four roster-derived bands and a 256 MiB successor prefix before that range was downloaded; the
repaired gate then passed.

## What was measured

The disposable harness drops the incomplete tail of the partial Zstandard frame, parses every
complete game, excludes Bot API players and unfinished games, replays the mainline with chessops,
and emits aggregate counts only. Its schema contains no game ID, player name, SAN/UCI, FEN or
per-position row. Synthetic controls verify that missing rating/time-control values remain explicit
rather than becoming zeros.

The initial 119.7 MB decompressed prefix covered only 41 minutes of one day and exposed the gate
defect. The final 1.92 GB range covered 9h46m and supplied:

- 823,782 eligible, legally replayed games and zero illegal replays;
- 48,470,810 decisions at plies 8+;
- all 36 cells of the frozen 1000–2599 × bullet/blitz/rapid scope above 10k;
- 13,809 / 34,869 / 59,731 decisions at the sparsest 2200–2599 rapid opening / middle / late cells.

These windows are sampling strata, not semantic opening/middlegame/endgame classifications. The
names remain explicit so the bot model cannot turn a ply boundary into a chess claim.

## Projection and cost arm

The preregistered projection arm sampled five minimum-hash positions in each of the 36 cells (180
positions, 5,664 legal candidates), without reading the played move. It requested genuine complete
Stockfish 18 depth-2 roots and invoked the shipped `candidateFeatureVector` over each exact legal
set. The candidate-weighted success rate is **5,347/5,664 = 94.403%**, failing the frozen ≥99%
gate `[V]` (`planning/platform-alignment/bot-policy/d1329-projection-cost-results.json`).

All 317 failed candidates belong to 11 roots containing a Stockfish mate score. The root parser
refused rather than coercing cp and mate; the shipped adapter accepts only finite `scoreCp`
(`apps/server/src/candidate-evidence.ts:72-76,198-205`) `[V]`. No semantic collector exception was
observed. The failure therefore narrows the blocker to the already-ledgered D195 typed-score gap:
the shared candidate source must represent cp/mate domains before this exact census is rerun.

The cost result independently refuses generic evidence flattening as the model schema. Across 169
completed positions it produced 3,376,630 non-zero scalars / 249,314,807 encoded bytes / 2,370
names, taking 101.474 seconds in the evidence projection versus 1.463 seconds in the fixed depth-2
engine roots `[V]`. Linear projection is 166.788 single-process hours and 1,373.920 GiB of generic
JSON at one million decisions. Even a **cardinality-only** cap of 16 fields per emitted projection
prices at 1,027.276 GiB; this selects no useful features and is not a compact contract. D1299's
registered projection-balanced interface is a prerequisite, not an optimization.

## What remains

1. Land the typed cp/mate shared candidate-score contract already owned by D195/D1636, then rerun
   this unchanged 36-cell census; never convert mate to an arbitrary centipawn sentinel.
2. Research and preregister a compact, projection-balanced model view. Rich evidence remains
   available to learner surfaces; the bot view must not inherit producer verbosity as capacity.
3. If and only if the ≥99% projection gate passes, price the compact view and ask the owner for a
   compute/storage ceiling.
4. Sample any future training corpus across the month; the chronological prefix establishes
   capacity, not representativeness. Only then preregister a game-grouped learning curve.

**Limits:** the prefix is chronological rather than a month-wide random sample; it establishes
availability and pipeline mechanics, not population representativeness. Depth 2 prices plumbing,
not a production scoring bound. The fresh source is standard chess only; it says nothing about
variant human-policy availability. No model was fitted and no external model result was reproduced.
