# Coverage-gap sweep — who does each of our surfaces best, and does the matrix know them?

**Date:** 2026-08-14 · **Feeds:** Q1a, E1, `design/03` surface map, coverage-limits rule in
`design/research/README.md` · **Method status:** desk sweep, `[V]` = fetched the product's own
site/store listing in this pass, `[P]` = search-result/secondary snippets only, `[M]` = model
knowledge.

## Why and method

The matrix's two recorded failures (frozen snapshot; "training tools" frame while the product
grew fan/live/create surfaces) were both proven by owner finds. This sweep is the systematic
version of the fix: for each surface the product ships or has specified
(`design/03-product-breadth.md`), search the 2024–2026 market for the 1–3 strongest products
doing that one thing, check them against `competitor-matrix.csv` (28 rows read in full, plus
ChessMotive row 30), and ground each serious candidate with a fetch of its own site or store
listing. Take Take Take is excluded — a dedicated teardown
(`teardown-taketaketake-desk.md`) is in flight. Searches that returned nothing are recorded;
matrix rows were added only for fetch-grounded products (10 rows, 31–40).

## Per-cluster findings

### 1. Human-like opponents / bot play

Covered: Noctie, Chessiverse, Maia platform, Lichess bots, WhyThisMove (Maia-2).

- **Chess Yourself** (chessyourself.com) — trains an opponent model on *your own* public
  Chess.com/Lichess games and lets you play your clone ("your toughest opponent is in the
  mirror"), with a Pro weakness-heatmap tier "coming soon" `[V]`
  (https://www.chessyourself.com/). **Absent-relevant — row 38.** A personal-model opponent is
  an axis nobody in the matrix has.
- **ChessMind AI** (chessmind.ai) — sells Maia-powered sparring at six bands (~1100–2000+)
  bundled with courses and "move-by-move review that explains the plans behind the moves" `[V]`
  (https://chessmind.ai/). **Absent-relevant — row 36.** Closest new product to our own stack
  claim (Maia + explanation); grounding of its explanations is undisclosed.
- **MostlyHuman** (Lichess bot) — explorer-sampled openings then Maia-1900, per a search
  snippet `[P]`. **Absent-irrelevant:** a single community bot, subsumed by the Lichess row.
- **ChessMimic** (arXiv 2606.04473) — per-rating transformers beating Maia-2 on move prediction
  `[P]` (https://arxiv.org/html/2606.04473). **Absent-irrelevant for the matrix** (research, not
  a product) but already queued in the coverage matrix as a Q5/H5 comparison candidate.

### 2. Game review / storytelling / recaps (the game-story BACKLOG surface)

Covered: Chess.com (as Practice row), DecodeChess, Aimchess — none on the fan shelf.

- **Chess2Story** (chess2story.com) — paste a finished game and it renders the same moves as a
  comic, chapter-length prose, or 10–30 min audio narration, plus puzzle sets from your own
  positions; first story free, then per-item or subscription `[V]` (https://chess2story.com/).
  **Absent-relevant — row 32.** The direct competitor to the game-story slides idea, from the
  fiction end rather than the evidence end.
- **Chess.com "Key Moments" / Game Report** — post-game walk-through of openings, turning
  points and critical moments, fully released per its forum announcement `[P]`
  (https://www.chess.com/forum/view/community/new-feature-key-moments-post-game-analysis-fully-released).
  **Covered product, uncovered feature** — noted as a correction candidate for the Chess.com
  row rather than a new row.
- **Chess Story** (iOS, apps.apple.com id6740005728) — "Coach Ruy Lopez" reviews your moves
  with accuracy/Elo tracking `[P]`. **Absent-irrelevant:** commodity Stockfish-review app; the
  cluster's best examples are above.

### 3. Spectating / following live chess

Covered: nothing (taketaketake handled separately). This whole shelf was outside the old frame.

- **ChessEver** (chessever.com) — GM Vasif Durarbayli's iOS/Android/macOS app for following
  live tournaments: player tracking with notifications, multi-board with clocks and eval
  symbols, PiP, opening explorer and games database; free + $11.99/mo subscription `[V]`
  (https://apps.apple.com/us/app/chessever/id6752567269). **Absent-relevant — row 33.** The
  strongest current "follow live chess" product.
- **Follow Chess** (Asim Pereira) — the long-running incumbent broadcast app (3.5M+ downloads),
  sold to Square Off; its US App Store link now 404s `[P]`
  (https://www.chesstech.org/2020/asim-pereira-followchess-great/). **Absent-irrelevant now:**
  incumbent in wind-down; ChessEver is the live best example.
- **Watch Chess** (iOS) and **Chess.com Events** app — mobile broadcast viewers `[P]` (App
  Store id980989211; Google Play com.chess.chessevents). **Absent, name-drop only** — same
  shape as ChessEver, less current or platform-bound.

### 4. Coach-led / classroom / academy tools (B5 academy surface)

Covered: ChessDojo (community pedagogy), nothing classroom-shaped.

- **Chessido** (chessido.com) — freemium academy platform: live classroom with coach-controlled
  board sync and built-in video, puzzle homework with score/accuracy/weak-topic analytics,
  bot drills between classes, Chess.com/Lichess rating sync `[V]` (https://www.chessido.com/).
  **Absent-relevant — row 34.** Best fetched example of the academy ops category.
- **ChessPlay.io** — academies-in-a-box (lessons, live classes, scheduling, payments) in 15+
  countries `[P]` (https://chessplay.io/ — fetch blocked, 403). **Absent-relevant, name-drop
  only** (no row — not fetch-grounded).
- **Chess.com Classroom, ChessKid Classroom, Chessity, Chess.Run** — same category `[P]`.
  Name-drops; the category is crowded and ops-focused, uniformly without a rehearsal runtime.

### 5. Streaming / chess-on-Twitch tooling (B5 streamer surface)

Covered: nothing.

- **Chess vs Chat** (Steam app 1888920) — €3.29 streamer app where Twitch chat types moves,
  votes are tallied per turn, names/emotes render in-game, moderation syncs, and positions can
  load from FEN `[V]` (https://store.steampowered.com/app/1888920/Chess_vs_Chat/).
  **Absent-relevant — row 39.** The most product-shaped thing in a cluster of glue.
- **Vote-to-play Twitch extensions, TwitchLichessBot, Streamlabs chess overlays** `[P]` —
  small open-source or overlay-library glue, name-drops only. Nobody ships host-side rewind /
  branch / teach semantics; chat-vote entertainment is the whole category.

### 6. SRS / spaced repetition

Covered: Listudy, Chessdriller, Chessstack, DrillChess, Chessable, ChessTempo.

- **Chessbook** (chessbook.com) — freemium (400 free moves; Pro $7.99/mo) repertoire builder
  with SRS drilling, automatic gap finding with per-opening coverage, transposition handling,
  and scanning of your online games for repertoire mistakes `[V]`
  (https://apps.apple.com/us/app/chessbook-master-openings/id6466343415). **Absent-relevant —
  row 31.** The biggest single omission in the matrix's own home category: it post-dates the
  snapshot and is now the default recommendation in this space.
- **AnkiChess, ChessAtlas (FSRS), GoWinChess, Chessalyz** `[P]` — newer SRS/repertoire tools,
  name-drops only; same shape as Chessbook, smaller.

### 7. Structure / pattern trainers

Covered (nearest): ChessMood, Chessable, Aimchess — all courseware or exercise selectors.

- **Chess King Learn "Chess Middlegame" courses** (iOS id1140427198) — course-as-app covering
  typical plans and pawn structures (Carlsbad, Hedgehog) `[P]`. **Absent-irrelevant:**
  interactive book, same shelf as ChessMood; adds no new capability axis.
- **Nothing product-shaped detects structures live and teaches their plans.** Searches for
  software that "recognizes pawn structure / names position type / tells you typical plans
  while playing" returned articles and courses only. The B9/B10/§3b guided-mode surface has
  no direct competitor found.

### 8. Endgame-specific trainers

Covered: Chess Endgame Training, endgametrainer.com, ChessEndings, Chessload, ChessTempo,
Chess.com drills. Fresh search returned the same set (CET's GitHub/Play listings confirm
Syzygy + SF16 play-out `[P]` https://github.com/supertorpe/chessendgametraining). **No new
entrant found — the matrix's densest, most current category.**

### 9. Guided / tip-giving play ("coach watches your game")

Covered: nothing in this shape (Noctie's move-color feedback is nearest).

- **Chess.com Play Coach** (chess.com/play/coach) — platform-scale AI opponent that praises
  good moves, warns at critical moments in real time, offers a hint button up to showing the
  best move, and allows retraction to try alternatives `[V]`
  (https://www.chess.com/news/view/announcing-play-coach). **Absent-relevant — row 40** (kept
  separate from the Chess.com Practice row as a distinct surface). It is the mainstream
  version of "clippy," and it does exactly what `05` §3b forbids: it evaluates *this*
  position and recommends moves during committed play. That makes it the sharpest contrast
  object for our guided-mode design, and the strongest evidence that the category default is
  move-advice, not pattern-naming.
- **Chess Coach — AI Chess Tutor** (Google Play com.app.cheescoach) — Stockfish "coach mode"
  with per-move classification and multi-LLM explanations (Gemini/GPT/Claude/DeepSeek) `[P]`.
  Name-drop; commodity shape of cluster 11.

### 10. Opening explorers / prep with play-out

Covered: Chess From Position, SparringChess, Opening Thingy, Chessable bot handoff, Lichess.

- **OpeningTrainer** (openingtrainer.com) — free-without-signup opening reps against a
  corpus-exact opponent ("if Nf6 is played 68% of the time on Lichess, the engine plays it
  68% of the time"), explicitly positioned against spaced repetition; premium tier exists
  `[V]` (https://openingtrainer.com/). **Absent-relevant — row 37.** Opening Thingy's idea,
  productized and alive.
- **Chessalyz, OpenChess, Openings Mastermind** `[P]` — smaller explorer/flashcard tools,
  name-drops only.

### 11. AI chess coaches / LLM tutors (the ADR-0005 category)

Covered: WhyThisMove, DecodeChess, chessfeed.ai.

- **Chessvia / "Chessy"** (chessvia.ai) — voice-first AI coach: speak or type during play and
  it talks back, personas ("Hustler", "Roasty", "GM Chessy"), PGN/platform imports,
  subscription "less than a cup of coffee"; **no disclosure of engine/LLM grounding** `[V]`
  (https://www.chessvia.ai/). **Absent-relevant — row 35.** The purest live specimen of the
  dashboard-with-a-mouth anti-pattern, and (with its persona angle) a caution-and-contrast
  case for our own §3b-i persona voice.
- **ChessGPT (iOS), Chess Coach AI Tutor, LLM-ChessCoach and kin** `[P]` — a fast-multiplying
  commodity layer of Stockfish+LLM apps (App Store id6481724799 etc.). Name-drops: the
  category exists at volume now; individually none warrants a row.

## Top 5 absent products deserving a full teardown (ranked)

1. **Chess.com Play Coach** — the mainstream "coach watches your game" at platform scale;
   direct contrast object for §3a silence-default and §3b's naming-vs-recommending line, and
   the strongest single threat to "nobody ships guided play" claims. What exactly it says,
   when, and what powers it are all unverified.
2. **Chessbook** — best-in-class in the matrix's own home category (repertoire SRS with gap
   finding and own-game mistake scanning); overlaps Line Drill + the return/SRS surface, and
   its game-scan loop is the personal-history relevance we deliberately keep optional.
3. **ChessMind AI** — Maia sparring + "plans behind the moves" coaching is the closest
   commercial claim to our thesis loop's stack; teardown must establish whether its
   explanations are grounded or manufactured (ADR-0005's live test case).
4. **Chess2Story** — the existing occupant of the game-story surface (BACKLOG 2026-08-14);
   teardown would establish what a finished-game narrative product sells, what it grounds,
   and where evidence-anchored slides beat fiction.
5. **ChessEver** — the strongest follow-live-chess product; pairs with the taketaketake
   teardown to map the fan shelf our Live/spectate surface enters.

Runner-up: **Chessvia** (persona-voice LLM coach, ungrounded — worth a short specimen study
more than a full teardown); **Chessido/ChessPlay.io** (academy ops — crowded but orthogonal
to the rehearsal runtime, low overlap).

## Searches that returned nothing

- **Parallel candidate-move boards / branch groups** — "play multiple candidate moves parallel
  boards compare" returns simul tools and a 3D novelty game (Chess Multiple Boards, Steam);
  nothing plays N candidate branches as a set. The branch-group surface has no competitor
  found `[V]` (search recorded 2026-08-14).
- **Recovery-as-skill** — "defend worse positions / save lost position / grind draw" returns
  puzzle sets (chesspuzzles.io/category/defense, Chess Defense Trainer iOS) and courses
  (Chessable "Mastering Chess Defense", Chess.com lessons); nothing treats
  err → recover → save as the normal path through a played game (`05` §3a whitespace holds).
- **Live structural naming** — no product detects pawn structures/position types in-run and
  teaches the plans of the *kind* without recommending a move for the *instance* (§3b
  whitespace holds; Play Coach is adjacent but recommends).
- **Branch/rewind/compare runtime** — beyond matrix row chessfeed.ai (still unverified
  claims), searching "branch attempts rewind compare play out consequences" surfaced only
  analysis-board workflows and ChessTempo's train-branch SRS. E1's core whitespace — the
  preserved-attempt branch runtime — remains unoccupied.

## Honest limits

- Desk only: every `[V]` is a fetch of the product's own marketing/store copy, which
  overclaims by construction; no hands-on runs. Teardowns must follow for the top 5.
- Two fetches were blocked (chessplay.io, chessever.com root — both 403); ChessEver was
  grounded via its App Store listing instead, ChessPlay.io stays a name-drop.
- App-store-only apps (Chess Story, ChessGPT, Chess Coach AI Tutor) were judged from listing
  snippets `[P]`; one could be better than its copy.
- The commodity LLM-coach layer is multiplying faster than any matrix can track; the row-level
  answer is the category note in cluster 11, not enumeration.
- Search was English-language and US-results only; non-English markets (notably chess24
  successors, Indian academy platforms) were not swept.
- This sweep is itself a snapshot. The standing rule remains: whoever lands a surface checks
  who does that one thing best, then and there.

## E1 status

No found product ships preserved branch attempts, checkpoint rewind with comparison, or
phase-trajectory rehearsal — the whitespace claim survives this sweep. The pressure points
are adjacent, not central: Play Coach normalizes in-play advice at platform scale, ChessMind
AI marries Maia to explanation claims, and the fan shelf (ChessEver, taketaketake,
Chess2Story) is crowded enough that our Live/story surfaces enter occupied territory even
though our training core does not.
