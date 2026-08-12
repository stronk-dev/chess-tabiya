# RFC: Terminal outcome events (D11)

- **Status:** draft (revision 3 — revisions 1 and 2 were each rejected on six blockers)
- **Author:** claude
- **Created:** 2026-08-12
- **Design refs:** `design/01-training-model.md` §Outcome types; `design/03-product-breadth.md` gate B2
- **Exploration gate:** breadth sequencing ruling 2026-08-12 (`planning/exploration/log.md`)
- **Depends on:** nothing unshipped
- **Parent / amends:** amends `packages/runtime/src/runtime.ts` (commit path) and `packages/runtime/src/feedback.ts`
- **Blocks:** `rfc/content-sourcing-syzygy.md` (B6b), `rfc/content-sourcing-position-seeds.md` (B6d)
- **Planning:** `planning/terminal-outcome-events/` (once implementing)

## Summary

A run that ends in checkmate or stalemate **before its checkpoint fires strands
its feedback permanently.** The terminal move commits, every later move throws
`RUN_TERMINATED` (`packages/runtime/src/runtime.ts:275`), no `checkpoint.reached`
is ever emitted, and `feedbackDisclosed` (`packages/runtime/src/feedback.ts:3-12`)
stays false for the life of the run. The learner played the position out and is
shown nothing.

This RFC closes it by producing the event that was cut for exactly this purpose
and never emitted: `outcome.reached`.

## Motivation

Ledgered as **D11**, found while reviewing the sourcing RFCs and verified in
shipped code. It is not a draft-only concern — it affects every pack today.

The exposure is not uniform. It is worst precisely where the product is heading:

- **Endgame packs and Outcome Drills**, because those are the runs that actually
  end. `content/drafts/rook-4v3-same-side.json` is a defence drill whose natural
  conclusions include stalemate and a mating net.
- **Pack-less position runs** (F2) started from an arbitrary FEN, where nothing
  guarantees a checkpoint is reachable at all.
- Two drafted RFCs (B6b, B6d) declare a hard block on this, having verified that
  no bounded workaround exists: no trigger observes a terminal position
  (`FenPredicate` is only `transposeKey`/`pieceOnSquare`/`pawnStructure`,
  `objective.ts:43-58`); an early checkpoint would destroy `delayed_checkpoint`
  semantics; `segment.completed` requires a *prior* checkpoint
  (`runtime.ts:441-458`); and `attempt_end` neither validates for packs
  (`pack-validation.ts:112-115`) nor is accepted by `Service.reveal`
  (`service.ts:539-544`).

**Out of scope,** with reasons:

| Out of scope | Why |
|---|---|
| Objective grading on terminal (does a draw *achieve* a `hold` objective?) | That is WDL-preserving grading, owned by program item #4 (training-mode breadth). Widening here would re-open the objective-type taxonomy this RFC deliberately does not touch |
| `outcome.reached` for resignation, timeout, or agreed draw | No such concepts exist in the runtime; there is no clock and no resign path. `grep -rn "resign\|timeout" packages/runtime/src` → nothing relevant |
| Retroactive emission for stored runs | Runs are event-sourced and append-only. A stored terminal run keeps its history; §5 states this plainly rather than migrating |

## Specification

### 1. Emit `outcome.reached` on terminal detection

The event type already exists and has a projection case, with **no producer**:

```ts
// packages/runtime/src/types.ts:185-188
export type OutcomeReachedEvent = Event<
  "outcome.reached",
  { readonly nodeId: string; readonly outcome: string }
>;
```

Terminal detection also already exists — `runtime.ts:274` calls `position.isEnd()`
to decide whether further commits are refused. This RFC adds no new detection; it
emits at the point where the terminal node is *created* rather than only refusing
the next move.

Rule: when a `commitMove` (by any actor) produces a node whose position satisfies
`isEnd()`, append exactly one `outcome.reached` **for that node**, in the same
mutation, after the `move.committed` event.

"One per node" is the whole rule, and it is not the same as "one per run".
Rewinding and replaying the same terminal move creates an **implicit fork and a
new node** (`runtime.ts:289`), so that node emits its own `outcome.reached`.
Revision 1 asserted the opposite and was wrong.

**Terminal roots are rejected, not emitted.** A run created from an already-
terminal FEN never commits a move, so a commit-path producer would never fire
(`createRun`, `runtime.ts:142`). Emitting during `createRun` was considered and
rejected: a drill starting from a finished position has no decision in it, so the
honest response is refusal. `createRun` raises a named `TERMINAL_START_POSITION`
error. This is consistent with B6d, which already rejects mate puzzles
positionally via `isEnd()` rather than by theme filtering.

