# Authority-empty semantic execution — all fourteen fire, seven are not valid semantics

**Question:** Are D1713's fourteen authority-empty semantic events merely missing fixtures, or are
their production paths unreachable or semantically defective?

**Status:** answered `[V]` at 2026-08-26 HEAD. All fourteen can be made to emit from legal chess
inputs. Five local events are fixture-ready with emitter-level positives and semantic negatives;
two recorded-sequence events have valid positive constructors but no total emitter through which a
negative can pass; all seven avoidance families mechanically emit and refuse, but their shared
projection/sign grouping drops the subject relation and is not valid learner semantics.

**Instrument:** `tools/d1714-authority-empty-harness/`. Seven tests pin the fourteen-id set, exact
legal FEN/move/sequence positives, nearby non-corrupt semantic negatives and the two defects found
by the pass. D1713 consumes only authorities that survive those defects.

## Result by event

| Event | Positive path | Negative path | Classification |
|---|---|---|---|
| `rules.structural.event.line_blockers` | `localSemanticEvents` | legal king-only edge emits none | fixture-ready |
| `rules.transition.event.piece_escape` | `localSemanticEvents` | remote pawn edge emits none | fixture-ready |
| `rules.transition.event.developed` | `localSemanticEvents` | opening pawn edge emits none | fixture-ready |
| `derived.pawn.event.transitions` | `breadthSemanticEvents` | non-pawn edge emits none | fixture-ready |
| `derived.king.captured_zone_defender` | `localSemanticEvents` | non-capture king edge emits none | fixture-ready |
| `derived.pawn.sequence.harassment_pressure` | predicate → event constructor | predicate abstains before constructor | split emitter; D1710 operation required |
| `derived.tactic.sequence.defender_consequence` | predicate → event constructor | predicate abstains before constructor | split emitter; D1710 operation required |
| seven `derived.semantic_avoidance.*` ids in the D1713 empty set | complete-alternative selector | same-sign alternative suppresses the event | mechanically reachable; semantically blocked by D1716 |

`[V]` (D1714 tests 1–7; `packages/runtime/src/semantic-evidence.ts:325-405,555-589,804-858,997-1058`)

The five local positives were harvested from current authored edges and then frozen as independent
FEN/move bytes. They cover line-blocker loss, gained piece escape, minor development, a pawn contact
execution/transition and capture of a retained king-zone defender. Their negatives call the same
aggregate emitter on legal positions where the named predicate is false; no operand is deleted.
`[V]` (D1714 tests 2–3)

## The sequence path is split, not total

Harassment pressure and defender consequence each have two public functions: one interprets a
recorded path into an optional payload; the other accepts a pre-existing payload plus declared move
evidence and seals an event. The positive can traverse both halves. On a semantic negative the
first half returns `undefined`/`[]`, so there is no event-emitter operation to invoke and observe
abstention. `[V]` (D1714 test 5; `harassmentPressureSequence` /
`harassmentPressureSemanticEvent`; `defenderConsequenceOperands` /
`defenderConsequenceSemanticEvent`)

This reproduces D1710's execution partition rather than opening a duplicate defect: isolated
constructors are not a production operation. The D1711 fixture runner may preserve these positives,
but an emitter-level negative waits for D1710's recorded-path compiler/operation. `[M]`

## Avoidance mechanically fires but does not preserve the claimed subject

Deterministic legal-game search found a production-selector positive for every one of the seven
previously empty avoidance ids: half-open file, isolated pawn, king opposition, king zone, passed
pawn, piece count and pawn islands. Each exact fixture passes the real
`selectLocalSemanticEvidence(research.r2_candidate@1)` path with 13–41 legal alternatives. A nearby
alternative carrying the same source sign suppresses the same avoidance event, so these are not
dead code. `[V]` (D1714 test 4)

They are not valid semantic-positive authorities. `familyKey` groups an alternative event by only
`projection@version:sign`, while the source observations retain color, file, role, squares and
piece identities. The output's `family` operand also retains only projection and sign. `[V]`
(`packages/runtime/src/semantic-evidence.ts:982-1037`)

The exact counterexample is `a4b5` from
`r1b1r1k1/1p4pp/2p1pq2/1p1p4/P2P4/2QBP3/5PPP/1R3RK1 w - - 0 19`:

- the played edge loses `isolated_pawn(white,a)` and gains `isolated_pawn(white,b)`;
- all 41 alternatives preserve `isolated_pawn(white,a)`; and
- the selector emits `derived.semantic_avoidance.isolated_pawn`, underlying sign `preserved`.

`[V]` (D1714 test 4) The condition remains true on a different subject, so ordinary module copy
such as “you avoided an isolated pawn” would be false. Four of the seven frozen positives have the
same broader shape: the played edge still emits the source family at another sign while the
avoidance event claims absence of `preserved`. The other three still lose color/role/square identity
at the aggregation boundary. D1716 therefore blocks all seven from validation and learner
eligibility until a declared subject/outcome relation joins played and alternatives. `[M]`

## Opposition is a second independent semantic defect

The generated king-opposition fixture is an opening with nearly full material: White king e1,
Black king e7. All twenty alternatives that leave the white king on e1 “gain distant opposition”;
`Kf2` avoids it. The predicate checks aligned kings, an odd gap and side to move only. It does not
check intervening occupancy or applicability. `[V]` (`packages/runtime/src/structure.ts:306-314`;
D1714 avoidance fixture)

This directly refutes the living claim that `king_opposition` “never fires in an opening.” `[V]`
(`design/research/campaign-effect-vocabulary.md` §3c) D1717 requires separate semantic research and
versioning; fixing subject identity alone cannot make a blocker-blind opposition fact truthful.

## Live migration matrix after this pass

D1713 now admits the seven valid positives (five local + two sequence constructors), the five local
emitter negatives and two sequence source-predicate negatives. The current matrix is:

- **39/67** emitter positives; 28 without a valid emitter-positive authority;
- **10/67** emitter semantic negatives; 13 further source-only negatives; 44 with neither;
- **7/67** with no valid authority in any measured arm—all seven are the defect-blocked avoidance
  events above; and
- orientation, counterfactual, imported and external counts otherwise unchanged.

`[V]` (`tools/d1713-semantic-validation-matrix/`, D1713 case 3) The mechanically green avoidance
cases are deliberately excluded from those authority counts. A test that proves a bug is
reproducible is a defect witness, not evidence that the advertised chess relation is correct.

## Roadmap consequence

1. D1711 can immediately migrate the five local positive/negative pairs.
2. D1710 must supply a total recorded-path operation before the two sequence negatives can become
   emitter-level validation.
3. D1716's subject/outcome repair precedes validation of every avoidance event.
4. D1717's blocker/applicability research precedes validation of king opposition and its avoidance.
5. No learner module, hint, Review card, bot trait, skill or pack condition may treat the seven
   mechanical avoidance witnesses as semantically validated.

`[M]` This ordering is the practical point of the validation authority: breadth consumers receive
only relations that survive their own negative boundary, not every object the compiler can seal.

## Limits

- The pass proves exact fixture reach and exposes two contract defects; it does not establish every
  future validation arm (orientation/population/external applicability remains the RFC's table).
- The legal-game generator was used only to discover candidate FENs. Final cases are literal,
  deterministic and run through the production selector.
- No RFC, production collector, schema, content, pack or learner-UX byte changed.
