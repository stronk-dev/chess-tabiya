# RFC: Trajectory Drill — cross-phase runs with causal provenance

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-13
- **Design refs:** `design/01-training-model.md` §The four modes (Trajectory Drill row, line 100),
  §Repetition scheduling (phase is never a scheduling key, lines 50-70);
  `design/03-product-breadth.md` surface line 51-52, **gate B2 row at `:172`**, and **program
  item #4 at `:258`**; `design/04-content-architecture.md` §5 (the launch set of six, `:109-119`)
  and §8 (production order, `:154-158`)
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened by owner
  ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** nothing unshipped. `rfc/archive/line-drill-theory-grading.md`,
  `rfc/archive/outcome-drill-grading.md` and `rfc/archive/terminal-outcome-events.md` are all
  implemented and supply, respectively, the three-verdict membership contract and the
  no-absorbing-state law; the monotone law, `resolveAt`, and the compiled rule order; and
  `outcome.reached`. `rfc/archive/pack-optional-runs.md` supplies the session identity this RFC
  proves a trajectory cannot span. **Ordered behind, not dependent on,** `rfc/defect-sweep.md`
  (pack schema 0.5, required `start.side`) and `rfc/return-and-progression.md` (pack schema 0.6):
  the ordering exists only so 0.7 follows 0.6, and no rule here reads either bump
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
  Specification §13. Its Active-table row in `rfc/README.md` is already recorded.
- **Pack schema version:** **0.7**, claimed in `rfc/README.md`'s pack-schema register. The shipped
  value is **`"0.4"`** (`packages/schema/src/index.ts:2`, `$id` at
  `schemas/drill_pack.schema.json:3`); 0.5 belongs to `rfc/defect-sweep.md` and 0.6 to
  `rfc/return-and-progression.md`, so this RFC orders **behind those two and ahead of**
  `rfc/pack-studio.md` (0.8) and `rfc/n-way-comparison.md` (0.9). The base is whatever has landed
  when this does; nothing in this RFC depends on the predecessor number, only on 0.7 being free.
  See §3.
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
  (`:213-275`) — and everything else compiles from `successConditions` alone through
  `conditionRules` (`:141-165`). So
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

### 2. The eight findings this RFC is built on

**2a. A run has exactly one session, so a trajectory cannot be a chain of runs.** `DrillRun`
carries one `packId` and one `packDigest` (`packages/runtime/src/types.ts:227-228`), one canonical
`start` (`:230`), and one `sessionDigest` (`:229`); `projectRun` enforces that `start.fen` equals
the root node's FEN and that the pack pair is all-or-nothing
(`packages/runtime/src/events.ts:42-58`).
`RunService.create` derives every one of those from a single `session` union member
(`apps/server/src/service.ts:163-217`). There is no operation anywhere that changes a run's
position other than `commitMove`, and `commitMove` requires a legal move from the cursor
(`runtime.ts:281-287`).

**A chain of runs is therefore a chain of root FENs with no move between them — which is the jump
cut the causal-integrity rule exists to forbid** (`archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:41-49`).
This is not a limitation this RFC works around. It is the property that makes the product's claim
checkable, and §2 of the Specification adopts it as the contract.

**2b. `transitioned` is absorbing, and using it for a trajectory transition is D12b
(`design/BACKLOG.md:122`) in a third place.** `TERMINAL_OBJECTIVE_STATES` is
`new Set(["failed", "achieved", "transitioned"])` (`runtime.ts:32`, verified verbatim) and it makes
`commitMove` throw `RUN_TERMINATED` at a node in that state (`runtime.ts:276-278`) — the check runs
against the **cursor** node before the move is parsed, so the throw lands on the commit *after* the
one that entered the state. The client stops requesting replies
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
trajectory families in `design/04-content-architecture.md:115-119` (QGD Exchange → Carlsbad at
`:115`, Caro Advance → 4v3 rook at `:118`); and the learner changes colour between the first and
the third. Concatenating them would be exactly the "stitch a random endgame onto an opening
because the session needs three sections" that
`archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:42` names as the failure. **They are three
packs about three phases, which is what `design/04` §8 ordered first (`:154-156`); the trajectory
is step (2) there, and it is authoring work, not a join.** §12 says what this RFC ships instead.

`planning/breadth/training-modes.md:296` proposed a slice-7 fixture
`trajectory-advance-caro.json` "reusing Pack A's opening as leg 1". That is *copying* an authored
spine into a new one-pack trajectory, not chaining runs, and it stays available to the author of
the real trajectory. It is not what this RFC's own fixture does, for the reason §12 gives: a
mechanical fixture cannot be mistaken for chess content, and a Caro-shaped one could.

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
`pack.objective`.** `runtimeIssues` (`pack-validation.ts:81-366`) computes `conditions` (`:174`),
`outcomeObjective` (`:175`), `grading` (`:178`) and `theoryObjective` (`:179`) from the single
top-level objective. Counted against the file rather than from memory, the objective-dependent
region `:174-366` emits **twenty** codes, and they are three different kinds — a distinction §10
turns on, because extracting the region wholesale would emit the third kind once per leg:

| Kind | Count | Codes |
|---|---|---|
| Rooted at `/objective`, one instance per objective | **12** | `OBJECTIVE_GRADING_REQUIRED` `:214`, `OBJECTIVE_GRADING_UNSUPPORTED` `:223`, `OBJECTIVE_RESOLUTION_UNKNOWN` `:233`, `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` `:242`, `UNSUPPORTED_OBJECTIVE_CONDITION` `:254`, `THEORY_ABSORBING_UNSUPPORTED` `:262`, `OBJECTIVE_SELF_TRANSITION` `:267`, `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME` `:280`, `OBJECTIVE_OUTCOME_TARGET_INVALID` `:293`, `OBJECTIVE_DEGRADED_IS_ONE_WAY` `:306`, `SYZYGY_ASSESSMENT_OUT_OF_RANGE` `:339`, `SYZYGY_ASSESSMENT_MISMATCH` `:360` |
| Gated on `theoryObjective` but pointing at pack-level shape (`/mode`, `/authoredBoundary`, `/checkpoints`, `/deviations`) | **7** | `THEORY_OBJECTIVE_NEEDS_LINE_MODE` `:187`, `THEORY_NEEDS_AUTHORED_BOUNDARY` `:190`, `BOUNDARY_NEEDS_PLY_HORIZON` `:193`, `BOUNDARY_GRANTS_NOTHING` `:196`, `THEORY_NEEDS_BOUNDARY_CHECKPOINT` `:199`, `THEORY_DEVIATION_NEEDS_SPINE_ANCHOR` `:207`, `BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT` `:330` |
| Objective-independent, and therefore **not** per-objective at all | **1** | `CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY` `:202` (`boundary === undefined && boundaryCheckpoints.length > 0`) |

