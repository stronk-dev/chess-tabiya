# Teardown: Chess Endgame Training (hands-on)

- **Feeds:** Q1a → E1 · K9 · protocol §1 in `teardown-protocols.md`
- **Session:** 2026-08-11, desktop Chrome (agent-driven via browser automation), app at
  https://chess-endgame-trainer.mooo.com, position `R+P vs R` #1/83 (`/position/5/6/0`).
- **Provenance:** `[V]` — everything below directly observed/measured this session
  unless marked otherwise.

## Measurements

| Metric | Observed |
|---|---|
| Cold app load | DOMContentLoaded 593 ms, load event 672 ms |
| Position open (list → playable board) | < 2 s including render; subjectively immediate |
| Opponent move source | one GET to `tablebase.lichess.ovh` per move (network log) |
| Tablebase API duration | 80–224 ms per call (browser resource timing) |
| First opponent reply (perceived) | ~2.1 s (app-side pacing/animation — cause not identified) |
| Subsequent opponent replies (perceived) | ~150–300 ms |
| Move-list navigation (jump to any node) | instant (local) |

**The "slow, poor UX" field report did not reproduce on desktop** beyond the ~2 s
first reply per position. The app is fast once warm. Caveats: single session, desktop
only, one position; mobile feel, many-position sessions, and offline behavior untested
— the owner's original impression may stem from mobile or from an older version.

## Behaviors observed

- **Real-time objective-state tracking — the headline finding.** Banners announce
  "You are receiving mate in N moves or less" and, immediately upon a win-forfeiting
  move, **"Unfeasible mate"** — without blocking the move. This is an embryonic form of
  our `objectiveState` machine (active→degraded) and the closest thing to
  outcome-preservation feedback seen in any product. **But it never says *why*** — no
  concept, no evidence, no remediation. State-flip detection without teaching: exactly
  the gap our feedback design (Q8) fills.
- **Branching is destructive.** Move-list click jumps to any node; playing a different
  move there **replaces** the recorded future (our 3.g8=Q Rh4+ line vanished when
  3.Rb2+ was played from node 2). Per-move trash-delete exists. No attempt persistence,
  no comparison. Confirms the matrix claim hands-on.
- **Manual/what-if mode** confirmed: toggle labeled "move also the opponent's pieces" —
  free two-sided exploration, but nothing records it as an attempt.
- **Syzygy defense is maximally resistant** (as expected from a tablebase): after the
  drill-losing blunder it found the study-like refutation immediately. Good truth
  source; zero pedagogy.
- Clean promotion picker; correct legality enforcement — though illegal moves are
  rejected **silently** (no feedback at all), which briefly confused even us.
- Content depth is real: 83 positions in R+P vs R alone, 20 subcategories under
  Rook & Pawn; positions launchable from FEN-in-URL with a target objective.

## Not yet tested (follow-up items — owner session or second pass)

Hint button, auto-solve wand, personal records, Stockfish depth/time settings,
mobile/PWA feel, offline behavior, the "checkmate in N" random mode.

## E1 / product implications

- CET covers: outcome play-out to result vs perfect resistance, objective-state
  banners, what-if exploration, deep curated position sets — free, MIT, browser-only.
- CET does not cover: preserved attempts, branch comparison, *why*-feedback, varied
  re-drilling of the same concept, any connection to earlier phases.
- **Whitespace intact on this product**, but K9's bar moves: our edge cannot be raw
  speed (CET is already fast on desktop). It must be attempts + comparison + evidence-
  backed feedback + variety. 1 of 4 protocol teardowns done.
