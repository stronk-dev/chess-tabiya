# Evidence foundation closure at 2026-08-31 HEAD

**Question.** Does the current evidence foundation contain the breadth required by the full 1.0
promise, and where does each incomplete family actually stop: chess predicate, source identity,
value authority, production operation, consumer binding, or validation?

**Verdict.** `[V]` The declared 1.0 chess-fact basis is broad and has no remaining *unknown*
collector-research family, but the production foundation is not complete. Fourteen of thirty
declared source families are landed, seven require versioned source repair, and nine have complete
research/specification but no landed source. The compiled manifest contains 37 producers and 193
projections, yet all 67 semantic projections still stop before a live application operation. Only
39 of those 67 have an event-level positive authority and ten have an event-level semantic
negative. Five non-retired projections have no current value-mint route, and 33 projections have
no current consumer binding. `[V]`

This means overload, deflection, clearance, mating nets, forks, pins, square control, castling,
promotion pressure, pawn structures, activity operands and opening identity are not an invitation
to write another list of detector names. The next work is to finish and activate the evidence
already researched: source/version repair, exact value factories, provider receipts, validation,
recorded/live execution and consumer-specific module bindings.

## Method

The audit joins four independent executable authorities rather than treating catalogue membership
as product reach:

1. `FOUNDATION_CAPABILITY_RECEIPTS` closes the declared 1.0 source-family basis and assigns each
   family exactly one source state and research authority. `[V]`
   (`tools/d1737-source-identity-closeout/registry.ts`)
2. the compiled F1 manifest supplies producer, projection, consumer and binding identity. `[V]`
   (`packages/runtime/src/evidence-catalog.ts`; `make evidence-manifest-check`)
3. the value-route receipt joins every current production mint route to its projection, use sites
   and required successor action. `[V]`
   (`planning/evidence-foundation-ux/evidence-value-authority-route-map.json`;
   `make evidence-value-authority-route-map`)
4. the execution and validation matrices independently test whether semantic helpers reach a live
   operation and whether their claims have event-level positives/negatives. `[V]`
   (`tools/d1710-producer-execution-harness/producer-execution.test.ts`;
   `tools/d1713-semantic-validation-matrix/validation-matrix.test.ts`)

The combined command is now `make foundation-closure-check`. It runs the manifest, value-route,
source-identity, validation and production-execution checks through the repository's pinned
toolchain. The 2026-08-31 run passed on manifest digest
`eb36f05e25a007f036e750c8555a7ebd032443c3b720d8888ceeb1f8dc1cb6be`. `[V]`

## 1. Source-family readiness

| Source state | Count | Exact families | Meaning |
|---|---:|---|---|
| Landed source | 14 | board legality/terminal; legal mobility; square control; exchange/material; loose/trapped pieces; pins/skewers/x-rays; forks; discovery/clearance/interference; defender/overload/deflection/attraction/zwischenzug; pawn contacts/passers; development/rook seventh; castling; check/mating nets; opening identity | The source identity exists. Consumer reach and validation may still be incomplete. |
| Versioned repair required | 7 | isolated/doubled pawn identity; backward pawn; pawn islands/chains; space/denial/outpost; king zone/shelter/opposition; subject-safe avoidance; named-structure identity | The computation exists, but its current payload/source identity is too weak or semantically mixed for the promised consumer. |
| Specified source not landed | 9 | file state/access; promotion race/tablebase; cited-theory applicability; engine/tablebase receipts; Maia policy receipt; Explorer population receipt; bounded named-target policy; style atoms; variant rules identity | Research has named the exact source contract and owner, but production cannot yet emit the promised authority. |

`[V]` These thirty rows and the 14/7/9 partition are set-equal in
`tools/d1737-source-identity-closeout/registry.ts`; its five-arm test also requires exactly one
living execution owner for all sixteen non-landed families. The closure is for the declared 1.0
basis, not a claim that chess has a finite ontology.

### What is and is not “missing evidence”

- `[V]` **Not missing as chess predicates:** overload exploitation, deflection observed,
  attraction observed, line/square clearance, interference, zwischenzug, complete-reply mate proof
  through four attacker moves, exact defender duties, forks, pins, skewers, discovered attacks,
  castling rights, pawn structures, contacts, passers, space operands and exact legal mobility.
- `[V]` **Missing as safe production sources:** the nine unlanded families above. Several reuse
  working provider clients or rule functions, but the required same-subject receipt/value factory
  is not production code yet; “the function can compute it” is not source closure.
