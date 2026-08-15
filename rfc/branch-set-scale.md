# RFC: Branch-set scale — collapse by decidedness, fold by hand, and a bounded eval budget

- **Status:** draft
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
  `rfc/archive/grounding-pair.md` (`LichessTablebaseSource`, `assessmentGrounding`).
- **Parent / amends:** amends `apps/web/src/lib/BranchRail.svelte`,
  `apps/web/src/lib/DrillScreen.svelte`, `apps/web/src/lib/screen-model.ts`,
  `packages/runtime/src/branch-path.ts`; adds one runtime module
  (`packages/runtime/src/branch-scale.ts`) and one read-only REST route. Introduces no new
  subsystem, no new file under `schemas/`, and no new event.
- **Supersedes / superseded by:** —
- **Planning:** `planning/branch-set-scale/` (once implementing)

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
Pack schema stays at **0.16** and run schema at **0.13**
(`packages/schema/src/index.ts:1-2`). The 0.17–0.21 pack lanes and run 0.14 / migration 19 are
sibling claims and remain untouched.

It can claim nothing because it adds nothing durable:

- **No new event.** The event union is unchanged (`packages/runtime/src/types.ts:270-286`).
  Collapse and fold are derived or client-local; neither is recorded.
- **No pack-format field.** The objective and its admissible categories are already declared and
  already validated (`apps/server/src/tablebase.ts:8-13`;
  `apps/server/src/pack-validation.ts:110-130`).
