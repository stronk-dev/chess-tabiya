# RFC: Line Drill — opening theory, boundary crossing, and membership grading

- **Status:** draft
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` §The four modes (Line Drill row, line 97);
  `design/03-product-breadth.md` gate B2 and program item #4 (lines 43-45, 162, 248-250);
  `design/04-content-architecture.md` §6
- **Exploration gate:** breadth sequencing ruling 2026-08-11 + exploration gate opened by
  owner ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** nothing unshipped. `rfc/archive/outcome-drill-grading.md` is implemented
  and supplies the monotone law, the `checkpointReachedHere` edge trigger, the
  request-versus-engine honesty pattern, and pack schema v0.3;
  `rfc/archive/authored-explanation-surface.md` is implemented and supplies the
  path-relative reveal contract this RFC delivers verdicts through
- **Parent / amends:** **`rfc/archive/drill-pack-format.md`** (pack schema 0.3 → 0.4: the
  `follow_theory` objective type, the `atAuthoredBoundary` trigger, and the first evaluator
  `authoredBoundary` has ever had), **`rfc/archive/outcome-drill-grading.md`** (its compiled
  rule order and monotone law gain a second objective family that reuses one half and
  refuses the other), **`rfc/archive/authored-explanation-surface.md`** (its
  `AuthoredFeedbackItem` union gains a fourth kind and its static reachability rule learns
  one new trigger), **`rfc/archive/drill-client.md`** (the pack projection stops shipping
  the authored line for `mode: "line"`, and `/select-move` stops accepting a
  client-supplied spine), and **`rfc/archive/engine-workers.md`** (the `theory_strict`
  fallback keeps its behaviour and gains an honest rendering)
- **Supersedes / superseded by:** —
- **Migration:** none. No persisted run shape changes and this RFC claims no migration
  number; see Specification §11.
- **Planning:** `planning/line-drill-theory-grading/`

## Summary

`mode` is a string that reaches one `<span>` (`apps/web/src/lib/PackList.svelte:34`).
`authoredBoundary` is a schema object with **no evaluator anywhere in the tree** — the only
code that reads it is a node-reference check in the lint
(`packages/schema/src/drill-pack/lint.ts:240-247`), and `plyHorizon` and `fenPredicates` are
read by nothing at all, not even by the TypeScript type
(`packages/schema/src/drill-pack/types.ts:92-95` declares only `spineNodeIds`).
`deviations` reach the authored-feedback projection as prose
(`apps/server/src/authored-feedback.ts:127-142`) and are graded by nothing.

So the two encodings that make an opening drill an opening drill — where the book ends and
what the author said about leaving it — are inert. This RFC gives them evaluators and one
grading contract, and it does that **without importing Outcome Drill's grading**, because
theory membership is not a result. A move is on the authored line, is a deviation the author
classified, or is **unknown** — and unknown is a verdict this RFC renders, not a failure it
infers.

## Motivation

### 1. What "half-real by accident" actually means, verified

`theory_strict` and `atSpineNode` work. Both were built for other reasons and both happen to
be Line Drill machinery:

- `#theoryStrict` restricts Maia's policy mass to the authored spine's children at the
  current position and samples from it (`apps/server/src/opponent-selector.ts:453-486`).
  It resolves those children **by position**, not by move prefix: `addSpinePosition`
  indexes every authored position by `transposeKey` (`opponent-selector.ts:321-335`) and
  `spineChildren` looks up the current position's key (`:337-347`). A test asserts it
  recognises a transposition back onto the spine
  (`apps/server/src/opponent-selector.test.ts:201`).
- `atSpineNode` fires a checkpoint when the run's path spells an authored path
  (`apps/server/src/pack-orchestrator.ts:23-39`, `:48-50`), and Pack A reaches its
  `plan-commitment` checkpoint that way in the browser suite
  (`tests/browser/drill.spec.ts:312-339`).

Everything else the mode needs is absent, and three of the absences are worse than absence.

### 2. The five findings this RFC is built on

**2a. `mode` branches nothing, so nothing is a Line Drill.** `raw.mode` is copied into the
pack summary (`apps/server/src/pack-registry.ts:206`) and into the wire projection
(`pack-registry.ts:67`). `grep -rn "\"line\"" apps packages --include="*.ts"` outside tests
returns exactly one non-summary hit: the sourcing emitter writes `mode: "line"` into
candidate packs (`apps/server/src/sourcing/openings.ts:103`). No validator, orchestrator,
selector or screen reads it.

**2b. `authoredBoundary` means two different things in the four packs that use it, and
nothing has ever had to decide.** Verified by reading them:

| Pack | spine nodes | `spineNodeIds` | `plyHorizon` | reading it implies |
|---|---|---|---|---|
| `schemas/drill_pack.example.json:114-123` | 5 | 2 — `najdorf-b5`, `najdorf-be2`, both **leaves** | 4 | the listed ids are the **frontier** |
| `content/drafts/anti-caro-advance.json:183-197` | 10 | **all 10** | 14 | the listed ids are the **interior** |
| `content/drafts/carlsbad-minority-attack.json:288-307` | 15 | all 15 | 8 | interior |
| `content/drafts/rook-4v3-same-side.json:348-375` | 23 | all 23 | 8 | interior |

Under the interior reading the served schema example is incoherent: `najdorf-be3`,
`najdorf-e6` and `najdorf-f3` would be **outside** the boundary while their own descendants
`najdorf-b5` and `najdorf-be2` are inside. Under the frontier reading every pack in the tree
is coherent, and the field's name becomes true. §3b rules for the frontier reading on that
evidence and nothing else.

**2c. Four implementations of "which authored node is this run node", three of them wrong in
the same way.** `activeSpineNodeId` (`apps/server/src/pack-orchestrator.ts:23-39`),
`spineNodeIdForRunNode` (`apps/server/src/authored-feedback.ts:146-160`) and
`timelineEntries` (`apps/web/src/lib/screen-model.ts:92-117`) each walk the path matching
`moveUci` against spine children and each return `undefined` — permanently, for the rest of
the path — at the first move that does not match. `spineChildren`
(`opponent-selector.ts:337-347`) indexes by `transposeKey` and does not.

The consequence is a live inconsistency, not a tidiness complaint: **a run that leaves the
book and transposes back gets book replies from the opponent while every authored surface
still believes it is off-book.** `atSpineNode` checkpoints do not fire again, the annotation
on the node the opponent is standing on is never revealed, and the timeline shows no marker.
This is the D4 shape (`design/BACKLOG.md:117`) with four copies instead of two, and it is
directly in this RFC's path because "path-relative boundary crossing including
transpositions" is the contract being specified.

**2d. The authored line is in the browser before the learner moves.**
`projectPackDocument` projects the complete spine — every id, UCI and SAN, recursively
(`apps/server/src/pack-registry.ts:44-51`, `:81`) — because the client needs it to ask for a
`theory_strict` reply (`apps/web/src/lib/session-controller.ts:400`). For a *recall* mode
that is the answer key. It also contradicts the standing claim that "`GET /packs/:id` never
contains … other pre-play commentary" (`docs/explanation-grounds.md:92-96`): the authored
moves are the commentary that matters most in an opening pack. §4c closes it.

**2e. `transitioned` is the state whose name means "crossed the boundary", and it stops the
run.** `TERMINAL_OBJECTIVE_STATES` (`packages/runtime/src/runtime.ts:32`) contains
`transitioned`, so `commitMove` throws `RUN_TERMINATED` at a node in that state
(`runtime.ts:277-278`) and the client stops requesting replies
(`apps/web/src/lib/session-controller.ts:61`, `:373`). Grading a book exit as `transitioned`
would end the drill at exactly the moment the design says the drill continues — "continue
past book" (`design/01-training-model.md:97`), "book-boundary crossing, and the first
middlegame-plan fork" (`design/03-product-breadth.md:44-45`). This is D12b's shape in a new
place, and §6 is written so it cannot happen: a `follow_theory` objective may not enter an
absorbing state **at all**, which is a stronger law than Outcome Drill's, for the opposite
reason.

### 3. Scope boundary

**In scope:** what makes a run a Line Drill and what ends one; the authored-boundary
evaluator including transposition and re-entry; the three-verdict membership contract and
its mapping onto the shipped objective states; delivery of verdicts through the shipped
reveal contract; the deviation lint that grading makes load-bearing (D7); the honest
rendering of `theory_strict` against what the run actually records.

