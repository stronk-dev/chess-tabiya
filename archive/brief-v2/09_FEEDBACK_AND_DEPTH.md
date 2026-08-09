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
