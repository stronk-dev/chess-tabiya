# Chess Phase Drill Lab — Master Brief

**Research cut-off:** 2026-08-08  
**Supersedes:** the personal-coach-oriented v1 brief

---

<!-- SOURCE: 00_CORRECTED_VERDICT.md -->

# Corrected executive verdict

## Decision

### Build the phase-drill prototype

The corrected concept is sufficiently distinct and useful to justify a serious self-hosted prototype.

Do **not** frame it as an AI coach. Do **not** make personal game analysis mandatory. Do **not** begin by ingesting billions of games. Do **not** let an LLM manufacture strategic lessons from raw engine output.

Build a fast rehearsal engine around curated or reviewed drill packs:

```text
OPENING
recall the theory
explain or choose the underlying idea
continue beyond book into the characteristic structure

MIDDLEGAME
commit to a plan
play 8–20 plies
rewind to a critical checkpoint
play an alternative branch
compare tempo, initiative, structure and outcome

ENDGAME
win / hold / save / resist
repeat against different practical defenses
preserve W/D/L rather than reproduce one machine line
```

## Scorecard

| Dimension | Score | Direct assessment |
|---|---:|---|
| Board, rules, PGN/FEN and branch runtime | 9/10 | Ordinary engineering |
| Stockfish integration | 9/10 | Mature UCI interface and cheap local inference |
| Maia-3 integration | 8/10 | UCI, Elo conditioning, sampling and MultiPV already exist |
| One-server feasibility | 9/10 | Comfortable for a single user or small alpha |
| Opening-to-middlegame drill feasibility | 8/10 | Technically easy; content authoring is the real cost |
| Long middlegame replay and branching | 9/10 | State model is straightforward; UX quality matters |
| Practical endgame outcome drilling | 9/10 | Syzygy plus Stockfish/Maia is a strong stack |
| Automatic strategic feedback | 4/10 | Unsafe to treat as solved |
| Curated strategic feedback | 8/10 | Strong if pack authors define concepts and checkpoints |
| Opponent coherence over 10–20 plies | 6/10 | Maia predicts plausible moves; coherent plans need policy support |
| Value over free/open tools | 8/10 | Existing free tools are fragmented by phase |
| Value over a best-of-breed paid stack | 6/10 | Workflow depth can win; breadth and authored content will initially lose |
| Worth building for personal/self-hosted use | 9/10 | Clear yes |
| Ready-made SaaS business case | 5/10 | Separate question; not proven by the technical thesis |

## What already exists

The individual pieces are not novel:

- opening line repetition;
- play from a FEN;
- human-like bots;
- engine evaluation;
- endgame tablebases;
- custom-position challenges;
- variation trees;
- personal game import.

The whitespace is the **integrated rehearsal protocol**:

> train the opening until it becomes a position → play the position far enough for the plan to matter → fork and replay the critical segment → finish or jump into the resulting outcome problem.

ChessDojo already teaches a manual version of this logic: choose an opening position around moves 5–15, play until the position no longer resembles the opening, analyze afterward, and repeat fixed middlegame positions from both sides. Chess Endgame Training already demonstrates that full outcome play with draw goals and branch continuation is useful. The proposed software product industrializes and connects those workflows.

## The sharpest product promise

> **Do not just learn the move. Rehearse the game it creates.**

Alternative, more literal wording:

> **Drill openings, middlegames and endgames by playing the consequences, then rewind and try again.**

## Target player

The strongest initial fit is not a complete beginner. It is the player who:

- knows basic tactics and opening principles;
- has enough theory to reach recognizable structures;
- loses games through move order, timing, pawn-break choice, exchanges, and conversion rather than only hanging pieces;
- understands an explanation when shown but lacks enough repeated execution;
- roughly occupies the serious club/intermediate-to-expert range.

A practical initial rating envelope is approximately **1400–2200 online rapid**, with content difficulty rather than account rating ultimately controlling the experience. Stronger players can still use curated packs; weaker players need more guided content and shorter branches.

## The hard truth

The engines are the easy part. A credible product requires a **content system**.

Stockfish can tell you that one move is better. Maia can tell you what a human is likely to play. A database can tell you what happened historically. None of those sources, alone, can reliably teach:

- why this Sicilian move order loses a tempo;
- why opening the center now favors one side's development;
- why a slow improving move misses the only timing window;
- which exchange transforms the position into a favorable endgame;
- what plan should be repeated in a family of related positions.

For v0, those claims should come from reviewed drill packs, with engines used to validate and animate them.

## Final answer

This is **not** “don't bother, you are reinventing.”

It is:

> **Build it, but build the drill runtime and content format first. The product dies if it becomes a Stockfish review screen with a rewind button.**

---

<!-- SOURCE: CHANGE_FROM_V1.md -->

# What changed from the first brief

## The first brief's central mistake

It recast the project as:

> mine a player's games → detect recurring weaknesses → generate personal position episodes → measure transfer back into future games.

That is a legitimate adjacent product, but it is not the idea under evaluation. It caused three downstream errors:

1. It treated personal-history analysis as the product's identity rather than an optional recommender.
2. It compared primarily against personalized SaaS coaches instead of against drills, sparring workflows, opening trainers, position players, and endgame conversion tools.
3. It treated paid SaaS occupancy as a stronger kill signal than it should be for a self-hosted tool.

## Correct product definition

The product is a **phase drill laboratory** for serious improvers:

- Opening theory is drilled as moves, ideas, structures, move-order sensitivity, and the kinds of middlegames it creates.
- Middlegames are rehearsed as multi-move plans where a merely decent move can lose a tempo, change the order of pawn breaks, or let an attack arrive one or two moves earlier.
- Endgames are drilled to an outcome: win, hold, save, or maximize resistance.
- Critical positions are rewindable. Alternative attempts remain as branches instead of being destroyed by a takeback.
- A player can redo a complete middlegame segment, not only retry a single move.
- A branch may naturally become a conversion drill or a save-the-game drill.
- Personal game history may later select which packs to prioritize, but the content and interaction work without it.

## Correct competitive interpretation

Paid SaaS products still matter as implementation and UX benchmarks. They do **not** invalidate the value of a fast, local, owned tool. For a public commercial product they remain substitutes; for the immediate build decision they are not a blocker.

The relevant comparison is therefore:

> Can one free/self-hosted workflow already provide conceptual opening rehearsal, multi-move middlegame branching, and practical endgame outcomes with good UX?

The answer from the reviewed landscape is **no**. The pieces exist separately.

## Correct risk statement

The risk is not mainly “competitors already analyze games.” The risk is:

> Stockfish + Maia + a database may still produce shallow training unless drill content, checkpoints, opponent policies, and branch comparison are explicitly designed around chess concepts.

That is the central research problem in this package.

---

<!-- SOURCE: 01_PRODUCT_DEFINITION.md -->

# Product definition

## Category

**Chess phase rehearsal system**

The product is closer to a flight simulator or music practice loop than to an analysis dashboard. It exists to create repeated, controlled execution of chess decisions.

## Jobs to be done

### Opening

> I know some moves, but I want to understand the position I am choosing, recognize common deviations, and execute the first strategic plan after theory ends.

### Middlegame

> I want to play a plan far enough to see what it causes, return to the decision point, try a different plan, and understand the practical difference between “fine” and “timely.”

### Endgame

> I want enough repetitions that winning, holding, saving and resisting become procedures rather than trivia I once read.

