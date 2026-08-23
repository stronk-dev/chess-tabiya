# D1162 evidence-to-move head harness

Disposable research instrument for
`planning/platform-alignment/bot-policy/d1162-evidence-head-plan.md`. It reuses the surviving
R11/D815 capture and calls the shipped candidate-evidence adapter. It makes no engine or network
request and changes no production policy.

Synthetic controls only:

```sh
pnpm exec vitest run tools/d1162-evidence-head-harness/evidence-head.test.ts \
  --config tools/d1162-evidence-head-harness/vitest.config.ts
```

Fixed-population measurement:

```sh
TABIYA_R11_INPUT_DIR=/private/tmp/d815-bot.eSsHFQ TABIYA_D1162_WRITE=1 \
  pnpm exec vitest run tools/d1162-evidence-head-harness/evidence-head.test.ts \
  --config tools/d1162-evidence-head-harness/vitest.config.ts
```

The write arm records aggregates and source digests under
`planning/platform-alignment/bot-policy/`; it does not commit raw captures.
