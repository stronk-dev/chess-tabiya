# R11 conjunction harness — DISPOSABLE

Evidence instrument for **R11** — *"does a conjunction of two independent primitives beat
either alone on R3's T/C/D gate?"* (`design/research/campaign-effect-vocabulary.md` §7,
mechanism claim in §4) — permitted under `rfc/0000-rfc-process.md` §Exploration gate.
**Not production code**, not referenced by `packages/` or `apps/`, not part of `pnpm test`.
Results landed in `design/research/conjunction-hypothesis.md`.

## Run

```
npx vitest run --config tools/r11-conjunction-harness/vitest.config.ts
```

Writes `r11-output.md` next to this file. Machine of record: Apple M3 Max, Node v26.7.0
arm64, chessops 0.15.1. Whole pass 14.5 s.

**Note on the R3 harness.** Running `tools/r3-census-hint-harness/` regenerates its committed
`r3-output.md` against the *current* corpus, which de-grounds `census-hint-false-positives.md`'s
citations. Restore it (`git checkout -- tools/r3-census-hint-harness/r3-output.md`) after
verifying the harness runs. This harness's Leg 0 reproduces R3's headline independently, from
the same unmodified `leaves.ts`, so there is no need to overwrite R3's record to check it.

## What it reuses, verbatim

| From | What |
|---|---|
| `../r1r2-primitives-harness/corpus.ts` | the spine walk over `content/drafts/` (excludes the `.evidence`/`.job`/`.sources`/`.browser` sidecars) |
| `../r1r2-primitives-harness/primitives.ts` | `pos`, the attack-map substrate |
| `../r3-census-hint-harness/leaves.ts` | the six RFC §2.3 leaves and the T/C witness flags — **unmodified**, so every single-key number here is R3's number re-measured |

New in this pass: the shipped `structuralReading()` and `classifyPhase()` are imported from
`packages/runtime/src/` so the cross-family arm (Leg 4) conjoins a transition primitive with
a *shipped* position lens rather than a re-implementation.

## Legs

| Leg | Question |
|---|---|
| 0 | R3's own headline re-run on the current corpus (has 89.0% moved?) |
| 1 | Is §4's premise true — do two leaves fire near-independently at ≈ p·q? |
| 2 | Precision (T ∧ C): does the conjunction beat either component? Two forms — joint-signal and filter |
| 3 | Axis D: discrimination against the moves NOT played. The binding axis |
| 4 | Cross-family: a census leaf ∧ a shipped position lens, which is the shape §4's three worked triples have. 4b repeats it with the lens read *after* the move |
| 5 | Triples |
| 6 | Population sensitivity — by phase, middlegame-only, and the whole verdict re-run on the quiet-alternative population |

## Known limits

- Inherits every limit of the R3 harness (`../r3-census-hint-harness/README.md`): the axes are
  mechanical **necessary** conditions, so signal rates are upper bounds and FP rates lower
  bounds; no reader was asked; the alternative population promotes every pawn to a queen.
- The conjunction vocabulary is the **six transition leaves plus the shipped structural/phase
  lenses**. `human_divergence` (Maia policy split) — the third of §4's worked triples and the
  only one carrying a rung-3 signal — is **not testable on this instrument**; it needs the Maia
  container and a policy probe per alternative.
- Where an alternative-population count is zero, the rate is replaced by its 95% one-sided
  upper bound (rule of three, 3/N) so lifts are reported as bounds, never as infinity.
- Pair and triple keys are canonicalised by leaf order, not alphabetically. The first run of
  this harness used alphabetical sorting on one side of the comparison and produced spurious
  zero denominators; the fix is `comboKey()`.
