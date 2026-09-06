# RFC: Provider health and honest degradation

- **Status:** **draft — RETURNED by eleventh fresh independent review on [[D2942]]–[[D2949]].**
  The tenth repair's seven fixes survive, but group membership is copied, predecessor mutation and
  coordinator registration/reset are public, group settlement accepts caller-authored truth, the
  exact-cache operation arm and reason-bearing wire shape are incomplete, and monotonic duration is
  published as civil time. `make provider-health-eleventh-fresh-review` retains the complete chain
  and passes 8/8 fresh counterexamples. A bounded author repair, another genuinely fresh review and
  the provider-protocol/exchange prerequisites precede either implementation checkpoint.
- **Author:** Codex on the owner's O13 Choice-C ruling
- **Created:** 2026-08-27
- **Design refs:** `design/02-product-shape.md` deployment axis; `design/03-product-breadth.md` B4/B8; `design/05-in-run-experience.md` assistance/source-risk boundary
- **Exploration gate:** O13 / D616 selected the stronger appliance floor; R18 reproduced D609 by stopping Maia while `/capabilities` stayed green
- **Depends on:** implemented `rfc/archive/evidence-contract-manifest.md` and
  `rfc/archive/engine-request-contract.md`; draft `rfc/provider-protocol-register.md` followed by
  `rfc/provider-exchange-and-execution.md` for the shared operation declarations this RFC extends;
  F12-A's deployment readiness boundary
- **Parent / amends:** current `/capabilities`, `EngineCapabilities`, evidence-manifest availability, engine supervisor, opponent selector, corpus/tablebase/voice/TTS clients
- **Supersedes / superseded by:** —
- **Planning:** `planning/provider-health-degradation/` (once implementing)

```tabiya-claims
run-schema | lane 0.26 | $defs/opponentSelection.acquisition carries the sealed provider-exchange delivery (new, optional for pre-0.26 reads and required on every new opponent.move_selected write); DrillRunEvent gains opponent.selection_failed and opponent.recovery_requested
```

## Summary

Tabiya 1.0 reports what each optional provider can do **now**, for the exact operation being asked,
rather than treating configuration or an old cached answer as health. One server-owned provider
registry receives engine-supervisor transitions and every remote-provider outcome, applies bounded
circuit breaking, and projects that state through F1's existing producer→projection→consumer
manifest. It does not create a second capability registry.

Every provider-backed response carries a receipt naming the provider generation and whether the
answer was live, cached, local-fixture, or deterministic fallback. Cached service is exact-request
service only. It never proves that a new position can be served. A provider failure is bounded by
the consuming operation's declared F1 deadline, changes live capability state, and reaches the
learner as an honest unavailable/degraded module or paused opponent choice—never as silent
Stockfish-for-Maia, corpus-for-theory, or LLM-authored chess truth.

## Motivation

R18 stopped the Maia sidecar after a successful request. `/capabilities` continued to advertise
Maia and all dependent modes. The exact cached request returned in 2 ms, while a new position sent
zero bytes before the ten-second client probe stopped waiting. The capability response remained
green. D609 records that production-boundary failure.

The source makes the cause explicit:

1. `EngineCapabilities` converts configured engine identities and constructor flags directly into
   availability. External voice, TTS, Explorer and tablebase can therefore be “available” before a
   request has ever succeeded.
2. `evidenceManifestCapabilities` converts those static strings into F1 producer availability. A
   manifest binding is exact, but its runtime premise is not.
3. `OpponentSelector` retains an unbounded process-lifetime promise cache. Its key omits engine/model
   generation, and its response does not distinguish cache from live inference (D1848).
4. Maia receives a 60-second request timeout. Voice makes two independently timed provider calls,
   so its operation can spend two provider budgets before deterministic fallback.
5. Existing corpus and tablebase clients already have useful queue, timeout, typed-error and
   bounded-cache pieces, but neither reports request outcomes to the capability authority. A cache
   hit can hide a dead upstream.

The repair must preserve two distinctions that are evidence semantics, not operator decoration:

- **provider unavailable** is different from **provider answered that this position is outside its
  domain or has insufficient data**;
- **a cached answer for this exact request exists** is different from **the provider can answer a
  new request**.

The Lichess API asks clients to make one request at a time and, after HTTP 429, wait a full minute
before resuming: <https://lichess.org/api#section/Introduction/Rate-limiting>. The implementation
therefore coordinates backoff per upstream rather than letting each learner retry independently.
Abort propagation uses the platform `AbortSignal` contract; an abort caused by the caller leaving
the operation is not evidence that the provider is unhealthy:
<https://nodejs.org/download/release/latest-v24.x/docs/api/globals.html#class-abortsignal>.

### Scope

This RFC owns:

1. one runtime provider registry and its state machine;
2. provider/request receipts and a closed failure-reason vocabulary;
3. deadlines, cancellation, concurrency, circuit opening and recovery;
4. generation-aware bounded caches for opponent selection and integration of existing provider
   caches;
5. live `/capabilities` output and the F1 availability join;
6. honest client behavior for opponent selection, evidence modules, external voice and TTS;
7. liveness/readiness/capability semantics and production-boundary failure/recovery tests.

### Non-goals

- choosing or grading chess moves, ranking evidence, creating hints, or adding a detector;
- deciding presets, assistance ceilings, bot personalities, or campaign encounters;
- making an optional Internet provider mandatory for a core 1.0 journey;
- provider billing, secret rotation UI, distributed tracing, a general metrics platform, or a
  multi-node circuit-breaker service;
- silently improving availability by changing provider kind;
- promising that an old cached response remains valid after provider/model generation changes.

## Specification

### 1. Closed provider identities

One application-lifetime `ProviderRegistry` separates a learner-meaningful family from the concrete
process/upstream instance whose generation and health can change independently:

```ts
type ProviderFamilyId =
  | "stockfish"
  | "maia"
  | "tablebase"
  | "explorer"
  | "voice"
  | "tts";

type ProviderInstanceId =
  | "stockfish-play"
  | "stockfish-analysis"
  | "maia-inference"
  | "tablebase-primary"
  | "explorer-primary"
  | "external-voice"
  | "external-tts";

type ApplicationProviderOperationId =
  | "opponent.stockfish_play"
  | "opponent.maia_inference"
  | "evidence.stockfish_analysis"
  | "evidence.tablebase_probe"
  | "evidence.explorer_query"
  | "render.voice"
  | "render.voice_compare"
  | "render.voice_story"
  | "review.reasoning"
  | "render.speech";

type ProviderBackoffGroupId =
  | "lichess-api"
  | "external-voice-api"
  | "external-tts-api";

type ProviderImplementation =
  | "uci_sidecar"
  | "lichess_http"
  | "external_http"
  | "local_service"
  | "local_fixture";
```

`PROVIDER_INSTANCE_DECLARATIONS` is one closed literal tuple of
`{instanceId, familyId, allowedImplementations, backoffGroup}` rows. `backoffGroup` is null for
process-local UCI instances, `lichess-api` for both remote Explorer and tablebase instances, and
the corresponding external group for voice/TTS. The configured-instance value selects
exactly one member and the generation digest binds that selection. `local_fixture` is admitted only
by the test factory and the release compiler rejects it; `local_service` is the production-local
member. This is the durable route for [[D2362]]. `stockfish-play` and `stockfish-analysis` are two
rows with independent options, workloads, handshakes, circuits and generations. A family is only a
display/grouping identity; health is never stored or inferred at family level. Maia is the
`maia-inference` instance. Tablebase and Explorer name their current upstream instances; a later
local implementation changes the configured implementation within the instance's allowed set and
moves generation rather than reusing remote health. Voice and TTS are operational instances but
never chess-evidence producers.

`APPLICATION_PROVIDER_EXECUTION` is the compiler-owned application-operation→provider-exchange
authority described in §8. `ProviderOperationId`, `ProviderAcquisitionReceipt`, normalized request
identity, parsed payload and retained delivery remain owned by
`provider-exchange-and-execution`; this RFC does not redeclare or reconstruct them. Every health
admission and stage settlement retains the sealed provider-exchange operation and delivery beside
the concrete instance and application operation. Ordinary copy may group failures by family, but no operation asks “is Stockfish healthy?”
without selecting play or analysis. Independent death/restart fixtures cross both Stockfish
instances: analysis failure cannot disable `opponent.stockfish_play`, and play recovery cannot mark
`live.stockfish` analysis available.

Mock/test providers use `local_fixture` and publish that implementation literally. They must never
be serialized as `maia`, `stockfish`, `lichess_http`, or `external_http`, including in development
screenshots and production smoke tests.

Configuration answers only whether a provider exists and which implementation is intended. It
does not answer health. The current `CapabilityProviders` strings may remain during migration only
as a projection of the registry snapshot; no server or client branch may continue to use
constructor presence as authority after criterion 7.

### 2. State model

```ts
type ProviderFailureReason =
  | "startup"
  | "process_exit"
  | "timeout"
  | "network"
  | "rate_limited"
  | "overloaded"
  | "authentication"
  | "protocol"
  | "cancelled_by_shutdown";

interface ProviderTimes {
  readonly checkedAt: string;
  readonly lastSuccessAt: string | null;
  readonly lastFailureAt: string | null;
}

type ProviderHealthSnapshot =
  | {
      readonly instanceId: ProviderInstanceId;
      readonly familyId: ProviderFamilyId;
      readonly state: "not_configured";
    }
  | {
      readonly instanceId: ProviderInstanceId;
      readonly familyId: ProviderFamilyId;
      readonly state: "unverified";
      readonly implementation: ProviderImplementation;
      readonly generation: string;
      readonly retryAfterMs: null;
    }
  | ({
      readonly instanceId: ProviderInstanceId;
      readonly familyId: ProviderFamilyId;
      readonly state: "recovering";
      readonly implementation: ProviderImplementation;
      readonly generation: string;
      readonly priorReason: ProviderFailureReason;
      readonly consecutiveSuccesses: 1;
      readonly requiredSuccesses: 2;
      readonly retryAfterMs: null;
    } & ProviderTimes)
  | ({
      readonly instanceId: ProviderInstanceId;
      readonly familyId: ProviderFamilyId;
      readonly state: "available";
      readonly implementation: ProviderImplementation;
      readonly generation: string;
      readonly reason: null;
      readonly retryAfterMs: null;
    } & ProviderTimes)
  | ({
      readonly instanceId: ProviderInstanceId;
      readonly familyId: ProviderFamilyId;
      readonly state: "degraded_cached_only";
      readonly implementation: ProviderImplementation;
      readonly generation: string;
      readonly reason: ProviderFailureReason;
      readonly retryAfterMs: number | null;
      readonly cacheScope: "exact_request";
      readonly validExactEntries: number;
      readonly cacheRevision: number;
    } & ProviderTimes)
  | ({
      readonly instanceId: ProviderInstanceId;
      readonly familyId: ProviderFamilyId;
      readonly state: "unavailable";
      readonly implementation: ProviderImplementation;
      readonly generation: string;
      readonly reason: ProviderFailureReason;
      readonly retryAfterMs: number | null;
      readonly cacheScope: "none";
    } & ProviderTimes);

type ProviderOperationAvailability =
  | { readonly state: "available"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "requestable_unverified"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "recovering"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "conditional_exact_cache"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "cached_exact_only"; readonly instanceIds: readonly ProviderInstanceId[] }
  | { readonly state: "temporarily_blocked"; readonly instanceIds: readonly ProviderInstanceId[]; readonly reason: "upstream_backoff" | "group_claimed"; readonly retryAfterMs: number }
  | { readonly state: "unavailable"; readonly instanceIds: readonly ProviderInstanceId[]; readonly reason: ProviderFailureReason | "not_configured" };
```

