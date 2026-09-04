# Provider health/degradation — fourth fresh independent buildability review

**Reviewed:** 2026-09-04

**Reviewer:** Codex, fresh application after the third author repair

**Verdict:** **RETURNED on [[D2575]]–[[D2583]].** The prior family/instance split, explicit
recovering label, local-service provenance and shared-backoff identity survive. The proposed
authority is not yet closed over the product's provider calls, does not join the existing provider
exchange authority, and cannot represent several failure/recovery paths it promises.

**Reproduction:** `make provider-health-fourth-fresh-review` retains the prior 17 author checks and
passes nine able-to-fail blocker controls.

## What survived

The third repair improved the contract in real ways. Provider family is no longer health identity;
play and analysis Stockfish are distinct instances; clean start and recovery have distinct public
labels; production-local service is not mislabeled as remote; request-specific cache identity is
declared; and Lichess Explorer/tablebase share a backoff-group identity without merging health.
Those decisions remain useful inputs to the next repair.

The return is about the joins around them. The author model proves the repaired vocabulary in
isolation, but crossing it against the live server routes and the provider-exchange RFC exposes nine
blocking seams.

## Blocking findings

### D2575 — a live provider egress is absent from the operation census

`ExternalHttpVoiceProvider` implements both `render()` and `review()`. The reasoning-review route
calls `reasoningReviewProvider.review(reviewRequest)` and sends learner transcript/detections to the
configured external endpoint. None of the eight operation rows names it. It consequently receives
none of the proposed deadline, health, circuit, cancellation, backoff, receipt or degradation
authority. Today the route retries twice with separate provider timeouts, swallows every failure and
returns `{provider:"external", proposals:[]}`, making provider failure indistinguishable from a
valid external empty answer.

The next operation census must derive from all production provider call sites, including
non-evidence egress. Reasoning review needs its own consumer operation and typed failure/empty
outcome; it must not be squeezed into chess-evidence voice.

### D2576 — the voice/TTS graph contradicts the live request graph

The RFC says no caller requests TTS independently and models audio as a conditional internal stage
of `render.voice`, `render.voice_compare` and `render.voice_story`. Production exposes `/speech` as
a separate HTTP request. That route may call external voice again and then calls
`ttsProvider.synthesize`, giving each provider its own fresh timeout. It admits marker, reading,
steering and story but not Compare. The advertised three voice→audio pipelines therefore do not
describe the operation cardinality, scope, ordering, cancellation or deadline that users exercise.

Choose and specify one graph. Either speech is a first-class request consuming an already sealed
text identity, or voice returns optional audio in one request. The server, API client and compiled
declaration must share it exactly; a second voice call made only to obtain speech must not silently
produce different text.

### D2577 — the closure harness remains green without the compiler

The third-repair model has operation, stage, instance and `when`. It has no consumer, dependency,
fallback, deadline or stage-order data. `assertProviderClosure()` checks only that there are eight
unique operation strings and that each stage's instance exists. A count-preserving replacement of
`opponent.stockfish_play` with an undeclared `opponent.unowned_side_door` passes. The test advertised
as set closure only computes that deleting one row leaves seven; it never passes the mutation to the
checker.

The next author target must execute the RFC's actual compiler: independent obligation set,
operation/consumer/exchange mapping, ordered dependencies, legal fallbacks, deadline source and
strict parser. Missing, extra and count-preserving replacements must fail that constructor.

### D2578 — provider health and provider exchange compete for the same authority

`provider-exchange-and-execution.md` already defines `ProviderOperationId`,
`ProviderAcquisitionReceipt`, five canonical exchange operations, actual/requested identities,
generation capture and ten domain-separated digest constructors. This RFC redeclares the same type
names for eight application operations with a different receipt, generation and request identity.
It never maps an application execution stage to the exchange operation that actually acquires its
bytes.

There must be one direction of ownership: provider exchange owns low-level request/acquisition/
payload identity; provider health owns instance-generation state and application pipeline
settlement. Give the two layers distinct names and compile every provider-backed stage to exactly
one exchange operation (or a named local/non-exchange stage). Cache and persisted opponent
provenance must carry the existing sealed exchange receipt rather than a second look-alike receipt.

### D2579 — the recovery window has no reducer operands

The normative rule requires two transient opens within five minutes before the two-success recovery
path. The unavailable snapshot retains neither count nor opening timestamps. The author reducer
accepts no time and increments `opensInWindow` forever; two failures arbitrarily far apart enter
recovery. It also cannot express transient-only qualification, window expiry, the different
authentication/protocol retry rule, or restart reconstruction.

Specify one internal immutable state and monotonic transition algebra for clean start, open history,
half-open claim, recovery progress, window expiry, generation change and restart. Wall-clock
timestamps may be projected for operators, but duration decisions need a monotonic clock operand.

### D2580 — the shared-upstream lease is only prose

The RFC names `(backoffGroup,generationSet,claimToken,leaseExpiresAt)` but defines no acquire,
renew, settle, expire or stale-token transition. The author model is a boolean `Set` cleared only by
`complete()` or `rateLimited()`. A crash/abort/throw can block both Lichess services forever; an old
completion can clear a newer claim because settlement has no token.

Publish the exact lease state/result types and reducer. Expiry must admit one successor, and only
the current token/generation set may settle or extend it. Execute crash, abort, expiry race,
generation change and stale completion.

### D2581 — cache admission and cached value are split

`ProviderCacheInventory.resolveExact()` returns a receipt but no value. The author cache stores and
returns only six identity strings, not the original acquisition or payload. A separate cache read is
therefore still required to obtain the answer, creating two authorities and an eviction/expiry/
generation race between availability and use.

Each typed provider cache must atomically return `miss` or one immutable hit containing the value,
the sealed original provider-exchange delivery, and current cache-service receipt. Snapshot counts
remain operator hints only. There must be no second lookup or caller-assembled origin.

### D2582 — opponent recovery is prose, not a product operation

The live session controller commits the learner move, awaits `/select-move`, then reduces any
failure to a raw `error?: string`. It has no opponent-failure state, retry transition or change-
opponent command. The RFC promises Retry/Change opponent without defining retry idempotence, request
identity, policy mutation, session-digest consequences or how the pending opponent turn resumes
without replaying the learner move.

Specify the route/wire/controller journey from committed learner ply through unavailable, cached,
retry, provider change and resumed opponent commit. `Change opponent` must name whether it mutates
the run, starts a new run or records a policy event. Browser fixtures must exercise all arms with
stable board geometry and task-language copy.

### D2583 — one-stage results cannot settle a multi-stage pipeline

`ProviderOperationResult<K,T>` distributes over a single `ProviderOperationStageRoute`. For voice
it therefore represents a text-stage result **or** an audio-stage result, not one ordered operation
containing both settlements. `ProviderOperationAvailability` likewise has one state for the whole
operation. Neither can represent external text success plus TTS failure plus browser/text fallback
while retaining both provider outcomes.

Define per-stage settlements plus a compiled derived operation outcome. Conditional stages need
explicit skipped reasons; required/fallback stage combinations determine final text/audio
availability without erasing successful earlier receipts.

## Required author repair

Rebase this RFC on the provider-exchange identities instead of redeclaring them; derive the complete
provider-call census from production routes; choose the real voice/speech graph; make the compiler
and parser executable; totalize timed recovery and tokenized backoff leases; return cache value and
origin atomically; define ordered multi-stage settlement; and specify the opponent recovery journey.
Another genuinely fresh review must follow. Neither the claim-free health checkpoint nor run-schema
lane 0.26 is authorized by this return.
