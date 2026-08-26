# D1714 authority-empty semantic-event probe

Disposable research instrument following D1713. It exercises the fourteen events with no existing
independent authority through their current event-emitter boundary, records exact legal positives
and nearby semantic negatives, and distinguishes a reusable fixture from an unreachable/split
emitter.

Run with pinned Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1714-authority-empty-harness/vitest.config.ts --reporter=verbose
```

This is not production code and does not authorize an RFC or collector change.
