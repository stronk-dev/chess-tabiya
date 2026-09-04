# Provider health/degradation — fourth author repair

**Date:** 2026-09-04

**Scope:** bounded RFC/contract repair for [[D2575]]–[[D2583]]. No production runtime, provider,
API, storage, run-schema, client, content, deployment, archive or protected-design byte changes.

## Result

The returned provider-health contract is repaired around one ownership boundary:

- `provider-exchange-and-execution` owns low-level provider operation, request, acquisition,
  parsed-payload and retained-delivery identity;
- provider health owns concrete instance state and an application pipeline whose every stage maps
  to exactly one sealed exchange operation; and
- F1 remains the producer/consumer authority rather than becoming a health registry.

The complete production-call census is ten application operations over eight exchange operations.
It now includes reasoning review and treats speech as an independent TTS request over a sealed
previously displayed text identity, including Compare. Speech cannot call voice a second time.

The remaining failure paths are total: recovery retains monotonic open history and half-open
identity; shared upstream work uses expiring tokenized leases; exact cache resolution atomically
returns payload plus its original sealed delivery and current cache receipt; opponent failure and
retry/change are durable events after the already-committed learner ply; and an application outcome
retains every ordered stage settlement even when a later failure falls back.

## Executable evidence

`make provider-health-fourth-author-repair` runs:

- the original 8/8 provider-health author controls;
- the third repair's 9/9 route/result/recovery/cache/backoff controls;
- 6/6 new behavioral groups for [[D2575]]–[[D2583]]; and
- strict TypeScript over the repaired application/exchange boundary.

The new controls fail on a count-preserving side-door operation, a crossed exchange/instance,
distant recovery opens, stale lease settlement, split cache identity, crossed retry identity,
replayed learner-ply semantics, reordered stage settlement and a plain/spread speech-text reference.

## Remaining boundary

This is author repair, not acceptance or implementation. A genuinely fresh independent review must
rerun the joins against the provider-exchange RFC and live route/controller symbols. The provider-
protocol register and provider-exchange lane still gate both implementation checkpoints. Run-schema
lane 0.26 now honestly includes the two durable opponent-recovery events as well as the sealed
exchange delivery on new opponent selections.
