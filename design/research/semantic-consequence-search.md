# Semantic consequence search — from a strong move to a grounded reason

**Status:** architecture question answered `[V]`; production pruning calibration remains a named
pre-acceptance experiment rather than an inferred threshold.

**Question.** Can Tabiya explain why one candidate is preferable to another by extending its
collectors over bounded continuations, and what search/proof boundary keeps that explanation
truthful enough to share across Support, Review, bots and pack validation?

**Inputs.** Current runtime and RFC contracts plus the executable results in
`semantic-horizon-coverage.md`, `hint-selector-production-table.md`,
`bounded-reply-semantics.md`, `bounded-policy-targets.md`, and
`shared-candidate-evidence-packet.md`. This pass adds no competitor or chess-theory claim. Every
number below is `[V]` against those versioned repository artifacts; architectural synthesis is
`[M]`.

## Verdict

Build one **evidence-guided semantic consequence search** above the complete legal-candidate packet
and below every product policy. It is not a second evaluation engine. Stockfish, Syzygy and human
models remain authorities for score, exact outcome and human likelihood. The new search establishes
which registered semantic relation occurs, whether it is connected to the root move, which replies
refute it, and what strength of claim the traversed population permits. `[M]`

The value must separate five results that prose currently collapses:

1. a relation changed directly on the root edge;
2. an event merely occurred later on one supplied provider line;
3. at least one bounded continuation witnesses the proposed consequence;
4. the consequence survives every enumerated defence inside the declared horizon;
5. the consequence occurs under a declared human-policy population with measured covered and
   residual mass.

Only (1), (3), (4), or a separately proved alternative contrast may support causal language. An
event occurring later in a PV is not by itself the reason for the first move.

## What the existing evidence establishes

### A complete factual denominator is required

`design/research/shared-candidate-evidence-packet.md` measured that the current
`CandidateFeatureVector` accepts an arbitrary legal subset (the fixture accepts 2/20 initial legal
moves), strips six fields from sealed semantic values, and trusts caller-supplied numeric scores.
The researched replacement is a score-free packet containing every legal child and its original
sealed events/readings. `[V]`

That packet is the root and per-node factual substrate. Provider scores, PVs, Maia mass and Explorer
frequency join above it and never mutate it. The same packet can therefore serve a bot, a hint and
Review without allowing one consumer's policy to become another consumer's chess evidence. `[M]`

### A searched line has useful reach but does not establish causality

The D1066 semantic-horizon instrument found a stageable registered event inside four depth-12 PV
plies on 56/64 positions (87.5%) and on 46/64 positions (71.9%) under the 100 ms arm. The two arms
agreed on selected family in 37/44 jointly non-empty cases and on occurrence ply in 39/44. Cold
complete-alternative compilation cost p95 799 ms per searched edge; the warm second pass cost p95
66.5 ms. `[V]` (`semantic-horizon-coverage.md`)

The follow-up production-table experiment refuted the naive interpretation: 28/72 non-empty
selections described an opponent edge while the proposed hint still disclosed the learner's root
move. Root-side filtering reduced reach but still did not prove that the root move caused, enabled,
prevented or answered the later event. Depth-12 selector p95 was 1,595.9 ms before provider,
transport and rendering. `[V]` (`hint-selector-production-table.md`)

The lesson is structural: provider-line observation, perspective, polarity and causal relation must
be separate typed fields. A precedence table cannot manufacture the missing join. `[M]`

### Exact reply enumeration proves narrow claims cheaply

The bounded-reply instrument enumerated every legal opponent reply and evaluated roughly 40,000
candidate edges at about 0.26 ms (authored) and 0.39 ms (imported) per edge in the research harness.
It established exact reply breadth and retained refutations, while rejecting stronger everyday
language: only 0/10 authored and 2/29 imported played double attacks survived every reply. `[V]`
(`bounded-reply-semantics.md`)

The bounded-target experiment extends the same shape to three plies. Immediate target removal often
reappeared within the horizon (69/120 authored and 130/188 imported); only 2/120 and 0/188 survived
every defence. Stockfish policy and Maia policy arms required distinct source identities and could
not be merged into exact rules truth. `[V]` (`bounded-policy-targets.md`)

This validates exact AND/OR-style proof as a useful but selective authority. Empty results and
refutations are expected product outputs, not collector failures. `[M]`

### Reachability alone is not a plan detector

The campaign R2 experiment on a knight retreat that could arrive well two moves later achieved
perfect recall but 98.7% false positives and 0.0% precision under its sharpest filter. `[V]`
(`planning/campaign-research-queue.md` R2)

Future-piece reach must therefore be only a hypothesis source. A learner-facing route claim also
needs a named target, legal continuity, arrival safety, retained usefulness, opponent-response
coverage and an explicit `exists`/`policy_coverage`/`all_defences` strength. `[M]`

## Required architecture

### Hypothesis, traversal and proof are different authorities

A registered hypothesis names exact operands and a proposition that can fail. Examples include a
screen vacating a slider ray, access to a square being denied, a named material target being
removed and later reintroduced, a defender duty disappearing, or a break becoming legally
available. It never says the root move is good, best, intentional or pedagogically important.

Traversal then applies exact legal moves and runs registered collectors at each retained edge.
Provider evidence may order or bound a policy-labelled frontier. It may not turn a partial frontier
into an all-defences proof.

The proof result retains its witness or first refutation, every population authority used, visited
position count, horizon, termination reason and typed abstention. Rendering and module selection
consume the proof; they cannot recreate it from prose.

### Three honest traversal classes

| class | population | strongest licensed reading |
|---|---|---|
| `provider_line` | one immutable Stockfish/Maia/tablebase line | “occurs in this searched line” |
| `exact_bounded` | all legal children at every quantified node within the bound | existential witness or survives every defence |
| `policy_coverage` | an admitted policy distribution plus retained covered/residual mass | occurs under named covered human/engine policy mass |

An implementation may use provider scores, forcing-move order, transposition reuse and semantic
target changes to schedule work. Pruning changes the claim class unless the skipped branches are
proved irrelevant by an exact rule. `[M]`

### Contrast is a derived proof, not adjacent cards

The desired output compares the recommended move with one or more exact alternatives under a common
root and source frame. It may combine:

- engine/tablebase value difference;
- a proved semantic benefit or preserved option for the recommended move;
- a witnessed or policy-labelled refutation of a natural alternative;
- cited theory applicability;
- Maia/Explorer naturalness or difficulty.

These remain separately labelled sources. A structural event does not explain an evaluation merely
because the two are displayed together, and human frequency does not make a move objectively good.
`[M]`

## Scope of the RFC this opens

The architecture is sufficiently evidenced to draft `rfc/semantic-consequence-search.md`. The RFC
should own:

- registered hypothesis queries;
- legal graph traversal and transposition identity;
- provider-line, exact-bounded and policy-coverage proof classes;
- witnesses, refutations, residual mass, budgets and abstention;
- the contrastive move-reason evidence value;
- one production search operation consumed by hints, Review, bots and pack validation.

It should not absorb the candidate packet, collector registry/service, engine/provider execution,
hint disclosure grammar, Review selection, bot weighting, theory retrieval or learner-facing prose.
Those are existing sibling owners.

## Remaining pre-acceptance experiment

