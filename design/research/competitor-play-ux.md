# Competitor play-UX — screen anatomy, pattern language, and where our screen and the canvas draft sit

- Date: 2026-08-22
- Feeds: **D717** (Phase 4 composition rebuild + Phase 5 presets,
  `planning/evidence-foundation-ux/plan.md`), **D841** (max-load composition), **D839/D840**
  (theming + animation), D718 (layout trace), `phase1-gap-matrix.md` §4 (leak list).
  Owner ask: *"Do a UX comparison with competitors — how do they present their features and play?"*
- Method: desk, current pass. Lichess grounded in **primary source code** (lila SCSS grid +
  pref modules, raw.githubusercontent fetches) and live page fetches; chess.com from its
  fetched support center; the rest from product pages, docs, app stores and reviews via
  three parallel research passes. Browser driving was unavailable this session (extension
  not connected), so no product was hands-on-driven: the strongest label here is
  [V]-fetched-primary-source, not [V]-hands-on. Labels per `design/research/README.md`.
- **Boundary with `assistance-surface-taxonomy.md`** (concurrent pass): that dossier owns
  *what assistance affordances exist* (the abstraction space, its axes, its holes). This one
  owns **presentation**: where products put things, in what order they reveal them, and how
  dense the screen is at rest. Where an affordance appears below, it is cited for its
  *placement*, not catalogued.
- Complements (does not repeat): `teardown-chesscom-desk.md` / `teardown-noctie-desk.md` /
  `chessable-movetrainer.md` / `quickpass-wintrChess-encroissant-chessmonitor.md`
  (mechanics, love/hate), `review-map-and-reentry.md` (post-game re-entry semantics),
  `evidence-presentation.md` (module/preset contract).

## 1. Per-product screen anatomy

Summary table; per-product notes follow. "Above the board" means inside the board's own
column, consuming board-competing vertical space — the owner's rejected axis (D717).

| Product | Board placement (desktop) | Beside the board | Above the board | Feedback timing & channel | At-rest density | Label |
|---|---|---|---|---|---|---|
| Lichess (round) | Board owns the **entire left grid column** | One right column: clocks, player bars, move list, controls, all in `grid-template-areas` | **Nothing** — board area is exclusive | During play: nothing (no eval). After: analysis page, gated | Minimal; zen mode strips further | [V] scss |
| chess.com (live) | Board left-of-center, tall right column | New-game controls, move list + chat as **toggleable windows** (2026 de-clutter) | Opponent bar (avatar/name/clock) at most; optional setting moves player info above/below board | During play: nothing. After: game-over modal → Game Review funnel | Medium-high (social panels); Zen Mode toggle | [V]/[P] |
| Chessable (MoveTrainer) | Board left, commentary panel right | Instructional text, Learn Next/Review controls | Turn prompt near board | At commit: wrong move → show correct, restart sequence, SRS demotion | High, notation-assumed | [P] |
| Chessiverse (Guided Play) | Board + sidebar controls | Eval bar, coach commentary | — (not establishable) | **Before commit** (Full Help): every legal move color-graded **on the squares**; blunder guard intercepts pre-landing | Dial: Full Help / Peek / Hint Only | [V] site |
| Beacon Chess | Board with arrows | Explanation panel + likely-replies element, concurrently | not establishable | After commit/at review: candidate arrows + prose reasons | Dense at rest (arrows + prose + replies at once) | [P] screenshot |
| Noctie | Board, **owl mascot beside it** | One conversational feedback bubble | not establishable | **At commit**: 7-color grade painted on board + bubble sentence; takeback+hint offered as a pair | Minimal: board + mascot + one bubble | [V]/[P] |
| Aimchess | Drill screens: sparse board + Next/Retry below | (dashboard-first product — see §2.5) | — | Post-hoc by construction; solution/refutation arrows on board after answer | Dashboard chart-dense; drill screens sparse | [V]/[P] |
| En Croissant | Board main area, **tabbed right panel** | Engine controls/lines behind an Analysis tab; report artifacts (graph, heatmap) | — | On demand: enable engine → live evals; one-click report with !!/?? annotations | Summarized by default; raw multi-PV one click away | [V] docs |
| Nibbler | Board left, PV/stat text right, winrate graph strip | Multi-PV lines, optional raw N/P/Q/S/U/V/WDL per move | — | **Always-on**: ranked candidate arrows painted on board, live | Maximal, permanent | [V] README |

