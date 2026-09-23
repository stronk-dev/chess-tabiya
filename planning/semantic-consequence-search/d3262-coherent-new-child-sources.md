# D3262 corrected frame — three new child provider sources

**Captured 2026-09-23; source input, not a five-arm or chess-judgement result.**
The separately preregistered coherent-root frame adds three candidates. Its
checked exact graph names 17, 19 and 19 legal opponent replies for those
candidate children. `make semantic-search-stockfish-new-child-check` and
`make semantic-search-maia-new-child-check` bind each source to the corrected
graph SHA-256 `3fcd3ef596886aee1e1427bc2502aaeef1baa39827c2e8d35b398e1fb478bb68`
and refuse crossed roots, missing legal replies, illegal PVs, mixed Stockfish
rank depths, source drift, forged Maia mass and incorrect ordered history.

| Child path | Legal replies | Stockfish all-legal / top-eight | Maia configured support |
|---|---:|---|---:|
| `d1023:32dbd41ca364bdb7` → `f7f5` | 17 | captured at all three budgets | captured |
| `d1023:e539b1202c9dcb20` → `f2f3` | 19 | captured at all three budgets | captured |
| `d1023:ef628fec1346fe49` → `e1e2` | 19 | captured at all three budgets | captured |

Stockfish 19 is the same executable digest as the old/recaptured root and
child sources. The all-legal capture has 165 ranked entries across the three
budgets and SHA-256
`cabcc3f8934eb9498187781f2ff8341a2ced1f00045313572053c1c135e45896`.
The separate top-eight capture has 72 entries and SHA-256
`549b47aad5c25cdca48d3555f7a719b27be6fc4dda2c926963ed855d9408c59e`.
Both have 165 legal-move instances and three labelled trailing partial timed
iterations. The width-eight and all-legal sources are not interchangeable
([[D3288]]).

The pinned Maia3-5M local CPU run reproduced an existing root-plus-candidate
policy control before querying the new paths. It replayed each declared root
FEN plus candidate UCI; the pre-root history is unavailable and not imputed.
Its full-legal raw distributions cover 55 moves, with six total configured
top-p support entries across the three paths. SHA-256:
`630bc61693da881024991475b64701e822c8b99a6e76122267b8f34cf30c86bd`.
The container's python-chess legal replies equal the corrected graph, which
the read-only checker also reconstructs with chessops. These model weights
are **not** measured human move frequencies, and any unsupported move is
excluded by the pinned configured sampler rather than assumed impossible.

The 190 retained candidates may reuse prior sources only after exact
source/path checks. The corrected 193-candidate frame still needs a new
target-comparison frame, first-reply frontier and deeper path/position source
union before any five-arm semantic proof, abstention or end-to-end cost
verdict. No move is graded and no engine preference is explained by this
capture.
