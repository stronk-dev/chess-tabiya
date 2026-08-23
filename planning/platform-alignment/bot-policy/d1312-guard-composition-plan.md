# D1312 — evidence selector × declared error-guard development screen

**Status:** preregistered 2026-08-23; development population only; the reserved third population
must remain unread until this composition either freezes or is refused.

**Class:** disposable research instrument under the exploration gate; no production policy.

**Question:** does the D1297 proper-score signal survive when the evidence selector is composed
with R11's already-measured, disclosed 250-cp `ErrorGuard`, without hiding how much actual human
play the guard refuses?

## Architectural claim under test

The candidate is not an unconditional model of all human moves. Its honest contract is:

`registered candidate evidence → conditional-choice base → declared ErrorGuard(250 cp) → sampler`

The base estimates choice over the complete legal set. The guard then refuses any move measured
more than 250 cp behind Stockfish's best legal move and renormalizes the remaining mass. The guard
is engine information and must remain visible in the eventual profile declaration. A successful
screen may claim only **human-choice signal among admitted moves**. It may not call the composed
distribution human, human-like, Elo-calibrated, coherent, or representative of human blunders.

This is a separate composition, not a relaxation of D1297. D1297's unguarded standalone failure is
permanent.

## Frozen development inputs

Reuse the compact D1297 cache, exact game folds, candidate legal sets and mixed-score exclusions:

- 515 decisions / 108 games / 17,359 legal candidates;
- representation commit `633f541e245edd1737ee9224c6ed90c26fa009a9`;
- cache SHA-256 `2b568785a0c9f3129fbe1bbd311adc87984733e2b52ee1a32696b09bda4302c1`;
- validation model trained on folds 0/1/2 and evaluated on fold 3;
- confirmation model trained on folds 0/1/2/3 and evaluated once on fold 4.

Use D1297's selected models without another search: engine `raw, lambda=0.01`; combined
`projection-balanced, lambda=0.01`. Use the same bounded L-BFGS implementation and optimizer
contract. Do not change a feature, transform, penalty, threshold, fold or iteration bound after
reading this result. Optimizer diagnostics remain visible; this screen cannot turn a numerically
unfinished base into a frozen coefficient vector.

## Exact guard and controls

For each position compute `lossCp = max(scoreCp) - scoreCp(candidate)` from the same complete
depth-12 legal-set capture. Admit candidates with `lossCp <= 250`; the boundary is inclusive.
Apply the identical mask independently to the fitted engine and combined distributions, then
renormalize each. The complete legal set always contains a zero-loss candidate; assert at least one
candidate survives and forbid an unrecorded fallback.

The control is **guarded engine**, not unguarded engine. Comparing guarded combined with an
unguarded control would attribute the guard's strengthening to evidence.

## Measures

On validation and confirmation separately, report:

1. number and fraction of observed human moves admitted by the mask, pooled and by rating band;
2. the same fraction descriptively by speed and target ply, with counts;
3. number of admitted legal moves per position (minimum, median, p90, maximum, and fraction with
   exactly one survivor);
4. probability mass removed from engine and combined before renormalization;
5. on the common subset where the observed move survives, game-averaged cross entropy,
   played-move probability, top-choice agreement and expected Stockfish loss for guarded engine
   and guarded combined;
6. unguarded D1297 metrics beside the guarded readings so selection cannot erase the base failure;
7. every empty-mask or non-finite event as a hard error.

Observed-move survival and candidate-set summaries use literal decision counts; model quality and
removed-mass readings are averaged per game so a six-decision game does not outweigh a shorter
one. Optimizer iteration count and final gradient norm are reported beside each fitted arm but do
not change this architecture-screen verdict; a passing composition with an unfinished numerical
fit would still owe convergence before any model digest can freeze.

Excluded observed moves do not receive an epsilon probability. Their log loss is infinite under
the composed policy; report them as explicit refusals. Conditional cross entropy is therefore a
measure of selection **among admitted moves**, never a proper score for the full human population.

## Development gate

The composition is eligible to freeze for a third-population preregistration only if all clauses
hold on validation and the once-read confirmation fold:

- at least **90%** of observed human moves survive pooled;
- no rating band's observed-move survival is below **85%**;
- guarded-combined conditional cross entropy is below guarded-engine conditional cross entropy;
- guarded-combined expected loss is no more than 35 cp above guarded engine;
- guarded-combined top-choice agreement is no more than five percentage points below guarded
  engine;
- every position retains at least one candidate and no fallback executes.

The 90% pooled floor carries forward R11's existing maximum 10% human-match loss rather than
inventing a looser budget after seeing exclusions. The 85% band floor is an able-to-fail
anti-pooling guard: a global pass cannot erase one rating population. These are experiment
thresholds, not claims that the remaining difference is perceptually acceptable.

If any clause fails, the evidence selector is withdrawn from the 1.0 bot roster; registered
evidence remains available to Support, Review, drills, player analysis and future research. Do not
try a different cp boundary on these data. If all clauses pass, commit the exact model and mask
digests before selecting or evaluating the third population.

**Post-run process correction (does not change a feature, threshold, measure or verdict):** D1320
landed concurrently and correctly distinguishes a measured mechanism refusal from an owner-tier
product refusal. Read “withdrawn” above as this research lane's recommended disposition for the
exact conditional-logit-plus-250-cp-guard mechanism. Because D1271 is a standing owner ruling to
fund a non-Maia base, removing the selector goal from 1.0 requires an explicit owner/RFC
disposition. A different model family is new research, not a retry of this plan.

## Still blocked after a pass

A development pass would fund only the untouched single-ply population. Multi-ply owner use is
still required for coherence; stated Elo still requires calibration; personality requires a
declared, measured policy transform; and neither this screen nor Stockfish may generate strategic
prose. H5/C5 remain unmet.