Left alone, a leg's objective would be validated by nothing at all — the exact "author writes
something, validator blesses it, nothing happens" failure class the content-era audit named
(`planning/breadth/training-modes.md:324-325`). §10 extracts the first kind, runs the second once,
and leaves the third where it is.

**2g. Two syzygy codes read `pack.start.fen`, and a leg's start position is not known until a run
reaches it.** `SYZYGY_ASSESSMENT_OUT_OF_RANGE` (`pack-validation.ts:339`) counts pieces in
`start.fen` and `SYZYGY_ASSESSMENT_MISMATCH` (`:360`) flips the category against `start.side`.
An endgame leg of an opening pack starts wherever the play arrived, so a static ledger record
cannot be bound to it and the whole `ledger_verified` chain of
`rfc/archive/outcome-drill-grading.md` §4d would be satisfied against the wrong position. §9b
refuses `syzygy` on a leg for that reason, which is a tightening rather than a gap.

**2h. Half of the shipped predicates are path-scoped, so sealing a leg does not stop a later leg's
rules from reading an earlier leg's occurrence.** This is the finding that survived the hardest
attack on §4, and it is why §5's law is not enough on its own. `evaluateObjective` only ever runs
at the active cursor (`objective.ts:311-317` → `activeNode`), and §4b compiles the rules of the leg
in force at the commit's parent, so a leg's rules genuinely cannot re-grade an earlier leg's nodes,
and a sealed verdict genuinely cannot move (§4c). But the *predicates* those rules carry are not
span-scoped:

- `checkpointReached` resolves through `checkpointWasReached`, which searches the **whole
  root-to-node path** (`objective.ts:170-191`, `:228-229`);
- `outcomeReached` likewise scopes to `pathToNode` (`objective.ts:237-245`).

So a leg-c condition `{"kind": "reach_checkpoint", "checkpointId": "book-crossed"}` — naming
leg-b's *entry* checkpoint — is **already true at leg-c's first graded commit**, because that
checkpoint fired on this path two legs ago. The same holds for a leg naming its own
`entryCheckpointId`: the entry occurrence is on the path by construction. With `conditionRules`
defaulting `to` to `"achieved"` (`pack-orchestrator.ts:148`), a final leg written that way resolves
before the learner touches it.

Two shipped things contain this rather than one. `checkpointReachedHere` matches only an occurrence
at *this* node (`objective.ts:230-236`), which is what both `grading.resolveAt` resolution
(`pack-orchestrator.ts:266`) and the theory boundary rule (`:204`) compile to — so per-leg outcome
resolution and theory resolution are node-exact and safe as they stand. The remaining hole is the
authored `successConditions`, and §10's `TRAJECTORY_LEG_CONDITION_PRECEDES_ENTRY` closes its
statically decidable part.

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
| **Authored jumps as legs** — the third and fourth validity conditions of `archive/brief-v2/07_CONNECTED_TRAJECTORIES.md:46-49` | Those conditions justify *authoring* an endgame root; they do not describe an operation the runtime has. A jump inside a run needs a way to set a position without a move, and nothing in `packages/runtime` can do that (`commitMove` is the only node producer, `runtime.ts:321-336`). Encoding one would mean a run whose node path is discontinuous — the failure this RFC exists to prevent. A jump is a **new run**, and a sequence of runs is program item #7's territory (`design/03-product-breadth.md:266`, gate row B7 at `:177`), owned by `rfc/return-and-progression.md`, where "related retry" already lives |
| A trajectory score, completion percentage, or leg ranking | An aggregate over verdicts of three different kinds, two of which are `unknown`-shaped and one of which is "not entered". `rfc/archive/line-drill-theory-grading.md` Deviations item 1 refused the same shape for one mode; refusing it across three modes is the same argument three times over. §6 |
| Automatic phase or structure recognition | Exploration Q4c (`planning/exploration/plan.md:143-152`) and program item #3's contract. §8a uses the weakest recognition that works — author-declared conditions evaluated by the shipped predicate evaluator — and infers nothing |
| Projecting `phase` to the pack list (D6) | `PackSummary` omits `phase` (`pack-registry.ts:26-34`) while `projectPackDocument` projects it (`:68`), so D6 (`design/BACKLOG.md:136`, and `:60` for the IA it blocks) is a list-surface defect residual to item #1 (`design/03-product-breadth.md:241`). **`rfc/defect-sweep.md` owns it** and this RFC does not duplicate the fix. A trajectory pack is `phase: "cross_phase"` and needs nothing from the list |
| Per-leg `phase` labels | A leg would carry an authored phase word with no consumer, and the first consumer would be tempted to present it as a recognised phase. "Vocabulary grows only when a consumer grows" (`docs/drill-pack-format.md:44-48`). The pack's `phase: "cross_phase"` is the whole phase claim a trajectory makes |
| `retryVariants` — repeat / mirror / opposite-side over a trajectory | Untyped schema slot, zero readers (`drill_pack.schema.json:66-69`). **`rfc/return-and-progression.md` owns it** and types it at pack schema 0.6; touching it here would give one vocabulary two owners |
| A perfect-play (`perfect_tablebase`) leg opponent — D8's **capability** half | Declared unimplemented and tested as such (`apps/server/src/capabilities.ts:12-23`); D8's *divergence* half belongs to `rfc/defect-sweep.md`. A trajectory needs `theory_strict`, `human_common` and `strong_engine`; none of the three appears in `DECLARED_UNIMPLEMENTED_POLICY_MODES` (`capabilities.ts:12-23`) and all three have a selector branch (`opponent-selector.ts:427`, `:437`, `:454`) |
| D4, D5, D8, D9, D10 | All five are **owned by `rfc/defect-sweep.md`**, drafted in parallel; this RFC cites them so they are not rediscovered and duplicates none of its fixes. The action-vocabulary drift risk (`design/BACKLOG.md:117`), the release compose's missing light profile (`:118`), the schema/validator policy-mode divergence (`:134`), `start.side` schema-optional — whose live consequence, per the row's 2026-08-13 re-verification, is a **silently inverted Syzygy verdict** rather than the crash originally ledgered (`:133`) — and both Stockfish specs reporting `version: "unknown"` (`:132`), the last of which means a `strong_engine` leg's resistance line reads `v unknown`, which is honest and is what is recorded. **The one interaction:** the sweep makes `start.side` required at its pack-schema bump; this RFC's fixture declares it, and `legs` adds no second start position, so the two do not overlap |
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
`packages/schema/src/drill-pack.test.ts:49-56`, whose `describe` title and both assertions name the
version literally and move with it). `digestDrillPack` digests the document, not the
schema version (`packages/schema/src/drill-pack/digest.ts:58-66`), so **no pack digest changes
from the bump** and no stored run is orphaned by it.

