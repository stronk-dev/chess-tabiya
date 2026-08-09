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