**Out of scope,** with reasons:

| Out of scope | Why |
|---|---|
| Grading a move against an engine's best move | `design/01-training-model.md:99` says Outcome Drill is graded on "result preservation, not exact moves", and the whole document is built on episodes rather than single-move correctness; `AGENTS.md` law 8 forbids manufacturing the claim. Nothing here calls an engine to decide a verdict |
| Ranking or scoring the five deviation classes | The class is authored (`schemas/drill_pack.schema.json:534-542`). Turning `concept_violation` into "worse than `interesting_deviation`" is a judgement the author did not write. §6 uses only the author's own `offObjective` boolean (`drill_pack.schema.json:543`) |
| A "theory/idea score" (`design/01-training-model.md:97`) | A score is an aggregation over verdicts, and two of the three verdicts are `unknown`-shaped. Aggregating "the pack has nothing to say" into a number is exactly the dashboard anti-pattern. Deviations-from-design item 1 |
| Intent-relative success for the plan fork | Ledgered separately (`design/BACKLOG.md:140`); needs `checkpoints[].interaction` to have a consumer, which it does not |
| `plan_defense` and the other unimplemented policy modes (D8) | Line Drill needs `theory_strict`, `human_common` and `strong_engine`; all three ship (`apps/server/src/capabilities.ts:10-14`). D8's four undeclared modes are already tested-and-declared by `outcome-drill-grading` §8 (`capabilities.ts:16-28`). Nothing here needs one, so D8 is cited and left alone |
| Persisting which opponent policy actually ran | Refused with its reason in `rfc/archive/outcome-drill-grading.md` §8a; it is a run-schema change and a migration. §8 inherits that refusal verbatim and does not weaken it |
| FEN-anchored deviations as a graded shape | `at: {fen}` is schema-legal (`drill_pack.schema.json:518-525`) and **no pack in the tree uses it** (verified across all eight pack files plus fixtures). Its `note` has no delivery path today (`authored-feedback.ts:128` skips it), so grading it would create graded-but-unexplainable verdicts. §7 forbids it under `follow_theory` and leaves it untouched everywhere else |
| `phase` reaching the pack list (D6) | Line Drill is the opening mode, so phase discovery is adjacent, but `PackSummary` omitting `phase` (`pack-registry.ts:26-34`) is item #1's foundation-edge residual (`design/03-product-breadth.md:202-205`) and belongs there. Note that `projectPackDocument` **does** project `phase` (`pack-registry.ts:68`), so D6 is a list-surface defect, not a wire-projection one |
| D5's release compose light profile | Unrelated to this RFC; cited so it is not rediscovered |

## Specification

### 1. What theory grading is allowed to know

Three facts, all derivable from the pack and the run with no evaluation:

1. **Which authored position, if any, a run node is** — the shared resolver of §3c.
2. **Whether a run node is inside the pack's authored boundary** — §3.
3. **Whether the move played into a node matches an authored `deviations[]` entry anchored
   at its parent position** — §5's single new predicate.

Everything else — "was that a good move", "how far off theory is this", "how much theory do
you know" — is an assessment. This RFC computes none of them. Where the pack has nothing to
say, the product says the pack has nothing to say (§2, §9).

**A `follow_theory` objective has no `objective.grading` and cannot acquire one.** `grading`
carries `assessedBy` — a claim about the *result* at the root — and a theory objective makes
no result claim. `pack-validation.ts:187-195` already raises
`OBJECTIVE_GRADING_UNSUPPORTED` for every non-outcome type, so this is enforced by shipped
code and needs no new rule. That single sentence is the whole of "theory membership is not
WDL", stated where the schema can hold it.

### 2. The three verdicts

For every committed node on a path, `follow_theory` yields exactly one verdict:

| Verdict | Condition | What the product may say |
|---|---|---|
| `on_line` | the node resolves to an authored spine node (§3c) **and** the node is inside the authored boundary (§3) | "on the authored line", plus the authored node id for the timeline |
| `classified_deviation` | the node's move matches an authored `deviations[]` entry anchored at the parent's position (§5) | the author's `class` **verbatim** and, under the reveal contract, the author's `note` |
| `unknown` | neither | "the pack has no statement about this move" — and nothing else |

**`unknown` is first-class and is never a failure.** It never transitions the objective, is
never counted, is never ranked against the other two, and carries a fixed sentence that
cannot be suppressed (§9). A pack's silence about a move is a fact about the pack.

**Precedence when a move is both on the line and in the deviation table.** The schema permits
a `deviations[]` entry whose `moveUci` equals an authored spine child's `moveUci` at the same
anchor, and the tree contains exactly one: the served schema example's only deviation is
`{at: {spineNodeId: "najdorf-e6"}, moveUci: "f1e2"}` (`schemas/drill_pack.example.json:126-131`)
while its spine child `najdorf-be2` is `f1e2` (`drill_pack.example.json:59-64`). The rule is
**`on_line` wins**: the move is on the authored line, and being additionally listed as a
deviation does not remove it from the line. The deviation's `note` still reveals under the
existing contract, which anchors reveal on the spine node rather than on the move being
played (`docs/explanation-grounds.md:121-123`). §7 adds `DEVIATION_SHADOWS_SPINE_MOVE` as a
**warning**, because an error would refuse the served schema example at load.

### 3. The authored boundary, and its first evaluator

```ts
export function insideAuthoredBoundary(
  pack: DrillPackDefinition,
  run: DrillRun,
  node: Node,
): boolean;
```

The root node is always inside; it is the pack's own start position. For every other node:

```text
inside(node) :=
      (plyHorizon === undefined || node.ply <= plyHorizon)          // the cap
  AND ( spineNodeId(node) is an ancestor-or-self of some spineNodeIds entry   // grant A
        OR some fenPredicates entry matches node )                            // grant B
```

`spineNodeId(node)` is §3c's shared resolver. `fenPredicates` entries are evaluated with the
shipped `evaluateObjectivePredicate` under `{type: "fenPredicate", predicate}`
(`packages/runtime/src/objective.ts:221-222`, `:141-163`) — the same translation
`simpleTriggerMatches` already performs for checkpoint triggers
(`apps/server/src/pack-orchestrator.ts:51-56`), so no second predicate vocabulary appears.

**Crossing** is the first committed node on a path for which `inside` is false.

#### 3a. plyHorizon caps, does not grant

This is the salvaged rule from the withdrawn contracts RFC (`design/BACKLOG.md:164`), and it
earns its keep here rather than being restated as a principle. The served schema example
declares `fenPredicates: [{type: "pieceOnSquare", square: "e3", piece: {white, bishop}}]`
(`schemas/drill_pack.example.json:117-122`), which is true for the whole rest of any game in
which White plays Be3. Without the cap that pack's authored support would extend to move 60.
With the cap it ends at ply 4, which is what `plyHorizon: 4` in the same object means and
what the pack's own title — "cross the theory boundary" — says.

The converse case is equally real. A learner who deviates at ply 3, plays an unrelated
opening, and transposes into the authored position `be2` at ply 20 gets grant A from §3c's
position-keyed resolver. The cap is what stops eighteen unsupported plies from being
retroactively re-labelled as authored support. **The cap is the only thing standing between
position-keyed resolution and that outcome, which is why position-keyed resolution is safe.**

Consequences stated so they are not discovered later:

- A boundary with a cap and no grant — `{"plyHorizon": 4}` alone, which
  `authoredBoundary`'s `minProperties: 1` permits (`schemas/drill_pack.schema.json:489-507`)
  — grants nothing to any node, so the boundary is crossed on the first commit. §7 rejects
  it under `follow_theory` as `BOUNDARY_GRANTS_NOTHING`.
- A cap shorter than the shallowest declared boundary node has the same effect by a
  different route. §7 rejects that as `BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT`, computed from
  the spine depths the lint already walks. `plyHorizon: 0` is the degenerate member of that
  family and needs no separate code. Verified: no pack in the tree trips either — every
  pack's boundary ids sit at or above its horizon.
- `plyHorizon` is **required** under `follow_theory` (`BOUNDARY_NEEDS_PLY_HORIZON`), because
  a position-keyed grant with no cap is unbounded in exactly the way above. All four packs
  in the tree that declare a boundary already declare one.

#### 3b. `spineNodeIds` is a frontier, not a membership list

