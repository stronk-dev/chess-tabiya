# Shared-resource registers implementation plan

RFC: `rfc/shared-resource-registers.md` (accepted 2026-08-21)

1. Add the rule-7 declaration contract and template block.
2. Add the six two-part registers and declarations for every active RFC.
3. Implement one reusable parser and checks C1–C6 with positive and negative fixtures.
4. Wire `register-check` into ordinary verification and hand-check its derived next-free output.
5. Reconcile the owned ledger rows, append the implementation log, archive the RFC and this plan.

The implementation does not move any of the six registered resources. The pre-existing edits to
`rfc/measurement-records.md` are owned by another lane; only this RFC's declaration hunk may enter
the landing commit.
