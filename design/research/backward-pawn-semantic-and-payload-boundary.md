# Backward pawn — preserve the structure, expose the subject, separate the consequence

**Question:** Is the shipped `backward_pawn` predicate a defensible chess primitive, and what must
it retain to power precise board highlights, avoidance, Review, theory and hints without inventing
“weakness” or “this move loses the pawn”?

**Status:** answered `[V]` at 2026-08-26 HEAD. The shipped test is a defensible narrow Tabiya
convention—no adjacent friendly pawn at the same or a not-ahead rank, and the next square is
pseudo-controlled by an enemy pawn—but it is not a canonical universal definition and its payload
is insufficient. Across the fixed populations, 403 file observations represent 404 pawn subjects;
all 403 readings retain zero squares. Of the 404 subjects, 153 have an occupied stop square, so
“advance and it can be captured” is not an available move claim. Keep the broad structural fact,
publish an identity-rich v2 receipt, and derive legal advance/capture consequences separately.

**Instrument:** `tools/d1723-backward-pawn-harness/`. Five tests reconstruct the shipped file
predicate from exact pawn subjects, pin support/occupancy/controller/isolation cases, prove a
doubled-file identity collision and retain the authored/imported census. No production byte
changes.

## What chess sources agree on—and where implementations diverge

Chess.com's term reference describes a backward pawn as lacking support from other pawns and being
unable to advance freely without capture. It says adjacent pawns may have advanced or disappeared,
so absence of any adjacent friendly pawn does not automatically disqualify the label. It calls
supporting another adjacent pawn “almost always,” not a required predicate. `[V]`
([Chess.com, *Backward Pawn*](https://www.chess.com/terms/backward-pawn-chess))

Chess Programming Wiki gives the computational core as an own pawn no longer defensible by own
pawns whose stop square is controlled by a sentry. It also warns that stop-square logic can be
insufficient because a pawn may push while leaving a permanently weak later square. `[V]`
([Chess Programming Wiki, *Backward Pawn*](https://www.chessprogramming.org/Backward_Pawn))

A historical Stockfish 2.1.1 implementation makes materially different product choices: it
excludes passed, isolated and chain pawns; excludes a pawn that can capture an enemy pawn; then
scans neighboring files until the first friendly/enemy pawn and requires the friendly pawn to be
two ranks closer to help. `[V]`
([Debian source mirror, Stockfish `pawns.cpp` lines 397–425](https://sources.debian.org/src/stockfish/2.1.1%2Bgit20111006-2/src/pawns.cpp/#L397))

Those sources support the concept and refute a single universal executable formula. Stockfish's
exclusions also serve evaluation bookkeeping—avoiding overlapping penalties—not necessarily chess
term ontology. Tabiya therefore needs a named convention with disclosed operands, not a claim that
its boolean is “the” rules of chess. `[M]`

## Shipped convention

For each pawn on the requested file, production currently computes:

1. `supportCandidates`: friendly pawns on adjacent files whose rank is the same or not ahead from
   the subject's perspective;
2. `stop`: the square one rank forward; and
3. `enemyPawnControllers`: opposing pawns whose pseudo pawn-attack set contains `stop`.

The file predicate is true if any subject has zero support candidates and at least one enemy pawn
controller. It does not test stop occupancy, legal move availability, pin legality, half-open file,
piece attacks, an engine value, or whether the pawn can resolve the structure by capturing. `[V]`
(`packages/runtime/src/structure.ts:497-505`; D1723 set-equality fixture)

The D1723 pin fixture makes the legal boundary concrete: White's d4 pawn qualifies because Black's
c6 pawn pseudo-controls d5, but after the legal `d4d5` push, `c6d5` is illegal because moving the
c6 pawn exposes Black's king to the c-file rook. The broad structural fact is true under the
declared convention; “Black can capture it” is false. `[V]` (D1723 legal-reply fixture)

This is a useful exact *relation under a declared convention*. It is not itself any of these claims:

- the pawn is weak or important;
- advancing loses it;
- the controlling pawn has a legal capture after the advance;
- the stop square is a useful outpost;
- the pawn can be won; or
- the player intended to create/avoid the structure.

`[M]` Those require, respectively, module selection, an empty/legal push plus legal reply receipt,
the outpost/theory lane, exchange/search evidence, or are refused intent inference.

## Population and payload loss

| Population | Decisions / unique positions | File observations | Exact pawn subjects | Empty stop | Occupied stop |
|---|---:|---:|---:|---:|---:|
| Authored | 754 / 611 | 142 | 142 | 86 | 56 |
| Imported | 579 / 577 | 261 | 262 | 165 | 97 |
| **Total** | **1,333 / 1,188** | **403** | **404** | **251** | **153** |

`[V]` D1723 frozen census. One imported position has two qualifying pawns on the same file, while
the reading emits one file observation. Every one of the 403 readings has `squares: []`; the
current renderer can say only “a backward pawn on the c-file,” not which pawn, its stop square or
which enemy pawn establishes the convention. `[V]`
(`packages/runtime/src/structure.ts:618-624,598-616`)

The 153 occupied stops split 8 own pieces / 145 enemy pieces. This does not necessarily make the
broad static structure label false, but it makes an immediate advance consequence unavailable.
The structure receipt must retain occupancy so a module can abstain or phrase the fact honestly.
`[M]`

Other measured attributes show why they are operands/selectors rather than definition shortcuts:

| Attribute | Subjects | Share |
|---|---:|---:|
| Has an adjacent own pawn ahead | 305 | 75.5% |
| Isolated under literal adjacent-file occupancy | 99 | 24.5% |
| On a half-open file for its owner | 145 | 35.9% |
| Can pseudo-capture an enemy pawn now | 7 | 1.7% |

`[V]` D1723 census. Requiring a half-open file would discard nearly two thirds of current subjects.
Rejecting isolated pawns would conflict with Chess.com's “or no longer exist” arm and should be an
explicit alternative convention, not an invisible fix. The seven immediate capture cases are a
useful “structure can change now” selector, not evidence that the static relation is absent. `[M]`

The relation appears in every phase: 8 opening, 293 middlegame, 37 endgame and 66 unclear subjects.
That distribution supports a general collector with phase-aware module selection, not a
middlegame-only source. `[V]` (D1723 census)

## v2 evidence boundary

`[M]` The successor should preserve today's broad truth set while making the convention and its
literal proof explicit:

```text
backward-pawn@2 subject
  color, pawn square, file
  stop square + exact occupant or empty
  all adjacent friendly pawns partitioned as support-capable / ahead
  all enemy pseudo-pawn controllers of the stop square
  immediate pawn captures available from the subject
  half-open-file state
```

The reading emits one item per pawn subject. The authored file predicate remains an existential
projection over those subjects, with an explicit convention discriminator. The signed event tracks
the same pawn across the legal edge with before/after square (or removal), and D1718 avoidance
groups by that exact root pawn plus the requested outcome. A file label is a presentation summary,
never the evidence identity.

The current truth set may remain as historical `backward-pawn@1`; v2 changes payload/projection
identity even if the boolean set is retained. Five authored leaves in three JSON documents need an
explicit v1/v2 classification:
`content/drafts/carlsbad-minority-attack.json`,
`content/drafts/trajectory-qgd-exchange-minority.json` and
`content/shapes/carlsbad.json`. `[V]` (exact JSON search at HEAD)

## Consequence projections for graduated support

The broad receipt intentionally powers several distances without pretending they are the same fact:

1. **Theory-only / subtle nudge:** name the pawn relation and light the pawn, stop square and enemy
   controller. No move or valence.
2. **Post-commit explanation:** say the move created/removed/preserved that exact subject under the
   convention; show the changed support/controller edge.
3. **Advance availability:** only when the stop is empty and the one-step push is legal for the
   appropriate turn clone, emit the exact candidate move.
4. **Reply consequence:** after that candidate, enumerate legal opponent pawn captures of the
   advanced pawn. Pseudo-control alone cannot say “can capture” when the controller is pinned.
5. **Evaluation/plan:** exchange, engine, authored theory or a cited shape may explain whether the
   consequence matters. The structural collector never promotes itself into a weakness verdict.

`[M]` This is the producer→module split the owner requested: one rich primitive pool, opinionated
workflow modules, and no raw dump or mandatory direct move.

## Able-to-fail fixtures

- Both colors and file mirrors for classic unsupported + pawn-controlled stop.
- Same-rank/behind friendly pawn suppresses; adjacent-ahead pawn is retained but does not suppress.
- Isolated overlap is explicit and does not silently inherit Stockfish's evaluation exclusion.
- Empty, own-occupied and enemy-occupied stop states all retain distinct operands.
- Piece-only stop control does not satisfy the narrow pawn-controller convention.
- A doubled file with two qualifying subjects emits two subject readings, not one anonymous file.
- Legal-advance and legal-reply projections refuse occupied stop, wrong turn, illegal/pinned push
  and pseudo-only controller capture.
- The fixed census retains 403 file / 404 subject / 251 empty / 153 occupied and all-zero current
  reading squares until the successor intentionally moves the baseline.
- All five authored leaves are explicitly migrated or retained as legacy; no default changes in
  place.

## Limits

- The fixed populations establish current reach, not universal chess frequency or usefulness.
- The historical Stockfish implementation is evidence of convention diversity, not a proposed
  replacement and not evidence about current NNUE internals.
- This pass does not grade backward pawns, prove an outpost, evaluate a minority attack or author
  chess lessons.
- No RFC, schema, production, content, module, bot or UI byte changed.
