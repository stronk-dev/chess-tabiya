# 00 — Thesis

Living successor to `archive/brief-v2/00_CORRECTED_VERDICT.md`,
`01_PRODUCT_DEFINITION.md`, and `product/target_player_and_scope.md`. Amended as
exploration resolves questions; the archive originals stay frozen.

## What this is

A **chess phase rehearsal system** — closer to a flight simulator or a music practice
loop than to an analysis dashboard. It exists to create repeated, controlled execution
of chess decisions.

> **Do not just learn the move. Rehearse the game it creates.**

The core interaction is not "show me the engine move." It is:

> commit → play the consequence → rewind → branch → compare → replay under different resistance.

```text
OPENING      recall the theory · explain or choose the underlying idea ·
             continue beyond book into the characteristic structure
MIDDLEGAME   commit to a plan · play 8–20 plies · rewind to a critical checkpoint ·
             play an alternative branch · compare tempo, initiative, structure, outcome
ENDGAME      win / hold / save / resist · repeat against different practical defenses ·
             preserve W/D/L rather than reproduce one machine line
```

## The novelty claim (under test — exploration Q1a)

None of the pieces are novel: line repetition, play-from-FEN, human-like bots, engine
eval, tablebases, variation trees. The whitespace is the **integrated rehearsal
protocol**:

> train the opening until it becomes a position → play the position far enough for the
> plan to matter → fork and replay the critical segment → finish or jump into the
> resulting outcome problem.

ChessDojo documents a manual version of this; Chess Endgame Training demonstrates that
an endgame play-out interaction exists. Neither establishes the integrated product's
demand or learning effect. The product hypothesis industrializes and connects those
workflows. A branch here records an **attempt** (what was chosen blind, how the opponent
answered, whether the objective survived, what changed on retry) — not a passive engine
line.

Competitive whitespace is not the same as product value or learning efficacy. Q1b tests
whether target learners and coaches recognize and prefer the problem/interaction; Q1c
tests transfer and retention against simpler training formats after a slice exists.

## What it is not

Not a post-game analyzer, not an auto-puzzle feed, not a chat-first AI coach, not a
repertoire database with a nicer skin, not an engine sandbox where the user invents the
curriculum, not a generic bot ladder. And per the standing failure-shape warning:

> **The product dies if it becomes a Stockfish review screen with a rewind button.**

## Target player

A serious improver, roughly **1400–2200 online rapid**, who has crossed the
"hang fewer pieces" stage and now loses through plan selection, move order, timing,
structure, attack/counterplay races, transitions, and conversion. Not a hard gate —
packs declare prerequisites and difficulty.

## The hard truth

The engines are the easy part. A credible product requires a **content system**.
Stockfish validates, Maia predicts, the corpus witnesses — none of them can teach why a
move order loses a tempo or which plan a structure demands. For v0 those claims come
from reviewed drill packs; engines validate and animate them.

## Current verdict

**2026-08-09 — brief v2 desk verdict, unvalidated.** "Build the phase-drill prototype;
build the drill runtime and content format first." Worth building for self-hosted use:
9/10. SaaS business case: 5/10 (separate question). Weakest scored dimensions:
automatic strategic feedback 4/10, opponent coherence over 10–20 plies 6/10 — these are
exploration Q8 and Q5. Full scorecard: `archive/brief-v2/00_CORRECTED_VERDICT.md`.

This section is amended (dated, superseding lines kept) as
`planning/exploration/gates.md` statuses change.
