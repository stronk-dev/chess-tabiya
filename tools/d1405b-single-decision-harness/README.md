# D1405b single-decision harness

Disposable research instrument for
`planning/longitudinal-store/d1405-single-decision-preregistration.md`.

Run only from a clean committed worktree:

```sh
D1405B_COMMIT="$(git rev-parse HEAD)" \
D1405B_OUT=/absolute/path/to/d1405b-single-decision-results.json \
pnpm exec vitest run --config tools/d1405b-single-decision-harness/vitest.config.ts
```

It performs no network, engine, provider or LLM work. Passing preserves native incremental
projection as a candidate; only a rerun over accepted production adapters can accept it.
