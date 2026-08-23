# D1162 independent-population harness

Disposable research instrument for
`planning/platform-alignment/bot-policy/d1162-independent-population-plan.md`.

It extracts fixed decisions from the committed R2 Lichess fixture, excludes duplicate and
first-screen positions, probes the complete legal set with local Stockfish at a fixed bound, and
runs the preregistered game-clustered representation screen. It changes no production policy and
makes no network request.

The raw extraction and engine capture live outside the repository. The aggregate result and all
input digests are written under `planning/platform-alignment/bot-policy/` only when
`TABIYA_D1162_TRANSFER_WRITE=1`.

Build and extract:

```sh
mkdir -p /private/tmp/d1162-independent
./node_modules/.bin/esbuild tools/d1162-independent-population-harness/extract.ts \
  --bundle --platform=node --format=esm \
  --outfile=/private/tmp/d1162-independent/extract.mjs
node /private/tmp/d1162-independent/extract.mjs \
  tools/r2-selection-harness/imported-sample.pgn \
  /private/tmp/d815-bot.eSsHFQ/sf-d12.jsonl \
  /private/tmp/d1162-independent/positions.json
```

Probe (resumable) and measure:

```sh
./node_modules/.bin/esbuild tools/d1162-independent-population-harness/probe.ts \
  --bundle --platform=node --format=esm \
  --outfile=/private/tmp/d1162-independent/probe.mjs
STOCKFISH_PATH=/opt/homebrew/bin/stockfish node /private/tmp/d1162-independent/probe.mjs \
  /private/tmp/d1162-independent/positions.json \
  /private/tmp/d1162-independent/sf-d12.jsonl 12 120000
TABIYA_D1162_TRANSFER_INPUT=/private/tmp/d1162-independent/positions.json \
TABIYA_D1162_TRANSFER_PROBE=/private/tmp/d1162-independent/sf-d12.jsonl \
TABIYA_D1162_TRANSFER_WRITE=1 pnpm exec vitest run \
  tools/d1162-independent-population-harness/independent-population.test.ts \
  --config tools/d1162-independent-population-harness/vitest.config.ts
```

For D1297 development, the same clean-snapshot run can additionally write the sparse candidate
cache by setting `TABIYA_D1162_FEATURE_CACHE` and the full
`TABIYA_D1162_REPRESENTATION_COMMIT`. The cache is a disposable `/private/tmp` artifact and is not
production model data.
