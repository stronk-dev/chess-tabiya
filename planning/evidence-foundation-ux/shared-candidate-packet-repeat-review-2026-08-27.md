# Shared candidate packet — repeat independent buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/shared-candidate-evidence-packet.md` after the [[D1631]]–[[D1636]] amendment

**Verdict:** **RETURNED.** The factual packet remains the right lower primitive. The amendment
repairs terminal/adjudication separation, the three cache identities, the 47-event/22-reading
closure and White-to-root cp/mate algebra. Its literal scope-wide F1 declaration also compiles
against the shipped manifest compiler. Implementation is still not authorised because the runtime
admission boundary, first production consumer and engine execution topology do not match those
claims, and the required provider RFC remains returned.

## Method

The pass re-read the complete amended RFC, the first independent return and author-repair handoff,
then re-derived the implementation seams at HEAD:

- executed the D1631–D1636 harness and added a literal amended 47/22 `anyOf` compilation arm;
- read `DeclaredEvidence`, `ConsumerEvidenceView`, `declareEvidence` and
  `evidenceForConsumer` at their production symbols;
- traced every current candidate-vector and semantic-selection caller;
- checked the production bot catalogue and selector path;
- compared the proposed per-child Stockfish join to D969's measured one-root contract and D1329's
  fixed full-root census;
- checked the shared provider dependency against its current independent return.

The review did not edit the concurrent D872 semantic-tactics files or untracked
`planning/review/` work.

## What the amendment repaired

The focused harness now passes 10/10. In particular:

- insufficient-material, fifty-move and repetition positions retain legal candidates while only
  checkmate/stalemate produce a zero-row packet;
- packet, provider and policy identities stay distinct;
- the amended literal F1 tuple with legal moves plus 47 event and 22 reading projection identities
  is accepted by `compileEvidenceManifest`;
- `legal_exchange` and `fork_survives_reply` survive the proposed migration;
- White/Black centipawn orientation and typed mate-only comparisons are defined without fake cp.

Those are real repairs. The return below does not reopen them.

## Blockers

### 1. The shared service caches a consumer-specific view without identifying the consumer ([[D1900]])

The RFC binds one packet projection to two consumers, then declares:

```ts
CandidatePopulationService.get(
  request: CandidatePopulationRequest,
  signal: AbortSignal,
): Promise<ConsumerEvidenceView<CandidateEventPopulation>>
```

`CandidatePopulationRequest` is not defined in the RFC or tree. More importantly,
`ConsumerEvidenceView` contains one literal `consumer` identity
(`evidence-contract.ts:218-222`). A view admitted for `research.semantic_selection@1` is not the
view admitted for `opponent.selection@1`. The factual cache key deliberately contains no consumer,
so a service that caches/returns the view either serves the wrong consumer on a shared hit or has an
undeclared second admission/cache layer.

The mismatch continues into `CandidateFeatureOperation`: its input is a consumer view, while its
output says it retains one `DeclaredEvidence<CandidateEventPopulation>`. No rule chooses exactly
one admitted item or proves the input view belongs to `opponent.selection@1`.

Cache the process-sealed factual value/receipt. Define the closed request. Each operation must then
admit that same declared value separately to its exact consumer after the factual cache lookup.
Crossed-consumer fixtures must prove one cached packet yields two different valid views and neither
view is accepted by the other operation.

### 2. The scope-specific F1 derivation has no value-level witness ([[D1901]])

The amended declaration compiles, which closes D1634's static failure. It does not establish the
runtime claim in §3.1/criterion 22 that “each scope selects its exact `anyOf` member.”

A general `DeclaredEvidence<T>` carries producer, projection and payload only
(`evidence-contract.ts:205-210`). `declareEvidence` accepts no derivation inputs
(`:393-398`), and `evidenceForConsumer` checks only the sealed producer/projection binding
(`:407-430`). Value-level derivation-member checking exists for `SemanticEvidenceEvent`, not for
ordinary derived readings. Therefore a packet value has no F1 witness saying whether it used the
events, readings or combined member, and criterion 22's proposed negative—remove the weakest input
while retaining the payload—has no input value to remove from the declared packet.

