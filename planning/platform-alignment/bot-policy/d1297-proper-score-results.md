# D1297 proper-score selector development

Freeze verdict: **refuted**. This is seen-population development, not final clearance.

The proper model repairs D1297's probability-tail pathology, but the combined arm exceeds the
independently declared severe-loss budget on both held-out folds. No third population was opened.

## Validation

| arm | cross entropy | top choice | expected loss cp | >250 cp mass |
|---|---:|---:|---:|---:|
| uniform | 3.461911 | 0.0% | 253.6 | 38.2% |
| engine | 2.488178 | 30.9% | 55.5 | 2.0% |
| evidence | 2.716241 | 24.5% | 148.7 | 20.8% |
| combined | 2.453996 | 30.7% | 61.9 | 3.9% |

## Once-read confirmation

| arm | cross entropy | top choice | expected loss cp | >250 cp mass |
|---|---:|---:|---:|---:|
| uniform | 3.432041 | 0.0% | 266.6 | 41.9% |
| engine | 2.527598 | 28.7% | 50.5 | 1.9% |
| evidence | 2.152037 | 37.1% | 127.8 | 18.4% |
| combined | 2.052202 | 37.5% | 53.1 | 3.3% |

## Full-development optimizer audit

| arm | transform | lambda | iterations | final gradient infinity norm |
|---|---|---:|---:|---:|
| engine | raw | 0.01 | 8 | 0.000e+0 |
| evidence | raw | 1 | 80 | 3.280e-4 |
| combined | projection-balanced | 0.01 | 80 | 4.229e-3 |

The engine fit met the stopping target. Evidence and combined reached the declared 80-iteration
bound above the `1e-6` tolerance; because the freeze gate already failed, none is promoted as a
frozen production model.
