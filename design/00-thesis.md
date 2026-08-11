# 00 — Thesis

Living successor to `archive/brief-v2/00_CORRECTED_VERDICT.md`,
`01_PRODUCT_DEFINITION.md`, and `product/target_player_and_scope.md`. Amended as
exploration resolves questions; the archive originals stay frozen.

## What this is

**Working name: Tabiya** (repo `chess-tabiya`; owner ruling 2026-08-12) — the
position where theory ends and the real game begins, which is exactly what the
product trains.

A **chess phase rehearsal system** — closer to a flight simulator or a music practice
loop than to an analysis dashboard. It exists to create repeated, controlled execution
of chess decisions.

> **Do not just learn the move. Rehearse the game it creates.**

The core interaction is not "show me the engine move." It is:

> commit → play the consequence → rewind → branch → compare → replay under different resistance.

That interaction is a shared platform primitive, not a single pack screen.
Owner ruling 2026-08-11 sets **breadth before content depth**: it must support
solo and Just Play sessions, every chess phase, live/stream/academy and human
contexts, review, creation, return/progress, sharing, and the complete evidence
stack before authored catalog depth and scoring polish become the main work.
The canonical surface map and app-shell contract are
`design/03-product-breadth.md`.

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

**Precision correction (2026-08-12, ChessMotive teardown):** the originality
claim on *comparison* is specifically **comparison of two preserved attempts by
the same player**. Comparison-against-an-authority is not novel — ChessMotive
does it well, diffing a learner's stated candidates/line/evaluation against a
model answer. What no surveyed product does is preserve your own attempts and
compare them to each other.

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

**The product serves the ~1000 → 2000+ journey** (owner ruling 2026-08-10, resolving
the target-band DESIGN-GAP; supersedes the archive's 1400–2200 framing).

- **Core band, 1400–2000+:** the natively designed scope. A serious improver who has
  crossed the "hang fewer pieces" stage and now loses through plan selection, move
  order, timing, structure, attack/counterplay races, transitions, and conversion.
- **On-ramp band, 1000–1400:** served by **on-ramp packs** — the same pack object and
  runtime with three knobs turned: branch length 2–8 plies (consequences must arrive
  fast), pack-declared immediate blunder-guard feedback (show the consequence within a
  couple of plies, then rewind — a per-pack override of the delayed-feedback default,
  ADR-0006), and principle/threat-shaped objectives ("nothing hanging," "answer the
  threat," "convert the extra piece") instead of structure/tempo-shaped ones.
  Opponent-intent checkpoints ("what does their move want; what is the moved piece no
  longer doing?") are first-class here. Outcome Drill needs no adaptation — easier
  roots only.
- **Explicitly not:** a tactics puzzle trainer or lesson content. The 1000→1400
  tactics-volume leg is well served free elsewhere; on-ramp packs exist so the player
  graduates into core packs already fluent in rewind → branch → compare.

Not a hard gate in either direction — packs declare prerequisites and difficulty.

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

**2026-08-11 — owner sequencing amendment.** The narrow prototype passed as a
mechanism demo, but “content last” is now explicit: complete the full product
breadth in `03-product-breadth.md` before catalog depth. This supersedes any
reading of the 2026-08-09 line that would put pack A or one-mode polish next.

This section is amended (dated, superseding lines kept) as
`planning/exploration/gates.md` statuses change.
