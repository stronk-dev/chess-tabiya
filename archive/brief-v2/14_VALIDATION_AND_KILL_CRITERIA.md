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
