# Tempo vocabulary implementation

Status: implementing

## Sequence

- [x] Reconcile the post-review owner ruling with the cross-reviewed specification.
- [x] Replace point-pair timing triggers with authored timing-window ledgers in pack schema 0.17.
- [x] Implement the pure, branch-local seven-verdict projection and compiled trigger seam.
- [x] Wire checkpoints, objective transitions, evidence references, capabilities, validation, and client sentences.
- [x] Update canonical docs and lifecycle records, then archive.
- [x] Run both final gates and commit before pulling the next queue item.

## Constraints

- No run-schema change and no storage migration.
- `outpaced` is authored opt-in and unauthored failure-by-default; no automatic Just Play detector is invented in this RFC.
- Timing-window prose stays out of the pre-play public pack projection.
- Existing content digests do not move; only the living schema example changes.
