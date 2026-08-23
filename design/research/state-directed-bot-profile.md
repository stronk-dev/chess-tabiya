# A state target still does not become a bot identity by reweighting Maia once

**Question:** D1073, follow-up to D1062/R11
**Date:** 2026-08-23
**Instrument:** `tools/d1073-state-directed-bot-harness/`
**Status:** fixed-population measurement complete; the candidate route layer is refused at ×4

## Verdict

An exact, phase-scoped target fixes D1062's sparsity problem but not its control problem. The
pre-registered kingside-fianchetto route has a declinable choice in **80/447 opening cells
(17.9%)**, comfortably above the 10% coverage gate. Yet multiplying every legal move that reduces
the exact setup distance by four raises opening route-progress probability only **10.36% → 15.21%
(+4.85 percentage points)**, below the required ten points. Diagnostic ×8 reaches only +6.83.
`[V]` (`d1073-state-directed-profile-results.json`)

The transform is safe on the measured population: expected depth-8 loss changes by −1.60 cp,
≥250-cp mass falls 0.43 points, Explorer-match retention is 100.01%, and every non-opening output
distribution is byte-equal to guarded Maia. It is therefore a valid weak preference, not a visible
controlled profile. The product must not call it a fianchetto bot, style or personality. `[V]`

Together D1062 and D1073 rule out two increasingly plausible shortcuts:

- a global completion-event weight fails because the exact event is too sparse (3–6/804 cells);
- a phase-scoped target-potential weight reaches 80 cells but still cannot move the phase-level
  behavior enough through Maia's existing concentrated sampler.

More multiplication is not a research direction: ×8 was pre-registered as a diagnostic and also
fails. A controlled opening identity needs a different mechanism class—candidate generation from
a transposition-aware repertoire or a multi-ply route controller with explicit adherence,
deviation and fallthrough—not a stronger label over the same one-ply reweighting.

## Exact mechanic

The target is deliberately arithmetic rather than chess prose:

| side | pawn target | bishop target | knight target |
|---|---|---|---|
| White | own pawn g3 | own bishop g2 | own knight f3 |
| Black | own pawn g6 | own bishop g7 | own knight f6 |

Distance is the number of unsatisfied typed occupancies. A candidate fires exactly when its legal
child reduces that count for the mover. Preservation, wrong-color/wrong-role occupancy and play
after completion do not fire. The policy applies after the measured 250-cp guard and only where
the captured phase is `opening`; outside that phase it returns the guarded distribution unchanged.
No claim of intent, quality, plan coherence or strategic merit is made. `[V]`

This is materially stronger than the D1062 completion atom: g3, Nf3 and Bg2 can each contribute,
so the policy sees the route before its last move. The able-to-fail fixtures cover all three steps,
preservation and wrong-role occupancy.

## Population and controls

The experiment reuses D969/D1062's frozen provider captures without new calls:

- 279 positions × Maia bands 1400/1600/1800 = 837 input cells;
- 33 mixed mate/cp cells abstain whole, leaving 804;
- 447 cells are classified opening;
- production sampler is Maia temperature .8 / top-p .92;
- depth-8 250-cp guard precedes the route transform;
- Stockfish-loss and Explorer-match reference inputs retain their recorded digests.

The independent controls reproduce D969: production expected loss 20.821109 cp / Explorer match
0.313290; pawn ×4 19.945575 / 0.309485; forcing ×3 19.965684 / 0.311082. The instrument can still
reach both the previously passing and failing controls. `[V]`

## Result

| population | cells | base route rate | ×4 route rate | delta | opportunity cells | coverage |
|---|---:|---:|---:|---:|---:|---:|
| opening | 447 | 10.36% | 15.21% | +4.85 pp | 80 | 17.90% |
| all | 804 | 8.27% | 10.96% | +2.70 pp | 128 | 15.92% |

Within the 80 declinable opening cells, probability moves **40.37% → 67.48%**. This is useful
diagnostic evidence: the transform works locally, but the advertised phase-level identity would
be absent from too much actual play. Conditional strength cannot replace the declared reach gate.

The all-population route rate includes exact opportunities in later positions only as a diagnostic;
the candidate policy does not transform those cells. That distinction is why the instrument also
requires byte equality outside the opening.

## Architectural consequence

The shared evidence foundation remains useful: exact configuration distance can power an
inspector, authored drill objective, opening-route Review fact, repertoire controller or bot-policy
operand. Its failure as a sampler multiplier is not a collector failure.

The next bot research, if commissioned, must preregister a sequence-level mechanism with:

1. a versioned transposition-aware repertoire/target identity;
2. adherence and legal deviation rules over multiple plies;
3. an explicit fallthrough into guarded Maia;
4. opportunity coverage and route-completion measures, not only one-ply mass;
5. the same loss/error/Explorer gates plus game-length repetition and outcome checks;
6. no personality or “human-like” copy before owner use.

That mechanism can consume the D1071 candidate-event packet and opening identity; it must not
reimplement collectors or read learner history. Bot policy and player classification continue to
share fact vocabulary, never state or proof.

## Limits

- The population is the fixed repository/Explorer sample, not all openings.
- This is a distribution experiment, not a played multi-ply route or perception test.
- Only one exact kingside setup was tested; failure does not imply every repertoire mechanism fails.
- No aggressive, solid, creative, coherent, fun or human-like claim was measured.
