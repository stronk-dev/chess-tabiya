# Teardown: Chessigma — desk research

- Date: 2026-08-16
- Feeds: Q1a / E1; `design/02` §Adoption posture; the adoption audit
  (`adoption-audit.md`); `docs/game-import-and-story.md` (the companion workflow we
  already ship); ADR-0005 / law 8; `design/05-in-run-experience.md` §1 + §3 + §3b-i.
  Reconciles `coverage-sweep-2-notability.md` (which name-dropped it and got it wrong)
  and `BACKLOG.md:585` (owner-supplied r/chess find, 2026-08-15:
  *"play on chess.com, review on chessigma"* — **a review-only companion, which is the
  shape we are**).
- Why it earned a full protocol rather than a matrix row: it is the only product in the
  corpus that a player recommended **as a companion to the platform they keep playing
  on**, which is the exact posture of our `imported` session kind. A competitor standing
  in our position is the best available test of where the *"engine review screen with a
  rewind button"* line falls in practice (`AGENTS.md` §Rejected).
- Method: desk, no account, no purchase. **Raw HTML fetched and stripped this pass**
  (`[V]`): `chessigma.com/` homepage, `/supercoach`, `/benchmarks/brilliant`,
  `/blog/how-chessigma-analysis-works`, `/blog/the-ai-chess-coach`, `/sitemap.xml`,
  `/supercoach/sparring`, `/supercoach/challenge`, `/puzzles/blunder-training`,
  `/puzzles/blunder-shield`, `/games/<uuid>`, the Google Play listing
  (`com.chessigma.app`), and the iTunes Search API record for the iOS app
  (`id6791621546`). Summariser-read only (`[P]`): `/pricing`, `/products/analysis`,
  `/blog/launching-chessigma`, the chess.com blog post.
- **Fetches that failed, and what they would have settled**: Trustpilot
  (`trustpilot.com/review/chessigma.com`) hard-403s from this environment on both
  WebFetch and raw curl — it is the one independent volume review source, and it would
  settle the love/hate section, which is currently thin. Reddit is hard-blocking this
  environment (per the task brief); the r/chess thread that generated this teardown is
  therefore quoted only through `BACKLOG.md:585`. **Every paid training module is behind
  a magic-link sign-in** (`[V]` — `/puzzles/blunder-training`, `/puzzles/blunder-shield`
  and `/supercoach/challenge` all render the sign-in page), so §2's paid half is
  marketing copy read verbatim, never an observed loop. `/supercoach/sparring` renders a
  shell with the content client-side and login-gated.

## 1. What it is

**A free, no-account, unlimited Stockfish game review for your Chess.com / Lichess /
PGN games — with a €12/mo AI coach bolted on top that turns 1,000 of those games into a
weakness model and a daily drill queue.** `[V]` homepage: *"Chessigma is a free chess
analyzer powered by Stockfish 17. Enter your Chess.com or Lichess username, pick a game,
and get a full chess analysis report in seconds. No daily limit, no premium tier, and no
signup required to start analyzing."*

- Makers `[V]` `/supercoach` §THE TEAM: **Mehdi** (Engineering & Growth) and **Eliot**
  (Engineering & Product), *"Made by two engineers."* Corporate entity **ARCHE LABS
  LTD**, Tala, Cyprus `[V]` Google Play developer block. Launched **2025-03-27** `[P]`
  `/blog/launching-chessigma`, which also reports *"More than 100k unique visitors in
  just the first week"* after a YouTuber shared it.
- Positioning is explicitly parasitic on the incumbent's paywall `[V]` homepage: *"It is
  the same kind of free chess game review that Chess.com locks behind a premium
  subscription"* / *"On Chess.com, free users get one game analysis per day and need a
  Diamond membership for full engine review."* Footer disclaims affiliation: *"Independent
  platform, not affiliated with Chess.com, Lichess, or Stockfish."*
- Self-reported scale `[V]` `/supercoach`: **1M+ players since launch, 10M+ games
  analyzed, 15K+ daily players**, and **1,713 paying "Founding Class"** members.
- Band: **explicitly under-1400.** `[V]` `/supercoach`: *"Built for the under-1400
  wall… If you're under 1400 on Chess.com, yes. That's exactly who we built it for. We
  obsessed over the patterns we see most between 800 and 1400"*; the AI-coach blog says
  *"Optimized for sub 2000 range"* `[V]`. **This is the third teardown in a row whose
  ceiling sits at or below where our band starts** (Dr. Wolf 0–1500, Chessbook
  opening-only, Chessigma 800–1400) — `design/00-thesis.md`'s 1400–2000+ core band is
  not where the free-review market is fighting.
