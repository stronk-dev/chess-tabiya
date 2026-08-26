# King opposition — unobstructed geometry is the fact; phase is a relevance filter

**Question:** What exact board relation may `king_opposition` claim, and should applicability be
encoded as occupancy, material phase, or both?

**Status:** answered `[V]` at 2026-08-26 HEAD for the code and fixed populations, with the chess
meaning triangulated against three independent instructional sources. The shipped predicate is
too broad because it ignores occupied intervening squares. The source fact should become
unobstructed linear opposition; phase remains separate consumer-selection context.

**Instrument:** `tools/d1717-king-opposition-harness/`. Four default cases pin direct/distant
empty-versus-blocked positions plus rank/file, turn and color mirrors. The frozen census compares
the shipped predicate with the unobstructed candidate over 754 authored and 579 imported decisions.

## The chess boundary

The sources agree on the mechanical core:

- Lichess's worked king-and-pawn study defines direct opposition with **one empty square** between
  the kings and distant opposition with **three empty squares** in its example. `[V]`
  ([Lichess study](https://lichess.org/study/yE0QBu4A/8l9Lj76H))
- Chess.com's term reference defines direct opposition as kings facing on one rank/file with one
  square between, says the side not required to move has it, and defines distant opposition by an
  odd number greater than one. `[V]`
  ([Chess.com terms](https://www.chess.com/terms/opposition-chess))
- Capablanca's public-domain *Chess Fundamentals* states the same direct and odd-intervening-square
  rule and treats distant opposition as the kings moving on the same frontal/lateral line. `[V]`
  ([Wikisource edition](https://en.wikisource.org/wiki/Chess_Fundamentals/Part_I/13))

The board has room for only one, three or five intervening squares in aligned linear opposition.
The current `direct` and `distant` form enum is therefore complete for its deliberately linear
scope. Diagonal/rectangular/corresponding-square concepts are distinct additions, not aliases for
this predicate. `[M]`

What the sources do **not** establish is a universal material cutoff. They teach and apply the
concept in endgames because that is where it is useful. The exact geometric relation can exist
with other material present, while its practical consequence may be irrelevant or overridden.
Encoding `classifyPhase(fen) === "endgame"` inside the source would turn a board relation into a
product-specific phase judgement. `[M]`

## Shipped behavior and counterexamples

`opposition` currently checks:

1. both kings exist;
2. the requested color is not to move;
3. kings share a rank or file; and
4. the number of intervening coordinates is one for `direct`, or three/five for `distant`.

It never intersects the squares between the kings with board occupancy. `[V]`
(`packages/runtime/src/structure.ts:306-314`)

The canonical direct and distant pairs in D1717 each pass with an empty line. Adding one legal pawn
on an intervening square leaves the shipped result true and makes the unobstructed candidate false.
The D1714 nearly full-material opening is the same defect at production-selector scale: kings e1/e7
with pieces between them produce distant opposition across twenty legal alternatives. `[V]`
(D1717 case 1; `design/research/semantic-authority-empty-execution.md`)

The repair is the exact additional predicate
`between(ownKing, enemyKing) ∩ occupied = ∅`. It changes semantics and therefore requires a new
versioned source/event identity rather than silently relabelling `@1`. `[M]`

## Population effect

| Population | Decisions / unique child positions | Shipped observations | Unobstructed | Blocked rejects |
|---|---:|---:|---:|---:|
| Authored | 754 / 611 | 73 | 61 | 12 |
| Imported | 579 / 577 | 17 | 0 | 17 |
| **Total** | **1,333 / 1,188** | **90** | **61** | **29** |

`[V]` (D1717 frozen census). Occupancy removes 32.2% of current observations overall. More
importantly, every current imported occurrence is blocked; the shipped imported precision against
this necessary condition is 0/17. This is not a claim that the imported population contains no
real opposition in general—only that none of its 579 sampled decision children does. `[M]`

Phase decomposition explains the stale “never in opening” statement:

| Population | Opening | Middlegame | Endgame | Unclear |
|---|---:|---:|---:|---:|
| Authored current / unobstructed | 0 / 0 | 0 / 0 | 73 / 61 | 0 / 0 |
| Imported current / unobstructed | 1 / 0 | 13 / 0 | 1 / 0 | 2 / 0 |

`[V]` (D1717 frozen census). The current **authored corpus** happens to use opposition only in
endgames. The predicate is not phase-locked, and the imported population proves it fires in every
other phase. The prior campaign dossier generalized a corpus observation into a mechanism claim;
that sentence is corrected in this pass. `[M]`

## Contract consequence

The successor boundary is two layers:

1. **Source fact:** versioned unobstructed linear opposition with exact king identities/squares,
   form, controlling color, side to move and the empty-between receipt.
2. **Consumer relevance:** Support, Review, campaign effects, packs and authored conditions may
   require an endgame phase, explicit pack context or another significance rule. That filtering
   never changes whether the geometric source fact is true.

`[M]` This follows the platform's producer/module separation: collectors establish broad exact
truth; modules decide what is worth saying. It prevents both current errors—calling blocked kings
opposition and hiding a valid relation merely because a phase classifier says `unclear`.

For D1718's avoidance successor, `king_opposition` stays held until this new source version lands.
Its root subject is the color-identified king pair; controlling color/form are predicate parameters,
and every alternative must evaluate the unobstructed relation from the common root. `[M]`

## Required implementation fixtures

- direct and distant empty-line positives for both controlling colors;
- occupied-line negatives for direct, three-square and five-square distant forms;
- horizontal/file mirrors, turn reversal, even-gap and misalignment negatives;
- the D1714 opening witness becomes a source/event negative;
- the 61/29 population split is retained with input and predicate/result digests;
- the old `@1` convention remains readable for existing authored data but cannot satisfy the new
  event, avoidance or learner eligibility row; and
- an endgame-only module filter rejects a truthful non-endgame geometry without changing its source
  disposition.

## Limits

- This pass validates the necessary geometric meaning, not whether opposition decides a position,
  wins a pawn ending or is the best plan. Those claims require tablebase/search or authored theory.
- It does not add diagonal opposition, corresponding squares or key-square evaluation.
- The fixed populations measure reach, not universal chess frequency.
- No production, RFC, schema, content, pack or learner-UX byte changed.