Ruled on the evidence in Motivation §2b: a node is granted support when its authored id is an
**ancestor-or-self** of a declared boundary id. Under this reading the served schema example
grants all five of its spine nodes (be3, e6 and f3 are ancestors of b5 or be2), and the three
draft packs that list every node grant every node. Under the membership reading the served
example is self-contradictory. One reading is coherent across the tree and one is not; that
is the whole argument, and it is a reading of shipped content rather than a preference.

The relation is computed over the **spine tree**, from ids, and is therefore independent of
§3c's position keying. A pack may deliberately leave a sideline outside its frontier; that
sideline is authored but unsupported, its nodes are `unknown` under §2, and nothing warns —
declaring an unsupported sideline is a legitimate authoring choice, not a mistake.

#### 3c. One spine resolver, position-keyed, with re-entry

A new module `packages/runtime/src/line.ts` exports the single implementation. The runtime is
its home because it already depends on `@chess-tabiya/schema` and already imports
`DrillPackDefinition` for the pack PGN exporter (`packages/runtime/src/pack-pgn.ts:1-6`,
`packages/runtime/package.json` dependencies), while the schema package cannot depend on the
runtime without a cycle and does not own `transposeKey` (`packages/runtime/src/chess.ts:16-19`).

```ts
/** transposeKey of every authored position -> the spine node id that reaches it. */
export function spinePositionIndex(pack: DrillPackDefinition): ReadonlyMap<string, string>;

/** The authored node a run node stands on, or undefined. */
export function spineNodeIdFor(index: ReadonlyMap<string, string>, node: Node): string | undefined;
```

`spinePositionIndex` walks the spine from `pack.start.fen` with chessops and keys each
resulting position by `transposeKey` — the same construction as
`addSpinePosition` (`apps/server/src/opponent-selector.ts:321-335`), so the opponent and the
authored surfaces resolve the same positions by the same key. `spineNodeIdFor` is a map
lookup on `node.transposeKey`, which every node already carries
(`packages/runtime/src/types.ts:82`, written at `runtime.ts:325`).

**Collisions.** Two authored nodes may reach one position. The index keeps the **shallowest**
one, tie-broken by document pre-order. §7 adds `SPINE_TRANSPOSITION_COLLISION` as a warning
so the author is told that two authored nodes are the same position; verified across all four
spine-bearing packs, there are currently none, so the warning has zero hits and exists to
catch the next one.

**Re-entry is a real, specified state.** Because resolution is position-keyed, a path may
leave the boundary and come back. When it does:

- the opponent was already playing book there (`spineChildren`, unchanged);
- `atSpineNode` checkpoints for the re-entered node now fire, and its annotation now
  reveals — the four-way inconsistency of Motivation §2c is gone;
- the objective **does not un-resolve**. `preserved` is one-way (§6), so a run that crossed
  the boundary at ply 7 and re-entered at ply 11 stays `preserved` and the membership
  derivation shows the whole shape: three verdicts in, one out, three back in.

**Three call sites are replaced by the one implementation**, and a test asserts they agree:
`activeSpineNodeId` (`pack-orchestrator.ts:23-39`), `spineNodeIdForRunNode`
(`authored-feedback.ts:146-160`) and `timelineEntries` (`screen-model.ts:92-117`) each delete
their walk and call the export. This changes behaviour on exactly one input class —
paths that left the spine and returned — and that change is the point.

### 4. Pack format v0.4

`schemas/drill_pack.schema.json` bumps `$id` to `urn:chess-tabiya:schema:drill-pack:0.4` and
`DRILL_PACK_SCHEMA_VERSION` to `"0.4"` (`packages/schema/src/index.ts:2`, asserted at
`packages/schema/src/drill-pack.test.ts:49-56`). `digestDrillPack` digests the document, not
the schema version (`packages/schema/src/drill-pack/digest.ts:58-66`), so **no pack digest
changes from the bump** and no stored run is orphaned by it.

#### 4a. `objective.type: "follow_theory"`

Added to `OBJECTIVE_TYPES` (`packages/schema/src/drill-pack/types.ts:1-12`) and to the
schema's `objectiveType` enum (`drill_pack.schema.json:121-134`). It requires
`mode: "line"`, an `authoredBoundary`, a `plyHorizon`, and exactly one checkpoint whose
trigger is `atAuthoredBoundary` (§7). It forbids `objective.grading` — already enforced (§1).

`objective.successConditions` stays available and stays a closed union
(`drill_pack.schema.json:212-261`), but **may not target `achieved`, `failed` or
`transitioned`** under `follow_theory` (§6, `THEORY_ABSORBING_UNSUPPORTED`).

**`mode: "line"` does not require `follow_theory`.** The sourcing emitter writes
`mode: "line"` with `objective.type: "play_until_checkpoint"` and no boundary
(`apps/server/src/sourcing/openings.ts:99-113`), and its committed output
(`content/candidates/d35-queen-s-gambit-declined-exchange-variation/pack.json`) must keep
validating byte-for-byte or the ledger's `packDigest` and the deterministic-output rule both
move. That pack is honestly an ungraded Line Drill: an automatically mined line with no
authored deviations and no declared boundary has no theory statements to grade against. The
coupling is therefore one-way, and §7 encodes exactly that direction.

#### 4b. The `atAuthoredBoundary` trigger

`simpleTrigger` (`drill_pack.schema.json:357-391`) gains a fifth member:

```jsonc
{ "atAuthoredBoundary": "crossed" }
```

`"crossed"` is the only value, declared as a one-member enum so a second value is a schema
change rather than a silent widening. It fires on the first committed node of a path for
which §3's `inside` is false, and `orchestratePackMove`'s existing per-path guard
(`reachedOnActivePath`, `apps/server/src/pack-orchestrator.ts:75-88`, used at `:246-253`)
makes it fire at most once per path.

**`"last_supported"` was considered and is refused because it is not decidable when it would
have to fire.** A commit cannot know whether it is the last supported one; that is only known
at the next commit, by which time the checkpoint would fire a ply late and on the wrong node.
An author who wants the end-of-book reveal writes `atSpineNode` on the spine leaf, which
ships today.

Evaluation lives in `simpleTriggerMatches` (`pack-orchestrator.ts:41-61`), which already
receives the pack, so §3's evaluator is reachable without changing any signature.
`checkpointMatches` inherits it for timing windows (`pack-orchestrator.ts:63-73`) with no
further work.

Two consequences on shipped validators, both stated because the second is a silent widening
if it is missed:

- `pack-validation.ts:333-352`'s root check calls `checkpointMatches` against a root run.
  The root is always inside (§3), so `atAuthoredBoundary` never raises
  `CHECKPOINT_TRUE_AT_ROOT`. The degenerate always-fires-at-ply-1 cases are caught earlier
  and more precisely by §3a's two boundary codes.
- **`lintUnreachableAuthoredProse` and `reachableSpineIds` both short-circuit to "everything
  is reachable" the moment any checkpoint is not `atSpineNode`**
  (`packages/schema/src/drill-pack/lint.ts:54-60`,
  `apps/server/src/authored-feedback.ts:91-93`). Adding a boundary checkpoint to a pack would
  therefore silence its `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` warnings by accident. Instead,
  both learn the trigger: a boundary checkpoint contributes **the boundary closure** — every
  spine node that is an ancestor-or-self of a `spineNodeIds` entry — to the reachable set,
  and does not trigger the short-circuit. That is not a widening for convenience; it is the
  truth, because leaving the book always happens after having been in it, so any node inside
  the boundary is on some path that ends at a crossing. This is the mechanism the
  off-spine graceful-degradation row has been waiting for (`design/BACKLOG.md:166`).
  The two implementations are the same algorithm twice, so they move into `line.ts` beside
  the resolver and a test asserts one output.

#### 4c. What `mode: "line"` branches: the recall contract

Two changes, and they are the same change seen from both ends.

**The wire projection stops shipping the authored line.** `projectPackDocument`
(`apps/server/src/pack-registry.ts:58-89`) projects `spine: []` when `raw.mode === "line"`.
The key stays present, so the top-level key-set assertion at
`apps/server/src/drill-client-server.test.ts:137-153` — which runs against the Najdorf
fixture, `mode: "trajectory"` — is unchanged. `timelineEntries` handles an empty spine
already (`screen-model.ts:96`, `:101-104`), so a Line Drill timeline simply carries no
`spineNodeId` markers, which is correct: a live on-book indicator is the answer key in
another form.

