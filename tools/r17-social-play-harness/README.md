# R17 social-play harness

Disposable research instrument for `planning/platform-alignment/social-play/plan.md`. It reads the
current tree and a dated, hand-checked projection of the official Lichess OpenAPI contract. It is
not product code and does not call Lichess during a test run.

Run only this instrument:

```sh
pnpm exec vitest run --config tools/r17-social-play-harness/vitest.config.ts
```