The frozen 66-root Stockfish and Maia **root-source** captures now exist, with independent
legal-move, identity, rank, mass and PV checks. Stockfish covers 2,013/2,013 legal root moves at
each of three budgets; Maia returns 1,277/2,013 under its maximum 20-line output, with 736
unreturned moves. Its reported `policy` is raw softmax over legal logits, while temperature and
top-p govern the sampled move separately; seven returned castles use king-to-rook notation.
The requested seed is explicitly reported unhonored. These are inputs, not a search-arm result,
and no search default has been selected. `[V]` Source receipts and checker outputs:
`planning/semantic-consequence-search/d3262-stockfish-capture.md`,
`planning/semantic-consequence-search/d3262-maia-capture.md`,
`tools/d3262-search-calibration/stockfish-capture-check.mjs`, and
`tools/d3262-search-calibration/maia-capture-check.mjs`; raw-mass semantics were read from the
pinned Maia3 `score_moves()` inside `chess-tabiya-maia:dev` at source commit
`1e13597c42d4858b7cfd7cfdae01e297263364b2`.
The deterministic common-root frame now selects 196 move identities across the 66 roots;
21 selected identities have no returned Maia mass and remain explicitly unknown.
`[V]` `planning/semantic-consequence-search/d3262-root-frame.md` and
`make semantic-search-root-frame`.
The exact one-reply graph now has 6,310 edges for the 196 selected candidates. All stored reply
sets and FENs were independently replayed with python-chess in the pinned Maia container; the
fork and bishop controls retain their differing legal reply populations. This is not yet an
all-reply motif result or a measured five-arm comparison. `[V]`
`planning/semantic-consequence-search/d3262-exact-replies.md`.
The paired fork hard control now produces a nonvacuous exact geometric-identity distinction:
the attacker/rook target persists through all five replies in one fixture, while `...Bxc7` is a
named refutation among 33 replies in the other. This is a scoped target-retention statement, not
a general winning-fork classifier. `[V]`
`planning/semantic-consequence-search/d3262-fork-control-identity.md`.
The bishop-pressure control now verifies the predeclared `h3` / `...Bh5` relation: the pawn
attacks the bishop on g4, the retreat is one of 31 legal replies, and the bishop on h5 retains
the f3 knight with a d1 queen behind it. Every one of the knight's six legal moves exposes a
geometric attack on the queen; python-chess independently reproduced that narrow result. No
engine preference or forced continuation follows from it. `[V]`
`planning/semantic-consequence-search/d3262-bishop-pressure-control.md`.
The sealed D1023 predecessor sample names exact material or destination target identities for
all 96 selected source rows, but the frozen 66-root manifest reduced them to a family label.
The separate join receipt now restores those identities without changing the preregistered
population: 96/96 source rows join, covering 94 distinct source root-candidates on 62 roots.
The bishop and two fork controls carry their own declared relation checks; the Carlsbad control
has an authored knight route, not an autonomous semantic target, so that search arm must report
`no_target` there. Target registration is not evidence that a frontier found or proved a reason.
`[V]` `planning/semantic-consequence-search/d3262-target-register.md` and
`make semantic-search-target-register`.
The resulting comparison population has 64 distinct root targets crossed only with selected
legal moves at the same root: 185 pairs, including 96 source-observed identities and 89 natural
alternatives. These are test questions, not 185 detected effects. No source outcome is copied
to another move. `[V]` `planning/semantic-consequence-search/d3262-target-comparison-frame.md`.
The first actual comparison result is now narrow but nonvacuous: 98 material target/candidate
pairs were replayed with exact piece identity and `legal-exchange@1`; 64/64 source-immediate
controls agree with the sealed D1023 reading, and 34 previously unlabelled natural alternatives
were evaluated. Fifty-three preserve the named positive capture and 45 remove it by a typed
cause; a merely geometric attack is insufficient. This is immediate availability only, not
all-defences survival, engine preference, or a reason to recommend a move. `[V]`
`planning/semantic-consequence-search/d3262-material-immediate.md`.
The other 87 comparisons now have an exact minor-destination availability reading. All 32
source controls reproduce a legal positive capture by the *named moved pawn* after the minor
arrives. Of 55 natural alternatives, 54 leave that destination locally non-losing and one
captures the minor; the latter is typed separately, not called pawn prevention. This is a
selected comparison frame, so the split does not estimate population-wide frequency or show
which move is best. `[V]` `planning/semantic-consequence-search/d3262-destination-immediate.md`.
An exact-reply diagnostic now retains one named minor-arrival reply and, where declared, one
additional legal positive pawn capture. It finds 32 declared-pawn punishment witnesses, 54
locally safe arrival witnesses and one named-minor-absent case. In one source control the generic
first positive capture is `a5b5`, but the declared moved pawn's capture is `a6b5`; the witness
retains both instead of laundering the former into the latter ([[D3278]]). This diagnostic is
**not** a five-arm exact-result: the frozen extension trigger set did not include destination
occupancy, so using these extra plies in that arm would be a post-outcome rule change
([[D3279]]). `[V]` `planning/semantic-consequence-search/d3262-destination-reply-witness.md`.
The first frozen search arm now has a named-target result rather than a proposed algorithm.
Across the 53 comparisons where a positive registered material capture exists, Stockfish's
single PV shows it 29, 26 and 28 times at depth 8, depth 12 and 100 ms; an unshown legal
alternative is **not** a refutation. None of the 32 declared pawn-control lines appears as
minor arrival followed by pawn capture in those PVs. This directly measures the limited reach
of provider-line explanation for these fixed targets. The same projection covers all 196
selected candidates across 66 roots: the parried-fork refutation appears in the depth-12 and
100 ms PVs but not depth 8; all three bishop-pressure PVs omit the declared retreat; Carlsbad
remains explicitly no-target rather than inferring a plan from knight movement. `[V]`
`planning/semantic-consequence-search/d3262-provider-line-arm.md`.
The exact-arm forcing census now makes a second limitation numerical. Under the frozen
check/capture/attack trigger words, only 3–4 of the 32 source pawn-denial arrivals receive
the extra learner ply that would show their declared pawn capture. The range is not random
error: “attack” may mean new control of a future square or a new attack on an enemy piece;
those readings expand 36,779 versus 18,831 learner edges on the named comparison frame
([[D3280]]). The earlier pawn-reply diagnostic remains valid but off-profile. No exact-arm
proof verdict or production budget follows from this census. `[V]`
`planning/semantic-consequence-search/d3262-exact-arm-forcing.md`.
The Maia first-child source gap is now measured rather than proxied by root values. All 196
selected candidate-child positions returned raw-model lists: 3,749 of 6,310 legal replies,
with 2,561 unreturned. At the preregistered eight-move cap, a raw-mass 0.80 prefix reaches
threshold at 191/196 positions and 0.90 at 168/196. In the 32 source pawn-denial controls,
the named minor-arrival reply is inside that prefix only once; 26 such replies lie outside
Maia's returned window and have **unknown individual mass**, not zero. This is one child layer
of the Maia arm, not configured temperature/top-p sampling, depth-four traversal or a proof
that a line is human-likely. `[V]` `planning/semantic-consequence-search/d3262-maia-child-capture.md`
and `planning/semantic-consequence-search/d3262-maia-child-prefix.md`.
The comparable Stockfish child source is now checked on the same 196 positions and 6,310 legal
replies at depth 8, depth 12 and 100 ms. At horizon two, its width-8 ranking contains the
named reply in 58, 60 and 64 of 185 named comparisons respectively; 46 comparisons have no
named positive reply. The declared minor-arrival reply in **all 32** source pawn-denial
controls is outside width eight at every budget. This is a measured first-layer reach limit,
not a claim that the arrival is a good defence or a complete beam failure. The separately
preregistered semantic-target-preserving arm remains necessary to test whether retaining a
named relation changes explanation coverage. `[V]`
`planning/semantic-consequence-search/d3262-stockfish-child-capture.md` and
`planning/semantic-consequence-search/d3262-stockfish-child-beam.md`.
The pinned Maia sampling code exposes a bounded way to distinguish its reported raw softmax
from the configured 0.8-temperature/0.92-top-p sampler. Under an explicitly declared
±0.000001 perturbation per reported raw mass and a capped omitted tail, the child-position
cutoff is stable at 194/196 positions; two abstain. Among 32 source pawn-denial controls, the
named minor arrival has positive reconstructed configured mass once and zero after the stable
cutoff 31 times. That sensitivity result was then checked against the pinned model on all
196 child FENs. All 3,749 reported raw-window entries matched the direct legal softmax
(maximum delta `4.99e-13`); all 194 stable supports and 619 mass intervals matched; the two
uncertain cutoffs resolved. The direct configured support has 637 entries across 6,310 legal
replies. Among 185 named comparisons, 52 have positive configured mass, 87 are excluded by
top-p, and 46 have no named positive reply. This proves source distribution for this exact
model/band/history/position frame, not other profiles or deeper search nodes. [[D3276]]
remains open beyond that scope. `[V]` `planning/semantic-consequence-search/d3262-maia-configured-window.md`,
`planning/semantic-consequence-search/d3262-maia-direct-logits.md`, and
`planning/semantic-consequence-search/d3262-maia-direct-mass-frontier.md`.

