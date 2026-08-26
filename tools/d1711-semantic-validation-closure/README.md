# D1711 semantic-validation closure harness

Disposable research instrument for [[D1711]]. It separates three claims that the current
manifest collapses: a declaration exists, an executable test names the projection, and an
independent fixture is actually bound to the declaration's validation metadata.

Run with the repository's pinned Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1711-semantic-validation-closure/vitest.config.ts --reporter=verbose
```

The instrument checks:

- all 67 semantic declarations synthesize one positive and one hard-negative label from their
  own projection id;
- no one of the 134 resulting labels names an independent fixture elsewhere in executable code;
- the compiler and generic semantic census are the only readers of the validation arrays: the
  former checks non-empty strings and the latter compares regenerated labels; neither resolves a
  fixture;
- the census constructs one generic payload from each declaration, removes its first operand for
  the negative, and regenerates its expected label set from the same declarations; and
- a lower-bound per-projection census reports literal naming by runtime and disposable research
  tests outside that generic census; and
- the one `externalPopulation` token identifies the old R2 input whose baseline compiled 33
  events: only 29 current ids occur in its output and 38 do not, so the token cannot serve as a
  per-event external validation claim.

Literal naming is deliberately not called semantic validation. A test can mention an id while
checking only serialization, and a test can exercise a computed family without repeating its
projection id. The report uses this weaker signal only to avoid the opposite false claim that all
collector implementations are wholly untested.
