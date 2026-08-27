# D1329 data readiness — source and projection/cost arms

**Verdict:** source mechanics and the repaired 36-cell population gate pass. The projection gate
fails: the shipped candidate adapter covers 5,347/5,664 sampled legal candidates (**94.403%**),
below the frozen 99% floor, because it cannot represent a complete root containing a mate score.
No learning curve is funded and no owner compute/storage ruling is requested from this result.

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
| ≥95% rating/time-control identity | pass — 100% / 99.9481% on the binding range |
| clock-aware arm ≥95% clock coverage | pass — 99.9481% on the binding range |
| every declared cell reaches 10k | pass after v2 repair — 36/36; minimum 13,809 |
| mandatory projection success ≥99% | **fail — 5,347/5,664 candidates, 94.403%; 11 mate-domain roots exclude 317 candidates** |
| 1m cost fits owner budget | not reached — clause 6 fails; measured planning costs retained below |

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

## Projection and planning-cost result

The frozen arm selected five minimum-hash positions from each of the 36 cells without reading the
played move, then enumerated every legal move and requested one genuine Stockfish 18 depth-2 full
root before invoking the shipped `candidateFeatureVector`. It retained aggregates only. Of 180
positions, 169 completed. The other 11 all produced the declared `mate_score_unrepresentable`
failure; because the operation is all-or-nothing, their 317 legal candidates count as projection
failures. This is the measured consequence of the already-open centipawn-only candidate-score
contract (D195), not evidence that a semantic collector threw `[V]`.

The successful 169 positions emitted 3,376,630 non-zero flattened scalars under D1162's generic
identity exclusions, occupying 249,314,807 JSON bytes and 2,370 distinct names. Measured evidence
projection time was 101.474 seconds, versus 1.463 seconds for the fixed depth-2 engine roots. Linear
planning estimates from successful projections are:

| decisions | projection hours | generic GiB | 16-fields-per-projection GiB |
|---:|---:|---:|---:|
| 10,000 | 1.668 | 13.739 | 10.273 |
| 100,000 | 16.679 | 137.392 | 102.728 |
| 1,000,000 | 166.788 | 1,373.920 | 1,027.276 |

Those are single-process linear planning estimates, not parallel benchmarks or training costs.
The 8/16/32 arms cap scalar cardinality per emitted projection; they choose no features and encode
no production schema. Their cost confirms D1299's prior architectural result: recursively flattening
the evidence packet is not an admissible model interface. The evidence pool stays rich for Review,
Support and drills; a bot must consume a registered, projection-balanced compact view.

Machine-readable receipt: `d1329-projection-cost-results.json`. Human receipt:
`d1329-projection-cost-results.md`.
