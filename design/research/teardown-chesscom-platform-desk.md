# Teardown: Chess.com as a whole platform — desk research

- Date: 2026-08-14
- Feeds: Q1a / E1 (the sweep-2 census flagged Game Review re-entry and Coach Practice as
  load-bearing unknowns); Q2 (paid-competitor pricing); `design/02` §Adoption posture.
  Builds on `coverage-sweep-2-notability.md` (whole-platform census) and
  `teardown-chesscom-desk.md` (2026-08-11 Practice-feature teardown — its findings are
  cited, not duplicated).
- Method: desk research, no account, no hands-on. Raw fetches: Chess.com Help Center
  articles 8584089 (How does Game Review work), 10328363 (Game Review on the app),
  1363 (What does each level of membership get me), 8583825 (analysis board); chess.com
  news/blog posts (Game Review release, Play Coach announcement, Dr. Wolf joins
  Chess.com, Komodo acquisition, "Meet the New Analysis: Game Report, Retry Mistakes
  And More!"); forum threads (Retry-is-a-puzzle, "You just gutted my way of improving");
  mobeigi.com regional-pricing case study (US price table dated 2025-10-01);
  unstar.app 2026 five-app ranking. `[V]` = fetched and read this pass (or a prior
  labeled pass of this repo); `[P]` = search-extract/secondary; `[M]` = model knowledge.
- **Fetches/searches that returned nothing or failed**: support article 8609317
  ("What is Game Review") → 404 (superseded by 8584089); `trustpilot.com/review/chess.com`
  → HTTP 403 to fetch (Trustpilot quotes therefore stay `[P]`, via sweep-2 citation and
  search snippets); `chess.com/membership` renders tier prices in a JS container empty
  to fetches (prices grounded via the mobeigi table instead); searches for a Game
  Review "play on from here against an opponent" feature returned only the single-move
  Retry and the manual Self-Analysis → Practice-vs-Computer chain; searches for
  preserved attempts / attempt history on any platform surface returned nothing —
  consistent with the 2026-08-11 teardown's evidence of absence.

## 1. What it is

**The largest chess platform (~175M visits/mo `[P]` Similarweb, via sweep 2), a
freemium ecosystem whose improvement features are the paywall, plus a constellation of
acquired single-shelf products.** The census (`coverage-sweep-2-notability.md`) mapped
the surfaces; this teardown resolves the three flagged unknowns: Game Review re-entry,
what plays out vs narrates, and whether the M&A breadth strategy integrated.

## 2. Game Review — the E1 unknown, resolved

**Verdict: after the review you can NOT play from a reviewed position against an
opponent inside Game Review. The only in-review interaction is "Retry" — a single-move
guess-the-move exercise. Play re-entry exists only by leaving review for the analysis
board and manually invoking Practice vs Computer, with no tie back and no preserved
attempts.**

- What review shows `[V]` (support 8584089): accuracy 0–100 ("how accurately you
  played according to the engine's evaluations"), move classifications (Brilliant,
  Great, Best, Excellent, Good, Book, Inaccuracy, Mistake, Miss, Blunder), an advantage
  graph, coach one-liners with optional audio narration, and Key Moments ("critical
  moves that significantly influenced the game outcome"). Key Moments is fully released
  as a post-game walk-through `[P]` (chess.com forum announcement, via sweep 2).
- **Retry semantics** `[V]` (support 8584089): "The Retry function allows you to replay
  a specific position and attempt to find the best move yourself." If correct, "you'll
  see what your positional score would have been"; if not, "the Coach will provide
  feedback on your selected move." The app article `[V]` (support 10328363) matches:
  Retry "allows you to replay the position to try to find the best move," with coach
  feedback on a poor attempt. The launch blog `[V]`
  (chess.com/blog/News/meet-the-new-analysis-game-report-retry-mistakes-more) frames it
  as multiple attempts per mistake position with engine guidance — "Even if you find
  the right move and aren't sure *why* it's right, the engine can guide you forward,
  until all is revealed." **No source describes an opponent playing on after the found
  move.** It is a one-ply puzzle stapled to the review.
- Users read it the same way `[V]` (forum, "Why the new 'Game Review' 'Retry' button is
  a puzzle and why that is bad"): the OP wants it moved — "The Puzzle section already
  exists. If the developers want to allow a player to retry their mistakes, put that
  capability here instead of inserting an unnecessary cost to Game Review." Moderator
  Martin_Stahl's answer is a toggle to hide it ("You can turn on **Show Best Moves**
  and it won't show **Retry**"), not a play-out.
- **The manual re-entry chain** (the only road from a reviewed position to actual
  play): open the game in Self-Analysis, step to the position, then "You can click the
  'Practice vs Computer' icon on the very bottom and play the position against the
  computer!" `[V]` (support 8583825). That surface is the one the 2026-08-11 teardown
  tore down: takeback-then-branch reported broken, "the original game is not
  preserved," each retry overwrites the line
  (`teardown-chesscom-desk.md` §Q1, all `[V]`). Nothing links the practice session back
  to the review, and no attempt survives.
- **Gating, verified precisely.** Free: "1 full game review analysis per day" `[V]`
  (support 1363), independently confirmed by a user mid-complaint — "I just tested it
  out, and it still allows me to do one free game review per day" `[V]` (forum, May
  2024). Unlimited Game Review starts at Platinum; **coach explanations on all moves
  are Diamond-only** — "Unlimited Game Review PLUS get coach explanations on all moves"
  `[V]` (support 1363; consistent with the release article's "Diamond members also
  receive unlimited access to Coach explanations" `[V]`
  chess.com/news/view/chesscom-releases-new-game-review). Retry Mistakes is also
  tiered: 1/day below Diamond, unlimited on Diamond `[V]` (launch blog; dated — see
  §8). US prices (table dated 2025-10-01) `[P]`
  (https://mobeigi.com/blog/economics/chesscom-regional-pricing/): Gold $6.99/mo ·
  $49.99/yr; Platinum $10.99/mo · $79.99/yr; **Diamond $16.99/mo · $119.99/yr**.
  **The sweep's dominant Trustpilot complaint — "$120/yr to learn from your mistakes" —
  is therefore numerically exact:** the explained review is a $119.99/yr feature, and
  the free tier's whole improvement stack is 1 review + 3 puzzles + 1 daily lesson +
  1 Coach game/month + a 4-move opening explorer `[V]` (support 1363).

## 3. Coach and practice surfaces — what plays OUT vs what narrates

| Surface | Plays out? | Narrates? | Attempts preserved? |
|---|---|---|---|
| **Game Review coach** | ❌ read-only + 1-ply Retry | ✅ prose/audio per move `[V]` 8584089 | ❌ |
| **Play Coach** | ✅ it is the opponent | ✅ during play | ❌ takebacks unpreserved |
| **Practice (drills/openings/master games/custom)** | ✅ vs live engine | ❌ outcome feedback only | ❌ retry overwrites |
| **Practice vs Computer (from analysis)** | ✅ from any position | ❌ | ❌ "original game is not preserved" |
| **Custom Challenges** | ✅ vs humans | ❌ | ❌ (normal games) |
| **Self-Analysis board** | ❌ engine evaluates, never plays | ✅ engine lines | ✅ variations — but no opponent |

- **Play Coach** narrates *and* plays `[V]`
  (chess.com/news/view/announcing-play-coach): "Our first-ever AI opponent that
  actually **teaches you** while you play"; "He'll praise your good moves"; "Whenever
  you're unsure about your move, you can use the Hint button"; "Coach also lets you
  take back moves and try again"; four coaches "each with their own looks and voice";
  toggles for move suggestions, threats, eval bar. Free members get "One game against
  the Coach per month," Gold+ unlimited `[V]` (support 1363). It recommends moves
  during committed play — the contamination `05` §3a/§3b forbids (matrix row 40) — and
  its take-back is an undo, not a fork.
- **Practice** plays out against a live engine with outcome-framed goals; documented in
  the 2026-08-11 teardown (all `[V]` there). **Custom Challenges** are open human
  challenges with "the rating range of your opponent... a custom opening" `[P]`
  (support 8648672 search-extract) — pairing configuration, not rehearsal.
- **Preserved attempts anywhere on the platform: none found.** The one surface that
  keeps variations (Self-Analysis) is the one where nothing plays against you; every
  surface with an opponent destroys the prior line on undo/retry
  (`teardown-chesscom-desk.md` `[V]`; re-searched this pass, nothing new).

## 4. The acquisition constellation — breadth executed by M&A

Verified purchases, oldest first:

- **Komodo engine, 2018-05-24** `[V]`
  (chess.com/news/view/chess-com-acquires-komodo...): "GM Larry Kaufman and Mark
  Lefler joined Chess.com as part of the entire Komodo team." **Integrated**: became
  the platform's playing computers ("Computer1"–"Computer20") `[V]` same article.
- **Dr. Wolf, 2020-11-11** `[V]` (chess.com/news/view/dr-wolf-joins-chess-com):
  the teach-during-play app and its maker David Joerg joined; "we hope to bring this
  amazing app to our users and to improve the chess coaching options available in the
  Chess.com main site and apps." **Left standalone** (still a separate subscription
  app, `teardown-drwolf-desk.md`); the promised main-site coaching improvement shipped
  later as the in-house Play Coach `[M]` inference — no source ties them.
- **Play Magnus Group, closed 2022-12-16** `[P]`
  (https://www.chess.com/news/view/chesscom-acquires-pmg,
  https://en.wikipedia.org/wiki/Play_Magnus_Group): brought chess24, Chessable,
  Aimchess, New In Chess, Everyman Chess, iChess.net, GingerGM, the Play Magnus app
  suite, Magnus Academy, and the Champions Chess Tour.

**What happened to each shelf** (integration scorecard):

| Property | Fate |
|---|---|
| Komodo | integrated (platform bots) `[V]` |
| chess24 | **killed** — closed 2024-01-31, domain redirects `[P]` sweep 2 |
| Play Magnus app suite / Magnus Trainer | **killed** — delisted 2024-04 `[P]` sweep 2 |
| Everyman Chess | **absorbed** — site now the New In Chess shop `[V]` sweep 2 curl |
| Chessable | standalone (courses/SRS; one-way bot handoff to Chess.com, no tie-back — `teardown-chessable-desk.md` `[V]`) |
| Aimchess | standalone, minimally maintained: outage threads 2024, ~98k visits/mo mid-2025 `[P]` (chess.com forums, semrush snippet); community asks "shouldn't that sort of feedback be available to members already?" `[P]` sweep 2 |
| Dr. Wolf | standalone app, own subscription `[V]` App Store |
| ChessKid | homegrown, standalone kids platform `[V]` sweep 2 |

**Verdict: the breadth thesis executed with money, not with integration.** Each
acquisition bought a shelf; two were killed, one absorbed as a brand, and the live ones
remain separate products with separate subscriptions and (at most) one-way handoffs.
Nothing connects review → re-entry → attempt across the constellation, and the
love/hate evidence (§5) shows the strategy's user-visible residue is paywall
resentment, not loop assembly. For our thesis this is the strongest available evidence
that *owning* every piece does not assemble the loop — orchestration is a product
decision, not a portfolio side effect.

## 5. Love and hate

**Top-3 loved:**

1. **The pool** — "Chess.com has the largest player base (so the fastest matchmaking
   and the most events, bots, and content)" `[P]`
   (https://unstar.app/blog/chess-com-lichess-play-magnus-chesskid-dr-wolf-chess-apps-ranked-2026);
   same finding in sweep 2's census `[P]`.
2. **Polished content/ecosystem** — "the most polished lessons and puzzles in the
   category" `[P]` (unstar); events, personalities, news `[P]` (sweep 2).
3. **Game Review as the improver's post-game ritual** — the approachable coach-voiced
   post-mortem, auto-offered after every game ("a pop-up window with the option to
   rematch your opponent, start a new game, or run the Game Review" `[V]` support
   10328363); a user credits the free version alone for 900→1250 `[V]` (forum, §below).

**Top-3 hated:**

1. **Paywalled improvement basics.** "You just gutted my way of improving and put it
   behind a paywall. Thanks for nothing" — thread title; the OP: "I always learned with
   the free review and resulting game analysis, showing me bad and good moves," crediting
   it for 900→1250 `[V]`
   (https://www.chess.com/forum/view/game-analysis/you-just-gutted-my-way-of-improving-and-put-it-behind-a-paywall-thanks-for-nothing).
   The 2026 ranking: "limits you to a handful of puzzles a day then demands Diamond.
   The free version is a demo for the paywall" `[P]` (unstar). Trustpilot's "$120/year
   just to get more puzzles and game reviews" `[P]` (sweep 2) — now verified exact (§2).
   Notably, the community's named escape valves in that thread are our neighbors:
   "use lichess, everything there is free" and wintrcat's "free unlimited game review
   system" (WintrChess, matrix line 56) `[V]` same thread.
2. **Monetization pushiness / subscription trouble** — "difficult to manage, often
   leading to unexpected charges," constant upsell `[P]` (Trustpilot via search
   snippets; sweep 2).
3. **Ads and cheating anxiety** — "ads in the free tier" `[P]` (unstar); cheating
   complaints `[P]` (Trustpilot, sweep 2).

## 6. E1 impact

**WHITESPACE INTACT — and sharpened.** The census's feared scenario ("if Chess.com
quietly connects review to re-entry, that is direct E1 pressure") is now checked and
false: Game Review's only interaction is a one-ply Retry puzzle; play re-entry is a
manual, unlinked, attempt-destroying chain across two other surfaces. Loop stages,
platform-wide: commit ✅ (drills declare outcomes) · play-the-consequence ✅ (Practice,
Play Coach) · rewind ❌ (undo everywhere, fork nowhere) · preserved branches ❌ ·
compare ❌ · phase trajectory ❌. Every piece exists; nothing connects them; every
rewind destroys history. The 2026-08-11 verdict — "orchestration is the product" —
extends from Practice to the entire platform *and* to the acquisition portfolio (§4).

Second-order: (a) the paywall resentment (§5) means the mainstream improver's
strongest current pain sits exactly on the surface our loop enters through — review
that re-enters play; (b) Retry Mistakes' existence and its Diamond gating prove
platform-recognized demand for re-entering your own mistakes, monetized at $119.99/yr
in a one-ply form.

## 7. Adoption (via `design/02` §Adoption posture)

The steal is the **post-game ritual**: review auto-offered the moment the game ends,
walkable Key Moments, coach voice — the habit loop is proven at ~175M-visit scale. Our
version enters through the invariants intact: the walk's every moment is a door back
into play (attempts preserved, `05` §1), explanations grounded (rungs 0–5), and it
arrives after the game — commit-before-learning is untouched. Secondary steals: the
one-click "Practice vs Computer from any analysis position" affordance (ours with fork
semantics instead of overwrite), and outcome-framed drill titles ("Holding The Draw")
already consonant with win/hold/save. What we deliberately do not adopt: move
recommendations during committed play (Play Coach's shape; `02` worked contrast) and
the demo-for-the-paywall free tier.

## 8. Residual uncertainty — hands-on or better sources needed

1. Whether the Retry Mistakes tier limits (1/day below Diamond) still match the live
   product — the launch blog is old; support 1363 lists tiers without Retry counts.
2. Whether the Practice-vs-Computer takeback bug (2026-08-11 teardown) is fixed, and
   current mobile parity for the Self-Analysis → Practice chain.
3. Whether Key Moments selection is eval-swing-based (almost certainly `[M]`) — the
   post-mortem detector `05` §5a rejects for live use.
4. Coach Practice vs Play Coach naming: support 1363's "games against the Coach" is
   read here as Play Coach; if "Coach Practice" is a distinct surface it was not
   findable from desk.
5. Whether any Aimchess capability was folded into Insights (plausible `[M]`,
   unverified).
6. Trustpilot's current rating/count (403-blocked; quotes remain `[P]`).
