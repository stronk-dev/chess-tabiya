# Provider health/degradation — eleventh author repair

**Date:** 2026-09-06
**Scope:** [[D2942]]–[[D2949]]
**Verdict:** repaired at requirements tier; another genuinely fresh independent review is required.

## What changed

- One private composition derives every provider/backoff-group join from
  `PROVIDER_INSTANCE_DECLARATIONS`. It constructs group state internally and exposes neither a
  predecessor registry nor coordinator registration/reset authority.
- A real generation change is the only group-reset path. Same-generation change fails before
  mutation, while a valid member change replaces the exact shared generation image.
- Lease settlement accepts only a sealed provider-exchange delivery or failure for the exact group
  member and request. That one outcome updates instance health and shared group backoff together;
  a caller-authored success enum cannot reopen siblings.
- The strict `ProviderOperationAvailability` parser/projector exposes plural `instanceIds`, exact
  block/unavailable reasons and the complete seven-arm union. Request-free cache inventory remains
  conditional; only an atomic exact-key hit emits `cached_exact_only` with its retained delivery and
  cache-service receipt.
- Snapshot construction takes process-monotonic and display-civil time separately. Release
  currentness, leases, expiry and retry use only monotonic time; civil time changes display bytes
  only.

## Executable evidence

`make provider-health-eleventh-author-repair` retains the complete predecessor chain, executes the
eleventh review's eight counterexamples, then passes 8/8 direct repair groups plus strict
TypeScript.

The model is disposable contract evidence under the exploration gate. It changes no production,
schema, run, storage, content, archive or protected-design byte.

## Next

Another genuinely fresh reviewer must attack the private composition, sealed settlement, exact
cache operation, wire grammar and dual-clock boundary. Provider protocol and provider exchange
still precede either production checkpoint.
