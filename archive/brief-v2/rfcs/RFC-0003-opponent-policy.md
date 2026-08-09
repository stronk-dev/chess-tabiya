# RFC-0003 — Opponent Policy Broker

## Status

Proposed.

## Problem

No single engine should drive every phase. The opponent must be plausible, objective-aware, varied and pack-compatible.

## Sources

- authored forced move;
- empirical corpus distribution;
- Maia distribution;
- Stockfish candidate/guardrail;
- Syzygy exact move set;
- human player through external/internal match.

## Pipeline

1. enumerate legal moves;
2. apply pack hard constraints;
3. attach corpus and Maia probabilities;
4. attach objective/engine state;
5. score plan compatibility;
6. apply diversity penalty based on prior runs;
7. sample using deterministic seed;
8. record complete decision evidence.

## Modes

- `theory_strict`;
- `human_common`;
- `plan_defense`;
- `practical_resistance`;
- `perfect_tablebase`;
- `strong_engine`;
- `human_external`.

## Open question

How much plan memory is needed before Maia branches feel coherent? Benchmark before inventing a complex planner.
