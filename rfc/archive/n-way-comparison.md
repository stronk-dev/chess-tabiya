# RFC: N-way comparison and the review surfaces

- **Status:** implemented
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/03-product-breadth.md` §Review and explore (lines 57–66),
  gate **B3** (line 173), program item **#5** (lines 261–263), the ordering rules
  (lines 25–26 and 65–66), and the Lucas Chess failure mode (lines 282–291)
- **Exploration gate:** owner ruling 2026-08-12 opened the exploration gate
  (`rfc/README.md:114-121`); the breadth sequencing ruling 2026-08-11
  (`rfc/README.md:123-128`) opened B1–B8 RFC planning
- **Depends on:** `archive/branch-runtime.md`, `archive/drill-client.md`,
  `archive/explanation-grounds.md`, `archive/line-drill-theory-grading.md`,
  `archive/outcome-drill-grading.md`, `archive/terminal-outcome-events.md`;
  **`defect-sweep.md`** for D4 and D9 (§11) — independent, either order
- **Parent / amends:** amends `archive/branch-runtime.md` (the comparison payload
  and the branch record), `archive/explanation-grounds.md` (the comparison
  section), `archive/drill-client.md` (the compare surface and checkpoint sheet)
- **Docs amended in the same change** (they describe the two-sided payload
  literally and would become false the moment §1 lands):
  `docs/branch-runtime.md:192-200` (§Compare and PGN export — `compare(run,
  branchA, branchB)` and "move pairs … omitting `a` or `b`") and
  `docs/explanation-grounds.md:33,49-53` ("an `evidence` collection for each
  side", "that side's existing `branchPath`", "present on both sides at offset
  zero"). §1's element-type freeze keeps
  `docs/explanation-grounds.md:36-47,55-63` byte-true; the surrounding prose does
  not survive and is rewritten to the branch-keyed shape
- **Supersedes / superseded by:** —
- **Owner rulings applied (2026-08-13):** prediction checkpoints show **numbers,
  never a verdict** (§8, §8.0, §8.4); **simulated branches are scratch** until the
  learner enters one, which promotes them (§7). Both closed this RFC's two open
  questions.
- **Pack schema:** **0.9** — `grading` removed from `$defs/checkpointInteraction`
  (§8.0), claimed in `rfc/README.md`'s pack-schema register behind
  `pack-studio.md`'s 0.8
- **Planning:** `planning/n-way-comparison/` (once implementing)

## Summary

Branch comparison is pairwise at the **runtime type** level, not merely in the
UI: `BranchComparison` keys `objectiveTimelines`, `checkpointHits` and
`evidence` as `{a, b}` records (`packages/runtime/src/compare.ts:49-64`), and
`compare()` folds exactly two paths (`compare.ts:86-97, 191-229`). REST
(`apps/server/src/rest.ts:737-745`), the browser transport
(`apps/web/src/lib/api.ts:531-539`) and the controller
(`apps/web/src/lib/session-controller.ts:318-334`) all inherit the two-slot
shape, and the selection checkboxes are theater — `compareIds.slice(-1)`
evicts the oldest id on every toggle
(`apps/web/src/lib/DrillScreen.svelte:238`), so two is the hard ceiling.

An N-way overview also **cannot** be assembled from N−1 pairwise calls. Each
call derives `plyOffset` from *its own pair's* fork (`compare.ts:198-211`), so
branches forked at different nodes come back on different axes; laying them
side by side would align unrelated plies and be confidently wrong.

This RFC replaces the pairwise payload with a single-axis, branch-keyed one;
makes manual N-branch selection real; and turns the comparison from a diff of
state names into a **per-branch consequence row** assembled only from facts the
run already holds and rendered only through the sentence functions the three
shipped grading RFCs already ship. It then specifies the resulting-position
grid, N-column difference strips, synchronised replay, narrative mode,
branch-selective export, forward-branching simulate, prediction checkpoints,
and a client-initiated deep-analysis request.

## Motivation

The owner's n=1 walkthrough found two things: manual compare selection is
cumbersome, and **the comparison shows difference without explaining
consequence**. `design/03-product-breadth.md:289-290` names that exact shape as
the Lucas Chess failure mode — "a surface that shows difference without
explaining consequence is a mode-menu entry, not a drill." B3 is therefore not
met by widening a payload from two columns to N. Explaining consequence is a
first-class requirement of this RFC, and §4 is where it is discharged.

The material is already in the tree and simply never reaches the compare
surface. `branchCards()` computes each branch's leaf objective state and
terminality (`apps/web/src/lib/screen-model.ts:118-135`) and the branch rail
renders it (`apps/web/src/lib/BranchRail.svelte:35-37`) — compare does not read
it at all. `resistanceOnPath()` is already path-scoped per branch
(`packages/runtime/src/replay.ts:103-139`), `lineMembership()` already returns
per-node theory verdicts (`packages/runtime/src/line.ts:120-158`), and
`outcome.reached` is already recorded per node
(`packages/runtime/src/types.ts:193-196`, emitted at
`packages/runtime/src/runtime.ts:337-343`). Four shipped sentence tables already
render all of it (`apps/web/src/lib/outcome-presentation.ts:42-125`,
`theory-presentation.ts:5-20`, `evidence-sentences.ts:21-121`).

**In scope:** manual N-branch selection; pairwise and multi-branch comparison
on one axis; the consequence row; resulting-position grids; N-column difference
strips including material; synchronised replay across N boards; narrative mode;
branch-selective PGN export from the UI; forward-branching simulate; prediction
checkpoints; a client-initiated deep-analysis request with MultiPV.

**Explicitly out of scope**, because each is a different contract or belongs to
another program item: default compare selection and branch usefulness scoring
(ruled after manual inclusion by `design/03-product-breadth.md:25-26,65-66`);
branch race and opposite-side/new-defense replay (need program #4's mode
semantics); duplicate-a-run, shareable read-only links and PGN import (B7/B8
run-history contracts); the step-indexed reasoning transcript; authored
strategic claims, timing-window semantics, feedback packets and evidence-bound
LLM rendering (program #2, enumerated as unshipped at
`docs/explanation-grounds.md:207-219`); `intent_capture` interactions, which
carry authored plan classes and belong with program #2's authored contracts.

## Specification

### 1. The single-axis N-way comparison payload

`packages/runtime/src/compare.ts` is amended. `NodeRef` (`compare.ts:4-12`),
`ObjectiveTimelineEntry` (`:20-27`), `CheckpointHit` (`:29-34`),
`ComparisonScore` (`:36-38`) and `ComparisonEvidenceEntry` (`:40-47`) keep their
declarations byte-identical, so `CompareView`'s grounded rendering and the
contract at `docs/explanation-grounds.md:31-63` stay true. `ComparisonPair`
(`:14-18`) is removed and replaced; the `{a, b}` records are replaced by
branch-keyed records.

```ts
export interface BranchColumn {
  readonly branchId: string;
  readonly label: string;
  readonly origin: BranchOrigin;      // §7.4
  readonly ownForkNodeId: string;     // Branch.forkNodeId, types.ts:104
  readonly ownForkOffset: number;     // max(0, ownFork.ply - fork.ply)
  readonly leafNodeId: string;
}

export interface ComparisonRow {
  readonly plyOffset: number;                          // >= 1
  readonly nodes: Readonly<Record<string, NodeRef>>;   // branchId -> node; key absent = that column has no node here
  readonly groups: readonly (readonly string[])[];     // branch ids occupying one and the same node at this offset
}

export interface BranchComparison {
  readonly forkNodeId: string;
  readonly columns: readonly BranchColumn[];
  readonly rows: readonly ComparisonRow[];
  readonly objectiveTimelines: Readonly<Record<string, readonly ObjectiveTimelineEntry[]>>;
  readonly checkpointHits: Readonly<Record<string, readonly CheckpointHit[]>>;
  readonly evidence: Readonly<Record<string, readonly ComparisonEvidenceEntry[]>>;
  readonly lines: Readonly<Record<string, readonly ComparisonLineEntry[]>>;   // §9
  readonly consequences: Readonly<Record<string, BranchConsequence>>;         // §4
}

