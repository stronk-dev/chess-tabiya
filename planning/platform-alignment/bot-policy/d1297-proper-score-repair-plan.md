# D1297 — proper-score selector repair and untouched-population gate

**Status:** development protocol opened 2026-08-23 after the second D1162 result; no third-population
result may be read until the model family is frozen here.
**Class:** disposable research instruments only; no production policy.
**Question:** can the replicated registered-evidence signal become a calibrated choice distribution,
or does it exist only under the non-proper mean-probability measure that D1297 refuted?

## Why this is a repair, not a third try at the same gate

The two D1162 populations are now **development data**. The second screen assigned an arithmetic
mean probability of 0.145 to observed moves while its geometric mean was 0.00158; cross entropy
more than doubled against engine-only. Mean probability on the realized class is not a proper
scoring rule. The logarithmic score is strictly proper (Gneiting and Raftery, 2007,
https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf), so log loss becomes
the selection and final-clearance measure rather than a secondary reading.

The replacement model is a conditional logit over the complete legal choice set: each candidate's
systematic utility is a linear function of its registered attributes and softmax produces the
choice probabilities. This is the finite-choice-set model McFadden describes as conditional logit
(Nobel lecture, https://www.nobelprize.org/uploads/2018/06/mcfadden-lecture.pdf). The model form is
appropriate to the data shape; it does not establish the model's chess validity.

## Development population and immutable inputs

Use only the already-seen D1162 independent population for model development:

- 515 admitted decisions from 108 games after the declared mixed mate/cp exclusion;
- 17,359 complete legal candidates;
- folds remain game-keyed; no decision from a held-out game enters training;
- candidate features are cached from clean representation commit
  `633f541e245edd1737ee9224c6ed90c26fa009a9` and retain the two raw-input digests;
- labels, rating, speed, ply, game id and outcome never enter candidate attributes.

Development may compare only these predeclared transforms:

1. **raw** — D1162's existing standardized flattened evidence attributes;
2. **projection-balanced** — the same values, with each projection's admitted feature block scaled
   by `1 / sqrt(block feature count)` after outer-fold admission, so a verbose projection does not
   receive more aggregate norm merely because its payload has more leaves.

Both retain the separate standardized engine-loss attribute. No projection, feature, coefficient,
sign or rating interaction is selected by looking at individual held-out moves.

## Proper conditional-choice fit

For each of `engine`, `evidence`, `combined`, minimize:

`mean_game(mean_decision(-score(played) + logsumexp(scores))) + lambda * ||weights||² / 2`.

Use deterministic full-batch Adam from zero weights, 600 updates, learning rate 0.03,
`beta1=0.9`, `beta2=0.999`, epsilon `1e-8`, and gradient-norm clipping at 10. The implementation
must carry an analytic-gradient finite-difference control and a monotone synthetic choice fixture.
Non-finite loss, probability or coefficient is a hard failure.

This is a **development** split, not another inferential five-fold result: train on game folds
0/1/2 (62 games), choose `lambda` from `{0.01, 0.1, 1, 10, 100}` and `raw` versus
`projection-balanced` on fold 3 (25 games), then read fold 4 (21 games) exactly once as an internal
confirmation. Ties choose the larger penalty and projection-balanced transform. A candidate that
fails confirmation is rejected; nothing is changed in response. Refit the frozen candidate on all
108 development games only for the later third-population evaluation. This bounded three-way
development design is intentionally cheaper than nested CV because statistical clearance belongs
to the untouched third population, not data already exposed by D1297.

## Development measures and freeze rule

Report game-averaged cross entropy, played-move probability, top-choice agreement, expected
Stockfish loss and mass above 250 cp. Also report played-probability quantiles and fractions below
`1e-6`, `1e-4` and `1e-2`, so another arithmetic/geometric split cannot hide.

A candidate is eligible to freeze only if all five rules hold on both validation and the once-read
confirmation fold:

- evidence-only cross entropy is below uniform;
- combined cross entropy is below engine-only;
- combined expected loss is no more than 35 cp above engine-only;
- combined >250-cp mass is no more than one percentage point above engine-only;
- combined top-choice agreement is no more than five percentage points below engine-only.

The game-bootstrap upper-bound-below-zero rule is reserved for the untouched third population,
where it is inferential rather than a post-selection interval. If neither transform qualifies, the standalone evidence-to-move base is refuted for 1.0. Do not
add hidden layers, band interactions, feature selection or a wider search after seeing the result;
those would require a separately named development generation.

## Third population — untouched final gate

Only after one transform and its full optimizer contract are frozen, derive a third population
from `/private/tmp/tabiya-r2-prefix.pgn`, whose 120,061,952 bytes and SHA-256
`6446d0ba6d613f4723875c8695078d4c67ea4ba39e709449da34617859831004` match the committed R2
fixture provenance. Skip every game used by `imported-sample.pgn`, then take the next twelve legal
complete games in each of the same nine speed/rating cells. Use the same target plies, duplicate
removal, overlap removal against both earlier populations, game folds, Stockfish-18 depth-12
complete legal-set capture and mixed-score exclusion. Selection may not inspect a detector,
engine score or played-move likelihood.

The final preregistration pins the extracted population and frozen model digests before fitting or
reading its result. Pass only if all five directional/safety rules reproduce on the third population
without tuning **and** both log-loss improvements have game-bootstrap 95% upper bounds below zero.
A pass funds multi-ply owner-use packet generation; a failure returns or withdraws
the selector RFC. Neither result licenses `human-like`, Elo, personality, skill or causal prose.
