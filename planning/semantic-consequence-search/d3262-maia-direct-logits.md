# D3262/D3276 — direct Maia logits at every selected candidate child

**2026-09-23 · pinned-model source receipt, not a completed search arm.**
`d3262-maia-direct-logits.json`, SHA-256
`4513d01c0983797d27c6ab30e1ffa42c046e519957756bfe97a71673340df7ab`,
re-runs the pinned Maia3 5M checkpoint over the exact 196 selected child FENs with
`--use-uci-history`, empty move history, band 1400, temperature 0.8 and top-p 0.92. It stores
the raw softmax for **all 6,310 legal replies** and the actual post-temperature, post-top-p
normalized support: 637 move entries across those positions. Checkpoint SHA-256 is
`ba14208b2992d85502f5fb501934abf6aaaeb355e9f3fdf90e326911f562524f`; pinned
`uci.py` SHA-256 is `0f2905bb668f0cb8af6b175e698756d89472b200c36e3f3410ff98390e35474d`.
`[V]` The checked artifact and `tools/d3262-search-calibration/maia-logit-validation.py`.

`make semantic-search-maia-direct-check` is Docker-free: it joins the direct receipt to the
frozen legal graph and captured provider window, checks all 3,749 returned raw masses against
the full distribution, independently applies the pinned temperature/top-p rule to every legal
raw value, validates normalization, and repeats the 194 bounded support / 619 mass-interval
checks. It fails on a crossed digest, model, position, lost legal move or invented probability.
The live model comparison found a maximum reported-raw delta of
`4.986566715103891e-13`; 194 of 194 bounded supports and all 619 retained mass intervals
matched. The two previously unresolved cutoffs have directly measured support sizes six and
twelve, rather than being guessed from the top-20 window. `[V]` The checked artifact, local
model run and `tools/d3262-search-calibration/maia-direct-logits-check.test.mjs`.

The first direct comparison failed at a castling move because Maia's captured raw UCI form
(`e1h1`) and the legal king-destination form (`e1g1`) differ. The corrected validator joins
by the independently checked **legal identity** while preserving both raw source bytes and
the original provider probabilities. No model or position was changed to make the comparison
pass. `[V]` The initial failing run and corrected local rerun, 2026-09-23; validator source.

This proves the configured sampler's first-child distribution for this exact model, band,
history mode and position set. It does not establish a human population frequency, a useful
defence, a move grade, deeper traversal-node distributions or another bot profile. [[D3276]]
remains open at the production/profile level, and [[D3262]] remains open for the full five-arm
comparison. `[V]` `d3262-preregistration.md`.
