# D3262 — exact legal opponent-reply population

**2026-09-23 · edge enumeration, not a completed semantic-search arm.**
`d3262-exact-replies.json`, SHA-256
`63d38517b2cf9be19137e1b57b846be10b017006e69d6633510b1c43b93bd316`, starts from the
frozen 66-root / 196-candidate frame. `make semantic-search-exact-replies` checks both provider
captures, the root frame, exact regeneration, and five hard fixtures including silent reply
deletion, crossed FEN, checkmate terminality, the paired fork roots and the `h3`/`...Bh5` reply.
The enumeration is source-only arithmetic; it assigns no tactic, strategic value or move grade.
`[V]` `tools/d3262-search-calibration/exact-reply-enumeration.mjs` and its test.

| Population | Count |
|---|---:|
| roots / selected candidates | 66 / 196 |
| exact legal opponent replies | 6,310 |
| candidates with zero replies | 0 |
| reply edges giving check | 118 |
| reply edges capturing | 346 |
| check-or-capture union | 428 |
| reply breadth per candidate | 1–63 |

The named fork controls separate before interpretation: `Nc7` has five replies in the surviving
fixture and 33 in the parried fixture; the latter includes the legal `...Bxc7` (`g3c7`) capture.
The bishop-pressure control retains `...Bh5` (`g4h5`) among 31 legal replies after `h3`. These
are enumerated possibilities, not proof that the fork succeeds or the bishop retreat is forced.
`[V]` the checked artifact and `tools/d794-bounded-reply-harness/bounded-reply.test.ts`.

An independent, non-production cross-check used `python-chess==1.999` in the pinned Maia
container. For every stored root candidate it replayed the candidate, compared the complete legal
reply set, replayed every reply and compared all 6,310 resulting FENs. It returned
`{'roots': 66, 'candidates': 196, 'replies': 6310}` with no mismatch. This is a second chess
implementation, not a second interpretation of the same stored list. `[V]` Local container
`chess-tabiya-maia-1`, 2026-09-23. The repository's normal verifier does not require Docker or
python-chess for this cross-check; its reproducible gate is the checked chessops enumeration.

The forcing extension's target-attacks, exact retained-identity survival, witnesses, first
refutations and abstentions are **not yet measured**. A zero-reply node must follow terminal
semantics rather than vacuously pass a universal claim. This artifact supplies the complete
one-reply graph for those calculations and for the other four arms' common denominator, but
does not select a search profile. [[D3262]] remains open.
