# Defect Batch 2 implementation log

Append-only.

## 2026-08-14 — Codex implementation review

Approved after one blocking correction. The proposed event-authoritative segment projection
would have trusted arbitrary node and branch metadata on a public `appendEvents` input, allowing
a forged `segment.completed` to widen `segment_end` authored-feedback scope. The RFC now requires
exact checkpoint-event correspondence, ordering, and adjacency while preserving genuine
pre-guard zero-length segment events. Git archaeology confirms the pre-guard producer shape;
D22 is latent against the committed corpus, and D23/D24/D27 are genuinely stale ledger rows.

## 2026-08-14 — D21 segment authority

`deriveSegments` now projects only validated `segment.completed` events. Both projection and
derivation require exact referenced checkpoints, strict sequence order, ending-checkpoint
adjacency, and matching branch/node metadata. Tests cover the original coincident-checkpoint
regression at runtime and orchestrator levels, a literal pre-guard zero-length event accepted by
the authored-feedback path, forged metadata refusal, and a fast-check 1:1 invariant. The focused
44-test slice and workspace typecheck passed.
