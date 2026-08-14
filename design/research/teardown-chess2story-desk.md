# Teardown: Chess2Story (chess2story.com) — desk research

- Date: 2026-08-14
- Feeds: Q1a / E1; the game-story surface (BACKLOG 2026-08-14); the in-flight
  `rfc/game-import-and-story.md`, whose differentiator — "slides you re-enter and
  replay" vs "a story you read" — this teardown checks against what Chess2Story
  actually ships.
- Method: desk research, no account, no generation run. chess2story.com is a Next.js
  site whose marketing and famous-game pages are server-rendered — raw `curl` fetches
  of `/`, `/about`, `/contact`, `/features`, `/features/stories`, `/pricing`, `/lab`,
  `/games`, `/players`, `sitemap.xml` (158 URLs), and the full Opera Game page
  (`/games/opera-game`) yielded complete literal copy. Story-instance pages
  (`/games/<game>/stories/<world>`) render their body client-side: the served HTML
  carries only title + meta, so **no generated story prose was readable from desk**
  beyond the one marketing teaser. `[V]` = literal string from a fetched page;
  `[P]` = secondary/extracted (search-result snippets of their SEO copy); `[M]` =
  model knowledge or inference, unverified.
- **Fetches/searches that returned nothing or failed**: story body text (client-
  rendered — only titles like "When Avalon's Light Broke the Shadow Throne" and meta
  descriptions ship in HTML); sitemap slug `/games/opera-game/stories/ancient-chinese`
  soft-404s ("This page wandered off the board") though listed — sitemap is partly
  stale; searches for Chess2Story on reddit/lichess forums/press/Product Hunt returned
  **zero third-party coverage of any kind** — no reviews, no launch thread, no founder
  or company name anywhere (the only contact is `support@chess2story.com`; footer says
  "Est. 2026"); no mention of which LLM or image model is used, anywhere including the
  Lab.

## 1. What it is

**A "narrative engine for chess": paste a finished game and it renders the same moves
as fiction (chaptered story in one of 11 themed worlds), a comic book (AI-drawn, 22
styles), a no-fiction "coach review", and optionally audio narration — sold per
artifact. A fan-shelf rendering product, not a training product: there is no opponent
anywhere on the site.** `[V]` all from fetched pages.

- Self-description `[V]` footer/every page: "Chess, told as a story. Every game
  becomes a comic book, a chivalric tale, or a grandmaster's review — three renderings
  of the same moves, handcrafted page by page." Tagline: "A narrative engine for
  chess."
