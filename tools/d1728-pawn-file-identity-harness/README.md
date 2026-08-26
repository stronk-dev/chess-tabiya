# D1728 exact isolated/doubled pawn identity

Disposable research instrument. It derives exact isolated and doubled pawn-file records from the
shipped `pawnConnectivityReading`, proves their truth sets equal the legacy predicates, and
measures subject collapse and transition identity loss over the fixed populations.

```sh
D1728_CENSUS=1 /opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1728-pawn-file-identity-harness/vitest.config.ts --reporter=dot
```
