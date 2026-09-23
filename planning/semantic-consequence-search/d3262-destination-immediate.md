# D3262 — exact immediate minor-destination availability

**2026-09-23 · the second measured target family, not a search verdict.** The frozen comparison
frame asks 87 named minor/destination questions. After each legal candidate, an independent
replay tracks the named bishop or knight, checks whether its named destination is empty and
legally reachable, then asks whether moving there is locally non-losing under the shared
`legal-exchange@1` convention. A captured minor, occupied square, illegal minor move, and legal
but losing arrival are distinct causes. Every candidate FEN must equal the checked exact-reply
graph's FEN. `[V]`

`d3262-destination-immediate.json` has digest
`sha256:1ed0dd829c45a2065ba1b4d73329a39c1d0360981e18ad34644478ee89b9fc1e`.
All **32/32 sealed source immediate outcomes** reproduce. Stronger than a matching label,
the same 32 controls verify that the source candidate moved the declared pawn to its declared
square and that this pawn has a **legal, positive capture** after the minor lands. The 55
natural alternatives were evaluated independently: `[V]`

| Immediate cause | Source pairs | Natural alternatives |
|---|---:|---:|
| Minor destination locally safe | 0 | 54 |
| Named pawn makes the minor arrival locally losing | 32 | 0 |
| Named minor captured | 0 | 1 |

The single captured-minor alternative is **not** classified as a pawn blocking its destination:
there is no minor left to occupy it. Nor does local safety say the move is strategically good,
that the minor would actually go there, or that this pawn move is best. The frame was selected
to include target-creating cases, so 32/32 is not population prevalence or causal lift. `[V]`

`make semantic-search-destination-immediate` checks types, bundles the disposable evaluator,
replays the 87 pairs, rejects false minor identity, crossed source-pawn identity and crossed
candidate FEN, and checks exact artifact bytes. Together with the material pass it covers all
185 named target/move questions at the **immediate** horizon. One-reply reintroduction,
all-defences survival, engine/Maia/semantic frontiers, contrastive reason quality and latency
remain open under [[D3262]].
