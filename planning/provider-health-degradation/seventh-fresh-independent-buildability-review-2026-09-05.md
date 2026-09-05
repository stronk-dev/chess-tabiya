# Provider health/degradation — seventh fresh independent buildability review

**Date:** 2026-09-05

## Verdict

Return the RFC on [[D2846]]–[[D2851]]. The sixth repair passes all thirteen controls it names, but
it is not the single replacement checkpoint the RFC requires. It repairs the newest local seams by
dropping previously executable parts of the provider-health contract. No production implementation
is authorized.

## Executable findings

1. **[[D2846]] Configured provider identity is neither closed nor retained.**
   `ProviderHealthAuthority` accepts an unknown runtime instance without error; `snapshot()` then
   iterates the separate closed tuple and silently drops that row. Valid configured rows retain only
   instance/generation, omitting the required family, implementation and allowed-implementation
   join (`contract.ts:113-122,145-157`; RFC criteria 1 and 22).
2. **[[D2847]] Sealed does not mean current or owned.** `generationSet` accepts every globally sealed
   snapshot. A stale snapshot from the same registry or a current snapshot from another registry
   changes the digest and clears the coordinator's live claim (`contract.ts:193-214`; criterion 26).
   No registry revision, issuer or compiled backoff-group identity participates.
3. **[[D2848]] The backoff coordinator cannot back off.** It owns only a lease. `settle` accepts no
   result or Retry-After and there is no blocked-until/backoff state, so a Lichess 429 is followed by
   immediate admission (`contract.ts:203-214`; §6 and criteria 6/26).
4. **[[D2849]] Cache provenance regressed.** The cache key contains only exchange operation,
   instance, generation and request digest; it lacks application operation, stage and explicit
   cache-key identity. A hit returns only the original delivery, not the atomic value/original/
   current-service receipt required by §7 and criteria 20/27 (`contract.ts:163-190,298`).
5. **[[D2850]] Pipeline semantics remain vacuous.** The parser knows `dependsOn` and
   `audio_requested`, but the exact semantic image contains ten singleton, unconditional,
   dependency-free stages. Any truthful multi-stage candidate fails exact-semantic comparison, so
   no admitted operation can exercise the ordered mixed-stage behavior promised by §4 and criteria
   8/19/29 (`contract.ts:13-70`).
6. **[[D2851]] The replacement checkpoint drops its predecessor's public boundary.** The current
   model exports no closed `ApplicationProviderOutcome`, profile-availability selector,
   `ProviderReleaseReceipt` or settlement operation, although the fifth repair introduced those as
   the exact claim-free checkpoint and the sixth repair says it replaces rather than supplements it
   (`contract.ts`; fifth-repair RFC section and criteria 19/23/24).

## Evidence

`make provider-health-seventh-fresh-review` retains the full author/review chain and passes 6/6
able-to-fail attacks. The attacks execute the current sixth model rather than restating the RFC.

## Required repair boundary

Compose, do not append another partial model. One current exported authority must retain the fifth
repair's sealed outcomes/selectors/release/cache provenance and the sixth repair's total state,
immutable declarations, renewable leases and durable current-run recovery. Its coordinator must be
registry-current and group-scoped and must execute actual backoff settlement. At least one exact
pipeline must make dependency/condition/mixed-settlement behavior non-vacuous. Another genuinely
fresh review is required afterward.
