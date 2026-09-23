# D3262 — exact event versus configured reply frontiers

**2026-09-23 · diagnostic, not a human-move rate, move grade, or causal reason.** The
checked `d3262-event-policy-relevance.json` has SHA-256
`ba7dbb5bd4b349e6a20a13ab87d08b2492d32e8d7f2e3ad97f4ccf66d32d7c6e`.
`make semantic-search-event-policy-relevance` joins 185 source-blind, registered
first-reply questions to their exact material/destination reading, the pinned Maia3
5M band-1400 temperature/top-p **configured sampler** at the candidate child, and
Stockfish 19's complete child MultiPV ranks. The join retains 153 typed events and
32 typed no-event questions. Source, child and legal UCI identities are checked;
neither source is substituted for the other. `[V]` Frozen artifacts and
`tools/d3262-search-calibration/event-policy-relevance.test.mjs`.

| Exact local event reading | Events | Configured Maia support > 0 | Stockfish depth-12 top 8 | Both |
|---|---:|---:|---:|---:|
| Positive named capture | 53 | 36 | 40 | 31 |
| Capture neutralized by immediate exchange | 14 | 5 | 5 | 4 |
| Locally safe named minor arrival | 54 | 15 | 20 | 7 |
| Named pawn punishes minor arrival | 32 | 1 | 0 | 0 |

The semantic selector can schedule every one of the 32 pawn-denial arrival events,
but that exact reply has configured positive mass in only one child and is never in
the depth-12 top eight there. Thus **event reach is not policy-relevant reach** for
these pinned frontiers. The remaining 31 have zero mass *after this sampler's
certified top-p cutoff*; this is not a claim that a human would never choose them,
nor does Stockfish's child rank measure human likelihood. A 54-row safe-arrival
counterpart is also not a representative population. These rows were selected under
the frozen target frame and can share roots/targets. `[V]` The checked artifact,
`d3262-maia-direct-logits.md`, and `d3262-semantic-relation-event-reserve.md`.

For product use, do not proactively tell a learner that an opponent *will* try the
registered pawn-denial arrival just because the exact relation is detectable.
On-demand “what if the knight goes there?” exploration can still use the exact
witness, labelled as a conditional line; a default hint needs a measured relevant
continuation or must abstain. The full five-arm search profile, counterfactual
engine-preference explanation, other Maia bands/histories, and actual human reply
frequencies remain open under [[D3262]], [[D3283]] and [[D3284]].
