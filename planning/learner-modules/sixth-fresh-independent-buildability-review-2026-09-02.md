# Module registration — sixth fresh independent buildability review

**Date:** 2026-09-02

**Reviewer:** Codex, independent of the sixth author repair

**Verdict:** **RETURNED on [[D2505]]–[[D2508]].** The requirements-only posture remains honest,
the move-quality `anyOf` repair survives, and the new window/endpoint vocabulary is materially
better than grain-only joins. The repaired requirements still disagree with two authoritative
producer semantics, name source ABIs their owners do not declare, and leave every executable pair
behind an ownerless null operation.

## D2505 — exact source operations still carry invented input/parser/seal ABIs

The five callables are closer to their owners, but a callable string is only one field of the
boundary. The recorded source names `RecordedSemanticPathRequest` and
`assertRecordedSemanticPathResult`; neither exists in `recorded-semantic-path.md`, whose input is an
inline object and whose result has no runtime assertion/seal. Review similarly declares no
`ReviewEvidenceInput` or `assertReviewEvidencePacket`. The module-owned catalogue snippet refers to
a receipt but declares no request, receipt, assertion or absence types matching the artifact.

The provider arm names a real assertion with the wrong invocation contract:
`assertProviderDelivery` requires `(operation, value)`, and the scheduler returns a typed delivery;
the operation-keyed `ProviderSourceFactory.make` is what creates declared evidence. The module
artifact names neither operation argument nor source factory while claiming
`DeclaredEvidence<ProviderEvidenceDelivery>` as its seal. Four source families therefore cannot be
implemented from the cited contract, and the fifth can strip or mis-key its provider identity.

## D2506 — eval delta was redefined from same-branch transition to branch comparison

The generated occurrence contract requires `branch_a` and `branch_b` endpoints. The shipped
`comparisonNarrative` loops within each branch's `trail` and subtracts consecutive
`trail[index - 1]` and `trail[index]` points, emitting `{delta, plyOffset}`. Those are different
subjects and different signs. If the product needs cross-branch evaluation difference, that needs
a separately named projection. This RFC must preserve the existing projection's same-branch
ordered pair rather than changing its meaning inside a consumer requirement.

## D2507 — the exact deflection window deletes the detector's check arm

`deflectionObservedOperands` admits defender displacement induced by either a bait capture or
check; it refuses only when both are false. The occurrence requirement has one alternative and
requires capture events at edges 2 and 3. It therefore makes the bait-capture arm mandatory and
cannot consume a valid check-induced deflection with a non-capturing reply. The repair needs literal
capture/check alternatives and a positive check-arm fixture joined to the real detector.

## D2508 — 205 null exact operations have no completion owner

All 205 binding rows have both `occurrenceRequirement.exactProjectionOperation` and
`timingRequirement.exactProjectionOperation` set to null. Keeping them blocked is honest; saying
“until the owner lands it” is not an execution plan when no owner is named. None of the RFC's seven
Discharges owns the 117 projection-operation resolutions or the 205 pair intersections, and the
four candidate view ids do not occur in their cited upstream RFC. A dependency can land without
changing one null.

Assign the exact operations as one set-equal successor/owner (or explicit upstream discharges) and
name its resolution receipt before this RFC can be accepted as buildable.

## Verification

- `make module-registration-sixth-author-repair` preserves the five positive author controls.
- `make module-registration-sixth-fresh-review` reproduces all four returned conditions against
  the generated artifacts, authoritative RFCs and shipped producer implementations.

No production, schema, API, content, UX, archive or protected-design byte changed. A seventh author
repair and another fresh independent review are required before acceptance or implementation.
