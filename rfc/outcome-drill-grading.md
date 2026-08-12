# RFC: Outcome Drill — objective grading for win / hold / save / resist

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` §Outcome types, §The four modes;
  `design/03-product-breadth.md` gate B2 and program item #4;
  `design/04-content-architecture.md` §4, §7
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened
  by owner ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** nothing unshipped. `rfc/archive/terminal-outcome-events.md` (D11) is
  implemented and supplies `outcome.reached`; `rfc/archive/content-sourcing-syzygy.md`
  (B6b) is implemented and supplies the tablebase evidence record this RFC cites as a
  root assessment
- **Parent / amends:** amends `apps/server/src/pack-orchestrator.ts`,
  `apps/server/src/pack-validation.ts`, `schemas/drill_pack.schema.json`,
  `packages/runtime/src/objective.ts`, `packages/schema/src/drill-pack/lint.ts`
- **Supersedes / superseded by:** —
- **Migration:** none. This RFC changes no persisted run shape and claims no migration
  number; see Specification §12.
- **Planning:** `planning/outcome-drill-grading/` (once implementing)

## Summary

`mode: "outcome"` and `objective.type: "hold"` are strings that reach no consumer.
`objectiveRules()` compiles exactly one condition shape — `reach_checkpoint` — and
hardcodes `to: "achieved"` (`apps/server/src/pack-orchestrator.ts:102-117`), and
`pack-validation.ts:160-178` rejects everything else. So the only encodable statement
about an outcome objective is "a checkpoint fired, therefore you succeeded".

That is not merely insufficient. Applied to the one real `hold` pack in the tree it is
**actively broken**: `content/drafts/rook-4v3-same-side.json` is unplayable past White's
first move, verified by execution (Motivation §2). This RFC specifies the grading that program
item #4 owns and that `rfc/archive/terminal-outcome-events.md` explicitly left out: how
`win`, `hold`, `save` and `resist` resolve against `outcome.reached`, what happens to a
run that ends without a terminal position, and what the product says at eleven pieces
where nothing can be proved.

## Motivation

### 1. The contract exists only in prose

`content/drafts/rook-4v3-same-side.json:515-519` ships a `feedbackClaim` that reads:

> "This is an outcome drill. You are graded on whether the result survived, not on
> whether you found the move an engine likes."

Nothing grades whether the result survived. The author wrote the WDL contract into a
paragraph because there was no field to write it into. That is the B2 gap for Outcome
Drill stated in one line.

### 2. D12 — the one real `hold` pack is unplayable (new, verified by execution)

Pack C's success condition is `reach_checkpoint: still-holding`
(`content/drafts/rook-4v3-same-side.json:20-25`), and `still-holding` triggers on
`materialBalance{perspective: black, comparison: atLeast, value: -1}` (lines 326-337).
Black starts a pawn down, so the balance **is already −1 at the root**. Driving the
shipped orchestrator over the pack's own first spine move produces:

```text
move.committed        Kf1 (opponent, ply 1)
checkpoint.reached    scheme-choice
checkpoint.reached    still-holding          <- true at the root
segment.completed     startNodeId == endNodeId
objective.state_changed  active -> achieved  evidenceRefs ["pack:still-holding"]
commitMove(black, g8f8) -> RuntimeError: Run is terminal at node: :node:1
feedbackDisclosed -> true
```

Four failures in one ply, all in shipped code:

- **D12a — no lint catches a trigger that is already true at the root.** `lint.ts`
  checks spine legality, SAN, node references and prose reachability
  (`packages/schema/src/drill-pack/lint.ts:15-22`); nothing evaluates a `materialBalance`
  or `fenPredicate` trigger against `start.fen`. The pack's own graduation blocker
  suspected the trigger might be "inert"
  (`content/drafts/rook-4v3-same-side.json:539`); it is worse than inert.
- **D12b — `achieved` is absorbing, so grading a hold as "achieved" ends the drill.**
  `TERMINAL_OBJECTIVE_STATES` (`packages/runtime/src/runtime.ts:32`) makes `commitMove`
  throw `RUN_TERMINATED` (`runtime.ts:277-279`), and the client stops asking for
  opponent replies (`apps/web/src/lib/session-controller.ts:372-380`). The learner never
  moves. **A `hold` objective can never be "achieved" at a playable position** — that is
  the structural finding this RFC is built on.
- **D12c — the disclosure barrier opens at ply 1.** `delayed_checkpoint` discloses on
  any `checkpoint.reached` (`packages/runtime/src/feedback.ts:3-8`), so ADR-0006's
  uninterrupted-consequence stage is gone before the learner touches a piece.
- **D13 — a zero-length segment.** `reachCheckpoint` pairs each checkpoint with the
  previous one on the branch without checking node identity
  (`packages/runtime/src/runtime.ts:448-466`), so two checkpoints on one node emit
  `segment.completed` with `startNodeId === endNodeId`. Under `segment_end` that is a
  premature-disclosure path, not just noise.

Pack C is the only pack in the tree with an outcome objective type; the other seven
(`schemas/drill_pack.example.json`, two drafts, four candidates) use
`play_until_checkpoint` or plan types. So the blast radius of fixing this is exactly one
authored file.

### 3. Scope boundary

**In scope:** the mapping from the four objective types to the six objective states; the
resolution contract for runs that never terminate; the pack-format encoding; the
validation and lint that make the encoding safe; the honest rendering of a grade whose
ground truth does not exist.

**Out of scope,** with reasons:

| Out of scope | Why |
|---|---|
| A runtime tablebase client | `grep -rn "tablebase\|syzygy" apps packages workers tools`, excluding `apps/server/src/sourcing/` and build output, returns nothing. Syzygy is an **authoring-time** pipeline (`apps/server/src/sourcing/syzygy.ts:105-121`, called only from `emitSyzygyCandidates` at :123). Probing positions mid-run is network egress, caching, licence recording and an abstention path — an engine/sourcing RFC |
| Implementing `perfect_tablebase` (D8's capability half) | Same reason. §8 closes D8's **drift** half — the schema/validator disagreement — and makes the missing capability visible inside every grade instead of silently absent |
| Stockfish as a grading authority | An evaluation is not a result. Above 7 pieces Stockfish cannot prove a draw, and promoting its number to a verdict is the dashboard anti-pattern (`AGENTS.md` law 8) one provider away from an LLM doing it |
| Intent-relative success for Plan Drill | Ledgered separately in `design/BACKLOG.md` §Authoring-format friction; needs `checkpoints[].interaction` to have a consumer, which it does not |
| `play_until_checkpoint` freezing at its checkpoint | Existing behaviour on four emitted candidates and the served schema example. Correct for a play-it-out drill and deliberately untouched |

## Specification

### 1. What grading is allowed to know

Three facts, all machine-derivable with no evaluation:

1. **The result of a terminal position**, from the laws of chess, in the learner's
   perspective. Shipped: `terminalOutcome` (`packages/runtime/src/outcome.ts:5-12`),
   emitted once per terminal node and validated on replay
   (`packages/runtime/src/events.ts:163-186`).
2. **Whether an authored checkpoint was reached on the active path.** Shipped:
   `checkpointWasReached` (`packages/runtime/src/objective.ts:176-184`).
3. **Material balance and rules facts.** Shipped:
   `evaluateObjectivePredicate` (`packages/runtime/src/objective.ts:195-230`).

Everything else — "is this still drawn", "was that resistance practical", "did you have
a win" — is an assessment. This RFC never computes one. It requires the pack to
**declare** it and to say how it knows, and it renders that declaration as a claim.

### 2. The four objectives against a three-valued outcome

`outcome.reached` carries `win | loss | draw`
(`packages/runtime/src/types.ts:186-189`, `RunOutcome` at `types.ts:39`). The four
objective types are **claims about
the starting position**, and the grade is whether the run's result stayed at or above
the floor that claim implies.

| `objective.type` | claims the root is | result floor | distinguished from its neighbour by |
|---|---|---|---|
| `win` | winning for the learner | `win` | — |
| `hold` | drawn | `draw` | vs `save`: **the root claim, not the ending** |
| `save` | worse for the learner, not proven lost | `draw` | vs `hold`: **the root claim, not the ending** |
| `resist` | lost | none | its success condition is survival, not result |

**`hold` and `save` produce identical result grading.** That is the honest answer to
"what distinguishes them": nothing at the terminal node. The distinction lives in the
type name, which is a claim about the root, and it is load-bearing in exactly three
places — the assessment sentence shown to the learner (§9), the failure sentence (§9),
and what an author is allowed to declare as `assessedBy` (§4). Encoding the difference
anywhere else would require an evaluation the repo cannot ground.

**`resist` succeeds on a loss.** Its success condition is *survival to an authored
resistance checkpoint*, which is condition (2) of §1 — an authored fact about the path,
not an evaluation of difficulty. A `resist` objective whose `resolveAt` is not a
checkpoint is ungradable and is rejected at load (§7).

### 3. When an objective resolves — and when it does not

**`achieved` and `failed` require an `outcome.reached`.** Nothing else may reach an
absorbing state. This is a law, not a default (§7 enforces it), and it is the direct fix
for D12b: a state that stops play may only be entered at a position where play has
already stopped.

**Every non-terminal resolution grades `preserved`.** `preserved` is the state the
runtime already owns for "the objective is intact and the run continues"
(`packages/runtime/src/objective-state.ts:3-10`; it is non-absorbing and may transition
onward). It is also the only honest word available: reaching the end of a hold drill is
not a draw, and the product must not say it is.

Resolution is declared, not inferred. `objective.grading.resolveAt` is one of:

- `{"kind": "terminal"}` — the objective resolves only when the game ends.
- `{"kind": "checkpoint", "checkpointId": "<id>"}` — reaching that checkpoint on the
  active path resolves it to `preserved`.

There is deliberately **no ply-horizon kind and no engine or Syzygy resolution.** A ply
horizon is written as a checkpoint with an `atPly` trigger, which the schema already
supports and which `emitSyzygyCandidates` already emits
(`apps/server/src/sourcing/syzygy.ts:186`); routing it through a checkpoint means every
resolution carries a `pack:<checkpointId>` evidence reference that the shipped renderer
turns into the checkpoint's authored label (`apps/web/src/lib/evidence-sentences.ts:44-54`)
instead of a new vocabulary. Engine and Syzygy resolution are refused for the reasons in
the out-of-scope table and §9.

**A run that simply stops is not graded.** There is no timeout, no abandonment
inference, no background pass. The objective state of the last node on the path is the
answer, `active` included, and `RunSummary.objectiveState`
(`apps/server/src/storage.ts:51-62`) already carries it into history. `active` renders as
"unresolved" (§9). Grading only ever happens inside `orchestratePackMove`, on a commit.

**Rewind un-resolves, per path.** Objective state lives on nodes: `commitMove` copies the
cursor node's state onto the new node (`packages/runtime/src/runtime.ts:332`) and
`objective.state_changed` projects onto one node
(`packages/runtime/src/events.ts:122-144`). So each branch is graded on its own path and
a later failure never rewrites the `preserved` grade recorded at the resolution node.
This is what makes "rewind and try again" mean anything for an outcome drill, and it is
tested (criterion 9).

### 4. Pack format v0.3 — `objective.grading`

`schemas/drill_pack.schema.json` bumps `$id` to `urn:chess-tabiya:schema:drill-pack:0.3`
and `DRILL_PACK_SCHEMA_VERSION` to `"0.3"`
(`packages/schema/src/index.ts:2`, asserted at `packages/schema/src/drill-pack.test.ts:53-55`).
`digestDrillPack` digests the document, not the schema version
(`packages/schema/src/drill-pack/digest.ts:60-66`), so **no pack digest changes from the
bump** and no stored run is orphaned by it.

```jsonc
"objective": {
  "type": "hold",
  "summary": "…",
  "grading": {
    "assessedBy": {
      "kind": "authored",
      "claimId": "no-tablebase-here"          // optional; must name a feedbackClaims id
    },
    "resolveAt": { "kind": "checkpoint", "checkpointId": "still-holding" }
  },
  "successConditions": [ /* §5 */ ]
}
```

`assessedBy` is a closed union:

```ts
type RootAssessment =
  | { readonly kind: "authored"; readonly claimId?: string }
  | {
      readonly kind: "syzygy";
      readonly category: "win" | "loss" | "draw";  // side-to-move perspective, verbatim
      readonly pieceCount: number;                 // 2..7
      readonly sourceId: "syzygy";
      readonly retrievedAt: string;                // ISO 8601, from the evidence ledger
    };
