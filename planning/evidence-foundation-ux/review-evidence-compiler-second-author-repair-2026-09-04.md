# Review evidence compiler — second author repair

- **Date:** 2026-09-04
- **Input:** fresh independent return [[D2631]]–[[D2635]]
- **Status:** author-repaired; another genuinely fresh independent review is required
- **Executable contract:** `make review-evidence-second-author-repair` — retained original author
  controls 6/6 plus second-repair controls 5/5
- **Boundary:** RFC, module execution contract, disposable author model, maintained Make target and
  planning/register records; no production runtime, server, provider, API, schema, content or UX
  implementation

## Outcome

The repaired RFC now specifies one end-to-end authority path instead of five adjacent conventions:

```text
recorded run + stored import authority
  → ReviewRecordedPrefixReceipt (head, prefix, side, outcome)
  → registry-derived sealed source results
  → aggregate-sealed ReviewEvidencePacket
  → sealed PresentedEvidenceItem components
  → closed Review and narrower public presentation receipts
```

The exact `ReviewEvidenceInput`, generated source union, packet constructor and aggregate assertion
replace `DeclaredEvidence<unknown>[]` as the callable boundary. The source invocation population is
derived from the subject and adapter registry, so omitting an abstention cannot make a source look
quiet.

Node state and prefix aggregation are now different types. One total fold accounts for every node,
and independent progress/degradation fields can truthfully say “one source failed while another is
still running.” Raw Review sentence/source-label arrays are deleted from the contract; Story title,
moments and public share all project the same evidence-presentation receipts.

Retry exhaustion now has one bounded application-lifetime owner. A slot is reserved before provider
work, branch coordinators may churn without deleting terminal history, and a full history refuses an
unseen request as `attempt_history_capacity`. The author model caught and corrected an initial
post-call reservation error before this receipt was written.

## Remaining gate

This is positive author evidence, not acceptance. A fresh reviewer must attack source-plan set
equality, prefix/import authority, aggregate seal and fold, component ownership/public projection,
and attempt-history concurrency/capacity semantics. Implementation remains unauthorized until that
review passes and the recorded-path/evidence-presentation dependencies land.