The **history frame** is a further limit, not just a later-node capture gap. The direct
196-child model receipt seeds each child from its FEN with empty `historyUci`; the pinned
Maia3 adapter, when configured with UCI history, instead tokenizes the start position and
each replayed move, and the live selector forwards `startFen + historyUci`. The existing
configured-support counts are therefore valid for that empty-history diagnostic, not yet
for the same child reached through its actual root/candidate path. The next-layer manifest
has 2,186 paths but 2,185 unique FENs: the latter is a sound Stockfish work-saving join,
not a Maia policy identity. The deeper Maia arm must retain the ordered path and mark
unavailable pre-root history explicitly. This is the structural finding [[D3286]], not
a license to infer full prior game history. `[V]` Pinned
`chess-tabiya-maia:dev` `maia3/uci.py` `_reset_history`, `cmd_position`, `score_moves`;
`apps/server/src/opponent-selector.ts` `positionCommand`; checked D3262 direct-logit
source and horizon-four manifest.

The paired model run now measures that difference. On the same 196 children, scoring
`root FEN + candidate UCI` changes raw mass on 195 positions, the capped 0.90
configured reply prefix on 100, and the raw top move on 32. Replacing only the
first-child Maia arm changes its 0.90 prefix from 510 to 518 paths: 66 enter and
58 leave. The frozen shared frame would change from 2,186 to 2,189 paths and
needed 19 Stockfish positions its complete old-frame capture never saw. The
previous 1/32 pawn-denial support count survives for the same `f3g5` reply,
but that narrow survival does not validate the rest of the old Maia frontier.
The two frames remain separate; a path-history profile was preregistered
before any supplemental/deeper capture, and neither policy output is a
human-frequency estimate or a why-card. `[V]`
`planning/semantic-consequence-search/d3262-maia-history-replay.md` and its
three checked artifacts.

The corrected provider sources are now complete for this frame: the 19 new
FENs have coherent Stockfish top-eight readings at all three budgets, and all
2,189 root/candidate/reply histories have direct full-legal Maia policy
(65,694 legal moves; 8,034 configured-support entries). The one shared FEN
has **two distinct policy outputs**: raw total variation 0.02063, while the
configured top-p support is one disjoint move per path (`c7d6` versus `d8d6`).
This is a measured path-identity falsifier and a possible bot-sampler rigidity
signal ([[D3287]]), not a general frequency or good-move judgement. The
five-arm semantic proof, abstention comparison and end-to-end cost remain
unmeasured; provider completeness is not search calibration. `[V]`
`planning/semantic-consequence-search/d3262-path-history-preregistration.md`
and `d3262-path-history-provider-capture.md`.

A source-blind operand-touch selector now scans the complete first-child reply graph. It
marks 1,265 of 6,020 comparison reply edges as touching a named piece, destination or
line, and all 139 independently named positive replies touch. However, a one-slot reserve
of the highest engine-ranked touch only raises named-reply reach from 58/60/64 to 64/66/70
at width eight across the three Stockfish budgets. It recovers the source pawn-denial
minor arrival in only one of 32 cases at depth eight, and none at depth twelve or 100 ms.
This distinguishes broad operand *contact* from a typed target-*relation change*: the
former is a high-recall scheduling cue but not the semantic preservation mechanism the
RFC needs ([[D3281]]). No proof-class result, depth-four traversal or production profile
is licensed by this first-layer experiment. `[V]`
`planning/semantic-consequence-search/d3262-semantic-touch-first-layer.md` and
`planning/semantic-consequence-search/d3262-semantic-reserve-first-layer.md`.

The first corrective selector now names an **exact target event** rather than any touched
operand: the registered attacker captures the registered target, or the registered minor
arrives on its declared square. It finds 153 legal events in 185 comparison questions and
reserves all 139 held-out positive event replies, including all 32 pawn-denial arrivals,
at every first-layer width and Stockfish budget. This is strong *scheduling* evidence but
not a 139/139 explanation result: the held-out labels are themselves capture/arrival
events, and 14 selected material captures fail the positive-exchange reading. Target
registration also precedes the test; it does not solve discovery of arbitrary plans.
The event-conditioned continuation and contrastive proof remain unmeasured ([[D3281]]).
`[V]` `planning/semantic-consequence-search/d3262-semantic-relation-event-first-layer.md`
and `planning/semantic-consequence-search/d3262-semantic-relation-event-reserve.md`.

An exact *local* contrast now joins each predecessor-observed candidate with a newly
selected alternative under the same registered target. Of 64 target groups, 47 have such
an alternative: 123 pairs compare. Material shows 23 source-only, 12 alternative-only
and 33 same positive-capture relations; destination shows 54 declared-pawn-punishment
versus locally safe arrival contrasts and one non-comparable alternative where the minor
is absent. Seventeen groups lack a newly selected alternative altogether ([[D3282]]).
This is the first typed operand for “why this move rather than that one,” but it does not
link the local difference to an engine preference, prove it survives replies, or choose
which side benefits. `[V]` `planning/semantic-consequence-search/d3262-local-relation-contrast.md`.

The first root-rank sanity check sharply limits attribution: among 89 directional local
contrasts, 25 match the depth-12 Stockfish MultiPV order under a single-relation polarity
hypothesis, while 64 run contrary; destination/pawn-denial contrasts match in only 3/54.
This reading uses rank order only, with no raw cp/mate arithmetic or claim that ranking
reveals cause. It shows why a true detected structural fact can be a bad “why the engine
likes this move” card. The fixed selected sample is not a population rate. A why-card
needs a continuation-backed counterfactual link or honest abstention ([[D3283]]). `[V]`
`planning/semantic-consequence-search/d3262-local-rank-concordance.md`.

A separate provider-frontier join distinguishes an exact branch's existence from its
relevance under a pinned policy. The source-blind selector reaches all 32 registered
pawn-denial minor arrivals, but only one receives positive mass after the configured
Maia3 band-1400 top-p cutoff and none is in Stockfish's depth-12 child top eight.
The other exact-event strata remain distinct: 53 positive named captures, 14
exchange-neutralized captures and 54 locally safe arrivals. This bounds proactive
reply-specific hints under those tested frontiers, not human likelihood or an
engine-preference explanation. The Maia frontier here uses empty child-FEN history;
root-path replay independently preserves the 1/32 count while changing many
other selected replies ([[D3286]]). Conditional on-demand
exploration can still use the exact witness; the five-arm profile must measure
continuation and relevance before making a default hint. [[D3284]] `[V]`
`planning/semantic-consequence-search/d3262-event-policy-relevance.md`.

