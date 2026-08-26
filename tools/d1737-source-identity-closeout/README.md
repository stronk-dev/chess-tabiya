# D1737 evidence source-identity closeout

Disposable research receipt. It does not implement a collector, projection, consumer, RFC, pack,
or learner surface.

It verifies three separate things:

1. all 37 compiled producer roots and the current 193-projection tuple remain accounted;
2. the declared 1.0 evidence basis has one research authority and an honest production state;
3. the consolidated source-repair wave names all sixteen program handoffs and its two downstream
   readers exactly once.

Run with repository Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1737-source-identity-closeout/vitest.config.ts --reporter=dot
```