- `[V]` **Unsafe without repair:** the seven version-repair families. Rendering their current v1
  payloads as if they were the future exact source would preserve the very ambiguity the evidence
  architecture was introduced to remove.
- `[V]` **Not a local-detector problem:** “good trade,” “weak square,” “kingside attack,” “strike
  at the centre,” “bad bishop,” plan/purpose and personalized advice. These require an explicit
  join to engine outcome, cited theory, authored truth, bounded opponent policy or longitudinal
  opportunity evidence. A geometry loop must not manufacture that judgement.

## 2. Catalogue reach is not execution reach

The current manifest reports **37 producers / 193 projections / 25 consumers / 210 bindings** and
**67 semantic events / 67 eligibility rows / 15 reasons / 1 research selection policy**. `[V]`
(`make evidence-manifest-check semantic-evidence-check`)

The projection population then splits as follows: `[V]`

| Current binding class | Count | Consequence |
|---|---:|---|
| current consumer | 93 | A declared current consumer accepts the projection; this does not prove a learner-facing workflow. |
| research-only semantic selection | 67 | Eligible only for the research selector; none reaches a live application operation. |
| experimental-only | 0 | No projection is saved by a separate experimental binding class. |
| unbound | 33 | 30 inspector-only, 2 experimental, 1 retired; no current consumer accepts them. |

The 67 semantic projections terminate at **45 selector-only roots, 11 unused candidate-helper
roots, and 11 isolated sequence-helper roots**. Production source scanning finds no live caller of
`candidateFeatureVector`, no live caller of the selector outside the verification command, and no
non-test integration caller for the multi-edge/semantic helpers named in the execution audit.
`[V]` (`tools/d1710-producer-execution-harness/producer-execution.test.ts`)

This is the dominant foundation gap. Implementing another semantic helper without the shared
candidate operation or recorded-path compiler increases catalogue breadth while leaving Support,
Review, bots, drills and longitudinal analysis unchanged.

## 3. Value construction gaps

The route receipt accounts for **191 production mint routes over 187 distinct projections**. It
finds 184 used routes, seven unused route rows representing five projections, and zero bound
projections without a production use. Six manifest projections have no route at all. `[V]`
(`planning/evidence-foundation-ux/evidence-value-authority-route-map.json`)

| No-route projection | Required disposition |
|---|---|
| `derived.grade.move_quality@1` | add a value factory and profile before binding |
| `derived.opening.deepest_reached@1` | add a value factory and profile before binding |
| `run.record.position@1` | add a value factory and profile before binding |
| `theory.opening.catalogue_membership@1` | add a value factory and profile before binding |
| `theory.opening.current_endpoint@1` | add a value factory and profile before binding |
| `rules.structural.reading.pawn_count@1` | remain factoryless because it is retired |

The five projections with routes but no production use are
`derived.tactic.overloaded_defender_response_conflict@1`, `human.maia.candidate_wdl@1`,
`rules.mobility.reading.legal_moves@1`, `rules.tactic.consequence.forced_mate_after_move@1`, and
`rules.tactic.reading.defender_duty_set@1`. `[V]` They are concrete examples of computed or
declared evidence that cannot be counted as a product capability merely because a factory exists.

## 4. Validation gaps

The independent 67-event matrix currently reports: `[V]`

| Validation arm | Event-level coverage |
|---|---:|
| positive | 39 / 67 |
| semantic hard negative | 10 / 67 |
| orientation/mirror | 0 / 67 |
| counterfactual | 1 / 67 |
| imported observation | 23 / 67 |
| external comparison | 8 / 67 |

Thirteen additional negatives exist only at a lower source/composition layer. Seven avoidance
events have no valid authority at any layer: half-open file, isolated pawn, king opposition, king
zone, passed pawn, piece count and pawn islands. `[V]`
(`make semantic-validation-matrix`)

This does not imply those seven underlying board predicates are absent. It means the *avoidance
claim* has not earned production authority. The subject-safe avoidance successor and independent
validation must land before a module says the learner avoided or prevented the condition.

## 5. Correct dependency order

The current bottom-up order is:

1. land the shared-resource/register prerequisites that let evidence authorities claim versions
   without another hand-maintained register;
2. land semantic convention/source repairs and the value-authority factories, including the five
   non-retired no-route projections;
3. land provider exchange receipts and the remaining nine specified sources;
4. land semantic validation and withhold every event whose required profile is incomplete;
5. land the shared candidate operation and recorded semantic path so local and multi-edge facts
   reach real application operations;
6. regenerate consumer/module requirements against the final successor projections;
7. only then compose presets and the board-protecting Play/Review UX, with raw primitives kept in
   Advanced Inspector;