```

The `syzygy` variant is a **copy of the `tablebase_result` record** the shipped pipeline
already writes into `evidence.json` (`apps/server/src/sourcing/syzygy.ts:160-168`). It is
not a live probe and it is not re-verified at load beyond the checks in §7.

Two schema tightenings ship with it, both closing D4-shaped divergence:

- `$defs.objective` currently has `"additionalProperties": true`
  (`schemas/drill_pack.schema.json:135-147`), so `grading` already validates today while
  meaning nothing. It becomes `false` with `type`, `summary`, `grading`,
  `successConditions` declared. All eight packs in the tree use only the first three
  keys, so nothing breaks.
- `successConditions.items` is `{"type": "object"}` — anything at all. It becomes the
  closed union of §5.

### 5. `successConditions` v0.3 — the widening

```ts
type ObjectiveState = "active" | "preserved" | "degraded" | "failed" | "achieved" | "transitioned";
type NonTerminalState = "active" | "preserved" | "degraded";

interface SuccessConditionBase {
  /** Target state. Default "achieved". */
  readonly to?: ObjectiveState;
  /** Source states. Default: every non-terminal state except `to`. */
  readonly from?: readonly NonTerminalState[];
}

type SuccessCondition =
  | (SuccessConditionBase & { readonly kind: "reach_checkpoint"; readonly checkpointId: string })
  | (SuccessConditionBase & { readonly kind: "outcome"; readonly result: "win" | "loss" | "draw" })
  | (SuccessConditionBase & {
      readonly kind: "material_balance";
      readonly perspective: "white" | "black";
      readonly comparison: "atLeast" | "atMost" | "equal";
      readonly value: number;
    })
  | (SuccessConditionBase & {
      readonly kind: "rules_fact";
      readonly fact: "checkmate" | "stalemate" | "draw";
      readonly winner?: "white" | "black";
    });
