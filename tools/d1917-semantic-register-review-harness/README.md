# D1917 semantic-register review harness

Disposable process/buildability instrument under `rfc/0000-rfc-process.md` §Exploration gate. It
reproduces the proposed semantic-convention claim collision/tree/seed failures, then executes the
amended base-id lineage, exact-next-version, stable-seed and honest identity-only scope. It is not
production code.

Run from the repository root:

```sh
pnpm exec vitest run --config tools/d1917-semantic-register-review-harness/vitest.config.ts
```
