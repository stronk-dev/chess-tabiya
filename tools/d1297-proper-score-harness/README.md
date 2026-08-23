# D1297 proper-score development harness

Disposable model-development instrument for
`planning/platform-alignment/bot-policy/d1297-proper-score-repair-plan.md`.

It consumes the sparse candidate cache produced by the clean D1162 independent-population
harness. The 108 games are already-seen development data. The result may freeze one conditional
logit specification for a later untouched population; it cannot clear production or a product
claim.

```sh
TABIYA_D1297_FEATURE_CACHE=/private/tmp/d1162-independent/features.json \
TABIYA_D1297_WRITE=1 pnpm exec vitest run \
  tools/d1297-proper-score-harness/proper-score.test.ts \
  --config tools/d1297-proper-score-harness/vitest.config.ts
```
