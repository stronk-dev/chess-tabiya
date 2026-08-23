# D1363 hint-selector harness

Disposable research instrument for the preregistered production-table and perspective census in
`planning/evidence-foundation-ux/d1363-hint-selector-preregistration.md`.

It reads the already-frozen D1061 engine lines and makes no engine or network request. It writes
aggregate results plus exact selected-row identities; it emits no chess recommendation or
learner-facing prose.

```sh
pnpm exec vitest run --config tools/d1363-hint-selector-harness/vitest.config.ts
```