### Connected session

> I want to see how an opening choice tends to create a certain middlegame and which endings or conversion problems naturally follow.

## What the product is not

- Not primarily a post-game analyzer.
- Not a feed of automatically generated puzzles.
- Not a chat-first AI coach.
- Not an opening repertoire database with a nicer skin.
- Not an engine sandbox where the user must invent the curriculum.
- Not a claim that every position has one correct move.
- Not a generic bot ladder.
- Not a replacement for annotated games, books, coaches or human sparring.

## Primary product objects

### Drill pack

A reviewed collection of positions, objectives, concepts, opponent policies, checkpoints, allowed transitions and feedback rules.

### Drill run

One user's execution of a pack from a chosen starting node.

### Branch graph

The immutable tree of moves created by the run. Rewinding creates a new branch; it does not erase the old line.

### Checkpoint

A semantically meaningful point at which the system may ask for a plan, stop a segment, compare branches, alter the opponent, or change the objective.

### Outcome contract

The criterion for success:

- preserve theory and reach an acceptable structure;
- execute a plan before the timing window closes;
- maintain a winning or drawing state;
- generate enough counterplay to save a practical position;
- reach a target class of endgame;
- avoid a known strategic concession.

## Product modes

### 1. Line Drill

Opening recall plus idea checkpoints, realistic deviations, and continuation beyond the memorized line.

### 2. Plan Drill

A middlegame segment of roughly 8–20 plies, followed by rewind, alternative play and branch comparison.

### 3. Outcome Drill

A complete endgame or late-middlegame conversion/defence task, graded on result preservation rather than exact move matching.

### 4. Trajectory Drill

A causal sequence connecting opening, characteristic middlegame and realistic endgame.

### 5. Position Arena — later

Two humans play a curated position, swap colors, then compare decisions and branches.

## Why branching is not merely an analysis feature

Traditional analysis branches are passive: click through engine lines.

Here, a branch records an **attempt**. It contains:

- what the player chose without knowing the answer;
- how the opponent responded;
- how far the plan was allowed to develop;
- which checkpoints were reached;
- whether the position changed category;
- whether the objective survived;
- what the player did differently on retry.

The product's training value comes from comparing executed attempts, not from drawing a prettier variation tree.

## Why personal history is optional

Personal history can improve selection:

- prioritize openings the player uses;
- surface endgame families they frequently reach;
- recommend packs after repeated mistakes;
- build “replay this structure” queues.

But every core mode must work from curated packs without importing a single game. Otherwise the product drifts back into personalized analysis and neglects the deliberate curriculum.

---

<!-- SOURCE: 02_MARKET_AND_EXISTING_SOLUTIONS.md -->

# Market and existing solutions — corrected comparison

## How to interpret competition

The earlier analysis treated paid SaaS occupancy as if it largely settled the build decision. That was wrong for the immediate goal.

There are two separate questions:

1. **Is a self-hosted tool worth building?** Paid SaaS is not a blocker. Ownership, latency, unrestricted usage, modifiability and good local UX are legitimate value.
2. **Would a public commercial product have substitutes?** Yes. Paid products matter as benchmarks and affect willingness to pay, even when none covers the complete workflow.

The correct comparison axis is not “personalization.” It is:

> Does the product support active, repeatable rehearsal of a whole phase or transition, with preserved alternatives and outcome-aware feedback?

## Closest existing ideas

### Chess Endgame Training

This is the closest proof that the endgame concept is right.

Its public feature set includes:

- organized endgame categories;
- play against Syzygy or Stockfish;
- checkmate and draw targets for both colors;
- personal records;
- automatic completion of trivial positions;
- a move list from which another line can be continued;
- a manual “what if?” mode;
- arbitrary FEN entry with a target.

That is substantially closer to the desired endgame loop than ordinary puzzles. The user's hands-on assessment — slow response and poor UX — is important field evidence. The gap is therefore not “invent endgame drilling.” It is:

> make it immediate, pleasant, practical, varied, and connected to earlier phases.

### ChessDojo position sparring

ChessDojo's manual training method is the closest match to the pedagogical thesis.

Its opening sparring guidance recommends selecting positions around moves 5–15, playing until the opening character is gone around moves 25–30, analyzing with the opponent, and checking conclusions only afterward. Its published middlegame positions prescribe repeated games from both colors. This validates the idea that phase training should be **played through**, not reduced to one move.

What is missing is software support for:

- immediate repeatability without finding a partner;
- persistent branch comparison;
- controlled variation of defenses;
- automatic objective tracking;
- fast movement between opening, middlegame and endgame segments.

### Noctie

Noctie is the closest paid general sparring product. It lets the player choose openings, import repertoires, continue into realistic full games, and play arbitrary positions/endgames against a human-oriented opponent.

Its overlap is real. The remaining gap is not “play an opening against a bot.” It is:

- no first-class multi-board branch graph;
- no designed checkpoint/replay protocol;
- no explicit comparison of two played middlegame plans;
- no authored causal trajectory from opening choice to position type to outcome drill;
- feedback is still largely move-level.

### Chess From Position

This free site generates positions from real Lichess games, filters by opening/move/evaluation, lets the user explore them, and can launch Lichess AI or human challenges from the position.

It validates demand for starting outside move one and is useful infrastructure. It does not provide a curriculum, checkpoint model, preserved attempts, or concept-aware branch comparison.

### Opening trainers: Listudy, Chessdriller, DrillChess, Chessstack, ChessTempo, Chessable

These products vary greatly in polish and scope, but their common unit is a line or card.

Listudy explicitly states that it helps memorize openings and cannot teach the theory. Chessdriller and Chessstack implement spaced repetition over repertoire lines. DrillChess randomizes Lichess-study chapter and move order. ChessTempo and Chessable offer richer authored content and analysis, and Chessable now allows a course position to be played against a bot.

The remaining gap is the bridge from:

```text
I recalled the move
```

to:

```text
I understand which structure I chose, which plan follows, what the opponent races toward, and how one slow move changes the middlegame.
```

### General workstations: Chess.com Practice, Lichess, Fritz/ChessBase, Lucas Chess

These can all be configured to play from positions, analyze variations, use engines, and train pieces of the workflow. Power users can manually assemble much of the proposed method.

The weakness is orchestration:

- the user must know which position to choose;
- branches are analysis artifacts rather than tracked attempts;
- no consistent drill-pack contract connects goals, opponent behavior, checkpoints and grading;
- phase transitions are not the primary UX;
- repeated practical outcomes require manual setup.

### Open-source AI platforms: WhyThisMove and Maia Chess

WhyThisMove is important prior art. It already combines Stockfish, Maia, Lichess data and LLM explanations in an open-source stack. Maia Chess itself is open source and provides human-move prediction and training/analysis interfaces.

This demonstrates that the engine/data plumbing is not a moat. It also reinforces the central point: the opportunity is the **rehearsal runtime and curriculum**, not simply wiring the same components together.

## Forum signals

The recurring complaints are unusually consistent:

- players know opening lines but not the resulting middlegame plans;
- resources say “learn the ideas” without offering a way to rehearse those ideas;
- players find quiet middlegames much harder to train than tactics;
- engine review can show a 0.7 drop without making the plan understandable;
- endgame puzzles often stop at the key move rather than forcing the conversion;
- users manually set positions and play both sides because no integrated tool exists;
- a recent builder processed hundreds of millions of Lichess games and used Maia plus Stockfish to generate balanced middlegames because they could not find the mode elsewhere.

