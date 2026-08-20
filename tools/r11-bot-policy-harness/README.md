# R11 bot-policy harness

Disposable platform-alignment R11 instrument. It applies predeclared distribution transforms to
the exact Maia/explorer/Stockfish captures behind
`design/research/maia-wdl-versus-human-outcome.md`. It neither starts an engine nor adds a product
policy.

Ordinary runs execute synthetic controls only:

```sh
pnpm exec vitest run --config tools/r11-bot-policy-harness/vitest.config.ts
```

The measured pass uses the regenerable raw directory from the earlier harness:

```sh
TABIYA_R11_INPUT_DIR=/private/tmp/r12 TABIYA_R11_WRITE=1 \
  pnpm exec vitest run --config tools/r11-bot-policy-harness/vitest.config.ts
```

Committed results contain input digests and aggregates, not raw captures.
