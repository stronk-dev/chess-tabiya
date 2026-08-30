# Bot policy — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/bot-policy.md` after the D2087–D2096 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make bot-policy-second-fresh-review` — 8/8 blocker arms
- **Existing evidence:** `make bot-policy-author-contract` passes 11/11; that green result is one of the audited inputs
- **Production status:** untouched; no schema, migration, selector, provider, roster, route or UI implementation is authorized

The repaired event envelope, twelve family×band identities, optional all-legal guard, compiler-owned
draw and bounded-Maia Stage-B subset are the right architecture. The second pass asked whether the
green executable model proves those semantics and whether its outputs can reach the real provider,
capability, persistence and client boundaries. Eight seams remain.

## B1 — profile sampler/model identity does not control the executable draw ([[D2219]])

The RFC's measured reconstruction control is T=0.8/topP=0.92. The author catalog silently creates
profiles with T=1.15/topP=0.97, while its provider fixture reports T=1/topP=1. The source join checks
only root, applied band and nonempty candidates. `BotProfileReference` omits sampler parameters and
the compiler hard-codes 1.15/0.97/0.97 instead of reading the resolved declaration. No author test
runs A7's captured production artifact. `[V]` `rfc/bot-policy.md` §0/§§1–3/A7;
`tools/d1970-bot-policy-author-repair/contract.ts:37-52,193-196,324-366` and test fixture lines 38–45.

**Required repair:** define one exact compiled declaration type containing engine/model identity,
band, request width, T, topP, floor and ordered layers. Bind the admitted provider request/actual
identity to it. Execute from those fields, not literals. Cross wrong model/version/band/T/topP/width
and run the real positive-control artifact with T=1 as the negative arm.

## B2 — the pawn classifier proof is an `a2` string heuristic ([[D2220]])

The author compiler multiplies and records `pawn_move@1` only when UCI starts with `a2`. Its entire
legal fixture is `a2a3`, `a2a4`, `b2b3`; the test never asserts that `b2b3` is also a pawn move.
This makes 11/11 green while excluding seven white files, every black pawn, most captures and
promotions. `[V]` `tools/d1970-bot-policy-author-repair/contract.ts:346-362` and
`contract.test.ts:36,150-154`; contrary contract at `rfc/bot-policy.md` §2.5/A4.

**Required repair:** consume the runtime-sealed legal-board classifier promised by the RFC. Its
positive/negative matrix must cover both colours, all files, quiet moves, captures, en-passant and
four promotion identities, plus castling/non-pawn hard negatives. The transform and recorded
classifier must read the same sealed view.

## B3 — provider authority is copied, not retained ([[D2221]])

The provider dependency explicitly requires every derived projection to retain the admitted
`ProviderEvidenceDelivery`; stripping it and copying identity fields is forbidden. Bot policy does
exactly that: `ExactBotProviderSourceIdentity` is a new digest-field object, the decision persists
that object, and `BotOperationRecord` keeps only generic provider-source digests. Acquisition and
delivery receipts are absent. `[V]` `rfc/provider-exchange-and-execution.md` §3;
`rfc/bot-policy.md` §§3, 6; author contract `sourceIdentity` and decision projection.

**Required repair:** define the serializable registered provider input/receipt retained by the run
event and the runtime assertion used after reload. The bot may derive deterministic source identity
for its decision digest, but that identity must point to—not replace—the admitted acquisition. Cross
copied fields, a digest from another delivery and save/reload without the receipt.

## B4 — live roster availability has no dependency on provider health ([[D2222]])

§4.3, §7, §8 and operation 12 require live provider state, unavailable/degraded cards and release
receipts. The dependency list names provider exchange only. Exchange proves one operation; it does
not own D609's current-health registry. Without the returned `provider-health-degradation` contract,
implementation can fall back to configured identity presence—the exact false-green this lane exists
to eliminate. `[V]` both RFC headers and `design/BACKLOG.md` D609/D1910–D1915.

**Required repair:** depend on the accepted provider-health operation/snapshot authority and declare
the exact join from Maia/Stockfish instance state to each profile. Coordinate provider-health's
durable opponent receipt obligation/run lane with this event envelope rather than persisting two
parallel receipts.

## B5 — the public opponent operation has no response algebra ([[D2223]])

The request and six outcome names are specified, but no result interface, HTTP status/error code,
envelope projection or retryability/action mapping exists. The ordinary client therefore cannot
implement the promised Retry/Change-opponent/stale-root behavior without inventing protocol.
`[V]` `rfc/bot-policy.md` §4.1/A2/A10.

**Required repair:** publish one closed route/service/client request/result map. Bind every outcome
to status, error code, safe payload, retryability and UI action; define whether replay returns the
same event envelope/sequence as commit. Cross all arms through the actual client parser and normal
run controller.

## B6 — the versioned catalog is cross-package, not local ([[D2224]])

The RFC calls profiles catalog-local while persisting profile/layer/reason identity in the runtime
event schema and consuming it in server create/resume/cache/capabilities, roster/card and the web
picker. That is a durable multi-reader resource under the same admission rule used for every other
register. A run-schema lane versions event shape; it does not choose who owns the twelve catalog
members or their canonical declaration digest. `[V]` `rfc/bot-policy.md` claims paragraph, §§1, 4,
6–8, 10.

**Required repair:** declare one bot-profile-catalog head/register and checked generator, or make all
downstream unions/projections derive from one literal authority and prove no independent writer.
Profile history must keep old run references resolvable without silently mapping to latest.

## B7 — the persisted decision type is internally incomplete ([[D2225]])

§2.4 uses undefined `ExactStockfishSourceIdentity`; §6 uses `CandidateFeatureId` with only a comment
promising generation; and the executable author model emits `guard_dependency_abstained` although
`BotDegradationReason` omits it. The author artifact hides the mismatch by typing layer reasons as
open `string`. `[V]` RFC §§2.4, 6; author contract `BotLayerAction`/pawn layer.

**Required repair:** generate/export the complete literal profile/layer/classifier/feature/reason
algebra from the chosen catalog authority, use it in schema/runtime/server/client, and compile the
exact RFC record. Unknown and cross-arm reasons must fail parser and runtime construction.

## B8 — provider-sensitive replay is impossible under the declared no-call short circuit ([[D2226]])

§4.1 correctly checks a committed request id before provider calls and returns its stored envelope.
The same section also promises that reuse with different derivation or provider source identity
refuses. A later retry cannot observe changed provider bytes or generation when it deliberately
performs no provider work. Concurrent first flights are not given a post-provider same-request
comparison; a stale-head result is not the promised operand mismatch. `[V]` RFC §4.1/A2/A6/A8 and
author `beginBotOperation`/`commitBotOperation`.

**Required repair:** state the two identities separately. A committed retry is keyed only by the
pre-provider request/root/writer/profile/seed image and always replays. For concurrent misses,
define the serialized post-provider winner check and whether a loser replays the winner or receives
a typed conflict; only that phase can compare derivation/provider identities.

## Re-review order

1. Fix the executable profile/sampler and pawn authorities.
2. Reconcile provider exchange + provider health + durable receipt ownership.
3. Close the shared catalog, persisted decision and public route algebras.
4. Specify concurrent/idempotent behavior, invert all eight arms and rerun the captured sampler
   positive control before another review.

No finding weakens the measured-family-only roster, refusal of fake personality prose, optional
guard semantics, seeded server draw or one evidence foundation shared by bots and learner guidance.