The packet's named adapter can validate its payload shape and compiler provenance, but that is a
private assertion, not the exact F1 derivation admission the RFC says it is. Repair either by using
the internal process-sealed receipt from the prior handoff while constituent evidence remains
individually F1-admitted, or by first specifying and accepting a general derived-value input receipt
that binds exact admitted values to one declared member. Do not call a declaration-only graph a
value-level seal.

### 3. The claimed bot consumer is still a synthetic profile, not production consumption ([[D1902]])

The only real current composition consumer is the semantic CLI. The production catalogue is
literally `BOT_POLICY_PROFILES = compileBotPolicyCatalog([])`
(`bot-policy-catalog.ts:298-300`), and `bot-policy.md` plus `bot-roster.md` are returned drafts.
No production request can therefore select the “compiled evidence-bearing bot profile” required by
§6.0 and criterion 23.

Constructing such a profile inside a test proves the selector can be called; it does not make the
profile a shipped product input. This is the anchors-versus-consumption defect D666 already named,
now moved to the application composition root. It also contradicts the prior repair handoff's
explicit first-landing boundary: semantic CLI plus packet-aware vector refactor, with live bot
injection deferred to the first accepted consumer RFC.

Narrow this RFC's first landing to actual consumers, or wait for an accepted bot profile/route RFC
and name the concrete registered profile whose normal production request crosses the operation.
Application injection without reachable production configuration is not consumption.

### 4. Per-child evaluation silently replaces the measured one-root engine operation ([[D1903]])

The candidate join requires one `live.stockfish.position_eval@1` exchange per scored child
(§7.1), and `CandidateFeatureOperation` obtains that complete set through the scheduler (§6.0).
That is up to one engine search per legal move. No concurrency cap, aggregate deadline, partial-set
cancellation rule or whole-set cost criterion is specified.

The bot guard evidence this RFC cites says something different. D969 pins one shared
`MultiPV=N searchmoves` request as the only measured common scale. D1329 likewise measured one
genuine depth-2 full legal-root request per position: 1.463 seconds across 180 roots, before the
local evidence projection. The amended RFC changes both the search root and request count without
research and then carries D969's mixed-domain verdict as though the computation were unchanged.

Choose one exact source contract. If the bot consumes `live.stockfish.legal_root_table@1`, join its
complete normalized root rows to packet candidates and retain the one-exchange receipt. If child
position evaluations are required for Review reuse, keep them as Review's node-free source and
research/preregister their distinct horizon, batching, latency and cancellation before making them
the bot guard. “Same bound” does not make N child searches the measured root-table operation.

### 5. The provider dependency is still returned ([[D1871]]–[[D1878]])

The RFC correctly says `provider-exchange-and-execution.md` must be accepted first. It is not.
Its central `TypedProviderRequest<T>`/`TypedProviderResult<T>` protocol is undefined (D1877),
and actual Stockfish generation is required in the request key before the exchange that establishes
it (D1878). Those are exactly the types and receipt/cache semantics this RFC imports for
`FixedBoundPositionEvaluation`, cancellation and the final selector cache.

This is not a fifth new ledger defect; it is an existing dependency gate. The packet RFC cannot be
accepted as buildable while its implementation surface requires types whose owner is explicitly
returned.

## Required amendment order

1. Define `CandidatePopulationRequest` and split factual cached value from per-consumer admission
   (D1900).
2. Make the aggregate an honest internal receipt, or land a separately reviewed value-level
   derivation receipt before claiming the scope-specific F1 seal (D1901).
3. Narrow first landing to real current consumption, or wait for a concrete accepted production bot
   profile/route (D1902).
4. Reconcile the bot score source with D969/D1329 and add a whole-set execution budget (D1903).
5. Wait for D1871–D1878 to be repaired and the provider RFC independently accepted.
6. Re-run the 10-arm repair harness, production consumer census, full manifest compilation and
   Node-24 packet envelope against the amended symbols, then repeat independent review.

No owner ruling is required. These are technical type, evidence-admission, production-reach and
measurement contradictions. The packet/provider split, operator-only boundary and no-LLM rule
remain unchanged.
