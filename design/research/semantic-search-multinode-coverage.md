# Semantic-search multi-node coverage and path identity

2026-10-06 · D3262, D3476, D3477 · Why/Support, Review and bot foundation.

[V] The corrected experiment now replays each provider's second branch selection,
rather than substituting a common exact evaluator. The fixed 66-root/193-candidate
population and 1,966 selected first replies produce 17,507 three-ply paths. Engine
queries can share 16,813 exact-FEN jobs over 17,040 selected engine paths; 1,401 Maia
jobs remain bound to their ordered root-plus-three-ply histories. Source and query
identities, limitations, executable commands and independent legal replay are in
`planning/semantic-consequence-search/d3262-coherent-third-ply-frame.md` and
`tools/d3262-search-calibration/coherent-third-ply-frame.mjs`.

[V] Node-local policy thresholds do not preserve the same joint coverage threshold.
Configured 0.80 prefixes retain as little as 0.675384 joint mass after two branch
selections; 54/193 candidates fall below joint 0.80 despite no first-layer failures.
Configured 0.90 prefixes retain at least 0.805792, with 40/193 below joint 0.90 and
two first-layer cap-eight exceptions. These literal model-source diagnostics are
not human frequencies or independent-game statistics. The retained artifact and
its permanent 0.81 × 0.81 composition/omission control establish the arithmetic:
`planning/semantic-consequence-search/d3262-coherent-third-ply-frame.json`,
`tools/d3262-search-calibration/coherent-third-ply-frame.test.mjs`.

[M] Implication for the eventual compiler: any policy-coverage disclosure must
consume composed path mass and retain residuals; showing a per-node “80%” as if it
covered the complete search would overstate this measured model's explored scope.
This is a contract proposal grounded in the receipt, not a chosen production budget.
An unvisited branch still cannot license an exact negative, prevention, an all-defence
claim or an explanation of the root engine ranking. The standing preregistration
already requires that boundary: `rfc/semantic-consequence-search.md` §14.

[V] The normal source gates also exposed an accidental mutable input dependency:
the frozen Carlsbad fixture was loaded from a live pack after production migrations.
Its original bytes are now separately retained with the **unchanged** preregistered
digest, original provenance and 66-root manifest. This restores reproducibility,
not a new population: receipt §Verification and prerequisite repair above,
`tools/d3262-search-calibration/manifest.test.mjs`.

[P] Outstanding: the final-ply provider queries are declared, not captured. Semantic-
target-preserving deeper traversal, the five-arm proof/abstention and natural-
alternative comparisons, phase/focus stratification and end-to-end cost remain
open. No production search service, richer hint, pack proof or capability is claimed.
Source: `planning/semantic-consequence-search/d3262-coherent-third-ply-frame.md`
§Remaining work; draft RFC §14 and criterion 23.
