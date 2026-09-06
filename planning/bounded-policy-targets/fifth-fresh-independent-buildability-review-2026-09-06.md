# Bounded policy targets — fifth fresh independent buildability review

- **Date:** 2026-09-06
- **Artifact:** `rfc/bounded-policy-targets.md` after the D2628–D2630 fifth author repair
- **Verdict:** returned on [[D3042]]–[[D3046]]; implementation remains unauthorized
- **Executable review:** `make bounded-target-fifth-fresh-review` — retained fourth author repair,
  fifth author repair and 5/5 fresh counterexamples

## What survives

The local semantic split remains useful: exact target identity, immediate removal and bounded
return are separate facts, none is a move grade or learner-facing recommendation. The three-route
factory boundary, no-alias threat source, background execution classification, finite traversal
budgets and exists-versus-for-all distinction also survive.

The return is at the public request/result and authority-equivalence boundaries. The repaired
protocol has more names, but it still does not preserve the exact admitted objects and typed
results across asynchronous execution.

## Returns

### [[D3042]] — protocol equality ignores protocol types

The author AST comparison observes exported names, interface/class field names and selected union
discriminants. It does not compare property types, readonly/optional modifiers, generic bounds or
callable parameters/results. The fresh control changes `candidateUci` and `requestDigest` from
string to number and replaces the service submit signature; the author's structural image remains
identical. Compare canonical declaration/type images or generate every normative consumer from one
source, with mutation controls over the omitted dimensions.

### [[D3043]] — queued requests retain mutable caller containers

`readonly exchanges: readonly LegalExchangeEvidence[]` is compile-time syntax, not an owned
snapshot. The service validates and hashes a caller array before queueing, but no specified step
copies/freezes the exact admitted authorities. The caller can mutate that array while another job
runs, so execution observes bytes not covered by admission or request identity. Validate and
snapshot atomically, then use only the owned image for digest, dedup and execution.

### [[D3044]] — byte dedup and exact-reference ancestry are incompatible

Two independently genuine evidence wrappers with identical producer/projection/payload bytes hash
to one request key. The second waiter attaches to the first job, whose factory receipt necessarily
retains the first wrapper references. That result cannot satisfy the RFC's separate promise that
equal rebuilt inputs fail exact ancestry. Either dedup over one canonical authority receipt or
produce waiter-specific results whose ancestry binds each admitted request; do not silently choose
byte equality in one section and reference equality in another.

### [[D3045]] — the public result validator is not public or declared

The RFC says a public validator recomputes `resultDigest`, but the supposedly complete protocol
exports only the result type and service. No assertion/parser is declared or exercised by the
consumer fixture. Add one exact exported validation operation at the intended runtime boundary and
make consumers cross it, or stop claiming untrusted/mutated results are rejected there.

### [[D3046]] — malformed input can throw before `seal_failed`

The stable seal-failure identity is computed from caller-visible bytes before the evidence seal is
asserted. The shipped recursive `evidenceDigest` throws on a cyclic payload, so `submit()` cannot
return its promised non-throwing `failed/seal_failed` arm. Assert/parse admitted wrappers before
digesting, or define a closed pre-identity invalid-request arm that does not claim an unavailable
digest. The repair must include cyclic and unsupported-value negatives, not only JSON-shaped author
fixtures.

## Required bounded repair

1. Seal the complete protocol type image, including callable signatures and modifiers.
2. Atomically own the admitted request before asynchronous queueing.
3. Reconcile dedup equivalence with exact factory ancestry.
4. Declare and exercise the result parser/assertion.
5. Make every malformed-input path settle as its exact typed arm without a pre-result throw.
6. Retain all earlier semantic, traversal, source and route controls before another genuinely fresh
   review.

No runtime, server, provider, schema, storage, API, content, web or protected-design byte changed.
