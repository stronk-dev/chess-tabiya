# Transition primitives

Pack schema 0.22 adds a sibling grammar for facts about a committed move. Static structural
expressions still describe one FEN; transition expressions receive the parent FEN, the committed
UCI move, and the resulting FEN. They never accept a candidate move or search a continuation.

## Grammar and evaluation

`TransitionExpression` has `all`, `any`, `not`, `feature`, and `position` nodes. A `position`
node delegates its `before` or `after` FEN to the existing structural-expression evaluator. The
six closed leaves are:

- attacked enemy-occupied squares gained or lost;
- defended friendly-occupied squares gained or lost;
- surviving slider rays opened or closed;
- geometric destination squares gained or lost by same-square surviving pieces;
- same-square pieces acquiring or releasing a second defensive duty; and
- rules-derived move irreversibility: castling, capture of the last piece of a role, pawn
  contact, or a capture/pawn move resetting the halfmove clock.

Counts are exact board censuses, not evaluations. Attack and defence relations ignore pins and
recapture value; destination squares are geometric rather than legal mobility; slider rays say
nothing about usefulness; the duty threshold does not mean “overloaded.”

`transition_feature` is the eighth drill-pack success-condition kind. It compiles to an objective
predicate over the active node and its parent. Evidence uses one durable `rules:transition-*`
reference per leaf, plus any structural refs contributed by embedded `position` nodes.

Pack validation replays the authored spine and legal deviation edges. A positive condition that
matches none of those edges is refused; a negative condition that matches every edge is refused;
a positive condition matching every edge in a set of four or more warns. The refusal is a coverage
claim about the pack, not a satisfiability proof. Its diagnosis distinguishes zero pack coverage,
unestablished satisfiability, and the required author action. Witnesses never manufacture pack
coverage.

## Landing measurement

The production evaluator was checked against the independent R1/R2 harness over 634 committed
spine transitions. The harness’s old defensive-duty calculation counted a moved piece at its new
square; the shipped leaf follows the RFC’s stricter same-square pairing, and the landing oracle
was corrected accordingly.

| Leaf | Any-direction firing rate | Maximum observed count |
|---|---:|---:|
| `attacked_squares_changed` | 37.5% | 4 |
| `defended_squares_changed` | 34.1% | 3 |
| `slider_lines_changed` | 54.1% | 3 |
| `escape_squares_changed` | 94.0% | 11 |
| `defended_duties_changed` | 12.1% | 2 |
| `move_irreversibility` | 34.2% | n/a |

The median full reading was 51.32 µs per ply on the landing checkout. These figures are
instruments, not performance gates. The validator uses the measured per-leaf maxima rather than a
generic board-size bound.

The corrected target-keyed attack rate remains below the independent pair-keyed upper bound. The
same is true for defence. The earlier selectivity ordering does not survive, which agrees with R3:
selectivity does not establish usefulness. Therefore no transition leaf is surfaced live.

## Surfaces and content

Just Play and drills expose a closed-by-default “What changed on this move?” reading for the
currently displayed committed edge. Opening or closing it does not mutate the run. R3 measured an
89% observation-level false-positive rate, so there is deliberately no new pivotal marker and no
assistance-preference migration.

Three authored packs exercise the grammar at load time:

- `carlsbad-minority-attack` grades the move that opens a White slider line while producing the
  already-grounded backward Black c-pawn on White's half-open c-file;
- `pawn-breakthrough-convert` records the pawn-contact transition as preserved progress; and
- `mate-k-q-technique` records lost flight geometry and degrades when an authored deviation gives
  Black at least two geometric destinations.

`structuralDelta` remains outside the transition evaluator. Its exported API remains available,
but its eviction scan now parses each FEN once instead of reparsing it 256 times. The transition
module imports neither `structuralReading`, `structuralDelta`, nor `pawnSafety`.
