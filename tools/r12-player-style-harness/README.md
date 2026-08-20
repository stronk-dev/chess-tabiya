# R12 disposable player-style harness

This harness measures short-session stability; it is not production ingestion code. Raw public
usernames, PGNs, profile responses and decision traces stay in `/private/tmp`.

The recorded run used the first 2,147,483,648 compressed bytes of:

```text
https://database.lichess.org/standard/lichess_db_standard_rated_2026-07.pgn.zst
```

Its compressed SHA-256 is
`8502a22a2ed1e000e0d4399785a3dccd1d59caf694fd0aa8ebb3dc59696e3e59`.
Lichess documents that partial Zstandard downloads remain decompressible.

Run the stages in order. The full raw paths below match the recorded run:

```sh
node tools/r12-player-style-harness/extract-appearances.mjs \
  /private/tmp/r12-style-prefix-2g.pgn \
  /private/tmp/r12-appearances.tsv \
  /private/tmp/r12-population-meta.json

LC_ALL=C sort -k1,1 \
  -o /private/tmp/r12-appearances-sorted.tsv \
  /private/tmp/r12-appearances.tsv

node tools/r12-player-style-harness/aggregate-appearances.mjs \
  /private/tmp/r12-appearances-sorted.tsv \
  /private/tmp/r12-population-meta.json \
  /private/tmp/r12-population.json

node tools/r12-player-style-harness/candidate-ids.mjs \
  /private/tmp/r12-population.json \
  /private/tmp/r12-candidate-ids.txt

curl -fLG --data-urlencode ids@/private/tmp/r12-candidate-ids.txt \
  -o /private/tmp/r12-candidate-status.json \
  https://lichess.org/api/users/status

node tools/r12-player-style-harness/extract-candidate-games.mjs \
  /private/tmp/r12-style-prefix-2g.pgn \
  /private/tmp/r12-population.json \
  /private/tmp/r12-candidate-status.json \
  /private/tmp/r12-candidate-games.pgn

./node_modules/.bin/vitest run --config tools/r12-player-style-harness/vitest.config.ts \
  tools/r12-player-style-harness/population.test.ts

./node_modules/.bin/vitest run --config tools/r12-player-style-harness/vitest.config.ts \
  tools/r12-player-style-harness/measure.test.ts

./node_modules/.bin/vitest run --config tools/r12-player-style-harness/vitest.config.ts \
  tools/r12-player-style-harness/opening-reference.test.ts

./node_modules/.bin/vitest run --config tools/r12-player-style-harness/vitest.config.ts \
  tools/r12-player-style-harness/analyze.test.ts
```

`measure.test.ts` writes pseudonymous per-game/per-decision traces to `/private/tmp`.
`opening-reference.test.ts` scans only the first eight plies and only positions reached by the
selected cohorts. `analyze.test.ts` writes the complete pass table to `/private/tmp/r12-results.json`;
the committed result is the aggregate projection in
`planning/platform-alignment/player-style/results.json`.