### 1.1 Lichess — the board-column grid, primary-source exact

The round (game) screen layout is a CSS grid, `ui/round/css/_app-layout.scss` [V]
https://raw.githubusercontent.com/lichess-org/lila/master/ui/round/css/_app-layout.scss:

- **Desktop (col2+)**: template areas are twelve rows of `'board <x>'` — the board occupies
  the left column top-to-bottom, and *everything else* (voice, material, clock-top,
  user-top, **moves**, controls, user-bot, clock-bot, material) stacks in the right column.
  The board column contains only the board. Player names and clocks are **beside** the
  board, not above it.
- **Mobile (col1)**: a vertical stack — `'user-top' 'mat-top' 'board' … 'user-bot'
  'controls' 'moves'`. The thin opponent identity bar sits above the board; **all working
  content (moves, controls) goes below**. The board is full-width and its size is set by
  the viewport, not by how much content the session has generated.
- **Zen mode** (`_zen.scss` [V]): hides `.site-title-nav`, `.site-buttons`, `#friend_box`,
  the opponent-left counter — i.e. strips *global chrome*; toggled by pressing `z` in-game,
  three pref states No / Yes / "In-game only" [V] Pref.scala; the FAQ frames it as "how to
  hide ratings while playing" [V] https://lichess.org/faq. The field's cleanest product
  ships a one-key *chrome-off* switch on top of an already-minimal screen.
- **During vs after**: the play screen shows no evaluation of any kind. Analysis is a
  separate page (`/analysis`, [V] fetched: nav → board → engine toggle/cloud eval → move
  list → flip/PGN/FEN) — and **"Learn from your mistakes"** appears only after requesting
  computer analysis on a finished game, bottom right; it walks mistakes one at a time,
  shows the bad move in red, and asks for another try before revealing anything: *"Instead
  of telling you right away what you should have played, this feature gives you a chance to
  rethink the position by yourself"* [V]
  https://lichess.org/@/lichess/blog/learn-from-your-mistakes/WFvLpiQA.
- Feature discovery is a fully server-rendered top nav with complete dropdowns (Play /
  Puzzles / Learn / Watch / Community / Tools — every surface one hover away, no
  onboarding) [V] fetched lichess.org.
- **Best**: the board-column grid + zen — board size is a function of viewport alone, by
  construction. **Failure**: discoverability of depth — the same flat nav hides
  learn-from-mistakes three clicks deep behind "request analysis"; nothing at the moment
  of play points to it (the button exists only post-analysis [V] blog above).

### 1.2 chess.com — the review funnel and the settings IA

- Play screen: board with a tall right column; in early 2026 "in-game chat and the move
  list have been split into separate, **toggleable windows** to reduce clutter" [P]
  https://www.chess.com/blog/TheChessPhilospher/latest-chess-com-update-guide. The in-game
  settings gear sits "next to your opponent's timer in the upper-right corner, just outside
  the board" [V] https://support.chess.com/en/articles/8594320. No eval during live play [M].
