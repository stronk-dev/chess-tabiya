# Provider health/degradation — sixth fresh independent buildability review

**Date:** 2026-09-05

## Verdict

**Return to author.** The fifth repair added named exports, but the new “exact checkpoint” is a
second, weaker authority rather than an executable refinement of the RFC and retained fourth model.
Eight independent attacks reproduce [[D2815]]–[[D2822]]. No production provider, route, client,
storage, schema, migration, content or protected-design byte changed.

## Findings

1. `ProviderRegistrySnapshot` has only unverified/available/unavailable. Two transient failures
   followed by one success report available, not the required recovering 1/2 ([[D2815]]).
2. `APPLICATION_CONSUMER_DECLARATIONS` freezes only its array. Mutating a row's consumer, empty
   stage id and unknown fallback still produces a branded compiled operation ([[D2816]]).
3. The compiler constructs exactly one stage per operation and has no dependency or condition
   operands, so the promised forward/cyclic/conditional/ordered pipeline failures cannot be
   expressed ([[D2817]]).
4. `BackoffCoordinator` exposes acquire and settle but no renew operation; criterion 26's long-work
   lease lifecycle cannot execute ([[D2818]]).
5. A failed provider with a valid exact cache reports unavailable, and a generation change does not
   invalidate that cache. The checkpoint cannot derive degraded-cache-only ([[D2819]]).
6. Durable failure accepts an old learner ply after a newer one exists and overwrites the run's
   recovery state ([[D2820]]).
7. Retry takes only run and idempotency key. Reusing an old key after a new failure is accepted
   because failure sequence and request digest never cross the command boundary ([[D2821]]).
8. Change accepts caller-written policy and request digests, contradicting the server-derived
   `RunOpponentPolicy` contract ([[D2822]]).

## Executable evidence

`make provider-health-sixth-fresh-review` passes 8/8 attacks against the fifth author model. The
target is an ordinary `verify-governance` dependency so neither local nor GitHub verification can
forget the return.

## Repair boundary

One bounded repair must publish one current state/cache/compiler/backoff/recovery authority. It must
retain the prior attacks, derive health from exact current cache inventory, either implement the
promised pipeline algebra or remove claims that no 1.0 operation needs, and make recovery consume
the exact current run and parsed wire command. Another genuinely fresh review still gates both
implementation checkpoints.