**The number is claimed, not derived from the tree.** The value in the tree today is
`"0.4"` (`packages/schema/src/index.ts:2`; `$id` `urn:chess-tabiya:schema:drill-pack:0.4` at
`schemas/drill_pack.schema.json:3`) — every higher number belongs to a draft. Six product RFCs were
drafted in parallel on 2026-08-13, and three of them wrote a pack-schema version before any of them
claimed one: `rfc/defect-sweep.md` took 0.5, and `rfc/pack-studio.md` (then
`pack-studio-and-review.md`) and `rfc/return-and-progression.md` **both** took 0.6 — the exact
failure the migration register was instituted to stop (`rfc/README.md` §Migration register),
applied to a second shared constant. This RFC did not join the contention: it took **0.7**, and
the register in `rfc/README.md` now records the resolved order — 0.5 `defect-sweep`, 0.6
`return-and-progression`, **0.7 this RFC**, 0.8 `pack-studio` (which rebased 0.6 → 0.7 → 0.8),
0.9 `n-way-comparison`. The bump costs this RFC nothing to move — pack digests are content digests
and no rule here depends on the number — which is why it was the cheapest one to rebase, and it
would rebase again as cheaply. **This RFC does not require 0.5 or 0.6 to have landed**; if it lands
first the constant goes 0.4 → 0.7 and the intervening numbers stay reserved.

`rfc/n-way-comparison.md` also removes a key named `grading` at 0.9, but from
`$defs/checkpointInteraction`, not from `$defs/objective` — the prediction-checkpoint grading the
owner struck. Per-leg `objective.grading` (§9b) is untouched by it.

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
| `objective` | `#/$defs/objective`, required — **the same closed object the top level uses** (`drill_pack.schema.json:137-149`: `required: ["type","summary"]`, `additionalProperties: false`), so a leg objective is a full objective with `type`, `summary`, optional `grading` and optional `successConditions` |
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
authored label (`apps/web/src/lib/evidence-sentences.ts:53-60`), instead of a new vocabulary.

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
2. outgoing := legIndexAt(pack, run, parentOf(node).id)   // the leg the move was played inside
   run := evaluateObjective(run, objectiveRules(pack, legs[outgoing].objective), at).run
3. incoming := legIndexAt(pack, run, node.id)             // may exceed outgoing if an entry fired here
4. if incoming > outgoing:
     state := activeNode(run).objectiveState
     if state is absorbing:  emit nothing; the trajectory ends here (§5)
     else if state === "active":  emit nothing; the boundary is the checkpoint occurrence
     else:  run := transitionObjective(run, "active", [packEvidenceRef(legs[incoming].entryCheckpointId)], at).run
