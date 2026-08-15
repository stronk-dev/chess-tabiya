# Q8 feedback-surface harness — DISPOSABLE

Research tooling under `rfc/0000-rfc-process.md` §Exploration gate. **Not production code.** Not
referenced by `apps/` or `packages/`, not part of `pnpm test`.

Ledger question: **Q8** — *"Can feedback beat 'Stockfish labels + prose'?"*
(`planning/exploration/plan.md:30`). Dossier:
`design/research/feedback-versus-the-dashboard.md`.

## What it measures

Over the 37 committed packs in `content/drafts/` (634 spine transitions, 515 distinct positions —
the same corpus R1/R2/R3 used, via `tools/r1r2-primitives-harness/corpus.ts`):

1. **Structural reading volume** — observations per position from the shipped
   `structuralReading(fen)`, by kind.
2. **Compare-strip volume and axis D** — the shipped `comparisonStrips` structure generator
   (`packages/runtime/src/compare-strips.ts:32`) re-implemented with the same `JSON.stringify`
   observation key, plus R3 §6's within-position discrimination test against every quiet legal
   alternative.
3. **Pushed timeline markers** — `irreversibility` firing and subkind split (independently
   reproducing R3 §7c), `phase_change` band transitions, `option_collapse` legal-count floor.
4. **Endgame reading reach** — non-null rate, typed rate, named-technique rate, and the actual
   rendered sentences.
5. **Sibling-branch discrimination** — Jaccard overlap of the two full structural readings at
   every authored fork pair.

Everything imports the shipped runtime; nothing is re-implemented except the compare-strip diff,
which mirrors the shipped code line for line.

## Run

```sh
npx vitest run --config tools/q8-feedback-surface-harness/vitest.config.ts
```

Writes `q8-output.md` beside this README.

## Not measured here

`human_divergence`, the recorded-engine guard tier, and the voice packet check all require a
*played* run and are absent from this pass. See the dossier §10.
