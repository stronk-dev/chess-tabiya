# D1675/D1676 setup-identity harness

Disposable research instrument for the returned `variants` RFC. It measures chessops' variant
normalization and starting-position behavior, reproduces the current importer's false accept/refuse
pair, and tests a candidate closed `rules + setupFamily` identity over the complete chess-alias
families used by the pinned parser.

It does not change import behavior or authorize a run-schema implementation.

```sh
pnpm exec vitest run --config tools/d1675-setup-identity-harness/vitest.config.ts
```
