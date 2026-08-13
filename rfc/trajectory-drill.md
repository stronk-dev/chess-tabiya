# RFC: Trajectory Drill — cross-phase runs with causal provenance

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/01-training-model.md` §The four modes (Trajectory Drill row, line 100),
  §Repetition scheduling (phase is never a scheduling key, lines 50-70);
  `design/03-product-breadth.md` gate B2 and program item #4 (lines 51-52, 162, 248-250);
  `design/04-content-architecture.md` §5 (the launch set of six) and §8 (production order)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened by owner
  ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** nothing unshipped. `rfc/archive/line-drill-theory-grading.md`,
  `rfc/archive/outcome-drill-grading.md` and `rfc/archive/terminal-outcome-events.md` are all
  implemented and supply, respectively, the three-verdict membership contract and the
  no-absorbing-state law; the monotone law, `resolveAt`, and the compiled rule order; and
  `outcome.reached`. `rfc/archive/pack-optional-runs.md` supplies the session identity this RFC
  proves a trajectory cannot span
- **Parent / amends:** **`rfc/archive/drill-pack-format.md`** (pack schema 0.6 → 0.7: the `legs`
  array, the `run_trajectory` objective type, and the first meaning `mode: "trajectory"` has ever
  had), **`rfc/archive/outcome-drill-grading.md`** (its rule compiler and its validation codes gain
  a per-leg scope; its `syzygy` root assessment is refused on a leg, for a stated reason),
  **`rfc/archive/line-drill-theory-grading.md`** (its `THEORY_OBJECTIVE_NEEDS_LINE_MODE` guard is
  widened by one case and its verdict projection becomes span-scoped),
  **`rfc/archive/branch-runtime.md`** (the objective machine gains a documented second writer per
  commit, and a leg derivation beside the Line Drill derivation), and
  **`rfc/archive/drill-client.md`** (the pack projection gains one optional key; the grade line is
  rendered per leg)
- **Supersedes / superseded by:** —
- **Migration:** **none.** No persisted run shape changes, no event type is added, and no
  `DRILL_RUN_SCHEMA_VERSION` bump occurs. This RFC claims **no row in the migration register**; see
  Specification §13. Its Active-table row in `rfc/README.md` is added in the same commit.
- **Pack schema version:** **0.6 → 0.7, rebased.** `DRILL_PACK_SCHEMA_VERSION` is the same class of
  shared single-writer resource as a migration number, and it is now contended: `rfc/defect-sweep.md`
  §7 claims 0.5, while **`rfc/pack-studio-and-review.md` §and `rfc/return-and-progression.md` both
  claim 0.6** — a live collision this RFC found and does not join. This RFC takes 0.7 and orders
  after all three. See §3 and the register note added to `rfc/README.md` in the same commit.
- **Planning:** `planning/trajectory-drill/` (once implementing)

## Summary

`mode: "trajectory"` is a string in a JSON Schema enum
(`schemas/drill_pack.schema.json:23`) that appears in **zero** TypeScript files —
`grep -rn '"trajectory"' apps packages workers --include="*.ts"` returns nothing. One pack in the
tree declares it (`schemas/drill_pack.example.json:5`, `phase: "cross_phase"` at `:6`) and it
changes nothing about how that pack loads, plays or grades. `transition_to_endgame` is an
objective type with no evaluator; `transitioned` is an objective state with no producer.

So the mode that carries the product's whole thesis — that an opening produces a middlegame which
produces an ending, on one causal spine — is a label. This RFC gives it a runtime, and the central
decision is a refusal: **a trajectory is one run, and there is no encoding for a jump.** Legs are
segments of one continuous node path, transitions are checkpoint occurrences on that path, and the
provenance that proves a transition is causal is the run's own move history, because
`commitMove` is the only thing in the system that can create a node and it only accepts legal
moves (`packages/runtime/src/runtime.ts:281-287`). A trajectory that teleports the learner into a
fresh FEN is not a shape this spec permits an author to write.

The second decision is that the objective is **replaced, not transitioned**. `transitioned` is
absorbing (`packages/runtime/src/runtime.ts:32`), so grading a phase change with it stops the run
at exactly the moment a trajectory continues. Each leg carries its own objective, graded by the
shipped Line and Outcome compilers; at a boundary the outgoing leg's state is sealed and the
incoming leg begins at `active`. The trajectory itself has **no grade** — it produces an ordered
list of per-leg verdicts and the transitions between them, and nothing aggregates them.

## Motivation

### 1. What "zero code" means here, verified

Three things exist and none of them is a trajectory:

- **The label.** `raw.mode` is copied into `PackSummary` (`apps/server/src/pack-registry.ts:206`)
  and into the wire projection (`pack-registry.ts:67`), and read by one `<span>`
  (`apps/web/src/lib/PackList.svelte:34`). After
  `rfc/archive/line-drill-theory-grading.md` §4c, `mode` has exactly one behavioural consumer:
  `raw.mode === "line"` withholds the spine (`pack-registry.ts:81`). `"trajectory"` reaches no
  validator, orchestrator, selector or screen.
- **`transition_to_endgame`.** An `OBJECTIVE_TYPES` member
  (`packages/schema/src/drill-pack/types.ts:6`) and a schema enum value
  (`schemas/drill_pack.schema.json:127`). `objectiveRules` has exactly two typed branches —
  `follow_theory` (`apps/server/src/pack-orchestrator.ts:171-211`) and the four outcome types
  (`:213-275`) — and everything else compiles from `successConditions` alone. So
  `transition_to_endgame` is a catalogue label, as
  `planning/breadth/training-modes.md:92-96` already pinned.
- **`transitioned`.** A legal target in `ALLOWED_TRANSITIONS`
  (`packages/runtime/src/objective-state.ts:4-6`), an authorable `to`
  (`drill_pack.schema.json:204`), and a member of `TERMINAL_OBJECTIVE_STATES`
  (`packages/runtime/src/runtime.ts:32`). Nothing emits it.

There is also no pack-to-pack link of any kind. The pack schema root is
`additionalProperties: false` (`drill_pack.schema.json:72`), so a pack cannot even carry a
successor id without a schema change, and `retryVariants`
(`drill_pack.schema.json:66-69`) is an untyped `{"type": "object"}` array with zero readers.

### 2. The seven findings this RFC is built on

**2a. A run has exactly one session, so a trajectory cannot be a chain of runs.** `DrillRun`
carries one `packId` and one `packDigest` (`packages/runtime/src/types.ts:227-228`), one canonical
`start` (`:229`), and one `sessionDigest`; `projectRun` enforces that `start.fen` equals the root
node's FEN and that the pack pair is all-or-nothing (`packages/runtime/src/events.ts:41-59`).
`RunService.create` derives every one of those from a single `session` union member
(`apps/server/src/service.ts:163-217`). There is no operation anywhere that changes a run's
position other than `commitMove`, and `commitMove` requires a legal move from the cursor
(`runtime.ts:281-287`).

**A chain of runs is therefore a chain of root FENs with no move between them — which is the jump
cut the causal-integrity rule exists to forbid** (`archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:41-49`).
This is not a limitation this RFC works around. It is the property that makes the product's claim
checkable, and §2 of the Specification adopts it as the contract.

**2b. `transitioned` is absorbing, and using it for a trajectory transition is D12b in a third
place.** `TERMINAL_OBJECTIVE_STATES` (`runtime.ts:32`) makes `commitMove` throw `RUN_TERMINATED`
at a node in that state (`runtime.ts:275-279`), the client stops requesting replies
(`apps/web/src/lib/session-controller.ts:61`, `:372-380`), and `ALLOWED_TRANSITIONS` gives
`transitioned` an empty successor list (`objective-state.ts:9`) so nothing can leave it. The two
shipped mode RFCs each hit this shape and each wrote a law against it — `rfc/archive/outcome-drill-grading.md`
§3 ("a state that stops play may only be entered where play has already stopped") and
`rfc/archive/line-drill-theory-grading.md` §6a ("no state that stops play may be entered at all").
For a trajectory the answer is the same and sharper: **the state whose name means "the phase
changed" is the one state a phase change may not use**, because a trajectory is defined by
continuing. §4a states what `transitioned` is actually for and leaves it alone.

**2c. The objective machine holds one state per node, so two objectives cannot coexist.**
`Node.objectiveState` is a single field (`types.ts:96`); `commitMove` copies the cursor's value
onto every new node (`runtime.ts:332`); the projector is the only mutator (`events.ts:139-140`);
and `evaluateObjective` selects rules by `candidate.from === node.objectiveState`
(`objective.ts:317-320`). A trajectory that carried three objectives at once would need a second
state store, which is a run-schema change. It does not need one: **exactly one leg is in force at
any node**, which is what §4 specifies.

**2d. The three draft packs are not a trajectory and cannot be made into one.** The brief for this
RFC names them as "three real packs that a trajectory would chain"; executed against the files,
they do not chain:

| Pack | `start.fen` | learner `side` | `mode` / `phase` | design/04 §5 family |
|---|---|---|---|---|
| `content/drafts/anti-caro-advance.json:13,21` | Caro-Kann Advance after 3.e5 | white | `line` / `opening` | Caro Advance → space-vs-break → 4v3 rook |
| `content/drafts/carlsbad-minority-attack.json:5` (start block) | Carlsbad after 10 moves of a QGD Exchange | white | `plan` / `middlegame` | QGD Exchange → Carlsbad → minority-attack rook |
| `content/drafts/rook-4v3-same-side.json` (start block) | `3r2k1/5pp1/7p/8/4P3/8/5PPP/R5K1 w - - 0 1` | **black** | `outcome` / `endgame` | Caro Advance → … → 4v3 rook |

No legal sequence of moves joins any two of these positions; two of them belong to different
trajectory families in `design/04-content-architecture.md:117-119`; and the learner changes colour
between the first and the third. Concatenating them would be exactly the "stitch a random endgame
onto an opening because the session needs three sections" that
`archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:41-43` names as the failure. **They are three
packs about three phases, which is what `design/04` §8 ordered first; the trajectory is the
step after, and it is authoring work, not a join.** §12 says what this RFC ships instead.

**2e. Plan Drill has no grading contract, so "theory verdict, then plan verdict, then outcome
grade" names a middle term that does not exist.** `preserve_plan_window` is behaviourally
confirmed inert (`planning/breadth/training-modes.md:45`, `:144-155`);
`checkpoints[].interaction` has one consumer and it is a lint warning
(`packages/schema/src/drill-pack/lint.ts:237`); `planClasses` reach the projection only as
`{id, label}` under the authored-explanation contract and carry no grade. Verified again today:
`objectiveRules` (`pack-orchestrator.ts:167-276`) has two typed branches and no third. A
middlegame leg is therefore graded by its authored `successConditions` and by nothing else, which
is real — those conditions compile to the shipped predicate evaluator and drive real transitions —
and this RFC does not invent a plan verdict to fill the gap (§9c).

**2f. Every objective-level validation rule reads `pack.objective`, and a leg objective is not
`pack.objective`.** `pack-validation.ts:175-330` computes `outcomeObjective` (`:175`) and
`theoryObjective` (`:179`) from the single top-level objective and emits sixteen codes against
JSON pointers rooted at `/objective`. Left alone, a leg's objective would be validated by nothing
at all — the exact "author writes something, validator blesses it, nothing happens" failure class
the content-era audit named (`planning/breadth/training-modes.md:50`). §10 extracts the block
rather than duplicating it.

**2g. Two syzygy codes read `pack.start.fen`, and a leg's start position is not known until a run
reaches it.** `SYZYGY_ASSESSMENT_OUT_OF_RANGE` (`pack-validation.ts:339`) counts pieces in
`start.fen` and `SYZYGY_ASSESSMENT_MISMATCH` (`:360`) flips the category against `start.side`.
An endgame leg of an opening pack starts wherever the play arrived, so a static ledger record
cannot be bound to it and the whole `ledger_verified` chain of
`rfc/archive/outcome-drill-grading.md` §4d would be satisfied against the wrong position. §9b
refuses `syzygy` on a leg for that reason, which is a tightening rather than a gap.

### 3. Scope boundary

**In scope:** what makes a run a Trajectory Drill and what ends one; the leg encoding and its
entry contract; objective replacement at a boundary and the laws that make it safe; what
monotonicity means across a transition; the causal-provenance derivation and the rendering it
licenses; the organic/guided split and the behaviour of an organic run that never arrives; the
composition of the shipped Line and Outcome grading contracts per leg; the validation that makes
the encoding safe; one executable fixture and a browser acceptance.

**Out of scope,** with reasons:

| Out of scope | Why |
|---|---|
| **Authored jumps as legs** — the third and fourth validity conditions of `archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:46-49` | Those conditions justify *authoring* an endgame root; they do not describe an operation the runtime has. A jump inside a run needs a way to set a position without a move, and nothing in `packages/runtime` can do that (`commitMove` is the only node producer, `runtime.ts:321-336`). Encoding one would mean a run whose node path is discontinuous — the failure this RFC exists to prevent. A jump is a **new run**, and a sequence of runs is program item #7's territory (`design/03-product-breadth.md:256-257`), where "related retry" already lives |
| A trajectory score, completion percentage, or leg ranking | An aggregate over verdicts of three different kinds, two of which are `unknown`-shaped and one of which is "not entered". `rfc/archive/line-drill-theory-grading.md` Deviations item 1 refused the same shape for one mode; refusing it across three modes is the same argument three times over. §6 |
| Automatic phase or structure recognition | Exploration Q4c (`planning/exploration/plan.md:143-152`) and program item #3's contract. §8a uses the weakest recognition that works — author-declared conditions evaluated by the shipped predicate evaluator — and infers nothing |
| Projecting `phase` to the pack list (D6) | `PackSummary` omits `phase` (`pack-registry.ts:26-34`) while `projectPackDocument` projects it (`:68`), so D6 is a list-surface defect and item #1's foundation-edge residual (`design/03-product-breadth.md:202-205`). **`rfc/defect-sweep.md` owns it** and this RFC does not duplicate the fix. A trajectory pack is `phase: "cross_phase"` and needs nothing from the list |
| Per-leg `phase` labels | A leg would carry an authored phase word with no consumer, and the first consumer would be tempted to present it as a recognised phase. "Vocabulary grows only when a consumer grows" (`docs/drill-pack-format.md:44-48`). The pack's `phase: "cross_phase"` is the whole phase claim a trajectory makes |
| `retryVariants` — repeat / mirror / opposite-side over a trajectory | Untyped schema slot, zero readers (`drill_pack.schema.json:66-69`). It is program #4 slice 6 / #7 work and touching it here would give one vocabulary two owners |
| A perfect-play (`perfect_tablebase`) leg opponent — D8's **capability** half | Declared unimplemented and tested as such (`apps/server/src/capabilities.ts:12-23`); D8's *divergence* half belongs to `rfc/defect-sweep.md`. A trajectory needs `theory_strict`, `human_common` and `strong_engine`; all three ship (`capabilities.ts:10`) |
| D4, D5, D8, D9, D10 | All five are **owned by `rfc/defect-sweep.md`**, drafted in parallel; this RFC cites them so they are not rediscovered and duplicates none of its fixes. The action-vocabulary drift risk (`design/BACKLOG.md:117`), the release compose's missing light profile (`:118`), the schema/validator policy-mode divergence (`:130`), `start.side` schema-optional but client-fatal (`:129`), and both Stockfish specs reporting `version: "unknown"` (`:128`) — the last of which means a `strong_engine` leg's resistance line reads `v unknown`, which is honest and is what is recorded. **The one interaction:** the sweep makes `start.side` required at its pack-schema bump; this RFC's fixture declares it, and `legs` adds no second start position, so the two do not overlap |
| The selection cache omitting `policy.mode` | `selectionCacheKey` is `(policyConfigDigest, packId, seed, historyHash)` (`apps/server/src/opponent-selector.ts:180-184`). A trajectory does not change the opponent policy per leg (§8), so this RFC neither depends on nor widens it. A BACKLOG row to propose |

## Specification

### 1. What trajectory grading is allowed to know

Four facts, all derivable from the pack and the run with no evaluation:

1. **Which authored checkpoints fired at which nodes** — `checkpoint.reached` events, already
   path-scoped by `reachedOnActivePath` (`pack-orchestrator.ts:73-86`).
2. **The root-to-node move history** — `historyFrom` (`runtime.ts:471-479`).
3. **The objective state at each node and the transitions between them** —
   `objective.state_changed` (`packages/runtime/src/types.ts:157-165`).
4. **Which objective each leg declares** — authored.

Everything else — "did the opening cause this structure", "is this the characteristic middlegame",
"which phase is this" — is an assessment. This RFC computes none of them. Where the pack has
declared nothing, the product says the path did not reach the declared thing and says nothing
else (§6, §8b).

### 2. A trajectory is one run — the anti-stitching rule, mechanized

**A Trajectory Drill is one `DrillRun`. Its legs are contiguous spans of one root-to-node path.
There is no pack field, no request field and no runtime operation by which a leg begins at a
position the run did not reach by playing.**

That sentence is the whole causal-integrity rule, and it is enforced by construction rather than
by a check:

- every node other than the root is produced by `commitMove` (`runtime.ts:321-336`), which rejects
  a move that is malformed, off-turn or illegal (`runtime.ts:281-287`);
- every node's `parentId` chains back to the root, and `historyFrom` is that walk
  (`runtime.ts:471-479`);
- a run's `start.fen` must equal its root node's FEN or `projectRun` rejects the log
  (`events.ts:57-59`).

So **for any node in any run, the ordered list of moves from the leg's entry node to that node is
a complete, legal, replayable proof that the position was produced by play.** §7 names that list
`producedBy` and makes it the only thing the product is allowed to call provenance.

Two consequences, stated so they are not discovered later:

- **A trajectory pack is one pack.** Chaining `anti-caro-advance` → `carlsbad-minority-attack` →
  `rook-4v3-same-side` is not expressible, and Motivation §2d records why that is correct rather
  than restrictive.
- **A trajectory that only ever reaches its first leg is a complete, valid attempt.** The archive
  says so directly — "The player need not traverse all of them in one session" and "The product
  must not force all three phases every time"
  (`archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:66`, `:76`) — and §8b is the mechanism.

### 3. Pack format v0.7 — `legs`

`schemas/drill_pack.schema.json` bumps `$id` to `urn:chess-tabiya:schema:drill-pack:0.7` and
`DRILL_PACK_SCHEMA_VERSION` to `"0.7"` (`packages/schema/src/index.ts:2`, asserted at
`packages/schema/src/drill-pack.test.ts:49-56`). `digestDrillPack` digests the document, not the
schema version (`packages/schema/src/drill-pack/digest.ts:58-66`), so **no pack digest changes
from the bump** and no stored run is orphaned by it.

**The number is rebased, and the rebase is the point.** Five product RFCs were drafted in
parallel on 2026-08-13. `rfc/defect-sweep.md` §7 claims pack schema 0.5;
`rfc/pack-studio-and-review.md` and `rfc/return-and-progression.md` **both** claim 0.6, which
is the exact failure the migration register was instituted to stop
(`rfc/README.md` §Migration register) applied to a second shared constant. This RFC takes 0.7
and orders after all three, exactly as F2 rebased its migration to 3 rather than contest 2. The
bump costs this RFC nothing to move — pack digests are content digests and no rule here depends
on the number — so it is the cheapest of the four to rebase. Resolving the 0.5/0.6/0.6 collision
between the other three is theirs, not this one's; a pack-schema register row is added to
`rfc/README.md` so the next draft claims before writing.

#### 3a. The `legs` array

```jsonc
"legs": [
  { "id": "leg-a", "objective": { "type": "follow_theory", "summary": "…" } },
  { "id": "leg-b", "entryCheckpointId": "book-crossed",
    "objective": { "type": "execute_break", "summary": "…", "successConditions": [ … ] } },
  { "id": "leg-c", "entryCheckpointId": "pieces-off",
    "objective": { "type": "hold", "summary": "…", "grading": { … }, "successConditions": [ … ] } }
]
```

Schema (`$defs.trajectoryLeg`, `additionalProperties: false`):

| Key | Shape |
|---|---|
| `id` | `#/$defs/id`, required |
| `objective` | `#/$defs/objective`, required — **the same closed object the top level uses**, so a leg objective is a full objective with `type`, `summary`, optional `grading` and optional `successConditions` |
| `entryCheckpointId` | `#/$defs/id`, optional at the schema layer, required for every leg after the first by §10 |