```

Each maps onto a shipped `ObjectivePredicate` (`packages/runtime/src/objective.ts:60-69`)
except `outcome`, which needs §6. Evidence references are fixed per kind and never
authored free-form:

| kind | evidence ref |
|---|---|
| `reach_checkpoint` | `pack:<checkpointId>` |
| `outcome` | `rules:result-win` / `rules:result-loss` / `rules:result-draw` (§9) |
| `material_balance` | `rules:material` |
| `rules_fact` | `rules:checkmate` / `rules:stalemate` / `rules:draw-*` as the fact implies |

`rules_fact` exists so authors can mark *position* facts, not results. Its `draw` case is
`drawIsAvailable` (`packages/runtime/src/objective.ts:186-193`) — "a draw could be
claimed on this path", which is not "the game is drawn" — so §7 forbids it from reaching
an absorbing state on any objective type. Combined with
`OBJECTIVE_ABSORBING_WITHOUT_OUTCOME`, the net effect on an outcome pack is that
`reach_checkpoint`, `material_balance` and `rules_fact` can only reach `preserved` and
`degraded`. That is the D12b law expressed in the vocabulary rather than in a comment.

**The `from` default excludes `to`.** `ALLOWED_TRANSITIONS`
(`packages/runtime/src/objective-state.ts:3-10`) does not list any state as a successor of
itself, so `assertObjectiveTransition` throws `ObjectiveTransitionError` on a
self-transition (`objective-state.ts:44-49`) — and once a rule matches,
`evaluateObjective` reaches it unconditionally through `transitionObjective`
(`packages/runtime/src/objective.ts:296` → `:239`), as does replay
(`packages/runtime/src/events.ts:130-134`). A
condition that keeps matching after it has fired would therefore throw on the next
commit and take the run down. Compiling `from` without `to` is what prevents it; an
explicit `from` that contains `to` is a load error (§7).

### 6. Runtime: the `outcomeReached` predicate

`ObjectivePredicate` gains exactly one member:

```ts
| { readonly type: "outcomeReached"; readonly result: "win" | "loss" | "draw" }
```

```ts
case "outcomeReached": {
  const pathNodeIds = new Set(pathToNode(run, node).map((pathNode) => pathNode.id));
  return run.events.some(
    (event) =>
      event.type === "outcome.reached" &&
      event.data.outcome === predicate.result &&
      pathNodeIds.has(event.data.nodeId),
  );
}
```

**Path scoping is the whole correctness of it.** `run.events` is global: a branch that
ended in mate leaves its `outcome.reached` in the log forever, so an unscoped predicate
would grade every later branch by the first branch's result. The implementation mirrors
`checkpointWasReached` (`objective.ts:176-184`) exactly, and criterion 5 tests it
directly.

Engine-free and deterministic, so `docs/branch-runtime.md:117` stays true. `rulesFact`
is **not** reused for this: its `draw` case is `drawIsAvailable`
(`objective.ts:186-193`), which is true wherever a threefold or 50-move claim *could* be
made — the runtime has no claim mechanism, so grading a hold on it would assert a draw
nobody took.

### 7. Rule compilation and validation

`objectiveRules(pack)` (`apps/server/src/pack-orchestrator.ts:102-117`) is replaced. For
`objective.type ∈ {win, hold, save, resist}` it emits **derived rules first, authored
`successConditions` after**, in this order. `evaluateObjective` takes the first rule
whose `from` matches the current state (`packages/runtime/src/objective.ts:289-297`), so
order is normative.

For `win`, `hold`, `save` — floor `win` for `win`, `draw` for `hold` and `save`:

| # | `when` | `from` | `to` |
|---|---|---|---|
| 1 | `outcomeReached(win)` | active, preserved, degraded | `achieved` |
| 2 | `outcomeReached(draw)` | active, preserved, degraded | `achieved` if floor is `draw`, else `failed` |
| 3 | `outcomeReached(loss)` | active, preserved, degraded | `failed` |
| 4 | resolution predicate | active, degraded | `preserved` |

For `resist`:

| # | `when` | `from` | `to` |
|---|---|---|---|
| 1 | `outcomeReached(win)` | active, preserved, degraded | `achieved` |
| 2 | `outcomeReached(draw)` | active, preserved, degraded | `achieved` |
| 3 | `outcomeReached(loss)` | **preserved** | `achieved` |
| 4 | `outcomeReached(loss)` | active, degraded | `failed` |
| 5 | resolution predicate | active, degraded | `preserved` |

Rule 4 is omitted when `resolveAt.kind === "terminal"`; rules 3 and 5 are why `resist`
requires a checkpoint resolution. Row 3 is the single row where losing is success: you
reached the resistance checkpoint first, and then the position did what it was declared
to do.

For the other six objective types nothing is derived; rules come from
`successConditions` alone, exactly as today except that `to` and `from` are now
expressible. `objective.grading` on those types is a load error.

New `pack-validation.ts` runtime issues, all `severity: "error"`:

| Code | Rule |
|---|---|
| `OBJECTIVE_GRADING_REQUIRED` | `type ∈ {win,hold,save,resist}` without `objective.grading` |
| `OBJECTIVE_GRADING_UNSUPPORTED` | `objective.grading` on any other type |
| `OBJECTIVE_RESOLUTION_UNKNOWN` | `resolveAt.checkpointId` is not a checkpoint in this pack |
| `OBJECTIVE_RESIST_NEEDS_CHECKPOINT` | `type: "resist"` with `resolveAt.kind: "terminal"` |
| `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME` | two clauses. (a) A `successConditions` entry with `to ∈ {achieved, failed, transitioned}` whose `kind` is not `outcome`, **when `type ∈ {win,hold,save,resist}`** — the D12b law, scoped to outcome types so the four emitted candidates and the served schema example, which all use `reach_checkpoint → achieved` under `play_until_checkpoint`, keep working. (b) On **any** objective type, a `rules_fact` entry with `fact: "draw"` targeting an absorbing state, because `drawIsAvailable` is availability, not result |
| `OBJECTIVE_SELF_TRANSITION` | an explicit `from` containing `to` |
| `OBJECTIVE_TERMINAL_FROM` | a `from` naming `achieved`, `failed` or `transitioned` |
| `SYZYGY_ASSESSMENT_OUT_OF_RANGE` | `assessedBy.kind: "syzygy"` with `countFenPieces(start.fen) > 7`, or a `pieceCount` disagreeing with the FEN. `countFenPieces` is exported at `apps/server/src/sourcing/syzygy.ts:51-53` |
| `SYZYGY_ASSESSMENT_MISMATCH` | the category, flipped to the learner's perspective when `start.side` is not the FEN's side to move, does not match the type: `win`→`win`, `hold`→`draw`, `save`→`loss`, `resist`→`loss`. Categories outside `win\|loss\|draw` — `cursed-win`, `blessed-loss`, `maybe-*`, `unknown` — are rejected, because they encode 50-move-rule subtleties this product does not model and guessing at them would manufacture a chess claim |
| `OBJECTIVE_CLAIM_UNKNOWN` | `assessedBy.claimId` names no `feedbackClaims` entry |

Note the `save` row: an author who declares `save` at ≤7 pieces is declaring the root
**lost by tablebase and savable in practice**, which is exactly what `design/01` means by
"start objectively worse". `hold` at ≤7 must be a tablebase draw. This is the one place
where the hold/save distinction becomes machine-checkable, and it is checkable only
because a tablebase covered it.

New lint (`packages/schema/src/drill-pack/lint.ts`), `severity: "warning"`:

- **`CHECKPOINT_TRUE_AT_ROOT`** — a `materialBalance` or `fenPredicate` checkpoint
  trigger that already holds in `start.fen`, or `atPly: 0`. D12a. The lint evaluates the
  trigger against the start position only; it does not attempt reachability.

### 8. Resistance policies, and D8

`design/03-product-breadth.md:48-50` names perfect / strong / practical / annoying /
fallible. Verified in the tree today:

| Design name | Encoding | State |
|---|---|---|
| strong | `strong_engine` | ships — Stockfish (`apps/server/src/opponent-selector.ts:437-451`) |
| practical | `human_common` | ships — Maia at `targetElo` (`opponent-selector.ts:428-435`) |
| theory | `theory_strict` | ships (`opponent-selector.ts:453-486`) |
| perfect | `perfect_tablebase` | **unencodable.** Passes the JSON Schema (`schemas/drill_pack.schema.json:355-365`), rejected by `pack-validation.ts:125-138` against `SUPPORTED_POLICY_MODES` (`apps/server/src/capabilities.ts:10-14`), and absent from `#selectUncached` (`opponent-selector.ts:388-399`). D8 |
| annoying, fallible | — | no schema value, no mode, no design encoding |

