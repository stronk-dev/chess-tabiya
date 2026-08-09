# ADR-0002 — Stockfish is judge, not default opponent

## Decision

Use Stockfish for objective truth and tactical guardrails. Use corpus/Maia/pack policies for normal opponent moves, except in explicit strong-engine modes.

## Rationale

Weakened Stockfish does not model human move choice and may make artificial errors.
