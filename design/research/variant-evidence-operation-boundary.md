# Variant evidence-operation boundary — run-surface census

**Date:** 2026-08-26
**Question:** Can one queue guard suppress every standard-chess producer for evidence-dark runs?
**Instrument:** `tools/d1678-evidence-operation-harness/` (disposable research code)
**Feeds:** [[D1678]], [[D1679]], [[D1685]], `rfc/variants.md`, evidence foundation

## Verdict

**No. Run-derived evidence enters through fifteen production request calls across two layers; seven
of them do not use the evidence queue.** `[V]`

The TypeScript-AST census pins these calls:

| Layer | Request calls | Count |
|---|---|---:|
| `DrillRunService` | `queue.enqueue` ×3, `queue.enqueueProducer` ×1, `selector.select` ×2, `selector.enumerate` ×1, direct tablebase `probe` ×1 | 8 |
| REST adapter | `selector.select` ×3, `corpusSource.stats` ×1, local `evidencePacket` ×3 | 7 |
| **Total** | | **15** |

The service paths cover explicit evidence, Story backfill, post-move eval/tablebase, group seeding,
opponent/group reply and branch decidedness. REST separately serves `/select-move`, human split,
prediction, corpus, voice and speech packets. `[V]`
`tools/d1678-evidence-operation-harness/evidence-operations.test.ts`; exact call sites in
`apps/server/src/service.ts` and `apps/server/src/rest.ts`.

Therefore adding `rules` to `EvidenceJobInput` or guarding `EvidenceJobQueue.enqueue` is necessary
but insufficient. Human split, prediction, corpus, local classifiers and direct tablebase can
still execute over the same run. The capability authority must be accepted by every producer
request constructor, not only the asynchronous queue. `[V]`

## Missing subject identity

The three current roots are all unable to express the identity measured in
`variant-setup-identity.md`:

- `EvidenceJobInput` has run/node/FEN/kind/bounds and optional objective request;
- `SelectMoveRequest` has start FEN/history/policy/seed/optional pack;
- `RunStart` has only FEN and learner side.

None carries `rules` or `setupFamily`; the harness reads their TypeScript members and will fail as
the shapes change. `[V]` `apps/server/src/evidence-queue.ts:18-28`,
`apps/server/src/opponent-selector.ts:70-76`, `packages/runtime/src/types.ts:64-67`.

The local `evidencePacket` path is especially important: it directly invokes standard structural,
phase, pivotal, endgame and shape readers from a run node FEN. It never reaches the queue and would
emit plausible but false classifier output for Tier-2 positions unless refused before compilation.
`[V]` `apps/server/src/guidance.ts:116-143`.

## Independent integrity defect: prediction subject (D1685)

`POST /runs/:id/prediction` admits client-supplied `startFen + historyUci`, selects a distribution,
then calls `recordPrediction` with only `nodeId`, checkpoint, predicted move and distribution.
`recordPrediction` verifies that the node is active but its typed input has no start/history/FEN or
sealed subject receipt to compare. The distribution's mass/rank can therefore describe a different
position while being stored on the active node. `[V]` `apps/server/src/rest.ts:1745-1767`,
`apps/server/src/service.ts:1517-1552`; harness member/route-shape arm.

This is a standard-chess correctness defect as well as a variant blocker. The smallest repair is
to derive the selector request from the authoritative run/node in the service. If a reusable
candidate receipt is used instead, its exact position/history/rules/setup identity must be sealed
and checked before persistence. `[M]`

## Contract consequence and limits

The variants amendment needs a compiled per-operation capability table over the literal 15-call
run-surface population. A new request call must fail until it declares available, honest-empty or
suppressed for every rules/setup family; construction without the run identity must fail. The
provider-internal executor/tablebase calls and offline sourcing/authoring commands remain a second
population and require explicit dispositions rather than being silently treated as covered by
this run-surface census. `[V]`

This pass does not validate Tier-2 detectors, provider sidecars, response caching or workflow
admission, and it does not authorize implementation before the RFC returns accepted.
