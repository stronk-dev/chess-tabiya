# D3262/D3276 — bounded reconstruction of Maia's configured sampler

**2026-09-23 · first child layer; a declared numerical sensitivity test, subsequently
cross-validated on the pinned model.** `d3262-maia-configured-window.json`, SHA-256
`6ea99adab69f85307a613a84f646341ae83d00e56868c6fa2de28c59ec56e4ac`,
reconstructs the pinned Maia3 sampling rule from the checked 196 child-position raw-softmax
windows. `make semantic-search-maia-configured-window` reruns the input joins and four tests,
including a Python/PyTorch vector from the pinned sidecar. The source file at
`/opt/maia3/maia3/uci.py` has SHA-256
`0f2905bb668f0cb8af6b175e698756d89472b200c36e3f3410ff98390e35474d` in the
`maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe` container. `[V]` The checked
artifact, `tools/d3262-search-calibration/maia-configured-window.mjs`, and pinned local source.

The pinned code samples from `softmax(logits / 0.8)`, sorts that distribution, keeps entries
whose cumulative mass is **at most** 0.92 (always keeping rank one), and renormalizes those
kept entries. Its emitted `policy` is instead `softmax(logits)` for at most 20 moves. For a raw
probability `p`, the temperature weight is therefore proportional to `p^(1/0.8)`; the omitted
tail cannot simply be ignored. `[V]` Pinned `uci.py:sample_from_logits` and `score_moves()`.

The instrument bounds each reported raw `p` by ±0.000001, and bounds the unreturned total from
that interval. Each unreturned move is no larger than the last returned raw rank; convexity of
`p^1.25` gives a lower transformed-tail weight when the residual is evenly spread and an upper
weight when it is packed at that per-move cap. A support is called *certified* **only relative to
that declared raw-mass perturbation bound** when the top-p cutoff and boundary order are stable
throughout the interval. It then gives each kept move a configured-mass interval; all other
legal replies have zero configured sampling mass under that bounded reconstruction. If cutoff
could move, it emits unknown rather than a complete vector. `[V]` The checked compiler and its
synthetic omitted-tail and authority tests.

| Child positions | Count |
|---|---:|
| cutoff/support stable under the declared bound | 194 / 196 |
| cutoff unresolved | 2 / 196 |
| source-off or missing raw masses | 0 / 196 |

Across 185 named comparisons, 50 named replies have positive reconstructed sampling mass, 87
are zero after a stable cutoff, two have unresolved cutoff, and 46 have no named positive
reply. In the 32 source pawn-denial controls, one named minor arrival has positive mass and 31
are zero after the stable cutoff. That is a property of this configured Maia sampler at these
positions, **not** a judgment that the minor arrival is a useful or useless defence, and not a
population-wide human frequency. `[V]` The checked artifact and
`d3262-destination-reply-witness.md`.

The ±0.000001 mass error remains a declared sensitivity assumption, not a formal numerical
bound on PyTorch inference. The later direct full-logit receipt in `d3262-maia-direct-logits.md`
validates all 194 stable supports and 619 mass intervals against the pinned model, and
resolves the other two cutoffs from actual logits. This instrument still does not measure
later traversal nodes, different Elo bands or policies, or the end-to-end hint/bot selection
path. [[D3276]] remains open beyond this exact profile; the five-arm [[D3262]] decision is
open. `[V]` Direct receipt and `d3262-preregistration.md`.
