# Avoidance subject identity — family/sign frequency is not an exact avoided outcome

**Question:** Does the current thirteen-family counterfactual-absence selector retain enough
identity to support truthful learner-facing “you avoided …” evidence, and what total grammar would
make it safe?

**Status:** historical research answered `[V]` at 2026-08-26 HEAD for the shipped selector and fixed authored/imported
populations. The current output is useful as broad research prevalence, but not as exact avoidance
evidence. It groups by family/sign, drops same-move subjects, and retains no played/root outcome
join. A successor must enumerate root subjects and typed outcomes before counting moves.

**Instrument:** `tools/d1718-avoidance-subject-harness/`. The opt-in census replays 754 authored
and 579 imported decisions through the actual `selectLocalSemanticEvidence` operation, including
every legal alternative and the experimental policy's top-two cap. Default cases pin the all-family
grammar, the D1716 isolated-pawn counterexample and a twelve-subject same-edge collision.

## What the 2026-08-26 selector measured

`familyKey` is exactly `projection@version:sign`. Alternative events enter one map under that key;
the selector retains at most one event for each `moveUci`, divides those move entries by the number
of legal alternatives and emits a family-level absence when the played edge has no event with the
same family/sign. `[V]` (`packages/runtime/src/semantic-evidence.ts:982-1037`)

That computation can truthfully answer a research question such as “what share of alternatives
had some `isolated_pawn:preserved` transition?” It cannot answer which file/pawn the alternatives
refer to, whether the played child still has the condition elsewhere, or how many subjects within
one alternative supported the outcome. `[V]` (D1718 cases 2–3)

Across the historical policy's selected top two facts, avoidance appears **790 times**: 462 across 754
authored decisions and 328 across 579 imported decisions. Nine of thirteen families appear; the
current fixed populations select zero `half_open_file`, `king_opposition`, `passed_pawn` or
`piece_count` avoidance facts. Zero here is observed reach under this policy/corpus, not proof the
mechanism cannot fire—D1714 has exact mechanical positives for the latter families. `[V]` (D1718
full census; `design/research/semantic-authority-empty-execution.md`)

The policy cap matters: these are facts that survive `maxFacts: 2`, not the complete candidate
population and not chess prevalence. `[V]` (`packages/runtime/src/evidence-catalog.ts:991-998`)

The root-key replay distinguishes two child checks. **Family** means the played child still has at
least one active/retained state in the source family. **Subject** means it has the exact retained
alternative root subject plus predicate parameters; it does not yet assert the same numeric value
or transition relation.

| Family | Authored selected / family / subject | Imported selected / family / subject |
|---|---:|---:|
| `backward_pawn` | 2 / 0 / 0 | 0 / 0 / 0 |
| `doubled_pawn` | 2 / 0 / 0 | 6 / 0 / 0 |
| `half_open_file` | 0 / 0 / 0 | 0 / 0 / 0 |
| `isolated_pawn` | 1 / 1 / 0 | 0 / 0 / 0 |
| `open_file` | 0 / 0 / 0 | 1 / 0 / 0 |
| `king_opposition` | 0 / 0 / 0 | 0 / 0 / 0 |
| `king_zone` | 3 / 0 / 0 | 0 / 0 / 0 |
| `line_blockers` | 173 / 173 / 171 | 91 / 91 / 91 |
| `passed_pawn` | 0 / 0 / 0 | 0 / 0 / 0 |
| `piece_count` | 0 / 0 / 0 | 0 / 0 / 0 |
| `direct_attack_count` | 142 / 125 / 108 | 69 / 69 / 67 |
| `loose_piece` | 133 / 5 / 3 | 156 / 16 / 4 |
| `pawn_islands` | 6 / 6 / 6 | 5 / 5 / 5 |
| **Total** | **462 / 310 / 288** | **328 / 181 / 167** |

`[V]` (D1718 frozen baseline). Combined, 491/790 selected facts retain the broad family and
455/790 retain the exact condition key. **Thirty-six** retain the family only on another subject,
the measured generic-wording collision class. The 455 exact-key cases are not automatically
wrong: the played value/relation may differ truthfully. They prove why an id alone is still
insufficient and both child values must be retained. Numeric families such as blocker count and
pawn-island count naturally retain their subject while changing value. `[M]`

## The two distinct identity failures

### 1. The played child is never joined to the selected subject

