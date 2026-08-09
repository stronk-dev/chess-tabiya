# Corrected executive verdict

## Decision

### Build the phase-drill prototype

The corrected concept is sufficiently distinct and useful to justify a serious self-hosted prototype.

Do **not** frame it as an AI coach. Do **not** make personal game analysis mandatory. Do **not** begin by ingesting billions of games. Do **not** let an LLM manufacture strategic lessons from raw engine output.

Build a fast rehearsal engine around curated or reviewed drill packs:

```text
OPENING
recall the theory
explain or choose the underlying idea
continue beyond book into the characteristic structure

MIDDLEGAME
commit to a plan
play 8–20 plies
rewind to a critical checkpoint
play an alternative branch
compare tempo, initiative, structure and outcome

ENDGAME
win / hold / save / resist
repeat against different practical defenses
preserve W/D/L rather than reproduce one machine line
```

## Scorecard

| Dimension | Score | Direct assessment |
|---|---:|---|
| Board, rules, PGN/FEN and branch runtime | 9/10 | Ordinary engineering |
| Stockfish integration | 9/10 | Mature UCI interface and cheap local inference |
| Maia-3 integration | 8/10 | UCI, Elo conditioning, sampling and MultiPV already exist |
| One-server feasibility | 9/10 | Comfortable for a single user or small alpha |
| Opening-to-middlegame drill feasibility | 8/10 | Technically easy; content authoring is the real cost |
| Long middlegame replay and branching | 9/10 | State model is straightforward; UX quality matters |
| Practical endgame outcome drilling | 9/10 | Syzygy plus Stockfish/Maia is a strong stack |
| Automatic strategic feedback | 4/10 | Unsafe to treat as solved |
| Curated strategic feedback | 8/10 | Strong if pack authors define concepts and checkpoints |
| Opponent coherence over 10–20 plies | 6/10 | Maia predicts plausible moves; coherent plans need policy support |
| Value over free/open tools | 8/10 | Existing free tools are fragmented by phase |
| Value over a best-of-breed paid stack | 6/10 | Workflow depth can win; breadth and authored content will initially lose |
| Worth building for personal/self-hosted use | 9/10 | Clear yes |
| Ready-made SaaS business case | 5/10 | Separate question; not proven by the technical thesis |

## What already exists

The individual pieces are not novel:

- opening line repetition;
- play from a FEN;
- human-like bots;
- engine evaluation;
- endgame tablebases;
- custom-position challenges;
- variation trees;
- personal game import.

The whitespace is the **integrated rehearsal protocol**:

> train the opening until it becomes a position → play the position far enough for the plan to matter → fork and replay the critical segment → finish or jump into the resulting outcome problem.

ChessDojo already teaches a manual version of this logic: choose an opening position around moves 5–15, play until the position no longer resembles the opening, analyze afterward, and repeat fixed middlegame positions from both sides. Chess Endgame Training already demonstrates that full outcome play with draw goals and branch continuation is useful. The proposed software product industrializes and connects those workflows.

## The sharpest product promise

> **Do not just learn the move. Rehearse the game it creates.**

Alternative, more literal wording:

> **Drill openings, middlegames and endgames by playing the consequences, then rewind and try again.**

## Target player

The strongest initial fit is not a complete beginner. It is the player who:

- knows basic tactics and opening principles;
- has enough theory to reach recognizable structures;
- loses games through move order, timing, pawn-break choice, exchanges, and conversion rather than only hanging pieces;
- understands an explanation when shown but lacks enough repeated execution;
- roughly occupies the serious club/intermediate-to-expert range.

A practical initial rating envelope is approximately **1400–2200 online rapid**, with content difficulty rather than account rating ultimately controlling the experience. Stronger players can still use curated packs; weaker players need more guided content and shorter branches.

## The hard truth

The engines are the easy part. A credible product requires a **content system**.

Stockfish can tell you that one move is better. Maia can tell you what a human is likely to play. A database can tell you what happened historically. None of those sources, alone, can reliably teach:

- why this Sicilian move order loses a tempo;
- why opening the center now favors one side's development;
- why a slow improving move misses the only timing window;
- which exchange transforms the position into a favorable endgame;
- what plan should be repeated in a family of related positions.

For v0, those claims should come from reviewed drill packs, with engines used to validate and animate them.

## Final answer

This is **not** “don't bother, you are reinventing.”

It is:

> **Build it, but build the drill runtime and content format first. The product dies if it becomes a Stockfish review screen with a rewind button.**