- **No change to `BranchComparison`.** §2d requires this.
- **No storage shape.** Fold is a versioned browser preference, following the shipped precedent
  exactly (`apps/web/src/lib/DrillScreen.svelte:614-615`; `docs/branch-groups.md:120`, *"lockstep
  preference is local browser state, not shared run truth"*).

The one new REST route (§4c) is a read: `POST /runs/:id/compare` is already a writer-free POST
read (`apps/server/src/rest.ts:1301-1312`), and adding a second one moves no `$id` and no digest.

### 1. Reuse audit — what already does part of this

Checked before designing, as instructed. Findings, each verified:

| Thing | Where | What it already gives us |
|---|---|---|
| Eight-column cap + typed refusal | `service.ts:961-968`, `compare.ts:221-222` | the constant and the error shape §3d reconciles with |
| Manual compare selection | `DrillScreen.svelte:124,425-431`; `BranchRail.svelte:43-50` | the selection state fold must never disturb |
| `compare-all-here` | `DrillScreen.svelte:433-435`; `BranchRail.svelte:54-56` | the affordance that needs the stated-truncation fix (§3d) |
| Per-branch leaf facts | `screen-model.ts:31-41,139-158` | `objectiveState` and `terminal` per branch — **two of the three free collapse grounds already exist and are already rendered** (`BranchRail.svelte:37-39`) |
| Objective admissibility | `tablebase.ts:7-13`; `pack-validation.ts:110-130` | `assessmentAdmissionCode(objective, category)` — reused verbatim as the "settled against this run's objective" predicate |
| Semantic zoom over a branch set | `docs/branch-groups.md:88-97`; `GroupPanel.svelte` | the overview/summary/boards band pattern the collapsed section reuses |
| Stated refusal in the UI | `HonestControl.svelte:14-17` | the reason-carrying disabled-control pattern |
| Grounded rules sentences | `evidence-sentences.ts:22-48` (`checkmate`, `result-loss`, `result-draw`, `result-win`) | the collapse explanation's vocabulary — no new sentence source |
| Disclosure predicates | `packages/runtime/src/feedback.ts:3-30` | the gate the tablebase ground must sit behind |
| Tablebase provider + bounded queue | `tablebase.ts:24-30`; `capabilities.ts:51` | one in-flight probe, queue depth 4, 512-entry positive LRU with no TTL, typed `TABLEBASE_UNAVAILABLE` |

**Nothing in the repo collapses, folds, hides or prunes a branch today.** `grep -rni
"collaps\|prune\|fold\|hidden"` over `apps/web/src/lib` and `packages/runtime/src` returns only
CSS `overflow: hidden` and `aria-hidden`, the unrelated `option_collapse` pivotal marker
(`packages/runtime/src/pivotal.ts:9,16`), `run-state.ts:66-73`'s rewind bookkeeping over
job-pending node ids, and the word "threefold" in the rules sentence table
(`evidence-sentences.ts:26`).
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
| `terminal_outcome` | 0 (rules) | the branch leaf's `outcome.reached` event | free, already in the run | always; discloses under every policy (`docs/branch-runtime.md:201-207`) |
| `objective_terminal` | 0/5 (rules + author) | leaf `objectiveState ∈ {achieved, failed, transitioned}` | free, already projected (`screen-model.ts:152-153`) | always |
| `tablebase` | 1 | Syzygy category of the leaf FEN at ≤7 pieces | one cached HTTP probe | only when `providers.tablebase !== "none"` (`capabilities.ts:51`) **and** `feedbackDisclosed(run)` |

Everything else is `undecided` or `unknown`, and both are inert (§2c).

Two constraints on the third ground, both non-negotiable:

1. **It is assistance and it follows disclosure.** A tablebase reading of a non-terminal leaf is
   rung-1 evidence. Probing it before disclosure and rendering it would defeat ADR-0006 exactly
   as an eval bar does. The gate is the shipped `feedbackDisclosed` (`feedback.ts:3-20`), which
   the compare payload already uses (`service.ts:972-974`).
2. **Uncertain categories are not decidedness.** `maybe-win`, `maybe-loss` and `unknown` are in
   the ten-value lattice (`tablebase.ts:5`) and are *not* in `ASSESSMENT_CATEGORIES`
   (`tablebase.ts:7`). They classify as `undecided`, never as a collapse ground.

#### 2c. The refusal: an undecided branch is never auto-collapsed

**No engine evaluation, at any depth, with any threshold, ever collapses a branch.** Not as a
default, not as an option, not behind a setting.

The reason is R4 §6, not taste. Outside the tablebase range there is no instrument that says
whether a position is decided, so the classifier cannot even abstain honestly
(`practical-difficulty-outside-tablebase.md:356-359`); at the threshold that scores κ = 1.000 in
range, **89.8%** of out-of-range positions classify as *draw* and the rule degenerates into a
magnitude filter flagging **50.8%** of all legal moves (`:348-352`). Collapsing on that number
would be a tuned constant presented as a measurement — the shape `resistance-spectrum` §2f
already refuses (`:381-386`) and the shape AGENTS.md law 8 forbids.

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
- **The payload is untouched.** `BranchComparison` (`compare.ts:98-107`) gains no field. The
  decidedness projection is a separate function, and the compare endpoint neither computes nor
  returns it. `docs/n-way-comparison.md:11-13` therefore stays literally true, word for word.
- **The explanation never mentions another branch.** Enforced by type, not by review (§3b).

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
  | { readonly state: "decided"; readonly ground: DecidednessGround; readonly admitted: boolean }
  | { readonly state: "undecided"; readonly reason: "no_terminal_fact" | "uncertain_category" }
  | { readonly state: "unknown"; readonly reason: "out_of_range" | "not_probed" | "provider_unavailable" | "withheld" };

export function branchDecidedness(
  run: DrillRun,
  options?: { readonly objective?: "win" | "hold" | "save" | "resist";
              readonly tablebase?: Readonly<Record<string, TablebaseCategory>> },
): Readonly<Record<string, Decidedness>>;
```

`admitted` is computed by the shipped
`assessmentAdmissionCode(objective, category)` (`pack-validation.ts:110-130`): `admitted =
assessmentAdmissionCode(objective, category) === undefined`. Outcomes map to categories the same
way the pack validator already treats them — `win → "win"`, `draw → "draw"`, `loss → "loss"` from
the learner's perspective, which is the perspective `outcome.reached` already carries
(`docs/branch-runtime.md:104-109`). For `objective_terminal`, `achieved`/`transitioned` are
`admitted: true` and `failed` is `admitted: false`.

**Objective resolution, and the unauthored default.** A pack run supplies its objective type. A
position, Just Play or imported run has none. Rather than invent one, the unauthored default is
stated: **`admitted` is false only for a recorded learner-perspective `loss`.** This follows the
principle the owner already drew on 2026-08-15 for tempo grading — *authored contexts declare;
unauthored contexts need a stated default* (`rfc/tempo-vocabulary.md`, owner ruling block). The
default is rendered to the learner as part of the collapse explanation, never applied silently.

**The collapse set.**

```
collapsed(run) = { b ∈ run.branches :
      decidedness[b].state === "decided"
  ∧   decidedness[b].admitted === false
  ∧   b ≠ run.activeCursor.branchId
  ∧   b ∉ compareSelection
  ∧   b ∉ pinnedExpanded
  ∧   |run.branches| > BRANCH_COLLAPSE_FLOOR }
```

`BRANCH_COLLAPSE_FLOOR = 8`, and it is **imported from the shipped comparison cap**, not
redeclared (§3d). Below the floor nothing collapses: the owner's threshold is nine
(*"if you make 9 branches it becomes cumbersome"*) and eight is the number the product already
calls "as many as a person reads at once".

Collapse is applied only at a rail projection boundary — a run mutation or an explicit refresh —
and never to a branch whose row currently holds focus. Rows must not move under the cursor.

#### 3b. The explanation, and the words it may not use

Every collapsed branch carries one sentence. Its shape is **one clause of settled fact, one
clause of source** — the same two-part shape the shipped strips use
(`compare-strips.ts:32,36-38`) and the same grounding contract as
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

Templates (the rules clauses reuse `evidence-sentences.ts:22-48` verbatim):

| Ground | Sentence |
|---|---|
| `terminal_outcome`, loss | `The learner lost the game. This attempt ended at +{n}. Source: recorded outcome event.` |
| `terminal_outcome`, draw, objective admits only win | `The game ended in a draw. This attempt ended at +{n}; the pack's win objective admits win. Source: recorded outcome event and pack objective.` |
| `objective_terminal`, failed | `The recorded objective state on this attempt is failed at +{n}. Source: recorded objective event {ref}.` |
| `tablebase` | `At +{n} this position is a tablebase {category} with {p} pieces; the pack's {objective} objective admits {list}. Source: Syzygy (tablebase.lichess.org/standard).` |
| unauthored default | `The learner lost the game. This run declares no objective, so Tabiya folds recorded losses by default. Source: recorded outcome event and Tabiya's stated default.` |

**Banned vocabulary, normative.** No collapse explanation, tooltip, `aria-label`, heading or
section title may contain: *better, worse, best, worst, stronger, weaker, superior, inferior,
top, leading, ahead, behind, rank, ranked, ranking, score (as a verdict), mistake, blunder,
inaccuracy, should, ought, prefer, preferred, promising, wasted, pointless*. A lint over the
rendered template table and the component's static strings enforces it (acceptance criterion 6).
The section heading is **"Folded — settled outcome"**, never "weak branches" or "losing lines".

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
| Enforcement | server, typed `TOO_MANY_BRANCHES` 422 (`service.ts:964-968`) and `compare.ts:221-222` | client projection |
| Value | 8 (`docs/n-way-comparison.md:19-20`) | 8, **imported from the cap** |
| Effect of the other | the cap never collapses anything | collapse never changes the compare selection |

`BRANCH_COLLAPSE_FLOOR` is exported from the same module that owns the comparison bound so the
two cannot drift; if they ever must differ, the served cap wins, because it is a contract and the
floor is a preference.

**The truncation fix.** `compareAllHere` currently takes `.slice(0, 8)` of the eligible set and
says nothing (`DrillScreen.svelte:433-435`). That is a silent absence, which
`design/05-in-run-experience.md:41` forbids. It becomes:

1. order candidates: active branch first, then expanded branches in rail order, then collapsed
   branches in rail order;
2. take the first eight;
3. when the candidate set exceeded eight, render a stated sentence through the shipped
   `HonestControl` reason pattern (`HonestControl.svelte:14-17`): *"{k} branches fork here.
   Comparison renders at most eight columns; the first eight in rail order are selected."*

Collapsed branches sort last so the default selection prefers the undecided ones, which is a view
ordering over an already-computed unary partition — not a ranking, and it carries no sentence
claiming anything about any branch.

### 4. The eval budget

#### 4a. What the shipped system actually spends

Measured against the code, because the owner's worry deserves a real number rather than a
reassurance:

- **One eval job per committed ply, at commit.** `#enqueueMoveEvidence` runs after every learner
  move and every opponent ply (`service.ts:605,643,1723-1731`), with `movetime` defaulting to
  **100 ms** (`strong-engine.ts:10-15`). The queue's default concurrency is **2**
  (`evidence-queue.ts:103`; `application.ts:340-341`).
- **One job per member on group creation**, capped at eight members
  (`service.ts:890`; `docs/branch-groups.md:118`).
- **One job per node on one branch path**, on demand, when a story is opened
  (`#ensureStoryEvidence`, `service.ts:1554-1577`) — already deduplicated against durable,
  failed and outstanding jobs, already disclosure-gated (`service.ts:519`), and already scoped to
  a single branch.
- **Learner-initiated deep analysis**, 1–16 distinct node ids, MultiPV 1–8
  (`service.ts:1040-1065`).
- **Comparison spends nothing.** `compareBranches` derives its evaluation overlay only from
  durable `evidence.attached` events on each path (`compare.ts:179-196`), and
  `Service.compare` enqueues no job (`service.ts:956-975`). This is already the contract
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
| **Lazy, bounded, learner-initiated** | tablebase leaf probe | explicit "classify remaining" action only | ≤8 branch ids per request; ≤1 probe in flight and 4 queued (`tablebase.ts:27`); 512-entry positive LRU with no TTL (`tablebase.ts:29`) |
| **Unchanged** | per-ply eval, story backfill, group seeds, `/analysis` | as shipped | as shipped |

**The free classification's cost ceiling, grounded.** The full transition census — a strictly
heavier computation than this one, since it parses two FENs and builds attack maps per ply —
costs **29.06 µs/ply** (`move-primitive-computability.md:128,392-393`), which is **0.58 ms** for
a 20-ply branch and **4.7 ms** for an eight-branch comparison at 20 plies each (`:136-138`).
Even at 99 branches × 20 plies the census would be ~57 ms; `branchDecidedness` parses no FEN at
all and reads only event types and leaf fields. The relevant envelope is the documented one — at
most 1000 events per run, where a cold replay plus graph transport measures 6.303 / 8.024 /
9.494 ms (`docs/branch-runtime.md:375-380`).

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

- Body: `{ branchIds: string[] }`, 1–8 distinct ids. More than eight → the shipped
  `TOO_MANY_BRANCHES` / 422 (`service.ts:964-968`).
- 200 `{ decidedness: Record<branchId, Decidedness> }`.
- Server behaviour per branch: free grounds always; then, only if
  `feedbackDisclosed(run)` (`feedback.ts:3-20`) **and** `providers.tablebase !== "none"`
  (`capabilities.ts:51`) **and** the leaf FEN has ≤7 pieces, one `LichessTablebaseSource.probe`
  (`tablebase.ts:27`). Otherwise `{ state: "unknown", reason }` with the reason named:
  `withheld`, `provider_unavailable`, or `out_of_range`.
- Probes are deduplicated by the provider's own key (transpose key plus halfmove clock,
  `tablebase.ts:27`), so repeated requests over the same leaf cost one network call ever.