These posts are anecdotes, not market-size evidence. They are nevertheless strong problem-shape evidence.

## Competitive conclusion

### Reinvention

The project reinvents infrastructure and individual features.

### Differentiation

It does not appear to reinvent a polished, free/self-hosted **phase rehearsal loop** that combines:

1. concept-bearing opening practice;
2. whole middlegame segment replay;
3. persistent alternatives;
4. practical endgame outcomes;
5. causal transitions between phases;
6. fast local interaction.

That is enough whitespace for a prototype.

---

<!-- SOURCE: 03_TRAINING_MODEL.md -->

# Training model

## The learning unit is an episode, not a move

A normal puzzle asks:

> What is the best move now?

A phase drill asks:

> Which plan will you choose, can you execute it for several moves, and what position does it create?

The minimum useful episode is therefore:

```text
orientation
→ commitment
→ uninterrupted play
→ consequence checkpoint
→ rewind
→ alternative attempt
→ comparison
→ varied retry
```

## Four stages of an episode

### 1. Orient

The player is shown only what is necessary:

- side to move;
- objective;
- relevant clock or move budget;
- possibly a short concept prompt;
- no live engine bar by default.

Examples:

- “Reach a playable Scheveningen structure without conceding the thematic break.”
- “Choose whether to keep or release the central tension.”
- “White's attack is already moving. Create counterplay before it arrives.”
- “Hold the draw.”

### 2. Commit

The player makes a real move. Optional advanced prompts can capture intent before the move:

- keep/open/close the center;
- improve a piece;
- prepare a pawn break;
- trade into an endgame;
- attack on a flank;
- neutralize the opponent's plan.

This is not required on every turn. It is useful at curated decision points.

### 3. Play the consequence

The system withholds most feedback for a fixed horizon or until a checkpoint. This prevents the user from playing the colored label instead of the position.

A middlegame branch should commonly run 8–20 plies. It can stop earlier when:

- a tactical resolution occurs;
- the structure irreversibly changes;
- one side completes a thematic break;
- a queen trade creates the target endgame;
- the objective becomes clearly won/lost/drawn;
- the pack-defined lesson is visible.

### 4. Compare and replay

The first attempt is not erased.

The system returns to the checkpoint and asks for:

- a different move;
- a different plan class;
- the same plan against another defense;
- the same concept in a related position;
- the opposite side of the position.

## Blocked and varied repetition

Both are needed.

### Blocked repetition

Repeat the same root several times until the procedure stabilizes. Useful for:

- theoretical endgames;
- exact opening move orders;
- learning a thematic attacking race;
- defending one critical setup.

### Varied repetition

Change one or more of:

- opponent response;
- piece placement;
- move order;
- side to move;
- clock;
- material balance;
- objective.

Useful for transfer and preventing memorization of coordinates.

The scheduling model should explicitly distinguish:

```text
same position, new defense
related position, same idea
same structure, opposite side
same outcome, different material details
```

## Feedback timing

### During opening recall

Immediate correction is acceptable for forced or repertoire-defined moves, but explanations should focus on intent and transpositions rather than move color.

### During middlegame play

Delay feedback until a checkpoint unless the move immediately destroys the exercise. The user must be allowed to experience the consequence.

### During endgame play

Do not reject every suboptimal move. Continue while the required outcome is preserved. Warn or terminate when the theoretical/practical state changes according to the selected mode.

## Outcome definitions

### Win

Keep the position winning and finish the conversion or reach a pack-defined trivial state.

### Hold

Preserve a draw against strong or perfect resistance.

### Save

Begin objectively worse and exploit realistic inaccuracies to reach a draw or meaningful counterplay.

### Resist

The position may remain lost, but the task is to maximize practical difficulty, avoid immediate collapse, and reach defined resistance checkpoints.

The distinction between hold and save matters:

- **hold** tests correct defence from a drawable position;
- **save** tests practical resourcefulness from a worse or losing one.

## Target mistake classes

The product should deliberately address the mistakes that sit between tactics and perfect play.

### Opening-to-middlegame

- knows the line but not the strategic purpose;
- wrong move order despite individually sensible moves;
- fails to recognize a transposition;
- chooses a setup incompatible with the pawn structure;
- misses the thematic break;
- exits theory without a plan;
- spends a tempo on a luxury move during a race.

### Middlegame

- releases tension too early;
- keeps tension after the timing window has passed;
- chooses the right plan one move too slowly;
- improves the wrong piece;
- attacks on the wrong flank;
- trades the piece needed for the plan;
- opens the center while behind in development;
- closes it while needing tactical activity;
- underestimates the opponent's forcing sequence;
- accepts a favorable engine evaluation but an impractical structure;
- allows the opponent's attack or pawn break to arrive one or two moves earlier.

### Endgame

- activates the king too late;
- exchanges the wrong pawns;
- places the rook passively;
- fails to create or stop a passed pawn;
- loses the drawing zone;
- converts material but not activity;
- misses stalemate, fortress or perpetual resources;
- plays the first correct move but cannot finish.

## Why this can outperform random puzzles

Random puzzles are excellent for tactical pattern recognition. Strictly speaking, Lichess puzzles are generated from positions in actual games, so the weakness is not that the position literally never occurred. The weakness is distribution and context: the exact position is unlikely to recur for the learner, it is selected as a tactical candidate, the learner is told implicitly that a forcing solution exists, and the exercise normally starts after the strategic decisions that created it.

They are poor substitutes for this job because:

- the user knows a tactic exists;
- the position is often disconnected from a recurring strategic context;
- the exercise usually ends after a short forcing line;
- there is rarely a second plausible plan to compare;
- conversion and resistance are often omitted;
- success is exact-move oriented.

The proposed tool does not replace tactics. It trains the execution gap around them.

---

<!-- SOURCE: 04_OPENING_DRILLS.md -->

# Opening drills: theory that continues into chess

## Problem

Opening trainers generally optimize recall. Serious players need three additional capabilities:

1. understand what the move is trying to achieve;
2. recognize how move order changes the available plans;
3. continue until the characteristic middlegame becomes operational.

## Line Drill protocol

### Stage A — recognize the family

Show the position without the opening name when appropriate. Ask the player to identify:

- structure or variation;
- typical pawn breaks;
- normal side of play;
- dangerous opponent idea;
- whether the center is likely to remain open, closed or fluid.

This can be multiple choice for lower friction or free text for advanced packs.

### Stage B — execute the move order

The opponent move source is layered:

1. exact pack/repertoire moves where theory is the lesson;
2. empirical corpus frequencies at the target rating;
3. Maia for sparse or novel positions;
4. pack-authored deviations designed to test understanding.

The player is not failed merely for leaving the author's preferred line if the move is playable. The UI distinguishes:

- **required theory** — the pack is explicitly testing this move order;
- **accepted alternative** — playable and conceptually sound;
- **interesting deviation** — continue and compare later;
- **concept violation** — the move undermines the training objective;
- **tactical error** — objective failure.

### Stage C — cross the book boundary

The drill does not end after the last repertoire move. It continues until one of these is true:

- the characteristic pawn structure is established;
- the first thematic break is executed or prevented;
- the primary piece-placement problem is resolved;
- the position leaves the opening's strategic identity;
- a pack-defined middlegame checkpoint is reached.