8. bind the same evidence to bot policy, Campaign, drills and longitudinal storage without giving
   any of them a private classifier fork.

This order still allows independent RFC review and unrelated implementation in parallel. It does
not allow a later layer to invent an earlier layer's identity, value, validation or subject join.

## 6. Decision for the next work wave

Do **not** open a generic “more chess detectors” wave. The next evidence wave should close the
existing source→value→operation→validation chain and treat these as explicit release blockers:

- 7 versioned source repairs;
- 9 specified-but-unlanded source families;
- 5 non-retired projections with no value route;
- 5 routed projections with no production use;
- 67 semantic projections with no live application operation;
- 28/67 missing event positives and 57/67 missing event semantic negatives;
- 33 projections without a current consumer binding.

New collector research becomes lawful only when a concrete 1.0 module/bot/Review/theory/style need
cannot be composed from the closed source basis and records the exact missing operand. That keeps
the platform extensible without turning every newly named chess concept into another noisy raw
string.

## Limits

- `[V]` The audit proves source, route, operation, binding and validation reach. It does not prove
  learner usefulness; owner-use of the composed modules/presets remains required.
- `[V]` A current consumer may be Inspector, verification or another low-level surface. The 93
  count must not be presented as 93 learner-ready facts.
- `[V]` The source-family registry is an explicit 1.0 basis. Later concepts may be added through
  the same contract; its closure is not an ontology freeze.
- `[M]` The most useful future breadth will probably be composed questions over exact atoms rather
  than additional single-position labels. That hypothesis must be evaluated per consumer rather
  than promoted to chess truth.

## 2026-11-04 — actual authored scan cost and current firing migration (D4082–D4084)

`[V]` The current source implementation and its remaining obligations are recorded in
`planning/foundation-source-identity/plan.md`; the original census above is historical. The
next actual consumer migration exposes a contract conflict: F2 §2.4a fixes firing2 to the
legacy `shapeFirings` algorithm and document-only receipts, whereas foundation §4.2 requires
the owned current predicate visitor. Changing firing2's generated dependencies in place is
not a valid successor. The actual callers include Inspector, service recommendations and
DrillScreen's client-side `shapeFiringEvidence`, not merely the registered factory.
Sources: `rfc/evidence-value-authority.md` §2.4a,
`rfc/foundation-source-identity.md` §4.2, `packages/runtime/src/shape-firing.ts`,
`apps/server/src/service.ts#shapeRecommendations`, `apps/web/src/lib/DrillScreen.svelte`.

`[V]` Disposable `tools/d4082-shape-firing/measure.ts` measures all 25 actual registered
triggers on legal prefixes of the existing 85-ply
`apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.pgn`. Commands use the normal pinned
toolchain: `make foundation-shape-firing-measurement`,
`make foundation-shape-firing-profile` and
`make foundation-shape-firing-captured-measurement`. The last command runs a fresh process,
times the full captured-only scan before computing its legacy reference, and retains every
original visitor population including negatives. It issues no firing3 values and supplies no
API/UI. Measurements below are local Node v24.22.1, macOS arm64, on this one game; they are
neither endpoint latency budgets nor population, learner-usefulness or qualification evidence.

| Actual implementation measured | Prefix positions | Completed cells | Scan time | Exact legacy interval parity |
|---|---:|---:|---:|---|
| Initial aggregate2 per cell | 1 | 25/25 | 484.48 ms | yes |
| Initial aggregate2 per cell | 32 | 800/800 | 15,013.17 ms | yes |
| Initial aggregate2 per cell | 64 | 1,600/1,600 | 24,617.26 ms | yes |
| Initial aggregate2 per cell | 86 | 1,953/2,150 | 30,004.53 ms; stopped at instrument bound | unmeasured |
| Immutable projection-plan reuse | 86 | 2,150/2,150 | 7,673.23 ms | yes |
| Plan plus immutable source/proof byte verification reuse | 86 | 2,150/2,150 | 2,880.57 ms | yes |
| Disposable shared-root/original-capture prototype, fresh process, with registry equivalence reuse | 86 | 2,150/2,150 | 424.20 ms | yes |

`[V]` Scoped CPU profiles identified repeated compiler work, followed by repeated source/proof
hashing. The fixes reuse only already verified immutable bytes/plans. Original source/record
membership, exact object identity, current registry state, reduction bindings and live callable
checks still run; mutable/shallow/opaque objects retain full comparison. Registry admission
and capture in the last fresh process took 189.84 ms and 80.62 ms respectively, outside the
424.20 ms scan. The actual serialisation control was red at 60 calls over 20 retained reads,
then green at zero with replacement/changed-metadata refusals intact. Permanent controls:
`packages/runtime/src/evidence-binding-execution.test.ts`,
`apps/server/src/authored-structural-source.test.ts`,
`apps/server/src/registered-shape-source.test.ts`. These cost repairs are D4083, separately
reviewed; complete software/content verification is tracked in the source plan.

