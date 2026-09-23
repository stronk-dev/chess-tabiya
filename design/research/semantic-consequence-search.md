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
The coherent engine/Maia first-reply union now selects 1,966 paths from
6,176 exact legal replies. A path/position join proves the deeper source gap:
250 Maia histories and 267 Stockfish FENs need fresh capture before the
corrected comparison can run. The target-preserving arm and five-arm outcome
remain unmeasured. [[D3289]] `[V]`
`planning/semantic-consequence-search/d3262-coherent-new-child-sources.md`,
`planning/semantic-consequence-search/d3262-coherent-first-reply-frontier.md`.

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