The next-layer capture frame now unions the width-eight engine, configured-Maia
and semantic first-reply selections while retaining arm provenance: 2,186 paths
over 2,185 distinct exact positions. A checked two-position Stockfish smoke found
that the earlier latest-per-move parser can splice MultiPV ranks from different
depths. This affects 64/198 stored root probes and 188/588 stored child probes,
all at 100 ms; depth-eight and depth-twelve tables are coherent. The corrected
bounded capture now covers all 2,185 selected positions in 88 checked chunks,
with 196,782 legal-move instances and 51,741 coherent ranked entries across the
three budgets. It selects a complete single-depth table and records 1,825 unfinished
deeper timed iterations. Same-width coherent re-captures of all 66 roots and 196
children now pass source, legal-denominator and PV checks. At fixed depth, old and
new all-legal top-eight orders match exactly; at 100 ms the best changes on 18/66
roots and 63/196 children, including cases without old mixed depths. Old timed
conclusions cannot be promoted by simply replacing their labels ([[D3285]]).
The coherent top-eight source also differs from coherent all-legal at fixed depth
— 25/66 root and 80/196 child bests at depth eight ([[D3288]]). Most importantly,
three coherent timed root bests are outside the frozen candidate frame; that
frame remains a sensitivity population, not the complete corrected provider-best
union ([[D3289]]). None of these captures is a depth-four proof, five-arm result
or production hint-latency measure. `[V]`
`planning/semantic-consequence-search/d3262-horizon4-frontier.md`,
`planning/semantic-consequence-search/d3262-stockfish-coherent-recapture.md`.

A separately preregistered coherent-root population now applies the unchanged
source/control/Stockfish-best/Maia-best union rule to the checked coherent
all-legal root source: 193 candidates over the same 66 roots, adding three
and dropping six across seven roots. Its complete legal reply graph has 6,176
edges; 190 retained candidate graphs are identical to the old frame. This is
the first source-corrected candidate population, not a five-arm verdict; at
that population checkpoint its new child providers and downstream continuation
had not yet been captured.
[[D3289]] `[V]` `planning/semantic-consequence-search/d3262-coherent-candidate-preregistration.md`.