export function compareBranches(
  run: DrillRun,
  branchIds: readonly string[],
  options?: { readonly pack?: DrillPackDefinition },
): BranchComparison;
```

`compare(run, branchAId, branchBId)` is **removed**, not kept as a wrapper.
Pairwise is `compareBranches(run, [a, b])` and produces a two-column payload of
the same shape. Retaining a second payload shape for the two-branch case is the
exact source-of-truth duplication that produced D4 and D8; one shape is the
point of the change.

**Blast radius, enumerated.** A re-verification pass found the previous draft's
list ("`service.ts:6` and `compare.test.ts`") wrong on the import line and short
by nine sites, four of them tests and two of them living docs. The complete set:

| Site | What breaks |
|---|---|
| `packages/runtime/src/index.ts:15,19,23` | re-exports `compare` and `type ComparisonPair`; both are replaced by `compareBranches`, `BranchColumn`, `ComparisonRow`, `BranchConsequence`, `ComparisonLineEntry` |
| `apps/server/src/service.ts:7` | the `compare` import (not `:6`) |
| `apps/server/src/service.ts:364-373` | the four-argument overload collapses to `compare(runId, principal, branchIds)` |
| `apps/server/src/service.ts:84-113` | `comparisonWithoutEngineFeedback`, §2 |
| `apps/server/src/rest.ts:737-745` | the `branchAId`/`branchBId` body, §2 |
| `apps/web/src/lib/api.ts:346-351,531-541` | the two-argument transport, §2 |
| `apps/web/src/lib/session-controller.ts:39,318-335` | `comparisonBranchIds?: readonly [string, string]` and the tuple-typed call, §2 |
| `apps/web/src/App.svelte:311` | passes `comparisonBranchIds` through to `DrillScreen` |
| `apps/web/src/lib/DrillScreen.svelte:47,68,180-187,202-207,256,416` | the tuple prop, `compareLabels`, `defaultCompareIds`, `comparison.pairs.length`, the `branchLabels` prop, §3 |
| `apps/web/src/lib/CompareView.svelte:26,44,47-51,105-134,218-259` | `branchLabels: readonly [string, string]`, `comparison.pairs.length` twice, and the two hard-coded articles, §5 |
| `apps/web/src/lib/screen-model.ts:221` | `comparison.pairs[step - 1]?.[side]`, §5 |
| `packages/runtime/src/compare.test.ts:86-92` | asserts `pairs`, `pair.a`, `pair.b` |
| `packages/runtime/src/invariants.test.ts:150-162` | the **property** test: calls `compare(run, a, b)` and asserts `pairs[0]` has both `a` and `b`. It is rewritten against `rows`/`nodes`, and gains the group invariant of §1.1 |
| `packages/runtime/src/vertical-scenario.test.ts:100-106` | asserts `pairs[3]` has no `b` |
| `apps/server/src/server.test.ts:140-148` | posts `branchAId`/`branchBId`, asserts `comparison.pairs` has length 2 |
| `apps/server/src/pack-optional-runs.test.ts:119-120,151-152` | posts `branchAId`/`branchBId` twice |
| `docs/branch-runtime.md:192-200` | documents `compare(run, branchA, branchB)` and "move pairs … omitting `a` or `b`" as shipped behaviour |
| `docs/explanation-grounds.md:33,49-53` | documents "an `evidence` collection for each side" and "both sides at offset zero" |

The two docs are the answer to "does anything outside code depend on the old
payload shape": yes, and they are canonical descriptions of what exists, so they
move in the same change rather than being left describing a payload that no
longer exists.

#### 1.1 The axis rule — normative

This is the load-bearing correction and every clause is binding.

1. **One fork for the whole set.** `forkNodeId` is the deepest node present on
   *every* selected branch's `branchPath` — a single fold over N paths,
   generalising `commonFork` (`compare.ts:86-97`). It is never derived pairwise.
2. **One axis.** Every `plyOffset` in `rows`, `objectiveTimelines`,
   `checkpointHits`, `evidence`, `lines` and `consequences` is
   `node.ply - fork.ply`, computed against that one fork. Offset `0` is the set
   fork and is shared by all columns by construction.
3. **Composition is forbidden and impossible.** No surface may build an N-way
   view from repeated two-branch calls. The type makes it unavailable: there is
   no pairwise payload left to compose.
4. **The axis may contain a shared prefix.** Because the set fork can be
   shallower than some pair's own fork, two columns may occupy the *same node*
   at low offsets. `ComparisonRow.groups` partitions the columns present at that
   offset by node id. A renderer **MUST** draw one cell per group, not one per
   column, and **MUST NOT** count a shared node as a difference.
5. **`groups` is a partition, and that is what makes it safe to render.** Three
   invariants, all asserted by A1a, because a renderer that merges cells on a
   weaker guarantee can merge two *different* nodes into one:
   - every key of `nodes` appears in exactly one group, and no group contains a
     branch id absent from `nodes` — so the groups exactly cover the columns
     present at that offset;
   - all members of a group have the identical `nodes[branchId].id`, and members
     of two different groups never do — grouping is by node identity and by
     nothing else, so a merged cell is provably one node;
   - a group of one is the ordinary case, and groups are emitted in the order
     their first member appears in `columns`, so column order is stable across
     rows and a renderer never has to re-sort.

   Entries in `objectiveTimelines`, `checkpointHits`, `evidence` and `lines`
   carry `nodeId` and `eventSeq`/`plyOffset`. An entry on a shared node is
   genuinely present in the record of every column in that group, so a renderer
   drawing a group cell **MUST** deduplicate by `eventSeq` (or by `nodeId` for
   `evidence` and `lines`, which carry no seq) rather than stacking one copy per
   member. Entries at offset `0` are on the set fork and are shared by all
   columns.
6. **`ownForkOffset` is the decision offset.** The move that made a column
   distinct is its first node at an offset greater than `ownForkOffset`.
7. **Set membership is part of the result, not a view over a fixed axis.**
   Adding a branch to the set can move the fork shallower, which changes the
   `plyOffset` of every node on every column already selected. This is correct
   and is the direct consequence of clause 1; it means `plyOffset` is meaningful
   only within one `BranchComparison`, and no consumer may cache an offset
   across two calls with different `branchIds`. The client re-requests the whole
   payload on every selection change and holds no offset state of its own —
   `compareStep` (`DrillScreen.svelte:85`) is reset to `0` whenever the selection
   changes, for exactly this reason.

Worked case that acceptance must cover: branches `X` and `Y` forked from node
`F1`, branch `Z` forked from the shallower node `F0`. `compareBranches(run, [X,
Y, Z])` returns `forkNodeId = F0`; `X` and `Y` share every node from offset 1 up
to `F1`, which `groups` reports as `[[X, Y], [Z]]`; `X.ownForkOffset ===
Y.ownForkOffset === F1.ply - F0.ply` and `Z.ownForkOffset === 0`. Two pairwise
calls (`X,Y` on `F1` and `X,Z` on `F0`) return offsets on different axes and
must not be reconcilable — the acceptance test asserts the shared-prefix rows
are grouped rather than triplicated.

#### 1.2 Set size, duplicates, and the common-fork error

Re-verification finding that corrects the dossier: `NO_COMMON_FORK`
(`packages/runtime/src/branch-path.ts:4,35-38`, `compare.ts:93-95`) is
**unreachable for well-formed runs**. `branchPath` walks `parentId` to `null`
(`branch-path.ts:21-40`), so every path in a run begins at the same root node
and a common fork always exists. It stays as a corruption guard mapped to 422
by `rest.ts:349-352`; it is not a product path and the UI must not be built
around it.

The real constraints are set size and identity:

- fewer than 2 distinct ids → `400 INVALID_REQUEST`;
- a repeated id → `400 INVALID_REQUEST` (a column may not be compared to itself);
- an unknown id → `404 UNKNOWN_BRANCH` (shipped mapping, `rest.ts:349-352`);
- more than **8** ids → `422 TOO_MANY_BRANCHES`.

**Eight is this RFC's number and nothing else's.** The previous draft attributed
it to `design/03-product-breadth.md`; re-verification found no such statement —
the only "eight" in that document is "all eight program items" (line 183), which
is unrelated. The cap is asserted here on its own grounds: eight columns is the
point past which §5's resulting-position grid stops being readable at one
screen, and a cap chosen now is a cap the client can render an honest reason for
rather than one discovered in use. It is not a data-integrity limit and it
rebases freely if the grid layout later argues for a different number.

**The error codes do not exist yet, and the shipped mapping is closed.**
`ServerErrorCode` is a closed union (`apps/server/src/errors.ts:1-14`) and
`errorResponse` maps a fixed set of codes with a fall-through to **500**
(`rest.ts:343-377`); `BranchQueryError["code"]` is `"UNKNOWN_BRANCH" |
"NO_COMMON_FORK"` and nothing else (`branch-path.ts:4`). A new code that is
simply thrown therefore surfaces as a 500, which is the failure this paragraph
exists to prevent. Concretely:

- `TOO_MANY_BRANCHES` joins `ServerErrorCode` and gains a `422` arm in
  `errorResponse`'s `ServerError` chain, carrying `{ count, limit }` in
  `details`. It is **not** added to `BranchQueryError`: that class is a runtime
  concern and its two codes both mean "this run's graph cannot answer you",
  which a set-size limit does not.
- `INVALID_REQUEST` already maps to `400` (`rest.ts:361-362`) and already has the
  `invalid()` helper, so the two identity rules need no new code.
- Every other code this RFC introduces — `NO_AUTHORED_VARIATIONS` (422),
  `SIMULATE_TOO_LARGE` (422), `SIMULATION_EXPIRED` (**410**, a status the shipped
  chain does not currently produce at all), `SIMULATE_BUDGET_EXCEEDED` (422) —
  joins the same union and the same chain in the same change. R3's first commit
  is that widening, before any route exists to throw them.

A selected branch whose leaf **is** the set fork (forked, never moved) is legal.
It contributes a column with no nodes at any offset and its consequence row
reports `decision: null`. It is rendered as "no moves on this branch yet", never
as an error.

### 2. Transport, service, and withholding

**REST** (`apps/server/src/rest.ts:737-745`). `POST /runs/:id/compare` accepts
`{ branchIds: string[] }` with length 2–8, and keeps the shipped `{ comparison }`
response envelope (`rest.ts:738`) so only the payload's interior changes. The
`branchAId`/`branchBId` body is removed; there is no compatibility shim, for the
reason in §1. `compare` is already a member of `parseRunRoute`'s action
allowlist (`rest.ts:393`), so this route needs no parser change — §7's do.

**Transport** (`apps/web/src/lib/api.ts:346-351, 531-541`).
`compare(runId, branchIds: readonly string[]): Promise<BranchComparison>`.

**Controller** (`apps/web/src/lib/session-controller.ts:318-335`).
`compare(branchIds: readonly string[])`; the session field
`comparisonBranchIds` (`session-controller.ts:39`) widens from
`readonly [string, string]` to `readonly string[]`, and the three sites that
clear it (`:293, :338, :482`) are unchanged because `undefined` still means "no
comparison open". `closeCompare()` is unchanged.

**Withholding.** `RunService.compare` (`service.ts:364-373`) keeps the shipped
gate: when `!feedbackDisclosed(run)` it returns
`comparisonWithoutEngineFeedback(comparison)` (`service.ts:84-113`). That
function is amended to (a) map over the branch-keyed records instead of `a`/`b`,
(b) empty `lines` as well as `evidence`, and (c) apply the reveal rule to the
consequence row per §4.3. This is one gate in one place; no client-side hiding
is permitted anywhere in this RFC, which is the D2 lesson.

### 3. Manual N-branch selection

`design/03-product-breadth.md:65-66` rules that manual inclusion works first and
default selection and scoring optimise it afterwards. This RFC implements only
the manual half.

**Selection state.** `DrillScreen.svelte:84` keeps `compareIds: string[]`;
`toggleCompare` (`:234-240`) drops the `slice(-1)` eviction at `:238` and simply
adds or removes the id, refusing an add that would exceed 8. The eviction line is
the whole bug and its removal is the whole fix. `compareStep` (`:85`) resets to
`0` on every change to `compareIds`, per §1.1 clause 7.

**Two shipped shapes have to widen first**, and the previous draft assumed both:

- `BranchCard` (`screen-model.ts:118-135`) carries `id`, `label`, `intent`,
  `firstMove`, `leafNodeId`, `objectiveState` and `terminal` — **no
  `forkNodeId`**, so "compare all forked here" cannot be computed from what the
  rail holds. `branchCards()` gains `forkNodeId: branch.forkNodeId`
  (`types.ts:104`), which it already has in hand at `screen-model.ts:119`.
- `BranchRail`'s `Props` (`BranchRail.svelte:4-10`) has `branches`,
  `activeBranchId`, `compareIds`, `onSwitch` and `onToggleCompare` and no way to
  express a heading control. It gains `activeForkNodeId: string`,
  `onCompareAllForkedHere: () => void` and `onClearSelection: () => void`. The
  rail computes nothing; `DrillScreen` owns the selection, as it does today.

**Rail affordances** (`BranchRail.svelte:39-46`). The existing per-branch
checkbox is kept and gains an accessible name — `aria-label={`Include ${label}
in comparison`}` on the `<input>` at `:40-44`, replacing the bare "compare" text
node at `:45` as the label. No `aria-checked` is added: the element is a native
`input[type=checkbox]` whose `checked` binding (`:42`) already exposes state, and
an ARIA override on a native control is the accessibility bug this line avoids.
Two new controls are added to the rail heading (`:17-20`):

- **Compare all forked here** — selects every branch whose `forkNodeId` equals
  the deepest fork node on the cursor's path, plus the cursor branch. This is
  the direct answer to the walkthrough's "selection is cumbersome" finding. It
  is the same *shape* of set simulate produces, but not the same set: a
  simulation's variations are scratch and are never in the rail at all until one
  is promoted (§7), so this control only ever selects branches the learner
  actually holds.
- **Clear selection**.

Both are `HonestControl`-wrapped when unavailable, matching the shipped pattern
(`DrillScreen.svelte:486-499`), with a stated reason rather than a dead button.

**Opening compare.** `defaultCompareIds()` (`DrillScreen.svelte:202-207`) is
replaced by `selectedCompareIds()`: it returns `compareIds` when at least two
are held, otherwise the cursor branch plus the first other branch (the shipped
fallback at `:204-206`, preserved so the existing keyboard flow keeps working).
The return type widens from `readonly [string, string]` to `readonly string[]`;
`openCompare()` (`:209-212`) is otherwise unchanged.

**Labels.** `compareLabels` (`DrillScreen.svelte:180-187`) is removed, and with
it the `branchLabels` prop it feeds (`DrillScreen.svelte:416`,
`CompareView.svelte:26,33`). Labels travel in `BranchColumn.label`, so the
compare view no longer re-derives them and can no longer disagree with the
payload.

### 4. Explaining consequence, not difference

Today the compare surface renders *what changed* — objective transitions,
checkpoint hits, an aligned centipawn strip. It never states what a branch cost
or bought. This section makes that a payload obligation.

#### 4.1 `BranchConsequence`

Computed in the runtime (never in the client — see §4.3) and keyed by branch id:

```ts
export interface BranchConsequence {
  readonly branchId: string;
  readonly decision:
    | { readonly nodeId: string; readonly plyOffset: number;
        readonly moveSan: string; readonly moveUci: string }
    | null;                                          // null when the branch has no move of its own
  readonly plies: number;                            // nodes strictly below the set fork
  readonly objectiveState: ObjectiveState;           // leaf node state, types.ts:96
  readonly terminal: boolean;                        // achieved | failed | transitioned
  readonly outcome: RunOutcome | null;               // outcome.reached on this path below the fork
  readonly resolvedAtCheckpointId: string | null;    // checkpoint whose reach carried the last transition
  readonly checkpointsReached: readonly string[];
  readonly checkpointsMissed: readonly string[];     // reached by another selected column, not by this one
  readonly deepestScore:
    | { readonly plyOffset: number; readonly score: ComparisonScore }
    | null;
  readonly resistance: PathResistance;               // resistanceOnPath(run, leafNodeId), replay.ts:103
  readonly theory: readonly TheoryVerdictItem[] | null;
}
```

- `decision` is the first node on this column at an offset greater than
  `ownForkOffset` — the move that made this branch this branch.
- `outcome` reads `outcome.reached` events whose `nodeId` lies on this column's
  path below the fork (`types.ts:193-196`, projected at
  `packages/runtime/src/events.ts:163-186`).
- `checkpointsMissed` is the union of `checkpointsReached` across the selected
  columns minus this column's own. It is the only genuinely *comparative* field
  in the payload, and it states set membership, not quality.
- `deepestScore` is the `ComparisonEvidenceEntry` on this column with the
  greatest `plyOffset`, carried **with its offset**. No delta between columns is
  computed anywhere, preserving `docs/explanation-grounds.md:173-176` ("The view
  does not compute or claim a branch delta"). Two columns' deepest scores may
  sit at different offsets and the renderer must show both offsets.
- `theory` reuses the shipped `theory_verdict` member of `AuthoredFeedbackItem`
  (`apps/server/src/authored-feedback.ts:53-61`) so the client renders it with
  the shipped `theoryVerdictSentence` unchanged. It is derived from
  `lineMembership(pack, run, leafNodeId)` (`line.ts:120-158`).

#### 4.2 Rendering — no new vocabulary

Every consequence sentence is produced by a function that already ships. This is
the rule the brief requires and it is what keeps ADR-0005 / law 8 intact:
comparison renders validated evidence and authored labels; it never grades.

| Fact | Renderer, already shipped |
|---|---|
| objective end state | `objectiveGradeSentence(pack.objective.type, state)` — `outcome-presentation.ts:105-112` |
| resolution at a checkpoint | `checkpointResolutionSentence(label, state)` — `outcome-presentation.ts:114-125` |
| root claim and its grounding | `assessmentSentence(projectedGrading(pack))` — `outcome-presentation.ts:42-53` |
| terminal result | `renderEvidenceRef(rulesEvidenceRef("result-" + outcome), pack)` → the fixed `result-win/loss/draw` sentences — `evidence-sentences.ts:28-30, 90-121` |
| resistance faced | `resistanceSentences(run, leafNodeId)` — `outcome-presentation.ts:60-103`, already ending in "Not perfect play." |
| theory verdicts | `theoryVerdictSentence(item, run)` and `UNKNOWN_THEORY_NOTE` — `theory-presentation.ts:5-20` |
| objective transition grounds | `renderEvidenceRef(ref, pack, payloads)` — `evidence-sentences.ts:90-121` |
| recorded engine score | `scoreLabel` in `CompareView.svelte:85-91`, unchanged |

Exactly **one** new fixed sentence is added, for `checkpointsMissed`, because no
shipped table expresses a negative:

> `Checkpoint not reached on this branch: <authored label>.`

It states the absence of a checkpoint id from a path — a pack fact of the same
class as the existing `Checkpoint reached: <label>.`
(`evidence-sentences.ts:53-63`) — and carries no judgement.

"Added to the same table" needs a reference to be keyed on, and the previous
draft did not supply one: `evidenceSentenceTable` is a `Map` keyed by evidence
reference (`evidence-sentences.ts:42-73`) and the only checkpoint key that exists
is `packEvidenceRef(id)` → `pack:${id}` (`packages/runtime/src/evidence-ref.ts:41-43`),
which already means *reached*. So:

- `evidence-ref.ts` gains `packAbsentEvidenceRef(checkpointId)` →
  `pack-absent:${id}`, beside `packEvidenceRef`, with `PackEvidenceRef`'s sibling
  type and the `index.ts:48` re-export;
- `evidenceSentenceTable`'s checkpoint loop (`:53-63`) emits a second entry per
  checkpoint under that key, text
  `Checkpoint not reached on this branch: ${checkpointLabel(checkpoint)}.`,
  `sourceLabel: "Pack"`, reusing the shipped `checkpointLabel`
  (`evidence-sentences.ts:36-39`) so the label falls back to the id exactly as the
  reached form does;
- **`pack-absent:` references are render keys and are never persisted.** No
  `evidence.attached`, no `node.evidenceRefs` and no
  `objective.state_changed.evidenceRefs` may ever contain one. An absence is not
  a recorded fact about a position; it is a statement about a path in one
  comparison, and writing it into the run would manufacture evidence.
  `isEngineEvidenceRef` (`evidence-ref.ts:53`) does not match it, so it is
  unaffected by the reveal gate and correctly so — §4.3 keeps
  `checkpointsMissed` present before reveal.

**Prohibition, normative.** No field of `BranchComparison` and no rendered
sentence may order, score, rank, recommend, or describe any branch as better,
worse, best or worst than another. `deepestScore` is per column and is never
differenced. Anything stronger requires program #2's authored claims, which
`docs/explanation-grounds.md:207-219` lists as unshipped; B3 renders that packet
when it exists and must not synthesise it in its absence.

#### 4.3 Where it is computed, and the reveal gate

`consequences` is computed server-side inside `compareBranches` and filtered by
`comparisonWithoutEngineFeedback` before reveal. Client-side computation is
forbidden for two reasons, both verified:

- `deepestScore` derives from engine evidence, which the shipped gate empties
  (`service.ts:84-113`, `feedback-policy.ts:10-51`). Recomputing it in the
  browser would rebuild the withholding decision in a second place — the D2
  shape.
- `theory` cannot be computed in the browser at all: `projectPackDocument`
  (`pack-registry.ts:58-89`) never projects `deviations` or `authoredBoundary`,
  and strips `spine` entirely for `mode: "line"` (`:81`). `lineMembership`
  requires all three.

Before reveal, `deepestScore` is `null` and `theory` is `null` for every column;
`objectiveState`, `terminal`, `outcome`, `decision`, `checkpointsReached`,
`checkpointsMissed`, `plies` and `resistance` are always present, because they
are rules facts and pack-boundary facts, not engine feedback — the same
distinction `feedback-policy.ts:26-31` already draws.

### 5. The review surfaces over the N-way payload

`CompareView.svelte` is generalised from two hard-coded articles to N columns.
Its heading text "Same decision, two consequences."
(`CompareView.svelte:100`) becomes "Same decision, `{n}` consequences."

**Consequence rows** are the primary content and lead the view, above the
existing trajectory grid — one block per column carrying §4.2's sentences.

**Resulting-position grid.** One disabled `Chessboard` per column at that
column's leaf FEN, reusing the shipped board block (`CompareView.svelte:105-134`)
and its "Line ended" placeholder (`:117,:131`). It needs no new runtime data:
the leaf FEN is `branchPath(run, id).at(-1).fen`. The grid and the stepper
boards are the same component in two modes — `leaf` and `step`.

**Synchronised replay.** One step index drives all N boards.
`comparisonNode(run, comparison, step, side)` (`screen-model.ts:212-225`)
becomes `comparisonNode(run, comparison, step, branchId)`, reading
`comparison.rows[step - 1]?.nodes[branchId]` and `comparison.forkNodeId` at step
0. `stepTimeline` (`DrillScreen.svelte:252-258`) bounds on
`comparison.rows.length` in place of `comparison.pairs.length` at `:256`, and
`maxStep` (`CompareView.svelte:44`) with it. The per-column "Line ended" marker
already exists and generalises unchanged.

**Difference strips.** The objective and checkpoint strips
(`CompareView.svelte:218-259`) become N columns. Two strips are added that are
deterministic rules facts derivable from each node's own FEN — every `Node`
carries one (`packages/runtime/src/types.ts:88`) — and are computed in the
runtime alongside the rows, never in the client:

- **material** — the material balance at the column's node for each offset,
  White-perspective, matching the run's existing convention
  (`docs/explanation-grounds.md:56-59`);
- **structure** — pawn-file occupancy per side, the deterministic structural
  fact, stated as counts and never as a named structure. `design/03` separates
  the two deliberately: "deterministic structural, temporal, and phase features"
  (line 127) is one evidence layer and "phase/structure recognition" (line 128)
  is the next one down. Naming a structure is the second, and it is a separate
  contract this RFC does not open.

Both are added as a `strips` record keyed by branch id, of entries carrying
`plyOffset` and the fact. Group members (§1.1 clauses 4–5) are drawn once, and
deduplicated by `nodeId` rather than stacked per member.

**Narrative mode.** A reading-order projection of the *same* payload, adding no
evidence: set fork position → each column's `decision` → the lowest offset at
which the columns' objective timelines or checkpoint hits diverge → each
column's consequence row. It is a toggle on the compare view, and every sentence
comes from §4.2's table. Because it renders the identical data, a narrative view
that could say something the strip view cannot is a bug.

**Standalone Review route.** `/review` is currently a stub that says standalone
comparison is not part of the shell release (`apps/web/src/App.svelte:331`,
`docs/app-shell.md:34-36`). This RFC leaves that boundary where the shell RFC
put it: compare stays inside the run. Extending it is B7's run-history work.

### 6. Branch-selective PGN export from the UI

Export is already N-way at both the runtime (`packages/runtime/src/pgn.ts:74-75`)
and the route (`GET /runs/:id/pgn?branches=a,b`, parsed at `rest.ts:415-423`,
served at `:605-616`). The only gap is that the UI never passes ids:
`SessionController.exportPgn()` (`session-controller.ts:341-343`) calls
`this.#api.pgn(runId)` with no argument, so every export is the whole run.

