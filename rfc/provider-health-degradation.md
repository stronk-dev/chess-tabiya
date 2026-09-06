# RFC: Provider health and honest degradation

- **Status:** **draft — cut to its blocking obligation 2026-09-06.** The twelve-round author-model
  chain is retired as this RFC's acceptance authority and moved to
  `planning/provider-health-degradation/round-history-and-cut-2026-09-06.md`; durable opponent
  recovery and run-schema lane 0.26 moved to `rfc/opponent-recovery-journey.md`. What remains is the
  live provider-health authority, and it claims nothing versioned. It is bound to a **named
  obligation** — the 67 ledger rows in the map below — not to a landable minimum. Owner acceptance
  and the provider-protocol/exchange prerequisites remain required.
- **Author:** Codex on the owner's O13 Choice-C ruling; cut 2026-09-06 by claude
- **Created:** 2026-08-27
- **Design refs:** `design/02-product-shape.md` deployment axis; `design/03-product-breadth.md` B4/B8; `design/05-in-run-experience.md` assistance/source-risk boundary
- **Exploration gate:** O13 / D616 selected the stronger appliance floor; R18 reproduced D609 by stopping Maia while `/capabilities` stayed green
- **Depends on:** implemented `rfc/archive/evidence-contract-manifest.md` and
  `rfc/archive/engine-request-contract.md`; draft `rfc/provider-protocol-register.md` followed by
  `rfc/provider-exchange-and-execution.md` for the shared operation declarations this RFC consumes;
  F12-A's deployment readiness boundary
- **Parent / amends:** current `/capabilities`, `EngineCapabilities`, evidence-manifest availability, engine supervisor, opponent selector, corpus/tablebase/voice/TTS clients
- **Supersedes / superseded by:** —
- **Planning:** `planning/provider-health-degradation/`

```tabiya-claims
none
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

**This RFC is live state only.** Persisting a failure or a mid-run opponent change is
`rfc/opponent-recovery-journey.md`. Until that lands, a provider failure is honest in the run and
absent from Review and export; §10 says so in the interface rather than implying it.

## Motivation

R18 stopped the Maia sidecar after a successful request. `/capabilities` continued to advertise
Maia and all dependent modes. The exact cached request returned in 2 ms, while a new position sent
zero bytes before the ten-second client probe stopped waiting. The capability response remained
green. D609 records that production-boundary failure.

The source makes the cause explicit, and all five facts reproduce at HEAD:

1. `EngineCapabilities` converts configured engine identities and constructor flags directly into
   availability (`apps/server/src/capabilities.ts:282-317`; `corpus`, `tts`, `tablebase` and
   `llmAvailable` are constructor options that become advertised providers). External voice, TTS,
   Explorer and tablebase can therefore be "available" before a request has ever succeeded.
2. `evidenceManifestCapabilities` converts those static strings into F1 producer availability. A
   manifest binding is exact, but its runtime premise is not.
3. `OpponentSelector` retains an unbounded process-lifetime promise cache
   (`apps/server/src/opponent-selector.ts:468`, `new Map<string, Promise<OpponentSelection>>()`).
   Its key omits engine/model generation, and its response does not distinguish cache from live
   inference (D1848).
4. Maia receives a 60-second request timeout (`apps/server/src/opponent-selector.ts:612`). Voice
   makes two independently timed provider calls, so its operation can spend two provider budgets
   before deterministic fallback.
5. Existing corpus and tablebase clients already have useful queue, timeout, typed-error and
   bounded-cache pieces, but neither reports request outcomes to the capability authority. A cache
   hit can hide a dead upstream.

The client half is the same failure in the interface: `apps/web/src/lib/DrillScreen.svelte:978,981,983`,
`apps/web/src/lib/AssistanceSettings.svelte:65` and `apps/web/src/App.svelte:1318,1327,1364` gate on
`capabilities?.providers.*`, and several of them **remove** the control rather than render it with a
reason. The repo's honest-absence invariant is enforced today only for *disabled* controls
([[D1469]]); a control that silently disappears when a provider is absent explains nothing.

The repair must preserve two distinctions that are evidence semantics, not operator decoration:

- **provider unavailable** is different from **provider answered that this position is outside its
  domain or has insufficient data**;
- **a cached answer for this exact request exists** is different from **the provider can answer a
  new request**.

The owner's capability ruling is the shape of the state model: *"during runtime capas can get
missing right... or reappear? … so it would be a 'temporarily unavailable' if it's a runtime issue
or outright unsupported if the server is started without the capa outright."* `not_configured` is
outright-unsupported; every other arm is a runtime state that can change back.

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
6. honest, in-run client behavior for opponent selection, evidence modules, external voice and TTS;
7. liveness/readiness/capability semantics and production-boundary failure/recovery tests.

### Non-goals

- **persisting** a provider failure, a retry or an opponent change — `rfc/opponent-recovery-journey.md`;
- declaring provider-exchange operations, request/result maps, digest constructors, acquisition
  receipts or deliveries — `rfc/provider-exchange-and-execution.md` owns them and this RFC consumes
  them sealed ([[D2578]]);
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
  | "stockfish" | "maia" | "tablebase" | "explorer" | "voice" | "tts";

type ProviderInstanceId =
  | "stockfish-play" | "stockfish-analysis" | "maia-inference"
  | "tablebase-primary" | "explorer-primary" | "external-voice" | "external-tts";

type ApplicationProviderOperationId =
  | "opponent.stockfish_play" | "opponent.maia_inference"
  | "evidence.stockfish_analysis" | "evidence.tablebase_probe" | "evidence.explorer_query"
  | "render.voice" | "render.voice_compare" | "render.voice_story"
  | "review.reasoning" | "render.speech";

type ProviderBackoffGroupId = "lichess-api" | "external-voice-api" | "external-tts-api";

type ProviderImplementation =
  | "uci_sidecar" | "lichess_http" | "external_http" | "local_service" | "local_fixture";
```