### 2. Close the `outcome` vocabulary

`outcome` is typed `string`. An open vocabulary against a closed consumer is
defect **D4**'s exact shape, and the repo has now hit it twice. Close it to three
values, from the **learner's** perspective:

```ts
outcome: "win" | "loss" | "draw"
```

Derivation, all from shipped helpers: `isCheckmate()` gives `win` or `loss` by
comparing the side to move against the learner's colour (`start.side`, the
learner's colour — verified at `session-controller.ts:367`); every other
`isEnd()` case is `draw`.

**Why not the terminal reason** (`checkmate`/`stalemate`/`insufficient_material`/…):
any consumer wanting the reason can derive it from the node's FEN, which is
persisted. The *result* cannot be derived without knowing the learner's colour,
so that is what the event carries.

**This is a wire-schema change, and revision 1's "no schema bump" claim was
wrong.** `schemas/drill_run.schema.json:549` types `outcome` as `$ref: #/$defs/id`
— an open id, not an enum. Closing it bumps the run schema to **v0.6** with
`schemaVersion` and `$id` updated accordingly.

**Revision 2's "provably a no-op" claim was wrong twice over.** Both corrections
matter more than the enum itself.

*First, a version bump hides every existing run.* `SQLiteRunStorage` reads and
lists only rows whose `schema_version` equals the current runtime version
(`apps/server/src/storage.ts:377`), so bumping to v0.6 without a migration makes
every v0.5 run vanish from history and resume. This RFC therefore claims
**migration 4** (`STORAGE_VERSION` 3→4, registered in `rfc/README.md`), which
upgrades eligible snapshots and the indexed column.

*Second, "no stored run contains one" is unprovable, and the event is no longer
harmless.* `appendEvents` is public API (`packages/runtime/src/index.ts:21`) and
projection currently accepts `outcome.reached` as an **unchecked no-op**
(`packages/runtime/src/events.ts:160-164`). That was safe while the event did
nothing. This RFC makes it **open a disclosure barrier** — so an unvalidated
event becomes a way to unlock withheld evidence, a regression this RFC would
have introduced rather than a pre-existing one.

**Replay must therefore validate `outcome.reached`**, rejecting an event whose
`nodeId` is unknown or whose position is not terminal, whose `outcome` does not
match the result derived from that position and the learner's colour, that
duplicates an existing event for the same node, or that is not adjacent to its
node's `move.committed`. Migration 4 **quarantines** v0.5 rows containing the
formerly-open event rather than trusting them: they predate any producer, so any
instance is by definition not runtime-generated.

**What remains genuinely no-op:** `outcome.reached`
has never had a producer (`grep -rn "outcome.reached" packages apps` returns the
type declaration, the projection case, and nothing else), so no *runtime-authored*
run contains one and the enum tightening invalidates no legitimate data. That is
the narrow, defensible version of the claim — it is about provenance, not about
what a file can contain.

### 3. Make it a reveal event

```ts
// packages/runtime/src/feedback.ts:3-12 — current
export function feedbackDisclosed(run: DrillRun): boolean {
  switch (run.feedbackPolicy) {
    case "delayed_checkpoint": return run.events.some((e) => e.type === "checkpoint.reached");
    case "segment_end":        return run.events.some((e) => e.type === "segment.completed");
    case "attempt_end":        return run.events.some((e) => e.type === "feedback.revealed");
  }
}
```

`outcome.reached` discloses feedback under **all three** policies. A run that has
ended cannot be contaminated — there is no remaining decision to bias, which is
the entire basis of ADR-0006. Withholding after termination protects nothing and
costs the learner the feedback they just earned.

This is the one place where the monotonic latch is not merely acceptable but
correct: the run is over.

**Both predicates must change, not one.** F2 deliberately split disclosure from
delivery, and `feedbackDeliveryOpen` (`packages/runtime/src/feedback.ts:14-22`)
governs staged evidence and its application under `attempt_end`, re-closing on
the next `move.committed`. Revision 1 updated only `feedbackDisclosed`, which
would have left an `attempt_end` run able to *see* that feedback exists while
staged evidence stayed unappliable. `outcome.reached` opens the delivery window too.

**But "stays open" was wrong, and it contradicted this RFC's own criterion 3.**
A terminal node accepts no further move, yet the run is not frozen: rewinding and
playing on is exactly what criterion 3 exercises. The invariant for `attempt_end`
is therefore three-part — **`outcome.reached` opens the window; a rewind leaves
it open; the first subsequent `move.committed` closes it.** That preserves F2's
anti-live-evaluation rule, which is the whole reason the window re-closes at all:
without the third clause, terminating once would turn the rest of every branch
into auto-applied live evaluation.

