# D1062 shared-style-atom bot harness

Disposable research instrument for `planning/platform-alignment/bot-policy/d1062-style-atom-plan.md`.
It reuses the frozen D969 raw files; it neither calls an engine nor changes production code.

```sh
TABIYA_D1062_INPUT_DIR=/private/tmp/d815-bot.eSsHFQ \
TABIYA_D1062_WRITE=1 \
pnpm exec vitest run --config tools/d1062-style-bot-harness/vitest.config.ts
```

The write arm produces the JSON measurement and a compact Markdown reading under
`planning/platform-alignment/bot-policy/`. Without `TABIYA_D1062_WRITE=1`, the instrument is
read-only.
