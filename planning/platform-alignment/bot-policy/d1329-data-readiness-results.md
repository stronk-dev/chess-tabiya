# D1329 data readiness — source arm

**Verdict:** source mechanics pass; population-cell gate is **not yet decidable** because the v1
plan failed to enumerate the rating bands it called “preregistered.” Projection coverage/cost and
the owner compute budget remain unmeasured.

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

## Gates

| Clause | Result |
|---|---|
| CC0, reproducible URL/range/digest | pass |
| ≥99.5% legal replay | pass — 100% |
| ≥95% rating/time-control identity | pass — 100% / 99.9704% |
| clock-aware arm ≥95% clock coverage | pass — 99.9704% |
| every declared cell reaches 10k | **criterion defect** — v1 never declared the band set |
| mandatory projection success ≥99% | pending projection arm |
| 1m cost fits owner budget | pending projection arm + owner budget |

The ambiguity changes the apparent answer. All 27 cells in the prior D1162 scope—ratings
1000–2199 × bullet/blitz/rapid × three windows—exceed 10k (minimum 12,151). If “all emitted bands”
is read literally, under-1000 bullet/rapid opening and every 2200-plus rapid window fail. Neither
interpretation may be chosen after seeing the counts.

## Bound successor

The v2 plan now derives four bands from the production roster boundary rather than these outcomes:
1000–1399, 1400–1799, 1800–2199, 2200–2599; three speeds; three windows. A fixed 256 MiB prefix is
the final source-size census. Under-1000, 2600-plus and `other` remain reported but are not silently
pooled into a roster cell. The threshold remains 10k; no further prefix resizing is allowed.

No model was fitted. No game, player, position or move identity enters either result artifact. The
reserved D1297 population was not read.
