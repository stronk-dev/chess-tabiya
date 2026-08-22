# D872 semantic-tactics corpus instrument

Disposable research instrument for Wave C. It does not implement production detectors and does
not treat Lichess puzzle themes as ground truth. It measures the population, line horizon,
co-occurrence and phase distribution of the basic semantic-tactic tags against which future exact
detectors may be falsified.

The recorded run uses the same bounded official Lichess CC0 puzzle-export prefix as the R1
detection-landscape instrument:

- URL: `https://database.lichess.org/lichess_db_puzzle.csv.zst`
- retrieved: 2026-08-22
- compressed byte range: `0-12582911`
- complete rows: 250,587 plus one explicitly rejected truncated tail
- compressed-prefix SHA-256: `04876254effbaa774b7739c5f7896064b44deaa8ca724357dc189288fe8d04a4`
- decompressed-prefix SHA-256: `910d6920fbd2117182a165c39fe6cf34869afd9b80cae09cde5550ffc982e005`

Run:

```sh
TABIYA_LICHESS_PUZZLES=/path/to/lichess_db_puzzle.csv \
  pnpm exec vitest run --config tools/d872-semantic-tactics-harness/vitest.config.ts
```

Generated evidence:

- `output.md` — tag population, horizons and co-occurrence;
- `sequence-output.md` — exact observed-line events;
- `counterfactual-output.md` — exact event versus all-reply qualification;
- `king-promotion-output.md` — mate-next and promotion availability/persistence;
- `agreement-output.md` — exact-event sensitivity against tags plus a deterministic 1/20
  tag-negative control.
- `bounded-mate-output.md` — complete-reply mate-through-four proof plus a capped five-plus
  boundary probe.
- `promotion-race-tablebase-output.md` — exact promotion geometry against the repository's
  recorded Syzygy outcome evidence.
- `review-engine-operands-output.md` — cost and budget stability of typed consecutive engine
  readings over fixed imported transitions.
- `review-engine-mate-output.md` — typed engine-mate agreement against the already-proved exact
  mate-through-four population.

The source file is not committed.
