# Defect Batch 2 implementation log

Append-only.

## 2026-08-14 — Codex implementation review

Approved after one blocking correction. The proposed event-authoritative segment projection
would have trusted arbitrary node and branch metadata on a public `appendEvents` input, allowing
a forged `segment.completed` to widen `segment_end` authored-feedback scope. The RFC now requires
exact checkpoint-event correspondence, ordering, and adjacency while preserving genuine
pre-guard zero-length segment events. Git archaeology confirms the pre-guard producer shape;
D22 is latent against the committed corpus, and D23/D24/D27 are genuinely stale ledger rows.
