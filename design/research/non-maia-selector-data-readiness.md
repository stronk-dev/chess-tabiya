# Non-Maia selector data readiness — fresh-source arm

**Question:** can the public data source support a reproducible, context-aware human-choice training
population without touching the reserved D1297 confirmation set?

**Verdict:** the source itself is not the blocker `[V]`. A fresh 16 MiB prefix from the June 2026
Lichess standard rated dump yielded 50,992 complete games and 3.02 million eligible decisions;
legal replay was 100%, rating coverage 100%, and clock/time-control coverage 99.9704%. The official
database is CC0 and documents ratings, clocks, bot titles and variant tags `[V]`
([Lichess open database](https://database.lichess.org/)).

That does **not** yet fund the model. The v1 population gate referred to “preregistered cells” but
never enumerated its rating bands. Depending on an after-the-fact interpretation, the exact same
result either passes every 1000–2199 cell or fails under-1000 and 2200-plus rapid cells. The source
arm is therefore accepted while the population-cell verdict is withheld. The correction freezes
four roster-derived bands and a 256 MiB successor prefix before that range is downloaded.

## What was measured

The disposable harness drops the incomplete tail of the partial Zstandard frame, parses every
complete game, excludes Bot API players and unfinished games, replays the mainline with chessops,
and emits aggregate counts only. Its schema contains no game ID, player name, SAN/UCI, FEN or
per-position row. Synthetic controls verify that missing rating/time-control values remain explicit
rather than becoming zeros.

The 119.7 MB decompressed prefix covered only 41 minutes of one day yet supplied:

- 50,818 eligible, legally replayed games and zero illegal replays;
- 3,021,344 decisions at plies 8+;
- all 27 cells of the old D1162 scope above 10k, minimum 12,151;
- insufficient evidence for the new 2200 roster edge in rapid play: 856 / 2,195 / 3,500 decisions
  across opening / middlegame-window / late-window cells.

These windows are sampling strata, not semantic opening/middlegame/endgame classifications. The
names remain explicit so the bot model cannot turn a ply boundary into a chess claim.

## What remains

1. Run the fixed 256 MiB v2 census against the declared 1000–2599 roster bands.
2. After Claude's collector implementation is stable, measure mandatory producer success,
   projection cardinality, wall time and bytes on a deterministic outcome-blind sample.
3. Price 10k/100k/1m feature populations and ask the owner for a compute/storage ceiling.
4. Only then preregister a grouped learning curve. No set-dependent model exists yet.

**Limits:** the prefix is chronological rather than a month-wide random sample; it establishes
availability and pipeline mechanics, not population representativeness. Parsing throughput excludes
evidence collection and engine scoring. The fresh source is standard chess only; it says nothing
about variant human-policy availability. No external model result was reproduced.