`conditional_exact_cache` is the request-free capability projection: at least one current-generation
cache row exists, but no particular request has been proven serviceable. `cached_exact_only` is
available only from the atomic resolution of the exact registry-issued request/cache key and is
never serialized by a requestless `/capabilities` read. `temporarily_blocked` is derived from the
same current group projection that owns admission; per-instance health remains unchanged.

The transitions are closed:

- absent configuration → `not_configured`;
- configured external HTTP provider with no real outcome → `unverified`;
- successful live request, or a completed UCI startup handshake for the current supervised
  generation → `available`, except the first success after the repeat-open threshold enters
  `recovering`;
- live failure with at least one valid exact-request cache entry → `degraded_cached_only`;
- live failure with no valid exact-request cache entry → `unavailable`.

`not_configured` has no implementation, generation, timestamps, reason or invented cache state.
Every other arm exposes only fields meaningful for that state; illegal combinations do not parse.
`unverified` is deliberate. Voice/TTS/Explorer/tablebase are not probed with invented chess data,
learner text, or billable prompts merely to paint a green badge. Their first real request verifies
them. A local UCI `uci`/`isready` handshake is an actual protocol operation and may establish
availability before the first chess request.

`requestable_unverified` is the clean-start operation state. It keeps the ordinary control enabled
with neutral copy (“Ready to try”) and allows exactly the learner's real request through the normal
deadline/circuit path. It never advertises a verified live provider. Success or failure moves the
next snapshot to a corresponding total arm. `/capabilities` itself never triggers that request.

The instance-global state never claims that a cached entry applies to the current request. Every
operation separately resolves `live`, `cached_exact`, or unavailable. `degraded_cached_only` must
always publish `cacheScope: "exact_request"`; clients may not turn it into a generally enabled
feature.

`recovering` is never used for clean start. It preserves the prior failure reason and full outcome
times with `consecutiveSuccesses:1/requiredSuccesses:2`. A second consecutive live success for the
same generation reaches `available`; an intervening failure returns to degraded/unavailable and
zeros recovery; generation change returns to clean `unverified`; restart reconstructs clean-start
state rather than claiming an old recovery streak. Cache hits never advance it.

`checkedAt` exists only after a real outcome and changes only on a real handshake/request outcome. Reading `/capabilities`, reading a
cache entry, rendering deterministic text, and a browser polling the server do not refresh it.

An internal registry snapshot also retains sealed `stateRevision` and
`observedAtMonotonic` authority. Currentness is not object identity: any number of snapshots
issued over the same revision and equal time-derived state remain valid concurrently. Every
admission, selector and release-receipt operation receives the current injected monotonic sample
and recomputes the time-derived projection. A health/cache/generation mutation, or crossing a
retry/cache-expiry boundary that changes projected state, refuses the old snapshot and requires a
new one. Merely issuing another equal read-only snapshot revokes nothing.
`observedAtMonotonic` is process-local authority and is never serialized on
`/capabilities`; `generatedAt` remains display-only civil time.

### 3. Generation and identity

Every configured provider has a stable generation digest:

```text
sha256(provider instance id | family id | implementation | endpoint/engine id | immutable model/engine identity |
       behavior-affecting options | supervisor start generation)
```

Secrets and bearer tokens are excluded from the digest and all receipts. A secret/config rotation
changes generation through a non-secret configuration revision. UCI process restart always changes
the supervisor generation even when the engine binary/version is identical. A model, endpoint,
engine binary, weight digest, Elo implementation, or behavior-affecting option change also changes
generation.

Generation is per `ProviderInstanceId`, never per family. Generation change atomically:

1. moves the provider to `unverified` (external) or `startup`/unavailable until UCI handshake;
2. cancels or lets finish—but never publishes—old-generation in-flight work;
3. invalidates every cache entry whose key names the old generation;
4. causes a late old-generation result to be discarded rather than healing the new generation.

The generation-change operation refuses an equal generation string even when implementation also
changes. Its configured identity is derived by the composition root rather than accepted as an
arbitrary opaque label. Backoff-group member images retain instance, implementation and generation,
so a behavior-affecting configuration change cannot inherit an old upstream claim.

### 4. Provider-exchange input and application settlement

Provider exchange owns the low-level operation id, normalized request digest, acquisition receipt,
parsed payload receipt and live/retained delivery. Provider health consumes those sealed values and
adds only application-stage state. The provider-protocol successor must add the three external
exchange operations `external_voice.render@1`, `external_voice.reasoning_review@1` and
`external_tts.synthesize@1` beside the five chess-source operations already specified by
`provider-exchange-and-execution`. Their request/result maps are exact; no generic HTTP payload or
health-owned acquisition receipt exists.

```ts
type ProviderStageSettlement<K extends ProviderOperationId, T> =
  | { readonly kind: "success"; readonly stageId: string;
      readonly delivery: ProviderDelivery<T, K> }
  | { readonly kind: "local_domain"; readonly stageId: string;
      readonly result: ProviderLocalDomainResult<K> }
  | { readonly kind: "failed"; readonly stageId: string;
      readonly result: ProviderSourceFailure<K> }
  | { readonly kind: "cancelled"; readonly stageId: string;
      readonly reason: "caller" | "superseded" | "shutdown" };

type ApplicationProviderOutcome<T> =
  | { readonly kind: "complete"; readonly value: T;
      readonly settlement: ProviderStageSettlement<ProviderOperationId, unknown> }
  | { readonly kind: "fallback"; readonly value: T;
      readonly source: "deterministic_renderer" | "browser_speech_or_text";
      readonly settlement: ProviderStageSettlement<ProviderOperationId, unknown> }
  | { readonly kind: "unavailable";
      readonly settlement: ProviderStageSettlement<ProviderOperationId, unknown> }
  | { readonly kind: "cancelled"; readonly reason: "caller" | "superseded" | "shutdown";
      readonly settlement: ProviderStageSettlement<ProviderOperationId, unknown> };
```

`settleOperation` accepts `unknown` and crosses one exact discriminated-union parser before
reading or mutating application state. Every arm rejects missing and extra keys. The
`local_domain` arm contains a sealed `ProviderLocalDomainResult<K>` issued by provider exchange
from the same request; an application caller cannot author its value or reconstruct it
structurally. Operation, instance, implementation, generation and normalized-request identity are
equal across request, result and compiled stage before the application outcome is formed.

The compiler fixes exactly one settlement to the selected application declaration. Voice rendering
and speech are two independent application operations. Speech consumes a sealed reference to text
that was already rendered and displayed; it does not execute voice or retain a synthetic earlier
stage. A TTS failure therefore returns the speech operation's browser-speech/text fallback while
the earlier rendering operation keeps its own outcome. A failed no-fallback operation is
unavailable. Caller/superseded cancellation never heals or damages provider health. Provider
failures update only the instance named by their sealed exchange result. This resolves [[D2583]] by
preserving both real operation outcomes rather than inventing a mixed pipeline the request graph
does not have.

The sealed exchange delivery describes acquisition, not chess quality. It cannot say accurate,
human, best, practical, insightful or trustworthy. Existing evidence payload provenance remains
intact; health and settlement do not replace engine identity, query population, tablebase domain or
F1 evidence identity. Deterministic fallback is legal only over an already sealed evidence view and
never becomes provider output.

### 5. Operation deadlines and cancellation

One deadline covers queue time, connection, provider work, response parsing, validation, any retry,
and receipt construction. Nested clients receive the remaining budget through one `AbortSignal`;
they may not start a fresh timeout after an earlier attempt consumed time.

The hard ceiling is the latency contract of the compiled F1 consumer binding. Provider-specific
defaults may be lower. In particular:

- `opponent.selection` must finish or return a typed unavailable result within its compiled
  interactive ceiling; Maia's current 60,000 ms timeout is deleted;
- a second Maia query used to repair an incomplete MultiPV response shares the same original
  deadline and counts as a retry;
- the two current voice attempts share one total budget, including deterministic fallback
  construction;
- Explorer/tablebase queues count waiting time and reject before starting work when the remaining
  deadline cannot admit a request;
- server shutdown aborts outstanding work with `cancelled_by_shutdown` and does not trigger a
  restart storm.

A browser/client disconnect, navigation cancellation, superseded request, or explicit learner
cancel is recorded on the operation but does **not** mark the provider unhealthy. Timeout after the
provider received work, process exit, network failure, protocol-invalid output, authentication
failure, 429, and provider overload do.

There is no automatic cross-provider retry. An idempotent request may retry the **same** provider at
most once only when the circuit remains closed, the error is transient, and the complete operation
deadline still admits it. Authentication, protocol-invalid output, 429, open-circuit and process
exit are not immediately retried.

### 6. Circuit opening, backoff and recovery

The registry keeps health/circuit state per provider-instance generation and a separate
`ProviderBackoffCoordinator` per non-null `ProviderBackoffGroupId`. Instance health never merges;
only admission concurrency, `retryAfter` and backoff sequence are group-shared:

- process exit, failed UCI handshake, authentication failure, or protocol-invalid output opens the
  circuit immediately;
- timeout, network failure or overload opens it for new interactive work immediately after the
  failing operation; existing exact cache entries remain readable;
- Lichess HTTP 429 opens `lichess-api` for both `tablebase-primary` and `explorer-primary` for at
  least 60 seconds. `Retry-After`, when valid and
  longer, wins. Only one request at a time is sent to that upstream;
- other HTTP 5xx/network failures use 5 s, 15 s, then 60 s delays, capped at 60 s; successful live
  work resets the sequence;
- authentication/protocol failures remain open until generation/configuration changes or an
  explicit operator retry starts one half-open request.

While open, one request after `retryAfterMs` becomes the half-open real request. Concurrent callers
receive the typed current state or an exact cached answer; they do not form a retry herd. UCI
supervisor recovery uses its actual restart handshake as the half-open operation.

The internal immutable reducer state retains `generation`, circuit arm, last failure, a sorted
`transientOpenTimesMonotonic` vector, `retryAtMonotonic`, the current half-open token and recovery
progress. Every transition receives an injected monotonic sample. Before any transition, opens with
`now - openedAt >= 300_000` are removed. Only timeout, network, rate-limit and overload opens enter
that vector. Authentication/protocol opens carry `retryAtMonotonic:null` and require an explicit
operator claim or generation change. A process/application restart reconstructs unverified state;
generation change clears the vector and every claim. Civil timestamps are projection-only and
never decide duration. This is the complete operand set for [[D2579]].

Each backoff group has exactly one immutable `{blockedUntilMonotonic, claim}` state. A claim is
`{groupGenerationImage, claimToken, leaseExpiresAtMonotonic}`. The image is the sorted exact set
of configured `{instanceId, implementation, generation}` members in that compiled group and its
digest; it carries no whole-registry or unrelated-cache revision. `acquire` first expires an elapsed claim,
then returns exactly `blocked`, `claimed`, or a newly tokenized claim. `renew` and `settle` require
the equal live token and group image before expiry; stale/expired calls fail and cannot clear or
extend a successor. `settle(rate_limited)` clears the claim and advances the block to at least
`now + 60_000` or a longer valid Retry-After. Abort/throw/crash leaves the lease to expire, after
which one successor is admitted. A generation-set change invalidates the claim before admission.
A 429 from Explorer therefore delays a new tablebase request while their instance snapshots remain
distinct. Null-group UCI instances never share a coordinator. Group membership is compiled from
`PROVIDER_INSTANCE_DECLARATIONS`; an undeclared string or second hand map fails closure
([[D2417]], [[D2580]]).

One successful half-open request normally changes `unavailable` to `available`. After two transient
opens inside the retained five-minute window, the matching token's first live success produces
`recovering(1/2)` and the next consecutive live success heals. A failure reopens and resets progress;
window expiry makes two distant failures independent. Cache hits never count.