**This RFC ships only the three that exist, and does not fix D8's capability half.** It
closes D8's *drift* half, which is inside its scope and costs ~20 lines:

`capabilities.ts` gains an exported `DECLARED_UNIMPLEMENTED_POLICY_MODES` — a frozen list
of `{mode, reason}` — and a test asserts that the JSON Schema's `opponentPolicy.mode`
enum equals `SUPPORTED_POLICY_MODES ∪ DECLARED_UNIMPLEMENTED_POLICY_MODES` exactly. The
`UNSUPPORTED_OPPONENT_POLICY` message quotes the reason. A silent divergence becomes a
tested, documented one, and the next value added to either list fails the build instead
of drifting. `immediate_blunder_guard` gets the same treatment on the feedback-policy
enum, since it is the other half of D8.

**The grade must name who resisted.** `run.opponentPolicy` is already on the projected
run (`packages/runtime/src/types.ts:225`, projected at
`packages/runtime/src/events.ts:203`). Every rendered grade carries a resistance
line (§9), and while `perfect_tablebase` is unimplemented that line ends "not perfect
play." A `hold` graded `preserved` against Maia 1900 must never read as a hold against
best play, and the only thing standing between those two readings is this sentence.

### 9. The honesty boundary — what is gradable at what material count

| Material | Result grading | Root assessment | What the product says |
|---|---|---|---|
| any | **exact** — laws of chess, from `outcome.reached` | — | "The game ended drawn." |
| ≤7 pieces | exact | **exact**, if the pack carries a `syzygy` assessment from the B6b ledger | "Starting position: draw — Syzygy tablebase, 6 pieces, exact." |
| ≤7 pieces, no tablebase record | exact | authored claim | as below |
| >7 pieces | exact | **impossible** — no source of truth exists anywhere in or out of this repo | "Starting position: the author claims this is drawn. No tablebase covers 11 pieces, so this is a claim, not a proof." |

