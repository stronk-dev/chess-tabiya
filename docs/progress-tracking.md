# 1.0 progress tracking

The 1.0 roadmap distinguishes strict release gates from incremental delivery.

- `planning/roadmap-1.0.json` owns capabilities, eight completion dimensions, dependency
  milestones and each milestone's latest evidence-backed checkpoint.
- `planning/work-items-1.0.json` owns persistent learner-facing work-item state.
- `planning/work-state.json` owns execution state for every generic ledger row: `untriaged`,
  `todo`, `doing`, `blocked`, `done`, or `refused`, with roadmap-derived owners and exact-row
  digests.
- `rfc/README.md` owns RFC lifecycle state.
- `planning/roadmap-1.0.receipt.json` is derived from those sources and the live route/API
  inventories. Ordinary checks never rewrite it.

Run `make roadmap-progress` for a current status report. It first verifies the source-sealed
receipt, then prints milestone states and checkpoints, capability-dimension counts, product-RFC
lifecycle counts, the complete six-state ledger execution census, and persistent UX-work counts.
RFC-0000 is a process constitution rather than a product RFC and is excluded through the roadmap's
set-equal assignment. A checkpoint can advance while its milestone remains active or blocked; it
never promotes a release gate by implication.

Every milestone checkpoint records a date, an `advanced`/`held`/`regressed` impact, a short
evidence-backed fact and repository-relative evidence files. Mutable live counts belong in the
derived report, not checkpoint prose. `make roadmap-check` rejects absent evidence, malformed
checkpoints and a stale receipt, including any change to `planning/work-state.json`.

The staged process guard closes the implementation flow-back gap. A staged change containing both
non-test product code and an active RFC body must also stage the roadmap and regenerated receipt.
At least one milestone checkpoint must change, and its evidence must name every staged RFC body.
Only staged bytes are inspected, so another worker's dirty files cannot trigger or satisfy it.

Use `make roadmap-receipt` only after intentionally changing a joined source. Use
`make verify-governance` to exercise the complete governance tier, including negative fixtures for
checkpoint shape, receipt drift and staged-flow-back refusal.

Run `make work-state` for the assignment census. It always prints the complete ledger denominator,
state counts, per-owner live counts, weak closeout evidence, source-row refusals, historical
live-UX→terminal references, and the untriaged ratio. New ledger rows enter as `untriaged`; use
`node tools/work-state.mjs --sync --set=D1,D2 --state=todo --owner=<lane>` to add and classify a
batch atomically in the same change. Existing rows may use a single `--set=D…` transition. The
untriaged ceiling only falls, so a later census cannot erase unfinished
classification by rebasing its baseline.
