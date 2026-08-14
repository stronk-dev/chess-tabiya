# Teardown: 365chess.com — desk research

- Date: 2026-08-14
- Feeds: Q1a / E1; Q6 (corpus sourcing — is a master-games DB additive to the working
  Lichess explorer pipeline?); `design/02` §Adoption posture (the two standing teardown
  questions: does it threaten E1, and what is its one good feature and through which
  invariant does it enter).
- Method: desk research, no account, no payment. `www.365chess.com` serves 403 to the
  plain fetch tool but 200 to curl with a browser user-agent; the site is
  server-rendered PHP, so full copy is in the HTML. Evidence came from raw fetches of
  `/` (landing), `/supporters.php` (pricing), `/opening_training.php`,
  `/play_computer_online.php`, `/endgame_training.php`, `/puzzles.php`, `/opening.php`
  (explorer), `/faq.php` plus FAQ categories 2/3/7/9, `/view/terms-of-service/`,
  `/view/shop/` (courses), `/view/365chess-coach/`, and `/robots.txt`. Quotes are
  literal strings from those fetched assets `[V]`. Secondary sources (Golden wiki
  snippet on ownership, a Lichess forum thread, both read through search/fetch
  extraction) are `[P]`. `[M]` = model knowledge or inference, unverified.
- **Second-order coverage miss, recorded honestly:** `coverage-gap-sweep.md` cluster 10
  ("Opening explorers / prep with play-out") is exactly the shelf 365chess sits on —
  and the sweep did not surface it. The sweep's searches skewed toward *new entrants*
  (2024–2026 framing, "productized and alive" language), and a 2007-vintage incumbent
  with weak SEO for feature-shaped queries never appeared in any cluster search. So the
  matrix's two recorded failure modes (snapshot staleness; wrong category frame) now
  have a third: **a sweep tuned for novelty misses the long-running incumbent that
  predates the frame.** This product was an owner/coordinator find, not a process find
  — the third such in a row.
- **Fetches/searches that returned nothing or failed:** plain-tool fetch of the site →
  HTTP 403 (UA-gated, worked around via curl); searches for "365chess API" → only
  Chess.com/Lichess API results, no public API found; searches for 365chess data
  licensing, scraping policy, or where its games come from → nothing (no
  license statement exists on the site either, see §6); search for "365chess premium
  price" → only Chess.com results (their pricing is invisible to search — it lives on
  `/supporters.php`); no press coverage, no funding news, no founder interviews found.

## 1. What it is

**A long-running (2007) games-database-first website: ~4.4M OTB/master games browsable
as an opening explorer with per-position stats, plus a ring of bolted-on training
features (guess-the-move opening trainer, puzzles, endgame play-outs, weakened-Stockfish
play) and a video-course store with a 4-step memorization coach.** The prior in the
brief was correct and is now `[V]`.

- Identity `[V]` FAQ: "365Chess.com is the biggest online chess games database. Here
  you have the most advanced tools for beginners and advanced players." Landing `[V]`:
  "Search in more than 4,400,000 chess games updated every week."
- Scale `[V]` FAQ: "Currently the Big Database contains more than 4 million games,
  played by more than 220,000 chess players in more than 43,000 tournaments." (The
  supporters FAQ still says "more of 3.5 million" and the supporters page "more of 4.2
  million" — stale copy layers, a small honesty signal about maintenance `[V]`.)
- Maker `[V]` ToS: "365Engage LLC dba 365Chess"; footer "© 2007 - 2026". Created 2007
  by Jorge Martínez, based in Montevideo, Uruguay `[P]` (Golden wiki via search
  extraction; not stated anywhere on the site itself).
- No online human play `[P]` (Lichess forum thread, extraction): "there are no
  opponents, no online play, except Stockfish" — corroborated by the site's own nav,
  which has no play-vs-human surface `[V]`.
- Access `[V]` `/supporters.php`: free registration; **pay-what-you-choose supporter
  membership** — "1 Year — €20 / €30 / €40 / €50 / €100", "We don't charge a fixed
  amount. You choose the amount of your contribution" (FAQ). Plus a separate paid
  course store (§3d). Auto-renew and 30-day free trials exist per ToS §6 `[V]`.

## 2. The database/explorer core

The explorer is the product's center of gravity and its genuinely good surface.

- **Per-position stats** `[V]` `/opening.php`, literal table columns: "Next Move · # of
  Games · Last Played · Winnings percentage White / Draw / Black · Engine Eval." Example
  row from the start position: "1. e4 — 1,923,809 — 2026 — 37.9% / 30.7% / 31.4% —
  +0.20 Dpt 50". Stored deep engine evals (depth 45–50) per explorer move, not just
  frequency — that pairing (corpus frequency + cached deep eval on one row) is the
  distinctive bit.
