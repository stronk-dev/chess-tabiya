# RFC: Board annotation — a mark is the learner's own thought

- **Status:** draft
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
drawn at the wrong instant would break outright. Because marks never reach `DrillRun`,
and `DrillRun` is the sole input to every detector, grader and objective evaluator, the
isolation this feature needs is a property of the type graph rather than a rule anyone has
to remember. System-drawn directed marks (leg **c**) are not this RFC's and are named as
`rfc/format-surface.md`'s.

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
| Board possession | `leaseHeldBy`, `BOARD_CONTROLS`, `RunStorage.boardOperation` | the governance answer the live surface already gives — reused for **who may relay** |
| Attribution projection | `LeaseIdentity { learnerId, handle }`, resolved with `RunStorage.learnerById`, declared in **both** `apps/server/src/live-types.ts` and `apps/web/src/lib/api.ts` | the attribution idiom §4 copies verbatim |
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
`opponent.move_selected`, throwing `ReplayError` otherwise. A learner draws whenever they
like, including in the milliseconds between committing a mating move and the runtime
deriving its outcome. A mark event landing in that gap does not degrade the run; it makes
`projectRun` throw, and because `RunStorage.read` rebuilds every run through
`readBackReplay`, **the run becomes permanently unloadable.** This is a general fact worth
having written down and it is ledgered: a new `DrillRunEvent` member is only safe if its
emission instant is controlled, and a user gesture's is not.

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

> **`DrillRun` is the sole input to every detector, grader and objective evaluator in
> `packages/runtime`. `DrillRun` has no marks field. Therefore no detector, grader or
> evaluator can reach a mark, in any code path, present or future, without a type change
> that a reviewer cannot miss.**

`projectRun`, `commitMove`, `appendOpponentPly`, `fork`, `rewind`, `reachCheckpoint`,
`deriveSegments`, `trajectoryLegSpans`, `trajectoryVerdict`, `feedbackDisclosed`,
`feedbackDeliveryOpen`, `structuralReading`, `pivotalMarkers`, `liveMarkers`,
`compareStrips`, `spinePositionIndex`, `deviationAnchors` and the guard evaluator all take
a `DrillRun`, a `Node`, or a FEN. None of them can be handed a mark, and none of them can
acquire one by accident, because there is nothing to acquire it from.

**One function in `packages/runtime` accepts marks and it is `exportPgn`** (§3). That
exception is safe by construction: `exportPgn` returns a string, is called from exactly
one place (`RunService.pgn`), and no detector, validator or grader reads its output.
§9's criterion 1 pins the exception set at exactly one, so a second importer fails the
build rather than passing review.

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
ships those four **plus** `paleBlue`, `paleGreen`, `paleRed`, `paleGrey` and `purple`,
which have no `%csl`/`%cal` counterpart. Persisting one of those would produce a mark that
cannot be exported, so the vocabulary is closed at four and anything else is refused
(§2.6). The export format pins the palette; the palette is not a taste decision.

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

1. **Both routes gate on `requireRead`, not `requireWrite`, and that is deliberate.** The
   shipped `requireWrite` layers three checks — role capability, the run lease, and the
   device writer-id. Requiring it would make marking impossible for exactly the two people
   the owner named: a teacher watching a student's board without holding it, and a
   spectator ideating on a stream. The object written is keyed `(run_id,
   author_learner_id)` and no path lets a principal write or delete another author's rows,
   so the write is to the principal's own data, on a run they are already authorized to
   read. **No second authorization path is created** — `requireRead` → `runRole` is the
   shipped chokepoint and this RFC adds no other. That is the D4/D8 two-sources-of-truth
   class the repo has been bitten by, avoided by reuse.
2. **The server derives `scope_key`; the client never supplies one.** For `scope:
   "position"` the server resolves `run.nodes.find(n => n.id === nodeId).transposeKey`;
   for `scope: "branch"` it builds `` `${branchId}:${nodeId}` `` after checking the
   branch exists via `requireBranch`. An unknown node or branch is `INVALID_REQUEST`. A
   client-supplied key would let a caller write marks onto positions the run never
   reached — harmless, but unbounded and unauditable.
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