`exportPgn(branchIds?: readonly string[])` forwards to the shipped
`api.pgn(runId, branchIds)` (`api.ts:352, 576-589`). `DrillScreen`'s export
action (`:503`, keyboard `e` at `:379`) passes the current selection when the
compare view is open or the rail holds a selection, and passes nothing
otherwise. The same selection state therefore drives compare and export, which
is the whole point of making it real.

### 7. Forward-branching simulate — scratch until entered

At a spine node with N authored variations, one action walks each authored line to
its end so the learner sees the resulting positions side by side in §5's grid. It is
authored playout with zero engine calls, consistent with
`design/03-product-breadth.md:22-26` and law 8.

**Owner ruling, 2026-08-13: simulated branches are scratch.** The previous draft made
them real branches in the run graph and put the question to the owner; the answer is
that a run's record is what the learner *did*, and a demonstration the learner merely
looked at is not that. A simulation is discarded unless the learner **enters** one,
which **promotes** it to a real branch. This is the ruling the section is now built
around rather than a projection choice layered on top of persistence.

#### 7.1 Routes and preconditions

| Method | Path | Effect |
|---|---|---|
| `POST` | `/runs/:id/simulate` | walk the authored variations; **write nothing** |
| `POST` | `/runs/:id/simulate-enter` | promote one walked variation to a real branch |

