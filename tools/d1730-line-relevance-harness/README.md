# D1730 line-relevance harness

Disposable research instrument. It compares the legacy board-edge `line_blockers` census with
the exact target-bearing ray, discovered-latency, edge-event and observed-clearance families over
the fixed authored/imported populations. It is evidence, not production implementation.

Run with Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1730-line-relevance-harness/vitest.config.ts
```

Set `D1730_CENSUS=1` to print a refreshed receipt.
