# Trajectory Drill

A Trajectory Drill is one pack and one run whose authored legs occupy contiguous spans of
one legal node path. It cannot jump to another FEN or chain unrelated packs. The moves
between leg entries are therefore the replayable provenance for the resulting position.

## Pack contract

Pack schema 0.7 adds `objective.type: run_trajectory` and `legs`. A trajectory has at
least two legs. The first starts at the run root; every later leg names an existing simple
checkpoint as `entryCheckpointId`. Each leg carries a normal objective.

The validator refuses missing/reused/unknown entries, timing-window entries, nested
trajectories, coincident authored ply entries, multiple theory legs, Syzygy assessment of
a dynamically reached leg, premature terminal resolution, absorbing non-terminal middle
legs, `transitioned` targets, and checkpoint conditions already true at leg entry.

Outcome legs inherit automatic terminal grading without needing a placeholder success
condition. The first authored trajectories no longer carry material-balance conditions whose
only purpose was to make the compiler enter its outcome branch.

`mode: trajectory` remains usable without `legs` for old schema fixtures. `legs`, however,
require both trajectory mode and `run_trajectory`; this keeps the behavioral contract
one-way and explicit.

## Write-side semantics

After a move, the pack orchestrator fires checkpoints and grades the objective belonging
to the leg active at the move's parent. If the move enters a later leg, a non-absorbing
`preserved` or `degraded` outgoing state is reset to `active` with the entry checkpoint as
evidence. An already-active state needs no illegal self-transition. An absorbing state is
not reset: play stopped, so later legs remain not entered.

This permits two ordered objective-state events on one node—seal, then reset—while keeping
the runtime transition validator and event-log replay authoritative.

## Read-side derivation

`trajectoryLegSpans`, `legIndexAt`, and `trajectoryVerdict` derive the active leg, sealed
per-leg states, transition nodes, skipped legs, and `producedBy` move lists from persisted
nodes and events. None is stored. Leg index is monotone along a path; rewind above a boundary
creates a path that may enter again independently.

The verdict is an ordered list of per-leg outcomes. There is deliberately no trajectory
score, completion percentage, or claim that one phase caused another beyond the actual
legal moves recorded in `producedBy`.

## Client

The browser-safe pack projection includes leg ids, entry checkpoints, objective types, and
objective summaries, but no withheld authored commentary. The drill screen shows entered,
active, sealed, and not-entered legs plus the latest structural transition. It describes
the number of recorded moves that produced the boundary position; it does not manufacture
a chess explanation for them.

The shipped mechanical fixture exists to exercise continuity and reset semantics. Its ply
boundaries are not asserted to be real opening/middlegame/endgame detection.
