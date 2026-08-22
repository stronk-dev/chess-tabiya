# Titled-player training — the serious tradition, and which of it we already built

**Question** (owner, 2026-08-20 via task commission): *"How about 'traditional programs'?
How do IMs/GMs train/prepare? Some of that might enhance our drill pack features."*
Feeds: `design/01-training-model.md`, drill-pack format, [[D549]] (skills/progression),
[[D553]] (pattern-of-play indexing), and the [[D717]] program's "connected to a workflow"
criterion. Landed 2026-08-22, claude. Desk research (`[P]` throughout for the tradition;
`[V]` where a cited page was read directly this pass or a repo claim is traced to code).

**Headline finding first, because it is the one the owner asked for: three of the most
famous training methods in chess history are already shipped in this product as
end-to-end mechanisms with zero consumers.** Guess-the-move is
`CheckpointInteraction.prediction` (wired schema→REST→client→event, 0 authored packs,
and pack-gated so the one corpus it belongs on — imported games — can never reach it).
Botvinnik's write-before-checking is `stated_reasoning` (full grading machinery, one
browser fixture, 0 authored packs). Dvoretsky's endgame blitz and the Woodpecker's
shrinking clock are `TempoVerdict` (0 authored users). §5 traces each at the symbol.
The tradition does not ask this product for new machinery; it asks for wiring and
authored content.

---

## 0. Method and honesty ledger

- Web pass 2026-08-22: primary-adjacent sources preferred (publisher excerpts, a
  fetched ChessBase interview, a fetched method summary on Lichess, publisher/course
  pages); forum and review material labelled as such. No book was read cover-to-cover
  in this pass — every claim about a book's internal structure is `[P]` against the
  cited review/excerpt unless marked otherwise.
- Repo pass: code claims are `[V]` at file:line against HEAD; content census by grep
  over `content/`.
- Law 8 flags: every method that runs on a coach's judgement (model answers, point
  awards, critique) is marked **[needs authored content]** — the judgement is authored
  and reviewed, never LLM-generated.
- Prior art inside the repo: the deliberate-practice evidence base is already covered
  `[P]` (`arch/research/source_index.md` R01); `mechanics-by-mode.md` §2 already
  audits which mechanics exist. This dossier does not re-derive either; it maps the
  *tradition* onto them.

---

## 1. The classical school

### 1.1 Botvinnik — analysis of one's own games, published for criticism