`PROVIDER_INSTANCE_DECLARATIONS` is one closed literal tuple of
`{instanceId, familyId, allowedImplementations, backoffGroup}` rows. `backoffGroup` is null for
process-local UCI instances, `lichess-api` for both remote Explorer and tablebase instances, and
the corresponding external group for voice/TTS. The configured-instance value selects exactly one
member and the generation digest binds that selection. `local_fixture` is admitted only by the test
factory and the release compiler rejects it; `local_service` is the production-local member. This is
the durable route for [[D2362]]. `stockfish-play` and `stockfish-analysis` are two rows with
independent options, workloads, handshakes, circuits and generations. A family is only a
display/grouping identity; health is never stored or inferred at family level. Maia is the
`maia-inference` instance. Tablebase and Explorer name their current upstream instances; a later
local implementation changes the configured implementation within the instance's allowed set and
moves generation rather than reusing remote health. Voice and TTS are operational instances but
never chess-evidence producers.

Every group membership, every provider→group binding and every configured row is **derived from
this tuple**. A second hand-written map is a closure failure, not a convenience ([[D2942]]).
Configuration is parsed against the tuple before the registry is constructed: an unknown instance
fails rather than being dropped, and a configured snapshot retains the exact family and
implementation whose generation it names ([[D2846]]).

Every health admission and stage settlement retains the sealed provider-exchange operation and
delivery beside the concrete instance and application operation. Ordinary copy may group failures by
family, but no operation asks "is Stockfish healthy?" without selecting play or analysis. Independent
death/restart fixtures cross both Stockfish instances: analysis failure cannot disable
`opponent.stockfish_play`, and play recovery cannot mark `live.stockfish` analysis available.

Mock/test providers use `local_fixture` and publish that implementation literally. They must never
be serialized as `maia`, `stockfish`, `lichess_http`, or `external_http`, including in development
screenshots and production smoke tests.

Configuration answers only whether a provider exists and which implementation is intended. It does
not answer health. The current `CapabilityProviders` strings may remain during migration only as a
projection of the registry snapshot; no server or client branch may continue to use constructor
presence as authority after criterion 18.

### 2. State model

```ts
type ProviderFailureReason =
  | "startup" | "process_exit" | "timeout" | "network" | "rate_limited"
  | "overloaded" | "authentication" | "protocol" | "cancelled_by_shutdown";

interface ProviderTimes {
  readonly checkedAt: string;
  readonly lastSuccessAt: string | null;
  readonly lastFailureAt: string | null;
}
```

`ProviderHealthSnapshot` is a **state-specific discriminated union**, one arm per state, with no
field that is meaningless for its arm:

| state | required beyond instance/family | forbidden |
|---|---|---|
| `not_configured` | — | implementation, generation, times, reason, cache fields |
| `unverified` | implementation, generation, `retryAfterMs: null` | times, reason, cache fields |
| `recovering` | implementation, generation, `priorReason`, `consecutiveSuccesses: 1`, `requiredSuccesses: 2`, times | reason, cache fields |
| `available` | implementation, generation, `reason: null`, times | cache fields |
| `degraded_cached_only` | implementation, generation, reason, `retryAfterMs`, `cacheScope: "exact_request"`, `validExactEntries`, `cacheRevision`, times | — |
| `unavailable` | implementation, generation, reason, `retryAfterMs`, `cacheScope: "none"`, times | cache inventory counts |