### 4. Authored feedback follows

`revealedAuthoredItems` (`apps/server/src/authored-feedback.ts`) treats
`checkpoint.reached` and `segment.completed` as reveal events. Add
`outcome.reached` with the **full root-to-terminal path** as its span, attributed
to that event.

**`RevealAttribution` cannot express this today** and must become discriminated.
It is currently `{checkpointId: string, eventSeq: number}`
(`apps/server/src/authored-feedback.ts:16-19`), so an outcome reveal has no
representable attribution — revision 1 missed this entirely:

```ts
export type RevealAttribution =
  | { readonly kind: "checkpoint"; readonly checkpointId: string; readonly eventSeq: number }
  | { readonly kind: "outcome"; readonly eventSeq: number };
```

This changes the `/runs/:id/authored-feedback` response shape and the client type
that mirrors it. The checkpoint sheet already selects on `eventSeq`, which is
present in both variants, so selection logic is unaffected; only the narrowing
changes.

**Three client paths change, not one.**

*Opponent selection must stop.* After `move()`, the controller calls
`#playOpponentIfNeeded()` unless a checkpoint fired
(`apps/web/src/lib/session-controller.ts:241`), and that method tests terminal
*objective* state rather than chess termination
(`session-controller.ts:355`) — so after the learner delivers mate, the turn
belongs to the mated side and the client proceeds to `/select-move` for a
position with no legal moves. `outcome.reached` must short-circuit this before
selection.

*Read-only followers must refresh too.* Followers receive new events by polling
(`apps/web/src/lib/run-state.ts:197`), but the session subscription only patches
`runState` (`session-controller.ts:436`). Widening the *writer* mutation path
covers nothing for a spectator, who would watch a run end and see no reveal.

*And the writer path itself:* `#refreshAuthoredFeedback` fires only
behind `#captureCheckpoint(result.emitted)`
(`apps/web/src/lib/session-controller.ts:395`), so terminal disclosure would
exist at the endpoint and never reach the screen. The refresh trigger widens to
"a reveal event was emitted", covering both, and `DrillScreen.svelte:99` gains a
terminal presentation — the run is over, so the sheet is not dismissible back
into play. This is the same rule §1 of the explanation-surface RFC already
applies — the terminal node is simply another reveal point on the actual path
taken.

**This requires widening the deliverability filter, which revision 2 asserted
without checking.** `projectAuthoredFeedback` computes `reachableSpineIds` from
checkpoint nodes and their ancestors and excludes every other source *before*
reveals are processed (`apps/server/src/authored-feedback.ts:230`). So prose
after the last checkpoint stays undeliverable no matter what reveal event fires,
and the "full root-to-terminal path" claim was false as written.

Fix: when a run has an `outcome.reached`, the reachable set is the union of
`reachableSpineIds` **and the spine nodes on the actual root-to-terminal path**.
Deliverability stops being a pure function of the pack and becomes a function of
the pack *and the run* — which is the same shift §1 already made for reveal, now
applied one layer earlier.

Consequence, intended: authored prose positioned after the last reachable
checkpoint — which `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` warns about as
permanently unreachable — becomes reachable on runs that terminate past it. The
lint stays, because it is still true for runs that do not end.

### 5. Stored runs

Runs are append-only; no backfill. A stored run that already terminated without
an `outcome.reached` keeps its history and stays withheld. Do not migrate,
do not synthesize events. The honest statement is that the defect existed and
those runs were affected. `content/drafts/` packs are all draft and unplayed, so
the practical population is developer test runs.

## Deviations from design

None. `design/01-training-model.md` §Outcome types describes win/hold/save/resist
as *objective* framings; this RFC deliberately does not touch objective grading
(see out-of-scope), so it neither implements nor contradicts that section.

## Acceptance criteria

1. A run played to **checkmate** emits exactly one `outcome.reached` on the
   mating node, with `outcome: "win"` when the learner delivered mate and
   `"loss"` when the learner was mated.
2. A run played to **stalemate** emits `outcome: "draw"`.
3. **One per node, not one per run** (corrected from revision 1): rewinding to
   before a terminal node and replaying the same move implicitly forks and
   creates a *new* node, which emits its own `outcome.reached`. The test asserts
   two events with distinct `nodeId`s, and states why.
4. **Terminal roots are refused:** `createRun` with an already-terminal FEN
   raises `TERMINAL_START_POSITION` and persists nothing.
