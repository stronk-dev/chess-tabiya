# Held promotion collectors — fifth fresh independent buildability review

- **Date:** 2026-09-02
- **Reviewer:** Codex, independent of the D2521–D2523 fourth author repair
- **Scope:** only the two held §3.7 promotion projections and their path into F1/F2
- **Verdict:** **returned** on [[D2548]]–[[D2551]]
- **Reproducer:** `make semantic-collectors-promotion-fifth-fresh-review` — 4/4 findings

## What survives

The fourth repair closes the three seams it names. Canonical full FEN and recorded lookup types now
exist; the live arm uses the actual scheduler and operation-keyed source factory; and forged or
spliced completed geometry cannot take the zero-call path. The retained third and fourth author
targets reproduce. None of this review reopens the twelve implemented Wave-C projections.

The remaining defects are all at the boundary from a valid source result to the registered event.

## Returns

### [[D2548]] — the outside-domain request-digest comparison has no constructor

`makePromotionRaceSyzygyRequest` returns only `TypedProviderRequest<"syzygy.position@1">`, while
the local-domain arm promises to recompute “its branded digest” and compare it to the scheduler's
envelope. The provider RFC exposes `digestProviderRequest(ProviderRequestDigestImage)`, but
`ProviderRequestDigestImage` is itself undefined and the promotion dependency exposes neither a
normalized identity nor a digest. The scheduler proves that its own result belongs to its call; it
does not give a later declared domain item a reproducible FEN join. Define the exact digest image
and one operation-keyed request/digest constructor, or retain a sealed request identity that the
domain derivation can compare.

### [[D2549]] — the output ABI is not the claimed exact value

`PromotionRaceTablebaseValue.immediatePromotion` uses `CanonicalUci`, a type defined nowhere in the
RFC or its mobility/provider authorities. The exact legal map exports `ExactLegalMove.uci: string`
plus a named convention, not that brand. The same interface changes `promotionFirst` from the
existing exact `PawnIdentity[]` to a color label without a derivation rule, contradicting the RFC's
“operands are retained, not summarized” invariant. Finally, the live provider result permits
`preciseDtz` to be absent while the output requires `number | null`, with no normalization rule.
Publish one exact output mapping and preserve the participant identities it claims to retain.

### [[D2550]] — the event payload cannot satisfy its own operand declaration

The tablebase value carries category, distances, promotions and the color label, but not `geometry`
or `source`; those exist only in a private derivation receipt. The shipped semantic compiler checks
required operand keys against the sealed evidence payload and additionally requires
`evidence.payload === operands`. A private receipt therefore cannot pay public operand fidelity.
Either put the exact geometry/source operands in the sealed event payload or narrow the declared
operands with an explicit, justified successor contract; the current two claims cannot compile
together.

### [[D2551]] — the collector has no semantic-event occurrence

The registered projection is an event eligible for `research.semantic_selection@1`, but its request
contains only geometry, provider scope and cancellation. The shipped event compiler requires a
canonical before-FEN, triggering UCI and after-FEN, and the RFC declares no tablebase semantic-event
adapter. A position-only evidence item can be a reading; an event needs a real occurrence supplied
by an authoritative run/node edge. Choose and specify that grain rather than manufacturing an edge
from the geometry FEN.

## Required bounded repair

1. Close the provider request/digest image used by the outside-domain same-FEN join.
2. Publish a complete output ABI over exact legal moves, pawn identities and optional live DTZ.
3. Make the sealed value and required event operands the same authority.
4. Supply a real occurrence/anchor path, or reclassify the projection as a position reading and
   update its declared consumer contract accordingly.

Then rerun the retained third/fourth author targets and this review, followed by another genuinely
fresh review. Provider/value-authority dependencies remain separate holds. No production, content,
pack, API, bot, module or learner UX implementation is authorized.