- **Two databases** `[V]`: "Big Database" (free tier, the ~4.4M games) and "Masters
  Database" (supporter-only, best-players subset). Both selectable in the explorer,
  trainer, and play-vs-computer.
- **Doors out of the explorer** `[V]`: every explorer position has "Play Position"
  (into play-vs-Stockfish from that position), "Analysis Board", game list, save, and
  supporter-only "Personal notes" per position.
- **Free vs paid** `[V]` supporters page: free tier gets the explorer, position search,
  and ECO listing in "limited" form; supporters get them "unlimited" plus: "Download
  games as PGN", Masters Database, "Create your own Database" ("you can have the same
  tools we have developed for our own database"), "Player's Opening Explorer" ("how
  does Carlsen play with white pieces?"), unlimited puzzles/bookmarks, ads-free.
- **Export** `[V]` FAQ cat 3: "You can download a collection of games like any player's
  list, a search results or the games from the Opening Explorer… Remember this is a
  feature available only to our supporters." Per-list PGN download only; **no bulk
  dump, no API found** (null result, §Method). `robots.txt` disallows `/download.php`,
  `/downloadp.php`, deep `/opening.php?m=…` paths, and `/view_game.php` `[V]`.
- Position search requires ≥3 moves per side "in order to increase performance" `[V]`
  FAQ cat 2 — the free tier caps search depth; supporters search "without any number of
  movements limit" `[V]`.

## 3. Training features — play-out or lookup?

**(a) Chess Openings Trainer — lookup.** `[V]` `/opening_training.php`: settings are
database (Big/Masters), color, opening or ECO code; the interaction strings are "Make
your move!", "The first training position is loaded and ready. **Compare your move with
responses from our database**", "Failed. Check most common alternatives below", "Move
not found. Check most common alternatives below", plus "Random Position / From Current
Position". It is guess-the-database-move against corpus frequency — recall of what was
played, graded by popularity, not a play-out. Whether the opponent's replies are
corpus-sampled (OpeningTrainer-style) or fixed is a residual (§9); either way nothing
continues beyond the book.

**(b) Play vs Computer — play-out, wrong opponent.** `[V]` `/play_computer_online.php`:
"You can challenge **Stockfish 18** choosing different levels of strength", "Level 1
(ELO ~1300)" through "Level 10 (ELO ~2700)". Full games from the start or from an
explorer position ("Play Position"). Save up to 10 games free, unlimited as supporter;
PGN download of your games `[V]`. This is exactly the **weakened-Stockfish default
opponent** our rejected-list names: level knobs on an engine, no human-likeness claim
anywhere `[V]`.

**(c) Endgames Training — a real play-out with an objective.** `[V]`
`/endgame_training.php`: "Improve your chess endgame skills by training **from
positions played in real games**… challenge the computer playing thousands of Endgame
Positions", with material-class selection ("Material: Random") and terminal verdicts
"**Congratulations You solved this Endgame!!**" / "**Failed, you lost your decisive
advantage.**" — plus "+ Show Help Moves … DTZ", i.e. tablebase (DTZ) hint moves. This
is the closest thing on the site to our loop: committed play from a curated real-game
position, judged against an objective, with rung-1 evidence available. But the verdict
string implies **win-conversion only** ("your decisive advantage") — no hold/save/draw
objectives found `[V]` — and there is no rewind, no preserved attempts, no comparison,
only presumably a next position ("Continue"). Same family as Chess Endgame Training
(`teardown-cet.md`), with a real-game corpus instead of a category tree.

**(d) Courses + "365Chess Coach" — guided memorization, ending in engine play.** `[V]`
`/view/shop/`: 258 courses (124 openings, 15 middlegame, 7 endgame, 15 "Chess
Legends"), €20–€112 with perpetual sale pricing, GM/IM authors (Damian Lemos, Marian
Petrov, Milovan/Miloje Ratkovic — a catalog resembling the iChess stable `[M]`).
`/view/365chess-coach/` `[V]`: each lesson unit has 4 steps — "Step 1: Review the
lesson over the board… Step 2: Make the moves on the board [it shows you what to move]…
Step 3: Play one side… answer, from memory… You will have hints… Step 4: …different
positions at random orders, **as flashcards**, and you will need to answer with the
right move." Plus a Repertoire Trainer ("drill the repertoire playing one side while
the computer replies with the moves on the theory") and "Practice vs the Computer —
**Start from the most important positions that are being selected for you on each
course, or even your own**, and play it against the computer… at different levels."
So the course stack does have an opening→play-out bridge — but the play-out opponent is
leveled Stockfish and nothing survives the game: no checkpoints, no branches, no
comparison `[V]` (absence in all copy).