`[V]` The shared-root prototype avoids materializing a position aggregate projection for every
shape/node when the desired output is an interval. It retains the original owned visitor
captures and shares one genuine legal-position root per node. In the separate aggregate-first
comparison, all measured prefixes (1/8/32/64/86) had equal interval, source/policy/trace and leaf
receipt images; that order warms shared caches and must not be reported as a cold comparison.
The fresh captured-only run above checks intervals, not cross-method trace equivalence.
Heap/RSS snapshots include garbage collection effects and are not an allocation bound.
This supports drafting a native captured-scan firing successor, with actual declared inputs,
complete negatives and current consumer delivery. It does not accept or implement that contract.

`[V]` The compiler audit also found an independent consumer-request cache defect (D4084):
re-reading a changing id/version request during spread/lookup/insertion could cache an authoring
consumer under an objective consumer key. The permanent Proxy/accessor falsifier failed before
the fix. Both compiler entry points now snapshot primitive consumer identity once and use that
same identity throughout; no source authority or permission is widened. Source/control and
independent review: `packages/runtime/src/evidence-binding-execution.ts`, its test, and
`planning/learner-modules/compiler2-independent-review-2026-11-02.md`.

### Same-day actual native source/factory follow-up

`[V]` After separate source/execution and delivery review accepted F2 §2.4b, the current
registered scan/factory and Inspector cutover were implemented. The normal command
`make foundation-shape-firing-current-measurement` now executes actual ShapeRegistry admission,
finite owned scan chunks and `theory.shapes.firing@3` over the same25×86 population. First result:
2150/2150cells, two intervals,95chunks,918.14ms preparation/548.88ms synchronous mint, max observed
chunk8.77ms. Inspection found repeated hashes of the exact source image the sole input2 mint
already retains. Comparing original immutable image identity instead preserves private minted
value membership and live registry/record checks; separate review and real replacement controls
accept it. Re-measured:84chunks,755.15ms preparation/67.25ms mint, max8.75ms, identical intervals.
This measures real source/factory work, not the application context, HTTP/UI, a general latency
bound or qualification. The time condition is checked after a leaf and does not interrupt it.
Sources: `tools/d4082-shape-firing/measure.ts`, `packages/runtime/src/internal/registered-shape-scan.ts`,
`packages/runtime/src/evidence-factories.ts`, `apps/server/src/registered-shape-scan.test.ts`.

`[V]` Independent implementation review found final advance replaying/hash-verifying the whole
matrix after its bounded loop (D4085). The repaired completion issues only its private original
token; complete verification/immutable image hashing stays at synchronous mint/read. Restoring
the former full read makes the70-cell multi-chunk control fail at70 distinct populations against
32; the repaired9-test source suite passes. The control also rejects any later advance rereading
an earlier chunk's populations. This is an executed falsifier, not a timing assertion on a quiet
machine. Inspector's current context owner drives each chunk/yield and retains its original
source/result proof. Full implementation/release and other consumers remain separately tracked
in `planning/foundation-source-identity/plan.md`; no source-parent completion is inferred.

`[V]` The later ordinary-board implementation replaces DrillScreen's local raw-catalogue firing
with its own authenticated guided read. Actual requested intent/server authority gates source
work independently of Inspector/reveal; complete original replay and branch validation precede
prefix scanning. Exact current consumer2/firing3 canonical presentation reaches the strict
API and mounted board. Registered attribution owns labels, and catalogue plans/Inspect require
the admitted document digest. Separate reviews returned D4086 (typed authority failures),
D4087 (retained Svelte callbacks) and D4088 (Inspect's id-only sibling join), then accepted the
bounded repairs. Actual ten-file523-case boundary proof passes; full gates remain recorded in
the source plan. Source outputs remain25of28; point modules/recommendations and other callers
remain open. Sources: `apps/server/src/service.ts#queryShapeFirings`,
`apps/web/src/lib/guided-shape-response.ts`, `apps/web/src/lib/DrillScreen.svelte`,
`apps/web/src/lib/screens.test.ts`, `planning/foundation-source-identity/plan.md`,
`planning/learner-modules/compiler2-independent-review-2026-11-02.md`.
