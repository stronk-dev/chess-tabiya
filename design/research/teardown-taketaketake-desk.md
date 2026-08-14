# Teardown: Take Take Take (taketaketake.com) — desk research

- Date: 2026-08-14
- Feeds: Q1a / E1; owner's candidate feature "finished game distilled into ~8 slides of
  pivotal states" (checked here against what TTT ships)
- Method: desk research, no account, no app install. taketaketake.com is server-rendered —
  full copy is in the HTML. Evidence came from raw fetches of `/`, `/about`,
  `sitemap.xml`, six `/blog/*` posts, the Apple App Store listing for the new app
  (id6754937311, description + user reviews + version history), and a third-party
  technical criticism of the Game Review feature (intermediatemoves.substack.com,
  launch-day, based on the official launch stream). Quotes are literal strings from
  those fetched assets. Secondary press (ChessBase India, chessdom, Reuters via cp24,
  PitchBook snippet) was read only through the fetch tool's extraction, so those claims
  are `[P]`. [V] = raw asset fetched and read; [P] = secondary/extracted; [M] = model
  knowledge, unverified.
- **Fetches/searches that returned nothing or failed**: `taketaketake.com/faq` and
  `/articles` → 404 despite appearing in nav/search (blog lives at `/blog`); old Apple
  listing id6467619751 → 404 (superseded); Google Play page served only a navigation
  shell to the fetch tool; searches for TTT + "retry" / "play from" / "practice this
  position" returned only Chess.com's Retry feature, never TTT; no TechCrunch launch
  coverage found; no evidence of puzzles, bots, or any drill mode in any asset.

## 1. What it is

**A VC-funded social chess platform co-founded by Magnus Carlsen: play real games (via
Lichess infrastructure), get an LLM-narrated post-game review, and share games to a
Strava-style feed. A play-and-post-mortem product for improvers — not a training or
rehearsal product.**

- Maker `[V]` `/about`: Take Take Take AS (Norway). Co-founders **Mats André
  Kristiansen** (CEO, "an improving chess player (~1500 ELO), which makes him the
  archetypal Take Take Take user") and **Magnus Carlsen** ("The world's greatest chess
  player and the biggest name in the game"). Backed by "Jim Breyer, Jack Brody, Patrick
  Collison" `[V]`; Snö, Coatue, Lovable also listed as supporters `[P]` (carousel
  images on the same page, read via extraction); ~$9M raised per PitchBook snippet `[P]`.
