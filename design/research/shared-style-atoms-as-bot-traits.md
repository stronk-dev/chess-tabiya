# Shared style atoms do not become bot personalities by reweighting once

**Question:** D1062, follow-up to platform-alignment R11/R21
**Date:** 2026-08-23
**Instrument:** `tools/d1062-style-bot-harness/`
**Status:** measurement complete; five candidate profile arms refused at the measured transform

## Verdict

None of the five rules-exact R21 feature atoms clears the existing controlled-trait gate when used
as a global one-ply Maia candidate weight. At the preregistered ×4 weight, extended-center pawn
play moves the most, from **12.01% to 17.64% (+5.63 percentage points)**, below the required 10
points. Early queen, castling, fianchetto completion and fianchetto-with-knight completion move by
1.94, 1.62, 0.05 and 0.14 points. All five preserve the strength, severe-error and Explorer-match
clauses; all fail on control reach. `[V]`
(`planning/platform-alignment/bot-policy/d1062-style-atom-results.json`)

This closes one tempting shortcut: a literal event that supports Review or longitudinal counting
does not automatically support a visible bot identity. It does **not** reject the atoms themselves.
They remain exact shared primitives for collectors, Review, drill conditions and later habit
measurement. It rejects only claiming a 1.0 personality from this measured transform. `[V]`
(D1062 plan and results; `longitudinal-style-feedback-contract.md` §3)

## 1. Population and able-to-fail controls

The disposable instrument reuses D969's fixed raw data without new provider calls:

- 279 positions × Maia bands 1400/1600/1800 = 837 input cells;
- whole-cell abstention on 33 cells from 11 mixed mate/centipawn positions;
- 804 evaluated cells, with zero unmappable Maia/Stockfish candidates;
- production sampling at temperature .8/top-p .92, followed by the fixed depth-8 250-cp guard;
- exactly ×4 mass on each named atom, then normalization.

`[V]` (`d1062-style-atom-results.json` input hashes/population; preregistered
`d1062-style-atom-plan.md`)

The pawn ×4 positive control reproduces D969's expected loss **19.945575 cp**, Explorer match
**0.309485**, and passing verdict. Forcing ×3 reproduces expected loss **19.965684 cp**, Explorer
match **0.311082**, and the preregistered failing verdict. The population and transform can
therefore produce both outcomes. `[V]` (`style-atoms.test.ts`; D969 result JSON)

The atom implementation also fixes the exact semantic boundary before measuring it. Standard and
nonstandard Chess960 castling both classify through `chessops.castlingSide`; a fixture with king
`b1` and rook `a1` proves the old two-file heuristic disagrees. Fianchetto atoms are completion
events: creating bishop+pawn or bishop+pawn+knight fires, while a later quiet move preserving the
configuration does not. `[V]` (`style-atoms.test.ts` fixtures)

## 2. Result

| atom | declinable cells / 804 | guarded pooled | ×4 pooled | delta | opportunity-only guarded→×4 | verdict |
|---|---:|---:|---:|---:|---:|---|
| extended-center pawn | 195 | 12.01% | 17.64% | +5.63 pp | 30.5→53.7% | fail |
| early queen | 71 | 2.81% | 4.75% | +1.94 pp | 19.1→41.2% | fail |
| castle | 58 | 4.78% | 6.41% | +1.62 pp | 50.8→73.3% | fail |
| fianchetto setup completion | 3 | 1.05% | 1.10% | +0.05 pp | 80.7→94.3% | fail |
| fianchetto knight-screen completion | 6 | 0.92% | 1.06% | +0.14 pp | 73.3→91.4% | fail |

`[V]` (`d1062-style-atom-results.md`)

The local and pooled readings answer different questions. Where a declinable choice exists, the
weight changes behavior substantially. Globally, the configurations are too sparse or the
production top-p set is already committed. Fianchetto completion is the clearest case: ×4 moves
the conditional probability above 90%, yet only 3–6 cells offer both a completion and a
non-completion. Calling that a “fianchetto bot” would advertise behavior most positions cannot
express. `[V]` (same result, opportunity diagnostics)

The preregistered ×2/×8 sensitivity does not rescue the verdict. Even ×8 moves extended-center
pawn play by only **8.54 points**; the other four remain at or below 3.14 points. These are
diagnostics, not post-hoc replacement arms, but they rule out the simplest explanation that ×4 was
just slightly too weak. `[V]` (`d1062-style-atom-results.json` `sensitivity`)

## 3. Architectural consequence

For 1.0, the measured global controlled-trait roster remains the already-qualified general-pawn
arm. These five feature ids must not register additional bot profiles, acquire personality names,
or feed persona copy. A friendly presentation persona may decorate an independently measured
policy, but cannot make an unmeasured policy claim true. `[V]` (`rfc/bot-policy.md` §§2.1, 2.7,
8; D1062 result)

The result narrows the next bot research rather than authorizing a substitute. The existing stack
already separates repertoire, trait policy, timing and memory. A future experiment can test a
declared composition across several literal atoms, a phase-scoped policy, or a transposition-aware
repertoire with explicit coverage/fallthrough. Each exact composed digest needs its own strength,
error-shape, population-match and behavioral-reach measurement. No single-atom result transfers
to the composition. `[M]` (`bot-policy.md` §5; `human-like-opponents.md` §2.6)

Most importantly for the evidence foundation, collector priority and bot-profile eligibility are
now demonstrably separate. The fianchetto and move-role atoms are still required to make R21's
learner habit cards measurable and to let Review state exact facts. Their failure as global bot
weights is not a reason to omit them from the shared registry. `[V]`
(`longitudinal-style-feedback-contract.md` §§2.3, 3; this result)

## 4. Required routing

1. Keep all five atoms in the collector/store foundation backlog under their literal semantics.
2. Amend the bot-policy evidence record to refuse these five single-atom ×4 profile candidates;
   do not add them to the production profile catalog.
3. Keep the measured pawn-heavy arm as the sole controlled-trait profile candidate already earned
   by R11/D969.
4. If a broader personality wave is wanted, preregister one composed or stateful mechanism against
   the same four gates and add an explicit coverage/fallthrough measure. Do not multiply weights
   until something passes.
5. Bot tournament presentation waits on actual policy diversity; decorative names alone do not
   create a tournament worth comparing.

## Limits

- The fixed population has 279 repository positions, not a representative survey of every opening,
  middlegame structure or endgame. The verdict is about the declared 1.0 global-profile gate on
  this accepted population.
- This is a one-ply distribution experiment, not played-game style perception or long-horizon
  strategic coherence.
- No human-like, fun, aggressive, solid, creative or skill claim was tested.
- Fianchetto cells are rare here; that is precisely why the global claim fails, not evidence that
  the configuration is rare in chess generally.
