# D1329 data-readiness harness

Disposable research instruments for the aggregate source and projection/cost arms. They fit no
model and retain no game, player, position, move, score or evidence-payload identity in committed
results.

Synthetic contracts:

```sh
pnpm exec vitest run tools/d1329-data-readiness-harness --config tools/d1329-data-readiness-harness/vitest.config.ts
```

Frozen projection arm (requires the pinned decompressed prefix and Stockfish 18):

```sh
TABIYA_D1329_PROJECTION_PGN=/private/tmp/tabiya-d1329/lichess_db_standard_rated_2026-06.prefix256.pgn \
SF_CMD=/opt/homebrew/bin/stockfish TABIYA_D1329_PROJECTION_WRITE=1 \
pnpm exec vitest run tools/d1329-data-readiness-harness/projection-cost.test.ts \
  --config tools/d1329-data-readiness-harness/vitest.config.ts
```

The write arm updates only aggregate research receipts under
`planning/platform-alignment/bot-policy/`.