### 7. Cache contract

All provider caches use bounded LRU entries and generation-complete keys. A cache key is an opaque
registry-issued capability derived from one compiled application declaration, its exact stage and
one sealed provider-exchange request. The issuer binds application operation, stage, exchange
operation, instance, implementation, generation, normalized request and cache digest. `put` and
`resolveExact` require that same issued object and owning registry; a spread, JSON round-trip,
structurally equal object or application/stage relabel fails before touching cache state. The opponent cache is
changed from an unbounded `Map<string, Promise<OpponentSelection>>` to:

- maximum 512 settled entries plus at most the bounded in-flight population;
- a key containing current request/policy/history identity **and** the exact provider generations
  used by the selected mode;
- in-flight coalescing separate from settled entries, so a rejected promise is never retained;
- an explicit TTL chosen per mode during implementation and no longer than 24 hours; the release
  resource matrix may lower size/TTL, never remove the bound;
- a receipt on every result distinguishing `live` from `cached_exact`;
- invalidation on generation change.

Every settled cache implements one registry-owned read interface; the registry never trusts a
cached boolean copied at request time:

```ts
interface ProviderCacheInventory {
  snapshot(nowMonotonicMs: number): readonly {
    readonly operation: ProviderOperationId;
    readonly applicationOperationId: ApplicationProviderOperationId;
    readonly stageId: string;
    readonly instanceId: ProviderInstanceId;
    readonly generation: string;
    readonly cacheKeyDigest: string;
    readonly normalizedRequestDigest: ProviderRequestDigest;
    readonly expiresAtMonotonicMs: number;
    readonly validExactEntries: 1;
    readonly revision: number;
  }[];
  resolveExact<K extends ProviderOperationId, T>(input: {
    readonly operation: K;
    readonly applicationOperationId: ApplicationProviderOperationId;
    readonly stageId: string;
    readonly instanceId: ProviderInstanceId;
    readonly generation: string;
    readonly normalizedRequestDigest: ProviderRequestDigest;
    readonly cacheKeyDigest: string;
    readonly nowMonotonicMs: number;
  }):
    | { readonly kind: "miss" }
    | { readonly kind: "hit"; readonly value: T;
        readonly original: ProviderDelivery<T, K>;
        readonly cacheServiceReceipt: {
          readonly source: "retained_exact";
          readonly cacheKeyDigest: string;
          readonly servedAtMonotonicMs: number;
          readonly revision: number;
        } };
}
```

`snapshot` first expires TTL-invalid rows and retains only entries whose generation equals the
current instance generation. Insert, TTL expiry, LRU eviction, explicit invalidation and generation
cleanup monotonically advance `revision`. `ProviderRegistry.snapshot()` joins its last real outcome
with this current inventory on every read. It may report conditional exact-cache service when any
current row exists, but request admission calls `resolveExact` with all six identities; a count
never enables a different operation or key. A failed instance is `degraded_cached_only` only as a
global conditional capability; the exact operation result is `cached_exact_only` only after
`resolveExact` atomically returns the immutable payload, its original sealed exchange delivery and
the current cache-service receipt. There is no second lookup and no caller may assemble or replace
the origin after admission ([[D2581]]). The join is in-memory and cannot call a provider or refresh `checkedAt`.
Thus removal of the last entry changes `/capabilities` even when no new provider outcome occurred, and
three voice operations sharing `external-voice` remain disjoint by operation/request digest
([[D2414]]).

The existing 512-entry Explorer/tablebase caches become registry-aware. Their present no-data,
failure and successful-result TTLs may remain only if fixtures prove:

1. `no_data_at_band` / out-of-domain is a successful domain answer and does not mark a provider
   unhealthy;
2. HTTP/network/protocol failure does mark it unhealthy and is not rewritten as no data;
3. a cache hit returns `cached_exact` and does not update `checkedAt`;
4. stale-generation and expired entries cannot serve;
5. an open circuit never prevents an exact valid cached read, but does prevent a new live request.

Cached Stockfish/Maia selections are replayable opponent choices, not current provider evidence.
They preserve the original engine/model receipt inside the current cache-acquisition receipt. Review
and export can therefore say what actually selected the move without claiming the provider is live.

### 8. F1 availability join

F1 remains the sole producer→projection→consumer authority. `evidenceManifestCapabilities` stops
accepting `CapabilityProviders` and accepts a frozen `ProviderRegistrySnapshot`. The mapping is
closed:

| F1 producer | Provider |
|---|---|
| `live.stockfish` | `stockfish-analysis` |
| `live.syzygy` | `tablebase-primary` |
| `human.maia` | `maia-inference` |
| `human.explorer` | `explorer-primary` |

All other F1 producers remain local/recorded/build-time and are unaffected. Voice/TTS attach to the
already declared `guidance.voice`, `guidance.voice_compare`, and `guidance.voice_story` rendering
operations; they do not acquire evidence-producer ids.

The attachment is one runtime/compiler authority, not a server map:

```ts
interface ProviderExecutionStage {
  readonly stageId: string;
  readonly instanceId: ProviderInstanceId;
  readonly exchangeOperation: ProviderOperationId;
  readonly fallback: "none" | "deterministic_renderer" | "browser_speech_or_text";
}

interface ProviderExecutionDeclaration {
  readonly operationId: ApplicationProviderOperationId;
  readonly consumer: { readonly id: string; readonly version: number };
  readonly stage: ProviderExecutionStage;
  readonly deadline: "consumer_budget";
}
```

The literal declaration contains exactly these ten application operations. Each operation has one
stage whose id is part of every health/cache join; provider-exchange identity stays in
the sealed delivery rather than being reconstructed:

| operation | stages in order |
|---|---|
| `opponent.stockfish_play` | `select:stockfish-play` → `stockfish.legal_root_table@1` |
| `opponent.maia_inference` | `select:maia-inference` → `maia.policy_page@1` |
| `evidence.stockfish_analysis` | `analyse:stockfish-analysis` → `stockfish.position_evaluation@1` |
| `evidence.tablebase_probe` | `probe:tablebase-primary` → `syzygy.position@1` |
| `evidence.explorer_query` | `query:explorer-primary` → `lichess_explorer.position_page@1` |
| `render.voice` | `text:external-voice` → `external_voice.render@1` |
| `render.voice_compare` | `text:external-voice` → `external_voice.render@1` |
| `render.voice_story` | `text:external-voice` → `external_voice.render@1` |
| `review.reasoning` | `review:external-voice` → `external_voice.reasoning_review@1` |
| `render.speech` | `audio:external-tts` → `external_tts.synthesize@1` |

Speech is a first-class HTTP/application operation because production requests it independently.
Its request contains a brand-sealed rendered-text reference—text digest, run, node and all five
voice scopes, including Compare—issued by the voice/deterministic renderer operation. It never calls
external voice again. A plain/spread/JSON/cross-run reference fails before TTS. Thus audio cannot
silently differ from displayed text and voice/TTS do not receive fresh nested deadlines
([[D2576]]). `review.reasoning` is an independent non-evidence egress with a typed valid-empty arm;
provider failure is unavailable, never rewritten to an external empty answer ([[D2575]]).

`APPLICATION_PROVIDER_EXECUTION` is compiled beside the F1 manifest and keyed to operations in the
provider-protocol resource. An independent ten-member obligation tuple is set-equal to it. The
compiler consumes the candidate declaration passed to it and rejects missing, extra, duplicate and
count-preserving replacement operations; crossed instance/exchange mappings; unknown consumers;
illegal fallbacks; and absent consumer-budget deadlines.
The web/server import only the compiled image. This is the executable closure required by [[D2577]].

The compiler rejects an unknown instance/operation/consumer, missing or duplicate operation,
an unknown or crossed stage, absent total-deadline source, and a fallback not legal for that stage.
It also proves every
provider-backed F1 producer and each of the three voice consumers has exactly one execution path.
Server wrappers and the web capabilities parser consume the compiled image; neither owns a copied
provider list. Because this tuple consumes and extends the provider-protocol resource, this RFC cannot be
accepted until `provider-protocol-register` lands, provider exchange lands lane 1, and this RFC
atomically claims the next provider-protocol lane for the three external exchange identities plus
the ten application execution members.

Producer availability preserves operational state and derives the consumer result through its
compiled `providerOff` behavior:

- `available` provider → projection may be requested;
- `unverified` → request may be attempted within its deadline, but a consumer is never advertised
  as already live;
- `recovering` → request may be attempted one-at-a-time within its deadline, while the consumer is
  labelled recovering rather than verified;
- `degraded_cached_only` → only an exact-key lookup can be available; otherwise apply `providerOff`;
- `not_configured` / `unavailable` → apply the consumer's existing `available`, `honest_empty`, or
  `unavailable` behavior.

`honest_empty` remains a **consumer rendering outcome**, not provider health. Tablebase
out-of-range and Explorer `no_data_at_band` are typed domain outcomes with a healthy provider.
Provider-off cannot be worded as “no games found” or “outside tablebase range.”

The compiler gets a closure assertion: every provider-backed F1 producer maps exactly once; every
mapping names a real registry provider; no provider-backed producer can default to local available;
and voice/TTS dependencies are attached to their real rendering operations. The existing static
provider branches in `apps/web` are migration failures once this assertion lands.

### 9. `/capabilities`, liveness and readiness

`GET /capabilities` is an uncached/no-store snapshot from the one registry and F1 compiler. It adds:

```ts
interface RuntimeCapabilities {
  readonly generatedAt: string;
  readonly providers: readonly ProviderHealthSnapshot[];
  readonly policyModes: readonly {
    readonly mode: RunOpponentMode;
    readonly availability: ProviderOperationAvailability;
  }[];
  readonly evidenceManifest: EvidenceManifestCapabilities;
}
```

This exact closed wire type and its strict unknown-input parser live in runtime and are imported by
both the server producer and web client. `requestable_unverified` is preserved on the wire; it is
not widened to `available` or collapsed into `unavailable`. Unknown states, instance ids, reasons,
extra fields and a server-only mode addition fail the shared parser/producer set-equality fixture.

The route does not probe providers. It may therefore become stale between request start and the
operation; the operation receipt is authoritative for that operation, and its outcome updates the
next snapshot. Static frontend checks such as `providers.opponent !== "none"` are deleted. Controls
remain visible where the workflow needs them but show unavailable/degraded state, reason and retry;
they do not disappear and rearrange the board when a provider drops.

`/healthz` remains process liveness and never fails because an optional provider is absent.
F12-A's `/readyz` reports core storage/runtime readiness. Optional provider loss is included in its
body but does not change readiness to failure. A configured provider marked required by a later
deployment contract may affect readiness only through that explicit profile; no such required
optional provider exists in Choice-C core 1.0.

### 10. Learner and operator behavior

Ordinary learner surfaces translate state into the task, not infrastructure prose:

- if the selected opponent cannot answer, the run pauses before an opponent move is committed and
  offers Retry or Change opponent; it never auto-plays Stockfish, a random legal move, or a stale
  different-position answer;
- an exact cached opponent reply may continue only with its `cached_exact` receipt retained. The
  compact learner copy is “Using a saved response for this position”; Inspector names generation,
  source and time;
- Support/Review evidence modules render their compiled honest-empty/unavailable state in place.
  The board and primary action keep stable geometry; raw failure strings never enter the module;
- Explorer no-data, tablebase out-of-range, provider unavailable and cache-only are four different
  states and use different copy/actions;
- external voice failure falls back to the accepted deterministic renderer when available and
  identifies the result as deterministic. It never claims the provider spoke or adds a chess
  assertion;
