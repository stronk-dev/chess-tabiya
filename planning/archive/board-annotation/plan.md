# Board annotation implementation plan

1. Add the `run_marks` sibling-table persistence and principal-scoped routes.
2. Export the requester's marks through the existing PGN tree and project relayed marks through live sessions.
3. Compose learner drawing in `DrillScreen` with parent-owned state and read-only live rendering.
4. Pin the isolation, authorization, scope, export, relay, bounds, deletion, and migration contracts.
5. Reconcile canonical docs, registers, ledger, and exploration log; run both gates.
