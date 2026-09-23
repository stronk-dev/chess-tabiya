# D3262 corrected held-out event reach — 2026-09-23

The one-slot relation-event reserve was sealed without consulting positive
target witnesses. This disposable join adds those witnesses **after**
selection. `make semantic-search-coherent-event-reach-check` reproduces its
3,276 rows (182 comparisons × three provider budgets × three candidate
widths × two event-source widths), input digests and negative controls. The
artifact SHA-256 is
`1cdca3d810778254146d97b71c8e8adfa1b0befeae5f8ef88dbb2c4f1253723a`.

Each 182-comparison slice has 84 positive *local* named witnesses: 52
profitable material captures and 32 named pawn-punishment arrivals. Another
68 exact relation events have **no** positive local witness: 55 minor
arrivals are locally safe, and 13 named material-capture events are not
positive by the checked exchange relation. The other 30 comparisons have
no legal event or an absent operand. These are specific bounded facts, not
move grades or full-line outcomes.

| Provider budget | Top-eight baseline reach at width 2 / 4 / 8 | Top-eight reserve reach | All-legal event-source reserve reach | Event without positive local witness, top-eight / all-legal |
|---|---:|---:|---:|---:|
| depth 8 | 32 / 35 / 39 | 39 | 84 | 23 / 68 |
| depth 12 | 27 / 33 / 43 | 43 | 84 | 23 / 68 |
| 100 ms | 31 / 36 / 41 | 41 | 84 | 23 / 68 |

The reserve never loses a baseline-reached positive local witness at widths
2, 4 or 8 in this fixed frame. Top-eight limits cap it at 39–43/84. The
separately labelled all-legal event source can schedule all 84, but also
schedules all 68 event-without-positive-witness controls. Therefore
**event reach is not discrimination or proof**. In particular, a selector
that showed every scheduled event as an explanatory hint would be wrong on
those 68 local controls. The source-observed pawn-denial cases and their
safe natural alternatives were designed around this relation; these rates
must not be generalized to ordinary games or treated as human frequency.

Next gates remain selected-reply continuation, first refutation versus
all-defence proof, typed abstention, cross-budget agreement and end-to-end
cold/warm/offline cost. The event selector itself receives no held-out
witness input, and the LLM receives no licensed causal claim from this
reach artifact.