**`/select-move` stops accepting a client-supplied spine.** `parseSelectMoveRequest`
(`apps/server/src/opponent-selector.ts:119-171`) drops `policy.spine` from the accepted wire
shape and gains a top-level optional `packId`; the REST handler
(`apps/server/src/rest.ts:544-556`) resolves the spine from `service.pack(packId).document.spine`,
the same lookup `/packs/:id` already performs at `rest.ts:516`. `SelectorPolicy.spine`
(`opponent-selector.ts:48`) stays on the internal type and `#theoryStrict` is untouched. The
client sends `packId: pack.id` for every pack run and no longer reads `pack.spine`
(`apps/web/src/lib/session-controller.ts:400`).

This closes Motivation §2d for `mode: "line"` and, as a free consequence, removes the ability
of any client to hand `theory_strict` a spine the server never validated. Non-line packs keep
projecting their spine — the Najdorf fixture's `spine` is asserted node-by-node at
`drill-client-server.test.ts:163-175` — so the blast radius is Line Drills only.

### 5. Runtime: one new predicate

`ObjectivePredicate` (`packages/runtime/src/objective.ts:60-71`) gains exactly one member:

```ts
| {
    readonly type: "deviationPlayed";
    readonly fromTransposeKey: string;
    readonly moveUci: string;
  }
```

```ts
case "deviationPlayed": {
  if (node.moveUci !== predicate.moveUci || node.parentId === null) return false;
  const parent = run.nodes.find((candidate) => candidate.id === node.parentId);
  return parent?.transposeKey === predicate.fromTransposeKey;
}
```

Three properties, each load-bearing:

- **Edge-triggered by construction.** It reads the active node's own move
  (`objective.ts:201` binds `node` to the active cursor), so it is true on exactly the commit
  that played the move and false on every later commit of that path. It is §3a guard 2 of
  `rfc/archive/outcome-drill-grading.md` obtained for free rather than restated.
- **Path-scoped by construction.** It touches no event log. `outcomeReached` needed explicit
  path scoping because `run.events` is global (`objective.ts:232-240`); this predicate reads
  one node and its parent, both of which are on the path by definition. A sibling branch
  cannot contribute.
- **Transposition-tolerant by construction.** Keying the anchor on the parent's
  `transposeKey` rather than on a spine node id means the same authored deviation is
  recognised however the learner reached the position — which is the same choice
  `spineChildren` already made for the opponent.

The orchestrator compiles one such predicate per qualifying deviation, resolving the anchor
position by walking the spine to the anchor node with §3c's index. No engine, no evaluation;
`docs/branch-runtime.md:117`'s determinism claim stays true.

The membership derivation itself is **not** a predicate and **not** an event:

```ts
export type LineVerdict = "on_line" | "classified_deviation" | "unknown";

export interface LineMembershipEntry {
  readonly nodeId: string;
  readonly ply: number;
  readonly moveUci: string;
  readonly verdict: LineVerdict;
  readonly spineNodeId?: string;    // present iff on_line
  readonly deviationClass?: string; // present iff classified_deviation
  readonly insideBoundary: boolean;
}

export function lineMembership(
  pack: DrillPackDefinition,
  run: DrillRun,
  nodeId: string,
): readonly LineMembershipEntry[];
```

It walks `historyFrom(run, nodeId)` (`packages/runtime/src/runtime.ts:471-479`) and is a
derived read-back shape exactly like `OpponentMoveReadback`
(`packages/runtime/src/replay.ts:21-28`) — computed from what is stored, never stored. That
is what makes §11 true.

### 6. Grading: what reaches the objective, and what may not

**Only two of the three verdicts touch the objective state machine, and neither of them is a
result.**

`objectiveRules(pack)` (`apps/server/src/pack-orchestrator.ts:169-237`) gains a
`follow_theory` branch. `evaluateObjective` takes the first rule whose `from` matches and
whose predicate holds and performs at most one transition per commit
(`packages/runtime/src/objective.ts:301-316`), so rule order **is** the precedence rule:

| # | `when` | `from` | `to` |
|---|---|---|---|
| 1 | `deviationPlayed(anchorKey, moveUci)` — one rule per `deviations[]` entry with `offObjective: true`, in authored order | active, preserved | `degraded` |
| 2 | `checkpointReachedHere(<the atAuthoredBoundary checkpoint>)` | **active** | `preserved` |
| 3 | authored `successConditions`, compiled by the shipped `conditionRules` (`pack-orchestrator.ts:143-167`) | per §5 of the outcome RFC | per §5 |

**The severity comes from the author's own `offObjective` flag, never from the class.**
`offObjective` is already in the schema (`drill_pack.schema.json:543`) and already reaches
the authored-feedback projection (`authored-feedback.ts:138-140`). Across the tree it is set
on 1 of anti-caro's 5 deviations, 2 of carlsbad's 10 and 2 of rook-4v3's 12 — authors are
already using it to mean exactly this, and mapping `concept_violation` to a grade instead
would be this RFC inventing a ranking the author declined to write.

**Degradation wins over resolution on the same commit**, by rule order, and this case is
common rather than exotic: an `offObjective` deviation is simultaneously a boundary crossing,
because leaving the authored line leaves the boundary. The commit grades `active → degraded`;
the boundary checkpoint occurrence is still emitted and still reveals, because reveal keys off
`checkpoint.reached` (`apps/web/src/lib/session-controller.ts:418-428`) and not off a
transition. The learner sees "you are past the authored line" and "the author marked that
move off-objective" as two sentences, because they are two facts.

#### 6a. Where the monotone law applies, and where it is replaced by a stronger one

**Reused verbatim from `rfc/archive/outcome-drill-grading.md` §3a:** degradation is one-way
within a path. The compiler emits no `degraded → preserved` and no `* → active` rule; the
closed `to` enum (`drill_pack.schema.json:203`) makes `active` unauthorable, and
`OBJECTIVE_DEGRADED_IS_ONE_WAY` already rejects the authored form
(`pack-validation.ts:263-275`) — but only for outcome objectives, so §7 widens its scope to
`follow_theory`. The reachable per-path graph is `active → preserved → degraded` with every
edge forward-only, at most two transitions per path, and no verdict that depends on move
parity.

**Replaced by something stricter:** Outcome Drill's law is *a state that stops play may only
be entered where play has already stopped* (its §3, `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME`).
For `follow_theory` the law is **no state that stops play may be entered at all.** There is
no result to absorb into: a theory objective makes no claim about the game's outcome, and
"you followed the book and then got checkmated" is two facts, not one grade. `achieved`,
`failed` and `transitioned` are unauthorable under `follow_theory` and unemitted by the
compiler (`THEORY_ABSORBING_UNSUPPORTED`).

That is also the direct answer to Motivation §2e. The state named `transitioned` will not be
used for the transition this mode is about, precisely because it stops the run and this mode
is defined by continuing.

**A `follow_theory` run therefore has no automatic end.** Its *resolution* is the boundary
crossing, after which play continues into the middlegame — which is the mode's design point,
not a gap. A run ends when the learner stops or when the laws of chess end the game
(`outcome.reached`, then `RUN_TERMINATED` on the next commit, `runtime.ts:277-278`). A run
that simply stops is not graded: the objective state of the last node on the path is the
answer, `active` included, and `RunSummary.objectiveState` (`apps/server/src/storage.ts:51-62`)
already carries it into history. `active` renders "unresolved" through the shipped
`objectiveGradeSentence` (`apps/web/src/lib/outcome-presentation.ts:83-90`).

**Rewind un-resolves, per path,** by the mechanism the outcome RFC already documents:
objective state lives on nodes (`runtime.ts:332`), checkpoint re-firing is path-scoped
(`pack-orchestrator.ts:75-88`), so a fork below the crossing node crosses again on its own and
a later degradation never rewrites the `preserved` recorded upstream. This is what makes
"leave the book a second way and compare" mean anything.

#### 6b. Evidence references

Every objective transition requires at least one non-empty reference
(`packages/runtime/src/objective-state.ts:47-49`) and every reference must render
(`apps/web/src/lib/screen-model.ts:200-211`).

