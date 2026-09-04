# Review evidence compiler — second author repair

`contract.test.mjs` is a disposable RFC buildability instrument for [[D2631]]–[[D2635]]. It
retains the original six author controls through the Make dependency, then exercises five new
able-to-fail arms: exact compiler ABI, mixed availability folding, sealed presentation ownership,
recorded-prefix subject binding and bounded retry exhaustion across branch LRU churn.

Run it through `make review-evidence-second-author-repair`.
