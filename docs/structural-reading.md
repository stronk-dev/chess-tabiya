# Structural reading

Tabiya’s rung-0 structural layer is deterministic chess arithmetic over the FEN already stored in a
run. It serves two related purposes: pack authors can use structural expressions as objective
conditions, and learners can open a closed-by-default “Structural reading” control for exact current
position observations. Detection and significance remain separate; this layer never says a feature
is good, bad, important, or the reason to choose a move.

## Predicates

Pack schema 0.10 adds `structuralFeature` as a `fenPredicate` variant and
`structural_feature` as a success-condition kind. Expressions compose feature leaves with `all`,
`any`, `not`, and `pieceOnSquare`. The twelve closed feature kinds are current-file pawn safety;
Tabiya’s strict outpost detector; backward, isolated, doubled, and passed pawns; open and
colour-relative half-open files; exact blockers between aligned squares; one colour’s direct attack
count; attack-reachable square counts for knights, bishops, rooks, and queens; and four code-defined
structure conventions (Carlsbad, White IQP, Black IQP, and Maroczy Bind).

Pawn safety is explicitly current, not permanent. It ignores future captures into a new file and
reports that scope in the sentence. Direct attack counts are per colour and are never subtracted
into a “balance.” Attack reach ignores check and pins and is not called legal mobility. Outpost and
named-structure sentences identify themselves as Tabiya detector/catalogue conventions.

The FEN predicate dispatcher is exhaustive. Adding a future variant without an evaluator is a
compile-time failure followed by a default runtime refusal, closing the former D26 fallthrough.

## Reading projection

Author predicates and learner observations are different types. Arbitrary thresholds and arbitrary
line endpoints cannot be finitely enumerated. `structuralReading(fen)` instead emits a bounded,
canonical observation projection: pawn/file facts, occupied-piece pawn safety and outposts,
per-colour direct counts on occupied non-pawn squares, per-piece reach counts, slider rays, and
catalogue matches. The projection carries no score, rank, severity, advantage, or significance.

`structuralDelta(parentFen, fen)` reports gained/lost observation identities and current pawn-file
eviction-distance changes. `vacationReading(fen, square)` answers the one-ply geometric question of
which slider lines gain squares if the named piece vacates; it chooses no destination and assumes no
opponent reply.

Readings are pure and are not persisted. In committed play the disclosure starts closed, carries no
count badge, and opens only when the learner asks. Comparison presents each branch independently in
canonical order and never ranks or compares the readings.

## Objective grounding

Every feature leaf in a successful structural conjunction contributes a generic `rules:structure-*`
evidence reference. These durable refs name detector rules, not parameterized instances: the
existing evidence renderer has no FEN argument. Exact position-specific prose is computed from the
current FEN in the structural reading. This prevents evidence text from inventing parameters that
were not persisted.

Pack B (`carlsbad-minority-attack`) now has one machine-graded target: Black has a backward c-pawn
and White has a half-open c-file. The condition is false at the root and becomes true after the
minority attack’s structural concession; both leaves appear in the objective transition’s evidence.
The alternative central and kingside plans are not graded without recorded intent.

Plan-family packs that declare a graded objective but compile to no transition rules are refused at
load with `OBJECTIVE_GRADES_NOTHING`. `play_until_checkpoint` is exempt because it explicitly makes
no chess grading claim; trajectory containers are checked per leg, outcome objectives retain their
automatic grading, and theory objectives retain their boundary validation.

## Boundaries

This layer does not provide evaluation, “reasonable continuation” search, move advice, live
deviation classification, intent-relative grading, authored shape entries, overlays, or LLM prose.
Those require attributed evidence or later breadth contracts.