Both require the writer lease (the shipped `#forWrite` helper,
`service.ts:617-619`, as `move` uses at `:251`, `opponentPly` at `:275` and
`fork` at `:324`).

**The router will not accept these paths as drafted, and the previous draft's
`/simulate/enter` cannot be expressed at all.** `parseRunRoute`
(`rest.ts:392-403`) matches `^/runs/([^/]+)/(moves|rewind|fork|graph|compare|events|evidence|authored-feedback|pgn|grants|lease|reveal)$`
— a **closed allowlist of exactly one path segment**. Two consequences, both
handled here rather than found in implementation:

- every route this RFC adds is a new alternative in that group:
  `simulate`, `simulate-enter`, `prediction` (§8.2) and `analysis` (§9);
- `/runs/:id/simulate/enter` has two segments after the run id and the regex is
  anchored, so it would 404 no matter what the allowlist said. The promotion
  route is therefore **`/runs/:id/simulate-enter`**. Widening the regex to accept
  nested actions is rejected: `parseRunRoute` returns a flat `{ runId, action }`
  that the whole POST dispatch switches on, and a second segment would have to be
  threaded through every arm to serve one route.

The cursor node's position is matched to the pack spine using the shipped
`spinePositionIndex` / `spineNodeIdFor` (`packages/runtime/src/line.ts:56,86`),
already used for the timeline at `screen-model.ts:100,103`. If the run has no
registered pack, the node is off-spine, or the matched spine node has fewer than
two children → `422 NO_AUTHORED_VARIATIONS` (new code, §1.2).

#### 7.2 The walk writes nothing

`POST /runs/:id/simulate` walks an **in-memory clone** of the run. It appends no
event to the stored run, writes no snapshot, and persists nothing at all; if the
learner closes the tab, the simulation never existed. Three consequences follow, and
two of them are guards the previous draft had to specify and no longer does:

**Guard 1 — zero evidence jobs — survives, and is now structural.** Every committed
move enqueues one Stockfish job today: `RunService.move` calls
`#enqueueMoveEvidence` at `service.ts:260` (and `opponentPly` at `:284`), which
unconditionally enqueues an `eval` job (`service.ts:626-648`). An unguarded
4-variation × 12-ply simulate submits 48 analysis jobs the learner never asked for.
Simulate is therefore a **server-side batch**, not a client loop over
`POST /runs/:id/moves` — a client loop physically cannot avoid the enqueue, because
it sits inside `RunService.move`. The batch calls `commitMove` and
`orchestratePackMove` on the clone directly and calls `#enqueueMoveEvidence` **zero
times**. It also does not call `#requiredEvidenceQueue()`, which `move` invokes at
`service.ts:253` and which *throws* when no queue is configured: a demonstration of
authored moves must not require an engine deployment to run at all.

The deliberate consequence, stated rather than discovered: simulated branches carry
**no engine evidence**, so their trajectory cells and `deepestScore` are empty. That
is honest — the pack demonstrated these lines, nobody analysed them. A learner who
wants evidence enters the branch and plays on, or requests deep analysis (§9).

**Guard 2 — compute bounds, not event bounds.** Because nothing is written, the
1000-event envelope (`docs/branch-runtime.md:340`) is not at risk during the walk and
the projected-event budget the previous draft computed is deleted. What remains
bounds work, not storage:

- at most **8** variations per call;
- at most **40** committed plies per call across all variations.

Violation → `422 SIMULATE_TOO_LARGE` with `{ variations, plies }` in the details.

**No rewind is needed.** The previous draft closed the walk with
`rewind(run, nodeId)` to undo its own mutation. The clone is discarded instead, so
the real run's cursor never moved and there is nothing to restore — one whole class
of "the cursor ended up somewhere surprising" bug does not exist.

#### 7.3 The walk

For each authored child `c` of the matched spine node, in authored order, on the
clone:

1. `fork(clone, nodeId, { label: c.moveSan, intent: "Authored variation " + c.id,
   origin: "simulated" })` — `runtime.ts:360-365`; `appendBranch`
   (`runtime.ts:117-128`) moves the cursor to the new branch. **`ForkOptions`
   does not have an `origin` field today** — it is `{ label?, intent?, at? }`
   (`runtime.ts:66-70`) — so `ForkOptions` gains `origin?: BranchOrigin` and
   `nextBranch` writes `options.origin ?? "played"` onto the `Branch` it
   constructs, in the same change as §7.4's type. The route body
   (`parseForkOptions` in `rest.ts`) is **not** widened: `origin` is set by the
   simulate batch and by promotion, never by a client-supplied field, or a caller
   could label a hand-played branch as authored.
2. Walk `c` and then its `children[0]` chain to the end, committing each ply
   with `commitMove(clone, uci, { actor: "system" })`. `"system"` is the **only**
   honest actor and this is verified twice over: `commitMove` rejects
   `actor: "opponent"` without an authoritative selection
   (`runtime.ts:263-268`), and `opponentMovesFromEvents` throws `ReplayError`
   on any opponent commit lacking an adjacent `opponent.move_selected`
   (`replay.ts:68-83`), which would corrupt read-back replay for the whole run.
   `"user"` would falsely claim the learner played it. `parseMoveOptions`
   already accepts `"system"` (`rest.ts:304-313`) and `Actor` already includes
   it (`types.ts:3`). The actor rule matters more under scratch, not less: the
   clone's events are the exact events promotion will replay.
3. `orchestratePackMove` runs on every ply exactly as it does in play, so
   checkpoints fire and the objective grades on the demonstrated line. This is
   what makes simulate explain consequence rather than just show positions.
4. The walk stops early and honestly at the first ply that would raise
   `RUN_TERMINATED` (`runtime.ts:277-279` — a terminal objective state or an
   ended position). Plies committed so far are kept and the response reports
   `truncatedAt`.
5. A spine node with more than one child mid-line is an authored sub-variation;
   the walk takes `children[0]` and the response reports
   `subvariationsSkipped`. Silently walking one path without saying so is the
   never-silent violation.

Response: `{ simulationId, comparison, branches: [{ index, label, leafFen, plies,
truncatedAt?, subvariationsSkipped? }] }`. `comparison` is an ordinary
`BranchComparison` (§1) computed over the clone, so §5's grid, strips and narrative
mode render a simulation with **no branch of their own** — they receive the shape
they already receive.

`simulationId` names the clone in a process-lifetime, per-run, writer-scoped
ephemeral map. It has no persistence and needs none: if the process restarts or the
entry is evicted, `enter` returns `410 SIMULATION_EXPIRED` and the client re-runs
simulate, which is deterministic — the same pack node and the same authored children
produce the same walk.

#### 7.4 Promotion, and `Branch.origin` as its marker

`POST /runs/:id/simulate-enter`, body `{ simulationId, branchIndex }`, replays that
one walked variation onto the **real** run: one `branch.forked` carrying
`origin: "simulated"`, then its `move.committed` plies with `actor: "system"`, then
whatever `orchestratePackMove` emits for each — the same events the clone produced,
for the one variation the learner chose. The cursor is left at the branch leaf,
because the learner asked to be there. The other N−1 variations are discarded.

The event budget lives here, where events are actually written: `run.events.length`
plus the promoted variation's event count must not exceed **800**, leaving headroom
for continued play, else `422 SIMULATE_BUDGET_EXCEEDED` with
`{ plies, events, limit }` and **no** mutation. One variation instead of eight makes
this bound essentially unreachable in practice, which is the point.

`Branch` (`packages/runtime/src/types.ts:102-108`) gains
`readonly origin: BranchOrigin` where `BranchOrigin = "played" | "simulated"`.

**It is a promotion marker, not a persistence filter.** Under the previous draft
`origin` was the field every consumer would filter on to decide whether a branch
belonged in history, export or the rail; scratch removes that job entirely, because a
branch that was not entered never reaches any of them. What `origin` records now is
narrower and permanent: *this branch's moves are the pack's authored line, played by
the system, entered by the learner.* Nothing filters on it. Consumers **render** it:

