# RFC: Bot route source — the proposing layer, the one bot mechanism that passed its gates

- **Status:** draft — 2026-08-23
- **Author:** claude (drafted from `design/research/generated-bot-route-source.md` and its two refuted predecessors)
- **Design refs:** `design/00-thesis.md` (the product premise names the opponent: *"a human-like opponent while truly applying an opening/middlegame/endgame"* — **"truly applying an opening" is the clause this RFC serves, and no shipped or drafted mechanism serves it**); `design/03-product-breadth.md` §Just Play (*"choose a side/position/opponent"*). The bot lane has no design-tier section; its intent authority is the owner ideation [[D810]]–[[D812]] and the **O8 ruling**, quoted in `bot-policy.md` §0. A `design/` bot section remains owner work under law 5 and is not written here.
- **Exploration gate:** [[D1084]] ✅ — the D1078→D1080→D1084 experiment sequence ran under `rfc/0000-rfc-process.md` §Exploration gate as disposable research on D1080's measured exit. **The third arm passed all eight preregistered gates** (`planning/platform-alignment/bot-policy/d1084-generated-route-plan.md`, `gates.pass: true`). [[D1330]] ranked the resulting dossier **live debt rank 3**: *"an experiment that passed all eight of its gates and appears in no RFC."* That absence is what this RFC closes.
- **Depends on:** accepted `rfc/bot-policy.md` (the seven-layer grammar and its compiler — this RFC adds an eighth layer kind and amends §2.3, §3 and §9.5). `rfc/bot-roster.md` (draft) registers profile instances and is amended in one row, §1.4. `rfc/evidence-move-selector.md` (draft) is **complementary, not overlapping** — the subsumption analysis is §2, and this RFC does **not** depend on it.
- **Parent / amends:** amends `rfc/bot-policy.md` §2.3 (the `RepertoirePolicy` contract, whose shipped executable form cannot host a conforming instance — §3), §3's compilation path (one new stage), §9.5 (a refusal whose stated scope is wider than its evidence) and `apps/server/src/bot-policy-catalog.ts`'s `BotPolicyEffect` union. Amends `rfc/bot-roster.md`'s out-of-scope table, one row.
- **Supersedes / superseded by:** —
- **Planning:** `planning/bot-route-source/` (once implementing)

```tabiya-claims
none
```

**Why `none`, verified at HEAD, and why that is a finding rather than a convenience.** Every
structure this RFC adds — the layer kind, the `propose` effect, the proposal chain, the per-candidate
provenance and the route state on the decision record — lives in `apps/server/src/bot-policy-catalog.ts`,
which is **catalog-local and not persisted at HEAD**. Checked, not assumed: the persisted
`opponentSelection` object in `schemas/drill_run.schema.json:146` requires `moveUci`, `engine` and
`policyModeApplied` and has **no `policy` member at all**; `OpponentSelection`
(`packages/runtime/src/types.ts:102-108`) carries `moveUci`, `policyModeApplied`, `orderingBasis`,
`candidates`, `engine` and nothing else; and `BotPolicyDecisionRecord`
(`bot-policy-catalog.ts:141-165`) is a server-local interface with no cross-package importer. `[V]`
The record becomes persisted only when `bot-policy.md`'s **live-claimed, unlanded run-schema lane
0.18** lands, and this RFC's fields ride into that lane rather than opening a second one — the
cross-draft pin is stated in §7.3 and made failable by criterion 14, which **fails loudly if 0.18
has already landed** when this RFC implements, rather than letting a silent widening through. So:
no pack lane, no run lane, no migration, no shape-entry, no principle-entry, no evidence-kinds
member. The precedent is `bot-policy.md` §1's own argument that policy definitions are a catalog
rather than a table ([[D936]]), and `evidence-move-selector.md` §5's identical `none` on identical
ground. The register row for this draft is added to `rfc/README.md` **in the registration commit**,
per the register instruction that the row and the draft ride together.

## Summary

Three increasingly strong mechanisms tried to give a bot a visible opening identity by **reweighting
or filtering** the human-policy model's returned candidates, and all three failed the same way: the
next move of the plan is simply **not in the window**, so no multiplier can reach it. The fourth
mechanism — a **separately identified source that enumerates legal moves itself, proposes them, and
submits them to the existing Stockfish safety guard** — passed all eight preregistered gates,
completing its target in **9 of 12 branches against guarded Maia's 1 of 12**, with **zero
pre-completion regressions** and no safety degradation. `[V]`
(`planning/platform-alignment/bot-policy/d1084-generated-route-results.json`)

This RFC specifies that source as the **eighth layer kind and the first proposing layer** in the
`bot-policy` stack: `RouteSourceLayer`, effect `propose`, sitting between the sampler and the error
guard. It is the only layer in the grammar that may **add** a candidate rather than reweight one,
and §3 shows why that is a structural addition and not a parameter — the shipped `repertoire` layer
is implemented as `applyPolicyMultiplier` (`bot-policy-catalog.ts:491`), and a multiplier applied to
a move the base never emitted multiplies **zero** ([[D1162]]). The measured size of that gap is
exact: **15 of 41 route selections (36.6%) were moves absent from the retained base window**, and
under the shipped composition every one of them is unplayable. `[V]`

Beyond the layer, this RFC specifies the four things the experiment exercised and the grammar cannot
yet express: the **guard asymmetry** (a proposed candidate the guard cannot price is dropped, where a
base candidate passes through — §6.2, the single most important normative rule here, because the
base is human-measured and a proposal is not), **provenance on the selection** (a proposed move must
never be recorded as the base model's output, and must not reuse `offWindow`, whose three shipped
consumers all read it as *exclude from measurement* — §7.2), **deterministic versus drawn selection**
(36.6% of route selections were not drawn at all, and a record implying a seeded draw for them would
be false — §6.4), and **route lifecycle** across completion, deviation, re-entry and transposition
(§8).

**No production profile registers here, and that boundary is a ruling rather than a scope choice**
(§10): O8.3 requires a demonstration this experiment does not supply, the owner wrote O8.3 before
this mechanism existed, and the question that would lift it is put to the owner in Open question 1
with a recommendation rather than being answered by me.

## Motivation

**The clause the product has never served.** `design/00-thesis.md` promises an opponent that is
*"truly applying an opening/middlegame/endgame"*. At HEAD, no shipped or drafted mechanism does
this. `BOT_POLICY_PROFILES` is a literal empty array (`bot-policy-catalog.ts:299`) and
`composeBotPolicySelection` has **no production caller** — a repository-wide search for it outside
tests returns only its own definition (`[V]`, and [[D1087]] recorded the sampler half of the same
fact). `bot-roster.md` registers twelve profiles that differ by **band, guard and one pawn
multiplier**, and the roster's own coherence argument is that guard and trait shift expected loss by
**1.36 cp** and **1.01 cp** — two orders of magnitude below what a learner can perceive. That is an
honest strength ladder. It is not an opening identity, and it cannot become one by adding
multipliers, because the multiplier ceiling is exactly what D1078 and D1080 measured.

**The measured wall, in three results.** All on the same frozen population — six lexically selected
authored opening roots, both colours controlled, twelve plies, Maia3 5M at band 1800 (T 0.8 /
top-p 0.92), Stockfish 18 at 25,000 nodes with a 250-cp admission ceiling and per-search hash
isolation. `[V]` (`d1084-generated-route-plan.md`; results `parameters`, `sources`)

| mechanism | what it did | completed | the blocker it hit |
|---|---|---:|---|
| **D1062** global atom weighting | one multiplier over Maia's window | — | too sparse to move behaviour |
| **D1073** phase-scoped target weighting | narrower multiplier | — | adequate opportunity coverage, insufficient behavioural movement |
| **D1078** progress filtering | restrict the window to distance-reducing moves | **1/12** | 62/72 plies fall through; steering the first opportunity **erases the next**; one line plays `Nf3`, loses the square during fallthrough, plays `Nf3` again |
| **D1080** monotone preservation | never voluntarily undo an achieved subgoal | **1/12** | preservation works (9/9 progress, 58 preserving, all in-window) and the **opportunity count still collapses 23 → 9**; forced to regress twice because no non-worsening candidate exists |
| **D1084** generated source | enumerate legal moves, propose, guard, then prefer base mass | **9/12** | — all eight gates pass |

`[V]` (`design/research/finite-state-bot-route-controller.md`,
`design/research/monotone-bot-route-controller.md`, `design/research/generated-bot-route-source.md`)