**(e) Puzzles — lookup-adjacent tactic solving.** `[V]` `/puzzles.php` + FAQ cat 9:
"computer-generated puzzles from real games", Glicko-rated, standard/timed modes,
community tags, plus a compositions database. Free tier "limited to 25 puzzles a day"
`[V]`. Commodity shape.

## 4. Loop stages — the E1 checklist

- **Commit** — partial: endgame trainer and course practice positions are curated
  commitments; the rest is free lookup. `[V]`
- **Play the consequence** — yes in three places (play vs computer, endgame trainer,
  course practice-vs-computer), but always against leveled Stockfish. `[V]`
- **Rewind** — none found anywhere. The nav strings are only move-list navigation
  (MoveNext/MoveEnd); no retry-from-checkpoint in any asset. `[V]` absence-of-evidence
  on served copy.
- **Preserved branches / attempt comparison** — none. Saved computer games are a flat
  archive ("This game will be saved — Title (optional)"); nothing describes variations,
  attempts, or comparing tries. `[V]` same caveat.
- **Phase awareness / transitions** — the *site* is phase-aware as an IA (openings /
  middlegame courses / endgames as separate products) but no surface carries a game
  across a transition; the explorer stops where the corpus thins and the endgame
  trainer starts from a fresh position. `[V]`

Net: **lookup-first with disconnected play-out islands.** Zero of our three combined
claims (preserved branch attempts, checkpoint rewind with comparison, phase-trajectory
rehearsal) — and the play-outs that do exist use the opponent our rejected-list rules
out.

## 5. E1 impact

**WHITESPACE INTACT.** Commit ~partial · play-consequence ✅-with-wrong-opponent ·
rewind ❌ · preserved branches ❌ · compare ❌ · phase transitions ❌. 365chess is not
architecturally pointed at rehearsal; it is a reference work with practice annexes.
The interesting pressure is adjacent: it has quietly shipped the **lookup→play door**
("Play Position" from every explorer node; course positions into engine play) that our
loop treats as an entry ramp. What it proves is that the door alone is not the product
— nineteen years of explorer-with-play-button has not produced a rehearsal loop, which
is mild evidence *for* the thesis that the integration (branches, rewind, comparison,
honest objectives) is the missing product rather than the plumbing.

## 6. Corpus-source relationship — additive, redundant, or unusable?

Context correction (owner, 2026-08-14): the Lichess explorer pipeline **works** —
Gate 0 succeeded through operator authentication and
`content/candidates/priority/priority.json` holds real rating-band rows
(`docs/content-sourcing.md` §Opening explorer priority). 365chess is therefore not
evaluated as a rescue alternate but on whether its data adds a population we lack.

- **The population IS genuinely different** `[V]`: 365chess's Big DB is OTB
  tournament/master games (43k tournaments, tournament pages, crosstables `[P]` forum),
  updated weekly — likely TWIC-style ingestion `[M]`, unstated. Our explorer rows are
  online amateur games at explicit rating bands. Those answer different questions on
  the evidence ladder: band frequency says "what 1500s actually play" (rung 4,
  population = learners); master-game frequency says "what theory considers the main
  line" (rung 4, population = experts) — different witnesses, both legitimately
  citable, never interchangeable (`docs/content-sourcing.md` already forbids
  substituting populations).
- **But 365chess is unusable as a pipeline source.** 🔴 No API (null result). No bulk
  export; PGN download is supporter-gated and per-list `[V]`. `robots.txt` disallows
  the download endpoints and deep explorer paths `[V]`. And the ToS, read in full,
  contains **no license grant over the data at all** — no IP clause, no reuse terms,
  nothing (`[V]`, and its absence is itself notable: the ToS covers accounts, refunds,
  and warranties only). Chess moves are uncopyrightable facts `[M]` (standing analysis,
  jurisdiction-dependent; EU sui-generis database right could attach to the
  compilation `[M]` 🟡), but "probably legally extractable" is not a sourcing posture
  this repo accepts — `theory-sourcing.md`'s bar is CC0-or-ours, and 365chess is
  neither.
