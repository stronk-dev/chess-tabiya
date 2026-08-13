# RFC: N-way comparison and the review surfaces

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/03-product-breadth.md` §Review and explore (lines 57–66),
  gate **B3** (line 163), program item **#5** (lines 252–253), the ordering rule
  (lines 65–66), and the Lucas Chess failure mode (lines 272–281)
- **Exploration gate:** owner ruling 2026-08-12 opened the exploration gate
  (`rfc/README.md:26-33`); the breadth sequencing ruling 2026-08-11
  (`rfc/README.md:35-40`) opened B1–B8 RFC planning
- **Depends on:** `archive/branch-runtime.md`, `archive/drill-client.md`,
  `archive/explanation-grounds.md`, `archive/line-drill-theory-grading.md`,
  `archive/outcome-drill-grading.md`, `archive/terminal-outcome-events.md`;
  **`defect-sweep.md`** for D4 and D9 (§11) — independent, either order
- **Parent / amends:** amends `archive/branch-runtime.md` (the comparison payload
  and the branch record), `archive/explanation-grounds.md` (the comparison
  section), `archive/drill-client.md` (the compare surface and checkpoint sheet)
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
consequence**. `design/03-product-breadth.md:279-280` names that exact shape as
the Lucas Chess failure mode — "a surface that shows difference without
explaining consequence is a mode-menu entry, not a drill." B3 is therefore not
met by widening a payload from two columns to N. Explaining consequence is a
first-class requirement of this RFC, and §4 is where it is discharged.

The material is already in the tree and simply never reaches the compare
surface. `branchCards()` computes each branch's leaf objective state and
terminality (`apps/web/src/lib/screen-model.ts:116-133`) and the branch rail
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
(ruled after manual inclusion by `design/03-product-breadth.md:65-66,283-293`);
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
point of the change. Call sites to update: `apps/server/src/service.ts:6,364-372`
and `packages/runtime/src/compare.test.ts`.

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
   column, and **MUST NOT** count a shared node as a difference. Entries in
   `objectiveTimelines`, `checkpointHits`, `evidence` and `lines` carry
   `nodeId`, so an entry that is shared by a group is identified by looking up
   the row at its offset; entries at offset `0` are shared by all columns.
5. **`ownForkOffset` is the decision offset.** The move that made a column
   distinct is its first node at an offset greater than `ownForkOffset`.

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
by `rest.ts:349-351`; it is not a product path and the UI must not be built
around it.

The real constraints are set size and identity:

- fewer than 2 distinct ids → `400 INVALID_REQUEST`;
- a repeated id → `400 INVALID_REQUEST` (a column may not be compared to itself);
- an unknown id → `404 UNKNOWN_BRANCH` (shipped mapping, `rest.ts:349-351`);
- more than **8** ids → `422 TOO_MANY_BRANCHES`. Eight is the ceiling the design
  doc already names for the overview question
  (`design/03-product-breadth.md:288`), so the cap is stated here rather than
  discovered in use.

A selected branch whose leaf **is** the set fork (forked, never moved) is legal.
It contributes a column with no nodes at any offset and its consequence row
reports `decision: null`. It is rendered as "no moves on this branch yet", never
as an error.

### 2. Transport, service, and withholding

**REST** (`apps/server/src/rest.ts:737-745`). `POST /runs/:id/compare` accepts
`{ branchIds: string[] }` with length 2–8. The `branchAId`/`branchBId` body is
removed; there is no compatibility shim, for the reason in §1.

**Transport** (`apps/web/src/lib/api.ts:346-351, 531-539`).
`compare(runId, branchIds: readonly string[]): Promise<BranchComparison>`.

**Controller** (`apps/web/src/lib/session-controller.ts:318-338`).
`compare(branchIds: readonly string[])`; the session field
`comparisonBranchIds` becomes `readonly string[]`. `closeCompare()` is
unchanged.

**Withholding.** `RunService.compare` (`service.ts:364-372`) keeps the shipped
gate: when `!feedbackDisclosed(run)` it returns
`comparisonWithoutEngineFeedback(comparison)` (`service.ts:84-110`). That
function is amended to (a) map over the branch-keyed records instead of `a`/`b`,
(b) empty `lines` as well as `evidence`, and (c) apply the reveal rule to the
consequence row per §4.3. This is one gate in one place; no client-side hiding
is permitted anywhere in this RFC, which is the D2 lesson.

### 3. Manual N-branch selection

`design/03-product-breadth.md:65-66` rules that manual inclusion works first and
default selection and scoring optimise it afterwards. This RFC implements only
the manual half.

**Selection state.** `DrillScreen.svelte:84` keeps `compareIds: string[]`;
`toggleCompare` (`:235-241`) drops the `slice(-1)` eviction and simply adds or
removes the id, refusing an add that would exceed 8. The eviction line is the
whole bug and its removal is the whole fix.

**Rail affordances** (`BranchRail.svelte:39-46`). The existing per-branch
checkbox is kept and gains an accessible name (`Include <label> in comparison`)
plus `aria-checked` state. Two new controls are added to the rail heading:

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

**Opening compare.** `defaultCompareIds()` (`DrillScreen.svelte:200-206`) is
replaced by `selectedCompareIds()`: it returns `compareIds` when at least two
are held, otherwise the cursor branch plus the first other branch (the shipped
fallback, preserved so the existing keyboard flow keeps working). The return
type widens from `readonly [string, string]` to `readonly string[]`.

**Labels.** `compareLabels` (`DrillScreen.svelte:180-188`) is removed. Labels
travel in `BranchColumn.label`, so the compare view no longer re-derives them
and can no longer disagree with the payload.

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
(`evidence-sentences.ts:53-62`) — and carries no judgement. It is added to the
same table so it is rendered through `renderEvidenceRef`'s discipline rather
than interpolated at a call site.

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
  (`service.ts:84-110`, `feedback-policy.ts:10-49`). Recomputing it in the
  browser would rebuild the withholding decision in a second place — the D2
  shape.
- `theory` cannot be computed in the browser at all: `projectPackDocument`
  (`pack-registry.ts:57-89`) never projects `deviations` or `authoredBoundary`,
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
0. `stepTimeline` (`DrillScreen.svelte:253-258`) bounds on
`comparison.rows.length`. The per-column "Line ended" marker already exists and
generalises unchanged.

**Difference strips.** The objective and checkpoint strips
(`CompareView.svelte:218-259`) become N columns. Two strips are added that are
deterministic rules facts already available from each node's FEN
(`docs/branch-runtime.md:102-109`) and are computed in the runtime alongside the
rows, never in the client:

- **material** — the material balance at the column's node for each offset,
  White-perspective, matching the run's existing convention
  (`docs/explanation-grounds.md:56-59`);
- **structure** — pawn-file occupancy per side, the deterministic structural
  fact, stated as counts and never as a named structure. Naming structures is
  recognition, which `design/03-product-breadth.md:207-213` settles as a
  separate contract.

Both are added as a `strips` record keyed by branch id, of entries carrying
`plyOffset` and the fact. Group members (§1.1 clause 4) are drawn once.

**Narrative mode.** A reading-order projection of the *same* payload, adding no
evidence: set fork position → each column's `decision` → the lowest offset at
which the columns' objective timelines or checkpoint hits diverge → each
column's consequence row. It is a toggle on the compare view, and every sentence
comes from §4.2's table. Because it renders the identical data, a narrative view
that could say something the strip view cannot is a bug.

**Standalone Review route.** `/review` is currently a stub that says standalone
comparison is not part of the shell release (`apps/web/src/App.svelte:331`,
`docs/app-shell.md:36-38`). This RFC leaves that boundary where the shell RFC
put it: compare stays inside the run. Extending it is B7's run-history work.

### 6. Branch-selective PGN export from the UI

Export is already N-way at both the runtime (`packages/runtime/src/pgn.ts:74-75`)
and the route (`GET /runs/:id/pgn?branches=a,b`, parsed at `rest.ts:415-423`,
served at `:605-618`). The only gap is that the UI never passes ids:
`SessionController.exportPgn()` (`session-controller.ts:341-343`) calls
`this.#api.pgn(runId)` with no argument, so every export is the whole run.