D1080's own verdict states the exit in the words this RFC executes: *"No further multiplier or local
shortlist filter is justified. A bot with an opening identity needs a separately versioned,
transposition-aware candidate source. Maia may rank/fill and Stockfish may guard, but neither can be
cited as the source of route moves they did not emit."* `[V]`

**Why now.** [[D1330]]'s per-dossier classification of all 118 research artifacts found ten
live-debt dossiers and ranked this one third, on a property none of the other nine has: *"an
experiment that passed all eight of its gates and appears in no RFC."* A grep of `rfc/*.md` for
`route source` at drafting HEAD returns **zero matches**. `[V]` The mechanism the research programme
converged on after four experiments has no specification, no register row and no implementer.

**Out of scope, each with a named home and a named owner** ([[D1230]] — a deferral without a home is
not a deferral; a deferral without an owner is a wish):

| out of scope | why | home | owner |
|---|---|---|---|
| the route catalogue — which routes exist, their names, their squares | authored content with licence and provenance obligations; the experiment hand-coded **one** three-square configuration and its dossier says so | Discharge D3 | `planning/content-wave-work-order.md` |
| any registered production profile carrying a route | **O8.3 owner ruling**, which predates this mechanism — §10, Open question 1 | Open question 1 | OWNER |
| the multi-game behaviour demonstration O8.3 requires | a new experiment on a new population; D1084 is a 12-branch mechanism witness by its own declaration | Discharge D1 | codex |
| any *human-like*, personality, coherence or enjoyment claim | C5 unmet; no human played or blind-ranked these lines | — (refused, not deferred; §11.2) | — |
| middlegame and endgame routes | the target primitive is exact occupancy of named squares, which is an opening-shaped goal; a middlegame plan is not a square set | Discharge D5 | claude |
| an Elo label for any route-carrying profile | [[D819]] unchanged: a stated Elo is a measured claim with its measurement cited | Discharge D4 | codex |
| repairing the `repertoire` layer into a proposer | a book is a second proposer with its own coverage obligations; §4.4 opens the chain for it and does not build it | Discharge D6 | claude |

## Specification

### §0 — What D1084 established, and what it did not

**The eight gates, and why the plan's prose numbers six.** The preregistered plan lists six numbered
gates; three of them carry two clauses each, and the instrument reports them as eight independent
Boolean keys — `completion`, `monotone`, `legalAndGuarded`, `sourceRecorded`, `loss`, `severe`,
`repetition`, `nonVacuousSourceMix`, plus the conjunction `pass`. All eight are `true`. `[V]`
(`d1084-generated-route-plan.md` §Gates; `d1084-generated-route-results.json` `gates`) The count is
stated here because *"all eight gates pass"* is otherwise an assertion a reader cannot trace to the
plan that declared six.

**The measured result, both arms** `[V]` (`d1084-generated-route-results.json`):

| | guarded Maia | generated route |
|---|---:|---:|
| branches | 12 | 12 |
| branches exposing ≥2 route opportunities | 4 | **11** |
| route opportunities | 17 | 37 |
| progress selections | 0 | 31 |
| distance-preserving selections | 0 | 10 |
| adherence (progress taken / progress available) | n/a | **31/37 = 83.8%** |
| pre-completion regressions | 3 | **0** |
| branches completing the target | **1 (8.3%)** | **9 (75.0%)** |
| mean selected-move loss | 19.86 cp | 38.96 cp |
| ≥250 cp severe rate | 0.0% | 0.0% |
| maximum position repetition | 1 | 1 |

**The composition the experiment actually exercised**, which is what this RFC specifies: of 41
admitted route selections, **26 retained base mass and were sampled by that mass**; **15 were absent
from the retained base window and were resolved by a recorded Stockfish-loss then canonical-UCI
tiebreak**; **55 proposed candidates were refused by the 250-cp guard**; the worst admitted route
selection was **234 cp**, under the guard; and the arm's mean-loss delta was **+19.10 cp** inside
the predeclared 35-cp bound. `[V]`

**The fallthrough figure needs its two halves stated separately, and this is the one number that
looks bad until it is decomposed.** The route arm records **31 fallthroughs across 72 controlled
plies (43.1%)**, which is above the **25% exercise ceiling** that excluded both repertoire arms in
R11. Decomposed: **25 of the 31 occur after the route has already completed**, where falling through
to the base is the specified and correct behaviour, and **6 occur pre-completion** because every
proposed candidate was guard-refused. Pre-completion fallthrough is therefore **6/72 = 8.3%**, which
clears the 25% ceiling by a wide margin, and post-completion fallthrough is not the quantity that
ceiling measured. `[V]` (`generated-bot-route-source.md`; `results.json` `route.fallthroughs: 31`)
Criterion 11 makes this decomposition a reporting obligation rather than a footnote, because an
undecomposed 43.1% would read as a failure of the ceiling that refused the books.

**What it did not establish, quoted from its own verdict so no downstream reader can inflate it:**
*"This passes the mechanism boundary and nothing above it. It establishes that a bot route can be
composed as source → guard → human-policy preference → explicit fallback. It does not establish that
this one three-square target is coherent, human-like, enjoyable or a personality."* `[V]` Three
further limits ride with it: one exact fianchetto configuration is a mechanism witness rather than a
route catalogue; six authored roots are not a population estimate; and **no human played or
blind-ranked these lines**, so C5 remains unmet and *human-like* remains forbidden. `[V]`

**Instrument corrections that ran before the verdict was read**, recorded because a favourable
number accepted without them would not be evidence. [[D1095]] caught two comparison faults after the
first run: the generator keyed both the base request seed and the deterministic draw **by arm**, so
sibling arms did not share a common random quantile before their histories diverged, and it
inherited a base-only opportunity denominator for the generated arm. The final run keys draws by
pack/colour/ply, and *generated opportunity* means a legal generated progress candidate exists. The
total-scoring pass then exposed a castling dialect boundary — chessops enumerated `e8h8` where
orthodox Stockfish expected `e8g8` — and the final instrument converts **only at the engine
boundary** and normalises back before playing. The run was repeated; after removing `measuredAt`,
both artifacts hash to `6beda443703ad36db6e2921446e8dff9a23bacf9fb9583401bda17140e0ebb95`. `[V]`
The castling repair is reusable and is routed rather than left in a disposable harness (§9.3).

### §1 — Which prior refusals bind this RFC, and which do not

[[D1320]]'s obligation, discharged explicitly: *"the bot refusals are scoped to a MECHANISM, not the
goal."* Six refusals touch this subject. **Four do not bind, one binds partially, one binds fully
and is an owner ruling.** Each is quoted at its own scope rather than summarised.

**§1.1 — The R11 authored-repertoire arm. Does not bind.** *"The authored-repertoire arm fell off
the pack spine on 57/72 controlled plies (79.2%)"*, against a 25% preregistered exercise ceiling.
`[V]` (`design/research/bot-policy.md`) Its scope is a **drill-pack spine used as an opponent book**,
and its conclusion is that *"a drill spine is authored consequence content, not an opponent
repertoire."* A route source performs no lookup and has no spine: it enumerates the legal moves of
the position in front of it and derives each child's mechanical distance to a declared target. The
mechanism that failed is not the mechanism specified here. What **does** carry over is the ceiling
itself, and §0 answers it at 8.3% pre-completion rather than dismissing it.

**§1.2 — The R11 statistical-book arm. Does not bind.** The frozen local book parsed **2,519,503
eligible Lichess blitz games**, found 19,214 reaching a fixed root and retained 58,147 rooted
positions, *"yet the arm still fell back on 57/72 controlled plies"*, and *"increasing the input from
an 86 MB check to the 14 GB frozen prefix did not change that conclusion."* `[V]` Its scope is a
**corpus-derived continuation book**. A route source derives nothing from a corpus; its candidate
set is the legal move list and its ordering is rules arithmetic. This refusal is in fact the
strongest available argument *for* the mechanism specified here: the failure was shown to be
insensitive to two orders of magnitude of corpus size, which is what excludes "get a bigger book" as
the alternative to proposing.

**§1.3 — D1078 (finite-state filtering) and D1080 (monotone preservation). Do not bind; they
commission this RFC.** D1078: *"This rejects filtering the Maia shortlist as the 1.0 route mechanism.
It does not reject the exact target primitive."* D1080: *"No further multiplier or local shortlist
filter is justified."* `[V]` Both refuse **filters over a returned window** and both name the exit as
a separate candidate source that can *"source safe legal candidates outside Maia's top window"* —
which is this document. [[D1330]] recorded the same relation from the other side: two of the nine
refusal dossiers *"are superseded by the passing experiment at rank 3."*