Note what is *not* in the ≤7 row: per-node grading. Even at six pieces this RFC cannot
say "you are still holding at move 20", because that needs a runtime probe that does not
exist (out-of-scope table). Exactness at ≤7 buys the **root claim**, not a running
verdict.

Three rendering laws follow, each with a test:

1. **`preserved` is never rendered as a result.** Its sentence is
   "You reached *{checkpoint label}* without conceding the result. That is the end of
   this drill, not a proof of the position." The strings "draw", "held", "you drew" and
   "you won" are forbidden in the `preserved` presentation, asserted by test.
2. **An `authored` assessment always renders its unproved marker**, with the linked
   `feedbackClaims` text when `claimId` is present. Pack C's `no-tablebase-here` claim
   (`content/drafts/rook-4v3-same-side.json:484-490`) is exactly this string, already
   written by its author and currently displayed nowhere.
3. **`active` renders as "unresolved"**, not as a neutral chip. A run that stopped has no
   grade and must say so.

Surfaces, all shipped and only extended:

- `projectPackDocument` (`apps/server/src/pack-registry.ts:47-74`) currently projects only
  `objective.type` and `objective.summary`; it adds `objective.grading`. Nothing else
  about the projection changes.
- `RULES_EVIDENCE_FACTS` (`packages/runtime/src/evidence-ref.ts:1-8`) gains
  `result-win`, `result-loss`, `result-draw`. `RULES_SENTENCES` is typed
  `Record<RulesEvidenceFact, string>` (`apps/web/src/lib/evidence-sentences.ts:19-26`), so
  TypeScript forces the sentences to be added in the same change — the anti-D4 property,
  and the reason this widening is safe where a free-form string would not be.
  `docs/explanation-grounds.md:151-153` says no new sentence vocabulary was added for
  the compare feature; this RFC adds three, and they are rules facts — the result of a
  terminal position under the laws of chess — not strategic explanations.
