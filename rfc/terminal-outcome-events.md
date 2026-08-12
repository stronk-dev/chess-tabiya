# RFC: Terminal outcome events (D11)

- **Status:** draft
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
| Retroactive emission for stored runs | Runs are event-sourced and append-only. A stored terminal run keeps its history; §5 states what it gets instead |

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
`isEnd()`, append exactly one `outcome.reached` for that node, in the same
mutation, after the `move.committed` event. Exactly one per node — a rewind that
re-enters a terminal node emits nothing new, because the node already carries it.

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
the payload shape is fixed at `{nodeId, outcome}` and widening it is a run-schema
version bump this RFC does not need. Any consumer that wants the reason can
derive it from the node's FEN, which is persisted. The result cannot be derived
without knowing the learner's colour, so that is what the event carries.

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

### 4. Authored feedback follows

`revealedAuthoredItems` (`apps/server/src/authored-feedback.ts`) treats
`checkpoint.reached` and `segment.completed` as reveal events. Add
`outcome.reached` with the **full root-to-terminal path** as its span, attributed
to that event. This is the same rule §1 of the explanation-surface RFC already
applies — the terminal node is simply another reveal point on the actual path
taken.

Consequence, intended: authored prose positioned after the last reachable
checkpoint — which `AUTHORED_PROSE_AFTER_LAST_CHECKPOINT` currently warns about
as permanently unreachable — becomes reachable on any run that terminates. The
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
3. **Exactly one per node:** rewinding to before a terminal node and re-entering
   it by the same move emits no second `outcome.reached`.
4. **Unstranding, the defect this RFC exists for:** a pack whose checkpoint is
   never reached, played to a terminal position, reports
   `feedbackDisclosed === true` and serves its withheld engine evidence. Written
   as a regression referencing D11 so it cannot be silently reverted.
5. All three feedback policies disclose on `outcome.reached`, asserted
   separately for each.
6. Authored feedback for the whole root-to-terminal path is revealed and
   attributed to the `outcome.reached` event's sequence number.
7. The `outcome` vocabulary is closed: a value outside `win|loss|draw` is
   unrepresentable in the type, and the projection asserts it.
8. `ENGINES_REQUIRED=1 make verify` green; `make test-browser` green.
9. `docs/branch-runtime.md` documents terminal outcome emission, and
   `docs/explanation-grounds.md` adds `outcome.reached` to the reveal events.

## Open questions

None.

## Changelog

- 2026-08-12: created, to close D11 and unblock B6b/B6d.
