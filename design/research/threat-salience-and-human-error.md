# Threat recency does not explain severe human-error mass on the retained bot corpus

**Question:** D815 — does exact threat recency add human-error signal after engine-priced choice
breadth, band, phase and ply are already known?

**Feeds:** F8 / `rfc/bot-policy.md` discharge D2, D811, H5/C5, and the opponent-selection
evidence roster.

**Method:** executable measurement under the predeclared
`planning/platform-alignment/bot-policy/d815-salience-plan.md`. The harness and committed aggregate
are `tools/d815-salience-harness/`. No threshold, feature or population rule changed after seeing
the result.

## Verdict

**Kill salience-shaped error from the 1.0 bot roster.** All three admission clauses fail. Exact
threat recency remains useful descriptive chess evidence, but this result does not license it as a
bot-error weight, a human-difficulty label, or an explanation of an individual move. `[V]`

This is a refusal of one proposed relationship, not of threat collection. Support, Review and
drill modules may still render an exact created/retained threat when their own evidence contracts
admit it; the unsupported leap was from that true board fact to “humans are more likely to miss
this class.” `[V]`

## Population and instrument

The run reused R11's retained snapshot rather than making a new explorer pull: 279 decision
positions, three explorer bands (1400/1600/1800), exact start/history, the committed SAN→UCI map,
and full-legal-move Stockfish depth-12 rows. Input digests are in `out/summary.json`. `[V]`

For the actor who made the preceding move, the harness replayed the exact position and compared
the shipped `threat@1` identities before and after that move. It emitted four position flags:
attacker just moved, stationary threat created, retained threat, and no current threat. Per
position-band, the target was the lower bound on explorer mass assigned to legal moves at least
250 cp behind best. Unlisted explorer mass was never redistributed and mate was never converted to
centipawns. `[V]`

The base model used legal severe-choice fraction, band and phase fixed effects, and scaled ply. The
augmented model added the three threat flags. Evaluation used deterministic ten-fold
cross-validation grouped by pack plus 200 fixed-seed joint feature permutations inside the
predeclared phase/severe-fraction-quartile strata. `[V]`

Of 279 probes, 193 positions / 570 band cells were usable. Named exclusions were 55 positions with
zero explorer total, 12 without a preceding move, 11 with a typed mate score, four where
`threat@1` abstained, and four whose history replay failed. SAN mapping coverage across retained
cells was 91.30% minimum, 99.66% median and 100% maximum. `[V]`

## Results against the frozen clauses

| Clause | Required | Measured | Result |
|---|---:|---:|---|
| Coverage | both primary flags on ≥20 positions | attacker-just-moved **29**; stationary-created **7** | fail |
| Incremental prediction | grouped-CV RMSE improvement ≥2%, permutation p ≤.05 | **−0.477%** improvement (RMSE .022998 → .023108); p **.6766** | fail |
| Direction | stationary-created residual above attacker-moved pooled and in ≥2/3 bands | pooled false; **1/3** bands | fail |

`[V]` — `tools/d815-salience-harness/out/summary.json`.

The feature family did not merely miss significance. On this retained population the augmented
model predicts slightly worse out of pack, and the observed pooled residual is marginally lower
for stationary-created threats (−.002934) than for attacker-just-moved threats (−.002837), the
opposite of the proposed direction. `[V]`

## Consequences

1. F8 must keep salience-shaped error absent for 1.0 and discharge D2 as a measured refusal. No
   registered profile, weight or fallback is permitted from this result. `[V]`
2. D811's evidence-backed general claim survives: human error is difficulty- and
   attention-conditioned. Its specific proposed hierarchy—stationary/discovered threats being
   missed more than threats by the moved attacker—does not survive this test. `[V]`
3. The exact threat identities themselves remain legitimate shared evidence. Their Support/Review/
   drill value must be selected on those surfaces' own informativeness and grounding criteria,
   not laundered through a failed bot hypothesis. `[V]`
4. H5 and C5 remain untouched. This position-level population statistic neither compares complete
   opponent branches nor establishes perceived humanness, coherence or fun. `[V]`

## Limits

- The retained population is the opening/cross-phase R11 snapshot; it is not a representative
  middlegame or endgame sample. This is why the verdict is explicitly “kill for 1.0,” not a claim
  that no future corpus could ever find a relationship. `[V]`
- Stationary-created coverage is only seven positions. The predeclared rule treats insufficient
  coverage as a refusal, rather than permission to ship an uncalibrated mechanism. `[V]`
- Explorer mass is an aggregate population outcome with incomplete move listing. It cannot explain
  the intention or visibility of any individual move. `[V]`
- The run evaluates the shipped exact threat vocabulary. It does not test every tactical motif or
  perceptual feature, and it provides no evidence for inventing a replacement after the fact. `[V]`
