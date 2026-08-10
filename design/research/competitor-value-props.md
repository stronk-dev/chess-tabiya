# Competitor value props — adopt / conflict / ignore

- **Date:** 2026-08-10
- **Feeds:** Q1a (novelty/teardowns), Q2 (posture/pricing), `design/02` (product design)
- **Provenance:** desk analysis of the archive's `[P]` research
  (`archive/brief-v2/research/competitor_matrix.csv`, `02_MARKET_AND_EXISTING_SOLUTIONS.md`,
  `source_index.md` R01–R45, `forum_signal_log.md`) plus model knowledge `[M]`.
  Three product pages re-fetched this pass and marked `[V]`. No fabricated URLs: all URLs
  are reused from `source_index.md` or the matrix's Primary-source column.
- **Classification frame:** *adopt/supports* = steal or match; *conflicts* = works against
  the thesis (`design/00-thesis.md`, `design/01-training-model.md`) or the stated posture
  (free, open-source, self-hosted home server, engines potentially in-browser WASM, low
  usage, integrated all-phases, 1000→2000 improver); *not relevant* = orthogonal.

## 1. Endgame trainers

### Chess Endgame Training (free/MIT PWA)
Sharpest props `[V]` ([R10](https://github.com/supertorpe/chessendgametraining)): play vs
**Syzygy or Stockfish 16 NNUE**; **mate and draw goals for both colors**; **"what-if" mode**
(manually steer the opponent to explore lines the engine wouldn't play); **automatic
resolution of trivial positions**; per-position personal record; arbitrary FEN; MIT-licensed
Ionic/TypeScript PWA with chess.js + chessground.
**Adopt.** This is our Outcome Drill loop already existing in miniature — win/draw
objectives, tablebase resistance, triviality cutoff — and its MIT PWA stack is direct proof
the whole loop runs client-side, which supports the WASM/self-hosted posture. The
owner-reported slow/poor UX `[P]` (matrix row 2; hands-on = Q1a queue 1) marks the quality
bar to beat, not a reason to skip the pattern.

### endgametrainer.com / ChessEndings (collapsed)
Props `[P]` (matrix rows 18–19; [R26](https://endgametrainer.com/), R40): large curated
practical sets, **draw-saving objectives users explicitly asked for** (forum Signal D), and
ChessEndings' technique-lesson-then-play-out pairing. **Adopt the objective taxonomy**
(win/draw/save already in `design/01`); their puzzle-shaped, phase-isolated framing is what
we integrate past.

## 2. Sparring / human-like opponents

### Noctie (paid SaaS)
Sharpest props `[V]` ([R17](https://noctie.ai/)): human-like play with "humanlike opening
choice, mistakes and move timings"; repertoire import → realistic full games; custom
positions and endgame library without clock pressure; instant takeback + hint.
**Adopt the opponent model, conflict on the feedback model.** Human-like resistance from
any position is exactly Q5/Maia territory and the strongest proof of demand for our
opponent layer. But its **move-level color labels (Excellent→Blunder) after every move**
`[V]` are the pattern ADR-0006 rejects — the learner plays the label, not the position. Its
€8–14/mo subscription `[V]` conflicts with the free posture. Takeback-vs-persistent-branch
is Q1a queue 2.

### Chess From Position (free web)
Props `[P]` (matrix row 5; [R15](https://lichess.org/@/NishAz/blog/chess-from-position-dive-into-real-random-chess-positions/QgL93ERv)):
positions harvested from **real Lichess games**, filterable by opening/move/eval, one click
into a live Lichess AI or human game. **Adopt** the sourcing pattern for pack authoring and
"same structure, new instance" variation (`design/01` varied retry); it has no curriculum
or preserved attempts — that gap is our product.

### Maia Chess platform (free/OSS)
Props `[P]` (matrix row 22; R04, R28): Elo-conditioned human-move prediction, open training
and analysis frontends. **Adopt/supports** — it is our planned opponent substrate, not a
competitor; AGPL licensing feeds the Q2/Q6 licensing pass.

## 3. Opening trainers

### Chessable (paid courses)
Sharpest props `[P]` (matrix row 11; [R23](https://www.chess.com/blog/Chessable/train-against-bots-the-highly-requested-feature-is-here)):
**MoveTrainer spaced repetition** as the proven retention engine for lines, and the
highly-requested **"play a bot from the course position"** feature — market evidence that
learners want to continue past the card into a game, i.e. our Line Drill's "continue beyond
book". **Adopt both mechanics; conflict on the model.** Course/content lock-in and paywalled
theory conflict with free + open drill packs. Whether bot-from-position works on strategic
chapters is Q1a queue 3.

### Listudy / Chessdriller / Chessstack (free/OSS, self-hosted)
Props `[P]` (rows 6–7, 9; [R11](https://listudy.org/en/blog/learning-chess-openings), R13,
R29): honest scope — Listudy states outright it trains memorization and **cannot teach the
theory** `[P]`; Chessdriller/Chessstack prove a **self-hosted SRS over your own repertoire**
is buildable and wanted (r/selfhosted traction). **Adopt** the self-hosted repertoire-SRS
skeleton and Listudy's honesty as a positioning foil: we begin where they admit they stop.

### ChessTempo (freemium)
Props `[P]` (row 10; [R24](https://chesstempo.com/opening-training/), R25): deep drill
database, repertoire tree + SRS, custom sets, an endgame trainer. **Adopt the drill-database
discipline; conflict on grading** — its distance-to-mate / exact-move grading `[P]` (R25) is
the opposite of `design/01` outcome preservation ("preserve W/D/L rather than reproduce one
machine line"). Fragmented modes are the integration whitespace.

## 4. Workstations and infrastructure

### Lichess (free/OSS)
Props `[P]` (row 13; [R02](https://database.lichess.org/), R43): **CC0 corpus, studies,
Maia/community bots, free engine/tablebase analysis, open API, open-source board stack**
(chessground — already reused by Chess Endgame Training `[V]`). **Adopt/supports —
foundation, not competitor.** Everything we build rides on it; the counter-lesson is that
users must self-assemble curriculum and branch comparison there, which is our job.

### Lucas Chess (free desktop) — closest free integrated competitor
Props `[P]` (row 14; [R31](https://lucaschess.pythonanywhere.com/)): enormous free local
toolbox — dozens of training modes, many engines, local databases, offline. **Adopt the
posture proof, conflict on the shape.** It proves a free, local, all-phases trainer has an
audience with zero business model. But its **fragmented mode-menu UX with no unifying
protocol** `[P]` is the failure shape our episode loop exists to avoid: we ship one
rehearsal protocol, not forty modes.

### Chess.com Practice / ChessBase+Fritz (collapsed)
Props `[P]` (rows 12, 15; R21, R22, R32): broad convenient drills, custom-position bot play
with side switching, deepest manual analysis workstation. **Not relevant beyond benchmark**
— proprietary, cloud/paid/Windows, analysis-first; branches are analysis artifacts, not
tracked attempts. Multi-move redo behavior is Q1a queue 4.

## 5. AI-explanation tools

### WhyThisMove (free/MIT) — owner-flagged
Sharpest props `[V]` ([R27](https://whythismove.com/open-source)): the **AI Coach sidebar**
— "natural language explanations of positions using Claude, GPT, and Gemini via
OpenRouter" with fast/deep tiers — layered on **Stockfish 17 + Maia-2 + Lichess data**, all
MIT, "100% free — all features included"; plus a Blunder Explorer over 36B aggregated games.
**Adopt the sidebar interaction; place it at our checkpoints.** The owner explicitly wants
"the strategic idea behind a move" — the right home for it in our loop is the consequence
checkpoint and branch comparison (explain *why plan A vs plan B*, and *what the moved piece
no longer does*), never per-move during play (ADR-0006). Two cautions: `[M]` cloud LLM
routing via OpenRouter sits awkwardly with fully-self-hosted — we need an optional/local
LLM path; and `[P]` its analysis-centered frame is the "review screen" the thesis warns
about. Its MIT stack is also our closest reference implementation for Q8.

### DecodeChess (paid SaaS)
Props `[P]` (matrix row 26; https://decodechess.com/ — fetch returned 403 this pass, site
health unverified): the original "best interpretation layer" — explains threats, plans, and
piece roles for a position in prose. **Adopt the ambition, conflict on delivery**: paid,
cloud-only, and pure analysis with no active drilling — explanation *about* positions rather
than feedback *inside* rehearsal. `[M]` The 403 plus long-standing staleness suggests the
product may be moribund — a caution that explanation-only tools don't retain users.

### Aimchess (paid SaaS)
Props `[P]` (row 25; [R25→R33 range](https://aimchess.com/)): analyzes **your own games** to
find weaknesses and serves personalized exercises. **Adopt the diagnosis idea later
(pack recommendation from own games), conflict on the format** — auto-generated drill feeds
are the "auto-puzzle feed" the thesis excludes, and its subscription analytics-dashboard
frame is the wrong category (matrix's own verdict).

## 6. Coaching platforms

### ChessDojo (paid community)
Sharpest props `[P]` (row 3; [R07](https://www.chessdojo.club/learn/guides), R08): the
documented **sparring protocol** — start from moves 5–15, play until the opening character
dissolves (~25–30), analyze with your partner, only then check the engine; middlegame
positions replayed **multiple games per color**. **Adopt wholesale — this is our pedagogy
with humans doing the orchestration by hand.** The archive already treats it as the manual
version of our loop; our job is to industrialize it (instant partner, preserved branches,
objective tracking). Its paid-community model is not a conflict — the *method* is public.

### ChessMood + long tail (Chessiverse, SparringChess, Chessload, Opening Thingy, DrillChess, chessfeed.ai, GrindChess, CPT legacy)
`[P]` (rows 8, 16–17, 20, 23–24, 27–29): scattered single-prop proofs — GM-authored
conceptual courses (ChessMood), bot personality variety (Chessiverse), stats-realistic
opening deviations (SparringChess, Opening Thingy — adopt: deviations weighted by what
humans actually play), attack/defend tasks (Chessload), claimed saved-branch exploration
(chessfeed.ai — unverified, watch item), own-games grinding (GrindChess). Nothing here
changes the picture; chessfeed.ai is the only one whose claim overlaps our core branch
mechanic and it needs hands-on verification.

## Value props mapped to the 1000→2000 journey

**DESIGN-GAP:** the owner's stated target starts at ~1000, but `design/00-thesis.md`
defines the target player as **1400–2200, already past the "hang fewer pieces" stage**, and
`design/01` says the product "does not replace" tactics. The 1000–1400 leg is currently
out of scope by our own docs. Either the thesis widens (packs with blunder-stopping
prerequisites at the bottom rungs) or the 1000→1400 leg is explicitly delegated to
existing free tools (Lichess puzzles + low-Elo Maia sparring). Escalate via
`planning/exploration/log.md`.

- **1000–1400 (stop blundering):** served today by Lichess puzzle feeds `[P]`, Noctie/
  Chessiverse forgiving human-like sparring `[P]`, Aimchess weakness reports `[P]`. Our
  best native contribution: **save/resist objectives against low-Elo Maia** (blunders
  punished by consequence play-out, not by a label) and the owner's "what is the moved
  piece no longer doing" prompt as an intent-capture question `[M]`. No competitor drills
  *consequence recognition* — small whitespace even here.
- **1400–2000 (plans, timing, conversion):** this is the thesis band and the whitespace is
  widest `[P]` (arch/02 conclusion): ChessDojo's protocol (manual), Chessable's
  bot-from-position (no branches), Noctie sparring (no curriculum), Chess Endgame Training
  (endgame only, weak UX), ChessTempo (fragmented). **Nobody combines played-through
  segments + preserved branch comparison + phase transitions** — forum Signals A/B/C/E all
  point at this band.
- **Cross-cutting:** WhyThisMove-style explanation serves both legs if checkpoint-gated;
  spaced repetition (Chessable/Listudy) schedules the whole journey's reps.

## Synthesis — top value props to adopt/match

| # | Value prop | Proven by | Feeds |
|---|---|---|---|
| 1 | Endgame outcome loop: win/draw goals, tablebase/engine resistance, auto-trivial cutoff, what-if | Chess Endgame Training `[V]` | Q1a, `design/01` Outcome Drill |
| 2 | Checkpoint-gated AI explanation of the *idea* behind a move/plan | WhyThisMove `[V]` | Q8, `design/02` |
| 3 | Sparring protocol: play 5–15→25–30, analyze after, repeat both colors | ChessDojo `[P]` R07/R08 | `design/01`, Q7 packs |
| 4 | Elo-conditioned human-like resistance from any position | Noctie `[V]`, Maia `[P]` R04 | Q5, H5 |
| 5 | Continue-past-book: bot game from the course/line endpoint | Chessable `[P]` R23; SparringChess | Q1a, Line Drill |
| 6 | Spaced repetition over drill units (episodes, not just cards) | Chessable/Listudy/Chessdriller `[P]` | `design/02` scheduling |
| 7 | Client-side engine stack (WASM PWA) = free + self-hosted is feasible | Chess Endgame Training `[V]`; Lichess `[P]` | Q2, arch |
| 8 | Real-game position sourcing with concept/eval filters | Chess From Position `[P]` R15; Signal E R16 | Q6, Q7 |
| 9 | Human-weighted opening deviations (corpus stats, not engine choice) | Opening Thingy/SparringChess `[P]` | Line Drill realism |
| 10 | Own-games weakness diagnosis → pack recommendation (later) | Aimchess `[P]` | `design/02` backlog |

## Conflicts with our thesis or posture

- **Move-level color labels during play** (Noctie `[V]`, Chess.com review `[P]`): trains
  label-watching; ADR-0006 withholds feedback to checkpoints. Adopt the *information*,
  reject the *timing*.
- **Engine-review dashboard as the center** (WhyThisMove analysis frame, DecodeChess,
  ChessBase): the thesis kill-quote — "the product dies if it becomes a Stockfish review
  screen with a rewind button."
- **Exact-move/DTM grading** (ChessTempo `[P]` R25): opposes outcome preservation grading.
- **Subscription content lock-in** (Chessable, ChessMood, Noctie, Aimchess): conflicts with
  free/open packs; also our packs must be forkable, not licensed courses.
- **Cloud-only delivery / cloud LLM dependency** (all paid SaaS; WhyThisMove's OpenRouter
  path `[V]`): self-hosted posture needs local-first defaults with optional cloud LLM.
- **Mode-menu sprawl** (Lucas Chess `[P]`): free+local is necessary but not sufficient —
  without one protocol it decays into a toolbox.

## Open verification items (stay [P] until Q1a hands-on)

1. Chess Endgame Training: actual latency/UX failure modes; does branch-continue preserve
   attempts? (queue 1, K9)
2. Noctie: is takeback a persisted branch or an eraser? exact feedback timing. (queue 2)
3. Chessable: does bot-from-position work on strategic/middlegame chapters or only sharp
   theory? (queue 3)
4. Chess.com Practice: multi-move redo + color switching ergonomics. (queue 4)
5. chessfeed.ai: claimed saved-branch exploration and checkpoint rewind — closest claimed
   overlap with our core mechanic; depth unknown. (matrix row 27)
6. DecodeChess: alive or dead? (403 on this pass; classification above assumes archive
   description.)
7. Aimchess/GrindChess current feature state vs matrix rows 25/28.
8. Lucas Chess: which of our four modes it can already approximate locally, and how badly
   the orchestration hurts.
