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
