# Concept registry — fresh independent buildability review

- **Date:** 2026-09-04
- **Reviewed:** first author pass on [[D300]], [[D700]] and [[D2370]]
- **Gate:** `make concept-registry-fresh-review` — 6/6
- **Verdict:** **RETURNED on [[D2661]], [[D2662]], [[D2663]], [[D2664]], [[D2665]], [[D2666]]**

## What survives

One global concept identity is still the right foundation. Pack-local keys prevent cross-pack
progress, Campaign and Skills must not create competing taxonomies, and an identity-only authored
reference is the honest evidence boundary. The current corpus is not the problem: all 199 references
across 50 concept-bearing packs resolve to 168 IDs that already satisfy the proposed slug grammar.

## Return

The maintained author target is already red at HEAD. Two of seven assertions still require the old
`position behind longitudinal-store` order although the RFC and live register moved the migration
behind `pack-capability-contract`; the active RFC index nevertheless advertises 7/7. The target is
also absent from `verify-software`, so criterion 12 claims local/GitHub enforcement that does not
exist.

The lifecycle cannot preserve the exact history it promises. `ConceptRef` pins schema version 1 and
the source-byte digest, while labels may be renamed and IDs retired without a registry version or
immutable revision history. A label-only edit changes the digest; after it, old refs either name
bytes the installation cannot resolve or restore fails. Stored labels do not repair that ambiguity:
the RFC never decides whether current, occurrence-time or exported labels are authoritative.

The legacy migration proves syntax, not occurrence. `attempt_concepts` stores two mutually agreeing
pack-id strings but no pack digest/version or concept snapshot. Any globally valid ID can be placed
in a syntactically matching legacy row even if that pack never referenced it, and the six migration
steps accept it. Migration must join an exact historical run/pack occurrence authority or narrow its
claim to an explicitly unverified legacy attribution.

Finally, this foundation cannot close its own eight consumers or restore arm. Campaign catalogue and
Skills are draft successors, yet acceptance requires both to compile in the same first landing.
Portable account data explicitly excludes account import and the shipped lifecycle documents say no
restore endpoint exists, yet this RFC depends on it while requiring export/delete/restore. The
contract must separate live consumers from successor discharges and either own an exact bundle
restore extension or truthfully limit this RFC to export validation.

## Required repair

Repair and enroll the maintained target; define immutable registry revision/history and exact label
semantics; bind migration to historical occurrence authority; split current consumer closure from
future Campaign/Skills discharges; and resolve the restore dependency without pretending export is
restore. Then run another genuinely fresh review. The shared-resource bootstrap remains a separate
implementation dependency, and no registry or consumer production code is authorized by this
return.
