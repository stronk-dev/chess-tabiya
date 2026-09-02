# Held promotion collectors — fourth fresh independent buildability review

- **Date:** 2026-09-02
- **Reviewer:** Codex, independent of the D2469–D2472 third author repair
- **Scope:** only the two held §3.7 promotion projections and their exact invocation boundary
- **Verdict:** **returned** on [[D2521]], [[D2522]] and [[D2523]]
- **Reproducer:** `make semantic-collectors-promotion-fourth-fresh-review`

## What survived

The four repairs under review survive their original attacks. No-witness is a completed/no-output
state; typed upstream absence is distinct from invalid evidence; callers cannot choose recorded or
live; and the legal-map resolver is not called for no-witness, provider failure or outside-domain
results. The geometry source graph still names contacts, and the tablebase graph still preserves
recorded/live/domain alternatives. None of these findings reopens the twelve implemented Wave-C
projections.

## Returns

### D2521 — the closed request ABI contains undefined types

`CanonicalFullFen` and `RecordedTablebaseEvidenceLookup` occur only as uses inside
`semantic-collectors.md`. Neither the RFC nor its provider, value-authority or recorded-path
dependencies defines either type. The disposable author model replaces the former with a local
branded string and omits the latter, so its strict TypeScript pass never compiles the published
boundary. The repair must bind the existing canonical-FEN authority (or declare it fully) and
publish the exact lookup success/absence/failure contract.

### D2522 — the Syzygy dependency is not a real provider operation

The RFC injects `syzygyPosition(request, scope, signal)`. The provider RFC exposes
`ProviderExchangeScheduler.get({operation,request}, scope, signal)` and a separate
`providerTraversalSyzygyPosition(application, capability, request)` operator door. Neither has the
collector's signature. The collector also does not define the literal `rules`, `variant` or
`timeoutMs` bytes required by `SyzygyPositionRequest`, yet later claims it can recompute and compare
the normalized request digest. There is no deterministic digest preimage. The next repair must bind
the real scheduler → operation-keyed factory route, or declare one owned adapter over it, and fix
the exact request constructor and timeout authority.

### D2523 — completed geometry absence has no authority

`PromotionRaceGeometryResult` is a plain structural union. There is no aggregate result seal,
derivation receipt or `assertPromotionRaceGeometryResult`. The tablebase collector returns a
completed `no_opposing_passed_clear_paths` arm before all source calls. A caller can therefore
construct that arm with a cast contacts object and suppress recorded, legal-map and Syzygy work;
the evidence arm can likewise splice an unrelated contacts input and geometry item. This directly
contradicts the prose promise that forged completed geometry throws. The able-to-fail TypeScript
model compiles both forgeries. Seal and assert the exact geometry derivation before the fast path,
including reference/FEN identity and negative forged/spliced fixtures.

## Required author repair

Define or import every request type; bind the actual provider call and exact request bytes; and make
both completed geometry arms carry one assertion-backed derivation authority before either can
reach the tablebase collector. Update the executable author contract and send only the held pair
through a fifth fresh review. No production, content, pack, API, bot, module or learner UX
implementation is authorized by this review.
