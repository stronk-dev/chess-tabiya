# Review and multi-branch exploration — foundation alignment (program #5, B3)

Written 2026-08-12 under `planning/breadth/README.md`. Planning tier: it does not
amend `design/`. Every capability claim below cites `file:line` for what exists or
the grep that proves absence.

## 1. Scope

Surfaces owned: run history, resume, duplicate, replay, share, PGN-with-variations
export **and** import; rewind/fork at any legal node and automatic fork after
rewind-then-move; manual N-branch selection; pairwise **and** multi-branch
comparison; synchronized replay; difference strips; resulting-position grids;
narrative mode; deep analysis mode; forward-branching "simulate"; prediction
checkpoints; branch race; opposite-side replay; new-defense replay; compare
defaults and multi-branch overview; step-indexed reasoning transcript.

Gate rows owned: **B3 — review** ("manual multi-branch selection, pair/multi
compare, replay, deep mode, share/export", currently `pairwise partial`). Shares
B7's `resume partial` row for run history/resume, and B8 for share links.

The governing constraint is the owner's n=1 walkthrough
(`planning/archive/drill-client/log.md:222-255`): fork/rewind is quick and
promising; **manual compare selection is cumbersome and the comparison shows
difference without explaining consequence.** Per
`design/03-product-breadth.md:227-236`, a surface that shows difference without
explaining consequence is a mode-menu entry, not a drill. "Explains consequence"
is therefore a first-class B3 requirement in §3, not polish.

## 2. What ships today

| Capability | Shipped? | Pairwise or N-way | Evidence |
|---|---|---|---|
| Run history list | yes | n/a | `apps/server/src/rest.ts:402-405`; `apps/web/src/App.svelte:237-247` |
| Resume a run (URL-addressable) | yes | n/a | `apps/web/src/lib/session-controller.ts:166-193`; router `/play/run/:runId` `docs/app-shell.md:17-27` |
| Rewind to any node **on the active path** | yes | n/a | `packages/runtime/src/runtime.ts:303-332`; timeline built from `historyFrom(activeCursor)` only — `apps/web/src/lib/screen-model.ts:91-105` |
| Rewind by latest matching checkpoint | yes | n/a | `packages/runtime/src/runtime.ts:334-348` |
| Explicit fork with label/intent | yes | n/a | `packages/runtime/src/runtime.ts:286-292`; REST `apps/server/src/rest.ts:507-527` |
| Automatic fork after rewind-then-move | yes | n/a | `packages/runtime/src/runtime.ts:222-229` (emits `branch.forked` then `move.committed`) |
| Branch switch | yes | n/a | `apps/web/src/lib/session-controller.ts:278-280` — implemented as `rewind(leafNodeId)` |
| Branch comparison payload | yes | **pairwise-only at the runtime type level** | `packages/runtime/src/compare.ts:191-229`; return type keys every collection `{a, b}` at `compare.ts:49-64` |
| Comparison over HTTP | yes | pairwise-only | `apps/server/src/rest.ts:528-536` requires `branchAId` + `branchBId` |
| Comparison in the browser transport | yes | pairwise-only | `apps/web/src/lib/api.ts:246-250` |
| Comparison in the controller | yes | pairwise-only | `apps/web/src/lib/session-controller.ts:282-299` — parameter is `readonly [string, string]` |
| Compare **selection** UI | yes | capped at 2 | `apps/web/src/lib/DrillScreen.svelte:151-156` — checkboxes look multi-select but `compareIds.slice(-1)` evicts the oldest, so only two can ever be held |
| Synchronized replay of a comparison | yes | pairwise | `apps/web/src/lib/DrillScreen.svelte:187-201` (Space-driven stepper), rendered `CompareView.svelte:136-166` |
| Difference strips (objective + checkpoint) | yes | pairwise | `apps/web/src/lib/CompareView.svelte:218-260`; payload `compare.ts:52-59` |
| Recorded engine trajectory on the compare axis | yes | pairwise | `compare.ts:159-189`; render `CompareView.svelte:168-216`; contract `docs/explanation-grounds.md:31-60` |
| Grounded objective sentences (`from → to` + refs) | yes | pairwise | `CompareView.svelte:60-76` throws on empty grounds; `screen-model.ts:173-201` |
| PGN export with variations | yes | **N-way** | `packages/runtime/src/pgn.ts:72-106`; branch-selective REST `apps/server/src/rest.ts:320-328,435-446` |
| Branch-selective export from the UI | **no** | — | `apps/web/src/lib/session-controller.ts:305-307` calls `this.#api.pgn(runId)` with no branch ids, so the UI always exports every branch |
| PGN / study import | **no** | — | `grep -rn "parsePgn\|importPgn\|fromPgn" apps packages tools` → only `*.test.ts` files; no production caller |
| Duplicate a run | **no** | — | `apps/server/src/service.ts:129-176` creates runs from a `packId` only; `grep -rniE "duplicate\|clone" apps/web/src` → test strings only |
| Share / read-only link | **no** | — | `grep -rniE "share\|permalink" apps/web/src` → no match. Read-only *mode* exists (`WriterSession.observe`, `docs/app-shell.md:74-83`) but nothing mints or advertises a link |
| Standalone Review comparison route | **no** (by design of the shell release) | — | `apps/web/src/App.svelte:240`; `docs/app-shell.md:36-38` |
| Multi-branch overview / resulting-position grid | **no** | — | `grep -rniI "multiBranch\|thumbnail" apps packages` → no match |
| Narrative mode | **no** | — | `grep -rniI "narrative" apps packages schemas` → no match |
| Deep analysis mode | **no** | — | no client-facing analysis request exists: `enqueueEvidence` has exactly one production call site, the automatic per-move one at `apps/server/src/service.ts:405-411`; `POST /runs/:id/evidence` is *apply-a-staged-result* only (`rest.ts:537-547`) |
| Forward-branching "simulate" | **no** | — | `grep -rniI "simulate" apps packages` → one hit, unrelated prose in `apps/web/src/App.svelte:263` |
| Prediction checkpoint — **authored encoding** | **yes** | n/a | `packages/schema/src/drill-pack/types.ts:38-51`; JSON Schema `schemas/drill_pack.schema.json:309-328`; living example `schemas/drill_pack.example.json:85-93` |
| Prediction checkpoint — **sparsity enforcement** | **yes** | n/a | `packages/schema/src/drill-pack/lint.ts:115-138` — `TOO_MANY_PREDICTIONS` warns above 2 per segment |
| Prediction checkpoint — delivery to the browser | **no** | — | `apps/server/src/pack-registry.ts:66-71` projects checkpoints to `{id,label,actions}` only; regression asserts the absence at `apps/server/src/drill-client-server.test.ts:182` |
| Prediction checkpoint — UI/record/grade | **no** | — | `grep -rniI "interaction" apps/**/*.svelte` → no match; `CheckpointSheet` offers continue/rewind/compare/stop only (`docs/drill-client.md:191-193`) |
| Maia policy mass as grading input | **yes, and already reaching the browser** | n/a | parsed `apps/server/src/opponent-selector.ts:222-241`; typed `packages/runtime/src/types.ts:36-55`; persisted in `opponent.move_selected` (`types.ts:107-115`); *not* stripped by feedback withholding — `apps/server/src/feedback-policy.ts:34-39` gates only `evidence.attached` and engine-referenced `objective.state_changed` |
| Selector determinism (same question → same distribution) | yes | n/a | `apps/server/src/opponent-selector.ts:372-386` memoizes on `selectionCacheKey` |
| Branch race | **no** | — | `grep -rniI "branchRace\|branch race" apps packages` → no match |
| Opposite-side / new-defense replay | **no** | — | `retryVariants` is an untyped `{"type":"object"}` array in `schemas/drill_pack.schema.json:66-69` with zero consumers: `grep -rn "retryVariants" apps packages --include=*.ts` → no match |
| Step-indexed reasoning transcript | **no** | — | `grep -rniI "reasoning\|transcript" apps/web packages` → no match (`transcript` hits are UCI engine transcripts in `apps/server/src/engine-supervisor.ts`) |
| A recording site for learner input | **declared, never emitted** | n/a | `feedback.generated` is in the event union (`packages/runtime/src/types.ts:152-155`) and projected (`events.ts:133`) but is emitted only in latency test fixtures — `grep -rn "feedback.generated" apps packages --include=*.ts` |

**Verdict required by the brief.** Comparison is pairwise-only at the **runtime**
level, not merely the UI. `BranchComparison` hard-codes two sides in its type
(`compare.ts:49-64`), and `commonFork` (`compare.ts:86-97`) folds exactly two
paths. The UI cap (`DrillScreen.svelte:155`) is downstream of that, not the cause.
Consequence for slice size: multi-branch comparison is a **runtime payload
change plus a schema-shaped client change**, not a UI aggregation of existing
calls.

**Second load-bearing finding.** An N-branch overview cannot be honestly composed
from N−1 pairwise calls in the general case. `compare()` computes each pair's own
fork and derives `plyOffset` from *that* fork (`compare.ts:198-211`), so two
comparisons of branches forked at different nodes return offsets on different
axes. Composing them would silently align unrelated plies. Pairwise composition is
correct only when every selected branch shares one fork node.

## 3. The gap — what each capability needs to be minimally real

| Capability | Missing for minimally-real |
|---|---|
| **Manual N-branch selection** | Selection state that holds N ids (drop the `slice(-1)` eviction), a select-all/eligible affordance, and a rule for *eligible* (branches sharing a common ancestor with the cursor branch — computable today from `branchPath`). This is the ordering rule from `design/03-product-breadth.md:65-66`: manual inclusion works first; default selection and branch scoring optimize it only once the surface is correct. |
| **Multi-branch comparison** | An N-way payload keyed by branch id with one shared fork; the runtime function to fold N paths to a common ancestor; a REST body accepting `branchIds: string[]`; and an explicit typed error when the selected set has no common ancestor (the existing `NO_COMMON_FORK`/422 mapping at `rest.ts:258-261` extends cleanly). |
| **Explains consequence, not just difference** | Today compare renders *what changed* (objective transitions, checkpoint hits, cp trajectory). It never states *what the branch cost or bought*. The B3-owned, ADR-0005-safe part is a per-branch **consequence row** built only from data the run already holds: terminal vs non-terminal end state, objective end state, which authored checkpoints were reached and which were not, and the recorded engine score at the deepest common offset. `screen-model.ts:107-124` already computes leaf objective state and terminality per branch — it is not surfaced in compare at all. The *authored* half of consequence (which claim fired, timing-window accounting, Maia/corpus alternatives) is program #2's contract, enumerated as unshipped at `docs/explanation-grounds.md:140-149`. B3 must render #2's packet when it exists and must not manufacture prose in its absence. |
| **Difference strips** | Extend to N columns; add the currently absent *material* and *structure* strips, which are already deterministic rules facts (`docs/branch-runtime.md:102-109`) but never projected into `BranchComparison`. |
| **Resulting-position grid** | A grid of end-of-branch mini-boards. Needs only `branchPath(...).at(-1).fen` per branch plus the existing disabled `Chessboard` (`CompareView.svelte:105-134`); no new runtime data. |
| **Narrative mode** | A reading-order projection of the same N-way payload: fork → decision per branch → first divergence in objective/checkpoint → end state. Zero new evidence; it is a rendering of the consequence row in prose order using only the shipped sentence table (`apps/web/src/lib/evidence-sentences.ts`). |
| **Synchronized replay** | Works pairwise; needs to drive N boards from one step index, and a per-branch "line ended" marker (already implemented for two, `CompareView.svelte:105-134`). |
| **Deep analysis mode** | A client-initiated analysis request. Requires a new route wrapping the existing `RunService.enqueueEvidence` (`service.ts:287-...`) and `multiPv > 1`, since the shipped strong-engine default is `multiPv: 1` (`apps/server/src/strong-engine.ts:10-15`). Its reveal must obey the same feedback gate as `/evidence`. |
| **Simulate** | An operation that, at a spine node with N authored children, forks N real branches and walks each authored line to its end using only shipped `fork` + `moves` calls. Two things block a naive implementation: authored plies must not be committed as `actor: "opponent"` (that path demands an authoritative engine `selection`, `runtime.ts:196-204`), and every committed move currently enqueues a Stockfish job (`service.ts:405-411`), so an unguarded simulate floods the evidence queue with N×L jobs. |
| **Prediction checkpoints** | The authored side is fully shipped and already sparse-linted. Missing: delivery of `interaction` through the pack projection under a reveal-safe rule; a checkpoint UI that captures a predicted move; a board-orientation parameter (`board-model.ts:51-66` hard-codes `orientation: startSide`); a **durable record** of the prediction — no shipped event or evidence kind can carry a predicted move (`types.ts:11-18,152-155`); and, for `grading.source` values including `engine`, the deep-analysis request above. |
| **Branch race** | Depends on training-mode contracts (program #4) for what "racing" means per mode. B3 owns the two-board alternating presentation over the shipped N-way payload. |
| **Opposite-side / new-defense replay** | `retryVariants` has no typed shape and no consumer (`drill_pack.schema.json:66-69`). Minimally real = a typed variant that names a start override (side, FEN, or opponent policy mode) and creates a new run linked to the source run. The link needs a run-to-run provenance field, which the shipped run model does not have (`packages/runtime/src/types.ts:185-195`). |
| **Duplicate a run** | Create a run whose event log is seeded from a prefix of another run's log, with a fresh id and writer lease. `createRun` (`runtime.ts:130-186`) always starts a fresh single-node log; nothing composes an existing prefix. |
| **Share / read-only links** | Read-only *access* already resolves correctly from the visible lease (`docs/app-shell.md:72-83`). Missing: a URL the owner can hand out, and a spectator projection that does not leak withheld feedback — note `publicEvents` gates on the pack policy, not on the viewer, so a spectator currently sees whatever the writer may see. |
| **PGN-with-variations import** | Export round-trips today (`packages/runtime/src/pgn.test.ts:56`); the inverse has no production code. Minimally real = import a variation tree as a run whose branches mirror the PGN's variations, honestly marked as imported rather than played. |
| **Reasoning transcript** | Needs the same durable learner-input recording site as prediction. Both are the same missing primitive. |

## 4. Contracts to pin

### 4.1 The shipped comparison type each extension amends

`packages/runtime/src/compare.ts:36-64`, verbatim:

```ts
export type ComparisonScore =
  | { readonly kind: "cp"; readonly value: number }
  | { readonly kind: "mate"; readonly movesTo: number };

export interface BranchComparison {
  readonly forkNodeId: string;
  readonly pairs: readonly ComparisonPair[];
  readonly objectiveTimelines: { readonly a: ...; readonly b: ... };
  readonly checkpointHits:    { readonly a: ...; readonly b: ... };
  readonly evidence:          { readonly a: ...; readonly b: ... };
}
```

The N-way amendment replaces the `{a, b}` records with a branch-keyed collection
and keeps every element type (`ComparisonPair`, `ObjectiveTimelineEntry`,
`CheckpointHit`, `ComparisonEvidenceEntry`, `ComparisonScore`) byte-identical, so
`CompareView`'s grounded rendering and `docs/explanation-grounds.md:31-60` remain
true. Pairwise stays expressible as the two-branch case; whether the shipped
`compare()` keeps its `{a,b}` signature as a thin wrapper or is replaced is an
implementation choice, not a contract question.

`commonFork` (`compare.ts:86-97`) generalizes as a fold over N paths; it already
throws `BranchQueryError("NO_COMMON_FORK", ...)`, which `rest.ts:258-261` maps to
422. No new error code is required.

REST amendment against `apps/server/src/rest.ts:528-536` (which today reads
`requiredString(value.branchAId, ...)` / `branchBId`): accept
`branchIds: readonly string[]` with `length >= 2`, reusing the shipped
comma-list parser shape already used for export at `rest.ts:320-328`.

### 4.2 Replay and export, as shipped

Replay is read-back, never policy recomputation: `readBackReplay`
(`packages/runtime/src/replay.ts:61-78`) throws when an opponent commit has no
adjacent authoritative selection. **Any operation that writes moves into a run
must respect this**, which is what constrains simulate below.

Export is already N-way: `exportPgn(run, branchIds?)`
(`packages/runtime/src/pgn.ts:72`) and `GET /runs/:id/pgn?branches=a,b`
(`rest.ts:435-446`). The multi-branch selection state in §5/R1 becomes the input
to both compare and export, closing the UI gap at
`session-controller.ts:305-307`.

### 4.3 Simulate — fork-N-authored-variations against the real branch API

Inputs available to the browser today: the pack projection includes the spine
with `{id, moveUci, moveSan, children}` (`apps/server/src/pack-registry.ts:33-40,65`);
annotations are stripped (`drill-client-server.test.ts:175`), which is correct —
simulate shows positions, it does not narrate them.

Operation, expressed only in shipped calls:

1. For each authored child `c` of the current spine node: `POST /runs/:id/fork`
   with `{nodeId: <cursor node>, label: "sim:"+c.id, intent: c.moveSan}` —
   `rest.ts:507-527`, runtime `runtime.ts:286-292`.
2. Walk `c` to its leaf, committing each authored ply through
   `POST /runs/:id/moves` with `{uci, actor: "system"}`. `actor: "system"` is
   already accepted (`rest.ts:213-231`) and is the **only** honest actor: `"user"`
   would claim the learner played it, and `"opponent"` is rejected without an
   engine selection payload (`runtime.ts:196-204`) and would corrupt read-back
   (`replay.ts:68-74`).
3. Return the cursor to the original node via `POST /runs/:id/rewind`.
4. Render the leaf FEN of each new branch as a mini-board grid.

Determinism: authored playout, zero engine calls — consistent with the "no
LLM-manufactured chess truth" law and with `design/03-product-breadth.md:22-26`.

Two things that must be pinned with the slice, not assumed:

- **Evidence-job suppression.** Every move mutation enqueues one Stockfish job
  (`service.ts:405-411`). Simulate needs either a server-side batch operation
  that skips enqueueing for `actor: "system"` plies, or an explicit per-request
  suppression flag. Left unaddressed, a 4×12 simulate submits 48 analysis jobs
  the learner never asked for.
- **Event budget.** The supported envelope is at most 1000 events per run
  (`docs/branch-runtime.md:229-232`). A 4-variation × 12-ply simulate adds
  roughly 52 events (4 `branch.forked` + 48 `move.committed`). Two or three
  simulates per run stay inside the envelope; the slice must state a cap rather
  than discover the ceiling in use.

### 4.4 Prediction checkpoints — interaction record and grading inputs

The authored side is shipped. `packages/schema/src/drill-pack/types.ts:38-51`,
verbatim:

```ts
export type CheckpointInteraction =
  | { readonly type: "intent_capture"; readonly planClassIds: readonly string[] }
  | {
      readonly type: "prediction";
      readonly grading: {
        readonly source: "opponent_policy" | "engine" | "both";
        readonly topK?: number;
        readonly minMass?: number;
      };
      readonly flipBoard?: boolean;
    };
```

Sparsity is already mechanical: `lint.ts:115-138` emits `TOO_MANY_PREDICTIONS`
above two per segment. The design constraint "sparse, pivotal moments only" is
therefore enforced by the shipped linter and needs no new rule.

**Grading input — pinnable today.** `POST /select-move` returns the shipped
`OpponentSelection` (`packages/runtime/src/types.ts:36-55`):

```ts
export interface SelectionCandidate {
  readonly moveUci: string;
  readonly mass?: number;      // Maia policy mass, parsed at opponent-selector.ts:222-241
  readonly rank: number;
}
export interface OpponentSelection {
  readonly moveUci: string;
  readonly candidates?: readonly SelectionCandidate[];
  readonly engine: SelectionEngineIdentity;
}
```

The endpoint is pure and writer-free (`rest.ts:406-418`) and memoized on
`selectionCacheKey` (`opponent-selector.ts:372-386`), so the distribution shown
to the learner at grading time is provably the same one the opponent then plays.
`grading.source: "opponent_policy"` is therefore fully backed by shipped data,
and the frequencies are rendered, never invented — ADR-0005 clean.

**Grading input — not pinnable today, and what would pin it.**
`grading.source: "engine"` / `"both"` needs ranked engine candidates. The shipped
strong-engine profile is `multiPv: 1` (`apps/server/src/strong-engine.ts:10-15`),
so `candidateLines` yields one move. Pinning requires the deep-analysis request
route (§3) plus a `multiPv` parameter on it — the same amendment program #2 needs
for MultiPV evidence.

**Recording site — not pinnable today.** No shipped event or payload can carry a
predicted move. `feedback.generated` carries `{nodeId, evidenceRefs}` only
(`types.ts:152-155`) and is emitted nowhere in production. `evidence.attached`
payload kinds are `"eval" | "wdl" | "bestline"` with sources
`"engine_validated" | "human_model_predicted"` (`types.ts:11-18`) — none of which
means "the learner predicted this". This requires a `drill_run` schema amendment
(v0.4 → v0.5) adding one event carrying `{checkpointId, nodeId, predictedUci,
gradedAgainst}`, where `gradedAgainst` embeds the exact `OpponentSelection` used.
The same event closes the reasoning-transcript row, which needs the identical
primitive with structured rows instead of one move. Do not invent the vocabulary
from the fixture: the pinning input is one authored pack that uses a prediction
checkpoint in anger — the `content-era` job's Pack A is the natural site.

**Also not pinnable:** `minMass` has two defensible readings — "the prediction is
correct if the predicted move's mass ≥ minMass" versus "grade against the
candidate set covering minMass of the distribution". The living example uses
`{"source":"both","topK":3,"minMass":0.7}`
(`schemas/drill_pack.example.json:90`), which is consistent with both. An author
statement of intent pins it; the schema cannot.

**Board flip.** `flipBoard` needs one parameter: `boardModel()` hard-codes
`orientation: startSide` (`apps/web/src/lib/board-model.ts:51-66`). Adding an
explicit orientation argument is a two-line change with no contract consequence.

## 5. Slice plan

| Slice | Contents | Minimal real proof / acceptance scenario | Depends on |
|---|---|---|---|
| **R1 — N-branch selection, N-way compare, consequence row** | Selection state holding N ids; eligible-set rule; N-path `commonFork` fold; branch-keyed `BranchComparison`; `branchIds[]` REST body; per-branch consequence row (checkpoints reached/missed, objective end state, terminal, deepest recorded score); wire the same selection to branch-selective PGN export | Play a fixture run, fork three branches from one node, select all three with one action, open compare, see three aligned columns and three consequence rows, export exactly those three branches as one PGN with variations. Selecting branches with no common ancestor returns 422 `NO_COMMON_FORK` and the UI says so | shipped runtime only |
| **R2 — overview grid, N-way strips, synchronized replay, narrative mode** | Resulting-position mini-board grid at branch leaves; material and structure difference strips; one step index driving N boards; narrative reading-order projection over the R1 payload | From the R1 comparison, switch to grid view and see one end-position board per selected branch; press Space and all N boards advance together; narrative view reads fork → per-branch decision → first divergence → end state using only shipped sentence-table text | R1 |
| **R3 — simulate** | Server batch fork-and-walk of N authored spine children as `actor: "system"` plies, with evidence-job suppression and a stated branch/ply cap; cursor restored; result opens directly in R2's grid | At the fixture's spine node with 3 authored children, one action produces 3 real branches; the grid shows 3 end positions; entering one and continuing against the opponent works normally; exporting the run yields a legal PGN whose variations are those three lines; no evidence jobs were enqueued for the authored plies | R1, R2 |
| **R4 — prediction checkpoints** | Reveal-safe delivery of `interaction` through the pack projection; prediction capture in the checkpoint sheet; board-orientation parameter for `flipBoard`; `drill_run` v0.5 prediction record event; grading against the cached `OpponentSelection`; rendered as Maia frequencies plus recorded engine evidence only | The fixture's `predict-reply` checkpoint (`drill_pack.example.json:85-93`) pauses play with the board flipped, accepts a predicted move, records it durably, and shows the predicted move's policy mass against the ranked candidates the opponent then actually plays. Reload of the run reconstructs the prediction from `/events?sinceSeq=0`. No sentence appears that is not a rendered frequency, a rules fact, or an authored label | R1; program #2 for the engine-side grading source; `content-era` Pack A to pin `minMass` |
| **R5 — run history operations** | Duplicate-from-prefix; shareable read-only run URL with a spectator-safe projection; PGN-with-variations import as an honestly-labeled imported run; run-to-run provenance field | Duplicate a run at ply 8, play a different continuation, and compare the two runs' branches; open the share URL in a second browser profile and observe read-only with no withheld feedback visible; import an annotated PGN with two variations and see two branches in the run graph marked imported | R1; run-to-run provenance is shared with program #7 |
| **R6 — deep analysis, branch race, resistance replays, reasoning transcript** | Client-initiated analysis request with `multiPv`, gated by the shipped feedback policy; two-board alternating branch-race presentation over the R1 payload; typed `retryVariants` producing opposite-side and new-defense runs linked by R5's provenance; structured reasoning rows on R4's recording event | Request deep analysis at a compare node and receive MultiPV lines attached as durable evidence, withheld before the pack's reveal condition and visible after; run a branch race across two selected branches; start a new-defense replay from a completed run and compare it to its source; capture a three-row reasoning transcript at a checkpoint and diff it against a second attempt at the same node | R1, R4; program #2 for the analysis request; program #4 for mode semantics of race and resistance replay |

Sequencing note required by the design doc: **default compare selection and
branch usefulness scoring are not part of R1–R6.** Per
`design/03-product-breadth.md:65-66` and `238-248`, they optimize a surface that
must first be correct manually. They become the first work after R6 lands, using
R1's eligible-set rule as their input.

## 6. Dependencies in and out

| Direction | Item | Detail |
|---|---|---|
| **In, from #2 (evidence and explanation)** | The authored half of consequence | Claim triggers, timing-window semantics, per-scope reveal, feedback packets, corpus/Maia/Syzygy layers and evidence-bound LLM rendering are all listed as unshipped at `docs/explanation-grounds.md:140-149`. B3 renders them when they exist; it must never synthesize them. R1's consequence row is deliberately built only from rules- and pack-grounded facts so that B3 is not blocked on #2. |
| **In, from #2** | Client-initiated analysis request with MultiPV | Needed by R4's `engine`/`both` grading source and by R6's deep analysis. The route wraps the shipped `RunService.enqueueEvidence`. |
| **In, from #2** | Per-scope reveal | Required before `interaction` can be delivered without recreating the authored-prose leak that `planning/content-era/log.md:222-234` closed. Delivering `interaction` is narrower than delivering prose — it is a question, not an answer — but it must still be gated, not client-hidden. |
| **In, from #4 (training-mode breadth)** | Mode semantics | Branch race and opposite-side/new-defense replay need each mode's definition of "same decision, different resistance". |
| **In, from `content-era`** | One authored prediction checkpoint used in anger | Pins `minMass`, `topK`, and whether `flipBoard` helps or disorients. |
| **Out, to #2** | The N-way comparison payload | The explanation surface renders into it; its shape should be settled by R1 before #2's compare-side UI is specified. |
| **Out, to #6/#7** | Run-to-run provenance and PGN import | R5's provenance field and importer are the seam session-distillation and related-retry scheduling both need. |
| **Out, to #8 (live)** | Spectator-safe read-only projection | R5's share projection is the same primitive the streamer/academy surfaces need. |
| **Out, to platform** | Event-budget pressure | R3 and R5 both increase events per run. `docs/branch-runtime.md:237-245` names incremental reducers as the unmet prerequisite for lifting the 1000-event assumption. |

## 7. Proposed `design/BACKLOG.md` row edits

Table format is `| Idea | Take | Home |`. Existing first cells quoted; replacements
follow. These are proposals — the design tier is the owner's.

**Existing:** `| Forward-branching "simulate" — at a spine node with N variations, auto-fork N branches, walk each authored line to its end, render a grid of mini-boards showing the resulting structures |` … *"Candidate for the follow-up UI RFC alongside prediction checkpoints"*

**Replacement:**

```
| Forward-branching "simulate" — at a spine node with N variations, auto-fork N branches, walk each authored line to its end, render a grid of mini-boards showing the resulting structures | 📐 scheduled: breadth program #5, slice R3. Encoding verified against shipped code: forks use `POST /runs/:id/fork`, authored plies commit as `actor: "system"` (the only honest actor — `opponent` demands an engine selection payload and would corrupt read-back replay), and the spine reaches the browser already via the pack projection. Two constraints the slice must carry: suppress the automatic per-move Stockfish enqueue for authored plies, and cap branches×plies against the 1000-event run envelope | `planning/breadth/review-branching.md` §4.3, `01-training-model.md` Stage A, Q9 |
```

**Existing:** `| Prediction checkpoints — flip the board at pivotal moments, predict the opponent's reply, then explain why/why not |` … *"💡 owner idea 2026-08-10"*

**Replacement:**

```
| Prediction checkpoints — flip the board at pivotal moments, predict the opponent's reply, then explain why/why not | 📐 scheduled: breadth program #5, slice R4. The authored half already ships — `CheckpointInteraction.prediction` with `grading{source,topK,minMass}` and `flipBoard` is in the v0.2 schema and the living example, and sparsity is mechanically enforced by the `TOO_MANY_PREDICTIONS` lint (max 2 per segment). Grading against the Maia distribution is pinnable now: `/select-move` returns ranked candidates with policy mass and is memoized, so the graded distribution is provably the one the opponent then plays. Three things are not yet pinnable and are named as such: the browser never receives `interaction` (the pack projection strips it), no shipped event can record a predicted move (needs drill_run v0.5), and `minMass` has two defensible readings that only an authored pack can settle | `planning/breadth/review-branching.md` §4.4, `01-training-model.md`, Q8, Q9 |
```

**Existing:** `| Compare defaults and multi-branch overview |` … *"💡 owner walkthrough 2026-08-11"*

**Replacement:**

```
| Compare defaults and multi-branch overview | 📐 scheduled: breadth program #5, slices R1–R2, with the design doc's ordering rule intact — manual N-branch inclusion is R1; default selection and branch scoring are the first work after R6 and optimize R1's eligible-set rule. Reconciliation finding: comparison is pairwise at the **runtime type** level, not only the UI (`BranchComparison` keys every collection `{a,b}`), so multi-branch is a runtime payload change; and an N-branch overview cannot be composed from N−1 pairwise calls, because each pair's ply offsets are relative to that pair's own fork | `planning/breadth/review-branching.md` §2, §4.1, Q9, forward-branching simulate row |
```

**Existing:** `| Branch race UX (two boards, alternating moves) |` … *"Tangible divergence but high cognitive load — experimental, optional"*

**Replacement:**

```
| Branch race UX (two boards, alternating moves) | 📐 scheduled: breadth program #5, slice R6, as a presentation over the N-way comparison payload rather than a separate mechanism — no new runtime data, and the shipped synchronized stepper already drives two boards from one index. Its mode semantics ("same decision, different resistance") come from program #4; the cognitive-load question stays a Q9 use question answered by trying it, not by argument | `planning/breadth/review-branching.md` §5, `arch/10 §Board swapping`, Q9 |
```

**Existing:** `| Step-indexed reasoning transcript (steal from ChessMotive) |` … *"💡 2026-08-12"*

**Replacement:**

```
| Step-indexed reasoning transcript (steal from ChessMotive) | 📐 scheduled: breadth program #5, slice R6. Verified to share one missing primitive with prediction checkpoints: nothing shipped can durably record learner input — `feedback.generated` carries only `{nodeId, evidenceRefs}` and is emitted nowhere in production, and `evidence.attached` payload kinds are eval/wdl/bestline. The R4 drill_run v0.5 record event is the same primitive with structured rows, so the transcript costs the diff UI and the row vocabulary, not new infrastructure. Attempt-vs-attempt diffing is then free — both attempts are branches of the same run | `planning/breadth/review-branching.md` §4.4, §5, `01-training-model.md`, Q8, prediction-checkpoint row |
```

**Existing:** `| Branch growth and compare comprehension |` … *"Owner n=1 walkthrough 2026-08-11"*

**Replacement:**

```
| Branch growth and compare comprehension | Owner n=1 walkthrough 2026-08-11: fork/rewind is quick and promising, but manual compare selection is cumbersome and the current comparison lacks enough instruction to judge learning value. 📐 the mechanical half is scheduled as breadth program #5 slices R1–R2 (N-branch selection, N-way payload, overview grid, consequence row built from rules/pack-grounded facts only). The comprehension half stays an open Q9 question — 2/4/8-branch overview, grouping/cleanup, and phone are still answered by use, and the authored half of "consequence" is program #2's contract | exploration **Q9**, `planning/breadth/review-branching.md`, `02-product-shape.md`, `planning/archive/drill-client/log.md` |
```

**Existing:** `| Share/spectate/deep links |` … *"Drill/run URLs, read-only projections, export/import and spectator-safe views"*

**Replacement:**

```
| Share/spectate/deep links | 📐 scheduled: breadth program #5, slice R5 for the run-scoped half (duplicate, share URL, spectator-safe projection, PGN-with-variations import); program #8 consumes the same projection for live surfaces. Reconciliation finding: read-only *access* already resolves correctly from the visible writer lease, but nothing mints a shareable URL, and `publicEvents` gates on the pack's feedback policy rather than on the viewer — so a spectator projection is a real contract, not a link | B8, `planning/breadth/review-branching.md` §3, §5, `03-product-breadth.md` |
```

## 8. Owner-level questions

Two genuine product-intent forks; everything else in this dossier is an
engineering consequence of shipped code.

1. **What does a prediction being "right" mean?** `minMass` admits two readings —
   the predicted move's own policy mass clears a threshold, or the predicted move
   is inside the candidate set covering that mass. These teach different things:
   the first grades *this move is what they play*, the second grades *you were
   inside their plausible set*. The schema cannot decide it and neither can an
   implementer. (§4.4)
2. **Are simulated branches part of the run's record, or a scratch view?** §4.3
   makes them real branches in the run graph — the owner's original framing, and
   it buys entry, compare, and export for free. The cost is that a run's branch
   list mixes lines the learner chose with lines the pack demonstrated, and both
   land in the exported PGN. The alternative is a discardable projection that
   never touches the event log. This is an identity question about what a run
   *is*, not a UI preference.
