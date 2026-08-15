# R3 census-hint harness — DISPOSABLE

Evidence instrument for **R3** of `planning/campaign-research-queue.md` (*"what is the
false-positive rate of a hint built only from transition census?"*), permitted under
`rfc/0000-rfc-process.md` §Exploration gate. **Not production code**, not referenced by
`packages/` or `apps/`, not part of `pnpm test`. Results landed in
`design/research/census-hint-false-positives.md`.

## Run

```
npx vitest run --config tools/r3-census-hint-harness/vitest.config.ts
```

Writes `r3-output.md` next to this file. Machine of record: Apple M3 Max, Node v26.7.0
arm64, chessops 0.15.1.

## Files

| File | What it is |
|---|---|
| `leaves.ts` | The six leaves of `rfc/transition-primitives.md` §2.3 implemented with the **target-keyed / colour-keyed / both-occupied** semantics that RFC §2.4 specifies — *not* the `(attackerSquare, targetSquare)` pair keying the R1 harness used. Each leaf returns **witnesses**, and each witness carries the axis flags `remote` (T1), `remoteStrict` (T0) and `consequential` (C) |
| `r3.test.ts` | The measurement: the R1 pair-keyed rates re-run on this corpus (so the correction is isolated from corpus growth), the corrected rates, the T/C signal census, the alternative-move discrimination sweep (axis D), the lift control, the phase split, and the worked examples |

It reuses `../r1r2-primitives-harness/corpus.ts` (spine replay) and `primitives.ts`
(`attackMap`, `geometricDests`, `irreversibility`, `zeroing`) verbatim, so the two passes
measure the same 634 transitions from the same 37 packs.

## Known limits

- The axes are **necessary conditions checked mechanically**, never a chess judgment. A
  firing that passes all of them may still be worthless to a reader; a firing that fails one
  is not thereby proven worthless. The reported signal rates are therefore **upper bounds**
  and the reported false-positive rates **lower bounds**. This is stated at length in §3 of
  the dossier.
- The alternative-move sweep promotes every pawn to a queen and enumerates all 15,989 legal
  moves from the 634 spine parents. It is a proxy for "moves a learner might play", not a
  model of one.
- No reader study was run and none is claimed.
