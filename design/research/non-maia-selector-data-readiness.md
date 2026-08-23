# Non-Maia selector data readiness — fresh-source arm

**Question:** can the public data source support a reproducible, context-aware human-choice training
population without touching the reserved D1297 confirmation set?

**Verdict:** the source itself is not the blocker `[V]`. The frozen 256 MiB range from the June 2026
Lichess standard rated dump yielded 827,067 complete games and 48.47 million eligible decisions;
legal replay was 100%, rating coverage 100%, and clock/time-control coverage 99.9481%. All 36
predeclared roster cells exceed the 10k learning-curve rung (minimum 13,809). The official
database is CC0 and documents ratings, clocks, bot titles and variant tags `[V]`
([Lichess open database](https://database.lichess.org/)).

That does **not** yet fund the model. The v1 population gate referred to “preregistered cells” but
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

## What remains

1. After Claude's collector implementation is stable, measure mandatory producer success,
   projection cardinality, wall time and bytes on a deterministic outcome-blind sample.
2. Price 10k/100k/1m feature populations and ask the owner for a compute/storage ceiling.
3. Sample any future training corpus across the month; the chronological prefix establishes capacity,
   not representativeness.
4. Only then preregister a grouped learning curve. No set-dependent model exists yet.

**Limits:** the prefix is chronological rather than a month-wide random sample; it establishes
availability and pipeline mechanics, not population representativeness. Parsing throughput excludes
evidence collection and engine scoring. The fresh source is standard chess only; it says nothing
about variant human-policy availability. No external model result was reproduced.