```

**When `pack.legs` is absent, steps 3 and 4 are skipped and step 2 passes `pack.objective`, so the
whole path reduces to the two lines that ship today** (`pack-orchestrator.ts:293`). Every pack in
the tree takes that reduction, which is why criterion 12 can assert byte-identical behaviour for
all of them.

The step-4 branch is **exhaustive over the six states, and that is checkable rather than
asserted.** `ALLOWED_TRANSITIONS` (`objective-state.ts:3-10`) gives `preserved` and `degraded` an
`active` successor (`:5`, `:6`); gives `active` none (`:4` omits itself); and gives `failed`,
`achieved` and `transitioned` no successors at all (`:7-9`). So the two guards cover exactly the
four states from which `→ active` would throw, and the fall-through covers exactly the two from
which it is legal. There is no seventh case.

Seven properties, each load-bearing:

- **The leg in force for a commit is the leg active at the commit's *parent*.** You played the
  move inside the outgoing leg; the transition is a consequence of that move and is graded against
  the leg you were in. This is what makes §3c's "resolution is also the next entry" case correct
  rather than an off-by-one. Every commit has a parent — the root is created by `createRun`, never
  by `commitMove` — so `parentOf(node)` is total here.
- **`objectiveRules` takes the objective as a parameter, and every `pack.objective` read inside it
  moves with the parameter.** Its signature becomes
  `objectiveRules(pack, objective = pack.objective)` (`pack-orchestrator.ts:167`), so its single
  production call site (`:293`) passes the leg's objective and every existing caller and test
  compiles unchanged. The rename is not cosmetic and is not optional: **all seven reads must
  switch** — `successConditions` (`:170`), the `follow_theory` test (`:171`), the outcome-type test
  (`:213-215`), the `win`/`hold` draw target (`:240`), the `resist` test (`:241`), and
  **`grading?.resolveAt` at `:242` and `:259`**. Leaving the last two on `pack.objective` is the
  failure mode with teeth: a leg-bearing pack's top-level objective is `run_trajectory` with no
  `grading` (§3b), so a `resist` or `hold` leg would compile with **no resolution rule at all** and
  seal at `active` forever while every load-time check passed. Its `follow_theory` branch keeps
  reading `pack.deviations` (`:173`) and the pack's `atAuthoredBoundary` checkpoint (`:192-196`),
  which are pack-level and correct there (§9a).
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
  renderer as the checkpoint's authored label (`evidence-sentences.ts:53-60`). **No new evidence
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
- it advances at most once per commit, though a single advance may skip legs: §4b step 4 performs
  one reset, and §4d says which leg it lands on when several entries coincide;
- it never returns, because a checkpoint fires at most once per path
  (`reachedOnActivePath`, `pack-orchestrator.ts:73-86`) and the derivation of §6 only ever looks
  forward.

And the second half of the law: **a sealed leg verdict is immutable, and the reason is stronger
than append-only events.** Once leg *k* is sealed at the boundary node, no later commit on that
path can change it, because (i) `evaluateObjective` only ever evaluates at the active cursor
(`objective.ts:315`), (ii) §4b compiles the rules of the leg in force at that cursor's *parent*,
and the leg index never decreases along a path, so leg *k*'s rules are never compiled again once
the path is past the boundary, and (iii) the seal is read back from the node's own recorded state
(§6), and events are append-only. A trajectory cannot retroactively re-grade its opening because
the ending went badly.

What that argument does **not** buy is span-scoped *predicates*: a later leg's rules still evaluate
against path-scoped facts that an earlier leg produced. Motivation §2h is the finding, and §10's
`TRAJECTORY_LEG_CONDITION_PRECEDES_ENTRY` is the containment.

#### 4d. Rewind, forks, and coinciding entries

**Rewind un-transitions, per path**, by the mechanism the outcome RFC already documents: objective
state lives on nodes (`runtime.ts:332`), checkpoint re-firing is path-scoped
(`pack-orchestrator.ts:73-86`), and the leg derivation walks `historyFrom`. The direction matters
and is easy to state backwards, so: **a fork taken from a node *above* a transition — an ancestor
of the boundary node — starts a path on which the entry checkpoint has not fired, so that path
re-enters the outgoing leg and transitions again on its own terms.** A fork taken from a node
*below* the boundary inherits the transition, because the boundary node is on its path and
`reachedOnActivePath` sees the occurrence; that is also correct — you did cross it. Either way the
sealed verdict recorded on the other branch is untouched, because it is read from that branch's own
nodes. This is what makes "reach the middlegame a second way and compare" mean anything, and it is
the one place where a trajectory and the rewind loop meet.

**When two or more entry checkpoints fire at one node**, the run advances to the **highest-indexed**
leg among them, and every leg between the outgoing one and it is recorded with
`status: "not_entered"` (§6). The alternative — advancing one leg per commit — would strand the
higher entries permanently, because `checkpointReachedHere`-shaped occurrences do not recur. The
statically decidable half of this authoring error is rejected at load
(`TRAJECTORY_LEG_ENTRIES_COINCIDE`, §10) and the root case is already covered by the shipped
`CHECKPOINT_UNREACHABLE_AT_ROOT` (`pack-validation.ts:393`) and `CHECKPOINT_TRUE_AT_ROOT`
(`:401`).

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
`outcome.reached`.** An absorbing state stops play (`runtime.ts:276-278`), so a non-final leg that
absorbs ends the trajectory. That is correct and honest when the game itself ended — checkmate in
the middlegame leg means there is no endgame leg, and the verdict says so — and it is an authoring
error in every other case. `TRAJECTORY_NONFINAL_LEG_ABSORBING` (§10) is the check, and it is
computed on the **compiled** target rather than the authored key, because
`conditionRules` defaults `to` to `"achieved"` when the author writes none
(`pack-orchestrator.ts:148`). A non-final leg with a bare
`{"kind": "reach_checkpoint", "checkpointId": "…"}` is exactly the shape that would freeze a
trajectory at its first checkpoint, and the default is why the check cannot read the JSON. The
outcome compiler's own `outcome-*` rules (`pack-orchestrator.ts:224-253`) are exempt by
construction: every one of them is predicated on `outcomeReached`, which is the one door the law
leaves open.

**When a leg does absorb, the trajectory ends there and the derivation must agree with the
runtime.** §4b step 4 emits no reset from an absorbing state, so the run does **not** advance a
leg, even though the incoming leg's entry checkpoint may have fired at that same node. §6's
derivation carries the same stop condition, because a derivation that advanced where the runtime
did not would report a leg as entered that the runtime never graded.

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
  /** True when the active leg reached an absorbing state; no later leg can be entered. */
  readonly stopped: boolean;
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

The derivation walks `historyFrom(run, nodeId)` once. It must reproduce §4b's decisions exactly —
the two are the write side and the read side of one rule — so each step below names the §4b step it
mirrors:

- leg 0 opens at the root node;
- at each node, collect the entry checkpoint ids of legs whose index exceeds the current one and
  whose `checkpoint.reached` event names this node. **If the node's own `objectiveState` is
  absorbing, do not advance** — this mirrors §4b step 4's first guard, sets `stopped: true`, and
  leaves every later leg `not_entered`. Otherwise close the current span at this node, open the
  highest-indexed such leg's span at this node, and mark the legs between them `not_entered`;
- **the transition node is the outgoing leg's `exitNodeId` and the incoming leg's `entryNodeId`.
  They are the same node.** Stated because an off-by-one at a boundary is the classic error in
  this shape;
- **`sealedState` is the `from` of the `objective.state_changed` with `to: "active"` at that node
  when one exists, and otherwise the node's own `objectiveState`.** The fallback is the correction,
  and it is not cosmetic. §4b emits no reset in **two** cases, not one: when the outgoing state is
  already `active`, and when it is absorbing. A derivation whose fallback was the literal
  `"active"` would therefore report `active` for a leg that had actually sealed `achieved` or
  `failed` — silently converting the honest "the game ended in the middlegame" case into "the
  middlegame leg is still running". Reading the node covers all three shapes with one rule:
  `preserved`/`degraded` seal via the reset's `from`; `active` seals as `active`, which is what the
  node reads anyway; absorbing seals as the absorbing state, which only the node carries;
- a leg with no span is `status: "not_entered"` with no `state`;
- `stopped` is true iff the last node on the walk carries an absorbing `objectiveState`. It is a
  boolean about the run, not a grade, and §6's refusal of aggregates still holds — it names why
  there is no later leg, which the `not_entered` sentence of §8b would otherwise leave unexplained.

Like `lineMembership` (`packages/runtime/src/line.ts:120-158`) and `resistanceOnPath`
(`packages/runtime/src/replay.ts:103-138`), this is **computed from what is stored and never
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

**It is replayable in the strict sense, and that is testable rather than asserted.** `historyFrom`
returns `Node`s (`runtime.ts:471-479`), each carrying `moveUci`, `fen` and `moveSan`, and every
non-root node was produced by `commitMove`, which rejects malformed, off-turn and illegal moves
(`runtime.ts:281-287`) and stores the resulting canonical FEN (`:319-320`). So replaying
`producedBy` with chessops from the outgoing leg's `entryNodeId` FEN arrives at the transition
node's FEN, move for move — which is exactly what criterion 13 asserts, and exactly what a
stitched trajectory could not satisfy. The `moveUci` of the root node is `null` (`types.ts:90`),
which is why the range is entry-**exclusive**.

Three rules govern what the product may say about a transition, and all three are mechanical:

1. **A transition may be presented only with its provenance.** A rendered transition names the
   entry checkpoint's authored label, the ply, and `producedBy.length`. A surface that names a
   transition without being able to print the move span does not render it at all. The three
   surfaces that name a transition are enumerated in §11 — the transition sentence in
   `OutcomeContext.svelte`, the timeline marker, and the PGN `leg:` comment — and each carries
   `producedBy.length` or, in the PGN's case, the ply at which the span closes, which the moves
   themselves precede on the same line.
2. **The product may not assert that the opening caused the structure.** It may state that these
   *n* moves, played on this path, reached the position at which the author's declared condition
   held. The transition presentation is asserted by test to contain none of `caused`, `therefore`,
   `proves`, `leads to`, `because` — the mechanical form of law 8 for this surface, written as a
   forbidden-strings assertion for the reason both shipped mode RFCs wrote one: a rendering law
   with no test is a comment.
3. **The word "trajectory" is never applied to a run that made no transition.** A run still in
   leg 0 renders its leg-0 verdict and the not-entered sentence (§8b), and nothing more.

#### 7a. The PGN export carries the spine — and the comment channel it needs does not exist yet

The intended artifact is one legal PGN whose main line carries, at each transition node of each
exported played path:

```text
leg:<toLegId>@ply<N>
```

so the phase boundaries are visible on a single line. This is the concrete form of slice 7's "the
export shows one causal spine" (`planning/breadth/training-modes.md:296`), and it is the artifact a
reviewer can check without running the product.

**It is not one line of code, and this spec does not pretend otherwise.** `exportPackRunPgn`
(`packages/runtime/src/pack-pgn.ts:164-205`) does not export the run. It builds a **synthetic**
`DrillRun` (`combinedRun`, `:122-158`) by replaying move lists through `commitMove`
(`appendPath`, `:103-120`) into a fresh run whose id is `${source.id}:combined-pgn` and whose node
ids therefore share nothing with the source run's. `exportPgn` (`packages/runtime/src/pgn.ts:74-108`)
then keys its PGN tree on *that* run's node ids, and the only comment it can emit is
`startingComments` on the first move of a non-first branch (`pgn.ts:88-95`). There is no per-node
comment channel, and no correspondence from a source transition node to a synthetic one. Four
narrow changes supply it:

1. **`PathMove` gains `readonly comment?: string`** (`pack-pgn.ts:31-34`). `authoredPaths`
   (`:42-52`) never sets it.
2. **`playedPaths` (`:54-75`) sets it** from `trajectoryVerdict(pack, run, <branch leaf>)`: the
   move whose source node id equals a `TrajectoryTransition.nodeId` carries
   `leg:${toLegId}@ply${ply}`. When `pack.legs` is absent no move carries one and the export is
   byte-identical to today's.
3. **`uniquePaths` (`:77-84`) merges comments instead of discarding them.** It keys on the move
   UCIs alone and keeps the **first** path with a given key, and `combinedRun` (`:135-138`) puts
   `authoredPaths` first — so a played path that exactly retraces the authored spine is currently
   dropped in favour of the authored one. Left alone, that is precisely the run whose leg comments
   would vanish: the guided fixture. `uniquePaths` therefore copies any `comment` from a discarded
   duplicate onto the retained path at the same index, and it is the merge, not the dedupe, that
   criterion 16 pins.
4. **`appendPath` accumulates a `Map<syntheticNodeId, string>`** as it commits (`commitMove`
   returns the run whose last node is the one just created), `combinedRun` returns
   `{ run, comments }`, and **`exportPgn` gains an optional third parameter**
   `comments?: ReadonlyMap<string, string>`; where a node id is present, the created `ChildNode`
   gets `comments: [text]` — a field chessops' `PgnNodeData` already declares alongside
   `startingComments` (`chessops@0.15.1/dist/types/pgn.d.ts:136-141`), so `makePgn` renders it with
   no serializer change. Existing callers pass nothing and are unaffected; `exportPgn`'s existing
   validation-only call at `pack-pgn.ts:204` is unchanged.

Nothing about the run is persisted by this and no PGN header is added. The legality guarantee is
the shipped one: `validatePath` (`pgn.ts:26-45`) re-checks every exported move against chessops and
throws on the first illegal one, so a discontinuous export is not merely detectable — it cannot be
produced.

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

**The claim that recognition is identical across the split is checkable against the frozen trigger
vocabulary, not just asserted.** A leg entry is a checkpoint (§3c), a checkpoint's trigger is
`simpleTrigger` or `timingWindow` (`$defs/trigger`, `drill_pack.schema.json:412`, reached from
`$defs/checkpoint` at `:461`), and `simpleTrigger` is closed
at five members (`:358-400`) — `atPly`, `atSpineNode`, `atAuthoredBoundary`, `fenPredicate`,
`materialBalance`. All five reach the **same** function, `simpleTriggerMatches`
(`pack-orchestrator.ts:36-59`), through the same call site (`checkpointMatches`, `:61-71`), and the
same once-per-path filter (`reachedOnActivePath`, `:73-86`). The "typical trigger" column above is
therefore an authoring convention and nothing more: an organic pack may use `atSpineNode` and a
guided pack may use `fenPredicate`, and neither the orchestrator nor the derivation can tell. That
is the whole content of "they do not differ in how a transition is recognized", and it is why no
field is needed to record the difference — there is no difference to record. §10 adds no
trigger-shape rule beyond `TRAJECTORY_LEG_ENTRY_NOT_SIMPLE`, which excludes the *window* form for a
reason about ply exactness (§3c), not about the organic/guided split.

The `theory_strict` nudge stays honest for free: when the run leaves the spine, the selector falls
back to `human_common` and **records** the applied mode
(`opponent-selector.ts:456-461` → `#humanCommon` → `policyModeApplied: "human_common"` at `:433`),
which `resistanceSentences` renders as a separate fact
(`apps/web/src/lib/outcome-presentation.ts:75-84`). A learner who leaves the guided route is told
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