`legs` is an array with `"minItems": 2`. A one-leg trajectory has no transition, and a transition
is the only thing this mode exists to test; the constraint is stated in the schema so it is
reported as `SCHEMA_MINITEMS` and not restated in `runtimeIssues`
(`pack-validation.ts:420-427` returns on the first schema failure, so the layering rule of
`rfc/archive/outcome-drill-grading.md` §5 holds).

`DrillPackDefinition` (`packages/schema/src/drill-pack/types.ts:80-102`) gains
`readonly legs?: readonly TrajectoryLeg[];` beside `authoredBoundary`. Today `legs` would arrive
through the open index signature at `:101` as `unknown`, which is how `mode` and `phase` already
arrive; a field this RFC branches on is typed rather than sniffed.

#### 3b. `run_trajectory`, and why `mode: "trajectory"` does not require `legs`

`OBJECTIVE_TYPES` (`packages/schema/src/drill-pack/types.ts:1-13`) and the schema's
`objectiveType` enum (`drill_pack.schema.json:121-135`) gain a twelfth member,
`run_trajectory`. It means "this pack's behaviour is in its legs", and it is the only top-level
type a leg-bearing pack may declare (§10).

Its effect is entirely negative and that is the point: `objectiveRules` never compiles a
`run_trajectory` objective, the top level may declare no `grading` (already enforced —
`OBJECTIVE_GRADING_UNSUPPORTED`, `pack-validation.ts:223`, fires for every non-outcome type) and
no `successConditions` (§10). What the top-level objective still carries is its `summary`, which
is the trajectory's own pre-play framing and the sentence the drill screen prints as its title
(`apps/web/src/lib/DrillScreen.svelte:449`).

