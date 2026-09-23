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
The paired fork hard control now has a scoped declared-identity result in
`d3262-fork-control-identity.md`: `...Bxc7` is an exact refutation in the parried fixture,
while the surviving fixture retains its geometric rook target through all five replies. This
does not generalize to the other roots or grade the tactic.
The `h3` / `...Bh5` line now has a scoped relation receipt in
`d3262-bishop-pressure-control.md`: the harassed bishop retreats while retaining the f3 knight
screen and a latent d1 queen exposure. It does not say the retreat is forced or recommended.
The D1023 predecessor rows retain exact target identities in their sealed source, but the frozen
manifest intentionally projected them away. `d3262-target-register.md` restores the source join
as a separate checked receipt: 96 rows, 94 distinct source root-candidates. The two fork and
bishop controls have declared relations; Carlsbad has an authored route but no autonomous semantic
target and must remain `no_target` for that arm. This is target availability, not traversal.
`d3262-target-comparison-frame.md` now applies the 64 distinct named root targets to the common
selected frame: 185 target/candidate pairs, 96 source-observed pair identities and 89 natural
alternatives. Source outcomes never transfer to those alternatives; no pair has a search verdict.
`d3262-material-immediate.md` now measures one outcome family on 98 of those questions: exact
positive legal material-capture availability immediately after each move. All 64 source material
rows agree with independent replay; the other 34 receive new results. This is not the bounded
reply or five-arm result, and no selected move is graded.
`d3262-destination-immediate.md` measures the other 87 target/candidate questions: 32/32 sealed
source destination denials and named positive pawn captures replay, while 54/55 natural
alternatives leave the destination locally safe and one captures the minor. A missing minor is
not a pawn-prevention claim. Both immediate families are now measured; bounded continuations
and the five-arm profile are still open.
`d3262-destination-reply-witness.md` joins the exact minor-arrival reply and, for the 32 source
controls, the *declared* pawn's positive capture one learner ply later. It is an off-profile
diagnostic: the frozen exact-arm extension triggers list check, capture and attack, not destination
occupancy. This result must not be counted as the preregistered arm without a new declaration
([[D3279]]). One source control also proves why generic first-positive-capture identity cannot
stand in for the declared pawn ([[D3278]]).
`d3262-provider-line-arm.md` now measures the first preregistered arm on all 185 named
target/candidate comparisons at each of the three separate Stockfish budgets. A positive
registered material capture appears on 29/53, 26/53 and 28/53 PVs respectively; no PV shows
the declared pawn capture in the 32 source pawn-denial controls. This is occurrence on one
line, not evidence that the unshown alternatives fail. The four special controls and all
196 selected candidates are now represented, including no-target abstentions. The parried
fork's refutation appears on depth-12 and 100 ms PVs, but not on depth 8; none of the three
bishop-pressure PVs shows the declared `...Bh5` retreat. The remaining four arms have no
completed profile result.
`d3262-exact-arm-forcing.md` now measures the exact arm's reply and one-ply-extension cost,
without assigning a proof verdict. The frozen phrase “attacks the registered target” admits
two readings for future-square targets ([[D3280]]): 1,226 versus 680 extended named-comparison
replies and 36,779 versus 18,831 learner edges. Only 3–4 of the 32 source pawn-denial arrivals
would receive the declared extra learner ply without a separately preregistered occupancy
trigger ([[D3279]]). This sensitivity does not choose a profile or complete arm 2.
The Maia source exposes raw model rather than configured sampling mass, which the arm must
keep distinct; this observation does not amend the frozen population or rescue a missing arm.
No five-arm traversal result exists. [[D3262]] remains open, and
semantic-consequence-search criterion 23/Discharge D1 remains unmet.

The first child-node Maia source receipt and raw-model prefix projection are now checked at
`d3262-maia-child-capture.md` and `d3262-maia-child-prefix.md`. All 196 selected child positions
were captured; the returned provider window contains 3,749 of 6,310 legal replies. The
preregistered cap-eight prefix reaches raw-model mass 0.80 at 191/196 positions and 0.90 at
168/196. This is not the configured temperature/top-p sampling distribution ([[D3276]]), and
26/32 named source pawn-denial replies are unreturned with unknown individual mass. The
horizon-four/multi-node Maia traversal and its semantic proof and cost readings remain open.

The matching Stockfish child source and horizon-two rank projection are checked at
`d3262-stockfish-child-capture.md` and `d3262-stockfish-child-beam.md`. Complete MultiPV
retains all 6,310 legal replies per budget. The width-8 frontiers contain 58, 60 and 64 of
185 named comparison replies at depth 8, depth 12 and 100 ms; 46 comparisons have no named
positive reply. All 32 source pawn-denial minor arrivals are outside width eight at every
budget. This supports a comparison of first-child pruning, not a depth-four beam, proof-class
verdict, end-to-end hint-latency result or production profile. [[D3262]] remains open.