- The route writes nothing: no event, no evidence, no staged result. A tablebase decidedness fact
  is a read, not a durable grounding artifact; making it durable is a separate question (Open
  questions 2).

#### 4d. Pending, and exhaustion mid-set

- **Pending never collapses.** A branch whose class is `unknown` stays in the main view with its
  reason stated. There is no optimistic collapse and no spinner standing in for a fact
  (`design/05-in-run-experience.md:41`).
- **The rail states its own partial knowledge.** The heading count
  (`BranchRail.svelte:20-22`) becomes `{n} branches · {k} folded · {u} not classified`, and the
  unclassified group carries the reason.
- **Provider exhaustion is a stated outcome, not a stall.** A full interactive queue already
  returns `TABLEBASE_UNAVAILABLE` with `retryAfterMs: 4000` (`tablebase.ts:27`), and an outage
  returns it with `60000` (`:29`). Both map to `{state: "unknown", reason:
  "provider_unavailable"}` and the rail renders the retry hint. Half-classified sets are normal.
- **No partial collapse cascade.** A "classify remaining" action that resolves 5 of 8 requests
  collapses those 5 at the next projection boundary and leaves 3 stated as unclassified. It never
  re-orders the rail beyond moving newly collapsed rows into the folded section.

#### 4e. The other budget: the rail's own cost

