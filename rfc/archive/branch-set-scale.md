# RFC: Branch-set scale — collapse by decidedness, fold by hand, and a bounded eval budget

- **Status:** implemented
- **Author:** claude
- **Created:** 2026-08-15
- **Design refs:** `design/05-in-run-experience.md` §1 invariants — **"An attempt is never
  destroyed"** (`:38`), **"Nothing here invents chess truth"** (`:40`), **"Absence is stated,
  never simulated"** (`:41`) — and §2 region 3, the branch rail (`:55-56`);
  `design/02-product-shape.md` §UX commitments latency budgets (`:159-163`);
  `design/03-product-breadth.md` `:24-25` (*"optimization such as scoring/ranking branches comes
  after every branch and comparison path is available manually and correctly"*), `:65-66`
  (*"Manual branch inclusion must work first"*), `:426-429` (the after-breadth list that already
  names "branch usefulness scores" and "branch grouping, cleanup, thumbnails, animation, and
  density"). `design/BACKLOG.md` row **"Branch-set scale: pruning, collapse and eval budget
  (RULED)"** — cited by title, not by line, because the ledger's line numbers move.
- **Exploration gate:** owner ruling 2026-08-12 opened the RFC tier (`rfc/README.md`
  §Exploration gate). The specific opener is the **owner ruling of 2026-08-15** recorded in the
  ledger row above: *"if you make 9 branches it becomes cumbersome. They can quickly overwhelm.
  If 4 are completely lost that is obvious pruning so it can be hidden from main views but if you
  expand or w/e ez prune… it's more pruning mostly… but we need to gracefully deal with large
  branch sets, cause we don't want to overload the entire machine with 99 branches of eval AND
  the user ux."* The evidence base for the honesty argument is
  `design/research/practical-difficulty-outside-tablebase.md` (R4, 2026-08-15).
- **Depends on:** `rfc/archive/branch-runtime.md` (the run tree, `branchPath`, the event
  vocabulary), `rfc/archive/branch-groups.md` (the local-preference precedent and the shipped
  "no group ranking, scoring, pruning" limit), the shipped N-way comparison
  (`docs/n-way-comparison.md`), `rfc/archive/outcome-drill-grading.md`
  (`objective.grading`, `OBJECTIVE_ASSESSMENT_SETS`, `assessmentAdmissionCode`),
  `rfc/archive/grounding-pair.md` (the tablebase provider seam `apps/server/src/tablebase.ts`,
  `LichessTablebaseSource`, `assessmentGrounding`), `rfc/archive/authoring-frictions.md`
  (the five determinate assessment categories, and `learnerCategory` / `CATEGORY_RANK` in
  `apps/server/src/sourcing/tablebase-category.ts` — §2b and §3a are built on both).
- **Parent / amends:** amends `apps/web/src/lib/BranchRail.svelte`,
  `apps/web/src/lib/DrillScreen.svelte`, `apps/web/src/lib/screen-model.ts`,
  `packages/runtime/src/branch-path.ts`, and — for the single-constant fix in §3d —
  `packages/runtime/src/compare.ts` and `apps/server/src/service.ts` (behaviour-preserving
  refactor only, no payload change); adds one runtime module
  (`packages/runtime/src/branch-scale.ts`) and one read-only REST route. Introduces no new
  subsystem, no new file under `schemas/`, and no new event.
- **Supersedes / superseded by:** —
- **Planning:** `planning/branch-set-scale/` (once implementing)


> **COORDINATOR RULING, claude 2026-08-15 — §3a-bis's use of `CATEGORY_RANK` is NOT ranking,
> and the reviewer was right to flag it for a decision rather than assume.** The test is whether
> two branches are ever compared to each other. They are not: each branch's leaf category is
> checked against **its own objective's declaration**, a unary check per branch. Precedent in
> shipped code: `verify-draft.ts:144` already uses `CATEGORY_RANK` to compare one position's
> category *before vs after a move* — the same shape, checking a claim against a target rather
> than ordering candidates. The `n-way-comparison` refusal (never ranks branches, never names a
> winner) is untouched.

## Summary

Nine branches overwhelm the rail and ninety-nine would overwhelm the machine. This RFC makes a
large branch set usable without ever telling the learner which branch was better. It ships three
things: **collapse**, which removes from the main view only branches whose outcome is *settled*;
**a stated eval budget**, which fixes what is computed eagerly, lazily and never, and shows that
branch count contributes zero automatic engine work; and **manual fold**, a pure view operation
that cannot erase an attempt.

The doctrine refusal is untouched. `docs/n-way-comparison.md:11-13` says the comparison payload
*"never ranks branches, computes an eval delta, or recommends a winner"*, and this RFC adds no
field to `BranchComparison` at all (§2d). What replaces ranking is **decidedness**, and the
substitution is exact rather than convenient: R4 measured that outcome class is perfect where a
position is decided — Stockfish's position class equals the tablebase category on **171/171**
in-range positions (`practical-difficulty-outside-tablebase.md:307-309`) — and meaningless where
it is not, with a median |eval| of **43 cp** and only **10.2%** of out-of-range positions decided
at depth 12 (`:339`), the concession set failing to converge across any depth pair on the ladder
(`:365-379`). So a **decided** branch may be collapsed, because collapsing states a settled fact;
an **undecided** branch may never be auto-collapsed, because nothing can honestly say it is worse.

## Motivation

**The problem is real and it is two problems wearing one name.**

*The UX half.* The branch rail renders every branch, unfiltered and unbounded
(`apps/web/src/lib/BranchRail.svelte:23-53`). Nothing hides, nothing folds, nothing summarises.
The compare surface already accepts a readability cap of eight
(`apps/server/src/service.ts:964-968`; `docs/n-way-comparison.md:19-20`), but the rail that feeds
it has no analogous notion, and the one affordance that bridges them silently discards
candidates: `compareAllHere` takes `.slice(0, 8)` of the eligible set with no statement
(`apps/web/src/lib/DrillScreen.svelte:433-435`).

*The machine half.* The owner's fear is "99 branches of eval". The shipped system's actual eval
bill is examined in §4; the short version is that it is linear in **plies committed**, not in
branches, and it is already paid at commit time. The danger is not the current code — it is the
obvious-looking design this RFC could have specified, in which each branch is evaluated so the
set can be ordered. That design costs a median **77 ms** and p95 **172 ms** per out-of-range leaf
at depth 8 (`practical-difficulty-outside-tablebase.md:182`) on the same shared Stockfish the
opponent's `<500 ms` shallow-feedback budget uses (`design/02-product-shape.md:159-163`), and it
is refused here on honesty first and cost second.

**Explicitly out of scope.**

- **Ranking, scoring, ordering or recommending branches.** Not deferred — refused, and the
  refusal is argued in §2d rather than asserted. `design/03-product-breadth.md:24-25` and
  `:426-429` already place branch usefulness scores after breadth; nothing here brings them
  forward.
- **Any new engine mode, classifier or depth constant.** In particular the engine-gated
  decidedness classifier R4 §9 option 2 sketches: it is out of range by construction and this RFC
  declines it (§2c).
- **Deleting a branch, a node or an event.** There is no such operation and this RFC does not
  invent one (§5b).
- **Automatic compare inclusion / default selection.** Manual checkboxes stay exactly as shipped
  (`BranchRail.svelte:43-50`), per `design/03-product-breadth.md:65-66`.
- **Changing the eight-column comparison cap.** §3d reconciles with it; it does not move it.

## Specification

### 0. Register claim: **nothing versioned**, and that is the point

This RFC claims **no pack-schema version, no run-schema version, and no storage migration.**
It reads whatever the register holds and moves nothing.

**Rebased 2026-08-15 (cross-review).** The draft was written against pack **0.16** / run
**0.13**. Both moved the same day: `rfc/archive/tempo-vocabulary.md` landed pack **0.17**
(`ed48978`) and `rfc/archive/resistance-spectrum.md` landed run **0.14** with migration **19**
(`4977ff6`). `packages/schema/src/index.ts:1-2` now reads `DRILL_RUN_SCHEMA_VERSION = "0.14"`
and `DRILL_PACK_SCHEMA_VERSION = "0.17"`, and **those are the values this RFC must leave
standing.** The pack lanes still in flight — **0.18** (`predicate-wave-3`), **0.20**
(`opening-evidence-path`), **0.21** (`deviation-classes`) — are sibling claims and remain
untouched; **0.19** stays declined. `rfc/README.md`'s register row for this draft still records
the pre-rebase numbers ("pack stays 0.16, run 0.13"); correcting it is out of this review's edit
boundary and is a required follow-up before this RFC is accepted.

It can claim no version because it adds nothing durable — the argument below is unchanged by the
rebase, which is the point of making it a claim about *what is added* rather than about a number.

- **No new event.** The event union is unchanged — sixteen members, `packages/runtime/src/types.ts`
  `DrillRunEvent`. Collapse and fold are derived or client-local; neither is recorded.
- **No pack-format field.** The objective and its admissible categories are already declared and
  already validated (`apps/server/src/tablebase.ts:8-13`;
  `apps/server/src/pack-validation.ts:116-135`).
- **No change to `BranchComparison`.** §2d requires this.
- **No storage shape.** Fold is a versioned browser preference, following the shipped precedent
  exactly — `tabiya:branch-group:v1:{groupId}` is written at `DrillScreen.svelte:341` and read at
  `:615`, and `docs/branch-groups.md:120` gives it its status: *"lockstep preference is local
  browser state, not shared run truth"*. §5a takes the same shape and the same status.

The one new REST route (§4c) is a read: `POST /runs/:id/compare` is already a writer-free POST
read (`apps/server/src/rest.ts`, `route.action === "compare"`), and adding a second one moves no
`$id` and no digest. The route parser is `{ runId, action }` over a single path segment
(`rest.ts:542-548`); `branch-decidedness` collides with none of the 32 shipped actions and
hyphenated actions are already in use (`group-reply`, `simulate-enter`, `reasoning-review`)
`[V]`.

### 1. Reuse audit — what already does part of this

Checked before designing, as instructed. Findings, each verified:

All paths are given in full, because three of these basenames are ambiguous in this repo.

| Thing | Where | What it already gives us |
|---|---|---|
| Eight-branch cap + typed refusal | `apps/server/src/service.ts:964-968` **only** | the bound and the error shape §3d reconciles with |
| Manual compare selection | `apps/web/src/lib/DrillScreen.svelte:124,425-431`; `apps/web/src/lib/BranchRail.svelte:43-50` | the selection state fold must never disturb |
| `compare-all-here` | `DrillScreen.svelte:433-435`; `BranchRail.svelte:54-56` | the affordance that needs the stated-truncation fix (§3d) |
| Per-branch leaf facts | `apps/web/src/lib/screen-model.ts:31-41,139-158` | `objectiveState` and `terminal` per branch — **two of the three free collapse grounds already exist and are already rendered** (`BranchRail.svelte:37-39`) |
| Objective admissibility | `apps/server/src/tablebase.ts:7-13`; `apps/server/src/pack-validation.ts:116-135` | `assessmentAdmissionCode(objective, category)` — reused verbatim, but as a *necessary* condition only; §3a states why it is not sufficient |
| Learner-perspective category + result order | `apps/server/src/sourcing/tablebase-category.ts` — `learnerCategory(sideToMove, category, learner)` and `CATEGORY_RANK` | the two facts §3a's shortfall rule is built from. Both shipped by `rfc/archive/authoring-frictions.md`; neither is invented here |
| Semantic zoom over a branch set | `docs/branch-groups.md:88-97`; `apps/web/src/lib/GroupPanel.svelte` | the overview/summary/boards band pattern the collapsed section reuses |
| Stated refusal in the UI | `apps/web/src/lib/HonestControl.svelte` | the reason-carrying pattern — **but see §3d: it renders its reason only when `disabled`** |
| Grounded rules sentences | `packages/runtime/src/evidence-sentences.ts:23-48` (`checkmate`, `result-loss`, `result-draw`, `result-win`) | the collapse explanation's vocabulary — no new sentence source |
| Disclosure predicates | `packages/runtime/src/feedback.ts:3-20` (`feedbackDisclosed`) | the gate the tablebase ground must sit behind |
| Tablebase provider + bounded queue | `apps/server/src/tablebase.ts` (`LichessTablebaseSource`); `apps/server/src/capabilities.ts:50` | one in-flight probe, queue depth 4, 512-entry positive LRU with no TTL, typed `TABLEBASE_UNAVAILABLE`. **Negative results are also cached, for 60 s** — §4d depends on this |

**Correction from cross-review.** An earlier draft cited `packages/runtime/src/compare.ts:221-222`
as a second site of the eight-branch cap. It is not: those two lines are `compareBranches`'
minimum-of-two and distinctness `TypeError`s, and **`compare.ts` contains no eight-branch bound at
all** `[V]`. The cap exists exactly once, as a bare literal, at `service.ts:964`. §3d is rewritten
around that fact.

**Nothing in the repo collapses, folds, hides or prunes a branch today.** Re-run at cross-review:
`grep -rni "collaps\|prune\|fold\|hidden"` over `apps/web/src/lib` and `packages/runtime/src`
returns only CSS `overflow: hidden` and `aria-hidden`, the unrelated `option_collapse` pivotal
marker (`packages/runtime/src/pivotal.ts:9,16`), `apps/web/src/lib/run-state.ts:66-73`'s rewind
bookkeeping over job-pending node ids, and the word "threefold" in the rules sentence table
(`packages/runtime/src/evidence-sentences.ts`) `[V]`.
`docs/branch-groups.md:119` states the current position plainly: *"there is no group ranking,
scoring, pruning."*

### 2. The honesty key: decidedness does the work ranking was asked to do

#### 2a. The argument

The owner asked for pruning and observed that four *completely lost* branches are obvious
pruning. "Completely lost" is not a comparative — it is a claim that the branch's outcome is
**settled**. That is the whole opening.

R4 measured exactly this property and found it bimodal. Where a position is decided, outcome
class is exact: at |100| cp, Stockfish's class for the position equals the tablebase category on
**171 of 171** in-range positions at depths 8, 12 and 16, and the move-level classifier reaches
κ = 1.000 with zero false positives and zero false negatives
(`practical-difficulty-outside-tablebase.md:291-309`). Where it is not decided, the same
computation degenerates: **88.3%** of in-range positions exceed 100 cp against **10.2%** of
out-of-range ones, median |eval| **43 cp** against **501 cp**
(`:332-345`), and the classification stops being stable — in range the concession set converges
monotonically to 1.000 across depth, out of range no depth pair on the whole ladder exceeds
**0.538** (`:365-379`).

R4's own one-sentence verdict names the line: *"the seven-piece line is a proxy for the real
line, which is decidedness"* (`:64-69`).

#### 2b. Admissible decidedness grounds

A branch's decidedness is a **unary** fact about that branch's leaf, sourced only from
instruments that are exact for the case they are applied to. Exactly three grounds are
admissible, ordered by the assistance ladder in `design/05-in-run-experience.md:69-77`:

| Ground | Rung | Source | Cost | Availability |
|---|---|---|---|---|
| `terminal_outcome` | 0 (rules) | the branch leaf's `outcome.reached` event | free, already in the run | always; discloses under every policy (`docs/branch-runtime.md:206-207`, the v0.6 amendment: *"makes it a feedback reveal under every policy"*) |
| `objective_terminal` | 0/5 (rules + author) | leaf `objectiveState ∈ {achieved, failed, transitioned}` | free, already projected (`apps/web/src/lib/screen-model.ts:152-153`) | always |
| `tablebase` | 1 | Syzygy category of the leaf FEN at ≤7 pieces | one cached HTTP probe | only when `providers.tablebase !== "none"` (`apps/server/src/capabilities.ts:50`) **and** `feedbackDisclosed(run)` |

Everything else is `undecided` or `unknown`, and both are inert (§2c).

Three constraints on the third ground, all non-negotiable:

0. **Every category is converted to the learner's perspective before anything else touches it.**
   A Syzygy probe returns the category **for the side to move at that FEN**, which on a leaf is
   the learner roughly half the time and the opponent the other half. Un-converted, collapse
   would fold winning branches as losses at close to a coin flip. The conversion is shipped and
   must be reused verbatim:
   `learnerCategory(sideToMoveAt(leaf.fen), probe.category, run.start.side)`
   (`apps/server/src/sourcing/tablebase-category.ts`), the same helper and the same direction the
   pack validator already uses via `invertTablebaseCategory`
   (`apps/server/src/pack-validation.ts:364-365`). `run.start.side` is the learner's colour
   (`packages/runtime/src/types.ts` `RunStart`). **Every `TablebaseCategory` named anywhere in
   §3 is post-conversion.** This was missing from the first draft and is the single most
   likely way to ship a confidently wrong fold.

1. **It is assistance and it follows disclosure.** A tablebase reading of a non-terminal leaf is
   rung-1 evidence. Probing it before disclosure and rendering it would defeat ADR-0006 exactly
   as an eval bar does. The gate is the shipped `feedbackDisclosed` (`packages/runtime/src/feedback.ts:3-20`), which
   the compare payload already uses (`apps/server/src/service.ts:972-974`).
2. **Uncertain categories are not decidedness.** The lattice has ten values
   (`apps/server/src/tablebase.ts:5`) and only five are determinate:
   `ASSESSMENT_CATEGORIES = ["win", "loss", "draw", "cursed-win", "blessed-loss"]` (`:7`).
   `maybe-win`, `maybe-loss`, `syzygy-win`, `syzygy-loss` and `unknown` classify as `undecided`,
   never as a collapse ground. **Ordering matters here and is normative:** this test runs
   *before* the admissibility test, because `assessmentAdmissionCode` returns
   `ASSESSMENT_CATEGORY_INDETERMINATE` — a non-`undefined` code, i.e. "not admitted" — for
   exactly those five values `[V]`. An implementer who applies §3a's predicate without this gate
   would collapse every branch the tablebase could not resolve, which is the precise inversion of
   §2c.

#### 2c. The refusal: an undecided branch is never auto-collapsed

**No engine evaluation, at any depth, with any threshold, ever collapses a branch.** Not as a
default, not as an option, not behind a setting.

The reason is R4 §6, not taste. Outside the tablebase range there is no instrument that says
whether a position is decided, so the classifier cannot even abstain honestly
(`practical-difficulty-outside-tablebase.md:356-359`); at the threshold that scores κ = 1.000 in
range, **89.8%** of out-of-range positions classify as *draw* and the rule degenerates into a
magnitude filter flagging **50.8%** of all legal moves (`:348-352`). Collapsing on that number
would be a tuned constant presented as a measurement — the shape `resistance-spectrum` §2f
already refuses (`practical-difficulty-outside-tablebase.md:381-386`, quoting `rfc/archive/resistance-spectrum.md` §2f) and the shape AGENTS.md law 8 forbids.

Consequences, stated so no implementer has to infer them:

- An undecided branch is always visible in the main view unless the learner folds it by hand.
- A branch whose decidedness has not resolved is **not** collapsed while pending (§4d).
- A run with no pack, no terminal outcome and no tablebase-range leaf collapses **nothing**, and
  the rail says so rather than showing an empty collapsed section.

#### 2d. Why this is pruning and not ranking

The distinction is structural, and it survives inspection rather than assertion:

- **Ranking is a binary relation.** To say A ranks above B you must evaluate A *against* B. R4
  §6.1–§6.2 says no admissible instrument supplies that relation for undecided positions, which
  is most positions.
- **Collapse is a unary predicate.** Each branch is classified in isolation, from its own leaf,
  by an instrument exact for that leaf. Two collapsed branches carry **no order** between them.
  A collapsed and an expanded branch carry no order between them either — only different unary
  facts.
- **The payload is untouched.** `BranchComparison` (`packages/runtime/src/compare.ts:98-107`) gains no field. The
  decidedness projection is a separate function, and the compare endpoint neither computes nor
  returns it. `docs/n-way-comparison.md:11-13` therefore stays literally true, word for word.
- **The explanation never mentions another branch.** Enforced by type, not by review (§3b).

**The structural argument is not enough on its own, so here is the rendering argument.** A
unary predicate can still leak an order once it is drawn on a screen, and a structural argument
that leaks in the rendering is not sound. Three leak vectors were checked at cross-review:

1. *Can a learner reconstruct an ordering from the partition?* They can reconstruct the
   **predicate** — "this branch's outcome is settled and fell short of the objective; that one is
   not settled" — because the explanation states it outright. They cannot reconstruct an order,
   because the predicate is not one: two collapsed branches are indistinguishable, and an
   expanded branch is not claimed to be better than a collapsed one, only *unsettled*.
2. *Does collapse put information on the rail that was not already there?* Almost none. The rail
   already renders `objectiveState` and a terminal flag for every branch
   (`BranchRail.svelte:37-39`), which is the whole of the `objective_terminal` ground. The
   `terminal_outcome` ground adds the recorded `win|loss|draw`, and that event *"is a feedback
   reveal under every policy"* (`docs/branch-runtime.md:206-207`), so it was already disclosable
   at that moment. Only the `tablebase` ground is genuinely new information on the rail, and it
   is the one ground that is rung-1, disclosure-gated and learner-initiated (§2b, §4b).
   **Collapse is mostly a re-layout of facts already on screen.**
3. *Does the section title, the grouping or the count leak a verdict?* The banned lexicon in §3b
   covers the title and every string in the component; the counts are aggregates over an
   unordered set; and the collapsed section is rendered as one disclosure, not as a league table
   (§6). The one ordering that exists anywhere in this RFC is §3d's candidate order for
   `compare-all-here`, which is discussed and bounded there.

**Decidedness is necessary for collapse; it is not sufficient.** The sufficiency condition —
"decided *against this run's objective*" (§3a) — is a housekeeping choice about which settled
branches leave the main view, and it makes no chess claim of any kind: it reads an authored
objective declaration and an exact category through a shipped admissibility function. An
`achieved` branch is equally decided and is never auto-collapsed, because the learner keeps
those. Stating this openly is the point: the honesty constraint and the housekeeping choice are
different things and must not be confused for one another.

### 3. Collapse

#### 3a. The predicate

New module `packages/runtime/src/branch-scale.ts`:

```ts
export type DecidednessGround =
  | { readonly kind: "terminal_outcome"; readonly outcome: RunOutcome; readonly nodeId: string }
  | { readonly kind: "objective_terminal"; readonly state: "achieved" | "failed" | "transitioned";
      readonly nodeId: string; readonly evidenceRefs: readonly string[] }
  | { readonly kind: "tablebase"; readonly category: TablebaseCategory; readonly pieces: number;
      readonly nodeId: string; readonly sourceId: string };

export type Decidedness =
  | { readonly state: "decided"; readonly ground: DecidednessGround;
      readonly admitted: boolean;      // assessmentAdmissionCode(...) === undefined
      readonly shortfall: boolean }    // §3a-bis; the ONLY field the collapse set reads
  | { readonly state: "undecided"; readonly reason: "no_terminal_fact" | "uncertain_category" }
  | { readonly state: "unknown"; readonly reason: "out_of_range" | "not_probed" | "provider_unavailable" | "withheld" };

export function branchDecidedness(
  run: DrillRun,
  options?: { readonly objective?: "win" | "hold" | "save" | "resist";
              readonly tablebase?: Readonly<Record<string, TablebaseCategory>> },
): Readonly<Record<string, Decidedness>>;
```

`shortfall` is carried alongside `admitted` rather than replacing it because they answer
different questions and the difference is the subject of §3a-bis: `admitted` says *"the pack
validator would accept this category for this objective"*, `shortfall` says *"this leaf fell
short of it"*. `shortfall ⟹ ¬admitted`, never the converse. **The collapse set reads
`shortfall` and nothing else**; `admitted` is retained only because the §3b explanation sentence
names the admissible list.

Every `TablebaseCategory` in `options.tablebase` is already learner-perspective (§2b constraint
0); the module does not convert, because it has no board and must not parse one. Conversion is
the caller's job and §4c is the caller.

`admitted` is computed by the shipped
`assessmentAdmissionCode(objective, category)` (`apps/server/src/pack-validation.ts:116-135`):
`admitted = assessmentAdmissionCode(objective, category) === undefined`. Outcomes map to
categories the same way the pack validator already treats them — `win → "win"`, `draw → "draw"`,
`loss → "loss"`, already from the learner's perspective, which is the perspective
`outcome.reached` carries (`docs/branch-runtime.md:112-115`: *"its closed result is `win`, `loss`,
or `draw` from `start.side`, the learner's perspective"*). For `objective_terminal`,
`achieved`/`transitioned` are `admitted: true` and `failed` is `admitted: false`.

#### 3a-bis. `¬admitted` is the wrong predicate on its own — the shortfall rule

**Found at cross-review; this is a correctness fix, not a refinement.** `¬admitted` is symmetric:
it is true both when a branch fell *short* of the objective and when it *beat* it. Reading the
shipped `OBJECTIVE_ASSESSMENT_SETS` (`apps/server/src/tablebase.ts:8-13`) `[V]`:

| Objective | Admits | `¬admitted` also contains | Naive rule would fold |
|---|---|---|---|
| `win` | `win` | `draw`, `loss`, `blessed-loss`, `cursed-win` | nothing wrong: all four fall short |
| `hold` | `draw`, `cursed-win`, `blessed-loss` | `loss`, **`win`** | **a branch the learner won** |
| `save` | `loss`, `blessed-loss` | **`win`**, **`draw`**, **`cursed-win`** | **every branch that did better than surviving** |
| `resist` | `loss`, `blessed-loss` | **`win`**, **`draw`**, **`cursed-win`** | same |

The `save`/`resist` guard the draft was proud of — those objectives *admit* a tablebase loss, so
a naive "loss = bad" rule cannot hide the branches they teach — **holds and is verified** `[V]`.
But the symmetric hole is worse: under `save`/`resist` the naive rule folds every branch where
the learner *escaped*, and under `hold` it folds the branch where they won, each with a
grammatically correct §3b sentence explaining why. That is a confidently wrong claim, which
`design/05-in-run-experience.md:41` costs more than a visible gap.

It is also not what was ruled. `design/BACKLOG.md` row **"Branch-set scale: pruning, collapse and
eval budget (RULED)"** says *"collapse **decided-lost** branches"*, and the owner's words were
*"if 4 are completely **lost**"*. Over-achievement was never in scope.

**Normative rule.** Auto-collapse requires **shortfall**, defined against the authored objective's
own admissible set using the shipped result order `CATEGORY_RANK`
(`apps/server/src/sourcing/tablebase-category.ts`):

```
shortfall(objective, category) =
  CATEGORY_RANK[category] < min{ CATEGORY_RANK[c] : c ∈ OBJECTIVE_ASSESSMENT_SETS[objective] }
```

Enumerated, so no implementer has to evaluate it at runtime to know what it does:

| Objective | Auto-collapse categories | Never auto-collapsed |
|---|---|---|
| `win` | `loss`, `blessed-loss`, `draw`, `cursed-win` | `win` |
| `hold` | `loss` | `blessed-loss`, `draw`, `cursed-win`, `win` |
| `save` | — **nothing** | all five |
| `resist` | — **nothing** | all five |

**Under `save` and `resist` the tablebase ground collapses nothing, ever.** That is the correct
answer and it should read as a feature: those objectives declare that losing is an admissible
ending, so no leaf outcome is a settled shortfall against them.

**This does not reintroduce ranking.** `CATEGORY_RANK` orders the ten *rules-level outcome
categories* — it is the same win/draw/loss vocabulary the rules already own, shipped by
`rfc/archive/authoring-frictions.md` and already used by the opponent selector. The comparison it
performs is **branch leaf ↔ authored objective declaration**. No branch is ever compared to
another branch, `renderCollapseExplanation` still receives exactly one branch id (§3b), and
`BranchComparison` is still untouched. The relation stays unary in the only sense §2d claims:
between a branch and a fixed authored predicate, never between two branches.

For `objective_terminal`, shortfall is simply `state === "failed"`; `achieved` and `transitioned`
are never collapsed, as before.

**Objective resolution, and the unauthored default.** A pack run supplies its objective type. A
position, Just Play or imported run has none. Rather than invent one, the unauthored default is
stated: **`shortfall` is true only for a recorded learner-perspective `loss`** — never for a
draw, never for a win, and never on the tablebase ground at all (an unauthored run has no
objective for a category to fall short of). This follows the
principle the owner already drew on 2026-08-15 for tempo grading — *authored contexts declare;
unauthored contexts need a stated default* (`rfc/archive/tempo-vocabulary.md`, owner ruling block — implemented as `ed48978`). The
default is rendered to the learner as part of the collapse explanation, never applied silently.

**The collapse set.**

```
collapsed(run) = { b ∈ run.branches :
      decidedness[b].state === "decided"
  ∧   decidedness[b].shortfall === true                     // §3a-bis, NOT ¬admitted
  ∧   b ≠ run.activeCursor.branchId
  ∧   b ∉ compareIds                                        // DrillScreen.svelte:124
  ∧   b ∉ pinnedExpanded
  ∧   |run.branches| > BRANCH_COLLAPSE_FLOOR }
```

`BRANCH_COLLAPSE_FLOOR = 8`, sourced from one exported constant shared with the comparison bound
(§3d). Below the floor nothing collapses: the owner's threshold is nine (*"if you make 9 branches
it becomes cumbersome"*) and eight is the number the product already calls "as many as a person
reads at once".

`compareIds` is the shipped name of the selection state (`DrillScreen.svelte:124`); the draft
called it `compareSelection`. There is one set, not two.

**`pinnedExpanded`, declared.** The draft used it in three places without saying what it is.
Normatively: `pinnedExpanded: Set<string>`, **client-local, in-memory, per mounted run, and
deliberately NOT persisted.** It is not a preference — it is a within-session record of "the
learner already asked to see this", and it dies with the tab exactly as the collapse state does.
It takes no storage key, which is why §0's "no storage shape" survives; only `foldedBranchIds`
(§5a) persists. A reload re-derives collapse from the run and re-collapses a previously pinned
branch — acceptable, because collapse is reversible in one click and nothing was lost.

Collapse is applied only at a rail projection boundary — a run mutation or an explicit refresh —
and never to a branch whose row currently holds focus. Rows must not move under the cursor.

#### 3b. The explanation, and the words it may not use

Every collapsed branch carries one sentence. Its shape is **one clause of settled fact, one
clause of source** — the same two-part shape the shipped strips use
(`packages/runtime/src/compare-strips.ts`) and the same grounding contract as
`docs/explanation-grounds.md`.

```ts
export interface CollapseExplanation {
  readonly branchId: string;          // the ONLY branch id in scope
  readonly text: string;
  readonly sourceLabel: "Rules" | "Pack" | "Tablebase";
}
export function renderCollapseExplanation(
  branchId: string, decidedness: Decidedness, plyOffset: number,
): CollapseExplanation;
```

**The renderer's input type contains no branch set, no other branch's id, label, state or score,
and no comparison.** This is the same structural discipline the shipped compare voice already
uses — it *"never receives learner branch labels or intent text"*
(`docs/n-way-comparison.md:25-27`) — and it makes a comparative sentence unconstructible rather
than merely discouraged.

Every template states a **shortfall** against the objective, never a bare mismatch — §3a-bis
guarantees no over-achieving branch ever reaches this renderer, and `{category}` is always
post-conversion to the learner's perspective (§2b constraint 0). Templates (the rules clauses
reuse `packages/runtime/src/evidence-sentences.ts:23-48` verbatim — `"The learner lost the
game."`, `"The game ended in a draw."`, `"The position is checkmate."`):

| Ground | Sentence |
|---|---|
| `terminal_outcome`, loss | `The learner lost the game. This attempt ended at +{n}. Source: recorded outcome event.` |
| `terminal_outcome`, draw, objective admits only win | `The game ended in a draw. This attempt ended at +{n}; the pack's win objective admits win. Source: recorded outcome event and pack objective.` |
| `objective_terminal`, failed | `The recorded objective state on this attempt is failed at +{n}. Source: recorded objective event {ref}.` |
| `tablebase` | `At +{n} this position is a tablebase {category} for you, with {p} pieces; the pack's {objective} objective admits {list}. Source: Syzygy (tablebase.lichess.org/standard).` |
| unauthored default | `The learner lost the game. This run declares no objective, so Tabiya treats a recorded loss as settled by default. Source: recorded outcome event and Tabiya's stated default.` |

**Banned vocabulary, normative.** No collapse explanation, tooltip, `aria-label`, heading or
section title may contain: *better, worse, best, worst, stronger, weaker, superior, inferior,
top, leading, ahead, behind, rank, ranked, ranking, score (as a verdict), mistake, blunder,
inaccuracy, should, ought, prefer, preferred, promising, wasted, pointless*. A lint over the
rendered template table and the component's static strings enforces it (acceptance criterion 3).
The section heading is **"Settled outcomes"** (§5-0), never "weak branches" or "losing lines".

#### 3c. When a collapsed branch becomes relevant again

Collapse is reversible and the learner is never fighting it:

1. **Manual expand.** Every collapsed row has an expand control; the collapsed section itself
   expands whole. Expanding adds the branch to `pinnedExpanded` for the run, so it does not
   re-collapse on the next projection. A view the learner restored is not taken away again.
2. **Automatic unfold**, in four cases, each of which also pins:
   - it becomes the active branch (switch, or rewind into any node on its path);
   - it is added to the compare selection (a collapsed branch is always selectable — §3d);
   - it is a member of a branch group being viewed (`docs/branch-groups.md:88`, *"Grouped
     branches remain visible in the ordinary branch rail"* — this RFC does not change that);
   - a new branch forks from a node on its path.
3. **A collapsed branch is never excluded from anything served.** It is in `run.branches`, in
   `branchPath`, in `compareBranches`, in `exportPgn`, in the event log, and in the graph.
   Collapse is a rail filter and nothing else.
4. **Decidedness cannot reverse.** Terminal objective states are absorbing
   (`docs/branch-runtime.md:118-125`) and a terminal node cannot be played from, so no collapsed
   branch silently becomes undecided. The one direction that does move is `unknown → decided`,
   when a lazy probe resolves (§4c) — and that only ever *adds* to the collapsed set, at a
   projection boundary, never mid-interaction.

#### 3d. Reconciliation with the eight-column readability cap

They are different objects and this RFC keeps them different while pinning them to one constant.

| | Comparison cap | Collapse floor |
|---|---|---|
| Object | one served payload | one client view |
| Enforcement | server, typed `TOO_MANY_BRANCHES` → **422** (`apps/server/src/service.ts:964-968`; mapped at `rest.ts:516`) | client projection |
| Value | 8 (`docs/n-way-comparison.md:19-20`, *"Eight is a readability cap, not a data integrity limit"*) | 8, from the same constant |
| Effect of the other | the cap never collapses anything | collapse never changes the compare selection |

**The single-source fix, because "imported" is currently impossible.** The draft said
`BRANCH_COLLAPSE_FLOOR` is *"exported from the same module that owns the comparison bound"*. No
such module exists: the bound is a bare literal `8` at `service.ts:964`, and `service.ts` contains
**four other bare `8`s that mean different things** — group size (`:780`), group candidate count
(`:827`), MultiPV (`:1055`) and reasoning candidate count (`:1137`) `[V]`. Worse, the direction is
wrong: `branch-scale.ts` lives in `packages/runtime`, which `apps/server` depends on and not the
reverse, so it cannot import from `service.ts` at all.

Normatively, therefore, this RFC **creates** the constant it claims to reuse:

1. add `export const MAX_COMPARISON_BRANCHES = 8;` to `packages/runtime/src/compare.ts`, the
   module that owns `compareBranches` and `BranchComparison`;
2. rewrite `service.ts:964-967` to use it (`branchIds.length > MAX_COMPARISON_BRANCHES`, and the
   `details.limit`) — behaviour and error payload byte-identical;
3. rewrite the client's two literals to use it: `DrillScreen.svelte:429`
   (`compareIds.length < 8`) and `:434` (`.slice(0, 8)`);
4. `export const BRANCH_COLLAPSE_FLOOR = MAX_COMPARISON_BRANCHES;` in
   `packages/runtime/src/branch-scale.ts`.

After step 3 the digit `8` appears in no comparison path, so the cap and the floor **cannot**
silently diverge — divergence becomes a deliberate edit that breaks the alias. Steps 1–3 are a
pure refactor with no behaviour change and belong in this RFC's first commit. Group size at
`:827` is *not* folded in: `docs/branch-groups.md:118` ties it to the comparison contract by
intent, but that is a separate claim and this RFC does not take it. If cap and floor ever must
differ, the served cap wins, because it is a contract and the floor is a preference (Open
questions 3).

**The truncation fix.** `compareAllHere` currently takes `.slice(0, 8)` of the eligible set and
says nothing (`DrillScreen.svelte:433-435`). That is a silent absence, which
`design/05-in-run-experience.md:41` forbids. It becomes:

1. order candidates: active branch first, then expanded branches in rail order, then collapsed
   branches in rail order;
2. take the first `MAX_COMPARISON_BRANCHES`;
3. when the candidate set exceeded the cap, render a stated sentence: *"{k} branches fork here.
   Comparison renders at most eight columns; the first eight in rail order are selected."*

**Not through `HonestControl` as the draft said.** That component renders its reason **only when
`disabled`** (`apps/web/src/lib/HonestControl.svelte`: `{#if disabled}<span class="reason" …>`)
`[V]`, and this control is not disabled — it works, it just cannot show everything. Use the same
*pattern* — a `.reason` span adjacent to the control, referenced by `aria-describedby` — without
disabling the control. Reusing the component here would have shipped a sentence nobody sees.

Collapsed branches sort last so the default selection prefers the undecided ones. This is a view
ordering over an already-computed unary partition — not a ranking, and it carries no sentence
claiming anything about any branch. Two further pins so it stays that way: the resulting
`branchIds` order reaches the server as **request order**, which is what column order has always
meant (`compareBranches` maps `branchIds` positionally, `packages/runtime/src/compare.ts`), so the
payload gains no ordering semantics it did not already have; and the learner can change the
selection freely, because a collapsed branch is always selectable (§3c.2).

### 4. The eval budget

#### 4a. What the shipped system actually spends

Measured against the code, because the owner's worry deserves a real number rather than a
reassurance:

- **One eval job per committed ply, at commit.** `#enqueueMoveEvidence` runs after every learner
  move and every opponent ply (`apps/server/src/service.ts:605,643,1723`) `[V]`, with `movetime` defaulting to
  **100 ms** (`DEFAULT_STRONG_ENGINE_PROFILE.movetimeMs`, `apps/server/src/strong-engine.ts:10-15`) `[V]`. The queue's default concurrency is **2**
  (`apps/server/src/evidence-queue.ts:103`, `maxConcurrency ?? 2`; set explicitly at `apps/server/src/application.ts:342-343`) `[V]`.
- **One job per member on group creation**, capped at eight members
  (`apps/server/src/service.ts:890`; `docs/branch-groups.md:118`).
- **One job per node on one branch path**, on demand, when a story is opened
  (`#ensureStoryEvidence`, `apps/server/src/service.ts:1554-1577`) — already deduplicated against durable,
  failed and outstanding jobs, already disclosure-gated (`apps/server/src/service.ts:519`), and already scoped to
  a single branch.
- **Learner-initiated deep analysis**, 1–16 distinct node ids, MultiPV 1–8
  (`apps/server/src/service.ts:1040-1065`).
- **Comparison spends nothing.** `compareBranches` derives its evaluation overlay only from
  durable `evidence.attached` events on each path (`evidenceOverlay`, `packages/runtime/src/compare.ts:179-213`) `[V]`, and
  `Service.compare` enqueues no job (`Service.compare`, `apps/server/src/service.ts:956-975` — re-verified line by line at cross-review; the method reads storage, calls `compareBranches`, and applies `feedbackDisclosed`, and there is no `enqueue` in it) `[V]`. This is already the contract
  `docs/explanation-grounds.md:37-40` states: *"Staged or queued jobs are not a comparison
  source."*

**So 99 branches do not mean 99 evaluations.** They mean 99 × L committed plies, each of which
already paid one 100 ms job when it was played, spread across the session at concurrency 2.
Opening the rail, collapsing, folding, expanding and comparing all cost **zero** engine work.
This RFC's job is to keep that true, not to restore it.

#### 4b. The budget, normative

| Class | Work | Trigger | Bound |
|---|---|---|---|
| **Never** | any Stockfish call caused by a branch existing, being collapsed, expanded, folded or restored | — | this RFC adds **zero** enqueue sites |
| **Never** | any engine-derived decidedness at any depth | — | §2c |
| **Eager, free** | `branchDecidedness` from the run's own events and node projections | every rail projection | one O(E) event pass + O(B) leaf lookups; no FEN parsed, no engine, no network |
| **Lazy, bounded, learner-initiated** | tablebase leaf probe | explicit "classify remaining" action only | ≤8 branch ids per request, **issued sequentially** (see below); ≤1 probe in flight and 4 queued; 512-entry positive LRU with no TTL, negative entries 60 s |
| **Unchanged** | per-ply eval, story backfill, group seeds, `/analysis` | as shipped | as shipped |

**The free classification's cost ceiling, grounded.** The full transition census — a strictly
heavier computation than this one, since it parses two FENs and builds attack maps per ply —
costs **29.06 µs/ply** (`move-primitive-computability.md:128,392-393`), which is **0.58 ms** for
a 20-ply branch and **4.7 ms** for an eight-branch comparison at 20 plies each (`:136-138`).
Even at 99 branches × 20 plies the census would be ~57 ms; `branchDecidedness` parses no FEN at
all and reads only event types and leaf fields. The relevant envelope is the documented one — at
most 1000 events per run, where a cold replay plus graph transport measures 6.303 / 8.024 /
9.494 ms (`docs/branch-runtime.md:375-380`).

**The eight-id bound and the five-deep queue do not fit, and this was measured.** `≤8 ids per
request` against `1 in flight + 4 queued` is `8 > 5`. `LichessTablebaseSource.probe` rejects
immediately with `TABLEBASE_UNAVAILABLE` / `retryAfterMs: 4000` once `#active && #queue.length >=
4`. Run against the shipped class with a mock fetcher, eight distinct uncached FENs `[V]`:

| Issue pattern | Resolved | Rejected |
|---|---:|---:|
| all eight concurrently (`Promise.all`) | **5** | **3** × `TABLEBASE_UNAVAILABLE` |
| one at a time, awaited | **8** | 0 |

So the obvious implementation of §4c fails 3 of every 8 branches with a spurious
"provider unavailable" and can never classify more than five. It fails *toward showing more* —
those branches stay expanded with the reason stated, so no doctrine is broken — but it would ship
an action that silently half-works. **Normative: the route issues its probes sequentially,
awaiting each before starting the next.** This costs nothing in throughput, because the provider
serialises to one in-flight probe regardless; it only stops the route from filling the provider's
own queue and then rejecting itself.

**Per-selection budget, declared.** "Classify remaining" is a *selection*, not one instrument
call, so under the owner ruling of 2026-08-15 (`design/02-product-shape.md:166-181`: *"A
selection that legitimately needs several calls carries its own, larger budget, stated per mode…
every per-selection budget is declared and benchmarked like the per-call ones"*) it must declare
one. Declared here: **≤8 sequential probes, each bounded by the provider's shipped 4 s timeout
(`tablebase.ts` `timeoutMs ?? 4_000`), worst case ≈32 s wall on eight cold uncached leaves; the
action is asynchronous, non-blocking, per-branch-incremental in the rail, and cancellable.** The
number that must be benchmarked is the realistic case, not the worst: cached and in-range leaves
return without a network call at all. Acceptance criterion 12 records it. The reason this is
allowed to be large is exactly the reason the ruling gives — it is a background classification
the learner asked for, not a move the board is waiting on.

**Why the lazy class is learner-initiated rather than automatic.** An automatic probe of every
in-range leaf would be a network request per branch on every rail projection. Bounded and cached
it would still be assistance the learner did not ask for, arriving at a moment disclosure does
not choose. The explicit action keeps the trigger where ADR-0006 wants it.

**What the refused design would have cost, for the record.** Evaluating each leaf to order the
set costs a median **77 ms** and p95 **172 ms** per out-of-range position at depth 8, rising to
**938 ms** at depth 12 (`practical-difficulty-outside-tablebase.md:176-185`). Ninety-nine leaves
at depth 8 is ≈ 7.6 s of Stockfish occupancy — ≈ 3.8 s wall at concurrency 2 — on the same shared
supervisor serving the opponent's `<500 ms` shallow-feedback budget
(`design/02-product-shape.md:159-163`). In range it is cheap (6.9 ms at depth 8, `:182`), and in
range the tablebase is exact and already available, so the engine adds nothing there either.

#### 4c. The lazy route

`POST /runs/:id/branch-decidedness` — writer-free read, modelled exactly on `POST
/runs/:id/compare` (`rest.ts:1301-1312`).

- Body: `{ branchIds: string[] }`, 1–`MAX_COMPARISON_BRANCHES` distinct ids. More than the cap →
  the shipped `TOO_MANY_BRANCHES` / 422.
- 200 `{ decidedness: Record<branchId, Decidedness> }`.
- Server behaviour per branch, **evaluated sequentially**: free grounds always; then, only if
  `feedbackDisclosed(run)` (`packages/runtime/src/feedback.ts:3-20`) **and**
  `providers.tablebase !== "none"` (`apps/server/src/capabilities.ts:50`) **and** the leaf FEN has
  ≤7 pieces, one awaited `LichessTablebaseSource.probe`, converted through `learnerCategory`
  (§2b constraint 0). Otherwise `{ state: "unknown", reason }` with the reason named:
  `withheld`, `provider_unavailable`, or `out_of_range`.
- `probe` throws **synchronously** for >7 pieces (`TABLEBASE_OUT_OF_RANGE`) and for a malformed
  FEN (`TypeError` out of `transposeKey`) `[V]`. The route checks the piece count itself and
  returns `{state:"unknown", reason:"out_of_range"}` rather than letting either escape; run-node
  FENs are always legal, so the `TypeError` path is a guard, not an expected case.
- Probes are deduplicated by the provider's own key (transpose key plus halfmove clock), so
  repeated requests over the same leaf cost one network call ever. Positive results are cached
  with no TTL; **failures are cached for 60 s**, so a retry inside that window re-fails without a
  network call — §4d's retry hint is a floor, not a promise.
- The route writes nothing: no event, no evidence, no staged result. A tablebase decidedness fact
  is a read, not a durable grounding artifact; making it durable is a separate question (Open
  questions 2).

#### 4d. Pending, and exhaustion mid-set

- **Pending never collapses.** A branch whose class is `unknown` stays in the main view with its
  reason stated. There is no optimistic collapse and no spinner standing in for a fact
  (`design/05-in-run-experience.md:41`).
- **The rail states its own partial knowledge.** The heading count (`BranchRail.svelte:20-22`)
  becomes the four-part count in §6, and the unclassified group carries the reason.
- **Provider exhaustion is a stated outcome, not a stall, and it fails toward showing more.** A
  full interactive queue returns `TABLEBASE_UNAVAILABLE` with `retryAfterMs: 4000`; an outage,
  timeout, non-OK HTTP or unparseable body returns it with `60000` `[V]`. All map to
  `{state: "unknown", reason: "provider_unavailable"}`, and `unknown` is inert (§2c), so **every
  exhaustion path leaves the branch expanded in the main view with its reason stated.** There is
  no failure mode in which the tablebase ground hides a branch. Half-classified sets are normal.
- **No partial collapse cascade.** A "classify remaining" action that resolves 5 of 8 requests
  collapses those 5 at the next projection boundary and leaves 3 stated as unclassified. It never
  re-orders the rail beyond moving newly collapsed rows into the folded section.

#### 4e. The other budget: the rail's own cost

The UX half of the owner's worry has a measurable cause that is not the engine.
`branchCards(run)` calls `branchPath` once per branch (`apps/web/src/lib/screen-model.ts:139-158`), and
`branchPath` filters all of `run.nodes` **and builds a fresh `Map` of every node** on every call
(`packages/runtime/src/branch-path.ts:21-41`). The rail is therefore **O(B·N) with B map allocations**, re-derived on
every run mutation (`DrillScreen.svelte:238`). At B = 99 and the documented 1000-event envelope
that is ~10⁵ operations and ~10⁵ map insertions per keystroke-scale update.

This RFC requires one pass: build `byId` once, group nodes by `branchId` once, and resolve every
branch's leaf and path from that shared index — O(N + B) with one allocation. Either add an
optional index parameter to `branchPath` or add a `branchLeaves(run)` companion; both are local
changes and neither alters a signature's existing behaviour.

**No performance number is claimed here.** The complexity is read off the code; the improvement
must be measured (acceptance criterion 5) against the branch-switch worry/intervene band of
100 ms / 200 ms (`design/02-product-shape.md:159-163`).

### 5. Manual prune: fold and restore

#### 5-0. Two words, two things — the draft used one word for both

The draft named the manual operation **fold** (§5) and also titled the *automatic* section
**"Folded — settled outcome"** (§3b, §6), and then wrote a rail heading with a single `{k}
folded` count. That is one noun for two mechanisms with different justifications: collapse states
a ground and shows a sentence; fold states nothing on purpose (§5a). An implementer cannot build
the heading from that, and a learner cannot tell which control undid what. Normatively:

| Word | Mechanism | Section title | Sentence | Persisted |
|---|---|---|---|---|
| **collapsed** | automatic, §3 | **"Settled outcomes"** | one grounded sentence per branch | no (derived) |
| **folded** | manual, §5 | **"Hidden by you"** | none, by design | yes, `foldedBranchIds` |

Two disclosures, never merged, and the rail heading counts them separately (§6). "Folded —
settled outcome" is withdrawn as a title. Where a branch qualifies for both, **folded wins**: the
learner's own action outranks the product's housekeeping, and it renders with no sentence.

#### 5a. Fold is a view operation

`foldedBranchIds: ReadonlySet<string>`, client-local, persisted per run under
`tabiya:branch-fold:v1:{runId}` — the same versioned-local-preference shape as the shipped
group advance mode (`tabiya:branch-group:v1:{groupId}`, written at `DrillScreen.svelte:341`, read
at `:615`) and the same status: *local browser state, not shared run truth*
(`docs/branch-groups.md:120`). Both accessors are wrapped in `try/catch` against a missing or
throwing `localStorage`, following `DrillScreen.svelte:289,341,615` exactly; a storage failure
degrades to "nothing folded", never to an error.

Fold is available on **every** branch regardless of decidedness. The learner's own housekeeping
needs no justification and no ground: this is the one place in the product where a person may
remove something from their own view without the product having an opinion. Folding therefore
renders **no explanation sentence at all** — there is nothing to explain, and manufacturing one
would be the manufactured claim law 8 forbids.

Normatively, fold:

- emits **no event** and calls **no endpoint**;
- **cancels no job** and **drops no staged evidence**. The one path that does cancel is
  `onRewound` (`apps/server/src/evidence-queue.ts:168-189`, which aborts pending jobs, aborts running jobs, and filters staged results) `[V]`, and it is untouched. Folding a branch whose analysis
  is in flight leaves the analysis running and its result durable, because the learner hid a row,
  not an attempt;
- **does not alter the compare selection.** A folded branch that is compare-selected stays
  selected and renders as a full column;
- **does not alter what is exported.** The export button already passes `compareIds` when
  non-empty and `undefined` — meaning *all branches* — otherwise
  (`DrillScreen.svelte:580,819`; `exportPgn`'s `selectedBranches` defaults to
  `run.branches.map(b => b.id)`, `packages/runtime/src/pgn.ts:47-53`) `[V]`. **Normative: the
  export selection is `compareIds`, and neither fold nor collapse may ever be wired into it.**
  Deriving it from the rail's *visible* set instead would make collapse silently delete lines
  from an exported PGN — the one way a "view operation" could become erasure without anyone
  adding a delete path. This is the mechanism acceptance criterion 4 exists to catch;
- is visible in aggregate: the rail heading names the folded count and one control restores all.

#### 5b. The erasure check — explicit, because it is a core promise

`design/05-in-run-experience.md:38`: **"An attempt is never destroyed."** Pruning must be a view
operation or it breaks that. Checked against the code rather than asserted:

| Check | Result |
|---|---|
| Is there an event that removes a branch or node? | **No** `[V]`, re-verified at cross-review. `DrillRunEvent` has sixteen members — `run.started, move.committed, opponent.move_selected, checkpoint.reached, objective.state_changed, evidence.attached, branch.forked, run.rewound, segment.completed, feedback.generated, outcome.reached, transfer.scheduled, prediction.recorded, reasoning.recorded, group.created, feedback.revealed` (`packages/runtime/src/types.ts`, `DrillRunEvent`). Nothing deletes. |
| Does rewind erase? | **No.** *"`rewind(nodeId)` changes only the cursor and appends `run.rewound`. Existing nodes and branches remain unchanged"* (`docs/branch-runtime.md:89-91`). |
| Does this RFC add a delete path? | **No.** §0 — no new event, no new mutation, no writer lease taken anywhere in §3–§5. The one new route is a read (§4c). |
| Does a folded branch survive projection? | **Yes.** Fold is client state; `run.branches` is unchanged, so `branchPath`, `compareBranches` and the graph route see it exactly as before. |
| Does a folded branch survive export? | **Yes** `[V]`. `exportPgn(run, branchIds?, headerOverrides?)` resolves branches through `selectedBranches`, which defaults `branchIds` to every branch id (`packages/runtime/src/pgn.ts:47-53,78-85`). Fold is not an input to it, and §5a forbids making it one. |
| Could collapse reach the export by another route? | **Only** if the export call site were changed to read the rail's visible set. It currently reads `compareIds` (`DrillScreen.svelte:580,819`) `[V]`, and §5a pins that. |

**Acceptance criterion 4 turns this into a test rather than a paragraph:** fold every branch in a
run, export the PGN, and assert the bytes are identical to the pre-fold export; then clear
`localStorage` and assert the rail renders every branch again. If either fails, the feature is
deletion wearing a view's name and must not ship.

#### 5c. Restore

- Per-row unfold, plus "restore all folded" in the rail heading.
- Unfolding pins the branch expanded for the run (`pinnedExpanded`), so an auto-collapse ground
  does not immediately re-hide something the learner just asked to see.
- Clearing the stored preference restores everything; the preference is disposable by
  construction and its loss costs nothing.
- The four automatic-unfold triggers in §3c apply to hand-folded branches too: entering a branch
  always shows it.

### 6. Client surface

- `BranchRail.svelte` gains: a heading count of the form
  `{n} branches · {c} settled · {k} hidden by you · {u} not classified`, replacing the bare
  `{branches.length}` at `BranchRail.svelte:20-22` and keeping the four counts distinct per §5-0;
  a fold control per row; **two** disclosures (`<details>`), never merged — **"Settled outcomes"**
  listing branch label, first move and the single grounded explanation sentence, and **"Hidden by
  you"** listing branch label and first move with no sentence; a "restore all" control on the
  second; and, when the tablebase capability is present and feedback is disclosed, a "classify
  remaining" control that issues the §4c request.
- Both sections reuse the group panel's semantic-zoom band pattern
  (`docs/branch-groups.md:88-97`): overview only. Boards are not rendered for a hidden branch —
  that is the point of hiding it.
- Existing compare checkboxes, "compare all forked here", switch-on-click and group markers keep
  their current behaviour and keyboard bindings.
- Accessibility: the collapsed section is a labelled disclosure; the count is in the accessible
  name; each collapse explanation is the row's `aria-description`; nothing is hidden from assistive
  technology that is not also hidden visually.

### 7. Defects found while writing this

All are shipped behaviours, all are in scope for this RFC's implementation, and all need
`design/BACKLOG.md` rows that this draft cannot add (design tier is intent tier — RFC-0000 agent
rule):

- **`compareAllHere` truncates silently.** `.slice(0, 8)` with no statement
  (`DrillScreen.svelte:433-435`) violates *"Absence is stated, never simulated"*
  (`design/05-in-run-experience.md:41`) `[V]`. Fixed in §3d.
- **The branch rail is O(B·N) with B map allocations per projection.**
  `branchCards` × `branchPath` (`apps/web/src/lib/screen-model.ts:139-158`;
  `packages/runtime/src/branch-path.ts:21-41`), re-derived on every run mutation
  (`DrillScreen.svelte:238`). Fixed in §4e. **Re-verified at cross-review:** `branchPath` both
  `.filter`s all of `run.nodes` *and* constructs `new Map(run.nodes.map(...))` on every call, and
  `branchCards` calls it once per branch — so a 99-branch run allocates 99 full node maps per
  keystroke-scale update `[V]`.

Cross-review (2026-08-15) adds two more:

- **The eight-branch comparison cap is an unlabelled literal.** `apps/server/src/service.ts:964`
  is its only enforcement site, and the same file holds four other bare `8`s meaning different
  things (`:780`, `:827`, `:1055`, `:1137`) `[V]`. §3d names the constant.
- **`LichessTablebaseSource` cannot serve its own plausible request size.** Eight concurrent
  probes against a `1 in flight + 4 queued` provider reject three of eight — measured against the
  shipped class `[V]` (§4b). This is latent today because no shipped caller batches probes; §4c
  would have been the first, so it is specified sequential rather than left to be discovered.

## Deviations from design

**None.**

Three points that could read as deviations and are not:

1. `design/03-product-breadth.md:24-25,65-66,426-429` place branch scoring/ranking after breadth
   and after manual selection works. This RFC ships **no** scoring, ranking or automatic compare
   inclusion, and leaves the manual checkboxes exactly as shipped — which is what `:427-428`
   ("with manual checkboxes always retained") requires.
2. `docs/branch-groups.md:119` records *"there is no group ranking, scoring, pruning"* as a
   deliberate group limit. This RFC prunes **branches in the rail**, not group members, and a
   grouped branch stays visible in the rail per `:88`. The group limit is unchanged.
3. `docs/n-way-comparison.md:11-13`'s refusal is preserved verbatim by §2d, and §0 keeps the
   payload byte-identical.
4. §3a-bis introduces the shipped `CATEGORY_RANK` order over *outcome categories*. That is not
   the branch ranking `:24-25` defers: it orders the rules' own win/draw/loss vocabulary, was
   shipped by `rfc/archive/authoring-frictions.md`, and is applied only between one branch's leaf
   and the authored objective declaration. No branch is compared to another branch anywhere in
   this RFC (§2d, §3a-bis).
5. §4b declares a **per-selection** latency budget for "classify remaining" that is far larger
   than the per-call tablebase figure. `design/02-product-shape.md:166-181` licenses exactly
   this, and requires the budget be *"declared and benchmarked like the per-call ones"* — it is
   declared in §4b and benchmarked by acceptance criterion 12.

## Acceptance criteria

1. **Collapse is decidedness-gated.** A fixture run with (a) a checkmated branch, (b) an
   objective-`failed` branch, (c) an objective-`achieved` branch, (d) an undecided 24-piece
   branch, and enough siblings to exceed the floor, collapses exactly (a) and (b). Reducing the
   set below nine collapses nothing.
2. **No engine work is caused by branch count.** With the evidence queue instrumented, building
   the rail, collapsing, expanding, folding, restoring and comparing a 99-branch fixture enqueues
   **zero** jobs. `grep` shows this RFC's modules contain no `enqueue` call site.
3. **No comparative language.** A test asserts that every string in the collapse-explanation
   template table and in the rail component matches none of §3b's banned lexicon
   (case-insensitive, word-boundary), and that `renderCollapseExplanation`'s parameter type
   exposes no second branch.
4. **Fold cannot erase.** Fold every branch → `exportPgn` bytes are unchanged; the graph route
   returns the same branches; `compareBranches` still accepts a folded branch; clearing the
   preference restores the full rail. An in-flight analysis job for a folded branch still
   completes and still attaches. **Run the same assertions for collapse**, not only fold: collapse
   every eligible branch and assert identical PGN bytes. Collapse is the more dangerous of the two
   here, because it is automatic and the learner did not choose it. If either fails, the feature
   is deletion wearing a view's name and must not ship.
5. **Rail cost is measured, not assumed.** A benchmark at B = 10 / 50 / 99 over the documented
   1000-event envelope reports rail-projection time before and after §4e, read against the
   100 ms worry / 200 ms intervene band (`design/02-product-shape.md:159-163`). The number is
   recorded in `docs/`; no target is asserted in advance.
6. **Undecided is never auto-collapsed.** A property test over generated runs asserts that no
   branch whose decidedness is `undecided` or `unknown` ever appears in the collapsed set,
   including while probes are pending and after a provider failure.
7. **Disclosure holds.** With `feedbackPolicy: attempt_end` and no reveal, `POST
   /runs/:id/branch-decidedness` returns `{state: "unknown", reason: "withheld"}` for every
   tablebase candidate and issues no probe; free grounds derived from `outcome.reached` are still
   returned, because an outcome discloses under every policy
   (`docs/branch-runtime.md:206-207`, the v0.6 amendment: *"makes it a feedback reveal under every policy"*).
8. **Truncation is stated.** Invoking "compare all forked here" with eleven eligible branches
   selects eight and renders the count sentence; the eight prefer expanded branches.
9. **Register untouched.** `packages/schema/src/index.ts` reads exactly what it read before this
   RFC's first commit — **`DRILL_RUN_SCHEMA_VERSION = "0.14"` and `DRILL_PACK_SCHEMA_VERSION =
   "0.17"` as of the 2026-08-15 rebase (§0)**, and the assertion is "unchanged by this diff",
   not a hard-coded pair, so a sibling lane landing first cannot fail it. No migration is added;
   `schemas/` is unchanged; `BranchComparison` has the same eight fields as
   `packages/runtime/src/compare.ts:98-107` today (`forkNodeId`, `columns`, `rows`,
   `objectiveTimelines`, `checkpointHits`, `evidence`, `lines`, `consequences`).
10. **Shortfall, not mismatch.** For each of the four objectives, a fixture branch whose leaf
    category *exceeds* the objective is **never** collapsed: a `win` leaf under `hold`, and `win`,
    `draw` and `cursed-win` leaves under both `save` and `resist`. A `loss` leaf under `save` and
    under `resist` is also never collapsed (it is admitted). A `loss` leaf under `hold` and all
    four shortfall categories under `win` are collapsed. This is the §3a-bis table, asserted row
    by row.
11. **Perspective is converted.** A fixture leaf whose side-to-move is the opponent and whose raw
    Syzygy category is `win` classifies as a learner-perspective `loss`, and vice versa. A test
    asserts `branchDecidedness` never consumes a raw probe category, and that flipping
    `run.start.side` flips every tablebase-grounded classification.
12. **Probes are sequential and never self-exhaust.** A "classify remaining" request over eight
    distinct uncached in-range leaves, against a mock provider, returns **eight** classifications
    and **zero** `provider_unavailable` — the concurrent implementation returns 5/3 and must fail
    this test. The per-selection budget declared in §4b is measured on the same fixture and
    recorded in `docs/`.
13. **One constant, no divergence.** After the §3d refactor, `grep -n "8"` over the comparison
    path finds the literal only in `MAX_COMPARISON_BRANCHES`'s declaration; `service.ts`,
    `DrillScreen.svelte:429,434` and `branch-scale.ts` all reference it. A test asserts
    `BRANCH_COLLAPSE_FLOOR === MAX_COMPARISON_BRANCHES` and that the 422 `details.limit` still
    reports `8`.

## Open questions

1. **Should an `achieved` branch collapse too, once the set is large?** §2d argues decidedness is
   necessary but not sufficient and that the learner keeps their successes visible. At sixty
   branches that may invert. Deferred to the content-complete invariant review
   (`design/05-in-run-experience.md:24-29`) rather than guessed at now — it is an owner ruling,
   not an implementation choice.
2. **Should a tablebase decidedness fact become durable evidence?** §4c makes it a read. Making
   it an `evidence.attached` payload would make collapse reproducible from the event log and
   would let replay explain a historical collapse — at the cost of a run-schema claim this RFC
   deliberately does not take. Revisit if collapse ever needs to survive a reload without a
   re-probe.
3. **Is eight the right floor?** It is aliased to the comparison cap for a stated reason
   (§3d), and the owner's number was nine. If the rail turns out to be readable at twelve, the
   floor and the cap must be allowed to differ, and §3d's tie-break ("the served cap wins")
   becomes load-bearing. Answerable only by use, not by argument.
4. **What happens at branch counts the runtime has not characterised?** The documented envelope
   is at most 1000 events per run (`docs/branch-runtime.md:394-396`), and *"3000+ event sessions
   have not been accepted or characterized"* (`:410`). Ninety-nine branches of twenty plies is ~2000 events
   and sits outside it. This RFC bounds the *rail's* cost at that size (§4e) but does not extend
   the runtime envelope, and the benchmark in acceptance criterion 5 may well surface the
   envelope as the real limit rather than the rail.
5. **Does the unauthored-run default (fold recorded losses) hold for imported games?** An
   imported game's mainline is a recorded loss roughly half the time, and folding the one branch
   the learner came to study would be absurd. The active-branch exclusion in §3a covers the
   common case; whether imported runs should opt out of collapse entirely is unresolved.
   `apps/server/src/service.ts:516` already carries a shipped `importedMainline` notion for a
   related reason, which is where an opt-out would attach.
6. **Does `save`/`resist` collapsing nothing need a second affordance?** §3a-bis's shortfall rule
   is correct and also means a large `save`-objective run gets no automatic relief at all —
   `objective_terminal` `failed` still collapses, but the tablebase ground never fires. Manual
   fold (§5) covers it, and that may be the right answer, but it should be confirmed by use
   rather than patched by loosening the rule.
7. **Does `win` + `cursed-win` belong in the collapse set?** `assessmentAdmissionCode` returns
   `CURSED_WIN_CANNOT_ROOT_WIN` and `CATEGORY_RANK` puts `cursed-win` below `win`, so §3a-bis
   collapses it. That is defensible — the fifty-move rule makes the conversion unreachable, which
   is exactly the shortfall — but it is the one row of the table where a learner might reasonably
   disagree, and it is a one-line change if the owner rules otherwise.

## Changelog

- 2026-08-15: created.
- 2026-08-15: adversarial cross-review (second agent, verified against the tree after `ffc9817`,
  `047de02`, `ed48978`, `4977ff6`, `8fbab41`). Blockers fixed: **§0** rebased — the register moved
  the same day and the draft's "pack 0.16 / run 0.13" and acceptance criterion 9 were false
  against the tree; **§3a-bis added** — `decided ∧ ¬admitted` folded branches that *beat* the
  objective (a `win` under `hold`, a `win`/`draw`/`cursed-win` under `save`/`resist`), replaced
  with a shortfall rule over the shipped `CATEGORY_RANK`; **§2b constraint 0 added** — the draft
  never converted the Syzygy category to the learner's perspective, which would have folded
  winning branches near a coin flip; **§3d rewritten** — `BRANCH_COLLAPSE_FLOOR` could not be
  "imported from the comparison cap" because no such constant exists and `packages/runtime`
  cannot import from `apps/server`, and the cited second enforcement site
  (`compare.ts:221-222`) is not one; **§4b/§4c** — the `≤8 ids` and `1 in flight + 4 queued`
  bounds are inconsistent, measured at 5 resolved / 3 rejected, now specified sequential with a
  declared per-selection budget; **§3a** — `pinnedExpanded` declared, `compareSelection` renamed
  to the shipped `compareIds`; **§5-0 added** — "fold" named both the manual and the automatic
  mechanism; **§5a** — the PGN export selection pinned to `compareIds` so collapse can never
  reach exported bytes. Also: §2d gained the rendering-leak analysis the structural argument
  needed, §3d's `HonestControl` reuse corrected (it renders its reason only when `disabled`),
  citation paths disambiguated throughout, and acceptance criteria 10–13 added. **The
  `n-way-comparison` refusal is intact and nothing in this RFC ranks branches.**
