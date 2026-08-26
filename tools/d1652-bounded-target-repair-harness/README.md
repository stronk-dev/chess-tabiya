# D1652–D1658 bounded-target repair harness

Disposable exploration instrument under `rfc/0000-rfc-process.md` §Exploration gate. It tests the
provider/source contradictions returned by the independent buildability review of
`rfc/bounded-policy-targets.md`; it is not production code.

The harness imports the shipped legal-move authority, threat/exchange declarations and F1 compiler.
Its local models are prospective contract falsifiers for node-free provider identities,
same-exchange receipts, source/derivation separation, legal-root completeness, weakest-input
confidence, inherited latency and bounded scheduling.

Run with the repository's Node 24 toolchain:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1652-bounded-target-repair-harness/vitest.config.ts
```