- `WhyBanner` (`apps/web/src/lib/WhyBanner.svelte`) gains the assessment and resistance
  lines above its existing sentences.
- `CheckpointSheet` (`apps/web/src/lib/CheckpointSheet.svelte:8-16`) gains an optional
  resolution block, shown when the checkpoint that fired is the objective's `resolveAt`
  checkpoint. The resolution is presented, not slipped past: the sheet already opens on
  every checkpoint via `#captureCheckpoint`
  (`apps/web/src/lib/session-controller.ts:418-428`), and Continue still continues,
  because `preserved` does not stop play.
- `TerminalSheet` (`apps/web/src/lib/TerminalSheet.svelte:22-27`) shows the *result*
  ("You lost."). It gains the *grade* beneath it — "Objective: hold — failed" — plus the
  assessment and resistance lines. Result and grade are different sentences and are
  rendered as different sentences.

### 10. D13 — the zero-length segment

`reachCheckpoint` emits `segment.completed` whenever a previous checkpoint exists on the
branch, without comparing node ids (`packages/runtime/src/runtime.ts:448-466`). Two
checkpoints on one node produce a segment of length zero, which under `segment_end`
discloses feedback. Fix: skip the `segment.completed` append when
`previous.data.nodeId === run.activeCursor.nodeId`. Three lines, and it is on this RFC's
path because outcome packs carry several checkpoints whose triggers can coincide.

### 11. Pack C is the fixture

`content/drafts/rook-4v3-same-side.json` becomes the executable fixture for B2's Outcome
Drill row. Changes are mechanical and make **no new chess claim**:

- `version` `0.1.0` → `0.2.0`.
- `still-holding`'s trigger becomes `{"atPly": 8}` — the pack's own
  `authoredBoundary.plyHorizon` and `difficulty.branchLengthTarget`
  (`content/drafts/rook-4v3-same-side.json:11,365`), so the grading horizon equals the
  authored support rather than running eight plies past it. The
  `materialBalance{atLeast: -1}` it used is deleted as a *trigger* and returns as a
  `degraded` condition at `{atMost: -2}`, which is false at the root and true only once a
  second pawn is gone.
- `objective` becomes:

```jsonc
"objective": {
  "type": "hold",
  "summary": "…unchanged…",
  "grading": {
    "assessedBy": { "kind": "authored", "claimId": "no-tablebase-here" },
    "resolveAt": { "kind": "checkpoint", "checkpointId": "still-holding" }
  },
  "successConditions": [
    { "kind": "material_balance", "perspective": "black", "comparison": "atMost",
      "value": -2, "to": "degraded" }
  ]
}
```

