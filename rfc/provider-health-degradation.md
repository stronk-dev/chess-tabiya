# RFC: Provider health and honest degradation

- **Status:** draft — returned by independent buildability review 2026-08-27 on [[D1910]]–[[D1915]]
- **Author:** Codex on the owner's O13 Choice-C ruling
- **Created:** 2026-08-27
- **Design refs:** `design/02-product-shape.md` deployment axis; `design/03-product-breadth.md` B4/B8; `design/05-in-run-experience.md` assistance/source-risk boundary
- **Exploration gate:** O13 / D616 selected the stronger appliance floor; R18 reproduced D609 by stopping Maia while `/capabilities` stayed green
- **Depends on:** implemented `rfc/archive/evidence-contract-manifest.md`; `rfc/archive/engine-request-contract.md`; F12-A's deployment readiness boundary
- **Parent / amends:** current `/capabilities`, `EngineCapabilities`, evidence-manifest availability, engine supervisor, opponent selector, corpus/tablebase/voice/TTS clients
- **Supersedes / superseded by:** —
- **Planning:** `planning/provider-health-degradation/` (once implementing)

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

One application-lifetime `ProviderRegistry` owns exactly these runtime providers:

```ts
type ProviderId =
  | "stockfish"
  | "maia"
  | "tablebase"
  | "explorer"
  | "voice"
  | "tts";

type ProviderImplementation =
  | "uci_sidecar"
  | "lichess_http"
  | "external_http"
  | "local_fixture";
```

`stockfish` covers both judgement and strong-engine opponent operations but keeps one generation
per supervised engine identity. `maia` covers human-model policy/inference. `tablebase` and
`explorer` cover the configured implementation, including a later local implementation. `voice`
and `tts` are rendering services; they are tracked by the same operational authority but do not
become chess-evidence producers.

Mock/test providers use `local_fixture` and publish that implementation literally. They must never
be serialized as `maia`, `stockfish`, `lichess_http`, or `external_http`, including in development
screenshots and production smoke tests.

Configuration answers only whether a provider exists and which implementation is intended. It
does not answer health. The current `CapabilityProviders` strings may remain during migration only
as a projection of the registry snapshot; no server or client branch may continue to use
constructor presence as authority after criterion 7.

### 2. State model

```ts
type ProviderState =
  | "not_configured"
  | "unverified"
  | "available"
  | "degraded_cached_only"
  | "unavailable";

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

interface ProviderHealthSnapshot {
  readonly providerId: ProviderId;
  readonly implementation: ProviderImplementation;
  readonly state: ProviderState;
  readonly generation: string;
  readonly checkedAt: string | null;
  readonly lastSuccessAt: string | null;
  readonly lastFailureAt: string | null;
  readonly reason: ProviderFailureReason | null;
  readonly retryAfterMs: number | null;
  readonly cacheScope: "none" | "exact_request";
}
```

The transitions are closed:

- absent configuration → `not_configured`;
- configured external HTTP provider with no real outcome → `unverified`;
- successful live request, or a completed UCI startup handshake for the current supervised
  generation → `available`;
- live failure with at least one valid exact-request cache entry → `degraded_cached_only`;
- live failure with no valid exact-request cache entry → `unavailable`.

`unverified` is deliberate. Voice/TTS/Explorer/tablebase are not probed with invented chess data,
learner text, or billable prompts merely to paint a green badge. Their first real request verifies
them. A local UCI `uci`/`isready` handshake is an actual protocol operation and may establish
availability before the first chess request.

The provider-global state never claims that a cached entry applies to the current request. Every
operation separately resolves `live`, `cached_exact`, or unavailable. `degraded_cached_only` must
always publish `cacheScope: "exact_request"`; clients may not turn it into a generally enabled
feature.

`checkedAt` changes only on a real handshake/request outcome. Reading `/capabilities`, reading a
cache entry, rendering deterministic text, and a browser polling the server do not refresh it.

### 3. Generation and identity

Every configured provider has a stable generation digest:

```text
sha256(provider id | implementation | endpoint/engine id | immutable model/engine identity |
       behavior-affecting options | supervisor start generation)
```

Secrets and bearer tokens are excluded from the digest and all receipts. A secret/config rotation
changes generation through a non-secret configuration revision. UCI process restart always changes
the supervisor generation even when the engine binary/version is identical. A model, endpoint,
engine binary, weight digest, Elo implementation, or behavior-affecting option change also changes
generation.

