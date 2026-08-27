# Evidence-to-move selector — research/RFC reconciliation return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/evidence-move-selector.md`

**Verdict:** **RETURNED.** The RFC still presents the original diagonal evidence head as an
implementation candidate gated on D1162's first pass. Later preregistered research already refused
that head, refused its proper-score standalone repair, and refused the fixed 250-cp guard
composition. Implementing this document would knowingly ship a refuted policy family.

## Evidence chain

1. D1162's first population found candidate-evidence signal, but its mean played-move-probability
   gate was not a proper score.
2. The independent population reproduced that mean-probability signal while combined cross entropy
   worsened from 2.958 to 6.451, top-choice agreement fell from 33.5% to 15.8%, and severe mass rose
   from 23.0% to 43.4%.
3. D1297 replaced the fitting objective with proper conditional logit. Combined cross entropy then
   beat engine-only, but severe mass exceeded the fixed safety ceiling on both held-out folds by
   1.97 and 1.34 percentage points. The standalone base was refused and no coefficients froze.
4. D1312 composed the same evidence policy with the declared 250-cp guard. Validation cross entropy
   missed its comparator and the confirmation low-rating cell admitted only 82.4% of observed moves
   against the 85% floor. The threshold was not retuned and the reserved third population stayed
   unread.
5. D1328 identified a materially different set-dependent choice family, but correctly made data
   readiness—not another small fit—the next gate. D1329's source arm now supplies 48.47 million
   eligible decisions across all 36 frozen cells; projection coverage/cost and the owner compute
   ceiling remain open.

## What remains valid

Legal-set coverage must replace mass-sum completeness for any future score-derived base. Authored
chess-value weights remain refused. Model features need registered compact projections instead of
recursive payload flattening. Policy, safety guard, calibration and human-likeness validation stay
separate. The candidate evidence plane remains valuable to Support, Review, drills, analysis,
style and bot research even though this consumer failed.

## Required amendment

The author must remove the diagonal selector as the implementation body. The RFC must instead
present the owner disposition ruled under [[D1320]]:

- fund the already-open set-dependent data-readiness/training programme;
- defer that programme beyond 1.0 and ship measured Maia for standard chess plus disclosed engine
  play for variants; or
- explicitly refuse the non-Maia human-policy goal for 1.0.

If funded, this RFC cannot become buildable until D1329 completes projection success/cost, the
owner sets the compute/storage ceiling, and a new preregistered learning-curve/model-family gate
passes. The future type contract must name compact versioned feature projections, set-equivariance,
complete legal-set closure, proper loss, declared context, separate guard evaluation and the
no-causal-explanation boundary. None of that may be inferred from the current draft.

## New process finding ([[D1899]])

The research and ledger already say the selector was returned, but the active RFC register still
advertised the original first-screen gate and the RFC status still read plain `draft`. This is the
same flow-back failure the lifecycle contracts were built to prevent, now inside a product-kill
result. A research verdict that changes build authorization must update the active RFC status and
register in the evidence commit or create an explicit closeout obligation that cannot disappear.
