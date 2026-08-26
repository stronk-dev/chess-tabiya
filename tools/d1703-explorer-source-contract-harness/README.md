# D1703–D1706 Explorer source contract harness

Disposable exploration instrument under `rfc/0000-rfc-process.md` §Exploration gate. It audits the
live human-corpus provider as a reusable evidence source; it is not production code.

The harness reproduces cross-position/node relabelling, illegal/duplicate/impossible move-row
acceptance, loss of fetched average-rating/opening/history fields, destruction of valid sparse
populations by a parser-level sample threshold, queue time outside the advertised interaction
budget and the runtime/manifest abstention mismatch. It also compiles the literal
node-free generic source projection and preserves the existing normalized request/cache identity.

Run with the repository's Node 24 toolchain:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1703-explorer-source-contract-harness/vitest.config.ts
```
