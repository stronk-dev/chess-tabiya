# Mistake-derived return decks — exercise eligibility before automation

**Date:** 2026-09-07
**Question:** When can a grounded Review event become a bounded, scheduled Tabiya exercise without
turning an engine swing, classifier firing or LLM sentence into chess truth?
**Feeds:** [[D3097]], [[D3099]], [[D3100]], Review Map, Review evidence compiler, return scheduling,
pack capability, longitudinal history and the integrated 1.0 roadmap.

## Verdict

**The joined workflow is worth building; a Review moment is not yet an exercise.** `[V]` Noctie
demonstrates the valuable outer loop—play, review, automatically receive a small return deck, then
revisit it through a queue—and its own retrospective says the unbounded first version overwhelmed
learners. It now groups automatic flashcards into size-limited Smart Decks and a Smart Queue. Its
current roadmap still lists duplicate removal and flashcard quality as unfinished, and publishes no
reproducible selection or solution contract. The flow is evidence; its chess semantics are not.
([Noctie 2024 retrospective](https://noctie.ai/newsletter/everything-we-launched-in-2024/),
[current roadmap](https://noctie.ai/roadmap/),
[puzzles from games](https://noctie.ai/puzzles-from-your-games/))

**Tabiya can reuse one runtime, but cannot merely export Story cards into `/learn`.** `[V]` The
shipped system already preserves imported game trees, re-enters a selected node, runs ordinary
opponent policies, records attempts and schedules `pack` or `position` roots. It does not retain the
minimum object that makes a return exercise truthful: the decision position, learner side, declared
goal, acceptance rule, opponent-continuation rule, stopping rule and exact evidence that licensed
each of those choices. `StoryMoment` has none of those semantics; `ScheduleRow` cannot carry them.
(`packages/runtime/src/story.ts:11-31`, `apps/server/src/storage.ts:491-507`,
`apps/server/src/service.ts:1993-2071`)

**The automatic eligibility boundary differs by family.** `[M]`

- A tactical or tablebase exercise can be generated when bounded search or exact rules prove its
  accepted alternatives and consequence.
- An opening return can be generated when an authored repertoire or cited opening source defines
  the admitted line. Human frequency may say common/uncommon; it may not say correct/incorrect.
- A structural detector may nominate a position, paint a fact, or join an already-authored
  objective. It cannot manufacture the plan the learner is meant to execute.
- An interesting strategic moment without a grounded objective may still become an **ungraded
  scenario**—play from here, preserve every branch, compare—rather than a fake puzzle.

That distinction is the answer to the owner's request for mistake decks that extend beyond
Stockfish/Maia: **automatic does not mean every card is a best-move puzzle, and structural does not
mean a classifier gets to invent a lesson.**

## Method and limits

This pass combined:

1. a current code audit of Story, imported-run re-entry, pack objectives, run creation, attempts and
   schedules; `[V]`
2. current first-party Noctie product and roadmap documentation; `[V]` for vendor-documented
   product shape, not effectiveness;
3. Lichess's current open `retroCtrl.ts` implementation and 2016 technical explanation of Learn
   From Your Mistakes; `[V]`
4. Lichess's public puzzle format plus the open puzzle generator's eligibility code. `[V]`

No Noctie subscription flow was driven. Noctie does not publish its grading, card-selection or
solution equations, so claims such as *“most instructive”* and *“judges like a human”* remain vendor
claims. No learner-effect study was found or inferred. This dossier establishes a product and data
contract boundary; it does not choose final queue counts or claim that generated exercises improve
learning.

## 1. What ships in Tabiya, end to end

| Stage | Shipped fact | What is missing for an automatic return exercise |
|---|---|---|
| Import | One PGN or public Lichess game becomes an immutable imported mainline with learner side and per-node durable engine jobs. `[V]` | Account sync/bulk mining is intentionally absent; this does not block a one-game return deck. |
| Review nomination | Story detects pivotal markers, consecutive ≥150 cp swings, last-level, first endgame, shape spans and result. `[V]` | A moment is not a decision: it carries no accepted move set, goal, opponent contract or stop rule. |
| Review selection | Story ranks up to eight; draft Review Map proposes a separate 0..3 door selection. `[V]` | Whole-game pedagogical eligibility is unresolved; “largest swing” is not an exercise contract. |
| Re-entry | The web action rewinds and creates a `story-reentry` branch before opening the normal run. `[V]` | For a non-terminal evaluation pivot, current `entryNodeId` is the **post-move node**, so it resumes after the mistake rather than retrying the decision ([[D3100]]). |
| Run | Pack and position sessions share the branch/opponent/evidence/compare runtime. `[V]` | Position runs have no authored objective; a generated return cannot silently borrow a pack verdict. |
| Attempt | Countable branches project to durable attempts with source-run provenance. `[V]` | Imported runs do not project attempts; the derived exercise needs its own immutable source link. |
| Schedule | One pending row per learner/root; pack returns recreate the pack, position returns duplicate the source. `[V]` | Rows store only root/session/pack, blocked-vs-varied, optional variant and source node. They cannot replay a generated goal/acceptance/stop contract. |

Sources: `docs/game-import-and-story.md`, `docs/return-and-progression.md`,
`packages/runtime/src/story.ts:167-215`, `apps/server/src/service.ts:892-937,1993-2071`, and
`apps/server/src/storage.ts:491-526,2914-2938`.

### 1.1 The re-entry off-by-one is product-visible

`storyMoments` compares `evaluations[index - 1]` with `evaluations[index]`, then attaches the
`eval_pivot` to `path[index]`. For every non-terminal moment it emits `entryNodeId: node.id`.
`GameStoryScreen` sends that value to the action which rewinds and forks. `[V]`

Those bytes are internally consistent and semantically wrong for *retry this move*: the board is
already after the move. The existing terminal special case uses the parent only to avoid opening a
dead board; it does not solve decision identity. [[D3100]] records the repair requirement:

- `evidenceNodeId`: where the observed consequence/fact holds;
- `decisionNodeId`: the position before the learner choice;
- `consequenceEndNodeId` or an equivalent bounded stop identity.

A structural moment may legitimately have the same evidence and entry node. An eval-derived move
retry may not. One overloaded `entryNodeId` cannot express both.

## 2. What the external implementations actually prove

### 2.1 Noctie proves continuity and boundedness, not semantic depth

Noctie says completed games and synced Chess.com/Lichess games produce flashcards from opening
mistakes, missed tactics/checkmates and endgame mistakes, and that those cards enter normal decks
and spaced repetition. `[V]` It describes selection as *“most instructive”* and human-perspective,
but publishes no equations, alternative-move policy, line-depth rule or abstention rate.
([product page](https://noctie.ai/puzzles-from-your-games/),
[account-link announcement](https://noctie.ai/newsletter/link-your-chess-account/))

Its strongest disclosed lesson is queue design. The first automatic-card experience produced a
*“sheer number of unsolved exercises”*; the redesign introduced deck size limits, handcrafted decks,
composable queues and progress visualization. `[V]` Its live roadmap still says *“Remove duplicates
and raise quality of flashcards”* and lists pattern explanations/visualizations as future work.
([retrospective](https://noctie.ai/newsletter/everything-we-launched-in-2024/),
[roadmap](https://noctie.ai/roadmap/))

**Adopt:** the automatic handoff, bounded deck, one queue, visible progress, and the pairing of a
human-policy opponent with return play. `[M]`
**Do not import as authority:** “instructive,” move grading, dedupe or structural semantics. `[M]`

### 2.2 Lichess Learn From Your Mistakes is a decision retry, not a durable deck

The current open controller: `[V]`

- selects `evalSwings` for one color;
- jumps to the **parent** of the faulty move;
- treats the computer-analysis child as the reference solution;
- accepts a proposed move if it is a master-opening move, checkmate, the computer line, or local
  evaluation loses no more than 0.04 winning-chance points from the prior position;
- suppresses an opening fault if more than one master game contains the played move;
- deletes an unsuccessful off-mainline leaf and returns to the decision position;
- keeps only an in-memory solved-ply list and offers reset/flip, not a durable spaced deck.

Source: [current `retroCtrl.ts`](https://github.com/lichess-org/lila/blob/master/ui/analyse/src/retrospect/retroCtrl.ts).
The original technical explanation also documents nonlinear winning-chance selection and the
two-master opening exception. `[V]`
([Lichess blog](https://lichess.org/@/lichess/blog/learn-from-your-mistakes/WFvLpiQA))

This is useful as an eligibility baseline, not the Tabiya target. It validates **retry before
reveal** and plural accepted moves. It does not preserve failed attempts, play a consequence under
human resistance, compare branches, schedule the position or produce structural objectives.

### 2.3 Lichess puzzle generation is intentionally narrow and expensive

The public puzzle contract says the presented position is after the opponent's first listed move,
the learner's first solution move follows, and every learner move is an “only move” that materially
preserves the position, except that any mate-in-one is accepted. The current public corpus contains
more than six million rated/tagged puzzles; its page reports 600 million analyzed games, later
40-meganode re-analysis, automatic tagging, solve-based Glicko ratings and vote-refined popularity.
`[V]` ([open database](https://database.lichess.org/#puzzles))

The open generator makes the narrowness executable. It refuses positions with fewer than two legal
moves, repeated positions, already-won material cases and attacks without a sufficiently separated
best continuation; it uses tablebase-only-winning moves, mate handling or a >0.7 winning-chance gap
against second best, recursively constructs the response line, and discards trivial one-movers.
`[V]` ([generator source](https://github.com/ornicar/lichess-puzzler/blob/master/generator/generator.py))

That is strong evidence for one rule: **a forced tactical exercise needs solution-set proof, not a
theme tag or an eval drop.** It is not evidence that the same generator can truthfully create a
Carlsbad-plan, prophylaxis, outpost or “improve your worst piece” exercise.

## 3. Eligibility matrix

The following is the smallest truthful automatic boundary supported by the evidence above. It is a
research conclusion, not a final schema.

| Return kind | May nominate | What must establish the objective | Accepted alternatives | Consequence / stop | If missing |
|---|---|---|---|---|---|
| **Tactical decision retry** | Grade/eval swing plus a semantic tactic firing | Bounded search or exact rules proving the tactic/outcome from the **pre-move** decision | Every move satisfying the same proved result; never PV[0] alone | Recorded/search reply sequence until the proved tactic resolves, then normal branch play may continue | Abstain from exercise; keep Review fact |
| **Mate** | Mate transition or missed mate | Rules/mate search with exact mate distance/bound | Every mating move inside the declared bound; mate-in-one is explicitly plural | Checkmate or loss of the declared mate guarantee | Abstain or render analysis only |
| **Tablebase endgame** | WDL/DTZ regression, missed preservation, promotion transition | Exact tablebase category and 50-move-aware operands | Every move preserving the declared WDL/DTZ condition | Category restored, terminal result, or declared bounded horizon | Ungraded scenario if tablebase scope unavailable |
| **Opening return** | Exact opening/repertoire identity and deviation | Authored repertoire/book contract or cited theory edge; corpus only reports population | Every edge admitted by that exact source/version | Book boundary, authored checkpoint, or explicit off-book handoff | Theory note or ungraded play; no engine-invented “book mistake” |
| **Structural / strategic consequence** | Structural transition, shape firing, plan-window event, relevant move delta | Existing authored pack objective, cited principle with executable predicate, or exact rules consequence | Moves satisfying the authored/executable objective—not moves merely improving eval | Authored checkpoint, predicate transition, or bounded comparison horizon | **Ungraded scenario** with fact overlays and compare; never auto-author a plan |
| **Recovery after the mistake** | Post-move position where the learner is worse | Existing `save`/`hold`/`resist` objective with an exact rules/tablebase/engine condition and declared horizon | Any continuation satisfying that objective | Objective state or terminal boundary | Ungraded scenario |
| **Human-choice surprise** | Maia/corpus says the played reply was rare or a common alternative exists | No “correctness” claim; objective comes from another row above | Human-policy distribution defines resistance, not learner answer | Ordinary consequence window | Keep as opponent variation only |

Three separations are load-bearing:

1. **Nomination ≠ admission.** A detector, grade, Maia divergence or explorer count may say “look
   here”; another source must make the exercise true.
2. **Decision retry ≠ recovery drill.** The former starts before the move and asks for a different
   choice. The latter starts after it and asks the learner to survive the consequences. Both are
   useful; confusing them created [[D3100]].
3. **Ungraded ≠ useless.** A source-bound scenario can ask the learner to play several branches,
   compare human resistance and inspect grounded structural facts without claiming one hidden move
   is the answer.

## 4. Minimum source-bound exercise image

An implementation must be able to reconstruct these meanings without prose, an LLM, or mutable
Review state. `[M]`

| Field / relation | Why it is required |
|---|---|
| immutable exercise id + contract version | A future classifier/engine change must not rewrite what an earlier due item meant. |
| source run/game digest, branch and observed edge | Provenance back to the learner's actual game; not merely a matching FEN. |
| decision node, evidence node and consequence boundary | Separates retry-before-move, fact-after-move and when the exercise has shown enough. |
| canonical start position + learner side | Reconstructs the board and whose decision is being rehearsed. |
| return kind and phase | Routes presentation/deck grouping; neither grades the move. |
| objective predicate + objective authority | States exactly what success means and who/what licensed it. |
| accepted-alternative authority | Prevents a single PV from becoming the answer when several moves satisfy the goal. |
| opponent policy + version + constraint | Lets “fun/human” resistance operate only where it cannot invalidate the exercise's proof. |
| stop predicate / max horizon | Prevents an automatic card becoming an unbounded game or ending before the consequence. |
| admitted evidence digests and degradation state | A due item cannot outlive the evidence version that made it eligible without saying so. |
| source/deck dedupe keys | Keeps repeated games from flooding the queue while retaining recurrence counts. |

This need not become a second drill runtime. The derived object should compile into the same run
start, objective, opponent, checkpoint, evidence and branch semantics used by authored packs. It
must remain a distinct provenance class: machine-derived exercise, authored pack and free position
play are not interchangeable sources of chess judgement.

## 5. Dedupe and bounded queues

Noctie supplies the failure case: generated cards without a visible bound overwhelmed learners, and
duplicates remain a roadmap item. `[V]` Tabiya therefore needs two different identities. `[M]`

### Source identity

`(source game digest, branch, decision edge, return kind, contract version)` prevents the same Review
event being inserted twice. Re-running analysis with identical evidence is idempotent. A changed
engine/model/collector version produces a new candidate assessment, not a silent mutation.

### Exercise identity

`(canonical decision position, learner side, objective digest, accepted-set authority digest,
opponent constraint, stop digest)` identifies the thing to practise. Same-FEN cards with different
objectives must remain different. Transpositions with the same exercise meaning may merge while
retaining every source occurrence as provenance and a recurrence count.

### Admission budget

Automatic intake must have a hard, visible budget at **game**, **deck** and **daily queue** levels.
The exact numbers remain a UX/owner decision; this research does not manufacture them. The contract
must define deterministic overflow behavior—rank below the cut, defer, or require selection—and may
not silently accumulate an infinite “unsolved” backlog. Manual pinning may preserve an otherwise
deferred candidate, but it does not relax eligibility.

The queue should explain why an item returned: source game, exact observed move/fact, return family,
and schedule event. “AI chose this for you” is not provenance.

## 6. LLM boundary

No scraper or LLM belongs in the eligibility decision. A separate research/indexing pipeline may
collect licensed theory and bind it to versioned opening/principle records; once validated, those
records can be evidence authorities. That is the same separation the owner asked for in the earlier
Skipper discussion: acquisition/indexing is offline infrastructure, not a live hint oracle. `[M]`

An LLM may render an already-admitted exercise at a selected hint distance:

- opaque nudge: name the goal family without a move;
- structural/theory clue: render only admitted facts or cited theory;
- concrete hint: reveal admitted squares/pieces/pattern;
- solution: reveal an accepted move or bounded line only after the workflow permits it.

It may not choose the card, invent its goal, infer intent, select the only acceptable move, extend
the stop horizon, or turn a low-level detector into strategic advice. Deterministic templates remain
the fallback and the validation authority.

## 7. Research exit and roadmap consequences

The exploration gate is open for a bounded **mistake-derived exercise contract** only if it carries
all of these obligations into drafting: `[M]`

1. one derived-exercise image with exact source, decision, evidence and stop identities;
2. separate tactical, opening, tablebase, authored-structural and ungraded-scenario admission arms;
3. no generic `StoryMoment → exercise` conversion;
4. explicit plural accepted alternatives and able-to-abstain fixtures;
5. one runtime/compiler shared with packs, but separate provenance;
6. source and semantic dedupe plus recurrence aggregation;
7. hard intake/queue bounds with an owner-rulable preset rather than advanced settings;
8. repair [[D3100]] before any surface calls a door “retry”; and
9. schedule semantics that retain the immutable exercise contract rather than only a root FEN.

### Still requires owner/design ruling

- Default automatic intake: recommended **on after Review, bounded, with a one-screen confirmation**;
  exact per-game/deck/day counts are not established here.
- Whether ungraded scenarios enter the same visible deck or a separate “Explore again” lane.
- Whether a source occurrence already represented by an official authored pack routes to that pack
  by default or keeps the source-specific derived exercise.

### Does not block research or foundation work

- Collector breadth remains foundational: richer tactical/structural transition facts improve
  nomination and rendering, but do not relax the admission boundary.
- Human-policy bot work composes through the opponent contract; it cannot stand in for the objective
  or accepted move set.
- A separate theory acquisition/indexing system can proceed if its output is licensed, versioned and
  validated before becoming an evidence source.

## 8. Negative fixtures the future contract must start with

1. An eval drop with no forced line or authored objective produces a Review note and **zero graded
   exercises**.
2. A fork detector firing where two different moves win admits both when both satisfy the declared
   outcome; a PV-first implementation fails.
3. A structural change with no authored/cited objective produces an ungraded scenario, not
   “execute the minority attack.”
4. A common human move that loses engine evaluation may be described as common and still receives no
   correctness verdict from frequency.
5. A tablebase position outside the exact scope or without a 50-move-aware result abstains.
6. Two games reaching the same position and exact objective create one exercise with two source
   occurrences, not two queue items.
7. Same position, different objective creates two exercises; FEN-only dedupe fails.
8. Re-analysis under changed producer version cannot mutate a due item in place.
9. A decision retry starts at the parent of the observed move; a recovery exercise starts after it.
10. Queue overflow remains visible and bounded; it never grows an undisclosed unsolved pile.

## Sources

- R65 — current Noctie product workflow and roadmap.
- R66 — Lichess Learn From Your Mistakes and open puzzle-generation mechanics.
- `docs/game-import-and-story.md`; `docs/return-and-progression.md`.
- `packages/runtime/src/story.ts`; `packages/schema/src/drill-pack/types.ts`.
- `apps/server/src/service.ts`; `apps/server/src/storage.ts`.
