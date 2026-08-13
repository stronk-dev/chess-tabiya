# Outcome Drill grading

Outcome Drill is the implemented grading layer for pack objectives `win`,
`hold`, `save`, and `resist`. It grades a played attempt from persisted chess
facts and authored resolution points. It does not promote an engine evaluation,
model policy, or unverified pack declaration into chess truth.

## Pack contract

Living drill-pack schema v0.3 closes `objective`. Every outcome objective
requires:

- `grading.assessedBy`: either an authored root claim with a note, or a Syzygy
  declaration containing category, piece count, source ID, and retrieval time;
- `grading.resolveAt`: terminal play or one named checkpoint; and
- a closed `successConditions` list. Conditions may be checkpoint, terminal
  outcome, material-balance, or checkmate/stalemate rules facts and may state a
  target plus the non-terminal states from which they apply.

`hold` and `save` have the same terminal floor: win or draw succeeds and loss
fails. Their distinction is the claimed root assessment, not a different fact
at the end. `win` requires a win. `resist` succeeds on a loss only when its
authored resistance checkpoint occurred on that path; terminal-only resist is
rejected as ungradable.

## Monotone grading

The runtime still exposes the generic six-state objective machine. The pack
orchestrator compiles outcome objectives into a narrower, forward-only graph:

`active -> preserved|degraded|achieved|failed`

`preserved -> degraded|achieved|failed`; `degraded -> achieved|failed`

At the declared resolution point, `preserved` means the drill boundary was
reached and play may continue. `degraded` is one-way for an outcome attempt. `achieved` and
`failed` are absorbing and require the validated `outcome.reached` event; an
ordinary checkpoint can never stop an outcome game by declaring success.

Rules are ordered so a degradation on the same committed node wins over
checkpoint resolution. Checkpoint resolution uses `checkpointReachedHere`, not
the historical `checkpointReached`, so the same standing fact cannot alternate
the grade on later plies. A resist terminal-loss success combines the validated
loss with historical reach of its resistance checkpoint.

Pack validation rejects missing grading, unknown resolution checkpoints,
terminal-only resist, self-transitions, an absorbing transition without an
outcome fact, an outcome fact targeting a non-terminal state, and a degraded to
preserved back-edge. It constructs a root run and applies the real checkpoint
matcher: a trigger already true at the root is an error, as is `atPly: 0`, which
can never be observed by the post-commit orchestrator.

The corresponding typed validation codes are
`OBJECTIVE_GRADING_REQUIRED`, `OBJECTIVE_GRADING_UNSUPPORTED`,
`OBJECTIVE_RESOLUTION_UNKNOWN`, `OBJECTIVE_RESIST_NEEDS_CHECKPOINT`,
`OBJECTIVE_SELF_TRANSITION`, `OBJECTIVE_ABSORBING_WITHOUT_OUTCOME`,
`OBJECTIVE_OUTCOME_TARGET_INVALID`, `OBJECTIVE_DEGRADED_IS_ONE_WAY`,
`SYZYGY_ASSESSMENT_OUT_OF_RANGE`, `SYZYGY_ASSESSMENT_MISMATCH`,
`CHECKPOINT_UNREACHABLE_AT_ROOT`, and `CHECKPOINT_TRUE_AT_ROOT`. Strict sourcing
adds `SYZYGY_ASSESSMENT_UNGROUNDED` when a declaration cannot be admitted from
its sidecars.

Coincident checkpoints remain legal, but reaching two at one node no longer
emits a zero-length `segment.completed` event.

## Exactness and provenance

Syzygy exactness is derived server-side, never trusted from pack JSON. A
declaration is projected as `ledger_verified` only when the sibling evidence
ledger and source manifest both pass the sourcing validators, link to one
another, and contain a matching `tablebase_result` for the root. Piece count,
category, source identity, retrieval time, FEN, support pointer, and pack
identity are checked. A malformed or missing sidecar cannot earn the label.

Unverified and authored assessments remain visible only as authored, unproved
claims. This is important above Syzygy's seven-piece limit: a completed run has
a rules-derived result, but that result does not prove the starting assessment.

## Resistance attribution

The pack projection states the resistance mode that was requested. Actual
resistance is derived independently from persisted opponent-selection events.
`opponentMovesFromEvents` pairs every `opponent.move_selected` with its required
adjacent `move.committed`; replay and reporting share this parser and its typed
failure behavior. A selection counts for a branch only when the committed child
is on that branch's path.

The UI names requested mode, applied mode, and recorded engine separately. Run
schema v0.7 persists `policyModeApplied` on every new selection. Historical
selections migrate to `unknown`; only those plies retain the byte-identical
disclaimer that the run cannot prove which policy was applied. It also states
that the record is not proof of perfect play.

## Learner-facing result

The drill and checkpoint/terminal sheets render:

1. root assessment and whether it is ledger-verified;
2. requested resistance;
3. actual engine identity or identities recorded on the active path;
4. the current objective grade; and
5. checkpoint resolution or terminal result as a distinct fact.

At a non-terminal resolution, the copy says that the learner reached the end of
the drill without conceding the objective, and explicitly says this is not proof
of the position. At a terminal node, the rules-derived result and objective grade
remain separate. Adding this context can change the board's layout, so the board
redraws after reactive layout settles rather than retaining stale pointer bounds.

## Current limits

- No authored pack in the repository currently has a ledger-verified Syzygy
  assessment; positive admission is exercised with the real seven-piece emitter
  fixture.
- `perfect_tablebase` is declared but not selectable. The client reports that
  limitation instead of implying perfect resistance.
- Stockfish scores are recorded evidence, not grading authority.
- Historical plies pre-dating run schema v0.7 cannot identify the applied policy.
- An authored root claim above seven pieces is reviewable content, not a
  machine-proved assessment.

`follow_theory` is a stricter sibling to the outcome monotone law: its reachable
graph is `active → preserved → degraded`, with no absorbing result state. Theory
membership is not WDL grading, and a finished chess game does not change that
objective automatically.
