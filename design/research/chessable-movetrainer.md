# Chessable MoveTrainer — mechanics, appeal, and the mining list

- Date: 2026-08-22
- Feeds: D554 (matrix refresh), D549/D552 (progression & feedback surfaces), the
  `design/02` adoption posture ("the matrix is a mining list"), Q1a/E1 (via the standing
  teardown), and the owner's ask: *"what else makes Chessable so appealing? Some of that
  might enhance our drill pack features."*
- Method: desk — official help-center articles and blog posts fetched and read (curl;
  the domain 403s generic fetchers), homepage marketing copy fetched, author/reviewer
  essays fetched; forums via search snippets only. Product NOT run. Builds on
  `teardown-chessable-desk.md` (2026-08-11, bot handoff + soft-fail) without repeating it.
- Labels per `design/research/README.md`: `[V]` fetched and read; `[P]` snippet/secondary;
  `[M]` model knowledge.
- Posture: this dossier **mines**. The standing positioning line — "the unit is a
  card/line; the gap is the bridge from 'I recalled the move' to 'I understand which
  structure I chose'" (`design/02` §Positioning) — is *confirmed* below, not re-argued.

## 1. The MoveTrainer mechanical model

**Unit hierarchy.** Course → chapters → variations → moves. The SRS unit is the **move**:
"Each move in a variation has its own timer, so you can be at different levels within the
same variation if you have got one move incorrect a number of times." `[V]`
https://support.chessable.com/en/articles/9043598-how-does-the-spaced-repetition-scheduling-work

