# Learner-rating acceptance closure — the implemented surface is not the accepted RFC

**Question:** which of `rfc/learner-rating.md`'s eighteen acceptance criteria are executable at
HEAD, and which claimed product obligations still have no production authority?

**Date:** 2026-08-26

**Verdict:** the arithmetic, calibrated ladder, rating storage/projector, server abstention,
learner-relative history, assistance refusal, cohort self-publication and rating-isolation graph
are real. The RFC is correctly still `implementing`: three normative product obligations do not
exist, five more have only partial tests, and rated Campaign remains dependency-blocked. `[V]`

The most important miss is not test naming. AC-8 requires Maia's value-head expected score to be
recorded beside each rated game as a diagnostic that cannot reach the update. `RatedGameRecord`,
the `rated_games` STRICT table, `OpenRatedGameRecord`, the projector and every rating test contain
no such operand. Adding it needs an owned migration amendment; it cannot be repaired as an
unregistered implementation detail. `[V]`

The learner-copy miss is broader. AC-12 says the rating surface emits only the frozen disclosure
set and numbers. `RatingScreen.svelte` authors additional headings, opponent adjectives, start
instructions, mark text, history labels and the sentence “Beat band …”; the only denylist test
runs over `RATING_DISCLOSURES`, not the rendered surface. The criterion is neither implemented nor
able to fail on current copy. `[V]`

## Method

The pass re-derived all eighteen criteria from `rfc/learner-rating.md` §Acceptance criteria, then
read the production symbols and executable tests at HEAD: `packages/runtime/src/rating.ts` and
`rating.test.ts`; `apps/server/src/storage.ts`, `service.ts`, `rating-storage.test.ts`,
`rating-service.test.ts`, `rating-standing.test.ts`, `storage.test.ts`, `capabilities.ts`; the
AC-7 and AC-11 harnesses; and `apps/web/src/lib/RatingScreen.svelte`,
`CohortStanding.svelte`, `rating-api.test.ts` and `rating-surfaces.test.ts`. `[V]`

“Complete” below means the criterion's named positive and negative can fail against the
production boundary. A nearby unit test or a structurally absent field is not credited as a
criterion implementation. `[V]`

## Criterion matrix

| criterion | state at HEAD | executable authority / exact residue |
|---|---|---|
| AC-1 refusal closure | **partial** | Named band, material, engine-identity, assistance, fork and duplicate-result refusals execute. There is no set-equal R1–R16 refusal matrix; pack/authored outcome, per-move contribution, recommendation reach and tablebase-adjudication are protected indirectly or by absence rather than every named failing case. |
| AC-2 Glicko-2 | **complete** | Runtime test reproduces the worked example to the specified precision. |
| AC-3 calibration | **complete** | Four rungs join the measured artifact and half-width rule; a changed calibration operand fails. |
| AC-4 no historical rating | **complete** | Migration tests assert new tables and no historical backfill; service abstains when no state exists. |
| AC-5 assistance refusal | **partial** | Service tests exercise guidance, reveal and analysis and pin `attempt_end`; the complete HTTP route set, pre-outcome evidence-page empty arm and explicit browser-remainder negative are not one criterion-level integration test. |
| AC-6 disclosures | **partial** | Seven frozen disclosure sentences contain the required facts and render through the Rating screen, but no exhaustive renderer test binds all required sentences/counts to every movement surface. |
| AC-7 bracket simulation | **complete** | Source-sealed multi-model/two-arrival harness and checked receipt ship. |
| AC-8 diagnostic cross-check | **missing** | No `expectedScore`, Maia value-head diagnostic or comparison operand exists in the rated record/table/projector/report. A migration claim is required. |
| AC-9 server abstention | **complete** | `publishRating` omits `pointEstimate`; service and web tests preserve absence rather than printing a hidden value. |
| AC-10 one result/run | **complete** | STRICT primary key, fork integration and 250 generated action sequences bind the invariant. |
| AC-11 rating isolation | **complete** | Dedicated import-graph positive control plus byte-equal rendering harness runs in required verification. |
| AC-12 copy boundary | **missing / contradicted** | The denylist covers only `RATING_DISCLOSURES`; the real component contains a larger unregistered authored sentence set and congratulatory “Beat band” mark copy. |
| AC-13 self-publication | **partial** | Authenticated route rejects a teacher-supplied handle, learner publication is self-derived, and leaving removes the entry. No reachability guard proves no future classroom-member path can create a standing member. |
| AC-14 ordering/grouping | **partial** | One example proves result order and rating absence while provisional. No generated/permuted-rating property binds `(points, games, handle)`, group-step separation or forbidden response statistics. |
| AC-15 one-classroom/no-run leak | **partial** | Outsider not-found and serialized run/FEN/evidence absence execute. No member/non-member rated-game byte-equivalence arm or cross-classroom aggregation tripwire exists. |
| AC-16 limitation everywhere | **partial** | Service view, rendered view, publish confirmation and capability rows carry the limitation. There is no exhaustive registry of every multi-learner rendering site, so a new site can omit it without failing. |
| AC-17 rated Campaign boss | **dependency-blocked** | Campaign persistence/API/surface is author-returned; no rated boss production path exists. The ordinary rated-game path is correctly position-shaped and objective-free. |
| AC-18 time-control calibration disclosure | **missing / dependency-blocked** | Rated-game records carry no time-control or anchor-calibration state. The current bot contract deliberately has no clock model. This needs a narrowed learner-rating amendment coordinated with the clock/bot lane, not decorative copy. |

Totals: **7 complete, 7 partial, 3 missing, 1 dependency-blocked** when AC-12 and AC-18 are counted
as missing despite also contradicting or depending on later work. The total is a source-derived
classification for this audit, not a release metric. `[V]`

## Consequences

1. `learner-rating` must not archive from its current status prose. AC-8, AC-12 and AC-18 require
   author amendments because they change registered storage/source/copy authority; AC-17 remains
   a Campaign discharge. `[V]`
2. AC-13–AC-16 can be strengthened without changing product semantics once their exact population
   registries are specified. Writing four example tests is insufficient where the criterion asks
   for reachability, permutation or “every site.” `[V]`
3. The UI currently says more than the accepted copy contract allows. The safe repair is a sealed
   rating-copy registry consumed by both runtime tests and the Svelte renderer, not expanding the
   denylist around whichever strings happen to ship today. `[M]`
4. AC-8's diagnostic must stay outside `GlickoResult` and the update path. The schema should carry
   the recorded source value and comparison as a separately typed diagnostic receipt, with a
   dependency-graph negative proving it cannot reach `glicko2Update`. `[M]`
5. AC-18 cannot be satisfied by always printing “uncalibrated.” It needs the actual played
   time-control identity and a calibration-coverage operand; otherwise its positive and negative
   controls are indistinguishable. `[V]`

## What this does not claim

- It does not re-evaluate whether BCS is a useful learner-facing scale; AC-7 owns that measurement.
- It does not authorize a migration, a time-control field, Campaign work or revised learner copy.
- It does not call example-level tests worthless. It distinguishes them from the total/population
  invariants the accepted criteria explicitly require.
- It does not use the dirty D872 harness or the concurrent `planning/review/` work.
