# Teardown: ChessMind AI (chessmind.ai) — desk research

- Date: 2026-08-14
- Feeds: Q1a / E1; Q5 (Maia deployment evidence); ADR-0005 (the live test case named
  by the coverage-gap sweep); Q2 (paid positioning).
- Method: desk research, no account, no hands-on play. chessmind.ai serves a
  server-rendered SEO homepage plus a Vite SPA; evidence came from raw fetches of the
  homepage, `sitemap.xml` (11 sub-sitemaps: core/openings/terms/games/products/eco/
  guide/tools/endgames), the `/endings` page, **and the app's own JavaScript bundle**
  (`/assets/index-98b0bb79.js`, 2.5 MB, read for API endpoints, feature flags, and
  strings; plus the `localMaiaMove-1fd86d38.js` inference chunk). Store evidence: the
  Apple App Store listing (id6739585822 — description, reviews, changelogs, IAP) and
  the MWM analytics page for the app. `[V]` = literal string from a fetched asset or
  code; `[P]` = secondary/extracted snippet; `[M]` = model knowledge or inference,
  unverified. Bundle-reading is the same technique the ChessMotive teardown used;
  client code is ground truth for what ships client-side, but server behavior stays
  invisible.
- **Fetches/searches that returned nothing or failed**: most SPA routes
  (`/subscription`, `/scan`, `/middlegames`, `/coachs`) serve title-only shells — no
  copy; Google Play listing served only a navigation shell; **no LLM is named
  anywhere** — site, store copy, or bundle (the only `openai`/`claude`/`gemini`
  strings in the 2.5 MB bundle are referrer-analytics regexes for chatgpt.com /
  claude.ai / gemini.google.com `[V]`); **searches for public confabulation evidence
  returned nothing** — "chessmind.ai wrong/hallucination/inaccurate", reddit review
  threads, and app-store complaints about coaching quality all came back empty (the
  only adjacent hit, zwischenzug.gg's "My New AI Chess Coach", is about raw ChatGPT,
  not ChessMind); no press coverage or funding news found.

## 1. What it is

**A one-GM chess training platform: Maia-2 sparring at six rating bands, Stockfish
review with plain-language coaching claims, a weakness scan feeding a study plan, and
a large authored-content stack (56–69 opening courses, positional exercises, licensed
interactive books) — founded by GM Mauricio Flores Rios, the author of *Chess
Structures: A Grandmaster Guide*.**

- Maker `[V]` App Store description: "ChessMind AI was founded by GM Mauricio Flores,
  and it offers: - The best collection of positional exercises of any App - 56
  opening courses written by a GM, designed for fast and easy learning." Seller:
  **Chess Tutor AI LLC**. Flores Rios is "a statistician by trade" who "recently
  launched a chess instruction site called ChessMind A.I." `[P]` (Perpetual Chess
  ep. 434 blurb, May 2025, perpetualchesspod.com — an episode that also discusses
  "how close we are to having an A.I. model that can clearly explain chess games").
  His *Chess Structures* is in the product as `/estructuras-del-ajedrez`; the
  `sitemap-products.xml` also lists Susan Polgar's *Learn Chess the Right Way* books
  1–5 and Csaba Balogh's *Greatest Puzzles* series `[V]` — licensed interactive-book
  library `[M]` (licensing inferred from titles).
