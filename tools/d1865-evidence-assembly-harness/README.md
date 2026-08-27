# D1865 module evidence-assembly harness

Disposable research instrument for D1865. It does not implement learner modules or add a
production collector. It expands the nine non-empty, non-Guided-Hint module declarations into
their complete 186 consumer/projection pairs, joins every compiled projection to its registered
producer, and classifies the producer into the execution stage that must supply it.

The Guided Hint family is deliberately excluded: its measured horizon/disclosure registry is a
dependency of `hint-distance` and does not exist at HEAD. The harness treats the two other absent
projection ids as explicit awaiting rows rather than silently dropping them.

Run with Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1865-evidence-assembly-harness/vitest.config.ts
```