The UX half of the owner's worry has a measurable cause that is not the engine.
`branchCards(run)` calls `branchPath` once per branch (`screen-model.ts:139-158`), and
`branchPath` filters all of `run.nodes` **and builds a fresh `Map` of every node** on every call
(`branch-path.ts:21-41`). The rail is therefore **O(B·N) with B map allocations**, re-derived on
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

#### 5a. Fold is a view operation

`foldedBranchIds: ReadonlySet<string>`, client-local, persisted per run under
`tabiya:branch-fold:v1:{runId}` — the same versioned-local-preference shape as the shipped
group advance mode (`DrillScreen.svelte:614-615`) and the same status:
*local browser state, not shared run truth* (`docs/branch-groups.md:120`).

Fold is available on **every** branch regardless of decidedness. The learner's own housekeeping
needs no justification and no ground: this is the one place in the product where a person may
remove something from their own view without the product having an opinion. Folding therefore
renders **no explanation sentence at all** — there is nothing to explain, and manufacturing one
would be the manufactured claim law 8 forbids.

Normatively, fold:

- emits **no event** and calls **no endpoint**;
- **cancels no job** and **drops no staged evidence**. The one path that does cancel is
  `onRewound` (`evidence-queue.ts:168-189`), and it is untouched. Folding a branch whose analysis
  is in flight leaves the analysis running and its result durable, because the learner hid a row,
  not an attempt;
