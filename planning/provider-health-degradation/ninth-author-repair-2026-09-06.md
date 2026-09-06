# Provider health/degradation — ninth author repair

**Date:** 2026-09-06

## Outcome

The composed checkpoint closes [[D2869]]–[[D2873]] at contract tier without changing production
provider, API, client, storage, schema, migration, content, archive or protected-design bytes.

- registry snapshots are current by owning registry, state revision and current time-derived state,
  so equal concurrent reads coexist while real transitions still revoke old authority;
- cache keys are opaque capabilities issued from the exact compiled application/stage, sealed
  exchange request and owning registry;
- group leases retain the sorted group-only instance/implementation/generation image and ignore
  unrelated cache or provider traffic;
- every application settlement arm is exact-key parsed, and local-domain completion requires a
  same-request provider-exchange-issued result; and
- behavior-affecting implementation/configuration changes refuse reuse of the prior generation.

## Executable evidence

`make provider-health-ninth-author-repair` retains every predecessor and all 5/5 ninth-review
falsifiers. It passes five direct inversions plus one composition group proving that the current
checkpoint still carries health reduction, bounded exact-cache service, availability selection and
release-receipt authority together. Strict TypeScript also passes.

## Boundary

This is author-contract evidence, not acceptance or production implementation. Another genuinely
fresh independent review and the provider-protocol/provider-exchange prerequisites still gate both
the claim-free runtime checkpoint and lane-0.26 durable checkpoint.
