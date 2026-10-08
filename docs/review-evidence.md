# Review evidence

`rfc/review-evidence-compiler.md` replaces Story's untyped engine scalar with a typed, partial
post-game packet. Runtime: `packages/runtime/src/review-points.ts`, `review-evidence.ts` and
`story.ts`; server: `apps/server/src/review-evidence.ts`.

Campaign history opens Review at the recorded submitted consequence or boss terminal node and
branch, rather than the mutable Play cursor. Declaring done admits only that exact submitted
consequence: a different live branch or an extended line still requires ordinary feedback
disclosure. The owner's Review carries its durable campaign origin for returning to the map;
request parameters cannot supply a return URL. See `docs/campaign.md` for retained, abandoned
and deleted-recording behavior. This navigation does not supply missing evidence sources.

## One engine source, five Review projections

The only engine source is the shared node-free `live.stockfish.position_eval@1` delivery from the
provider exchange: a White-perspective `centipawns | mate` score plus the same line's raw
side-to-move WDL, exact canonical request FEN, engine identity and one bound. It carries no node,
best move or principal variation. Review derives:

| projection | meaning |
|---|---|
| `derived.review.eval_point@1` | the delivery joined to one `run.record.position@1` occurrence by byte-identical canonical FEN |
| `derived.review.eval_delta@2` | cp→cp only, White perspective, both ordered points retained and declared |
| `derived.review.mate_transition@2` | `appeared | disappeared | side_changed | distance_changed`; both ordered points declared; never a cp conversion |
| `derived.review.wdl_white@1` | raw side-to-move WDL normalized once to White (node-free) |
| `derived.review.wdl_point@1` | that normalization joined to one exact occurrence |

`rules.tactic.consequence.forced_mate_after_move@2` is the same mate proof with both position
endpoints declared; the packet links it to an engine mate transition only through a byte-identical
`run.record.edge@1`. Two points compare only when their deliveries share the actual engine
id/version, provider generation, position-free command image and requested bound; otherwise the
derivation abstains. `derived.story.eval_shift@1` is retired.

## The packet

`createReviewPrefixAuthority(storage)` is the sole constructor of the recorded-prefix subject: it
reads the parsed stored run and import record, requires contiguous events, hashes the event prefix
and complete path, and derives learner side and outcome. `reviewPacketSourcePlan` derives the exact
adapter × node (and adapter × incoming edge, never at the root) invocations from the literal
`REVIEW_PACKET_SOURCE_ADAPTERS` registry; each adapter has one family, grain and executable payload
parser. `compileReviewEvidence({ subject, sources })` requires the private-sealed results to be
set-equal to that plan, sorts, links, folds every adapter row per family (`foldReviewFamilyState`)
and derives orthogonal `progress` and `degradation` (`foldReviewCompletion`) before sealing the
packet. `assertReviewEvidencePacket` is the trust boundary.

Every subject-reading entry point and packet assertion rechecks the recorded game against
current storage. A packet retained across a write cannot be compiled or presented as the
current Review. Missing runs/import records, changed event heads, paths, learner sides or
results are refused. This uses the existing recorded-prefix identity, not a new freshness
system or cache: only issuing a new subject runs the semantic collectors. Rechecking one
reads storage and compares its identity without minting another subject or replaying collectors.
The PhaseArc compiler retains its independent recorded-path contract.

Families: `engine_eval`, `engine_wdl`, `tablebase`, `semantic`, `opening`, `human_model`,
`human_corpus`, `authored`, `recorded`. At this landing the baseline pass requests only the shared
Stockfish position evaluation; tablebase is `not_requested` inside its seven-piece domain and
`honest_empty/outside_domain` outside it; Maia and Explorer are `not_requested`; runtime opening
identity is `unavailable/provider_off` for Review (runtime-opening-identity D2 remains open).

## Coordinator

`ReviewEvidenceCoordinator` (composed once in `application.ts`) is the only Review path to a
provider. `ensureBranch` admits at most `windowNodes` missing positions and `maxOutstandingPerRun`
active subscribers, requests through `ProviderExchangeScheduler.get`, attaches each delivery to the
run's own `evidence.attached` eval event under `values.providerDelivery` (legacy scalar fields stay
for inspector/grade readers), and pumps the next window from completion callbacks. `observe` is the
read-only view used by the Review Map. After a delivery, the same attempt requests that position's
bounded line (see below) before attaching. `ReviewAttemptOutcomeStore` retains fixed-size terminal
receipts in exactly `maxTerminalAttemptOutcomes` slots: attempts count only at `start()`, a
never-started cancel restores history, a started cancel consumes an attempt, exhaustion is retained,
and a full store refuses unseen work with `attempt_history_capacity`. Mock-engine deployments run
the same exchange over the labelled `Mock Stockfish` client (`mock-provider-engine.ts`).