- Scale/traction: iOS release 2024-12-21; v2.0.3 current ("ChessMind AI 2.0 …
  completely rebuilt", Jul 29); 4.7★ from **121 ratings**; "1k+" App Store downloads,
  outside top-30 US free games `[P]` MWM. Small.
- Pricing `[V]` App Store IAP: Monthly $9.99 · Annual $69.99 · Lifetime $229.99 ·
  course bundles $13.99–$99.99. Free: the assessment and account creation; a
  subscription "unlocks the full AI coach: unlimited practice games, complete courses
  and personalized study plans" `[V]` homepage FAQ.
- Positioning `[V]` homepage: "A chess engine tells you the best move; an online
  chess coach tells you why you missed it. … engine analysis is a verdict, coaching
  is a plan."

## 2. What model actually powers the sparring? — ANSWERED: Maia-2, in the browser

The marketing claim `[V]` ("Our practice opponents are built on Maia chess, a neural
network trained on millions of human games") **checks out in code — a rarity worth
recording**:

- The bundle ships a feature flag `enable_client_maia:!0` and an inference chunk
  `localMaiaMove-*.js` that loads **`https://media.chessmind.ai/maia2/v1/maia2_rapid.onnx`**
  plus `maia2_all_moves.json` via ONNX Runtime, builds a `[1,18,8,8]` board tensor,
  and feeds **`elo_self` and `elo_oppo` int64 conditioning tensors** — i.e., the
  actual Maia-2 unified rating-conditioned model, run client-side `[V]` (code read).
  Moves are **sampled** from the policy (a weighted random draw over move
  probabilities is in the chunk `[V]`), not argmaxed.
- Six bands `[V]` homepage FAQ: "six levels conditioned on human rating — roughly
  1100, 1300, 1500, 1700, 1900 and 2000+ Elo — so there is always an opponent
  slightly above your own strength." Maia-2's Elo-input conditioning is what makes a
  "2000+" band possible at all (the original Maia-1 family stops at 1900) `[M]`
  analysis.
- Stockfish also runs client-side (`StockfishEngine-*.js`, `engineHub-*.js` chunks
  `[V]`; changelog v2.0.2: "Faster position analysis (Stockfish engine
  improvements)" `[V]`).

For Q5 this is a deployment datapoint: **Maia-2 rapid runs acceptably as in-browser
ONNX in a shipped consumer product** — an existence proof for client-side human-model
inference, alternative to our containerized-UCI-sidecar doctrine.

## 3. What grounds the coaching prose? — UNDISCLOSED, with authored-content counterweights

The ADR-0005 question. The honest answer: **the generator of the review prose is
invisible from desk, no LLM is named anywhere, and no public catch exists — but the
claim being sold is exactly the dangerous one.**

- The claim `[V]` homepage: "the AI analysis board pairs chess engine analysis with
  plain-language coaching: a full game review that **explains the plans behind the
  moves**, the tactics you missed in each chess position, and the habits behind your
  recurring errors." Post-game: "a coach-style debrief."
- What the code shows `[V]`: game import by **username** from an online platform
  (`POST /api/game-report/ {username, platform, batch_size}` — the strength scan's
  bulk import); review comments fetched from the server
  (`POST /api/website/game-review/comments/`); standard engine move classification
  strings ("Blunder", "Mistake", "Inaccuracy", "Brilliant", "Best move"); an
  `/api/explained-puzzles/` endpoint. Everything generative happens server-side;
  the client reveals nothing about how prose is produced.
- Counterweights against the freestyle-LLM reading `[M]` inference, flagged as such:
  the founder is a GM author whose entire brand is authored structural explanation;
  the changelog ships explanations in batches ("Explanations for endings added",
  v2.0.3 `[V]`) — batch-shipped explanations smell like authored/templated content,
  not free per-position generation; courses and glossary are explicitly
  "grandmaster-written" `[V]`.
- The pure-LLM surface is **ChessGPT** `[V]` `/chessgpt`: "ChessMind AI's open-answer
  chess quiz: instead of picking from multiple-choice options, you type your answer
  in your own words," graded into "which key points you covered, which you missed,
  and what you should have known," across "pawn-structure plans, piece activity,
  typical middlegame ideas, endgame technique." Premium-exclusive ("Use ChessGPT,
  only available here" `[V]` bundle pricing strings). Note the inversion: this is
  LLM-as-grader of *the learner's* prose against (presumably) authored key points —
  a more defensible ADR-0005 posture than LLM-as-explainer, though grading still
  requires chess truth and its accuracy is untested `[M]`. No accuracy disclaimers
  anywhere `[V]`.

**Public confabulation evidence: none found** (searches recorded in Method). Unlike
taketaketake there is no launch-day catch — but with 121 ratings and no press, the
absence is better explained by nobody-looked than by verified quality. Verdict:
**ADR-0005 live test case remains unresolved, not passed.**

## 4. Rating-band targeting

Six Maia-2 bands ~1100–2000+ (§2) — squarely our 1000→2000+ journey, with the same
"opponent slightly above your own strength" pedagogy `[V]`. The free assessment
(`/assessment`) measures level first; the scan (`/scan`, "Free Chess Game Scan — Find
Your Weaknesses" `[V]` title) profiles imported games into "a chess training plan to
fix the weakest link first" `[V]` homepage.

## 5. What of our loop do they ship?

- **Commit** — partially: courses end in "board practice against the AI" `[V]`
  homepage ("Each course pairs a written guide (main line, key ideas, typical plans)
  with board practice against the AI, so the repertoire sticks") — the closest any
  surveyed product comes to our opening→play-out seam, and worth taking seriously.
- **Play the consequence** — yes at game grain: full games vs Maia-2, and an endgame
  trainer with live resistance `[V]` `/endings`: "you make the moves, the trainer
  answers, and you find out immediately whether your technique holds up …
  Practicing against resistance — with your mistakes punished immediately — is the
  only way the technique becomes automatic." A **Survival mode** for endings exists
  (`SurvivalEndingView` chunk, `/api/survival-endings/`, `survival_mode` i18n keys
  `[V]` bundle) — semantics unknown from desk.
- **Rewind** — no evidence of checkpoint rewind as an experiment. `retry` /
  `mode_switcher_retry` / `undo` i18n keys exist `[V]` (exercise-grade retry;
  restart semantics `[M]`), nothing suggests rewind-within-a-preserved-game.
- **Preserved branches / attempt comparison** — none found anywhere `[V]` absence
  (site, store, bundle strings).
- **Phase trajectory** — none: openings, middlegames (`/middlegames`,
  `/positional-quiz`, positional exercises), and endings are separate silos; nothing
  connects a game across phases `[V]` absence.

Net: they ship **play-out and resistance** (stages 1–2, at coarse grain) and stop
exactly where the branch runtime begins. The debrief is read, not re-entered.

## 6. Its single best idea

**The content-first stack: a real GM's authored corpus wrapped around a verified
human-model opponent.** ChessMind is what "the engines are the easy part; a credible
product requires a content system" (`design/00-thesis.md`) looks like when a content
author builds it: the engines are commodity (client-side Maia-2 + Stockfish), and the
sell is 56–69 GM-written courses, "the best collection of positional exercises," and
licensed books. Secondary steal: course-position → Maia sparring as a single
integrated motion (§5 Commit); and the endgame trainer's framing of resistance as the
point ("mistakes punished immediately") is our Outcome Drill's pedagogy in miniature,
minus objectives, rewind, and preservation.

## 7. Overlap, and where it stops

This is **the closest stack neighbor in the entire matrix**: Maia opponent at banded
strengths + Stockfish validation + authored structural content + weakness-driven
selection + our exact rating band. Every ingredient of ours short of the runtime. It
stops at the same line as everyone else: the unit of training is *a course lesson, a
puzzle, or a full game with a read-only debrief*. No committed-position curriculum
play-out, no rewind-as-experiment, no preserved attempts, no comparison, no phase
trajectory, no win/hold/save objectives. The integrated rehearsal protocol remains
unshipped here too.

## 8. E1 impact

**WHITESPACE INTACT.** Loop stages: commit ◐ (course→sparring seam, coarse) ·
play-the-consequence ◐ (full games and endgame resistance, no curated middlegame
segments) · rewind ❌ · preserved branches ❌ · compare ❌ · phase transitions ❌.
The protected claim — played-through segments + preserved branch comparison + phase
transitions — is untouched.

Second-order effects:

1. **The nearest-neighbor narrowing is real but small.** "Course position → play it
   out vs Maia" now ships commercially. Our novelty statement should lean on
   *preserved attempts compared to each other* and *phase trajectory*, not on
   "opening → play-out vs human-like bot" alone (consistent with the ChessMotive
   precision correction in `00-thesis.md`).
2. **Q5 deployment evidence**: Maia-2 as in-browser ONNX with Elo conditioning and
   policy sampling is shipped and playable at six bands (§2) — cite when the
   engine-workers architecture is next revisited.
3. **ADR-0005 watch item, not verdict**: the "plans behind the moves" claim with an
   undisclosed generator is the anti-pattern's silhouette, but a GM-authored content
   spine may be underneath it. A hands-on review-quality pass (one imported game,
   transcribe the prose, check it against the board) would settle it cheaply and is
   the natural next step if Q1a needs it.
4. **Q2 signal**: $9.99/mo / $69.99/yr / $229.99 lifetime with GM-brand content and
   still ~1k downloads after 20 months — content + engines without a distinctive
   interaction does not obviously sell `[M]` reading of `[P]` traction data.

## 9. Residual uncertainty — only hands-on can settle

1. What writes the review/debrief prose (LLM? templates? GM-authored fragments?) and
   whether it confabulates — the ADR-0005 question proper.
2. Whether "reviewed move by move in real time" means during play (coach-watching,
   the §3a contamination shape) or immediately after; no in-play advice evidence
   found either way.
3. Survival-endings semantics (closest possible neighbor to our save/hold
   objectives).
4. Whether the 2000+ band is pure Maia-2 conditioning or blended with Stockfish.
5. ChessGPT grading accuracy and what its key-point rubrics are grounded in.
6. Web-vs-app parity and actual subscription gating (subscription page is
   client-rendered).