**Nothing is invented, the run keeps the verdict it has, and the run is not marked down.**
Concretely:

- the trajectory stays in the current leg; no checkpoint fired, so no transition exists to record;
- **the leg it is in keeps the verdict it already has**, graded exactly as its own mode grades it —
  a `follow_theory` leg keeps its membership derivation and its `active`/`preserved`/`degraded`
  state, an outcome leg keeps its grade, a condition leg keeps its authored state. Non-arrival
  changes nothing about it, because non-arrival is the absence of an event and no shipped rule
  reads an absence;
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

**The two ways of not arriving are rendered the same way, with one added fact.** A run that is
still playing and a run that ended inside a leg both leave later legs `not_entered`, and both print
the sentence above unchanged — the distinction is not a grade and must not be dressed as one. When
`TrajectoryVerdict.stopped` is true (§6), one further sentence is printed beside it, naming the
recorded fact and nothing else: *"The game ended in this leg."* It is licensed by
`outcome.reached`, which is a rules fact the runtime already produces, so it asserts nothing about
whether the game should have ended there.

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
  `unknown` (`line.ts:140-145`) and the sheet fills with "this pack has no statement about this
  move" for moves the pack never claimed to cover. That is not merely noisy: `unknown` means "the
  pack is silent about this move **in a theory drill**", and outside the theory leg the pack is
  making no theory claim at all, so the sentence would be false in tone if not in letter.

