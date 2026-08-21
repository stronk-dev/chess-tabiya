# Grounded Review Map and re-entry

**Platform-alignment question:** R7  
**Date:** 2026-08-21  
**Status:** shipped-product and targeted desk arms answered; same-game candidate prototype and owner
use remain  
**Instrument:** `tools/r7-review-map-harness/`

## Verdict

Tabiya already has the hardest mechanical part competitors usually omit: a reviewed moment can
rewind, fork and continue inside the same run, so the original continuation and the new attempt both
survive for later comparison. `[V]` But the surface is not yet the requested Review Map. It selects
from nine declared projections with **zero F2 semantic-event or avoidance inputs**, offers exactly
one per-moment learning action, lets private and public views choose different top-eight sets, and
mislabels every exported card as engine-grounded regardless of its real source. (`story.ts`,
`GameStoryScreen.svelte`, `RunService.publicStory`; D687–D689)

The competitor lesson is not “copy Game Review.” It is that a review ritual needs three separate
objects:

1. a **bounded moment** chosen by a declared, non-LLM policy;
2. a **grounded explanation packet** that may combine exact facts without changing their source;
3. an **action door**—retry, branch/compare, cited theory or drill—whose target is the same position.

The current Story has part of 1, a strong foundation for 2, and only one form of 3. F6 cannot be
drafted yet: R7 still owes the same-game candidate comparison and O7 must decide which semantic
families may become moments and what role an engine threshold plays.

## Method

The current-product arm executed one legal castling edge through both sealed F2 selection and
`storyMoments()`, inspected the compiled consumer and renderer, traced private/public/card/re-entry
paths, counted action doors, and pinned the result in four executable checks plus a generated
read-only report. `[V]`

The targeted desk arm used current official/product sources. Vendor pages establish offered behavior,
not pedagogical effectiveness or explanation correctness. No paid/login-gated hands-on session was
manufactured.

## 1. What ships

### 1.1 Strong foundation: preserved re-entry

`[V]` The primary action rewinds the existing run to `entryNodeId`, forks with label
`story-reentry`, and returns to the ordinary run surface. It does not create a one-ply puzzle or
erase the source line. Terminal moments enter at the playable parent. This is materially stronger
than a “Retry until the engine accepts one move” interaction. (`App.svelte:326-332`; `story.ts`)

`[V]` Story prose is rendered through the F1 admitted-view boundary. The LLM is optional and
downstream; deterministic evidence sentences exist with the provider off. Pending analysis and no
grounded moments are explicit states.

### 1.2 The selector is still evaluation/event-led

The current moment families are pivotal marker, recorded-evaluation shift of at least **150 cp**,
last recorded position within one pawn before an imported loss, first detected endgame, shape span,
and terminal/imported result. `[V]`

`[V]` Ranking is a fixed kind priority—outcome, eval pivot, last-level, phase change, endgame,
irreversibility, shape, other—then absolute evaluation delta, then ply. The rule is declared as a
presentation convention, not chess significance, which is honest. But none of F2's 33
operand-preserving semantic events or eleven denominator-bearing avoidance projections can become a
Story moment. A castling test proves the separation: F2 selects exact `castled`; Story independently
emits the older `irreversibility` marker. (D689)

### 1.3 One action, two top-eight policies, one false footer

`[V]` A selected private moment offers one learning door: **Re-enter and play from here**. There is
no cited-theory, drill or compare action. Export, share and optional narration are screen actions,
not answers to “what should I do with this moment?”

`[V]` The private client takes ranked top eight and then restores chronological display. The public
route takes the chronological first eight and ignores rank. This is D688: a shared recap is not the
same bounded story the learner chose to share.

`[V]` The PNG card exports only the first sentence and stamps a fixed recorded-engine footer.
Rules markers, shapes, endgames, outcomes and declared conventions can all occupy that slot. This is
D687: source truth survives the manifest and is lost in the last presentation function.

## 2. What each competitor does best

### Chess.com — best guided ritual and adjacent doors

