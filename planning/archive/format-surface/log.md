# Format Surface implementation log

- 2026-08-16: implementation review found two owner rulings recorded in their question
  bodies but contradicted by normative prose and acceptance criteria. Reconciled before
  code: `arrows` stays `unmeasured`; `FORMAT_DISPOSITIONS` stays out of `/capabilities`.
- 2026-08-16: schema 0.25 and all runtime/client consumers landed locally. The first full
  gate exposed three expected predecessor assertions: schema id 0.24, the former
  all-abstention lexicographic fallback, and direct refusal coverage. All were updated to
  the accepted contract. `ENGINES_REQUIRED=1 make verify` is green at 688 tests / 107 files.
- 2026-08-16: zero-retry browser gate passed 24 tests; the optional Maia latency test
  skipped. Canonical docs and ledger reconciled; ready to archive.
