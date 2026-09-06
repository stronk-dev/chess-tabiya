# Provider-health cut contract closeout

- **Date:** 2026-09-07
- **Ledger:** [[D3059]]
- **Gate:** `make provider-health-cut-contract`

The first full `make verify-awake` after the 2026-09-06 cut failed because canonical governance
still invoked the retired author-model chain. Its earliest contract read the live RFC and required
the exact run-schema lane and prose deliberately moved to `opponent-recovery-journey.md`; seven of
eight assertions failed. Passing it would require reversing the cut.

The historical targets remain on disk and runnable as dated exploration evidence. Canonical CI now
runs one four-test cut contract instead. It checks the surviving claim-free live-health surface, the
complete 1–22 criterion sequence with ledger ownership, the lane-0.26 successor handoff, and walks
the complete Make dependency graph to prove every historical provider-health review/repair target
is unreachable from `verify-governance`. That transitive check caught and removed the inherited
`bot-policy-fourth-author-repair` → seventh-round edge that a top-level string check missed.

This does not accept or implement provider health. It makes the repository gate agree with the
current RFC boundary so implementation—not a thirteenth shadow model—is the able-to-fail proof.
