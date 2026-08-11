# Teardown: ChessMotive (chessmotive.com) — desk research

- Date: 2026-08-12
- Feeds: Q1a / E1 (owner-flagged 2026-08-12 as "comes close to us"; absent from the 28-product matrix)
- Method: desk research, no account. The site is a client-rendered Vite/React SPA whose HTML shell
  carries no copy, so `WebFetch` on `/`, `/about`, `/training/guide` returned title-only. Evidence
  came instead from publicly served artifacts: `sitemap.xml`, `robots.txt`, embedded JSON-LD, and the
  string tables of the shipped JS bundles (`main`, `HomePage`, `About`, `TrainingGuide`,
  `TrainingSession`, `Chessboard`, `trainingModePresentation`, `Licences`, `Terms`). Quotes are
  literal strings from those assets. [V] = asset fetched and read; [P] = snippet only; [M] = model knowledge.
- **Searches that returned nothing** (see §7): "ChessMotive chess training"; "chessmotive.com review
  reddit"; `"ChessMotive"` + evaluation/candidate moves; `"chessmotive" OR "chess motive"
  site:reddit.com`; ChessMotive + Product Hunt / YouTube / App Store; `"ChessMotive"` + lichess and
  chess.com forums; chessmotive.com launch 2026. Only chessmotive.com itself ever ranked.

## 1. What it is

**A structured single-position decision trainer — "solve the thinking process, then compare against a
model answer." A solver product, not a play-out product.**

- Positioning `[V]` JSON-LD: "Chess training that builds the decision process behind each move: naming
  candidate moves, eliminating them by calculation, and evaluating the position before committing."
- Wedge `[V]` `About`: "most chess training tools teach you what the best move is, but not how to find
  it… Every session puts you in a real position from professional play and guides you through a
  structured 6-step thought process… before showing you the model answer."
- Tracks `[V]`: **Foundation** (PT15M, move-category scaffolding), **Club** (PT20M, unscaffolded
  candidate comparison), **Advanced** (PT30M, line + evaluation). Onboarding maps rating to track (FIDE
  foundationMax 1600, clubMax 2200) via Lichess/Chess.com import or a manual slider — core band roughly
  **1600–2200+**, overlapping our thesis band.
- Access: **free, account-gated, guest-playable** `[V]` ("Create my free account and keep it all";
  "Guests start from zero next visit"). No pricing page, no subscription/billing code, no paywall
  strings in any bundle; `Terms` cites "billing" only as an email category. `[M]` Monetization unbuilt.
- `/coaching` survives in sitemap + SEO table ("Book one-on-one analysis with an International Master or
  Grandmaster…") but the live router **redirects `/coaching` → `/`** `[V]`: paid arm announced, disabled.
- **Web SPA only** `[V]`, no app-store listing found; Firebase backend. **Closed source** `[V]`
  `/licences`: "The rest of ChessMotive is not made open source by their inclusion." Reuses
  chessboard.js (MIT), chess.js 1.4.0 (BSD-2), Stockfish.js 17.1 (GPL-3); client-side WASM engine
  options are `stockfish17_lite` (7 MB) or `engine_off`.

## 2. Does it implement any part of our loop?

**(a) Play from a curated position past theory — NO.** Positions are curated (real professional games,
tagged `phase`/`difficulty`/`themes`/`event`/`moveNumber`) and you do commit a move, but the session
ends at the commit. No continuation of play. `[V]`

**(b) Rewind mid-game — NO, there is no game.** The only backward gesture is `Undo`/`Reset` inside
candidate entry and Advanced line entry ("Undo Line Move") `[V]`. After the exercise a locked
move-navigator unlocks over the real game's continuation — "you can check the game after completing the
exercise" `[V]` — passive replay of a master game you did not play.

**(c) Prior attempts preserved as branches — NO. Undo is a destructive eraser.** `[V]` `onUndo`/`onReset`
operate on a flat move array; no branch or variation-tree object exists. Grep across all bundles:
`branch` = 0, `rewind` = 0, `takeback` = 0 `[V]`. Attempts *are* persisted as scored records
(`attemptId`, "Saved as the first entry in your training history") — a graded transcript of one solve,
not a forkable line.

**(d) Side-by-side comparison — YES, the real overlap, but on the wrong axis.** `[V]` The Summary renders
a two-column `user` vs `model` table, one row per step: `Initial candidates`, `Shortlist`, `Final Move`,
`Critical line`, `Objective`, `Practical` — each with an `isMatch` flag and a score ("3/4 finalists
matched"). Copy: **"Compare what you entered with the model answer in the same order you solved."** This
is one-attempt-vs-authority, **never attempt-vs-attempt**. Nothing compares two things *you* did.

**(e) Explanation of why a line went badly — YES, human-authored, strictly post-commit.** `[V]` Solutions
ship pre-authored prose per candidate: "Bxc5 fails to the recapture and seems like a worse version of
bxc5; Nd2 is too slow compared to other candidates," plus a full best-move justification weighing Ba6 /
Nxe5 / bxc5. **Not LLM** — no LLM/provider strings anywhere `[V]`. Stockfish appears only as a
post-reveal analysis panel ("Play moves on the board and inspect the engine's top lines";
`UCI_AnalyseMode`), never during the attempt. **Timing matches ADR-0006.**

## 3. Phase coverage

`[V]` Positions carry a first-class `phase` field validated to `opening | middlegame | endgame`, shown in
the session spine alongside `difficulty` and `themes`; the default fixture is `phase: "middlegame"`.
**But there is no cross-phase or trajectory notion at all** — each position is an atomic solve from a
batch. Nothing carries an opening into its middlegame or a middlegame into its endgame. Phase is a
filter label, not a journey.

## 4. Opponent

**There is none.** `[V]` `opponent` = 0 hits across every bundle. The decisive string is the Advanced
instruction: **"Choose the best move, then play your critical line for both sides on the board. Aim for
four moves each, but follow forcing play as far as needed."** The learner authors *both colours*;
resistance is retrospective grading against a stored expert line — "The line isn't graded once the move
differs from the expert's." No bot, no weakened engine, no Maia-style model, no scripted replies.

## 5. Its single best idea

**The step-indexed process transcript:** capture the learner's *reasoning artifacts* (candidate set →
shortlist → committed move → concrete line → objective band + practical prose) as structured data, then
diff each against the model, row by row, in the order produced `[V]`. It turns "did you find the move?"
into "where did your process break — generation, elimination, selection, calculation, or judgment?" We
capture commitment and outcome but not the *shape of the thinking that produced them*. Secondary steal:
the Foundation category scan (checks → captures → threats → piece improvement → pawn moves last, "Each
category advances automatically") is a cheap intent-capture scaffold fitting our on-ramp band and the
owner's "what is the moved piece no longer doing" prompt.

## 6. Overlap, and where it stops

Genuinely shared: curated positions from real strong play; commit before feedback; feedback withheld to a
checkpoint; an explicit compare surface; authored (not engine-generated) explanation of why a candidate
fails; all three phases tagged; free + client-side WASM engine; overlapping 1600–2200 band.

It stops at our thesis sentence. ChessMotive is **commit → compare-to-authority**. Ours is **commit →
play the consequence → rewind → branch → compare → replay under different resistance**. It has stage 1
and a variant of stage 5; no 2, 3, 4 or 6. Its unit is a *decision*; ours is an *episode*. Its comparison
axis is you-vs-model on one try; ours is you-vs-you across preserved attempts. And its verdict on a move
is "did it match the expert's line" — exactly the exact-move/model-line grading `design/01` rejects in
favour of W/D/L outcome preservation. Also logged `[V]`: heavy gamification (XP, badges, streak,
leaderboard, "motive coins", a collection, forge plates) plus per-position comment threads — a retention
layer we have no equivalent for, orthogonal to the loop.

## 7. E1 impact

**WHITESPACE INTACT.**

ChessMotive is a well-built product in an adjacent category — the structured-thinking-process solver —
and it deserves a matrix row it does not have. It is not a counterexample to E1. On the five loop stages:
commit ✅ · play-the-consequence ❌ · rewind ❌ · preserved branches ❌ · compare ⚠️ (user-vs-model,
single attempt). Having no opponent forecloses stages 2, 3 and 6 by construction. The claim E1 protects —
*nobody combines played-through segments + preserved branch comparison + phase transitions* — survives:
ChessMotive has none of the three. Two second-order effects, adjustments rather than refutations:

1. It **strengthens** ADR-0006 — an independent team converged on withhold-until-commit, against Noctie's
   per-move labels.
2. It **narrows our originality claim on "compare"** (not the whitespace): a structured row-by-row
   comparison surface is demonstrably shipped by someone else. State our differentiator precisely as
   *comparison of two preserved attempts by the same player*, not "comparison" in general; tighten the
   `competitor-value-props.md` synthesis wording when next revised.

The nil external footprint (§Method) means `[M]` this is very new or very low-traction — which discounts
its *demand* evidence to zero, but not its *design*.

## 8. Residual uncertainty — only hands-on can settle

1. Whether the "critical line" ever gets an automated reply for the opposing side in some position type,
   rather than the learner authoring both colours.
2. Whether solved positions can be re-attempted with the previous attempt's candidates/line visible.
   Bundle shows `idempotent: "replay" | "fresh"` on attempt IDs — the one path by which a you-vs-you
   comparison could exist unadvertised.
3. Whether anything in the coins/forge-plates economy tracks improvement on a *repeated* position (our C3
   shape) rather than pure volume.
4. Whether the post-reveal move-navigator lets you deviate from the game continuation and analyse from
   there — the one place a play-out could hide.
5. Authored-layer depth: how often "no expert variation was available here, so it didn't affect your
   score" fires.
6. Whether `/coaching` is pre-launch or retired — decides free trainer vs funnel to paid IM/GM lessons,
   and thus its posture conflict with ours.
7. Corpus size and refresh rate ("You cleared every available {mode} puzzle"; "New positions are being
   prepared") — the content-system question we consider the hard part.
