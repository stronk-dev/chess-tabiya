# D1921 semantic-convention product review harness

Disposable buildability instrument under `rfc/0000-rfc-process.md` §Exploration gate. It first
reproduces the six return findings against live boundaries, then executes candidate contracts for
D1921, D1922 and D1924–D1926:

- a compiler-owned value seal with canonical derivation-member identity, exact input-value
  digests, multiplicity, transitive convention closure and runtime anti-forgery;
- a typed extractor catalogue set-equal to all fourteen live instance-varying projections,
  covering string, two-ref and structured-grade operands; and
- exact adapter-key equality so a fixed projection cannot smuggle an undeclared convention ref or
  other caller data;
- deterministic mandatory-limitation assembly after optional provider summary rendering;
- append-only first-parent semantic history with exact next-version lineage; and
- attested persisted receipts that remain honest-empty for legacy runs, preserve historical v1
  under v2, require compiler re-sealing and reject mutation/unknown origins.

It is not production code. D1923's separately published 39-row source population is checked by
`tools/d1923-semantic-declarations-harness/`.

Run from the repository root:

```sh
pnpm exec vitest run --config tools/d1921-semantic-convention-review-harness/vitest.config.ts
```