```ts
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

`unverified` is deliberate. Voice/TTS/Explorer/tablebase are not probed with invented chess data,
learner text, or billable prompts merely to paint a green badge. Their first real request verifies
them. A local UCI `uci`/`isready` handshake is an actual protocol operation and may establish
availability before the first chess request.

`requestable_unverified` is the clean-start operation state. It keeps the ordinary control enabled
with neutral copy ("Ready to try") and allows exactly the learner's real request through the normal
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

`checkedAt` exists only after a real outcome and changes only on a real handshake/request outcome.
Reading `/capabilities`, reading a cache entry, rendering deterministic text, and a browser polling
the server do not refresh it.

An internal registry snapshot also retains sealed `stateRevision` and `observedAtMonotonic`
authority. Currentness is not object identity: any number of snapshots issued over the same revision
and equal time-derived state remain valid concurrently. Every admission, selector and
release-receipt operation receives the current injected monotonic sample and recomputes the
time-derived projection. A health/cache/generation mutation, or crossing a retry/cache-expiry
boundary that changes projected state, refuses the old snapshot and requires a new one. Merely
issuing another equal read-only snapshot revokes nothing. Monotonic and civil clocks are **separate
operands**: `observedAtMonotonic` is process-local, never serialized, and never interpreted as Unix
time; `generatedAt` is display-only civil time and never decides duration.

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
4. causes a late old-generation result to be discarded rather than healing the new generation;
5. invalidates any live backoff-group claim naming the old member image before admission.

The generation string is **derived by the composition root** from the configured identity above; it
is never accepted as an arbitrary opaque label from a caller, and there is no public operation that
changes it without a changed configuration, artifact or supervisor start. The generation-change
operation refuses an equal generation string even when implementation also changes.

### 4. What this RFC consumes from provider exchange

`provider-exchange-and-execution` owns `ProviderOperationId`, `ProviderAcquisitionReceipt`,
normalized request identity, parsed payload and retained delivery. Provider health **consumes those
sealed values and adds only application-stage state**; it does not redeclare or structurally
reconstruct them ([[D2578]]). The provider-protocol successor must add the three external exchange
operations `external_voice.render@1`, `external_voice.reasoning_review@1` and
`external_tts.synthesize@1` beside the five chess-source operations already specified there. Their
request/result maps are exact; no generic HTTP payload and no health-owned acquisition receipt
exists.

Each application operation has exactly one provider stage (§8), so its settlement is singular:

```ts
type ProviderStageSettlement =
  | { readonly kind: "success"; readonly stageId: string; readonly delivery: ProviderDelivery<unknown, ProviderOperationId> }
  | { readonly kind: "local_domain"; readonly stageId: string; readonly result: ProviderLocalDomainResult<ProviderOperationId> }
  | { readonly kind: "failed"; readonly stageId: string; readonly result: ProviderSourceFailure<ProviderOperationId> }
  | { readonly kind: "cancelled"; readonly stageId: string; readonly reason: "caller" | "superseded" | "shutdown" };

type ApplicationProviderOutcome<T> =
  | { readonly kind: "complete"; readonly value: T; readonly settlement: ProviderStageSettlement }
  | { readonly kind: "fallback"; readonly value: T;
      readonly source: "deterministic_renderer" | "browser_speech_or_text";
      readonly settlement: ProviderStageSettlement }
  | { readonly kind: "unavailable"; readonly settlement: ProviderStageSettlement }
  | { readonly kind: "cancelled"; readonly reason: "caller" | "superseded" | "shutdown"; readonly settlement: ProviderStageSettlement };