**`mode: "trajectory"` does not require `legs`, and the coupling is one-way.**
`schemas/drill_pack.example.json:5` is `mode: "trajectory"` with
`objective.type: "play_until_checkpoint"` and no legs, it is the fixture for nine test files, and
its projected key set is asserted exactly at
`apps/server/src/drill-client-server.test.ts:137-152`. Requiring `legs` for the mode would refuse
it at load. It is honestly an ungraded trajectory-labelled pack — a schema example with a
theory-to-plan concept and one objective — and it keeps loading and playing unchanged. This is
the same direction `rfc/archive/line-drill-theory-grading.md` §4a chose for
`mode: "line"` versus `follow_theory`, for the same reason. `legs` **does** require
`mode: "trajectory"` (§10).

#### 3c. A leg entry is a checkpoint, and no trigger vocabulary is added

**The boundary between leg *k* and leg *k+1* is the occurrence of leg *k+1*'s
`entryCheckpointId` on the active path.** Nothing else. The frozen simple-trigger vocabulary —
`atPly`, `atSpineNode`, `atAuthoredBoundary`, `fenPredicate`, `materialBalance`
(`drill_pack.schema.json:358-401`) — is exactly what an author writes, evaluated by the shipped
`simpleTriggerMatches` (`pack-orchestrator.ts:36-59`), and `reachedOnActivePath`
(`:73-86`) already makes a checkpoint fire at most once per path.

This is the same design `rfc/archive/outcome-drill-grading.md` §3 made for `resolveAt`, for the
same reason: routing a boundary through a checkpoint means every transition carries a
`pack:<checkpointId>` evidence reference that the shipped renderer turns into the checkpoint's
authored label (`apps/web/src/lib/evidence-sentences.ts:47-58`), instead of a new vocabulary.

**A timing window may not be a leg entry.** `checkpointMatches` collapses a window trigger to its
`windowCloses` boundary (`pack-orchestrator.ts:67-69`), so a leg entered on a window would begin
at a ply the author did not write. §10 rejects it as `TRAJECTORY_LEG_ENTRY_NOT_SIMPLE`.

**One checkpoint may serve as both a leg's resolution and the next leg's entry**, and that is the
natural encoding rather than an accident: leg *k*'s `resolveAt` fires `active → preserved` on the
commit, and §4b's seal then records `preserved` as leg *k*'s verdict. §4b's ordering is written so
this works, and acceptance criterion 4 pins it.

### 4. The active leg, and objective replacement

#### 4a. Why `transitioned` does not fit, and what it is for

`transitioned` names an objective that **ends** when a phase change occurs — a drill whose whole
subject is getting there, which is exactly what `transition_to_endgame` describes. That is a
legitimate objective and this RFC leaves both the state and the type alone. It is the opposite of
a trajectory, whose subject is what happens *after* the phase changes.

**This RFC emits `transitioned` nowhere, and no leg may author it** (§10,
`TRAJECTORY_TRANSITIONED_UNSUPPORTED`). Motivation §2b is why: it is absorbing, and a mode defined
by continuing may not be graded with a state that stops play.

#### 4b. Seal and reset — the two-transition commit

`orchestratePackMove` (`pack-orchestrator.ts:278-298`) becomes four steps. Steps 1 and 2 are what
ships today; steps 3 and 4 are new.

```text
1. Fire every matching checkpoint.                       (unchanged, :285-292)
2. outgoing := legIndexAt(parentOf(node))                 // the leg the move was played inside
   run := evaluateObjective(run, objectiveRules(pack, legs[outgoing].objective), at).run
3. incoming := legIndexAt(node)                           // may exceed outgoing if an entry fired here
4. if incoming > outgoing:
     state := activeNode(run).objectiveState
     if state is absorbing:  emit nothing; the trajectory ends here (§5)
     else if state === "active":  emit nothing; the boundary is the checkpoint occurrence
     else:  run := transitionObjective(run, "active", [packEvidenceRef(legs[incoming].entryCheckpointId)], at).run
```

Six properties, each load-bearing:

- **The leg in force for a commit is the leg active at the commit's *parent*.** You played the
  move inside the outgoing leg; the transition is a consequence of that move and is graded against
  the leg you were in. This is what makes §3c's "resolution is also the next entry" case correct
  rather than an off-by-one.
- **`objectiveRules` takes the objective as a parameter.** Its signature becomes
  `objectiveRules(pack, objective = pack.objective)` (`pack-orchestrator.ts:167`), so its single
  production call site (`:293`) passes the leg's objective and every existing caller and test
  compiles unchanged. Its `follow_theory` branch keeps reading `pack.deviations` and
  `pack.authoredBoundary`, which are pack-level and correct there (§9a).
- **This is a deliberate departure from "at most one transition per commit."**
  `evaluateObjective` performs one (`objective.ts:311-326`); step 4 may perform a second. It is
  the orchestrator that is doing this, not the runtime, and the runtime's invariants are
  unchanged — `assertObjectiveTransition` still runs on each
  (`objective-state.ts:39-50`), the projector still re-asserts on replay
  (`events.ts:125-134`), and both events name the same node. **This is the single riskiest line in
  this spec** and criterion 3 is written directly against it.
- **`active → active` would throw, so the guard is not optional.** `ALLOWED_TRANSITIONS` does not
  list any state as its own successor (`objective-state.ts:3-10`), so
  `assertObjectiveTransition` throws `ObjectiveTransitionError` on a self-transition (`:44-46`)
  — and the same assertion runs again in the projector, so a stored log containing one is
  **unreplayable**, not merely mis-graded. The `state === "active"` branch of step 4 is what
  stands between a common case (a leg that resolved nothing before its boundary) and a run that
  cannot be loaded. Criterion 3b asserts it on that exact input.