**What D1080 does bind:** its sentence forbids **any further multiplier or shortlist filter** as a
route mechanism. A future `trait.route_preference` — a multiplier keyed to route distance — is
refused by D1080 in advance, and §11.4 records that refusal so it is not rediscovered by a third
experiment. The route source clears D1080 because it is a proposer, not a multiplier; nothing else
in this family does.

**§1.4 — `bot-policy.md` §9.5 and `bot-roster.md`'s out-of-scope row. Bind only at their evidence,
and both are amended here.** §9.5 reads: *"A repertoire persona and cross-game memory — measured out
(79.2% fallback) and ruled out (O8.3) respectively; interfaces only."* `bot-roster.md`'s table reads:
*"an opening book | measured out at 79.2% fallthrough on both arms against a 25% ceiling |
`bot-policy` §8 | — (refused, not deferred)."* `[V]` The **evidence** cited by both is §1.1's and
§1.2's, which is book-scoped. The **wording** of both is opening-identity-scoped, and an implementer
reading either would conclude that opening identity is closed — on the same day a different
mechanism passed eight gates. This is precisely [[D1320]]'s defect shape: a mechanism refusal read
as a goal refusal. Two amendments, both small and both textual:

1. `bot-policy.md` §9.5's first clause becomes *"A repertoire persona **built as a book lookup or a
   window filter**"*, with the D1084 exception cited. Criterion 12.
2. `bot-roster.md`'s row's *why* column gains *"— refuses the book mechanism, not opening identity;
   see `bot-route-source.md`"*, and its **home pointer is corrected**: it cites `bot-policy` §8,
   which is the mode seam and dispositions table and contains no repertoire refusal; the refusal
   lives in §9.5 and §2.3. Criterion 12.

**§1.5 — O8.3, the owner ruling. Binds fully, and I cannot lift it.** *"repertoire and memory:
interfaces in F8, no shipped repertoire persona or adaptive memory until a real immutable book
reaches declared coverage and a multi-game experiment demonstrates the behavior."* `[V]`
(`bot-policy.md` §0) Two clauses, and they behave differently against this mechanism. *"A real
immutable book reaches declared coverage"* has **no referent** for a route source — there is no book,
so there is nothing for coverage to be declared over, and the clause is not satisfiable rather than
unsatisfied. *"A multi-game experiment demonstrates the behavior"* applies directly and is **not
met**: D1084 is twelve 12-ply branches from six roots against one target, which its own limits
section calls a mechanism witness. So O8.3 gates **registration of any production profile carrying a
route**, and §10 holds that gate closed. Because the ruling was written before the mechanism existed
and its first clause does not reach it, the question of what O8.3 requires *of a generated source* is
the owner's, and it is Open question 1 with a recommendation — not a decision I make by reading the
ruling generously.

### §2 — Relationship to `rfc/evidence-move-selector.md`: complementary, with a mechanical test

The drafting directive asked whether these are one mechanism seen twice. **They are not, and the
distinction is mechanical rather than editorial: they occupy different slots, they have opposite
coverage obligations, and they compose.**

**§2.1 — Different slots in the same pipeline.** `evidence-move-selector` specifies a **base**: a
fourth base type replacing Maia's policy vector in the `HumanPolicyModel` slot, producing mass over
the complete legal set (its §3 requires `coverage` to be **exactly 1.0**, an identity rather than a
threshold). This RFC specifies a **proposer**: a layer between the sampler and the guard that adds a
small, purposeful set of candidates and originates mass for exactly those the base did not carry.
The composed pipelines differ by one stage:

```text
selector:      evidence base → sampler → guard → traits → draw
route source:  any base      → sampler → ROUTE SOURCE → guard → traits → draw
both:          evidence base → sampler → ROUTE SOURCE → guard → traits → draw
```

**§2.2 — Opposite coverage obligations, which is the test that settles it.** A base must cover the
whole legal set or it is fabricating a distribution; the selector RFC makes that failable and
demonstrates the old gate vacuous against it. A route source **must not** cover the whole legal set —
its entire value is that it proposes few moves for a stated reason, and D1084's proposals were
refused 55 times by the guard precisely because they were selective. Two layers with contradictory
coverage requirements cannot be the same layer. §5.3 turns this into a compiler rule: a `propose`
layer that proposes the entire legal set fails compilation, which is the exact mirror of the
selector's identity requirement.

**§2.3 — Neither depends on the other, and their evidence status is asymmetric.** This is the part a
register reader most needs. The route source composes over the **shipped Maia base** — D1084
measured exactly that, with 26 of 41 selections drawing on retained base mass — so it is buildable
against what exists today. The selector's base head, meanwhile, has been measured twice and returned
twice: [[D1297]] refused the unguarded standalone base permanently (severe-tail mass rose +1.97 pp
and +1.34 pp against a +1-point ceiling, and no fitted coefficients were promoted), and [[D1312]]
returned the guarded composition on independently declared clauses (validation guarded-combined
cross entropy **2.313 vs guarded-engine 2.294**; confirmation 1000–1399 survival **14/17 = 82.4%**
against an 85% floor), with its reserved third population left unread and the mechanism explicitly
not re-tunable. [[D1328]] then found that the materially different family is set-dependent choice
and that the next step is **data readiness, not a third model fit**. `[V]` (`design/BACKLOG.md`
D1297, D1312, D1328)

Stated plainly, because it is the sentence that should decide sequencing: **the route source is the
only bot-personality mechanism in this repository that passed its preregistered gates and has no
unfunded dependency.** The selector remains the right answer to a different question — a
variant-portable *base* — and its owner disposition is owed under [[D1320]] regardless of what
happens here.

**§2.4 — Where they do touch, and the pin.** Both amend `bot-policy.md`'s layer contracts in
`bot-policy-catalog.ts`, in **disjoint members**: the selector widens `HumanPolicyModelLayer`'s
`historyCapability` and adds `completenessKind` (its §4, `:49-56`); this RFC adds a `RouteSourceLayer`
interface, a `BotPolicyEffect` member and two `BotPolicyCandidateInput` fields (§4). No line is
claimed twice, so landing order is free. The one genuine interaction is `completenessKind`: if the
selector lands first, §6.3's completeness basis must read the selector's `legal_coverage` discipline
rather than the mass sum, and criterion 15 asserts the composed behaviour under **both** disciplines
so whichever lands first the other still holds. Recorded as a cross-draft pin in `rfc/README.md`
rather than left to landing order.

### §3 — The mechanical defect: the shipped repertoire layer is a multiplier, so it cannot host this

`bot-policy.md` §2.3 declares `RepertoirePolicy` *"interface only in v1; no instance ships"*, which
reads as a deferral of the **instance**. Verified at the symbol, it is stronger than that: **the
interface as compiled cannot host a conforming instance at all.** Four facts, each at a line:

1. **The repertoire branch is a multiplier.** `bot-policy-catalog.ts:491` —
   `rows = applyPolicyMultiplier(rows, (moveUci) => …?.repertoirePrior ?? 0)`. `[V]`
2. **`applyPolicyMultiplier` cannot add a row.** `:354` maps over the existing `rows` and computes
   `row.finalMass * multiplier(row.moveUci)`; the multiplier is only ever queried for moves already
   present. A move the base never emitted has no row to multiply. `[V]` This is [[D1162]]'s law —
   *a multiplier cannot originate mass* — instantiated at the exact line.
3. **A row present but truncated away has `finalMass` 0, so the prior multiplies zero.** `:345`
   assigns `finalMass: finalByMove.get(row.moveUci) ?? 0`, and top-p truncation at `:332-335` keeps
   only the cumulative-`≤ topP` prefix. `0 × prior = 0`. So a repertoire prior cannot even resurrect
   a move the base *did* emit, if the sampler dropped it. `[V]`
4. **Injecting the move at `rawMass: 0` does not help.** `normalize` (`:306`) filters
   `mass > 0`, so a zero-mass row is dropped from the tempered set before truncation and returns
   `sampledMass: 0, finalMass: 0`. `[V]`

