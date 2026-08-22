# Feedback binding candidate audit — DISPOSABLE

Research/content-wave tooling under RFC-0000's exploration gate. It never writes pack or sidecar
content. It tests the “43 pure joins” estimate against the shipped `validateClaimBindings` contract.

The first run found one validator-green candidate out of 43 and then falsified that candidate
semantically: the cardinal “one” in “the one common mate” was accepted as a DTM value of 1 from a
later position. The test preserves that counterexample. A green result here is therefore not an
authorization to emit bindings; D1008 must first add a relation between the sentence referent and
the assertion, beyond equal token values.

Run:

```sh
pnpm exec vitest run --config tools/feedback-binding-wave/vitest.config.ts
```
