# D1910–D1915 provider-health review harness

Disposable buildability instrument under `rfc/0000-rfc-process.md` §Exploration gate. It checks
the draft provider-health contract against the current engine topology, F1 consumer schema and
persisted opponent-selection shape. It is not production code.

Run from the repository root:

```sh
pnpm exec vitest run --config tools/d1910-provider-health-review-harness/vitest.config.ts
```
