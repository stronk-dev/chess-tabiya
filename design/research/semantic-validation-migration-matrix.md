# Semantic-validation migration matrix — existing tests do not form one coverage class

**Question:** Which of the 67 declared semantic events already has an independent executable
authority for a production positive, semantic hard negative, orientation, counterfactual,
imported-population observation or external-labelled comparison?

**Status:** answered `[V]` at 2026-08-26 HEAD and refreshed by D1714. Existing work is reusable,
but it is sharply asymmetric: **39/67** events have a valid emitter-level positive, **10/67** have
an emitter-level semantic negative, **0/67** have an emitter-level orientation case, and **7/67**
have no valid authority in any measured arm. All seven remaining rows are mechanically reachable
avoidance events withheld because D1714 proved their subject relation unsound.

**Instrument:** `tools/d1713-semantic-validation-matrix/`. The checked 67-row matrix is set-equal
to `SEMANTIC_EVENT_PROJECTION_IDS`. Every populated cell records the exact source path, test title
and authority level, and fails when that named case disappears. Empty cells mean no authority was
established in this pass; they do not silently mean either required or not applicable.

## Why authority level matters

Five different facts had previously been discussed as though each meant “tested”:

1. the production semantic emitter emits the exact projection on a positive;
2. a lower-level chess predicate accepts or rejects its operands;
3. a composition helper constructs a derived event from pre-existing evidence;
4. an old imported-population result happens to contain an id; and
5. an external puzzle label agrees or disagrees with a local predicate.

They are not substitutes. A source-predicate negative does not prove the production event abstains;
an imported occurrence does not bind the current predicate implementation; an external label is
disagreement evidence rather than chess ground truth. `[V]` (D1713 matrix cases 1–3;
`design/research/basic-semantic-tactics-stage-0.md` §§6–8)

The matrix therefore retains five authority levels: `event_emitter`, `source_predicate`,
`composition`, `population_observation` and `external_disagreement`. It never promotes a lower
level to event validation. `[V]` (`tools/d1713-semantic-validation-matrix/validation-matrix.test.ts`)

## Measured matrix

| Arm | Event-emitter authority | Other executable authority | No measured authority |
|---|---:|---:|---:|
| positive | 39 | 0 | 28 |
| semantic hard negative | 10 | 13 source-predicate | 44 |
| mirror/orientation | 0 | 4 source-predicate | 63 |
| counterfactual/complete alternatives | 1 | 2 composition + 3 source-predicate | 61 |
| imported population | n/a | 23 population observations | 44 |
| external-labelled comparison | n/a | 8 disagreement studies | 59 |

`[V]` D1713 matrix case 3. These arms are independent, so column totals must not be added into a
single “coverage percentage.” External and counterfactual arms will legitimately be inapplicable
to some events; the RFC author must make that decision explicitly in a total profile.

### Production positives

The 39 emitter positives cover exact transition events, exchange/trade facts, square control and
mobility, selected king/material/activity facts, and the identity-retaining tactic sequences. The
remaining **28** event ids have no valid production-emitter positive bound by an exact test case:

- nine structural readings: backward/doubled/half-open/isolated pawns, opposition, king zone, open
  file, passed pawn and direct-attack count;
- four transition readings: occupied attack, occupied defence, slider ray and defended duty;
- all thirteen semantic-avoidance families;
- pawn dynamics; and
- check zwischenzug.

`[V]` The exact ids are emitted under `noEventPositive` by D1713 matrix case 3. This list does not
mean the underlying arithmetic is absent. It means the author cannot yet bind a passing fixture to
the real semantic emitter.

### Semantic hard negatives

Ten events have a nearby negative in a test that invokes their event emitter: the original
castling, checkmate, promotion, double attack and completed trade cases plus line blockers, piece
escape, development, pawn transitions and captured-zone defender from D1714. `[V]` Thirteen more
families have useful lower-level negative authorities: the original eleven plus harassment
pressure and defender consequence. Those thirteen must be elevated through a total production
emitter; their predicate-only cases cannot be copied unchanged and called complete. `[V]` (D1713
`NEGATIVE` authorities)

The other **44** events have no valid semantic-negative authority at any level. Missing an
operand is still a contract-shape negative and cannot discharge any of these rows. `[V]`

### Orientation and counterfactual boundaries

There is no event-emitter mirror/orientation case in the current suite. Four source primitives do
have orientation evidence—king opposition, square control, pawn dynamics and discovered attack—so
these are migration inputs, not completed event profiles. `[V]`

Counterfactual coverage is similarly narrow. Reply breadth has the sole emitter-level case. Two
avoidance families test complete-population composition; defender removal, line-blocker clearance
and interference have source-predicate counterfactual research. `[V]` Nothing in this result says
all 67 events need a counterfactual arm. It says the register must either require and bind one or
publish a reasoned `not_applicable` result instead of leaving a blank.

### Population and external evidence

The retained R2 imported result observes **23/67** current projection ids, not the 29-id literal
census from D1711: D1713 normalizes versioned population keys to current event roots and excludes
non-event ids. `[V]` (`tools/r2-selection-harness/f2-baseline.json`; D1713 `IMPORTED` construction)
The other 44 events cannot inherit population validation from the shared input digest.

Eight semantic-tactic families have an external Lichess-theme disagreement study. This is a
valuable restraint/calibration arm, not a positive oracle; Lichess themes are incomplete labels.
`[V]` (`tools/d872-semantic-tactics-harness/agreement.test.ts`;
`design/research/basic-semantic-tactics-stage-0.md`)

## Seven events with no valid independent authority

After D1714, the union of valid authorities remains empty for exactly these events:

- `derived.semantic_avoidance.half_open_file`
- `derived.semantic_avoidance.isolated_pawn`
- `derived.semantic_avoidance.king_opposition`
- `derived.semantic_avoidance.king_zone`
- `derived.semantic_avoidance.passed_pawn`
- `derived.semantic_avoidance.piece_count`
- `derived.semantic_avoidance.pawn_islands`

`[V]` D1713 matrix case 3 after the D1714 refresh. D1714 made all seven mechanically emit and
refuse, but also proved the projection/sign-only avoidance relation drops subject identity. Those
green cases remain defect witnesses under D1716, not semantic authorities. `[V]`

## Authoring consequence

The validation RFC now has a bounded migration plan rather than “reuse existing tests”:

1. register the 39 valid emitter positives and ten real emitter negatives without weakening them;
2. elevate the thirteen source-only negatives through the actual emitter;
3. author or repair 28 missing emitter positives and 44 missing semantic negatives, beginning with
   D1716's seven defect-blocked avoidance events;
4. lift the four source orientation cases and decide the other 63 cells explicitly;
5. retain counterfactual, population and external arms at their honest level while the RFC's total
   table rules required versus inapplicable per family; and
6. make result receipts and event eligibility fail if a registered test stops exercising the named
   production path.

`[M]` The work should be implemented by semantic family, but completion remains one set-equal
67-event authority. Splitting it into structural, transition, avoidance, tactic-sequence and
bounded-policy commits is operationally useful; declaring any family complete from a lower-layer
test is not.

## Limits

- Exact test-title binding proves that the named case exists today; D1711's proposed runtime
  fixture registry must additionally prove the case reaches the registered production emitter.
- This pass did not independently adjudicate every chess position in the existing tests.
- Imported occurrence and external disagreement remain observations, not authored chess truth.
- No RFC, production collector, schema, content, pack or learner-UX byte changed.
