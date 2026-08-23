# D1162 — evidence-to-move head screen

**Status:** preregistered before constructing candidate feature rows or reading any model result.
**Class:** disposable research instrument; no production policy and no engine/network calls.
**Question:** can the registered candidate-evidence plane originate a useful move distribution,
rather than merely modify Maia or a Stockfish candidate roulette?

## Fixed population and leakage boundary

Reuse the surviving R11/D815 capture at `/private/tmp/d815-bot.*`: 279 standard-chess positions,
complete depth-12 Stockfish legal-move enumerations, and Lichess human move counts for bands 1400,
1600 and 1800. The harness hard-fails unless the four D1163 source digests match. Mixed mate/cp
positions are excluded from every arm, as in D1163; no mate value is coerced to centipawns.

The unit is a position, never a candidate row. Assign positions to five folds by the first four
bytes of SHA-256(canonical FEN) modulo five. Every standardization statistic, categorical admission
threshold and model coefficient is fit on four folds and evaluated on the untouched fifth. The
three rating bands share folds but fit separate coefficients. No position, mirrored copy or
candidate from a held-out FEN may enter its training fold.

Human counts are labels only. They never enter a candidate feature. Missing listed human moves
retain zero mass; listed counts remain divided by the response population total, so missing mass
is not redistributed.

## Candidate plane

For every captured legal move, call the shipped `candidateFeatureVector` with the captured
depth-12 score and fixed engine identity. The projection set is exactly the adapter's registered
tactical/breadth closure; the harness may not call a new detector.

Flatten each declared result deterministically:

- projection presence is a binary feature (meaningful for event projections; constant readings
  cancel inside a position);
- finite numeric leaves are path-named continuous features, standardized from the training fold;
- booleans are path-named 0/1 features;
- arrays add a path-named length and recursively expose object/scalar members;
- string leaves become path/value one-hot features only when the value occurs in at least 5% of
  training positions;
- values that are FENs, UCI/SAN moves, board squares, or fields whose key ends in `Id` are omitted.
  They are identity anchors, not generalizable chess features. Array length remains available.

Every feature name retains the projection id and payload path. Thus a later explanation may say
which registered measurements affected mass, but never claim that the feature caused a human move.

## Models

All outputs are softmax distributions over the complete captured legal set.

1. **Uniform** — no fitted parameters.
2. **Engine-only** — one feature, root-frame loss from the captured best cp; same learner-perspective
   sign convention as D1163.
3. **Evidence-only** — flattened registered candidate features; no cp, Maia or explorer frequency.
4. **Evidence + engine** — the union of arms 2 and 3.

Fit a deterministic diagonal linear head against the human move-count distribution. For each
training position and feature, compute the difference between the listed-human-weighted candidate
mean (renormalized only for fitting) and the uniform legal-candidate mean; average those differences
and divide by the feature's training variance plus ridge `λ`. Candidate score is the sparse dot
product and softmax produces mass. This deliberately screens the representation without importing
a machine-learning dependency or hiding a large optimiser behind the result.

Choose `λ` from `{0.01, 0.1, 1, 10}` on exactly one inner validation fold: `(outerFold + 1) mod 5`;
fit the choice on the other three training folds, ties choose the larger penalty, then refit on all
four outer-training folds. Clip each standardized numeric value to `[-8, 8]`; no outcome-aware
feature selection, coefficient pruning or post-result tuning is allowed.

## Measures and controls

Per held-out position and band record:

- human expected move match `Σ predictedMass(move) × humanMass(move)`;
- human cross-entropy over listed mass, reported with the listed-mass denominator alongside it;
- top-choice agreement;
- Stockfish expected loss and mass above 250 cp, as safety descriptions only.

Primary contrasts use paired deterministic position bootstrap intervals (10,000 resamples, seed
`0x1162`): evidence-only minus uniform, and evidence+engine minus engine-only. Report per band and
pooled. Re-run D1163's Maia reconstruction only as a positive/context control; its known failure to
identify every band is not rewritten.

## Predeclared verdict

- **Pass the screen** only if evidence-only beats uniform in pooled expected move match with a
  positive 95% lower bound and does not invert in any band, and evidence+engine beats engine-only
  pooled with a positive lower bound. Legal-set coverage must be 100% for every included position.
- **Refute this representation** if evidence-only fails to beat uniform or the combined head fails
  to beat engine-only. Do not tune another flattening on the held-out result.
- **Inconclusive** if the mean directions pass but either primary interval crosses zero, or if the
  D1163 positive-control population remains too weak to interpret band-specific differences.

A pass funds a second preregistered out-of-sample population and then a multi-ply coherence study.
It does **not** license `human-like`, an Elo label, a personality adjective, or production use. A
failure is still useful: it establishes that current registered arithmetic is explanatory context,
not a substitute policy head, and routes bot work back to Maia/another learned policy model.
