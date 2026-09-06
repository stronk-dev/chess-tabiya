# RFC: Durable opponent failure and recovery journey

- **Status:** **draft — stub opened 2026-09-06 by the `provider-health-degradation` cut.** Scope and
  inherited ledger rows are recorded; the specification is unwritten. It carries the run-schema lane
  its predecessor released so that the persistence decision is owned by a named document rather than
  left to implementation.
- **Author:** claude, on the 2026-09-06 RFC-cut ruling
- **Created:** 2026-09-06
- **Design refs:** `design/05-in-run-experience.md` assistance/source-risk boundary; `design/03-product-breadth.md` B8
- **Exploration gate:** inherited from O13 / D616; no new gate is opened by this split
- **Depends on:** `rfc/provider-health-degradation.md` (the live provider-health authority and its
  typed unavailable outcome), plus `rfc/provider-exchange-and-execution.md` for the sealed request
  identity a retry must preserve
- **Parent / amends:** `rfc/provider-health-degradation.md` §10; run storage, run event union, opponent selector
- **Supersedes / superseded by:** —
- **Planning:** `planning/provider-health-degradation/round-history-and-cut-2026-09-06.md` records the split

```tabiya-claims
run-schema | lane 0.26 | $defs/opponentSelection.acquisition carries the sealed provider-exchange delivery (new, optional for pre-0.26 reads and required on every new opponent.move_selected write); DrillRunEvent gains opponent.selection_failed and opponent.recovery_requested
```

## Summary

`provider-health-degradation` makes an opponent-provider failure **honest in the run**: the run
pauses before an opponent move is committed and offers Retry or Change opponent. It deliberately
does not make that failure **durable**. This RFC owns the persistence half — the two run events, the
recovery route, its idempotency and the effective-policy projection — so that Review and export can
say what failed, what the learner did about it, and which opponent identity actually produced each
later move.

## Motivation

The split exists because the two halves have different costs and different blast radii. Live
honesty is server and client state; it needs no schema lane and can land in one checkpoint. Durability
touches the persisted run shape, and the pre-cut document's attempt to carry both produced a
two-checkpoint staging rule ([[D2364]]) that had to be re-derived in every review round. With the
lane held here, provider health lands claim-free and `bot-policy.md` consumes its runtime authority
without waiting behind a schema lane.

**This is a real capability reduction until this RFC lands, and it must be stated rather than
implied:** without these events, a provider failure and a mid-run opponent change are invisible to
Review and export. A run whose second half was played against a different opponent than its first
half reads, on reload, as one uniform run. That is the concrete cost of the split and the reason the
lane is held rather than abandoned.

## Scope

One paragraph, deliberately: this RFC specifies (1) `opponent.selection_failed` and
`opponent.recovery_requested` as `DrillRunEvent` members, carrying the exact learner move event
sequence, the sealed normalized request digest and a closed safe failure reason; (2)
`POST /runs/:id/opponent-recovery` with its `retry` and `change` arms, resolved against the current
branch/cursor tail under one write transaction, with idempotency bound to the exact stored recovery
command subject; (3) `opponentSelection.acquisition` persisting the sealed provider-exchange
delivery, required on every new `opponent.move_selected` write and read-optional for pre-0.26 events,
which project as an explicit `legacy_unrecorded` trust state and are never relabelled live, retained
or local; and (4) the effective-opponent-policy projection, which changes the run's opponent policy
from the recovery event's sequence onward without rewriting `run.started`, the root `opponentPolicy`
or the `sessionDigest`. Nothing else — provider health, circuits, caches, backoff and the live
`/capabilities` surface stay in the predecessor.

## Inherited ledger rows

These rows moved here from `provider-health-degradation` in the same commit. They are this RFC's
obligation and none of them can close against it until it is written.

| row | what it requires of this RFC |
|---|---|
| [[D1914]] | the durable acquisition receipt is a run-schema change and must claim its lane rather than leave the decision to implementation |
| [[D2582]] | Retry/Change opponent needs a typed route, wire, controller state and resume fixture, not copy |
| [[D2760]] | recovery state must cross the real run-storage boundary — stored event parser, committed learner-ply authority, transaction, reload |
| [[D2764]] | an idempotency key must be joined to its exact run/action/operands before replay is treated as success |
| [[D2820]] | failure may attach only to the current branch/cursor tail with no later opponent selection |
| [[D2821]] | retry must carry the failure sequence and request digest that make its command exact |
| [[D2822]] | `change` must derive its policy digest and next request server-side from a parsed `RunOpponentPolicy` |
| [[D2824]] | reads that decide recovery must happen inside the write transaction, not before it |

## Acceptance criteria

Unwritten. The specification is required first; criteria drafted against an absent specification are
the defect class this stub exists to avoid.

## Discharges

none

## Open questions

Deferred with the specification. None require an owner ruling to open drafting.
