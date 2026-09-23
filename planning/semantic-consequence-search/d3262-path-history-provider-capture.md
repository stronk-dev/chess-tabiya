# D3262 / D3286 — checked path-history provider sources

**2026-09-23 · provider inputs complete for the corrected first-reply frame;
semantic proof and end-to-end cost remain open.** The correction profile was
frozen in `d3262-path-history-preregistration.md` before these captures. It
holds the 66 roots, 196 candidate moves, exact replies and non-Maia selectors
fixed; it does not retroactively alter the empty-history experiment. `[V]`
Preregistration and sealed frame artifacts.

The 19 FENs newly selected by root-replayed Maia are checked in
`d3262-stockfish-history-supplement.json`, SHA-256
`ec0a17f5fe38b59656c38c3b5a51cae3aa5be2b29b8ee8fc4019ce63e0067dc7`.
They carry 1,641 legal-move instances and 435 coherent top-eight ranked
entries across depth 8, depth 12 and 100 ms; 16 timed probes label an
unfinished deeper iteration. The same pinned Stockfish 19 executable,
one-thread/16-MB configuration and raw score convention as the old 2,185-FEN
source were required. `make semantic-search-stockfish-history-supplement-check`
joins the exact 19-job frame, full legal denominators, rank-depth tables, PV
replay and executable digest; its negative fixtures refuse a crossed frame,
missing move, mixed depth and foreign binary. The corrected frame's **2,188
distinct FENs now all have a checked Stockfish source**, but their search
outcomes have not been interpreted as reasons. `[V]` Capture, frame, checker
and tests.

`d3262-maia-horizon4-path-capture.json`, SHA-256
`860ac9eca2f9d514e76134e8cbbb80c4c86d77fea4bea72a8746f42d444c6c71`,
queries each of the **2,189 ordered root/candidate/reply paths** through the
pinned Maia3-5M model at band 1400, temperature 0.8 and top-p 0.92. It first
reproduces a checked root-plus-candidate control, then records each path's
full legal raw softmax and configured sampler support. The independent
`make semantic-search-maia-horizon4-path-check` validates every path identity,
source digest, full legal population, normalized masses and terminal state;
negative fixtures cross path, remove a move, corrupt mass and forge terminal.
All 2,189 paths were nonterminal, with 65,694 legal moves and 8,034 retained
configured-support entries. These are path-conditioned model outputs, **not**
human frequencies or good-defence grades. `[V]` Capture, checked path frame,
checker and tests.

One final FEN occurs under two different histories. The raw full-legal
distributions have total variation `0.020627817671083903`, yet their
configured top-p support sets are disjoint (total variation `1.0`): one
path retains only `c7d6`, the other only `d8d6`. That is a direct same-position
negative control against FEN-keyed Maia policy caching. It also exposes a
top-p selection discontinuity on this pinned source; its prevalence in live
play is not established by this selected research population ([[D3287]]). `[V]` Checked
same-FEN rows in the path capture and the validator's paired variation.

Still required for D3262 criterion 23: the separately preregistered five-arm
traversal with semantic hypotheses, contrastive witnesses/refutations and
typed abstentions; and cold/warm/offline end-to-end latency and memory. A source
capture or a high-recall branch is not an engine-reason explanation.

**Post-capture update, 2026-09-23:** The old root/child timed layer has since
been re-captured at coherent same-width and top-eight settings, checked in
`d3262-stockfish-coherent-recapture.md`. That discharges the *source-capture*
part of the preceding list, not the five-arm verdict. Three corrected timed
root bests fall outside the frozen candidate frame ([[D3289]]), so a full
corrected union-of-provider-bests comparison requires a new preregistered
candidate frame rather than relabelling the existing path-history profile.