- `appendBranch` defaults to `"played"`; only promotion writes `"simulated"`;
- the branch rail marks a promoted branch distinctly, so the learner can tell which
  of their branches they chose move by move and which they stepped into whole;
- `exportPgn` writes `Tabiya branch (simulated): ${branch.label}` (`pgn.ts:93`), so
  the provenance survives into the artifact;
- `BranchColumn.origin` carries it into the comparison;
- `pack-studio.md` §6's distiller skips promoted branches when proposing deviations,
  because entering a demonstration is not deviating from it.

Encoding it in the label string instead was rejected: `exportPgn` writes
`Tabiya branch: ${branch.label}` as a PGN comment, the rail and run history render
the label, and a prose convention would force every consumer to parse it.

This is a run-schema change — see §10.

### 8. Prediction checkpoints — numbers, never a verdict

**Owner ruling, 2026-08-13.** The learner predicts, then sees where their move sat:

> *You said c4. 12% of 1500s play it; 42% play Qb6.*

No pass, no fail, no correct or incorrect. The checkpoint is an instrument for
showing the learner a distribution they did not know, positioned by their own guess.
It is not an exam, and nothing in this system is entitled to grade a chess move
against a human-frequency model anyway — a move played by 12% of the rating band is
not thereby a mistake.

Two things follow immediately and are specified below rather than left as
consequences: `minMass` stops being a grading threshold, and `grading.source` has
nothing left to grade.

The authored half already ships in part: `CheckpointInteraction`
(`packages/schema/src/drill-pack/types.ts:58-71`) with `grading { source, topK,
minMass }` and `flipBoard`; the field on `CheckpointDefinition` (`:76`); the living
example's `predict-reply` checkpoint (`schemas/drill_pack.example.json:84-93`); and
mechanical sparsity — `TOO_MANY_PREDICTIONS` warns above two per segment
(`packages/schema/src/drill-pack/lint.ts:229-242`).

#### 8.0 `grading` is removed from the pack schema — pack schema 0.9

`grading` is **removed**, not narrowed to a display hint. Taking its three fields in
turn:

| Field | Why it does not survive |
|---|---|
| `source` | it declared what to grade against. Nothing is graded. `"engine"` and `"both"` were never backed in any case — **both** shipped Stockfish specs boot at `MultiPV: 1`: the play spec from `DEFAULT_STRONG_ENGINE_PROFILE` (`apps/server/src/strong-engine.ts:10-15`, applied at `:55`) and the judge spec literally (`apps/server/src/application.ts:189`). `candidateLines` (`opponent-selector.ts:218`) therefore yields one move and there is no ranked engine set at all |
| `minMass` | it was the threshold that made a prediction right or wrong. As a *display* hint it would hide candidates below a cutoff — which is a verdict wearing a rendering costume, and the worst version of one, because the learner cannot see what was hidden |
| `topK` | a genuine display cap, and still not worth keeping: the recorded candidate list is Maia policy over a handful of moves, `TOO_MANY_PREDICTIONS` already governs sparsity, and a new authored field with one consumer and no evidence anyone wants it is the format growth §14 of `pack-studio.md` exists to refuse |

After this RFC the prediction interaction is `{ type: "prediction", flipBoard? }` and
its `required` is `["type"]`.

This is a **pack-schema change**, which the previous draft did not carry and which
`rfc/README.md`'s pack-schema register already anticipated: this RFC takes **pack
schema 0.9**, behind `pack-studio.md`'s 0.8. `$defs/checkpointInteraction`'s
prediction branch is `additionalProperties: false`, so
`schemas/drill_pack.example.json:90`'s `"grading": {...}` line is deleted in the same
change; the example's bytes and digest change and every assertion recording that
digest moves with them. No other committed pack declares a prediction interaction —
verified across `content/`, `schemas/fixtures/` and `content/candidates/` — so the
example is the only document affected.

`CheckpointInteraction` in `packages/schema/src/drill-pack/types.ts:58-71` loses the
`grading` member in the same change.

#### 8.1 Delivery

`projectPackDocument`'s checkpoint projection (`pack-registry.ts:82-87`) emits only
`{id, label, actions}`. It gains, for prediction checkpoints only:

```ts
interaction: { type: "prediction", ...(flipBoard ? { flipBoard: true } : {}) }
```

That is now the whole interaction, so nothing is withheld and the previous draft's
"`grading` is never projected" rule has nothing to apply to. `intent_capture` is
still not projected at all — `planClassIds` names authored plan classes, which is
authored content under program #2's reveal contract.

**Two shipped assertions move, not one.** The previous draft named only the
`not.toHaveProperty("interaction")` line
(`apps/server/src/drill-client-server.test.ts:182`); the line above it,
`expect(Object.keys(checkpoint).sort()).toEqual(["actions", "id", "label"])`
(`:180`), is the stricter of the two and fails on the same change. Both are
amended to assert the exact projected shape — `["actions", "id", "interaction",
"label"]` for the prediction checkpoint, `["actions", "id", "label"]` for every
other — rather than deleted, so the projection stays closed against future
additions.

#### 8.2 Capture, and the ordering rule that prevents the leak

`CheckpointSheet` gains a prediction step when
`checkpoint.interaction?.type === "prediction"`, shown before the existing
continue/rewind/compare/stop actions (`CheckpointSheet.svelte:75-82`). The
learner plays **one move on a board**, not text. The move is captured and is
**not** committed to the run.

`boardModel` hard-codes `orientation: startSide`
(`apps/web/src/lib/board-model.ts:60`; read at `Chessboard.svelte:45`). It gains
an optional `orientation` argument; `flipBoard: true` passes the opposite of
`packStartSide(pack)`. No contract consequence.

**Ordering rule, normative.** The client must never hold the opponent's reply
before the prediction is recorded. This is guaranteed by construction rather
than by discipline: `POST /runs/:id/prediction` is the endpoint that *both*
resolves the opponent selection and writes the record, and it returns the
selection. The drill client must not call `POST /select-move`
(`rest.ts:559-577`) for that ply at all; it plays the selection the prediction
response returned, through the shipped opponent-ply path.

**The body is the shipped select-move body plus three fields, and the request
composition does not move to the server.** The previous draft's
`{ checkpointId, nodeId, predictedUci }` implied the server could build the
selection request itself; it cannot without relocating logic that is legitimately
client-side. `session-controller.ts:385-403` composes `startFen`, `historyUci`,
`seed`, `packId` and a `policy` whose `mode` comes from
`selectorMode(pack, capabilities)` — a **client** capability read. So the body is

```
{ ...SelectMoveRequest, checkpointId, nodeId, predictedUci }
```

parsed by the shipped `parseSelectMoveRequest` (`rest.ts:568`, exported from
`opponent-selector.ts`) for the first part and by three `requiredString` calls
for the rest, and dispatched into the *same* `selector.select({ ...parsed,
policy: { ...parsed.policy, spine } })` expression `/select-move` already uses
(`rest.ts:570-576`). Nothing about how a selection is requested changes; only
*who else* sees the answer first. When `selector === undefined` the route returns
the shipped `ENGINE_UNAVAILABLE` shape exactly as `/select-move` does
(`rest.ts:561-567`), and the checkpoint falls back to its ordinary
continue/rewind actions with an `HonestControl` reason rather than a dead board.

Because the selector memoises on `selectionCacheKey` (`opponent-selector.ts:180,
353, 372-379`) and the request is byte-identical to the one the ply would
otherwise have made, the distribution the learner is shown is provably the one
the opponent then plays. `prediction` joins `parseRunRoute`'s action allowlist
(§7.1).

#### 8.3 What the interaction records

Nothing shipped can carry a predicted move: `EvidenceKind` is
`"eval" | "wdl" | "bestline"` and `EvidenceSource` is
`"engine_validated" | "human_model_predicted"` (`types.ts:11-12`), and
`FeedbackGeneratedEvent` carries `{nodeId, evidenceRefs}` only
(`types.ts:189-191`) with no production emitter. A new event joins the union at
`types.ts:202-215`, carrying the four things the ruling names — the predicted move,
its mass, its rank, and the distribution shown — and nothing else:

```ts
export type PredictionRecordedEvent = Event<"prediction.recorded", {
  readonly nodeId: string;
  readonly checkpointId: string;
  readonly predictedUci: string;

  /** The predicted move's own policy mass in `distribution`, or null when the
      move is absent from the recorded candidate set. */
  readonly predictedMass: number | null;
  /** 1-based position of the predicted move in `distribution.candidates` ordered
      by descending mass, or null when it is absent. */
  readonly predictedRank: number | null;
  /** How many candidates were in the set the learner was shown, so `predictedRank`
      is interpretable and a later reader knows what "absent" meant. */
  readonly candidateCount: number;

  /** The distribution shown, verbatim — `types.ts:78-83`, including the move the
      opponent then played and the engine identity that produced it. */
  readonly distribution: OpponentSelection;
}>;
```

`predictedMass` and `predictedRank` are **positions in a recorded distribution**, not
scores. `null` means "your move is not in the set we recorded", which is a fact about
the recording and is rendered as such; it does not mean the move is bad, and the
event carries no field in which such a claim could be stored.

There is no `gradedBy`, no `gradedAgainst` and no `declaredSource`. The previous
draft carried all three to make a declared-versus-applied grading source traceable
in the way the owner ruled for `policyModeApplied`; with `grading` removed there is
no declaration to diverge from and no grading to attribute, so the whole
declared/applied apparatus and the fixed "engine grading is not available" sentence
are deleted rather than kept as vestigial honesty about a field that no longer
exists. `distribution.engine` still carries the engine identity, and
`distribution.policyModeApplied` still records the applied opponent policy mode, so
nothing traceable was lost.

A projection case is added at `events.ts` beside the existing ones, and replay
validates node identity and checkpoint membership the way `outcome.reached` is
validated at `events.ts:163-186`. `predictedMass`, `predictedRank` and
`candidateCount` are recomputed from `distribution` on replay and must match, so a
hand-edited snapshot cannot invent a rank.

#### 8.4 What the interaction renders — law 8

The reveal shows four things and no fifth:

