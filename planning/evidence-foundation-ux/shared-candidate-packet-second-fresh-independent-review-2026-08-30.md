# Shared candidate packet — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/shared-candidate-evidence-packet.md` after the D2097–D2104 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make candidate-packet-second-fresh-review` — 4/4 blocker arms
- **Production status:** untouched; no packet compiler/cache or consumer migration is authorized

The repair closes the eight seams named by the previous review at the prose level. Following its
new factory and registry through the exact current runtime symbols exposes four further seams. Two
make the published TypeScript unimplementable as written; two let a packet claim authority it did
not obtain.

## B1 — factory manifest and collector manifest are different authorities ([[D2198]])

The public factory accepts any structurally valid `CompiledEvidenceManifest` and puts its digest in
the packet key. Every collector named by the registry currently calls
`compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, ...)` internally. `CompiledEvidenceManifest`
has no runtime seal and `compileEvidenceManifest` is public, so the caller-selected manifest need
not be the manifest that produced or validates retained values.

That permits a packet id to claim manifest A while every event was minted under manifest B. It also
contradicts the stated fixed-authority product factory.

**Required repair:** either remove `manifest` from the product factory and import the one exact
runtime manifest, or introduce a sealed manifest authority accepted by every collector and bind all
retained values to that exact authority. Cross a different valid manifest and a forged digest.

## B2 — available-empty has no projection identity ([[D2199]])

`CandidateCollectorResult<P,T>` carries `projection:P` on `unavailable` (inside its abstention) and
`failed`, but not on `available`. A multi-output collector can return an empty available result, yet
the executor cannot know which of its declared outputs was evaluated. It can attach any projection
afterward when constructing `SealedCandidateCollectorOutcome`.

This makes the promised available-empty versus unavailable distinction unverifiable per projection
and allows a missing collector computation to masquerade as an honest no-match.

**Required repair:** put literal `projection:P` in every result arm, bind every non-empty value's
own projection to it, and require exactly one closed outcome for every declared output/candidate
pair. Cross wrong-projection values and empty results copied between outputs.

## B3 — the callable registry does not satisfy its own interface ([[D2200]])

`CandidateCollectorDeclaration` requires a `collect(context)` member returning closed collector
results. All thirteen literal rows instead supply `operation`, and the named current functions take
positional `beforeFen, moveUci, afterFen` arguments and return flat arrays or `undefined`. Under the
RFC's own `satisfies readonly CandidateCollectorDeclaration[]`, every row has a missing `collect`
and an excess `operation`.

**Required repair:** publish exact typed adapter functions that translate one immutable context to
the closed per-projection result algebra, or change the declaration and executor contract to the
actual callable form. Compile the literal registry itself, including dependency memo access and
all thirteen current call signatures, as an acceptance fixture.

## B4 — three public protocol types are undefined ([[D2201]])

The normative interfaces reference `CandidateCollectorMemo`,
`CandidatePopulationServiceStats`, and `CandidatePopulationReceiptReferences`; none has a
declaration anywhere in the RFC or tree. These are not incidental internals: they decide what a
dependent collector may read, what the public service reports, and what exact references the
receipt seal verifies.

**Required repair:** define all three closed shapes, including typed dependency lookup, bounded
service counters and the exact receipt-reference image. Add compile-time negatives for undeclared
memo reads and runtime negatives for omitted receipt references.

## Re-review order

1. Fix the manifest authority and bind collectors to it.
2. Make every collector result projection-addressed.
3. Publish and compile the actual thirteen-row adapter registry.
4. Close the memo/stats/receipt-reference types.
5. Invert these four arms, preserve all prior contracts, run full verification, then request
   another fresh independent review.

The complete-population thesis, provider-free boundary, standard-only identity, bounded admission,
single-flight and exact-reference retention survive this return.
