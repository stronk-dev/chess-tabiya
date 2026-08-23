# D1071 candidate-packet harness

Disposable research instrument. It checks whether the implemented opponent candidate vector is
complete and whether it preserves the sealed semantic-event identity needed by bot policy and
Guided Hint. It does not query an engine and is not production code.

Run:

```sh
pnpm exec vitest run --config tools/d1071-candidate-packet-harness/vitest.config.ts
```

The instrument deliberately supplies only two of the initial position's twenty legal moves and
uses arbitrary finite scores. Acceptance is the finding: the current adapter proves legality of
members, not completeness or engine provenance.
