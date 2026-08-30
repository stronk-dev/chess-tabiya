# Bounded-policy targets — fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/bounded-policy-targets.md` after the D1993–D1999 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make bounded-target-fresh-review` — 7/7 blocker arms
- **Prior contracts:** `make bounded-target-contract bounded-target-repeat-review
  bounded-target-final-review` are current and green (18 + 5 + 13); the repeat target was repaired
  in this review after it was found asserting the pre-repair defects
- **Production status:** untouched; no bounded-target service, producer, projection, scheduler or
  product consumer is authorized

The repaired document materially improves cancellation, request identity, manifest latency and
post-candidate semantics. The fresh pass followed the proposed service from sealed source evidence
through runtime construction, bounded execution and its result algebra. Seven seams remain. Two
make the literal TypeScript image impossible to compile, one makes the promised cross-position
refusal impossible, and two leave supposedly bounded background work without a whole-job resource
or lifecycle boundary.

## B1 — threat evidence cannot be joined to its claimed source position ([[D2105]])

`ThreatResult` contains only `kind`, `conventionId` and `threats`; its named adapter seals exactly
those fields. The RFC computes a pass anchor from the separate legal-move item's FEN and compares it
to an exchange, but nothing proves the sealed threat item was produced from that FEN. A threat item
from another position with an equal-shaped threat can be substituted while every stated join passes.

**Required repair:** make the source FEN/pass anchor part of the one threat authority (with a
versioned migration if that changes the existing projection), or add a sealed derivation that binds
the exact threat item to the exact source authority. Cross a same-shaped threat from a different
position. Recomputing `threats()` privately inside this collector remains refused.

## B2 — the registered service has no runtime value or public construction boundary ([[D2106]])

The normative image declares a non-exported TypeScript `interface BoundedTargetBackgroundService`
and later registers `BoundedTargetBackgroundService.prototype.submit`. Interfaces are erased and
have no prototype. The barrel cannot export the promised runtime service and the producer-operation
registry cannot receive the cited callable.

**Required repair:** publish one exact exported class or factory-owned concrete operation with a
runtime callable, constructor/factory signature and barrel export. Bind the producer registry to
that value and cross a type-only substitute.

## B3 — one normative payload operand has no TypeScript declaration ([[D2107]])

`NamedMaterialTarget` uses `TrackedPieceIdentity` twice, but the RFC never declares that type. Prose
says it contains colour/current role/square and separately discusses observed promotion edges;
there is no exact shape that an implementer or the literal compile criterion can consume.

**Required repair:** declare/export the exact source identity and any internal tracked-state shape,
including whether promotion edges are payload or traversal-only state. Cross extra initial
promotion provenance and each legal role transition.

## B4 — a per-candidate cap does not bound one admitted batch ([[D2108]])

The 512-pair admission limit and 25,000-position limit are independent, and §4.3 explicitly makes
the latter per candidate. One admitted job may therefore inspect up to 12,800,000 positions while
the sole active slot blocks all eight queued jobs. The measured corpus envelope does not bound an
adversarial or newly authored legal position, and there is no whole-batch budget or deadline.

**Required repair:** add a reproducible whole-job cost boundary (global visited budget and/or hard
deadline) with a closed result, fair queue behavior and no partial publication. Cross a legal batch
where many candidate traversals each remain below the local cap but their aggregate exceeds the
job bound.

## B5 — the return algebra admits a contradictory `reintroduced` arm ([[D2109]])

`reintroduced` is the exists-exists result after excluding `survives_every_defence`, yet its
`firstRefutation` is nullable. If a witness preparation/reply exists and no preparation survives
every legal defence, at least one refuting reply exists for the witness preparation. Null is valid
only for the zero-preparation/terminal negative arm, not this positive arm.

**Required repair:** require a canonical refutation tuple on `reintroduced`, or redefine the
quantifiers with an able-to-fail terminal convention that actually permits null. Cross witness-only,
universal, refuted and terminal positions.

## B6 — product construction can replace the scheduler and has no shutdown ([[D2110]])

The document says construction accepts public `Partial<BoundedTargetServiceOptions>`, including
`yieldControl`. A product caller can therefore install a microtask/no-op scheduler and defeat the
background/cancellation guarantee while retaining the same registered producer identity. The
service also defines no close/drain/abort operation for route teardown, process shutdown or tests.

**Required repair:** expose product-fixed construction using the registered scheduler and literal
limits; isolate fault injection behind a non-product test seam. Add idempotent shutdown semantics
covering queued jobs, active work, waiters/listeners and post-close submissions.

## B7 — batch-level `visitedPositions` has no reproducible meaning ([[D2111]])

Every result arm carries one batch `visitedPositions`, while §4.3 defines counts only “per candidate
traversal.” The RFC never says whether the batch field is a sum, maximum, last traversal, or count
at waiter cancellation. Two conforming implementations can therefore produce different result
digests for the same completed work.

**Required repair:** define batch aggregation and cancellation snapshots in the same convention as
the new whole-job bound. Cross zero-target, immediate-only, multiple traversals, local exhaustion,
global exhaustion and waiter-local cancellation.

## Verification-gate repair shipped with this review ([[D2112]])

`make bounded-target-repeat-review` still asserted all five D1962–D1966 defects existed, so the
normal named target failed precisely because the author had repaired them. The harness now checks
the repaired clauses instead. This changes no RFC verdict and does not weaken a negative: the
original findings remain immutable in their planning dossier, while the executable target now
tests the current expected state.

## Re-review order

1. Bind threat evidence to its exact source and publish every literal payload type.
2. Publish a real exported service/factory and producer-operation callable.
3. Close whole-job budget, batch counting, cancellation snapshots and shutdown together.
4. Make the return quantifiers and refutation tuples total.
5. Invert all seven fresh arms, preserve the 18 + 5 + 13 prior checks, run the exhaustive census
   and full repository verification, then request another fresh independent review.

No runtime collector, evidence declaration, consumer, schema, content or learner surface work is
authorized by this return.