### Stage D — branch the first plan

At the first meaningful middlegame decision, the player completes a short branch. Then the system can rewind to compare:

- immediate pawn break versus preparation;
- center action versus flank action;
- exchange versus tension;
- active piece placement versus prophylaxis.

## What should be authored in an opening pack

- root move sequence and transpositions;
- mandatory theory nodes;
- common human deviations by rating band;
- strategic purpose of each critical move;
- characteristic pawn structures;
- typical good and bad piece placements;
- thematic pawn breaks and their timing conditions;
- usual attack/counterplay race;
- favorable and unfavorable exchanges;
- representative model-game spines;
- transition checkpoints into middlegame packs;
- plausible endgame classes.

## Move-order sensitivity

This is where the product can serve advanced club players better than ordinary recall.

A pack can encode a **tempo contract**:

```text
critical plan: prepare break X before opponent completes Y
window opens: after node A
window closes: if opponent reaches node B
luxury move budget: 0 or 1
```

The branch comparator can then report:

- both moves were objectively playable;
- branch A completed development before the opponent's break;
- branch B inserted a useful-looking move but let the opponent's attack arrive one ply earlier;
- the evaluation difference was small at the first move but widened after the race resolved.

This is the level at which opening theory actually matters for intermediate-to-expert players.

## Opening drill success criteria

Do not grade only exact recall.

Possible criteria:

- reached an accepted structure;
- preserved the intended pawn break;
- avoided a known move-order concession;
- developed the correct pieces for the chosen plan;
- responded to a common deviation without leaving the strategic objective;
- reached the transition checkpoint within the tempo budget;
- could explain the first middlegame plan after the run.

## Opening recommendation is optional

A future history module may say:

- this opening family appears in your games;
- you repeatedly reach this structure;
- this pack is relevant.

The base system does not need to recommend a repertoire or psychoanalyze play style.

---

<!-- SOURCE: 05_MIDDLEGAME_DRILLS.md -->

# Middlegame drills: the core differentiator

## Why this phase is underserved

Openings have trees. Endgames have tablebases and named procedures. Middlegames contain multiple playable moves, plans with delayed effects, and context-dependent timing.

That makes them difficult to package as conventional puzzles and exactly why the branch/replay model matters.

## Plan Drill protocol

### 1. Start from a representative position

Sources, in descending pedagogical priority:

1. coach-authored or coach-reviewed position;
2. critical position from an annotated model game;
3. real corpus position selected for a known structure;
4. generated position only after validation.

A position should not be selected merely because Stockfish shows a large move delta. It needs a teachable decision.

### 2. State a narrow objective

Good objectives:

- decide whether to release central tension;
- prepare the minority attack without allowing central counterplay;
- choose the correct pawn break in an IQP structure;
- complete queenside counterplay before a kingside attack lands;
- trade into the favorable minor-piece ending;
- neutralize the opponent's only active plan;
- improve the worst piece without losing the timing window.

Bad objective:

> Play good chess.

### 3. Play a segment

The opponent responds through a pack-aware policy. The segment continues for 8–20 plies or to a semantic stop condition.

No engine bar by default. No move-by-move confetti.

### 4. Rewind to the critical node

The first line remains visible as Branch A. The player chooses Branch B.

The system can require a different **plan class**, not merely a different move. For example:

- Branch A: keep tension;
- Branch B: exchange;
- Branch C: close center;
- Branch D: immediate forcing action.

### 5. Compare the played consequences

The comparison should show a compact causal summary:

| Signal | Branch A | Branch B |
|---|---|---|
| Objective state | preserved | missed |
| Stockfish WDL/eval | stable | worsened after 5 plies |
| Human plausibility | common | also common |
| Development completion | move 14 | move 16 |
| Thematic break | available | prevented |
| Opponent attack arrival | ply 9 | ply 7 |
| Center | fluid | closed |
| Key piece | active | restricted |
| Endgame transition | favorable rook ending | passive minor-piece ending |

The system must be willing to say both branches are playable while still explaining why one better serves the objective.

## Branch semantics

A branch should carry more than moves:

```text
intent
objective
opponent policy seed
critical events
structure snapshots
feature changes
engine checkpoints
outcome state
```

This permits meaningful comparison and later replay.

## Parallel-board UX

The strongest presentation may be two synchronized boards:

- Branch A on the left;
- Branch B on the right;
- scrub both to the same relative ply;
- highlight changed squares, piece routes and pawn structure;
- optionally show a ghost overlay of the alternate piece placement;
- switch active board with one key;
- replay either branch against another defense.

This is more useful than a conventional tree when the purpose is understanding consequences rather than navigating analysis.

## Full-segment redo

A critical requirement is the ability to redo the **entire middlegame**, not only the first decision.

Modes:

### Exact root, varied defense

Same position and plan, new opponent sampling seed.

### Exact root, alternate plan

Same position, user must choose another strategic idea.

### Earlier rewind

Return several moves before the visible mistake and rebuild the position.

### Related root

A different game or move order with the same structure and concept.

### Opposite side

Play the defender or attacker to understand both plans.

## Late-middlegame transformation

A Plan Drill may become an Outcome Drill automatically when:

- queens are exchanged;
- material simplifies to a known ending class;
- one side obtains a stable winning/drawing objective;
- the pack defines a transition.

The UI can ask:

> Continue this branch as a conversion drill?

or:

> You missed the timing window and are now worse. Switch objective: save the game.

That is not punishment. It is a coherent continuation of the decision.

## Middlegame content taxonomy

Initial packs should cover structure and timing, not every abstract strategic label.

Recommended v1 taxonomy:

- open center / closed center / fluid tension;
- IQP;
- hanging pawns;
- Carlsbad/minority attack;
- Maroczy Bind;
- opposite-side castling race;
- same-side kingside attack;
- central break versus flank attack;
- good bishop/bad bishop transformation;
- knight outpost versus pawn break;
- favorable exchange and transition;
- prophylaxis versus active play;
- initiative and move-order race;
- conversion of space advantage;
- defence by counterplay.

Each pack should be narrow enough that success can be defined.

---

<!-- SOURCE: 06_ENDGAME_DRILLS.md -->

# Endgame drills: outcomes, not answer keys

## Product principle

The endgame module should take the central idea of Chess Endgame Training seriously:

> set up a meaningful ending and make the player finish or save it.

The product advantage should come from speed, UX, practical opponent selection, branch persistence, varied repetition and integration with earlier phases.

## Outcome Drill types

### Convert

Start winning. Finish the game or reach a certified trivial win.

### Hold

Start drawn. Preserve the draw against strong or perfect resistance.

### Save

Start worse or losing against a realistic opponent. Create practical chances and exploit mistakes.

### Resist

The position may remain objectively lost. Maximize difficulty, reach counterplay checkpoints, and avoid immediate collapse.

### Technique sprint

Repeat a theoretical procedure several times with mirrored boards, changed pawn files, side-to-move changes or different defensive choices.

## Grading hierarchy

### Tablebase positions

For supported piece counts, use Syzygy WDL/DTZ as exact truth.

Do not require shortest mate unless the pack explicitly teaches speed. Grade primarily:

- did win remain win;
- did draw remain draw;
- did the player reach the intended technique;
- did the 50-move-rule state matter;
- how many opportunities were given back.

### Larger endgames

Use Stockfish WDL/evaluation plus pack-defined thresholds and structural checkpoints.

