# Coverage sweep 2 — by notability, not by feature cluster

**Date:** 2026-08-14 · **Feeds:** Q1a, E1, `design/02` §Adoption posture, coverage-limits
rule in `design/research/README.md` · **Method status:** desk sweep. `[V]` = fetched the
product's own site/store/repo this pass (WebFetch or curl with page text extracted),
`[P]` = search-result/secondary snippets or third-party pages only, `[M]` = model
knowledge, unverified.

## Why a second sweep with a different method

Sweep 1 (`coverage-gap-sweep.md`) searched by feature cluster, which is novelty-tuned:
it surfaces whoever ships a surface *now*, and misses whoever has shipped it for twenty
years. The proof is 365chess.com — a high-traffic incumbent squarely inside sweep 1's
cluster 10, found by the owner, torn down separately (`teardown-365chess-desk.md`,
matrix CSV line 42; that teardown counts data rows and calls it row 41). This sweep
inverts the method: **enumerate the most-used chess
platforms and tools by notability/traffic/community mindshare, then check each against
the matrix.** Neither method is coverage alone; the union is (see Honest limits).

## Method

Notability list built from four angles, then every item verified by fetch or
citation rather than trusted from priors (several priors were wrong — noted inline):

1. **Traffic/rankings:** Similarweb/Semrush snippets (chess.com ~175M visits/mo, core
   competitors lichess.org, worldchess.com `[P]`
   https://www.similarweb.com/website/chess.com/), "best chess websites" roundups
   (chessify.me/blog, chessfort.com `[P]`).
2. **App-store charts (via roundups):** chess.com (50M+ downloads), Lichess, Real
   Chess, ChessKid, Shredder `[P]`
   (https://www.chess.com/blog/TVLAVIN/top-10-most-downloaded-chess-game-apps,
   https://www.houseofstaunton.com/blogs/chess-technology/best-chess-apps).
3. **Community mindshare:** alternativeto.net product graphs, Perpetual
   Chess/zwischenzug/64squares substacks, lichess forum threads, Trustpilot `[P]`.
   Direct r/chess thread fetches were blocked (see Searches that returned nothing).
4. **The owner-supplied old-guard checklist** — every item verified below.

Matrix rows added only for fetch-grounded, absent-relevant products (14 rows; row numbers here are CSV file lines 43–56, matching sweep 1's convention).
Lichess and Chess.com are censused, not torn down (too big for a sweep; verdicts on
whether they deserve full teardowns at the end of each census).

## The notability list — per-item verdicts

### Platforms and databases (the old guard proper)

| Product | Verdict | Matrix |
|---|---|---|
| **Chess.com** | The platform; ~175M visits/mo `[P]` Similarweb. Censused below. | rows 12, 40 (features only) |
| **Lichess** | The free platform. Censused below. | row 13 (one line) |
| **365chess.com** | Owner find; torn down by sibling dossier. Not re-covered here. | line 42 |
| **chessgames.com** | **Alive and absent-relevant.** Historical games database + kibitzing community: per-game comment threads, Game/Player/Opening of the Day, opening/endgame/sacrifice indices, collections, premium $39/yr `[V]` (curl, https://www.chessgames.com/ — front page dated today, current events listed). The *social annotation archive* shelf: 20+ years of human commentary tied to positions. No play of any kind. | **added row 43** |
| **Internet Chess Club (ICC)** | **Alive — prior "dead?" wrong.** Relaunched 2024 as web-only ICC 2.0 (Blitzin/Dasher retired) `[P]` (https://en.wikipedia.org/wiki/Internet_Chess_Club, https://japanchess.org/en/2024/09/icc-renewal-2/); today: play, Puzzle Quest, analysis, videos, free + membership tiers `[V]` (https://www.chessclub.com/). Legacy pro play server; no rehearsal semantics. | **added row 44** |
| **chess24** | **Dead — confirmed.** Merged into Play Magnus 2019, Chess.com bought PMG 2022, site closed 2024-01-31, domain redirects to Chess.com `[P]` (https://en.wikipedia.org/wiki/Chess24, https://thechessdrum.net/blog/2024/02/01/chess24-com-shuts-down/). No row. | dead |
| **FICS** | Name-drop: the free legacy server, minimal current mindshare `[M]`. No row. | — |
| **ChessBase (+ online/cloud)** | Matrix row 15 covers the desktop workstation, but **the row understates the web platform**: a ChessBase account bundles 12 web apps — Playchess (20k daily players), tactics training, Fritz Online play, Openings repertoire builder, 8M-game live database, video library, My Games cloud, studies, live tournaments `[V]` (https://account.chessbase.com/en). **Matrix correction recorded here** rather than a new row: ChessBase is also an online training/play suite, not only a Windows workstation. | row 15, corrected |

### Trainers and courseware (old guard + creator platforms)

| Product | Verdict | Matrix |
|---|---|---|
| **ChessTempo** | In matrix (row 10). Confirmed present; no re-verification needed this pass. | row 10 |
| **Chessable** | In matrix (row 11) + dedicated teardown (`teardown-chessable-desk.md`) already covers the parent-platform bot handoff beyond courses. Community love/hate on record: "some swear by it… others accuse it of promoting mindless memorization" `[P]` (https://64squares.substack.com/p/chessable-is-better-than-i-thought). | row 11 |
| **Chess King Learn / CT-ART** | **Alive and absent-relevant.** The deepest legacy tactics courseware: CT-ART 20 (levels 2–10), Chess King University (8 modules × 10 levels), 130+ courses, iOS/Android/web sync, per-course or all-access pricing `[V]` (https://learn.chessking.com/). CT-ART is the pre-web tactics-training brand `[M]`. Exercise cards, no played consequences. | **added row 45** |
| **Chessity** | **Alive and absent-relevant.** Gamified learning platform aimed at kids, schools and trainers (Dutch-first), real-time feedback robot "Chessto", school integration, mobile app launched March 2024 `[V]` (https://www.chessity.com/). Academy shelf (B5 adjacency) alongside Chessido (row 34). | **added row 46** |
| **ChessKid** | **Absent-relevant.** Chess.com's kids platform: 150+ video lessons, puzzles, safe play, classroom tools in 2,000+ schools, free + Gold `[V]` (https://www.chesskid.com/). App-chart notable; below our band but the academy funnel incumbent. | **added row 47** |
| **Chessly** | **Prior wrong: it is Levy Rozman's (GothamChess), not Rosen's or Naroditsky's** `[P]` (https://en.wikipedia.org/wiki/Levy_Rozman). 70+ opening/skill courses, practice vs "Levi" AI, XP/achievements, claims 1,327,556 users tried it, free trial + membership `[V]` (https://chessly.com/). Creator-scale courseware with a per-course bot-testing loop — the closest mainstream shape to "train the opening, then play it." | **added row 48** |
| **Dr. Wolf (Learn Chess with Dr. Wolf)** | **The sweep's biggest single find.** Chess.com-owned teach-during-play app: real-time explanations of moves and mistakes, spoken coaching in four coach voices, hints, **unlimited undos**, reviews past moves; 4.8★ from 27k+ ratings, free for 3 games then $5.99/mo / $39.99/yr, still updated (v3.13.0, June) `[V]` (https://apps.apple.com/us/app/learn-chess-with-dr-wolf/id1353041020). Love/hate: "excellent for beginners and intermediate players… for advanced players the lessons might seem overly familiar"; "not worth the subscription compared to free resources" `[P]` (https://thechessadvisor.com/app-review/learn-chess-with-dr-wolf/). Sweep 1's cluster 9 found Play Coach but missed its older, better-loved sibling. | **added row 49** |
| **ChessMood** | In matrix (row 24). Confirmed present. | row 24 |
| **Aimchess** | In matrix (row 25). **Alive** under Chess.com (via 2021 PMG acquisition, PMG→Chess.com 2022) `[P]` (https://www.chessdom.com/aimchess-is-acquired-by-play-magnus-group/, https://www.chess.com/news/view/chesscom-acquires-pmg). Hate signal on record: "shouldn't that sort of feedback be available to members already?" `[P]` (chess.com forum). | row 25 |
| **DecodeChess** | In matrix (row 26). **Alive** — Android app updated 2025-09-05; Chessify partnership ended Jan 2024 `[P]` (https://decodechess.en.uptodown.com/android, https://chessify.me/news/chessify-partnership-with-decodechess). | row 26 |
| **listudy** | In matrix (row 6). **Alive** — GitHub issues active into 2025 `[P]` (https://github.com/ArneVogel/listudy/issues). | row 6 |
| **Lucas Chess** | In matrix (row 14) — prior "matrix has it?" confirmed yes. | row 14 |
| **chesspuzzle.net** | **Absent, verdict without row** (Cloudflare-blocked both WebFetch and curl; no fetch grounding). Secondary sources: 200k+ puzzles from real tournament games organized as an adaptable 8-course skill tree, plus "Puzzle Inceptions" that simulate in-game evaluation decisions `[P]` (https://medium.com/getting-into-chess/absolutely-best-chess-puzzle-platform-a5dde17cf307, site meta). Tactics shelf we explicitly don't compete on; no new axis. | no row (blocked) |
| **Chess.com Play Coach / Practice** | Already matrix rows 40/12 with teardown (`teardown-chesscom-desk.md`). | rows 12, 40 |

### Prep, database and GUI tools (what serious players name)

| Product | Verdict | Matrix |
|---|---|---|
| **Chessify** | **Absent-relevant.** "The No. 1 cloud platform for engine analysis": Stockfish 18 to 1M kN/s, LCZero GPU servers, 9.7M-game DB, 6-piece Syzygy, scanner, ChessBase/Fritz/HIARCS/SCID plugins; claims 60k+ pro users, 300+ GMs, Caruana/Giri/Aronian ambassadors `[V]` (https://chessify.me/). The serious-prep analysis-rental shelf. | **added row 50** |
| **ChessMonitor** | **Absent-relevant.** Own-game analytics: link Chess.com/Lichess accounts, opening/progress dashboards, opponent scouting, FIDE-Elo estimation, 10M OTB game reference, iOS/Android, free + paid, small German team, Giri-endorsed per site copy `[V]` (https://www.chessmonitor.com/). Maps to our return/progress surface — it watches your games but never plays them. | **added row 51** |
| **OpeningTree** | **Absent-relevant, maintenance stalled.** Consolidated view of all your games (chess.com/lichess/GM/PGN) as an opening tree with win% per move; GPL-3.0, 472★ `[V]` (https://github.com/openingtree/openingtree — site itself is an unreadable SPA); alternativeto reports last commit Feb 2022 / "discontinued" `[P]` (https://alternativeto.net/software/openingtree). Long the r/chess default answer for "where do I lose in my openings" `[M]`. | **added row 52** |
| **chesstree.net** | Exists (prior uncertain): opening explorer + repertoire builder, Elo-banded databases (<900 → Masters), Stockfish 18, PGN import/export, membership model `[V]` (https://www.chesstree.net/). **No row — no new axis** over Chessbook/OpeningTrainer/365chess on an already-dense shelf. Kin: MyChessTree, Chesstrie `[P]`. | no row |
| **En Croissant** | **Absent-relevant.** Open-source cross-platform chess GUI: game reports (eval graphs, heatmaps), personal all-platform game database, integrated engine/database download manager, opening prep via integrated explorer; active Discord/GitHub `[V]` (https://encroissant.org/, /docs). The modern open-source successor shape to SCID — relevant to our AGPL/self-hosted audience. | **added row 53** |
| **SCID vs PC** | Alive, moderately active (v4.27; engine tournaments, tree analysis, FICS support) `[V]` (https://scidvspc.sourceforge.net/). **Verdict without row:** the local database/GUI shelf is already represented by Lucas Chess (row 14) and ChessBase (row 15); SCID adds no new capability axis. | no row (category proxy) |
| **Arena GUI** | Alive-ish: site current, "New: Arena 3.10beta for Linux," UCI/Winboard, Chess960, DGT boards `[V]` (curl, https://www.playwitharena.de/ — note broken TLS cert; .com redirects there). Same verdict as SCID: no row. | no row (category proxy) |
| **Nibbler** | Alive: real-time analysis GUI for Lc0 (works with Stockfish), 3.7k commits, GPL-3.0 `[V]` (https://github.com/rooklift/nibbler). Engine-analysis niche; no row. | no row (category proxy) |
| **Banksia GUI** | Alive, frequent releases: freeware GUI — play/analyze, tournaments, databases, opening books, engine dev tooling `[V]` (https://banksiagui.com/). No row. | no row (category proxy) |
| **HIARCS Chess Explorer, ChessX** | Name-drops, same shelf `[M]`. | — |
| **chessvision.ai** | **Absent-relevant (adoption-adjacent).** Scan chess positions from websites, books, images and video (Chrome/Firefox/Safari extensions, mobile apps, eBook reader), auto-finds YouTube videos matching the scanned position, Discord/Telegram/Reddit bots; Best Chess Startup 2020 `[V]` (https://chessvision.ai/). A capture-anything import front-end — the shelf our import/create surface would borrow from, not a trainer. | **added row 54** |
| **Forward Chess** | **Absent-relevant.** Interactive chess ebook store + reader (Quality Chess, New in Chess et al.; web reader at read.forwardchess.com, mobile apps, position search) `[V]` (https://forwardchess.com/). Book-with-live-board: reading, not rehearsal. | **added row 55** |
| **Everyman Chess** | **Standalone identity gone:** everymanchess.com now serves the New In Chess-branded shop (publishers menu: New In Chess, Quality Chess, Popular Chess, Chess Elevation) `[V]` (curl, https://www.everymanchess.com/) — consistent with the PMG→Chess.com consolidation `[P]` (https://en.wikipedia.org/wiki/Play_Magnus_Group). Publisher shelf; ebook delivery via Forward Chess/Chessable. No row. | consolidated |
| **Next Chess Move** | Name-drop: position→best-move web utility; engine-lookup shape, no training claim `[M]`. | — |

### Review tools and analytics (mindshare finds along the way)

| Product | Verdict | Matrix |
|---|---|---|
| **WintrChess** | **Absent-relevant.** wintrcat's free game review — successor to the abandoned open-source `freechess` (842★, "abandoned… moved on to build WintrChess, also open-source") `[V]` (https://github.com/WintrCat/freechess); paste a PGN, get Stockfish move classification + accuracy, positioned explicitly as the free alternative to Chess.com's paywalled Game Review, with a "Free Analyze with WintrChess" Chrome extension `[P]` (https://pythonknights.wordpress.com/2024/08/11/wintrcat-game-review/, Chrome Web Store). Love: free/unlimited; hate: "lacks feedback," classification-only `[P]`. | **added row 56** |
| **Chessigma, ChessRoots, WhyThisMove kin** | Name-drops from the same searches; commodity free-review/visual-explorer shapes `[P]`. | — |

### Dead or consolidated (verified, don't re-add)

- **chess24** — closed 2024-01-31 `[P]` (above).
- **Play Magnus app suite / Magnus Trainer** — Magnus Trainer removed from Google Play
  2024-04-24, no longer downloadable `[P]`
  (https://play.google.com/store/apps/details?id=com.playmagnus.development.magnustrainer);
  the Play Magnus bot-ladder app survives only as sideloads `[P]`.
- **Follow Chess** — wind-down, covered in sweep 1.
- **Aimchess/Chessable/New In Chess/Everyman** — alive but consolidated under
  Chess.com `[P]`.

### Engines (infrastructure, not matrix rows)

Stockfish and Leela/Lc0 top every "what do serious players use" answer but are
components, not competing products — already our own stack (`docs/engine-workers.md`).
**Shredder** is the one engine that is also a consumer product (desktop/mobile apps,
online play, daily puzzles, Chess Tutor; 19× computer-chess world champion branding)
`[V]` (https://www.shredderchess.com/) — verdict: commodity engine-app shelf, no
training loop, no row.

## Lichess — whole-platform feature census (not a teardown)

Never censused as a platform; matrix row 13 is one line. Source: the platform's own
features page `[V]` (https://lichess.org/features) unless labeled.

**Feature census vs our surface map** (`design/03` areas in bold):

- **Play:** standard + 8 variants; UltraBullet→Correspondence; unlimited
  arena/Swiss tournaments; simuls; play vs Stockfish; community bots incl. Maia
  (row 13); challenge from custom position via board editor. *No drill modes, no
  objectives, no resistance design.*
- **Review/explore:** analysis board; deep server analysis (40 games/day free);
  unlimited cloud eval; **"Learn from your mistakes"** (retry each mistake against
  the eval — the platform's one re-entry loop, single-move, no opponent); **studies**
  (unlimited shareable persistent analysis with variation trees — manual preserved
  branches, no play-out, no attempts semantics); opening explorer (6B games +
  personal explorer); 7-piece tablebase; game import/advanced search. *Variation
  trees exist; attempts, checkpoints and comparison do not.*
- **Learn/return:** puzzles from real games (unlimited, themed) + Streak/Storm/Racer;
  basics lessons; coordinates; Practice drills vs engine (endgame/checkmate sets)
  `[M]` (practice section not on the features page); chess insights (aggregate
  stats); coach directory. *SRS absent; progress is stats, not scheduling.*
- **Live/community:** broadcasts (official relays), Lichess TV, streamers page,
  teams, forum, messaging. *Spectating without any training tie-in.*
- **Create:** studies as authoring; broadcasts; board editor; **open infrastructure**
  — CC0 game database, APIs (our corpus source, R02).

**Top-3 loved (community evidence):** (1) everything free, no ads, no tracking, open
source — the identity feature `[P]`
(https://www.alternativeto.net/software/lichess-org/about/); (2) the all-in-one
study/analysis toolchain — "the closest thing to a one-stop shop: play, review, and
study all in one place" `[P]` (https://siddhesh.substack.com/p/chesscom-vs-lichess);
studies as a teaching medium have their own genre of praise `[P]`
(https://zwischenzug.substack.com/p/the-4-lichess-studies-i-make-for); (3) unlimited
puzzles/analysis that chess.com paywalls `[P]` (same sources).

**Top-3 hated:** (1) the new mobile app's missing features — learn-from-mistakes,
tournaments, interactive studies, request-analysis `[P]`
(https://lichess.org/forum/lichess-feedback/beta-app-features-missing-learn-from-mistakes-and-follow-friend
and sibling threads); (2) smaller player pool / ratings that don't translate ("way
less popular… harder to tell what your ELO means") `[P]` (siddhesh substack);
(3) navigation/gameplay bugs and sparse social-lesson layer relative to chess.com
`[P]` (https://chrome-stats.com/d/org.lichess.mobileV2/reviews).

**Deserves a full teardown?** **Yes, scoped:** hands-on of exactly three surfaces —
studies (the manual ancestor of preserved branches), Learn-from-your-mistakes (the
mainstream single-move re-entry loop), and Practice drills — because it is free,
hands-on is cheap, and it is simultaneously our infrastructure supplier. A
whole-platform teardown is not needed; the census above bounds it.

## Chess.com — whole-platform feature census (not a teardown)

Matrix has two feature rows (Practice 12, Play Coach 40) and one teardown of a single
feature (`teardown-chesscom-desk.md`). Never censused whole. Sources: membership page
`[V]` (https://www.chess.com/membership), prior teardowns/rows `[V]`, labeled `[P]/[M]`
otherwise.

**Feature census vs our surface map:**

- **Play:** fastest matchmaking in chess, biggest pool (~175M visits/mo `[P]`
  Similarweb); rated play all controls; variants incl. 4-player; bots with
  personalities; clubs, tournaments, Titled Tuesday; **Play Coach** (row 40 — advice
  during play); Daily/correspondence. *Scale is the feature; no rehearsal
  semantics anywhere.*
- **Review/explore:** **Game Review** — accuracy, move classification, coach-voiced
  explanations, "Key Moments" post-game walk-through fully released `[P]`
  (https://www.chess.com/forum/view/community/new-feature-key-moments-post-game-analysis-fully-released);
  unlimited only on premium `[V]` (membership page); free analysis limited; opening
  explorer (premium); Insights analytics `[M]`. *Read-mostly; whether review offers
  a play-from-position re-entry ("practice this position") must be verified in a
  teardown — flagged, not asserted `[M]`.*
- **Learn/return:** 500k+ puzzles (rated/rush/battle) — free tier capped at a few
  per day `[V]` (membership) `[P]` (Trustpilot complaints); thousands of lessons
  (premium); **Coach Practice** "personalized guidance from a coach" listed as a
  premium feature `[V]` (membership page); Solo Chess/vision minigames `[M]`.
- **Live/community:** events broadcasting + commentary at the largest scale; clubs;
  forums; streamer ecosystem; Classroom `[P]` (sweep 1 cluster 4).
- **Create:** custom positions/challenges (row 12); Classroom lesson tools `[P]`.
  *No user-authored content economy on the platform itself — that lives in sibling
  Chessable.*
- **The satellite constellation** (all Chess.com-owned, each covering a shelf):
  Chessable (courses/SRS, row 11), **Dr. Wolf** (teach-during-play, row 49), ChessKid
  (kids/schools, row 47), Aimchess (analytics, row 25), New In Chess/Everyman
  (publishing) `[P]` (https://www.chess.com/news/view/chesscom-acquires-pmg). The
  platform strategy is acquisition-per-shelf — the breadth thesis executed by M&A.

**Top-3 loved:** (1) instant games at any rating, any time — pool + matchmaking speed
`[P]` (siddhesh substack); (2) the content/events ecosystem — lessons, news,
broadcasts, personalities `[P]` (alternativeto listing); (3) Game Review's
approachable coach-voiced post-mortem — the mainstream improver's review habit `[P]`
(Key Moments announcement + app reviews; strength consistent with row 40 teardown).

**Top-3 hated:** (1) paywalls on improvement basics — "pay $120/year just to get more
puzzles and game reviews" `[P]` (https://www.trustpilot.com/review/chess.com);
(2) monetization pushiness — constant upsell of membership/Chessable/lessons `[P]`
(same + steam/forum threads); (3) cheating anxiety in online pools `[P]` (Trustpilot).

**Deserves a full teardown?** **Yes — the strongest yes on the board.** It is the
mainstream definition of every surface we ship, the two shipped teardowns cover only
Practice and Play Coach, and the census leaves load-bearing unknowns: whether Game
Review re-enters play, what Coach Practice actually is, and how Review→Practice→Lesson
recommendations chain into a loop. If Chess.com quietly connects review to re-entry,
that is direct E1 pressure; nobody has checked.

## Top 5 absent products deserving full teardowns (ranked by the three questions)

1. **Dr. Wolf** — (E1) the closest mainstream product to "it will rewind and explain":
   unlimited undo + explanation during play, at 27k-rating scale — but undo erases the
   attempt, nothing is preserved, and advice arrives mid-play; (entry) the
   ambient-companion presence and spoken-voice delivery enter through §3b's
   name-don't-recommend line — the beloved *tone* with our grounding; (love/hate)
   rich, cited, and instructive: loved for patience/explanations by beginners,
   dropped for shallow depth past ~1200 — exactly the ceiling our band starts at.
2. **Chessly** — (E1) no; (entry) per-course "test against the bot" is our
   opening→play-out edge at creator-audience scale, and its XP/achievement loop is an
   adoption-posture candidate for return/progress; (love/hate) unverified beyond
   marketing — 1.3M claimed users deserve a real check of what retains them.
3. **WintrChess** — (E1) no; (entry) free, open-source game review is the resentment
   valve for chess.com's paywall — the review shelf's default budget answer, and our
   review surface enters the same door with re-entry attached; (love/hate) loved
   free-vs-paywall, hated "lacks feedback" — the exact gap grounded explanation +
   re-entry fills.
4. **En Croissant** — (E1) no; (entry) the audience overlap: open-source, self-hosted,
   all-your-games-in-one-place — the 9/10 self-host verdict's natural constituency;
   (love/hate) GitHub/Discord community worth reading for what a modern OSS chess
   tool's adopters demand.
5. **ChessMonitor** — (E1) no; (entry) progress/return analytics done as a product —
   what our B7 surface looks like when it is the *whole* product, and the
   opponent-scouting angle we don't have; (love/hate) cheap to collect from app-store
   reviews.

Runners-up: **ChessKid/Chessity** (academy funnel, below-band), **Chessify**
(pro-prep rental, orthogonal), **ICC** (legacy brand mechanics, low feature overlap),
**chessgames.com** (social annotation archive — mine for the community-commentary
pattern if a kibitz-like surface is ever considered).

## Searches that returned nothing

- **Reddit direct access** — WebSearch rejects reddit.com as a domain filter, and both
  old.reddit and the JSON API serve a login wall to non-browser fetches `[V]`
  (attempted this pass). All "community mindshare" evidence is therefore proxied
  through alternativeto, substacks, lichess/chess.com forums and Trustpilot — a
  recorded weakness, not a shrug.
- **"Chessly review reddit"** — no thread-level results; only Chessable-adjacent
  commentary surfaced `[V]` (search recorded).
- **Live app-store charts** — no directly enumerable top-chess chart was fetchable;
  chart claims rest on 2025 roundup articles `[P]`.
- **A notability-ranked product that ships preserved branch attempts** — none found;
  the closest are Lichess studies (manual trees, no opponent) and Dr. Wolf
  (undo-erases-attempt). E1's whitespace survives its second sweep.

## Honest limits

- **What this method misses that cluster search catches:** anything new, small, or
  weird — notability lags shipping by years; ChessMotive, Chess2Story, Chessvia and
  the whole sweep-1 crop are invisible to rankings and "best of" lists. The two
  sweeps are complements; neither is coverage alone, and both are snapshots.
- Desk only; every `[V]` is the product's own copy or repo. Teardowns must follow for
  the top 5.
- Reddit was unreachable (above); r/chess and r/chessbeginners consensus is the one
  angle the method prescribes that this pass could not directly execute.
- Blocked fetches: chesspuzzle.net (Cloudflare, curl included), Google Play Dr. Wolf
  page (truncated; App Store used instead), wintrchess.com and openingtree.com
  (unreadable SPAs; grounded via GitHub instead), playwitharena.de (broken TLS,
  curl -k used).
- Liveness verdicts for chess24, Magnus Trainer, OpeningTree's maintenance, Aimchess
  and DecodeChess rest on secondary sources `[P]`, not operator statements fetched
  first-hand.
- English/US-only search (WebSearch is US-only); the Indian and Chinese platform
  ecosystems (e.g. chessbase.in community tools) were not swept — still an open flank.
- Census claims about Lichess Practice and Chess.com Insights/Solo Chess carry
  `[M]` — the features pages don't enumerate them; the recommended teardowns close
  this.

## E1 status

**Intact after a second, method-inverted sweep.** The old guard holds databases,
courseware, GUIs, ebooks and analytics; none of it ships preserved attempts,
checkpoint rewind with comparison, or phase-trajectory rehearsal. The two real
pressure points are both Chess.com-owned and both partial: Dr. Wolf normalizes
rewind-and-explain (as undo, unpreserved, beginner-band), and the unverified
possibility that Game Review re-enters play is now flagged for the Chess.com
teardown. Sharpest structural read: the market's breadth strategy exists — it is
Chess.com's acquisition constellation — but the integration is corporate, not
in-product; the loop remains unassembled everywhere.
