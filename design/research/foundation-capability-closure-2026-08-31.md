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