A winning player may use a slower plan without being failed. A defender may be rewarded for creating practical problems even if perfect play still loses.

## Opponent choices

### Perfect defender

Use tablebase or strong Stockfish. Best for theoretical certainty.

### Human-level defender

Use Maia/corpus-guided candidates with an objective-preservation guard. Best for practical conversion.

### Annoying defender

Among moves that preserve the theoretical state, prefer moves that maximize choice complexity, checks, counterplay or common human difficulty.

### Fallible attacker

For save-the-game training, the opponent should be strong enough to press but human enough to release the advantage.

## Repetition design

The endgame module should offer four distinct replay buttons:

- **same position, new defense**;
- **mirror and replay**;
- **same technique, new position**;
- **play the other side**.

That is more educational than a generic “try again.”

## Triviality and finish rules

Do not waste time forcing routine moves after the lesson is complete.

A pack may define triviality by:

- tablebase state and distance threshold;
- material and known mating procedure;
- forced promotion without counterplay;
- Stockfish WDL plus no meaningful defensive resources;
- author-defined target position.

The user can always choose “play to mate.”

## Endgames arising from branches

When a middlegame branch simplifies, the system should preserve provenance:

```text
this ending arose from Branch B
critical exchange: move 24
starting evaluation: +1.2
objective now: convert
```

After the run, the user can jump back to the exchange decision and try to avoid or seek the ending.

This closes the loop between strategic choice and technique.

## Practical metrics

- conversion rate;
- hold rate;
- save rate against target opponent level;
- number of W/D/L state changes;
- time or plies to reach triviality;
- king activation timing;
- rook activity checkpoints;
- passed-pawn creation and blockade;
- repeated failure concept;
- performance on a related position after a delay.

## UX bar

The user's complaint about the existing trainer matters. The new implementation should target:

- instant board initialization;
- opponent response perceived as immediate;
- one-click replay;
- no page reload between positions;
- keyboard-first branch/restart controls;
- cached tablebase queries;
- no blocking engine analysis in the main interaction loop;
- clear goal and clear outcome.

---

<!-- SOURCE: 07_CONNECTED_TRAJECTORIES.md -->

# Connected trajectories: opening → middlegame → endgame

## Why this is valuable

Chess material is normally organized by content type. Actual games are causal sequences.

A trajectory drill answers:

- what position does this opening choice tend to create;
- which plan must be executed next;
- which trades and pawn structures make a certain ending likely;
- whether the opening's promised advantage can actually be converted.

## Two trajectory modes

### Organic trajectory

Start from an opening and let the player's and opponent's choices determine the game.

The system marks critical nodes and offers rewind later. An endgame may or may not occur.

This is realistic but unreliable as a targeted lesson.

### Guided trajectory

Use a real game or reviewed line as a spine:

```text
opening root
→ characteristic structure
→ critical plan decision
→ simplification checkpoint
→ target endgame
```

The opponent policy nudges toward the spine while allowing legitimate deviations. The player can branch away. The historical line is a guide, not a script.

This is better for deliberate training.

## Causal integrity

Do not stitch a random endgame onto an opening because the session needs three sections.

A transition is valid only when one of these is true:

- the exact branch reaches the ending;
- a real corpus game from the same structure reaches a closely related ending;
- the pack author explicitly defines a pedagogical jump and explains the missing transition;
- the target ending is a common consequence of the structure and the pack includes evidence/provenance.

## Trajectory graph

A pack may contain several compatible transitions:

```text
Najdorf root
├── opposite-side castling attack
│   ├── queens stay on → attack/defence plan drill
│   └── queens exchanged → minor-piece ending
├── central break succeeds
│   └── open-file rook ending
└── break delayed
    └── save-the-game defensive task
```

The player need not traverse all of them in one session.

## Session composition

A 30-minute session could be:

- 6 minutes: opening recall and deviation;
- 14 minutes: two middlegame branches;
- 10 minutes: one resulting conversion/save task.

A focused session can be only one mode. The product must not force all three phases every time.

## Corpus role

The game corpus can estimate:

- how frequently a structure occurs;
- common next moves by rating and time control;
- likely transitions into material classes;
- real examples where the thematic plan succeeded or failed;
- which endgame types follow after common exchanges.

The corpus should not automatically declare the strategic lesson. It supplies evidence and candidate spines for review.

---

<!-- SOURCE: 08_ENGINE_CORPUS_AND_CONTENT.md -->

# Engines, corpus and content architecture

## Separation of responsibilities

| Component | Legitimate job | What it must not pretend to know |
|---|---|---|
| Stockfish | objective evaluation, MultiPV, tactical validation, WDL approximation | human naturalness or teaching intent |
| Maia-3 | likely human moves at specified Elo, candidate distribution, fallible opponent play | objective correctness or coherent long-term plan by itself |
| Human-game corpus | empirical frequency, transitions, outcomes and examples | normative best play or causality |
| Syzygy | exact W/D/L and DTZ for supported small endgames | practical difficulty or pedagogy |
| Deterministic feature extractor | measurable board changes | universal strategic meaning |
| Drill pack author | concept, objective, checkpoints, acceptable alternatives, narrative | engine-level tactical certainty without validation |
| LLM renderer | wording and summarization of validated evidence | source-of-truth chess analysis |

## Stockfish role

Stockfish should generally be the **judge**, not the actor.

Use it for:

- shallow interactive move checks;
- deeper asynchronous checkpoint analysis;
- MultiPV branch comparison;
- detecting tactical invalidity in authored packs;
- estimating when a position becomes clearly won/lost;
- validating generated corpus candidates;
- measuring when a tempo loss becomes consequential.

Do not drive a 1600-style opponent merely by lowering Stockfish's skill. Stockfish's weakened mode samples weaker moves from engine candidates; that is not the same as modelling human choice.

## Maia-3 role

Maia-3 is a practical first human model because the released UCI engine supports:

- 5M, 23M and 79M models;
- CPU use for the 5M model;
- separate side-to-move and opponent Elo;
- temperature and top-p sampling;
- MultiPV of likely human moves;
- optional reconstructed move history.

Its WDL values are human-game outcome predictions, not Stockfish evaluations. Preserve that distinction in every schema and UI.

## Long-horizon coherence problem

A move predictor can choose plausible moves one at a time while producing an incoherent 12-ply plan.

The opponent therefore needs a policy layer.

### Proposed policy mixer

For each legal move, combine:

```text
corpus likelihood
+ Maia likelihood
+ pack-defined plan compatibility
+ objective-preservation guard
+ diversity/replay penalty
```

Hard filters may reject:

- immediate tactical collapses outside the intended difficulty;
- moves that abandon the pack's defensive plan for no reason;
- repetitions already overused in the current drill;
- moves that violate a required transition.

This is a design proposal, not a claim that one formula solves human play.

## Corpus scale

Lichess currently publishes more than 8.0 billion standard rated games. July 2026 alone contains about 89.3 million games in a 29.1 GB compressed archive. That is more than enough.

Do not ingest everything for v0.

### Recommended corpus stages

#### Stage 0 — no bulk corpus

Use the Lichess opening explorer/API, curated PGNs, and pack-authored lines.

#### Stage 1 — one recent month

Stream one monthly archive, filter by:

- standard rated games;
- relevant rating bands;
- rapid/classical, optionally blitz later;
- no bots;
- minimum game length;
- sane termination/result metadata.