- TTS failure preserves the text, offers browser speech only when the learner's preset permits it,
  and does not repeatedly re-request audio;
- settings and mode pickers show what the deployment can currently serve, while Advanced Inspector
  exposes timestamps/generation/reason. Ordinary play never dumps provider JSON.

No provider transition changes an assistance ceiling. A recovered provider makes a module
available only when the active preset, session kind, role and disclosure state already permit it.

Opponent failure is a run transition, not a controller string. When selection fails after the
learner move was committed, the server appends `opponent.selection_failed` with the exact learner
move event sequence, sealed normalized request digest and closed safe failure reason. The client
enters an in-place `opponent_failed` state keyed by that event and shows Retry/Change opponent
without moving or resizing the board.

`POST /runs/:id/opponent-recovery` accepts exactly one of:

```ts
type OpponentRecoveryRequest =
  | { readonly action: "retry"; readonly failureEventSeq: number;
      readonly idempotencyKey: string; readonly requestDigest: ProviderRequestDigest }
  | { readonly action: "change"; readonly failureEventSeq: number;
      readonly idempotencyKey: string; readonly opponentPolicy: RunOpponentPolicy };
```

The route resolves the failure against the current branch/cursor and requires that its named
learner ply is still the last committed move with no later opponent selection. Retry must retain
the equal request/policy identity. Change validates a genuinely different policy, derives its new
policy-config digest server-side and appends `opponent.recovery_requested` with before/after policy
digests. That event changes the run's **effective** opponent policy from its sequence onward; it
does not rewrite the original `run.started`, root `opponentPolicy` or `sessionDigest`. Review/export
show both the initial identity and the recorded change. The subsequent selection request starts
from the existing after-learner FEN and history, so the learner move is never replayed. Equal
idempotency keys return the same recovery event/result; a crossed failure, moved cursor, duplicate
opponent ply, changed retry digest or reused key with unequal input fails. This is the durable
journey required by [[D2582]].

### 11. Logging and privacy

Each transition logs a structured event with family id, instance id, generation prefix, previous/new state,
reason, operation id, duration, cache source and retry delay. It excludes FEN, PGN, learner text,
voice prompt/output, token, endpoint query string, account id and full model path. Provider-specific
debug logging remains opt-in and outside the default release profile.

No persistent health history is required for 1.0. Process-restart state begins from configuration
and real handshakes/outcomes; it does not claim yesterday's provider is currently healthy. Aggregate
metrics may be added later without changing this state authority.

## Second fresh independent return (2026-08-31)

The first repair survives at its named seams, but the complete operation still returns six
buildability blockers. Exact evidence and executable controls are in
`planning/provider-health-degradation/second-fresh-independent-buildability-review-2026-08-31.md`.

1. **[[D2412]]:** result, operation, instance, generation and cached-origin identities are not
   correlated by the normative type or parser contract.
2. **[[D2413]]:** `unverified` represents both never-tried and a successful first recovery probe,
   while carrying none of the outcome/recovery state needed for the second-success rule.
3. **[[D2414]]:** instance-wide cache counts cannot establish operation- or request-specific cache
   availability, especially for the three operations sharing `external-voice`.
4. **[[D2415]]:** `local_service` is a production implementation with no origin-receipt
   representation.
5. **[[D2416]]:** the nine-id operation union has only eight described execution members;
   `render.tts` is orphaned.
6. **[[D2417]]:** per-upstream rate-limit coordination has no upstream/backoff-group identity.

`make provider-health-second-fresh-review` passes 6/6. Neither the claim-free runtime checkpoint nor
the lane-0.26 persistence checkpoint may land until an author repair inverts these controls and
another fresh review passes.

## Third author repair (2026-09-02)

The six returned seams are now one compiler-owned contract rather than six prose exceptions:

1. **[[D2412]]:** `ProviderOperationStageRoute` is derived from the literal execution declaration.
   Every result, origin and cached origin carries the same route, configured implementation,
   generation and request digest; the unknown-input parser rejects any crossed identity.
2. **[[D2413]]:** `recovering` is an explicit outcome-bearing state. It retains the prior reason,
   first-success timestamps and `1/2` progress; only the second consecutive live success heals.
3. **[[D2414]]:** cache inventory and lookup use exact
   operation/stage/instance/generation/request/key identity. Global capability may say exact-cache
   service exists, but only the operation lookup may say this request is served.
4. **[[D2415]]:** origins preserve the configured implementation and distinguish
   `provider_live`, `local_service` and test-only `local_fixture`; cached originals retain it.
5. **[[D2416]]:** the registry contains eight operations and eleven execution stages. TTS is the
   conditional `audio` stage of each of the three voice operations; orphan `render.tts` is deleted.
6. **[[D2417]]:** instance declarations carry a separate `ProviderBackoffGroupId`. Explorer and
   tablebase share `lichess-api` admission/backoff while retaining independent health/generation.

`make provider-health-third-author-repair` preserves the original eight controls and passes nine
new able-to-fail arms plus strict TypeScript over the complete route/result/recovery/cache/backoff
model. This is author repair, not acceptance or implementation. Fresh independent review remains
required.

## Fourth fresh independent return (2026-09-04)

The D2412–D2417 repair decisions survive at their stated seams. A fresh join against production
provider call sites and the provider-exchange RFC returns nine blockers:

1. [[D2575]] — the live reasoning-review external call is absent from the operation census;
2. [[D2576]] — independently requested `/speech` contradicts the declared voice→TTS graph;
3. [[D2577]] — the author closure passes count-preserving operation replacement and omits the
   proposed compiler fields;
4. [[D2578]] — provider health redeclares provider-exchange operation/receipt authority with
   incompatible identities and no stage→exchange mapping;
5. [[D2579]] — the five-minute recovery rule has no timed reducer operands;
6. [[D2580]] — shared backoff names a lease but implements/specifies no tokenized lifecycle;
7. [[D2581]] — exact cache lookup returns provenance without the cached value;
8. [[D2582]] — Retry/Change opponent has no typed route, state or resume semantics; and
9. [[D2583]] — a union of single-stage results cannot settle a multi-stage voice/audio pipeline.

Exact evidence and required repair are recorded in
`planning/provider-health-degradation/fourth-fresh-independent-buildability-review-2026-09-04.md`.
Neither implementation checkpoint is authorized until one bounded author repair inverts these
controls and another genuinely fresh review passes.

## Fourth author repair (2026-09-04)

The nine returned seams now close as one exchange-backed application contract:

1. [[D2575]] adds `review.reasoning` and its distinct
   `external_voice.reasoning_review@1` exchange operation; valid empty and provider failure are
   different results.
2. [[D2576]] makes `/speech` a first-class TTS operation over a brand-sealed prior text reference,
   covers Compare, and forbids a second voice request.
3. [[D2577]] compiles an independently declared ten-operation obligation set and rejects missing,
   extra, duplicate, count-preserving replacement, crossed exchange/instance, dependency, fallback
   and deadline mutations.
4. [[D2578]] renames the health layer's identity to `ApplicationProviderOperationId` and maps every
   stage to the one provider-exchange operation whose sealed delivery it consumes. The health layer
   defines no acquisition receipt.
5. [[D2579]] gives recovery an immutable monotonic-time state, transient open window, half-open
   token, generation reset and restart rule.
6. [[D2580]] defines acquire/renew/settle/expire over tokenized generation-set group leases and
   makes stale settlement fail.
7. [[D2581]] makes exact-cache resolution atomically return immutable value, original sealed
   exchange delivery and current cache-service receipt.
8. [[D2582]] persists selection failure and retry/change recovery after the committed learner ply,
   preserving initial session identity while projecting a recorded effective policy.
9. [[D2583]] retains one ordered settlement per declared stage and derives complete, fallback,
   unavailable or cancelled without erasing mixed stage outcomes.

`make provider-health-fourth-author-repair` retains 17 prior author controls and passes 6/6 new
behavioral controls plus strict TypeScript. Exact receipt:
`planning/provider-health-degradation/fourth-author-repair-2026-09-04.md`. This is author repair,
not acceptance or implementation; another genuinely fresh independent review remains required.

### Fifth author repair — exact checkpoint authority

The 2026-09-05 repair makes the claim-free checkpoint one executable boundary rather than a list of
promised names. It exports exact `ProviderRegistrySnapshot`, `ApplicationProviderOutcome`,
`selectProfileAvailability` and `ProviderReleaseReceipt` authorities. Application operations compile
with no caller population from a separate exact consumer declaration module; production replaces
that author fixture with declarations imported by the live consumers, never a second obligations
list. Every stage carries the provider-exchange request and sealed delivery/failure, and settlement
joins operation, instance, generation and normalized request before deriving an outcome.

Displayed speech text now begins at a registered F1 renderer and gains its identity only when the
same item is recorded as displayed. The exact cache stores the sealed delivery as both value and
origin, enforces same-subject keys, TTL, generation invalidation and a 512-entry LRU. Health state is
registry-private and changes only from a sealed current-generation exchange result at safe
monotonic time. Shared backoff consumes a sealed generation set derived from a registry snapshot;
caller strings cannot clear an upstream block.

Opponent recovery crosses a real SQLite transaction: failure resolves the already-committed learner
ply, appends the failure event and recovery image atomically, and retry/change reload after restart.
Idempotent replay joins run, action and operands rather than treating global key existence as
success. Self-audit also binds release receipts to the issuing registry's exact current snapshot;
stale and cross-registry snapshots fail.

`make provider-health-fifth-author-repair` retains all previous author and fresh-review controls,
passes 8/8 new behavioral groups plus strict TypeScript, and is enrolled in `verify-governance`.
Exact receipt: `planning/provider-health-degradation/fifth-author-repair-2026-09-05.md`. This remains
author contract work, not acceptance or implementation.

## Sixth fresh independent return (2026-09-05)

The newest checkpoint is not one executable refinement of the prior contract. Eight independent
attacks return it on [[D2815]]–[[D2822]]:

1. the exported snapshot omits three normative states and heals after the first success following
   repeated opens instead of entering `recovering(1/2)`;
2. shallow-mutable consumer rows admit arbitrary consumer, stage and fallback semantics into the
   branded compiled image;
3. the compiler forces every operation into one unconditional stage, making its dependency,
   conditional-stage and multi-stage criteria unrepresentable;
4. the group coordinator has no `renew` operation despite the required lease lifecycle;
5. exact cache state never joins the health snapshot and survives generation change;
6. a provider failure can attach to an old learner ply even after a newer ply is committed;
7. retry omits failure-sequence and request identity, so an old idempotency key succeeds against a
   newer failure; and
8. change accepts caller-written policy/request digests instead of deriving both from a parsed
   policy and current run state.

`make provider-health-sixth-fresh-review` passes 8/8 falsifiers and remains in ordinary verification.
Exact evidence:
`planning/provider-health-degradation/sixth-fresh-independent-buildability-review-2026-09-05.md`.
A bounded repair must produce one current authority rather than leaving the fourth and fifth models
to disagree. Implementation remains unauthorized.

## Sixth author repair (2026-09-05)

One replacement checkpoint closes [[D2815]]–[[D2822]] rather than treating the fifth model as a
parallel authority. The exported reducer represents all six state arms and joins exact current
cache inventory before projecting degraded versus unavailable. Consumer declarations are deeply
immutable and compared by complete semantics; the compiler executes dependency/condition grammar
before accepting the exact ten-member image. Generation leases now acquire, renew, settle and
expire. Durable failure/retry/change commands execute against the current run tail inside one
immediate transaction; retry crosses failure and request identity, while change parses policy and
derives both policy and next-request digests server-side.

The executable closure is explicit: [[D2815]] state arms and recovery; [[D2816]] immutable semantic
declarations; [[D2817]] dependency grammar; [[D2818]] renewable leases; [[D2819]] cache/health
joining; [[D2820]] current-tail failure; [[D2821]] exact retry identity; and [[D2822]] server-derived
change identity.

