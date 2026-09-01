# Human divergence: is the live marker about human disagreement?

**Question:** D52, the last unmeasured live pivotal marker. The shipped detector marks a
recorded `human_common` selection when its normalized Maia candidate window has no mass above
0.50 and at least three masses at or above 0.15
(`packages/runtime/src/pivotal.ts:25-40`). `rfc/archive/live-marker-quality.md` §3 L2(ii)
correctly says the ordinary played-move-versus-alternatives instrument cannot measure this
event-shaped detector. It requires a named substitute population and owner approval.

**Instrument:** `tools/d52-human-divergence-harness/`, run by
`make human-divergence-measurement`. The committed result is
`planning/live-marker-quality/d52-human-divergence-results.json`. Production code imports none
of the harness. `[V]`

## 1. Verdict

**Measured, but not endorsed for the unasked live surface.** Maia's full move distribution is
reasonably close to the recorded Lichess human distribution in this opening-only population;
the thresholded `human_divergence` label is not. The marker also consumes most of the live
surface's volume budget and is materially band-dependent. `[V]`

The external arm crosses **133** non-terminal R9 positions with recorded Lichess blitz+rapid
move counts against the shipped `OpponentSelector` at the same 1400/1600/1800 band. Maia and
the human population choose the same top move on **80.45%** of positions; median total-variation
distance is **0.1289** and median Jensen-Shannon divergence is **0.0368 bits**. Those are useful
distribution-level results. But the binary label has **10 true positives, 7 false positives,
5 false negatives and 111 true negatives**: precision **58.82%** (Wilson 95% CI
36.01–78.39%), recall **66.67%** (41.71–84.82%), and accuracy **90.98%** against an
**88.72% always-negative baseline**. The label buys 2.26 percentage points over silence on a
population with only 15 positive cases. `[V]`

The volume arm runs **1,914** production selections: all **638** unique current draft-pack
decision positions at bands 1100/1500/1900. The marker fires on **292/1,914 = 15.26%** of
opponent decisions. Since opponent decisions occupy one of every two ordinary plies, that is an
estimated **0.0763 markers per played ply**—**76.3%** of L3's complete live-union ceiling of
0.10 before `last_of_role`, `phase_change` or `option_collapse` contributes anything. In the
opening slice it reaches **0.0963 per played ply**, leaving 0.0037 for the rest of the union.
`[V]`

**Recommendation `[M]`:** approve the R9 recorded-selection population as L2(ii)'s substitute
and demote `human_divergence` from unasked-live to on-request/retrospective. Preserve the raw
Maia distribution as grounded evidence. A future learner module may ask a useful question of
that evidence—*"Was this a choice where human play is genuinely split?"*—but the current raw
mass sentence should not announce itself merely because three detector-chosen cutoffs happen
to pass. This recommendation is not executed here: L2(ii) explicitly reserves substitute-
population approval to the owner, and the archived RFC is immutable.

## 2. Populations and method

### 2.1 External human-choice population

R9's greedy-walk instrument starts from the standard position and repeatedly follows the most
played move at rating bands 1400/1600/1800. It recorded the top 12 human moves and their exact
counts; its independently measured choice-level coverage ends around plies 19–21
(`design/research/human-outcome-coverage-depth.md` §§2, 7.1;
`tools/r9-explorer-depth-harness/out/walk-{1400,1600,1800}.jsonl`). `[V]`

The D52 harness replays every stored SAN history into chessops and refuses any row whose replayed
FEN differs from the recorded FEN. Three R9 frontier records are excluded before probing because
they have no selectable human distribution (`total <= 0` or no moves); one is terminal. That
leaves **133** comparisons. Each history goes through the production `OpponentSelector` in
`human_common` mode at the row's own rating band. The engine identity recorded in the result is
Maia3 commit `1e13597c…`, model `maia3-5m@b6559de…`, with Elo honoured and seed not honoured.
All **2,047/2,047** total probes completed. `[V]`

Both distributions are normalized over their recorded candidate windows. This matches the
shipped marker, which removes `offWindow` candidates and renormalizes the remaining masses
(`packages/runtime/src/pivotal.ts:29-36`). It also makes the limitation explicit: Lichess is
top-12 and Maia is capped at its recorded MultiPV window, so the comparison is between the
evidence each surface actually retains, not an unobserved full legal distribution. `[V]`

The human target applies the same 0.50 / 0.15 / three-candidate predicate to Lichess counts.
This is not a human usefulness label. It is a direct test of the detector's name: when Maia says
the human policy is broadly split under this convention, do recorded humans satisfy the same
convention? `[V]`

### 2.2 Corpus-volume population

The existing R4 extractor walks every non-fixture draft pack, preserves each position's exact
start FEN and move history, and deduplicates on reached FEN
(`tools/r4-difficulty-harness/extract.ts`). At current HEAD it finds **50 packs, 888 raw
positions and 638 unique decision positions**. D52 crosses each one with bands
1100/1500/1900 and uses the same production selector path as the external arm. `[V]`

This population is a proxy for live volume, not a learner log. Authored positions overrepresent
the consequences the current content chose to teach, and equal band weighting is not production
traffic. The result therefore estimates whether the live budget is plausible; it does not claim
the user's eventual firing rate. `[V]`

## 3. What the external comparison says

