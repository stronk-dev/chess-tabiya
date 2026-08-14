# Teardown: Dr. Wolf (Learn Chess with Dr. Wolf) — desk research

- Date: 2026-08-14
- Feeds: Q1a / E1 (sweep 2's #1 teardown pick — the closest mainstream product to
  "it will rewind and explain", `design/00-thesis.md` §Why anyone would use it);
  `design/02` §Adoption posture. Builds on `coverage-sweep-2-notability.md` (matrix
  CSV line 49).
- Method: desk research, no install, no account. Raw fetches: Apple App Store listing
  id1353041020 (description, pricing, version history, reviews incl. the see-all
  reviews view), learnchesswithdrwolf.com (official marketing site), chess.com news
  "Dr. Wolf, Personalized Chess Coaching App, Joins Chess.com", chess.com blog "Meet
  Dr. Wolf", chess.com forum "Your opinion about 'Dr. Wolf' app?", chesstech.org 2020
  review "Teaching through play", popsci.com feature on Dr. Wolf (David Joerg
  interview), elevenlabs.io/blog/chess-dot-com (voice mode case study), thechessadvisor
  review, unstar.app 2026 ranking. `[V]` = fetched and read this pass; `[P]` =
  search-extract/secondary; `[M]` = model knowledge, unverified.