The repair self-audit found and closed [[D2823]]–[[D2827]] before publication: only an
authority-issued snapshot can produce a generation set; recovery preimages are read after the write
lock; late old-generation deliveries cannot repopulate cache; hits update real LRU order; and a
generation change releases an old live group claim.

Those self-audit controls are individually owned here: [[D2823]] sealed snapshots, [[D2824]] locked
preimages, [[D2825]] stale-insertion refusal, [[D2826]] recency-on-hit and [[D2827]] generation-bound
claim release.

`make provider-health-sixth-author-repair` retains every predecessor and the 8/8 fresh attacks,
passes 13/13 repair groups and strict TypeScript, and is the sole verify-owned current target. Exact
receipt: `planning/provider-health-degradation/sixth-author-repair-2026-09-05.md`. This is author
contract evidence, not acceptance or implementation; another genuinely fresh review remains
required.

## Seventh fresh independent return (2026-09-05)

The sixth replacement closes [[D2815]]–[[D2827]] locally but does not compose the normative
checkpoint it claims to replace. Six independent attacks return it:

1. [[D2846]] — configuration accepts and silently drops an unknown instance, while every configured
   snapshot omits the required family and implementation identity;
2. [[D2847]] — any old or cross-registry sealed snapshot can mint a generation set and clear a live
   lease; the set is bound to neither the issuing registry's current revision nor one backoff group;
3. [[D2848]] — the coordinator has no blocked-until/result/Retry-After state, so settling a Lichess
   429 admits the next Explorer/tablebase request immediately;
4. [[D2849]] — exact-cache lookup omits application operation, stage and cache-key identity and
   returns no current cache-service receipt, regressing the atomic provenance contract;
5. [[D2850]] — all ten exact declarations remain one unconditional dependency-free stage, so the
   dependency/condition grammar and mixed-stage outcome criteria are green without one live case;
6. [[D2851]] — the replacement exports none of the fifth checkpoint's
   `ApplicationProviderOutcome`, profile-availability selector, release receipt or settlement
   authority.

`make provider-health-seventh-fresh-review` retains every predecessor/repair and passes 6/6
falsifiers. Exact evidence:
`planning/provider-health-degradation/seventh-fresh-independent-buildability-review-2026-09-05.md`.
The next repair must compose the fifth and sixth authorities into one current checkpoint rather
than satisfying only the newest finding list. Implementation remains unauthorized.

## Seventh author repair (2026-09-05)

The six returned seams now close in one replacement authority:

1. [[D2846]] parses configuration against the exact seven instance declarations and each row's
   allowed implementation set before registry construction; every configured snapshot retains
   family, implementation and generation;
2. [[D2847]] binds snapshots, release receipts and group generation sets to the issuing registry's
   exact current revision and group. Old, copied, cross-registry and cross-group authorities fail;
3. [[D2848]] gives the group coordinator acquire/renew/settle/expire plus owned blocked-until state,
   bounded transient backoff and the Lichess 429 minimum of 60 seconds;
4. [[D2849]] keys exact cache at application-operation/stage/exchange-operation/instance/
   implementation/generation/request/cache-key grain and atomically returns the value, original
   delivery and current cache-service receipt;
5. [[D2850]] deletes the unused dependency/condition/multi-stage grammar. Production has ten real
   one-stage operations; `render.speech` consumes sealed already-displayed text as an independent
   request. A fabricated voice→TTS DAG would contradict the route and deadline boundary rather than
   improve it; and
6. [[D2851]] composes full health state, application outcome, availability selection, settlement,
   exact cache, release and backoff authority while re-exporting the sixth repair's durable
   recovery authority.

During the repair, the focused gate caught and fixed an authority-composition error where a sealed
delivery was rejected because registry currency accepted only the original request object's brand.
The composed boundary now accepts only authority-sealed request/delivery/failure subjects while
still rejecting structural copies. Availability and release receipts also require the exact current
snapshot, so a later health or cache transition invalidates them.

`make provider-health-seventh-author-repair` retains every predecessor and the 6/6 seventh-review
attacks, passes 6/6 composed repair groups and strict TypeScript. Exact receipt:
`planning/provider-health-degradation/seventh-author-repair-2026-09-05.md`. This is author contract
evidence, not acceptance or implementation. Another genuinely fresh review and the provider-
protocol/exchange prerequisites still gate both implementation checkpoints.

## Eighth fresh independent return (2026-09-05)

The seventh repair composes the named surfaces, but three authority seams fail under ordinary
consumer-shaped inputs:

1. [[D2857]] — `assertGenerationSet` issues and installs a new snapshot while checking the supplied
   generation set. A successful `BackoffCoordinator.acquire` therefore makes the unchanged snapshot
   that created the set fail the later F1 availability selector, although registry revision,
   provider health, cache inventory and generation did not change;
2. [[D2858]] — `BackoffCoordinator.settle` does not parse its unknown input against the closed
   settlement algebra. Every unrecognized `kind` falls through as a transient failure, and known
   variants admit extra contradictory fields, so attacker-shaped bytes can clear the live lease and
   alter shared upstream admission; and
3. [[D2859]] — the recursive freezer stops at an already-frozen outer payload. A caller can supply a
   shallow-frozen object with mutable descendants, receive a sealed delivery, cache it, mutate the
   retained value and obtain different atomic bytes under the same response digest and cache key.

`make provider-health-eighth-fresh-review` retains the complete predecessor/repair chain and passes
3/3 committed-program falsifiers. Exact evidence:
`planning/provider-health-degradation/eighth-fresh-independent-buildability-review-2026-09-05.md`.
The bounded author repair must preserve one snapshot authority across read-only admission checks,
parse settlement before consuming a claim, and recursively seal or independently validate the
complete payload graph with digest correspondence. Another genuinely fresh review remains required;
production implementation is unauthorized.

## Eighth author repair (2026-09-05)

The three returned seams are repaired inside the composed authority:

1. [[D2857]] recomputes the current backoff-group member image directly from the registry's current
   circuits. It compares that image and digest without calling `snapshot()` or issuing another
   generation set, so a successful acquire leaves the exact operation/F1 snapshot current;
2. [[D2858]] accepts settlement as unknown input and parses the exact four-arm union, including
   exact keys and Retry-After domain, before it validates or clears the lease. Unknown, missing and
   extra fields fail without consuming the current claim or changing blocked-until state; and
3. [[D2859]] defensively clones the supplied provider payload, recursively traverses descendants
   even beneath an already-frozen parent, seals the retained graph and records its canonical
   `payloadDigest` beside the transport response digest. Later mutation of the caller's graph cannot
   change delivery or cache bytes.

`make provider-health-eighth-author-repair` retains every predecessor and all 3/3 eighth-review
attacks, passes 9/9 composed repair groups and strict TypeScript. Exact receipt:
`planning/provider-health-degradation/eighth-author-repair-2026-09-05.md`. This is author contract
evidence, not acceptance or production implementation. Another genuinely fresh review plus the
provider-protocol/exchange prerequisites still gate both implementation checkpoints.

## Ninth fresh independent return (2026-09-06)

The eighth repair pays its three immediate debts but leaves five composition failures:

1. [[D2869]] — a second `snapshot()` at the same revision and state replaces the sole current
   snapshot object and revokes the first without any transition;
2. [[D2870]] — `CacheKey` is unsealed and `put` ignores its application/stage grain, permitting a
   valid provider delivery to be relabelled under an unrelated application operation;
3. [[D2871]] — generation-set validity is coupled to global registry revision, so unrelated
   provider/cache traffic prevents an already-acquired group claim from settling;
4. [[D2872]] — `settleOperation` accepts extra fields and caller-authored `local_domain` values
   instead of parsing the exact arms and requiring provider-exchange authority; and
5. [[D2873]] — `changeGeneration` accepts a changed implementation with the same generation string,
   preserving the old group digest and claim across the configuration change.

`make provider-health-ninth-fresh-review` retains the full chain and passes 5/5 executable
falsifiers. Exact evidence:
`planning/provider-health-degradation/ninth-fresh-independent-buildability-review-2026-09-06.md`.
The RFC remained returned at that checkpoint; production implementation was unauthorized.

## Ninth author repair (2026-09-06)

The five returned seams are repaired as one current authority boundary:

1. [[D2869]] replaces latest-object currentness with owner, state-revision and current
   time-derived-state validation, so equal concurrent reads coexist while actual retry/expiry
   transitions still stale old authority;
2. [[D2870]] brands cache keys to the issuing registry, compiled application/stage and sealed exact
   request, and checks that authority on both insertion and resolution;
3. [[D2871]] removes global registry revision from group-lease validity and compares the sorted
   group-only instance/implementation/generation image;
4. [[D2872]] parses every settlement from unknown input with exact keys and admits local-domain
   completion only through a same-request provider-exchange-issued result; and
5. [[D2873]] refuses equal-generation configuration changes and includes implementation in the
   group image, so old claims cannot survive a remote/local swap.

The executable checkpoint composes these repairs over the prior health reducer, bounded exact LRU,
availability selector and release receipt rather than replacing them. `make
provider-health-ninth-author-repair` retains all predecessor repairs and the 5/5 ninth-review
reproductions, passes 5/5 direct inversions plus one whole-checkpoint composition group, and runs
strict TypeScript. Exact receipt:
`planning/provider-health-degradation/ninth-author-repair-2026-09-06.md`. This is author-contract
evidence, not acceptance or production implementation; another genuinely fresh review remains
required.

## Tenth fresh independent return (2026-09-06)

The ninth repair pays its five immediate debts but leaves four authority joins inconsistent:

1. [[D2912]] maps an instance-wide nonzero cache count to `cached_exact_only` even though the
   selector has no exact request or issued cache key and the requested key may miss;
2. [[D2913]] validates release receipts without a current monotonic sample, so an old receipt remains
   valid after its source snapshot's retry/expiry projection is stale;
3. [[D2914]] keeps shared backoff entirely inside `BackoffCoordinator`, leaving a sibling operation
   `requestable_unverified` while that exact coordinator refuses admission; and
4. [[D2915]] issues generation rows in declaration order but validates them in locale order, making
   an untouched receipt for two providers immediately reject itself.

`make provider-health-tenth-fresh-review` retains the whole predecessor chain and passes 4/4
executable reproductions. Exact evidence:
`planning/provider-health-degradation/tenth-fresh-independent-buildability-review-2026-09-06.md`.
The RFC remains returned; both implementation checkpoints are unauthorized pending one coherent
repair, another genuinely fresh review and the provider-protocol/exchange prerequisites.

## Tenth author repair (2026-09-06)

The four returned joins and three adjacent closure defects are repaired as one composed authority:

1. [[D2912]] makes request-free cache inventory `conditional_exact_cache`; only an atomic exact-key
   hit can produce `cached_exact_only` service;
2. [[D2913]] binds every release assertion to current injected monotonic time and revalidates the
   exact source snapshot rather than only its revision/generation labels;
3. [[D2914]] joins the coordinator's current group claim/block projection into both availability and
   admission without merging distinct instance-health state;
4. [[D2915]] uses one byte-sorted instance/implementation/generation image for both receipt issue and
   validation;
5. [[D2917]] carries `recovering` as a distinct operation-availability arm;
6. [[D2918]] refuses snapshot, release and selection authority unless every configured non-null
   backoff group has exactly one registered coordinator projection; and
7. [[D2919]] retains the coordinator's declared 5/15/60-second transient sequence in the exact
   snapshot-facing projection, resetting it only on success or generation change.