**The measured size of the gap.** D1084's route arm made **15 of 41 selections (36.6%) on moves
absent from the retained base window**. `[V]` Under the shipped composition every one of them is
unplayable — which is D1078's 8.3% completion rate reappearing as a code property rather than an
experimental one.

**And the shipped composition does worse than lose those moves; on the measured case it throws.**
Suppose a repertoire layer zeroes every non-book row and the guard then refuses the surviving book
move while admitting others. `admitted.size` is computed over `input.candidates` (`:502`), so it is
non-empty and the guard **applies** rather than abstaining; the mask at `:507` zeroes the last
positive row; `normalize` returns `[]` at `:308`; `drawPolicyMoveBy` finds no positive row; and
`:520` calls `fail("composed selection produced no move")`, a thrown `TypeError`. `[V]` D1084
measured this exact situation **6 times in 72 controlled plies** — every proposed candidate refused
by the guard — and handled it by recording a fallback reason and using guarded base. **The shipped
grammar's response to the measured 8.3% case is an exception.** §6.5 specifies the fallback that
replaces it, and criterion 6 is red before the change and green after.

**Consequence for `bot-policy.md` §2.3.** Its contract text — *"named immutable book identity,
position/transposition key, declared covered depth, adherence rule, and visible fallthrough recorded
per move"* — describes a proposer, while its executable form is a prior. The two disagree, and
nothing catches the disagreement today because no instance exists to expose it. This RFC does not
repair `repertoire` (that is Discharge D6, because a book carries coverage obligations a route does
not); it adds a layer kind whose declared effect and executable form agree, and criterion 5 asserts
that agreement for every proposing layer.

### §4 — `RouteSourceLayer`: the layer contract

**§4.1 — The new effect member.** `BotPolicyEffect` (`bot-policy-catalog.ts:20`) is
`"base_distribution" | "sample" | "prior" | "mask" | "weight" | "memory" | "presentation" | "delay"`.
`[V]` **No member means *originate candidates***: `base_distribution` originates the whole
distribution and is the base's, `prior` and `weight` are multipliers, `mask` removes. The union gains
**`"propose"`**, and this is the RFC's load-bearing type change. It is the exact structural mirror of
`evidence-move-selector`'s finding at the same file: there, the input union `BotPolicyInput`
(`:16-19`) **already admitted** the thing and the block was a field contract; here, the effect union
**does not** admit it, and the widening is real. Two RFCs against one module, opposite findings,
both verified at the line.

**§4.2 — The declaration.** A `RouteSourceLayer extends BotLayerBase` with `kind: "route_source"`,
`effect: "propose"`, and:

| field | type | meaning and obligation |
|---|---|---|
| `routeId` | `string` | identity of the route family, `[-a-z0-9_.]+`, matching the layer-id grammar at `:193` |
| `routeRevision` | `number` | ≥1; a route's square set is immutable at a revision, so a changed target is a new revision, never an edit |
| `licence` | `string` | SPDX identifier or `"authored"`; non-empty. A route derived from published theory carries its source's licence, the obligation `bot-policy` §2.3 already named for books |
| `target` | `RouteTarget` | §5.1's declared goal — the only place a route's chess content lives |
| `transposeKeyed` | `true` | route state is keyed by `transposeKey` (`packages/runtime`, used at `opponent-selector.ts:432,450`), never by move sequence — §8.4. Literal `true`: a non-transposition-aware route is refused at compile, not configured |
| `horizonPlies` | `number` | ≥1; after this many controlled plies without completion the route abandons and records `route_abandoned`. D1084's horizon was six controlled turns |
| `preserveAchieved` | `boolean` | D1080's monotone rule: while active, never propose a candidate that increases distance when a preserving candidate exists. Measured as necessary (D1078's repeated `Nf3`) and insufficient (D1080 alone completes 1/12) — so it is a required *component*, not the mechanism |
| `guardRequired` | `true` | literal. §6.2's asymmetry: a proposing layer may not run in a profile without an admitting guard |
| `measurement` | `BotMeasurement?` | **not** the controlled-trait gate (§4.3) |

`parameterCitation` (required on every layer, `:194`) cites the route's authority — the dossier for
the mechanism, the theory source for the squares.

**§4.3 — The measurement gate is a different gate, and saying so is the honest move.** The shipped
`assertLayer` applies R11's controlled-trait gate to `controlled_trait` layers only (`:220-236`):
`traitDeltaFraction ≥ 0.1`, `|expectedLossShiftCp| ≤ 35`, `severeMassRise ≤ 0.01`,
`explorerMatchRetention ≥ 0.9`. `[V]` Two of those four are wrong for a proposer and must not be
reused by analogy:

- **`traitDeltaFraction`** measures how much a *classifier rate* moved. A route's effect is not a
  rate; it is a **completion rate against a declared target**, which the trait gate has no field for.
- **`explorerMatchRetention ≥ 0.9`** measures how often the bot's move remains a move humans play at
  that band. A route source deliberately proposes moves outside the human window **36.6% of the
  time** — that is the mechanism, not a regression — so a 90% retention floor would refuse the
  passing experiment by construction.

