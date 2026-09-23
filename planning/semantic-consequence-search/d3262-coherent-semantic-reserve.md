# D3262 corrected source-blind relation-event reserve

**Measured 2026-09-23; branch scheduling, not tactical success or an engine
explanation.** The separately declared 193-candidate frame yields 182
target/candidate comparisons. Recomputed from named operands and exact legal
replies alone, 152 have one typed relation event, 18 have no legal event, and
12 have an operand absent after the candidate move. The checked census
SHA-256 is
`9eb2373aac741209897fcda9447cf39902b75bb9a561df65343fcb2762973087`.
No held-out named positive, engine evaluation or target outcome enters this
event calculation.

The one-slot reserve holds the engine baseline to the coherent **top-eight**
MultiPV table at each budget and widths 2, 4 and 8. It then chooses the
highest-ranked exact event from either that top-eight table or a separately
labelled coherent **all-legal** table, replacing at most the baseline's
last slot. The two event-source widths are separate sensitivity arms; this
does not pretend a truncated all-legal query is equivalent to top-eight
MultiPV ([[D3288]]). Its checked artifact SHA-256 is
`d28be6c198a9c617b21479b5f7a3a80f78065539d2de3052f67fb432e7232540`.

Across three budgets (546 rows at each candidate width), a top-eight-only
event source leaves 264 event-bearing rows outside its source window. Its
one-slot reserve adds a reply outside the width-2 baseline in 79 rows and
outside width 4 in 53; it adds none outside width 8 by construction. The
all-legal event source can see those 264 outside-top-eight events; it adds
one outside the width-2/4/8 baselines in 343/317/264 rows respectively.
These are *selected-reply reach* counts, not held-out target hits or proof
rates. The exact-event selector can schedule an exchange-neutralized
capture, as the frozen negative control already showed ([[D3281]]).

`make semantic-search-coherent-relation-event-check` and
`make semantic-search-coherent-semantic-reserve-check` bind the candidate,
graph and engine-source digests; negative fixtures refuse a missing
comparison, crossed declared actor, illegal event or wrong MultiPV width.
The next join must measure held-out named hits, false event attribution,
first refutations, abstention and cost against the other four arms. No
production search profile or learner-facing reason is selected here.