```

`settleOperation` accepts `unknown` and crosses one exact discriminated-union parser before reading
or mutating application state. Every arm rejects missing and extra keys. The `local_domain` arm
contains a sealed `ProviderLocalDomainResult` issued by provider exchange from the same request; an
application caller cannot author its value or reconstruct it structurally. Operation, instance,
implementation, generation and normalized-request identity are equal across request, result and
compiled stage before the application outcome is formed. **Only a sealed current-generation exchange
settlement may change health or shared-backoff state** — a structural clone, a plain success enum, a
caller-authored state value or a forged delivery naming another operation is refused before any
transition.

Voice rendering and speech are two independent application operations. Speech consumes a sealed
reference to text that was already rendered and displayed; it does not execute voice or retain a
synthetic earlier stage. A TTS failure therefore returns the speech operation's browser-speech/text
fallback while the earlier rendering operation keeps its own outcome. A failed no-fallback operation
is unavailable. Caller/superseded cancellation never heals or damages provider health. Provider
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
  least 60 seconds. `Retry-After`, when valid and longer, wins and is carried through settlement
  rather than collapsed to the floor. Only one request at a time is sent to that upstream;
- other HTTP 5xx/network failures use 5 s, 15 s, then 60 s delays, capped at 60 s; successful live
  work resets the sequence. The projection a snapshot reads and the coordinator that admits requests
  are the **same** authority and the same sequence;
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
generation change clears the vector and every claim. Civil timestamps are projection-only and never
decide duration. This is the complete operand set for [[D2579]].

Each backoff group has exactly one immutable `{blockedUntilMonotonic, claim}` state owned by one
coordinator constructed by, and belonging to, the registry that declares it. A claim is
`{groupGenerationImage, claimToken, leaseExpiresAtMonotonic}`. The image is the sorted exact set of
configured `{instanceId, implementation, generation}` members in **that compiled group** and its
digest; it carries no whole-registry or unrelated-cache revision, so cache or health traffic outside
the group leaves a live claim valid. `acquire` first expires an elapsed claim, then returns exactly
`blocked`, `claimed`, or a newly tokenized claim. `renew` and `settle` require the equal live token
and group image before expiry; stale/expired calls fail and cannot clear or extend a successor.
`settle(rate_limited)` clears the claim and advances the block to at least `now + 60_000` or a longer
valid `Retry-After`. Abort/throw/crash leaves the lease to expire, after which one successor is
admitted. A generation-set change invalidates the claim before admission, and the generation set is
issued only from the exact current snapshot of the owning registry — never from a caller array or a
cross-registry snapshot. A 429 from Explorer therefore delays a new tablebase request while their
instance snapshots remain distinct. Null-group UCI instances never share a coordinator. Group
membership is compiled from `PROVIDER_INSTANCE_DECLARATIONS`; an undeclared string or second hand
map fails closure ([[D2417]], [[D2580]]).

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
structurally equal object or application/stage relabel fails before touching cache state. The
opponent cache is changed from an unbounded `Map<string, Promise<OpponentSelection>>` to:

- maximum 512 settled entries plus at most the bounded in-flight population, evicted least-recently
  **used** — a hit updates recency, so a hot oldest row survives the 513th insertion;
- a key containing current request/policy/history identity **and** the exact provider generations
  used by the selected mode;
- in-flight coalescing separate from settled entries, so a rejected promise is never retained;
- an explicit TTL chosen per mode during implementation and no longer than 24 hours, enforced at
  insertion rather than only at read; the release resource matrix may lower size/TTL, never remove
  the bound;
- a receipt on every result distinguishing `live` from `cached_exact`;
- invalidation on generation change, and refusal of a late old-generation insertion.

Every settled cache implements one registry-owned read interface; the registry never trusts a cached
boolean copied at request time:

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
current row exists, but request admission calls `resolveExact` with all six identities; a count never
enables a different operation or key. A failed instance is `degraded_cached_only` only as a global
conditional capability; the exact operation result is `cached_exact_only` only after `resolveExact`
atomically returns the immutable payload, its original sealed exchange delivery and the current
cache-service receipt. There is no second lookup and no caller may assemble or replace the origin
after admission ([[D2581]]). Retained payloads are recursively immutable, so a shallow-frozen
descendant cannot change beneath an unchanged response digest. The join is in-memory and cannot call
a provider or refresh `checkedAt`. Thus removal of the last entry changes `/capabilities` even when
no new provider outcome occurred, and three voice operations sharing `external-voice` remain disjoint
by operation/request digest ([[D2414]]).

The existing 512-entry Explorer/tablebase caches become registry-aware. Their present no-data,
failure and successful-result TTLs may remain only if fixtures prove:

1. `no_data_at_band` / out-of-domain is a successful domain answer and does not mark a provider
   unhealthy;
2. HTTP/network/protocol failure does mark it unhealthy and is not rewritten as no data;
3. a cache hit returns `cached_exact` and does not update `checkedAt`;
4. stale-generation and expired entries cannot serve;
5. an open circuit never prevents an exact valid cached read, but does prevent a new live request.

Cached Stockfish/Maia selections are replayable opponent choices, not current provider evidence.
They preserve the original engine/model receipt inside the current cache-acquisition receipt.

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

The attachment is one compiled authority, not a server map. Each application operation declares its
consumer, its **one** provider stage and a `consumer_budget` deadline; there is no `dependsOn`, `when`,
multi-stage or `skipped` axis, because no operation in the product has one ([[D2850]]). The literal
declaration contains exactly these ten application operations:

| operation | stage → exchange operation |
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

Speech is a first-class HTTP/application operation because production requests it independently. Its
request contains a brand-sealed rendered-text reference—text digest, run, node and all five voice
scopes, including Compare—issued by the voice/deterministic renderer operation. It never calls
external voice again. A plain/spread/JSON/cross-run reference fails before TTS. Thus audio cannot
silently differ from displayed text and voice/TTS do not receive fresh nested deadlines ([[D2576]]).
`review.reasoning` is an independent non-evidence egress with a typed valid-empty arm; provider
failure is unavailable, never rewritten to an external empty answer ([[D2575]]).

`APPLICATION_PROVIDER_EXECUTION` is compiled beside the F1 manifest and keyed to operations in the
provider-protocol resource. Its obligation set is **derived from committed consumers and the
provider-exchange declarations**, not from a second hand-written list beside it ([[D2754]]); the
compiler consumes the candidate declaration passed to it and rejects missing, extra, duplicate and
count-preserving replacement operations; crossed instance/exchange mappings; unknown consumers;
illegal fallbacks; and absent consumer-budget deadlines. The web/server import only the compiled
image. Because this tuple consumes and extends the provider-protocol resource, this RFC cannot be
accepted until `provider-protocol-register` lands, provider exchange lands lane 1, and this RFC
atomically claims the next provider-protocol lane for the three external exchange identities plus
the ten application execution members.

Producer availability preserves operational state and derives the consumer result through its
compiled `providerOff` behavior:

- `available` provider → projection may be requested;
- `unverified` → request may be attempted within its deadline, but a consumer is never advertised as
  already live;
- `recovering` → request may be attempted one-at-a-time within its deadline, while the consumer is
  labelled recovering rather than verified;
- `degraded_cached_only` → only an exact-key lookup can be available; otherwise apply `providerOff`;
- `not_configured` / `unavailable` → apply the consumer's existing `available`, `honest_empty`, or
  `unavailable` behavior;
- a group block reaches the consumer as `temporarily_blocked` with its retry delay, for every member
  of the group, even when that member's own health is unchanged.

`honest_empty` remains a **consumer rendering outcome**, not provider health. Tablebase out-of-range
and Explorer `no_data_at_band` are typed domain outcomes with a healthy provider. Provider-off cannot
be worded as "no games found" or "outside tablebase range."

The compiler gets a closure assertion: every provider-backed F1 producer maps exactly once; every
mapping names a real registry provider; every configured non-null backoff group contributes exactly
one coordinator; no provider-backed producer can default to local available; and voice/TTS
dependencies are attached to their real rendering operations. The existing static provider branches
in `apps/web` are migration failures once this assertion lands.

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
both the server producer and web client. Every availability arm carries its declared `instanceIds`
population and, where the arm requires one, its reason. `requestable_unverified` and `recovering` are
preserved on the wire; neither is widened to `available` or collapsed into `unavailable`. Unknown
states, instance ids, reasons, extra fields and a server-only mode addition fail the shared
parser/producer set-equality fixture.

The route does not probe providers. It may therefore become stale between request start and the
operation; the operation receipt is authoritative for that operation, and its outcome updates the
next snapshot. Static frontend checks such as `providers.opponent !== "none"` are deleted. Controls
remain visible where the workflow needs them but show unavailable/degraded state, reason and retry;
they do not disappear and rearrange the board when a provider drops.

`/healthz` remains process liveness and never fails because an optional provider is absent. F12-A's
`/readyz` reports core storage/runtime readiness. Optional provider loss is included in its body but
does not change readiness to failure. A configured provider marked required by a later deployment
contract may affect readiness only through that explicit profile; no such required optional provider
exists in Choice-C core 1.0.

### 10. Learner and operator behavior

Ordinary learner surfaces translate state into the task, not infrastructure prose:

- if the selected opponent cannot answer, the run pauses before an opponent move is committed and
  offers Retry or Change opponent; it never auto-plays Stockfish, a random legal move, or a stale
  different-position answer;
- an exact cached opponent reply may continue only with its `cached_exact` receipt retained. The
  compact learner copy is "Using a saved response for this position"; Inspector names generation,
  source and time;
- Support/Review evidence modules render their compiled honest-empty/unavailable state in place. The
  board and primary action keep stable geometry; raw failure strings never enter the module;
- Explorer no-data, tablebase out-of-range, provider unavailable, temporarily blocked and cache-only
  are five different states and use different copy/actions;
- external voice failure falls back to the accepted deterministic renderer when available and
  identifies the result as deterministic. It never claims the provider spoke or adds a chess
  assertion;
- TTS failure preserves the text, offers browser speech only when the learner's preset permits it,
  and does not repeatedly re-request audio;
- settings and mode pickers show what the deployment can currently serve, while Advanced Inspector
  exposes timestamps/generation/reason. Ordinary play never dumps provider JSON.

**Honest absence applies to offered surfaces, not only disabled ones.** A control the deployment
cannot currently serve is rendered with its reason and its retry affordance; it is never removed from
the layout. Every `{#if capabilities?.providers.* }` block that deletes a control is replaced by a
shared selector that renders the honest state instead ([[D1469]]).

No provider transition changes an assistance ceiling. A recovered provider makes a module available
only when the active preset, session kind, role and disclosure state already permit it.

**The pause is live state only.** Retry re-issues the same selection request; Change opponent
switches the mode for the remainder of the session in memory. Neither is written to the run, so
Review and export do not show that a failure or a change occurred. That gap is
`rfc/opponent-recovery-journey.md` and the surface says so: the Inspector line for a recovered run
reads "this session changed opponent after a provider failure; the run record does not retain it."

### 11. Logging and privacy

Each transition logs a structured event with family id, instance id, generation prefix, previous/new
state, reason, operation id, duration, cache source and retry delay. It excludes FEN, PGN, learner
text, voice prompt/output, token, endpoint query string, account id and full model path.
Provider-specific debug logging remains opt-in and outside the default release profile.

No persistent health history is required for 1.0. Process-restart state begins from configuration and
real handshakes/outcomes; it does not claim yesterday's provider is currently healthy. Aggregate
metrics may be added later without changing this state authority.

## Implementation plan

One checkpoint. There is no run-schema claim, so there is no staged second checkpoint and no
lane-ordering rule to re-derive; `bot-policy.md` consumes the exported runtime authority at its own
lane 0.18 without waiting behind this RFC's persistence.

**Phase 1 — runtime authority.** Add `provider-health.ts` with the closed declarations, the
state-specific snapshot union, derived generations, monotonic clock handling, circuit and
coordinator behavior, and the immutable snapshot. Bind `EngineSupervisor` startup/exit/request
outcomes for both Stockfish instances and Maia. Add the compiled `APPLICATION_PROVIDER_EXECUTION`
extension and the common operation wrapper (one total deadline, abort, one same-provider retry,
closed settlement, registry update); adapt tablebase, corpus, external voice, reasoning review and
TTS onto provider-exchange deliveries. Preserve caller cancellation as an operation outcome without
provider-health damage.

**Phase 2 — caches and selectors.** Split opponent in-flight coalescing from a 512-entry
generation-keyed settled LRU with issued keys and recency on hit. Replace Maia's 60-second timeout
and every nested fresh timeout with the remaining F1 operation budget. Join the generation-valid
cache inventories to snapshot derivation and coordinate per-upstream 429 backoff. Make
`availableModes` request-aware through the registry and delete identity/config presence as
availability authority.

**Phase 3 — F1, API and client.** Compile the four provider-backed F1 producers from the registry
snapshot and attach the three voice, reasoning-review and sealed-text speech operations. Replace
`/capabilities.providers` flags with the shared parsed snapshot and typed mode summaries, including
`requestable_unverified` and `temporarily_blocked`; send `Cache-Control: no-store`. Replace every web
`providers.* !== "none"` branch with shared selectors that preserve layout and render honest
retry/change/fallback behavior; delete the speech route's second voice call; add Inspector detail and
compact learner copy without changing assistance permissions.

**Phase 4 — production-boundary proof.** Run the engine-on release profile: warm one Maia position,
stop Maia, prove cached-exact/new-position divergence inside the compiled deadline; restart Maia and
prove generation/cache invalidation plus recovery; fault the HTTP providers for timeout, 429, 401,
5xx, malformed payload and recovery, proving one coordinated retry path and no herd; exercise the
same paths through the real browser modules and opponent chooser at phone/tablet/desktop layouts.

## Acceptance criteria

Each criterion below can fail against a real implementation, and each names the blocked ledger rows
it discharges. A criterion that no row needs, or that no implementation can fail, does not belong
here ([[D444]], [[D984]], [[D1274]]).

| # | criterion | rows |
|---|---|---|
| 1 | The registry has exactly six family ids, seven concrete instance ids and ten application operation ids, all derived from `PROVIDER_INSTANCE_DECLARATIONS` with no second map. Configuration is parsed against the tuple before construction: an unknown row fails rather than being dropped, and configured snapshots retain the exact family and implementation whose generation they name. Independent `stockfish-play`/`stockfish-analysis` death and restart fixtures never change the other's state or consumers. | D1910, D2846, D2942 |
| 2 | The state-specific snapshot union rejects invented fields on `not_configured`, missing required fields on outcome-bearing arms, and every illegal reason/cache combination. Constructor/config presence alone produces only `not_configured` or `unverified`; only a real current-generation handshake or request produces `available`. A clean external provider is `requestable_unverified`, makes its first real learner request without a probe, and reaches both success and failure. Repeat-open → first live success produces `recovering(1/2)` with times and prior reason; second success produces `available`; an intervening failure resets it; generation change or restart returns clean `unverified`. Monotonic and civil operands are separate: changing civil time changes display bytes only. | D1911, D2815, D2917, D2949 |
| 3 | The permanent R18 fixture warms one Maia selection, stops the sidecar, receives the same request as `cached_exact`, and receives a typed bounded unavailable result for a new position. The next `/capabilities` snapshot is `degraded_cached_only`, not available. | D609 |
| 4 | Maia, both Stockfish instances, Explorer, tablebase, voice render, reasoning review and TTS each have timeout, cancellation, malformed-response, configured-off and recovery fixtures. Caller cancellation does not open a circuit; reasoning-review failure cannot become a valid external empty answer. | D1913, D2575 |
| 5 | No provider operation — queue, retry, rendering, TTS or fallback — can exceed its compiled F1 consumer deadline. A source guard fails on `apps/server/src/opponent-selector.ts:612`'s `timeoutMs: 60_000` and on any per-attempt voice deadline reset. | D1912 |
| 6 | One authority owns blocked-until, the backoff sequence and result settlement, and the snapshot projection reads that same authority. A Lichess 429 blocks Explorer and tablebase for at least 60,000 ms, honors a longer valid `Retry-After` rather than collapsing it to the floor, escalates repeated transient failures 5 s → 15 s → 60 s, forms no cross-instance retry herd, and leaves the two instance snapshots distinct. | D2417, D2848, D2919, D2914, D2969 |
| 7 | Backoff acquire/renew/settle/expire fixtures cover crash, abort, expiry race, generation change and stale completion. All four operations exist. Only the current token and the exact compiled group member image may renew or settle; an old-generation claim cannot block a new generation; a stale or cross-registry claim cannot clear or extend a successor. | D2580, D2818, D2759, D2827, D2968, D2871 |
| 8 | Only a sealed current-generation provider-exchange settlement may change instance health or group state. A caller-authored health value, a plain success enum, an unknown settlement kind, an arbitrary `local_domain` value, a structurally forged delivery naming another operation/generation/request, a publicly constructible exchange authority, and a same-generation group reset each fail before any state changes. Every settlement arm is exact-key parsed. | D2758, D2872, D2946, D2966, D2945, D2858, D2757 |
| 9 | Every behavior-affecting configuration or implementation change requires a distinct derived generation; no public operation mints one from a caller string. Reuse fails before cache, health or claim state changes; a valid new generation invalidates all three together. Configured implementation is a checked member of the declaration's `allowedImplementations`; switching tablebase/Explorer remote→local changes generation. Release compilation rejects `local_fixture` and refuses to issue a release receipt over a snapshot containing it; `local_service` is labelled honestly in both configured implementation and origin receipt and never impersonates Lichess. No caller-supplied generation string can clear a live claim or a 429 block. | D2873, D2967, D2763, D2362, D2970, D2415 |
| 10 | The opponent settled cache is a maximum 512-entry LRU whose recency updates on a hit, keys every provider-instance generation, separates in-flight work, enforces its ≤24-hour TTL at insertion, refuses a late old-generation insertion, and invalidates on generation change. Insertion and lookup accept only a cache-key capability issued by the owning registry from the exact compiled declaration and sealed request; a structural clone, JSON round-trip, application/stage relabel or cross-registry key fails. Retained payloads are recursively immutable. | D2756, D2826, D2971, D2825, D2870, D2849, D2859 |
| 11 | Exact-cache resolution is one atomic immutable result carrying the payload, its original sealed exchange delivery and a current cache-service receipt. Expiry or eviction between availability and use cannot cross provenance because no second lookup exists. | D2581, D2849 |
| 12 | Cache inventory is live state authority at operation/stage/instance/generation/request/key grain. Removing the last valid entry by TTL expiry, LRU eviction, explicit invalidation or generation cleanup changes the next snapshot from `degraded_cached_only` to `unavailable` with no provider call and no `checkedAt` change. Adding a current-generation exact entry permits cache-only; stale-generation entries never count. An operation reaches `cached_exact_only` only from the atomic hit for its own request/cache key — a different request on the same failed instance misses. | D1915, D2819, D2912, D2947 |
| 13 | Two equal read-only snapshots at one revision and monotonic sample are independently valid for selectors and receipts; issuing one never revokes the other, and a read-only validation never installs a new snapshot. A real revision change, or a current monotonic sample whose retry/expiry projection differs, rejects both. Release receipts are bound to the issuing registry's exact current revision and to one canonical sorted generation image used verbatim for both issuance and validation, so a freshly issued multi-provider receipt validates before any transition. | D2869, D2857, D2762, D2913, D2915, D2847, D2943 |
| 14 | The compiled execution closure maps exactly `live.stockfish`→`stockfish-analysis`, `live.syzygy`→`tablebase-primary`, `human.maia`→`maia-inference`, `human.explorer`→`explorer-primary`, and opponent Stockfish only to `stockfish-play`. The application set is exactly ten, each with one real provider stage; the unused `dependsOn`/`when`/`stages`/`skipped` axes do not exist. The three voice consumers compile voice rendering, reasoning review has its own operation, and speech compiles only TTS. The obligation set is derived from committed consumers and provider-exchange declarations; an orphan, missing, duplicate, substituted or count-preserving replacement operation fails, and no handwritten subset satisfies the gate. | D1912, D2577, D2754, D2816, D2817, D2850, D2583 |
| 15 | Every configured non-null backoff group contributes exactly one coordinator, owned by the registry that declares it, before a snapshot, release receipt or operation selection is authority. A missing or duplicate coordinator, a coordinator belonging to another registry, and any public predecessor-registry mutation each fail. One composed authority exports the snapshot, application outcome, availability selector, release receipt and settlement operation together. | D2918, D2944, D2943, D2851, D2753 |
| 16 | Speech accepts only a sealed displayed-text identity covering all five scopes, including Compare, and never calls external voice. The seal is issued by the rendering/display authority and cannot be minted by a caller. Rendering success followed by TTS failure remains two independently settled operations; speech falls back without relabelling browser speech as provider audio. | D2576, D2755 |
| 17 | `/capabilities` is `no-store`, does not probe, and contains only state-valid fields. Server and web import one wire type and one strict parser; every availability arm carries its declared `instanceIds` population and required reason; `requestable_unverified`, `recovering` and `temporarily_blocked` survive the round trip; a server-only field, state or mode fails the set-equality fixture. A group block makes both members non-requestable while their instance health snapshots stay distinct. | D2947, D2948, D1911, D2914 |
| 18 | All former `CapabilityProviders` presence branches are deleted or mechanically proven derived from `ProviderRegistrySnapshot`, and the client has zero direct `providers.* !== "none"` feature gates. Every surface the deployment cannot currently serve renders its reason and retry affordance rather than being removed from the layout — a guard fails on any `{#if capabilities?.providers.*}` that deletes a control. | D1469 |
| 19 | A late result from an old generation cannot heal health, populate the new-generation cache, or reach a response. | D1910, D2825 |
| 20 | External voice failure returns only the deterministic renderer's sealed evidence through the `fallback` arm, retains the provider failure separately, and leaves `external-voice` unavailable; no LLM output is cached or presented as evidence. No mode silently substitutes a different provider: human-common/theory-strict/practical never become Stockfish or random, perfect-tablebase never becomes engine search, corpus never becomes authored theory, and TTS never changes the text. | D2575, D609 |
| 21 | Explorer `no_data_at_band` and tablebase out-of-range keep their providers healthy and render differently from unavailable, temporarily blocked and cache-only. Negative fixtures fail if any two are collapsed. | D1912 |
| 22 | Browser production-boundary tests prove the paused-opponent surface, exact-cache disclosure, stable module geometry, honest-empty versus unavailable, deterministic voice fallback, and recovery at phone/tablet/desktop widths, with no raw provider strings in ordinary play. Settled caches and queues stay inside their declared bounds under 10× capacity pressure; the release-tier heap/RSS verdict remains F12-E/F12-H. | D1469, D2756 |

## Falsifiers and negative fixtures

The implementation is rejected if any of these can pass:

- a configured but never-called HTTP provider appears `available`;
- a configured but never-called HTTP provider is marked unavailable and therefore cannot make its
  first real request;
- a cache hit changes `checkedAt` or closes a circuit;
- the last exact cache row expires or is evicted while the snapshot remains cache-only;
- the warmed Maia position succeeds after sidecar death and thereby keeps a new position enabled;
- a provider-off Explorer response is rendered as "no games at this rating";
- an eight-second two-attempt voice path satisfies a four-second consumer budget;
- stopping Maia causes a human-common run to commit a Stockfish or random reply;
- restarting the same Maia binary leaves old-generation selections readable;
- `/capabilities` itself calls a provider or mutates health;
- `/healthz` fails, or `/readyz` reports not-ready, because an optional provider is absent;
- a browser hides a disappearing control and reflows/shrinks the active board instead of preserving
  the module's unavailable state;
- a deterministic fallback is labelled external voice or permitted to add a sentence absent from the
  sealed F1 view;
- a cached acquisition carries a failure reason or omits its original live/local origin;
- `stockfish-play` failure disables `live.stockfish` analysis, or analysis recovery enables the play
  opponent;
- reasoning-review provider failure returns a valid external empty answer;
- speech re-requests voice, rejects Compare, or accepts a caller-built text string/reference;
- two transient opens more than five minutes apart enter two-success recovery;
- an expired/stale group claim clears or renews its successor;
- cache availability and value/origin require two reads;
- a failed TTS stage disappears when text/browser fallback succeeds; or
- the in-session opponent change is presented as if the run record retained it.

## Rollout and compatibility

This is a pre-1.0 API correction with **no run-schema change**. The server and bundled web client
change together. During one implementation commit, tests may construct the legacy
`CapabilityProviders` adapter, but the production application must expose only the live snapshot when
the RFC closes. No pack, database-migration, evidence-kind, run-schema or unrelated lane changes
because health became live.

Durable acquisition and the two recovery events were run-schema lane 0.26 in this document until
2026-09-06. The lane and its `changes` text moved intact to `rfc/opponent-recovery-journey.md`; this
RFC now claims `none`. Nothing about the persisted run shape is decided here or left to
implementation — it is decided in a named successor.

Rollback may remove the new API fields only before a release claims F12-H. It may never restore the
60-second Maia wait, the unbounded cache, or static green capability behavior as a compatibility fix.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Run Maia/Stockfish/HTTP-provider failure, exact-cache divergence and recovery on the final digest-pinned CPU release profile rather than a source-only fixture | `planning/platform-alignment/release-platform/` F12-H | final release-proof receipt and exploration-log entry | |

## Changelog

- 2026-09-06 — **cut from 1,666 lines to its blocking obligation.** All 75 items carrying this RFC as
  their blocker were defect rows against its own twelve-round author model, not downstream product
  work. The review-round history, routing table, round-by-round changelog and the twenty-two
  harness-pinned acceptance criteria moved to
  `planning/provider-health-degradation/round-history-and-cut-2026-09-06.md`; durable opponent
  recovery and run-schema lane 0.26 moved to `rfc/opponent-recovery-journey.md`; the provider-exchange
  type re-declaration in §4 collapsed to the consumption rule that
  `rfc/provider-exchange-and-execution.md` already owns. The historical `make provider-health-*`
  targets remain on disk as retained exploration evidence, but canonical governance runs only the
  bounded `provider-health-cut-contract`; otherwise old prose assertions require reversing the cut
  ([[D3059]]). No further harness round is a prerequisite for anything. Acceptance criteria are now
  22, each mapped to the rows it discharges.
- 2026-09-06 — twelfth fresh independent review returned the eleventh repair on [[D2966]]–[[D2971]].
  With the eleven preceding rounds it is indexed in the planning note above.
- 2026-08-27 — created on the owner's O13 Choice-C ruling after R18 reproduced D609 by stopping Maia
  while `/capabilities` stayed green. First independent buildability review:
  `planning/provider-health-degradation/independent-buildability-review-2026-08-27.md`.

## Open questions

None for owner ruling. Exact per-provider lower timeout values and settled-cache TTLs are measured
implementation parameters bounded above here by F1 latency and 24 hours; they do not change product
meaning. If a test shows the compiled F1 opponent deadline cannot support the selected Maia model on
the ruled CPU tier, that is release evidence against the tier/model contract and must be escalated,
not solved by silently lengthening the interactive deadline.
