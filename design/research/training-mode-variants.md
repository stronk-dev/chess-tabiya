# Training-mode variants — the engagement-format catalogue

**Question** (owner, 2026-08-22, [[D870]]): *"Solitaire chess sounds like a variant that fits
within our campaign mode AND as a separate mode — shouldn't our campaign mode have more variants
like that??? What other novel chess variations there be???"* Extended mid-flight by a second
owner ask: *"What if for campaign mode you can even obtain fairy pieces? Or start with only pawns
on a smaller board? We need different ways to train different things and keep it fun — but we
don't need to forget we're learning chess here, so there's a balance."*

Feeds: [[D869]] (solitaire as encounter class), [[D870]] (the variant family), [[D860]]
(guess-the-move mechanism), [[D862]] (tempo cycles), [[D549]] (progression surface),
`design/06-campaign.md` §5 (encounter vocabulary). Landed 2026-08-22, claude. Desk research with
one `[V]` source-level enumeration (Lucas Chess, from its own repository) and `[V]` repo traces.

**The boundary, kept crisp per [[D870]]**: this dossier catalogues **training-mode variants** —
different ways of engaging *standard* chess. **Rule variants** (Chess960, crazyhouse, atomic,
xiangqi/shogi) are a different axis, parked under [[D327]]/[[D328]]; they appear only in §9 as
"the other axis", with no design work.

**Headline findings first:**

1. **Formats are cheap; verdict producers are the scarce thing.** Lucas Chess ships ~46 named
   modes from one maintainer for free, and every one of them reduces to one of about six verdict
   mechanics (§1.4). The owner's "shouldn't we have more variants???" has a happy answer: yes,
   nearly for free — because `design/06` §5 made *sealing a property of the node*, a new format
   is a new node flavour over an existing verdict shape, not a new subsystem. Only formats that
   demand a **new verdict shape** are expensive, and the catalogue finds exactly **one** genuinely
   new shape across the entire field (§5.2).
2. **Most of the field's formats are already expressible.** Of the 30 catalogue rows in §5's
   mapping table, 21 seal under the two shipped producers plus [[D869]]'s proposed third shape;
   4 need the one new fourth shape; 5 are display modes, social surfaces, or evidence-dark play
   that should not be encounters at all.
3. **The didactic-reduction family (§4) is the sleeper.** Reduced-material starts on the standard
   board are *legal chess positions* — every instrument we own works on them unchanged — and the
   classical odds ladder is a centuries-old precedent for exactly the material progression the
   owner asked for. Smaller boards and fairy pieces, by contrast, exit the evidence plane
   entirely, and the balance rule proposed in §4.5 (owner-tier) draws the line where the
   instruments stop.

---

## 0. Method and honesty ledger

- Web pass 2026-08-22. Lucas Chess is enumerated `[V]` from its own source repository
  (`lukasmonk/lucaschessR2`, menu label extraction from
  `bin/Code/Menus/MenuTrainings.py` and `bin/Code/Menus/BasicMenus.py`, fetched raw this pass)
  plus its official Train guide PDF (v R 2.01c2) and v7.08 mode summary, both fetched from
  <https://lucaschess.pythonanywhere.com>. Commercial-field claims are `[P]` against cited
  product/support pages or search-snapshot summaries as flagged; `[M]` where stated.
- Repo claims are `[V]` at file/dossier reference; encounter-vocabulary claims cite
  `design/06-campaign.md` §5 as amended 2026-08-22.
