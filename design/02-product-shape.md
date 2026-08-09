# 02 — Product shape

The thinnest design doc on purpose: shape questions (business model, platform, UX
surface) are mostly **open** and owned by exploration Q2/Q3. Living successor to the
shape-relevant parts of `archive/brief-v2/02_MARKET_AND_EXISTING_SOLUTIONS.md` and
`10_UX_BRANCHING_AND_REWIND.md`.

## Business model — OPEN (exploration Q2)

Two questions the brief refuses to collapse into one:

1. Is a self-hosted tool worth building? Desk verdict: yes (9/10). Ownership, latency,
   unrestricted usage, modifiability, good local UX are legitimate value. Paid SaaS is
   not a blocker.
2. Would a public commercial product have substitutes? Yes (5/10 SaaS case).

Licensing constrains the space: Stockfish GPLv3, Maia-3 AGPL-3.0, Lichess dumps CC0,
several chess libs copyleft. Self-hosted OSS: largely compatible. Proprietary hosted:
needs legal review.

**Working default until Q2 is decided:** build-for-self, OSS-compatible choices, no
decision that forecloses a paid tier later.

## Platform — OPEN (exploration Q3)

Working default: web-first (TypeScript/React + chessground per the archive sketch),
responsive. Mobile-native excluded from v0 (three times over, in the brief's scope
docs). The unexamined question: whether the rehearsal loop — short, repeatable,
tactile — is actually a strong mobile-web/PWA fit. Revisit after Q1 shows evidence.

## Positioning (settled at design level)

The comparison axis is not personalization; it is:

> Does the product support active, repeatable rehearsal of a whole phase or transition,
> with preserved alternatives and outcome-aware feedback?

Nearest neighbors and what they prove (desk research; hands-on verification is
exploration Q1):

- **Chess Endgame Training** — the endgame concept is right; the gap is "immediate,
  pleasant, practical, varied, connected to earlier phases" (owner's field report:
  slow, poor UX — unbenchmarked, must reproduce).
- **ChessDojo sparring** — the pedagogy is right; missing software support (instant
  repeatability, persistent branches, controlled defense variation, objective tracking).
- **Noctie** — closest paid sparring; no branch graph, no checkpoint/replay protocol,
  no played-plan comparison, feedback move-level.
- **Chessable et al.** — the unit is a card/line; the gap is the bridge from "I
  recalled the move" to "I understand which structure I chose and what one slow move
  changes."
- **WhyThisMove / Maia platform** — proof the engine/data plumbing is **not a moat**;
  the opportunity is the rehearsal runtime and curriculum.

## UX commitments (design-level, from `10_UX_BRANCHING_AND_REWIND.md`)

- **Rewind is an experiment, not an undo.** Old branches stay immutable; rewind must
  feel instantaneous and intentional.
- **Layout:** active board center; bottom timeline with *semantic* checkpoint markers
  (theory boundary, plan commitment, structure change, tactical resolution, endgame
  transition); side rail of branch cards (first divergent move, intent, objective
  state, thumbnail, result).
- **Keyboard-first** (exact bindings changeable): rewind, fork, branch switch, compare
  swap; one click to replay same root vs new defense or opposite color.
- **Anti-contamination default:** hide eval bar, move labels, engine arrows, human
  frequencies until segment end or explicit request.
- **Latency budgets** (targets to benchmark, not measurements): board ready <250 ms
  warm · branch switch <50 ms · rewind <100 ms · cached opponent move perceived-instant
  · uncached Maia <500 ms · shallow Stockfish feedback <500 ms · deep analysis async.
  These budgets are themselves a competitive weapon — see the Chess Endgame Training
  gap and kill criterion K9.
- **Compare mode:** dual board at aligned relative plies + difference strip (eval/WDL
  trajectory, structure changes, timing events, key piece routes) + narrative mode
  (causal, not move-by-move). Branch race (alternating moves on two boards) stays
  experimental and optional.
- **Session resume:** branch graph persisted as an event log — resume any branch,
  export PGN with variations, compare a later retry with the original.
