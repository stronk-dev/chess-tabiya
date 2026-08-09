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
