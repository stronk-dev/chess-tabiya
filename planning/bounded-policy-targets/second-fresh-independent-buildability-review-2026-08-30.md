# Bounded-policy targets — second fresh independent buildability review

- **Reviewed:** 2026-08-30
- **Input:** `rfc/bounded-policy-targets.md` after the D2105–D2111 author repair
- **Verdict:** **RETURN TO AUTHOR / NOT ACCEPTED**
- **Reproduction:** `make bounded-target-second-fresh-review` — 4/4 blocker arms
- **Production status:** untouched; no bounded-target collector, service or projection is authorized

The repaired source anchor, concrete service, whole-job bound, counting convention and return
quantifiers survive. Following the proposed public types through current F1 construction exposes
four remaining seams: one split authority, two missing protocol boundaries and one private public
API.

## B1 — the supplied manifest is not an evidence or identity authority ([[D2202]])

Both public construction paths accept an arbitrary `CompiledEvidenceManifest`. The current source
adapters mint through `EVIDENCE_PRODUCERS` and `declareEvidence`, neither of which receives that
manifest. The proposed request/result identities hash producer, projection and payload bytes but
not the manifest digest.

Two services can therefore claim different manifest authority while producing the same request and
result identities through constructors governed by the global catalogue. This is the same
authority split found independently in the shared candidate packet.

**Required repair:** fix one exact sealed product manifest by import, or bind a sealed supplied
manifest through every exact constructor, assertion and identity. Cross two valid manifests and a
forged digest. Coordinate the shared rule with `evidence-value-authority`.

## B2 — `ThreatPassAnchor` is referenced but never declared ([[D2203]])

The type appears in the public `threatEvidencePassAnchor()` return, `NamedMaterialTarget` payload,
WeakMap authority and prose, but no `interface` or `type` defines it. The prose sketch is not an
exact compile-time contract for canonical source/passed FEN or convention identity.

**Required repair:** publish the exact readonly literal type and one constructor/assertion relation.
Cross wrong convention, noncanonical source FEN, mismatched passed FEN and a separately rebuilt
equal object.

## B3 — the three new values have no exact construction authority ([[D2204]])

The normative image defines `NamedMaterialTargetEvidence`, `BoundedTargetImmediateEvidence` and
`BoundedTargetReturnEvidence` only as structural aliases over `DeclaredEvidence`. It promises
“exact bounded-target sealing adapters” in the implementation table but names no constructor,
assertion, private receipt or route. The current global `declareEvidence` seal proves only that the
generic function ran, not that this bounded operation derived the payload.

**Required repair:** name and type the exact compute/derive factories and their private input/result
receipt, register them as the sole value-authority routes, and make generic same-id declarations
fail. The semantic-validation dependency must validate these routes, not merely the projection ids.

## B4 — the public service protocol is not exported ([[D2205]])

`BoundedTargetBackgroundService` is exported, but its parameter and return types
`BoundedTargetBatchRequest` and `BoundedTargetBatchResult` are not. Their nested target, candidate,
return, identity and failure arms are likewise module-private while §7 promises “public
operation/types export.” Consumers cannot import the discriminated protocol they must handle
exhaustively.

**Required repair:** export one closed request/result family (including nested public arms) from the
runtime barrel and add exhaustive consumer/type negatives for omitted or crossed arms.

## Re-review order

1. Settle the shared sealed-manifest/value-authority rule.
2. Define `ThreatPassAnchor` and the three exact value constructors.
3. Export the complete operation protocol.
4. Invert these four arms, preserve all prior contracts and census results, run full verification,
   then request another fresh independent review.

No finding reopens the measured 4.10×/2.85× local value or the bounded-background execution
decision.
