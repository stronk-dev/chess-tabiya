# Evidence-to-move head screen — can registered evidence originate move mass?

**Question:** D1162/D810. Can the registered candidate-evidence plane produce a move distribution
that resembles observed human choice better than uniform, and add information beyond an
engine-loss-only head?

**Feeds:** `rfc/evidence-move-selector.md`, F8, D1271, H5/C5, and the shared evidence foundation
used by bots, Review, guidance and drills.

**Method:** preregistered disposable measurement. The frozen plan is
`planning/platform-alignment/bot-policy/d1162-evidence-head-plan.md`; the instrument and committed
aggregates are under `tools/d1162-evidence-head-harness/` and
`planning/platform-alignment/bot-policy/d1162-evidence-head-results.{json,md}`. All factual claims
below are direct readings of those files or the separately named D1163 control and are `[V]`.

## 1. Verdict

**The current registered evidence representation passes its preregistered one-ply screen.** Over
268 held-out positions and all 9,044 captured legal candidates, evidence-only improves expected
human-move match over uniform by **0.033734**, with a position-bootstrap 95% interval of
**[0.024141, 0.045075]**. Adding evidence to engine loss improves the same measure over engine-only
by **0.018734 [0.009559, 0.029689]**. Coverage is 100%, and both contrasts are positive in each of
the 1400, 1600 and 1800 bands. `[V]`

This is a **representation pass**, not a product clearance. It funds the preregistered second
out-of-sample population and then a multi-ply coherence study. It licenses none of: “human-like”,
an Elo label, a personality claim, production use, learner move grading, or causal prose about why
a human chose a move. `[V]`

## 2. Population and leakage boundary

The screen replays the surviving R11/D815 capture: 279 standard-chess positions with complete
depth-12 Stockfish candidate enumerations and Lichess human counts for three bands. Eleven
positions mixing mate and centipawn scores are excluded rather than coercing mate to cp, leaving
268 positions. The four source digests are hard-pinned in the result. No engine or network request
runs. `[V]`

Position—not candidate—is the split and bootstrap unit. `sha256(canonical FEN)[0..3] mod 5`
produces folds of 67/61/50/52/38 positions. Standardization, categorical admission and coefficients
use four folds; the fifth is untouched. Human counts are labels only and unlisted response mass is
not redistributed for the primary match measure. `[V]`

Every captured legal move is passed through the shipped `candidateFeatureVector`. The harness uses
only its registered tactical/breadth closure, removes FEN/UCI/SAN/square/id leaves, and flattens the
remaining literal numbers, booleans, categorical values and array lengths. It adds no detector and
does not select features after seeing a held-out result. `[V]`

## 3. Primary result

| contrast | 1400 | 1600 | 1800 | pooled, position-bootstrap 95% CI |
|---|---:|---:|---:|---:|
| evidence-only − uniform | 0.032977 | 0.034493 | 0.033733 | **0.033734 [0.024141, 0.045075]** |
| evidence + engine − engine-only | 0.019270 | 0.019198 | 0.017733 | **0.018734 [0.009559, 0.029689]** |

The pass is not created by pooling: every per-band interval also has a positive lower bound. The
direction is nearly flat across bands, which is useful for representation portability but is not
evidence that the head distinguishes skill bands. `[V]`

## 4. The adverse secondary readings

The preregistered primary is expected move match, and it passes. Other recorded measures prevent a
stronger conclusion:

- The combined head's cross-entropy is **worse** than engine-only in every band: 2.193 vs 2.179,
  2.295 vs 2.238, and 2.315 vs 2.232. It concentrates more mass on some popular choices without
  improving the likelihood of the whole listed human distribution. `[V]`
- Top-choice agreement is about **21%** for the combined head versus **58–60%** for engine-only.
  Uniform's reported top agreement is a tie-index artefact and is not interpreted. `[V]`
- Combined expected engine loss rises from roughly **118 cp** to **135–140 cp**, and mass above
  250 cp rises from roughly **13%** to **18–20%**. Production therefore still needs the separately
  specified error guard; evidence resemblance is not safety. `[V]`
- Every evidence-only and combined inner selection chose the largest tested ridge penalty,
  `lambda = 10`. The grid hit its boundary, so the second preregistration must declare how it
  handles that boundary before seeing its new population. This run is not retuned. `[V]`

The result therefore says the evidence plane contains signal about human move distribution. It
does **not** say the simple diagonal head is the final selector.

## 5. Instrument corrections before verdict

The first run produced an attractive provisional pass and was not accepted. Two conformance bugs
were repaired before this dossier was written:

1. the coefficient denominator used the second moment (`p`) for binary/categorical features rather
   than the preregistered variance (`p(1−p)`); an able-to-fail fixture now distinguishes them; and
2. pooled resampling treated the three bands from one FEN as independent; it now resamples the 268
   positions and retains all three paired band observations together. `[V]`

The corrected run strengthens the two means from 0.029316/0.014688 to 0.033734/0.018734. The
earlier files were overwritten and are not evidence. `[V]`

The first construction also exposed a production contract defect: an in-check `threat@1`
abstention omitted its manifest-declared `threats` operand. The producer now carries the honest
empty collection, and a candidate-vector fixture proves a checking move crosses the exact adapter.
No seal was weakened for the experiment. `[V]` (`packages/runtime/src/tactics.ts`;
`apps/server/src/candidate-evidence.test.ts`)

## 6. Context control and limits

The D1163 Maia reconstruction was replayed on the same four pinned captures. Its test passes, and
its existing context verdict remains **abstain** because nominal band is not identifiable by the
declared own-band-peak control. That does not rescue or veto D1162: D1162's paired contrasts ask
whether evidence adds within the same held-out positions, not whether a profile deserves an Elo
label. It does reinforce the prohibition on band/personality claims. `[V]`
(`design/research/engine-composed-band-discriminator.md`;
`tools/d1163-engine-composed-bot-harness/engine-composed.test.ts`)

The population is authored-line-heavy standard chess, the raw capture survives only under
`/private/tmp`, the test is one ply, and no selected sequence was judged coherent or fun. D1166's
capture reproducibility debt remains. H5 and C5 therefore remain unmet. `[V]`

## 7. Consequences

1. Keep `rfc/evidence-move-selector.md` gated on a second preregistered population and multi-ply
   coherence; this screen satisfies only its first representation gate.
2. Retain complete legal-set identity, exact source/projection ids, fitted-parameter provenance,
   and the independent engine guard in any later implementation.
3. Preserve the shared feature plane: this result is evidence for reuse across bots and learner
   modules, not permission to create a bot-only classifier fork.
4. Do not derive a player style, learner grade, recommendation or explanation from a fitted weight.
   A weight changes selection mass; it is not chess truth or causal evidence.

No `DESIGN-GAP:` is opened. The result advances the already ruled D1271 lane while leaving H5/C5
and the product-language boundary unchanged.