| Measure | Result |
|---|---:|
| Positions | 133 |
| Human positives | 15 |
| Maia-marker positives | 17 |
| TP / FP / FN / TN | 10 / 7 / 5 / 111 |
| Precision | 58.82% (95% CI 36.01–78.39%) |
| Recall | 66.67% (95% CI 41.71–84.82%) |
| Accuracy | 90.98% |
| Always-negative accuracy | 88.72% |
| Top-move agreement | 80.45% |
| Median total-variation distance | 0.1289 |
| Median Jensen-Shannon divergence | 0.0368 bits |

All values come from the committed result. `[V]`

The important split is distribution versus classification. The top-move and distance measures
say Maia carries useful evidence about human choice in this population. The confusion matrix
says the three hard cutoffs are a weak way to convert that evidence into an unasked event. Seven
of the seventeen live firings do not reproduce in the real human counts, while five of fifteen
human-positive positions are missed. `[V]`

Accuracy is misleading here because negatives dominate. A detector that never fires scores
88.72%; the shipped detector scores 90.98%. The measured gain is **2.26 points**, with only
17 predicted-positive witnesses. This dossier therefore refuses both overclaims: it does not
call the marker validated, and it does not call Maia's policy useless. `[V]`

## 4. Volume, phase and band dependence

| Slice | Decisions | Firings | Decision rate | Estimated per played ply |
|---|---:|---:|---:|---:|
| All | 1,914 | 292 | 15.26% | 0.0763 |
| Opening | 462 | 89 | 19.26% | 0.0963 |
| Middlegame | 441 | 69 | 15.65% | 0.0783 |
| Endgame | 684 | 92 | 13.45% | 0.0673 |
| Cross-phase | 327 | 42 | 12.84% | 0.0642 |

`[V]` from `d52-human-divergence-results.json`.

The marker does not violate L3 by itself on the pooled proxy: 0.0763 is below 0.10. But L3 is
defined over the **union**, not this kind. A single kind consuming 76.3% of the budget cannot be
called cheap; the opening slice consumes 96.3%. The union still requires a common played-run
population for all admitted kinds, so this is evidence toward pressure on L3, not a declaration
that the union fails. `[V]`

Band dependence is large enough to be part of the meaning, not an implementation detail:
firings fall from **17.40% at 1100** to **15.20% at 1500** and **13.17% at 1900**. More
directly, **145/638 = 22.73%** of positions change their fire/no-fire classification across the
three bands. The sentence names the engine, but a learner-facing module must also retain the band;
otherwise the same position acquires or loses “human divergence” merely because a hidden opponent
preset changed. `[V]`

## 5. The constants are brittle

The 27-cell sensitivity grid varies top-mass ceiling {0.4, 0.5, 0.6}, per-candidate floor
{0.1, 0.15, 0.2}, and candidate count {2, 3, 4}. Corpus firing rates span **0% to 58.83%**.
No nearby grid cell establishes a clean external discriminator: among cells producing any
positive, precision ranges 18.67–58.33% and recall 6.67–93.33%. These are descriptive probes,
not a tuned model; selecting the best cell on the same 133 rows would overfit the validation
population. `[V]`

Even at the shipped constants, **56/292** firings lie within 0.01 normalized mass of one cutoff,
and **109/292** lie within 0.02. The minimum margin is **0.0001** and the median **0.0293**.
R5 established that the pinned Maia scalar is bit-stable on the same host/model
(`design/research/maia-policy-scalar-stability.md` §3), so this is not run-to-run noise. It is
semantic brittleness: small legitimate model/version/band changes can relabel many decisions.
`[V]`

## 6. Evidence producer versus learner module

This result reinforces the architectural separation rather than narrowing evidence collection.
The useful primitive is the recorded distribution: candidate identities, masses, engine/model,
band and candidate-window scope. The thresholded event is a derived classifier over that
primitive. The live sentence—three percentages with no learner question—collapses those layers
into a raw dump (`packages/runtime/src/pivotal.ts:123-126`). `[V]`

The evidence can power several bounded consumers without claiming a move is good:

- on request: show whether human/model play is concentrated or dispersed, with the band named;
- post-commit: contrast the committed move's mass with the distribution without grading it;
- Review: identify decisions where the learner chose outside the common human set;
- bots: sample the same distribution while keeping the opponent policy separate from guidance;
- longitudinal analysis: aggregate opportunity-normalized choice rarity only after the store and
  stable position/opportunity identity exist.

These are product proposals `[M]`, not findings and not implementation authority. Each still
needs its owning accepted RFC/module declaration. The measurement establishes only that keeping
the raw vector is valuable and broadcasting the current thresholded sentence is not justified by
the evidence gathered so far.

## 7. Limits and decision

1. The external population is 133 opening-walk positions. R9 already establishes why Lichess
   explorer cannot supply a comparable middlegame/endgame population at useful depth
   (`human-outcome-coverage-depth.md` §§4, 7). `[V]`
2. Lichess records blitz+rapid humans across each rating bucket; Maia is a learned policy model.
   Agreement is corroboration, not identity. `[V]`
3. Neither arm asks a learner whether the unasked sentence was useful. The result validates a
   factual label and estimates cost, never experience. `[V]`
4. The live union rate remains unmeasured on actual play. `[V]`

**Owner decision required by the standing rule:** approve or reject the R9 recorded human-choice
population as `live-marker-quality` L2(ii)'s substitute. If approved, decide whether 58.82%
precision, a 2.26-point gain over silence, 0.0763 markers/ply and 22.73% band-variant positions
constitute failure and trigger L6 demotion. The research recommendation is **approve + demote**.