Those three child providers are now captured and checked at separate Stockfish
all-legal/top-eight widths and at path-keyed Maia3-5M root-plus-candidate
history. The 55 exact legal replies agree between the corrected chessops
graph and the Maia container's python-chess replay; the pinned Maia sampler
retains six configured support entries across those three paths. This is a
source join, not a human-frequency estimate or a semantic proof. The corrected
target frame now contains 182 comparison cells for 64 source-named targets:
96 source-observed and 86 natural alternatives. Its checker binds the target
register and corrected candidate-frame digests; it does not report outcomes.
The coherent engine/Maia first-reply union selects 1,966 paths from 6,176
exact legal replies. The 250 missing Maia histories and 267 Stockfish FENs
are now captured and independently validated. A digest-bound source union
joins all 1,966 selected paths to an exact path-keyed Maia record and a
position-keyed coherent Stockfish record, keeping their distinct reuse
rules. This closes the selected-provider source gap, **not** the semantic
target-preserving arm or the five-arm proof/abstention/cost verdict. [[D3289]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-new-child-sources.md`,
`planning/semantic-consequence-search/d3262-coherent-first-reply-frontier.md`.

The corrected source-blind relation-event selector finds 152 event-bearing
comparisons out of 182, but exact event occurrence is not profit or cause.
Its one-slot reserve measures a real provider-width sensitivity: in 264 of
546 budget/comparison rows, the declared event is outside coherent top-eight,
while the separate all-legal source can still schedule it. Neither width
has yet been joined to held-out target success, refutations or latency, so
these are branch-reach counts only. [[D3281]] [[D3289]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-semantic-reserve.md`.

The corrected exact local evaluator now joins all 182 target comparisons to
legal piece-identity replay and checks 96 source-observed cells against their
independent predecessor reading. Of 60 material source-versus-natural pairs,
18 preserve a positive named capture only on the source, 11 only on the
alternative, and 31 on both or neither. The 56 destination pairs largely
reproduce their authored pawn relation; that is a source control, not an
engine-reason discovery rate. Named arrival/pawn reply witnesses remain
bounded, not all-defence proofs. The semantic reserve still needs a separate
selected-reply outcome join. [[D3289]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-local-relation-contrast.md`.

The held-out join now separates event scheduling from positive local
witnesses on the corrected 182-comparison frame. Only 84 comparisons have
a positive named local witness. A coherent top-eight reserve reaches 39,
43 or 41 of them at depth 8, depth 12 or 100 ms respectively; the
all-legal event-source sensitivity reaches all 84 but also schedules 68
exact relation events with no positive local witness. Those 68 are not
detector errors—the event occurred—but they would be false *explanations*
if exposed as causal hints. The budget-specific counts refute a pooled
reach claim and leave target persistence, all-defence proof and product
cost open. [[D3281]] [[D3289]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-event-reach-evaluation.md`.

The corrected path-keyed Maia3 configured policy adds a distinct relevance
axis to that held-out join: only 38/84 positive local witnesses have
configured support, while 21/68 exact events without a positive local
witness also have support. The source pawn-denial control remains 1/32;
15/55 safe minor arrivals on natural alternatives also have support.
These are overlapping named comparison cells under one configured model,
not independent games, Lichess human frequencies or reasons for Stockfish's
root preference. [[D3284]] [[D3289]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-event-policy-relevance.md`.

The corrected exact-reply continuation narrows the pawn-denial wording further.
Across 32 source-observed moves and all 1,109 immediate legal replies, the named
pawn still attacks its declared destination after 1,070 replies; only 5 of the
32 moves retain that named control against *every* reply. All 32 direct named
minor arrivals admit a legal positive capture by the named pawn, but the
opponent is not obliged to arrive. The 56 selected alternatives have 55 direct
arrivals and zero named-pawn wins; that says nothing about other defenders.
This is a source-identity, one-reply result, not long-horizon prevention or an
engine reason. [[D3291]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-destination-reply-control.md`.

The corrected exact bounded target arm now evaluates all 182 named cells under
the literal `exists opponent preparation → forall immediate learner defences`
quantifier, with complete legal-reply set checks and no 25,000-node cap hit.
Among 64 source material cells, 36 retain their positive named capture
immediately, 17 regain one inside the bound and one has a preparation surviving
every immediate defence. Among 32 source minor-destination cells, none remains
locally non-losing immediately after the pawn push, 29 regain one inside the
bound and seven have a preparation surviving every defence. Natural alternatives
are measured separately (30 material, 56 destination); these are overlapping
selected comparisons, not a game population. Twelve bounded destination
readings differ from D1023 because its tracker retains a captured controller
identity through an object spread. All twelve changed lines have legal pawn
capture witnesses, including en passant; the 96 immediate source readings
still agree. This corrects a source-control instrument, not the five-arm
profile verdict or an engine-reason claim. [[D3292]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-bounded-targets.md`.

The same corrected profile now has a bounded same-target contrast over 116
selected source-versus-natural pairs, keeping 17 unpaired targets explicit.
Although 84 pairs differ in immediate opponent-option availability, only 13
differ in inclusive immediate-or-four-ply reach. A raw reintroduction boolean
is not comparable across the 84 mixed-immediate pairs: `false` can mean the
opponent option was already available and did not need reintroduction. Only
11 both-removed pairs admit that narrower comparison, and none has a
directional all-defence contrast. The 13 inclusive reach directions agree
with coherent all-legal Stockfish root ordering in 4, 7 and 6 cases at the
separate depth-8, depth-12 and 100-ms budgets. These overlapping pairs and
selected targets do not establish why the engine recommends a move; the
correct output for an incompatible or unproved contrast is abstention.
[[D3293]] `[V]` `planning/semantic-consequence-search/d3262-coherent-bounded-contrast.md`.

Restricting the corrected exact arm's extra learner ply to check, capture or
newly registered attack has a measurable omission. Across 182 named cells,
the complete bounded question has 58 reintroductions and eight existential
preparations surviving every immediate learner defence. The named-square
attack interpretation extends 1,216 opponent replies/36,446 learner edges;
the enemy-piece interpretation extends 664/18,369. Both retain 51 of 58
reintroductions and all eight surviving preparations, missing the same six
material and one destination witnesses. First-layer legal replies remain
complete, so this is a conditional extension false-negative count, not an
all-defence proof or an engine-causality result. [[D3295]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-exact-trigger-outcome.md`.

The predeclared all-legal semantic-event reserve has 152 distinct exact reply
paths, 68 outside the corrected engine/Maia-selected 1,966-path union. Existing
source captures covered 67 of those 68; the remaining `f7f5 c1f4` path now
has a checked Stockfish 19 position reading and an exact-history Maia3-5M
distribution. The sealed 152-binding join has zero missing providers and
negative fixtures for crossed FEN/history, missing source and erased legal
moves. Source availability does not prove a target consequence, explain an
engine choice or satisfy the five-arm cost/abstention gate. [[D3294]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-semantic-source-closure.md`.

The corrected first-reply outcome join now compares 29 engine, configured
Maia and one-slot semantic selected reply sets against one exact bounded
target question on all 182 named cells. Complete exact continuation has
58 bounded reintroduction witnesses and eight existential preparations
surviving every immediate learner defence. Depth-12 engine top eight and
Maia 0.80 each retain 51/58 and 7/8, but the missed seven-cell sets differ.
The all-legal semantic event reserve does not improve top-eight reach and
can lose witnesses at width two. This is selection sensitivity, not the
arms' distinct deeper traversal or proof/abstention/cost verdict; a miss
over unvisited legal replies remains unknown. [[D3297]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-frontier-target-outcome.md`.

The immediate consequence for contrastive coaching is adverse. Joining those
29 partial selections to the frozen 116 same-target source/alternative pairs
produces **zero certified directional contrasts**: a selected branch may
witness the named opponent option, but an unvisited reply cannot establish
its absence on the other candidate. Depth-12 engine top eight appears
directional on 25 pairs; 13 have equal complete bounded reach, so that
one-sided observation would give a false prevention story. Configured
Maia 0.80 appears directional on 17 pairs, six with equal exact reach.
This is not a population accuracy rate or an engine-cause verdict, but it
demonstrates the required abstention rule at the exact target boundary.
[[D3298]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-frontier-contrast.md`.

Architecture is not calibration. Before acceptance, one preregistered harness must compare at least:

1. provider-line-only;
2. exact one-reply plus forcing extension;
3. engine-ordered bounded beam;
4. Maia-mass bounded frontier;
5. a semantic-target-preserving frontier.

Use fixed opening, middlegame, endgame, tactical and quiet-plan populations. Report per arm:

- root positions, legal and visited nodes, transposition reuse and termination reasons;
- proof-class/family mix, witnesses, refutations and abstentions;
- perspective and polarity violations (required zero after admission);
- agreement across engine budgets;
- cold/warm/provider-off latency and memory;
- explanatory discrimination against natural alternatives;
- hard negatives in which an opponent event occurs later but is not caused by the root move;
- the knight-route false-positive case and the `...Bg4, h3, ...Bh5` retained-pressure case.

The experiment chooses budgets and default search profiles. It does not get to weaken the proof
vocabulary when a broad search is too expensive.

## Product consequences

One search/proof substrate can power:

- progressive hints without exposing moves at lower distances;
- post-commit and Review explanations that answer “why this rather than that?”;
- bot policy features and a truthful explanation of the bot's actual selection;
- player-history facts about opportunities seen, missed or prevented;
- pack-author counterexample search and authored-claim validation;
- campaign abilities that unlock a module rather than fabricate new chess truth.

The LLM remains downstream of the selected sealed proof and may only paraphrase its licensed claim.
When no proof clears, the product returns an honest engine preference with “no concise semantic
reason established,” never an invented story.

## 2026-10-07 — external native-source memory window, D3262

The original cost executor reports sampled parent-process RSS only; its metadata explicitly
does not claim engine/model peaks. A separate disposable observer now binds the still-running
`engine:depth12:top8` batch (start 11,580, limit 1,158) to its original metadata, exact command,
process birth/parent identities and one direct native Stockfish child. The executor and its
eighteen frozen instrument sources remain unchanged. Native Darwin `ps(1)` defines `rss` in
1,024-byte units. This is process-resident memory, not unique physical memory. `[V]` Original
metadata retained in planning/semantic-consequence-search/d3262-cost-live-engine-depth12-top8-memory-window-2026-10-07.jsonl;
tools/d3262-search-calibration/cost-process-memory.mjs; native Darwin ps(1), rss keyword.

The retained late-run window contains **120/120 successful probes**, zero unavailable probes,
from **03:45:50.409 to 03:49:53.661 UTC** (243,352.378 ms including native probe time).
Observed maxima are **242,224 KiB** for the Node executor and **153,024 KiB** for Stockfish;
the maximum sum in one probe is **395,056 KiB**. The sum is not the sum of separately timed
maxima, an atomic observation or a deduplicated physical-RAM peak. The append-only journal
retains original metadata/observer bytes, native rows, individual clocks, explicit scope and
a reconstructible digest chain. Its 331,657 bytes hash to
`sha256:1c3dc3c1ad4f5455d09067703ce1cd227710880fc9916f83b040230df407edff`.
`[V]` The retained journal; `make semantic-search-memory-check`.

Thirty-five disposable controls refuse PID reuse/reparenting, added descendants, wrong
batch/source configuration, unavailable-as-zero, changed/reordered/truncated journals,
resealed RSS mismatches and promotion to startup/whole-batch/per-case/physical/Maia peaks.
The reader reconstructs native rows rather than trusting summary labels. It is an integrity
and scope check, **not independent authentication or repetition of OS memory measurements**.
Normal Make targets provide observer, reader and controls; they are opt-in research and do
not add a mandatory CI/content gate. `[V]` tools/d3262-search-calibration/cost-process-memory.test.mjs;
Makefile semantic-search-memory-test/observe/check.

This window does not observe startup, the whole batch, per-case attribution, other settings,
Maia or container memory. Lightweight research/governance work shares the host; existing
latencies are not isolated by this observer. D3262 stays doing: **fourteen complete settings /
16,212 of 61,374 admitted cases**, with the top-eight capture still in flight at this checkpoint.
The remaining 39 settings, broader source/model memory, consumer/browser scope and production
profile remain open. No production search, grounding authority, capability, milestone or
1.0 completion follows from these memory readings. `[V]` planning/platform-alignment/execution-queue.md,
D3262; planning/roadmap-1.0.json, evidence-to-consumer-spine at checkpoint 9d3d4471.

## 2026-10-07 — complete depth-twelve live populations

The original top-eight capture and lossless packaging now terminate zero with all
1,158 cases / 386 triplets and eighteen unchanged source snapshots. Independent
Python-chess replay checks all 206,196 target observations, after thirty boundary
controls, and refuses six corruptions. All three depth12 widths therefore have
complete live populations; the total is **fifteen settings / 17,370 of 61,374
admitted cases**, with 38 settings remaining. Quantitative stratification now
passes eight controls and retains 44 separate strata; available four-ply warm
p95 is 2,594.765/2,970.750/2,740.704/1,944.992 ms for opening/unclear/middlegame/
endgame, respectively. Every phase exceeds the 1,500-ms server reference even
with cached receipts; this is not a browser/honest-pending gate reading or an
independently repeated benchmark. Full same-budget width synthesis now passes
forty-eight controls and retains 3,474 cases / 546 named target cells / 1,158
cold-warm pairs. The 541 comparable cells retain their exact frozen path,
coverage and outcome identities; five failed-source cells stay unpaired. Of
the cold-warm pairs, 1,153 preserve identical compiled evidence and five preserve
failed-cold/unavailable-warm partial evidence without fresh queries. This compares
each width with its own frozen arm, not the widths with each other or engine causes.
`[V]`
`planning/semantic-consequence-search/d3262-cost-live-engine-depth12-2026-10-07.md`
§2026-10-07 continuation; `d3262-cost-live-engine-depth12-top8-summary-2026-10-07.json`;
`d3262-cost-live-engine-depth12-width-sensitivity-2026-10-07.json.gz`;
original terminal packaging, quantitative/width readers and independent replay.

Both invalid cold-source cases and their unavailable warm partners keep 532/562
partial observations and all seven rejected literal PVs. A failed source is not
target absence or a negative comparison. A retained available warm case still
takes 4,795.143 ms with all 73 queries cached, mainly source parsing/admission;
this example is neither a phase quantile nor browser proof. None of these results
selects a production default, explains an engine's cause or licenses weaker proof
for faster hints. D3262 remains doing on the full profile/memory/consumer/browser
boundary. `[V]` Original complete capture; same continuation receipt;
`CostDependencies.query`; `rfc/semantic-consequence-search.md` §14 / criterion 23 / D1.

## 2026-10-07 — timed-source admission and production-cache boundary

[[D3508]] is a separate disposable audit, not a changed cost experiment. The
unchanged reader chooses its deepest complete rank table before refusing a
bound-bearing score. Four actual failed queries in original triplets 012741 and
012747 also contain earlier complete, unbound tables at depths 8/13/9/9 before
newer depths 9/14/10/10. In one example the earlier rank-one move disagrees with
the literal final `bestmove`; the other three agree. All raw lines, both original
compressed triplets, original metadata and auditor/reader bytes are retained in
the 818,353-byte literal-example artifact, SHA-256
`f4e48288c744594fd0e57274c99dc772a1433a54928a2bf45d922e13c8d638a8`.
These are four explicit failure examples, not a random sample or a measured
population frequency. “Exact/unbound” describes the UCI score flag, not the true
game value, an exhaustive consequence or engine causality. `[V]`
`planning/semantic-consequence-search/d3508-timed-table-literal-examples-2026-10-07.json`;
`tools/d3262-search-calibration/cost-timed-table-audit.mjs`.

Fourteen controls retain the current rejection, keep final selection separate
from earlier ranking, forbid fixed-depth downgrades, missing/duplicate/illegal
delimiters, incomplete/bound-only earlier tables and illegal trailing PVs. The
audit selects only an unchanged contiguous literal prefix, never independently
filtered ranks or invented scores/PVs. It returns an observation, not a source
receipt, recommendation, repaired result or production profile. The 18-source
live executor stays byte-identical. Eighteen additional retained-source/output
corruptions refuse changed plan/range, filtered/crossed cases and queries, missing
delimiters, changed sources/scores/depths, invented bestmove agreement and fabricated
recommendations/profile/population scope. The artifact stays byte-identical.
These are same-reader integrity controls, not an independent source oracle.
Complete population replay and any reviewed successor source contract remain
separate exits.
`[V]` ordinary `make semantic-search-timed-table-audit-check`; original reader and
captured-source digest comparison; [[D3508]] execution-queue entry.

The current cost instrument and the shipping cache have different warm boundaries.
`CostDependencies.query` reparses the complete literal receipt on a warm cache hit.
The production scheduler instead checks TTL/current Stockfish generation and
reuses the exact parsed payload and payload receipt; the delivery constructor
checks their module-private seals, exact payload identity and parser implementation
digest without running the parser again. Code inspection therefore does **not**
license translating the disposable 1.9–3.0-second warm p95 into a production cache
latency claim. It also proves no production speedup. D3262 still owes the actual
complete consumer/cache/source/request/browser integration before selecting the
default profile. `[V]` `cost-stockfish.mjs` `CostDependencies.query`;
`apps/server/src/provider-exchange.ts` `get` retained branch;
`apps/server/src/provider-operations.ts` `stockfishDescriptor.admitRetained`;
`packages/runtime/src/provider-exchange.ts` `makeProviderDelivery` and
`assertProviderParsedPayloadReceipt`.

### Primary-source author inputs: selection, rank frames and bounds

Checked 2026-10-07 for [[D3508]] and the existing [[D3373]] source-contract hold.
The April-2006 UCI standard separates a search-ending `bestmove` from `info`:
PV-related fields belong together; MultiPV identifies ranked variants; score
bounds remain lower/upper bounds. The protocol does not license assigning an
earlier frame's score to a different terminating move. `[V]`
[UCI standard copy, engine-to-GUI bestmove/info](https://backscattering.de/chess/uci/2006-04.txt),
linked by the [protocol publisher](https://www.shredderchess.com/chess-features/uci-universal-chess-interface.html).
The last sentence is the contract inference, not a quoted protocol requirement.

In the release-tagged Stockfish-19 source, `Worker::start_searching` emits the
terminating move from its final chosen root PV. `SearchManager::output_pv` can
emit a previous score/PV with the preceding depth for an unsearched root; other
entries can remain current-depth. It separately emits inexact score flags.
Aborted MultiPV loss handling can restore a prior score/PV or mark an entry
inexact. These are supported upstream states, not proof that any one branch
caused our four observed failures. The binary name/digest does not establish its
build's equality to this tagged source. `[V]`
[sf_19 search.cpp](https://raw.githubusercontent.com/official-stockfish/Stockfish/sf_19/src/search.cpp),
`Worker::start_searching`, `Worker::iterative_deepening`,
`SearchManager::output_pv`; `[P]` mapping to the captured binary is unverified.

Official Stockfish documentation includes a bounded final-score example before
`bestmove`, describes MultiPV as ranked lines, and recommends sending move
history for repetition handling. Its FAQ explicitly distinguishes search depth
from exhaustive ply coverage and engine output from application move labels.
No source here turns a selected engine move into an explanation of its cause.
`[V]` [UCI commands](https://official-stockfish.github.io/docs/stockfish-wiki/UCI-Protocol-and-Stockfish-Commands.html)
§position/§go/§MultiPV;
[FAQ](https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html)
§What is depth/§Move annotations.

Our two existing readers have different declared scopes, not interchangeable
contracts. The disposable table reader requires every requested rank at one
depth, rejects a bound-bearing selected table and refuses a fixed-depth
downgrade. The shipping durable reader already selects one completed unbound
rank-one iteration, while retaining the actual terminating move separately.
Its permanent positive explicitly retains score 32 from an e2e4 PV together
with terminating d2d4. That preserves bytes and selection, but is **not** a
witness that score 32 evaluates d2d4. `[V]` `cost-stockfish.mjs` `parseProbe`;
`stockfish-coherent-table.mjs` `selectCoherentTopEntries`;
`apps/server/src/evidence-queue.ts` `completedInfo`/`StockfishEvidenceExecutor.execute`;
`apps/server/src/evidence-queue.test.ts` test “preserves the terminating selection
rather than substituting the PV's first move”. D3374's implemented repair and
D3373's missing whole-source migration remain distinct.

Author repair inputs, **not accepted semantics** `[M]`: preserve the terminating
selection, completed rank frame, score/PV subject and literal task boundaries as
distinct identities. The successor must specify whether an earlier unbound
timed frame is admissible, how its age/depth and omitted newer information are
exposed, and what remains unavailable when only selection survives. A score
for the selected move needs its own same-subject witness; another search is a
new source/budget, not repaired evidence. Keep fixed-depth shortfalls, invalid
PVs, terminal history, mixed-depth ranks and bound-only estimates explicit.
Acceptance negatives must include the real earlier-rank/final-selection
disagreement, selected-only/score-only cases, crossed tasks/subjects, and a
consumer trying to substitute rank one or grade from an unrelated score.
Whole durable consumer adoption and registered source-version/resource claims
precede retiring the raw path. No new default, source receipt, provider schema,
production parser, grading rule or engine-causality claim is introduced here.

Consumer inspection narrows that migration obligation; a field-name match is not
proof of a misattributed grade. `reviewAnalysis` prefers its durable typed line,
then an attached bestline, then the literal terminating move from attached eval.
The explicit Inspector reveal renders engine attribution, bound and legal SAN,
not the accompanying centipawn/mate score. `engineWalk` legally plays the selected
move and issues a separate child-position query; the child's recorded score is
not borrowed from the parent's ranked PV. Neither inspected path establishes
the alleged selected-move/parent-score conflation. `[V]`
`packages/runtime/src/review-analysis.ts` `recordedLine`/`reviewAnalysis`;
`apps/server/src/sourcing/engine-walk.ts` `engineWalk`/`probe`.
These actual selection consumers still belong in D3373's migration inventory;
their inspected behavior is not whole-source adoption or an acceptance discharge.

## 2026-10-07 — complete timed-engine populations and fresh-source sensitivity

All three 100-ms engine widths now retain 3,474 cases / 1,158 original triplets
and eighteen unchanged instrument snapshots. Independent replay checks 182,240
target observations after thirty boundary controls and rejects six corruptions.
Lossless packaging, the eight-control quantitative reader and forty-eight-control
width synthesis terminate zero. Calibration is now **eighteen complete settings /
20,844 of 61,374 cases**, with 35 settings remaining; all nine engine budget/width
populations are complete. Seventeen recursive primary settings take priority,
while seventeen first-reply-reserve diagnostics and one complete-local diagnostic
remain in the frozen plan. `[V]`
`planning/semantic-consequence-search/d3262-cost-live-engine-widths-2026-10-07.md`
§2026-10-07 continuation; original immutable timed archive and both syntheses.

Fresh timed evidence is not uniformly interchangeable with its frozen arm.
Of 546 target cells, only 134 compare; 412 preserve invalid-source partial
evidence. Among comparable cells, 100 complete frontiers, 50 coverage readings
and eight outcomes change; the counts overlap. All 1,158 cold/warm pairs retain
exact evidence: 697 identical compiled pairs include 613 available and 84
no-target pairs; 461 failed-cold pairs retain unavailable warm partners without
fresh queries. Grouping original cold dependency failures shows 457 cases with
bound-score refusal and six with PV-beyond-terminal refusal, two overlapping.
The 1,456/25 respective rejected query executions are not distinct positions or
failed cases. Earlier-table admissibility remains unmeasured outside D3508's four
specific examples. `[V]` original archive cold dependency state/failure fields;
`d3262-cost-live-engine-movetime100-width-summary-2026-10-07.json`;
`d3262-cost-live-engine-movetime100-width-sensitivity-2026-10-07.json.gz`.

Successful top8 four-ply cells contain only 6/2/2 unclear/middlegame/endgame
candidates and no available opening case. Their warm p95 is
1,688.609/1,544.741/1,512.902 ms; it is conditioned on successful admission,
not a whole-population reliability statement. Wider cold latency, source refusal,
unknown focus, source-version attribution and browser/consumer qualification
stay explicit; no lower-cost default, repair to original source semantics or
engine explanation follows. D3262 and D3508 remain doing. `[V]` quantitative
summary and same continuation receipt; `rfc/semantic-consequence-search.md`
§14 / criterion 23 / D1.

## 2026-10-07 — recursive cost comparison reader, not a completed population

The disposable fresh/frozen reader now requires all six recursive settings at one
declared budget: widths two/four/eight crossed with top-eight/all-legal geometric
event sources. Every candidate, two/four-ply horizon and cold/warm/provider-offline
state remains in the denominator. A recursive frontier is indexed by root,
candidate, named target **and** setting; it cannot borrow the engine beam's
candidate-wide frontier or another target's reserve. `[V]`
`tools/d3262-search-calibration/cost-recursive-sensitivity.mjs`
`recursiveSettings`, `indexRecursiveContinuation`, `summarizeRecursiveSensitivity`.

Sixty-one permanent controls pass under normal
`make semantic-search-cost-recursive-sensitivity-test`. The checksum chain binds
the immutable corrected common comparison → recursive evaluation → actual
recursive fourth-ply continuation → frozen scheduling frame. All 182 × eighteen
target/setting joins (3,276) bind full ordered third/fourth path identities and
their projected preparations/counts. Target/setting crossings, missing/duplicate
cells/arms/nodes, crossed histories, unavailable sources, extending terminals and
foreign executed witnesses refuse. The earlier complete 1,158-case recursive
top-two archive supplies all 182 actual live target/frontier bindings, but is
correctly refused as an incomplete six-setting population. These are instrument
controls over existing evidence, not new searches or independently authored chess
truth. `[V]` terminal normal Make result;
`cost-recursive-sensitivity.test.mjs`; immutable earlier initial/population
archives `d3262-cost-live-recursive-top2-*-2026-10-06.json.gz`.

Equal-size changed histories cannot hide behind counts. Frontier identities,
executed witnesses, preparation/learner-defence omissions and grounded target
outcomes are reported separately. Selected fourth-ply histories are **not** complete
fourth-reply coverage. Failed/exhausted four-ply cells retain partial outcomes and
observation counts unpaired; two-ply cells remain inventory/cache checks, not
borrowed four-ply verdicts. All cold/warm pairs must preserve compiled evidence;
missing cold receipts cannot start fresh queries labelled warm. No version cause,
engine reason, useful hint or production-cache latency follows from this reader.
`[V]` implementation, changed-history/witness/omission controls and exact-cache
controls; frozen preregistration.

The original next five depth-eight recursive populations are still capturing in
`.cache/d3262-cost-live/recursive-depth8-remaining-2026-10-07`, starting at cost-plan
offset 40,530 and requesting 5,790 cases. The already complete depth8/top2/top8
setting is excluded from that batch, not repeated. Completion, lossless packaging,
independent replay, quantitative stratification and full six-setting fresh/frozen
synthesis remain required before changing the eighteen-setting/20,844-case
headline. The capture host is shared with instrument authoring and normal
verification, not an isolated benchmark appliance. None of the eighteen captured
executor source files, original clocks or source refusals is changed by this
reader. D3262 remains doing; draft RFC criterion 23 / D1, consumer/browser/source
memory and production-profile admission remain open. `[V]` original command,
cost-plan range and native capture metadata; Make targets and research worktree.

## 2026-10-07 — complete configured-model fresh/frozen sensitivity

Both already captured Maia prefixes now have a complete descriptive comparison,
without new inference or reusing a duration as a new measurement. The reader
requires all 2,316 candidate/setting/horizon/regime cases and checks all 772
cold/warm pairs. The immutable six-source chain binds the exact candidate-wide
model history, not a target-specific semantic reserve or a FEN-only policy cache.
Sixty-seven controls and normal immutable freeze/read-only reconstruction pass.
`[V]` `tools/d3262-search-calibration/cost-model-sensitivity.mjs`, its tests,
`planning/semantic-consequence-search/d3262-cost-live-maia-2026-10-07.md`
§continuation and immutable `d3262-cost-live-maia-sensitivity-2026-10-07.json.gz`.

All 364 named target/prefix cells preserve full selected paths, executed witnesses,
omissions and outcomes. All 358 target-bearing candidate/prefix policies preserve
their literal conditional/product weights and joint-rule status; 28 no-target
entries retain policy-not-requested, not zero mass. Aggregate layer values differ
on 40/179 prefix-0.80 and 72/179 prefix-0.90 policies, by at most
3.3306690738754696e-16 / 4.440892098500626e-16 respectively. Literal differences
remain visible without normalization, a changed verdict or invented source cause.
The comparison is against each prefix's own frozen arm, not cross-prefix equality.
All 772 cache pairs preserve compiled evidence while 3,568 explicit executed→cached
node-custody transitions are checked separately. Fresh queries/nodes, changed
evidence and extended terminal policies refuse. `[V]` synthesis groups/policies/cells,
literal-value audit, warm-provenance and terminal-absorption controls.

This is a stable provider-policy/target-outcome checkpoint, not all search families
calibrated, a reinterpretation of the prior weighted semantic projection, human
frequency, usefulness, production cache latency or an explanation of an engine's
choice. The eighteen-setting headline and original recursive run remain unchanged.
Remaining full populations, consumer/browser/source/memory qualification and
reviewed profile admission keep D3262 doing. Routine metadata/hash upkeep is
automatic, with no owner question. `[V]` reader scope, frozen plan and current
roadmap; synthesis does not promote the draft search RFC or a product capability.

## 2026-10-07 — complete recursive depth-eight live comparison

The original five missing depth-eight recursive populations terminate zero without
restart: 5,790 cases / 1,930 cold-warm-offline triplets, all 193 candidates and both
horizons. All eighteen executor source digests remain unchanged. Independent Python
replay verifies 479,960 target observations and rejects ten corruptions after thirty
boundary controls. Shared-host measurement is not isolated/machine-repeat or browser
proof; original clocks and failed-source semantics remain literal. `[V]`
`planning/semantic-consequence-search/d3262-cost-live-recursive-depth8-2026-10-07.md`
§capture boundary and independent replay; original metadata/triplets.

All six recursive settings at this budget now compare against their own frozen
arms: 6,948 cases / 1,092 target cells / 2,316 cold-warm pairs. Sixty-one controls
bind all 3,276 frozen target/setting joins and the previous 182 live bindings.
Zero target cells change their complete frontier, coverage, executed witnesses or
outcome; every cold-warm pair preserves compiled evidence without fresh queries.
This does not say different settings have equal frontiers. Fourteen no-target
candidates per setting remain separately not-requested, not target absence or
zero coverage. `[V]` complete immutable sensitivity artifact, cells/groups and
`cost-recursive-sensitivity.mjs` controls; receipt §complete depth-eight comparison.

Eight quantitative controls and the five-setting report retain all 5,790 rows in
210 strata: 3,580 available, 1,790 intentional provider-offline and 420 no-target.
Available four-ply phase denominators are 46 opening / 53 unclear / 41 middlegame /
39 endgame per setting. New top2/all-legal cold p95 stays below 1,500 ms, while the
wider cold settings exceed it in every phase; some wide warm cells also exceed it.
The receipt includes all five settings/four phases and literal artifact digests.
Neither offline-control fraction nor success-conditional timing is natural source
reliability. Prototype raw-receipt reparse is not shipping sealed-cache or browser/
paint latency, so this is not a production profile choice. `[V]` immutable quantitative
report, receipt timing table, preregistered boundary and earlier shipping cache audit.

[[D3509]] closes the observed oversized-archive transport defect without recapture
or filtering. The 151,609,742-byte original exceeds GitHub's individual-file limit;
four at-most-40-MiB members and a digest-checked manifest reconstruct the exact
original compressed bytes in Node and independent Python. Twenty-five Node controls,
four independent Python methods with 23 negative variants, the actual oversized
shared-writer audit and the full package generator's automatic branch pass. Legacy
PV/engine/model/refused-input controls still pass. Capture digests identify original
reconstructed bytes, with physical manifest digests separate. This is byte custody,
not another chess/timing oracle, product storage architecture or repository-size
solution. `[V]` `cost-archive-parts.mjs`, `cost-archive-parts-check.py`, tests, actual
full-generator terminal and receipt §independent replay and immutable storage;
https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github.

Complete coverage advances to 23 settings / 26,634 of 61,374 cases. Thirty settings
remain: twelve recursive primary, seventeen first-reply-reserve diagnostics and one
complete-local diagnostic. The original next six depth-twelve settings are live,
not counted delivered and never restarted on observation timeout. Routine hashes,
state and receipt upkeep is automatic. D3262 stays doing and the search RFC draft:
full weighted semantic/cost qualification, actual consumer/cache/browser joins,
source/model memory and reviewed profile admission remain open; D3508/D3373 source
holds are not repaired by a successful recursive arm. No capability/milestone,
official-content or full-1.0 completion follows. `[V]` frozen cost plan, current
original command/metadata, prior source receipts and canonical roadmap.

## 2026-10-07 — complete configured-model weighted-target qualification

The preregistered weighted join retains all 2,316 original configured-Maia cases /
193 candidates / 364 named target-prefix cells / 28 no-target policy entries,
both horizons and cold/warm/offline. The preceding complete policy comparison
must still admit every case and all 772 cache pairs. The earlier target observer
and fresh `d3262-target-opportunity@2` stay separately named; no capture, provider
literal, refusal, clock or input digest changes. `[V]`
`planning/semantic-consequence-search/d3262-cost-live-maia-weighted-targets-2026-10-07.md`
§Population and custody and the preregistration cited there.

Opportunity counts each three-ply predecessor once; execution counts only its
selected fourth-ply leaves that execute the same named action. Reintroduction
requires immediate removal. All masks and canonical weighted sums match each
own prefix's frozen reference, not each other. Per-prefix phase denominators
remain 49 opening / 53 unclear / 41 middlegame / 39 endgame, all focus null.
Prefix 0.80 has opportunity/execution on 80/33 cells, prefix 0.90 on 88/46;
reintroduced opportunity/execution counts are 16/6 and 19/8 respectively.
These are comparison-cell counts, not human frequencies or all-defence proof.
`[V]` receipt §What was qualified and immutable complete weighted artifact.

Three cells retain original aggregate-order differences beside canonical sums;
maximum literal opportunity mass `1.0000000447034836` remains unnormalized within
the inherited source float32 tolerance. Forty-six Node controls and nine
independent Python methods pass; actual independent replay rejects fifteen output
and seven original-source corruptions. The first verifier's compensated Python
sum was corrected to the declared ordered binary64 addition, with a permanent
control; source/result bytes and tolerance were not changed. Independent arithmetic
and custody are not another chess, model or timing oracle. `[V]` receipt §Independent
falsification, primary/independent readers and terminal normal Make checks.

This closes the bounded weighted-target qualification on the frozen frame and
two prefixes, not production weighting, usefulness, engine-causal explanation or
a new setting. D3262 retains 23 complete settings / 26,634 cases; the original
six-setting depth-twelve capture remains live without restart. Full remaining
cost populations, consumer/cache/browser joins, broader source/model memory and
reviewed profile keep the RFC draft. Current full-software timeout D3510 remains
explicit; a passing focused 115-test Theory gate does not establish its cause.
No milestone/capability/content or full-1.0 promotion follows. `[V]` weighted receipt
§Remaining boundary, current ledger/roadmap and software terminal.

## 2026-10-07 source-lifecycle qualification

The original six-setting depth-twelve capture has now terminated with 6,948 rows /
2,316 triplets; the whole cost plan remains incomplete. Complete ordered audit
locates one fatal engine deadline and 699 inherited dependency failures across
697 cold rows. The adapter retains its fatal error and refuses subsequent commands
before a new UCI write; those rows are not independently attempted timeout trials.
Three real-subprocess controls distinguish terminal adapter failure from a
nonfatal invalid-PV refusal. `[V]`
`planning/semantic-consequence-search/d3262-source-lifecycle-2026-10-07.md`
§Concrete failure boundary and §Permanent source-boundary controls, original
metadata/triplets/source image and normal Make terminal.

The first four settings retain 357/357/356/356 available cold rows, each with 28
no-target rows and its invalid-source remainder. The two wide settings retain
19/0 available cold rows and 339/358 budget-exhausted labels, each with 28
no-target rows. Original long elapsed readings are retained, not interpreted as
engine CPU time or a diagnosed scheduling delay. No original source, failure,
clock or partial result is replaced. `[V]` receipt complete cold-row table and
named original fatal triplet; original executor digest join.

Lossless packaging and independent replay of 85,088 observations pass, with thirty
boundary controls and ten corruption refusals. This checks the retained partial
evidence, not fresh attempts after the fatal failure. Wide-arm cost qualification
needs preregistered separately identified successor evidence, not a silently
repeated or overwritten failed capture. D3512/D3262 remain doing, the delivered
headline stays 23 settings / 26,634 cases and the search RFC remains draft.
This is a bounded instrument/source-lifecycle finding, not an engine cause,
production recovery/default, useful explanation or milestone/capability/content
completion. `[V]` receipt §Admission and next work and current ledger/roadmap.