5. **Unstranding, the defect this RFC exists for:** a pack whose checkpoint is
   never reached, played to a terminal position, reports
   `feedbackDisclosed === true` and serves its withheld engine evidence. Written
   as a regression referencing D11 so it cannot be silently reverted.
6. All three feedback policies disclose on `outcome.reached`, asserted
   separately for each.
7. **Delivery, not just disclosure:** an `attempt_end` run that terminates
   reports `feedbackDeliveryOpen === true`, and its staged evidence can actually
   be applied. This is the half revision 1 missed, so the test names it.
8. **Attribution is discriminated:** authored feedback revealed by termination
   carries `{kind: "outcome", eventSeq}`, and checkpoint reveals still carry
   `{kind: "checkpoint", checkpointId, eventSeq}`. A type-level test asserts an
   outcome attribution cannot carry a `checkpointId`.
9. **It reaches the screen:** a browser test plays a fixture to a terminal
   position with no checkpoint reached and asserts the authored commentary and
   engine evidence become visible, with the run presented as over. Without this
   the feature exists only at the endpoint.
10. Authored feedback for the whole root-to-terminal path is revealed and
    attributed to the `outcome.reached` event's sequence number.
11. The `outcome` vocabulary is closed: a value outside `win|loss|draw` is
    unrepresentable in the type and rejected by the v0.6 schema.
12. **Schema v0.6 migration is a no-op:** a stored v0.5 run replays unchanged,
    asserted directly, since no stored run can contain an `outcome.reached`.
13. **Migration 4 preserves history:** v0.5 runs remain readable and listed after
    the bump, asserted against a stored fixture — the failure revision 2 would
    have shipped.
14. **Forged events are rejected:** an `outcome.reached` appended via the public
    `appendEvents` with an unknown node, a non-terminal node, a mismatched
    result, a duplicate for one node, or wrong adjacency is refused by replay.
    Each case tested, because this event now unlocks withheld evidence.
15. **Quarantine:** a v0.5 row containing `outcome.reached` is quarantined by
    migration 4 rather than upgraded.
16. **No selection after termination:** a learner-delivered mate does not issue
    `/select-move`. Asserted at the controller, since the server would be asked
    for a move in a position with none.
17. **Followers see it:** a read-only follower polling a run that terminates
    receives and displays the reveal. Separate test from the writer path.
18. **Post-checkpoint prose is delivered:** a fixture with authored prose
    strictly after its final checkpoint, played to termination past that prose,
    delivers it — the deliverability widening, tested directly.
19. **`attempt_end` window discipline:** outcome opens the window; a rewind
    leaves it open; the first subsequent `move.committed` closes it. All three
    asserted in one test, referencing F2's anti-live-evaluation rule.
20. `ENGINES_REQUIRED=1 make verify` green; `make test-browser` green.
21. `docs/branch-runtime.md` documents terminal outcome emission and the refusal
    of terminal roots; `docs/explanation-grounds.md` adds `outcome.reached` to
    the reveal events and the discriminated attribution shape.

## Open questions

None.

## Changelog

- 2026-08-12: created, to close D11 and unblock B6b/B6d.
- 2026-08-12: revision 3 after review — six further blockers, all mine again.
  The v0.6 bump hides every v0.5 run because storage reads only rows at the
  current version, so this RFC now claims migration 4; "no stored run contains
  one" was unprovable and, worse, this RFC turns an unchecked no-op event into
  one that opens a disclosure barrier, so replay must validate it and migration 4
  quarantines pre-existing instances; a learner-delivered mate still issued
  `/select-move`; read-only followers never refresh authored feedback; the
  deliverability filter excludes post-checkpoint prose before reveals are
  processed, so the root-to-terminal claim needed the filter widened; and
  "the window stays open" contradicted this RFC's own rewind criterion, so the
  `attempt_end` invariant is now three-part.
- 2026-08-12: revision 2 after review — six blockers, all mine. `RevealAttribution`
  could not represent an outcome reveal and is now discriminated; the client
  refreshed authored feedback only behind a checkpoint capture, so terminal
  disclosure would never have reached the screen; `feedbackDeliveryOpen` was
  untouched, leaving `attempt_end` staged evidence unappliable; a run created
  from a terminal FEN never fires the commit-path producer and is now refused;
  the rewind criterion contradicted implicit-fork semantics and asserted the
  wrong count; and closing the `outcome` id to an enum is a v0.6 wire change,
  not the "no schema bump" revision 1 claimed — safe only because the event has
  never had a producer, which is now stated and tested.
