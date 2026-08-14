# Quick passes: WintrChess · En Croissant · ChessMonitor — desk research

- Date: 2026-08-14
- Feeds: Q1a / E1; `design/02` §Adoption posture. Sweep 2's teardown picks #3–#5
  (`coverage-sweep-2-notability.md`), done as quick passes per the three-question rule
  (E1 / adoption entry / love-hate), ~15 lines each, at least one fresh fetch each.
- Method: desk, no install. Fetches this pass: github.com/WintrCat/wintrchess and
  /freechess; chess.com forum "Vive la WintrChess"; github.com/franciscoBSalgueiro/en-croissant;
  lichess ublog-GwYz71GJ comment thread; chessmonitor.com;
  thechessadvisor.com/website-review/review-of-chessmonitorcom. Reddit still blocked
  (standing limitation). `[V]`/`[P]`/`[M]` per house rules.

## 1. WintrChess (sweep #3) — free game review

- **What/grounds:** wintrcat's free web game review, successor to the abandoned
  freechess repo ("The new website, WintrChess, is open-source" `[V]` freechess
  README); GPL-3.0, React/TS + Node monorepo, 237★, Ko-fi-funded, actively maintained
  `[V]` wintrchess repo. Annotations are **Stockfish evaluations plus a
  chess.com-style classification layer** (brilliant→blunder + accuracy) — "analyses
  Chess games with move classifications, for free" `[V]` README; a secondary source
  claims classification "matches Chess.com's premium tier within 2% variance" `[P]`.
  No coaching prose: classification is the whole output.
- **Reliability is publicly contested:** users report moves flagged blunder while
  *recommended as best*, and "incorrect recommendations including illegal moves"
  `[V]` chess.com forum (EternalDPLayer); same thread names the structural gap —
  "None of them explain 'why'. And without why? Being told what the best move is is
  pretty much useless" `[V]`.
- **Re-entry: none found.** Paste-PGN → read-only report; no play-from-position, no
  retry, no opponent, across repo, forum, and prior sweep sources `[V]`
  evidence-of-absence. E1 **intact**.
- **Love/hate:** loved as the paywall resentment valve — free unlimited review vs
  chess.com's gated Game Review (`coverage-sweep-2-notability.md` row 56); hated for
  "lacks feedback" and the trust wobbles above. Adoption entry: already recorded as
  audit row 56 (**SHIPPED** by posture — free review with re-entry attached); this
  pass adds the trust lesson — classification labels without grounding erode
  confidence fast, which our verified-score provenance rule already answers.

## 2. En Croissant (sweep #4) — open-source desktop workbench

- **What:** "an open-source, cross-platform chess GUI that aims to be powerful,
  customizable and easy to use" `[V]` README — GPL-3.0, React/Rust/Tauri, 1.8k★,
  1,761 commits, active Discord `[V]` repo. Feature census vs ours: Lichess/Chess.com
  game import + personal database ✅ (ours: one-game import by choice); multi-engine
  UCI analysis ✅ (ours: managed workers, curated); **repertoire prep with spaced
  repetition** `[V]` README (community: "not yet fully developed for puzzles or
  repertoire practice" `[V]` lichess thread); position search across databases —
  ours has nothing comparable learner-side (Library depth is designed, not shipped);
  engine/database download manager — the self-host adjacency.
- **What the community loves:** "already at a stage where it really provides a lot of
  extra utility compared to lichess and chesscom, and it looks good doing it too"
  `[V]` lichess thread (biscuitfiend); ease of use and lightweight load vs ChessBase
  `[P]`. Requests/complaints: hide-the-eval-bar option `[V]` (our anti-contamination
  default, arrived at independently by their users), mobile ("not an easy task" —
  maintainer `[V]`), young-project bugs `[V]`.
- **E1 intact:** everything is manual workbench — analysis variations are edited, not
  played; no opponent-backed attempts, no scheduling of returns beyond the immature
  repertoire SRS, no objectives. Adoption entry for our deep-mode surface: the
  **all-games personal database + position search** shape (audit row 59, held) — and
  the eval-bar-hiding demand as external validation of `design/02`'s
  anti-contamination default. Its audience is our AGPL/self-host constituency; being
  *worse* than En Croissant at analysis depth is acceptable, being closed to it is not.

## 3. ChessMonitor (sweep #5) — stats dashboards over your online games

- **What people track** `[V]` chessmonitor.com + thechessadvisor review: rating
  progress over time per platform/time-control; win/draw/loss ratios; "Most Played
  Openings... with the win" rates; a **FIDE Elo estimate** from your online games; an
  opponent world map; an activity log (games played per day, chess.com-style
  heatmap); opponent scouting profiles; cross-platform aggregation (Chess.com +
  Lichess + uploads) with Stockfish 18 analysis; 10M OTB reference games;
  Giri-endorsed, free "(for now) with a premium option" `[V]` review.
- **Love/hate:** loved for cross-platform unification ("its strength lies in
  cross-platform support"), performance, scouting for tournament prep, and "deep
  insights into openings" `[P]` reviews/store extracts; criticized for sync delays,
  opening-detection inaccuracies, and no report sharing `[V]` thechessadvisor.
- **The honesty question, answered honestly:** yes and no. What their users love is
  mostly **record-keeping over real outcomes** — actual ratings, actual W/L per
  opening, actual activity — which our honest-progress posture permits (facts, not
  claims). But the marquee number is a **manufactured skill estimate** (the FIDE Elo
  estimate, front-page, Giri-fronted), and the dashboards' pull *is* the single
  number going up. That is direct demand-evidence for exactly what our
  no-skill-numbers rule refuses to synthesize (`docs/return-and-progression.md`: no
  mastery number; audit rows 4/59: milestones are events, "dashboard-style skill
  claims stay out"). Recorded as a real cost of the posture, not explained away: our
  event-shaped milestones must be *satisfying enough* to compensate, and B7's
  bet is unproven against this shelf. Not a DESIGN-GAP — the posture is an owner
  ruling with the trade-off named — but the strongest external evidence yet that it
  has a price. E1 **intact** ("watches your games but never plays them", matrix row);
  adoption entry stays audit row 59's hold.
