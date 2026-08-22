# Structural reading

Tabiya’s rung-0 structural layer is deterministic chess arithmetic over the FEN already stored in a
run. It serves two related purposes: pack authors can use structural expressions as objective
conditions, and learners can open a closed-by-default “Structural reading” control for exact current
position observations. Detection and significance remain separate; this layer never says a feature
is good, bad, important, or the reason to choose a move.

## Predicates

Pack schema 0.10 introduced `structuralFeature` as a `fenPredicate` variant and
`structural_feature` as a success-condition kind. Expressions compose feature leaves with `all`,
`any`, `not`, `pieceOnSquare`, and—since pack schema 0.13—bounded `quantified` and exact
orientation `mirrored` nodes. Pack schema 0.18 widens the vocabulary to eighteen closed feature kinds. They are maximal-reach pawn safety;
Tabiya’s strict outpost detector; backward, isolated, doubled, and passed pawns; open and
colour-relative half-open files; exact blockers between aligned squares; one colour’s direct attack
count; attack-reachable square counts for knights, bishops, rooks, and queens; and four code-defined
structure conventions (Carlsbad, White IQP, Black IQP, and Maroczy Bind); bishop-square shade,
per-colour or signed-difference pawn counts, tempo-qualified direct or distant king opposition,
all-role piece census, current king edge/corner zones, and static empty-board distance for kings,
knights, bishops, rooks, and queens. `pawn_count` and `piece_reach_count` with `scope: every`
remain readable only for compatibility and emit authoring warnings; predicate wave 4 owns removal.

`quantified` applies `some` or `every` to an ordered file range or square rectangle. It removes
finite authoring fans without adding a new chess judgement. `mirrored` rewrites an expression over
files, colours/ranks, or both. Bishop shade flips under a one-axis mirror and is preserved under the
two-axis rotation; opposition colour flips only when colours flip. Catalogue names cannot be
mirrored because their orientation is part of the convention. A files mirror may widen one shape
entry, but a colour mirror requires a separately authored entry because plan-side labels are
entry-wide.

King zones and static distance are invariant under board reflection; their colours and
piece-target colours flip only under colour reflection. A bishop distance to an unreachable
opposite-colour square is false for every comparison, including `atLeast: 0`, rather than
vacuously true.

Pawn safety uses the versioned `maximal_pawn_reach@1` convention. It treats every geometrically
possible forward route or capture migration onto an attacking file as reachable while deliberately
ignoring blockers, whether a required capture will exist, turn order, and move legality. A false
result can therefore be pessimistic; a true result establishes only that no opposing pawn has such
a geometric path. The reading and evidence catalogue disclose that scope. Direct attack counts are per colour and are never subtracted
into a “balance.” Attack reach ignores check and pins and is not called legal mobility. Outpost and
named-structure sentences identify themselves as Tabiya detector/catalogue conventions.

The FEN predicate dispatcher is exhaustive. Adding a future variant without an evaluator is a
compile-time failure followed by a default runtime refusal, closing the former D26 fallthrough.

## Reading projection

Author predicates and learner observations are different types. Arbitrary thresholds and arbitrary
line endpoints cannot be finitely enumerated. `structuralReading(fen)` instead emits a bounded,
canonical observation projection: pawn/file facts, occupied-piece pawn safety and outposts,
per-colour direct counts on occupied non-pawn squares, per-piece reach counts, slider rays, and
catalogue matches. It includes exactly twelve per-colour/per-role piece counts, no legacy
`pawn_count`, bishop-square shade per bishop, king edge/corner zones, one king-to-king distance,
and at most one opposition fact; it never emits signed piece differences. The projection carries no
score, rank, severity, advantage, or significance.

`structuralDelta(parentFen, fen)` reports gained/lost observation identities and current pawn-file
eviction-distance changes. `vacationReading(fen, square)` answers the one-ply geometric question of
which slider lines gain squares if the named piece vacates; it chooses no destination and assumes no
opponent reply.

Readings are pure and are not persisted. In committed play the disclosure starts closed, carries no
count badge, and opens only when the learner asks. Comparison presents each branch independently in
canonical order and never ranks or compares the readings.

## Objective grounding

The same closed `structuralExpression` grammar is also consumed by a timing window's
`position` close. That use contributes to the timing verdict but does not mint a
structural evidence reference; the applied objective record uses the window's `tempo:`
reference instead.

Every feature leaf in a successful structural conjunction contributes a generic `rules:structure-*`
evidence reference. These durable refs name detector rules, not parameterized instances: the
existing evidence renderer has no FEN argument. Exact position-specific prose is computed from the
current FEN in the structural reading. This prevents evidence text from inventing parameters that
were not persisted.

Pack schema 0.24 factors registry references into the expression grammar. A `plan_signature` leaf
resolves a pack plan class through its shape-plan reference and compiles to the same FEN predicate
as the registered structural signature, with a `planClass#<id>` evidence ref. It can be used in a
position condition, inside a transition's before/after position node, and at the other pack-local
structural-expression sites: checkpoint and authored-boundary FEN predicates, timing-window
position clauses, and structural key-point grounds. Pack validation and the expression census
resolve through the same registry seam before evaluating; the registry-free runtime continues to
reject unresolved raw references. Unknown, unbound, uncomputable, nested, and never-present
signatures fail closed at pack load. The older `plan_consequence` condition is deprecated.

The selection rule has one axis and one modifier. If the claim can be checked from one diagram,
use `structural_feature`; if it needs two positions or a move property, use `transition_feature`.
If a bound shape plan already defines the structural expression, reference it with
`plan_signature` in either grammar and never restate the registered signature inline.

Pack B (`carlsbad-minority-attack`) grades the committed transition that produces its target:
a White slider line opens and the resulting position has the grounded backward Black c-pawn on a
White half-open c-file. Its currently inlined after-position expression is detected by the
`PLAN_SIGNATURE_INLINED` authoring warning and can be replaced by the registered
`minority-attack` plan signature without changing the predicate; see `docs/transition-primitives.md`.
The alternative central and kingside plans are not graded without recorded intent.

Plan-family packs that declare a graded objective but compile to no transition rules are refused at
load with `OBJECTIVE_GRADES_NOTHING`. `play_until_checkpoint` is exempt because it explicitly makes
no chess grading claim; trajectory containers are checked per leg, outcome objectives retain their
automatic grading, and theory objectives retain their boundary validation.

## Boundaries

This layer does not provide evaluation, “reasonable continuation” search, move advice, live
deviation classification, intent-relative grading, authored shape entries, overlays, or LLM prose.
Those require attributed evidence or later breadth contracts.

## Measured envelope

The structural projection is instrumented rather than gated by wall-clock time. On 2026-08-14,
200 samples on a quiet development machine measured **3.393 ms median** and **5.336 ms maximum**
after the fifteen-kind widening. Predicate wave 3 retains the instrument-only rule with the widened
eighteen-kind projection; wall-clock samples remain observations rather than gates.
The same code reached **103.5 ms maximum** under parallel-agent load. That variance is why the unit
test asserts only a non-vacuous finite sample: a gate that can report either answer on identical
code is not evidence.

The 100 ms value is a worry threshold that prompts investigation, not a pass/fail assertion. To
retrieve a visible sample (the default Vitest gate intercepts console output), run:

```sh
npx vitest run packages/runtime/src/structure.test.ts --disable-console-intercept
```
