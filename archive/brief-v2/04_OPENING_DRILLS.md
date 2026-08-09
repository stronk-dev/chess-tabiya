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
