# 1.0 progress tracking

The 1.0 roadmap distinguishes strict release gates from incremental delivery.

- `planning/roadmap-1.0.json` owns capabilities, eight completion dimensions, dependency
  milestones and each milestone's latest evidence-backed checkpoint.
- `planning/work-items-1.0.json` owns persistent learner-facing work-item state.
- `rfc/README.md` owns RFC lifecycle state.
- `planning/roadmap-1.0.receipt.json` is derived from those sources and the live route/API
  inventories. Ordinary checks never rewrite it.

Run `make roadmap-progress` for a current status report. It first verifies the source-sealed
receipt, then prints milestone states and checkpoints, capability-dimension counts, RFC lifecycle
counts and persistent UX-work counts. A checkpoint can advance while its milestone remains active
or blocked; it never promotes a release gate by implication.

Every milestone checkpoint records a date, an `advanced`/`held`/`regressed` impact, a short current
fact and repository-relative evidence files. `make roadmap-check` rejects absent evidence,
malformed checkpoints and a stale receipt.

The staged process guard closes the implementation flow-back gap. A staged change containing both
non-test product code and an active RFC body must also stage the roadmap and regenerated receipt.
At least one milestone checkpoint must change, and its evidence must name every staged RFC body.
Only staged bytes are inspected, so another worker's dirty files cannot trigger or satisfy it.

Use `make roadmap-receipt` only after intentionally changing a joined source. Use
`make verify-governance` to exercise the complete governance tier, including negative fixtures for
checkpoint shape, receipt drift and staged-flow-back refusal.
