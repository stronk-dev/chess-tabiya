# Bounded policy targets — sixth author repair

- **Date:** 2026-09-06
- **Repairs:** [[D3042]]–[[D3046]]
- **Gate:** `make bounded-target-sixth-author-repair`
- **Verdict:** bounded author repair complete; another genuinely fresh review is required

## Repair

1. Canonically printed exported declaration ASTs replace the names/fields/discriminants-only
   equality. Mutations to public field types, modifiers, generic bounds and service signatures all
   change the checked image.
2. Request admission validates exact keys and every genuine wrapper before any digest, then owns a
   frozen copy of the exchange-reference container. Caller array mutation cannot change queued
   work.
3. Request digests are byte buckets, not authority identity. A job is shared only when threat,
   source-position and the exchange reference set are exactly the same. Independently minted
   byte-equal wrappers run separately, so successful factory ancestry remains truthful.
4. `assertBoundedTargetBatchResult` is an exported protocol operation and the consumer crosses it
   before reading untrusted results.
5. Malformed input returns the exact digest-free `rejected/invalid_request` arm. It cannot throw
   while recursively hashing a cyclic value, claim an identity that could not be computed, or enter
   queue/dedup state. `seal_failed` is retained only for post-admission internal faults.

## Executed evidence

`make bounded-target-sixth-author-repair` passes the complete inherited chain, TypeScript
protocol consumer, five retained fresh counterexamples and five new repair groups.

The new controls prove:

- four public declaration mutations change the canonical image;
- a caller-mutated exchange array leaves the frozen owned image unchanged;
- same-reference requests share while rebuilt-equal authorities do not;
- the result assertion exists and is used; and
- cyclic untrusted input is rejected before any digest call.

No runtime, server, API, client, schema, persistence, content or protected-design byte changed.

## Next

A fresh reviewer should attack referenced private aliases in the public type closure, the
same-reference set comparison under duplicate exchanges, multi-job cleanup inside one digest
bucket, exact validation of the pre-identity result, and whether every real consumer crosses the
public result assertion.
