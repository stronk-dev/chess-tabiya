# Assistance shared-resource population plan

## State

Author-repaired 2026-09-01 after the sixth fresh return. The RFC now depends on the generic shared-
resource engine, adopts the complete live config/workflow/permission authorities and introduces
separate absent permission-operation and exchange contracts. No implementation is authorized
before the generic engine lands and this population survives fresh review.

## Order

1. ✅ Reconcile C9 with the generic catalogue; C9 is removed.
2. ✅ Replace hand-written workflow/permission deltas with complete projection-derived transitions.
3. ✅ Split member vocabulary from versioned permission-operation semantics.
4. ✅ Make exchange one atomic canonical resource and add honest adoption for live roots.
5. WAIT: fresh independent review after `shared-resource-register-bootstrap` acceptance.
6. Implement five catalogue/register entries only; change no product bytes.
7. Run normal full verification and archive with ledger/log closeout.
8. Only then amend/review product RFCs for config v5, workflow v2, permission-contract v1 and
   exchange v1 claims.

## Boundary

Process descriptor/register bytes only. Runtime assistance, presets, browser preference, UX,
schema, content and protected design are excluded.
