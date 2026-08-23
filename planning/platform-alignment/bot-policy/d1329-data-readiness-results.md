# D1329 data readiness — source arm

**Verdict:** source mechanics and the repaired 36-cell population gate pass. Projection
coverage/cost and the owner compute budget remain unmeasured.

## Fresh source

- Official June 2026 Lichess standard rated dump, CC0.
- Fixed 16 MiB compressed prefix:
  `sha256:efe8177e738959ea7c70b5f07038103bf89591949b99a4260dd99b231311bd9a`.
- 119,668,736 decompressed bytes; one incomplete trailing game dropped.
- 50,992 complete games spanning 00:00:00–00:41:27 UTC on 2026-06-01.
- 50,818 eligible non-bot finished games; 160 bots and 14 unfinished games excluded.
- 50,818/50,818 replay legally; zero replay failures.
- 3,021,344 eligible ply-window decisions.
- rating coverage 100%; time-control and `%clk` coverage 99.9704%.
- Aggregate census: 5.892 s, 19.369 decompressed MiB/s, 8,654 games/s on this machine. This is PGN
  parsing/replay throughput, not evidence-projection throughput.

Machine-readable receipt: `d1329-data-readiness-results.json`.

## Frozen 256 MiB successor

- Compressed digest:
  `sha256:399d79b546e045fa3e6706efddd723202c6b00a4c335398e5526c73114abff4d`.
- 1,921,777,664 decompressed bytes; one incomplete trailing game dropped.
- 827,067 complete games spanning 00:00:00–09:46:27 UTC on 2026-06-01.
- 823,782 eligible games / 48,470,810 eligible decisions; 3,189 bots and 96 unfinished games
  excluded; zero illegal replays.
- rating coverage 100%; time-control and `%clk` coverage 99.9481%.
- all 36 frozen roster cells exceed 10,000 decisions. Minimum: **13,809** at
  `2200-2599/rapid/opening-8-16/standard`.
- Streaming aggregate census: 95.556 s, 19.180 decompressed MiB/s, 8,655 games/s. Peak corpus
  retention is one PGN block; no game record enters the artifact.

## Gates

| Clause | Result |
|---|---|
| CC0, reproducible URL/range/digest | pass |
| ≥99.5% legal replay | pass — 100% |
| ≥95% rating/time-control identity | pass — 100% / 99.9704% |
| clock-aware arm ≥95% clock coverage | pass — 99.9704% |
| every declared cell reaches 10k | pass after v2 repair — 36/36; minimum 13,809 |
| mandatory projection success ≥99% | pending projection arm |
| 1m cost fits owner budget | pending projection arm + owner budget |

The v1 ambiguity changed the apparent answer. All 27 cells in the prior D1162 scope—ratings
1000–2199 × bullet/blitz/rapid × three windows—exceed 10k (minimum 12,151). If “all emitted bands”
is read literally, under-1000 bullet/rapid opening and every 2200-plus rapid window fail. Neither
interpretation was chosen after seeing the counts. V2 derived its band edge from D970 and committed
the range before download; that result is the binding population reading.

## Bound successor

The v2 plan derived four bands from the production roster boundary rather than these outcomes:
1000–1399, 1400–1799, 1800–2199, 2200–2599; three speeds; three windows. A fixed 256 MiB prefix is
the final source-size census. Under-1000, 2600-plus and `other` remain reported but are not silently
pooled into a roster cell. The threshold remained 10k and passed without another resize.

No model was fitted. No game, player, position or move identity enters either result artifact. The
reserved D1297 population was not read.
