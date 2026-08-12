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

## 2026-08-12 (codex) — implementation

- `GET /packs/:id` now returns the RFC's browser-safe projection. All authored
  prose with no consumer is absent, nested spine annotations are stripped, and
  checkpoints contain only ID, label, and executable actions. `GET /packs`
  remains byte-identical.
- The response header and new runs remain pinned to the digest of the complete
  stored document. No reveal endpoint, scope parameter, or 425 behavior was
  added; authored prose remains unavailable until a per-scope reveal contract
  exists.
- Closed checkpoint actions in shared pack validation to
  `compare_branches`; `[]` is the explicit no-action encoding. Unknown values
  fail with their JSON Pointer, offending value, and allowed set.
- Migrated only the living fixtures: the Najdorf fixture dropped
  `offer_outcome_transition`; Pack A maps its two intended comparisons to
  `compare_branches` and its `break-arrived` checkpoint to `[]`. This changes
  both complete-document digests. Existing runs pinned to the previous fixture
  digests become pack-blind; accepted because this remains a fixture/draft-only
  repository with no published content.
- Deliberately not built: any authored-prose reveal or renderer, per-scope
  feedback state, a new status mapping, new authored fields, or a schema `$id`
  bump. Those are outside this stop-shipping correction.
- Verification: both migrated files pass the real `pack-check` command;
  `ENGINES_REQUIRED=1 make verify` is green at 165 tests; Playwright is green
  with the unchanged full walkthrough and the authored-note absence assertion.

## 2026-08-12 (claude, review of §1–§3)

- Verified adversarially against a **running server**, not only unit tests:
  started the app in mock mode, fetched `/packs/:id`, and inspected the real
  response body. Result: zero authored fields present — no `deviations`,
  `feedbackClaims`, `planClasses`, `concepts`, no `spine[].annotations`, no
  `checkpoints[].trigger`. Delivered keys are exactly the RFC's Included list.
  **The contamination hole Pack A found is closed at the wire, confirmed by
  observation rather than by assertion.**
- 165 tests green; browser walkthrough + projection-leak test green; both
  fixtures pass the real `pack-check` with the corrected action vocabulary
  (`[]` for no-action, `compare_branches` otherwise).
- Codex correctly declined to archive the RFC before review — noted, since
  premature archival would have skipped this step.
- **§1–§3 APPROVED; all acceptance criteria met.** Completion protocol
  green-lit.

## 2026-08-12 (codex) — completion protocol

- Chose to fold the canonical behavior into the existing subsystem docs rather
  than create a separate page: the browser-safe pack projection is part of the
  drill-client HTTP contract, while executable checkpoint-action validation is
  part of the drill-pack format's authoring contract. A standalone document
  would split two narrow amendments away from the systems that own them.
- Updated the canonical-doc index, set the RFC to implemented, and archived
  both RFC and planning job together.
- Post-move verification: `ENGINES_REQUIRED=1 make verify` passed with 165
  tests; `make test-browser` passed the two default browser cases with the Maia
  latency case correctly remaining integration-only.
