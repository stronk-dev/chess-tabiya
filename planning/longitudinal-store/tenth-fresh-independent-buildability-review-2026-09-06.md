# Longitudinal store — tenth fresh independent buildability review

**Date:** 2026-09-06

**Verdict:** **returned** on [[D2994]]–[[D3001]]

**Authority tested:** `planning/longitudinal-store/ninth-author-repair-2026-09-05.md` and
`tools/d2779-longitudinal-ninth-author-repair/contract.ts`

## What the executable review establishes

`make longitudinal-store-tenth-fresh-review` retains every predecessor target, runs 8/8 new
able-to-fail counterexamples and passes strict TypeScript. The ninth repair has useful durable
source, parser and claim shapes, but it does not yet establish the real storage-mutation or worker
lifecycle authority required by the RFC.

1. **[[D2994]] — receipts without mutations.** Every one of the eleven named source-mutation
   operations leaves source and job bytes unchanged and only appends a receipt label. The model
   therefore cannot prove that the real run, owner, journal or account mutation and job invalidation
   commit or roll back together.
2. **[[D2995]] — duplicate work is destructive.** Re-requesting an identical subject resets a
   healthy live claim and increments its generation. An idempotent wakeup becomes cancellation.
3. **[[D2996]] — source cuts can regress.** Invalidation accepts a caller-selected cut, so a job
   already requested through event 2 can be moved backward to event 1. The owning store does not
   derive a monotone current head inside the transaction.
4. **[[D2997]] — the parser admits impossible lifecycle states.** Pending work may retain completed
   progress, `snapshot_invalid` may retry at attempt zero, and derivation failure may quarantine at
   attempt zero. The 3/5 budgets and snapshot-invalid terminal rule are not encoded.
5. **[[D2998]] — SQL and parser disagree.** SQLite permits partial claim tuples outside `running`,
   and `claimJob(..., "")` commits a row that its own reader rejects. Validation must happen before
   mutation and DDL must mirror the parser's exact union.
6. **[[D2999]] — no executable retry/reclaim worker.** The scheduler claims only `pending`; due
   retries and expired leases both reject. Renew, fail and publish transitions are absent, so stale
   writer fencing is not exercised through a complete lifecycle.
7. **[[D3000]] — legacy provenance is reversed.** Journal-less pre-migration legacy is rejected,
   while journal-present legacy passes. The required journal × structure disposition matrix is not
   represented faithfully.
8. **[[D3001]] — source identity changed without authority.** The repair replaces the normative V4
   type and digest domain with V5 without a revision claim, compatibility rule or migration.

## Required author repair

The next bounded repair must:

- compose all eleven actual storage mutations and atomic watermark/invalidation effects;
- make identical job requests idempotent and response-loss safe;
- derive the current source head internally and enforce monotonicity under concurrent appends;
- encode one exact parser + DDL + operation-input lifecycle union, including failure budgets;
- claim pending, due retry and expired running work and implement renew/fail/publish CAS operations;
- close new-private, active-shared and pre-migration-legacy provenance fixtures; and
- preserve V4 identity unless an explicit version/migration amendment authorizes otherwise.

Another genuinely fresh independent review is required after that repair. No production migration,
storage method, worker, reader, API, client or learner-facing surface is authorized by this return.

## Receipt

- `make longitudinal-store-tenth-fresh-review`: complete predecessor chain green; 8/8 new tests;
  strict TypeScript green.
- Executable controls: `tools/d2994-longitudinal-tenth-fresh-review/`.
- Protected design and `archive/` were not edited.
