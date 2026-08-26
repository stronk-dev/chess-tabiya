# D1710 producer-execution closure harness

Disposable research instrument for [[D1710]]. It distinguishes a projection that compiles from
one that can actually be emitted by a non-test application path.

Run with the repository's pinned Node 24:

```sh
/opt/homebrew/opt/node@24/bin/node node_modules/vitest/vitest.mjs run \
  --config tools/d1710-producer-execution-harness/vitest.config.ts --reporter=verbose
```

The instrument checks:

- all 193 compiled projections are classified as current-consumer, research-only,
  experimental-only, or unbound;
- the current snapshot is exactly 93 / 67 / 0 / 33;
- the 67 semantic projections form a set-equal 45 / 11 / 11 execution partition:
  operator-selector only, unused candidate-helper only, and isolated sequence-helper only;
- `selectLocalSemanticEvidence` has only the operator check as a non-definition caller;
- `candidateFeatureVector` has no non-definition production caller;
- the thirteen named sequence/bounded constructors have no non-test integration caller.

It intentionally does not claim that a legal chess position must emit every conditional event.
The question is whether an application operation can reach the constructor, not whether every
event fires on every position.