- History `[V]` `/about`: started 2023; "We tested fantasy chess formats… We launched a
  fan zone app for following professional chess and got 200,000 downloads in a few
  months. We became the #1 YouTube channel for the 2024 World Rapid & Blitz
  Championship." The current platform launched **April 6, 2026** on iOS/Android, web
  "arriving 30 days later" `[V]` blog. The old fan app ("Take Take Take - Follow
  Chess", id6514323846) still exists separately with pro-tournament following, fantasy
  chess, Guess-the-Move, and **post-game recap videos by Carlsen and Levy Rozman** `[P]`
  ChessBase India / The Chess Advisor.
- Positioning `[V]` App Store description: "Chess is more fun when you actually get
  better at it… built for the player who loves the game, plays regularly, and wants to
  improve." Sections literally named **PLAY / IMPROVE / SHARE**. Target band "roughly
  800 to 2000 ELO" `[P]` (search extraction of store/site copy) — overlapping our
  1000→2000+ journey almost exactly. Mission `[V]`: "chess for improvers is broken, and
  … we're the ones to fix it."
- Play `[V]` `/blog/lichess-partnership`: the **Play Zone is powered by Lichess** —
  "access to hundreds of thousands of active players and instant pairing, all within
  the Take Take Take app." A lead engineer "previously volunteered for Lichess for ten
  years." Strategy quote `[P]` Reuters/cp24: CEO — "our goal is not necessarily to kind
  of dethrone Chess.com"; Carlsen cannot promote it due to Chess.com contractual
  constraints.
- Access `[V]`: free; "All features are free" (`/blog/how-to-analyze-chess-games`); no
  paid tier or IAP found anywhere. `[M]` Monetization deferred, VC runway.

## 2. Does it summarize games as narrative states/moments? — YES, twice, and it is the product's spine

This is the owner's question, and the answer is emphatic: **game-story summarization is
Take Take Take's core identity**, shipped in two distinct surfaces.

**(a) The feed share-card: an auto-generated key-moments summary of a finished game.**
`[V]` `/blog/strava-moment-for-chess`: "When you connect your Lichess account, your
games pull in automatically. **The app reads each one, picks out the key moments, and
generates a short summary you can share with a single tap. It even suggests a title.**
You don't need to know how to explain what happened. The app does it for you, in a way
that makes sense to someone watching from the outside." Landing page `[V]`: "**Every
game has a story. We help you read it.**" This is the closest shipped thing to the
owner's ~8-slides idea — but its *purpose is social*, an artifact for an audience
("your games deserve an audience"), not a learning artifact of pivotal states. Nothing
found specifies the number of moments, a slide structure, or per-moment causal framing
("how each influenced the game"); the unit is a post with a title, not a walkable
sequence of states. Structure granularity is a hands-on question (§8).

**(b) The AI Coach game review: per-move LLM narrative plus a "moment that mattered
most".** `[V]` App Store: "After every game, your personal coach breaks down exactly
what happened — move by move, in plain language, not engine lines. What you missed, why
it mattered, and what the better move was. Not a graph. Not centipawn scores. An actual
explanation you can learn from." `[V]` `/blog/pro-game-review`: the AI gives "a
plain-language breakdown: what happened, **which moment mattered most**, and one
specific thing to work on next." `[V]` `/blog/stuck-at-1000-elo`: it "breaks down the
key moments in plain language."

**(c) How the review actually works — and fails.** `[V]` (launch-day technical
criticism, intermediatemoves.substack.com, from the official launch stream with Simon
Williams): per move, an LLM (footnote: "Probably ChatGPT") is given "The current
position, The moves played so far (or at least, the last move), Stockfish's principal
variation, The current evaluation" and asked to write commentary. Documented failures,
quoted from review output shown on the launch stream: a rook on d3 that has "cut the
defense" from a *bishop* on b3 of a queen on e3 ("That's… not how a bishop moves");
after 1.d4 e6, "This solid choice bluntens the diagonal for White's light squared
bishop" (undeveloped bishop, and the French hadn't been entered — the LLM read
Stockfish's PV as if played); a game-losing one-move blunder softened to "this is
incredibly risky"; Qh5–h4 described as "focusing on developing the remaining pieces as
fast as possible." Author's verdict: "**Almost everything this LLM says about chess is
irrelevant or wrong**… a slop machine." A user review is gentler but confirms the shape
`[V]` App Store, 1200-rated player, 100 games: "the ai helps explain why some moves are
better than others in game review… the engine suggestions are a mystery to me at my ELO
so the writing is nice" — and "**I wish game review showed me maybe the top 3 lines I
could have made instead of just the top engine move**," confirming the review surface
is one engine line + prose, read-only.

**This is ADR-0005's named anti-pattern shipped at scale**: "Stockfish: +0.54 / LLM:
'Ne5 centralizes the knight'" — a dashboard, not a drill — built by a Carlsen-cofounded,
Coatue-backed company, and publicly caught manufacturing chess truth on launch day. It
is the strongest external validation the no-LLM-manufactured-chess-truth law has
received: the failure mode is not hypothetical, it is reviewable in the market, by
name, with quotes.

## 3. Does it implement any stage of our loop?

- **Commit** — only in the trivial sense of playing real games. No curated positions,
  no declared objectives, no drills. `[V]` (no such feature in any asset; a user asks
  for puzzles as a wish: "Puzzles would be cool").
- **Play the consequence** — real games are played out, but that is the game, not a
  rehearsal of a committed decision. No play-from-position of any kind found. `[V]`
- **Rewind** — none found. The review is a post-mortem you read. Searches for
  retry/play-from/practice-this-position returned nothing (§Method). `[V]` absence-of-
  evidence on served copy; hands-on residual in §8.
- **Preserved branches / attempt comparison** — none found; nothing in any asset
  describes variations, branches, or re-attempts. `[V]` same caveat.
- **Phase awareness / transitions** — none. No phase vocabulary anywhere in the product
  copy; the blog discusses endgames only as study advice. `[V]`

Net: **zero loop stages beyond "a game happened."** Take Take Take is precisely the
category `design/00-thesis.md` §What-it-is-not names: a **post-game analyzer** with a
social layer. The review points at moments; the product offers no way to re-enter them.

**Their own blog names our gap, in their words.** `[V]`
`/blog/how-to-analyze-chess-games`: "**Reading the Right Answer Is Not Actually
Learning It**… Ask yourself: **if I had to play this position again from scratch, what
would I do differently?**… This applies equally to engines, AI coaches, and human
coaches. The tool can point you to the moment. **What you do with it is up to you.**"
The instruction is to *imagine* replaying the key position — because the product has no
mechanism to actually replay it. The sentence "the tool can point you to the moment;
what you do with it is up to you" is a working definition of where TTT ends and our
loop begins.

## 4. Opponent

Real humans, via Lichess pairing — "play against real opponents instantly" `[V]`. No
bots, no Maia-style human-like engine, no resistance levels found `[V]`. So "replay
under different resistance" is structurally impossible: you cannot even replay, and you
cannot choose resistance.

## 5. Its single best idea

**The witness layer: automatic, zero-effort game-story summarization for an audience,
plus ambient accountability.** `[V]` The Strava argument is executed cleanly: "picks
out the key moments, and generates a short summary you can share with a single tap. It
even suggests a title"; "When the people who follow you can see that you haven't played
in two weeks, there's a quiet pull back to the board"; medals are **re-enterable
records** — "Revisit the games and sessions behind every medal you've earned" `[V]`
App Store changelog. Secondary steal `[V]` `/blog/strava-moment-for-chess`: Clubs
"Competitions are built to work across rating levels, so players of very different
abilities can take part in the same event."

Where it stops relative to our thesis: the key moment is something you **read and
share**; ours is something you **re-enter and replay**. Their summary is narrative
manufactured by an LLM over engine data (ungrounded, demonstrably wrong); ours must be
grounded states (`docs/explanation-grounds.md` discipline). For the owner's ~8-slides
feature the lesson is double-edged: TTT proves the *appetite* — a funded team bet the
whole product on "every game has a story" — and simultaneously proves the *failure
mode*: slides whose prose is LLM-confabulated are worse than no slides. Our version's
differentiators are already in the design language: pivotal states chosen by honest
detectors (`05` §5a: irreversibility, phase change, human divergence, option collapse —
not eval swing), explanations grounded not generated, and every slide a door back into
play rather than a caption.

## 6. Overlap, and where it stops

Genuinely shared: the improver target band (~800–2000 vs our 1000→2000+); "improvement
comes from your own games, at the key moments, not from grinding volume" (their blog
argues this repeatedly `[V]`); plain-language-over-centipawns feedback conviction;
review-right-after-the-game timing; free access; Lichess as substrate.

