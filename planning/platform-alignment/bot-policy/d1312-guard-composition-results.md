# D1312 declared error-guard composition

Development verdict: **refuted**. This does not read the reserved third population.

| fold | observed moves admitted | guarded engine CE | guarded combined CE | engine mass removed | combined mass removed | gate |
|---|---:|---:|---:|---:|---:|---|
| validation | 113/117 (96.6%) | 2.293956 | 2.312672 | 0.0198 | 0.0395 | fail |
| confirmation | 101/108 (93.5%) | 2.249685 | 1.862308 | 0.0192 | 0.0326 | fail |

## Rating-band survival

| fold | rating band | admitted | rate |
|---|---|---:|---:|
| validation | 1000-1399 | 45/47 | 95.7% |
| validation | 1400-1799 | 32/32 | 100.0% |
| validation | 1800-2199 | 36/38 | 94.7% |
| confirmation | 1000-1399 | 14/17 | 82.4% |
| confirmation | 1400-1799 | 38/40 | 95.0% |
| confirmation | 1800-2199 | 49/51 | 96.1% |

## Failed clauses

- validation: conditionalCrossEntropy
- confirmation: ratingBandFloor

Cross entropy is conditional on the observed move surviving the declared 250-cp mask. Excluded
human moves are explicit refusals, not epsilon-smoothed predictions. Because different able-to-fail
clauses fail on the two folds, this exact composition is returned rather than retuned. D1320
requires an owner/RFC disposition before the standing non-Maia-base goal can leave the 1.0 roster.