Engine discovery is shared only while its lookup is pending. A later authorized window asks
for the current identity again; a failed lookup cannot permanently disable Review. With a
configured scheduler, null, rejected or synchronously thrown identity lookup produces
`unavailable/provider_failed`, visible through read-only `observe`. Only an unconfigured
scheduler produces `provider_off`. The next `ensureBranch` may discover a recovered engine;
discovery itself starts no provider attempt and never resets existing failure/exhaustion history.
Fully delivered or terminal branches perform neither discovery nor new provider work.

Reservations are synchronous, before discovery yields: each holds the exact node/FEN and one
cancellable slot. `maxOutstandingPerRun` counts those slots across all tracked branches of the
run, including shared-attempt subscribers. Repeated reads reuse a reservation; removed occurrences
cancel it. Eviction detaches pending discovery/subscribers without cancelling shared lookup or a
different run's owner. Tracker and reservation ownership are checked before provider execution
and attachment, and late completion cannot retire a replacement reservation.

Application close and failed-startup unwind stop this coordinator before releasing storage.
`close()` stops admission, aborts every reservation and drains the logical subscribers once,
including pending identity discovery and late evaluation/line results. It does not wait for
an abort-ignoring provider to finish or replace the shared scheduler's physical shutdown.
Started cancellations retain their attempt count; late completion cannot attach evidence or
pump another window. A stopped coordinator cannot be restarted by `ensureBranch`.

Only the scalar attempt owner calls the scheduler. Other occurrences wait for that owner's
completion, retaining the same failure ceiling. After successful durable attachment releases the
scalar slot, a surviving occurrence acquires ownership and obtains the scheduler's exact retained
delivery for its own durable attachment; the attempt store never holds provider payloads. Terminal
callbacks wake all previously requested branches of that run, without a future Story read and
without retaining an ancestor promise per position. The normal `make review-evidence-runtime-check`
includes authenticated concurrent-import HTTP/SQLite proof as well as coordinator/runtime tests.

Both transition derivations declare `[eval_point@1, eval_point@1]` in before/after order.
Strict execution retains separate provider and recorded-position occurrences for each endpoint.
Review packet adapters, Review Map, Story and presentation bindings use transition v2;
Story rank/title use v2 to declare those successor dependencies, with unchanged ordering and
title composition. The four predecessor capability declarations remain frozen and deprecated
in history; they have no current factory or binding. These projections are recomputed from
recorded deliveries, not migrated stored run fields. Metadata refresh uses the normal Make
targets and preserves authored pack/evidence claims.

## The Analyze line

The Review Map's explicit Analyze action (`GET /runs/:id/review-analysis`, rfc/review-map.md §7)
reveals a line that the compilation pass already recorded. After each evaluation is delivered, the
coordinator requests `stockfish.principal_variation@1` for the same FEN, engine and movetime, bounded
to `REVIEW_EVIDENCE_PROFILE.linePlies` (12) plies. The request goes through the same scheduler and
runs after the evaluation, so a node never holds two exchange slots. The sealed line is stored on
the same durable event under `values.providerLineDelivery` (`REVIEW_PROVIDER_LINE_KEY`). No separate
`bestline` row is attached, so Compare's line overlay does not change.

The line never holds back the evaluation. If the line can't be obtained, the evaluation is still
attached and Analyze says that no engine line is recorded. The packet, Story and the Review Map never
read the line, so the evaluation delivery and its projections still carry no best move or PV
(refusal 7).

`reviewDurableEngineLine(run, node)` re-derives the recorded bytes through
`parsePersistedProviderDelivery` and seals them as `live.stockfish.principal_variation@1`. A line
whose bytes no longer re-derive is not a line. `reviewAnalysis` turns it into the attributed
`bestline` packet sealed by `live.stockfish.pv@1`. That packet carries the actual engine id, name
and version, the requested bound, the reached depth and the provider payload digest. It is admitted
only through `module.full_inspector@1`. The sentence names the engine and the search bound and adds
the not-advice caveat. The reveal is withheld while a retry from that position is open. It is read
only: it enqueues nothing and writes nothing (criterion 14). Explicitly attached `bestline` packets
and legacy eval first moves remain fallbacks for runs that have no typed line.

## Story and the Review Map

`renderReviewStoryReceipt(packet)` is the one server consumer on `GET /runs/:id/story`; see
[game import and story](game-import-and-story.md). The Review Map evidence panel admits the
packet's `eval_point`, `eval_delta`, `mate_transition` and `wdl_point` items through
`module.review_map@1`, presents them through the registered pair-keyed adapters
([evidence presentation](evidence-presentation.md)) and states engine-family absence with
packet-issued abstention components. The row carries the closed receipt as `packet`; its sentences
are the tail of the row's `facts`.