`insideAuthoredBoundary`, `spinePositionIndex` and `lineMembership` are otherwise untouched. Note
that `insideAuthoredBoundary` returns `false` for every non-root node when `authoredBoundary` is
absent (`line.ts:106-107`); the shipped `CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY`
(`pack-validation.ts:202`) already prevents a pack from carrying an `atAuthoredBoundary` trigger
in that state, so a trajectory without a theory leg cannot accidentally transition on ply 1.

#### 9b. Outcome Drill inside a trajectory

- **`grading` is per leg — in the validator and in the compiler.** `OBJECTIVE_GRADING_REQUIRED`
  (`pack-validation.ts:214`), `OBJECTIVE_GRADING_UNSUPPORTED` (`:223`),
  `OBJECTIVE_RESOLUTION_UNKNOWN` (`:233`) and `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` (`:242`) all
  apply, per leg, with pointers rooted at `/legs/{i}/objective` (§10). The compiler half is §4b's
  second property and is the one that bites: `objectiveRules` reads `grading?.resolveAt` twice
  (`pack-orchestrator.ts:242`, `:259`), and both reads move to the passed objective. A `resist`
  leg whose `resolveAt` was read from the top level would compile the `outcome-loss → failed` rule
  and **not** the `resist` exemption, grading a survived loss as a failure — silently, and with
  `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` green because the *validator* read the leg.
- **`assessedBy.kind: "syzygy"` is refused on a leg** (`TRAJECTORY_LEG_SYZYGY_UNSUPPORTED`).
  Motivation §2g is the reason: a leg's start position is not known until a run reaches it, so
  `SYZYGY_ASSESSMENT_OUT_OF_RANGE` and `SYZYGY_ASSESSMENT_MISMATCH` would check a ledger record
  against `pack.start.fen` — the opening — and the `ledger_verified` chain of
  `rfc/archive/outcome-drill-grading.md` §4d would be satisfied against the wrong position.
  A leg's root assessment is a claim about the class of positions the leg is entered at, which is
  authored by definition, so `kind: "authored"` is the only legal value and its
  `note` renders with the shipped unproved marker (`outcome-presentation.ts:49-51`).
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

**The objective block is extracted, not duplicated — but only the part of it that is actually
per-objective.** Motivation §2f counted the region `pack-validation.ts:174-366` and found three
kinds of code inside it, and a wholesale extraction would be wrong for two of them. The split:

| Kind | Treatment |
|---|---|
| The **twelve** codes rooted at `/objective` | Extracted into `objectiveIssues(objective, pointerPrefix)`, closing over `pack` and `checkpoints`. Called once for `pack.objective` at `/objective` when `legs` is absent, or **once per leg** at `/legs/{i}/objective` when it is present. This is the whole point: without it a leg's objective is validated by nothing at all, which is the D4 shape (`design/BACKLOG.md:117`) |
| The **seven** theory-family codes whose pointers name pack-level shape (`/mode`, `/authoredBoundary`, `/checkpoints`, `/deviations`) | **Run once, not once per leg.** Their subject is the pack's single `authoredBoundary`, single spine and single boundary checkpoint, so N copies at the same pointer would be N identical issues. For a leg-bearing pack the `theoryObjective` predicate they are gated on becomes "the pack has a `follow_theory` leg" — well-defined precisely because `TRAJECTORY_MULTIPLE_THEORY_LEGS` (§9a) admits at most one. `THEORY_OBJECTIVE_NEEDS_LINE_MODE` is the one exception and is handled by §9a's widening rather than by this gate |
| `CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY` (`:202`), the **one** objective-independent code | **Stays exactly where it is**, outside the extracted function. It reads only `pack.authoredBoundary` and `pack.checkpoints`; moving it inside would emit it once per leg on a pack that has one boundary problem |

The extraction is behaviour-preserving for every existing pack — none has `legs`, so
`objectiveIssues` is called exactly once with `pointerPrefix = "/objective"` and the emitted list is
unchanged in content **and order** — and criterion 12 asserts that byte-for-byte across every pack
document in the tree.

**A leg's syzygy assessment is refused before the extracted syzygy checks can run**
(`TRAJECTORY_LEG_SYZYGY_UNSUPPORTED`, §9b), so `SYZYGY_ASSESSMENT_OUT_OF_RANGE` and
`SYZYGY_ASSESSMENT_MISMATCH` — which read `pack.start.fen` and `pack.start.side` and would silently
check a leg against the pack's opening — are never reached with a leg pointer. They stay in the
extracted function so the top-level path is untouched; on a leg they are dead by construction, and
criterion 8's syzygy fixture asserts the refusal fires instead of them.

**Seventeen new codes:**