- **Fetches/searches that returned nothing or failed**: Google Play page truncates to
  fetches (both sweeps and this pass — App Store used instead); searches for Dr. Wolf +
  "history" / "preserve" / "branch" / "variation" / "see my earlier try" returned
  nothing — no source anywhere describes a surviving prior attempt after an undo;
  searches for the explanation technology ("templates" / "rules" / "GPT" / engine
  disclosure, incl. HN and David Joerg's own trail) returned no disclosure of how
  commentary is generated; no TTT-style public confabulation catch (impossible-move
  claims) was found in any review source.

## 1. What it is

**Chess.com's teach-during-play app: you play full games against an AI that is
simultaneously your opponent and your coach, commenting on every move in plain
language (text or voice), interjecting on mistakes, and offering unlimited undos.
4.8★ from 27k+ ratings** `[V]` App Store.

- Maker `[V]`: created by **David Joerg**; the app "joined" Chess.com on **2020-11-11**
  (chess.com/news/view/dr-wolf-joins-chess-com — an acqui-hire: Joerg is now
  Chess.com's "Head of Special Projects, maker of 'Learn Chess with Dr. Wolf'" `[P]`
  wiza/popsci bios). Seller today: Chess.com, LLC `[V]` App Store.
- Positioning `[V]` popsci (Joerg): "The wish that we address is to have not just an
  [AI] opponent, but a coach who will praise your good moves and explain what they're
  doing while they're doing it." And: "I see it not as a playing-field leveler as much
  as an on-ramp. It makes it possible for people to get in and get comfortable without
  the social pressure."
- Access `[V]` App Store: free trial of **3 coached games**, then $5.99/mo, $39.99/yr,
  family $49.99/yr; hints and undo are premium features `[V]` thechessadvisor ("to
  unlock ... features like 'hints' and 'undo,' you'll need to subscribe"). 2020 pricing
  was $4.99/€5.49 monthly `[V]` chesstech.org. Still maintained: v3.13.0, 2025-06-09
  `[V]` App Store.
- Band: designed "from 0 up to 1300-1500 chess.com blitz rating" `[V]` (chess.com
  forum, attributed to a designer); "If you already have a rating of 1400 or more, you
  will hardly benefit" `[V]` chesstech.org. **The ceiling sits exactly where our core
  band starts** (1400–2000+, `design/00-thesis.md`).

## 2. The play loop — when and how Dr. Wolf interjects

- **Cadence: every move, both sides.** "After each move, Dr. Wolf comments and helps
  you understand the board" `[V]` official site; "During play it gives hints about its
  own moves and comments the moves of the learner" (example given: "You captured a
  hanging piece, well played") `[V]` chesstech.org. So the triggers are not only
  errors: good moves get praise, Dr. Wolf's own moves get explained, and openings are
  taught **by name** as they arise ("Caro-Kann," "Two Knights Defense" named in the
  store's lesson list) `[V]` App Store.
- **Mistakes get a blocking choice-dialog before they stand.** `[V]` popsci: after a
  blunder "the bot points out the error, maybe offers up a pointer or two, and asks if
  you want to give it another shot"; it asks "**Are you certain?**" "before allowing
  players to either continue or retract their move." Correcting earns "a digital pat on
  the back"; "repeated errors may push it to course-correct." This is a
  blunder-*guard*: the consequence can be declined before it is ever played out.
- **A second mistake mechanic: flip sides.** "he recommends we flip sides after I make
  a blunder so I can better appreciate my mistake" `[V]`
  (chess.com/blog/Sawbonez/meet-dr-wolf-1) — the learner takes the punishing side.
- **Spoken, optionally.** Voice Mode (toggle in Settings/Game Menu) reads the
  commentary aloud; four coach profiles, "each with a unique voice, teaching style and
  personality" `[P]` store-copy extract; built on ElevenLabs TTS `[V]`
  (elevenlabs.io/blog/chess-dot-com, May 2024) — PM Gabe Jacobs: "The introduction of
  a voice for Dr. Wolf has transformed our app." Origin was an accessibility request:
  "My 7-year-old is struggling to read his commentary" `[V]` same. Users: "the ideas
  seem to sink in more when they're able to keep their eyes actively engaged on the
  chessboard" `[V]` same.
- **Hints on demand** (premium, unlimited) `[V]` App Store.

## 3. Undo semantics — the load-bearing contrast, verified

**What undo is:** unlimited take-backs `[V]` App Store ("unlimited hints, unlimited
undos"); plus the mistake-dialog's "retract" path (§2), which is an undo offered
*before* the move even stands `[V]` popsci.

**What is lost: the attempt, as a played line.** No fetched or searched source — store
copy, official site, four reviews, two forums, two press features — describes any way
to see an earlier try again: no variation list, no attempt history, no branch UI, no
"compare with what you played before." The searches specifically for preservation
returned nothing (§Method). Undo here means the move **did not happen**; the game
continues as the single surviving line. `[V]` as evidence-of-absence across all
fetched assets; hands-on residual in §7.

**What is kept — and this is subtler than the sweep's flat "erases": the mistake is
harvested, the attempt is not.** "Dr. Wolf reviews past moves with users to prevent
repeating mistakes" `[V]` App Store description; listing copy adds users "can practice
against their past mistakes" `[P]` (Android listing extract). So the position where
you went wrong survives as a **lesson item in a review queue** — but as an isolated
position, severed from the game it came from, the line you actually played, and any
alternative you tried after the undo. Nothing is comparable because only one thing is
kept per mistake.

**The contrast with our runtime, stated exactly:** Dr. Wolf's undo says *the move did
not happen* and files the position for later; our rewind says *it happened, here is
another world* — the fork preserves both lines in one structure, comparable, in
context (`05` §1: "An attempt is never destroyed"; "Rewind is an experiment, not an
undo"). Dr. Wolf also inverts the commitment invariant: the "Are you certain?" dialog
arrives **before the consequence is played**, so the learner can be coached past the
mistake that would have taught them (`05` §3a names precisely this failure). Where our
loop is commit → play the consequence → rewind, Dr. Wolf's is warn → retract → never
play it.

## 4. Grounding — how the explanations are made

- **Undisclosed.** The 2020 press said only "new technology that explains the game
  like never before" `[V]` chess.com news; no source found this pass discloses the
  mechanism (engine + handwritten explanation rules vs generative) — §Method. The app
  predates the LLM era (joined Chess.com 2020; Android package history back to 2018
  `[P]` apkmirror), so the original commentary system cannot have been LLM-freestyle
  `[M]` inference; whether later versions added LLM generation is unknown.
- **No public confabulation catch was found** — nothing like TTT's launch-day
  impossible-move commentary (`teardown-taketaketake-desk.md` §2c). Searches returned
  nothing (§Method).
- **But accuracy/consistency complaints are on record**, and they are the same failure
  class in milder form: "several complaints about the app by more seasoned chess
  players. They feel there are a number of inaccuracies about the recommended moves"
  `[V]` chess.com blog (Meet Dr. Wolf); users report Dr. Wolf's suggested "better
  moves" are "better for him, not the player" `[P]` forum extract; an App Store
  reviewer: the app "hammers home 'Developing' moves" then later marks the same kind
  of move as "errors" with no reasonable explanation `[V]` App Store review
  (Michelemabelle1811). Verdict: grounded-or-not is **unresolved**; the observable
  symptom is advice users at the band's ceiling stop trusting.

## 5. Love and hate — why 4.8★, and why people leave

**Top-3 loved** (what reviewers actually praise):

1. **The patient companion tone.** "This little app is awesome. It was just like my
   grandfather 'you suuuuure want to make that move?'" `[V]` App Store (omegareader,
   5★) — the mistake-dialog itself is the beloved feature. The 2026 ranking:
   "the friendliest on-ramp in the category for a true beginner" `[P]` unstar.
2. **Plain-language explanations that land.** "plain-English explanations of why my
   moves were good or bad" `[V]` chess.com blog; "it has been teaching me how I have
   played BADLY for around 43 years" `[V]` forum (Ashley_uk); voice mode deepened this
   ("all you have to do is listen") `[V]` elevenlabs.
3. **Judgment-free practice.** Joerg's on-ramp framing (§1) `[V]` popsci; unlimited
   undos remove the fear of irreversible mistakes `[P]` review synthesis — the same
   experimentation-without-cost demand our preserved branches serve
   (`00-thesis.md` §Why anyone would use it).

**Top-3 hated:**

1. **Thin free taste, subscription-gated usefulness.** "The genuinely useful coaching
   is mostly behind a subscription, the free taste is thin" `[P]` unstar; "at the
   price point being asked there is just not enough content" `[V]` App Store (zazuro);
   "not worth the subscription compared to free resources" `[P]` thechessadvisor via
   sweep 2.
2. **The depth ceiling.** "stronger players outgrow the hand-holding fast" `[P]`
   unstar; "If you already have a rating of 1400 or more, you will hardly benefit"
   `[V]` chesstech.org — churn is structural: the product's band *ends*.
3. **Difficulty cliffs and opaque adaptivity.** The Advanced→Expert gap is
   "astronomical" `[V]` App Store review; a long-term user (800+ wins): "If the game
   is actively using AI to adapt to my level of play without me increasing difficulty,
   then it's pointless" `[V]` App Store; plus the trust erosion from inconsistent
   advice (§4).

## 6. E1 verdict and adoption entry

**WHITESPACE INTACT.** Loop stages: commit ❌ (the blunder-guard lets you retract
before consequence) · play-the-consequence ⚠️ full games only, and interruptible ·
rewind ✅ **as undo — erasing** · preserved branches ❌ (mistake queue keeps positions,
not attempts) · compare ❌ · phase objectives/transitions ❌ (no win/hold/save, no
phase vocabulary found). Dr. Wolf is the strongest mainstream normalization of the
thesis sentence "it will rewind and explain" — 27k ratings say the *demand* is real —
and its mechanics are point-by-point inverted from ours: warn-before-consequence vs
commit-then-consequence, erase vs fork, isolated-mistake-queue vs comparable attempts,
and a band that ends at ~1400 where ours begins. It validates the appetite and leaves
the protocol unclaimed.

**Adoption entry (one feature, one invariant):** the **spoken post-hoc explanation in
a warm coach persona** — the single most-praised element (§5.1–2, the grandfather
quote and voice-mode testimony). It enters through `05` §3a's **silence default**:
same warmth, same voice-first delivery, but arriving *after* the segment/commitment
rather than before the move, wording only rungs 0–5 (grounded claims, ADR-0005) — the
beloved tone with our timing and our grounding, consistent with `02`'s Play Coach
worked contrast ("the adoptable part is the ambient-companion presence, not the
commentary"). Secondary steal: the **mistake-resurfacing ritual** ("reviews past moves
with you") upgraded by our invariant — resurface the *attempt in its game*, forkable,
not an orphaned position.

## 7. Residual uncertainty — only hands-on can settle

1. Ground truth on undo: whether any trace of the undone move is visible anywhere in
   the UI afterward (the desk verdict is evidence-of-absence, strong but indirect).
2. Whether the "Are you certain?" guard fires on every blunder or adaptively; whether
   it can be disabled (playing without the guard would restore commitment).
3. What the mistake-review queue actually shows: position only, or the game context;
   whether it is replayed against resistance or explained read-only.
4. The explanation mechanism (templated vs LLM in current versions) — undisclosed;
   an in-app observation of repeated/parameterized phrasing would settle it.
5. Whether "flip sides after a blunder" is systematic or occasional.
6. Current free-tier shape (3 games then hard paywall vs degraded free play).
