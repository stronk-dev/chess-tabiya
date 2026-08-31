# Provider health/degradation author repair — 2026-08-31

## Verdict

Author repair complete for [[D1910]]–[[D1915]] plus self-audit rows [[D2362]] and [[D2364]]. This is not acceptance
or implementation. Second fresh independent buildability review is required, and the execution
declaration remains dependency-blocked on provider-protocol register/exchange landing.

## Repaired authority

- Six display families, seven concrete provider instances and nine exact operations replace one
  scalar `stockfish` health key. Play and analysis have independent generations and consumers.
- State is a discriminated snapshot union. Absent configuration invents nothing; clean external
  providers expose `requestable_unverified` and are verified only by the learner's first real request.
- One compiler-owned execution DAG binds provider instances to F1/provider operations. Voice and
  conditional TTS share one consumer deadline and declared fallbacks.
- `ProviderOperationResult<T>` separates success, deterministic fallback, unavailable and
  cancellation. Cached acquisition embeds its original live/local receipt; illegal combinations
  are unrepresentable and rejected at runtime.
- Run-schema lane 0.26 persists acquisition on every new opponent selection while old events remain
  readable as `legacy_unrecorded` without fabricated provenance.
- Registry snapshots join current generation-valid cache inventory, so expiry/eviction/invalidation
  of the last row removes cache-only availability without a provider call.
- Instance declarations carry closed allowed-implementation sets; configured generation chooses one.
  `local_fixture` is test-only and `local_service` is the production-local label.
- A claim-free runtime-authority checkpoint may land while this RFC remains implementing; bot
  policy then consumes those exact symbols at run lane 0.18, while acquisition persistence remains
  this RFC's later lane 0.26. This removes the dependency cycle without copied health state.

## Verification

`make provider-health-author-repair` passes eight executable contract arms plus the proposed total
TypeScript algebra. No production, schema, runtime, API, client, content, archive or protected-design
byte changed. The lane is a declaration only.
