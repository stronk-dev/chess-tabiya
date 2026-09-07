# Teardown: Noctie (noctie.ai) — desk research

> **2026-09-07 boundary refresh (CLP-a24):** Current first party now documents Takeback, complete
> move-list reading, finished-game Review and game history, while requiring an account and Club
> subscription for play/save/training. It still does not state whether a replaced continuation
> survives. Keep the join unverified; do not turn source silence into “destroyed/not surfaced.”

- Date: 2026-08-11
- Feeds: Q1a / E1
- Method: desk / experience mining, no account. Sources: noctie.ai marketing pages, FAQ,
  blog; Apple App Store listing (description + release notes + user reviews); Product Hunt
  reviews; third-party reviews (Medium/Substack, aitoolsexplorer); web searches for
  Reddit/YouTube coverage.
- Provenance marks: [V] = URL fetched and read; [P] = search-snippet or unfetchable source;
  [M] = model knowledge.

## 2026-09-07 refresh: Noctie is a joined learning loop

The earlier teardown asked a deliberately narrow E1 question: whether Noctie's takeback preserves
an alternate attempt. That question still matters, but it understates the current competitive
overlap. Noctie now presents one joined path rather than a collection of tools:

> play a human-shaped opponent → receive optional move feedback → review the finished game →
> solve selected mistakes again → return through a scheduled deck

This is a first-party capability record, not an effectiveness verdict. The subscribed product was
not driven in this pass.

### What currently ships