`d3262-maia-configured-window.md` now makes [[D3276]] measurable at the first child layer.
The pinned sampler's temperature/top-p transform and the unreturned-move tail yield a stable
support under an explicit ±0.000001 raw-mass perturbation at 194/196 positions; two abstain.
That bounded artifact alone was not direct full-logit validation, other bands, or later
traversal nodes, so it did not choose the five-arm profile.

`d3262-maia-direct-logits.md` and `d3262-maia-direct-mass-frontier.md` now replace the
first-child numerical assumption with direct pinned-model inference: all 6,310 legal raw
probabilities, 637 configured-support entries, 3,749/3,749 captured raw-window matches,
194/194 bounded support matches, and both prior cutoff abstentions resolved. The true
configured policy places positive mass on 52/185 named comparison replies and zero after
top-p on 87; 46 have no named positive reply. This does not supply later-node Maia queries,
proof-class outcomes, other Elo bands or end-to-end cost. [[D3276]] is narrowed to those
remaining scopes; the five-arm [[D3262]] result is still open.

`d3262-semantic-touch-first-layer.md` now checks a source-blind first-child operand-touch
predicate across 6,020 legal comparison replies. It touches all 139 independently named
positive replies but also 1,265 edges overall. `d3262-semantic-reserve-first-layer.md`
then reserves one highest engine-ranked touch per comparison before reading named outcomes.
At width eight it raises named-reply reach from 58/60/64 to 64/66/70 across the three
Stockfish budgets, but reaches only one of the 32 source pawn-denial controls at depth eight
and none at depth twelve or 100 ms. The broad touch rule therefore fails as a sufficient
semantic-preservation selector ([[D3281]]). This is a first-layer diagnostic, not a
post-hoc rewrite of the preregistered five-arm semantic profile. [[D3262]] remains open.

`d3262-semantic-relation-event-first-layer.md` tests the narrower target-typed scheduling
predicate without held-out reply names: a named attacker captures its target, or a named
minor arrives on its destination. It finds 153 exact legal events and includes all 139
positive event replies, versus 1,265 broad touches. The one-slot event reserve schedules
all 32 pawn-denial arrivals at every first-child width/budget, but also schedules 14
material captures that fail positive exchange. This is an event-availability ceiling
conditioned on a preregistered target, **not** the semantic arm's proof, family mix,
depth-four reach, contrast or cost. `d3262-semantic-relation-event-reserve.md` retains
the complete first-layer comparison. [[D3281]] and [[D3262]] remain open.

`d3262-local-relation-contrast.md` now joins exact local material and destination
readings across 123 predecessor-observed-candidate/newly-selected-alternative pairs.
The relation differs in 35 material pairs (23 one way, 12 the other) and in 54 destination
pairs; 33 material pairs retain the same boolean relation and one destination alternative
has no named minor, so it is not classified as safe. The 123 pairs span only 47 of 64
registered targets; 17 have no newly selected alternative ([[D3282]]). These are local
comparison operands, not causal explanations or a completed semantic search arm.

`d3262-local-rank-concordance.md` checks those directional local operands against the
complete root Stockfish MultiPV order without normalizing raw cp/mate values. At depth
twelve, only 25/89 point the same way under the one-relation polarity hypothesis; the
destination family is 3/54. Nine 100-ms directional pairs contain bounded raw scores
and remain separately identified. This is evidence against treating a true local
classification as the engine's reason, not evidence that an engine rank itself explains
the move. [[D3283]] and the full counterfactual [[D3262]] remain open.

`d3262-event-policy-relevance.md` checks those exact first-reply events against the
pinned configured Maia3 sampler and complete Stockfish child ranks. The semantic
selector schedules all 32 registered pawn-denial minor arrivals, but only one has
positive configured Maia mass and none is child depth-12 top eight. That is an
event-reach versus *these frontiers* mismatch, not a human-reply frequency. It does
not alter the preregistered five arms, use the held-out reply to select branches, or
license proactive hints from a conditional event. [[D3284]] remains open.

`d3262-horizon4-frontier.md` seals the checked union of the three partial
first-reply frontiers as 2,186 paths over 2,185 exact reply positions, ready for
deeper provider capture. Its first two Stockfish positions were captured and
checked, not extrapolated into a complete arm. That smoke exposed [[D3285]]:
old 100-ms MultiPV captures mixed adjacent search depths. The new bounded
capture selects one complete rank-depth table; prior timed-rank findings are
provisional until re-capture. The five-arm proof, Maia at deeper nodes and
end-to-end latency remain unmeasured.