- Rule 2's reference is `pack:<boundaryCheckpointId>` via the shipped `packEvidenceRef`
  (`packages/runtime/src/evidence-ref.ts:35-37`), which the shipped renderer turns into the
  checkpoint's authored label (`apps/web/src/lib/evidence-sentences.ts:47-58`). No new
  vocabulary.
- Rule 1 needs a reference that is not a checkpoint id. It may **not** be
  `pack:deviation-<n>`: the salvaged rule "`pack:` must split per id space"
  (`design/BACKLOG.md:164`) applies exactly here, and a checkpoint may legally be named
  `deviation-3`. A prefix scheme inside `pack:` would invalidate every persisted reference.
  So a fourth namespace is added beside `rules:`, `pack:` and `engine:`:

```ts
export const THEORY_EVIDENCE_FACTS = Object.freeze(["off-objective-deviation"] as const);
export type TheoryEvidenceFact = (typeof THEORY_EVIDENCE_FACTS)[number];
export function theoryEvidenceRef(fact: TheoryEvidenceFact): `theory:${TheoryEvidenceFact}`;
```

  `THEORY_SENTENCES` is typed `Record<TheoryEvidenceFact, string>` beside `RULES_SENTENCES`
  (`evidence-sentences.ts:19-29`), so TypeScript forces the sentence to exist — the anti-D4
  property the outcome RFC relied on for its three `rules:` additions. The sentence is
  **"The pack's author marked this move as off-objective."** with `sourceLabel: "Pack"`; the
  existing `sourceLabel` union (`evidence-sentences.ts:15`) is unchanged.

  The reference does not name *which* deviation, deliberately: `objective.state_changed`
  already carries the `nodeId` (`packages/runtime/src/events.ts:122-143`) and the node
  identifies the move, so naming it in the reference would put an unbounded id space into a
  closed vocabulary for no fact gained. That is the same argument that kept
  `rules_fact: draw` out of v0.3 (`rfc/archive/outcome-drill-grading.md` §5).

  `renderEvidenceRef` currently falls through unknown references to the bare
  `"Evidence recorded."` (`evidence-sentences.ts:102-106`), which is non-empty and therefore
  would *not* trip `whyBanner`'s bare-render guard (`screen-model.ts:209-211`). A silent
  useless sentence is the failure this addition prevents, and a test asserts the
  `theory:` reference renders its own sentence rather than the fallback.

`drill_run.schema.json:78-81` types `evidenceRefs` items as plain non-empty strings, so
`theory:off-objective-deviation` needs no run-schema change (§11).

### 7. Validation, and D7 closed

#### 7a. Mode, type and boundary — new `runtimeIssues` codes

All `severity: "error"`, all in `apps/server/src/pack-validation.ts:81-362`, all
cross-field rules the JSON Schema cannot express. The layering rule of
`rfc/archive/outcome-drill-grading.md` §5 is kept: `validatePackDocument` returns on the
first schema failure and never reaches the runtime checks
(`pack-validation.ts:365-373`), so no rule is stated twice.

| Code | Rule |
|---|---|
| `THEORY_OBJECTIVE_NEEDS_LINE_MODE` | `objective.type: "follow_theory"` with `mode !== "line"` |
| `THEORY_NEEDS_AUTHORED_BOUNDARY` | `follow_theory` without `authoredBoundary` |
| `BOUNDARY_NEEDS_PLY_HORIZON` | `follow_theory` whose `authoredBoundary` omits `plyHorizon` (§3a) |
| `BOUNDARY_GRANTS_NOTHING` | `follow_theory` whose `authoredBoundary` has neither `spineNodeIds` nor `fenPredicates` (§3a) |
| `BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT` | `follow_theory` with no `fenPredicates` and every `spineNodeIds` entry deeper than `plyHorizon` — the boundary is crossed on the first commit regardless of play (§3a) |
| `THEORY_NEEDS_BOUNDARY_CHECKPOINT` | `follow_theory` without exactly one `atAuthoredBoundary` checkpoint. Zero means the objective can never resolve; two means two resolutions and an ambiguous rule 2 |
| `CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY` | an `atAuthoredBoundary` trigger in a pack with no `authoredBoundary`, at any objective type |
| `THEORY_ABSORBING_UNSUPPORTED` | a `successConditions` entry under `follow_theory` whose `to` is `achieved`, `failed` or `transitioned` (§6a) |

`OBJECTIVE_DEGRADED_IS_ONE_WAY` and `OBJECTIVE_SELF_TRANSITION` (`pack-validation.ts:227-236`,
`:263-275`) apply unchanged; the first has its `outcomeObjective` guard widened to include
`follow_theory`, which is a one-token change to a shipped condition and is asserted by test
because widening a guard silently is how the divergence class this repo tracks begins.

#### 7b. D7 — deviations become grading inputs, so they get linted

`design/BACKLOG.md:129` records the defect: "**no lint checks that a deviation's `moveUci` is
even legal in its anchor position, or that it belongs to the side to move**. An author can
ship an illegal deviation, or one for the wrong colour, and `pack-check` passes." Verified
today: `lintDrillPack` checks only that the anchor id exists
(`packages/schema/src/drill-pack/lint.ts:248-257`), and the reveal-reachability warning
covers only notes and only when every checkpoint is `atSpineNode` (`lint.ts:54-60`, `:88-96`).

The checks belong in `lint.ts` because it already walks the spine with chessops and already
holds each anchor's position mid-walk (`lint.ts:124-166`); the walk is extended to record the
position after each node so the deviation pass can reuse it, rather than replaying the spine
a second time.

