# D2237 — Stage-A bot-trait fixed-population screen

**Opened:** 2026-09-06
**Authority:** [[D2237]], result row [[D2899]], `rfc/bot-roster.md` §5.3
**Status:** complete — 2/8 pass controlled divergence; 0/8 earn personality or human-like claims

## Question

On the same fixed 279-position / 804 usable position-band cells that admitted the pawn-heavy
control, can any of the eight still-unmeasured board-arithmetic transforms create a materially
different move distribution without silently changing strength, severe-error mass or the match to
the Lichess human reference?

This is a one-ply mechanism screen. It cannot establish a personality, fun, coherence across moves,
human-likeness or a 1.0 bot profile. A passing arm becomes eligible for the later full calibration
ladder; it does not enter the roster directly.

## Frozen population and base

Regenerate the R11/D969 population from committed inputs using one Make target:

- `content/drafts/` through the existing R4 extractor;
- the committed R9 Explorer readings joined by exact FEN;
- history-conditioned Maia MultiPV-20 for bands 1400/1600/1800;
- Stockfish 18, Threads 1, Hash 16, depth 8, all legal moves;
- whole-cell abstention for mixed mate/centipawn positions.

Expected identity is 279 positions × 3 bands = 837 input cells, 33 abstentions, 804 measured cells.
The production reconstruction remains temperature 0.8, top-p 0.92, followed by the 250-cp guard.
The pawn ×4 arm must pass and forcing ×3 must fail, reproducing the prior able-to-fail controls.
Because fixed-depth Stockfish values can vary with the pinned-version platform build, the prior
aggregate is a calibration anchor rather than a byte oracle: human match remains exact, while
expected loss may drift by at most 1 cp and severe mass by at most 0.005. The fresh result records
both engine identities, all input digests and the signed drift. Exceeding either bound stops the run.

## Preregistered arms

| id | exact classifier | multiplier |
|---|---|---:|
| `minor_piece_move` | moving role is bishop or knight | ×4 |
| `central_destination` | destination file c–f and rank 3–6 | ×4 |
| `long_move` | Chebyshev distance from source to destination is at least 3 | ×4 |
| `moved_piece_repeat` | source equals the normalized destination of the mover's preceding move | ×0.25 |
| `rim_destination` | destination is on file a/h or rank 1/8 | ×0.25 |
| `capture` | occupied destination or legal en-passant capture | ×4 |
| `gives_check` | the legal resulting position checks the opponent king | ×4 |
| `forward_move` | destination rank is strictly forward for the mover | ×3 |

`moved_piece_repeat` replays the committed history from `startFen` with chessops normalization. It
does not infer identity from UCI text alone and does not count the rook moved as a castling side
effect. Every classifier must have a positive and negative semantic fixture before the population
arm can run.

## Measures and gates

For guarded base and transformed distribution, pooled and per band, report:

- named-class mass and percentage-point delta;
- cells with both class and non-class mass after guard;
- cells whose class mass lies strictly in `(0.05, 0.80)`;
- expected Stockfish loss, ≥250-cp mass and Lichess human-match probability;
- exact input digests, abstentions and unmappable candidates.

The existing controlled-trait gate is unchanged. An arm passes only when all four hold:

1. signed class movement in the transform's intended direction is at least 0.10;
2. absolute expected-loss shift from the unguarded production sampler is at most 35 cp;
3. ≥250-cp mass rises by at most 0.01;
4. human-match retention is at least 0.90.

For suppression arms the first clause is `guarded − transformed`; for amplification it is
`transformed − guarded`. Opportunity-only and intermediate-mass readings are diagnostics and cannot
substitute for the pooled gate. Multipliers ×2 and ×8 are sensitivity diagnostics only.

## Able-to-fail and interpretation

- Pawn ×4 must reproduce a pass; forcing ×3 must reproduce a fail.
- A synthetic severe move must make the safety clause fail.
- A zero-opportunity classifier must report zero movement and fail, not disappear.
- No result may be called a personality or human-like.
- A failed transform leaves the underlying literal primitive available to evidence, Review,
  longitudinal analysis and drill authoring.
- A pass establishes controlled divergence only. It still requires the full bot-calibration verdict
  contract and longitudinal/played-game evaluation before learner-facing naming.

## Reproduction

`make bot-trait-screen` regenerates the raw temporary capture and writes the aggregate result and
report. It builds the Maia image but starts no persistent compose services, so a later verification
run does not inherit engine resource contention. `make bot-trait-screen-contract` runs semantic and
able-to-fail controls without Docker, Stockfish or network access.
