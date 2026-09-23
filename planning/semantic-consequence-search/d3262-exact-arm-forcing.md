# D3262 — exact-arm forcing-trigger sensitivity

**2026-09-23 · bounded traversal-cost evidence, not an exact-arm proof verdict.** The
byte-checked `d3262-exact-arm-forcing.json` is
`sha256:1013feb284578c9c7e02789f644741ffc44a955396a4a32fb591ab30601652e7`.
It joins the 185 named target/candidate comparisons to the 6,310 complete legal reply edges
for all 196 selected root moves. The named comparisons traverse 6,020 reply occurrences;
the graph retains all four special-control roots, but their own hypothesis outcomes are not
recomputed in this target-specific census. Each reply and FEN is replayed, and a candidate
reply is extended by one learner ply only for check, capture, or an attack on the registered
target. Destination occupancy itself is **not** a trigger. `[V]`

[[D3280]] prevents a false single number. For a *piece* target, an attack is newly added on
that enemy piece. For a *future destination square*, the frozen wording can mean either new
geometric control of the square or no piece-attack trigger until an enemy piece is there. The
experiment retains both readings without choosing one after seeing the costs:

| Trigger reading | Named comparison replies extended | Learner legal edges visited | Named material captures extended | Named minor arrivals extended | Source pawn-denial arrivals extended |
|---|---:|---:|---:|---:|---:|
| New square control | 1,226 | 36,779 | 53 / 53 | 8 / 86 | 4 / 32 |
| Enemy-piece attack | 680 | 18,831 | 53 / 53 | 6 / 86 | 3 / 32 |

The 546-reply / 17,948-learner-edge spread is a *definition* difference, not an optimization
result. Repeated eligible reply FENs can reuse a legal-list calculation: 1,207 unique extended
FENs under the square-control reading. That reuse does not merge path-sensitive proof state.
Zero of the measured eligible reply nodes is terminal, so no universal result passes vacuously.
`[V]`

The ordinary checks and captures account for only part of the destination family. Under the
enemy-piece reading, 80 of 86 named minor arrivals do not license the additional learner ply;
under square control, 78 do not. The prior diagnostic proves that all 32 source pawn-denial
arrivals have a legal declared-pawn punishment one ply later, but only 3–4 are reachable by
the **frozen** extension rule. The other 28–29 cannot be credited to arm 2 by silently adding
occupancy as a trigger. That is [[D3279]] measured rather than inferred. `[V]`

`make semantic-search-exact-arm-forcing` checks exact bytes, the complete selected-candidate
join, legal reply replay, and a negative fixture where a pre-existing attack must not become
a new forcing event. Deleted named replies, crossed FENs and false check flags fail. No chess
move is graded; this receipt measures branch cost and reachable named replies, not whether a
root move has a good reason. The attack-trigger choice, control hypotheses, end-to-end latency
and the other search arms remain open under [[D3262]].
