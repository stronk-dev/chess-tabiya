# D1061 bestline-distance harness

Disposable provider instrument for
`planning/evidence-foundation-ux/d1061-bestline-distance-plan.md`.

```sh
TABIYA_D1061_POSITIONS=/private/tmp/d815-bot.eSsHFQ/sf-positions.json \
TABIYA_D1061_WRITE=1 \
pnpm exec vitest run --config tools/d1061-bestline-distance-harness/vitest.config.ts
```

Requires a local `stockfish` binary. It writes only the two declared result files when the write
flag is set. It does not touch packs, sidecars, runtime storage or production code.