| Code | Severity | Rule |
|---|---|---|
| `DEVIATION_WRONG_SIDE` | error | the deviation's from-square holds a piece whose colour is not the side to move in the anchor position |
| `ILLEGAL_DEVIATION_MOVE` | error | the move is not legal in the anchor position for any other reason |
| `DUPLICATE_DEVIATION` | error | two entries share an anchor and a `moveUci`. The schema permits it (`drill_pack.schema.json:58-61`, an array with no uniqueness constraint) and it was harmless while deviations were prose; with §2's verdicts it means one move has two classes |
| `DEVIATION_SHADOWS_SPINE_MOVE` | warning | the `moveUci` equals an authored child of the anchor node (§2's precedence rule) |
| `SPINE_TRANSPOSITION_COLLISION` | warning | two authored nodes reach one position (§3c) |
| `THEORY_DEVIATION_NEEDS_SPINE_ANCHOR` | error, runtime | under `follow_theory`, a deviation anchored by `at: {fen}`. Scope boundary table |

**Wrong side is reported separately from illegality on purpose, and the distinction is not
invented here.** chessops' `isLegal` rejects both, so a single legality check would report an
author's colour mistake as "illegal move" — the least useful possible message for the most
likely possible mistake. `commitMove` already makes exactly this distinction, testing
`position.board.getColor(move.from)` against `position.turn` before calling `isLegal`
(`packages/runtime/src/runtime.ts:283-287`), and the lint reuses that ordering rather than
inventing a second one.

**Blast radius, verified by executing the checks against every pack and fixture in the
tree:** all 28 deviations across the four spine-bearing packs are legal and on the side to
move, there are no duplicates, and there are no spine transposition collisions. The one hit
is `DEVIATION_SHADOWS_SPINE_MOVE` on the served schema example's single deviation
(`schemas/drill_pack.example.json:126-131` against `:59-64`), which is why that code is a
warning. The error codes therefore need negative fixtures rather than existing content, and
criterion 8 supplies four.

D7's remaining half — reveal reachability for deviation notes — is closed by §4b: the
short-circuit that suppressed the warning for any non-`atSpineNode` checkpoint now
contributes the boundary closure instead, so a boundary checkpoint no longer blinds the
warning it was going to blind.

### 8. Requested resistance, recorded engine, and the fallback nobody can hear

This section inherits `rfc/archive/outcome-drill-grading.md` §8a in full and adds one fact
that only Line Drill makes urgent. Nothing here weakens it and nothing here is new honesty
machinery.

**The two facts remain two facts.** `run.opponentPolicy` (`packages/runtime/src/types.ts:225`,
copied from the pack at `apps/server/src/service.ts:187-196`) is a **request**, recorded once.
`opponent.move_selected.selection.engine` (`types.ts:63-69`) is the **engine** that produced
each reply. `resistanceOnPath` derives the second from the committed-child pairing
(`packages/runtime/src/replay.ts:94-122`) and `resistanceSentences` renders both plus the
fixed disclaimer "The run records which engine played, not which policy it applied…"
(`apps/web/src/lib/outcome-presentation.ts:60-81`). Line Drill reuses that function
unchanged.

**The `theory_strict` fallback is audible only to the server's stdout.** `#theoryStrict`
calls `console.warn("DEGRADED_THEORY_SPINE: position is off the authored spine; falling back
to human_common")` and then returns `#humanCommon(request)`
(`apps/server/src/opponent-selector.ts:453-460`), asserted at
`apps/server/src/opponent-selector.test.ts:341-345`. That warning was made audible by
`rfc/archive/pack-optional-runs.md` §5 for pack runs, and "audible" means exactly one thing:
a line in the server log. **It reaches no event, no run, no response and no screen**, and the
fallback re-enters the same `#maia` call against the same `maiaEngineId`
(`opponent-selector.ts:428-435`), so both policies stamp an identical engine identity and no
reader of the log can tell them apart. This RFC states that and does not guess.

**One Line-Drill-specific rule is added, and it is a claim about the pack, not about what
ran.** Whenever the pack's requested mode is `theory_strict`, the resistance line carries:

> "`theory_strict` has authored replies only inside this pack's spine. Past that, the run
> records which engine replied and not which policy chose the move."

Both halves are verifiable without inference: the first from `spineChildren`
(`opponent-selector.ts:337-347`), the second from §8a. The sentence deliberately does **not**
say the fallback fired, because two independent conditions govern that and they are not the
same condition:

- `plyHorizon` caps **authored support** and the selector has never heard of it
  (`grep -rn plyHorizon apps/server/src` returns nothing);
- `spineChildren` governs **authored replies** and depends only on whether the position is in
  the spine index.

So a pack whose horizon is shorter than its spine depth is past its authored boundary while
the opponent is still playing book, and a pack that transposes back in is inside the spine
index again. Claiming "you faced `human_common` from ply 15" would be false in the first case
and unprovable in both. **The product knows where its own authored support ends. It does not
know which policy produced any move, and that has not changed.**

**The resistance line is ungated for Line Drill.** Today the whole outcome-context block is
rendered only when `objective.grading` exists (`apps/web/src/lib/DrillScreen.svelte:136-142`,
`:431-433`), and `follow_theory` has no `grading` by §1. `OutcomeContext`'s `assessment` prop
becomes optional (`apps/web/src/lib/OutcomeContext.svelte:1-17`) and Line Drill renders
resistance and grade with no assessment line, because there is no root assessment to make.

D10 is cited rather than fixed: both shipped Stockfish specs report `version: "unknown"`
(`design/BACKLOG.md:126`, `apps/server/src/engine-supervisor.ts:111-126`), so a
`strong_engine` Line Drill's resistance line reads `v unknown`. That is honest — it is what
is recorded — and fixing it is an engine-provenance change with its own blast radius.

### 9. What a Line Drill reveals, and when

**Verdicts are authored content and are withheld exactly like authored prose.** `on_line`
and `classified_deviation` disclose the book directly; `unknown` discloses that the book does
*not* cover a move, which is the same information negated. All three ride the shipped
run-scoped surface and none of them creates a second barrier.

`AuthoredFeedbackItem` (`apps/server/src/authored-feedback.ts:24-48`) gains a fourth kind:

```ts
| {
    readonly kind: "theory_verdict";
    readonly id: string;                 // `theory#<runNodeId>`
    readonly revealedBy: RevealAttribution;
    readonly anchor: { readonly nodeId: string; readonly ply: number; readonly moveUci: string };
    readonly verdict: "on_line" | "classified_deviation" | "unknown";
    readonly spineNodeId?: string;
    readonly deviationClass?: string;
  }
```

Delivery reuses the shipped machinery with no new gate. `projectAuthoredFeedback` already
computes, for each reveal occurrence, the occurrence's actual root-to-node path
(`authored-feedback.ts:268-276`); `lineMembership` is evaluated over that same path and its
entries are emitted with that occurrence's attribution. The reveal occurrences are unchanged:
`checkpoint.reached` under `delayed_checkpoint`, `segment.completed` under `segment_end`, and
`outcome.reached` under both (`authored-feedback.ts:162-219`,
`docs/explanation-grounds.md:98-109`). Rewinds do not un-reveal, because they do not delete
events.

**Verdicts are excluded from `hasWithheldAuthoredContent`.** That flag counts supported items
some checkpoint can deliver (`authored-feedback.ts:332`); verdicts are one per played ply and
unbounded, so counting them would pin the flag to `true` forever and turn the client's
"Authored commentary withheld until checkpoints" status
(`apps/web/src/lib/DrillScreen.svelte:411`) into a constant. Criterion 10 asserts it.

Rendering, and the sentences that may not be changed:

1. **`on_line`** — "Ply {n}, {SAN}: on the authored line." Nothing more. It does not say
   "correct".
2. **`classified_deviation`** — "Ply {n}, {SAN}: the pack classifies this as
   `{class}`." The class string is the author's, printed verbatim and never translated into
   a severity word. The author's `note` is not repeated here; it arrives as the existing
   `deviation` item under the existing contract.
3. **`unknown`** — "Ply {n}, {SAN}: this pack has no statement about this move." Whenever at
   least one `unknown` appears on a page, this sentence is printed once, verbatim, and
   cannot be suppressed:

   > "Unknown is not a judgement. The author wrote nothing about this move, and nothing here
   > says it was good or bad."

   The `unknown` presentation is asserted by test to contain none of `mistake`, `wrong`,
   `inaccuracy`, `blunder`, `best`, `engine`, `correct`. That list is the mechanical form of
   `AGENTS.md` law 8 for this surface, and it is written as a forbidden-strings assertion for
   the same reason the outcome RFC wrote one: a rendering law with no test is a comment.

Surfaces, all shipped and only extended: `CheckpointSheet`
(`apps/web/src/lib/CheckpointSheet.svelte:47-65`) and `TerminalSheet`
(`apps/web/src/lib/TerminalSheet.svelte:38-51`) render the new item kind in their existing
authored-commentary lists; `DrillScreen`'s timeline marker derivation
(`apps/web/src/lib/DrillScreen.svelte:107-113`) gains the verdicts' node ids, so a revealed
verdict marks its ply and an unrevealed one marks nothing.

**Nothing is added to `GET /packs/:id`.** No verdict, no deviation, no boundary. The
projection loses a field for Line Drills (§4c) and gains none.

### 10. Pack A becomes the fixture

`content/drafts/anti-caro-advance.json` is a `phase: "opening"` pack with a ten-node spine, a
declared boundary, five deviations across three classes and one `offObjective` flag. It was
labelled `mode: "plan"` because `mode` had no consumer. Changes are mechanical and make **no
new chess claim**:

- `version` `0.1.0` → `0.2.0`.
- `mode` `"plan"` → `"line"`.
- `objective.type` `"preserve_plan_window"` → `"follow_theory"`. **This is inert today.**
  The pack declares no `successConditions` (`anti-caro-advance.json:23-26`), and
  `objectiveRules` returns `[]` for a non-outcome objective with no conditions
  (`apps/server/src/pack-orchestrator.ts:172-181`), so the pack has never emitted a single
  objective transition and its type has never been read by anything. `objective.summary` is
  unchanged, and it already describes a theory-following drill.
- One checkpoint is appended:

```jsonc
{
  "id": "past-the-book",
  "label": "Past the pack's authored line",
  "trigger": { "atAuthoredBoundary": "crossed" },
  "actions": ["compare_branches"]
}
```

  The label is prose about the mechanism, not about chess — the same class of edit as the
  `still-holding` relabel in `rfc/archive/outcome-drill-grading.md` §11.

- `planClasses` and the `intent_capture` interaction on `plan-commitment`
  (`anti-caro-advance.json:155-162`) are **kept**. A plan fork at the end of the book is what
  `design/03-product-breadth.md:44-45` says a Line Drill ends with, so they belong to this
  mode rather than contradicting it.
- The spine, every annotation, all five deviations, both `feedbackClaims`, the concepts, the
  provenance block and its three graduation blockers are untouched. `reviewStatus` stays
  `draft`. No engine pass has been run and this RFC does not pretend otherwise.
- `opponentPolicy` stays `human_common` at Elo 1800 with `seedMode: "per_branch"`. Switching
  it to `theory_strict` would make browser assertions easier and is refused for the reason
  the outcome RFC gave: which resistance an opening drill faces is an authoring decision with
  chess content in it. It happens to be deterministic under `ENGINE_MODE=mock`, whose client
  hard-codes replies for this pack's start FEN
  (`apps/server/src/application.ts:146-151`) — that is a property of the test harness, not of
  the pack, and criterion 15 says so rather than relying on it silently.

**Editing the pack changes its digest**, and `#registeredPack` returns `undefined` when a
stored run's `packDigest` no longer matches (`apps/server/src/service.ts:621-625`). Drafts
load only in development (`apps/server/src/pack-registry.ts:237-250`), so the affected
population is developer test runs. Stated rather than migrated, consistent with
`rfc/archive/terminal-outcome-events.md` §5 and `outcome-drill-grading` §11.