On the exact authored `a4b5` edge from
`r1b1r1k1/1p4pp/2p1pq2/1p1p4/P2P4/2QBP3/5PPP/1R3RK1 w - - 0 19`, the move removes White's
a-file isolated-pawn state and creates one on the b-file. All 41 alternatives preserve the a-file
state. The selector emits generic `derived.semantic_avoidance.isolated_pawn@1`; it carries no
subject or played value. `[V]` (D1718 case 2; D1714 case 4)

The exact subject-specific fact is potentially useful: “41/41 alternatives preserved the a-file
isolation; your move removed it.” The current generic reading “you avoided an isolated pawn” is
false because the b-file condition exists in the played child. The repair is therefore not to drop
negative evidence; it is to retain the root subject and both outcomes. `[M]`

### 2. Subjects are discarded before the receipt is built

The legal edge `d4c5` from
`rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4` emits twelve distinct
`direct_attack_count:preserved` observations, over twelve controller-color/target-square subjects.
All share one family/sign/move key. The selector's `values.some(candidate.anchor.moveUci ===
event.anchor.moveUci)` keeps one and discards eleven before `alternativeEvents` is sealed. `[V]`
(D1718 case 3; `semantic-evidence.ts:1008-1014`)

Consequently, filtering the retained `alternativeEvents` by a newly added subject field cannot
repair `@1`: the missing same-move subjects and their denominators are already gone. Grouping must
be subject-first, with distinct supporting moves counted afterward. `[M]`

## Total subject/outcome grammar

An avoidance relation needs three separate identities: a root subject, a predicate/value over that
subject, and a transition relation from the common root into each child. Family and sign are only
the outer projection and relation class. `[M]`

| Family | Root subject | Predicate/value | Honest maximum claim |
|---|---|---|---|
| `backward_pawn` | color + file | boolean file state | named color/file state changed or persisted |
| `doubled_pawn` | color + file | boolean file state | named color/file state changed or persisted |
| `half_open_file` | color + file | boolean file state | named color/file state changed or persisted |
| `isolated_pawn` | color + file | boolean file state | named file state—not “this pawn” |
| `open_file` | file | boolean file state | named file state |
| `king_opposition` | the two color kings | controlling color + form + applicability + boolean relation | held pending D1717's source repair |
| `king_zone` | color king | zone parameter + membership | same king across child squares |
| `line_blockers` | root slider + ray direction | integer blocker count | count change on that slider/ray |
| `passed_pawn` | color + root pawn | boolean passed state | same pawn across child squares |
| `piece_count` | color + role | integer count | literal material-count relation; no valence |
| `direct_attack_count` | controller color + fixed target square | integer count | square/count only—not a stable target piece |
| `loose_piece` | color + role + root piece | boolean en-prise state | same piece across child squares |
| `pawn_islands` | color | integer island count | literal color/count relation |

`[V]` for current operand availability and event arithmetic
(`packages/runtime/src/semantic-evidence.ts:106-139,325-405`;
`packages/runtime/src/tactics.ts:340-467`); `[M]` for the successor grammar.

For booleans, the complete state transition distinguishes false→true, true→false and true→true.
For integer measures it distinguishes increase, decrease and equality. A transition event alone is
not a total state vector: event absence may mean false, zero, unchanged, unavailable or merely not
emitted, depending on the family. The successor therefore evaluates one declared state function
over the root, played child and every alternative child. `[M]`

## Perspective is not valence

Color and role are part of factual identity. If White moves and an alternative decreases Black's
queen count, the factual relation is an alternative capture White did not make; it is not “White
avoided losing a queen.” Likewise, avoiding a gained backward pawn and avoiding a lost passed pawn
have different practical directions, but neither receives praise or a move grade from the
selector. `[M]`

The derived fact must retain mover/root perspective for a later consumer-specific renderer. That
renderer may state the literal relation within its assistance ceiling; any favorable/unfavorable
claim still needs a separate admitted authority. This preserves ADR-0005/law 8. `[M]`

## Versioning and execution consequence

The `@1` payload's declared operands are only relation, family/sign, legal denominator, broad-family
numerator and the truncated alternative event list. Adding a subject and changing the denominator
would change its meaning. The safe migration is new `derived.semantic_avoidance.*@2` identities,
with `@1` retained as research-only until retired. `[V]` (current adapter at
`packages/runtime/src/evidence-source-adapters.ts:249-254`); `[M]` (versioning consequence)

The successor must:

1. enumerate a declared root-subject domain;
2. evaluate typed root/played/alternative values, abstaining on any incomplete required child;
3. group exact subject + predicate parameters + relation before distinct-move counting;
4. retain complete supporting move/source receipts and both root/played values;
5. keep family/sign prevalence under a separately named research aggregate; and
6. remain research-only until D1711 validates the exact outcome and D1710 emits it through a live
   production operation.

`[M]` The executable author contract is
`planning/evidence-foundation-ux/avoidance-subject-author-repair-2026-08-26.md`.

## Limits

- The census measures selected output under one experimental policy and two fixed populations; it
  does not estimate universal frequency or usefulness.
- Current payloads cannot reconstruct all root subjects after selection. The harness projects the
  strongest root identity available from exact edge operands; the successor contract requires the
  producer to make that identity explicit.
- No external chess label is needed to establish these data-loss defects. Whether a source
  predicate such as opposition is good chess semantics remains separate research.
- No production, RFC, schema, content, pack or learner-UX byte changed.

## 2026-11-04 current-source revalidation

The old selected witness cannot be repeated unchanged. At the original authored a4b5 root,
the current full events-scope packet has41 legal alternatives and40 evaluated alternatives.
The exact unavailable row is d3h7: derived.tactic.defender_exposure@2 / invalid_turn_clone.
The actual selector returns counterfactual_population_incomplete and no selected facts.
The played child still has White b-file isolation and no a-file isolation. This is a real
current availability guard, not a subject-identity repair. `[V]` (`tools/d1718-avoidance-subject-harness/avoidance-subject.test.ts`, historical-root case)

Removing only the d3 bishop produces a disposable mechanical variant with34/34 complete
alternatives. A call-through observer retains the actual sealed isolated-pawn avoidance
factory output:34 distinct moves all preserve White a-file isolation, while a4b5 leaves
White b-file isolation. The payload still lacks a played subject/outcome join. This issued
candidate is eligible but not selected: its exact reconstructed event id appears in the
real rejected set and the two selected facts are played_event values. No factory argument,
return, policy or eligibility is replaced. This establishes the current candidate-stage
identity defect, not current learner exposure. `[V]` (same instrument, complete-variant case;
`packages/runtime/src/semantic-evidence.ts`, selectSemanticEvidence)

The actual d4c5 source still emits12 distinct direct-attack subjects for one family/sign/edge;
current byFamily logic retains at most one event per move before sealing alternativeEvents.
Subject-first counting remains necessary. The frozen790/754/579 census is historical, not a
current prevalence reading. Set-equal13 grammar keys alone do not validate current source
values/domains/availability. `[V]` (same instrument, same-edge and frozen-receipt cases;
`packages/runtime/src/semantic-evidence.ts`, familyKey/selectSemanticEvidence)

Normal `make avoidance-subject-measurement` strictly typechecks, then passes5 cases with the
expensive full-census case explicitly skipped (41571,1.90s). Earlier historical selected
assertions failed against the current incomplete root and the variant's actual cap loss;
they were replaced with the two separately pinned stages, not relaxed into success. No
production fix, accepted successor contract, qualification or full current13-source gate
is claimed. Independent review requested exact rejection/eligibility identity before cap
attribution; those assertions now pass. `[V]` (instrument; existing independent review receipt)

## 2026-11-04 source ABI, domain and availability audit

This section reads the current producers, not the unimplemented successor described above.
The eleven structural sources are `rules.structural.event.<family>@1`, with exact edge fields
`before_fen`, `move_uci`, `after_fen`, `family`, and nullable `before`/`after`
`StructuralObservation` values. Observations are a broad interface with optional dimensions;
the producer, not that TypeScript interface alone, establishes the family-specific shape.
Its private join includes kind, present color/role/file/shade/form/zone, and squares (except
king-zone squares). Sign is absent→present gained, present→absent lost, otherwise count
increase/decrease or preserved. The two other source ABIs are listed separately below. `[V]`
(`packages/runtime/src/semantic-evidence.ts`, StructuralSemanticEventOperands,
structuralSubject, structuralEventSign, structuralSemanticEventPayloads)

| Family | Current emitted value and domain | Consequence for exact root/played/alternative comparison |
|---|---|---|
| backward_pawn | Positive color/file observation; any pawn on that file satisfying the registered support/stop-control predicate | File boolean is evaluable for all16 color/files, but does not identify a pawn. The separate draft backward-pawn successor is pawn-based and cannot be silently substituted. |
| doubled_pawn | Positive color/file observation for at least two own pawns | File boolean across16 subjects; retain actual membership if wording names pawns. |
| isolated_pawn | Positive color/file observation with own pawn(s) and no own pawn on neighboring files | File boolean across16 subjects. Removing isolation on a-file does not imply no isolation elsewhere. |
| half_open_file | Positive color/file observation with no own pawn and at least one opposing pawn | File boolean across16 subjects; fully open is false for this predicate. |
| open_file | Positive file observation with no pawn of either color; no color field | Boolean across8 files; do not invent a perspective-colored source identity. |
| king_opposition | Positive color/form with both king squares sorted; only side-to-move opponent of color qualifies; orthogonal direct/distant gaps | The current predicate ignores intervening occupancy. Its truth must not be upgraded to unobstructed opposition. The independently required source successor remains unavailable. |
| king_zone | Positive color/zone with actual king square, zones edge/corner | Four color/zone subjects; moving within a zone retains identity and changes square. Absence is false only after a valid king/position is established. |
| line_blockers | Each eligible bishop/rook/queen ray with nonempty strict interior; squares are slider and board-edge endpoint; integer occupied-interior count including zero; no color/role fields | Root board must supply original slider identity and direction. Old events split moved sliders into lost/gained square subjects. The board-edge endpoint is excluded from count and is not a tactical target. Missing ray after capture/promotion/short edge is not integer zero. |
| passed_pawn | Positive color/square observation under the no-opposing-pawn-ahead-on-adjacent-files predicate | Root pawn identity requires exact legal relocation. Old square-key events split an advance into lost/gained. Promotion/removal needs a declared disposition, not false pawn weakness. |
| piece_count | All12 color/role integer rows, including zero; empty squares | Total count over12 subjects; color/role is factual identity. No automatic favorable/unfavorable interpretation. |
| direct_attack_count | Positive integer pseudo-attack counts for each color, but emitted only at occupied non-pawn squares; no target piece identity | Sparse omission is not zero: empty and pawn targets are omitted even when count is positive. A fixed-square state query can evaluate all64 squares, but this is broader than current reading emission and needs an explicit new source contract. |
| loose_piece | `rules.tactic.event.loose_piece@1`: mover-color non-king pieces only; exact camelCase edge, color plus original/current square and role, full before/after loose states, gained/lost/preserved enPrise relation | Opponent pieces and kings are outside this event domain. Original-piece join uses physical relocations including both castling pieces. Both-false emits no event. Invalid turn-clone returns unavailable, not false; full root-piece state needs actual readings and availability. Promotion changes role and must retain the root piece explicitly. |
| pawn_islands | `rules.structural.event.pawn_islands@1`: exact snake_case edge, family/color and numeric before/after; always one row per color, including zero and equality | Two total color/count subjects. Count differences say nothing by themselves about structural quality. |

`[V]` for this entire current-source table: `packages/runtime/src/structure.ts`,
computeStructuralReading, matchesStructuralFeature and their private predicates;
`packages/runtime/src/semantic-evidence.ts`, structural/pawnIsland/loosePieceSemanticEvents;
`packages/runtime/src/tactics.ts`, pieceRelocations, loosePieceReadingForColor, loosePieceEvents;
`packages/runtime/src/evidence-factories.ts`, createRulesStructuralEventPawnIslandsV1Evidence.
The differing intended successors remain **draft**, not alternate live sources:
`rfc/foundation-source-identity.md` §§3.1–3.4 and its lifecycle row in `rfc/README.md`.

The disposable `current-source-abi.test.ts` supplies twelve independently expected controls
covering all thirteen families: five file predicates with explicit positive/negative files;
material zeros plus both island colors/zero/equality; sparse attack omission versus actual
positive/zero queries; strict-interior ray endpoint and moving-slider subject split;
passed-pawn advance split; moving king-zone identity plus blocked historical opposition;
and in-check loose-piece unavailability plus an available mover-only/non-king preserved event and both-false omission. These test source boundaries, not external chess
quality or usefulness, complete branch search, consumer delivery or every identity lifecycle.
`[V]` (instrument and cited producer operations)

### Requirements established before successor authoring

The complete source inventory is now mapped, but a generic adapter over emitted events cannot
supply the required total child values. At minimum the successor contract must explicitly choose
its source version, finite subject domain, exact state evaluator and unsupported/removed cases
per family; require every legal child for the denominator; and retain multiple subjects from one
move before counting distinct moves. Captured, promoted, absent, inapplicable and unavailable
are different cases. Incomplete evidence must not shrink the denominator or yield a reassuring
negative claim. These are contract requirements inferred from the verified ABI boundaries,
not production behavior added by this pass. `[M]`

Opposition cannot be made correct by a subject-only adapter over the current blocked-line
predicate. Backward-pawn file state cannot satisfy a contract naming a specific pawn without
the pawn-based source. Ray and passed-pawn subjects require the same exact physical relocation
rules already used by legal chess operations, including castling and en passant; raw UCI slices
are insufficient as a universal identity function. Source-version/dependency choices must be
reviewed together with the avoidance successor. No legacy input pipeline is required for new
learner flows; frozen evidence identities still cannot be reinterpreted in place. `[M]`

Independent review identified the mover-only/non-king restriction as an omitted loose-piece
domain boundary. The table now states it explicitly. A real available preserved rook event
pins exact edge, original/current role/square and both enPrise values; a safe-rook counterpart
returns an available empty list, distinct from the unavailable in-check case. Final normal
26463 strictly typechecks and passes17 tests/two files1.80s, with one explicit expensive-census
skip. `[V]` (instrument; `planning/learner-modules/compiler2-independent-review-2026-11-02.md`)

The corrected thirteen-source study is independently accepted for successor authoring only.
The reviewer checked the source table and the finite domain correction; final26463 results
were reported by the main agent. Source versions, root-piece lifecycle rules, full legal
denominators and still-draft foundation dependencies must be explicit in the successor.
No implementation, source qualification or learner delivery is accepted by this research
review. `[V]` (`planning/learner-modules/compiler2-independent-review-2026-11-02.md`,
current thirteen-source acceptance)

## Current predecessor contract audit — 2026-11-04

Fresh review of the source dependency found a stale blanket registry block: the52-member core
and per-value receipt mechanism are implemented. Independent review accepts correcting that
status and reserving the exact twelve source-definition members (D4065); it does not accept
the full source RFC. The actual current detailed king-opposition/backward reading@2 factories
already mint original-semantics payloads. Reusing those identities for unobstructed/per-pawn
semantics would be invalid. A real live-manifest/sole-route audit fails on exactly those two
collisions; the proposed readings now move to@3. The old@2 outputs remain pinned unchanged.
All28 proposed refs (23 sources and five explicitly required authored-predicate companions)
are absent from the current declaration/route sets. `[V]` (current-source-abi.test.ts D4067
controls; rfc/foundation-source-identity.md; existing independent review receipt)

The same current internal predicate@1 factory accepts an extra future conventionRef while
still applying legacy blocker-blind truth. This does not prove a learner/API schema accepts
it; it proves why schema-only convention discrimination cannot safely dispatch an authored
condition. Source convention closure, exact kind/ref dispatch, outpost challenge semantics and
physical event joins require the coherent author repair under D4066/D4068–D4070. That repair
is drafted, not accepted or implemented. Final normal72719 runs strict types,20 research tests
with one explicit expensive-census skip1.79s,11 historical author controls and current register
C1-C8. These are authoring/identity facts, not a new detector or semantic qualification. `[V]`
(same instrument and primary source paths; rfc/foundation-source-identity.md §§2.1,3,4)

## Complete sources suppressed by an unrelated abstention — 2026-11-10 (D4200)

`[V]` Disposable `make counterfactual-availability-probe` strictly typechecks and passes its
single measurement. The original WIDE population for `k7/8/8/8/8/1p6/PP6/R6K w - - 0 1`
has12 legal members. `a2b3` captures the pawn and exposes the a-file rook check; its exact child
is `k7/8/8/8/8/1P6/1P6/R6K b - - 0 1`. All13 original positions retain declared legal,
connectivity, group, file-state and12 count inputs. Nevertheless all seven probed outcome
families (doubled, isolated, open, half-open, islands, count and loose-piece) return unavailable.
The only canonical abstention is `derived.tactic.defender_exposure@2: invalid_turn_clone` on
`a2b3`. There are **zero** unavailable risk positions in this witness; a risk-source failure
is not its cause. Evidence: `tools/d1718-avoidance-subject-harness/availability.test.ts` and
its explicit `tsconfig.availability.json`; actual source dispatch in
`packages/runtime/src/semantic-subject-outcomes.ts::computeSubjectOutcomes`.

`[V]` This follows the accepted blanket refusal in `rfc/subject-safe-semantic-selection.md`
§5.1 and the whole-packet refusal in `packages/runtime/src/semantic-evidence.ts`; it is a
conservative policy limitation, not an implementation violating that contract. The probe adds
no production policy or qualification. The older research harness has obsolete ABI types;
the new target typechecks this current probe explicitly rather than claiming the older census
has been revalidated. D4200 owns a separately reviewed source-local availability contract.
Any successor must retain all legal alternatives, distinguish absent/false/unavailable states,
and declare selection omissions. It may not invent a zero or quietly drop an inconvenient child.


## Independent pawn/file outcome qualification — 2026-11-10

`[V]` The actual canonical operation executes all590 independently literal pawn/file propositions
for doubled/isolated/open/half-open/island subjects. Generation passes1470/1470cases over89roots,
with17qualified subjects (previous12 plus exactly these five). Exact source/profile joins and
real value admission go from10failures plus929passing controls before integration to939passes
in40.33s after generation. Copy refusal and both ordinary2 support consumers' empty views are
executed; qualification is not a learner delivery binding. Evidence:
`packages/runtime/src/semantic-validation-pawn-outcome.test.ts`, its cited source definitions,
`semantic-validation-cases.json`, `semantic-validation-profiles.json` and generated receipt.

`[V]` An executed before/after comparison retains all880 predecessor parsed values/order;
only the five profiles' four case cells change, while the other84profiles remain identical.
The source/profiles and historical controls are independently reviewed. The case document is
ordinary schema1 JSON, one complete case per line,4656038bytes; the receipt is5193569bytes,
both below the unchanged5242880byte source limit. Formatting changes the raw case-text digest;
the actual writer regenerates the receipt rather than reusing a previous hash. Frozen875
historical cases and51retired cases retain their existing helper/meaning. Source: canonical
writer `tools/semantic-validation-build.ts`; storage guard `tools/git-size-check.mjs`; four
historical source suites; independent compiler2 review receipt. Full integration gates are
separate from this measured qualification. Seven other outcome families, D4200 and ordinary26
remain open.

## Coordinated availability boundary — 2026-11-10 D4200 read-only review

`[V]` Source-local availability alone does not finish the handoff. The current calculator
checks every row's canonical abstentions before reading its finite `familyInputs` vectors.
The selector refuses once for any row abstention and again for any unavailable one of the
13 outcome families. Native incidence has its own blanket refusal. Finally the Profile
composer returns whole-population unavailable if native or any condition family is unavailable,
also discarding its later prevalence population. Sources:
`packages/runtime/src/semantic-subject-outcomes.ts::computeSubjectOutcomes`;
`packages/runtime/src/semantic-evidence.ts::selectSemanticEvidence`;
`packages/runtime/src/internal/longitudinal-native-incidence.ts::nativeSubjectIncidences`;
`packages/runtime/src/internal/profile-subject-facts.ts::collectProfileSubjectPopulation`.
Independent reviewer inspected these paths without editing or running new experiments.

`[V]` The original candidate owner already retains sealed collector outcomes joined to exact
row/ref/reason identities. The closed current abstention vocabulary is legacy
`rules.tactic.event.loose_piece@1` and `derived.tactic.defender_exposure@2`, both for
`invalid_turn_clone`. Neither name establishes failure of the newer mover-risk source: the
actual12-move witness above has zero unavailable risk positions. Existing exact root/every-child
source vectors and owner-issued outcomes should be reused; no second source registry or issuer
is needed. Sources: `packages/runtime/src/candidate-population.ts` and the strict availability
probe cited above. Any future unknown abstention must remain fail-closed unless independently
specified, and genuine required-source unavailability must never become false/zero.

`[V]` Current `EvidenceSelectionResult` has only one evaluated-alternative count and optional
empty reason. Current stored subject decision availability is complete/unavailable under the
whole54 contract. Prevalence includes both named legacy tactical projections, so it cannot
silently treat missing events as nonoccurrence. Sources:
`packages/runtime/src/semantic-evidence.ts::EvidenceSelectionResult`;
`packages/runtime/src/profile-subject-sources.ts`;
`packages/runtime/src/semantic-played-types.ts`;
`rfc/longitudinal-store.md` §A.2.5a.

D4200 authoring must therefore specify complete-versus-unknown coverage through selection and
history, preserving all legal alternatives and distinguishing known empty from unavailable.
For full partial-family history, pin durable coverage, opportunity denominators, parsing/proof,
rebuild and revision/storage consequences together. Keeping today's whole-population refusal
is conservative but does not deliver that expanded reach. This review changes no production
policy, source qualification, stored data or learner availability.

### Required-risk counter-control, 2026-11-10

`[V]` The expanded existing strict probe also measures the legal checked-king root
`7k/8/8/8/8/8/8/r6K w - - 0 1`. Its exact legal moves are h1g2 and h1h2. All three original
positions retain authentic arithmetic sources; the original root-risk result is genuinely
unavailable/invalid_turn_clone, while both child-risk results are available with empty own-piece
lists. The current loose_piece2 outcome correctly remains unavailable. Thus an empty physical
domain or healthy children cannot be used to invent a missing required root result. Source:
`tools/d1718-avoidance-subject-harness/availability.test.ts`; actual normal
`make counterfactual-availability-probe` typechecks and passes both controls in1.66s. The original
12-move unrelated-defender witness is unchanged. This is research, not a production-policy change.

### D4210 — one-edge coverage overstates recorded-trade acquisition, 2026-11-10

`[V]` After source-local selection landed in d449e3c8, the selector declares
`derived.exchange.trade_completed@1` available although its one-edge population never invokes
that factory. The existing strict disposable probe now spies on actual evidence-route calls:
from `4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1`, playing e4d5 and its color-mirrored
equivalent each yields seven legal members, empty unavailable coverage, a declared trade source,
zero trade acquisitions, and actual capture-class acquisition. A separate genuine recorded
e4d5/e6d5 window has two authenticated edges and emits one declared trade per color through
`derived.exchange.trade_completed@2`. The first probe draft guessed @3; strict typechecking
rejected it, and the executed positive uses the existing @2 route. Source:
`tools/d1718-avoidance-subject-harness/availability.test.ts`; normal
`make counterfactual-availability-probe` passes four tests in one file (1.61s).

`[V]` Independent read-only review confirms the scope mismatch: `localSemanticEventClosure`
uses `derivedExchangeSemanticEvents` (legal-exchange/capture-class), whereas the separate
`tradeCompletedSemanticEvent` needs two captures and two recorded move anchors. Profile already
excludes trade from its prevalence sources. Sources:
`packages/runtime/src/evidence-factories.ts`, `semantic-played-types.ts`,
`profile-subject-sources.ts`; `rfc/subject-safe-semantic-selection.md` §6.

The bounded correction requires a reviewed follow-up: exclude this unacquired recorded relation
from one-edge completeness while preserving actual recorded-trade support and every legal
alternative. This finding changes neither production code nor qualification. Earlier dated
whole-population observations above describe the predecessor; current selector coverage landed
in d449e3c8, but durable Profile availability remains open under D4200. The current complete
software run has separately reported a repository-reader census failure and is not a green
certificate for that selector change.

`[V]` After independent follow-up acceptance, the generator's exchange group and played-mode
map remove only trade1. Actual generated local41 and selector54 match the unchanged immutable
ingest registry/Profile sets; global recorded support remains. Focused177/five, module/store44/two,
historical-boundary10/two, strict probe4, scheduling9 and types pass. Fresh canonical generation
passes1470/1470 with89 subjects/17qualified,63 population receipts/eight external receipts. Parsed
before/after comparison preserves every case outcome/order, target operands/payload/source
digests, all verdicts, population values and external receipts. Changed metadata is1056 target
input digests across584cases plus population predicate implementation digests. Source cases,
profiles and immutable v3 registry bytes remain unchanged. Sources: actual canonical writer and
its generated receipt; `one-edge-collector-closure.md`; the cited runtime tests. The fresh whole
software gate remains required; these checks do not discharge D4200 history or widen qualification.
