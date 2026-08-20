# Detection-landscape harness

Disposable research instrument for platform-alignment R1. It compares four cheap,
board-arithmetic candidate detectors with the themes attached to a bounded prefix of
the official Lichess CC0 puzzle export.

The comparison is deliberately diagnostic rather than a claim that Lichess themes
are manual ground truth. Lichess says the puzzles and themes are generated
automatically and refined by player votes; a theme may occur on any solver move in
the solution. The harness therefore replays the whole supplied line and reports both
agreement and disagreement. The source prefix used for the recorded run was:

- URL: `https://database.lichess.org/lichess_db_puzzle.csv.zst`
- retrieved: 2026-08-20
- compressed byte range: `0-12582911`
- decompressed complete rows available before the truncated-frame error: 250,587
- compressed-prefix SHA-256: `04876254effbaa774b7739c5f7896064b44deaa8ca724357dc189288fe8d04a4`
- decompressed-prefix SHA-256: `910d6920fbd2117182a165c39fe6cf34869afd9b80cae09cde5550ffc982e005`

Run:

```sh
TABIYA_LICHESS_PUZZLES=/path/to/lichess_db_puzzle.csv \
  pnpm exec vitest run --config tools/detection-landscape-harness/vitest.config.ts
```

The test also checks file-mirror invariance, records hard-negative disagreements,
and measures how often each cheap detector fires on legal alternatives to the
labelled solution move. This is not production detector code. Its definitions are intentionally named
`cheap_*`; the research dossier decides which facts are exact enough to standardise,
which need a search/corpus/theory join, and which should be refused.