The two that **do** transfer are the safety halves, and D1084 satisfies both:
`|expectedLossShiftCp| ≤ 35` (measured **+19.10 cp**) and `severeMassRise ≤ 0.01` (measured **0.0%**
in both arms). `[V]` So `RouteMeasurement` is a **distinct** record with five fields — `completionRate`
(≥0.70, D1084's gate 1, measured 0.75), `preCompletionRegressions` (= 0, measured 0),
`maxAdmittedLossCp` (≤ the profile's guard threshold, measured 234 against 250),
`expectedLossShiftCp` (≤35, measured +19.10) and `repetitionMax` (≤ baseline, measured 1 vs 1) —
and `assertLayer` gains a branch enforcing it. Criterion 3. Reusing the trait gate here would have
been the cheap move and would have made the gate unfailable in the direction that matters, which is
[[D1274]]'s class.

**§4.4 — Proposal authority, and room for a book.** `SINGLETON_KINDS` (`:174-181`) makes
`repertoire` a singleton; `route_source` joins it. But **two proposers are architecturally legitimate
and should not be refused** — a memorised book while in theory, a structural route after leaving it
is a real bot, and refusing it would be a scope cut wearing a compile error. So the compiler enforces
a **proposal chain** rather than a singleton across kinds: a profile may declare an ordered list of
layers with `effect: "propose"`, evaluated in declaration order, and **the first proposer returning
an admitted candidate owns the move**. The record names which one proposed (§7.2), so two proposers
can never be confused for each other. Within a kind the singleton rule stands (one `route_source`,
one `repertoire`), because two routes of the same kind competing for the same move is ambiguity
rather than composition; a bot wanting two routes declares one `route_source` whose target is a
`RouteTarget` list (§5.1). `repertoire` joins the chain only when Discharge D6 repairs its effect
from `prior` to `propose`; until then a profile declaring both fails compilation with a message
naming D6, rather than silently running a book as a multiplier. Criterion 7.

### §5 — What a route is, and the law-8 line

**§5.1 — `RouteTarget` is a square set, and that is the whole of its chess content.** A target
declares, per controlled colour, a set of `(role, square)` occupancy requirements; distance is the
**count of unsatisfied requirements**, and a child's distance is computed by replaying the candidate
move and recounting. D1084's target was three such requirements — the kingside fianchetto
configuration — giving distances 3→2→1→0. `[V]` The declaration form is a list, so a route with
several stages or a bot with several routes is expressible without a second mechanism.

**§5.2 — The law-8 line, and why it falls where it does.** Law 8 forbids LLM-manufactured chess
truth: *"LLMs may render validated evidence but may not create ungrounded strategic claims or grade
moves."* A route is **not** a claim that its squares are good. It is a **declared goal with a
mechanical distance function**, and every move it proposes is admitted or refused by a Stockfish
bound that the route does not author. The dossier draws the same line and it is the operative
sentence for this section: *"Stockfish never supplies route meaning. Maia never receives credit for a
candidate it did not retain."* `[V]` Two consequences the compiler enforces:

- **Refused: any positional heuristic as a distance function.** The dossier's own limits section
  names this: *"arbitrary position heuristics would recreate ungrounded chess judgement in code."*
  `[V]` `RouteTarget` admits **only** exact occupancy requirements. A distance function that scores
  centre control, king safety or structure is a chess opinion in code, and is refused at the type
  level by there being nowhere to put it — the same discipline as
  `evidence-move-selector`'s `REFUSED_AUTHORED_WEIGHT`, achieved by a narrower type rather than a
  predicate. Criterion 4.
- **Refused: prose asserting the route is correct.** A presentation layer may state *what* the route
  is (*"aims for a kingside fianchetto"* — a description of a declared goal) and may not state that
  it is good, sound or strong. `REFUSED_PERSONA_CLAIM` (`:173`) applies unchanged; §11.3 adds the
  soundness vocabulary.

**§5.3 — A proposer that proposes everything is not a proposer.** §2.2's mirror rule: if a route
source's admitted proposal set equals the complete legal set for a position, it is acting as a base
without a base's coverage obligations. The compiler cannot see this statically, so it is a **runtime
refusal**: proposals equal to the full legal set fail the selection with a typed error rather than
degrading. Criterion 8.

### §6 — Composition: order, the guard asymmetry, completeness, the draw, the fallback

**§6.1 — Position in the stack.** O8.1's order is
`HumanPolicyModel → RepertoirePolicy? → ErrorGuard? → ControlledTrait[] → MemoryPolicy?`. `[V]`
The route source takes the `RepertoirePolicy` position: **after** the sampler, **before** the guard.
D1084's pipeline is the same one — *"source → guard → human-policy preference → explicit fallback"* —
and the ordering is load-bearing rather than conventional: proposing after the guard would put an
unpriced move into the distribution, and proposing before the sampler would subject a deliberate
proposal to top-p truncation, which is D1078's failure re-created one stage earlier.

**§6.2 — The guard asymmetry. This is the most important rule in this document.** The shipped guard
abstains when the engine cannot price the candidates: `priced` is `every(… Number.isFinite(guardLossCp))`
and on failure it records `abstained: "provider_unavailable"` and **passes the distribution through
unmasked** (`:497-501`). `[V]` That is correct for a base distribution, because Maia's mass is a
measurement of human choice and an unguarded human move is still a human move. **It is wrong for a
proposed candidate**, which has no human evidence behind it at all — an unpriced proposal admitted
by abstention is an ungrounded move played by a bot on the authority of nothing. The rule:

> When the guard abstains for any reason — `provider_unavailable` or `empty_after_mask` — **every
> proposed row is dropped** and the base distribution passes through unmasked. Proposed rows are
> admitted only by a guard that actually ran and actually admitted them.

`guardRequired: true` (§4.2) is the compile-time half: a proposing layer cannot be declared in a
profile with no guard, so there is no configuration in which proposals reach a draw unpriced.
Criterion 9 makes the runtime half failable with a fixture supplying an unavailable engine and
asserting the proposed move is absent from the drawn distribution.

**§6.3 — Completeness stays honest by excluding proposals from its basis.** `completeness` is
`rows.reduce((sum, row) => sum + row.mass, 0)` over the input candidates (`:327`), checked against
`sampler.completenessThreshold` (`:458`), and it exists to catch a **truncated base vector**. `[V]`
Proposed rows carry no base mass, so they must not enter that sum — if they did, the statistic would
silently change meaning from *how much of the base vector arrived* to *how much of everything we
assembled*, and a base that arrived 40% truncated could be masked by proposals. Rule: **the
completeness basis is the rows whose provenance is the base**, and the check runs on that basis
before any proposer executes. Because the sum only ever adds base rows, this is also arithmetically
inert for the shipped path, which is what makes it cheap. If `evidence-move-selector` lands its
`completenessKind` discipline first, the basis rule composes unchanged with `legal_coverage`: the
coverage identity is computed over base rows, and proposals are outside the denominator. Criterion 15
asserts the composed behaviour under both disciplines.

**§6.4 — Drawn versus deterministic, and the seed claim.** D1084 resolved **26 of 41** route
selections by retained base mass and **15 of 41** by *"lowest admitted loss and canonical UCI"* — a
deterministic tiebreak, not a draw. `[V]` [[D823]]'s contribution to `bot-policy` is that generation
becomes **seed-reproducible** and composed selections report `seedHonored: true`. A deterministic
selection is trivially reproducible, so the seed claim survives — but a record implying a seeded draw
occurred for those 15 would be **false**, and the pick record exists to be exact ([[D818]]/[[D822]]).
Rule: the record carries a `resolution` discriminator per selection —
`"drawn"` | `"route_mass_preference"` | `"route_deterministic_tiebreak"` | `"fallback_drawn"` — and
`chosenFinalMass` is present only for the drawn resolutions. Criterion 10.

The preference order within the route source is D1084's, unchanged and specified rather than
re-derived: propose every progress candidate, or every preserving candidate when no progress exists;
submit all to the guard; among admitted proposals prefer the one with **retained base mass**, drawn
by that mass; if no admitted proposal retained mass, take the **lowest admitted Stockfish loss**,
then **canonical UCI** as the final tiebreak. `[V]` (`d1084-generated-route-plan.md` §Source/guard/fallback policy)

**§6.5 — The fallback, replacing the throw.** When the route source has no admitted proposal — every
proposal guard-refused, or no legal progress or preserving candidate exists — the selection **falls
back to the guarded base distribution** and records the reason. The reason vocabulary is closed and
comes from the experiment's own trace: `route_guard_refused` (proposals existed and all were
refused — D1084's 6 pre-completion cases), `no_progress_candidate` (D1078's recorded reason),
`no_nonworsening_candidate` (D1080's), `route_complete` (D1084's 25 post-completion cases),
`route_abandoned` (horizon exhausted), `route_not_entered` (the position never matched the route's
entry condition). `[V]` A fallback is a **`fallthrough`** action on the layer record, never an
`abstained` — the existing vocabulary at `:152` distinguishes them and the distinction is exactly
this one: the layer ran and had nothing to offer, versus the layer could not run.

### §7 — The record

**§7.1 — What already fits.** `BotPolicyDecisionRecord.layers[]` (`:150-155`) carries
`{id, action: "applied" | "abstained" | "fallthrough", reason?, parameters?}`, which holds §6.5's
reasons with no new shape. `considered[]` (`:156-163`) already types `rawMass`, `sampledMass`,
`finalMass`, `guardLossCp` and `features` as **optional**, so a proposed row with no base mass is
representable in the record even though it is not representable in the *input* (§7.4). `[V]`

**§7.2 — What must be added, and why `offWindow` is the wrong home for it.** `SelectionCandidate`
already carries `offWindow?: boolean` (`packages/runtime/src/types.ts:84`), which looks like the
natural marker for a move outside the provider's window — and it is a trap. Its producer emits it
in exactly one place, when Maia's own `bestmove` is missing from its returned candidate list
(`opponent-selector.ts:629-634`), and **three shipped consumers read it as *exclude from
measurement***: `service.ts:1206` filters off-window candidates out of the published distribution,
`packages/runtime/src/pivotal.ts:32` excludes them from pivotal-moment detection, and
`packages/runtime/src/practical-difficulty.ts:37` excludes them from difficulty measurement. `[V]`
Marking route proposals `offWindow` would therefore delete **36.6% of route moves** from two
measurement surfaces silently — a deliberate, guarded, recorded move treated as a provider artifact.
So: a **separate** `proposedBy?: string` on the considered row, carrying the proposing layer's id,
and `offWindow` keeps its meaning untouched. Criterion 13 asserts that no route proposal is emitted
with `offWindow: true` and that all three consumers still see it.

**§7.3 — Route state on the record, and the cross-draft pin.** The record gains a `route?` object:
`{layerId, routeId, routeRevision, distanceBefore, distanceAfter, resolution, proposalsAdmitted,
proposalsRefused, state}` where `state` is
`"entered" | "progressing" | "preserving" | "complete" | "deviated" | "abandoned"`. Every field is a
count or a mechanical reading; none is a judgement. This is the object that makes the arm's numbers
reconstructible from production records rather than only from a harness, which is what turns the
experiment's gates into a monitor (§8.5). It is **catalog-local until run-schema 0.18 lands**, and
then it rides `OpponentSelection.policy` as part of that lane — `bot-policy.md` owns 0.18 and this
RFC widens the shape it defines before it lands, which is a cross-draft pin rather than a second
claim. Criterion 14 fails if 0.18 has already landed at implementation time, forcing the claim to be
renegotiated in the register rather than widened silently.

**§7.4 — The input type, and the production path that does not use it.** `BotPolicyCandidateInput`
(`:132-139`) requires `rawMass: number`. `[V]` A proposed candidate has no base mass, so the field
becomes optional and gains `proposedBy?: string`, with the invariant that **exactly one of
`rawMass` and `proposedBy` is absent** — a row is a base row or a proposal, never both and never
neither. Criterion 2.

One honest complication, recorded rather than discovered later: **this input type has no production
producer.** [[D1251]]'s W15 found the whole `BotPolicyCandidateInput` path is test-only and
production builds `SelectionCandidate` instead, which has no `traits` field — and, confirmed here,
no `proposedBy` and no route state either (`types.ts:80-88`). `[V]` So this RFC's input widening is
correct and **not sufficient on its own**; the producer that populates it is the same one W15 owes
for `traits`. Named as Discharge D2 and pointed at W15 rather than assumed, because a widened type
with no producer is exactly the shape of a feature that looks shipped and is not.

### §8 — Lifecycle: entry, deviation, re-entry, transposition, completion, monitoring

The experiment ran twelve plies from a fixed root and never asked these questions. A production
route does, and answering them is the difference between the layer and the harness. Every rule here
is a specification decision, marked `[M]` where it is not measured, so a reader can see which parts
carry evidence and which carry judgement.

**§8.1 — Entry.** A route declares an entry condition as a position predicate over the same exact
occupancy vocabulary as its target — most often *"distance to target > 0 and the controlled colour
still has the pieces the target names."* D1084's root population used exactly this rule to select
roots: *"both colors retain a pawn, bishop and knight and neither three-square target is already
complete."* `[V]` A route not entered records `route_not_entered` and costs nothing. `[M]` for the
generalisation from the population rule to an entry predicate.

**§8.2 — Deviation.** The opponent's replies are not controlled, so a route can be made impossible —
the learner takes a piece the target names. When the target becomes **unsatisfiable** (a required
role is off the board and unpromotable to), the route records `state: "deviated"` and falls through
permanently for the rest of the line. It does **not** retarget: silently switching goals is the
opposite of a declared route, and a bot whose plan changes without record is the opacity the whole
declaration discipline exists to prevent. `[M]`

**§8.3 — Re-entry after fallthrough is allowed, and D1078 says why it must be bounded.** A route may
resume after a fallthrough ply — that is what makes `preserveAchieved` meaningful. But D1078
measured the failure mode exactly: *"One steered branch even plays `Nf3`, later loses the occupancy
during fallthrough, then plays `Nf3` again."* `[V]` So re-entry is permitted while the horizon has
not been exhausted, and **`horizonPlies` counts controlled plies since entry, not since the last
progress** — a route that keeps losing and regaining a square exhausts its horizon and abandons,
rather than looping. D1084's horizon was six controlled turns. `[M]` for the counting rule.

**§8.4 — Transposition.** Route state is keyed by `transposeKey` (`opponent-selector.ts:432,450`),
not by move sequence, which is what `transposeKeyed: true` declares. Two consequences: a position
reached by a different move order carries the same route state, and — the one that matters for this
product — **a rewind to an earlier node restores that node's route state**, because the key is the
position's. The branch runtime's rewind therefore needs no route-specific work, which is a property
worth asserting rather than assuming. Criterion 16.

**§8.5 — Monitoring: the gates become a production check.** §7.3's route object makes every D1084
gate computable from persisted records: completion rate, pre-completion regressions, max admitted
loss, proposal admit/refuse counts and the source mix. `make route-gates` recomputes the eight gate
keys over recorded selections and reports them with the §0 decomposition of fallthrough. A route
whose production completion rate falls below its declared `RouteMeasurement.completionRate` is a
**reported drift**, not a silent one. Criterion 11.

### §9 — Variants, and the base-free arm the experiment already measured

**§9.1 — The route source is rules-general, and its distance function needs no engine and no model.**
It enumerates legal moves through chessops and counts unsatisfied occupancy requirements. Both
operations work on any position the move generator accepts — which is the portability property
`evidence-move-selector` §1 claims for its feature family, obtained here far more cheaply because
occupancy counting has no start-array dependence at all (contrast that RFC's
`rules.phase.development`, which is defined against the standard back rank and does not port). `[V]`

**§9.2 — And it already has a measured base-free arm.** Maia cannot parse a Chess960 position
([[D1161]]: 858 of 960 arrangements lose every castling right and the adapter then answers `go` from
a stale board), so in a 960 game the route source has **no base mass to prefer** — every proposal
falls to the *lowest admitted loss then canonical UCI* branch. That branch is not hypothetical: it is
the one D1084 exercised **15 times out of 41**, and Stockfish 18 ships `UCI_Chess960` so the guard
that admits those proposals works. `[V]` The architectural consequence is worth stating precisely
because it is the strongest thing this mechanism offers the variant family: **the route source is the
only measured mechanism in this repository that can produce purposeful opening play in a position the
human-policy model cannot parse.**

**It is a derived consequence, not a measurement, and the distinction is the whole of the claim's
honesty.** D1084 ran standard chess only. So §9.2 is an **obligation, not a claim**: Discharge D7
runs the D1084 gates on a 960 population before any route-carrying profile is offered in a variant
game, and criterion 17 refuses a route-carrying profile in a variant with no recorded 960 gate
result. Until then the correct statement is *"the mechanism has a base-free arm and it has been
measured in standard chess"*, and nothing stronger appears on a card.

**§9.3 — The castling dialect repair is reusable and is routed.** D1084's instrument found chessops
enumerating `e8h8` where orthodox Stockfish expected `e8g8`, and fixed it by converting **only at the
engine boundary** and normalising back before playing. `[V]` That is the same dialect boundary
`rfc/variants.md` and `rfc/exact-legal-mobility.md` handle for [[D1029]]'s king-takes-rook move
identity, and it currently lives in a disposable harness
(`tools/d1078-route-controller-harness/generate.mts`). Discharge D8 routes it to the production
engine boundary rather than leaving a solved problem to be re-solved; it is small, and its value is
that the failing case is already known and named (*"missing isolated score e8h8"*).

### §10 — What ships, what is held, and by whom

Priced at the full ask ([[D1230]]), with the boundary between *specified* and *registered* stated as
a ruling rather than a size.

**Ships in this RFC, complete:** the `propose` effect; the `RouteSourceLayer` declaration and its
compiler branch; `RouteMeasurement` and its five-clause gate; the proposal chain and its
authority rules; `RouteTarget` and the occupancy-only distance discipline; the guard asymmetry; the
completeness basis; the resolution discriminator; the closed fallback vocabulary; the route record;
the lifecycle rules; the `proposedBy` marker and its separation from `offWindow`; the input-type
invariant; `make route-gates`; and the two textual amendments in §1.4. That is the whole mechanism,
with nothing held back for a later stage.

**Held, and the holds are not mine.** No profile registers a route here, for three reasons with three
different owners:

1. **O8.3 (OWNER)** — §1.5. A multi-game behaviour demonstration is required and does not exist.
   Open question 1 puts the O8.3-versus-generated-source question to the owner with a recommendation.
2. **The route catalogue (content)** — one hand-coded fianchetto configuration is a mechanism witness.
   Routes are authored content with licence and provenance obligations, and CLAUDE.md's order is
   foundations first, content last. Discharge D3, homed in `planning/content-wave-work-order.md`.
3. **Calibration ([[D819]], codex)** — a composition change voids calibration and the profile digest
   covers the composition, so a route-carrying profile shows **no strength number** until measured.
   Discharge D4.

**None of these is a scope cut.** Each has a home, an owner and a named unblock; none narrows the
mechanism; and the owner's decision in Open question 1 is presented at full scope rather than
pre-shrunk to fit what is already built.

### §11 — What this RFC refuses, at mechanism level

1. **Filtering or reweighting a returned window as a route mechanism** — D1078 and D1080, §1.3.
   Measured out twice on the same population; no parameter revives it.
2. **Any *human-like*, personality, coherence, plan-quality or enjoyment claim** — C5 unmet, no human
   played or blind-ranked these lines, and the dossier says so in its own limits. `REFUSED_PERSONA_CLAIM`
   (`:173`) applies to every presentation layer in a route-carrying profile unchanged.
3. **Prose asserting a route is sound, correct or strong** — §5.2. A card may name the goal and may
   not endorse it. The refused vocabulary extends to *sound*, *correct*, *best*, *principled* and
   *theoretically approved* in route descriptions.
4. **A route-distance multiplier** — D1080 forbids *"further multiplier or local shortlist filter"* as
   a route mechanism, so `trait.route_preference` is refused **in advance** rather than after a fifth
   experiment. §1.3.
5. **Positional heuristics as a distance function** — §5.2, refused by the type admitting only exact
   occupancy. The dossier's own limit: *"arbitrary position heuristics would recreate ungrounded chess
   judgement in code."*
6. **Unpriced proposals reaching a draw** — §6.2, refused at compile (`guardRequired: true`) and at
   runtime (proposals dropped on guard abstention).
7. **Silent retargeting** — §8.2. A route that becomes unsatisfiable deviates and records it; it does
   not pick a new goal.
8. **Reusing `offWindow` for proposals** — §7.2, because its three shipped consumers read it as
   *exclude from measurement*.
9. **Any learner-derived input** — `bot-policy` §8's wall unchanged, enforced by `LEARNER_INPUT`
   (`:172`, `:197`). A route is chosen by declaration, never by what the learner struggles with;
   that direction is the style lane's and is walled off.

### §12 — Implementation surface

Unit: **production source file**; total: **7**. Criterion 18 counts the same unit.

| # | file | change |
|---|---|---|
| 1 | `apps/server/src/bot-policy-catalog.ts` | `"propose"` effect member; `RouteSourceLayer`; `RouteTarget`/`RouteMeasurement`; `assertLayer` branch (§4.3); proposal-chain authority (§4.4); the proposer stage in `composeBotPolicySelection` (§6.1); guard asymmetry (§6.2); completeness basis (§6.3); resolution discriminator (§6.4); fallback vocabulary (§6.5); `BotPolicyCandidateInput` invariant (§7.4); `BotPolicyDecisionRecord.route` + `considered[].proposedBy` (§7.2–§7.3) |
| 2 | `apps/server/src/route-source.ts` (new) | the distance function over `RouteTarget`, legal-move enumeration, progress/preserve proposal, lifecycle state keyed by `transposeKey` (§5.1, §8) |
| 3 | `apps/server/src/opponent-selector.ts` | route state threading across plies; the castling dialect conversion at the engine boundary (§9.3) |
| 4 | `apps/server/src/capabilities.ts` | one disposition row — route proposal as a declared, guarded candidate source — passing `assertAdvertisedCapabilityDispositions` (`:162`) |
| 5 | `tools/route-gates.mjs` (new) | `make route-gates` (§8.5) |
| 6 | `rfc/bot-policy.md` | §2.3, §3 and §9.5 amendments (§1.4, §3) |
| 7 | `rfc/bot-roster.md` | the out-of-scope row's scope clause and corrected home pointer (§1.4) |

Named validation and docs sites that necessarily move (the [[D828]] discipline — named, not implicit,
and not additional implementation homes): `apps/server/src/bot-policy-catalog.test.ts` (the compiler
fixtures, including the negative ones), `docs/bot-policy.md`, and `Makefile` (the `route-gates`
target). No `packages/` or `schemas/` file changes while 0.18 is unlanded — criterion 14 is what
makes that assertion failable rather than aspirational.

### §13 — Where each finding is specified

The eight findings this draft recorded are routed to the section that fixes them and the criterion
that makes the fix failable, so an implementer can work from the defect rather than from the prose.

| ledger row | finding | specified in | made failable by |
|---|---|---|---|
| [[D1333]] | the shipped `repertoire` layer is a multiplier, so the interface cannot host a conforming instance | §3, §4.1 | criteria 1, 5 |
| [[D1334]] | the shipped composition **throws** on D1084's measured guard-refusal case | §6.5 | criterion 6 (red before, green after) |
| [[D1335]] | `offWindow` is a measurement-exclusion marker and is the wrong proposal home | §7.2 | criterion 13 |
| [[D1336]] | `BotPolicyEffect` has no member meaning *originate candidates* | §4.1 | criterion 1 |
| [[D1337]] | the 43.1% fallthrough figure decomposes to 8.3% pre-completion | §0 | criterion 11 |
| [[D1338]] | the controlled-trait gate would refuse the passing experiment | §4.3 | criterion 3 |
| [[D1339]] | two refusal texts state an opening-identity refusal on book-scoped evidence | §1.4 | criterion 12 |
| [[D1340]] | route source and selector are complementary; neither subsumes | §2 | criteria 14, 15 |

## Deviations from design

**One, and it is a widening rather than a divergence.** `design/00-thesis.md` promises an opponent
*"truly applying an opening/middlegame/endgame"*, and `design/01-training-model.md` frames the
opponent as modelling human choice. A route source **is not** a model of human choice for the 36.6%
of its selections that leave the human window: those moves are chosen because they serve a declared
goal, admitted by a safety bound, and recorded as such. The design's *intent* — an opponent that
truly applies an opening — is served by exactly this, and its *stated mechanism* is widened from
"model human choice" to "model human choice, and propose declared goal moves under an admitting
guard, with provenance on every selection." Recorded here rather than silently, and the owner may
veto the widening on the same authority that would answer Open question 1.

## Acceptance criteria

> **Cross-review 2026-08-23.** [[D1383]] — criteria 6, 15, 17 and 18 cannot fail as written. [[D1379]] — the §7.2 `proposedBy` remedy cannot reach the three `SelectionCandidate` consumers and would take pivotal detection and difficulty measurement to zero on affected selections. [[D1384]] — every measured statistic reproduced exactly; criterion 11's 8.3% uses a denominator of 72 where only 47 plies were active, so the honest rate is 12.8%.

1. **The `propose` effect exists and is the only effect that adds rows.** A fixture asserts that for
   every effect other than `propose`, the row set after the layer is set-equal to the row set before
   it. *Wrong implementation that would pass a weaker check: one where a trait silently inserts a
   row.*
2. **The input invariant is enforced**: exactly one of `rawMass` / `proposedBy` is absent on every
   `BotPolicyCandidateInput`. Both-present and both-absent are must-fail fixtures.
3. **`RouteMeasurement` is enforced and is not the trait gate.** A route layer whose measurement
   carries a `traitDeltaFraction` fails compilation; a route layer with `explorerMatchRetention 0.63`
   **compiles** (because that floor does not apply) while one with `completionRate 0.5` or one
   pre-completion regression **fails**. *This pair is the criterion: the second half proves the gate
   is the right gate rather than a copy of a nearby one.*
4. **A non-occupancy distance function has nowhere to live**: a fixture attempting to declare a
   `RouteTarget` carrying a heuristic term fails to type-check (`.typecheck.ts`), and no runtime
   predicate is the enforcement.
5. **Declared effect and executable form agree for every proposing layer**: a fixture asserts that a
   layer declaring `effect: "propose"` is executed by the proposer stage and never by
   `applyPolicyMultiplier`. *This is §3's defect made unrepeatable.*
6. **The measured throw is gone, demonstrated against the old behaviour.** A fixture reproducing
   D1084's guard-refused case — proposals exist, all are refused, other candidates are admitted —
   **throws `"composed selection produced no move"` before the change and records
   `fallthrough`/`route_guard_refused` after it.** *Red before, green after.*
7. **The proposal chain**: two proposers of different kinds compile and evaluate in declaration
   order with the first admitted proposal owning the move; two `route_source` layers fail; a profile
   declaring `route_source` alongside an unrepaired `repertoire` fails with a message naming
   Discharge D6.
8. **A proposal set equal to the complete legal set fails the selection** with a typed error (§5.3).
9. **Guard asymmetry, failable both ways**: with the guard engine unavailable, the drawn move is
   never a proposed move and the base distribution passes through unmasked; with the guard available
   and admitting, the proposed move is drawable. A profile declaring a proposer with no guard fails
   compilation.
10. **The resolution discriminator is exact**: a fixture reproducing D1084's mix asserts
    `route_mass_preference` on a proposal retaining base mass, `route_deterministic_tiebreak` on one
    without, and **`chosenFinalMass` absent** on the deterministic resolutions.
11. **`make route-gates` recomputes all eight D1084 gate keys from persisted records and reports
    fallthrough decomposed** into pre-completion and post-completion. A fixture with 25
    post-completion and 6 pre-completion fallthroughs reports **8.3%**, not 43.1%.
12. **Both refusal texts are amended**: `bot-policy.md` §9.5 scopes its repertoire clause to the book
    and window-filter mechanisms, and `bot-roster.md`'s out-of-scope row carries the scope clause and
    the corrected home pointer (§9.5/§2.3, not §8). Asserted by `make refusal-index` ([[D1038]]) once
    it lands, and by grep until then.
13. **No route proposal is emitted with `offWindow: true`**, and a recorded route selection is still
    seen by all three off-window consumers (`service.ts:1206`, `pivotal.ts:32`,
    `practical-difficulty.ts:37`). *Fails if `offWindow` is reused as the proposal marker.*
14. **The claims decision stays true at implementation time**: `register-check` C1–C6 green with this
    RFC's claims block reading `none`, **and** an assertion that `BotPolicyDecisionRecord` has no
    importer in `packages/` or representation in `schemas/`. *This criterion fails if run-schema 0.18
    landed first — which is the intended behaviour, forcing renegotiation in the register.*
15. **Completeness composes under both disciplines**: the basis excludes proposed rows under
    `mass_sum`, and under `evidence-move-selector`'s `legal_coverage` the coverage identity is
    computed over base rows with proposals outside the denominator. Asserted for both, so landing
    order is free.
16. **Rewind restores route state for free**: a fixture rewinds to an earlier node and asserts the
    route state matches that node's, because the state is keyed by `transposeKey`.
17. **No route-carrying profile is offered in a variant game without a recorded 960 gate result**
    (Discharge D7). *Fails if §9.2's derived consequence is treated as a measurement.*
18. **The implementation surface counts 7 production source files**, the same unit §12's caption
    states.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Run the multi-game behaviour experiment O8.3 requires, on a population wider than D1084's twelve branches and one target | codex | `planning/bot-route-source/` | |
| D2 | Produce `BotPolicyCandidateInput` in production — the path is test-only at HEAD and production builds `SelectionCandidate` ([[D1251]] W15); route proposals need the same producer `traits` does | codex | `planning/codex-wave-2.md` | |
| D3 | Author the route catalogue with licence and provenance; D1084 hand-coded one configuration | `planning/content-wave-work-order.md` | `planning/content-wave-work-order.md` | |
| D4 | Calibrate every route-carrying profile per [[D819]]; no strength number before its record exists | codex | `planning/bot-route-source/` | |
| D5 | Middlegame and endgame route targets — exact occupancy is an opening-shaped goal and does not extend by analogy | claude | `planning/rfc-drafting-queue.md` | |
| D6 | Repair `repertoire` from `effect: "prior"` to a conforming proposer, or withdraw the kind (§3, §4.4) | claude | `rfc/bot-policy.md` | |
| D7 | Run the D1084 gates on a Chess960 population before any route-carrying profile is offered in a variant game (§9.2) | codex | `planning/bot-route-source/` | |
| D8 | Route the castling dialect conversion from the disposable harness to the production engine boundary (§9.3) | codex | `rfc/variants.md` | |

## Open questions

1. **Does O8.3 gate a generated route source, and if so on what demonstration?** — **acceptance-blocking,
   and OWNER's.** O8.3 requires *"a real immutable book reaches declared coverage and a multi-game
   experiment demonstrates the behavior"* before any repertoire persona ships. Its first clause has no
   referent for a route source — there is no book, so nothing can reach coverage — and its second
   clause is unmet by a twelve-branch mechanism witness. The ruling predates the mechanism, so this is
   a genuine gap in it rather than an ambiguity I should resolve by reading. *Recommendation: keep
   O8.3's second clause binding and read the first as inapplicable — that is, a route-carrying profile
   registers once Discharge D1's multi-game experiment passes, with no book-coverage precondition.*
   Not answered here; §10 holds the gate closed either way, so this RFC is implementable while the
   question is open and only profile registration waits on it.
2. **Should a route be visible to the learner before or only after the game?** A declared goal that
   the learner can read on the profile card before playing is honest disclosure and is also a
   spoiler — the opponent announces its plan. `bot-policy` §2.8 lets presentation state controlled
   traits, and a route is a stronger disclosure than a trait because it predicts specific moves.
   *Recommendation: name the route on the card (*"aims for a kingside fianchetto"*) and reveal the
   per-move route state only in Review, where the record already lives.* Not blocking; routed to
   `rfc/review-map.md`'s surface if the recommendation is taken.

## Ledger rows

*(Proposed — ids assigned at landing; head was **D1332** at drafting.)*

- **🐞** — **The shipped `repertoire` layer is a multiplier, so `bot-policy` §2.3's "interface only in
  v1" understates the state: the interface as compiled cannot host a conforming instance.**
  `bot-policy-catalog.ts:491` applies `applyPolicyMultiplier`, which maps over existing rows (`:354`);
  a move the base never emitted has no row, a move truncated by top-p has `finalMass` 0 (`:345`), and
  a row injected at `rawMass: 0` is dropped by `normalize` (`:306`). [[D1162]]'s law at the exact
  line. **Measured size: 15 of 41 D1084 route selections (36.6%) are moves absent from the retained
  base window** — every one unplayable under the shipped composition.
- **🐞** — **On D1084's measured guard-refusal case the shipped composition throws rather than falls
  back.** With proposals zeroed by the repertoire multiplier and the guard admitting other candidates,
  `admitted.size > 0` (`:502`) so the guard applies rather than abstaining, the mask zeroes the last
  positive row (`:507`), `normalize` returns `[]` (`:308`) and `:520` throws
  `"composed selection produced no move"`. D1084 measured this situation **6 times in 72 controlled
  plies** and handled it by recording a fallback reason.
- **🐞** — **`offWindow` is a measurement-exclusion marker and would silently delete route moves from
  two measurement surfaces.** Emitted only at `opponent-selector.ts:633` for a provider artifact, and
  filtered out by three consumers (`service.ts:1206`, `pivotal.ts:32`, `practical-difficulty.ts:37`).
  Marking proposals with it would drop 36.6% of route moves from pivotal detection and
  practical-difficulty measurement. A distinct `proposedBy` is required.
- **📊** — **`BotPolicyEffect` has no member meaning *originate candidates*** (`:20`), the exact
  structural mirror of `evidence-move-selector`'s finding that `BotPolicyInput` (`:16-19`) **already
  admitted** an evidence base. Two RFCs against one module, opposite findings: there the union was
  open and the field contract blocked; here the union is closed and the widening is real.
- **📊** — **D1084's route arm shows 43.1% fallthrough against R11's 25% exercise ceiling, and the
  figure decomposes into 25 post-completion and 6 pre-completion.** Pre-completion fallthrough is
  **8.3%**, which clears the ceiling; post-completion fallthrough is not what the ceiling measured.
  An undecomposed figure would read as failing the gate that refused the books.
- **📊** — **The controlled-trait gate must not be reused for a proposer, and one of its clauses would
  refuse the passing experiment.** `explorerMatchRetention ≥ 0.9` (`:231`) measures how often the
  bot's move stays inside the human window, and a route source leaves it deliberately **36.6%** of the
  time. `traitDeltaFraction` has no referent for a completion rate. The two safety clauses transfer
  and D1084 satisfies both (+19.10 cp, 0.0% severe).
- **📊** — **`bot-policy` §9.5 and `bot-roster`'s out-of-scope row state an opening-identity refusal on
  book-scoped evidence** ([[D1320]]'s defect shape), and `bot-roster` additionally cites the wrong
  home: `bot-policy` §8 is the mode seam and dispositions table, while the repertoire refusal lives in
  §9.5 and §2.3. Both amended by this RFC.
- **📊** — **The route source and `evidence-move-selector` are complementary, and their evidence status
  is asymmetric.** Different slots (proposer vs base), contradictory coverage obligations (must be
  selective vs must be exactly 1.0), and they compose. The route source composes over the shipped Maia
  base and has no unfunded dependency; the selector's base head was returned by [[D1297]] unguarded and
  [[D1312]] guarded, with [[D1328]] finding the next step is data readiness rather than a third fit.
  **The route source is the only bot-personality mechanism in this repository that passed its
  preregistered gates and has no unfunded dependency.**

## Changelog

- 2026-08-23 — drafted on [[D1084]]'s passing experiment, routed by [[D1330]] as live-debt rank 3
  (*"passed all eight of its gates and appears in no RFC"*). Discharges [[D1320]]'s obligation
  explicitly in §1: four prior refusals do not bind, D1080 binds one clause, O8.3 binds fully and is
  the owner's. Subsumption against `evidence-move-selector.md` determined in §2 — complementary,
  neither subsumes, with a mechanical test rather than an editorial judgement. Seven verified findings
  recorded in the ledger rows above, three of them defects in the layer this RFC extends.
