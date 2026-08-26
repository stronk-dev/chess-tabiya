# D1699/D1700 promotion-race contract harness

Disposable exploration instrument under `rfc/0000-rfc-process.md` §Exploration gate. It closes the
two held Wave-C promotion-race projections without editing the concurrent D872 research harness.
It is not production code.

The harness imports the shipped pawn evidence, promotion helpers and F1 compiler. It falsifies the
current raw-FEN geometry and FEN-less tablebase join, compiles a literal live-or-recorded source
graph, and demonstrates why producer-wide latency cannot describe a mixed local/provider producer.

Run with the repository's Node 24 toolchain:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1699-promotion-race-contract-harness/vitest.config.ts
```