`make provider-health-tenth-author-repair` retains every predecessor and the 4/4 tenth-review
reproductions, then passes 8/8 direct/composition groups plus strict TypeScript. Exact receipt:
`planning/provider-health-degradation/tenth-author-repair-2026-09-06.md`. This is author-contract
evidence, not acceptance or production implementation; another genuinely fresh review remains
required.

## Eleventh fresh independent return (2026-09-06)

The tenth repair closes its named cache/time/group/recovery seams, but the composed authority is
returned on eight new boundaries:

1. [[D2942]] — `GROUP_BY_INSTANCE` is a second partial hand map rather than a derivation of the
   canonical provider declarations;
2. [[D2943]] — public `registry.prior()` permits health/generation mutation outside wrapper revision,
   configured-generation and coordinator authority; a snapshot at `g2` can receive an asserted
   release generation image at `g1`;
3. [[D2944]] — public coordinator registration accepts a coordinator owned by another registry;
4. [[D2945]] — public `generationChanged()` clears a live rate-limit block with no generation or
   registry-state transition;
5. [[D2946]] — coordinator settlement accepts a caller enum unrelated to any sealed provider
   exchange, so real instance failure and fake group success can coexist;
6. [[D2947]] — the composed operation result cannot represent the promised request-specific
   `cached_exact_only` arm;
7. [[D2948]] — the projection exposes singular identity and omits the required block/unavailable
   reasons from the normative operation-availability wire shape; and
8. [[D2949]] — the monotonic process clock is converted directly into display civil time.

`make provider-health-eleventh-fresh-review` retains every predecessor review and repair and passes
8/8 fresh counterexamples plus repository-compatible TypeScript. Exact receipt:
`planning/provider-health-degradation/eleventh-fresh-independent-buildability-review-2026-09-06.md`.
The RFC remains draft and neither implementation checkpoint is authorized.

## Implementation plan

**Staged dependency rule ([[D2364]]).** This RFC may remain `implementing` across two checked
checkpoints because its run-schema claim is lane 0.26 while `bot-policy.md` owns lane 0.18 and
consumes the health authority. The **claim-free runtime-authority checkpoint** lands Phases 1–3
items 1–11 plus the exact
`ProviderRegistrySnapshot`, `ApplicationProviderOutcome`, profile-availability selector and
generation-bound release-receipt types, with no persisted run-shape change. `bot-policy` may then
consume those production symbols and land lane 0.18. Item 12's acquisition persistence and every
criterion that depends on it remain open until lanes 0.19–0.25 and this RFC's lane 0.26 land. The
first checkpoint does not archive this RFC, claim its durable receipt complete, or permit a copied
bot-private health projection.

### Phase 1 — runtime authority

1. Add `provider-health.ts` with closed family/instance ids, the state-specific snapshot union,
   monotonic clock handling, generation changes, circuit behavior and immutable snapshot.
2. Bind `EngineSupervisor` startup/exit/request outcomes for Stockfish/Maia.
3. Add the compiled `APPLICATION_PROVIDER_EXECUTION` extension and common operation wrapper for one
   total deadline, abort, one same-provider retry, closed result and registry update; adapt
   tablebase, corpus, external voice, reasoning review and TTS onto provider-exchange deliveries.
4. Preserve caller cancellation as operation outcome without provider-health damage.

### Phase 2 — caches and selectors

5. Split opponent in-flight coalescing from a 512-entry generation-keyed settled LRU and return
   receipts on every selection.
6. Replace Maia's 60-second timeout and every nested fresh timeout with the remaining F1 operation
   budget.
7. Join opponent/tablebase/corpus generation-valid cache inventories to registry snapshot derivation
   and coordinate per-upstream 429 backoff.
8. Make `availableModes` request-aware through the registry; delete identity/config presence as
   availability authority.

### Phase 3 — F1/API/client

9. Compile the four provider-backed F1 producers from the registry snapshot; attach three voice,
   reasoning-review and sealed-text speech operations.
10. Replace the current `/capabilities.providers` flags with the shared parsed runtime snapshot and
    typed mode summaries, including `requestable_unverified`; send `Cache-Control: no-store`.
11. Replace every web `providers.* !== "none"` branch with shared selectors that preserve layout and
    expose honest retry/change/fallback behavior; delete the speech route's second voice call.
12. Add Inspector detail and compact learner copy without changing assistance permissions. Apply
    run-schema lane 0.26: new opponent selections persist the sealed exchange delivery; failures
    and retry/change commands append the two recovery events; old selections without acquisition
    remain readable as explicit `legacy_unrecorded` trust state.

### Phase 4 — production-boundary proof

13. Run the engine-on release profile, warm one Maia position, stop Maia, and prove cached exact/new
    position divergence inside the compiled deadline.
14. Restart Maia and prove generation/cache invalidation plus recovery.
15. Fault the HTTP providers for timeout, 429, 401, 5xx, malformed payload and recovery; prove one
    coordinated retry path and no herd.
16. Exercise the same paths through the real browser modules and opponent chooser at phone/tablet/
    desktop layouts.

## Acceptance criteria

1. The registry has exactly six family ids, seven concrete instance ids, eight provider-exchange
   operation ids and ten application operation ids;
   unknown/crossed family-instance-operation tuples fail rather than defaulting to available.
   Independent `stockfish-play` and `stockfish-analysis` death/restart fixtures never change the
   other's state or consumers.
2. The state-specific snapshot union rejects invented fields on `not_configured`, missing required
   fields on outcome-bearing arms and every illegal reason/cache combination. Constructor/config
   presence alone produces only `not_configured` or `unverified`; only a real current-generation
   handshake/request produces `available`. A clean external provider is
   `requestable_unverified`, makes its first real learner request without a probe, then reaches both
   success and failure fixtures.
   Clean start and recovering are distinct arms: repeat-open → first live success produces
   `recovering(1/2)` with times/prior reason, second success produces available, intervening failure
   resets recovery, and generation change/restart returns clean unverified.
3. The permanent R18 fixture warms one Maia selection, stops the sidecar, receives the same request
   as `cached_exact`, and receives a typed bounded unavailable result for a new position. The next
   `/capabilities` snapshot is `degraded_cached_only`, not available.
4. Maia, both Stockfish instances, Explorer, tablebase, voice render, reasoning review and TTS each
   have timeout, cancellation, malformed-response, configured-off and recovery fixtures. Caller
   cancellation does not open a circuit; reasoning-review failure cannot become valid external empty.
5. No provider operation, including queue, retry, rendering, TTS and fallback, can exceed its compiled F1 consumer deadline.
   A source guard fails on Maia's old `60_000` timeout and on per-attempt voice deadline reset.
6. Lichess 429 opens the shared `lichess-api` coordinator for Explorer and tablebase for at least
   60 seconds, permits no concurrent cross-instance retry herd, and honors a longer valid
   `Retry-After` without merging their health snapshots.
7. All former `CapabilityProviders` presence branches are deleted or mechanically proven derived
   from `ProviderRegistrySnapshot`; the client has zero direct `providers.* !== "none"` feature
   gates.
8. The compiled execution closure maps exactly `live.stockfish`→`stockfish-analysis`,
   `live.syzygy`→`tablebase-primary`, `human.maia`→`maia-inference`, and
   `human.explorer`→`explorer-primary`; opponent Stockfish maps only to `stockfish-play`. The three
   voice consumers compile voice rendering, reasoning review has its own operation, and speech
   compiles only TTS over a sealed prior-text identity. The application set is exactly ten and the
   exchange set exactly eight; an orphan, missing or substituted operation fails.
   Missing/duplicate/reset-deadline declarations fail. Every provider-off consumer produces
   its declared state.
9. Explorer `no_data_at_band` and tablebase out-of-range keep their providers healthy and render
   differently from unavailable. Negative fixtures fail if either is collapsed.
10. The opponent settled cache is a maximum 512-entry LRU, keys every provider-instance generation,
    separates in-flight work, invalidates on generation change and emits closed live/local/cached
    exchange deliveries. Lane 0.26 save→reload→Review/export fixtures retain them and both recovery
    events exactly; an old event is explicitly `legacy_unrecorded` and every new writer omitting
    acquisition fails.
11. A late result from an old generation cannot heal health, populate the new-generation cache or
    reach a response.
12. External voice failure returns only the deterministic renderer's sealed evidence through the
    `fallback` result arm, retains the provider failure separately, and leaves `external-voice`
    unavailable; no LLM output is cached or presented as evidence.
13. No mode silently substitutes a different provider. Human-common/theory-strict/practical modes
    never become Stockfish/random; perfect-tablebase never becomes engine search; corpus never
    becomes authored theory; TTS never changes the text.
14. `/capabilities` is `no-store`, does not probe, contains only state-valid fields and shares the
    same parsed registry snapshot used for operation admission and F1 availability. Server and web
    import one wire/parser authority; a server-only field/state/mode fails.
15. `/healthz` remains green during optional-provider loss; `/readyz` remains core-ready while
    naming the degraded optional provider in its body.
16. Browser production-boundary tests prove paused-opponent retry/change, exact-cache disclosure,
    stable module geometry, honest-empty versus unavailable, deterministic voice fallback, and
    recovery at phone/tablet/desktop widths without raw provider strings in ordinary play.
17. Resource tests prove all settled caches and queues remain inside their declared bounds under
    10× capacity pressure; release-tier heap/RSS verdict remains F12-E/F12-H.
18. `make verify`, `make test-browser`, provider fault-injection, release-container smoke,
    register/status/roadmap checks and the local/GitHub required CI commands are green on the exact
    committed bytes.
19. Every compiled `ApplicationProviderOutcome<T>` has the exact single stage settlement and one
    legal complete/fallback/unavailable/cancelled arm. A missing, duplicate, crossed or erased
    settlement fails. The health reducer consumes sealed provider-exchange results exhaustively;
    cached/fallback/caller-cancel arms cannot heal or damage health incorrectly.
20. Cache inventory is live state authority at operation/stage/instance/generation/request/key
    grain. Removing the last valid entry by TTL expiry, LRU
    eviction, explicit invalidation or generation cleanup changes the next snapshot from
    `degraded_cached_only` to `unavailable` with no provider call and no `checkedAt` change. Adding a
    current-generation exact entry permits cache-only; stale-generation entries never count.
21. The provider-protocol dependency is explicit: after lane 1 lands, this RFC claims the next lane
    for the three external exchange operations and ten application execution members before acceptance. A copied server/web operation map
    or an implementation attempted while the resource is absent fails register/buildability gates.
22. Configured implementation is a checked member of the instance declaration's closed
    `allowedImplementations` set ([[D2362]]). Switching tablebase/Explorer remote→local changes the
    generation and invalidates old cache/health. Release compilation rejects `local_fixture`; a
    local production service is labeled `local_service` in both configured implementation and
    origin receipt and never impersonates Lichess. Cached originals preserve that implementation
    and exact generation/request identity.
23. The staged dependency receipt proves the claim-free runtime-authority checkpoint changes no
    run-schema byte and exports the exact snapshot/result/release types consumed by bot policy.
    Bot policy has zero parallel health state. Provider health remains implementing until lane 0.26
    makes every new opponent selection persist the exchange delivery and the two recovery events. *Fails if* either RFC
    claims the other fully implemented before its registered lane can land, or if lane 0.26 is
    renumbered to conceal the dependency.
24. The compiler-generated application map is the only application/provider identity authority. All ten
    application operations map to one of eight provider-exchange operations and every stage crosses
    the strict unknown-input parser. Crossed application operation/stage/instance/exchange
    operation, implementation, generation, request digest or cached origin fails; count-preserving
    operation and instance swaps fail. No handwritten subset can satisfy this gate.