- **does not alter the compare selection.** A folded branch that is compare-selected stays
  selected and renders as a full column;
- is visible in aggregate: the rail heading names the folded count and one control restores all.

#### 5b. The erasure check — explicit, because it is a core promise

`design/05-in-run-experience.md:38`: **"An attempt is never destroyed."** Pruning must be a view
operation or it breaks that. Checked against the code rather than asserted:

| Check | Result |
|---|---|
| Is there an event that removes a branch or node? | **No.** The union is `run.started, move.committed, opponent.move_selected, checkpoint.reached, objective.state_changed, evidence.attached, branch.forked, run.rewound, segment.completed, feedback.generated, outcome.reached, transfer.scheduled, prediction.recorded, reasoning.recorded, group.created, feedback.revealed` (`types.ts:270-286`). Nothing deletes. |
| Does rewind erase? | **No.** *"`rewind(nodeId)` changes only the cursor… Existing nodes and branches remain unchanged"* (`docs/branch-runtime.md:82-84`). |
| Does this RFC add a delete path? | **No.** §0 — no new event, no new mutation, no writer lease taken anywhere in §3–§5. |
| Does a folded branch survive projection? | **Yes.** Fold is client state; `run.branches` is unchanged, so `branchPath`, `compareBranches` and the graph route see it exactly as before. |
| Does a folded branch survive export? | **Yes.** `exportPgn(run, branchIds?)` selects from `run.branches` (`pgn.ts:78-85`); fold is not an input to it. |

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