**The ladder.** Eight levels with fixed approximate intervals, XP bound to level `[V]`
(same article, reproduced verbatim in the Schedule-setting article
https://support.chessable.com/en/articles/9043243-what-is-the-schedule-setting):

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Interval | 4 h | 1 d | 3 d | 1 wk | 2 wk | 1 mo | 3 mo | 6 mo |
| XP | +40 | +50 | +60 | +70 | +80 | +90 | +100 | >100, cumulative |

**Lapse = full reset.** "If you get things wrong, you are back to the beginning and the
timing until the next revision reverts" — a miss at any level sends that move back to
Level 1, not down one step `[V]` (same article). No ease factor, no per-item difficulty
modeling; this is a fixed Leitner-style ladder, far simpler than SM-2/FSRS. `[M]`
(classification is analysis; the ladder itself is `[V]`).

**Learn → quiz → review ramp.** The default flow alternates authored prose with playing
the taught move: "you read commentary on a single move, then you repeat the suggested
move, then you read more commentary … At the end of a set of moves, you repeat them all
as a sequence" `[V]` https://notes.andymatuschak.org/zDr94hP6bG3jJYrdYy8B5hx (Matuschak's
observed description; matches the homepage's "Make the suggested move! You will be
quizzed on this later!" `[V]` https://www.chessable.com/). A per-course **quiz option**
skips the learn phase entirely: "instead of the MoveTrainer® showing you the moves to
make and explanations, it will immediately take you to the quiz. If you make any moves
wrong, the MoveTrainer® will take you back to them and show you the text in its entirety
after the first play through" `[V]`
https://support.chessable.com/en/articles/9043265-what-is-the-quiz-course-option

**Review scope: whole-variation (default since 2018) vs randomized.** "The moves you
need to review will always be part of the entire variation they belong to … you will be
quizzed on the complete series of moves leading up to the move you need to review. You
will not always get points for this" — the non-due prefix shows as "Overstudy", no XP.
Randomized mode serves each position independent of its variation and is described by
Chessable itself as "considerably harder … you always have to stop and re-assess the
whole position" `[V]`
https://www.chessable.com/blog/review-whole-variation-chessables-new-default-setting-mean/

**Overstudy.** Voluntary early review of not-yet-due moves. Asymmetric grading: wrong
during overstudy → timer reset exactly as in normal review; right → "nothing changes,
the spaced period remains as it is". No main-leaderboard XP, but course-leaderboard
points `[V]` https://support.chessable.com/en/articles/9043591-what-is-overstudy

**Difficult moves (PRO-gated).** Defined by counted events, not judgment: "3 or more
mistakes and a review score below level 4". A dedicated Tools page lists them "starting
with the lowest accuracy", each showing "the correct and incorrect moves played during
review, and how many times the moves were played", filterable by course/chapter/
variation, with color-coded recency (reviewed in last 24 h or not) and a graduation rule
for leaving the list `[V]`
https://support.chessable.com/en/articles/9044168-what-are-difficult-moves-and-how-can-they-help-me

**Learning status.** Per-course rollup over variations: Not learned / Paused / Learning
(levels 1–7) / Mature (level 8+) / Difficult. Chessable's own overload guidance is
notable: "avoid endlessly repeating material that you are not able to master as this
will end up occupying all of your study time"; pausing material is an offered remedy
`[V]` https://support.chessable.com/en/articles/9044158-how-is-the-learning-status-calculated,
https://support.chessable.com/en/articles/9027843-what-is-learning-status

**Scheduling settings.** Three modes: default SRS; **custom** (an interval multiplier or
individually set delay per level); **cyclical** (all reviews deferred to a user-set cycle
end date — explicitly built for the Woodpecker Method) `[V]`
https://support.chessable.com/en/articles/9043243-what-is-the-schedule-setting

**Scope controls.** **Key moves**: up to two per variation mark a study window so
students drill only the segment between them (with an automated marking script for
authors) `[V]` https://support.chessable.com/en/articles/9043751-what-are-key-moves.
**Priority lines**: learn-next follows only lines marked important — either
**author-selected** or **algorithm-selected**, the latter "based on a database of online
games in a certain rating range" `[V]`
https://support.chessable.com/en/articles/9034645-what-is-the-learn-setting-what-are-priority-lines
— i.e. corpus-frequency-at-band prioritization exists inside Chessable, but only at
learn-order granularity, not in review weighting (the equal-weighting complaint in §3
stands despite it).

**Alternatives and deviations** (from the standing teardown, not re-fetched): engine-
vetted **soft fail** margins — openings within 0.3, tactics mate-preserving or within
1.0, endgames tablebase-equivalent — produce "Try Again" plus a timer refresh, and the
drill still converges on the single text move; author "alternative lines" are parallel
flashcards Chessable itself warns cause recall interference `[V→repo]`
`teardown-chessable-desk.md` §Q2.

**Transpositions.** No transposition merging found in any help article fetched; the
per-move-timer-within-a-variation model and whole-variation review are line-keyed by
construction `[P]` (inference from `[V]` mechanics; no primary article states it either
way). The sharpest external statement is the Chessbook developer's architecture critique
of the line-keyed approach: "treating repertoires as a collection of lines is actually
very limiting; it doesn't work for transpositions … Store EPDs, not FENs" `[V→repo]`
`teardown-chessbook-desk.md` §3 (competitor-authored; bias noted). Chessable courses
handle transpositions editorially, as authored chapters (e.g. "Benoni Transposition
Mainline") `[P]` search snippet of a Lifetime Repertoires course page.

**MoveTrainer 2.0** (April 2020) was a technology replatform — React, dark mode,
resizable board, new PGN importer, groundwork for iOS/Android apps — **not** an
algorithm change `[V]` https://www.chessable.com/blog/movetrainer-2-0-is-here/

**Play-out**: the June 2026 bot handoff is a one-way link to Chess.com's engine bots
with no course tie-back; covered in `teardown-chessable-desk.md` §Q1 `[V→repo]`.

## 2. The appeal decomposition — why people pay

Vendor scale claims, as stated on the homepage: "1000+ Courses, 400+ Authors, 2 millions
Students", with a roster including Carlsen, Polgar, Giri, Nakamura, Caruana, and Rozman,
plus digitized editions of print canon (New in Chess, Everyman, Quality Chess, Russell —
e.g. Dvoretsky's Endgame Manual "presented by GM Erwin L'Ami") `[V]`
https://www.chessable.com/. Chessable was acquired by Play Magnus Group (2019), which
Chess.com bought for $82.9M (closed Dec 2022); commentary at the time called Chessable
one of the two most valuable properties in the deal `[P]`
https://www.chess.com/news/view/chesscom-acquires-pmg,
https://en.wikipedia.org/wiki/Play_Magnus_Group

Decomposed, with an honest weighting:

1. **The author marketplace — the moat (content-business mechanic, dominant weight).**
   Chessable's founding move was replacing flat fees with revenue share: "we gave them a
   percentage of revenue. We gave them the lion's share … Authors have essentially
   become our business partners, so most are highly involved … They update their
   repertoires; they answer questions" `[V]`
   https://www.chessable.com/blog/weve-done-it-50000-paid-to-chess-authors-in-2018-a-call-to-arms/
   This buys three things no algorithm can: exclusive world-elite content, ongoing
   author maintenance/Q&A (a community mechanic), and the *trust* transfer from GM brand
   to platform. The evidence that this — not MoveTrainer — carries the dominance:
   line-drilling SRS is freely cloneable and cloned (Listudy, Chessbook, ChessTempo
   openings) `[M]`, the algorithm itself is a fixed 1970s-style ladder (§1), yet
   competitors position against Chessable's *catalog*, not its scheduler `[M]`.
2. **The funnel (content-business mechanic).** Free **Short & Sweet** courses are
   author-branded previews of paid Lifetime Repertoires — "10-30 variations annotated by
   the author, sometimes with an hour or two of video" `[P]`
   https://www.chess.com/blog/TheUnidentifiedWolf/comprehensive-guide-to-chessables-free-short-and-sweet-opening-courses
   — plus dozens of fully free courses and a PRO subscription layering feature gates
   (Difficult Moves, soft-fail on own courses) over course-library access `[V]`
   homepage FAQ + §1 support articles.
3. **Science branding (product-adjacent marketing).** "Chessable uses science-backed
   learning techniques to help boost your retention by up to 95%", "We digest the
   science so all you have to do is show up and study" `[V]` https://www.chessable.com/;
   the CEO presents as "Chief Scientist" with a psychology-of-education MSc `[V]` blog
   author bios. The claim's strength is rhetorical; no citation for "95%" was found on
   the fetched pages `[V]` (absence on fetched pages only).
4. **Gamification (product mechanic, retention weight).** XP per correct review scaled
   by level (§1), ranks up to "Legend" and secret badges above it `[V]`
   https://support.chessable.com/en/articles/9043479-what-are-the-chessable-ranks,
   streak badges past one year with vacation protection and streak-repair support
   articles `[V]`
   https://support.chessable.com/en/articles/9043564-what-are-all-the-streak-badges-i-can-achieve,
   main + per-course + daily-streak leaderboards `[V]` overstudy article, `[P]` forum
   thread titles. Even a sympathetic author flags it: "XP and daily streaks don't
   improve chess strength" `[V]`
   https://juntaikeda.substack.com/p/3-lifetime-repertoires-the-10-pitfalls (pitfall 6).
5. **The MoveTrainer mechanic itself (product mechanic, real but secondary).**
   Matuschak's assessment is the fair one: the fine-grained read-move-quiz interleave is
   "an experience akin to the Mnemonic medium" with genuine auto-grading — and its
   ceiling is exactly our doctrine's: it "has no way to use this spaced repetition
   mechanism to reinforce conceptual knowledge" `[V]`
   https://notes.andymatuschak.org/zDr94hP6bG3jJYrdYy8B5hx. A practicing author agrees
   the scheduler is the product's core utility: "The automated review schedule is the
   main value add of the platform" `[V]` https://www.zwischenzug.gg/p/how-to-use-chessable
6. **Breadth adjacencies** (Classroom video-call tool for schools, up to 1000 students;
   offline mobile apps) `[V]` homepage — real, but not what the owner's question is about.

**Honest weighting:** the *paying* is for authors and their maintained repertoires (1–2);
the *daily returning* is the scheduler plus streak loop (4–5). The moat is a two-sided
content marketplace wearing an SRS; the SRS alone would not have won. That is a finding
about **content strategy** (packs need authored identity and a free-preview funnel) at
least as much as about features — it lands next to `design/04-content-architecture.md`
rather than the runtime.

## 3. Criticisms — verified, not strawmanned

1. **Memorization without understanding — real, said by Chessable's own authors.** GM
   Ikeda: "Memorising opening moves doesn't help you find better moves" `[V]`
   https://juntaikeda.substack.com/p/3-lifetime-repertoires-the-10-pitfalls; Solon:
   "Don't: Mindlessly memorize lines without thinking about the reason behind the moves"
   `[V]` https://www.zwischenzug.gg/p/how-to-use-chessable; Matuschak's structural
   version in §2; the 30-day review's "memorized moves collapse the moment your opponent
   plays something off-book" `[V→repo]` `teardown-chessable-desk.md`. The doctrine's
   critique is the market's own, verbatim.
2. **Review debt — real, acknowledged in Chessable's own docs.** "A high number of
   variations in the learning stage may mean that you risk overloading yourself with
   reviews … avoid endlessly repeating material … this will end up occupying all of your
   study time" `[V]` learning-status-calculated article; a support article literally
   titled "I constantly have too many moves to review. Can I adjust this?" exists `[V]`
   (linked from the same page); Solon's regimen is a defense mechanism (10-minute
   timebox, reviews before new lines) `[V]` zwischenzug. Reddit-thread sentiment (review
   loses whole-line context, stops too early, poor mobile/video behavior) already logged
   `[P→repo]` `competitor-love-hate-sweep.md` line 85.
3. **Equal weighting of rare lines — real.** "Spaced repetition weights common and rare
   lines equally, making it impractical"; a user drilled a line "never played in
   millions of OTB games" `[V]`/`[P]` juntaikeda pitfall 1 + search extracts. Priority
   Lines mitigate at learn-order level only (§1).
4. **Lapse harshness.** Any miss resets the move to Level 1/4-hours regardless of its
   maturity `[V]` SRS article — the mechanism behind both the debt spiral (a bad day
   re-immatures a mature course) and forum threads proposing algorithm overhauls `[P]`
   thread titles ("Suggestion: Radically Change Spaced Repetition").
5. **Alternatives converge to the text move; transpositions are editorial** — §1 and the
   standing teardown; the sound alternative is tolerated, never taught or played out
   `[V→repo]`.

None of these contradict our design docs; they are the gap the loop already claims. No
`DESIGN-GAP` raised.

## 4. The mining list

Ground truth about our side, from the repo: the return loop schedules **attempts**
(never moves) on a single 1/3/7/16/35 varied ladder with blocked/varied selection, one
pending item per learner+root, explicit refusal of mastery percentages, and "the
scheduler is intentionally small and explainable; it is not an FSRS/SM-2 mastery model"
`[V→repo]` `docs/return-and-progression.md`, `design/01-training-model.md` §Repetition
scheduling. Collisions are named per the `design/02` amendment: **a collision is a
design prompt, not a veto**.

Ranked by value-to-effort for *our drill packs*:

1. **Lapse-driven rescheduling + maturity states over roots** (product mechanic).
   Chessable's ladder only becomes a *memory* system through two things ours lacks: a
   failed review shortens the next interval, and level position rolls up into honest
   status words (learning/mature/difficult). Ours advances 1/3/7/16/35 with blocked vs
   varied, but an *unstable* graded attempt does not shorten the root's next return.
   **Maps onto:** the `schedules` table and the blocked/varied policy in
   `docs/return-and-progression.md` — add "unstable outcome → drop down the ladder
   (blocked, sooner)" and derive per-root status from ladder position, all
   event-derived. **Collisions:** none with law 8 (ladder position is arithmetic over
   counted outcomes); `/learn`'s "no mastery percentage" refusal is *respected* by
   using Chessable-style categorical words (learning/mature) instead of a percentage —
   and Chessable's full-reset harshness (§3.4) is the named anti-pattern to avoid:
   step down, don't reset. Stays inside "small and explainable".
2. **A difficult-roots surface** (product mechanic). Chessable's Difficult Moves is
   law-8-compatible by construction: threshold on counted mistakes, ordered by
   accuracy, each entry showing the actual wrong/right moves played and counts, with a
   graduation rule. **Maps onto:** `learner_position_stats` + attempt history →
   a `/learn` list of roots with repeated unstable attempts, each linking to the
   *preserved runs* (our upgrade over Chessable: the evidence is a replayable branch,
   not a flashcard stat). Feeds D549 (concept credit) and D552 (longitudinal feedback)
   with zero new inference machinery. **Collisions:** none — no cross-learner
   comparison, no skill claim; it is exactly "named from detected evidence".
3. **Corpus-frequency prioritization at the learner's band** (product mechanic, and the
   fix for Chessable's own top criticism). Algorithm-selected Priority Lines prove the
   mechanic; Chessbook's per-position expected-frequency math (already mined,
   `teardown-chessbook-desk.md` §3) is the better formulation. **Maps onto:** ordering
   of `/progress/due` and of pack lines/deviations by Lichess-explorer frequency in the
   learner's rating band — the explorer is already doctrine (Stage 0 source).
   **Collisions:** none; it is a grounded corpus statistic (rung-4 claims).
4. **The read→play-through→quiz ramp as a pack phase structure** (product mechanic —
   highest-value *design prompt*, not a free adoption). The learn phase — authored prose
   interleaved with physically playing the taught move, then the sequence, then
   scheduled quiz — is the best onboarding ramp in the category and the reason "book →
   trainable course" works at all. **Collision, squarely:** commit-before-learning
   (ADR-0006, `design/05` §1) — learn mode shows the answer before the learner decides.
   **Transformation:** a guided first pass is a *reading surface whose plays are not
   attempts* — the runtime already has the distinction ("an empty fork is recorded but
   not counted", `docs/return-and-progression.md`); a pack's first encounter may be an
   ungraded guided walk-through that never writes a countable attempt, with the quiz
   phase being the first real (committed, silent) attempt. Alternative transformation:
   first pass commits blind, and authored prose reveals *at checkpoints* — closer to our
   loop, further from Chessable's ramp. Which transformation wins is a pack-format
   design question — proposed as a ledger row below.
5. **Whole-variation review accounting** (product mechanic, small). The lesson is not
   replay-from-root (we have that natively — an attempt IS the whole line) but the
   **overstudy accounting**: the non-due prefix earns nothing, so progress numbers stay
   honest, and voluntary early re-drilling is allowed with asymmetric grading (wrong
   counts against you, right changes nothing). **Maps onto:** grading scope of a
   scheduled return + allowing off-schedule retries without advancing the ladder.
   **Collisions:** none.
6. **Scheduling flexibility: cyclical/custom/vacation** (product mechanic, small,
   later). Woodpecker-style cycles and vacation-safe streaks are pure scheduler
   settings. **Maps onto:** the existing explicit-schedule endpoint. **Collision:**
   none — but note `league-as-return-loop.md`'s finding that the licensed upgrade is
   *imposed* spacing; free-form custom schedules cut against that. Adopt vacation
   protection; defer custom intervals.
7. **Key-moves-style study windows** (authoring mechanic). Drilling a segment between
   two marked moves ≈ our anchored roots plus `plyHorizon`; largely already ours. Worth
   one authoring-lint idea: an automated "suggest the interesting anchor" script
   (Chessable automates key-move marking for authors). Low priority.
8. **Streaks/XP/leaderboards** (product mechanic, ranked last deliberately). Collisions
   are stacked: the shipped milestones contract forbids "score, streak, rating, ranking,
   or cross-learner comparison" (`docs/return-and-progression.md` `[V→repo]`);
   `league-as-return-loop.md` found social/competitive return mechanics null-to-negative
   on randomized evidence while our spacing ladder is the evidence-backed lever; and
   Chessable's own author calls the XP loop chess-irrelevant (§2.4). ADR-0007
   (progression never monetized) additionally bars the PRO-gating pattern around
   Difficult Moves — whatever we mine from §4.2 ships free. If any transformation is
   ever wanted, it is streak-as-return-cue (a reminder, not a score); not proposed now.

**Content-strategy findings (not features — routed to the owner, not the runtime):**
the revenue-share author marketplace, the Short-&-Sweet free-preview funnel, and
authored identity ("Giri's Najdorf", not "Najdorf pack") are the actual moat (§2). The
transferable minimum for us: packs carry a named author voice, and every paid-scale
competitor validates the free-preview ramp. These belong to `design/04`/campaign-era
decisions and are recorded here as evidence only.

## 5. The three adoptions with the highest value-to-effort

1. **Lapse-aware ladder + maturity vocabulary** (§4.1) — pure server logic over the
   existing `schedules` table; makes the shipped 1/3/7/16/35 ladder a real memory
   system; no invariant touched.
2. **Difficult-roots list on `/learn`** (§4.2) — one projection over data already
   recorded (`learner_position_stats`, attempts), links to preserved runs; directly
   feeds D549/D552.
3. **Corpus-frequency ordering of the due queue and pack deviations** (§4.3) — explorer
   API already in the stack; fixes the incumbent's most-cited scheduling flaw before we
   inherit it.

(§4.4, the guided first-pass ramp, is the highest-*value* item but is a design prompt
with an ADR-0006 transformation to choose, so it is proposed as a ledger row rather than
an adoption.)

## Proposed ledger rows (proposed at head D841; landed as D864–D868 — the head moved to D863 in flight)

- **D864** — lapse-aware rescheduling + derived maturity states over roots (§4.1).
- **D865** — difficult-roots surface from counted unstable attempts, linking preserved
  runs (§4.2).
- **D866** — corpus-frequency-at-band prioritization of due queue and deviations (§4.3).
- **D867** — guided first-pass ramp: choose the ADR-0006 transformation (ungraded
  walk-through vs commit-then-reveal-at-checkpoints) as a pack-format phase (§4.4).
- **D868** — content-strategy evidence: authored pack identity + free-preview funnel as
  the validated acquisition shape (§2, routed to `design/04`/owner).

## Residual uncertainty (needs hands-on)

- Whether review "Difficult" status or soft-fails feed scheduling beyond the timer
  refresh (inherited open question from `teardown-chessable-desk.md`).
- Exact 2026 mobile-app review UX (complaints in the love/hate sweep are `[P]`).
- Whether any transposition deduplication exists server-side (no primary source either
  way; §1 inference is `[P]`).
- The "up to 95%" retention claim's basis (no citation found on fetched pages).
