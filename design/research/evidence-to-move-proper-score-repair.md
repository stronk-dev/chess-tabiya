# Evidence-to-move proper-score repair — signal retained, standalone base refused

**Question:** D1297. Can the registered evidence plane be turned into a calibrated conditional
choice distribution after replacing D1162's non-proper arithmetic-mean objective?

**Feeds:** `rfc/evidence-move-selector.md`, F8, H5/C5, and the shared evidence plane used by bots,
guidance, Review and drills.

**Method:** bounded development on already-seen data. The preregistered plan is
`planning/platform-alignment/bot-policy/d1297-proper-score-repair-plan.md`; the disposable
instrument and complete machine-readable result are under `tools/d1297-proper-score-harness/` and
`planning/platform-alignment/bot-policy/d1297-proper-score-results.{json,md}`. Unless marked
otherwise, every numerical statement below is a direct reading of those artifacts and is `[V]`.

## 1. Verdict

**The proper conditional-choice repair fixes the probability pathology, retains useful evidence
signal, and fails the predeclared standalone safety gate.** The combined arm improves cross entropy
over engine-only on validation (**2.453996 vs 2.488178**) and on the once-read confirmation fold
(**2.052202 vs 2.527598**). Its top-choice agreement and expected-loss shifts also clear their
declared budgets on both folds. `[V]`

The one failing clause is the severe tail. Combined mass above 250 cp is **3.9493% vs 1.9814%** on
validation, a **+1.968 percentage-point** increase, and **3.2577% vs 1.9198%** on confirmation, a
**+1.338-point** increase. Both exceed the independently fixed +1-point ceiling. The freeze verdict
is therefore **refuted**, no third population was opened, and this model is not a production
selector. `[V]`

This is not evidence that registered evidence is useless for move selection. Evidence-only beats
uniform cross entropy on both folds, and the combined arm beats engine-only on both. It is evidence
that an unguarded evidence-to-move base cannot meet the chosen severe-error budget in this bounded
model family. `[V]`

## 2. Population and fitting contract

The development population is the already-exposed D1162 independent screen: **515 decisions from
108 games and 17,359 complete legal candidates**, after the declared mixed mate/cp exclusion. Games
remain the split unit. Folds 0/1/2 train, fold 3 selects hyperparameters, and fold 4 is read once as
confirmation. No inference is claimed from these reused development data. `[V]`

The logarithmic score is strictly proper [P] ([Gneiting and Raftery,
2007](https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf)). The fitted form
is conditional logit over each complete legal choice set [P] ([McFadden's Nobel
lecture](https://www.nobelprize.org/uploads/2018/06/mcfadden-lecture.pdf)). Those sources justify
the scoring rule and finite-choice form, not the chess validity of the learned distribution.

The fixed grid compared raw and projection-balanced transforms at ridge penalties
`{0.01, 0.1, 1, 10, 100}`. Validation selected raw/0.01 for engine, raw/1 for evidence, and
projection-balanced/0.01 for combined. The projection-balanced selection supports D1299's concern
that recursive payload cardinality affects a generic selector, but it does not establish the
transform as a production contract. `[V]`

The compact cache contains **2,516 raw names, 6,499,814 non-zero values, and 17,359 candidate rows**
in **58,749,026 bytes**. Its SHA-256 is
`2b568785a0c9f3129fbe1bbd311adc87984733e2b52ee1a32696b09bda4302c1`, and it pins clean
representation commit `633f541e245edd1737ee9224c6ed90c26fa009a9`. `[V]`

## 3. Held-out development readings

| fold | arm | cross entropy | top choice | expected loss | >250-cp mass |
|---|---|---:|---:|---:|---:|
| validation | uniform | 3.461911 | tie, not interpreted | 253.6 cp | 38.16% |
| validation | engine | 2.488178 | 30.93% | 55.5 cp | 1.98% |
| validation | evidence | 2.716241 | 24.53% | 148.7 cp | 20.80% |
| validation | combined | **2.453996** | 30.67% | 61.9 cp | **3.95%** |
| confirmation | uniform | 3.432041 | tie, not interpreted | 266.6 cp | 41.94% |
| confirmation | engine | 2.527598 | 28.73% | 50.5 cp | 1.92% |
| confirmation | evidence | 2.152037 | 37.14% | 127.8 cp | 18.44% |
| confirmation | combined | **2.052202** | 37.54% | 53.1 cp | **3.26%** |

The D1162 arithmetic/geometric split is repaired. Combined cross entropy falls from the former
**6.451** to **2.454/2.052** on the two held-out folds. Its minimum probability on the realized
move is `0.000053` on validation and `0.001737` on confirmation; only one validation decision is
below `1e-4`, and none is below `1e-6`. The previous head's improved arithmetic mean had hidden a
geometric mean 33 times below engine-only; that shape is gone. `[V]`

## 4. Numerical audit

The analytic gradient passes a centered finite-difference fixture, the synthetic two-choice case
decreases its objective and learns the declared direction, and both instrument tests pass. `[V]`

The full-development engine refit converges in 8 iterations. Evidence and combined consume all 80
declared L-BFGS iterations and finish with gradient infinity norms **3.28e-4** and **4.229e-3**, above
the `1e-6` stopping target. This is not a post-result reason to change the verdict or widen the
optimizer: the plan declared *at most 80 iterations*, and these are the bounded fits the gate
judged. It does mean their coefficients are not promoted as numerically frozen models. `[V]`

## 5. Consequences

1. The standalone evidence-to-move base is refused for 1.0 under the declared family. Do not tune
   another threshold, hidden layer, interaction or feature-selection pass on these data.
2. The third untouched population remains untouched. It is not spent on a model that failed its
   development freeze.
3. The evidence plane remains a viable input to a separately declared composition with the
   already-measured `ErrorGuard`; that is a different product architecture, not a retroactive
   relaxation of this gate. It must measure how often the guard excludes the move a human actually
   played, not merely make severe mass zero by construction.
4. A production consumer needs an explicit registered feature projection/cardinality contract.
   Generic recursive flattening is not that contract.
5. No result here licenses `human-like`, Elo, personality, skill, causal explanation, or multi-ply
   coherence. H5/C5 remain unmet.

No `DESIGN-GAP:` is opened. The result returns the selector RFC for architectural amendment and
routes the guard-composed successor through a new preregistered development plan.