- `BranchRail.svelte` gains: a heading count of the form `{n} branches · {k} folded · {u} not
  classified`; a fold control per row; a collapsed section rendered as one disclosure
  (`<details>`) titled **"Folded — settled outcome"** listing branch label, first move, and the
  single explanation sentence; a "restore all" control; and, when the tablebase capability is
  present and feedback is disclosed, a "classify remaining" control that issues the §4c request.
- The collapsed section reuses the group panel's semantic-zoom band pattern
  (`docs/branch-groups.md:88-97`): overview only. Boards are not rendered for collapsed branches
  — that is the point of collapsing them.
- Existing compare checkboxes, "compare all forked here", switch-on-click and group markers keep
  their current behaviour and keyboard bindings.
- Accessibility: the collapsed section is a labelled disclosure; the count is in the accessible
  name; each collapse explanation is the row's `aria-description`; nothing is hidden from assistive
  technology that is not also hidden visually.

### 7. Defects found while writing this

Both are shipped behaviours, both are in scope for this RFC's implementation, and both need
`design/BACKLOG.md` rows that this draft cannot add (design tier is intent tier — RFC-0000 agent
rule):

- **`compareAllHere` truncates silently.** `.slice(0, 8)` with no statement
  (`DrillScreen.svelte:433-435`) violates *"Absence is stated, never simulated"*
  (`design/05-in-run-experience.md:41`). Fixed in §3d.
- **The branch rail is O(B·N) with B map allocations per projection.**
  `branchCards` × `branchPath` (`screen-model.ts:139-158`; `branch-path.ts:21-41`), re-derived on
  every run mutation (`DrillScreen.svelte:238`). Fixed in §4e.

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
   completes and still attaches.
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
   (`docs/branch-runtime.md:201-207`).
8. **Truncation is stated.** Invoking "compare all forked here" with eleven eligible branches
   selects eight and renders the count sentence; the eight prefer expanded branches.
9. **Register untouched.** `packages/schema/src/index.ts` still reads `0.13` / `0.16`; no
   migration is added; `schemas/` is unchanged; `BranchComparison` has the same fields as
   `compare.ts:98-107` today.

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
3. **Is eight the right floor?** It is imported from the comparison cap for a stated reason
   (§3d), and the owner's number was nine. If the rail turns out to be readable at twelve, the
   floor and the cap must be allowed to differ, and §3d's tie-break ("the served cap wins")
   becomes load-bearing. Answerable only by use, not by argument.
4. **What happens at branch counts the runtime has not characterised?** The documented envelope
   is at most 1000 events per run (`docs/branch-runtime.md:380-383`), and 3000+ event sessions
   are explicitly not accepted (`:396-397`). Ninety-nine branches of twenty plies is ~2000 events
   and sits outside it. This RFC bounds the *rail's* cost at that size (§4e) but does not extend
   the runtime envelope, and the benchmark in acceptance criterion 5 may well surface the
   envelope as the real limit rather than the rail.
5. **Does the unauthored-run default (fold recorded losses) hold for imported games?** An
   imported game's mainline is a recorded loss roughly half the time, and folding the one branch
   the learner came to study would be absurd. The active-branch exclusion in §3a covers the
   common case; whether imported runs should opt out of collapse entirely is unresolved.

## Changelog

- 2026-08-15: created.
