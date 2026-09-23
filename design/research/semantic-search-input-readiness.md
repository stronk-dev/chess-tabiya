# D3262 semantic-search calibration — predecessor input readiness

**2026-09-23 · `[V]` repository measurement · calibration remains open.** Run
`make semantic-search-input-readiness` from the repository root to rederive
the counts and SHA-256 identities below. This disposable instrument reads four existing
recordings; it neither calls a provider nor chooses a production search budget.

## Result

The current recordings cannot support the RFC's five-arm *same-root* comparison. D1061 has 64
unique positions (24 opening, 16 middlegame, 24 cross-phase), two fixed-depth/100-ms engine
probes and their PVs, but no endgame stratum or Maia move distribution. D1023 has 96 paired rows
over only 62 unique roots (24 opening, 25 middlegame, 22 endgame, 25 unclear); its 64 material and
32 destination rows include four Maia bands and two Stockfish depths. Only five FENs overlap
D1061. `[V]`

D1023's published Maia artifact retains candidate count, top-eight *aggregate* mass and target
mass, but not the ranked `{moveUci, mass}` distribution at each expanded node. Its Stockfish
artifact retains chosen/best moves, typed scores and depth bounds, but not a PV. Both raw forms
existed transiently in `maia-probe.mts`/`stockfish-probe.mts` and were deliberately reduced when
written. The two datasets therefore cannot be joined into provider-line, exact-reply, engine
beam, Maia-mass and semantic-preserving frontiers on a common population. Treating D1023's 96
paired rows as 96 independent roots would also inflate the denominator by 34. `[V]`

Input byte digests:

| recording | SHA-256 |
|---|---|
| `planning/evidence-foundation-ux/d1061-bestline-distance-results.json` | `53051e9671e801ecb71c209a052b54da53d97873b07d0c85298b8d70043d4162` |
| `tools/d1023-bounded-policy-harness/provider-sample.json` | `6cdddbffd72d8af93504f808bf012d5ea68b5f9103277bb493e2d1c92984748b` |
| `tools/d1023-bounded-policy-harness/maia-output.json` | `5b369e5a535df2787762dbc60ca3d0db926c58aee4107d235717fb8b0fd531c3` |
| `tools/d1023-bounded-policy-harness/stockfish-output.json` | `141ded80f157b512abd714d3100320ab0afab5c729eafe9f883832a8fc7aa38b` |

## Consequence for the experiment

The fixed root manifest is now frozen in
`planning/semantic-consequence-search/d3262-preregistration.md` (66 roots; checked by
`make semantic-search-manifest`). Each root needs phase and tactical/quiet-plan provenance,
source identity, legal root candidates, and explicit hard-negative identities. Keep the D1061
and D1023 recordings as predecessor controls, not as interchangeable arms. The new capture must
retain per-node Maia move identities/masses and missing mass, plus
Stockfish ranked moves/scores/PVs at both declared budgets. Exact legal-reply and semantic-target
arms then traverse those same roots. The knight-route false positive and the
`...Bg4, h3, ...Bh5` retained-pressure line require their own frozen fixtures, not an inference
from the material/destination tags. `[M]` contract consequence of the observed missing fields.

No numerical horizon, pruning budget, interactive default or causal-language permission is
earned by this preflight. [[D3262]] remains open; RFC criterion 23 and Discharge D1 still require
the full five-arm result. The immediate implementation task is source-preserving capture over the
frozen manifest, followed by the five-arm run. `[M]`
