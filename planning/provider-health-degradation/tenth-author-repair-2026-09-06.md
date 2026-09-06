# Provider health/degradation — tenth author repair

**Date:** 2026-09-06

## Outcome

The composed checkpoint closes [[D2912]]–[[D2915]] and the adjacent author self-audit findings
[[D2917]]–[[D2919]] at contract tier without changing production provider, API, client, storage,
schema, migration, content, archive or protected-design bytes.

- request-free instance cache inventory is `conditional_exact_cache`; only an atomic exact-key hit
  is exact cached service;
- release authority revalidates its source snapshot against current injected monotonic time;
- one group projection drives both provider admission and operation availability;
- release issuance and validation share one byte-sorted generation image;
- `recovering` remains distinct from verified availability;
- every configured non-null backoff group must contribute exactly one coordinator projection; and
- the snapshot-facing projection retains the coordinator's 5/15/60-second transient sequence.

## Executable evidence

`make provider-health-tenth-author-repair` retains every predecessor and all 4/4 tenth-review
falsifiers. It passes eight direct/composition groups covering conditional cache identity, current
time, shared group authority, recovery, canonical release identity, coordinator closure, repeated
backoff and whole-checkpoint composition. Strict TypeScript also passes.

## Boundary

This is author-contract evidence, not acceptance or production implementation. Another genuinely
fresh independent review and the provider-protocol/provider-exchange prerequisites still gate both
the claim-free runtime checkpoint and lane-0.26 durable checkpoint.