- **The reset's evidence reference is `pack:<entryCheckpointId>`.** Built with the shipped
  `packEvidenceRef` (`packages/runtime/src/evidence-ref.ts:41-43`), rendered by the shipped
  renderer as the checkpoint's authored label (`evidence-sentences.ts:47-58`). **No new evidence
  namespace is added.**
- **`→ active` is a reset and nothing else can produce it.** `conditionBase.to`
  excludes `active` at the schema layer (`drill_pack.schema.json:204`) and no compiler branch
  emits it, so within a pack run an `objective.state_changed` with `to: "active"` is
  unambiguously a leg boundary. The only other writer is `applyObjectiveEvidenceProposal`
  (`objective.ts:283-309`), whose upgrader is never supplied in production. Criterion 6 pins
  this.

#### 4c. Monotonicity across a transition — the leg index, not the objective rank

`rfc/archive/outcome-drill-grading.md` §3a makes each outcome grade parity-free by forcing
`active → preserved → degraded → {achieved, failed}` with every edge forward-only;
`rfc/archive/line-drill-theory-grading.md` §6a does the same for
`active → preserved → degraded` with no absorbing state. **Both laws are per-leg and neither
extends across a boundary.** After a reset the node's `objectiveState` decreases in rank, and that
is not a regression — it is a different objective about a different position.

What is monotone across the whole trajectory is the **leg index**:

- it starts at 0 at the root and only ever increases along a path;
- it increases at most once per commit (§4b step 4 advances to one leg, and §4d says which one
  when several entries coincide);
- it never returns, because a checkpoint fires at most once per path
  (`reachedOnActivePath`, `pack-orchestrator.ts:73-86`) and the derivation of §6 only ever looks
  forward.

And the second half of the law: **a sealed leg verdict is immutable.** Once leg *k* is sealed at
the boundary node, no later commit on that path can change it, because it is read from the reset
event's `from` field (or from the absence of a reset), and events are append-only. A trajectory
cannot retroactively re-grade its opening because the ending went badly.

#### 4d. Rewind, forks, and coinciding entries

**Rewind un-transitions, per path**, by the mechanism the outcome RFC already documents: objective
state lives on nodes (`runtime.ts:332`), checkpoint re-firing is path-scoped
(`pack-orchestrator.ts:73-86`), and the leg derivation walks `historyFrom`. A fork below a
transition node re-enters that leg on its own and transitions again on its own terms; the sealed
verdict recorded on the other branch is untouched. This is what makes "reach the middlegame a
second way and compare" mean anything, and it is the one place where a trajectory and the
rewind loop meet.

**When two or more entry checkpoints fire at one node**, the run advances to the **highest-indexed**
leg among them, and every leg between the outgoing one and it is recorded with
`status: "not_entered"` (§6). The alternative — advancing one leg per commit — would strand the
higher entries permanently, because `checkpointReachedHere`-shaped occurrences do not recur. The
statically decidable half of this authoring error is rejected at load
(`TRAJECTORY_LEG_ENTRIES_COINCIDE`, §10) and the root case is already covered by the shipped
`CHECKPOINT_TRUE_AT_ROOT` and `CHECKPOINT_UNREACHABLE_AT_ROOT`
(`pack-validation.ts:393`, `:400`).

### 5. What a leg objective may be, and the absorbing law

A leg carries any `objective.type` the pack schema permits except `run_trajectory` itself, and it
is validated by the same rules that validate a top-level objective (§10). Three families behave
differently and all three are real today:

| Leg objective | Compiler | What it produces |
|---|---|---|
| `follow_theory` | `pack-orchestrator.ts:171-211` | the three membership verdicts and `active → preserved → degraded`, never absorbing (`rfc/archive/line-drill-theory-grading.md` §6a) |
| `win` / `hold` / `save` / `resist` | `pack-orchestrator.ts:213-275` | the outcome grade, absorbing only on `outcome.reached` |
| everything else (`execute_break`, `reach_structure`, `prevent_opponent_plan`, `preserve_plan_window`, …) | `conditionRules` (`pack-orchestrator.ts:141-165`) | whatever the authored `successConditions` express (§9c) |

**The law: a leg that is not the last may not enter an absorbing state except through
`outcome.reached`.** An absorbing state stops play (`runtime.ts:275-279`), so a non-final leg that
absorbs ends the trajectory. That is correct and honest when the game itself ended — checkmate in
the middlegame leg means there is no endgame leg, and the verdict says so — and it is an authoring
error in every other case. `TRAJECTORY_NONFINAL_LEG_ABSORBING` (§10) is the check, and it is
computed on the **compiled** target rather than the authored key, because
`conditionRules` defaults `to` to `"achieved"` when the author writes none
(`pack-orchestrator.ts:148`). A non-final leg with a bare
`{"kind": "reach_checkpoint", "checkpointId": "…"}` is exactly the shape that would freeze a
trajectory at its first checkpoint, and the default is why the check cannot read the JSON.

### 6. Composition of verdicts — and the aggregate that is refused

A new module `packages/runtime/src/trajectory.ts` sits beside `line.ts` for the same reason: the
runtime already depends on `@chess-tabiya/schema`, already imports `DrillPackDefinition`
(`packages/runtime/src/pack-pgn.ts:1-6`), and owns `historyFrom`.

```ts
export interface TrajectoryLegSpan {
  readonly legId: string;
  readonly legIndex: number;
  readonly entryNodeId: string;
  readonly entryPly: number;
  readonly exitNodeId?: string;      // the transition node; absent while this leg is active
  readonly exitPly?: number;
  readonly sealedState?: ObjectiveState;
}

export interface TrajectoryTransition {
  readonly fromLegId: string;
  readonly toLegId: string;
  readonly entryCheckpointId: string;
  readonly nodeId: string;
  readonly ply: number;
  readonly fromLegEntryNodeId: string;
  readonly sealedState: ObjectiveState;
  readonly producedBy: readonly string[];   // §7
  readonly skippedLegIds: readonly string[];
}

export type TrajectoryLegStatus = "entered" | "not_entered";

export interface TrajectoryLegOutcome {
  readonly legId: string;
  readonly legIndex: number;
  readonly status: TrajectoryLegStatus;
  readonly objectiveType: string;
  readonly span?: TrajectoryLegSpan;        // present iff entered
  readonly state?: ObjectiveState;          // sealed state, or the live state of the active leg
}

export interface TrajectoryVerdict {
  readonly legs: readonly TrajectoryLegOutcome[];
  readonly transitions: readonly TrajectoryTransition[];
  readonly activeLegId: string;
}

export function trajectoryLegSpans(
  pack: DrillPackDefinition, run: DrillRun, nodeId: string,
): readonly TrajectoryLegSpan[];

export function trajectoryVerdict(
  pack: DrillPackDefinition, run: DrillRun, nodeId: string,
): TrajectoryVerdict;

/** The leg index in force at a node. Root is 0. */
export function legIndexAt(
  pack: DrillPackDefinition, run: DrillRun, nodeId: string,
): number;
```

The derivation walks `historyFrom(run, nodeId)` once:

- leg 0 opens at the root node;
- at each node, collect the entry checkpoint ids of legs whose index exceeds the current one and
  whose `checkpoint.reached` event names this node; if any, close the current span at this node,
  open the highest-indexed such leg's span at this node, and mark the legs between them
  `not_entered`;
- **the transition node is the outgoing leg's `exitNodeId` and the incoming leg's `entryNodeId`.
  They are the same node.** Stated because an off-by-one at a boundary is the classic error in
  this shape;
