# Provider health/degradation — eighth fresh independent buildability review

**Date:** 2026-09-05

## Verdict

Return the RFC on [[D2857]]–[[D2859]]. The seventh repair composes the required public surfaces, but
three consumer-shaped attacks break operation snapshot coherence, closed settlement authority and
immutable cache provenance. No production implementation is authorized.

## Executable findings

1. **[[D2857]] Read-only admission invalidates its own snapshot.** `assertGenerationSet` calls
   `snapshot()` to derive expected members, replacing `#currentSnapshot` despite no revision or
   provider/cache/health change. Acquiring a lease with a set minted from a valid snapshot therefore
   makes `selectProfileAvailability` reject that same snapshot as stale. This contradicts criterion
   18's same-parsed-snapshot operation/F1 join and the current-authority premise of criterion 31.
2. **[[D2858]] Backoff settlement is not an unknown-input boundary.** `settle` accepts its typed
   parameter without an exact runtime parser. An unknown kind reaches the final branch and is
   treated as `transient_failure`; a `success` carrying `retryAfterMs` is also accepted. Both clear
   the live claim and the former changes shared admission, violating the closed lifecycle required
   by criteria 26 and 32.
3. **[[D2859]] Sealed delivery/cache bytes remain mutable.** `deepFreeze` returns immediately for an
   already-frozen container and never visits its children. A shallow-frozen payload can therefore
   retain a mutable nested object through `ExchangeAuthority.success`, `ExactCache.put` and
   `resolve`; mutation changes the returned atomic value while the original response digest and
   full cache identity remain unchanged. Criteria 27 and 33 require one immutable atomic value and
   provenance, not a stable envelope around mutable bytes.

## Evidence

`make provider-health-eighth-fresh-review` retains the full author/review chain and passes 3/3
able-to-fail attacks against the current seventh repair. The fixtures call exported consumer
surfaces; they do not infer failure from source text alone.

## Required repair boundary

Derive and compare a generation-group image without issuing a replacement registry snapshot; only a
real state transition may invalidate the operation snapshot. Parse the exact settlement union before
clearing a claim or changing backoff. Recursively copy/seal or fully traverse retained payloads even
when an outer container is already frozen, and make the response digest correspond to the canonical
retained payload authority. Preserve every seventh-repair surface and control. Another genuinely
fresh review is required after the bounded repair.
