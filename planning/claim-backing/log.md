# Claim backing implementation log

- 2026-08-16: implementation started from the accepted round-2 RFC at pack schema 0.25.
  Review confirmed the seven open questions are deferred or non-blocking; corrected the stale
  RFC status line from `draft` to `implementing`.
- 2026-08-16: implemented pack schema 0.26, the closed feedback-claim shape, the principle-entry
  0.1 registry, claim-id and principle-reference validation, prose-preserving claim bindings,
  exhaustive assertion dispatch, segment attribution, and the explorer census attachment path.
  Migrated 82 `author_principle` claims across the committed corpus to 12 used official principle
  entries and refreshed every affected ledger digest without changing claim prose.
- 2026-08-16: the first real binding now backs `philidor-third-rank-hold/philidor-is-drawn` from
  its existing tablebase ledger while preserving the authored sentence byte-for-byte. The registry
  projects the binding as `author_attributed`; pure principle claims project as `self_declared`;
  claims never enter the voice packet. The remaining missing censuses, ledgerless packs, and five
  claims with no recorded instrument remain named content debt rather than being admitted by the
  new mechanism.
- 2026-08-16: concentration check after migration: 82 author-principle claims, 12 referenced
  entries, largest entry `result-not-moves` at 13 claims (15.9%), below the one-third escalation
  threshold; no duplicate counter-cases. No machine label was removed to make the migration pass.