- The graduation blocker at line 539 ("the `still-holding` checkpoint uses a
  materialBalance trigger whose runtime behaviour the author did not verify") is
  replaced with the verified finding, and the pack keeps `reviewStatus: "draft"`. None of
  the other blockers are touched: no engine pass has been run, no endgame reference has
  been cited, and this RFC does not pretend otherwise.

**`opponentPolicy` is not changed.** Pack C stays `human_common` at Elo 1900. Switching
it to `theory_strict` would make the drill deterministic and therefore easy to drive move
by move in a browser, and that is exactly why it is refused: which resistance a defence
drill should face is an authoring decision with chess content in it, and a test's
convenience is not a reason to make it. The consequence is stated plainly in the
acceptance criteria — Pack C carries the complete fixture run at the service layer, where
legal replies can be computed, and carries the pre-play surface in the browser, while the
move-by-move browser assertions run against purpose-built `theory_strict` fixtures
(criteria 4 and 13–15).

**Editing the pack changes its digest**, and `#registeredPack` returns `undefined` when a
stored run's `packDigest` no longer matches (`apps/server/src/service.ts:621-625`), which
makes `/runs/:id/authored-feedback` raise `PACK_NOT_FOUND` (`service.ts:452-457`) for runs
started against 0.1.0. Drafts load only in development
(`apps/server/src/pack-registry.ts:168-181`) and the pack is unplayable today, so the real
population is developer test runs. Stated rather than migrated, consistent with
`rfc/archive/terminal-outcome-events.md` §5.

### 12. No migration

No persisted run shape changes. `objective.state_changed` already carries `from`, `to`
and `evidenceRefs` (`schemas/drill_run.schema.json:419-431`), its `evidenceRefs` items are
plain non-empty strings (`drill_run.schema.json:78-81`, so `rules:result-draw` needs no
schema change), and no event type is added. `DRILL_RUN_SCHEMA_VERSION` stays `"0.6"` and
this RFC claims **no row in the migration register**. The pack-schema bump to 0.3 is not
a persisted shape: pack digests are content digests, unaffected by the `$id`.

## Deviations from design

1. **`design/01-training-model.md:85-86` defines `save` as reaching "a draw **or real
   counterplay**".** Counterplay is not gradable without an evaluation, so this RFC
   grades `save` on the draw floor only. Authors who want the counterplay half express it
   as a `degraded`/`preserved` condition over material or an authored checkpoint.
2. **`design/01-training-model.md:87-88` defines `resist` as "maximize practical
   difficulty".** Maximization is not a predicate. This RFC grades `resist` on the other
   half of the same sentence — "reach resistance checkpoints" — and says so in the
   rendered grade rather than implying difficulty was measured.
3. **`design/03-product-breadth.md:48-50` names five resistance policies.** Three are
   encodable; `perfect_tablebase` is D8 and `annoying`/`fallible` have no encoding at
   all. This RFC ships three and makes the absence visible in every grade (§8) instead of
   silently narrowing the design. Closing the remaining two is a BACKLOG row to be
   proposed, not an edit this RFC makes to `design/`.
4. **D12, D12a, D12c and D13 are new defects found while writing this RFC.** They are
   specified and closed here; their `design/BACKLOG.md` rows are owner-tier and are not
   written by this RFC (`AGENTS.md` law 5).

## Acceptance criteria

1. **The four objectives resolve as specified.** A table-driven runtime/orchestrator test
   asserts, for each of `win`, `hold`, `save`, `resist` crossed with `win`, `loss`, `draw`,
   the exact target state from §7's tables — including the row that is easy to get wrong:
   `resist` + `loss` from `preserved` is `achieved`, and from `active` is `failed`.
2. **No non-terminal condition reaches an absorbing state.** A pack with
   `type: "hold"` and `{"kind": "reach_checkpoint", "to": "achieved"}` fails load with
   `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME`; the same condition under
   `type: "play_until_checkpoint"` still loads and still grades `achieved`. Both asserted,
   because the second is the compatibility half.
3. **D12 regression, at the runtime.** Pack C v0.2.0 played from its root: the learner's
   first move commits instead of raising `RUN_TERMINATED`, no checkpoint fires at ply 1,
   and `feedbackDisclosed` is `false` after the opponent's first move. Written as a
   regression naming D12 so it cannot be silently reverted.
4. **A complete fixture run.** Pack C v0.2.0 is played end to end, root to its
   `still-holding` checkpoint at ply 8, through the real `Service.move` /
   `Service.opponentPly` path against the mock engine — learner replies chosen as the
   first legal move so the run does not depend on the opponent's choices. Asserted: the
   objective reaches `preserved` at ply 8 and undergoes no earlier transition; the
   transition carries `pack:still-holding`; the run is still playable afterwards (one
   further move commits, the D12b regression); and the whole event log survives a
   round-trip through `projectRun` with identical node states. The mock opponent's choices
   are not asserted — only the grading is.
5. **Path scoping of `outcomeReached`.** A run whose branch A ended in checkmate, then
   rewound to a pre-mate node and forked: branch B's objective state is unaffected by
   branch A's `outcome.reached`, asserted on a `resist` pack where the difference decides
   `achieved` versus `active`.
6. **Self-transition cannot be authored.** A condition with `from` containing `to` fails
   load with `OBJECTIVE_SELF_TRANSITION`; a compiled default `from` never contains `to`,
   asserted by driving the same condition twice across two commits and proving the second
   commit does not throw `ObjectiveTransitionError`.
7. **Syzygy assessment checks.** A `hold` pack declaring `assessedBy.kind: "syzygy"` at 11
   pieces fails with `SYZYGY_ASSESSMENT_OUT_OF_RANGE`; a `hold` declaring `category: "win"`
   fails with `SYZYGY_ASSESSMENT_MISMATCH`; a `category: "cursed-win"` fails; and a
   `save` pack at 6 pieces with `category: "loss"` and `start.side` opposite the FEN's side
   to move **passes**, proving the perspective flip is applied and not merely described.
8. **`CHECKPOINT_TRUE_AT_ROOT`.** Pack C at v0.1.0 produces the warning; Pack C at v0.2.0
   does not. The v0.1.0 assertion is written against an inline fixture, not the edited
   file, so it keeps testing the defect after the file is fixed.
9. **Rewind preserves the grade per path.** After resolution to `preserved`, the learner
   plays on and is checkmated: the terminal node is `failed`, the resolution node is still
   `preserved`, and rewinding to it restores a playable `preserved` cursor. Asserted on a
   constructed `hold` fixture where mate is reachable, not on Pack C.
10. **D13.** Two checkpoints firing on one node emit no `segment.completed`, and a
    `segment_end` pack in that shape does not disclose feedback at that node.
11. **The honesty strings.** A component test asserts the `preserved` presentation
    contains the checkpoint label and the "not a proof of the position" clause and
    contains none of `draw`, `held`, `you drew`, `you won`; that an `authored` assessment
    renders the linked `feedbackClaims` text; that the resistance line names
    `human_common` / Maia 1900 and ends "not perfect play"; and that `active` renders
    "unresolved".
12. **Policy-mode single source of truth.** A test asserts the JSON Schema's
    `opponentPolicy.mode` enum equals `SUPPORTED_POLICY_MODES ∪
    DECLARED_UNIMPLEMENTED_POLICY_MODES`, and that adding a value to the schema alone
    fails it. Same for the feedback-policy enum. D8's drift half.
13. **Browser test — the non-terminal grade reaches the screen, and the run is not
    frozen.** A new fixture `schemas/fixtures/drill-pack/outcome-hold.browser.json`
    (`mode: "outcome"`, `type: "hold"`, `theory_strict` spine, `seedMode: "fixed"`,
    `resolveAt` a `{"atPly": 4}` checkpoint, `assessedBy: {"kind": "authored"}`) is played
    to its resolution in Playwright. Asserted: the resolution block renders the
    `preserved` sentence with the checkpoint label and the "not a proof of the position"
    clause; the assessment line renders the unproved marker; the resistance line names the
    policy and ends "not perfect play"; and after pressing Continue the learner **makes one
    further move that commits** — the D12b regression asserted in the browser, where it
    was visible to the owner and invisible at the endpoint. `theory_strict` at a fixed seed
    is what makes the move sequence deterministic, the same mechanism
    `terminal-outcome.browser.json` already relies on.
14. **Browser test — a terminal grade, and a loss that is a pass.** A second fixture
    `schemas/fixtures/drill-pack/outcome-resist.browser.json`
    (`type: "resist"`, `resolveAt` a `{"atPly": 2}` resistance checkpoint, learner mated on
    a `theory_strict` spine) is played to checkmate: `TerminalSheet` shows the result
    "You lost." **and**, as a separate sentence, the grade "Objective: resist — achieved".
    Both fixtures make no chess claim beyond move legality and the mate itself, and carry
    a `graduationBlockers` entry saying so, as
    `schemas/fixtures/drill-pack/terminal-outcome.browser.json` already does.
    `playwright.config.ts`'s single `DRAFT_PACK_FILE` cannot serve three fixtures, so the
    two new files live in `content/drafts/` alongside Pack C for the browser run, or the
    config gains a `DRAFT_PACK_DIR`; whichever is chosen, `make test-browser` loads all
    three plus Pack C and the existing terminal fixture.
15. **Browser test — Pack C on the screen.** Pack C v0.2.0, served from
    `content/drafts/` in development (`apps/server/src/pack-registry.ts:168-181`), is
    opened and its objective rail is asserted **before any move**: the authored assessment
    line carrying the pack's own `no-tablebase-here` text, and the resistance line naming
    `human_common` at Elo 1900. Move-by-move play is deliberately not asserted here,
    because Pack C's opponent is Maia and its replies are not fixed (§11).
16. **Existing packs unaffected.** `schemas/drill_pack.example.json`, the two plan drafts
    and the four `content/candidates/*/pack.json` load, validate and grade exactly as
    before, asserted by a test that loads every pack file in the repo through
    `validatePackDocument`. The browser assertion `active → achieved`
    (`tests/browser/drill.spec.ts:148`) still passes unchanged.
17. **No migration.** A test asserts `DRILL_RUN_SCHEMA_VERSION === "0.6"` and that a run
    stored before this change replays unchanged; `rfc/README.md`'s migration register
    gains no row.
18. `ENGINES_REQUIRED=1 make verify` green; `make test-browser` green;
    `make pack-check FILE=content/drafts/rook-4v3-same-side.json` green.
19. **Docs.** `docs/drill-pack-format.md` documents v0.3, `objective.grading`, the widened
    `successConditions` and the new validation codes; `docs/branch-runtime.md` documents
    the `outcomeReached` predicate and the D13 segment rule;
    `docs/explanation-grounds.md` replaces its "grounding unshipped objective types such
    as `win` and `hold`" boundary item (line 207) with the shipped grounds and records the
    three new `rules:` facts against its no-new-vocabulary claim (lines 151-153);
    `docs/drill-client.md` documents the resolution block and the terminal grade line.

## Open questions

None.

## Changelog

- 2026-08-12: created. Specifies WDL-preserving grading for `win`/`hold`/`save`/`resist`,
  closes D12 (Pack C unplayable, verified by execution), D12a (no root-truth lint),
  D12c (ply-1 disclosure) and D13 (zero-length segment), and closes the drift half of D8
  while leaving its capability half open and visible.
