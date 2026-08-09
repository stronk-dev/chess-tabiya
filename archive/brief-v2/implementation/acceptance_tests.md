# Acceptance tests

## Branch runtime

- Rewinding to a checkpoint and moving creates a distinct branch.
- Original branch remains byte-for-byte reproducible.
- Repetition, castling and en-passant state survive rewind.
- Exported PGN loads with both variations.

## Opponent

- Same pack/seed/settings produces same moves.
- New branch seed produces configured diversity.
- No illegal move is emitted.
- Guardrail rejects configured catastrophic moves.
- Every selected move stores source probabilities and guard evidence.

## Plan Drill

- Feedback remains hidden until stop condition.
- Segment stops at semantic checkpoint.
- Two branches align correctly by fork-relative ply.
- Objective state can differ from engine move rank.

## Outcome Drill

- Tablebase win remains pass while WDL stays winning.
- Winning but slower legal move is not automatically failed.
- Draw loss is detected exactly in supported tablebase position.
- “same position, new defense” changes policy seed only.

## Performance

- Warm branch switch <50 ms on reference client.
- Rewind <100 ms.
- No stale engine result updates a rewound branch.
- Engine workers recover from crash without corrupting run state.
