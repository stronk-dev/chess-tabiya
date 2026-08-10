# Teardown: Noctie (noctie.ai) — desk research

- Date: 2026-08-11
- Feeds: Q1a / E1
- Method: desk / experience mining, no account. Sources: noctie.ai marketing pages, FAQ,
  blog; Apple App Store listing (description + release notes + user reviews); Product Hunt
  reviews; third-party reviews (Medium/Substack, aitoolsexplorer); web searches for
  Reddit/YouTube coverage.
- Provenance marks: [V] = URL fetched and read; [P] = search-snippet or unfetchable source;
  [M] = model knowledge.

## Q1. Takeback semantics: is the original attempt preserved after a takeback?

**Finding: takebacks exist; NO public evidence the original attempt is preserved anywhere.
Unresolved — needs hands-on. Signal leans "destroyed/not surfaced."**

- Takebacks confirmed as a first-class feature: "if you make a mistake, you can take it back
  and ask for a hint." [V] https://noctie.ai
- Third-party feature writeup: "Hints and Move Takeback: request a hint or take back a move
  mid-game to explore alternatives." [V] https://aitoolsexplorer.com/ai-tools/noctie-chess-ai/
- Evidence of absence: no mention of the taken-back move being kept (history, review,
  variation tree) in any of: FAQ [V] https://noctie.ai/faq (13 questions, none on takebacks),
  homepage [V], blog index + sparring/intro posts [V] https://noctie.ai/blog,
  [V] https://noctie.ai/chess/creating-sparring-positions-in-noctie/,
  [V] https://noctie.ai/chess/introducing-noctie-ai-chess-helper/,
  App Store description/release notes/reviews [V] https://apps.apple.com/in/app/noctie-chess-trainer/id6444289077,
  [V] https://apps.apple.com/us/app/noctie-chess-trainer/id6444289077?see-all=reviews,
  Product Hunt reviews [V] https://www.producthunt.com/products/noctie-ai/reviews,
  Medium review [V] https://medium.com/@dcdelapointe/an-honest-review-of-noctie-ai-told-by-a-regular-chess-player-45b2e7612190.
- A search-result synthesis claimed takebacks are "as if those moves never happened," but that
  text traced to generic chess.com/etiquette pages, not Noctie — discarded as evidence. [M]

## Q2. Any side-by-side / explicit comparison of two played attempts or lines?

**Finding: no evidence of attempt-vs-attempt comparison anywhere. Closest analogue is a
single-move correction, not a branch comparison.**

- Medium review describes an "Alternative Solution" function: after the player's move (d3),
  the system presents the corrected move (d4) — a one-move suggested-vs-played correction
  inside a lesson/review, with no strategic explanation and no side-by-side line playout. [V]
  https://medium.com/@dcdelapointe/an-honest-review-of-noctie-ai-told-by-a-regular-chess-player-45b2e7612190
- Repetition exists without comparison: sparring blog says "Revisit the same Theme multiple
  times to explore different variations and outcomes" and "Noctie won't just repeat the same
  moves" — but describes no attempt history, no diffing, no tree of past tries. [V]
  https://noctie.ai/chess/creating-sparring-positions-in-noctie/
- Evidence of absence: no comparison/variation-tree feature mentioned in FAQ [V], homepage
  [V], App Store listing/reviews [V], Product Hunt reviews [V] (all URLs above). Post-game
  review is repeatedly described by users as minimal: "post-game review is very barebones,
  makes sense to complement with engine review" [P] (App Store review surfaced only in search
  snippet); analysis "still needs significant improvement" (reviewer Wad-medani) [V]
  https://apps.apple.com/us/app/noctie-chess-trainer/id6444289077?see-all=reviews

## Q3. Feedback timing: during play or post-game? Can it be hidden?

**Finding: move-quality feedback is shown live DURING play by default, and it is
configurable/hideable per quality — separately for games vs review.**

- During play, by design: "instant color feedback on your moves"; 7-grade human-perspective
  scale — red blunder, orange mistake, brown dubious, light green OK, dark green good/forced,
  blue great, purple excellent. [V] https://noctie.ai/faq, [V] https://noctie.ai
- Marketed as "Live Insights (LIT) ... real-time feedback on every move." [V]
  https://noctie.ai/chess/creating-sparring-positions-in-noctie/
- Hideable/configurable: App Store release notes — "Move quality feedback can now be set
  separately for games and review" and a "setting for which move feedback qualities you want
  highlights for on the board while playing." [V]
  https://apps.apple.com/in/app/noctie-chess-trainer/id6444289077
  (Deselecting all qualities = fully hidden is an inference from that wording, not verified.)
- Users value the live timing: "Real time feedback works much better for me than just end of
  game feedback" (Mahir Karim). [V] https://www.producthunt.com/products/noctie-ai/reviews

## Secondary: arbitrary position start + easy repetition

- Position entry: "Use the position builder to set up any chess position" [V] App Store
  listing (URL above); "Set up positions or choose among our in-built ones" [V]
  https://noctie.ai/custom-positions. Import of sparring positions via **PGN** file is
  documented [V] (sparring blog, URL above); direct **FEN** paste is not confirmed in any
  fetched source (Noctie publishes a "What is FEN" explainer, which suggests but does not
  prove support). Repetition is easy and encouraged: positions save into "Themes" and can be
  revisited repeatedly, with the AI varying its replies. [V] (sparring blog)
- One Product Hunt reviewer praises "replaying from a specific point in a game where a
  mistake was made" — replay-from-point exists; still no cross-attempt comparison mentioned.
  [V] https://www.producthunt.com/products/noctie-ai/reviews

## Residual uncertainty (needs hands-on session)

1. Takeback ground truth: take back a move mid-game, finish, open the game record/review —
   is the retracted move visible anywhere (PGN export, move list, review)? No public source
   answers this.
2. Whether deselecting all feedback qualities fully hides live feedback (vs. minimum set).
3. Direct FEN entry in the position builder (vs. PGN-only import).
4. What the "barebones" post-game review actually contains (move list? single-line? eval?).
5. Whether replaying a saved sparring position keeps any record of prior attempts (score,
   history list) even without comparison UI.

## E1 verdict contribution

Noctie has takebacks, live configurable move-grading, and repeatable custom positions, but no
public evidence of persistent branch-as-attempt preservation or any two-attempt comparison —
our core mechanic appears unimplemented there (pending hands-on confirmation of takeback
semantics).
