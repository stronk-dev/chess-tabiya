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
