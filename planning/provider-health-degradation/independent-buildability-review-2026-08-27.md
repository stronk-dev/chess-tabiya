# Provider health and honest degradation — independent buildability return

**Reviewed:** 2026-08-27

**Reviewer:** codex

**Document:** `rfc/provider-health-degradation.md`

**Verdict:** **RETURNED.** D609/D1848 are real release blockers and the desired learner behavior is
correct. The draft cannot yet represent the provider topology, first-request state, rendering
dependencies or durable acquisition receipt it requires.

## Method

The review traced the draft through:

- the three production UCI specs and `EngineSupervisor` health identities;
- F1 `ConsumerDeclaration`, compiled latency/provider-off fields and live manifest capabilities;
- the current `OpponentSelector` cache and 60-second Maia request;
- `OpponentSelection`, `opponent.move_selected`, REST parsing and run schema v0.17;
- corpus/tablebase caches and the proposed registry transitions.

The disposable D1910–D1915 harness has six passing controls over the literal draft and live types.
It is an able-to-fail buildability instrument, not production code.

## What survives

- configuration is not health, a cache hit is not live service, and domain absence is not provider
  failure;
- exact-request cache disclosure, no silent provider substitution and stable learner geometry are
  correct product requirements;
- one operation budget must include queue, retry, provider work and parsing;
- generation-aware bounded caches and late-generation refusal are necessary;
- `/healthz`, core readiness and optional-provider capability are distinct;
- provider facts remain operational metadata and never become chess truth or assistance permission.

## Blocking findings

### 1. One provider id cannot carry the production Stockfish topology ([[D1910]])

Production starts `stockfish-play` and `stockfish-analysis` as distinct supervised engine
identities. They have different options, workloads and restart generations. The RFC gives the
registry one key, `providerId: "stockfish"`, and one scalar `generation`, while prose says that key
“keeps one generation per supervised engine identity.” The type cannot hold that cardinality.

This causes false health in both directions: a healthy analysis engine can make strong-engine play
look available after `stockfish-play` dies, or a play-engine failure can disable recorded analysis.
Use a closed logical provider id plus a concrete provider-instance/operation identity, and map each
F1 projection/consumer path to the exact instance(s) it executes. Fixture independent failure and
restart of both Stockfish instances.

### 2. The state algebra is not total ([[D1911]])

`not_configured` still requires a non-null `ProviderImplementation` and `generation`; neither exists
for an absent configuration. `unverified` is a provider state and may make the first real request,
but `RuntimeCapabilities.policyModes.state` has only `available`, `cached_exact_only`, and
`unavailable`. Advertising an unverified external provider as unavailable can disable the only real
request that would verify it; advertising it as available violates criterion 2.

Publish a discriminated snapshot union with state-specific fields. Add a distinct requestable-but-
unverified operation/mode state (and ordinary learner wording/action), or name another real
verification trigger. Tests must begin from a clean process with each HTTP provider unverified and
reach both success and failure without a capability probe inventing traffic.

### 3. F1 cannot express the voice/TTS dependencies this RFC assigns it ([[D1912]])

The four chess-source mappings fit producer availability. Voice and TTS do not: they are rendering
providers, and `ConsumerDeclaration` has only `providerOff`; it has no provider dependency or
pipeline member. No `voice`/`tts` producer exists, correctly. Section 8 nevertheless says to attach
both services to `guidance.voice`, `guidance.voice_compare`, and `guidance.voice_story` and use the
compiled consumer deadline as the whole pipeline ceiling.

Publish the literal F1 extension (or a separate compiler-owned execution contract) that binds
consumer operation → provider instance(s), including sequential voice→TTS composition, fallback,
and one total deadline. Compile it and add missing/duplicate/cycle/deadline-reset negatives. A
server-side handwritten map would create the second capability registry the summary refuses.

### 4. The receipt is not a closed operation result ([[D1913]])

`ProviderOperationReceipt` allows every `source` with an optional failure `reason`. It therefore
permits contradictory values such as `cached_exact + process_exit`, `local_fixture + timeout`, a
failed live operation with no reason, or deterministic fallback presented as provider success.
There is also no generic success/failure/unavailable operation union naming where the receipt and
value travel.

Define a discriminated `ProviderOperationResult<T>` with legal source/reason/state combinations,
typed caller cancellation, exact-cache success and deterministic fallback. Health transitions must
consume the closed result rather than loosely related callbacks. Criterion 4 should compile and
falsify every illegal combination.

### 5. Acquisition receipts are already a run-schema change ([[D1914]])

`OpponentSelector.select()` returns `OpponentSelection`; `appendOpponentPly()` persists that object
inside `opponent.move_selected`; REST parsing is closed; and `drill_run.schema.json` sets
`opponentSelection.additionalProperties: false`. The RFC requires a receipt on every new selection
and says Review/export can retain original engine/model plus cache acquisition. That is durable run
state, not an optional diagnostic envelope.

The rollout section cannot defer the decision to implementation while the register claims `none`.
Claim the next available run-schema lane in the RFC register, define backward compatibility for old
events, and fixture live/cached selections through save→reload→Review/export. If durability is
refused instead, remove the Review/export promise and state the trust loss explicitly.

### 6. `degraded_cached_only` can become stale when the cache changes ([[D1915]])

The global transition depends on whether “at least one valid exact-request cache entry” exists, but
the registry receives handshakes and request outcomes only. TTL expiry, LRU eviction, explicit
invalidation and generation cleanup can remove the last entry without a provider outcome. The
snapshot can then remain `degraded_cached_only` while no exact request is serviceable.

Give each provider instance a cache-inventory authority or derive cache-only state at snapshot time
from generation-valid cache metadata. Add last-entry expiry/eviction/invalidation fixtures and
prove `/capabilities` changes without treating cache reads as health checks.

## Required amendment order

1. Split logical provider family from concrete provider instance/operation identity.
2. Publish the total state/snapshot/mode unions, including clean-start unverified behavior.
3. Add the literal compiler-owned rendering-provider dependency and whole-pipeline deadline model.
4. Publish a closed provider operation result and drive health/caches through it.
5. Claim and specify the run-schema receipt lane, or explicitly remove durable Review/export claims.
6. Make cache inventory part of the state authority and rerun the six controls plus R18.
7. Repeat independent review before implementation.

No owner ruling is required: the owner already required honest full 1.0 behavior, and these are
mechanical contradictions against that ruled scope. No production, protected design, schema or
content byte changed in this review.
