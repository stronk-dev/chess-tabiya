# Classifier coverage-and-noise harness — DISPOSABLE

Research tooling under `rfc/0000-rfc-process.md` §Exploration gate. **Not production code.** Not
referenced by `apps/` or `packages/`, not part of `pnpm test`.

Ledger question: the owner's 2026-08-18 challenge to the game-state classifier — *"is it
SEVERELY undertuned for actually classifying without noise and only interesting shit?"*
Dossier: `design/research/classifier-coverage-and-noise.md`. Proposed ledger row **D542**.

## What it measures

Over the packs in `content/drafts/` at HEAD, via `tools/r1r2-primitives-harness/corpus.ts`
(the same corpus walk R1/R2/R3/Q8/R11 used):

1. **Structural reading volume** — observations per position from the shipped
   `structuralReading(fen)`, by kind, and split by the pack's declared phase. Re-derives
   [[D78]]/[[D359]] at HEAD.
2. **Compare-strip selectivity** — the shipped `comparisonStrips` structure generator
   (`packages/runtime/src/compare-strips.ts`, `comparisonStrips`) re-implemented with the same
   `JSON.stringify` observation key, plus the axis-D within-position test against every
   quiet legal alternative. Re-derives [[D78]]'s firing rate, entries/ply and lift.
3. **Per-kind discrimination (new)** — for each of the 18 structural feature kinds,
   P(the played move gains this kind) / P(a legal alternative from the same parent gains
   it), using R11 §5's lift definition (`design/research/conjunction-hypothesis.md`). This
   is the measurement that separates *bad detectors* from *bad delivery* and neither D78
   nor R3 made it.
4. **Per-kind discrimination for the transition census** — same method over the eleven
   `leaf:direction` keys plus the four `move_irreversibility` subkinds.
5. **Ranked-surface counterfactual (new)** — what the compare strip's firing rate,
   entries/ply and lift become if only the top-k kinds by §3 lift are printed.
6. **Pivotal markers and phase bands** — `irreversibility` subkind split, `phase_change`
   candidate rate, `option_collapse` floor, and the phase-band distribution including the
   `unclear` abstention share.
7. **Named-structure catalogue reach** — how much of the corpus the four catalogue
   entries match.

Everything in `audit.test.ts` imports the shipped runtime; nothing is re-implemented except
the compare-strip diff, which mirrors the shipped code line for line.

`candidates.test.ts` is a second, independent pass: **eight candidate detectors the classifier
does NOT have** (hanging piece, fork, absolute pin, pawn islands, castling right lost, rook on
the seventh, bad bishop, central pawn space), each implemented as pure position/move arithmetic
over chessops, measured for firing rate, axis-D lift, and static prevalence on the same corpus.
These are **research implementations, not proposals for shipped definitions** — `bad_bishop`'s
≥4 threshold and `central_space`'s file range are chosen, not derived. Output:
`candidates-output.md`.

## Known measurement artefact — castling UCI convention

`makeUci` (chessops) emits the king-takes-rook form `e1h1` for castling, while most of the
authored corpus writes `e1g1`. `irreversibility()` tests `|to.file − from.file| === 2`, so it
fires only on the `e1g1` form. Every alternative this harness enumerates therefore carries the
`e1h1` form and **no alternative can ever produce a `castled` observation**, which is why §4
reports an infinite lift for that subkind. That row is an artefact and must not be quoted.
The underlying convention split is *not* an artefact and is reported in the dossier §7.

## Run

```sh
pnpm exec vitest run --config tools/d542-classifier-audit-harness/vitest.config.ts
```

Writes `output.md` beside this file on every run (~9 minutes on an M3 Max; the per-kind pass
evaluates one `structuralReading` per legal alternative).