`exportPgn(branchIds?: readonly string[])` forwards to the shipped
`api.pgn(runId, branchIds)` (`api.ts:352, 576-586`). `DrillScreen`'s export
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
| `POST` | `/runs/:id/simulate/enter` | promote one walked variation to a real branch |

Both require the writer lease (same `#forWrite` path as `moves`/`fork`,
`service.ts:245,275`).

The cursor node's position is matched to the pack spine using the shipped
`spinePositionIndex` / `spineNodeIdFor` (`packages/runtime/src/line.ts:56,86`),
already used for the timeline at `screen-model.ts:98-101`. If the run has no
registered pack, the node is off-spine, or the matched spine node has fewer than
two children → `422 NO_AUTHORED_VARIATIONS`.

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
times**.

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
   origin: "simulated" })` — `runtime.ts:360-364`; `appendBranch` moves the
   cursor to the new branch.
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
   `RUN_TERMINATED` (`runtime.ts:275-277` — a terminal objective state or an
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

`POST /runs/:id/simulate/enter`, body `{ simulationId, branchIndex }`, replays that
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
| `source` | it declared what to grade against. Nothing is graded. `"engine"` and `"both"` were never backed in any case — the strong-engine profile ships `multiPv: 1` (`apps/server/src/strong-engine.ts:10-15`), so `candidateLines` yields one move and there is no ranked engine set at all |
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
authored content under program #2's reveal contract. The regression that asserts the
absence of `interaction` (`apps/server/src/drill-client-server.test.ts:182`) is
amended to assert exactly this shape rather than deleted.

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
than by discipline: `POST /runs/:id/prediction` with
`{ checkpointId, nodeId, predictedUci }` is the endpoint that *both* resolves
the opponent selection and writes the record, and it returns the selection. The
drill client must not call `POST /select-move` (`rest.ts:559-577`) for that ply
at all; it plays the selection the prediction response returned. Because the
selector memoises on `selectionCacheKey` (`opponent-selector.ts:180, 353,
372-379`), the distribution the learner is shown is provably the one the opponent
then plays.

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
2. **where it sat** — one sentence in the shape the owner's ruling gives, built from
   `predictedMass`, `predictedRank` and `candidateCount` and from the opponent
   policy's own rating band where the policy declares one
   (`opponentPolicy.targetElo`): `You said c4. 12% of 1500-rated players play it —
   4th of 6 recorded replies.` When `predictedMass` is null:
   `You said c4. It is not among the 6 replies recorded for this position.`
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

**Withholding.** `prediction.recorded` passes the feedback barrier.
`engineFeedbackEvent` gates only `evidence.attached` and engine-referenced
`objective.state_changed` (`feedback-policy.ts:26-31`), and Maia policy mass
already reaches the browser inside `opponent.move_selected`. This is intentional
and is recorded here so it is not "fixed" later: a prediction whose distribution
is withheld until reveal teaches nothing at the moment it is asked.

### 9. Deep analysis

No client-facing analysis request exists. `RunService.enqueueEvidence`
(`service.ts:390-419`) has no production caller and no route;
`POST /runs/:id/evidence` is apply-a-staged-result only (`rest.ts:747-757`).

`POST /runs/:id/analysis`, body
`{ nodeIds: string[] (1–16), kind: "bestline", multiPv?: 1–8, depth?, movetime? }`,
writer lease required. It wraps the shipped `enqueueEvidence`.
`EvidenceJobInput` (`apps/server/src/evidence-queue.ts:14-23`) gains
`readonly multiPv?: number`; the judge executor threads it through
`resolveStrongEngineProfile({ multiPv })` (`strong-engine.ts:23-31`), which
already maps it to the `MultiPV` UCI option (`:55`). Results stage exactly as
today and are applied by the writer through the shipped
`POST /runs/:id/evidence`. When no judge engine is configured the route returns
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
vocabulary is invented. The eval-only `ComparisonEvidenceEntry` contract at
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

### 10. Persisted shape: run schema 0.8 + migration 6, and pack schema 0.9

Two *run*-shape changes land together in one migration, because two migrations from
one RFC is the hazard the register was instituted to prevent
(`rfc/README.md:42-48`):

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
`events.ts:195`. `STORAGE_VERSION` moves `5` → `6`
(`apps/server/src/storage.ts:147`) with migration 6 appended to the list at
`storage.ts:915-941`.

**Migration 6 body** — "backfill branch origin as played on v0.7 runs": rewrite
every stored run snapshot at schema `"0.7"`, setting `origin: "played"` on every
branch and stamping `"0.8"`. The new event type needs no backfill, since no
historical run contains one. Reads filter on the current version
(`storage.ts:384, 440`), so this migration is mandatory or every stored run
disappears — the trap both prior grading RFCs documented. `origin` is written
literally as `"played"` and `"0.8"` literally, not from the schema constant, so
a later version bump cannot mis-stamp rows before migration 7, following the
freeze rule recorded for migration 4 at `rfc/README.md:54`.

The scratch ruling (§7) does **not** shrink this migration. `Branch.origin` still
lands on every branch and every stored v0.7 branch still needs `"played"`; scratch
changes what `origin` means and who writes `"simulated"`, not whether the field
exists. A migration that skipped the backfill because "simulated branches are not
persisted" would leave `origin` undefined on historical branches and break the
render, which is the shape of bug this paragraph exists to prevent.

Migration 6 is claimed in `rfc/README.md`'s register in the same commit as this
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

- **D5** — the release compose hardcodes `ENGINE_MODE: maia` with no light
  profile, so §9 must degrade with the shipped `ENGINE_UNAVAILABLE` shape rather
  than assume a judge engine exists.
- **D8** — schema-versus-validator divergence was the precedent class for the
  declared-versus-applied grading source the previous draft specified. §8.0 removes
  `grading` outright, so the divergence has no surface here: there is no declaration
  the validator could disagree with, and no vocabulary copy is added.
- **D10** — engine provenance is anonymous, which is why §9 forbids naming an
  engine in the comparison and keeps the heading "Recorded engine evaluation."

**Sequencing.** `defect-sweep` carries a pack-schema change (0.4 → 0.5) and no
migration; this RFC carries a run-schema change (0.7 → 0.8, migration 6) **and** a
pack-schema change (→ 0.9, §8.0). The pack-schema claim orders this RFC behind
`defect-sweep` (0.5), `return-and-progression` (0.6), `trajectory-drill` (0.7) and
`pack-studio` (0.8) in the register, and behind nothing else: none of those five
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
| **R1** | §1 payload and axis rule, §2 transport, §3 selection, §4 consequence row, §6 branch-selective export | shipped runtime only |
| **R2** | §5 grid, N-column strips incl. material and structure, synchronised replay, narrative mode | R1 |
| **R3** | §7 simulate and promotion, §10 **run** schema 0.8 / migration 6 | R1, R2 |
| **R4** | §8 prediction checkpoints, §8.0 **pack** schema 0.9 | R1, R3 (run schema 0.8) |
| **R5** | §9 deep analysis and MultiPV | R1 |

`design/03-product-breadth.md:65-66,283-293` requires it: **default compare
selection and branch usefulness scoring are not in R1–R5.** They optimise a
surface that must first be correct manually, and they take §3's selection state
as their input when they are built.

## Deviations from design

1. **`design/03-product-breadth.md:62` lists "deep analysis mode" among the
   review surfaces without saying what it requests.** §9 specifies a MultiPV
   `bestline` request over the shipped evidence queue. This is a
   specialisation, not a divergence.
2. **`design/03` groups branch race, opposite-side replay and new-defense replay
   with the review surfaces (line 63-64).** They are out of scope here because
   each needs a training mode's definition of "same decision, different
   resistance" from program item #4 (`design/03:248-250`). B3's own gate row
   (line 163) does not name them.
3. **`design/03:59` lists duplicate, share and PGN-with-variations import under
   the same bullet as review.** They are run-history and platform contracts
   (B7 line 167, B8 line 168) and are not specified here. B3's gate row does not
   name import or duplicate; it names share/export, and export is discharged by
   §6.
4. **The standalone `/review` comparison route stays a stub.** The shell release
   deliberately scoped comparison inside the run (`docs/app-shell.md:36-38`) and
   this RFC preserves that boundary rather than quietly reopening it.

No other divergence.

## Acceptance criteria

**A1 — axis correctness (runtime unit, `packages/runtime/src/compare.test.ts`).**
A run with branches `X` and `Y` forked at node `F1` and branch `Z` forked at the
shallower node `F0`: `compareBranches(run, [X, Y, Z])` returns
`forkNodeId === F0`; every `plyOffset` in every collection is measured from
`F0`; the rows up to `X.ownForkOffset` report `groups` of `[[X, Y], [Z]]`; and
`Z.ownForkOffset === 0`. The test additionally asserts that the offsets returned
by `compareBranches(run, [X, Y])` differ from those in the three-branch payload
for the same nodes — the concrete proof that pairwise results are not
composable.

**A2 — payload invariants (runtime unit).** `compareBranches` throws or the
route rejects for: fewer than two distinct ids, a duplicated id, an unknown id
(`UNKNOWN_BRANCH`), and more than eight ids (`TOO_MANY_BRANCHES`). A branch
whose leaf is the set fork yields a column with no nodes and
`consequence.decision === null`, and does not throw. Element types `NodeRef`,
`ObjectiveTimelineEntry`, `CheckpointHit`, `ComparisonScore` and
`ComparisonEvidenceEntry` are asserted structurally unchanged.

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

**A5a — promotion (server integration).** `POST /runs/:id/simulate/enter` on one
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
`GET /runs/:id/events?sinceSeq=0` returns the event before reveal. A run stored
at schema `"0.7"` is migrated by migration 6, gains `origin: "played"` on every
branch, and remains readable.

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
   asserts 2 at `drill.spec.ts:215`) and the heading reads
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
   and exports"` (`drill.spec.ts:143`) continues to pass with its assertions
   updated from `{a, b}` to the branch-keyed selectors.

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

**A9 — B3.** With A1–A8 green, `design/03-product-breadth.md`'s B3 row moves
from `pairwise partial` to met: manual multi-branch selection, pairwise and
multi comparison, replay, deep mode, and export all work end to end on the
example pack. The owner's walkthrough constraint is discharged by A4, not by
A1–A3.

## Open questions

None. Both questions this draft carried were answered by owner rulings on
2026-08-13 and are specified above rather than left open: a prediction shows numbers
and never a verdict (§8, §8.0, §8.4), and simulated branches are scratch until
entered (§7).

## Changelog

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
  query. Migration 6 is unchanged and §10 says why the scratch ruling does not shrink
  it. Rewrote A5, added A5a, A6a and A6b, and rewrote the second browser test to
  assert that an un-entered simulation leaves the run untouched.