| Code | Rule |
|---|---|
| `LEGS_NEED_TRAJECTORY_MODE` | `legs` present with `mode !== "trajectory"` |
| `LEGS_NEED_TRAJECTORY_OBJECTIVE` | `legs` present with `objective.type !== "run_trajectory"` |
| `TRAJECTORY_OBJECTIVE_NEEDS_LEGS` | `objective.type: "run_trajectory"` without `legs` |
| `TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED` | `run_trajectory` with a top-level `successConditions`. Top-level `grading` is already refused by the shipped `OBJECTIVE_GRADING_UNSUPPORTED` (`:223`), since `run_trajectory` is not an outcome type, and is not restated. This code exists because the shipped validator has **no** counterpart: `successConditions` on a non-outcome, non-theory objective is legal today and compiles through `conditionRules` — which for a `run_trajectory` pack is a rule set that §4b never asks for, i.e. exactly the silent no-op class |
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
| `TRAJECTORY_TRANSITIONED_UNSUPPORTED` | any leg `successConditions` entry with `to: "transitioned"` (§4a). The value is authorable: `conditionBase.to` is `["preserved","degraded","failed","achieved","transitioned"]` (`drill_pack.schema.json:204`), and the shipped `THEORY_ABSORBING_UNSUPPORTED` (`:262`) and `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME` (`:280`) reject it only for theory and outcome objectives — a `execute_break` leg may write it today |
| `TRAJECTORY_LEG_CONDITION_PRECEDES_ENTRY` | a leg `successCondition` with `kind: "reach_checkpoint"` naming **its own** `entryCheckpointId` or that of **any earlier** leg. Motivation §2h is why: `checkpointReached` compiles to the path-scoped `checkpointWasReached` (`pack-orchestrator.ts:97` → `objective.ts:228-229`), so such a condition is already true at the leg's first graded commit, and with `conditionRules`' `to` default of `"achieved"` (`pack-orchestrator.ts:148`) it resolves the leg before the learner acts. Only the decidable case is claimed — a leg naming an *arbitrary* checkpoint that happens to fire earlier is not statically knowable, and the RFC does not pretend to catch it; the node-exact `checkpointReachedHere` form used by `grading.resolveAt` (`:266`) and by the theory boundary rule (`:204`) is unaffected and remains the safe encoding |

**Two shipped root checks are cited, not extended.** `CHECKPOINT_UNREACHABLE_AT_ROOT`
(`pack-validation.ts:393`) already rejects `atPly: 0`, and `CHECKPOINT_TRUE_AT_ROOT` (`:401`)
already rejects a `materialBalance` or `fenPredicate` entry trigger that holds at `start.fen` —
it evaluates `checkpointMatches` against a real `createRun` root (`:368-392`), so it is an
execution, not a heuristic. Between them, "leg 2 begins before the learner moves" and "leg 2 can
never begin" are covered by code that runs today, and no trajectory-specific version is added.

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
- **The grade line is rendered per leg — and the gate above it must move, or the change is a
  no-op.** This is the one place where extending a shipped surface is not enough, and it is worth
  stating in full because the naive version of this change renders nothing at all. Today
  `objectiveGradeSentence(pack.objective.type, currentNode.objectiveState)`
  (`outcome-presentation.ts:105-112`) is passed to `<OutcomeContext>` at
  `DrillScreen.svelte:452`, which is **inside** `{#if assessment !== undefined || resistance.length > 0}`
  at `:451`. Both operands derive from `grading = projectedGrading(pack)` (`:153`), which reads
  `pack.objective.grading` (`outcome-presentation.ts:29`): `assessment` is `undefined` when
  `grading` is (`:154-156`), and `resistance` is `[]` when `grading` is undefined and
  `pack.objective.type !== "follow_theory"` (`:157-159`). A leg-bearing pack's **top-level**
  objective is `run_trajectory` with no `grading` (§3b) and is not `follow_theory`, so the gate is
  false and `OutcomeContext` never mounts — no grade line, no assessment, and **no resistance
  line**, which would also silently defeat criterion 15's off-spine assertion. Three changes, all
  in the same block:
  1. `projectedGrading` gains a leg-aware sibling `activeLegGrading(pack, run, nodeId)` returning
     the **active leg's** `grading` (or `undefined`), and `DrillScreen.svelte:153` uses it when
     `pack.legs` is present.
  2. The gate at `:451` gains `|| pack.legs !== undefined`. A leg-bearing pack always mounts
     `OutcomeContext`, because the active leg always has a grade line even when it has no
     `grading` — `objectiveGradeSentence` needs only a type and a state.
  3. `resistance` (`:157-159`) drops its dependence on `grading` for a leg-bearing pack: the
     resistance sentences are a fact about the opponent that played, not about outcome grading,
     and a trajectory's guided/organic story (§8) is unreadable without them.

  The grade line itself is then `objectiveGradeSentence(<active leg's objective.type>,
  currentNode.objectiveState)`. A test asserts no rendered page contains `Objective: run_trajectory`
  (criterion 14), which is the mechanical signature of step 3 of §4b having been wired to the
  top-level objective by mistake.
- **The transition sentence** is added to `outcome-presentation.ts` beside
  `checkpointResolutionSentence` (`:114-125`) and rendered in `OutcomeContext.svelte` and in the
  timeline. Its content is fixed by §7 rule 1 and constrained by §7 rule 2.
- **`whyBanner` must not read a reset as a downgrade, and must not swallow the seal.** It selects
  the **last** `objective.state_changed` on the path (`screen-model.ts:188-196`) and throws if that
  change carries no evidence reference or renders a blank sentence (`:197-208`). The reset carries
  `pack:<entryCheckpointId>` and renders the checkpoint's label
  (`evidence-sentences.ts:53-60`), so neither throw fires. Two consequences, both stated so they
  are not discovered at review time:
  - the wording changes — a `→ active` change on a leg-bearing pack renders the §7 transition
    sentence rather than the generic state-change line, so the learner is told a leg began and is
    not told the objective was reset;
  - on §4b's **two**-transition commit the reset is last, so it **shadows the seal** in the banner.
    That is correct for the banner, whose subject is "why did the state change just now", but it
    means the banner is not where a sealed verdict is read. The sealed verdict is rendered from
    `trajectoryVerdict` in the per-leg list and marked on the timeline; criterion 3a asserts both
    events exist in the log regardless of which one the banner shows.
