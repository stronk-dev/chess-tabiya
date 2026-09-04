# Held promotion collectors — fifth author repair

- **Date:** 2026-09-04
- **Scope:** RFC-only repair of [[D2548]]–[[D2551]] and stale positive gate [[D2558]]
- **Verdict:** author-repaired; the two projections remain held for a sixth genuinely fresh review
- **Reproducer:** `make semantic-collectors-promotion-fifth-author-repair`

## What changed

The shared provider contract now defines the closed `ProviderRequestDigestImage<K>` and exposes one
scheduler-owned `normalizedRequestDigest(request)` operation backed by the same descriptor/provider
normalization as `get`. The promotion collector compares every result to that digest and retains a
sealed request/result invocation receipt, so an outside-domain fact cannot be crossed from another
FEN and no pawn-private hash authority exists.

The successful value now retains the canonical FEN, exact geometry, selected whole source, exact
`ExactLegalMove` promotion objects and exact tied `PawnIdentity` participants. Optional live
`preciseDtz` maps through `?? null`, preserving zero. The public sealed value and its derivation
receipt carry the same geometry/source references; dropped underpromotions, colour summaries,
rebuilt arrays and crossed payloads are explicit negatives.

The tablebase result is a derived **reading**, not an event. Its source operation describes a
position and supplies no authoritative before-FEN / triggering move / after-FEN occurrence. It is
therefore inspector-only, absent from semantic-event selection, and cannot gain a fabricated edge.
A future race transition would require two exact readings plus a real run edge under a new id.

## Verification and remaining hold

The new four-arm executable author contract and strict TypeScript negatives pass. All four earlier
positive author generations pass in the same run after [[D2558]] refreshed their wording-sensitive
assertions to the live invariant. Historical independent review dossiers remain unchanged.

No runtime, server, API, content, pack, module, bot or learner UX byte is implemented here. A sixth
genuinely fresh review must independently reconstruct the request join, exact output mapping,
reading grain and F1/provider dependency before projections 13–14 can be accepted for production.
