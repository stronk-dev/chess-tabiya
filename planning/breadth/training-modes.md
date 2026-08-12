# Training-mode breadth (B2) — foundation alignment

Program item #4 of `design/03-product-breadth.md` §Provisional foundations-first
RFC program. Written by code inspection 2026-08-12. Every capability claim below
carries a `path:line` cite; every absence carries the grep that proves it.

Standing owner ruling honoured throughout: **no deferrals**. Every mode has a
scheduled slice, a minimal-but-real definition, and one executable fixture.
Ordering below is dependency order, not priority triage.

## 1. Scope

| Owned | Detail |
|---|---|
| Modes | Line Drill (opening), Plan Drill (middlegame), Outcome Drill (endgame: convert/hold/save/resist/technique), Trajectory Drill (organic + guided) |
| B-gate rows | **B2 — solo modes** (jointly with program #3, which owns Just Play / pack-optional entry) |
| Runtime semantics | `objective.type` taxonomy and evaluators · objective state machine reachability · `checkpoints[].interaction` / `intent_capture` · `checkpoints[].actions` vocabulary · `authoredBoundary` → provenance mode · `deviations[].class` as live classification · on-ramp knobs (`00-thesis.md` §Target player) · opponent policy per drill type |
| Not owned | Just Play / FEN-PGN entry (#3) · evidence composer + explanation surface (#2) · multi-branch review UI (#5) · authoring UI (#6) |

Mode vocabulary is already frozen in the schema: `mode` ∈ `line|plan|outcome|trajectory`
(`schemas/drill_pack.schema.json:23`), `phase` ∈ `opening|middlegame|endgame|cross_phase`
(`:24-26`). This dossier does not propose new mode names.

## 2. What ships today

### 2a. Per mode

| Mode | Entry | Objective evaluation | Opponent policy | Checkpoints | Completion / grading | Evidence |
|---|---|---|---|---|---|---|
| **Line** | none mode-specific. `PackList.svelte:31-42` renders every pack identically; `mode` is a badge string (`:34`) and `phase` is not rendered at all — `PackSummary` omits it (`pack-registry.ts:16-24`, built `:137-145`) even though the detail projection carries it (`:55`) | none. Only `successConditions[].kind === "reach_checkpoint"` translates (`pack-orchestrator.ts:88-100`) | `theory_strict` ships and works: Maia filtered to legal spine children, policy-mass sampled, transposition-aware (`opponent-selector.ts:453-483`) | `atSpineNode` fires on real authored content (`pack-orchestrator.ts:46-48`; behaviourally confirmed, `planning/content-era/log.md` session 2 pass (a)) | none. No theory score, no "crossed the book boundary" signal | mode-branching: `grep -rn "\.mode\b" apps/{server,web}/src` → only badge/summary/opponent-policy reads |
| **Plan** | same undifferentiated pack list | same `reach_checkpoint`-only path | `human_common` ships (`opponent-selector.ts:428-435`); Pack A uses it (`content/drafts/anti-caro-advance.json:198-204`) | fires; `segment.completed` emitted between consecutive checkpoints on a branch (`runtime.ts:350-394`), segments derivable (`events.ts:167-190`) | objective chip per branch leaf (`screen-model.ts:107-124`), terminal set `achieved/failed/transitioned` (`:47-51`). No full-segment redo action | **the only mode with a real run.** Playwright acceptance plays, forks, rewinds, compares, exports (`docs/drill-client.md:252-267`) |
| **Outcome** | none | none. `win`/`hold`/`save`/`resist` are declared (`packages/schema/src/drill-pack/types.ts:7-10`) and read by nothing: `grep -rn '"win"\|"hold"\|"save"\|"resist"' --include="*.ts" apps packages` → those four lines only | perfect/practical/annoying/fallible: **absent**. Shipped modes are exactly three (`capabilities.ts:10-14`, `opponent-selector.ts:31-34`). `grep -rni "syzygy\|tablebase" apps packages workers` → zero hits | trigger vocabulary supports `materialBalance` (`pack-orchestrator.ts:55-58`) but no pack uses it | **`outcome.reached` exists in the wire format with no producer**: declared `types.ts:156-159`, in `schemas/drill_run.schema.json:265,449`, projected as a no-op (`events.ts:130-136`), emitted nowhere | grep above |
| **Trajectory** | none | none. `transition_to_endgame` declared (`types.ts:6`); `grep -n "transition" schemas/drill_pack.schema.json` → only that enum member at `:127`. No `transitions` field exists | n/a | n/a | `transitioned` is a legal target state (`objective-state.ts:4-6`) with zero producers | `docs/drill-pack-format.md:114-121` states Trajectory `transitions` are outside the implemented format |

Shared and real for all four: the branch graph, fork/rewind/compare, run
persistence, resume by URL (`docs/drill-client.md:164-180`), PGN export merging
authored spine with played branches (`:105-110`), and server-side feedback
withholding (`feedback-policy.ts:11-60`).

### 2b. The inert runtime semantics

| Semantic | Verified status |
|---|---|
| `objective.type` beyond `reach_checkpoint` | **Never read by any evaluator.** Its only three readers are the browser projection passthrough (`pack-registry.ts:60`), a display-string fallback (`screen-model.ts:61-66`), and URL parse validation (`urls.ts:58`). The orchestrator reads `pack.objective.successConditions` exclusively (`pack-orchestrator.ts:103`) |
| `preserve_plan_window` specifically | **Behaviourally confirmed inert** — zero `objective.state_changed` events across a full authored play-through (`planning/content-era/log.md`, session 2 pass (a), defect #2, upheld by the correction entry). Code-level cause is triple: (i) `objective.type` is not read; (ii) Pack A declares no `successConditions` at all (`content/drafts/anti-caro-advance.json:23-26`), so `objectiveRules()` returns `[]` (`pack-orchestrator.ts:104`) and `evaluateObjective` returns `matchedRuleId: null, emitted: []` (`objective.ts:294`); (iii) had it declared any, `pack-validation.ts:160-178` rejects every `kind` except `reach_checkpoint` at load |
| Objective state machine | **Machine complete, one state reachable.** `ALLOWED_TRANSITIONS` covers all five targets (`objective-state.ts:3-10`); `transitionObjective` enforces them and requires ≥1 evidence ref (`objective.ts:232-253`, `objective-state.ts:39-50`). But the only pack-driven producer hardcodes `to: "achieved"` (`pack-orchestrator.ts:111`). The second producer path, `ObjectiveEvidenceUpgrader`, is an optional constructor arg never supplied in production: `grep -rn "objectiveUpgrader" apps packages` → `evidence-queue.ts:91,97` and one `.test.ts`. **`preserved`, `degraded`, `failed`, `transitioned` therefore have zero production producers.** |
| **Predicate evaluator** | **Fully built and generic, and this is the good news.** `rulesFact` (checkmate/stalemate/threefold/50-move/insufficient), `materialBalance`, `fenPredicate` (`transposeKey` / `pieceOnSquare` / `pawnStructure` contains-or-exact), `checkpointReached`, and `all`/`any`/`not` are all implemented and path-aware (`objective.ts:60-69`, `:195-230`). None of it is reachable from a pack |
| `checkpoints[].interaction` | **Encoded, linted, never read, and no longer even shipped to the browser.** Type at `packages/schema/src/drill-pack/types.ts:38-58`; the single consumer is a prediction-density warning (`lint.ts:127`). `grep -rn "intent_capture\|planClassIds"` → `types.ts:40-41` only. `projectPackDocument` reduces checkpoints to `{id,label,actions}` (`pack-registry.ts:66-71`), so `interaction` is not delivered |
| `planClasses` | **Zero consumers anywhere.** `grep -rn "planClasses" apps packages` → no hits outside `schemas/drill_pack.schema.json:35-38`. Stripped by the projection |
| `checkpoints[].actions` | **CORRECTION to `field-consumer-matrix.md` and to the brief for this dossier: the vocabulary is no longer open.** `SUPPORTED_CHECKPOINT_ACTIONS = ["compare_branches"]` (`pack-validation.ts:11`); unknown values fail load and `pack-check` with `UNSUPPORTED_CHECKPOINT_ACTION` and a JSON Pointer (`:140-158`). `CheckpointSheet.svelte:31` recognizes the same single value. Landed in `ef4cfe6`; Pack A's `"stop"`/`"compare"` were replaced with `compare_branches` in the same commit. Schema stays structurally open by design (`schemas/drill_pack.schema.json:338-346`, rationale `docs/drill-pack-format.md:38-44`). **Validator and client are aligned today; the live risk is that they can drift apart again because nothing ties the two lists together** |
| `authoredBoundary` → provenance mode | **No evaluator.** `grep -rn "plyHorizon\|provenanceMode" apps packages` → zero hits. Only lint checks that `spineNodeIds` reference real nodes (`lint.ts:171-177`). `docs/engine-workers.md:127-128` states plainly that `authoredBoundary` affects nothing in selection |
| `deviations[].class` | **No evaluator.** Enum is closed and real: `required_theory`, `accepted_alternative`, `interesting_deviation`, `concept_violation`, `tactical_error` (`schemas/drill_pack.schema.json:419-427`). Only lint reads them, for id references (`lint.ts:179-186`). Pack A authors five with `offObjective` on one (`anti-caro-advance.json:205-247`) |
| On-ramp knobs | **Two of three encoded, one rejected.** `difficulty.branchLengthTarget` accepts 2–20 (`schemas/drill_pack.schema.json:98-102`) and is read by nothing. `immediate_blunder_guard` is in the schema enum (`:50-56`) and **explicitly rejected at load** (`pack-validation.ts:103-111`, `docs/drill-client.md:14-17`). Principle/threat objectives have no encoding beyond the objective-type enum |
| Opponent policy per drill type | Three modes ship (`capabilities.ts:10-14`). The selector is chosen from the **pack's** declared mode only (`session-controller.ts:112-120`); there is no per-drill-type default and no runtime override |
| `retryVariants` | Schema slot exists as an untyped object array (`schemas/drill_pack.schema.json:66-69`); `grep -rn "retryVariants" apps packages` → zero hits. This is the repeat/mirror/opposite-side surface, unencoded |

## 3. The gap

**Per mode — what is missing to be minimally real** (real entry, runtime
behaviour, evidence boundary, resume/export path, acceptance scenario):

| Mode | Missing | Already there |
|---|---|---|
| Line | phase/mode-aware entry; a book-boundary signal (the moment play leaves `authoredBoundary`); deviation classification rendered at commit; a completion condition that is not "a checkpoint fired" | `theory_strict` opponent, spine walk, `atSpineNode` triggers, PGN export, resume |
| Plan | authored objective that actually evaluates; a `replay_segment` action (segments are derivable but not actionable); intent capture with a recording site | everything else — this is the shipped mode |
| Outcome | four outcome evaluators; a perfect-play policy (no tablebase adapter exists); `outcome.reached` producer; repeat/mirror/opposite-side actions | `materialBalance` + `rulesFact` predicates, the `outcome.reached` wire slot, branch seeds for varied retry |
| Trajectory | an authored transition encoding; a `transitioned` producer; causal provenance linking phase segments of one run; guided vs organic distinction | the state machine's `transitioned` target, `segment.completed`, branch/fork provenance |

**Per inert semantic — what unblocks it:**

- `objective.type` beyond `reach_checkpoint`: a widened *condition* vocabulary, not a widened *type* switch. The type field is a catalogue label; `successConditions` is the executable surface both the validator and the orchestrator already read.
- State machine reachability: one authored field — the target state. `objectiveRules()` hardcoding `to: "achieved"` is the entire reason four states are dead.
- `interaction`/`intent_capture`: a UI decision plus a recording site. The only durable site that ships is `Branch.intent?: string` (`packages/runtime/src/types.ts:74-79`), settable solely at `fork()` (`runtime.ts:54,94`; REST `rest.ts:518-520`; rendered `BranchRail.svelte:33`). There is no per-node or per-checkpoint intent slot.
- `actions`: a structural tie between `SUPPORTED_CHECKPOINT_ACTIONS` and the client's handled set, so growing one without the other fails CI rather than shipping a silent no-op.
- `authoredBoundary`: a derived server-side computation. The client cannot compute it — the projection does not deliver `authoredBoundary` (`pack-registry.ts:46-72`).
- `deviations[].class`: a match at commit time plus an evidence-ref namespace to carry it. `pack:` currently means "checkpoint id" and nothing else (`evidence-ref.ts:31-33`) — the withdrawn RFC's surviving rule, "`pack:` refs must split per id space", becomes concrete the moment a deviation needs a ref.

## 4. Contracts to pin

### 4a. Objective-type taxonomy

The shipped enum (`packages/schema/src/drill-pack/types.ts:1-12`):

```ts
export const OBJECTIVE_TYPES = [
  "reach_structure", "preserve_plan_window", "execute_break",
  "prevent_opponent_plan", "transition_to_endgame",
  "win", "hold", "save", "resist", "play_until_checkpoint",
] as const;
```

**Ruling to pin: `objective.type` stays a catalogue/label field and gains no
switch.** Behaviour is carried by `objective.successConditions`, which is what
`pack-validation.ts:160-178` and `pack-orchestrator.ts:102-117` both already
read. Anything else creates two vocabularies for one meaning — the failure the
withdrawn RFC was withdrawn for.

Shipped schema slot to amend (`schemas/drill_pack.schema.json:141-144`):

```json
"successConditions": { "type": "array", "items": { "type": "object" } }
```

Exact replacement:

```json
"successConditions": { "type": "array", "items": { "$ref": "#/$defs/objectiveCondition" } },

"objectiveCondition": {
  "type": "object",
  "required": ["kind", "to"],
  "properties": {
    "kind": { "enum": ["reach_checkpoint", "fen_predicate", "material_balance", "rules_fact", "all", "any", "not"] },
    "to":   { "enum": ["preserved", "degraded", "failed", "achieved", "transitioned"] },
    "from": { "type": "array", "items": { "enum": ["active", "preserved", "degraded"] } },
    "checkpointId": { "$ref": "#/$defs/id" },
    "predicate": { "$ref": "#/$defs/fenPredicate" },
    "materialBalance": { "$ref": "#/$defs/materialBalance" },
    "rulesFact": { "enum": ["checkmate", "stalemate", "draw"] },
    "winner": { "enum": ["white", "black"] },
    "conditions": { "type": "array", "items": { "$ref": "#/$defs/objectiveCondition" } }
  },
  "additionalProperties": false
}
```

`from` defaults to `["active","preserved","degraded"]`, exactly the array
already hardcoded at `pack-orchestrator.ts:105`. Each `kind` maps 1:1 onto the
shipped `ObjectivePredicate` union (`packages/runtime/src/objective.ts:60-69`)
— **no new predicate is invented and no new evaluator is written**; only
`successPredicate()` (`pack-orchestrator.ts:88-100`) widens, and
`objectiveRules()` (`:102-117`) reads `to`/`from` instead of hardcoding them.

Per type, what an evaluator observes and emits under this encoding:

| `objective.type` | Evaluator needed | Observes (all shipped) | Emits |
|---|---|---|---|
| `play_until_checkpoint` | none — ships today | `checkpointReached` on the active path (`objective.ts:176-184`) | `→ achieved` |
| `reach_structure` | none new | `fenPredicate.pawnStructure` contains/exact (`objective.ts:52-58,151-160`) | `→ achieved` |
| `win` / `hold` | none new | `rulesFact` checkmate/draw + `materialBalance` (`objective.ts:203-218`) | `→ achieved` / `→ failed` |
| `save` / `resist` | none new | same, with authored `from`/`to` pairs expressing "was worse, reached draw" | `active → degraded → preserved → achieved` |
| `transition_to_endgame` | none new | `materialBalance` and/or `fenPredicate` | `→ transitioned` (first producer of that state) |
| `execute_break` / `prevent_opponent_plan` | none new | `fenPredicate.pieceOnSquare` / `pawnStructure` at the break square | `→ achieved` / `→ failed` |
| `preserve_plan_window` | **the one genuinely new evaluator** | authored window: which move set constitutes plan-readiness, which opponent move is arrival, ply budget between them | `→ preserved` / `→ degraded` / `→ failed` |

**Honest limit on `preserve_plan_window`.** Its encoding cannot be pinned from
the current authored corpus. Pack A's own session-1 harvest states the shape it
needed — a *set* of readiness moves (Be3 or c3), one arrival move (…c5), and a
discretionary spend (h4) — and that the same move must be plan-completion on one
branch and irrelevant on another (`planning/content-era/log.md`, session 1
contract-gaps #2). Nothing in the corpus yet exercises the branch-dependent
case, so the field shape stays unproposed here. **The authored case that pins
it: a second Pack-A branch in which `h4` is the readiness move rather than the
spend, so that one UCI move carries two window roles in one pack.** That pack
edit is slice 5's fixture, not a research question.

Everything except `preserve_plan_window` is encodable and schedulable now.

### 4b. Closed checkpoint-action vocabulary

Shipped (`apps/server/src/pack-validation.ts:11`):

```ts
const SUPPORTED_CHECKPOINT_ACTIONS = Object.freeze(["compare_branches"] as const);
```

Client-side handled set (`apps/web/src/lib/CheckpointSheet.svelte:31`):
`checkpoint.actions.includes("compare_branches")`.

Pin three things:

1. The list moves to one exported constant consumed by both server validation
   and the sheet, with a CI test asserting the sheet renders a control for every
   member. Today they are two hand-maintained lists that happen to agree.
2. `capture_intent` stays banned as an action
   (`schemas/drill_pack.schema.json:341-345`); intent is the typed interaction.
3. The vocabulary grows only alongside its consumer, one entry per slice:
   `replay_segment` (Plan), `simulate_variations` (Line), `repeat_root`,
   `mirror_position`, `opposite_side` (Outcome), `advance_phase` (Trajectory).

### 4c. Interaction / intent capture — a UI question first

Shipped type (`packages/schema/src/drill-pack/types.ts:38-51`), unchanged by
this dossier:

```ts
export type CheckpointInteraction =
  | { readonly type: "intent_capture"; readonly planClassIds: readonly string[] }
  | { readonly type: "prediction"; readonly grading: {...}; readonly flipBoard?: boolean };
```

**What the sheet does with a recorded choice — the answer that needs no wire
change:** selecting a plan class at an `intent_capture` checkpoint forks a
branch at that node with `label` = the plan-class label and `intent` = the
plan-class id, through the existing `fork(nodeId, label?, intent?)`
(`runtime.ts:54,94`; `rest.ts:518-520`). The choice is then durable, appears on
the branch rail (`BranchRail.svelte:33`), survives resume and PGN export, and
makes "commit to plan A, rewind, commit to plan B, compare" the literal
mechanism rather than a narrated one. A plan commitment *is* a branch. The
alternative — a new `intent.captured` event — costs a `drill_run` schema bump to
v0.5 and buys nothing the fork does not already give.

Two consequences that must be pinned with it:

- **Delivery.** `planClasses` are stripped by `projectPackDocument`
  (`pack-registry.ts:46-72`), so the sheet has nothing to render. Pin the split:
  a plan class referenced by a checkpoint's `planClassIds` is **prompt content**
  and its `{id, label}` must be delivered with that checkpoint; its
  `description` is **feedback content** and stays withheld until the reveal
  condition. This is the first case where the projection must deliver authored
  strings, and it is honest precisely because a pre-commitment prompt cannot
  contaminate a choice it exists to elicit.
- **Reveal granularity.** The current latch is run-global and permanent:
  `feedbackIsRevealed` returns true once *any* checkpoint has fired
  (`feedback-policy.ts:11-15`), a limitation `docs/drill-client.md:93-96`
  already records. Plan-class `description` reveal therefore needs per-scope
  reveal, which is program #2's contract, not this one's.

`prediction` interactions are scheduled in slice 4 alongside Line Drill, graded
against the opponent policy's own returned candidate distribution
(`OpponentSelection.candidates` with policy mass, `opponent-selector.ts:221-243`)
— data the run already persists under `opponent.move_selected`
(`docs/engine-workers.md:150-154`).

### 4d. `provenanceMode` over `authoredBoundary`

Shipped type (`packages/schema/src/drill-pack/types.ts:70-73`):

```ts
readonly authoredBoundary?: {
  readonly spineNodeIds?: readonly string[];
  readonly [key: string]: unknown;
};
```

Pin the surviving rule from the withdrawn RFC verbatim
(`rfc/withdrawn/authoring-contracts-v03.md:64-68`): a node is authored territory
iff (`spineNodeIds` contains it **or** a `fenPredicates` entry matches its
`transposeKey`) **and** (`plyHorizon` absent **or** ply ≤ `plyHorizon`).
`plyHorizon` caps, it does not grant. Pack A's session-1 boundary check already
validated this reading against author intuition
(`planning/content-era/log.md`, contract-gaps #5).

**`provenanceMode` is derived, never authored.** Add no pack field. Compute
server-side and expose per node on `GET /runs/:id/graph` as
`provenanceMode: "authored" | "instruments_only"` — the client cannot compute it
because the projection withholds `authoredBoundary`. Its one required
behavioural consequence: at `instruments_only`, the UI must visibly drop the
authored coach voice and show engine/rules evidence only. That is the
graceful-degradation contract already sitting in `design/BACKLOG.md` as a
candidate row.

### 4e. Live `deviations[].class`

Shipped type (`packages/schema/src/drill-pack/types.ts:74-77`) and closed class
enum (`schemas/drill_pack.schema.json:419-427`). Pin:

- On each committed player move the orchestrator matches
  `(at.spineNodeId | at.fen, moveUci)` against `pack.deviations`. `at.fen` must
  match on `transposeKey`, consistent with how the selector recognizes
  transpositions back into book (`opponent-selector.ts:337-347`).
- A match with `offObjective: true` applies
  `transitionObjective(run, "degraded", [<ref>])` (`objective.ts:232-253`) —
  making `degraded` reachable and giving the why-banner authored substance for
  the first time. A match without `offObjective` records the ref without a state
  change.
- **New evidence-ref namespace, and the `pack:` split becomes real.**
  `packEvidenceRef` today means checkpoint id and nothing else
  (`evidence-ref.ts:31-33`). Add `packDeviationEvidenceRef(index)` →
  `pack-deviation:<index>`, and rename the existing constructor's prefix to
  `pack-checkpoint:` in the same change, per the withdrawn RFC's salvage
  (`rfc/withdrawn/authoring-contracts-v03.md:80-96`). Evidence refs are plain
  strings on the wire, so no `drill_run` schema bump is required — but
  `evidence-sentences.ts` must render both prefixes or `whyBanner` throws on a
  bare ref (`screen-model.ts:187-199`).
- **Withholding.** A deviation classification is post-commitment feedback, so it
  must obey `feedbackPolicy`. `publicNodes`/`publicEvents` currently strip only
  `engine:` refs (`feedback-policy.ts:17-59`); `pack-deviation:` must join the
  withheld set, unlike `pack-checkpoint:`. Pin this explicitly — the default of
  "pack refs are always visible" would leak the classification at commit time
  and break ADR-0006.

## 5. Slice plan

One executable fixture per slice. Fixtures live in `content/drafts/` and run
through `make pack-check` + `make pack-preview`, the shipped loop.

| # | Slice | Minimal real proof | Acceptance scenario | Depends on |
|---|---|---|---|---|
| 1 | **Objective conditions widened** — `successConditions` gains `kind`/`to`/`from` per §4a; `successPredicate` and `objectiveRules` widen; validator's whitelist replaced by the new `$def` | An authored condition drives a non-`achieved` transition end-to-end | Fixture `objective-states.json`: a material-balance condition moves `active → degraded`, a rules-fact condition moves `degraded → failed`; the why-banner renders both with their evidence refs and the branch rail shows the chip change | none — the predicate evaluator already ships |
| 2 | **Deviations live** — matcher, `pack-checkpoint:`/`pack-deviation:` split, withholding, sentence rendering | Playing Pack A's `e1g1` at `c5-break` degrades the objective and, after the reveal condition, shows the authored note | Pack A unchanged as the fixture; the existing `concept_violation` + `offObjective` entry (`anti-caro-advance.json:239-246`) becomes the first authored judgment the product has ever shown | 1 (needs a non-`achieved` target) |
| 3 | **Boundary + provenance mode** — combinator, per-node `provenanceMode` on `/graph`, coach-voice downgrade in the rail | Leaving Pack A's boundary flips the node to `instruments_only` and the authored voice disappears | Pack A: play `4.Nc3` (off-spine, ply 7 ≤ `plyHorizon: 14`) and assert `instruments_only` — the exact case the union reading got wrong | 2 (shares the authored-voice surface) |
| 4 | **Line Drill** — phase/mode entry filter, `simulate_variations` action, prediction interaction graded on the persisted candidate distribution, book-boundary completion | One Line pack completes: theory recalled, a rating-level deviation met, boundary crossed, first plan fork offered | Fixture `line-caro-short-system.json` (`theory_strict`, `phase: opening`): reach the boundary, get the plan fork, export PGN, resume mid-run | 3 (boundary defines completion) |
| 5 | **Plan Drill completion** — `replay_segment` action over the derivable segment, `intent_capture` per §4c, plan-class prompt delivery, plus the Pack-A edit that pins `preserve_plan_window` (one move carrying two window roles) | Commit a plan class at a checkpoint, play the segment, replay it under a different plan class, compare the two branches by their intents | Pack A extended; the window evaluator's field shape is authored first, implemented second, in that order | 1, 4 (shares the action-vocabulary tie) |
| 6 | **Outcome Drill** — four outcome evaluators as authored conditions, `outcome.reached` producer, `repeat_root`/`mirror_position`/`opposite_side` actions over `retryVariants`, and a perfect-play policy | One convert and one hold complete, each against two different resistance policies, with W/D/L preserved rather than a line reproduced | Fixture `rook-ending-lucena.json` (`phase: endgame`): convert vs `strong_engine`, hold vs `human_common`, then mirror and repeat | 1; perfect-play needs a Syzygy adapter (see §6) |
| 7 | **Trajectory Drill** — authored `transitions` field, `transitioned` producer, causal provenance linking the phase segments of one run, organic vs guided distinction | One run crosses opening → middlegame → endgame with two objective transitions, and the export shows one causal spine | Fixture `trajectory-advance-caro.json` (`mode: trajectory`, `phase: cross_phase`) reusing Pack A's opening as leg 1 | 1, 4, 5, 6; phase recognition for the *organic* variant (see §6) |

Ordering constraints only: slices 1–3 are runtime semantics every mode consumes,
so they precede the mode slices; 7 consumes 4–6 because a trajectory is composed
of them.

## 6. Dependencies in / out

**In — what this needs from other programs:**

| From | What | Why blocking, and what is honestly buildable meanwhile |
|---|---|---|
| #2 evidence/explanation | Per-scope reveal. The run-global latch (`feedback-policy.ts:11-15`) cannot reveal one checkpoint's prose without revealing later scopes' — stated at `docs/drill-client.md:93-96` | Slices 1–3 need only *withholding*, which ships. Plan-class `description` and deviation notes at multi-checkpoint granularity need #2's contract. Slices 1–3 are specified to work under the current latch |
| #2 evidence/explanation | Non-Stockfish evidence payloads. `EvidencePayload.source` is `engine_validated | human_model_predicted` (`docs/engine-workers.md:143-147`); Maia/corpus/Syzygy emit nothing today | Outcome Drill grading uses rules facts and material, not engine eval, so slice 6 is not blocked on it |
| #3 general session contexts | Phase/structure recognition. `grep -rn "phase" apps packages` → three cosmetic hits; `surfaces()` reports `justPlay`/`fromPosition`/`learn` as `unavailable-here` (`capabilities.ts:101-113`) | **Only the organic Trajectory variant depends on it.** Guided Trajectory uses authored transitions and ships in slice 7 regardless; the organic variant reuses the same runtime the moment recognition lands |
| #3 | Phase/mode-aware entry. `PackList.svelte` is one flat grid; `phase` is not even in `PackSummary` (`pack-registry.ts:135-143`) | Slice 4 adds `phase` to the summary and filters — small, and it belongs with the first mode that needs it |
| Engine layer | A Syzygy/tablebase adapter for perfect-play resistance. Zero code exists; `docs/engine-workers.md:232-234` lists `perfect_tablebase` as follow-up | Slice 6 ships convert/hold/save/resist against `strong_engine` and `human_common`, which is minimal-but-real. Perfect and fallible policies extend the same selector switch (`opponent-selector.ts:388-399`) without touching the mode contracts |

**Out — what this program provides to others:**

- The widened objective conditions (slice 1) are what makes #2's explanation
  surface have anything to explain: today the why-banner can only ever say
  "achieved".
- `provenanceMode` (slice 3) is the honesty signal #2's LLM rendering needs —
  ADR-0005 pressure is highest off-spine.
- `repeat_root`/`mirror_position`/`opposite_side` (slice 6) are the actions
  program #7's SRS schedules; without them return/progression has no verb.
- The action-vocabulary tie (§4b) is the general fix for the failure class the
  content-era audit named: author writes something, validator blesses it,
  nothing happens.

## 7. Proposed BACKLOG row edits

Design tier is intent tier — these are proposals, not edits. Each quotes the
existing first cell verbatim, then gives the replacement row.

**Existing first cell:** `Line Drill — opening recall → ideas → cross the book boundary → first-plan fork`
**Replacement row:**

`| Line Drill — opening recall → ideas → cross the book boundary → first-plan fork | 📐🔬 · **scheduled: breadth program #4, slice 4.** `theory_strict` opponent and `atSpineNode` triggers ship; entry filtering, boundary-crossing completion, `simulate_variations` and prediction interactions do not | `arch/04`, `01-training-model.md`, `planning/breadth/training-modes.md` |`

**Existing first cell:** `Plan Drill — 8–20-ply segments, rewind, branch comparison`
**Replacement row:**

`| Plan Drill — 8–20-ply segments, rewind, branch comparison | 📐🔬 · **scheduled: breadth program #4, slice 5.** The only mode with a real run; its own authored objective (`preserve_plan_window`) still evaluates to nothing, and segment replay + intent capture are unbuilt | `arch/05`, `01-training-model.md`, `planning/breadth/training-modes.md` |`

**Existing first cell:** `Outcome Drill — win/hold/save/resist, WDL-preserving grading`
**Replacement row:**

`| Outcome Drill — win/hold/save/resist, WDL-preserving grading | 📐🔬 · **scheduled: breadth program #4, slice 6.** The four outcome types are enum members with no evaluator; `outcome.reached` exists in run schema v0.4 with no producer; perfect-play resistance needs a Syzygy adapter that does not exist | `arch/06`, `01-training-model.md`, `planning/breadth/training-modes.md` |`

**Existing first cell:** `Trajectory Drill — causal opening→middlegame→endgame spines, causal-integrity rule`
**Replacement row:**

`| Trajectory Drill — causal opening→middlegame→endgame spines, causal-integrity rule | 📐 · **scheduled: breadth program #4, slice 7.** Guided trajectories need an authored `transitions` encoding and a `transitioned` producer (both absent); the organic variant additionally consumes phase recognition from program #3 | `arch/07`, `planning/breadth/training-modes.md` |`

**Existing first cell:** `Objectives & grading (objective state machine: active→preserved/degraded/failed/achieved/transitioned)`
**Replacement row:**

`| Objectives & grading (objective state machine: active→preserved/degraded/failed/achieved/transitioned) | 📐 · **scheduled: breadth program #4, slice 1.** Machine, transitions and the full predicate evaluator all ship; the pack→rules translator hardcodes `to: "achieved"` (`pack-orchestrator.ts:111`), so four of five states have no production producer | `arch/rfcs/RFC-0004` sketch, `docs/branch-runtime.md`, `planning/breadth/training-modes.md` |`

**Existing first cell:** `Off-spine graceful-degradation contract — how feedback honestly thins out as a run deviates from authored content`
**Replacement row:**

`| Off-spine graceful-degradation contract — how feedback honestly thins out as a run deviates from authored content | 📐 · **scheduled: breadth program #4, slice 3.** Pinned as a derived per-node `provenanceMode` on `/graph` under "plyHorizon caps, does not grant"; no new authored field | Q4a, Q8, `arch/04 §Stage B`, `planning/breadth/training-modes.md` |`

**Existing first cell:** `On-ramp pack lane (1000–1400)`
**Replacement row:**

`| On-ramp pack lane (1000–1400) | 📐 · **scheduled: breadth program #4.** Of the three knobs, `branchLengthTarget` 2–20 is encoded and read by nothing, `immediate_blunder_guard` is schema-valid and rejected at load (`pack-validation.ts:103-111`), and principle/threat objectives become encodable with slice 1's widened conditions | `00-thesis.md §Target player`, `planning/breadth/training-modes.md` |`

**New row proposed** (no existing equivalent; the audit named the failure class
but no ledger row owns the general fix):

`| Consumer-tied vocabulary lists — every closed authored vocabulary is one exported constant shared by validator and consumer | 💡 2026-08-12 from the checkpoint-action audit. `SUPPORTED_CHECKPOINT_ACTIONS` (`pack-validation.ts:11`) and `CheckpointSheet.svelte:31` currently agree by hand; nothing fails when they stop agreeing. Generalizes to actions, deviation classes, objective condition kinds and evidence-ref prefixes | `planning/breadth/training-modes.md` §4b |`

## 8. Owner-level questions

Two genuine product-intent forks. Everything else in this dossier is a
schedulable engineering decision.

**Q1 — Does a plan commitment create a branch?** §4c proposes that selecting a
plan class at an `intent_capture` checkpoint forks a labelled branch. This is
mechanically free and makes plan comparison native, but it means a run
accumulates one branch per plan commitment even when the learner never rewinds,
and the owner walkthrough already found branch growth and manual compare
selection cumbersome (`design/BACKLOG.md`, Q9 row). The alternative costs a
`drill_run` schema bump to v0.5 for an `intent.captured` event and keeps runs
lean. This is a product-shape call about what a branch *means*, not an
implementation preference.

**Q2 — Is minimal-but-real Outcome Drill allowed to ship without perfect-play
resistance?** `design/01-training-model.md:44-52` defines hold as "preserve a
draw against strong **or perfect** resistance", and `03-product-breadth.md:48-50`
lists perfect among the five policies. No tablebase code exists and none is in
another program's scope. Slice 6 as written ships convert/hold/save/resist
against `strong_engine` and `human_common` and treats perfect/annoying/fallible
as later entries in the same selector switch. If the owner reads "perfect" as
constitutive of hold rather than one resistance setting among five, slice 6
grows a Syzygy adapter and its position in the order changes.