| Condition | Header |
|---|---|
| the principal has marks in the exported tree | `TabiyaMarks: own (N)` |
| the principal has none, and no other author does either | `TabiyaMarks: none` |
| the principal has none or some, and other authors have M more | `TabiyaMarks: own (N); withheld (M)` |

Like `Site`, `TabiyaRun` and `TabiyaSession`, `TabiyaMarks` is re-forced after
`headerOverrides` are applied so a caller cannot spoof it.

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

- **The lease is the reuse.** `leaseHeldBy` and `BOARD_CONTROLS` are how the live surface
  already answers *"who is driving this board"* — `host_directed` academy sessions,
  rotation, free claim. Inventing a second "may broadcast" capability alongside it would
  be the two-sources-of-truth class again. The host of an academy session and the streamer
  of a stream session both hold the lease when they are teaching, which is the case the
  owner named.
- **`match` is refused** because a mark is a plan, and broadcasting a seated player's plan
  to their seated opponent is the D80 seat-asymmetry defect arriving in a new form. This
  makes `kind` behavioural in a third place, and all three require `match` — so it is
  consistent with the two shipped branches and **widens no enum**. `live-surface-honesty`
  §3.2's ruling (*read the enum; do not widen it*) is followed, not reopened, and **D81
  stays closed**.
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
  `leaseHeldBy` and `voteAdapter` idiom exactly. No new identity type is introduced.
- Cap the projection at **128 marks, newest first**, setting `marksTruncated: true` when
  it bites. The cap is a poll-cost bound, not a policy; it is stated rather than silent.

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
| marks per `(run, author)` | **1,000** | ~70 KB worst case on a route fetched once per run load, not polled |
| shapes in one `PUT` body | **64** | equal to the per-key cap, so a legal body can never be a refused write |

The client disables further drawing at the per-key cap and says so; the server refuses the
over-cap `PUT` with `INVALID_REQUEST` as a backstop. This is `live-surface-honesty` §5.2's
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
3. **`requireRead` gates a write route** (§2.6), which departs from the `requireWrite`
   idiom every other mutating run route follows. Justified in place: the write is to the
   principal's own rows on a run they may already read, and requiring the lease would
   exclude the two users the owner's ruling names.

Otherwise: none.

## 7. Boundaries against the three sibling documents

| Document | Status | Boundary |
|---|---|---|
| `rfc/format-surface.md` | **accepted**, conditional on two owner rulings | Owns `assistance:arrows` and leg **(c)**. This RFC adds no `AssistanceConfig` field, reads `assistance.arrows` nowhere, constructs no system-drawn shape, and changes no `FORMAT_DISPOSITIONS` row. `format-surface` may take its `unmeasured` disposition with the named gap (*the structural reader emits square sets, not vectors*) with **zero interaction** with this document, in either landing order. What it may **not** do is retire the field — that is the owner's ruling, not this RFC's claim. |
| `rfc/archive/live-surface-honesty.md` | **implemented** (`f2be4ed`) | Owns **I1–I4** and the ceiling/preference partition. §4 is checked clause-by-clause against all four (§4.3) and changes none of them. It reuses that RFC's `LeaseIdentity` projection idiom and its four-branch render table rather than inventing an attribution model. It touches neither `permittedAssistance` (the ceiling) nor `assistanceProfile` / `ASSISTANCE_PROFILES` (the preference), so **D81, D82 and D83 stay closed** and none is reopened. |
| `rfc/teacher-surface.md` | **draft, owner-blocked**, claims migration **22** | Owns classroom identity, `classrooms` / `classroom_members` / `assignments` / `assignment_submissions`, `run_grants.expires_at`, `live_sessions.classroom_id`, and the `AssistanceContext.seatedInContest` narrowing. This RFC touches **none** of those and introduces **no `member_role`, no roster and no standing relationship** — a mark is per-run, ephemeral to a run, and confers nothing. Two collisions are checked and both are clear: (i) it claims migration **23**, behind 22, and is not blocked by 22 because the two share no table; (ii) `teacher-surface` §4.3 enumerates **nine readers of `run_grants`** and makes a tenth-without-a-case a test failure — **this RFC introduces no direct `run_grants` query**, reaching grants only through `requireRead` → `runRole` (its site 1) and through `LiveSessionService.detail` (already covered), so the expiry enumeration is unaffected and its criterion 7 still passes. If `teacher-surface` lands first, marks written by a teacher whose grant later expires become unreadable to them at site 1, which is the correct behaviour and needs no code here. |

