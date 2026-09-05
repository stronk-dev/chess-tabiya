# Provider health/degradation — sixth author repair

**Date:** 2026-09-05

## Outcome

The bounded replacement checkpoint closes [[D2815]]–[[D2822]] and self-audit [[D2823]]–[[D2827]]
at contract tier. No production provider, route, client, store, schema, migration, content, archive
or protected-design byte changed.

- one reducer and snapshot represent not-configured, unverified, recovering, available,
  degraded-cache-only and unavailable;
- exact cache inventory is joined on every snapshot, invalidated on generation change and protected
  from late stale-generation insertion;
- the ten application declarations are deeply immutable, completely semantic-checked and compile
  executable dependency/condition grammar;
- group leases acquire, renew, settle, expire and release immediately on a sealed generation change;
- the settled cache is a real 512-entry LRU rather than insertion-order FIFO;
- durable failure resolves the current learner tail under `BEGIN IMMEDIATE`;
- retry carries failure sequence, request digest and idempotency identity; and
- change parses a closed opponent policy and derives both resulting digests from durable state.

## Executable evidence

`make provider-health-sixth-author-repair` retains every predecessor, reproduces the 8/8 sixth fresh
attacks and passes 13/13 repair groups plus strict TypeScript. It is the sole current provider-health
dependency of `verify-governance`.

## Boundary

This remains author contract evidence. Another genuinely fresh review and the provider-protocol/
exchange prerequisites still gate both the claim-free runtime checkpoint and lane-0.26 durable
checkpoint.