Emit only position and transition aggregates.

#### Stage 2 — targeted historical slices

Add years or rating/time-control partitions only when a query requires them.

### Storage layout

```text
raw .pgn.zst          retained or disposable
  ↓ stream parser
position transitions  partitioned Parquet
  ↓
DuckDB analytics
  ↓
materialized opening/structure indexes
```

The Lichess site explicitly documents streaming decompression with `zstdcat`, avoiding huge temporary files.

## Position key

Store:

- normalized board state;
- side to move;
- castling rights;
- en-passant state;
- halfmove/repetition context where relevant;
- full move history for branch provenance and Maia history mode.

Do not treat piece placement alone as complete chess state.

## Content is the main asset

### Curated-first pipeline

1. Author selects a concept and representative position.
2. Corpus supplies common continuations and real examples.
3. Stockfish checks tactical/objective claims.
4. Maia/corpus calibrate plausible defenses.
5. Feature extractor records measurable changes.
6. Human review approves the lesson and alternatives.
7. Pack is versioned and regression tested.

### Generated content later

Automatic mining can propose:

- candidate positions with multiple playable plans;
- positions where evaluation remains close but timing differs;
- transitions into target endgames;
- common human errors by rating;
- balanced practice positions.

Generated packs remain unpublished until review or until automated validation has earned trust on a constrained taxonomy.

## Licensing notes

- Stockfish is GPLv3.
- Maia-3 is AGPL-3.0.
- Lichess game dumps are CC0.
- Several convenient chess libraries and UIs use copyleft licenses.

For a private/self-hosted open-source build this is usually compatible with the project's direction. A proprietary hosted product needs explicit legal review and architectural decisions before launch. This package is not legal advice.

---

<!-- SOURCE: 09_FEEDBACK_AND_DEPTH.md -->

# Preventing shallow training

## The shallow failure mode

The easiest implementation is also the least valuable:

```text
Stockfish: +0.54
Maia: 31% of 1800s play Ne5
LLM: “Ne5 centralizes the knight and increases pressure.”
```

That is a dashboard, not a drill.

## What feedback must answer

After a branch, the user should understand:

1. Did the intended objective survive?
2. When did the branches materially diverge?
3. What changed in the position, not just in evaluation?
4. Which tempo or move-order event mattered?
5. Was the move objectively bad, practically awkward, or merely different?
6. What should be recognized in a related position?

## Evidence packet

Every feedback statement should be traceable to a structured packet.

### Objective evidence

- Stockfish evaluation and WDL at selected checkpoints;
- MultiPV alternatives;
- tactical flags;
- tablebase state where available.

### Human evidence

- Maia move probabilities by target Elo;
- empirical corpus frequencies;
- corpus outcomes with confidence/sample size;
- common continuation clusters.

### Structural evidence

- center state;
- pawn islands and passed/isolated/backward pawns;
- open and semi-open files;
- weak squares/outposts;
- king exposure;
- piece mobility/activity proxies;
- development completion;
- available pawn breaks;
- material and exchange state.

### Temporal evidence

- ply when a thematic break became available;
- ply when it was executed;
- opponent attack/counterplay arrival;
- number of preparatory/luxury moves;
- forcing-move sequence length;
- window open/close events authored in the pack.

### Pedagogical evidence

- pack objective;
- expected plan classes;
- author explanation;
- acceptable alternatives;
- known misconception;
- transfer cue.

## Tempo and initiative

“Lost a tempo” must not be a decorative phrase.

A pack should define observable events. Example, in abstract form:

```text
user objective: execute central break before opponent completes kingside battery
branch A: break ready at ply 5, played at ply 7
branch B: inserted rook move; break ready at ply 7, opponent battery completed at ply 6
```

Feedback can then say:

> The rook move was not a blunder. It consumed the only spare tempo. In Branch A your central break forced the opponent to respond; in Branch B the opponent completed the attack first.

That is much deeper than reporting a 0.4 evaluation difference.

## Feedback layers

### Layer 1 — outcome

- objective preserved/missed;
- win/draw/loss state;
- checkpoint reached.

### Layer 2 — causal comparison

Three to five differences between the played branches.

### Layer 3 — detailed evidence

Engine lines, feature changes, frequencies and source games.

### Layer 4 — exploration

Open the full board tree, run deeper analysis, or manually add a branch.

This keeps the main loop fast while preserving rigor.

## Language generation

Use templates first.

A safe template can map:

```text
objective_event + timing_delta + structural_delta + validated line
```

to a concise explanation.

An LLM may improve phrasing, but must receive the evidence packet and be prohibited from adding unsupported chess claims. Store the exact evidence and generated text for review.

## Handling several good moves

The system should distinguish:

- objectively best;
- within tolerance;
- aligned with the drill objective;
- common human choice;
- strategically different but playable;
- practically risky;
- tactically losing.

A move can be objectively fine but fail the current drill objective. State that plainly:

> This move is playable. It does not rehearse the plan this pack is testing, so the branch is saved as an off-objective alternative rather than marked wrong.

## Coach/content review loop

For the first packs, require review of:

- selected root;
- objective;
- accepted alternatives;
- checkpoint stop conditions;
- branch comparison claims;
- transfer positions;
- opponent behavior.

Measure reviewer agreement. If strong players routinely disagree with the lesson's classification, the content system is not ready.

---

<!-- SOURCE: 10_UX_BRANCHING_AND_REWIND.md -->

# UX: branching and rewind as the product

## Design principle

Rewind must feel instantaneous and intentional. It is not an “undo mistake” button. It creates another experiment.

## Main board layout

### Center

The active board, clock if used, objective and minimal status.

### Bottom timeline

Moves with semantic checkpoint markers:

- theory boundary;
- plan commitment;
- pawn-structure change;
- tactical resolution;
- endgame transition;
- outcome state change.

### Side branch rail

Compact cards for Branch A, B, C with:

- first divergent move;
- intent label;
- current objective state;
- final position thumbnail;
- result.

## Required actions

- `R`: rewind to last checkpoint;
- `Shift+R`: choose earlier checkpoint;
- `B`: fork current node;
- `1/2/3`: switch branch;
- `Space`: play/pause branch animation;
- `Tab`: swap active comparison board;
- one click: replay same root with new defense;
- one click: play opposite color.

Exact shortcuts can change; keyboard-first operation should not.

## Rewind behavior

When rewinding:

1. keep the old branch immutable;
2. restore full legal state and history;
3. optionally retain the previous opponent policy seed or generate a new one;
4. prompt for the new intent when the pack uses plan classes;
5. never recompute already cached evidence unnecessarily.

## Compare mode

### Dual board

Show two branches side by side at aligned relative plies.

### Difference strip

Summarize:

- evaluation/WDL trajectory;
- structure changes;
- timing events;
- key piece routes;
- outcome transitions.

### Narrative mode

A short causal explanation, not a move-by-move dump.

### Deep mode

Full tree, engine lines, corpus examples and manual exploration.

## Board swapping

The user's “swap between boards” idea is useful in three ways:

1. compare two attempts;
2. alternate between attacker and defender in the same position;
3. run a branch race, where the player makes one move on each board before the opponent responds.

### Branch race — experimental

Two boards begin from the same root. The player chooses different plans and alternates moves. This makes the divergence tangible but increases cognitive load. Keep it experimental and optional.

## Fast UX budgets

