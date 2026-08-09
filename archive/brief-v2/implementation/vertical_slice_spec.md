# Vertical slice specification

## Goal

Prove that a user can play a meaningful middlegame segment, rewind, choose another plan, and receive a comparison that is more useful than viewing two engine lines.

## Included

- one reviewed middlegame pack;
- start from FEN plus history;
- objective prompt;
- Maia opponent with Stockfish guardrail;
- 8–12-ply segment;
- immutable branch graph;
- rewind to root checkpoint;
- second branch;
- dual-board comparison;
- objective, WDL/eval and 3–5 authored/derived differences;
- replay same plan with another opponent seed;
- PGN export.

## Excluded

- accounts beyond local user;
- personal game import;
- bulk Lichess corpus;
- LLM feedback;
- full opening repertoire;
- native matchmaking;
- mobile app;
- automatic pack generation.

## Acceptance scenario

1. User opens pack.
2. Board is ready in <250 ms warm.
3. User sees objective but no evaluation.
4. User plays a move.
5. Opponent replies through policy broker.
6. Segment reaches checkpoint.
7. Branch A is preserved.
8. User rewinds and plays a different plan.
9. Branch B is preserved.
10. Compare mode aligns both lines and displays objective/timing/structure differences.
11. User restarts Branch B with a new defense.
12. Run exports to legal PGN variations.

## First content choice

Use a reviewed position where:

- at least two moves are objectively playable;
- one plan is more timely for the stated objective;
- consequence appears within 8–12 plies;
- position is not resolved by a one-move tactic;
- strong reviewers agree on the lesson.
