# R6 pack stability harness

**Disposable exploration instrument.** It measures format evolution and compatibility; it does not
migrate or rewrite content.

## Predeclared questions

1. How many times has `schemas/drill_pack.schema.json` changed, how often did its `$id` change, and
   did a supposedly immutable ID ever name two artifacts or an unparsable artifact?
2. How much content changed in the same commit as each schema mutation?
3. Do historical pack documents validate under the current schema (backward admission)?
4. Do current documents validate under historical schemas (what an older self-host can accept)?
5. Can a pack declare its required schema/capabilities, and which current primitive families are
   actually exercised?
6. What version strings and populations exist across pack, shape, principle and sourcing artifacts?

The compatibility arms are syntax-only JSON Schema tests. They do not claim evaluator semantics are
stable; the dossier must audit that boundary separately. A historical invalid schema is recorded as
an outcome, not skipped. Each compatibility cell records all counts and at most twelve representative
failure documents so the checked-in result stays reviewable; rerunning the instrument reproduces the
whole population.

## Run

```sh
node tools/r6-pack-stability-harness/analyze.mjs
```

The script reads Git objects and the committed tree, writes only `output.json`, and never checks out
or edits a historical file.