- **Post-game sequence** [V] https://support.chess.com/en/articles/8584089-how-does-game-review-work,
  https://www.chess.com/news/view/chesscom-launches-game-review-v2: game-over modal
  (result + Rematch / New Game / green **Game Review**; the button also appears on the
  right side of the screen) → analysis runs → a report-card page: coach avatar
  (swappable, mutable), Game Graph, per-side Accuracy 0–100, estimated rating, per-phase
  grades → "Next" steps through key moves → on your errors a **Retry** replays the
  position → coach draws arrows/highlights *when you hover highlighted words in its
  explanation* (v2's explanation-bound visuals). Ten classifications (Brilliant → Blunder)
  [V]; a "Show Move Classification On Board" setting toggles **badge icons on the board
  itself** [V] same article.
- Settings IA: cogwheel bottom-left → All Settings → "Boards & Pieces"; same page
  reachable in-game via the gear; mobile: More → Theme with mix-and-match custom themes
  [V] support 8594320. Left nav is collapsible to icons and items pin/unpin [P] support
  10809312/12749551 snippets. A "Zen Mode" hides everything except board and clock [P]
  TheChessPhilospher blog.
- **Best**: the review funnel — one continuous, ritualized path from the game-over modal
  to coached retry; nothing in the field matches its completeness. **Failure**: the paywall
  sits exactly on that funnel (one free review/day; Gold buyers cancel over it [P]
  chess.com forum "new-gold-membership-doesnt-include-unlimited-game-review"), and the
  modal's buttons shift as Game Review loads, causing misclicks [P] forum threads.

### 1.3 Chessable — course player (placement notes only; mechanics in `chessable-movetrainer.md`)

Board left, commentary right, Learn Next/Review upper-right of the course page [P]
https://chessentials.com/chessable-honest-review/; video courses put the player above a
variation list that **filters live to what the author is discussing** (video-sync) [P]
support 9038776 snippet. Wrong move → correct move shown, sequence restarts, SRS level
falls [P] chessentials + support snippets. An analysis escape hatch (small board icon,
far right below the text) opens Stockfish in a new tab — the inspector is *literally
another tab* [P] chessentials. Dark mode is **opt-in behind the profile menu** [P] support
9028228; board/piece pickers exist in-lesson, counts unpublished [P] support 9028298.
Density verdict from its own ecosystem: "dense and assumes fluent notation… the wrong
first app for a genuine beginner" [P] https://chessdir.app/apps/chessable.

### 1.4 Chessiverse, Beacon, Noctie, Aimchess (presentation deltas only)

- **Chessiverse**: assistance presented as an explicit **three-level dial** — Full Help
  (all legal moves color-graded on the squares, always, + eval bar), Peek (grades hidden
  while thinking; hold a piece to reveal), Hint Only (no colors, no bar) — with a measured
  graduation gate to rated play [V] https://chessiverse.com/guided-play. Feedback lives
  **in the board's own pixels**, so max-load costs zero layout. Rewound lines persist as
  move-list branches; PGN exports variations [V] same page. Its published vocabulary is
  "levels of help", not "support mode" [V] site-restricted search. Mobile lags web [V]
  https://betterchess.net/chessiverse/.
- **Beacon**: the one hero screenshot shows candidate arrows + explanation panel + likely
  replies **simultaneously** — a deliberately dense at-rest coach view [V/P]
  https://beaconchess.com/. Exact geometry not establishable publicly; no independent
  reviews exist (HN Algolia returns zero) [V] — the honest finding is that its real-world
  UX is unverifiable.
- **Noctie**: the most disciplined minimal composition in the survey — board, owl mascot
  beside it, **one** conversational bubble; at commit the move is graded on a 7-color
  human-percentile scale painted on the board [V] https://noctie.ai/faq/, [P] Product Hunt
  review ("shows the colors on the board after each move"). Takeback + hint are offered as
  a single paired affordance [V] https://noctie.ai/. One voice, one card, zero panels.
- **Aimchess**: the **dashboard-first** IA — the landing surface is a six-axis skill
  report over your imported games, not a board; drills are reached via a pushed Daily Plan
  or a Training Room of 13 lesson types [V] https://aimchess.com/ + App Store. Its
  discovery failure is on record: "a list of lists with no particular order of difficulty,
  frequency, priority, expected duration" [V] App Store review. Ships dark **and** light
  themes and board/piece appearance settings [V] App Store description.

### 1.5 The inspector end — En Croissant, Nibbler

- **En Croissant**: board main area, engine controls in a **tabbed right panel**; raw
  evals appear only after enabling an engine on the Analysis tab; the default artifacts
  are summarized (report graph, heatmap, !!/?? annotations) [V]
  https://encroissant.org/docs/guides/analyze-game. The inspector with a lichess veneer:
  raw data one click behind tabs. Reliability is its public failure (startup freezes,
  engine-install bugs, payload-size issue) [V] github issues.
- **Nibbler**: the pure inspector — "runs Leela in the background and **constantly**
  displays opinions"; ranked candidate arrows painted on the board, multi-PV text beside,
  winrate graph, optional raw N/P/Q/S/U/V/WDL columns; hover a PV to preview it on the
  board *without changing the analysed position* [V]
  https://raw.githubusercontent.com/rooklift/nibbler/master/README.md. Discovery is
  menu-bar + a JSON config. For a learner it is the anti-pattern made flesh: every number
  is an answer, so nothing is left to practice — this is what our Inspector must be *and*
  what our play screen must never be. Its one stealable interaction: hover-preview without
  commitment.

## 2. A pattern language for board-first screens

Seven recurring patterns, with who uses which and how each handles **max load** (D841's
question — every module active at once). Synthesis label [P] over the §1 evidence unless
marked.

1. **Board-column + companion rail.** The desktop default of the entire field: board owns
   one grid column exclusively; clocks, identity, moves, controls, evidence stack in a
   second column that **scrolls or tabs internally**. Lichess round (grid-proven [V]),
   chess.com live, Chessable, En Croissant. Max load: the rail absorbs it; the board never
   pays. Nobody in the field stacks working content above the board on desktop; the only
   thing that ever sits there is a thin opponent-identity bar (chess.com, lichess mobile).
2. **Board + bottom stack (mobile).** Lichess col1 [V scss]: identity bar above, board
   full-width, then controls, then moves, in a vertical scroll below. Working content goes
   *below* the board on phones; the board's size is a viewport function.
3. **On-board paint.** Feedback rendered into the board's own pixels: Chessiverse graded
   squares [V], Noctie's 7-color commit grades [V], chess.com classification badges on the
   destination square [V setting], Beacon and Nibbler arrows [V/P]. Zero layout cost, so
   it is the field's preferred *at-commit* channel — and Nibbler shows its failure mode:
   more than about one semantic layer at a time turns the board into a diagram.
4. **Companion voice card.** One persistent card with one voice that all feedback queues
   into, instead of new blocks per event: chess.com's coach, Noctie's owl bubble. The
   card's *position* is fixed; its *content* rotates. This is how the field avoids
   message-stacking.
5. **Dashboard-first hub.** Aimchess (and En Croissant's launch surface): the analytical
   home is a separate screen, which is precisely what keeps the drill/play screens sparse.
   An IA pattern, not a play-screen pattern — the value is the *separation*.
6. **Full-density inspector.** Nibbler; En Croissant's engine tab. Legitimate as a
   dedicated opt-in surface for people who already speak the internals; fatal as a play
   screen. The field agrees with D718's ruling that the inspector is a separate surface.
7. **Chrome-off switch.** Lichess zen (`z`, 3 pref states [V]), chess.com Zen Mode [P].
   The two incumbents both ship a one-action path to "board + clock only". A *preset*, in
   Phase-5 vocabulary — the quietest preset has a dedicated toggle, not a settings dive.

**The two invariants the whole field obeys:** (a) on desktop, nothing that grows sits in
the board's column; (b) when content exceeds its region, the region scrolls, tabs, or
collapses — the board is never resized by content. Every product above, from minimal
Noctie to maximal Nibbler, holds both. (Nibbler holds them trivially: its density lives in
the rail and on the board's paint layer, and its window is fixed.)

## 3. Where OUR shipped screen sits — the six defects as field violations

D717's six rejection clauses restated against §2 (shipped-state evidence: D718 trace,
`phase1-gap-matrix.md` §4):

| D717 defect | Field pattern violated |
|---|---|
| Objective/status/evidence/hints stacked **above the board** | Pattern 1/2: no surveyed product puts working content above the board at any viewport; the ceiling is a thin identity bar |
| Every added block **shrinks the board** | The field's invariant (b): board size is a viewport function; content growth is absorbed by scrolling rails (lichess [V]), toggleable windows (chess.com [P]), or board paint (Chessiverse [V]) |
| Overflow **clipped or nested** | Rails scroll *by design* (lichess `moves` is a dedicated scrolling grid cell [V]); tabs gate depth (En Croissant [V]); our `overflow:hidden` regions (D718) are the negation of that |
| **Raw classifier sentences, UCI, percentages** in ordinary play | Raw internals appear in exactly two field locations: dedicated inspectors (Nibbler [V]) and behind analysis tabs (En Croissant [V]). Play surfaces are SAN + human words everywhere — even chess.com's grades are named judgments with icons, and corpus percentages live in the *analysis* explorer, not the play screen. Our L1–L15 (gap matrix §4) put inspector content one click or zero clicks from the board |
| Assistance exposes **plumbing, not intent** | Chessiverse presents three learner intents (Full Help / Peek / Hint Only) over whatever machinery serves them [V]; chess.com presents one verb ("Game Review"). Our shipped surface exposes 54 source/mechanism controls (`evidence-presentation.md`) — the field's intent dial is the Phase-5 shape |
| **192 px board** accepted as viewport proof | Field invariant (a)+(b): a board that shrinks to fit content proves the composition wrong, not the viewport handled. Lichess's grid makes the failure inexpressible |

The shipped screen is, in pattern terms, **an inspector (pattern 6) wearing a play
screen's URL** — which is the owner's "engine review screen with a rewind button" failure
shape, arrived at through layout rather than through features.

## 4. Where the CANVAS draft sits

The working draft is the *Tabiya Play Composition* canvas
(https://claude.ai/code/artifact/1929de7d-fc30-4044-8ca7-e45adeb8c3e5), four artboards +
annotations, read at source this pass [V]: **Desktop calm** (1440×900: top bar with pack
title + preset pill + Inspector link; centered board at 80 px squares; SAN move strip
below; 336 px right rail with objective, state chips, verdict card, theory row, silence
disclosure), **Tablet** (768×1024: board-first, one bounded card below, objective demoted
to a footer line), **Phone** (390×844: status chips, board, SAN strip, bottom sheet with
verdict + Play on/Retry/Explain), **Desktop dark MAX LOAD** (1440×900: Keep-Me-Safe cue
row above the board at 76 px squares; rail seats verdict card + threat radar, requested
sight, theory, guided hint, compare rows with count badges; preset disclosure footer).

**What it got right, by field pattern:** the desktop artboards are pattern 1 (board stage
+ rail) with the rail absorbing modules as queued rows with count badges — the lichess
grid discipline plus the chess.com toggleable-window instinct, and D841's ruling encoded.
Phone is pattern 2 with a bottom sheet. The verdict card is pattern 4 (one seat, one
voice, actions attached). SAN-only chips discharge the L3/L9 leak class. The silence
disclosure ("Quiet by choice… Change") is a presentation of Phase-5 presets the field has
no equivalent of — genuinely novel. The dark artboard is a real dark draft (muted board,
paper-dark surfaces), pointing at D839 correctly.

**Where it breaks against the field — criticisms, honestly:**

1. **The max-load artboard violates both field invariants and its own annotation.** The
   Keep-Me-Safe cue is a banner row *above the board*, inside the board's column — the one
   placement no surveyed product uses — and the board simultaneously drops from 80 px to
   76 px squares (640→608 px) between calm and max-load artboards, while the canvas
   annotation promises "Board size identical to the calm state" [V] canvas.json + both
   artboards. The draft re-commits D717 defects 1 and 2 in miniature at exactly the state
   Phase 4 exists to survive.
2. **Max load is answered at one viewport only.** D841 demands the full-house state "on
   every viewport"; the canvas answers it at 1440 px and shows tablet/phone only in the
   happy path. The tablet artboard has no seat for a second module; the phone sheet shows
   "1 note" with no queue semantics. Field reference: lichess solves mobile max load
   structurally (everything below the board in one scroll [V]); a sheet needs collapsed
   badge states and a defined expansion that overlays rather than pushes.
3. **The move strip clips.** Both desktop artboards give the SAN strip a fixed width with
   `overflow: hidden` — D718's clipping critique reproduced in the mockup. Lichess makes
   moves a dedicated scrolling cell in the rail [V]; Chessiverse's branches live *in* the
   move list [V]. The strip as drawn also cannot seat branch chips beyond the one
   "branch B" pill.
4. **The tablet artboard demotes the objective to a footer caption** below the feedback
   card — but region 1 (`design/05` §2) binds board *and objective* together, and the
   field keeps the prompt adjacent to the board (Chessable's turn prompt [P], chess.com's
   coach card headline [V]). Feedback outranks objective in the draft's tablet hierarchy;
   it should be the reverse.
5. **At-commit feedback has no on-board echo.** The field's at-commit channel is pattern 3
   (paint): chess.com's destination-square badge [V], Noctie's square grade [V/P],
   Chessiverse's colors [V]. The draft routes everything into the rail card; the board
   itself never acknowledges the commit. Combined with D840 (no move animation), commit in
   the draft is a purely peripheral event — the one moment the whole product turns on.

## 5. Theming depth benchmark (D839) — Lichess is the spec ceiling, not the floor

All lichess numbers from primary source [V]
(https://raw.githubusercontent.com/lichess-org/lila/master/modules/pref/src/main/Theme.scala,
…/PieceSet.scala, …/Pref.scala):

| Axis | Lichess (gold standard) | chess.com | Chessable / Aimchess |
|---|---|---|---|
| Backgrounds | 5: Light / Dark / **Dark Board** / Transparent / Device-theme, **default = Device** | site-wide dark-toned default; custom background upload [V support 8594320] | Chessable: dark **opt-in** behind profile menu [P]; Aimchess: dark + light [V] |
| Board themes | **25** 2D (brown default … newspaper, horsey) + 19 3D | "a variety of premade" — counts unpublished [V]; named Board Presets save looks per use-case [P] | pickers exist, counts unpublished [P] |
| Piece sets | **41–42** 2D (cburnett default; two reads of PieceSet.scala counted 41 and 42 — the magnitude, not the unit digit, is the point) + 11 3D | unpublished count [V] | pickers exist [P] |
| Board image tuning | brightness / contrast / opacity / **hue** sliders (BoardPref, defaults 100/100/100/0) | — not found | — |
| Animation | four levels: None / Fast / **Normal (default)** / Slow | piece-movement + pre/post-game animation toggles [V support 8594320] | Chessable: animation speed setting [P]; Chessiverse: adjustable [V faq] |
| Quiet switch | zen: No / Yes / In-game only, bound to `z` | Zen Mode toggle [P] | — |
| Coordinates | 4 states incl. "inside all squares" | toggle [M] | — |

**Spec floor this benchmark implies for us** (proposal, [M] synthesis — Phase-4/5 RFC
input, not a ruling): dark as a first-class default-eligible theme (Device-theme default is
the modern norm and directly answers the owner's light-site dislike); **≥2 board themes
and ≥2 piece sets** under the same token system (the difference between "a theme exists"
and "theming exists" is the second option); **animation with a None option and a Normal
default** — D840's fix should land as this pref, not as a hard-coded tween; a
zen-equivalent quiet toggle can simply *be* the quietest Phase-5 preset with a dedicated
binding. The hue/brightness sliders and 40-deep catalogs are lichess's decade of accretion
— ceiling, not floor. Constraint carried from D839: themes are presentation and may never
alter which evidence is visible.

## 6. Three concrete canvas revisions (each traceable to an observed pattern)

1. **Move the Keep-Me-Safe cue out of the board column; make the board pixel-identical in
   calm and max-load.** Seat the cue at the top of the rail (its row already exists in the
   max-load rail as "Threat radar") or as a bounded badge anchored to the *player/status
   strip below* the board — never a row above. Source: the lichess round grid gives the
   board column to the board exclusively at every desktop breakpoint [V _app-layout.scss];
   chess.com's 2026 revision moved even chat/move-list out of fixed layout into toggleable
   windows to protect board area [P]. This also discharges criticism §4.1's 640→608 px
   contradiction.
2. **Answer max load at tablet and phone with collapsed-queue states of the same modules.**
   Tablet: the bounded card becomes the queue head — one visible module + a badge row
   ("+3") that swaps content in place, never adding rows. Phone: the sheet's collapsed rim
   carries the count badges; expansion overlays the board's lower edge (dim, not push), the
   board never moves. Source: lichess col1 puts all growth below the board in one scroll
   [V]; the companion-card pattern (chess.com coach, Noctie bubble) rotates content through
   one fixed seat rather than stacking seats [V/P] — the draft already does this on
   desktop; the revision is extending its own rule down-viewport.
3. **Give commit a bounded on-board echo, and let the move strip scroll.** At commit, a
   momentary destination-square acknowledgment (post-commit only — a held/degraded state
   glyph, not a grade of alternatives) plus the D840 animation fix; the rail card remains
   the persistent seat. Make the SAN strip a horizontally scrollable timeline cell with
   branch chips inline, fixed height. Source: at-commit paint is the field consensus
   channel — chess.com's on-board classification badges [V support 8584089], Noctie's
   commit-time square colors [V faq + PH review], Chessiverse's graded squares [V] — all
   post-decision-compatible with ADR-0006's commit-before-learning when restricted to the
   committed move; the scrolling move cell is lichess's `moves` grid area [V]; branches in
   the move list are shipped by Chessiverse [V guided-play].

(4th, smaller: restore the objective above the feedback card on tablet — §4.4; field
source: prompt-adjacent-to-board in Chessable [P] and coach-headline in chess.com [V].)

## 7. Proposed ledger rows (head verified D868 at pass start; NOT written. A concurrent
pass appears to be claiming the same range — a `d872-*` harness already exists in
`tools/` — final ids assigned at landing: D875–D877)

- **D875** — this dossier: seven-pattern field language; the two field invariants (nothing
  growing in the board column; content never resizes the board); shipped screen located as
  "inspector wearing a play screen's URL"; canvas draft located with five criticisms and
  three traced revisions; lichess theming benchmark pinned from primary source.
- **D876** — canvas defect: the max-load artboard contradicts canvas.json's own "board
  size identical" annotation (80→76 px squares) and seats a cue above the board; revision
  §6.1 before the Phase-4 RFC cites the canvas as its working draft.
- **D877** — D841 residue: the max-load state is drawn at 1440 px only; tablet and phone
  full-house states are unanswered; revision §6.2 is the candidate answer.
- **D872** — D839 input: the theming spec floor of §5 (device-default dark, ≥2/≥2
  board/piece options, animation pref with None, quiet toggle = quietest preset) as the
  Phase-4/5 RFC's theming clause; lichess's slider/catalog depth explicitly out of 1.0.

## Residuals and limits

- No product was hands-on-driven this pass (browser unavailable); lichess claims rest on
  source code and live fetches, which is stronger than screenshots but is not felt UX.
  The three incumbent screens (lichess round, chess.com live+review, Chessable MoveTrainer)
  deserve a 30-minute hands-on pass when a browser session is available; Beacon is
  publicly unverifiable beyond its own marketing [V-absence].
- Chess.com eval-bar side (left vs right of board in review) is unresolved between a
  secondary guide and model memory — flagged [M], immaterial to the conclusions.
- The Aimchess drill-screen and Chessiverse in-game top-of-board anatomy are
  [P]/not-establishable; neither carries any conclusion above.