**What Pack A cannot test, and what covers it.** Pack A's boundary crossing can only be
reached by leaving the ten-node spine, and its `plyHorizon: 14` exceeds its spine depth of 6,
so the cap never binds. A mechanical fixture
`content/drafts/line-boundary.browser.json` supplies the cases Pack A structurally cannot:
`theory_strict` at `seedMode: "fixed"` for determinism, the learner to move at the root so
the pre-play state is reachable in the browser, a `plyHorizon` shorter than its spine so a
capped crossing occurs **while still on the authored line**, a spine that transposes so
re-entry is exercised, and one `offObjective` deviation. It carries a `graduationBlockers`
entry saying it is a test fixture and makes no chess claim beyond move legality, as
`schemas/fixtures/drill-pack/terminal-outcome.browser.json` already does.

No Playwright configuration change is needed: `NODE_ENV=development` loads every non-sidecar
`.json` in `content/drafts/` (`apps/server/src/pack-registry.ts:237-250`,
`playwright.config.ts` webServer command), and `DRAFT_PACK_FILE` adds a file on top of that
directory rather than replacing it.

### 11. No migration

No persisted run shape changes. No event type is added — verdicts are derived
(`lineMembership`, §5), exactly as `resistanceOnPath` is
(`packages/runtime/src/replay.ts:94-122`). The one new predicate is a compiled rule input,
not a stored value. `objective.state_changed` already carries `evidenceRefs` as plain
non-empty strings (`schemas/drill_run.schema.json:78-81`, `:418-433`), so
`theory:off-objective-deviation` needs no schema change.

`DRILL_RUN_SCHEMA_VERSION` stays `"0.6"` (`packages/schema/src/index.ts:1`) and this RFC
claims **no row in the migration register**. The pack-schema bump to 0.4 is not a persisted
shape: pack digests are content digests, unaffected by the `$id`
(`packages/schema/src/drill-pack/digest.ts:58-66`).

Two additions deserve explicit clearing because both look persisted and neither is.
`AuthoredFeedbackItem`'s fourth kind (§9) is a field of a **response projection** computed
per request from the run and the pack, and `GET /runs/:id/authored-feedback` has no stored
shape. `packId` on `/select-move` (§4c) is a request field on a stateless endpoint that
writes nothing (`apps/server/src/rest.ts:544-556`).

## Deviations from design

1. **`design/01-training-model.md:97` says Line Drill is graded on "structure reached,
   theory/idea score".** This RFC ships no score. Two of the three verdicts are `on_line`
   and `unknown`, and averaging a pack's silence into a number would manufacture the
   judgement law 8 forbids. It ships the verdicts, delivered per ply, and leaves aggregation
   to a later RFC with a real consumer. "Structure reached" is expressible today as a
   `fenPredicate` checkpoint and needs nothing from this RFC.
2. **`design/03-product-breadth.md:44` names "recognition" as part of Line Drill.**
   Automatic phase/structure recognition is exploration Q4c and item #3's territory
   (`design/BACKLOG.md:30`). This RFC's recognition is authored: the pack says where its line
   is, and the runtime resolves position identity against it. Nothing is inferred.
3. **`design/03-product-breadth.md:44-45` names "rating-level deviations".** The schema has
   no rating dimension on a deviation, and `difficulty.minOnlineRapid`/`maxOnlineRapid` are
   pack-level (`schemas/drill_pack.schema.json:94-107`). This RFC classifies deviations
   without rating them by level, which is narrower than the design. Adding a level to a
   deviation is a BACKLOG row to propose, with a real authored consumer.
4. **The compiled state machine is narrower than the runtime's, in the opposite direction
   from Outcome Drill's.** `ALLOWED_TRANSITIONS` permits every non-terminal state to reach
   `achieved`, `failed` and `transitioned` (`packages/runtime/src/objective-state.ts:3-10`);
   §6a forbids all three for `follow_theory`. The runtime table is left alone because it
   serves nine other objective types and `applyObjectiveEvidenceProposal`
   (`objective.ts:273-299`).
5. **The `authoredBoundary` semantics are ruled, not designed.** `design/` describes a
   book boundary but never says whether `spineNodeIds` is a frontier or an interior list.
   §3b rules for the frontier on the evidence of the four packs that use the field. If the
   owner intends the other reading, the served schema example needs an authoring fix and this
   RFC needs a revision — recording the ruling in `design/` is a BACKLOG row for the
   implementer to **propose**, never to write (`AGENTS.md` law 5).
6. **D7 is a ledgered defect** (`design/BACKLOG.md:129`), specified and closed here. Marking
   that row closed, and adding the rows this RFC asks for — a rating dimension on deviations
   (item 3), a theory/idea aggregate with a named consumer (item 1), the `authoredBoundary`
   semantics ruling (item 5), and the fact that `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` and
   `reachableSpineIds` were two copies of one algorithm (§4b) — are `design/` edits: the
   implementer **proposes them as BACKLOG rows** and does not write them.

## Acceptance criteria

1. **The three verdicts, table-driven.** For a fixture with a two-branch spine, one
   `accepted_alternative` deviation, one `offObjective` `concept_violation`, and a
   `plyHorizon`, `lineMembership` returns the exact verdict, `spineNodeId`,
   `deviationClass` and `insideBoundary` for every ply of: the full authored line; a
   classified deviation at ply 3; an unclassified move at ply 3; and a move past the horizon
   while still on the spine. The fourth case asserts `verdict: "on_line"` is **not**
   returned once the cap binds — the mechanical form of "plyHorizon caps".
2. **The boundary evaluator, against every shipped pack.** A test loads all four
   spine-bearing packs (`schemas/drill_pack.example.json` and the three drafts), walks each
   authored path, and asserts every authored node inside its own declared boundary — which
   holds only under §3b's frontier reading. The same test asserts, against the schema
   example specifically, that the membership reading of `spineNodeIds` would place
   `najdorf-be3` outside while `najdorf-b5` is inside, and states in a comment that this is
   the contradiction §3b exists to resolve.
3. **Transposition and re-entry.** On a fixture whose spine can be reached by two move
   orders: a run that plays the transposed order resolves the same spine node ids, fires the
   same `atSpineNode` checkpoints, and reveals the same annotations as the main order. A
   second run leaves the boundary at ply 5, transposes back at ply 9, and asserts (a) the
   ply-9 verdict is `on_line`, (b) the `atSpineNode` checkpoint for that node fires, (c) the
   objective is still `preserved` and does **not** return to `active`, and (d) the
   `atAuthoredBoundary` checkpoint does not fire a second time. Written as the regression for
   Motivation §2c, with a comment naming the prefix-strict walk it replaces so it cannot be
   "simplified" back into the bug.
4. **One resolver, three call sites.** A test drives a path that leaves and re-enters the
   spine and asserts that the orchestrator's spine id, the authored-feedback projection's
   spine id, and `timelineEntries`' `spineNodeId` are equal at every node; and a second test
   asserts the same for the boundary-closure reachability used by `lintDrillPack` and
   `reachableSpineIds`. Two implementations of one vocabulary is the D4 shape and is being
   removed, not reintroduced.
5. **Grading reaches exactly two states, and never an absorbing one.** Table-driven over a
   `follow_theory` fixture: the authored line to the crossing grades `active → preserved`
   once and never again; an `offObjective` deviation grades `active → degraded`; the two on
   the same commit grade `degraded` **and** still emit the `checkpoint.reached` occurrence;
   a run that then reaches checkmate emits `outcome.reached` and the objective state is
   **unchanged** — no `achieved`, no `failed`. Asserted on the node states, and asserted
   identical whether the crossing happens on an odd or an even ply.
