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