For local use, target:

- board ready from pack selection: <250 ms warm;
- branch switch: <50 ms;
- rewind: <100 ms;
- cached opponent move: perceived instant;
- uncached Maia move: preferably <500 ms on target hardware;
- shallow Stockfish feedback: <500 ms;
- deep branch analysis: asynchronous.

These are product targets to benchmark, not guaranteed measurements.

## Avoiding training contamination

Default advanced mode hides:

- evaluation bar;
- move labels;
- legal-move hints beyond normal board behavior;
- engine arrows;
- human frequencies.

Reveal them only after the segment or on explicit request.

## Session resume

Persist the branch graph as an event log so a user can:

- resume any branch;
- duplicate a run;
- export PGN with variations;
- share a position pack plus attempts;
- compare a later retry with the original.

---

<!-- SOURCE: 11_HUMAN_POSITION_ARENA.md -->

# Human Position Arena

## Concept

Match two players from a curated starting position rather than move one.

This is not merely a novelty blitz queue. It is a sparring protocol.

## Recommended match format

### Two-leg match

```text
Game 1: A has White, B has Black
Game 2: colors swapped, same root
```

Use the same time control and, where practical, the same pack objective.

After both games:

- compare the first divergence;
- compare plans and timing;
- inspect objective state changes;
- allow each player to fork one position and replay against a bot or each other;
- discuss before turning on deep engine analysis.

## Why a human adds value

- coherent plans and adaptation;
- genuine pressure and uncertainty;
- rating-level mistakes that may not match Maia's distribution;
- post-game discussion;
- exposure to an idea the pack author did not script.

## Why feedback still matters

Without a review layer, fixed-position games are useful reps but can reinforce bad conclusions. The arena should therefore sit on the same branch/evidence runtime as bot drills.

## Matchmaking difficulties

- sparse queue by rating, pack and time control;
- color/position imbalance;
- disconnects and second-leg abandonment;
- cheating and engine use;
- rating design;
- moderation;
- position leakage and pre-study;
- clocks and server authority.

## First implementation

Do not build native matchmaking first.

Start with:

- generated Lichess custom-position challenge links;
- private club cohorts;
- scheduled pack nights;
- invitation links containing pack/version and root FEN;
- imported PGNs returned to the drill lab for comparison.

Chess From Position already demonstrates launching Lichess challenges from a generated position. That lowers the proof cost.

## Rating

Use a separate training rating, if any. A fixed position can favor one side and users may know the pack. Ordinary chess rating is inappropriate.

Possible metrics:

- two-leg match score;
- objective achievement by side;
- performance relative to cohort in the same pack;
- branch quality after review;
- no global Elo until there is sufficient position calibration.

## Later formats

- asynchronous correspondence from a position;
- team analysis relay;
- coach-hosted arenas;
- “best defence” ladder;
- simultaneous branch tournament where all players start from the same root;
- hidden-objective games where each side receives a distinct plan.

Human sparring is valuable, but it is a phase-two product after the solo drill loop works.

---

<!-- SOURCE: 12_SYSTEM_ARCHITECTURE.md -->

# System architecture

## Recommended shape

A **modular monolith with worker processes**, not microservices.

The home-server deployment should be easy to run, inspect and modify.

```text
Web client
  ↕ WebSocket/HTTP
Application server
  ├── drill runtime
  ├── branch graph store
  ├── pack registry
  ├── feedback composer
  ├── corpus query adapter
  └── job queue
        ├── Stockfish workers
        ├── Maia workers
        ├── tablebase adapter
        └── deep-analysis jobs

PostgreSQL or SQLite
Parquet + DuckDB for corpus analytics
Object storage/filesystem for packs and analysis cache
```

## Client

Suggested:

- TypeScript;
- React with Vite or Next.js;
- chessground or another fast board UI, subject to license choice;
- local state for the active branch graph;
- WebSocket for opponent moves and analysis progress;
- PGN variation export.

## Server

Prototype choices:

- Python/FastAPI is fastest for engine orchestration and data work;
- Go or Rust is attractive for a long-lived service and corpus parser;
- a hybrid is reasonable: TypeScript UI, Python control plane, Rust stream processor later.

Avoid optimizing language choice before the drill runtime is validated.

## Core modules

### Pack Registry

Loads, validates, versions and indexes drill packs.

### Session Runtime

Applies legal moves, maintains clocks/objectives, emits events, evaluates stop conditions.

### Position Graph

Immutable nodes with parent pointers and branch metadata.

### Opponent Broker

Selects corpus, Maia, Stockfish or tablebase policy according to phase and pack.

### Evidence Service

Caches Stockfish, Maia, corpus, tablebase and feature-extractor results by position/context.

### Feedback Composer

Produces structured comparison from the pack contract and evidence packet.

### Corpus Index

Queries move/transition statistics and source games.

### Scheduler

Queues exact retries, varied retries and related transfer positions.

## Event model

Suggested events:

```text
run.started
move.committed
opponent.move_selected
checkpoint.reached
objective.state_changed
branch.forked
run.rewound
segment.completed
feedback.generated
outcome.reached
transfer.scheduled
```

Persist events; derive current state. This makes replay, debugging and schema evolution easier.

## Engine process management

- warm worker pools;
- one UCI session per worker;
- bounded concurrent searches;
- cancel stale searches after rewind;
- position/result cache;
- shallow interactive and deep asynchronous queues;
- per-pack deterministic seeds for reproducibility.

## Analysis cache key

Include:

- full position state;
- relevant history/repetition context;
- engine/model version;
- settings such as depth/nodes/Elo/temperature;
- tablebase version/path;
- feature-extractor version.

## Data stores

### Prototype

- SQLite or PostgreSQL for users, packs, runs and branches;
- filesystem for pack source and exports;
- in-memory cache or SQLite cache for one user;
- DuckDB over Parquet for bulk corpus.

### Small alpha

- PostgreSQL;
- Redis only if queues/cache require it;
- MinIO or filesystem for source PGNs and artifacts;
- no Kafka, no distributed services.

## Security

For a local deployment:

- bind privately by default;
- optional local auth;
- sandbox imported PGNs and pack files;
- validate all FEN/PGN and JSON Schema inputs;
- bound engine CPU/memory;
- never pass untrusted text directly to shell commands;
- treat LLM output as untrusted display data.

---

<!-- SOURCE: 13_FEASIBILITY_AND_HOME_SERVER.md -->

# Feasibility and home-server sizing

## Bottom line

A beefy home server is more than enough for the prototype. Compute is not the limiting factor.

## Interactive workload

One active drill typically needs:

- legal board updates;
- one Maia inference or corpus lookup for an opponent move;
- occasional shallow Stockfish analysis;
- cached feature extraction;
- deeper analysis after a segment.

That is modest.

## Maia

The official Maia-3 release identifies the 5M model as suitable for CPU and chess GUI use. Start there. Benchmark 23M/79M only after the interaction works.

Important tests:

- cold start;
- warm single-position latency;
- batch throughput;
- full 20-ply branch coherence;
- sampling stability by Elo;
- CPU versus available GPU;
- memory per worker.

## Stockfish

Use a small number of threads for interactive checks and a separate deep-analysis pool. Throwing all cores at every move can increase contention and latency.

Suggested initial policy:

- interactive: 1–2 threads, fixed nodes or short time;
- branch review: 2–4 threads, bounded MultiPV;
- offline validation: larger jobs when idle.