It stops before the loop begins. TTT's unit is *a finished game narrated*; ours is *a
decision rehearsed*. Their answer to "what do I do with the moment that mattered?" is
read about it and share it; ours is play it again under resistance and compare your own
attempts. On the thesis sentence — commit → play the consequence → rewind → branch →
compare → replay under different resistance — TTT implements none of the six as a
training interaction. And its feedback engine violates our founding law: the narrative
is LLM-manufactured chess truth, already caught being wrong in public.

## 7. E1 impact

**WHITESPACE INTACT.** Loop stages: commit ❌ (real games only) · play-the-consequence
❌ (no curated positions) · rewind ❌ · preserved branches ❌ · compare ❌ · phase
transitions ❌. The claim E1 protects — nobody combines played-through segments +
preserved branch comparison + phase transitions — is untouched: TTT has none of the
three and is architecturally pointed elsewhere (social + narrative).

Three second-order effects, all useful:

1. **Demand-side validation (Q1b-adjacent).** A Carlsen-cofounded, Coatue/Breyer/
   Collison-backed company declares "the tens of millions of improving players, stuck
   between casual and serious… have never had a platform built for them" `[V]` and
   targets our band. The thesis that improvers are underserved now has a $9M market
   endorsement. The risk cuts the other way too `[M]`: a well-funded player owning the
   "improver" positioning raises the marketing bar for any future SaaS posture (Q2),
   even though its mechanism does not compete with ours.
2. **ADR-0005 / law 8 vindicated externally** (§2c). Cite this teardown whenever the
   pressure to "just add an LLM explainer" appears.
3. **The owner's slide-recap idea is validated in appetite and unclaimed in substance.**
   TTT ships "key moments + summary" as a share card with confabulated prose. Nobody
   yet ships *grounded* pivotal states that open back into play. If we build it, the
   differentiators in §5 are the spec.

## 8. Residual uncertainty — only hands-on can settle

1. The feed summary's exact anatomy: how many moments, board diagrams per moment or
   text only, whether tapping a moment opens a board, whether it is at all slide-like.
2. Whether the review board allows free exploration (moving pieces from a review
   position) even without a "retry" feature — the one place a play-out could hide.
3. Whether review quality improved since the April launch-stream criticism (v1.0.18 →
   v1.0.34 by mid-August, changelogs say only "Various improvements" `[V]`).
4. Whether Play Zone games are real rated Lichess games or anonymous pairing on Lichess
   infrastructure, and what happens to TTT if the partnership ends.
5. Whether "which moment mattered most" selection is eval-swing-based (the post-mortem
   detector `05` §5a rejects for live use) — almost certainly `[M]`, unverifiable from
   desk.
6. Web-version feature parity with the apps.
