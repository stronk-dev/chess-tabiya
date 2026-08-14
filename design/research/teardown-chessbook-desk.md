# Teardown: Chessbook — desk research

- Date: 2026-08-14
- Feeds: Q1a / E1 (sweep 1's #2 teardown pick, matrix CSV line 31); `design/02`
  §Adoption posture; **the queued repertoire gap-finding RFC** (adoption-audit row 48 /
  §5.2; BACKLOG "Repertoire gap-finding over imported repertoires vs band-explorer
  coverage") — §7 below states the adoption contract that RFC should target. Builds on
  `coverage-gap-sweep.md` cluster 6.
- Method: desk research, no install, no account. Raw fetches: Apple App Store listing
  id6466343415 (description, pricing, ratings, reviews, version history); 64squares
  review (https://64squares.substack.com/p/chessbook-review, Ivan Veselov, hands-on);
  developer interview (https://saychess.substack.com/p/an-interview-with-marcus-buffett);
  the developer's own year review
  (https://mbuffett.com/posts/chessbook-year-review-2024/); competitor comparison
  (https://chessflare.com/resources/chessflare-vs-chessbook — competitor-authored, bias
  flagged where used). `[V]` = fetched and read this pass; `[P]` = search-extract or
  secondary; `[M]` = model knowledge, unverified.
- **Fetches that returned nothing or failed**: chessbook.com itself is an unreadable
  SPA (title only — same failure as sweep 2's wintrchess/openingtree fetches); Google
  Play page usable only via search extracts `[P]`; Reddit direct access blocked (the
  standing limitation recorded in `coverage-sweep-2-notability.md` §Searches). No
  source describes a play-vs-opponent mode — evidence of absence, residual in §9.

## 1. What it is

**The current default recommendation for opening-repertoire building and drilling: a
web + iOS/Android tool that builds a position-keyed repertoire, computes your coverage
against a rating-banded human corpus, points you at your biggest gap, drills moves by
spaced repetition, and scans your online games for repertoire mistakes. 4.9★ from
2,000+ App Store ratings** `[V]` App Store.

- Maker `[V]` 64squares + mbuffett.com: **Marcus Buffett**, solo developer, full time;
  active Discord community; "thousands of paying users"; native apps are "about half
  of our revenue" with "much higher" conversion than web `[V]` year review. Growth at
  interview time: "about 30% more users every month" `[V]` saychess.
- Access `[V]` App Store: free to 400 moves; Pro $7.99/mo or $79.99/yr for unlimited
  moves. Actively maintained (v1.3.37 released the day of this pass) `[V]`.
- Origin/philosophy `[V]` saychess: "you should only spend time on the positions that
  you're actually going to see in your games" — and openings, unlike tactics, can be
  "done."
- Band fit: explicitly *not* for beginners per its own reviewers ("NOT a replacement
  for books/courses, and NOT for beginners!" `[V]` App Store review WowEthanGreatMove)
  — its audience is our band.

## 2. The corpus — what coverage is computed against

`[V]` saychess interview (the developer, primary):

- **"Every non-bullet Lichess game ever played"**, filtered by **200-Elo rating bands**
  and time control — the same CC0 corpus our own explorer sourcing uses (R02).
- Plus **~10M OTB games between players rated 2400+** for master stats.
- The UI shows three populations side by side: "Peer results" (scores at your rating),
  master-game popularity, and engine eval `[V]` 64squares — population-labelled
  evidence, which is exactly our grounded-claims rung-4 shape, shipped by an
  incumbent at repertoire-build time (compare `teardown-365chess-desk.md`: the same
  lesson from the lookup shelf).

## 3. Gap-finding mechanics — the load-bearing section

What "gap" means, established across the developer's own words and reviews:

- **A gap is an opponent reply your repertoire does not answer** — not a line you
  haven't memorized `[V]` chessflare (their definition matches the developer's
  example below; competitor-authored but consistent).
- **Per-position, not per-line.** The repertoire is a position-keyed graph:
  "treating repertoires as a collection of lines is actually very limiting; it
  doesn't work for transpositions... Store EPDs, not FENs" `[V]` saychess (the
  developer's own architecture advice). Coverage therefore survives move-order
  changes by construction.
- **Priority = expected frequency at your band, multiplied along the path.** The
  developer's example `[V]` saychess: "Your biggest gap is in this line of the Ruy
  Lopez. At your level people play d6 20% of the time, and so you'll see this move in
  5% of your games" — i.e. the product of corpus move-probabilities from the root to
  the uncovered reply, in *your* rating band.
- **Stopping rule = a user-set coverage target expressed in games.** You pick rating
  range and target (e.g. "1 in 300 games"); once a branch's expected frequency falls
  below it, digging deeper is flagged as not worth it `[P]` search extract + `[V]`
  App Store copy ("Calculate your coverage per opening so you always know what to
  work on"). A saychess commenter, independently: it "does leverage the Lichess DB
  based on whatever rating range you'd like to see and then adjust depth based on
  number of games it might be seen" `[V]` saychess comments.
- **Single entry action:** a "Go to your biggest gap" button "takes you to the most
  popular variation that your repertoire still doesn't cover" `[V]` 64squares.

## 4. Import sources and repertoire construction

- Import from **PGN, Lichess games/studies, and linked Chess.com/Lichess accounts**,
  or build move-by-move in the explorer `[V]` 64squares ("import repertoires from PGN
  (or Lichess games!)"); App Store copy: combine openings from multiple sources `[V]`.
- **Pre-made repertoires with rating-range filtering** shipped 2024 `[V]` year review
  — a curated on-ramp before personal authoring.
- Deliberate anti-master positioning `[V]` App Store: avoid "obscure grandmaster
  lines," focus on "moves that are common at your level."

## 5. SRS mechanics — card-shaped, now FSRS

- **The unit is a move-answer card.** In practice sessions "the moves are replayed
  from the beginning and then you are asked to make a move"; wrong answers return
  soon, right answers stretch out, in "Daily tasks" `[V]` 64squares. So: theirs
  schedules *recall of a single move at a position*; ours schedules *return to a
  root for a new attempt* (`docs/return-and-progression.md` — episode/attempt unit,
  1/3/7/16/35-day ladder).
- **Algorithm: switched from "our hand-rolled supermemo-ish algorithm" to FSRS**
  in 2024 `[V]` year review — the opposite direction from our deliberate
  "intentionally small and explainable; not an FSRS/SM-2 mastery model" ruling.
- **Position-identity in review:** move order is deliberately mixed up across reviews
  so players "identify positions by the actual position, not by the exact series of
  moves that led to it" `[V]` saychess — SRS built on the same position-not-sequence
  identity as the transposition graph.
- **The failure mode is on record:** bulk-adding moves floods the queue — "I had to
  revise 100-200 moves per day" `[V]` 64squares. Card-count scheduling punishes
  breadth; evidence *for* our bounded attempt-ladder.

## 6. Own-game mistake scan and extras

- **"Review your online games"**: automatically checks recent Lichess/Chess.com games
  against the repertoire, then "will show and quiz you on any mistakes made in the
  games" `[V]` 64squares; App Store copy: "Find mistakes in your online games" `[V]`.
  Mistake → quiz card, not mistake → replayed game: the deviation is harvested into
  the SRS queue, severed from the game it happened in — the same harvest-the-position,
  lose-the-attempt shape as Dr. Wolf's mistake queue (`teardown-drwolf-desk.md` §3).
  Known gap: no aggregate mistake stats — "It would be nice to see how many times I
  made a particular mistake" `[V]` 64squares.
- Versus our own-game import: ours takes one game by explicit choice into a
  replayable run with preserved attempts (`docs/game-import-and-story.md`); theirs
  continuously mines the linked account — effective, and exactly the account-level
  mining ADR-0003 keeps opt-in.
- **Model games**: full example games in your openings — "one of the features I use
  most" and "as effective of a learning tool as the opening training" `[V]` year
  review (a Featured Master credited it for a national blitz championship). The
  bridge-to-middlegame demand, answered read-only.
- Also shipped 2024 `[V]` year review: repertoire stats, streaks, an openings report
  the developer himself grades as needing refinement.

## 7. The adoption contract for our gap-finding RFC

What the RFC (audit row 48, depends on the runtime corpus-evidence surface, row 20)
should adopt as the proven shape — each item grounded above:

1. **Gap unit:** an uncovered opponent reply at a *position* (transposition-correct,
   position-keyed like our runtime identity), never a missing line (§3).
2. **Priority metric:** expected games-until-seen at the learner's band — corpus move
   probabilities multiplied along the path, shown with population labels ("at your
   level", rung 4) (§3).
3. **Stopping rule:** a user-set coverage target in games ("1 in 300"), so authoring
   effort is bounded honestly and "done" is reachable (§1 philosophy, §3).
4. **Entry action:** one button — go to the biggest gap (§3).
5. **Sources:** imported by choice — PGN/Lichess study/account export (§4), with the
   own-game scan strictly over explicitly imported games, not a linked-account watch
   (ADR-0003 transformation already ruled in audit row 48).
6. **Where we exceed, not copy:** a gap resolves into *play* — fork at the gap
   position and drill it against band-appropriate resistance with the attempt
   preserved — where theirs resolves into a card-add + quiz. And scheduling stays our
   explainable attempt ladder, not FSRS; their own queue-flood complaint (§5) is the
   evidence.

## 8. Love and hate — why 4.9★, and what wears

**Top-3 loved:**

1. **The data-driven build loop.** "My ELO has risen by 1000 after getting this app!"
   `[V]` App Store (Neo-C); "a sensible system for learning openings that doesn't
   require memorizing extremely complicated if/then charts" `[V]` App Store (John
   Ennis); peer/master/engine stats side by side `[V]` 64squares.
2. **Speed and polish.** "Its UI is modern, good looking, responsive and fast" `[V]`
   64squares; the developer made the platform "2-3x faster" in a year `[V]` year
   review; practical payoff: "more confident and quick in playing the first moves,
   so that I can save time on the clock" `[V]` 64squares.
3. **The solo-dev/community relationship** — full-time maintainer, active Discord,
   fast iteration `[V]` 64squares + year review.

**Top-3 hated / friction:**

1. **Review-queue overload after bulk adds** (100–200 moves/day, §5) `[V]` 64squares.
2. **Thin and error-prone prose.** "Very few lines have explanations, and with the
   ones that do, there are many errors (such as a knight move being described as
   'developing a bishop to the long diagonal')" `[P]` review extract — the annotation
   layer is the weak flank of a stats-first product (and an ADR-0005 cautionary case:
   ungrounded prose erodes trust even in a beloved tool).
3. **Service gaps:** no offline mode `[V]` 64squares; unanswered paid-support
   requests, no reminder/notification option, no pause-to-absorb after a completed
   sequence `[P]` review extracts; 400-move free cap called restrictive `[V]`
   chessflare (bias flagged; consistent with store copy).

## 9. E1 verdict, adoption entry, residuals

**WHITESPACE INTACT.** Loop stages: commit ❌ (a quiz answer, not a commitment whose
consequence is played) · play-the-consequence ❌ (no opponent anywhere; the
interaction ends at the book edge — no source describes any play mode, §Method) ·
rewind ❌ n/a · preserved branches ❌ (the repertoire tree is *authored* structure;
attempts leave no trace but a scheduling grade) · compare ❌ · objectives ❌.
Chessbook is the best-executed single-shelf product in the matrix — opening-only,
card-unit, corpus-grounded — and it validates three of our design choices from the
adjacent shelf: position-keyed identity, band-filtered population-labelled evidence,
and effort bounded by "you'll actually see this." It leaves every loop stage
unclaimed.

**Adoption entry (one feature, one invariant):** the **coverage/gap computation of
§7**, entering through the grounded-claims invariant (rung-4 population-labelled
corpus stats) once the runtime explorer evidence surface (audit §5.1) exists —
transformed so a gap ends in played, preserved attempts rather than a card.

**Residuals only hands-on/e-mail can settle:** (1) whether any practice-vs-engine or
frequency-sampled opponent mode exists (all sources silent; chessflare says
study-only); (2) exact coverage-target options and default; (3) whether the own-game
scan can be pointed at pasted PGNs rather than linked accounts; (4) what the openings
report contains; (5) current free-tier friction in practice (400 moves ≈ how many
openings).
