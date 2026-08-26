# D1631–D1636 shared-candidate repair harness

Disposable exploration instrument under `rfc/0000-rfc-process.md` §Exploration gate. It tests the
six contradictions returned by the independent buildability review; it is not production code.

The harness imports the shipped legal-move authority, semantic collectors, candidate adapter and
F1 compiler. Its local models are prospective contract falsifiers for terminal/adjudication
separation, three cache identities and typed White-to-root score comparison.

Run with the repository's Node 24 toolchain:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1631-candidate-packet-repair-harness/vitest.config.ts
```
