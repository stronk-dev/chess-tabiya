# D3295 — corrected exact-arm trigger outcome sensitivity

Measured 2026-09-23 on the separately frozen coherent-root D3262 frame.
`make semantic-search-coherent-exact-trigger-check` replays the 182 named
target/candidate cells against their complete 6,176-edge legal reply graph.
The artifact `d3262-coherent-exact-trigger-outcome.json` has SHA-256
`d037609aaa2d9550ef8ff73b515946be1cb4a58e076f66c6c70325ef84d9a31c`.
This is a forcing-extension sensitivity, not a completed five-arm or
engine-reason result.

The complete bounded target reading is independently checked against
`d3262-coherent-bounded-targets.json` for every cell. For the restricted
readings, **every** legal opponent reply stays in the first-layer denominator;
only replies that check, capture or newly attack the registered target get the
additional learner ply. D3280's two unresolved meanings of attack remain
separate: new control of the named future square, or new attack on a declared
enemy piece. The replay checks exact FEN, legal reply count, check and capture
flags. Negative fixtures delete a reply, cross a bounded result or forge a
check/capture flag; each fails before a reading is accepted.

| Reading | Triggered replies across 182 cells | Additional learner edges | Bounded target reintroductions retained | Surviving preparations retained |
|---|---:|---:|---:|---:|
| Complete exact continuation (comparison authority) | All legal replies | Not a forcing-extension budget | 58 | 8 |
| New named-square control | 1,216 | 36,446 | 51 | 8 |
| New enemy-piece attack | 664 | 18,369 | 51 | 8 |

Both trigger interpretations omit the same seven bounded reintroductions:
six material, one destination; five source-observed, two selected natural
alternatives. The first missed material source witness is `d2d6 a1a2 d6d2
f2d2` at root `d1023:4b8565c9a5372755`, where `a1a2` is outside both
declared trigger sets. No 25,000-node budget exhaustion occurs. The two
interpretations differ greatly in work while yielding the same selected
target booleans on this frame; that does not settle D3280's intended meaning
or generalize to another population.

`preparationSurvivesEveryDefence` means **there exists one searched opponent
preparation for which every immediate learner defence preserves the named
option**. Restricting the preparation set cannot turn this into a proof that
every opponent reply forces the target, nor can a selected natural alternative
be treated as the full legal root-move population. The seven misses are
false negatives for this bounded question, not seven established good moves
or reasons for Stockfish's rank. Provider-line, engine-beam, Maia-mass and
semantic-target arms still need a common proof/abstention/cost comparison,
and the live hint latency gate remains open.
