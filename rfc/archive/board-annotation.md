# RFC: Board annotation — a mark is the learner's own thought

- **Status:** **implemented 2026-08-16** — returned once by cross-review; all four breaks
  ratified, five of the reviewer's counts corrected. **D187 closes in this lifecycle:**
  §2.7 lifts mark state into `DrillScreen.svelte`, and criterion 17 asserts that the
  keyed `Chessboard.svelte` remount cannot lose it. Seven open questions are deferrals,
  not gates.
- **Author:** claude (agent), for Marco
- **Created:** 2026-08-16
- **Design refs:** `design/05-in-run-experience.md` §3-forms — the *"Board overlays —
  arrows & piece halos"* row and its three-way split, and the section rule *"Honesty
  attaches to the source. Timing attaches to disclosure. Form attaches to neither"*;
  `design/05` §3-forms' closing sentence that **forms (a) and (b) are not assistance
  settings at all**; `design/05:41` (*absence is stated, never simulated*);
  `design/02-product-shape.md` §Session resume (*"branch graph persisted as an event log —
  resume any branch, **export PGN with variations**, compare a later retry with the
  original"*); `design/03-product-breadth.md` §Live and community and the **B5** gate.
  *Every code site below is cited **by symbol name**; the tree is moving under codex.
  Locate `exportPgn`, `projectRun`, `appendEvents`, `transposeKey`, `permittedAssistance`,
  `LiveSessionDetail`, `LeaseIdentity`, `requireRead`, `deleteLearner`, `STORAGE_VERSION`
  and `DRILL_RUN_SCHEMA_VERSION` by name, not by number.*
- **Exploration gate:** owner ruling 2026-08-15 on the three-way split of `arrows`,
  recorded in `design/BACKLOG.md` (the row *"`arrows` is THREE different things sharing
  one field name…"* and its sibling *"Learner-drawn board annotation — one boolean, and
  it is nobody's"*), and written into `design/05` §3-forms. The owner refused all three
  offered dispositions — retire, `unmeasured`, retire-with-the-promise-recorded — and
  ruled *"we need to find a place for them."* This RFC is the place for two of the three.
- **Depends on:**
  - `rfc/archive/live-surface-honesty.md` (**implemented**, `f2be4ed`) — owns invariants
    **I1–I4**, the ceiling-versus-preference partition, and the attribution idiom (§5.1's
    `LeaseIdentity` projection and its four-branch render table) that §4 copies rather
    than reinvents.
  - `rfc/archive/live-session-platform.md` — owns `live_sessions`, the possession journal,
    the spectator projection and the 2026-08-12 **no per-viewer withholding** ruling,
    which this RFC does not revisit.
  - `rfc/archive/learner-identity-and-authorization.md` — owns `run_grants`, `RUN_ROLES`
    and `requireRead`, the single read chokepoint this RFC reuses and does not duplicate.
  - **[implementation reconciliation] D187 is owned here, not an external prerequisite:**
    the ledger row *"`Chessboard.svelte` is destroyed and recreated on every node change,
    so no board-local state can survive a ply."* is the reason §2.7 requires mark state to
    live in `DrillScreen.svelte`. The keyed board may continue to remount; parent-owned
    marks survive it. Criterion 17 closes the row in this lifecycle.
- **Parent / amends:** amends `exportPgn`'s signature (one optional parameter),
  `Chessboard.svelte`'s `drawable` config, and `LiveSessionDetail` (one field, declared
  twice per the shipped mirror rule). Introduces one table. **No run-schema change. No
  pack-schema change. No `AssistanceConfig` field. No cell of `permittedAssistance`
  changes. No new `RunRole`, no new `SessionKind`, no new journal kind, no new
  `ServerErrorCode`.**
- **Supersedes / superseded by:** —
- **Planning:** `planning/board-annotation/` (once implementing)

## Summary

Chessground already draws arrows and circles; the product switches the capability off in
one boolean and has never turned it on. This RFC turns it on for the learner (leg **a**)
and relays a lease-holder's marks to viewers with attribution (leg **b**), in that order,
because the relay needs the drawing to exist. A mark carries a **scope** — *position*
(transposition-keyed, reappears on rewind) or *branch* (keyed to the line, cleared by a
fork) — which is how the owner's four selected behaviours turn out not to contradict each
other. Marks live in their own table, never in the run event log, and the reason is not
taste: `projectRun` enforces **adjacency invariants** over the event stream that a mark
drawn at the wrong instant would break outright — **[cross-review]** by refusing the write
and discarding the gesture, not by corrupting the run (§2.1). Because marks never reach
`DrillRun`, and `DrillRun` is the sole input to every function producing a grade, an
objective state or a verdict, the isolation this feature needs is a property of the type
graph for that set. **[cross-review]** It is *not* a property of the whole runtime, which
already takes sibling-table input in four measured places, so the packet-and-voice surface
is held by an explicit barrier and a build-failing test instead (§2.2). System-drawn
directed marks (leg **c**) are not this RFC's and are named as `rfc/format-surface.md`'s.

## Motivation

### The finding that reframed the field

`rfc/format-surface.md` §3.1 measured `arrows` correctly and disposed of it wrongly, and
the wrongness is instructive. It counted non-test reads of every assistance axis and found
`arrows` the only zero; it found `boardOverlays` (`DrillScreen.svelte`) derives from
`boardLighting`, not `arrows`, and emits `{ orig: square, brush: "blue" }` with **no
`dest`**; it found `assistance.arrows` read by `AssistanceSettings.svelte` alone. Every
one of those measurements is reproduced at HEAD by this draft. What the RFC and the
coordinator both assumed, without saying so, is that `arrows` names a **system-output**
channel — a rung-gated disclosure the product makes. Under that reading retirement is the
only honest disposition, because a *sight* arrow has no structural primitive (the reader
emits square sets, not vectors) and an *evidence* arrow is a move verdict already refused
by `engine-leverage` §6.3.

The owner's primary want is the opposite object: *"during play you want to be able to draw
arrows or highlight shit."* **A mark the learner draws is not the product speaking.** The
product asserts nothing, grades nothing and discloses nothing, so law 8 is silent on it,
the assistance ladder is silent on it, and the disclosure model is silent on it. It needs
no rung, no permission, no evidence and no capability publication. `design/05` §3-forms
now says this in the design tier: *"forms (a) and (b) are not assistance settings at all:
a learner's own mark needs no permission from a disclosure model."*

Verified at HEAD, and it is one boolean plus the design work below. `Chessboard.svelte`'s
`config()` sets:

```ts
drawable: { enabled: false, visible: true, autoShapes: [...overlays] },
```

`@lichess-org/chessground` **10.1.1** supports user drawing natively — `DrawShape` carries
`{ orig, dest?, brush?, … }`, `orig` alone renders a circle and `orig` + `dest` renders an
arrow, and the `drawable` config accepts `shapes`, `onChange?: (shapes: DrawShape[]) =>
void` and `brushes` alongside the `autoShapes` the product already uses. The arrow
capability is in the board component and no caller has ever constructed one.

### Why this is worth an RFC and not a one-line patch

The boolean is free. Everything the owner asked for around it is not:

- **Marks must survive rewind.** Rewind is the product's core verb; a mark that vanished
  when you rewound to the position you drew it on would break the loop the feature is
  supposed to serve.
- **Marks must clear on a new branch.** The same gesture, on a fresh experiment, wants a
  clean board.
- **Marks must reach the PGN**, because `design/02` promises PGN export with variations
  and a drill session's marks are part of what the session was.
- **Marks must relay to viewers**, because for teaching and streaming — two of the four
  uses the owner named — a mark is the *core communication tool*, and a teaching mark
  nobody else can see is not a teaching tool at all.

Each of those is a persistence, scope or authorization decision, and getting them wrong is
expensive after there are marks and cheap before. There are zero marks.

### Explicitly out of scope

- **Leg (c), system-drawn directed marks.** `boardOverlays` derives from `boardLighting`,
  not `arrows`, and emits square highlights with no `dest`; the structural reader emits
  `features[].squares` — square **sets**, not vectors — so there is no producer for a
  directed system mark and inventing one is a design-tier change. **`assistance:arrows`
  and its disposition belong to `rfc/format-surface.md`**, which is accepted; this RFC
  adds no `AssistanceConfig` field, reads `assistance.arrows` nowhere, and changes no cell
  of `permittedAssistance`, so `format-surface` may take its `unmeasured` disposition with
  the named gap without any interaction with this document. §7 states the boundary.
- **Any change to the assistance ceiling.** `permittedAssistance` and its four enforcement
  sites are owned in flight by `rfc/live-marker-quality.md`. This RFC does not touch the
  table, and the shipped monotonicity test in
  `apps/web/src/lib/client-surface-floor.test.ts` must pass byte-unchanged (§9).
- **Per-viewer withholding.** The 2026-08-12 ruling stands; §4 adds no viewer parameter to
  `feedbackDisclosed`, `feedbackDeliveryOpen`, `publicRunSnapshot`, `publicNodes` or
  `publicEvents`.
- **Classroom identity, rosters, assignments.** `rfc/teacher-surface.md`'s. §7.
- **Text on a mark.** `DrawShape.label` exists in chessground 10.1.1 and `Comment.text`
  exists in chessops; both are refused in v1 because text is a claim surface and a purely
  geometric mark is not. Open question 3.
- **Importing marks from a pasted PGN.** Open question 2.

## 1. What ships already, and is therefore not respecified

| Primitive | Symbol | What it gives board annotation |
|---|---|---|
| Native drawing | `drawable.{enabled, shapes, onChange, brushes}`, `DrawShape` (`@lichess-org/chessground` 10.1.1) | the gesture, the render and the change callback — all of it |
| Position identity | `transposeKey(fen)` (`packages/runtime/src/chess.ts`): canonical FEN truncated to its first four fields | the **position** scope key, already on every `Node` as `Node.transposeKey` |
| Line identity | `Node.branchId`, `Cursor.{nodeId, branchId}`, `Branch.forkNodeId` | the **branch** scope key |
| Position-keyed persistence precedent | `attempts.root_transpose_key` + the `attempts_transpose` index; `repertoire_moves.position_key`; `learner_position_stats` | position scope is existing vocabulary, not a new axis |
| Path-scoped persistence precedent | `Node.objectiveState`, and `sealedState` in `packages/runtime/src/trajectory.ts` | path-vs-position is a distinction the campaign work already made |
| PGN tree export | `exportPgn` (`packages/runtime/src/pgn.ts`), building `ChildNode<PgnNodeData>` and calling `makePgn` | the tree the marks attach to; already emits `startingComments` for branch labels |
| `%csl` / `%cal` codec | `makeComment`, `parseComment`, `CommentShape { color: 'green'\|'red'\|'yellow'\|'blue', from, to }` (chessops 0.15.1) | **the serialization, already in the dependency and called by nothing** |
| Read authorization | `requireRead` → `RunStorage.runRole` (`apps/server/src/authorization.ts`) | one chokepoint for "may this principal see this run" |
| Board possession | **[cross-review]** `drill_runs.active_writer_learner_id` (read as `StoredRun.activeWriterLearnerId`), `BOARD_CONTROLS` (4 members), `RunStorage.boardOperation` — *not* `leaseHeldBy`, which is a **response field**, not a function (§4.2) | the governance answer the live surface already gives — reused for **who may relay** |
| Attribution projection | `LeaseIdentity { learnerId, handle }`, resolved with `RunStorage.learnerById`, declared in **both** **[cross-review]** `apps/server/src/storage.ts:64-67` (not `live-types.ts`, which imports it) and `apps/web/src/lib/api.ts:91-94` | the attribution idiom §4 copies verbatim |
| Attribution rendering | `voteAttribution` (`apps/web/src/lib/live-vote.ts`) and its four-branch table, on both the session page and the overlay | the honesty template, including the deleted-account arm |
| Session rail | `GET /sessions/:id` → `LiveSessionDetail`, polled every 2 s by `syncLivePolling` (`App.svelte`) on the `live-session`, `live-overlay` and `run` routes | the relay transport — **already polling, already authenticated** |
| Account deletion idiom | `RunStorage.deleteLearner`; `#deleteRepertoireRows` (row-by-row delete) versus the `registered_packs` `LEGACY_ID` reassignment | §5.4 picks one and says which |

## 2. Leg (a) — the learner's own marks

### 2.1 Where marks live, and why not in the run event log

**Marks live in a new `run_marks` table. They are not `DrillRunEvent`s and `DrillRun`
gains no field.** Four reasons, in the order they decide the question. The first is not a
preference — it is a crash.

**(1) The run event stream carries adjacency invariants that a mark would break.**
`projectRun` (`packages/runtime/src/events.ts`) does not merely fold events; it validates
their *ordering*, and three of its checks constrain what may sit **immediately** next to
what:

```ts
const previous = events[index - 1];
if (previous?.type !== "move.committed" || previous.data.node.id !== node.id) {
  throw new TypeError(
    `outcome.reached ${event.seq} must immediately follow its move.committed`,
  );
}
```

`segmentFromEvent` in the same file requires `events[event.seq - 2] !== end` to be false —
*"`segment.completed` must immediately follow its ending checkpoint"* — and
`opponentMovesFromEvents` (`packages/runtime/src/replay.ts`) requires every opponent
`move.committed` to be immediately preceded by an authoritative
`opponent.move_selected`, throwing `ReplayError` otherwise. All three compare **raw
adjacent array slots** (`events[index - 1]`; `segmentFromEvent`'s seq arithmetic is pinned
to array position by `projectRun`'s own contiguity check), with no filtering and no
tolerance window, so **no existing event type is permitted in any of the three gaps** —
the argument is not weakened by some other member already landing there safely.

**[cross-review] The consequence was overstated, and the correction changes the argument's
shape without changing its conclusion.** Two measurements at HEAD:

- **The named scenario cannot be constructed.** `commitMove` pushes `move.committed` and
  `outcome.reached` **in one `appendEvents` drafts array**
  (`packages/runtime/src/runtime.ts:346-351`), so there are no *"milliseconds between
  committing a mating move and the runtime deriving its outcome"* to draw in. The
  checkpoint/segment pair and the selection/commit pair are likewise ordered out of the gap
  by their emitters (`runtime.ts:454` then `:461-473`; `commitMove` emits any
  `branch.forked` **before** the selection at `:298-322`).
- **The failure is a write-time refusal, not a corrupt run.** `appendEvents` re-runs
  `projectRun` over the whole log *before* anything is persisted (§2.1(2)), so a
  bad-adjacency event throws at the append and never reaches `snapshot_json`. `RunStorage`
  also serves a live run from `#snapshots` without replaying at all. *"The run becomes
  permanently unloadable"* is reachable only from a hand-written or migrated log, which is
  not the path a drawn mark takes.

**The corrected claim, and it is still decisive.** Storing marks as events makes every
mark a **gated write**: a gesture whose acceptance depends on which synchronous critical
section the runtime happens to be inside, refused with a `TypeError` surfacing as a 500,
and the learner's thought discarded. Today's gaps are closed only because every emitter
brackets them inside one synchronous call — a property no test asserts and nothing holds.
A user-gesture-timed event would make that accidental bracketing load-bearing forever.
That is the general fact, and it is ledgered in the rows *"`projectRun` enforces adjacency
invariants over the run event stream…"* and *"The run event log's adjacency invariants are
held open only by every emitter's synchronous bracketing, and nothing asserts it."*: a new
`DrillRunEvent` member is only safe if its emission instant is controlled, and a user
gesture's is not.

**[author round] Ratified, and the bracketing is looser than even the correction implies —
one of the three pairs is not one `appendEvents` call but two.** Re-verified at HEAD
(`7650d41`): `commitMove` does emit `move.committed` and `outcome.reached` in a single
drafts array, so the mating-move scenario is unconstructible as the review says, and
`appendEvents` is `projectRun([...run.events, ...appended])` — a pure re-projection whose
throw happens before any caller reaches `RunStorage.save`. But `reachCheckpoint` calls
`appendEvents` **twice**, once for `checkpoint.reached` and again for `segment.completed`
against the run the first call returned, with only straight-line synchronous code between
them and no lock, no queue and no `await`. The gap is therefore held open by nothing
stronger than *the absence of an `await` in one function body*. That is the sharpest
available statement of the hazard: the invariant is real, its enforcement is real, and the
thing keeping the enforcement from firing on legitimate writes is a property of the source
text that no test reads.

**It deserves a criterion, and a narrow one.** The invariant is not this RFC's to own — it
predates the draft and would matter with or without marks — but this RFC's central argument
*rests* on it, and an argument resting on an unasserted property should either assert it or
stop resting on it. Criterion 3a asserts the cheap half: **no function in
`packages/runtime/src` that calls `appendEvents` more than once is `async` or contains an
`await` between those calls.** That is one source-level assertion in the shipped census
idiom, it fails the moment someone makes an emitter asynchronous, and it does not attempt to
police the adjacency rules themselves, which `projectRun` already polices. Anything broader
belongs to the runtime, not here. Ledgered in the row *"`reachCheckpoint` emits its
checkpoint/segment pair through two separate `appendEvents` calls…"*.

**(2) Every append is a full replay.** `appendEvents` assigns sequence numbers and then
re-runs `projectRun` over the *entire* log; `RunStorage.save` rewrites the whole
`snapshot_json`. Marks are the highest-frequency gesture this feature adds. Paying a full
run replay and a full snapshot rewrite per arrow is a cost with no return.

**(3) A run-schema bump would be mandatory, and it is avoidable.** `RunStorage.read`
filters `WHERE … AND schema_version = ?` bound to `DRILL_RUN_SCHEMA_VERSION`, so a run at
an older schema is **invisible**, not upgraded on read. Adding a `DrillRunEvent` member
therefore forces a run-schema version *and* a stamping migration over every stored
snapshot. A sibling table needs a migration but no run-schema change and no snapshot
rewrite — the migration-15 (`repertoire-gap-finding`) and migration-10 (`shape-library`)
create-table/index-only shape. Note the migration-10 precedent is cited here for its
*mechanics*, not its argument: migration 10 kept the run schema still because rung-0 facts
are **derived**, and a mark is authored input, not derived. The mechanics transfer; the
justification is this section's, not that one's.

**(4) It makes the isolation argument structural instead of disciplinary.** This is §2.2.

### 2.2 The isolation argument — a mark is not a move, by type

The requirement is that nothing in the drill runtime may read a mark as input: not
grading, not objectives, not deviations, not tempo, not the guard, not any detector. The
weak way to get that is a rule and a code review. The strong way is the one this design
takes for free:

> **~~`DrillRun` is the sole input to every detector, grader and objective evaluator in
> `packages/runtime`.~~** — **[cross-review] false at HEAD; superseded by the narrowed
> property below.**

**[cross-review] The premise as first written is empirically wrong, and it had to be
narrowed before it could carry any weight.** Sibling SQL tables already reach runtime
detectors, by four measured paths:

| Sibling table | Reaches | Site |
|---|---|---|
| `registered_shapes` | `matchesStructuralExpression` — a structural **detector**, run over learner-published trigger documents | `evidencePacket` (`apps/server/src/guidance.ts:30-36`), loaded by `shape-studio.ts` |
| `registered_shapes` | `shapeFirings` (`packages/runtime/src/shape-firing.ts`) via `storyMoments` and `shapeRecommendations` | `service.ts` story/recommendation arms |
| `run_grants` | `permittedAssistance` — `AssistanceContext.role` is a raw `SELECT role FROM run_grants` (`storage.ts:1131`) via `requireRead` | `packages/runtime/src/assistance.ts:21-27` |
| `session_proposals` / `session_votes` / `match_states` | `commitMove` and `rewind` — a string in a sibling table becomes the move that gets graded | `live-session.ts` `resolveProposal` / `closeVote` / `matchOperation` |

`evidencePacket` alone takes **four inputs beyond the run** — **[author round]** its
parameter object is `{ run, node, pack?, authored, shapes? }` (`guidance.ts`), so the four
are `node`, `pack`, `authored` and `shapes`; the review's parenthetical listed five names
under the count of four by including `run` itself. So *"nothing but the run reaches the
runtime"* is not a property this codebase has, and an RFC resting its whole safety case on
it rests on nothing.

**The narrowed property, which is true at HEAD and is what this RFC actually needs:**

> **No runtime function whose output is a grade, an objective state, a deviation verdict,
> a tempo verdict or a guard firing takes any input other than a `DrillRun`, a `Node`, a
> FEN, or a pack document. `DrillRun` gains no field and no pack document changes.
> Therefore no such function can reach a mark without a signature change.**

`projectRun`, `commitMove`, `appendOpponentPly`, `fork`, `rewind`, `reachCheckpoint`,
`deriveSegments`, `trajectoryLegSpans`, `trajectoryVerdict`, `feedbackDisclosed`,
`feedbackDeliveryOpen`, `structuralReading`, `pivotalMarkers`, `liveMarkers`,
`compareStrips`, `spinePositionIndex`, `deviationAnchors` and the guard evaluator satisfy
it. `evidencePacket`, `storyMoments`, `shapeFirings` and `permittedAssistance` **do not**,
and are handled by the barrier below rather than by the type graph.

**Two functions accept marks, not one: `exportPgn` and `exportPackRunPgn`** (§3). The RFC
conceded the second in §3.2 while §9's criterion 1 pinned the set at one — that
contradiction is resolved here in favour of two, because the pack export path is
`RunService.pgn`'s **default arm** for pack sessions (`service.ts:1451`) and cannot be
left unplumbed. Both return strings and no detector, validator or grader reads their
output. `exportPgn` has **four** non-test call sites, not one — two in `RunService.pgn`
(the imported-headers arm and the position arm) and two in `exportPackRunPgn` (the
discarded legality validation and the combined-tree export) — which is why criterion 1
pins the *marks-accepting* set rather than the call graph. **[author round] The review's
"five" counted the definition as a call site**, and the recount matters for a second reason
it did not reach: `exportPgn` is a **homonym**. `apps/web/src/App.svelte` declares a local
`exportPgn` and `session-controller.ts` a method of the same name, both of which call the
REST route and neither of which is the runtime function. A grep-based criterion that is not
scoped to `packages/runtime/src` will hit them; criterion 1 is scoped, and this is why.

**[cross-review] The second path exists, and it is not a grader — it is the voice
allowlist.** `voiceCheck` (`packages/runtime/src/voice.ts:32-33`) builds
`source = packet.sentences.join("\n")` and licenses the model to emit any square, UCI, SAN
token, chess noun or judgement word that appears in it. `EvidencePacket.sentences` is
therefore not a projection — it is **the allowlist that decides which chess tokens may be
spoken at all**, and `rest.ts` already splices additional derived sentences into it at the
REST layer, at the two story-aware voice arms. One line of that established shape — *"the
voice should acknowledge what the learner circled"* is the obvious follow-on request for
this feature — would put learner-chosen squares into the allowlist, letting a provider say
`e5` about a position where nothing validated mentions `e5`. The learner would be authoring
their own law-8 bypass, `DrillRun` would gain no field, and **criterion 2's byte-identity
test would still pass**.

**[author round] Ratified with two narrowings, and the second one is what makes the
replacement criterion designable.**

- **`sentences` is a token allowlist, not the boundary of what may be asserted.** The ledger
  row *"`voiceCheck` is a token filter, and every RFC that treats it as a proposition binder
  over-claims it"* demonstrates by execution that a packet containing one sentence licenses
  entirely invented prose so long as it carries no square, no move token, and no word from
  the three fixed lists. The review's *"the boundary of what may be asserted about the
  position"* is exactly that over-claim, and this RFC will not inherit it. The corrected
  statement — *splicing a mark would license a chess token nothing validated mentions* — is
  narrower, is true, and is enough: a square is precisely the kind of thing `voiceCheck`
  does bind.
- **The reason criterion 2 cannot catch this is the layer, not the self-comparison.** The
  review says the byte-identity test *"compares the un-plumbed state against itself"*, which
  reads as though the test were vacuous. It is not: criterion 2 exercises `evidencePacket`
  directly with a `DrillRun`, and the splice sites are in `rest.ts`, **above**
  `evidencePacket` and outside everything criterion 2 calls. A mark reaching `sentences`
  through a REST-layer splice changes nothing criterion 2 observes, because criterion 2 never
  runs the route. That is a sharper statement of the same conclusion, and it dictates the
  fix: **the replacement criterion must run at the layer where the splice happens.** A
  source-grep over four assembly sites and two splice sites, as the review proposed it, is
  not that — it is pinned to line numbers that have already drifted once during this review,
  and the natural violation adds a *new* splice line that an enumeration of the old ones
  cannot see.

**The barrier: no mark-derived value may enter `EvidencePacket.sentences`, `plans`,
`authored`, `observations` or `structures`, ever.** This is stated as a rule because it
cannot be a type — `sentences` is `readonly string[]` and a mark's `orig` is a string.
Criterion 2a, rewritten in §9, enforces it **behaviourally at the route layer** with a
census as the second net and a positive control that proves the assertion can go red. Open
question 3 (text on a mark) is now load-bearing rather than cosmetic: text would make this
barrier the only thing between free learner prose and the voice allowlist. Ledgered in the
row *"`EvidencePacket.sentences` is the `voiceCheck` allowlist…"*, amended by *"A barrier
test that runs below the layer the barrier is breached at cannot fail…"*.

### 2.3 Scope — the four selected behaviours, and why they do not conflict

The owner selected all of: per-node surviving rewind · exported with the PGN · relayed
live to viewers · per-branch cleared on a new branch. The first and last look
contradictory. They are not, because **a mark carries a scope**, and the two scopes answer
two different questions about what a mark is *about*.

| | **`position`** | **`branch`** |
|---|---|---|
| The mark is about | this position | this line |
| Key | `node.transposeKey` — the canonical FEN truncated to its first four fields | `` `${cursor.branchId}:${node.id}` `` |
| Survives rewind | **yes** — rewinding returns you to the same position, so the same key | yes, on the same branch |
| Survives a fork | yes, at the node it was drawn on; the fork's *new* nodes are different positions and carry nothing | **no** — a fork gives the cursor a new `branchId`, so the key changes and the board is clean |
| Travels to a transposition | **yes** — see below | no |
| Persisted as | one `run_marks` row per shape | one `run_marks` row per shape |

**Both behaviours exist.** Neither is emulated by the other and neither is a mode; scope
is a column.

**[cross-review] The branch key is a function of the cursor's history, not of the tree, and
that has to be said out loud.** `rewind` picks its branch id with a ternary
(`packages/runtime/src/runtime.ts:398-400`): rewinding to an **ancestor** of the current
node *keeps* `run.activeCursor.branchId`; rewinding anywhere else takes
`target.branchId`. `Node.branchId` is fixed per node; `Cursor.branchId` is not. So the same
node, in the same tree, yields **different scope keys on different visits**:

> Draw a `branch`-scoped mark at node N on branch B (key `B:N`). Fork to B′ — the mark
> clears, which is the specified behaviour. Now abandon the fork and rewind to N: N is an
> ancestor of where you are, so the cursor keeps **B′**, the key is `B′:N`, and **the
> original mark does not come back**. It returns only after a rewind that lands off the
> current path first, which restores `target.branchId`.

The mark is not lost — the row is intact and position-scoped marks are unaffected — but it
is *conditionally invisible*, and the RFC's own §2.3 argument that the default should fail
in the recoverable direction applies to this arm too. Two dispositions were considered.
Keying on `Node.branchId` instead would make the key a pure function of the node, but the
fork node itself keeps its original branch id, so marks at the fork point would **not**
clear on a fork — which is the owner's fourth selected behaviour, at exactly the node where
it matters. **Cursor-derived is kept**, and the cost is stated rather than discovered:
criterion 4a tests the return path, and the re-scope action (below) is the learner's escape
hatch when a branch-scoped mark has gone quiet. Ledgered in the row *"`Cursor.branchId` is
history-dependent…"*.

**[author round] Ratified, re-verified, and the disposition stands.** `rewind` at HEAD picks
`isAncestor(run, nodeId, run.activeCursor.nodeId) ? run.activeCursor.branchId :
target.branchId`, exactly as described, and `Node.branchId` is stamped once at commit and
never rewritten. The finding is a defect in this RFC's key choice, not in `rewind`: rewind's
own behaviour — *staying on the branch you are exploring when you step back along it* — is
correct for the cursor and is what the compare and group surfaces expect. Keeping the
cursor-derived key with a tested return path and a re-scope escape hatch is the right trade,
and it is now a pinned behaviour rather than an undiscovered one.

**The default is `position`,** for three reasons, ordered by weight:

1. **It is the scope that makes rewind work,** and rewind is the verb the product is built
   on. A default that lost your thinking every time you exercised the core loop would be
   the feature arguing with the product.
2. **Its failure is the cheaper one.** A mark that reappears when you did not want it
   costs one erase gesture. A mark that vanished is lost thought and is unrecoverable.
   Defaults should fail in the recoverable direction.
3. **It is the scope the codebase already speaks.** `Node.transposeKey` exists on every
   node and is already load-bearing for repetition counting inside `projectRun`, for spine
   anchoring and deviation anchors in `packages/runtime/src/line.ts`, and for
   `attempts.root_transpose_key`. Branch scope needs a composite key this RFC invents;
   position scope needs a key that is already computed, indexed and trusted.

**Scope is chosen at draw time, from a sticky per-run setting, and is re-assignable
afterwards.** Concretely: the mark layer carries one control with two states — *"stays
with the position"* (default) and *"stays with this line"* — which stamps `scope` on
marks drawn while it is set; the setting persists for the run in the same client-local
store the assistance preferences use, and it is **not** a server object. Marks already
drawn keep the scope they were stamped with, and one action on the mark layer re-scopes
**every mark this author has at the current node** to the other scope, because a sticky
setting the learner cannot correct after the fact is a trap and re-scoping is a key
rewrite the server can do in one statement. Per-shape scope pickers are refused: they tax
the gesture the whole feature exists to make cheap.

**A `position`-scoped mark on a transposition appears, and that is the specification, not
a leak.** `transposeKey` is the product's own definition of "the same position" — it is
what decides threefold repetition in `projectRun`, what anchors an authored spine node in
`line.ts`, and what keys a deviation. A mark that refused to show on a transposed arrival
would be the product disagreeing with itself about position identity. The escape hatch is
the other scope, which is why both must exist: draw it `branch`-scoped and it will not
travel. §9's criterion 4 tests both directions.

**[cross-review] The failure case is smaller than the argument implies, and the reason is a
bound the RFC never stated: `run_marks.run_id` is `NOT NULL` and every read is per-run.** A
position-scoped mark therefore travels only within **one run** — one pack's branch tree, or
one Just Play session. The feared shape, *a mark drawn in one opening reappearing in an
unrelated line that transposes*, requires both lines to be inside the same run, which for
pack sessions means the pack's own author put them there. Marks never cross runs, never
cross learners, and never reach a position the run did not reach. The transposition
behaviour is real and is worth defending on the identity argument above; it is not the
open-ended surface *"appears on any transposition"* reads as, and saying so is cheaper than
letting a reader infer the larger claim. `transposeKey` is also the **conservative** key in
the one direction that matters: it retains castling rights and the en-passant square, so
two human-identical positions differing in either get *different* keys and the mark simply
does not reappear — a false negative, which §2.3's own ordering calls the recoverable
direction.

### 2.4 The shape vocabulary — four brushes, and the board may not correct you

A mark is a `DrawShape` narrowed to what round-trips through the PGN standard without
loss:

```ts
export const MARK_BRUSHES = Object.freeze(["green", "red", "blue", "yellow"] as const);
export type MarkBrush = (typeof MARK_BRUSHES)[number];

export interface RunMark {
  readonly scope: "position" | "branch";
  readonly scopeKey: string;
  readonly brush: MarkBrush;
  readonly orig: string;          // a square, "a1".."h8"
  readonly dest?: string;         // absent => circle; present => arrow
  readonly at: string;
}
```

The four brushes are **not** an arbitrary palette. chessops' `CommentShapeColor` is
exactly `'green' | 'red' | 'yellow' | 'blue'`, and `makeComment` emits `[%csl …]` for
shapes where `to === from` and `[%cal …]` for shapes where it does not. chessground 10.1.1
ships those four **plus** `paleBlue`, `paleGreen`, `paleRed`, `paleGrey`, `purple`,
`pink`, `white` and `paleWhite` — **[cross-review] eight extras, not the five first listed;
counted from `defaultState()`'s `drawable.brushes` in
`@lichess-org/chessground/dist/state.js`** — none of which has a `%csl`/`%cal`
counterpart. Persisting one of those would produce a mark that cannot be exported, so the
vocabulary is closed at four and anything else is refused (§2.6). The export format pins
the palette; the palette is not a taste decision.

**[cross-review] The gesture cannot produce an unexportable brush, which makes the refusal
a backstop rather than a filter.** chessground types the user-drawing path as
`cg.BrushColor = 'green' | 'red' | 'blue' | 'yellow'` (`dist/types.d.ts:99`) and
`DrawCurrent.brush` is that union, so `eventBrush`'s modifier combinations select among
exactly the four — the wider `DrawBrushes` record exists for `autoShapes` callers. So
`MARK_BRUSHES` and the user's reachable palette coincide *by construction* rather than by
this RFC's choice, and criterion 9 tests a server backstop against a hand-built request,
not a UI state.

**[author round] Both corrections ratified on a recount.** `defaultState()` ships **twelve**
brushes — the four exportable ones and eight extras (`paleBlue`, `paleGreen`, `paleRed`,
`paleGrey`, `purple`, `pink`, `white`, `paleWhite`) — and `BrushColor` is declared as the
four-member union in the same package's `types.d.ts`. The draft's "five extras" was a
miscount of a list it had in front of it, which is the least defensible kind.

Two chessground defaults must be overridden, and both are substantive:

- **`defaultSnapToValidMove: false`** (chessground's default is `true`). Snapping a drawn
  arrow to the nearest legal move is the board silently rewriting the learner's thought
  into a chess claim. A mark is outside the ladder precisely because the product asserts
  nothing through it; a board that corrects your arrow has started asserting. This is the
  smallest law-8-shaped decision in the RFC and it is the one an implementer will
  otherwise get wrong by leaving a default alone.
- **`eraseOnMovablePieceClick: false`** (default `true`). Clicking a piece to move it must
  not wipe the reasoning you drew about why.

`drawable.shapes` carries the learner's marks; `drawable.autoShapes` keeps carrying
`boardOverlays`. They are separate slots in the same config, so system overlays and
learner marks never collide and neither can be mistaken for the other — which is the
form-inventory distinction in `design/05` §3-forms expressed in the renderer.

### 2.5 The table

```sql
CREATE TABLE run_marks (
  id                TEXT PRIMARY KEY,
  run_id            TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  author_learner_id TEXT NOT NULL,
  scope             TEXT NOT NULL CHECK (scope IN ('position','branch')),
  scope_key         TEXT NOT NULL,
  brush             TEXT NOT NULL CHECK (brush IN ('green','red','blue','yellow')),
  orig              TEXT NOT NULL,
  dest              TEXT,
  relayed           INTEGER NOT NULL CHECK (relayed IN (0,1)),
  created_at        TEXT NOT NULL
) STRICT;
CREATE INDEX run_marks_author ON run_marks(run_id, author_learner_id, scope, scope_key);
CREATE INDEX run_marks_relay  ON run_marks(run_id, relayed, scope, scope_key);
```

- **`author_learner_id` carries no foreign key against `learners(id)`**, following the
  `registered_packs.publisher_learner_id` precedent and `rfc/teacher-surface.md` §4.1a's
  finding that `ON DELETE CASCADE` from `learners` is the exception in this codebase, not
  the idiom. Account deletion is handled explicitly in §5.4.
- **`ON DELETE CASCADE` from `drill_runs` is correct**: a mark has no meaning without its
  run and mints nothing that must outlive it.
- The `CHECK` vocabularies are written as **literal strings**, per the migration-9 freeze
  lesson recorded in the migration register — never interpolated from the live TS
  constants, so a later widening of `MARK_BRUSHES` cannot retroactively change what an
  already-applied migration builds.

### 2.6 Routes, and why the write route gates on `requireRead`

chessground's `onChange` hands back **the whole current shape set** after every gesture,
not a delta. The API is therefore replace-a-set, which matches the library exactly and is
idempotent:

| Method + path | Actor | Effect |
|---|---|---|
| `GET /runs/:id/marks` | any reader | this principal's own marks across the whole run |
| `PUT /runs/:id/marks` `{nodeId, branchId, scope, shapes}` | any reader | replaces **this principal's** marks at the resolved scope key. `shapes: []` erases |

Rules:

1. **Both routes gate on `requireRead`, not `requireWrite`.** The shipped `requireWrite`
   layers three checks on top of `requireRead` — role capability (`mayWrite`: `host` or
   `participant`), the run lease (`stored.activeWriterLearnerId !== principal.learnerId`),
   and the device writer-id (`assertActiveWriter`) — verified at
   `apps/server/src/authorization.ts:54-75`. Requiring it would make marking impossible for
   exactly the two people the owner named: a teacher watching a student's board without
   holding it, and a spectator ideating on a stream. The object written is keyed `(run_id,
   author_learner_id)` and no path lets a principal write or delete another author's rows,
   so the write is to the principal's own data, on a run they are already authorized to
   read. **No second authorization path is created** — `requireRead` → `runRole` is the
   shipped chokepoint and this RFC adds no other. That is the D4/D8 two-sources-of-truth
   class the repo has been bitten by, avoided by reuse.

   **[cross-review] This is not the idiom departure §6 called it — it is the majority
   idiom, and the real invariant is sharper than "read gate ⇒ read-only".** The shipped
   rule is: **touch the `DrillRun` graph ⇒ `requireWrite`; everything else ⇒ `requireRead`
   plus a capability predicate or a principal-keyed object.** Marks touch no run-graph
   state and are principal-keyed, so they land on the second arm with no predicate needed —
   which is a *stronger* justification than the one §6 offered, and §6 is corrected
   accordingly.

   **[author round] Ratified, recounted, and the recount produces better evidence than the
   count did.** The review's "seventeen" is not the number its own list adds to. Measured at
   HEAD by the predicate *a method that writes to storage and whose only run-scoped
   authorization is `requireRead`, directly or through a helper that calls it*: **eighteen** —
   `RunService.share`, `revokeShare`, `duplicate`, `updateGrant`, `claimLease`,
   `enqueueEvidence`, and eleven `LiveSessionService` mutators (`create`, `close`, `board`,
   `mintLink`, `revokeLink`, `propose`, `openVote`, `castVote`, `closeVote`, `invite`,
   `importLeg`, all reaching `requireRead` through `#required` / `#requiredOpen` /
   `#requiredControl`). Two further methods are **mixed, and they are the strongest evidence
   in the section**: `matchOperation` gates on `requireRead` and escalates to `requireWrite`
   inside its `resume` arm alone, and `resolveProposal` does the same inside its `apply` arm —
   in both, the escalation happens at exactly the statement that touches the run graph and
   nowhere else. The invariant is visible *within* a single method body, not only across the
   service.

   **`RunService.flip` is deliberately dropped from that list, and the reason matters.** The
   review counted it as a shipped instance of the idiom. It is a shipped instance of the
   idiom being wrong: the ledger row *"`RunService.flip` is `requireRead`-only, so anyone
   granted a run can fork a position out of it into a permanent run of their own"* is an open
   defect, queued for codex. It does not weaken the invariant — it confirms it, because
   `flip` mints run-graph state (a derived `DrillRun` plus a `run_derivations` row) and is
   therefore on the `requireWrite` arm by the rule this section is citing. Marks mint no run,
   no node, no branch and no event, so the same rule that condemns `flip` clears them.

1a. **[cross-review] Can a read-scoped anonymous token write a mark? No — but not for the
   reason the two-scope claim suggests, and the real mechanism needs a criterion.**
   `public_tokens` carries exactly two scopes, `'story_read'` and `'session_join'`
   (`storage.ts:2350`, closed SQL CHECK), and **neither ever produces a principal of its
   own**: `Principal` is `{learnerId, handle}` and has no token variant. `session_join` is
   `authenticate()`-first and *materializes* a real `run_grants` row on redemption
   (`storage.ts:1771`), so a joiner writes their own marks as a genuine principal — correct
   by design. `story_read` is the hazard: `RunService.publicStory` (`service.ts:570`)
   resolves the token, loads **the token creator's learner row, and fabricates a principal
   from it**, then calls `this.story(...)` — so an anonymous link holder passes
   `requireRead` **as the sharing host**. Scoping is by hand-narrowed projection
   (`moments.slice(0, 8)`), not by authorization. Today that reaches `story()` only. **The
   rule this RFC adopts: the mark routes take their principal from `authenticate()` and
   from nowhere else; no token-derived principal may reach them.** Without it, one future
   convenience route hands an anonymous link holder the ability to write marks *attributed
   to the host*, on a run they cannot otherwise touch. Criterion 6a pins it. Ledgered in the
   row *"A `story_read` token passes `requireRead` as the token's creator, through a
   fabricated principal…"*. Related and out of scope: `RunService.pgn`'s optional-principal
   overload
   (`service.ts:1430-1432`) falls back to the auto-created `__legacy` learner, which passes
   `requireRead`; it is unreachable from REST (`rest.ts:1035` always authenticates) and the
   §3.2 filter means `__legacy` exports no marks, but it is why §3.2 filters on the
   resolved principal rather than on the route.

   **[author round] Ratified in full, and the criterion is the right response rather than an
   over-reaction.** Re-verified at HEAD: `publicStory` resolves the token record, loads
   `learnerById(record.createdBy)`, and calls `this.story(runId, {learnerId: learner.id,
   handle: learner.handle}, branchId)` — the anonymous holder is authenticated *as the host*
   and the only thing narrowing what they get is `moments.slice(0, 8)`. `Principal` has no
   token variant, so nothing downstream can tell the difference. The reason this needs a
   criterion rather than a sentence is that the property this RFC relies on — *"a read-scoped
   token cannot write a mark"* — is true today for a reason that has nothing to do with
   scoping: `publicStory` simply does not call a mark route. That is a fact about one
   function's body, not a guarantee, and a guarantee is what a write route deserves.
   Criterion 6a pins it from both sides: the token path writes nothing, and a `session_join`
   redemption — which mints a real `run_grants` row — writes its own marks correctly.

2. **The server derives `scope_key`; the client never supplies one.** For `scope:
   "position"` the server resolves `run.nodes.find(n => n.id === nodeId).transposeKey`;
   for `scope: "branch"` it builds `` `${branchId}:${nodeId}` ``. An unknown node or branch
   is `INVALID_REQUEST`. A client-supplied key would let a caller write marks onto
   positions the run never reached — harmless, but unbounded and unauditable.

   **[cross-review] `requireBranch` is not a sufficient check and the branch arm needs a
   second one.** `requireBranch(run, branchId)` (`packages/runtime/src/branch-path.ts:13`)
   asserts only that the branch **exists**; it says nothing about the node. A caller may
   therefore pair any branch with any node and mint a key like `B7:N3` for a pairing the
   cursor never held — re-opening, inside the branch arm, exactly the unauditable surface
   this rule exists to close. **Normative: the branch arm additionally requires `nodeId` to
   appear in `branchPath(run, branchId)`** (same module), and refuses `INVALID_REQUEST`
   otherwise. Criterion 6 is extended to cover the pairing, not only the two existence
   checks.

   **[author round] Ratified, and `branchPath` is confirmed the right predicate rather than
   merely a stricter one.** `requireBranch` is a `find` over `run.branches` and returns the
   branch; it never sees a node. `branchPath` walks from the branch's own tip back through
   `parentId` to the root, so membership means *this node is on the path the cursor would
   have held on that branch* — which is exactly the pairing the scope key is supposed to
   name. It also throws `BranchQueryError` rather than returning a falsy value, so the arm
   must catch and re-refuse as `INVALID_REQUEST` rather than letting an `UNKNOWN_BRANCH`
   escape as a 500; that translation is part of the normative rule, not an implementation
   detail.

2a. **[cross-review] `/runs/:id/marks` must be added to a closed route enumeration.**
   `parseRunRoute` matches run subroutes against a literal alternation of action names; an
   unlisted action returns `undefined` and 404s. Noted because it is the one implementation
   site that is invisible from every symbol this RFC cites by name. **[author round] The
   alternation holds 33 members, and held 33 at `a7e700d` too — the review's 31 is a
   miscount, not drift** — which is itself the argument for citing it by symbol and never
   by arity: any
   number written here is stale by the time it is read, and the implementer's task is
   *"add one member to the alternation in `parseRunRoute`"*, which does not need a count.
3. **`relayed` is stamped server-side at write time** and is never client-supplied (§4.2).
4. **Bounds** (§5.1) are checked server-side; the client stops offering the gesture at the
   cap rather than re-implementing the check, per `live-surface-honesty` §5.2's rule.
5. **Refusals are `INVALID_REQUEST`.** No `ServerErrorCode` member is minted — see §8.

### 2.7 Client surface

- `Chessboard.svelte` gains `marks?: readonly DrawShape[]`, `drawingEnabled?: boolean`
  (default `false`) and `onMarksChange?: (shapes: readonly DrawShape[]) => void`, wiring
  `drawable: { enabled: drawingEnabled, visible: true, autoShapes: [...overlays], shapes:
  [...marks], defaultSnapToValidMove: false, eraseOnMovablePieceClick: false, onChange:
  onMarksChange }`.
- **Mark state must not live inside `Chessboard.svelte`.** The component is wrapped in
  `` {#key `${displayedNode.id}:…`} `` in `DrillScreen.svelte`, so it is destroyed and
  recreated on every node change; anything held internally is lost each ply. State is
  lifted into `DrillScreen.svelte`, which owns the fetch, the debounce and the PUT.
  Ledgered, because it is the first thing an implementer will get wrong.
- **v1 enables drawing on `DrillScreen`'s board only.** Every other `Chessboard` instance
  — `CompareView`, `GroupPanel`, `CheckpointSheet`, `GameStoryScreen`, and the simul-wall
  minis in `App.svelte` — keeps `drawingEnabled` at its `false` default and is unchanged.
  The **live overlay** renders relayed marks read-only (§4.3). Open question 4.
- Writes are **debounced 400 ms** after the last `onChange` and coalesce into one PUT per
  scope key, so a four-arrow sketch is one request rather than four.
- The scope control is one two-state toggle on the mark layer, plus a re-scope action
  (§2.3). Its setting is client-local and is not sent to the server as anything but the
  `scope` field of a write.

## 3. PGN serialization

`design/02` §Session resume promises *"export PGN with variations"*, and `exportPgn`
delivers a real variation tree today. What it emits in the way of comments is **exactly
one thing**: a `startingComments` entry reading `Tabiya branch: <label>` on the first move
of each non-primary branch. It sets `comments` never and `nags` never, and a repo-wide
search for `%csl`, `%cal`, `%eval` and `%clk` returns zero hits outside `node_modules`.

**The serialization is already in the dependency.** chessops 0.15.1 exports
`makeComment(comment: Partial<Comment>): string` where `Comment.shapes: CommentShape[]`,
`CommentShape = { color, from, to }`, and the implementation partitions on `to === from`,
emitting `[%csl <list>]` for the equal ones and `[%cal <list>]` for the rest, with colours
abbreviated `R`/`G`/`Y`/`B`. `parseComment` reads them back. Nothing in the repo calls
either. This RFC calls `makeComment`; it does **not** hand-write the tag grammar, so the
product cannot drift from the codec it round-trips against.

### 3.1 Specification

`exportPgn` gains one optional trailing parameter:

```ts
export function exportPgn(
  run: DrillRun,
  branchIds?: readonly string[],
  headerOverrides: Readonly<Record<string, string>> = {},
  marks: readonly RunMark[] = [],
): string
```

Defaulted, so every existing call site — `RunService.pgn`'s three arms and
`exportPackRunPgn`'s two — compiles and behaves identically unchanged.

Placement, in the tree `exportPgn` already builds:

- A mark whose scope key matches a node in the exported tree is attached to **that node's
  `PgnNodeData.comments`**. In chessops' model a node's `comments` are the comment
  *after* its move, i.e. annotating the position that move produced — which is exactly the
  position the mark is about.
- Marks on the **root** position go to `Game.comments`, which `makePgn` emits before the
  first move. `Game.comments?: string[]` is shipped and currently unset.
- Matching: a `position`-scoped mark attaches to every exported node whose
  `transposeKey` equals its `scopeKey`; a `branch`-scoped mark attaches to the node
  identified by its `scopeKey`, and only when that branch is in `branchIds`.
- All marks landing on one node produce **one** comment string from **one** `makeComment`
  call, so the emitted comment carries at most one `%csl` list and one `%cal` list.
  `makeComment` does the batching.
- `startingComments` is untouched: it is the comment *before* the move, so branch labels
  and marks occupy different slots and cannot collide.
- A `position`-scoped mark that matches several nodes in the tree (a transposition inside
  the exported variations) is emitted at each — which is what the reader will see on the
  board at each of those points, so the PGN and the app agree.

**[cross-review] The pack export path silently drops every `branch`-scoped mark, and it is
the default arm.** `RunService.pgn` sends pack sessions to `exportPackRunPgn`
(`service.ts:1451`), which does **not** export the run: it exports
`exportPgn(combinedRun(pack, run, branchIds))` (`packages/runtime/src/pack-pgn.ts:205`),
and `combinedRun` (`:122-152`) builds a **fresh run** through `createRun`, splicing the
authored spine together with the played paths. Node ids and branch ids are therefore
regenerated, and the final call passes **no `branchIds`** at all. Consequences:

- `position` scope survives intact — `transposeKey` is derived from the FEN, and the
  combined run replays the same positions, so the keys match. This is a third argument for
  position scope being the default, and it was not one of §2.3's three.
- `branch` scope **cannot** match: `` `${branchId}:${nodeId}` `` is built from two ids that
  no longer exist in the exported tree, so every branch-scoped mark vanishes with no
  refusal and no header signal. §3.1's rule *"and only when that branch is in `branchIds`"*
  is also undefined on this path, because `branchIds` is not passed.

**[author round] Finding ratified; the disposition is specified rather than offered as a
choice, because the fallback it offered is no longer available.** The review left two arms —
remap, or declare the omission in the `TabiyaMarks` header — and §3.2's own correction closed
the second one in the same review: that header is now a **constant** string by construction,
and a clause that appears only when marks were dropped is a variable-content clause in a
header criterion 8 pins as invariant after `own (N)`. Silence is refused and header-signalling
is foreclosed, so remapping is the specification. It is also cheaper than the review assumed,
because no map has to be threaded anywhere.

**Normative: the remap is by move path, and the move path is the only identity the transform
preserves.** `combinedRun` reduces both the authored spine and the played branches to
`CombinedPath.moves` — bare UCI sequences — dedupes them by their joined UCI string, and
replays them with `commitMove`, forking at the longest shared prefix; `sharedPrefix` itself
locates a node by walking children whose `moveUci` matches. Node ids, branch ids, seqs and
cursors are all regenerated, but **a node's UCI path from the root survives exactly**, and it
is unique within a tree. So:

1. `exportPackRunPgn` gains the same defaulted trailing `marks` parameter as `exportPgn`.
2. Each `branch`-scoped mark is resolved **against the source run before the combine**, into
   its move path: `historyFrom(run, nodeId).slice(1).map(node => node.moveUci)`, where
   `nodeId` is the node half of `` `${branchId}:${nodeId}` ``. The root is dropped because
   its `moveUci` is `null`.
3. After `combinedRun` returns, each such mark is re-addressed by walking the combined tree
   from its root, matching that UCI sequence one ply at a time by the same child-matching
   rule `sharedPrefix` uses. A completed walk yields the combined node, and the mark's
   rewritten key is `` `${combined.branchId}:${combined.id}` ``.
4. **A walk that cannot complete means the mark's source branch was excluded by `branchIds`**
   — `playedPaths` filters on exactly that set — so the mark is omitted for the same reason
   every move of its branch was omitted, and no signal is owed for it any more than for the
   moves. This is what replaces §3.1's *"and only when that branch is in `branchIds`"* on
   this path: the rule is enforced upstream, in `playedPaths`, rather than at attachment.
5. `position`-scoped marks are **not** remapped and must not be: `transposeKey` is derived
   from the FEN, the combined run replays the same moves from the same start, and §3.1's
   matching rule applies to the combined tree unchanged.
6. **Deduplication is required, and it is `uniquePaths` that makes it required.** Two source
   branches whose move sequences are identical collapse into one combined path, so two
   branch-scoped marks from different source branches can re-address onto the *same* combined
   node. `%csl` and `%cal` have no multiplicity, so identical `{brush, orig, dest}` triples on
   one node are emitted once.
7. The first `exportPgn(run, branchIds)` call is a legality validation whose output is
   discarded; it takes no marks, because validation is about legality, not content.

**One consequence of the combined tree that §2.3's bound paragraph does not cover, and it is
this section's to state.** The combined tree contains **authored spine nodes the learner never
reached**, so a `position`-scoped mark can attach to an authored node whose `transposeKey`
matches — a position that exists in the export but not in the run. §2.3's *"never reach a
position the run did not reach"* is a statement about the **run**, and it stays true there;
on the pack export path the tree is wider than the run by construction. This is accepted
rather than filtered: the artifact carries only the requester's own marks, `transposeKey` is
the product's own definition of the same position, and suppressing the mark on the authored
line would make the PGN disagree with the board the learner would see if they walked that line
in-app. It is stated here so it is a specified behaviour rather than a surprise found in an
export. Criterion 7a covers the pack arm, both scopes and this case; ledgered in the row
*"`exportPackRunPgn` exports a synthesized run with regenerated ids…"*, amended by
*"`combinedRun` preserves exactly one identity — the move path…"*.

### 3.2 Whose marks are exported — the disclosure hole this closes

`RunService.pgn` resolves through **`requireRead`**, so every grant-holder can export the
run: a spectator, a granted teacher, anyone holding a `session_join`-minted grant. Adding
per-author content to that byte stream without a filter would hand a student's private
sketching to anyone who ever watched them, through a route nobody would think to audit.

**Ruling: the PGN carries the marks of the requesting principal, and no others.** It is
the honest artifact — your export is your session including your own thinking — it needs
no non-standard author extension (`%csl`/`%cal` have no author field), and it closes the
hole by construction rather than by a check someone must remember.

Omission is **stated, not simulated** (`design/05:41`). `pgnHeaders` gains one header:

| Condition | ~~Header~~ — **[cross-review] superseded, see below** |
|---|---|
| ~~the principal has marks in the exported tree~~ | ~~`TabiyaMarks: own (N)`~~ |
| ~~the principal has none, and no other author does either~~ | ~~`TabiyaMarks: none`~~ |
| ~~the principal has none or some, and other authors have M more~~ | ~~`TabiyaMarks: own (N); withheld (M)`~~ |

**[cross-review] The header leaks, and in the one session kind §4.2 refuses relay to
protect. The count is a live side channel.**

`RunService.pgn` is `requireRead`-gated and **has no terminal gate** — it exports at any
point in a run (`service.ts:1429-1452`). Both seated players of a `match` session hold
`run_grants` rows on the same run, minted by `session_join` redemption
(`storage.ts:1771-1776`). So:

> A seated player polls `GET /runs/:id/pgn` mid-match and reads
> `TabiyaMarks: own (0); withheld (12)`, then `withheld (17)` a minute later. Marks are
> never relayed in a `match` session — §4.2 refuses exactly this — but the count tells the
> opponent that the other seat has drawn seventeen shapes and is calculating hard on the
> current position. That is D80's seat asymmetry arriving through the export route this
> section opened to close a different hole, and repeated polling turns it into a live
> meter of the opponent's thinking.

The three-row table is also an oracle in its own right, independent of `match`: `none` and
`own (0); withheld (M)` differ **only** in whether some other principal has marks, so a
spectator can determine that a host is or is not annotating without seeing a single shape.

**Ruling: state the filter, never quantify it, and never condition the statement on
whether anything was withheld.** The header carries one count — the requester's own, which
is the requester's own data — and a constant clause:

| Condition | Header |
|---|---|
| always, on every export, whatever any other principal has | `TabiyaMarks: own (N); other authors' marks are not exported` |

`N` may be `0`. The second clause is a **fixed string**, present identically whether other
authors have zero marks or nine hundred, so it carries no bits about anyone else while
still satisfying `design/05:41` — absence is *stated*, and the reader knows the artifact is
filtered. `design/05:41` requires the gap be visible; it does not require it be measured,
and here measuring it is the leak. Criterion 8 is rewritten against this header. Ledgered
in the row *"A withheld-count in a filtered artifact is a side channel…"*.

**[author round] Ratified without reservation — this is the finding I am most glad to have
had taken off me, and both halves of its mechanism reproduce.** `RunService.pgn` resolves
`requireRead` and then branches straight into its three export arms: there is no terminal
check, no `closedAt` check, and no `#refuseWhileMatchLive` call, which the same file *does*
make in `flip`. And `redeemSessionJoinToken` inserts a `run_grants` row for the redeeming
learner, so both seats of a native match are grant-holders on one run and both can call the
route throughout the game. The draft built the header to close a disclosure hole and opened a
narrower, worse one: the original hole leaked *content* to people who already had a grant;
the header leaked a *timing signal* to the one principal the whole session design works to
keep asymmetric. The constant clause is the right repair, and the rule generalizes past this
RFC: **in a filtered artifact, state the filter, never the residue.**

Like `Site`, `TabiyaRun` and `TabiyaSession`, `TabiyaMarks` is re-forced after
`headerOverrides` are applied so a caller cannot spoof it — verified at
`packages/runtime/src/pgn.ts:71-75`, where those three are re-set after the override loop.

`exportPackRunPgn` passes `marks` straight through to its final `exportPgn` call. Its
first, discarded validation call passes none — validation is about legality, not content.

## 4. Leg (b) — relay, and attribution rather than a rung

### 4.1 The rail this rides, and why it is not the other one

Two independent state rails reach a viewer, both over authenticated 2-second REST polling
(no SSE, no WebSocket — a shipped ruling in `docs/live-sessions.md`):

- the **run rail** — `GET /runs/:id/events` → `publicEvents`, carrying chess truth and the
  evidence barrier;
- the **session rail** — `GET /sessions/:id` → `LiveSessionDetail`, carrying roles,
  possession, proposals, votes and match state. It deliberately carries **no FEN and no
  board**, only `activeNodeId`, so that the barrier lives on exactly one rail.

**Relayed marks ride the session rail.** Putting them on the run rail would add
non-run content to `publicRunSnapshot` / `publicEvents`, which is precisely what **I1**
(*run state is viewer-blind; two authenticated readers of one run at one sequence receive
byte-identical run state*) forbids. Riding the session rail leaves all five of I1's named
functions untouched and has a second property worth naming: **relay exists exactly where a
live session exists**, so leg (a) and leg (b) separate along a seam the architecture
already had rather than one this RFC imposes.

The learner's own private marks never traverse the session rail. They arrive on their own
principal-scoped route (§2.6), which adds no viewer parameter to any run projection and is
therefore not a per-viewer disclosure path — it is a different object with a different
rule, and stating that boundary precisely is the point.

### 4.2 Who may relay — the live surface's own governance model, reused

**A mark is relayed iff, at the instant it is written, its author holds the session's board
lease and the session's kind is not `match`.** Both conjuncts are evaluated server-side and
stamped into `run_marks.relayed`; neither is client-supplied.

- **The lease is the reuse.** `BOARD_CONTROLS` (`live-types.ts:6`, four members:
  `free_claim`, `host_directed`, `rotation`, `match`) is how the live surface already
  answers *"who is driving this board"*. Inventing a second "may broadcast" capability
  alongside it would be the two-sources-of-truth class again. The host of an academy
  session and the streamer of a stream session both hold the lease when they are teaching,
  which is the case the owner named.

  **[cross-review] `leaseHeldBy` is not a function and must not be the server-side test.**
  It is a **response field** with three independent structural declarations
  (`storage.ts:79` on `RunSummary`, `service.ts:120` on the run graph, `live-types.ts:102`
  and `:125` inlined) and three construction sites, each resolving
  `stored.activeWriterLearnerId` through `learnerById` for display. The authority is the
  column, not the projection. **Normative: the relay conjunct is
  `stored.activeWriterLearnerId === principal.learnerId`**, read from the same `StoredRun`
  `requireRead` already returned — which is precisely the check `requireWrite`'s second
  layer performs (`authorization.ts:63`), reused without taking its other two layers. §1's
  primitive table is corrected accordingly: the shipped board-possession primitives are
  `drill_runs.active_writer_learner_id`, `BOARD_CONTROLS` and `RunStorage.boardOperation`;
  `leaseHeldBy` is how possession is *rendered*.

  **[author round] Ratified. The draft's conclusion was right and its symbol was fiction**,
  which is the worst combination available: a reviewer checking the conclusion finds it
  sound, an implementer looking the symbol up finds a response field, and the two never
  meet. The corrected test is also the cheaper one — `requireRead` has already returned the
  `StoredRun`, so the conjunct costs one property read and no second query.
- **`match` is refused** because a mark is a plan, and broadcasting a seated player's plan
  to their seated opponent is the D80 seat-asymmetry defect arriving in a new form. It
  **widens no enum** — `live-surface-honesty` §3.2's ruling (*read the enum; do not widen
  it*) is followed, not reopened, and **D81 stays closed**.

  **[cross-review] The count was wrong: this is the ninth site where `kind` is
  behavioural, not the third.** Measured at HEAD — server: `storage.ts:1646` and `:1657`
  (`createLiveSession`'s native-match validation and its `arena_legs` seeding),
  `live-session.ts:74` (`create`'s board-control/kind agreement) and `:225` (`importLeg`);
  web: `App.svelte:456`, `:806`, `:807` (leg invitations and the Arena legs section) and
  `assistance-preference.ts:10` (the `match` assistance profile). Four server, four web.
  The conclusion is unchanged and is arguably strengthened — reading `kind` is a
  well-established pattern rather than a near-unprecedented one — but a count offered as
  evidence has to be the real count.

  **[author round] Ratified: all eight reproduce at HEAD, at those exact lines, and this
  RFC's would be the ninth.** One clarification the recount earns. There is a **second,
  distinct** predicate in the same neighbourhood — `boardControl === "match"`, the *native
  two-player board* rather than the session kind — read at seven further sites (`storage.ts`
  ×3, `live-session.ts` ×3, `service.ts` ×1). The two are **not** interchangeable, and the
  gap between them is a live configuration rather than a hypothetical: `live-session.ts:74`
  refuses a `match` board control on any other kind, so `boardControl === "match"` implies
  `kind === "match"` — but **not** the reverse. An **imported Arena** session is
  `kind: "match"` with a non-`match` board control; that combination is precisely what
  `storage.ts:1657` detects when it seeds `arena_legs`. §4.2's conjunct is on **`kind`**
  deliberately: an implementer who reaches for the nearer-looking `boardControl` would relay
  a seated player's marks inside every imported-Arena contest, which is the exact defect the
  refusal exists to prevent. Ledgered in the row *"`kind === "match"` and `boardControl ===
  "match"` are not interchangeable…"*.
- **`relayed` is stamped at write time, not evaluated at read time**, and the choice
  matters in both directions. A read-time rule would (i) make a host's teaching marks
  vanish the moment they hand the board over, and (ii) retroactively publish everything a
  spectator scribbled privately the moment they were later granted the lease — a real
  leak arriving through a promotion rather than a mint, which is the failure shape
  `teacher-surface` §4.3 catalogues for `expires_at`. Write-time stamping mirrors
  `deriveMoveAuthorship`'s shipped rule, which anchors authorship to the possession state
  at the run sequence rather than to possession now.
- A relayed mark is **not** retroactively unrelayed when the lease moves: it *was*
  relayed, and pretending otherwise would be a lie about what viewers saw. The author can
  erase it (`PUT` with the shape removed), which deletes the row.
- **Relayed marks are shared, not per-viewer.** Every viewer of the session sees the same
  set. I1's spirit is preserved even though marks are not run state.

**No `session_journal` entry is written for a mark.** `SESSION_JOURNAL_KINDS` is a
16-member closed SQL CHECK vocabulary; widening it is a table rebuild on migration 14's
shape, and the journal is polled from `sinceSeq=0` every two seconds, so a per-gesture
journal kind would flood the one surface that is already refetched in full. Marks are
board state, not possession history.

### 4.3 The projection, and the attribution model

`LiveSessionDetail` gains one field, declared in **both** `apps/server/src/live-types.ts`
and the client mirror `apps/web/src/lib/api.ts`, per the shipped rule that a projection
declared twice must not drift:

```ts
export interface RelayedMark {
  readonly scope: "position" | "branch";
  readonly brush: MarkBrush;
  readonly orig: string;
  readonly dest?: string;
  readonly drawnBy: LeaseIdentity;   // { learnerId, handle }
  readonly at: string;
}
// LiveSessionDetail gains:
//   readonly marks: readonly RelayedMark[];
//   readonly marksTruncated?: true;
```

- **The projection is scoped to the active node**, which bounds the 2-second poll. The
  detail already carries `activeNodeId` and the service already reads the run to resolve
  it, so it has everything it needs: include a relayed mark iff its `scopeKey` equals the
  active node's `transposeKey` (position scope) or `` `${activeCursor.branchId}:${activeNodeId}` ``
  (branch scope). No `scopeKey` is projected — a viewer needs the shapes, not the keys.
- **`drawnBy` is a `LeaseIdentity`**, resolved with `RunStorage.learnerById`, following the
  `voteAdapter` idiom exactly. No new identity type is introduced. **[cross-review]** the
  server-side declaration is in **`apps/server/src/storage.ts:64-67`**, not
  `live-types.ts` as the design refs and §1 state — `live-types.ts:1` *imports* it and uses
  it at `:103` for `voteAdapter`. The client mirror is `apps/web/src/lib/api.ts:91-94`, so
  the "declared twice" rule holds; only the server file name was wrong. Note also that
  `LiveSessionDetail.leaseHeldBy` and `LiveBoardSummary.leaseHeldBy` inline the same shape
  rather than reusing the imported type one line away — `RelayedMark.drawnBy` uses the
  named type, not the inline literal.
- **[cross-review] The projection discloses no identity that is not already disclosed.**
  `LiveSessionDetail` already carries `grants` — the full `RunGrant[]` with handles — to
  every granted viewer (`live-session.ts:105`), so `drawnBy` adds attribution to shapes the
  viewer is already receiving, not a new identity surface. Recorded because §4.3 asserts
  I1/I4 compliance without saying why the new handle is safe.
- Cap the projection at **128 marks, newest first**, setting `marksTruncated: true` when
  it bites. The cap is a poll-cost bound, not a policy; it is stated rather than silent.
  **[author round] The bound was asserted without its cost, which is the same fault §5.1 was
  returned for.** Measured: one `RelayedMark` with a UUID-bearing `learnerId` and a
  twelve-character handle serializes to **186 bytes**, so a saturated projection is
  **23.4 KiB** and the 2-second poll costs **11.7 KiB/s per viewer** *for the marks alone*,
  on top of the grants, journal and match state the detail already carries. That is
  acceptable for an academy room and is the reason the cap exists at all; it is also the
  number to revisit before anyone proposes raising it, and it is why §4.3 projects no
  `scopeKey` — the keys would add roughly a third again for data no viewer can use.

**The rendered attribution line**, on both the session page and the chrome-free overlay,
following `voteAttribution`'s shipped four-branch table and its lesson that the
unreachable arm is kept rather than dropped:

| Condition | Line |
|---|---|
| no relayed marks at this position | *(nothing — there is no mark to attribute)* |
| all by one author, who resolves | *"Marks drawn by @handle."* |
| by two or more authors, all resolving | *"Marks drawn by @a and @b."* (handles joined) |
| any author does not resolve | *"Some marks were drawn by an account that no longer exists."* |
| `marksTruncated` | append *"Showing the 128 most recent."* |

The fourth row should be unreachable, because §5.4 deletes a departing learner's marks
inside `deleteLearner`'s transaction. It is kept for the reason `live-surface-honesty`
§5.1 kept its own unreachable arm: a future revocation path that unsets authorship
differently must not be able to reintroduce the defect silently.

**Law 8, and the honesty invariants.** The line renders persisted facts — a stored square
pair, a brush name, a handle. It makes no chess claim, grades no move and is not generated
text. Against the four invariants:

- **I1 — untouched.** No viewer parameter is added to `feedbackDisclosed`,
  `feedbackDeliveryOpen`, `publicRunSnapshot`, `publicNodes` or `publicEvents`. Relayed
  marks are identical for every viewer of the session.
- **I2 — untouched.** `permittedAssistance` gains no field and no cell changes; the
  monotonicity test in `client-surface-floor.test.ts` passes byte-unchanged. A relayed
  mark is not assistance: the product is not the one making the claim.
- **I3 — deliberately not applied, on shipped precedent.** A relayed mark is **not** gated
  by `feedbackDeliveryOpen`, because a host's mark is a *person's* claim and the product's
  barrier governs product-generated evidence. This is not a new position: a vote option's
  `label` is already *"attributed human text from the host, never generated and never a
  claim about the position"* (`live-surface-honesty` §5.2), the chat relay already carries
  unverifiable human text, and `design/05` §3-forms rules that **form attaches to neither
  honesty nor timing**. A host who wants to tell their audience something can already say
  it; drawing it changes the form, not the source. The accepted limitation in
  `docs/live-sessions.md` — *"it does not pretend to prevent a host from cheating on
  themselves"* — covers the residue and is unchanged.
- **I4 — met by the table above**, including the truncation line and the
  no-longer-exists arm.

## 5. Persistence cost, lifetime and deletion

### 5.1 The bound, and its refusal

Marks are unbounded user input arriving by gesture. Two caps, both per author so one
member of a classroom cannot exhaust another's budget:

| Bound | Value | Where |
|---|---|---|
| shapes per `(run, author, scope, scope_key)` | **64** | one per square; past this the board is unreadable and the intent is not annotation |
| marks per `(run, author)` | **1,000** | **[author round] 155–198 KiB** depending on scope — not the ~70 KB first stated, nor the review's 154 KB — on a route fetched once per run load, not polled |
| shapes in one `PUT` body | **64** | equal to the per-key cap, so a legal body can never be a refused write |

**[cross-review] The 1,000-mark figure was measured, and it is 2.2× the stated one.** One
serialized position-scoped `RunMark` — `{scope, scopeKey, brush, orig, dest, at}` with a
four-field FEN key — is **158 bytes** of JSON (`{"scope":"position","scopeKey":"rnbqkbnr/
pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -","brush":"green","orig":"e2","dest":"e4",
"at":"2026-08-16T12:00:00.000Z"}`), so the bound is kept at 1,000 — a once-per-run-load
fetch of that size is still the right trade, and halving the cap would bite a real
classroom before the transfer cost bites anything — but the number the bound is justified
by has to be the measured one.

**[author round] The per-mark measurement reproduces; the two figures derived from it do
not, and one of them is backwards.** Re-measured by serializing the objects rather than
estimating them:

| Quantity | Review | Measured |
|---|---|---|
| one `position`-scoped mark | 158 bytes | **158 bytes** ✓ |
| 1,000 of them, as the array the route returns | 154 KB | **159,001 bytes = 155.3 KiB** (the review counted objects and dropped the separators) |
| one `branch`-scoped mark | 133 bytes — *"shorter"* | **202 bytes — longer** |
| 1,000 of them | 130 KB | **198.2 KiB** |
| a 64-shape `PUT` body | ~10 KB | **2,769 bytes = 2.7 KiB** |

The branch inversion is the one that matters, and its cause is a fact about the runtime the
review did not check: ids are `` `${run.id}:branch:${n}` `` and `` `${run.id}:node:${n}` ``
(`createRun`, `commitMove`), so the composite key **embeds the run id twice** — 98 characters
against a four-field FEN key's 52. A `branch`-scoped mark is the *expensive* one, not the
cheap one. The bound stands at 1,000 either way: **198 KiB worst case on a fetch that happens
once per run load** is still the right trade, and the figure is now the measured worst case
rather than an estimate of the best. The `PUT` cap is comfortable by a wider margin than the
review credited: 64 shapes is under 3 KiB, so the body cap is a correctness bound, not a
transfer one. The id-shape finding is ledgered in the row *"Ids in this runtime are
path-shaped…"*, because it prices every future composite key, not only this one.

The client disables further drawing at the per-key cap and says so; the server refuses the
over-cap `PUT` with `INVALID_REQUEST` as a backstop. **[cross-review] `INVALID_REQUEST` is
confirmed the zero-friction choice:** it is a shipped `ServerErrorCode`
(`apps/server/src/errors.ts:7`, HTTP 400) already present in the test corpus, so
`refusal-coverage.test.ts`'s `expect(missing).toEqual(debt)` assertion over
`refusal-debt.fixture.json` is unmoved by an Nth use. Minting a new code would enter
`fixedCodes` and fail that assertion until it was both tested and added to two fixtures —
which is a second, independent reason §8 declines `MARK_LIMIT_EXCEEDED`. This is `live-surface-honesty` §5.2's
rule applied unchanged: *the client never re-implements the check, it only stops offering
the control.*

**A bound is genuinely needed here even though the product has an unbounded precedent.**
`reasoning.recorded`'s transcript is free-form learner prose stored in the run event log
with no length check anywhere. That is a per-checkpoint, deliberately-typed, low-frequency
artifact; a mark is a per-gesture, per-position, high-frequency one that is also
*projected into a two-second poll* for every viewer. The precedent does not transfer and
naming why is cheaper than inheriting it.

### 5.2 Reload

Own marks are server-side rows keyed by `(run_id, author_learner_id)`, so they survive a
page reload, a browser restart and a change of device — unlike the assistance preferences,
which are `localStorage` by design. Relayed marks likewise survive; a viewer joining a
stream mid-session sees whatever the lease-holder has drawn on the current position, which
is the behaviour a late-joining audience needs.

The one client-local piece is the **scope toggle's** current setting (§2.3), which is a
preference, not data, and follows the `assistance-preference.ts` idiom.

### 5.3 Per-viewer or shared

Own marks are per-author by construction. Relayed marks are **shared** — every viewer of
the session receives the same set. There is no per-viewer mark projection and this RFC
proposes none.

### 5.4 Account deletion

`RunStorage.deleteLearner` gains one clause, inside its existing `BEGIN IMMEDIATE` and
**before** `DELETE FROM learners`: **delete every `run_marks` row whose
`author_learner_id` is the departing learner.**

**[cross-review] The insertion point is exact and the "before `DELETE FROM learners`"
phrasing needed narrowing.** `deleteLearner` is `apps/server/src/storage.ts:989-1049`.
`DELETE FROM learners` is at `:1038` and is **not** the last statement — an
`INSERT OR IGNORE INTO run_grants … 'host'` loop restoring sole-host runs to `LEGACY_ID`
follows at `:1039-1042`, then `COMMIT` at `:1043`. The mark delete belongs between the
`UPDATE live_sessions SET created_by` at `:1036` and the learner delete at `:1038` — the
tail of the reassignment block. Placing it after `:1038` would still be inside the
transaction and would still work, but it would sit in the post-delete restore block whose
whole reason for existing is that it must run *after* the FK cascade, which is a different
concern.

**[author round] Ratified on the structure, and the line numbers are struck out on
principle.** The shape reproduces exactly: one `BEGIN IMMEDIATE`, a reassignment block
ending in `UPDATE live_sessions SET created_by`, then `DELETE FROM learners`, then the
`INSERT OR IGNORE INTO run_grants … 'host'` restore loop, then `COMMIT`. The numbers have
already moved by one since the review — the learner delete sits a line earlier at HEAD — in
a file nobody edited for this RFC's sake. **Normative, stated so it cannot drift: the mark
delete is the last statement of the reassignment block, immediately before
`DELETE FROM learners` and inside the same transaction.** That sentence survives every
future edit to `storage.ts`; `:1038` did not survive a day.

Delete, not reassign, and the choice is between two shipped precedents. `registered_packs`,
`pack_drafts`, `shape_drafts` and `live_sessions.created_by` are all reassigned to
`LEGACY_ID`, because a published pack is an artifact that must survive its publisher.
Repertoires are deleted row-by-row through `#deleteRepertoireRows`, because a repertoire
is one person's private working state. **A mark is the second kind**: it is a thought, not
an artifact, nobody inherits it, and a `LEGACY_ID`-authored relayed mark would render on a
public overlay under a handle that resolves to nothing — the exact defect §4.3's fourth
render arm exists to catch. Deleting closes it at the source.

A schema test asserts no column in this RFC declares a foreign key against `learners(id)`
(§9), so the cascade that `teacher-surface` §4.1a found stranding grants cannot recur here.

## 6. Deviations from design

1. **`design/05` §3-forms' *"Board overlays — arrows & piece halos"* row is one row
   carrying three legs at 💡.** This RFC ships legs (a) and (b) and leaves (c) with its
   named gap. The row should be **split into three, not flipped**, so leg (c) survives the
   completion of the other two with a row of its own. `design/` is owner tier: the
   proposed edit is **reported here and in §8, not made** (law 5).
2. **`design/05` §3-forms says `AssistanceConfig` *"grows to pick forms per context too
   (`boardLighting`, arrows, spoken…)"*.** This RFC adds no form field to
   `AssistanceConfig`, because the same section rules that forms (a) and (b) are not
   assistance settings. The sentence describes leg (c)'s future, which is
   `format-surface`'s; recorded so the gap is not silently attributed here.
3. ~~**`requireRead` gates a write route** (§2.6), which departs from the `requireWrite`
   idiom every other mutating run route follows.~~ **[cross-review] Withdrawn — this is not
   a deviation and the claim it rested on is false.** *"Every other mutating run route
   follows `requireWrite`"* is wrong: seventeen shipped mutating methods gate on
   `requireRead` (§2.6 rule 1). The shipped invariant is *touch the `DrillRun` graph ⇒
   `requireWrite`; everything else ⇒ `requireRead` plus a capability predicate or a
   principal-keyed object*, and the mark routes satisfy it without an exception. Listing it
   as a deviation would have invited a reviewer to relitigate a settled idiom, and would
   have left the *actual* authorization question — which principals `requireRead` admits,
   answered in §2.6 rule 1a — looking as though it had been addressed.

   **[author round] Withdrawal accepted.** The draft asserted *"every other mutating run
   route follows `requireWrite`"* from having read `requireWrite` rather than from having
   counted its callers, and it is false by eighteen. One qualification carried over from
   §2.6: the idiom is a majority, not a unanimity, and the ledger row on `RunService.flip`
   is an open defect of exactly this shape — so *"other routes do it"* is not on its own a
   licence. The licence is the invariant (**run graph ⇒ `requireWrite`**), which marks satisfy
   and `flip` does not.

Otherwise: none.

## 7. Boundaries against the three sibling documents

| Document | Status | Boundary |
|---|---|---|
| `rfc/format-surface.md` | **accepted**, conditional on two owner rulings | Owns `assistance:arrows` and leg **(c)**. This RFC adds no `AssistanceConfig` field, reads `assistance.arrows` nowhere, constructs no system-drawn shape, and changes no `FORMAT_DISPOSITIONS` row. `format-surface` may take its `unmeasured` disposition with the named gap (*the structural reader emits square sets, not vectors*) with **zero interaction** with this document, in either landing order. What it may **not** do is retire the field — that is the owner's ruling, not this RFC's claim. |
| `rfc/archive/live-surface-honesty.md` | **implemented** (`f2be4ed`) | Owns **I1–I4** and the ceiling/preference partition. §4 is checked clause-by-clause against all four (§4.3) and changes none of them. It reuses that RFC's `LeaseIdentity` projection idiom and its four-branch render table rather than inventing an attribution model. It touches neither `permittedAssistance` (the ceiling) nor `assistanceProfile` / `ASSISTANCE_PROFILES` (the preference), so **D81, D82 and D83 stay closed** and none is reopened. |
| `rfc/teacher-surface.md` | **draft, owner-blocked**, holds the earlier **position** in the migration landing order | Owns classroom identity, `classrooms` / `classroom_members` / `assignments` / `assignment_submissions`, `run_grants.expires_at`, `live_sessions.classroom_id`, and the `AssistanceContext.seatedInContest` narrowing. This RFC touches **none** of those and introduces **no `member_role`, no roster and no standing relationship** — a mark is per-run, ephemeral to a run, and confers nothing. Two collisions are checked: (i) **[cross-review] the migration collision is NOT clear** — the two share no table, but the loop's `migration.version <= version` skip means a database that reaches 23 can never receive 22, so an unconditional 23 would permanently strand `teacher-surface`'s migration on every existing database. **[author round] The register has since instituted the rule that follows from that finding, and this row is rewritten against it rather than against the review's interim fix.** `rfc/README.md` now assigns migration numbers **at landing, not at claim**; a draft claims a *position in the landing order* and takes `STORAGE_VERSION + 1` when its implementing commit is written. So this RFC **reassigns nothing and names no integer**: `teacher-surface` holds the earlier position, whichever of the two lands first takes the next free number, and the other renegotiates in the register — which is the register's own instruction to an implementer who finds the next number taken. The review's *"reassign `teacher-surface` to 23 and take 22"* was the right instinct against the wrong constraint: it was still one draft telling a sibling draft to move, which is the thing the landing-order rule makes unnecessary. No edit to `teacher-surface`'s row is proposed by this document; (ii) `teacher-surface` §4.3 enumerates **nine readers of `run_grants`** and makes a tenth-without-a-case a test failure — **this RFC introduces no direct `run_grants` query**, reaching grants only through `requireRead` → `runRole` (its site 1) and through `LiveSessionService.detail` (already covered), so the expiry enumeration is unaffected and its criterion 7 still passes. If `teacher-surface` lands first, marks written by a teacher whose grant later expires become unreadable to them at site 1, which is the correct behaviour and needs no code here. |

## 8. Register claims — stated loudly

**Drift correction, verified at HEAD (`1b89123`) and load-bearing for every row below:**
the drafting brief recorded `STORAGE_VERSION` as **20** with migration 21 in flight.
`engine-leverage`'s migration 21 has since landed: `STORAGE_VERSION` is **21**,
`DRILL_RUN_SCHEMA_VERSION` is **`"0.16"`** and `DRILL_PACK_SCHEMA_VERSION` is **`"0.23"`**.
Migration 22 remains `teacher-surface`'s (claimed, owner-blocked, unlanded). ~~**23 is free
and this RFC claims it.**~~ **[cross-review] withdrawn — see *Why the 23-with-a-hole claim
is withdrawn* below the register table.** All three version constants are re-verified at
this review's HEAD (`a7e700d`): `STORAGE_VERSION = 21` (`storage.ts:387`),
`DRILL_RUN_SCHEMA_VERSION = "0.16"` and `DRILL_PACK_SCHEMA_VERSION = "0.23"`
(`packages/schema/src/index.ts:1-2`).

**[author round] Two rounds of drift correction in one document is the evidence, not the
accident, and this section stops quoting integers because of it.** Re-verified at
`7650d41`: `STORAGE_VERSION` is still 21 and `DRILL_RUN_SCHEMA_VERSION` is still `"0.16"`,
but **`DRILL_PACK_SCHEMA_VERSION` already reads `"0.24"` in the working tree** —
`vocabulary-wiring`, accepted and first in the codex lane order, is mid-implementation as
this is written, and `format-surface` (0.25) and `claim-backing` (0.26) queue behind it. The
draft was written against 20, the cross-review against 21, and the pack constant moved
between the review and this round. A shared, monotonic integer is *not a fact a document can
hold*; it is a fact the tree holds, and the only correct thing a draft can write down is its
**position in the order** plus the expression that resolves the number at landing. That is
now the register's rule for migrations, and this section applies the same discipline to
every version constant it mentions: each row below states what it does **not** move, and no
row asserts a number this RFC would have to be re-edited to keep true.

| Register | Claim |
|---|---|
| **Migration** | **[author round] A POSITION in the landing order, not a number. The number is `STORAGE_VERSION + 1`, read by the implementing commit at the moment it is written, and this document names no integer.** This RFC's position is **behind `teacher-surface`'s** — that draft claimed first and is owner-blocked, not withdrawn — but the position is a claim on *the next free slot at its turn*, so if this lands first it simply takes the next number and `teacher-surface` renegotiates in the register, per `rfc/README.md`'s instruction to an implementer who finds the next number taken. See the block below this table. Creates `run_marks` plus two indexes; adds one clause to `deleteLearner`. **Create-table/index only — no table rebuild, no backfill, no snapshot rewrite**, on the migration-15 (`repertoire-gap-finding`) and migration-10 (`shape-library`) precedent rather than migration 14's rebuild. It runs in the migration loop's ordinary `BEGIN IMMEDIATE` arm with **neither** `PRAGMA foreign_keys = OFF` nor `legacy_alter_table = ON` — that arm is `migration.version === 14` only. CHECK vocabularies are literal strings, never interpolated from the live TS constants |
| **Run schema** | **none.** **[author round]** The constant reads `"0.16"` at HEAD and the claim is that this RFC does not move it, whatever it reads at landing. `DrillRun` gains no field, `DrillRunEvent` gains no member, and `projectRun` gains no case. This is the whole of §2.2's isolation argument and it is a register fact, not only a design one: because the run schema does not move, `RunStorage.read`'s `schema_version = ?` filter keeps every stored run visible and **no stamp is required** |
| **Pack schema** | **none, and no version is quoted.** No pack document changes, no `$defs` are touched, no digest moves, and there is therefore no rebase pressure on the pack lane in either direction. **[author round]** The constant read `0.22` when this was drafted, `0.23` at the cross-review and `0.24` in the working tree now, with 0.25 and 0.26 claimed ahead of any date this could land — which is exactly why the claim is *"none"* and not *"stays at N"*: **"stays at N" is a claim that expires; "changes nothing" is not** |
| **Assistance ceiling** | **none.** `AssistanceConfig`, `SILENT_ASSISTANCE`, `AssistancePermission`, `AssistanceContext` and `permittedAssistance` are untouched. `rfc/live-marker-quality.md` owns that table and its four enforcement sites; this RFC lands in any order relative to it |
| **Assistance preference** | **none.** `ASSISTANCE_PROFILES`, `assistanceProfile` and `assistanceKey` are untouched; no new `localStorage` version arm is added |
| **Session vocabulary** | **none.** `SESSION_KINDS` keeps its three members, `BOARD_CONTROLS` its four, `RUN_ROLES` its three, `SESSION_JOURNAL_KINDS` its sixteen. §4.2's `match` refusal reads the shipped enum; it does not widen it |
| **Token surface** | **none.** `public_tokens` keeps its two shipped scopes |
| **Refusal codes** | **none.** Every refusal in this RFC is `INVALID_REQUEST`. Considered and declined: minting `MARK_LIMIT_EXCEEDED` on the `REPERTOIRE_IMPORT_LIMIT` precedent. That code exists because a repertoire import is a *bulk* operation whose partial failure needs a distinct client message; a single over-cap mark is a control the client should already have stopped offering, so a dedicated code would add a versioned union member to describe a state the UI is specified never to reach |
| **PGN header namespace** | **`TabiyaMarks`**, joining the shipped `TabiyaRun` / `TabiyaSession` / `TabiyaPack` set and re-forced after `headerOverrides` like the first two |
| **Ledger rows this RFC ships** (shared register; **flipped by the implementing commit**, not by this draft) | *"Learner-drawn board annotation — one boolean, and it is nobody's"* — **closed** by §2–§3. *"`arrows` is THREE different things sharing one field name…"* — legs (a) and (b) close here; **the row should be split, not closed**, so leg (c) survives with a row of its own and `format-surface` keeps its subject. **D183–D188** (§10) — opened by this draft; **[cross-review] D213–D219** (§10) — opened by the cross-review, from block D213–D222; **[author round] D247–D252** (§10) — opened by this return round, from block D247–D256 |
| **`rfc/README.md`** | **not edited by this draft**, per the drafting instruction — **[author round] and not by this round either**, though the register now carries the landing-order rule this RFC's review produced. Whoever accepts this RFC adds two things in the accepting commit: an **Active table row**, and a **migration-register row bearing the number the implementation actually took** (`STORAGE_VERSION + 1` at that moment). No reassignment note is owed unless the implementer had to renegotiate a position, in which case the register's own instruction governs the note |

### [cross-review] Why the 23-with-a-hole claim is withdrawn

The half of the mechanism the draft checked is sound: the migration loop iterates a literal
array and skips `if (migration.version <= version) continue`
(`apps/server/src/storage.ts:2197-2199`), so applying a 23 to a database at 21 runs cleanly
and sets `user_version = 23`. **The unchecked half is fatal.** That same line means a
database that has reached 23 will **skip migration 22 forever** — `22 <= 23`. If this RFC
lands 23 first and `teacher-surface` is later unblocked, its four tables,
`run_grants.expires_at` and `live_sessions.classroom_id` are created on **fresh databases
only**; every database that ran 23 never receives them, silently, with no error at open
(`#migrate` only throws on `version > STORAGE_VERSION`, the opposite direction). The hole
is not a gap waiting to be filled — it is a permanently unfillable slot, and *"applying 23
to a database at 21 is mechanically sound"* is true and answers the wrong question.

The register's own practice already refuses holes and had done so twice by the time this
was drafted: migration 16 was *"rebased from an initial 15 claim"*, and 21/22 were
**reassigned to each other on 2026-08-16** — `engine-leverage` from 22 to 21,
`teacher-surface` from 21 to 22, with the note *"backfill-free, so the reassignment costs it
nothing but text."* Every one of the 22 register rows is contiguous. A hole would be this
register's first.

**Resolution, normative — [author round] rewritten, because the register answered this
between the review and this round and its answer is stronger than the review's.**
`rfc/README.md` now carries the rule: **migration numbers are assigned at LANDING, not at
claim.** A draft claims a *position in the landing order*; the number is `STORAGE_VERSION + 1`
at the moment the migration lands; an implementer who finds the next contiguous number
already taken renegotiates in the register rather than skipping. Against that rule:

- **This RFC claims a position, not an integer.** It does not claim 22, it does not claim 23,
  and no number in this document needs re-editing when the tree moves. The implementing
  commit reads `STORAGE_VERSION`, adds one, and writes that number into the migration array
  and the register row together.
- **It claims the position *behind* `teacher-surface`,** which claimed first and is blocked
  rather than withdrawn. That is a statement about courtesy and order, not about integers: if
  `teacher-surface` is still blocked when this is implemented, this takes the next free slot
  and `teacher-surface` renegotiates its position at *its* turn — a renegotiation that costs
  it nothing, because it is backfill-free, and that its own 21→22 move already demonstrated.
- **What is forbidden is unchanged and is the whole point:** never claim a number above an
  unlanded one. `migration.version <= version` makes the skipped slot permanently unfillable
  and silent — `#migrate` throws only in the opposite direction, on `version >
  STORAGE_VERSION` — so the hole is discovered as *"the classroom tables are missing on every
  database older than the fix"*, months later, with no error to trace it by.
- **The instruction that produced the hazard came from the coordinator, not from this
  draft**, and it is recorded here rather than quietly dropped: this RFC was told to claim 23.
  A rule now exists so the next draft cannot be told the same thing. That is the correct
  disposition of a process defect found by a review — a rule in the register, not a fix in
  one document.

Note also the draft's own register row read *"`STORAGE_VERSION` 22 → 23"* while the paragraph
above it correctly said 21 — an arithmetic that only works in the world where 22 had already
landed, and a second-order symptom of writing an integer into a document at all. Ledgered in
the row *"A skipped migration number is a one-way door…"*, amended by *"A draft that writes a
shared monotonic integer into its body has written a claim with an expiry date…"*.

**Criterion 21 carries the assertion that would have caught this at review time**: the
migration array's versions are exactly `1..STORAGE_VERSION` with no gap. It is four lines of
test and it converts the entire class — not this instance of it — from a review-time judgement
call into a build failure.

## 9. Acceptance criteria

**Isolation — the load-bearing ones:**

1. **`DrillRun` gains no field and `DrillRunEvent` gains no member.** A test asserts the
   event union is exactly its shipped 16 members (verified at HEAD:
   `packages/runtime/src/types.ts:278-294`) and `DRILL_RUN_SCHEMA_VERSION` is `"0.16"`. A
   **static** test enumerates every symbol in `packages/runtime/src` that accepts a mark
   parameter and asserts the set is exactly **[cross-review]** `{ exportPgn,
   exportPackRunPgn }` — corrected from `{ exportPgn }`, which contradicted §3.2's own
   pass-through and would have failed on day one. A third consumer fails the build rather
   than passing review. **[cross-review] The mechanism is new and must be specified as
   text, not AST:** no signature- or arity-enumerating test exists in the tree, and the
   nearest shipped precedent is source-text grepping —
   `apps/server/src/expression-census.test.ts:107-116` asserting `toContain`/`not.toMatch`
   over a file read as a string, and `refusal-coverage.test.ts:31-49` walking the tree the
   same way. A regex cannot see through a `Parameters<typeof exportPgn>` alias or an
   options-bag field, both of which this codebase uses, so the criterion is met by grepping
   for the **`RunMark` type name** across `packages/runtime/src` and asserting the set of
   files mentioning it is exactly `{ index.ts, pgn.ts, pack-pgn.ts, types.ts }`; `index.ts`
   is the public type re-export, not a consumer.
2. **No grading path can observe a mark.** A run is played to a graded outcome twice from
   identical inputs, once with 64 marks written at every node and once with none. The
   resulting `DrillRun` projections, objective states, trajectory verdicts, deviation
   detections, tempo verdicts, guard firings, structural readings, compare strips and
   `evidencePacket` outputs are **byte-identical**. This is the whole safety argument
   expressed as one test.
2a. **No mark-derived value reaches the voice allowlist. [author round] Rewritten, because
   the version the review proposed inherits criterion 2's own defect: it cannot fail on the
   thing it guards.** A source grep pinned to four assembly sites and two splice sites is
   blind to the violation's natural shape, which is a *seventh* line spliced in next to them
   — and its line numbers are stale already. The replacement has three parts, and the third
   is what makes the first two trustworthy:

   **(i) Behavioural, at the layer the breach happens on.** Drive the real voice route for a
   run in which the requesting principal has marks. Choose the marked square **by
   construction**: scan the assembled packet's `sentences` and pick any of the 64 squares
   that does not occur in `sentences.join("\n")` **as a substring** — substring, not
   word-boundary, because `voiceCheck` admits tokens with `String.includes`, per the ledger
   row *"`voiceCheck` is a token filter…"* (2). Draw a mark on that square, re-run the route,
   and assert `voiceCheck(packet, "<square>")` still reports the violation `square:<square>`.
   Splice marks into `sentences` anywhere at or below the route and this assertion goes red.
   It is the same assertion for the story-aware arms, which are the two that already splice.

   **(ii) A census, so a new splice site cannot arrive unseen.** In the
   `expression-census.test.ts` source-idiom: the set of expressions in `rest.ts` that
   construct or extend an `EvidencePacket`'s `sentences` is pinned to an inventory, matched
   by pattern rather than by line number, and a new one fails the build until it is added
   deliberately. Adding one is then a review event, which is all this net is for.

   **(iii) A positive control, asserted in the same test.** The same predicate, run against a
   packet whose `sentences` **do** contain the square, must report **no** violation. Without
   this the suite cannot distinguish *"the barrier holds"* from *"the assertion is
   inoperative"* — which is precisely the failure this criterion replaces. A guard test that
   has never been shown to go red is not evidence.

   Scope note: the claim being tested is narrow and stays narrow. `voiceCheck` binds chess
   **tokens**, not propositions; this criterion asserts that a learner's chosen square is not
   made speakable, and asserts nothing about prose, which that same ledger row shows
   `voiceCheck` does not govern.
3. **A mark cannot break replay.** **[cross-review] restated — the scenario the criterion
   named cannot be constructed.** `commitMove` emits `move.committed` and `outcome.reached`
   in a single `appendEvents` drafts array (`runtime.ts:346-351`), so there is no interval
   between them to write into. What the test asserts instead: a run is driven to a terminal
   outcome, through a checkpoint/segment pair, and through an opponent
   selection-then-commit pair, with mark `PUT`s issued **before and after each of the three
   pairs and concurrently with the whole sequence**; the run reloads through
   `readBackReplay` byte-unchanged and `appendEvents` is never called with a mark. Kept as
   the regression guard against anyone later moving marks into the event log — the failure
   §2.1(1) documents, whose real shape is a write-time `TypeError` that discards the
   learner's gesture.
3a. **[author round] The adjacency gaps stay closed only while the emitters stay
   synchronous, and that is now asserted.** `reachCheckpoint` emits `checkpoint.reached` and
   `segment.completed` through **two separate `appendEvents` calls**, with nothing between
   them but straight-line code; the pairing survives on the absence of an `await`. A source
   test asserts that **no function in `packages/runtime/src` that calls `appendEvents` more
   than once is `async` or contains an `await` between those calls**, with a positive control
   proving the predicate detects a planted violation. It fails the moment an emitter is made
   asynchronous — which is the change that would open a gap for an unrelated write to land
   in, and the only change that can. This asserts a property this RFC *depends on* rather
   than one it creates; it is claimed here because §2.1's whole argument leans on it and an
   unasserted load-bearing property is a debt whoever leans on it should pay.

**Scope:**

4. A `position`-scoped mark drawn at node N is present after rewinding to N, and is
   present at a node on a **different branch** whose `transposeKey` equals N's. A
   `branch`-scoped mark at N on branch B is present at N on B and **absent** at N after
   forking to branch B′. Both directions, in one test.
5. The default scope of a mark drawn with no explicit setting is `position`. Re-scoping
   the current node's marks moves every one of this author's marks at that node to the
   other scope and touches no other author's rows and no other node.
4a. **[cross-review] The branch-scope return path.** A `branch`-scoped mark at N on branch
   B, after a fork to B′ and a rewind back to N, is **absent** — because `rewind` keeps the
   cursor's branch id when the target is an ancestor (`runtime.ts:398-400`) — and is
   **present** again after a rewind that lands off the current path and restores
   `target.branchId`. Asserted so the history-dependence §2.3 documents is a pinned
   behaviour rather than a surprise.
6. The server derives `scope_key` and ignores any client-supplied key: a `PUT` naming an
   unknown `nodeId` or `branchId` returns `INVALID_REQUEST` and writes nothing.
   **[cross-review] and a `PUT` pairing a real `branchId` with a real `nodeId` that does
   not lie on `branchPath(run, branchId)` is likewise refused `INVALID_REQUEST`** —
   `requireBranch` alone checks only existence (§2.6 rule 2).
6a. **[cross-review] No token-derived principal can write a mark.** A `story_read` token,
   which passes `requireRead` **as its creating host** through `publicStory`'s fabricated
   principal (`service.ts:570`), reaches no mark route: asserted by driving
   `GET /api/shared/:token/story` and confirming no `run_marks` row can be created by any
   token-scoped request path. A `session_join` redemption, which mints a real `run_grants`
   row (`storage.ts:1771`), **may** write marks as the redeeming learner — that is correct
   and is asserted in the same test so the two are distinguished rather than conflated.

**PGN:**

7. A run with marks exports a PGN whose comments contain `[%csl …]` for every circle and
   `[%cal …]` for every arrow, produced by `makeComment` and **not** by hand-written tag
   text. `parseComment` round-trips every emitted shape back to the same `{color, from,
   to}`. Root-position marks appear in `Game.comments`, before the first move.
   `startingComments` still carries `Tabiya branch: <label>` unchanged, on the same runs.
7a. **The pack export path carries marks. [author round] Tightened to the specification
   §3.1 now gives, which admits one outcome rather than two.** A pack-session run with marks
   of both scopes exports through `exportPackRunPgn` → `combinedRun` and:
   (i) every `position`-scoped mark is present, unremapped, at every combined node whose
   `transposeKey` matches — **including a node on the authored spine that the run never
   reached**, which §3.1 specifies rather than filters;
   (ii) every `branch`-scoped mark whose source branch is in the exported set is present at
   the combined node reached by replaying its source **UCI path** from the root, and the
   remap is asserted against a run where node and branch ids provably differ between source
   and combined trees — a test that passes with an identity remap is not testing the remap;
   (iii) a `branch`-scoped mark whose source branch was excluded by `branchIds` is absent,
   together with all of that branch's moves, and this is asserted as the *same* omission
   rather than as a mark-specific rule;
   (iv) two source branches with identical move sequences — which `uniquePaths` collapses —
   contribute their marks to one combined node with identical `{brush, orig, dest}` triples
   emitted **once**;
   (v) the discarded legality-validation `exportPgn` call receives no marks.
8. **A second principal's marks never appear in a principal's export.** Learner L and
   granted teacher T both mark run R; `GET /runs/R/pgn` as L contains L's shapes and none
   of T's; as T, the mirror. **[cross-review] The header is a constant-information string,
   asserted as such:** every export carries
   `TabiyaMarks: own (N); other authors' marks are not exported`, and the **byte sequence
   after `own (N);` is identical** across three fixtures — no other author with marks, one
   other author with 1 mark, one other author with 500 — so the header carries no count of
   anyone else's data (§3.2). A run with no marks at all exports
   `TabiyaMarks: own (0); other authors' marks are not exported` and is otherwise
   **byte-identical** to the PGN the same run exports today.
8a. **[cross-review] The `match` seat cannot meter its opponent.** In a `match` session,
   both seated players' `GET /runs/:id/pgn` responses are byte-identical to each other
   except for their own shapes and their own `own (N)`, before and after the opposing seat
   writes 50 marks. This is the D80 seat-asymmetry check §4.2 performs for the relay,
   performed for the export route that §3.2 opened.
9. A brush outside `MARK_BRUSHES` — chessground's `paleBlue`, `purple`, anything — is
   refused with `INVALID_REQUEST` at the write, so no persisted mark can fail to export.

**Relay and attribution:**

10. In an `academy` session, marks drawn by the lease-holder appear in
    `LiveSessionDetail.marks` for every other granted viewer with `drawnBy` naming the
    author's handle, and the overlay renders the attribution line. Marks drawn by a
    **non**-lease-holder in the same session appear for that author alone and are absent
    from every other viewer's detail.
11. In a **`match`** session, marks drawn by the lease-holding seated player are relayed to
    nobody, including the opposing seat.
12. `relayed` is stamped at write time: a spectator marks privately, is then granted the
    lease, and their earlier marks stay unrelayed; a host marks while holding the lease,
    hands the board over, and their marks stay relayed until they erase them.
13. **The honesty invariants hold.** `permittedAssistance` returns byte-identical tables
    for every role and both `deliveryOpen` values before and after this change, and
    `client-surface-floor.test.ts`'s monotonicity assertion passes unmodified. No viewer
    parameter is added to `feedbackDisclosed`, `feedbackDeliveryOpen`,
    `publicRunSnapshot`, `publicNodes` or `publicEvents` — asserted by signature.
14. All four rows of §4.3's attribution table render, including the
    account-no-longer-exists arm reached by a fixture, and the `marksTruncated` line.

**Client:**

15. Drawing is enabled on `DrillScreen`'s board and on no other `Chessboard` instance;
    `CompareView`, `GroupPanel`, `CheckpointSheet`, `GameStoryScreen` and the simul-wall
    minis render with `drawable.enabled: false` as today.
16. `defaultSnapToValidMove` is `false`: an arrow drawn from e2 to e5 in a position where
    that is illegal persists and exports as `e2e5`, unsnapped and uncorrected.
    `eraseOnMovablePieceClick` is `false`: clicking a movable piece leaves marks intact.
17. Marks survive a node change: the `{#key}`-driven destruction and recreation of
    `Chessboard.svelte` does not lose the mark set, because the state is held in
    `DrillScreen.svelte`.

**Bounds, deletion and migration:**

18. The 65th shape at one scope key is refused `INVALID_REQUEST`, and the client has
    already disabled the gesture. The 1,001st mark in a run is refused for that author and
    not for another author on the same run.
19. Marks survive a full page reload and are fetched on run load, not polled.
20. Deleting a learner's account removes every `run_marks` row they authored, inside
    `deleteLearner`'s existing transaction and before `DELETE FROM learners`, and leaves
    no relayed mark whose author cannot be resolved. A schema test asserts `run_marks`
    declares no foreign key against `learners(id)`.
21. **[cross-review] The migration applies contiguously and leaves no skipped number.** It
    applies to a fresh database and to one at the immediately preceding version; no run
    snapshot is rewritten, `DRILL_RUN_SCHEMA_VERSION` stays `"0.16"`, and every existing
    run reads back unchanged. Deleting a run cascades its marks away. **Additionally: a
    test asserts the migration array's versions are exactly `1..STORAGE_VERSION` with no
    gap**, which is the assertion that would have caught the withdrawn 23-with-a-hole claim
    at review time rather than after a database had run it, and which protects every future
    draft from the same one-way door (`storage.ts`, `migration.version <= version`).
    **[author round] It is the enforcement half of the register's landing-order rule**, and it
    is why this RFC is content to name no number: the rule says take `STORAGE_VERSION + 1` at
    landing, and this criterion is what makes a draft that ignored the rule fail the build
    rather than a review.

**Docs:** `docs/` gains a board-annotation page stating the scope rule, the isolation
guarantee, the relay condition and the export filter; `docs/live-sessions.md` gains the
relay paragraph beside its vote-attribution material; `docs/branch-runtime.md` gains one
sentence recording that marks are deliberately not run events and why.

## 10. Ledger rows opened by this draft

Six rows, added to `design/BACKLOG.md` by this draft under the allocated id block
**D183–D192** (six used, four unspent). Cited here by id and title; the rows themselves
carry the evidence.

- **D183** — *`projectRun` enforces adjacency invariants over the run event stream, so a
  new `DrillRunEvent` member is only safe if its emission instant is controlled — and a
  user gesture's is not.* The finding §2.1 turns on, generalized past this RFC.
- **D184** — *`deriveMoveAuthorship` is specified, implemented, exported and tested, and
  reaches no viewer — a live audience cannot see who played a move.*
- **D185** — *`SessionKind` is hand-duplicated across the package boundary with nothing
  keeping the two in step.*
- **D186** — *chessops ships the `%csl`/`%cal` codec and the repo uses none of it, in
  either direction.* §3's enabling fact, and the reason §2.4's palette is closed at four.
- **D187** — *`Chessboard.svelte` is destroyed and recreated on every node change, so no
  board-local state can survive a ply.* §2.7's constraint.
- **D188** — *`RunService.pgn` is `requireRead`-gated, so a run's PGN is exportable by
  every grant-holder — and it is the least-audited byte stream the product emits.* The
  standing rule §3.2 is the first case of.

**[cross-review] Seven further rows opened by this review, id block D213–D222 (seven used,
three unspent).** Cited by id; the rows carry the evidence.

- **D213** — *The run event log's adjacency invariants are held open only by every
  emitter's synchronous bracketing, and nothing asserts it.* Amends [[D183]]: the failure
  is a write-time refusal, not a corrupt run, and the RFC's named scenario is
  unconstructible.
- **D214** — *`EvidencePacket.sentences` is the `voiceCheck` allowlist, so it is a law-8
  boundary rather than a projection — and `rest.ts` already splices derived sentences into
  it at two sites.* The second path §2.2 closes by rule.
- **D215** — *`Cursor.branchId` is history-dependent through `rewind`'s `isAncestor`
  ternary, so any key built from it is a function of the visit, not of the tree.*
- **D216** — *A `story_read` token passes `requireRead` as the token's creator, by a
  fabricated principal — scoping is a hand-narrowed projection, not an authorization
  scope.*
- **D217** — *`exportPackRunPgn` exports a synthesized run with regenerated ids, so
  anything keyed on a run's node or branch ids silently vanishes on the pack export path.*
- **D218** — *A withheld-count in a filtered artifact is a side channel, and on an
  ungated export route it is a live one.*
- **D219** — *A skipped migration number is a one-way door: `migration.version <= version`
  means a lower number can never be applied afterwards.* The generalization past this RFC —
  no draft may leave a hole for a blocked sibling.

**[author round] Six further rows opened by this return round, id block D247–D256 (six used,
four unspent).** Cited by title in the sections they govern; the rows carry the evidence.

- **D247** — *`combinedRun` preserves exactly one identity across the pack export boundary —
  the move path — so any key that must survive it is keyed on the UCI sequence, never on ids.*
  Amends the `exportPackRunPgn` row with the remedy, not just the defect; §3.1 is its first
  application.
- **D248** — *A guard test that runs below the layer its barrier is breached at cannot fail,
  and a guard never shown to go red is not evidence.* Both halves are this document's own
  history: criterion 2 sits under the splice sites, and the proposed replacement grepped six
  line numbers that had already moved. Every barrier criterion in the repo should carry a
  positive control.
- **D249** — *`reachCheckpoint` emits its checkpoint/segment pair through two separate
  `appendEvents` calls, so one of the three adjacency gaps is held open by nothing but the
  absence of an `await`.* The sharpest instance of the unasserted-bracketing row, and the one
  criterion 3a is written against.
- **D250** — *A draft that writes a shared monotonic integer into its body has written a claim
  with an expiry date.* The migration rule generalizes: this RFC's pack-schema constant moved
  three times between drafting and this round, and each move made a true sentence false. State
  what a document does not move; resolve numbers at landing.
- **D251** — *Ids in this runtime are path-shaped (`` `${run.id}:node:${n}` ``), so any key
  built by concatenating two of them embeds the run id twice.* Why a `branch`-scoped mark is
  the expensive one at 202 bytes against a FEN-keyed 158 — and a caution for every future
  composite key.
- **D252** — *`kind === "match"` and `boardControl === "match"` are not interchangeable, and
  the divergent case ships: an imported-Arena session is a `match` kind on a non-`match`
  board.* A predicate swap that looks like a simplification would relay a seated player's
  marks inside a contest.

## Open questions

1. **Should the PGN carry relayed marks, attributed?** §3.2 rules own-only for v1, which is
   honest and needs no format extension. If the owner wants a teacher's marks in a
   student's export, the mechanism exists and is named: chessops' `Comment.text` sits
   beside `Comment.shapes` in the same comment, so `makeComment({ text: "@handle",
   shapes })` would attribute a group of shapes without inventing a `%`-tag. It is not
   taken here because it puts a handle into every reader's comment display, including
   readers with no idea who that is.
2. **Should marks be *imported*?** `parseComment` reads `%csl`/`%cal` back, and both
   shipped importers — `parsePgnMainline` and `parseRepertoirePgn` — currently walk the
   parse tree and discard every comment. Importing marks is cheap and raises one real
   question this RFC does not want to answer in passing: whose marks are they? An imported
   Lichess study's arrows are somebody else's thinking arriving without a handle, and
   attributing them to the importer would be false. Deferred.
3. **Should a mark carry text?** `DrawShape.label` (chessground 10.1.1) and `Comment.text`
   (chessops) both exist. Refused in v1 on one argument: a geometric mark asserts nothing
   and is therefore outside the ladder by the owner's own reasoning, whereas text *can*
   assert — *"Nf5 wins"* drawn on a board is a move verdict wearing a different form, and
   `design/05` §3-forms' acceptance test for a new form (*render the same content as a
   sentence; if the sentence would be refused, so is the overlay*) would then have to be
   run against free learner prose. That is a real conversation and it should be had
   deliberately, not inherited.
4. **Which other boards get drawing?** v1 is `DrillScreen` only. `CompareView` is the most
   plausible second — marking a difference between two branches is exactly the *ideating*
   use the owner named — but its boards are already 240 px columns at eight-way compare
   and drawing on them is untested. Should follow a real session.
5. **Is `match` the right relay refusal, or should it be seat-conditional?**
   `teacher-surface` §5 proposes `seatedInContest` on `AssistanceContext` for the same
   underlying defect. If that lands, §4.2's conjunct could narrow from *"kind is not
   `match`"* to *"the author is not seated in the contest"*, which would let a
   non-playing host relay teaching marks during a match they are commentating. Not taken
   here because that field is `teacher-surface`'s and it is owner-blocked.
6. **Should a relayed mark be visible on the simul wall?** `LiveBoardSummary` carries a
   FEN and renders a mini board per session; a teacher walking N boards might want to see
   which students have marked up their positions. Not taken: the wall is a poll over every
   granted session and adding per-board shape sets to it is a cost with no measured want.
7. **Does relay need to exist without a live session?** A granted teacher watching a run
   with no `live_sessions` row today has no rail to relay on, because relay rides the
   session rail by §4.1. Creating a session is one POST, so the workaround is cheap; but
   if async review turns out to want marks, this is the seam that would move.

## Changelog

- 2026-08-16: created. Drafted on the owner's 2026-08-15 three-way ruling on `arrows`, the
  persistence design the owner selected, and a HEAD verification pass over `exportPgn`,
  `projectRun`, `Chessboard.svelte`, `permittedAssistance`, `LiveSessionDetail` and the
  storage migration registry. **Register drift corrected in §8:** `STORAGE_VERSION` is 21
  and the run schema is `0.16` at HEAD, not 20 and `0.15` — `engine-leverage`'s migration
  21 landed while this was being drafted. Six ledger rows opened (§10).
- 2026-08-16: **adversarial cross-review, fixed in place** (id block D213–D222; every
  finding marked `[cross-review]` in the section it governs, none in a header banner).
  Verified at `a7e700d`. Five substantive breaks fixed: §2.1's *"permanently unloadable"*
  corrected to a write-time refusal, with the named mating-move scenario shown
  unconstructible; §2.2's *"`DrillRun` is the sole input to every detector"* premise shown
  false by four measured sibling-table paths and replaced with a narrowed property, plus a
  real second path to a mark named and barriered (`EvidencePacket.sentences` →
  `voiceCheck`); §3.2's `withheld (M)` count shown to be a live meter of a `match`
  opponent's private marking and replaced with a constant-information clause; §3.1's pack
  export path shown to drop every branch-scoped mark through `combinedRun`'s id
  regeneration; and the migration-23-with-a-hole claim withdrawn as a one-way door.
  Corrected counts and citations: `exportPgn` has five call sites and **two**
  marks-accepting functions, not one; `kind === "match"` is behavioural in **nine** places,
  not three; chessground ships **eight** extra brushes, not five, and types the user
  gesture to exactly the four; 1,000 marks is **154 KB**, not ~70 KB; `leaseHeldBy` is a
  response field, not a function; `LeaseIdentity` is declared in `storage.ts`, not
  `live-types.ts`; and `requireRead` on a mutating route is the **majority idiom**
  (seventeen shipped methods), so §6's deviation 3 is withdrawn. Seven ledger rows opened
  (§10).
- 2026-08-16: **author return round** (id block D247–D256; corrections in the body they
  govern). **Every cross-review finding ratified, none declined**, four of them with a
  narrowing or a corrected mechanism: the adjacency argument gains the measured fact that
  `reachCheckpoint` splits its pair across two `appendEvents` calls, plus criterion 3a for
  the unasserted bracketing; `EvidencePacket.sentences` is restated as a **token** allowlist
  rather than a proposition boundary, and criterion 2a is rewritten to run at the route
  layer with a census and a **positive control**, because as proposed it could not fail on
  the thing it guarded; §3.1 specifies the `combinedRun` remap **by UCI path**, with the
  header-signal fallback foreclosed and the authored-spine consequence stated; §8 is
  rewritten under the register's new **landing-order** rule — this RFC claims a *position*,
  names no integer, and proposes no reassignment of `teacher-surface`. Counts re-measured
  against HEAD (`7650d41`), five of them wrong in the review: `exportPgn` has **four** call
  sites and two homonyms in the web tree; `requireRead` is the gate of **eighteen** whole
  mutating methods and two mixed ones, with `RunService.flip` dropped from the list as an
  open defect; `parseRunRoute`'s alternation is **33**, and was 33 at the review's own HEAD;
  1,000 marks is **155.3 KiB** position-scoped and **198.2 KiB** branch-scoped — branch keys
  are the *expensive* ones, not the cheap ones — and a 64-shape `PUT` is **2.7 KiB**, not
  10 KB. The relay cap is priced for the first time (**11.7 KiB/s per viewer**). Confirmed
  unchanged: the eight `kind === "match"` sites, the twelve chessground brushes, the
  `LeaseIdentity` and `leaseHeldBy` corrections, the `branchPath` requirement, the
  `story_read` fabricated principal and the `deleteLearner` insertion point — the last
  restated as a statement rather than a line number, which had already drifted. Six ledger
  rows opened (§10).