1. **the move the learner predicted**, in SAN;
2. **where it sat** — one sentence, built from `predictedMass`, `predictedRank`
   and `candidateCount` and from the opponent policy's own rating band where the
   policy declares one (`opponentPolicy.targetElo`, optional in the pack):
   `You said c4. 12% of 1500-rated players play it — 4th of 6 recorded replies.`
   When `targetElo` is absent the band clause is omitted rather than defaulted —
   `You said c4. 12% of recorded replies are it — 4th of 6.` — because inventing
   a rating band would attribute the frequency to a population nobody declared.
   When `predictedMass` is null:
   `You said c4. It is not among the 6 replies recorded for this position.`

   **This is the normative form, and it names one move.** The owner's ruling
   above is quoted with its second clause (`42% play Qb6`), which positions the
   learner's move against the *top* move in the same breath. That comparison is
   not interpolated into this sentence: it is item 3, where the whole
   distribution is on screen with the top entry visible and the learner's own
   entry marked. Reading the top move out of the list is the learner's; asserting
   it in a sentence beside their guess is the one place this surface could start
   sounding like a verdict, and one renderer emitting one fixed form is how that
   stays impossible.
3. **the distribution**, as the recorded candidate list from `distribution` rendered
   `moveSan → policy mass, rank`, in full and with nothing truncated, with the
   predicted move and the move actually played both marked;
4. **the move the opponent then played**.

Every number is a recorded frequency and every label is authored. No sentence asserts
that a prediction was good, bad, correct, incorrect, close or surprising; there is no
tick, no cross, no score, no colour that encodes approval, and no aggregate anywhere
that counts predictions "got right". A component snapshot asserts the absence of that
vocabulary (A6a), because this is the exact place the product would drift into the
dashboard `design/00-thesis.md` names as the anti-pattern.

**Withholding — and the delivery path is the response, not the event stream.**
`prediction.recorded` is not itself an engine-feedback event:
`engineFeedbackEvent` gates only `evidence.attached` and engine-referenced
`objective.state_changed` (`feedback-policy.ts:26-31`), and Maia policy mass
already reaches the browser inside `opponent.move_selected`. That is intentional
and is recorded here so it is not "fixed" later: a prediction whose distribution
is withheld until reveal teaches nothing at the moment it is asked.

But "not gated" is not the same as "delivered", and the previous draft conflated
them. `publicEvents` is a **truncating barrier, not a filter**: before disclosure
it cuts the page at the *index* of the first engine-feedback event
(`feedback-policy.ts:46-47`, `candidates.slice(0, barrier)`), so every later
event of every type is withheld too, including this one. A run whose feedback
policy opens *delivery* before *disclosure* can hold `evidence.attached` events
— `applyEvidence` gates on `feedbackDeliveryOpen` (`service.ts:473-478`) while
`publicEvents` and `RunService.compare` gate on `feedbackDisclosed` — and in such
a run a `prediction.recorded` written afterwards will not appear in
`GET /runs/:id/events` until reveal.

This RFC does not change the barrier, because reordering the event stream around
one event type is exactly the kind of second withholding decision D2 punishes.
Instead the guarantee is stated where it actually holds: **the distribution
reaches the learner in the `POST /runs/:id/prediction` response**, which is
synchronous, is the same call that records the event, and is not routed through
`publicEvents` at all. The event is the durable record; the response is the
delivery. A6 asserts the response, and asserts the event through the stored run
rather than through the public event page.

### 9. Deep analysis

No client-facing analysis request exists. `RunService.enqueueEvidence`
(`service.ts:390-419`) has no production caller and no route;
`POST /runs/:id/evidence` is apply-a-staged-result only (`rest.ts:747-757`).

`POST /runs/:id/analysis`, body
`{ nodeIds: string[] (1–16), kind: "bestline", multiPv?: 1–8, depth?, movetime? }`,
writer lease required. It wraps the shipped `enqueueEvidence`.
`EvidenceJobInput` (`apps/server/src/evidence-queue.ts:14-23`) gains
`readonly multiPv?: number`.

**MultiPV is not already wired for the judge, and the previous draft's route to
it was wrong.** `strong-engine.ts:55` is inside `stockfishPlaySpec`, whose spec is
`kind: "opponent"` (`:47`) — the *play* engine. The judge is
`stockfishAnalysisSpec` (`application.ts:183-190`), which does not consult
`resolveStrongEngineProfile` at all and hardcodes
`options: { Threads: 1, Hash: 16, MultiPV: 1 }` at `:189`. Those options are
applied once at handshake, so a per-request `multiPv` cannot come from the spec.

The mechanism that does exist is the one `StockfishEvidenceExecutor` already uses
for WDL: it composes the UCI command list **per job** and prepends a `setoption`
when the job asks for one (`evidence-queue.ts:301-315`, the
`job.kind === "wdl" ? ["setoption name UCI_ShowWDL value true"] : []` line).
`multiPv` threads through the same seam:

- when `job.multiPv` is set, the executor prepends
  `setoption name MultiPV value ${job.multiPv}`;
- and **resets it afterwards**. The judge is one long-lived shared process
  (`EngineSupervisor`), UCI options persist across `position`/`go` pairs, and a
  job that leaves `MultiPV` at 5 silently changes every later `eval` job's
  `info` lines. The executor therefore emits `setoption name MultiPV value 1` at
  the end of any command list that raised it. This is the boundary condition a
  shared engine process makes real and it is stated here rather than found in a
  flaky eval.

Results stage exactly as
today and are applied by the writer through the shipped
`POST /runs/:id/evidence`. `analysis` joins `parseRunRoute`'s action allowlist
(§7.1). When no judge engine is configured the route returns
the shipped `ENGINE_UNAVAILABLE` shape (as `/select-move` does at
`rest.ts:561-567`) — which is the honest outcome for a self-hoster on the
release compose, since it hardcodes `ENGINE_MODE: maia` with no light profile
(**D5**).

**In the comparison.** `BranchComparison.lines` projects `evidence.attached`
events of `kind: "bestline"` and `source: "engine_validated"` whose node is on
that column's path:

```ts
export interface ComparisonLineEntry {
  readonly nodeId: string;
  readonly plyOffset: number;
  readonly evidenceRefs: readonly string[];
  readonly kind: "bestline";
  readonly source: "engine_validated";
  readonly payload: EvidencePayload;   // types.ts:14-18, carried unchanged
}
```

The payload is carried through unmodified and rendered by the shipped
`renderEvidenceRef` (`evidence-sentences.ts:90-121`), so no new evaluation
vocabulary is invented. `renderEvidenceRef` takes payloads as a
`ReadonlyMap<string, EvidencePayload>` built today by `evidencePayloadTable` from
the *evidence page* (`evidence-sentences.ts:75-88`); the compare view has no such
page, so it builds the map from the entries themselves — each
`ComparisonLineEntry` contributes `evidenceRefs → payload`. That is the reason
`payload` is carried on the entry at all rather than being looked up. The
eval-only `ComparisonEvidenceEntry` contract at
`docs/explanation-grounds.md:55-63` stays byte-true because `lines` is a
separate collection. `lines` is emptied by `comparisonWithoutEngineFeedback`
alongside `evidence` (§2).

**Provenance limit.** `renderEvidenceRef` must not name an engine for these
entries. The comparison payload records that an eval was engine-validated but
carries no engine identity (`docs/explanation-grounds.md:178-183`), and both
shipped Stockfish specs report `version: "unknown"` because `parseIdentity`
fills `version` from the UCI `id name` line only when `spec.name` is unset
(**D10**, `apps/server/src/engine-supervisor.ts:116-126`). The heading stays
"Recorded engine evaluation."

### 10. Persisted shape: run schema 0.8 + migration 8, and pack schema 0.9

Two *run*-shape changes land together in one migration, because two migrations from
one RFC is the hazard the register was instituted to prevent
(`rfc/README.md:149-154`):

- `Branch.origin: "played" | "simulated"` (§7.4);
- `PredictionRecordedEvent` in the event union (§8.3).

Separately, this RFC now carries a **pack**-schema change it did not carry when
drafted: `grading` is removed from `$defs/checkpointInteraction` (§8.0). It claims
**pack schema 0.9** in `rfc/README.md`'s register, behind `pack-studio.md`'s 0.8.
The register's row for 0.9 recorded that this draft "must rebase: its §10 and R3/R4
still say 0.8"; both said 0.8 because both meant the *run* schema, which is correct
and unchanged. The rebase is therefore not a renumbering of anything already
written — it is this RFC acquiring a pack-schema claim for the first time and taking
the number the register already held for it. §12's table names both explicitly so the
two `0.8`s are never read as one.

`DRILL_RUN_SCHEMA_VERSION` moves `"0.7"` → `"0.8"`
(`packages/schema/src/index.ts:1`), stamped at `runtime.ts:218` and
`events.ts:195`; `DRILL_PACK_SCHEMA_VERSION` moves to `"0.9"` on the very next
line (`packages/schema/src/index.ts:2`, `"0.4"` in the tree today and whatever
0.5–0.8 has landed by then), together with `schemas/drill_pack.schema.json`'s
`$id` (`urn:chess-tabiya:schema:drill-pack:0.9`). The run and pack constants are
adjacent lines in one file, which is precisely why §12's table names which
version each slice means. `STORAGE_VERSION` moves `5` → `6`
(`apps/server/src/storage.ts:147`) with migration 8 appended to the list at
`storage.ts:915-941`.

**Migration 8 body** — "backfill branch origin as played on v0.7 runs": rewrite
every stored run snapshot at schema `"0.7"`, setting `origin: "played"` on every
branch and stamping `"0.8"`. The new event type needs no backfill, since no
historical run contains one. Reads filter on the current version
(`storage.ts:384, 440`), so this migration is mandatory or every stored run
disappears — the trap both prior grading RFCs documented. `origin` is written
literally as `"played"` and `"0.8"` literally, not from the schema constant, so
a later version bump cannot mis-stamp rows before migration 7, following the
freeze rule recorded for migration 4 at `rfc/README.md:161`.

The scratch ruling (§7) does **not** shrink this migration. `Branch.origin` still
lands on every branch and every stored v0.7 branch still needs `"played"`; scratch
changes what `origin` means and who writes `"simulated"`, not whether the field
exists. A migration that skipped the backfill because "simulated branches are not
persisted" would leave `origin` undefined on historical branches and break the
render, which is the shape of bug this paragraph exists to prevent.

Migration 8 is claimed in `rfc/README.md`'s register in the same commit as this
draft.

### 11. Defects: none claimed, four constraining

`rfc/defect-sweep.md` (draft, 2026-08-13) owns and closes all six open defects —
D4, D5, D6, D8, D9, D10 — and its verification pass found several of them wider
than their ledger rows say. This RFC therefore **claims none of them** and takes
two as inbound dependencies rather than re-fixing them in a second place, which
is the duplication the register exists to prevent.

**Inbound from `defect-sweep.md`:**

- **D4 — checkpoint-action vocabulary.** This RFC changes what
  `compare_branches` *does* (§3, §5) but not the vocabulary that names it.
  `defect-sweep` §1 replaces `SUPPORTED_CHECKPOINT_ACTIONS`
  (`apps/server/src/pack-validation.ts:18`), the client literal
  (`CheckpointSheet.svelte:78`) and the schema's exclusion rule with one
  exported `CHECKPOINT_ACTIONS` constant. §8.2 adds a prediction *step* to the
  checkpoint sheet, which is an `interaction`, not an action, so it adds no
  member to that vocabulary and no new copy of it.