- **Head verification**: ledger head checked three times this pass because it *moved under the
  dossier twice* — first read gave D870; a concurrent commit (`b083ac8`, "id collision warning —
  D869 is taken, renumber to D871") moved it to D871 mid-research; a second concurrent landing
  (`bf410e9`, the two UX dossiers, rows D872–D882) moved it again mid-write. Verified head at
  final write time: **D882**. Proposed rows (§10) start at **D883** and are proposed only, not
  written — the same in-flight head movement `titled-player-training.md` §7 recorded, now twice
  in one pass; whoever lands these rows must re-verify the head first.
- **Register note**: [[D870]]'s text cites "[[D718]] negative reading" for the avoid-the-blunder
  seed; after the D718 register collision was corrected, the negative-reading owner ruling lives
  at **[[D745]]** (D718 is the layout-trace row). Cited as D745 throughout here.
- Two commissioned mode names did not survive contact with the source `[V]`: **"Boxing"** is the
  *internal codename* of the Resistance Test (`bin/Code/Resistance/Resistance.py:13`,
  `self.configuration.ficheroBoxing`), not a separate mode; and **no "maze" mode exists** in the
  lucaschessR2 tree (repo-wide code search finds "maze" only in an openings locale file and a
  Stockfish contributors list). Recorded so the folklore names don't re-enter the ledger.

---

## 1. Lucas Chess — the motherlode

Free, GPL, one primary author; the largest single collection of named training formats in any
chess product. Enumeration `[V]` from the R2 source menus, descriptions `[P]`/`[V]` from the
official Train guide (v R 2.01c2, 17 pp.) and the v7.08 game-mode summary.

### 1.1 Train menu (29 named modes/submodes)

**Basics (7):**

| Mode | What the user does | What grounds the verdict |
|---|---|---|
| "Check your memory on a chessboard" | memorize a position, reconstruct it from an empty board; 6 levels, more pieces / less time | exact-match against shown position (mechanical) |
| "Find all moves" (Player/Opponent) | enumerate *every* legal move out of check, in piece order K,Q,R,B,N,P; 60+60 exercises | legal-move enumeration (movegen; mechanical) |
| "Becoming a knight tamer" | maneuver a knight to "capture" a stepping king while avoiding guarded squares | reach-the-square (mechanical) |
| "Moves between two positions" | two boards, 1–10 moves apart; input the exact move sequence connecting them | sequence match (mechanical), timed |
| "The board at a glance" | flash a position; report pieces, squares, colors, attack relations | recall match (mechanical), timed |
| "Coordinates" (simple / "By blocks" / "In one line") | click named squares fast | square identity (mechanical), timed |
| "Writing down moves of a game" | notate a replayed game precisely, including check marks | notation match (mechanical), helps counted |

**Tactics (8):** "Training positions" (categorized sets: checkmates, endgames, pawn endings,
singular moves, general tactics), "Learn tactics by repetition" (block repetition with a
"Reinforcement" error-repeat mode — blocked practice, SRS-adjacent), "Find best move" (engine
adjudicates your move in imported/bundled sets, points + time), "Your daily test" (5 positions/day,
score = average centipawn deduction vs the engine's best), "Determine your calculating power"
(visualize and type continuation lines without moving pieces; graded against engine lines),
"Turn on the lights" (a board of "bulbs" = timed puzzle blocks, lit by beating thresholds; Memory
vs Calculation modes; UNED chess school and Uwe Auerswald sets), "Personal tactics" (own sets),
**"The Circles"** — the menu label is literally the Seven-Circles/Woodpecker cycle format, sitting
beside the repetition trainer `[V]` (menu source).

**Games (5):** "Play like a Grandmaster" (guess-the-move over per-GM databases with automatic
branching into whichever included game your move matches; adjudicator engine scores deviations in
centipawns, *bonus for beating the GM's move*; per-GM track record), "Captures and threats in a
game" (moves flash without being played; you report capturable pieces and threats from
visualization), "Count moves" (same, reporting mobility counts), "Resistance Test" — survive as
many plies as possible against a full-strength engine before your cumulative engine-evaluated
deficit passes 100 cp; variants "Blindfold chess", "Hide only our pieces", "Hide only opponent
pieces" — and "Learn a game" ("Memorizing their moves" — reproduce a game at increasing
half-move offsets; "Playing against" — guess one side's moves, deviations penalized).

**Openings (2):** "Training with a book" / "Train the opening lines of a book" — opponent policy
configurable as *uniform random / proportional random / always-highest-percentage* over book
moves `[V]` (Train guide p.15) — note this is a hand-rolled ancestor of exactly our
explorer-proportional opponent idea, grounded in book percentages rather than played-game data.

**Endings (3):** "Training mates" (mate-in-1…7 ladders, help costs an error), "Mate in 1½"
(visualization: give the mating reply to *every* opponent response without moving pieces),
"Endings with Gaviota Tablebases" (DTM puzzle sets by material, order by difficulty).

**Long-term trainings (4):** "Training on a map" ("World map", "Africa map"), "Transsiberian
Railway", "Expeditions to the Everest", "The Washing Machine" — journey/map skins over graded
exercise+game series. The official guide declines to document them, calling them "arcade-style…
frivolous time-wasters" `[V]` (Train guide p.17) — while they are, structurally, **the campaign
map shipped in a free desktop app**: a progression skin over encounter sequences. That a
solo-maintainer product ships four of them is direct evidence the map layer is cheap; that its
own documentation dismisses them is direct evidence a map skin *without a grounded loop under it*
reads as a toy (§1.4).

### 1.2 Play / Compete / Elo menus (~17 named modes)

"Opponents for young players" (animal opponents, "Album of animals" / "Album of vehicles"
collection rewards), "Play against an engine" (the fully-optioned custom game), "Play human vs
human", "Competition with tutor" (category ladder where allowed tutor hints *diminish* as you
climb — an assistance-budget progression, the closest prior art to `design/06`'s
capability-suppression direction that any shipped product has `[V]` v7.08 summary), "Lucas-Elo",
"Tourney-Elo", "Fide-Elo", "Fics-Elo", "Lichess-Elo" (calibrated ladders vs graded
engines/virtual opponents, no takeback, persistent ratings), "Challenge 101", "The Wicker Park
Tourney", "Chess leagues", "Swiss Tournaments", "Tournaments between engines", "Singular moves",
"STS: Strategic Test Suite" (engine test suite repurposed as a human positional quiz),
"Calculate your strength" ("Jonathan Levitt test", "Four pawns test"), "Miniature of the day".

### 1.3 Count

**~46 named modes** (29 train + ~17 play/compete), before counting sublevels, blindfold
variants, or per-set configuration. This alone answers the owner's "what other novel chess
variations there be???" — the field has *dozens*, they are enumerable, and one free product ships
most of them.

### 1.4 What Lucas Chess proves about breadth vs focus

Reduce the 46 modes and they collapse onto **six verdict mechanics**: (1) *match-a-script*
(memory, notation, learn-a-game, book lines, guess-the-move), (2) *engine-cp judgement of the
learner's move* (daily test, find-best-move, resistance, calculating power), (3) *mechanical
enumeration/identity* (find-all-moves, coordinates, counts, solo-style maneuvers),
(4) *survival count* (resistance plies), (5) *timed-set correctness* (lights, circles, mate
ladders), (6) *game result vs a graded opponent* (all Elo ladders, tourneys). Everything else is
skin — maps, albums, railways, boxing-codenamed tables.

Three consequences for us:

- **Breadth of formats is not the differentiator; Lucas already has it and remains a niche
  trainer.** Its own guide calls a third of its modes dubious or frivolous. What it lacks is
  exactly what our thesis is: play-the-consequence, preserved attempts, comparison, and grounded
  (rather than raw-centipawn) verdicts. Its mechanic (2) — score every learner move in
  centipawns — is the "engine review screen" failure shape our doctrine names.
- **The economics support the campaign**: map skins, albums, diminishing-tutor ladders and
  journey modes are demonstrably solo-maintainer-cheap. The expensive thing Lucas never built is
  a verdict producer beyond raw engine numbers.
- **Two Lucas ideas are directly worth stealing** (both law-8-compatible re-cuts): the
  *diminishing-assistance competition ladder* ("Competition with tutor" — our inventory/suppressor
  axes already express it honestly), and *configurable book-move opponent policy*
  (uniform/proportional/top — our explorer + Maia rungs are the measured version).

---

## 2. The commercial field's formats

### 2.1 chess.com (7 formats)

- **Puzzle Rush** — Survival (no clock, 3 strikes), 3-minute, 5-minute; difficulty escalates,
  three wrong ends the run `[P]`
  (<https://support.chess.com/en/articles/8608686-how-do-you-work-on-chess-com>,
  <https://www.chess.com/news/view/feature-new-puzzle-rush-formats-released>,
  <https://www.chess.com/puzzles/rush>). Verdict per item: puzzle-solution correctness; run
  verdict: **an unbounded count** — see §5.2.
- **Puzzle Battle** — 3-minute Puzzle Rush head-to-head vs another player `[P]` (same sources).
  Adds a cross-learner surface: refused for us by `rfc/learner-rating.md` R10 (no leaderboards /
  cross-learner comparison, `league-as-return-loop.md` `[V]`).
- **Solo Chess** — all pieces one color; every move must capture; each piece may capture at most
  twice; king must survive last `[P]`
  (<https://support.chess.com/article/289-what-is-solo-chess-how-do-i-play>,
  <https://www.chess.com/solo-chess>). Note honestly: this is a *rule-altered puzzle minigame*,
  not engagement with standard chess — it sits in the board-vision family (§2.5) on the far side
  of the §4.5 line.
- **Guess the Move / solitaire content** — covered in `titled-player-training.md` §2.5 `[P]`
  (Purdy tradition; productized by chess.com lessons, ChessTempo's Guess the Move, and
  chessgames.com with per-move points). Not re-derived here; it is [[D860]]/[[D869]].
- **Vote Chess** — a team votes on each move of a correspondence game; candidate-move discussion
  phase, then voting `[P]`
  (<https://support.chess.com/en/articles/8614177-how-do-i-play-vote-chess>). The productized
  descendant of the classical **consultation game** (Botvinnik-school peer analysis with a
  result attached).
- **Hand & Brain** — pairs format: the "brain" names a piece type, the "hand" chooses which such
  piece moves and where; no dedicated chess.com mode, played via events/analysis-board
  workarounds `[P]` (<https://www.chess.com/terms/hand-and-brain-chess>,
  <https://en.wikipedia.org/wiki/Hand_and_brain>).
- **Odds in matchmaking + odds bots** — chess.com's automatic material-odds balancing for rating
  gaps, and the odds-bot renaissance generally, incl. Leela's dedicated odds bots on Lichess with
  a piece-odds ladder and time-control-gated leaderboard `[P]`
  (<https://www.chess.com/terms/odds-chess>,
  <https://lczero.org/blog/2024/12/the-leela-piece-odds-challenge-what-does-it-take-you-to-win-against-leela/>).
  Feeds §4.

### 2.2 Lichess (6 format families)

- **Puzzle Storm** — 3 minutes, combo time bonuses, themes repeat; trains speed/recognition.
  **Puzzle Racer** — Storm as a live multiplayer race. **Puzzle Streak** — untimed, difficulty
  ramps, *one* miss ends the run; trains depth/consistency `[P]`
  (<https://lichess.org/forum/general-chess-discussion/do-you-perform-different-in-puzzle-storm-race-or-streak->,
  <https://deepwiki.com/lichess-org/mobile/3.3-puzzle-storm-and-streak>). Same law-8 ground as
  Rush (puzzle correctness); same unbounded-count seal (§5.2); Streak's one-miss-death is the
  purest streak-pressure format in the field — league-dossier caution applies (§5.3).
- **Practice drills** — 32 named drills in 5 sections `[V]` (fetched
  <https://lichess.org/practice>): Checkmates (7: "Piece Checkmates I/II", "Checkmate Patterns
  I–IV", "Knight & Bishop Mate"), Fundamental Tactics (8: Pin, Skewer, Fork, Discovered Attacks,
  Double Check, Overloaded Pieces, Zwischenzug, X-Ray), Advanced Tactics (10: Zugzwang,
  Interference, Greek Gift, Deflection, Attraction, Underpromotion, Desperado, Counter Check,
  Undermining, Clearance), Pawn Endgames (3), Rook Endgames (4). Format: play the position out
  against the machine until the named goal — i.e. *our Outcome Drill with an authored concept
  label*, the closest incumbent format to the shipped product.
- **Coordinates trainer** (<https://lichess.org/training/coordinate>) `[P]` — the same mechanical
  family as Lucas's "Coordinates".
- Puzzle themes/dashboard, daily puzzle — standard corpus-drill surface `[M]`.

### 2.3 Kids' products: ChessKid Adventure

Quest/boss packaging over lessons+puzzles: six quests, 200+ mini-challenges, animated characters,
"beats 'bosses' to advance" `[P]`
(<https://support.chesskid.com/en/articles/8887467-what-is-the-chesskid-adventure-app>,
<https://www.chess.com/news/view/new-chesskid-adventure-app-released>). Direct commercial
precedent for the campaign's map/encounter/boss skin — over *ungrounded* content (lessons and
puzzles), which is precisely the half we already refuse. Its curriculum also ships **Pawn Wars**
as lesson 1 (first to promote wins; level 2 adds kings) `[P]` (ChessKid curriculum lesson PDF via
scribd; <https://www.chesskid.com/learn/articles/complete-guide-to-chesskid>) — see §4.1.

### 2.4 Aimchess, Magnus Trainer, Listudy, Chess Hero

- **Aimchess** — imports your lichess/chess.com games, scores six aspects (openings, advantage
  capitalization, time management, resourcefulness, endgames, blunder prevention), recommends
  drills `[P]` (<https://www.chessable.com/blog/top-chess-apps-for-beginners/>; formulas
  undisclosed per `player-analysis-and-skills.md` `[V]`). Its *drill formats* are ordinary; the
  interesting part (weakness-driven selection) is the **v1-identity adjacency** — personal
  history selecting drills is permitted later, mandatory import as entry is rejected doctrine.
- **Magnus Trainer** — 250+ lessons wrapped in arcade minigames: learn squares, fastest route
  between squares, call out illegal moves; dozens of levels per game `[P]`
  (<https://apps.apple.com/us/app/-/id1097863089>). The board-vision arcade family: mechanical
  verdicts, real pedagogy at the beginner floor, zero use of our evidence stack.
- **Listudy** (free) — opening **Studies** with spaced repetition, Tactics, **Blind Tactics**
  ("solve tactics while only seeing the board from 2 moves ago" — a productized stepping-stone
  visualization drill), Pieceless Tactics, Endgames vs Stockfish, Daily Puzzle `[V]` (fetched
  <https://listudy.org/en>).
- **Chess Hero** (free desktop) — random positions from *your own* PGNs; guess the move; penalty
  = engine cp difference between your move and the engine's best `[P]`
  (<http://innokuo.altervista.org/chesshero.html>,
  <https://www.chess.com/blog/snits/guess-the-move-training-with-chess-hero>). Guess-the-move with
  an engine reference — the law-8-dirty version of what our stored
  `predictedMass`/`predictedRank` do cleanly against the *human* distribution ([[D860]] `[V]`).

### 2.5 Count and shape of the commercial field

~20 distinct formats across the surveyed products, and they cluster: **corpus-drill under
pressure** (Rush/Storm/Racer/Streak/Battle — 5 skins on one mechanic), **guess-the-move** (4
products), **play-out-to-goal drills** (Lichess practice — our own family), **board-vision
arcade** (Magnus Trainer, Solo Chess, coordinates — mechanical verdicts), **quest skins**
(ChessKid), **import-and-diagnose** (Aimchess). Nothing in the commercial field grades *avoidance*,
*threat detection as its own act*, or *prediction against a banded human distribution* — the three
things our evidence uniquely grounds (§6).

---

## 3. The teaching tradition's formats not already in the transfer map

`titled-player-training.md` §4 already maps sparring, guess-the-move, write-before-checking,
tempo methods, pass-marks, blindfold. Missing from it, added here:

- **Steps Method (Stappenmethode) pre-chess and mini-game practice.** The Dutch national method
  (Brunia/van Wijgerden; the KNSB's teaching standard). Step 1 is 15 lessons from "Board and
  pieces" to notation `[V]` (fetched <https://www.stappenmethode.nl/en/step1.php>); for ages ~5–9
  the **Stepping Stones** workbooks precede/accompany it, and the trainer manuals prescribe
  **game fragments and mini-games** — playing with reduced material before full games — as the
  practice form `[P]` (<https://www.chess-steps.com/books-stepping-stones.php>, trainer-manual
  PDFs at stappenmethode.nl). The canonical ladder of these mini-games in school practice: pawn
  wars (first promotion wins), pawn wars + kings, rook/queen capture games, capture-everything
  games, then full chess `[P]` (widely documented in club curricula, e.g.
  <https://www.chessworld.net/chessclubs/openingguide/fun-chess-activities-for-kids.asp>; ChessKid
  lesson 1 §2.3). Pedagogically load-bearing detail: mate is *deliberately postponed* — "learning
  how to mate is postponed as long as possible" `[V]` (step1 page) — the reductions are not
  dumbed-down chess but sequenced sub-skill isolation. Feeds §4.1–4.2.
- **Consultation games** — several players, one side, argued moves; the Botvinnik-school critique
  loop with a result attached. Modern productization is Vote Chess (§2.1) `[P]`. Human-social:
  a surface for `design/03`'s social breadth, not an encounter.
- **Clock-odds and material-odds play** — the classical handicap ladder ran *pawn-and-move,
  pawn-and-two, knight, rook, rook-and-move, two rooks, queen* as an explicit skill staircase in
  19th-century club culture `[P]` (<https://www.chessvariants.com/other.dir/oddschess.html>,
  <https://www.chess.com/terms/odds-chess>); revived today by odds bots (§2.1) and clock odds in
  banter/exhibition formats. Feeds §4.2 directly.
- **Tandem/relay formats** (teams alternate moves without conferring; hand-and-brain is the
  productized member, §2.1) `[P]`. Trains role-constrained decision-making; mostly social, but
  see the solo re-cut in §6 (#7).

---

## 4. Didactic reductions and material progression (owner mid-flight ask)

### 4.1 Reduced-material starts on the STANDARD board — fully inside the evidence plane

State it plainly: **a pawn war, a K+P army game, a rook-capture race, or any Steps-style
mini-game on the 8×8 board is a legal chess position under standard rules.** Consequences, each
checkable against what already ships:

- **FEN/runtime**: any such start is an ordinary from-position run — the exact object
  `POST /rated-games` and every pack already consume (`design/06` §5 `[V]`). Nothing new.
- **Collectors**: the 2c/2d collector waves (`rfc/tactical-collectors.md`,
  `rfc/breadth-collectors.md`) operate on legal positions and moves; SEE, legal-exchange,
  threat@1, mobility and king-state facts are all defined on reduced-material positions
  unchanged `[M]` (by construction of the contracts; no collector declares a material floor).
- **Tablebase**: at ≤7 units the *strongest* instrument we own turns on — a K+3P vs K+3P pawn
  war is tablebase-decidable, giving mini-games a *perfect* ground that full chess never has
  (`PERFECT_TABLEBASE_OUT_OF_RANGE`'s seven-piece ceiling, cited in `design/06` §5 `[V]`).
- **Engine/Maia**: Stockfish is exact; **Maia is the one instrument to flag** — reduced-material
  *starts* are rare in its training distribution, and `maia-endgame-fidelity.md` is the standing
  evidence that Maia's behaviour off the common-game manifold must be *measured, not assumed*
  `[V]` (that dossier's question). A mini-game encounter should declare its opponent honestly:
  `perfect_tablebase` when in range, engine or authored policy otherwise; `human_common` only
  where band fidelity has been measured.
- **Verdicts**: "first promotion wins" / "capture everything" / "survive N plies" are authored
  objectives — successConditions over events we already emit (promotion, capture identity
  [[D732]], terminal outcomes). Shape 1 seals them (§5.1). Pedigree: Steps/ChessKid (§3, §2.3).

This family is the **cheapest new encounter content in the whole catalogue**: zero new
primitives, the best oracle coverage of any phase, and a validated pedagogy behind it.

### 4.2 Progressive armies as campaign progression — the transform of "obtain pieces"

The owner's *"obtain fairy pieces"* instinct, transformed to stay on the evidence plane: **the
learner earns ordinary piece types, and the army grows toward full chess across acts.** Early
encounters are Steps-sized mini-games (pawns, then +rook, then +minor pieces…); demonstrated
skill unlocks the next piece type — [[D297]]'s knowledge-as-key device (*"do not grant any
abilities, but open up a new area"*) applied to material rather than lore, credited from detected
evidence per [[D549]]'s constraint, never purchased (ADR-0007, `design/06` §3 law 2).

Precedent is unusually strong for a "novel" mechanic:

- The **classical odds ladder** *was* a material progression — a player literally graduated from
  receiving queen odds to rook odds to pawn-and-move as they improved `[P]` (§3). Run backwards
  (the learner's own army grows rather than the opponent's shrinking), it is the same staircase.
- The **Steps mini-game ladder** is the pedagogical version (§3) `[P]`.
- **ChessKid Adventure** proves the quest packaging works commercially for exactly this age/skill
  band `[P]` (§2.3).
- Odds bots prove modern appetite for material asymmetry as a challenge format `[P]` (§2.1).

Both directions belong: *your army grows* (early acts, didactic), and *the opponent gives you
odds that shrink* (a difficulty dial with a 200-year pedigree, and — unlike a weakened engine —
an *honest* one: the position is asymmetric, the opponent is not lobotomized; the rejected
weakened-Stockfish doctrine is untouched `[M]` reasoning).

### 4.3 Smaller boards — real pedagogy, priced honestly

The Steps tradition and many school programs use small-board exercises; 5×5/6×6 minichess
variants have long teaching use `[P]` (<https://en.wikipedia.org/wiki/Minichess>). The honest
price in our stack: **everything assumes 8×8** — FEN parsing via chessops, board rendering,
square identity in every collector operand, the explorer, Maia, Syzygy, SEE. A 5×5 board is not a
reduced position but a different game object; every instrument goes dark and the entire collector
contract vocabulary (files a–h, ranks 1–8, zone definitions like [[D745]]'s space convention)
becomes undefined. Verdict: the *pedagogical intent* (fewer pieces, shorter horizons, isolated
sub-skills) is fully captured by §4.1's reduced-material 8×8 starts at ~zero cost; the smaller
*board* buys almost nothing further and costs the plane. Recommend: not pursued; the 8×8
mini-game family is the substitute.

### 4.4 Fairy pieces — evidence-dark, and their one honest place

The evidence-plane facts, stated as [[D327]]'s tier language: **no Maia** (trained on standard
chess only), **no explorer** (no human games), **no tablebase**, **collectors' movement model
wrong** (movegen, SEE, threat@1, mobility all assume the standard piece set), **no outcome
corpus**. The lone instrument is **Fairy-Stockfish**, a mature open-source engine for fairy
pieces and variants `[P]` (<https://github.com/fairy-stockfish/Fairy-Stockfish>) — an eval oracle
with no human model behind it, i.e. exactly the "engine number with nothing human attached"
situation our doctrine treats as a non-ground for training claims.

Their honest place is [[D297]]'s **setup-selection** device — Really Bad Chess's scrambled armies
buy variety through setup, not through an unlock economy `[V]` (D297 row). A fairy encounter can
exist as **bounded fun, clearly marked play**: never rated, never credited to skills, no
training claims attached, terminal outcome by Fairy-Stockfish adjudication only. Whether fairy
play *transfers* to chess skill is an open empirical question this dossier found no serious
evidence on either way `[M]`; nothing in our instruments could measure it today.

### 4.5 The balance rule, proposed (owner-tier — named, not written)

The owner's clause — *"we don't need to forget we're learning chess here… there's a balance"* —
made technical, as a candidate campaign law for `design/06` §3:

> **The campaign may bend material and position freely — those stay grounded chess; bending the
> board or the piece set exits the evidence plane, and anything evidence-dark is marked play,
> never training.** Concretely: an encounter whose position is legal standard chess keeps every
> verdict shape and may rate, credit and unlock; an encounter that alters board geometry or the
> piece set may seal nothing, credit nothing and unlock nothing but itself, and its node is
> labelled play.

This is one sentence of design-tier law and is **the owner's to accept, amend or veto**; it is
recorded here as research output only, consistent with [[D327]]'s existing "a variant should
declare which rungs survive it" framing.

---

## 5. The encounter mapping

### 5.1 The verdict shapes

`design/06` §5 (amended 2026-08-22) has **two shipped producers**, and sealing is a property of
the node `[V]`:

1. **Authored objective** — pack, bounded by `plyHorizon`, sealed by an `ObjectiveState` from
   `successConditions` (stored as `sealedState`).
2. **`terminalOutcome`** — `position` session, bounded by the rules of chess (the Act II rated
   boss).
3. **Prediction-score threshold** ([[D869]], proposed, owner-ledgered) — a fixed imported game,
   bounded by the game's own length, sealed by prediction score ≥ authored threshold.

**Shape 4 — flagged, not designed (owner-tier):** a **score-threshold over an unbounded run** —
"how far/how many before the stop condition" (Resistance plies, Rush/Storm/Streak counts,
avoid-the-blunder distance). It differs from shape 3 precisely in being *unbounded*: no fixed
game or horizon caps it; the run ends only when the failure condition fires, and the verdict is a
threshold over the count. Every survival-family format either (a) accepts an authored bound
("survive **N** plies") and collapses into **shape 1**, or (b) keeps the open end and needs
shape 4. Adding shape 4 is a new verdict producer — a `design/06` §5 table row, owner's decision,
exactly as the [[D869]] note prescribes for shape 3. **No format in the entire catalogue needs a
fifth shape.**

### 5.2 The mapping table

Trains / verdict ground (law 8) / sealing shape / primitives needed / fit
(**C** campaign encounter, **S** standalone mode, **–** neither).

| # | Format (source) | Trains | Grounded verdict (law 8) | Shape | Primitives | Fit |
|---|---|---|---|---|---|---|
| 1 | Guess-the-move on imported games (Purdy; ChessTempo; chessgames; Lucas "Play like a GM"; Chess Hero) | real-distribution move selection | prediction vs Maia distribution + played move ([[D860]]: `predictedMass`/`predictedRank` already stored) | **3** | shipped, dead — lift pack gate | **C + S** (the [[D869]] double) |
| 2 | Opening-book line training (Lucas; Listudy studies; Chessable) | repertoire recall + past-book | line membership (`on_line`/`classified_deviation`) | 1 | shipped (Line Drill) | S (already the product) |
| 3 | Play-out-to-goal drills (Lichess practice; Dvoretsky play-outs) | conversion/defence execution | objective verdict vs stated goal | 1 | shipped (Outcome/Plan Drill) | C + S (already the product) |
| 4 | Resistance/survival vs engine (Lucas Resistance Test) | not-losing under pressure | survival plies before eval-deficit stop (engine-measured stop condition) | **4** (or authored-bound → 1) | engine eval stream (ships); stop rule new | C (act-escalation node) |
| 5 | Puzzle Rush/Storm family (chess.com, Lichess) | speed pattern recognition | per-item solution correctness (CC0 corpus); run = unbounded count | **4** | puzzle corpus re-cut as play-the-consequence (thesis constraint) | S, with §5.3 caution |
| 6 | Puzzle Streak (Lichess) | deep consistency | as #5, one-miss stop | **4** | as #5 | S; strongest streak-pressure caution |
| 7 | Puzzle Battle / Racer (head-to-head) | as #5 + racing | as #5 | 4 | cross-learner surface | **–** refused (R10 no cross-learner comparison `[V]` league dossier) |
| 8 | Tempo cycles / endgame blitz / The Circles (Woodpecker; Dvoretsky; Lucas) | automaticity under shrinking clock | `TempoVerdict` vs authored budget ([[D862]]) | 1 | shipped, dead; scheduler needs shrinking direction | **C + S** |
| 9 | Pass-mark chapters (Yusupov; [[D861]]) | enforced mastery gating | authored points over existing verdicts + threshold | 1 | `attempt_concepts` consumer | S (progression layer) |
| 10 | Daily test (Lucas; daily puzzle everywhere) | calibration ritual | *as shipped elsewhere*: engine-cp score of learner moves — the dashboard anti-pattern; our re-cut: a daily authored-objective set | 1 | selection policy only | S (return-loop skin) |
| 11 | Memory/board-vision arcade (Lucas basics; Magnus Trainer; Solo Chess; coordinates) | board vision, square fluency | mechanical (exact match / enumeration / timing) | 1 (trivially) | none of our evidence stack; new minigame UI | – (beginner floor; not our wedge; Solo Chess additionally rule-altered) |
| 12 | Visualization drills (Lucas calculating power, Mate 1½, captures-and-threats; Listudy blind tactics) | calculation without moving | line match vs engine/authored solutions | 1 | board display modes — parked per titled dossier §2.4 ([[D717]] board protection) | – (own design question) |
| 13 | Write-before-checking (`stated_reasoning`) | evaluation calibration | authored `ReasoningKeyPoint` grounds | 1 | shipped, 1 fixture; content debt | C (briefing interactions) + S |
| 14 | Guess-the-move + plan commitment (Purdy full protocol) | plan selection | `intent_capture` + prediction | 3 | shipped | C + S (rider on #1) |
| 15 | Pawn wars / Steps mini-games (§4.1) | piece-skill isolation, promotion racing | authored objective (first promotion / capture-all / survive), tablebase-exact ≤7 units | 1 | none new | **C** (Act 0 / early acts) + S (kids) |
| 16 | Progressive armies (§4.2) | staged full-chess competence | per-encounter as #15; unlock = detected-evidence credit ([[D549]]) | 1 per node | knowledge-as-key economy (campaign build) | **C** (the progression spine) |
| 17 | Material/clock odds vs banded opponent (§2.1, §3) | winning won games, asymmetric technique | `terminalOutcome` | 2 | odds start FENs; Maia off-distribution caution (§4.1) | C (difficulty dial) + S |
| 18 | Consultation / Vote Chess (§3) | argued decision-making | game result; the *learning* is social critique — ungradeable by us (law 8) | 2 (result only) | multiplayer surface | S-social (`design/03` breadth), not an encounter |
| 19 | Hand & Brain, human pairs (§2.1) | role-constrained decisions | game result | 2 | live pairs surface | S-social |
| 20 | Brain with a banded hand (solo H&B re-cut, §6 #7) | piece-level planning | `terminalOutcome`; move = Maia distribution *restricted to the named piece type* (mechanical restriction of a measured model) | 2 | Maia rungs ship; restricted sampling new; collides with rated-game contract → unrated node | C (novelty encounter) |
| 21 | Diminishing-assistance ladder (Lucas "Competition with tutor") | independence from hints | any underlying shape; the *ladder* is inventory policy | n/a (modifier) | `design/06` suppressor/loadout — already the design | C (already ours) |
| 22 | Map/journey skins (Lucas long-term; ChessKid quests) | retention framing | none — skins seal nothing | n/a (skin) | campaign map (planned) | C (the campaign itself) |
| 23 | Import-and-diagnose drill selection (Aimchess) | weakness targeting | selection policy, not a verdict | n/a (selector) | `learner_position_stats` ([[D865]]); v1-adjacency guard | S (later; never entry-mandatory) |
| 24 | Avoid-the-blunder runs (§6 #1) | blunder avoidance as a skill | avoidance rate with shown denominator ([[D745]] ruling; `moved_piece_en_prise` lifts measured [[D733]]) | 1 (bounded) or 4 (open) | 2c collectors (implementing) | **C + S** |
| 25 | Threat-radar hunt (§6 #2) | threat detection as its own act | `threat@1` enumeration with declared convention/abstentions ([[D741]]/[[D751]]) | 1 | 2c collectors | C + S |
| 26 | Hold-under-shrinking-clock (§6 #3) | defensive technique under time | objective verdict + `TempoVerdict` | 1 | shipped + [[D862]] direction | C |
| 27 | Play-the-structure (§6 #4) | pattern-goal play | shape-library arrangement reached (16 attested entries; `shapeRecommendations` detector `[V]` design/06 §1) | 1 | shipped lenses | C |
| 28 | Band-split solitaire (§6 #5) | error-model self-knowledge | per-band Maia policy mass comparison (measured model outputs) | 3 (variant) | Maia rungs ship; multi-band query new | S + C |
| 29 | Defender-chain hunt (§6 #6) | seeing consequences coming | exact observed three-ply sequences (`identity-retaining-three-edge-consequences.md`: 29+13 windows `[V]`) | 1 | 2c/2d + census→fixtures | C |
| 30 | Fairy-piece skirmish (§4.4) | (unmeasurable) | Fairy-Stockfish adjudication only — evidence-dark | none — **sealed as play** per §4.5 rule | Fairy-Stockfish sidecar; runtime FEN work ([[D327]] tier 2+) | – until §4.5 ruled; then C-play-node at most |

**Accounting: 21 rows seal under shapes 1–3 as they stand; 4 rows (4, 5, 6, 24-open) want the
one flagged shape 4; 5 rows (7, 11, 12, 18/19 as encounters, 30) should not be encounters at
all.** No format demands a fifth shape.

### 5.3 Standing cautions carried in

- **ADR-0007**: every format above gates content by play, never by payment — the progressive-army
  economy (row 16) must stay knowledge-as-key, not purchasable.
- **Streak pressure** (rows 5, 6, 8): `rfc/learner-rating.md`'s shipped copy — milestones
  *"never add a skill percentage, score, streak, rating, ranking, or cross-learner comparison"*
  (`docs/return-and-progression.md:48-49`, cited via `league-as-return-loop.md` `[V]`) — means
  the Rush/Streak family may exist only with per-run, learner-private scores, no cross-learner
  tables, and no daily-streak retention lever. Puzzle Battle/Racer (row 7) are refused outright
  by R10.
- **The thesis constraint on puzzle corpora**: the CC0 puzzle corpus is usable but re-cut as
  play-the-consequence, never find-the-tactic (rejected list, `design/00-thesis.md` §§70,93-94).
  A "Rush" over consequence-episodes is a different, slower animal than 3-minute tactics — the
  honest version may simply be #8 (tempo cycles), which is why rows 5/6 rank low in §8.

---

## 6. The novel set — formats no product ships that our evidence uniquely enables

[[D870]] seeds four; three more fall out of the evidence base. Ranked by novelty ×
buildability-on-existing-primitives:

1. **Avoid-the-blunder runs** (D870 seed; catalogue row 24). Survive N plies creating no loose
   piece — the [[D745]] negative reading *as the objective itself*, scored by the avoidance rate
   with the denominator always shown ("N% of your legal moves would have hung something; you
   avoided all of them"). Ground is already measured: `moved_piece_en_prise` lift 0.36×
   authored / 0.57× imported with CIs below 1 ([[D733]] `[V]`) — the signal *is* avoidance.
   Novelty: no surveyed product scores avoidance with a denominator (Aimchess's "blunder
   prevention" is a formula-undisclosed aspect score `[V]` player-analysis dossier). Buildability:
   high the moment 2c lands. **The single best novel format.**
2. **Band-split solitaire** (new; row 28). Solitaire chess with the question inverted: not "guess
   the move" but *"which move does each crowd play?"* — predict the 1900-band's move while
   naming the 1100-band trap move, grounded in per-band Maia policy mass (rungs ship in the
   engine workers; band range `[1000,2400]` ruled `[V]` design/06 §2b). Nobody else has multiple
   banded human models wired to compare. Trains the owner's 1000→2000 journey self-knowledge
   (`coaching-versus-cheating-and-the-band-curve.md`). Buildability: high (multi-rung query is
   the only new part). Novelty: unique to us by construction.
3. **Threat-radar hunt** (D870 seed; row 25). Find the one real threat among quiet moves,
   grounded in `threat@1` with its declared pass convention and abstentions ([[D741]]/[[D751]]
   `[V]`). A detection act graded mechanically — not a puzzle (no "best move"), a perception
   drill on real positions. Buildability: 2c-gated; novelty: high (Lucas's
   "Captures and threats" is the visualization-burdened ancestor, ungrounded).
4. **Hold-under-shrinking-clock** (D870 seed; row 26). [[D862]]'s tempo cycles as an encounter:
   the same hold objective re-served across acts with a tightening authored budget, graded by the
   zero-consumer `TempoVerdict`. Buildability: both halves ship pointed the wrong way (`[V]`
   titled dossier §5.3); novelty: medium (Woodpecker pedigree, but no product runs it *on
   defensive holds* under an honest verdict).
5. **Play-the-structure** (D870 seed; row 27). A shape-library arrangement as the win condition —
   "reach a good Carlsbad minority-attack structure", sealed when the attested shape entry
   matches. Grounded in the 16 attested shape entries and the shipped `shapeRecommendations`
   rung-0 detector (`[V]` design/06 §1). Buildability: high; novelty: medium-high (Lichess
   practice names concepts but seals on material/mate, never on structure reached).
6. **Defender-chain hunt** (new; row 29). "One of your pieces just lost its defender — which,
   and what lands in two plies?" Grounded in *exact observed sequences*, not named tactics: the
   identity-retaining census found 29 defender-loss→capture and 13 defender-displacement windows
   in 6,775 three-ply windows, zero in authored content (`[V]`
   `identity-retaining-three-edge-consequences.md`) — so this format is also the missing
   pack-fixture consumer that dossier asked for. Buildability: medium (census→fixture pipeline);
   novelty: high.
7. **Brain with a banded hand** (new; row 20). Solo hand-and-brain: the learner is the brain and
   names a piece type; the "hand" is Maia's distribution *restricted to that piece type*. Trains
   piece-level planning; every move is still a measured human-model move, restriction is
   mechanical, so no chess truth is manufactured. Collides with the rated-game contract (a
   restricted-production game is not a clean `terminalOutcome` rating event), so it lives as an
   unrated novelty node. Buildability: medium; novelty: very high — no product ships a solo
   hand-and-brain at all `[M]` (none found in this pass).
8. **King-zone watch** (extension of the seed set). The decomposed king-state operands as a
   radar objective — but the dossier's own verdict limits it: the discriminating operands
   (escape reduction, slider check, zone attackers) only separate from background in
   middle/later play, and none authorizes "king unsafe" language (`[V]`
   `decomposed-king-state.md`). Buildable as a *late-act* radar variant of #3 only; ranked last
   accordingly.

---

## 7. Best fits

**Three best campaign encounters** (all seal under existing shapes — no owner decision blocks
them beyond content):

1. **Avoid-the-blunder node** (§6 #1) — authored-bound form, shape 1; the campaign's first
   genuinely novel encounter class, and the learner-facing form of the [[D745]] ruling.
2. **Progressive-army arc with Steps mini-games** (§4.1–4.2, rows 15–16) — shape 1 per node,
   tablebase-exact where it matters, the pedagogically validated answer to the owner's "start
   with only pawns" that never leaves the evidence plane; gives Act 0/early acts a spine and
   [[D297]]'s knowledge-as-key its material to unlock.
3. **Hold-under-shrinking-clock** (§6 #4) — act escalation in *tempo* rather than difficulty,
   reusing the shipped `TempoVerdict`; pairs naturally with the Act III unbeatable-perfection
   climax (hold vs `perfect_tablebase` under a tightening clock).

**Three best standalone modes:**

1. **Imported-game solitaire** ([[D860]]/[[D869]], row 1) — the mechanism ships dead, the corpus
   (any PGN) is free, the score is law-8-clean by construction; also the return-loop ritual the
   daily-test tradition proves people keep (§2, Lucas "Your daily test").
2. **Tempo cycles** ([[D862]], row 8) — the Woodpecker/endgame-blitz product, pattern-sized
   material only (de la Maza restriction authored into eligibility).
3. **Band-split solitaire** (§6 #2, row 28) — the uniquely-ours format with a standalone daily
   shape; also the most shareable ("the 1100 crowd falls for this — do you?") without any
   cross-learner comparison, since the population compared is Maia's bands, not other learners.

---

## 8. What this means for the campaign's variant family — summary answer to the owner

Yes — the campaign should have a family, and the family is nearly free. The two shipped verdict
producers plus [[D869]]'s third shape already seal 21 of 30 catalogued formats; one further
owner-tier decision (shape 4, §5.1) unlocks the whole survival family; and the four D870 seeds
plus three new formats (§6) give the campaign encounter classes **no competitor can ground**,
because they run on measured avoidance denominators, threat conventions, banded human
distributions and observed consequence sequences rather than on raw engine numbers. The field's
own evidence (Lucas Chess, §1.4) says format count is not the moat — the verdict grounding is.

---

## 9. The other axis — rule variants (parked, listed only)

Per [[D870]], not this dossier's subject; no design work here. Chess960/FRC, crazyhouse, atomic,
three-check, king-of-the-hill, horde, racing kings, antichess, bughouse, and westernized
xiangqi/shogi are **rule variants**: they change the game object, not the engagement format. They
are parked under [[D327]] (tiered instrument-degradation frame: Chess960 keeps tablebase/
structure and loses Maia; rule-changers break detectors per-variant) and [[D328]]
(xiangqi/shogi: nothing in the detector stack survives; the open question is shell coupling).
The §4.5 balance rule, if the owner adopts it, gives this axis its standing label: evidence-dark
variants are marked play, never training. Fairy pieces (§4.4) sit on this axis too — [[D327]]
tier 2+ with Fairy-Stockfish as the lone instrument.

---

## 10. Proposed ledger rows (proposed only — not written; head verified D882 after two in-flight moves, see §0)

- **D883 💡** Avoid-the-blunder runs as encounter class + standalone daily: the [[D745]]
  denominator-shown negative reading as the objective itself; authored-bound (shape 1) first;
  gated on 2c collectors. (§6 #1, row 24.)
- **D884 💡** Steps-style reduced-material mini-game encounters on the standard board (pawn wars,
  K+P armies, capture games): authored objectives, tablebase-exact ≤7 units, Maia-fidelity
  caution declared per encounter. (§4.1, row 15.)
- **D885 💡** Progressive armies as the early-campaign spine: piece types earned via detected
  evidence ([[D549]]/[[D297]] knowledge-as-key), classical odds ladder as the reverse dial;
  ADR-0007 constraint named. (§4.2, rows 16–17.)
- **D886 💡** OWNER-TIER: verdict shape 4 — score-threshold over an unbounded run (survival/
  streak family: Resistance-style plies, rush counts, open avoid-the-blunder). A new `design/06`
  §5 producer row; until ruled, all survival formats ship authored-bound under shape 1. (§5.1.)
- **D887 💡** OWNER-TIER: the material/board balance rule for the campaign — position and
  material bend freely (grounded chess); board geometry and piece set exit the evidence plane;
  evidence-dark nodes are marked play, never training, and seal/credit/unlock nothing. (§4.5.)
- **D888 💡** Band-split solitaire: multi-rung Maia policy comparison as a prediction format
  ("which band plays this?"), shape-3 variant, learner-private. (§6 #2, row 28.)
- **D889 💡** Threat-radar hunt: `threat@1`-grounded detection drills with declared convention
  and abstentions; 2c-gated. (§6 #3, row 25.)
- **D890 💡** Defender-chain hunt: census-to-fixture pipeline turning the identity-retaining
  three-ply windows into encounter material — also the missing consumer
  `identity-retaining-three-edge-consequences.md` names. (§6 #6, row 29.)
- **D891 💡** Brain with a banded hand: solo hand-and-brain vs piece-restricted Maia; unrated
  novelty node; rated-game collision noted. (§6 #7, row 20.)

---

## Sources

- Lucas Chess — official site and docs: <https://lucaschess.pythonanywhere.com/> ;
  Train guide (R 2.01c2): <https://lucaschess.pythonanywhere.com/static/pdf/english/Lucas%20Chess%202-Train.pdf> ;
  v7.08 game-mode summary: <https://lucaschess.pythonanywhere.com/static/pdf/english/Summary_of_Game_Modes.pdf> ;
  source enumeration `[V]`: <https://github.com/lukasmonk/lucaschessR2>
  (`bin/Code/Menus/MenuTrainings.py`, `bin/Code/Menus/BasicMenus.py`,
  `bin/Code/Resistance/Resistance.py`).
- chess.com — puzzles: <https://support.chess.com/en/articles/8608686-how-do-puzzles-work-on-chess-com> ;
  Puzzle Rush formats: <https://www.chess.com/news/view/feature-new-puzzle-rush-formats-released> ;
  <https://www.chess.com/puzzles/rush> ;
  Solo Chess: <https://support.chess.com/article/289-what-is-solo-chess-how-do-i-play> ,
  <https://www.chess.com/solo-chess> ;
  Vote Chess: <https://support.chess.com/en/articles/8614177-how-do-i-play-vote-chess> ;
  Hand & Brain: <https://www.chess.com/terms/hand-and-brain-chess> ;
  Odds Chess: <https://www.chess.com/terms/odds-chess>.
- Lichess — practice drills (fetched `[V]`): <https://lichess.org/practice> ;
  Storm/Racer/Streak discussion: <https://lichess.org/forum/general-chess-discussion/do-you-perform-different-in-puzzle-storm-race-or-streak-> ;
  <https://deepwiki.com/lichess-org/mobile/3.3-puzzle-storm-and-streak> ;
  coordinates: <https://lichess.org/training/coordinate>.
- Leela odds bots: <https://lczero.org/blog/2024/12/the-leela-piece-odds-challenge-what-does-it-take-you-to-win-against-leela/> ;
  <https://lczero.org/blog/2024/02/update-on-playing-with-piece-odds-against-lc0-on-lichess/>.
- Classical odds tradition: <https://www.chessvariants.com/other.dir/oddschess.html>.
- ChessKid — Adventure: <https://support.chesskid.com/en/articles/8887467-what-is-the-chesskid-adventure-app> ;
  <https://www.chess.com/news/view/new-chesskid-adventure-app-released> ;
  guide: <https://www.chesskid.com/learn/articles/complete-guide-to-chesskid>.
- Steps Method — Step 1 (fetched `[V]`): <https://www.stappenmethode.nl/en/step1.php> ;
  Stepping Stones: <https://www.chess-steps.com/books-stepping-stones.php> ;
  mini-game club practice: <https://www.chessworld.net/chessclubs/openingguide/fun-chess-activities-for-kids.asp>.
- Listudy (fetched `[V]`): <https://listudy.org/en>.
- Magnus Trainer: <https://apps.apple.com/us/app/-/id1097863089>.
- Aimchess overview: <https://www.chessable.com/blog/top-chess-apps-for-beginners/>.
- Chess Hero: <http://innokuo.altervista.org/chesshero.html> ;
  <https://www.chess.com/blog/snits/guess-the-move-training-with-chess-hero>.
- Hand and brain (rules): <https://en.wikipedia.org/wiki/Hand_and_brain>.
- Minichess: <https://en.wikipedia.org/wiki/Minichess>.
- Fairy-Stockfish: <https://github.com/fairy-stockfish/Fairy-Stockfish>.
- Repo/living sources cited inline: `design/06-campaign.md` §§1–5;
  `design/research/titled-player-training.md`; `design/research/league-as-return-loop.md`;
  `design/research/identity-retaining-three-edge-consequences.md`;
  `design/research/decomposed-king-state.md`; `design/research/maia-endgame-fidelity.md`;
  `design/research/player-analysis-and-skills.md`; `rfc/tactical-collectors.md`;
  `rfc/breadth-collectors.md`; `rfc/learner-rating.md`; ledger rows [[D297]], [[D327]],
  [[D328]], [[D549]], [[D733]], [[D741]], [[D745]], [[D751]], [[D860]]–[[D862]], [[D865]],
  [[D869]]–[[D871]].
