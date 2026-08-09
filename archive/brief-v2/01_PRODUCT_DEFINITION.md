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