- Engine `[V]` `/blog/how-chessigma-analysis-works` (Mehdi, 2025-05-15): Stockfish
  compiled to **WebAssembly, running on the learner's own CPU** — *"that keeps our
  hosting bill sane and lets us promise the core report will stay free forever."*
  **Depth 14** by default, with **depth 50** reused from cached evaluations when the
  position matches the **Lichess opening book**. Note the version drift: that post says
  *"Stockfish 16"*, the 2026 homepage says *"Stockfish 17"*, and `/products/analysis`
  says both in different paragraphs `[P]` — unimportant to us except as a marker of how
  loosely the grounding claim is maintained.
- Grading vocabulary is its own, for trademark reasons `[V]` same post: *"After a
  friendly trademark chat with Chess.com we coined our own set of labels"* — **Sigma,
  Awesome, Best, Nice, Ok, Theoretical, Strange, Bad, Clown** (nine tiers). And, to its
  credit, it states the limit out loud: *"Stockfish only spits out numbers. Each platform
  turns those numbers into percentages, Elo estimates, and labels using its own secret
  sauce… expect similar but not identical results, like two coaches grading the same
  test."*

## 2. Feature by feature — verdict screen, or doing-tool?

**Verdict: it is both, and the split runs exactly along the price line.** The free
product is a verdict screen. The paid product is a doing-tool. That is the single most
useful sentence in this dossier and §4 turns it into a business finding.

Complete surface, taken verbatim from the shipped nav `[V]` homepage:

| Surface | Verbatim copy | Doing, or verdict? |
|---|---|---|
| **Game Review** (free) | *"Import a game and walk it move by move with the engine."* | **Verdict.** Move grades, ACPL, accuracy %, eval graph, opening ID, engine top choice, "critical moments". Read-only walk |
| **Analysis Board** (free) | *"Paste a FEN or PGN, explore variations, and read Stockfish 17's evaluation in real time"* | **Verdict + transient exploration.** Variations are session-local; the shareable artifact is a FEN in the URL, not a saved line `[P]` `/tools/analysis` |
| **Board Editor / Next Move / Elo Calculator** (free) | *"Engine-best continuation from any FEN"* etc. | **Verdict.** Utilities |
| **Puzzles / Woodpecker** (free) | *"The same puzzles, three rounds. Faster and cleaner each pass, until they stick."* | **Doing — as find-the-move.** The rejected shape (`AGENTS.md` §Rejected, tactics trainer) |
| **Blunder Training** | *"Replay every mistake with the coach in your ear."* | **Doing.** One-move re-solve of your own error |
| **Blunder Shield** | *"Two moves. One's a trap. Pick the safe one before the clock runs out."* | **Doing — two-option forced choice, timed.** A binary quiz, not play |
| **Conversion Trainer** | *"Won the position, lost the game? Drill the moments you let it slip."* | **Doing.** Our `save`/`hold` objective vocabulary, aimed at the learner's own games |
| **Endgame Trainer** (Soon) | *"How many won endgames have you lost? Study the classics. Stop bleeding free Elo."* | Unshipped |
| **Sparring** (NEW) | *"Climb the bot ladder. Nine sparring partners, each with a real repertoire."* | **Doing.** A persona ladder with declared repertoires |
| **Opening Trainer** (NEW) | *"Master your openings. Train every line with the coach in your ear."* / *"The lines you keep losing to, pulled from your own games. Learn them move by move, then drill them until they hold."* | **Doing.** Recall drilling, Chessbook/Chessable shape, sourced from your own losses |
| **Bot Challenge** | *"You blew a +3 in a real game. Pick it back up at that exact move. Same clock. Bot at your level. Finish it this time."* | **Doing — and this is the one that matters.** See below |
| **Supercoach: Today / Report / Chat** | *"Yesterday's games scored against your 30 day baseline"* / *"Five-section deep dive"* / *"Metrics coach over your data. Ask anything."* | **Verdict** (aggregate), plus a conversational layer |
| **Benchmark** (NEW) | *"Brilliant-move detection, measured against every free review tool."* | Marketing instrument — and the best idea on the site (§6) |

