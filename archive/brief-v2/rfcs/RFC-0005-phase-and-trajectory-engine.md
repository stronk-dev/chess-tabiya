# RFC-0005 — Phase and Trajectory Engine

## Status

Proposed.

## Decision

Do not infer phase solely from move number. Packs declare semantic boundaries and transitions; the runtime supplements them with deterministic phase features.

## Transition triggers

- pack checkpoint;
- move-history node;
- pawn-structure signature;
- material threshold;
- queen exchange;
- tablebase eligibility;
- objective event;
- author-approved related-position jump.

## Trajectory rules

- every jump records provenance and rationale;
- organic and guided trajectories are distinct modes;
- later content is conditional on the branch actually taken;
- users may stop after any phase;
- no random endgame appended for session symmetry.