The method Botvinnik codified (and taught at the school whose graduates include
Karpov, Kasparov and Kramnik) has these components `[P]`
([Cal Newport's summary](https://calnewport.com/mikhail-botvinnik-and-the-invention-of-modern-chess-training/),
[SayChess, "The Botvinnik Method"](https://lichess.org/@/SayChessClassical/blog/the-botvinnik-method-for-chess-improvement/SJOb6pBY) — the latter read directly this pass `[V]` as to what it states):

- **Annotate your own games deeply** — "chess is the art of analysis"; sloppy
  post-game notes are not annotations. Write the analysis *yourself, first*, then
  check — in his era against adjournment-style board analysis, today against the
  engine.
- **Publish the annotations** so others can point out errors — external criticism as
  the corrective for self-serving analysis.
- **School sessions**: each student presented four games (including at least one
  loss); the *other students* critiqued the analysis, with Botvinnik referencing
  historical theme positions ("a similar position happened in the Trade Union
  championship of 1931 — look at that game") `[P]`
  ([chesschatter](https://chesschatter.substack.com/p/chess-schools-training-methods-adult-improvers),
  [KCF/ChessBase on the school's system](https://en.chessbase.com/post/kcf-opens-with-veselin-topalov)).
- **Training games with a purpose**: clock discipline as a first-class target; when an
  endgame weakness was diagnosed, *deliberately transpose into endgames* during
  training games `[V]` against the SayChess page.
- Narrow, deeply-analysed opening repertoire (3–4 openings per colour); moderate
  physical regimen; 14–20 days of rest before events `[P]`.

What it trains: objective self-evaluation, evaluation calibration, and the habit of
having a *reason* on record before authority (engine/coach) speaks. Evidence:
anecdotal-institutional — three world champions from one school is selection-biased
evidence, but it is the strongest institutional track record any training method has
`[P]`.

### 1.2 Dvoretsky — technical positions drilled to automation, and positions played out

Dvoretsky (widely called the strongest trainer of the modern era) contributes three
distinct mechanisms:

- **The Endgame Manual's two-tier structure** `[V]` (read this pass:
  [ChessBase interview with Karsten Müller](https://en.chessbase.com/post/dvoretsky-s-endgame-manual-an-interview-with-karsten-mueller)):
  the material "everyone should know" is specially marked (highlighted in the 5th
  edition), outlining a *basic course inside the reference* — a small set of exact
  theoretical positions to be known cold, embedded in a much larger analytical
  corpus for professionals. Müller's own drilling advice in the same interview:
  build **a database of your own most important positions and go through it
  regularly**, plus study your own endgames.
- **Playing out positions**: think about a chosen position for a few minutes, then
  **play it out against a sparring partner, coach, or engine**; and "endgame blitz" —
  two pupils, an endgame from a practical game, 10–15 minutes each `[P]`
  ([TheChessWorld summary of his methods](https://thechessworld.com/articles/training-techniques/3-effective-training-methods-according-to-mark-dvoretsky/) —
  page returned 403 to direct fetch this pass; claim rests on the search snapshot and
  is consistent with his books' framing).
- **Analytical exercises with precise feedback**: hard positions solved independently
  *before* correction, exposing where the student stopped calculating too early or
  misevaluated; prophylactic-thinking exercises ("what does the opponent want?") as a
  named category `[P]` ([chessworld.net profile](https://www.chessworld.net/mark-dvoretsky.asp)).

What it trains: exact endgame knowledge as *retrievable procedure* (not recognition),
and conversion/defence under real resistance. Evidence: anecdotal, but near-universal
adoption — the Manual is standardly called the finest single endgame volume `[P]`.

### 1.3 Yusupov — the graded course: instruction, exercises, pass mark, redo

The 9-book ladder (Fundamentals / Beyond the Basics / Mastery × Build Up Your Chess,
Boost Your Chess, Chess Evolution; 24 chapters each) `[P]`
([chessgoals review](https://chessgoals.com/yusupov-training-program/),
[Kenya Chess Masala review](https://kenyachessmasala.com/2017/09/review-artur-yusupovs-chess-course.html),
[chess.com review](https://www.chess.com/blog/beccrajoy/book-review-yusupovs-build-up-your-chess-the-fundamentals)):

- Each chapter: a concept taught through 10–15 worked examples, then **12 exercises
  solved on a real board**, each worth graded points (harder = more points, partial
  credit for partial lines).
- **A pass mark per chapter** (e.g. 15 of 31 points in a cited chapter — the mark
  varies by chapter); below it, *redo the chapter*. A final test per book covers all
  24 chapters. A score card tracks the whole course.
- Exercise-to-instruction ratio is high: roughly half of each chapter's time is
  solving, not reading, and the marking scheme is authored per-exercise (model
  solutions with point awards) — **[needs authored content]**: the point schedule is
  a coach's judgement, exactly the thing law 8 forbids generating.

What it trains: breadth with enforced mastery gates — you cannot socially promote
yourself past a chapter. Evidence: FIDE Boleslavsky medal for best instructional
books (frequently cited in the reviews above) `[P]`; no controlled studies.

### 1.4 Aagaard — Grandmaster Preparation: calculation decomposed into named techniques

*GM Preparation: Calculation* structures calculation as named, separately-drilled
techniques, each with its own exercise chapter `[P]`
([publisher page](https://www.newinchess.com/gm-preparation-calculation),
[Forward Chess](https://forwardchess.com/product/grandmaster-preparation-calculation)):
**Candidate moves, Combinational vision, Prophylaxis, Comparison, Elimination,
Intermediate moves, Imagination, Traps**, followed by tests. The pedagogy: a short
technique essay, then ownership through a *carefully selected* series of exercises —
selection, again, being the authored judgement. The *Strategic Play* volume in the
same series does the same for positional decisions: exercises where the answer is a
plan or a comparison of plans, not a tactic.

What it trains: a decision *procedure*, not positions — "generate candidates before
calculating", "compare two near-equal moves", "eliminate to find the only move".
Evidence: anecdotal (widely used by titled players and cited in GM interviews) `[P]`.

---

## 2. Named drill methods

### 2.1 The Woodpecker Method — same set, shrinking intervals, shrinking clock

Smith & Tikkanen `[P]`
([publisher excerpt PDF](https://www.newinchess.com/media/wysiwyg/product_pdf/WoodpeckerMethod-excerpt.pdf),
[Chessable explainer](https://www.chessable.com/blog/the-woodpecker-method-explained-turbocharge-your-tactical-and-strategic-vision/),
[Forward Chess explainer](https://forwardchess.com/blog/what-is-the-woodpecker-method/)):
solve a large fixed set (~1000 puzzles) over ~4 weeks; then re-solve **the same set**
in cycles, each cycle targeted at **half the previous duration**, until the whole set
fits in one day. Tikkanen scored three GM norms in seven weeks after his 2010 cycle —
the method's founding anecdote, n=1 `[P]`.

**How it differs from SRS, precisely**: spaced repetition reviews items at
*increasing* intervals keyed per-item by recall; the Woodpecker reviews the *whole
fixed set* at *decreasing* intervals keyed by cycle, with speed as the explicit
target. SRS optimises retention; the Woodpecker optimises **automaticity** — patterns
surfacing without effort, blunder-resistance under time pressure `[P]` (same sources;
also [Chessable forum comparison thread](https://www.chessable.com/discussion/thread/239509/tactics-scheduling-spaced-vs-cyclical-vs-woodpecker-vs-hybrids/239766/)).
These are different training targets and a scheduler that can express only one of
them cannot fake the other.

### 2.2 Smirnov-style "one concept, many positions"

Igor Smirnov's courses (and the same shape in many video courses): a single principle
taught once, then a practical part of dozens-to-hundreds of tasks applying only that
concept `[P]` ([course catalogue](https://thechessworld.com/store/product/all-chess-courses-by-gm-igor-smirnov/) —
one course cited with 106 practical tasks). This is blocked practice by concept — the
same shape as Yusupov's chapters without the pass-mark rigour. It maps directly onto
our concept-tagged packs and the *blocked* half of the scheduling ladder; nothing new
to build, everything to author.

### 2.3 de la Maza — rejected, and worth saying why

*Rapid Chess Improvement* (Seven Circles: ~1,000 tactics, seven times, compressing to
one day — structurally the Woodpecker's ancestor) is rejected by most trainers `[P]`
([chess.com, "The Michael de la Maza Story"](https://www.chess.com/article/view/the-michael-de-la-maza-story),
[forum retrospectives](https://www.chess.com/forum/view/chess-equipment/did-quotrapid-chess-improvementquot-by-michael-de-la-maza-work-for-you)):
the follower blogs went dark, "the new wave of tactical masters didn't arrive"; gains
appear at low ratings and stall around class B; Heisman's critique — drilling
*advanced* problems to memorisation confuses recognition training (basic motifs,
repeated) with calculation training (hard problems, solved once) — is the load-bearing
one. **The lesson for us**: volume repetition works on *recognition-sized* units
only; our attempt-sized episodes are calculation-and-execution-sized, so a
"seven circles of attempts" feature would inherit the refuted half. The Woodpecker
survives the critique by restricting the set to pattern-sized exercises; any
tempo-cycle feature we build (§7.3) must inherit that restriction.

### 2.4 Blindfold and visualisation training

Long tradition (Soviet-era and since) of calculating without moving pieces; the
modern formulation is Tisdall's **stepping-stone** technique — hold one intermediate
position in clear focus, then extend from it `[P]`
([chessworld.net visualisation guide](https://www.chessworld.net/chessclubs/openingguide/chess-visualization-guide.asp),
[SayChess "invisible chess" series](https://saychess.substack.com/p/invisible-chess-ix)).
Benefit claims are about concentration and long-variation accuracy; evidence
anecdotal. Transfer for us is *possible but not a pack feature*: it is a board
display mode (hide pieces / delay rendering), and [[D717]]'s ruling protects the
board experience — a visualisation mode is its own design question, not an
enhancement to ship en passant. Not carried into §7.

### 2.5 Guess-the-move over master games — the oldest software-shaped method

"Solitaire Chess": play through a master game as one side, commit to your move before
seeing the master's, score yourself. C.J.S. Purdy described the method in detail and
it ran for decades as a magazine column (Horowitz/Pandolfini in *Chess Life*); it is
productized today by chess.com's lessons/Solitaire content,
[ChessTempo's Guess the Move](https://chesstempo.com/guess-the-move/), and
[chessgames.com's Guess-the-Move](https://www.chessgames.com/perl/guessthemove) with
per-move point scoring `[P]`
([The Chess Improver on Purdy and the method](https://chessimprover.com/supercharge-your-training-with-solitaire-chess/)).
What it trains: move selection under real-game distribution — the exact
"distribution and context" weakness of puzzles that `design/00-thesis.md` names.
Purdy's protocol also demands committing to a *plan*, not just a move — our
`intent_capture` is the same idea.

### 2.6 Sparring from set positions — the method our thesis already is

Botvinnik-school training games from theme positions; Dvoretsky's play-outs (§1.2);
and today **ChessDojo's program**, whose sparring is defined as *"playing out
segments of games, repeatedly, from certain set positions to acquire very deep
knowledge in small areas"* — used for openings, endgame theory, positional endgame
skill and middlegame understanding, organised by rating cohort with prescribed slow
time controls (90+30 down to 30+15 by band) `[P]`
([Dojo launch post](https://www.chess.com/blog/ChessDojo/launching-the-dojo-training-program-0-2400),
[member review](https://www.chess.com/blog/GoldsmanB/my-review-of-the-chess-dojo-training-program),
[chessdojo.club](https://www.chessdojo.club/)). This is the product's thesis with a
human sparring partner instead of Maia; it needs no transfer map because it *is* the
map. Two details worth stealing rather than the whole: the **cohort-banded
prescription** (which positions at which rating, at which time control) and
**repetition of the same position until deep** — both authored-curriculum decisions,
both expressible in the shipped pack schema today.

---

## 3. Modern GM preparation — and the professional/learner line

- **Opening file construction**: a "file" is a private annotated tree per opening —
  engine main lines *plus* humanly-unpleasant sidelines, transposition notes, and
  novelties (positions where the engine's 2nd–6th choices hide playable surprises),
  maintained against a live game database and refreshed as theory moves `[P]`
  ([Chessify on novelty hunting](https://chessify.me/blog/7-exclusive-grandmaster-tips-on-how-to-find-chess-opening-novelties),
  [TheChessWorld opening-prep guide](https://thechessworld.com/articles/openings/opening-preparation-complete-guide/)).
  Preparation regularly runs past move 20 with seconds and cloud engines
  ([2018 WCC](https://en.wikipedia.org/wiki/World_Chess_Championship_2018) `[P]`).
  **Professional-only**: the *construction* (novelty hunting, seconds, cloud
  compute). **Transfers**: the *consumption* — drilling your own file past book
  against realistic deviations is exactly Line Drill, and "import my repertoire
  and drill it" is the learner-sized version of having a file at all.
- **Sparring against engines at handicaps** (reduced strength, odds, or restricted
  openings) is standard practice-partner substitution `[P]` — our
  band-conditioned Maia is the honest version of this (weakened-Stockfish is
  explicitly on the rejected list), and the R10/D324 outcome-transfer measurements
  mean our handicap dial has *better* evidence than the tradition's.
- **Physical and psychological prep** (Botvinnik's countryside weeks; modern
  fitness camps, e.g. Carlsen's Lanzarote camp before 2018 `[P]`,
  [Wikipedia](https://en.wikipedia.org/wiki/World_Chess_Championship_2018)):
  real, and out of product scope. The only learner-sized residue is session
  pacing/rest, which is a scheduling-tone question, not a feature.

---

## 4. The transfer map

Method → what it trains → evidence grade → our mechanism → wiring status. Repo
status is `[V]` at HEAD (2026-08-22); tradition columns `[P]` per the sections above.

| Method (tradition) | Trains | Evidence | Our mechanism | Status |
|---|---|---|---|---|
| Theme-position sparring (Botvinnik school, Dvoretsky play-outs, ChessDojo) | plan execution under resistance | institutional/anecdotal, strongest in tradition | from-position runs + Maia bands + rewind/branch/compare | **WIRED — this is the thesis** |
| Dvoretsky technical positions (the marked basic course) | exact endgame procedure | near-universal adoption | endgame packs with `opponentPolicy.mode: perfect_tablebase` | **WIRED, thin** — 6 content files `[V]` (grep, `content/`) |
| Guess-the-move / Solitaire (Purdy →) | real-distribution move selection | decades of practice, productized 3× today | `CheckpointInteraction.prediction` | **DEAD** — §5.1 |
| Write-before-checking (Botvinnik); analytical exercises (Dvoretsky) | evaluation calibration, reasons-on-record | institutional/anecdotal | `stated_reasoning` + `ReasoningKeyPoint` grounds | **DEAD** — §5.2 |
| Endgame blitz (Dvoretsky); shrinking clock (Woodpecker) | automaticity, time-pressure competence | anecdotal (n=1 founding case) | `WindowTrigger`/`TempoVerdict` | **DEAD** — §5.3 |
| Pass-mark chapters + scorecard (Yusupov) | enforced mastery gating, progression | FIDE-award pedigree, no RCTs | objective verdicts + `attempt_concepts` credit stream | **HALF-DEAD** — §5.4; [[D549]]'s exact shape |
| Candidates/comparison/elimination before committing (Aagaard); plan-first (Purdy) | decision procedure | anecdotal, wide titled adoption | `intent_capture` (plan classes) | **WIRED** — 49 content files `[V]` |
| Blocked "one concept, many positions" (Smirnov, Yusupov chapters) | concept consolidation | anecdotal | concept-tagged packs + blocked half of the ladder | **WIRED**, authoring-bound |
| Expanding-interval return (SRS-adjacent common practice) | retention | strong general literature (`arch` R01 adjacent) | blocked/varied ladder `[1,3,7,16,35]` days, `storage.ts:1892` `[V]` | **WIRED** — but cannot express the Woodpecker (shrinking) direction |
| Deliberate endgame transposition / opposite-side replay (Botvinnik) | weakness-targeted play | anecdotal | derivations + `first_flip_sides` milestone `[V]` `service.ts:649` | **WIRED** |
| Peer critique of published analysis (Botvinnik) | objectivity | institutional | share links exist; no critique surface | **NOT BUILT** — human-social, see §6 |
| Repertoire-file drilling (consumption side of GM prep) | book + past-book competence | universal professional practice | Line Drill + realistic deviations | **WIRED** |
| Novelty hunting, seconds, cloud prep (construction side) | — | — | — | **DOES NOT TRANSFER** — §6 |
| Seven Circles on hard material (de la Maza) | (refuted) | negative — trainer consensus against | — | **DO NOT BUILD** — §2.3 |
| Blindfold/stepping-stones | visualisation | anecdotal | none (board display mode) | **OWN QUESTION**, not a pack feature — §2.4 |

---

## 5. Shipped-but-dead — famous methods we built and never connected `[V]`

The finding the owner asked for. All traces at HEAD.

### 5.1 Guess-the-move IS `prediction`, and it is quadruply dead

The wiring is complete end to end: schema
(`packages/schema/src/drill-pack/types.ts:148-151`), REST route
(`apps/server/src/rest.ts:659,1595`), service handler recording the guess *with its
mass and rank inside the opponent's Maia distribution*
(`apps/server/src/service.ts:1195-1227`), client API and session controller
(`apps/web/src/lib/api.ts:625,998`, `session-controller.ts:350`), runtime event
(`packages/runtime/src/events.ts:282`), even a lint capping predictions at 2 per
segment (`lint.ts:267-280`). And:

1. **Zero authored packs** use the interaction (grep over `content/`: no hits).
2. **Grading was deleted**, not built — schema 0.8→0.9 removed
   `grading{source, topK, minMass}` for a threshold-free `prediction.recorded`
   ([[D320]] `[V]`), which
3. **nothing reads** — the event's only consumer is an integrity check
   (`events.ts:282-289`).
4. **The pack gate locks out its natural corpus**: `service.ts:1204` requires a
   registered pack checkpoint, so an *imported game* — the master-game corpus that
   guess-the-move has run on since Purdy — can never record a prediction, although
   the import and story routes ship (`rest.ts:659` lists `import`/`story` beside
   `prediction`).

The buried treasure: because the record already stores `predictedMass`/
`predictedRank` against the **human-move distribution**, a graded guess-the-move here
is law-8-clean by construction — the reference is "the move actually played, and how
human your guess was", never an engine verdict.

### 5.2 Write-before-checking IS `stated_reasoning`, with one browser fixture to its name

Full machinery: interaction type with authored `ReasoningKeyPoint`s, each grounded in
a checkable ground — `structural` expression, `shape_plan`, `spine_move`, or authored
`claim` (`types.ts:152-168`); client sheet UI (`CheckpointSheet.svelte:92-159`);
server matching and review flow (`apps/server/src/reasoning.ts`,
`service.ts:1249,1308`); authored-feedback gating that *withholds feedback until
reasoning is recorded* (`authored-feedback.ts:127-131`) — which is precisely
Botvinnik's write-first discipline and Dvoretsky's solve-before-correction, encoded.
Authored uses: **one browser fixture**, `content/drafts/stated-reasoning.browser.json`
`[V]` (grep). This is a content debt, not a build: the key points and their grounds
are coach-judgement material — **[needs authored content]**, per law 8.

### 5.3 The clock side of the tradition IS `TempoVerdict`, with zero authored users

`WindowTrigger`/`TempoVerdict` grade timing against an authored budget
(`types.ts:135-139`; [[D320]]: the *one computed judgement of learner behaviour in
the product*, zero authored users `[V]`). The tradition that wants it: Botvinnik's
clock-discipline training games, Dvoretsky's 10–15-minute endgame blitz, and the
Woodpecker's cycle-speed target. Meanwhile the scheduler's ladder is
expanding-only (`[1, 3, 7, 16, 35]` days, `storage.ts:1892` `[V]`) — the SRS
direction — so the Woodpecker's defining move (same set, *shrinking* intervals,
tightening clock) is currently inexpressible even though both halves of its
machinery (attempt re-serving; tempo windows) ship.

### 5.4 Yusupov's scorecard IS `attempt_concepts` plus verdicts nobody aggregates

Per-exercise points, a pass mark, and a course scorecard require: graded outcomes
(ship: objective verdicts per attempt), concept credit (ships consumerless:
`attempt_concepts`, [[D300]]/[[D549]]), and an aggregation with a threshold (does
not exist — and [[D562]] correctly warns any aggregate must show its evidence).
[[D549]] already routes this; the tradition's contribution is the *shape*: *pass
marks gate progression per chapter-sized pack, redo on fail* — a pack-level
authored threshold, not a learner rating, so it stays on the right side of
[[D320]]'s "no learner number" line: the pass mark judges *this pack's attempt set*,
exactly like the shipped "grade of this attempt, not a verdict on the position".

---

## 6. What does not transfer, plainly

- **Adjournment-scale analysis and residential sessions.** Botvinnik's method runs on
  days per game and 7–10-day camps. The *discipline* transfers (§5.2); the *time
  scale* does not fit a product session and should not be simulated.
- **Novelty hunting and opening-file construction.** Requires cloud engines, seconds,
  and a professional's stake in surprise value. The learner-sized residue is
  consuming a repertoire as drills — already Line Drill.
- **Publishing for peer criticism.** The corrective force is *other strong humans*.
  A product can host sharing (share links ship) but cannot generate the criticism
  without violating law 8 (grading analysis is exactly move/strategic judgement).
  If ever built, it is a social surface, not a pack feature.
- **Physical/psychological preparation.** Out of scope; at most session-pacing tone.
- **de la Maza's Seven Circles as shipped.** Rejected by the trainer consensus and by
  our own thesis (the tactics-volume product is the anti-pattern the product
  explicitly refuses). Only the recognition-sized, Woodpecker-corrected form (§2.3)
  may inform a feature.
- **Coach-judgement cores of every classical method** — Yusupov's point awards,
  Aagaard's exercise selection, Dvoretsky's precise feedback, Botvinnik-school
  critique. These transfer **only as authored content**; generating them is the named
  law-8 anti-pattern.

---

## 7. The three pack-feature enhancements with the highest value

Each stands on a named tradition, uses shipped machinery, and needs a ledger row
(proposed §8; landed as D860–D863 — the head moved to D859 while this dossier was in flight).

1. **Guess-the-move on imported games** — tradition: Purdy/Solitaire Chess (§2.5),
   productized by three incumbents today. Work: lift the pack gate on
   `recordPrediction` for imported-game runs (or synthesize prediction checkpoints
   at import), and give `prediction.recorded` its first consumer — a per-game
   solitaire score from the already-stored `predictedMass`/`predictedRank` against
   the human distribution plus match-with-the-played-move. Highest value because the
   entire mechanism ships dead (§5.1), the corpus (any PGN) is free, and the grading
   is law-8-clean by construction.
2. **Pass-mark packs (chapter mode)** — tradition: Yusupov's graded course (§1.3),
   Dvoretsky's marked basic course (§1.2). Work: an authored pack-level scorecard —
   per-attempt points from existing objective verdicts, an authored pass threshold,
   redo-on-fail — consuming `attempt_concepts` for the credit stream. This is
   [[D549]]'s progression surface with a century-old pedigree and an honest,
   pack-scoped number ([[D320]]-compatible). **[needs authored content]** for point
   schedules and thresholds.
3. **Tempo cycles (Woodpecker/endgame-blitz mode)** — tradition: Woodpecker (§2.1),
   Dvoretsky's endgame blitz (§1.2), Botvinnik's clock discipline (§1.1). Work: a
   scheduling mode that re-serves a *fixed authored set* of recognition-sized
   attempts at shrinking intervals with a tightening authored tempo budget, graded
   by the currently-userless `TempoVerdict`. Restricted to pattern-sized material
   (the de la Maza correction, §2.3) — pack-declared, not learner-chosen.

Runner-up, deliberately not in the three: **authored `stated_reasoning` content**
(§5.2) — the mechanism is the most classical of all (Botvinnik write-first), but the
enhancement is an authoring wave, not a pack-format feature, and belongs with the
B4 vocabulary/content debt already tracked.

---

## 8. Proposed ledger rows (proposed only — not written; head verified D850)

- **D851 💡** Guess-the-move on imported games: lift `recordPrediction`'s pack gate
  for import runs and add the first `prediction.recorded` consumer (solitaire score
  from stored mass/rank + played-move match). Tradition: Purdy/Solitaire (§2.5,
  §5.1, §7.1). Law-8-clean: human-distribution reference, never engine verdict.
- **D852 💡** Pass-mark packs: authored pack-level scorecard (points, threshold,
  redo-on-fail) over existing verdicts + `attempt_concepts`. Tradition: Yusupov
  (§1.3, §5.4, §7.2). Joins [[D549]]/[[D562]]'s constraint set.
- **D853 💡** Tempo cycles: shrinking-interval, tightening-budget re-serve of a
  fixed pattern-sized set, graded by `TempoVerdict`. Tradition:
  Woodpecker/Dvoretsky blitz (§2.1, §5.3, §7.3), with the de la Maza restriction
  authored into eligibility.
- **D854 💡** `stated_reasoning` authoring wave: first real packs for the shipped
  write-before-checking mechanism (§5.2); content debt, pairs with B4.

---

## Sources (primary-adjacent first)

- ChessBase — Müller interview on Dvoretsky's Endgame Manual (fetched `[V]`):
  <https://en.chessbase.com/post/dvoretsky-s-endgame-manual-an-interview-with-karsten-mueller>
- SayChess — The Botvinnik Method (fetched `[V]`):
  <https://lichess.org/@/SayChessClassical/blog/the-botvinnik-method-for-chess-improvement/SJOb6pBY>
- Quality Chess / New In Chess — Woodpecker Method excerpt:
  <https://www.newinchess.com/media/wysiwyg/product_pdf/WoodpeckerMethod-excerpt.pdf>;
  publisher page for Aagaard, *GM Preparation: Calculation*:
  <https://www.newinchess.com/gm-preparation-calculation>
- Cal Newport — Botvinnik and modern training:
  <https://calnewport.com/mikhail-botvinnik-and-the-invention-of-modern-chess-training/>
- KCF/ChessBase — the Botvinnik school system:
  <https://en.chessbase.com/post/kcf-opens-with-veselin-topalov>
- TheChessWorld — Dvoretsky's three methods (403 on fetch; search snapshot):
  <https://thechessworld.com/articles/training-techniques/3-effective-training-methods-according-to-mark-dvoretsky/>;
  opening preparation guide: <https://thechessworld.com/articles/openings/opening-preparation-complete-guide/>
- Yusupov course reviews: <https://chessgoals.com/yusupov-training-program/>;
  <https://kenyachessmasala.com/2017/09/review-artur-yusupovs-chess-course.html>;
  <https://www.chess.com/blog/beccrajoy/book-review-yusupovs-build-up-your-chess-the-fundamentals>
- Chessable — Woodpecker explained:
  <https://www.chessable.com/blog/the-woodpecker-method-explained-turbocharge-your-tactical-and-strategic-vision/>;
  scheduling comparison thread:
  <https://www.chessable.com/discussion/thread/239509/tactics-scheduling-spaced-vs-cyclical-vs-woodpecker-vs-hybrids/239766/>
- Forward Chess — Woodpecker explainer: <https://forwardchess.com/blog/what-is-the-woodpecker-method/>;
  Aagaard Calculation: <https://forwardchess.com/product/grandmaster-preparation-calculation>
- chess.com — The Michael de la Maza Story:
  <https://www.chess.com/article/view/the-michael-de-la-maza-story>; RCI retrospective forum:
  <https://www.chess.com/forum/view/chess-equipment/did-quotrapid-chess-improvementquot-by-michael-de-la-maza-work-for-you>;
  ChessDojo launch: <https://www.chess.com/blog/ChessDojo/launching-the-dojo-training-program-0-2400>;
  Dojo member review: <https://www.chess.com/blog/GoldsmanB/my-review-of-the-chess-dojo-training-program>
- The Chess Improver — Solitaire Chess and Purdy:
  <https://chessimprover.com/supercharge-your-training-with-solitaire-chess/>
- ChessTempo Guess the Move: <https://chesstempo.com/guess-the-move/>;
  chessgames.com Guess-the-Move: <https://www.chessgames.com/perl/guessthemove>
- Chessify — GM novelty-hunting tips:
  <https://chessify.me/blog/7-exclusive-grandmaster-tips-on-how-to-find-chess-opening-novelties>
- Wikipedia — World Chess Championship 2018 (camps, seconds):
  <https://en.wikipedia.org/wiki/World_Chess_Championship_2018>
- chesschatter — five chess-school methods:
  <https://chesschatter.substack.com/p/chess-schools-training-methods-adult-improvers>
- chessworld.net — Dvoretsky profile: <https://www.chessworld.net/mark-dvoretsky.asp>;
  visualisation guide: <https://www.chessworld.net/chessclubs/openingguide/chess-visualization-guide.asp>
- SayChess — invisible chess (visualisation): <https://saychess.substack.com/p/invisible-chess-ix>
- TheChessWorld store — Smirnov catalogue:
  <https://thechessworld.com/store/product/all-chess-courses-by-gm-igor-smirnov/>
- ChessDojo: <https://www.chessdojo.club/>
