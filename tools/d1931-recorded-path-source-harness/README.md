# D1931 recorded semantic path source-closure harness

Disposable research instrument under `rfc/0000-rfc-process.md` §Exploration gate. It compares the
D1930 eager one-edge fan-out with the exact transition/check source closure preregistered in
`planning/recorded-semantic-path/d1931-source-closure-preregistration.md`. It is not production code.

Run from the repository root:

```sh
pnpm exec vitest run --config tools/d1931-recorded-path-source-harness/vitest.config.ts
```

The run writes result JSON and Markdown under `planning/recorded-semantic-path/`.
