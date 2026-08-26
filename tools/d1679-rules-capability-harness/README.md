# D1679 rules-aware evidence capability harness

Disposable research instrument for [[D1679]] and [[D1687]]. It derives the current producer
population from the compiled F1 manifest, classifies every producer for Standard, Chess960 and
Tier-2 evidence-dark subjects, and keeps three questions separate: whether a value can be
computed, whether a learner consumer may receive it, and whether absence is honest-empty or a
safety suppression.

The matrix is an authoring input, not the production registry. Its producer rows are defaults;
the production compiler must still retain every projection disposition and consumer binding.

```sh
pnpm exec vitest run --config tools/d1679-rules-capability-harness/vitest.config.ts
```
