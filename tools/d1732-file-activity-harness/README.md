# D1732 file-activity harness

Disposable research instrument. It proves open/half-open file truth can be derived from the exact
pawn-connectivity source, measures exact heavy-piece occupancy, and compares moved-piece occupancy
with stationary heavy pieces whose file becomes eligible after a pawn leaves. It is not production
code.

Run with Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1732-file-activity-harness/vitest.config.ts
```

Set `D1732_CENSUS=1` to print a refreshed receipt.
