# Assistance-surface taxonomy: the abstraction space, the field mapped into it, and our coverage

**Question (owner, 2026-08-22):** *"Are we sure we make full use of our evidence primitives?
Still feels like we're missing abstractions… proactive vs reactive, blunder prevention, move
rating, game rating, piece-board-highlight that lights up squares… so many options — we need to
smartly expose them and filter them."*
**Date:** 2026-08-22. Our-side facts derived at HEAD `b083ac8`; ledger head **D871 at
derivation, D872 landed in flight** (rows proposed from D873, none written). Field survey fetched this pass (three parallel web
passes; every `[V]` row read from the cited primary source, `[P]` secondary, `[M]` unsourced).
**Feeds:** Phase-3 module RFC and Phase-5 preset RFC (`planning/evidence-foundation-ux/plan.md`),
D841's eleven-module composition, `design/05` §3/§3-forms, D869/D870 (encounter variants).
**Status:** desk + code-derivation; answers the abstraction question; chooses no defaults.

## Verdict

1. **Seven axes are enough.** Every assistance affordance in a 14-product survey (85 fresh
   rows below, plus the repo's landed teardowns) is a point in **timing × initiative ×
   subject × form × valence × disclosure-cost × grounding**. No surveyed product forced an
   eighth axis: candidate extras collapse into existing structure (audience → the role term
   of the config algebra; persistence → a form property; "assistance-shedding" → a
   trajectory *through* the space, §5). `[M]` (the claim is analytic; the rows are the
   evidence it was tested against.)
2. **The felt gap is real but it is not a primitives gap — it is a named-cell gap.** The
   producer plane at HEAD is broad (20 producers / 126 projections, 33 semantic events + 11
   avoidance projections research-only, 30 accepted 2c ids implementing, 18 2d ids in review
   — `phase1-gap-matrix.md` `[V]`, `planning/evidence-foundation-ux/plan.md`). Mapped into
   the space, our primitives already reach **almost every cell the field serves**; what is
   missing is mostly the *module/admission* layer Phase 3 owns, plus exactly **five
   substantive holes**: the move-quality-grade family, game-level aggregates
   (accuracy/eval-graph), the longitudinal store, the opening-identity/book-depth join, and
   mate-in-N (§4). `[V]` per-cell below.
3. **Move classification by engine delta is FREE, and the anti-contamination default only
   delays it, never blocks it** (§4a — the explicit verdict). Verified at HEAD: **no
   production code computes any blunder/mistake/inaccuracy/accuracy label**; the words occur
   only in `BANNED_JUDGEMENTS` (`packages/runtime/src/voice.ts:93-97`), which constrains the
   **LLM renderer's vocabulary**, not evidence sources, and the evidence catalogue
   repeatedly disclaims *"not a move grade"* as a limitation — the vocabulary was fenced
   off at the source layer and never adjudicated as a module. The label is a rung-2 reading
   plus a **published convention**: Lichess's exact constants are now pinned from source
   (win%-drop ≥ 10/20/30; §2b), chess.com's bands are published in expected points. Under
   `design/05` §4a-layer-2 discipline it is admissible **with the number and threshold
   shown**, post-commit/review only, never rating-conditioned (R15 byte-identity).
4. **The refused cells are few, and every one already has a ruled transformation** per the
   adoption amendment (`design/02` — a conflict with an invariant is a design prompt, not a
   veto): pre-commit eval bar → post-game trajectory + inspector; always-on move grading →
   post-commit nudge under disclosure; Peek-style pre-commit grade lighting → requested
   rung-0 sight; plan/intent prose → cited shape entries (§4c).
5. **Six cell-families are novel to us** — served by no surveyed competitor and reachable
   from existing primitives: the avoided/negative reading with a denominator (D745-ruled),
   opportunity-normalized habits, attempt-unit metrics over preserved rewinds, the
   explainable bot miss (D818), prediction scored against the *human* distribution
   (D860/D869), and the prophylaxis/denial reading (§4d).
6. **"Smartly expose and filter" maps cleanly onto the existing algebra** — `requested
   preset ∩ workflow ceiling ∩ role ∩ availability` (design/05 §3-forms as amended) — with
   **one rule per axis** for what a preset may touch (§5). A preset is a point in only
   *three* of the seven axes (initiative ceiling, disclosure ceiling, budget); the other
   four are module declarations, evidence properties, or availability terms and are **not
   preset material**. That is the whole filtering model, and it is quotable by the Phase-3/5
   RFCs as written.

---

## 1. The seven axes

Definitions first, then the internal anchor that already governs each axis. The rule that
keeps the space honest is `design/05` §3-forms, quoted: *"Honesty attaches to the source.
Timing attaches to disclosure. Form attaches to neither."* The axes are independent by
construction; a product feature is a point, a module is a small region, a preset is a
ceiling over regions.

| Axis | Values | Internal anchor at HEAD |
|---|---|---|
| **Timing** | pre-commit / **at-commit** (staged move, before it lands) / post-commit / post-game / longitudinal | R3's module `Timing` enum ships four of five (`precommit/postcommit/disclosed/analysis`, `tools/r3-presentation-harness/module-contract.ts` `[V]`); the disclosure model (§3a-i: `attempt_end` re-closes, `outcome.reached` always discloses) owns the post-commit/post-game line; **longitudinal has no store** — R13's blocking finding (`grounded-coaching-aggregation.md`, cited in `player-analysis-and-skills.md` §6 `[V]`). At-commit is where Chessiverse's blunder guard and Lichess's move-confirmation live; ours is the staged-move slot Keep-Me-Safe was ruled into |
| **Initiative** | proactive-push / ambient-always-on / on-request / on-hover-inspect | §3a: **silence is the default** — the initiative floor. Proactive is the scarce right (post-commit nudge automatic cap-2; Keep-Me-Safe only inside explicit Support — D617–D619 owner ruling, `evidence-presentation.md` `[V]`). Hover may never be the sole path (WCAG, ibid.) |
| **Subject** | square / piece / move / line / plan / structure / game / player | F2 typed events carry subject/object/squares; A3 measured why this axis needs a gate: 0/3,371 transition observations retain squares (`detector-semantic-conformance.md` `[V]`). Plan-subject is the law-8 line (§4c); player-subject requires the longitudinal store + D842's denominator rules |
| **Form** | square light / arrow / badge / number / bar / card / sentence / timeline mark / overlay / **sound** / spoken voice / ambient presence | `design/05` §3-forms inventory `[V]` — which has **no sound row** (badge sounds ship at chess.com; flagged in the DESIGN-GAP note). System arrows have no producer (form (c), D546); the manifest declares producer/form pairs (O4) |
| **Valence** | warning / neutral fact / avoided-positive / praise | F2 `sign` (gained/lost/preserved/avoided/state) is **not** valence: O2/O3 — rarity/distinctiveness cannot establish valence; R2 measured 1,554 `avoided` relations carrying no good/bad valence (`selection-sign-and-significance.md` `[V]`). Avoided-positive faces learners only post-commit/review with the denominator (D745). Praise words are banned from the voice layer (`voice.ts:93-97` `[V]`) |
| **Disclosure cost** | reveals the answer / narrows it / reveals nothing | The sentence test (§3-forms) and, mechanically, R3's packet compiler refusing `recommendedMoveUci`/PV for non-recommending modules (`module-contract.ts:78` `[V]`). Rung 0 within scope reveals nothing; a grade word narrows; a best-move arrow reveals |
| **Grounding** | rules / tablebase / engine / human-model / corpus / authored — LLM is a **voice, never a grounding** | The §3 ladder verbatim, rungs 0–6, with the engine-condition rule for rung-2 facts that *fire* rather than display, and R5's renderer contract (LLM receives only selected evidence, never selects/grades) `[V]` |

Two derived observations the survey confirms:

- **"Proactive vs reactive" (the owner's phrasing) is two axes, not one**: initiative
  (who starts the exchange) × timing (when it may happen). Chess.com Move Feedback is
  proactive+post-commit; Chessiverse's blunder guard is proactive+at-commit; Lichess's `x`
  threat key is on-request+pre-commit. Collapsing them into one dial is what makes
  competitor settings pages incoherent; keeping them separate is what makes our preset
  algebra expressible.
- **Disclosure cost is a property of content, not of form** — the same threat can be
  rendered as a sentence (narrows) or as the opponent's best-move arrow (reveals). This is
  why the ladder alone could not answer the owner's question: it ranks *grounding*, one of
  seven axes.

---

## 2. The field, surveyed into the space

85 affordance rows fetched this pass across chess.com (27), Lichess (20), and
DecodeChess/Chessiverse/Beacon/Aimchess/Noctie/Play Magnus/en-croissant/Nibbler (38); the
repo's landed teardowns add Chessable, Dr. Wolf and Quackmate rows by reference. Columns:
timing / initiative / subject / form / valence / disclosure cost / grounding.

### 2a. chess.com

| # | affordance | timing | initiative | subject | form | valence | disclosure | grounding | cite | ev |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Move classification badges — Brilliant, Great, Best, Excellent, Good, Book, Inaccuracy, Mistake, Miss, Blunder | post-game | ambient once run | move | badge on square + list + sound | praise→warning | narrows | engine + rating-conditioned model | [move classifications](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc) | `[V]` |
| 2 | Brilliant mechanics: "a good piece sacrifice", not bad after, not already winning; sacrifice test **more generous for lower-rated players**; numeric criteria unpublished | post-game | ambient | move | badge | praise | reveals nothing | engine + rating-adjusted heuristic | same | `[V]` |
| 3 | Error bands **published in expected points lost**: Best 0.00 / Excellent ≤0.02 / Good ≤0.05 / Inaccuracy ≤0.10 / Mistake ≤0.20 / Blunder >0.20 ("Classification V2 Expected Points Model", rating-conditioned) | post-game | ambient | move | badge | warning | narrows | engine + human-model | same | `[V]` |
| 4 | "Miss": failed to capitalize on opponent's mistake | post-game | ambient | move | badge | avoided-negative (a win existed) | narrows | engine + model | same | `[V]` |
| 5 | Accuracy % (CAPS2, ~June 2025): rescaled so most games land 50–95 "like school grades"; formula unpublished | post-game | ambient | game/player | number | neutral | reveals nothing | engine + statistical model | [accuracy](https://support.chess.com/en/articles/8708970-how-is-accuracy-in-analysis-determined) | `[V]` |
| 6 | Game Rating ("you played like a 2650") vs rating expectation; formula unpublished | post-game | ambient | game/player | number | neutral | reveals nothing | engine + rating-expectation model | [game rating](https://support.chess.com/en/articles/10773754-how-is-game-rating-calculated-in-game-review) | `[V]` |
| 7 | Coach character commentary: per-move text bubble; highlighted words draw arrows/squares on hover (explanation-bound visuals) | post-game | proactive per move | move/line/game | text bubble + arrow + square light | mixed | narrows→reveals on click | engine → templated NL (not documented as LLM) | [Game Review](https://support.chess.com/en/articles/8584089-how-does-game-review-work), [design update](https://www.chess.com/news/view/game-review-design-update) | `[V]`/`[P]` |
| 8 | Key Moments walkthrough + Retry Mistakes (retry before reveal; accuracy adjusts after improvement) | post-game | proactive tour, retry on-request | move/position | overlay + bubble | mixed | narrows, reveals on demand | engine | [design update](https://www.chess.com/news/view/game-review-design-update) | `[V]` |
| 9 | Eval graph + eval bar over the game; classification icons on the graph | post-game | ambient (toggleable) | game/position | bar + timeline marks | neutral | narrows | engine | [Game Review](https://support.chess.com/en/articles/8584089-how-does-game-review-work) | `[V]` |
| 10 | Self-Analysis: engine lines, eval bar, premium per-move "Move Feedback"; each element toggleable | any position | on-request | line/move | numbers + lines + badge | neutral | reveals | engine | [design update](https://www.chess.com/news/view/game-review-design-update) | `[V]` |
| 11 | Live rated human play: **no engine output of any kind reaches the player** — the bright line | — | — | — | — | — | — | policy | [forum](https://www.chess.com/forum/view/livechess/evaluation-bar-in-live-games) | `[P]` |
| 12 | Spectating: viewer toggles for eval bar + engine lines on others' live games | pre-commit (viewer) | on-request | position/line | bar + lines | neutral | reveals (to spectator) | engine | [forum](https://www.chess.com/forum/view/help-support/what-does-engine-evaluation-setting-do-in-live-settings) | `[P]` |
| 13 | Bots: Evaluation Bar option (always unrated) | pre-commit | ambient opt-in | position | bar | neutral | narrows | engine | [bots](https://support.chess.com/en/articles/8614091-how-can-i-play-against-the-chess-com-bots) | `[V]` |
| 14 | Bots: **Threat Arrows** — red arrows on endangered own pieces | pre-commit | ambient opt-in | piece/square | red arrow | warning | narrows | engine tactic detection | same | `[V]` |
| 15 | Bots: Suggestion Arrows (green candidate prompts) | pre-commit | ambient opt-in | move | green arrow | neutral | **reveals** | engine | same | `[V]` |
| 16 | Bots: Move Feedback — real-time per-move classification as you play | post-commit in-game | ambient opt-in | move | badge + sound | mixed | narrows | engine + classification model | same | `[V]` |
| 17 | Bots: Hint button; hints/undos cost "crowns" (3→2→1 reward schedule) | pre-commit | on-request | move | arrow | neutral | reveals | engine | same | `[V]` |
| 18 | Bots: takeback/undo (same crown penalty) | post-commit | on-request | move | rewind | neutral | reveals nothing | rules | same | `[V]` |
| 19 | Bots: engine-lines panel while playing (Assisted/Custom bundles: Challenge/Friendly/Assisted/Custom gate all of the above) | pre-commit | ambient opt-in | line | lines + numbers | neutral | reveals | engine | same | `[V]` |
| 20 | Bot Chat personality messages | in-game | proactive | game | text bubble | neutral | reveals nothing | authored scripts | same | `[V]` |
| 21 | Insights: longitudinal dashboard — accuracy over time/by move number, per-phase accuracy + phase-ending %, top-10 openings, tactics found-vs-missed (forks, pins, mates, hanging pieces), move-quality mix, per-piece accuracy, castling timing vs results, time-of-day calendar; games <10 moves excluded | longitudinal | on-request | player/phase | charts + numbers | neutral | reveals nothing | engine + own-game corpus | [Insights](https://support.chess.com/en/articles/8708925-what-is-insights-on-chess-com) | `[V]` |
| 22 | Spectator guess-the-move with viewer leaderboard | pre-commit (predicting) | on-request | move | score + overlay | neutral | reveals after | corpus (played game) + crowd | [forum](https://www.chess.com/forum/view/community/wish-list-item-guess-the-next-move) | `[P]` |
| 23 | "Solitaire Chess" — **not verifiable as a shipped chess.com feature** (no support article; landing URL 404s). The documented format is Pandolfini's Chess Life column: points per guessed move, credit for equal-or-stronger ideas, total maps to estimated rating | post-commit | on-request | move | points | mixed | reveals after | corpus + authored annotations | [forum](https://www.chess.com/forum/view/general/solitaire-chess-in-quotchess-lifequot-magazine) | `[M]` as feature; `[P]` format |
| 24 | Show Legal Moves dots (default-on for new accounts) | pre-commit | on selection, ambient default | square/piece | square dots | neutral | reveals nothing | rules | [legal moves](https://support.chess.com/en/articles/8708625-how-do-i-turn-on-off-the-legal-moves-dots-on-the-board) | `[V]` |
| 25 | Focus Mode: hides everything but board/clocks/draw/resign | in-game | on-request | game | UI removal | neutral | reveals nothing | — | [Focus Mode](https://support.chess.com/en/articles/8588088-what-is-focus-mode-how-do-i-turn-it-on) | `[V]` |
| 26 | Book classification (corpus lookup) | post-game | ambient | move | badge | neutral | reveals nothing | corpus | [Game Review](https://support.chess.com/en/articles/8584089-how-does-game-review-work) | `[V]` |
| 27 | Great-move trigger: outcome-critical or only-good-move; more generous for new players | post-game | ambient | move | badge | praise | reveals nothing | engine + model | [move classifications](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc) | `[V]` |

### 2b. Lichess — including the classification constants from source

**The constants, pinned `[V]` from source this pass** (all fetched from
`github.com/lichess-org/lila` and `github.com/lichess-org/scalachess`, master, 2026-08-22):

- **Cp → Win%** (now in scalachess, `core/src/main/scala/eval.scala` — the old
  `modules/analyse/WinPercent.scala` path is stale):
  `Win% = 50 + 50 × (2/(1 + e^(−0.00368208·cp)) − 1)`, cp ceiled at ±1000; mate maps to
  ±1000 cp. ([source](https://github.com/lichess-org/scalachess/blob/master/core/src/main/scala/eval.scala))
- **Judgment thresholds** (`modules/tree/src/main/Advice.scala`): winning-chances **drop ≥
  0.30 → Blunder, ≥ 0.20 → Mistake, ≥ 0.10 → Inaccuracy** (the [−1,+1] scale; 0.1 = 10
  win-percentage points). The historical 300/200/100 cp rule is gone from the code path.

> **ERRATUM 2026-08-22** (found by the `move-quality-grades` cross-review, verified by verbatim
> source fetch; [[D939]]): the §2b gloss *"0.1 = 10 win-percentage points"* is **wrong for
> `Advice.scala`** — its thresholds operate on raw `winningChances ∈ [−1,+1]`, so 0.10/0.20/0.30
> = **5/10/15 Win%-points**. The practice file's `povDiff` divides by 2, so the 2.5/6/14 practice
> gloss stands. Consequently the "4× stricter practice ladder" below is a **cross-normalization
> artifact**: the true ratios are **2×/1.67×/1.07×**. The mate thresholds are a complete pinned
> three-tier table at source (not the three cells this dossier quoted), and Advice feeds the
> logistic **unclamped**. Rows below are left as written per the append-only spirit; every
> consumer must read this erratum first — `move-quality-grades` §2 carries the corrected
> constants.
  Mate cases have their own table (allowed-mate from ≥ −700 pov-cp → Blunder; lost-mate
  while still > +999 → only Inaccuracy; **MateDelayed — a slower mate — is never judged**).
  ([source](https://github.com/lichess-org/lila/blob/master/modules/tree/src/main/Advice.scala))
- **Per-move Accuracy%** (`modules/analyse/src/main/AccuracyPercent.scala`):
  `103.1668100711649 × e^(−0.04354415386753951 × winDiff) − 3.166924740191411 + 1`
  (the +1 is an explicit "uncertainty bonus" absent from the blog version), clamped 0–100;
  100 if the move gained win%. The fitting script is embedded in the source file.
- **Game accuracy** = mean of (volatility-weighted mean, **harmonic mean**) of per-move
  accuracies — the harmonic term makes single blunders drag hard; windows sized
  `(nMoves/10)` squeezed 2–8, weighted by in-window Win% stddev; per-phase re-run.
- **ACPL** (`AccuracyCP.scala`): mean of `max(0, signed eval drop)`, cp ceiled ±1000.
- **Practice-mode coach uses a different, 4× stricter ladder**
  (`ui/analyse/src/practice/practiceCtrl.ts`): good < 0.025 ≤ inaccuracy < 0.06 ≤ mistake
  < 0.14 ≤ blunder — the in-drill coach and the post-game report are **two deliberately
  different conventions in one product**. Hint is two-stage: piece first, then move.

| # | affordance | timing | initiative | subject | form | valence | disclosure | grounding | cite | ev |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Analysis eval bar (toggle `l`) | pre-commit | ambient toggle | position | bar + number | neutral | narrows | engine | [keyboard.ts](https://github.com/lichess-org/lila/blob/master/ui/analyse/src/keyboard.ts) | `[V]` |
| 2 | Best-move arrows (toggle `a`) | pre-commit | ambient toggle | move | arrow | neutral | reveals | engine | same | `[V]` |
| 3 | Threat display (`x` shows opponent's best reply) | pre-commit | on-request | opponent move | arrow | warning | reveals (opponent's) | engine | same | `[V]` |
| 4 | Multi-PV 1–5 lines | pre-commit | ambient setting | line | text + numbers | neutral | reveals top-k | engine | [analysis](https://lichess.org/analysis) | `[P]` |
| 5 | Practice-with-computer coach: per-move verdict card + gauge + two-stage hint | post-commit | proactive | move | card + gauge + staged hint | warning/praise | narrows then reveals | engine + tablebase | [practiceCtrl.ts](https://github.com/lichess-org/lila/blob/master/ui/analyse/src/practice/practiceCtrl.ts) | `[V]` |
| 6 | Learn From Your Mistakes: replay your I/M/B moves, retry before reveal | post-game | on-request | move | retry flow | warning→praise | narrows | engine | [roundTraining.ts](https://github.com/lichess-org/lila/blob/master/ui/analyse/src/view/roundTraining.ts) | `[V]` |
| 7 | Server analysis: I/M/B counts, ACPL, accuracy, phase accuracy, ?!/?/?? glyphs on timeline, "Nf3 was best." comments | post-game | on-request | game + moves | numbers + glyph marks + graph | warning | reveals | engine (fishnet) | Advice/AccuracyCP + above | `[V]` |
| 8 | Opening explorer (masters/lichess/player DBs) | pre-commit | on-request | move/line | W/D/L table | neutral | narrows (popularity ≠ quality) | corpus | [analysis](https://lichess.org/analysis) | `[P]` |
| 9 | Tablebase pane (≤7 men): W/D/L + DTZ per move | pre-commit | ambient in pane | move | badge + number | neutral (ground truth) | reveals | tablebase | same | `[P]` |
| 10 | Legal-destination dots (pref, default on) | pre-commit | ambient | square/piece | dots | neutral | reveals nothing | rules | [Pref.scala](https://github.com/lichess-org/lila/blob/master/modules/pref/src/main/Pref.scala) | `[V]` |
| 11 | Premove | opponent's turn | ambient | move | highlight | neutral | reveals nothing | rules | same | `[V]` |
| 12 | **Rated/casual real-time play: all assistance prohibited** (engines, books, tablebases, explorer, advice) | — | policy | — | — | — | — | policy | [fair play](https://lichess.org/page/fair-play) | `[V]` |
| 13 | Correspondence: books/explorer permitted, engines never | pre-commit | on-request | move | table | neutral | narrows | corpus | same | `[P]` |
| 14 | Move confirmation (per time-control mask) | at-commit | ambient opt-in | move | confirm dialog | neutral friction | reveals nothing | rules | Pref.scala | `[V]` |
| 15 | Zen mode (hides ratings/chat/UI) | in-game | opt-in | player | removal | neutral | reveals nothing | — | Pref.scala | `[V]` |
| 16 | Confirm-resign, takeback prefs, auto-queen | at-commit | opt-in | move/game | dialog | neutral | reveals nothing | rules | Pref.scala | `[V]` |
| 17 | Blindfold toggle | pre-commit | on-request | board | piece removal | neutral | anti-assistance | rules | game menu | `[M]` |
| 18 | Practice drills (lichess.org/practice): authored goals + coach comments + gauge over the practice controller | post-commit | proactive | move + authored plan | card + gauge + text | warning/praise | staged | engine + authored | [practice](https://lichess.org/practice) | `[V]` mech |
| 19 | Puzzle post-solve: view-solution + retry; themes as post-hoc labels | post-commit | on-request | move | text + replay | warning/praise | staged | engine-derived corpus | [training](https://lichess.org/training) | `[P]` |
| 20 | Insights: 17 metrics × 25 dimensions (ACPL, accuracy, movetime, **Awareness** = punishing opponent mistakes, **Luck** = going unpunished; dimensions incl. phase, opening, castling side, queen trade, material range, piece moved) | longitudinal | on-request | player | charts | neutral | reveals nothing | engine + own-game corpus | [InsightMetric.scala](https://github.com/lichess-org/lila/blob/master/modules/insight/src/main/InsightMetric.scala) | `[V]` |

### 2c. The specialists — DecodeChess, Chessiverse, Beacon, Aimchess, Noctie, Play Magnus, en-croissant, Nibbler

| # | product | affordance | timing | initiative | subject | form | valence | disclosure | grounding | cite | ev |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | DecodeChess | "Decode": NL explanation of *why* the best move is right (threats, plans, piece functionality, motifs) | post-commit analysis | on-request | move + line | expandable text card | neutral | reveals | symbolic AI over Stockfish (explicitly not LLM) | [features (indexed)](https://decodechess.com/features/), [review](https://thechessadvisor.com/software-review/decodechess/) | `[P]` |
| 2 | DecodeChess | Threat decomposition with before/after toggle | post-commit | on-request | plan/line | text + red arrows | warning | narrows | engine-derived | same | `[P]` |
| 3 | DecodeChess | Plans tab; good moves in descending order | post-commit | on-request | plan | tab + blue arrows | neutral | reveals | engine-derived | same | `[P]` |
| 4 | DecodeChess | Piece-functionality cards per meaningful piece | post-commit | on-request | piece | card | neutral | narrows | engine-derived | same | `[P]` |
| 5 | DecodeChess | Semantic arrow color code: red=threats, blue=plans/function, green=best move, coordinated with sidebar | post-commit | ambient in view | square/piece/move | colored arrows | mixed | green reveals; red/blue narrow | engine-derived | [review](https://thechessadvisor.com/software-review/decodechess/) | `[P]` |
| 6 | DecodeChess | Deep Decode: bullet summary → in-depth expansion (depth-on-demand) | post-commit | on-request | move/plan | expandable text | neutral | escalating | engine-derived | same | `[P]` |
| 7 | DecodeChess | Decode Game: full-game pass, eval graph, I/M/B stats, game map of advantages | post-game | on-request | game | graph + stats + map | mixed | reveals | engine | same | `[P]` |
| 8 | Chessiverse | Guided Play **Full Help**: every move color-graded green→red as you play, eval bar on | post-commit in-play | ambient | move | color badge | full range | grade, not answer | engine | [guided-play](https://chessiverse.com/guided-play) | `[V]` |
| 9 | Chessiverse | **Peek**: grades hidden until you *hold a piece* — its destination squares light up by grade | pre-commit | on-hover (piece hold) | square/move | graded square lights | mixed | narrows strongly | engine | same | `[V]` |
| 10 | Chessiverse | 4-step hint ladder: threat check → directional nudge → which piece → the move | pre-commit | on-request escalating | plan→piece→move | text + highlight | neutral | reveals-nothing → narrows → reveals | engine + authored coach voice | same | `[V]` |
| 11 | Chessiverse | **Blunder guard**: intercepts at commit, "points out what you missed, hands the move back" | at-commit | proactive | move + missed threat | modal + hand-back | warning | reveals the miss, not the fix | engine threshold | same | `[V]` |
| 12 | Chessiverse | Eval bar during Guided Play | in-play | ambient | game | bar | neutral | narrows | engine | same | `[V]` |
| 13 | Chessiverse | **Graduation gates to rated play**: 3 hint-only games in a row, 0 blunders, ≥80% strong moves, ≤2 hints/game — assistance as a ladder you climb off | longitudinal | ambient panel | player | badges/counters | avoided-positive/praise | reveals nothing | engine-measured stats | same | `[V]` |
| 14 | Chessiverse | Deep takeback (rewind the bot's reply too); every what-if line kept; PGN with variations | post-commit | on-request | move/line | move-list branches | neutral | — | rules | [chessiverse.com](https://chessiverse.com/) | `[V]` |
| 15 | Chessiverse | Post-game analysis after every bot game | post-game | proactive | game | report | mixed | reveals | engine | [blog](https://chessiverse.com/blog/chess-bots-and-personaplay-how-chessiverse-helps-you-improve-your-game/) | `[V]` |
| 16 | Beacon | Post-game graded review: SF18 grades every move, flags positions worth reviewing | post-game | proactive | move/game | graded list | mixed | reveals | engine | [beaconchess.com](https://beaconchess.com) | `[V]` |
| 17 | Beacon | Grounded text: evals → "board-specific explanations about threats, tactics, development, king safety, structure" | post-game | on-request | move/structure | text | neutral | reveals | engine → templated concepts | same | `[V]` |
| 18 | Beacon | Candidate-move menu with likely replies drawn on board (explicitly non-exhaustive; "explanations can be wrong") | post-game | on-request | move/line | arrows + list | neutral | narrows (menu, not verdict) | engine multi-PV + Maia-2 | same, [candidate moves](https://beaconchess.com/features/candidate-moves) | `[V]` |
| 19 | Beacon | Maia-2 opponent at ten levels (coached games stay human-plausible) | in-play | ambient | game | opponent behavior | neutral | — | human-model | same | `[V]` |
| 20 | Aimchess | Six-aspect longitudinal report vs peers: Openings, Tactics, Endgame, Advantage Capitalization, Resourcefulness, Time Management | longitudinal | proactive weekly | player | numbers/bars | deficit-framing | reveals nothing per-move | own-game corpus + engine | [aimchess.com](https://aimchess.com) | `[V]` |
| 21 | Aimchess | Advantage Capitalization Trainer: replay your own lost-won games vs engine (time scrambles excluded) | longitudinal → drill | proactive queue | game/position | playable position | avoided-positive | reveals nothing | own corpus + engine | same, [review](https://chessily.com/review/aimchess-review-is-the-ai-tool-actually-worth-it/) | `[V]`/`[P]` |
| 22 | Aimchess | Retry Mistakes + personalized puzzles from own games; weekly plan at weakest aspect | longitudinal | proactive daily | move/player | puzzle cards | warning-derived | narrows | own corpus + engine | same | `[V]` |
| 23 | Aimchess | Specialty trainers: Time, Defender (worse positions), Intuition, Blunder Preventer, 360 | longitudinal | on-request | move/player | drills | mixed | varies | engine + stats | same | `[V]` |
| 24 | Noctie | Real-time 7-color move grading "from a human perspective, rather than centipawn loss" | post-commit in-play | ambient | move | color badge | full range | grade, not answer | **human-model** (NN over 1B+ human games) | [faq](https://noctie.ai/faq/) | `[V]` |
| 25 | Noctie | Post-game flashcards from "most **instructive** mistakes" (not biggest swings) → SRS queue | post-game → longitudinal | proactive | move/position | flashcard | warning-derived | narrows | human-model + engine | same | `[V]` |
| 26 | Noctie | Live strength estimate adapting to your level | longitudinal | ambient | player | number | neutral | reveals nothing | human-model | same | `[V]` |
| 27 | Noctie | Opening rehearsal lift-hints: correct move lights up when you lift a piece | pre-commit | on-hover (lift) | square/move | square light | neutral | reveals (scoped to rehearsal) | authored repertoire | same | `[V]` |
| 28 | Play Magnus | "Magnometer": ambient meter of right/wrong decisions, "when you need hints… or might be close to checkmate" | in-play | ambient | game | meter | mixed | narrows (mood, not move) | engine re-skinned | [App Store](https://apps.apple.com/us/app/play-magnus-play-chess/id808138395) | `[V]` |
| 29 | Play Magnus | Hints + takebacks, once priced in "Brain Power" currency, later free | pre/post-commit | on-request | move | text/arrow + undo | neutral | reveals (hint) | engine | same | `[V]` |
| 30 | en-croissant | One-click report: eval graph + **board heatmap** + best-move list with classifications | post-game | on-request | game/square | graph + heatmap + badges | mixed | reveals | engine (any UCI) | [encroissant.org](https://encroissant.org), [repo](https://github.com/franciscoBSalgueiro/en-croissant) | `[V]` |
| 31 | en-croissant | Repertoire practice with spaced repetition inside the analysis GUI | longitudinal | on-request | line | drill board | neutral | reveals on failure | authored repertoire | same | `[V]` |
| 32 | en-croissant | Personal DB auto-synced from Lichess/chess.com; absolute/partial position search; annotations | longitudinal | on-request | game/position | list/text | neutral | — | corpus | same | `[V]` |
| 33 | Nibbler | Leela top choices as **weighted arrows** — a ranked *distribution* of good moves, not one verdict | pre-commit | ambient | move/square | proportional arrows | neutral | reveals ranked | engine search tree | [repo](https://github.com/rooklift/nibbler) | `[V]` (weighting detail `[M]`) |
| 34 | Nibbler | Raw per-move search stats as first-class UI: N, P, Q, S, U, V, WDL — **uncertainty as UI**; policy P is a free human-plausibility prior | pre-commit | ambient toggle | move | numbers table | neutral | reveals + confidence | engine internals | [README](https://raw.githubusercontent.com/rooklift/nibbler/master/README.md) | `[V]` |
| 35 | Nibbler | Winrate graph | post-game/live | ambient | game | graph | neutral | narrows | engine | same | `[V]` |
| 36 | Nibbler | **PV hover ghost-playback**: hover a line, watch it play out without changing the analyzed position | pre-commit | on-hover | line | ghost overlay | neutral | reveals (that line) | engine | same | `[V]` |
| 37 | Nibbler | `searchmoves` focusing: point the engine at *your* candidate — the cheapest "why not my move?" | pre-commit | on-request | move | restricted list | neutral | user-controlled | engine | same | `[V]` |
| 38 | Nibbler | Auto full-game analysis; play/self-play vs Leela from any position | post-game | on-request | game | — | neutral | — | engine | same | `[V]` |

**Already landed in this repo, cited not re-fetched:** Chessable MoveTrainer — at-commit
soft-fail "Try Again" with engine-vetted margins, Difficult Moves as counted events, 8-level
lapse-reset SRS, whole-variation review (`chessable-movetrainer.md` `[V]`); Dr. Wolf —
ambient companion presence, the most-loved element (`design/05` §3-forms; `teardown-drwolf-desk.md`);
Quackmate — one turning point per game + share ritual; Lichess blind-mode retry hides the
verdict during retry (`review-map-and-reentry.md` `[V]`).

### 2d. Cross-cutting findings from the survey

1. **Two-ladder precedent.** Lichess runs a 4× stricter classification convention while you
   drill (2.5/6/14) than while it reports (10/20/30) — the *same product, two declared
   conventions by context*. Any grade module we ship must declare its convention per
   context rather than pretend one "blunder" exists. `[V]`
2. **The field's grounding split is clean**: DecodeChess/Beacon generate text from engine
   lines; Noctie/Beacon-Maia-2/Chessiverse ground on human-models; Aimchess grounds
   entirely on your own game corpus and never touches a live position. Noctie is the only
   product grading by **human plausibility** rather than centipawns, and the only one
   selecting *instructive* rather than *largest* mistakes. `[V]`
3. **Pre-commit disclosure is always gated somewhere** — by mode (bots-only at chess.com,
   never in rated play anywhere), by physical gesture (Chessiverse Peek, Noctie lift-hints),
   or by request ladder. No product shows verdicts pre-commit in rated play; the field
   already concedes ADR-0006's point at its own bright lines. `[V]`
4. **Chessiverse is unique in making assistance-removal a measured graduation ladder**
   (hint-only streak, blunder-free, ≤2 hints) — the one competitor pattern that treats
   assistance as a trajectory through the space rather than a setting. `[V]`
5. **DecodeChess's failure decomposition** (the deepest explainable-analysis attempt):
   the explanation *surface* worked — threats/plans/piece-function decomposition with a
   semantic arrow language — but the product around it failed on latency and compute cost
   (~2 free decodes/day), reliability (chrome-stats reviews report stalls and import
   failures), and an audience ceiling (~2000 Elo reviewers call it too basic above) while
   priced at ~$8.25/mo; Android marked discontinued; survives partly as licensed tech
   inside Chessify. The lesson for us: **depth-on-demand explanation is valuable and
   affordable only when the grounding is precomputed evidence, not a per-query AI pass** —
   which is exactly the F2-selection-then-render architecture. `[P]`
6. **Nibbler's ideas worth stealing** are all *form* inventions over honest content:
   uncertainty as UI, distribution-not-verdict arrows, ghost playback, and
   restrict-the-engine-to-my-candidate. None violates a rung; all are analysis-timing. `[V]`

---

## 3. Our primitives in the same space

Re-derived at HEAD (`b083ac8`), not quoted from the days-old gap matrix where the tree has
moved: the 2c tactical-collector projections are **already registered in
`evidence-catalog.ts`** (e.g. `human.maia.candidate_wdl` with `inspector_only` disposition
per D744; capture-class, double-attack, threat, back-rank, trapped, development families
with *"not a move grade"* limitations throughout) `[V]`; the 2d breadth RFC is amended and
awaiting independent review (D871). The manifest tuple at Phase-1 derivation was 20
producers / 126 projections / 25 consumers / 175 bindings + 33 semantic events, all 33
eligibility rows targeting `research.semantic_selection@1` only (`phase1-gap-matrix.md`
`[V]`); production still constructs no semantic event (class-9 wall).

### 3a. The eleven modules (D841), plotted

| Module (D841 name / R3 id) | timing | initiative | subject | forms | valence | disclosure | grounding | status in the space |
|---|---|---|---|---|---|---|---|---|
| legal affordance / `rules_floor` | pre-commit | ambient | square, piece | square dots | neutral | reveals nothing | rules | **served** — `board-input.ts` `legalDestinations` + announcement path `[V]` |
| requested sight / `sight_on_request` | pre-commit | on-request | square, piece, structure | sentence, square, arrow | neutral | reveals nothing (rung-0 in scope) | rules | **plausible-with-existing** — readings exist; owner-ruled legal pre-commit (D617–D619); current board lighting must stop being a raw census query (R3) |
| Keep-Me-Safe / `blunder_prevention` | **at-commit** (staged move) | proactive, **Support preset only** | move | sentence, square | warning | narrows (never names the alternative) | rules (`legal-exchange@1`, `threat@1`) | **plausible-after-2c** — collectors implementing now; the one board-adjacent cue D841 allows |
| threat radar | pre-commit (Support) / post-commit | on-request or preset | piece, square, move | square, arrow, sentence | warning | narrows | rules + engine-condition rule for anything deeper | **plausible-after-2c** — `threat@1` is exact one-ply; chess.com's Threat Arrows are the engine-grounded field version |
| post-commit nudge / `postcommit_nudge` | post-commit | proactive, cap 2 | move, square | sentence, square, arrow | signed | narrows | F2 selection over any eligible rung | **served-in-harness** — R3 real-packet arm proved the seam; Phase 3 must compile module-specific eligibility (distinctive ≠ significant) |
| structure nudge | post-commit | auto/on-request | structure | sentence, card | neutral | reveals nothing | rules + authored shape entries | **plausible-after-2d** (pawn/king/space families) + shape library; guided mode is this composition (design/05 §3b as amended) |
| theory breadcrumb / `theory_breadcrumb` | post-commit | on-request | line, structure, plan (cited) | sentence, panel | neutral | reveals nothing | authored + corpus citations | **plausible** — R8 joins exist; **opening breadcrumb needs the class-4 identity join** |
| progressive guided hint / `guided_hint` | disclosed | on-request | move, line | staged sentence→square→arrow, audio | neutral | narrows → reveals (final stage only) | engine, tablebase, authored | **served-by-design** — Lichess two-stage and Chessiverse 4-step are the field's versions; ours adds the disclosure gate |
| compare coach / `compare_coach` | disclosed | on-request | line, move | sentence, panel | signed | narrows | rules + engine (`structure_delta`, `eval_delta` exist) | **served-with-defects** — class-3 operand loss (`guidance.ts:60` placeholder) and class-6 no-selection strips |
| Review Map / `review_map` | post-game | automatic | game, move | timeline, cards | signed | may reveal | engine + rules + corpus | **served-in-harness** (R7); needs whole-game selector + the grade family below |
| inspector / `full_inspector` | analysis | explicit mode | all | panel | neutral | reveals | all rungs, attributed | **served-with-placement-defects** — panels ship inside the play column (L5–L8); the disposition is right, the placement is Phase 4's |
|  |  |  |  |  |  |  |  |  |

### 3b. The consolidated coverage map — every field cell vs our status

Classes: **SERVED** (a shipped or harness-proven consumer exists) · **PLAUSIBLE** (existing
or accepted primitives suffice; needs a module/renderer) · **NEEDS-COLLECTOR/STORE** (a
producer or store is genuinely absent) · **REFUSED** (an invariant blocks the cell as the
competitor ships it; transformation named per the `design/02` adoption amendment).

| Field cell (products) | class | what serves / what's missing |
|---|---|---|
| Legal destination dots (all) | SERVED | `rules_floor`; `board-input.ts` `[V]` |
| Focus/Zen mode (chess.com, Lichess) | SERVED | silence **is** our default (§3a) — stronger than an opt-in |
| Takeback / deep takeback (bots, Chessiverse) | SERVED | rewind/branch is the core loop; attempts preserved, which no competitor keeps (`player-analysis-and-skills.md` §2 `[V]`) |
| Retry-before-reveal (chess.com Retry, Lichess LFYM, blind-mode) | SERVED | R7's re-entry contract; verdict-hidden retry is the adopted Lichess transform |
| Key moments (chess.com, Quackmate) | SERVED-in-harness | `rules.pivotal.marker` + backward eval-swing detector (§3a design/05); `retrospectivePivot()` currently class-2 discarded |
| Opening explorer (Lichess, chess.com) | SERVED | `human.explorer.population`; placement defect (L6), not admission |
| Tablebase display (Lichess) | SERVED | syzygy projections; sentence-layer leak (L14) is form work |
| Hint ladder (Lichess practice, Chessiverse) | SERVED-by-design | `guided_hint` staged, disclosure-gated |
| Coach commentary (chess.com coach, DecodeChess text) | SERVED-by-design | R5 renderer contract: LLM words selected evidence, deterministic fallback normative |
| Explanation-bound visuals (chess.com hover-words) | SERVED-by-design | the R3 rule: a visual form is an alternate rendering of one admitted sentence `[V]` |
| Multi-PV / engine lines in analysis (all GUIs) | PLAUSIBLE | `live.stockfish.pv`/`wdl` transported, dropped at sentence layer (class 3) — renderer work against existing manifest |
| WDL/uncertainty display (Nibbler) | PLAUSIBLE | same class-3 seam + `human.maia.candidate_wdl` (inspector_only, D744) |
| Policy-weighted candidate arrows (Nibbler) | PLAUSIBLE | `human.maia.policy` exists; **system-arrow form has no producer** (form (c), D546) — a form-producer gap, not evidence gap |
| PV ghost playback, searchmoves-my-candidate (Nibbler) | PLAUSIBLE | analysis-timing form work over existing engine workers |
| Piece-function cards (DecodeChess) | PLAUSIBLE | rung-0 reach/defence/mobility readings + 2d `piece_destinations@1`; inspector/structure-nudge forms |
| Threatened-piece radar (chess.com Threat Arrows, Fritz lineage) | PLAUSIBLE-after-2c | `threat@1` + `loose_piece@1` exact one-ply; anything deeper follows the engine-condition rule |
| Blunder guard at commit (Chessiverse) | PLAUSIBLE-after-2c | Keep-Me-Safe, Support preset only, warns without naming — the owner-ruled transformation already exists |
| At-commit move confirmation (Lichess) | PLAUSIBLE | rules-only friction; uncontroversial |
| Post-game move classification I/M/B (everyone) | **NEEDS-PROJECTION — FREE** | §4a verdict below |
| Game accuracy % / eval graph (everyone) | **FREE with availability caveat** | recorded trajectories exist; R7 measured coverage 20/20 openings, 0/29 middlegame/endgame mainlines — honest-empty state required `[V]` |
| Game-shape timeline map (DecodeChess game map, eval graphs) | FREE | same trajectories; timeline-mark form shipped |
| Guess-the-move (spectator prediction; Pandolfini format) | SERVED-dead → **owner-adopted** | D860 quadruply-dead wiring; D869 now rules it a mode + campaign encounter; scoring vs Maia distribution is law-8-clean by construction |
| Insights longitudinal dashboards (chess.com, Lichess, Aimchess) | **NEEDS-STORE** | R13: no shipped plane persists cross-game observations — the single blocking dependency for every player-subject cell (D842 rules the credit shape) |
| Skills/mastery credits (chess.com Skills) | NEEDS-STORE + ruled | D842: opportunity-normalized rates, floors, tiers; never raw counts/streaks |
| Peer-baseline comparison (chess.com Insights, Aimchess) | PLAUSIBLE-after-store | adopt the *framing*, publish the denominator (`player-analysis-and-skills.md` §1 `[V]`) |
| Own-game drill mining (Aimchess capitalization/retry, Noctie flashcards) | PLAUSIBLE-after-store | convert/hold/save/resist outcomes + imported runs exist; selection needs the store + grade family |
| Opening name / book depth (everyone) | NEEDS-COLLECTOR | class-4 identity join refused at runtime (`position-evidence.ts:25`) + class-1 book-depth lookup |
| Mate-in-N available/missed; "Miss" (chess.com) | NEEDS-COLLECTOR | class-1; exactly grounded when the engine emits it; the avoided-positive twin of the grade family |
| Time-management metrics (Aimchess, Insights) | NEEDS-COLLECTOR (partial) | tempo verdicts exist authored-only; no clock-usage reading over imported games |
| SRS over difficult moves (Chessable, Noctie, en-croissant) | PLAUSIBLE | D864–D868 adoptions (lapse-aware ladder, difficult-roots); attempt-unit store required |
| Live eval bar during committed play (Chessiverse, bots) | **REFUSED pre-commit** | ADR-0006/silence default. **Post-game standing: admitted** — `outcome.reached` discloses under every policy; CompareView already renders eval strips (the defect is class-6/7 form, not admission). Transformation: trajectory + inspector |
| Best-move/suggestion arrows pre-commit (chess.com bots, Lichess analysis toggle, Nibbler) | REFUSED pre-commit | a rung-2 verdict pre-commit; same arrow fine in review (design/05 §3-forms). Transformation: `guided_hint` final stage after disclosure |
| Always-on move grading during play (chess.com Move Feedback, Chessiverse Full Help, Noctie 7-color) | REFUSED as default | contaminates the consequence loop; transformation: post-commit nudge (cap 2) + `attempt_end` disclosure; Noctie's human-plausibility grading becomes our Maia-divergence reading, post-commit |
| Peek / lift-hints (Chessiverse, Noctie) | REFUSED (verdict form) | pre-commit *grades* on hold; transformation: requested rung-0 sight on hold — same gesture, sight not verdicts |
| Brilliant/Great rating-conditioned words | REFUSED | §4a-layer-3 judgement dressed as detection; R15 byte-identity forbids rating as input to what is said about a move `[V]` |
| Game Rating "played like a 2650" (chess.com), strength estimate (Noctie) | REFUSED as shipped | undisclosed model; transformation: prediction-score vs Maia band (D869) — a *disclosed* human-model measurement |
| Plan/intent prose (DecodeChess plans, "strike at the centre") | REFUSED | the law-8 line (§4a-layer-4); transformation: detected antecedent + **cited** plan statement (D530 template; ShapePanel frame) |
| Style → "the greats" (Chessiverse personality, ChessBase) | REFUSED | R12: archetype clustering fails (ARI 0.251–0.417 vs 0.70 gate); continuous measured habit cards only (D842) |
| Ambient companion persona (Dr. Wolf) | PLAUSIBLE | form-without-content row already 💡 in §3-forms |
| Magnometer-style mood meter (Play Magnus) | REFUSED as shipped | an eval bar wearing a costume; nothing to transform that the trajectory + radar don't already do honestly |
| Graduation/assistance-shedding ladder (Chessiverse) | PLAUSIBLE — **adoption candidate** | our algebra already expresses the *state*; what's missing is the measured *trajectory* (guided-mode fade intent, design/05 §3b); see proposed row |
| Bot personality chat (chess.com) | SERVED-by-design | personas are declared weights (D812); voice is packet-bound |
| Spectator engine toggles (chess.com, Lichess) | SERVED (role-gated) | stream/academy session kinds + ceilings; viewer ≠ player disclosure already separated (design/05 §3a-i: the run carries the barrier) |

**Counts:** SERVED / served-by-design / in-harness: **14** · PLAUSIBLE with existing or
accepted primitives: **13** · NEEDS collector/store/projection: **7** (grade family,
accuracy/graph availability, longitudinal store, opening join + book depth, mate-in-N,
time-usage, sound/system-arrow form producers) · REFUSED with named transformation: **8**.
The owner's instinct is confirmed in one direction only: nothing important is missing from
the *evidence* plane except the five substantive holes; nearly everything is missing from
the *module/admission* plane, which is precisely Phase 3.

---

## 4. The holes, ranked

### 4a. FREE — grounded, primitives exist, needs a module (and the move-classification verdict)

**Move classification by engine delta — the explicit verdict: build it, post-commit and
review only, with the number, the threshold and the convention version shown.**

- **Verified absent at HEAD** `[V]`: repo-wide grep — no production symbol computes
  blunder/mistake/inaccuracy labels or accuracy; the *only* occurrences of the words are
  `BANNED_JUDGEMENTS` (`voice.ts:93-97`), which bans the **LLM renderer** from introducing
  them (ADR-0005 discipline) and says nothing about a deterministic, disclosed engine
  reading; `evidence-catalog.ts` limitation strings repeatedly disclaim *"not a move
  grade"*, i.e. the vocabulary was deliberately fenced at the source layer and no module
  ever adjudicated it. `progress.ts`'s `graded` is objective-grading, unrelated.
- **It is a rung-2 reading plus a published convention.** The producers exist
  (`live.stockfish.eval`, `recorded.engine.eval`, `derived.compare.eval_delta`); the label
  is arithmetic over a delta plus a cut point. `classifier-coverage-and-noise.md` §4a
  layer 2 already ruled the admission condition: *"printing the number is grounded;
  printing only the word launders a convention as a fact"* `[V]`. The conventions are now
  pinned: Lichess win%-drop ≥ 0.10/0.20/0.30 from `Advice.scala` (§2b, exact formulas
  and the accuracy fit constants included); chess.com's expected-points bands
  0.02/0.05/0.10/0.20 published `[V]`. We may cite one, or declare our own — but the
  Lichess **two-ladder precedent** (drill 2.5/6/14 vs report 10/20/30) means the
  convention must be declared **per context**, versioned like every recomputation (R13).
- **Where the amended ladder puts it**: rung 2 — right about the position, possibly wrong
  about the lesson. Eligibility-before-selection applies (O2); if the label ever *fires*
  anything (a Review-moment trigger, a drill selector), the engine-condition rule's four
  clauses bind — notably clause 2: the threshold must sit off the instrument's optimality
  boundary, which a "Best = 0.00 loss" class does not; so **"Best/Brilliant"-style praise
  classes are refused even as engine words**, while loss-bands are admissible.
- **Anti-contamination merely delays it.** The disclosure model (§3a-i) admits it
  post-commit at `attempt_end`/checkpoint boundaries and unconditionally at
  `outcome.reached`; pre-commit never. That is also where the field's own bright lines
  are (§2d-3), so we surrender nothing competitive.
- **Never rating-conditioned** (R15 byte-identity, `rfc/learner-rating.md` §8/AC-11):
  the chess.com pattern where the same move earns different words for different players is
  the named counter-example.
- **What it unblocks**: Review Map moment selection, learn-from-mistakes flows, Aimchess-
  style own-game mining, D842's skill denominators ("of N decisions where…"), and the
  "Miss" family once mate-in-N lands. It is the single highest-leverage absent projection
  in the space, and it is one derived projection + one convention document.

Also free: **game accuracy % and the eval graph** (same trajectories; availability-gated —
R7 measured 0/29 middlegame/endgame mainlines carry consecutive recorded evals, so
honest-empty is mandatory, and on-demand analysis is a cost decision for the RFC);
**the avoided/negative reading module admission** — the 11 `derived.semantic_avoidance.*`
projections exist and are research-only; D745 already ruled the learner-facing form
(post-commit/review, denominator always shown); **guess-the-move's first consumer**
(D860 wiring + D869 ruling; `predictedMass`/`predictedRank` vs the Maia distribution is a
disclosed human-model score, unlike CAPS).

### 4b. NEEDS a collector or store (named)

1. **The longitudinal store** — R13's finding, unchanged: blocks every player-subject cell
   (Insights, skills, habits, own-game mining, graduation ladders). The largest single
   absence in the space and not a collector at all.
2. **Opening-identity runtime join + book depth** (class 4 + class 1) — blocks the theory
   breadcrumb's opening half, Review opening names, "Book" labeling, out-of-book markers.
3. **Mate-in-N available/missed** (class 1, engine) — the grounded "Miss"/avoided-win
   family; pairs with the grade projection.
4. **Time-usage reading over imported/live runs** (partial: tempo verdicts are
   authored-only today) — blocks the Aimchess time-management cell.
5. **Form producers**: system-drawn arrows have no producer (D546) and **sound is not in
   the §3-forms inventory at all** while the field uses badge sounds as a valence channel —
   a form-inventory gap, not an evidence gap (flagged in the DESIGN-GAP note).

### 4c. REFUSED — and each transformation, per the adoption amendment

Enumerated in the map (§3b): pre-commit eval bar → post-game trajectory + inspector
(post-game standing: **admitted**, `outcome.reached`); pre-commit best-move/suggestion
arrows → disclosed `guided_hint` final stage; always-on in-play grading → post-commit
nudge under disclosure (+ Support for the at-commit guard); Peek/lift-grades → requested
rung-0 sight on the same gesture; rating-conditioned words → refused outright (R15);
undisclosed game-rating models → prediction-score vs Maia (D869); plan/intent prose →
cited shape entries (D530); style-to-the-greats → continuous habit cards (D842);
mood-meter → nothing (the trajectory + radar cover it honestly). None of these requires
new design law; every transformation cites an existing ruling.

### 4d. NOVEL to us — cells no surveyed competitor serves

1. **The avoided/negative reading with a denominator** — *"you avoided leaving a piece
   loose; N% of your legal moves would not have"* (D745). Lichess's Awareness/Luck are the
   nearest relatives and are longitudinal, opponent-framed aggregates; nobody states the
   avoided consequence at the decision with the denominator.
2. **Opportunity-normalized habit rates** — no surveyed product publishes a denominator,
   floor, or re-derivable rule (D842 `[V]`); F2's legal-alternative population is the
   denominator no one else materializes.
3. **Attempt-unit metrics** — competitors destroy attempt history on takeback; our
   preserved rewind/branch log makes repeat-attempt success, post-consequence behavior
   change, and N-way branch comparison computable (`player-analysis-and-skills.md` §2
   `[V]`).
4. **The explainable bot miss** (D818) — `opponent.selection` retains considered-candidate
   feature vectors; verified no prior art anywhere in the field.
5. **Prediction scored against the human distribution** (D860/D869) — Solitaire-style
   scoring where the baseline is a *disclosed* band-conditioned human model rather than
   engine-match or editorial points.
6. **The prophylaxis/denial reading** — rung-0 "what the opponent can no longer do"
   (design/05 §5): invisible to every eval-first tool because nothing happened; no
   surveyed product ships it.

These six all face learners through modules already named in D841 — they need no new axis,
which is itself evidence the space is complete.

---

## 5. Exposure and filtering — the space mapped onto the algebra

The algebra is already ruled (design/05 §3-forms as amended): **effective assistance =
requested preset ∩ workflow/session ceiling ∩ honesty/access ∩ source availability, every
term only narrowing.** What the Phase-3/5 RFCs need is the projection of the seven axes
onto that algebra — which axis lives in which term. One rule per axis:

1. **Timing — presets choose modules *within* timings; nothing moves a fact earlier.**
   Producer timing is a manifest declaration; the disclosure model owns the
   post-commit/post-game line; `attempt_end` re-closing and `outcome.reached` are not
   preset-visible. A preset that wants pre-commit content can only have rung-0 sight or an
   explicit Support warning — the two owner-ruled exceptions — because those are the only
   pre-commit-timed modules that exist.
2. **Initiative — the only axis a preset genuinely *raises*, and only by explicit choice.**
   Quiet = on-request everywhere; Guided adds proactive post-commit (cap 2); Support adds
   proactive at-commit. Ceilings demote initiative (proactive → on-request), never promote.
   Hover is a convenience path with a keyboard equivalent, never a distinct permission.
3. **Subject — a module declaration, not a preset knob.** A module's subjects are fixed by
   its accepted event types (typed operands, O2 eligibility); player-subject modules
   additionally require the longitudinal store and D842's floors. No preset may widen a
   module's subject.
4. **Form — manifest-declared per producer (O4); presets never add forms.** The sentence
   test governs every new form; D841's composition rule caps board-adjacent cues at **one**
   (Keep-Me-Safe), everything else queues into the rail with count badges. Learner-drawn
   and teacher-drawn marks stay outside the algebra entirely (attribution, not rungs).
5. **Valence — an evidence property, never a preset or renderer choice.** Valence exists
   only where a validated sign + D745-style denominator supports it; rarity cannot create
   it (O2/O3); the voice layer cannot add it (`BANNED_JUDGEMENTS`); a preset can suppress
   warning-valence modules (Quiet) but cannot make a neutral fact a warning.
6. **Disclosure cost — bounded per module mechanically, not by trust.** Non-recommending
   modules refuse `recommendedMoveUci`/PV at the packet compiler (R3's filter is the
   pattern); reveal-cost content exists only in disclosed/analysis-timed modules
   (`guided_hint` final stage, `review_map`, `full_inspector`). A preset may lower the
   ceiling on disclosure cost; only the workflow's disclosure state may raise it.
7. **Grounding — an availability and honesty term, never a preference.** Learners choose
   intents, not sources (R3's central finding: 54 source knobs are the wrong primary
   abstraction); source unavailability renders as honest-empty, not fallback-to-lower-rung;
   rung-2 facts that *fire* follow the engine-condition rule; the LLM is a
   conformance-gated voice after selection (R5), at no point a grounding.

**The R3 lesson binds selection inside every cell: selectivity ≠ usefulness.** The 294×
top-two lift ordering is a corpus-global diagnostic, not a selection policy (D660
correction `[V]`); real-packet fixtures showed exact, locally-distinctive facts
(`occupied_defence`, `direct_attack_count`) filling spare budget without being guidance.
So the preset algebra filters *modules*, module eligibility filters *events*, and neither
may be replaced by a global interestingness ranking. Budgets stay per-module
(cap-1/2/3-shaped, R2-measured), unused budget stays empty, and critical-override is a
compiler rule, never an LLM decision.

**The one genuinely new exposure idea the survey contributes** is Chessiverse's graduation
ladder read through our algebra: assistance as a **measured trajectory across presets**
(Support → Guided → Quiet) driven by opportunity-normalized rates rather than streaks —
i.e., D842's credit rules give the fade intent of design/05 §3b an instrument. Proposed as
a row, decided by no one here.

---

## Proposed ledger rows (final ids D878–D882; renumbered at landing — the head reached D877 across three concurrent passes)

*Head verified D871 at derivation, then **D872 landed in flight** (the semantic-tactics
research program plus its harness) — the third in-flight collision this week after
D745 and D871's renumberings. Rows are therefore proposed from D873; whoever lands them
re-verifies the head first.*

- **D878** — Assistance-surface taxonomy landed: 7-axis space; 85-row field survey; coverage
  map 14 served / 13 plausible / 7 needs-collector-or-store / 8 refused-with-transformation;
  six novel-to-us families; per-axis exposure rules for the Phase-3/5 RFCs. (this file)
- **D879** — Move-quality grade family: one derived projection over recorded/live eval
  deltas + a versioned, per-context convention document (Lichess win%-drop cited or own
  declared), word+number+threshold always co-rendered, post-commit/review timing,
  praise-classes refused, never rating-conditioned. Phase-3 RFC input; unblocks Review
  Map selection, LFYM flows, D842 denominators.
- **D880** — Post-game accuracy%/eval-graph standing: admitted at `outcome.reached`;
  availability-gated honest-empty (R7's 0/29 middlegame coverage); form work over existing
  trajectories, not new collectors.
- **D881** — Form-inventory gaps: **sound** is absent from design/05 §3-forms while the
  field uses it as a valence channel; system-drawn arrows still have no producer.
  Escalate the sound row as a design-tier amendment candidate (owner's to write).
- **D882** — Assistance-fade instrument: Chessiverse's graduation ladder transformed —
  preset trajectory (Support→Guided→Quiet) driven by opportunity-normalized rates with
  D842 floors, as the measurement behind design/05 §3b's "guided mode fades" intent.

**DESIGN-GAP (flagged, not resolved):** design/05 §3-forms lacks the sound form (D880);
and the module `Timing` vocabulary has no at-commit slot distinct from pre-commit — the
staged-move moment Keep-Me-Safe and the field's blunder guards occupy — which the Phase-3
RFC should name explicitly rather than overload `precommit`.

## Limits

- The field survey is a 2026-08-22 snapshot fetched through three parallel web passes;
  `[V]` rows were read from the cited primary source in this pass, but no product was
  *run* hands-on here — teardown-protocol hands-on upgrades remain open per the coverage
  matrix's standing limits. DecodeChess's own site 403s; all its vocabulary is `[P]`.
- "Solitaire Chess" could not be verified as a shipped chess.com feature (§2a row 23);
  do not cite it as one.
- Our-side facts were derived at HEAD `b083ac8` while collector implementation lands
  daily; the 2c registration observation and class counts should be re-greped by the
  Phase-3 RFC, not quoted from here.
- The coverage-map cell classes are single-primary; several cells carry a secondary
  (e.g. accuracy is FREE *and* availability-gated).
- Counts (85 rows, 14/13/7/8) reflect this dossier's deduplication choices; the underlying
  rows are all present above for re-cutting.
