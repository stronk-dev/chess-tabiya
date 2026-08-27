# D1930 recorded semantic path cost harness

Disposable research instrument under `rfc/0000-rfc-process.md` §Exploration gate. It implements
the bounded work shape preregistered in
`planning/recorded-semantic-path/d1930-cost-preregistration.md` over the committed imported sample.
It is not production code and deliberately does not repair D1921/D1927/D1928/D1929.

Run from the repository root:

```sh
pnpm exec vitest run --config tools/d1930-recorded-path-cost-harness/vitest.config.ts
```

The run writes the result JSON and readable report under `planning/recorded-semantic-path/`.