## 8. Register claims — stated loudly

**Drift correction, verified at HEAD (`1b89123`) and load-bearing for every row below:**
the drafting brief recorded `STORAGE_VERSION` as **20** with migration 21 in flight.
`engine-leverage`'s migration 21 has since landed: `STORAGE_VERSION` is **21**,
`DRILL_RUN_SCHEMA_VERSION` is **`"0.16"`** and `DRILL_PACK_SCHEMA_VERSION` is **`"0.23"`**.
Migration 22 remains `teacher-surface`'s (claimed, owner-blocked, unlanded). **23 is free
and this RFC claims it.**

| Register | Claim |
|---|---|
| **Migration** | **23** (`STORAGE_VERSION` 22 → 23), landing behind `teacher-surface`'s claimed 22. `STORAGE_VERSION` is **21** at HEAD and 22 is claimed but unlanded, so this claim deliberately leaves a hole rather than taking 22 from an owner-blocked draft: the migration loop iterates a literal array and skips `migration.version <= version`, so applying 23 to a database at 21 is mechanically sound and sets `user_version = 23`. **If 22 is still unlanded at implementation time, this renegotiates in the register rather than renumbering unilaterally**, per the register's standing rule. Creates `run_marks` plus two indexes; adds one clause to `deleteLearner`. **Create-table/index only — no table rebuild, no backfill, no snapshot rewrite**, on the migration-15 (`repertoire-gap-finding`) and migration-10 (`shape-library`) precedent rather than migration 14's rebuild. It runs in the migration loop's ordinary `BEGIN IMMEDIATE` arm with **neither** `PRAGMA foreign_keys = OFF` nor `legacy_alter_table = ON` — that arm is `migration.version === 14` only. CHECK vocabularies are literal strings, never interpolated from the live TS constants |
| **Run schema** | **none.** Stays **`0.16`**. `DrillRun` gains no field, `DrillRunEvent` gains no member, and `projectRun` gains no case. This is the whole of §2.2's isolation argument and it is a register fact, not only a design one: because the run schema does not move, `RunStorage.read`'s `schema_version = ?` filter keeps every stored run visible and **no stamp is required** |
| **Pack schema** | **none.** Stays **`0.23`** (`engine-leverage`, implementing). **0.19 is frozen shut**; **0.26 is the next free lane** and this RFC does not take it. No pack document changes, so no digest moves and there is no rebase pressure on the pack lane |
| **Assistance ceiling** | **none.** `AssistanceConfig`, `SILENT_ASSISTANCE`, `AssistancePermission`, `AssistanceContext` and `permittedAssistance` are untouched. `rfc/live-marker-quality.md` owns that table and its four enforcement sites; this RFC lands in any order relative to it |
| **Assistance preference** | **none.** `ASSISTANCE_PROFILES`, `assistanceProfile` and `assistanceKey` are untouched; no new `localStorage` version arm is added |
| **Session vocabulary** | **none.** `SESSION_KINDS` keeps its three members, `BOARD_CONTROLS` its four, `RUN_ROLES` its three, `SESSION_JOURNAL_KINDS` its sixteen. §4.2's `match` refusal reads the shipped enum; it does not widen it |
| **Token surface** | **none.** `public_tokens` keeps its two shipped scopes |
| **Refusal codes** | **none.** Every refusal in this RFC is `INVALID_REQUEST`. Considered and declined: minting `MARK_LIMIT_EXCEEDED` on the `REPERTOIRE_IMPORT_LIMIT` precedent. That code exists because a repertoire import is a *bulk* operation whose partial failure needs a distinct client message; a single over-cap mark is a control the client should already have stopped offering, so a dedicated code would add a versioned union member to describe a state the UI is specified never to reach |
| **PGN header namespace** | **`TabiyaMarks`**, joining the shipped `TabiyaRun` / `TabiyaSession` / `TabiyaPack` set and re-forced after `headerOverrides` like the first two |
| **Ledger rows this RFC ships** (shared register; **flipped by the implementing commit**, not by this draft) | *"Learner-drawn board annotation — one boolean, and it is nobody's"* — **closed** by §2–§3. *"`arrows` is THREE different things sharing one field name…"* — legs (a) and (b) close here; **the row should be split, not closed**, so leg (c) survives with a row of its own and `format-surface` keeps its subject. **D183–D188** (§10) — opened by this draft |
| **`rfc/README.md`** | **not edited by this draft**, per the drafting instruction. Whoever accepts this RFC adds three things in the accepting commit: an **Active table row**; a **migration-register row for 23**; and a note that the register's migration table currently ends at 22 |

