# Drill pack authoring guide

## Authoring rule

A pack teaches one narrow decision family. It is not a database dump.

## Required fields

- title and version;
- target phase/mode;
- target rating or prerequisite;
- source/provenance;
- legal start position plus move history;
- objective;
- concept and transfer cue;
- expected plan classes;
- accepted alternatives;
- opponent policy;
- checkpoints;
- stop conditions;
- feedback claims with evidence requirements;
- retry variants;
- optional trajectory transitions.

## Workflow

1. Choose the learning claim.
2. Select 3–10 representative roots.
3. Write the objective before engine analysis.
4. Identify at least two plausible plans where possible.
5. Analyze with Stockfish MultiPV.
6. inspect human/corpus continuations.
7. define events and timing windows.
8. play every branch manually from both sides.
9. test the opponent policy over multiple seeds.
10. add one related transfer position.
11. obtain review.
12. version and publish.

## Evidence labels

Every authored statement should be tagged:

- `author_principle`;
- `engine_validated`;
- `tablebase_exact`;
- `corpus_observed`;
- `human_model_predicted`;
- `derived_feature`;
- `hypothesis`.

## Pack regression tests

- all moves legal;
- all required nodes reachable;
- stop conditions terminate;
- accepted alternatives stay within configured objective tolerance;
- objective state agrees with tablebase/engine at validation depth;
- feedback references existing evidence fields;
- no branch depends on a removed checkpoint;
- opponent produces at least N distinct valid runs;
- source license/provenance recorded.
