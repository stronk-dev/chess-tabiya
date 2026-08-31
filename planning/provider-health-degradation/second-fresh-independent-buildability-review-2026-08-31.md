# Provider health and honest degradation — second fresh independent buildability review

**Reviewed:** 2026-08-31
**Reviewer:** codex, fresh application after the author repair
**Verdict:** **RETURNED on D2412–D2417.** The original repairs survive, but operation, cache,
receipt and recovery identities still cannot implement the RFC's promises.
**Reproduction:** `make provider-health-second-fresh-review` — 6/6 blocker controls pass.

## What survived

The repair correctly separates provider family, concrete instance and operation identity; makes
absent configuration distinct from clean-start unverified state; introduces a closed high-level
result algebra; claims the durable run lane honestly; joins cache inventory into snapshot reads;
and splits the claim-free runtime checkpoint from later acquisition persistence. The stronger
deployment goal and learner behavior remain right.

The eight-arm author target does not yet establish buildability. Seven arms match prose fragments;
the type image covers only three of the nine operations and is not the normative RFC type. Crossing
the repaired sections against each other produces six new blockers.

## Blocking findings

### D2412 — provider-result identities are not correlated

`ProviderReceiptBase` contains independent `ProviderOperationId` and `ProviderInstanceId` fields,
and `ProviderOperationResult<T>` is not keyed by operation. A cached acquisition embeds an
arbitrary `ProviderOriginReceipt` with no same-operation, same-instance, same-generation or
same-request constraint. The normative type therefore accepts a Stockfish-analysis operation
claiming the play instance, or a cached voice result whose original came from another operation.

The author's TypeScript image avoids that for only three hand-written pairs: Stockfish play,
Stockfish analysis and voice. It omits Maia, tablebase, Explorer, voice-compare, voice-story and
TTS, so the “total algebra” check is not total.

Generate `ProviderOperationResult<K>` and its instance/origin types from the compiled operation
map. The unknown-input parser must verify exact operation↔instance, cached-original operation,
instance and generation equality, plus exact request/cache identity.

### D2413 — clean-start and recovering are one incompatible state

The transition list says a successful live request moves a provider to `available`. The circuit
section later says that, after two opens in five minutes, the first successful real request remains
`unverified` until a second success. The `unverified` arm has no checked/success/failure times,
prior reason, retry posture or recovery count.

That erases a real successful outcome and leaves no state operand from which the next success can
be recognized as the second. Add an explicit recovering arm or closed internal reducer state and
execute clean start, first success, repeat-open, first recovery success, second success,
intervening failure, generation change and restart.

### D2414 — cache inventory has the wrong grain

`ProviderCacheInventory` keys rows only by instance and generation and publishes one count.
Availability is operation- and exact-request-specific. `external-voice` alone serves three
operations, so one cached voice response can make voice-compare and voice-story appear
`cached_exact_only`. Even within one operation, a nonzero count says nothing about the next key.

Partition inventory by exact operation and key identity. A global capability may say cached service
is conditional, but the operation must resolve the key and return the request-bound receipt.

### D2415 — production-local provenance cannot be recorded

The instance declaration admits `local_service` and criterion 22 requires that label to remain
honest. `ProviderOriginReceipt` has only `source:"live"` and `source:"local_fixture"`; its base
contains no configured implementation. A production local service must masquerade as generic live
service or lose the implementation identity that generation/cache invalidation depend on.

Retain the configured implementation in every origin and cached-original receipt. Switching
remote→local must change generation and invalidate remote cache while preserving historical
provenance.

### D2416 — the operation closure is not set-equal

The closed union declares nine operation IDs. Section 8 describes two Stockfish operations, Maia,
tablebase, Explorer and three voice consumer operations: eight. `render.tts` is the ninth member
and has no described declaration despite promised missing-operation refusal.

If TTS is only a conditional stage, remove the standalone operation ID. If independently
requestable, give it a consumer, execution declaration, result and fallback. Derive set equality
from literal declarations rather than a hand count.

### D2417 — shared-upstream backoff has no identity

The RFC promises one-at-a-time and 429 coordination per upstream, but circuits and declarations are
keyed only by provider instance/generation. No upstream/rate-limit-group key exists. Two instances
using the same upstream can therefore form the retry herd the contract says is impossible.

Add a closed internal upstream/backoff-group identity. Health remains per instance; only
concurrency/backoff is shared. Cross-instance 429 fixtures must prove the shared delay without
merging health states.

## Required author repair

Make the compiler-owned operation declaration the source of correlated types/parsers, add a real
recovery state, give cache inventory operation/request grain, retain configured origin, reconcile
the ninth operation, and declare shared upstream groups. The next target must execute the complete
nine-operation set and invert all six controls. Another fresh independent review gates both the
claim-free checkpoint and lane 0.26.
