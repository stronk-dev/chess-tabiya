# D1585 module semantic closure harness

Disposable research instrument for D1585, D1586, D1587, D1589 and D1591. It does not implement
learner modules. It tests the returned RFC's semantic seams against the compiled evidence manifest:

- answer content is a branched capability set, not a total ladder;
- the literal sight set derives `fact + pattern`, with rook-on-seventh as its only pattern witness;
- an Explorer population-summary derivation structurally excludes candidate move identity;
- reduced evidence can be safely resealed through `evidenceForConsumer`, while a forged subset is refused;
- the Match rules floor includes the seated participant without opening guidance.

Run with Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1585-module-semantic-closure/vitest.config.ts
```
