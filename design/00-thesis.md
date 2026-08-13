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

## The arc the product is actually for (owner, 2026-08-13)

> *"The drilling is nice but the true gem is branching play even with
> autodetected checkpoints, and being able to play a game as normal against a
> human-like opponent while truly applying an opening/middlegame/endgame
> strategy — steer the game early, and later know how to convert into advantage
> then grind out to win or draw."*

Recorded at thesis level because it sharpens what the product is *for* rather
than adding a feature. Packs are scaffolding; the destination is a whole game
played with intent across all three phases, forkable at the moments that mattered
— and those moments detected rather than authored, because a real game has no
author. `05-in-run-experience.md` §5a specifies the honest detectors.

Two consequences that follow, and both cut against easier designs:

- **Guidance names techniques, not moves.** *"This is a Lucena position; build a
  bridge"* teaches; *"play Rc8"* does not, and a learner who follows it has
  rehearsed obedience. `05` §5b.
- **The phases are not equally tractable, and the product must not pretend they
  are.** Openings have theory and corpus frequency; endgames have structure and
  tablebases; the middlegame has neither. That is why authored plan classes carry
  the middlegame and why honest abstention is a feature there rather than a
  failure.

## Why anyone would use it (owner, 2026-08-13)

> *"We can make the game so much more attractive if people can play against
> human-like bots but don't get punished for trying something — it will rewind and
> explain. And people might be way more enticed to play out that tricky endgame
> when they're behind if it's actively the target and expected that it's not a
> win, and the win is making the best of it."*

The features for this already exist; what was missing was the reason they matter.
Two mechanisms, and the second is the one nothing else in chess offers.

**1. Experimentation without cost.** Human-like resistance makes a game worth
playing; preserved branches make trying something free. You can play the dubious
sacrifice, see what a real opponent does to it, and still have the position you
left. Every other context charges you a lost game for that curiosity.

**2. A winnable target when you are losing.** This is the sharper one. Everywhere
else, being worse means you are losing, so playing on feels like prolonging a
defeat — which is exactly why people resign or bail out of the endgame that would
have taught them most. If the product declares the honest target up front — *this
is drawn with correct defence; hold it* — then being worse is the **premise**, not
the failure, and holding becomes an achievable win. `01-training-model.md` already
names it: **save** is rescuing a worse position, **hold** is defending a drawable
one. Pack C is exactly this — a rook ending "drawn with accurate defence and lost
constantly in practice".

Two consequences, both binding:

- **The target must be honest, so it can only be set where the result is
  assessable.** Below eight pieces a tablebase settles it. Above, it is an
  authored or engine judgement and must be labelled as one — Pack C's eleven
  pieces mean we can *assert* the draw, not prove it. A product that declares
  "this is held" and is wrong has done real damage, because the learner ground out
  a defence of a position that was already lost.
- **The consequence stays mandatory; only the retry is free.** *Rewind is an
  experiment, not an undo* (`05` §1). If rewind were frictionless during play,
  nothing would ever be committed and the whole rehearsal collapses. The rule is:
  **play it out, then go back** — never *take it back*.

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