## 9. Acceptance criteria

**Isolation — the load-bearing ones:**

1. **`DrillRun` gains no field and `DrillRunEvent` gains no member.** A test asserts the
   event union is exactly its shipped 16 members and `DRILL_RUN_SCHEMA_VERSION` is
   `"0.16"`. A **static** test enumerates every symbol in `packages/runtime/src` that
   accepts a mark parameter and asserts the set is exactly `{ exportPgn }` — so a second
   consumer fails the build rather than passing review.
2. **No grading path can observe a mark.** A run is played to a graded outcome twice from
   identical inputs, once with 64 marks written at every node and once with none. The
   resulting `DrillRun` projections, objective states, trajectory verdicts, deviation
   detections, tempo verdicts, guard firings, structural readings, compare strips and
   `evidencePacket` outputs are **byte-identical**. This is the whole safety argument
   expressed as one test.
3. **A mark cannot break replay.** Marks are written interleaved with a run reaching a
   terminal outcome — specifically between the mating `move.committed` and its
   `outcome.reached` — and the run reloads through `readBackReplay` unchanged. (Under this
   design the test is trivially green; it is kept as the regression guard against anyone
   later moving marks into the event log, which is the failure §2.1(1) documents.)

**Scope:**

4. A `position`-scoped mark drawn at node N is present after rewinding to N, and is
   present at a node on a **different branch** whose `transposeKey` equals N's. A
   `branch`-scoped mark at N on branch B is present at N on B and **absent** at N after
   forking to branch B′. Both directions, in one test.
5. The default scope of a mark drawn with no explicit setting is `position`. Re-scoping
   the current node's marks moves every one of this author's marks at that node to the
   other scope and touches no other author's rows and no other node.
6. The server derives `scope_key` and ignores any client-supplied key: a `PUT` naming an
   unknown `nodeId` or `branchId` returns `INVALID_REQUEST` and writes nothing.

**PGN:**

7. A run with marks exports a PGN whose comments contain `[%csl …]` for every circle and
   `[%cal …]` for every arrow, produced by `makeComment` and **not** by hand-written tag
   text. `parseComment` round-trips every emitted shape back to the same `{color, from,
   to}`. Root-position marks appear in `Game.comments`, before the first move.
   `startingComments` still carries `Tabiya branch: <label>` unchanged, on the same runs.
8. **A second principal's marks never appear in a principal's export.** Learner L and
   granted teacher T both mark run R; `GET /runs/R/pgn` as L contains L's shapes and none
   of T's and carries `TabiyaMarks: own (N); withheld (M)`; as T, the mirror. A run with
   no marks at all exports `TabiyaMarks: none` and is otherwise **byte-identical** to the
   PGN the same run exports today.
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
21. Migration 23 applies to a fresh database, to one at version 22, **and to one at 21**
    (the hole case, if `teacher-surface` has not landed); no run snapshot is rewritten,
    `DRILL_RUN_SCHEMA_VERSION` stays `"0.16"`, and every existing run reads back unchanged.
    Deleting a run cascades its marks away.

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