25. Recovery decisions use injected monotonic time. Two transient opens inside 300,000 ms require
    two successes; two outside it do not. Authentication/protocol never auto-retry, generation and
    restart clear history, and stale half-open tokens cannot heal.
26. Backoff-group acquire/renew/settle/expire fixtures cover crash, abort, expiry race, generation
    change and stale completion. Only the current token/generation set may renew or settle; 429
    blocks for at least 60 seconds.
27. Exact-cache hit is one atomic immutable value containing payload, original sealed exchange
    delivery and current cache-service receipt. Expiry/eviction between availability and use cannot
    cross provenance because no second lookup exists.
28. Retry and Change opponent cross route, wire, reducer, persistence and browser fixtures. Neither
    replays the committed learner ply; retry preserves request identity; change records before/after
    policy digests and effective-policy projection without rewriting the initial session digest.
29. Speech accepts only a sealed displayed-text identity for all five scopes, including Compare,
    and never calls external voice. Rendering success and later TTS failure remain two independently
    settled operations; speech falls back without relabeling browser speech as provider audio.
30. [[D2846]] Configuration is parsed against the closed instance/family/allowed-implementation
    declarations before registry construction. Unknown rows fail; configured snapshots retain the
    exact family and implementation whose generation they name.
31. [[D2847]] A generation set is issued only from the exact current snapshot of its owning registry
    and exact compiled backoff group. Old, cross-registry and cross-group sealed snapshots fail and
    cannot release, renew or settle a live claim.
32. [[D2848]] The same coordinator that owns acquire/renew/settle/expire also owns blocked-until,
    backoff sequence and result settlement. A Lichess 429 blocks both group members for at least
    60,000 ms and honors a longer valid Retry-After.
33. [[D2849]] Exact-cache resolution retains application operation, stage, instance, generation,
    normalized request and cache-key identity and atomically returns value, original delivery and a
    current cache-service receipt.
34. [[D2850]] The declared application population has exactly one real provider stage per operation.
    The unused `dependsOn`, `when`, `stages` and `skipped` axes do not exist. `render.speech` remains a
    separate exact operation over a sealed displayed-text input, so adding an invented voice→TTS
    dependency graph or collapsing both outcomes into one settlement fails.
35. [[D2851]] The one replacement checkpoint exports the exact registry snapshot, closed application
    outcome, profile-availability selector, release receipt and settlement authorities together;
    retained predecessor tests cannot substitute for exports absent from the current authority.
36. [[D2869]] Two read-only snapshots at the same revision and monotonic sample are independently
    valid for selectors and release-receipt issuance. A real state revision or current monotonic
    sample whose retry/expiry projection differs rejects both old snapshots. Creating an equal
    snapshot alone never revokes either.
37. [[D2870]] Cache insertion and lookup accept only a cache-key capability issued by the owning
    registry from the exact compiled application declaration and sealed exchange request. A
    structural clone, JSON round-trip, application/stage relabel or cross-registry key fails.
38. [[D2871]] Backoff acquire/renew/settle currentness depends only on the exact compiled group
    member image. Cache or health traffic outside the group leaves a live claim valid; changing any
    member's implementation/generation invalidates it before stale settlement can mutate state.
39. [[D2872]] Every application settlement arm is exact-key parsed before use. `local_domain`
    accepts only a same-request sealed provider-exchange domain result; arbitrary caller values,
    crossed results and invented fields fail.
40. [[D2873]] Every behavior-affecting configuration/implementation change requires a distinct
    derived generation. Reusing the prior generation fails before cache, health or group claims
    change; a valid new generation invalidates all three together.
41. [[D2912]] Instance-level conditional cache capability and exact-operation service are distinct
    types. An operation may become `cached_exact_only` only from the atomic hit returned for its
    exact registry-issued request/cache key; a different request on the same failed instance misses
    and remains unavailable for cache service.
42. [[D2913]] Every release-receipt assertion receives current injected monotonic time and rejects
    when the retry/cache-expiry projection of its source snapshot differs, even if registry revision
    and configured generations are unchanged.
43. [[D2914]] The operation availability and admission authority consumes the exact current
    backoff-group block/claim projection. A Lichess 429 makes both Explorer and tablebase
    non-requestable for the shared delay while retaining their distinct instance-health snapshots.
44. [[D2915]] One canonical sorted generation-image projection is used verbatim for snapshot release
    issuance and currentness validation. A freshly issued multi-provider receipt validates before
    any transition; a member, implementation, generation, order or time-state mismatch fails.
45. [[D2917]] The first success after the repeat-open threshold projects `recovering`, never
    `available`, until the second current-generation live success completes.
46. [[D2918]] Every configured non-null backoff group contributes exactly one coordinator projection
    before a snapshot, release receipt or operation selection can become authority. Missing or
    duplicate coordinators fail closed.
47. [[D2919]] The snapshot-facing group projection and admission coordinator share the exact
    5/15/60-second repeated-transient sequence. The second transient failure blocks both for fifteen
    seconds; success or generation change resets the sequence.
48. [[D2942]]–[[D2944]] One private composition derives provider/group membership from
    `PROVIDER_INSTANCE_DECLARATIONS`, owns coordinator construction and exposes no predecessor
    registry. A copied map, public/cross-registry coordinator or direct predecessor mutation fails.
49. [[D2945]]–[[D2946]] Group reset and settlement consume the exact registry-owned generation
    transition or sealed provider exchange. A same-generation reset, plain success enum,
    wrong-member result or contradictory health/group outcome fails before state changes.
50. [[D2947]]–[[D2948]] One strict `ProviderOperationAvailability` parser/projector supplies the
    normative population/reason fields, and only the atomic exact-key resolution can return
    `cached_exact_only`. Request-free counts, other-request hits and reasonless arms fail.
51. [[D2949]] Snapshot construction receives monotonic and civil-clock operands separately.
    Changing civil time changes display bytes only; changing monotonic time can change retry/expiry
    state but is never interpreted as Unix epoch time.

## Falsifiers and negative fixtures

The implementation is rejected if any of these can pass:

- a configured but never-called HTTP provider appears `available`;
- a configured but never-called HTTP provider is marked unavailable and therefore cannot make its
  first real request;
- a cache hit changes `checkedAt` or closes a circuit;
- the last exact cache row expires or is evicted while the snapshot remains cache-only;
- the warmed Maia position succeeds after sidecar death and thereby keeps a new position enabled;
- a provider-off Explorer response is rendered as “no games at this rating”;
- an eight-second two-attempt voice path satisfies a four-second consumer budget;
- stopping Maia causes a human-common run to commit a Stockfish or random reply;
- restarting the same Maia binary leaves old-generation selections readable;
- `/capabilities` itself calls a provider or mutates health;
- a browser hides a disappearing control and reflows/shrinks the active board instead of preserving
  the module's unavailable state;
- a deterministic fallback is labelled external voice or permitted to add a sentence absent from
  the sealed F1 view;
- a cached acquisition carries a failure reason or omits its original live/local origin;
- `stockfish-play` failure disables `live.stockfish` analysis, or analysis recovery enables the
  play opponent;
- reasoning-review provider failure returns a valid external empty answer;
- speech re-requests voice, rejects Compare, or accepts a caller-built text string/reference;
- two transient opens more than five minutes apart enter two-success recovery;
- an expired/stale group claim clears or renews its successor;
- cache availability and value/origin require two reads;
- Retry or Change opponent replays the committed learner ply, loses the failure identity, or
  rewrites the initial session digest; or
- a failed TTS stage disappears when text/browser fallback succeeds.

## Rollout and compatibility

This is a pre-1.0 API and run-schema correction. The server and bundled web client change together.
During one implementation commit, tests may construct the legacy `CapabilityProviders` adapter,
but the production application must expose only the live snapshot when the RFC closes. No pack,
database-migration, evidence-kind or unrelated schema lane changes solely because health is live.

Run-schema lane 0.26 adds the optional sealed provider-exchange delivery to
`opponentSelection.acquisition` plus `opponent.selection_failed` and
`opponent.recovery_requested` events. Acquisition optionality is read compatibility only: every
newly appended `opponent.move_selected` event must carry it, and the writer/parser fixture refuses
a new event without it. Pre-0.26 events remain byte-readable and project to explicit Review/export
state `legacy_unrecorded`; they are never relabeled live/retained/local. No historical acquisition,
failure or recovery is invented. Save→reload→Review/export fixtures cross live, local-fixture,
retained-exact, failure, retry and policy-change journeys. A failed/fallback provider result cannot
enter `OpponentSelection` because no opponent move is committed on those arms.

The earlier claim-free runtime-authority checkpoint is forward-compatible with this widening: its
release receipt and operation result are the acquisition field's source authority, but it writes
no placeholder field and infers no historical receipt. This is a staged implementation of one
accepted RFC, not a second schema owner; [[D2364]] exists specifically to keep lane 0.18→0.26
ordering executable.

Rollback may remove the new API fields only before a release claims F12-H. It may never restore the
60-second Maia wait, unbounded cache, or static green capability behavior as a compatibility fix.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Run Maia/Stockfish/HTTP-provider failure, exact-cache divergence and recovery on the final digest-pinned CPU release profile rather than a source-only fixture | `planning/platform-alignment/release-platform/` F12-H | final release-proof receipt and exploration-log entry | |

## Independent-review routing

