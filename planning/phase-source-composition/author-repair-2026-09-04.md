# Phase source composition — bounded author repair

- **Date:** 2026-09-04
- **Input:** fresh independent return [[D2636]]–[[D2642]]
- **Status:** all seven defects author-repaired at contract tier; fresh independent review remains
- **Executable evidence:** `make phase-source-composition-author-repair` — baseline 8/8 plus repair 7/7

## Repair

- [[D2636]] renames the required namespace to `openingSources` and keeps a literal able-to-fail
  aggregate-root guard.
- [[D2637]] makes the composer derive paired opening results itself from the retained exact
  `run.record.position@1` occurrence. The catalogue's four-field key stays honestly source-local.
- [[D2638]] removes caller paths: the arc accepts `run + branchId` and invokes
  `recordedSemanticPath` itself.
- [[D2639]] deletes local domain recomputation and retains the provider exchange's exact success,
  local-domain and source-failure arms.
- [[D2640]] replaces the bare digest with a private sealed, pack/ledger-digest-matched full-FEN
  inventory and sole exact lookup resolver. Non-pack/invalid/unverified sources are not absence.
- [[D2641]] removes Inspector from the private-view handoffs. Presentation and module registration
  own any future component projection; the raw phase object never crosses the package boundary.
- [[D2642]] demotes the circular corpus comparison to reach telemetry and requires independent
  declared-result crossing controls for phase/endgame applicability.

## Boundary and next step

This is an RFC/harness repair only. No production runtime, server, provider, API, schema, content,
UX, archive or protected-design byte changed. Dependency acceptance and a genuinely fresh reviewer
must still validate that the proposed snapshot, source-specific opening join, provider arms and
downstream presentation boundary compose with their final exact types before acceptance.
