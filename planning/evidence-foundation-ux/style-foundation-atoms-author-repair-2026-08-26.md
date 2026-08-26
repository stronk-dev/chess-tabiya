# R21 style-foundation atoms — author handoff (D1739)

**Inputs:** `design/research/player-style-metrics.md`,
`design/research/longitudinal-style-feedback-contract.md`,
`planning/style/rfc-derivation.md` and the executable R12/R21 registries.

**Purpose:** register the seven literal source atoms that Review, future habit cards, drill
selection and candidate analysis need. This handoff owns facts only. It authorizes no style prose,
threshold, habit card, type, recommendation, storage row or bot personality.

## Why this is foundation work

R12 measured twelve persistent short-session metrics, but R21 found five feature identities absent
from production plus two denominator/source mismatches. A longitudinal store cannot repair an
observation that was never emitted, and a style RFC must not privately recompute chess facts that
Review or drills also need. These atoms therefore belong in the shared evidence foundation before
the learner-facing style surface.

The seven contracts are:

| research feature | literal source fact | abstention / non-claim |
|---|---|---|
| `structure.fianchetto_setup@1` | per color, the exact bishop and advanced b/g-pawn squares for a reached b2/g2/b7/g7 setup on a recorded path | state is neither good, intended nor a recommendation |
| `structure.fianchetto_knight_screen@1` | the same setup plus the same-color knight on the bishop's first inward diagonal square, retaining all three pieces | no discovered-attack or plan claim |
| `move.role.pawn@1` | exact source role for one legal candidate/committed move | role says nothing about quality or style |
| `move.pawn_to_extended_center@1` | exact pawn move whose destination is one of c4/d4/e4/f4/c5/d5/e5/f5 | “centre” is the declared destination set, not control, space or goodness |
| `move.early_queen@1` | exact queen move with source ply `< 16` | the fixed ply boundary is disclosed; “early” carries no criticism |
| castling game eligibility | learner color retained at least one castling right at that color's first decision in the game; exact available sides retained | not current castling legality and not whether the learner should castle |
| `time.spend_share@1` inputs | typed previous/current clock, declared base/increment, actor, decision identity and phase needed for the R21 arithmetic | missing clock/control, non-positive available time or current > available abstains; no speed/quality diagnosis |

The feature names above are research identities. The author must map them to one versioned F1
projection vocabulary under the existing producer naming rules rather than registering dotted
aliases in a second namespace. The mapping is literal and checked in the closeout receipt.

## Required source boundaries

1. Fianchetto configuration is path state. A position reader may emit exact configurations; the
   game-level “reached at least once” fact is a derived path projection over those items, not a
   second board scan in the style consumer.
2. Move role, extended-centre destination and the ply-bounded queen fact derive from the sealed
   exact legal-move/candidate item. They must be computable for every candidate so the opportunity
   denominator can use the complete legal set; a played-move-only event is insufficient.
3. Castling eligibility is a game/actor fact evaluated at the learner color's first decision. It
   is not the existing per-position rights reading and must preserve both the initial eligible
   side set and the later performed side separately.
4. Clock spend has one arithmetic authority:
   `max(0, previous + increment - current) / (previous + increment)`. The source item carries raw
   typed operands and abstention; phase-specific means remain longitudinal reader arithmetic.
5. Every atom retains actor/decision class. Imported mainline moves are not silently attributed to
   the learner, and seated opponents/coaches never enter the learner's observation stream.

## Able-to-fail transfer

The production suite must port—not merely cite—the exact R12/R21 definitions:

- all four color/wing fianchetto mirrors, with a wrong-color knight and missing advanced pawn as
  hard negatives;
- the `ply === 15` / `ply === 16` queen boundary;
- all eight extended-centre destinations plus an adjacent non-member control;
- all promotion roles in the complete legal-candidate denominator;
- standard and Chess960-safe castling-side classification through the canonical move authority;
- first-decision castling eligibility for either, one or no retained right;
- first-clock-from-base, increment, missing clock, non-positive denominator and impossible
  current-clock abstention cases;
- set equality between the five feature atoms named by R21 and the registered source mapping.

Population thresholds, 25–200-game floors, intervals, early/late transfer and blitz/rapid transfer
belong to the style consumer's measurement gate. They must not appear in these source declarations.

## Ownership and landing order

Absorb this handoff into D1736's shared source-identity amendment because it versions the same F1
catalogue and source-operation seam. Its local board/move atoms can land with stage 1; castling
eligibility and the clock join remain declared unavailable until their run/clock inputs exist.
Real operations and independent validation still precede any module, Review or longitudinal
consumer. `player-style.md` and `skills.md` consume the resulting ids but do not own them.

## Exit

The author amendment names the exact projection ids, producers, operands, derivations, abstentions,
versions, operations and fixtures for all seven contracts, and the D1737 receipt assigns them one
execution owner. No learner-facing style claim is authorized by this handoff.
