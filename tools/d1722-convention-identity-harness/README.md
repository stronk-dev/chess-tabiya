# D1722 declared-convention identity harness

Disposable research instrument. It derives every compiled projection whose grounding is
`declared_convention`, records whether its emitted operands carry an explicit convention identity,
and distinguishes versioned manifest semantics from generic prose. It also derives a conservative
review set of convention-dependent projections carrying another scalar grounding, proves that an
in-place meaning rewrite compiles, and proves that the current single-grounding derivation rule
rejects a truthful added composition convention. It does not change the evidence catalogue or
production behavior.

```sh
D1722_PRINT=1 /opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1722-convention-identity-harness/vitest.config.ts --reporter=dot
```