- **D9 — `start.side`.** `packStartSide` throws without it
  (`screen-model.ts:56-62`), and both simulate's grid and §8.2's board flip call
  it. `defect-sweep` makes `start.side` required at pack schema 0.5, which
  removes the exposure. This RFC adds no new exposure and no fix.

**Constraining but untouched by either RFC:**

- **D5** — the release compose hardcodes `ENGINE_MODE: maia`
  (`deploy/compose.release.template.yaml:8`) with no light profile, so §9 must degrade with the shipped `ENGINE_UNAVAILABLE` shape rather
  than assume a judge engine exists.
- **D8** — schema-versus-validator divergence was the precedent class for the
  declared-versus-applied grading source the previous draft specified. §8.0 removes
  `grading` outright, so the divergence has no surface here: there is no declaration
  the validator could disagree with, and no vocabulary copy is added.
- **D10** — engine provenance is anonymous, which is why §9 forbids naming an
  engine in the comparison and keeps the heading "Recorded engine evaluation."

**Sequencing.** `defect-sweep` carries a pack-schema change (0.4 → 0.5) and no
migration; this RFC carries a run-schema change (0.7 → 0.8, migration 8) **and** a
pack-schema change (→ 0.9, §8.0). The pack-schema claim orders this RFC behind
`defect-sweep` (0.5), `return-and-progression` (0.6), `trajectory-drill` (0.7) and
`pack-studio` (0.8) in the register, and behind nothing else: none of those four
touches `$defs/checkpointInteraction`, and a pack version rebases cheaply because
pack digests are content digests unaffected by the `$id`
(`packages/schema/src/drill-pack/digest.ts:58-66`). If any of them is withdrawn
before landing, this rebases downward rather than leaving a hole. If this RFC lands
before `defect-sweep`, §8.2's prediction step sits beside the existing client action
literal and moves with it when `defect-sweep` §1 consolidates the vocabulary; A8
asserts against `CHECKPOINT_ACTIONS` once that constant exists.

`pack-studio.md` is the one draft with a live coupling in both directions, and both
are already stated on both sides: it consumes `Branch.origin` in its distiller (§7.4
here, its §6 there), and it owns pack schema 0.8 directly beneath this RFC's 0.9.

### 12. Slice plan

| Slice | Contents | Depends on |
|---|---|---|
| **R0** | §1.2's `ServerErrorCode` widening and its `errorResponse` arms, and §7.1's `parseRunRoute` allowlist entries. Landed first and alone, because every later slice throws codes and serves paths the shipped router turns into 500s and 404s | shipped server only |
| **R1** | §1 payload and axis rule, §2 transport, §3 selection (incl. `BranchCard.forkNodeId` and the rail props), §4 consequence row and the `pack-absent:` reference, §6 branch-selective export, and the two doc rewrites named in the header | R0 |
| **R2** | §5 grid, N-column strips incl. material and structure, synchronised replay, narrative mode | R1 |
| **R3** | §7 simulate and promotion (incl. `ForkOptions.origin`), §10 **run** schema 0.8 / migration 8 | R0, R1, R2 |
| **R4** | §8 prediction checkpoints, §8.0 **pack** schema 0.9, and A7's update to the shipped `Predict the reply` browser step | R0, R1, R3 (run schema 0.8) |
| **R5** | §9 deep analysis and MultiPV | R0, R1 |

`design/03-product-breadth.md:25-26,65-66` requires it: **default compare
selection and branch usefulness scoring are not in R0–R5.** They optimise a
surface that must first be correct manually, and they take §3's selection state
as their input when they are built.

## Deviations from design

1. **`design/03-product-breadth.md:62` lists "deep analysis mode" among the
   review surfaces without saying what it requests.** §9 specifies a MultiPV
   `bestline` request over the shipped evidence queue. This is a
   specialisation, not a divergence.
2. **`design/03` groups branch race, opposite-side replay and new-defense replay
   with the review surfaces (lines 63-64).** They are out of scope here because
   each needs a training mode's definition of "same decision, different
   resistance" from program item #4 (`design/03:258-260`). B3's own gate row
   (line 173) does not name them.
3. **`design/03:59` lists duplicate, share and PGN-with-variations import under
   the same bullet as review.** They are run-history and platform contracts
   (B7 line 177, B8 line 178) and are not specified here. B3's gate row does not
   name import or duplicate; it names share/export, and export is discharged by
   §6.
4. **The standalone `/review` comparison route stays a stub.** The shell release
   deliberately scoped comparison inside the run (`docs/app-shell.md:34-36`) and
   this RFC preserves that boundary rather than quietly reopening it.

No other divergence.

## Acceptance criteria

**A0 — the new codes and routes resolve (server regression).** Each of
`TOO_MANY_BRANCHES`, `NO_AUTHORED_VARIATIONS`, `SIMULATE_TOO_LARGE`,
`SIMULATION_EXPIRED` and `SIMULATE_BUDGET_EXCEEDED` returns its specified status
(422/422/422/**410**/422) and **not 500**, which is `errorResponse`'s
fall-through for an unmapped code (`rest.ts:376`). `POST` to
`/runs/:id/simulate`, `/runs/:id/simulate-enter`, `/runs/:id/prediction` and
`/runs/:id/analysis` each reach their handler rather than the `404 NOT_FOUND` an
unlisted action produces (`rest.ts:392-403`). This is R0's whole test and it
exists because five of the six failures it catches look like a working feature
returning the wrong number.

**A1 — axis correctness (runtime unit, `packages/runtime/src/compare.test.ts`).**
A run with branches `X` and `Y` forked at node `F1` and branch `Z` forked at the
shallower node `F0`: `compareBranches(run, [X, Y, Z])` returns
`forkNodeId === F0`; every `plyOffset` in every collection is measured from
`F0`; the rows up to `X.ownForkOffset` report `groups` of `[[X, Y], [Z]]`; and
`Z.ownForkOffset === 0`. The test additionally asserts that the offsets returned
by `compareBranches(run, [X, Y])` differ from those in the three-branch payload
for the same nodes — the concrete proof that pairwise results are not
composable.

**A1a — `groups` is a partition (runtime unit, and a property in
`invariants.test.ts`).** Over every row of every payload in the generated runs
that `invariants.test.ts:150-162` already builds: the union of `groups` equals
`Object.keys(nodes)` exactly; the groups are pairwise disjoint; every member of a
group resolves to the same `nodes[id].id`; no two groups resolve to the same node
id; and the groups appear in `columns` order. This is the assertion that makes
§1.1 clause 4's "draw one cell per group" safe — without it a renderer merging on
`groups` can merge two different nodes into one cell, which is the one way an
N-way comparison can be confidently wrong on screen.

**A2 — payload invariants (runtime unit).** `compareBranches` **throws**
`BranchQueryError("UNKNOWN_BRANCH")` for an unknown id and a `TypeError` for
fewer than two distinct ids or a duplicated id; the route maps those to `404` and
`400 INVALID_REQUEST` respectively and rejects more than eight ids with
`422 TOO_MANY_BRANCHES` before calling the runtime at all, so the cap is a
transport rule and the runtime has one less way to fail. A branch whose leaf is
the set fork yields a column with no nodes and `consequence.decision === null`,
and does not throw. Element types `NodeRef`, `ObjectiveTimelineEntry`,
`CheckpointHit`, `ComparisonScore` and `ComparisonEvidenceEntry` are asserted
structurally unchanged.

**A3 — withholding (server regression, `apps/server/src/*.test.ts`).** Before
reveal, `POST /runs/:id/compare` returns `evidence` and `lines` empty for every
column, `consequence.deepestScore === null` and `consequence.theory === null`
for every column, and engine evidence refs stripped from every objective
timeline; `objectiveState`, `terminal`, `outcome`, `checkpointsReached`,
`checkpointsMissed` and `resistance` are present. After reveal all of it
appears. No client code path recomputes any of these.

**A4 — consequence renders only shipped sentences (component test).** For a
three-branch comparison, every string in the consequence block is byte-equal to
the output of `objectiveGradeSentence`, `checkpointResolutionSentence`,
`assessmentSentence`, `resistanceSentences`, `theoryVerdictSentence`,
`renderEvidenceRef`, or the single new `Checkpoint not reached on this branch:`
form. A snapshot asserts no other string is produced, and that no rendered text
contains a comparative between columns.

**A5 — simulate writes nothing (server integration).** At the example pack's spine
node, `POST /runs/:id/simulate` returns one walked variation per authored child, each
to its authored end, and a `comparison` payload of the shipped `BranchComparison`
shape. The assertions are about **absence**: `run.events.length`, the run's branch
list, the stored snapshot's bytes and the cursor are all **identical** before and
after the call, and the evidence queue's depth is identical too. A walk exceeding
eight variations or forty plies returns `422 SIMULATE_TOO_LARGE`. A stale
`simulationId` returns `410 SIMULATION_EXPIRED`.

**A5a — promotion (server integration).** `POST /runs/:id/simulate-enter` on one
`branchIndex` appends **exactly one** `branch.forked` with `origin: "simulated"` plus
that variation's plies, leaves the cursor at the branch leaf, and adds nothing for the
other variations. `readBackReplay(run.events)` succeeds on the resulting run, proving
the `actor: "system"` choice did not corrupt read-back, and the evidence queue depth
is still unchanged. A promotion that would breach the 800-event bound returns
`422 SIMULATE_BUDGET_EXCEEDED` with `run.events.length` unchanged. A run whose
simulation was never entered contains no `branch.forked` at all — the regression that
proves scratch is scratch.

**A6 — prediction record (server integration).** `POST /runs/:id/prediction`
writes exactly one `prediction.recorded` event carrying the predicted move,
`predictedMass`, `predictedRank`, `candidateCount`, and a `distribution` whose
`moveUci` equals the move the subsequent opponent ply commits — proving the
distribution shown is the played one. A prediction absent from the candidate set
records `predictedMass: null` and `predictedRank: null` with `candidateCount`
still set. Replay recomputes all three from `distribution` and rejects a snapshot
whose stored values disagree. The event type carries no property whose name or value
expresses a verdict, asserted against an explicit key list.

**The delivery assertion is on the response, not the event page.** The route's
own body returns the `OpponentSelection` and the three positions, before reveal,
and that is what the test asserts. It additionally asserts the event is present
in the *stored* run before reveal. It does **not** assert
`GET /runs/:id/events?sinceSeq=0` contains it: `publicEvents` truncates at the
first engine-feedback event (§8.4), so that assertion would pass or fail on
whether an `evidence.attached` happened to precede the prediction — a test that
is green for the wrong reason on most runs and red for the right one on some.