- `sealedState` is the `from` field of the `objective.state_changed` event with `to: "active"` at
  that node, or `"active"` when there is none (§4b's guard means both cases occur normally);
- a leg with no span is `status: "not_entered"` with no `state`.

Like `lineMembership` (`packages/runtime/src/line.ts:120-158`) and `resistanceOnPath`
(`packages/runtime/src/replay.ts:103-139`), this is **computed from what is stored and never
stored**. That is what makes §13 true.

**The trajectory's grade is the ordered list and nothing else.** There is no fourth verdict, no
score, no completion fraction, and no comparison between legs. Three reasons, in decreasing order
of how much they matter:

1. Aggregating a theory membership derivation, an authored-condition state, and a WDL-floor grade
   into one number requires a commensuration nobody wrote. `AGENTS.md` law 8 governs it exactly as
   it governs a claim about chess.
2. `not_entered` is not a zero. A path that stopped in the opening is not a failed endgame, and
   any aggregate has to decide what it is.
3. Ranking legs against each other is the dashboard shape the product is defined against
   (`AGENTS.md` §Rejected).

### 7. Causal provenance: what is recorded, and what may be said

**`producedBy` is the ordered `moveUci` of every node from the outgoing leg's `entryNodeId`
(exclusive) to the transition node (inclusive), taken from `historyFrom`.** It is not a claim, a
score or an explanation. It is the run's own move list, and by §2 every one of those moves was
accepted by `commitMove` on this path.

Three rules govern what the product may say about a transition, and all three are mechanical:

1. **A transition may be presented only with its provenance.** A rendered transition names the
   entry checkpoint's authored label, the ply, and `producedBy.length`. A surface that names a
   transition without being able to print the move span does not render it at all.
2. **The product may not assert that the opening caused the structure.** It may state that these
   *n* moves, played on this path, reached the position at which the author's declared condition
   held. The transition presentation is asserted by test to contain none of `caused`, `therefore`,
   `proves`, `leads to`, `because` — the mechanical form of law 8 for this surface, written as a
   forbidden-strings assertion for the reason both shipped mode RFCs wrote one: a rendering law
   with no test is a comment.
3. **The word "trajectory" is never applied to a run that made no transition.** A run still in
   leg 0 renders its leg-0 verdict and the not-entered sentence (§8b), and nothing more.

**The PGN export carries the spine.** `exportPackRunPgn`
(`packages/runtime/src/pack-pgn.ts:87-206`) already labels authored variations
`authored:<spine-leaf-id>` (`:49`) and played branches `run:<branch-label>` (`:60`). It gains one
comment at each transition node of each exported played path:

```text
leg:<toLegId>@ply<N>
```

so the exported game is one legal PGN in which the phase boundaries are visible on the single main
line. This is the concrete form of slice 7's "the export shows one causal spine"
(`planning/breadth/training-modes.md:296`), and it is the artifact a reviewer can check without
running the product.

### 8. Organic and guided

`design/03-product-breadth.md:51-52` names "organic or guided opening → middlegame → endgame
sessions with causal provenance and objective transitions", and
`archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:16-38` defines both. This RFC's split is:

> **Organic and guided differ in what the pack authors about the *route* and in which opponent
> policy plays it. They do not differ in how a transition is recognized — both use author-declared
> entry conditions, evaluated over the run by the shipped predicate evaluator.**

| | Guided | Organic |
|---|---|---|
| Route to the next leg | authored: the pack's `spine` reaches the entry condition | none authored; the entry condition is route-independent |
| Typical entry trigger | `atSpineNode`, `atAuthoredBoundary` | `fenPredicate`, `materialBalance`, `atPly` |
| Opponent | `theory_strict` inside the spine — Maia's policy mass restricted to authored children (`opponent-selector.ts:454-487`), so the authored route is the likely route | `human_common` or `strong_engine`; the learner may arrive by any legal path |
| What the pack promises | that this route reaches the leg | that this *condition* names the leg, however it is reached |

Both are the same runtime. **No pack field distinguishes them** — a pack is guided to the extent
that its spine reaches its own entry conditions, and that is a property of the authored content,
not a mode switch. Adding an `organic: true` flag would be a second vocabulary for a fact the
`spine` already carries, and it would let a pack claim a route it does not have.

The `theory_strict` nudge stays honest for free: when the run leaves the spine, the selector falls
back to `human_common` and **records** the applied mode
(`opponent-selector.ts:456-461` → `#humanCommon` → `policyModeApplied: "human_common"` at `:433`),
which `resistanceSentences` renders as a separate fact
(`apps/web/src/lib/outcome-presentation.ts:76-83`). A learner who leaves the guided route is told
the guidance stopped, by machinery that already shipped for D15.

#### 8a. Phase recognition: author-declared, and nothing else

Q4c and D6 are live: automatic recognition does not exist and `phase` never reaches the pack list.
Of author-declared / deterministic-feature / learned recognition, **this RFC uses author-declared
only, and it is the weakest of the three that works.**

- **Learned recognition is refused.** It needs labeled ground truth, inter-reviewer agreement and
  a false-transition cost model that `planning/exploration/plan.md:143-152` says do not exist. It
  is program item #3's Just Play contract, not this one's.
- **Deterministic-feature recognition is not used as an inference, and is available as an
  encoding.** An author who wants a structural entry writes it as a `fenPredicate` or
  `materialBalance` trigger, which the shipped `evaluateObjectivePredicate` computes exactly
  (`objective.ts:202-258`). The runtime never proposes such a condition, never scores it, and
  never abstains — because it never guesses. The honest limit is stated where it bites: the
  shipped `FenPredicate` union is `transposeKey`, `pieceOnSquare` and `pawnStructure`
  (`objective.ts:43-58`), so common phase language such as "the queens are off" has no compact
  encoding, and an author who needs it writes the condition they can actually express or uses a
  ply. Widening the predicate union is a BACKLOG row to propose, with a real authored consumer.
- **Nothing about a transition is described as a phase.** A leg has no `phase` field (Scope
  boundary), the runtime emits no phase claim, and the transition sentence names the author's
  checkpoint label. If a pack's checkpoint is labelled "The queens come off", that is the author
  speaking, and `provenance.reviewStatus` is what governs whether the product believes it.

This is the same discipline `rfc/archive/line-drill-theory-grading.md` Deviations item 2 recorded
for Line Drill: "This RFC's recognition is authored: the pack says where its line is, and the
runtime resolves position identity against it. Nothing is inferred."

#### 8b. When an organic run does not arrive

**Nothing is invented, and the run is not marked down.** Concretely:

- the trajectory stays in the current leg; no checkpoint fired, so no transition exists to record;
- the leg it is in is graded exactly as its own mode grades it, and that verdict stands;
- every later leg is `status: "not_entered"` with no `state`;
- a run that simply stops is not graded further. The objective state of the last node on the path
  is the answer for the active leg, `active` included
  (`rfc/archive/outcome-drill-grading.md` §3a), and `RunSummary.objectiveState`
  (`apps/server/src/storage.ts:51-62`) carries it into history.

Rendering law: whenever at least one `not_entered` leg appears on a page, this sentence is printed
once, verbatim, and cannot be suppressed:

> "A leg this path did not reach is not a failure. Nothing here says the game should have gone
> further."

and the `not_entered` presentation is asserted by test to contain none of `failed`, `missed`,
`should`, `too slow`, `mistake`, `wrong`, `incomplete`. This is the `unknown` discipline of
`rfc/archive/line-drill-theory-grading.md` §9 applied to legs, for the same reason: silence about
something that did not happen is a fact, not a judgement.

**`RunSummary.objectiveState` is not the trajectory's grade.** After a reset it holds the *active
leg's* state, which for a trajectory that reached leg 3 and stopped reads `active`. The run list
must not present it as the run's verdict; §11 says what it renders instead. No stored shape
changes — only what a reader is permitted to conclude from it.

### 9. Composing the three shipped grading contracts

#### 9a. Line Drill inside a trajectory

Three changes, all narrow:

- **`THEORY_OBJECTIVE_NEEDS_LINE_MODE` learns one case.** Today it fires when
  `objective.type === "follow_theory"` and `mode !== "line"` (`pack-validation.ts:187`). It gains
  `|| (mode === "trajectory" && the objective is a leg objective)`. That is a one-token widening
  of a shipped guard, and it is asserted by test **because widening a guard silently is how the
  divergence class this repo tracks begins** — the same sentence
  `rfc/archive/line-drill-theory-grading.md` §7a wrote about
  `OBJECTIVE_DEGRADED_IS_ONE_WAY`.
- **At most one leg may be `follow_theory`** (`TRAJECTORY_MULTIPLE_THEORY_LEGS`, §10). The pack
  has one `authoredBoundary` (`drill_pack.schema.json:57`) and `atAuthoredBoundary` fires at most
  once per path, so two theory legs would share one boundary and one crossing.
- **Theory verdicts become span-scoped.** `projectAuthoredFeedback` emits `theory_verdict` items
  only when `pack.objective.type === "follow_theory"`
  (`apps/server/src/authored-feedback.ts:302`); for a leg-bearing pack the gate becomes "the pack
  has a `follow_theory` leg", and `lineMembership`'s entries are filtered to that leg's span on
  the reveal occurrence's path. Without the filter every middlegame and endgame ply returns
  `unknown` (`line.ts:139-144`) and the sheet fills with "this pack has no statement about this
  move" for moves the pack never claimed to cover. That is not merely noisy: `unknown` means "the
  pack is silent about this move **in a theory drill**", and outside the theory leg the pack is
  making no theory claim at all, so the sentence would be false in tone if not in letter.

`insideAuthoredBoundary`, `spinePositionIndex` and `lineMembership` are otherwise untouched. Note
that `insideAuthoredBoundary` returns `false` for every non-root node when `authoredBoundary` is
absent (`line.ts:106-107`); the shipped `CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY`
(`pack-validation.ts:202`) already prevents a pack from carrying an `atAuthoredBoundary` trigger
in that state, so a trajectory without a theory leg cannot accidentally transition on ply 1.

#### 9b. Outcome Drill inside a trajectory

- **`grading` is per leg.** `OBJECTIVE_GRADING_REQUIRED` (`pack-validation.ts:214`),
  `OBJECTIVE_GRADING_UNSUPPORTED` (`:223`), `OBJECTIVE_RESOLUTION_UNKNOWN` (`:232`) and
  `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` (`:241`) all apply, per leg, with pointers rooted at
  `/legs/{i}/objective` (§10).
- **`assessedBy.kind: "syzygy"` is refused on a leg** (`TRAJECTORY_LEG_SYZYGY_UNSUPPORTED`).
  Motivation §2g is the reason: a leg's start position is not known until a run reaches it, so
  `SYZYGY_ASSESSMENT_OUT_OF_RANGE` and `SYZYGY_ASSESSMENT_MISMATCH` would check a ledger record
  against `pack.start.fen` — the opening — and the `ledger_verified` chain of
  `rfc/archive/outcome-drill-grading.md` §4d would be satisfied against the wrong position.
  A leg's root assessment is a claim about the class of positions the leg is entered at, which is
  authored by definition, so `kind: "authored"` is the only legal value and its
  `note` renders with the shipped unproved marker (`outcome-presentation.ts:47-50`).
  `assessmentGrounding` and the sourcing check are untouched.
- **A non-final leg may not resolve at `terminal`** (`TRAJECTORY_NONFINAL_TERMINAL_RESOLUTION`).
  `resolveAt: {kind: "terminal"}` means the leg resolves only when the game ends, which never
  happens mid-trajectory, so the leg would seal at `active` forever. Honest, but an authoring
  error, and one an author cannot see without running the drill.
- **The monotone law and the resolution edge trigger are unchanged.** `checkpointReachedHere`
  (`objective.ts:230-236`) is still what makes resolution parity-free, and the compiled rule order
  of `rfc/archive/outcome-drill-grading.md` §7 is used verbatim, per leg.

#### 9c. The middle leg, and the plan verdict that does not exist

Motivation §2e verified it: there is no Plan Drill grading contract. A middlegame leg is graded by
its authored `successConditions`, compiled by `conditionRules`
(`pack-orchestrator.ts:141-165`) onto the shipped predicate evaluator, and its verdict is the
objective state plus the evidence references that produced it — the same generic surface every
non-outcome objective already has. That is real: a `material_balance → degraded` condition on a
middlegame leg produces a transition, an evidence reference and a rendered sentence today.

**This RFC invents no plan verdict, no intent-relative success and no timing-window evaluator.**
`preserve_plan_window`'s field shape cannot be pinned from the current authored corpus
(`planning/breadth/training-modes.md:146-155`), and pinning it from a trajectory fixture would be
pinning it from a file written to make a test pass. A leg may declare
`type: "preserve_plan_window"` and it will grade exactly as it does today — by its
`successConditions` and nothing else — and the product will not pretend otherwise.

### 10. Validation

All codes are `severity: "error"` (`pack-validation.ts:78` admits no other), all live in
`runtimeIssues`, and all are cross-field rules the JSON Schema cannot express. The layering rule
is kept: `validatePackDocument` returns on the first schema failure and never reaches the runtime
checks (`pack-validation.ts:420-427`), so nothing here restates `legs.minItems`, the closed leg
object, or the `run_trajectory` enum.

**The objective block is extracted, not duplicated.** `pack-validation.ts:175-330` becomes
`objectiveIssues(objective, pointerPrefix)`, closing over the pack, and is called once for
`pack.objective` at `/objective` when `legs` is absent, or once per leg at `/legs/{i}/objective`
when it is present. Motivation §2f is why: sixteen codes that read the top-level objective would
otherwise validate nothing on a leg, and re-implementing them per leg is the D4 shape. The
extraction is behaviour-preserving for every existing pack and criterion 12 asserts it byte-for-byte
on the eight pack files in the tree.

New codes:

| Code | Rule |
|---|---|
| `LEGS_NEED_TRAJECTORY_MODE` | `legs` present with `mode !== "trajectory"` |
| `LEGS_NEED_TRAJECTORY_OBJECTIVE` | `legs` present with `objective.type !== "run_trajectory"` |
| `TRAJECTORY_OBJECTIVE_NEEDS_LEGS` | `objective.type: "run_trajectory"` without `legs` |
| `TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED` | `run_trajectory` with a top-level `successConditions`. Top-level `grading` is already refused by the shipped `OBJECTIVE_GRADING_UNSUPPORTED` (`:223`), since `run_trajectory` is not an outcome type, and is not restated |
| `TRAJECTORY_DUPLICATE_LEG_ID` | two legs share an `id` |
| `TRAJECTORY_FIRST_LEG_HAS_ENTRY` | `legs[0].entryCheckpointId` is present. Leg 1 begins at the root, which no checkpoint can name |
| `TRAJECTORY_LEG_NEEDS_ENTRY` | a leg after the first with no `entryCheckpointId` — it could never begin |
| `TRAJECTORY_LEG_ENTRY_UNKNOWN` | `entryCheckpointId` names no checkpoint in this pack |
| `TRAJECTORY_LEG_ENTRY_REUSED` | two legs name the same entry checkpoint — one occurrence, two claimed boundaries |
| `TRAJECTORY_LEG_ENTRY_NOT_SIMPLE` | the entry checkpoint's trigger is a timing window (§3c) |
| `TRAJECTORY_LEG_ENTRIES_COINCIDE` | two entry checkpoints declare the same `atPly` — the statically decidable half of §4d |
| `TRAJECTORY_NONFINAL_LEG_ABSORBING` | a non-final leg whose **compiled** rules can reach `achieved` or `failed` from a condition whose `kind` is not `outcome`, including via the `to` default of `"achieved"` (§5) |
| `TRAJECTORY_NONFINAL_TERMINAL_RESOLUTION` | a non-final leg with `grading.resolveAt.kind: "terminal"` (§9b) |
| `TRAJECTORY_MULTIPLE_THEORY_LEGS` | more than one leg with `objective.type: "follow_theory"` (§9a) |
| `TRAJECTORY_LEG_SYZYGY_UNSUPPORTED` | a leg objective with `assessedBy.kind: "syzygy"` (§9b) |
| `TRAJECTORY_TRANSITIONED_UNSUPPORTED` | any leg `successConditions` entry with `to: "transitioned"` (§4a) |

**Two shipped root checks are cited, not extended.** `CHECKPOINT_TRUE_AT_ROOT`
(`pack-validation.ts:400`) already rejects a `materialBalance` or `fenPredicate` entry trigger
that holds at `start.fen`, and `CHECKPOINT_UNREACHABLE_AT_ROOT` (`:393`) already rejects
`atPly: 0`. Between them, "leg 2 begins before the learner moves" and "leg 2 can never begin" are
covered by code that runs today, and no trajectory-specific version is added.

`lintDrillPack` (`packages/schema/src/drill-pack/lint.ts`) gains nothing. Every rule above depends
on `objective.type`, on the compiled rule set, or on a checkpoint's trigger shape — none of which
the schema package has a vocabulary for, which is the same reasoning that put the root-truth check
in `runtimeIssues` (`rfc/archive/outcome-drill-grading.md` §7a).

### 11. What a trajectory renders, and when

**Leg spans and transitions are structural, not authored prose, and are not withheld.** A
transition sentence names the entry checkpoint's authored **label**, which
`projectPackDocument` already delivers before the first move
(`pack-registry.ts:82-87`), and a ply count, which is the learner's own move history. Neither is
post-commitment feedback, so no reveal gate applies and ADR-0006 is untouched. The per-leg
*verdicts* — theory verdicts, deviation notes, outcome grades — keep their own reveal contracts
exactly as they ship.

**`trajectoryVerdict` is excluded from `hasWithheldAuthoredContent`**
(`authored-feedback.ts:327`), for the reason theory verdicts are excluded: it is one entry per
leg and would pin the flag rather than count deliverable prose.

Projection and surfaces, all shipped and only extended:

- **`projectPackDocument` gains one optional key.** When `raw.legs` is present it projects
  `legs: [{id, entryCheckpointId?, objective: {type, summary, grading?}}]` — the same three
  objective keys it already projects at the top level (`pack-registry.ts:72-78`), with the same
  derived `grounding` stamp, and nothing else. `successConditions` are not projected, at the top
  level or on a leg. **When `legs` is absent the key is absent**, so the exact key-set assertion
  at `apps/server/src/drill-client-server.test.ts:137-152` — which runs against the Najdorf
  fixture, `mode: "trajectory"` — passes untouched.

  The safety argument is `rfc/archive/outcome-drill-grading.md` §4a's, unchanged: a leg's
  `objective.summary` and `assessedBy.note` are pre-play framing an author writes knowing it is
  shown before play, in the same surface class as the top-level summary. A leg summary tells the
  learner what the run is for. It is not a claim anchored inside the drill.
- **The grade line is rendered per leg.** `DrillScreen.svelte:451` calls
  `objectiveGradeSentence(pack.objective.type, currentNode.objectiveState)`
  (`outcome-presentation.ts:105-112`); for a leg-bearing pack it is called with the **active
  leg's** objective type and the node's state. A test asserts no rendered page contains
  `Objective: run_trajectory`, which would be the mechanical signature of this having been missed.
  `projectedGrading(pack)` (`outcome-presentation.ts:27-38`) gains a leg-aware sibling and
  `DrillScreen.svelte:153-159` consumes it.
- **The transition sentence** is added to `outcome-presentation.ts` beside
  `checkpointResolutionSentence` (`:114-126`) and rendered in `OutcomeContext.svelte` and in the
  timeline. Its content is fixed by §7 rule 1 and constrained by §7 rule 2.
- **`whyBanner` must not read a reset as a downgrade.** It throws if a state change carries no
  evidence reference or renders a blank sentence (`screen-model.ts:197-208`); the reset carries
  `pack:<entryCheckpointId>` and renders the checkpoint's label, so neither throw fires. What
  changes is the wording: a `→ active` transition on a leg-bearing pack renders the §7 transition
  sentence rather than the generic state-change line, so the learner is told a leg began and is
  not told the objective was reset.
- **The timeline marks transitions.** `DrillScreen.svelte:106-113` derives its markers from
  `timelineEntries` (`screen-model.ts:94-114`) and gains the transition node ids, so a boundary
  has a ply marker on the same axis the learner already reads.

Nothing is added to `GET /packs/:id` except the optional `legs` key, and no new endpoint is
created: the client already holds the full event log (`apps/web/src/lib/run-state.ts`) and the
runtime is shared TypeScript, so `trajectoryVerdict` is computed in `screen-model.ts` from data
the client already has.

### 12. The fixture

`content/drafts/trajectory-legs.browser.json` is the executable fixture for B2's Trajectory row.
It is a **mechanical fixture and makes no chess claim beyond move legality**, which it says in its
own `graduationBlockers` — the shape `content/drafts/line-boundary.browser.json` and
`schemas/fixtures/drill-pack/terminal-outcome.browser.json` already use. Its ids and labels are
about the mechanism, not about chess, so a reviewer cannot mistake it for content.

- `mode: "trajectory"`, `phase: "cross_phase"`, `objective.type: "run_trajectory"` with a summary
  that says it is a fixture.
- `opponentPolicy: {mode: "theory_strict", seedMode: "fixed"}` — deterministic under
  `ENGINE_MODE=mock`, the same choice `line-boundary.browser.json` made and for the same reason.
  Playing it off its spine exercises the recorded `human_common` fallback (§8).
- Three legs:

| Leg | `objective.type` | `entryCheckpointId` | Trigger | What it proves |
|---|---|---|---|---|
| `leg-a` | `follow_theory` | — (root) | — | the theory contract composes; requires the pack's one `authoredBoundary` and its one `atAuthoredBoundary` checkpoint |
| `leg-b` | `execute_break` | `book-crossed` | `{"atAuthoredBoundary": "crossed"}` | a checkpoint that is simultaneously leg-a's resolution and leg-b's entry (§3c); a **guided** transition |
| `leg-c` | `hold`, `grading.resolveAt` = a checkpoint, `assessedBy.kind: "authored"` | `pieces-off` | `{"fenPredicate": {"type": "pieceOnSquare", "square": "d1", "piece": null}}` | a route-independent, **organic** entry: false at the root, reachable by many paths, and reachable by paths the pack does not author |

`leg-b` declares one `{"kind": "material_balance", …, "to": "degraded"}` condition so a non-final
leg's grading is exercised without any absorbing target. `leg-c` is the final leg, so its
`hold` grading may absorb on `outcome.reached`.

No Playwright configuration change is needed: `NODE_ENV=development` loads every non-sidecar
`.json` in `content/drafts/` (`pack-registry.ts:237-250`, `playwright.config.ts:20-27`).

**The three authored drafts are not modified and are not chained.** Motivation §2d records why,
and `design/04-content-architecture.md:158` already orders the real trajectory as step (2) of the
content programme — after the three single-phase packs, as authoring work. This RFC ships the
runtime that step (2) needs and does not pre-empt its chess content.

### 13. No migration, and what is explicitly not persisted

**No persisted run shape changes.** `objective.state_changed` already carries `from`, `to` and
`evidenceRefs` (`schemas/drill_run.schema.json:420-440`), its `evidenceRefs` items are plain
non-empty strings so `pack:<entryCheckpointId>` needs no schema change, no event type is added,
and `DRILL_RUN_SCHEMA_VERSION` stays `"0.7"` (`packages/schema/src/index.ts:1`).
`STORAGE_VERSION` stays 5 (`apps/server/src/storage.ts:147`). **This RFC claims no row in the
migration register.**

Five additions look persisted and none is:

- **Leg spans, transitions and `producedBy`** (§6, §7) are derived on read from
  `historyFrom` and the event log, exactly as `lineMembership` and `resistanceOnPath` are.
- **The reset transition** is an ordinary `objective.state_changed` in the existing shape. What is
  new is its `to: "active"` value, which the run schema's `objectiveState` enum already permits
  (`drill_run.schema.json:86-95`).
- **`legs` in the pack projection** (§11) is a field of a per-request response, not a stored shape.
- **The PGN `leg:` comment** (§7) is produced at export time from the same derivation.
- **The pack-schema bump to 0.7** is not a persisted shape: pack digests are content digests,
  unaffected by the `$id` (`digest.ts:58-66`).

**Editing no existing pack means no digest changes**, so unlike the two shipped mode RFCs this one
orphans no developer test run. The one new file is a new pack with a new id.

## Deviations from design

1. **`design/04-content-architecture.md:110-119` describes a trajectory as a chain across pack
   families** — "opening family → its characteristic middlegame → the endings that structure
   actually produces" — and names a launch set of six. This RFC makes a trajectory **one pack**,
   because a chain of packs is a chain of runs and a chain of runs is a chain of root FENs with no
   move between them (Motivation §2a). The family language survives as a **catalogue** relation:
   which packs teach the phases a trajectory traverses. Making that relation explicit in the
   catalogue is a BACKLOG row for the implementer to **propose**, never to write
   (`AGENTS.md` law 5).
2. **`archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:46-49` permits an authored pedagogical jump
   and a common-consequence jump with evidence.** This RFC ships neither as a leg. Those two
   conditions justify *authoring* a pack whose root is an ending; they do not describe a runtime
   operation, and the runtime has none. Encoding one would produce a run whose node path is
   discontinuous — the failure the same document's rule exists to prevent. A jump is a new run,
   and sequencing runs is program item #7's territory. Scope boundary.
3. **`design/01-training-model.md:100` says a Trajectory Drill is graded "per-phase, linked by
   provenance".** This RFC ships per-leg, linked by provenance, and does not use the word phase for
   anything the runtime computes (§8a). "Per-phase" would require a phase claim; a leg is an
   authored span and claims only what its author wrote.
4. **`design/03-product-breadth.md:51-52` names "objective transitions".** This RFC replaces
   objectives rather than transitioning them, and never emits the state named `transitioned`
   (§4a). The design's word describes the learner's experience correctly; the state of that name
   is absorbing and would end the run.
5. **The brief's framing "a theory verdict, then a plan verdict, then an outcome grade" names a
   middle term that does not exist.** Verified today: `objectiveRules` has two typed branches and
   no plan branch (`pack-orchestrator.ts:167-276`). §9c composes what ships and says so rather
   than inventing a plan verdict inside a trajectory RFC.
6. **The compiled per-leg state machine is narrower than the runtime's, and the trajectory's is
   wider.** Within a leg the outcome and theory laws hold unchanged; across a boundary the node's
   state decreases in rank, which neither law contemplates. §4c states the trajectory's own
   monotone quantity — the leg index — rather than weakening either law.
7. **`content/drafts/anti-caro-advance.json:207` ships `opponentPolicy.mode: "theory_strict"`
   while `rfc/archive/line-drill-theory-grading.md` §10 states the pack "stays `human_common` at
   Elo 1800" and gives a reason for refusing the change.** The archive is immutable, so that RFC
   is not edited; the discrepancy is recorded here because a trajectory that reused Pack A would
   inherit the shipped policy and not the documented one. Reconciling the pack or the doc is a
   BACKLOG row for the implementer to **propose**.
8. **New BACKLOG rows this RFC asks for**, all proposals and none of them edits this RFC makes:
   the catalogue-level trajectory-family relation (item 1); a widened `FenPredicate` union with a
   real authored consumer (§8a); the `selectionCacheKey` omission of `policy.mode` (Scope
   boundary); and the Pack A policy discrepancy (item 7).

## Acceptance criteria

1. **Leg derivation, table-driven.** Over a three-leg fixture, `trajectoryLegSpans` returns the
   exact `legId`, `legIndex`, `entryNodeId`, `entryPly`, `exitNodeId`, `exitPly` and `sealedState`
   for: a path that stays in leg 0; a path that enters leg 1; a path that enters leg 2; and a path
   on which leg 1's and leg 2's entry checkpoints fire at the same node. The fourth case asserts
   the run advances to **leg 2** and that leg 1 is returned `status: "not_entered"` (§4d). Every
   case asserts the transition node is **both** the outgoing leg's `exitNodeId` and the incoming
   leg's `entryNodeId`, which is the off-by-one this criterion exists to pin.
2. **The trajectory never freezes.** After each of the two transitions, one further move commits.
   Asserted at the runtime and again in the browser (criterion 14), because
   `TERMINAL_OBJECTIVE_STATES` is what made D12b invisible at the endpoint and Motivation §2b is
   the third occurrence of that shape.
3. **The two-transition commit, and the self-transition trap.** Three assertions on one commit:
   - **3a.** A commit that both resolves leg 1 (`active → preserved`) and fires leg 2's entry
     emits **two** `objective.state_changed` events, in that order, both naming the same node; the
     node's final state is `active`; and `sealedState` for leg 1 is `preserved`.
   - **3b.** A commit that fires leg 2's entry while the objective is **already `active`** emits
     **zero** `objective.state_changed` events, does **not** throw `ObjectiveTransitionError`, and
     still yields `sealedState: "active"` for leg 1. The test states in a comment that
     `ALLOWED_TRANSITIONS` has no self-edge (`objective-state.ts:3-10`) and that a stored log
     containing one is unreplayable, so this cannot be "simplified" into an unconditional reset.
   - **3c.** The whole event log of both cases survives a round-trip through `projectRun` with
     identical node states — the replay half, since `events.ts:125-134` re-asserts every
     transition.
4. **A checkpoint that is both a resolution and an entry.** On the fixture, `book-crossed` is
   leg-a's `atAuthoredBoundary` crossing and leg-b's `entryCheckpointId`. Asserted: leg-a seals at
   `preserved`; the `checkpoint.reached` occurrence is still emitted and still reveals; leg-b's
   first graded commit evaluates leg-b's rules and not leg-a's.
5. **A non-final leg that absorbs ends the trajectory, honestly.** A fixture whose middle leg is
   `hold` and whose learner is checkmated inside it: `outcome.reached` fires, the leg grades
   `failed`, **no reset is emitted**, the next commit throws `RUN_TERMINATED`, and
   `trajectoryVerdict` reports the final leg `not_entered`. Asserted alongside a load-time case
   proving the non-terminal route to the same state is refused (criterion 8).
6. **`→ active` is a reset and only a reset.** A test walks every `objective.state_changed` event
   produced by all eight pack files in the tree plus the new fixture and asserts that `to: "active"`
   occurs **only** at leg boundaries of leg-bearing packs, so §6's derivation cannot be fooled by
   another producer.
7. **Composition of verdicts, and no aggregate.** `trajectoryVerdict` over a completed
   three-leg run returns three `TrajectoryLegOutcome`s in declared order with the correct
   `objectiveType` and `state` per leg, and two `TrajectoryTransition`s. A type-level and a
   runtime assertion together prove `TrajectoryVerdict` exposes **no** numeric field, no score, no
   count of passed legs and no ordering between legs other than `legIndex`.
8. **Load-time refusals.** Each of §10's sixteen codes has a fixture that fails
   `validatePackDocument` with that exact code, and `make pack-check FILE=<fixture>` **exits
   non-zero** for each, asserted on the process exit code rather than the issue list. Includes
   specifically: a non-final leg with a bare `{"kind": "reach_checkpoint"}` condition and **no**
   `to` (`TRAJECTORY_NONFINAL_LEG_ABSORBING` fired on the compiled default, §5); a leg with a
   timing-window entry; two legs declaring the same `atPly`; two `follow_theory` legs; a leg with
   a `syzygy` assessment; and `legs` on a `mode: "plan"` pack. A one-leg `legs` array is asserted
   to fail at the **schema** layer with `SCHEMA_MINITEMS`, not at the runtime layer, because
   claiming a rule in two layers is how a test passes against a code the validator cannot emit.
9. **Per-leg validation actually runs.** A trajectory whose *second* leg declares
   `type: "hold"` with no `grading` fails with `OBJECTIVE_GRADING_REQUIRED` at pointer
   `/legs/1/objective/grading`; one whose *third* leg declares `type: "resist"` with
   `resolveAt.kind: "terminal"` fails with `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` at
   `/legs/2/objective/grading/resolveAt`. This is the regression for Motivation §2f: before the
   extraction, both packs load clean.
10. **The theory guard widened by exactly one case.** `follow_theory` on a `mode: "plan"` pack
    still fails `THEORY_OBJECTIVE_NEEDS_LINE_MODE`; `follow_theory` as a **top-level** objective
    on a `mode: "trajectory"` pack still fails it; `follow_theory` as a **leg** objective on a
    `mode: "trajectory"` pack passes. All three asserted, because a widened guard with only the
    passing case tested is the divergence class this repo tracks.
11. **Theory verdicts are span-scoped.** On the fixture played through all three legs,
    `GET /runs/:id/authored-feedback` returns `theory_verdict` items **only** for plies inside
    leg-a's span, and none for the middlegame or endgame plies — asserted as an exact node-id set,
    not a count. A control asserts `mode: "line"` packs are unaffected: `content/drafts/anti-caro-advance.json`
    and `content/drafts/line-boundary.browser.json` return the same verdicts as before, ply for
    ply. And `hasWithheldAuthoredContent` is asserted **false** on a trajectory run whose prose is
    fully revealed but whose legs continue.
12. **Existing packs and runs are unaffected in every way.** Every pack file in the repo — the
    schema example, the five drafts and the four candidates — loads and validates under v0.7,
    asserted by a test that walks the tree, and each one's complete `runtimeIssues` output is
    asserted **identical** before and after the §10 extraction. `schemas/drill_pack.example.json`
    keeps `mode: "trajectory"` with no legs, keeps its digest, and its projected key set at
    `apps/server/src/drill-client-server.test.ts:137-152` passes untouched — the assertion that
    proves `legs` is projected only when present. Both existing Pack A browser tests
    (`tests/browser/drill.spec.ts:312`, `:357`) and the Najdorf test (`:143`) pass with their
    current assertions unchanged, as do the three outcome tests (`:22`, `:43`, `:64`, `:78`).
13. **A complete fixture trajectory run.** `content/drafts/trajectory-legs.browser.json` is played
    end to end — root, through `book-crossed`, through `pieces-off`, to a terminal position —
    through the real `Service.move` / `Service.opponentPly` path against the mock engine, with
    learner replies chosen as the first legal move. Asserted: each entry checkpoint fires exactly
    once; two transitions are recorded; each transition's `producedBy` is exactly the moves
    between its leg entry and the boundary, verified by replaying them with chessops from the
    outgoing leg's entry FEN and arriving at the transition node's FEN; the final leg's `hold`
    grading resolves against `outcome.reached`; and the whole event log survives a round-trip
    through `projectRun` with identical node states.
14. **Browser test — the transitions reach the screen, the run continues, and nothing is
    aggregated.** The fixture is played in Playwright. Asserted at the first transition: the
    checkpoint sheet shows `book-crossed`'s authored label; the transition sentence names both leg
    ids, the ply, and the number of moves played; and after pressing Continue the learner **makes
    one further move that commits**. At the second transition, the same for `pieces-off`. Then:
    the page shows a grade line for the active leg and **contains no `Objective: run_trajectory`**;
    it contains no percentage, no "2 of 3", and no leg comparison; and none of `caused`,
    `therefore`, `proves`, `leads to`, `because` appears anywhere on it.
15. **Browser test — organic entry and non-arrival, in one run.** From the same fixture: rewind to
    before the second transition, fork, and play a route to `pieces-off` that is **not on the
    pack's spine**. Asserted: leg-c is entered anyway, its span opens at the node the learner
    reached, its `producedBy` contains the off-spine moves, and the resistance line shows
    `theory_strict` **requested** with `human_common` **applied** for the off-spine plies. Then
    rewind again, fork, and play a path that never satisfies `pieces-off`. Asserted: no third
    transition exists; leg-c renders `not_entered`; the sentence "A leg this path did not reach is
    not a failure. Nothing here says the game should have gone further." is present verbatim; none
    of `failed`, `missed`, `should`, `too slow`, `mistake`, `wrong`, `incomplete` appears in that
    presentation; and leg-b's sealed verdict on the first branch is **unchanged** by either fork —
    the per-path immutability of §4c.
16. **PGN export carries one causal spine.** Exporting the completed run produces one legal PGN
    whose main line carries a `leg:leg-b@ply<N>` and a `leg:leg-c@ply<M>` comment at exactly the
    two transition nodes, alongside the existing `authored:` and `run:` labels
    (`pack-pgn.ts:49`, `:60`). The PGN is re-parsed and re-serialized by the shipped round-trip
    and every path is re-validated as legal chess, so the export cannot look plausible while being
    discontinuous.
17. **The version bump is exactly zero migrations wide.** A test asserts
    `DRILL_PACK_SCHEMA_VERSION === "0.7"`, `drill_pack.schema.json`'s `$id` at `0.7`,
    `DRILL_RUN_SCHEMA_VERSION` **still** `"0.7"`, `STORAGE_VERSION` **still** `5`, and that
    `rfc/README.md`'s migration register gains **no** row for this RFC while its Active table gains
    one.
18. `ENGINES_REQUIRED=1 make verify` green; `make test-browser` green with `retries` still unset
    (`playwright.config.ts`), run three consecutive times;
    `make pack-check FILE=content/drafts/trajectory-legs.browser.json` and
    `make pack-check FILE=schemas/drill_pack.example.json` green.
19. **Docs.** `docs/drill-pack-format.md` documents v0.7, `legs`, `run_trajectory`, the leg-entry
    checkpoint contract and the sixteen validation codes, and **corrects line 135**, which
    currently lists "trajectory `transitions`" as unimplemented content-era work;
    `docs/branch-runtime.md` documents `trajectoryLegSpans`/`trajectoryVerdict`/`legIndexAt` as
    derived read-back shapes beside the Line Drill derivations, the seal-and-reset with its
    two-transition commit and its self-transition guard, the leg-index monotone law beside the
    outcome monotone law and the theory no-absorbing law, and the `leg:` PGN comment;
    `docs/drill-client.md` documents the optional `legs` projection, the per-leg grade line, the
    transition sentence and the "not a failure" sentence; `docs/explanation-grounds.md` records
    that leg spans and transitions are structural and ungated while per-leg verdicts keep their
    reveal contracts; `docs/outcome-drill-grading.md` gains a pointer noting that outcome grading
    now compiles per leg and that a leg may not declare a `syzygy` assessment, with the reason.

## Open questions

None.

## Changelog

- 2026-08-13: created. Specifies Trajectory Drill as one run with authored legs; the
  anti-stitching rule as a structural property of the run model rather than a check; objective
  replacement with a sealed outgoing verdict instead of the absorbing `transitioned` state; the
  leg index as the monotone quantity across a boundary; `producedBy` as the only thing the product
  may call causal provenance; an organic/guided split that turns on what the pack authors about
  the route rather than on how a transition is recognized; author-declared phase recognition and
  nothing else; and the refusal of any trajectory-level aggregate. Advances the pack schema to
  v0.7 and claims no migration.
