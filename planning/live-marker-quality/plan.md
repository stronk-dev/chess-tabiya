# Live marker quality implementation plan

## Objective

Implement `rfc/live-marker-quality.md`: narrow the unasked marker surface to
measured firings, make marker rendering exhaustive, honour the human-split
permission on both client and server delivery paths, and preserve every
learner-requested or retrospective consumer.

## Ordered work

1. Add and test the runtime live-admission projection and exhaustive renderer.
2. Move the drill client's live path to that projection.
3. Close D68 on `/voice` and `/speech` with the existing assistance permission.
4. Pin non-live consumers, assistance defaults, and the live register.
5. Update canonical documentation and run both verification gates.
6. Leave owner-tier ledger dispositions for the owner/claude closeout pass.

## Acceptance

The RFC acceptance criteria as amended to absorb D68. No schema, migration,
event, stored preference, or refusal-code version changes.