- **The additive population is already available license-clean.** The same
  `lila-openingexplorer` backend our working client talks to also serves a public
  `/masters` endpoint — "A database of master games" alongside "Rated games from
  Lichess itself" `[V]` (https://github.com/lichess-org/lila-openingexplorer, AGPL-3.0,
  already cited in `theory-sourcing.md`). **Verdict: 365chess is additive in
  population, unusable in practice, and redundant in the only way that matters** — if
  master-line evidence is ever wanted, the route is a second closed question against
  the existing explorer client's `/masters` endpoint, not a new source. (That would be
  a new evidence kind with its own population label; the current
  `explorer-move-share/v1` crossing is band-population-specific `[V]`
  `docs/content-sourcing.md`.)

## 7. Adoption verdict — the one good feature and its entry invariant

**The one good feature: the per-position evidence row — corpus frequency + last-played
recency + cached deep engine eval on a single explorer line, per named opening/ECO.**
`[V]` §2. Nineteen years of survival on pay-what-you-choose says this surface has
durable standalone value `[M]`.

- **Entry point:** rung 4 of the evidence ladder (`design/05` §region-4 ladder), as
  *display* discipline: 365chess demonstrates that frequency is more trustworthy when
  it carries **recency** ("Last Played 2026") and sits beside — not blended with — an
  engine eval labelled with its depth. Our explorer evidence already carries
  count/share and population; last-played recency is a cheap, honest addition to the
  same closed question. It enters through the grounded-claims invariant (every number
  carries source + population + window) and changes nothing about when evidence is
  shown (ADR-0006 timing untouched).
- **Second adoptable shape:** named-opening browsing as Learn-IA content — 365chess's
  ECO listing + per-opening guide pages (`/chess-openings/*`) are the reference-shelf
  version of our Learn surface's named-opening entry; the lesson is that the *browse
  path* (name → stats → games → play it) is a natural funnel whose last hop they leave
  as a bare Stockfish game and we make the actual product.
- **Not adoptable:** the trainer (popularity-graded recall — reads frequency as
  quality, the exact rung-4 classic error), the leveled-Stockfish opponent (rejected
  list), pay-what-you-choose pricing (orthogonal to any open question, noted only as a
  datapoint for Q2's pricing GAP `[M]`).

## 8. Why people love it, why people leave it

Signal is thin — no press, no app-store surface, few forum threads (itself a datapoint:
nineteen years old and near-invisible in discussion `[M]`). What was found:

**Love** `[P]` (Lichess forum thread, via extraction): the long tail of OTB history —
"I was delighted to find in their database many of my tournament games from the late
20th century, crosstables also, that I thought were long gone"; the toolset — "allows
you to create your own database, a lot of practical tools, much like lichess but more";
the pricing — "cost is very reasonable." The lovable core is the *archive*: it holds
ordinary tournament players' own OTB games, which Lichess (online-only) and ChessBase
(paid) don't serve at €20-you-choose.

**Hate/leave** `[P]`: (a) "there are no opponents, no online play, except Stockfish" —
it is a reference work, not a place to play (same thread); (b) **data quality** — a
Chess.com forum thread criticizes the opening database for "many games between
lower-rated players (below 1600 FIDE)" and duplicates, e.g. "17 identical 6-move games
for the smothered mate in the Caro-Kann" (search extraction; the Masters DB tier is
arguably the paid answer to their own noise `[M]`); (c) the site reads dated — stale
copy layers with three different database sizes (§1), Bootstrap-scaffold artifacts
("Dropdown / Action / Another action") visible in served pages `[V]`, and encoding
glitches in the FAQ `[V]`.

The love/hate shape matches the adoption verdict: what is loved is the evidence archive
(the thing worth mining); what is tolerated is the training ring around it (the thing
not worth copying). For our rung-4 discipline the duplicate-games complaint is a
concrete caution: **corpus counts inherit corpus hygiene**, and a frequency claim over
a deduplicated, population-labelled corpus is strictly stronger than a bigger number
over a noisy one — a point our closed-question explorer client already encodes
(min-100-games abstention) and should keep.

## 9. Residual uncertainty — only hands-on or contact can settle

1. Whether the Openings Trainer's opponent replies are corpus-sampled per move or a
   fixed line; and where it declares the "book end".
2. Endgame trainer interaction details: retry semantics after "Failed", whether
   defended by full-strength or leveled Stockfish, whether DTZ help costs the "solved"
   credit, and whether draw/hold objectives exist anywhere in its position set.
3. Where the weekly game feed actually comes from (TWIC or federation feeds `[M]`) and
   the real freshness/error rate of the DB.
4. Free-tier explorer depth limit (the "limited" explorer is unquantified on the
   supporters page).
5. Whether "Create your own Database" imports arbitrary PGN at useful scale (would make
   it a personal-corpus explorer — the supporter feature closest to being interesting).
6. Whether stored explorer evals are recomputed or years-stale (depth 45–50 suggests a
   one-time batch `[M]`).