- `[V]` Noctie's own accessibility guide describes Play, finished-game Review, flashcards generated
  from mistakes, opening books, scenarios, themes, linked Chess.com/Lichess imports, progress and
  rank as one product. Flashcards can be solved inside Review or later from their deck, and imported
  games enter the same Review/flashcard path. [Current feature guide](https://noctie.ai/docs/blind-mode-guide/)
- `[V]` Automatic cards are advertised as coming from the game's most instructive mistakes and are
  grouped into opening mistakes, missed checkmates, endgame mistakes, missed tactics and other
  decks. A smart queue applies spaced repetition across the selected decks.
  [Puzzles from your games](https://noctie.ai/puzzles-from-your-games/)
- `[V]` The vendor's 2024 retrospective says these automatic flashcards were popular **and** that
  learners felt overwhelmed by the number of unsolved exercises. Its response was bounded Smart
  Decks, static authored decks, a composable Smart Queue and visible progress. This is vendor
  self-report, but it is direct evidence that generation volume is a UX failure mode rather than a
  measure of training depth.
  [Everything Noctie launched in 2024](https://noctie.ai/newsletter/everything-we-launched-in-2024/)
- `[V]` The 2026 Opening Trainer joins named openings or imported annotated repertoires to the same
  opponent. It can cover variations in order or weighted-randomly, signal book completion/deviation,
  permit off-book bonus moves, restart from a point, focus bookmarked lines and keep several books
  active. [Improved Opening Training](https://noctie.ai/newsletter/improved-opening-training-in-noctie/)
- `[V]` Live feedback is a seven-grade color scale and can be disabled until after the game. Noctie
  says the grade reflects how a move appears to a human rather than centipawn loss. The public page
  does not publish the classifier, thresholds, calibration population or reproducible validation,
  so the mechanism and claimed quality remain vendor assertions.
  [Instant move feedback](https://noctie.ai/instant-move-feedback/)
- `[V]` Noctie says its opponent model was trained on more than one billion human games and models
  opening choices, mistakes and move timing across levels. The public explanation does not expose a
  versioned model, test population, per-band score, sequence-coherence measure or independent
  human-likeness result. [How chess AI works](https://noctie.ai/chess-ai/)
- `[V]` Its current roadmap calls deeper Review, pattern visualisation, flashcard deduplication and
  reconciliation of engine evaluation with Noctie intuition unfinished. It explicitly says the
  proposed intelligent Review will use no LLM. That is evidence that Noctie's present integration
  is stronger than its explanation depth, not evidence that its semantic analysis is already richer
  than Tabiya's. [Noctie roadmap](https://noctie.ai/roadmap/)

### The exact competitive lesson

Noctie's strongest current primitive is **automatic continuity**. A normal game produces a bounded,
named thing to do next without asking the learner to understand Stockfish, Maia, classifiers,
evidence sources or scheduling. `[M]` Its fun character comes from the whole wrapper—an opponent at
your level, ranks, streak-scale return rituals, daily/weekly entries and visible deck progress—not
from a chat persona alone.

The mistake deck is therefore not merely a content feature. It is a typed join across game identity,
moment selection, exercise construction, categorisation, deduplication, scheduling and progress.
Noctie's own overload report is the negative control: if selection is weak, better generation makes
the learner's queue worse.

### Tabiya gap map at current HEAD

| Noctie continuity | Tabiya foundation | Current 1.0 state | Required transformation |
|---|---|---|---|
| Human-shaped sparring across games, openings and scenarios | Maia/engine workers, opening identity, semantic evidence and a drafted layered bot policy | `planning/roadmap-1.0.receipt.json` records bot evidence as partial, state/defaults blocked and the learner experience missing `[V]` | Finish trustworthy versioned policy layers and one honest bot-card→play→history→Review journey. A name or Elo label is not behavior. |
| A finished game automatically creates selected exercises | Review compiler/moment work, run graph, imported games, grades and return scheduling | Review's API/state are partial but its whole-game experience is missing; `return-scheduling.md` remains draft `[V]` | Compile an admitted Review moment into a **return-deck entry** retaining source game, exact position, evidence receipts, selection reason and branch objective. Abstain if no grounded exercise exists. |
| Decks organize the queue by the mistake's kind | Semantic event registry, opening/phase identity, authored pack modes | Producers exist, but no production deck taxonomy or moment→drill population contract is live `[V]` | Categories derive from registered facts (opening departure, missed tactic, endgame conversion, structure/plan event), never free text or an LLM label. Preserve an inspector drill-down. |
| Spaced queue and progress | Attempts/schedules plus drafted return scheduling; longitudinal store and skills/style work | Learner model has narrow rating/history APIs, but profile/style/recommendation UX and trusted longitudinal state remain blocked `[V]` | Bound queue size, deduplicate exact moments, publish why/when an item returns and keep personal history optional. |
| Annotated opening books flow directly into bot practice | Pack/theory/opening primitives and theory-strict opponent route | Theory/content APIs and library UX remain incomplete; official 1.0 content is missing `[V]` | One theory→opening drill→full-game opponent→Review→return path, with deviation/off-book behavior explicit. |
| Themes combine instructions, cards and playable scenarios | Principles, shapes, theory, drill packs and consequence runtime | The foundation is richer, but learner-facing library/content completion is missing `[V]` | Compose cited theory and authored scenarios around the same pack; do not create a parallel generic lesson/card runtime. |
| Rank/progress/daily return make practice feel alive | Rating, concept credit, campaign/event plans and immutable attempts | Campaign has no API or web journey; learner-model UX is partial `[V]` | Use honest attempt/concept/event facts for long-term rewards and campaign resources; never manufacture mastery or ration retries. |

The internal status claims above are checked against `planning/roadmap-1.0.receipt.json`,
`docs/features.md`, `rfc/bot-policy.md`, `rfc/review-evidence-compiler.md` and
`rfc/return-scheduling.md` at 2026-09-07. `[V]`

### What we should adopt, transform and refuse

**Adopt:** one-click continuity; a bounded post-game queue; clear deck categories and progress;
the same human-policy opponent across opening, custom-position, drill and full-game contexts;
opening deviation/off-book controls; and accessible parity across Play, Review and the return queue.

**Transform:** a generated puzzle becomes a source-bound **play-the-consequence return entry**.
The first action may still be a tactical move when that is what the evidence establishes, but the
entry retains the original attempt and can continue far enough to test the consequence, rewind and
compare. Structural moments use the same path: for example, an evidence-backed pawn-island change,
loose-piece event or opening departure can seed a defensive/plan rehearsal without pretending an
engine delta explains the lesson.

**Refuse:** unlimited automatic puzzle accumulation; “instructive” as an undocumented score;
opaque human-like or Elo claims; LLM-selected chess truth; a move-grade dashboard as the Review;
and a second card runtime disconnected from packs, branches and evidence provenance.

### New architecture obligation

The capability watch previously had `review_reentry` and `longitudinal_coaching_ritual`, but no
unit for the join between them. `mistake_derived_return_decks` is now explicit. Its producer chain
is:

```text
finished game
  → admitted Review moments
  → exact semantic/grade/opening evidence
  → exercise eligibility + deduplication
  → pack-compatible branch objective
  → bounded return deck + schedule
  → completion/progress facts
```

This does **not** authorize an implementation from this dossier. It makes the missing join visible
to the Review, drill/content and learner-history RFC lanes so it cannot fall between them.

## Q1. Takeback semantics: is the original attempt preserved after a takeback?

**Finding, refreshed 2026-09-07: takebacks, full move-list review and game history exist; no
public source binds them into a retained alternate attempt. Unresolved — needs subscribed
hands-on. No directional inference is licensed.**

- Takebacks confirmed as a first-class feature: "if you make a mistake, you can take it back
  and ask for a hint." [V] https://noctie.ai
- Third-party feature writeup: "Hints and Move Takeback: request a hint or take back a move
  mid-game to explore alternatives." [V] https://aitoolsexplorer.com/ai-tools/noctie-chess-ai/
- Original desk-search boundary: no mention of the taken-back move being kept as an alternate
  attempt or variation tree in any of: FAQ [V] https://noctie.ai/faq (13 questions, none on takebacks),
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
