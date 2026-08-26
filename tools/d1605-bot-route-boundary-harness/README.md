# D1605 bot production-route boundary harness

Disposable source-boundary census for the returned bot roster. It records which exact production
carriers already preserve a bot profile and which drop it. The assertions describe HEAD and are
intended to invert in the accepted implementation RFC.

Run with Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1605-bot-route-boundary-harness/vitest.config.ts
```
