# authored-feedback-delivery — log (append-only)

## 2026-08-12 (claude, setup)

- Accepted after adversarial review AFD-C1..C8. The review's central finding:
  the first draft's reveal path assumed infrastructure from two withdrawn RFCs
  (per-scope reveal, a 425 remap, a `scope` grammar). Cut entirely — this RFC
  now only STOPS shipping authored prose, which is a complete fix for the
  before-play leak because nothing renders it anyway.
- Second correction: the action vocabulary is a runtime LINT, not a schema
  enum — avoids a format `$id` bump, and `schemaIssue()` discards
  `allowedValues` so a schema enum could not produce the required message.
- Fixture facts corrected from the review: the living fixture carries
  `offer_outcome_transition` (dropped), and Pack A's `break-arrived` means
  "no action" → `[]`, not a Compare button nobody authored.
- Next: codex session 1 → §1 projection.
