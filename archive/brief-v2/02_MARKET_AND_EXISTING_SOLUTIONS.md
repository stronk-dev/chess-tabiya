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
