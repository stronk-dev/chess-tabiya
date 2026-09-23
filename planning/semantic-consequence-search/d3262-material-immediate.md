# D3262 — exact immediate material-target outcome

**2026-09-23 · one measured relation family, not the five-arm result.** The fixed comparison
frame asks 98 material target/move questions on the frozen roots. A disposable independent
replay follows the declared attacker and victim through each legal candidate, including captures,
promotion and castling identity. It asks whether the same attacker can then make a **legal,
positive `legal-exchange@1` capture** of the same tracked victim. The result is joined to the
checked exact-reply graph's candidate FEN; a crossed FEN fails. `[V]`

`d3262-material-immediate.json` has digest
`sha256:e0fa66e8ad2431971fe8dfad5ed5c8efc54df1ed5a8bd2251c7d2802e4a7f861`.
All **64/64 sealed D1023 material source controls** match the independently recomputed immediate
status; **34 natural alternatives** now have measured immediate results. Across all 98 pairs:

| Result or exact removal cause | Pairs |
|---|---:|
| Positive capture preserved | 53 |
| Named attacker captured | 11 |
| Named victim moved | 15 |
| Capture became illegal | 5 |
| Legal capture became exchange-neutral | 14 |
| Identity lost unexpectedly | 0 |

The four phase labels with material targets contain 23 opening, 23 middlegame, 28 endgame and
24 source-`unclear` comparisons. These are deliberately selected questions, not a random game
sample. The 53/98 rate is **not** prevalence, lift, move quality, or a bot weighting. A geometric
line alone does not count as preserved when the legal exchange is neutralized. `[V]`

`make semantic-search-material-immediate` checks types, compiles the disposable evaluator,
replays all rows, asserts the 64 source controls, rejects false identities and crossed exact
candidate FENs, and checks the artifact's exact bytes. The result says nothing yet about
one-reply reintroduction, all-defences survival, engine agreement, human policy coverage,
contrastive explanatory value or live-hint latency. Those remain under [[D3262]].