### 2a. Bot Challenge is re-entry into play, and it is the closest anyone has come

*"You blew a +3 in a real game. Pick it back up at that exact move. Same clock. Bot at
your level. Finish it this time."* `[V]` `/supercoach`.

That is **commit → play the consequence**, from a moment selected out of a reviewed
game, against an opponent, at the original time control. Structurally it is our
`story-reentry` branch (`docs/game-import-and-story.md` §Re-entry and export) with the
clock preserved. It is materially further than anything the corpus has recorded before:
Chess.com's Game Review re-entry is a **one-ply Retry puzzle**
(`teardown-chesscom-platform-desk.md`), Chess2Story's moment slides are **read-only**
(`teardown-chess2story-desk.md`), Dr. Wolf's undo **erases** the attempt
(`teardown-drwolf-desk.md`), and Chessbook has **no opponent anywhere**
(`teardown-chessbook-desk.md`). Chessigma actually hands the learner the board back and
makes them finish.

**And then it stops.** Across every fetched surface there is **no** statement — none —
that a second attempt is stored beside the first, that the original continuation is
retrievable after re-entry, that two attempts can be viewed together, or that rewind
forks rather than restarts. The founder's own promotional post lists *"Branch & explore
lines"* `[P]` (chess.com/blog/Akenosir, 2025-07-11), but in context that is the analysis
board's variation tree — an authoring gesture over a static position, not a record of
what the learner played. **Their unit of truth is the aggregate metric, not the
attempt**: the whole product is oriented toward 1,000 games × 250 numbers, and a single
re-entry is an exercise consumed by a daily plan, not an object that persists.

**E1 verdict: intact, and narrowed at the front.** Loop coverage as observed:

| Stage | Chessigma | Evidence |
|---|---|---|
| Commit | **✅ (paid)** / partial free | Bot Challenge, Sparring; free tier commits one move against an answer key |
| Play the consequence | **✅ (paid)** | *"Same clock. Bot at your level. Finish it this time."* `[V]` |
| Rewind | ⚠️ analysis-board variations only, transient | `[V]` `/tools/analysis`; no re-entry-time rewind described anywhere |
| Preserved branches | ❌ | No claim on any surface `[V]` — and the aggregate-metric orientation argues against it |
| Compare | ❌ | No claim on any surface `[V]` |

**Chessigma re-enters the game; it does not preserve the re-entry.** That sentence is the
whole competitive position, and it says something the repo has not previously been able
to say with a live example: *the line in `AGENTS.md` §Rejected is not "does it have a
rewind button" — Chessigma has re-entry and is still not us. The line is whether the
second attempt survives to be compared with the first.*

## 3. The companion posture — and what it buys, measured against our own import

The r/chess recommendation is *"Play on chess.com, review on chessigma"* — the tool never
asks you to leave the platform you play on. Concretely, what that buys:

- **An import path instead of a corpus.** Username → recent games, automatically `[V]`
  homepage. No games database to build, no PGN curation, no licensing.
- **No matchmaking burden.** No pool liquidity problem — the incumbent's real moat per
  `BACKLOG.md:584` (3 minutes to find a 5|3 game at 500 Elo vs 2–3 seconds).
- **No retention obligation — replaced by a manufactured one.** The free tool needs no
  retention at all; the paid tier then *manufactures* it with a **DAY STREAK** row and a
  *"Today's to-do 0/15"* checklist `[V]` `/supercoach`. Note what that implies: the
  companion posture removes the retention burden from the free product and relocates it
  into the paid one.
- **Zero server cost for the core value** — Stockfish WASM on the learner's CPU `[V]`,
  which is *why* the free tier can be unlimited. The give-away is engineered, not
  charitable.

**Against our own `imported` kind** (`docs/game-import-and-story.md`), directly:

| | Chessigma | Tabiya `imported` |
|---|---|---|
| Entry | Username → whole recent-game list, auto-fetched; chess.com **and** lichess | **One explicitly chosen game**: pasted PGN or one public `lichess.org/<id>` URL. chess.com URLs refused by name (no supported public per-game fetch) |
| Account linking | Yes for Supercoach (chess.com/lichess account read) | **Refused by design** — *"not account linking, bulk history mining, or the product's required starting point"* |
| PGN | Free tier: yes. **Supercoach: no** — *"PGN import is the most requested feature still on the roadmap"* `[V]` | Yes, verbatim-retained, ≤300 plies, replayed through the shared chessops parser |
| What you get | A report, then (paid) a drill queue | A **grounded story** whose moments open back into live play |
| What a moment does | Bot Challenge: restarts you there (paid) | Selecting a moment rewinds to `entryNodeId` and **explicitly creates a `story-reentry` branch before opening the run**, so the imported continuation is preserved even when the moment is the original leaf |
| After re-entry | Undocumented; nothing survives | Ordinary opponent / evidence / structural-reading / rewind / comparison / branch-group machinery; PGN export defaults to **all branches**, written as legal PGN variations |

**We already serve this workflow, one game at a time and with the branch attached.** The
gap is not the loop; it is the on-ramp — they take a username, we take a paste. Their
version is worse pedagogy and much better funnel, and that trade is worth naming rather
than winning on paper.

## 4. What it charges for — the inversion, and it is the interesting finding

The thread that surfaced Chessigma is about Chess.com paywalling analysis. So: **what
does a companion tool conclude is worth money once the incumbent has decided analysis
is?**

**Free, forever, unlimited, no account** `[V]` homepage + `/pricing`: game review (full
Stockfish, every game in your history, any time control), puzzles, analysis board, board
editor, next-move, Elo calculator. Plus, per the app-store listing `[V]`, *"Plain-English
reasons for each move, not just numbers"* and *"turns your own mistakes into quick puzzles
and replays them until you find the better move."*

