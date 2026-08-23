# D1073 — state-directed opening profile

**Opened:** 2026-08-23
**Authority:** D1062's explicitly routed composed/stateful follow-up; disposable research only
**Status:** complete — coverage and safety pass; the 10-point controlled-behavior gate fails
(+4.85 pp at ×4, +6.83 at diagnostic ×8). The candidate profile is refused.

## Question

Can a phase-scoped policy create a visible, reproducible opening route by preferring moves that
reduce an exact target-configuration distance, without changing the bot outside that scope or
breaking the existing strength/error/human-population gates?

This is not a personality or human-likeness test. A pass earns only a mechanically named policy
layer: `kingside_fianchetto_route@1`.

## Frozen population and base

Reuse D1062/D969 without provider calls: 279 positions × Maia 1400/1600/1800, whole-cell mate/cp
abstention, 804 cells, reconstructed production sampler, depth-8 250-cp guard, Explorer reference.
No input or threshold may change after the result is read.

## Exact route potential

For the mover, the target is the three typed occupancies:

- White: own pawn g3, bishop g2, knight f3.
- Black: own pawn g6, bishop g7, knight f6.

`distance` is the count of unsatisfied occupancies. A candidate is route-progress exactly when its
legal child has lower distance than the root. It is not progress when it merely preserves the
configuration, places the wrong role/color on a target, or moves after all three targets are
satisfied. No intent, quality, plan coherence or strategic claim is inferred.

The transform runs only on positions classified `opening`. It applies the already accepted ×4
multiplier to progress candidates after the 250-cp guard and renormalizes. Every non-opening cell
must be byte-equal to the guarded base distribution.

## Gates

All must pass:

1. On opening cells, route-progress probability rises by at least 10 percentage points.
2. At least 10% of opening cells offer both a guarded progress and non-progress candidate. This is
   the coverage/fallthrough gate D1062 lacked; conditional strength cannot hide a three-cell arm.
3. Across all 804 cells, expected Stockfish loss differs by at most 35 cp from unguarded production,
   ≥250-cp mass rises by at most 1 percentage point, and Explorer match retains at least 90%.
4. Every non-opening output distribution equals guarded base exactly.

Diagnostics may report per-band rates and ×2/×8 sensitivity, but cannot replace ×4. A failed route
does not authorize looser geometry, a repertoire claim, or post-hoc composition.

## Able-to-fail fixtures

- `g2g3`, `g1f3` and legal `f1g2` lower the White target distance from appropriate roots.
- a preserving move after completion does not fire;
- an enemy or wrong-role occupant does not satisfy a target;
- a middlegame candidate that would lower the same distance is not transformed;
- the D969 pawn positive and forcing negative controls still reproduce.

## Outputs

- `tools/d1073-state-directed-bot-harness/`
- `planning/platform-alignment/bot-policy/d1073-state-directed-profile-results.{json,md}`
- `design/research/state-directed-bot-profile.md`