| finding | returned blocker | repaired contract |
|---|---|---|
| [[D1910]] | one Stockfish health key cannot represent play and analysis instances | six families, seven instances and distinct exchange/application operations in §§1–3/8; criterion 1 |
| [[D1911]] | not-configured/unverified states are not total across snapshot and mode API | state-specific snapshot union plus `requestable_unverified` in §§2/9; criteria 2/14 |
| [[D1912]] | F1 has no rendering-provider dependency/pipeline contract for voice/TTS | compiled application execution graph with one consumer deadline in §§5/8; criteria 5/8/21 |
| [[D1913]] | receipt permits contradictory success/failure/fallback combinations | provider-exchange delivery plus closed application settlement algebra in §4; criterion 19 |
| [[D1914]] | durable opponent receipt contradicts the `none` run-schema claim | run-schema lane 0.26 plus old/new write/read contract in rollout; criterion 10 |
| [[D1915]] | cache-only global state has no cache-inventory transition | generation-valid inventory joined at snapshot time in §§2/7; criterion 20 |
| [[D2362]] | one fixed implementation contradicts remote→local instance evolution | declared allowed set plus generation-bound configured member in §1; criterion 22 |
| [[D2364]] | bot policy needs health before its lane 0.18 while health's durable field is lane 0.26 | claim-free runtime-authority checkpoint before bot 0.18; acquisition persistence remains the later lane-0.26 checkpoint; criterion 23 |
| [[D2412]] | independent result fields allow crossed operation/origin identity | sealed provider-exchange delivery plus generated application-stage mapping in §4; criteria 19/24 |
| [[D2413]] | `unverified` cannot retain first-success recovery evidence | explicit `recovering` state and two-success reducer in §2/6; criteria 2/24 |
| [[D2414]] | instance-wide cache inventory cannot prove an exact operation/request hit | exact operation/stage/instance/generation/request/key inventory and lookup in §7; criteria 20/24 |
| [[D2415]] | production-local service identity disappears from origins | configured implementation plus correlated live/local origin in §§1/4; criteria 22/24 |
| [[D2416]] | orphan ninth `render.tts` operation has no execution | ten-member application closure with first-class sealed-text speech in §§1/8; criteria 1/21/24/29 |
| [[D2417]] | shared-upstream 429 policy has no coordination identity | separate backoff-group declaration and coordinator semantics in §§1/6; criteria 4/24 |
| [[D2575]] | reasoning-review egress absent | distinct application/exchange operation and non-empty-vs-failure result in §§4/8; criteria 4/24 |
| [[D2576]] | voice/TTS graph contradicts `/speech` | first-class speech over sealed prior text in §8; criterion 29 |
| [[D2577]] | closure passes without its compiler | independent ten-obligation compiler and mutation set in §8; criterion 24 |
| [[D2578]] | competing exchange/health receipt authority | provider exchange owns delivery; health owns only application settlement in §4; criteria 19/24 |
| [[D2579]] | recovery has no timed operands | monotonic open-history reducer in §6; criterion 25 |
| [[D2580]] | shared lease is a boolean latch | token/generation acquire-renew-settle-expire algebra in §6; criterion 26 |
| [[D2581]] | cache admission/value split | one atomic immutable cache resolution in §7; criterion 27 |
| [[D2582]] | opponent recovery is prose | durable failure/recovery route and effective-policy projection in §10; criterion 28 |
| [[D2583]] | one-stage result was asked to erase a synthetic voice/TTS pipeline | separate real rendering and speech operation outcomes in §§4/8; criteria 19/29/34 |
| [[D2753]] | checkpoint promises authorities the model does not export | return: exact snapshot/outcome/selector/release exports remain absent or renamed |
| [[D2754]] | local obligation and declaration lists move together | return: no live consumer or provider-exchange-derived census exists |
| [[D2755]] | public caller mints a prior-displayed-text seal | return: no renderer/display/source authority is required |
| [[D2756]] | cache accepts crossed provenance and retains 513 entries | return: no sealed same-subject delivery join or 512-entry LRU exists |
| [[D2757]] | crossed structural provider delivery settles complete | return: settlement validates labels rather than exact declared delivery identity |
| [[D2758]] | structural unverified state heals without a live success | return: health state and monotonic operands are caller authority |
| [[D2759]] | old-generation group lease blocks a new generation | return: generation change and parsed lease authority are incomplete |
| [[D2760]] | JSON-round-tripped opponent state authorizes recovery | return: no storage/event/committed-ply authority participates |
| [[D2761]] | cited author gate is absent from ordinary verification | repaired in review: the independent review target is now enrolled in `verify-governance` |
| [[D2762]] | stale/cross-registry snapshot mints a release receipt | current issuing registry revision/generation image is required |
| [[D2763]] | caller generation string clears shared backoff | coordinator consumes only a registry-snapshot-derived sealed generation set |
| [[D2764]] | cross-run idempotency key skips opponent recovery | durable replay joins exact run/action/operands before returning success |
| [[D2846]] | unknown configuration is dropped and configured identity omitted | closed configuration parser plus family/implementation/generation-bearing snapshots; criteria 1/22/30 |
| [[D2847]] | stale/cross-registry snapshot clears a live lease | registry-current snapshot, release and group-generation authorities; criteria 26/31 |
| [[D2848]] | coordinator cannot establish shared backoff | owned blocked-until/result settlement and 60-second Lichess minimum; criteria 6/32 |
| [[D2849]] | exact cache loses application grain and service receipt | full-grain key plus atomic value/original/current service receipt; criteria 20/27/33 |
| [[D2850]] | unused pipeline grammar is vacuously green | dead DAG axes deleted; ten exact one-stage operations retain independent speech; criteria 8/19/29/34 |
| [[D2851]] | replacement drops prior public authorities | one composed snapshot/outcome/selector/release/settlement checkpoint; criterion 35 |
| [[D2869]] | read-only snapshots revoke equal concurrent snapshots | revision plus current time-derived state authorizes concurrent snapshots; criterion 36 |
| [[D2870]] | cache application/stage grain is caller-mintable | registry/application/request-issued key authority on put and resolve; criterion 37 |
| [[D2871]] | unrelated cache traffic invalidates a live group lease | group-only instance/implementation/generation image; criterion 38 |
| [[D2872]] | structural and caller-authored settlements bypass strict parsing | exact settlement parser plus sealed same-request local-domain authority; criterion 39 |
| [[D2873]] | implementation change reuses generation and predecessor claim | distinct generation required before configuration change; criterion 40 |
| [[D2912]] | request-free instance cache inventory impersonates an exact request hit | conditional capability is distinct from atomic exact-key service; criterion 41 |
| [[D2913]] | release authority outlives its monotonic source snapshot | every assertion revalidates the exact source snapshot at current injected time; criterion 42 |
| [[D2914]] | shared backoff blocks admission while sibling availability remains requestable | one current group projection drives admission and capability; criterion 43 |
| [[D2915]] | issuance and validation order make a fresh multi-provider receipt self-reject | one byte-sorted generation-image function serves both; criterion 44 |
| [[D2917]] | operation availability cannot represent recovering | exact recovering arm; criterion 45 |
| [[D2918]] | a configured group disappears when composition omits its coordinator | total configured-group/coordinator closure; criterion 46 |
| [[D2919]] | projection collapses repeated transient backoff to five seconds | exact 5/15/60 sequence in the shared authority; criterion 47 |

`make provider-health-fourth-author-repair` retains the previous 17 author controls, executes 6/6
new able-to-fail behavioral groups plus strict TypeScript, and remains an author contract rather
than implementation or review.

## Changelog

- 2026-09-06 — eleventh fresh independent review returned the tenth repair on [[D2942]]–
  [[D2949]]. A copied group map, public predecessor/coordinator/reset authorities, unsealed group
  settlement, missing exact-cache operation result, incomplete reason-bearing wire projection and
  conflated civil/monotonic clocks reproduce under `make provider-health-eleventh-fresh-review`
  (8/8 plus repository-compatible TypeScript). Neither implementation checkpoint is authorized.

- 2026-09-06 — ninth author repair closed [[D2869]]–[[D2873]] at contract tier. Concurrent equal
  snapshots share revision/time-state authority; cache keys and local-domain settlements are
  sealed; group leases ignore unrelated traffic; and configuration changes require new generation
  identity. `make provider-health-ninth-author-repair` passes 6/6 plus strict TypeScript; fresh
  review remains.
- 2026-09-06 — returned by ninth fresh independent buildability review on [[D2869]]–[[D2873]].
  Equal read-only snapshots revoke one another; cache keys admit forged application grain; unrelated
  cache traffic invalidates group leases; application settlements bypass exact parsing; and an
  implementation change can reuse a generation and predecessor claim. `make
  provider-health-ninth-fresh-review` passes 5/5 reproductions; author repair and another fresh
  review are required.
- 2026-09-05 — eighth author repair closed [[D2857]]–[[D2859]] at contract tier. Generation-set
  validation is read-only, backoff settlement is parsed before claim mutation, and retained payloads
  are copied, recursively sealed and payload-digest bound. `make
  provider-health-eighth-author-repair` passes 9/9 plus strict TypeScript; fresh review remains.
- 2026-09-05 — returned by eighth fresh independent buildability review on [[D2857]]–[[D2859]].
  Read-only generation-set validation invalidates the issuing snapshot; unknown/inexact settlements
  mutate shared backoff; and shallow-frozen payload descendants mutate beneath sealed delivery,
  digest and cache identity. `make provider-health-eighth-fresh-review` passes 3/3; bounded repair
  and another fresh review are required.
- 2026-09-05 — seventh author repair closed [[D2846]]–[[D2851]] at contract tier. One composed
  authority now retains closed configuration identity, current registry/group authority, real
  shared backoff, full-grain atomic cache provenance and the outcome/availability/release surface.
  The unused dependency/condition grammar was removed because `/speech` is an independent
  operation over sealed displayed text. `make provider-health-seventh-author-repair` retains the
  chain and passes 6/6 repair groups plus strict TypeScript. Fresh review remains required.
- 2026-09-05 — returned by seventh fresh independent buildability review on
  [[D2846]]–[[D2851]]. The sixth model fixes its local return list while dropping earlier
  configured identity, backoff, cache provenance, pipeline and exported-checkpoint contracts.
  `make provider-health-seventh-fresh-review` passes 6/6; one composed repair and another fresh
  review are required.
- 2026-08-31 — author-repaired [[D1910]]–[[D1915]]. Split provider families from concrete
  instances/operations; made clean-start state and requestability total; added a compiler-owned
  voice/TTS execution DAG with one deadline; replaced the loose receipt with a closed operation
  result; claimed run-schema lane 0.26 for durable acquisition; and joined cache-only state to live
  generation-valid inventory. The provider execution extension remains dependency-blocked on the
  provider-protocol register/exchange landing. Second fresh review remains required.
- 2026-08-31 — self-audit repaired [[D2362]] before closeout: instance declarations now own a
  closed allowed-implementation set while configured state selects one generation-bound member;
  `local_fixture` is test-only and `local_service` is the honest production-local label.
- 2026-08-31 — repaired [[D2364]]: the claim-free runtime snapshot/result/release authority is an
  explicit first implementation checkpoint; bot policy consumes it at lane 0.18, while durable
  acquisition remains this RFC's later lane-0.26 checkpoint. The RFC remains implementing between
  checkpoints and no schema claim or dependency is misstated.
- 2026-08-31 — second fresh independent review returned the repair on [[D2412]]–[[D2417]]:
  correlated receipt identity, recovery state, operation/request cache grain, local-service
  provenance, the ninth operation and shared-upstream coordination remain unbuildable. Exact
  review: `planning/provider-health-degradation/second-fresh-independent-buildability-review-2026-08-31.md`.
- 2026-09-02 — third author repair closed [[D2412]]–[[D2417]] at contract tier: one generated
  operation-stage route correlates receipts and cache origins; `recovering` retains first-success
  state; cache inventory is exact-request authority; production-local origins preserve configured
  implementation; TTS is a conditional stage of the three voice operations; and shared backoff
  groups coordinate upstream admission without merging health. The original eight controls and
  nine new falsifiers pass with strict TypeScript. Fresh independent review remains required.
- 2026-09-04 — fourth author repair closed [[D2575]]–[[D2583]] at contract tier: ten application
  operations compile onto eight provider-exchange operations; reasoning review and sealed-text
  speech match the live route graph; monotonic recovery, tokenized group leases, atomic exact-cache
  hits, durable opponent recovery and ordered stage settlement are executable. The retained 17
  prior controls and 6/6 new behavioral groups pass with strict TypeScript. Fresh independent
  review and provider-protocol/exchange prerequisites remain required.
- 2026-09-05 — fifth fresh independent review returned the fourth repair on [[D2753]]–[[D2761]].
  The executable checkpoint omits three promised exports and renames the fourth; two local lists
  substitute for a live consumer census; public structural values mint displayed-text, delivery,
  health, lease and opponent-recovery authority; the cache is unbounded; and its cited target was
  outside ordinary verification. Exact review:
  `planning/provider-health-degradation/fifth-fresh-independent-buildability-review-2026-09-05.md`.
- 2026-09-05 — fifth author repair closed [[D2753]]–[[D2760]] and self-audit [[D2762]]–[[D2764]]
  at contract tier. The exact named checkpoint exports are present; separate consumer declarations,
  sealed exchange/render/health/generation subjects, a 512-entry exact LRU and restart-stable
  opponent recovery execute. Release receipt and recovery idempotency cross-subject bypasses found
  during the repair are negative fixtures rather than deferred debt. Fresh review remains required.
- 2026-08-27 — independent buildability review returned the first draft on [[D1910]]–[[D1915]].
  Exact return: `planning/provider-health-degradation/independent-buildability-review-2026-08-27.md`.

## Open questions

None for owner ruling. Exact per-provider lower timeout values and settled-cache TTLs are measured
implementation parameters bounded above here by F1 latency and 24 hours; they do not change product
meaning. If a test shows the compiled F1 opponent deadline cannot support the selected Maia model on
the ruled CPU tier, that is release evidence against the tier/model contract and must be escalated,
not solved by silently lengthening the interactive deadline.