**Paid — €12/mo (founder), €99/yr, €299 lifetime; regular price €17/mo** `[V]`
`/supercoach`, sold in explicit cohorts (*"Class #1 €8 Closed / Class #2 €12 Open now /
Regular €17 Up next"*):

- **Chess DNA** — *"1,000 games. 250 numbers."*, *"233+ numbers"* per game, five
  categories: **Blunders, Discipline, Tactics, Conversion, Preparation**.
- **Daily 15-minute plan**, and *"Four live modules: Blunder Fix, Blunder Shield,
  Woodpecker, Bot Challenge"*.
- **Coach Froggy**, 200 messages/month.
- **"Elo win guaranteed, or 7-day money back."**

**So the price line is drawn between the verdict and the doing.** Analysis — the thing
the incumbent just monetised — is given away as an acquisition surface with a
near-zero marginal cost (client-side WASM). What is charged for is (a) the **cross-game
weakness model** and (b) **the drills that make you do something about it**. Two
corroborating details: their own comparison table prices *"Chess.com Diamond —
game-by-game review — $15.99/mo"* as one of **seven** apps they claim to replace
(*"Bought separately $203/mo"*, alongside Aimchess $7.99, Chessable Pro $11.99, ChessMood
$99, DecodeChess $8.25, DiscoChess $10, an FM coach at $50/hr) `[V]`; and the
guarantee is denominated in **Elo**, not in features.

For us this is a directly usable pricing reading, and it is the *opposite* of the
incumbent's: **the verdict is a commodity and knows it; the doing is what a companion
tool believes people will pay for.** That is our half of the market, sold by someone
else, to a band below ours.

## 5. Grounding — the sharpest live ADR-0005 / law-8 case in the corpus

`teardown-chessmindai-desk.md` left the ADR-0005 case *unresolved, not passed*, because
the prose generator was undisclosed. Chessigma is not undisclosed. It advertises the
prohibition.

- **The product blog states the ambition in the exact forbidden form** `[V]`
  `/blog/the-ai-chess-coach` (Mehdi, 2025-07-08): *"the AI chess coach is busy connecting
  dots: 'This player loses 67% of games where they castle queenside against the Sicilian,
  typically around move 23, usually due to weak dark squares.' That's not analysis.
  That's prophecy."* The first two clauses are countable from a game history. **"usually
  due to weak dark squares" is a causal chess claim no instrument in that pipeline can
  produce** — it is rung 6 (`design/05` §3 ladder) writing rung-5 content, i.e. exactly
  what §3b-i (*"The LLM is the voice, never the source"*) forbids.
- **Worse, it attributes intent to the learner** `[V]` same post: *"You played Bg5
  because you wanted to trade pieces in a complex position, but this actually helps your
  opponent's attack because…"* Nothing observable supports *"because you wanted"*. Our
  own transition grammar refuses routing, prophylaxis and forcing claims **by name**
  rather than smuggling them into the census (`docs/transition-primitives.md`,
  `BACKLOG.md:588`) — this is the same refusal, declined.
- **Shipped, not hypothetical.** The Supercoach mock renders a "Coach Brief" of exactly
  this kind `[V]` `/supercoach`: *"Your openings are clean. Your endgames are not… Three
  of your eleven losses were already won. Save rate sits at 20%… Discipline is your
  lowest score at 37. The blunders aren't bad ideas. They're rushed ones. Two extra
  seconds before each move and a quarter of these games flip."* Read carefully, this
  prose is **partly rung-0 arithmetic** (11 losses, 3 already won, 20% save rate, score
  37) **and partly manufactured causation** ("they're rushed ones", "a quarter of these
  games flip"). The mixture is the danger: the true numbers launder the invented clause,
  which is the precise failure ADR-0005 exists to prevent and the reason
  `docs/claim-backing.md` pins claims by SHA-256 rather than trusting a checker's mood.
- **They deny being a wrapper, and offer a benchmark instead of a mechanism** `[V]`
  `/supercoach` FAQ: *"Is this another ChatGPT wrapper? No. We built a real chess agent on
  top of all that game data, then tested it on ChessQA, the benchmark made to measure how
  well AIs understand chess. Most score under 30%. We hit 98%."* **Unverified `[P]` and
  self-reported**; no model, no method, no published run. A ChessQA score is a claim about
  question-answering, not about whether a generated sentence is entailed by an instrument
  reading — which is the property our checker enforces (`docs/explanation-grounds.md`).
  A high benchmark score and a confabulated causal clause are perfectly compatible.
- **No public confabulation catch was found** in any source this pass — as with Dr. Wolf
  and ChessMind AI. The absence keeps recurring and it is not evidence of safety; it is
  evidence that **nobody in this market is checking**, which is precisely the space our
  claim-backing machinery occupies.

## 6. What it can express that we cannot, and vice versa — mechanically

**It can, we cannot (and in two cases, will not):**

1. **A cross-game weakness model** — 1,000 games, 250 metrics, five named categories,
   yesterday scored against a 30-day baseline `[V]`. **We refuse this by doctrine**, not
   by capability: it is the v1 identity (*mine games → detect weaknesses → generate
   episodes*) and mandatory-import entry, both named in `AGENTS.md` §Rejected. Chessigma
   is the crispest live proof that the refused identity is a real, paying market — and
   equally, that holding it does not threaten E1.
2. **Clock as a first-class training object** — *"Same clock"* on re-entry, *"before the
   clock runs out"* on Blunder Shield, and a whole **Discipline** category (*"Time
   pressure, snap moves, flagging"*) `[V]`. We have none of this, and our own D331 pass
   (`time-as-a-difficulty-lever.md`, commit `790a4de` — *"time is not the missing lever"*)
   refuted time **as a difficulty lever**. Note the distinction that refutation does not
   cover: Chessigma uses the clock as **fidelity** (the clock you actually had) and as
   **diagnosis** (when you rush), never as a difficulty knob. Design prompt, §7-A.
3. **Zero-friction reach** — analysis with **no account at all**, and native **iOS and
   Android** apps. We are principal-scoped (`docs/identity-and-authorization.md`) and
   responsive-only (`mobile-scope.md`: tolerate, and the tablet floor is currently unmet).
4. **A conversational coach over your own record** — Froggy chat, 200 msgs/mo `[V]`.
5. **Named opponent personas** — *"Nine sparring partners, each with a real repertoire"*
   `[V]`. We have bands and modes; we have no characters.
6. **A published head-to-head detector benchmark with a restraint axis** — see below.
7. **Retention scaffolding** — day streak, daily to-do list, Wrapped, leaderboards.

**We can, it cannot** (`docs/` is the canonical description of what exists):

1. **Attempts that survive.** `docs/branch-runtime.md`: play is an immutable, path-keyed
   tree; rewind **forks**, and the original attempt is never destroyed. Nothing on
   Chessigma's surface preserves a second try.
2. **N-way comparison**, 2–8 preserved attempts aligned on the deepest shared node
   (`docs/n-way-comparison.md`). Their comparison object is a metric over games, never
   two lines the same learner played.
3. **A human-model opponent with a measured band contract** — Maia at a bounded
   `targetElo` (`docs/engine-workers.md`), with the band's actual worth measured at
   **0.289–0.400 Elo per band point** over 16,660 games (`maia-band-outcome-transfer.md`)
   and a publishable range of `[1000, 2400]` (`maia-band-calibrated-range.md`). *"Bot at
   your level"* is an undisclosed species with an undisclosed calibration.
4. **Outcome objectives** — `win`/`hold`/`save`/`resist` graded from persisted chess
   facts and authored resolution points (`docs/outcome-drill-grading.md`), not centipawn
   loss. Note that their **Conversion Trainer** is our `save`/`hold` question asked with
   only a centipawn instrument to answer it.
5. **Abstention as a contract** — tablebase within range, silence outside
   (`docs/tablebase-grounding.md`; `design/05` §1 *"Absence is stated, never simulated"*).
6. **Enforceable grounding** — SHA-256-pinned authored claims (`docs/claim-backing.md`),
   evidence-packet-checked voice (`docs/explanation-grounds.md`), and admissible recorded
   evidence with no network during play (`docs/recorded-evidence.md`). Their equivalent is
   a benchmark score in an FAQ.
7. **Rules-derived rung-0 sight** — structural reading and the transition census
   (`docs/structural-reading.md`, `docs/transition-primitives.md`) at 29 µs/ply
   (`move-primitive-computability.md`), with the unmeasurable families refused by name.
8. **Authored middlegame content** — packs, shape library, plan-consequence grading
   (`docs/drill-pack-format.md`, `docs/shape-library.md`). Their middlegame answer is
   statistics over a phase that R4 and R9 jointly proved has **no oracle**
   (`practical-difficulty-outside-tablebase.md`, `human-outcome-coverage-depth.md`) —
   which is a reason to doubt the Chess DNA middlegame categories, not to envy them.
9. **Live and spectated sessions** (`docs/live-sessions.md`) — absent entirely.
10. **Silence by default** (`design/05` §3a). Chessigma's two newest modules are sold as
    *"with the coach in your ear"* — the opposite default, stated twice, as a feature.

### 6a. The Benchmark page is the best idea on the site

`/benchmarks/brilliant` (Eliot, updated 2026-07-31) replays 100 chess.com-badged
brilliants through five free review tools and scores them `[V]`: **Chessigma 93/100,
Chessiro 90, WintrChess 45, Chessitup 41, Chesskit 23**, using chess.com's stored labels
as the answer key. The part worth stealing is not the score — it is the **second axis**:

> *"Catching brilliants is only half the exam. The other half is restraint: a reviewer
> that stamps brilliant on ordinary moves is handing out confetti, not information."*

…formalised as **incorrect calls per 1,000 ordinary moves**, and reported as *"Chessigma
hands out one unconfirmed badge every 20 games. The other tools: one every 3 to 6."*
A precision/recall plot with quadrants labelled CAREFUL / TRUST / WRONG / LOUD.

That is a **published false-positive discipline for a claim generator**, which is exactly
the measurement `census-hint-false-positives.md` performs internally and we have never
published. It also corroborates `BACKLOG.md:581` (*option-collapse is the primitive an
outside player reached for*) and puts numbers next to `BACKLOG.md:582`'s unverified claim
that classification is tuned to flatter — Chessigma is measuring rivals' over-calling
because over-calling is the market's actual failure mode.

Two caveats before adopting the idea: the answer key is **chess.com's own labels**, so it
measures agreement with an incumbent's secret sauce rather than truth; and each benchmark
move carries a **Coach Froggy** explanation (*"White sacrifices the knight on c7 to lure
the black queen away from defending f6…"*) — LLM prose again, tethered to a line but not
to a checker.

## 7. Adoption candidates, with their invariant collisions

Per `design/02` §Adoption posture: **a collision is a design prompt, not a veto** —
rulings constrain the *form*, never the existence. Candidates for `adoption-audit.md`,
strongest first:

**A. Re-entry at the exact ply with the original clock ("Bot Challenge").**
*Collision:* **none with §1** — we already fork on re-entry (`story-reentry`), so the
half we lack is only the clock. The clock half collides with **D331's refutation of time
as a difficulty lever** (`time-as-a-difficulty-lever.md`). *Transformation:* adopt the
clock as **provenance/fidelity, not difficulty** — *"the same clock you actually had"* is
a recorded fact of an `imported` run's PGN headers, so it is rung-0 and needs no new
truth. Our version beats theirs for free by attaching preservation and n-way compare to
the same gesture.

**B. The offer copy — "You blew a +3. Finish it this time."**
*Collision:* **ADR-0006 / commit-before-learning** (`design/05` §1) — the offer names the
evaluation before the learner plays a move. *Transformation:* the offer may state the
**recorded historical outcome and the moment index** (facts) without exposing an eval at
the board; `design/05` §3a-i's disclosure model already draws that line, and
`docs/game-import-and-story.md`'s story already surfaces *"the last near-level moment in a
recorded loss"*. This is a copy-and-entry-point adoption, not an engine one.

**C. Conversion Trainer — "Won the position, lost the game? Drill the moments you let it
slip."** *Collision:* **none.** *Why it is the cheapest on the list:* we ship the
grading (`save`/`hold`/`resist`, `docs/outcome-drill-grading.md`) **and** the detector
that finds the moments (the story's near-level-in-a-loss moment). The only missing piece
is a named entry that composes them. **Strongest cheap adoption in this teardown.**

**D. A published restraint metric for our own claim surfaces** (§6a).
*Collision:* none — it *serves* §1 *"Absence is stated, never simulated"* and law 8.
*Form:* false-positive rate per 1,000 plies for each detector family, published, with the
answer key being tablebase/rules rather than a competitor's labels.

**E. Named sparring personas with declared repertoires.**
*Collision:* rejected doctrine only if a persona is weakened Stockfish (`AGENTS.md`
§Rejected); persona **prose** is bound by §1 *"nothing invents chess truth"*.
*Transformation:* a persona is a presentation layer over `targetElo` + a declared
repertoire. **And the evidence caps the ladder**: `maia-band-outcome-transfer.md`
measured a 100-band step as *not* a rung (smallest usable step ≈150–208 band points), so
across the publishable `[1000, 2400]` we can honestly offer **five to nine** distinct
partners — Chessigma's nine is at the top of what our own measurement would license, and
they have published no measurement at all.

**F. Free, no-account, unlimited review as the acquisition surface.**
*Collision:* `docs/identity-and-authorization.md`'s principal model; and the *"mandatory
game import as the entry point"* rejection — **only if** it becomes the required door.
*Transformation:* the existing `/review` import form as an ungated entry whose terminus
is a **re-entry offer**, not a report. Note the honest cost asymmetry: their free tier is
free because Stockfish runs on the learner's CPU; ours would carry a Maia sidecar.

**G. Chat coach over the learner's own record ("Froggy").**
*Collision:* **head-on with law 8 / rung 6 and `design/05` §3b-i** — an open chat is the
maximum-latitude surface for the exact fabrication ADR-0005 names.
*Transformation:* a chat channel restricted to **querying recorded evidence packets** —
the checker exists (`docs/explanation-grounds.md`), so the new thing is a question
channel over the same packets, where anything unanswerable from a packet returns
**absence** rather than prose. High value, highest risk; ledger it, do not fast-track it.

**H. Daily plan / streak / "Today's to-do".**
*Collision:* **ADR-0007** — progression is unlocked by playing, never by paying or by
elapsed time (`design/06-campaign.md`:138); a day-streak is time-based.
*Transformation:* a queue selected from the learner's own due packs and preserved
attempts (`docs/return-and-progression.md` already schedules), and a counter of
**attempts finished**, not days visited.

**Not adopted:** the mistake→puzzle re-cut (*"turns your own mistakes into quick
puzzles"*) is the find-the-tactic shape prohibited by `design/00-thesis.md` §§70, 93–94;
the CC0 re-cut we permit is *play-the-consequence*, and candidate C is that same material
in the permitted form.

## 8. Love and hate — thin, and honestly so

- **Third-party ratings are small and mixed**: iOS **4.4★ from 24 ratings** (ARCHE LABS
  LTD, `id6791621546`, updated 2026-07-28) `[V]` iTunes Search API; Google Play **5K+
  downloads**, no aggregate rating displayed `[V]`. Set that beside the site's own
  **"4.9/5 from 1,713 users"** and **"1M+ players"** `[V]` — the owned signal and the
  independent signal are two orders of magnitude apart, and only the owned one is
  flattering. **The web product is clearly the product; the apps are new and small.**
- **Loved for**: free, unlimited, no account, no ads, no captcha; *"a free chess game
  analysis tool that actually speaks human"* `[P]` (chess.com/blog/Akenosir — founder-
  authored, so treat as marketing); *"Its free and good, the UI is well done"* `[P]`
  Play review extract.
- **Hated for**: analyses that stall or return empty on longer games — corroborated by
  the developer's **own** release note `[V]` Google Play *"What's new"*: *"Analyses that
  used to stall or come back empty on longer games now finish, and a review that does
  fail is now detected properly instead of being cut off while it was still working."*
  Mobile sluggishness is admitted in their own blog `[V]`: *"Speed on desktop is solid,
  but we know mobiles can feel sluggish"* — the direct cost of client-side WASM, and the
  reason our server-side Maia/Stockfish posture is not simply more expensive.
- **Trust**: ScamAdviser reportedly flags the domain `[P]` (search extract only; not
  fetched, and ScamAdviser is a weak signal for a young indie domain). **Trustpilot is
  403-blocked from here and is the gap in this section.**
- **A structural risk they carry and we do not**: the free product's entire value
  proposition is *"the thing Chess.com charges for, free."* It is one incumbent pricing
  decision away from losing its reason to exist — while a companion posture gives it no
  independent hold on the player.

## 9. Residual uncertainty — what only an account or hands-on settles

Every item below is `[P]` or unknown and would change a sentence above:

1. **Does a second Bot Challenge attempt survive the first?** The load-bearing question.
   Nothing states it either way; I have inferred "no" from silence and from the
   aggregate-metric orientation. *Settled by:* one €12 month, two attempts at one
   position, and a look at whether the first is retrievable.
2. **What is "bot at your level"?** Species and calibration undisclosed. If it is
   weakened Stockfish, it is rejected doctrine and their re-entry is much weaker than it
   reads. *Settled by:* ~20 moves at a stated level, logging FENs (the Noctie protocol,
   `teardown-protocols.md` §2.1).
3. **Which tier are Conversion Trainer, Sparring and Opening Trainer in?** They post-date
   the pricing page's free list *and* its "four live modules" paid list `[V]` — the
   marketing has not caught up with the nav. *Settled by:* the signed-in nav.
4. **Is the free game review's "plain-English reasons for each move" LLM prose?** The app
   stores say yes for the free tier `[V]`; the website's free description says only
   grades and numbers. If free-tier prose is generated, the law-8 exposure is on the
   surface a million people use, not on the paid one.
5. **What generates Froggy, and what grounds it?** No model, no method, no published
   ChessQA run.
6. **Trustpilot volume review body** — 403 here; the one independent source that would
   turn §8 from thin to solid.
7. **Whether the analysis board preserves variations across a session** — `[P]` from a
   summariser read; a URL-encoded FEN is not a saved line.

## Misc (serendipitous, not chased)

- **Three products absent from the matrix surfaced in their benchmark**: **Chessiro**
  (90/100 — the only tool near Chessigma's detector), **Chessitup** (41), **Chesskit**
  (23) `[V]` `/benchmarks/brilliant`. All appear to be free-review tools; none is in
  `competitor-matrix.csv`. This is coverage limit #1 (*the matrix is a snapshot, not a
  watch*) firing again — and note the sweep found them *through a competitor's own
  marketing*, which is a cheap monitoring channel nobody has used.
- **`coverage-sweep-2-notability.md`'s classification of Chessigma is refuted by this
  pass.** It filed it under *"Chessigma, ChessRoots, WhyThisMove kin — commodity free-
  review/visual-explorer shapes `[P]`"*. It is not a commodity free-review shape: it has
  a paid AI-coach tier, a re-entry-into-play module, an opponent ladder, native apps and
  a seven-figure user claim. **The `[P]` name-drop bucket at the bottom of a sweep is
  where a real competitor hid for two days** — a process finding for the sweep method,
  not a criticism of the sweep's main body.
- **Their comparison table is a free competitive map**, and it prices **DecodeChess**
  ($8.25/mo) — a `competitor-value-props.md` open verification item — as live and sold
  `[V]`, which is more than the dossier currently has.
- **Openings pages** (`/openings/anti-caro-kann`, `/openings/london`, … 18 of them) and a
  heavy multilingual blog (ar/es/fr/hi/ru) show the acquisition engine is **SEO**, not
  virality — the same lesson as `BACKLOG.md:583` (*the valuable tool is not the prominent
  button*) seen from the other side: they win by being the page you land on.
