# D1073 state-directed bot harness

Disposable fixed-population experiment. It reuses the captured D969/D1062 Maia, Stockfish and
Explorer inputs; it makes no provider calls and changes no production policy.

```sh
TABIYA_D1073_INPUT_DIR=/private/tmp/d815-bot.eSsHFQ \
TABIYA_D1073_WRITE=1 \
pnpm exec vitest run --config tools/d1073-state-directed-bot-harness/vitest.config.ts
```

Without the input variable, only the exact route-potential fixtures run. The measured label is a
mechanical opening route, never a personality or human-likeness claim.
