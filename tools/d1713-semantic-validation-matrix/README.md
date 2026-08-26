# D1713 semantic-validation migration matrix

Disposable research instrument following [[D1711]]. It maps all 67 semantic projections to exact
existing executable authorities without treating a lower-level predicate test, an event-emitter
test, a population observation and an external-label disagreement study as interchangeable.

Run with pinned Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1713-semantic-validation-matrix/vitest.config.ts --reporter=verbose
```

The matrix has six arms: event positive, semantic hard negative, orientation/mirror,
counterfactual/complete-alternative, imported population and external-labelled comparison. Each
claimed authority names an exact file and test case and fails if that case disappears. Empty means
“no existing executable authority established in this pass,” not “the event is false” or “the arm
must apply.” Required-versus-inapplicable is the semantic-validation RFC's total-table decision.