Generation change atomically:

1. moves the provider to `unverified` (external) or `startup`/unavailable until UCI handshake;
2. cancels or lets finish—but never publishes—old-generation in-flight work;
3. invalidates every cache entry whose key names the old generation;
4. causes a late old-generation result to be discarded rather than healing the new generation.

### 4. One receipt for every provider-backed operation

Every success and typed failure crossing a service/HTTP boundary includes:

```ts
interface ProviderOperationReceipt {
  readonly providerId: ProviderId;
  readonly generation: string;
  readonly source: "live" | "cached_exact" | "local_fixture" | "deterministic_fallback";
  readonly startedAt: string;
  readonly completedAt: string;
  readonly deadlineMs: number;
  readonly reason?: ProviderFailureReason;
  readonly retryAfterMs?: number;
}
```

The receipt describes acquisition, not chess quality. It cannot say accurate, human, best,
practical, insightful, or trustworthy. Existing evidence payload provenance remains intact; the
receipt does not replace engine identity, query population, tablebase domain, or F1 evidence
identity.

`deterministic_fallback` is legal only where an accepted consumer already permits a deterministic
renderer over the same sealed evidence (currently voice). It is not a provider success and never
heals `voice`. Browser speech and authored/deterministic text remain their own named sources. TTS
failure may offer browser speech where configured by the learner, but never report it as provider
audio.

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

The registry coordinates one circuit per provider generation:

- process exit, failed UCI handshake, authentication failure, or protocol-invalid output opens the
  circuit immediately;
- timeout, network failure or overload opens it for new interactive work immediately after the
  failing operation; existing exact cache entries remain readable;
- Lichess HTTP 429 opens the relevant upstream for at least 60 seconds. `Retry-After`, when valid and
  longer, wins. Only one request at a time is sent to that upstream;
- other HTTP 5xx/network failures use 5 s, 15 s, then 60 s delays, capped at 60 s; successful live
  work resets the sequence;
- authentication/protocol failures remain open until generation/configuration changes or an
  explicit operator retry starts one half-open request.

While open, one request after `retryAfterMs` becomes the half-open real request. Concurrent callers
receive the typed current state or an exact cached answer; they do not form a retry herd. UCI
supervisor recovery uses its actual restart handshake as the half-open operation.

One successful half-open request changes `unavailable` to `available`. To avoid a green/red flicker
after repeated transient HTTP failures, a provider that has opened twice within five minutes
requires two consecutive successful real requests before returning to `available`; between them it
remains `unverified`. A failure resets that recovery count. Cache hits never count.

### 7. Cache contract

All provider caches use bounded LRU entries and generation-complete keys. The opponent cache is
changed from an unbounded `Map<string, Promise<OpponentSelection>>` to:

- maximum 512 settled entries plus at most the bounded in-flight population;
- a key containing current request/policy/history identity **and** the exact provider generations
  used by the selected mode;
- in-flight coalescing separate from settled entries, so a rejected promise is never retained;
- an explicit TTL chosen per mode during implementation and no longer than 24 hours; the release
  resource matrix may lower size/TTL, never remove the bound;
- a receipt on every result distinguishing `live` from `cached_exact`;
- invalidation on generation change.

The existing 512-entry Explorer/tablebase caches become registry-aware. Their present no-data,
failure and successful-result TTLs may remain only if fixtures prove:

1. `no_data_at_band` / out-of-domain is a successful domain answer and does not mark a provider
   unhealthy;
2. HTTP/network/protocol failure does mark it unhealthy and is not rewritten as no data;
3. a cache hit returns `cached_exact` and does not update `checkedAt`;
4. stale-generation and expired entries cannot serve;
5. an open circuit never prevents an exact valid cached read, but does prevent a new live request.

Cached Stockfish/Maia selections are replayable opponent choices, not current provider evidence.
They preserve the original engine/model receipt plus the current cache-acquisition receipt. Review
and export can therefore say what actually selected the move without claiming the provider is live.

### 8. F1 availability join

F1 remains the sole producer→projection→consumer authority. `evidenceManifestCapabilities` stops
accepting `CapabilityProviders` and accepts a frozen `ProviderRegistrySnapshot`. The mapping is
closed:

| F1 producer | Provider |
|---|---|
| `live.stockfish` | `stockfish` |
| `live.syzygy` | `tablebase` |
| `human.maia` | `maia` |
| `human.explorer` | `explorer` |