Chess.com's current help page presents a guided sequence of classifications, key moments, coach
explanations and Retry, distinct from free exploration in Self Analysis. Concept-specific reveals
include fork, lost-piece, checkmate and idea views; opening identity links to an opening page and may
show the learner's opening history and a course suggestion. `[V]`
([Game Review help](https://support.chess.com/en/articles/8584089-how-does-game-review-work))

Transfer: one obvious review ritual, explanation-bound visuals, and a nearby retry/theory door.
Refusal: Accuracy/performance ratings and “find the best move” are engine-grading products, not
Tabiya's default moment truth. The useful transform is retrying a consequence with preserved attempts.

### Lichess — best free analysis/theory substrate and focused mistake mode

Lichess lists unlimited Learn from Your Mistakes, studies and Insights alongside its analysis board.
Its blind-mode tutorial states that the interactive mode hides evaluation labels while asking the
learner to find a better move, with board or typed input. `[V]`
([features](https://lichess.org/features),
[blind-mode tutorial](https://lichess.org/page/blind-mode-tutorial))

Transfer: hide the verdict during retry, accept equivalent input paths, keep analysis/study as an
explicit deeper destination. Limitation: the unit remains an engine-identified mistake and improved
move, not a multi-consequence branch preserved for comparison.

### BeaconChess — best candidate/reply continuity

Beacon says it combines human-policy candidates, engine checking, chess-specific detectors and
several likely replies on one board; it explicitly says the shortlist is non-exhaustive and automated
explanations can be wrong. `[V]`
([product](https://beaconchess.com/),
[candidate moves](https://beaconchess.com/features/candidate-moves))

Transfer: keep a claim, its squares/arrows, plausible replies and reset/compare action bound to one
decision point. Refusal: a candidate shortlist is direct analysis assistance and belongs only in an
explicit Analyze boundary here; detector prose cannot be admitted merely because Stockfish checked
the resulting position.

### Quackmate — best one-moment ritual and share/profile pull

Quackmate presents one turning point per game, a short “why,” a better continuation playable on the
same board, plus a shareable player profile and recurring recap/weekly-plan ritual. `[V]`
([Quackmate](https://quackmate.app/))

Transfer: one small default moment can be more legible than eight, and the same grounded record can
serve private review and a social card. Refusal: its advertised engine-selected turning point,
better-line language and causal coach prose exceed what Tabiya may claim without a declared grading
and explanation authority.

## 3. Candidate contract to test next

This is a research candidate, not O7:

```text
one bounded moment projection
  identity: run + branch + node + policy version
  trigger: declared recorded fact(s), never LLM prose
  explanation: 0–2 admitted rendered items, unused budget allowed
  actions: retry/branch always; compare after an attempt; theory/drill only on exact identity join
  sharing: private and public consume the same moment IDs and provenance
  abstention: zero useful moments is a valid result
```

The same-game experiment must compare at least three policies over fixed recorded games: current
Story ranking; one-moment engine-pivot baseline; and a mixed exact-event policy with module-specific
eligibility and at most one optional engine context. Measure moment count, source mix,
repeated/generic families, recall of the primary fact, chosen action, and whether retry precedes
analysis reveal. A policy fails automatically if it creates a moment with no action, changes
private/public IDs, fills spare budget with D686-style generic facts, or uses an LLM to select/grade.

## Residual and routing

- **R7:** build and run the same-game candidate instrument; owner use replaces recruited panels.
- **O7:** rule moment families, engine-label role, default bound, theory/human context and share forms.
- **F6:** one compiled moment projection for private Story, public share and social card; action doors;
  deterministic fallback; D687/D688 repair.
- **F5:** supplies module-specific eligibility/presets but does not choose review moments.
- **F7:** owns theory/drill identity joins; absence must remain honest.
- **F9:** longitudinal focus is excluded from the per-game selector.

R7 is **not complete**. The current-product and targeted competitor arms are complete; the fixed-game
candidate comparison and owner-use decision remain.