- **The timeline marks transitions.** `DrillScreen.svelte:107` derives its markers from
  `timelineEntries` (`screen-model.ts:94-114`) and gains the transition node ids, so a boundary
  has a ply marker on the same axis the learner already reads.

Nothing is added to `GET /packs/:id` except the optional `legs` key, and no new endpoint is
created: the client already holds the full event log (`apps/web/src/lib/run-state.ts`) and the
runtime is shared TypeScript, so `trajectoryVerdict` is computed in `screen-model.ts` from data
the client already has.

### 12. The fixture

`content/drafts/trajectory-legs.browser.json` is the executable fixture for B2's Trajectory row.
It is a **mechanical fixture and makes no chess claim beyond move legality**, which it says in its
own `provenance.graduationBlockers` — the shape
`content/drafts/outcome-hold.browser.json:55`, `content/drafts/outcome-resist.browser.json:47` and
`schemas/fixtures/drill-pack/terminal-outcome.browser.json:70` already use, all three with the
one-line "Test-only fixture; never publish as chess content." Its ids and labels are about the
mechanism, not about chess, so a reviewer cannot mistake it for content.

- `mode: "trajectory"`, `phase: "cross_phase"`, `objective.type: "run_trajectory"` with a summary
  that says it is a fixture.
- `feedbackPolicy: "delayed_checkpoint"` and an explicit `start.side`. Both are deliberate rather
  than incidental: `immediate_blunder_guard` is rejected at load today
  (`capabilities.ts:25-30`) and removed from the schema by `rfc/defect-sweep.md` at 0.5, and the
  same sweep makes `start.side` required — so the fixture is already written for the schema this
  RFC's bump follows.
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
`hold` grading may absorb on `outcome.reached`. **No leg's `successConditions` name `book-crossed`
or `pieces-off`**, which is what `TRAJECTORY_LEG_CONDITION_PRECEDES_ENTRY` (§10) requires and what
Motivation §2h explains; `leg-c`'s resolution goes through `grading.resolveAt`, which compiles to
the node-exact `checkpointReachedHere`.

No Playwright configuration change is needed. `pack-registry.ts:246-250` loads every non-sidecar
`.json` under `content/drafts/` (`jsonFiles`, `:112-133`) whenever `options.development === true`,
in addition to whatever `DRAFT_PACK_FILE` names, and `playwright.config.ts:20-21` already sets
`NODE_ENV=development` alongside
`DRAFT_PACK_FILE=schemas/fixtures/drill-pack/terminal-outcome.browser.json` — so the new fixture is
served without displacing the one the existing outcome tests use.

**The three authored drafts are not modified and are not chained.** Motivation §2d records why,
and `design/04-content-architecture.md:155-156` already orders the real trajectory as step (2) of
the content programme — after the three single-phase packs, as authoring work. This RFC ships the
runtime that step (2) needs and does not pre-empt its chess content.

### 13. No migration, and what is explicitly not persisted

**No persisted run shape changes.** `objective.state_changed` already carries `from`, `to` and
`evidenceRefs` (`schemas/drill_run.schema.json:421-438`). Its `evidenceRefs` items are
`{"$ref": "#/$defs/id"}`, and that `$def` is `{"type": "string", "minLength": 1}`
(`drill_run.schema.json:78-81`) — an unpatterned non-empty string, **not** the
`^[a-z0-9][a-z0-9-]*$` pack-side id — so `pack:<entryCheckpointId>` validates unchanged, exactly as
the `pack:` and `rules:` refs the shipped compilers already emit do. `uniqueItems: true` is
satisfied by a single-element array. No event type is added, and `DRILL_RUN_SCHEMA_VERSION` stays
`"0.7"` (`packages/schema/src/index.ts:1`).
`STORAGE_VERSION` stays 5 (`apps/server/src/storage.ts:147`). **This RFC claims no row in the
migration register.**

Six additions look persisted and none is:

- **Leg spans, transitions and `producedBy`** (§6, §7) are derived on read from
  `historyFrom` and the event log, exactly as `lineMembership` and `resistanceOnPath` are.
- **`TrajectoryVerdict.stopped`** (§6) is a boolean read off the last node's `objectiveState`;
  no field records it.
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

1. **`design/04-content-architecture.md:109-119` describes a trajectory as a chain across pack
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
   and sequencing runs is program item #7's territory (`design/03-product-breadth.md:266`), owned
   by `rfc/return-and-progression.md`. Scope boundary.
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
8. **The seal-and-reset pair produces two `objective.state_changed` events at one node, which no
   shipped RFC contemplated.** `evaluateObjective` performs at most one transition per call
   (`objective.ts:311-326`) and both shipped mode RFCs reasoned in those terms. §4b's step 4 is a
   second, orchestrator-level write. It is recorded as a deviation rather than buried in the
   specification because it is the change most likely to be "simplified" by a later reader into an
   unconditional reset — which, per §4b, makes a stored log unreplayable rather than merely
   mis-graded. Criterion 3b is the regression.
9. **New BACKLOG rows this RFC asks for**, all proposals and none of them edits this RFC makes:
   the catalogue-level trajectory-family relation (item 1); a widened `FenPredicate` union with a
   real authored consumer (§8a); the `selectionCacheKey` omission of `policy.mode` (Scope
   boundary); the Pack A policy discrepancy (item 7); and the duplicated pack-schema register in
   `rfc/README.md` — "## Pack-schema-version register" and "## Pack schema register" are two tables
   for one shared single-writer resource, and a register with two copies is the failure the
   register exists to prevent. This RFC does not edit `rfc/README.md`.

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
- 2026-08-13: rebased the pack-schema claim from 0.5 to **0.7** before review. Five product RFCs
  were drafted in parallel the same day; `defect-sweep.md` had claimed 0.5 and
  `pack-studio-and-review.md` and `return-and-progression.md` had **both** claimed 0.6 — the
  migration-register failure repeated on a second shared constant. This RFC took the next free
  number rather than contest one, on the grounds that its version bump is load-bearing for
  nothing, and instituted the pack-schema-version register in `rfc/README.md` so the collision it
  found is recorded rather than only avoided. The D4/D5/D6/D8/D9/D10 scope rows were rewritten to
  name `defect-sweep.md` as their owner instead of citing bare BACKLOG rows.