A run stored at schema `"0.7"` is migrated by migration 8, gains
`origin: "played"` on every branch, and remains readable.

**A6a — the reveal states no verdict (component test).** The prediction reveal for a
recorded event renders the four elements of §8.4 and nothing else. A snapshot asserts
that no rendered string in the prediction surface matches
`/correct|incorrect|right|wrong|good|bad|well done|score|✓|✗/i`, that the full
candidate list is rendered with no entry hidden by any threshold, and that the
predicted move is marked without being ranked as better or worse than any other. A
second case renders the `predictedMass: null` path and asserts it produces the
"not among the N replies recorded" sentence rather than a zero or a failure state.

**A6b — `grading` is gone (schema and format test).** `$defs/checkpointInteraction`'s
prediction branch has `required: ["type"]` and properties exactly
`{type, flipBoard}`; a document declaring `grading` is **rejected**, since the branch
is `additionalProperties: false`. `DRILL_PACK_SCHEMA_VERSION` is `"0.9"` and the
schema `$id` is `urn:chess-tabiya:schema:drill-pack:0.9`.
`schemas/drill_pack.example.json` no longer contains the string `grading`, still
validates, still loads, and its new digest is recorded wherever the old one was
asserted. Every other pack in `content/` and `schemas/fixtures/` validates unchanged
and its digest is unchanged, since none declares a prediction interaction.

**A7 — browser test (`tests/browser/drill.spec.ts`, Playwright, `workers: 1`,
`retries` unset).** A new test, `"three branches compare on one axis, explain
their consequences, and export selectively"`, against the served
`najdorf-transition-schema-example` pack (`schemas/drill_pack.example.json`,
selected the way the shipped test does at `drill.spec.ts:152,162-168`):

1. play into the pack, rewind (`keyboard.press("r")`), and fork twice
   (`keyboard.press("b")` → `getByLabel("Label")` →
   `getByRole("button", { name: "Create branch" })`, as at
   `drill.spec.ts:192-196`), playing a different move on each, so the run holds
   three branches;
2. select all three — one click on **Compare all forked here** in the rail —
   and assert the three per-branch checkboxes are all checked, which is the
   regression against `compareIds.slice(-1)`;
3. open compare and assert `.boards article` has count **3** (the shipped test
   asserts 2 at `drill.spec.ts:216`) and the heading reads
   "Same decision, 3 consequences.";
4. assert three consequence blocks, each containing that branch's objective
   sentence and its `resistanceSentences` text ending "Not perfect play.", and
   that at least one block contains
   `Checkpoint not reached on this branch: Critical race resolved.`;
5. press `Space`/`Next` once and assert all three boards advanced together
   (`.evidence-cell[data-ply-offset="1"]` populated per column);
6. switch to the grid view and assert three leaf boards render;
7. switch to narrative mode and assert it names each branch's decision SAN and
   its end state, and contains no string absent from A4's set;
8. export with `keyboard.press("e")` while the selection is held, and assert the
   downloaded PGN's `[Event "Tabiya drill: najdorf-transition-schema-example"]`
   tag is present and that the file contains exactly the selected branches'
   variations;
9. the existing test `"served Najdorf pack plays, rewinds, branches, compares,
   and exports"` (`drill.spec.ts:143`) continues to pass with **two** changes,
   not one. The branch-keyed selectors replace `{a, b}` at `:213-225`; and
   `:176-177`, which today reaches `Predict the reply` and clicks `Continue`,
   must first play a move on the prediction board. That checkpoint carries
   `interaction.type === "prediction"` in the living example
   (`schemas/drill_pack.example.json:84-93`), and today the sheet shows only
   `Continue` **because `projectPackDocument` never sends `interaction` at all**
   (`pack-registry.ts:82-87`). §8.1 changes that, so §8.2's step appears in the
   shipped flow the moment R4 lands. R4 updates this test in the same commit; a
   draft that left it unmentioned would have shipped a red suite and blamed the
   new test.

A second browser test, `"a simulation is scratch until entered, and a prediction
shows a distribution"`, drives simulate at the spine node and asserts the resulting
grid renders every authored variation **while the branch rail still shows no new
branch**; navigates away and back and asserts the run is unchanged; then re-runs
simulate, enters one variation, and asserts exactly one new branch appears in the
rail marked as simulated. It continues against the opponent normally, reaches
`predict-reply` (`getByRole("heading", { name: "Predict the reply" })`, as at
`drill.spec.ts:176`), asserts the board is flipped relative to `start.side`, plays a
predicted move, and asserts the revealed panel shows the learner's move, its mass and
rank sentence, and the full recorded candidate list — and that `/select-move` was
**not** requested for that ply (`page.waitForResponse` / request log), proving §8.2's
ordering rule. It asserts no verdict word appears, matching A6a.

**A8 — gates.** `pnpm verify` (typecheck, unit, schema-check —
`package.json:13`) and `pnpm test:browser` (`package.json:10`) pass. The
prediction step added to the checkpoint sheet introduces no new member of the
checkpoint-action vocabulary, asserted against `defect-sweep`'s
`CHECKPOINT_ACTIONS` constant once that lands (§11).

**A9 — B3.** With A0–A8 green, `design/03-product-breadth.md`'s B3 row (line
173) moves from `pairwise partial` to met: manual multi-branch selection, pairwise and
multi comparison, replay, deep mode, and export all work end to end on the
example pack. The owner's walkthrough constraint is discharged by A4, not by
A1–A3. **B3 is proposed, not moved, by this RFC**: the design tier is the
owner's, so the row change lands as a BACKLOG entry and an owner ruling, not as
an edit from the implementing agent (RFC-0000's agent rule).

## Open questions

None. Both questions this draft carried were answered by owner rulings on
2026-08-13 and are specified above rather than left open: a prediction shows numbers
and never a verdict (§8, §8.0, §8.4), and simulated branches are scratch until
entered (§7).

## Changelog

- 2026-08-13: implemented and verified; run schema v0.8, pack schema v0.9, and SQLite migration 8 shipped.
- 2026-08-13: created.
- 2026-08-13: **rewritten against two owner rulings, closing both open questions.**
  *Ruling — prediction checkpoints show numbers, never a verdict.* Rewrote §8 around
  what the interaction records (predicted move, its mass, its rank, the candidate
  count, and the distribution shown, verbatim) and what it renders (the move, a
  positioning sentence, the full distribution, the reply actually played). **Removed
  `grading` from the pack schema** rather than keeping it as a display hint —
  `source` graded nothing and was never backed at `multiPv: 1`, `minMass` as a
  display hint is a verdict in rendering costume, and `topK` is format growth with no
  consumer — which gives this RFC its first pack-schema change and the **0.9** claim
  the register was already holding for it. Deleted the `declaredSource` / `gradedBy`
  / `gradedAgainst` apparatus and the engine-grading-unavailable sentence with it,
  and added A6a's snapshot against verdict vocabulary as the standing guard.
  *Ruling — simulated branches are scratch.* Reworked §7: the walk runs on an
  in-memory clone and writes nothing, promotion (`/simulate/enter`) is what creates a
  real branch, the projected-event budget moved from the walk to the promotion, the
  closing `rewind` is gone because nothing was mutated, and `Branch.origin` is now a
  **promotion marker** that consumers render rather than a persistence filter they
  query. Migration 8 is unchanged and §10 says why the scratch ruling does not shrink
  it. Rewrote A5, added A5a, A6a and A6b, and rewrote the second browser test to
  assert that an un-entered simulation leaves the run untouched.
- 2026-08-13: **adversarial review — every citation re-verified against the tree,
  six specifications of absent infrastructure corrected.** *Infrastructure that
  did not exist.* (1) `ServerErrorCode` is a closed union and `errorResponse`
  falls through to **500**, so all five new codes — and 410, a status the chain
  never produces — needed the widening §1.2 now specifies. (2) `parseRunRoute` is
  a closed one-segment allowlist, so `/runs/:id/simulate/enter` could not be
  routed at all; the promotion route is renamed **`/runs/:id/simulate-enter`** and
  §7.1 lists every new action. (3) `ForkOptions` has no `origin`, so §7.3's
  `fork(clone, …, { origin })` had nothing to pass it to. (4) `BranchCard` has no
  `forkNodeId` and `BranchRail`'s props have no heading callbacks, so §3's
  "compare all forked here" was uncomputable; both widenings are now stated.
  (5) §9's MultiPV threading named `stockfishPlaySpec` — the **opponent** engine;
  the judge (`application.ts:189`) hardcodes `MultiPV: 1` at handshake, so the
  mechanism is a per-job `setoption` in `StockfishEvidenceExecutor`, plus a reset,
  because the judge process is shared and UCI options persist. (6) The new
  `Checkpoint not reached` sentence had no evidence reference to be keyed on;
  `packAbsentEvidenceRef` is added, with a prohibition on ever persisting it.
  *A fabricated ground.* §1.2 attributed the 8-branch cap to `design/03`; no such
  statement exists (the document's only "eight" is its eight program items), so
  the cap is now asserted on this RFC's own grounds. *Blast radius.* §1 claimed
  two call sites for removing `compare()`; the real set is eighteen, including
  four test files — one of them the **property** test at
  `invariants.test.ts:150-162` — and two living docs that describe the two-sided
  payload literally. Both docs are now named in the header as amended here.
  *Ruling integration.* §8.4's positioning sentence is pinned to one fixed form
  and explicitly does not interpolate the top move beside the learner's guess;
  the `targetElo`-absent path is specified rather than defaulted; and §8.4's
  withholding paragraph was wrong that "passes the barrier" means "is delivered"
  — `publicEvents` **truncates**, so the delivery path is the prediction
  response and A6 asserts that instead. *Axis.* §1.1 gains the `groups` partition
  invariants (cover, disjoint, same-node-within, distinct-node-across, stable
  order) and the explicit rule that adding a branch moves everyone's offsets, so
  no consumer caches one across calls; A1a asserts all of it as a property.
  *Also.* §8.1 was short one shipped assertion (`drill-client-server.test.ts:180`)
  and A7 was short one shipped browser step — projecting `interaction` makes the
  existing `Predict the reply` flow at `drill.spec.ts:176-177` require a move.
  Added **R0** so the codes and routes land before anything throws or serves.
  Corrected roughly thirty line citations that had drifted, including every
  `design/03-product-breadth.md` reference (B3 is line **173**, program item #5 is
  **261-263**, the Lucas Chess sentence is **289-290**) and four `rfc/README.md`
  ones. A9 now proposes the B3 row change rather than asserting it, per the
  design-tier rule.