- The three renderings `[V]` `/about`: **A story** ("the pieces become characters …
  the game becomes a chaptered tale with its own prologue and epilogue"); **A comic
  book** ("storyboarded and drawn page by page in a chosen comic style … read it on
  screen or order it as a printed book"); **A coach review** ("A straight-faced
  analytical walkthrough: the opening, the critical moments, the lesson to take away.
  No fiction, just chess."). Plus: "Stories can also be narrated as audio."
- Content on offer `[V]` `/games`, sitemap: a curated catalogue of 17 famous games
  (Opera Game, Evergreen, Fischer–Spassky 6, Kasparov's Immortal, Gukesh–Anand,
  Bill Gates–Carlsen…), each with pre-rendered stories/comics in multiple worlds, plus
  a `/players` directory ("from world champions to streamers").
- Maker: unknown. No names, no company, no about-the-team — an anonymity that itself
  is notable for a product this polished `[V]` (absence across all fetched pages).

## 2. How do they select moments, and is anything grounded? — the RFC's first question

**Selection is engine-driven by their own account; the fiction is explicitly
quarantined as fiction; and the historical record under it is verified with real
provenance discipline. Chess2Story is NOT the taketaketake shape.**

- **Selection** `[V]` `/about`: "Paste a game — a PGN, or a link — and **the engine
  analyses every move, finds the turning points**, and renders the same game three
  ways." The `/features/stories` pipeline diagram `[V]`: "1 **Parse Game** — PGN
  analysis and move evaluation · 2 **Build Characters** — each piece gets a name and
  personality · 3 **Find Storylines** — drama arcs, sacrifices, turning points · 4
  **Write Chapters** — AI narrates the story chapter by chapter." So: engine
  evaluation feeds turning-point selection feeds LLM narration. Whether "turning
  point" = eval swing is not stated; almost certainly `[M]`.
- **The grounding posture — their own words** `[V]` `/about`: "**The moves are real.
  The fiction is honest about being fiction.** Underneath every story sits the actual
  game: real analysis from a real engine, real turning points, the verified score. …
  the game is the score, and each world performs it differently."
- **Provenance is shipped, not just claimed.** The Opera Game page `[V]` carries a
  "✓ VERIFIED SCORE" badge and a "Machine-checked — The score" section: "Three
  independent transcriptions agree on all 33 plies; the sequence replays legally by
  machine to the mating position. Verified 2026-08-03," citing Max Lange 1860 via
  Edward Winter's Chess Notes, Wikipedia, and a lichess study raw PGN. It even hedges
  the date: "our PGN header reads Date 1858.??.?? — the year is certain, the day is
  not, and **we would rather be honest than traditional**." The famous
  "2 November 1858" is called out as impossible against contemporary opera listings.
- **The Lab** `[V]` `/lab`: "Everything on Chess2Story is built on research you can
  read." Comic styles are "a contract, not an adjective," derived "from public-domain
  plates and distilled into rules a machine must follow — **and a test can fail**";
  18 published art-history pieces. `/about`: "prose goes through discipline passes
  that **ban the stock phrases machine-written text reaches for**."
- **What remains freestyle**: the narrative prose itself is LLM-written fiction
  ("AI narrates the story chapter by chapter" `[V]`; comics use "AI-generated art"
  `[V]` `/features`) — but it is *labeled* fiction, sold as an "avowed
  transformation." The un-assessable part is the **coach review** rendering: "No
  fiction, just chess" is a chess-truth claim, its prose generator is undisclosed, and
  no sample was readable from desk. That is where their ADR-0005 exposure lives `[M]`.

## 3. Any interactivity — can you enter a position from the story? — the RFC's second question

**Interactivity exists and is more than nothing: a live board is synced to the text,
and moment cards jump the board to the position. But it is navigation, not play. There
is no opponent, no move you can make (outside the puzzle extractor), and no way to
play from any position in any rendering.**

- `[V]` `/about`: "every rendering **stays synced to a live board — scroll the tale,
  and the position follows**."
- `[V]` `/games/opera-game`, section "The turns of the screw — The moments": "**Click
  one — the board above jumps there.**" Four authored moment cards for the Opera Game
  (10.Nxb5!, 12.O-O-O, 16.Qb8+!!, 17.Rd8#), each with a one-line caption and a
  "▲ JUMP THE BOARD HERE" control, followed by "Get this breakdown for your game →".
  The game page calls each catalogue entry "a playable story" — where "playable"
  means the viewer replays moves, not that you play `[V]`.
- Puzzles are the one place the user moves a piece `[V]` `/` : "Tactics matched to
  your game's opening, the players' level, and the motifs it featured … **Drag a piece
  to solve**." A puzzle extracted from your game is still a solve-the-answer unit, not
  a re-entry into the game's consequence.
- Nothing anywhere offers play-from-position, an opponent (engine, Maia-like, or
  human), resistance levels, or any drill mode `[V]` (absence across all fetched
  pages and the sitemap's 158 URLs). A "DOWNLOAD PGN" button exists `[V]` — the exit
  to *other* tools is a file.

## 4. Import sources

- `[V]` `/about`: "**Paste a game — a PGN, or a link**." `/features/stories`: "Paste
  any chess game link and watch it transform." Homepage CTA: "Paste your game to make
  one."
- Their SEO description says the product "works with Chess.com and Lichess" `[P]`
  (search-snippet extraction of site copy; the served pages fetched never name either
  platform). No username/account sync, no auto-pull, no "connect your account"
  anywhere — import is one game at a time, by hand `[V]` absence.

## 5. Business model

`[V]` `/pricing` — a per-artifact generation economy, priced like printing, not like
a subscription service:

- **Free**: $0 — "Unlimited analysis · Story teasers · Drama arc & characters ·
  Tactics puzzles on every game · Pay-as-you-go from $5/story."
- **Pay-as-you-go**: Story $5 · Comic $5 · Comic + Story $10 · Screenplay $3 · Audio
  narration $5 · **Printed book $25**.
- **Subscriptions are credit packs**: Player $9/mo ("$10 in credits each month");
  Pro $19/mo ("$28 in credits", "Most Popular", 10% print discount); Club $39/mo
  ("$60 in credits", 20% print discount). "Credits are reserved when a generation
  starts and only consumed when it succeeds"; "Credits roll over & refund on failure."
- Licensing `[V]` `/contact`: "Generated stories and comics are for personal,
  non-commercial use by default"; commercial reuse (including "clubs and coaches") by
  arrangement.

Note what "Unlimited analysis" being free implies: the engine pass over your game
costs them nothing they need to charge for; the money is in the *rendering* `[M]`.

## 6. Does it implement any stage of our loop?

None. Commit ❌ · play-the-consequence ❌ · rewind ❌ · preserved branches ❌ ·
compare ❌ · phase transitions ❌ (chapters follow drama, not phases; no phase
vocabulary anywhere) `[V]` absence across all fetched assets. There is no opponent
object in the product at all — the strongest possible form of "not a training
product." The one loop-adjacent atom is the auto-extracted tactics puzzle from your
own game (§3), which is solve-and-done.

## 7. Its single best idea, and what it validates

**The provenance block (§2) is the best grounding discipline yet seen on the fan
shelf** — machine-replayed score verification, cited transcription lineage, dated
verification, honest hedging of what the record won't support. That is
`docs/explanation-grounds.md` thinking applied to *history* instead of *strategy*,
shipped by a fiction product. It proves a competitor can sell narrative while keeping
a hard evidence floor under it — which removes any excuse that story surfaces must be
sloppy.

Second: the **moment-card + board-jump unit** ("Click one — the board above jumps
there") is the closest shipped ancestor of the RFC's slides. It demonstrates the
reading interaction works and is cheap; what it never does is open the position into
play.

Third: per-artifact pricing with credits-refund-on-failure is a clean answer to
"generation costs money" that a future story surface could face `[M]`.

## 8. Overlap, and where it stops

Shared with our game-story surface: finished own game as input (PGN paste); engine
analysis selecting turning points; a moment-sequence presentation with a synced board;
puzzles derived from your own positions; a verified-score/evidence ethos. It stops
exactly at the door we walk through: every rendering is **something you read, watch,
or print**. The consequence of a turning point is a chapter, never a position you hold
against resistance. And it is single-artifact commerce — nothing accumulates into
skill, progress, or a second attempt.

## 9. E1 impact

**WHITESPACE INTACT.** Zero loop stages; no opponent; architecturally a publishing
pipeline. Effects on the in-flight `rfc/game-import-and-story.md`:

1. **The differentiator survives but must be stated more sharply.** "Slides you
   re-enter and replay vs a story you read" is safe *only if* "re-enter" means
   play-from-the-moment under resistance. Chess2Story already ships slides-you-click
   with a board that jumps there — moment navigation with board sync is **taken**.
   The unclaimed atom is the door into play: moment → position → opponent → your
   move → consequence → rewind. The RFC should pin the differentiator to that, not to
   "we have moments" or "we have a board."
2. **"They're freestyle, we're grounded" is NOT a safe contrast against Chess2Story**
   (it is against Take Take Take). C2S grounds selection in engine analysis, verifies
   scores with provenance, and quarantines its fiction honestly. The honest contrast
   is *read vs replay*, plus our grounding extending to strategic explanation
   (explanation-grounds discipline) where theirs stops at score/selection.
3. **A warning shape**: C2S's "coach review" rendering — no-fiction analytical
   walkthrough with a synced board — is, if we ever ship game-import review without
   the play door, literally "an engine review screen" (the named failure shape). The
   RFC's story surface must not be shippable in a state where reading is the whole
   product.
4. Fan-shelf crowding confirmed (with TTT and ChessEver): our story surface enters
   occupied territory; our training core does not.

## 10. Residual uncertainty — only hands-on / a paid run can settle

1. Actual generated-story quality and chess-accuracy of the prose (body is
   client-rendered; unread). Whether the "discipline passes" hold for user games.
2. What the coach-review rendering actually contains and what writes it (LLM over
   engine lines is the obvious guess `[M]`) — the ADR-0005 exposure point.
3. Whether user-game turning-point selection is eval-swing based, and how many
   moments a typical game yields (famous games show 4 authored "turns").
4. Whether "a link" accepts chess.com and lichess game URLs (implied by SEO copy
   `[P]`, unverified).
5. Whether the moment cards on *user* games are automated or the famous-game ones
   are hand-authored (their editorial quality suggests hand-authoring `[M]`).
6. Traction — zero external footprint found; could be pre-launch quiet or simply
   invisible. "Est. 2026" means no track record either way.
