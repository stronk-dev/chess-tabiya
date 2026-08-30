# Semantic collectors promotion pair — fresh independent buildability review

**Date:** 2026-08-30

**Scope:** only the held `semantic-collectors.md` §3.7 promotion amendment; the twelve already
implemented Wave-C projections were not reopened.

**Inputs:** `rfc/semantic-collectors.md`,
`planning/evidence-foundation-ux/promotion-race-rfc-amendment-2026-08-29.md`,
`design/research/promotion-race-contract-closure.md`, the D1699/D1700 disposable harness, the
runtime evidence seal/adapters and the draft provider-exchange Syzygy contract.

**Verdict:** **returned on [[D2141]], [[D2142]] and [[D2143]].** The research correctly falsifies raw-FEN participant
selection and piece-count-only Syzygy joins. The repaired prose chooses the right authority
families, but it does not yet define an executable authority-preserving boundary. `[V]`

## What survives

- The a2/b7 position is a real current false positive: raw geometry admits it while the shipped
  pawn reading marks both pawns not passed. `[V]`
- The a2/h7 9/10 descriptive arrival fixture survives the proposed passed-pawn filter. `[V]`
- Current tablebase joining by piece count can accept a result from another position; byte-equal
  canonical full FEN is the necessary subject join. `[V]`
- Geometry must remain descriptive and outcome-free. Syzygy is the exact outcome authority in its
  domain, and provider absence is not a chess result. `[V]`
- Geometry can be phased before the live provider arm in principle. The current repair is returned
  because its input authority is forgeable, not because geometry inherently needs Syzygy. `[V]`

## D2141 — the sealed input does not establish pawn truth

`DeclaredEvidence` has a real runtime seal backed by a `WeakSet`, but the named adapter determines
what that seal means. `declarePawnContactsEvidence` delegates to generic `exactObject`, which
checks only that the five required property names exist and that those names match the manifest.
It does not compare the payload with `pawnContactsReading(payload.fen)`. A caller can therefore
seal a payload whose a2/b7 rows say `passed: true`; the repaired geometry would treat the forged
rows as its complete authority. `[V]`

The disposable `repairedGeometry` helper is weaker again: it checks only `projection.id`, not the
producer/version or runtime seal. C16 promises a production declared-item forge, but an unsealed
forge alone does not catch a **sealed false source payload**. `[V]`

Repair requires one exact adapter that recomputes and canonical-compares the whole
`PawnContactsReading`, plus exact producer/projection/version and seal assertions at the geometry
constructor. Permanent negatives must include both an unsealed lookalike and a sealed payload with
one changed `passed`, blocker or pawn identity. `[M]`

## D2142 — the outcome source cannot be implemented without choosing provenance semantics

The outcome declares an operand named `source` and says recorded/live source identity and
occurrence survive. The two inputs do not share a payload shape: recorded tablebase evidence is a
`RecordedReading` with `sourceId`, `retrievedAt` and nested `values`; the provider RFC's live arm is
a `ProviderEvidenceDelivery<LiveSyzygyPosition,...>` with delivery/cache state, a sealed
acquisition receipt and nested `position`. No `PromotionRaceTablebaseSource` (or equivalent
discriminated type) and no total normalization are declared. `[V]`

The implementation would have to choose whether `source` retains the sealed evidence item, copies
a label, or creates a new receipt; it would also choose which acquisition/occurrence fields survive.
Those choices change the law-8 provenance and the F1 occurrence guarantee, so they are RFC work,
not implementation detail. Publish the exact result types and mappings for both arms, then cross
source-kind, occurrence, retrieval and category/DTZ substitutions. `[M]`

## D2143 — outside-domain has no source in the declared graph

The outcome promises three distinct unavailable reasons. Provider exchange explicitly makes
`rules.endgame.tablebase_domain@1` the sole exact local fact for an out-of-domain position and says
it is emitted before provider admission. The promotion amendment names that fact, then omits it
from both literal derivation alternatives; each alternative instead requires a successful
recorded/live tablebase result. `[V]`

An implementation can currently produce `outside_tablebase_domain` only by privately recounting
the FEN, accepting an undeclared fourth input, or copying a reason without evidence. All three
contradict the claimed source graph. Specify a closed input/result algebra for successful source,
provider failure, local domain refusal and missing geometry. The exact local-domain evidence must
be retained wherever that reason is emitted, and substitution with provider failure must fail.
`[M]`

## Re-entry criteria

1. Exact pawn-contact sealing rejects both unsealed and sealed-false payloads.
2. Geometry requires the exact sealed `rules.pawn.reading.contacts@1` producer/id/version and
   retains the original declared item as its derivation input.
3. The outcome publishes exact discriminated payload/result/source types and total recorded/live
   normalization without dropping occurrence or acquisition identity.
4. The literal graph and invocation algebra ground all three abstention reasons, including the
   local domain fact, with crossed-reason/source negatives.
5. The updated author contract starts red on all three failures, passes after repair, and receives
   another independent review before either held projection lands.

Executable reproduction: `make semantic-collectors-promotion-fresh-review` (3/3).
