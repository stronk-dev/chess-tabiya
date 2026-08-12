# 02 — Product shape

The thinnest design doc on purpose: shape questions (business model, platform, UX
surface) are mostly **open** and owned by exploration Q2/Q3/Q9. Living successor to the
shape-relevant parts of `archive/brief-v2/02_MARKET_AND_EXISTING_SOLUTIONS.md` and
`10_UX_BRANCHING_AND_REWIND.md`.

## Product order — SETTLED (owner ruling 2026-08-11)

Tabiya is built **breadth first, content second, optimization third**. The
drill-client vertical slice incorrectly allowed one schema-example pack to
define the entire shell. Packs are one entry point beside Just Play, phase
discovery, from-position play, review, live/stream/academy contexts, creation,
and the user's library.

The exhaustive surface map, app-shell information architecture, and
breadth-complete gates are canonical in `03-product-breadth.md`. Earlier v0 or
phase deferrals do not silently remove a user-facing surface from architectural
planning. A surface can be excluded only by a fresh owner ruling; otherwise it
must reach a minimal real end-to-end implementation before content becomes the
main work.

## Product posture — OPEN (exploration Q2)

Four decisions must not be collapsed into a "paid vs OSS vs self-hosted" choice:

1. **Source model:** open source, source-available, or proprietary components.
2. **Deployment:** local-only, self-hostable, hosted, or a supported combination.
3. **Monetization:** free/donations, paid hosting, support, paid content, or another model.
4. **Content/data rights:** licensing and provenance for packs, annotations, historical
   games, model weights, and derived datasets.

The brief's two commercial assessments remain useful context, not choices on those axes:
self-hosted personal value scored 9/10; the unproven SaaS case scored 5/10. Licensing
constrains combinations: Stockfish GPLv3, Maia-3 AGPL-3.0, Lichess dumps CC0, and several
candidate chess libraries are copyleft according to the archive research. Copyleft does
not prohibit charging; exact source/distribution obligations depend on architecture and
deployment and require review before public or proprietary release
(`archive/brief-v2/08_ENGINE_CORPUS_AND_CONTENT.md` §Licensing notes).

**Deployment axis — SETTLED 2026-08-12 (owner ruling): hosted multi-user.**
Supersedes the self-hosted working default on this axis only; source model,
monetization, and content/data rights are unchanged and remain OSS-compatible
build-for-self with no assumed revenue model.

What follows mechanically, and is scheduled rather than open:

- **Identity is a real boundary.** Accounts, authentication, and per-viewer
  authorization — not a local profile. Nothing in the current system has any
  notion of a user.
- **The writer lease is not an authorization model.** It is a concurrency guard
  that today publishes its own credential to unauthenticated readers. On a
  hosted deployment that is the whole access-control story, so closing it is a
  prerequisite to hosting, not a hardening task afterwards.
- **AGPL-3.0 §13 now binds.** Network use triggers the source-offer obligation.
  This is consistent with the chosen licence and with Maia-3's own AGPL, but the
  user-facing source offer must actually exist before the service is public.
- **Hosting cost becomes a real constraint.** The browser-run-engines posture was
  justified by keeping serving near-static; per-user server-side engine work now
  has a bill attached. The archive's own scoring (self-hosted 9/10, SaaS 5/10)
  is context for that cost, not a reason to revisit the ruling.
- **ADR-0004's revisit trigger has fired.** A fired trigger is not a reversal:
  a modular monolith remains a defensible architecture for a hosted deployment.
  It needs an explicit re-decision that adds the auth boundary, not a rewrite.

## Platform — OPEN (exploration Q3)

Working default: web-first (TypeScript/React + chessground per the archive sketch),
responsive. Mobile-native excluded from v0 (three times over, in the brief's scope
docs). The unexamined question: whether the rehearsal loop — short, repeatable,
tactile — is actually a strong mobile-web/PWA fit. Revisit after Q1a/Q1b show evidence.

## Positioning (settled at design level)

The comparison axis is not personalization; it is:

> Does the product support active, repeatable rehearsal of a whole phase or transition,
> with preserved alternatives and outcome-aware feedback?

Nearest neighbors and what they suggest (desk research; hands-on verification is
exploration Q1a):

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

These are hypotheses owned by exploration Q9, not proof that the interaction is
comprehensible. Low-fidelity testing must resolve branch growth, navigation, comparison
overload, and destructive-action mistakes before they become an RFC.

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
