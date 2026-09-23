# D3262 — semantic consequence-search calibration preregistration

**Frozen 2026-09-23, before D3262 provider capture.** This is a disposable research experiment,
not production search authorization. Run `make semantic-search-manifest` to check its input and
manifest hashes; `make semantic-search-manifest ROWS=1` prints every root.

## Population

The predecessor input is D1023's `provider-sample.json`, SHA-256
`6cdddbffd72d8af93504f808bf012d5ea68b5f9103277bb493e2d1c92984748b`.
The Carlsbad draft control is byte-frozen at SHA-256
`b23c29b5d9136ba36f9f15cde34be831b7c13d990e5f3e51a0a84a25a86b7d52`.
Take all **62 distinct parent FENs** from D1023's 96 paired rows. Retain every row's provenance and
candidate move, but count a FEN once as a root. Add exactly four controls:

- `quiet-plan:carlsbad-nf8`: authored `nf8-regroup`, including its author-named route but no
  autonomous plan claim from knight distance alone;
- `pressure:bg4-h3-bh5`: `1. d4 d5 2. Nf3 Nf6 3. e3 Bg4 4. h3 Bh5`, rooted before `h3`;
- `tactical:fork-survives` and `tactical:fork-parried`: D794's paired all-reply fork fixtures.

The **66-root manifest digest** is
`sha256:244c750c432e0a73f37b32fcbfcc8158a6b511d980fcf9b0267d95f8506dff86`:
16 opening, 17 middlegame, 13 endgame, 18 source-`unclear`, and 2 unclassified tactical controls.
Phase and tactical/quiet focus are separate axes. A D1023 `material` tag is not automatically a
tactical label; `destination` is not automatically a quiet plan. Do not relabel `unclear` after
seeing outcomes. A provider-off root stays in the denominator and is not replaced.

## Common root frame and five arms

Compile every legal root move once. The shared selected candidate set is the union of
source-recorded candidates, Stockfish's root best at each declared budget, and the 1400-band
Maia highest-mass candidate, deduplicated by UCI. A missing provider candidate remains missing.
All arms receive the same root/candidate frame. The complete legal set remains the denominator
even when search expands only selected candidates.

| Arm | Fixed traversal | Maximum licensed reading |
|---|---|---|
| Provider line | Retained Stockfish PV, at most four legal plies | Occurred on this one line |
| Exact reply | Every legal opponent reply after the candidate; one additional learner ply only when the reply checks, captures, or attacks the registered target | Existential witness or all-reply result within that exact bound |
| Engine beam | Score order; widths 2, 4, 8 × horizons 2, 4 plies | Witness in a partial engine frontier |
| Maia mass | 1400-band probabilities; smallest prefix reaching returned mass 0.80 or 0.90, cap 8 moves per node | Named-band covered/residual policy-mass interval |
| Semantic target | Widths 2, 4, 8 × horizons 2, 4; preserve a legal branch changing/restoring the named relation, then fill by engine order | Witness or partial-frontier abstention |

Capture must retain per-node Maia `{moveUci, mass}` and missing mass, and Stockfish ranked
`{moveUci, score, reachedDepth, PV}` at depth 8, depth 12 and 100 ms. Retain provider identity,
request timing and source failures. D1023's reduced summaries cannot be substituted. A root
without a registered semantic target receives `no_target` in the semantic arm, not a fabricated
target. The engine budgets remain separate authorities; report agreement, not a merged value.

## Measurements and falsifiers

For every arm and phase/focus stratum report roots offered/admitted/source-off; legal and visited
nodes; transposition reuse; terminations; proof/family mix; witnesses, first refutations and
abstentions; perspective/polarity violations; source-budget agreement; covered/residual Maia mass;
and proved relation differences against a natural alternative. Report cold/warm/provider-off
p50/p95 latency, retained bytes and peak memory with machine, Node, model/engine and input digests.
Source-off and budget-exhausted cases stay in the denominator.

Any opponent event labelled a root benefit, sign reversal, provider-line occurrence called
causal, or partial frontier called all-defences fails the arm. The parried fork must not survive
all replies. The bishop line must retain exact slider/screen/target identity through `...Bh5`
without claiming the retreat was forced. The knight fixture must not infer a plan from distance
alone. These are zero-tolerance semantic failures, not rank penalties.

The interactive comparison uses the accepted hint envelope: p95 ≤ 1,500 ms to honest
pending/available and p95 ≤ 150 ms from resolved dependencies to a rendered item
(`rfc/hint-distance.md` §10). A local traversal time alone cannot pass that end-to-end gate. If
no profile meets it, live hints use direct/cached evidence with honest empty and deeper search
remains background Review/authoring. Publish the reach/cost/abstention Pareto table before fixing
numerical production budgets; do not weaken proof vocabulary to improve apparent latency.

**Status 2026-09-23:** manifest frozen; complete-root Stockfish and Maia source captures
landed and independently checked (`d3262-stockfish-capture.md`, `d3262-maia-capture.md`).
The shared root/candidate frame is frozen from those source receipts as
`d3262-root-frame.md` / `d3262-root-frame.json`: 196 selected candidates across 66 roots.
Exact opponent replies are enumerated at `d3262-exact-replies.md` /
`d3262-exact-replies.json`: 6,310 edges, independently replayed with python-chess. This is an
edge population, not the arm's semantic verdict or forcing extension.
The Maia source exposes raw model rather than configured sampling mass, which the arm must
keep distinct; this observation does not amend the frozen population or rescue a missing arm.
No five-arm traversal result exists. [[D3262]] remains open, and
semantic-consequence-search criterion 23/Discharge D1 remains unmet.
