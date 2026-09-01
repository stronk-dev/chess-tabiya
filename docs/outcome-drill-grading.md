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

`rules_fact: draw` is the one non-terminal rules condition that may resolve an
outcome objective: it means a rules draw is available here.

A `run_trajectory` objective may carry optional root grading when its resolution
is terminal. This is grounding for the trajectory's static start position, not
another grade layered over its legs. A Syzygy declaration is checked against the
effective objective of the final leg; that leg must be `win`, `hold`, `save`, or
`resist`. Dynamically reached legs still cannot declare Syzygy exactness because
their entry position is not statically bound.

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

Automatic win/draw/loss rules compile even when `successConditions` is absent. Authored
conditions are additive; they are not an unlock token for terminal grading. This applies to
top-level objectives and trajectory legs alike.

The runtime emits `outcome.reached: draw` for threefold repetition on the active path and
for a FEN whose halfmove clock reaches 100. Checkmate and ordinary chess termination are
tested first, so mate at halfmove 100 remains a win or loss. A node carrying that event is
terminal even when legal moves remain.

Syzygy assessment admission is objective-specific: `win` accepts only `win`; `hold`
accepts `draw`, `cursed-win`, or `blessed-loss`; `save` and `resist` accept `loss` or
`blessed-loss`. The capability response publishes both the determinate category list and
these sets.

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
identity are checked, and the ledger digest must equal the current canonical
pack digest. A malformed, missing, stale, or unstamped sidecar cannot earn the
label.

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

Run schema v0.14 adds the measured `practical_resistance` mode. Its selections
persist the concession ratio for every measured category-preserving candidate.
For Maia-backed modes, the resistance sheet also distinguishes a requested
target Elo from an `eloApplied` value recorded by an engine that advertised the
corresponding UCI option. Absence is rendered as unconfirmed calibration, not
inferred from the engine name.

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

## Tempo objectives

`preserve_plan_window` now has type-specific, non-terminal grading. For each declared
window, `too_slow`, `premature`, and `over_budget` move `active` or `preserved` to
`degraded`; `in_time` moves `active` or `degraded` to `preserved`. An authored window
may additionally opt `outpaced` into degradation. The defaults deliberately use
`degraded`, never terminal `failed`, because the learner must be able to rewind and
retry. Every applied transition carries its `tempo:` evidence reference.

A `preserve_plan_window` objective may not repeat those type-owned verdicts as authored
`timing_window` success conditions. Validation raises `PLAN_WINDOW_CONDITION_REDUNDANT` at the
condition pointer. The earlier double declaration did not override the built-in rule at the verdict
node; it fired one ply later from the inherited `preserved` or `degraded` state, which could stop an
authored consequence after its actual timing result.

## Current limits

- Authored endgame drafts, including the B+N trajectory root, have ledger-verified
  Syzygy assessments through `make verify-draft`; other declarations remain unverified until their own
  sibling artifacts pass the same admission path.
- `perfect_tablebase` is selectable only where the capability registry publishes a
  configured tablebase provider. Provider loss is a named refusal, never an engine
  fallback presented as exact resistance.
- `practical_resistance` requires both Maia and tablebase capabilities and a root
  in tablebase range. It refuses rather than substituting when no measured
  category-preserving reply has positive concession mass.
- Stockfish scores are recorded evidence, not grading authority.
- Historical plies pre-dating run schema v0.7 cannot identify the applied policy.
- An authored root claim above seven pieces is reviewable content, not a
  machine-proved assessment.

`follow_theory` is a stricter sibling to the outcome monotone law: its reachable
graph is `active → preserved → degraded`, with no absorbing result state. Theory
membership is not WDL grading, and a finished chess game does not change that
objective automatically.