6. **The run is not frozen by its own grade.** After the boundary crossing, one further move
   commits. The regression for Motivation §2e, asserted at the runtime and again in the
   browser (criterion 14), because `TERMINAL_OBJECTIVE_STATES` is what made D12b invisible at
   the endpoint.
7. **Load-time refusals.** Each of §7a's eight codes has a fixture that fails
   `validatePackDocument` with that exact code, and `make pack-check FILE=<fixture>` **exits
   non-zero** for each, asserted on the process exit code rather than the issue list.
   Includes `{"plyHorizon": 0}` alone, `{"plyHorizon": 2}` with every boundary node at depth
   3+, two `atAuthoredBoundary` checkpoints, `follow_theory` at `mode: "plan"`, and a
   `follow_theory` `successConditions` entry with `to: "achieved"`.
8. **D7.** Four negative fixtures — an illegal deviation, a wrong-colour deviation, two
   deviations sharing an anchor and move, and a `follow_theory` pack with a FEN-anchored
   deviation — each fail with their own code and fail `pack-check` on the exit code. A
   positive control asserts that all 28 deviations across the four shipped spine-bearing
   packs pass every new error check, so D7's closure refuses nothing that exists today; and
   a further assertion pins `DEVIATION_SHADOWS_SPINE_MOVE` as a **warning** on
   `schemas/drill_pack.example.json` and asserts the served registry still loads it.
   The wrong-colour case asserts the code is `DEVIATION_WRONG_SIDE` and **not**
   `ILLEGAL_DEVIATION_MOVE`, because the whole point of the distinction is the message.
9. **`mode: "line"` withholds the authored line.** `GET /packs/:id` for Pack A v0.2.0 returns
   `spine: []`; for the Najdorf fixture it returns the full spine unchanged, with the existing
   node-by-node assertion at `apps/server/src/drill-client-server.test.ts:163-175` passing
   untouched; and the top-level key set is unchanged for both. A second test asserts
   `POST /select-move` with a `spine` in the body is rejected as an unknown field, and that
   the same request with `packId` returns a spine-restricted `theory_strict` selection
   identical to the one the pre-change client obtained by sending the spine itself.
10. **Verdict delivery obeys the shipped reveal contract.** Before any reveal occurrence,
    `GET /runs/:id/authored-feedback` contains no `theory_verdict` item. After a checkpoint,
    it contains one verdict per ply on that occurrence's root-to-node path and none from a
    sibling branch. After a rewind, previously revealed verdicts remain. And
    `hasWithheldAuthoredContent` is asserted **false** on a run whose prose is fully revealed
    but whose plies continue, proving verdicts are excluded from the count.
11. **The honesty strings.** A component test asserts the `unknown` presentation contains the
    "Unknown is not a judgement" sentence verbatim and contains none of `mistake`, `wrong`,
    `inaccuracy`, `blunder`, `best`, `engine`, `correct`; that a `classified_deviation`
    renders the author's class string verbatim and adds no severity word; that a
    `theory_strict` pack renders the §8 sentence about authored replies; and that
    `theory:off-objective-deviation` renders its own sentence rather than
    `renderEvidenceRef`'s `"Evidence recorded."` fallback (`evidence-sentences.ts:102-106`).
12. **No policy claim is manufactured.** With `ENGINE_MODE=mock`, a `theory_strict`
    `follow_theory` pack driven past its authored boundary renders the request and the mock
    engine identity as two separate facts, carries the §8a rule 5 disclaimer verbatim, and
    contains no sentence asserting that `human_common` produced any move — asserted as a
    forbidden substring. The direct inheritance of `outcome-drill-grading` criterion 11b.
13. **Existing packs and runs are unaffected.** Every pack file in the repo — the schema
    example, the five drafts and the four candidates — loads and validates under v0.4,
    asserted by a test that walks the tree. `content/candidates/d35-queen-s-gambit-declined-exchange-variation/pack.json`
    is asserted byte-identical after re-running its emitter, and
    `make sourcing-check DIR=content/candidates/d35-queen-s-gambit-declined-exchange-variation`
    still passes, so `mode: "line"` without `follow_theory` costs the pipeline nothing. The
    browser assertion `active → achieved` (`tests/browser/drill.spec.ts:148`) still passes,
    and both existing Pack A browser tests (`drill.spec.ts:312-339`, `:341-373`) pass with
    their current assertions unchanged.
14. **Browser test — the crossing reaches the screen, and the drill continues.**
    `content/drafts/line-boundary.browser.json` is played in Playwright. Asserted before the
    first move: the resistance line states the request, says no opponent move has been
    played, and names no engine. Asserted at the capped crossing — which happens **while the
    move is still on the authored line**, so the fixture proves the cap and not merely
    "you left the book": the checkpoint sheet shows the boundary checkpoint's label; the
    revealed verdicts show `on_line` for the earlier plies; and after pressing Continue the
    learner **makes one further move that commits**. Then an unclassified move is played and,
    at the next reveal, the `unknown` verdict and the "Unknown is not a judgement" sentence
    are both visible, and none of the forbidden strings appear anywhere on the page.
15. **Browser test — Pack A on the screen.** Pack A v0.2.0 is opened from `content/drafts/`
    in development. Asserted: `GET /packs/anti-caro-advance-c5-race` from the page's own
    request context returns `spine: []`, so the authored line is not in the browser; the two
    existing assertions at `drill.spec.ts:328-338` still hold at `plan-commitment`; then,
    after Continue, the mock plays `c6c5` and the learner plays `e1g1` — the pack's single
    `offObjective` `concept_violation` (`anti-caro-advance.json:238-246`) — and the objective
    rail shows `degraded`, the `past-the-book` checkpoint renders its label, and the revealed
    verdict names the class `concept_violation` verbatim with the author's note beside it.
    The test states in a comment that this move sequence is deterministic only because
    `MockEngineClient` hard-codes replies for this pack's start FEN
    (`apps/server/src/application.ts:146-151`), so a future engine change fails it loudly
    rather than flakily.
16. **No migration.** A test asserts `DRILL_RUN_SCHEMA_VERSION === "0.6"`,
    `DRILL_PACK_SCHEMA_VERSION === "0.4"`, that a run stored before this change replays
    unchanged, and that `rfc/README.md`'s migration register gains no row.
17. `ENGINES_REQUIRED=1 make verify` green; `make test-browser` green with `retries` still
    unset (`playwright.config.ts`), run three consecutive times;
    `make pack-check FILE=content/drafts/anti-caro-advance.json` green.
18. **Docs.** `docs/drill-pack-format.md` documents v0.4, `follow_theory`, the
    `atAuthoredBoundary` trigger, the authored-boundary evaluator and its frontier/cap rules,
    and the new validation and lint codes; `docs/branch-runtime.md` documents the
    `deviationPlayed` predicate, `lineMembership` and `spineNodeIdFor` as derived read-back
    shapes, and the `follow_theory` no-absorbing-state law beside the outcome monotone law;
    `docs/drill-client.md` documents the withheld spine for `mode: "line"`, the `packId` form
    of `/select-move`, the verdict item kind and the "Unknown is not a judgement" sentence;
    `docs/explanation-grounds.md` corrects its claim that `GET /packs/:id` carries no pre-play
    commentary (line 92-96) to say that the authored spine is projected for every mode except
    `line`, records the `theory:` namespace against its no-new-vocabulary claim (lines
    151-153), and replaces its "FEN-anchored deviations remain absent" boundary item (line
    120-123) with the `follow_theory` refusal; `docs/outcome-drill-grading.md` gains a
    pointer noting that the monotone law now has a second, stricter sibling.

## Open questions

None.

## Changelog

- 2026-08-12: created. Specifies Line Drill entry and completion, the first evaluator
  `authoredBoundary` has ever had (frontier semantics ruled on shipped-content evidence, with
  `plyHorizon` capping and never granting), a position-keyed spine resolver that unifies four
  divergent walks and makes transposition and re-entry real, three-verdict membership grading
  with `unknown` as a first-class rendered verdict, delivery through the shipped reveal
  contract, the withdrawal of the authored line from the wire projection for `mode: "line"`,
  and D7's closure. Advances the pack schema to v0.4 and claims no migration.