## Tablebases

- Five-piece Syzygy is under 1 GB.
- Complete six-piece WDL+DTZ is roughly 150 GB.
- Complete seven-piece Syzygy is around 18.4 TB and is unnecessary for v0.

Use five/six-piece local tables. Query a remote service or rely on Stockfish for larger positions until there is a reason to host seven-piece data.

## Corpus storage

One July 2026 Lichess standard-game archive is 29.1 GB compressed and roughly seven times larger uncompressed. Stream it; do not expand it permanently.

A targeted aggregate can be far smaller than the source:

- position key;
- rating/time-control bucket;
- move counts;
- result counts;
- transition/material tags;
- small sample of source game IDs.

The exact aggregate size depends on deduplication depth and how many plies are indexed. Measure before designing a distributed system.

## Proposed deployment profiles

### Minimal developer profile

- 8 CPU cores;
- 16–32 GB RAM;
- 100 GB free SSD plus optional HDD;
- no GPU;
- 5-piece tables;
- no bulk corpus.

### Comfortable research profile

- 16+ CPU cores;
- 32–64+ GB RAM;
- NVMe working disk;
- 1 TB+ bulk storage;
- optional GPU;
- six-piece tables;
- one or more streamed Lichess months.

The user's described server should comfortably exceed the minimal profile.

## What consumes engineering time

Not compute:

- authoring and reviewing packs;
- branch/compare UX;
- defining stop conditions;
- opponent coherence;
- feature extraction that supports honest explanations;
- regression testing pack claims;
- measuring whether users transfer the concept.

---

<!-- SOURCE: 14_VALIDATION_AND_KILL_CRITERIA.md -->

# Validation and kill criteria

## What must be tested

The prototype is not trying to prove that engines work. It must prove that **whole-sequence rehearsal plus rewind** adds value.

## Core hypotheses

### H1 — Opening continuation

Players who drill a line through its first characteristic middlegame decision understand and execute the opening better than players who stop at line recall.

### H2 — Branch comparison

Playing two alternatives produces better explanation and later choice than viewing two engine principal variations.

### H3 — Whole-segment replay

Redoing 8–20 plies improves timing and plan execution more than retrying only the critical move.

### H4 — Outcome drilling

Repeated conversion/hold/save play improves outcome rate on related endgames more than solving key-move puzzles.

### H5 — Human opponent model

Corpus/Maia opposition creates more believable and useful branches than weakened Stockfish.

## First evaluation design

Use three small reviewed packs:

1. a move-order-sensitive Sicilian/opening pack;
2. a quiet structural middlegame pack such as Carlsbad or IQP;
3. a rook-endgame outcome pack.

For each pack, compare:

- baseline explanation or line drill;
- one-move retry;
- full branch/replay loop.

Measure immediately and after a delay on a related position.

## Success metrics

### Learning

- objective achievement on second attempt;
- performance on a related position;
- reduction in timing-window failures;
- endgame conversion/hold/save rate across variants;
- ability to state the correct plan without engine terms;
- retention after several days.

### Product

- percentage of users who fork at least one branch;
- percentage who compare branches;
- average number of useful replays before abandonment;
- time from pack selection to first move;
- restart/rewind latency;
- session completion;
- voluntary return to the same concept.

### Content quality

- coach agreement with objective and accepted alternatives;
- factual error rate in feedback;
- frequency of “both moves fine, explanation forced” cases;
- opponent coherence rating;
- number of manual fixes per generated candidate pack.

## Correct kill criteria

Do **not** kill because paid products exist.

Kill or radically reposition when:

- opening mode collapses into ordinary spaced repetition;
- users rarely continue past the book boundary;
- users ignore branches and simply restart;
- branch comparison does not improve understanding over engine lines;
- Maia/corpus opponents produce incoherent plans over the required horizon;
- explanations remain generic despite curated packs;
- authors cannot reliably encode timing and structure without excessive custom code;
- full-segment replay does not transfer to related positions;
- endgame mode is not materially faster or more usable than Chess Endgame Training;
- pack production cost is so high that only a handful can ever exist.

## Positive continuation gates

Continue from vertical slice to product build when:

- at least 80% of reviewed feedback statements are accepted by strong reviewers without material correction;
- users complete and compare branches in a majority of Plan Drill sessions;
- second-attempt objective performance improves meaningfully;
- delayed related-position performance beats the baseline format;
- opponent coherence is judged acceptable for at least 80% of branches;
- pack authors can create a reviewed pack with a documented, repeatable workflow;
- endgame restart and response latency feel effectively instant.

Thresholds are provisional and should be preregistered before a formal test.

---

<!-- SOURCE: 15_ROADMAP_AND_EFFORT.md -->

# Roadmap and engineering effort

Effort is expressed in **engineer-weeks**, not calendar promises.

## Phase 0 — repository and competitor teardown

**1–2 engineer-weeks**

- hands-on benchmark of the closest products;
- capture exact UX for Chess Endgame Training, Noctie, Chess.com Practice, Chessable position play, Chess From Position and ChessDojo manual sparring;
- finalize licenses and stack;
- establish three reviewed sample packs.

## Phase 1 — branch runtime vertical slice

**3–5 engineer-weeks**

- web board;
- legal move/state handling;
- immutable branch graph;
- checkpoint rewind/fork;
- Stockfish UCI worker;
- Maia-3 UCI worker;
- pack schema and loader;
- one Plan Drill;
- basic branch comparison;
- PGN with variations export.

## Phase 2 — three drill modes

**4–8 engineer-weeks**

- Line Drill with theory boundary and continuation;
- Plan Drill with dual-board compare;
- Outcome Drill with Stockfish/Syzygy/Maia policies;
- replay variants;
- pack versioning;
- evidence packet and templated feedback;
- latency and caching work.

## Phase 3 — content tooling and trajectories

**5–10 engineer-weeks**

- pack authoring UI;
- model-game/corpus import;
- trajectory transitions;
- deterministic feature extraction;
- regression tests for claims;
- review workflow;
- related-position scheduling.

## Phase 4 — corpus mining

**3–8 engineer-weeks**, depending on ambition

- streamed Lichess ingestion;
- position/transition aggregates;
- rating/time-control filters;
- source-game search;
- automatic candidate pack proposals;
- performance tuning.

## Phase 5 — human arena

**6–12+ engineer-weeks** for native play, less for external challenge integration

- external Lichess challenge handoff first;
- invitation links and PGN re-import;
- later native clocks, reconnects, cheating controls and two-leg match state.

## Recommended v0 content scope

Do not attempt a complete curriculum.

Build approximately:

- 10 opening roots in one move-order-sensitive family;
- 10 roots in one quiet structural family;
- 15–25 endgame roots across convert/hold/save;
- 100–200 reviewed checkpoints/claims total;
- 3–5 connected trajectories.

This is enough to prove the interaction without hiding behind content volume.

## Recommended first packs

### Pack A — Sicilian timing and move order

Purpose: demonstrate that two playable moves can differ by one tempo and alter attack/counterplay order.

### Pack B — Carlsbad or IQP plan execution

Purpose: demonstrate quiet positional branching, piece improvement, pawn-break timing and exchanges.

### Pack C — practical rook endings

Purpose: demonstrate repeated conversion, hold and save objectives with varied defense.

These three expose the entire thesis. If the system only works for tactical attacks, it is not the intended product.