All other F1 producers remain local/recorded/build-time and are unaffected. Voice/TTS attach to the
already declared `guidance.voice`, `guidance.voice_compare`, and `guidance.voice_story` rendering
operations; they do not acquire evidence-producer ids.

Producer availability preserves operational state and derives the consumer result through its
compiled `providerOff` behavior:

- `available` provider → projection may be requested;
- `unverified` → request may be attempted within its deadline, but a consumer is never advertised
  as already live;
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
    readonly state: "available" | "cached_exact_only" | "unavailable";
    readonly providerIds: readonly ProviderId[];
    readonly reason: string | null;
  }[];
  readonly evidenceManifest: EvidenceManifestCapabilities;
}
```

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

### 11. Logging and privacy

Each transition logs a structured event with provider id, generation prefix, previous/new state,
reason, operation id, duration, cache source and retry delay. It excludes FEN, PGN, learner text,
voice prompt/output, token, endpoint query string, account id and full model path. Provider-specific
debug logging remains opt-in and outside the default release profile.

No persistent health history is required for 1.0. Process-restart state begins from configuration
and real handshakes/outcomes; it does not claim yesterday's provider is currently healthy. Aggregate
metrics may be added later without changing this state authority.

## Implementation plan

### Phase 1 — runtime authority

1. Add `provider-health.ts` with the closed ids/types, state machine, monotonic clock handling,
   generation changes, circuit behavior and immutable snapshot.
2. Bind `EngineSupervisor` startup/exit/request outcomes for Stockfish/Maia.
3. Add a common operation wrapper for deadline, abort, one same-provider retry, receipt and registry
   update; adapt tablebase, corpus, external voice and TTS.
4. Preserve caller cancellation as operation outcome without provider-health damage.

### Phase 2 — caches and selectors

5. Split opponent in-flight coalescing from a 512-entry generation-keyed settled LRU and return
   receipts on every selection.
6. Replace Maia's 60-second timeout and every nested fresh timeout with the remaining F1 operation
   budget.
7. Join tablebase/corpus cache outcomes to the registry and coordinate per-upstream 429 backoff.
8. Make `availableModes` request-aware through the registry; delete identity/config presence as
   availability authority.

### Phase 3 — F1/API/client

9. Compile the four provider-backed F1 producers from the registry snapshot and attach voice/TTS to
   their renderer operations.
10. Replace the current `/capabilities.providers` flags with the runtime snapshot and typed mode
    summaries; send `Cache-Control: no-store`.
11. Replace every web `providers.* !== "none"` branch with shared selectors that preserve layout and
    expose honest retry/change/fallback behavior.
12. Add Inspector detail and compact learner copy without changing assistance permissions.

### Phase 4 — production-boundary proof

13. Run the engine-on release profile, warm one Maia position, stop Maia, and prove cached exact/new
    position divergence inside the compiled deadline.
14. Restart Maia and prove generation/cache invalidation plus recovery.
15. Fault the HTTP providers for timeout, 429, 401, 5xx, malformed payload and recovery; prove one
    coordinated retry path and no herd.
16. Exercise the same paths through the real browser modules and opponent chooser at phone/tablet/
    desktop layouts.

## Acceptance criteria

1. The provider registry has exactly six ids and five states; unknown ids, states and reasons fail
   parsing rather than defaulting to available.
2. Constructor/config presence alone produces only `not_configured` or `unverified`; only a real
   current-generation handshake/request produces `available`.
3. The permanent R18 fixture warms one Maia selection, stops the sidecar, receives the same request
   as `cached_exact`, and receives a typed bounded unavailable result for a new position. The next
   `/capabilities` snapshot is `degraded_cached_only`, not available.
4. Maia, Stockfish, Explorer, tablebase, voice and TTS each have timeout, cancellation, malformed
   response, configured-off and recovery fixtures. Caller cancellation does not open a circuit.
5. No provider operation, including queue and retry, can exceed its compiled F1 consumer deadline.
   A source guard fails on Maia's old `60_000` timeout and on per-attempt voice deadline reset.
6. Lichess 429 opens one upstream-wide circuit for at least 60 seconds, permits no concurrent retry
   herd, and honors a longer valid `Retry-After`.
7. All former `CapabilityProviders` presence branches are deleted or mechanically proven derived
   from `ProviderRegistrySnapshot`; the client has zero direct `providers.* !== "none"` feature
   gates.
8. F1 closure maps exactly `live.stockfish`, `live.syzygy`, `human.maia`, and `human.explorer` to the
   declared providers and no others. Every provider-off consumer produces its declared state.
9. Explorer `no_data_at_band` and tablebase out-of-range keep their providers healthy and render
   differently from unavailable. Negative fixtures fail if either is collapsed.
10. The opponent settled cache is a maximum 512-entry LRU, keys every provider generation, separates
    in-flight work, invalidates on generation change and emits `live`/`cached_exact` receipts.
11. A late result from an old generation cannot heal health, populate the new-generation cache or
    reach a response.
12. External voice failure returns only the deterministic renderer's sealed evidence, labels the
    source `deterministic_fallback`, and leaves `voice` unavailable; no LLM output is cached or
    presented as evidence.
13. No mode silently substitutes a different provider. Human-common/theory-strict/practical modes
    never become Stockfish/random; perfect-tablebase never becomes engine search; corpus never
    becomes authored theory; TTS never changes the text.
14. `/capabilities` is `no-store`, does not probe, contains current timestamps/reasons/generations,
    and shares the same registry snapshot used for operation admission and F1 availability.
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

## Falsifiers and negative fixtures

The implementation is rejected if any of these can pass:

- a configured but never-called HTTP provider appears `available`;
- a cache hit changes `checkedAt` or closes a circuit;
- the warmed Maia position succeeds after sidecar death and thereby keeps a new position enabled;
- a provider-off Explorer response is rendered as “no games at this rating”;
- an eight-second two-attempt voice path satisfies a four-second consumer budget;
- stopping Maia causes a human-common run to commit a Stockfish or random reply;
- restarting the same Maia binary leaves old-generation selections readable;
- `/capabilities` itself calls a provider or mutates health;
- a browser hides a disappearing control and reflows/shrinks the active board instead of preserving
  the module's unavailable state;
- a deterministic fallback is labelled external voice or permitted to add a sentence absent from
  the sealed F1 view.

## Rollout and compatibility

This is a pre-1.0 API correction. The server and bundled web client change together. During one
implementation commit, tests may construct the legacy `CapabilityProviders` adapter, but the
production application must expose only the live snapshot when the RFC closes. No persisted run,
pack, migration, evidence-kind or schema version changes solely because health is live.

Existing run evidence and opponent selections remain readable. New selections add acquisition
receipts; if that makes the run event shape persistent, the implementing RFC must use the already
claimed run-schema lane rather than smuggling a field into stored events. If the receipt remains in
the current response/diagnostic envelope and is not persisted, no migration is claimed. The
implementer must settle that boundary in its implementation plan before code changes.

Rollback may remove the new API fields only before a release claims F12-H. It may never restore the
60-second Maia wait, unbounded cache, or static green capability behavior as a compatibility fix.

## Discharges

| id | the obligation | owner | recorded when discharged | discharged |
|---|---|---|---|---|
| D1 | Run Maia/Stockfish/HTTP-provider failure, exact-cache divergence and recovery on the final digest-pinned CPU release profile rather than a source-only fixture | `planning/platform-alignment/release-platform/` F12-H | final release-proof receipt and exploration-log entry | |

## Independent-review routing

| finding | blocker | repair owner |
|---|---|---|
| [[D1910]] | one Stockfish health key cannot represent play and analysis instances | §§1–3 and F1 mapping |
| [[D1911]] | not-configured/unverified states are not total across snapshot and mode API | §§2, 8–10 |
| [[D1912]] | F1 has no rendering-provider dependency/pipeline contract for voice/TTS | §§5, 8 and criterion 5 |
| [[D1913]] | receipt permits contradictory success/failure/fallback combinations | §4 and operation wrapper |
| [[D1914]] | durable opponent receipt contradicts the `none` run-schema claim | rollout/register plus run compatibility |
| [[D1915]] | cache-only global state has no cache-inventory transition | §§2, 7 and snapshot derivation |

## Open questions

None for owner ruling. Exact per-provider lower timeout values and settled-cache TTLs are measured
implementation parameters bounded above here by F1 latency and 24 hours; they do not change product
meaning. If a test shows the compiled F1 opponent deadline cannot support the selected Maia model on
the ruled CPU tier, that is release evidence against the tier/model contract and must be escalated,
not solved by silently lengthening the interactive deadline.
