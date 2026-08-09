# RFC-0004 — Objectives and Grading

## Status

Proposed.

## Objective types

- `reach_structure`;
- `preserve_plan_window`;
- `execute_break`;
- `prevent_opponent_plan`;
- `transition_to_endgame`;
- `win`;
- `hold`;
- `save`;
- `resist`;
- `play_until_checkpoint`.

## Grading principles

- exact move matching only for explicit theory/procedure nodes;
- WDL preservation for endgames;
- tolerance bands for multiple playable moves;
- objective alignment separately reported from objective strength;
- delayed grading for middlegame segments;
- state-change explanations at checkpoints.

## State machine

`active → preserved | degraded | failed | achieved | transitioned`

A branch may transition from a Plan Drill to an Outcome Drill with a new objective while retaining provenance.
