# Grounded Review Map and re-entry

**Platform-alignment question:** R7  
**Date:** 2026-08-21  
**Status:** mechanical and targeted desk arms answered; owner use and O7 ruling remain
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

The current Story has part of 1, a strong foundation for 2, and only one form of 3. The fixed-game
comparison now adds two constraints: local semantic selection still overproduces on a long game,
while retained engine evidence reaches only openings. F6 cannot be drafted until O7 rules the
whole-game bound, admitted moment families and the engine's optional role.

## Method

The current-product arm executed one legal castling edge through both sealed F2 selection and
`storyMoments()`, inspected the compiled consumer and renderer, traced private/public/card/re-entry
paths, counted action doors, and pinned the result in five executable checks plus generated
read-only reports. The candidate arm ran three policies over the same eight stratified mainlines and
measured recorded-evaluation reach over all 49 eligible authored mainlines. `[V]`

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

### 3.1 Same-mainline result

The experiment compared current Story, a one-pivot recorded-engine baseline, and a narrow mixed
exact-event policy over two opening, two middlegame, two endgame and two cross-phase mainlines. `[V]`
The mixed arm applies module eligibility before F2 selection, retains at most one exact fact per
node, assigns every retained item a retry/branch action, and permits zero.

- Short games yielded **0–2** mixed moments, including honest abstention in two cases.
- The 52- and 60-ply trajectories yielded **13 and 16** moments. This is D690: even disciplined
  local selection cannot supply the whole-game bound. A second selector must choose among locally
  eligible moments; its unused budget must remain empty.
- Current Story reached its fixed eight-card ceiling on both long trajectories, while selecting
  **0–3** moments on the six shorter games. Its cap bounds volume but does not solve D689's input or
  action problem.
- Retained recorded evaluations support consecutive-ply comparison on **20/20 opening** mainlines
  and **0/29** middlegame/endgame mainlines (also 0/2 cross-phase). This is D691: an engine pivot is
  optional context at current reach, not a general review prerequisite.

The candidate establishes architecture, not the final policy: **module eligibility → local evidence
selection → whole-game moment selection → action-bound rendering**. O7 still owns the final
families, whole-game count/default, engine role and disclosure sequence.

## Residual and routing

- **R7:** mechanical and desk arms are complete; owner use replaces recruited panels.
- **O7:** rule moment families, engine-label role, default bound, theory/human context and share forms.
- **F6:** one compiled moment projection for private Story, public share and social card; action doors;
  deterministic fallback; D687/D688 repair.
- **F5:** supplies module-specific eligibility/presets but does not choose review moments.
- **F7:** owns theory/drill identity joins; absence must remain honest.
- **F9:** longitudinal focus is excluded from the per-game selector.

R7's **mechanical research is complete**. Owner use and O7's product ruling remain; neither is
manufactured by the harness.
